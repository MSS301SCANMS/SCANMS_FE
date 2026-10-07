import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  Search,
  RefreshCw,
  Lock,
  PauseCircle,
  Eye,
  Activity,
  Sparkles,
  Info,
  Shield,
  Layers,
  X,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  aiFraudService,
  type FraudIncident,
  type FraudScanSummary,
  type FraudRiskLevel,
  type FraudMitigationAction,
} from '../../services/ai-fraud.service';
import { Select } from '../../components/ui/Select';
import './AiFraudSentinelPage.css';

export default function AiFraudSentinelPage() {
  const [summary, setSummary] = useState<FraudScanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'CRITICAL' | 'SUSPICIOUS' | 'LOW' | 'FROZEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIncident, setActiveIncident] = useState<FraudIncident | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('30d');

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await aiFraudService.scanTraffic({ timeframe });
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      const message = 'Không thể tải dữ liệu quét gian lận AI. Vui lòng thử lại.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (action: FraudMitigationAction) => {
    if (!activeIncident) return;
    setActionLoading(true);
    try {
      const res = await aiFraudService.takeAction(activeIncident.id, action, actionNote);
      toast.success(res.message || 'Thực hiện thao tác thành công!');
      setActiveIncident(res.incident);
      setActionNote('');
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi thực hiện hành động');
    } finally {
      setActionLoading(false);
    }
  };

  const getRiskBadge = (level: FraudRiskLevel, score: number) => {
    switch (level) {
      case 'FRAUD_CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1 text-[10px] font-bold text-[#B91C1C]">
            <Flame className="h-3.5 w-3.5" />
            Cao · {score}đ
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[10px] font-bold text-[#8A642C]">
            <AlertTriangle className="h-3.5 w-3.5" />
            Nghi vấn · {score}đ
          </span>
        );
      case 'LOW_RISK':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE4D7] bg-[#F3EFE6] px-2.5 py-1 text-[10px] font-semibold text-[#5F5547]">
            <Info className="h-3.5 w-3.5" />
            Theo dõi · {score}đ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[10px] font-semibold text-[#5F5547]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
            An toàn · {score}đ
          </span>
        );
    }
  };

  const getAnomalyLabel = (type: string) => {
    switch (type) {
      case 'ZOMBIE_TRAFFIC':
        return { label: 'Click ảo / Zombie Traffic', color: 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]' };
      case 'CLICK_BURST_BOT':
        return { label: 'Bot Spam Click', color: 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]' };
      case 'IP_CLUSTER':
        return { label: 'Tập trung IP Proxy', color: 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C]' };
      case 'FLASH_CONVERSION':
        return { label: 'Checkout chớp nhoáng', color: 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C]' };
      case 'CONVERSION_SPIKE':
        return { label: 'Đột biến chuyển đổi', color: 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C]' };
      case 'SELF_REFERRAL':
        return { label: 'Tự mua qua link mình', color: 'border-[#EAE4D7] bg-[#F3EFE6] text-[#5F5547]' };
      default:
        return { label: type, color: 'border-[#EAE4D7] bg-[#FAF8F5] text-[#5F5547]' };
    }
  };

  const filteredIncidents = (summary?.incidents || []).filter((inc) => {
    const matchesSearch =
      inc.collaboratorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.collaboratorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.incidentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.referralLinkCode && inc.referralLinkCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inc.productName && inc.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedTab === 'CRITICAL') return inc.riskLevel === 'FRAUD_CRITICAL';
    if (selectedTab === 'SUSPICIOUS') return inc.riskLevel === 'SUSPICIOUS';
    if (selectedTab === 'LOW') return inc.riskLevel === 'LOW_RISK';
    if (selectedTab === 'FROZEN') return inc.status === 'FROZEN';
    return true;
  });
  const isInitialLoading = loading && summary === null;
  const countLabel = (count?: number) => {
    if (isInitialLoading) return '…';
    if (!summary && loadError) return '—';
    return (count ?? 0).toLocaleString('vi-VN');
  };

  return (
    <div className="sentinel-page w-full min-w-0 space-y-4 pb-8 pt-4 sm:pt-5">
      {/* KPI Metric Cards - Nhỏ gọn, cân xứng, chuẩn 4 cột trên desktop */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {/* Total Clicks Scanned */}
        <div className="flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-[#EAE4D7] bg-white p-3 sm:p-3.5 transition hover:border-[#C59B58]/50">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E] truncate">Lưu lượng đã quét</span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-semibold tracking-tight text-[#1A1612]">
              {isInitialLoading ? (
                <span aria-hidden="true" className="inline-block h-7 w-20 animate-pulse rounded bg-[#F3EFE6] align-middle" />
              ) : !summary && loadError ? '—' : <>{(summary?.totalScannedClicks ?? 0).toLocaleString('vi-VN')}{' '}<span className="text-xs font-semibold text-[#7D715E]">clicks</span></>}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[#7D715E] truncate">
              {isInitialLoading ? (
                <span aria-hidden="true" className="inline-block h-3.5 w-32 animate-pulse rounded bg-[#F3EFE6]" />
              ) : !summary && loadError ? 'Chưa tải được số liệu' : <><Layers className="h-3.5 w-3.5 text-[#B88E4F] shrink-0" /><span>Trên <strong className="font-bold text-[#1A1612]">{summary?.totalScannedLinks ?? 0}</strong> link tiếp thị</span></>}
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-[#EAE4D7] bg-white p-3 sm:p-3.5 transition hover:border-[#EEDFC6]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B91C1C] truncate">Cảnh báo nguy cơ cao</span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-semibold tracking-tight text-[#B91C1C]">
              {isInitialLoading ? (
                <span aria-hidden="true" className="inline-block h-7 w-12 animate-pulse rounded bg-[#F3EFE6] align-middle" />
              ) : !summary && loadError ? '—' : <>{summary?.criticalCount ?? 0}{' '}<span className="text-xs font-semibold text-[#B91C1C]">sự vụ</span></>}
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#7D715E] truncate">
              {isInitialLoading ? <span aria-hidden="true" className="inline-block h-3.5 w-36 animate-pulse rounded bg-[#F3EFE6]" /> : !summary && loadError ? 'Chưa tải được số liệu' : <><span className="font-bold text-[#8A642C]">{summary?.suspiciousCount ?? 0}</span> sự vụ mức độ nghi vấn</>}
            </div>
          </div>
        </div>

        {/* Potential Saved Budget */}
        <div className="flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-[#EAE4D7] bg-white p-3 sm:p-3.5 transition hover:border-[#C59B58]/50">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E] truncate">Ngân sách được bảo vệ</span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-semibold tracking-tight text-[#8A642C]">
              {isInitialLoading ? (
                <span aria-hidden="true" className="inline-block h-7 w-16 animate-pulse rounded bg-[#F3EFE6] align-middle" />
              ) : !summary && loadError ? '—' : <>{((summary?.potentialSavedAmount ?? 0) / 1000).toLocaleString('vi-VN')}k{' '}<span className="text-xs font-semibold text-[#7D715E]">VND</span></>}
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#7D715E] truncate">{isInitialLoading ? 'Đang tổng hợp dữ liệu…' : !summary && loadError ? 'Chưa tải được số liệu' : 'Hoa hồng chờ đang được cách ly'}</div>
          </div>
        </div>

        {/* Healthy Traffic Ratio */}
        <div className="flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-[#EAE4D7] bg-white p-3 sm:p-3.5 transition hover:border-[#C59B58]/50">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E] truncate">Tỷ lệ traffic sạch</span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#059669]">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-semibold tracking-tight text-[#1A1612]">
              {isInitialLoading ? (
                <span aria-hidden="true" className="inline-block h-7 w-16 animate-pulse rounded bg-[#F3EFE6] align-middle" />
              ) : !summary && loadError ? '—' : summary && summary.totalScannedLinks > 0
                ? `${Math.round(((summary.cleanCount + summary.lowRiskCount) / summary.totalScannedLinks) * 100)}%`
                : '100%'}
            </div>
            <div className="mt-0.5 text-[11.5px] text-[#7D715E] truncate">{isInitialLoading ? 'Đang phân tích lưu lượng…' : !summary && loadError ? 'Chưa tải được số liệu' : 'Lưu lượng tự nhiên đạt chuẩn an toàn'}</div>
          </div>
        </div>
      </div>

      {/* Main Table & Filter Container */}
      <div className="sentinel-panel min-w-0 overflow-hidden rounded-xl border border-[#EAE4D7] bg-white">
        {/* Filter Navigation Bar */}
        <div className="sentinel-toolbar flex min-w-0 flex-col gap-2 border-b border-[#EAE4D7] bg-white p-3">
          <div className="sentinel-toolbar-main flex min-w-0 flex-wrap items-center justify-between gap-2">
            <div className="sentinel-tabs flex min-w-0 max-w-full flex-1 items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedTab('ALL')}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
                selectedTab === 'ALL'
                  ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8C6226]'
                  : 'border-transparent bg-white text-[#7D715E] hover:bg-[#FAF8F5]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Tất cả ({countLabel(summary?.incidents.length)})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('CRITICAL')}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
                selectedTab === 'CRITICAL'
                  ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
                  : 'border-transparent bg-white text-[#B91C1C] hover:bg-[#FEF2F2]'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              Nguy cơ cao ({countLabel(summary?.criticalCount)})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('SUSPICIOUS')}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
                selectedTab === 'SUSPICIOUS'
                  ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C]'
                  : 'border-transparent bg-white text-[#7D715E] hover:bg-[#FAF8F5]'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Nghi vấn ({countLabel(summary?.suspiciousCount)})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('LOW')}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
                selectedTab === 'LOW'
                  ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#5F5547]'
                  : 'border-transparent bg-white text-[#7D715E] hover:bg-[#FAF8F5]'
              }`}
            >
              <Info className="h-3.5 w-3.5" />
              Theo dõi ({countLabel(summary?.lowRiskCount)})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('FROZEN')}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
                selectedTab === 'FROZEN'
                  ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#5F5547]'
                  : 'border-transparent bg-white text-[#7D715E] hover:bg-[#FAF8F5]'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              Đã đóng băng ({countLabel(summary?.incidents.filter((i) => i.status === 'FROZEN').length)})
            </button>
            </div>

            <div className="sentinel-toolbar-actions flex shrink-0 items-center justify-end gap-1">
              <div className="sentinel-timeframe relative w-[156px] shrink-0">
                <Calendar className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[#8A642C]" />
                <Select
                  id="timeframe-select"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as any)}
                  aria-label="Chọn khoảng thời gian quét"
                  className="h-9 w-full pl-9 pr-1 text-xs"
                >
                  <option value="24h">24 giờ qua</option>
                  <option value="7d">7 ngày gần nhất</option>
                  <option value="30d">30 ngày qua</option>
                  <option value="all">Toàn thời gian</option>
                </Select>
              </div>

              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                aria-label={loading ? 'Đang quét lại toàn sàn' : 'Quét lại toàn sàn'}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-[#8C6226] transition hover:text-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40 disabled:cursor-wait disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Quét lại toàn sàn
              </button>
            </div>
          </div>

          <div className="sentinel-controls flex min-w-0 items-center justify-end gap-2">
            <div className="relative min-w-0">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D715E]" />
              <input
                id="search-incident-input"
                aria-label="Tìm sự vụ gian lận"
                type="text"
                placeholder="Tìm theo mã sự vụ, tên KOL, link..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#EAE4D7] bg-white pl-9 pr-3 text-xs text-[#1A1612] outline-none transition placeholder:text-[#7D715E] focus:border-[#C59B58]"
              />
            </div>

          </div>
        </div>

        {/* Table Content */}
        <div className="sentinel-table-scroll overflow-x-auto">
          <table className="sentinel-table w-full min-w-[1120px] table-fixed border-collapse text-left">
            <colgroup>
              <col style={{width:'12%'}} /><col style={{width:'16%'}} /><col style={{width:'16%'}} /><col style={{width:'10%'}} /><col style={{width:'16%'}} /><col style={{width:'10%'}} /><col style={{width:'10%'}} /><col style={{width:'10%'}} />
            </colgroup>
            <thead>
              <tr className="border-b border-[#EAE4D7] bg-[#FAF8F5] text-[10px] font-semibold uppercase tracking-[0.04em] text-[#7D715E]">
                <th className="px-4 py-4">Mã sự vụ</th>
                <th className="px-4 py-4">Đối tác KOL</th>
                <th className="px-4 py-4">Link & sản phẩm</th>
                <th className="px-3 py-4 text-center">Traffic & CR</th>
                <th className="px-4 py-4">Dấu hiệu bất thường</th>
                <th className="px-3 py-4 text-center">Điểm rủi ro</th>
                <th className="px-3 py-4 text-center">Trạng thái</th>
                <th className="px-4 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D7]/70 text-xs font-medium text-[#1A1612]">
              {loading && (
                <tr className="sentinel-state-row">
                  <td colSpan={8} className="py-14 text-center font-semibold text-[#7D715E]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C59B58] border-t-transparent" />
                      <span>Đang quét phân tích dữ liệu AI...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !summary && loadError && (
                <tr className="sentinel-state-row">
                  <td colSpan={8} className="py-14 text-center">
                    <div role="alert" className="flex flex-col items-center gap-2 text-[#7D715E]">
                      <AlertTriangle className="h-8 w-8 text-[#B88E4F]" />
                      <p className="font-semibold text-[#1A1612]">Không tải được dữ liệu quét</p>
                      <p className="text-xs">Kiểm tra kết nối rồi thử lại.</p>
                      <button
                        type="button"
                        onClick={loadData}
                        className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#8C6226] hover:bg-[#FBF5EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && summary && filteredIncidents.length === 0 && (
                <tr className="sentinel-state-row">
                  <td colSpan={8} className="py-14 text-center font-semibold text-[#7D715E]">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck className="h-10 w-10 stroke-1 text-[#059669]" />
                      <p className="font-bold text-[#1A1612]">Không tìm thấy sự vụ nghi vấn nào</p>
                      <p className="text-xs font-normal text-[#7D715E]">Toàn bộ lưu lượng trong phạm vi quét đều hợp lệ và an toàn.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    id={`incident-row-${inc.id}`}
                    className="sentinel-row group cursor-pointer transition-colors hover:bg-[#FBF5EB]/55"
                    onClick={() => setActiveIncident(inc)}
                  >
                    <td data-label="Mã sự vụ" className="px-3 py-3">
                      <div className="break-words font-mono text-[11px] font-bold text-[#1A1612]">
                        {inc.incidentCode}
                      </div>
                      <div className="mt-1 text-[10px] font-normal text-[#7D715E]">
                        {new Date(inc.detectedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>

                    <td data-label="Đối tác KOL" className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#EEDFC6] bg-[#FBF5EB] text-xs font-bold text-[#8A642C]">
                          {inc.collaboratorName?.[0]?.toUpperCase() || 'K'}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-[#1A1612]">
                            {inc.collaboratorName}
                          </div>
                          <div className="text-[10px] font-medium text-[#8A642C]">
                            Hạng {inc.collaboratorTier}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td data-label="Link & sản phẩm" className="px-3 py-3">
                      <div className="truncate font-semibold text-[#1A1612]">
                        {inc.productName}
                      </div>
                      <div className="truncate text-[10px] font-mono text-[#7D715E]">
                        Link: {inc.referralLinkCode}
                      </div>
                    </td>

                    <td data-label="Traffic & CR" className="px-2 py-3 text-center">
                      <div className="font-bold text-[#1A1612]">
                        {inc.totalClicks.toLocaleString('vi-VN')} <span className="text-[10px] font-normal text-[#7D715E]">clicks</span>
                      </div>
                      <div className="text-[10px] text-[#7D715E]">
                        {inc.totalOrders} đơn ({inc.conversionRate}%)
                      </div>
                    </td>

                    <td data-label="Dấu hiệu bất thường" className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {inc.anomalyTypes.length === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-[#EAE4D7] bg-[#F3EFE6] px-2 py-1 text-[10px] font-medium text-[#5F5547]">
                            <ShieldCheck className="h-3 w-3 text-[#059669]" />
                            Traffic sạch
                          </span>
                        ) : (
                          inc.anomalyTypes.map((type, idx) => {
                            const badge = getAnomalyLabel(type);
                            return (
                              <span
                                key={idx}
                                className={`rounded-md border px-2 py-1 text-[10px] font-medium ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>

                    <td data-label="Điểm rủi ro" className="px-2 py-3 text-center">
                      {getRiskBadge(inc.riskLevel, inc.riskScore)}
                    </td>

                    <td data-label="Trạng thái" className="px-2 py-3 text-center">
                      {inc.status === 'FROZEN' && (
                        <span className="inline-flex items-center justify-center gap-1 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[10px] font-semibold text-[#8A642C]">
                          <Lock className="h-3 w-3" /> Đóng băng
                        </span>
                      )}
                      {inc.status === 'DISMISSED' && (
                        <span className="inline-flex items-center justify-center gap-1 rounded-full border border-[#EAE4D7] bg-[#F3EFE6] px-2.5 py-1 text-[10px] font-semibold text-[#5F5547]">
                          <Info className="h-3 w-3" /> Đã bác bỏ
                        </span>
                      )}
                      {inc.status === 'RESOLVED' && (
                        <span className="inline-flex items-center justify-center gap-1 rounded-full border border-[#EAE4D7] bg-[#F3EFE6] px-2.5 py-1 text-[10px] font-semibold text-[#5F5547]">
                          <ShieldCheck className="h-3 w-3 text-[#059669]" /> Đã xử lý
                        </span>
                      )}
                      {inc.status === 'ACTIVE' && (
                        <span className="inline-flex items-center justify-center gap-1 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[10px] font-semibold text-[#8A642C]">
                          <Activity className="h-3 w-3" /> Theo dõi
                        </span>
                      )}
                    </td>

                    <td data-label="Thao tác" className="sentinel-action-cell px-2 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIncident(inc);
                        }}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-2 py-1.5 text-[11px] font-semibold text-[#8A642C] transition hover:border-[#C59B58] hover:bg-[#F3EFE6]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem AI</span>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail & AI Evidence Modal */}
      {activeIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#231D15]/55 p-4 backdrop-blur-sm"
          onClick={() => setActiveIncident(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white shadow-2xl duration-150 fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 border-b border-[#EAE4D7] bg-[#FBF5EB] p-5 sm:p-6">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border border-[#EEDFC6] bg-white px-2.5 py-1 font-mono text-xs font-semibold text-[#8A642C]">
                    {activeIncident.incidentCode}
                  </span>
                  {getRiskBadge(activeIncident.riskLevel, activeIncident.riskScore)}
                </div>
                <h3 className="text-lg font-bold text-[#1A1612]">
                  Báo Cáo Phân Tích Bất Thường AI
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveIncident(null)}
                aria-label="Đóng chi tiết sự vụ"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#7D715E] transition hover:bg-white hover:text-[#1A1612]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              {/* KOL Summary Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EAE4D7] bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#EEDFC6] bg-[#FBF5EB] text-base font-bold text-[#8A642C]">
                    {activeIncident.collaboratorName?.[0]?.toUpperCase() || 'K'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1A1612]">
                      {activeIncident.collaboratorName}
                    </div>
                    <div className="text-xs text-[#7D715E]">
                      {activeIncident.collaboratorEmail} • Hạng <strong>{activeIncident.collaboratorTier}</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-medium text-[#7D715E]">Hoa hồng ví chờ</div>
                  <div className="text-base font-bold text-[#8A642C]">
                    {activeIncident.pendingCommissionAmount.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              </div>

              {/* AI Reasoning Narrative */}
              <div className="space-y-2 rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-4 text-xs text-[#1A1612]">
                <div className="flex items-center gap-2 font-semibold text-[#8A642C]">
                  <Sparkles className="h-4 w-4 text-[#B88E4F]" />
                  <span>Kết Luận Phân Tích Của AI:</span>
                </div>
                <p className="font-medium leading-relaxed text-[#5F5547]">
                  {activeIncident.aiReasoning}
                </p>
              </div>

              {/* Multi-Factor Evidences */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#1A1612]">
                  <span>Bằng chứng & Chỉ số vi phạm chi tiết ({activeIncident.evidences.length})</span>
                  <span className="text-right text-[11px] font-normal text-[#7D715E]">Được ghi nhận từ máy chủ CDN & Redis</span>
                </div>

                <div className="space-y-2">
                  {activeIncident.evidences.map((ev, idx) => (
                    <div
                      key={idx}
                      className="space-y-1 rounded-xl border border-[#EAE4D7] bg-white p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-semibold text-[#1A1612]">
                          <Activity className="h-3.5 w-3.5 shrink-0 text-[#B88E4F]" /> {ev.metric}
                        </span>
                        <span
                          className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                            ev.severity === 'HIGH'
                              ? 'bg-[#FEF2F2] text-[#B91C1C]'
                              : ev.severity === 'MEDIUM'
                              ? 'bg-[#FBF5EB] text-[#8A642C]'
                              : 'bg-[#F3EFE6] text-[#5F5547]'
                          }`}
                        >
                          {ev.value}
                        </span>
                      </div>
                      <p className="text-[11px] leading-normal text-[#7D715E]">
                        {ev.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Form */}
              <div className="space-y-3 rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-4">
                <div className="text-xs font-semibold text-[#1A1612]">
                  Xử lý sự vụ & Biện pháp phòng vệ:
                </div>
                <input
                  type="text"
                  placeholder="Ghi chú lý do xử lý (tùy chọn)..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-white px-3.5 text-xs font-medium text-[#1A1612] outline-none placeholder:text-[#7D715E] focus:border-[#C59B58]"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    id="btn-freeze-commission"
                    type="button"
                    disabled={actionLoading || activeIncident.status === 'FROZEN'}
                    onClick={() => handleAction('FREEZE_COMMISSION')}
                    className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#DC2626] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Đóng băng hoa hồng</span>
                  </button>

                  <button
                    id="btn-pause-link"
                    type="button"
                    disabled={actionLoading || activeIncident.status === 'FROZEN'}
                    onClick={() => handleAction('PAUSE_LINK')}
                    className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#C59B58] px-3 py-2 text-xs font-semibold text-[#231D15] transition hover:bg-[#B88E4F] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Tạm ngưng link</span>
                  </button>

                  <button
                    id="btn-dismiss-incident"
                    type="button"
                    disabled={actionLoading || activeIncident.status === 'DISMISSED'}
                    onClick={() => handleAction('DISMISS')}
                    className="min-h-10 rounded-lg border border-[#EAE4D7] bg-white px-4 py-2 text-xs font-semibold text-[#5F5547] transition hover:border-[#C59B58] hover:bg-[#F3EFE6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>Bác bỏ (An toàn)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
