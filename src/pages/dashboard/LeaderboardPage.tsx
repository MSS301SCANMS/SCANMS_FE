import { useCallback, useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Award,
  Zap,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  ChevronRight,
  Filter,
  X,
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
        limit: 20,
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
    try {
      setSelectedCreatorId(creatorId);
      setLoadingProfile(true);
      const profile = await leaderboardService.getCreatorProfile(creatorId);
      setCreatorProfile(profile);
    } catch (err) {
      console.error('Lỗi khi tải hồ sơ creator:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCloseModal = () => {
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
    COMMISSION: 'Hoa hồng',
  };
  const formatMetricValue = (item?: LeaderboardItem | null) => {
    if (!item) return '—';
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
  const myRank = data?.myRankStatus;

  return (
    <div className={`w-full min-w-0 space-y-4 bg-[#FAF8F5] text-[#1A1612] antialiased ${alignToContainer ? 'px-0 pt-3 pb-24' : 'p-4 pb-24 sm:p-5 sm:pb-24 lg:p-6 lg:pb-24'}`}>
      {/* Gọn phần bộ lọc, bỏ banner giới thiệu để tập trung vào bảng xếp hạng */}
      <section className="overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white shadow-sm">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-1 sm:grid-cols-4 sm:flex-1 sm:max-w-2xl">
            <button onClick={() => setTimeRange('this_month')} className={`flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors ${timeRange === 'this_month' ? 'bg-[#C59B58] font-semibold text-[#1A1612] shadow-sm' : 'text-[#7D715E] hover:bg-white hover:text-[#1A1612]'}`}>
              Tháng này
            </button>
            <button onClick={() => setTimeRange('last_month')} className={`flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors ${timeRange === 'last_month' ? 'bg-[#C59B58] font-semibold text-[#1A1612] shadow-sm' : 'text-[#7D715E] hover:bg-white hover:text-[#1A1612]'}`}>
              Tháng trước
            </button>
            <button onClick={() => setTimeRange('this_quarter')} className={`flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors ${timeRange === 'this_quarter' ? 'bg-[#C59B58] font-semibold text-[#1A1612] shadow-sm' : 'text-[#7D715E] hover:bg-white hover:text-[#1A1612]'}`}>
              Quý này
            </button>
            <button onClick={() => setTimeRange('all_time')} className={`flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors ${timeRange === 'all_time' ? 'bg-[#C59B58] font-semibold text-[#1A1612] shadow-sm' : 'text-[#7D715E] hover:bg-white hover:text-[#1A1612]'}`}>
              Toàn thời gian
            </button>
          </div>
          <div className="flex items-center justify-end gap-2">
            {loading && <span role="status" aria-live="polite" className="text-[11px] text-[#7D715E]">Đang cập nhật…</span>}
            <button onClick={fetchLeaderboard} disabled={loading} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#EAE4D7] bg-white px-3 text-xs font-semibold text-[#7D715E] transition-colors hover:bg-[#FBF5EB] hover:text-[#8F682E] disabled:opacity-50 sm:w-auto" title="Làm mới bảng xếp hạng">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#8F682E]' : ''}`} />
              <span className="sm:hidden">Làm mới</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#EAE4D7] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#7D715E]">
              <Filter className="h-3.5 w-3.5 text-[#8F682E]" />
              <span>Xếp hạng theo</span>
            </span>
            <button type="button" aria-pressed={metric === 'REVENUE'} onClick={() => setMetric('REVENUE')} className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${metric === 'REVENUE' ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : 'border-transparent bg-white text-[#7D715E] hover:border-[#EAE4D7] hover:bg-[#FAF8F5]'}`}>
              <DollarSign className="h-3.5 w-3.5" /><span>Doanh thu</span>
            </button>
            <button type="button" aria-pressed={metric === 'ORDERS'} onClick={() => setMetric('ORDERS')} className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${metric === 'ORDERS' ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : 'border-transparent bg-white text-[#7D715E] hover:border-[#EAE4D7] hover:bg-[#FAF8F5]'}`}>
              <ShoppingBag className="h-3.5 w-3.5" /><span>Đơn hàng</span>
            </button>
            <button type="button" aria-pressed={metric === 'CONVERSION_RATE'} onClick={() => setMetric('CONVERSION_RATE')} className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${metric === 'CONVERSION_RATE' ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : 'border-transparent bg-white text-[#7D715E] hover:border-[#EAE4D7] hover:bg-[#FAF8F5]'}`}>
              <Zap className="h-3.5 w-3.5" /><span>Tỷ lệ chốt</span>
            </button>
            <button type="button" aria-pressed={metric === 'COMMISSION'} onClick={() => setMetric('COMMISSION')} className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${metric === 'COMMISSION' ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : 'border-transparent bg-white text-[#7D715E] hover:border-[#EAE4D7] hover:bg-[#FAF8F5]'}`}>
              <Award className="h-3.5 w-3.5" /><span>Hoa hồng</span>
            </button>
          </div>
          {canChangeScope && (
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button type="button" aria-pressed={scope === 'STORE'} onClick={() => setScope(scope === 'GLOBAL' ? 'STORE' : 'GLOBAL')} className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs font-medium text-[#7D715E] transition-colors hover:bg-[#FBF5EB] hover:text-[#8F682E]">
                <Shield className="h-3.5 w-3.5 text-[#8F682E]" />
                <span>{scope === 'GLOBAL' ? 'Toàn sàn SCANMS' : isAdmin ? 'Theo gian hàng' : 'Gian hàng của tôi'}</span>
              </button>
              {scope === 'STORE' && isAdmin && (
                <select aria-label="Chọn gian hàng để xếp hạng" value={selectedStoreId} onChange={(event) => setSelectedStoreId(event.target.value)} className="h-9 max-w-[220px] rounded-lg border border-[#EAE4D7] bg-white px-3 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/15" disabled={!stores.length}>
                  {stores.length ? stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>) : <option value="">{storesLoading ? 'Đang tải gian hàng…' : 'Không có gian hàng'}</option>}
                </select>
              )}
            </div>
          )}
        </div>
      </section>

      {loadError && <div role="alert" className="rounded-xl border border-[#EEDFC6] bg-white px-3 py-2 text-xs text-[#DC2626]">{loadError}</div>}

      {/* ─── 2. BỤC VINH DANH PODIUM TOP 1 - 2 - 3 ──────────────────────── */}
      <div className="grid grid-cols-1 items-stretch gap-4 pt-1 md:auto-rows-fr md:grid-cols-3">
        {/* RANK 2: Á QUÂN 1 (SILVER MEDAL) */}
        <div
          onClick={() => podium?.rank2 && handleOpenCreatorModal(podium.rank2.collaboratorId)}
          className={`cursor-pointer group relative bg-white border border-[#EAE4D7] hover:border-[#C59B58] rounded-2xl p-4 text-center space-y-3 shadow-sm transition-colors order-2 md:order-1 ${
            podium?.rank2?.isCurrentUser ? 'ring-2 ring-[#C59B58] bg-white' : ''
          }`}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-xl bg-[#F3EFE6] text-[#7D715E] font-bold text-sm border border-[#EAE4D7]">
            2
          </div>

          <div className="pt-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F3EFE6] p-1">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden text-2xl font-bold text-[#1A1612]">
                {podium?.rank2?.avatarUrl ? (
                  <img src={podium.rank2.avatarUrl} alt={podium.rank2.fullName} className="w-full h-full object-cover" />
                ) : (
                  podium?.rank2?.fullName?.charAt(0) || '2'
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-base text-[#1A1612] group-hover:text-[#1A1612] flex items-center justify-center gap-1.5">
              <span>{podium?.rank2?.fullName || (loading && !data ? 'Đang tải KOL…' : 'Chưa có đối tác')}</span>
              {podium?.rank2?.isCurrentUser && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FBF5EB] text-[#8F682E] border border-[#EEDFC6]">Bạn</span>
              )}
            </h3>
            <p className="text-xs text-[#7D715E]">{podium?.rank2?.primaryChannelHandle || (loading && !data ? 'Đang tải hồ sơ…' : '@creator • TikTok')}</p>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7] space-y-1">
            <span className="text-[11px] text-[#7D715E] font-medium">{metricLabels[metric]} · xếp hạng</span>
            <div className="text-xl font-extrabold text-[#1A1612]">{formatMetricValue(podium?.rank2)}</div>
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#7D715E] pt-1 border-t border-[#EAE4D7]">
              <span>{podium?.rank2?.totalOrders || 0} đơn</span>
              <span>•</span>
              <span className="text-[#8F682E]">{podium?.rank2?.conversionRate || 0}% CR</span>
            </div>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FBF5EB] text-[#7D715E] border border-[#EAE4D7]">
            <Medal className="w-3.5 h-3.5 text-[#7D715E]" />
            <span>{podium?.rank2?.tierName || 'Cấp Bạc'}</span>
          </div>

          <div className="p-2 bg-[#FBF5EB] rounded-lg border border-[#EEDFC6] text-xs font-medium text-[#7D715E]">
            🎁 Thưởng nóng: <strong className="text-[#8F682E]">+2.500.000 ₫</strong>
          </div>
        </div>

        {/* RANK 1: QUÁN QUÂN (GOLD CROWN / DIAMOND GLOW) */}
        <div
          onClick={() => podium?.rank1 && handleOpenCreatorModal(podium.rank1.collaboratorId)}
          className={`cursor-pointer group relative bg-[#FBF5EB] border border-[#EEDFC6] hover:border-[#C59B58] rounded-2xl p-4 sm:p-5 text-center space-y-3 shadow-sm transition-colors order-1 md:order-2 ${
            podium?.rank1?.isCurrentUser ? 'ring-4 ring-amber-400/50' : ''
          }`}
        >
          {/* Crown & Floating Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <Crown className="w-5 h-5 text-[#8F682E]" />
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#C59B58] text-[#1A1612] font-bold text-sm border border-white">
              1
            </div>
          </div>

          <div className="pt-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#C59B58] p-1">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden text-3xl font-extrabold text-[#8F682E]">
                {podium?.rank1?.avatarUrl ? (
                  <img src={podium.rank1.avatarUrl} alt={podium.rank1.fullName} className="w-full h-full object-cover" />
                ) : (
                  podium?.rank1?.fullName?.charAt(0) || '1'
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-[#1A1612] group-hover:text-[#8F682E] flex items-center justify-center gap-1.5">
              <span>{podium?.rank1?.fullName || (loading && !data ? 'Đang tải KOL…' : 'Chưa có Quán Quân')}</span>
              {podium?.rank1?.isCurrentUser && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-[#1A1612] font-bold">BẠN</span>
              )}
            </h3>
            <p className="text-xs text-[#7D715E] font-medium">{podium?.rank1?.primaryChannelHandle || (loading && !data ? 'Đang tải hồ sơ…' : '@top.creator • YouTube/TikTok')}</p>
          </div>

          <div className="p-3 bg-white/80 rounded-xl border border-[#EEDFC6] space-y-1">
            <span className="text-xs text-[#8F682E] font-semibold uppercase tracking-wider">Đứng đầu theo {metricLabels[metric]}</span>
            <div className="text-xl sm:text-2xl font-extrabold text-[#8F682E]">
              {formatMetricValue(podium?.rank1)}
            </div>
            <div className="flex items-center justify-center gap-3 text-xs text-[#7D715E] pt-2 border-t border-[#EAE4D7]">
              <span><strong>{podium?.rank1?.totalOrders || 0}</strong> đơn</span>
              <span>•</span>
              <span><strong>{formatNumber(podium?.rank1?.totalClicks)}</strong> clicks</span>
              <span>•</span>
              <span className="text-[#8F682E] font-bold">{podium?.rank1?.conversionRate || 0}% CR</span>
            </div>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#8F682E] border border-[#EEDFC6]">
            <Sparkles className="w-3.5 h-3.5 text-[#8F682E]" />
            <span>{podium?.rank1?.tierName || 'Cấp Kim Cương'}</span>
          </div>

          <div className="p-2 bg-white/80 rounded-lg border border-[#EEDFC6] text-xs font-semibold text-[#8F682E]">
            👑 Thưởng nóng: <span className="text-[#1A1612]">+5.000.000 ₫</span> &amp; <span className="text-[#8F682E]">+5% Thưởng VIP</span>
          </div>
        </div>

        {/* RANK 3: Á QUÂN 2 (BRONZE SHIELD) */}
        <div
          onClick={() => podium?.rank3 && handleOpenCreatorModal(podium.rank3.collaboratorId)}
          className={`cursor-pointer group relative bg-white border border-[#EAE4D7] hover:border-[#C59B58] rounded-2xl p-4 text-center space-y-3 shadow-sm transition-colors order-3 ${
            podium?.rank3?.isCurrentUser ? 'ring-2 ring-[#C59B58] bg-white' : ''
          }`}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-xl bg-[#F3EFE6] text-[#8F682E] font-bold text-sm border border-[#EEDFC6]">
            3
          </div>

          <div className="pt-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#EEDFC6] p-1">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden text-2xl font-bold text-[#8F682E]">
                {podium?.rank3?.avatarUrl ? (
                  <img src={podium.rank3.avatarUrl} alt={podium.rank3.fullName} className="w-full h-full object-cover" />
                ) : (
                  podium?.rank3?.fullName?.charAt(0) || '3'
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-base text-[#1A1612] group-hover:text-[#8F682E] flex items-center justify-center gap-1.5">
              <span>{podium?.rank3?.fullName || (loading && !data ? 'Đang tải KOL…' : 'Chưa có đối tác')}</span>
              {podium?.rank3?.isCurrentUser && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FBF5EB] text-[#8F682E] border border-[#EEDFC6]">Bạn</span>
              )}
            </h3>
            <p className="text-xs text-[#7D715E]">{podium?.rank3?.primaryChannelHandle || (loading && !data ? 'Đang tải hồ sơ…' : '@creator • Facebook')}</p>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7] space-y-1">
            <span className="text-[11px] text-[#7D715E] font-medium">{metricLabels[metric]} · xếp hạng</span>
            <div className="text-xl font-extrabold text-[#8F682E]">{formatMetricValue(podium?.rank3)}</div>
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#7D715E] pt-1 border-t border-[#EAE4D7]">
              <span>{podium?.rank3?.totalOrders || 0} đơn</span>
              <span>•</span>
              <span className="text-[#8F682E]">{podium?.rank3?.conversionRate || 0}% CR</span>
            </div>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FBF5EB] text-[#8F682E] border border-[#EEDFC6]">
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>{podium?.rank3?.tierName || 'Cấp Đồng'}</span>
          </div>

          <div className="p-2 bg-[#FBF5EB] rounded-lg border border-[#EEDFC6] text-xs font-medium text-[#7D715E]">
            🎁 Thưởng nóng: <strong className="text-[#8F682E]">+1.000.000 ₫</strong>
          </div>
        </div>
      </div>

      {/* ─── 3. BẢNG XẾP HẠNG TOP 4 - 20 (RANKING TABLE) ───────────────── */}
      <div className="bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#EAE4D7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#1A1612] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#8F682E]" />
              <span>Bảng Xếp Hạng Top 4 — Top 20</span>
            </h2>
            <p className="text-xs text-[#7D715E]">Danh sách đối tác theo kết quả đã ghi nhận.</p>
          </div>
              <span className="text-xs text-[#7D715E]">Xếp hạng theo {metricLabels[metric]} · {scope === 'GLOBAL' ? 'Toàn sàn' : isAdmin ? (stores.find((store) => store.id === selectedStoreId)?.name || 'Gian hàng') : 'Gian hàng của bạn'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] text-[#7D715E] border-b border-[#EAE4D7] font-semibold">
                <th className="py-3 px-4 text-center w-20">Hạng</th>
                <th className="py-3 px-4">Creator / Đối Tác</th>
                <th className="py-3 px-4">Cấp Bậc</th>
                <th className="py-3 px-4 text-right">Lượt Click</th>
                <th className={`py-3 px-4 text-right ${metric === 'ORDERS' ? 'bg-[#FBF5EB] text-[#8F682E]' : ''}`}>Đơn Hàng</th>
                <th className={`py-3 px-4 text-right ${metric === 'CONVERSION_RATE' ? 'bg-[#FBF5EB] text-[#8F682E]' : ''}`}>Tỷ Lệ Chốt (CR%)</th>
                <th className={`py-3 px-4 text-right ${metric === 'REVENUE' ? 'bg-[#FBF5EB] text-[#8F682E]' : ''}`}>Doanh Số (GMV)</th>
                <th className={`py-3 px-4 text-right ${metric === 'COMMISSION' ? 'bg-[#FBF5EB] text-[#8F682E]' : ''}`}>Hoa Hồng</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D7]">
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#7D715E]">
                    {loading && !data ? 'Đang tải danh sách KOL…' : 'Chưa có thêm đối tác trong khoảng thời gian này.'}
                  </td>
                </tr>
              ) : (
                rankings.map((item) => (
                  <tr
                    key={item.collaboratorId}
                    className={`hover:bg-[#FAF8F5] transition-colors group ${
                      item.isCurrentUser ? 'bg-[#FBF5EB] hover:bg-amber-500/15' : ''
                    }`}
                  >
                    {/* Rank Number & Delta */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <span className="font-extrabold text-sm text-[#7D715E]">
                          #{item.rank < 10 ? `0${item.rank}` : item.rank}
                        </span>
                        {metric === 'REVENUE' && item.rankDelta > 0 && (
                          <span className="flex items-center text-[10px] text-[#8F682E] font-bold" title={`Tăng ${item.rankDelta} bậc`}>
                            <TrendingUp className="w-3 h-3" />
                            <span>{item.rankDelta}</span>
                          </span>
                        )}
                        {metric === 'REVENUE' && item.rankDelta < 0 && (
                          <span className="flex items-center text-[10px] text-[#DC2626] font-bold" title={`Giảm ${Math.abs(item.rankDelta)} bậc`}>
                            <TrendingDown className="w-3 h-3" />
                            <span>{Math.abs(item.rankDelta)}</span>
                          </span>
                        )}
                        {metric === 'REVENUE' && item.rankDelta === 0 && (
                          <span className="text-[#7D715E] text-[10px]">
                            <Minus className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Creator Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-[#F3EFE6] flex items-center justify-center text-xs font-bold text-[#7D715E] border border-[#EAE4D7] overflow-hidden flex-shrink-0">
                          {item.avatarUrl ? (
                            <img src={item.avatarUrl} alt={item.fullName} className="w-full h-full object-cover" />
                          ) : (
                            item.fullName?.charAt(0) || 'K'
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[#1A1612] group-hover:text-[#8F682E] transition-colors flex items-center gap-1.5">
                            <span>{item.fullName}</span>
                            {item.isCurrentUser && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[#1A1612] text-[10px] font-bold">Bạn</span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#7D715E]">{item.primaryChannelHandle || '@creator'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3EFE6] text-[#7D715E] border border-[#EAE4D7]">
                        {item.tierName}
                      </span>
                    </td>

                    {/* Clicks */}
                    <td className="py-3 px-4 text-right font-medium text-[#7D715E]">
                      {formatNumber(item.totalClicks)}
                    </td>

                    {/* Orders */}
                    <td className={`py-3 px-4 text-right ${metric === 'ORDERS' ? 'bg-[#FBF5EB] font-bold text-[#8F682E]' : 'font-medium text-[#7D715E]'}`}>
                      {item.totalOrders} đơn
                    </td>

                    {/* Conversion Rate */}
                    <td className={`py-3 px-4 text-right ${metric === 'CONVERSION_RATE' ? 'bg-[#FBF5EB]' : ''}`}>
                      <span className={`font-bold ${metric === 'CONVERSION_RATE' ? 'text-[#8F682E]' : 'text-[#7D715E]'}`}>{item.conversionRate}%</span>
                    </td>

                    {/* GMV */}
                    <td className={`py-3 px-4 text-right text-sm ${metric === 'REVENUE' ? 'bg-[#FBF5EB] font-extrabold text-[#8F682E]' : 'font-semibold text-[#7D715E]'}`}>
                      {formatVND(item.grossRevenue)}
                    </td>

                    {/* Commission */}
                    <td className={`py-3 px-4 text-right ${metric === 'COMMISSION' ? 'bg-[#FBF5EB] font-bold text-[#8F682E]' : 'font-semibold text-[#7D715E]'}`}>
                      {formatVND(item.totalCommission)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenCreatorModal(item.collaboratorId)}
                        className="px-3 py-1.5 bg-[#F3EFE6] hover:bg-amber-500 hover:text-[#1A1612] text-[#7D715E] font-semibold rounded-xl text-xs transition-all flex items-center space-x-1 mx-auto"
                      >
                        <span>Hồ sơ</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 4. THANH VỊ TRÍ CỦA TÔI (MY RANK STICKY BAR) ──────────────── */}
      {myRank && (
        <div className="fixed bottom-4 left-4 right-4 max-w-5xl mx-auto z-40">
          <div className="bg-white border border-[#EEDFC6] rounded-2xl p-3 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#8F682E] font-bold text-base flex-shrink-0">
                #{myRank.myRank}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[#1A1612] text-sm">Hạng của bạn theo {metricLabels[metric]} · {myRank.currentPeriodLabel}</h4>
                  {metric === 'REVENUE' && myRank.rankDelta > 0 && (
                    <span className="text-[#8F682E] text-xs font-semibold">↑ Tăng {myRank.rankDelta} bậc</span>
                  )}
                </div>
                <p className="text-xs text-[#7D715E]">
                  {metricLabels[metric]} hiện tại: <strong className="text-[#8F682E] font-bold">{metric === 'REVENUE' ? formatVND(myRank.myRevenue) : metric === 'ORDERS' ? `${formatNumber(myRank.myOrders)} đơn` : metric === 'CONVERSION_RATE' ? `${formatNumber(myRank.myConversionRate)}%` : formatVND(myRank.myCommission)}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {metric === 'REVENUE' && myRank.myRank > 10 ? (
                <div className="text-right">
                  <span className="text-[11px] text-[#7D715E]">Cần thêm để vào Top 10:</span>
                  <div className="text-sm font-bold text-[#8F682E]">+{formatVND(myRank.gapToTop10Revenue)}</div>
                </div>
              ) : metric === 'REVENUE' ? (
                <div className="px-3 py-1 bg-[#FBF5EB] text-[#8F682E] border border-[#EEDFC6] rounded-lg text-xs font-semibold">
                  ✓ ĐANG NẰM TRONG TOP 10
                </div>
              ) : null}

              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-2 bg-[#C59B58] hover:bg-[#B88E4F] text-[#1A1612] font-semibold rounded-lg text-xs transition-colors"
              >
                Đua Top Ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. MODAL HỒ SƠ VINH DANH CREATOR (CREATOR HALL OF FAME) ─────── */}
      {selectedCreatorId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#EEDFC6] rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-[#8F682E]" />
                <h3 className="text-lg font-bold text-[#1A1612]">Hồ Sơ Vinh Danh Creator (Hall of Fame)</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingProfile || !creatorProfile ? (
              <div className="py-12 text-center text-[#7D715E] space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#8F682E]" />
                <p className="text-xs">Đang tải hồ sơ thành tích...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Creator Header Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-1 flex-shrink-0 shadow-lg">
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
                    <div className="text-base font-bold text-blue-400">{creatorProfile.lifetimeStats.totalSamplesReceived} mẫu</div>
                  </div>
                </div>

                {/* Badges */}
                <div className="space-y-2">
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
                </div>

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
                  <button
                    onClick={() => {
                      toast.success(`Đã gửi lời mời hợp tác độc quyền tới Creator ${creatorProfile.fullName}!`, {
                        description: 'Hệ thống đã chuyển lời mời và kích hoạt đặc quyền chiến dịch VIP.',
                      });
                      handleCloseModal();
                    }}
                    className="px-5 py-2 bg-[#C59B58] hover:bg-[#B88E4F] text-[#1A1612] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    👑 Mời Vào Chiến Dịch VIP (FR-27)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
