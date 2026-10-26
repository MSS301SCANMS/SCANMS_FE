import axios from 'axios';
import api from './api';
import { financeService } from './finance.service';
import { installRawSessionAuth } from './auth-session';
import { getLivePurchase } from './live-purchase-access';

export const usesLegacyCheckout = import.meta.env.VITE_COMMERCE_BACKEND === 'legacy';
export interface CheckoutLine { productId: string; variantId?: string; quantity: number; clientPrice?: number; sourceLivestreamId?: string; liveSessionId?: string; livePurchaseToken?: string }
const inventoryLine = (line: CheckoutLine) => ({ productId: line.productId, variantId: line.variantId, quantity: line.quantity,
  sourceLivestreamId: line.sourceLivestreamId || line.liveSessionId,
  livePurchaseToken: getLivePurchase(line.sourceLivestreamId || line.liveSessionId) || line.livePurchaseToken });
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

const checkout = axios.create({ baseURL: import.meta.env.VITE_CHECKOUT_API_URL || 'http://localhost:8080/api/v1', timeout: 60000 });
installRawSessionAuth(checkout);
export const checkoutService = {
  async validateCart(items: CheckoutLine[]) {
    if (usesLegacyCheckout) return unwrap(await api.post('/orders/validate-cart', { items }));
    const products = new Map(await Promise.all([...new Set(items.map(item => item.productId))].map(async id => {
      const response = await api.get(`/public/products/${encodeURIComponent(id)}/landing`, { headers: { 'x-skip-cache': 'true' } });
      return [id, unwrap(response).product] as const;
    })));
    const liveIds = [...new Set(items.map(item => item.sourceLivestreamId || item.liveSessionId).filter(Boolean))];
    const liveQuotes = await Promise.all(liveIds.map(id => checkout.post('/checkout/quote', { items: items.filter(item => (item.sourceLivestreamId || item.liveSessionId) === id).map(inventoryLine) })));
    const liveRows = liveQuotes.flatMap(response => response.data.result?.lines || []);
    const warnings: string[] = [];
    const validated = items.map(item => {
      const product = products.get(item.productId);
      const variant = product?.variants?.find((v: any) => (v.id || v.variantId) === item.variantId);
      const available = product?.canPurchase === true && (!item.variantId || variant?.isActive === true);
      const stockQuantity = available ? Number(variant?.stockQuantity ?? product.stockQuantity ?? 0) : 0;
      const sourceId = item.sourceLivestreamId || item.liveSessionId;
      const liveLine = sourceId ? liveRows.find((row: any) => row.productId === item.productId && row.variantId === item.variantId && row.sourceLivestreamId === sourceId) : undefined;
      const currentPrice = Number(liveLine?.unitPriceVnd ?? variant?.price ?? product?.price ?? 0);
      if (stockQuantity < item.quantity) warnings.push(`Sản phẩm "${product?.title || product?.name || item.productId}" chỉ còn ${stockQuantity} sản phẩm.`);
      if (item.clientPrice != null && item.clientPrice !== currentPrice) warnings.push('Giá sản phẩm đã thay đổi. Vui lòng kiểm tra lại giỏ hàng.');
      return { ...item, currentPrice, stockQuantity, isActive: available, outOfStock: stockQuantity <= 0 };
    });
    return { items: validated, warnings };
  },
  async shippingQuote(items: CheckoutLine[], storeId: string, address: string, signal?: AbortSignal) {
    if (usesLegacyCheckout) return unwrap(await api.post('/shipping/ghn/quote-address', { storeId, address, items }, { signal, timeout: 20000 }));
    const response = await checkout.post('/checkout/quote', { items: items.map(inventoryLine) }, { signal });
    return { totalFee: response.data.result.shippingFeeVnd, mode: response.data.result.shippingMode, payer: response.data.result.shippingPayer };
  },
  async create(input: unknown) {
    if (usesLegacyCheckout) return unwrap(await api.post('/orders', input));
    const response = await checkout.post('/checkout', input);
    return response.data.result;
  },
  async quote(input: { couponCode?: string; shippingCouponCode?: string; storeId?: string; customerPhone?: string; items: CheckoutLine[] }, signal?: AbortSignal) {
    if (usesLegacyCheckout) return unwrap(await api.post('/checkout/quote', {
      couponCode: input.couponCode,
      shippingCouponCode: input.shippingCouponCode,
      items: input.items.map(inventoryLine),
    }, { signal }));
    const response = await checkout.post('/checkout/quote', {
      couponCode: input.couponCode,
      shippingCouponCode: input.shippingCouponCode,
      items: input.items.map(inventoryLine),
    }, { signal });
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
