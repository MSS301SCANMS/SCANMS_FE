import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('Shop sample-only save preserves approved content; KOL refreshes sample policy and never substitutes demo products',
  { skip: !base || !existsSync(executablePath), timeout: 60000 }, async () => {
    assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
    const browser = await puppeteer.launch({ executablePath, headless: true });
    const storeId = '00000000-0000-4000-8000-000000000010';
    let product = { id: '00000000-0000-4000-8000-000000000030', storeId, title: 'Sản phẩm mẫu kiểm tra', sku: 'SAMPLE-AUDIT',
      categoryName: 'Thời trang & Phụ kiện', price: 250000, stockQuantity: 97, isActive: true, moderationStatus: 'APPROVED',
      imageUrl: '/assets/test-product.png', isAffiliateEnabled: true, sampleEnabled: false, sampleQuota: 2, sampleGrantedCount: 0, variants: [], mediaAssets: [] };
    let failProducts = false;
    let listReads = 0;
    const updates = [];
    async function pageFor(role) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 1100 });
      page.setDefaultTimeout(10000);
      await page.evaluateOnNewDocument(({ role, storeId }) => {
        localStorage.setItem('token', 'fixture-only-no-server-access');
        localStorage.setItem('user', JSON.stringify({ id: 'audit-user', role, fullName: 'Audit', email: 'audit@example.test' }));
        localStorage.setItem('current_store_id', storeId);
      }, { role, storeId });
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/') || url.port === '3000') {
          const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': new URL(base).origin,
            'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache',
            'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,OPTIONS' };
          if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
          let data = [];
          if (url.pathname === '/api/stores/marketplace') data = [{ id: storeId, name: 'Shop kiểm tra' }];
          if (url.pathname === '/api/products') {
            listReads++;
            if (failProducts) return request.respond({ status: 503, headers, body: JSON.stringify({ message: 'Fixture unavailable' }) });
            const visible = role === 'SHOP_MANAGER' || product.moderationStatus === 'APPROVED';
            data = { items: visible ? [product] : [], pagination: { total: visible ? 1 : 0 } };
          }
          if (url.pathname === '/api/products/' + product.id && request.method() === 'PUT') {
            const payload = JSON.parse(request.postData());
            updates.push(payload);
            const descriptionChanged = (payload.description || '') !== (product.description || '');
            product = { ...product, ...payload, moderationStatus: descriptionChanged ? 'DRAFT' : product.moderationStatus };
            data = { ...product, requiresModeration: descriptionChanged };
          }
          if (url.pathname.endsWith('/variants/sync')) data = { requiresModeration: false };
          if (url.pathname === '/api/kyc/profile') data = { kycStatus: 'VERIFIED' };
          if (url.pathname === '/api/sample-requests/my/eligibility') data = { canRequest: true, isBlocked: false };
          if (url.pathname === '/api/social-channels') data = [{ id: 'audit-channel', platformName: 'TIKTOK', channelName: 'Audit' }];
          return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
        }
        if (url.origin !== new URL(base).origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
        return request.continue();
      });
      return page;
    }
    async function clickText(page, text) {
      await page.waitForFunction(text => [...document.querySelectorAll('button')].some(el => el.textContent.trim() === text), {}, text);
      await page.evaluate(text => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === text).click(), text);
    }
    try {
      const shop = await pageFor('SHOP_MANAGER');
      for (const description of ['Áo mẫu', '📌 THÔNG SỐ KỸ THUẬT SẢN PHẨM:\n• Chất liệu: cotton\n\nÁo mẫu']) {
        product = { ...product, description, sampleEnabled: false, moderationStatus: 'APPROVED' };
        await shop.goto(`${base}/merchant/products`);
        await shop.waitForSelector('button[title="Chỉnh sửa sản phẩm"]');
        await shop.click('button[title="Chỉnh sửa sản phẩm"]');
        await shop.waitForFunction(() => [...document.querySelectorAll('label')].some(el => el.textContent.includes('Cho phép xin mẫu')));
        await shop.evaluate(() => [...document.querySelectorAll('label')].find(el => el.textContent.includes('Cho phép xin mẫu')).querySelector('input').click());
        const before = updates.length;
        await clickText(shop, 'Lưu thay đổi sản phẩm');
        await shop.waitForFunction(() => ![...document.querySelectorAll('button')].some(el => el.textContent.trim() === 'Lưu thay đổi sản phẩm')).catch(async error => {
          throw new Error(`${error.message}: ${await shop.evaluate(() => JSON.stringify({ invalid: [...document.querySelectorAll(':invalid')].map(el => ({ name: el.name, type: el.type, value: el.value, message: el.validationMessage })), alerts: document.body.innerText.slice(-1400) }))}`);
        });
        assert.equal(updates.length, before + 1);
        assert.equal(updates.at(-1).description, description, 'sample-only save must not prepend packaging or duplicate technical specification blocks');
        assert.equal(product.sampleEnabled, true);
        assert.equal(product.moderationStatus, 'APPROVED');
      }
      product.sampleEnabled = false;
      const kol = await pageFor('COLLABORATOR');
      await kol.goto(`${base}/collaborator/collaboration?shop=${storeId}&tab=products`);
      await kol.waitForFunction(() => document.body.innerText.includes('Chưa cấp mẫu'));
      product.sampleEnabled = true;
      const beforeRefresh = listReads;
      await kol.evaluate(() => window.dispatchEvent(new Event('focus')));
      await kol.waitForFunction(() => document.body.innerText.includes('Xin mẫu thử'));
      assert.ok(listReads > beforeRefresh);
      product.moderationStatus = 'DRAFT';
      await clickText(kol, 'Làm mới sản phẩm');
      await kol.waitForFunction(() => document.body.innerText.includes('Bật xin mẫu không tự duyệt sản phẩm'));
      assert.doesNotMatch(await kol.evaluate(() => document.body.innerText), /Kem Dưỡng Ẩm Phục Hồi|Serum Niacinamide/);
      failProducts = true;
      await clickText(kol, 'Làm mới sản phẩm');
      await kol.waitForFunction(() => document.body.innerText.includes('Chưa tải được sản phẩm.'));
      assert.doesNotMatch(await kol.evaluate(() => document.body.innerText), /Kem Dưỡng Ẩm Phục Hồi|Serum Niacinamide/);
    } finally { await browser.close(); }
  });
