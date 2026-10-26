import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('commission history filters, retries failed loads and confirms operator credit/reversal without KOL mutation controls', {
  skip: !base || !existsSync(executablePath), timeout: 40000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const rows = [
    { commissionId: 'eligible', orderItemId: 'item-1', collaboratorId: 'kol', basisVnd: 1000000, rate: 10, amountVnd: 100000, status: 'ELIGIBLE', createdAt: '2026-10-20T00:00:00Z', adjustmentHistory: { productName: 'Test shirt', originalAmountVnd: 100000, refundedAmountVnd: 0 } },
    { commissionId: 'returned', orderItemId: 'item-2', collaboratorId: 'kol', basisVnd: 0, rate: 10, amountVnd: 0, status: 'CANCELLED', transferReference: 'original', createdAt: '2026-10-20T00:00:00Z', adjustmentHistory: { productName: 'Returned shirt', originalAmountVnd: 100000, refundedAmountVnd: 1000000, ledgerReconciledAmountVnd: 100000 } },
  ];
  const writes = [], errors = []; let fail = false;
  const page = await browser.newPage();
  page.on('pageerror', error => { if (error.message !== 'WebSocket closed without opened.') errors.push(error.message); });
  await page.evaluateOnNewDocument(() => {
    localStorage.clear(); localStorage.setItem('token', 'commission-fixture-only');
    localStorage.setItem('user', JSON.stringify({ id: 'fixture', role: 'ADMIN' }));
  });
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
    if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
    if (url.pathname.startsWith('/api/')) {
      if (request.method() === 'POST') {
        writes.push(url.pathname);
        if (url.pathname.endsWith('/eligible/credit')) { rows[0].status = 'CREDITED'; rows[0].transferReference = 'credited'; rows[0].adjustmentHistory.ledgerReconciledAmountVnd = 100000; }
        else if (url.pathname.endsWith('/returned/reconcile')) { rows[1].adjustmentHistory.ledgerReconciledAmountVnd = 0; rows[1].adjustmentHistory.reversalTransactionId = 'reversed'; }
        else throw Error('Unexpected financial mutation: ' + url.pathname);
      }
      return request.respond({ status: fail ? 503 : 200, headers, contentType: 'application/json', body: JSON.stringify({ code: fail ? 503 : 200, result: rows, ...(fail ? { message: 'Commission fixture unavailable' } : {}) }) });
    }
    if (url.pathname === '/__commission-test') return request.respond({ contentType: 'text/html; charset=utf-8', body: `<html><body><div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;import '/src/index.css';
      const source=await(await fetch('/src/components/affiliate/CommissionHistoryPanel.tsx')).text(), main=await(await fetch('/src/main.tsx')).text();
      const React=await import(source.match(/[\"]([^\"]*deps.react[.]js[^\"]*)[\"]/)[1]),dom=await import(main.match(/[\"]([^\"]*react-dom_client[.]js[^\"]*)[\"]/)[1]);
      const {CommissionHistoryPanel}=await import('/src/components/affiliate/CommissionHistoryPanel.tsx');
      const h=React.createElement||React.default.createElement,root=(dom.createRoot||dom.default.createRoot)(document.getElementById('root'));
      window.renderPanel=operator=>root.render(h(CommissionHistoryPanel,{operator}));window.renderPanel(true);
    </script></body></html>` });
    if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
    return request.continue();
  });
  async function click(text) { await page.evaluate(text => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text)?.click(), text); }
  try {
    await page.goto(origin + '/__commission-test');
    await page.waitForSelector('tbody tr'); assert.equal((await page.$$('tbody tr')).length, 2);
    await page.setViewport({ width: 1440, height: 900 });
    await page.screenshot({ path: '../.run-logs/affiliate-commission-desktop.png', fullPage: true });
    await page.click('button[aria-label="Chi tiết hoa hồng item-2"]');
    await page.waitForSelector('dialog[open]');
    assert.match(await page.$eval('dialog', el => el.innerText), /100\.000/);
    assert.match(await page.$eval('dialog', el => el.innerText), /Tỷ lệ giữ nguyên/);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog[open]'));
    await page.type('input[aria-label="Tìm hoa hồng"]', 'Returned'); assert.equal((await page.$$('tbody tr')).length, 1);
    await page.click('button[aria-label="Xóa tìm kiếm hoa hồng"]');
    await page.select('select', 'CANCELLED'); assert.equal((await page.$$('tbody tr')).length, 1);
    await click('Đồng bộ thu hồi'); assert.equal(writes.length, 0, 'Opening confirmation must not mutate money');
    await click('Hủy bỏ'); assert.equal(writes.length, 0);
    await click('Đồng bộ thu hồi'); await click('Xác nhận xử lý');
    await page.waitForFunction(() => document.body.innerText.includes('Đã cập nhật giao dịch thu hồi'));
    assert.equal(writes.length, 1); assert.ok(writes[0].endsWith('/returned/reconcile'));
    await page.select('select', 'ELIGIBLE'); await click('Ghi có hoa hồng'); await click('Xác nhận xử lý');
    await page.waitForFunction(() => document.body.innerText.includes('Không có hoa hồng ở trạng thái này.'));
    assert.equal(writes.length, 2); assert.ok(writes[1].endsWith('/eligible/credit'));
    fail = true; await click('Cập nhật hoa hồng'); await page.waitForSelector('[role="alert"]');
    fail = false; await click('Cập nhật hoa hồng'); await page.waitForFunction(() => !document.querySelector('[role="alert"]'));
    await page.select('select', 'ALL'); await page.evaluate(() => window.renderPanel(false));
    assert.equal(await page.$eval('body', body => body.innerText.includes('Ghi có hoa hồng') || body.innerText.includes('Đồng bộ thu hồi')), false);
    await page.setViewport({ width: 390, height: 844 });
    await page.click('article button[aria-label="Chi tiết hoa hồng item-2"]');
    await page.waitForSelector('dialog[open]');
    await page.screenshot({ path: '../.run-logs/affiliate-commission-detail-mobile.png', fullPage: true });
    await page.click('button[aria-label="Đóng chi tiết hoa hồng"]');
    await page.screenshot({ path: '../.run-logs/affiliate-commission-mobile.png', fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    for (let index=0;index<11;index++) rows.push({...rows[0],commissionId:'extra-'+index,orderItemId:'extra-'+index,status:'PENDING',transferReference:null,adjustmentHistory:{productName:'Additional shirt '+index,originalAmountVnd:100000}});
    await page.setViewport({width:1440,height:900});await click('Cập nhật hoa hồng');
    await page.waitForSelector('button[aria-label="Trang hoa hồng sau"]');
    await page.click('button[aria-label="Trang hoa hồng sau"]');
    assert.equal((await page.$$('tbody tr')).length,3);
    assert.equal(await page.$eval('button[aria-label="Trang hoa hồng sau"]',button=>button.disabled),true);
    await page.type('input[aria-label="Tìm hoa hồng"]','extra-10');
    assert.equal((await page.$$('tbody tr')).length,1,'Searching resets pagination to the matching first page');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
