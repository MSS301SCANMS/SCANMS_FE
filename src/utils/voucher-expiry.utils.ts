export const VOUCHER_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

export function voucherExpiryState(expiresAt: string | null, now = Date.now()): 'active' | 'soon' | 'expired' {
  if (!expiresAt) return 'active';
  const end = Date.parse(expiresAt);
  if (!Number.isFinite(end)) return 'expired';
  if (now >= end) return 'expired';
  return end - now <= VOUCHER_SOON_WINDOW_MS ? 'soon' : 'active';
}

export function formatVoucherDeadline(expiresAt: string | null): string | null {
  if (!expiresAt || !Number.isFinite(Date.parse(expiresAt))) return null;
  const date = new Date(expiresAt);
  const timeOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  const time = new Intl.DateTimeFormat('vi-VN', timeOptions);
  const hour = Number(time.formatToParts(date).find(part => part.type === 'hour')?.value);
  const period = hour < 11 ? 'sáng' : hour < 13 ? 'trưa' : hour < 18 ? 'chiều' : 'tối';
  const day = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  return `${time.format(date)} ${period}, ngày ${day}`;
}

export function voucherExpiryCountdown(expiresAt: string | null, now = Date.now()): string | null {
  if (voucherExpiryState(expiresAt, now) !== 'soon') return null;
  const minutes = Math.floor((Date.parse(expiresAt!) - now) / 60_000);
  if (minutes < 1) return 'Còn dưới 1 phút';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `Còn ${minutes} phút`;
  return `Còn ${hours} giờ${remainder ? ` ${remainder} phút` : ''}`;
}
