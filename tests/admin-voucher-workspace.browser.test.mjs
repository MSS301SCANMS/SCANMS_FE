import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('admin voucher workspace separates settlements, issues vouchers and preserves management actions', {
  skip: !base || !existsSync(executablePath), timeout: 60000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(12000);
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    const user = { id: 'qa-voucher-admin', fullName: 'Quản trị SCANMS', role: 'SYSTEM_ADMIN' };
    const coupon = { id: 'coupon-qa', displayCode: 'SHOPTEST10', codeNormalized: 'SHOPTEST10', status: 'ACTIVE', fundingSource: 'SHOP_FUNDED', discountType: 'PERCENTAGE', discountValue: 10, usageCount: 2, usageLimitTotal: 100, usageLimitPerCustomer: 1, store: { id: 'shop-qa', name: 'Sora Skin' }, collaborator: { fullName: 'Đại diện Sora Skin', email: 'qa@example.test' } };
    const subsidy = { storeId: 'shop-qa', storeName: 'Sora Skin', amount: 25000, paidAmount: 0, outstandingAmount: 25000, orderCount: 1, reimbursementReady: true, orders: [{ orderId: 'order-qa', orderCode: 'DH-TEST-001', amount: 25000, paidAmount: 0, outstandingAmount: 25000, payments: [] }] };
    await page.evaluateOnNewDocument(user => { localStorage.setItem('token', 'qa-admin-voucher-only'); localStorage.setItem('user', JSON.stringify(user)); }, user);
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let data = [];
        if (url.pathname === '/api/auth/me') data = user;
        if (url.pathname === '/api/admin/coupons') data = { data: [coupon], total: 1 };
        if (url.pathname === '/api/admin/coupons/subsidies') data = [subsidy];
        if (url.pathname === '/api/stores/marketplace') data = [{ id: 'shop-qa', name: 'Sora Skin' }];
        if (url.pathname === '/api/notifications/unread-count') data = { unreadCount: 0 };
        if (url.pathname === '/api/notifications') data = { items: [], total: 0, unreadCount: 0 };
        if (['POST', 'PATCH'].includes(request.method())) {
          writes.push({ path: url.pathname, body: JSON.parse(request.postData() || '{}') });
          if (url.pathname.endsWith('/block')) coupon.status = 'BLOCKED';
          data = { success: true };
        }
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(`${origin}/admin/affiliate-oversight?tab=coupons`);
    await page.waitForSelector('.av-table-code');
    assert.equal(await page.$eval('.av-workspace-heading h2', el => el.textContent), 'Voucher toàn sàn');
    assert.equal(await page.$('.av-settlements'), null);
    await page.screenshot({ path: join(tmpdir(), 'scanms-admin-vouchers-desktop.png') });
    await page.select('.av-funding-filter', 'PLATFORM_FUNDED');
    await page.waitForFunction(() => document.body.innerText.includes('Không tìm thấy mã giảm giá phù hợp'));
    await page.select('.av-funding-filter', 'ALL');
    await page.click('.av-workspace-heading button');
    await page.waitForSelector('dialog[open]');
    await page.waitForFunction(() => !document.querySelector('.av-issue-fields select').disabled);
    await page.select('.av-issue-fields select', 'shop-qa');
    await page.type('input[placeholder="VD: SANTEST20K"]', 'SANTEST20K');
    assert.equal(await page.$eval('.av-voucher-preview code', el => el.textContent), 'SANTEST20K');
    await page.screenshot({ path: join(tmpdir(), 'scanms-admin-voucher-issuer.png') });
    await page.click('.av-dialog-footer button[type=submit]');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    const issued = writes.find(write => write.path === '/api/admin/coupons');
    assert.equal(issued.body.code, 'SANTEST20K');
    assert.equal(issued.body.maximumDiscountAmount, issued.body.discountValue);
    await page.click('.admin-coupon-block');
    await page.type('#coupon-block-reason', 'Kiểm thử khóa voucher');
    await page.click('form button[type=submit]');
    await page.waitForSelector('.admin-coupon-unblock');
    await page.click('#av-settlements-tab');
    await page.waitForSelector('.av-store-settlement');
    assert.equal(await page.$eval('.av-store-settlement', el => el.open), false, 'orders stay collapsed until requested');
    await page.click('.av-store-settlement summary');
    await page.click('.av-order-line button');
    await page.type('.av-reimbursement-form input', 'QA-BANK-001');
    await page.click('.av-reimbursement-form button:not([type=button])');
    await page.waitForFunction(() => !document.querySelector('.av-reimbursement-form'));
    assert.equal(writes.find(write => write.path.endsWith('/reimbursements')).body.bankReference, 'QA-BANK-001');
    await page.screenshot({ path: join(tmpdir(), 'scanms-admin-voucher-settlements.png') });
    await page.setViewport({ width: 390, height: 844 });
    await page.click('#av-coupons-tab');
    await page.click('.av-workspace-heading button');
    await page.waitForSelector('dialog[open]');
    assert.ok(await page.$eval('dialog', el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }));
    await page.screenshot({ path: join(tmpdir(), 'scanms-admin-voucher-mobile.png') });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
