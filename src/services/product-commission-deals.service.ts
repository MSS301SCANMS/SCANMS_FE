import api from './api';

export interface ProductCommissionDeal {
  id: string; collaboratorId: string; collaboratorName: string; storeId: string; storeName: string;
  productId: string; productName: string; imageUrl?: string; extraPoints: number;
  baseRate: number | string; totalRate: number | string | null;
  message: string; response?: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'SUPERSEDED' | 'ENDED';
  createdAt: string; approvedAt?: string; endedAt?: string;
}
export interface ProductCommissionRate { baseRate: number | string; currentPolicyRate?: number | string; extraPoints: number; totalRate: number | string; dealId?: string; policyId: string }
const unwrap = (result: any) => result?.result ?? result?.data ?? result;
const path = '/referrals/commission-deals';
export const productCommissionDeals = {
  async list(mode: 'kol' | 'shop'): Promise<ProductCommissionDeal[]> {
    const rows = unwrap(await api.get(`${path}/${mode === 'kol' ? 'mine' : 'shop'}`, { headers: { 'x-skip-cache': '1' } }));
    if (!Array.isArray(rows)) throw new Error('Danh sách deal chưa hợp lệ. Vui lòng thử lại.');
    return rows;
  },
  async rate(productId: string): Promise<ProductCommissionRate> {
    const value = unwrap(await api.get(`${path}/rate`, { params: { productId }, headers: { 'x-skip-cache': '1' } }));
    if (value?.baseRate == null || value?.totalRate == null) throw new Error('Chưa tải được chính sách hoa hồng.');
    return value;
  },
  async propose(productId: string, extraPoints: number, message: string): Promise<ProductCommissionDeal> {
    return unwrap(await api.post(path, { productId, extraPoints, message }));
  },
  async respond(id: string, decision: 'APPROVED' | 'REJECTED' | 'ENDED', response: string): Promise<ProductCommissionDeal> {
    return unwrap(await api.post(`${path}/${id}/respond`, { decision, response }));
  },
  async cancel(id: string): Promise<ProductCommissionDeal> { return unwrap(await api.post(`${path}/${id}/cancel`)); },
};
