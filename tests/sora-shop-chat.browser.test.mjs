import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('product card opens the correct shop chat and HTTP failure preserves the draft before retry', {
  skip: !base || !existsSync(executablePath), timeout: 40000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const page = await browser.newPage(); page.setDefaultTimeout(8000);
  const store = { id: '02c1461c-aead-4366-9116-f72915bac9ce', name: 'Sora Skin' };
  const conversation = { id: '74000000-0000-4000-8000-000000000001', store, storeId: store.id, customerId: 'qa-buyer',
    customer: { id: 'qa-buyer', fullName: 'QA Buyer', role: 'CUSTOMER' }, createdAt: new Date().toISOString(), lastMessageAt: new Date().toISOString(), chatMessages: [] };
  const messages = [], errors = [], opens = [];
  let started = false, fail = true;
  await page.evaluateOnNewDocument(() => {
    localStorage.clear();
    const payload = btoa(JSON.stringify({ sub: 'qa-subject', exp: Math.floor(Date.now()/1000)+3600 }));
    localStorage.setItem('token', `eyJhbGciOiJub25lIn0.${payload}.fixture`);
    localStorage.setItem('user', JSON.stringify({ id: 'qa-buyer', fullName: 'QA Buyer', role: 'CUSTOMER', identitySubject: 'qa-subject' }));
  });
  page.on('pageerror', error => { if (error.message !== 'WebSocket closed without opened.') errors.push(error.message); });
  await page.setRequestInterception(true);
  page.on('request', request => { void (async () => {
    const url = new URL(request.url());
    const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
    const respond = (result, status = 200) => request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, result, message: status === 503 ? 'QA temporary failure' : 'Success' }) });
    if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
    if (url.pathname.includes('/api/')) {
      if (url.pathname.endsWith('/chat/conversations') && request.method() === 'POST') {
        opens.push(JSON.parse(request.postData())); started = true; return respond(conversation);
      }
      if (url.pathname.endsWith('/chat/conversations')) return respond(started ? [conversation] : []);
      if (url.pathname.endsWith('/messages') && request.method() === 'POST') {
        if (fail) return respond(null, 503);
        const input = JSON.parse(request.postData());
        const merchant = request.headers()['x-qa-merchant'] === 'true' || input.messageText === 'Shop còn size M nhé.';
        const message = { id: input.messageId, conversationId: conversation.id, senderId: merchant ? 'qa-owner' : 'qa-buyer', messageText: input.messageText,
          createdAt: new Date().toISOString(), isRead: false, sender: { id: merchant ? 'qa-owner' : 'qa-buyer', fullName: merchant ? 'Sora Skin' : 'QA Buyer' } };
        messages.push(message); return respond(message);
      }
      if (url.pathname.endsWith('/messages')) return respond(messages);
      return respond([]);
    }
    if (url.pathname === '/__sora-merchant-qa') return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
      import '/src/index.css';
      localStorage.setItem('user',JSON.stringify({id:'qa-owner',fullName:'QA Owner',role:'SHOP_MANAGER',stores:[{id:'${store.id}',name:'Sora Skin'}]}));
      const source=await(await fetch('/src/pages/chat/ChatBoxPage.tsx')).text();
      const React=await import(source.match(/["]([^"]*react[.]js[^"]*)["]/)[1]);
      const dom=await import('/node_modules/.vite/deps/react-dom_client.js');
      const {BrowserRouter}=await import(source.match(/["]([^"]*react-router-dom[.]js[^"]*)["]/)[1]);
      const {default:Page}=await import('/src/pages/chat/ChatBoxPage.tsx');
      const h=React.createElement||React.default.createElement;
      (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(BrowserRouter,null,h(Page)));
    </script></body></html>` });
    if (url.pathname === '/__sora-chat-qa') return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;
      import '/src/index.css';
      const source=await(await fetch('/src/components/marketplace/MarketplaceProductCard.tsx')).text();
      const widgetSource=await(await fetch('/src/components/chat/ScanmsFloatingChatWidget.tsx')).text();
      const React=await import(source.match(/["]([^"]*react[.]js[^"]*)["]/)[1]);
      const dom=await import('/node_modules/.vite/deps/react-dom_client.js');
      const {BrowserRouter}=await import(widgetSource.match(/["]([^"]*react-router-dom[.]js[^"]*)["]/)[1]);
      const {ScanmsChatProvider}=await import(source.match(/["]([^"]*ScanmsChatContext[.]tsx[^"]*)["]/)[1]);
      const {MarketplaceProductCard}=await import('/src/components/marketplace/MarketplaceProductCard.tsx');
      const {ScanmsFloatingChatWidget}=await import('/src/components/chat/ScanmsFloatingChatWidget.tsx');
      const h=React.createElement||React.default.createElement;
      (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(BrowserRouter,null,h(ScanmsChatProvider,null,
        h('div',{style:{width:300}},h(MarketplaceProductCard,{product:{id:'qa-shirt',name:'Sora shirt',brand:'Sora Skin',storeId:'${store.id}',price:299000,origPrice:299000,image:'/assets/products/sora-caro-shirt.webp',stockQuantity:100},wished:false,onWishlist:()=>{},onPurchase:()=>{},deal:null,now:Date.now()})),h(ScanmsFloatingChatWidget))));
    </script></body></html>` });
    if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
    return request.continue();
  })().catch(error => { errors.push(error.message); void request.abort().catch(()=>{}); }); });
  try {
    await page.goto(origin + '/__sora-chat-qa');
    await page.waitForSelector('article button');
    await page.evaluate(() => [...document.querySelectorAll('article button')].find(button => button.textContent.includes('Nhắn tin')).click());
    await page.waitForSelector('textarea[placeholder="Nhập nội dung tin nhắn"]');
    await page.waitForFunction(() => !document.body.textContent.includes('Kính chào quý khách'));
    assert.deepEqual(opens, [{ storeId: store.id }]);
    const input = 'Shop còn size M không?';
    await page.type('textarea[placeholder="Nhập nội dung tin nhắn"]', input);
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 500));
    assert.equal(messages.length, 0);
    assert.equal(await page.$eval('textarea[placeholder="Nhập nội dung tin nhắn"]', el => el.value), input);
    fail = false;
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('textarea[placeholder="Nhập nội dung tin nhắn"]').value === '');
    assert.equal(messages.length, 2);
    assert.equal(JSON.parse(messages[0].messageText).productId, 'qa-shirt');
    assert.equal(messages[1].messageText, input);
    await page.goto(origin + '/__sora-merchant-qa');
    await page.waitForSelector('#chat-message-input');
    await page.waitForFunction(() => document.body.textContent.includes('Shop còn size M không?'));
    await page.type('#chat-message-input', 'Shop còn size M nhé.');
    await page.click('#chat-send-btn');
    await page.waitForFunction(() => document.querySelector('#chat-message-input').value === '');
    assert.equal(messages.length, 3);
    assert.equal(messages[2].senderId, 'qa-owner');
    await page.reload();
    await page.waitForFunction(() => document.body.textContent.includes('Shop còn size M nhé.'));
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
