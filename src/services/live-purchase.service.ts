import api from './api';
import { unwrapApi } from '../utils/api-response';
import { liveCommerceService } from './live-commerce.service';
import { normalizeLiveVariants } from '../utils/live-purchase.utils';

const fresh = { headers: { 'x-skip-cache': 'true' } };

export const livePurchaseService = {
  async selection(sessionId: string, productId: string) {
    const [landingResponse, liveResponse, commerce] = await Promise.all([
      api.get(`/public/products/${encodeURIComponent(productId)}/landing`, fresh),
      api.get(`/livestreams/${encodeURIComponent(sessionId)}`, fresh),
      liveCommerceService.get(sessionId),
    ]);
    const product = unwrapApi<any>(landingResponse)?.product;
    const live = unwrapApi<any>(liveResponse);
    if (
      live?.status !== 'LIVE' ||
      !live.productRefs?.productIds?.includes(productId) ||
      product?.id !== productId ||
      product.storeId !== live.storeId
    )
      throw new Error('Sản phẩm không còn thuộc phiên đang phát. Vui lòng tải lại túi đồ live.');
    if (product.canPurchase !== true) throw new Error('Sản phẩm hiện không thể mua hoặc đã hết hàng.');
    const variants = normalizeLiveVariants(product);
    if (!variants.length) throw new Error('Sản phẩm chưa có phân loại đang bán.');
    return { product, variants, commerce };
  },
};
