const key = (productId: string) => `scanms-product-referral:${productId}`;
const valid = (value: string) => /^[A-Za-z0-9_-]{1,100}$/.test(value);

/** Product-specific attribution lasts for this browser tab; the server revalidates it at checkout. */
export function captureProductReferral(productId: string, referralId: string | null) {
  if (!valid(productId) || referralId === null) return;
  try {
    if (valid(referralId)) sessionStorage.setItem(key(productId), referralId);
    else sessionStorage.removeItem(key(productId));
  } catch { /* A private browser can disable storage. */ }
}
export function getProductReferral(productId: string): string | undefined {
  try {
    const value = sessionStorage.getItem(key(productId));
    return value && valid(value) ? value : undefined;
  } catch { return undefined; }
}
