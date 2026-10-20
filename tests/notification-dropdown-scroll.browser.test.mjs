import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('notification popover fits the viewport and scrolls to the final item while controls stay visible', {
  skip: !base || !existsSync(executablePath), timeout: 40000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    const user = { id: 'qa-notification-popover', role: 'CUSTOMER', fullName: 'Khách kiểm thử' };
    const notifications = Array.from({ length: 20 }, (_, i) => ({
      id: `notice-${i}`, userId: user.id, title: i === 0 ? 'Đơn hàng đã được tạo và đang chờ gian hàng xác nhận thông tin giao hàng của bạn' : i === 19 ? 'Thông báo cuối danh sách' : `Cập nhật đơn hàng số ${i + 1}`,
      message: `Đơn hàng DH-2026-${i} tại gian hàng đối tác đã được ghi nhận. Bạn có thể theo dõi tiến độ xử lý và thông tin vận chuyển trong danh sách đơn mua trên SCANMS.`,
      type: i % 3 === 0 ? 'ORDER_CREATED' : i % 3 === 1 ? 'VOUCHER_RECEIVED' : 'SYSTEM',
      isRead: false, createdAt: new Date(Date.now() - i * 60000).toISOString(), data: { orderId: `order-${i}` },
    }));
    const categoryOf = item => item.type.startsWith('ORDER_') ? 'ORDER' : item.type.startsWith('VOUCHER_') ? 'PROMOTION' : 'SYSTEM';
    const unread = () => notifications.filter(item => !item.isRead).length;
    const errors = [], mutations = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(user => {
      localStorage.setItem('token', 'qa-notifications-only'); localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('scanms_chat_sound', 'off');
    }, user);
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'content-type,authorization', 'Access-Control-Allow-Methods': 'GET,PATCH,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let data = [];
        if (url.pathname === '/api/auth/me') data = user;
        if (url.pathname === '/api/customer/profile') data = { user, stats: {} };
        if (url.pathname === '/api/notifications/unread-count') data = { unreadCount: unread(), categoryUnreadCounts: {} };
        if (url.pathname === '/api/notifications') {
          const category = url.searchParams.get('category') || 'ALL';
          const items = notifications.filter(item => category === 'ALL' || categoryOf(item) === category);
          data = { items, total: items.length, page: 1, limit: 20, totalPages: 1, unreadCount: unread() };
        }
        if (request.method() === 'PATCH') {
          assert.ok(url.pathname.startsWith('/api/notifications/'));
          mutations.push(url.pathname);
          if (url.pathname.endsWith('/read-all')) notifications.forEach(item => { item.isRead = true; });
          else notifications.find(item => url.pathname.includes(`/${item.id}/`)).isRead = true;
          data = { success: true };
        }
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    const bell = 'button[aria-controls="scanms-notification-panel"]';
    const panel = '#scanms-notification-panel';
    const list = '.scanms-notifications-list';
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${base}/customer/orders`);
    await page.waitForSelector(bell);
    for (const [width, height] of [[1440, 900], [1024, 600], [390, 640], [320, 480], [800, 320]]) {
      await page.setViewport({ width, height });
      await page.click(bell);
      await page.waitForSelector(`${panel} [data-notification-id="notice-19"]`).catch(async error => { throw new Error(`${width}x${height}: ${error.message}; ${errors.join('; ')}; ${await page.$eval('body', el => el.innerText.slice(-1600))}`); });
      const geometry = await page.$eval(panel, el => {
        const rect = el.getBoundingClientRect(), list = el.querySelector('.scanms-notifications-list');
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height, listHeight: list.clientHeight, listScrollHeight: list.scrollHeight, overflow: getComputedStyle(list).overflowY };
      });
      assert.ok(geometry.top >= 0 && geometry.bottom <= height - 8 && geometry.left >= 8 && geometry.right <= width - 8, JSON.stringify({ width, height, geometry }));
      assert.ok(geometry.height <= 480 && geometry.listHeight > 20 && geometry.listScrollHeight > geometry.listHeight && geometry.overflow === 'auto');
      const bounds = await page.$eval(list, el => { const rect = el.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; });
      await page.mouse.move(bounds.x, bounds.y);
      await page.mouse.wheel({ deltaY: 5000 });
      await page.waitForFunction(selector => { const el = document.querySelector(selector); return el.scrollTop > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 2; }, {}, list);
      const final = await page.$eval(panel, el => {
        const header = el.querySelector('header').getBoundingClientRect(), footer = el.querySelector('footer').getBoundingClientRect(), last = el.querySelector('[data-notification-id="notice-19"]').getBoundingClientRect(), rect = el.getBoundingClientRect();
        return { headerVisible: header.top >= rect.top, footerVisible: footer.bottom <= rect.bottom, lastVisible: last.bottom <= footer.top + 1 };
      });
      assert.ok(final.headerVisible && final.footerVisible && final.lastVisible, JSON.stringify(final));
      await page.$eval(list, el => { el.scrollTop = 0; el.focus(); });
      await page.keyboard.press('PageDown');
      await page.waitForFunction(selector => document.querySelector(selector).scrollTop > 0, {}, list);
      if (width === 1440 || width === 390) await (await page.$(panel)).screenshot({ path: join(tmpdir(), `scanms-notification-popover-${width}.png`) });
      await page.keyboard.press('Escape');
      assert.equal(await page.$(panel), null);
      assert.equal(await page.$eval(bell, el => document.activeElement === el), true);
    }
    await page.setViewport({ width: 1440, height: 900 });
    await page.click(bell);
    await page.waitForSelector(`${panel} .scanms-notification-item`);
    const first = `${panel} [data-notification-id="notice-0"]`;
    const collapsedHeight = await page.$eval(first, el => el.clientHeight);
    await page.click(`${first} .scanms-notification-expand`);
    assert.ok(await page.$eval(first, el => el.clientHeight) > collapsedHeight);
    await page.click(`${first} .scanms-notification-expand`);
    await page.click(`${panel} [aria-label="Loại thông báo"] button:nth-child(2)`);
    await page.waitForFunction(selector => [...document.querySelectorAll(`${selector} .scanms-notification-item`)].every(el => Number(el.dataset.notificationId.split('-')[1]) % 3 === 0), {}, panel);
    await page.click(`${panel} [data-notification-id="notice-0"] .scanms-notification-open`);
    await page.waitForFunction(() => location.search.includes('orderId=order-0'));
    assert.ok(mutations.includes('/api/notifications/notice-0/read'));
    await page.click(bell);
    await page.waitForSelector(`${panel} .scanms-notification-item`);
    await page.$$eval(`${panel} header button`, buttons => buttons.find(button => button.textContent.includes('Đọc tất cả')).click());
    await page.waitForFunction(selector => document.querySelector(selector).getAttribute('aria-label') === 'Thông báo: 0 chưa đọc', {}, bell);
    await page.click(`${panel} footer button`);
    await page.waitForFunction(() => location.pathname === '/customer/notifications');
    assert.equal(await page.$(panel), null);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
