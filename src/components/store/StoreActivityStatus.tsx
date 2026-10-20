import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

interface Presence { isOnline: boolean; lastActiveAt: string | null; checkedAt: string }

export function storeActivityLabel(presence?: Presence) {
  if (!presence) return 'Chưa có thông tin hoạt động';
  const timestamp = Date.parse(presence.lastActiveAt || '');
  const checkedAt = Date.parse(presence.checkedAt);
  if (!Number.isFinite(timestamp) || !Number.isFinite(checkedAt)) return 'Chưa có thông tin hoạt động';
  if (presence.isOnline) return 'Đang trực tuyến';
  const minutes = Math.max(1, Math.floor((checkedAt - timestamp) / 60_000));
  if (minutes < 60) return `Hoạt động ${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hoạt động ${hours} giờ trước`;
  return `Hoạt động ${Math.floor(hours / 24)} ngày trước`;
}

export function StoreActivityStatus({ storeId, className = '' }: { storeId?: string; className?: string }) {
  const { data, isError, isFetching, dataUpdatedAt } = useQuery<Presence>({
    queryKey: ['store-presence', storeId], enabled: Boolean(storeId), staleTime: 0, refetchInterval: 30_000,
    queryFn: async ({ signal }) => {
      const res: any = await api.get(`/stores/public/id/${storeId}/presence`, { signal, headers: { 'x-skip-cache': 'true' } });
      return res?.data?.data ?? res?.data ?? res;
    },
  });
  // Never leave a stale green indicator visible after a failed refresh or a suspended tab.
  const current = !isError && !(isFetching && Date.now() - dataUpdatedAt > 45_000) ? data : undefined;
  const label = storeActivityLabel(current);
  const online = current?.isOnline && label === 'Đang trực tuyến';
  return <span className={`inline-flex items-center gap-1.5 text-[11px] font-normal leading-4 text-[#7D715E] ${className}`} data-store-presence={online ? 'online' : 'offline'}>
    {online && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#059669]" aria-hidden="true" />}
    <span>{label}</span>
  </span>;
}
