import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('Spring shop samples show an honest availability state and never call unsupported sample or shipping APIs', {
  skip: !base || !existsSync(executablePath), timeout: 35000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    const errors = [], unsupported = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-spring-sample-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'fixture-owner', role: 'SHOP_MANAGER', fullName: 'Chủ shop kiểm thử' }));
      localStorage.setItem('scanms-current-role', 'shop'); localStorage.setItem('scanms-active-workspace', 'shop');
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,OPTIONS' };
        if (request.method() === 'OPTIONS') return void request.respond({ status: 204, headers });
        if (/sample-requests|create-sample|sample-shipments/.test(url.pathname)) unsupported.push(url.pathname);
        if (request.method() !== 'GET' && !url.pathname.endsWith('/stores/my-store/presence')) writes.push(url.pathname);
        let result = [];
        if (url.pathname.endsWith('/users')) result = { userId: 'fixture-owner', roles: ['SHOP_OWNER'], fullName: 'Chủ shop kiểm thử', status: 'ACTIVE' };
        if (url.pathname.endsWith('/stores/mine')) result = [{ storeId: 'store-fixture', name: 'Gian hàng thử', approvalStatus: 'APPROVED' }];
        if (url.pathname.endsWith('/stores/store-fixture')) result = { storeId: 'store-fixture', name: 'Gian hàng thử', approvalStatus: 'APPROVED' };
        return void request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return void request.abort();
      void request.continue();
    });
    await page.goto(`${base}/merchant/orders?tab=samples`);
    const panel = '[aria-label="Trạng thái hàng mẫu KOL"]';
    await page.waitForSelector(panel);
    assert.equal(await page.$eval(panel, element => element.textContent.includes('Hàng mẫu KOL chưa được kích hoạt')), true);
    assert.equal(await page.evaluate(() => document.body.textContent.includes('Chưa tải được thông tin nhận hàng mới nhất')), false);
    assert.equal(await page.evaluate(() => document.body.textContent.includes('0 đ đã ghi nhận')), false);
    for (let i = 0; i < 3; i++) await page.evaluate(() => {
      window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.click(`${panel} a[href="/merchant/orders?tab=commercial"]`);
    await page.waitForSelector(panel, { hidden: true });
    assert.equal(new URL(page.url()).searchParams.get('tab'), 'commercial');
    assert.equal(await page.$eval('[aria-label="Chuyển chế độ đơn hàng"] button:first-child', button => button.getAttribute('aria-pressed')), 'true');
    await page.click('[aria-label="Chuyển chế độ đơn hàng"] button:nth-child(2)');
    await page.waitForSelector(panel);
    assert.equal(new URL(page.url()).searchParams.get('tab'), 'samples');
    for (const width of [1024, 768, 390]) {
      await page.setViewport({ width, height: 1000 });
      assert.equal(await page.$eval(panel, element => element.scrollWidth > element.clientWidth + 1), false);
    }
    await page.goto(`${base}/merchant/orders?view=samples`);
    await page.waitForSelector(panel);
    await page.click(`${panel} a[href="/merchant/collaborations"]`);
    await page.waitForFunction(() => location.pathname === '/merchant/collaborations');
    assert.deepEqual(unsupported, []); assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
