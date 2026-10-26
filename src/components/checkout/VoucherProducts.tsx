import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { formatMoney } from "@/utils/marketplace.utils";
import { voucherProductUrl } from "@/utils/voucher-intent";

interface EligibleProduct {
  id: string;
  title: string;
  imageUrl?: string;
  price: number;
  stockQuantity: number;
}

/** Choosing a product carries the voucher intent without requiring a saved voucher. */
export function VoucherProducts({ couponId }: { couponId: string }) {
  const [result, setResult] = useState<{
    voucher: { code: string };
    products: EligibleProduct[];
    hasMore: boolean;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    if (page === 1) setResult(null);
    setError("");
    setLoading(true);
    api
      .get(`/coupons/${couponId}/products`, {
        params: { page },
        signal: controller.signal,
        headers: { "x-skip-cache": "1" },
      })
      .then((response) => {
        if (controller.signal.aborted) return;
        setResult((previous) => ({
          ...response.data,
          products: [
            ...new Map<string, EligibleProduct>(
              [
                ...(page > 1 ? previous?.products || [] : []),
                ...response.data.products,
              ].map((item: EligibleProduct) => [item.id, item]),
            ).values(),
          ],
        }));
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Không tải được sản phẩm hoặc voucher đã hết hiệu lực.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [couponId, page, retry]);
  return (
    <section className="col-span-full rounded-xl border border-[#EEDFC6] bg-[#FAF8F5] p-3">
      <h3 className="text-sm font-semibold">Chọn sản phẩm để dùng voucher</h3>
      <p className="mt-1 text-xs text-[#7D715E]">
        Không cần lưu mã. Giá giảm được kiểm tra theo số lượng và phân loại bạn
        chọn.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-xs text-[#DC2626]">
          {error}{" "}
          <button onClick={() => setRetry((n) => n + 1)} className="underline">
            Thử lại
          </button>
        </p>
      )}
      {loading && (
        <p role="status" className="py-3 text-xs">
          Đang tìm sản phẩm phù hợp...
        </p>
      )}
      {result?.products.length === 0 && (
        <p className="py-3 text-xs">
          Chưa có sản phẩm đang bán phù hợp với voucher này.
        </p>
      )}
      <div className="mt-3 grid max-h-80 gap-2 overflow-auto">
        {result?.products.map((product) => (
          <Link
            key={product.id}
            to={voucherProductUrl(product.id, result.voucher.code)}
            className="flex items-center gap-3 rounded-xl border border-[#EAE4D7] bg-white p-3 hover:border-[#C59B58]"
          >
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt=""
                loading="lazy"
                className="h-12 w-12 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{product.title}</p>
              <p className="text-xs text-[#7D715E]">
                {formatMoney(Number(product.price))}
              </p>
            </div>
            <span className="text-xs font-semibold text-[#B88E4F]">
              Dùng ngay →
            </span>
          </Link>
        ))}
      </div>
      {result?.hasMore && !error && (
        <button
          type="button"
          disabled={loading}
          onClick={() => setPage((value) => value + 1)}
          className="mt-3 w-full rounded-xl border border-[#EEDFC6] bg-white p-2 text-xs font-semibold disabled:opacity-50"
        >
          Xem thêm sản phẩm
        </button>
      )}
    </section>
  );
}
