import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  couponService,
  type CouponFilterParams,
  type CreateStoreCouponPayload,
  type ValidateCouponPayload,
} from '../services/coupon.service';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const couponKeys = {
  all: ['coupons'] as const,
  kolList: (params?: object) => ['coupons', 'kol', params] as const,
  kolDetail: (id: string) => ['coupons', 'kol', 'detail', id] as const,
  storeList: (storeId: string, params?: object) => ['coupons', 'store', storeId, params] as const,
  adminList: (params?: object) => ['coupons', 'admin', params] as const,
  publicStore: (storeId: string) => ['coupons', 'public', storeId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePublicStoreCoupons(storeId: string) {
  return useQuery({
    queryKey: couponKeys.publicStore(storeId),
    queryFn: () => couponService.getPublicStoreCoupons(storeId),
    enabled: Boolean(storeId),
  });
}

export function useKolCoupons(params?: CouponFilterParams) {
  return useQuery({
    queryKey: couponKeys.kolList(params),
    queryFn: () => couponService.getKolCoupons(params),
  });
}

export function useKolCouponDetail(id: string) {
  return useQuery({
    queryKey: couponKeys.kolDetail(id),
    queryFn: () => couponService.getKolCouponDetail(id),
    enabled: Boolean(id),
  });
}

export function useStoreCoupons(storeId: string, params?: CouponFilterParams) {
  return useQuery({
    queryKey: couponKeys.storeList(storeId, params),
    queryFn: () => couponService.getStoreCoupons(storeId, params),
    enabled: Boolean(storeId),
  });
}

export function useAdminCoupons(params?: CouponFilterParams) {
  return useQuery({
    queryKey: couponKeys.adminList(params),
    queryFn: () => couponService.getAdminCoupons(params),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useValidateCoupon() {
  return useMutation({
    mutationFn: (payload: ValidateCouponPayload) => couponService.validateCoupon(payload),
  });
}

export function useProposeCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof couponService.proposeCoupon>[0]) =>
      couponService.proposeCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

export function useTogglePauseCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => couponService.togglePauseCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      couponService.deleteCoupon(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

export function useCreateStoreCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, payload }: { storeId: string; payload: CreateStoreCouponPayload }) =>
      couponService.createStoreCoupon(storeId, payload),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: couponKeys.storeList(storeId) });
    },
  });
}
