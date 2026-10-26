import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('store settlements refresh, paginate, expand details and recover from API errors without mixing stores', {
  skip: !base || !existsSync(executablePath), timeout: 60000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    await page.setViewport({ width: 1440, height: 1000 });
    const stores = [{ storeId: 'store-a', name: 'Sora Skin' }, { storeId: 'store-b', name: 'Second store' }];
    const user = { userId: 'owner', id: 'owner', fullName: 'Fixture owner', role: 'SHOP_MANAGER', roles: ['SHOP_OWNER'], status: 'ACTIVE', stores: stores.map(store => ({ ...store, id: store.storeId })) };
    await page.evaluateOnNewDocument(user => {
      localStorage.setItem('token', 'isolated-settlements-test');
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('scanms-active-workspace', 'shop');
    }, user);
    let mode = 'data';
    let slowStore = '';
    const calls = [];
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith('/api/')) {
        if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
        return request.continue();
      }
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      let result = [];
      if (url.pathname.endsWith('/users')) result = user;
      if (url.pathname.endsWith('/stores/mine')) result = stores;
      if (/\/stores\/store-[ab]$/.test(url.pathname)) result = stores.find(store => url.pathname.endsWith(store.storeId));
      if (url.pathname.endsWith('/finance/settlements')) {
        const storeId = url.searchParams.get('storeId');
        const requestedPage = Number(url.searchParams.get('page'));
        calls.push({ storeId, page: requestedPage });
        if (storeId === slowStore) await new Promise(resolve => setTimeout(resolve, 450));
        if (mode === 'error') return request.respond({ status: 503, headers, contentType: 'application/json', body: JSON.stringify({ message: 'Dịch vụ đang tạm gián đoạn.' }) });
        result = mode === 'malformed' ? {} : { items: mode === 'empty' || requestedPage > 1 ? [] : [{
          settlementId: `${storeId}-settlement-${requestedPage}`, sellerOrderId: `${storeId}-order-${requestedPage}`,
          storeId, netAmountVnd: 750000, status: 'PAID', walletTransactionId: 'ledger-reference',
          breakdown: { grossRevenueVnd: 800000, commissionVnd: 50000, platformFeeVnd: 0 }, paidAt: '2026-10-21T10:00:00Z',
        }], total: mode === 'empty' ? 0 : 21, size: 20, page: requestedPage };
      }
      return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
    });
    const waitRow = id => page.waitForFunction(id => document.querySelector('.settlement-table')?.textContent.includes(id), {}, id);
    const clickText = text => page.evaluate(text => [...document.querySelectorAll('.merchant-settlement button')].find(button => button.textContent.trim() === text).click(), text);
    await page.goto(`${base}/merchant/settlements`);
    await waitRow('store-a-settlement-0');
    assert.equal(await page.$eval('#settlement-store', select => select.selectedOptions[0].textContent), 'Sora Skin');
    assert.equal(await page.$eval('a[href="/merchant/payouts"]', link => link.getAttribute('aria-current')), 'page');
    await page.click('button[aria-label="Chi tiết đối soát store-a-settlement-0"]');
    await page.waitForSelector('.settlement-breakdown');
    const details = await page.$eval('.settlement-detail', el => el.textContent);
    assert.ok(details.includes('Hoa hồng KOL') && details.includes('50.000') && details.includes('ledger-reference'));
    assert.ok(!details.includes('commissionVnd'));
    await clickText('Sau'); await waitRow('store-a-settlement-1');
    assert.ok(new URL(page.url()).searchParams.get('page') === '2');
    assert.ok(await page.$eval('.settlement-pagination button:last-child', button => button.disabled));
    await page.reload(); await waitRow('store-a-settlement-1');
    await clickText('Trước'); await waitRow('store-a-settlement-0');
    const before = calls.length;
    await clickText('Cập nhật'); await waitRow('store-a-settlement-0');
    assert.ok(calls.length > before, 'refresh must call API for the same store/page');
    mode = 'error'; await clickText('Cập nhật'); await page.waitForSelector('.settlement-error');
    assert.ok((await page.$eval('[role="alert"]', el => el.textContent)).includes('Dịch vụ đang tạm gián đoạn.'));
    assert.equal(await page.$('.settlement-table'), null);
    mode = 'empty'; await clickText('Thử lại'); await page.waitForFunction(() => document.body.textContent.includes('Chưa có bản ghi đối soát'));
    assert.equal(await page.$('nav[aria-label="Phân trang đối soát"]'), null);
    await mkdir('.qa-artifacts', { recursive: true });
    await page.screenshot({ path: '.qa-artifacts/merchant-settlements-empty.png' });
    mode = 'malformed'; await clickText('Cập nhật'); await page.waitForSelector('.settlement-error');
    assert.ok((await page.$eval('[role="alert"]', el => el.textContent)).includes('Dữ liệu đối soát chưa hợp lệ'));
    mode = 'data'; await clickText('Thử lại'); await waitRow('store-a-settlement-0');
    await page.select('#settlement-store', 'store-b'); await waitRow('store-b-settlement-0');
    assert.equal(new URL(page.url()).searchParams.get('page'), null);
    slowStore = 'store-a';
    await page.select('#settlement-store', 'store-a');
    await page.waitForFunction(() => document.querySelector('.settlement-list[aria-busy="true"]'));
    await page.select('#settlement-store', 'store-b'); await waitRow('store-b-settlement-0');
    await new Promise(resolve => setTimeout(resolve, 600));
    assert.ok(!(await page.$eval('.settlement-table', el => el.textContent)).includes('store-a-settlement'));
    await page.screenshot({ path: '.qa-artifacts/merchant-settlements-desktop.png' });
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: '.qa-artifacts/merchant-settlements-mobile.png', fullPage: true });
    const mobile = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth, overflowing: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed').slice(0, 12).map(el => ({ tag: el.tagName, classes: el.className, right: el.getBoundingClientRect().right })) }));
    assert.ok(mobile.width <= mobile.viewport + 1, JSON.stringify(mobile));
    await page.goto(`${base}/merchant/settlements?storeId=store-b&page=999`);
    await waitRow('store-b-settlement-1');
    assert.equal(new URL(page.url()).searchParams.get('page'), '2');
    const previousCalls = calls.length;
    await page.goto(`${base}/merchant/settlements?storeId=not-owned`);
    await page.waitForSelector('.settlement-error');
    assert.equal(calls.length, previousCalls, 'unknown stores must not be queried');
    await page.select('#settlement-store', 'store-b'); await waitRow('store-b-settlement-0');
    assert.ok(calls.every(call => ['store-a', 'store-b'].includes(call.storeId)));
  } finally { await browser.close(); }
});
