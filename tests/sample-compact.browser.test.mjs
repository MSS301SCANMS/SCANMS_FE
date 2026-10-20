import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('compact sample shipment shows status while collapsed and preserves delivery actions',
  { skip: !base || !existsSync(executablePath), timeout: 45000 }, async () => {
    assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
    const browser = await puppeteer.launch({ executablePath, headless: true });
    const storeId = '00000000-0000-4000-8000-000000000010';
    const sample = { id: '00000000-0000-4000-8000-000000000020', status: 'SHIPPED', createdAt: new Date().toISOString(),
      collaboratorId: 'audit-kol', collaborator: { id: 'audit-kol', fullName: 'KOL test', email: 'audit@example.test' },
      recipientName: 'Test', recipientPhone: '0912345678', shippingAddress: '88 A, Phường A, Quận B, Tỉnh C',
      carrier: 'GHN', trackingNumber: 'LIVE-ORIGINAL', shippingCharges: [],
      product: { id: 'audit-product', title: 'Sample test', storeId, price: 250000 }, events: [], videoAssets: [] };
    const creates = [], tracking = [], syncs = [];
    let receiptReads = 0;
    let payments = 0;
    let receipt = { receivedAt: null, deadlineAt: null, videoUrl: null, deliveryStatus: 'NOT_STARTED', simulationStartedAt: null };
    const clickText = (page, label) => page.evaluate(label => {
      const button = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === label || button.getAttribute('aria-label') === label);
      if (!button) throw Error(`Missing button ${label}`); button.click();
    }, label);
    async function open(route, role) {
      const page = await browser.newPage(); page.setDefaultTimeout(10000);
      await page.setViewport({ width: 1440, height: 1000 });
      await page.evaluateOnNewDocument(role => {
        localStorage.setItem('token', 'fixture-only-no-server');
        localStorage.setItem('user', JSON.stringify({ id: role === 'COLLABORATOR' ? 'audit-kol' : 'audit-shop', role, fullName: 'Test' }));
      }, role);
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/') || url.port === '3000') {
          const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': new URL(base).origin,
            'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache',
            'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
          if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
          let data = [];
          if (url.pathname.includes('/shipping/ghn/sandbox-sample/')) {
            if (request.method() === 'GET') receiptReads++;
            if (url.pathname.endsWith('/start')) {
              receipt = { ...receipt, receivedAt: null, deadlineAt: null, videoUrl: null, deliveryStatus: 'WAITING_PICKUP', simulationStartedAt: new Date().toISOString() };
            }
            if (url.pathname.endsWith('/pay-shipping')) {
              payments++;
              if (payments === 1) return request.respond({ status: 503, headers, body: JSON.stringify({ message: 'Chưa lưu được thanh toán thử' }) });
              receipt.shippingPayment = { status: 'PAID_SIMULATED', amount: 49000, reference: 'SBX-SHIP-QA', paidAt: new Date().toISOString(), payer: 'SHOP', codAmount: 0 };
            }
            if (url.pathname.endsWith('/video')) receipt.videoUrl = JSON.parse(request.postData()).videoUrl;
            if (url.pathname.endsWith('/expire')) receipt.status = 'OVERDUE';
            data = { ...receipt, status: receipt.videoUrl ? 'VIDEO_SUBMITTED' : receipt.status || (receipt.receivedAt ? 'RECEIVED' : 'SHIPPED') };
          }
          if (url.pathname.includes('/shipping/ghn/create-sample/')) {
            creates.push(JSON.parse(request.postData()));
            sample.shippingCharges = [{ environment: 'TEST', trackingNumber: 'TEST-ISSUED', amount: 49000, status: 'TEST_ONLY', payer: 'SHOP', codAmount: 0 }];
            data = { trackingNumber: 'TEST-ISSUED', environment: 'TEST', testOnly: true };
          }
          if (['/api/sample-requests/shop', '/api/sample-requests/my'].includes(url.pathname)) data = [sample];
          if (url.pathname === '/api/store-collaborators/shop') data = { store: { id: storeId, name: 'Test Shop' }, members: [] };
          if (url.pathname === '/api/store-collaborators/my') data = [];
          if (url.pathname === '/api/stores') data = [{ id: storeId, name: 'Test Shop' }];
          if (url.pathname === '/api/stores/marketplace') data = [{ id: storeId, name: 'Test Shop', slug: 'test-shop' }];
          if (url.pathname === `/api/stores/${storeId}`) data = { id: storeId, name: 'Test Shop' };
          if (url.pathname === '/api/sample-requests/my/eligibility') data = { canRequest: true, isBlocked: false, channels: [] };
          if (url.pathname === '/api/kyc/profile') data = { kycStatus: 'VERIFIED' };
          if (url.pathname === '/api/products' || url.pathname === '/api/media') data = { items: [], pagination: { total: 0 } };
          if (url.pathname.includes('/shipping/ghn/track/')) {
            tracking.push({ code: url.pathname.split('/').pop(), environment: url.searchParams.get('environment') });
            data = { status: 'delivered', statusText: 'Giao hàng thành công', environment: url.searchParams.get('environment') || 'LIVE', isStale: false, timeline: [] };
          }
          if (url.pathname.includes('/shipping/ghn/sync-sample/')) syncs.push(url.pathname);
          return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
        }
        if (url.origin !== new URL(base).origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
        return request.continue();
      });
      await page.goto(base + route); return page;
    }
    try {
      sample.status = 'APPROVED'; sample.trackingNumber = null;
      sample.shippingCharges = [];
      const pendingShipment = await open('/collaborator/collaboration?shop=' + storeId + '&tab=samples', 'COLLABORATOR');
      await pendingShipment.waitForFunction(() => document.body.innerText.includes('Chờ Shop tạo vận đơn GHN'));
      assert.equal(await pendingShipment.$$eval('[aria-label="Vận đơn mẫu GHN sandbox"]', els => els.length), 0);
      assert.equal(await pendingShipment.$$eval('button[aria-label="Theo dõi hành trình bưu kiện"]', els => els.length), 0);
      await pendingShipment.close();
      sample.shippingCharges = [{ environment: 'TEST', trackingNumber: 'TEST-ISSUED', amount: 49000 }, { environment: 'TEST', trackingNumber: 'TEST-OLDER' }];
      const page = await open('/merchant/kol-hub?kol=audit-kol&tab=samples', 'SHOP_MANAGER');
      const section = '[aria-label="Vận đơn mẫu GHN sandbox"]';
      const receiptSection = '[aria-label="Tiến độ giao hàng đơn mẫu"]';
      await page.waitForSelector(section);
      await page.waitForFunction(sel => [...document.querySelector(sel).querySelectorAll('button')].some(b => b.textContent.includes('Bắt đầu hành trình') && !b.disabled), {}, section);
      const badge = '[data-sandbox-status="TEST-ISSUED"]';
      assert.match(await page.$eval(badge, el => el.innerText), /Chờ bắt đầu hành trình/);
      assert.equal(await page.$$eval(receiptSection + ' ol', els => els.length), 0);
      assert.ok(await page.$eval(section, el => el.getBoundingClientRect().height < 240));
      const charges = '[aria-label="Phí vận chuyển hàng mẫu"]';
      assert.match(await page.$eval(charges, el => el.innerText), /Shop chịu 100% phí ship\s+49.000 đ/);
      assert.match(await page.$eval(charges, el => el.innerText), /Thu hộ COD từ KOL\s+0 đ/);
      assert.match(await page.$eval(charges, el => el.innerText), /không trừ ví hoặc thanh toán thật/);
      await (await page.$(charges)).screenshot({ path: join(tmpdir(), 'scanms-sample-payment-desktop.png') });
      await page.setViewport({ width:390, height:844 });
      assert.equal(await page.$eval(charges, el => el.scrollWidth <= el.clientWidth + 1), true);
      await (await page.$(charges)).screenshot({ path: join(tmpdir(), 'scanms-sample-payment-mobile.png') });
      await page.setViewport({ width:1440, height:1000 });
      await clickText(page, 'Thanh toán cước thử');
      await page.waitForFunction(sel => document.querySelector(sel).innerText.includes('Chưa lưu được thanh toán thử'), {}, charges);
      assert.doesNotMatch(await page.$eval(charges, el => el.innerText), /Shop đã thanh toán/);
      await clickText(page, 'Thanh toán cước thử');
      await page.waitForFunction(sel => document.querySelector(sel).innerText.includes('Shop đã thanh toán cước mô phỏng'), {}, charges);
      assert.match(await page.$eval(charges, el => el.innerText), /SBX-SHIP-QA/);
      assert.equal(await page.$$eval(charges + ' button', els => els.length), 0);
      await clickText(page, 'Bắt đầu hành trình');
      await page.waitForFunction(sel => document.querySelector(sel).innerText.includes('Chờ lấy hàng'), {}, receiptSection);
      assert.match(await page.$eval(badge, el => el.innerText), /Chờ lấy hàng/);
      await clickText(page, 'Xem hành trình');
      await page.waitForSelector(receiptSection + ' ol');
      const countdown = receiptSection + ' [data-countdown-seconds]';
      const initialSeconds = await page.$eval(countdown, el => Number(el.dataset.countdownSeconds));
      const readsBeforeCountdown = receiptReads;
      await page.waitForFunction((selector, initial) => Number(document.querySelector(selector)?.getAttribute('data-countdown-seconds')) < initial, { timeout: 2500 }, countdown, initialSeconds);
      assert.equal(receiptReads, readsBeforeCountdown, 'countdown advances every second without waiting for an API poll');
      assert.deepEqual(tracking, [], 'sandbox tracking opens the same SCANMS timeline, not the GHN Staging lookup');
      assert.equal(await page.$$eval('[aria-label="Hành trình GHN TEST-ISSUED"]', els => els.length), 0);
      await clickText(page, 'Thu gọn');
      receipt.deliveryStatus = 'IN_TRANSIT';
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await page.waitForFunction(sel => document.querySelector(sel).innerText.includes('Đang vận chuyển'), {}, receiptSection);
      assert.match(await page.$eval(badge, el => el.innerText), /Đang vận chuyển/);
      await page.reload();
      await page.waitForFunction(sel => document.querySelector(sel)?.innerText.includes('Đang vận chuyển'), {}, receiptSection);
      assert.equal(await page.$$eval(receiptSection + ' ol', els => els.length), 0);
      assert.match(await page.$eval(charges, el => el.innerText), /Shop đã thanh toán cước mô phỏng/);
      await page.screenshot({path: join(tmpdir(), 'scanms-sample-compact-desktop.png'), fullPage: true});
      await page.setViewport({width:390,height:844});
      await page.screenshot({path: join(tmpdir(), 'scanms-sample-compact-mobile.png'), fullPage: true});
      assert.equal(await page.$eval(section, el => el.scrollWidth <= el.clientWidth + 1), true);
      receipt.deliveryStatus = 'DELIVERED'; receipt.receivedAt = new Date().toISOString(); receipt.deadlineAt = new Date(Date.now()+14*86400000).toISOString();
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await page.waitForFunction(sel => document.querySelector(sel)?.innerText.includes('Đã nhận hàng · Chờ video'), {}, badge);
      await clickText(page, 'Xem hành trình');
      assert.equal(await page.$$eval(receiptSection + ' ol li', els => els.length), 3);
      assert.match(await page.$eval(receiptSection, el => el.innerText), /Đã giao thành công/);
      await page.click(receiptSection + ' details summary');
      await clickText(page, 'Chuyển quá hạn');
      await page.waitForFunction(sel => document.querySelector(sel)?.innerText.includes('Quá hạn nộp video'), {}, badge);
      assert.match(await page.$eval(receiptSection, el => el.innerText), /Quá hạn nộp video/);
      await page.reload();
      await page.waitForFunction(sel => document.querySelector(sel)?.innerText.includes('Quá hạn nộp video'), {}, badge);
      await page.close();
      sample.shippingCharges[0].amount = null;
      const savedPayment = receipt.shippingPayment;
      receipt.shippingPayment = null;
      const orders = await open('/merchant/orders?tab=samples', 'SHOP_MANAGER');
      await orders.waitForFunction(sel => document.querySelector(sel)?.innerText.includes('Quá hạn nộp video'), {}, badge);
      assert.match(await orders.$eval(charges, el => el.innerText), /Chờ GHN xác nhận cước/);
      assert.equal(await orders.$eval(charges + ' button', el => el.disabled), true);
      await orders.close();
      receipt.shippingPayment = savedPayment;
      const kol = await open('/collaborator/collaboration?shop=' + storeId + '&tab=samples', 'COLLABORATOR');
      await kol.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Nộp video'));
      await kol.waitForSelector('button[aria-label="Theo dõi hành trình bưu kiện"]');
      assert.match(await kol.$eval(charges, el => el.innerText), /Thu hộ COD từ KOL\s+0 đ/);
      assert.match(await kol.$eval(charges, el => el.innerText), /Bạn nhận mẫu miễn phí/);
      assert.match(await kol.$eval(charges, el => el.innerText), /Shop đã thanh toán cước mô phỏng/);
      assert.equal(await kol.$$eval(charges + ' button', els => els.length), 0);
      await clickText(kol, 'Theo dõi hành trình bưu kiện');
      await kol.waitForSelector(receiptSection + ' ol');
      await clickText(kol, 'Thu gọn');
      assert.match(await kol.$eval(badge, el => el.innerText), /Quá hạn nộp video/);
      assert.equal(await kol.$$eval(receiptSection + ' ol', els => els.length), 0);
      await kol.close();
      assert.deepEqual(syncs, []);
      assert.equal(payments, 2, 'only the failed attempt and successful retry submit payment');
    } finally { await browser.close(); }
  });
