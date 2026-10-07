import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService } from '../services/wallet.service';

export const walletKeys = {
  summary: ['wallet', 'summary'] as const,
  ledger: (page: number) => ['wallet', 'ledger', page] as const,
  withdrawals: (page: number) => ['wallet', 'withdrawals', page] as const,
};

export function useWalletSummary() {
  return useQuery({
    queryKey: walletKeys.summary,
    queryFn: () => walletService.getMyWallet(),
  });
}

export function useWalletLedger(page = 1) {
  return useQuery({
    queryKey: walletKeys.ledger(page),
    queryFn: () => walletService.getMyLedger(page),
  });
}

export function useWalletWithdrawals(page = 1) {
  return useQuery({
    queryKey: walletKeys.withdrawals(page),
    queryFn: () => walletService.getMyWithdrawals(page),
  });
}

export function useCreateWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, storeId }: { amount: string; storeId: string }) =>
      walletService.createWithdrawal(amount, storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.summary });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'withdrawals'] });
    },
  });
}

export function useDisconnectBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => walletService.disconnectBankAccount(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.summary });
    },
  });
}
