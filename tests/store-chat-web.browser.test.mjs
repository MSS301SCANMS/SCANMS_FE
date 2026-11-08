import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { createLiveServer } from '../../be/livestream-realtime/server.mjs';

const base = process.env.GHN_UI_TEST_URL, executablePath = process.env.GHN_UI_BROWSER_PATH;
test('web chat sends through relay, retries the same message, reloads and negotiates structured cards', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 90000,
}, async () => {
  const origin = new URL(base).origin, messages = new Map(), errors = [], writes = [], relayWrites = [], socketErrors = [];
  const id = '11111111-1111-4111-8111-111111111111';
  let opened = false, loseAck = true, deal, sample;
  const decode = token => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  const conversation = user => ({ id, storeId: 'shop', customerId: 'kol', isStoreOwner: user === 'owner',
    store: { id: 'shop', name: 'Fixture Shop' }, customer: { fullName: 'Fixture KOL' }, chatMessages: [...messages.values()].slice(-1), _count: { chatMessages: 0 } });
  async function endpoint(url, options = {}) {
    const path = new URL(url, origin).pathname, method = options.method || 'GET';
    const authorization = options.headers?.Authorization || options.headers?.authorization || '';
    const user = decode(authorization.slice(7)).sub;
    const body = options.body ? JSON.parse(options.body) : {};
    const reply = (result, status = 200) => Response.json({ code: status, result, message: status === 503 ? 'Lost acknowledgement fixture' : 'Success' }, { status });
    if (path.endsWith('/identity')) return reply({ userId: user });
    if (path.endsWith('/chat/conversations') && method === 'POST') { opened = true; return reply(conversation(user)); }
    if (path.endsWith('/chat/conversations')) return reply(opened ? [conversation(user)] : []);
    if (path.endsWith('/subscription')) return reply({ id, participantIds: ['kol', 'owner'] });
    if (path.endsWith('/messages') && method === 'POST') {
      if (options.headers?.Authorization) relayWrites.push(body.messageId);
      writes.push(body);
      if (!messages.has(body.messageId)) messages.set(body.messageId, { id: body.messageId, conversationId: id, senderId: user, messageText: body.messageText, createdAt: new Date().toISOString(), isRead: false });
      if (loseAck) { loseAck = false; return reply(null, 503); }
      return reply(messages.get(body.messageId));
    }
    if (path.endsWith('/messages')) return reply([...messages.values()]);
    if (path.endsWith('/read')) return reply(null);
    if (path.endsWith('/stores/mine')) return reply(user === 'owner' ? [{ storeId: 'shop', name: 'Fixture Shop' }] : []);
    if (path.endsWith('/partners')) return reply([{ storeId: 'shop', customerId: 'kol', collaboratorId: 'kol-profile', name: 'Fixture KOL' }]);
    if (path.includes('/invitations/') && method === 'GET') return reply([{ id: 'invitation', storeId: 'shop', storeName: 'Fixture Shop',
      collaboratorId: 'kol-profile', collaboratorName: 'Fixture KOL', status: 'ACCEPTED', message: 'Partnership fixture', createdAt: new Date().toISOString() }]);
    if ((path.endsWith('/commission-deals/mine') || path.endsWith('/commission-deals/shop')) && method === 'GET') return reply(deal ? [deal] : []);
    if ((path.endsWith('/sample-requests/my') || path.endsWith('/sample-requests/shop')) && method === 'GET') return reply(sample ? [sample] : []);
    if (path.endsWith('/public/products')) return reply({ items: [{ id: 'shirt', name: 'Fixture Shirt', title: 'Fixture Shirt' }] });
    if (path.endsWith('/commission-deals') && method === 'POST') {
      deal = { id: 'deal', storeId: 'shop', collaboratorId: 'kol-profile', productId: 'shirt', productName: 'Fixture Shirt', collaboratorName: 'Fixture KOL', baseRate: 10, extraPoints: body.extraPoints, message: body.message,
        status: 'PENDING', version: 0, proposedByUserId: 'kol', negotiationHistory: [{ actorId: 'kol', action: 'PROPOSE', baseRate: 10, extraPoints: body.extraPoints, note: body.message, at: new Date().toISOString() }] };
      return reply(deal);
    }
    if (path.endsWith('/resources/COMMISSION_DEAL/deal')) return reply({ storeId: 'shop', customerId: 'kol', deal });
    if (path.endsWith('/sample-requests') && method === 'POST') {
      sample = { ...body, id: body.requestId, storeId: 'shop', customerId: 'kol', product: { id: 'shirt', title: 'Fixture Shirt' }, status: 'PENDING', version: 0 };
      return reply(sample);
    }
    if (sample && path.endsWith(`/resources/SAMPLE_REQUEST/${sample.id}`)) return reply({ storeId: 'shop', customerId: 'kol', sample });
    if (sample && path.includes(`/sample-requests/${sample.id}/`) && method === 'PATCH') {
      assert.equal(body.expectedVersion, sample.version);
      const action = path.split('/').at(-1);
      sample = { ...sample, version: sample.version + 1, status: { approve: 'APPROVED', ship: 'SHIPPED', receive: 'RECEIVED' }[action], response: body.response, carrier: body.carrierName, trackingCode: body.trackingNumber };
      return reply(sample);
    }
    if (path.endsWith('/deal/negotiate')) {
      assert.equal(body.expectedVersion, deal.version);
      deal = { ...deal, version: deal.version + 1, status: body.action === 'COUNTER' ? 'COUNTERED' : 'APPROVED',
        ...(body.action === 'COUNTER' ? { extraPoints: body.extraPoints, proposedByUserId: user } : { totalRate: 10 + deal.extraPoints }) };
      return reply(deal);
    }
    return reply([]);
  }
  const relay = createLiveServer({ origins: [origin], verifyToken: async token => decode(token), fetcher: endpoint });
  await new Promise(resolve => relay.http.listen(Number(process.env.LIVE_TEST_RELAY_PORT || 8091), '127.0.0.1', resolve));
  // Intercepted fixture HTML has no network address space; allow its isolated loopback relay in QA only.
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWebSockets'] });
  async function pageFor(user) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    page.setDefaultTimeout(12000); await page.setViewport({ width: 1440, height: 1000 });
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(error.message); });
    page.on('console', message => { if (message.type() === 'error') socketErrors.push(message.text()); });
    await page.evaluateOnNewDocument(user => {
      const encode = value => btoa(JSON.stringify(value));
      localStorage.setItem('token', encode({ alg: 'none' }) + '.' + encode({ sub: user, exp: Math.floor(Date.now() / 1000) + 3600 }) + '.fixture');
      localStorage.setItem('user', JSON.stringify({ id: user, fullName: user, role: user === 'kol' ? 'KOL_CTV' : 'SHOP_OWNER' }));
    }, user);
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.pathname.includes('/api/')) {
        const response = await endpoint(url.href, { method: request.method(), headers: request.headers(), body: request.postData() });
        return request.respond({ status: response.status, headers, contentType: 'application/json', body: await response.text() });
      }
      if (url.pathname === '/__store-chat-web') return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
        import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;
        import '/src/index.css';
        const app=await(await fetch('/src/App.tsx')).text();const source=await(await fetch('/src/pages/chat/ChatBoxPage.tsx')).text();
        const reactModule=await import(source.match(/["]([^"]*deps.react[.]js[^"]*)["]/)[1]);const React=reactModule.default||reactModule;
        const main=await(await fetch('/src/main.tsx')).text();const dom=await import(main.match(/["]([^"]*react-dom_client[.]js[^"]*)["]/)[1]);
        const router=await import(source.match(/["]([^"]*react-router-dom[.]js[^"]*)["]/)[1]);const query=await import(app.match(/["]([^"]*tanstack_react-query[^"]*)["]/)[1]);
        const {queryClient}=await import('/src/config/query-client.config.ts');const {ScanmsChatProvider}=await import('/src/context/ScanmsChatContext.tsx');
        const {StoreChatWorkspace}=await import('/src/components/chat/StoreChatWorkspace.tsx');const h=React.createElement;
        (dom.createRoot||dom.default.createRoot)(document.getElementById('root')).render(h(query.QueryClientProvider,{client:queryClient},h(router.BrowserRouter,null,h(ScanmsChatProvider,null,h(StoreChatWorkspace,{storeId:${user === 'kol' ? "'shop'" : 'undefined'},storeName:'Fixture Shop'})))));
      </script></body></html>` });
      return request.continue();
    })().catch(error => { errors.push(error.message); if (!request.isInterceptResolutionHandled()) void request.abort(); }); });
    await page.goto(`${origin}/__store-chat-web`);
    page.on('close', () => {});
    return page;
  }
  const click = async (page, text) => page.evaluate(text => { const button = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text || button.getAttribute('aria-label') === text); if (!button) throw new Error('Missing button: ' + text); button.click(); }, text);
  try {
    const kol = await pageFor('kol'), shop = await pageFor('owner');
    await kol.waitForSelector('textarea[aria-label="Tin nhắn"]');
    await kol.waitForFunction(() => document.body.innerText.includes('Đã kết nối trực tiếp'));
    await kol.type('textarea[aria-label="Tin nhắn"]', 'Hello from KOL'); await click(kol, 'Gửi');
    await kol.waitForFunction(() => document.body.innerText.includes('Gửi thất bại'));
    await click(kol, 'Gửi lại');
    await kol.waitForFunction(() => !document.body.innerText.includes('Gửi thất bại') && document.body.innerText.includes('Đã gửi'));
    assert.equal(messages.size, 1); assert.equal(writes[0].messageId, writes[1].messageId);
    await shop.waitForFunction(() => [...document.querySelectorAll('aside button')].some(button => button.innerText.includes('Fixture KOL')));
    await shop.evaluate(() => [...document.querySelectorAll('aside button')].find(button => button.innerText.includes('Fixture KOL')).click());
    await shop.waitForFunction(() => document.querySelector('[data-testid="chat-history"]')?.textContent.includes('Hello from KOL'));
    await shop.type('textarea[aria-label="Tin nhắn"]', 'Hello from shop'); await click(shop, 'Gửi');
    await kol.waitForFunction(() => document.querySelector('[data-testid="chat-history"]')?.textContent.includes('Hello from shop'));
    await kol.reload(); await kol.waitForFunction(() => document.querySelector('[data-testid="chat-history"]')?.textContent.includes('Hello from shop'));
    await click(kol, 'Đề xuất hoa hồng');
    await kol.waitForFunction(() => document.querySelector('select[aria-label="Sản phẩm hợp tác"]')?.value === 'shirt');
    await kol.type('textarea[aria-label="Nội dung đề nghị"]', 'Please offer a higher commission');
    await click(kol, 'Gửi đề xuất');
    await shop.waitForSelector('[data-testid="collaboration-card"]');
    await shop.waitForFunction(() => document.body.innerText.includes('Chấp nhận mức này'));
    await shop.select('select[aria-label="Mức hoa hồng đề xuất lại"]', '2');
    await click(shop, 'Đề xuất lại');
    await kol.waitForFunction(() => document.body.innerText.includes('Shop đề xuất lại'));
    await click(kol, 'Chấp nhận mức này');
    await kol.waitForFunction(() => document.body.innerText.includes('Đã thống nhất'));
    assert.equal(deal.totalRate, 12); assert.equal(messages.size, 3);
    await click(kol, 'Xin hàng dùng thử');
    await kol.waitForFunction(() => document.querySelector('select[aria-label="Sản phẩm hợp tác"]')?.value === 'shirt');
    await kol.type('textarea[aria-label="Nội dung đề nghị"]', 'Please send a review sample');
    await kol.type('input[aria-label="Người nhận hàng mẫu"]', 'Fixture KOL');
    await kol.type('input[aria-label="Số điện thoại nhận mẫu"]', '0901234567');
    await kol.type('input[aria-label="Địa chỉ nhận mẫu"]', '100 Test Street, Ward, City');
    await click(kol, 'Gửi đề xuất');
    await shop.waitForFunction(() => document.body.innerText.includes('Đồng ý gửi mẫu'));
    await click(shop, 'Đồng ý gửi mẫu');
    await shop.waitForSelector('input[placeholder="Đơn vị vận chuyển"]');
    await shop.type('input[placeholder="Đơn vị vận chuyển"]', 'Fixture Carrier');
    await shop.type('input[placeholder="Mã vận đơn đã tạo"]', 'TRACK-123');
    await click(shop, 'Xác nhận đã gửi mẫu');
    await kol.waitForFunction(() => document.body.innerText.includes('Đã nhận hàng mẫu'));
    await click(kol, 'Đã nhận hàng mẫu');
    await kol.waitForFunction(() => document.body.innerText.includes('Đã nhận hàng'));
    assert.equal(sample.status, 'RECEIVED'); assert.equal(deal.totalRate, 12);
    assert.ok(relayWrites.length >= 4, 'writes must pass through the actual realtime relay');
    assert.deepEqual(errors, []);
    await kol.screenshot({ path: 'D:/MSS301/.validation/store-chat-web-20261102.png', fullPage: true });
  } catch (error) {
    for (const page of await browser.pages()) {
      try { console.log('CHAT_QA_STATE', JSON.stringify({ errors, socketErrors, socketUrl: await page.evaluate(async () => (await import('/src/services/chat-socket.service.ts')).getChatSocket().io.uri), text: (await page.evaluate(() => document.body.innerText)).slice(0, 1500) })); } catch {}
    }
    throw error;
  } finally { await browser.close(); await relay.close(); }
});
