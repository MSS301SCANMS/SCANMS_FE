import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL, executablePath = process.env.GHN_UI_BROWSER_PATH;
test('customer submits a reason and shop approves cancellation through real API clients', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 35000,
}, async () => {
  const origin = new URL(base).origin, calls = [], errors = [];
  const browser = await puppeteer.launch({ executablePath, headless: true });
  let cancellation;
  try {
    const page = await browser.newPage(); page.setDefaultTimeout(10000);
    page.on('pageerror', error => { if (error.message !== 'WebSocket closed without opened.') errors.push(error.message); });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.pathname.startsWith('/api/')) {
        if (request.method() === 'POST') {
          const input = JSON.parse(request.postData()); calls.push({ path: url.pathname, input });
          if (url.pathname.endsWith('/orders/order-fixture/cancellation')) cancellation = { state: 'REQUESTED', reason: input.reason };
          if (url.pathname.endsWith('/seller-orders/seller-fixture/cancellation/decision')) {
            assert.equal(input.approved, true);
            cancellation = { ...cancellation, state: 'CANCELLED', refundStatus: 'PENDING' };
          }
        }
        return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result: cancellation || {} }) });
      }
      if (url.pathname === '/__cancellation-test') return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
        const source=await(await fetch('/src/components/orders/ShopCancellationPanel.tsx')).text();const main=await(await fetch('/src/main.tsx')).text();
        const ReactModule=await import(source.match(/["]([^"]*deps.react[.]js[^"]*)["]/)[1]);const React=ReactModule.default||ReactModule;const dom=await import(main.match(/["]([^"]*react-dom_client[.]js[^"]*)["]/)[1]);const h=React.createElement;
        const session=await import('/src/services/auth-session.ts');const jwt=p=>btoa(JSON.stringify(p));session.saveLoginSession({accessToken:jwt({alg:'none'})+'.'+jwt({sub:'buyer',exp:Math.floor(Date.now()/1000)+3600})+'.fixture',expiresIn:3600});
        const {CustomerCancelOrderModal}=await import('/src/components/customer/CustomerCancelOrderModal.tsx');const {ShopCancellationPanel}=await import('/src/components/orders/ShopCancellationPanel.tsx');const {OrderCancellationNotice}=await import('/src/components/orders/OrderCancellationNotice.tsx');const {customerService}=await import('/src/services/customer.service.ts');
        function App(){const [state,setState]=React.useState(null),[busy,setBusy]=React.useState(false);return state?h('div',null,h(ShopCancellationPanel,{sellerOrderId:'seller-fixture',cancellation:state,onUpdated:()=>setState({...state,state:'CANCELLED',refundStatus:'PENDING'})}),h(OrderCancellationNotice,{cancellation:state})):h(CustomerCancelOrderModal,{busy,onClose:()=>{},onConfirm:async reason=>{setBusy(true);try{setState(await customerService.cancelOrder('order-fixture',reason))}finally{setBusy(false)}}});}
        (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(App));
      </script></body></html>` });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(origin + '/__cancellation-test');
    await page.waitForSelector('button[type="submit"]');
    assert.equal(await page.$eval('button[type="submit"]', button => button.disabled), true);
    await page.click('input[value="OTHER"]');
    await page.type('textarea', 'Tôi đặt nhầm phân loại');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => document.body.innerText.includes('Đang chờ shop duyệt'));
    const click = text => page.evaluate(text => [...document.querySelectorAll('button')].find(button => button.textContent === text).click(), text);
    await click('Từ chối hủy');
    await page.waitForSelector('[role="alert"]');
    assert.equal(calls.length, 1, 'empty rejection must not reach the API');
    await click('Đồng ý hủy');
    await page.waitForFunction(() => document.body.innerText.includes('Đơn đã hủy'));
    assert.match(await page.$eval('body', body => body.innerText), /ví SCANMS/);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].input.reason, 'Tôi đặt nhầm phân loại');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
