import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SampleRequestEligibility {
  eligible: boolean;
  reason?: string;
  nextEligibleAt?: string | null;
  remainingQuota?: number | null;
}

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const sampleRequestKeys = {
  all: ['sample-requests'] as const,
  mine: ['sample-requests', 'mine'] as const,
  eligibility: ['sample-requests', 'eligibility'] as const,
  shop: ['sample-requests', 'shop'] as const,
  shopStats: ['sample-requests', 'shop-stats'] as const,
  admin: ['sample-requests', 'admin'] as const,
  adminBlocked: ['sample-requests', 'admin-blocked'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useMySampleRequests() {
  return useQuery({
    queryKey: sampleRequestKeys.mine,
    queryFn: async () => {
      const res: any = await api.get('/sample-requests/my', { headers: { 'x-skip-cache': 'true' } });
      return res?.data || res || [];
    },
  });
}

export function useSampleRequestEligibility() {
  return useQuery({
    queryKey: sampleRequestKeys.eligibility,
    queryFn: async () => {
      const res: any = await api.get('/sample-requests/my/eligibility').catch(() => null);
      return res?.data || res;
    },
  });
}

export function useShopSampleRequests() {
  return useQuery({
    queryKey: sampleRequestKeys.shop,
    queryFn: async () => {
      const res: any = await api.get('/sample-requests/shop');
      return res?.data || res || [];
    },
  });
}

export function useShopSampleStats() {
  return useQuery({
    queryKey: sampleRequestKeys.shopStats,
    queryFn: async () => {
      const res: any = await api.get('/sample-requests/shop/stats').catch(() => null);
      return res?.data || res;
    },
  });
}

export function useAdminSampleRequests() {
  return useQuery({
    queryKey: sampleRequestKeys.admin,
    queryFn: async () => {
      const res: any = await api.get('/sample-requests/admin', { headers: { 'x-skip-cache': 'true' } });
      return res?.data || res || [];
    },
  });
}

export function useAdminBlockedSampleRequests() {
  return useQuery({
    queryKey: sampleRequestKeys.adminBlocked,
    queryFn: async () => {
      const res: any = await api.get('/sample-requests/admin/blocked', { headers: { 'x-skip-cache': 'true' } });
      return res?.data || res || [];
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useApproveSampleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/sample-requests/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sampleRequestKeys.all });
    },
  });
}

export function useRejectSampleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/sample-requests/${id}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sampleRequestKeys.all });
    },
  });
}

export function useShipSampleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { carrierName: string; trackingNumber: string } }) =>
      api.patch(`/sample-requests/${id}/ship`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sampleRequestKeys.all });
    },
  });
}

export function useCancelSampleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/sample-requests/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sampleRequestKeys.mine });
    },
  });
}

export function useReceiveSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/sample-requests/${id}/receive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sampleRequestKeys.mine });
    },
  });
}

export function useReportDeliveryIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/sample-requests/${id}/delivery-issue`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sampleRequestKeys.mine });
    },
  });
}

export function useSubmitSampleVideo() {
  return useMutation({
    mutationFn: ({ sampleRequestId, payload }: { sampleRequestId: string; payload: any }) =>
      api.post(`/sample-requests/${sampleRequestId}/video`, payload),
  });
}
