import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('create-link action stays visible in all KOL tabs and opens once after navigation', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-marketing-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'fixture-kol', role: 'COLLABORATOR', fullName: 'KOL kiểm thử' }));
      localStorage.setItem('scanms-current-role', 'kol'); localStorage.setItem('scanms-active-workspace', 'kol');
    });
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        if (request.method() !== 'GET') writes.push(request.url());
        let result = [];
        if (url.pathname.endsWith('/users')) result = { userId: 'fixture-kol', roles: ['KOL_CTV'], fullName: 'KOL kiểm thử', status: 'ACTIVE' };
        if (url.pathname.endsWith('/collaborators/me')) result = { collaboratorId: 'profile-kol', approvalStatus: 'APPROVED' };
        if (url.pathname.endsWith('/public/products')) {
          await new Promise(resolve => setTimeout(resolve, 700));
          result = [{ productId: 'fixture-product', name: 'Sản phẩm kiểm thử', storeId: 'fixture-store', storeName: 'Gian hàng thử', priceVnd: 100000 }];
        }
        return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    })(); });
    await page.goto(`${base}/collaborator/marketing?tab=coupons`);
    await page.waitForSelector('#hub-tab-coupons[aria-selected="true"]');
    const action = '#marketing-toolkit-hub button[title="Tạo liên kết tiếp thị mới"]';
    const dialog = '[role="dialog"][aria-labelledby="create-link-title"]';
    for (const tab of ['coupons', 'live', 'links', 'live', 'coupons']) {
      await page.click(`#hub-tab-${tab}`);
      await page.waitForSelector(`#hub-tab-${tab}[aria-selected="true"]`);
      assert.equal((await page.$$(action)).length, 1, `one create action in ${tab}`);
      assert.equal(await page.$eval(action, button => button.getBoundingClientRect().height > 0), true);
      await page.click(action);
      await page.waitForSelector(dialog);
      assert.equal(new URL(page.url()).searchParams.get('tab'), 'links');
      await page.waitForFunction(() => !new URL(location.href).searchParams.has('create'));
      assert.equal((await page.$$(dialog)).length, 1);
      await page.click(`${dialog} button[title="Đóng modal"]`);
      await page.waitForSelector(dialog, { hidden: true });
      // Late catalog responses must not reopen the closed form or lose navigation intent.
      await new Promise(resolve => setTimeout(resolve, 800));
      assert.equal((await page.$$(dialog)).length, 0);
    }
    const deals = '.kol-exclusive-deals';
    const collapse = `${deals} button[aria-controls="kol-deal-list"]`;
    assert.equal(await page.$eval('#exclusive-deals-heading', element => element.textContent.trim()), 'Thỏa thuận độc quyền');
    assert.equal(await page.$eval(deals, element => [...element.querySelectorAll('button,a')].some(control => /chat|đề xuất|gỡ deal/i.test(control.textContent))), false);
    assert.equal(await page.$eval(deals, element => element.textContent.includes('Bạn chưa gửi đề xuất nào')), false);
    await page.waitForSelector(`${deals} [role=note]`);
    assert.match(await page.$eval(`${deals} [role=note]`, element => element.textContent), /Thỏa thuận độc quyền chưa được hỗ trợ/);
    await page.click(collapse);
    await page.waitForSelector('#kol-deal-list', { hidden: true });
    assert.equal(await page.evaluate(() => localStorage.getItem('scanms_deals_collapsed')), 'true');
    await page.reload();
    await page.waitForSelector(`${collapse}[aria-expanded="false"]`);
    await page.click(collapse); await page.waitForSelector(`${deals} [role=note]`);
    mkdirSync('.qa-artifacts', { recursive: true });
    await page.screenshot({ path: '.qa-artifacts/exclusive-deals-unsupported-desktop.png' });
    await page.setViewport({ width: 390, height: 844 });
    assert.equal(await page.$eval(collapse, element => { const rect = element.getBoundingClientRect(); return rect.width > 0 && rect.right <= innerWidth; }), true);
    await page.screenshot({ path: '.qa-artifacts/exclusive-deals-unsupported-mobile.png' });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(`${base}/collaborator/marketing?tab=links&create=1`);
    await page.waitForSelector(dialog);
    await page.click(`${dialog} button[title="Đóng modal"]`);
    for (const width of [1024, 768, 390]) {
      await page.setViewport({ width, height: 1000 });
      await page.click('#hub-tab-live');
      await page.waitForSelector('#hub-tab-live[aria-selected="true"]');
      assert.ok(await page.$eval(action, button => {
        const rect = button.getBoundingClientRect(); return rect.width > 0 && rect.right <= innerWidth + 1;
      }), `action stays visible at ${width}`);
    }
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
