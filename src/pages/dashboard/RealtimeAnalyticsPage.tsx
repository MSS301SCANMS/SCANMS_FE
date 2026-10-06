import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  ShoppingBag,
  Percent,
  Coins,
  DollarSign,
  Calendar,
  RefreshCw,
  Crown,
  Share2,
  Package,
  Layers,
  Download,
  Flame,
  Radio,
} from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { analyticsService } from '../../services/analytics.service';
import type {
  DashboardOverviewResponse,
  TimeSeriesPoint,
  TopProductItem,
  TopChannelItem,
  FunnelResponse,
  CampaignPerformanceItem,
} from '../../services/analytics.service';
import { authService } from '../../services/auth.service';

export const RealtimeAnalyticsPage: React.FC = () => {
  const user = authService.getCurrentUser();
  const [range, setRange] = useState<string>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(false);
  const [activeChartTab, setActiveChartTab] = useState<'traffic' | 'financial'>('traffic');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());


  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [topChannels, setTopChannels] = useState<TopChannelItem[]>([]);
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignPerformanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  const fetchData = useCallback(async (showIndicator = false) => {
    try {
      if (showIndicator) setIsRefreshing(true);
      setError(null);

      const params: any = { range };
      if (range === 'custom' && customStartDate && customEndDate) {
        params.startDate = new Date(customStartDate).toISOString();
        params.endDate = new Date(customEndDate).toISOString();
      }

      const [ovData, tsData, prodData, chanData, funData, campData] = await Promise.all([
        analyticsService.getRealtimeOverview(params).catch(() => null),
        analyticsService.getTimeSeries(params).catch(() => []),
        analyticsService.getTopProducts({ ...params, limit: 5 }).catch(() => []),
        analyticsService.getTopChannels({ ...params, limit: 6 }).catch(() => []),
        analyticsService.getConversionFunnel(params).catch(() => null),
        analyticsService.getCampaignPerformance(params).catch(() => []),
      ]);

      setOverview(ovData);
      setTimeSeries(Array.isArray(tsData) ? tsData : []);
      setTopProducts(Array.isArray(prodData) ? prodData : []);
      setTopChannels(Array.isArray(chanData) ? chanData : []);
      setFunnel(funData);
      setCampaigns(Array.isArray(campData) ? campData : []);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to load realtime analytics:', err);
      setError(err?.response?.data?.message || 'Không thể tải dữ liệu phân tích thời gian thực.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [range, customStartDate, customEndDate]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);


  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchData(true);
    }, autoRefreshInterval * 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, fetchData]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const handleApplyCustomRange = () => {
    if (customStartDate && customEndDate) {
      setRange('custom');
      setIsCustomOpen(false);
      fetchData();
    }
  };


  const handleExportCsv = () => {
    if (!timeSeries.length) return;
    const headers = ['Thời gian', 'Lượt Click', 'Số Đơn Hàng', 'Doanh Thu (VNĐ)', 'Hoa Hồng (VNĐ)', 'CR (%)'];
    const rows = timeSeries.map(p => [
      p.label || p.date || '',
      p.clicks,
      p.orders,
      p.revenue,
      p.commission,
      p.conversionRate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SCANMS_Analytics_${range}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const maxProductRevenue = useMemo(() => {
    if (!topProducts.length) return 1;
    return Math.max(...topProducts.map(p => p.grossRevenue), 1);
  }, [topProducts]);

  return (
    <div className="space-y-4 pb-8">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* 1. Header Toolbar & Quick Filters */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EAE4D7] bg-white p-3 shadow-xs sm:p-3.5">
        {/* Action controls */}
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 xl:flex-nowrap">
          {/* Range tabs */}
          <div className="flex h-10 shrink-0 items-center rounded-xl border border-[#EAE4D7] bg-[#F3EFE6] p-1 text-xs font-semibold">
            {[
              { key: 'today', label: 'Hôm nay' },
              { key: '7d', label: '7 ngày' },
              { key: '30d', label: '30 ngày' },
              { key: 'this_month', label: 'Tháng này' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setRange(tab.key);
                  setIsCustomOpen(false);
                }}
                className={`whitespace-nowrap rounded-lg px-2.5 py-2 transition-all cursor-pointer ${
                  range === tab.key
                    ? 'bg-[#C59B58] text-[#231D15] font-bold shadow-xs'
                    : 'text-[#7D715E] hover:text-[#1A1612] hover:bg-[#EAE4D7]'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => setIsCustomOpen(!isCustomOpen)}
              className={`flex items-center space-x-1 whitespace-nowrap rounded-lg px-2.5 py-2 transition-all cursor-pointer ${
                range === 'custom'
                  ? 'bg-[#C59B58] text-[#231D15] font-bold shadow-xs'
                  : 'text-[#7D715E] hover:text-[#1A1612] hover:bg-[#EAE4D7]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Tùy chỉnh</span>
            </button>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {autoRefreshInterval > 0 && (
              <span className="inline-flex h-10 shrink-0 items-center rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 text-[11px] font-semibold text-[#8C6226]">
                <Radio className="mr-1 h-3 w-3 animate-pulse" />
                Live ({autoRefreshInterval}s)
              </span>
            )}

            {/* Auto refresh dropdown */}
            <Select
              aria-label="Tần suất tự động làm mới"
              value={String(autoRefreshInterval)}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="h-10 w-36 shrink-0 text-xs font-medium"
            >
              <option value="0">Làm mới: Tắt</option>
              <option value="15">Làm mới: 15s</option>
              <option value="30">Làm mới: 30s</option>
              <option value="60">Làm mới: 60s</option>
            </Select>

            {/* Manual refresh button */}
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EAE4D7] bg-white text-[#1A1612] transition-all hover:bg-[#F3EFE6] active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
              title="Làm mới dữ liệu ngay"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#B88E4F]' : ''}`} />
            </button>

            {/* Export CSV button */}
            <button
              onClick={handleExportCsv}
              className="inline-flex h-10 shrink-0 items-center space-x-1.5 whitespace-nowrap rounded-xl border border-[#EAE4D7] bg-[#F3EFE6] px-3 text-xs font-semibold text-[#1A1612] transition-all hover:bg-[#EAE4D7] active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Popover */}
      {isCustomOpen && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#EAE4D7] bg-white p-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#7D715E]">Từ ngày:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-[#FAF8F5] border border-[#EAE4D7] text-[#1A1612] px-3 py-1.5 rounded-xl text-xs focus:border-[#C59B58] outline-none"
            />
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#7D715E]">Đến ngày:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-[#FAF8F5] border border-[#EAE4D7] text-[#1A1612] px-3 py-1.5 rounded-xl text-xs focus:border-[#C59B58] outline-none"
            />
          </div>
          <button
            onClick={handleApplyCustomRange}
            disabled={!customStartDate || !customEndDate}
              className="rounded-lg bg-[#C59B58] px-3.5 py-2 text-xs font-semibold text-[#231D15] shadow-xs transition-colors hover:bg-[#B88E4F] cursor-pointer disabled:opacity-50"
          >
            Áp dụng khoảng ngày
          </button>
        </div>
      )}

      {/* 2. Top Summary KPI Cards (5 metrics) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Clicks */}
        <div className="group space-y-2 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-xs transition-colors hover:border-[#C59B58]/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#7D715E]">Lượt Click</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <MousePointerClick className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-[#1A1612]">
              {formatNumber(overview?.metrics?.totalClicks ?? 0)}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
              {(overview?.metrics?.growthClicks ?? 0) >= 0 ? (
                <span className="flex items-center text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  +{overview?.metrics?.growthClicks}%
                </span>
              ) : (
                <span className="flex items-center text-rose-600">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  {overview?.metrics?.growthClicks}%
                </span>
              )}
              <span className="text-[#7D715E] text-[11px]">so với kỳ trước</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="group space-y-2 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-xs transition-colors hover:border-[#C59B58]/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#7D715E]">Đơn Hàng</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-[#1A1612]">
              {formatNumber(overview?.metrics?.totalOrders ?? 0)}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
              {(overview?.metrics?.growthOrders ?? 0) >= 0 ? (
                <span className="flex items-center text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  +{overview?.metrics?.growthOrders}%
                </span>
              ) : (
                <span className="flex items-center text-rose-600">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  {overview?.metrics?.growthOrders}%
                </span>
              )}
              <span className="text-[#7D715E] text-[11px]">({overview?.metrics?.completedOrders ?? 0} thành công)</span>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="group space-y-2 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-xs transition-colors hover:border-[#C59B58]/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#7D715E]">Tỷ Lệ Chốt (CR%)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-[#1A1612]">
              {(overview?.metrics?.conversionRate ?? 0).toFixed(2)}%
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
              {(overview?.metrics?.growthConversionRate ?? 0) >= 0 ? (
                <span className="flex items-center text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  +{overview?.metrics?.growthConversionRate}%
                </span>
              ) : (
                <span className="flex items-center text-rose-600">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  {overview?.metrics?.growthConversionRate}%
                </span>
              )}
              <span className="text-[#7D715E] text-[11px]">AOV: {formatNumber(overview?.metrics?.averageOrderValue ?? 0)}₫</span>
            </div>
          </div>
        </div>

        {/* Gross Revenue */}
        <div className="group space-y-2 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-xs transition-colors hover:border-[#C59B58]/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#7D715E]">Doanh Thu (GMV)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="truncate text-lg font-bold tracking-tight text-[#8C6226]">
              {formatCurrency(overview?.metrics?.grossRevenue ?? 0)}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
              {(overview?.metrics?.growthRevenue ?? 0) >= 0 ? (
                <span className="flex items-center text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  +{overview?.metrics?.growthRevenue}%
                </span>
              ) : (
                <span className="flex items-center text-rose-600">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  {overview?.metrics?.growthRevenue}%
                </span>
              )}
              <span className="text-[#7D715E] text-[11px]">so với kỳ trước</span>
            </div>
          </div>
        </div>

        {/* Commission */}
        <div className="group space-y-2 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-xs transition-colors hover:border-[#C59B58]/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#7D715E]">
              {user?.role === 'SHOP_MANAGER' ? 'Hoa Hồng Chi Trả' : 'Hoa Hồng Thực Nhận'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="truncate text-lg font-bold tracking-tight text-[#8C6226]">
              {formatCurrency(overview?.metrics?.totalCommission ?? 0)}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
              {(overview?.metrics?.growthCommission ?? 0) >= 0 ? (
                <span className="flex items-center text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  +{overview?.metrics?.growthCommission}%
                </span>
              ) : (
                <span className="flex items-center text-rose-600">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  {overview?.metrics?.growthCommission}%
                </span>
              )}
              <span className="text-[#7D715E] text-[11px] truncate">
                {(overview?.metrics?.activeReferralLinks ?? 0)} link hoạt động
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Chart & Conversion Funnel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Performance Time-series Area/Bar Chart */}
        <div className="space-y-4 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-xs lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-[#1A1612]">
                <Flame className="h-4 w-4 text-[#B88E4F]" />
                <span>Biểu Đồ Diễn Biến Hiệu Suất Theo Thời Gian</span>
              </h2>
              <p className="text-xs text-[#7D715E] mt-0.5">
                {range === 'today' ? 'Thống kê chi tiết theo 24 khung giờ trong ngày' : 'Thống kê xu hướng biến động theo ngày'}
              </p>
            </div>

            {/* Sub-tabs for switching metrics displayed in Chart */}
            <div className="flex items-center rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] p-1 text-xs font-semibold">
              <button
                onClick={() => setActiveChartTab('traffic')}
                className={`rounded-md px-2.5 py-1.5 transition-colors cursor-pointer ${
                  activeChartTab === 'traffic'
                    ? 'bg-[#C59B58] text-[#231D15] font-semibold shadow-xs'
                    : 'text-[#7D715E] hover:bg-white hover:text-[#1A1612]'
                }`}
              >
                Traffic & Đơn Hàng
              </button>
              <button
                onClick={() => setActiveChartTab('financial')}
                className={`rounded-md px-2.5 py-1.5 transition-colors cursor-pointer ${
                  activeChartTab === 'financial'
                    ? 'bg-[#C59B58] text-[#231D15] font-semibold shadow-xs'
                    : 'text-[#7D715E] hover:bg-white hover:text-[#1A1612]'
                }`}
              >
                Doanh Thu & Hoa Hồng
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-64 w-full sm:h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[#7D715E] text-xs animate-pulse">
                Đang nạp dữ liệu biểu đồ thời gian thực...
              </div>
            ) : timeSeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#7D715E] text-xs">
                Chưa có dữ liệu phát sinh trong khoảng thời gian này.
              </div>
            ) : activeChartTab === 'traffic' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C59B58" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#C59B58" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8C6226" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#8C6226" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAE4D7" />
                  <XAxis dataKey="label" stroke="#7D715E" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#7D715E" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#EAE4D7',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#1A1612',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    name="Lượt Clicks"
                    stroke="#C59B58"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#clicksGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    name="Số Đơn Hàng"
                    stroke="#8C6226"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#ordersGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EAE4D7" />
                  <XAxis dataKey="label" stroke="#7D715E" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#7D715E" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#EAE4D7',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#1A1612',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="revenue" name="Doanh Thu (GMV)" fill="#C59B58" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="commission" name="Hoa Hồng" fill="#8C6226" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="flex flex-col justify-between space-y-4 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-xs">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-[#1A1612]">
              <Layers className="h-4 w-4 text-[#B88E4F]" />
              <span>Phễu Chuyển Đổi (Funnel)</span>
            </h2>
            <p className="text-xs text-[#7D715E] mt-0.5">
              Đo lường độ thất thoát traffic từ lúc click link tới khi đơn giao hoàn tất.
            </p>
          </div>

          {/* Stages list */}
          <div className="my-auto space-y-3">
            {funnel?.stages?.map((st, idx) => (
              <div key={st.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1A1612]">
                    {idx + 1}. {st.label}
                  </span>
                  <span className="font-extrabold text-[#B88E4F]">{formatNumber(st.count)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full border border-[#EAE4D7] bg-[#FAF8F5] p-0.5">
                  <div
                    className="h-full rounded-full bg-[#C59B58] transition-[width] duration-500"
                    style={{ width: `${Math.max(st.percentage, 4)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#7D715E] font-medium">
                  <span>Tỷ lệ tầng: {st.percentage}%</span>
                </div>
              </div>
            )) || (
              <div className="text-xs text-[#7D715E] text-center py-8">Chưa có dữ liệu phễu chuyển đổi.</div>
            )}
          </div>

          {/* Aggregate Funnel Summary Footer */}
          <div className="space-y-2 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#7D715E]">Tỷ lệ chuyển đổi tổng (Click ➔ Đơn):</span>
              <span className="font-bold text-[#8C6226]">{funnel?.conversionRate ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#7D715E]">Tỷ lệ hoàn thành đơn (Fulfillment):</span>
              <span className="font-bold text-[#8C6226]">{funnel?.fulfillmentRate ?? 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top Performing Products & Marketing Channels Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Top 5 Products by Revenue */}
        <div className="space-y-4 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-[#1A1612]">
                <Package className="h-4 w-4 text-[#B88E4F]" />
                <span>Top Sản Phẩm Mang Lại Doanh Số Cao Nhất</span>
              </h3>
              <p className="text-xs text-[#7D715E] mt-0.5">Xếp hạng theo tổng giá trị đơn hàng thực tế phát sinh.</p>
            </div>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-xs text-[#7D715E] py-8 text-center">Chưa có dữ liệu sản phẩm bán ra.</div>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p) => {
                const percent = Math.round((p.grossRevenue / maxProductRevenue) * 100);
                return (
                  <div key={p.productId} className="space-y-2 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                          p.rank === 1 ? 'bg-[#C59B58] text-[#231D15]' :
                          p.rank === 2 ? 'bg-[#EAE4D7] text-[#B88E4F] font-bold' :
                          p.rank === 3 ? 'bg-[#F3EFE6] text-[#7D715E] font-bold' :
                          'bg-white text-[#7D715E] border border-[#EAE4D7]'
                        }`}>
                          {p.rank}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#1A1612] truncate">{p.title}</h4>
                          <p className="text-xs text-[#7D715E]">SKU: {p.sku} • {p.storeName || 'Gian Hàng'}</p>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="text-sm font-black text-[#B88E4F]">{formatCurrency(p.grossRevenue)}</p>
                        <p className="text-xs text-[#7D715E]">{p.ordersCount} đơn ({p.quantitySold} sản phẩm)</p>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-[#EAE4D7] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C59B58]"
                        style={{ width: `${Math.max(percent, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Marketing Channels Traffic Breakdown */}
        <div className="space-y-4 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-xs">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-[#1A1612]">
              <Share2 className="h-4 w-4 text-[#B88E4F]" />
              <span>Phân Bổ Kênh Tiếp Thị</span>
            </h3>
            <p className="text-xs text-[#7D715E] mt-0.5">Tỷ trọng lưu lượng và đơn hàng theo từng mạng xã hội.</p>
          </div>

          {topChannels.length === 0 ? (
            <div className="text-xs text-[#7D715E] py-8 text-center">Chưa có dữ liệu kênh tiếp thị.</div>
          ) : (
            <div className="space-y-2.5">
              {topChannels.map((c) => (
                <div key={c.channel} className="space-y-2 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1A1612]">{c.channel}</span>
                    <span className="font-extrabold text-[#B88E4F]">{c.trafficSharePercent}% traffic</span>
                  </div>
                  <div className="w-full h-2 bg-[#EAE4D7] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#C59B58]"
                      style={{ width: `${Math.max(c.trafficSharePercent, 6)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#7D715E]">
                    <span>{c.clicks} clicks</span>
                    <span>{c.orders} đơn (CR: {c.conversionRate}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exclusive campaign performance */}
      {campaigns.length > 0 && (
        <div className="space-y-4 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-[#1A1612]">
                <Crown className="h-4 w-4 text-[#B88E4F]" />
                <span>Hiệu Quả Chiến Dịch Tiếp Thị Độc Quyền</span>
              </h3>
              <p className="text-xs text-[#7D715E] mt-0.5">Thống kê doanh số phát sinh từ các chiến dịch có hoa hồng thưởng thêm.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EAE4D7] bg-[#FAF8F5] text-[11px] font-bold uppercase text-[#7D715E]">
                <tr>
                  <th className="px-3 py-2.5">Tên Chiến Dịch</th>
                  <th className="px-3 py-2.5">Thưởng Thêm</th>
                  <th className="px-3 py-2.5">Gian Hàng</th>
                  <th className="px-3 py-2.5">KOL Tham Gia</th>
                  <th className="px-3 py-2.5">Số Đơn Hàng</th>
                  <th className="px-3 py-2.5">Doanh Thu Phát Sinh</th>
                  <th className="px-3 py-2.5">Hoa Hồng Thưởng Đã Trả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D7]">
                {campaigns.map((camp) => (
                  <tr key={camp.campaignId} className="transition-colors hover:bg-[#FAF8F5]">
                    <td className="px-3 py-2.5 font-bold text-[#1A1612]">
                      <div className="flex items-center gap-2">
                        <Crown className="h-3.5 w-3.5 text-[#B88E4F]" />
                        <span>{camp.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2.5 py-1 rounded-full bg-[#FBF5EB] text-[#B88E4F] font-bold border border-[#EAE4D7]">
                        +{camp.bonusCommissionRate}% Bonus
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#7D715E]">{camp.storeName || '—'}</td>
                    <td className="px-3 py-2.5 font-semibold text-[#1A1612]">{camp.participantsCount} KOLs</td>
                    <td className="px-3 py-2.5 font-bold text-[#1A1612]">{camp.totalOrders} đơn</td>
                    <td className="px-3 py-2.5 font-bold text-[#8C6226]">{formatCurrency(camp.totalRevenue)}</td>
                    <td className="px-3 py-2.5 font-bold text-[#8C6226]">{formatCurrency(camp.totalCommissions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      <div className="pt-2 text-center text-[11px] text-[#7D715E]">
        Dữ liệu cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')}
      </div>
    </div>
  );
};

export default RealtimeAnalyticsPage;
