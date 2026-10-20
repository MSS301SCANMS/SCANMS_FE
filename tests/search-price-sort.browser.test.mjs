import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('price sorting remains clickable across the hover gap and sorts in both directions', {
  skip: !base || !existsSync(executablePath), timeout: 20000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    await page.setViewport({ width: 1440, height: 1000 });
    const products = [200000, 50000, 120000].map((price, i) => ({
      id: `sort-product-${i}`, sku: `SORT-${i}`, title: `Product ${i}`,
      createdAt: ['2026-01-03', '2026-01-01', '2026-01-02'][i],
      soldCount: [4, 1, 7][i], viewCount: [2, 8, 0][i],
      price, originalPrice: price, stockQuantity: 10, variants: [],
      imageUrl: '/assets/products/real/amino-cleanser-ph55.jpg',
      store: { id: 'sort-store', name: 'Store' },
    }));
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true,
          data: url.pathname === '/api/public/products' ? {
            items: url.searchParams.get('page') === '2' ? products.slice(2) : products.slice(0, 2),
            pagination: { totalPages: 2 },
          } : [] }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(`${base}/search`);
    await page.waitForFunction(() => document.querySelectorAll('main article').length === 3);
    const names = () => page.$$eval('main article h3', els => els.map(el => el.textContent));
    assert.deepEqual(await names(), ['Product 1', 'Product 0', 'Product 2'], 'popular follows actual views');
    for (const [label, expected] of [
      ['Mới Nhất', ['Product 0', 'Product 2', 'Product 1']],
      ['Bán Chạy', ['Product 2', 'Product 0', 'Product 1']],
      ['Phổ Biến', ['Product 1', 'Product 0', 'Product 2']],
    ]) {
      await page.$$eval('button[aria-pressed]', (els, label) => els.find(el => el.textContent.trim() === label).click(), label);
      assert.deepEqual(await names(), expected);
    }
    const trigger = '[aria-controls="price-sort-options"]';
    const menu = '#price-sort-options';
    const prices = () => page.$$eval('main article strong', els => els.map(el => Number(el.textContent.replace(/\D/g, ''))));

    for (const [option, sort, expected] of [
      [1, 'price_asc', [50000, 120000, 200000]],
      [2, 'price_desc', [200000, 120000, 50000]],
    ]) {
      const bounds = await (await page.$(trigger)).boundingBox();
      const x = bounds.x + bounds.width / 2;
      await page.mouse.move(x, bounds.y + bounds.height / 2);
      await page.waitForSelector(menu);
      await page.mouse.click(x, bounds.y + bounds.height / 2);
      assert.ok(await page.$(menu), 'clicking an already hovered trigger keeps the options open');
      await page.mouse.move(x, bounds.y + bounds.height + 2, { steps: 8 });
      assert.ok(await page.$(menu), 'the gap between trigger and options remains interactive');
      await page.click(`${menu} button:nth-child(${option})`);
      await page.waitForFunction(value => new URLSearchParams(location.search).get('sort') === value, {}, sort);
      assert.deepEqual(await prices(), expected);
      assert.equal(await page.$(menu), null);
      await page.mouse.move(0, 0);
    }

    await page.focus(trigger);
    await page.keyboard.press('Enter');
    await page.waitForSelector(menu);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    assert.deepEqual(await prices(), [50000, 120000, 200000]);
    await page.click(trigger);
    await page.keyboard.press('Escape');
    assert.equal(await page.$(menu), null);
    assert.equal(await page.$eval(trigger, el => el === document.activeElement), true);
    await page.click(trigger);
    await page.mouse.click(5, 5);
    assert.equal(await page.$(menu), null);
  } finally {
    await browser.close();
  }
});
