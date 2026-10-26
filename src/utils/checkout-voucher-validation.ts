import type { CheckoutShopGroup } from '../components/checkout/CheckoutItemsSection';
import type { VoucherSlot } from './voucher-intent';
import { couponService } from '../services/coupon.service';
import { getLivePurchase } from '../services/live-purchase-access';

type Post = (path: string, body: Record<string, unknown>) => Promise<unknown>;
interface Applied { code: string; discountAmount: number; storeId: string; storeName: string; discountType?: string }
interface ValidationOptions {
  code: string;
  groups: CheckoutShopGroup[];
  shippingFees: Record<string, number>;
  shopDiscounts: Record<string, { code: string; discountAmount: number }>;
  customerPhone?: string;
  slot?: VoucherSlot;
  storeId?: string;
}

/** Preview only: Product/Order and Voucher decide eligibility and the discount amount. */
export async function validateCheckoutVoucher(post: Post, options: ValidationOptions): Promise<Applied & { slot: VoucherSlot }> {
  const code = options.code.trim().toUpperCase();
  const groups = options.groups.filter(group => !options.storeId || group.store.id === options.storeId);
  if (!code || !groups.length) throw new Error('Vui lòng chọn sản phẩm trước khi áp dụng voucher.');

  // Public metadata identifies the UI section; it never substitutes for a server quote.
  const catalogs = await Promise.allSettled([
    couponService.getPublicPlatformCoupons(),
    ...groups.map(group => couponService.getPublicStoreCoupons(group.store.id)),
  ]);
  const platform = catalogs[0].status === 'fulfilled' ? catalogs[0].value : [];
  const all: Array<{ code: string; benefitType?: 'GOODS' | 'SHIPPING'; storeId?: string }> = [];
  for (const result of catalogs) if (result.status === 'fulfilled') all.push(...result.value);
  const metadata = all.find(voucher => voucher.code.trim().toUpperCase() === code);
  const platformFunded = platform.some(voucher => voucher.code.trim().toUpperCase() === code);
  const requestedShipping = options.slot === 'SHIPPING' || metadata?.benefitType === 'SHIPPING';
  const response: any = await post('/checkout/quote', {
    couponCode: requestedShipping ? undefined : code,
    shippingCouponCode: requestedShipping ? code : undefined,
    items: groups.flatMap(group => group.items.map(item => ({
      productId: item.productId,
      variantId: item.variantId || undefined,
      quantity: item.quantity,
      sourceLivestreamId: item.liveSessionId || undefined,
      livePurchaseToken: getLivePurchase(item.liveSessionId),
    }))),
  });
  const quote = response?.result ?? response?.data?.result ?? response?.data ?? response;
  const shipping = requestedShipping || quote?.benefitType === 'SHIPPING';
  const slot: VoucherSlot = shipping ? 'SHIPPING' : platformFunded ? 'PLATFORM' : metadata ? 'SHOP' : options.slot || 'SHOP';
  if (options.slot && options.slot !== slot) throw new Error('Mã này không thuộc loại voucher đã chọn.');
  const discountAmount = Number(shipping ? quote?.shippingDiscountVnd : quote?.discountAmount);
  if (!Number.isFinite(discountAmount) || discountAmount <= 0) throw new Error('Voucher chưa đủ điều kiện áp dụng cho đơn hàng.');
  const target = groups.find(group => group.store.id === metadata?.storeId) || groups[0];
  return { code, slot, discountAmount, discountType: quote.discountType, storeId: target.store.id, storeName: target.store.name };
}
