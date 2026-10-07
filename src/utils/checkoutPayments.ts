export interface PayosPaymentDetails {
  qrCode?: string;
  checkoutUrl?: string;
  bin?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  description?: string | null;
  amount: number;
  paymentStatus?: string;
}

export interface CheckoutOrderPayment {
  publicOrderCode: string;
  paymentStatus?: string;
  payos?: PayosPaymentDetails;
  paymentError?: string;
}

export function checkoutPaymentStatus(orders: CheckoutOrderPayment[]): string {
  if (orders.length > 0 && orders.every(order => order.paymentStatus === 'PAID')) return 'PAID';
  if (orders.some(order => order.paymentStatus === 'RECONCILIATION_REQUIRED')) return 'RECONCILIATION_REQUIRED';
  return 'WAITING_PAYMENT';
}

export async function loadOrderPayment<T extends CheckoutOrderPayment>(order: T, load: (code: string) => Promise<PayosPaymentDetails>): Promise<T> {
  if (order.paymentStatus === 'PAID') return order;
  try {
    const payos = await load(order.publicOrderCode);
    if (payos.paymentStatus !== 'PAID' && !payos.qrCode && !payos.checkoutUrl) throw new Error('PayOS chưa trả về mã QR hoặc liên kết thanh toán.');
    return { ...order, payos, paymentStatus: payos.paymentStatus || 'WAITING_PAYMENT', paymentError: undefined };
  } catch (error) {
    return { ...order, paymentError: error instanceof Error ? error.message : 'Chưa tạo được liên kết PayOS. Vui lòng thử lại.' };
  }
}

export async function loadCheckoutPayments<T extends CheckoutOrderPayment>(orders: T[], load: (code: string) => Promise<PayosPaymentDetails>): Promise<T[]> {
  return Promise.all(orders.map(order => loadOrderPayment(order, load)));
}
