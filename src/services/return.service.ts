import api from './api';

export type ReturnStatus =
  | 'REQUESTED' | 'SHOP_APPROVED' | 'PICKUP_BOOKED' | 'SHOP_REJECTED' | 'EXPIRED'
  | 'RETURN_SHIPPED' | 'RETURN_RECEIVED' | 'INSPECTING'
  | 'INSPECTION_REJECTED' | 'REFUND_PENDING' | 'REFUND_PROCESSING'
  | 'REFUND_FAILED' | 'EXCHANGE_PENDING' | 'EXCHANGE_SHIPPED'
  | 'AWAITING_CUSTOMER_CONFIRMATION' | 'COMPLETED' | 'DISPUTED'
  | 'REFUNDED' | 'CLOSED';

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

const unwrap = <T,>(response: unknown): T => {
  const value = response as { data?: { data?: T } | T };
  return ((value?.data as { data?: T } | undefined)?.data ?? value?.data ?? response) as T;
};

export const returnService = {
  getOne: async (id: string) => unwrap<ReturnDetail>(await api.get(`/returns/${id}`, {
    headers: { 'x-skip-cache': 'true' },
  })),
  getShopQueue: async (page = 1, status?: ReturnStatus) =>
    unwrap<{ total: number; page: number; items: ReturnDetail[] }>(
      await api.get('/returns/shop', { params: { page, status }, headers: { 'x-skip-cache': 'true' } }),
    ),
  setInstructions: async (id: string, data: { returnAddress: string; returnInstructions: string }) =>
    unwrap<ReturnDetail>(await api.patch(`/returns/${id}/instructions`, data)),
  saveWarehouse: async (id: string, data: ReturnAddress) =>
    unwrap<ReturnDetail>(await api.patch(`/returns/${id}/warehouse`, data)),
  bookPickup: async (id: string, data: PickupBookingInput) =>
    unwrap<ReturnDetail>(await api.post(`/returns/${id}/pickup`, data)),
  simulatePickup: async (id: string, data: { status: 'picked' | 'delivered' }) =>
    unwrap<ReturnDetail>(await api.patch(`/returns/${id}/pickup/simulate`, data)),
  syncPickup: async (id: string) => unwrap<ReturnDetail>(await api.post(`/returns/${id}/pickup/sync`)),
  submitShipment: async (id: string, data: { carrierName: string; trackingNumber: string; receipt: File }) => {
    const body = new FormData();
    body.append('carrierName', data.carrierName.trim());
    body.append('trackingNumber', data.trackingNumber.trim());
    body.append('receipt', data.receipt);
    return unwrap<ReturnDetail>(await api.post(`/returns/${id}/return-shipment`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }));
  },
  correctShipment: async (id: string, data: { carrierName: string; trackingNumber: string }) =>
    unwrap<ReturnDetail>(await api.patch(`/returns/${id}/return-shipment`, data)),
  confirmReceipt: async (id: string) => unwrap<ReturnDetail>(await api.patch(`/returns/${id}/receipt`)),
  startInspection: async (id: string) => unwrap<ReturnDetail>(await api.patch(`/returns/${id}/inspection/start`)),
  submitInspection: async (id: string, data: { resolution: 'REFUND' | 'EXCHANGE' | 'REJECT'; notes: string }) =>
    unwrap<ReturnDetail>(await api.patch(`/returns/${id}/inspection/result`, data)),
  submitExchangeShipment: async (id: string, data: { carrierName: string; trackingNumber: string }) =>
    unwrap<ReturnDetail>(await api.post(`/returns/${id}/exchange-shipment`, data)),
  confirmCompletion: async (id: string) => unwrap<ReturnDetail>(await api.post(`/returns/${id}/confirmation`)),
  openDispute: async (id: string, data: { reason: string; details: string }) =>
    unwrap<ReturnDetail>(await api.post(`/returns/${id}/disputes`, data)),
  getAdminDisputes: async () => unwrap<ReturnDisputeRecord[]>(await api.get('/admin/return-disputes', {
    headers: { 'x-skip-cache': 'true' },
  })),
  getAdminStalled: async () => unwrap<ReturnDetail[]>(await api.get('/admin/return-disputes/overdue-inspections', {
    headers: { 'x-skip-cache': 'true' },
  })),
  resolveDispute: async (id: string, data: {
    ruling: 'APPROVE_REFUND' | 'APPROVE_EXCHANGE' | 'UPHOLD_SHOP'; notes: string;
  }) => unwrap<ReturnDetail>(await api.patch(`/admin/return-disputes/${id}/resolve`, data)),
};
