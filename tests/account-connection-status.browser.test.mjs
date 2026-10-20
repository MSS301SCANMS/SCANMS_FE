import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('header shows authenticated account connectivity and resets it on account changes', {
  skip: !base || !existsSync(executablePath), timeout: 30000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    await page.setViewport({ width: 1440, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'qa-a');
      localStorage.setItem('user', JSON.stringify({ id: 'a', role: 'CUSTOMER', fullName: 'Tuấn Đỉnh' }));
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: `
        window.qaSockets ||= new Map();
        export function getChatSocket() {
          const token = localStorage.getItem('token');
          if (!window.qaSockets.has(token)) {
            const handlers = new Map();
            const socket = { connected: false, active: true, userId: null,
              on(event, fn) { if(!handlers.has(event))handlers.set(event,new Set()); handlers.get(event).add(fn); return this; },
              off(event, fn) { handlers.get(event)?.delete(fn); return this; },
              receive(event, data) { for(const fn of handlers.get(event)||[])fn(data); },
              emit() {}, connect() { this.active=true; return this; },
              disconnect() { this.connected=false; this.active=false; this.receive('disconnect'); },
            };
            window.qaSockets.set(token, socket);
          }
          return window.qaSockets.get(token);
        }
        export const isChatSocketAuthenticated=(socket,id)=>socket.connected&&socket.userId===id;
        export const disconnectChatSocket=()=>getChatSocket().disconnect();
      ` });
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization',
          'Access-Control-Allow-Methods': 'GET,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        const id = request.headers().authorization?.replace('Bearer qa-', '') || 'a';
        const user = { id, role: 'CUSTOMER', fullName: 'Tuấn Đỉnh' };
        let data = [];
        if (url.pathname === '/api/auth/me') data = user;
        if (url.pathname === '/api/customer/profile') data = { user, stats: {} };
        if (url.pathname === '/api/customer/cart') data = { items: [] };
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    const status = expected => page.waitForSelector(`[data-account-connection="${expected}"]`, { visible: true });
    const connect = userId => page.evaluate(userId => {
      const socket = window.qaSockets.get(`qa-${userId}`);
      socket.connected = true;
      socket.userId = userId;
      socket.receive('connected', { userId });
    }, userId);
    await page.goto(`${base}/customer/vouchers`);
    await status('connecting');
    await connect('a');
    await status('online');
    assert.equal(await page.$eval('[data-account-connection]', el => el.textContent.trim()), 'Đang trực tuyến');
    await (await page.$('.scanms-site-header')).screenshot({ path: join(tmpdir(), 'scanms-account-status-header.png') });
    await page.evaluate(() => window.qaSockets.get('qa-a').disconnect());
    await status('offline');
    await page.setOfflineMode(true);
    await status('offline');
    await page.setOfflineMode(false);
    await status('connecting');
    await connect('a');
    await status('online');
    await page.evaluate(() => {
      localStorage.setItem('token', 'qa-b');
      localStorage.setItem('user', JSON.stringify({ id: 'b', role: 'CUSTOMER', fullName: 'Customer B' }));
      window.dispatchEvent(new Event('auth-user-updated'));
    });
    await status('connecting');
    await page.evaluate(() => window.qaSockets.get('qa-a').receive('connected', { userId: 'a' }));
    await status('connecting');
    await connect('b');
    await status('online');
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-user-updated'));
    });
    await page.waitForSelector('[data-account-connection]', { hidden: true });
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
