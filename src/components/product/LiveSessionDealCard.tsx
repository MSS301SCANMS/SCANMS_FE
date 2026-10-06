import { useEffect, useMemo, useState } from 'react';
import { Clock3, Copy, Radio, TicketCheck } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../utils/toast';

type LiveSession = {
  id: string;
  title: string;
  platform: string;
  liveUrl: string;
  startsAt: string;
  endsAt: string;
  status: string;
  store: { name: string };
  creator: { fullName: string };
  coupon: {
    displayCode: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number | string;
    usageLimitTotal: number | null;
    usageCount: number;
  };
  remainingUses: number | null;
};

function getClaimKey(sessionId: string) {
  const storageKey = `scanms-live-claim:${sessionId}`;
  let key = localStorage.getItem(storageKey);
  if (!key) {
    key = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(storageKey, key);
  }
  return key;
}

export function LiveSessionDealCard({
  productId,
  onApplyCoupon,
}: {
  productId: string;
  onApplyCoupon: (code: string) => Promise<boolean>;
}) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response: any = await api.get(`/live-sessions/products/${productId}/active`);
        const result = response?.data || response;
        if (!mounted) return;
        setSession(result?.session || null);
        const serverTime = result?.serverTime ? new Date(result.serverTime).getTime() : Date.now();
        setServerOffset(serverTime - Date.now());
      } catch {
        if (mounted) setSession(null);
      }
    };
    void load();
    const refresh = window.setInterval(load, 30000);
    return () => {
      mounted = false;
      window.clearInterval(refresh);
    };
  }, [productId]);

  const targetAt = useMemo(() => {
    if (!session) return 0;
    const now = Date.now() + serverOffset;
    const startAt = new Date(session.startsAt).getTime();
    return now < startAt ? startAt : new Date(session.endsAt).getTime();
  }, [session, serverOffset]);

  useEffect(() => {
    if (!session) return;
    const tick = () => setRemainingMs(Math.max(0, targetAt - (Date.now() + serverOffset)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [session, targetAt, serverOffset]);

  if (!session || Date.now() + serverOffset >= new Date(session.endsAt).getTime()) return null;
  const now = Date.now() + serverOffset;
  const isLive = now >= new Date(session.startsAt).getTime() && now < new Date(session.endsAt).getTime();
  const remainingParts = [
    Math.floor(remainingMs / 3600000).toString().padStart(2, '0'),
    Math.floor((remainingMs % 3600000) / 60000).toString().padStart(2, '0'),
    Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, '0'),
  ];
  const discountText = session.coupon.discountType === 'PERCENTAGE'
    ? `Giảm ${Number(session.coupon.discountValue)}%`
    : `Giảm ${Number(session.coupon.discountValue).toLocaleString('vi-VN')} ₫`;

  const claim = async () => {
    try {
      setLoading(true);
      const response: any = await api.post(`/live-sessions/${session.id}/claim`, { claimKey: getClaimKey(session.id) });
      const result = response?.data || response;
      const applied = await onApplyCoupon(result?.couponCode || session.coupon.displayCode);
      if (applied) toast.success('Đã nhận và áp dụng voucher livestream.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Chưa thể nhận voucher lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(session.liveUrl);
      toast.success('Đã sao chép link xem livestream.');
    } catch {
      window.open(session.liveUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="my-3 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-4 text-[#1A1612] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-full bg-[#C59B58] p-2 text-white"><Radio className="h-4 w-4" /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-extrabold">
              <span>Deal Phiên Live</span>
              <span className="rounded-full border border-[#EEDFC6] bg-white px-2 py-0.5 text-[10px] font-bold text-[#8C6226]">{session.platform}</span>
            </div>
            <p className="truncate text-xs text-[#7D715E]">{session.title} · {session.store.name} × {session.creator.fullName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 font-mono text-sm font-black text-[#8C6226]" aria-live="polite">
          <Clock3 className="h-4 w-4" />
          {remainingParts.join(':')}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEDFC6] pt-3">
        <div>
          <p className="text-sm font-black text-[#B88E4F]">{discountText} · Mã {session.coupon.displayCode}</p>
          <p className="text-xs text-[#7D715E]">
            {isLive ? 'Đang mở trong phiên live' : 'Sắp mở · voucher chỉ dùng được khi phiên bắt đầu'}
            {session.remainingUses !== null && ` · Còn ${session.remainingUses} lượt`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <button type="button" onClick={claim} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C59B58] px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#B88E4F] disabled:opacity-60">
              <TicketCheck className="h-4 w-4" /> {loading ? 'Đang nhận...' : 'Nhận & áp dụng'}
            </button>
          )}
          <button type="button" onClick={copyLink} className="inline-flex items-center gap-1 rounded-lg border border-[#EEDFC6] bg-white px-3 py-2 text-xs font-bold text-[#7D715E] hover:text-[#8C6226]">
            <Copy className="h-3.5 w-3.5" /> Xem live
          </button>
        </div>
      </div>
    </section>
  );
}
