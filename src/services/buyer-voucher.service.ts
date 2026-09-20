export type BuyerVoucherScope = 'PLATFORM' | 'STORE' | 'PRODUCT' | 'CREATOR';

export interface BuyerVoucher {
  id: string;
  code: string;
  title: string;
  description: string;
  scope: BuyerVoucherScope;
  storeId?: string;
  productIds?: string[];
  minimumOrderAmount?: number;
  expiresAt?: string;
  savedAt: string;
}

const STORAGE_PREFIX = 'scanms-buyer-vouchers';

function getOwnerId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.id || user?.email || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

function storageKey() {
  return `${STORAGE_PREFIX}:${getOwnerId()}`;
}

function readAll(): BuyerVoucher[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey()) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(vouchers: BuyerVoucher[]) {
  localStorage.setItem(storageKey(), JSON.stringify(vouchers));
  window.dispatchEvent(new CustomEvent('scanms:vouchers-changed'));
}

export function isVoucherEligible(
  voucher: BuyerVoucher,
  input: { storeId?: string; productId?: string; subtotal: number },
  now = Date.now(),
) {
  if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < now) return false;
  if (voucher.minimumOrderAmount && input.subtotal < voucher.minimumOrderAmount) return false;
  if (voucher.storeId && voucher.storeId !== input.storeId) return false;
  if (voucher.productIds?.length && input.productId && !voucher.productIds.includes(input.productId)) {
    return false;
  }
  return true;
}

export const buyerVoucherService = {
  list() {
    return readAll().sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );
  },

  save(voucher: Omit<BuyerVoucher, 'savedAt'>) {
    const items = readAll();
    const normalizedCode = voucher.code.trim().toUpperCase();
    const saved: BuyerVoucher = {
      ...voucher,
      code: normalizedCode,
      savedAt: new Date().toISOString(),
    };
    const next = [saved, ...items.filter((item) => item.code !== normalizedCode)];
    writeAll(next);
    return saved;
  },

  remove(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    writeAll(readAll().filter((item) => item.code !== normalizedCode));
  },

  isSaved(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    return readAll().some((item) => item.code === normalizedCode);
  },

  eligibleFor(input: { storeId?: string; productId?: string; subtotal: number }) {
    return readAll().filter((voucher) => isVoucherEligible(voucher, input));
  },
};

