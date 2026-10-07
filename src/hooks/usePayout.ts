import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payoutService, type MerchantPayout } from '../services/payout.service';
import type { PayoutStatus } from '../services/wallet.service';

export const payoutKeys = {
  list: (storeId: string, page: number, status: string) =>
    ['payouts', 'list', storeId, page, status] as const,
  batches: (storeId: string) => ['payouts', 'batches', storeId] as const,
};

export function useStorePayout(storeId: string, page = 1, status: PayoutStatus | '' = '') {
  return useQuery({
    queryKey: payoutKeys.list(storeId, page, status),
    queryFn: () => payoutService.list(storeId, page, status),
    enabled: Boolean(storeId),
  });
}

export function usePayoutBatches(storeId: string) {
  return useQuery({
    queryKey: payoutKeys.batches(storeId),
    queryFn: () => payoutService.batches(storeId),
    enabled: Boolean(storeId),
  });
}

export function useApprovePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payoutId,
      bill,
      options,
    }: {
      payoutId: string;
      bill: File;
      options?: { bankRefCode?: string; note?: string };
    }) => payoutService.approve(payoutId, bill, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });
}

export function useRejectPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storeId,
      payoutId,
      reason,
    }: {
      storeId: string;
      payoutId: string;
      reason: string;
    }) => payoutService.reject(storeId, payoutId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });
}

export function useExportPayoutBatch() {
  return useMutation({
    mutationFn: ({ storeId, payoutIds }: { storeId: string; payoutIds: string[] }) =>
      payoutService.exportBatch(storeId, payoutIds),
  });
}
