import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH;

test('verified review binds purchased lines, excludes reviewed lines and preserves content for a retry', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 40000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const bodies = [], errors = [];
  let release, page;
  try {
    page = await browser.newPage();
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      localStorage.setItem('token', 'review-fixture-no-server-access');
      localStorage.setItem('user', JSON.stringify({ id: 'review-buyer', role: 'CUSTOMER' }));
    });
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = new URL(request.url());
      const headers = {
        'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,authorization,x-skip-cache',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      };
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname.endsWith('/feedbacks') && request.method() === 'POST') {
          bodies.push(JSON.parse(request.postData()));
          if (bodies.length === 1) {
            await new Promise(resolve => { release = resolve; });
            return request.respond({ status: 500, headers, contentType: 'application/json', body: JSON.stringify({ code: 500, message: 'Review fixture failure' }) });
          }
          return request.respond({ status: 201, headers, contentType: 'application/json', body: JSON.stringify({ code: 201, result: { feedbackId: 'saved-review' } }) });
        }
        return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result: [] }) });
      }
      if (url.pathname === '/__verified-review-test') return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
        import '/src/index.css';
        const source=await(await fetch('/src/components/customer/VerifiedReviewModal.tsx')).text();
        const main=await(await fetch('/src/main.tsx')).text();
        const React=await import(source.match(/["]([^"]*deps.react[.]js[^"]*)["]/)[1]);
        const dom=await import(main.match(/["]([^"]*react-dom_client[.]js[^"]*)["]/)[1]);
        const {VerifiedReviewModal}=await import('/src/components/customer/VerifiedReviewModal.tsx');
        const apiSource=await(await fetch('/src/services/api.ts')).text();
        const {apiCache}=await import(apiSource.match(/["]([^"]*api-cache[.]utils[.]ts[^"]*)["]/)[1]);
        window.reviewCache=apiCache;
        apiCache.set('/public/products/same-shirt/landing',undefined,{reviews:{totalReviews:0}});
        apiCache.set('/stores/test-shop',undefined,{ratingCount:0});
        const h=React.createElement||React.default.createElement;
        const root=(dom.createRoot||dom.default.createRoot)(document.getElementById('root'));
        window.renderReview=(allReviewed=false)=>root.render(h(VerifiedReviewModal,{key:allReviewed?'done':'open',order:{id:'review-order',productReviews:(allReviewed?['line-reviewed','line-small','line-large']:['line-reviewed']).map(orderItemId=>({orderItemId})),orderItems:[{id:'line-reviewed',productId:'another-shirt',product:{title:'Already reviewed shirt'}},{id:'line-small',productId:'same-shirt',product:{title:'Test shirt size S'}},{id:'line-large',productId:'same-shirt',product:{title:'Test shirt size L'}}]},onClose:()=>{window.closed=true},onSubmitted:()=>{window.submitted=true}}));
        window.renderReview();
      </script></body></html>` });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(origin + '/__verified-review-test', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('textarea');
    await page.click('[aria-haspopup="listbox"]');
    assert.deepEqual(await page.$$eval('[role="option"]', options => options.map(e => e.textContent.trim())), ['Test shirt size S', 'Test shirt size L']);
    await page.evaluate(() => [...document.querySelectorAll('[role="option"]')].find(e => e.textContent.includes('size L')).click());
    const comment = 'A real purchased shirt review for the retry test.';
    await page.type('textarea', comment);
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => document.querySelector('button[type="submit"]').disabled);
    assert.equal(bodies.length, 1);
    await page.$eval('form', form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(bodies.length, 1, 'An in-flight review must not be submitted twice');
    release();
    await page.waitForFunction(() => !document.querySelector('button[type="submit"]').disabled);
    assert.equal(await page.$eval('textarea', input => input.value), comment);
    assert.equal(await page.evaluate(() => !!window.submitted), false);
    assert.ok(await page.evaluate(() => window.reviewCache.get('/public/products/same-shirt/landing')));
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.submitted);
    assert.equal(bodies.length, 2);
    assert.deepEqual(bodies[1], { productId: 'same-shirt', orderItemId: 'line-large', rating: 5, comment, imageRefs: [] });
    assert.equal(await page.evaluate(() => window.reviewCache.get('/public/products/same-shirt/landing')), null);
    assert.equal(await page.evaluate(() => window.reviewCache.get('/stores/test-shop')), null);
    await page.evaluate(() => window.renderReview(true));
    await page.waitForFunction(() => !document.querySelector('textarea'));
    assert.equal(await page.$('button[type="submit"]'), null);
    assert.deepEqual(errors, []);
  } catch (error) {
    console.error('Verified review fixture:', errors, await page?.evaluate(() => document.body.innerText.slice(-1000)));
    throw error;
  } finally {
    release?.();
    await browser.close();
  }
});
