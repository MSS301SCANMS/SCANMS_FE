import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('homepage buy opens product detail before checkout and preserves the chosen variant and quantity', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const store = { id: '2f67001b-09a5-5958-85fd-5f401831c871', name: 'Sora Skin', slug: 'qa-shop', isVerified: true };
  const variants = [
    { id: 'qa-small', name: '30 ml / Tiêu chuẩn', sku: 'QA-SMALL', price: 250000, stockQuantity: 20, isActive: true },
    { id: 'qa-large', name: '50 ml / Hộp quà', sku: 'QA-LARGE', price: 320000, stockQuantity: 15, isActive: true },
  ];
  const liveVariants = variants.map(variant => ({ ...variant }));
  const product = { id: '00000000-0000-4000-8000-000000000001', sku: 'QA-SERUM', title: 'Serum kiểm thử', price: 250000, originalPrice: 280000,
    imageUrl: '/scanms-placeholder.svg', categoryName: 'Chăm sóc da', stockQuantity: 35, isActive: true, canPurchase: true, status: 'ACTIVE', variants, store };
  const landing = { product, store, images: [], videos: [], reviews: { averageRating: 5, totalReviews: 0, starDistribution: {}, items: [] },
    availability: { inStock: true, stockQuantity: 35 }, policies: { returnPolicy: 'Đổi trả 14 ngày', warranty: '', shipping: '', genuineCommitment: '' } };
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    const errors = [], writes = [], analytics = [], privateProductRequests = [];
    await page.evaluateOnNewDocument(() => localStorage.setItem('scanms_analytics_consent', 'granted'));
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed')) errors.push(error.message); });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        if (request.method() === 'POST') writes.push(url.pathname);
        if (url.pathname === '/api/products') privateProductRequests.push(url.pathname);
        if (url.pathname === '/api/public/products/analytics/events') analytics.push(JSON.parse(request.postData()));
        let data = [];
        if (url.pathname === '/api/public/products') data = [product];
        if (url.pathname.endsWith('/landing')) data = landing;
        if (url.pathname.includes('/stores/public/id/')) data = store;
        if (url.pathname.includes('/stock')) data = { stockQuantity: liveVariants.reduce((sum, variant) => sum + variant.stockQuantity, 0), variants: liveVariants };
        if (url.pathname === '/api/coupons/validate') data = { discountAmount: 50000, description: 'Giảm 50.000đ' };
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(`${origin}/marketplace`);
    await page.waitForSelector('article h3');
    await page.evaluate(() => [...document.querySelectorAll('article button')].find(button => button.textContent === 'Mua ngay').click());
    await page.waitForFunction(() => location.pathname === '/products/QA-SERUM');
    assert.equal(new URL(page.url()).searchParams.has('checkout'), false);
    assert.equal(await page.$('.marketplace-variant-hint'), null);
    assert.equal(await page.$('#guest-checkout-title'), null);
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('50 ml / Hộp quà')));
    assert.equal(await page.$eval('.pps-price-label', el => el.textContent), 'Giá từ');
    assert.equal(await page.$('[data-product-voucher-total]'), null);
    assert.doesNotMatch(await page.$eval('[data-product-price-panel]', el => el.textContent), /Giá Tốt Sau Voucher/);
    assert.equal(await page.$eval('.psp-details', el => el.hidden), true);
    await page.click('.psp-option:nth-child(2)');
    await page.waitForFunction(() => !document.querySelector('.psp-details').hidden);
    assert.match(await page.$eval('.psp-details', el => el.textContent), /Đổi trả 14 ngày/);
    await page.click('.psp-option:nth-child(4)');
    assert.match(await page.$eval('.psp-details', el => el.textContent), /chưa công bố điều kiện bảo hành/);
    await page.click('.psp-toggle');
    assert.equal(await page.$eval('.psp-details', el => el.hidden), true);
    assert.match(await page.$eval('[data-product-availability]', el => el.textContent), /Chọn phân loại để xem số lượng có sẵn/);
    assert.doesNotMatch(await page.$eval('[data-product-availability]', el => el.textContent), /35 sản phẩm|Tồn kho tức thời/);
    assert.equal(await page.$$eval('[data-required] button[aria-pressed=true]', buttons => buttons.length), 0, 'no variant is selected by default');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Mua sản phẩm này')).click());
    await page.waitForFunction(() => document.querySelector('[data-required=true] [role=alert]')?.textContent.includes('Vui lòng chọn phân loại'));
    assert.equal(await page.$('#guest-checkout-title'), null, 'buy without a variant cannot open checkout');
    assert.equal(new URL(page.url()).searchParams.has('checkout'), false);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('50 ml / Hộp quà')).click());
    assert.match(await page.$eval('[data-product-availability]', el => el.textContent), /15 sản phẩm có sẵn/);
    assert.equal(await page.$('[data-required=true]'), null, 'choosing a variant clears the warning');
    await page.click('button[aria-label="Tăng số lượng"]');
    assert.equal(await page.$eval('input[role=spinbutton]', el => el.value), '2');
    assert.equal(await page.$eval('.pps-price-label', el => el.textContent), 'Giá bán');
    await page.type('input[placeholder*="THANGVIP10"]', 'QATEST50');
    await page.$eval('input[placeholder*="THANGVIP10"]', el => el.closest('form').querySelector('button').click());
    await page.waitForSelector('[data-product-voucher-total]');
    assert.match(await page.$eval('[data-product-voucher-total]', el => el.textContent), /590[.,]000/);
    await page.click('button[aria-label="Tăng số lượng"]');
    await page.waitForFunction(() => !document.querySelector('[data-product-voucher-total]'));
    await page.click('button[aria-label="Giảm số lượng"]');
    await page.$eval('input[placeholder*="THANGVIP10"]', el => el.closest('form').querySelector('button').click());
    await page.waitForSelector('[data-product-voucher-total]');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('30 ml / Tiêu chuẩn')).click());
    await page.waitForFunction(() => !document.querySelector('[data-product-voucher-total]'));
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('50 ml / Hộp quà')).click());
    await page.click('button[aria-label="Tăng số lượng"]');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Mua sản phẩm này')).click());
    await page.waitForSelector('#guest-checkout-title');
    assert.equal(new URL(page.url()).searchParams.get('checkout'), '1');
    const checkout = await page.$eval('#guest-checkout-title', el => el.closest('[role=dialog]')?.textContent || document.body.textContent);
    assert.match(checkout, /50 ml \/ Hộp quà/);
    assert.match(checkout, /640[.,]000/);
    assert.equal(writes.includes('/api/orders'), false, 'opening checkout never places an order');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Quay lại').click());
    await page.waitForFunction(() => !document.querySelector('#guest-checkout-title') && !new URL(location.href).searchParams.has('checkout'), { timeout: 3000 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.$('#guest-checkout-title'), null, 'one click closes checkout without reopening it');
    assert.equal(await page.$eval('input[role=spinbutton]', el => el.value), '2', 'return preserves quantity');
    assert.equal(await page.$eval('button[aria-pressed=true]', el => el.textContent.includes('50 ml / Hộp quà')), true);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Mua sản phẩm này')).click());
    await page.waitForSelector('#guest-checkout-title');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Quay lại').click());
    await page.waitForFunction(() => !document.querySelector('#guest-checkout-title') && !new URL(location.href).searchParams.has('checkout'), { timeout: 3000 });
    await page.goto(`${origin}/products/QA-SERUM?checkout=1`);
    await page.waitForSelector('[data-required=true] [role=alert]');
    assert.equal(await page.$('#guest-checkout-title'), null, 'a checkout URL cannot bypass explicit variant selection');
    assert.equal(new URL(page.url()).searchParams.has('checkout'), false);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('50 ml / Hộp quà')).click());
    liveVariants[1].stockQuantity = 2;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(() => document.querySelector('[data-product-availability]').textContent.includes('2 sản phẩm có sẵn'));
    const eventResponse = page.waitForResponse(response => response.url().endsWith('/analytics/events') && response.request().method() === 'POST');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Thêm Vào Giỏ Hàng')).click());
    await eventResponse;
    assert.ok(analytics.some(event => event.event === 'page_view' && event.storeId === store.id));
    assert.ok(analytics.some(event => event.event === 'add_to_cart' && event.productId === product.id));
    assert.ok(analytics.every(event => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(event.eventId)));
    await page.click('[aria-label="Đóng giỏ hàng"]');
    liveVariants[1].stockQuantity = 0;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(() => document.querySelector('[data-product-availability]').textContent.includes('Tạm hết hàng'));
    assert.equal(await page.$eval('button[aria-label="Tăng số lượng"]', el => el.disabled), true);
    assert.deepEqual(privateProductRequests, [], 'customer browsing never prefetches the private product API');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
