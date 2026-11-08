import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL, executablePath = process.env.GHN_UI_BROWSER_PATH;
const roles = [
  { name: 'customer', role: 'CUSTOMER', roles: ['CUSTOMER'], workspace: 'customer', label: 'Khách mua sắm', home: '/marketplace' },
  { name: 'kol', role: 'COLLABORATOR', roles: ['CUSTOMER', 'KOL_CTV'], workspace: 'kol', label: 'Không gian KOL', home: '/collaborator/dashboard' },
  { name: 'shop', role: 'SHOP_MANAGER', roles: ['CUSTOMER', 'SHOP_OWNER'], workspace: 'shop', label: 'Không gian gian hàng', home: '/merchant/dashboard' },
  { name: 'admin', role: 'SYSTEM_ADMIN', roles: ['SYSTEM_ADMIN'], workspace: 'admin', label: 'Quản trị viên', home: '/admin/dashboard' },
  { name: 'manager', role: 'SYSTEM_MANAGER', roles: ['SYSTEM_MANAGER'], workspace: 'admin', label: 'Quản lý sàn', home: '/admin/ops-dashboard' },
];
const shopId = '22222222-2222-4222-8222-222222222222', otherShopId = '33333333-3333-4333-8333-333333333333';
const conversationId = '11111111-1111-4111-8111-111111111111';
const click = (page, text) => page.evaluate(text => {
  const button = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text || button.getAttribute('aria-label') === text);
  if (!button) throw new Error(`Missing button: ${text}`);
  button.click();
}, text);

test('full App chat workspace respects all roles, real data states, product tabs and account changes', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 120000,
}, async () => {
  const origin = new URL(base).origin;
  const browser = await puppeteer.launch({ executablePath, headless: true,
    args: ['--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessChecksWebSockets'] });
  const errors = [];
  async function setup(person, { broken = false, empty = false } = {}) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    page.setDefaultTimeout(15000);
    await page.setViewport({ width: 1500, height: 960 });
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed without opened')) errors.push(`${person.name}: ${error.message}`); });
    const requests = [], decisions = [], state = { broken, empty };
    const shop = person.name === 'shop', collab = shop || person.name === 'kol';
    const recipient = shop ? 'kol-user' : `${person.name}-user`;
    const store = { id: shopId, storeId: shopId, name: 'Mộc Basics', isVerified: true, logoUrl: '/assets/product-placeholder.svg' };
    const messages = [
      { id: 'intro', conversationId, senderId: shop ? 'kol-user' : 'owner', messageText: 'Chào bạn! Mình muốn trao đổi về sơ mi caro.', createdAt: new Date().toISOString(), isRead: false },
      ...(collab ? [{ id: 'deal-card', conversationId, senderId: shop ? 'kol-user' : 'owner', messageText: JSON.stringify({ type: 'COMMISSION_DEAL', resourceId: 'deal' }), createdAt: new Date().toISOString(), isRead: false }] : []),
    ];
    const deal = { id: 'deal', storeId: shopId, collaboratorId: 'creator', collaboratorName: 'Thịnh Phan', productId: 'shirt', productName: 'Sơ mi caro xanh đen',
      status: 'PENDING', baseRate: 10, extraPoints: 2, message: 'Mình đề xuất mức hoa hồng cho sản phẩm.', version: 0, proposedByUserId: shop ? 'kol-user' : 'owner' };
    const samples = [{ id: 'sample', storeId: shopId, customerId: recipient, collaboratorId: 'creator', productId: 'shirt',
      product: { id: 'shirt', title: 'Sơ mi caro xanh đen' }, status: 'PENDING', version: 0, note: 'Xin mẫu để quay nội dung.',
      recipientName: 'Creator', recipientPhone: '0901234567', shippingAddress: 'Địa chỉ test', createdAt: new Date().toISOString() },
    { id: 'other-sample', storeId: otherShopId, customerId: 'another-user', collaboratorId: 'another-creator', productId: 'other-shirt',
      product: { id: 'other-shirt', title: 'Mẫu riêng của đối tác khác' }, status: 'PENDING', version: 0, createdAt: new Date().toISOString() }];
    const invitations = [
      { id: 'accepted', storeId: shopId, storeName: 'Mộc Basics', collaboratorId: 'creator', collaboratorName: 'Thịnh Phan', status: 'ACCEPTED', message: 'Hợp tác đã xác nhận.', createdAt: new Date().toISOString() },
      { id: 'pending', storeId: otherShopId, storeName: 'Gian hàng mới', collaboratorId: 'creator', collaboratorName: 'Thịnh Phan', status: 'PENDING', message: 'Mời bạn cùng giới thiệu sản phẩm.', createdAt: new Date().toISOString() },
    ];
    const conversation = () => ({ id: conversationId, storeId: shopId, customerId: recipient, isStoreOwner: shop,
      store, customer: { fullName: 'Thịnh Phan' }, chatMessages: messages.slice(-1), _count: { chatMessages: 0 } });
    await page.evaluateOnNewDocument(person => {
      const encode = value => btoa(JSON.stringify(value));
      localStorage.setItem('token', `${encode({ alg: 'none' })}.${encode({ sub: `${person.name}-user`, exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture`);
      localStorage.setItem('user', JSON.stringify({ id: `${person.name}-user`, identitySubject: `${person.name}-user`, fullName: person.name, role: person.role, roles: person.roles }));
      localStorage.setItem('scanms-active-workspace', person.workspace);
    }, person);
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
      const reply = (result, status = 200) => request.respond({ status, headers, contentType: 'application/json',
        body: JSON.stringify({ code: status, result, message: status === 503 ? 'Dịch vụ chat đang tạm gián đoạn.' : 'Success' }) });
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.pathname.includes('/api/')) {
        requests.push(url.pathname);
        const token = (request.headers().authorization || '').replace(/^Bearer /, '');
        const actor = token ? JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub : '';
        if (url.pathname.endsWith('/chat/conversations') && request.method() === 'GET') {
          if (state.broken) return reply(null, 503);
          return reply(state.empty || actor !== `${person.name}-user` || ['admin', 'manager'].includes(person.name) ? [] : [conversation()]);
        }
        if (url.pathname.endsWith('/chat/conversations') && request.method() === 'POST') return reply(conversation());
        if (url.pathname.endsWith('/messages') && request.method() === 'POST') {
          const input = JSON.parse(request.postData());
          const saved = { id: input.messageId, conversationId, senderId: `${person.name}-user`, messageText: input.messageText, createdAt: new Date().toISOString(), isRead: false };
          if (!messages.some(row => row.id === saved.id)) messages.push(saved);
          return reply(saved);
        }
        if (url.pathname.endsWith('/messages')) return reply(messages);
        if (url.pathname.endsWith('/read')) return reply(null);
        if (url.pathname.endsWith('/invitations/pending/respond')) {
          const decision = JSON.parse(request.postData()); decisions.push(decision);
          invitations[1].status = decision.decision;
          return reply(invitations[1]);
        }
        if (/\/invitations\/(mine|shop)$/.test(url.pathname)) return reply(invitations);
        if (url.pathname.endsWith('/chat/partners')) return reply([{ storeId: shopId, customerId: recipient, collaboratorId: 'creator', name: 'Thịnh Phan' }]);
        if (/\/commission-deals\/(mine|shop)$/.test(url.pathname)) return reply([deal]);
        if (/\/sample-requests\/(my|shop)$/.test(url.pathname)) return reply(samples);
        if (url.pathname.endsWith('/resources/COMMISSION_DEAL/deal')) return reply({ storeId: shopId, customerId: recipient, deal });
        if (url.pathname.endsWith('/resources/SAMPLE_REQUEST/sample')) return reply({ storeId: shopId, customerId: recipient, sample: samples[0] });
        if (url.pathname.endsWith('/public/products')) return reply({ items: [{ id: 'shirt', title: 'Sơ mi caro xanh đen', price: 329000 }], pagination: { totalPages: 1 } });
        if (url.pathname.endsWith('/presence')) return reply({ isOnline: true, lastActiveAt: new Date().toISOString(), checkedAt: new Date().toISOString() });
        if (url.pathname.endsWith('/stores/mine')) return reply(shop ? [store] : []);
        if (url.pathname.endsWith('/users')) return reply({ userId: actor, identitySubject: actor, fullName: actor, status: 'ACTIVE', roles: actor === `${person.name}-user` ? person.roles : ['CUSTOMER'] });
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
    await page.goto(`${origin}/chat`);
    await page.waitForFunction(label => document.querySelector('.store-chat-sidebar-heading')?.textContent.includes(label), {}, person.label);
    return { page, context, requests, state, decisions };
  }
  try {
    for (const person of roles) {
      const { page, context, requests, decisions } = await setup(person);
      if (['admin', 'manager'].includes(person.name)) {
        await page.waitForFunction(() => document.body.innerText.includes('Bắt đầu một cuộc trò chuyện'));
        assert.equal(await page.$('.store-chat-discover'), null, 'staff should not receive a customer shopping action');
      } else {
        await page.waitForSelector('textarea[aria-label="Tin nhắn"]');
        assert.ok((await page.$eval('.store-chat-workspace', el => el.getBoundingClientRect().width)) > 1400);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.type('textarea[aria-label="Tin nhắn"]', `Draft for ${person.name}`);
        await page.evaluate(() => [...document.querySelectorAll('.store-chat-content-tabs button')].find(button => button.textContent.includes('Sản phẩm')).click());
        await page.waitForSelector('.store-chat-product-card');
        assert.ok((await page.$eval('.store-chat-product-card', el => el.textContent)).includes('Sơ mi caro xanh đen'));
        await page.evaluate(() => [...document.querySelectorAll('.store-chat-content-tabs button')].find(button => button.textContent.includes('Tin nhắn')).click());
        assert.equal(await page.$eval('textarea[aria-label="Tin nhắn"]', el => el.value), `Draft for ${person.name}`);
        if (person.name === 'customer') {
          assert.equal(await page.$('button[aria-label="Xin hàng dùng thử"]'), null);
          assert.equal(await page.$('button[aria-label="Đề xuất hoa hồng"]'), null);
          assert.equal(requests.some(path => path.includes('/referrals/') || path.includes('/sample-requests/')), false);
        } else {
          await page.waitForSelector('.store-chat-deal-notice');
          await page.evaluate(() => [...document.querySelectorAll('.store-chat-content-tabs button')].find(button => button.textContent.includes('Hàng mẫu')).click());
          await page.waitForSelector('[aria-label="Hàng mẫu trong hội thoại"] [data-testid="collaboration-card"]');
          assert.equal((await page.$eval('[aria-label="Hàng mẫu trong hội thoại"]', el => el.innerText)).includes('Mẫu riêng của đối tác khác'), false);
          await page.evaluate(() => [...document.querySelectorAll('.store-chat-content-tabs button')].find(button => button.textContent.includes('Tin nhắn')).click());
          if (person.name === 'kol') {
            await page.evaluate(() => [...document.querySelectorAll('.store-chat-inbox-tabs button')].find(button => button.textContent.startsWith('Lời mời')).click());
            await page.waitForFunction(() => [...document.querySelectorAll('.store-chat-invitation')].some(card => card.innerText.includes('Gian hàng mới')));
            await click(page, 'Chấp nhận');
            await page.waitForFunction(() => !document.querySelector('.store-chat-inbox-tabs')?.textContent.includes('(1)'));
            assert.equal(decisions[0].decision, 'ACCEPTED');
            await click(page, 'Tất cả');
          }
        }
        await page.screenshot({ path: `D:/MSS301/.validation/chat-workspace-${person.name}-20261108.png`, fullPage: true });
      }
      if (person.name === 'kol') {
        await page.evaluate(() => { localStorage.setItem('scanms-active-workspace', 'customer'); window.dispatchEvent(new Event('scanms_workspace_changed')); });
        await page.waitForFunction(() => document.querySelector('.store-chat-sidebar-heading')?.textContent.includes('Khách mua sắm'));
        assert.equal(await page.$('.store-chat-deal-notice'), null, 'cached KOL deals must not appear in the customer workspace');
        assert.equal(await page.$('button[aria-label="Xin hàng dùng thử"]'), null);
      } else if (person.name === 'customer') {
        await page.evaluate(() => {
          const encode = value => btoa(JSON.stringify(value));
          localStorage.setItem('token', `${encode({ alg: 'none' })}.${encode({ sub: 'second-user', exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture`);
          localStorage.setItem('user', JSON.stringify({ id: 'second-user', fullName: 'Second customer', role: 'CUSTOMER', roles: ['CUSTOMER'] }));
          window.dispatchEvent(new Event('auth-user-updated'));
        });
        await page.waitForFunction(() => document.body.innerText.includes('Bắt đầu một cuộc trò chuyện'));
        assert.equal(await page.$('textarea[aria-label="Tin nhắn"]'), null, 'switching account must clear the old private conversation and draft');
        assert.equal(await page.$('.store-chat-conversation'), null);
      } else if (['admin', 'manager'].includes(person.name)) {
        assert.equal(requests.some(path => path.includes('/referrals/') || path.includes('/sample-requests/')), false);
        await click(page, 'Quay lại không gian của tôi');
        await page.waitForFunction(path => location.pathname === path, {}, person.home);
      }
      await context.close();
    }
    const broken = await setup(roles[0], { broken: true });
    await broken.page.waitForFunction(() => document.body.innerText.includes('Chưa kết nối được hộp thư'));
    assert.equal((await broken.page.$eval('.store-chat-inbox', el => el.innerText)).includes('Chưa có cuộc trò chuyện.'), false);
    broken.state.broken = false;
    await click(broken.page, 'Làm mới hội thoại');
    await broken.page.waitForSelector('textarea[aria-label="Tin nhắn"]');
    await broken.context.close();
    const empty = await setup(roles[0], { empty: true });
    await empty.page.waitForFunction(() => document.body.innerText.includes('Bắt đầu một cuộc trò chuyện'));
    assert.equal(await empty.page.$('.store-chat-error'), null);
    assert.ok(await empty.page.$('a.store-chat-discover[href="/marketplace"]'));
    await empty.page.screenshot({ path: 'D:/MSS301/.validation/chat-workspace-empty-20261108.png', fullPage: true });
    await empty.context.close();
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
