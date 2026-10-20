import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  ExternalLink,
  Heart,
  Loader2,
  Search,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';
import {
  formatMoney,
  getSafeProductImageUrl,
  normalizeSearch,
} from '@/utils/marketplace.utils';
import type { CustomerWishlistItem } from '../../services/customer.service';

interface CustomerWishlistTabProps {
  items: CustomerWishlistItem[];
  loading: boolean;
  onRemove: (productId: string) => Promise<void>;
  onBuy: (product: CustomerWishlistItem['product']) => void;
}

export function CustomerWishlistTab({
  items,
  loading,
  onRemove,
  onBuy,
}: CustomerWishlistTabProps) {
  const [query, setQuery] = useState('');
  const [removing, setRemoving] = useState<string[]>([]);
  const search = normalizeSearch(query.trim());
  const filteredItems = items.filter(({ product }) =>
    normalizeSearch(`${product.title} ${product.store?.name || ''}`).includes(
      search,
    ),
  );

  const removeItem = async (productId: string) => {
    setRemoving((ids) => [...ids, productId]);
    try {
      await onRemove(productId);
    } finally {
      setRemoving((ids) => ids.filter((id) => id !== productId));
    }
  };

  return (
    <section className="@container/wishlist grid gap-[14px] w-full max-w-[1020px] min-w-0 text-[#1A1612] text-left max-md:pb-[64px]" aria-label="Sản phẩm yêu thích">
      <div className="flex items-center justify-between flex-wrap gap-[10px] @max-[599px]:gap-[8px] p-[10px_12px] @max-[599px]:p-[8px_10px] border border-[#EAE4D7] rounded-[12px] bg-white shadow-[0_2px_5px_rgba(35,29,21,0.02)]">
        <div className="flex items-center flex-wrap gap-[8px] min-h-[30px] @max-[599px]:min-h-[26px]" aria-live="polite" aria-atomic="true">
          <span className="grid place-items-center w-[28px] h-[28px] rounded-[8px] bg-[#FBF5EB] text-[#B88E4F]" aria-hidden="true">
            <Bookmark size={15} />
          </span>
          <h2 className="m-0 font-inherit text-[12px] font-[600] text-[#1A1612]" id="wishlist-list-heading">Danh sách đã lưu</h2>
          {!loading && search && (
            <span className="pl-[8px] border-l border-[#EAE4D7] text-[10px] text-[#7D715E] leading-[1.5]">{filteredItems.length} kết quả</span>
          )}
        </div>
        <div className="ml-auto flex w-[300px] max-w-full shrink-0 items-center @max-[599px]:w-full min-w-0">
          <div className="flex items-center gap-[8px] w-full min-w-0 h-[36px] px-[10px] rounded-[8px] border border-[#EAE4D7] focus-within:border-[#C59B58] focus-within:bg-white focus-within:shadow-[0_0_0_2px_rgba(197,155,88,0.12)] bg-[#FAF8F5] text-[#7D715E] transition-colors">
            <Search size={15} aria-hidden="true" className="shrink-0" />
            <input
              aria-label="Tìm trong sản phẩm yêu thích"
              placeholder="Tìm sản phẩm, gian hàng…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full min-w-0 border-0 bg-transparent text-[12px] text-[#1A1612] outline-none placeholder:text-[#7D715E]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Xóa từ khóa"
                className="grid place-items-center p-0.5 border-0 bg-transparent text-[#7D715E] hover:text-[#1A1612] cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-[10px] py-[34px] px-[12px] rounded-[12px] border border-[#EAE4D7] bg-white text-center text-[#B88E4F]" role="status">
          <Loader2 className="animate-spin" size={26} />
          <p className="m-0 text-[#7D715E] text-[11px] leading-[1.6]">Đang tải sản phẩm yêu thích…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-[10px] py-[34px] px-[12px] rounded-[12px] border border-[#EAE4D7] bg-white text-center text-[#B88E4F]">
          <span className="grid place-items-center w-[44px] h-[44px] rounded-[12px] bg-[#FBF5EB] text-[#B88E4F]">
            <Heart size={24} />
          </span>
          <h2 className="m-0 font-inherit text-[15px] font-[600] text-[#1A1612]">Chưa có sản phẩm yêu thích</h2>
          <p className="m-0 text-[#7D715E] text-[11px] leading-[1.6]">Nhấn biểu tượng trái tim trên sản phẩm để lưu vào đây.</p>
          <Link
            to="/marketplace"
            className="mt-1 inline-flex items-center gap-[7px] min-h-[34px] px-[14px] py-[7px] rounded-[8px] border border-[#EEDFC6] bg-[#FBF5EB] text-[#1A1612] text-[11px] font-[550] hover:border-[#C59B58] transition-colors"
          >
            <span>Khám phá sản phẩm</span>
            <ArrowRight size={14} className="text-[#B88E4F]" />
          </Link>
        </div>
      ) : (
        <>
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center gap-[10px] py-[34px] px-[12px] rounded-[12px] border border-[#EAE4D7] bg-white text-center text-[#B88E4F]">
              <Search size={26} />
              <h2 className="m-0 font-inherit text-[15px] font-[600] text-[#1A1612]">Không tìm thấy sản phẩm</h2>
              <p className="m-0 text-[#7D715E] text-[11px] leading-[1.6]">Thử tên sản phẩm hoặc gian hàng khác.</p>
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-[550] text-[#B88E4F] hover:underline cursor-pointer"
                onClick={() => setQuery('')}
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 @max-[899px]:grid-cols-1 items-stretch gap-[12px] min-w-0">
              {filteredItems.map(({ wishlistId, product: p }) => {
                const discount =
                  p.originalPrice && Number(p.originalPrice) > Number(p.price)
                    ? Math.round(
                        (1 - Number(p.price) / Number(p.originalPrice)) * 100,
                      )
                    : 0;
                const unavailable = !p.isActive || p.stockQuantity <= 0;
                const busy = removing.includes(p.id);
                const productUrl = `/products/${p.sku || p.id}`;
                return (
                  <article className="grid grid-cols-[112px_minmax(0,1fr)] @max-[599px]:grid-cols-[96px_minmax(0,1fr)] @max-[339px]:grid-cols-[78px_minmax(0,1fr)] gap-[12px] @max-[599px]:gap-[10px] @max-[339px]:gap-[8px] p-[12px] @max-[599px]:p-[10px] @max-[339px]:p-[8px] @max-[899px]:max-w-[680px] min-w-0 border border-[#EAE4D7] hover:border-[#EEDFC6] rounded-[12px] bg-white shadow-[0_2px_5px_rgba(35,29,21,0.02)] transition-colors" key={wishlistId}>
                    <div className="relative self-stretch rounded-[9px] border border-[#EAE4D7] overflow-hidden bg-[#FAF8F5]">
                      <Link
                        to={productUrl}
                        className="flex items-center justify-center h-full min-h-[142px] p-[32px_8px_12px] @max-[339px]:p-[38px_5px_12px]"
                        aria-label={`Xem ${p.title}`}
                      >
                        <img
                          src={getSafeProductImageUrl(p.imageUrl, p.title)}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-[96px] object-contain mix-blend-multiply"
                          onError={(event) => {
                            if (!event.currentTarget.dataset.hasFallback) {
                              event.currentTarget.dataset.hasFallback = 'true';
                              event.currentTarget.src = getSafeProductImageUrl(
                                null,
                                p.title,
                              );
                            }
                          }}
                        />
                      </Link>
                      {discount > 0 && (
                        <span className="absolute top-[8px] left-[6px] @max-[339px]:left-[4px] px-[5px] @max-[339px]:px-[3px] py-[2px] @max-[339px]:py-[1px] rounded-[5px] border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] text-[10px] @max-[339px]:text-[8px] font-[600] leading-[1.5] pointer-events-none">
                          −{discount}%
                        </span>
                      )}
                      <button
                        type="button"
                        className="absolute right-[8px] top-[8px] @max-[339px]:right-[5px] @max-[339px]:top-[6px] grid place-items-center w-[26px] h-[26px] @max-[339px]:w-[22px] @max-[339px]:h-[22px] rounded-full border border-[#EAE4D7] bg-white text-[#B88E4F] hover:border-[#C59B58] hover:bg-[#FBF5EB] transition-colors cursor-pointer disabled:opacity-60"
                        disabled={busy}
                        onClick={() => void removeItem(p.id)}
                        aria-label={`Bỏ yêu thích ${p.title}`}
                        title="Bỏ yêu thích"
                      >
                        {busy ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Heart size={13} fill="currentColor" />
                        )}
                      </button>
                      {unavailable && (
                        <span className="absolute bottom-[6px] inset-x-[6px] px-[4px] py-[2px] rounded-[5px] border border-[#EAE4D7] bg-white text-[#7D715E] text-[9px] text-center leading-[1.4]">
                          {p.isActive ? 'Tạm hết hàng' : 'Ngừng bán'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 gap-[7px] @max-[599px]:gap-[6px] p-0">
                      <Link
                        to={
                          p.store?.id ? `/shops/${p.store.id}` : '/marketplace'
                        }
                        className="flex items-center gap-[5px] min-w-0 text-[#7D715E] hover:text-[#B88E4F] text-[10px] no-underline transition-colors"
                      >
                        <Store size={12} className="shrink-0" />
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{p.store?.name || 'Gian hàng đối tác'}</span>
                      </Link>
                      <Link
                        to={productUrl}
                        className="line-clamp-2 text-[#1A1612] hover:text-[#B88E4F] text-[13px] @max-[599px]:text-[12px] font-[600] leading-[1.5] min-h-[39px] @max-[599px]:min-h-[36px] no-underline transition-colors"
                        title={p.title}
                      >
                        {p.title}
                      </Link>
                      <div className="flex items-center justify-between flex-wrap gap-[8px] mt-auto pt-[8px] border-t border-[#EAE4D7]">
                        <div className="flex items-baseline flex-wrap gap-[5px_8px]">
                          <strong className="text-[#1A1612] text-[17px] @max-[599px]:text-[16px] font-[650] leading-[1.4] tabular-nums">{formatMoney(p.price)}</strong>
                          {discount > 0 && (
                            <del className="text-[#7D715E] text-[10px] @max-[599px]:text-[9px] tabular-nums">{formatMoney(p.originalPrice!)}</del>
                          )}
                        </div>
                        <div className="flex items-center gap-[7px]">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-[6px] min-h-[32px] px-[10px] @max-[599px]:px-[8px] py-[6px] rounded-[7px] border border-[#EEDFC6] bg-[#FBF5EB] text-[#1A1612] text-[11px] @max-[599px]:text-[10px] font-[550] leading-[1.4] hover:border-[#C59B58] disabled:bg-[#F3EFE6] disabled:text-[#7D715E] disabled:cursor-not-allowed transition-colors cursor-pointer"
                            disabled={unavailable}
                            onClick={() => onBuy(p)}
                          >
                            <ShoppingBag size={13} className="text-[#B88E4F] shrink-0" />
                            <span>{unavailable ? 'Chưa thể mua' : 'Mua ngay'}</span>
                          </button>
                          <Link
                            to={productUrl}
                            className="grid place-items-center shrink-0 w-[32px] h-[32px] rounded-[7px] border border-[#EAE4D7] bg-white text-[#7D715E] hover:border-[#C59B58] hover:text-[#B88E4F] transition-colors"
                            aria-label={`Xem chi tiết ${p.title}`}
                            title="Xem chi tiết"
                          >
                            <ExternalLink size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
