export const RESOURCE_PATHS = [
  'stores', 'store-applications', 'products', 'product-categories', 'product-images',
  'product-variants', 'feedbacks', 'livestreams', 'orders', 'seller-orders', 'order-items',
  'shipments', 'returns', 'discount-allocations', 'payments', 'wallets',
  'wallet-transactions', 'bank-accounts', 'withdrawals', 'settlements', 'fee-configs',
  'vouchers', 'voucher-redemptions', 'collaborators', 'referrals',
  'commission-policies', 'commissions',
] as const;
export type ResourcePath = typeof RESOURCE_PATHS[number];
export class UnsupportedOperationError extends Error {
  readonly status = 501;
  readonly statusCode = 501;
  constructor(message = 'Chức năng này chưa sẵn sàng. Vui lòng quay lại sau.') {
    super(message);
    this.name = 'UnsupportedOperationError';
  }
}
export function isBackendEndpoint(method: string, url: string): boolean {
  const parts = url.split('?')[0].split('/').filter(Boolean);
  const verb = method.toUpperCase();
  if (parts.join('/') === 'users/me') return verb === 'GET' || verb === 'PATCH';
  if (parts.join('/') === 'products/ai-analyze') return verb === 'POST';
  if (!RESOURCE_PATHS.includes(parts[0] as ResourcePath)) return false;
  if (parts.length === 1) return verb === 'GET' || verb === 'POST';
  const validId = parts.length >= 2 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parts[1]);
  if (!validId) return false;
  if (parts.length === 2) {
    if (verb === 'GET') return true;
    if (verb === 'PATCH') return ['stores', 'products', 'product-categories', 'product-images', 'product-variants', 'livestreams'].includes(parts[0]);
    if (verb === 'DELETE') return ['products', 'product-images', 'product-variants'].includes(parts[0]);
  }
  if (parts.length !== 3) return false;
  if (verb === 'GET') return parts[0] === 'stores' && parts[2] === 'dashboard';
  if (verb !== 'POST') return false;
  const actions: Record<string, string[]> = {
    'store-applications': ['approve', 'reject'], stores: ['suspend', 'activate'],
    livestreams: ['start', 'end'], feedbacks: ['hide', 'remove'],
  };
  return actions[parts[0]]?.includes(parts[2]) || false;
}
export function readBackendEnvelope<T>(body: unknown): { code: number; message: string; result: T } {
  if (!body || typeof body !== 'object' || !('result' in body) || !('code' in body)
      || typeof body.code !== 'number' || !('message' in body) || typeof body.message !== 'string') {
    throw new Error('Phản hồi máy chủ không đúng định dạng SCANMS.');
  }
  if (body.code >= 400) throw new Error(body.message);
  return body as { code: number; message: string; result: T };
}
export function integerVnd(value: string | number): number {
  const amount = Number(value);
  if (String(value).trim() === '' || !Number.isSafeInteger(amount) || amount < 0) {
    throw new Error('Số tiền phải là số nguyên VND không âm, trong giới hạn an toàn.');
  }
  return amount;
}
export function percentage(value: string): number {
  if (!/^\d+(?:\.\d+)?$/.test(value) || !Number.isFinite(Number(value)) || Number(value) > 100) {
    throw new Error('Tỷ lệ giảm phải từ 0 đến 100%.');
  }
  return Number(value);
}
