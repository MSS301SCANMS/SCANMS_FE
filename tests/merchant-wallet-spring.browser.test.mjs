import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('merchant wallet routes use Spring finance, persist bank registration and open store settlements', {
  skip: !base || !existsSync(executablePath), timeout: 60000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    const seen = [];
    const banks = [];
    const registrations = [];
    const store = { storeId: 'fixture-store', id: 'fixture-store', name: 'Fixture store', approvalStatus: 'APPROVED', ownerId: 'fixture-owner' };
    const user = { userId: 'fixture-owner', id: 'fixture-owner', fullName: 'Fixture owner', role: 'SHOP_MANAGER', roles: ['SHOP_OWNER'], status: 'ACTIVE', stores: [store] };
    await page.evaluateOnNewDocument(user => {
      localStorage.setItem('token', 'isolated-merchant-wallet-test');
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('scanms-active-workspace', 'shop');
      localStorage.setItem('scanms-current-role', 'shop');
      localStorage.setItem('current_store_id', 'fixture-store');
    }, user);
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        seen.push(url.pathname + url.search);
        let result = [];
        if (url.pathname.endsWith('/users/me')) result = user;
        if (url.pathname.endsWith('/stores/mine')) result = [store];
        if (url.pathname.endsWith('/stores/fixture-store')) result = store;
        if (url.pathname.endsWith('/capabilities')) result = { minimumWithdrawalVnd: 200000, currency: 'VND', paymentAvailable: true, payoutAvailable: false };
        if (url.pathname.endsWith('/wallets/me')) {
          assert.equal(url.searchParams.get('ownerType'), 'STORE');
          assert.equal(url.searchParams.get('storeId'), store.storeId);
          result = { walletId: 'fixture-wallet', ownerType: 'STORE', ownerRefId: store.storeId, availableBalanceVnd: 750000, heldBalanceVnd: 50000, currency: 'VND', status: 'ACTIVE' };
        }
        if (url.pathname.endsWith('/transactions') || url.pathname.endsWith('/withdrawals')) result = { items: [], total: 0, page: 0, size: 20 };
        if (url.pathname.endsWith('/bank-accounts')) {
          if (request.method() === 'POST') {
            const body = JSON.parse(request.postData());
            registrations.push(body);
            result = { bankAccountId: 'fixture-bank', storeId: body.ownerRefId, bankCode: body.bankCode, holderName: body.holderName, maskedNumber: '••••6789', verificationStatus: 'PENDING', active: true };
            banks.push(result);
          } else result = banks;
        }
        if (url.pathname.endsWith('/settlements')) {
          assert.equal(url.searchParams.get('storeId'), store.storeId);
          result = { items: [{ settlementId: 'fixture-settlement', sellerOrderId: 'fixture-order', storeId: store.storeId, netAmountVnd: 750000, status: 'PAID', breakdown: { grossRevenueVnd: 800000, commissionVnd: 50000 }, paidAt: '2026-10-21T10:00:00Z' }], total: 1, page: 0, size: 20 };
        }
        return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(`${base}/merchant/payouts`);
    await page.waitForFunction(() => document.querySelector('form[aria-label="Chọn ví gian hàng"]') && document.body.textContent.includes('750.000'));
    assert.ok(!(await page.evaluate(() => document.body.textContent)).includes('TÀI CHÍNH SCANMS'));
    const layout = await page.evaluate(() => {
      const form = document.querySelector('form[aria-label="Chọn ví gian hàng"]');
      const controls = [...form.querySelectorAll('select, button, a')].map(element => {
        const rect = element.getBoundingClientRect();
        return { bottom: rect.bottom, height: rect.height, width: rect.width };
      });
      return { width: form.getBoundingClientRect().width, parentWidth: form.parentElement.getBoundingClientRect().width, controls };
    });
    assert.ok(Math.abs(layout.width - layout.parentWidth) <= 2);
    assert.ok(layout.controls.every(control => Math.abs(control.height - 48) <= 1));
    assert.ok(layout.controls.every(control => Math.abs(control.bottom - layout.controls[0].bottom) <= 1));
    assert.ok(Math.abs(layout.controls[1].width - layout.controls[2].width) <= 1);
    await page.type('input[placeholder="VD: NGUYEN VAN A"]', 'fixture owner');
    await page.type('input[placeholder="VD: 0987654321..."]', '123456789');
    await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Đăng ký tài khoản').click());
    await page.waitForFunction(() => document.body.textContent.includes('••••6789'));
    assert.equal(registrations.length, 1);
    assert.equal(registrations[0].ownerType, 'STORE');
    assert.equal(registrations[0].ownerRefId, store.storeId);
    assert.equal(registrations[0].holderName, 'FIXTURE OWNER');
    await page.reload();
    await page.waitForFunction(() => document.body.textContent.includes('••••6789'));
    assert.ok(!(await page.evaluate(() => document.body.textContent)).includes('Xác minh tài khoản ngay'));
    await page.click('a[href^="/merchant/settlements?"]');
    await page.waitForFunction(() => document.body.textContent.includes('fixture-settlement'));
    for (const path of ['/merchant/wallet', '/shop/wallet', '/stores/fixture-store/payouts']) {
      await page.goto(`${base}${path}`);
      await page.waitForFunction(() => document.querySelector('form[aria-label="Chọn ví gian hàng"]') && document.body.textContent.includes('750.000'));
    }
    assert.ok(!seen.some(path => /\/stores\/[^/]+\/payouts|\/collaborators\/me/.test(path)), `Unexpected legacy or KOL endpoints: ${seen.join(', ')}`);
    assert.ok(seen.some(path => path.startsWith('/api/v1/finance/bank-accounts?ownerType=STORE')));
    assert.ok(seen.some(path => path.startsWith('/api/v1/finance/withdrawals?walletId=fixture-wallet')));
  } finally { await browser.close(); }
});
