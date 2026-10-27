import assert from 'node:assert/strict';
import test from 'node:test';
import { commissionSchedule } from '../src/utils/commission-schedule.ts';

const pending = { status: 'PENDING', timeline: { deliveredAt: '2026-10-27T03:00:00', returnDeadline: '2026-11-10T03:00:00', hasUnresolvedReturn: false } };
test('uses the actual order deadline with UTC timestamps and counts remaining time', () => {
  const result = commissionSchedule(pending, Date.parse('2026-11-09T02:00:00Z'));
  assert.equal(result.label, 'Còn 1 ngày 1 giờ');
  assert.equal(result.date, '2026-11-10T03:00:00');
});
test('expiry shows reconciliation rather than promising payment', () => {
  const result = commissionSchedule(pending, Date.parse('2026-11-10T03:01:00Z'));
  assert.equal(result.label, 'Đã hết hạn trả hàng');
  assert.match(result.note, /chờ đối soát/);
});
test('open return blocks eligibility even after deadline', () => {
  const result = commissionSchedule({ ...pending, timeline: { ...pending.timeline, hasUnresolvedReturn: true } }, Date.parse('2026-11-12T00:00:00Z'));
  assert.equal(result.label, 'Tạm chờ xử lý trả hàng');
});
test('cancelled and credited commissions override countdown', () => {
  assert.equal(commissionSchedule({ ...pending, status: 'CANCELLED' }).label, 'Đã hủy hoa hồng');
  assert.equal(commissionSchedule({ ...pending, transferReference: 'ledger', paidAt: '2026-11-11T04:00:00Z' }).label, 'Đã ghi vào ví');
});
test('missing dates never invent a payout date', () => {
  assert.equal(commissionSchedule({ ...pending, timeline: { deliveredAt: null, returnDeadline: null } }).date, null);
  assert.equal(commissionSchedule({ ...pending, timeline: undefined, timelineUnavailable: true }).label, 'Chưa tải được hạn trả hàng');
});
