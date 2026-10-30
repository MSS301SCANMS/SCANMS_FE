import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function waitText(page, pattern, errors = []) {
  try {
    await page.waitForFunction(source => new RegExp(source).test(document.body.innerText), {}, pattern.source);
  } catch (error) {
    throw new Error(`Không thấy ${pattern}. Lỗi trang: ${errors.join(' | ')}
Nội dung trang:
${(await page.evaluate(() => document.body.innerText)).slice(0, 6000)}`, { cause: error });
  }
}

const openApi = {
  info: { title: 'SCANMS User Service API', version: 'v1' },
  paths: { '/api/v1/users': { get: {}, post: {} }, '/api/v1/auth/login': { post: {} } },
  tags: [{ name: 'Auth' }, { name: 'Users' }],
};

test('system health detail explains a failing service and shows API info for a healthy one', {
  skip: !base || !existsSync(executablePath), timeout: 90000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    const errors = [], consoleErrors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => message.type() === 'error' && consoleErrors.push(message.text().slice(0, 200)));
    const user = { id: 'qa-health-admin', fullName: 'Quản trị SCANMS', role: 'SYSTEM_ADMIN' };
    await page.evaluateOnNewDocument(user => {
      localStorage.setItem('token', 'qa-health-admin');
      localStorage.setItem('user', JSON.stringify(user));
    }, user);
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};export const isChatSocketEnabled=()=>false;' });
      const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' };
      if (url.origin === 'http://localhost:8180') {
        return request.respond({ status: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ issuer: 'http://localhost:8180/realms/scanms' }) });
      }
      if (url.origin === 'http://localhost:8080') {
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers: cors });
        const json = (status, body) => request.respond({ status, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (url.pathname === '/openapi/payment') return json(503, { message: 'Service Unavailable' });
        if (url.pathname === '/openapi/user') return json(200, openApi);
        if (url.pathname.startsWith('/openapi/')) return json(200, { info: { title: 'API', version: 'v1' }, paths: {} });
        if (url.pathname === '/v3/api-docs/swagger-config') return json(200, { urls: [{ name: 'user', url: '/openapi/user' }, { name: 'order', url: '/openapi/order' }] });
        if (url.pathname === '/api/v1/finance/system/kafka') return json(200, { code: 1000, result: { up: true, brokers: 1, consumerGroups: 1, lag: 0, clusterId: 'qa' } });
        if (url.pathname === '/api/v1/users' || url.pathname === '/api/v1/users/admin') return json(200, { code: 1000, result: { ...user, userId: user.id, roles: [user.role], status: 'ACTIVE' } });
        return json(404, { message: 'not mocked' });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.setViewport({ width: 1440, height: 1500 });
    await page.goto(`${origin}/admin/system-health`);
    await waitText(page, /Bấm để xem chi tiết/, [...errors, ...consoleErrors]);
    assert.equal((await page.$$('[role=button][aria-pressed]')).length, 6);

    const clickCard = name => page.evaluate(name => {
      const card = [...document.querySelectorAll('[role=button][aria-pressed]')].find(el => el.innerText.includes(name));
      card.click();
    }, name);

    await clickCard('Payment Service');
    await waitText(page, /Gateway không gọi được service/);
    const text = await page.evaluate(() => document.body.innerText);
    assert.match(text, /Quan sát thấy lỗi từ/);
    assert.match(text, /Lỗi HTTP 5xx \(HTTP 503\)/);
    assert.match(text, /8084/);
    assert.match(text, /Chưa có dữ liệu/);
    await page.screenshot({ path: join(tmpdir(), 'scanms-health-detail-down.png') });

    await clickCard('User Service');
    await waitText(page, /SCANMS User Service API/);
    const apiText = await page.evaluate(() => document.body.innerText);
    assert.match(apiText, /Endpoint\s*\n?\s*2/);
    assert.match(apiText, /API \(GET, POST…\)\s*\n?\s*3/);
    assert.doesNotMatch(apiText, /Đường dẫn \/ thao tác/);
    assert.match(apiText, /Auth/);
    assert.doesNotMatch(apiText, /Gateway không gọi được service/);
    await page.screenshot({ path: join(tmpdir(), 'scanms-health-detail-up.png') });

    await clickCard('Payment Service');
    await page.waitForFunction(() => document.body.innerText.includes('Đang xem chi tiết'));
    await page.reload();
    await waitText(page, /Bấm để xem chi tiết/, [...errors, ...consoleErrors]);
    await clickCard('User Service');
    await waitText(page, /Trục dọc là mili giây/);
    const axis = await page.evaluate(() => document.body.innerText);
    assert.match(axis, /\b0 ms\b/);
    assert.match(axis, /\b(50|100) ms\b/);
    assert.ok(await page.$('span[title*=" ms"]'));
    await page.screenshot({ path: join(tmpdir(), 'scanms-health-chart.png') });
    await clickCard('Payment Service');
    await page.waitForFunction(() => /Số lần kiểm tra\s*\n?\s*2/.test(document.body.innerText));

    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.includes('Xóa lịch sử')).click());
    await page.waitForFunction(() => /Số lần kiểm tra\s*\n?\s*0/.test(document.body.innerText));
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
