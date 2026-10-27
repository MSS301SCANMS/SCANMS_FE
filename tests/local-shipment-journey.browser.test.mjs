import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('local shipment has compact code, responsive milestones and functional start and complete controls', { skip: !base || !existsSync(executablePath), timeout: 25000 }, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const code = 'SIM-2d57650f-9d8f-4ff2-98a7-5cab95afcee3';
  let state = 'shipped'; const writes = [], errors = [];
  const tracking = () => ({ orderCode: code, environment: 'TEST', simulationAvailable: state !== 'delivered', isSimulation: state === 'in_transit', status: state, timeline: [{ status: state, time: '2026-10-26T13:00:00Z' }] });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(7000);
    await page.evaluateOnNewDocument(() => { localStorage.setItem('token', 'local-tracking-fixture'); localStorage.setItem('user', JSON.stringify({ id: 'test-shop', role: 'SHOP_OWNER' })); });
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed')) errors.push(error.message); });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return void request.respond({ status: 204, headers });
        if (request.method() === 'POST') { writes.push(url.pathname); state = url.pathname.endsWith('/start') ? 'in_transit' : 'delivered'; }
        return void request.respond({ headers, contentType: 'application/json', body: JSON.stringify({ result: tracking() }) });
      }
      if (url.pathname === '/__local-tracking-test') return void request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
        import '/src/index.css';
        const source=await(await fetch('/src/components/shipping/LocalShipmentJourney.tsx')).text();const main=await(await fetch('/src/main.tsx')).text();
        const React=await import(source.match(/["]([^"]*deps.react[.]js[^"]*)["]/)[1]);const dom=await import(main.match(/["]([^"]*react-dom_client[.]js[^"]*)["]/)[1]);
        const {GhnTrackingTimeline}=await import('/src/components/shipping/GhnTrackingTimeline.tsx');const {ShippingSimulationControls}=await import('/src/components/shipping/ShippingSimulationControls.tsx');
        const h=React.createElement||React.default.createElement;
        function App(){const [tracking,setTracking]=(React.useState||React.default.useState)(${JSON.stringify(tracking())});return h('main',{style:{maxWidth:540,padding:20,margin:'20px auto',background:'#fff',border:'1px solid #EAE4D7',borderRadius:18}},h('h3',null,'Theo dõi bưu kiện'),h(GhnTrackingTimeline,{key:tracking.status,orderCode:'${code}',environment:'TEST'}),h(ShippingSimulationControls,{orderId:'test-seller',tracking,onStarted:setTracking,onCompleted:()=>setTracking({...tracking,status:'delivered',simulationAvailable:false})}));}
        (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(App));
      </script></body></html>` });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return void request.abort();
      void request.continue();
    });
    await page.setViewport({ width: 760, height: 850 });
    await page.goto(`${origin}/__local-tracking-test`);
    await page.waitForFunction(() => document.querySelector('.local-shipment') || document.body.innerText.includes('Chưa tải'), { timeout: 7000 }).catch(async error => { throw new Error(JSON.stringify({ errors, text: await page.evaluate(() => document.body.innerText) }) + error.message); });
    await page.waitForSelector('.local-shipment__steps [aria-current="step"]');
    assert.equal(await page.$eval('.local-shipment__code code', e => e.textContent), 'SIM-2D57650F9D8F');
    assert.equal(await page.$eval('.local-shipment__steps [aria-current="step"] strong', e => e.textContent), 'Shop đã gửi hàng');
    mkdirSync('.qa-artifacts', { recursive: true });
    await page.screenshot({ path: '.qa-artifacts/local-shipment-desktop.png' });
    await page.setViewport({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: '.qa-artifacts/local-shipment-mobile.png' });
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Bắt đầu mô phỏng')).click());
    await page.waitForFunction(() => document.querySelector('.local-shipment__steps [aria-current="step"] strong')?.textContent === 'Đang vận chuyển');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Xác nhận giao thử')).click());
    await page.waitForFunction(() => document.querySelector('.local-shipment__status')?.textContent.includes('Giao thành công'));
    assert.equal(await page.$('[aria-label="Kiểm thử giao vận"]'), null);
    assert.deepEqual(writes, ['/api/v1/commerce/seller-orders/test-seller/simulation/start', '/api/v1/commerce/seller-orders/test-seller/simulation/complete']);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
