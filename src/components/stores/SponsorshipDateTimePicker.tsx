import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from 'lucide-react';

const pad = (value: number) => String(value).padStart(2, '0');
const localValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

export function SponsorshipDateTimePicker({ name, label, value, onChange }: {
  name: string; label: string; value: string; onChange: (value: string) => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(new Date());
  const [month, setMonth] = useState(new Date());
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    root.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const length = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((offset + length) / 7) * 7;
  const selectedDate = value ? new Date(value) : null;
  const choose = (date: Date) => {
    const next = new Date(draft);
    next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setDraft(next);
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };
  return <div className="sp-datetime" ref={root} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); close(); }
  }}>
    <span className="sp-field-label" id={`${id}-label`}>{label}</span>
    <input type="hidden" name={name} value={value} />
    <button ref={trigger} type="button" className={`sp-date-trigger${open ? ' is-open' : ''}`}
      aria-labelledby={`${id}-label ${id}-value`} aria-expanded={open} aria-controls={`${id}-panel`}
      onClick={() => {
        if (open) { close(); return; }
        const initial = value ? new Date(value) : new Date();
        setDraft(initial); setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1)); setOpen(true);
      }}>
      <CalendarDays size={17} />
      <span id={`${id}-value`}>{selectedDate
        ? <><strong>{selectedDate.toLocaleDateString('vi-VN')}</strong><small>{pad(selectedDate.getHours())}:{pad(selectedDate.getMinutes())}</small></>
        : <span className="sp-date-placeholder">Chọn ngày và giờ</span>}</span>
      <Clock3 size={15} />
    </button>
    {open && <section id={`${id}-panel`} className="sp-date-panel" aria-label={`Chọn ${label.toLowerCase()}`}>
      <div className="sp-calendar-heading">
        <strong>Tháng {month.getMonth() + 1}, {month.getFullYear()}</strong>
        <div><button type="button" aria-label="Tháng trước" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={17} /></button>
          <button type="button" aria-label="Tháng sau" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={17} /></button>
          <button type="button" aria-label="Đóng lịch" onClick={close}><X size={16} /></button></div>
      </div>
      <div className="sp-calendar-week">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="sp-calendar-grid" role="grid" aria-label="Ngày trong tháng">
        {Array.from({ length: cells }, (_, index) => {
          const date = new Date(month.getFullYear(), month.getMonth(), index - offset + 1);
          const selected = date.toDateString() === draft.toDateString();
          const today = date.toDateString() === new Date().toDateString();
          return <button type="button" role="gridcell" key={index}
            aria-label={date.toLocaleDateString('vi-VN')} aria-selected={selected} aria-current={today ? 'date' : undefined}
            className={`${date.getMonth() !== month.getMonth() ? 'is-other-month' : ''} ${selected ? 'is-selected' : ''} ${today ? 'is-today' : ''}`}
            onClick={() => choose(date)} onKeyDown={event => {
              const shift: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
              if (shift[event.key]) {
                event.preventDefault();
                const next = new Date(date); next.setDate(next.getDate() + shift[event.key]); choose(next);
                requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus());
              }
            }}>{date.getDate()}</button>;
        })}
      </div>
      <div className="sp-time-row"><span><Clock3 size={15} /> Giờ chạy</span><div>
        <select aria-label={`Giờ ${label.toLowerCase()}`} value={draft.getHours()} onChange={e => { const next = new Date(draft); next.setHours(Number(e.target.value)); setDraft(next); }}>
          {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{pad(hour)}</option>)}
        </select><span>:</span>
        <select aria-label={`Phút ${label.toLowerCase()}`} value={draft.getMinutes()} onChange={e => { const next = new Date(draft); next.setMinutes(Number(e.target.value)); setDraft(next); }}>
          {Array.from({ length: 60 }, (_, minute) => <option key={minute} value={minute}>{pad(minute)}</option>)}
        </select></div></div>
      <div className="sp-calendar-footer"><button type="button" onClick={() => choose(new Date())}>Hôm nay</button>
        <button type="button" className="sp-date-confirm" onClick={() => { onChange(localValue(draft)); close(); }}>Xác nhận</button></div>
    </section>}
  </div>;
}
