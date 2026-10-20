import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('buyer discounts and availability combine; commission stays exclusive to KOL', {
  skip: !base || !existsSync(executablePath), timeout: 30000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    await page.setViewport({ width: 1440, height: 1000 });
    const products = [
      { id: 'sale-stock', price: 100, originalPrice: 150, stockQuantity: 0, variants: [{ id: 'v1', name: '100 ml', stockQuantity: 2, isActive: true }] },
      { id: 'sale-empty', price: 100, originalPrice: 150, stockQuantity: 0, commissionRate: 10 },
      { id: 'regular-stock', price: 100, originalPrice: 100, stockQuantity: 3 },
    ].map(product => ({ ...product, title: product.id, sku: product.id, store: { id: 'store', name: 'Store' } }));
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true,
          data: url.pathname === '/api/public/products' ? { items: products } : [] }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    const names = () => page.$$eval('main article h3', els => els.map(el => el.textContent));
    const check = label => page.$$eval('aside label', (els, text) => {
      const input = els.find(el => el.textContent.trim() === text)?.querySelector('input');
      if (!input) throw new Error(`Missing filter: ${text}`);
      input.click();
    }, label);
    await page.goto(`${base}/search?commission=true`);
    await page.waitForSelector('main article');
    assert.equal((await names()).length, 3, 'guest links cannot silently apply a hidden commission filter');
    assert.doesNotMatch(await page.$eval('aside', el => el.textContent), /Hoa hồng|hoa hồng|Sẵn hàng giao ngay/);
    await check('Đang giảm giá');
    await page.waitForFunction(() => document.querySelectorAll('main article').length === 2);
    await check('Còn hàng');
    await page.waitForFunction(() => document.querySelectorAll('main article').length === 1);
    assert.deepEqual(await names(), ['sale-stock']);
    assert.equal(new URL(page.url()).searchParams.get('discount'), 'true');
    await page.reload();
    await page.waitForSelector('main article');
    assert.deepEqual(await names(), ['sale-stock']);
    await page.evaluate(() => localStorage.setItem('user', JSON.stringify({ id: 'qa-customer', role: 'CUSTOMER', fullName: 'Customer' })));
    await page.goto(`${base}/search?commission=true`);
    await page.waitForSelector('main article');
    assert.equal((await names()).length, 3);
    assert.doesNotMatch(await page.$eval('aside', el => el.textContent), /hoa hồng/i);
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({ id: 'qa-kol', role: 'COLLABORATOR', fullName: 'KOL' }));
      window.dispatchEvent(new Event('auth-user-updated'));
    });
    await page.waitForFunction(() => document.querySelectorAll('main article').length === 1);
    assert.deepEqual(await names(), ['sale-empty']);
    await check('Có hoa hồng CTV/KOL');
    await page.waitForFunction(() => document.querySelectorAll('main article').length === 3);
    await page.setViewport({ width: 390, height: 844 });
    await page.$$eval('button', els => els.find(el => el.textContent.trim() === 'Bộ lọc')?.click());
    await page.waitForFunction(() => [...document.querySelectorAll('label')].filter(el => el.textContent.trim() === 'Đang giảm giá').length === 2);
    const mobileDiscount = await page.$$('label');
    for (const label of mobileDiscount) {
      if (await label.evaluate(el => el.textContent.trim() === 'Đang giảm giá' && el.getBoundingClientRect().width > 0)) {
        await label.evaluate(el => el.querySelector('input').click());
        break;
      }
    }
    await page.waitForFunction(() => document.querySelectorAll('main article').length === 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  } finally { await browser.close(); }
});
