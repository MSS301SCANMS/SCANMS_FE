import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH;
test('completed purchases appear in return history and open the simulated return shipment flow', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 40000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const errors = [], writes = [];
  const createdAt = new Date().toISOString();
  const orders = ['returned-purchase', 'regular-purchase'].map(orderId => ({ orderId, status: 'COMPLETED', finalAmount: 299000, createdAt }));
  const row = { returnRequestId: 'approved-return', orderId: orders[0].orderId, orderItemId: 'item-returned-purchase',
    status: 'APPROVED', quantity: 1, refundAmountVnd: 269000, reason: 'WRONG_ITEM', requestedAt: createdAt,
    storeName: 'Fixture shop', productSnapshot: { title: 'Purchased shirt' }, evidenceRefs: {}, simulationEnabled: true,
    decisionReason: 'Manager approved the return after reviewing both parties.', logistics: null };
  let page;
  try {
    page = await browser.newPage();
    page.setDefaultTimeout(10000);
    await page.setViewport({ width: 1440, height: 1000 });
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      localStorage.setItem('token', 'return-history-fixture-no-server-access');
      localStorage.setItem('user', JSON.stringify({ id: 'fixture-buyer', fullName: 'Fixture buyer', role: 'CUSTOMER', roles: ['USER'] }));
      localStorage.setItem('scanms-active-workspace', 'customer');
      localStorage.setItem('scanms_analytics_consent', 'denied');
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type,x-skip-cache',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
      const respond = (result, status = 200) => request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, result }) });
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketEnabled=()=>false;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname.endsWith('/users')) return respond({ userId: 'fixture-buyer', fullName: 'Fixture buyer', roles: ['USER'], status: 'ACTIVE' });
        if (url.pathname.endsWith('/orders/my-orders')) return respond(orders);
        const detailsId = url.pathname.match(/\/orders\/([^/]+)\/checkout-details$/)?.[1];
        if (detailsId) return respond({ ...orders.find(order => order.orderId === detailsId), shippingFee: 30000,
          sellerOrders: [{ sellerOrderId: 'seller-' + detailsId, status: 'COMPLETED', storeId: 'fixture-shop', deliveredAt: createdAt,
            totalsSnapshot: { storeName: 'Fixture shop' }, items: [{ orderItemId: 'item-' + detailsId, productId: 'fixture-shirt',
              quantity: 1, unitPrice: 269000, productSnapshot: { title: 'Purchased shirt' } }] }] });
        if (url.pathname.endsWith('/commerce/returns')) return respond([row]);
        if (url.pathname.endsWith('/commerce/returns/approved-return')) return respond(row);
        if (url.pathname.endsWith('/commerce/returns/approved-return/shipment')) {
          const body = JSON.parse(request.postData()); writes.push({ action: 'shipment', body });
          row.status = 'RETURNING'; row.logistics = { environment: 'TEST', carrier: 'LOCAL_SIMULATION', trackingCode: 'SIM-RETURN-fixture', status: 'BOOKED' };
          return respond(row);
        }
        if (url.pathname.endsWith('/commerce/returns/approved-return/simulation')) {
          const body = JSON.parse(request.postData()); writes.push({ action: 'simulation', body });
          row.logistics.status = body.status === 'picked' ? 'PICKED' : 'DELIVERED';
          row.logistics[body.status === 'picked' ? 'pickedUpAt' : 'deliveredAt'] = createdAt;
          return respond(row);
        }
        return respond([]);
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(origin + '/customer/orders', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('.customer-order-card').length === 2);
    await page.evaluate(() => [...document.querySelectorAll('[aria-label="Lọc trạng thái đơn mua"] button')].find(button => button.textContent.includes('Trả hàng/Hoàn tiền')).click());
    await page.waitForFunction(() => document.querySelectorAll('.customer-order-card').length === 1);
    assert.equal(await page.$eval('.customer-order-card', card => card.dataset.orderCode), 'returned-purchase');
    await page.click('.customer-order-summary');
    const section = '[aria-label="Hồ sơ trả hàng / hoàn tiền"]';
    await page.waitForSelector(section);
    assert.match(await page.$eval(section, element => element.innerText), /269\.000/);
    assert.doesNotMatch(await page.$eval(section, element => element.innerText), /299\.000/);
    assert.equal(await page.$eval(section + ' a', link => link.textContent.trim()), 'Gửi hàng trả về shop');
    await page.click(section + ' a');
    await page.waitForFunction(() => document.body.innerText.includes('Tạo chuyến trả hàng mô phỏng'));
    const clickText = text => page.evaluate(text => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text).click(), text);
    assert.equal(new URL(page.url()).pathname, '/customer/returns/approved-return');
    await clickText('Tạo chuyến trả hàng mô phỏng');
    await page.waitForFunction(() => document.body.innerText.includes('Mô phỏng lấy hàng trả'));
    await clickText('Mô phỏng lấy hàng trả');
    await page.waitForFunction(() => document.body.innerText.includes('Mô phỏng giao hàng trả đến shop'));
    await clickText('Mô phỏng giao hàng trả đến shop');
    await page.waitForFunction(() => document.body.innerText.includes('Hàng trả đã đến shop · chờ shop xác nhận nhận hàng'));
    assert.deepEqual(writes, [{ action: 'shipment', body: { environment: 'TEST' } },
      { action: 'simulation', body: { status: 'picked' } }, { action: 'simulation', body: { status: 'delivered' } }]);
    assert.deepEqual(errors, []);
  } catch (error) {
    console.error('Customer return fixture:', errors, await page?.evaluate(() => document.body.innerText.slice(-1600)));
    throw error;
  } finally { await browser.close(); }
});
