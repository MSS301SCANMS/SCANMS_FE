import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('checkout hides orphaned profiles and old address caches, isolates account changes and preserves drafts during renewal', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const address = owner => ({ id: 'address-' + owner, fullName: 'Private ' + owner, phoneNumber: owner === 'A' ? '0901111111' : '0902222222', detailAddress: 'Private street ' + owner, provinceCode: '1', districtCode: '2', wardCode: '3', provinceName: 'Province', districtName: 'District', wardName: 'Ward', isDefault: true });
  const pendingA = [], errors = [];
  let privateReads = 0, refreshes = 0;
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
    await page.evaluateOnNewDocument(oldAddress => {
      localStorage.clear();
      localStorage.setItem('user', JSON.stringify({ id: 'A', fullName: 'Private A', role: 'CUSTOMER', phoneNumber: '0901111111' }));
      localStorage.setItem('scanms_cached_addresses', JSON.stringify([oldAddress]));
    }, address('A'));
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
      const respond = result => request.respond({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ code: 200, result }) });
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketEnabled=()=>false;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.hostname === 'provinces.open-api.vn') return request.respond({ contentType: 'application/json', headers, body: JSON.stringify([{ code: 1, name: 'Province', districts: [{ code: 2, name: 'District', wards: [{ code: 3, name: 'Ward' }] }] }]) });
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname.endsWith('/auth/refresh-token')) {
          refreshes++;
          const jwt = claims => Buffer.from(JSON.stringify(claims)).toString('base64url');
          return respond({ accessToken: jwt({ alg: 'none' }) + '.' + jwt({ sub: 'B', exp: Math.floor(Date.now()/1000)+300 }) + '.fixture', refreshToken: 'B-rotated', expiresIn: 300 });
        }
        if (url.pathname.endsWith('/users')) {
          privateReads++;
          const claims = JSON.parse(Buffer.from(request.headers().authorization.split(' ')[1].split('.')[1], 'base64url'));
          const owner = claims.sub;
          const send = () => respond({ userId: owner, roles: ['USER'], fullName: 'Private ' + owner, address: JSON.stringify([address(owner)]) });
          if (owner === 'A') { pendingA.push(send); return; }
          return send();
        }
        if (url.pathname.includes('/stores/')) return respond({ storeId: 'qa-store', name: 'Test store', approvalStatus: 'APPROVED' });
        if (url.pathname.endsWith('/users/cart')) return respond({ items: [] });
        if (url.pathname.includes('capabilities')) return respond({ payosAvailable: false, sandboxEnabled: false });
        if (request.method() !== 'GET' && !url.pathname.endsWith('/users/cart') && !url.pathname.includes('quote') && !url.pathname.includes('validate-cart')) {
          errors.push('Unexpected write: ' + url.pathname);return request.abort();
        }
        return respond([]);
      }
      if (url.pathname === '/__checkout-privacy-test') return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
        import '/src/index.css';
        const source=await(await fetch('/src/components/checkout/GuestCheckoutModal.tsx')).text(); const main=await(await fetch('/src/main.tsx')).text();
        const React=await import(source.match(/["]([^"]*deps.react[.]js[^"]*)["]/)[1]); const dom=await import(main.match(/["]([^"]*react-dom_client[.]js[^"]*)["]/)[1]); const {BrowserRouter}=await import(source.match(/["]([^"]*react-router-dom[.]js[^"]*)["]/)[1]);
        const {CartProvider}=await import(source.match(/["]([^"]*CartContext[.]tsx[^"]*)["]/)[1]); const {ScanmsChatProvider}=await import(source.match(/["]([^"]*ScanmsChatContext[.]tsx[^"]*)["]/)[1]); const {GuestCheckoutModal}=await import('/src/components/checkout/GuestCheckoutModal.tsx');
        window.session=await import('/src/services/auth-session.ts');window.auth=(await import('/src/services/auth.service.ts')).authService;
        window.signIn=owner=>{const jwt=p=>btoa(JSON.stringify(p));window.session.saveLoginSession({accessToken:jwt({alg:'none'})+'.'+jwt({sub:owner,exp:Math.floor(Date.now()/1000)+300})+'.fixture',refreshToken:owner+'-refresh',expiresIn:300});localStorage.setItem('user',JSON.stringify({id:owner,fullName:'Private '+owner,role:'CUSTOMER'}));localStorage.setItem('scanms-active-workspace','customer');window.dispatchEvent(new Event('auth-user-updated'));};
        const h=React.createElement||React.default.createElement;(dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(BrowserRouter,null,h(CartProvider,null,h(ScanmsChatProvider,null,h(GuestCheckoutModal,{isOpen:true,onClose:()=>{},product:{id:'00000000-0000-4000-8000-000000000001',title:'Test product',price:200000,stockQuantity:10},store:{id:'qa-store',name:'Test store'}})))));
      </script></body></html>` });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(origin + '/__checkout-privacy-test', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#checkout-customer-name');
    assert.equal(await page.evaluate(() => window.auth.getCurrentUser()), null);
    assert.equal(await page.$eval('#checkout-customer-name', el => el.value), '');
    assert.equal(await page.$eval('#checkout-customer-phone', el => el.value), '');
    assert.equal(await page.$eval('#checkout-shipping-address', el => el.value), '');
    assert.equal(privateReads, 0, 'guest must not request a saved profile');
    await page.evaluate(() => window.signIn('A'));
    await page.waitForFunction(() => document.querySelector('#checkout-customer-name')?.value === 'Private A');
    assert.ok(pendingA.length > 0);
    await page.evaluate(() => window.signIn('B'));
    await page.waitForFunction(() => document.body.innerText.includes('Private street B'));
    for (const send of pendingA.splice(0)) await send();
    await page.waitForNetworkIdle({ idleTime: 100 });
    assert.ok(!(await page.$eval('.checkout-address', el => el.innerText)).includes('Private A'));
    await page.click('.checkout-address-change');
    await page.$eval('#checkout-shipping-address', el => { el.focus(); el.select(); });
    await page.type('#checkout-shipping-address', 'Unsubmitted B draft');
    const sessionId = await page.evaluate(() => window.session.getSessionId());
    await page.evaluate(() => window.session.forceRefreshSession());
    assert.equal(refreshes, 1);
    assert.equal(await page.evaluate(() => window.session.getSessionId()), sessionId);
    assert.equal(await page.$eval('#checkout-shipping-address', el => el.value), 'Unsubmitted B draft');
    assert.equal(await page.evaluate(() => localStorage.getItem('scanms-active-workspace')), 'customer');
    await page.evaluate(() => window.session.clearSession());
    await page.waitForFunction(() => document.querySelector('#checkout-customer-name')?.value === '');
    assert.equal(await page.$eval('#checkout-customer-phone', el => el.value), '');
    assert.equal(await page.$eval('#checkout-shipping-address', el => el.value), '');
    assert.equal(await page.evaluate(() => localStorage.getItem('scanms_cached_addresses')), null);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
