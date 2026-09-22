import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown,
  Zap,
  Trophy,
  CheckCircle2,
  Sparkles,
  Award,
  Target,
} from 'lucide-react';
import { tierService, type TierStatus } from '../../services/tier.service';
import { leaderboardService, type LeaderboardPodium } from '../../services/leaderboard.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function KolTierStatusPage() {
  const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);
  const [podium, setPodium] = useState<LeaderboardPodium | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [status, podiumData] = await Promise.all([
        tierService.getMyTierStatus().catch(() => null),
        leaderboardService.getPodium({ metric: 'REVENUE', timeRange: 'this_month' }).catch(() => null),
      ]);
      if (status) setTierStatus(status);
      if (podiumData) setPodium(podiumData);
    } catch (err) {
      console.error('Lỗi tải dữ liệu cấp bậc & vinh danh:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await tierService.triggerEvaluation();
      setToastMsg(`Đã quét doanh số! Cập nhật thăng hạng cho ${res.updatedCount || 0} CTV.`);
      setTimeout(() => setToastMsg(null), 3500);
      loadData();
    } catch (err: any) {
      setToastMsg(err.message || 'Quét thăng hạng thất bại');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setEvaluating(false);
    }
  };

  const currentTier = tierStatus?.currentTier || {
    id: '',
    name: 'Đồng',
    extraBonusPercentage: 0,
    minRevenueThreshold: 0,
  };

  const currentRevenue = Number(tierStatus?.currentRevenue || 0);
  const totalOrders = Number(tierStatus?.totalOrders || 0);
  const nextTier = tierStatus?.nextTier;
  const targetSales = Number(nextTier?.minRevenueThreshold || 50000000);
  const progressPct = Number(tierStatus?.progressPercentage ?? 0);

  return (
    <div className="flex flex-col gap-6 text-left">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#231D15] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#B88E4F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Sub-Navigation Tabs */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] tracking-tight m-0">
            Cấp Bậc &amp; Vinh Danh KOL (Tiers)
          </h1>
          <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
            Hệ thống xếp hạng tự động định kỳ hàng tháng dựa trên GMV bán và đơn giao thành công.
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          icon={<Zap className="w-4 h-4" />}
          onClick={handleEvaluate}
          loading={evaluating}
        >
          {evaluating ? 'Đang quét...' : 'Kiểm tra thăng hạng ngay'}
        </Button>
      </header>

      {/* Consolidated Feature Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE4D7] pb-3">
        <Link
          to="/collaborator/tiers"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C59B58] text-white shadow-2xs flex items-center gap-2"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Cấp bậc &amp; Quyền lợi</span>
        </Link>
        <Link
          to="/collaborator/leaderboard"
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#4A3E2D] bg-white border border-[#EAE4D7] hover:bg-[#F3EFE6] transition flex items-center gap-2"
        >
          <Trophy className="w-3.5 h-3.5 text-[#C59B58]" />
          <span>Bảng vinh danh Top Creator</span>
        </Link>
        <Link
          to="/collaborator/bonus-progress"
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#4A3E2D] bg-white border border-[#EAE4D7] hover:bg-[#F3EFE6] transition flex items-center gap-2"
        >
          <Target className="w-3.5 h-3.5 text-[#C59B58]" />
          <span>Tiến độ thưởng doanh số</span>
        </Link>
      </div>

      {/* Podium Top 3 (Real Data from Leaderboard API) */}
      <Card className="p-6 bg-white border border-[#EAE4D7]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1A1612] m-0">
                Bảng Vinh Danh Top Creator Tháng Này
              </h2>
              <span className="text-xs text-[#7D715E]">Dữ liệu đối soát thời gian thực từ doanh số bán hàng</span>
            </div>
          </div>
          <Link
            to="/collaborator/leaderboard"
            className="text-xs font-bold text-[#B88E4F] hover:text-[#9A7032]"
          >
            Xem bảng xếp hạng đầy đủ →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Hạng 2 */}
          <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl p-5 flex flex-col items-center text-center gap-3 order-2 md:order-1">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
              🥈 HẠNG 2
            </span>
            <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-xl font-black text-slate-700">
              {podium?.rank2?.fullName?.charAt(0) || '2'}
            </div>
            <div>
              <strong className="text-sm font-extrabold text-[#1A1612] block">
                {podium?.rank2?.fullName || 'Đang cập nhật'}
              </strong>
              <span className="text-xs text-[#7D715E]">
                {podium?.rank2?.tierName || 'KOL Tiếp thị'}
              </span>
            </div>
            <div className="w-full bg-white rounded-xl p-2.5 border border-[#EAE4D7]">
              <span className="text-[11px] text-[#7D715E] block">Doanh số GMV</span>
              <strong className="text-sm font-bold text-[#1A1612]">
                {podium?.rank2?.grossRevenue ? `${Number(podium.rank2.grossRevenue).toLocaleString('vi-VN')} ₫` : '0 ₫'}
              </strong>
            </div>
          </div>

          {/* Hạng 1 (Quán quân) */}
          <div className="bg-[#FBF5EB] border-2 border-[#B88E4F] rounded-2xl p-6 flex flex-col items-center text-center gap-3 relative order-1 md:order-2 shadow-sm scale-105">
            <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-[#B88E4F] text-white text-xs font-black flex items-center gap-1 shadow-xs">
              <Crown className="w-3.5 h-3.5" /> QUÁN QUÂN
            </div>
            <div className="w-20 h-20 rounded-full bg-[#EEDFC6] border-4 border-[#B88E4F] flex items-center justify-center text-2xl font-black text-[#B88E4F] mt-2">
              {podium?.rank1?.fullName?.charAt(0) || '1'}
            </div>
            <div>
              <strong className="text-base font-extrabold text-[#1A1612] block">
                {podium?.rank1?.fullName || 'Đang cập nhật'}
              </strong>
              <span className="text-xs text-[#B88E4F] font-bold">
                {podium?.rank1?.tierName || 'Top Creator'}
              </span>
            </div>
            <div className="w-full bg-white rounded-xl p-3 border border-[#EEDFC6]">
              <span className="text-[11px] text-[#7D715E] block">Doanh số GMV xuất sắc</span>
              <strong className="text-base font-black text-[#B88E4F]">
                {podium?.rank1?.grossRevenue ? `${Number(podium.rank1.grossRevenue).toLocaleString('vi-VN')} ₫` : '0 ₫'}
              </strong>
              {podium?.rank1?.totalOrders !== undefined && (
                <span className="text-[11px] text-emerald-600 block mt-0.5 font-semibold">
                  {podium.rank1.totalOrders} đơn hàng hoàn tất
                </span>
              )}
            </div>
          </div>

          {/* Hạng 3 */}
          <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl p-5 flex flex-col items-center text-center gap-3 order-3">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              🥉 HẠNG 3
            </span>
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-xl font-black text-amber-800">
              {podium?.rank3?.fullName?.charAt(0) || '3'}
            </div>
            <div>
              <strong className="text-sm font-extrabold text-[#1A1612] block">
                {podium?.rank3?.fullName || 'Đang cập nhật'}
              </strong>
              <span className="text-xs text-[#7D715E]">
                {podium?.rank3?.tierName || 'KOL Tiếp thị'}
              </span>
            </div>
            <div className="w-full bg-white rounded-xl p-2.5 border border-[#EAE4D7]">
              <span className="text-[11px] text-[#7D715E] block">Doanh số GMV</span>
              <strong className="text-sm font-bold text-[#1A1612]">
                {podium?.rank3?.grossRevenue ? `${Number(podium.rank3.grossRevenue).toLocaleString('vi-VN')} ₫` : '0 ₫'}
              </strong>
            </div>
          </div>
        </div>
      </Card>

      {/* Cấp bậc & Tiến độ hiện tại của bạn */}
      <div className="relative overflow-hidden rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] p-6 sm:p-7 shadow-2xs">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-[#7D715E] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" />
              Cấp bậc hiện tại của bạn
            </span>
            <div className="flex items-center gap-3.5 mt-2">
              <div className="w-12 h-12 rounded-xl bg-[#EEDFC6] text-[#B88E4F] flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1A1612] m-0">
                  KOL Hạng {currentTier.name}
                </h2>
                <span className="text-xs sm:text-sm text-[#B88E4F] font-bold">
                  Thưởng thêm +{currentTier.extraBonusPercentage || 0}% hoa hồng trên mọi đơn hàng
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white px-4 py-3 rounded-xl border border-[#EEDFC6] shrink-0">
            <span className="text-[11px] text-[#7D715E] block font-medium">Hạn mức quyền lợi</span>
            <strong className="text-sm font-extrabold text-[#1A1612]">
              {currentTier.extraBonusPercentage > 2 ? '5 mẫu/tháng + Hỗ trợ VIP' : '2 mẫu/tháng • Tiêu chuẩn'}
            </strong>
          </div>
        </div>

        {/* Tiến độ lên hạng tiếp theo */}
        {nextTier ? (
          <div className="mt-6 pt-5 border-t border-[#EEDFC6]/80">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm font-bold text-[#1A1612]">
                Tiến độ thăng hạng <strong>{nextTier.name} (+{nextTier.extraBonusPercentage || 0}% Thưởng)</strong>
              </span>
              <span className="text-xs font-extrabold text-[#B88E4F]">
                {progressPct}% hoàn thành
              </span>
            </div>

            <div className="h-2 w-full bg-[#FAF8F5] rounded-full overflow-hidden border border-[#EEDFC6]">
              <div className="h-full bg-[#B88E4F] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="flex justify-between text-xs text-[#7D715E] mt-2 font-medium">
              <span>
                Doanh số đạt: <strong className="text-[#1A1612]">{currentRevenue.toLocaleString('vi-VN')} ₫ / {targetSales.toLocaleString('vi-VN')} ₫</strong>
              </span>
              <span>
                Đơn hàng: <strong className="text-[#1A1612]">{totalOrders} đơn hoàn tất</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-5 border-t border-[#EEDFC6]/80 text-xs text-[#7D715E]">
            🎉 Bạn đã đạt cấp bậc cao nhất trong hệ thống đối tác!
          </div>
        )}
      </div>

      {/* Bảng chính sách cấp bậc */}
      <Card className="p-0 bg-white border border-[#EAE4D7] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#EAE4D7]">
          <h3 className="text-base font-extrabold text-[#1A1612] m-0">
            Chính Sách Bậc Thang Hoa Hồng SCANMS
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7]">
                <th className="py-3 px-4 text-xs font-bold text-[#7D715E]">Cấp bậc</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7D715E]">Hoa hồng thưởng</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7D715E]">Doanh số tháng tối thiểu</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7D715E]">Hạn mức mẫu thử</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7D715E]">Hỗ trợ ưu tiên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D7]">
              {[
                { name: 'Đồng', bonus: '+0%', sales: '0 ₫', samples: '1 mẫu/tháng', support: 'Tiêu chuẩn' },
                { name: 'Bạc', bonus: '+1.5%', sales: '20.000.000 ₫', samples: '3 mẫu/tháng', support: 'Tiêu chuẩn' },
                { name: 'Vàng', bonus: '+3.0%', sales: '50.000.000 ₫', samples: '5 mẫu/tháng', support: 'Hỗ trợ riêng' },
                { name: 'Bạch Kim', bonus: '+5.0%', sales: '100.000.000 ₫', samples: '8 mẫu/tháng', support: 'VIP 24/7' },
                { name: 'Kim Cương', bonus: '+7.0%', sales: '250.000.000 ₫', samples: 'Không giới hạn', support: 'Quản lý riêng + Voucher' },
              ].map((t) => {
                const isCurrent = (currentTier?.name || 'Đồng').toLowerCase() === t.name.toLowerCase();
                return (
                  <tr
                    key={t.name}
                    className={isCurrent ? 'bg-[#FBF5EB]' : 'hover:bg-[#FAF8F5] transition'}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs sm:text-sm font-bold text-[#1A1612]">{t.name}</strong>
                        {isCurrent && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#B88E4F] text-white">
                            Cấp hiện tại
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs sm:text-sm font-extrabold text-[#B88E4F]">{t.bonus}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs sm:text-sm font-semibold text-[#1A1612]">{t.sales}</td>
                    <td className="py-3.5 px-4 text-xs sm:text-sm text-[#7D715E]">{t.samples}</td>
                    <td className="py-3.5 px-4 text-xs sm:text-sm text-[#7D715E]">{t.support}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
