import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

async function service(api) {
  const source = await readFile(new URL('../src/services/referral-links.service.ts', import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: () => ({ __esModule: true, default: api }), URL, window: { location: { origin: 'http://localhost:5173' } }, crypto: globalThis.crypto });
  return exports.referralLinksService;
}

test('saved ID-only referrals resolve the product name, photo, price and shop without changing their tokens', async () => {
  const calls = [];
  const rows = ['tiktok-token', 'facebook-token'].map((token, i) => ({ referralLinkId: `r${i}`, productId: 'shirt', collaboratorId: 'kol', token, channel: i ? 'FACEBOOK' : 'TIKTOK', status: 'ACTIVE' }));
  const api = { get: async path => {
    calls.push(path);
    return { result: path === '/referrals' ? rows : { id: 'shirt', title: 'Áo sơ mi Sora', imageUrl: '/shirt.webp', price: 299000, storeId: 'shop', store: { id: 'shop', name: 'Sora Skin' } } };
  } };
  const result = await (await service(api)).getMyLinks();
  assert.equal(calls.filter(path => path === '/public/products/shirt').length, 1);
  assert.equal(result.data[0].product.title, 'Áo sơ mi Sora');
  assert.equal(result.data[0].product.imageUrl, '/shirt.webp');
  assert.equal(result.data[0].product.price, 299000);
  assert.equal(result.data[0].store.name, 'Sora Skin');
  assert.equal(result.data[0].storeId, 'shop');
  assert.equal(result.data[0].shortUrl, 'http://localhost:5173/r/tiktok-token');
  assert.equal(result.data[1].shortCode, 'facebook-token');
  assert.equal(result.data[1].channel, 'FACEBOOK');
});

test('unavailable catalog does not replace product names with UUIDs or invent a zero price', async () => {
  const api = { get: async path => {
    if (path !== '/referrals') throw new Error('Offline');
    return { result: [{ referralLinkId: 'r', productId: 'missing-id', token: 'saved-token', status: 'ACTIVE' }] };
  } };
  const result = await (await service(api)).getMyLinks();
  assert.equal(result.data[0].product.title, 'Sản phẩm chưa có thông tin');
  assert.equal(result.data[0].product.price, null);
  assert.equal(result.data[0].shortCode, 'saved-token');
});

test('referral creation immediately returns catalog information with the saved link', async () => {
  const api = {
    post: async (_path, input) => ({ result: { ...input, referralLinkId: 'saved', collaboratorId: 'kol' } }),
    get: async () => ({ result: { productId: 'shirt', name: 'Áo Sora', priceVnd: 299000, imageUrl: '/shirt.webp', storeId: 'shop', store: { id: 'shop', name: 'Sora Skin' } } }),
  };
  const link = await (await service(api)).createLink({ productId: 'shirt', channel: 'TIKTOK' }, 'stable-token');
  assert.equal(link.product.title, 'Áo Sora');
  assert.equal(link.store.name, 'Sora Skin');
  assert.equal(link.shortCode, 'stable-token');
});
