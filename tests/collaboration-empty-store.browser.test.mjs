import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('collaboration tolerates no selected store during loading, empty results and refresh', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  const storeId = '00000000-0000-4000-8000-000000000010';
  let mode = 'empty';
  const productReads = [], errors = [];
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'qa-collaboration');
      localStorage.setItem('user', JSON.stringify({ id: 'qa-kol', fullName: 'QA KOL', role: 'COLLABORATOR' }));
    });
    page.on('pageerror', error => { if (!error.message.includes('WebSocket closed')) errors.push(error.message); });
    page.on('console', message => { if (message.type() === 'error' && message.text().includes("Cannot read properties of null")) errors.push(message.text()); });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let data = [];
        if (url.pathname === '/api/auth/me') data = { id: 'qa-kol', fullName: 'QA KOL', role: 'COLLABORATOR' };
        if (url.pathname === '/api/kyc/profile') data = { kycStatus: 'VERIFIED' };
        if (url.pathname === '/api/store-collaborators/my-invitations') data = [{ id: 'qa-cooperation', storeId, status: 'APPROVED' }];
        if (url.pathname === '/api/notifications/unread-count') data = { unreadCount: 0 };
        if (url.pathname === '/api/notifications') data = { items: [], total: 0 };
        if (url.pathname === '/api/products') {
          productReads.push(url.searchParams.get('storeId'));
          data = { items: Array.from({ length: 24 }, (_, index) => ({ id: `qa-product-${index}`, storeId, title: `Sản phẩm kiểm thử ${index + 1}`, sku: `QA-${index}`, price: 250000, stockQuantity: 10, sampleEnabled: false, variants: [] })), pagination: { total: 24 } };
        }
        if (url.pathname === '/api/stores/marketplace') {
          data = mode === 'loaded' ? [{ id: storeId, name: 'Shop kiểm thử' }] : [];
          const status = mode === 'failed' ? 503 : 200;
          setTimeout(() => void request.respond({ status, headers, body: JSON.stringify({ success: status === 200, data }) }), 400);
          return;
        }
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    for (const tab of ['messages', 'products', 'samples', 'media']) {
      await page.goto(`${origin}/collaborator/collaboration?tab=${tab}`);
      await page.waitForFunction(() => document.body.textContent.includes('Chưa có cuộc trò chuyện nào'), { timeout: 2500 });
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    }
    assert.deepEqual(productReads, [], 'no store-specific calls are made without a selected store');
    assert.deepEqual(errors, []);
    mode = 'loaded';
    await page.goto(`${origin}/collaborator/collaboration?shop=${storeId}&tab=products`);
    await page.waitForFunction(() => document.body.textContent.includes('Sản phẩm kiểm thử'));
    assert.ok(productReads.length > 0 && productReads.every(id => id === storeId));
    await page.waitForSelector('.collaboration-context-bar[data-compact=false]');
    const expanded = await page.$eval('.collaboration-context-bar', el => ({ height: el.getBoundingClientRect().height, top: el.getBoundingClientRect().top }));
    await page.screenshot({ path: join(tmpdir(), 'scanms-collaboration-expanded.png') });
    await page.$eval('.collaboration-tab-scroll', el => { el.scrollTop = 350; });
    await page.waitForSelector('.collaboration-context-bar[data-compact=true]');
    await page.waitForFunction(height => document.querySelector('.collaboration-context-bar').getBoundingClientRect().height < height - 15, {}, expanded.height);
    const compact = await page.$eval('.collaboration-context-bar', el => ({ height: el.getBoundingClientRect().height, top: el.getBoundingClientRect().top }));
    assert.ok(Math.abs(compact.top - expanded.top) < 2, 'context stays pinned while product content scrolls');
    await page.screenshot({ path: join(tmpdir(), 'scanms-collaboration-compact.png') });
    await page.$eval('.collaboration-tab-scroll', el => { el.scrollTop = 0; });
    await page.waitForSelector('.collaboration-context-bar[data-compact=false]');
    await page.setViewport({ width: 390, height: 844 });
    await page.$eval('.collaboration-tab-scroll', el => { el.scrollTop = 350; });
    await page.waitForSelector('.collaboration-context-bar[data-compact=true]');
    assert.ok(await page.$eval('.collaboration-context-bar', el => el.scrollWidth <= el.clientWidth + 1));
    await (await page.$('.collaboration-context-bar')).screenshot({ path: join(tmpdir(), 'scanms-collaboration-compact-mobile.png') });
    await page.click('#subtab-media');
    await page.waitForSelector('.collaboration-context-bar[data-compact=false]');
    mode = 'failed';
    await page.goto(`${origin}/collaborator/collaboration?tab=products`);
    await page.waitForFunction(() => document.body.textContent.includes('Chưa có cuộc trò chuyện nào'));
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
