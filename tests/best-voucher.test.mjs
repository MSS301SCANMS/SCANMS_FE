import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/utils/best-voucher.utils.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  { exports, Number, Math, Set, Promise });
const { findBestVoucher } = exports;

test('best offer compares payable totals, ignores ineligible and malformed quotes and breaks ties consistently', async () => {
  const controller = new AbortController(), calls = [];
  const results = {
    GOODS: { discountAmount: 25000, finalAmount: 305000 },
    SHIP: { discountAmount: 0, shippingDiscountVnd: 30000, finalAmount: 300000 },
    ASHIP: { discountAmount: 0, shippingDiscountVnd: 30000, finalAmount: 300000 },
    ZERO: { discountAmount: 0, finalAmount: 0 },
    BAD: { discountAmount: 999999, finalAmount: -1 },
  };
  const best = await findBestVoucher(['GOODS', 'SHIP', 'ASHIP', 'INVALID', 'ZERO', 'BAD', ' ship '], async code => {
    calls.push(code);
    if (code === 'INVALID') throw new Error('Per-customer quota exhausted');
    return results[code];
  }, controller.signal);
  assert.equal(best.code, 'ASHIP');
  assert.equal(best.finalAmount, 300000);
  assert.equal(calls.length, 6);
});

test('recommendations cancel stale work and use at most three concurrent previews', async () => {
  const controller = new AbortController();
  let inFlight = 0, maximum = 0, calls = 0;
  const result = await findBestVoucher(['A', 'B', 'C', 'D', 'E', 'F'], async () => {
    calls++; maximum = Math.max(maximum, ++inFlight);
    await new Promise(resolve => setTimeout(resolve, 10));
    inFlight--; controller.abort();
    return { discountAmount: 10000, finalAmount: 100000 };
  }, controller.signal);
  assert.equal(result, null); assert.equal(maximum, 3); assert.equal(calls, 3);
  assert.equal(await findBestVoucher([], async () => { throw Error('No candidates'); }, new AbortController().signal), null);
});
