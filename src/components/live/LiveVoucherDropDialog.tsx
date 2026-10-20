import { useEffect, useState } from 'react';
import { CheckCircle2, Gift, Loader2, Ticket, X } from 'lucide-react';
import api from '../../services/api';

export function LiveVoucherDropDialog({ sessionId, onClose, onReleased }: {
  sessionId: string;
  onClose: () => void;
  onReleased: (drop: any) => void;
}) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState(false);
  const [quantity, setQuantity] = useState('50');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void api.get(`/livestreams/${sessionId}`, { headers: { 'x-skip-cache': '1' } }).then((res: any) => {
      const data = res?.data?.data || res?.data || res;
      if (!active) return;
      setSession(data);
      const coupon = data?.coupon;
      const remaining = coupon?.usageLimitTotal == null ? 50 : Math.max(0, coupon.usageLimitTotal - coupon.usageCount);
      setQuantity(String(Math.min(50, remaining)));
    }).catch(() => { if (active) setError('Chưa tải được voucher. Vui lòng thử lại.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sessionId, retry]);
  const coupon = session?.coupon;
  const remaining = coupon?.usageLimitTotal == null ? null : Math.max(0, coupon.usageLimitTotal - coupon.usageCount);
  const active = session?.status === 'LIVE' && coupon?.status === 'ACTIVE' && (remaining === null || remaining > 0);
  const count = Number(quantity);
  const valid = selected && active && Number.isInteger(count) && count > 0 && count <= 10000 && (remaining === null || count <= remaining);
  const money = (amount: number) => `${Number(amount).toLocaleString('vi-VN')} đ`;
  const submit = async () => {
    if (!valid || sending) return;
    setSending(true);
    setError('');
    try {
      const res: any = await api.post(`/livestreams/${sessionId}/voucher-drop`, { couponId: coupon.id, quantity: count });
      onReleased(res?.data?.data || res?.data || res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Chưa tung được voucher. Vui lòng thử lại.');
    } finally { setSending(false); }
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#231D15]/50 p-4 backdrop-blur-sm" onClick={() => { if (!sending) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="voucher-drop-title" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-[#EAE4D7] bg-white shadow-2xl" onClick={event => event.stopPropagation()}>
      <div className="flex items-start gap-3 border-b border-[#EAE4D7] p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FBF5EB] text-[#B88E4F]"><Gift size={22} /></span>
        <div className="flex-1"><h2 id="voucher-drop-title" className="text-lg font-bold text-[#1A1612]">Tung Voucher Live</h2><p className="mt-1 text-xs leading-relaxed text-[#7D715E]">Chọn ưu đãi của phiên và số lượt muốn giới thiệu.</p></div>
        <button type="button" aria-label="Đóng chọn voucher" disabled={sending} onClick={onClose} className="rounded-lg p-1.5 text-[#7D715E] hover:bg-[#F3EFE6]"><X size={19} /></button>
      </div>
      <div className="space-y-4 p-5">
        {loading ? <p className="flex items-center justify-center gap-2 py-8 text-sm text-[#7D715E]"><Loader2 className="animate-spin" size={18} /> Đang tải voucher…</p> : <>
          <p className="text-xs font-semibold text-[#7D715E]">VOUCHER CÓ THỂ TUNG ({coupon ? 1 : 0})</p>
          {coupon ? <button type="button" aria-pressed={selected} disabled={!active || sending} onClick={() => setSelected(value => !value)} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition disabled:opacity-60 ${selected ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7] bg-white hover:border-[#C59B58]'}`}>
            <Ticket className="mt-1 shrink-0 text-[#B88E4F]" size={24} />
            <span className="flex-1"><strong className="block text-base text-[#1A1612]">Giảm {coupon.discountType === 'PERCENTAGE' ? `${Number(coupon.discountValue)}%` : money(coupon.discountValue)}</strong>
              <span className="mt-1 block font-mono text-xs font-semibold text-[#B88E4F]">{coupon.displayCode}</span>
              <span className="mt-2 block text-xs leading-relaxed text-[#7D715E]">Đơn từ {money(coupon.minimumOrderAmount || 0)}{coupon.maximumDiscountAmount ? ` · Tối đa ${money(coupon.maximumDiscountAmount)}` : ''}</span>
              <span className="mt-1 block text-xs text-[#7D715E]">{!active ? 'Voucher chưa mở hoặc phiên đã kết thúc' : remaining === null ? 'Không giới hạn tổng lượt' : `Còn ${remaining.toLocaleString('vi-VN')} lượt sử dụng`}</span>
            </span>
            <CheckCircle2 size={20} className={`shrink-0 ${selected ? 'text-[#B88E4F]' : 'text-[#EAE4D7]'}`} />
          </button> : <p className="rounded-xl bg-[#FAF8F5] p-4 text-sm text-[#7D715E]">Phiên chưa có voucher. Shop cần cấu hình voucher cho phiên Live.</p>}
          <div><label htmlFor="voucher-drop-quantity" className="mb-2 block text-sm font-semibold text-[#1A1612]">Số lượt muốn tung</label>
            <div className="mb-2 flex gap-2">{[10, 20, 50, 100].map(value => <button key={value} type="button" disabled={sending || !active || (remaining !== null && value > remaining)} onClick={() => setQuantity(String(value))} className={`flex-1 rounded-xl border py-2 text-xs font-semibold disabled:opacity-30 ${count === value ? 'border-[#C59B58] bg-[#FBF5EB] text-[#B88E4F]' : 'border-[#EAE4D7] text-[#7D715E]'}`}>{value}</button>)}</div>
            <input id="voucher-drop-quantity" type="number" min={1} max={Math.min(remaining ?? 10000, 10000)} step={1} value={quantity} disabled={sending || !active} onChange={event => setQuantity(event.target.value)} className="h-11 w-full rounded-xl border border-[#EAE4D7] px-3 text-sm outline-none focus:border-[#C59B58]" />
            {quantity && (!Number.isInteger(count) || count < 1 || count > (remaining ?? 10000) || count > 10000) && <p className="mt-1 text-xs text-[#DC2626]">Nhập số nguyên từ 1 đến {Math.min(remaining ?? 10000, 10000)}.</p>}
          </div>
          <p className="rounded-xl bg-[#FAF8F5] p-3 text-xs leading-relaxed text-[#7D715E]">Thông báo ưu đãi sẽ xuất hiện cho người xem trong phòng Live. Số lượt này nằm trong giới hạn voucher đã được Shop cấp, không cộng thêm lượt hoặc ngân sách.</p>
        </>}
        {error && <div role="alert" className="text-sm text-[#DC2626]">{error}{!session && !loading && <button type="button" onClick={() => setRetry(value => value + 1)} className="ml-2 underline">Thử lại</button>}</div>}
      </div>
      <div className="flex gap-3 border-t border-[#EAE4D7] bg-[#FAF8F5] p-5">
        <button type="button" disabled={sending} onClick={onClose} className="h-11 rounded-xl border border-[#EAE4D7] bg-white px-5 text-sm font-semibold text-[#7D715E]">Hủy</button>
        <button type="button" disabled={!valid || sending || loading} onClick={() => void submit()} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#C59B58] px-4 text-sm font-semibold text-[#1A1612] hover:bg-[#B88E4F] disabled:cursor-not-allowed disabled:opacity-40">{sending ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}{sending ? 'Đang tung…' : `Tung ${valid ? count : ''} lượt voucher`}</button>
      </div>
    </section>
  </div>;
}
