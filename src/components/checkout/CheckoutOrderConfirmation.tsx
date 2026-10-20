import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Clock3, Copy, ExternalLink, Mail, ShoppingBag, Store, Wallet } from 'lucide-react';
import { formatMoney } from '../../utils/marketplace.utils';
import { toast } from '../../utils/toast';
import { PayosOrderPayment } from './PayosOrderPayment';
import './CheckoutOrderConfirmation.css';

export interface CheckoutOrderResult {
  isMultiStore?: boolean;
  publicOrderCode: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orders: Array<{
    publicOrderCode: string;
    storeId?: string;
    storeName?: string;
    finalAmount: number;
    paymentStatus: string;
    trackingUrl?: string;
    items?: any[];
  }>;
  cancellationToken?: string;
  confirmationEmailQueued?: boolean;
  confirmationEmailStatus?: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED' | 'PARTIAL' | 'NOT_REQUESTED' | 'UNKNOWN';
}

export function CheckoutOrderConfirmation({ order, customerEmail, onClose, onPayosPaid }: {
  order: CheckoutOrderResult;
  customerEmail: string;
  onClose: () => void;
  onPayosPaid: (code: string) => void;
}) {
  const isPayos = order.paymentMethod === 'PAYOS';
  const awaitingPayment = isPayos && order.paymentStatus !== 'PAID';
  const paid = order.paymentStatus === 'PAID';
  const wallet = order.paymentMethod === 'WALLET';
  const paidCount = order.orders.filter(item => item.paymentStatus === 'PAID').length;
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 2000);
    } catch { toast.error('Chưa sao chép được. Bạn có thể chọn và sao chép mã đơn.'); }
  };
  const paymentMethod = wallet ? 'Ví SCANMS' : isPayos ? 'Chuyển khoản PayOS' : order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : order.paymentMethod;

  return (
    <section className="checkout-confirmation" data-payment-state={awaitingPayment ? 'waiting' : paid ? 'paid' : 'placed'} aria-labelledby="guest-checkout-title">
      <header className="checkout-confirmation-hero">
        <span className="checkout-confirmation-emblem" aria-hidden="true">{awaitingPayment ? <Clock3 size={30} strokeWidth={1.6} /> : <CheckCircle2 size={30} strokeWidth={1.6} />}</span>
        <h2 id="guest-checkout-title" aria-live="polite">{awaitingPayment ? 'Hoàn tất thanh toán để xác nhận đơn' : isPayos ? 'Thanh toán thành công' : 'Đặt hàng thành công'}</h2>
        <p>{awaitingPayment
          ? order.isMultiStore ? `Đã thanh toán ${paidCount}/${order.orders.length} đơn. Quét mã QR của từng gian hàng để hoàn tất.` : 'Đơn đã được tạo. Quét mã QR bên dưới để hoàn tất thanh toán.'
          : isPayos ? 'PayOS đã xác nhận nhận đủ tiền. Đơn hàng được gửi tới gian hàng để xử lý.' : 'Đơn hàng của bạn đã được ghi nhận và gửi tới gian hàng để xử lý.'}</p>
      </header>

      <div className="checkout-confirmation-total">
        <div><span>Tổng giá trị đơn hàng</span><p>{order.orders.length} đơn hàng{order.isMultiStore ? ' từ các gian hàng đối tác' : ''}</p></div>
        <strong>{formatMoney(order.totalAmount)}</strong>
      </div>

      <div className="checkout-confirmation-body">
        <section className="checkout-confirmation-orders" aria-labelledby="confirmation-orders-title">
          <h3 id="confirmation-orders-title">Thông tin đơn hàng</h3>
          {order.orders.map((item, index) => (
            <article className="checkout-confirmation-order" key={item.publicOrderCode || index}>
              <div className="checkout-confirmation-store"><span aria-hidden="true"><Store size={17} /></span><h4>{item.storeName || 'Gian hàng đối tác'}</h4></div>
              <div className="checkout-confirmation-code">
                <div><span>Mã đơn hàng</span><strong>{item.publicOrderCode}</strong></div>
                <button type="button" onClick={() => void copyCode(item.publicOrderCode)} aria-label={`Sao chép mã đơn ${item.publicOrderCode}`} title={copied === item.publicOrderCode ? 'Đã sao chép' : 'Sao chép mã đơn'} data-copied={copied === item.publicOrderCode}>
                  {copied === item.publicOrderCode ? <Check size={16} /> : <Copy size={16} />}
                </button>
                {copied === item.publicOrderCode && <span className="sr-only" role="status">Đã sao chép mã đơn</span>}
              </div>
              <div className="checkout-confirmation-order-bottom">
                {order.isMultiStore && <strong>{formatMoney(item.finalAmount)}</strong>}
                {isPayos && <span className="checkout-confirmation-status" data-payment-status={item.paymentStatus}>{item.paymentStatus === 'PAID' ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}{item.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}</span>}
                <Link to={`/tracking?sn=${encodeURIComponent(item.publicOrderCode)}`} target="_blank" rel="noopener noreferrer" className="checkout-confirmation-track">Tra cứu đơn <ExternalLink size={13} aria-hidden="true" /></Link>
              </div>
            </article>
          ))}
        </section>

        <aside className="checkout-confirmation-payment" aria-labelledby="confirmation-payment-title">
          <div className="checkout-confirmation-payment-heading">{wallet ? <Wallet size={19} aria-hidden="true" /> : awaitingPayment ? <Clock3 size={19} aria-hidden="true" /> : <CheckCircle2 size={19} aria-hidden="true" />}<h3 id="confirmation-payment-title">Thanh toán</h3></div>
          <dl>
            <div><dt>Phương thức</dt><dd>{paymentMethod}</dd></div>
            <div><dt>Trạng thái</dt><dd className="checkout-confirmation-payment-state">{paid ? 'Đã thanh toán' : awaitingPayment ? 'Chờ thanh toán' : 'Đã ghi nhận đơn'}</dd></div>
          </dl>
          <p>{wallet && paid ? 'Số tiền đã được trừ từ số dư ví khả dụng. Theo dõi tiến độ xử lý trong đơn mua của bạn.'
            : awaitingPayment ? 'Thanh toán được xác nhận tự động khi PayOS nhận đủ tiền.'
            : paid ? 'Thanh toán đã được ghi nhận. Bạn có thể theo dõi đơn mua để xem cập nhật từ gian hàng.'
            : order.paymentMethod === 'COD' ? 'Bạn sẽ thanh toán khi nhận hàng.' : 'Bạn có thể kiểm tra trạng thái thanh toán trong đơn mua của mình.'}</p>
        </aside>
      </div>

      {isPayos && <div className="checkout-confirmation-payos">
        {order.isMultiStore && awaitingPayment && <p>Mỗi gian hàng có một mã thanh toán riêng. Vui lòng thanh toán các đơn còn chờ bên dưới.</p>}
        {order.orders.map(item => <PayosOrderPayment key={item.publicOrderCode} orderCode={item.publicOrderCode} storeName={item.storeName} showOrderHeading={Boolean(order.isMultiStore)} onPaid={() => onPayosPaid(item.publicOrderCode)} />)}
      </div>}

      {customerEmail.trim() && (order.confirmationEmailQueued || ['SENT', 'FAILED', 'PARTIAL'].includes(order.confirmationEmailStatus || '')) && (
        <div className="checkout-confirmation-email" data-email-status={order.confirmationEmailStatus || 'QUEUED'}>
          <Mail size={15} aria-hidden="true" />
          <p>{order.confirmationEmailStatus === 'SENT'
            ? <>Đã gửi email xác nhận đơn hàng tới <strong>{customerEmail.trim().toLowerCase()}</strong>. Kiểm tra cả thư mục Spam nếu chưa thấy.</>
            : order.confirmationEmailStatus === 'FAILED'
              ? <>Chưa gửi được email xác nhận tới <strong>{customerEmail.trim().toLowerCase()}</strong>. Đơn hàng vẫn được lưu; bạn có thể xem đầy đủ trong đơn mua.</>
              : order.confirmationEmailStatus === 'PARTIAL'
                ? <>Một số email xác nhận chưa gửi được. Bạn có thể xem tất cả đơn hàng trong đơn mua.</>
                : <>Email xác nhận đang được xử lý để gửi tới <strong>{customerEmail.trim().toLowerCase()}</strong>.</>}</p>
        </div>
      )}

      <footer className="checkout-confirmation-footer">
        <button type="button" onClick={onClose} className="checkout-confirmation-continue">Tiếp tục mua sắm</button>
        <Link to="/customer/orders" onClick={onClose} className="checkout-confirmation-view-orders"><ShoppingBag size={16} aria-hidden="true" /><span>Xem đơn mua của tôi</span><ArrowRight size={15} aria-hidden="true" /></Link>
      </footer>
    </section>
  );
}
