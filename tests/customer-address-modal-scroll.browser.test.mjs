import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

test('address dialog scrolls to the complete map and keeps save actions visible on short screens', {
  skip: !base || !existsSync(executablePath), timeout: 30000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(6000);
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'qa-address-no-server-access');
      localStorage.setItem('user', JSON.stringify({ id: 'qa-customer', fullName: 'Khách kiểm thử', role: 'CUSTOMER' }));
      localStorage.setItem('scanms_analytics_consent', 'denied');
    });
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      const respond = data => request.respond({ status: 200, contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' }, body: JSON.stringify(data) });
      if (url.pathname === '/src/services/chat-socket.service.ts') return request.respond({ status: 200, contentType: 'application/javascript', body: 'const s={connected:false,active:false,on(){return this},off(){return this},emit(){},connect(){return this}};export const getChatSocket=()=>s;export const isChatSocketAuthenticated=()=>false;export const disconnectChatSocket=()=>{};' });
      if (url.hostname === 'provinces.open-api.vn') return respond([{ code: 79, name: 'Thành phố Hồ Chí Minh', districts: [{ code: 769, name: 'Thành phố Thủ Đức', wards: [{ code: 1, name: 'Phường Phước Long B' }] }] }]);
      if (url.pathname.startsWith('/api/') || url.port === '3000') {
        if (!['GET', 'OPTIONS'].includes(request.method())) writes.push(url.pathname);
        const user = { id: 'qa-customer', fullName: 'Khách kiểm thử', role: 'CUSTOMER' };
        let data = [];
        if (url.pathname === '/api/auth/me') data = user;
        if (url.pathname === '/api/customer/profile') data = { user, stats: {} };
        if (url.pathname === '/api/customer/orders') data = { orders: [], total: 0 };
        if (url.pathname === '/api/customer/cart') data = { items: [] };
        if (url.pathname === '/api/customer/addresses') data = [{ id: 'qa-address', fullName: 'Khách kiểm thử', phoneNumber: '0900000000', provinceCode: '79', provinceName: 'Thành phố Hồ Chí Minh', districtCode: '769', districtName: 'Thành phố Thủ Đức', wardCode: '1', wardName: 'Phường Phước Long B', detailAddress: 'Địa chỉ kiểm thử', latitude: 10.8231, longitude: 106.6297, isDefault: true }];
        if (url.pathname.includes('/notifications/unread')) data = { unreadCount: 0, categoryUnreadCounts: {} };
        if (url.pathname === '/api/notifications') data = { notifications: [], total: 0 };
        return respond({ success: true, data });
      }
      if (url.hostname.includes('tile.openstreetmap')) return request.respond({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64') });
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    });
    await page.setViewport({ width: 1440, height: 670 });
    await page.goto(`${origin}/customer/profile?sub=addresses`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.customer-address-edit').catch(async error => { throw new Error(`${error.message}: ${JSON.stringify(errors)} ${await page.$eval('body', el => el.innerText.slice(-1800))}`); });
    await page.click('.customer-address-edit');
    const dialog = '[role="dialog"][aria-labelledby="customer-address-modal-title"]';
    await page.waitForSelector(`${dialog} .leaflet-container`);
    for (const viewport of [{ width: 1440, height: 670 }, { width: 390, height: 620 }, { width: 844, height: 390 }]) {
      await page.setViewport(viewport);
      await page.waitForFunction((selector, height) => {
        const save = document.querySelector(selector)?.querySelector('button[type=submit]')?.getBoundingClientRect();
        return innerHeight === height && save && save.top >= 0 && save.bottom <= height;
      }, {}, dialog, viewport.height);
      const initial = await page.$eval(dialog, el => {
        const map = el.querySelector('.address-location-map').getBoundingClientRect();
        const container = el.querySelector('.address-location-picker').getBoundingClientRect();
        const footer = el.querySelector('.address-location-status').getBoundingClientRect();
        const save = el.querySelector('button[type=submit]').getBoundingClientRect();
        return { mapHeight: map.height, clipped: footer.bottom > container.bottom + 1, saveTop: save.top, saveBottom: save.bottom };
      });
      assert.ok(initial.mapHeight >= 224 && !initial.clipped, `map must keep its full height: ${JSON.stringify(initial)}`);
      assert.ok(initial.saveTop >= 0 && initial.saveBottom <= viewport.height, JSON.stringify({ viewport, initial }));
      const scrolling = await page.$eval(dialog, el => {
        const target = el.querySelector('#address-detail-input');
        let scroller = target.parentElement;
        while (scroller && scroller !== el && getComputedStyle(scroller).overflowY !== 'auto') scroller = scroller.parentElement;
        if (!scroller || scroller === el) throw new Error('No scrolling form body');
        scroller.scrollTop = scroller.scrollHeight;
        const r = scroller.getBoundingClientRect();
        const bottom = el.querySelector('#chk-default-address').getBoundingClientRect();
        const mapFooter = el.querySelector('.address-location-status').getBoundingClientRect();
        return { scrollTop: scroller.scrollTop, bottomVisible: bottom.bottom <= r.bottom + 1 && bottom.top >= r.top, mapFooterVisible: mapFooter.bottom <= r.bottom + 1 && mapFooter.top >= r.top };
      });
      assert.ok(scrolling.scrollTop > 0 && scrolling.bottomVisible && scrolling.mapFooterVisible, JSON.stringify(scrolling));
      await page.screenshot({ path: join(tmpdir(), `scanms-address-scroll-${viewport.width}.png`) });
    }
    assert.deepEqual(writes, []);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
