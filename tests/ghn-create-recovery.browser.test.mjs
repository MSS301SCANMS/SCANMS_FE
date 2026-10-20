import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
for (const savedEnvironment of ['TEST', 'LIVE', null, 'REJECTED', 'SUCCESS']) test(savedEnvironment === 'SUCCESS' ? 'successful GHN creation replaces cached shipping action with tracking immediately' : savedEnvironment === 'REJECTED' ? 'LIVE GHN rejection stays visible and never becomes a successful manual shipment' : `merchant recovers saved GHN ${savedEnvironment || 'unknown'} environment without submitting twice`, {
  skip: !base || !existsSync(executablePath), timeout: 30000,
}, async () => {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  let creates = 0, verified = 0;
  const order = { id: '00000000-0000-4000-8000-000000000001', externalOrderSn: 'DH-QA-RECOVER',
    status: 'PENDING', customerName: 'Test Customer', customerPhone: '0900000000', shippingAddress: 'Test Address',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), subtotalAmount: 200000,
    discountAmount: 0, shippingFee: 25000, finalAmount: 225000, paymentMethod: 'COD', paymentStatus: 'UNPAID',
    trackingNumber: null, carrierName: null, totalCommission: 0, items: [], store: { id: 'qa-store', name: 'QA Shop' } };
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'fixture-only');
      localStorage.setItem('user', JSON.stringify({ id: 'qa-shop', role: 'SHOP_MANAGER', fullName: 'QA Shop' }));
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': new URL(base).origin,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let data = [];
        if (url.pathname.startsWith('/api/shipping/ghn/create-order/')) {
          creates++;
          assert.equal(JSON.parse(request.postData()).environment, savedEnvironment === 'REJECTED' ? 'LIVE' : 'TEST');
          if (savedEnvironment === 'REJECTED') return request.respond({ status: 400, headers, body: JSON.stringify({ message: 'GHN từ chối tạo vận đơn kiểm thử' }) });
          order.ghnEnvironment = savedEnvironment === 'SUCCESS' ? 'TEST' : savedEnvironment;
          order.status = 'SHIPPING'; order.trackingNumber = 'QA-SAVED'; order.carrierName = 'GHN';
          if (savedEnvironment === 'SUCCESS') return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data: { trackingNumber: 'QA-SAVED', environment: 'TEST' } }) });
          return request.respond({ status: 504, headers, body: JSON.stringify({ message: 'Response interrupted' }) });
        }
        if (url.pathname === '/api/orders/my-store') {
          if (creates) verified++;
          data = { items: [order], pagination: { total: 1, page: 1, limit: 10, totalPages: 1 } };
        }
        if (url.pathname === '/api/stores') data = [{ id: 'qa-store', name: 'QA Shop' }];
        if (url.pathname === '/api/products') data = { items: [], pagination: { total: 0 } };
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== new URL(base).origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(base + '/merchant/orders');
    await page.waitForSelector('button[title="Nhập mã vận đơn & giao hàng"]');
    await page.click('button[title="Nhập mã vận đơn & giao hàng"]');
    await page.waitForSelector('.shipping-dispatch-choice-test');
    await page.click(savedEnvironment === 'REJECTED' ? '.shipping-dispatch-choice-live' : '.shipping-dispatch-choice-test');
    if (savedEnvironment === 'REJECTED') {
      await page.waitForSelector('.shipping-dispatch-api [role="alert"]');
      const alert = await page.$eval('.shipping-dispatch-api [role="alert"]', el => el.innerText);
      assert.match(alert, /GHN thật: GHN từ chối tạo vận đơn kiểm thử/);
      assert.equal(await page.$eval('#dispatch-tracking', el => el.value), '');
      assert.equal(order.status, 'PENDING');
      assert.equal(creates, 1);
      return;
    }
    await page.waitForFunction(() => !document.querySelector('.shipping-dispatch-modal'));
    await page.waitForSelector('button[title="Tra cứu hành trình vận chuyển GHN"]');
    assert.equal(await page.$('button[title="Nhập mã vận đơn & giao hàng"]'), null);
    assert.match(await page.$eval('table', el => el.innerText), /QA-SAVED/);
    await page.waitForFunction(() => document.body.innerText.includes('QA-SAVED'));
    const content = await page.$eval('body', el => el.innerText);
      if (savedEnvironment === 'TEST' || savedEnvironment === 'SUCCESS') assert.match(content, /Đã tạo vận đơn GHN sandbox/);
    else {
      assert.doesNotMatch(content, /Hành trình mô phỏng đang chạy/);
      if (savedEnvironment === 'LIVE') assert.match(content, /GHN thật thành công/);
      else assert.match(content, /Mở hành trình để kiểm tra môi trường/);
    }
    assert.equal(creates, 1);
    assert.ok(verified > 0);
  } finally { await browser.close(); }
});
