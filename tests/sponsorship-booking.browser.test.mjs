import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('sponsorship booking shows benefits, quotes and submits the agreed fee across screen sizes', {
  skip: !base || !existsSync(executablePath), timeout: 60000,
}, async () => {
  const origin = new URL(base).origin;
  const transformed = await (await fetch(`${origin}/src/components/stores/SponsoredPlacementsPanel.tsx`)).text();
  const queryModule = transformed.match(/from "([^"]*@tanstack_react-query[^\"]*)"/)[1];
  const publicSource = await (await fetch(`${origin}/src/components/marketplace/SponsoredStores.tsx`)).text();
  const routerModule = publicSource.match(/from "([^"]*react-router-dom[^\"]*)"/)[1];
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    const errors = [], writes = [], rows = [], filters = [];
    let publicUntil = 0, publicReads = 0;
    page.on('pageerror', e => { if (!e.message.includes('WebSocket closed without opened')) errors.push(e.message); });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'qa-sponsor');
      localStorage.setItem('user', JSON.stringify({ id: 'qa-owner', role: 'SHOP_MANAGER', fullName: 'QA Shop' }));
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/__sponsorship-qa') return request.respond({ status: 200, contentType: 'text/html', body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#FAF8F5"><main style="max-width:1100px;margin:24px auto;padding:16px" id="root"></main><script type="module">
        import RefreshRuntime from '/@react-refresh';
        RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;
        const {default:React} = await import('/node_modules/.vite/deps/react.js');
        const {default:ReactDOM} = await import('/node_modules/.vite/deps/react-dom_client.js');
        const {QueryClient, QueryClientProvider} = await import('${queryModule}');
        await import('/src/index.css');
        const {SponsoredPlacementsPanel} = await import('/src/components/stores/SponsoredPlacementsPanel.tsx');
        const root = ReactDOM.createRoot(document.getElementById('root'));
        const client = new QueryClient({defaultOptions:{queries:{retry:false}}});
        root.render(React.createElement(QueryClientProvider,{client},React.createElement(SponsoredPlacementsPanel)));
        window.showPublicBanners = async () => {
          const {SponsoredStores} = await import('/src/components/marketplace/SponsoredStores.tsx');
          const {MemoryRouter} = await import('${routerModule}');
          root.render(React.createElement(QueryClientProvider,{client},React.createElement(MemoryRouter,null,React.createElement(SponsoredStores))));
        };
      </script></body></html>` });
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let data;
        if (url.pathname.endsWith('/public/placements')) {
          publicReads++;
          data = [{ store: { id: 'qa-public', name: 'QA Shop', logoUrl: null }, headline: 'Public sponsor', endsAt: new Date(publicUntil).toISOString() }];
        } else if (url.pathname.endsWith('/pricing')) data = { dailyRate: 100000, currency: 'VND', billingHours: 24, minHours: 1, maxDays: 31 };
        else if (request.method() === 'POST') {
          const payload = JSON.parse(request.postData()); writes.push(payload);
          rows.push({ ...payload, id: 'qa-request', status: 'REQUESTED', fundingType: 'PAID', amount: payload.quotedAmount, store: { id: 'qa-shop', name: 'Sora Skin' } });
          data = rows[0];
        } else if (request.method() === 'PATCH' && url.pathname.endsWith('/cancel')) {
          writes.push(JSON.parse(request.postData()));
          rows[0].status = 'CANCELLED'; data = rows[0];
        } else {
          const status = url.searchParams.get('status'); filters.push(status);
          const effectiveRows = rows.map(row => ({ ...row, status: ['REQUESTED', 'APPROVED'].includes(row.status) && Date.parse(row.endsAt) <= Date.now() ? 'EXPIRED' : row.status }));
          const items = effectiveRows.filter(row => !status || row.status === status);
          data = { items, total: items.length, page: 1, totalPages: 1 };
        }
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(`${origin}/__sponsorship-qa`);
    await page.waitForSelector('.sp-presets button', { timeout: 12000 }).catch(error => {
      throw new Error(`${error.message}; browser errors: ${JSON.stringify(errors)}`);
    });
    await page.type('input[name=headline]', 'Sora Skin — Ưu đãi chăm sóc da');
    await page.click('.sp-presets button:nth-of-type(1)');
    await page.waitForFunction(() => document.querySelector('input[name=quotedAmount]').value === '100000');
    const target = await page.evaluate(() => {
      const start = new Date(document.querySelector('input[name=startsAt]').value);
      const end = new Date(start.getTime() + 25 * 3600000);
      return { day: end.toLocaleDateString('vi-VN'), hour: String(end.getHours()), minute: String(end.getMinutes()) };
    });
    await page.click('.sp-datetime:nth-child(2) .sp-date-trigger');
    await page.waitForSelector('.sp-date-panel');
    await page.screenshot({ path: join(tmpdir(), 'scanms-sponsorship-calendar-desktop.png'), fullPage: true });
    await page.click(`.sp-calendar-grid button[aria-label="${target.day}"]`);
    await page.select('select[aria-label="Giờ kết thúc"]', target.hour);
    await page.select('select[aria-label="Phút kết thúc"]', target.minute);
    assert.equal(await page.$eval('input[name=quotedAmount]', el => el.value), '100000', 'time edits remain drafts until confirmation');
    await page.click('.sp-date-confirm');
    await page.waitForFunction(() => document.querySelector('input[name=quotedAmount]').value === '200000');
    await page.click('.sp-presets button:nth-of-type(2)');
    await page.waitForFunction(() => document.querySelector('input[name=quotedAmount]').value === '300000');
    assert.match(await page.$eval('.sp-total', el => el.textContent), /300.000/);
    await page.screenshot({ path: join(tmpdir(), 'scanms-sponsorship-desktop.png'), fullPage: true });
    await page.setViewport({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(tmpdir(), 'scanms-sponsorship-mobile.png'), fullPage: true });
    await page.click('.sp-datetime:first-child .sp-date-trigger');
    await page.waitForSelector('.sp-date-panel');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(tmpdir(), 'scanms-sponsorship-calendar-mobile.png'), fullPage: true });
    await page.keyboard.press('Escape');
    assert.equal(await page.$('.sp-date-panel'), null);
    assert.equal(await page.$eval('.sp-banner-preview', el => getComputedStyle(el).backgroundColor), 'rgb(250, 248, 245)');
    await page.click('.sp-booking-fields button[type=submit]');
    await page.waitForFunction(() => document.querySelector('.sp-workspace').innerText.includes('Phí đăng ký:'));
    assert.equal(writes.length, 1);
    assert.equal(writes[0].quotedAmount, 300000);
    assert.equal(await page.$eval('input[name=headline]', el => el.value), '');
    assert.equal(await page.$eval('.sp-history-filter', el => el.value), 'REQUESTED');
    assert.match(await page.$eval('.sp-workspace article', el => el.textContent), /Chờ duyệt/);
    await page.select('.sp-history-filter', 'APPROVED');
    await page.waitForSelector('.sp-history-empty');
    assert.equal(await page.$('.sp-workspace article'), null);
    await page.select('.sp-history-filter', 'REQUESTED');
    await page.waitForSelector('.sp-workspace article');
    rows[0].status = 'APPROVED';
    await page.waitForSelector('.sp-history-empty', { timeout: 20000 });
    await page.select('.sp-history-filter', 'APPROVED');
    await page.waitForFunction(() => document.querySelector('.sp-workspace article')?.textContent.includes('Đã duyệt'));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.screenshot({ path: join(tmpdir(), 'scanms-sponsorship-status-approved.png'), fullPage: true });
    await page.click('.sp-workspace article button');
    await page.type('section[aria-label="Form hủy tài trợ"] textarea', 'Kiểm thử hủy quảng cáo');
    await page.click('section[aria-label="Form hủy tài trợ"] button[type=submit]');
    await page.waitForFunction(() => document.querySelector('.sp-history-filter').value === 'CANCELLED' && document.querySelector('.sp-workspace article')?.textContent.includes('Đã hủy'));
    rows.push({ ...rows[0], id: 'qa-rejected', status: 'REJECTED' });
    await page.select('.sp-history-filter', 'REJECTED');
    await page.waitForFunction(() => document.querySelector('.sp-workspace article')?.textContent.includes('Từ chối'));
    rows.push({ ...rows[0], id: 'qa-expired', status: 'APPROVED',
      startsAt: new Date(Date.now() - 86400000).toISOString(), endsAt: new Date(Date.now() - 1000).toISOString() });
    await page.select('.sp-history-filter', 'EXPIRED');
    await page.waitForSelector('.sp-expired-notice');
    assert.match(await page.$eval('.sp-expired-notice', el => el.textContent), /không còn hiển thị/);
    assert.equal(await page.$eval('.sp-workspace article', el => el.textContent.includes('Hủy gói')), false);
    await page.screenshot({ path: join(tmpdir(), 'scanms-sponsorship-expired.png'), fullPage: true });
    await page.click('.sp-workspace article button');
    await page.waitForSelector('.sp-renewal-info');
    assert.equal(await page.$eval('input[name=headline]', el => el.value), rows[0].headline);
    assert.equal(await page.$eval('input[name=quotedAmount]', el => el.value), '100000');
    await page.screenshot({ path: join(tmpdir(), 'scanms-sponsorship-renewal.png'), fullPage: true });
    await page.click('.sp-booking-fields button[type=submit]');
    await page.waitForFunction(() => document.querySelector('.sp-history-filter').value === 'REQUESTED');
    const renewalWrite = writes.find(write => write.renewsPlacementId);
    assert.equal(renewalWrite.renewsPlacementId, 'qa-expired');
    assert.equal(renewalWrite.quotedAmount, 100000);
    assert.ok(Date.parse(renewalWrite.startsAt) > Date.now());
    assert.equal(rows.find(row => row.id === 'qa-expired').status, 'APPROVED', 'renewal preserves historical booking');
    assert.ok(filters.includes('APPROVED') && filters.includes('REJECTED') && filters.includes('REQUESTED') && filters.includes('CANCELLED'));
    publicUntil = Date.now() + 2000;
    await page.evaluate(() => window.showPublicBanners());
    await page.waitForSelector('section[aria-label="Gian hàng tài trợ nổi bật"]');
    await page.waitForFunction(() => !document.querySelector('section[aria-label="Gian hàng tài trợ nổi bật"]'), { timeout: 5000 });
    assert.equal(publicReads, 1, 'expired banner disappears on its own before the next API refresh');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
