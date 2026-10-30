import React from 'react';
import { formatMoney } from '@/utils/marketplace.utils';

interface CheckoutSummaryTotalsProps {
  activeUnitCount: number;
  rawSubtotal: number;
  directDiscount?: number;
  shippingAddressHint: string | null;
  shippingFeeError: string | null;
  shippingFeeLoading: boolean;
  shippingFee: number | null;
  onRetryShipping: () => void;
  totalShopDiscount: number;
  appliedShopCoupons: Record<string, any>;
  appliedPlatformCoupon: any | null;
  appliedShippingCoupon: any | null;
  finalTotal: number;
  shippingQuoteMode: string;
  shopCount: number;
}

/**
 * Hiển thị bảng tổng hợp chi phí đơn hàng (Tiền hàng, phí ship, voucher sàn, voucher shop, tổng thanh toán).
 * Tuân thủ quy chuẩn thiết kế SCANMS Warm Gold & các sàn thương mại điện tử lớn.
 */
export const CheckoutSummaryTotals: React.FC<CheckoutSummaryTotalsProps> = ({
  activeUnitCount,
  rawSubtotal,
  directDiscount = 0,
  shippingAddressHint,
  shippingFeeError,
  shippingFeeLoading,
  shippingFee,
  onRetryShipping,
  totalShopDiscount,
  appliedShopCoupons,
  appliedPlatformCoupon,
  appliedShippingCoupon,
  finalTotal,
  shippingQuoteMode,
  shopCount,
}) => {
  return (
    <>
      <dl
        className="checkout-totals grid gap-[12px] w-full max-w-[440px] m-[0_0_0_auto] p-[22px_24px] [&_>_div]:flex [&_>_div]:items-baseline [&_>_div]:justify-between [&_>_div]:gap-[20px] [&_>_div]:text-[color:#7D715E]! [&_>_div]:text-[12px] [&_>_div]:leading-[1.65] [&_dt]:min-w-0 [&_dd]:min-w-0 [&_dd]:max-w-[240px] [&_dd]:m-0 [&_dd]:text-[color:#1A1612]! [&_dd]:text-right [&_dd]:tabular-nums [&_dd]:[overflow-wrap:anywhere] [&_.checkout-total-discount_dd]:text-[color:#8A642C]! [&_.checkout-total-final]:items-center [&_.checkout-total-final]:mt-[3px] [&_.checkout-total-final]:pt-[16px] [&_.checkout-total-final]:border-t [&_.checkout-total-final]:border-t-[#EAE4D7] [@media_(max-width:639px)]:max-w-none [@media_(max-width:639px)]:p-[18px_16px]"
        aria-label="Chi tiết thanh toán"
      >
        <div>
          <dt>Tổng tiền hàng ({activeUnitCount} sản phẩm)</dt>
          <dd>{formatMoney(rawSubtotal)}</dd>
        </div>

        <div>
          <dt>Phí vận chuyển GHN</dt>
          <dd role="status">
            {shippingAddressHint ||
              shippingFeeError ||
              (shippingFeeLoading
                ? 'Đang tính cước…'
                : shippingFee === null
                ? 'Chưa có phí vận chuyển.'
                : formatMoney(shippingFee))}
            {shippingFeeError && !shippingAddressHint && (
              <button
                type="button"
                onClick={onRetryShipping}
                className="ml-2 text-[#795A2D] underline underline-offset-2 cursor-pointer"
              >
                Tính lại
              </button>
            )}
          </dd>
        </div>

        {directDiscount > 0 && <div className="checkout-total-discount"><dt>Ưu đãi giá sản phẩm / livestream</dt><dd>−{formatMoney(directDiscount)}</dd></div>}
        {totalShopDiscount > 0 && (
          <div className="checkout-total-discount">
            <dt>Voucher Gian hàng & KOL ({Object.values(appliedShopCoupons).map((c: any) => c.code).join(', ')})</dt>
            <dd>−{formatMoney(totalShopDiscount)}</dd>
          </div>
        )}

        {appliedPlatformCoupon && (
          <div className="checkout-total-discount">
            <dt>Voucher SCANMS ({appliedPlatformCoupon.code})</dt>
            <dd>−{formatMoney(appliedPlatformCoupon.discountAmount)}</dd>
          </div>
        )}

        {appliedShippingCoupon && (
          <div className="checkout-total-discount">
            <dt>Voucher vận chuyển ({appliedShippingCoupon.code})</dt>
            <dd>−{formatMoney(appliedShippingCoupon.discountAmount)}</dd>
          </div>
        )}

        <div className="checkout-total-final [&_dd]:text-[color:#1A1612]! [&_dd]:text-[26px] [&_dd]:font-[650] [&_dd]:tracking-[-.5px]! [&_dd]:leading-[1.35] [&_dd_>_span]:text-[color:#7D715E]! [&_dd_>_span]:text-[13px] [&_dd_>_span]:font-[500] [@media_(max-width:639px)]:[&_dd]:text-[24px]">
          <dt>Tổng thanh toán</dt>
          <dd>
            {shippingFee === null || shippingFeeError || shippingAddressHint || shippingFeeLoading ? (
              <span>Chờ tính phí ship</span>
            ) : (
              formatMoney(finalTotal)
            )}
          </dd>
        </div>
      </dl>

      {shippingQuoteMode === 'SIMULATED' && (
        <p className="text-xs text-[#795A2D]" role="note">
          Phí giao hàng mô phỏng: {formatMoney(shippingFee || 0)} cho {shopCount} shop. Khách thanh toán cùng tiền hàng; chưa phát sinh phí với hãng vận chuyển.
        </p>
      )}

      {shippingQuoteMode === 'GHN_SANDBOX' && (
        <p className="text-xs leading-6 text-[#795A2D]" role="note">
          Cước GHN sandbox theo tuyến giao hàng và khối lượng kiện thử nghiệm. Đây là môi trường kiểm thử, chưa tạo đơn giao hàng thật. Các địa chỉ cùng tuyến có thể có cùng phí.
        </p>
      )}
    </>
  );
};
