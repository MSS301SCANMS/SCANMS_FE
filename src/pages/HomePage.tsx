import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Calendar,
  MousePointerClick,
  ShoppingBag,
  Target,
  Wallet,
  BarChart3,
  Crown,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { tierService, type TierStatus } from '../services/tier.service';
import { walletService, type WalletSummary, type LedgerHistory } from '../services/wallet.service';
import {
  analyticsService,
  type DashboardOverviewResponse,
  type TimeSeriesPoint,
} from '../services/analytics.service';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function HomePage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('7');
  const [metric, setMetric] = useState<'clicks' | 'orders' | 'revenue' | 'commission'>('clicks');
  const [loading, setLoading] = useState(true);

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [ledger, setLedger] = useState<LedgerHistory | null>(null);
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const days = Number(period) || 7;
      const [walletData, ledgerData, overviewData, seriesData, tierData] = await Promise.all([
        walletService.getMyWallet().catch(() => null),
        walletService.getMyLedger(1).catch(() => null),
        analyticsService.getRealtimeOverview({ days }).catch(() => null),
        analyticsService.getTimeSeries({ days, interval: 'day' }).catch(() => []),
        tierService.getMyTierStatus().catch(() => null),
      ]);

      if (walletData) setWallet(walletData);
      if (ledgerData) setLedger(ledgerData);
      if (overviewData) setOverview(overviewData);
      if (seriesData) setTimeSeries(seriesData);
      if (tierData) setTierStatus(tierData);
    } catch (err) {
      console.error('Lỗi tải dữ liệu Dashboard KOL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const metrics = overview?.metrics;
  const availBal = Number(wallet?.availableBalance || 0);
  const pendingBal = Number(wallet?.pendingBalance || 0);

  // Compute max value for chart scaling based on selected metric
  const getMetricValue = (point: TimeSeriesPoint) => {
    if (metric === 'clicks') return point.clicks;
    if (metric === 'orders') return point.orders;
    if (metric === 'revenue') return point.revenue;
    return point.commission;
  };

  const maxValue = Math.max(...timeSeries.map(getMetricValue), 1);

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] tracking-tight m-0">
            Tổng quan CTV / KOL
          </h1>
          <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
            Theo dõi lưu lượng tiếp thị, kết quả đơn hàng và hoa hồng bán mỹ phẩm thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadData}
          >
            Làm mới
          </Button>
          <Button
            variant="gold"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/collaborator/referral-links')}
          >
            Tạo link tiếp thị
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border border-[#EAE4D7]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#7D715E] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#B88E4F]" />
                Khoảng thời gian phân tích
              </label>
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-[#1A1612] appearance-none outline-none cursor-pointer hover:bg-[#EAE4D7] transition"
                >
                  <option value="7">7 ngày gần nhất</option>
                  <option value="30">30 ngày gần nhất</option>
                  <option value="90">90 ngày gần nhất</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="text-xs font-semibold text-[#7D715E]">
            {overview?.period ? (
              <span>
                Dữ liệu: {new Date(overview.period.startDate).toLocaleDateString('vi-VN')} – {new Date(overview.period.endDate).toLocaleDateString('vi-VN')}
              </span>
            ) : (
              <span>Dữ liệu thực tế từ ví &amp; giao dịch sàn</span>
            )}
          </div>
        </div>
      </Card>

      {/* Real Wallet Balance Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#1A1612] p-6 sm:p-7 shadow-2xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs sm:text-sm font-semibold text-[#7D715E] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#B88E4F]" />
              Số dư khả dụng trong ví • Sẵn sàng rút
            </span>
            <strong className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1612] mt-1">
              {availBal.toLocaleString('vi-VN')}{' '}
              <span className="underline decoration-2 decoration-[#B88E4F]">₫</span>
            </strong>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#7D715E] mt-2">
              <span>Chờ đối soát Escrow: <strong className="text-[#1A1612]">{pendingBal.toLocaleString('vi-VN')} ₫</strong></span>
              <span>•</span>
              <span>
                Trạng thái KYC: <strong className={wallet?.kycStatus === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'}>
                  {wallet?.kycStatus === 'VERIFIED' ? 'Đã xác thực' : 'Chưa KYC'}
                </strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/collaborator/wallet')}
            className="px-5 py-2.5 bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-2"
          >
            <span>Quản lý ví &amp; Rút tiền</span>
            <ArrowUpRight className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full border-24 border-[#EEDFC6]/40 pointer-events-none" />
        <div className="absolute right-4 top-2 w-52 h-52 rounded-full border-16 border-[#EEDFC6]/50 pointer-events-none" />
      </div>

      {/* 4 Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lượt click tiếp thị */}
        <Card className="p-4 flex flex-col justify-between gap-3 bg-white">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-xl bg-[#EBF3FE] text-[#2563EB] flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
            {metrics?.growthClicks !== undefined && (
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                metrics.growthClicks >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}>
                <TrendingUp className="w-3 h-3" /> {metrics.growthClicks >= 0 ? '+' : ''}{metrics.growthClicks.toFixed(1)}%
              </span>
            )}
          </div>
          <div>
            <span className="text-xs text-[#7D715E] font-medium block">Lượt nhấp tiếp thị (Traffic)</span>
            <strong className="text-2xl font-extrabold text-[#1A1612] tracking-tight block mt-0.5">
              {(metrics?.totalClicks || 0).toLocaleString('vi-VN')}
            </strong>
          </div>
          <span className="text-[11px] text-[#7D715E]">
            {metrics?.activeReferralLinks || 0} link tiếp thị đang phát sinh lượt xem
          </span>
        </Card>

        {/* Đơn hàng thành công */}
        <Card className="p-4 flex flex-col justify-between gap-3 bg-white">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-xl bg-[#FEF5E7] text-[#D97706] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            {metrics?.growthOrders !== undefined && (
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                metrics.growthOrders >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}>
                <TrendingUp className="w-3 h-3" /> {metrics.growthOrders >= 0 ? '+' : ''}{metrics.growthOrders.toFixed(1)}%
              </span>
            )}
          </div>
          <div>
            <span className="text-xs text-[#7D715E] font-medium block">Đơn chốt thành công</span>
            <strong className="text-2xl font-extrabold text-[#1A1612] tracking-tight block mt-0.5">
              {metrics?.completedOrders || 0} <span className="text-sm font-semibold text-[#7D715E]">/ {metrics?.totalOrders || 0} đơn</span>
            </strong>
          </div>
          <span className="text-[11px] text-[#7D715E]">
            Chu kỳ {period} ngày gần nhất
          </span>
        </Card>

        {/* Tỷ lệ chuyển đổi */}
        <Card className="p-4 flex flex-col justify-between gap-3 bg-white">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-xl bg-[#F3EBFD] text-[#7C3AED] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
              CR%
            </span>
          </div>
          <div>
            <span className="text-xs text-[#7D715E] font-medium block">Tỷ lệ chuyển đổi (Conversion)</span>
            <strong className="text-2xl font-extrabold text-[#1A1612] tracking-tight block mt-0.5">
              {(metrics?.conversionRate || 0).toFixed(2)}%
            </strong>
          </div>
          <span className="text-[11px] text-[#7D715E]">
            Trung bình đơn: {(metrics?.averageOrderValue || 0).toLocaleString('vi-VN')} ₫
          </span>
        </Card>

        {/* Doanh thu GMV & Hoa hồng */}
        <Card className="p-4 flex flex-col justify-between gap-3 bg-white">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-xl bg-[#EAF8F1] text-[#059669] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            {metrics?.growthRevenue !== undefined && (
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                metrics.growthRevenue >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}>
                <TrendingUp className="w-3 h-3" /> {metrics.growthRevenue >= 0 ? '+' : ''}{metrics.growthRevenue.toFixed(1)}%
              </span>
            )}
          </div>
          <div>
            <span className="text-xs text-[#7D715E] font-medium block">Doanh số phát sinh (GMV)</span>
            <strong className="text-2xl font-extrabold text-[#1A1612] tracking-tight block mt-0.5">
              {(metrics?.grossRevenue || 0).toLocaleString('vi-VN')} ₫
            </strong>
          </div>
          <span className="text-[11px] text-[#7D715E]">
            Hoa hồng: <strong className="text-[#B88E4F]">{(metrics?.totalCommission || 0).toLocaleString('vi-VN')} ₫</strong>
          </span>
        </Card>
      </div>

      {/* Real Chart and Commission Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Biểu đồ diễn biến */}
        <Card className="lg:col-span-8 p-5 sm:p-6 flex flex-col gap-5 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1A1612] m-0">Diễn biến theo ngày</h2>
                <p className="text-xs text-[#7D715E] m-0 mt-0.5">Dữ liệu thực tế tổng hợp theo chu kỳ {period} ngày</p>
              </div>
            </div>

            <div className="relative">
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as any)}
                aria-label="Chọn chỉ số biểu đồ"
                className="bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-[#1A1612] appearance-none outline-none cursor-pointer hover:bg-[#EAE4D7] transition"
              >
                <option value="clicks">Lượt nhấp (Traffic)</option>
                <option value="orders">Đơn hàng (Orders)</option>
                <option value="revenue">Doanh thu GMV (₫)</option>
                <option value="commission">Hoa hồng ghi nhận (₫)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {timeSeries.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-xs text-[#7D715E]">
              <BarChart3 className="w-8 h-8 text-[#EAE4D7] mb-2" />
              Chưa có dữ liệu giao dịch trong chu kỳ được chọn.
            </div>
          ) : (
            <div className="flex items-end justify-between h-48 pt-4 pb-2 border-b border-[#EAE4D7] gap-2">
              {timeSeries.map((d, idx) => {
                const val = getMetricValue(d);
                const heightPct = maxValue > 0 ? Math.max(6, Math.round((val / maxValue) * 100)) : 6;
                const formattedVal =
                  metric === 'revenue' || metric === 'commission'
                    ? `${val.toLocaleString('vi-VN')} ₫`
                    : val.toString();

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-1.5 flex-1 group"
                    title={`${d.label}: ${formattedVal}`}
                  >
                    <span className="text-[10px] font-bold text-[#A49B8B] group-hover:text-[#1A1612] transition truncate max-w-[50px]">
                      {val > 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[36px] rounded-t-lg bg-[#EEDFC6] group-hover:bg-[#B88E4F] transition-all"
                    />
                    <span className="text-xs font-bold text-[#7D715E] transition group-hover:text-[#B88E4F]">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Lịch sử hoa hồng từ Ledger */}
        <Card className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between gap-5 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1A1612] m-0">Hoa hồng gần đây</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/collaborator/wallet')}
            >
              Xem sổ cái ví
            </Button>
          </div>

          <div className="flex flex-col gap-2.5">
            {!ledger?.entries || ledger.entries.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7D715E]">
                Chưa có phát sinh hoa hồng nào. Khi khách mua qua link tiếp thị của bạn, tiền hoa hồng sẽ hiển thị tại đây!
              </div>
            ) : (
              ledger.entries.slice(0, 4).map((entry) => {
                const isPositive = entry.balanceBucket === 'AVAILABLE' || entry.transactionType.includes('COMMISSION');
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]"
                  >
                    <div>
                      <strong className="text-xs font-bold text-[#1A1612] block">
                        {entry.transactionType === 'COMMISSION_PENDING'
                          ? 'Hoa hồng chờ duyệt'
                          : entry.transactionType === 'COMMISSION_APPROVED'
                          ? 'Hoa hồng khả dụng'
                          : entry.transactionType === 'PAYOUT_WITHDRAW'
                          ? 'Rút tiền về ngân hàng'
                          : entry.transactionType}
                      </strong>
                      <span className="text-[11px] text-[#7D715E]">
                        {new Date(entry.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <strong
                      className={`text-sm font-extrabold ${
                        isPositive ? 'text-[#B88E4F]' : 'text-[#7D715E]'
                      }`}
                    >
                      {isPositive ? '+' : '-'}
                      {Math.abs(Number(entry.amount)).toLocaleString('vi-VN')} ₫
                    </strong>
                  </div>
                );
              })
            )}
          </div>

          {/* Cấp bậc thực tế */}
          <div className="p-3.5 bg-[#FBF5EB] rounded-xl border border-[#EEDFC6] flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#B88E4F] shrink-0" />
              <strong className="text-xs font-bold text-[#1A1612]">
                {tierStatus?.currentTier
                  ? `Hạng ${tierStatus.currentTier.name} (+${tierStatus.currentTier.extraBonusPercentage || 0}% Thưởng)`
                  : 'Cấp bậc khởi đầu (Hạng Đồng)'}
              </strong>
            </div>
            <p className="text-[11px] text-[#7D715E] leading-relaxed m-0">
              {tierStatus?.nextTier ? (
                <>
                  Bạn cần thêm{' '}
                  <strong className="text-[#B88E4F]">
                    {Number(tierStatus.revenueNeeded || 0).toLocaleString('vi-VN')} ₫
                  </strong>{' '}
                  doanh số tháng này để thăng hạng {tierStatus.nextTier.name}!
                </>
              ) : (
                'Tích cực chia sẻ link tiếp thị để gia tăng hoa hồng và mở khóa đặc quyền tài khoản!'
              )}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
