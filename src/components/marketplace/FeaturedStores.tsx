import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Star, Store } from 'lucide-react';
import type { MarketplaceStore } from '@/types/marketplace-home.types';
import { useLoopingStoreRail } from './useLoopingStoreRail';
import './FeaturedStores.css';

export function StoreLogo({ store, className = 'h-16 w-16' }: { store: MarketplaceStore; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = store.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] text-lg font-black text-[#B88E4F] ${className}`}>
      {store.logoUrl && store.logoUrl !== failedUrl
        ? <img src={store.logoUrl} alt={`Logo ${store.name}`} loading="lazy" onError={() => setFailedUrl(store.logoUrl!)} className="h-full w-full object-contain p-1" />
        : <span aria-label={store.name}>{initials || <Store size={24} />}</span>}
    </span>
  );
}

export function FeaturedStores({ stores, loading, failed, onRetry }: { stores: MarketplaceStore[]; loading: boolean; failed: boolean; onRetry: () => void }) {
  const looping = stores.length > 1;
  const { rail, scroll, interactionProps, railProps } = useLoopingStoreRail(looping && !loading, stores.map(store => store.id).join('|'));
  const items = looping ? Array.from({ length:Math.max(1, Math.ceil(4 / stores.length)) }, () => stores).flat() : stores;

  return (
    <section id="featured-stores" aria-labelledby="featured-stores-title" className="scroll-mt-36 bg-[#FAF8F5] py-5 text-left sm:py-7">
      <div className="mx-auto max-w-[1200px] px-3 sm:px-4 lg:px-6">
        <div className="rounded-3xl border border-[#EAE4D7] bg-white px-4 py-6 sm:px-6 sm:py-7" {...interactionProps}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1 basis-full sm:basis-auto">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#B88E4F]">THƯƠNG HIỆU TRÊN SCANMS</p>
            <h2 id="featured-stores-title" className="m-0 text-xl font-black tracking-tight sm:text-2xl">Gian hàng đối tác tiêu biểu</h2>
          </div>
          <div className="ml-auto flex shrink-0 gap-1">
            <button type="button" onClick={() => scroll(-1)} aria-label="Gian hàng trước" className="rounded-full border border-[#EAE4D7] bg-white p-3 hover:border-[#C59B58]"><ArrowLeft size={16} /></button>
            <button type="button" onClick={() => scroll(1)} aria-label="Gian hàng tiếp theo" className="rounded-full border border-[#EAE4D7] bg-white p-3 hover:border-[#C59B58]"><ArrowRight size={16} /></button>
          </div>
        </div>
        {loading ? (
          <div aria-label="Đang tải gian hàng" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((index) => <div key={index} className="h-56 animate-pulse rounded-2xl border border-[#EAE4D7] bg-[#F3EFE6]" />)}</div>
        ) : stores.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#EEDFC6] bg-white p-8 text-center">
            <Store className="mx-auto mb-3 text-[#B88E4F]" />
            <p className="text-sm text-[#7D715E]">{failed ? 'Chưa tải được danh sách gian hàng.' : 'Các gian hàng đối tác đang được cập nhật.'}</p>
            {failed && <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-[#C59B58] px-4 py-2 text-xs font-bold text-[#231D15]">Thử lại</button>}
          </div>
        ) : (
          <div ref={rail} role="region" aria-label="Danh sách gian hàng, vuốt để xem thêm" tabIndex={0} className="featured-store-rail no-scrollbar focus-visible:outline-[#C59B58]" {...railProps}>
            {(looping ? [0, 1, 2] : [1]).map(copy => <div key={copy} className="featured-store-group" aria-hidden={copy !== 1 || undefined}>
            {items.map((store, index) => {
              const duplicate = copy !== 1 || index >= stores.length;
              return (
              <article key={`${store.id}-${index}`} aria-hidden={duplicate || undefined} className="featured-store-card flex shrink-0 flex-col rounded-2xl border border-[#EAE4D7] bg-white p-5 transition hover:border-[#C59B58] hover:shadow-[0_8px_24px_rgba(75,57,34,0.08)]">
                <div className="flex items-center gap-3">
                  <StoreLogo store={store} />
                  <div className="min-w-0">
                    <h3 className="m-0 flex items-center gap-1 text-sm font-black"><Link to={`/shops/${store.id}`} tabIndex={duplicate ? -1 : undefined} className="truncate hover:text-[#B88E4F]">{store.name}</Link>{store.isVerified && <BadgeCheck size={16} className="shrink-0 text-[#B88E4F]" aria-label="Đã xác minh" />}</h3>
                    <p className="mt-1 truncate text-[11px] text-[#7D715E]">{store.category || 'Đối tác SCANMS'}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7D715E]">
                  <span className="inline-flex items-center gap-1"><Star size={14} className="fill-[#C59B58] text-[#C59B58]" /><strong className="text-[#1A1612]">{store.rating != null ? Number(store.rating).toFixed(1) : 'Chưa có đánh giá'}</strong>{!!store.reviewCount && <span>({store.reviewCount})</span>}</span>
                  <span>{store.totalProducts ?? 0} sản phẩm</span>
                </div>
                <p className="mb-4 mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-[#7D715E]">{store.description || 'Khám phá danh mục sản phẩm và thông tin trực tiếp từ gian hàng.'}</p>
                <Link to={`/shops/${store.id}`} tabIndex={duplicate ? -1 : undefined} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 text-xs font-bold text-[#1A1612] hover:border-[#C59B58] hover:bg-[#F3EFE6]">Ghé thăm gian hàng<ArrowRight size={15} /></Link>
              </article>
            );})}
            </div>)}
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
