import { financeService, type OwnerType, type MoneyPayment } from './finance.service';
import type {
  WalletSummary,
  WithdrawalRequest,
  WithdrawalHistory,
  PayosWalletTopUp,
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
} from '@/types/wallet.types';

function mapWallet(w: Awaited<ReturnType<typeof financeService.wallet>>): WalletSummary {
  const available = String(w.availableBalanceVnd ?? 0);
  const held = String(w.heldBalanceVnd ?? 0);
  return {
    stores: [],
    unallocatedAvailableBalance: available,
    unallocatedPendingBalance: held,
    pendingBalance: held,
    availableBalance: available,
    minimumWithdrawalAmount: '50000',
    withdrawalTaxPolicy: { threshold: '0', rate: '0' },
    kycStatus: 'VERIFIED',
    canWithdraw: w.status === 'ACTIVE',
    bankAccount: null,
  };
}

function mapTopUp(payment: MoneyPayment): PayosWalletTopUp {
  return {
    id: payment.paymentId,
    orderCode: payment.providerOrderCode,
    amount: payment.amountVnd,
    status: payment.status === 'SUCCESS' ? 'PAID' : payment.status as PayosWalletTopUp['status'],
    paymentLinkId: null,
    checkoutUrl: payment.checkoutUrl,
    qrCode: payment.qrCode,
    bin: payment.bin ?? null,
    accountNumber: payment.accountNumber ?? null,
    accountName: payment.accountName ?? null,
    description: payment.description ?? null,
    expiresAt: payment.expiresAt ? `${payment.expiresAt}${/[Zz]|[+-]\d\d:\d\d$/.test(payment.expiresAt) ? '' : 'Z'}` : '',
    paidAt: payment.verifiedAt,
  };
}

// Retain the same command after a lost response, including a page reload.
function topUpCommand(walletId: string, amount: number, channel: string) {
  const storageKey = `scanms-topup:${channel}:${walletId}:${amount}`;
  let key = sessionStorage.getItem(storageKey);
  if (!key) { key = crypto.randomUUID(); sessionStorage.setItem(storageKey, key); }
  return { key, complete: () => sessionStorage.removeItem(storageKey) };
}

function mapWithdrawal(w: Awaited<ReturnType<typeof financeService.withdrawals>>['items'][number]): WithdrawalRequest {
  return {
    id: w.withdrawalId,
    amount: String(w.amountVnd ?? 0),
    status: (w.status as any) || 'PENDING',
    requestedAt: w.requestedAt,
    completedAt: w.completedAt,
    failureReason: w.failureReason,
    bankAccountId: w.bankAccountId,
    walletId: w.walletId,
    createdAt: w.requestedAt || new Date().toISOString(),
    processedAt: w.completedAt,
    taxAmount: '0',
    netAmount: String(w.amountVnd ?? 0),
    taxCalculated: false,
    storeId: null,
    store: null,
    batchId: null,
  } as unknown as WithdrawalRequest;
}

export const walletService = {
  async payosAvailability() {
    const caps = await financeService.capabilities();
    return { available: caps.paymentAvailable === true };
  },

  async sandboxAvailability() {
    return (await financeService.capabilities()).sandboxTopUpAvailable === true;
  },

  async createPayosTopUp(amount: number) {
    const wallet = await financeService.wallet('CUSTOMER');
    const command = topUpCommand(wallet.walletId, amount, 'payos');
    const payment = await financeService.topup(
      wallet.walletId,
      amount,
      command.key,
    );
    command.complete();
    return mapTopUp(payment);
  },

  async pendingPayosTopUp() {
    const page = await financeService.payments(0);
    const pending = page.items.find((p) =>
      p.purpose === 'TOP_UP' &&
      ['PENDING', 'PROCESSING', 'WAITING_PAYMENT'].includes(String(p.status).toUpperCase()),
    );
    if (!pending) return null;
    return mapTopUp(pending);
  },

  async payosTopUpStatus(id: string) {
    const payment = await financeService.paymentStatus(id, true);
    if (payment.purpose !== 'TOP_UP') throw new Error('Giao dịch này không phải nạp tiền vào ví.');
    return mapTopUp(payment);
  },

  async getMyLedger(page = 1): Promise<LedgerHistory> {
    const wallet = await financeService.wallet('CUSTOMER');
    const ledger = await financeService.ledger(wallet.walletId, Math.max(0, page - 1));
    const entries = ledger.items.map((e) => ({
      id: e.transactionId,
      type: e.type,
      direction: e.direction,
      amount: String(e.amountVnd),
      balanceBefore: String(e.balanceBeforeVnd),
      balanceAfter: String(e.balanceAfterVnd),
      createdAt: e.createdAt,
      referenceType: e.type === 'TOP_UP' && e.referenceType !== 'TOPUP_DEMO' ? 'TOPUP_PAYOS' : e.type === 'REFUND' ? 'ORDER_REFUND' : e.type === 'ORDER_PAYMENT' ? 'ORDER_PAYMENT' : e.referenceType,
      referenceId: e.referenceId,
      transactionType: (e.type || 'PAYOUT_WITHDRAW') as any,
      balanceBucket: (e.direction === 'CREDIT' ? 'AVAILABLE' : 'PENDING') as any,
    }));
    return {
      entries: entries as any,
      items: entries,
      total: ledger.total,
      page: ledger.page + 1,
      limit: ledger.size,
      pagination: {
        total: ledger.total,
        page: ledger.page + 1,
        limit: ledger.size,
        totalPages: Math.max(1, Math.ceil(ledger.total / ledger.size)),
      },
    } as unknown as LedgerHistory;
  },

  async cancelPayosTopUp(id: string) {
    const payment = await financeService.cancelPayment(id);
    return mapTopUp(payment);
  },

  async getMyWallet(ownerType: OwnerType = 'CUSTOMER', storeId?: string): Promise<WalletSummary> {
    return mapWallet(await financeService.wallet(ownerType, storeId));
  },

  async getMyWithdrawals(page = 1): Promise<WithdrawalHistory> {
    const wallet = await financeService.wallet('CUSTOMER');
    const result = await financeService.withdrawals(wallet.walletId, Math.max(0, page - 1));
    const requests = result.items.map(mapWithdrawal);
    return {
      requests,
      items: requests,
      total: result.total,
      page: result.page + 1,
      limit: result.size,
      pagination: {
        total: result.total,
        page: result.page + 1,
        limit: result.size,
        totalPages: Math.max(1, Math.ceil(result.total / result.size)),
      },
    } as unknown as WithdrawalHistory;
  },

  async createWithdrawal(amount: string, storeId: string) {
    const ownerType: OwnerType = storeId ? 'STORE' : 'CUSTOMER';
    const wallet = await financeService.wallet(ownerType, storeId || undefined);
    const banks = await financeService.banks(ownerType, storeId || wallet.ownerRefId);
    const bank = banks.find((b) => b.active && b.verificationStatus === 'VERIFIED') || banks[0];
    if (!bank) throw new Error('Chưa có tài khoản ngân hàng để rút tiền.');
    const withdrawal = await financeService.withdraw({
      walletId: wallet.walletId,
      bankAccountId: bank.bankAccountId,
      amountVnd: Number(amount),
      idempotencyKey: `wd-${wallet.walletId}-${Date.now()}`,
    });
    return {
      message: 'Đã tạo yêu cầu rút tiền',
      request: mapWithdrawal(withdrawal),
      availableBalance: String(wallet.availableBalanceVnd),
    };
  },

  async updateBankAccount(data: {
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    bankCode?: string;
    ownerType?: OwnerType;
    ownerRefId?: string;
  }) {
    await financeService.registerBank({
      ownerType: data.ownerType || 'CUSTOMER',
      ownerRefId: data.ownerRefId || 'me',
      bankCode: data.bankCode || data.bankName,
      holderName: data.bankAccountName,
      accountNumber: data.bankAccountNumber,
    });
    return { success: true, message: 'Đã cập nhật tài khoản ngân hàng' };
  },

  async disconnectBankAccount(bankAccountId?: string) {
    if (!bankAccountId) {
      const banks = await financeService.banks('CUSTOMER');
      const active = banks.find((b) => b.active);
      if (!active) return { success: true, message: 'Không có tài khoản ngân hàng' };
      await financeService.deactivateBank(active.bankAccountId);
    } else {
      await financeService.deactivateBank(bankAccountId);
    }
    return { success: true, message: 'Đã ngắt liên kết tài khoản ngân hàng' };
  },

  async topUpDemo(amount: number) {
    const wallet = await financeService.wallet('CUSTOMER');
    const command = topUpCommand(wallet.walletId, amount, 'sandbox');
    const entry = await financeService.sandboxTopup(wallet.walletId, amount, command.key);
    command.complete();
    return {
      message: 'Đã nạp tiền thử nghiệm',
      amount,
      availableBalance: String(entry.balanceAfterVnd),
    };
  },
};
