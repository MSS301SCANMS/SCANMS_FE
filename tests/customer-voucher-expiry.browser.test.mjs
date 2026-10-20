import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('saved vouchers move to disabled expiry history without reload and stay isolated by account', {
  skip: !base || !existsSync(executablePath), timeout: 30000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    await page.setViewport({ width: 1440, height: 1000 });
    const errors = [], mutations = [];
    page.on('pageerror', err => errors.push(err.message));
    const current = Date.parse('2026-10-18T04:30:00Z');
    const make = (id, expiresAt) => ({ id, code: id.toUpperCase(), discountType: 'FIXED_AMOUNT', discountValue: 15000,
      minimumOrderAmount: 100000, maximumDiscountAmount: null, remainingUses: 10, expiresAt,
      scopeType: 'STORE_WIDE', fundingSource: 'SHOP_FUNDED', benefitType: 'GOODS', store: { id: 'shop', name: 'Sora Skin', slug: 'sora-skin' } });
    const future = make('future', '2099-01-01T00:00:00Z');
    const soon = make('soon', new Date(current + 4 * 3600000).toISOString());
    const expired = make('expired-a', new Date(current - 1000).toISOString());
    const expiredB = make('expired-b', new Date(current - 5000).toISOString());
    let owner = 'a', time = current;
    await page.evaluateOnNewDocument(current => {
      const ActualDate = Date;
      window.qaTime = current;
      window.Date = class extends ActualDate {
        constructor(...args) { if (args.length) super(...args); else super(window.qaTime); }
        static now() { return window.qaTime; }
      };
      localStorage.setItem('token', 'qa-a');
      localStorage.setItem('user', JSON.stringify({ id: 'a', role: 'CUSTOMER', fullName: 'Customer A' }));
    }, current);
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: `
        const socket={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};
        export const getChatSocket=()=>socket; export const isChatSocketAuthenticated=()=>false; export const disconnectChatSocket=()=>{};
      ` });
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type',
          'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        const user = { id: owner, role: 'CUSTOMER', fullName: `Customer ${owner}` };
        let data = [];
        const active = [future, soon].filter(v => Date.parse(v.expiresAt) > time);
        if (url.pathname === '/api/auth/me') data = user;
        if (url.pathname === '/api/customer/profile') data = { user, stats: {} };
        if (url.pathname === '/api/customer/cart') data = { items: [] };
        if (url.pathname === '/api/coupons/available') data = active;
        if (url.pathname === '/api/coupons/saved') data = owner === 'a' ? ['soon', expired.id] : [expiredB.id];
        if (url.pathname === '/api/coupons/saved/details') data = owner === 'a' && Date.parse(soon.expiresAt) > time ? [soon] : [];
        if (url.pathname === '/api/coupons/saved/expired') data = owner === 'a' ? [expired, ...(Date.parse(soon.expiresAt) <= time ? [soon] : [])] : [expiredB];
        if (['POST', 'DELETE'].includes(request.method())) mutations.push(url.pathname);
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    const activeSelector = '.customer-vouchers > .customer-vouchers-grid';
    const menu = 'nav[aria-label="Menu chức năng"] a[href="/customer/vouchers"]';
    const count = n => page.waitForFunction((menu, n) => document.querySelector(menu)?.textContent.trim().endsWith(String(n)), {}, menu, n);
    await page.goto(`${base}/customer/vouchers`);
    await count(2);
    assert.equal(await page.$$eval(`${activeSelector} article`, els => els.length), 2);
    assert.equal(await page.$eval('[data-voucher-state="soon"] .customer-voucher-state', el => el.textContent), 'Sắp hết hạn');
    assert.match(await page.$eval('[data-voucher-state="soon"] time', el => el.textContent), /15:30 chiều, ngày 18\/10\/2026/);
    assert.equal(await page.$eval('[data-voucher-state="soon"] .customer-voucher-countdown', el => el.textContent), 'Còn 4 giờ');
    assert.match(await page.$eval('[data-voucher-state="soon"] .customer-voucher-expiry', el => el.textContent), /Dùng trước/);
    await page.click('[data-voucher-state="soon"] .customer-voucher-terms summary');
    assert.match(await page.$eval('[data-voucher-state="soon"] dl', el => el.textContent), /Voucher ngừng sử dụng từ thời điểm trên, theo giờ Việt Nam/);
    assert.doesNotMatch(await page.$eval('[data-voucher-state="soon"] dl', el => el.textContent), /Hết hạn lúc/);
    await page.click('[data-voucher-state="soon"] .customer-voucher-terms summary');
    assert.equal(await page.$eval('.customer-vouchers-history', el => el.open), false);
    await page.click('.customer-vouchers-history > summary');
    assert.equal(await page.$eval('.customer-vouchers-history article', el => el.dataset.voucherState), 'expired');
    assert.equal(await page.$eval('.customer-vouchers-history .customer-voucher-state', el => el.textContent), 'Đã hết hạn');
    assert.equal(await page.$('.customer-vouchers-history a'), null);
    assert.equal(await page.$$eval('.customer-vouchers-history .customer-voucher-actions button', els => els.every(el => el.disabled)), true);
    await page.$eval('.customer-vouchers-history .customer-voucher-use', el => el.click());
    assert.equal(new URL(page.url()).pathname, '/customer/vouchers');
    assert.deepEqual(mutations, []);
    time = Date.parse(soon.expiresAt) - (3 * 60 + 12) * 60000;
    await page.evaluate(time => { window.qaTime = time; window.dispatchEvent(new Event('focus')); }, time);
    await page.waitForFunction(() => document.querySelector('.customer-voucher-countdown')?.textContent === 'Còn 3 giờ 12 phút');
    await page.click('.customer-vouchers-history .customer-voucher-terms summary');
    assert.equal(await page.$eval('.customer-vouchers-history .customer-voucher-terms', el => el.open), true);
    // Cross the exact expiry boundary without a page reload or an API refetch.
    time = Date.parse(soon.expiresAt);
    await page.evaluate(time => { window.qaTime = time; window.dispatchEvent(new Event('focus')); }, time);
    await count(1);
    await page.waitForFunction(() => document.querySelectorAll('.customer-vouchers-history article').length === 2);
    assert.equal(await page.$$eval(`${activeSelector} article`, els => els.length), 1);
    assert.equal(await page.$$eval('.customer-vouchers-history .customer-voucher-use', els => els.every(el => el.disabled)), true);
    for (const width of [1440, 390, 320]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.$$eval('.customer-voucher-card', els => els.every(el => el.scrollWidth <= el.clientWidth + 1)), `cards fit ${width}px`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (width !== 320) await (await page.$('.customer-vouchers')).screenshot({ path: join(tmpdir(), `scanms-voucher-expiry-${width}.png`) });
    }
    await page.setViewport({ width: 1440, height: 1000 });
    owner = 'b';
    await page.evaluate(() => {
      localStorage.setItem('token', 'qa-b'); localStorage.setItem('user', JSON.stringify({ id: 'b', role: 'CUSTOMER', fullName: 'Customer B' }));
      window.dispatchEvent(new Event('auth-user-updated'));
    });
    await page.waitForFunction(() => document.querySelector('.customer-vouchers-history article')?.textContent.includes('EXPIRED-B'));
    assert.equal(await page.$$eval('.customer-vouchers-history article', els => els.length), 1);
    assert.doesNotMatch(await page.$eval('.customer-vouchers', el => el.textContent), /EXPIRED-A/);
    await count(1);
    // Also exercise the scheduled timer itself, with no focus event or API refresh.
    owner = 'a'; time = current;
    soon.expiresAt = new Date(current + 1500).toISOString();
    await page.reload();
    await count(2);
    time = Date.parse(soon.expiresAt);
    await page.evaluate(time => { window.qaTime = time; }, time);
    await count(1);
    assert.equal(await page.$$eval('.customer-vouchers-history article', els => els.length), 2);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
