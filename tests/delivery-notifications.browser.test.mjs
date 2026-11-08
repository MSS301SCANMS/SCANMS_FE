import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL, executablePath = process.env.GHN_UI_BROWSER_PATH;
const orderId = '016ff7b6-fb13-4bcc-9e26-5cd58ffbc507', sellerId = 'parcel-one';
const target = `/customer/orders?orderId=${orderId}&sellerOrderId=${sellerId}`;
const bell = 'button[title="Thông báo SCANMS"]', panel = '#scanms-notification-panel';
const clickText = (page, text) => page.evaluate(({ panel, text }) => {
  const button = [...document.querySelectorAll(`${panel} button`)].find(button => button.textContent.trim() === text);
  if (!button) throw new Error(`Missing notification button: ${text}`);
  button.click();
}, { panel, text });

test('customer delivery bell polls Spring, persists read state, handles failures and isolates accounts', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 100000,
}, async () => {
  const origin = new URL(base).origin;
  const browser = await puppeteer.launch({ executablePath, headless: true,
    args: ['--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWebSockets'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1450, height: 950 });
  const errors = [], requests = [];
  const state = { delivered: false, read: false, broken: false, failRead: false };
  page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
  await page.evaluateOnNewDocument(() => {
    const encode = value => btoa(JSON.stringify(value));
    if (!localStorage.getItem('token')) {
      localStorage.setItem('token', `${encode({ alg: 'none' })}.${encode({ sub: 'buyer', exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture`);
      localStorage.setItem('user', JSON.stringify({ id: 'buyer', identitySubject: 'buyer', fullName: 'Khách thử', role: 'CUSTOMER', roles: ['CUSTOMER'] }));
      localStorage.setItem('scanms-active-workspace', 'customer');
    }
  });
  await page.setRequestInterception(true);
  page.on('request', request => { void (async () => {
    const url = new URL(request.url());
    const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type',
      'Access-Control-Allow-Methods': 'GET,PATCH,POST,OPTIONS' };
    const reply = (result, status = 200) => request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, result, message: 'Success' }) });
    if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
    if (url.pathname.includes('/api/')) {
      const token = (request.headers().authorization || '').replace(/^Bearer /, '');
      const actor = token ? JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub : '';
      if (url.pathname.includes('/notifications')) {
        requests.push(`${request.method()} ${url.pathname}`);
        if (state.broken) return reply(null, 503);
        if (request.method() === 'PATCH') {
          if (state.failRead) return reply(null, 503);
          state.read = true; return reply(null);
        }
        const mine = actor === 'buyer' && state.delivered;
        const unreadCount = mine && !state.read ? 1 : 0;
        const counts = { unreadCount, categoryUnreadCounts: { ORDER: unreadCount, PROMOTION: 0, SYSTEM: 0 } };
        if (url.pathname.endsWith('/unread-count')) return reply(counts);
        const category = url.searchParams.get('category');
        const items = mine && ['ALL', 'ORDER', null].includes(category) ? [{ id: `delivery-${sellerId}`, userId: 'buyer', type: 'ORDER_DELIVERED',
          title: 'Đơn hàng đã giao thành công', message: 'Đơn đã giao. Vào Đơn mua để kiểm tra và xác nhận đã nhận hàng.',
          data: { orderId, sellerOrderId: sellerId, actionUrl: target }, isRead: state.read, createdAt: new Date().toISOString() }] : [];
        return reply({ ...counts, items, total: items.length, page: 1, limit: 20, totalPages: 1 });
      }
      if (url.pathname.endsWith('/users')) return reply({ userId: actor, identitySubject: actor, fullName: actor, status: 'ACTIVE', roles: ['CUSTOMER'] });
      if (url.pathname.endsWith('/cart')) return reply({ items: [] });
      if (url.pathname.endsWith('/public/products') || url.pathname.endsWith('/public/stores')) return reply({ items: [], pagination: { totalPages: 1 } });
      return reply([]);
    }
    if (request.isNavigationRequest() && request.frame() === page.mainFrame() && url.origin === origin) return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
      import '/src/index.css';const source=await(await fetch('/src/pages/chat/ChatBoxPage.tsx')).text();
      const reactModule=await import(source.match(/["]([^"]*deps.react[.]js[^"]*)["]/)[1]);const React=reactModule.default||reactModule;
      const main=await(await fetch('/src/main.tsx')).text();const dom=await import(main.match(/["]([^"]*react-dom_client[.]js[^"]*)["]/)[1]);
      const {default:App}=await import('/src/App.tsx');(dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(React.createElement(App));
    </script></body></html>` });
    if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
    return request.continue();
  })().catch(error => { errors.push(error.message); if (!request.isInterceptResolutionHandled()) void request.abort(); }); });
  try {
    await page.goto(`${origin}/marketplace`);
    await page.waitForSelector(bell);
    await page.click(bell);
    await clickText(page, 'Đơn hàng');
    await page.waitForFunction(panel => document.querySelector(panel)?.innerText.includes('Chưa có thông báo'), {}, panel);
    state.delivered = true;
    // Leave the panel open: the periodic poll must add the delivery without reload or focus events.
    await page.waitForSelector('[data-notification-id="delivery-parcel-one"][data-read="false"]', { timeout: 18000 });
    assert.match(await page.$eval(bell, el => el.getAttribute('aria-label')), /1 chưa đọc/);
    assert.equal(await page.$(`${panel} .animate-ping`), null, 'DELIVERED must not render as LIVE');
    state.failRead = true;
    await page.click('.scanms-notification-open');
    await page.waitForFunction(panel => document.querySelector(panel)?.innerText.includes('Chưa lưu được trạng thái đã đọc'), {}, panel);
    assert.equal(new URL(page.url()).pathname, '/marketplace');
    assert.equal(state.read, false);
    await clickText(page, 'Đọc tất cả');
    assert.match(await page.$eval(bell, el => el.getAttribute('aria-label')), /1 chưa đọc/);
    state.failRead = false;
    await page.click('.scanms-notification-open');
    await page.waitForFunction(target => location.pathname + location.search === target, {}, target);
    assert.equal(state.read, true);
    assert.ok(requests.includes('PATCH /api/v1/notifications/delivery-parcel-one/read'), 'delivery must persist its read receipt on Spring, not local live storage');
    await page.goto(`${origin}/marketplace`);
    await page.waitForSelector(bell);
    await page.click(bell);
    await page.waitForSelector('[data-notification-id="delivery-parcel-one"][data-read="true"]');
    assert.doesNotMatch(await page.$eval(bell, el => el.getAttribute('aria-label')), /1 chưa đọc/);
    await page.screenshot({ path: 'D:/MSS301/.validation/delivery-notification-20261108.png' });
    await page.evaluate(() => {
      const encode = value => btoa(JSON.stringify(value));
      localStorage.setItem('token', `${encode({ alg: 'none' })}.${encode({ sub: 'other-buyer', exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture`);
      localStorage.setItem('user', JSON.stringify({ id: 'other-buyer', identitySubject: 'other-buyer', fullName: 'Other', role: 'CUSTOMER', roles: ['CUSTOMER'] }));
      window.dispatchEvent(new Event('auth-user-updated'));
    });
    await page.waitForFunction(panel => !document.querySelector(panel), {}, panel);
    state.broken = true;
    await page.click(bell);
    await page.waitForFunction(panel => document.querySelector(panel)?.innerText.includes('Chưa tải được thông báo'), {}, panel);
    assert.equal(await page.$('[data-notification-id="delivery-parcel-one"]'), null);
    assert.equal(await page.$eval(panel, el => el.innerText.includes('Chưa có thông báo')), false, 'service failure must not masquerade as empty');
    state.broken = false;
    await clickText(page, 'Thử tải lại');
    await page.waitForFunction(panel => document.querySelector(panel)?.innerText.includes('Chưa có thông báo'), {}, panel);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
