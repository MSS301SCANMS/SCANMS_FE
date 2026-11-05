import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH;

test('real App shop Chat ngay opens the global chat and /chat preserves the conversation', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 60000,
}, async () => {
  const origin = new URL(base).origin;
  const shopId = '22222222-2222-4222-8222-222222222222';
  const conversationId = '11111111-1111-4111-8111-111111111111';
  const store = { id: shopId, storeId: shopId, name: 'Mộc Basics', categories: [], productCount: 24, followerCount: 0, isActive: true, isVerified: true };
  const messages = [], opens = [], errors = [];
  const conversation = () => ({ id: conversationId, storeId: shopId, customerId: 'buyer', isStoreOwner: false,
    customer: { fullName: 'Buyer' }, store, chatMessages: messages.slice(-1), _count: { chatMessages: 0 } });
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWebSockets'] });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    await page.setViewport({ width: 1500, height: 1000 });
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
    await page.evaluateOnNewDocument(() => {
      const encode = value => btoa(JSON.stringify(value));
      localStorage.setItem('token', `${encode({ alg: 'none' })}.${encode({ sub: 'buyer', exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture`);
      localStorage.setItem('user', JSON.stringify({ id: 'buyer', identitySubject: 'buyer', fullName: 'Buyer', role: 'CUSTOMER', roles: ['CUSTOMER'] }));
      localStorage.setItem('scanms-active-workspace', 'customer');
    });
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
      const respond = result => request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.pathname.includes('/api/')) {
        if (url.pathname.endsWith('/chat/conversations') && request.method() === 'POST') {
          opens.push(JSON.parse(request.postData())); return respond(conversation());
        }
        if (url.pathname.endsWith('/chat/conversations')) return respond(opens.length ? [conversation()] : []);
        if (url.pathname.endsWith('/messages') && request.method() === 'POST') {
          const input = JSON.parse(request.postData());
          const saved = { id: input.messageId, conversationId, senderId: 'buyer', messageText: input.messageText, createdAt: new Date().toISOString(), isRead: false };
          messages.push(saved); return respond(saved);
        }
        if (url.pathname.endsWith('/messages')) return respond(messages);
        if (url.pathname.endsWith('/read')) return respond(null);
        if (url.pathname === `/api/v1/stores/public/id/${shopId}`) return respond(store);
        if (url.pathname.endsWith('/follow')) return respond({ following: false });
        if (url.pathname.endsWith('/activity')) return respond({ isOnline: true });
        if (url.pathname.endsWith('/public/products')) return respond({ items: [], total: 0, pagination: { page: 1, totalPages: 1 } });
        if (url.pathname.endsWith('/users')) return respond({ userId: 'buyer', identitySubject: 'buyer', fullName: 'Buyer', email: 'fixture@example.test', status: 'ACTIVE', roles: ['CUSTOMER'] });
        if (url.pathname.endsWith('/users/cart')) return respond({ items: [] });
        return respond([]);
      }
      if (request.isNavigationRequest() && request.frame() === page.mainFrame() && url.origin === origin) {
        return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
          import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
          import '/src/index.css';
          const source=await(await fetch('/src/pages/chat/ChatBoxPage.tsx')).text();
          const reactModule=await import(source.match(/["]([^"]*deps.react[.]js[^"]*)["]/)[1]);const React=reactModule.default||reactModule;
          const main=await(await fetch('/src/main.tsx')).text();const dom=await import(main.match(/["]([^"]*react-dom_client[.]js[^"]*)["]/)[1]);
          const {default:App}=await import('/src/App.tsx');
          (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(React.createElement(App));
        </script></body></html>` });
      }
      return request.continue();
    })().catch(error => { errors.push(error.message); if (!request.isInterceptResolutionHandled()) void request.abort(); }); });
    await page.goto(`${origin}/shops/${shopId}`);
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Chat ngay'));
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Chat ngay').click());
    await page.waitForSelector('textarea[aria-label="Tin nhắn"]');
    assert.equal(opens[0].storeId, shopId);
    assert.ok(await page.$('button[aria-label="Đóng chat"]'), 'the floating chat must be mounted in the real App');
    await page.type('textarea[aria-label="Tin nhắn"]', 'Shop còn sản phẩm không?');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Gửi').click());
    await page.waitForFunction(() => document.querySelector('[data-testid="chat-history"]')?.textContent.includes('Đã gửi'));
    await page.click('button[aria-label="Đóng chat"]');
    const reopened = page.waitForResponse(response => response.url().endsWith('/chat/conversations') && response.request().method() === 'POST');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Chat ngay').click());
    await reopened;
    await page.waitForSelector('textarea[aria-label="Tin nhắn"]');
    assert.equal(opens.length, 2);
    await page.click('button[aria-label="Mở chat toàn trang"]');
    await page.waitForFunction(() => location.pathname === '/chat' && Boolean(document.querySelector('textarea[aria-label="Tin nhắn"]')) && !document.querySelector('button[aria-label="Đóng chat"]'));
    assert.equal(new URL(page.url()).pathname, '/chat');
    assert.equal(await page.$('button[aria-label="Đóng chat"]'), null, 'only one full-page chat is rendered');
    await page.reload();
    await page.waitForFunction(() => document.body.innerText.includes('Mộc Basics'));
    await page.evaluate(() => [...document.querySelectorAll('aside button')].find(button => button.innerText.includes('Mộc Basics'))?.click());
    await page.waitForFunction(() => document.querySelector('[data-testid="chat-history"]')?.textContent.includes('Shop còn sản phẩm không?'));
    assert.deepEqual(errors, []);
    await page.screenshot({ path: 'D:/MSS301/.validation/shop-chat-entry-20261105.png', fullPage: true });
  } finally { await browser.close(); }
});
