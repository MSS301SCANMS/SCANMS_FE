import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';

export interface CustomDateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm" for datetime-local, or "YYYY-MM-DD" for date
  onChange: (value: string) => void;
  showTime?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  id?: string;
  name?: string;
  ariaLabel?: string;
}

const MONTH_NAMES = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

const WEEKDAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const pad = (n: number) => n.toString().padStart(2, '0');

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
  showTime = true,
  placeholder,
  label,
  required = false,
  disabled = false,
  className = '',
  id,
  name,
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or fallback to today
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  // View state for calendar browsing (Year & Month)
  const [viewYear, setViewYear] = useState(() => (parsedDate ? parsedDate.getFullYear() : new Date().getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (parsedDate ? parsedDate.getMonth() : new Date().getMonth()));

  // Selected date & time in draft mode while picker is open
  const [selectedDay, setSelectedDay] = useState<number | null>(() => (parsedDate ? parsedDate.getDate() : null));
  const [selectedMonth, setSelectedMonth] = useState<number | null>(() => (parsedDate ? parsedDate.getMonth() : null));
  const [selectedYear, setSelectedYear] = useState<number | null>(() => (parsedDate ? parsedDate.getFullYear() : null));

  // Time state (0-23, 0-59)
  const [hour, setHour] = useState<number>(() => (parsedDate ? parsedDate.getHours() : 12));
  const [minute, setMinute] = useState<number>(() => (parsedDate ? parsedDate.getMinutes() : 0));

  // Synchronize when value changes externally
  useEffect(() => {
    if (parsedDate) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
      setSelectedYear(parsedDate.getFullYear());
      setSelectedMonth(parsedDate.getMonth());
      setSelectedDay(parsedDate.getDate());
      setHour(parsedDate.getHours());
      setMinute(parsedDate.getMinutes());
    } else {
      setSelectedDay(null);
      setSelectedMonth(null);
      setSelectedYear(null);
    }
  }, [value]);

  // Click outside listener to close popup
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Calculate calendar days
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const startOffset = (firstDay + 6) % 7; // Monday = 0, Sunday = 6
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const items: {
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    // Previous month filler days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      items.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: d === todayD && m === todayM && y === todayY,
        isSelected: d === selectedDay && m === selectedMonth && y === selectedYear,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      items.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        isToday: d === todayD && viewMonth === todayM && viewYear === todayY,
        isSelected: d === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear,
      });
    }

    // Next month filler days (to make total 35 or 42)
    const remaining = (7 - (items.length % 7)) % 7;
    const nextDaysCount = items.length + remaining < 35 ? remaining + 7 : remaining;
    for (let d = 1; d <= nextDaysCount; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      items.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isToday: d === todayD && m === todayM && y === todayY,
        isSelected: d === selectedDay && m === selectedMonth && y === selectedYear,
      });
    }

    return items;
  }, [viewYear, viewMonth, selectedDay, selectedMonth, selectedYear]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Format and commit value to parent
  const commitValue = (y: number, m: number, d: number, h: number, min: number) => {
    if (showTime) {
      const formatted = `${y}-${pad(m + 1)}-${pad(d)}T${pad(h)}:${pad(min)}`;
      onChange(formatted);
    } else {
      const formatted = `${y}-${pad(m + 1)}-${pad(d)}`;
      onChange(formatted);
    }
  };

  // Day selection click
  const handleSelectDay = (cell: (typeof calendarGrid)[0]) => {
    setSelectedDay(cell.day);
    setSelectedMonth(cell.month);
    setSelectedYear(cell.year);
    if (!cell.isCurrentMonth) {
      setViewMonth(cell.month);
      setViewYear(cell.year);
    }

    if (!showTime) {
      // For date-only mode, picking a day commits immediately
      commitValue(cell.year, cell.month, cell.day, 0, 0);
      setIsOpen(false);
    }
  };


  // Apply current selection
  const handleApply = () => {
    if (selectedDay !== null && selectedMonth !== null && selectedYear !== null) {
      commitValue(selectedYear, selectedMonth, selectedDay, hour, minute);
      setIsOpen(false);
    } else {
      // Pick today if nothing selected
      const now = new Date();
      commitValue(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
      setIsOpen(false);
    }
  };

  // Clear value
  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange('');
    setSelectedDay(null);
    setSelectedMonth(null);
    setSelectedYear(null);
    setIsOpen(false);
  };

  // Display text in input field
  const displayText = useMemo(() => {
    if (!parsedDate) return '';
    const dayStr = pad(parsedDate.getDate());
    const monStr = pad(parsedDate.getMonth() + 1);
    const yrStr = parsedDate.getFullYear();

    if (showTime) {
      const hrStr = pad(parsedDate.getHours());
      const minStr = pad(parsedDate.getMinutes());
      return `${hrStr}:${minStr} · ${dayStr}/${monStr}/${yrStr}`;
    }
    return `${dayStr}/${monStr}/${yrStr}`;
  }, [parsedDate, showTime]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-[#7D715E] mb-1">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      {/* Styled Input Trigger */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        aria-label={ariaLabel || label || 'Chọn ngày giờ'}
        className={`w-full px-3.5 py-2.5 rounded-xl border transition flex items-center justify-between text-xs cursor-pointer select-none ${
          disabled
            ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-[#C59B58] ring-2 ring-[#C59B58]/20 shadow-xs'
            : 'bg-[#FAF8F5] border-[#EAE4D7] hover:border-[#D4C8B5] hover:bg-white text-[#1A1612]'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-6 h-6 rounded-lg bg-[#FAF4EA] border border-[#EFE3CF] text-[#C59B58] flex items-center justify-center shrink-0">
            {showTime ? <Clock className="w-3.5 h-3.5" /> : <CalendarIcon className="w-3.5 h-3.5" />}
          </div>
          {displayText ? (
            <span className="font-bold text-[#1A1612] tracking-tight">{displayText}</span>
          ) : (
            <span className="text-[#A69986] font-medium">
              {placeholder || (showTime ? 'Chọn ngày & giờ...' : 'Chọn ngày...')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-[#A69986] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-[10px] text-[#A69986] transition-transform duration-200">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Hidden input for form submission compatibility */}
      <input type="hidden" id={id} name={name} value={value} required={required} />

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 left-0 sm:left-auto right-0 sm:right-auto w-[310px] bg-white border border-[#EAE4D7] rounded-2xl shadow-xl shadow-stone-900/10 p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150"
        >

          {/* Month / Year Navigator */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#7D715E] hover:text-[#1A1612] flex items-center justify-center transition cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 font-bold text-xs text-[#1A1612]">
              <span className="text-[#C59B58]">{MONTH_NAMES[viewMonth]}</span>
              <span className="text-[#7D715E]">năm</span>
              <span>{viewYear}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#7D715E] hover:text-[#1A1612] flex items-center justify-center transition cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_NAMES.map((w, idx) => (
              <span
                key={w}
                className={`text-[10px] font-bold py-1 ${
                  idx === 6 ? 'text-rose-500' : 'text-[#A69986]'
                }`}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((cell, idx) => {
              const isSelected = cell.isSelected;
              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                  type="button"
                  onClick={() => handleSelectDay(cell)}
                  className={`h-8 w-8 mx-auto rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer font-medium relative ${
                    isSelected
                      ? 'bg-[#C59B58] text-white font-bold shadow-xs scale-105'
                      : cell.isToday
                      ? 'bg-amber-50 text-[#C59B58] font-bold border border-[#C59B58]/40 hover:bg-[#FAF8F5]'
                      : cell.isCurrentMonth
                      ? 'text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#C59B58]'
                      : 'text-[#D4C8B5] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {cell.day}
                  {cell.isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#C59B58]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Time Selector Section (for DateTimePicker) */}
          {showTime && (
            <div className="pt-3 border-t border-[#EAE4D7] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#7D715E] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C59B58]" />
                  Chọn giờ &amp; phút:
                </span>
                <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-2.5 py-1">
                  <select
                    value={hour}
                    onChange={(e) => setHour(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-[#1A1612] outline-none cursor-pointer"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {pad(i)}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-bold text-[#A69986]">:</span>
                  <select
                    value={minute}
                    onChange={(e) => setMinute(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-[#1A1612] outline-none cursor-pointer"
                  >
                    {Array.from({ length: 60 }).map((_, i) => (
                      <option key={i} value={i}>
                        {pad(i)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2.5 border-t border-[#EAE4D7] flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-bold text-[#7D715E] transition cursor-pointer"
            >
              Xóa
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#7D715E] transition cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-1.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Áp dụng</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomDateTimePicker;
