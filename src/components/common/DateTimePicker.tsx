import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Sparkles,
} from 'lucide-react';

export interface DateTimePickerProps {
  value?: string; // YYYY-MM-DDTHH:mm or ISO or YYYY-MM-DD
  onChange?: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minDateTime?: string;
  maxDateTime?: string;
  mode?: 'datetime' | 'date';
  className?: string;
  id?: string;
  label?: string;
  popoverAlign?: 'start' | 'end';
}

const DAYS_OF_WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const FULL_DAYS_OF_WEEK = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Phân tích chuỗi ngày giờ an toàn theo giờ Local, tránh lệch múi giờ UTC
 */
function parseSafeDate(val?: string | null): Date | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 0;
    const min = match[5] ? parseInt(match[5], 10) : 0;
    const d = new Date(year, month, day, hour, min, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày và giờ (24h)...',
  required = false,
  disabled = false,
  minDateTime,
  maxDateTime,
  mode = 'datetime',
  className = '',
  id,
  label,
  popoverAlign = 'start',
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'time'>('calendar');
  const containerRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  // Parse parsed dates
  const parsedValue = useMemo(() => parseSafeDate(value), [value]);
  const minDate = useMemo(() => parseSafeDate(minDateTime), [minDateTime]);
  const maxDate = useMemo(() => parseSafeDate(maxDateTime), [maxDateTime]);

  const defaultRefDate = parsedValue || minDate || new Date();

  const [currentYear, setCurrentYear] = useState<number>(defaultRefDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(defaultRefDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(parsedValue);
  const [selectedHour, setSelectedHour] = useState<number>(parsedValue ? parsedValue.getHours() : 20);
  const [selectedMinute, setSelectedMinute] = useState<number>(parsedValue ? parsedValue.getMinutes() : 0);

  // Đồng bộ khi prop `value` thay đổi từ bên ngoài
  useEffect(() => {
    if (value) {
      const d = parseSafeDate(value);
      if (d) {
        setSelectedDate(d);
        setSelectedHour(d.getHours());
        setSelectedMinute(d.getMinutes());
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Tự động cuộn đến giờ & phút đã chọn khi mở popup
  useEffect(() => {
    if (isOpen && mode === 'datetime') {
      const scrollItem = (container: HTMLDivElement | null, selectedIndex: number) => {
        if (!container) return;
        const item = container.children[selectedIndex] as HTMLElement;
        if (item) {
          container.scrollTop = item.offsetTop - container.offsetTop - 55;
        }
      };
      setTimeout(() => {
        scrollItem(hourScrollRef.current, selectedHour);
        scrollItem(minuteScrollRef.current, selectedMinute);
      }, 50);
    }
  }, [isOpen, selectedHour, selectedMinute, mode]);

  // Format value to standard string
  const formatOutput = (date: Date, hour: number, minute: number): string => {
    const y = date.getFullYear();
    const m = padZero(date.getMonth() + 1);
    const d = padZero(date.getDate());
    if (mode === 'date') {
      return `${y}-${m}-${d}`;
    }
    const h = padZero(hour);
    const min = padZero(minute);
    return `${y}-${m}-${d}T${h}:${min}`;
  };

  const emitChange = (date: Date | null, hour: number, minute: number) => {
    if (!date) {
      onChange?.('');
      return;
    }
    const str = formatOutput(date, hour, minute);
    onChange?.(str);
  };

  const isDayDisabled = (year: number, month: number, day: number) => {
    const checkDate = new Date(year, month, day, 23, 59, 59, 999);
    if (minDate) {
      const minDayStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), 0, 0, 0, 0);
      const targetDayStart = new Date(year, month, day, 0, 0, 0, 0);
      if (targetDayStart < minDayStart) return true;
    }
    if (maxDate && checkDate > maxDate) {
      return true;
    }
    return false;
  };

  const isTimeDisabled = (h: number, m: number) => {
    if (!selectedDate || !minDate) return false;
    const target = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      h,
      m,
      0,
    );
    if (target < minDate) return true;
    if (maxDate && target > maxDate) return true;
    return false;
  };

  const handleSelectDay = (day: number) => {
    if (isDayDisabled(currentYear, currentMonth, day)) return;
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);

    let nextH = selectedHour;
    let nextM = selectedMinute;
    if (minDate) {
      const targetTime = new Date(currentYear, currentMonth, day, nextH, nextM);
      if (targetTime < minDate) {
        nextH = minDate.getHours();
        nextM = minDate.getMinutes();
        setSelectedHour(nextH);
        setSelectedMinute(nextM);
      }
    }

    emitChange(newDate, nextH, nextM);
    if (mode === 'datetime' && window.innerWidth < 640) {
      setActiveTab('time');
    }
  };

  const handleSelectHour = (h: number) => {
    if (isTimeDisabled(h, selectedMinute)) return;
    setSelectedHour(h);
    const baseDate = selectedDate || new Date();
    setSelectedDate(baseDate);
    emitChange(baseDate, h, selectedMinute);
  };

  const handleSelectMinute = (m: number) => {
    if (isTimeDisabled(selectedHour, m)) return;
    setSelectedMinute(m);
    const baseDate = selectedDate || new Date();
    setSelectedDate(baseDate);
    emitChange(baseDate, selectedHour, m);
  };

  const handleSetNow = () => {
    const now = new Date();
    if (minDate && now < minDate) {
      setSelectedDate(minDate);
      setSelectedHour(minDate.getHours());
      setSelectedMinute(minDate.getMinutes());
      setCurrentYear(minDate.getFullYear());
      setCurrentMonth(minDate.getMonth());
      emitChange(minDate, minDate.getHours(), minDate.getMinutes());
      return;
    }
    setSelectedDate(now);
    setSelectedHour(now.getHours());
    setSelectedMinute(now.getMinutes());
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    emitChange(now, now.getHours(), now.getMinutes());
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange?.('');
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar Math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const today = new Date();
  const isCurrentMonthToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  // Nhãn hiển thị trực quan trong ô Input trigger
  const displayLabel = useMemo(() => {
    if (!selectedDate) return '';
    const dayOfWeekName = FULL_DAYS_OF_WEEK[selectedDate.getDay()];
    const d = padZero(selectedDate.getDate());
    const m = padZero(selectedDate.getMonth() + 1);
    const y = selectedDate.getFullYear();

    if (mode === 'date') {
      return `${dayOfWeekName}, ${d}/${m}/${y}`;
    }
    const h = padZero(selectedHour);
    const min = padZero(selectedMinute);
    return `${dayOfWeekName}, ${d}/${m}/${y} • ${h}:${min}`;
  }, [selectedDate, selectedHour, selectedMinute, mode]);

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-[#1A1612] mb-1.5">{label}</label>
      )}

      {/* Trigger Button / Input Box */}
      <div
        id={id}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`group w-full rounded-xl border border-[#EEDFC6] bg-white px-3.5 py-2.5 text-left text-xs sm:text-sm font-normal text-[#1A1612] outline-none transition-all flex items-center justify-between gap-2.5 cursor-pointer shadow-xs select-none ${
          isOpen
            ? 'border-[#C59B58] ring-2 ring-[#C59B58]/20 shadow-md'
            : 'hover:border-[#C59B58] hover:shadow-xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-[#FAF8F5]' : ''}`}
      >
        <div className="flex items-center gap-2.5 truncate pointer-events-none min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0 text-[#B88E4F] group-hover:scale-105 transition">
            {mode === 'datetime' ? <Clock className="w-4 h-4 text-[#B88E4F]" /> : <Calendar className="w-4 h-4 text-[#B88E4F]" />}
          </div>
          <div className="flex flex-col min-w-0 truncate">
            {displayLabel ? (
              <span className="font-bold text-[#1A1612] truncate text-xs sm:text-sm">
                {displayLabel}
              </span>
            ) : (
              <span className="text-[#8C7D6B]/80 font-normal text-xs sm:text-sm truncate">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {displayLabel && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 text-[#8C7D6B] hover:text-[#DC2626] rounded-full hover:bg-[#FAF8F5] transition cursor-pointer"
              title="Xóa thời gian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] font-bold text-[#B88E4F] bg-[#FBF5EB] px-2 py-0.5 rounded-full border border-[#EEDFC6] hidden sm:inline-block">
            {mode === 'datetime' ? '24h' : 'Ngày'}
          </span>
        </div>
      </div>

      {/* Hidden real input for native form validity if required */}
      {required && (
        <input
          type="text"
          value={displayLabel}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown Popover Modal (Tone sáng, ấm, viền vàng be cao cấp) */}
      {isOpen && (
        <div
          className={`absolute top-[calc(100%+6px)] ${popoverAlign === 'end' ? 'right-0' : 'left-0'} z-50 rounded-2xl border border-[#EEDFC6] bg-white p-4 shadow-2xl shadow-[#C59B58]/10 ring-1 ring-[#C59B58]/15 transition-all animate-in fade-in zoom-in-95 duration-150 ${
            mode === 'datetime'
              ? 'w-[320px] sm:w-[480px] max-w-[calc(100vw-2rem)]'
              : 'w-[280px] sm:w-[310px]'
          }`}
        >
          {/* Header Preview */}
          <div className="mb-3.5 pb-2.5 border-b border-[#F3EFE6] flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#7D715E] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C59B58]" />
              {mode === 'datetime' ? 'Chọn ngày & giờ phát sóng' : 'Chọn ngày'}
            </span>
            {displayLabel && (
              <span className="text-[11px] font-extrabold text-[#B88E4F] bg-[#FAF8F5] px-2.5 py-0.5 rounded-lg border border-[#EEDFC6] flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#B88E4F]" />
                {displayLabel}
              </span>
            )}
          </div>

          {/* Mobile Tab Switcher (if datetime mode on small screens) */}
          {mode === 'datetime' && (
            <div className="flex sm:hidden rounded-xl bg-[#FAF8F5] p-1 border border-[#EEDFC6] mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'calendar'
                    ? 'bg-white text-[#1A1612] shadow-xs'
                    : 'text-[#7D715E] hover:text-[#1A1612]'
                }`}
              >
                📅 Ngày
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('time')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'time'
                    ? 'bg-white text-[#1A1612] shadow-xs'
                    : 'text-[#7D715E] hover:text-[#1A1612]'
                }`}
              >
                ⏰ Giờ ({padZero(selectedHour)}:{padZero(selectedMinute)})
              </button>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Left: Calendar Panel (Giữ nguyên logic và cấu trúc ngày) */}
            <div
              className={`flex-1 min-w-[210px] ${
                mode === 'datetime' && activeTab === 'time' ? 'hidden sm:block' : 'block'
              }`}
            >
              {/* Month / Year Navigation */}
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-xs sm:text-sm font-extrabold text-[#1A1612]">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#EEDFC6] bg-white text-[#7D715E] hover:text-[#B88E4F] hover:bg-[#FAF8F5] transition cursor-pointer shadow-2xs"
                    title="Tháng trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#EEDFC6] bg-white text-[#7D715E] hover:text-[#B88E4F] hover:bg-[#FAF8F5] transition cursor-pointer shadow-2xs"
                    title="Tháng sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-[11px] font-bold text-[#8C7D6B] py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: adjustedFirstDay }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="w-7 h-7 sm:w-8 sm:h-8" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const isDisabled = isDayDisabled(currentYear, currentMonth, day);
                  const isSelected =
                    selectedDate &&
                    selectedDate.getFullYear() === currentYear &&
                    selectedDate.getMonth() === currentMonth &&
                    selectedDate.getDate() === day;
                  const isToday = isCurrentMonthToday && today.getDate() === day;

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelectDay(day)}
                      className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#C59B58] text-white font-bold shadow-md shadow-[#C59B58]/30 scale-105'
                          : isDisabled
                          ? 'text-[#A89E90]/40 bg-[#FAF8F5]/40 cursor-not-allowed line-through'
                          : isToday
                          ? 'border border-[#C59B58] text-[#B88E4F] font-bold bg-[#FBF5EB]/50 hover:bg-[#FBF5EB]'
                          : 'text-[#1A1612] hover:bg-[#FBF5EB] hover:text-[#B88E4F]'
                      }`}
                    >
                      {day}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#C59B58]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Time Chooser (ĐÃ ĐƯỢC THIẾT KẾ LẠI: TONE SÁNG, SANG TRỌNG, RỘNG RÃI & MƯỢT MÀ) */}
            {mode === 'datetime' && (
              <div
                className={`sm:border-l sm:border-[#F3EFE6] sm:pl-4 shrink-0 sm:w-[205px] ${
                  activeTab === 'calendar' ? 'hidden sm:block' : 'block'
                }`}
              >
                {/* Hai cột cuộn Giờ & Phút rộng rãi, sáng sủa, thanh cuộn ẩn hoàn toàn với no-scrollbar */}
                <div className="flex gap-2.5">
                  {/* Cột Giờ (00 - 23) */}
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-[11px] font-bold text-[#8C7D6B] mb-2 px-1">Giờ</span>
                    <div
                      ref={hourScrollRef}
                      className="h-56 w-full overflow-y-auto rounded-xl border border-[#EEDFC6] bg-[#FAF8F5]/60 p-1 space-y-1 no-scrollbar"
                    >
                      {Array.from({ length: 24 }).map((_, h) => {
                        const disabled = isTimeDisabled(h, selectedMinute);
                        const isSelected = selectedHour === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleSelectHour(h)}
                            className={`w-full h-7 rounded-lg text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#C59B58] text-white font-extrabold shadow-xs scale-105'
                                : disabled
                                ? 'text-[#A89E90]/40 cursor-not-allowed'
                                : 'text-[#1A1612] hover:bg-white hover:text-[#B88E4F] hover:shadow-2xs'
                            }`}
                          >
                            {padZero(h)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cột Phút (00 - 59) */}
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-[11px] font-bold text-[#8C7D6B] mb-2 px-1">Phút</span>
                    <div
                      ref={minuteScrollRef}
                      className="h-56 w-full overflow-y-auto rounded-xl border border-[#EEDFC6] bg-[#FAF8F5]/60 p-1 space-y-1 no-scrollbar"
                    >
                      {Array.from({ length: 60 }).map((_, m) => {
                        const disabled = isTimeDisabled(selectedHour, m);
                        const isSelected = selectedMinute === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleSelectMinute(m)}
                            className={`w-full h-7 rounded-lg text-xs font-bold text-center transition-all cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#C59B58] text-white font-extrabold shadow-xs scale-105'
                                : disabled
                                ? 'text-[#A89E90]/40 cursor-not-allowed'
                                : 'text-[#1A1612] hover:bg-white hover:text-[#B88E4F] hover:shadow-2xs'
                            }`}
                          >
                            {padZero(m)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions (Sáng sủa, sắc nét) */}
          <div className="mt-3.5 pt-3 border-t border-[#F3EFE6] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-[#8C7D6B] hover:text-[#DC2626] font-semibold transition cursor-pointer text-xs"
            >
              Xóa
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSetNow}
                className="px-3 py-1.5 rounded-xl border border-[#EEDFC6] bg-white text-[#B88E4F] font-bold hover:bg-[#FAF8F5] transition cursor-pointer text-xs shadow-2xs"
              >
                Bây giờ
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#C59B58] text-white font-extrabold hover:bg-[#B88E4F] shadow-sm shadow-[#C59B58]/20 transition cursor-pointer flex items-center gap-1.5 text-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateTimePicker;
