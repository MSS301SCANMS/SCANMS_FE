import api from './api';
import { unwrapApi } from '@/utils/api-response';

export interface CreateGhnOrderPayload {
  environment?: 'LIVE' | 'TEST';
  note?: string;
  requiredNote?: 'CHOTHUHANG' | 'CHOXEMHANGKHONGTHU' | 'KHONGCHOXEMHANG';
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  codAmount?: number;
  sellerOrderId?: string;
  carrier?: string;
  trackingCode?: string;
}

export interface GhnOrderResult {
  success: boolean;
  message: string;
  orderId: string;
  orderCode: string;
  trackingNumber: string;
  carrier: string;
  totalFee: number;
  expectedDeliveryTime: string | null;
  codAmount: number;
  isRealGhn: boolean;
  environment: 'LIVE' | 'TEST';
  orderStatus: string;
}

export interface GhnTrackingTimeline {
  status: string;
  title: string;
  description?: string;
  warehouse?: string | null;
  shipperName?: string | null;
  shipperPhone?: string | null;
  time: string | null;
  completed: boolean;
}

export interface GhnTrackingDetail {
  simulationAvailable?: boolean;
  isSimulation?: boolean;
  simulationStartedAt?: string;
  nextEventAt?: string | null;
  shipperPhoneDisplay?: string | null;
  shipperCanCall?: boolean;
  orderCode: string;
  carrier: string;
  status: string;
  statusText: string;
  trackingUrl: string | null;
  environment?: 'LIVE' | 'TEST';
  shipperName: string | null;
  shipperPhone: string | null;
  isStale?: boolean;
  lastCheckedAt?: string | null;
  expectedDeliveryTime: string | null;
  timeline: GhnTrackingTimeline[];
  ghnRawDetail?: any;
}

/** Map Nest GHN shipping UI → Spring /shipments APIs */
export const shippingService = {
  startCustomerSimulation: async (orderId: string): Promise<GhnTrackingDetail> =>
    unwrapApi(await api.post(`/commerce/seller-orders/${orderId}/simulation/start`)),

  completeCustomerSimulation: async (orderId: string): Promise<{ message: string; status: string }> => {
    const result = unwrapApi<any>(await api.post(`/commerce/seller-orders/${orderId}/simulation/complete`));
    return { message: 'Đã giao hàng mô phỏng thành công', status: result.status };
  },

  createGhnOrder: async (orderId: string, payload?: CreateGhnOrderPayload): Promise<GhnOrderResult> => {
    const created = unwrapApi<any>(await api.post(`/commerce/seller-orders/${orderId}/dispatch`, {
      environment: payload?.environment || 'TEST', carrier: payload?.carrier, trackingCode: payload?.trackingCode,
    }));
    return { success: true, message: 'Đã giao hàng mô phỏng', orderId,
      orderCode: created.orderCode, trackingNumber: created.orderCode, carrier: created.carrier,
      totalFee: 0, expectedDeliveryTime: null, codAmount: 0, isRealGhn: false,
      environment: created.environment, orderStatus: created.status };
  },

  calculateFee: async (_payload: {
    toDistrictId: number;
    toWardCode: string;
    weight?: number;
    insuranceValue?: number;
  }) => {
    return { totalFee: 0, message: 'BE chưa tích hợp tính phí GHN — dùng phí nội bộ 0đ' };
  },

  trackOrder: async (orderCode: string): Promise<GhnTrackingDetail> => {
    return unwrapApi<GhnTrackingDetail>(await api.get(`/commerce/shipments/${encodeURIComponent(orderCode)}`, { headers: { 'x-skip-cache': 'true' } }));
  },

  getPrintToken: async (_orderCode: string) => {
    throw new Error('BE chưa hỗ trợ in phiếu GHN.');
  },
};
