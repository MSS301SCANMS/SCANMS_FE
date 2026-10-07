import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const campaignKeys = {
  all: ['campaigns'] as const,
  myInvitations: ['campaigns', 'my-invitations'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useMyCampaignInvitations() {
  return useQuery({
    queryKey: campaignKeys.myInvitations,
    queryFn: async () => {
      const res: any = await api.get('/campaigns/my-invitations');
      return res?.data || res || [];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useAcceptCampaignInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) =>
      api.patch(`/campaigns/invitations/${participantId}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.myInvitations });
    },
  });
}

export function useRejectCampaignInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participantId: string) =>
      api.patch(`/campaigns/invitations/${participantId}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.myInvitations });
    },
  });
}
