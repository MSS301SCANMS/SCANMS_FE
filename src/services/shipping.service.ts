import api from './api';

export interface CreateGhnOrderPayload {
  environment?: 'LIVE' | 'TEST';
  note?: string;
  requiredNote?: 'CHOTHUHANG' | 'CHOXEMHANGKHONGTHU' | 'KHONGCHOXEMHANG';
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  codAmount?: number;
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

export const shippingService = {
  startCustomerSimulation: async (orderId: string): Promise<GhnTrackingDetail> => {
    const res = await api.post(`/shipping/ghn/simulation/${encodeURIComponent(orderId)}/start`, {});
    return res.data;
  },
  completeCustomerSimulation: async (orderId: string): Promise<{ message: string; status: string }> => {
    const res = await api.post(`/shipping/ghn/simulation/${encodeURIComponent(orderId)}/complete`, {});
    return res.data;
  },
  /**
   * Tạo vận đơn trên hệ thống GHN Express
   */
  createGhnOrder: async (
    orderId: string,
    payload?: CreateGhnOrderPayload,
  ): Promise<GhnOrderResult> => {
    const res = await api.post(`/shipping/ghn/create-order/${orderId}`, payload || {}, { timeout: 60000 });
    return res.data;
  },

  /**
   * Tính phí giao hàng nhanh GHN
   */
  calculateFee: async (payload: {
    toDistrictId: number;
    toWardCode: string;
    weight?: number;
    insuranceValue?: number;
  }) => {
    const res = await api.post('/shipping/ghn/fee', payload);
    return res.data;
  },

  /**
   * Tra cứu hành trình đơn hàng GHN
   */
  trackOrder: async (orderCode: string): Promise<GhnTrackingDetail> => {
    const res = await api.get(`/shipping/ghn/track/${encodeURIComponent(orderCode)}`);
    return res.data;
  },

  /**
   * Lấy token in phiếu giao hàng A6 chuẩn GHN
   */
  getPrintToken: async (orderCode: string) => {
    const res = await api.get(`/shipping/ghn/print-token/${encodeURIComponent(orderCode)}`);
    return res.data;
  },
};
