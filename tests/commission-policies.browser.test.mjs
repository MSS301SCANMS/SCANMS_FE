import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('commission policies create, edit, validate, filter and show errors with real API shapes', { skip: !base || !existsSync(executablePath), timeout: 45000 }, async () => {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-policy-manager');
      localStorage.setItem('user', JSON.stringify({ id: 'test-manager', role: 'SYSTEM_MANAGER', fullName: 'Manager kiểm thử' }));
      localStorage.setItem('scanms-active-workspace', 'admin'); localStorage.setItem('scanms-current-role', 'admin');
    });
    const rows = [], writes = [], errors = [];
    let failWrite = true, failRead = false;
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': new URL(base).origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let status = 200, result = [], message;
        if (url.pathname.endsWith('/users/me')) result = { userId: 'test-manager', roles: ['MANAGER'], fullName: 'Manager kiểm thử', status: 'ACTIVE' };
        if (url.pathname.endsWith('/stores/marketplace')) result = [{ storeId: 'owned-store', name: 'Gian hàng thật kiểm thử', approvalStatus: 'APPROVED' }];
        if (url.pathname.endsWith('/commission-policies') && request.method() === 'GET') { result = rows; if (failRead) { status = 503; message = 'Chưa tải được chính sách kiểm thử.'; } }
        if (request.method() !== 'GET') {
          assert.match(url.pathname, /\/commission-policies(?:\/policy-1)?$/);
          const body = JSON.parse(request.postData()); writes.push({ method: request.method(), body, version: url.searchParams.get('version') });
          if (failWrite) { status = 503; message = 'Không lưu được chính sách kiểm thử.'; }
          else if (request.method() === 'POST') { status = 201; result = { ...body, policyId: 'policy-1', version: 0 }; rows.push(result); }
          else { assert.equal(request.method(), 'PUT'); assert.equal(url.searchParams.get('version'), '0'); result = { ...body, policyId: 'policy-1', version: 1 }; rows[0] = result; }
        }
        return request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, result, message }) });
      }
      if (url.origin !== new URL(base).origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    })().catch(error => { errors.push(error.message); if (!request.isInterceptResolutionHandled()) void request.abort(); }); });
    await page.goto(`${base}/admin/commission-policies`);
    await page.waitForSelector('.cp-empty strong');
    assert.match(await page.$eval('.cp-empty', element => element.textContent), /Chưa có chính sách hoa hồng/);
    await page.click('.cp-toolbar .cp-primary');
    await page.waitForSelector('#commission-policy-form');
    await page.type('[name=policyName]', 'Hoa hồng kiểm thử');
    await page.select('[name=status]', 'ACTIVE');
    // Native numeric validation must block rates above 100, without an API write.
    await page.$eval('[name=commissionRate]', element => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(element, '101'); element.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.click('.cp-editor button[type=submit]');
    assert.equal(writes.length, 0);
    await page.$eval('[name=commissionRate]', element => { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(element, '12.5'); element.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.click('.cp-editor button[type=submit]');
    await page.waitForSelector('.cp-form-error');
    assert.equal(await page.$eval('[name=policyName]', element => element.value), 'Hoa hồng kiểm thử');
    failWrite = false;
    await page.click('.cp-editor button[type=submit]');
    await page.waitForSelector('#commission-policy-form', { hidden: true });
    await page.waitForSelector('.cp-list tbody tr');
    assert.match(await page.$eval('.cp-list tbody', element => element.textContent), /12,5%/);
    assert.equal(writes[1].body.commissionRate, 12.5);
    assert.equal(writes[1].body.validTo, null);
    await page.click('.cp-list tbody button');
    await page.select('[name=scopeType]', 'STORE');
    await page.waitForSelector('[name=target] option[value="owned-store"]');
    await page.select('[name=target]', 'owned-store');
    await page.select('[name=status]', 'INACTIVE');
    await page.click('.cp-editor button[type=submit]');
    await page.waitForSelector('#commission-policy-form', { hidden: true });
    await page.waitForFunction(() => document.querySelector('.cp-list tbody').textContent.includes('Đã tắt'));
    assert.equal(writes[2].body.storeId, 'owned-store');
    assert.equal(writes[2].body.productId, null);
    await page.select('[aria-label="Lọc trạng thái"]', 'ACTIVE');
    await page.waitForSelector('.cp-empty strong');
    assert.match(await page.$eval('.cp-empty', element => element.textContent), /Không có chính sách phù hợp/);
    await page.select('[aria-label="Lọc trạng thái"]', 'ALL');
    mkdirSync('.qa-artifacts/commission-policies', { recursive: true });
    for (const width of [1440, 868, 390]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.$eval('.commission-policies', element => element.scrollWidth <= element.clientWidth + 1), 'only the table scrolls horizontally');
      await page.screenshot({ path: `.qa-artifacts/commission-policies/list-${width}.png` });
      await page.click('.cp-list tbody button');
      const overflow = await page.$eval('.cp-form', element => element.scrollWidth - element.clientWidth);
      assert.ok(overflow <= 1, 'form fits mobile');
      await page.screenshot({ path: `.qa-artifacts/commission-policies/form-${width}.png` });
      await page.click('.cp-editor button[aria-label="Đóng cửa sổ"]');
    }
    failRead = true; await page.click('[aria-label="Làm mới chính sách"]');
    await page.waitForSelector('.commission-policies [role=alert]');
    assert.equal(await page.$('.cp-list'), null, 'request failures must not appear as an empty list');
    failRead = false; await page.click('.commission-policies [role=alert] button');
    await page.waitForSelector('.cp-list tbody tr');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
