import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
function load(path) {
  const module = { exports: {} };
  const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('module', 'exports', source)(module, module.exports);
  return module.exports;
}
const { getCustomerOrderActions } = load('../src/utils/customer-order-actions.ts');
const { serverDate } = load('../src/utils/server-date.ts');
const now = Date.parse('2026-10-22T05:00:00Z');
const order = { status: 'COMPLETED', deliveredAt: '2026-10-21T05:00:00Z', orderItems: [{ quantity: 3, returnableQuantity: 2 }], returnRequest: { status: 'REFUNDED' } };
test('remaining items can be returned after a partial refund, including a confirmed receipt', () => {
  assert.equal(getCustomerOrderActions(order, now).requestReturn, true);
});
test('fully reserved or refunded items cannot open another return from the UI', () => {
  assert.equal(getCustomerOrderActions({ ...order, orderItems: [{ quantity: 3, returnableQuantity: 0 }] }, now).requestReturn, false);
});
test('undelivered and expired orders cannot request a return', () => {
  assert.equal(getCustomerOrderActions({ ...order, status: 'SHIPPING' }, now).requestReturn, false);
  assert.equal(getCustomerOrderActions({ ...order, deliveredAt: '2026-10-01T05:00:00Z' }, now).requestReturn, false);
});
test('Spring UTC delivery times do not lose seven hours of the return window', () => {
  assert.equal(serverDate('2026-10-21T05:00:00.123456'), '2026-10-21T05:00:00.123456Z');
  assert.equal(serverDate('2026-10-21T05:00:00Z'), '2026-10-21T05:00:00Z');
  assert.equal(serverDate('2026-10-21T12:00:00+07:00'), '2026-10-21T12:00:00+07:00');
});
