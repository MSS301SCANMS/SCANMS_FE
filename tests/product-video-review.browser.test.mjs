import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
test('video moderation ignores local demo data, scopes server videos to current products and keeps media previews bounded', {
  skip: !base || !existsSync(executablePath), timeout: 45000,
}, async () => {
  const origin = new URL(base).origin;
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    const errors = [], writes = [], mediaReads = [], sampleRequests = [];
    let mode = 'no-products', failApprove = true;
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-video-review-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'fixture-owner', role: 'SHOP_MANAGER', fullName: 'Chủ shop kiểm thử', stores: [{ id: 'fixture-store' }] }));
      localStorage.setItem('current_store_id', 'fixture-store');
      localStorage.setItem('scanms-active-workspace', 'shop'); localStorage.setItem('scanms-current-role', 'shop');
      localStorage.setItem('scanms_kol_video_submissions', JSON.stringify([
        { id: 'fake-serum', productId: 'SR-VTC-15', productName: 'Serum mẫu không tồn tại', title: 'Video mẫu không tồn tại', status: 'PENDING', videoUrl: '/sample-video.mp4', image: '/sample-serum.png' },
      ]));
    });
    const product = { productId: 'real-product', storeId: 'fixture-store', name: 'Sản phẩm thật kiểm thử', sku: 'REAL-001', priceVnd: 100000, status: 'APPROVED', imageRefs: [], sizesStock: {} };
    const videos = [
      { id: 'video-a', productId: 'real-product', storeId: 'fixture-store', assetType: 'VIDEO', title: 'Video đánh giá kiểm thử A', urlOrContent: `${origin}/fixture-video.mp4`, posterUrl: `${origin}/fixture-poster.svg`, status: 'PENDING', collaborator: { fullName: 'Nhà sáng tạo A' } },
      { id: 'video-b', productId: 'real-product', storeId: 'fixture-store', assetType: 'VIDEO', title: 'Video đánh giá kiểm thử B', urlOrContent: `${origin}/fixture-video.mp4`, posterUrl: `${origin}/fixture-poster.svg`, status: 'PENDING', collaborator: { fullName: 'Nhà sáng tạo B' } },
      { id: 'removed-product', productId: 'deleted-product', assetType: 'VIDEO', title: 'Sản phẩm đã xóa không được hiện', urlOrContent: `${origin}/fixture-video.mp4`, status: 'PENDING' },
      { id: 'foreign-shop', productId: 'real-product', storeId: 'other-store', assetType: 'VIDEO', title: 'Shop khác không được hiện', urlOrContent: `${origin}/fixture-video.mp4`, status: 'PENDING' },
      { id: 'image-only', productId: 'real-product', assetType: 'IMAGE', title: 'Ảnh không phải video', urlOrContent: `${origin}/fixture-poster.svg` },
    ];
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/sample-')) sampleRequests.push(url.pathname);
      if (url.pathname === '/fixture-poster.svg') return request.respond({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="3000"><rect width="4000" height="3000" fill="#e6d8be"/></svg>' });
      if (url.pathname === '/fixture-video.mp4') return request.respond({ status: 404 });
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,PATCH,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        if (url.pathname.endsWith('/stores/my-store/presence')) return request.respond({ status: 200, headers, contentType: 'application/json', body: '{"code":200,"result":{}}' });
        let status = 200, result = [], message;
        if (url.pathname.endsWith('/users')) result = { userId: 'fixture-owner', roles: ['SHOP_OWNER'], status: 'ACTIVE', fullName: 'Chủ shop kiểm thử' };
        if (url.pathname.endsWith('/stores/mine')) result = [{ storeId: 'fixture-store', name: 'Shop kiểm thử', approvalStatus: 'APPROVED' }];
        if (url.pathname.endsWith('/stores/fixture-store')) result = { storeId: 'fixture-store', name: 'Shop kiểm thử', approvalStatus: 'APPROVED' };
        if (url.pathname.endsWith('/products')) result = mode === 'no-products' ? [] : [product];
        if (url.pathname.endsWith('/media')) {
          mediaReads.push(Object.fromEntries(url.searchParams));
          status = mode === 'error' ? 503 : mode === 'unsupported' ? 404 : 200;
          result = { items: mode === 'videos' ? videos : [] };
        }
        if (request.method() !== 'GET') {
          assert.equal(request.method(), 'PATCH');
          assert.equal(url.pathname, '/api/v1/media/video-a/review');
          const body = JSON.parse(request.postData()); writes.push(body);
          status = failApprove ? 503 : 200; message = failApprove ? 'Chưa duyệt được video kiểm thử.' : undefined;
          if (!failApprove) videos[0].status = body.status;
          result = videos[0];
        }
        return request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, result, message }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    })().catch(error => { errors.push(error.message); if (!request.isInterceptResolutionHandled()) void request.abort(); }); });
    await page.goto(`${base}/merchant/products`);
    await page.waitForSelector('[aria-label="Thao tác quản lý sản phẩm"]');
    const open = () => page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.includes('Duyệt video')).click());
    const close = () => page.click('button[aria-label="Đóng cửa sổ duyệt video"]');
    await open(); await page.waitForFunction(() => document.querySelector('.kol-video-state h4')?.textContent.includes('Chưa có video'));
    assert.equal(mediaReads.length, 0, 'no products means no eligible videos');
    assert.equal(await page.$('.kol-video-picker'), null);
    assert.deepEqual(sampleRequests, []);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('scanms_kol_video_submissions')).length), 1, 'ignore prototype data without deleting browser data');
    await close(); mode = 'empty'; await open();
    await page.waitForFunction(() => document.querySelector('.kol-video-state h4')?.textContent.includes('Chưa có video'));
    mkdirSync('.qa-artifacts/product-video-review', { recursive: true });
    await page.screenshot({ path: '.qa-artifacts/product-video-review/empty.png' });
    await close(); mode = 'error'; await open(); await page.waitForSelector('.kol-video-state[role=alert]');
    assert.equal(await page.$('.kol-video-picker'), null);
    mode = 'videos'; await page.click('.kol-video-state[role=alert] button');
    await page.waitForSelector('.kol-video-picker-item');
    assert.equal((await page.$$('.kol-video-picker-item')).length, 2);
    assert.match(await page.$eval('.kol-video-product-name', element => element.textContent), /Sản phẩm thật kiểm thử/);
    assert.equal(await page.$eval('.kol-video-picker-count strong', element => element.textContent), '2');
    assert.ok(mediaReads.every(params => params.storeId === 'fixture-store'));
    await page.waitForSelector('.kol-video-playback-error');
    mkdirSync('.qa-artifacts/product-video-review', { recursive: true });
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 868, height: 820 }, { width: 390, height: 844 }]) {
      await page.setViewport(viewport);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const bounds = await page.evaluate(() => {
        const modal = document.querySelector('.kol-video-review-modal'); const rect = modal.getBoundingClientRect();
        const list = document.querySelector('.kol-video-review-list'); const thumb = document.querySelector('.kol-video-picker-thumb').getBoundingClientRect();
        return { x: rect.x, right: rect.right, bottom: rect.bottom, width: thumb.width, height: thumb.height, overflow: list.scrollWidth - list.clientWidth };
      });
      assert.ok(bounds.x >= 0 && bounds.right <= viewport.width && bounds.bottom <= viewport.height && bounds.overflow <= 1, JSON.stringify(bounds));
      assert.ok(bounds.width <= 76 && bounds.height <= 80, 'large source image remains a thumbnail');
      await page.screenshot({ path: `.qa-artifacts/product-video-review/videos-${viewport.width}.png` });
    }
    await page.setViewport({ width: 1440, height: 1000 });
    await page.click('.kol-video-picker-item:last-child');
    assert.match(await page.$eval('.kol-video-title', element => element.textContent), /kiểm thử B/);
    await page.click('.kol-video-picker-item:nth-of-type(1)');
    await page.click('.kol-video-approve');
    await page.waitForFunction(() => document.body.textContent.includes('Chưa duyệt được video kiểm thử.'));
    assert.ok(await page.$('.kol-video-approve'), 'failed review does not change the saved status');
    failApprove = false; await page.click('.kol-video-approve');
    await page.waitForSelector('.kol-video-approve', { hidden: true });
    assert.equal(writes.length, 2); assert.equal(writes[1].status, 'APPROVED');
    await close(); mode = 'unsupported'; await open(); await page.waitForSelector('.kol-video-state[role=alert]');
    assert.match(await page.$eval('.kol-video-state[role=alert]', element => element.textContent), /chưa hỗ trợ duyệt video KOL/);
    await page.screenshot({ path: '.qa-artifacts/product-video-review/unsupported.png' });
    await page.keyboard.press('Escape'); await page.waitForSelector('.kol-video-review-modal', { hidden: true });
    assert.deepEqual(sampleRequests, []); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
