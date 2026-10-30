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

const opsInfo = {
  service: 'user-service', port: 8081,
  process: { pid: 4242, host: 'qa-host', javaVersion: '21.0.12', javaVendor: 'Eclipse', springBootVersion: '4.1.1', os: 'Windows 11 10.0', startedAt: '2026-10-30T01:00:00Z', uptimeMs: 3723000 },
  memory: { heapUsedBytes: 268435456, heapMaxBytes: 536870912, nonHeapUsedBytes: 100000000 },
  threads: { live: 42, peak: 57 }, profiles: [],
  dependencies: [{ name: 'PostgreSQL', status: 'UP', latencyMs: 4, detail: 'Kết nối đang dùng 1/10, chờ 0' }, { name: 'Redis', status: 'DOWN', latencyMs: 2000, detail: 'Không kết nối được: RedisConnectionFailureException' }],
  generatedAt: '2026-10-30T02:00:00Z',
};
const opsLogs = {
  service: 'user-service', capacity: 300, size: 3, level: 'ALL', note: 'Log nằm trong bộ nhớ',
  entries: [
    { time: 1793000003000, level: 'ERROR', logger: 'c.s.u.s.i.AuthServiceImpl', thread: 'http-1', message: 'Gui mail xac minh that bai cho t***@gmail.com' },
    { time: 1793000002000, level: 'WARN', logger: 'c.s.u.s.i.OtpServiceImpl', thread: 'http-2', message: 'Redis cham: 480 ms' },
    { time: 1793000001000, level: 'INFO', logger: 'c.s.u.UserServiceApplication', thread: 'main', message: 'Da dam bao vi CUSTOMER cho userId=8bda8c4c' },
  ],
  errors: [{ time: 1793000003000, logger: 'c.s.u.s.i.AuthServiceImpl', thread: 'http-1', message: 'Gui mail xac minh that bai cho t***@gmail.com', stackTrace: 'jakarta.mail.AuthenticationFailedException: 535 5.7.8\n  at DefaultEmailSenderProvider.send' }],
};
const kafkaStatus = {
  up: true, brokers: 1, consumerGroups: 1, lag: 0, clusterId: 'qa', topic: 'user.registered.v1', groupId: 'payment-service',
  topics: [{ name: 'user.registered.v1', partitions: 3, replicas: 1 }],
  partitions: [{ partition: 0, endOffset: 0, committedOffset: null, lag: 0 }, { partition: 1, endOffset: 4, committedOffset: 3, lag: 1 }],
  members: [{ clientId: 'consumer-payment-service-1', host: '/172.20.0.1', partitions: ['user.registered.v1-0', 'user.registered.v1-1'] }],
};
const paymentOverview = {
  config: { sandboxEnabled: false, automaticPayouts: true, payoutDelayMs: 60000, minimumWithdrawalVnd: 200000, paymentProviderConfigured: true, payoutProviderConfigured: false, bankEncryptionKeyConfigured: true, serviceTokenConfigured: false, financeOutboxConfigured: true },
  financeEvents: { pending: 2, blocked: 1 },
  paymentsByStatus: [{ key: 'SUCCESS', count: 12 }], withdrawalsByStatus: [{ key: 'REQUESTED', count: 1 }], walletsByOwnerType: [{ key: 'CUSTOMER', count: 9 }],
};
const gatewayRoutes = { count: 2, jwtIssuer: 'http://localhost:8180/realms/scanms', routes: [{ id: 'ops-user', order: 0, predicate: 'Paths: [/api/v1/ops/user/**]', target: 'localhost:8081' }, { id: 'payment-service', order: 0, predicate: 'Paths: [/api/v1/finance/**]', target: 'localhost:8084' }] };

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
        if (url.pathname === '/api/v1/finance/system/kafka') return json(200, { code: 1000, result: kafkaStatus });
        if (url.pathname === '/api/v1/ops/user/scanmsinfo' || url.pathname === '/actuator/scanmsinfo') return json(200, opsInfo);
        if (url.pathname === '/api/v1/ops/user/scanmslogs' || url.pathname === '/actuator/scanmslogs') return json(200, opsLogs);
        if (url.pathname.startsWith('/api/v1/ops/payment/')) return json(503, { message: 'Service Unavailable' });
        if (url.pathname === '/api/v1/finance/system/overview') return json(200, { code: 1000, result: paymentOverview });
        if (url.pathname === '/actuator/scanmsroutes') return json(200, gatewayRoutes);
        if (url.pathname === '/api/v1/users' || url.pathname === '/api/v1/users/admin') return json(200, { code: 1000, result: { ...user, userId: user.id, roles: [user.role], status: 'ACTIVE' } });
        return json(404, { message: 'not mocked' });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.setViewport({ width: 1440, height: 3400 });
    await page.goto(`${origin}/admin/system-health`);
    await waitText(page, /Bấm để xem chi tiết/, [...errors, ...consoleErrors]);
    assert.equal((await page.$$('[role=button][aria-pressed]')).length, 7);

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
    await waitText(page, /service đang ngừng hoạt động hoặc không phản hồi/);
    await waitText(page, /Vận hành thanh toán/);
    const payText = await page.evaluate(() => document.body.innerText);
    assert.match(payText, /Sự kiện bị chặn\s*\n?\s*1/);
    assert.match(payText, /SUCCESS: 12/);
    assert.match(payText, /Chưa cấu hình/);
    await page.screenshot({ path: join(tmpdir(), 'scanms-health-detail-down.png'), fullPage: true });

    await clickCard('User Service');
    await waitText(page, /SCANMS User Service API/);
    const apiText = await page.evaluate(() => document.body.innerText);
    assert.match(apiText, /Endpoint\s*\n?\s*2/);
    assert.match(apiText, /API \(GET, POST…\)\s*\n?\s*3/);
    assert.doesNotMatch(apiText, /Đường dẫn \/ thao tác/);
    assert.match(apiText, /Auth/);
    assert.doesNotMatch(apiText, /Gateway không gọi được service/);
    await waitText(page, /Thông tin máy chủ/);
    await waitText(page, /Da dam bao vi CUSTOMER/);
    const opsText = await page.evaluate(() => document.body.innerText);
    assert.match(opsText, /PID\s*\n?\s*4242/);
    assert.match(opsText, /21\.0\.12/);
    assert.match(opsText, /256 MB \/ 512 MB \(50%\)/);
    assert.match(opsText, /1 giờ 2 phút/);
    assert.match(opsText, /Redis[\s\S]*Lỗi/);
    assert.match(opsText, /Lỗi gần nhất \(1\)/);
    assert.match(opsText, /Xem stack trace/);
    assert.match(opsText, /Tất cả \(3\)/);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.startsWith('ERROR')).click());
    await page.waitForFunction(() => !document.body.innerText.includes('Redis cham: 480 ms'));
    assert.match(await page.evaluate(() => document.body.innerText), /Gui mail xac minh that bai/);
    await page.screenshot({ path: join(tmpdir(), 'scanms-health-detail-up.png'), fullPage: true });

    await clickCard('API Gateway');
    await waitText(page, /Route của Gateway/);
    assert.match(await page.evaluate(() => document.body.innerText), /ops-user/);

    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.innerText.includes('Xem chi tiết topic')).click());
    await waitText(page, /Lag theo partition/);
    const kafkaText = await page.evaluate(() => document.body.innerText);
    assert.match(kafkaText, /user\.registered\.v1\s*\n?\s*3 partition/);
    assert.match(kafkaText, /consumer-payment-service-1/);
    await page.screenshot({ path: join(tmpdir(), 'scanms-health-kafka-detail.png'), fullPage: true });
    await clickCard('User Service');
    await waitText(page, /Thông tin máy chủ/);

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
