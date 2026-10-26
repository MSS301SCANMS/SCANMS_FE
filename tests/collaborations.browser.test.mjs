import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('collaborations support retry, uncached refresh, search, filters, details and the correct role scope', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const artifacts = new URL('../.qa-artifacts/collaborations/', import.meta.url);
  await mkdir(artifacts, { recursive: true });
  try {
    for (const mode of ['shop', 'admin']) {
      const page = await browser.newPage();
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.setViewport({ width: 1440, height: 1000 });
      await page.evaluateOnNewDocument(mode => {
        localStorage.setItem('token', `isolated-${mode}-collaboration-fixture`);
        localStorage.setItem('user', JSON.stringify({ id: 'fixture-user', role: mode === 'shop' ? 'SHOP_MANAGER' : 'SYSTEM_ADMIN', fullName: 'Tài khoản kiểm thử', stores: [{ id: 'store', name: 'Gian hàng A' }] }));
        localStorage.setItem('scanms-current-role', mode); localStorage.setItem('scanms-active-workspace', mode);
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__copiedCode = value; } } });
      }, mode);
      const referral = { id: 'referral:one', kind: 'REFERRAL', collaboratorId: 'kol-one', collaboratorName: null, collaboratorStatus: 'APPROVED', storeId: 'store', storeName: 'Gian hàng A', productId: 'product-one', productName: 'Đầm mùa thu', livestreamId: null, livestreamTitle: null, token: 'ref-fixture-one', status: 'ACTIVE', inviteStatus: null, createdAt: '2026-10-21T09:00:00', scheduledAt: null, expiresAt: null };
      let rows = [referral, { ...referral, id: 'referral:expired', token: 'ref-old', status: 'EXPIRED' }, { ...referral, id: 'live:one', kind: 'LIVESTREAM', collaboratorName: 'Nguyễn Ánh', productId: null, productName: null, livestreamId: 'live-one', livestreamTitle: 'Buổi giới thiệu mùa thu', token: null, status: 'SCHEDULED', inviteStatus: 'ACCEPTED', scheduledAt: '2026-10-25T10:00:00' }];
      let unavailable = true, loads = 0;
      const scopes = [], legacy = [];
      await page.setRequestInterception(true);
      page.on('request', request => { void (async () => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/')) {
          const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
          if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
          let result = [];
          if (url.pathname.endsWith('/users')) result = { userId: 'fixture-user', roles: [mode === 'shop' ? 'SHOP_OWNER' : 'ADMIN'], fullName: 'Tài khoản kiểm thử', status: 'ACTIVE', stores: [{ id: 'store', name: 'Gian hàng A' }] };
          if (url.pathname.endsWith('/stores/mine')) result = [{ storeId: 'store', name: 'Gian hàng A' }];
          if (url.pathname.endsWith('-collaborations')) {
            scopes.push(url.pathname); loads++;
            if (unavailable) return request.respond({ status: 503, headers, contentType: 'application/json', body: JSON.stringify({ message: 'Không tải được dữ liệu gian hàng. Vui lòng thử lại.' }) });
            result = rows;
          }
          if (url.pathname.endsWith('/referrals')) legacy.push(url.pathname);
          return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
        }
        if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
        return request.continue();
      })(); });
      await page.goto(`${base}/${mode === 'shop' ? 'merchant' : 'admin'}/collaborations`);
      await page.waitForSelector('[role="alert"]');
      assert.equal(await page.evaluate(() => document.body.textContent.includes('Chưa có hợp tác KOL')), false);
      assert.equal(await page.evaluate(() => [...document.querySelectorAll('h1,h2')].some(element => element.textContent.includes('Hợp tác'))), false);
      unavailable = false;
      await page.click('button[aria-label="Làm mới hợp tác KOL"]');
      await page.waitForSelector('tbody tr');
      assert.equal((await page.$$('tbody tr')).length, 3);
      const before = loads;
      await page.click('button[aria-label="Làm mới hợp tác KOL"]');
      await page.waitForFunction(() => !document.querySelector('button[aria-label="Làm mới hợp tác KOL"]').disabled);
      assert.ok(loads > before, 'refresh must bypass cached data');
      await page.type('input[aria-label="Tìm hợp tác KOL"]', 'dam mua thu');
      assert.equal((await page.$$('tbody tr')).length, 2);
      await page.evaluate(() => document.querySelector('tbody tr button').click());
      await page.waitForSelector('[aria-label="Chi tiết hợp tác KOL"]');
      assert.equal(await page.$eval('[aria-label="Chi tiết hợp tác KOL"] a', element => element.getAttribute('href')), '/products/product-one');
      await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent === 'Sao chép mã').click());
      assert.equal(await page.evaluate(() => window.__copiedCode), 'ref-fixture-one');
      await page.click('button[aria-label="Đóng cửa sổ"]');
      await page.click('input[aria-label="Tìm hợp tác KOL"]');
      await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace');
      await page.click('button[aria-label="Lọc loại hợp tác"]');
      await page.waitForSelector('[role="option"]');
      await page.evaluate(() => [...document.querySelectorAll('[role="option"]')].find(option => option.textContent.trim() === 'Livestream').click());
      assert.equal((await page.$$('tbody tr')).length, 1);
      assert.equal(await page.$eval('tbody', element => element.textContent.includes('KOL đã đồng ý')), true);
      await page.evaluate(() => document.querySelector('tbody tr button').click());
      await page.waitForSelector('[aria-label="Chi tiết hợp tác KOL"]');
      if (mode === 'shop') assert.equal(await page.$eval('[aria-label="Chi tiết hợp tác KOL"] a', element => element.getAttribute('href')), '/merchant/live-sessions');
      await page.click('button[aria-label="Đóng cửa sổ"]');
      await page.click('button[aria-label="Lọc trạng thái hợp tác"]');
      await page.waitForSelector('[role="option"]');
      await page.evaluate(() => [...document.querySelectorAll('[role="option"]')].find(option => option.textContent.trim() === 'Hết hạn').click());
      await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy hợp tác phù hợp'));
      await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent === 'Xóa bộ lọc').click());
      await page.waitForSelector('tbody tr');
      await page.screenshot({ path: fileURLToPath(new URL(`${mode}-desktop.png`, artifacts)) });
      for (const width of [1024, 768, 390]) {
        await page.setViewport({ width, height: 1000 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${mode} overflow at ${width}`);
      }
      await page.screenshot({ path: fileURLToPath(new URL(`${mode}-mobile.png`, artifacts)), fullPage: true });
      unavailable = true;
      await page.click('button[aria-label="Làm mới hợp tác KOL"]'); await page.waitForSelector('[role="alert"]');
      assert.equal((await page.$$('tbody tr')).length, 3, 'keep previous rows with a stale-data notice on refresh errors');
      unavailable = false; rows = [];
      await page.click('button[aria-label="Làm mới hợp tác KOL"]');
      await page.waitForFunction(() => document.body.textContent.includes('Chưa có hợp tác KOL'));
      assert.ok(scopes.every(path => path.endsWith(`/referrals/${mode}-collaborations`)));
      assert.deepEqual(legacy, []); assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser.close(); }
});
