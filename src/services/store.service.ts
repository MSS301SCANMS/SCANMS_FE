import api from './api';
import { unwrapApi } from '@/utils/api-response';

export class MissingOwnedStoreError extends Error {
  constructor() {
    super('Tài khoản chưa được liên kết với gian hàng nào.');
    this.name = 'MissingOwnedStoreError';
  }
}

function ownedStoreList(response: unknown): any[] {
  const value = unwrapApi(response);
  const list = Array.isArray(value) ? value : value?.items ?? value?.content;
  if (!Array.isArray(list) || list.some(store => !store || !(store.storeId || store.id))) {
    throw new Error('Chưa tải được danh sách gian hàng. Vui lòng thử lại.');
  }
  return list;
}

export interface StoreSettings {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  policyReturn?: string | null;
  policyWarranty?: string | null;
  policyShipping?: string | null;
  defaultCommissionRate: number;
  attributionWindowDays: number;
  representativeName?: string;
  businessType?: string;
  taxCode?: string;
  contactPhone?: string;
  contactEmail?: string;
  warehouseAddress?: string;
  payoutBankName?: string | null;
  payoutBankAccountNumber?: string | null;
  payoutBankAccountName?: string | null;
  onboardingStatus?: 'DRAFT' | 'PENDING_APPROVAL' | 'NEEDS_INFO' | 'VERIFIED' | 'REJECTED';
  isVerified?: boolean;
  onboardingData?: {
    representativeName?: string | null;
    businessType?: string | null;
    taxCode?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
    warehouseAddress?: string | null;
    payoutBankName?: string | null;
    payoutBankAccountNumber?: string | null;
    payoutBankAccountName?: string | null;
  } | null;
  owner?: {
    fullName: string;
    email: string;
    phoneNumber?: string | null;
  };
  _count?: {
    products: number;
    orders: number;
    campaigns: number;
  };
}

function normalizeStore(raw: any): StoreSettings {
  if (!raw) return raw;
  const id = raw.id || raw.storeId;
  return {
    ...raw,
    id,
    slug: raw.slug || id,
    defaultCommissionRate: Number(raw.defaultCommissionRate ?? 0),
    attributionWindowDays: Number(raw.attributionWindowDays ?? 0),
    onboardingStatus: raw.onboardingStatus || raw.approvalStatus || 'DRAFT',
    isVerified: raw.isVerified ?? String(raw.approvalStatus || '').toUpperCase() === 'APPROVED',
    logoUrl: raw.logoUrl || raw.logoRef || undefined,
  } as StoreSettings;
}

export const storeService = {
  async getMyStore(fresh = false): Promise<StoreSettings> {
    const res: any = await api.get('/stores/mine', {
      headers: fresh ? { 'x-skip-cache': 'true' } : undefined,
    });
    const list = ownedStoreList(res);
    const first = list[0];
    if (!first) {
      throw new MissingOwnedStoreError();
    }
    // `/mine` returns summary; enrich from detail when possible
    try {
      const detail: any = await api.get(`/stores/${first.storeId || first.id}`, {
        headers: { 'x-skip-cache': 'true' },
      });
      return normalizeStore(unwrapApi(detail));
    } catch {
      return normalizeStore(first);
    }
  },

  async listMyStores(fresh = false): Promise<StoreSettings[]> {
    const res: any = await api.get('/stores/mine', {
      headers: fresh ? { 'x-skip-cache': 'true' } : undefined,
    });
    return ownedStoreList(res).map(normalizeStore);
  },

  async updateMyStore(data: Partial<StoreSettings> & { id?: string }) {
    const storeId = data.id || (await this.getMyStore(true)).id;
    const body = {
      name: data.name,
      description: data.description,
      logoRef: data.logoUrl,
      websiteUrl: data.websiteUrl,
    };
    const res: any = await api.patch(`/stores/${storeId}`, body);
    return normalizeStore(unwrapApi(res));
  },

  async getPublicStore(shopId: string) {
    const res: any = await api.get(`/stores/public/id/${encodeURIComponent(shopId)}`);
    return normalizeStore(unwrapApi(res));
  },
};
