import type { CartItem } from '../types/cart.types';

export const checkoutDraftKey = (userId: string) => `scanms_checkout_page_${userId}`;
export const liveCheckoutOrigin = (value: unknown): string | undefined =>
  typeof value === 'string' && /^\/live\/[A-Za-z0-9_-]+(?:\?[^#]*)?(?:#.*)?$/.test(value) ? value : undefined;

export function readCheckoutDraft(userId: string): { items: CartItem[]; couponCode: string; returnTo?: string } | null {
  try {
    const draft = JSON.parse(sessionStorage.getItem(checkoutDraftKey(userId)) || 'null');
    if (
      !draft ||
      draft.userId !== userId ||
      !Number.isFinite(draft.savedAt) ||
      Date.now() - draft.savedAt > 30 * 60000 ||
      !Array.isArray(draft.items) ||
      !draft.items.length ||
      draft.items.length > 1000 ||
      !draft.items.every(
        (item: CartItem) =>
          item &&
          typeof item.productId === 'string' &&
          typeof item.store?.id === 'string' &&
          Number.isSafeInteger(item.quantity) &&
          item.quantity > 0 &&
          Number.isFinite(item.price),
      )
    )
      return null;
    return {
      items: draft.items,
      couponCode: typeof draft.couponCode === 'string' ? draft.couponCode : '',
      returnTo: liveCheckoutOrigin(draft.returnTo),
    };
  } catch {
    return null;
  }
}
