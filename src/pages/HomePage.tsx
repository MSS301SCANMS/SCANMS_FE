import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Calendar,
  Filter,
  RotateCcw,
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
} from 'lucide-react';
import { tierService, type TierStatus } from '../services/tier.service';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function HomePage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('7');
  const [metric, setMetric] = useState<'clicks' | 'orders' | 'revenue' | 'commission'>('clicks');
  const [selectedDay, setSelectedDay] = useState('2026-09-08');
  const [uxState, setUxState] = useState<'data' | 'loading' | 'empty'>('data');
  const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);

  useEffect(() => {
    tierService
      .getMyTierStatus()
      .then((res: any) => {
        if (res) setTierStatus(res);
      })
      .catch(() => {});
  }, []);

  const dailyData = [
    { date: '2026-09-02', label: 'T2', clicks: 1200, orders: 14, revenue: 6426000, commission: 706860 },
    { date: '2026-09-03', label: 'T3', clicks: 1100, orders: 12, revenue: 5508000, commission: 605880 },
    { date: '2026-09-04', label: 'T4', clicks: 1200, orders: 15, revenue: 6885000, commission: 757350 },
    { date: '2026-09-05', label: 'T5', clicks: 1300, orders: 16, revenue: 7344000, commission: 807840 },
    { date: '2026-09-06', label: 'T6', clicks: 1200, orders: 13, revenue: 5967000, commission: 656370 },
    { date: '2026-09-07', label: 'T7', clicks: 1300, orders: 18, revenue: 8262000, commission: 908820 },
    { date: '2026-09-08', label: 'CN', clicks: 1400, orders: 20, revenue: 9180000, commission: 1009800, isPeak: true },
  ];

  return (
    <div className="flex flex-col gap-6 text-left">

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] tracking-tight m-0">
            Tổng quan CTV / KOL
          </h1>
          <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
            Theo dõi lưu lượng tiếp thị, kết quả đơn hàng và hoa hồng bán mỹ phẩm.
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={() => navigate('/collaborator/links')}
        >
          Tạo link tiếp thị
        </Button>
      </header>

      <Card className="p-4 bg-white border border-[#EAE4D7]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-3.5">

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#7D715E] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#B88E4F]" />
                Khoảng thời gian
              </label>
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-[#1A1612] appearance-none outline-none cursor-pointer hover:bg-[#EAE4D7] transition"
                >
                  <option value="7">7 ngày gần nhất</option>
                  <option value="30">30 ngày gần nhất</option>
                  <option value="90">90 ngày gần nhất</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#7D715E] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#A49B8B]" />
                Từ ngày
              </label>
              <input
                type="text"
                readOnly
                value="02/09/2026"
                className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1A1612] w-28 text-center outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#7D715E] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#A49B8B]" />
                Đến ngày
              </label>
              <input
                type="text"
                readOnly
                value="08/09/2026"
                className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs font-semibold text-[#1A1612] w-28 text-center outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="gold" size="sm" icon={<Filter className="w-3.5 h-3.5" />}>
                Áp dụng
              </Button>
              <Button variant="outline" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />}>
                Đặt lại
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 ml-auto">
            <label className="text-[11px] font-bold text-[#7D715E] flex items-center gap-1">
              🧪 Xem trạng thái UX
            </label>
            <div className="relative">
              <select
                value={uxState}
                onChange={(e) => setUxState(e.target.value as any)}
                className="bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-[#1A1612] appearance-none outline-none cursor-pointer hover:bg-[#EAE4D7] transition"
              >
                <option value="data">Có dữ liệu</option>
                <option value="loading">Đang tải dữ liệu</option>
                <option value="empty">Trạng thái rỗng</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      <div className="relative overflow-hidden rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#1A1612] p-6 sm:p-7 shadow-2xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs sm:text-sm font-semibold text-[#7D715E] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#B88E4F]" />
              Số dư khả dụng • Toàn bộ thời gian
            </span>
            <strong className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1A1612] mt-1">
              12.450.000 <span className="underline decoration-2 decoration-[#B88E4F]">₫</span>
            </strong>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#7D715E] mt-2">
              <span>Chờ đối soát: 1.850.000 ₫</span>
              <span>•</span>
              <span>Đang xử lý rút: 0 ₫</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/collaborator/kyc')}
            className="px-5 py-2.5 bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-xs shrink-0 flex items-center justify-center gap-2"
          >
            <span>Yêu cầu rút tiền</span>
            <ArrowUpRight className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full border-24 border-[#EEDFC6]/40 pointer-events-none" />
        <div className="absolute right-4 top-2 w-52 h-52 rounded-full border-16 border-[#EEDFC6]/50 pointer-events-none" />
        <div className="absolute right-14 top-10 w-32 h-32 rounded-full border-12 border-[#C59B58]/20 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <Card className="p-4 flex flex-col justify-between gap-3 bg-white">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-xl bg-[#EBF3FE] text-[#2563EB] flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <TrendingUp className="w-3 h-3" /> +18.4%
            </span>
          </div>
          <div>
            <span className="text-xs text-[#7D715E] font-medium block">Lượt nhấp tiếp thị (Traffic)</span>
            <strong className="text-2xl font-extrabold text-[#1A1612] tracking-tight block mt-0.5">
              8.458
            </strong>
          </div>
          <div className="flex flex-col gap-1 pt-1">
            <div className="h-1.5 w-full bg-[#F3EFE6] rounded-full overflow-hidden">
              <div className="h-full bg-[#2563EB] rounded-full" style={{ width: '82%' }} />
            </div>
            <span className="text-[11px] text-[#7D715E]">82% chỉ tiêu chu kỳ • +1.310 lượt</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3 bg-white">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-xl bg-[#FEF5E7] text-[#D97706] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <TrendingUp className="w-3 h-3" /> +12.5%
            </span>
          </div>
          <div>
            <span className="text-xs text-[#7D715E] font-medium block">Đơn chốt thành công</span>
            <strong className="text-2xl font-extrabold text-[#1A1612] tracking-tight block mt-0.5">
              102 <span className="text-sm font-semibold text-[#7D715E]">đơn</span>
            </strong>
          </div>
          <div className="flex flex-col gap-1 pt-1">
            <div className="h-1.5 w-full bg-[#F3EFE6] rounded-full overflow-hidden">
              <div className="h-full bg-[#D97706] rounded-full" style={{ width: '76%' }} />
            </div>
            <span className="text-[11px] text-[#7D715E]">Tỷ lệ hủy hoàn chỉ 0.9% • Đã giao 88</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3 bg-white">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-xl bg-[#F3EBFD] text-[#7C3AED] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <TrendingUp className="w-3 h-3" /> +0.32%
            </span>
          </div>
          <div>
            <span className="text-xs text-[#7D715E] font-medium block">Tỷ lệ chuyển đổi đơn (CR%)</span>
            <strong className="text-2xl font-extrabold text-[#1A1612] tracking-tight block mt-0.5">
              1.21%
            </strong>
          </div>
          <div className="flex flex-col gap-1 pt-1">
            <div className="h-1.5 w-full bg-[#F3EFE6] rounded-full overflow-hidden">
              <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: '70%' }} />
            </div>
            <span className="text-[11px] text-[#7D715E]">Mức trung bình ngành mỹ phẩm: 1.05%</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3 bg-white">
          <div className="flex justify-between items-center">
            <div className="w-8 h-8 rounded-xl bg-[#EAF8F1] text-[#059669] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <TrendingUp className="w-3 h-3" /> +24.8%
            </span>
          </div>
          <div>
            <span className="text-xs text-[#7D715E] font-medium block">Doanh thu phát sinh (GMV)</span>
            <strong className="text-2xl font-extrabold text-[#1A1612] tracking-tight block mt-0.5">
              46.818.000 ₫
            </strong>
          </div>
          <div className="flex flex-col gap-1 pt-1">
            <div className="h-1.5 w-full bg-[#F3EFE6] rounded-full overflow-hidden">
              <div className="h-full bg-[#059669] rounded-full" style={{ width: '88%' }} />
            </div>
            <span className="text-[11px] text-[#7D715E]">
              Hoa hồng ước tính: <strong className="text-[#B88E4F]">5.149.980 ₫</strong>
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <Card className="lg:col-span-8 p-5 sm:p-6 flex flex-col gap-5 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1A1612] m-0">Hiệu suất bán hàng &amp; Tiếp thị</h2>
                <p className="text-xs text-[#7D715E] m-0 mt-0.5">Lưu lượng truy cập, đơn hàng và hoa hồng theo ngày</p>
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
                <option value="commission">Hoa hồng ước tính (₫)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7]">
              <span className="text-[11px] text-[#7D715E] block">Tổng chu kỳ</span>
              <strong className="text-sm font-bold text-[#1A1612]">8.458 lượt</strong>
            </div>
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7]">
              <span className="text-[11px] text-[#7D715E] block">Đỉnh cao nhất</span>
              <strong className="text-sm font-bold text-[#B88E4F]">1.363 lượt (30/09)</strong>
            </div>
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7]">
              <span className="text-[11px] text-[#7D715E] block">Trung bình ngày</span>
              <strong className="text-sm font-bold text-[#1A1612]">1.208 lượt</strong>
            </div>
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7]">
              <span className="text-[11px] text-[#7D715E] block">CR% Trung bình</span>
              <strong className="text-sm font-bold text-[#1A1612]">1.21%</strong>
            </div>
          </div>

          <div className="flex items-end justify-between h-48 pt-4 pb-2 border-b border-[#EAE4D7] gap-2">
            {dailyData.map((d) => {
              const heightPct = Math.round((d.clicks / 1500) * 100);
              const isSelected = selectedDay === d.date;
              return (
                <div
                  key={d.date}
                  onClick={() => setSelectedDay(d.date)}
                  className="flex flex-col items-center gap-1.5 flex-1 cursor-pointer group"
                >

                  {d.isPeak && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#B88E4F] text-white text-[9px] font-extrabold flex items-center gap-0.5 shadow-2xs">
                      👑 Đỉnh
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-[#A49B8B] group-hover:text-[#1A1612] transition">
                    {d.clicks >= 1000 ? `${(d.clicks / 1000).toFixed(1)}k` : d.clicks}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                      d.isPeak
                        ? 'bg-[#B88E4F]'
                        : isSelected
                        ? 'bg-[#B88E4F] ring-2 ring-[#B88E4F]/40'
                        : 'bg-[#EEDFC6] hover:bg-[#DFCFB2]'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold transition ${
                      isSelected || d.isPeak ? 'text-[#B88E4F]' : 'text-[#7D715E]'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-[#7D715E] text-center m-0">
            💡 Chạm hoặc click vào từng cột để xem chi tiết doanh số &amp; hoa hồng ngày đó.
          </p>
        </Card>

        <Card className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between gap-5 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1A1612] m-0">Hoa hồng gần đây</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/collaborator/tiers')}
            >
              Xem ví
            </Button>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]">
              <div>
                <strong className="text-xs font-bold text-[#1A1612] block">#IN23918</strong>
                <span className="text-[11px] text-[#7D715E]">Serum Vitamin C 15% • Đã duyệt</span>
              </div>
              <strong className="text-sm font-extrabold text-[#B88E4F]">110.160 ₫</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]">
              <div>
                <strong className="text-xs font-bold text-[#1A1612] block">#IN23902</strong>
                <span className="text-[11px] text-[#7D715E]">Kem chống nắng SPF50+ • Chờ đối soát</span>
              </div>
              <strong className="text-sm font-extrabold text-[#C59B58]">50.570 ₫</strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]">
              <div>
                <strong className="text-xs font-bold text-[#1A1612] block">#IN23845</strong>
                <span className="text-[11px] text-[#7D715E]">Gel rửa mặt • Đã thu hồi</span>
              </div>
              <strong className="text-sm font-extrabold text-[#A49B8B]">0 ₫</strong>
            </div>
          </div>

          <div className="p-3.5 bg-[#FBF5EB] rounded-xl border border-[#EEDFC6] flex flex-col gap-1.5 mt-auto">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#B88E4F] shrink-0" />
              <strong className="text-xs font-bold text-[#1A1612]">
                {tierStatus?.currentTier
                  ? `Hạng ${tierStatus.currentTier.name} (+${tierStatus.currentTier.extraBonusPercentage}% Thưởng)`
                  : 'KOL Hạng Vàng (+3% Thưởng)'}
              </strong>
            </div>
            <p className="text-[11px] text-[#7D715E] leading-relaxed m-0">
              Bạn đang nhận thêm <strong className="text-[#B88E4F]">hoa hồng thưởng bậc thang</strong> trên mỗi đơn hàng hoàn tất. Cần thêm 8 đơn để thăng hạng Bạch Kim!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
