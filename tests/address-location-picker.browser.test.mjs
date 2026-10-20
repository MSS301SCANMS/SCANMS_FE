import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('address map recovers from unavailable tiles/geocoder and explains denied device location', { skip: !base || !existsSync(executablePath), timeout: 60000 }, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(12000);
    const errors = [], fallbackTiles = [];
    let failTiles = false;
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      window.__geoMode = 'success';
      Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(success, failure) {
        if (window.__geoMode === 'denied') failure({ code: 1, PERMISSION_DENIED: 1 });
        else if (window.__geoMode !== 'pending') success({ coords: { latitude: 10.8231, longitude: 106.6297, accuracy: 50 } });
      } } });
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/@vite/client') return request.respond({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext=()=>({accept(){},dispose(){},on(){},off(){},send(){},invalidate(){},prune(){},data:{}});export const injectQuery=(url)=>url;const styles=new Map();export function updateStyle(id,css){let el=styles.get(id);if(!el){el=document.createElement("style");document.head.appendChild(el);styles.set(id,el);}el.textContent=css;}export function removeStyle(id){styles.get(id)?.remove();styles.delete(id);}' });
      if (url.pathname === '/__address-map-qa') return request.respond({ status: 200, contentType: 'text/html', body: `<html><head><script type="module">import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script></head><body><div id="root"></div><script type="module">
        import React from '/node_modules/.vite/deps/react.js';
        import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
        import {AddressLocationPicker} from '/src/components/customer/AddressLocationPicker.tsx';
        import '/src/index.css';
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement('div',{style:{width:'min(720px,100%)',padding:16}},React.createElement(AddressLocationPicker,{addressQuery:'Phan Huy Ich, Ho Chi Minh, Viet Nam',onChange:result=>{window.__picked=result;}})));
      </script></body></html>` });
      if (url.hostname === 'tile.openstreetmap.org' || url.hostname === 'nominatim.openstreetmap.org') return request.abort('namenotresolved');
      if (url.hostname.endsWith('tile.openstreetmap.fr')) {
        fallbackTiles.push(url.pathname);
        if (failTiles) return request.abort();
        if (process.env.MAP_QA_LIVE_TILES === '1') return request.continue();
        return request.respond({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64') });
      }
      if (url.hostname === 'photon.komoot.io') return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ features: [{ geometry: { coordinates: [106.6297, 10.8231] }, properties: { countrycode: 'VN', country: 'Việt Nam', city: 'Thành phố Hồ Chí Minh', name: 'Phan Huy Ích', type: 'street' } }] }) });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.setViewport({ width: 900, height: 700 });
    await page.goto(`${origin}/__address-map-qa`);
    await page.waitForSelector('.address-location-locate').catch(error => { throw new Error(`${error.message}: ${errors.join('; ')}`); });
    await page.waitForFunction(() => [...document.querySelectorAll('.leaflet-tile')].some(tile => tile.src.includes('openstreetmap.fr') && tile.complete && tile.naturalWidth > 0));
    assert.ok(fallbackTiles.length > 0);
    await page.click('.address-location-locate');
    await page.waitForFunction(() => Boolean(window.__picked));
    const result = await page.evaluate(() => window.__picked);
    assert.equal(result.latitude, 10.8231);
    assert.equal(result.longitude, 106.6297);
    assert.equal(result.detailAddress, 'Phan Huy Ích');
    await page.waitForSelector('.leaflet-marker-icon');
    await page.evaluate(() => { window.__geoMode = 'denied'; });
    await page.click('.address-location-locate');
    await page.waitForFunction(() => document.querySelector('.address-location-header').textContent.includes('Bạn chưa cho phép'));
    assert.equal(await page.$eval('.address-location-locate', el => el.disabled), false);
    await page.evaluate(() => { window.__geoMode = 'pending'; });
    await page.click('.address-location-locate');
    await page.waitForFunction(() => document.querySelector('.address-location-header').textContent.includes('Chưa nhận được vị trí'), { timeout: 16000 });
    assert.equal(await page.$eval('.address-location-locate', el => el.disabled), false);
    // Search still works after permission denial/pending requests and uses the fallback provider.
    await page.evaluate(() => document.querySelector('.address-location-actions button').click());
    await page.waitForFunction(() => document.querySelector('.address-location-header').textContent.includes('Đã đặt ghim theo địa chỉ'));
    failTiles = true;
    await page.click('.leaflet-control-zoom-in');
    await page.waitForSelector('.address-location-header [role=alert]');
    failTiles = false;
    await page.click('.address-location-header [role=alert] button');
    await page.waitForFunction(() => !document.querySelector('.address-location-header [role=alert]'));
    await page.setViewport({ width: 390, height: 700 });
    assert.ok(await page.$eval('.leaflet-container', el => el.clientWidth > 0 && el.clientHeight >= 224));
    await page.waitForFunction(() => {
      const map = document.querySelector('.leaflet-container').getBoundingClientRect();
      const visible = [...document.querySelectorAll('.leaflet-tile')].filter(tile => {
        const rect = tile.getBoundingClientRect();
        return rect.right > map.left && rect.left < map.right && rect.bottom > map.top && rect.top < map.bottom;
      });
      return visible.length > 0 && visible.every(tile => tile.complete && tile.naturalWidth > 0 && getComputedStyle(tile).opacity === '1' && getComputedStyle(tile.parentElement).opacity === '1');
    });
    await page.screenshot({ path: join(tmpdir(), 'scanms-address-location-qa.png') });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
