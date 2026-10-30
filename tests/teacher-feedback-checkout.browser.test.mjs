import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL, executablePath = process.env.GHN_UI_BROWSER_PATH;
test('checkout displays list quantity totals, subtracts live savings once and blocks insufficient wallet before creating an order', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 60000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const productId = '00000000-0000-4000-8000-000000000001', variantId = '00000000-0000-4000-8000-000000000002';
  const address = { id: 'address', fullName: 'Fixture Buyer', phoneNumber: '0901234567', detailAddress: '123 Test street', provinceCode: '1', districtCode: '2', wardCode: '3', provinceName: 'Province', districtName: 'District', wardName: 'Ward', isDefault: true };
  const lines = [{ productId, variantId, sourceLivestreamId: 'fixture-live', quantity: 2, unitPriceVnd: 250000, listUnitPriceVnd: 300000, grossAmountVnd: 500000, storeId: 'fixture-store' }];
  let balance = 200000, creates = 0, payments = 0, submitted;
  const errors = [], paths = [];
  try {
    const page = await browser.newPage(); page.setDefaultTimeout(15000);
    await page.setViewport({ width: 1440, height: 1000 });
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
      const respond = result => request.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ code: 200, result }) });
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.hostname === 'provinces.open-api.vn') return request.respond({ contentType: 'application/json', headers, body: JSON.stringify([{ code: 1, name: 'Province', districts: [{ code: 2, name: 'District', wards: [{ code: 3, name: 'Ward' }] }] }]) });
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketEnabled=()=>false;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.pathname.startsWith('/api/')) {
        paths.push(url.pathname);
        if (url.pathname.endsWith('/users')) return respond({ userId: 'buyer', fullName: 'Fixture Buyer', roles: ['USER'], phoneNumber: '0901234567', address: JSON.stringify([address]), status: 'ACTIVE' });
        if (url.pathname.endsWith('/users/cart')) return respond({ items: [] });
        if (url.pathname.includes('/stores/')) return respond({ storeId: 'fixture-store', name: 'Fixture Shop', policyReturn: 'Return within 14 days', policyShipping: 'Tracked shipping', policyWarranty: 'Contact shop' });
        if (url.pathname.includes('/landing')) return respond({ product: { productId, id: productId, title: 'Fixture live shirt', price: 300000, canPurchase: true, stockQuantity: 10, variants: [{ id: variantId, price: 300000, stockQuantity: 10, isActive: true }] } });
        if (url.pathname.endsWith('/capabilities')) return respond({ paymentAvailable: true });
        if (url.pathname.endsWith('/wallets/me')) return respond({ walletId: 'wallet', ownerType: 'CUSTOMER', availableBalanceVnd: balance, heldBalanceVnd: 0, status: 'ACTIVE' });
        if (url.pathname.endsWith('/checkout/quote')) return respond({ shippingFeeVnd: 30000, subtotalVnd: 500000, finalAmount: 530000, shippingMode: 'SIMULATED', discountAmount: 0, lines });
        if (url.pathname.endsWith('/checkout') && request.method() === 'POST') {
          creates++; submitted = JSON.parse(request.postData());
          return respond({ orderId: 'order', publicOrderCode: 'ORDER', paymentMethod: 'WALLET', paymentStatus: 'UNPAID', finalAmount: 530000, orders: [{ storeId: 'fixture-store', storeName: 'Fixture Shop', publicOrderCode: 'ORDER', finalAmount: 530000, items: [] }] });
        }
        if (url.pathname.endsWith('/wallet-payments')) { payments++; return respond({ paymentId: 'payment', status: 'SUCCESS', orderSyncStatus: 'SYNCED' }); }
        if (request.method() !== 'GET') { errors.push('Unexpected write: ' + url.pathname); return request.abort(); }
        return respond([]);
      }
      if (url.pathname === '/__teacher-checkout') return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
        import '/src/index.css';
        const source=await(await fetch('/src/components/checkout/GuestCheckoutModal.tsx')).text();const main=await(await fetch('/src/main.tsx')).text();
        const React=await import(source.match(/["]([^"]*deps.react[.]js[^"]*)["]/)[1]);const dom=await import(main.match(/["]([^"]*react-dom_client[.]js[^"]*)["]/)[1]);const {BrowserRouter}=await import(source.match(/["]([^"]*react-router-dom[.]js[^"]*)["]/)[1]);
        const {CartProvider}=await import(source.match(/["]([^"]*CartContext[.]tsx[^"]*)["]/)[1]);const {ScanmsChatProvider}=await import(source.match(/["]([^"]*ScanmsChatContext[.]tsx[^"]*)["]/)[1]);
        const session=await import('/src/services/auth-session.ts');const jwt=p=>btoa(JSON.stringify(p));session.saveLoginSession({accessToken:jwt({alg:'none'})+'.'+jwt({sub:'buyer',exp:Math.floor(Date.now()/1000)+3600})+'.fixture',expiresIn:3600});
        localStorage.setItem('user',JSON.stringify({id:'buyer',role:'CUSTOMER',fullName:'Fixture Buyer',phoneNumber:'0901234567'}));localStorage.setItem('scanms-active-workspace','customer');
        const {GuestCheckoutModal}=await import('/src/components/checkout/GuestCheckoutModal.tsx');
        const h=React.createElement||React.default.createElement;const item={cartItemId:'fixture',productId:${JSON.stringify(productId)},variantId:${JSON.stringify(variantId)},liveSessionId:'fixture-live',title:'Fixture live shirt',sku:'SHIRT',price:250000,listPrice:300000,quantity:2,stockQuantity:10,isActive:true,imageUrl:'',store:{id:'fixture-store',name:'Fixture Shop'}};
        (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(BrowserRouter,null,h(CartProvider,null,h(ScanmsChatProvider,null,h(GuestCheckoutModal,{isOpen:true,onClose:()=>{},checkoutItems:[item]})))));
      </script></body></html>` });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(origin + '/__teacher-checkout', { waitUntil: 'domcontentloaded' });
    try { await page.waitForFunction(() => document.querySelector('.checkout-totals')?.innerText.includes('530.000')); }
    catch (error) { console.log({ paths, errors, body: await page.$eval('body', element => element.innerText) }); throw error; }
    const totals = await page.$eval('.checkout-totals', element => element.innerText);
    assert.match(totals, /600\.000/); assert.match(totals, /100\.000/);
    await page.waitForFunction(() => document.body.innerText.includes('330.000'));
    assert.equal(await page.$eval('button.checkout-submit', button => button.disabled), true);
    assert.equal(creates, 0); assert.equal(payments, 0);
    balance = 600000;
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Tải lại số dư')).click());
    await page.waitForFunction(() => document.querySelector('button.checkout-submit')?.disabled === false);
    if (!await page.$eval('#checkout-policy-agreement', input => input.checked)) await page.click('#checkout-policy-agreement');
    await page.click('button.checkout-submit');
    try { await page.waitForFunction(() => location.pathname === '/customer/orders'); }
    catch (error) { console.log({ paths, creates, payments, errors, body: await page.$eval('body', element => element.innerText) }); throw error; }
    assert.equal(creates, 1); assert.equal(payments, 1);
    assert.equal(submitted.expectedPayableVnd, 530000);
    assert.equal(submitted.items[0].quantity, 2);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
