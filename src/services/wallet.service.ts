import api from "./api";
import type {
  PayoutStatus,
  WalletSummary,
  WithdrawalRequest,
  WithdrawalHistory,
  PayosWalletTopUp,
  LedgerEntry,
  LedgerHistory,
} from '@/types/wallet.types';

export type {
  PayoutStatus,
  WalletSummary,
  WithdrawalRequest,
  WithdrawalHistory,
  PayosWalletTopUp,
  LedgerEntry,
  LedgerHistory,
};

interface ApiEnvelope<T> {
  data: T;
}

export const walletService = {
  async payosAvailability() {
    return (await api.get<never, ApiEnvelope<{ available: boolean }>>('/wallets/top-up-payos/availability', { headers: { 'x-skip-cache': 'true' } })).data;
  },
  async createPayosTopUp(amount: number) {
    return (await api.post<never, ApiEnvelope<PayosWalletTopUp>>('/wallets/top-up-payos', { amount }, { timeout: 20000 })).data;
  },
  async pendingPayosTopUp() {
    return (await api.get<never, ApiEnvelope<PayosWalletTopUp | null>>('/wallets/top-up-payos/pending', { headers: { 'x-skip-cache': 'true' } })).data;
  },
  async payosTopUpStatus(id: string) {
    return (await api.get<never, ApiEnvelope<PayosWalletTopUp>>(`/wallets/top-up-payos/${encodeURIComponent(id)}/status`, { timeout: 20000, headers: { 'x-skip-cache': 'true' } })).data;
  },
  async getMyLedger(page = 1): Promise<LedgerHistory> {
    return (
      await api.get<LedgerHistory, ApiEnvelope<LedgerHistory>>(
        "/wallets/me/ledger",
        { params: { page, limit: 10 }, headers: { 'x-skip-cache': 'true' } },
      )
    ).data;
  },
  async cancelPayosTopUp(id: string) {
    return (await api.post<never, ApiEnvelope<PayosWalletTopUp>>(`/wallets/top-up-payos/${encodeURIComponent(id)}/cancel`, {}, { timeout: 30000 })).data;
  },
  async getMyWallet(): Promise<WalletSummary> {
    return (
      await api.get<WalletSummary, ApiEnvelope<WalletSummary>>("/wallets/me", { headers: { 'x-skip-cache': 'true' } })
    ).data;
  },

  async getMyWithdrawals(page = 1): Promise<WithdrawalHistory> {
    return (
      await api.get<WithdrawalHistory, ApiEnvelope<WithdrawalHistory>>(
        "/wallets/withdrawals",
        {
          params: { page, limit: 10 },
          headers: { 'x-skip-cache': 'true' },
        },
      )
    ).data;
  },

  async createWithdrawal(amount: string, storeId: string) {
    return (
      await api.post<
        never,
        ApiEnvelope<{
          message: string;
          request: WithdrawalRequest;
          availableBalance: string;
        }>
      >("/wallets/withdrawals", { amount, storeId })
    ).data;
  },

  async updateBankAccount(data: {
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
  }) {
    return (
      await api.put<
        never,
        ApiEnvelope<{ success: boolean; message: string }>
      >("/wallets/me/bank-account", data)
    ).data;
  },

  async disconnectBankAccount() {
    return (
      await api.delete<
        never,
        ApiEnvelope<{ success: boolean; message: string }>
      >("/wallets/me/bank-account")
    ).data;
  },

  async topUpDemo(amount: number) {
    return (
      await api.post<
        never,
        ApiEnvelope<{
          message: string;
          amount: number;
          availableBalance: string;
        }>
      >("/wallets/top-up-demo", { amount })
    ).data;
  },
};

