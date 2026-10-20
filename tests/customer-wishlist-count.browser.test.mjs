import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('wishlist menu follows real saved products, mutations and account changes', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(8000);
    await page.setViewport({ width: 1440, height: 1000 });
    const products = ['Cleanser', 'Serum', 'Sunscreen'].map((title, i) => ({
      wishlistId: `saved-${i}`, createdAt: '2026-10-18T00:00:00Z',
      product: { id: `00000000-0000-4000-8000-00000000000${i}`, title, sku: `TEST-${i}`, price: 100000,
        stockQuantity: 10, isActive: true, imageUrl: '/assets/products/real/amino-cleanser-ph55.jpg',
        store: { id: '00000000-0000-4000-8000-000000000099', name: 'Sora Skin', slug: 'sora-skin' }, variants: [] },
    }));
    const saved = { a: [products[0], products[1]], b: [products[2]], empty: [] };
    let seedIdentity = 'a';
    await page.evaluateOnNewDocument(() => {
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', 'qa-a');
        localStorage.setItem('user', JSON.stringify({ id: 'a', role: 'CUSTOMER', fullName: 'Customer A' }));
      }
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: `
        const socket={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};
        export const getChatSocket=()=>socket;
        export const isChatSocketAuthenticated=()=>false;
        export const disconnectChatSocket=()=>{};
      ` });
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache',
          'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        const identity = request.headers().authorization?.replace('Bearer qa-', '') || seedIdentity;
        const user = { id: identity, email: `${identity}@example.test`, role: 'CUSTOMER', fullName: `Customer ${identity}` };
        let data = [];
        if (url.pathname === '/api/auth/me') data = user;
        // Deliberately differs from the visible list: the badge must use actual wishlist items.
        if (url.pathname === '/api/customer/profile') data = { user, stats: { totalOrders: 0, pendingOrders: 0, totalSpending: 0, wishlistCount: 999 } };
        if (url.pathname === '/api/customer/wishlist') data = saved[identity];
        const mutation = url.pathname.match(/^\/api\/customer\/wishlist\/([^/]+)(\/toggle)?$/);
        if (mutation && ['POST', 'DELETE'].includes(request.method())) {
          const productId = mutation[1];
          const alreadySaved = saved[identity].some(item => item.product.id === productId);
          saved[identity] = saved[identity].filter(item => item.product.id !== productId);
          if (request.method() === 'POST' && !alreadySaved) saved[identity].push(products.find(item => item.product.id === productId));
          data = { wishlisted: request.method() === 'POST' && !alreadySaved };
        }
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    const nav = 'nav[aria-label="Menu chức năng"] a[href="/customer/wishlist"]';
    const section = 'section[aria-label="Sản phẩm yêu thích"]';
    const waitCount = count => page.waitForFunction((selector, expected) => {
      const link = document.querySelector(selector);
      return link && link.textContent.trim().endsWith(String(expected));
    }, {}, nav, count);
    const waitItems = count => page.waitForFunction((selector, expected) => document.querySelector(selector)?.querySelectorAll('article').length === expected, {}, section, count);
    const switchAccount = async id => {
      seedIdentity = id;
      await page.evaluate(next => {
        localStorage.setItem('token', `qa-${next}`);
        localStorage.setItem('user', JSON.stringify({ id: next, role: 'CUSTOMER', fullName: `Customer ${next}` }));
        window.dispatchEvent(new Event('auth-user-updated'));
      }, id);
    };
    await page.goto(`${base}/customer/wishlist`);
    await waitCount(2);
    await waitItems(2);
    assert.equal(await page.$eval('#wishlist-list-heading', el => /\d+ sản phẩm/.test(el.parentElement.textContent)), false, 'old toolbar badge is removed');
    await page.type('input[aria-label="Tìm trong sản phẩm yêu thích"]', 'Serum');
    await waitItems(1);
    await waitCount(2);
    await page.click('button[aria-label="Xóa từ khóa"]');
    await page.click('button[aria-label="Bỏ yêu thích Cleanser"]');
    await waitCount(1);
    await waitItems(1);
    assert.equal(saved.a.length, 1);
    await page.evaluate(async id => {
      const { customerService } = await import('/src/services/customer.service.ts');
      await customerService.toggleWishlist(id);
    }, products[0].product.id);
    await waitCount(2);
    await waitItems(2);
    await switchAccount('b');
    await waitCount(1);
    await waitItems(1);
    assert.equal(await page.$eval(`${section} article`, el => el.textContent.includes('Sunscreen')), true);
    await page.click('button[aria-label="Bỏ yêu thích Sunscreen"]');
    await waitCount(0);
    await waitItems(0);
    await switchAccount('a');
    await waitCount(2);
    await waitItems(2);
    const box = await page.$eval(nav, el => {
      const rect = el.getBoundingClientRect();
      return { fits: el.scrollWidth <= el.clientWidth, height: rect.height };
    });
    assert.ok(box.fits && box.height >= 40);
    await (await page.$(nav)).screenshot({ path: join(tmpdir(), 'scanms-wishlist-menu-count.png') });
    await page.click('a[href="/customer/vouchers"]');
    await waitCount(2);
    await page.reload();
    await waitCount(2);
    await switchAccount('empty');
    await waitCount(0);
    await page.click(nav);
    await waitItems(0);
    assert.ok(await page.$eval(section, el => el.textContent.includes('Chưa có sản phẩm yêu thích')));
  } finally { await browser.close(); }
});
