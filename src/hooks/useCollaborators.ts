import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ShopCollaboratorMember {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
  createdAt: string;
  collaborator: {
    fullName: string;
    email: string;
    collaboratorProfile?: { totalFollowers: number; kycStatus: string };
    socialChannels?: Array<{ platformName: string; channelName?: string; followerCount: number }>;
  };
}

export interface ShopCollaboratorsResponse {
  members: ShopCollaboratorMember[];
  store?: { id: string; name: string };
}

/** Profile hồ sơ cộng tác viên (promotion-affiliate-service) */
export interface CollaboratorProfile {
  id: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE';
  kycStatus?: string;
  totalFollowers?: number;
  totalOrdersReferred?: number;
  rejectedReason?: string;
  createdAt?: string;
  user?: { id: string; fullName: string; email: string; avatarUrl?: string };
}

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const collaboratorKeys = {
  all: ['collaborators'] as const,
  storeInvitations: ['collaborators', 'store-invitations'] as const,
  storeList: (storeId?: string) => ['collaborators', 'store-list', storeId] as const,
  shopTeam: ['collaborators', 'shop-team'] as const,
  profiles: ['collaborators', 'profiles'] as const,
  profile: (id: string) => ['collaborators', 'profile', id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** KOL: Lấy các lời mời hợp tác từ shop */
export function useCollaboratorInvitations() {
  return useQuery({
    queryKey: collaboratorKeys.storeInvitations,
    queryFn: async () => {
      const res: any = await api.get('/store-collaborators/my-invitations');
      return res?.data || res || [];
    },
  });
}

/** Shop: Lấy danh sách members + store info */
export function useShopCollaboratorTeam() {
  return useQuery({
    queryKey: collaboratorKeys.shopTeam,
    queryFn: async (): Promise<ShopCollaboratorsResponse> => {
      const res: any = await api.get('/store-collaborators/shop');
      return res?.data || res || { members: [] };
    },
  });
}

/** Shop: Lấy danh sách collaborators của store (by storeId) */
export function useStoreCollaborators(storeId?: string) {
  return useQuery({
    queryKey: collaboratorKeys.storeList(storeId),
    queryFn: async () => {
      const endpoint = storeId
        ? `/store-collaborators?storeId=${storeId}`
        : '/store-collaborators';
      const res: any = await api.get(endpoint);
      return res?.data || res || [];
    },
  });
}

/** Admin: Lấy tất cả hồ sơ cộng tác viên (CollaboratorProfile) */
export function useAllCollaboratorProfiles() {
  return useQuery({
    queryKey: collaboratorKeys.profiles,
    queryFn: async (): Promise<CollaboratorProfile[]> => {
      const res: any = await api.get('/collaborators');
      return res?.data || res || [];
    },
  });
}

/** Admin: Lấy chi tiết một hồ sơ cộng tác viên */
export function useCollaboratorProfile(id: string) {
  return useQuery({
    queryKey: collaboratorKeys.profile(id),
    queryFn: async (): Promise<CollaboratorProfile> => {
      const res: any = await api.get(`/collaborators/${id}`);
      return res?.data || res;
    },
    enabled: Boolean(id),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Shop: Mời KOL mới bằng email */
export function useInviteCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, email }: { storeId: string; email: string }) =>
      api.post('/store-collaborators/invite', { storeId, email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaboratorKeys.all });
    },
  });
}

/** Admin/Manager: Duyệt hồ sơ CTV — PENDING → APPROVED */
export function useApproveCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/collaborators/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaboratorKeys.profiles });
    },
  });
}

/** Admin/Manager: Từ chối hồ sơ CTV — PENDING → REJECTED */
export function useRejectCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/collaborators/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaboratorKeys.profiles });
    },
  });
}
