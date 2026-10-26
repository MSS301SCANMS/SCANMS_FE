import type { PublicStoreCoupon } from "@/services/coupon.service";
import { formatMoney } from "@/utils/marketplace.utils";

export function ProductVoucherShelf({
  vouchers,
  selected,
  busy,
  onApply,
}: {
  vouchers: PublicStoreCoupon[];
  selected?: string;
  busy: boolean;
  onApply: (voucher: PublicStoreCoupon) => void;
}) {
  if (!vouchers.length) return null;
  return (
    <section className="space-y-3 rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-4">
      <div>
        <h3 className="font-semibold text-[#1A1612]">
          Voucher dành cho sản phẩm này
        </h3>
        <p className="mt-1 text-xs text-[#7D715E]">
          Bấm để sử dụng ngay, không cần lưu mã. Điều kiện được kiểm tra khi áp
          dụng.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {vouchers.map((voucher) => {
          const active = selected === voucher.code;
          const platform = voucher.fundingSource === "PLATFORM_FUNDED";
          return (
            <button
              type="button"
              key={voucher.id}
              disabled={busy}
              aria-pressed={active}
              onClick={() => onApply(voucher)}
              className={`rounded-xl border p-3 text-left transition disabled:opacity-60 ${active ? "border-[#C59B58] bg-[#F3EFE6]" : "border-[#EAE4D7] bg-white hover:border-[#C59B58]"}`}
            >
              <span className="text-[11px] font-semibold text-[#B88E4F]">
                {platform ? "Sàn SCANMS tài trợ" : "Ưu đãi gian hàng"} ·{" "}
                {voucher.benefitType === "SHIPPING"
                  ? "Vận chuyển"
                  : "Tiền hàng"}
              </span>
              <strong className="mt-1 block text-sm">
                Giảm{" "}
                {voucher.discountType === "PERCENTAGE"
                  ? `${voucher.discountValue}%`
                  : formatMoney(voucher.discountValue)}
              </strong>
              <span className="mt-1 block text-xs text-[#7D715E]">
                Đơn từ {formatMoney(voucher.minimumOrderAmount || 0)}
                {voucher.maximumDiscountAmount
                  ? ` · Tối đa ${formatMoney(voucher.maximumDiscountAmount)}`
                  : ""}
              </span>
              <span className="mt-1 block text-xs text-[#7D715E]">
                {voucher.expiresAt
                  ? `Hết hạn ${new Date(voucher.expiresAt).toLocaleDateString("vi-VN")}`
                  : "Không giới hạn ngày"}
              </span>
              <span className="mt-2 flex justify-between gap-2 text-xs font-semibold">
                <span>{voucher.code}</span>
                <span>{active ? "Đã chọn ✓" : "Áp dụng ngay →"}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
