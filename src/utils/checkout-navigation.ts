export const CHECKOUT_HISTORY_KEY = 'scanmsCheckoutOverlay';

export function checkoutNavigationState(state: unknown): Record<string, unknown> {
  return {
    ...(state && typeof state === 'object' ? state : {}),
    [CHECKOUT_HISTORY_KEY]: crypto.randomUUID(),
  };
}
