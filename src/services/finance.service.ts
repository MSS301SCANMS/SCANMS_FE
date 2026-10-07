import axios from 'axios';

const client = axios.create({ baseURL: import.meta.env.VITE_FINANCE_API_URL || 'http://localhost:8080/api/v1/finance', timeout: 20000 });
client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
client.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) return Promise.reject(new Error('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Đăng nhập lại để tiếp tục.'));
  if (error.response?.status === 403) return Promise.reject(new Error(error.response?.data?.message || 'Bạn không có quyền truy cập tài khoản hoặc chức năng này.'));
  return Promise.reject(new Error(error.response?.data?.message || error.response?.data?.detail || 'Không thể kết nối dịch vụ tài chính. Hãy tải lại để kiểm tra kết quả trước khi gửi lại.'));
});
export type OwnerType = 'CUSTOMER' | 'STORE' | 'COLLABORATOR' | 'PLATFORM';
export type WithdrawalStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REJECTED' | 'CANCELLED';
export interface MoneyWallet { walletId: string; ownerType: OwnerType; ownerRefId: string; currency: string; availableBalanceVnd: number; heldBalanceVnd: number; status: 'ACTIVE' | 'FROZEN' | 'CLOSED' }
export interface MoneyLedger { transactionId: string; type: string; direction: 'CREDIT' | 'DEBIT'; amountVnd: number; balanceBeforeVnd: number; balanceAfterVnd: number; heldBeforeVnd: number; heldAfterVnd: number; referenceType: string; referenceId: string; createdAt: string }
export interface MoneyBank { bankAccountId: string; storeId: string | null; collaboratorId: string | null; bankCode: string; holderName: string; maskedNumber: string; verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'; active: boolean }
export interface MoneyWithdrawal { withdrawalId: string; walletId: string; bankAccountId: string; amountVnd: number; feeVnd: number; netAmountVnd: number; status: WithdrawalStatus; providerReference: string | null; failureReason: string | null; requestedAt: string; approvedAt: string | null; scheduledFor: string | null; completedAt: string | null }
export interface MoneySettlement { settlementId: string; sellerOrderId: string; storeId: string; netAmountVnd: number; status: string; breakdown: Record<string, unknown>; walletTransactionId: string | null; paidAt: string | null }
export interface MoneyPayment { paymentId: string; orderId: string | null; purpose: string; amountVnd: number; currency: string; status: string; checkoutUrl: string | null; qrCode: string | null; providerOrderCode: number; failureReason: string | null; verifiedAt: string | null; expiresAt: string | null; orderSyncStatus?: string; resolutionReference?: string; receivedAmountVnd?: number | null; resolutionAmountVnd?: number | null; surplusRefundedAmountVnd?: number | null; surplusReference?: string | null; bin?: string | null; accountNumber?: string | null; accountName?: string | null; description?: string | null; }
export interface MoneyFee { feeConfigId: string; feeType: string; calculationType: 'PERCENTAGE' | 'FIXED'; ratePercent: number | null; fixedAmountVnd: number | null; minFeeVnd: number | null; maxFeeVnd: number | null; validFrom: string; validTo: string | null; status: string }
export interface MoneyPage<T> { items: T[]; total: number; page: number; size: number }
export interface Capabilities { minimumWithdrawalVnd: number; currency: string; paymentAvailable: boolean; payoutAvailable: boolean }
export interface PendingFinanceEvents { configured: boolean; total: number; items: { eventId: string; eventKey: string; attempts: number; createdAt: string; nextAttemptAt: string; lastError?: string; lastHttpStatus?: number; blocked?: boolean }[] }
export interface FinanceSourceOrder { orderId: string; publicOrderCode: string; storeName: string; status: string; paymentStatus: string; amountVnd: number; returnRequestId: string | null; returnStatus: string | null; commissionId: string | null; returnWindowClosesAt: string | null }
async function request<T>(method: string, path: string, data?: unknown, params?: Record<string, unknown>): Promise<T> {
  const response = await client.request<{ code: number; result: T; message: string }>({ method, url: path, data, params });
  return response.data.result;
}
export const financeService = {
  sourceOrders: () => request<FinanceSourceOrder[]>('GET', '/source-orders'),
  importCommerceKycBank: () => request<MoneyBank>('POST', '/bank-accounts/kyc-import'),
  bankCalendar: () => request<{ date: string; reason: string; actor: string; configuredAt: string }[]>('GET', '/bank-calendar'),
  closeBankDay: (date: string, reason: string) => request<string>('POST', '/bank-calendar', { date, reason }),
  capabilities: () => request<Capabilities>('GET', '/capabilities'),
  events: (page = 0) => request<PendingFinanceEvents>('GET', '/events/pending', undefined, { page }),
  retryEvent: (id: string) => request<string>('POST', `/events/${id}/retry`),
  walletById: (id: string) => request<MoneyWallet>('GET', `/wallets/${id}`),
  walletStatus: (id: string, status: MoneyWallet['status']) => request<MoneyWallet>('PATCH', `/wallets/${id}/status`, undefined, { status }),
  wallet: (ownerType: OwnerType, storeId?: string) => request<MoneyWallet>('GET', '/wallets/me', undefined, { ownerType, storeId }),
  ledger: (id: string, page = 0, filters: Record<string, unknown> = {}) => request<MoneyPage<MoneyLedger>>('GET', `/wallets/${id}/transactions`, undefined, { page, size: 20, ...filters }),
  transaction: (walletId: string, id: string) => request<MoneyLedger & { description: string; status: string; completedAt: string }>('GET', `/wallets/${walletId}/transactions/${id}`),
  wallets: (page = 0, ownerType?: OwnerType, ownerRefId?: string) => request<MoneyPage<MoneyWallet>>('GET', '/wallets', undefined, { page, size: 20, ownerType, ownerRefId }),
  banks: (ownerType?: OwnerType, ownerRefId?: string) => request<MoneyBank[]>('GET', '/bank-accounts', undefined, { ownerType, ownerRefId }),
  registerBank: (input: { ownerType: OwnerType; ownerRefId: string; bankCode: string; holderName: string; accountNumber: string }) => request<MoneyBank>('POST', '/bank-accounts', input),
  replaceBank: (id: string, input: { ownerType: OwnerType; ownerRefId: string; bankCode: string; holderName: string; accountNumber: string }) => request<MoneyBank>('POST', `/bank-accounts/${id}/replace`, input),
  syncKycBank: (bank: { ownerType: OwnerType; ownerRefId: string; bankCode: string; holderName: string; accountNumber: string }, caseReference: string) => request<MoneyBank>('POST', '/bank-accounts/kyc-sync', { bank, caseReference, bankOwnershipVerified: false }),
  deactivateBank: (id: string) => request<MoneyBank>('DELETE', `/bank-accounts/${id}`),
  verifyBank: (id: string, status: MoneyBank['verificationStatus']) => request<MoneyBank>('PATCH', `/bank-accounts/${id}/verification`, { status }),
  withdrawals: (walletId?: string, page = 0) => request<MoneyPage<MoneyWithdrawal>>('GET', '/withdrawals', undefined, { walletId, page, size: 20 }),
  withdraw: (input: { walletId: string; bankAccountId: string; amountVnd: number; idempotencyKey: string }) => request<MoneyWithdrawal>('POST', '/withdrawals', input),
  withdrawalAction: (id: string, action: string, reason?: string) => request<MoneyWithdrawal>('POST', `/withdrawals/${id}/${action}`, { reason }),
  settlements: (storeId?: string, page = 0) => request<MoneyPage<MoneySettlement>>('GET', '/settlements', undefined, { storeId, page, size: 20 }),
  computeSettlement: (sellerOrderId: string) => request<MoneySettlement>('POST', '/settlements', { sellerOrderId }),
  creditSettlement: (id: string) => request<MoneySettlement>('POST', `/settlements/${id}/credit`),
  reconcileSettlement: (id: string, reason: string) => request<MoneySettlement>('POST', `/settlements/${id}/reconcile`, { reason }),
  fees: () => request<MoneyFee[]>('GET', '/fees'),
  createFee: (input: Omit<MoneyFee, 'feeConfigId'>) => request<MoneyFee>('POST', '/fees', input),
  updateFee: (id: string, input: Omit<MoneyFee, 'feeConfigId'>) => request<MoneyFee>('PATCH', `/fees/${id}`, input),
  feeStatus: (id: string, status: string) => request<MoneyFee>('PATCH', `/fees/${id}/status`, undefined, { status }),
  refund: (id: string) => request<unknown>('POST', `/refunds/${id}`),
  creditCommission: (id: string) => request<unknown>('POST', `/commissions/${id}/credit`),
  payment: (orderId: string, idempotencyKey: string) => request<MoneyPayment>('POST', '/payments', { orderId, idempotencyKey }),
  payments: (page = 0) => request<MoneyPage<MoneyPayment>>('GET', '/payments', undefined, { page, size: 20 }),
  resumePayment: (id: string) => request<MoneyPayment>('POST', `/payments/${id}/resume`),
  refundUnapplied: (id: string, reason: string) => request<MoneyPayment>('POST', `/payments/${id}/refund-unapplied`, { reason }),
  refundSurplus: (id: string, reason: string) => request<MoneyPayment>('POST', `/payments/${id}/refund-surplus`, { reason }),
  topup: (walletId: string, amountVnd: number, idempotencyKey: string) => request<MoneyPayment>('POST', '/top-ups', { walletId, amountVnd, idempotencyKey }),
  payWallet: (orderId: string, walletId: string, idempotencyKey: string) => request<MoneyPayment>('POST', '/wallet-payments', { orderId, walletId, idempotencyKey }),
  paymentStatus: (id: string, refresh = true) => request<MoneyPayment>('GET', `/payments/${id}`, undefined, { refresh }),
  cancelPayment: (id: string) => request<MoneyPayment>('POST', `/payments/${id}/cancel`),
};
