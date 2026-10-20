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
  startCustomerSimulation: async (orderId: string): Promise<GhnTrackingDetail> => {
    const shipment = unwrapApi<any>(await api.get(`/shipments/by-seller-order/${orderId}`));
    return {
      orderCode: shipment?.trackingCode || orderId,
      carrier: shipment?.carrier || 'INTERNAL',
      status: shipment?.status || 'PENDING',
      statusText: shipment?.status || 'PENDING',
      trackingUrl: null,
      shipperName: null,
      shipperPhone: null,
      expectedDeliveryTime: null,
      timeline: [],
      simulationAvailable: false,
      isSimulation: true,
    };
  },

  completeCustomerSimulation: async (orderId: string): Promise<{ message: string; status: string }> => {
    const shipment = unwrapApi<any>(await api.get(`/shipments/by-seller-order/${orderId}`));
    const id = shipment?.shipmentId || shipment?.id;
    if (!id) throw new Error('Không tìm thấy vận đơn');
    await api.patch(`/shipments/${id}/status`, null, { params: { status: 'DELIVERED' } });
    return { message: 'Đã cập nhật giao hàng thành công', status: 'DELIVERED' };
  },

  createGhnOrder: async (
    orderId: string,
    payload?: CreateGhnOrderPayload,
  ): Promise<GhnOrderResult> => {
    const created = unwrapApi<any>(
      await api.post('/shipments', {
        sellerOrderId: payload?.sellerOrderId || orderId,
        carrier: payload?.carrier || 'GHN',
        trackingCode: payload?.trackingCode,
      }),
    );
    return {
      success: true,
      message: 'Đã tạo vận đơn',
      orderId,
      orderCode: created?.trackingCode || created?.shipmentId || orderId,
      trackingNumber: created?.trackingCode || '',
      carrier: created?.carrier || 'GHN',
      totalFee: 0,
      expectedDeliveryTime: null,
      codAmount: payload?.codAmount || 0,
      isRealGhn: false,
      environment: payload?.environment || 'TEST',
      orderStatus: created?.status || 'PENDING',
    };
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
    // Try by shipment id first; fallback list scan
    try {
      const shipment = unwrapApi<any>(await api.get(`/shipments/${orderCode}`));
      return {
        orderCode: shipment?.trackingCode || orderCode,
        carrier: shipment?.carrier || 'INTERNAL',
        status: shipment?.status || 'UNKNOWN',
        statusText: shipment?.status || 'UNKNOWN',
        trackingUrl: null,
        shipperName: null,
        shipperPhone: null,
        expectedDeliveryTime: null,
        timeline: [],
      };
    } catch {
      const list = unwrapApi<any[]>(await api.get('/shipments')) || [];
      const shipment = (Array.isArray(list) ? list : []).find(
        (s) => s.trackingCode === orderCode || s.shipmentId === orderCode || s.id === orderCode,
      );
      return {
        orderCode,
        carrier: shipment?.carrier || 'INTERNAL',
        status: shipment?.status || 'UNKNOWN',
        statusText: shipment?.status || 'UNKNOWN',
        trackingUrl: null,
        shipperName: null,
        shipperPhone: null,
        expectedDeliveryTime: null,
        timeline: [],
      };
    }
  },

  getPrintToken: async (_orderCode: string) => {
    throw new Error('BE chưa hỗ trợ in phiếu GHN.');
  },
};
