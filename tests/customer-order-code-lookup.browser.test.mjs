import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('customer lookup accepts either phone or code through the authenticated endpoint; public lookup still requires both', {
  skip: !base || !existsSync(executablePath), timeout: 25000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const code = 'DH-2026-TEST01', lookups = [], errors = [];
  const order = { id: '00000000-0000-4000-8000-000000000001', externalOrderSn: code, customerName: 'Khách kiểm thử', customerPhone: '0988888888', shippingAddress: 'Địa chỉ kiểm thử', subtotalAmount: 100000, discountAmount: 0, finalAmount: 121000, status: 'PENDING', statusLabel: 'Chờ Shop xác nhận', statusColor: '#B88E4F', timelineStep: 1, store: { id: 'shop', name: 'Shop kiểm thử', slug: 'qa-shop' }, items: [], reviews: [], createdAt: '2026-10-20T00:00:00Z', updatedAt: '2026-10-20T00:00:00Z' };
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'qa-code-only-no-server-access');
      localStorage.setItem('user', JSON.stringify({ id: 'qa-customer', fullName: 'Khách kiểm thử', role: 'CUSTOMER' }));
      localStorage.setItem('scanms_analytics_consent', 'denied');
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,OPTIONS,PUT' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        const user = { id: 'qa-customer', fullName: 'Khách kiểm thử', role: 'CUSTOMER' };
        let data = [];
        if (url.pathname === '/api/auth/me') data = user;
        if (url.pathname === '/api/customer/profile') data = { user, stats: {} };
        if (url.pathname === '/api/customer/cart') data = { items: [] };
        if (url.pathname === '/api/customer/orders') data = { orders: [], total: 0 };
        if (url.pathname.includes('/notifications/unread')) data = { unreadCount: 0, categoryUnreadCounts: {} };
        if (url.pathname === '/api/notifications') data = { notifications: [], total: 0 };
        if (url.pathname.startsWith('/api/orders/track')) {
          lookups.push({ path: url.pathname, params: Object.fromEntries(url.searchParams), auth: request.headers().authorization });
          const sn = url.searchParams.get('orderSn'), phone = url.searchParams.get('phone');
          const orders = (!sn || sn === code) && (!phone || phone === order.customerPhone) ? [order] : [];
          data = { totalFound: orders.length, orders };
        }
        return request.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(`${origin}/customer/orders`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button[aria-controls="customer-order-lookup"]');
    await page.click('button[aria-controls="customer-order-lookup"]');
    const input = '#customer-order-lookup input[aria-label="Mã đơn hàng cần tra cứu"]';
    const clearInput = async selector => {
      await page.focus(selector);
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
    };
    await page.waitForSelector(input);
    assert.equal(await page.$$eval('#customer-order-lookup input', els => els.length), 2);
    await page.click('#customer-order-lookup button[type=submit]');
    await page.waitForFunction(() => document.querySelector('#customer-order-lookup')?.textContent.includes('Vui lòng nhập mã đơn hàng'));
    assert.equal(lookups.length, 0);
    await page.type(input, ` # ${code.toLowerCase()} `);
    await page.focus(input);
    await page.keyboard.press('Enter');
    await page.waitForFunction(code => document.querySelector('#customer-order-lookup main')?.textContent.includes(code), {}, code);
    assert.deepEqual(lookups[0], { path: '/api/orders/track/mine', params: { orderSn: code }, auth: 'Bearer qa-code-only-no-server-access' });
    assert.equal(new URL(page.url()).pathname, '/customer/orders');
    assert.equal(new URL(page.url()).search, '', 'embedded lookup does not replace portal filters');
    await clearInput(input);
    const phoneInput = '#customer-order-lookup input[aria-label="Số điện thoại nhận hàng cần tra cứu"]';
    await page.type(phoneInput, '0988888888');
    await Promise.all([
      page.waitForResponse(response => response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/orders/track/mine' && new URL(response.url()).searchParams.get('phone') === '0988888888'),
      page.keyboard.press('Enter'),
    ]);
    assert.deepEqual(lookups.at(-1).params, { phone: '0988888888' });
    await page.waitForFunction(code => document.querySelector('#customer-order-lookup main')?.textContent.includes(code), {}, code);
    await page.type(input, code);
    await Promise.all([
      page.waitForResponse(response => { const url = new URL(response.url()); return response.request().method() === 'GET' && url.pathname === '/api/orders/track/mine' && url.searchParams.has('phone') && url.searchParams.has('orderSn'); }),
      page.keyboard.press('Enter'),
    ]);
    assert.deepEqual(lookups.at(-1).params, { phone: '0988888888', orderSn: code });
    await clearInput(input);
    await page.type(input, 'DH-2026-NOTMINE');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('#customer-order-lookup')?.textContent.includes('Không tìm thấy đơn hàng khớp với thông tin đã nhập trong tài khoản'));
    await page.setViewport({ width: 390, height: 844 });
    await page.$eval('#customer-order-lookup', el => el.scrollIntoView({ block: 'center' }));
    assert.ok(await page.$eval('#customer-order-lookup', el => el.scrollWidth <= el.clientWidth));
    await page.screenshot({ path: join(tmpdir(), 'scanms-customer-order-lookup.png') });

    const before = lookups.length;
    await page.goto(`${origin}/tracking`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[placeholder^="Số điện thoại"]');
    await page.type('input[aria-label="Mã đơn hàng cần tra cứu"]', code);
    await page.focus('input[aria-label="Mã đơn hàng cần tra cứu"]');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.body.innerText.includes('Vui lòng nhập đầy đủ số điện thoại'));
    assert.equal(lookups.length, before);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
