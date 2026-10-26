import { LiveGovernancePanel, type LiveGovernance } from '../../components/live/LiveGovernancePanel';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { livestreamLifecycle, livestreamStatusLabel } from '../../utils/livestream-lifecycle.utils';
import { serverDate } from '../../utils/server-date';
import {
  CalendarClock,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Ticket,
  Store,
  ShoppingBag,
  Clock,
  TrendingUp,
  Coins,
  Radio,
  CheckCircle2,
  XCircle,
  Sparkles,
  Tag,
  Users,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';
import { liveSessionService } from '../../services/live-session.service';
import { toast } from '../../utils/toast';
import { getSafeProductImageUrl } from '@/utils/marketplace.utils';

type Session = {
  lifecycleReason?: string;
  governance?: LiveGovernance;
  id: string;
  title: string;
  description?: string | null;
  platform: string;
  liveUrl: string;
  externalChannels?: Array<{ channelUrl: string; followerCount: number }>;
  startsAt: string;
  endsAt: string;
  status: string;
  inviteStatus: string;
  serverTime?: string;
  commissionRate: number | string;
  store: { name: string; logoUrl?: string | null; slug: string };
  coupon: {
    displayCode: string;
    discountType: string;
    discountValue: number | string;
    usageLimitTotal: number | null;
    usageCount: number;
  };
  report?: {
    claims: number;
    orders: number;
    buyers?: number;
    pendingOrders?: number;
    cancelledOrders?: number;
    grossSales: number;
    voucherDiscount: number;
    commission: number;
  };
  products: Array<{ product: { id: string; title: string; imageUrl?: string | null } }>;
};

type FilterKey = 'ALL' | 'UPCOMING' | 'LIVE' | 'PENDING' | 'ENDED';

const formatSessionTime = (startsAt: string, endsAt: string) => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  const startTime = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const startDate = start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (sameDay) {
    return `${startTime} – ${endTime} · ${startDate}`;
  }
  const endDate = end.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${startTime} ${startDate} – ${endTime} ${endDate}`;
};

export default function CollaboratorLiveSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterKey>('ALL');

  const load = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const result = await liveSessionService.mine();
      const list = (Array.isArray(result) ? result : []).map((raw: any): Session => {
        const participants = raw?.participantRefs || {};
        const productIds = raw?.productRefs?.productIds || [];
        return {
          id: raw.id || raw.livestreamId,
          title: raw.title || 'Phiên live',
          description: raw.description,
          platform: participants.platform || 'SCANMS',
          liveUrl: (participants.platform || 'SCANMS') === 'SCANMS'
            ? `/live/${encodeURIComponent(raw.livestreamId || raw.id)}` : raw.playbackRef || participants.liveUrl || '',
          externalChannels: participants.externalChannels || [],
          startsAt: serverDate(raw.scheduledAt || raw.startsAt || raw.createdAt) || '',
          endsAt: serverDate(participants.endsAt || raw.endedAt || raw.scheduledAt || raw.createdAt) || '',
          ...livestreamLifecycle(raw),
          inviteStatus: participants.inviteStatus || 'PENDING',
          commissionRate: participants.commissionRate ?? 0,
          store: raw.store || { name: 'Shop', slug: '', logoUrl: null },
          coupon: raw.coupon || {
            displayCode: participants.voucherCode || '—',
            discountType: participants.discountType || 'PERCENTAGE',
            discountValue: participants.discountValue ?? 0,
            usageLimitTotal: participants.usageLimitTotal ?? null,
            usageCount: 0,
          },
          products: (productIds as string[]).map((pid) => ({
            product: { id: pid, title: pid, imageUrl: null },
          })),
          report: raw.report,
          governance: raw.governance,
        };
      });
      setSessions(list);
      setLoadError(null);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Không tải được phiên livestream.';
      setLoadError(message);
      if (showLoading) toast.error(message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(false);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const respond = async (session: Session, accepted: boolean) => {
    try {
      setPendingAction(session.id);
      await api.patch(`/livestreams/${session.id}/respond`, { accepted });
      toast.success(
        accepted
          ? 'Bạn đã nhận lời tham gia phiên live thành công!'
          : 'Bạn đã từ chối lời mời phiên live.',
      );
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không gửi được phản hồi.');
    } finally {
      setPendingAction(null);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Đã sao chép mã voucher vào bộ nhớ tạm.');
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      toast.error('Trình duyệt không cho phép sao chép mã.');
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (statusFilter === 'LIVE') {
        return s.status === 'LIVE';
      }
      if (statusFilter === 'UPCOMING') {
        return (
          (s.status === 'SCHEDULED' || s.inviteStatus === 'ACCEPTED') &&
          s.status !== 'ENDED' &&
          s.status !== 'CANCELLED' &&
          s.status !== 'LIVE'
        );
      }
      if (statusFilter === 'PENDING') {
        return s.inviteStatus === 'PENDING' && s.status !== 'ENDED' && s.status !== 'CANCELLED';
      }
      if (statusFilter === 'ENDED') {
        return s.status === 'ENDED' || s.status === 'CANCELLED';
      }
      return true;
    });
  }, [sessions, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: sessions.length,
      upcoming: sessions.filter(
        (s) =>
          (s.status === 'SCHEDULED' || s.inviteStatus === 'ACCEPTED') &&
          s.status !== 'ENDED' &&
          s.status !== 'CANCELLED' &&
          s.status !== 'LIVE',
      ).length,
      live: sessions.filter((s) => s.status === 'LIVE').length,
      pending: sessions.filter(
        (s) => s.inviteStatus === 'PENDING' && s.status !== 'ENDED' && s.status !== 'CANCELLED',
      ).length,
      ended: sessions.filter((s) => s.status === 'ENDED' || s.status === 'CANCELLED').length,
    };
  }, [sessions]);

  const renderTab = (key: FilterKey, label: string, count: number) => {
    const isActive = statusFilter === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setStatusFilter(key)}
        aria-pressed={isActive}
        className={`inline-flex items-center justify-center gap-2 min-w-0 min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
          isActive
            ? 'bg-[#FBF5EB] border border-[#C59B58] text-[#1A1612]'
            : 'bg-white text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612] border border-[#EAE4D7]'
        }`}
      >
        {key === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 animate-pulse" aria-hidden="true" />}
        <span>{label}</span>
        <span
          className={`min-w-[20px] px-1.5 py-0.5 rounded text-[10px] tabular-nums leading-none ${
            isActive ? 'bg-[#FBF5EB] text-[#B88E4F]' : 'bg-[#F3EFE6] text-[#7D715E]'
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full min-w-0 pb-12 text-[#1A1612] text-left">
      <section
        className={`grid grid-cols-2 items-stretch gap-2 p-2.5 rounded-2xl border border-[#EAE4D7] bg-white shadow-xs ${counts.live > 0 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}
        aria-label="Quản lý livestream và voucher"
      >
        <nav className="contents" aria-label="Lọc phiên livestream">
          {renderTab('ALL', 'Tất cả', counts.all)}
          {counts.live > 0 && renderTab('LIVE', 'Đang live', counts.live)}
          {renderTab('UPCOMING', 'Sắp diễn ra', counts.upcoming)}
          {renderTab('PENDING', 'Chờ phản hồi', counts.pending)}
          {renderTab('ENDED', 'Đã kết thúc', counts.ended)}
        </nav>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#1A1612] text-xs font-semibold hover:bg-[#F3EFE6] hover:border-[#C59B58] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Làm mới danh sách phiên"
          aria-label="Làm mới danh sách phiên"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#B88E4F] ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Làm mới</span>
        </button>
      </section>

      {loadError && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" aria-hidden="true" />
          <span className="flex-1 min-w-0">{loadError}</span>
          <button
            type="button"
            className="inline-flex items-center justify-center min-h-[30px] px-2.5 py-1 rounded-md border border-red-200 bg-white text-red-700 text-xs font-medium hover:bg-red-50"
            disabled={loading}
            onClick={() => void load()}
          >
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center gap-2 py-12 px-5 rounded-xl border border-[#EAE4D7] bg-white text-center" role="status">
          <span className="grid place-items-center w-10 h-10 rounded-lg bg-[#FBF5EB] text-[#B88E4F]">
            <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-[#1A1612] m-0">Đang tải phiên livestream</h2>
          <p className="text-xs text-[#7D715E] m-0">Đang cập nhật lịch phát và số liệu của bạn.</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        !loadError && (
          <div className="grid place-items-center gap-2 py-12 px-5 rounded-xl border border-[#EAE4D7] bg-white text-center">
            <span className="grid place-items-center w-10 h-10 rounded-lg bg-[#FBF5EB] text-[#B88E4F]">
              <Radio className="w-5 h-5" aria-hidden="true" />
            </span>
            <h2 className="text-sm font-semibold text-[#1A1612] m-0">
              {sessions.length === 0 ? 'Chưa có phiên livestream' : 'Chưa có phiên trong mục này'}
            </h2>
            <p className="text-xs text-[#7D715E] max-w-sm m-0">
              {sessions.length === 0
                ? 'Lời mời từ gian hàng và voucher của từng phiên sẽ xuất hiện tại đây.'
                : 'Chọn Tất cả để xem lại các phiên livestream của bạn.'}
            </p>
            {sessions.length > 0 && (
              <button
                type="button"
                className="mt-2 inline-flex items-center justify-center min-h-[32px] px-3 py-1.5 rounded-lg border border-[#EAE4D7] bg-white text-xs font-medium text-[#1A1612] hover:bg-[#FBF5EB] hover:border-[#C59B58] transition-colors"
                onClick={() => setStatusFilter('ALL')}
              >
                Xem tất cả phiên
              </button>
            )}
          </div>
        )
      ) : (
        <div className="grid gap-3" aria-label="Danh sách phiên livestream">
          {filteredSessions.map((session) => {
            const pending = session.inviteStatus === 'PENDING' && session.status !== 'ENDED' && session.status !== 'CANCELLED';
            const accepted = session.inviteStatus === 'ACCEPTED';
            const isLive = session.status === 'LIVE';
            const isEnded = session.status === 'ENDED' || session.status === 'CANCELLED';
            const isCopied = copiedCode === session.coupon.displayCode;
            const discount =
              session.coupon.discountType === 'PERCENTAGE'
                ? `${session.coupon.discountValue}%`
                : `${Number(session.coupon.discountValue).toLocaleString('vi-VN')} ₫`;
            const report = session.report;

            return (
              <article
                key={session.id}
                className="p-3.5 sm:p-4 rounded-xl border border-[#EAE4D7] bg-white shadow-xs"
                aria-label={`Phiên ${session.title}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="grid place-items-center shrink-0 w-9 h-9 overflow-hidden rounded-lg border border-[#EAE4D7] bg-[#FBF5EB] text-[#B88E4F] text-xs font-semibold" aria-hidden="true">
                      {session.store.logoUrl ? (
                        <img src={session.store.logoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        session.store.name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm sm:text-base font-semibold leading-snug tracking-tight text-[#1A1612] m-0 break-words">
                          {session.title}
                        </h2>
                        {isLive && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium text-red-600 bg-red-50">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            Đang live
                          </span>
                        )}
                        {pending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FBF5EB] text-[#B88E4F]">
                            <Clock className="w-2.5 h-2.5" />
                            Chờ phản hồi
                          </span>
                        )}
                        {accepted && !isLive && !isEnded && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FAF8F5] text-[#7D715E]">
                            <CheckCircle2 className="w-2.5 h-2.5 text-[#059669]" />
                            Đã xác nhận
                          </span>
                        )}
                        {isEnded && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FAF8F5] text-[#7D715E]">
                            {livestreamStatusLabel(session.status, session.lifecycleReason)}
                          </span>
                        )}
                        {session.inviteStatus === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FAF8F5] text-[#7D715E]">
                            <XCircle className="w-2.5 h-2.5 text-red-500" />
                            Đã từ chối
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-[#7D715E]">
                        <span className="inline-flex items-center gap-1 text-[#1A1612] font-medium">
                          <Store className="w-3 h-3 text-[#B88E4F]" aria-hidden="true" />
                          {session.store.name}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="w-3 h-3 text-[#B88E4F]" aria-hidden="true" />
                          {formatSessionTime(session.startsAt, session.endsAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Radio className="w-3 h-3 text-[#B88E4F]" aria-hidden="true" />
                          {session.platform === 'SCANMS' ? 'SCANMS Live' : session.platform}
                        </span>
                      </div>
                    </div>
                  </div>
                  {session.liveUrl && (
                    <a
                      href={session.liveUrl}
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-3 py-1.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[#1A1612] text-xs font-medium hover:bg-[#F3EFE6] hover:border-[#C59B58] transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#B88E4F]" aria-hidden="true" />
                      {session.platform === 'SCANMS' ? 'Vào phòng SCANMS' : 'Mở link live'}
                    </a>
                  )}
                </div>

                {!!session.externalChannels?.length && (
                  <div className="grid gap-1.5 mt-3 p-2.5 rounded-lg bg-[#FAF8F5] text-[11px]">
                    <p className="m-0 font-medium text-[#1A1612]">
                      Kênh ngoài sàn <span className="font-normal text-[#7D715E]">· Số người theo dõi do Shop cung cấp</span>
                    </p>
                    {session.externalChannels.map((channel, index) => (
                      <a
                        key={`${channel.channelUrl}-${index}`}
                        href={channel.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex flex-wrap items-center gap-1.5 text-[#B88E4F] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span className="break-all">{channel.channelUrl}</span>
                        <strong className="text-[#1A1612] font-semibold">
                          {Number(channel.followerCount).toLocaleString('vi-VN')} người theo dõi
                        </strong>
                      </a>
                    ))}
                  </div>
                )}

                <div className={`grid ${session.products?.length ? 'grid-cols-1 md:grid-cols-[minmax(0,1.65fr)_minmax(230px,1fr)]' : 'grid-cols-1'} gap-2.5 items-stretch mt-3`}>
                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(120px,0.8fr)_minmax(0,1.4fr)_auto] items-center gap-3 p-2.5 sm:p-3 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Ticket className="w-5 h-5 shrink-0 text-[#B88E4F]" aria-hidden="true" />
                      <div>
                        <small className="block text-[10px] text-[#7D715E] leading-tight">Ưu đãi phiên live</small>
                        <strong className="block text-sm sm:text-base font-bold text-[#1A1612] leading-snug">Giảm {discount}</strong>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <small className="block text-[10px] text-[#7D715E] leading-tight">Mã voucher</small>
                      <div className="flex items-stretch min-w-0 mt-1 border border-[#EAE4D7] rounded-md overflow-hidden bg-white shadow-2xs">
                        <code className="flex-1 min-w-0 px-2 py-1 text-xs font-mono font-semibold text-[#1A1612] tracking-wider truncate select-all">
                          {session.coupon.displayCode}
                        </code>
                        <button
                          type="button"
                          disabled={!accepted}
                          onClick={() => void copyCode(session.coupon.displayCode)}
                          title={accepted ? 'Sao chép mã voucher' : 'Chấp nhận lời mời để sao chép voucher'}
                          aria-label={`Sao chép mã voucher ${session.coupon.displayCode}`}
                          className="inline-flex items-center gap-1 shrink-0 px-2.5 py-1 border-l border-[#EAE4D7] bg-white text-[#7D715E] text-[10px] font-medium hover:bg-[#FAF8F5] hover:text-[#1A1612] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-[#059669]" aria-hidden="true" />
                          ) : (
                            <Copy className="w-3 h-3 text-[#B88E4F]" aria-hidden="true" />
                          )}
                          <span>{isCopied ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="sm:pl-3 sm:border-l sm:border-[#EEDFC6]">
                      <small className="flex items-center gap-1 text-[10px] text-[#7D715E] leading-tight">
                        <Sparkles className="w-2.5 h-2.5 text-[#B88E4F]" aria-hidden="true" />
                        Hoa hồng
                      </small>
                      <strong className="block text-sm sm:text-base font-bold text-[#1A1612] leading-snug">
                        {Number(session.commissionRate)}%
                      </strong>
                    </div>
                  </div>

                  {!!session.products?.length && (
                    <div className="flex flex-wrap items-center min-w-0 gap-2 p-2.5 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] text-[#7D715E] text-[10px]">
                      <span className="w-full text-[10px] text-[#7D715E]">Áp dụng cho:</span>
                      {session.products.slice(0, 2).map((item, index) => (
                        <span
                          key={item.product.id || index}
                          title={item.product.title}
                          className="inline-flex items-center gap-1.5 min-w-0 max-w-full text-[#1A1612] text-xs font-medium"
                        >
                          <img
                            src={getSafeProductImageUrl(item.product.imageUrl)}
                            alt=""
                            loading="lazy"
                            className="w-5 h-5 rounded object-cover border border-[#EAE4D7] bg-white shrink-0"
                          />
                          <span className="max-w-[200px] truncate">{item.product.title}</span>
                        </span>
                      ))}
                      {session.products.length > 2 && (
                        <span className="whitespace-nowrap text-[#7D715E] font-medium">+{session.products.length - 2} sản phẩm khác</span>
                      )}
                    </div>
                  )}
                </div>

                {report && (
                  <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3 pt-3 border-t border-[#EAE4D7]">
                    <div className="min-w-0 p-2 rounded-lg bg-[#FAF8F5]">
                      <dt className="flex items-center gap-1 text-[10px] text-[#7D715E]">
                        <Users className="w-3 h-3 text-[#B88E4F]" aria-hidden="true" />
                        Người mua
                      </dt>
                      <dd className="mt-1 text-base font-semibold tabular-nums text-[#1A1612]">
                        {Number(report.buyers ?? 0).toLocaleString('vi-VN')}
                      </dd>
                    </div>
                    <div className="min-w-0 p-2 rounded-lg bg-[#FAF8F5]">
                      <dt className="flex items-center gap-1 text-[10px] text-[#7D715E]">
                        <Ticket className="w-3 h-3 text-[#B88E4F]" aria-hidden="true" />
                        Lượt nhận mã
                      </dt>
                      <dd className="mt-1 text-base font-semibold tabular-nums text-[#1A1612]">
                        {Number(report.claims || 0).toLocaleString('vi-VN')}
                      </dd>
                    </div>
                    <div className="min-w-0 p-2 rounded-lg bg-[#FAF8F5]">
                      <dt className="flex items-center gap-1 text-[10px] text-[#7D715E]">
                        <ShoppingBag className="w-3 h-3 text-[#B88E4F]" aria-hidden="true" />
                        Đơn ghi nhận
                      </dt>
                      <dd className="flex items-baseline gap-1 mt-1 text-base font-semibold tabular-nums text-[#1A1612]">
                        {Number(report.orders || 0).toLocaleString('vi-VN')}
                        <small className="text-[10px] text-[#7D715E] font-normal">({report.pendingOrders || 0} chờ)</small>
                      </dd>
                      {(report.cancelledOrders || 0) > 0 && (
                        <span className="block mt-0.5 text-red-500 text-[10px]">{report.cancelledOrders} đã hủy</span>
                      )}
                    </div>
                    <div className="min-w-0 p-2 rounded-lg bg-[#FAF8F5]">
                      <dt className="flex items-center gap-1 text-[10px] text-[#7D715E]">
                        <TrendingUp className="w-3 h-3 text-[#B88E4F]" aria-hidden="true" />
                        Doanh số GMV
                      </dt>
                      <dd className="mt-1 text-base font-semibold tabular-nums text-[#1A1612]">
                        {Number(report.grossSales || 0).toLocaleString('vi-VN')} ₫
                      </dd>
                    </div>
                    <div className="min-w-0 p-2 rounded-lg bg-[#FAF8F5]">
                      <dt className="flex items-center gap-1 text-[10px] text-[#7D715E]">
                        <Tag className="w-3 h-3 text-[#B88E4F]" aria-hidden="true" />
                        Giảm voucher
                      </dt>
                      <dd className="mt-1 text-base font-semibold tabular-nums text-[#1A1612]">
                        {Number(report.voucherDiscount || 0).toLocaleString('vi-VN')} ₫
                      </dd>
                    </div>
                    <div className="min-w-0 p-2 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6]">
                      <dt className="flex items-center gap-1 text-[10px] text-[#7D715E]">
                        <Coins className="w-3 h-3 text-[#B88E4F]" aria-hidden="true" />
                        Hoa hồng của bạn
                      </dt>
                      <dd className="mt-1 text-base font-semibold tabular-nums text-[#B88E4F]">
                        +{Number(report.commission || 0).toLocaleString('vi-VN')} ₫
                      </dd>
                    </div>
                  </dl>
                )}

                {pending && (
                  <div className="flex flex-wrap items-center justify-between gap-2.5 mt-3 pt-3 border-t border-[#EAE4D7]">
                    <p className="flex items-center gap-1.5 text-xs text-[#7D715E] m-0">
                      <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" aria-hidden="true" />
                      Gian hàng mời bạn tham gia phiên live cùng voucher riêng.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={pendingAction === session.id}
                        onClick={() => void respond(session, false)}
                        className="inline-flex items-center justify-center min-h-[32px] px-3 py-1.5 rounded-lg border border-[#EAE4D7] bg-white text-xs font-medium text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612] disabled:opacity-50 transition-colors"
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        disabled={pendingAction === session.id}
                        onClick={() => void respond(session, true)}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-3 py-1.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-xs font-medium text-[#1A1612] hover:bg-[#F3EFE6] hover:border-[#C59B58] disabled:opacity-50 transition-colors"
                      >
                        {pendingAction === session.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#B88E4F]" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                        )}
                        <span>{pendingAction === session.id ? 'Đang gửi...' : 'Chấp nhận tham gia'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-[#EAE4D7]">
                  <LiveGovernancePanel session={session} audience="kol" onChanged={() => void load(false)} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
