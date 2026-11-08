import { useEffect, useRef, useState } from 'react';
import { Loader2, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import type { LiveOffer } from '../../services/live-commerce.service';
import { liveVariantQuote, type LiveVariant, type LiveVariantQuote } from '../../utils/live-purchase.utils';

export type { LiveVariant } from '../../utils/live-purchase.utils';
const money = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

export function LiveVariantPicker({
  title,
  imageUrl,
  variants,
  offers,
  action,
  loading,
  submitting,
  error,
  notice,
  disabledReason,
  onRetry,
  onClose,
  onChoose,
}: {
  title: string;
  imageUrl?: string | null;
  variants: LiveVariant[];
  offers: LiveOffer[];
  action: 'cart' | 'buy';
  loading?: boolean;
  submitting?: boolean;
  error?: string;
  notice?: string;
  disabledReason?: string;
  onRetry: () => void;
  onClose: () => void;
  onChoose: (variant: LiveVariant, quote: LiveVariantQuote, quantity: number) => void;
}) {
  const [selected, setSelected] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [now, setNow] = useState(Date.now());
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const variant = variants.find((row) => row.id === selected);
  const quote = variant ? liveVariantQuote(variant, offers, now) : null;
  const busy = loading || submitting;
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    return () => previous?.focus();
  }, []);
  useEffect(() => {
    if (!selected && variants.length === 1) setSelected(variants[0].id);
  }, [selected, variants]);
  const canSubmit =
    !busy &&
    !error &&
    !disabledReason &&
    variant &&
    quote &&
    quote.stockQuantity >= quantity &&
    Number.isSafeInteger(quantity) &&
    quantity > 0;
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-5"
      onClick={() => !submitting && onClose()}
    >
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Chọn phân loại trong live"
        aria-labelledby="live-purchase-title"
        className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-3xl border border-[#EAE4D7] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !submitting) onClose();
          if (event.key !== 'Tab') return;
          const buttons = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)');
          if (!buttons?.length) return;
          const first = buttons[0],
            last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <header className="flex items-center justify-between border-b border-[#EAE4D7] px-6 py-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-[#9B7137]">
            <ShoppingBag size={18} />
            Mua sắm trong live
          </span>
          <button
            ref={closeButton}
            type="button"
            aria-label="Đóng chọn sản phẩm"
            disabled={submitting}
            onClick={onClose}
            className="rounded-full p-2 hover:bg-[#FAF8F5]"
          >
            <X size={20} />
          </button>
        </header>
        <div className="space-y-5 p-6">
          <div className="flex gap-4">
            <img
              src={imageUrl || '/assets/product-placeholder.svg'}
              alt={title}
              className="h-28 w-24 rounded-2xl border border-[#EAE4D7] object-contain"
            />
            <div className="min-w-0">
              <h2 id="live-purchase-title" className="text-lg font-bold text-[#1A1612]">
                {title}
              </h2>
              <p className="mt-1 text-sm text-[#7D715E]">Chọn phân loại và số lượng của bạn.</p>
              {quote && (
                <div className="mt-3">
                  <strong className="text-xl text-[#9B7137]">
                    {Number.isFinite(quote.price) ? money(quote.price) : 'Chưa có giá'}
                  </strong>
                  {quote.price < quote.listPrice && (
                    <del className="ml-2 text-sm text-[#7D715E]">{money(quote.listPrice)}</del>
                  )}
                  <p className="mt-1 text-xs text-[#7D715E]">
                    {quote.offerId ? 'Ưu đãi trong live' : 'Giá niêm yết'} · Còn {quote.stockQuantity} sản phẩm
                  </p>
                </div>
              )}
            </div>
          </div>
          {loading ? (
            <p role="status" className="flex items-center gap-2 text-sm text-[#7D715E]">
              <Loader2 size={17} className="animate-spin" />
              Đang cập nhật giá và tồn kho…
            </p>
          ) : (
            <>
              <fieldset disabled={submitting}>
                <legend className="mb-2 text-sm font-semibold">Phân loại</legend>
                <div className="flex flex-wrap gap-2">
                  {variants.map((row) => {
                    const available = liveVariantQuote(row, offers, now).stockQuantity > 0;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        aria-pressed={selected === row.id}
                        disabled={!available}
                        onClick={() => {
                          setSelected(row.id);
                          setQuantity(1);
                        }}
                        className={`rounded-xl border px-4 py-2.5 text-sm disabled:opacity-40 ${selected === row.id ? 'border-[#C59B58] bg-[#FBF5EB] text-[#9B7137]' : 'border-[#EAE4D7]'}`}
                      >
                        {row.name || [row.color, row.size].filter(Boolean).join(' / ') || 'Tiêu chuẩn'}
                        {!available && ' · Hết hàng'}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              {variant && quote && (
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="live-purchase-quantity" className="text-sm font-semibold">
                    Số lượng
                  </label>
                  <div className="flex items-center rounded-xl border border-[#EAE4D7]">
                    <button
                      type="button"
                      aria-label="Giảm số lượng"
                      disabled={submitting || quantity <= 1}
                      onClick={() => setQuantity((value) => value - 1)}
                      className="p-3 disabled:opacity-30"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      id="live-purchase-quantity"
                      aria-label="Số lượng mua trong live"
                      type="number"
                      min={1}
                      max={quote.stockQuantity}
                      step={1}
                      disabled={submitting}
                      value={quantity}
                      onChange={(event) =>
                        setQuantity(Math.max(1, Math.min(quote.stockQuantity || 1, Number(event.target.value) || 1)))
                      }
                      className="w-16 border-x border-[#EAE4D7] py-2 text-center"
                    />
                    <button
                      type="button"
                      aria-label="Tăng số lượng"
                      disabled={submitting || quantity >= quote.stockQuantity}
                      onClick={() => setQuantity((value) => value + 1)}
                      className="p-3 disabled:opacity-30"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {(notice || error || disabledReason || (quote && quantity > quote.stockQuantity)) && (
            <div role="alert" className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-sm text-[#946C35]">
              {disabledReason ||
                error ||
                (quote && quantity > quote.stockQuantity
                  ? 'Tồn kho hoặc số lượng ưu đãi vừa thay đổi. Vui lòng giảm số lượng.'
                  : notice)}
              {error && (
                <button type="button" disabled={busy} onClick={onRetry} className="ml-2 underline">
                  Tải lại
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-[#7D715E]">
            Voucher và phí giao hàng được kiểm tra ở bước thanh toán. Giá live chỉ áp dụng khi phiên còn phát.
          </p>
        </div>
        <footer className="flex items-center justify-between gap-4 border-t border-[#EAE4D7] bg-[#FFFCF8] px-6 py-4">
          <div>
            <span className="block text-xs text-[#7D715E]">Tiền hàng</span>
            <strong className="text-lg">
              {quote && Number.isFinite(quote.price) ? money(quote.price * quantity) : 'Chọn phân loại'}
            </strong>
          </div>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => variant && quote && onChoose(variant, quote, quantity)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#C59B58] px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Đang kiểm tra…' : action === 'buy' ? 'Tiếp tục thanh toán' : 'Thêm vào giỏ'}
          </button>
        </footer>
      </section>
    </div>
  );
}
