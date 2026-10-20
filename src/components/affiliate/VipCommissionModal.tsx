import { useEffect, useRef, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Crown, X, Check, CheckCircle2, Info, Loader2, ArrowRight, ChevronDown } from 'lucide-react';

interface Props {
  creator: { fullName: string; avatarUrl?: string; handle?: string; email: string; tier?: string; kycStatus?: string; commissionRate?: number };
  rate: number;
  saving: boolean;
  onRateChange: (rate: number) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

const money = (amount: number) => `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
const tiers: Record<string, string> = { GOLD: 'Vàng', SILVER: 'Bạc', BRONZE: 'Đồng', DIAMOND: 'Kim cương' };

export function VipCommissionModal({ creator, rate, saving, onRateChange, onClose, onSubmit }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const currentRate = creator.commissionRate ?? 10;
  const difference = (rate - currentRate) * 5000;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] p-4 flex items-center justify-center bg-[#231D15]/35 backdrop-blur-xs" onClick={() => { if (!saving) onClose(); }}>
      <div
        ref={dialogRef}
        className="w-full max-w-[360px] max-h-[calc(100dvh-32px)] flex flex-col border border-[#EAE4D7] rounded-[18px] bg-white text-[#1A1612] shadow-[0_24px_80px_rgba(35,29,21,0.15)] outline-none overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vip-commission-title"
        tabIndex={-1}
        onClick={event => event.stopPropagation()}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.stopPropagation(); if (!saving) onClose(); }
          if (event.key === 'Tab') {
            const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), summary')).filter(item => item.getClientRects().length);
            const first = items[0], last = items[items.length - 1];
            if (!first) { event.preventDefault(); return; }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && (document.activeElement === last || document.activeElement === event.currentTarget)) { event.preventDefault(); first.focus(); }
          }
        }}
      >
        <header className="flex items-center gap-2 px-4 pt-3.5 pb-3 border-b border-[#F3EFE6]">
          <span className="grid place-items-center w-6 h-6 shrink-0 text-[#B88E4F]"><Crown size={17} /></span>
          <div><h3 id="vip-commission-title" className="m-0 text-[17px] font-semibold leading-6 tracking-tight text-[#1A1612]">Hoa hồng VIP</h3></div>
          <button type="button" disabled={saving} aria-label="Đóng hoa hồng VIP" onClick={onClose} className="grid place-items-center ml-auto w-7 h-7 border-0 rounded-lg bg-[#FAF8F5] text-[#7D715E] hover:bg-[#FBF5EB] hover:text-[#1A1612] cursor-pointer transition-colors"><X size={17} /></button>
        </header>
        <form onSubmit={onSubmit} className="flex flex-col min-h-0">
          <div className="px-4 pt-3 pb-2 overflow-y-auto [scrollbar-width:thin]">
            <section className="flex items-center gap-2.5 px-0.5" aria-label="Đối tác nhận hoa hồng">
              <span className="grid place-items-center w-9 h-9 shrink-0 overflow-hidden border border-[#EEDFC6] rounded-[10px] bg-[#F3EFE6] text-[#B88E4F] text-[13px] font-semibold">
                {creator.avatarUrl ? <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" /> : creator.fullName.charAt(0)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <strong className="text-xs font-semibold leading-[18px] text-[#1A1612] break-words">{creator.fullName}</strong>
                  {creator.kycStatus === 'VERIFIED' && <CheckCircle2 size={13} className="shrink-0 text-[#059669]" aria-label="Đã xác minh danh tính" />}
                </div>
                <p className="m-0 mt-0.5 text-[10px] text-[#7D715E] truncate">Đối tác nhận tỷ lệ riêng</p>
              </div>
            </section>
            <section className="my-4">
              <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-2 text-center">
                <div className="flex flex-col items-center justify-center p-2.5 rounded-[10px] bg-[#FAF8F5]">
                  <span className="text-[#7D715E] text-[11px] leading-4">Hiện tại</span>
                  <strong className="text-[#7D715E] text-[27px] font-medium leading-9 tabular-nums">{currentRate}<span className="ml-0.5 text-sm">%</span></strong>
                </div>
                <ArrowRight size={16} aria-hidden="true" className="mx-auto text-[#B88E4F]" />
                <div className="flex flex-col items-center justify-center p-2.5 rounded-[10px] bg-[#FBF5EB] border border-[#EEDFC6]">
                  <label htmlFor="vip-commission-rate" className="block text-[11px] font-medium text-[#7D715E]">Tỷ lệ VIP mới</label>
                  <output htmlFor="vip-commission-rate" className="text-[#B88E4F] text-[30px] leading-9 font-semibold tracking-tight tabular-nums">{rate}<span className="ml-0.5 text-base font-medium">%</span></output>
                </div>
              </div>
              <input
                id="vip-commission-rate"
                type="range"
                min={11}
                max={13}
                step={1}
                value={rate}
                disabled={saving}
                onChange={event => onRateChange(Number(event.target.value))}
                className="block w-full h-[5px] my-4 border-0 rounded-lg appearance-none cursor-pointer accent-[#C59B58]"
                style={{ background: `linear-gradient(to right, #C59B58 ${Math.max(0, Math.min(100, (rate - 11) / 2 * 100))}%, #EAE4D7 0)` }}
              />
              <div className="flex justify-between text-[#7D715E] text-[10px]"><span>10% cơ bản + 1% VIP</span><span>10% cơ bản + 3% VIP</span></div>
              <div className="grid grid-cols-3 gap-1 mt-3 p-1 border border-[#EAE4D7] rounded-[10px] bg-[#FAF8F5]" role="group" aria-label="Chọn nhanh tỷ lệ hoa hồng">
                {[11, 12, 13].map(value => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={rate === value}
                    disabled={saving}
                    onClick={() => onRateChange(value)}
                    className={`min-w-0 h-[29px] px-2 py-1 border rounded-[7px] text-[11px] cursor-pointer transition-colors ${
                      rate === value
                        ? 'border-[#EEDFC6] bg-white text-[#1A1612] font-semibold shadow-xs'
                        : 'border-transparent bg-transparent text-[#7D715E] hover:bg-white'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </section>
            <details className="mt-2 text-xs group">
              <summary className="flex items-center justify-between py-2 px-0.5 text-[#7D715E] text-[11px] leading-4 cursor-pointer list-none select-none">
                Xem dự tính hoa hồng <ChevronDown size={14} aria-hidden="true" className="text-[#B88E4F] group-open:rotate-180 transition-transform" />
              </summary>
              <div className="flex justify-between items-center gap-2 my-1 text-[#7D715E] text-[10px]">
                <span className="min-w-0 break-words">{(creator.handle || creator.email).replace(/^@+/, '@')}</span>
                {creator.tier && <span className="px-1.5 py-0.5 border border-[#EEDFC6] rounded-md bg-white text-[#B88E4F] text-[10px] whitespace-nowrap">{tiers[creator.tier] || creator.tier}</span>}
              </div>
              <section className="flex justify-between items-center gap-3 p-3 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB]" aria-label="Hoa hồng dự tính" aria-live="polite">
                <div><strong className="block text-xs font-semibold text-[#1A1612]">Hoa hồng dự tính</strong><p className="m-0 mt-1 text-[#7D715E] text-[10px] leading-4">Với đơn hàng 500.000 ₫</p></div>
                <div className="text-right"><strong className="text-[#B88E4F] text-xl font-semibold tabular-nums whitespace-nowrap">{money(500000 * rate / 100)}</strong>{difference !== 0 && <p className={`m-0 text-[10px] ${difference > 0 ? 'text-[#059669]' : 'text-[#7D715E]'}`}>{difference > 0 ? '+' : '−'}{money(Math.abs(difference))} so với hiện tại</p>}</div>
              </section>
              <p className="flex items-start gap-1.5 mt-3 text-[10px] leading-relaxed text-[#7D715E]"><Info size={14} className="shrink-0 mt-0.5 text-[#B88E4F]" /><span>Tỷ lệ riêng cho đơn tiếp thị liên kết và phiên Live của KOL này.</span></p>
            </details>
          </div>
          <footer className="flex justify-end gap-2 px-4 pb-4 pt-1 bg-white border-t border-[#F3EFE6]">
            <button type="button" disabled={saving} onClick={onClose} className="flex items-center justify-center gap-1.5 h-[38px] px-3.5 border border-[#EAE4D7] rounded-[10px] bg-white text-[#7D715E] text-xs font-medium cursor-pointer hover:bg-[#FAF8F5]">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 h-[38px] px-3.5 border border-[#EEDFC6] rounded-[10px] bg-[#FBF5EB] text-[#1A1612] text-xs font-semibold hover:bg-[#F3E8D5] cursor-pointer">
              {saving ? <Loader2 size={16} className="animate-spin text-[#B88E4F]" /> : <Check size={16} className="text-[#B88E4F]" />}
              {saving ? 'Đang lưu…' : `Lưu tỷ lệ ${rate}%`}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
