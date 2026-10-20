import { financeService, type OwnerType } from './finance.service';
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

function mapWithdrawal(w: Awaited<ReturnType<typeof financeService.withdrawals>>['items'][number]): WithdrawalRequest {
  return {
    id: w.withdrawalId,
    amount: String(w.amountVnd ?? 0),
    status: w.status as any,
    requestedAt: w.requestedAt,
    completedAt: w.completedAt,
    failureReason: w.failureReason,
    bankAccountId: w.bankAccountId,
    walletId: w.walletId,
  } as WithdrawalRequest;
}

export const walletService = {
  async payosAvailability() {
    const caps = await financeService.capabilities();
    return { available: caps.paymentAvailable === true };
  },

  async createPayosTopUp(amount: number) {
    const wallet = await financeService.wallet('CUSTOMER');
    const payment = await financeService.topup(
      wallet.walletId,
      amount,
      `topup-${wallet.walletId}-${Date.now()}`,
    );
    return {
      id: payment.paymentId,
      amount,
      status: payment.status,
      checkoutUrl: payment.checkoutUrl,
      qrCode: payment.qrCode,
    } as PayosWalletTopUp;
  },

  async pendingPayosTopUp() {
    const page = await financeService.payments(0);
    const pending = page.items.find((p) =>
      ['PENDING', 'PROCESSING', 'WAITING_PAYMENT'].includes(String(p.status).toUpperCase()),
    );
    if (!pending) return null;
    return {
      id: pending.paymentId,
      amount: pending.amountVnd,
      status: pending.status,
      checkoutUrl: pending.checkoutUrl,
      qrCode: pending.qrCode,
    } as PayosWalletTopUp;
  },

  async payosTopUpStatus(id: string) {
    const payment = await financeService.paymentStatus(id, true);
    return {
      id: payment.paymentId,
      amount: payment.amountVnd,
      status: payment.status,
      checkoutUrl: payment.checkoutUrl,
      qrCode: payment.qrCode,
    } as PayosWalletTopUp;
  },

  async getMyLedger(page = 1): Promise<LedgerHistory> {
    const wallet = await financeService.wallet('CUSTOMER');
    const ledger = await financeService.ledger(wallet.walletId, Math.max(0, page - 1));
    return {
      items: ledger.items.map((e) => ({
        id: e.transactionId,
        type: e.type,
        direction: e.direction,
        amount: String(e.amountVnd),
        balanceAfter: String(e.balanceAfterVnd),
        createdAt: e.createdAt,
        referenceType: e.referenceType,
        referenceId: e.referenceId,
      })),
      pagination: {
        total: ledger.total,
        page: ledger.page + 1,
        limit: ledger.size,
        totalPages: Math.max(1, Math.ceil(ledger.total / ledger.size)),
      },
    } as LedgerHistory;
  },

  async cancelPayosTopUp(id: string) {
    const payment = await financeService.cancelPayment(id);
    return {
      id: payment.paymentId,
      amount: payment.amountVnd,
      status: payment.status,
    } as PayosWalletTopUp;
  },

  async getMyWallet(ownerType: OwnerType = 'CUSTOMER', storeId?: string): Promise<WalletSummary> {
    return mapWallet(await financeService.wallet(ownerType, storeId));
  },

  async getMyWithdrawals(page = 1): Promise<WithdrawalHistory> {
    const wallet = await financeService.wallet('CUSTOMER');
    const result = await financeService.withdrawals(wallet.walletId, Math.max(0, page - 1));
    return {
      items: result.items.map(mapWithdrawal),
      pagination: {
        total: result.total,
        page: result.page + 1,
        limit: result.size,
        totalPages: Math.max(1, Math.ceil(result.total / result.size)),
      },
    } as WithdrawalHistory;
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
    const topup = await this.createPayosTopUp(amount);
    return {
      message: 'Đã tạo yêu cầu nạp tiền',
      amount,
      availableBalance: '0',
      payment: topup,
    };
  },
};
