import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/cart-merge.utils.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { mergeCartItems } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const item = (id, quantity, extra = {}) => ({
  cartItemId: id, productId: id.split('_')[0], title: id, price: 100, sku: id,
  imageUrl: '/product.png', quantity, stockQuantity: 20, isActive: true,
  store: { id: 'shop-' + id[0], name: 'Partner' }, ...extra,
});

test('guest sign-in preserves multiple stores, variants and live attribution', () => {
  const remote = [item('a_red', 2), item('b_blue', 3)];
  const guest = [item('a_red', 4, { liveSessionId: 'live', liveCouponCode: 'LIVE10' }), item('a_green', 1)];
  const result = mergeCartItems(remote, guest, true);
  assert.equal(result.length, 3);
  assert.equal(result.find((row) => row.cartItemId === 'a_red').quantity, 6);
  assert.equal(result.find((row) => row.cartItemId === 'a_red').liveCouponCode, 'LIVE10');
  assert.equal(result.find((row) => row.cartItemId === 'b_blue').quantity, 3);
  assert.deepEqual(remote.map((row) => row.quantity), [2, 3]);
});

test('cache reconciliation is idempotent and respects server stock and price', () => {
  const remote = [item('a_red', 2, { stockQuantity: 5, price: 120 })];
  const cache = [item('a_red', 4, { stockQuantity: 20, price: 100 })];
  const merged = mergeCartItems(remote, cache);
  assert.equal(merged[0].price, 120);
  assert.equal(merged[0].quantity, 4);
  assert.deepEqual(mergeCartItems(merged, cache), merged);
  assert.equal(mergeCartItems(remote, [item('a_red', 10)], true)[0].quantity, 5);
});

test('out-of-stock rows remain visible so sign-in does not silently delete products', () => {
  const merged = mergeCartItems([item('a_red', 2, { stockQuantity: 0 })], [item('a_red', 3)], true);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].stockQuantity, 0);
  assert.equal(merged[0].quantity, 5);
});
