import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('notification cards fit all screens and preserve filtering, read actions, counts and destinations', {
  skip: !base || !existsSync(executablePath), timeout: 30000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    await page.setViewport({ width: 1440, height: 1000 });
    const errors = [], mutations = [];
    page.on('pageerror', error => errors.push(error.message));
    const notifications = [
      { id: 'welcome', type: 'WELCOME', title: 'Chào mừng bạn đến với Sàn SCANMS', message: 'Khám phá sản phẩm từ các gian hàng đối tác và theo dõi đơn mua của bạn ngay trên SCANMS.', isRead: false, data: {} },
      { id: 'promotion', type: 'VOUCHER_RECEIVED', title: 'Bạn nhận được ưu đãi giảm 15% cho đơn mua tiếp theo', message: 'Khám phá kho voucher để xem điều kiện áp dụng và chọn ưu đãi phù hợp trước khi thanh toán.', isRead: false, data: { voucherCode: 'SCANMS15' } },
      { id: 'order', type: 'ORDER_SHIPPED', title: 'Đơn mua từ Herbal Spa đang trên đường giao đến bạn', message: 'Kiện hàng đã được bàn giao cho đơn vị vận chuyển. Bạn có thể theo dõi hành trình trong chi tiết đơn mua.', isRead: false, data: { orderSn: 'SCANMS-181026-0001', trackingNumber: 'GHN-TRACKING-123456789012345678901234567890' } },
      { id: 'read', type: 'SYSTEM', title: 'Thông tin tài khoản đã được cập nhật', message: 'Bạn có thể kiểm tra thông tin mới nhất trong hồ sơ cá nhân.', isRead: true, data: {} },
    ].map(item => ({ ...item, userId: 'qa-customer', createdAt: '2026-10-18T04:30:00.000Z' }));
    const categoryOf = type => type.startsWith('ORDER_') ? 'ORDER' : type.startsWith('VOUCHER_') ? 'PROMOTION' : 'SYSTEM';
    const unreadDetails = () => ({
      unreadCount: notifications.filter(item => !item.isRead).length,
      categoryUnreadCounts: Object.fromEntries(['ORDER', 'PROMOTION', 'SYSTEM'].map(category => [category, notifications.filter(item => !item.isRead && categoryOf(item.type) === category).length])),
    });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'qa-notifications');
      localStorage.setItem('user', JSON.stringify({ id: 'qa-customer', fullName: 'Khách kiểm thử', role: 'CUSTOMER' }));
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: `
        const socket={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};
        export const getChatSocket=()=>socket; export const isChatSocketAuthenticated=()=>false; export const disconnectChatSocket=()=>{};
      ` });
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type',
          'Access-Control-Allow-Methods': 'GET,PATCH,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let data = [];
        const user = { id: 'qa-customer', fullName: 'Khách kiểm thử', role: 'CUSTOMER' };
        if (url.pathname === '/api/auth/me') data = user;
        if (url.pathname === '/api/customer/profile') data = { user, stats: {} };
        if (url.pathname === '/api/customer/cart') data = { items: [] };
        if (url.pathname === '/api/customer/orders') data = { orders: [], total: 0 };
        if (request.method() === 'PATCH') {
          mutations.push(url.pathname);
          if (url.pathname === '/api/notifications/read-all') notifications.forEach(item => { item.isRead = true; });
          else {
            const id = url.pathname.match(/^\/api\/notifications\/([^/]+)\/read$/)?.[1];
            assert.ok(id && notifications.some(item => item.id === id), 'only mocked notification mutations are allowed');
            notifications.find(item => item.id === id).isRead = true;
          }
          data = { success: true };
        }
        if (url.pathname === '/api/notifications') {
          const category = url.searchParams.get('category') || 'ALL';
          const items = notifications.filter(item => category === 'ALL' || categoryOf(item.type) === category);
          data = { items, total: items.length, page: 1, limit: 40, totalPages: 1, ...unreadDetails() };
        }
        if (url.pathname === '/api/notifications/unread-count') data = unreadDetails();
        return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.goto(`${base}/customer/notifications`);
    await page.waitForSelector('.customer-notification-card');
    assert.equal(await page.$$eval('.customer-notification-card', els => els.length), 4);
    assert.deepEqual(await page.$eval('.customer-notification-time', el => [...el.querySelectorAll('span')].map(span => span.textContent)), ['11:30', '·', '18/10/2026']);
    assert.equal(await page.$$eval('.customer-notification-unread', els => els.length), 3);
    assert.equal(await page.$$eval('.customer-notification-read', els => els.length), 1);
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.$$eval('.customer-notification-card', els => els.every(el => el.scrollWidth <= el.clientWidth + 1)), `notification content fits at ${width}px`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `page fits at ${width}px`);
      if (width === 1440 || width === 390) await (await page.$('.customer-notification-list')).screenshot({ path: join(tmpdir(), `scanms-notification-cards-${width}.png`) });
    }
    await page.setViewport({ width: 1440, height: 1000 });
    const first = '[data-notification-id="welcome"]';
    await page.$eval(`${first} .customer-notification-mark`, el => el.focus());
    await page.keyboard.press('Enter');
    await page.waitForSelector(`${first}[data-read="true"]`);
    assert.equal(new URL(page.url()).pathname, '/customer/notifications', 'marking as read does not navigate');
    assert.equal(await page.$(`${first} .customer-notification-mark`), null);
    await page.click('nav[aria-label="Lọc thông báo"] button:nth-child(3)');
    await page.waitForFunction(() => document.querySelectorAll('.customer-notification-card').length === 1);
    assert.equal(await page.$eval('.customer-notification-card', el => el.dataset.notificationId), 'promotion');
    await page.click('.customer-notification-open');
    await page.waitForFunction(() => location.pathname === '/customer/vouchers');
    await page.click('nav[aria-label="Menu chức năng"] a[href="/customer/notifications"]');
    await page.waitForSelector('.customer-notification-card');
    await page.$eval('nav[aria-label="Lọc thông báo"]', nav => nav.parentElement.querySelector(':scope > button').click());
    await page.waitForFunction(() => [...document.querySelectorAll('.customer-notification-card')].every(el => el.dataset.read === 'true'));
    assert.equal(await page.$('nav[aria-label="Lọc thông báo"] + button'), null, 'read-all disappears when unread count reaches zero');
    await page.click('[data-notification-id="welcome"] h3 button');
    assert.equal(new URL(page.url()).pathname, '/customer/notifications');
    await page.click('[data-notification-id="order"] .customer-notification-open');
    await page.waitForFunction(() => location.pathname === '/customer/orders');
    assert.ok(mutations.includes('/api/notifications/welcome/read'));
    assert.ok(mutations.includes('/api/notifications/promotion/read'));
    assert.ok(mutations.includes('/api/notifications/read-all'));
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
