import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH;
test('merchant expires overdue sessions, preserves future schedules and refreshes an open detail on focus', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 40000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const errors = [];
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.emulateTimezone('Asia/Ho_Chi_Minh');
    await page.evaluateOnNewDocument(() => {
      const NativeDate = Date;
      window.__advanceNow = 0;
      window.Date = class extends NativeDate {
        constructor(...args) { super(...(args.length ? args : [NativeDate.parse('2026-10-26T18:00:00Z') + window.__advanceNow])); }
        static now() { return NativeDate.parse('2026-10-26T18:00:00Z') + window.__advanceNow; }
      };
      localStorage.clear();
      localStorage.setItem('token', 'isolated-lifecycle-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'owner', role: 'SHOP_MANAGER', roles: ['SHOP_OWNER'], fullName: 'Fixture owner' }));
      localStorage.setItem('scanms-current-role', 'shop');
      localStorage.setItem('scanms-active-workspace', 'shop');
    });
    page.on('pageerror', error => {
      // Vite's development HMR socket is unrelated to the mocked application APIs.
      if (error.message === 'WebSocket closed without opened.' && error.stack?.includes('/@vite/client')) return;
      errors.push(error.message);
    });
    const session = (id, status, end) => ({ livestreamId: id, storeId: 'store-a', title: id,
      status, scheduledAt: '2026-10-26T12:00:00', productRefs: { productIds: [] },
      collaboratorRefs: { collaboratorIds: [] }, participantRefs: { endsAt: end, inviteStatus: 'PENDING' },
    });
    const sessions = [session('Missed schedule', 'SCHEDULED', '2026-10-26T14:51:00Z'),
      session('Elapsed broadcast', 'LIVE', '2026-10-26T14:51:00Z'),
      session('Future session', 'SCHEDULED', '2026-10-27T05:10:00Z'),
      session('Manual cancellation', 'CANCELLED', '2026-10-26T14:51:00Z')];
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type',
          'Access-Control-Allow-Methods': 'GET,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let result = [];
        if (url.pathname.endsWith('/users')) result = { userId: 'owner', roles: ['SHOP_OWNER'], fullName: 'Fixture owner', status: 'ACTIVE' };
        if (url.pathname.endsWith('/stores/mine')) result = [{ storeId: 'store-a', name: 'Fixture shop', approvalStatus: 'APPROVED' }];
        if (url.pathname.endsWith('/referrals/invitations/catalog')) result = { storeId: 'store-a', products: [], creators: [] };
        if (url.pathname.endsWith('/livestreams')) result = sessions;
        return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(origin + '/merchant/live-sessions', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('article').length === 4);
    const card = title => page.evaluate(title => {
      const node = [...document.querySelectorAll('article')].find(node => node.querySelector('h3')?.textContent === title);
      return { text: node.innerText, links: [...node.querySelectorAll('a')].map(a => a.textContent.trim()) };
    }, title);
    assert.match((await card('Missed schedule')).text, /Đã hết lịch/);
    assert.doesNotMatch((await card('Missed schedule')).text, /Chờ xác nhận|Mở live/);
    assert.match((await card('Elapsed broadcast')).text, /Đã kết thúc/);
    assert.match((await card('Manual cancellation')).text, /Đã hủy/);
    assert.match((await card('Future session')).text, /Đã lên lịch/);
    assert.ok((await card('Future session')).links.includes('Mở live'));
    await page.evaluate(() => {
      const node = [...document.querySelectorAll('article')].find(node => node.querySelector('h3')?.textContent === 'Future session');
      [...node.querySelectorAll('button')].find(button => button.textContent.trim() === 'Chi tiết').click();
    });
    await page.waitForSelector('button[aria-label="Đóng chi tiết phiên live"]');
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('a')].some(a => a.textContent.trim() === 'Mở link live')));
    await page.evaluate(() => { window.__advanceNow = 86400000; window.dispatchEvent(new Event('focus')); });
    await page.waitForFunction(() => ![...document.querySelectorAll('a')].some(a => a.textContent.trim() === 'Mở link live'));
    assert.match((await card('Future session')).text, /Đã hết lịch/);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
