import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

// Isolated browser fixture: no request in this audit reaches the backend or GHN.
const base = process.env.GHN_UI_TEST_URL || 'http://localhost:5173';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const browser = await puppeteer.launch({
  executablePath: process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const results = [];
const record = (name, passed, evidence) => {
  results.push({ name, passed, evidence });
  console.log(`${passed ? 'PASS' : 'GAP'} ${name}: ${evidence}`);
};
const storeId = '00000000-0000-4000-8000-000000000010';
const channel = { id: '00000000-0000-4000-8000-000000000020', platformName: 'TIKTOK', channelName: 'Audit', followerCount: 10000 };
const product = { id: '00000000-0000-4000-8000-000000000030', storeId, title: 'Mẫu kiểm tra địa chỉ', price: 100000,
  sampleEnabled: true, sampleQuota: 10, sampleGrantedCount: 0, stockQuantity: 10 };
let sample = { id: '00000000-0000-4000-8000-000000000040', collaboratorId: 'audit-kol', status: 'PENDING', productId: product.id,
  product, recipientName: 'Người nhận mới', recipientPhone: '0912345678', shippingAddress: '12 Đường Mới, Tầng 3, Phường Một, Quận Một, Tỉnh Một',
  ghnProvinceId: 1, ghnDistrictId: 11, ghnWardCode: '111', socialChannelId: channel.id, contentType: 'Video review',
  createdAt: new Date().toISOString(), collaborator: { id: 'audit-kol', fullName: 'Hồ sơ cũ', phoneNumber: '0988888888', address: 'Địa chỉ hồ sơ cũ' },
  events: [], videoAssets: [] };
const mutations = [];
let hideRequests = true;
let delayDistricts = false;
let releaseDistricts;
let shopReads = 0;
async function makePage(role) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });
  page.setDefaultTimeout(12000);
  await page.evaluateOnNewDocument(role => {
    localStorage.setItem('token', 'audit-no-server-access');
    localStorage.setItem('user', JSON.stringify({ id: role === 'SHOP_MANAGER' ? 'audit-shop' : 'audit-kol', role, fullName: 'Audit', email: 'audit@example.test' }));
  }, role);
  await page.setRequestInterception(true);
  page.on('request', async request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/') || url.port === '3000') {
      const headers = { 'Access-Control-Allow-Origin': new URL(base).origin, 'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'content-type,authorization,x-skip-cache', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS', 'Content-Type': 'application/json' };
      if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
      const path = url.pathname;
      let data = [];
      if (path === '/api/stores/marketplace') data = [{ id: storeId, name: 'Shop kiểm thử' }];
      if (path === '/api/stores/my' || path === '/api/stores/me') data = { id: storeId, name: 'Shop kiểm thử' };
      if (path === '/api/store-collaborators/shop') data = { store: { id: storeId, name: 'Shop kiểm thử' }, members: [] };
      if (path === '/api/social-channels') data = [channel];
      if (path === '/api/kyc/profile') data = { kycStatus: 'VERIFIED' };
      if (path === '/api/sample-requests/my/eligibility') data = { canRequest: true, isBlocked: false, channels: [channel] };
      if (path === '/api/products') data = { items: [product], pagination: { total: 1 } };
      if (path === '/api/sample-requests/my' || path === '/api/sample-requests/shop') {
        if (path.endsWith('/shop')) shopReads++;
        data = hideRequests ? [] : [structuredClone(sample)];
      }
      if (path === '/api/shipping/ghn/provinces') data = [{ ProvinceID: 1, ProvinceName: 'Tỉnh Một' }, { ProvinceID: 2, ProvinceName: 'Tỉnh Hai' }];
      if (path === '/api/shipping/ghn/districts/1') data = [{ DistrictID: 11, ProvinceID: 1, DistrictName: 'Quận Một' }];
      if (path === '/api/shipping/ghn/districts/2') {
        if (delayDistricts) await new Promise(resolve => { releaseDistricts = resolve; });
        data = [{ DistrictID: 22, ProvinceID: 2, DistrictName: 'Quận Hai' }];
      }
      if (path === '/api/shipping/ghn/wards/11') data = [{ WardCode: '111', DistrictID: 11, WardName: 'Phường Một' }];
      if (path === '/api/shipping/ghn/wards/22') data = [{ WardCode: '222', DistrictID: 22, WardName: 'Phường Hai' }];
      if (request.method() !== 'GET') {
        mutations.push({ path, method: request.method(), body: JSON.parse(request.postData() || '{}') });
        if (path.endsWith('/details')) {
          sample = { ...sample, ...mutations.at(-1).body };
          data = sample;
        }
        if (path === '/api/sample-requests' && request.method() === 'POST') {
          sample = { ...sample, ...mutations.at(-1).body };
          hideRequests = false;
          data = sample;
        }
      }
      return request.respond({ status: 200, headers, body: JSON.stringify({ success: true, data }) });
    }
    if (url.origin !== new URL(base).origin && !['data:', 'blob:'].includes(url.protocol)) return request.abort();
    return request.continue();
  });
  return page;
}
async function clickText(page, selector, text) {
  await page.waitForFunction((selector, text) => [...document.querySelectorAll(selector)].some(el => el.textContent.trim() === text), {}, selector, text);
  await page.evaluate((selector, text) => [...document.querySelectorAll(selector)].find(el => el.textContent.trim() === text).click(), selector, text);
}
try {
  const kol = await makePage('COLLABORATOR');
  await kol.goto(`${base}/collaborator/collaboration?shop=${storeId}&tab=products`);
  await clickText(kol, 'button', 'Xin mẫu thử');
  await kol.waitForSelector('input[placeholder="Số nhà, tên đường, tòa nhà, căn hộ..."]');
  record('Form xin mẫu mới không điền sẵn địa chỉ/SĐT cũ', await kol.$eval('input[type="tel"]', el => el.value === '') && await kol.$eval('input[placeholder="Số nhà, tên đường, tòa nhà, căn hộ..."]', el => el.value === ''), 'Các ô người nhận/địa chỉ trống khi tạo yêu cầu mới');
  await kol.type('input[placeholder="Nguyễn Văn A"]', sample.recipientName);
  await kol.type('input[type="tel"]', '+84 912 345 678');
  await clickText(kol, 'button[aria-haspopup="listbox"]', 'Tỉnh / Thành');
  await clickText(kol, '[role="option"]', 'Tỉnh Một');
  await kol.waitForFunction(() => [...document.querySelectorAll('button[aria-haspopup="listbox"]')].some(el => el.textContent.trim() === 'Quận / Huyện' && !el.disabled));
  await clickText(kol, 'button[aria-haspopup="listbox"]', 'Quận / Huyện');
  await clickText(kol, '[role="option"]', 'Quận Một');
  await kol.waitForFunction(() => [...document.querySelectorAll('button[aria-haspopup="listbox"]')].some(el => el.textContent.trim() === 'Phường / Xã' && !el.disabled));
  await clickText(kol, 'button[aria-haspopup="listbox"]', 'Phường / Xã');
  await clickText(kol, '[role="option"]', 'Phường Một');
  await kol.type('input[placeholder="Số nhà, tên đường, tòa nhà, căn hộ..."]', '12 Đường Mới, Tầng 3');
  await kol.click('form input[type="checkbox"]');
  await clickText(kol, 'button', 'Gửi Cam Kết & Xin Mẫu');
  await kol.waitForFunction(() => !document.querySelector('input[placeholder="Số nhà, tên đường, tòa nhà, căn hộ..."]'));
  const created = mutations.find(item => item.path === '/api/sample-requests').body;
  assert.equal(created.shippingAddress, '12 Đường Mới, Tầng 3, Phường Một, Quận Một, Tỉnh Một');
  assert.equal(created.recipientPhone, '0912345678');
  record('Tạo mẫu mới gửi đúng địa chỉ ba cấp và chuẩn hóa SĐT', true, created.shippingAddress);
  await clickText(kol, 'button', 'Sửa thông tin');
  await kol.waitForFunction(() => [...document.querySelectorAll('button[aria-haspopup="listbox"]')].some(el => el.textContent.includes('Phường Một')));
  const detailSelector = 'input[placeholder="Số nhà, tên đường, tòa nhà, căn hộ..."]';
  assert.equal(await kol.$eval(detailSelector, el => el.value), '12 Đường Mới, Tầng 3');
  record('Mở sửa giữ địa chỉ chi tiết có dấu phẩy', true, '12 Đường Mới, Tầng 3; đúng tỉnh/huyện/xã và SĐT của yêu cầu');
  record('Form không dùng textarea địa chỉ', !(await kol.$eval(detailSelector, el => el.closest('form').querySelector('textarea'))), 'Địa chỉ chi tiết là input riêng; ba dropdown lấy master-data GHN');
  await kol.$eval(detailSelector, el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
  // Use native input setter so React sees the edited value.
  await kol.$eval(detailSelector, el => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '88 Đường Mới, Tầng 5');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await kol.click('form input[type="checkbox"]');
  await clickText(kol, 'button', 'Lưu thay đổi & Gửi lại Shop');
  await kol.waitForFunction(() => !document.querySelector('input[placeholder="Số nhà, tên đường, tòa nhà, căn hộ..."]'));
  const payload = mutations.find(item => item.path.endsWith('/details')).body;
  assert.equal(payload.shippingAddress, '88 Đường Mới, Tầng 5, Phường Một, Quận Một, Tỉnh Một');
  assert.equal(payload.recipientPhone, '0912345678');
  assert.equal(payload.ghnDistrictId, 11);
  record('Gửi sửa đúng địa chỉ đầy đủ và mã GHN', true, payload.shippingAddress);

  await clickText(kol, 'button', 'Sửa thông tin');
  await kol.waitForFunction(() => [...document.querySelectorAll('button[aria-haspopup="listbox"]')].some(el => el.textContent.includes('Phường Một')));
  delayDistricts = true;
  await clickText(kol, 'button[aria-haspopup="listbox"]', 'Tỉnh Một');
  await clickText(kol, '[role="option"]', 'Tỉnh Hai');
  const districtDisabled = await kol.evaluate(() => [...document.querySelectorAll('button[aria-haspopup="listbox"]')].find(el => el.textContent.trim() === 'Quận / Huyện')?.disabled);
  if (!districtDisabled) await clickText(kol, 'button[aria-haspopup="listbox"]', 'Quận / Huyện');
  const oldDistrictStillVisible = !districtDisabled && await kol.evaluate(() => [...document.querySelectorAll('[role="option"]')].some(el => el.textContent.trim() === 'Quận Một'));
  record('Đổi tỉnh xóa ngay danh sách huyện cũ', !oldDistrictStillVisible, oldDistrictStillVisible ? 'Trong lúc API tỉnh mới đang tải vẫn chọn được Quận Một của tỉnh cũ' : 'Không có lựa chọn cũ');
  releaseDistricts?.();
  delayDistricts = false;

  const shop = await makePage('SHOP_MANAGER');
  await shop.goto(`${base}/merchant/kol-hub?kol=audit-kol&tab=samples`);
  await clickText(shop, 'summary', 'Thông tin nhận hàng & cam kết');
  const hubText = await shop.evaluate(() => [...document.querySelectorAll('details')].find(el => el.textContent.includes('Thông tin nhận hàng & cam kết')).innerText);
  record('Shop KOL Hub hiển thị snapshot nhận hàng', hubText.includes(sample.shippingAddress) && hubText.includes(sample.recipientName) && hubText.includes(sample.recipientPhone) && !hubText.includes('Địa chỉ hồ sơ cũ'), hubText.replace(/\s+/g, ' ').slice(0, 300));
  const beforeReads = shopReads;
  sample = { ...sample, shippingAddress: '99 Địa Chỉ Vừa Sửa, Phường Một, Quận Một, Tỉnh Một' };
  const cached = await shop.evaluate(async () => {
    const { default: api } = await import('/src/services/api.ts');
    const response = await api.get('/sample-requests/shop');
    return response.data[0].shippingAddress;
  });
  record('Shop tải lại lấy địa chỉ mới thay vì cache vô hạn', cached === sample.shippingAddress, `Đọc mạng thêm ${shopReads - beforeReads} lần; kết quả: ${cached}`);
  const forced = await shop.evaluate(async () => {
    const { default: api } = await import('/src/services/api.ts');
    const response = await api.get('/sample-requests/shop', { headers: { 'x-skip-cache': 'true' } });
    return response.data[0].shippingAddress;
  });
  assert.equal(forced, sample.shippingAddress);
  record('API lấy đúng địa chỉ mới khi yêu cầu làm mới', true, forced);
  await clickText(shop, 'button', 'Làm mới thông tin nhận hàng');
  await shop.waitForFunction(address => document.body.innerText.includes(address), {}, sample.shippingAddress);
  record('Nút làm mới Shop cập nhật địa chỉ đang hiển thị', true, sample.shippingAddress);

  await shop.goto(`${base}/merchant/orders?tab=samples`);
  await shop.waitForFunction(() => document.body.innerText.includes('Mẫu kiểm tra địa chỉ'));
  await clickText(shop, 'summary', 'Thông tin nhận hàng');
  let queueText = await shop.evaluate(() => document.body.innerText);
  record('Shop hàng đợi xem địa chỉ trước khi duyệt', queueText.includes(sample.shippingAddress), queueText.includes(sample.shippingAddress) ? 'Có địa chỉ trong hàng đợi' : 'Hàng đợi PENDING chỉ có hồ sơ KOL/sản phẩm; chưa hiển thị địa chỉ/người nhận');
  sample.status = 'APPROVED';
  await shop.reload();
  await clickText(shop, 'button', 'Tạo vận đơn GHN');
  await shop.waitForFunction(address => document.body.innerText.includes(address), {}, sample.shippingAddress);
  queueText = await shop.$eval('form', el => el.innerText);
  // Recipient summary sits immediately above the form in the tracking dialog.
  queueText += await shop.$eval('form', el => el.parentElement.innerText);
  record('Shop modal vận đơn giữ đúng địa chỉ', queueText.includes(sample.shippingAddress), sample.shippingAddress);
  record('Shop modal vận đơn hiện đủ người nhận và SĐT', queueText.includes(sample.recipientName) && queueText.includes(sample.recipientPhone), `${sample.recipientName} · ${sample.recipientPhone}`);
} finally {
  releaseDistricts?.();
  await browser.close();
  mkdirSync('../docs/audit-results', { recursive: true });
  writeFileSync('../docs/audit-results/sample-address-browser.json', JSON.stringify({ date: new Date().toISOString(), fixtureOnly: true, results }, null, 2));
  if (results.some(item => !item.passed)) process.exitCode = 1;
}
