export interface OrderCancellation {
  state?: 'REQUESTED' | 'REJECTED' | 'CANCELLED';
  reason?: string;
  requestedAt?: string;
  refundStatus?: 'PENDING' | 'REFUNDED' | 'NOT_REQUIRED';
  refundAmountVnd?: number;
  refundReference?: string;
  decisions?: Record<string, { approved: boolean; reason: string; decidedAt: string }>;
}
