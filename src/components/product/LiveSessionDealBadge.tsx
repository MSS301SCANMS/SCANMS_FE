import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

export type LiveSessionDeal = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  coupon?: { displayCode: string; discountType: string; discountValue: number | string };
};

export function useLiveSessionDeals(productIds: string[]) {
  const productIdsKey = useMemo(() => [...new Set(productIds.filter(Boolean))].sort().join(','), [productIds]);
  const [deals, setDeals] = useState<Record<string, LiveSessionDeal>>({});
  const [serverOffset, setServerOffset] = useState(0);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let current = true;
    let refreshTimer: number | undefined;
    const load = async () => {
      if (!productIdsKey) {
        setDeals({});
        return;
      }
      try {
        const productIds = productIdsKey.split(',');
        const chunks = Array.from({ length: Math.ceil(productIds.length / 100) }, (_, index) => productIds.slice(index * 100, (index + 1) * 100));
        const payloads: any[] = await Promise.all(chunks.map(async (chunk) => {
          const response: any = await api.get('/live-sessions/products/active', {
            params: { productIds: chunk.join(',') },
            headers: { 'x-skip-cache': 'true' },
          });
          return response?.data?.data ?? response?.data ?? response;
        }));
        if (!current) return;
        setDeals(Object.assign({}, ...payloads.map((payload) => payload?.sessionsByProductId || {})));
        const serverTime = Date.parse(payloads[0]?.serverTime || '');
        if (Number.isFinite(serverTime)) setServerOffset(serverTime - Date.now());
      } catch {
        if (current) setDeals({});
      } finally {
        if (current) refreshTimer = window.setTimeout(() => void load(), 30_000);
      }
    };
    void load();
    return () => {
      current = false;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
    };
  }, [productIdsKey]);

  return { deals, now: tick + serverOffset };
}

export function LiveSessionDealBadge({
  deal,
  now,
  className = '',
}: {
  deal?: LiveSessionDeal;
  now: number;
  className?: string;
}) {
  if (!deal) return null;
  const startsAt = Date.parse(deal.startsAt);
  const endsAt = Date.parse(deal.endsAt);
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || now >= endsAt) return null;
  const isLive = now >= startsAt;
  const seconds = Math.max(0, Math.ceil(((isLive ? endsAt : startsAt) - now) / 1000));
  const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');

  return (
    <span className={`absolute bottom-2 left-2 z-20 inline-flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB]/95 px-2 py-1 text-[10px] font-extrabold text-[#6E4B1F] shadow-sm backdrop-blur-sm sm:text-xs ${className}`}>
      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#C59B58]" />
      <span className="truncate">{isLive ? 'DEAL PHIÊN LIVE' : 'SẮP LIVE'}</span>
      <span className="shrink-0 tabular-nums">{hours}:{minutes}:{remainingSeconds}</span>
    </span>
  );
}
