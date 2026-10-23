import { financeService, type MoneyPayment } from './finance.service';
import { getSessionId } from './auth-session';

const references = new Map<string, string>();
function context(orderId: string) {
  const session = getSessionId();
  if (!session) throw new Error('Đăng nhập để tiếp tục thanh toán.');
  return { session, key: `scanms-order-payos:${session}:${orderId}` };
}
function current(session: string) {
  if (getSessionId() !== session) throw new Error('Phiên đăng nhập đã thay đổi.');
}
function view(payment: MoneyPayment) {
  if (payment.orderSyncStatus === 'RECONCILIATION_REQUIRED' || payment.orderSyncStatus === 'REFUNDED')
    throw new Error('Khoản thanh toán cần đối soát hoặc đã hoàn về ví. Vui lòng kiểm tra giao dịch trước khi trả tiền lại.');
  if (payment.checkoutUrl && !/^https:\/\/pay\.payos\.vn\//.test(payment.checkoutUrl))
    throw new Error('Liên kết thanh toán không hợp lệ. Vui lòng kiểm tra lại giao dịch.');
  return { paymentId: payment.paymentId, qrCode: payment.qrCode || undefined, checkoutUrl: payment.checkoutUrl || undefined,
    accountNumber: payment.accountNumber || undefined, accountName: payment.accountName || undefined, amount: payment.amountVnd,
    paymentStatus: payment.status === 'SUCCESS' && payment.orderSyncStatus === 'SYNCED' ? 'PAID' : 'WAITING_PAYMENT',
    providerStatus: payment.status, orderStatus: ['CANCELLED', 'FAILED'].includes(payment.status) ? 'CANCELLED' : undefined };
}
async function existing(orderId: string, session: string) {
  for (let page = 0; page < 10; page++) {
    const history = await financeService.payments(page); current(session);
    const match = history.items.find(row => row.orderId === orderId && row.purpose === 'ORDER'
      && ['SUCCESS', 'PENDING', 'PROCESSING'].includes(row.status));
    if (match) return match;
    if ((page + 1) * history.size >= history.total || !history.items.length) break;
  }
  return null;
}
export const orderPayosService = {
  async prepare(orderId: string) {
    const { session, key } = context(orderId);
    let payment: MoneyPayment;
    const id = references.get(key);
    if (id) payment = await financeService.paymentStatus(id);
    else {
      let requestKey: string | null = null;
      try { requestKey = sessionStorage.getItem(key); } catch { /* Storage can be unavailable. */ }
      if (!requestKey) {
        requestKey = crypto.randomUUID();
        try { sessionStorage.setItem(key, requestKey); } catch { /* Recover a lost response from payment history. */ }
      }
      try { payment = await financeService.payment(orderId, requestKey); }
      catch (error) {
        current(session);
        const recovered = await existing(orderId, session).catch(() => null);
        if (!recovered) throw error;
        payment = recovered;
      }
    }
    current(session);
    if (payment.orderId !== orderId || payment.purpose !== 'ORDER') throw new Error('Giao dịch không khớp với đơn hàng.');
    references.set(key, payment.paymentId);
    if (['PENDING', 'PROCESSING'].includes(payment.status) && !payment.checkoutUrl)
      payment = await financeService.resumePayment(payment.paymentId);
    current(session);
    return view(payment);
  },
  async status(orderId: string) {
    const { session, key } = context(orderId);
    const id = references.get(key);
    if (!id) return this.prepare(orderId);
    const payment = await financeService.paymentStatus(id); current(session);
    if (payment.orderId !== orderId) throw new Error('Giao dịch không khớp với đơn hàng.');
    return view(payment);
  },
};
