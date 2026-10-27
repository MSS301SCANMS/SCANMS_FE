import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL, executablePath = process.env.GHN_UI_BROWSER_PATH;
test('five login roles keep authorized pages, menus and explicit shopping switches isolated', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 120000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const fixturePages = {
    '/src/pages/admin/AdminDashboardPage.tsx': 'ADMIN_HOME', '/src/pages/admin/ManagerOpsDashboardPage.tsx': 'MANAGER_HOME',
    '/src/pages/admin/AdminProfilePage.tsx': 'ADMIN_PROFILE', '/src/pages/merchant/ShopDashboardPage.tsx': 'SHOP_HOME',
    '/src/pages/merchant/ShopSettingsPage.tsx': 'SHOP_PROFILE', '/src/pages/merchant/ProductManagementPage.tsx': 'SHOP_PRODUCTS',
    '/src/pages/collaborator/KolDashboardPage.tsx': 'KOL_HOME', '/src/pages/collaborator/CreatorProfilePage.tsx': 'KOL_PROFILE',
    '/src/pages/customer/CustomerPortalPage.tsx': 'CUSTOMER_PORTAL', '/src/pages/public/MarketplacePage.tsx': 'MARKETPLACE',
  };
  const cases = [
    { role: 'ADMIN', home: '/admin/dashboard', redirect: '/customer/orders' },
    { role: 'MANAGER', home: '/admin/ops-dashboard', redirect: '/customer/wallet' },
    { role: 'SHOP_OWNER', home: '/merchant/dashboard' },
    { role: 'KOL_CTV', home: '/collaborator/dashboard' },
    { role: 'USER', home: '/marketplace', redirect: '/admin/users' },
  ];
  const errors = [];
  try {
    for (const fixture of cases) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage(); page.setDefaultTimeout(10000);
      await page.setViewport({ width: 1440, height: 1000 });
      const admin = ['ADMIN', 'MANAGER'].includes(fixture.role);
      const roles = admin ? [fixture.role, 'USER', 'KOL_CTV', 'SHOP_OWNER'] : [fixture.role, 'USER'];
      const jwt = claims => Buffer.from(JSON.stringify(claims)).toString('base64url');
      const token = jwt({ alg: 'none' }) + '.' + jwt({ sub: fixture.role, realm_access: { roles }, exp: Math.floor(Date.now() / 1000) + 3600 }) + '.fixture';
      const account = { userId: fixture.role, identitySubject: fixture.role, fullName: 'Fixture ' + fixture.role, email: fixture.role.toLowerCase() + '@example.test', roles, status: 'ACTIVE' };
      page.on('pageerror', error => {
        if (error.message === 'WebSocket closed without opened.' && error.stack?.includes('/@vite/client')) return;
        errors.push(error.message);
      });
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = new URL(request.url());
        if (fixturePages[url.pathname]) return request.respond({ contentType: 'application/javascript', body: `export default function Fixture(){return ${JSON.stringify(fixturePages[url.pathname])};}` });
        if (url.pathname === '/src/pages/public/ProductDetailPage.tsx') return request.respond({ contentType: 'application/javascript', body: 'export {PublicHeader as default} from "/src/components/layout/PublicHeader.tsx";' });
        if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ contentType: 'application/javascript', body: 'const socket={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>socket;export const isChatSocketEnabled=()=>false;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,authorization', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        if (url.pathname.startsWith('/api/')) {
          const result = url.pathname.endsWith('/auth/login') ? { accessToken: token, expiresIn: 3600 }
            : url.pathname.endsWith('/users') ? account
            : url.pathname.endsWith('/users/cart') ? { items: [] }
            : url.pathname.endsWith('/stores/mine') ? fixture.role === 'SHOP_OWNER' ? [{ storeId: 'fixture-store', name: 'Fixture Shop', approvalStatus: 'APPROVED' }] : [] : [];
          return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
        }
        if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
        return request.continue();
      });
      const loginPath = '/login' + (fixture.redirect ? '?redirect=' + encodeURIComponent(fixture.redirect) : '');
      await page.goto(origin + loginPath, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#login-identifier');
      await page.$eval('#login-identifier', (input, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }, account.email);
      await page.$eval('#login-password', input => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Fixture-password-123'); input.dispatchEvent(new Event('input', { bubbles: true })); });
      await page.$eval('form', form => form.requestSubmit());
      await page.waitForFunction(path => location.pathname === path, {}, fixture.home);
      const workspace = admin ? 'admin' : fixture.role === 'SHOP_OWNER' ? 'shop' : fixture.role === 'KOL_CTV' ? 'kol' : 'customer';
      assert.equal(await page.evaluate(() => localStorage.getItem('scanms-active-workspace')), workspace);
      await page.goto(origin + '/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(path => location.pathname === path, {}, workspace === 'customer' ? '/customer/orders' : fixture.home);
      if (admin) {
        for (const denied of ['/merchant/products', '/collaborator/dashboard', ...(fixture.role === 'MANAGER' ? ['/admin/dashboard'] : [])]) {
          await page.goto(origin + denied, { waitUntil: 'domcontentloaded' });
          await page.waitForFunction(path => location.pathname === path, {}, fixture.home);
        }
        await page.goto(origin + '/customer/wallet', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(path => location.pathname === path, {}, fixture.home);
        assert.equal(await page.evaluate(() => document.body.innerText.includes('CUSTOMER_PORTAL')), false);
        await page.goto(origin + '/marketplace', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(path => location.pathname === path, {}, fixture.home);
        await page.waitForSelector('button[aria-controls="topbar-account-menu"]');
        await page.click('button[aria-controls="topbar-account-menu"]');
        assert.equal(await page.$('#topbar-account-menu a[href^="/customer/"]'), null);
        await page.click('#topbar-account-menu a[href="/admin/profile"]');
        await page.waitForFunction(() => location.pathname === '/admin/profile');
      } else if (fixture.role === 'SHOP_OWNER') {
        await page.goto(origin + '/products/shared', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('button[aria-controls="public-account-menu"]');
        await page.click('button[aria-controls="public-account-menu"]');
        await page.click('#public-account-menu a[href="/merchant/settings"]');
        await page.waitForFunction(() => location.pathname === '/merchant/settings');
        await page.waitForSelector('a[aria-label="Quay lại Sàn Mua Sắm SCANMS"]');
        await page.click('a[aria-label="Quay lại Sàn Mua Sắm SCANMS"]');
        await page.waitForFunction(() => location.pathname === '/marketplace');
        assert.equal(await page.evaluate(() => localStorage.getItem('scanms-active-workspace')), 'customer');
        await page.goto(origin + '/merchant/dashboard', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => localStorage.getItem('scanms-active-workspace') === 'shop');
      } else if (fixture.role === 'KOL_CTV') {
        await page.waitForSelector('button[aria-controls="topbar-account-menu"]');
        await page.click('button[aria-controls="topbar-account-menu"]');
        await page.click('#topbar-account-menu a[href="/collaborator/profile"]');
        await page.waitForFunction(() => location.pathname === '/collaborator/profile');
        await page.goto(origin + '/merchant/products', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(path => location.pathname === path, {}, fixture.home);
      }
      await context.close();
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
