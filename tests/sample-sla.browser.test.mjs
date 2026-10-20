import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const browserPath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('KOL sample UI hides early receipt/video actions and opens video submission only after received synchronization',
  { skip: !base || !existsSync(browserPath), timeout: 45000 }, async () => {
    assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
    const browser = await puppeteer.launch({ executablePath: browserPath, headless: true });
    const storeId = '00000000-0000-4000-8000-000000000010';
    const sampleId = '00000000-0000-4000-8000-000000000011';
    const sample = { id: sampleId, collaboratorId: 'audit-kol', status: 'SHIPPED', carrier: 'GHN', trackingNumber: 'AUDIT-GHN',
      receivedAt: null, deadlineAt: null, expectedVideoAt: '2020-01-01T00:00:00Z', createdAt: '2026-01-01T00:00:00Z',
      events: [], videoAssets: [], product: { id: 'audit-product', title: 'Mẫu kiểm thử SLA', storeId },
      socialPlatformSnapshot: 'TIKTOK', socialChannelNameSnapshot: 'Audit' };
    const mutations = [];
    let syncAttempts = 0;
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 1000 });
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('token', 'audit-token-with-no-server-access');
        localStorage.setItem('user', JSON.stringify({ id: 'audit-kol', role: 'COLLABORATOR', fullName: 'KOL kiểm thử', email: 'audit@example.test' }));
        const original = window.setTimeout.bind(window);
        window.setTimeout = (fn, ms, ...args) => original(fn, ms === 30000 ? 800 : ms, ...args);
      });
      await page.setRequestInterception(true);
      page.on('request', async request => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/') || url.port === '3000') {
          const headers = { 'Access-Control-Allow-Origin': new URL(base).origin, 'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Content-Type': 'application/json' };
          if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
          if (request.method() !== 'GET') mutations.push(url.pathname);
          let data = [];
          if (url.pathname === '/api/stores/marketplace') data = [{ id: storeId, name: 'Shop kiểm thử', slug: 'audit-shop' }];
          if (url.pathname === '/api/sample-requests/my') data = [sample];
          if (url.pathname === '/api/sample-requests/my/eligibility') data = { canRequest: true, isBlocked: false, channels: [] };
          if (url.pathname === '/api/kyc/profile') data = { kycStatus: 'VERIFIED' };
          if (url.pathname === '/api/products' || url.pathname === '/api/media') data = { items: [], pagination: { total: 0 } };
          if (url.pathname.includes('/shipping/ghn/track/')) data = { status: 'delivered', statusText: 'Giao hàng thành công',
            environment: 'LIVE', isStale: false, timeline: [{ status: 'delivered', title: 'Giao hàng thành công', time: new Date().toISOString() }] };
          if (url.pathname.includes('/shipping/ghn/sync-sample/')) {
            syncAttempts++;
            if (syncAttempts === 1) {
              data = { status: sample.status, synchronized: false };
            } else {
              sample.status = 'RECEIVED'; sample.receivedAt = new Date().toISOString();
              sample.deadlineAt = new Date(Date.now() + 14 * 86400000).toISOString(); sample.expectedVideoAt = sample.deadlineAt;
              data = { status: 'RECEIVED', synchronized: true };
            }
          }
          return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
        }
        if (url.origin !== new URL(base).origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
        return request.continue();
      });
      for (const initial of ['SHIPPED', 'DELIVERY_ISSUE']) {
        sample.status = initial; sample.receivedAt = null; sample.deadlineAt = null; sample.expectedVideoAt = '2020-01-01T00:00:00Z'; syncAttempts = 0;
        await page.goto(`${base}/collaborator/collaboration?shop=${storeId}&tab=samples`, { waitUntil: 'domcontentloaded' });
        const card = `div[data-status="${initial.toLowerCase()}"].grid`;
        await page.waitForSelector(card);
        const before = await page.$eval(card, el => el.innerText);
        assert.match(before, /AUDIT-GHN/);
        assert.match(before, /Theo dõi hành trình bưu kiện/);
        assert.doesNotMatch(before, /Đã nhận được hàng|Nộp Link Video Review|hạn 1\/1\/2020/);
        await page.$eval(card, el => [...el.querySelectorAll('button')].find(b => b.textContent.includes('Theo dõi hành trình')).click());
        await page.waitForFunction(() => document.body.innerText.includes('đang xác minh thời điểm nhận mẫu'));
        assert.doesNotMatch(await page.$eval(card, el => el.innerText), /Nộp Link Video Review/);
        await page.waitForSelector('div[data-status="received"].grid');
        const after = await page.$eval('div[data-status="received"].grid', el => el.innerText);
        assert.match(after, /Nộp Link Video Review/);
        assert.match(after, /hạn/);
        assert.ok(syncAttempts >= 2, 'receipt pending is retried before opening video submission');
      }
      assert.equal(mutations.some(path => path.endsWith('/receive')), false);
      assert.equal(mutations.includes(`/api/shipping/ghn/sync-sample/${sampleId}`), true);
    } finally { await browser.close(); }
  });
