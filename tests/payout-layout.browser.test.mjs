import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('payout toolbar, selection, empty state and batch history stay spaced and responsive without making payment writes', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage(); await page.setViewport({ width: 1440, height: 1000 });
    const errors = [], writes = [];
    let mode = 'empty';
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-payout-layout-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'fixture-owner', role: 'SHOP_MANAGER', fullName: 'Chủ shop kiểm thử', stores: [{ id: 'fixture-store' }] }));
      localStorage.setItem('scanms-active-workspace', 'shop'); localStorage.setItem('scanms-current-role', 'shop');
    });
    const payouts = ['PENDING', 'PROCESSING', 'APPROVED'].map((status, i) => ({
      id: `payout-${i}`, collaboratorId: `kol-${i}`, collaboratorName: `KOL kiểm thử ${i}`, storeId: 'fixture-store', kycStatus: 'VERIFIED',
      amount: '2000000', taxAmount: '200000', netAmount: '1800000', status,
      bankName: 'Ngân hàng kiểm thử', bankAccountNumber: '0000000001', bankAccountName: `NGUOI NHAN KIEM THU ${i}`,
      bankRefCode: null, batchId: i ? 'fixture-batch' : null, hasBill: i === 2, rejectedReason: null, createdAt: '2026-10-21T04:00:00Z', processedAt: null,
    }));
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        if (url.pathname.endsWith('/stores/my-store/presence')) return request.respond({ status: 200, headers, contentType: 'application/json', body: '{"code":200,"result":{}}' });
        if (request.method() !== 'GET') { writes.push(url.pathname); throw new Error(`Unexpected payment write: ${url.pathname}`); }
        let result = [];
        if (url.pathname.endsWith('/users')) result = { userId: 'fixture-owner', roles: ['SHOP_OWNER'], status: 'ACTIVE', fullName: 'Chủ shop kiểm thử' };
        if (url.pathname.endsWith('/stores/mine')) result = [{ storeId: 'fixture-store', name: 'Shop kiểm thử', approvalStatus: 'APPROVED' }];
        if (url.pathname.endsWith('/stores/fixture-store')) result = { storeId: 'fixture-store', name: 'Shop kiểm thử', approvalStatus: 'APPROVED' };
        if (url.pathname.endsWith('/payouts')) {
          const requests = mode === 'empty' ? [] : payouts.filter(row => !url.searchParams.get('status') || row.status === url.searchParams.get('status'));
          result = { requests, total: requests.length, page: 1, limit: 10, maxBillBytes: 5242880 };
        }
        if (url.pathname.endsWith('/payouts/batches')) result = { batches: mode === 'empty' ? [] : [{ id: 'fixture-batch', payoutCount: 2, createdAt: '2026-10-21T04:00:00Z' }], total: mode === 'empty' ? 0 : 1 };
        return request.respond({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ code: 200, result }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    })().catch(error => { errors.push(error.message); if (!request.isInterceptResolutionHandled()) void request.abort(); }); });
    await page.goto(`${base}/merchant/payouts`);
    await page.waitForSelector('.payout-table-empty');
    assert.equal(await page.$('.payout-table-scroll'), null, 'empty payouts have no unused wide table or horizontal scrollbar');
    mkdirSync('.qa-artifacts/payout-layout', { recursive: true });
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 868, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewport(viewport);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const metrics = await page.evaluate(() => {
        const section = document.querySelector('.payout-approval-table'); const input = document.querySelector('.payout-select-all input').getBoundingClientRect(); const label = document.querySelector('.payout-select-all span').getBoundingClientRect();
        const footerCount = document.querySelector('.payout-pagination-summary strong').getBoundingClientRect();
        const footerPrefix = document.querySelector('.payout-pagination-summary span').getBoundingClientRect();
        return { overflow: section.scrollWidth - section.clientWidth, x: section.getBoundingClientRect().x, right: section.getBoundingClientRect().right, labelGap: label.x - input.right, footerGap: footerCount.x - footerPrefix.right, heights: [...document.querySelectorAll('.payout-search input, .payout-filter-status > button, .payout-toolbar-actions button')].map(element => element.getBoundingClientRect().height) };
      });
      assert.ok(metrics.overflow <= 1 && metrics.x >= 0 && metrics.right <= viewport.width + 1, JSON.stringify(metrics));
      assert.ok(metrics.labelGap >= 8 && metrics.footerGap >= 4, JSON.stringify(metrics));
      assert.ok(metrics.heights.every(height => Math.abs(height - 44) <= 1), JSON.stringify(metrics));
      await (await page.$('.payout-approval-table')).screenshot({ path: `.qa-artifacts/payout-layout/empty-${viewport.width}.png` });
      await (await page.$('.payout-batch-history')).screenshot({ path: `.qa-artifacts/payout-layout/history-${viewport.width}.png` });
    }
    await page.setViewport({ width: 1440, height: 1000 }); mode = 'rows';
    await page.click('button[aria-label="Tải lại danh sách chi trả"]');
    await page.waitForSelector('table[aria-label="Danh sách chi trả"] tbody tr');
    assert.equal((await page.$$('table[aria-label="Danh sách chi trả"] tbody tr')).length, 3);
    await page.click('input[aria-label="Chọn tất cả lệnh chi trả đang chờ"]');
    assert.equal(await page.$eval('input[aria-label="Chọn lệnh chi trả payout-0"]', element => element.checked), true);
    assert.equal(await page.$eval('input[aria-label="Chọn lệnh chi trả payout-1"]', element => element.disabled), true);
    assert.match(await page.$eval('.payout-selection-count', element => element.textContent), /Đã chọn 1 yêu cầu/);
    assert.match(await page.$eval('.payout-toolbar-actions', element => element.textContent), /Xuất Excel VietQR \(1\)/);
    assert.equal(await page.$eval('table[aria-label="Danh sách chi trả"] tbody tr', row => {
      const status = row.querySelector('[data-label="Trạng thái"]').getBoundingClientRect();
      const actions = row.lastElementChild.getBoundingClientRect();
      return actions.x >= status.right - 1;
    }), true, 'action column must not cover the payment status');
    await (await page.$('.payout-approval-table')).screenshot({ path: '.qa-artifacts/payout-layout/rows.png' });
    await page.type('input[aria-label="Tìm yêu cầu chi trả"]', 'does-not-exist');
    await page.waitForSelector('.payout-table-empty');
    assert.equal(await page.$('.payout-table-scroll'), null);
    assert.match(await page.$eval('.payout-table-empty', element => element.textContent), /Không tìm thấy yêu cầu phù hợp/);
    await page.click('button[aria-label="Xóa từ khóa tìm chi trả"]');
    await page.waitForSelector('table[aria-label="Danh sách chi trả"] tbody tr');
    assert.deepEqual(writes, []); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
