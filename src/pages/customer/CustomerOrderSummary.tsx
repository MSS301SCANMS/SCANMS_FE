import { ChevronDown, Store, User, type LucideIcon } from 'lucide-react';
import type { CustomerOrder } from '../../services/customer.service';
import { formatMoney, getSafeProductImageUrl } from '../../utils/marketplace.utils';
import './CustomerOrderSummary.css';

export function CustomerOrderSummary({ order, statusLabel, statusIcon: StatusIcon }: {
  order: CustomerOrder;
  statusLabel: string;
  statusIcon: LucideIcon;
}) {
  const placedAt = new Date(order.createdAt);
  const placedAtLabel = Number.isNaN(placedAt.getTime()) ? '—' : [
    placedAt.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }),
    placedAt.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
  ].join(' · ');
  const preview = order.orderItems[0];
  const productCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <summary className="customer-order-summary">
      <span className="customer-order-summary-heading">
        <span className="customer-order-summary-store"><Store size={16} aria-hidden="true" /><strong>{order.store?.name || 'Gian hàng đối tác'}</strong></span>
        <span data-status={order.status} className="customer-order-summary-status"><StatusIcon size={13} aria-hidden="true" /><span>{statusLabel}</span></span>
      </span>

      <span className="customer-order-summary-product">
        <span className="customer-order-summary-image" aria-hidden="true">
          <img src={getSafeProductImageUrl(preview?.product?.imageUrl, preview?.product?.title)} alt="" onError={event => {
            if (!event.currentTarget.dataset.hasFallback) {
              event.currentTarget.dataset.hasFallback = 'true';
              event.currentTarget.src = getSafeProductImageUrl(null, preview?.product?.title);
            }
          }} />
        </span>
        <span className="customer-order-summary-description">
          <strong className="customer-order-summary-title">{preview?.product?.title || 'Sản phẩm trong đơn hàng'}</strong>
          {preview?.variant?.name && <span className="customer-order-summary-variant">Phân loại: {preview.variant.name}</span>}
          {order.orderItems.length > 1 && <span className="customer-order-summary-more">Và {order.orderItems.length - 1} sản phẩm khác</span>}
          <span className="customer-order-summary-meta"><span>#{order.externalOrderSn}</span><time dateTime={order.createdAt}>{placedAtLabel}</time></span>
        </span>
        <span className="customer-order-summary-amount">
          <span>{productCount} sản phẩm</span>
          <span className="customer-order-summary-total"><span>Thành tiền</span><strong>{formatMoney(order.finalAmount)}</strong></span>
        </span>
      </span>

      <span className="customer-order-summary-footer">
        <span className="customer-order-summary-meta customer-order-summary-meta--expanded"><span>#{order.externalOrderSn}</span><time dateTime={order.createdAt}>{placedAtLabel}</time></span>
        <span className="customer-order-summary-recipient"><User size={14} aria-hidden="true" /><span>Người nhận: <strong>{order.customerName?.trim() || 'Chưa có thông tin'}</strong></span><span className="customer-order-summary-phone">{order.customerPhone?.trim() || 'Chưa có số điện thoại'}</span></span>
        <span className="customer-order-summary-toggle"><span className="customer-order-summary-open-label">Xem chi tiết</span><span className="customer-order-summary-close-label">Thu gọn</span><ChevronDown size={15} aria-hidden="true" /></span>
      </span>
    </summary>
  );
}
