import type { CustomerOrder } from '../services/customer.service';

export function getCustomerOrderActions(order: CustomerOrder, now = Date.now(), trackingStatus?: string | null) {
  const hasReturn = Boolean(order.returnRequest) || ['RETURN_REQUESTED', 'DISPUTED', 'RETURNED'].includes(order.status);
  const delivered = ['DELIVERED', 'COMPLETED'].includes(order.status);
  const deliveredAt = Date.parse(order.deliveredAt || order.completedAt || '');
  const cancellation = order.rawPayload?.sagaState?.cancellation;
  const sellers = order.rawPayload?.sellerOrders || [];
  const beforeDispatch = sellers.length > 0 && sellers.every((seller: any) => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(seller.status));
  return {
    cancel: cancellation?.state !== 'REQUESTED' && !hasReturn && !delivered && order.status !== 'CANCELLED'
      && (sellers.length ? beforeDispatch : order.status === 'PENDING'),
    confirmReceipt: order.status === 'DELIVERED' && !hasReturn,
    requestReturn: delivered && order.orderItems.some(item => (item.returnableQuantity ?? item.quantity) > 0) && Number.isFinite(deliveredAt) && deliveredAt <= now && now <= deliveredAt + 14 * 86400000,
    review: order.status === 'COMPLETED' && !hasReturn,
    reorder: ['DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED'].includes(order.status) ||
      (order.status === 'SHIPPING' && trackingStatus === 'delivered'),
  };
}
