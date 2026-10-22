import type { ReturnDetail } from '../services/return.service';

type ReturnState = Pick<ReturnDetail, 'status' | 'logistics'>;
export function returnArrived(row: ReturnState): boolean {
  return row.status === 'RETURNING' && Boolean(row.logistics?.deliveredAt);
}
export function canReceiveReturn(row: ReturnState): boolean {
  return row.status === 'RETURNING' && Boolean(row.logistics) &&
    (row.logistics?.environment !== 'TEST' || returnArrived(row));
}
export function returnStep(row: ReturnState): number {
  if (['RECEIVED', 'REFUND_PENDING', 'REFUNDED'].includes(row.status)) return 4;
  if (returnArrived(row)) return 3;
  if (row.status === 'RETURNING') return 2;
  if (row.status === 'APPROVED') return 2;
  if (row.status === 'REQUESTED') return 1;
  return 0;
}
