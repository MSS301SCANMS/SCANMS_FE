import type { CommissionRow } from '../services/commission.service';

const knownMoney = (value: unknown): number | null => value !== null && value !== undefined && value !== '' && Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
export function commissionAmounts(row: CommissionRow) {
  const history = row.adjustmentHistory;
  const current = Number(row.amountVnd);
  const original = knownMoney(history?.originalAmountVnd);
  const recorded = row.transferReference ? knownMoney(history?.ledgerReconciledAmountVnd) : 0;
  const needsReconciliation = Boolean(row.transferReference && (recorded === null || recorded !== current));
  return {
    current, original, recorded, needsReconciliation,
    reduced: original === null ? null : Math.max(0, original - current),
    refunded: knownMoney(history?.refundedAmountVnd),
    pendingRecovery: recorded === null ? null : Math.max(0, recorded - current),
    ready: !row.transferReference && (row.status === 'ELIGIBLE' || row.status === 'ADJUSTED'),
  };
}
