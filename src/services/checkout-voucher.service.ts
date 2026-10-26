import { checkoutService, type CheckoutLine } from './checkout.service';
import { couponService } from './coupon.service';
import { findBestVoucher } from '../utils/best-voucher.utils';
import type { VoucherSelection } from '../components/vouchers/PlatformVoucherPicker';

export async function quoteVoucherSelection(selection: VoucherSelection, items: CheckoutLine[], signal?: AbortSignal) {
  let { goodsCode, shippingCode } = selection;
  if (selection.enteredCode?.trim()) {
    const code = selection.enteredCode.trim().toUpperCase();
    const single = await checkoutService.quote({ couponCode: code, items }, signal);
    if (Number(single.shippingDiscountVnd) > 0 || single.benefitType === 'SHIPPING') shippingCode = code;
    else goodsCode = code;
  }
  return checkoutService.quote({ couponCode: goodsCode || undefined, shippingCouponCode: shippingCode || undefined, items }, signal);
}

export async function recommendVoucherSelection(items: CheckoutLine[], stores: string[], signal: AbortSignal,
  initialCode = '', initialShippingCode = '', liveCode: string | string[] = '') {
  const fixed = { goodsCode: '', shippingCode: initialShippingCode };
  const cache = new Map<string, Promise<any>>();
  const preview = (code: string) => {
    if (!cache.has(code)) cache.set(code, checkoutService.quote({ couponCode: code, items }, signal));
    return cache.get(code)!;
  };
  if (initialCode) {
    const quote = await preview(initialCode);
    if (Number(quote.shippingDiscountVnd) > 0 || quote.benefitType === 'SHIPPING') fixed.shippingCode = initialCode;
    else fixed.goodsCode = initialCode;
  }
  const catalogs = await Promise.allSettled([...new Set(stores)].map(id => couponService.getPublicPlatformCoupons(id, signal)));
  const vouchers = catalogs.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const goods = vouchers.filter(v => v.benefitType === 'GOODS').map(v => v.code);
  const shipping = vouchers.filter(v => v.benefitType === 'SHIPPING').map(v => v.code);
  if (!initialCode) for (const code of [...new Set(Array.isArray(liveCode) ? liveCode : liveCode ? [liveCode] : [])]) {
    try { const live = await preview(code); (Number(live.shippingDiscountVnd) > 0 ? shipping : goods).push(code); } catch { /* Other offers remain usable. */ }
  }
  const [bestGoods, bestShipping] = await Promise.all([
    fixed.goodsCode ? null : findBestVoucher(goods, preview, signal),
    fixed.shippingCode ? null : findBestVoucher(shipping, preview, signal),
  ]);
  if (signal.aborted) return null;
  const goodsCode = fixed.goodsCode || bestGoods?.code || '';
  const shippingCode = fixed.shippingCode || bestShipping?.code || '';
  if (!goodsCode && !shippingCode) return null;
  const result = await quoteVoucherSelection({ goodsCode, shippingCode }, items, signal);
  return { ...result, goodsFundingSource: vouchers.some(voucher => voucher.code === goodsCode) ? 'PLATFORM_FUNDED' : 'STORE_FUNDED' };
}
