import axios from 'axios';
import api from './api';
import { financeService } from './finance.service';
import type { StoreResponse } from '../types/backend.generated';

export const usesLegacyCheckout = import.meta.env.VITE_COMMERCE_BACKEND === 'legacy';
const unwrap = (response: any) => response?.result ?? response?.data?.data ?? response?.data ?? response;
const legacyFinance = axios.create({ baseURL: import.meta.env.VITE_LEGACY_FINANCE_URL || 'http://127.0.0.1:3000/api', timeout: 60000 });
legacyFinance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
legacyFinance.interceptors.response.use(response => response, error => {
  const message = error.response?.data?.message || error.message || 'Không kết nối được dịch vụ thanh toán PayOS.';
  return Promise.reject(new Error(message));
});

const checkout = axios.create({ baseURL: import.meta.env.VITE_CHECKOUT_API_URL || '/api/v1', timeout: 60000 });
checkout.interceptors.request.use(config => {
  const token = sessionStorage.getItem('scanms-access-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const checkoutService = {
  async create(input: unknown) {
    if (usesLegacyCheckout) return unwrap(await api.post('/orders', input));
    const response = await checkout.post('/checkout', input);
    return response.data.result;
  },
  async quote(input: { couponCode?: string; items: { productId: string; variantId?: string; quantity: number }[] }) {
    if (usesLegacyCheckout) return unwrap(await api.post('/coupons/validate', {
      code: input.couponCode,
      items: input.items, hasProductDiscount: false, hasShopVoucher: false, hasPlatformVoucher: false,
    }));
    const response = await checkout.post('/checkout/quote', input);
    return response.data.result;
  },
  async paymentAvailable(): Promise<boolean> {
    if (usesLegacyCheckout) return unwrap((await legacyFinance.get('/orders/payos/availability')).data)?.available === true;
    return (await financeService.capabilities()).paymentAvailable === true;
  },
  async legacyPaymentLink(publicCode: string) {
    if (!usesLegacyCheckout) throw new Error('Checkout không dùng backend NestJS.');
    return unwrap((await legacyFinance.post(`/orders/payos/${encodeURIComponent(publicCode)}/link`)).data);
  },
  async legacyPaymentStatus(publicCode: string) {
    return unwrap((await legacyFinance.get(`/orders/payos/${encodeURIComponent(publicCode)}/status`, { headers: { 'x-skip-cache': 'true' } })).data);
  },
  async stores(): Promise<{ storeId: string; name: string }[]> {
    const current = JSON.parse(sessionStorage.getItem('scanms-user') || 'null') as { userId?: string } | null;
    if (!current?.userId) throw new Error('Vui lòng đăng nhập để xem gian hàng.');
    const stores = (await api.get('/stores')).data as StoreResponse[];
    return stores.filter(store => store.ownerUserId === current.userId && !!store.storeId)
      .map(store => ({ storeId: store.storeId!, name: store.name || 'Gian hàng' }));
  },
};
