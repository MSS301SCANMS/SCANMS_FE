import api from './api';
import { unwrapApi } from '../utils/api-response';

export interface CommissionRow {
  commissionId: string; orderItemId: string; collaboratorId: string;
  rate: number | string; basisVnd: number; amountVnd: number;
  status: 'PENDING' | 'ELIGIBLE' | 'PAID' | 'CREDITED' | 'ADJUSTED' | 'CANCELLED';
  transferReference?: string | null; createdAt: string; paidAt?: string | null;
  adjustmentHistory?: { productName?: string; originalBasisVnd?: number; originalAmountVnd?: number; refundedAmountVnd?: number; beforeAmountVnd?: number; ledgerReconciledAmountVnd?: number; reversalTransactionId?: string; adjustedAt?: string; finalizedAt?: string };
}
export const commissionService = {
  async list(): Promise<CommissionRow[]> {
    const response = await api.get('/commissions', { headers: { 'x-skip-cache': 'true' } });
    const rows = unwrapApi<unknown>(response);
    const amount = (value: unknown) => value !== null && value !== '' && value !== undefined && Number.isSafeInteger(Number(value)) && Number(value) >= 0;
    const statuses = ['PENDING', 'ELIGIBLE', 'PAID', 'CREDITED', 'ADJUSTED', 'CANCELLED'];
    if (!Array.isArray(rows) || rows.some((row: CommissionRow) => !row || !row.commissionId || !row.orderItemId || !row.collaboratorId || !amount(row.amountVnd) || !amount(row.basisVnd) || row.rate === null || row.rate === undefined || row.rate === '' || !Number.isFinite(Number(row.rate)) || Number(row.rate) < 0 || Number(row.rate) > 100 || !statuses.includes(row.status))) throw new Error('Dữ liệu hoa hồng chưa hợp lệ. Vui lòng tải lại.');
    return rows;
  },
};
