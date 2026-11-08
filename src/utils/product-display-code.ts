/** Display label only; product references and API requests keep the full ID. */
export function productDisplayCode(code?: string | null): string {
  if (!code) return '—';
  return /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(code)
    ? `SP-${code.replaceAll('-', '').slice(0, 12).toUpperCase()}`
    : code;
}
