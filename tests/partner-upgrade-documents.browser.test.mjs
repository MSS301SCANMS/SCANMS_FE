import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifacts = new URL('../.qa-artifacts/partner-upgrade-documents/', import.meta.url);
test('KOL and Shop document uploads stay styled, fit small screens and report upload failures accurately', {
  skip: !base || !existsSync(executablePath), timeout: 60000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  await mkdir(artifacts, { recursive: true });
  const imagePath = new URL('fixture.png', artifacts);
  const invalidPath = new URL('fixture.txt', artifacts);
  const largePath = new URL('too-large.png', artifacts);
  await writeFile(imagePath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=', 'base64'));
  await writeFile(invalidPath, 'Test fixture, not an image');
  await writeFile(largePath, Buffer.alloc(6 * 1024 * 1024));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-upgrade-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'upgrade-fixture', role: 'CUSTOMER', fullName: 'Hồ sơ kiểm thử' }));
      localStorage.setItem('scanms-current-role', 'customer');
      localStorage.setItem('scanms-active-workspace', 'customer');
    });
    let uploadFails = true;
    let uploadCalls = 0;
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      if (url.pathname === '/__fixture/document.svg') return request.respond({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" rx="12" fill="#f5efe3"/><text x="160" y="105" text-anchor="middle" font-size="20" fill="#8f682e">TEST DOCUMENT</text></svg>' });
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        if (url.pathname.endsWith('/upload/image')) {
          uploadCalls++;
          await new Promise(resolve => setTimeout(resolve, 400));
          return request.respond({ status: uploadFails ? 503 : 200, headers, contentType: 'application/json', body: JSON.stringify(uploadFails ? { message: 'Máy chủ tải ảnh đang bận. Vui lòng thử lại.' } : { result: { secureUrl: `${origin}/__fixture/document.svg` } }) });
        }
        let result = [];
        if (url.pathname.endsWith('/users/me')) result = { userId: 'upgrade-fixture', roles: ['USER'], status: 'ACTIVE', fullName: 'Hồ sơ kiểm thử' };
        if (url.pathname.endsWith('/collaborators/me')) result = {};
        return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    })(); });

    for (const type of ['kol', 'shop']) {
      await page.setViewport({ width: 1440, height: 1000 });
      await page.goto(`${base}/customer/upgrade/${type}`);
      await page.waitForSelector('#partner-upgrade-form .upgrade-document-body');
      assert.equal(await page.$$('.upgrade-document-body').then(items => items.length), type === 'kol' ? 3 : 4);
      for (const height of [720, 1000]) {
        await page.setViewport({ width: 1440, height });
        await page.evaluate(() => {
          window.scrollTo(0, 10000);
          const panel = document.querySelector('.workspace-page-column');
          panel.scrollTop = panel.scrollHeight;
        });
        assert.equal(await page.evaluate(() => window.scrollY), 0, `${type}: hidden bank input must not create a second page scroll`);
        assert.equal(await page.$eval('#partner-upgrade-form button[type=submit]', button => {
          const rect = button.getBoundingClientRect();
          return rect.top >= 0 && rect.bottom <= innerHeight && button.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
        }), true, `${type}: submit button must be fully visible and reachable at ${height}px height`);
        if (height === 720) await page.screenshot({ path: new URL(`${type}-bottom-720.png`, artifacts).pathname.replace(/^\/([A-Za-z]:)/, '$1') });
      }
      for (const width of [1440, 1024, 768, 390]) {
        await page.setViewport({ width, height: 1000 });
        const layout = await page.$$eval('.upgrade-document', groups => groups.map(group => {
          const body = group.querySelector('.upgrade-document-body');
          const strong = group.querySelector('.upgrade-document-copy strong');
          const helper = group.querySelector('.upgrade-document-copy > span');
          const button = group.querySelector('.upgrade-document-choose');
          const a = strong.getBoundingClientRect(), b = helper.getBoundingClientRect();
          return { grid: getComputedStyle(body).display, border: getComputedStyle(body).borderTopWidth,
            overflow: group.scrollWidth > group.clientWidth + 1,
            copyOverlaps: a.bottom > b.top + 1, buttonHeight: button.getBoundingClientRect().height,
            fontSize: parseFloat(getComputedStyle(strong).fontSize) };
        }));
        assert.ok(layout.every(item => item.grid === 'grid' && item.border === '1px' && !item.overflow && !item.copyOverlaps && item.buttonHeight >= 34 && item.fontSize <= 13), `${type} at ${width}: ${JSON.stringify(layout)}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `page overflow at ${width}`);
        if (width === 1440 || width === 390) {
          if (width === 1440) await page.$eval(type === 'kol' ? '#kol-id' : '#shop-owner-id', element => element.scrollIntoView({ block: 'start' }));
          await page.screenshot({ path: new URL(`${type}-${width}.png`, artifacts).pathname.replace(/^\/([A-Za-z]:)/, '$1'), fullPage: width === 390 });
        }
      }
    }

    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(`${base}/customer/upgrade/kol`);
    const selector = '.upgrade-document:has(input[aria-label="CCCD mặt trước"])';
    await page.waitForSelector(`${selector} input`);
    const input = await page.$(`${selector} input`);
    const nativePath = url => decodeURIComponent(url.pathname).replace(/^\/([A-Za-z]:)/, '$1');
    await input.uploadFile(nativePath(imagePath));
    await page.waitForSelector(`${selector}[aria-busy="true"]`);
    assert.equal(await page.$eval(`${selector} .upgrade-document-upload-area`, button => button.disabled), true);
    await page.waitForSelector(`${selector} .upgrade-document-error`);
    assert.equal(await page.$(`${selector} .has-image`), null, 'failed upload must never become an attached data URL');
    uploadFails = false;
    await input.uploadFile(nativePath(imagePath));
    await page.waitForSelector(`${selector} .has-image img`);
    assert.equal(await page.$(`${selector} .upgrade-document-error`), null);
    await page.click(`${selector} .upgrade-document-remove`);
    assert.equal(await page.$(`${selector} .has-image`), null);
    const beforeInvalid = uploadCalls;
    await input.uploadFile(nativePath(invalidPath));
    await page.waitForFunction(selector => document.querySelector(`${selector} .upgrade-document-error`)?.textContent.includes('PNG'), {}, selector);
    await input.uploadFile(nativePath(largePath));
    await page.waitForFunction(selector => document.querySelector(`${selector} .upgrade-document-error`)?.textContent.includes('5 MB'), {}, selector);
    assert.equal(uploadCalls, beforeInvalid, 'invalid files must not reach the server');
    assert.deepEqual(pageErrors, []);
  } finally { await browser.close(); }
});
