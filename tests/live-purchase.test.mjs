import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, imports) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(new URL(`../src/${path}.ts`, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: key => { assert.ok(key in imports, key); return imports[key]; } });
  return module.exports;
}
const commerce = load('services/live-commerce.service', { './api': {}, '../utils/api-response': {} });
const helpers = load('utils/live-purchase.utils', { '../services/live-commerce.service': commerce });
const now = Date.now();
const medium = { id: 'm', name: 'Blue / M', price: 329000, stockQuantity: 10, isActive: true };
const large = { id: 'l', price: 339000, stockQuantity: 5, isActive: true };
const offer = { id: 'deal', productId: 'shirt', variantId: 'm', priceVnd: 299000, quantityLimit: 3, reservedQuantity: 1,
  status: 'ACTIVE', startsAt: new Date(now - 10000).toISOString(), endsAt: new Date(now + 10000).toISOString() };

test('live price and quota apply only to the selected variant; catalog price remains intact', () => {
  const chosen = helpers.liveVariantQuote(medium, [offer], now);
  assert.equal(chosen.price, 299000); assert.equal(chosen.listPrice, 329000); assert.equal(chosen.stockQuantity, 2);
  assert.equal(helpers.liveVariantQuote(large, [offer], now).price, 339000);
  assert.equal(medium.price, 329000);
  assert.equal(helpers.liveVariantQuote({ ...medium, stockQuantity: 1 }, [offer], now).stockQuantity, 1);
});

test('expired, stopped, exhausted and future offers never fabricate a live price', () => {
  for (const row of [{ ...offer, status: 'STOPPED' }, { ...offer, reservedQuantity: 3 },
    { ...offer, endsAt: new Date(now).toISOString() }, { ...offer, startsAt: new Date(now + 1).toISOString() }]) {
    const quote = helpers.liveVariantQuote(medium, [row], now);
    assert.equal(quote.price, 329000); assert.equal(quote.offerId, undefined); assert.equal(quote.stockQuantity, 10);
  }
});

test('inactive, unknown stock, invalid price and stale deal above catalog cannot be purchased', () => {
  for (const row of [{ ...medium, isActive: false }, { ...medium, stockQuantity: 0 }, { ...medium, stockQuantity: NaN },
    { ...medium, price: undefined }, { ...medium, price: 0 }]) assert.equal(helpers.liveVariantQuote(row, [offer], now).stockQuantity, 0);
  assert.equal(helpers.liveVariantQuote(medium, [{ ...offer, priceVnd: 400000 }], now).stockQuantity, 0);
  const normalized = helpers.normalizeLiveVariants({ variants: [{ variantId: 'id', color: 'Blue', size: 'L', priceVnd: 10, stockQuantity: null, status: 'INACTIVE' }] });
  assert.equal(normalized[0].id, 'id'); assert.equal(normalized[0].stockQuantity, 0); assert.equal(normalized[0].isActive, false);
});

function selectionFixture({ status = 'LIVE', storeId = 'store', canPurchase = true, attached = true, invalidCommerce = false } = {}) {
  const requests = [];
  const product = { id: 'shirt', storeId, canPurchase, variants: [medium] };
  const api = { get: async (path, config) => {
    requests.push({ path, config });
    return { result: path.includes('/landing') ? { product } : { status, storeId: 'store', productRefs: { productIds: attached ? ['shirt'] : [] } } };
  } };
  const service = load('services/live-purchase.service', {
    './api': { __esModule: true, default: api }, '../utils/api-response': { unwrapApi: value => value.result },
    './live-commerce.service': { liveCommerceService: { get: async () => { if (invalidCommerce) throw Error('Commerce unavailable'); return { offers: [offer], voucherDrops: [] }; } } },
    '../utils/live-purchase.utils': helpers,
  }).livePurchaseService;
  return { service, requests };
}

test('selection refreshes real product and live membership without reusing cached stock', async () => {
  const { service, requests } = selectionFixture();
  const state = await service.selection('live', 'shirt');
  assert.equal(state.variants[0].id, 'm'); assert.equal(requests.length, 2);
  assert.ok(requests.every(row => row.config.headers['x-skip-cache'] === 'true'));
});

test('selection rejects closed sessions, foreign products, unavailable stock and unavailable commerce', async () => {
  for (const fixture of [{ status: 'SCHEDULED' }, { status: 'ENDED' }, { storeId: 'other' }, { attached: false }, { canPurchase: false }, { invalidCommerce: true }])
    await assert.rejects(selectionFixture(fixture).service.selection('live', 'shirt'));
});
