import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('voucher menu counts match all available vouchers per account and top-up alone stays expanded', {
  skip: !base || !existsSync(executablePath), timeout: 30000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    await browser.defaultBrowserContext().overridePermissions(origin, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    await page.setViewport({ width: 1440, height: 1000 });
    let identity = 'customer-a';
    const saved = { 'customer-a': ['voucher-1', 'expired', 'saved-outside-public-page'], 'customer-b': ['voucher-2', 'voucher-3'], 'customer-empty': [] };
    const vouchers = ['voucher-1', 'voucher-2', 'voucher-3', 'expired', 'saved-outside-public-page'].map((id, i) => ({
      id, code: i === 4 ? 'SCANMSCHAMSOCSACDEP2026' : `SAVE${i}`,
      discountType: i === 2 ? 'PERCENTAGE' : 'FIXED_AMOUNT', discountValue: [15000, 10000, 15, 20000, 1500000][i], minimumOrderAmount: 100000,
      maximumDiscountAmount: i === 2 ? 50000 : null, remainingUses: 10, expiresAt: id === 'expired' ? '2000-01-01' : '2099-01-01',
      scopeType: 'STORE_WIDE', fundingSource: i === 1 || i === 2 ? 'PLATFORM_FUNDED' : 'SHOP_FUNDED', benefitType: i === 2 ? 'SHIPPING' : 'GOODS',
      store: { id: 'store', slug: 'test-store', name: i === 4 ? 'Gian hàng chăm sóc sức khỏe và sắc đẹp SCANMS' : 'Sora Skin' },
    }));
    const user = () => ({ id: identity, email: `${identity}@example.test`, role: 'CUSTOMER', fullName: identity });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'qa-customer-a');
      localStorage.setItem('user', JSON.stringify({ id: 'customer-a', role: 'CUSTOMER', fullName: 'Customer A' }));
    });
    let financialRequests = 0;
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
        let data = [];
        if (url.pathname === '/api/auth/me') data = user();
        if (url.pathname === '/api/customer/profile') data = { user: user(), stats: { totalOrders: 0, pendingOrders: 0, totalSpending: 0, wishlistCount: 0 } };
        if (url.pathname === '/api/coupons/available') data = vouchers.filter(v => v.id !== 'expired' && v.id !== 'saved-outside-public-page');
        if (url.pathname === '/api/coupons/saved') data = saved[identity];
        if (url.pathname === '/api/coupons/saved/details') data = vouchers.filter(v => v.id !== 'expired' && saved[identity].includes(v.id));
        if (url.pathname === '/api/coupons/saved/expired') data = vouchers.filter(v => v.id === 'expired' && saved[identity].includes(v.id));
        if (/\/api\/coupons\/saved\//.test(url.pathname) && ['POST', 'DELETE'].includes(request.method())) {
          const id = url.pathname.split('/').at(-1);
          saved[identity] = request.method() === 'POST' ? [...new Set([...saved[identity], id])] : saved[identity].filter(savedId => savedId !== id);
          data = { saved: request.method() === 'POST' };
        }
        if (url.pathname === '/api/wallets/me') data = { availableBalance: '500000', pendingBalance: '0' };
        if (url.pathname === '/api/wallets/me/ledger') data = { entries: [], total: 0, page: 1, limit: 10 };
        if (url.pathname === '/api/wallets/top-up-payos/availability') data = { available: true };
        if (url.pathname === '/api/wallets/top-up-payos/pending') data = null;
        if (url.pathname.startsWith('/api/wallets/') && request.method() === 'POST') financialRequests++;
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    const nav = 'nav[aria-label="Menu chức năng"] a[href="/customer/vouchers"]';
    const waitCount = async count => {
      await page.waitForFunction((selector, expected) => document.querySelector(selector)?.textContent.trim().endsWith(String(expected)), {}, nav, count);
    };
    await page.goto(`${base}/customer/vouchers`);
    await waitCount(4);
    assert.equal(await page.$$eval('.customer-vouchers > .customer-vouchers-grid button', els => els.some(el => ['Tất cả', 'Đã lưu'].includes(el.textContent.trim()))), false);
    assert.equal(await page.$$eval('.customer-vouchers > .customer-vouchers-grid article', els => els.length), 4);
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewport({ width, height: 1000 });
      const layout = await page.$$eval('.customer-vouchers > .customer-vouchers-grid .customer-voucher-card', cards => cards.map(card => {
        const amount = card.querySelector('.customer-voucher-amount');
        const value = card.querySelector('.customer-voucher-value');
        const a = amount.getBoundingClientRect(), v = value.getBoundingClientRect();
        return { contained: card.scrollWidth <= card.clientWidth + 1, amountContained: amount.scrollWidth <= amount.clientWidth + 1 && a.left >= v.left && a.right <= v.right };
      }));
      assert.ok(layout.every(row => row.contained && row.amountContained), `voucher content and monetary values fit at ${width}px: ${JSON.stringify(layout)}`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no page overflow at ${width}px`);
      if (width === 1440) {
        const positions = await page.$$eval('.customer-voucher-actions', els => els.map(el => el.getBoundingClientRect().top));
        assert.equal(positions[0], positions[1], 'first-row action buttons align');
        assert.equal(positions[2], positions[3], 'second-row action buttons align with large monetary values');
      }
      if (width === 1440 || width === 390) await (await page.$('.customer-vouchers-grid')).screenshot({ path: join(tmpdir(), `scanms-vouchers-redesign-${width}.png`) });
    }
    await page.setViewport({ width: 1440, height: 1000 });
    await page.bringToFront();
    await page.$eval('.customer-voucher-code', el => el.scrollIntoView({ block: 'center' }));
    await page.click('.customer-voucher-code');
    await page.waitForSelector('.customer-voucher-code[data-copied="true"]');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'SAVE0');
    await page.click('.customer-voucher-terms summary');
    assert.equal(await page.$eval('.customer-voucher-terms', el => el.open), true);
    await page.click('.customer-voucher-terms summary');
    assert.equal(await page.$eval('.customer-voucher-use', el => el.getAttribute('href')), '/shop/test-store');
    const savedResponse = page.waitForResponse(response => response.url().includes('/coupons/saved/') && response.request().method() === 'POST');
    const saveButtons = await page.$$('.customer-vouchers > .customer-vouchers-grid button');
    for (const button of saveButtons) if (await button.evaluate(el => el.textContent.trim() === 'Lưu mã')) { await button.click(); break; }
    await savedResponse;
    await waitCount(4);
    await page.waitForFunction(() => [...document.querySelectorAll('.customer-vouchers > .customer-vouchers-grid button')].every(button => !button.disabled));
    const removedResponse = page.waitForResponse(response => response.url().includes('/coupons/saved/') && response.request().method() === 'DELETE');
    const removeButtons = await page.$$('.customer-vouchers > .customer-vouchers-grid button');
    for (const button of removeButtons) if (await button.evaluate(el => el.textContent.trim() === 'Bỏ lưu')) { await button.click(); break; }
    await removedResponse;
    await waitCount(4);
    await page.waitForFunction(() => [...document.querySelectorAll('.customer-vouchers > .customer-vouchers-grid button')].every(button => !button.disabled));
    assert.equal(await page.$$eval('.customer-vouchers > .customer-vouchers-grid article', els => els.length), 4);
    for (const [next, count] of [['customer-b', 3], ['customer-empty', 3]]) {
      identity = next;
      await page.evaluate(id => {
        localStorage.setItem('token', `qa-${id}`);
        localStorage.setItem('user', JSON.stringify({ id, role: 'CUSTOMER', fullName: id }));
        window.dispatchEvent(new Event('auth-user-updated'));
      }, identity);
      await waitCount(count);
      await page.waitForFunction(expected => document.querySelectorAll('.customer-vouchers > .customer-vouchers-grid article').length === expected, {}, count);
    }
    await (await page.$(nav)).screenshot({ path: join(tmpdir(), 'scanms-voucher-menu-count.png') });
    await page.click('a[href="/customer/wallet"]');
    await page.waitForSelector('#cw-payos-amount');
    const header = '[aria-labelledby="customer-topup-title"] > header';
    assert.equal(await page.$('[aria-labelledby="customer-topup-title"] > summary'), null);
    await page.click(header);
    assert.equal(await page.$eval('#cw-payos-amount', el => el.getBoundingClientRect().height > 0), true);
    const history = await page.$$eval('details > summary', els => els.find(el => el.textContent.includes('Lịch sử giao dịch'))?.parentElement.open);
    assert.equal(history, false);
    assert.equal(financialRequests, 0);
    await (await page.$('[aria-labelledby="customer-topup-title"]')).screenshot({ path: join(tmpdir(), 'scanms-wallet-topup-always-open.png') });
  } finally { await browser.close(); }
});
