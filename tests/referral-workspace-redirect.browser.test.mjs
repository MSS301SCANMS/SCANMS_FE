import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('short links open the public product for guests and operating workspaces without changing workspace', {
  skip: !base || !existsSync(executablePath), timeout: 60000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const store = { id: 'test-store', name: 'Sora Skin' };
  const product = { id: 'test-product', sku: 'TEST-SHIRT', title: 'Referral test shirt', price: 299000, stockQuantity: 10, isActive: true, canPurchase: true, status: 'ACTIVE', variants: [], store };
  const landing = { product, store, images: [], videos: [], reviews: { averageRating: 0, totalReviews: 0, starDistribution: {}, items: [] }, availability: { inStock: true, stockQuantity: 10 }, policies: {} };
  try {
    for (const [workspace, role] of [['guest', null], ['kol', 'COLLABORATOR'], ['shop', 'SHOP_OWNER'], ['admin', 'SYSTEM_ADMIN']]) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => { if (!error.message.includes('WebSocket closed')) errors.push(error.message); });
      await page.evaluateOnNewDocument((workspace, role) => {
        localStorage.clear();
        if (role) {
          localStorage.setItem('token', 'isolated-test-token');
          localStorage.setItem('user', JSON.stringify({ id: 'test-user', fullName: 'Test user', role }));
          localStorage.setItem('scanms-active-workspace', workspace);
          localStorage.setItem('scanms-current-role', workspace);
        }
      }, workspace, role);
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/')) {
          const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,authorization,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
          if (request.method() === 'OPTIONS') return void request.respond({ status: 204, headers });
          let result = [];
          if (url.pathname.includes('/referrals/resolve/')) { assert.equal(request.headers().authorization, undefined); result = { productId: product.id, referralLinkId: 'test-referral' }; }
          if (url.pathname.endsWith('/landing')) result = landing;
          if (url.pathname.endsWith('/users') || url.pathname.endsWith('/users/me')) result = { userId: 'test-user', fullName: 'Test user', roles: [role], status: 'ACTIVE' };
          if (url.pathname.includes('/stock')) result = { stockQuantity: 10, variants: [] };
          return void request.respond({ headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
        }
        if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return void request.abort();
        void request.continue();
      });
      await page.goto(`${origin}/r/test-short-link`);
      await page.waitForFunction(() => location.pathname === '/products/test-product' && document.body.innerText.includes('Referral test shirt'), { timeout: 15000 });
      await page.waitForNetworkIdle({ idleTime: 300 });
      assert.equal(new URL(page.url()).pathname, '/products/test-product', workspace);
      assert.equal(new URL(page.url()).searchParams.get('ref'), 'test-referral');
      assert.equal(await page.evaluate(() => localStorage.getItem('scanms-active-workspace')), role ? workspace : null);
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser.close(); }
});
