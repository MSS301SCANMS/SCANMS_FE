import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

test('buy-now and selected cart use one checkout with real shop totals, vouchers and one place-order action', {
  skip: !base || !existsSync(executablePath), timeout: 60000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const user = { id: 'qa-checkout', role: 'CUSTOMER', fullName: 'Khách kiểm thử', email: 'buyer@example.test', phoneNumber: '0901234567' };
  const address = { id: 'address', fullName: user.fullName, phoneNumber: user.phoneNumber, detailAddress: '123 Đường Nguyễn Trãi', provinceCode: '6', districtCode: '58', wardCode: '1879', provinceName: 'Tỉnh Bắc Kạn', districtName: 'Thành Phố Bắc Kạn', wardName: 'Phường Nguyễn Thị Minh Khai', isDefault: true };
  const provinces = [{ code: 6, name: address.provinceName, districts: [{ code: 58, name: address.districtName, wards: [{ code: 1879, name: address.wardName }] }] }];
  const fixtures = [0, 1].map(index => ({
    cartItemId: `${id(index + 1)}_${id(index + 11)}`, productId: id(index + 1), variantId: id(index + 11), variantName: index ? '100 ml' : '30 ml / Tiêu chuẩn',
    title: index ? 'Sữa rửa mặt dịu nhẹ cho da nhạy cảm' : 'Serum rau má B5 Cocoon 30 ml', price: index ? 100000 : 200000, quantity: index ? 1 : 2,
    imageUrl: '/assets/products/real/amino-cleanser-ph55.jpg', stockQuantity: 10, isActive: true, sku: `FIXTURE-${index}`,
    store: { id: id(index + 21), name: index ? 'Gian hàng chăm sóc da với tên dài để kiểm tra màn hình nhỏ' : 'Cocoon', slug: `fixture-shop-${index}` },
    availableVariants: [{ id: id(index + 11), name: index ? '100 ml' : '30 ml / Tiêu chuẩn', price: index ? 100000 : 200000, stockQuantity: 10 }],
  }));
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(8000);
    const errors = [], placed = [], couponRequests = [];
    let serverCart = structuredClone(fixtures), customerOrders = [], payosChecks = 0, failNextPlacement = false, failedKey;
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(({ user, address, fixtures }) => {
      localStorage.setItem('token', 'qa-fixture-only'); localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('scanms_cart_u_qa-checkout', JSON.stringify(fixtures));
      localStorage.setItem('scanms_cart_selected_u_qa-checkout', JSON.stringify(fixtures.map(item => item.cartItemId)));
      localStorage.setItem('scanms_cached_addresses', JSON.stringify([address]));
      window.WebSocket = class { static OPEN = 1; readyState = 1; addEventListener() {} removeEventListener() {} send() {} close() {} };
      const timeout = window.setTimeout.bind(window);
      window.setTimeout = (fn, ms, ...args) => timeout(fn, ms === 5000 ? 40 : ms, ...args);
    }, { user, address, fixtures });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketAuthenticated=()=>false;export const isChatSocketEnabled=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.hostname === 'provinces.open-api.vn') return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(provinces) });
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,authorization,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let data = [];
        if (url.pathname === '/api/auth/me') data = user;
        if (url.pathname === '/api/customer/profile') data = { user, stats: {} };
        if (url.pathname === '/api/customer/orders') {
          const history = customerOrders.length ? [...customerOrders, { ...customerOrders[0], id: id(9999), externalOrderSn: 'DH-OLDER', status: 'COMPLETED' }] : [];
          const status = url.searchParams.get('status');
          const orders = status ? history.filter(order => order.status === status) : history;
          data = { orders, total: orders.length };
        }
        if (url.pathname.includes('/notifications/unread')) data = { unreadCount: 0, categoryUnreadCounts: {} };
        if (url.pathname === '/api/notifications') data = { notifications: [], total: 0 };
        if (url.pathname === '/api/customer/cart') {
          if (request.method() === 'PUT') serverCart = JSON.parse(request.postData()).items;
          data = { items: serverCart };
        }
        if (url.pathname === '/api/customer/addresses') data = [address];
        if (url.pathname.startsWith('/api/stores/public/id/')) data = { id: url.pathname.split('/').at(-1), policyReturn: 'Đổi trả 14 ngày theo điều kiện của gian hàng.', policyShipping: 'Giao qua GHN', policyWarranty: 'Theo chính sách gian hàng' };
        if (url.pathname === '/api/wallets/me') data = { availableBalance: 1000000, pendingBalance: 0 };
        if (url.pathname === '/api/orders/payos/availability') data = { available: true };
        if (url.pathname === '/api/orders/validate-cart') data = { items: JSON.parse(request.postData()).items.map(item => ({ ...item, currentPrice: item.clientPrice, stockQuantity: 10, isActive: true })), warnings: [] };
        if (url.pathname === '/api/shipping/ghn/quote-address') data = { totalFee: JSON.parse(request.postData()).storeId === id(21) ? 29001 : 20000 };
        if (url.pathname === '/api/coupons/validate') {
          const payload = JSON.parse(request.postData()); couponRequests.push(payload);
          data = { code: payload.code, discountAmount: payload.code === 'SHIP5' ? 5000 : 15000, discountType: 'FIXED_AMOUNT' };
        }
        if (url.pathname === '/api/orders' && request.method() === 'POST') {
          const payload = JSON.parse(request.postData());
          if (failNextPlacement) {
            const status = failNextPlacement;
            failNextPlacement = false; failedKey = payload.idempotencyKey;
            return request.respond({ status, headers, body: JSON.stringify({ message: 'Tạm thời chưa tạo được đơn, vui lòng thử lại' }) });
          }
          placed.push(payload);
          const storeIds = [...new Set(payload.items.map(item => fixtures.find(fixture => fixture.productId === item.productId).store.id))];
          const paymentStatus = payload.paymentMethod === 'PAYOS' ? 'WAITING_PAYMENT' : 'PAID';
          const orders = storeIds.map((storeId, index) => ({ publicOrderCode: `DH-FIXTURE-${index}`, finalAmount: 414001, paymentStatus, store: fixtures.find(item => item.store.id === storeId).store }));
          customerOrders = orders.map((order, index) => ({
            id: id(100 + index), externalOrderSn: order.publicOrderCode, status: 'PENDING',
            customerName: user.fullName, customerPhone: user.phoneNumber, shippingAddress: payload.shippingAddress,
            createdAt: '2026-10-20T00:00:00Z', updatedAt: '2026-10-20T00:00:00Z',
            subtotalAmount: 400000, discountAmount: 15000, shippingFee: 29001, finalAmount: order.finalAmount,
            rawPayload: { paymentMethod: payload.paymentMethod, paymentStatus }, store: order.store,
            orderItems: payload.items.filter(item => fixtures.find(f => f.productId === item.productId).store.id === order.store.id).map((item, i) => ({ id: id(200 + i), ...item, unitPrice: 200000, product: { id: item.productId, title: fixtures.find(f => f.productId === item.productId).title, imageUrl: fixtures[0].imageUrl, sku: 'QA' } })), productReviews: [],
          }));
          data = { publicOrderCode: orders[0].publicOrderCode, isMultiStore: orders.length > 1, paymentMethod: payload.paymentMethod, paymentStatus, finalAmount: orders.length > 1 ? 534001 : 414001, orders, confirmationEmailStatus: 'SENT' };
        }
        if (/\/api\/orders\/payos\/[^/]+\/status$/.test(url.pathname)) {
          payosChecks++;
          if (payosChecks > 1) customerOrders.forEach(order => { order.rawPayload.paymentStatus = 'PAID'; });
          data = { paymentStatus: payosChecks > 1 ? 'PAID' : 'WAITING_PAYMENT', orderStatus: 'PENDING' };
        }
        if (/\/api\/orders\/payos\/[^/]+\/link$/.test(url.pathname)) data = { qrCode: '000201-TEST-ONLY', checkoutUrl: 'https://example.test/payment', amount: 414001 };
        assert.ok(!/top-up/.test(url.pathname), 'checkout must not top up a wallet');
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.pathname === '/__checkout-flow-test') return request.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
        await import('/src/index.css');
        const source=await(await fetch('/src/components/checkout/GuestCheckoutModal.tsx')).text();const version=source.match(/react[.]js([?]v=[^"]+)/)?.[1]||'';
        const React=await import('/node_modules/.vite/deps/react.js'+version);const dom=await import('/node_modules/.vite/deps/react-dom_client.js'+version);const {BrowserRouter,useLocation}=await import('/node_modules/.vite/deps/react-router-dom.js'+version);
        const {QueryClient,QueryClientProvider}=await import('/node_modules/.vite/deps/@tanstack_react-query.js'+version);
        const {default:CustomerPortalPage}=await import('/src/pages/customer/CustomerPortalPage.tsx'); const {default:PayosReturnPage}=await import('/src/pages/public/PayosReturnPage.tsx');
        const {CartProvider,useCart}=await import(source.match(/[\"]([^\"]*CartContext[.]tsx[^\"]*)[\"]/)[1]);const {ScanmsChatProvider}=await import(source.match(/[\"]([^\"]*ScanmsChatContext[.]tsx[^\"]*)[\"]/)[1]);const {GuestCheckoutModal}=await import('/src/components/checkout/GuestCheckoutModal.tsx');const {CartDrawer}=await import('/src/components/cart/CartDrawer.tsx');
        const fixture=${JSON.stringify(fixtures[0])};const h=React.createElement||React.default.createElement;
        function Harness(){const cart=useCart();const location=useLocation();const [direct,setDirect]=(React.useState||React.default.useState)(false);if(location.pathname==='/customer/orders')return h(CustomerPortalPage);if(location.pathname==='/payment/payos-return')return h(PayosReturnPage);return h(React.Fragment||React.default.Fragment,null,
          h('button',{id:'direct-entry',onClick:()=>setDirect(true)},'Mua ngay'),h('button',{id:'cart-entry',onClick:cart.openCart},'Giỏ hàng'),h(CartDrawer),
          direct?h(GuestCheckoutModal,{isOpen:true,onClose:()=>setDirect(false),initialQuantity:fixture.quantity,initialVariantId:fixture.variantId,product:{id:fixture.productId,title:fixture.title,price:fixture.price,imageUrl:fixture.imageUrl,stockQuantity:10,variants:fixture.availableVariants},store:fixture.store}):null,
          cart.isCheckoutOpen?h(GuestCheckoutModal,{isOpen:true,onClose:cart.closeCheckout,checkoutItems:cart.checkoutItems}):null);}
        const app=h(BrowserRouter,null,h(CartProvider,null,h(ScanmsChatProvider,null,h(Harness))));
        (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(QueryClientProvider,{client:new QueryClient()},app));
      </script></body></html>` });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    for (const [step, mode] of ['direct', 'cart', 'selected', 'payos'].entries()) {
      const expectedShops = mode === 'cart' ? 2 : 1;
      serverCart = structuredClone(fixtures);
      customerOrders = []; payosChecks = 0;
      await page.setViewport({ width: 1440, height: 1100 });
      await page.goto(`${base}/__checkout-flow-test`);
      await page.waitForSelector('#direct-entry').catch(error => { throw new Error(`${error.message}; ${errors.join('; ')}`); });
      await page.click(mode === 'direct' || mode === 'payos' ? '#direct-entry' : '#cart-entry');
      if (mode !== 'direct' && mode !== 'payos') {
        await page.waitForSelector('.scanms-cart-dialog[open]');
        await page.waitForFunction(() => !document.querySelector('.scanms-cart-checkout').disabled);
        if (mode === 'selected') await (await page.$$('.scanms-cart-shop__header > input'))[1].click();
        await page.click('.scanms-cart-checkout');
      }
      await page.waitForSelector('.checkout-flow-form');
      assert.equal(await page.$('.scanms-cart-dialog[open]'), null, 'buy-now and checkout do not show another basket step');
      await page.waitForFunction(() => document.querySelector('.checkout-total-final dd')?.textContent.includes('49.001') || document.querySelector('.checkout-total-final dd')?.textContent.includes('29.001'));
      assert.deepEqual(await page.$$eval('.checkout-flow-form > .checkout-section', els => els.map(el => el.classList[1])), ['checkout-address', 'checkout-products', 'checkout-vouchers', 'checkout-payment']);
      assert.equal(await page.$$('.checkout-shop').then(els => els.length), expectedShops);
      assert.equal(await page.$$('input#checkout-policy-agreement').then(els => els.length), 1);
      assert.equal(await page.$$('.checkout-flow-form button[type="submit"]').then(els => els.length), 1);
      assert.equal(placed.length, step, 'opening checkout does not place an order');
      for (const width of [1440, 1024, 768, 390, 320]) {
        await page.setViewport({ width, height: 1100 });
        assert.ok(await page.$eval('.scanms-checkout', el => el.scrollWidth <= el.clientWidth + 1), `${mode} checkout fits ${width}px`);
        assert.ok(await page.$$eval('.checkout-section', els => els.every(el => el.scrollWidth <= el.clientWidth + 1)), `${mode} sections fit ${width}px`);
        if (width === 1440 || width === 390) {
          await (await page.$('.scanms-checkout')).screenshot({ path: join(tmpdir(), `scanms-checkout-${mode}-${width}.png`) });
          await (await page.$('.checkout-payment')).screenshot({ path: join(tmpdir(), `scanms-checkout-payment-${mode}-${width}.png`) });
        }
      }
      await page.setViewport({ width: 1440, height: 1100 });
      await page.type('#checkout-voucher-shop', 'SHOP15');
      await page.$eval('#checkout-voucher-shop', el => el.parentElement.querySelector('button').click());
      await page.waitForFunction(() => document.querySelector('.checkout-voucher-message')?.textContent.includes('15.000'));
      assert.equal(couponRequests.at(-1).storeId, id(21));
      assert.ok(couponRequests.at(-1).items.every(item => item.productId === id(1)));
      const totals = await page.$eval('.checkout-totals', el => el.textContent);
      assert.match(totals, /15.000/);
      assert.match(totals, expectedShops === 1 ? /414.001/ : /534.001/);
      const payment = mode === 'payos' ? 'PAYOS' : 'WALLET';
      await page.click(`input[value="${payment}"]`);
      assert.equal(await page.$eval(`input[value="${payment}"]`, el => el.checked), true);
      await page.$eval('#checkout-policy-agreement', el => { if (el.checked) el.click(); });
      await page.$eval('.checkout-submit', el => el.click());
      await page.waitForSelector('#checkout-error');
      assert.equal(placed.length, step);
      await page.$eval('#checkout-policy-agreement', el => el.click());
      await page.type('#checkout-order-notes', 'Gọi trước khi giao');
      if (mode === 'direct') {
          for (const status of [400, 503]) {
            failNextPlacement = status;
            await page.$eval('.checkout-submit', el => { el.scrollIntoView(); el.click(); });
            await page.waitForFunction(() => document.activeElement?.id === 'checkout-error' && document.querySelector('#checkout-error')?.textContent.includes('Tạm thời chưa tạo được đơn'));
            assert.ok(await page.$eval('#checkout-error', el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), 'server error is visible after submitting at the bottom');
            assert.equal(new URL(page.url()).pathname, '/__checkout-flow-test');
            assert.equal(placed.length, 0);
            assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('scanms_cart_u_qa-checkout')).length), 2, 'failed placement keeps the cart');
          }
      }
      await page.$eval('.checkout-submit', el => el.click());
      await page.waitForFunction(() => location.pathname === '/customer/orders' && !document.querySelector('.scanms-checkout'));
      await page.waitForSelector('[data-order-code="DH-FIXTURE-0"]').catch(async error => { throw new Error(`${error.message}: ${errors.join('; ')} ${await page.$eval('body', el => el.innerText.slice(-1200))}`); });
      assert.equal(await page.$$eval('button[aria-pressed=true]', els => els.some(el => el.textContent.trim() === 'Chờ Shop xác nhận')), true, 'new purchases open the pending shop confirmation tab');
      assert.equal(await page.$('[data-order-code="DH-OLDER"]'), null, 'completed orders are outside the selected pending filter');
      assert.equal(await page.$('.checkout-confirmation'), null, 'no intermediate success screen');
      assert.equal(await page.$('[role=dialog][aria-modal=true]'), null, 'shows the purchase list without opening a detail dialog');
      assert.equal(placed.length, step + 1);
      assert.equal(placed.at(-1).paymentMethod, payment);
      assert.equal(placed.at(-1).customerEmail, user.email);
      assert.equal(placed.at(-1).items.length, expectedShops);
      assert.equal(placed.at(-1).items[0].quantity, 2);
      assert.equal(placed.at(-1).items[0].variantId, id(11));
      assert.equal(placed.at(-1).couponsByStore[id(21)], 'SHOP15');
      if (mode === 'direct') assert.equal(placed[0].idempotencyKey, failedKey, 'a retry keeps the original idempotency key');
      assert.equal(await page.$$eval('[data-order-code]', els => els.length), expectedShops);
      if (mode === 'direct') {
        await page.evaluate(() => [...document.querySelectorAll('button[aria-pressed]')].find(el => el.textContent.trim() === 'Tất cả').click());
        await page.waitForSelector('[data-order-code="DH-OLDER"]');
        assert.equal(await page.$$eval('[data-order-code]', els => els.length), expectedShops + 1, 'the user can still switch to all orders');
        await page.evaluate(() => [...document.querySelectorAll('button[aria-pressed]')].find(el => el.textContent.trim() === 'Chờ Shop xác nhận').click());
        await page.waitForFunction(() => !document.querySelector('[data-order-code="DH-OLDER"]'));
      }
      const remaining = await page.evaluate(() => JSON.parse(localStorage.getItem('scanms_cart_u_qa-checkout') || '[]'));
      assert.equal(remaining.length, mode === 'cart' ? 0 : 1, 'only purchased cart items are removed');
      if (payment === 'PAYOS') {
        assert.match(await page.$eval('[data-order-code="DH-FIXTURE-0"]', el => el.innerText), /Chờ thanh toán/);
        assert.equal(await page.$eval('[data-order-code="DH-FIXTURE-0"]', el => el.open), true);
        assert.equal(payosChecks, 0, 'redirecting does not confirm a payment');
        await page.click('a[href="/payment/payos-return?order=DH-FIXTURE-0"]');
        await page.waitForFunction(() => location.pathname === '/customer/orders' && !document.querySelector('.scanms-checkout') && document.querySelector('[data-order-code="DH-FIXTURE-0"]')?.textContent.includes('Chờ Shop xác nhận'));
        assert.ok(payosChecks > 1, 'payment is confirmed by the server before returning');
        assert.equal(await page.$$eval('button[aria-pressed=true]', els => els.some(el => el.textContent.trim() === 'Chờ Shop xác nhận')), true, 'confirmed PayOS payments also return to pending shop confirmation');
        assert.equal(placed.length, step + 1, 'paying an existing order does not place another one');
      }
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
