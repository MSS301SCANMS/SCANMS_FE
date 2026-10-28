import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL, executablePath = process.env.GHN_UI_BROWSER_PATH;
test('checkout Back returns to the product or live source, and cart checkout reopens the cart', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 60000,
}, async () => {
  const origin = new URL(base).origin;
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const productId = '11111111-1111-4111-8111-111111111111', variantId = '22222222-2222-4222-8222-222222222222';
  const store = { id: 'fixture-store', name: 'Fixture Shop', isVerified: true };
  const variants = [{ id: variantId, name: 'Blue / M', sku: 'BACK-M', price: 300000, stockQuantity: 10, isActive: true }];
  const product = { id: productId, productId, sku: 'BACK-SHIRT', title: 'Back navigation shirt', price: 300000, stockQuantity: 10, canPurchase: true, isActive: true, status: 'ACTIVE', imageUrl: '/scanms-placeholder.svg', variants, store };
  const landing = { product, store, images: [], videos: [], reviews: { averageRating: 0, totalReviews: 0, items: [] }, availability: { inStock: true, stockQuantity: 10 }, policies: {} };
  const errors = [], writes = [];
  let page;
  try {
    page = await browser.newPage(); page.setDefaultTimeout(12000); await page.setViewport({ width: 1440, height: 1000 });
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
      const respond = result => request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketEnabled=()=>false;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.pathname.startsWith('/api/')) {
        if (request.method() === 'POST') writes.push(url.pathname);
        if (url.pathname.includes('/landing')) return respond(landing);
        if (url.pathname.endsWith('/stock')) return respond({ stockQuantity: 10, variants });
        if (url.pathname.endsWith('/users')) return respond({ userId: 'buyer', fullName: 'Fixture Buyer', roles: ['USER'], status: 'ACTIVE' });
        if (url.pathname.endsWith('/users/cart')) return respond({ items: [] });
        if (url.pathname.includes('/stores/')) return respond(store);
        if (url.pathname.endsWith('/capabilities')) return respond({ paymentAvailable: true });
        if (url.pathname.endsWith('/wallets/me')) return respond({ walletId: 'wallet', ownerType: 'CUSTOMER', availableBalanceVnd: 0, status: 'ACTIVE' });
        return respond([]);
      }
      if (url.pathname === '/__checkout-history') return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
        import '/src/index.css';
        const source=await(await fetch('/src/components/checkout/GuestCheckoutModal.tsx')).text();const main=await(await fetch('/src/main.tsx')).text();
        const reactModule=await import(source.match(/["]([^"]*deps.react[.]js[^"]*)["]/)[1]);const React=reactModule.default||reactModule;const dom=await import(main.match(/["]([^"]*react-dom_client[.]js[^"]*)["]/)[1]);const router=await import(source.match(/["]([^"]*react-router-dom[.]js[^"]*)["]/)[1]);const h=React.createElement;
        const appSource=await(await fetch('/src/App.tsx')).text();const query=await import(appSource.match(/["]([^"]*tanstack_react-query[^"]*)["]/)[1]);const {queryClient}=await import('/src/config/query-client.config.ts');
        const {CartProvider,useCart}=await import('/src/context/CartContext.tsx');const {ScanmsChatProvider}=await import('/src/context/ScanmsChatContext.tsx');const {CartDrawer}=await import('/src/components/cart/CartDrawer.tsx');const {GuestCheckoutModal}=await import('/src/components/checkout/GuestCheckoutModal.tsx');const {default:ProductDetailPage}=await import('/src/pages/public/ProductDetailPage.tsx');
        const session=await import('/src/services/auth-session.ts');localStorage.clear();sessionStorage.clear();const jwt=p=>btoa(JSON.stringify(p));session.saveLoginSession({accessToken:jwt({alg:'none'})+'.'+jwt({sub:'buyer',exp:Math.floor(Date.now()/1000)+3600})+'.fixture',expiresIn:3600});localStorage.setItem('user',JSON.stringify({id:'buyer',role:'CUSTOMER',fullName:'Fixture Buyer'}));
        const product=${JSON.stringify(product)},store=${JSON.stringify(store)};
        function Source(){const cart=useCart();const [instance]=React.useState(Math.random());return h('div',{id:'live-source','data-instance':instance},h('button',{id:'buy-live',onClick:()=>cart.buyNow({product,store,variantId:${JSON.stringify(variantId)}})},'Buy in live'),h('button',{id:'open-cart',onClick:cart.openCart},'Open cart'));}
        function Checkout(){const cart=useCart();return cart.isCheckoutOpen?h(GuestCheckoutModal,{isOpen:true,onClose:cart.closeCheckout,onBack:cart.returnFromCheckout,checkoutItems:cart.checkoutItems}):null;}
        function App(){return h(React.Fragment,null,h(router.Routes,null,h(router.Route,{path:'/__checkout-history',element:h('div',null,h(router.Link,{id:'product-link',to:'/products/BACK-SHIRT?campaign=keep'},'Open product'),h(router.Link,{id:'live-link',to:'/live/history-fixture'},'Open live'))}),h(router.Route,{path:'/products/:slug',element:h(ProductDetailPage)}),h(router.Route,{path:'/live/history-fixture',element:h(Source)})),h(CartDrawer),h(Checkout));}
        (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(React.StrictMode,null,h(query.QueryClientProvider,{client:queryClient},h(router.BrowserRouter,null,h(CartProvider,null,h(ScanmsChatProvider,null,h(App)))))));
      </script></body></html>` });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(origin + '/__checkout-history');
    try { await page.waitForSelector('#product-link'); }
    catch (error) { console.log({ errors, body: await page.$eval('body', node => node.innerText) }); throw error; }
    await page.click('#product-link');
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('Blue / M')));
    const clickText = text => page.evaluate(text => [...document.querySelectorAll('button')].find(button => button.textContent.includes(text)).click(), text);
    await clickText('Blue / M'); await page.click('button[aria-label="Tăng số lượng"]');
    await clickText('Mua sản phẩm này'); await page.waitForSelector('#guest-checkout-title');
    await page.waitForFunction(() => !!history.state?.usr?.scanmsCheckoutOverlay);
    await page.goBack();
    await page.waitForFunction(() => !document.querySelector('#guest-checkout-title') && !new URL(location.href).searchParams.has('checkout'));
    assert.equal(new URL(page.url()).pathname, '/products/BACK-SHIRT');
    assert.equal(new URL(page.url()).searchParams.get('campaign'), 'keep');
    assert.equal(await page.$eval('input[role="spinbutton"]', input => input.value), '2');
    await clickText('Mua sản phẩm này'); await page.waitForSelector('#guest-checkout-title');
    await page.click('button[title="Quay lại mua sắm"]');
    await page.waitForFunction(() => !document.querySelector('#guest-checkout-title') && !new URL(location.href).searchParams.has('checkout'));
    assert.equal(new URL(page.url()).pathname, '/products/BACK-SHIRT');
    await page.goBack(); await page.waitForSelector('#live-link');
    await page.click('#live-link'); await page.waitForSelector('#live-source');
    const liveInstance = await page.$eval('#live-source', node => node.dataset.instance);
    await page.click('#buy-live'); await page.waitForSelector('#guest-checkout-title');
    await page.waitForFunction(() => !!history.state?.usr?.scanmsCheckoutOverlay);
    await page.goBack(); await page.waitForFunction(() => !document.querySelector('#guest-checkout-title'));
    assert.equal(new URL(page.url()).pathname, '/live/history-fixture');
    assert.equal(await page.$eval('#live-source', node => node.dataset.instance), liveInstance);
    await page.click('#open-cart'); await page.waitForSelector('dialog[open] .scanms-cart-checkout');
    await page.waitForFunction(() => document.querySelector('.scanms-cart-checkout')?.disabled === false);
    await page.click('.scanms-cart-checkout'); await page.waitForSelector('#guest-checkout-title');
    await page.click('button[title="Quay lại mua sắm"]');
    await page.waitForSelector('dialog[open] .scanms-cart-checkout');
    assert.equal(await page.$('#guest-checkout-title'), null);
    assert.equal(new URL(page.url()).pathname, '/live/history-fixture');
    assert.equal(await page.$eval('#live-source', node => node.dataset.instance), liveInstance);
    assert.ok(!writes.some(path => /\/checkout$|\/wallet-payments$|\/top-ups$/.test(path)), 'Back never creates an order or payment');
    assert.deepEqual(errors, []);
  } catch (error) {
    console.log({ url: page?.url(), errors, body: page ? (await page.$eval('body', node => node.innerText)).slice(0, 8000) : '' });
    throw error;
  } finally { await browser.close(); }
});
