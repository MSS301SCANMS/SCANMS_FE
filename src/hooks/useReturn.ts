import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returnService, type ReturnStatus, type PickupBookingInput, type ReturnAddress } from '../services/return.service';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const returnKeys = {
  all: ['returns'] as const,
  detail: (id: string) => ['returns', 'detail', id] as const,
  shopQueue: (page?: number, status?: string) => ['returns', 'shop-queue', page, status] as const,
  adminDisputes: ['returns', 'admin-disputes'] as const,
  adminStalled: ['returns', 'admin-stalled'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useReturnDetail(id?: string) {
  return useQuery({
    queryKey: returnKeys.detail(id!),
    queryFn: () => returnService.getOne(id!),
    enabled: Boolean(id),
    refetchInterval: 30000,
  });
}

export function useShopReturnQueue(page = 1, status?: ReturnStatus) {
  return useQuery({
    queryKey: returnKeys.shopQueue(page, status),
    queryFn: () => returnService.getShopQueue(page, status),
    refetchInterval: 60000,
  });
}

export function useAdminReturnDisputes() {
  return useQuery({
    queryKey: returnKeys.adminDisputes,
    queryFn: () => returnService.getAdminDisputes(),
    refetchInterval: 60000,
  });
}

export function useAdminStalledReturns() {
  return useQuery({
    queryKey: returnKeys.adminStalled,
    queryFn: () => returnService.getAdminStalled(),
  });
}

// ─── Shared invalidation helper ───────────────────────────────────────────────
function useReturnMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
  id: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: returnKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: returnKeys.all });
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSetReturnInstructions(id: string) {
  return useReturnMutation(
    (data: { returnAddress: string; returnInstructions: string }) =>
      returnService.setInstructions(id, data),
    id,
  );
}

export function useSaveReturnWarehouse(id: string) {
  return useReturnMutation(
    (data: ReturnAddress) => returnService.saveWarehouse(id, data),
    id,
  );
}

export function useBookPickup(id: string) {
  return useReturnMutation(
    (data: PickupBookingInput) => returnService.bookPickup(id, data),
    id,
  );
}

export function useSimulatePickup(id: string) {
  return useReturnMutation(
    (data: { status: 'picked' | 'delivered' }) => returnService.simulatePickup(id, data),
    id,
  );
}

export function useConfirmShipment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { carrierName: string; trackingNumber: string; receipt: File }) =>
      returnService.submitShipment(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: returnKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: returnKeys.all });
    },
  });
}

export function useCorrectShipment(id: string) {
  return useReturnMutation(
    (data: { carrierName: string; trackingNumber: string }) =>
      returnService.correctShipment(id, data),
    id,
  );
}

export function useConfirmReceipt(id: string) {
  return useReturnMutation(() => returnService.confirmReceipt(id), id);
}

export function useStartInspection(id: string) {
  return useReturnMutation(() => returnService.startInspection(id), id);
}

export function useSubmitInspection(id: string) {
  return useReturnMutation(
    (data: { resolution: 'REFUND' | 'EXCHANGE' | 'REJECT'; notes: string }) =>
      returnService.submitInspection(id, data),
    id,
  );
}

export function useSubmitExchangeShipment(id: string) {
  return useReturnMutation(
    (data: { carrierName: string; trackingNumber: string }) =>
      returnService.submitExchangeShipment(id, data),
    id,
  );
}

export function useConfirmReturnCompletion(id: string) {
  return useReturnMutation(() => returnService.confirmCompletion(id), id);
}

export function useOpenDispute(id: string) {
  return useReturnMutation(
    (data: { reason: string; details: string }) => returnService.openDispute(id, data),
    id,
  );
}

export function useResolveDispute(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { ruling: 'APPROVE_REFUND' | 'APPROVE_EXCHANGE' | 'UPHOLD_SHOP'; notes: string }) =>
      returnService.resolveDispute(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: returnKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: returnKeys.adminDisputes });
    },
  });
}

export function useReturnAction<T>(id: string, action: (id: string, data: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: T) => action(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: returnKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: returnKeys.all });
    },
  });
}
