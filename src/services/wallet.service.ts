import api from "./api";

export type PayoutStatus = "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";

export interface WalletSummary {
  stores: {
    storeId: string;
    storeName: string;
    pendingBalance: string;
    availableBalance: string;
    isActive: boolean;
  }[];
  unallocatedAvailableBalance: string;
  unallocatedPendingBalance: string;
  pendingBalance: string;
  availableBalance: string;
  minimumWithdrawalAmount: string;
  withdrawalTaxPolicy: { threshold: string; rate: string };
  kycStatus: "UNVERIFIED" | "VERIFIED" | "REJECTED";
  canWithdraw: boolean;
  bankAccount: {
    bankName: string;
    maskedAccountNumber: string;
    accountName: string;
  } | null;
}

export interface WithdrawalRequest {
  storeId: string | null;
  store: { name: string } | null;
  batchId: string | null;
  id: string;
  amount: string;
  taxAmount: string;
  netAmount: string;
  taxCalculated: boolean;
  status: PayoutStatus;
  createdAt: string;
  processedAt: string | null;
}

export interface WithdrawalHistory {
  requests: WithdrawalRequest[];
  total: number;
  page: number;
  limit: number;
}

interface ApiEnvelope<T> {
  data: T;
}

export interface LedgerEntry {
  id: string;
  transactionType:
    | "COMMISSION_PENDING"
    | "COMMISSION_APPROVED"
    | "PAYOUT_WITHDRAW"
    | "REVERSAL"
    | "PAYOUT_REJECT_REFUND";
  balanceBucket: "AVAILABLE" | "PENDING";
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
}

export interface LedgerHistory {
  entries: LedgerEntry[];
  total: number;
  page: number;
  limit: number;
}

export const walletService = {
  async getMyLedger(page = 1): Promise<LedgerHistory> {
    return (
      await api.get<LedgerHistory, ApiEnvelope<LedgerHistory>>(
        "/wallets/me/ledger",
        { params: { page, limit: 10 } },
      )
    ).data;
  },
  async getMyWallet(): Promise<WalletSummary> {
    return (
      await api.get<WalletSummary, ApiEnvelope<WalletSummary>>("/wallets/me")
    ).data;
  },

  async getMyWithdrawals(page = 1): Promise<WithdrawalHistory> {
    return (
      await api.get<WithdrawalHistory, ApiEnvelope<WithdrawalHistory>>(
        "/wallets/withdrawals",
        {
          params: { page, limit: 10 },
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
};
