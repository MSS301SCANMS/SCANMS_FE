import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const calls = [];
const walletId = 'e6ec9638-4e31-40fa-b27a-f52f805f4df5';
let failNext = false;
let paymentStatus = 'PENDING';
const payment = () => ({ paymentId: 'topup-1', purpose: 'TOP_UP', providerOrderCode: 123,
  amountVnd: 10000, status: paymentStatus, checkoutUrl: 'https://pay.payos.vn/web/fixture', qrCode: 'qr',
  bin: '970422', accountNumber: '123456789', accountName: 'SCANMS', description: 'SC123',
  expiresAt: '2026-10-21T05:00:00', verifiedAt: null });
const fakeFinance = {
  async wallet() { return { walletId, availableBalanceVnd: 10000, heldBalanceVnd: 0, status: 'ACTIVE' }; },
  async capabilities() { return { paymentAvailable: true, sandboxTopUpAvailable: true }; },
  async topup(...args) { calls.push({ channel: 'payos', args }); if (failNext) { failNext = false; throw new Error('response lost'); } return payment(); },
  async sandboxTopup(...args) { calls.push({ channel: 'sandbox', args }); return { balanceAfterVnd: 10000 }; },
  async payments() { return { items: [{ ...payment(), purpose: 'ORDER', paymentId: 'order-payment' }, payment()] }; },
  async paymentStatus() { return payment(); },
  async cancelPayment() { return { ...payment(), status: 'CANCELLED' }; },
  async ledger() { return { items: [{ transactionId: 'ledger', type: 'TOP_UP', direction: 'CREDIT', amountVnd: 10000,
    balanceBeforeVnd: 20000, balanceAfterVnd: 30000, referenceType: 'TOP_UP', referenceId: 'topup-1' }], total: 1, page: 0, size: 20 }; },
};
const memory = new Map();
const originalStorage = globalThis.sessionStorage;
globalThis.sessionStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
globalThis.__springWalletFinance = fakeFinance;
const source = (await readFile(new URL('../src/services/wallet.service.ts', import.meta.url), 'utf8'))
  .replace(/import \{ financeService[^\n]+from '\.\/finance.service';/, 'const financeService = globalThis.__springWalletFinance;');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { walletService } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test.after(() => { if (originalStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = originalStorage; delete globalThis.__springWalletFinance; });
test.beforeEach(() => { calls.length = 0; memory.clear(); paymentStatus = 'PENDING'; failNext = false; });

test('Sandbox uses its own endpoint and the confirmed ledger balance', async () => {
  const result = await walletService.topUpDemo(10000);
  assert.equal(result.availableBalance, '10000');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].channel, 'sandbox');
});
test('payOS preserves QR and transfer details and interprets UTC expiry', async () => {
  const result = await walletService.createPayosTopUp(10000);
  assert.equal(result.bin, '970422'); assert.equal(result.accountNumber, '123456789');
  assert.equal(result.accountName, 'SCANMS'); assert.equal(result.description, 'SC123');
  assert.equal(result.expiresAt, '2026-10-21T05:00:00Z'); assert.equal(result.qrCode, 'qr');
});
test('a lost create response retries the original command key', async () => {
  failNext = true;
  await assert.rejects(walletService.createPayosTopUp(10000));
  await walletService.createPayosTopUp(10000);
  assert.equal(calls[0].args[2], calls[1].args[2]);
  await walletService.createPayosTopUp(10000);
  assert.notEqual(calls[1].args[2], calls[2].args[2]);
});
test('successful server status updates the UI as paid, and pending orders are not restored as wallet top-ups', async () => {
  assert.equal((await walletService.pendingPayosTopUp()).id, 'topup-1');
  paymentStatus = 'SUCCESS';
  assert.equal((await walletService.payosTopUpStatus('topup-1')).status, 'PAID');
});
test('ledger preserves balances and identifies a payOS credit', async () => {
  const ledger = await walletService.getMyLedger();
  assert.equal(ledger.entries[0].balanceBefore, '20000');
  assert.equal(ledger.entries[0].balanceAfter, '30000');
  assert.equal(ledger.entries[0].referenceType, 'TOPUP_PAYOS');
});
