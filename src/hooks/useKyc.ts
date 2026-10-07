import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kycService, type ApplyKolData, type ApplyShopData } from '../services/kyc.service';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const kycKeys = {
  myProfile: ['kyc', 'my-profile'] as const,
  myUpgradeStatus: ['kyc', 'my-upgrade-status'] as const,
  pendingList: ['kyc', 'admin', 'pending'] as const,
  applications: ['kyc', 'admin', 'applications'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useMyKyc() {
  return useQuery({
    queryKey: kycKeys.myProfile,
    queryFn: () => kycService.getMyKyc(),
  });
}

export function useMyUpgradeStatus() {
  return useQuery({
    queryKey: kycKeys.myUpgradeStatus,
    queryFn: () => kycService.getMyUpgradeStatus(),
  });
}

export function usePendingKyc() {
  return useQuery({
    queryKey: kycKeys.pendingList,
    queryFn: () => kycService.getPendingKyc(),
  });
}

export function useKycApplications() {
  return useQuery({
    queryKey: kycKeys.applications,
    queryFn: () => kycService.getUpgradeApplications(),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSubmitKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof kycService.submitKyc>[0]) => kycService.submitKyc(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.myProfile });
    },
  });
}

export function useApplyKolUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplyKolData) => kycService.applyKolUpgrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.myUpgradeStatus });
    },
  });
}

export function useApplyShopUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplyShopData) => kycService.applyShopUpgrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.myUpgradeStatus });
    },
  });
}

export function useReviewKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      status,
      note,
    }: {
      profileId: string;
      status: 'VERIFIED' | 'REJECTED';
      note?: string;
    }) => kycService.reviewKyc(profileId, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.pendingList });
      queryClient.invalidateQueries({ queryKey: kycKeys.applications });
    },
  });
}

export function useReviewKolApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      status,
      note,
    }: {
      profileId: string;
      status: 'VERIFIED' | 'REJECTED';
      note?: string;
    }) => kycService.reviewKolApplication(profileId, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.applications });
    },
  });
}

export function useReviewShopApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storeId,
      status,
      note,
    }: {
      storeId: string;
      status: 'VERIFIED' | 'NEEDS_INFO' | 'REJECTED';
      note?: string;
    }) => kycService.reviewShopApplication(storeId, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycKeys.applications });
    },
  });
}
