import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { voucherExpiryState, VOUCHER_SOON_WINDOW_MS } from '@/utils/voucher-expiry.utils';

export interface CustomerVoucher {
  id: string; code: string; discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'; discountValue: number;
  minimumOrderAmount: number; maximumDiscountAmount: number | null; remainingUses: number | null;
  expiresAt: string | null; scopeType: string; fundingSource: string; benefitType: 'GOODS' | 'SHIPPING';
  store: { id: string; name: string; slug: string };
}
interface Inventory { vouchers: CustomerVoucher[]; savedIds: string[] }
const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;

export function useCustomerVouchers(userId?: string) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now);
  const queryKey = ['customer-voucher-inventory', userId];
  const query = useQuery<Inventory>({
    queryKey,
    enabled: Boolean(userId),
    staleTime: 15_000,
    refetchInterval: 60_000,
    queryFn: async ({ signal }) => {
      const config = { signal, headers: { 'x-skip-cache': 'true' } };
      const [availableResponse, savedResponse, detailsResponse, expiredResponse] = await Promise.all([
        api.get('/coupons/available', config), api.get('/coupons/saved', config), api.get('/coupons/saved/details', config),
        api.get('/coupons/saved/expired', config),
      ]);
      const available = unwrap(availableResponse), saved = unwrap(savedResponse), details = unwrap(detailsResponse);
      const vouchers = [...new Map<string, CustomerVoucher>([
        ...(Array.isArray(available) ? available : []), ...(Array.isArray(details) ? details : []),
        ...(Array.isArray(unwrap(expiredResponse)) ? unwrap(expiredResponse) : []),
      ].map((voucher: CustomerVoucher) => [voucher.id, voucher])).values()];
      return { vouchers, savedIds: Array.isArray(saved) ? saved : [] };
    },
  });
  useEffect(() => {
    if (!userId) return;
    // Schedule the exact expiry/24-hour boundary even if no new API response arrives.
    const current = Date.now();
    const boundaries = (query.data?.vouchers || []).flatMap(voucher => {
      const end = Date.parse(voucher.expiresAt || '');
      return [end, end - VOUCHER_SOON_WINDOW_MS].filter(time => Number.isFinite(time) && time > current);
    });
    const refresh = () => setNow(Date.now());
    const timer = window.setTimeout(refresh, Math.max(1, Math.min(60_000, ...boundaries.map(time => time - current))));
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [query.data, userId, now]);
  const currentTime = Math.max(now, Date.now());
  const vouchers = (query.data?.vouchers || []).filter(voucher => voucherExpiryState(voucher.expiresAt, currentTime) !== 'expired');
  const savedIds: string[] = query.data?.savedIds || [];
  const expiredVouchers = (query.data?.vouchers || [])
    .filter(voucher => savedIds.includes(voucher.id) && voucher.expiresAt && Number.isFinite(Date.parse(voucher.expiresAt)) && voucherExpiryState(voucher.expiresAt, currentTime) === 'expired')
    .sort((a, b) => Date.parse(b.expiresAt!) - Date.parse(a.expiresAt!));

  const toggleSaved = async (voucher: CustomerVoucher) => {
    if (!userId) throw new Error('Vui lòng đăng nhập để lưu voucher.');
    if (voucherExpiryState(voucher.expiresAt) === 'expired') throw new Error('Voucher đã hết hạn sử dụng.');
    const saved = savedIds.includes(voucher.id);
    if (saved) await api.delete(`/coupons/saved/${voucher.id}`);
    else await api.post(`/coupons/saved/${voucher.id}`);
    queryClient.setQueryData<Inventory>(queryKey, (previous) => previous ? {
      ...previous,
      savedIds: saved ? previous.savedIds.filter((id) => id !== voucher.id) : [...new Set([...previous.savedIds, voucher.id])],
    } : previous);
    void queryClient.invalidateQueries({ queryKey, exact: true });
  };
  return { vouchers, expiredVouchers, now: currentTime, savedIds, savedCount: vouchers.filter(v => savedIds.includes(v.id)).length, loading: query.isPending, error: query.isError, toggleSaved };
}
