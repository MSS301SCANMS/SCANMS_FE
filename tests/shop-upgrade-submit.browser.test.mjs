import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('shop form sends Spring fields and documents, preserves a failed submission and loads pending status after success', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  mkdirSync('.qa-artifacts/shop-upgrade-submit', { recursive: true });
  const image = '.qa-artifacts/shop-upgrade-submit/fixture.png';
  writeFileSync(image, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=', 'base64'));
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const errors = [], submissions = [], supplements = [];
    let application = null, failSubmit = true, failStatus = false, dropDetailsOnCreate = true, dropDetailsOnRead = false;
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-shop-submission-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'shop-applicant', role: 'CUSTOMER', fullName: 'Fixture applicant' }));
      localStorage.setItem('scanms-current-role', 'customer'); localStorage.setItem('scanms-active-workspace', 'customer');
    });
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let status = 200, result = [], message;
        if (url.pathname.endsWith('/users/me')) result = { userId: 'shop-applicant', roles: ['USER'], status: 'ACTIVE' };
        if (url.pathname.endsWith('/upload/image')) result = { secureUrl: `${origin}/fixture-${Date.now()}.png` };
        if (url.pathname.endsWith('/store-applications')) {
          if (request.method() === 'POST') {
            const payload = JSON.parse(request.postData()); submissions.push(payload);
            await new Promise(resolve => setTimeout(resolve, 300));
            if (failSubmit) { status = 503; message = 'Dịch vụ hồ sơ đang bận, vui lòng thử lại.'; }
            else { status = 201; application = { ...payload, onboardingData: dropDetailsOnCreate ? undefined : payload.onboardingData, applicationId: 'fixture-application', applicantUserId: 'shop-applicant', status: 'PENDING', submittedAt: '2026-10-21T04:00:00Z' }; result = application; }
          } else {
            status = failStatus ? 503 : 200; message = failStatus ? 'Chưa tải được trạng thái hồ sơ.' : undefined;
            result = application ? [application] : [];
          }
        } else if (url.pathname.endsWith('/store-applications/fixture-application')) {
          if (request.method() === 'PUT') {
            const payload = JSON.parse(request.postData()); supplements.push(payload);
            application = { ...application, ...payload }; result = application;
          } else result = dropDetailsOnRead ? { ...application, onboardingData: {} } : application;
        } else if (request.method() !== 'GET' && !url.pathname.endsWith('/upload/image')) throw new Error(`Unexpected write: ${url.pathname}`);
        return request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, result, message }) });
      }
      if (url.pathname.startsWith('/fixture-')) return request.respond({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=', 'base64') });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    })().catch(error => { errors.push(error.message); if (!request.isInterceptResolutionHandled()) void request.abort(); }); });
    await page.goto(`${base}/customer/upgrade/shop`);
    await page.waitForSelector('#shop-name');
    const fields = { 'shop-name': 'Fixture Beauty Shop', 'shop-tax': 'TEST-TAX', 'shop-phone': '0900000000', 'shop-email': 'fixture@example.test', 'shop-warehouse': 'Fixture warehouse address', 'shop-owner-id': '000000000001', 'shop-account': '0000000001', 'shop-account-name': 'FIXTURE OWNER', 'shop-description': 'Fixture description' };
    for (const [id, value] of Object.entries(fields)) await page.type(`#${id}`, value);
    await page.click('#shop-business-type');
    await page.evaluate(() => [...document.querySelectorAll('[role=listbox] button')].find(button => button.textContent.includes('Hộ kinh doanh')).click());
    await page.evaluate(() => [...document.querySelectorAll('#partner-upgrade-form button')].find(button => button.textContent.includes('Chọn ngân hàng')).click());
    await page.waitForSelector('dialog[open]');
    await page.click('dialog[open] button[aria-label^="Vietcombank,"]');
    await page.waitForSelector('dialog[open]', { hidden: true });
    for (const input of await page.$$('.upgrade-document input[type=file]')) await input.uploadFile(image);
    await page.waitForFunction(() => document.querySelectorAll('.upgrade-document-body.has-image').length === 4);
    const submit = '#partner-upgrade-form button[type=submit]';
    await page.$eval(submit, button => button.scrollIntoView({ block: 'center' }));
    await page.click(submit);
    await page.waitForFunction(() => document.body.textContent.includes('Dịch vụ hồ sơ đang bận'));
    assert.equal(submissions.length, 1);
    assert.equal(await page.$eval('#shop-name', input => input.value), fields['shop-name']);
    assert.equal((await page.$$('.upgrade-document-body.has-image')).length, 4);
    const payload = submissions[0];
    assert.equal(payload.proposedStoreName, fields['shop-name']);
    assert.equal('shopName' in payload, false);
    assert.equal('applicantUserId' in payload, false);
    assert.equal(payload.onboardingData.bankAccountNumber, fields['shop-account']);
    assert.equal(payload.onboardingData.businessType, 'HOUSEHOLD');
    assert.equal(payload.onboardingData.contactEmail, fields['shop-email']);
    for (const key of ['frontCardUrl', 'backCardUrl', 'businessLicenseUrl', 'brandAuthorizationUrl']) assert.ok(payload.onboardingData[key].startsWith(origin));
    failSubmit = false; await page.click(submit);
    await page.waitForFunction(() => document.body.textContent.includes('Máy chủ chưa lưu đầy đủ thông tin và giấy tờ'));
    assert.ok(await page.$('#partner-upgrade-form'), 'old API accepting and discarding details must not report success');
    assert.equal(await page.$eval('#shop-name', input => input.value), fields['shop-name']);
    assert.equal((await page.$$('.upgrade-document-body.has-image')).length, 4);
    dropDetailsOnCreate = false; dropDetailsOnRead = true;
    await page.click(submit);
    await page.waitForFunction(() => document.body.textContent.includes('Dữ liệu đọc lại chưa khớp'));
    assert.ok(await page.$('#partner-upgrade-form'), 'a response echo is insufficient unless the persisted record matches');
    assert.equal(submissions.length, 2, 'retry must update the record created by the old API');
    dropDetailsOnRead = false; await page.click(submit);
    await page.waitForFunction(() => document.body.textContent.includes('Hồ sơ đang chờ xét duyệt'));
    await page.waitForSelector('#partner-upgrade-form', { hidden: true });
    assert.equal(submissions.length, 2); assert.deepEqual(submissions[0], submissions[1]);
    await page.reload(); await page.waitForFunction(() => document.body.textContent.includes('Hồ sơ đang chờ xét duyệt'));
    assert.equal(await page.$('#partner-upgrade-form'), null);
    await page.screenshot({ path: '.qa-artifacts/shop-upgrade-submit/pending.png' });
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Bổ sung thông tin hồ sơ')).click());
    await page.waitForSelector('#shop-name');
    assert.equal(await page.$eval('#shop-name', input => input.value), fields['shop-name']);
    assert.equal((await page.$$('.upgrade-document-body.has-image')).length, 4);
    await page.$eval('#shop-description', input => { input.select(); });
    await page.type('#shop-description', 'Updated fixture description');
    await page.$eval(submit, button => button.scrollIntoView({ block: 'center' }));
    await page.click(submit);
    await page.waitForSelector('#partner-upgrade-form', { hidden: true });
    assert.equal(supplements.length, 3);
    assert.equal(supplements[2].description, 'Updated fixture description');
    assert.deepEqual(supplements[2].onboardingData, { ...payload.onboardingData, description: 'Updated fixture description' });
    assert.equal(submissions.length, 2, 'supplement must update the existing pending application');
    await page.reload(); await page.waitForFunction(() => document.body.textContent.includes('Hồ sơ đang chờ xét duyệt'));
    failStatus = true; await page.reload(); await page.waitForSelector('[role=alert]');
    assert.equal(await page.$('#partner-upgrade-form'), null, 'status outage must not allow duplicate resubmission');
    failStatus = false; await page.click('[role=alert] button');
    await page.waitForFunction(() => document.body.textContent.includes('Hồ sơ đang chờ xét duyệt'));
    application.onboardingData = undefined;
    await page.reload(); await page.waitForSelector('[role=alert]');
    assert.match(await page.$eval('[role=alert]', element => element.textContent), /Hồ sơ trên máy chủ chưa có thông tin chi tiết và giấy tờ/);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Bổ sung thông tin hồ sơ')).click());
    await page.waitForSelector('#shop-name');
    assert.equal(await page.$eval('#shop-name', input => input.value), fields['shop-name']);
    assert.equal((await page.$$('.upgrade-document-body.has-image')).length, 0, 'legacy missing documents must not be fabricated or presented as saved');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
