import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('checkout map fills nationwide address, requotes shipping, saves coordinates and ignores stale lookups', {
  skip: !base || !existsSync(executablePath), timeout: 40000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const saved = { id: 'saved-address', fullName: 'Khách kiểm thử', phoneNumber: '0900000000', detailAddress: '10 Đường cũ', provinceCode: '79', districtCode: '769', wardCode: '1', provinceName: 'Thành phố Hồ Chí Minh', districtName: 'Thành phố Thủ Đức', wardName: 'Phường Phước Long B', latitude: 10.82, longitude: 106.63, isDefault: true };
  const provinces = [
    { code: 79, name: saved.provinceName, districts: [{ code: 769, name: saved.districtName, wards: [{ code: 1, name: saved.wardName }] }] },
    { code: 1, name: 'Thành phố Hà Nội', districts: [{ code: 2, name: 'Quận Hoàn Kiếm', wards: [{ code: 3, name: 'Phường Hàng Bạc' }] }] },
  ];
  const result = { lat: '21.033039448', lon: '105.850813376', display_name: '15 Hàng Bạc, Hà Nội, Việt Nam', address: { country_code: 'vn', state: 'Hà Nội', city_district: 'Hoàn Kiếm', suburb: 'Hàng Bạc', house_number: '15', road: 'Hàng Bạc' } };
  const addresses = [saved], quotes = [], writes = [], errors = [];
  let mapMode = 'match', pendingResponse, failDirectory = true, reverseRequests = 0;
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(7000);
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('scanms_analytics_consent', 'denied');
      if (!new URL(location.href).searchParams.has('guest')) {
        localStorage.setItem('token', 'qa-map-no-server-access');
        localStorage.setItem('user', JSON.stringify({ id: 'qa-customer', fullName: 'Khách kiểm thử', role: 'CUSTOMER' }));
      } else localStorage.clear();
      Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(success) { success({ coords: { latitude: 21.033, longitude: 105.85 } }); } } });
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
      const respond = (data, status = 200) => request.respond({ status, contentType: 'application/json', headers, body: JSON.stringify(data) });
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.hostname === 'provinces.open-api.vn') {
        if (failDirectory) { failDirectory = false; return respond({}, 503); }
        return respond(provinces);
      }
      if (url.hostname === 'nominatim.openstreetmap.org') {
        if (url.pathname === '/reverse') reverseRequests++;
        const payload = mapMode === 'partial' ? { ...result, address: { ...result.address, suburb: 'Phường mới chưa có trong danh mục' } } : result;
        const send = () => respond(url.pathname === '/search' ? [payload] : payload);
        if (mapMode === 'pending') { pendingResponse = send; return; }
        return send();
      }
      if (url.hostname.includes('tile.openstreetmap')) return request.respond({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64') });
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        let data = [];
        if (url.pathname.includes('/stores/public/id/')) data = { id: 'qa-store', name: 'Shop kiểm thử', policyReturn: 'Đổi trả 14 ngày' };
        if (url.pathname === '/api/customer/addresses') {
          if (request.method() === 'POST') {
            const body = JSON.parse(request.postData()); writes.push(body);
            const address = { ...body, id: `saved-${writes.length}` }; addresses.push(address);
            return respond({ success: true, data: { address } });
          }
          data = addresses;
        }
        if (url.pathname === '/api/shipping/ghn/quote-address') { quotes.push(JSON.parse(request.postData())); data = { totalFee: 21001 }; }
        if (url.pathname === '/api/orders') throw new Error('Must not place real orders');
        return respond({ success: true, data });
      }
      if (url.pathname === '/__checkout-map-test') return request.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
        import '/src/index.css';
        const source=await(await fetch('/src/components/checkout/GuestCheckoutModal.tsx')).text(); const version=source.match(/react[.]js([?]v=[^"]+)/)?.[1]||'';
        const React=await import('/node_modules/.vite/deps/react.js'+version); const dom=await import('/node_modules/.vite/deps/react-dom_client.js'+version); const {BrowserRouter}=await import('/node_modules/.vite/deps/react-router-dom.js'+version);
        const {CartProvider}=await import(source.match(/["]([^"]*CartContext[.]tsx[^"]*)["]/)[1]); const {ScanmsChatProvider}=await import(source.match(/["]([^"]*ScanmsChatContext[.]tsx[^"]*)["]/)[1]); const {GuestCheckoutModal}=await import('/src/components/checkout/GuestCheckoutModal.tsx');
        const h=React.createElement||React.default.createElement; (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(BrowserRouter,null,h(CartProvider,null,h(ScanmsChatProvider,null,h(GuestCheckoutModal,{isOpen:true,onClose:()=>{},product:{id:'00000000-0000-4000-8000-000000000001',title:'Sản phẩm kiểm thử',price:200000,stockQuantity:10},store:{id:'qa-store',name:'Shop kiểm thử'}})))));
      </script></body></html>` });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(`${origin}/__checkout-map-test`, { waitUntil: 'domcontentloaded' });
    const clickText = text => page.evaluate(text => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === text)?.click(), text);
    await page.waitForSelector('.checkout-address-change');
    await page.click('.checkout-address-change');
    await page.waitForSelector('.address-location-map .leaflet-marker-icon');
    await page.waitForFunction(() => document.body.innerText.includes('Tải lại danh mục'));
    await clickText('Tải lại danh mục');
    await page.waitForFunction(() => document.querySelector('#checkout-province')?.textContent.includes('Hồ Chí Minh'));
    await page.type('#checkout-shipping-address', ' mới');
    await page.waitForFunction(() => !document.querySelector('.leaflet-marker-icon'));
    await page.$eval('.address-location-actions button', el => el.click());
    await page.waitForFunction(() => document.querySelector('#checkout-province')?.textContent.includes('Hà Nội'));
    assert.equal(await page.$eval('#checkout-shipping-address', el => el.value), '15, Hàng Bạc');
    assert.match(await page.$eval('#checkout-district', el => el.textContent), /Hoàn Kiếm/);
    assert.match(await page.$eval('#checkout-ward', el => el.textContent), /Hàng Bạc/);
    await page.waitForFunction(() => document.body.innerText.includes('221.001'));
    assert.match(quotes.at(-1).address, /15, Hàng Bạc, Phường Hàng Bạc, Quận Hoàn Kiếm, Thành phố Hà Nội/);
    await clickText('Lưu vào sổ địa chỉ ngay');
    await page.waitForFunction(() => document.body.innerText.includes('Đang dùng'));
    assert.equal(writes[0].latitude, 21.033039448);
    assert.equal(writes[0].longitude, 105.850813376);
    assert.equal(writes[0].provinceCode, '1');

    mapMode = 'partial';
    await page.$eval('.address-location-locate', el => el.click());
    await page.waitForFunction(() => document.body.innerText.includes('Một số địa danh chưa khớp'));
    assert.doesNotMatch(await page.$eval('#checkout-ward', el => el.textContent), /Phường Hàng Bạc/);
    assert.match(await page.$eval('.checkout-totals', el => el.textContent), /Chờ tính phí ship/);

    mapMode = 'pending';
    await page.$eval('.address-location-actions button', el => el.click());
    for (let i = 0; i < 30 && !pendingResponse; i++) await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(pendingResponse);
    await page.type('#checkout-shipping-address', ' địa chỉ tự nhập');
    const manual = await page.$eval('#checkout-shipping-address', el => el.value);
    await pendingResponse();
    await page.waitForNetworkIdle({ idleTime: 200 });
    assert.equal(await page.$eval('#checkout-shipping-address', el => el.value), manual, 'late map response cannot overwrite a manual edit');
    assert.equal(await page.$('.leaflet-marker-icon'), null);

    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.$eval('.address-location-picker', el => el.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: join(tmpdir(), 'scanms-checkout-address-map-mobile.png') });
    assert.ok(await page.$eval('.scanms-checkout', el => el.scrollWidth <= el.clientWidth), await page.evaluate(() => JSON.stringify([...document.querySelectorAll('.scanms-checkout *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 10).map(el => ({ tag: el.tagName, cls: el.className, width: el.getBoundingClientRect().width, text: el.textContent.slice(0,80) })))));

    await page.goto(`${origin}/__checkout-map-test?guest=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.address-location-locate');
    mapMode = 'match';
    await page.$eval('.address-location-locate', el => el.click());
    await page.waitForFunction(() => document.querySelector('#checkout-province')?.textContent.includes('Hà Nội')).catch(async error => { throw new Error(`${error.message}: ${errors.join('; ')} ${await page.$eval('.checkout-address', el => el.innerText)}`); });
    assert.equal(await page.$eval('#checkout-shipping-address', el => el.value), '15, Hàng Bạc');
    const beforePick = reverseRequests;
    await page.click('.leaflet-container', { offset: { x: 120, y: 100 } });
    await page.waitForNetworkIdle({ idleTime: 1200 });
    assert.ok(reverseRequests > beforePick, 'clicking the map reverse geocodes the chosen position');
    const marker = await page.$('.leaflet-marker-icon');
    const markerBox = await marker.boundingBox();
    const beforeDrag = reverseRequests;
    await page.mouse.move(markerBox.x + 17, markerBox.y + 17);
    await page.mouse.down();
    await page.mouse.move(markerBox.x + 65, markerBox.y + 40, { steps: 8 });
    await page.mouse.up();
    await page.waitForNetworkIdle({ idleTime: 1200 });
    assert.ok(reverseRequests > beforeDrag, 'dragging the marker reverse geocodes its new position');
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.$eval('.address-location-picker', el => el.scrollIntoView({ block: 'center' }));
    await page.screenshot({ path: join(tmpdir(), 'scanms-checkout-address-map-desktop.png') });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
