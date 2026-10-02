import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

interface EscrowCountdownBadgeProps {
  availableAt?: string | Date | null;
  status?: string;
  isFrozen?: boolean;
  holidayDaysAdded?: number;
  currentHolidayName?: string;
  className?: string;
}

export const EscrowCountdownBadge: React.FC<EscrowCountdownBadgeProps> = ({
  availableAt,
  status,
  isFrozen = false,
  holidayDaysAdded = 0,
  currentHolidayName,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    isMatured: boolean;
  }>({ days: 0, hours: 0, minutes: 0, isMatured: false });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!availableAt) return;

    const calculateTime = () => {
      const target = new Date(availableAt).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, isMatured: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes, isMatured: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // cập nhật mỗi phút
    return () => clearInterval(interval);
  }, [availableAt]);

  if (!availableAt) return null;

  // 1. Trạng thái Đóng băng do khiếu nại tranh chấp (Dispute)
  if (isFrozen || status === 'REVERSED') {
    return (
      <div className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>Escrow Đóng Băng (Đang Khiếu Nại)</span>
      </div>
    );
  }

  // 2. Trạng thái Đã đáo hạn / Đã phê duyệt giải ngân
  if (timeLeft.isMatured || status === 'APPROVED' || status === 'PAID') {
    return (
      <div className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#059669]/10 text-[#059669] border border-[#059669]/20 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Escrow Hoàn Tất • Sẵn Sàng Rút</span>
      </div>
    );
  }

  // 3. Trạng thái Đang bảo chứng đếm ngược (kèm thông tin Lễ/Tết nếu có)
  return (
    <div
      className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] shadow-xs cursor-help select-none transition-all hover:border-[#C59B58] ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div className="w-2 h-2 rounded-full bg-[#C59B58] animate-pulse" />
      <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#C59B58]" />
      <span>
        Escrow 14N: còn{' '}
        <strong className="text-[#1A1612] font-mono">
          {timeLeft.days > 0 ? `${timeLeft.days} ngày ` : ''}
          {timeLeft.hours}h {timeLeft.minutes}m
        </strong>
      </span>

      {holidayDaysAdded > 0 && (
        <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-[#C59B58]/15 text-[10px] font-black text-[#8C6226]" title="Đã tự động cộng ngày bù do nghỉ lễ">
          +{holidayDaysAdded}N Lễ
        </span>
      )}

      {currentHolidayName && (
        <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-[#D97706] font-semibold">
          (Đang nghỉ {currentHolidayName})
        </span>
      )}

      {/* Tooltip giải thích chi tiết cơ chế bảo chứng của sàn */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-[#1A1612] text-white text-[11px] rounded-xl shadow-xl z-50 pointer-events-none text-left leading-relaxed border border-[#3E3529]">
          <div className="flex items-center gap-1.5 text-[#C59B58] font-bold pb-1.5 border-b border-white/10 mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Quỹ Bảo Chứng Escrow SCANMS</span>
          </div>
          <p className="text-gray-200">
            Hoa hồng được sàn giữ an toàn tối thiểu <strong>14 ngày</strong> để đảm bảo khách nhận hàng, đồng kiểm và không phát sinh khiếu nại đổi trả.
          </p>
          {holidayDaysAdded > 0 && (
            <p className="mt-1.5 text-[#EEDFC6] font-medium flex items-start gap-1">
              <Calendar className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Bộ đếm đã tự động gia hạn thêm <strong>+{holidayDaysAdded} ngày</strong> do rơi vào kỳ nghỉ Lễ/Tết chính thức của Việt Nam.
              </span>
            </p>
          )}
          <div className="mt-2 text-[10px] text-gray-400 border-t border-white/10 pt-1">
            Ngày giải ngân dự kiến:{' '}
            <span className="text-white font-mono">
              {new Date(availableAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
