import api from '../lib/api';

export interface CreateGhnOrderPayload {
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
  orderStatus: string;
}

export interface GhnTrackingTimeline {
  status: string;
  title: string;
  description: string;
  time: string | null;
  completed: boolean;
}

export interface GhnTrackingDetail {
  orderCode: string;
  carrier: string;
  status: string;
  statusText: string;
  trackingUrl: string;
  expectedDeliveryTime: string | null;
  timeline: GhnTrackingTimeline[];
  ghnRawDetail?: any;
}

export const shippingService = {
  /**
   * Tạo vận đơn trên hệ thống GHN Express
   */
  createGhnOrder: async (
    orderId: string,
    payload?: CreateGhnOrderPayload,
  ): Promise<GhnOrderResult> => {
    const res = await api.post(`/shipping/ghn/create-order/${orderId}`, payload || {});
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

