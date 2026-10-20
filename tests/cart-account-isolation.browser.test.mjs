import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const item = (n, quantity) => ({
  cartItemId: `${id(n)}_base`, productId: id(n), title: `Product ${n}`, sku: `SKU-${n}`,
  price: 100000, quantity, stockQuantity: 50, isActive: true,
  imageUrl: '/assets/products/real/amino-cleanser-ph55.jpg', store: { id: id(100), name: 'Test Shop' },
});

test('cart badge, products and checkout stay with their owner across account changes and slow responses', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    await page.setViewport({ width: 1440, height: 1000 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const baskets = { a: [item(1, 2)], b: [item(2, 5)], empty: [] };
    const writes = [];
    const pendingProfiles = [];
    const pendingCarts = [];
    let holdProfiles = true, holdCartFor = '';
    const user = owner => ({ id: owner, role: 'CUSTOMER', fullName: `Customer ${owner}`, email: `${owner}@example.test` });
    await page.evaluateOnNewDocument(() => {
      if (!localStorage.getItem('qa-initialized')) {
        localStorage.setItem('qa-initialized', 'true');
        localStorage.setItem('token', 'qa-a');
        localStorage.setItem('user', JSON.stringify({ id: 'a', role: 'CUSTOMER', fullName: 'Customer a' }));
      }
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        const owner = request.headers().authorization?.replace('Bearer qa-', '');
        const respond = data => request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) }).catch(() => {});
        if (url.pathname === '/api/auth/me') {
          if (holdProfiles) { pendingProfiles.push(() => respond(user(owner))); return; }
          return respond(user(owner));
        }
        if (url.pathname === '/api/customer/cart') {
          assert.ok(owner in baskets, 'cart endpoint always has the intended authenticated owner');
          if (request.method() === 'PUT') {
            const submitted = JSON.parse(request.postData()).items;
            writes.push({ owner, items: submitted });
            baskets[owner] = submitted.map(row => ({ ...item(Number(row.productId.slice(-12)), row.quantity), ...row }));
          }
          const response = { items: structuredClone(baskets[owner]), syncedAt: new Date().toISOString() };
          if (request.method() === 'GET' && holdCartFor === owner) { pendingCarts.push(() => respond(response)); return; }
          return respond(response);
        }
        if (url.pathname === '/api/customer/profile') return respond({ user: user(owner), stats: {} });
        if (url.pathname === '/api/wallets/me') return respond({ availableBalance: 0, pendingBalance: 0 });
        if (url.pathname === '/api/orders/validate-cart') return respond({
          items: JSON.parse(request.postData()).items.map(row => ({ ...row, currentPrice: row.clientPrice, stockQuantity: 50, isActive: true })), warnings: [],
        });
        if (/\/api\/(orders|payments)\//.test(url.pathname) && request.method() !== 'GET') {
          assert.fail(`Unexpected order/payment mutation: ${url.pathname}`);
        }
        return respond([]);
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    const changeAccount = async owner => page.evaluate(owner => {
      if (owner) {
        localStorage.setItem('token', `qa-${owner}`);
        localStorage.setItem('user', JSON.stringify({ id: owner, role: 'CUSTOMER', fullName: `Customer ${owner}` }));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      window.dispatchEvent(new Event('auth-user-updated'));
    }, owner);
    const waitCount = count => page.waitForFunction(expected => {
      const button = document.querySelector('button[aria-label="Giỏ hàng"]');
      return button && (Number(button.textContent.trim()) || 0) === expected;
    }, {}, count);
    const openCart = async () => {
      await page.click('button[aria-label="Giỏ hàng"]');
      await page.waitForSelector('.scanms-cart-dialog[open]');
      await page.waitForFunction(() => !document.querySelector('.scanms-cart-panel').getAnimations().some(a => a.playState === 'running'));
    };
    const checkProducts = async title => {
      const titles = await page.$$eval('.scanms-cart-item__heading h3', els => els.map(el => el.textContent.trim()));
      assert.deepEqual(titles, [title]);
    };
    await page.goto(base);
    await waitCount(2);
    await openCart();
    await checkProducts('Product 1');
    const quantitySaved = page.waitForResponse(response => response.url().endsWith('/api/customer/cart') && response.request().method() === 'PUT');
    await page.click('.scanms-cart-quantity button:last-child');
    await waitCount(3);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('scanms_cart_u_a'))?.[0]?.quantity === 3);
    await quantitySaved;
    await changeAccount('b');
    await waitCount(5);
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('scanms_cart_u_b'))?.[0]?.productId.endsWith('000002'));
    // Account changes close the previous owner's open cart and checkout.
    await page.waitForSelector('.scanms-cart-dialog', { hidden: true });
    holdProfiles = false;
    await Promise.all(pendingProfiles.splice(0).map(release => release()));
    await page.waitForNetworkIdle({ idleTime: 200 });
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('user')).id), 'b', 'late profile responses cannot restore account A');
    await openCart();
    await checkProducts('Product 2');
    await page.click('.scanms-cart-checkout');
    await page.waitForSelector('button[title="Quay lại mua sắm"]').catch(async error => {
      throw new Error(`${error.message}; ${JSON.stringify(errors)}; ${await page.$eval('body', el => el.innerText.slice(-2500))}`);
    });
    await changeAccount('empty');
    await waitCount(0);
    await page.waitForSelector('button[title="Quay lại mua sắm"]', { hidden: true });
    await openCart();
    await page.waitForSelector('.scanms-cart-empty');
    await changeAccount('a');
    await waitCount(3);
    await openCart();
    await checkProducts('Product 1');
    await changeAccount(null);
    await waitCount(0);
    await openCart();
    await page.waitForSelector('.scanms-cart-empty');
    holdCartFor = 'a';
    const delayedCartRequested = page.waitForRequest(request => request.url().endsWith('/api/customer/cart') && request.method() === 'GET');
    await changeAccount('a');
    await delayedCartRequested;
    await changeAccount('b');
    await waitCount(5);
    await Promise.all(pendingCarts.splice(0).map(release => release()));
    await page.waitForNetworkIdle({ idleTime: 200 });
    await openCart();
    await checkProducts('Product 2');
    await page.reload();
    await waitCount(5);
    await openCart();
    await checkProducts('Product 2');
    assert.ok(writes.length > 0);
    for (const write of writes) assert.ok(write.items.every(row => row.productId === id(write.owner === 'a' ? 1 : 2)), 'no basket is written under another account');

    // A new guest basket can be claimed once at sign-in, without copying another account's items.
    await changeAccount(null);
    await waitCount(0);
    await page.evaluate(guest => {
      localStorage.setItem('scanms_cart_guest', JSON.stringify([guest]));
      localStorage.setItem('scanms_cart_selected_guest', JSON.stringify([guest.cartItemId]));
    }, item(9, 2));
    await page.reload();
    await waitCount(2);
    const guestSaved = page.waitForResponse(response => response.url().endsWith('/api/customer/cart') && response.request().method() === 'PUT');
    await changeAccount('empty');
    await waitCount(2);
    await guestSaved;
    await openCart();
    await checkProducts('Product 9');
    assert.equal(await page.evaluate(() => localStorage.getItem('scanms_cart_guest')), null);
    await changeAccount('b');
    await waitCount(5);
    await openCart();
    await checkProducts('Product 2');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
