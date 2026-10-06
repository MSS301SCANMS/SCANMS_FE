import axios from 'axios';
import api from './api';
import { financeService } from './finance.service';

export const usesLegacyCheckout = import.meta.env.VITE_COMMERCE_BACKEND === 'legacy';
const unwrap = (response: any) => response?.result ?? response?.data?.data ?? response?.data ?? response;
const legacyFinance = axios.create({ baseURL: import.meta.env.VITE_LEGACY_FINANCE_URL || 'http://127.0.0.1:3000/api', timeout: 60000 });
legacyFinance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const checkout = axios.create({ baseURL: import.meta.env.VITE_CHECKOUT_API_URL || 'http://localhost:8080/api/v1', timeout: 60000 });
checkout.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const checkoutService = {
  async create(input: unknown) {
    if (usesLegacyCheckout) return unwrap(await api.post('/orders', input));
    const response = await checkout.post('/checkout', input);
    return response.data.result;
  },
  async quote(input: { couponCode: string; storeId?: string; customerPhone?: string; items: { productId: string; variantId?: string; quantity: number; unitPrice?: number }[] }) {
    if (usesLegacyCheckout) return unwrap(await api.post('/coupons/validate', {
      code: input.couponCode, storeId: input.storeId, customerPhone: input.customerPhone,
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
    const response = await checkout.get('/stores/mine');
    return response.data.result;
  },
};
