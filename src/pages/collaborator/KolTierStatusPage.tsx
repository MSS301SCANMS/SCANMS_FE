import { useState, useEffect } from 'react';
import {
  Crown,
  Zap,
  Trophy,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { tierService, type TierStatus } from '../../services/tier.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function KolTierStatusPage() {
  const [tierStatus, setTierStatus] = useState<TierStatus | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const status = await tierService.getMyTierStatus();
      setTierStatus(status);
    } catch (err) {
      console.error('Lỗi tải dữ liệu cấp bậc:', err);
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

  const currentTier: any = tierStatus?.currentTier || {
    name: 'Vàng',
    commissionBonusPercent: 3,
    extraBonusPercentage: 3,
    minMonthlySales: 50000000,
    minOrdersCount: 100,
    prioritySupport: true,
    freeSampleQuota: 5,
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#231D15] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#B88E4F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] tracking-tight m-0">
            Bảng Vinh Danh &amp; Cấp Bậc KOL (Tiers)
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

      <Card className="p-6 bg-white border border-[#EAE4D7]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1A1612] m-0">
                Bảng Vinh Danh Doanh Số Tháng 09/2026
              </h2>
              <span className="text-xs text-[#7D715E]">Cập nhật thời gian thực từ mạng lưới CTV toàn quốc</span>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F3EFE6] text-[#B88E4F] border border-[#EAE4D7]">
            Chu kỳ: 01/09 - 30/09
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

          <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl p-5 flex flex-col items-center text-center gap-3 order-2 md:order-1">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
              🥈 HẠNG 2
            </span>
            <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-xl font-black text-slate-700">
              N
            </div>
            <div>
              <strong className="text-sm font-extrabold text-[#1A1612] block">Trần Văn Nhật</strong>
              <span className="text-xs text-[#7D715E]">KOL Hạng Vàng</span>
            </div>
            <div className="w-full bg-white rounded-xl p-2.5 border border-[#EAE4D7]">
              <span className="text-[11px] text-[#7D715E] block">Doanh số GMV</span>
              <strong className="text-sm font-bold text-[#1A1612]">142.300.000 ₫</strong>
            </div>
          </div>

          <div className="bg-[#FBF5EB] border-2 border-[#B88E4F] rounded-2xl p-6 flex flex-col items-center text-center gap-3 relative order-1 md:order-2 shadow-sm scale-105">
            <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-[#B88E4F] text-white text-xs font-black flex items-center gap-1 shadow-xs">
              <Crown className="w-3.5 h-3.5" /> QUÁN QUÂN
            </div>
            <div className="w-20 h-20 rounded-full bg-[#EEDFC6] border-4 border-[#B88E4F] flex items-center justify-center text-2xl font-black text-[#B88E4F] mt-2">
              T
            </div>
            <div>
              <strong className="text-base font-extrabold text-[#1A1612] block">Nguyễn Thành Thắng</strong>
              <span className="text-xs text-[#B88E4F] font-bold">KOL Hạng Vàng (Leader)</span>
            </div>
            <div className="w-full bg-white rounded-xl p-3 border border-[#EEDFC6]">
              <span className="text-[11px] text-[#7D715E] block">Doanh số GMV xuất sắc</span>
              <strong className="text-base font-black text-[#B88E4F]">182.500.000 ₫</strong>
              <span className="text-[11px] text-emerald-600 block mt-0.5 font-semibold">Hoa hồng ròng: 24.650.000 ₫</span>
            </div>
          </div>

          <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl p-5 flex flex-col items-center text-center gap-3 order-3">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              🥉 HẠNG 3
            </span>
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-xl font-black text-amber-800">
              M
            </div>
            <div>
              <strong className="text-sm font-extrabold text-[#1A1612] block">Lê Thị Mai</strong>
              <span className="text-xs text-[#7D715E]">KOL Hạng Bạc</span>
            </div>
            <div className="w-full bg-white rounded-xl p-2.5 border border-[#EAE4D7]">
              <span className="text-[11px] text-[#7D715E] block">Doanh số GMV</span>
              <strong className="text-sm font-bold text-[#1A1612]">98.400.000 ₫</strong>
            </div>
          </div>
        </div>
      </Card>

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
                  Thưởng thêm +{currentTier.extraBonusPercentage ?? currentTier.commissionBonusPercent ?? 3}% hoa hồng trên mọi đơn hàng
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white px-4 py-3 rounded-xl border border-[#EEDFC6] shrink-0">
            <span className="text-[11px] text-[#7D715E] block font-medium">Quyền lợi hàng mẫu</span>
            <strong className="text-sm font-extrabold text-[#1A1612]">
              {currentTier.freeSampleQuota ?? 5} sản phẩm / tháng
            </strong>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[#EEDFC6]/80">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm font-bold text-[#1A1612]">
              Tiến độ thăng hạng <strong>Bạch Kim (+5% Thưởng)</strong>
            </span>
            <span className="text-xs font-extrabold text-[#B88E4F]">
              82% hoàn thành
            </span>
          </div>

          <div className="h-2 w-full bg-[#FAF8F5] rounded-full overflow-hidden border border-[#EEDFC6]">
            <div className="h-full bg-[#B88E4F] rounded-full" style={{ width: '82%' }} />
          </div>

          <div className="flex justify-between text-xs text-[#7D715E] mt-2 font-medium">
            <span>Doanh số hiện tại: <strong className="text-[#1A1612]">46.818.000 ₫ / 50.000.000 ₫</strong></span>
            <span>Đơn hàng: <strong className="text-emerald-700">102 / 100 đơn (Đạt)</strong></span>
          </div>
        </div>
      </div>

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
                { name: 'Đồng', bonus: '+0%', sales: '0 ₫', samples: '1 mẫu/tháng', support: 'Tiêu chuẩn', isCurrent: false },
                { name: 'Bạc', bonus: '+1.5%', sales: '20.000.000 ₫', samples: '3 mẫu/tháng', support: 'Tiêu chuẩn', isCurrent: false },
                { name: 'Vàng', bonus: '+3.0%', sales: '50.000.000 ₫', samples: '5 mẫu/tháng', support: 'Hỗ trợ riêng', isCurrent: true },
                { name: 'Bạch Kim', bonus: '+5.0%', sales: '100.000.000 ₫', samples: '8 mẫu/tháng', support: 'VIP 24/7', isCurrent: false },
                { name: 'Kim Cương', bonus: '+7.0%', sales: '250.000.000 ₫', samples: 'Không giới hạn', support: 'Quản lý riêng + Voucher', isCurrent: false },
              ].map((t) => (
                <tr
                  key={t.name}
                  className={t.isCurrent ? 'bg-[#FBF5EB]' : 'hover:bg-[#FAF8F5] transition'}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs sm:text-sm font-bold text-[#1A1612]">{t.name}</strong>
                      {t.isCurrent && (
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
