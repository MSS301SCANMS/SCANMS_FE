import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Eye, Gift, Radio, RotateCcw, Play, User } from 'lucide-react';
import api from '@/services/api';
import { formatMoney, getSafeProductImageUrl } from '@/utils/marketplace.utils';

interface LiveProduct { id: string; title: string; imageUrl?: string; price?: number | string }
interface LiveSession {
  id: string;
  title: string;
  status: string;
  endsAt: string;
  platform: string;
  liveUrl?: string;
  coverImageUrl?: string;
  viewerCount: number | null;
  pinnedProduct?: LiveProduct | null;
  creator?: { fullName?: string; avatarUrl?: string };
  store?: { name?: string };
  coupon?: { displayCode: string; status: string };
}

function StreamerAvatar({ name, url }: { name: string; url?: string }) {
  const [failed, setFailed] = useState(false);
  return <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">{url && !failed ? <img src={url} alt={name} onError={() => setFailed(true)} className="h-full w-full object-cover" /> : <User size={20} aria-label={name} />}</span>;
}

export function LiveNowSection({ onOpenHub }: { onOpenHub: () => void }) {
  const [now, setNow] = useState(Date.now);
  const { data = [], isLoading, isError, refetch, isFetching } = useQuery<LiveSession[]>({
    queryKey: ['marketplace-live-sessions'],
    queryFn: async () => {
      const response = await api.get('/livestreams');
      const payload = response?.data?.data ?? response?.data ?? response;
      return Array.isArray(payload) ? payload : [];
    },
    refetchInterval: 15_000, staleTime: 10_000,
  });
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const sessions = data.filter((session) => session.status === 'LIVE' && Date.parse(session.endsAt) > now);

  return (
    <section id="live" aria-labelledby="live-now-title" className="scroll-mt-36 bg-[#FAF8F5] py-5 text-left sm:py-7">
      <div className="mx-auto max-w-[1200px] px-3 sm:px-4 lg:px-6">
        <div className="rounded-3xl border border-[#EAE4D7] bg-white px-4 py-6 sm:px-6 sm:py-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1 basis-full sm:basis-auto">
            <p className="mb-1 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#7D715E]">{sessions.length > 0 && <span className="h-2 w-2 rounded-full bg-[#DC2626] motion-safe:animate-pulse" />}SCANMS LIVE COMMERCE</p>
            <h2 id="live-now-title" className="m-0 text-xl font-black tracking-tight sm:text-2xl">Phiên Live KOC đang diễn ra</h2>
          </div>
          <button type="button" onClick={onOpenHub} className="ml-auto inline-flex shrink-0 items-center gap-1 py-2 text-xs font-bold text-[#7D715E] hover:text-[#B88E4F]">Lịch Live<ArrowRight size={15} /></button>
        </div>
        {isLoading ? (
          <div aria-label="Đang tải phiên Live" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-[#F3EFE6]" />)}</div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col gap-5 rounded-2xl border border-[#EEDFC6] bg-white p-5 shadow-[0_4px_20px_rgba(75,57,34,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
            <div className="flex min-w-0 items-start gap-3.5 sm:items-center sm:gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] sm:h-14 sm:w-14" aria-hidden="true"><Radio size={26} strokeWidth={1.6} /></span>
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold leading-6 text-[#1A1612] sm:text-base">{isError ? 'Chưa tải được các phiên Live' : 'Chưa có phiên Live đang diễn ra'}</p>
                <p className="mb-0 mt-1 text-xs leading-5 text-[#7D715E] sm:text-[13px]">{isError ? 'Bạn có thể thử tải lại trong giây lát.' : 'Khám phá lịch phát sóng và gặp gỡ KOC trong phiên tiếp theo.'}</p>
              </div>
            </div>
            <button type="button" disabled={isError && isFetching} onClick={isError ? () => void refetch() : onOpenHub} className="group inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-4 py-3 text-xs font-semibold text-[#231D15] transition-colors hover:border-[#C59B58] hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C59B58] disabled:cursor-wait disabled:opacity-60 sm:w-auto">
              {isError ? <RotateCcw size={16} className="text-[#B88E4F]" aria-hidden="true" /> : <CalendarDays size={16} className="text-[#B88E4F]" aria-hidden="true" />}
              {isError ? 'Thử lại' : 'Xem lịch phát sóng'}
              {!isError && <ArrowRight size={15} className="text-[#B88E4F]" aria-hidden="true" />}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.slice(0, 6).map((session) => {
              const external = session.platform !== 'SCANMS';
              const safeExternal = session.liveUrl && /^https?:\/\//i.test(session.liveUrl) ? session.liveUrl : null;
              const href = external && safeExternal ? safeExternal : `/live/${session.id}`;
              const name = session.creator?.fullName || 'Nhà sáng tạo SCANMS';
              return (
                <article key={session.id} className="group overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white transition hover:border-[#C59B58] hover:shadow-lg hover:shadow-[#231D15]/5">
                  <Link to={href} target={external && safeExternal ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} aria-label={`Xem Live: ${session.title}`} className="block focus-visible:outline-[#C59B58]">
                    <div className="relative aspect-video overflow-hidden bg-[#F3EFE6]">
                      <img src={getSafeProductImageUrl(session.coverImageUrl || session.creator?.avatarUrl, session.title)} alt={`Phiên Live của ${name}`} loading="lazy" className="h-full w-full object-cover transition duration-500 motion-safe:group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#231D15]/50 to-transparent" />
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-[#DC2626] px-2 py-1 text-[10px] font-black text-white"><span className="h-1.5 w-1.5 rounded-full bg-white motion-safe:animate-pulse" />LIVE</span>
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-[#231D15]/80 px-2 py-1 text-[10px] text-white"><Eye size={13} />{session.viewerCount === null ? 'Live ngoài sàn' : `${Number(session.viewerCount ?? 0).toLocaleString('vi-VN')} đang xem`}</span>
                      <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#B88E4F]"><Play size={16} className="ml-0.5 fill-current" /></span>
                    </div>
                    <div className="p-4">
                      <div className="mb-3 flex items-center gap-2.5"><StreamerAvatar name={name} url={session.creator?.avatarUrl} /><div className="min-w-0"><p className="m-0 truncate text-xs font-bold">{name}</p><p className="mb-0 mt-1 truncate text-[10px] text-[#7D715E]">{session.store?.name}</p></div></div>
                      <h3 className="m-0 line-clamp-2 min-h-10 text-sm font-bold leading-5">{session.title}</h3>
                      <div className="mt-3 flex min-h-14 items-center gap-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-2">
                        {session.pinnedProduct ? <><img src={getSafeProductImageUrl(session.pinnedProduct.imageUrl, session.pinnedProduct.title)} alt="" className="h-10 w-10 rounded-lg bg-white object-contain" /><div className="min-w-0"><span className="block text-[9px] font-bold uppercase text-[#7D715E]">Deal đang ghim</span><span className="block truncate text-[11px] font-semibold">{session.pinnedProduct.title}</span><span className="text-[10px] font-bold text-[#B88E4F]">{formatMoney(Number(session.pinnedProduct.price ?? 0))}</span></div></> : <><Gift size={18} className="shrink-0 text-[#B88E4F]" /><span className="text-[11px] text-[#7D715E]">{session.coupon?.status === 'ACTIVE' ? `Voucher trong phiên: ${session.coupon.displayCode}` : 'Vào phiên để xem sản phẩm được giới thiệu'}</span></>}
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
