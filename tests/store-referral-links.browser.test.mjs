import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('shop links always finish loading, use owned-store API, filter and paginate without stale responses', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 1000 });
    const errors = [], requests = [], storeLinkReads = [];
    let mode = 'no-store';
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-store-links-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'fixture-owner', role: 'SHOP_MANAGER', stores: [{ id: 'stale-store' }] }));
      localStorage.setItem('current_store_id', 'stale-store');
      localStorage.setItem('scanms-active-workspace', 'shop'); localStorage.setItem('scanms-current-role', 'shop');
      const nativeTimeout = window.setTimeout.bind(window);
      window.setTimeout = (handler, delay, ...args) => nativeTimeout(handler, delay === 20000 && window.__fastReferralDeadline ? 200 : delay, ...args);
    });
    const links = Array.from({ length: 32 }, (_, i) => ({ referralLinkId: `link-${i}`, collaboratorId: `kol-${i}`, storeId: 'real-store', productId: 'real-product', productName: `Sản phẩm ${i}`, productPrice: 125000, token: `code-${String(i).padStart(2, '0')}`, channel: i % 2 ? 'TIKTOK' : 'YOUTUBE', status: i % 4 ? 'ACTIVE' : 'INACTIVE', createdAt: new Date(Date.UTC(2026, 9, 1, 0, i)).toISOString() }));
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        requests.push(url.pathname);
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        if (url.pathname.endsWith('/stores/my-store/presence')) return request.respond({ status: 200, headers, contentType: 'application/json', body: '{"code":200,"result":{}}' });
        assert.equal(request.method(), 'GET');
        let status = 200, result = [];
        if (url.pathname.endsWith('/users/me')) result = { userId: 'fixture-owner', roles: ['SHOP_OWNER'], status: 'ACTIVE' };
        if (url.pathname.endsWith('/stores/mine')) {
          status = mode === 'store-error' ? 503 : 200;
          result = mode === 'no-store' ? [] : [{ storeId: 'real-store', name: 'Gian hàng thật', approvalStatus: 'APPROVED' }];
        }
        if (url.pathname.endsWith('/stores/real-store')) result = { storeId: 'real-store', name: 'Gian hàng thật', approvalStatus: 'APPROVED' };
        if (url.pathname.includes('/referrals/store/')) {
          storeLinkReads.push(url.pathname); assert.equal(url.pathname, '/api/v1/referrals/store/real-store');
          status = mode === 'links-error' ? 503 : 200;
          result = mode === 'invalid' ? {} : ['rows', 'slow'].includes(mode) ? [...links, { ...links[0], referralLinkId: 'foreign-link', storeId: 'foreign-store' }] : [];
          if (mode === 'slow') await new Promise(resolve => setTimeout(resolve, 500));
        }
        return request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, result }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    })().catch(error => { errors.push(error.message); if (!request.isInterceptResolutionHandled()) void request.abort(); }); });
    await page.goto(`${base}/merchant/promotions?tab=referral-links`);
    const alert = '.promotions-links [role=alert]', loading = '.promotions-links [role=status]';
    const retry = () => page.click(`${alert} button`);
    const submit = () => page.click('.promotions-links button[type=submit]');
    await page.waitForSelector(alert);
    assert.match(await page.$eval(alert, element => element.textContent), /chưa được kích hoạt/);
    assert.equal(await page.$(loading), null); assert.equal(storeLinkReads.length, 0);
    mode = 'store-error'; await retry(); await page.waitForSelector(alert);
    assert.equal(await page.$(loading), null);
    mode = 'empty'; await retry();
    await page.waitForFunction(() => document.querySelector('.promotions-links')?.textContent.includes('Chưa có liên kết tiếp thị nào'));
    mode = 'invalid'; await submit(); await page.waitForSelector(alert);
    assert.equal(await page.$(loading), null);
    mode = 'rows'; await retry(); await page.waitForSelector('.promotions-links tbody tr');
    assert.equal((await page.$$('.promotions-links tbody tr')).length, 30);
    assert.match(await page.$eval('.promotions-links', element => element.textContent), /32 liên kết/);
    const beforeTyping = storeLinkReads.length;
    await page.type('.promotions-links input[type=text]', 'code-01');
    assert.equal(storeLinkReads.length, beforeTyping, 'typing waits for Apply rather than issuing requests on each key');
    await submit();
    await page.waitForFunction(() => document.querySelectorAll('.promotions-links tbody tr').length === 1);
    assert.match(await page.$eval('.promotions-links tbody', element => element.textContent), /code-01/);
    await page.click('button[title="Xóa bộ lọc"]');
    await page.waitForFunction(() => document.querySelectorAll('.promotions-links tbody tr').length === 30);
    await page.click('button[aria-label="Lọc trạng thái liên kết"]');
    await page.evaluate(() => [...document.querySelectorAll('[role=option]')].find(option => option.textContent.includes('Tạm ngừng')).click());
    await page.click('button[aria-label="Lọc kênh tiếp thị"]');
    await page.evaluate(() => [...document.querySelectorAll('[role=option]')].find(option => option.textContent.includes('YouTube')).click());
    await submit();
    await page.waitForFunction(() => document.querySelectorAll('.promotions-links tbody tr').length === 8);
    assert.ok((await page.$$eval('.promotions-links tbody tr', rows => rows.map(row => row.textContent))).every(text => text.includes('YOUTUBE') && text.includes('Tạm ngừng')));
    await page.click('button[title="Xóa bộ lọc"]');
    await page.waitForFunction(() => document.querySelectorAll('.promotions-links tbody tr').length === 30);
    await page.evaluate(() => [...document.querySelectorAll('.promotions-links button')].find(button => button.textContent === 'Trang sau').click());
    await page.waitForFunction(() => document.querySelectorAll('.promotions-links tbody tr').length === 2);
    assert.match(await page.$eval('.promotions-links', element => element.textContent), /Trang 2\/2/);
    mkdirSync('.qa-artifacts/store-referral-links', { recursive: true });
    await page.screenshot({ path: '.qa-artifacts/store-referral-links/list.png' });
    mode = 'links-error'; await submit(); await page.waitForSelector(alert);
    await page.evaluate(() => { window.__fastReferralDeadline = true; });
    mode = 'slow'; await retry(); await page.waitForSelector(alert);
    assert.match(await page.$eval(alert, element => element.textContent), /phản hồi chậm/);
    assert.equal(await page.$(loading), null);
    await page.evaluate(() => { window.__fastReferralDeadline = false; });
    mode = 'empty'; await retry();
    await page.waitForFunction(() => document.querySelector('.promotions-links')?.textContent.includes('Chưa có liên kết tiếp thị nào'));
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 650)));
    assert.equal(await page.$('.promotions-links tbody'), null, 'late timed-out response must not overwrite a newer empty result');
    assert.equal(requests.includes('/api/v1/collaborator/stores'), false);
    assert.equal(requests.includes('/api/v1/referrals'), false, 'shop list does not query the KOL personal list');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
