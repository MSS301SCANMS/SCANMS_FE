import { useCallback, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Crown,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  RefreshCw,
  ChevronRight,
  Filter,
  X,
  Check,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import { leaderboardService } from '../../services/leaderboard.service';
import type {
  LeaderboardFullResponse,
  LeaderboardItem,
  LeaderboardMetric,
  LeaderboardScope,
  LeaderboardTimeRange,
  CreatorHallOfFameProfile,
} from '../../services/leaderboard.service';
import { toast } from '../../utils/toast';
import api from '../../services/api';
import { authService } from '../../services/auth.service';
import { WorkspaceHero, WorkspaceMetrics, workspaceButton, workspaceInput } from '@/components/ui/FeatureWorkspace';
import { downloadReport } from '@/utils/report-export';
import { normalizeSearch } from '@/utils/marketplace.utils';

export default function LeaderboardPage({ alignToContainer = false }: { alignToContainer?: boolean } = {}) {
  const [data, setData] = useState<LeaderboardFullResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState('');
  const requestSequence = useRef(0);

  // Filters
  const [metric, setMetric] = useState<LeaderboardMetric>('REVENUE');
  const [timeRange, setTimeRange] = useState<LeaderboardTimeRange>('this_month');
  const [scope, setScope] = useState<LeaderboardScope>('GLOBAL');
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'SYSTEM_MANAGER';
  const canChangeScope = isAdmin || currentUser?.role === 'SHOP_MANAGER';

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    setStoresLoading(true);
    api.get('/stores/marketplace', { headers: { 'x-skip-cache': 'true' } }).then((response: any) => {
      const body = response?.data?.data || response?.data || response;
      const list = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [];
      if (!active) return;
      setStores(list.filter((store: any) => store?.id && store?.name).map((store: any) => ({ id: store.id, name: store.name })));
      setSelectedStoreId((current) => current || list[0]?.id || '');
    }).catch((error: any) => {
      if (active) toast.error(error?.message || 'Không tải được danh sách gian hàng.');
    }).finally(() => { if (active) setStoresLoading(false); });
    return () => { active = false; };
  }, [isAdmin]);

  // Creator Modal
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorHallOfFameProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [profileError, setProfileError] = useState('');
  const [search, setSearch] = useState('');
  const profileRequest = useRef(0);
  const profileDialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selectedCreatorId) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; profileDialog.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { profileRequest.current += 1; setSelectedCreatorId(null); setCreatorProfile(null); }
      if (event.key !== 'Tab') return;
      const controls = profileDialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === profileDialog.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', keydown); previousFocus?.focus(); };
  }, [selectedCreatorId]);

  const fetchLeaderboard = useCallback(async () => {
    const requestId = ++requestSequence.current;
    if (scope === 'STORE' && isAdmin && !selectedStoreId) {
      setLoadError(stores.length ? 'Vui lòng chọn gian hàng để xem bảng xếp hạng.' : 'Chưa có gian hàng khả dụng để lọc.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError('');
      const res = await leaderboardService.getLeaderboard({
        metric,
        timeRange,
        scope,
        ...(scope === 'STORE' && isAdmin ? { storeId: selectedStoreId } : {}),
        limit: 10,
      });
      if (requestId !== requestSequence.current) return;
      setData(res);
    } catch (err: any) {
      if (requestId !== requestSequence.current) return;
      setLoadError(err?.message || 'Không tải được bảng xếp hạng.');
      toast.error(err?.message || 'Không tải được bảng xếp hạng.');
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [isAdmin, metric, scope, selectedStoreId, stores.length, timeRange]);

  useEffect(() => {
    void fetchLeaderboard();
    return () => { requestSequence.current += 1; };
  }, [fetchLeaderboard]);

  const handleOpenCreatorModal = async (creatorId: string) => {
    const request = ++profileRequest.current;
    try {
      setCreatorProfile(null); setProfileError('');
      setSelectedCreatorId(creatorId);
      setLoadingProfile(true);
      const profile = await leaderboardService.getCreatorProfile(creatorId);
      if (request !== profileRequest.current) return;
      setCreatorProfile(profile);
    } catch (err) {
      if (request === profileRequest.current) setProfileError(err instanceof Error ? err.message : 'Không tải được hồ sơ.');
    } finally {
      if (request === profileRequest.current) setLoadingProfile(false);
    }
  };

  const handleCloseModal = () => {
    profileRequest.current += 1;
    setSelectedCreatorId(null);
    setCreatorProfile(null);
  };

  const formatVND = (val?: number) => {
    if (val === undefined || val === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatNumber = (val?: number) => {
    if (val === undefined || val === null) return '0';
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  const metricLabels: Record<LeaderboardMetric, string> = {
    REVENUE: 'Doanh thu',
    ORDERS: 'Đơn hàng',
    CONVERSION_RATE: 'Tỷ lệ chốt',
    COMMISSION: 'Hoa hồng đã duyệt',
  };
  const formatMetricValue = (item?: LeaderboardItem | null) => {
    if (!item) return 'Chưa có dữ liệu';
    switch (metric) {
      case 'ORDERS': return `${formatNumber(item.totalOrders)} đơn`;
      case 'CONVERSION_RATE': return `${formatNumber(item.conversionRate)}%`;
      case 'COMMISSION': return formatVND(item.totalCommission);
      case 'REVENUE':
      default: return formatVND(item.grossRevenue);
    }
  };

  const podium = data?.podium;
  const rankings = data?.rankings || [];
  const displayedRankings = rankings.filter(item => normalizeSearch(`${item.fullName} ${item.primaryChannelHandle || ''} ${item.tierName}`).includes(normalizeSearch(search)));
  const allTop = [data?.podium.rank1, data?.podium.rank2, data?.podium.rank3, ...rankings].filter((item): item is LeaderboardItem => !!item);
  const exportRankings = () => downloadReport(`SCANMS_Top10_${timeRange}_${metric}.csv`, [
    ['Hạng', 'Creator', 'Cấp bậc', 'Click', 'Đơn hàng', 'CR (%)', 'Doanh số (VNĐ)', 'Hoa hồng (VNĐ)'],
    ...allTop.map(item => [item.rank, item.fullName, item.tierName, item.totalClicks, item.totalOrders, item.conversionRate, item.grossRevenue, item.totalCommission]),
  ]);
  const myRank = data?.myRankStatus;

  const timeOptions: { value: LeaderboardTimeRange; label: string }[] = [
    { value: 'this_month', label: 'Tháng này' },
    { value: 'last_month', label: 'Tháng trước' },
    { value: 'this_quarter', label: 'Quý này' },
    { value: 'all_time', label: 'Toàn thời gian' },
  ];
  const podiumEntries = [
    { slot: 2, creator: podium?.rank2 },
    { slot: 1, creator: podium?.rank1 },
    { slot: 3, creator: podium?.rank3 },
  ].filter((entry): entry is { slot: number; creator: LeaderboardItem } => Boolean(entry.creator));
  const scopeLabel = scope === 'GLOBAL' ? 'Toàn sàn' : isAdmin
    ? (stores.find(store => store.id === selectedStoreId)?.name || 'Gian hàng')
    : 'Gian hàng của bạn';

  return (
    <div className={`flex flex-col gap-3.5 w-full min-w-0 text-[#1A1612] ${alignToContainer ? 'p-0 pb-1 gap-3' : 'p-4 sm:p-5'}`}>
      <WorkspaceHero eyebrow="SCANMS / Creator hall of fame" title="Top 10 nhà sáng tạo" description="Vinh danh hiệu suất thực tế của các KOL trên sàn đa gian hàng. Cúp Vàng, Bạc, Đồng dành cho ba vị trí dẫn đầu; đổi tiêu chí để khám phá từng thế mạnh." actions={<button className={workspaceButton} disabled={loading || !!loadError || !allTop.length} onClick={exportRankings}>Xuất Top 10 CSV</button>} />
      {!loading && !loadError && data && <WorkspaceMetrics items={[
        { label: 'KOL đủ điều kiện', value: formatNumber(data.totalParticipants), detail: data.periodLabel },
        { label: 'Creator dẫn đầu', value: data.podium.rank1?.fullName || 'Chưa có', detail: formatMetricValue(data.podium.rank1) },
        { label: 'Doanh số Top 10', value: formatVND(allTop.reduce((sum, item) => sum + item.grossRevenue, 0)), detail: scopeLabel },
        { label: 'Đơn hàng Top 10', value: formatNumber(allTop.reduce((sum, item) => sum + item.totalOrders, 0)), detail: 'Theo kỳ và phạm vi đang chọn' },
      ]} />}
      <section className="p-3.5 sm:p-4 min-w-0 border border-[#EAE4D7] rounded-[15px] bg-white" aria-labelledby="lb-title">
        <header className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 sm:w-9 h-8 sm:h-9 grid place-items-center shrink-0 rounded-[10px] bg-[#FBF5EB] text-[#B88E4F]"><Trophy aria-hidden="true" className="w-[18px] h-[18px]" /></span>
            <div><h1 id="lb-title" className="m-0 text-base sm:text-lg font-semibold tracking-tight text-[#1A1612]">Bảng vinh danh Top Creator</h1><p className="m-0 mt-0.5 text-xs text-[#7D715E]">{data?.periodLabel || timeOptions.find(option => option.value === timeRange)?.label} · {scopeLabel}</p></div>
          </div>
          <button type="button" onClick={fetchLeaderboard} disabled={loading} className="inline-flex items-center justify-center gap-1.5 min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-[#7D715E] text-xs font-medium hover:bg-[#FBF5EB] disabled:opacity-60 disabled:cursor-wait transition-colors cursor-pointer" title="Làm mới bảng xếp hạng">
            <RefreshCw aria-hidden="true" className={`w-3.5 h-3.5 text-[#B88E4F] ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Đang cập nhật' : 'Làm mới'}</span>
          </button>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-3 sm:gap-4 mt-3">
          <div className="min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 border border-[#EAE4D7] rounded-[10px] bg-[#FAF8F5]" role="group" aria-label="Khoảng thời gian xếp hạng">
              {timeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={timeRange === option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={`flex items-center justify-center gap-1.5 min-h-[32px] sm:min-h-[34px] px-2 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                    timeRange === option.value
                      ? 'bg-white border border-[#EEDFC6] text-[#1A1612] font-semibold shadow-xs'
                      : 'border border-transparent text-[#7D715E] hover:bg-white hover:text-[#1A1612]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#7D715E] whitespace-nowrap" htmlFor="lb-metric-select"><Filter aria-hidden="true" className="w-3.5 h-3.5 text-[#B88E4F]" /> Xếp hạng theo</label>
            <div className="relative shrink-0">
              <select id="lb-metric-select" value={metric} onChange={event => setMetric(event.target.value as LeaderboardMetric)} className="w-full sm:w-[150px] min-h-[38px] appearance-none pl-3 pr-8 py-2 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-xs sm:text-[13px] font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#B88E4F]">
                {Object.entries(metricLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <ChevronDown aria-hidden="true" className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B88E4F] pointer-events-none" />
            </div>
          </div>
        </div>
        {canChangeScope && (
          <div className="flex items-center flex-wrap gap-2 mt-3 pt-3 border-t border-[#EAE4D7]">
            <button type="button" aria-pressed={scope === 'STORE'} onClick={() => setScope(scope === 'GLOBAL' ? 'STORE' : 'GLOBAL')} className="inline-flex items-center gap-1.5 min-h-[32px] px-2.5 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-[#7D715E] text-xs font-medium hover:bg-[#FBF5EB] cursor-pointer">
              <Shield aria-hidden="true" className="w-3.5 h-3.5 text-[#B88E4F]" /><span>{scope === 'GLOBAL' ? 'Toàn sàn SCANMS' : isAdmin ? 'Theo gian hàng' : 'Gian hàng của tôi'}</span>
            </button>
            {scope === 'STORE' && isAdmin && (
              <select aria-label="Chọn gian hàng để xếp hạng" value={selectedStoreId} onChange={event => setSelectedStoreId(event.target.value)} disabled={!stores.length} className="min-h-[34px] max-w-[240px] px-2.5 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-xs">
                {stores.length ? stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>) : <option value="">{storesLoading ? 'Đang tải gian hàng…' : 'Không có gian hàng'}</option>}
              </select>
            )}
          </div>
        )}
        {loading && <span className="sr-only" role="status" aria-live="polite">Đang cập nhật bảng xếp hạng…</span>}
        <details className="mt-3 text-xs text-[#7D715E] leading-relaxed group">
          <summary className="flex items-center gap-1 cursor-pointer font-medium hover:text-[#B88E4F] list-none select-none text-xs">Cách xếp hạng<ChevronDown aria-hidden="true" className="w-3.5 h-3.5 text-[#B88E4F] group-open:rotate-180 transition-transform" /></summary>
          <p className="mt-1">Chỉ xếp hạng khi tiêu chí đã chọn lớn hơn 0. Doanh số và đơn hàng ghi nhận theo ngày giao thành công, hoặc ngày hoàn tất nếu thiếu ngày giao (giờ Việt Nam). Cùng doanh số thì xét số đơn; các tiêu chí khác dùng doanh số làm tiêu chí phụ. Cùng cả hai tiêu chí sẽ đồng hạng.</p>
        </details>
      </section>

      {loadError && <div role="alert" className="p-3 sm:px-4 border border-[#EEDFC6] rounded-xl bg-white text-xs sm:text-sm text-[#DC2626]">{loadError}</div>}

      {loading ? <div className="p-8 text-center text-xs sm:text-sm text-[#7D715E] border border-[#EAE4D7] rounded-[15px] bg-white" role="status">Đang tải bảng vinh danh…</div>
        : loadError ? null : !podiumEntries.length ? <div className="p-8 text-center text-xs sm:text-sm text-[#7D715E] border border-[#EAE4D7] rounded-[15px] bg-white space-y-2"><Trophy aria-hidden="true" className="w-7 h-7 mx-auto text-[#B88E4F]" /><h2 className="text-base font-semibold text-[#1A1612]">Chưa có Creator đủ điều kiện vinh danh</h2><p className="max-w-md mx-auto">Kỳ này chưa có kết quả theo tiêu chí {metricLabels[metric].toLowerCase()}. Chọn khoảng thời gian khác để xem thành tích.</p>{timeRange === 'this_month' && <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-xs font-semibold text-[#1A1612] hover:bg-[#F3EFE6]" onClick={() => setTimeRange('last_month')}>Xem tháng trước<ArrowUpRight aria-hidden="true" className="w-3.5 h-3.5 text-[#B88E4F]" /></button>}</div>
        : <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch" aria-label="Các nhà sáng tạo dẫn đầu">
        {podiumEntries.map(({ slot, creator }) => {
          const rank = creator.rank;
          return <article key={creator.collaboratorId} data-podium-rank={slot} data-current={creator?.isCurrentUser || undefined}
            className={`flex flex-col min-h-[220px] p-4 sm:p-4.5 border rounded-xl bg-white shadow-2xs ${rank === 1 ? 'border-[#EEDFC6] bg-[#FDFBF7] md:order-2' : slot === 2 ? 'border-[#EAE4D7] md:order-1' : 'border-[#EAE4D7] md:order-3'}`}
          >
            <button className="flex items-center gap-3 w-full text-left bg-transparent border-0 p-0 cursor-pointer min-h-[64px] disabled:cursor-default" type="button" disabled={!creator}
              aria-label={creator ? `Xem hồ sơ ${creator.fullName}` : 'Hồ sơ chưa có dữ liệu'}
              onClick={() => creator && handleOpenCreatorModal(creator.collaboratorId)}
            >
              <span className={`relative grid place-items-center w-11 sm:w-12 h-11 sm:h-12 overflow-hidden shrink-0 border rounded-full bg-[#FAF8F5] text-[#B88E4F] text-lg font-semibold ${rank === 1 ? 'border-[#EEDFC6]' : 'border-[#EAE4D7]'}`} aria-hidden="true">
                {creator?.fullName?.charAt(0) || rank}
                {creator?.avatarUrl && <img src={creator.avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={event => { event.currentTarget.style.display = 'none'; }} />}
              </span>
              <span className="flex flex-1 flex-col gap-1 min-w-0">
                <span className="text-sm sm:text-[15px] font-semibold text-[#1A1612] hover:text-[#B88E4F] transition-colors truncate">{creator?.fullName || (loading && !data ? 'Đang tải KOL…' : rank === 1 ? 'Chưa có Quán Quân' : 'Chưa có đối tác')}</span>
                <span className="text-xs text-[#7D715E] leading-tight">{creator.tierName}</span>
                <span className="flex items-center flex-wrap gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 border rounded text-[11px] font-medium leading-none ${rank === 1 ? 'border-[#EEDFC6] text-[#B88E4F] bg-white' : 'border-[#EAE4D7] text-[#7D715E] bg-white'}`}><Crown aria-hidden="true" className={`w-3.5 h-3.5 text-[#B88E4F] ${rank === 1 ? '' : 'hidden'}`} /> Hạng {rank}</span>
                  {creator?.isCurrentUser && <span className="inline-flex items-center px-1.5 py-0.5 border border-[#EEDFC6] rounded bg-[#FBF5EB] text-[#B88E4F] text-[10px] font-semibold">Bạn</span>}
                </span>
              </span>
            </button>
            <div className="flex flex-col gap-1.5 mt-auto pt-3.5 border-t border-[#EAE4D7]">
              <span className="text-xs text-[#7D715E]">{metric === 'REVENUE' ? 'Doanh số GMV' : metricLabels[metric]}</span>
              <div className="flex items-baseline justify-between flex-wrap gap-1.5">
                <strong className="text-xl sm:text-2xl font-bold tabular-nums text-[#1A1612]">{formatMetricValue(creator)}</strong>
                {rank === 1 && <span className="text-[11px] text-[#7D715E]">{formatNumber(creator?.totalOrders)} đơn đã giao</span>}
              </div>
            </div>
            <details className="mt-2.5 pt-2 border-t border-[#EAE4D7] text-xs text-[#7D715E] group">
              <summary className="flex items-center justify-between gap-2 cursor-pointer list-none select-none hover:text-[#B88E4F]"><span>Chi tiết thành tích</span><ChevronDown aria-hidden="true" className="w-3.5 h-3.5 text-[#B88E4F] group-open:rotate-180 transition-transform" /></summary>
              <div className="flex flex-col gap-2 pt-2">
                {creator.primaryChannelHandle && <span className="text-xs text-[#7D715E] truncate" title={creator.primaryChannelHandle}>{creator.primaryChannelHandle}</span>}
                <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-[#7D715E]">
                  <span><strong className="text-[#1A1612] font-semibold">{formatNumber(creator?.totalOrders)}</strong> đơn</span>
                  {rank === 1 && <span><strong className="text-[#1A1612] font-semibold">{formatNumber(creator?.totalClicks)}</strong> clicks</span>}
                  <span><strong className="text-[#1A1612] font-semibold">{formatNumber(creator?.conversionRate)}%</strong> CR</span>
                </div>
              </div>
            </details>
          </article>;
        })}
      </div>}

      {(loading || loadError || rankings.length > 0) && <section className="border border-[#EAE4D7] rounded-[15px] bg-white overflow-hidden" aria-labelledby="lb-ranking-title">
        <header className="flex items-center justify-between flex-wrap gap-3 p-4 sm:p-4.5 border-b border-[#EAE4D7]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 sm:w-9 h-8 sm:h-9 grid place-items-center shrink-0 rounded-[10px] bg-[#FBF5EB] text-[#B88E4F]"><Award aria-hidden="true" className="w-[18px] h-[18px]" /></span>
            <div><h2 id="lb-ranking-title" className="m-0 text-sm sm:text-base font-semibold tracking-tight text-[#1A1612]">Bảng xếp hạng Creator</h2><p className="m-0 mt-0.5 text-xs text-[#7D715E]">Vị trí 4–10; ba vị trí đầu được vinh danh trên bục nhận cúp.</p></div>
          </div>
          <span className="text-xs text-[#7D715E]">{metricLabels[metric]} · {scopeLabel}</span>
        </header>
        <div className="p-3"><input className={workspaceInput} aria-label="Tìm Creator trong vị trí 4 đến 10" placeholder="Tìm Creator, kênh, cấp bậc trong vị trí 4–10…" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <div className="overflow-x-auto" role="region" aria-label="Danh sách Creator tiếp theo" tabIndex={0}>
          <table className="w-full min-w-[900px] border-collapse text-xs text-[#7D715E] text-left">
            <thead className="bg-[#FAF8F5]"><tr>
              <th scope="col" className="text-center px-3.5 py-3 border-t border-[#EAE4D7] font-medium text-[11px] whitespace-nowrap">Hạng</th><th scope="col" className="px-3.5 py-3 border-t border-[#EAE4D7] font-medium text-[11px] whitespace-nowrap">Creator / Đối tác</th><th scope="col" className="px-3.5 py-3 border-t border-[#EAE4D7] font-medium text-[11px] whitespace-nowrap">Cấp bậc</th>
              <th scope="col" className="text-right px-3.5 py-3 border-t border-[#EAE4D7] font-medium text-[11px] whitespace-nowrap">Lượt click</th><th scope="col" className={`text-right px-3.5 py-3 border-t border-[#EAE4D7] font-medium text-[11px] whitespace-nowrap ${metric === 'ORDERS' ? 'bg-[#FBF5EB] text-[#1A1612] font-semibold' : ''}`}>Đơn hàng</th>
              <th scope="col" className={`text-right px-3.5 py-3 border-t border-[#EAE4D7] font-medium text-[11px] whitespace-nowrap ${metric === 'CONVERSION_RATE' ? 'bg-[#FBF5EB] text-[#1A1612] font-semibold' : ''}`}>Tỷ lệ chốt</th>
              <th scope="col" className={`text-right px-3.5 py-3 border-t border-[#EAE4D7] font-medium text-[11px] whitespace-nowrap ${metric === 'REVENUE' ? 'bg-[#FBF5EB] text-[#1A1612] font-semibold' : ''}`}>Doanh số GMV</th>
              <th scope="col" className={`text-right px-3.5 py-3 border-t border-[#EAE4D7] font-medium text-[11px] whitespace-nowrap ${metric === 'COMMISSION' ? 'bg-[#FBF5EB] text-[#1A1612] font-semibold' : ''}`}>Hoa hồng đã duyệt</th><th scope="col" className="text-center px-3.5 py-3 border-t border-[#EAE4D7] font-medium text-[11px] whitespace-nowrap">Hồ sơ</th>
            </tr></thead>
            <tbody>
              {loading || loadError || !displayedRankings.length ? <tr><td colSpan={9} className="py-8 px-4 text-center text-xs sm:text-sm text-[#7D715E]">{loading ? 'Đang tải danh sách KOL…' : loadError ? 'Chưa tải được danh sách. Vui lòng làm mới.' : 'Không có Creator phù hợp.'}</td></tr> : displayedRankings.map(item => (
                <tr key={item.collaboratorId} className={`hover:bg-[#FDFBF7] transition-colors ${item.isCurrentUser ? 'bg-[#FDFAF4]' : ''}`}>
                  <td className="text-center px-3.5 py-3 border-t border-[#EAE4D7]">
                    <div className="inline-flex items-center justify-center gap-1.5"><strong className="text-xs sm:text-[13px] font-semibold text-[#1A1612]">#{item.rank < 10 ? `0${item.rank}` : item.rank}</strong>
                      {metric === 'REVENUE' && (item.rankDelta > 0
                        ? <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#B88E4F]" title={`Tăng ${item.rankDelta} bậc`}><TrendingUp aria-hidden="true" className="w-3 h-3" />{item.rankDelta}</span>
                        : item.rankDelta < 0 ? <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#DC2626]" title={`Giảm ${Math.abs(item.rankDelta)} bậc`}><TrendingDown aria-hidden="true" className="w-3 h-3" />{Math.abs(item.rankDelta)}</span>
                        : <Minus className="w-3 h-3 text-[#7D715E]" aria-label="Không đổi hạng" />)}
                    </div>
                  </td>
                  <td className="px-3.5 py-3 border-t border-[#EAE4D7]"><div className="flex items-center gap-2.5 max-w-[245px]">
                    <span className="relative grid place-items-center w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#FAF8F5] border border-[#EAE4D7] text-[#B88E4F] text-xs font-semibold" aria-hidden="true">{item.fullName?.charAt(0) || 'K'}{item.avatarUrl && <img src={item.avatarUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={event => { event.currentTarget.style.display = 'none'; }} />}</span>
                    <div className="min-w-0"><div className="flex items-center flex-wrap gap-1"><strong className="text-xs font-semibold text-[#1A1612] truncate">{item.fullName}</strong>{item.isCurrentUser && <span className="inline-flex items-center px-1.5 py-0.5 border border-[#EEDFC6] rounded bg-[#FBF5EB] text-[#B88E4F] text-[10px] font-semibold">Bạn</span>}</div><p className="m-0 mt-0.5 text-[11px] text-[#7D715E] truncate" title={item.primaryChannelHandle || undefined}>{item.primaryChannelHandle || 'Chưa cập nhật kênh'}</p></div>
                  </div></td>
                  <td className="px-3.5 py-3 border-t border-[#EAE4D7]"><span className="inline-flex items-center px-2 py-0.5 border border-[#EAE4D7] rounded-md bg-white text-[11px] font-medium text-[#7D715E]">{item.tierName}</span></td>
                  <td className="text-right px-3.5 py-3 border-t border-[#EAE4D7] tabular-nums whitespace-nowrap">{formatNumber(item.totalClicks)}</td>
                  <td className={`text-right px-3.5 py-3 border-t border-[#EAE4D7] tabular-nums whitespace-nowrap ${metric === 'ORDERS' ? 'bg-[#FBF5EB] text-[#1A1612] font-semibold' : ''}`}>{formatNumber(item.totalOrders)} đơn</td>
                  <td className={`text-right px-3.5 py-3 border-t border-[#EAE4D7] tabular-nums whitespace-nowrap ${metric === 'CONVERSION_RATE' ? 'bg-[#FBF5EB] text-[#1A1612] font-semibold' : ''}`}>{formatNumber(item.conversionRate)}%</td>
                  <td className={`text-right px-3.5 py-3 border-t border-[#EAE4D7] tabular-nums whitespace-nowrap ${metric === 'REVENUE' ? 'bg-[#FBF5EB] text-[#1A1612] font-semibold' : ''}`}>{formatVND(item.grossRevenue)}</td>
                  <td className={`text-right px-3.5 py-3 border-t border-[#EAE4D7] tabular-nums whitespace-nowrap ${metric === 'COMMISSION' ? 'bg-[#FBF5EB] text-[#1A1612] font-semibold' : ''}`}>{formatVND(item.totalCommission)}</td>
                  <td className="text-center px-3.5 py-3 border-t border-[#EAE4D7]"><button className="inline-flex items-center justify-center gap-1 px-2.5 py-1 border border-[#EAE4D7] rounded-md bg-white text-[#7D715E] text-xs hover:bg-[#FBF5EB] hover:text-[#1A1612] transition-colors cursor-pointer" onClick={() => handleOpenCreatorModal(item.collaboratorId)}>Xem <ChevronRight aria-hidden="true" className="w-3.5 h-3.5" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>}

      {!loading && !loadError && myRank && (
        <section className="flex items-center justify-between flex-wrap gap-4 p-4 border border-[#EAE4D7] rounded-[15px] bg-white" aria-label="Vị trí của bạn trên bảng xếp hạng">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid place-items-center w-10 h-10 shrink-0 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB] text-[#B88E4F] text-base font-bold">{myRank.myRank === null ? <Award aria-hidden="true" className="w-5 h-5" /> : `#${myRank.myRank}`}</span>
            <div>
              <div className="flex items-center flex-wrap gap-2"><h2 className="m-0 text-sm font-semibold text-[#1A1612]">{myRank.myRank === null ? 'Bạn chưa được xếp hạng trong kỳ' : `Hạng của bạn theo ${metricLabels[metric]}`}</h2>
                {metric === 'REVENUE' && myRank.rankDelta > 0 && <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#B88E4F]"><TrendingUp aria-hidden="true" className="w-3.5 h-3.5" /> Tăng {myRank.rankDelta} bậc</span>}
              </div>
              <p className="m-0 mt-0.5 text-xs text-[#7D715E]">{myRank.currentPeriodLabel} · {metricLabels[metric]} hiện tại: <strong className="text-[#1A1612] font-semibold">{metric === 'REVENUE' ? formatVND(myRank.myRevenue) : metric === 'ORDERS' ? `${formatNumber(myRank.myOrders)} đơn` : metric === 'CONVERSION_RATE' ? `${formatNumber(myRank.myConversionRate)}%` : formatVND(myRank.myCommission)}</strong></p>
            </div>
          </div>
          <div className="flex items-center justify-end flex-wrap gap-2.5">
            {metric === 'REVENUE' && myRank.myRank !== null && (myRank.myRank > 10
              ? <div className="flex flex-col gap-0.5 text-right"><span className="text-[11px] text-[#7D715E]">Chênh lệch doanh số với Top 10</span><strong className="text-xs font-semibold text-[#1A1612]">{formatVND(myRank.gapToTop10Revenue)}</strong></div>
              : <span className="inline-flex items-center gap-1 text-xs text-[#7D715E]"><Check aria-hidden="true" className="w-3.5 h-3.5 text-[#B88E4F]" /> Đang trong Top 10</span>)}
            {currentUser?.role === 'COLLABORATOR' ? <Link className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#1A1612] text-xs font-semibold hover:bg-[#F3EFE6] transition-colors" to="/collaborator/marketing">Tạo link tiếp thị<ArrowUpRight aria-hidden="true" className="w-3.5 h-3.5 text-[#B88E4F]" /></Link>
              : <button className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#1A1612] text-xs font-semibold hover:bg-[#F3EFE6] transition-colors cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Xem bộ lọc<ArrowUpRight aria-hidden="true" className="w-3.5 h-3.5 text-[#B88E4F]" /></button>}
          </div>
        </section>
      )}

      {/* ─── 5. MODAL HỒ SƠ VINH DANH CREATOR (CREATOR HALL OF FAME) ─────── */}
      {selectedCreatorId && createPortal(
        <div role="dialog" aria-modal="true" aria-labelledby="creator-hall-profile-title" className="creator-hall-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div ref={profileDialog} tabIndex={-1} className="creator-hall-modal bg-white border border-[#EAE4D7] rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-[#8F682E]" />
                <h3 id="creator-hall-profile-title" className="text-lg font-bold text-[#1A1612]">Hồ sơ vinh danh Creator</h3>
              </div>
              <button
                onClick={handleCloseModal}
                aria-label="Đóng hồ sơ Creator"
                className="p-1.5 rounded-xl text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileError ? <div role="alert" className="py-8 text-center text-xs text-[#DC2626]">{profileError}<button className={`${workspaceButton} ml-2`} onClick={() => void handleOpenCreatorModal(selectedCreatorId)}>Thử lại</button></div> : loadingProfile || !creatorProfile ? (
              <div className="py-12 text-center text-[#7D715E] space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#8F682E]" />
                <p className="text-xs">Đang tải hồ sơ thành tích...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Creator Header Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] p-1 flex-shrink-0 shadow-lg">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-2xl font-bold text-[#8F682E] overflow-hidden">
                      {creatorProfile.avatarUrl ? (
                        <img src={creatorProfile.avatarUrl} alt={creatorProfile.fullName} className="w-full h-full object-cover" />
                      ) : (
                        creatorProfile.fullName?.charAt(0)
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 className="text-xl font-extrabold text-[#1A1612]">{creatorProfile.fullName}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FBF5EB] text-[#8F682E] border border-[#EEDFC6]">
                        {creatorProfile.tierName}
                      </span>
                    </div>
                    <p className="text-xs text-[#7D715E]">{creatorProfile.bio}</p>
                    <p className="text-xs text-[#7D715E]">{creatorProfile.email}</p>
                  </div>
                </div>

                {/* Lifetime Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE4D7] text-center">
                    <span className="text-[11px] text-[#7D715E]">Tổng Đơn Hàng</span>
                    <div className="text-base font-bold text-[#1A1612]">{formatNumber(creatorProfile.lifetimeStats.totalOrders)}</div>
                  </div>
                  <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE4D7] text-center">
                    <span className="text-[11px] text-[#7D715E]">Tổng Doanh Thu</span>
                    <div className="text-base font-bold text-[#8F682E]">{formatVND(creatorProfile.lifetimeStats.totalRevenue)}</div>
                  </div>
                  <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE4D7] text-center">
                    <span className="text-[11px] text-[#7D715E]">Tổng Hoa Hồng</span>
                    <div className="text-base font-bold text-[#8F682E]">{formatVND(creatorProfile.lifetimeStats.totalCommission)}</div>
                  </div>
                  <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE4D7] text-center">
                    <span className="text-[11px] text-[#7D715E]">Mẫu Thử Đã Nhận</span>
                    <div className="text-base font-bold text-[#1A1612]">{creatorProfile.lifetimeStats.totalSamplesReceived} mẫu</div>
                  </div>
                </div>

                {/* Badges */}
                {creatorProfile.badges.length > 0 && <div className="space-y-2">
                  <h5 className="text-xs font-bold text-[#7D715E] uppercase tracking-wider">Huy Hiệu Danh Dự</h5>
                  <div className="flex flex-wrap gap-2">
                    {creatorProfile.badges.map((b) => (
                      <span
                        key={b.id}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FBF5EB] text-[#8F682E] border border-[#EEDFC6] flex items-center space-x-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-[#8F682E]" />
                        <span>{b.name}</span>
                      </span>
                    ))}
                  </div>
                </div>}

                {/* Social Channels */}
                {creatorProfile.socialChannels.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-[#7D715E] uppercase tracking-wider">Kênh Mạng Xã Hội</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {creatorProfile.socialChannels.map((s, idx) => (
                        <div key={idx} className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7] flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-[#1A1612]">{s.platform}</span>
                            <p className="text-[#7D715E] text-[11px]">{s.channelName ? `@${s.channelName}` : 'Chưa đặt tên'}</p>
                          </div>
                          <span className="text-[#7D715E] font-medium">{formatNumber(s.followerCount)} theo dõi</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#EAE4D7]">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-[#F3EFE6] hover:bg-[#F3EFE6] text-[#7D715E] text-xs font-semibold rounded-xl transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
