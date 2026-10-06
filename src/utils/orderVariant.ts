const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * The API only accepts persisted ProductVariant IDs. Older UI versions created
 * display-only IDs such as `${productId}-var-std`; those must be treated as a
 * base product instead of being submitted to the order API.
 */
export function normalizeOrderVariantId(value?: string | null): string | undefined {
  const candidate = value?.trim();
  return candidate && UUID_PATTERN.test(candidate) ? candidate : undefined;
}
