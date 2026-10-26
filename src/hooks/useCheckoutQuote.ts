import { useState, useEffect, useMemo } from 'react';
import { checkoutService, usesLegacyCheckout } from '../services/checkout.service';
import { normalizeOrderVariantId } from '../utils/order-variant.utils';
import type { CartItem } from '../context/CartContext';

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
}: UseCheckoutQuoteOptions) {
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [shippingFeesByStore, setShippingFeesByStore] = useState<Record<string, number>>({});
  const [shippingFeeLoading, setShippingFeeLoading] = useState(false);
  const [shippingFeeError, setShippingFeeError] = useState<string | null>(null);
  const [shippingQuoteMode, setShippingQuoteMode] = useState<'FIXED' | 'SIMULATED' | 'GHN_SANDBOX'>('FIXED');
  const [shippingQuoteRetry, setShippingQuoteRetry] = useState(0);

  // Tính tiền hàng thô (Subtotal)
  const rawSubtotal = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [activeItems]);

  const activeUnitCount = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [activeItems]);

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
      !selectedProvince ||
      !selectedDistrict ||
      !selectedWard ||
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
    const address = [shippingAddress.trim(), selectedWard.name, selectedDistrict.name, selectedProvince.name].join(', ');
    setShippingFee(null);
    setShippingFeesByStore({});
    if (!usesLegacyCheckout) {
      onVouchersAutoReset?.();
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
              })),
              group.store.id,
              address,
              controller.signal,
              shippingDestination,
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
          return { storeId: group.store.id, fee: Number(quote.totalFee), mode: quote.mode };
        }),
      )
        .then((fees) => {
          if (active) {
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
    selectedProvince?.name,
    selectedDistrict?.name,
    selectedWard?.name,
    itemsGroupedByShop,
    shippingQuoteRetry,
  ]);

  const retryShippingQuote = () => {
    setShippingQuoteRetry((v) => v + 1);
  };

  return {
    rawSubtotal,
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
