import type { CustomerOrder } from '../services/customer.service';

export function hasCustomerReturn(order: CustomerOrder): boolean {
  return Boolean(order.returnRequests?.length || order.returnRequest || order.rawPayload?.returnRequests?.length ||
    ['RETURN_REQUESTED', 'DISPUTED', 'RETURNED'].includes(order.status));
}

export function matchesCustomerOrderStatus(order: CustomerOrder, status?: string): boolean {
  if (!status || status.toUpperCase() === 'ALL') return true;
  if (status.toUpperCase() === 'RETURNED') return hasCustomerReturn(order);
  return order.status.toUpperCase() === status.toUpperCase();
}
