import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

test('sample request identifies missing province, district and ward before submitting', {
  skip: !process.env.GHN_UI_TEST_URL || !existsSync(process.env.GHN_UI_BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'), timeout: 45000,
}, async () => {
// Isolated browser fixture: no request in this audit reaches the backend or GHN.
const base = process.env.GHN_UI_TEST_URL;
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
  const kol=await makePage('COLLABORATOR');
  await kol.goto(base + '/collaborator/collaboration?shop=' + storeId + '&tab=products');
  const action=await kol.waitForSelector('button');
  await kol.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent.includes('Xin mẫu thử')));
  await kol.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Xin mẫu thử')).click());
  await kol.waitForSelector('[aria-labelledby="sample-request-title"] input[type="tel"]');
  const modal='[aria-labelledby="sample-request-title"]';
  const inputs=await kol.$$(modal+' input[type="text"]');
  await inputs[1].type('Nguyen Van A');
  await kol.type(modal+' input[type="tel"]','0912345678');
  await inputs[2].type('12 Duong A');
  await kol.click(modal+' input[type="checkbox"]');
  const submit=async () => { await kol.click(modal+' button[type="submit"]'); await kol.waitForSelector('#sample-address-error'); };
  for (let index=0;index<3;index++) {
    await submit();
    const error=await kol.$eval('#sample-address-error',el=>el.textContent);
    assert.ok(error.includes(['Tỉnh/Thành phố','Quận/Huyện','Phường/Xã'][index]));
    assert.equal(await kol.$eval('#sample-delivery-address', (el,i)=>el.querySelectorAll('button[aria-haspopup="listbox"]')[i]===document.activeElement,index),true);
    assert.equal(mutations.length,0,'incomplete address never creates a sample request');
    const buttons=await kol.$$('#sample-delivery-address button[aria-haspopup="listbox"]');
    await buttons[index].click();
    await kol.waitForSelector('[role="option"]');
    await kol.evaluate(()=>[...document.querySelectorAll('[role="option"]')].find(el=>!el.disabled).click());
    await kol.waitForFunction(()=>!document.querySelector('#sample-address-error'));
    if(index<2) await kol.waitForFunction(i=>!document.querySelectorAll('#sample-delivery-address button[aria-haspopup="listbox"]')[i+1].disabled,{},index);
  }
  await kol.click(modal+' button[type="submit"]');
  await kol.waitForFunction(()=>!document.querySelector('[aria-labelledby="sample-request-title"]'));
  assert.equal(mutations.length,1);
  assert.equal(mutations[0].body.ghnWardCode,'111');
} finally { await browser.close(); }
});
