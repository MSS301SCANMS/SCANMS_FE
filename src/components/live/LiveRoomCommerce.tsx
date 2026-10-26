import type { MouseEvent } from 'react';
import { ChevronDown, ChevronUp, Clock, ShoppingCart, Smile, X } from 'lucide-react';
import './LiveRoomCommerce.css';

type Reaction = { id: string; emoji: string; label: string; iconUrl: string; fallbackIconUrl?: string };
function ReactionImage({ reaction, size = 40 }: { reaction: Reaction; size?: number }) {
  return <picture>
    {reaction.fallbackIconUrl && <source srcSet={reaction.iconUrl} type="image/webp" media="(prefers-reduced-motion: no-preference)" />}
    <img src={reaction.fallbackIconUrl || reaction.iconUrl} alt="" width={size} height={size} draggable={false} decoding="async" />
  </picture>;
}
const reactionSource = (reaction: Reaction) => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ? reaction.fallbackIconUrl || reaction.iconUrl : reaction.iconUrl;
export function LiveReactionDock({ reactions, expanded, onExpandedChange, onReact, disabled = false }: {
  reactions: Reaction[]; expanded: boolean; onExpandedChange: (value: boolean) => void;
  onReact: (emoji: string, event: MouseEvent, iconUrl?: string) => void; disabled?: boolean;
}) {
  return <div className={`live-reaction-dock${expanded ? ' is-expanded' : ''}`}>
    {expanded && <section className="live-reaction-picker" aria-label="Chọn cảm xúc cho phiên Live">
      <div className="live-reaction-picker-heading"><span className="sr-only">Gửi cảm xúc · Vuốt ngang để xem thêm</span></div>
      <div className="live-reaction-grid">{reactions.map(item => <button type="button" key={item.id} disabled={disabled} aria-label={item.label} title={item.label} onClick={event => onReact(item.emoji, event, reactionSource(item))} className="live-reaction-option">
        <ReactionImage reaction={item} /><span className="sr-only">{item.label}</span>
      </button>)}</div>
      <a className="live-reaction-credit" href="https://googlefonts.github.io/noto-emoji-files/?view=docs" target="_blank" rel="noreferrer" aria-label="Nguồn icon: Google Noto Emoji, giấy phép CC BY 4.0" title="Animated Noto Emoji by Google, CC BY 4.0. Resized for SCANMS.">ⓘ</a>
    </section>}
    <div className="live-reaction-toolbar">
      <button type="button" className="live-reaction-toggle" aria-label={expanded ? 'Thu gọn cảm xúc' : 'Mở cảm xúc'} aria-expanded={expanded} onClick={() => onExpandedChange(!expanded)} title={expanded ? 'Thu gọn' : 'Cảm xúc'}>
        {expanded ? <X size={17} /> : <Smile size={21} strokeWidth={1.7} />}
      </button>
      <span className="live-reaction-divider" />
      <button type="button" disabled={disabled} className="live-reaction-heart" aria-label="Thả tim cho phiên Live" title="Thả tim" onClick={event => onReact(reactions[0].emoji, event, reactionSource(reactions[0]))}><ReactionImage reaction={reactions[0]} size={34} /></button>
    </div>
  </div>;
}

type PinnedProduct = { title: string; imageUrl?: string | null; price: number | string; livePrice?: number | string | null; discountPercentage?: number | string | null; voucherLabels?: string[]; offerVariantName?: string };
export function LivePinnedProductCard({ product, index, countdown, collapsed, onCollapsedChange, onAddToCart, onBuy, disabled = false }: {
  product: PinnedProduct; index: number; countdown: string; collapsed: boolean; onCollapsedChange: (value: boolean) => void;
  onAddToCart: () => void; onBuy: () => void; disabled?: boolean;
}) {
  const price = Number(product.livePrice ?? product.price);
  const original = Number(product.price);
  return collapsed ? <button type="button" className="live-product-mini" onClick={() => onCollapsedChange(false)} aria-label={`Mở sản phẩm ${product.title}`}>
    <img src={product.imageUrl || '/assets/product-placeholder.svg'} alt="" /><span><span className="live-product-mini-label">Đang giới thiệu #{index + 1}</span><strong>{price.toLocaleString('vi-VN')} ₫</strong></span><ChevronUp size={15} />
  </button> : <article className="live-product-card" aria-label="Sản phẩm đang giới thiệu">
    <div className="live-product-card-heading"><span className="live-product-intro"><i />Đang giới thiệu <b>#{index + 1}</b></span><span className="live-product-clock"><Clock size={12} />{countdown}</span><button type="button" aria-label="Thu gọn sản phẩm" title="Thu gọn sản phẩm" onClick={() => onCollapsedChange(true)}><ChevronDown size={16} /></button></div>
    <div className="live-product-summary"><div className="live-product-photo"><img src={product.imageUrl || '/assets/product-placeholder.svg'} alt={product.title} width={72} height={80} />{Number(product.discountPercentage) > 0 && <span>−{product.discountPercentage}%</span>}</div>
      <div className="live-product-details"><h4 title={product.title}>{product.title}</h4><div className="live-product-prices"><strong>{price.toLocaleString('vi-VN')}<small>₫</small></strong>{original > price && <del>{original.toLocaleString('vi-VN')} ₫</del>}</div><span className="live-product-price-caption">{product.offerVariantName ? `Giá live · ${product.offerVariantName}` : original > price ? 'Giá trong live · Chọn phân loại để xem giá' : 'Giá bán'}</span>{product.voucherLabels?.map(label => <span key={label} className="mt-1 block text-[10px] text-[#96703B]">{label}</span>)}</div>
    </div>
    <div className="live-product-actions"><button type="button" disabled={disabled} onClick={onAddToCart} className="live-product-cart"><ShoppingCart size={15} /><span>Thêm vào giỏ</span></button><button type="button" disabled={disabled} onClick={onBuy} className="live-product-buy">{disabled ? 'Phiên đã kết thúc' : 'Mua ngay'}</button></div>
  </article>;
}
