import type { CustomerOrder } from '../../services/customer.service';
import { formatMoney } from '../../utils/marketplace.utils';

export function CustomerOrderTotals({ order }: { order: CustomerOrder }) {
  return (
    <dl className="customer-order-totals" aria-label="Chi tiết thanh toán">
      <div><dt>Tiền hàng</dt><dd>{formatMoney(order.subtotalAmount)}</dd></div>
      <div><dt>Phí vận chuyển</dt><dd>{formatMoney(order.shippingFee)}</dd></div>
      {Number(order.discountAmount) > 0 && <div className="customer-order-totals-discount"><dt>Giảm giá</dt><dd>−{formatMoney(order.discountAmount)}</dd></div>}
      <div className="customer-order-totals-final"><dt>Tổng thanh toán</dt><dd>{formatMoney(order.finalAmount)}</dd></div>
    </dl>
  );
}
