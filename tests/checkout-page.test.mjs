import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const storage = new Map(), module = { exports: {} };
const source = readFileSync(new URL('../src/utils/checkout-page.utils.ts', import.meta.url), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { module, exports: module.exports, sessionStorage: { getItem: key => storage.get(key) || null } });
const { checkoutDraftKey, liveCheckoutOrigin, readCheckoutDraft } = module.exports;
const item = { productId: 'product', variantId: 'variant', quantity: 2, price: 299000, store: { id: 'store' } };
const draft = () => ({ userId: 'buyer', savedAt: Date.now(), items: [item], couponCode: 'LIVE10', returnTo: '/live/session?viewer=1' });

test('checkout recovery belongs to the buyer and retains the exact selection and live source', () => {
  storage.clear(); storage.set(checkoutDraftKey('buyer'), JSON.stringify(draft()));
  const restored = readCheckoutDraft('buyer');
  assert.equal(restored.items[0].quantity, 2); assert.equal(restored.couponCode, 'LIVE10');
  assert.equal(restored.returnTo, '/live/session?viewer=1'); assert.equal(readCheckoutDraft('another-buyer'), null);
});

test('old, corrupt and invalid checkout drafts cannot become an order selection', () => {
  for (const row of [{ ...draft(), userId: 'another-buyer' }, { ...draft(), savedAt: Date.now() - 31 * 60000 },
    { ...draft(), items: [] }, { ...draft(), items: [{ ...item, quantity: -1 }] }, { ...draft(), items: [{ ...item, store: null }] }]) {
    storage.set(checkoutDraftKey('buyer'), JSON.stringify(row)); assert.equal(readCheckoutDraft('buyer'), null);
  }
  storage.set(checkoutDraftKey('buyer'), 'broken-json'); assert.equal(readCheckoutDraft('buyer'), null);
});

test('checkout return paths accept only a local live room, never another role or external URL', () => {
  for (const path of ['https://example.com/live/id', '//example.com/live/id', '/admin/users', '/merchant/orders', '/live', null])
    assert.equal(liveCheckoutOrigin(path), undefined);
  assert.equal(liveCheckoutOrigin('/live/abc-123?viewer=1#products'), '/live/abc-123?viewer=1#products');
});
