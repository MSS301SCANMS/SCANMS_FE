import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../src/utils/api-cache.utils.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { apiCache } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`);
test('financial amounts, payout state, batch history and expiring bill URLs are always fetched fresh', () => {
  for (const path of ['/wallets/me', '/wallets/withdrawals', '/payouts/id', '/stores/shop/payouts',
    '/stores/shop/payouts/id/bill', '/stores/shop/payouts/batches']) assert.equal(apiCache.isCacheable(path), false);
  assert.equal(apiCache.isCacheable('/products'), true);
});
test('authenticated simulation actions invalidate cached order lists, not only the tracking timeline', () => {
  assert.equal(apiCache.getAffectedDomain('/shipping/ghn/simulation/id/complete'), '/orders');
  assert.equal(apiCache.getAffectedDomain('/shipping/ghn/simulation/id/start'), '/orders');
  apiCache.set('/orders/my-store', {}, { status: 'SHIPPING' });
  apiCache.invalidate(apiCache.getAffectedDomain('/shipping/ghn/simulation/id/complete'));
  assert.equal(apiCache.get('/orders/my-store', {}), null);
});
