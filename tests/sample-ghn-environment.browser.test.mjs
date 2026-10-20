import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('both Shop pages create separate sandbox waybills and KOL tracks TEST without synchronizing real receipt',
  { skip: !base || !existsSync(executablePath), timeout: 45000 }, async () => {
    assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
    const browser = await puppeteer.launch({ executablePath, headless: true });
    const storeId = '00000000-0000-4000-8000-000000000010';
    const sample = { id: '00000000-0000-4000-8000-000000000020', status: 'SHIPPED', createdAt: new Date().toISOString(),
      collaboratorId: 'audit-kol', collaborator: { id: 'audit-kol', fullName: 'KOL test', email: 'audit@example.test' },
      recipientName: 'Test', recipientPhone: '0912345678', shippingAddress: '88 A, Phường A, Quận B, Tỉnh C',
      carrier: 'GHN', trackingNumber: 'LIVE-ORIGINAL', shippingCharges: [],
      product: { id: 'audit-product', title: 'Sample test', storeId, price: 250000 }, events: [], videoAssets: [] };
    const creates = [], tracking = [], syncs = [];
    let receipt = { receivedAt: null, deadlineAt: null, videoUrl: null, deliveryStatus: 'NOT_STARTED', simulationStartedAt: null };
    const clickText = (page, label) => page.evaluate(label => {
      const button = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === label);
      if (!button) throw Error(`Missing button ${label}`); button.click();
    }, label);
    async function open(route, role) {
      const page = await browser.newPage(); page.setDefaultTimeout(10000);
      await page.setViewport({ width: 1440, height: 1000 });
      await page.evaluateOnNewDocument(role => {
        localStorage.setItem('token', 'fixture-only-no-server');
        localStorage.setItem('user', JSON.stringify({ id: role === 'COLLABORATOR' ? 'audit-kol' : 'audit-shop', role, fullName: 'Test' }));
      }, role);
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/') || url.port === '3000') {
          const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': new URL(base).origin,
            'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache',
            'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
          if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
          let data = [];
          if (url.pathname.includes('/shipping/ghn/sandbox-sample/')) {
            if (url.pathname.endsWith('/start')) {
              receipt = { receivedAt: null, deadlineAt: null, videoUrl: null, deliveryStatus: 'WAITING_PICKUP', simulationStartedAt: new Date().toISOString() };
            }
            if (url.pathname.endsWith('/video')) receipt.videoUrl = JSON.parse(request.postData()).videoUrl;
            if (url.pathname.endsWith('/expire')) receipt.status = 'OVERDUE';
            data = { ...receipt, status: receipt.videoUrl ? 'VIDEO_SUBMITTED' : receipt.status || (receipt.receivedAt ? 'RECEIVED' : 'SHIPPED') };
          }
          if (url.pathname.includes('/shipping/ghn/create-sample/')) {
            creates.push(JSON.parse(request.postData()));
            sample.shippingCharges = [{ environment: 'TEST', trackingNumber: 'TEST-ISSUED', amount: 49000, status: 'TEST_ONLY', payer: 'SHOP', codAmount: 0 }];
            data = { trackingNumber: 'TEST-ISSUED', environment: 'TEST', testOnly: true };
          }
          if (['/api/sample-requests/shop', '/api/sample-requests/my'].includes(url.pathname)) data = [sample];
          if (url.pathname === '/api/store-collaborators/shop') data = { store: { id: storeId, name: 'Test Shop' }, members: [] };
          if (url.pathname === '/api/store-collaborators/my') data = [];
          if (url.pathname === '/api/stores') data = [{ id: storeId, name: 'Test Shop' }];
          if (url.pathname === '/api/stores/marketplace') data = [{ id: storeId, name: 'Test Shop', slug: 'test-shop' }];
          if (url.pathname === `/api/stores/${storeId}`) data = { id: storeId, name: 'Test Shop' };
          if (url.pathname === '/api/sample-requests/my/eligibility') data = { canRequest: true, isBlocked: false, channels: [] };
          if (url.pathname === '/api/kyc/profile') data = { kycStatus: 'VERIFIED' };
          if (url.pathname === '/api/products' || url.pathname === '/api/media') data = { items: [], pagination: { total: 0 } };
          if (url.pathname.includes('/shipping/ghn/track/')) {
            tracking.push({ code: url.pathname.split('/').pop(), environment: url.searchParams.get('environment') });
            data = { status: 'delivered', statusText: 'Giao hàng thành công', environment: url.searchParams.get('environment') || 'LIVE', isStale: false, timeline: [] };
          }
          if (url.pathname.includes('/shipping/ghn/sync-sample/')) syncs.push(url.pathname);
          return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
        }
        if (url.origin !== new URL(base).origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
        return request.continue();
      });
      await page.goto(base + route); return page;
    }
    try {
      for (const initial of ['APPROVED', 'SHIPPED']) {
      sample.status = initial;
      sample.trackingNumber = initial === 'SHIPPED' ? 'LIVE-ORIGINAL' : null;
      for (const route of ['/merchant/kol-hub?kol=audit-kol&tab=samples', '/merchant/orders?tab=samples']) {
        sample.shippingCharges = [];
        const page = await open(route, 'SHOP_MANAGER');
        const createLabel = initial === 'SHIPPED' ? 'Tạo mã GHN sandbox' : 'Tạo vận đơn GHN';
        await page.waitForFunction(label => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === label), {}, createLabel);
        await clickText(page, createLabel);
        await page.waitForSelector('form select');
        const chosen = await page.$eval('form', form => [...form.querySelectorAll('select')].find(select => [...select.options].some(option => option.value === 'TEST')).value);
        assert.equal(chosen, initial === 'SHIPPED' ? 'TEST' : 'LIVE');
        const pickerId = await page.$eval('form', form => [...form.querySelectorAll('select')].find(select => [...select.options].some(option => option.value === 'TEST')).id);
        await page.select(`form select[id="${pickerId}"]`, 'TEST');
        await page.$eval('form', form => form.requestSubmit());
        await page.waitForFunction(() => document.body.innerText.includes('TEST-ISSUED'));
        await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('Bắt đầu hành trình') && !b.disabled));
        await clickText(page, 'Bắt đầu hành trình');
        await page.waitForFunction(() => document.body.innerText.includes('Chờ lấy hàng'));
        receipt.deliveryStatus = 'IN_TRANSIT';
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.waitForFunction(() => document.body.innerText.includes('Đang vận chuyển'));
        receipt.deliveryStatus = 'DELIVERED';
        receipt.receivedAt = new Date(Date.now() - 2000).toISOString();
        receipt.deadlineAt = new Date(Date.parse(receipt.receivedAt) + 14 * 86400000).toISOString();
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.waitForFunction(() => document.body.innerText.includes('Đã nhận hàng · Chờ video'));
        await page.click('[aria-label="Vận đơn mẫu GHN sandbox"] button[aria-label="Xem hành trình"]');
        await page.click('[aria-label="Tiến độ giao hàng đơn mẫu"] details summary');
        await clickText(page, 'Chuyển quá hạn');
        await page.waitForFunction(() => document.body.innerText.includes('Quá hạn nộp video'));
        assert.equal(sample.trackingNumber, initial === 'SHIPPED' ? 'LIVE-ORIGINAL' : null);
        assert.equal(sample.status, initial);
        if (initial === 'APPROVED') {
          assert.match(await page.$eval('body', el => el.innerText), /Quá hạn nộp video/);
          assert.doesNotMatch(await page.$eval('body', el => el.innerText), /Đã duyệt · Chờ gửi/);
        }
        await page.close();
        receipt = { receivedAt: null, deadlineAt: null, videoUrl: null };
      }
      }
      assert.deepEqual(creates, Array.from({ length: 4 }, () => ({ environment: 'TEST' })));
      sample.status = 'APPROVED'; sample.trackingNumber = null;
      receipt = { simulationStartedAt: new Date(Date.now() - 120000).toISOString(), deliveryStatus: 'DELIVERED', receivedAt: new Date().toISOString(), deadlineAt: new Date(Date.now() + 14 * 86400000).toISOString(), videoUrl: null };
      const kol = await open(`/collaborator/collaboration?shop=${storeId}&tab=samples`, 'COLLABORATOR');
      await kol.waitForSelector('[aria-label="Vận đơn mẫu GHN sandbox"]').catch(async error => { throw new Error(`${error.message}: ${await kol.$eval('body', el => el.innerText.slice(-2500))}`); });
      await kol.waitForFunction(() => document.body.innerText.includes('Đã nhận hàng · Chờ video'));
      await clickText(kol, 'Theo dõi hành trình bưu kiện');
      await kol.waitForSelector('[aria-label="Tiến độ giao hàng đơn mẫu"] ol');
      assert.deepEqual(tracking, [], 'sample simulation does not query real GHN history');
      assert.deepEqual(syncs, []);
      await clickText(kol, 'Nộp video');
      await kol.waitForFunction(() => document.body.innerText.includes('Nộp Video Review Sản Phẩm'));
      await kol.type('input[type="url"]', 'https://www.youtube.com/watch?v=sandbox-review');
      await kol.$eval('input[type="url"]', el => el.closest('form').requestSubmit());
      await kol.waitForFunction(() => document.body.innerText.includes('Đã nộp video'));
    } finally { await browser.close(); }
  });
