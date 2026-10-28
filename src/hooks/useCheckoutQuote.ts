import { useState, useEffect, useMemo, useRef } from 'react';
import { checkoutService, usesLegacyCheckout } from '../services/checkout.service';
import { normalizeOrderVariantId } from '../utils/order-variant.utils';
import type { CartItem } from '../context/CartContext';
import { listedGoodsTotals } from '../utils/checkout-amounts';

interface StoreGroup {
  store: { id: string; name: string };
  items: CartItem[];
}

interface ShippingDestination {
  province: string;
  district: string;
  ward: string;
  detail: string;
}

interface UseCheckoutQuoteOptions {
  isOpen: boolean;
  activeItems: CartItem[];
  itemsGroupedByShop: StoreGroup[];
  shippingDestination?: ShippingDestination;
  shippingAddress: string;
  selectedProvince?: { name: string };
  selectedDistrict?: { name: string };
  selectedWard?: { name: string };
  appliedShopCoupons: Record<string, any>;
  appliedPlatformCoupon: any | null;
  appliedShippingCoupon: any | null;
  onVouchersAutoReset?: () => void;
  onPricesQuoted?: (lines: any[]) => void;
}

/**
 * Custom Hook tính toán báo giá vận chuyển GHN sandbox/fixed và tổng hợp chiết khấu voucher.
 * Tách biệt hoàn toàn logic tính toán khỏi UI Component (theo chuẩn Nam UI Architecture).
 */
export function useCheckoutQuote({
  isOpen,
  activeItems,
  itemsGroupedByShop,
  shippingDestination,
  shippingAddress,
  selectedProvince,
  selectedDistrict,
  selectedWard,
  appliedShopCoupons,
  appliedPlatformCoupon,
  appliedShippingCoupon,
  onVouchersAutoReset,
  onPricesQuoted,
}: UseCheckoutQuoteOptions) {
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [shippingFeesByStore, setShippingFeesByStore] = useState<Record<string, number>>({});
  const [shippingFeeLoading, setShippingFeeLoading] = useState(false);
  const [shippingFeeError, setShippingFeeError] = useState<string | null>(null);
  const [shippingQuoteMode, setShippingQuoteMode] = useState<'FIXED' | 'SIMULATED' | 'GHN_SANDBOX'>('FIXED');
  const [shippingQuoteRetry, setShippingQuoteRetry] = useState(0);
  const callbacks = useRef({ onVouchersAutoReset, onPricesQuoted });
  callbacks.current = { onVouchersAutoReset, onPricesQuoted };
  const provinceName = selectedProvince?.name;
  const districtName = selectedDistrict?.name;
  const wardName = selectedWard?.name;
  const destinationProvince = shippingDestination?.province;
  const destinationDistrict = shippingDestination?.district;
  const destinationWard = shippingDestination?.ward;
  const destinationDetail = shippingDestination?.detail;
  const quoteDestination = useMemo(() => destinationProvince && destinationDistrict && destinationWard && destinationDetail
    ? { province: destinationProvince, district: destinationDistrict, ward: destinationWard, detail: destinationDetail }
    : undefined, [destinationProvince, destinationDistrict, destinationWard, destinationDetail]);

  // Tính tiền hàng thô (Subtotal)
  const rawSubtotal = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [activeItems]);

  const activeUnitCount = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [activeItems]);
  const { listedSubtotal, directDiscount } = useMemo(() => listedGoodsTotals(activeItems), [activeItems]);

  // Tổng hợp chiết khấu Voucher
  const totalShopDiscount = useMemo(() => {
    return Object.values(appliedShopCoupons).reduce((sum, c: any) => sum + (Number(c.discountAmount) || 0), 0);
  }, [appliedShopCoupons]);

  const platformDiscount = appliedPlatformCoupon ? Number(appliedPlatformCoupon.discountAmount) || 0 : 0;
  const shippingDiscount = appliedShippingCoupon ? Number(appliedShippingCoupon.discountAmount) || 0 : 0;
  const totalCombinedDiscount = totalShopDiscount + platformDiscount + shippingDiscount;

  const appliedVoucherCount =
    Object.keys(appliedShopCoupons).length +
    (appliedPlatformCoupon ? 1 : 0) +
    (appliedShippingCoupon ? 1 : 0);

  // Tổng thanh toán sau giảm trừ
  const finalTotal =
    Math.max(0, rawSubtotal - totalShopDiscount - platformDiscount) +
    Math.max(0, (shippingFee || 0) - shippingDiscount);

  // Tự động gọi API báo giá vận chuyển đa gian hàng khi địa chỉ thay đổi
  useEffect(() => {
    if (
      !isOpen ||
      !provinceName ||
      !districtName ||
      !wardName ||
      shippingAddress.trim().length < 5 ||
      !itemsGroupedByShop.length
    ) {
      setShippingFee(null);
      setShippingFeesByStore({});
      setShippingFeeError(null);
      setShippingFeeLoading(false);
      return;
    }

    let active = true;
    const address = [shippingAddress.trim(), wardName, districtName, provinceName].join(', ');
    setShippingFee(null);
    setShippingFeesByStore({});
    if (!usesLegacyCheckout) {
    callbacks.current.onVouchersAutoReset?.();
    }
    setShippingFeeError(null);
    setShippingFeeLoading(true);

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void Promise.all(
        itemsGroupedByShop.map(async (group) => {
          let response: any;
          try {
            response = await checkoutService.shippingQuote(
              group.items.map((item) => ({
                productId: item.productId,
                variantId: normalizeOrderVariantId(item.variantId),
                quantity: item.quantity,
                liveSessionId: item.liveSessionId,
              })),
              group.store.id,
              address,
              controller.signal,
              quoteDestination,
            );
          } catch (error: any) {
            const detail = error?.response?.data?.message || error?.message;
            const message = Array.isArray(detail) ? detail.join(' ') : detail;
            throw new Error(`Chưa tính được phí giao hàng của ${group.store.name || 'gian hàng'}: ${message || 'Vui lòng thử lại sau.'}`);
          }
          const quote = response?.data?.data || response?.data || response;
          if (typeof quote.totalFee !== 'number' || !Number.isFinite(quote.totalFee) || quote.totalFee < 0) {
            throw new Error('Cước GHN không hợp lệ. Vui lòng thử tính lại phí vận chuyển.');
          }
          return { storeId: group.store.id, fee: Number(quote.totalFee), mode: quote.mode, lines: quote.lines || [] };
        }),
      )
        .then((fees) => {
          if (active) {
            callbacks.current.onPricesQuoted?.(fees.flatMap(fee => fee.lines));
            setShippingFeesByStore(Object.fromEntries(fees.map((item) => [item.storeId, item.fee])));
            setShippingFee(fees.reduce((sum, item) => sum + item.fee, 0));
            setShippingQuoteMode(
              fees.some((fee) => fee.mode === 'GHN_SANDBOX')
                ? 'GHN_SANDBOX'
                : fees.some((fee) => fee.mode === 'SIMULATED')
                ? 'SIMULATED'
                : 'FIXED',
            );
          }
        })
        .catch((error: any) => {
          if (active) {
            setShippingFeeError(error?.message || 'Chưa lấy được phí vận chuyển. Vui lòng thử lại sau.');
          }
        })
        .finally(() => {
          if (active) {
            setShippingFeeLoading(false);
          }
        });
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    isOpen,
    shippingAddress,
    provinceName,
    districtName,
    wardName,
    quoteDestination,
    itemsGroupedByShop,
    shippingQuoteRetry,
  ]);

  const retryShippingQuote = () => {
    setShippingQuoteRetry((v) => v + 1);
  };

  return {
    rawSubtotal,
    listedSubtotal,
    directDiscount,
    activeUnitCount,
    shippingFee,
    shippingFeesByStore,
    shippingFeeLoading,
    shippingFeeError,
    shippingQuoteMode,
    totalShopDiscount,
    platformDiscount,
    shippingDiscount,
    totalCombinedDiscount,
    appliedVoucherCount,
    finalTotal,
    retryShippingQuote,
  };
}
