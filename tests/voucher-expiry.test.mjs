import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/voucher-expiry.utils.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { formatVoucherDeadline, voucherExpiryCountdown, voucherExpiryState, VOUCHER_SOON_WINDOW_MS } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
test('voucher transitions at the exact 24-hour and expiry boundaries in the Vietnam time zone', () => {
  const expiresAt = '2026-10-18T23:59:00+07:00';
  const end = Date.parse(expiresAt);
  assert.equal(voucherExpiryState(expiresAt, end - VOUCHER_SOON_WINDOW_MS - 1), 'active');
  assert.equal(voucherExpiryState(expiresAt, end - VOUCHER_SOON_WINDOW_MS), 'soon');
  assert.equal(voucherExpiryState(expiresAt, end - 1), 'soon');
  assert.equal(voucherExpiryState(expiresAt, end), 'expired');
  assert.equal(voucherExpiryState(expiresAt, end + 1), 'expired');
  assert.equal(voucherExpiryState(null, end), 'active');
  assert.equal(voucherExpiryState('invalid', end), 'expired');
});

test('deadlines describe the Vietnam time and date independently of the browser time zone', () => {
  assert.equal(formatVoucherDeadline('2026-12-16T19:06:00Z'), '02:06 sáng, ngày 17/12/2026');
  assert.equal(formatVoucherDeadline('2026-12-17T05:00:00Z'), '12:00 trưa, ngày 17/12/2026');
  assert.equal(formatVoucherDeadline('2026-12-17T08:30:00Z'), '15:30 chiều, ngày 17/12/2026');
  assert.equal(formatVoucherDeadline('2026-12-17T13:30:00Z'), '20:30 tối, ngày 17/12/2026');
  assert.equal(formatVoucherDeadline('2026-12-16T17:00:00Z'), '00:00 sáng, ngày 17/12/2026');
  assert.equal(formatVoucherDeadline(null), null);
  assert.equal(formatVoucherDeadline('invalid'), null);
});

test('countdown only appears in the last 24 hours and stops at expiry', () => {
  const expiry = '2026-12-17T00:00:00Z';
  const end = Date.parse(expiry);
  assert.equal(voucherExpiryCountdown(expiry, end - 86400001), null);
  assert.equal(voucherExpiryCountdown(expiry, end - 86400000), 'Còn 24 giờ');
  assert.equal(voucherExpiryCountdown(expiry, end - (3 * 60 + 12) * 60000), 'Còn 3 giờ 12 phút');
  assert.equal(voucherExpiryCountdown(expiry, end - 60000), 'Còn 1 phút');
  assert.equal(voucherExpiryCountdown(expiry, end - 1), 'Còn dưới 1 phút');
  assert.equal(voucherExpiryCountdown(expiry, end), null);
  assert.equal(voucherExpiryCountdown(null, end), null);
});
