import { useState } from 'react';
import { isLiveOfferActive, type LiveOffer } from '../../services/live-commerce.service';

export interface LiveVariant { id: string; name?: string; size?: string; color?: string; price?: number; stockQuantity: number; isActive?: boolean }
export function LiveVariantPicker({ title, variants, offers, onClose, onChoose }: {
  title: string; variants: LiveVariant[]; offers: LiveOffer[]; onClose: () => void; onChoose: (variant: LiveVariant, price: number) => void;
}) {
  const [selected, setSelected] = useState('');
  const variant = variants.find(row => row.id === selected);
  const offer = variant ? offers.find(row => row.variantId === variant.id && isLiveOfferActive(row)) : undefined;
  const price = Number(offer?.priceVnd ?? variant?.price ?? 0);
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label="Chọn phân loại trong live" className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-6 shadow-xl" onClick={event => event.stopPropagation()}>
      <h2 className="text-lg font-bold">{title}</h2><p className="text-sm text-[#7D715E]">Chọn size / màu để mua ngay trong phòng live.</p>
      <div className="flex flex-wrap gap-2">{variants.map(row => <button key={row.id} type="button" aria-pressed={selected === row.id} disabled={row.isActive === false || row.stockQuantity <= 0} onClick={() => setSelected(row.id)} className={`rounded-xl border px-4 py-3 text-sm disabled:opacity-40 ${selected === row.id ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7]'}`}>{row.name || [row.color, row.size].filter(Boolean).join(' / ') || row.id.slice(0, 8)}</button>)}</div>
      {variant && <p className="text-sm"><strong>{price.toLocaleString('vi-VN')}đ</strong> · Còn {Math.min(variant.stockQuantity, offer ? offer.quantityLimit - offer.reservedQuantity : variant.stockQuantity)}{offer && ' · Giá trong live'}</p>}
      <div className="flex gap-3"><button type="button" className="rounded-xl border px-4 py-2" onClick={onClose}>Đóng</button><button type="button" className="flex-1 rounded-xl bg-[#C59B58] px-4 py-2 font-semibold text-white disabled:opacity-40" disabled={!variant || variant.stockQuantity <= 0 || price <= 0} onClick={() => variant && onChoose(variant, price)}>Xác nhận phân loại</button></div>
    </section>
  </div>;
}
