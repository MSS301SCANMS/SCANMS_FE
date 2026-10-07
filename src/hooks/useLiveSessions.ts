import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const liveSessionKeys = {
  all: ['live-sessions'] as const,
  kolMy: ['live-sessions', 'kol-my'] as const,
  shopList: ['live-sessions', 'shop'] as const,
  adminList: ['live-sessions', 'admin'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Danh sách live sessions của KOL (invitations) */
export function useKolLiveSessions() {
  return useQuery({
    queryKey: liveSessionKeys.kolMy,
    queryFn: async () => {
      const res: any = await api.get('/live-sessions/my');
      return res?.data || res || [];
    },
  });
}

/** Danh sách live sessions của Shop */
export function useShopLiveSessions() {
  return useQuery({
    queryKey: liveSessionKeys.shopList,
    queryFn: async () => {
      const res: any = await api.get('/live-sessions/shop');
      return res?.data || res || [];
    },
  });
}

/** Admin quản lý live sessions */
export function useAdminLiveSessions() {
  return useQuery({
    queryKey: liveSessionKeys.adminList,
    queryFn: async () => {
      const res: any = await api.get('/live-sessions/admin');
      return res?.data || res || [];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** KOL chấp nhận / từ chối lời mời tham gia live */
export function useRespondLiveInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, accepted }: { sessionId: string; accepted: boolean }) =>
      api.patch(`/live-sessions/my/${sessionId}/respond`, { accepted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveSessionKeys.kolMy });
    },
  });
}

/** Shop thay đổi trạng thái phiên live (start, end, cancel...) */
export function useUpdateLiveSessionState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, action }: { sessionId: string; action: string }) =>
      api.patch(`/live-sessions/shop/${sessionId}/state`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveSessionKeys.shopList });
    },
  });
}
