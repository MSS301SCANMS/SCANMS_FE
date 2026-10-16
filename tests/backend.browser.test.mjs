import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';

const browserPath = process.env.SCANMS_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const enabled = process.env.SCANMS_BROWSER_TESTS === '1' && existsSync(browserPath);

test('Spring microservice UI: canonical calls, catalog forms, ownership, no fake checkout, expiry and role denial', { skip: !enabled }, async () => {
  const server = await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: false }, logLevel: 'error' });
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  let browser;
  let page;
  let stage = 'launch browser';
  try {
    browser = await puppeteer.launch({ executablePath: browserPath, headless: true, pipe: true });
    stage = 'open page';
    page = await browser.newPage();
    page.setDefaultTimeout(15000);
    await page.setViewport({ width: 1440, height: 1000 });
    const id = Object.fromEntries(['user', 'store', 'otherStore', 'product', 'otherProduct', 'variant', 'category'].map(key => [key, randomUUID()]));
    let user = { userId: id.user, identitySubject: 'keycloak-sub', email: 'owner@example.test', fullName: 'Owner', roles: ['USER', 'SHOP_OWNER', 'KOL_CTV'], status: 'ACTIVE' };
    const database = {
      stores: [{ storeId: id.store, ownerUserId: id.user, name: 'Shop của tôi', approvalStatus: 'APPROVED' }, { storeId: id.otherStore, ownerUserId: randomUUID(), name: 'Shop khác', approvalStatus: 'APPROVED' }],
      products: [{ productId: id.product, storeId: id.store, name: 'Áo thật', priceVnd: 200000, status: 'ACTIVE' }, { productId: id.otherProduct, storeId: id.otherStore, name: 'Sản phẩm shop khác', priceVnd: 300000, status: 'ACTIVE' }],
      'product-categories': [{ categoryId: id.category, name: 'Áo', slug: 'ao', active: true }],
      'product-variants': [{ variantId: id.variant, productId: id.product, sku: 'AO-M', size: 'M', color: 'White', priceVnd: 220000, stockQuantity: 5, status: 'ACTIVE' }],
    };
    const calls = []; const consoleErrors = [];
    page.on('pageerror', error => consoleErrors.push(error.message));
    await page.setRequestInterception(true);
    await page.on('request', async request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/v1/')) {
        const resource = url.pathname.slice('/api/v1/'.length);
        calls.push({ resource, method: request.method(), token: request.headers().authorization, body: request.postData() });
        if (resource === 'users/me') return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'Success', result: user }) });
        if (request.method() === 'POST') {
          const payload = JSON.parse(request.postData());
          const keys = { products: 'productId', 'product-variants': 'variantId', vouchers: 'voucherId' };
          const created = { ...payload, [keys[resource] || 'id']: randomUUID() };
          (database[resource] ||= []).push(created);
          return request.respond({ status: 201, contentType: 'application/json', body: JSON.stringify({ code: 201, message: 'Created successfully', result: created }) });
        }
        return request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 200, message: 'Success', result: database[resource] || [] }) });
      }
      if (url.origin !== origin) return request.abort();
      return request.continue();
    });
    stage = 'anonymous route';
    await page.goto(`${origin}/merchant/products`);
    await page.waitForFunction(() => document.body.innerText.includes('Đăng nhập để tiếp tục'));
    assert.equal(calls.length, 0);
    await page.evaluate(({ user }) => {
      sessionStorage.setItem('scanms-access-token', 'verified-test-session');
      sessionStorage.setItem('scanms-user', JSON.stringify({ ...user, id: user.userId, role: 'SHOP_MANAGER' }));
    }, { user });

    async function open(path, expected) {
      await page.goto(`${origin}${path}`);
      await page.waitForFunction(text => document.body.innerText.includes(text) && !document.body.innerText.includes('Đang tải dữ liệu…'), {}, expected);
    }
    async function click(text) {
      await page.waitForFunction(text => [...document.querySelectorAll('button')].some(button => !button.disabled && button.textContent.trim() === text), {}, text);
      await page.evaluate(text => {
        const button = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === text);
        if (!button) throw new Error(`Missing button: ${text}`);
        button.click();
      }, text);
    }
    async function fill(label, value) {
      await page.evaluate(({ label, value }) => {
        const root = [...document.querySelectorAll('form label')].find(node => node.querySelector('span')?.textContent.replace(' *', '') === label);
        const input = root?.querySelector('input,select,textarea');
        if (!input) throw new Error(`Missing field: ${label}`);
        const prototype = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
        input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
      }, { label, value });
    }
    stage = 'load owner catalog';
    await open('/merchant/products', 'Áo thật');
    assert.equal(await page.evaluate(() => document.body.innerText.includes('Sản phẩm shop khác')), false);
    stage = 'create product';
    await click('Thêm mới');
    await fill('Tên', 'Áo mới'); await fill('Giá (VND)', '450000');
    await click('Lưu');
    await page.waitForFunction(() => document.body.innerText.includes('Đã lưu vào hệ thống.'));
    const product = JSON.parse(calls.find(call => call.resource === 'products' && call.method === 'POST').body);
    assert.equal(product.storeId, id.store); assert.equal(product.name, 'Áo mới'); assert.equal(product.priceVnd, 450000);
    assert.equal(product.status, 'ACTIVE'); assert.equal('sizesStock' in product, false); assert.equal('imageRefs' in product, false); assert.equal('title' in product, false);

    stage = 'create variant';
    await click('Biến thể & tồn kho');
    await page.waitForFunction(() => document.body.innerText.includes('AO-M'));
    await click('Thêm mới'); await fill('Sản phẩm', id.product); await fill('SKU', 'AO-L');
    await fill('Size', 'L'); await fill('Màu', 'Black'); await fill('Giá (VND)', '230000'); await fill('Tồn kho', '7');
    await click('Lưu'); await page.waitForFunction(() => document.body.innerText.includes('AO-L'));
    const variant = JSON.parse(calls.find(call => call.resource === 'product-variants' && call.method === 'POST').body);
    assert.equal(variant.productId, id.product); assert.equal(variant.stockQuantity, 7); assert.equal(variant.priceVnd, 230000);

    stage = 'create voucher';
    await open('/merchant/vouchers', 'Voucher & lượt sử dụng');
    await page.waitForSelector('button'); await click('Thêm mới');
    await fill('Mã voucher', 'STORE50'); await fill('Mức giảm', '50000'); await fill('Giá trị tối thiểu (VND)', '500000');
    await fill('Hiệu lực từ', '2026-10-01T08:00'); await fill('Hiệu lực đến', '2026-12-31T23:59');
    await click('Lưu'); await page.waitForFunction(() => document.body.innerText.includes('STORE50'));
    const voucher = JSON.parse(calls.find(call => call.resource === 'vouchers' && call.method === 'POST').body);
    assert.equal(voucher.issuerType, 'STORE'); assert.equal(voucher.scopeType, 'STORE'); assert.equal(voucher.discountType, 'FIXED');
    assert.equal(voucher.storeId, id.store); assert.equal(voucher.productId, null); assert.equal(voucher.livestreamId, null);

    stage = 'mobile catalog';
    await page.setViewport({ width: 390, height: 844 });
    await open('/merchant/products', 'Áo thật');
    if (process.env.SCANMS_SCREENSHOT) await page.screenshot({ path: process.env.SCANMS_SCREENSHOT, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.setViewport({ width: 1440, height: 1000 });

    stage = 'catalog detail';
    await open(`/products/${id.product}`, 'Chọn biến thể');
    const options = await page.$$eval('select option', nodes => nodes.map(node => node.value));
    assert(options.includes(id.variant)); assert.equal(options.some(value => value.includes('-var-')), false);
    assert.equal(await page.$eval('button', button => button.disabled), true);
    assert.equal(calls.some(call => call.resource.includes('checkout') || call.resource === 'orders' && call.method === 'POST'), false);
    if (process.env.SCANMS_SCREENSHOT) await page.screenshot({ path: process.env.SCANMS_SCREENSHOT, fullPage: true });

    stage = 'role denied';
    user = { ...user, roles: ['USER'] };
    await open('/merchant/products', 'không có quyền');
    assert.equal(await page.evaluate(() => !!document.querySelector('form')), false);
    assert(calls.every(call => call.token === 'Bearer verified-test-session'));
    assert.equal(calls.some(call => /auth\/|coupons|public\/|my-store|wallets\/me/.test(call.resource)), false);
    assert.deepEqual(consoleErrors, []);
  } catch (failure) {
    console.error('Browser check failed at:', stage);
    if (page) {
      console.error((await page.evaluate(() => document.body.innerText)).slice(0, 1500));
      console.error(await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth,
        roots: [...document.querySelectorAll('html,body,#root,#root > *')].map(node => ({ tag: node.tagName, class: node.className, width: node.getBoundingClientRect().width, scroll: node.scrollWidth, display: getComputedStyle(node).display, overflow: getComputedStyle(node).overflow, padding: getComputedStyle(node).padding })),
        fixed: [...document.querySelectorAll('body *')].filter(node => getComputedStyle(node).position === 'fixed').map(node => ({ tag: node.tagName, class: node.className, style: node.getAttribute('style'), rect: node.getBoundingClientRect().toJSON(), width: getComputedStyle(node).width })),
        overflow: [...document.querySelectorAll('body *')].filter(node => node.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 8).map(node => ({ tag: node.tagName, class: node.className, width: node.getBoundingClientRect().width })) })));
    }
    throw failure;
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
});
