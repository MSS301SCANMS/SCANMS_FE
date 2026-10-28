import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

async function utility(name) {
  const source = ts.transpileModule(readFileSync(new URL('../src/utils/' + name + '.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}
const amounts = await utility('checkout-amounts');
const actions = await utility('customer-order-actions');

test('listed totals use quantities and show live price reductions once before vouchers and shipping', () => {
  assert.deepEqual(amounts.listedGoodsTotals([{ price: 250000, listPrice: 300000, quantity: 2 }, { price: 10000, quantity: 3 }]), {
    listedSubtotal: 630000, directDiscount: 100000, saleSubtotal: 530000,
  });
  const totals = amounts.listedGoodsTotals([{ price: 250000, listPrice: 300000, quantity: 2 }]);
  assert.equal(totals.listedSubtotal - totals.directDiscount - 20000 + 30000 - 10000, 500000);
  assert.equal(amounts.listedUnitPrice({ price: 250000, listPrice: 200000 }), 250000);
});

test('wallet error includes the full payable amount and blocks unverifiable balances', () => {
  assert.equal(amounts.insufficientWalletMessage(530000, 530000), null);
  assert.match(amounts.insufficientWalletMessage(200000, 250000), /50\.000/);
  assert.ok(amounts.insufficientWalletMessage(NaN, 250000));
});

test('pending cancellations and shipped seller orders cannot expose another cancellation action', () => {
  const order = { status: 'PENDING', orderItems: [], rawPayload: { sagaState: { cancellation: { state: 'REQUESTED' } } } };
  assert.equal(actions.getCustomerOrderActions(order).cancel, false);
  assert.equal(actions.getCustomerOrderActions({ ...order, rawPayload: { sellerOrders: [{ status: 'SHIPPED' }] } }).cancel, false);
  assert.equal(actions.getCustomerOrderActions({ ...order, rawPayload: { sellerOrders: [{ status: 'CONFIRMED' }] } }).cancel, true);
});
