import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Clock3, Copy, ExternalLink, Mail, ShoppingBag, Store, Wallet } from 'lucide-react';
import { formatMoney } from '../../utils/marketplace.utils';
import { toast } from '../../utils/toast';
import { PayosOrderPayment } from './PayosOrderPayment';

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
    <section className="checkout-confirmation [container:confirmation_/_inline-size] w-full max-w-[880px] m-[0_auto] min-w-0 border border-[#EAE4D7] rounded-[20px] bg-[color:#FFFFFF] text-[color:#1A1612]! shadow-[0_8px_32px_rgb(35_29_21_/_3%)] overflow-hidden [&_:is(a,button):focus-visible]:outline-[2px] [&_:is(a,button):focus-visible]:outline-solid [&_:is(a,button):focus-visible]:outline-[#B88E4F] [&_:is(a,button):focus-visible]:outline-offset-[3px]" data-payment-state={awaitingPayment ? 'waiting' : paid ? 'paid' : 'placed'} aria-labelledby="guest-checkout-title">
      <header className="checkout-confirmation-hero flex flex-col items-center gap-[12px] p-[30px_28px_26px] text-center [&_h2]:[font-family:inherit]! [&_h2]:text-[24px] [&_h2]:font-[700] [&_h2]:leading-[1.35] [&_h2]:[font-style:inherit] [&_h2]:[font-variant:inherit] [&_h2]:[font-stretch:inherit] [&_h2]:m-[2px_0_0] [&_h2]:tracking-[-.5px]! [&_p]:max-w-[560px] [&_p]:m-0 [&_p]:text-[color:#7D715E]! [&_p]:text-[13px] [&_p]:leading-[1.7] [@container_confirmation_(max-width:430px)]:p-[24px_16px_22px] [@container_confirmation_(max-width:430px)]:gap-[10px] [@container_confirmation_(max-width:430px)]:[&_h2]:text-[21px] [@container_confirmation_(max-width:430px)]:[&_p]:text-[12px]">
        <span className="checkout-confirmation-emblem grid place-items-center w-[60px] h-[60px] border border-[#EEDFC6] rounded-full bg-[color:#FBF5EB] text-[color:#B88E4F]! [@container_confirmation_(max-width:430px)]:w-[54px] [@container_confirmation_(max-width:430px)]:h-[54px]" aria-hidden="true">{awaitingPayment ? <Clock3 size={30} strokeWidth={1.6} /> : <CheckCircle2 size={30} strokeWidth={1.6} />}</span>
        <h2 id="guest-checkout-title" aria-live="polite">{awaitingPayment ? 'Hoàn tất thanh toán để xác nhận đơn' : isPayos ? 'Thanh toán thành công' : 'Đặt hàng thành công'}</h2>
        <p>{awaitingPayment
          ? order.isMultiStore ? `Đã thanh toán ${paidCount}/${order.orders.length} đơn. Quét mã QR của từng gian hàng để hoàn tất.` : 'Đơn đã được tạo. Quét mã QR bên dưới để hoàn tất thanh toán.'
          : isPayos ? 'PayOS đã xác nhận nhận đủ tiền. Đơn hàng được gửi tới gian hàng để xử lý.' : 'Đơn hàng của bạn đã được ghi nhận và gửi tới gian hàng để xử lý.'}</p>
      </header>

      <div className="checkout-confirmation-total flex items-center justify-between flex-wrap gap-[10px_20px] m-[0_28px] p-[18px_20px] border border-[#EAE4D7] rounded-[12px] bg-[color:#FAF8F5] [&_>_div_>_span]:text-[12px] [&_>_div_>_span]:font-[550] [&_p]:m-[4px_0_0] [&_p]:text-[color:#7D715E]! [&_p]:text-[11px] [&_p]:leading-[1.6] [&_>_strong]:min-w-0 [&_>_strong]:[overflow-wrap:anywhere] [&_>_strong]:text-[28px] [&_>_strong]:font-[700] [&_>_strong]:tracking-[-.6px]! [&_>_strong]:leading-[1.3] [&_>_strong]:tabular-nums [@container_confirmation_(430px_<_width_<=_680px)]:[&_>_strong]:text-[25px] [@container_confirmation_(max-width:430px)]:m-[0_16px] [@container_confirmation_(max-width:430px)]:p-[14px] [@container_confirmation_(max-width:430px)]:[&_>_strong]:text-[24px]">
        <div><span>Tổng giá trị đơn hàng</span><p>{order.orders.length} đơn hàng{order.isMultiStore ? ' từ các gian hàng đối tác' : ''}</p></div>
        <strong>{formatMoney(order.totalAmount)}</strong>
      </div>

      <div className="checkout-confirmation-body grid grid-cols-[minmax(0,1fr)_280px] [align-items:start] gap-[24px] p-[24px_28px] [@container_confirmation_(max-width:680px)]:grid-cols-[minmax(0,1fr)] [@container_confirmation_(max-width:680px)]:gap-[20px] [@container_confirmation_(max-width:430px)]:p-[22px_16px]">
        <section className="checkout-confirmation-orders min-w-0 [&_>_h3]:[font-family:inherit]! [&_>_h3]:text-[14px] [&_>_h3]:font-[600] [&_>_h3]:leading-[1.5] [&_>_h3]:[font-style:inherit] [&_>_h3]:[font-variant:inherit] [&_>_h3]:[font-stretch:inherit] [&_>_h3]:m-[0_0_16px]" aria-labelledby="confirmation-orders-title">
          <h3 id="confirmation-orders-title">Thông tin đơn hàng</h3>
          {order.orders.map((item, index) => (
            <article className="checkout-confirmation-order [&_+_.checkout-confirmation-order]:mt-[18px] [&_+_.checkout-confirmation-order]:pt-[18px] [&_+_.checkout-confirmation-order]:border-t [&_+_.checkout-confirmation-order]:border-t-[#EAE4D7]" key={item.publicOrderCode || index}>
              <div className="checkout-confirmation-store flex items-center gap-[8px] min-w-0 [&_>_span]:grid [&_>_span]:place-items-center [&_>_span]:shrink-0 [&_>_span]:w-[30px] [&_>_span]:h-[30px] [&_>_span]:rounded-[8px] [&_>_span]:bg-[color:#FBF5EB] [&_>_span]:text-[color:#B88E4F]! [&_h4]:[font-family:inherit]! [&_h4]:text-[13px] [&_h4]:font-[600] [&_h4]:leading-[1.6] [&_h4]:[font-style:inherit] [&_h4]:[font-variant:inherit] [&_h4]:[font-stretch:inherit] [&_h4]:min-w-0 [&_h4]:[overflow-wrap:anywhere] [&_h4]:m-0"><span aria-hidden="true"><Store size={17} /></span><h4>{item.storeName || 'Gian hàng đối tác'}</h4></div>
              <div className="checkout-confirmation-code flex items-center gap-[10px] mt-[12px] [&_>_div]:grid [&_>_div]:gap-[4px] [&_>_div]:min-w-0 [&_>_div_>_span]:text-[color:#7D715E]! [&_>_div_>_span]:text-[11px] [&_strong]:[overflow-wrap:anywhere] [&_strong]:text-[12px] [&_strong]:font-[550] [&_strong]:leading-[1.5] [&_button]:grid [&_button]:place-items-center [&_button]:shrink-0 [&_button]:w-[40px] [&_button]:h-[44px] [&_button]:p-0 [&_button]:border [&_button]:border-[#EAE4D7] [&_button]:rounded-[8px] [&_button]:bg-[color:#FFFFFF] [&_button]:text-[color:#B88E4F]! [&_button]:cursor-pointer [&_button:hover]:border-[#EEDFC6] [&_button:hover]:bg-[color:#FBF5EB]">
                <div><span>Mã đơn hàng</span><strong>{item.publicOrderCode}</strong></div>
                <button type="button" onClick={() => void copyCode(item.publicOrderCode)} aria-label={`Sao chép mã đơn ${item.publicOrderCode}`} title={copied === item.publicOrderCode ? 'Đã sao chép' : 'Sao chép mã đơn'} data-copied={copied === item.publicOrderCode}>
                  {copied === item.publicOrderCode ? <Check size={16} /> : <Copy size={16} />}
                </button>
                {copied === item.publicOrderCode && <span className="sr-only" role="status">Đã sao chép mã đơn</span>}
              </div>
              <div className="checkout-confirmation-order-bottom flex items-center flex-wrap gap-[8px] mt-[12px] [&_>_strong]:text-[12px] [&_>_strong]:tabular-nums">
                {order.isMultiStore && <strong>{formatMoney(item.finalAmount)}</strong>}
                {isPayos && <span className="checkout-confirmation-status inline-flex items-center gap-[4px] p-[4px_6px] rounded-[5px] bg-[color:#FBF5EB] text-[color:#7D715E]! text-[10px] leading-[1.5] [&_svg]:text-[color:#B88E4F]!" data-payment-status={item.paymentStatus}>{item.paymentStatus === 'PAID' ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}{item.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}</span>}
                <Link to={`/tracking?sn=${encodeURIComponent(item.publicOrderCode)}`} target="_blank" rel="noopener noreferrer" className="checkout-confirmation-track inline-flex items-center justify-center gap-[6px] min-h-[44px] ml-auto p-[8px_10px] border border-[#EAE4D7] rounded-[8px] bg-[color:#FFFFFF] text-[color:#7D715E]! text-[11px] font-[550] no-underline [&:hover]:border-[#EEDFC6] [&:hover]:bg-[color:#FBF5EB] [&:hover]:text-[color:#1A1612]!">Tra cứu đơn <ExternalLink size={13} aria-hidden="true" /></Link>
              </div>
            </article>
          ))}
        </section>

        <aside className="checkout-confirmation-payment min-w-0 p-[18px] border border-[#EAE4D7] rounded-[12px] bg-[color:#FFFFFF] [&_dl]:grid [&_dl]:gap-[12px] [&_dl]:m-[18px_0_14px] [&_dl_>_div]:flex [&_dl_>_div]:justify-between [&_dl_>_div]:flex-wrap [&_dl_>_div]:gap-[4px_12px] [&_dl_>_div]:text-[11px] [&_dl_>_div]:leading-[1.6] [&_dt]:text-[color:#7D715E]! [&_dd]:m-[0_0_0_auto] [&_dd]:text-right [&_dd]:font-[550] [&_dd]:[overflow-wrap:anywhere] [&_>_p]:m-0 [&_>_p]:pt-[14px] [&_>_p]:border-t [&_>_p]:border-t-[#EAE4D7] [&_>_p]:text-[color:#7D715E]! [&_>_p]:text-[11px] [&_>_p]:leading-[1.8] [@container_confirmation_(max-width:430px)]:p-[16px]" aria-labelledby="confirmation-payment-title">
          <div className="checkout-confirmation-payment-heading flex items-center gap-[8px] [&_>_svg]:shrink-0 [&_>_svg]:text-[color:#B88E4F]! [&_h3]:[font-family:inherit]! [&_h3]:text-[14px] [&_h3]:font-[600] [&_h3]:leading-[inherit] [&_h3]:[font-style:inherit] [&_h3]:[font-variant:inherit] [&_h3]:[font-stretch:inherit] [&_h3]:m-0">{wallet ? <Wallet size={19} aria-hidden="true" /> : awaitingPayment ? <Clock3 size={19} aria-hidden="true" /> : <CheckCircle2 size={19} aria-hidden="true" />}<h3 id="confirmation-payment-title">Thanh toán</h3></div>
          <dl>
            <div><dt>Phương thức</dt><dd>{paymentMethod}</dd></div>
            <div><dt>Trạng thái</dt><dd className="checkout-confirmation-payment-state text-[color:#8A642C]!">{paid ? 'Đã thanh toán' : awaitingPayment ? 'Chờ thanh toán' : 'Đã ghi nhận đơn'}</dd></div>
          </dl>
          <p>{wallet && paid ? 'Số tiền đã được trừ từ số dư ví khả dụng. Theo dõi tiến độ xử lý trong đơn mua của bạn.'
            : awaitingPayment ? 'Thanh toán được xác nhận tự động khi PayOS nhận đủ tiền.'
            : paid ? 'Thanh toán đã được ghi nhận. Bạn có thể theo dõi đơn mua để xem cập nhật từ gian hàng.'
            : order.paymentMethod === 'COD' ? 'Bạn sẽ thanh toán khi nhận hàng.' : 'Bạn có thể kiểm tra trạng thái thanh toán trong đơn mua của mình.'}</p>
        </aside>
      </div>

      {isPayos && <div className="checkout-confirmation-payos grid gap-[14px] min-w-0 p-[0_28px_20px] [&_>_p]:m-0 [&_>_p]:text-[color:#7D715E]! [&_>_p]:text-[12px] [&_>_p]:leading-[1.7] [@container_confirmation_(max-width:430px)]:p-[0_16px_20px]">
        {order.isMultiStore && awaitingPayment && <p>Mỗi gian hàng có một mã thanh toán riêng. Vui lòng thanh toán các đơn còn chờ bên dưới.</p>}
        {order.orders.map(item => <PayosOrderPayment key={item.publicOrderCode} orderCode={item.publicOrderCode} storeName={item.storeName} showOrderHeading={Boolean(order.isMultiStore)} onPaid={() => onPayosPaid(item.publicOrderCode)} />)}
      </div>}

      {customerEmail.trim() && (order.confirmationEmailQueued || ['SENT', 'FAILED', 'PARTIAL'].includes(order.confirmationEmailStatus || '')) && (
        <div className="checkout-confirmation-email flex items-start gap-[8px] m-[0_28px_22px] text-[color:#7D715E]! [&_>_svg]:shrink-0 [&_>_svg]:mt-[2px] [&_>_svg]:text-[color:#B88E4F]! [&_p]:min-w-0 [&_p]:m-0 [&_p]:text-[11px] [&_p]:leading-[1.8] [&_strong]:text-[color:#1A1612]! [&_strong]:font-[500] [&_strong]:[overflow-wrap:anywhere] [@container_confirmation_(max-width:430px)]:m-[0_16px_20px]" data-email-status={order.confirmationEmailStatus || 'QUEUED'}>
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

      <footer className="checkout-confirmation-footer flex items-stretch justify-center flex-wrap gap-[12px] p-[20px_28px] border-t border-t-[#EAE4D7] [&_>_:is(button,a)]:[font-family:inherit]! [&_>_:is(button,a)]:text-[12px] [&_>_:is(button,a)]:font-[550] [&_>_:is(button,a)]:leading-[1.5] [&_>_:is(button,a)]:[font-style:inherit] [&_>_:is(button,a)]:[font-variant:inherit] [&_>_:is(button,a)]:[font-stretch:inherit] [&_>_:is(button,a)]:inline-flex [&_>_:is(button,a)]:items-center [&_>_:is(button,a)]:justify-center [&_>_:is(button,a)]:gap-[8px] [&_>_:is(button,a)]:min-h-[46px] [&_>_:is(button,a)]:p-[11px_18px] [&_>_:is(button,a)]:border [&_>_:is(button,a)]:border-[#EAE4D7] [&_>_:is(button,a)]:rounded-[10px] [&_>_:is(button,a)]:bg-[color:#FFFFFF] [&_>_:is(button,a)]:text-[color:#1A1612]! [&_>_:is(button,a)]:no-underline [&_>_:is(button,a)]:cursor-pointer [&_.checkout-confirmation-view-orders]:min-w-[220px] [&_.checkout-confirmation-view-orders]:border-[#EEDFC6] [&_.checkout-confirmation-view-orders]:bg-[color:#FBF5EB] [&_.checkout-confirmation-view-orders]:font-[600] [&_>_:is(button,a):hover]:border-[#C59B58] [&_>_:is(button,a):hover]:bg-[color:#FBF5EB] [&_.checkout-confirmation-view-orders:hover]:bg-[color:#F3EFE6] [@container_confirmation_(max-width:430px)]:flex [@container_confirmation_(max-width:430px)]:flex-col-reverse [@container_confirmation_(max-width:430px)]:p-[16px] [@container_confirmation_(max-width:430px)]:gap-[10px] [@container_confirmation_(max-width:430px)]:[&_>_:is(button,a)]:w-full [@container_confirmation_(max-width:430px)]:[&_>_:is(button,a)]:min-w-0">
        <button type="button" onClick={onClose} className="checkout-confirmation-continue">Tiếp tục mua sắm</button>
        <Link to="/customer/orders" onClick={onClose} className="checkout-confirmation-view-orders [&_svg]:text-[color:#B88E4F]!"><ShoppingBag size={16} aria-hidden="true" /><span>Xem đơn mua của tôi</span><ArrowRight size={15} aria-hidden="true" /></Link>
      </footer>
    </section>
  );
}
