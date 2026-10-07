import { Link } from 'react-router-dom';
import { CheckoutPaymentQr } from './CheckoutPaymentQr';
import { PaymentBankDetails } from './PaymentBankDetails';
import type { CheckoutOrderPayment } from '../../utils/checkoutPayments';

export function CheckoutOrderPaymentPanel({ order, busy, retrying, onRetry }: {
  order: CheckoutOrderPayment; busy: boolean; retrying: boolean; onRetry: () => void;
}) {
  const recoveryUrl = `/payment/payos-return?order=${encodeURIComponent(order.publicOrderCode)}`;
  const paid = order.paymentStatus === 'PAID';
  const blocked = ['REFUNDED', 'RECONCILIATION_REQUIRED'].includes(order.paymentStatus || '');
  const cancelled = ['CANCELLED', 'FAILED'].includes(order.paymentStatus || '');
  const safeLink = order.payos?.checkoutUrl && /^https:\/\/(?:pay\.payos\.vn|payos\.vn)\//.test(order.payos.checkoutUrl) ? order.payos.checkoutUrl : null;
  return <div className="mt-3 rounded-xl border border-[#C59B58] bg-white p-4 text-center">
    <p role="status" className="mb-3 text-xs font-bold text-[#B88E4F]">
      {paid ? 'PAYOS ĐÃ XÁC NHẬN THANH TOÁN' : blocked ? 'THANH TOÁN CẦN ĐỐI SOÁT' : cancelled ? 'THANH TOÁN ĐÃ HỦY HOẶC HẾT HẠN' : 'THANH TOÁN PAYOS CHO ĐƠN NÀY'}
    </p>
    {!paid && !blocked && !cancelled && order.payos && <>
      <CheckoutPaymentQr qrCode={order.payos.qrCode} recoveryUrl={recoveryUrl} />
      <PaymentBankDetails payment={order.payos} />
      {safeLink && <a href={safeLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-lg bg-[#ee4d2d] px-4 py-2 text-xs font-bold text-white">Mở trang thanh toán PayOS ↗</a>}
    </>}
    {!paid && !blocked && (!order.payos || cancelled) && <>
      <p role="alert" className="text-sm text-amber-800">{order.paymentError || 'Đơn hàng chưa thanh toán. Chưa có mã QR PayOS cho đơn này.'}</p>
      <button type="button" disabled={busy} onClick={onRetry} className="mt-3 rounded-lg bg-[#ee4d2d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {retrying ? 'Đang tạo liên kết…' : 'Thử lại thanh toán PayOS'}
      </button>
    </>}
    {!paid && <Link className="mt-3 block text-xs text-[#A77C37] underline" to={recoveryUrl}>Kiểm tra trạng thái đơn {order.publicOrderCode}</Link>}
  </div>;
}
