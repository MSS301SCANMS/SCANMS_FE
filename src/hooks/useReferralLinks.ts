import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  referralLinksService,
  type CreateReferralLinkPayload,
  type QueryReferralLinksParams,
} from '../services/referral-links.service';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const referralLinkKeys = {
  all: ['referral-links'] as const,
  myLinks: (params?: object) => ['referral-links', 'mine', params] as const,
  detail: (id: string) => ['referral-links', 'detail', id] as const,
  eligibleProducts: (params?: object) => ['referral-links', 'eligible-products', params] as const,
  storeLinks: (storeId: string, params?: object) => ['referral-links', 'store', storeId, params] as const,
  adminLinks: (params?: object) => ['referral-links', 'admin', params] as const,
  myDeals: ['referral-links', 'my-deals'] as const,
  shopDeals: ['referral-links', 'shop-deals'] as const,
  myDealStatus: ['referral-links', 'my-deal-status'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useMyReferralLinks(params?: QueryReferralLinksParams) {
  return useQuery({
    queryKey: referralLinkKeys.myLinks(params),
    queryFn: () => referralLinksService.getMyLinks(params),
  });
}

export function useReferralLinkDetail(id: string) {
  return useQuery({
    queryKey: referralLinkKeys.detail(id),
    queryFn: () => referralLinksService.getLinkDetail(id),
    enabled: Boolean(id),
  });
}

export function useEligibleProducts(params?: { search?: string; storeId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: referralLinkKeys.eligibleProducts(params),
    queryFn: () => referralLinksService.getEligibleProducts(params),
  });
}

export function useStoreReferralLinks(storeId: string, params?: QueryReferralLinksParams) {
  return useQuery({
    queryKey: referralLinkKeys.storeLinks(storeId, params),
    queryFn: () => referralLinksService.getStoreLinks(storeId, params),
    enabled: Boolean(storeId),
  });
}

export function useAdminReferralLinks(params?: QueryReferralLinksParams) {
  return useQuery({
    queryKey: referralLinkKeys.adminLinks(params),
    queryFn: () => referralLinksService.getAdminReferralLinks(params),
  });
}

export function useMyExclusiveDeals() {
  return useQuery({
    queryKey: referralLinkKeys.myDeals,
    queryFn: () => referralLinksService.getMyExclusiveDeals(),
  });
}

export function useShopExclusiveDeals() {
  return useQuery({
    queryKey: referralLinkKeys.shopDeals,
    queryFn: () => referralLinksService.getShopExclusiveDeals(),
  });
}

export function useMyDealStatus() {
  return useQuery({
    queryKey: referralLinkKeys.myDealStatus,
    queryFn: () => referralLinksService.getMyDealStatus(),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateReferralLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReferralLinkPayload) => referralLinksService.createLink(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralLinkKeys.all });
    },
  });
}

export function useUpdateReferralLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateReferralLinkPayload> }) =>
      referralLinksService.updateLink(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: referralLinkKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: referralLinkKeys.all });
    },
  });
}

export function useToggleReferralLinkStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => referralLinksService.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralLinkKeys.all });
    },
  });
}

export function useDeleteReferralLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => referralLinksService.deleteLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralLinkKeys.all });
    },
  });
}

export function useBlockReferralLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, linkId, reason }: { storeId: string; linkId: string; reason: string }) =>
      referralLinksService.blockLink(storeId, linkId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralLinkKeys.all });
    },
  });
}

export function useUnblockReferralLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, linkId }: { storeId: string; linkId: string }) =>
      referralLinksService.unblockLink(storeId, linkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralLinkKeys.all });
    },
  });
}

export function useCreateExclusiveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof referralLinksService.createExclusiveDeal>[0]) =>
      referralLinksService.createExclusiveDeal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralLinkKeys.myDeals });
    },
  });
}

export function useApproveExclusiveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => referralLinksService.approveExclusiveDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralLinkKeys.shopDeals });
    },
  });
}

export function useRejectExclusiveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      referralLinksService.rejectExclusiveDeal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralLinkKeys.shopDeals });
    },
  });
}

export function useTerminateExclusiveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { reason: string; escalateDispute?: boolean } }) =>
      referralLinksService.terminateExclusiveDeal(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: referralLinkKeys.all });
    },
  });
}

export function useDownloadQrCode() {
  return useMutation({
    mutationFn: ({
      id,
      shortCode,
      format,
      size,
    }: {
      id: string;
      shortCode: string;
      format?: 'png' | 'svg';
      size?: number;
    }) => referralLinksService.downloadQrCode(id, shortCode, format, size),
  });
}
