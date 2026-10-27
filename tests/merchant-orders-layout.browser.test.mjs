import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('merchant orders fit the available width and keep actions accessible without horizontal scrolling', { skip: !base || !existsSync(executablePath), timeout: 35000 }, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const item = { productId: 'test-shirt', title: 'Áo thun cotton trắng cổ tròn Sora', sku: 'SORA-THUN-TRANG-M', imageUrl: '/assets/products/sora-white-tshirt.png', quantity: 1, unitPrice: 199000 };
  const orders = [0, 1, 2].map(i => ({ id: `seller-${i}`, externalOrderSn: `b65b89f1-3267-48fe-bc61-d05d79ae081${i}`, customerName: 'Đinh Tuấn', customerPhone: '0787664860', createdAt: '2026-10-26T15:04:00Z', status: i === 2 ? 'DELIVERED' : 'PENDING', paymentStatus: 'PAID', paymentMethod: 'WALLET', finalAmount: 230900, totalCommission: i === 1 ? 19900 : 0, items: [item], trackingNumber: i ? 'SIM-2d57650f-9d8f-4ff2-98a7-5cab95afcee3' : null, carrierName: 'LOCAL_SIMULATION', store: { id: 'test-shop', name: 'Sora Skin' } }));
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => { if (!e.message.includes('WebSocket')) errors.push(e.message); });
    await page.evaluateOnNewDocument(() => { localStorage.setItem('token', 'fixture'); localStorage.setItem('user', JSON.stringify({ id: 'shop-owner', role: 'SHOP_OWNER', fullName: 'Shop owner' })); localStorage.setItem('scanms-active-workspace', 'shop'); });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,authorization', 'Access-Control-Allow-Methods': 'GET,OPTIONS' };
        if (request.method() === 'OPTIONS') return void request.respond({ status: 204, headers });
        let result = [];
        if (url.pathname.endsWith('/seller-orders')) result = orders;
        if (url.pathname.endsWith('/users') || url.pathname.endsWith('/users/me')) result = { userId: 'shop-owner', fullName: 'Shop owner', roles: ['SHOP_OWNER'], status: 'ACTIVE' };
        if (url.pathname.includes('/stores/')) result = url.pathname.endsWith('/mine') ? [{ storeId: 'test-shop', name: 'Sora Skin', approvalStatus: 'APPROVED' }] : { storeId: 'test-shop', name: 'Sora Skin', approvalStatus: 'APPROVED' };
        return void request.respond({ headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      }
      if (url.origin !== origin && !['blob:', 'data:'].includes(url.protocol)) return void request.abort();
      void request.continue();
    });
    await page.setViewport({ width: 1920, height: 1000 });
    await page.goto(`${origin}/merchant/orders`);
    await page.waitForSelector('.merchant-orders-data tbody tr');
    mkdirSync('.qa-artifacts', { recursive: true });
    for (const width of [1920, 1440, 1100, 768, 390]) {
      await page.setViewport({ width, height: 1000 });
      await new Promise(r => setTimeout(r, 150));
      const bounds = await page.$eval('.merchant-orders-table', element => {
        const region = element.querySelector('.merchant-orders-scroll');
        return { width: element.clientWidth, overflow: region.scrollWidth - region.clientWidth, cells: [...element.querySelectorAll('tbody td')].every(td => td.scrollWidth <= td.clientWidth + 1) };
      });
      assert.ok(bounds.overflow <= 1, JSON.stringify({ width, ...bounds }));
      assert.ok(bounds.cells, JSON.stringify({ width, ...bounds }));
      await (await page.$('button[title="Thao tác khác"]')).click();
      await page.waitForSelector('.merchant-order-actions-menu');
      assert.ok(await page.$eval('.merchant-order-actions-menu', e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
      assert.match(await page.$eval('.merchant-order-actions-menu', e => e.textContent), /DH-B65B89F13267/);
      await page.screenshot({ path: `.qa-artifacts/merchant-orders-${width}.png`, fullPage: true });
      await (await page.$('button[title="Thao tác khác"]')).click();
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
