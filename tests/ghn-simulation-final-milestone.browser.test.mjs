import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('simulation ticks the final milestone only after API confirmation, using server time', { skip: !base || !existsSync(executablePath), timeout: 30000 }, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let due, polls = 0, confirmed = false;
    // The API clock is one hour behind this device. Its relative event timing
    // must still work, and a zero countdown alone must not tick delivery.
    const skew = 3600000;
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/__ghn-final-qa') return request.respond({ status: 200, contentType: 'text/html', body: `<html><head><script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script></head><body><div id="root"></div><script type="module">
        import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {GhnTrackingTimeline} from '/src/components/shipping/GhnTrackingTimeline.tsx';import '/src/index.css';
        window.changes=[];ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(GhnTrackingTimeline,{orderCode:'QA-FINAL',environment:'TEST',onTrackingStatusChange:(status,fresh)=>window.changes.push({status,fresh})}));
      </script></body></html>` });
      if (url.pathname === '/@vite/client') return request.respond({ status: 200, contentType: 'application/javascript', body: 'export const createHotContext=()=>({accept(){},dispose(){},on(){},off(){},send(){},invalidate(){},prune(){},data:{}});export const injectQuery=url=>url;const styles=new Map();export function updateStyle(id,css){let el=styles.get(id);if(!el){el=document.createElement("style");document.head.appendChild(el);styles.set(id,el);}el.textContent=css;}export function removeStyle(id){styles.get(id)?.remove();styles.delete(id);}' });
      if (url.pathname === '/api/shipping/ghn/track/QA-FINAL') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization', 'Access-Control-Allow-Methods': 'GET,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        assert.equal(request.method(), 'GET');
        polls++;
        const now = Date.now() - skew;
        due ??= now + 2200;
        // First refresh at the milestone is deliberately still awaiting confirmation.
        confirmed = now >= due && polls >= 3;
        const statuses = ['ready_to_pick', 'picked', 'storing', 'delivering', 'delivered'];
        const data = { orderCode: 'QA-FINAL', environment: 'TEST', isSimulation: true, isStale: false,
          status: confirmed ? 'delivered' : 'delivering', statusText: confirmed ? 'Giao hàng thành công' : 'Shipper đang đi giao',
          expectedDeliveryTime: new Date(due).toISOString(), nextEventAt: confirmed ? null : new Date(due).toISOString(),
          lastCheckedAt: new Date(now).toISOString(), shipperName: 'Shipper thử nghiệm', shipperPhone: null,
          timeline: statuses.slice(0, confirmed ? 5 : 4).map((status, index) => ({ status, title: status, time: new Date(due - (4 - index) * 60000).toISOString() })) };
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(`${origin}/__ghn-final-qa`);
    await page.waitForSelector('.ghn-journey__steps');
    assert.equal(await page.$eval('.ghn-journey__step:last-child', el => el.classList.contains('is-confirmed')), false);
    await page.waitForFunction(() => document.querySelector('[role=timer]').textContent.includes('Mốc tiếp theo sau'));
    await page.waitForFunction(() => document.querySelector('.ghn-journey__step:last-child')?.classList.contains('is-confirmed'));
    assert.ok(confirmed);
    assert.ok(polls >= 3);
    assert.equal(await page.$eval('[role=timer]', el => el.textContent), 'Đã hoàn tất');
    assert.equal(await page.$eval('.ghn-journey__status h4', el => el.textContent), 'Giao hàng thành công');
    assert.deepEqual((await page.evaluate(() => window.changes)).at(-1), { status: 'delivered', fresh: true });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
