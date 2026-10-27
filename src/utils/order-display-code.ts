/** A readable label only; API calls and searches continue to use the full order ID. */
export function orderDisplayCode(code?: string | null): string {
  if (!code) return '—';
  return /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(code)
    ? `DH-${code.replaceAll('-', '').slice(0, 12).toUpperCase()}`
    : code;
}
