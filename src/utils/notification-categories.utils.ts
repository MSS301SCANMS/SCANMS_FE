export type NotificationSection = 'ORDER' | 'PROMOTION' | 'SYSTEM';

export function getNotificationSection(type: string): NotificationSection {
  if (
    type.startsWith('ORDER_') ||
    type.startsWith('DISPUTE_') ||
    type.startsWith('RETURN_') ||
    type.startsWith('LIVE_ORDER_')
  ) {
    return 'ORDER';
  }

  if (
    type.startsWith('PROMOTION_') ||
    type.startsWith('PROMO_') ||
    type.startsWith('VOUCHER_') ||
    type.startsWith('CAMPAIGN_') ||
    type.startsWith('LIVE_SESSION_') ||
    type.includes('COUPON') ||
    type.includes('SALE')
  ) {
    return 'PROMOTION';
  }

  return 'SYSTEM';
}
