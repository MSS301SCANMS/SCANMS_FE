import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('customer wallet credits Sandbox and confirms payOS using the Spring contract', {
  skip: !base || !existsSync(executablePath), timeout: 30000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1365, height: 1000 });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-wallet-test');
      localStorage.setItem('user', JSON.stringify({ id: 'fixture-customer', role: 'CUSTOMER', fullName: 'Wallet fixture' }));
      localStorage.setItem('scanms-current-role', 'customer');
      localStorage.setItem('scanms-active-workspace', 'customer');
    });
    let balance = 0;
    let sandboxCalls = 0;
    let payosCalls = 0;
    const unsupported = [];
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (['3000', '3302'].includes(url.port) || /\/api\/v1\/(chat|notifications)\//.test(url.pathname)) unsupported.push(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let result = [];
        if (url.pathname.endsWith('/users/me')) result = { userId: 'fixture-customer', roles: ['USER'], status: 'ACTIVE', fullName: 'Wallet fixture' };
        if (url.pathname.endsWith('/capabilities')) result = { paymentAvailable: true, sandboxTopUpAvailable: true };
        if (url.pathname.endsWith('/wallets/me')) result = { walletId: 'fixture-wallet', availableBalanceVnd: balance, heldBalanceVnd: 0, status: 'ACTIVE' };
        if (url.pathname.endsWith('/transactions') || url.pathname.endsWith('/payments')) result = { items: [], total: 0, page: 0, size: 20 };
        if (url.pathname.endsWith('/sandbox/top-ups')) { sandboxCalls++; balance += JSON.parse(request.postData()).amountVnd; result = { balanceAfterVnd: balance }; }
        const payment = { paymentId: 'fixture-topup', purpose: 'TOP_UP', providerOrderCode: 123, amountVnd: 500000,
          status: 'PENDING', checkoutUrl: 'https://pay.payos.vn/web/fixture', qrCode: 'fixture-qr', bin: '970422',
          accountNumber: '123456789', accountName: 'SCANMS FIXTURE', description: 'SC123', expiresAt: '2099-01-01T00:00:00' };
        if (url.pathname.endsWith('/finance/top-ups')) { payosCalls++; result = payment; }
        if (url.pathname.endsWith('/payments/fixture-topup')) { balance += 500000; result = { ...payment, status: 'SUCCESS' }; }
        return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(`${base}/customer/wallet`);
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.includes('Sandbox (Demo)')));
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Sandbox (Demo)')).click());
    await page.waitForSelector('#cw-demo-amount');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Nạp tiền (Demo)')).click());
    await page.waitForFunction(() => document.querySelector('[aria-label="Số dư ví"]')?.textContent.replace(/[\s.]/g, '').includes('500000'));
    assert.equal(sandboxCalls, 1); assert.equal(payosCalls, 0);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('payOS ngân hàng')).click());
    await page.waitForSelector('#cw-payos-amount');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Tạo mã payOS')).click());
    await page.waitForFunction(() => document.body.textContent.includes('Đã nạp tiền vào ví'));
    assert.equal(payosCalls, 1);
    assert.deepEqual(unsupported, []);
  } finally { await browser.close(); }
});
