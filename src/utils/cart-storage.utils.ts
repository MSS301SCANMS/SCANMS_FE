import type { CartItem, CartVariantInfo } from '@/types/cart.types';
import { getSafeProductImageUrl } from '@/utils/marketplace.utils';

export const PENDING_CHECKOUT_KEY = 'scanms_pending_checkout';
export const CART_OWNER_KEY = 'scanms_cart_owner';
export const UUID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export const getCartStorageKey = (userId?: string | null): string => {
  return userId ? `scanms_cart_u_${userId}` : 'scanms_cart_guest';
};

export const getSelectedStorageKey = (userId?: string | null): string => {
  return userId ? `scanms_cart_selected_u_${userId}` : 'scanms_cart_selected_guest';
};

export const normalizeStoredCartItem = (rawItem: any): CartItem => {
  const item = rawItem && typeof rawItem === 'object' ? rawItem : {};
  const currentVariantId = typeof item.variantId === 'string' ? item.variantId.trim() : '';
  const variants = Array.isArray(item.availableVariants) ? item.availableVariants : [];
  const tokens = new Set(
    [currentVariantId, item.sku, item.variantName]
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim().toLocaleLowerCase())
      .filter(Boolean),
  );
  const matchedVariant = UUID_RE.test(currentVariantId)
    ? variants.find((variant: CartVariantInfo) => variant.id === currentVariantId)
    : variants.find((variant: CartVariantInfo) =>
        UUID_RE.test(variant.id) &&
        [variant.id, variant.sku, variant.name]
          .map((value) => value?.trim().toLocaleLowerCase())
          .some((token) => token && tokens.has(token)),
      ) || (variants.length === 1 && UUID_RE.test(String(variants[0]?.id || '')) ? variants[0] : null);

  return {
    ...item,
    ...(matchedVariant
      ? {
          variantId: matchedVariant.id,
          variantName: matchedVariant.name || item.variantName,
          sku: matchedVariant.sku || item.sku,
          price: matchedVariant.price !== null && matchedVariant.price !== undefined
            ? Number(matchedVariant.price)
            : item.price,
          stockQuantity: matchedVariant.stockQuantity ?? item.stockQuantity,
        }
      : {}),
    imageUrl: getSafeProductImageUrl(item.imageUrl, item.title, item.variantName),
  } as CartItem;
};

export const loadCartFromStorage = (uid: string | null): CartItem[] => {
  try {
    const key = getCartStorageKey(uid);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeStoredCartItem);
      }
    }
  } catch {
    // Fallback
  }
  return [];
};

export const loadSelectedFromStorage = (uid: string | null): string[] => {
  try {
    const key = getSelectedStorageKey(uid);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback
  }
  return [];
};
