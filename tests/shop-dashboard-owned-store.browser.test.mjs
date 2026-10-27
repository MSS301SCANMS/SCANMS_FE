import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('shop dashboard distinguishes role-only accounts, missing stores, malformed responses and service failures', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    const errors = [], storeReads = [], dataReads = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-shop-dashboard-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'fixture-owner', role: 'SHOP_MANAGER', fullName: 'Chủ shop kiểm thử', stores: [{ id: 'stale-store', name: 'Thông tin cũ' }] }));
      localStorage.setItem('current_store_id', 'stale-store');
      localStorage.setItem('scanms-current-role', 'shop'); localStorage.setItem('scanms-active-workspace', 'shop');
    });
    let mode = 'empty', application = null;
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let result = [];
        if (url.pathname.endsWith('/users')) result = { userId: 'fixture-owner', roles: ['SHOP_OWNER'], fullName: 'Chủ shop kiểm thử', status: 'ACTIVE' };
        if (url.pathname.endsWith('/store-applications')) result = application ? [application] : [];
        if (url.pathname.endsWith('/stores/mine')) {
          storeReads.push(url.pathname);
          await new Promise(resolve => setTimeout(resolve, 350));
          if (mode === 'error') return request.respond({ status: 503, headers, contentType: 'application/json', body: JSON.stringify({ message: 'Dịch vụ gian hàng chưa sẵn sàng.' }) });
          result = mode === 'malformed' ? {} : mode === 'owned' ? [{ storeId: 'real-store', name: 'Gian hàng thật', approvalStatus: 'APPROVED' }] : [];
        }
        if (url.pathname.endsWith('/stores/real-store')) result = { storeId: 'real-store', name: 'Gian hàng thật', approvalStatus: 'APPROVED' };
        if ((url.pathname.endsWith('/products') || url.pathname.endsWith('/seller-orders')) && url.searchParams.has('storeId')) dataReads.push({ path: url.pathname, storeId: url.searchParams.get('storeId') });
        return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    })(); });
    await page.goto(`${base}/merchant/dashboard`);
    await page.waitForSelector('[aria-label="Hồ sơ gian hàng của chủ shop"]');
    await page.waitForSelector('#shop-name');
    assert.equal(await page.$eval('h1', element => element.textContent), 'Hồ sơ gian hàng');
    assert.equal(await page.$('.shop-overview-metrics'), null, 'role alone must not imply a store or show fake empty store metrics');
    assert.deepEqual(dataReads, [], 'do not query products/orders with stale or missing store IDs');
    assert.ok(await page.$('a[href="/merchant/orders"]'), 'application form keeps the shop sidebar');
    assert.equal(await page.$('[aria-label="Chọn loại đối tác"]'), null, 'shop workflow does not offer unrelated customer upgrades');
    await page.goto(`${base}/customer/upgrade/shop`);
    await page.waitForFunction(() => location.pathname === '/merchant/store-application');
    await page.waitForSelector('#shop-name');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('user')).role), 'SHOP_MANAGER');
    assert.equal(await page.evaluate(() => localStorage.getItem('scanms-active-workspace')), 'shop');
    application = { applicationId: 'pending-application', applicantUserId: 'fixture-owner', proposedStoreName: 'Shop kiểm thử', status: 'PENDING', submittedAt: '2026-10-21T04:00:00Z' };
    await page.goto(`${base}/merchant/dashboard`);
    await page.waitForFunction(() => document.body.textContent.includes('Hồ sơ đang chờ xét duyệt'));
    assert.equal(new URL(page.url()).pathname, '/merchant/dashboard');
    assert.equal(await page.$('#shop-name'), null, 'pending application is shown automatically without a second signup');
    mkdirSync('.qa-artifacts/shop-application-workspace', { recursive: true });
    await page.screenshot({ path: '.qa-artifacts/shop-application-workspace/pending.png' });
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Bổ sung thông tin hồ sơ')).click());
    await page.waitForSelector('#shop-name');
    assert.equal(await page.$eval('#shop-name', element => element.value), 'Shop kiểm thử');
    assert.ok(await page.$('a[href="/merchant/orders"]'));
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('user')).role), 'SHOP_MANAGER');
    const refresh = () => page.evaluate(() => [...document.querySelectorAll('button')].find(button => /Kiểm tra gian hàng|Kiểm tra lại/.test(button.textContent)).click());
    mode = 'error'; await refresh();
    await page.waitForSelector('[role="alert"]');
    assert.equal(await page.$eval('h1', element => element.textContent), 'Chưa tải được thông tin gian hàng');
    assert.equal(await page.$eval('[role="alert"]', element => element.textContent), 'Dịch vụ gian hàng chưa sẵn sàng.');
    mode = 'malformed'; await refresh();
    await page.waitForSelector('[role="alert"]');
    assert.equal(await page.$eval('h1', element => element.textContent), 'Chưa tải được thông tin gian hàng');
    mode = 'owned'; const before = storeReads.length; await refresh();
    await page.waitForSelector('.shop-overview-metrics');
    assert.ok(storeReads.length > before, 'recheck bypasses cached empty store lists');
    assert.equal(await page.$('[aria-label="Thiết lập gian hàng"]'), null);
    assert.ok(dataReads.length >= 2);
    assert.ok(dataReads.every(read => read.storeId === 'real-store'), 'use server-owned store, never local stale IDs');
    mode = 'empty'; await page.goto(`${base}/merchant/dashboard`);
    await page.waitForFunction(() => document.body.textContent.includes('Hồ sơ đang chờ xét duyệt'));
    application.status = 'APPROVED'; mode = 'owned';
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Kiểm tra trạng thái')).click());
    await page.waitForFunction(() => document.body.textContent.includes('Gian hàng đã được xác minh'));
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Vào quản lý gian hàng')).click());
    await page.waitForSelector('.shop-overview-metrics');
    assert.equal(new URL(page.url()).pathname, '/merchant/dashboard');
    assert.equal(await page.evaluate(() => localStorage.getItem('scanms-active-workspace')), 'shop');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('user')).role), 'SHOP_MANAGER');
    await page.goto(`${base}/merchant/store-application`);
    await page.waitForSelector('.shop-application-status-card[data-state=verified]');
    assert.match(await page.$eval('.shop-application-store-summary h3', element => element.textContent), /Shop kiểm thử/);
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 868, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewport(viewport);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const bounds = await page.evaluate(() => {
        const card = document.querySelector('.shop-application-status-card'); const rect = card.getBoundingClientRect();
        const header = document.querySelector('.shop-application-page-header');
        return { x: rect.x, right: rect.right, height: rect.height, overflow: card.scrollWidth - card.clientWidth, headerHeight: header.getBoundingClientRect().height };
      });
      assert.ok(bounds.x >= 0 && bounds.right <= viewport.width + 1 && bounds.overflow <= 1, JSON.stringify(bounds));
      assert.ok(bounds.height <= (viewport.width < 640 ? 300 : 210) && bounds.headerHeight <= 100, JSON.stringify(bounds));
      await (await page.$('[aria-label="Hồ sơ gian hàng của chủ shop"]')).screenshot({ path: `.qa-artifacts/shop-application-workspace/verified-${viewport.width}.png` });
    }
    await page.evaluate(() => document.querySelector('.shop-application-primary').click());
    await page.waitForSelector('.shop-overview-metrics');
    assert.equal(new URL(page.url()).pathname, '/merchant/dashboard');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
