import type { CheckoutShopGroup } from '../components/checkout/CheckoutItemsSection';
import type { VoucherSlot } from './voucher-intent';
import { couponService, type PublicStoreCoupon } from '../services/coupon.service';
import { formatMoney } from './marketplace.utils';
import api from '../services/api';

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

/** Preview only: never claims a voucher, creates an order or spends its quota. */
export async function validateCheckoutVoucher(_post: Post, options: ValidationOptions): Promise<Applied & { slot: VoucherSlot }> {
  const code = options.code.trim().toUpperCase();
  const groups = options.groups.filter(group => !options.storeId || group.store.id === options.storeId);
  if (!code || !groups.length) throw new Error('Vui lòng chọn sản phẩm trước khi áp dụng voucher.');

  // 1. Fetch available vouchers for relevant groups and platform
  const [storeVouchersList, platformVouchers] = await Promise.all([
    Promise.all(groups.map(g => couponService.getPublicStoreCoupons(g.store.id).catch(() => [] as PublicStoreCoupon[]))),
    couponService.getPublicPlatformCoupons().catch(() => []),
  ]);

  const allVouchers: Array<Partial<PublicStoreCoupon> & { code: string; benefitType?: string }> = [
    ...storeVouchersList.flat(),
    ...platformVouchers.map(v => ({
      ...v,
      storeId: undefined,
      fundingSource: 'PLATFORM_FUNDED' as const,
      minimumOrderAmount: v.minimumOrderAmount,
      maximumDiscountAmount: v.maximumDiscountAmount,
    })),
  ];

  const matched = allVouchers.find(v => (v.code || '').trim().toUpperCase() === code);

  let lastMessage = 'Voucher không áp dụng được cho sản phẩm trong đơn.';

  for (const slot of options.slot ? [options.slot] : ['SHOP', 'PLATFORM', 'SHIPPING'] as const) {
    for (const group of groups) {
      if (matched) {
        // If specific store voucher, check store match
        if (matched.storeId && matched.storeId !== group.store.id) continue;

        // Determine actual slot
        const isShipping = matched.benefitType === 'SHIPPING' || matched.code.includes('SHIP') || slot === 'SHIPPING';
        const isPlatform = matched.fundingSource === 'PLATFORM_FUNDED';
        const targetSlot: VoucherSlot = isShipping ? 'SHIPPING' : (isPlatform ? 'PLATFORM' : 'SHOP');
        if (options.slot && options.slot !== targetSlot) continue;

        // Expiry check
        if (matched.expiresAt && new Date(matched.expiresAt).getTime() < Date.now()) {
          throw new Error('Voucher đã hết hạn sử dụng.');
        }

        // Minimum order amount check
        const minOrder = Number(matched.minimumOrderAmount || 0);
        if (group.subtotal < minOrder) {
          throw new Error(`Đơn hàng của gian hàng "${group.store.name}" cần tối thiểu ${formatMoney(minOrder)} để áp dụng mã này.`);
        }

        // Calculate discount
        const base = targetSlot === 'SHIPPING' ? (options.shippingFees[group.store.id] || 0) : group.subtotal;
        let amount = 0;
        const discountType = (matched.discountType === 'PERCENTAGE' || matched.discountType === 'FIXED_AMOUNT')
          ? matched.discountType
          : (matched.discountType === 'FIXED' ? 'FIXED_AMOUNT' : 'PERCENTAGE');

        if (discountType === 'PERCENTAGE') {
          amount = Math.round((base * Number(matched.discountValue || 0)) / 100);
          if (matched.maximumDiscountAmount && amount > Number(matched.maximumDiscountAmount)) {
            amount = Number(matched.maximumDiscountAmount);
          }
        } else {
          amount = Math.min(Number(matched.discountValue || 0), base > 0 ? base : Number(matched.discountValue || 0));
          if (matched.maximumDiscountAmount && amount > Number(matched.maximumDiscountAmount)) {
            amount = Number(matched.maximumDiscountAmount);
          }
        }

        if (amount <= 0 && targetSlot === 'SHIPPING' && base === 0) {
          amount = Number(matched.discountValue || 0);
        }

        return {
          slot: targetSlot,
          code: matched.code,
          discountAmount: Math.max(1, amount),
          discountType,
          storeId: group.store.id,
          storeName: group.store.name,
        };
      }

      // If not in public list, try server quote
      try {
        const quoteRes: any = await api.post('/checkout/quote', {
          couponCode: slot !== 'SHIPPING' ? code : undefined,
          shippingCouponCode: slot === 'SHIPPING' ? code : undefined,
          items: group.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || undefined,
            quantity: item.quantity,
          })),
        });
        const result = quoteRes?.data?.result ?? quoteRes?.data ?? quoteRes;
        const amount = Number(result?.discountAmount ?? result?.shippingDiscountVnd ?? 0);
        if (amount > 0) {
          return {
            slot,
            code,
            discountAmount: amount,
            discountType: result.discountType || 'FIXED_AMOUNT',
            storeId: group.store.id,
            storeName: group.store.name,
          };
        }
      } catch (err: any) {
        lastMessage = err?.response?.data?.message || err?.message || lastMessage;
      }
    }
  }

  throw new Error(lastMessage);
}
