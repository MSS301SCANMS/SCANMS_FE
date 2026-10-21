import api from './api';
import { unwrapApi } from '@/utils/api-response';

export type ShopReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RETURNING' | 'RECEIVED' | 'REFUND_PENDING' | 'REFUNDED' | 'CANCELLED';
export interface ShopReturnRequest {
  returnRequestId: string;
  orderId: string;
  sellerOrderId: string;
  orderItemId: string;
  storeId: string;
  storeName: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  productImageUrl: string;
  quantity: number;
  refundAmountVnd: number | null;
  status: ShopReturnStatus;
  reason: string;
  evidenceRefs: Record<string, unknown> | null;
  shopResponse: { response: string; imageUrls: string[]; submittedAt: string } | null;
  decisionReason: string | null;
  requestedAt: string | null;
  deliveredAt: string | null;
  returnDeadline: string | null;
  resolvedAt: string | null;
}

export const shopReturnsService = {
  async list(signal?: AbortSignal): Promise<ShopReturnRequest[]> {
    const result = unwrapApi(await api.get('/returns/shop', { signal, headers: { 'x-skip-cache': 'true' } }));
    if (!Array.isArray(result)) throw new Error('Chưa tải được dữ liệu đổi trả. Vui lòng thử lại.');
    return result;
  },
  async respond(id: string, response: string, imageUrls: string[]): Promise<ShopReturnRequest> {
    return unwrapApi(await api.post(`/returns/${encodeURIComponent(id)}/shop-response`, { response, imageUrls }));
  },
};

export function safeReturnMedia(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
