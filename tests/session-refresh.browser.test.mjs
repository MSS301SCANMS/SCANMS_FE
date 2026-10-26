import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('session renewal preserves workspaces, retries 401, survives outages and cannot restore a logged-out account', {
  skip: !base || !existsSync(executablePath), timeout: 60000,
}, async () => {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const origin = new URL(base).origin;
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const context = await browser.createBrowserContext();
  let refreshes = 0, refreshStatus = 200, force401 = false, delay = 80;
  let freshToken, nextRefresh = 'fixture-refresh-rotated';
  const refreshHeaders = [], refreshBodies = [], writes = [];
  const newPage = async () => {
    const page = await context.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      if (url.pathname === '/session-harness.html') return request.respond({ contentType: 'text/html', body: '<main id="fixture-state">Unsent fixture form</main>' });
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let status = 200, result = [];
        if (url.pathname.endsWith('/auth/refresh-token')) {
          refreshes++; refreshHeaders.push(request.headers().authorization); refreshBodies.push(request.postData() ? JSON.parse(request.postData()) : null); assert.equal(request.headers()['x-requested-with'], 'XMLHttpRequest');
          await new Promise(resolve => setTimeout(resolve, delay)); status = refreshStatus;
          headers['Set-Cookie'] = 'fixture_refresh=' + nextRefresh + '; HttpOnly; Path=/api/v1/auth; SameSite=Lax'; result = { access_token: freshToken, refresh_token: nextRefresh, expires_in: 300 };
        } else if (url.pathname.endsWith('/auth/login') || url.pathname.endsWith('/auth/google')) {
          writes.push(url.pathname); result = { access_token: freshToken, refresh_token: 'fixture-login-refresh', expires_in: 300 };
        } else if (url.pathname.endsWith('/users')) result = { userId: 'fixture-user', roles: ['SHOP_OWNER'], fullName: 'Fixture owner', status: 'ACTIVE' };
        else if (url.pathname.endsWith('/stores/mine')) result = [{ storeId: 'fixture-store', name: 'Fixture store' }];
        else if (url.pathname.endsWith('/stores/fixture-store')) result = { storeId: 'fixture-store', name: 'Fixture store', approvalStatus: 'APPROVED' };
        else if (url.pathname.endsWith('/stores/my-store/presence')) result = { online: true };
        else if (request.method() !== 'GET') throw new Error(`Unexpected write ${url.pathname}`);
        if (force401 && !url.pathname.includes('/auth/') && request.headers().authorization !== `Bearer ${freshToken}`) status = 401;
        return request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, result }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    })(); });
    await page.goto(`${base}/session-harness.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      window.fixture = {
        session: await import('/src/services/auth-session.ts'),
        api: (await import('/src/services/api.ts')).default,
        alternate: (await import('/src/lib/api.ts')).default,
        auth: (await import('/src/services/auth.service.ts')).authService,
        jwt(exp, serial) { return `${btoa('{"alg":"none"}')}.${btoa(JSON.stringify({ sub: 'fixture-user', exp, serial }))}.fixture`; },
      };
    });
    return page;
  };
  try {
    const page = await newPage();
    freshToken = await page.evaluate(() => window.fixture.jwt(Math.floor(Date.now() / 1000) + 600, 'fresh'));
    const seed = async (expired = true, role = 'SHOP_MANAGER', workspace = 'shop') => page.evaluate(({ expired, role, workspace }) => {
      const f = window.fixture;
      f.session.clearSession(undefined, false);
      const token = f.jwt(Math.floor(Date.now() / 1000) + (expired ? -5 : 600), crypto.randomUUID());
      f.session.saveLoginSession({ result: { access_token: token, refresh_token: 'fixture-refresh', expires_in: expired ? 1 : 600 } });
      localStorage.setItem('user', JSON.stringify({ id: 'fixture-user', role, fullName: 'Fixture user' }));
      localStorage.setItem('scanms-active-workspace', workspace); localStorage.setItem('scanms-current-role', workspace);
      return { session: f.session.getSessionId(), token };
    }, { expired, role, workspace });

    for (const [role, workspace] of [['SHOP_MANAGER', 'shop'], ['COLLABORATOR', 'kol'], ['CUSTOMER', 'customer'], ['SYSTEM_MANAGER', 'admin'], ['SYSTEM_ADMIN', 'admin']]) {
      const identity = await seed(true, role, workspace), before = refreshes;
      const result = await page.evaluate(async () => {
        const f = window.fixture;
        await Promise.all(Array.from({ length: 12 }, (_, i) => (i % 2 ? f.api : f.alternate).get('/session-fixture/concurrent')));
        return { session: f.session.getSessionId(), user: JSON.parse(localStorage.user), workspace: localStorage.getItem('scanms-active-workspace'), refresh: localStorage.getItem('refresh_token'), token: localStorage.token };
      });
      assert.equal(refreshes, before + 1); assert.equal(result.session, identity.session);
      assert.equal(result.user.role, role); assert.equal(result.workspace, workspace);
      assert.equal(result.refresh, null); assert.equal(result.token, freshToken);
    }

    await seed(false); force401 = true;
    const before401 = refreshes;
    await page.evaluate(() => Promise.all(Array.from({ length: 10 }, () => window.fixture.api.get('/session-fixture/unauthorized'))));
    assert.equal(refreshes, before401 + 1, 'concurrent 401s perform one refresh'); force401 = false;

    await seed(true);
    const beforeSeparateClients = refreshes;
    await page.evaluate(async () => {
      const finance = (await import('/src/services/finance.service.ts')).financeService;
      const checkout = (await import('/src/services/checkout.service.ts')).checkoutService;
      await Promise.all([finance.capabilities(), checkout.stores()]);
    });
    assert.equal(refreshes, beforeSeparateClients + 1, 'finance and checkout share the same renewal');

    await seed(true); refreshStatus = 503;
    const failed = await page.evaluate(async () => {
      try { await window.fixture.api.get('/session-fixture/outage'); } catch { /* expected */ }
      return { token: localStorage.token, user: localStorage.user, refresh: localStorage.getItem('refresh_token'), workspace: localStorage.getItem('scanms-active-workspace') };
    });
    assert.ok(failed.token && failed.user); assert.equal(failed.refresh, null); assert.equal(failed.workspace, 'shop');
    refreshStatus = 200; await page.evaluate(() => window.fixture.api.get('/session-fixture/reconnected'));

    await seed(true); refreshStatus = 401;
    await page.evaluate(async () => { try { await window.fixture.api.get('/session-fixture/revoked'); } catch {} });
    assert.deepEqual(await page.evaluate(() => ['token', 'user', 'refresh_token'].map(key => localStorage.getItem(key))), [null, null, null]);
    refreshStatus = 200;

    await seed(true); delay = 300;
    await page.evaluate(() => { window.fixture.pending = window.fixture.session.renewSession().catch(() => null); });
    await new Promise(resolve => setTimeout(resolve, 80));
    await page.evaluate(() => window.fixture.session.clearSession());
    await page.evaluate(() => window.fixture.pending);
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), null, 'late refresh cannot undo logout');
    delay = 80;

    await seed(true);
    await page.evaluate(() => { window.fixture.stop = window.fixture.session.startSessionRefresh(); window.dispatchEvent(new Event('focus')); });
    await page.waitForFunction(expected => localStorage.token === expected, {}, freshToken);
    assert.equal(await page.evaluate(() => localStorage.getItem('scanms-active-workspace')), 'shop');
    await page.evaluate(() => window.fixture.stop());

    // Renew on the timer even when the user neither changes focus nor makes API calls.
    await seed(false);
    await page.evaluate(() => {
      const original = window.setInterval;
      window.setInterval = (callback, delay) => {
        if (delay === 15000) window.fixture.tick = callback;
        return original(callback, delay);
      };
      window.fixture.stop = window.fixture.session.startSessionRefresh();
      window.setInterval = original;
      const parts = localStorage.token.split('.');
      const claims = JSON.parse(atob(parts[1])); claims.exp = Math.floor(Date.now() / 1000) + 10;
      localStorage.token = `${parts[0]}.${btoa(JSON.stringify(claims))}.fixture`;
      window.fixture.tick();
    });
    await page.waitForFunction(expected => localStorage.token === expected, {}, freshToken);
    assert.equal(await page.evaluate(() => localStorage.getItem('scanms-active-workspace')), 'shop');
    await page.evaluate(() => window.fixture.stop());

    // getMe must accept token rotation without resetting a shop owner's customer workspace.
    await seed(true, 'SHOP_MANAGER', 'customer');
    await page.evaluate(() => window.fixture.auth.getMe());
    assert.equal(await page.evaluate(() => localStorage.getItem('scanms-active-workspace')), 'customer');

    // A stale response from a previous login must not overwrite or clear the new login.
    await seed(true); delay = 300;
    await page.evaluate(() => { window.fixture.pending = window.fixture.session.renewSession().catch(() => null); });
    await new Promise(resolve => setTimeout(resolve, 70));
    await page.evaluate(() => {
      window.fixture.session.saveLoginSession({ access_token: 'other-account-token', refresh_token: 'other-account-refresh', expires_in: 600 });
      localStorage.user = JSON.stringify({ id: 'other-user', role: 'CUSTOMER' });
    });
    await page.evaluate(() => window.fixture.pending);
    assert.equal(await page.evaluate(() => localStorage.token), 'other-account-token'); delay = 80;

    // Both login methods retain develop's HttpOnly contract and never persist JS refresh tokens.
    await page.evaluate(() => window.fixture.auth.login('fixture@example.test', 'fixture-password'));
    assert.equal(await page.evaluate(() => localStorage.getItem('refresh_token')), null);
    await page.evaluate(() => window.fixture.auth.googleLogin('fixture-identity-token'));
    assert.equal(await page.evaluate(() => localStorage.getItem('refresh_token')), null);
    assert.deepEqual(writes, ['/api/v1/auth/login', '/api/v1/auth/google']);
    assert.ok(refreshHeaders.every(value => !value), 'refresh endpoint never receives expired Authorization');
    assert.ok(refreshBodies.every(value => value === null), 'refresh tokens must not appear in request bodies'); const cookie = (await context.cookies()).find(cookie => cookie.name === 'fixture_refresh'); assert.ok(cookie?.httpOnly); assert.equal(cookie.value, nextRefresh);

    // Two open tabs share one rotated refresh token and keep their in-progress page state.
    const second = await newPage();
    const tabsIdentity = await seed(true); delay = 200;
    await second.waitForFunction(identity => localStorage.getItem('scanms-session-id') === identity.session && localStorage.token === identity.token, {}, tabsIdentity);
    await page.evaluate(async () => { window.fixture.stopSync = (await import('/src/utils/auth-tab-sync.ts')).startAuthTabSync(); window.unsavedFixture = 'keep me'; });
    await second.evaluate(async () => { window.fixture.stopSync = (await import('/src/utils/auth-tab-sync.ts')).startAuthTabSync(); window.unsavedFixture = 'second tab'; });
    const beforeTabs = refreshes;
    await Promise.all([page.evaluate(() => window.fixture.session.renewSession()), second.evaluate(() => window.fixture.session.renewSession())]);
    assert.equal(refreshes, beforeTabs + 1, 'Web Locks serialize refresh-token rotation across tabs');
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(await page.evaluate(() => window.unsavedFixture), 'keep me');
    assert.equal(await second.evaluate(() => window.unsavedFixture), 'second tab');
    await page.evaluate(() => window.fixture.stopSync()); await second.evaluate(() => window.fixture.stopSync());
    await second.close();

    // Verify the actual shop page survives both focus resumption and a full reload.
    await seed(true);
    await page.goto(`${base}/merchant/dashboard`);
    await page.waitForSelector('.shop-overview-metrics');
    assert.equal(new URL(page.url()).pathname, '/merchant/dashboard');
    await page.evaluate(() => { window.unsavedFixture = 'keep shop page'; });
    const beforeFocus = refreshes;
    await page.evaluate(() => {
      const parts = localStorage.token.split('.');
      const claims = JSON.parse(atob(parts[1])); claims.exp = Math.floor(Date.now() / 1000) - 5;
      localStorage.token = `${parts[0]}.${btoa(JSON.stringify(claims))}.fixture`;
      window.dispatchEvent(new Event('focus'));
    });
    await page.waitForFunction(expected => localStorage.token === expected, {}, freshToken);
    assert.equal(refreshes, beforeFocus + 1);
    assert.equal(await page.evaluate(() => window.unsavedFixture), 'keep shop page');
    assert.equal(new URL(page.url()).pathname, '/merchant/dashboard');
    await page.reload(); await page.waitForSelector('.shop-overview-metrics');
    assert.equal(new URL(page.url()).pathname, '/merchant/dashboard');
    refreshStatus = 401;
    await page.evaluate(() => {
      const parts = localStorage.token.split('.'), claims = JSON.parse(atob(parts[1]));
      claims.exp = Math.floor(Date.now() / 1000) - 5;
      localStorage.token = `${parts[0]}.${btoa(JSON.stringify(claims))}.fixture`;
      window.dispatchEvent(new Event('focus'));
    });
    await page.waitForFunction(() => location.pathname === '/login');
    assert.equal(new URL(page.url()).searchParams.get('redirect'), '/merchant/dashboard');
  } finally { await context.close(); await browser.close(); }
});
