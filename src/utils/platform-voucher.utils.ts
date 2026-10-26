import { serverDate } from './server-date';

export interface PlatformVoucher {
  id: string;
  code: string;
  benefitType: 'GOODS' | 'SHIPPING';
  discountType: 'FIXED_AMOUNT' | 'PERCENTAGE';
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
  remainingUses: number | null;
  expiresAt: string;
}

export function platformVoucher(raw: any, storeId?: string, now = Date.now()): PlatformVoucher | null {
  if (!raw || raw.issuerType !== 'PLATFORM') return null;
  if (raw.scopeType !== 'PLATFORM' && !(raw.scopeType === 'STORE' && storeId && raw.storeId === storeId)) return null;
  const benefit = raw.benefitType ?? raw.scope?.benefitType ?? 'GOODS';
  if (benefit !== 'GOODS' && benefit !== 'SHIPPING') return null;
  if (!['FIXED', 'FIXED_AMOUNT', 'PERCENTAGE'].includes(raw.discountType)) return null;
  const start = Date.parse(serverDate(raw.validFrom || '') || '');
  const end = Date.parse(serverDate(raw.validUntil || '') || '');
  const value = Number(raw.value), minimum = Number(raw.minimumSubtotal ?? 0);
  const remaining = raw.remainingUses == null ? null : Number(raw.remainingUses);
  const cap = raw.cap == null ? null : Number(raw.cap);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > now || end <= now
      || !Number.isFinite(value) || value <= 0 || !Number.isFinite(minimum) || minimum < 0
      || cap !== null && (!Number.isFinite(cap) || cap <= 0)
      || remaining !== null && (!Number.isFinite(remaining) || remaining <= 0)
      || raw.discountType === 'PERCENTAGE' && value > 100
      || typeof raw.code !== 'string' || !raw.code.trim() || !(raw.voucherId || raw.id)) return null;
  return { id: raw.voucherId || raw.id, code: raw.code.trim().toUpperCase(), benefitType: benefit,
    discountType: raw.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_AMOUNT', discountValue: value,
    minimumOrderAmount: minimum, maximumDiscountAmount: cap, remainingUses: remaining, expiresAt: new Date(end).toISOString() };
}
