import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL, executablePath = process.env.GHN_UI_BROWSER_PATH;

test('shop can start early or after the appointment and broadcasts the new end time', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 70000,
}, async () => {
  const origin = new URL(base).origin;
  const browser = await puppeteer.launch({ executablePath, headless: true,
    args: ['--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWebSockets'] });
  const page = await browser.newPage(), errors = [], starts = [];
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1500, height: 1000 });
  const sessions = ['early', 'late', 'pending', 'closed'].map(id => {
    const start = Date.now() + (id === 'early' ? 2 : -3) * 3600000;
    return { livestreamId: id, storeId: 'store', title: `Phiên ${id}`, status: id === 'closed' ? 'CANCELLED' : 'SCHEDULED',
      scheduledAt: new Date(start).toISOString(), creator: { id: 'kol', fullName: 'KOL đã duyệt' },
      productRefs: { productIds: [] }, collaboratorRefs: { collaboratorIds: ['kol'] },
      participantRefs: { endsAt: new Date(start + 3600000).toISOString(), inviteStatus: id === 'pending' ? 'PENDING' : 'ACCEPTED' } };
  });
  page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
  await page.evaluateOnNewDocument(() => {
    const encode = value => btoa(JSON.stringify(value));
    localStorage.setItem('token', `${encode({ alg: 'none' })}.${encode({ sub: 'owner', exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture`);
    localStorage.setItem('user', JSON.stringify({ id: 'owner', identitySubject: 'owner', fullName: 'Chủ shop', role: 'SHOP_MANAGER', roles: ['SHOP_OWNER'] }));
    localStorage.setItem('scanms-active-workspace', 'shop');
  });
  await page.setRequestInterception(true);
  page.on('request', request => { void (async () => {
    const url = new URL(request.url());
    const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
    const reply = result => request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
    if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
    if (url.pathname.includes('/api/')) {
      if (url.pathname.endsWith('/users')) return reply({ userId: 'owner', identitySubject: 'owner', fullName: 'Chủ shop', status: 'ACTIVE', roles: ['SHOP_OWNER'] });
      if (url.pathname.endsWith('/stores/mine')) return reply([{ storeId: 'store', name: 'Shop thử', approvalStatus: 'APPROVED' }]);
      if (url.pathname.endsWith('/invitations/catalog')) return reply({ storeId: 'store', products: [], creators: [] });
      if (url.pathname.endsWith('/livestreams')) return reply(sessions);
      if (url.pathname.endsWith('/start')) {
        const id = url.pathname.split('/').at(-2), row = sessions.find(row => row.livestreamId === id);
        starts.push(id); row.status = 'LIVE'; row.startedAt = new Date().toISOString();
        row.participantRefs.scheduledEndsAt = row.participantRefs.endsAt;
        row.participantRefs.endsAt = new Date(Date.now() + 3600000).toISOString();
        return reply(row);
      }
      if (url.pathname.endsWith('/unread-count')) return reply({ unreadCount: 0 });
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
  const open = async id => {
    await page.goto(`${origin}/merchant/live-sessions?sessionId=${id}`);
    await page.waitForSelector('[role="dialog"]');
    await page.waitForFunction(id => document.querySelector('[role="dialog"]')?.textContent.includes(`Phiên ${id}`), {}, id);
  };
  try {
    for (const id of ['late', 'early']) {
      await open(id);
      const oldEnd = sessions.find(row => row.livestreamId === id).participantRefs.endsAt;
      await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.textContent.includes('Bạn có thể bắt đầu sớm hoặc muộn hơn giờ hẹn'));
      await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button')].find(button => button.textContent.includes('Bắt đầu phát sóng')).click());
      await page.waitForFunction(id => JSON.parse(localStorage.getItem('scanms_live_broadcasts') || '[]').some(row => row.sessionId === id), {}, id);
      const notice = await page.evaluate(id => JSON.parse(localStorage.getItem('scanms_live_broadcasts')).find(row => row.sessionId === id), id);
      assert.equal(notice.endsAt, sessions.find(row => row.livestreamId === id).participantRefs.endsAt);
      assert.notEqual(notice.endsAt, oldEnd, 'broadcast must use the server-confirmed deadline');
      assert.ok(Date.parse(notice.endsAt) > Date.now() + 3500000);
    }
    assert.deepEqual(starts, ['late', 'early']);
    for (const id of ['pending', 'closed']) {
      await open(id);
      assert.equal(await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button')].some(button => button.textContent.includes('Bắt đầu phát sóng'))), false);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
