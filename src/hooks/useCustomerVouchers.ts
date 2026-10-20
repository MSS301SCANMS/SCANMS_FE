import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import { voucherExpiryState, VOUCHER_SOON_WINDOW_MS } from '@/utils/voucher-expiry.utils';

export interface CustomerVoucher {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minimumOrderAmount: number;
  maximumDiscountAmount: number | null;
  remainingUses: number | null;
  expiresAt: string | null;
  scopeType: string;
  fundingSource: string;
  benefitType: 'GOODS' | 'SHIPPING';
  store: { id: string; name: string; slug: string };
}

interface Inventory {
  vouchers: CustomerVoucher[];
  savedIds: string[];
}

const unwrap = (response: any) => response?.result ?? response?.data?.data ?? response?.data ?? response;

function mapVoucher(raw: any): CustomerVoucher {
  return {
    id: raw.id || raw.voucherId,
    code: raw.code,
    discountType: raw.discountType,
    discountValue: Number(raw.value ?? raw.discountValue ?? 0),
    minimumOrderAmount: Number(raw.minimumSubtotal ?? raw.minimumOrderAmount ?? 0),
    maximumDiscountAmount: raw.cap ?? raw.maximumDiscountAmount ?? null,
    remainingUses: raw.limits?.remainingUses ?? null,
    expiresAt: raw.validUntil || raw.expiresAt || null,
    scopeType: raw.scopeType || 'STORE',
    fundingSource: raw.funding?.source || 'SHOP_FUNDED',
    benefitType: 'GOODS',
    store: {
      id: raw.storeId || '',
      name: raw.storeName || '',
      slug: raw.storeId || '',
    },
  };
}

function savedKey(userId?: string) {
  return `scanms_saved_vouchers_${userId || 'guest'}`;
}

/** Voucher inventory — không phụ thuộc react-query. */
export function useCustomerVouchers(userId?: string) {
  const [data, setData] = useState<Inventory>({ vouchers: [], savedIds: [] });
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    if (!userId) {
      setData({ vouchers: [], savedIds: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const availableResponse = await api.get('/vouchers', { headers: { 'x-skip-cache': 'true' } });
      const available = unwrap(availableResponse);
      const list = (Array.isArray(available) ? available : []).map(mapVoucher);
      let savedIds: string[] = [];
      try {
        const raw = localStorage.getItem(savedKey(userId));
        savedIds = raw ? JSON.parse(raw) : list.map((v) => v.id);
        if (!Array.isArray(savedIds)) savedIds = list.map((v) => v.id);
      } catch {
        savedIds = list.map((v) => v.id);
      }
      setData({ vouchers: list, savedIds });
      setError(false);
    } catch {
      setError(true);
      setData({ vouchers: [], savedIds: [] });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    const current = Date.now();
    const boundaries = (data.vouchers || []).flatMap((voucher) => {
      const end = Date.parse(voucher.expiresAt || '');
      return [end, end - VOUCHER_SOON_WINDOW_MS].filter((time) => Number.isFinite(time) && time > current);
    });
    if (!boundaries.length) return;
    const next = Math.min(...boundaries);
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(250, next - Date.now()));
    return () => window.clearTimeout(timer);
  }, [userId, data.vouchers]);

  const { vouchers, expiredVouchers } = useMemo(() => {
    const active: CustomerVoucher[] = [];
    const expired: CustomerVoucher[] = [];
    for (const voucher of data.vouchers) {
      if (voucherExpiryState(voucher.expiresAt, now) === 'expired') expired.push(voucher);
      else active.push(voucher);
    }
    return { vouchers: active, expiredVouchers: expired };
  }, [data.vouchers, now]);

  const toggleSaved = async (voucher: CustomerVoucher) => {
    const next = data.savedIds.includes(voucher.id)
      ? data.savedIds.filter((id) => id !== voucher.id)
      : [...data.savedIds, voucher.id];
    setData((prev) => ({ ...prev, savedIds: next }));
    if (userId) localStorage.setItem(savedKey(userId), JSON.stringify(next));
  };

  return {
    vouchers,
    expiredVouchers,
    savedIds: data.savedIds,
    loading,
    error,
    now,
    refresh,
    toggleSaved,
  };
}
