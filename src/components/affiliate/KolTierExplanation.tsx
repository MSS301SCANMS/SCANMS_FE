import { ArrowUpRight, CalendarDays, Info } from 'lucide-react';
import type { TierStatus } from '../../services/tier.service';

const money = (value: number) => `${Number(value).toLocaleString('vi-VN')} đ`;
const month = (date: string) => new Date(date).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

export function KolTierExplanation({ status }: { status: TierStatus }) {
  const { currentTier, qualifiedTier, currentRevenue, nextTier } = status;
  const higher = Number(qualifiedTier.minRevenueThreshold) > Number(currentTier.minRevenueThreshold);
  const lower = Number(qualifiedTier.minRevenueThreshold) < Number(currentTier.minRevenueThreshold);
  const period = status.assessmentPeriod ? `tháng ${month(status.assessmentPeriod.startsAt)}` : 'tháng trước';
  return <section className="mb-4 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs leading-relaxed" aria-label="Căn cứ xếp hạng KOL">
    <div className="flex items-center gap-2 font-semibold text-[#1A1612]">
      <Info size={16} className="shrink-0 text-[#B88E4F]" />
      <h3>{higher ? `Đủ điều kiện lên hạng ${qualifiedTier.name}` : lower ? 'Kết quả GMV khác hạng đang áp dụng' : `GMV đạt ngưỡng hạng ${qualifiedTier.name}`}</h3>
    </div>
    <p className="mt-2 text-[#7D715E]">
      GMV hợp lệ {period} của bạn là <strong className="font-semibold text-[#1A1612]">{money(currentRevenue)}</strong>, đạt ngưỡng {qualifiedTier.name} từ <strong className="font-semibold text-[#1A1612]">{money(qualifiedTier.minRevenueThreshold)}</strong>.
    </p>
    <p className="mt-1 text-[#7D715E]">{higher
      ? `Hạng đang áp dụng vẫn là ${currentTier.name} (+${currentTier.extraBonusPercentage}%). Sau khi hệ thống xét và cập nhật, thưởng hạng ${qualifiedTier.name} là +${qualifiedTier.extraBonusPercentage}% cho đơn mới đủ điều kiện.`
      : lower
        ? `Bạn vẫn đang ở hạng ${currentTier.name} (+${currentTier.extraBonusPercentage}%). GMV kỳ này tương ứng hạng ${qualifiedTier.name}; hệ thống có thể điều chỉnh giảm khi xét hạng.`
        : `Hạng ${currentTier.name} đang áp dụng thưởng thêm +${currentTier.extraBonusPercentage}% cho đơn mới đủ điều kiện.`}</p>
    {nextTier && <p className="mt-2 flex items-start gap-1.5 text-[#7D715E]"><ArrowUpRight size={15} className="mt-0.5 shrink-0 text-[#B88E4F]" /><span>Hạng tiếp theo từ hạng đang áp dụng {currentTier.name} là {nextTier.name} (+{nextTier.extraBonusPercentage}%): cần GMV từ {money(nextTier.minRevenueThreshold)} trong một kỳ xét. Kỳ {period} còn thiếu {money(Math.max(0, Number(nextTier.minRevenueThreshold) - Number(currentRevenue)))} để đạt mốc này.</span></p>}
    <p className="mt-2 border-t border-[#EEDFC6] pt-2 text-[11px] text-[#7D715E]">Chỉ tính đơn tiếp thị đã giao / hoàn thành, sau giảm giá và hoàn tiền, không gồm phí ship. Không tính cộng dồn nhiều tháng.</p>
    <p className="mt-2 flex items-start gap-1.5 text-[11px] text-[#7D715E]"><CalendarDays size={14} className="mt-0.5 shrink-0 text-[#B88E4F]" /><span>{status.nextEvaluationAt ? `Lần xét định kỳ tiếp theo: ${new Date(status.nextEvaluationAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Ho_Chi_Minh' })}. ` : 'Xét định kỳ lúc 00:15 ngày 1 mỗi tháng. '}Kỳ tiếp theo sử dụng GMV tháng vừa kết thúc. Bạn sẽ nhận thông báo khi hạng được thay đổi.</span></p>
  </section>;
}
