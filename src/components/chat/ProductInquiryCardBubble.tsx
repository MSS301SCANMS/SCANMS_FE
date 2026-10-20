import { useState } from 'react';
import { ShoppingBag, ExternalLink } from 'lucide-react';

export interface ProductInquiryCardData {
  type: 'PRODUCT_INQUIRY';
  productId: string;
  productTitle: string;
  productImage?: string;
  productPrice?: number;
  productSku?: string;
  commissionRate?: number;
  message?: string;
}

export function ProductInquiryCardBubble({ card }: { card: ProductInquiryCardData; isMine: boolean }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return (
    <article className="w-80 max-w-[min(100%,calc(100vw-48px))] overflow-hidden border border-[#EAE4D7] rounded-[15px] bg-white text-[#1A1612] text-left shadow-[0_3px_12px_rgba(35,29,21,0.02)]">
      <header className="flex items-center gap-1.5 px-3 pt-2.5 pb-0">
        <span className="w-6 h-6 grid place-items-center shrink-0 rounded-[7px] bg-[#FBF5EB] text-[#B88E4F]"><ShoppingBag size={14} /></span>
        <strong className="text-[10px] font-medium text-[#7D715E]">Trao đổi sản phẩm</strong>
        {card.commissionRate != null && <span className="flex flex-wrap justify-center gap-1 items-center ml-auto px-2 py-1 border border-[#EEDFC6] rounded-full bg-[#FBF5EB] text-[#8C6226] text-[9px] leading-tight">Hoa hồng <strong className="font-semibold">{card.commissionRate}%</strong></span>}
      </header>
      <div className="p-3">
        <div className="flex items-center gap-2.5">
          {card.productImage && failedImage !== card.productImage ? (
            <img src={card.productImage} alt={card.productTitle} onError={() => setFailedImage(card.productImage || null)} className="w-16 h-16 shrink-0 border border-[#EAE4D7] rounded-[11px] bg-[#FAF8F5] object-contain p-1" />
          ) : (
            <div className="w-16 h-16 shrink-0 border border-[#EAE4D7] rounded-[11px] bg-[#FAF8F5] grid place-items-center text-[#B88E4F]"><ShoppingBag size={20} /></div>
          )}
          <div className="min-w-0">
            <h4 className="m-0 text-xs leading-snug font-semibold break-words text-[#1A1612]">{card.productTitle}</h4>
            {card.productSku && <p className="m-0 mt-0.5 text-[9px] leading-tight text-[#7D715E] break-words">SKU: {card.productSku}</p>}
            {typeof card.productPrice === 'number' && <strong className="block mt-1 text-[13px] font-semibold text-[#B88E4F] tabular-nums">{card.productPrice.toLocaleString('vi-VN')} ₫</strong>}
          </div>
        </div>
        {card.message && <blockquote className="mt-3 p-2.5 border border-[#F0EAE0] rounded-[10px] bg-[#FAF8F5] text-[#7D715E] text-[11px] leading-relaxed whitespace-pre-wrap break-words m-0">{card.message}</blockquote>}
      </div>
      <footer className="px-3 pb-3">
        <a href={`/products/${card.productSku || card.productId}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 min-h-[32px] px-2.5 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#8C6226] text-[10px] font-medium hover:bg-[#F3EFE6] transition-colors no-underline">
          <span>Xem chi tiết sản phẩm</span>
          <ExternalLink size={13} className="text-[#B88E4F] shrink-0" />
        </a>
      </footer>
    </article>
  );
}
