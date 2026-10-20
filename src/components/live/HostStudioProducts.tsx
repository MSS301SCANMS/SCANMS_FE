import { Loader2, Pin, PinOff } from 'lucide-react';

type Product = { id: string; title: string; imageUrl?: string | null; price: number; livePrice?: number };

export function HostStudioProducts({ products, pinnedId, pendingId, disabled, onPinChange }: {
  products: Product[];
  pinnedId: string | null;
  pendingId: string | null;
  disabled: boolean;
  onPinChange: (productId: string | null) => void;
}) {
  const money = (value: number) => `${Number(value).toLocaleString('vi-VN')} đ`;
  return <div className="px-4 py-3 sm:px-6">
    <p className="mb-3 text-xs leading-relaxed text-[#7D715E]">Chọn một sản phẩm để giới thiệu trên màn hình. Ghim món khác sẽ thay sản phẩm hiện tại.</p>
    <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
      {products.map((product, index) => {
        const pinned = product.id === pinnedId;
        const price = product.livePrice ?? product.price;
        const loading = pendingId === product.id;
        return <div key={product.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 transition-colors sm:flex-nowrap ${pinned ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7] bg-white'}`}>
          <span className="w-5 shrink-0 text-center text-xs tabular-nums text-[#7D715E]">{String(index + 1).padStart(2, '0')}</span>
          <div className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EAE4D7] bg-white p-1">
            <img src={product.imageUrl || undefined} alt={product.title} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            {pinned && <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#B88E4F]"><Pin size={11} /> Đang giới thiệu</span>}
            <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-[#1A1612]">{product.title}</h4>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-bold tabular-nums text-[#B88E4F]">{money(price)}</span>
              {product.price > price && <span className="text-xs text-[#7D715E] line-through">{money(product.price)}</span>}
            </div>
          </div>
          <button type="button" disabled={disabled || pendingId !== null} onClick={() => onPinChange(pinned ? null : product.id)}
            className={`ml-auto inline-flex h-10 min-w-32 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${pinned ? 'border-[#EEDFC6] bg-white text-[#7D715E] hover:border-[#C59B58] hover:text-[#1A1612]' : 'border-[#C59B58] bg-[#C59B58] text-[#1A1612] hover:bg-[#B88E4F]'}`}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : pinned ? <PinOff size={15} /> : <Pin size={15} />}
            {loading ? 'Đang cập nhật…' : pinned ? 'Bỏ ghim' : 'Ghim sản phẩm'}
          </button>
        </div>;
      })}
      {!products.length && <p className="rounded-xl border border-dashed border-[#EAE4D7] p-5 text-center text-sm text-[#7D715E]">Chưa có sản phẩm trong phiên Live.</p>}
    </div>
  </div>;
}
