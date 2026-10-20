import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const shop = '00000000-0000-4000-8000-000000000001';
test('shop status uses actual presence, handles unknown/offline and never restores the system badge', {
  skip: !base || !existsSync(executablePath), timeout: 30000,
}, async () => {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    await page.setViewport({ width: 1280, height: 900 });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    const checkedAt = new Date().toISOString();
    let presence = { isOnline: true, lastActiveAt: checkedAt, checkedAt };
    const pulses = [];
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': new URL(base).origin,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let data = [];
        if (url.pathname.endsWith('/presence')) {
          if (request.method() === 'POST') pulses.push(request.headers().authorization);
          data = request.method() === 'POST' ? { recorded: true } : presence;
        } else if (url.pathname === `/api/stores/public/id/${shop}`) {
          data = { id: shop, name: 'Herbal Spa', isVerified: true, isActive: true, productCount: 0, followerCount: 0, categories: [] };
        } else if (url.pathname === '/api/auth/me') data = { id: 'owner-a', fullName: 'Owner A', role: 'SHOP_MANAGER' };
        else if (url.pathname === '/api/customer/cart') data = { items: [], syncedAt: checkedAt };
        else if (url.pathname === '/api/public/products') data = { items: [], pagination: { page: 1, totalPages: 1, total: 0 } };
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== new URL(base).origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    const text = () => page.$eval('[data-store-presence]', el => el.textContent.trim());
    await page.goto(`${base}/shops/${shop}`);
    await page.waitForSelector('[data-store-presence="online"]').catch(async error => {
      throw new Error(`${error.message}; ${JSON.stringify(errors)}; ${await page.$eval('body', el => el.textContent.slice(-3000))}`);
    });
    assert.equal(await text(), 'Đang trực tuyến');
    assert.equal(pulses.length, 0, 'a buyer viewing a shop cannot make that shop online');
    await page.screenshot({ path: join(tmpdir(), 'scanms-shop-activity-online.png') });
    for (const [minutes, expected] of [[17, 'Hoạt động 17 phút trước'], [120, 'Hoạt động 2 giờ trước'], [2880, 'Hoạt động 2 ngày trước']]) {
      presence = { isOnline: false, lastActiveAt: new Date(Date.parse(checkedAt) - minutes * 60000).toISOString(), checkedAt };
      await page.reload();
      await page.waitForFunction(expected => document.querySelector('[data-store-presence]')?.textContent.trim() === expected, {}, expected);
      assert.equal(await page.$('[data-store-presence] > span[aria-hidden="true"]'), null);
    }
    presence = { isOnline: false, lastActiveAt: null, checkedAt };
    await page.reload();
    await page.waitForFunction(() => document.querySelector('[data-store-presence]')?.textContent.includes('Chưa có thông tin hoạt động'));
    const heartbeatSent = page.waitForResponse(response => response.url().endsWith('/stores/my-store/presence') && response.request().method() === 'POST');
    await page.evaluate(() => {
      localStorage.setItem('token', 'qa-owner-a');
      localStorage.setItem('user', JSON.stringify({ id: 'owner-a', role: 'SHOP_MANAGER', fullName: 'Owner A' }));
      window.dispatchEvent(new Event('auth-user-updated'));
    });
    await heartbeatSent;
    assert.deepEqual([...new Set(pulses)], ['Bearer qa-owner-a']);
    await page.goto(`${base}/customer/vouchers`);
    await page.waitForSelector('.scanms-site-header');
    assert.doesNotMatch(await page.$eval('.scanms-site-header', el => el.textContent), /Hệ thống trực tuyến/);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
