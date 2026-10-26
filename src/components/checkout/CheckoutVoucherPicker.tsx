import { useEffect, useState } from "react";
import {
  couponService,
  type PublicStoreCoupon,
} from "@/services/coupon.service";
import { voucherSlot, type VoucherSlot } from "@/utils/voucher-intent";
import {
  collectCheckoutVouchers,
  checkoutVoucherDisabledReason,
} from "@/utils/checkout-vouchers";
import { formatMoney } from "@/utils/marketplace.utils";

const groups: { slot: VoucherSlot; title: string }[] = [
  { slot: "SHOP", title: "Voucher Shop / KOL" },
  { slot: "PLATFORM", title: "Voucher sàn SCANMS" },
  { slot: "SHIPPING", title: "Voucher vận chuyển" },
];

export function CheckoutVoucherPicker({
  storeId,
  productIds,
  goodsSubtotal,
  shippingFee,
  busy,
  selected,
  onApply,
}: {
  storeId: string;
  productIds: string[];
  goodsSubtotal: number;
  shippingFee: number;
  busy: boolean;
  selected: Partial<Record<VoucherSlot, string>>;
  onApply: (voucher: PublicStoreCoupon) => void;
}) {
  const [vouchers, setVouchers] = useState<PublicStoreCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const productKey = [...new Set(productIds)].sort().join(",");
  useEffect(() => {
    const controller = new AbortController();
    setVouchers([]);
    setError("");
    if (!storeId || !productKey) {
      setLoading(false);
      return () => controller.abort();
    }
    setLoading(true);
    void Promise.all(
      productKey
        .split(",")
        .map((productId) =>
          couponService.getPublicStoreCoupons(
            storeId,
            productId,
            controller.signal,
          ),
        ),
    )
      .then((lists) => {
        if (!controller.signal.aborted)
          setVouchers(collectCheckoutVouchers(lists));
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Chưa tải được voucher cho giỏ hàng. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [storeId, productKey, refresh]);
  return (
    <section
      className="rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-4"
      aria-label="Chọn voucher khi thanh toán"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#1A1612]">
            Voucher cho đơn hàng của bạn
          </h3>
          <p className="mt-1 text-xs text-[#7D715E]">
            Chọn tối đa 1 mã mỗi nhóm. Bấm áp dụng ngay, không cần lưu mã.
          </p>
        </div>
        <button
          type="button"
          disabled={loading || busy}
          onClick={() => setRefresh((value) => value + 1)}
          className="rounded-lg border border-[#EEDFC6] bg-white px-3 py-1.5 text-xs font-semibold text-[#B88E4F] disabled:opacity-50"
        >
          Làm mới
        </button>
      </div>
      {loading && (
        <p role="status" className="py-3 text-xs text-[#7D715E]">
          Đang tìm voucher đúng sản phẩm trong đơn…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-xs text-[#DC2626]">
          {error}
          <button
            type="button"
            onClick={() => setRefresh((value) => value + 1)}
            className="ml-2 underline"
          >
            Thử lại
          </button>
        </p>
      )}
      {!loading && !error && (
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {groups.map(({ slot, title }) => {
            const available = vouchers.filter(
              (voucher) => voucherSlot(voucher) === slot,
            );
            return (
              <div key={slot} className="min-w-0">
                <h4 className="mb-2 text-xs font-bold text-[#1A1612]">
                  {title}
                </h4>
                {!available.length && (
                  <p className="text-xs text-[#7D715E]">
                    Chưa có mã phù hợp cho nhóm này.
                  </p>
                )}
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {available.map((voucher) => {
                    const applied = selected[slot] === voucher.code;
                    const reason = checkoutVoucherDisabledReason(
                      voucher,
                      goodsSubtotal,
                      shippingFee,
                    );
                    return (
                      <button
                        type="button"
                        key={voucher.id}
                        aria-pressed={applied}
                        disabled={busy || applied || !!reason}
                        onClick={() => onApply(voucher)}
                        className={`w-full rounded-xl border bg-white p-3 text-left transition disabled:cursor-default ${applied ? "border-[#C59B58]" : "border-[#EAE4D7] enabled:hover:border-[#C59B58]"} ${reason ? "opacity-60" : ""}`}
                      >
                        <span className="block break-all text-xs font-bold text-[#B88E4F]">
                          {voucher.code}
                        </span>
                        <strong className="mt-1 block text-sm text-[#1A1612]">
                          Giảm{" "}
                          {voucher.discountType === "PERCENTAGE"
                            ? `${voucher.discountValue}%`
                            : formatMoney(voucher.discountValue)}
                        </strong>
                        <span className="mt-1 block text-[11px] text-[#7D715E]">
                          Đơn từ {formatMoney(voucher.minimumOrderAmount || 0)}
                          {voucher.maximumDiscountAmount
                            ? ` · Tối đa ${formatMoney(voucher.maximumDiscountAmount)}`
                            : ""}
                        </span>
                        <span className="mt-1 block text-[11px] text-[#7D715E]">
                          {voucher.scopeType === "STORE_WIDE"
                            ? "Áp dụng tại gian hàng"
                            : "Áp dụng cho sản phẩm thuộc phạm vi mã"}
                        </span>
                        <span className="mt-2 block text-xs font-semibold text-[#B88E4F]">
                          {applied
                            ? "Đã áp dụng ✓"
                            : reason ||
                              (busy ? "Đang kiểm tra…" : "Áp dụng ngay →")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-[11px] text-[#7D715E]">
        Điều kiện, lượt dùng và mức giảm được kiểm tra lại khi áp dụng. Voucher
        vận chuyển cần phí ship đã được tính.
      </p>
    </section>
  );
}
