/** Zoned ISO values are instants; only zone-less picker values use local time. */
export function parsePickerDate(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const text = value.trim();
  if (/(?:Z|[+-]\d{2}:\d{2})$/i.test(text)) {
    const date = new Date(text);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/);
  if (!match) return null;
  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  const date = new Date(+year, +month - 1, +day, +hour, +minute, +second);
  return date.getFullYear() === +year && date.getMonth() === +month - 1 && date.getDate() === +day
    && date.getHours() === +hour && date.getMinutes() === +minute && date.getSeconds() === +second ? date : null;
}

export function pickerBoundary(value: string | undefined, side: 'min' | 'max', mode: 'date' | 'datetime'): Date | null {
  const date = parsePickerDate(value);
  if (!date) return null;
  if (mode === 'date') { date.setHours(0, 0, 0, 0); return date; }
  return new Date((side === 'min' ? Math.ceil : Math.floor)(date.getTime() / 60000) * 60000);
}
