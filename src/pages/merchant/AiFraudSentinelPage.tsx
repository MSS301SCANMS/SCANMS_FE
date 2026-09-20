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
  Bot,
  Sparkles,
  Info,
  Shield,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  aiFraudService,
  type FraudIncident,
  type FraudScanSummary,
  type FraudRiskLevel,
  type FraudMitigationAction,
} from '../../services/ai-fraud.service';

export default function AiFraudSentinelPage() {
  const [summary, setSummary] = useState<FraudScanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'CRITICAL' | 'SUSPICIOUS' | 'LOW' | 'FROZEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIncident, setActiveIncident] = useState<FraudIncident | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('30d');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiFraudService.scanTraffic({ timeframe });
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể tải dữ liệu quét gian lận AI. Vui lòng thử lại.');
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            NGUY CƠ CAO ({score}đ)
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            NGHI VẤN ({score}đ)
          </span>
        );
      case 'LOW_RISK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300">
            <Info className="w-3.5 h-3.5 text-stone-500" />
            THEO DÕI ({score}đ)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            AN TOÀN ({score}đ)
          </span>
        );
    }
  };

  const getAnomalyLabel = (type: string) => {
    switch (type) {
      case 'ZOMBIE_TRAFFIC':
        return { label: 'Click ảo / Zombie Traffic', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'CLICK_BURST_BOT':
        return { label: 'Bot Spam Click', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'IP_CLUSTER':
        return { label: 'Tập trung IP Proxy', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'FLASH_CONVERSION':
        return { label: 'Checkout chớp nhoáng', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'CONVERSION_SPIKE':
        return { label: 'Đột biến chuyển đổi', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'SELF_REFERRAL':
        return { label: 'Tự mua qua link mình', color: 'bg-stone-100 text-stone-700 border-stone-300' };
      default:
        return { label: type, color: 'bg-stone-100 text-stone-700 border-stone-200' };
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-wider bg-white/20 backdrop-blur-xs text-amber-100 border border-white/20">
              <Bot className="w-4 h-4 text-amber-300" />
              <span>FR-31: AI FRAUD SENTINEL & TRAFFIC DEFENSE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Động Cơ AI Phát Hiện Gian Lận & Click Ảo
            </h1>
            <p className="text-amber-100/90 text-sm leading-relaxed">
              Hệ thống AI phân tích hành vi đa chiều (Multi-Dimensional Heuristic Anomaly Detection) tự động quét lưu lượng traffic, nhận diện click bot, zombie traffic và bảo vệ ngân sách hoa hồng gian hàng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              id="timeframe-select"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/20 border border-white/25 text-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all backdrop-blur-xs"
            >
              <option value="24h" className="text-stone-900">24 giờ qua</option>
              <option value="7d" className="text-stone-900">7 ngày gần nhất</option>
              <option value="30d" className="text-stone-900">30 ngày qua</option>
              <option value="all" className="text-stone-900">Toàn thời gian</option>
            </select>

            <button
              id="btn-rescan-traffic"
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2.5 bg-white text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Quét lại toàn sàn</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks Scanned */}
        <div className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold">Lưu Lượng Đã Quét</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            {(summary?.totalScannedClicks || 0).toLocaleString('vi-VN')}{' '}
            <span className="text-xs font-medium text-stone-500">clicks</span>
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <span>Trên <strong>{summary?.totalScannedLinks || 0}</strong> link tiếp thị</span>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="p-5 bg-gradient-to-br from-rose-50/70 to-white rounded-2xl border border-rose-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-bold">Cảnh Báo Nguy Cơ Cao</span>
            <div className="p-2 bg-rose-100 rounded-xl text-rose-700">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-900">
            {summary?.criticalCount || 0}{' '}
            <span className="text-xs font-medium text-rose-600">sự vụ</span>
          </div>
          <div className="text-[11px] text-rose-700 font-medium">
            + {summary?.suspiciousCount || 0} sự vụ mức độ nghi vấn
          </div>
        </div>

        {/* Potential Saved Budget */}
        <div className="p-5 bg-gradient-to-br from-amber-50/70 to-white rounded-2xl border border-amber-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-bold">Ngân Sách Được Bảo Vệ</span>
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950">
            {((summary?.potentialSavedAmount || 0) / 1000).toLocaleString('vi-VN')}k{' '}
            <span className="text-xs font-medium text-amber-700">VND</span>
          </div>
          <div className="text-[11px] text-amber-800 font-medium">
            Hoa hồng ví chờ đang được cách ly
          </div>
        </div>

        {/* Healthy Traffic Ratio */}
        <div className="p-5 bg-gradient-to-br from-emerald-50/70 to-white rounded-2xl border border-emerald-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold">Tỷ Lệ Traffic Sạch</span>
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950">
            {summary && summary.totalScannedLinks > 0
              ? `${Math.round(((summary.cleanCount + summary.lowRiskCount) / summary.totalScannedLinks) * 100)}%`
              : '100%'}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            Lưu lượng tự nhiên đạt chuẩn an toàn
          </div>
        </div>
      </div>

      {/* Main Table & Filter Container */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Filter Navigation Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/40">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTab === 'ALL'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              Tất cả ({summary?.incidents.length || 0})
            </button>
            <button
              onClick={() => setSelectedTab('CRITICAL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTab === 'CRITICAL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              🔥 Nguy cơ cao ({summary?.criticalCount || 0})
            </button>
            <button
              onClick={() => setSelectedTab('SUSPICIOUS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTab === 'SUSPICIOUS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              ⚠️ Nghi vấn ({summary?.suspiciousCount || 0})
            </button>
            <button
              onClick={() => setSelectedTab('LOW')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTab === 'LOW'
                  ? 'bg-stone-700 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              ℹ️ Theo dõi ({summary?.lowRiskCount || 0})
            </button>
            <button
              onClick={() => setSelectedTab('FROZEN')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTab === 'FROZEN'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              🔒 Đã đóng băng ({summary?.incidents.filter((i) => i.status === 'FROZEN').length || 0})
            </button>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="search-incident-input"
              type="text"
              placeholder="Tìm theo mã sự vụ, tên KOL, link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Mã Sự Vụ</th>
                <th className="py-3.5 px-4">Đối Tác KOL</th>
                <th className="py-3.5 px-4">Link & Sản Phẩm</th>
                <th className="py-3.5 px-4 text-center">Traffic & CR</th>
                <th className="py-3.5 px-4">Dấu Hiệu Bất Thường</th>
                <th className="py-3.5 px-4 text-center">Điểm Rủi Ro</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-800 font-medium">
              {loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 font-semibold">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      <span>Đang quét phân tích dữ liệu AI...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 font-semibold">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck className="w-10 h-10 text-emerald-500 stroke-1" />
                      <p className="text-stone-700 font-bold">Không tìm thấy sự vụ nghi vấn nào</p>
                      <p className="text-xs text-stone-400 font-normal">Toàn bộ lưu lượng trong phạm vi quét đều hợp lệ và an toàn.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    id={`incident-row-${inc.id}`}
                    className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                    onClick={() => setActiveIncident(inc)}
                  >
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-stone-900 font-mono text-xs">
                        {inc.incidentCode}
                      </div>
                      <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                        {new Date(inc.detectedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                          {inc.collaboratorName?.[0]?.toUpperCase() || 'K'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-stone-900 truncate max-w-[140px]">
                            {inc.collaboratorName}
                          </div>
                          <div className="text-[10px] text-amber-800 font-semibold">
                            Hạng {inc.collaboratorTier}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-stone-800 truncate max-w-[150px]">
                        {inc.productName}
                      </div>
                      <div className="text-[10px] font-mono text-stone-500 truncate">
                        Link: {inc.referralLinkCode}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="font-extrabold text-stone-900">
                        {inc.totalClicks.toLocaleString('vi-VN')} <span className="font-normal text-[10px] text-stone-500">clicks</span>
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {inc.totalOrders} đơn ({inc.conversionRate}%)
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {inc.anomalyTypes.length === 0 ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Traffic sạch
                          </span>
                        ) : (
                          inc.anomalyTypes.map((type, idx) => {
                            const badge = getAnomalyLabel(type);
                            return (
                              <span
                                key={idx}
                                className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {getRiskBadge(inc.riskLevel, inc.riskScore)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {inc.status === 'FROZEN' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          ĐÃ ĐÓNG BĂNG
                        </span>
                      )}
                      {inc.status === 'DISMISSED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                          ĐÃ BÁC BỎ
                        </span>
                      )}
                      {inc.status === 'RESOLVED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ĐÃ XỬ LÝ
                        </span>
                      )}
                      {inc.status === 'ACTIVE' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          ĐANG THEO DÕI
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIncident(inc);
                        }}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
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
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveIncident(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-stone-50 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-lg border border-amber-300">
                    {activeIncident.incidentCode}
                  </span>
                  {getRiskBadge(activeIncident.riskLevel, activeIncident.riskScore)}
                </div>
                <h3 className="text-lg font-black text-stone-900">
                  Báo Cáo Phân Tích Bất Thường AI
                </h3>
              </div>
              <button
                onClick={() => setActiveIncident(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-200/80 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* KOL Summary Card */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {activeIncident.collaboratorName?.[0]?.toUpperCase() || 'K'}
                  </div>
                  <div>
                    <div className="font-extrabold text-stone-900 text-sm">
                      {activeIncident.collaboratorName}
                    </div>
                    <div className="text-xs text-stone-500">
                      {activeIncident.collaboratorEmail} • Hạng <strong>{activeIncident.collaboratorTier}</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-stone-500 font-semibold">Hoa hồng ví chờ</div>
                  <div className="text-base font-black text-amber-900">
                    {activeIncident.pendingCommissionAmount.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              </div>

              {/* AI Reasoning Narrative */}
              <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50/60 to-amber-100/40 rounded-2xl border border-amber-200 text-xs text-stone-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Kết Luận Phân Tích Của AI:</span>
                </div>
                <p className="leading-relaxed text-stone-700 font-medium">
                  {activeIncident.aiReasoning}
                </p>
              </div>

              {/* Multi-Factor Evidences */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-stone-900 flex items-center justify-between">
                  <span>Bằng chứng & Chỉ số vi phạm chi tiết ({activeIncident.evidences.length})</span>
                  <span className="text-[11px] text-stone-500 font-normal">Được ghi nhận từ máy chủ CDN & Redis</span>
                </div>

                <div className="space-y-2">
                  {activeIncident.evidences.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 text-xs">
                          📌 {ev.metric}
                        </span>
                        <span
                          className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                            ev.severity === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : ev.severity === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {ev.value}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-normal">
                        {ev.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Form */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="text-xs font-bold text-stone-900">
                  Xử lý sự vụ & Biện pháp phòng vệ:
                </div>
                <input
                  type="text"
                  placeholder="Ghi chú lý do xử lý (tùy chọn)..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500"
                />

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    id="btn-freeze-commission"
                    disabled={actionLoading || activeIncident.status === 'FROZEN'}
                    onClick={() => handleAction('FREEZE_COMMISSION')}
                    className="flex-1 py-2.5 px-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Đóng băng hoa hồng</span>
                  </button>

                  <button
                    id="btn-pause-link"
                    disabled={actionLoading || activeIncident.status === 'FROZEN'}
                    onClick={() => handleAction('PAUSE_LINK')}
                    className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Tạm ngưng link</span>
                  </button>

                  <button
                    id="btn-dismiss-incident"
                    disabled={actionLoading || activeIncident.status === 'DISMISSED'}
                    onClick={() => handleAction('DISMISS')}
                    className="py-2.5 px-4 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
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
