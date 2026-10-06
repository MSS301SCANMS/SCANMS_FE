import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Radio,
  X,
  Calendar,
  BadgeCheck,
  ShoppingBag,
  Loader2,
  Bell,
  BellCheck,
  Eye,
  Ticket,
  Share2,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import { getSafeProductImageUrl } from '../../features/marketplace/marketplaceUtils';
import { toast } from '../../utils/toast';
import { liveBroadcastService } from '../../services/liveBroadcast';

interface LiveCommerceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabFilter = 'ALL' | 'LIVE' | 'UPCOMING';

export function LiveCommerceHubModal({ isOpen, onClose }: LiveCommerceHubModalProps) {
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [remindedSessions, setRemindedSessions] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Tự động kiểm tra thời gian thực mỗi 5 giây: khi phiên live chạm mốc endsAt thì lập tức biến mất
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchPublicSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/live-sessions/public/list');
      const rawData = res?.data?.data ?? res?.data ?? res ?? [];
      const apiSessions = Array.isArray(rawData) ? rawData : [];

      // Kiểm tra thêm các phiên live phát sóng thực tế từ shop trong liveBroadcastService (nếu còn hiệu lực)
      const broadcasts = liveBroadcastService.getAllBroadcasts();
      const now = Date.now();
      const validBroadcastSessions = broadcasts
        .filter((b) => {
          if (!b.endsAt) return false;
          return new Date(b.endsAt).getTime() > now;
        })
        .filter((b) => !apiSessions.some((s: any) => s.id === b.sessionId))
        .map((b) => ({
          id: b.sessionId,
          title: b.title,
          status: 'LIVE',
          platform: 'SCANMS',
          liveUrl: b.liveUrl,
          startsAt: b.createdAt,
          endsAt: b.endsAt,
          viewerCount: 0,
          creator: { fullName: b.creatorName },
          store: { name: b.storeName },
          coupon: b.discountText ? { displayCode: b.discountText, discountType: 'CUSTOM', discountValue: 0 } : undefined,
          products: [],
        }));

      setSessions([...apiSessions, ...validBroadcastSessions]);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void fetchPublicSessions();

    // Lắng nghe khi Chủ Shop phát sóng phiên live mới để cập nhật real-time
    const handleNewBroadcast = () => {
      void fetchPublicSessions();
    };
    window.addEventListener('scanms-new-live-broadcast', handleNewBroadcast);
    return () => {
      window.removeEventListener('scanms-new-live-broadcast', handleNewBroadcast);
    };
  }, [isOpen, fetchPublicSessions]);

  // Lọc chỉ giữ lại các phiên ĐANG hoặc SẮP diễn ra (loại bỏ hoàn toàn phiên đã kết thúc / hết giờ)
  const activeSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (s.status === 'ENDED' || s.status === 'CANCELLED') return false;
      if (s.endsAt) {
        const endTime = new Date(s.endsAt).getTime();
        if (Number.isFinite(endTime) && endTime <= currentTime) {
          return false;
        }
      }
      return true;
    });
  }, [sessions, currentTime]);

  // Filter sessions by tab
  const filteredSessions = useMemo(() => {
    if (activeTab === 'LIVE') {
      return activeSessions.filter((s) => s.status === 'LIVE');
    }
    if (activeTab === 'UPCOMING') {
      return activeSessions.filter((s) => s.status === 'SCHEDULED' || s.status === 'PENDING_CREATOR');
    }
    return activeSessions;
  }, [activeSessions, activeTab]);

  const liveCount = useMemo(() => activeSessions.filter((s) => s.status === 'LIVE').length, [activeSessions]);
  const upcomingCount = useMemo(() => activeSessions.filter((s) => s.status !== 'LIVE').length, [activeSessions]);

  if (!isOpen) return null;

  const formatSessionTime = (startsAt: string) => {
    try {
      const d = new Date(startsAt);
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return isToday ? `${timeStr} Hôm nay` : `${timeStr} · ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
    } catch {
      return 'Sắp lên sóng';
    }
  };

  const handleOpenLive = (session: any) => {
    onClose();
    if (session.platform === 'SCANMS' || !session.liveUrl || session.liveUrl.includes('/live/')) {
      navigate(`/live/${session.id}`);
    } else {
      window.open(session.liveUrl, '_blank', 'noreferrer');
    }
  };

  const toggleReminder = (sessionId: string, title: string) => {
    setRemindedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
        toast.success(`Đã bỏ ghi nhớ phiên "${title.slice(0, 30)}..."`);
      } else {
        next.add(sessionId);
        toast.success('Đã ghi nhớ phiên live trong lần truy cập này.');
      }
      return next;
    });
  };

  const handleShare = (session: any) => {
    const url = `${window.location.origin}/live/${session.id}`;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      toast.success('Đã sao chép liên kết phiên live!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5">
      <div className="absolute inset-0 bg-[#231D15]/35 backdrop-blur-[3px]" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="scanms-live-title"
        className="relative z-10 flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[22px] border border-[#EEDFC6] bg-[#FAF8F5] text-[#1A1612] shadow-[0_24px_80px_rgba(35,29,21,0.18)]"
      >
        <header className="shrink-0 border-b border-[#EAE4D7] bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                <Radio className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="scanms-live-title" className="m-0 text-lg font-bold tracking-tight text-[#1A1612] sm:text-xl">SCANMS Live</h2>
                  <span className="rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2 py-0.5 text-[10px] font-semibold text-[#B88E4F]">Mua sắm trực tiếp</span>
                </div>
                <p className="m-0 mt-1 text-xs text-[#7D715E]">Khám phá sản phẩm cùng nhà sáng tạo và các gian hàng.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Đóng danh sách phiên live" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] transition hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-[#C59B58]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <nav aria-label="Lọc phiên live" className="flex shrink-0 gap-1 overflow-x-auto border-b border-[#EAE4D7] bg-white px-4 py-2.5 sm:px-6">
          {([
            ['ALL', 'Khám phá', activeSessions.length],
            ['LIVE', 'Đang phát', liveCount],
            ['UPCOMING', 'Sắp diễn ra', upcomingCount],
          ] as const).map(([tab, label, count]) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); listRef.current?.scrollTo({ top: 0 }); }}
              aria-current={activeTab === tab ? 'page' : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab
                  ? 'bg-[#FBF5EB] text-[#B88E4F] ring-1 ring-inset ring-[#EEDFC6]'
                  : 'text-[#7D715E] hover:bg-[#F3EFE6] hover:text-[#1A1612]'
              }`}
            >
              {label} <span className="ml-1 opacity-70">{count}</span>
            </button>
          ))}
        </nav>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-[#7D715E]">
              <Loader2 className="h-7 w-7 animate-spin text-[#B88E4F]" />
              Đang tải danh sách livestream...
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#EAE4D7] bg-white px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#C59B58] shadow-xs">
                <Radio className="h-7 w-7" />
              </div>
              <h3 className="mb-1.5 mt-4 text-base font-bold text-[#1A1612]">
                {activeTab === 'LIVE' ? 'Hiện không có phiên livestream nào đang phát' : 'Chưa có phiên livestream nào'}
              </h3>
              <p className="m-0 max-w-md text-xs sm:text-sm text-[#7D715E] leading-relaxed">
                Các phiên live đã kết thúc theo đúng thời gian hiệu lực do Chủ Shop thiết lập. Khi Chủ Shop bắt đầu phát sóng phiên mới, thông báo sẽ được gửi trực tiếp tới biểu tượng chuông và hiển thị tại đây.
              </p>
              {activeTab !== 'ALL' && (
                <button type="button" onClick={() => setActiveTab('ALL')} className="mt-5 rounded-full bg-[#C59B58] px-5 py-2 text-xs font-bold text-[#231D15] hover:bg-[#B88E4F] transition shadow-xs">
                  Xem tất cả mục
                </button>
              )}
            </div>
          ) : (
            <div className={filteredSessions.length === 1 ? 'mx-auto grid max-w-sm gap-4' : filteredSessions.length === 2 ? 'grid items-stretch gap-4 sm:grid-cols-2' : 'grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
              {filteredSessions.map((session) => {
                const isLive = session.status === 'LIVE';
                const creatorName = session.creator?.fullName || 'Nhà sáng tạo SCANMS';
                const storeName = session.store?.name || 'Gian hàng đối tác';
                const viewers = Number(session.viewerCount) || 0;
                const isReminded = remindedSessions.has(session.id);
                const firstProduct = session.products?.[0]?.product;
                const productImage = firstProduct ? getSafeProductImageUrl(firstProduct.imageUrl) : '';
                const basePrice = Number(firstProduct?.price);
                const livePrice = Number(firstProduct?.livePrice);
                const couponText = session.coupon
                  ? session.coupon.discountType === 'PERCENTAGE'
                    ? `Giảm ${Number(session.coupon.discountValue)}%`
                    : `Giảm ${Number(session.coupon.discountValue).toLocaleString('vi-VN')} ₫`
                  : null;

                return (
                  <article
                    key={session.id}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white shadow-[0_2px_10px_rgba(35,29,21,0.03)] transition hover:border-[#C59B58] hover:shadow-[0_6px_20px_rgba(35,29,21,0.06)]"
                  >
                    {/* Header trạng thái nhỏ gọn, các badge căn đều chuẩn kích thước và tuyệt đối không rớt dòng */}
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[#EAE4D7]/70 bg-[#FAF8F5]">
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {isLive ? (
                          <span className="inline-flex h-7 min-w-[96px] items-center justify-center gap-1.5 rounded-full bg-[#DC2626] px-3 text-[11px] font-black uppercase tracking-wider text-white shadow-xs whitespace-nowrap shrink-0">
                            <span className="h-2 w-2 rounded-full bg-white animate-pulse shrink-0" />
                            <span className="whitespace-nowrap">Trực tiếp</span>
                          </span>
                        ) : (
                          <span className="inline-flex h-7 min-w-[96px] items-center justify-center gap-1.5 rounded-full bg-[#F3EFE6] border border-[#EAE4D7] px-3 text-[11px] font-bold text-[#8C6226] whitespace-nowrap shrink-0">
                            <Calendar className="h-3.5 w-3.5 text-[#B88E4F] shrink-0" />
                            <span className="whitespace-nowrap">{formatSessionTime(session.startsAt)}</span>
                          </span>
                        )}
                        {isLive && (
                          <span className="inline-flex h-7 min-w-[66px] items-center justify-center gap-1 rounded-full bg-white border border-[#EAE4D7] px-2.5 text-[11px] font-bold text-[#7D715E] shadow-2xs whitespace-nowrap shrink-0">
                            <Eye className="h-3.5 w-3.5 text-[#B88E4F] shrink-0" />
                            <span className="whitespace-nowrap">{viewers.toLocaleString('vi-VN')}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0 justify-end flex-1 pl-1">
                        <span className="text-[11px] font-semibold text-[#8C6226] truncate max-w-[120px] text-right" title={storeName}>
                          {storeName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleShare(session)}
                          aria-label={`Chia sẻ phiên ${session.title}`}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border border-[#EAE4D7] text-[#7D715E] hover:text-[#B88E4F] hover:bg-[#F3EFE6] transition cursor-pointer shadow-2xs"
                          title="Chia sẻ phiên livestream"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#F3EFE6] ring-1 ring-[#EEDFC6]">
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-[#9A7135]">{creatorName.charAt(0)}</span>
                          {session.creator?.avatarUrl ? (
                            <img src={session.creator.avatarUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} className="relative h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="truncate text-xs font-bold text-[#1A1612] sm:text-sm">{creatorName}</span>
                            {session.creator?.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#B88E4F]" />}
                          </div>
                          <p className="m-0 truncate text-[11px] text-[#7D715E]">{storeName}</p>
                        </div>
                      </div>

                      <h3 className="m-0 min-h-[40px] line-clamp-2 text-[13px] font-bold leading-5 text-[#1A1612]">
                        {session.title}
                      </h3>
                      {couponText && (
                        <div className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[11px] font-bold text-[#9A7135]">
                          <Ticket className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{couponText}{session.coupon?.displayCode ? ` · ${session.coupon.displayCode}` : ''}</span>
                        </div>
                      )}
                      {firstProduct && (
                        <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-2.5">
                          {productImage ? (
                            <img src={productImage} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-white object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F3EFE6]"><ShoppingBag className="h-5 w-5 text-[#B88E4F]" /></div>
                          )}
                          <div className="min-w-0">
                            <p className="m-0 truncate text-xs font-semibold">{firstProduct.title}</p>
                            {Number.isFinite(livePrice) && livePrice > 0 && (
                              <p className="mb-0 mt-1 text-sm font-extrabold text-[#B88E4F]">
                                {livePrice.toLocaleString('vi-VN')} ₫
                                {Number.isFinite(basePrice) && basePrice > livePrice && (
                                  <span className="ml-2 text-[11px] font-normal text-[#7D715E] line-through">{basePrice.toLocaleString('vi-VN')} ₫</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => isLive ? handleOpenLive(session) : toggleReminder(session.id, session.title)}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88E4F] ${
                          isLive
                            ? 'bg-[#C59B58] text-[#231D15] hover:bg-[#B88E4F]'
                            : isReminded
                              ? 'border border-[#C59B58] bg-[#FBF5EB] text-[#9A7135]'
                              : 'border border-[#EAE4D7] bg-white text-[#231D15] hover:bg-[#F3EFE6]'
                        }`}
                      >
                        {isLive ? <><Radio className="h-4 w-4" /> Xem trực tiếp <ChevronRight className="h-4 w-4" /></> :
                          isReminded ? <><BellCheck className="h-4 w-4" /> Đã ghi nhớ</> :
                          <><Bell className="h-4 w-4" /> Ghi nhớ lịch live</>}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EAE4D7] bg-white px-4 py-2.5 sm:px-6">
          <p className="m-0 text-xs text-[#7D715E]"><strong className="text-[#231D15]">Bạn là Shop hoặc KOC?</strong><span className="hidden sm:inline"> Kết nối người mua qua phiên live của bạn.</span></p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onClose(); navigate('/merchant/promotions?tab=live-sessions'); }}
              className="rounded-full border border-[#EAE4D7] px-3.5 py-2 text-xs font-bold text-[#231D15] transition hover:bg-[#F3EFE6]"
            >
              Dành cho Shop
            </button>
            <Link to="/register" onClick={onClose} className="rounded-full bg-[#C59B58] px-3.5 py-2 text-xs font-bold text-[#231D15] transition hover:bg-[#B88E4F]">
              Trở thành KOC
            </Link>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default LiveCommerceHubModal;
