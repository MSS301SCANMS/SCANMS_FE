import api from './api';
import { unwrapApi, unwrapList } from '@/utils/api-response';
import { serverDate } from '../utils/server-date';

export type ReturnStatus =
  | 'REQUESTED' | 'SHOP_APPROVED' | 'PICKUP_BOOKED' | 'SHOP_REJECTED' | 'EXPIRED'
  | 'RETURN_SHIPPED' | 'RETURN_RECEIVED' | 'INSPECTING'
  | 'INSPECTION_REJECTED' | 'REFUND_PENDING' | 'REFUND_PROCESSING'
  | 'REFUND_FAILED' | 'EXCHANGE_PENDING' | 'EXCHANGE_SHIPPED'
  | 'AWAITING_CUSTOMER_CONFIRMATION' | 'COMPLETED' | 'DISPUTED'
  | 'REFUNDED' | 'CLOSED'
  | 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNING' | 'RECEIVED' | 'CANCELLED';

export interface ReturnShipment {
  id: string;
  carrierName: string;
  trackingNumber: string;
  receiptImageUrl?: string | null;
  shippedAt: string;
  receivedAt?: string | null;
  provider?: 'MOCK' | 'GHN_STAGING' | null;
  providerStatus?: string | null;
  bookedAt?: string | null;
  pickedUpAt?: string | null;
  feeAmount?: number | null;
}

export interface ReturnAddress {
  name: string;
  phone: string;
  address: string;
  wardName: string;
  provinceName: string;
  districtName?: string;
}

export interface PickupBookingInput extends ReturnAddress {
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface ReturnDetail {
  refundReference?: string | null;
  decisionReason?: string | null;
  refundAmountVnd?: number;
  simulationEnabled?: boolean;
  logistics?: { environment: string; trackingCode: string; carrier: string; status: string; pickedUpAt?: string; deliveredAt?: string; receivedAt?: string } | null;
  id: string;
  orderId: string;
  reason: string;
  details?: string | null;
  imageUrls: string[];
  unboxingVideoUrl: string;
  status: ReturnStatus;
  shopResponse?: string | null;
  submittedAt: string;
  shipByAt?: string | null;
  returnAddress?: string | null;
  returnInstructions?: string | null;
  pickupContact?: PickupBookingInput | null;
  returnWarehouse?: ReturnAddress | null;
  pickupProviderMode?: 'mock' | 'staging' | 'disabled';
  pickupSimulationEnabled?: boolean;
  receivedAt?: string | null;
  inspectionEscalatedAt?: string | null;
  inspectionNotes?: string | null;
  resolution?: 'REFUND' | 'EXCHANGE' | null;
  order: { id: string; externalOrderSn: string; storeName: string; customerName?: string | null; customerPhone?: string | null; shippingAddress?: string | null };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | string;
    orderItem: { product: { title: string; imageUrl?: string | null } };
  }>;
  customerShipment?: ReturnShipment | null;
  exchangeShipment?: ReturnShipment | null;
  refund?: {
    amount: number | string;
    method: string;
    status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
    failureReason?: string | null;
    processedAt?: string | null;
  } | null;
  dispute?: {
    id: string;
    reason: string;
    details: string;
    status: 'OPEN' | 'RESOLVED';
    ruling?: string | null;
    resolutionNotes?: string | null;
  } | null;
  events: Array<{ id: string; type: string; createdAt: string }>;
}

export interface ReturnDisputeRecord {
  id: string;
  reason: string;
  details: string;
  openedAt: string;
  returnRequest: ReturnDetail;
}

export function normalizeReturn(raw: any): ReturnDetail {
  if (!raw) return raw;
  const id = raw.id || raw.returnRequestId;
  const evidence = raw.evidenceRefs || {};
  return {
    id,
    orderId: raw.orderId || raw.orderItemId || '',
    reason: raw.reason || '',
    details: evidence.details || evidence.notes || null,
    imageUrls: evidence.images || evidence.imageUrls || [],
    unboxingVideoUrl: evidence.unboxingVideoUrl || evidence.videos?.[0] || '',
    status: (raw.status || 'REQUESTED') as ReturnStatus,
    shopResponse: raw.shopResponse?.response || null,
    decisionReason: raw.decisionReason,
    refundReference: raw.refundReference,
    refundAmountVnd: raw.refundAmountVnd,
    simulationEnabled: raw.simulationEnabled,
    logistics: raw.logistics,
    submittedAt: serverDate(raw.requestedAt || raw.createdAt) || new Date().toISOString(),
    order: {
      id: raw.orderId || '',
      externalOrderSn: raw.orderId || '',
      storeName: raw.storeName || '',
    },
    items: [{ id: raw.orderItemId, quantity: raw.quantity, unitPrice: raw.unitPrice,
      orderItem: { product: { title: raw.productSnapshot?.title || raw.productSnapshot?.name || 'Sản phẩm', imageUrl: raw.productSnapshot?.imageUrl } } }],
    refund: { amount: raw.refundAmountVnd || 0, method: 'WALLET', status: raw.status === 'REFUNDED' && raw.refundReference ? 'SUCCEEDED' : 'PENDING', processedAt: raw.resolvedAt },
    events: [],
  } as ReturnDetail;
}

const unsupported = (action: string) => {
  throw new Error(`BE Spring chỉ hỗ trợ /returns CRUD + decision. Không có API: ${action}`);
};

export const returnService = {
  getOne: async (id: string) =>
    normalizeReturn(unwrapApi(await api.get(`/commerce/returns/${id}`, { headers: { 'x-skip-cache': 'true' } }))),

  cancel: async (id: string) => normalizeReturn(unwrapApi(await api.post(`/commerce/returns/${id}/cancel`))),
  send: async (id: string, data: { environment: 'TEST' | 'MANUAL'; carrier?: string; trackingCode?: string }) =>
    normalizeReturn(unwrapApi(await api.post(`/commerce/returns/${id}/shipment`, data))),

  getShopQueue: async (page = 1, status?: ReturnStatus) => {
    let items = unwrapList(await api.get('/returns', { headers: { 'x-skip-cache': 'true' } })).map(
      normalizeReturn,
    );
    if (status) items = items.filter((i) => i.status === status);
    return { total: items.length, page, items };
  },

  create: async (data: {
    orderItemId: string;
    quantity: number;
    idempotencyKey: string;
    reason: string;
    evidenceRefs?: Record<string, unknown>;
  }) => normalizeReturn(unwrapApi(await api.post('/commerce/returns', data))),

  decide: async (
    id: string,
    data: { status: 'APPROVED' | 'REJECTED' | string; decisionReason?: string },
  ) =>
    normalizeReturn(
      unwrapApi(
        await api.post(`/returns/${id}/decision`, {
          status: data.status,
          decisionReason: data.decisionReason,
        }),
      ),
    ),

  setInstructions: async (_id: string, _data: { returnAddress: string; returnInstructions: string }) =>
    unsupported('returns/{id}/instructions'),
  saveWarehouse: async (_id: string, _data: ReturnAddress) => unsupported('returns/{id}/warehouse'),
  bookPickup: async (_id: string, _data: PickupBookingInput) => unsupported('returns/{id}/pickup'),
  simulatePickup: async (id: string, data: { status: 'picked' | 'delivered' }) =>
    normalizeReturn(unwrapApi(await api.post(`/commerce/returns/${id}/simulation`, data))),
  syncPickup: async (_id: string) => unsupported('returns/{id}/pickup/sync'),
  submitShipment: async (_id: string, _data: { carrierName: string; trackingNumber: string; receipt: File }) =>
    unsupported('returns/{id}/return-shipment'),
  correctShipment: async (_id: string, _data: { carrierName: string; trackingNumber: string }) =>
    unsupported('returns/{id}/return-shipment'),
  confirmReceipt: async (id: string) => normalizeReturn(unwrapApi(await api.post(`/commerce/returns/${id}/receipt`))),
  startInspection: async (_id: string) => unsupported('returns/{id}/inspection/start'),
  submitInspection: async (
    _id: string,
    _data: { resolution: 'REFUND' | 'EXCHANGE' | 'REJECT'; notes: string },
  ) =>
    unsupported('kết quả kiểm tra hàng hoặc đổi hàng; backend chưa hỗ trợ quy trình này'),
  submitExchangeShipment: async (_id: string, _data: { carrierName: string; trackingNumber: string }) =>
    unsupported('returns/{id}/exchange-shipment'),
  confirmCompletion: async (_id: string) => unsupported('returns/{id}/confirmation'),
  openDispute: async (_id: string, _data: { reason: string; details: string }) =>
    unsupported('returns/{id}/disputes'),
  getAdminDisputes: async (): Promise<ReturnDisputeRecord[]> => unsupported('danh sách khiếu nại riêng'),
  getAdminStalled: async (): Promise<ReturnDetail[]> => unsupported('thời hạn kiểm tra hàng đã nhận'),
  resolveDispute: async (
    _id: string,
    _data: { ruling: 'APPROVE_REFUND' | 'APPROVE_EXCHANGE' | 'UPHOLD_SHOP'; notes: string },
  ) =>
    unsupported('phân xử khiếu nại hoặc đổi hàng; sử dụng xét duyệt yêu cầu đổi trả trong khu vực manager'),
};
