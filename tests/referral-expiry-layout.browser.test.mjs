import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const base = process.env.GHN_UI_TEST_URL;
const executablePath = process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const modal = '.referral-create-dialog';
const product = (id, title, shop, category) => ({ id, title, storeId: shop, store: { id: shop, name: `Gian hàng ${shop}` }, categoryName: category, status: 'ACTIVE', price: 150000 });
test('expiry calendar fits its dialog at desktop and mobile widths', { skip: !base || !existsSync(executablePath), timeout: 60000 }, async () => {
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
  const origin = new URL(base).origin;
  const browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await browser.defaultBrowserContext().overridePermissions(origin, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
    const errors = [], writes = [];
    let catalog = 'empty', failCreate = true;
    const fixtures = [product('serum-one', 'Tinh chất dưỡng da', 'Sora', 'Chăm sóc da'), product('lipstick-two', 'Son dưỡng môi', 'Rose', 'Trang điểm')];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('token', 'isolated-referral-fixture');
      localStorage.setItem('user', JSON.stringify({ id: 'fixture-kol', role: 'COLLABORATOR', fullName: 'KOL kiểm thử' }));
      localStorage.setItem('scanms-current-role', 'kol'); localStorage.setItem('scanms-active-workspace', 'kol');
    });
    await page.setRequestInterception(true);
    page.on('request', request => { void (async () => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': 'authorization,content-type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        let status = 200, result = [], message;
        if (url.pathname.endsWith('/users')) result = { userId: 'fixture-kol', roles: ['KOL_CTV'], status: 'ACTIVE', fullName: 'KOL kiểm thử' };
        if (url.pathname.endsWith('/collaborators/me')) result = { collaboratorId: 'fixture-profile', approvalStatus: 'APPROVED' };
        if (url.pathname.endsWith('/public/products')) {
          assert.equal(url.searchParams.get('eligibleForReferral'), 'true');
          if (catalog === 'error') { status = 503; message = 'Không tải được danh mục kiểm thử.'; }
          result = { items: catalog === 'loaded' ? fixtures : [], total: catalog === 'loaded' ? 2 : 0 };
        }
        if (request.method() !== 'GET') {
          writes.push({ path: url.pathname, body: JSON.parse(request.postData() || '{}') });
          assert.equal(url.pathname, '/api/v1/referrals');
          await new Promise(resolve => setTimeout(resolve, 500));
          if (failCreate) { status = 503; message = 'Chưa tạo được liên kết kiểm thử.'; }
          result = { ...writes.at(-1).body, referralLinkId: 'created-link', collaboratorId: 'fixture-profile' };
        }
        return request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify({ code: status, message, result }) });
      }
      if (url.origin !== origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
      return request.continue();
    })().catch(error => { errors.push(error.message); if (!request.isInterceptResolutionHandled()) void request.abort(); }); });
    const open = async () => { await page.goto(`${base}/collaborator/marketing?tab=links&create=1`); await page.waitForSelector(modal); };
    const checkBounds = async () => assert.equal(await page.$eval(modal, element => {
      const rect = element.getBoundingClientRect(), footer = element.querySelector('footer').getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth + 1 && rect.top >= 0 && rect.bottom <= innerHeight + 1 && footer.bottom <= rect.bottom && element.scrollWidth <= element.clientWidth + 1;
    }), true);
    const screenshot = async name => { mkdirSync('.qa-artifacts', { recursive: true }); await page.screenshot({ path: `.qa-artifacts/referral-${name}.png` }); };
    await page.setViewport({ width: 1440, height: 1000 });
    await open();
    await page.waitForFunction(() => document.querySelector('.referral-create-empty')?.textContent.includes('Chưa có sản phẩm'));
    assert.equal(await page.$eval(`${modal} button[type=submit]`, button => button.disabled), true);
    await checkBounds(); await screenshot('empty-desktop');
    catalog = 'error'; await open(); await page.waitForSelector(`${modal} [role=alert]`);
    assert.equal((await page.$$('.referral-create-empty')).length, 0);
    catalog = 'loaded'; await page.click('.referral-create-error button');
    await page.waitForSelector('.referral-create-product');
    assert.equal((await page.$$('.referral-create-product')).length, 2);
    await screenshot('products-desktop');
    await page.click('button[aria-label="Lọc gian hàng tiếp thị"]');
    await page.evaluate(() => [...document.querySelectorAll('[role=option]')].find(option => option.textContent.includes('Gian hàng Rose')).click());
    assert.equal((await page.$$('.referral-create-product')).length, 1);
    assert.match(await page.$eval('.referral-create-product', element => element.textContent), /Son dưỡng môi/);
    await page.click('button[aria-label="Lọc gian hàng tiếp thị"]');
    await page.evaluate(() => [...document.querySelectorAll('[role=option]')].find(option => option.textContent.includes('Tất cả gian hàng')).click());
    await page.setViewport({ width: 390, height: 844 });
    await page.click('button[aria-label="Lọc ngành hàng tiếp thị"]');
    assert.equal(await page.$eval('[role=listbox]', element => element.getBoundingClientRect().right <= innerWidth), true);
    await page.evaluate(() => [...document.querySelectorAll('[role=option]')].find(option => option.textContent.includes('Chăm sóc da')).click());
    assert.equal((await page.$$('.referral-create-product')).length, 1);
    await checkBounds(); await screenshot('products-mobile');
    await page.setViewport({ width: 1440, height: 1000 });
    await page.type('.referral-create-search input', 'tinh chat');
    assert.equal((await page.$$('.referral-create-product')).length, 1);
    await page.click('.referral-create-product'); await page.click(`${modal} button[type=submit]`);
    await page.waitForSelector('#referral-label');
    assert.equal(await page.$eval(`${modal} button[type=submit]`, button => button.disabled), true);
    await page.type('#referral-label', 'Chiến dịch tháng 10');
    await page.click('#referral-expires');
    await page.waitForSelector('.referral-create-expiry-calendar [role=group]');
    for (const width of [1440, 900, 390]) {
      await page.setViewport({width,height:844});
      await page.waitForNetworkIdle({idleTime:200});
      const bounds=await page.$eval(modal,element=>{
        const body=element.querySelector('.referral-create-body');
        const calendar=element.querySelector('.referral-create-expiry-calendar [role=group]');
        const a=body.getBoundingClientRect(),b=calendar.getBoundingClientRect();
        const trigger=element.querySelector('#referral-expires').getBoundingClientRect();
        return {overflow:body.scrollWidth-body.clientWidth,inside:b.left>=a.left-1&&b.right<=a.right+1,calendarWidth:b.width,above:b.bottom<=trigger.top+1,viewport:b.top>=0&&b.bottom<=innerHeight,position:getComputedStyle(calendar).position};
      });
      assert.ok(bounds.overflow<=1,JSON.stringify({width,...bounds}));
      assert.ok(bounds.calendarWidth<=391,JSON.stringify({width,...bounds}));
      assert.ok(bounds.viewport,JSON.stringify({width,...bounds}));
      assert.equal(bounds.position,'fixed');
      if(width>=900) assert.ok(bounds.above,JSON.stringify({width,...bounds}));
      await checkBounds();await screenshot('expiry-'+width);
    }
    assert.equal(errors.filter(error=>!error.includes('WebSocket')).length,0);
  } finally { await browser.close(); }
});
