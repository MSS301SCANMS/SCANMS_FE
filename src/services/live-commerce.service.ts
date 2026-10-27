import api from './api';
import { unwrapApi } from '../utils/api-response';

export interface LiveOffer {
  id: string; productId: string; variantId: string; priceVnd: number;
  quantityLimit: number; reservedQuantity: number; startsAt: string; endsAt?: string; status: string;
}
export interface LiveVoucherDrop {
  id: string; voucherId: string; code: string; issuerType: string; benefitType: string;
  discountType: string; value: number; cap?: number; minimumSubtotal?: number;
  quantity: number; releaseAt: string; expiresAt: string; status: string;
}
export interface LiveCommerce {
  offers: LiveOffer[]; voucherDrops: LiveVoucherDrop[]; pinnedProductId?: string | null;
}
export const isLiveOfferActive = (offer: LiveOffer, now = Date.now()) => offer.status === 'ACTIVE'
  && (!offer.startsAt || Date.parse(offer.startsAt) <= now) && (!offer.endsAt || Date.parse(offer.endsAt) > now)
  && offer.quantityLimit > offer.reservedQuantity;
const fresh = { headers: { 'x-skip-cache': 'true' } };
const path = (id: string) => `/livestreams/${encodeURIComponent(id)}`;
export function liveCommerceErrorMessage(error: any) {
  if (error?.response?.status === 404) return 'Chức năng giá live chưa sẵn sàng ở máy chủ. Vui lòng thử lại sau khi dịch vụ được cập nhật.';
  return error?.response?.data?.message || error?.message || 'Chưa tải được ưu đãi trong live.';
}

export const liveCommerceService = {
  async get(id: string, manage = false): Promise<LiveCommerce> {
    const value = unwrapApi<LiveCommerce>(await api.get(path(id) + '/commerce' + (manage ? '/manage' : ''), fresh));
    if (!value || !Array.isArray(value.offers) || !Array.isArray(value.voucherDrops)) throw new Error('Chưa tải được ưu đãi trong live.');
    return value;
  },
  async offer(id: string, body: { productId: string; variantId: string; priceVnd: number; quantityLimit: number; startsAt?: string; endsAt?: string }): Promise<LiveCommerce> {
    return unwrapApi(await api.post(path(id) + '/offers', body));
  },
  async stopOffer(id: string, offerId: string): Promise<LiveCommerce> {
    return unwrapApi(await api.post(`${path(id)}/offers/${encodeURIComponent(offerId)}/stop`));
  },
  async drop(id: string, body: { voucherId: string; quantity: number; releaseAt?: string; expiresAt: string }): Promise<LiveCommerce> {
    return unwrapApi(await api.post(path(id) + '/voucher-drops', body));
  },
  async cancelDrop(id: string, dropId: string): Promise<LiveCommerce> {
    return unwrapApi(await api.post(`${path(id)}/voucher-drops/${encodeURIComponent(dropId)}/cancel`));
  },
};
