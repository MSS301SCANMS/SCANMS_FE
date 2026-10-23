import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../src/utils/customer-order-filter.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
new Function('module', 'exports', source)(module, module.exports);
const { matchesCustomerOrderStatus } = module.exports;

test('return history includes every decision and refund state without replacing purchase fulfillment', () => {
  for (const status of ['REQUESTED', 'APPROVED', 'REJECTED', 'RETURNING', 'RECEIVED', 'REFUND_PENDING', 'REFUNDED', 'CANCELLED']) {
    const order = { status: 'COMPLETED', returnRequests: [{ id: 'partial-return', status }] };
    assert.equal(matchesCustomerOrderStatus(order, 'RETURNED'), true, status);
    assert.equal(matchesCustomerOrderStatus(order, 'COMPLETED'), true, 'Partial returns preserve the original purchase status');
    assert.equal(order.status, 'COMPLETED');
  }
  assert.equal(matchesCustomerOrderStatus({ status: 'COMPLETED', returnRequests: [] }, 'RETURNED'), false);
  assert.equal(matchesCustomerOrderStatus({ status: 'PENDING' }, 'COMPLETED'), false);
});

test('existing singular and legacy return records remain visible', () => {
  assert.equal(matchesCustomerOrderStatus({ status: 'COMPLETED', returnRequest: { id: 'old-return' } }, 'RETURNED'), true);
  assert.equal(matchesCustomerOrderStatus({ status: 'RETURN_REQUESTED' }, 'RETURNED'), true);
});
