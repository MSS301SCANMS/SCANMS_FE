import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const browserPath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('isolated sample trial syncs Shop/KOL, gates video until delivered, persists 14-day deadline and never calls APIs',
  { skip: !base || !existsSync(browserPath), timeout: 45000 }, async () => {
    assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
    const browser = await puppeteer.launch({ executablePath: browserPath, headless: true });
    const apiCalls = [];
    async function open(role) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1100, height: 800 });
      await page.setRequestInterception(true);
      page.on('request', request => {
        const url = new URL(request.url());
        if (url.pathname.startsWith('/api/')) { apiCalls.push(url.pathname); return request.abort(); }
        if (url.origin !== new URL(base).origin) return request.abort();
        if (url.pathname === '/__sample-delivery-test') return request.respond({ status: 200, contentType: 'text/html', body: `
          <html><body><div id="root"></div><script type="module">
          import RefreshRuntime from '/@react-refresh';
          RefreshRuntime.injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type;
          window.__vite_plugin_react_preamble_installed__ = true;
          const React = await import('/node_modules/.vite/deps/react.js');
          const dom = await import('/node_modules/.vite/deps/react-dom_client.js');
          const {default: Trial} = await import('/src/components/samples/SampleDeliverySandbox.tsx');
          (dom.createRoot || dom.default.createRoot)(document.getElementById('root')).render((React.createElement || React.default.createElement)(Trial, {role: '${role}'}));
          </script></body></html>` });
        return request.continue();
      });
      await page.goto(`${base}/__sample-delivery-test`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid="sample-delivery-sandbox"]', { timeout: 10000 });
      await page.click('button[aria-expanded]');
      return page;
    }
    const clickText = (page, text) => page.evaluate(text => {
      const button = [...document.querySelectorAll('button')].find(button => button.textContent.includes(text));
      if (!button) throw new Error(`Missing button: ${text}`);
      button.click();
    }, text);
    try {
      const shop = await open('shop');
      const kol = await open('kol');
      await clickText(shop, 'Tạo mẫu kiểm thử');
      await kol.waitForFunction(() => document.body.innerText.includes('Sản phẩm mẫu kiểm thử'));
      assert.equal(await kol.$('input[type="url"]'), null);
      assert.equal(await kol.$eval('section', el => el.innerText.includes('Chuyển mốc thử:')), false);
      for (const expected of ['Bưu tá đã lấy hàng tại kho Shop', 'Nhập kho trung chuyển', 'Shipper đang giao']) {
        await clickText(shop, 'Chuyển mốc thử:');
        await kol.waitForFunction(expected => document.querySelector('[role="status"]').textContent === expected, {}, expected);
        assert.equal(await kol.$('input[type="url"]'), null);
      }
      assert.match(await kol.$eval('section', el => el.innerText), /Nguyễn Văn Kiểm Thử/);
      await clickText(shop, 'Chuyển mốc thử:');
      await kol.waitForSelector('input[type="url"]');
      const trial = await kol.evaluate(() => JSON.parse(localStorage.getItem('scanms:sample-delivery-sandbox:v1')));
      assert.equal(trial.step, 4);
      assert.equal(trial.receivedAt, trial.times[4]);
      const beforeDeadline = await kol.$eval('section', el => el.innerText);
      assert.match(beforeDeadline, /Đã nhận · chờ video/);
      assert.match(beforeDeadline, /\(14 ngày\)/);
      const deadline = new Date(Date.parse(trial.receivedAt) + 14 * 86400000).toLocaleString('vi-VN', { timeZone: 'Asia/Saigon' });
      // Browser timezone is pinned below so displayed and expected timestamps agree.
      await kol.emulateTimezone('Asia/Saigon');
      await kol.reload({ waitUntil: 'domcontentloaded' });
      await kol.waitForSelector('button[aria-expanded]'); await kol.click('button[aria-expanded]');
      assert.match(await kol.$eval('section', el => el.innerText), new RegExp(deadline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.equal(await kol.evaluate(() => JSON.parse(localStorage.getItem('scanms:sample-delivery-sandbox:v1')).receivedAt), trial.receivedAt);
      await kol.type('input[type="url"]', 'https://example.test/review');
      await clickText(kol, 'Nộp Link Video Review thử');
      await shop.waitForFunction(() => document.body.innerText.includes('Đã lưu video kiểm thử: https://example.test/review'));
      await clickText(shop, 'Xóa dữ liệu kiểm thử');
      await kol.waitForFunction(() => document.body.innerText.includes('Chưa có mẫu thử'));
      assert.deepEqual(apiCalls, []);
    } finally { await browser.close(); }
  });
