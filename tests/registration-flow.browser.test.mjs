import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH;

test('registration handles duplicate identities, validates confirmation and preserves successful registration when automatic login fails', {
  skip: !base || !executablePath || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const writes = [], errors = [];
  let scenario = 'email';
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    await page.evaluateOnNewDocument(() => { localStorage.clear(); sessionStorage.clear(); });
    page.on('pageerror', error => {
      if (error.message === 'WebSocket closed without opened.' && error.stack?.includes('/@vite/client')) return;
      errors.push(error.message);
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
      const reply = (result, status = 200, message) => request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, result, message }) });
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      if (url.pathname.startsWith('/api/')) {
        if (request.method() === 'POST') writes.push({ path: url.pathname, body: JSON.parse(request.postData() || '{}') });
        if (url.pathname.endsWith('/auth/register')) {
          if (scenario === 'email') return reply(null, 500, 'Đăng ký thất bại: 409 Conflict POST http://localhost:8180/admin/realms/scanms/users: {"errorMessage":"User exists with same email"}');
          if (scenario === 'username') return reply(null, 409, 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
          return reply('Đăng ký tài khoản thành công!');
        }
        if (url.pathname.endsWith('/auth/login')) return reply(null, 401, 'Vui lòng xác minh email trước khi đăng nhập.');
        return reply([]);
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(origin + '/register?redirect=%2Fmarketplace', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[placeholder="Tên đăng nhập"]');
    const fill = async (placeholder, value) => {
      await page.$eval(`input[placeholder="${placeholder}"]`, (input, value) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, value);
    };
    await fill('Tên đăng nhập', 'fixture-buyer');
    await fill('Họ', 'Trương');
    await fill('Tên', 'Tú');
    await fill('Địa chỉ Email', 'BUYER@example.test');
    await fill('Mật khẩu', 'fixture-password');
    await fill('Nhập lại mật khẩu', 'different-password');
    const submit = () => page.$eval('form button[type="submit"]', button => button.click());
    await submit();
    await page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent.includes('không khớp'));
    assert.equal(writes.length, 0);
    await fill('Nhập lại mật khẩu', 'fixture-password');
    await submit();
    await page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent.includes('Email đã được sử dụng'));
    assert.doesNotMatch(await page.$eval('[role="alert"]', node => node.textContent), /localhost|errorMessage|Conflict/);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].body.email, 'buyer@example.test');
    assert.equal(writes[0].body.roleNames, undefined);
    assert.equal(await page.$eval('input[placeholder="Tên đăng nhập"]', input => input.value), 'fixture-buyer');
    await page.$eval('[role="alert"] button', button => button.click());
    await page.waitForFunction(() => [...document.querySelectorAll('input')].filter(input => input.value === 'BUYER@example.test').length >= 2);
    // Close the reset modal without sending an OTP to any real address.
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.getAttribute('aria-label')?.includes('Đóng'))?.click());
    await page.goto(origin + '/register?redirect=%2Fmarketplace', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[placeholder="Tên đăng nhập"]');
    await fill('Tên đăng nhập', 'fixture-buyer'); await fill('Họ', 'Trương'); await fill('Tên', 'Tú');
    await fill('Địa chỉ Email', 'BUYER@example.test'); await fill('Mật khẩu', 'fixture-password'); await fill('Nhập lại mật khẩu', 'fixture-password');
    scenario = 'username'; await submit();
    await page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent.includes('Tên đăng nhập đã tồn tại'));
    assert.equal(writes.filter(write => write.path.endsWith('/auth/login')).length, 0);
    scenario = 'success'; await submit();
    await page.waitForFunction(() => location.pathname === '/login');
    const destination = new URL(page.url());
    assert.equal(destination.searchParams.get('registered'), 'email');
    assert.equal(destination.searchParams.get('email'), 'buyer@example.test');
    assert.equal(destination.searchParams.get('redirect'), '/marketplace');
    assert.equal(writes.filter(write => write.path.endsWith('/auth/register')).length, 3);
    assert.equal(writes.filter(write => write.path.endsWith('/auth/login')).length, 1);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
