import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert, Heart, MessageCircle, ShoppingCart, Store } from 'lucide-react';
import { useScanmsChat } from '@/context/ScanmsChatContext';
import type { Product } from '@/types/marketplace.types';
import { formatMoney, getSafeProductImageUrl } from '@/utils/marketplace.utils';
import { LiveSessionDealBadge } from '@/components/product/LiveSessionDealBadge';
import './MarketplaceProductCard.css';

interface Props {
  product: Product;
  wished: boolean;
  onWishlist: () => void;
  onPurchase: (intent: 'cart' | 'buy', variantId?: string, quantity?: number) => void;
  deal: React.ComponentProps<typeof LiveSessionDealBadge>['deal'];
  now: number;
}

function variantChoiceCopy(names: string[]) {
  const choices = names.map((name) => name.split('/').map((part) => part.trim()));
  const quantity = choices.map(([first]) => first);
  const kind = [
    { pattern: /^\d+(?:[.,]\d+)?\s*(?:ml|l)$/i, label: 'Dung tích', prompt: 'Chọn dung tích' },
    { pattern: /^\d+(?:[.,]\d+)?\s*(?:g|kg)$/i, label: 'Khối lượng', prompt: 'Chọn khối lượng' },
    { pattern: /^\d+\s*(?:miếng|cái|chiếc|viên|gói)$/i, label: 'Số lượng', prompt: 'Chọn số lượng' },
  ].find(({ pattern }) => quantity.length > 0 && quantity.every((value) => pattern.test(value)));
  if (!kind) return { label: 'Tùy chọn sản phẩm', prompt: 'Chọn loại sản phẩm' };
  const hasPackaging = choices.every((parts) => parts.length === 2 && /^(?:Tiêu chuẩn|Hộp quà)$/i.test(parts[1]));
  return { label: `${kind.label}${hasPackaging ? ' · Đóng gói' : ''}`, prompt: kind.prompt };
}

export function MarketplaceProductCard({ product, wished, onWishlist, onPurchase, deal, now }: Props) {
  const { openChat } = useScanmsChat();
  const [variantId, setVariantId] = useState('');
  const [choosing, setChoosing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const choiceId = useId();
  const choiceRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const variants = (product.variants || []).filter((variant) => variant.isActive !== false);
  const choiceCopy = variantChoiceCopy(variants.map((candidate) => candidate.name));
  const variant = variants.find((candidate) => candidate.id === variantId);
  const price = variant?.price != null ? Number(variant.price) : product.price;
  const available = variants.length ? variants.some((candidate) => candidate.stockQuantity > 0) : (product.stockQuantity ?? 0) > 0;
  const selectedAvailable = !variant || variant.stockQuantity > 0;
  const needsSelection = choosing && !variant;
  const selectedStock = Math.max(0, variant?.stockQuantity ?? product.stockQuantity ?? 0);

  useEffect(() => {
    setQuantity(current => Math.max(1, Math.min(current, selectedStock || 1)));
  }, [variantId, selectedStock]);

  useEffect(() => {
    if (!choosing) return;
    selectRef.current?.focus({ preventScroll: true });
    choiceRef.current?.scrollIntoView({ block: 'nearest' });
  }, [choosing]);

  const buy = (intent: 'cart' | 'buy') => {
    if (!available) return;
    if (intent === 'buy') {
      onPurchase('buy');
      return;
    }
    if (!selectedAvailable) return;
    if (variants.length && !variant) {
      setChoosing(true);
      selectRef.current?.focus({ preventScroll: true });
      choiceRef.current?.scrollIntoView({ block: 'nearest' });
      return;
    }
    onPurchase(intent, variant?.id, quantity);
  };

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white text-left transition hover:border-[#C59B58] hover:shadow-[0_8px_24px_rgba(75,57,34,0.10)]">
      <div className="relative aspect-square overflow-hidden bg-white">
        <Link to={`/products/${product.sku || product.id}`} className="block h-full w-full">
          <img src={product.image} alt={product.name} loading="lazy" onError={(event) => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = 'true'; event.currentTarget.src = getSafeProductImageUrl(null, product.name); } }} className="h-full w-full object-contain p-3 transition motion-safe:group-hover:scale-[1.03]" />
        </Link>
        <LiveSessionDealBadge deal={deal} now={now} />
        {product.origPrice > price && <span className="absolute left-2 top-2 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-2 py-1 text-[10px] font-bold text-[#8C6226]">−{Math.round((product.origPrice - price) / product.origPrice * 100)}%</span>}
        <button type="button" onClick={onWishlist} aria-label={wished ? `Bỏ lưu ${product.name}` : `Lưu ${product.name}`} aria-pressed={wished} className="group/wishlist absolute right-0.5 top-0.5 flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-[#7D715E] hover:text-[#DC2626] focus-visible:outline-[#C59B58]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#EAE4D7] bg-white/95 shadow-[0_1px_4px_rgba(35,29,21,0.05)] transition-colors group-hover/wishlist:border-[#EEDFC6]"><Heart size={15} strokeWidth={1.7} className={wished ? 'fill-[#DC2626] text-[#DC2626]' : ''} /></span>
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="m-0 line-clamp-2 min-h-10 text-xs font-semibold leading-5 sm:text-sm"><Link to={`/products/${product.sku || product.id}`} className="hover:text-[#B88E4F]">{product.name}</Link></h3>
        <div className={`mt-2 grid min-w-0 gap-1.5 ${product.storeId ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Link to={product.storeId ? `/shops/${product.storeId}` : '/search'} title={product.brand} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] px-1 text-[10px] font-medium text-[#655A49] transition-colors hover:border-[#C59B58] hover:bg-[#FBF5EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C59B58] sm:gap-1.5 sm:px-2 sm:text-[11px]"><Store size={13} className="shrink-0" /><span className="truncate">{product.brand}</span></Link>
          {product.storeId && <button type="button" aria-label={`Nhắn tin với shop ${product.brand}`} title={`Nhắn tin với shop ${product.brand}`} onClick={() => openChat(
            { id: product.storeId!, name: product.brand },
            { id: product.id, title: product.name, imageUrl: product.image, price },
          )} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-1 text-[10px] font-medium text-[#9B7137] transition-colors hover:border-[#C59B58] hover:bg-[#F5EAD8] hover:text-[#785221] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C59B58] sm:gap-1.5 sm:px-2 sm:text-[11px]">
            <MessageCircle size={14} className="shrink-0" aria-hidden="true" /><span className="truncate">Nhắn tin</span>
          </button>}
        </div>
        <p className="mb-2 mt-2 text-[10px] text-[#7D715E]">{available ? `Còn ${selectedStock} sản phẩm${variant ? ' ở phân loại này' : ''}` : 'Tạm hết hàng'}</p>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 border-t border-[#EAE4D7] pt-3"><strong className="text-sm text-[#1A1612] sm:text-base">{formatMoney(price)}</strong>{product.origPrice > price && <del className="text-[10px] text-[#7D715E]">{formatMoney(product.origPrice)}</del>}</div>
        {variants.length > 0 && (choosing || variantId) && <div ref={choiceRef} className="marketplace-variant-choice mt-3" data-required={needsSelection}>
          <label htmlFor={choiceId} className="block text-[10px] text-[#7D715E]">{choiceCopy.label}</label>
          <select ref={selectRef} id={choiceId} aria-required="true" aria-invalid={needsSelection} aria-describedby={needsSelection ? `${choiceId}-hint` : undefined} value={variantId} onChange={(event) => setVariantId(event.target.value)} className="marketplace-variant-select mt-1 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-medium text-[#1A1612] outline-[#C59B58]"><option value="">{choiceCopy.prompt}</option>{variants.map((candidate) => <option key={candidate.id} value={candidate.id} disabled={candidate.stockQuantity <= 0}>{candidate.name}{candidate.stockQuantity <= 0 ? ' · Hết hàng' : ''}</option>)}</select>
          {needsSelection && <p id={`${choiceId}-hint`} className="marketplace-variant-hint" role="alert"><CircleAlert size={13} aria-hidden="true" /><span>Vui lòng {choiceCopy.prompt.toLocaleLowerCase('vi-VN')} để tiếp tục.</span></p>}
        </div>}
        {variant && <label className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[#7D715E]">
          <span>Số lượng thêm vào giỏ</span>
          <input type="number" min={1} max={selectedStock} step={1} value={quantity}
            disabled={selectedStock <= 0} aria-label={`Số lượng ${product.name}`}
            onChange={event => setQuantity(Math.max(1, Math.min(selectedStock || 1, Math.floor(Number(event.target.value)) || 1)))}
            className="w-16 rounded-lg border border-[#EAE4D7] bg-white px-2 py-2 text-center text-xs text-[#1A1612]" />
        </label>}
        <div className="mt-3 grid grid-cols-[44px_1fr] gap-2">
          <button type="button" onClick={() => buy('cart')} disabled={!available || !selectedAvailable} aria-label={`Thêm ${product.name} vào giỏ`} title="Thêm vào giỏ" className="flex h-11 items-center justify-center rounded-xl border border-[#C59B58] text-[#B88E4F] hover:bg-[#FBF5EB] disabled:border-[#EAE4D7] disabled:text-[#7D715E] disabled:opacity-50"><ShoppingCart size={17} /></button>
          <button type="button" onClick={() => buy('buy')} disabled={!available} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#C59B58] px-2 text-center text-[10px] font-semibold leading-4 text-[#231D15] hover:bg-[#B88E4F] disabled:bg-[#F3EFE6] disabled:text-[#7D715E] sm:text-[11px]">{!available ? 'Hết hàng' : 'Mua ngay'}</button>
        </div>
      </div>
    </article>
  );
}
