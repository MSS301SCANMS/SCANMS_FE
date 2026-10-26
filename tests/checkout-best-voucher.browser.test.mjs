import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL, executablePath = process.env.GHN_UI_BROWSER_PATH;
test('buy now automatically chooses the lowest server total; manual choices, removal and delayed previews remain authoritative', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 60000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const productId = '00000000-0000-4000-8000-000000000001', variantId = '00000000-0000-4000-8000-000000000002', storeId = '00000000-0000-4000-8000-000000000003';
  const store = { id: storeId, name: 'Shop test', slug: 'test-shop' };
  const variant = { id: variantId, price: 269000, stockQuantity: 10, isActive: true, name: 'Xanh / L', sku: 'TEST-L' };
  const product = { id: productId, title: 'Áo kiểm thử', price: 269000, stockQuantity: 10, canPurchase: true, isActive: true, status: 'ACTIVE', variants: [variant], store };
  const address = { id: 'address', fullName: 'Khách kiểm thử', phoneNumber: '0901234567', detailAddress: '123 Đường kiểm thử', provinceCode: '1', districtCode: '2', wardCode: '3', provinceName: 'Tỉnh kiểm thử', districtName: 'Quận kiểm thử', wardName: 'Phường kiểm thử', isDefault: true };
  const from = new Date(Date.now() - 86400000).toISOString(), until = new Date(Date.now() + 86400000).toISOString();
  const voucher = (code, type, value) => ({ voucherId: code, code, issuerType: 'PLATFORM', scopeType: 'PLATFORM', benefitType: type, discountType: 'FIXED', value, minimumSubtotal: 100000, validFrom: from, validUntil: until });
  const errors = [], orders = [], quotes = [];
  let slow = false, slowStarted = false, page;
  try {
    page = await browser.newPage(); page.setDefaultTimeout(10000);
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed')) errors.push(error.message); });
    await page.evaluateOnNewDocument(() => {
      localStorage.clear(); localStorage.setItem('token', 'best-voucher-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'buyer', fullName: 'Khách kiểm thử', role: 'CUSTOMER', roles: ['USER'] }));
    });
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,authorization', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
      const respond = (result, status = 200, message) => request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, result, message }) }).catch(() => {});
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers }).catch(() => {});
      if (url.hostname === 'provinces.open-api.vn') return request.respond({ headers, contentType: 'application/json', body: JSON.stringify([{ code: 1, name: address.provinceName, districts: [{ code: 2, name: address.districtName, wards: [{ code: 3, name: address.wardName }] }] }]) }).catch(() => {});
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname.endsWith('/users')) return respond({ userId: 'buyer', fullName: address.fullName, phoneNumber: address.phoneNumber, roles: ['USER'], status: 'ACTIVE', address: JSON.stringify([address]) });
        if (url.pathname.endsWith('/vouchers/public/platform')) return respond([voucher('GOODS40', 'GOODS', 40000), voucher('SHIP50', 'SHIPPING', 50000), voucher('EXHAUSTED', 'GOODS', 100000)]);
        if (url.pathname.endsWith('/vouchers/public')) return respond([]);
        if (url.pathname.endsWith('/landing')) return respond({ product, store, images: [], videos: [], availability: { stockQuantity: 10, inStock: true }, reviews: { averageRating: 0, totalReviews: 0, starDistribution: {}, items: [] } });
        if (url.pathname.endsWith('/stock')) return respond({ stockQuantity: 10, variants: [variant] });
        if (url.pathname.includes('/stores/public/')) return respond(store);
        if (url.pathname.endsWith('/checkout/quote')) {
          const body = JSON.parse(request.postData()); quotes.push(body);
          if (body.couponCode && !['GOODS40', 'SHIP50', 'MANUAL5'].includes(body.couponCode)) return respond(null, 409, 'Voucher không còn lượt sử dụng.');
          if (slow && body.couponCode === 'GOODS40') { slowStarted = true; await new Promise(resolve => setTimeout(resolve, 900)); }
          const goods = body.couponCode === 'GOODS40' ? 40000 : body.couponCode === 'MANUAL5' ? 5000 : 0;
          const shipping = body.couponCode === 'SHIP50' || body.shippingCouponCode === 'SHIP50' ? 30000 : 0;
          return respond({ code: body.couponCode || '', shippingCouponCode: body.shippingCouponCode || '', discountAmount: goods, shippingDiscountVnd: shipping, shippingFeeVnd: 30000, shippingMode: 'FIXED', shippingPayer: 'CUSTOMER', finalAmount: 299000 - goods - shipping, discountType: 'VOUCHER' });
        }
        if (url.pathname.endsWith('/capabilities')) return respond({ paymentAvailable: true });
        if (url.pathname.endsWith('/wallets/me')) return respond({ walletId: 'wallet', availableBalanceVnd: 1000000, heldBalanceVnd: 0, status: 'ACTIVE' });
        if (url.pathname.endsWith('/checkout')) { orders.push(JSON.parse(request.postData())); return respond({ orderId: 'order', publicOrderCode: 'order', finalAmount: 294000, shippingFeeVnd: 30000, paymentMethod: 'WALLET', paymentStatus: 'UNPAID', orders: [{ storeId, storeName: store.name, publicOrderCode: 'order', finalAmount: 294000 }] }); }
        if (url.pathname.endsWith('/wallet-payments')) return respond({ paymentId: 'payment', status: 'SUCCESS', amountVnd: 294000 });
        return respond([]);
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    const buy = async () => {
      await page.goto(origin + '/products/' + productId, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('input[aria-label="Mã ưu đãi"]');
      await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Xanh / L'))?.click());
      await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Mua sản phẩm này')).click());
      await page.waitForSelector('.scanms-checkout');
    };
    await buy();
    await page.waitForFunction(() => document.querySelector('#checkout-voucher-shop')?.value === 'GOODS40' && document.querySelector('#checkout-voucher-shipping')?.value === 'SHIP50' && document.querySelector('.checkout-total-final')?.textContent.includes('229.000'));
    assert.ok(quotes.some(q => q.couponCode === 'EXHAUSTED'));
    await page.setViewport({ width: 390, height: 844 });
    await page.$eval('.checkout-vouchers', node => node.scrollIntoView());
    mkdirSync('.qa-artifacts/platform-vouchers', { recursive: true });
    await page.screenshot({ path: '.qa-artifacts/platform-vouchers/automatic-checkout.png' });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.click('.checkout-voucher-choose');
    await page.waitForSelector('input[aria-label="Chọn SHIP50"]');
    await page.click('input[aria-label="Chọn GOODS40"]');
    await page.evaluate(() => [...document.querySelectorAll('dialog button')].find(button => button.textContent.includes('Đồng ý')).click());
    await page.waitForSelector('dialog[open]', { hidden: true });
    await page.waitForFunction(() => document.querySelector('.checkout-total-final')?.textContent.includes('269.000'));
    await page.$eval('#checkout-voucher-shipping', input => input.parentElement.querySelector('button').click());
    await page.waitForFunction(() => !document.querySelector('#checkout-voucher-shop').disabled);
    await page.type('#checkout-voucher-shop', 'INVALID');
    await page.$eval('#checkout-voucher-shop', input => input.parentElement.querySelector('button').click());
    await page.waitForFunction(() => document.querySelector('.checkout-voucher-message')?.textContent.includes('không còn lượt'));
    await page.click('#checkout-voucher-shop'); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await page.keyboard.type('MANUAL5');
    await page.$eval('#checkout-voucher-shop', input => input.parentElement.querySelector('button').click());
    await page.waitForFunction(() => document.querySelector('.checkout-total-final')?.textContent.includes('294.000'));
    await page.click('input[value="WALLET"]');
    await page.$eval('button.checkout-submit', button => button.click());
    await page.waitForFunction(() => document.body.innerText.includes('Đặt hàng thành công'));
    assert.equal(orders.length, 1); assert.equal(orders[0].couponCode, 'MANUAL5');

    slow = true; await buy();
    const deadline = Date.now() + 5000;
    while (!slowStarted && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 10));
    assert.ok(slowStarted, 'The old automatic preview must be in flight before the manual override');
    await page.waitForFunction(() => !!document.querySelector('#checkout-voucher-shop')?.disabled);
    await page.click('.checkout-voucher-choose');
    await page.waitForSelector('input[aria-label="Chọn SHIP50"]');
    await page.click('input[aria-label="Chọn SHIP50"]');
    await page.evaluate(() => [...document.querySelectorAll('dialog button')].find(button => button.textContent.includes('Đồng ý')).click());
    await page.waitForSelector('dialog[open]', { hidden: true });
    await new Promise(resolve => setTimeout(resolve, 1300));
    assert.equal(await page.$eval('#checkout-voucher-shipping', input => input.value), 'SHIP50');
    await page.$eval('#checkout-voucher-shipping', input => input.parentElement.querySelector('button').click());
    await new Promise(resolve => setTimeout(resolve, 500));
    assert.equal(await page.$eval('#checkout-voucher-shop', input => input.value), '');
    await page.setViewport({ width: 390, height: 844 });
    await page.$eval('.checkout-vouchers', node => node.scrollIntoView());
    mkdirSync('.qa-artifacts/platform-vouchers', { recursive: true });
    await page.screenshot({ path: '.qa-artifacts/platform-vouchers/manual-checkout.png' });
    assert.deepEqual(errors, []);
  } catch (error) { console.error(errors, await page?.evaluate(() => document.body.innerText.slice(-2200))); throw error; }
  finally { await browser.close(); }
});
