import { LiveGovernancePanel, type LiveGovernance } from '../../components/live/LiveGovernancePanel';
import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Radio, RefreshCw, Search, TrendingUp, Award, PlayCircle, Loader2, Filter } from 'lucide-react';
import api from '../../services/api';
import { Select } from '../../components/ui/Select';

type AdminLiveSession = {
  governance?: LiveGovernance;
  id: string;
  title: string;
  platform: string;
  liveUrl: string;
  status: string;
  startsAt: string;
  creator: { id: string; fullName: string };
  store: { name: string };
  report: {
    currentViewers: number | null;
    totalViewers: number | null;
    orders: number;
    buyers?: number;
    pendingOrders: number;
    grossSales: number;
    commission: number;
  };
};

const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const shortLiveCode = (value: string) => (/^https?:\/\/[^/]+\/live\/[A-Za-z0-9_-]{12}$/.test(value) ? value.slice(-12) : null);
const statusNames: Record<string, string> = {
  PENDING_CREATOR: 'Chờ KOL',
  SCHEDULED: 'Đã lên lịch',
  LIVE: 'Đang live',
  PAUSED: 'Tạm dừng',
  ENDED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
};
const statusTone = (status: string) => status === 'LIVE'
  ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]'
  : status === 'CANCELLED' || status === 'ENDED'
    ? 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'
    : 'border-[#EEDFC6] bg-white text-[#8F682E]';

export default function AdminLiveSessionsPage() {
  const [sessions, setSessions] = useState<AdminLiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [disputeFilter, setDisputeFilter] = useState('ALL');

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response: any = await api.get('/live-sessions/admin', { headers: { 'x-skip-cache': 'true' } });
      const result = response?.data || response;
      setSessions(Array.isArray(result) ? result : []);
      setError('');
    } catch (cause: any) {
      setError(cause?.response?.data?.message || cause?.message || 'Không tải được dữ liệu phiên live.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const totalSessions = sessions.length;
  const liveCount = sessions.filter((s) => s.status === 'LIVE').length;
  const totalGross = sessions.reduce((acc, s) => acc + (s.report?.grossSales || 0), 0);
  const totalCommission = sessions.reduce((acc, s) => acc + (s.report?.commission || 0), 0);

  const filteredSessions = sessions.filter((session) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      session.title.toLowerCase().includes(term) ||
      session.store.name.toLowerCase().includes(term) ||
      session.creator.fullName.toLowerCase().includes(term) ||
      session.platform.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'ALL' || session.status === statusFilter;
    const matchesPlatform = platformFilter === 'ALL' || session.platform.toUpperCase() === platformFilter;
    const disputeStatus = session.governance?.dispute?.status;
    const matchesDispute = disputeFilter === 'ALL' || (disputeFilter === 'PENDING' ? ['OPEN', 'ESCALATED', 'APPEALED'].includes(disputeStatus || '') : Boolean(disputeStatus));
    return matchesSearch && matchesStatus && matchesPlatform && matchesDispute;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] px-0 py-4 text-[#1A1612] sm:py-5">
      <div className="mx-0 w-full max-w-none space-y-4">
        {/* KPI Stats Cards - Matching AdminReferralLinksPage styling */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <Radio className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#7D715E]">Tổng phiên livestream</p>
              <h3 className="text-lg font-bold text-[#1A1612]">{totalSessions.toLocaleString()}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <PlayCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#7D715E]">Đang phát sóng</p>
              <h3 className="flex items-center gap-2 text-lg font-bold text-[#8F682E]">
                {liveCount}
                {liveCount > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C59B58] opacity-40"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C59B58]"></span>
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#7D715E]">Doanh số đã chốt</p>
              <h3 className="truncate text-lg font-bold text-[#1A1612]">{money(totalGross)}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#7D715E]">Hoa hồng KOL</p>
              <h3 className="truncate text-lg font-bold text-[#1A1612]">{money(totalCommission)}</h3>
            </div>
          </div>
        </div>

        {/* Filter and Action Toolbar - Exactly matching AdminReferralLinksPage */}
        <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-[#EAE4D7] bg-white p-3 shadow-sm md:flex-row md:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load(true);
            }}
            className="flex w-full gap-2 md:max-w-md"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D715E]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã phiên, tên live, KOL, shop..."
                className="h-10 w-full rounded-xl border border-[#EAE4D7] py-2 pl-9 pr-3 text-xs text-[#1A1612] placeholder:text-[#A89D8B] focus:border-[#C59B58] focus:outline-none focus:ring-2 focus:ring-[#C59B58]/15 sm:text-sm"
              />
            </div>
            <Select value={disputeFilter} onChange={e => setDisputeFilter(e.target.value)} className="w-44 text-xs sm:text-sm">
              <option value="ALL">Phiên & tranh chấp</option>
              <option value="PENDING">Tranh chấp chờ xử lý</option>
              <option value="DISPUTED">Tất cả tranh chấp</option>
            </Select>
            <button
              type="submit"
              className="shrink-0 cursor-pointer rounded-xl bg-[#C59B58] px-4 py-2 text-xs font-semibold text-[#1A1612] transition hover:bg-[#B88E4F]"
            >
              Tìm
            </button>
          </form>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
            <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
              <Filter className="w-4 h-4 text-[#7D715E]" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36 text-xs sm:w-40 sm:text-sm"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="LIVE">Đang live (LIVE)</option>
                <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
                <option value="PAUSED">Tạm dừng (PAUSED)</option>
                <option value="ENDED">Đã kết thúc (ENDED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </Select>
            </div>

            <Select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-36 text-xs sm:w-40 sm:text-sm"
            >
              <option value="ALL">Tất cả nền tảng</option>
              <option value="SCANMS">SCANMS Live</option>
              <option value="TIKTOK">TikTok Live</option>
              <option value="FACEBOOK">Facebook Live</option>
              <option value="YOUTUBE">YouTube Live</option>
            </Select>

            <button
              type="button"
              onClick={() => void load(true)}
              disabled={loading}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs font-medium text-[#7D715E] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] hover:text-[#1A1612] disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 text-[#B88E4F] ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-[#EEDFC6] bg-white p-3 text-sm text-[#7D715E]">
            {error}
          </p>
        )}

        {loading && !sessions.length ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#EAE4D7] bg-white p-8 text-center text-sm text-[#7D715E]">
            <Loader2 className="h-6 w-6 animate-spin text-[#B88E4F]" />
            <span>Đang tải danh sách phiên livestream…</span>
          </div>
        ) : null}

        {!loading && !filteredSessions.length && !error ? (
          <p className="rounded-2xl border border-[#EAE4D7] bg-white p-8 text-center text-sm text-[#7D715E]">
            {searchTerm || statusFilter !== 'ALL' || platformFilter !== 'ALL'
              ? 'Không tìm thấy phiên live nào phù hợp với bộ lọc.'
              : 'Chưa có phiên livestream nào trên hệ thống.'}
          </p>
        ) : null}

        <div className="grid gap-3">
          {filteredSessions.map((session) => (
            <article key={session.id} className="rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-sm transition-colors hover:border-[#C59B58]">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FBF5EB] text-[#B88E4F]"><Radio className="h-4 w-4" /></span>
                    <h3 className="text-sm font-bold text-[#1A1612]">{session.title}</h3>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(session.status)}`}>
                      {statusNames[session.status] || session.status}
                    </span>
                    <span className="rounded-full border border-[#EAE4D7] bg-[#FAF8F5] px-2 py-1 text-[10px] font-medium text-[#7D715E]">{session.platform}</span>
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#7D715E]">
                    <span>{session.store.name}</span><span aria-hidden="true">·</span>
                    <span>KOL <strong className="font-semibold text-[#1A1612]">{session.creator.fullName}</strong></span><span aria-hidden="true">·</span>
                    <span>Mã {session.creator.id.replace(/-/g, '').slice(0, 8).toUpperCase()}</span>
                    {shortLiveCode(session.liveUrl) && <><span aria-hidden="true">·</span><span>Phiên {shortLiveCode(session.liveUrl)}</span></>}
                    <span aria-hidden="true">·</span><span>{new Date(session.startsAt).toLocaleString('vi-VN')}</span>
                  </p>
                </div>
                <a
                  href={session.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2 text-xs font-semibold text-[#1A1612] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] sm:self-auto"
                >
                  <ExternalLink className="h-4 w-4 text-[#B88E4F]" /> Mở link live
                </a>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#EAE4D7] pt-3 text-xs sm:grid-cols-3 lg:grid-cols-7">
                {[
                  ['Đang xem', session.platform === 'SCANMS' ? String(session.report.currentViewers ?? 0) : '—'],
                  ['Tổng lượt xem', session.platform === 'SCANMS' ? String(session.report.totalViewers ?? 0) : '—'],
                  ['Tổng đơn', String(session.report.orders)],
                  ['Người mua', String(session.report.buyers ?? 0)],
                  ['Đơn chờ', String(session.report.pendingOrders)],
                  ['Doanh số đã chốt', money(session.report.grossSales)],
                  ['Hoa hồng KOL đã chốt', money(session.report.commission)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2.5">
                    <p className="truncate text-[11px] text-[#7D715E]">{label}</p>
                    <p className="mt-0.5 truncate text-sm font-bold text-[#1A1612]">{value}</p>
                  </div>
                ))}
              </div>
              <LiveGovernancePanel session={session} audience="admin" onChanged={() => void load()} />
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
