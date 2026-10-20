import type { CartItem } from '@/types/cart.types';

// Account cache uses max quantities on retry; a new guest basket is added exactly once.
export function mergeCartItems(account: CartItem[], incoming: CartItem[], addQuantities = false): CartItem[] {
  const merged = new Map(account.map((item) => [item.cartItemId, { ...item }]));
  for (const item of incoming) {
    const existing = merged.get(item.cartItemId);
    if (!existing) { merged.set(item.cartItemId, { ...item }); continue; }
    const quantity = addQuantities ? existing.quantity + item.quantity : Math.max(existing.quantity, item.quantity);
    merged.set(item.cartItemId, {
      ...item, ...existing,
      liveSessionId: item.liveSessionId || existing.liveSessionId,
      liveCouponCode: item.liveCouponCode || existing.liveCouponCode,
      quantity: existing.stockQuantity > 0 ? Math.min(quantity, existing.stockQuantity) : quantity,
    });
  }
  return [...merged.values()];
}
