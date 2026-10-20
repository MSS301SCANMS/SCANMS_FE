import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const productId = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const variants = [
  { id: productId(11), name: '100 ml / Tiêu chuẩn', sku: 'CLEAN-100', price: 160000, stockQuantity: 3, isActive: true },
  { id: productId(12), name: '150 ml / Hộp quà', sku: 'CLEAN-150', price: 210000, stockQuantity: 5, isActive: true },
  { id: productId(13), name: '100 ml / Hộp quà', sku: 'CLEAN-GIFT', price: 180000, stockQuantity: 0, isActive: true },
];
const items = [
  { productId: productId(1), variantId: variants[0].id, variantName: variants[0].name, title: 'Sữa rửa mặt dịu nhẹ pH 5.5 Herbal Spa 100 ml',
    sku: 'CLEAN-100', price: 160000, originalPrice: 190000, quantity: 2, stockQuantity: 3, isActive: true,
    imageUrl: '/assets/products/real/amino-cleanser-ph55.jpg', store: { id: productId(101), name: 'Herbal Spa' }, availableVariants: variants },
  { productId: productId(2), title: 'Serum Vitamin C 15% Herbal Spa 30 ml', sku: 'VITC', price: 250000, originalPrice: 280000,
    quantity: 1, stockQuantity: 10, isActive: true, imageUrl: '/assets/products/real/vitamin-c-15-serum.jpg', store: { id: productId(101), name: 'Herbal Spa' } },
  { productId: productId(3), title: 'Serum rau má B5 Medimix 30 ml', sku: 'B5', price: 200000, quantity: 1, stockQuantity: 0,
    isActive: true, imageUrl: '/assets/products/real/one-thing-centella-b5.jpg', store: { id: productId(102), name: 'Medimix' } },
].map(item => ({ ...item, cartItemId: `${item.productId}_${item.variantId || 'base'}` }));

test('bright cart drawer preserves selection, variants, quantity, scrolling, checkout and keyboard focus', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(items => {
      localStorage.setItem('scanms_cart_guest', JSON.stringify(items));
      localStorage.setItem('scanms_cart_selected_guest', JSON.stringify(items.map(item => item.cartItemId)));
    }, items);
    let validations = 0;
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      const origin = new URL(base).origin;
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let data = [];
        if (url.pathname === '/api/orders/validate-cart') {
          validations++;
          const submitted = JSON.parse(request.postData()).items;
          data = { items: submitted.map(item => ({ ...item, currentPrice: item.clientPrice, stockQuantity: item.productId === items[2].productId ? 0 : 10, isActive: true })), warnings: [] };
        }
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(base);
    const open = async () => {
      await page.waitForSelector('button[aria-label="Giỏ hàng"]');
      await page.click('button[aria-label="Giỏ hàng"]');
      await page.waitForSelector('.scanms-cart-dialog[open]');
      await page.waitForFunction(() => !document.querySelector('.scanms-cart-panel').getAnimations().some(a => a.playState === 'running'));
    };
    const amount = () => page.$eval('.scanms-cart-summary > strong', el => Number(el.textContent.replace(/\D/g, '')));
    await open();
    assert.equal(await amount(), 570000, 'unavailable selected products are excluded from subtotal');
    assert.equal(await page.$eval('.scanms-cart-item[data-available="false"] input', el => el.disabled), true);
    assert.doesNotMatch(await page.$eval('.scanms-cart-panel', el => el.textContent), /Miễn phí giao hàng toàn quốc|Tổng tiền thanh toán/);
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
    await page.screenshot({ path: join(tmpdir(), 'scanms-cart-redesign-desktop.png') });
    await page.click('.scanms-cart-item:first-child .scanms-cart-quantity button:last-child');
    assert.equal(await amount(), 730000);
    assert.equal(await page.$eval('.scanms-cart-item:first-child .scanms-cart-quantity button:last-child', el => el.disabled), true);
    await page.select('.scanms-cart-variant', variants[1].id);
    assert.equal(await amount(), 880000);
    assert.equal(await page.$eval('.scanms-cart-variant option:last-child', el => el.disabled), true);
    await page.click('.scanms-cart-item:first-child .scanms-cart-quantity button:first-child');
    assert.equal(await amount(), 670000);
    await page.click('.scanms-cart-selection input');
    assert.equal(await amount(), 0);
    assert.equal(await page.$eval('.scanms-cart-checkout', el => el.disabled), true);
    await page.click('.scanms-cart-shop__header input');
    assert.equal(await amount(), 670000);
    await page.click('.scanms-cart-item:nth-child(2) > input');
    assert.equal(await amount(), 420000);
    assert.equal(await page.$eval('.scanms-cart-shop__header input', el => el.indeterminate), true);
    await page.click('.scanms-cart-selection input');
    assert.equal(await amount(), 670000);
    for (const width of [390, 320]) {
      await page.setViewport({ width, height: 740 });
      assert.equal(await page.$eval('.scanms-cart-panel', el => el.scrollWidth <= el.clientWidth), true);
      const before = await page.$eval('.scanms-cart-close', el => el.getBoundingClientRect().top);
      await page.$eval('.scanms-cart-body', el => { el.scrollTop = el.scrollHeight; });
      assert.equal(await page.$eval('.scanms-cart-close', el => el.getBoundingClientRect().top), before);
      assert.ok(await page.$eval('.scanms-cart-checkout', el => el.getBoundingClientRect().bottom <= innerHeight));
      await page.$eval('.scanms-cart-body', el => { el.scrollTop = 0; });
      if (width === 390) await page.screenshot({ path: join(tmpdir(), 'scanms-cart-redesign-mobile.png') });
    }
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.querySelector('.scanms-cart-dialog').contains(document.activeElement)), true);
    await page.keyboard.press('Escape');
    await page.waitForSelector('.scanms-cart-dialog', { hidden: true });
    assert.equal(await page.$eval('button[aria-label="Giỏ hàng"]', el => el === document.activeElement), true);
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
    await page.setViewport({ width: 1440, height: 1000 });
    await open();
    await page.click('.scanms-cart-refresh');
    await page.waitForFunction(() => !document.querySelector('.scanms-cart-refresh').disabled);
    assert.equal(validations, 1);
    await page.click('.scanms-cart-checkout');
    await page.waitForSelector('.scanms-cart-dialog', { hidden: true });
    const pending = await page.evaluate(() => JSON.parse(localStorage.getItem('scanms_pending_checkout')));
    assert.equal(pending.itemIds.length, 2);
    assert.ok(pending.itemIds.every(id => id !== items[2].cartItemId));
    await page.click('button[title="Quay lại mua sắm"]');
    await open();
    await page.mouse.click(20, 200);
    await page.waitForSelector('.scanms-cart-dialog', { hidden: true });
    await open();
    await page.$eval('.scanms-cart-checkout', el => el.focus());
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.querySelector('.scanms-cart-dialog').contains(document.activeElement)), true);
    for (let i = 0; i < items.length; i++) await page.click('.scanms-cart-item__remove');
    await page.waitForSelector('.scanms-cart-empty');
    assert.equal(await page.$('.scanms-cart-checkout'), null);
    await page.screenshot({ path: join(tmpdir(), 'scanms-cart-redesign-empty.png') });
    await page.click('.scanms-cart-empty button');
    await page.waitForSelector('.scanms-cart-dialog', { hidden: true });
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
