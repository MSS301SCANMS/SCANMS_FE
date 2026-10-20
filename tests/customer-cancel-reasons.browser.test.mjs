import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('customer cancellation supports preset and typed reasons, retries and prevents duplicate submissions', {
  skip: !base || !existsSync(executablePath), timeout: 30000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const user = { id: 'customer', fullName: 'Khách kiểm thử', role: 'CUSTOMER' };
  const orders = [1, 2].map(i => ({ id: `00000000-0000-4000-8000-00000000000${i}`, externalOrderSn: `DH-TEST-${i}`, status: 'PENDING', createdAt: '2026-10-20T02:00:00Z', updatedAt: '2026-10-20T02:00:00Z', customerName: user.fullName, customerPhone: '0900000000', shippingAddress: 'Địa chỉ kiểm thử', finalAmount: 121000, subtotalAmount: 100000, discountAmount: 0, shippingFee: 21000, rawPayload: {}, store: { id: 'shop', name: 'Shop kiểm thử' }, orderItems: [], productReviews: [] }));
  const writes = [], errors = [];
  let mode = 'fail', release;
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluateOnNewDocument(user => {
      localStorage.setItem('token', 'qa-cancel-no-server-access');
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('scanms_analytics_consent', 'denied');
    }, user);
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
        const respond = (data, status = 200) => request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify(data) });
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        const cancelId = url.pathname.match(/^\/api\/customer\/orders\/([^/]+)\/cancel$/)?.[1];
        if (cancelId) {
          writes.push({ id: cancelId, ...JSON.parse(request.postData()) });
          if (mode === 'fail') return respond({ message: 'Chưa thể hủy, vui lòng thử lại' }, 503);
          const finish = () => {
            const order = orders.find(order => order.id === cancelId);
            assert.ok(order);
            order.status = 'CANCELLED';
            return respond({ success: true, data: { order } });
          };
          if (mode === 'hold') { release = finish; return; }
          return finish();
        }
        let data = [];
        if (url.pathname === '/api/auth/me') data = user;
        if (url.pathname === '/api/customer/profile') data = { user, stats: {} };
        if (url.pathname === '/api/customer/orders') data = { orders, total: orders.length };
        if (url.pathname === '/api/customer/cart') data = { items: [] };
        if (url.pathname.includes('/notifications/unread')) data = { unreadCount: 0, categoryUnreadCounts: {} };
        if (url.pathname === '/api/notifications') data = { notifications: [], total: 0 };
        return respond({ success: true, data });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(`${origin}/customer/orders`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.customer-order-summary');
    const openCancel = async index => {
      await page.$$eval('.customer-order-summary', (summaries, index) => { const details = summaries[index].closest('details'); if (!details.open) summaries[index].click(); }, index);
      await page.evaluate(index => {
        const summary = document.querySelectorAll('.customer-order-summary')[index];
        [...summary.closest('details').querySelectorAll('button')].find(button => button.textContent.trim() === 'Hủy đơn').click();
      }, index);
      await page.waitForSelector('.customer-cancel-dialog');
    };
    await openCancel(0);
    assert.equal(await page.$eval('.customer-cancel-confirm', el => el.disabled), true);
    assert.equal(await page.$$eval('.customer-cancel-dialog input[type=radio]', els => els.length), 7);
    await page.click('input[value=OTHER]');
    await page.type('#customer-cancel-custom-reason', '   ');
    assert.equal(await page.$eval('.customer-cancel-confirm', el => el.disabled), true);
    await page.type('#customer-cancel-custom-reason', 'Nội dung nháp');
    await page.click('[data-cancel-keep]');
    assert.equal(writes.length, 0);
    await openCancel(0);
    assert.equal(await page.$$eval('.customer-cancel-dialog input:checked', els => els.length), 0);
    assert.equal(await page.$('#customer-cancel-custom-reason'), null);
    await page.click('input[value=ADDRESS]');
    await page.click('.customer-cancel-confirm');
    await page.waitForFunction(() => document.body.innerText.includes('Chưa thể hủy, vui lòng thử lại') && document.querySelector('.customer-cancel-dialog')?.getAttribute('aria-busy') === 'false');
    assert.equal(writes[0].reason, 'Tôi muốn thay đổi địa chỉ hoặc SĐT nhận hàng');
    assert.equal(await page.$eval('input[value=ADDRESS]', el => el.checked), true);
    await page.screenshot({ path: join(tmpdir(), 'scanms-customer-cancel-reasons-desktop.png') });

    mode = 'hold';
    await page.$eval('.customer-cancel-confirm', el => { el.click(); el.click(); });
    await page.waitForFunction(() => document.querySelector('.customer-cancel-dialog').getAttribute('aria-busy') === 'true');
    assert.equal(writes.length, 2, 'only one retry despite double clicking');
    await page.keyboard.press('Escape');
    assert.ok(await page.$('.customer-cancel-dialog'));
    assert.equal(await page.$eval('[data-cancel-keep]', el => el.disabled), true);
    await release();
    await page.waitForFunction(() => !document.querySelector('.customer-cancel-dialog'));
    await page.waitForFunction(() => document.querySelectorAll('.customer-order-summary')[0]?.textContent.includes('Đã hủy'));

    mode = 'success';
    await openCancel(1);
    assert.equal(await page.$eval('.customer-cancel-confirm', el => el.disabled), true);
    await page.click('input[value=OTHER]');
    await page.type('#customer-cancel-custom-reason', '  Tôi đặt nhầm quà tặng, muốn chọn lại.  ');
    await page.setViewport({ width: 390, height: 620 });
    await page.waitForFunction(() => {
      const r = document.querySelector('.customer-cancel-footer').getBoundingClientRect();
      return r.top >= 0 && r.bottom <= innerHeight;
    });
    await page.$eval('.customer-cancel-body', el => { el.scrollTop = el.scrollHeight; });
    assert.ok(await page.$eval('.customer-cancel-dialog', el => el.scrollWidth <= el.clientWidth));
    const customVisible = await page.$eval('#customer-cancel-custom-reason', el => { const r = el.getBoundingClientRect(), p = el.closest('.customer-cancel-body').getBoundingClientRect(); return r.top >= p.top && r.bottom <= p.bottom; });
    assert.equal(customVisible, true);
    await page.screenshot({ path: join(tmpdir(), 'scanms-customer-cancel-reasons-mobile.png') });
    await page.click('.customer-cancel-confirm');
    await page.waitForFunction(() => !document.querySelector('.customer-cancel-dialog'));
    assert.equal(writes[2].reason, 'Tôi đặt nhầm quà tặng, muốn chọn lại.');
    assert.equal(writes[2].id, orders[1].id);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
