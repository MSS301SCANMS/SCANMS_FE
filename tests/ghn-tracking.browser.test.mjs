import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const browserPath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('GHN tracking works in both screens, polls, shows driver contact and handles incomplete data without inventing milestones',
  { skip: !base || !existsSync(browserPath), timeout: 45000 }, async () => {
    assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
    const browser = await puppeteer.launch({ executablePath: browserPath, headless: true });
    const code = 'QA-GHN-ORDER';
    const id = '00000000-0000-4000-8000-000000000003';
    let stage = 'delivering', polls = 0, simulation = false;
    const simulationStates = ['ready_to_pick', 'picked', 'storing', 'delivering', 'delivered'];
    const labels = { ready_to_pick: 'Chờ lấy hàng', picked: 'Bưu tá đã lấy hàng tại kho Shop', storing: 'Nhập kho trung chuyển', delivering: 'Shipper đang đi giao', delivered: 'Giao hàng thành công' };
    const requestedEnvironments = [];
    const order = { id, externalOrderSn: 'QA-TRACKING', status: 'SHIPPING', createdAt: '2026-01-02T00:00:00Z',
      subtotalAmount: 200000, discountAmount: 0, finalAmount: 229001, shippingFee: 29001,
      customerName: 'Khách kiểm thử', customerPhone: '0900000000', shippingAddress: 'Địa chỉ kiểm thử',
      trackingNumber: code, carrierName: 'GHN', ghnEnvironment: 'TEST',
      rawPayload: { trackingNumber: code, ghnOrderCode: code, carrierName: 'GHN', ghnEnvironment: 'TEST' },
      statusLabel: 'Đang giao hàng', timelineStep: 2, orderItems: [], items: [],
      store: { id: 'qa-store', name: 'Shop kiểm thử', slug: 'qa-shop' }, productReviews: [] };
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 1000 });
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('token', 'test-token-with-no-server-access');
        localStorage.setItem('user', JSON.stringify({ id: 'qa-customer', fullName: 'Khách kiểm thử', role: 'CUSTOMER', email: 'qa@example.test' }));
        // Advance the polling clock only; the application still schedules 30s.
        const original = window.setTimeout.bind(window);
        window.setTimeout = (fn, ms, ...args) => original(fn, ms === 30000 ? 800 : ms, ...args);
      });
      await page.setRequestInterception(true);
      page.on('request', async request => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/') || url.port === '3000') {
          const headers = { 'Access-Control-Allow-Origin': new URL(base).origin, 'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Content-Type': 'application/json' };
          if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
          let data = {};
          if (url.pathname === '/api/orders/track') data = { orders: [order], totalFound: 1 };
          if (url.pathname === '/api/customer/orders') data = { orders: [order], total: 1 };
          if (url.pathname === '/api/customer/profile') data = { user: { id: 'qa-customer', fullName: 'Khách kiểm thử' }, stats: {} };
          if (url.pathname.includes('/shipping/ghn/track/')) {
            polls++;
            requestedEnvironments.push(url.searchParams.get('environment'));
            const status = !simulation && stage === 'delivering' && polls > 1 ? 'delivered' : stage;
            const states = simulation ? simulationStates.slice(0, simulationStates.indexOf(status) + 1) : status === 'ready_to_pick' ? [] : status === 'delivered' ? ['picked', 'storing', 'delivering', 'delivered'] : ['picked', 'storing', 'delivering'];
            data = { orderCode: code, status, statusText: status === 'delivered' ? 'Giao hàng thành công' : status === 'ready_to_pick' ? 'Chờ lấy hàng' : 'Shipper đang đi giao',
              environment: 'TEST', isStale: false, lastCheckedAt: '2026-01-02T03:00:00Z',
              shipperName: simulation ? ['delivering', 'delivered'].includes(status) ? 'Nguyễn Minh An' : null : status === 'ready_to_pick' ? null : 'Bưu tá kiểm thử',
              shipperPhone: simulation || status === 'ready_to_pick' ? null : '0900000000',
              ...(simulation ? { isSimulation: true, shipperPhoneDisplay: '09xx xxx xxx', shipperCanCall: false, statusText: labels[status] } : {}),
              timeline: states.map((status, i) => ({ status, title: labels[status], time: `2026-01-02T0${i + 1}:00:00Z` })) };
          }
          return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
        }
        if (url.origin !== new URL(base).origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
        return request.continue();
      });
      const section = 'section[aria-label="Hành trình GHN QA-GHN-ORDER"]';
      await page.goto(`${base}/tracking?phone=0900000000&sn=QA-TRACKING`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(`${section} a[href="tel:0900000000"]`);
      assert.match(await page.$eval(section, el => el.innerText), /Bưu tá kiểm thử/);
      assert.match(await page.$eval(section, el => el.innerText), /Shipper đang đi giao/);
      assert.match(await page.$eval(section, el => el.innerText), /Trạng thái bưu kiện/);
      assert.equal(requestedEnvironments[0], 'TEST', 'public tracking explicitly requests the order environment');
      await page.waitForFunction(sel => document.querySelector(sel)?.querySelectorAll('ol[aria-label="Lịch sử chi tiết"] li').length === 4, {}, section);
      const stopped = polls; await delay(1200); assert.equal(polls, stopped, 'terminal deliveries stop polling');

      stage = 'delivering'; polls = 0;
      await page.goto(`${base}/customer/orders?orderId=${id}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(`${section} a[href="tel:0900000000"]`);
      assert.match(await page.$eval(section, el => el.innerText), /Shipper đang đi giao/);
      assert.match(await page.$eval(section, el => el.innerText), /Trạng thái bưu kiện/);
      assert.equal(requestedEnvironments.at(-1), 'TEST', 'customer order details explicitly request the same environment');
      await page.screenshot({ path: join(tmpdir(), 'scanms-ghn-tracking-desktop.png'), fullPage: true });
      assert.ok(polls > 0, 'customer details call the same GHN endpoint');

      stage = 'ready_to_pick'; polls = 0;
      await page.setViewport({ width: 390, height: 844 });
      await page.goto(`${base}/tracking?phone=0900000000&sn=QA-TRACKING`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(`${section} ol[aria-label="Các mốc giao hàng"]`);
      assert.equal(await page.$$eval(`${section} ol[aria-label="Các mốc giao hàng"] li`, els => els.length), 5);
      assert.equal(await page.$$eval(`${section} a[href^="tel:"]`, els => els.length), 0);
      assert.match(await page.$eval(section, el => el.innerText), /Chưa có xác nhận từ GHN/);
      assert.equal(await page.$eval(section, el => el.scrollWidth <= el.clientWidth + 1), true);
      await page.screenshot({ path: join(tmpdir(), 'scanms-ghn-tracking-mobile.png'), fullPage: true });

      simulation = true;
      await page.setViewport({ width: 1440, height: 1000 });
      for (const status of simulationStates) {
        stage = status;
        for (const route of [`/tracking?phone=0900000000&sn=QA-TRACKING`, `/customer/orders?orderId=${id}`]) {
          await page.goto(base + route, { waitUntil: 'domcontentloaded' });
          await page.waitForFunction(sel => document.querySelector(sel)?.innerText.includes('Trạng thái mô phỏng'), {}, section);
          assert.equal(await page.$$eval(`${section} ol[aria-label="Các mốc giao hàng"] li`, els => els.length), 5);
          assert.equal(await page.$$eval(`${section} ol[aria-label="Lịch sử chi tiết"] li`, els => els.length), simulationStates.indexOf(status) + 1);
          assert.match(await page.$eval(section, el => el.innerText), new RegExp(labels[status]));
          assert.equal(await page.$$eval(`${section} a[href^="tel:"]`, els => els.length), 0);
          if (['delivering', 'delivered'].includes(status)) {
            assert.match(await page.$eval(section, el => el.innerText), /Shipper mô phỏng/);
            assert.match(await page.$eval(section, el => el.innerText), /Nguyễn Minh An/);
            assert.match(await page.$eval(section, el => el.innerText), /09xx xxx xxx/);
            assert.equal(await page.$$eval(`${section} button`, els => els.find(el => el.textContent === 'Gọi shipper')?.disabled), true);
          } else {
            assert.doesNotMatch(await page.$eval(section, el => el.innerText), /Nguyễn Minh An/);
          }
        }
      }
    } finally { await browser.close(); }
  });
