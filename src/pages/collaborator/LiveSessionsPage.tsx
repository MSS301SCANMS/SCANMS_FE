import { LiveGovernancePanel, type LiveGovernance } from '../../components/live/LiveGovernancePanel';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../utils/toast';
import { getSafeProductImageUrl } from '../../features/marketplace/marketplaceUtils';

type Session = {
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
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterKey>('ALL');

  const load = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response: any = await api.get('/live-sessions/my', {
        headers: { 'x-skip-cache': 'true' },
      });
      const result = response?.data || response;
      setSessions(Array.isArray(result) ? result : []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || 'Không tải được phiên livestream.',
      );
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
      await api.patch(`/live-sessions/my/${session.id}/respond`, { accepted });
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

  const renderTab = (key: FilterKey, label: string, count: number, pulse?: boolean) => {
    const isActive = statusFilter === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setStatusFilter(key)}
        className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer select-none whitespace-nowrap flex items-center gap-1.5 sm:gap-2 ${
          isActive
            ? 'bg-[#FBF5EB] text-[#1A1612] border border-[#EEDFC6] shadow-2xs font-extrabold'
            : 'text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] border border-transparent'
        }`}
      >
        {pulse && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
          </span>
        )}
        <span>{label}</span>
        <span
          className={`ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
            isActive
              ? 'bg-[#EBD08C] text-[#1A1612] shadow-2xs'
              : 'bg-[#EAE4D7] text-[#7D715E]'
          }`}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-4 text-[#1A1612] pb-12 w-full">
      {/* Top Unified Hub Navigation Bar (Đồng bộ chuẩn sáng giống Trung tâm Tiếp thị) */}
      <div className="bg-white rounded-2xl border border-[#EAE4D7] p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 pl-1.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FFFDF9] to-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shrink-0 shadow-2xs">
            <Radio className="w-4 h-4 text-[#B88E4F]" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-[#1A1612]">Phiên Livestream & Voucher Độc Quyền</div>
            <div className="text-[11px] text-[#7D715E] hidden md:block">
              Theo dõi lịch live, nhận voucher độc quyền và số liệu đối soát hoa hồng phiên
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {renderTab('ALL', 'Tất cả', counts.all)}
            {counts.live > 0 && renderTab('LIVE', 'Đang live', counts.live, true)}
            {renderTab('UPCOMING', 'Sắp diễn ra', counts.upcoming)}
            {renderTab('PENDING', 'Chờ phản hồi', counts.pending)}
            {renderTab('ENDED', 'Đã kết thúc', counts.ended)}
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7D715E] hover:text-[#1A1612] transition cursor-pointer select-none py-1.5 px-3 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58] shadow-2xs shrink-0"
            title="Làm mới danh sách phiên"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#B88E4F] ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#EAE4D7] bg-white p-12 text-center text-sm text-[#7D715E] shadow-2xs flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-6 w-6 text-[#C59B58] animate-spin" />
          <span>Đang đồng bộ danh sách phiên livestream...</span>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#EEDFC6] bg-white p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center mx-auto text-[#B88E4F] shadow-2xs">
            <Ticket className="h-6 w-6 text-[#B88E4F] stroke-[1.5]" />
          </div>
          <h2 className="mt-3.5 text-base font-extrabold text-[#1A1612]">
            {sessions.length === 0
              ? 'Chưa có phiên livestream nào'
              : 'Không có phiên nào thuộc bộ lọc này'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#7D715E] max-w-md mx-auto">
            {sessions.length === 0
              ? 'Khi Shop gửi lời mời kết nối phiên live, thông tin kèm voucher sẽ xuất hiện tại đây.'
              : 'Hãy chọn tab "Tất cả" để xem lại toàn bộ các phiên livestream của bạn.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const pending = session.inviteStatus === 'PENDING' && session.status !== 'ENDED' && session.status !== 'CANCELLED';
            const accepted = session.inviteStatus === 'ACCEPTED';
            const isLive = session.status === 'LIVE';
            const isEnded = session.status === 'ENDED' || session.status === 'CANCELLED';
            const isCopied = copiedCode === session.coupon.displayCode;

            const discount =
              session.coupon.discountType === 'PERCENTAGE'
                ? `Giảm ${session.coupon.discountValue}%`
                : `Giảm ${Number(session.coupon.discountValue).toLocaleString('vi-VN')} ₫`;

            return (
              <article
                key={session.id}
                className="rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#C59B58]/40 transition-all duration-200 relative overflow-hidden group space-y-3 sm:space-y-3.5"
              >
                {/* Accent top border stripe */}
                <div
                  className={`absolute top-0 left-0 right-0 h-0.5 ${
                    isLive ? 'bg-rose-500' : pending ? 'bg-[#C59B58]' : 'bg-transparent group-hover:bg-[#C59B58]/40'
                  }`}
                />

                {/* Header: Shop & Session Info */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {/* Shop Avatar / Logo (Thiết kế sáng & viền mềm mại) */}
                    {session.store.logoUrl ? (
                      <img
                        src={session.store.logoUrl}
                        alt={session.store.name}
                        className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl border border-[#EAE4D7] object-cover shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#FBF5EB] border border-[#EEDFC6] font-black text-[#B88E4F] text-xs shrink-0 shadow-2xs">
                        {session.store.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      {/* Title & Status Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-extrabold text-[#1A1612] leading-tight">
                          {session.title}
                        </h2>

                        {/* Status Pills (Tông màu sáng, rõ nét) */}
                        {isLive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                            Đang live
                          </span>
                        )}

                        {pending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                            <Clock className="w-2.5 h-2.5 text-[#B88E4F]" />
                            Chờ bạn duyệt
                          </span>
                        )}

                        {accepted && !isLive && !isEnded && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Đã xác nhận
                          </span>
                        )}

                        {isEnded && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF8F5] text-[#7D715E] border border-[#EAE4D7]">
                            Đã kết thúc
                          </span>
                        )}

                        {session.inviteStatus === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF8F5] text-stone-500 border border-[#EAE4D7]">
                            <XCircle className="w-2.5 h-2.5 text-stone-400" />
                            Đã từ chối
                          </span>
                        )}
                      </div>

                      {/* Subtitle: Store | Platform | Schedule */}
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#7D715E]">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
                          <span className="text-[#1A1612] font-semibold">{session.store.name}</span>
                        </span>
                        <span className="text-[#EAE4D7]">|</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold ${
                          session.platform === 'SCANMS'
                            ? 'bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]'
                            : 'bg-white text-[#1A1612] border border-[#EAE4D7]'
                        }`}>
                          <Radio className={`w-3 h-3 ${session.platform === 'SCANMS' ? 'text-rose-500 animate-pulse' : 'text-[#B88E4F]'}`} />
                          {session.platform === 'SCANMS' ? '🔴 Sàn SCANMS Live' : session.platform}
                        </span>
                        <span className="text-[#EAE4D7]">|</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#7D715E]">
                          <CalendarClock className="w-3.5 h-3.5 text-[#B88E4F]" />
                          {formatSessionTime(session.startsAt, session.endsAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top-Right Action: Open Live Link (Thiết kế sáng & nổi bật) */}
                  {session.liveUrl && (
                    <a
                      href={session.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer select-none ${
                        session.platform === 'SCANMS'
                          ? 'border border-[#C59B58] bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white hover:from-[#B88E4F] hover:to-[#A47B3E]'
                          : 'border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] text-[#1A1612] hover:border-[#C59B58]'
                      }`}
                    >
                      <ExternalLink className={`h-3.5 w-3.5 ${session.platform === 'SCANMS' ? 'text-white' : 'text-[#B88E4F]'}`} />
                      <span>{session.platform === 'SCANMS' ? 'Vào phòng SCANMS' : 'Mở link live'}</span>
                    </a>
                  )}
                </div>

                {!!session.externalChannels?.length && (
                  <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs">
                    <p className="font-bold text-[#1A1612]">Kênh live ngoài sàn · số người theo dõi do Shop nhập</p>
                    <div className="mt-2 grid gap-1.5">
                      {session.externalChannels.map((channel, index) => <a key={`${channel.channelUrl}-${index}`} href={channel.channelUrl} target="_blank" rel="noreferrer" className="flex flex-wrap items-center gap-2 break-all text-[#B88E4F] hover:underline"><ExternalLink className="h-3.5 w-3.5 shrink-0" />{channel.channelUrl}<span className="font-bold text-[#1A1612]">· {Number(channel.followerCount).toLocaleString('vi-VN')} người theo dõi</span></a>)}
                    </div>
                  </div>
                )}

                {/* Exclusive Voucher Ribbon (Tông màu sáng, nền trắng kem nhạt tươi mới) */}
                <div className="rounded-xl border border-[#EAE4D7] bg-[#FFFDF9] hover:bg-[#FBF5EB]/40 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition shadow-2xs">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
                    {/* Golden Discount Badge */}
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white text-xs font-black shrink-0 shadow-2xs">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{discount}</span>
                    </div>

                    {/* Voucher Code Box (Nền trắng tinh, viền nhẹ) */}
                    <div className="inline-flex items-center gap-1.5 bg-white border border-[#EAE4D7] rounded-lg px-2.5 py-1 shrink-0 shadow-2xs">
                      <span className="text-[10px] font-bold text-[#7D715E] uppercase">Mã:</span>
                      <code className="font-mono text-xs font-black text-[#1A1612] tracking-wider select-all">
                        {session.coupon.displayCode}
                      </code>
                    </div>

                    {/* Commission Rate Badge (Tone be sáng tươi tắn) */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] shrink-0">
                      <Sparkles className="w-3 h-3 text-[#B88E4F]" />
                      Hoa hồng: {Number(session.commissionRate)}%
                    </span>

                    {/* Applied Product Chip */}
                    {session.products && session.products.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-[#7D715E] shrink-0">
                        <span>Áp dụng:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {session.products.slice(0, 2).map((item, pIdx) => {
                            const imgSrc = getSafeProductImageUrl(item.product.imageUrl);
                            return (
                              <div
                                key={item.product.id || pIdx}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white border border-[#EAE4D7] text-[11px] font-medium text-[#1A1612] shadow-2xs"
                                title={item.product.title}
                              >
                                {imgSrc && (
                                  <img src={imgSrc} alt="" className="w-4 h-4 rounded object-cover" />
                                )}
                                <span className="max-w-[130px] truncate">{item.product.title}</span>
                              </div>
                            );
                          })}
                          {session.products.length > 2 && (
                            <span className="text-[11px] text-[#7D715E] font-medium">
                              +{session.products.length - 2} khác
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Copy Voucher Button */}
                  <div className="shrink-0 flex items-center self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => void copyCode(session.coupon.displayCode)}
                      disabled={!accepted}
                      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer select-none active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-600 text-white border border-emerald-600'
                          : accepted
                          ? 'bg-white hover:bg-[#FAF8F5] text-[#B88E4F] hover:text-[#A47B3E] border border-[#EEDFC6] hover:border-[#DEBE85]'
                          : 'bg-white text-stone-400 border border-stone-200 cursor-not-allowed opacity-60'
                      }`}
                      title={
                        accepted
                          ? 'Sao chép mã voucher'
                          : 'Cần chấp nhận lời mời để sao chép voucher'
                      }
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-white" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#B88E4F]" />
                          <span>Sao chép voucher</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Performance Metrics Strip (Tone trắng sáng, viền tinh tế, nổi bật số liệu giống Trung tâm Tiếp thị) */}
                {session.report && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-2.5">
                    <div className="rounded-xl border border-[#EAE4D7] bg-white p-2.5 sm:p-3">
                      <div className="text-[11px] font-semibold text-[#7D715E]">Người mua</div>
                      <p className="mt-1 text-sm sm:text-base font-black text-[#1A1612]">{session.report.buyers ?? 0}</p>
                    </div>
                    {/* 1. Lượt nhận voucher */}
                    <div className="rounded-xl border border-[#EAE4D7] bg-white p-2.5 sm:p-3 hover:border-[#C59B58]/40 hover:shadow-xs transition">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7D715E]">
                        <Ticket className="w-3.5 h-3.5 text-[#B88E4F]" />
                        <span>Lượt nhận voucher</span>
                      </div>
                      <p className="mt-1 text-sm sm:text-base font-black text-[#1A1612]">
                        {session.report.claims || 0}
                      </p>
                    </div>

                    {/* 2. Đơn ghi nhận */}
                    <div className="rounded-xl border border-[#EAE4D7] bg-white p-2.5 sm:p-3 hover:border-[#C59B58]/40 hover:shadow-xs transition">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#7D715E]">
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#B88E4F]" />
                          <span>Đơn ghi nhận</span>
                        </div>
                        {(session.report.cancelledOrders || 0) > 0 && (
                          <span className="text-[10px] text-[#DC2626] font-bold">
                            -{session.report.cancelledOrders} hủy
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-[#1A1612]">
                          {session.report.orders || 0}
                        </span>
                        <span className="text-[11px] text-[#7D715E]">
                          ({session.report.pendingOrders || 0} chờ)
                        </span>
                      </div>
                    </div>

                    {/* 3. Doanh số GMV */}
                    <div className="rounded-xl border border-[#EAE4D7] bg-white p-2.5 sm:p-3 hover:border-[#C59B58]/40 hover:shadow-xs transition">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7D715E]">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Doanh số GMV</span>
                      </div>
                      <p className="mt-1 text-sm sm:text-base font-black text-[#1A1612] truncate">
                        {Number(session.report.grossSales || 0).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>

                    {/* 4. Giảm voucher */}
                    <div className="rounded-xl border border-[#EAE4D7] bg-white p-2.5 sm:p-3 hover:border-[#C59B58]/40 hover:shadow-xs transition">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7D715E]">
                        <Tag className="w-3.5 h-3.5 text-[#7D715E]" />
                        <span>Giảm voucher</span>
                      </div>
                      <p className="mt-1 text-sm sm:text-base font-black text-[#1A1612] truncate">
                        {Number(session.report.voucherDiscount || 0).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>

                    {/* 5. Hoa hồng của bạn (Highlight sang trọng tông be vàng sáng) */}
                    <div className="rounded-xl border border-[#EEDFC6] bg-gradient-to-br from-[#FFFDF9] to-[#FBF5EB] p-2.5 sm:p-3 hover:border-[#C59B58] hover:shadow-xs transition col-span-2 sm:col-span-1 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#B88E4F]">
                        <Coins className="w-3.5 h-3.5 text-[#B88E4F]" />
                        <span>Hoa hồng của bạn</span>
                      </div>
                      <p className="mt-1 text-sm sm:text-base font-black text-[#B88E4F] truncate">
                        +{Number(session.report.commission || 0).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  </div>
                )}

                {/* Pending Invitation Response Bar */}
                {pending && (
                  <div className="pt-2.5 border-t border-[#EAE4D7] flex flex-wrap items-center justify-between gap-2.5">
                    <p className="text-xs text-[#7D715E] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                      <span>
                        Shop đã gửi lời mời tham gia phiên live này kèm mã voucher ưu đãi riêng.
                      </span>
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={pendingAction === session.id}
                        onClick={() => void respond(session, false)}
                        className="px-3.5 py-1.5 rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#7D715E] hover:text-[#DC2626] transition shadow-2xs cursor-pointer select-none disabled:opacity-50"
                      >
                        Từ chối
                      </button>

                      <button
                        type="button"
                        disabled={pendingAction === session.id}
                        onClick={() => void respond(session, true)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A47B3E] text-xs font-bold text-white transition shadow-xs cursor-pointer select-none active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {pendingAction === session.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Đang gửi phản hồi...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Chấp nhận tham gia</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <LiveGovernancePanel session={session} audience="kol" onChanged={() => void load(false)} />
            </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
