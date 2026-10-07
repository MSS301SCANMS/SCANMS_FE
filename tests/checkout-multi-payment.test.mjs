import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/utils/checkoutPayments.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { checkoutPaymentStatus, loadCheckoutPayments, loadOrderPayment } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('two shops receive independent QR links and one failure retains both created orders', async () => {
  const calls = [];
  const orders = await loadCheckoutPayments([{ publicOrderCode: 'shop-A', finalAmount: 100 }, { publicOrderCode: 'shop-B', finalAmount: 200 }], async code => {
    calls.push(code);
    if (code === 'shop-B') throw new Error('Provider timeout');
    return { qrCode: `qr-${code}`, checkoutUrl: `https://pay.payos.vn/${code}`, amount: 100, paymentStatus: 'WAITING_PAYMENT' };
  });
  assert.deepEqual(calls, ['shop-A', 'shop-B']);
  assert.equal(orders[0].payos.qrCode, 'qr-shop-A');
  assert.equal(orders[1].paymentError, 'Provider timeout');
  assert.equal(orders[1].finalAmount, 200);
  assert.equal(checkoutPaymentStatus(orders), 'WAITING_PAYMENT');
  const retried = await loadOrderPayment(orders[1], async code => ({ qrCode: `qr-${code}`, amount: 200 }));
  assert.equal(retried.payos.qrCode, 'qr-shop-B');
  assert.equal(retried.paymentError, undefined);
});

test('paying the first shop never marks a multi-shop checkout fully paid', () => {
  const orders = [{ publicOrderCode: 'a', paymentStatus: 'PAID' }, { publicOrderCode: 'b', paymentStatus: 'WAITING_PAYMENT' }];
  assert.equal(checkoutPaymentStatus(orders), 'WAITING_PAYMENT');
  assert.equal(checkoutPaymentStatus([]), 'WAITING_PAYMENT');
  orders[1].paymentStatus = 'PAID';
  assert.equal(checkoutPaymentStatus(orders), 'PAID');
});

test('paid orders do not allocate another link and missing QR is a recoverable order error', async () => {
  const paid = { publicOrderCode: 'a', paymentStatus: 'PAID' };
  assert.equal(await loadOrderPayment(paid, () => { throw new Error('Must not call provider'); }), paid);
  const missing = await loadOrderPayment({ publicOrderCode: 'b' }, async () => ({ amount: 200 }));
  assert.match(missing.paymentError, /PayOS/);
  assert.equal(missing.payos, undefined);
  const resumed = await loadOrderPayment({ publicOrderCode: 'cancelled', paymentStatus: 'CANCELLED' }, async () => ({ qrCode: 'new-attempt', amount: 200 }));
  assert.equal(resumed.paymentStatus, 'WAITING_PAYMENT');
});
