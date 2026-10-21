import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('manager menu shows pending shop applications and uses Spring approve/reject endpoints with real error states', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    const errors = [], writes = [], reads = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-manager-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'fixture-manager', role: 'SYSTEM_MANAGER', fullName: 'Manager kiểm thử' }));
      localStorage.setItem('scanms-active-workspace', 'admin'); localStorage.setItem('scanms-current-role', 'admin');
    });
    const docs = { businessType: 'HOUSEHOLD', taxCode: 'TEST-TAX', idCardNumber: '000000000001', warehouseAddress: 'Kho kiểm thử', contactPhone: '0900000000', contactEmail: 'fixture@example.test', bankName: 'Ngân hàng kiểm thử', bankAccountNumber: '0000000001', bankAccountName: 'FIXTURE OWNER', frontCardUrl: `${origin}/fixture-doc.svg`, backCardUrl: `${origin}/fixture-doc.svg`, businessLicenseUrl: `${origin}/fixture-doc.svg` };
    const applications = [
      { applicationId: 'application-a', applicantUserId: 'owner-a', proposedStoreName: 'Gian hàng kiểm thử A', status: 'PENDING', onboardingData: docs, submittedAt: '2026-10-21T04:00:00Z' },
      { applicationId: 'application-b', applicantUserId: 'owner-b', proposedStoreName: 'Gian hàng kiểm thử B', status: 'PENDING', onboardingData: docs, submittedAt: '2026-10-21T05:00:00Z' },
    ];
    let failShop = false, failKol = false, failReview = true;
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      if (url.pathname === '/fixture-doc.svg') return request.respond({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#f5efe3"/></svg>' });
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let status = 200, result = [], message;
        reads.push(url.pathname);
        if (url.pathname.endsWith('/users/me')) result = { userId: 'fixture-manager', roles: ['MANAGER'], fullName: 'Manager kiểm thử', status: 'ACTIVE' };
        if (url.pathname.endsWith('/collaborators')) {
          status = failKol ? 503 : 200;
          result = [{ collaboratorId: 'kol-pending', userId: 'kol-user', approvalStatus: 'PENDING', createdAt: '2026-10-21T04:00:00Z' }];
          message = failKol ? 'Dịch vụ KOL kiểm thử đang bận.' : undefined;
        }
        if (url.pathname.endsWith('/store-applications')) {
          status = failShop ? 503 : 200; result = applications;
          message = failShop ? 'Chưa tải được hồ sơ gian hàng kiểm thử.' : undefined;
        }
        if (request.method() !== 'GET') {
          assert.match(url.pathname, /^\/api\/v1\/store-applications\/application-[ab]\/(approve|reject)$/);
          assert.equal(request.method(), 'POST');
          const body = JSON.parse(request.postData()); writes.push({ path: url.pathname, body });
          await new Promise(resolve => setTimeout(resolve, 250));
          if (failReview) { status = 503; message = 'Chưa duyệt được hồ sơ kiểm thử.'; }
          else {
            const target = applications.find(item => url.pathname.includes(item.applicationId));
            target.status = url.pathname.endsWith('/approve') ? 'APPROVED' : 'REJECTED'; target.reviewNote = body.note;
            result = target;
          }
        }
        return request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, result, message }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    })().catch(error => { errors.push(error.message); if (!request.isInterceptResolutionHandled()) void request.abort(); }); });
    await page.goto(`${base}/admin/users`);
    await page.waitForSelector('[aria-label="Danh sách hồ sơ gian hàng"]');
    assert.equal(new URL(page.url()).pathname, '/admin/kyc-approval');
    assert.equal(await page.$eval('a[href="/admin/kyc-approval"]', element => element.textContent.includes('Duyệt Shop')), true);
    assert.equal(reads.includes('/api/v1/users'), false, 'manager loads applications rather than the unrelated user directory');
    const rows = '[aria-label="Danh sách hồ sơ gian hàng"] tbody tr';
    assert.equal((await page.$$(rows)).length, 2);
    assert.match(await page.$eval(rows, element => element.textContent), /Gian hàng kiểm thử A/);
    assert.equal(await page.$eval('[data-application-tab="shop"] .kyc-application-tab-total', element => element.textContent), '2');
    for (const width of [1440, 868, 390]) {
      await page.setViewport({ width, height: 900 });
      const geometry = await page.$$eval('[data-application-tab]', elements => elements.map(element => ({ width: element.getBoundingClientRect().width, overflow: element.scrollWidth - element.clientWidth })));
      assert.ok(Math.abs(geometry[0].width - geometry[1].width) < 1, 'tabs have equal widths');
      assert.ok(geometry.every(item => item.overflow <= 1), 'tab contents fit on mobile');
      const summary = await page.$eval('.kyc-store-list-summary', element => {
        const pending = element.children[0].getBoundingClientRect();
        const visible = element.children[1].getBoundingClientRect();
        return { gap: visible.left - pending.right, stacked: visible.top >= pending.bottom, overflow: element.scrollWidth - element.clientWidth };
      });
      assert.ok(summary.stacked || summary.gap >= 7, 'list counters have distinct spacing');
      assert.ok(summary.overflow <= 1, 'list summary fits the available width');
    }
    await page.setViewport({ width: 1440, height: 900 });
    mkdirSync('.qa-artifacts/manager-shop-approval', { recursive: true });
    await page.screenshot({ path: '.qa-artifacts/manager-shop-approval/list.png' });
    await page.click(`${rows} button`);
    await page.waitForSelector('.kyc-shop-footer');
    assert.match(await page.$eval('.kyc-shop-bank', element => element.textContent), /0000000001/);
    assert.equal((await page.$$('.kyc-shop-footer button')).length, 2);
    const desktopWidth = await page.$eval('.shop-review-dialog', element => element.getBoundingClientRect().width);
    assert.ok(desktopWidth >= 1200, 'desktop review uses a wide, readable workspace');
    await page.screenshot({ path: '.qa-artifacts/manager-shop-approval/review-desktop.png' });
    await page.click('button.kyc-shop-document-preview');
    await page.waitForSelector('img[alt="Chi tiết tài liệu"]');
    await page.click('button[aria-label="Đóng ảnh phóng to"]');
    await page.waitForSelector('img[alt="Chi tiết tài liệu"]', { hidden: true });
    assert.ok(await page.$('.shop-review-dialog'), 'closing an enlarged document keeps the review open');
    applications[0].onboardingData = { ...docs, bankAccountNumber: '0000000002' };
    await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));
    await page.waitForFunction(() => document.querySelector('.kyc-shop-bank').textContent.includes('0000000002'));
    assert.match(await page.$eval('.kyc-shop-bank', element => element.textContent), /0000000002/, 'open review reflects updated application data after refresh');
    const approve = '.kyc-shop-footer button:last-child';
    assert.equal(await page.$eval(approve, element => element.disabled), false);
    await page.click(approve);
    await page.waitForFunction(() => document.body.textContent.includes('Chưa duyệt được hồ sơ kiểm thử.'));
    assert.ok(await page.$('.kyc-shop-footer'), 'failed review keeps the application open');
    failReview = false; await page.click(approve);
    await page.waitForSelector('.kyc-shop-footer', { hidden: true });
    await page.waitForFunction(() => document.querySelector('[aria-label="Danh sách hồ sơ gian hàng"] tbody').textContent.includes('Gian hàng kiểm thử B') && !document.querySelector('[aria-label="Danh sách hồ sơ gian hàng"] tbody').textContent.includes('Gian hàng kiểm thử A'));
    await page.waitForFunction(() => {
      const tab = document.querySelector('[data-application-tab="shop"]');
      return tab.querySelector('.kyc-application-tab-total').textContent === '2' && tab.textContent.includes('1 đã duyệt') && tab.textContent.includes('1 chờ duyệt');
    });
    await page.click(`${rows} button`); await page.waitForSelector('.kyc-shop-footer');
    await page.click('.kyc-shop-footer button:first-child');
    assert.equal(writes.length, 2, 'requesting a rejection opens a reason field before sending');
    assert.equal(await page.$eval('.kyc-shop-scroll textarea', element => document.activeElement === element), true);
    await page.type('.kyc-shop-scroll textarea', 'Giấy tờ cần bổ sung thông tin rõ hơn.');
    await page.click('.kyc-shop-footer button:first-child'); await page.waitForSelector('.kyc-shop-footer', { hidden: true });
    assert.equal(writes[2].path, '/api/v1/store-applications/application-b/reject');
    assert.equal(writes[2].body.note, 'Giấy tờ cần bổ sung thông tin rõ hơn.');
    failShop = true;
    await page.evaluate(() => document.querySelector('button[aria-label="Làm mới danh sách hồ sơ"]').click());
    await page.waitForSelector('[role=alert]');
    assert.equal(await page.$('[aria-label="Danh sách hồ sơ gian hàng"]'), null);
    failShop = false; failKol = true; await page.click('[role=alert] button');
    await page.waitForSelector('[aria-label="Danh sách hồ sơ gian hàng"]');
    assert.equal(await page.$('[role=alert]'), null, 'KOL outage must not hide shop applications');
    await page.evaluate(() => [...document.querySelectorAll('[aria-label="Loại hồ sơ"] button')].find(button => button.textContent.includes('Đối tác KOL')).click());
    await page.waitForSelector('[role=alert]');
    failKol = false; await page.click('[role=alert] button');
    await page.waitForSelector('[aria-label="Danh sách hồ sơ KOL"]');
    assert.match(await page.$eval('[aria-label="Danh sách hồ sơ KOL"] tbody', element => element.textContent), /Chờ thẩm định/);
    applications[0].status = 'PENDING'; applications[0].onboardingData = {};
    await page.evaluate(() => [...document.querySelectorAll('[aria-label="Loại hồ sơ"] button')].find(button => button.textContent.includes('Gian hàng')).click());
    await page.evaluate(() => document.querySelector('button[aria-label="Làm mới danh sách hồ sơ"]').click());
    await page.waitForSelector(`${rows} button`); await page.click(`${rows} button`);
    await page.waitForSelector('.kyc-shop-missing li');
    assert.equal(await page.$eval('.kyc-shop-footer button:last-child', element => element.disabled), true);
    for (const viewport of [{ width: 1440, height: 900 }, { width: 868, height: 920 }, { width: 390, height: 844 }]) {
      await page.setViewport(viewport);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const bounds = await page.evaluate(() => {
        const dialog = document.querySelector('.shop-review-dialog');
        const body = dialog.children[1]; const footer = document.querySelector('.kyc-shop-footer');
        const rect = dialog.getBoundingClientRect(), action = footer.getBoundingClientRect();
        return { x: rect.x, right: rect.right, bottom: rect.bottom, actionBottom: action.bottom, overflow: body.scrollWidth - body.clientWidth, headerY: dialog.children[0].getBoundingClientRect().y };
      });
      assert.ok(bounds.x >= 0 && bounds.right <= viewport.width && bounds.bottom <= viewport.height, JSON.stringify(bounds));
      assert.ok(bounds.actionBottom <= bounds.bottom && bounds.overflow <= 1, JSON.stringify(bounds));
      await page.$eval('.shop-review-dialog > div:nth-child(2)', element => { element.scrollTop = element.scrollHeight; });
      assert.equal(await page.$eval('.shop-review-dialog > div:first-child', element => element.getBoundingClientRect().y), bounds.headerY, 'header stays visible while only the contents scroll');
      await page.$eval('.shop-review-dialog > div:nth-child(2)', element => { element.scrollTop = 0; });
      await page.screenshot({ path: `.qa-artifacts/manager-shop-approval/review-missing-${viewport.width}.png` });
    }
    await page.click('.shop-review-dialog button[aria-label="Đóng cửa sổ"]');
    await page.waitForSelector('.shop-review-dialog', { hidden: true });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
