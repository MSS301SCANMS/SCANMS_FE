/** Spring's legacy LocalDateTime contract stores UTC without a zone suffix. */
export function serverDate(value?: string | null): string | null {
  return value ? (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) && !/(Z|[+-]\d{2}:\d{2})$/.test(value) ? `${value}Z` : value) : null;
}
