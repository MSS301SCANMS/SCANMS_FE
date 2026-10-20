export type PayoutStatus = "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";

export interface WalletSummary {
  cooperationStores?: {
    storeId: string;
    storeName: string;
    logoUrl: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
    requestedByKol: boolean;
    availableBalance: string;
    pendingBalance: string;
    hasWallet: boolean;
  }[];
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

export interface PayosWalletTopUp {
  id: string;
  orderCode: number;
  amount: number;
  status: 'CREATING' | 'PENDING' | 'UNDERPAID' | 'PROCESSING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'FAILED';
  paymentLinkId: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
  bin: string | null;
  accountNumber: string | null;
  accountName: string | null;
  description: string | null;
  expiresAt: string;
  paidAt: string | null;
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
