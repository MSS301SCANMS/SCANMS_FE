import api from './api';

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

export const storeService = {
  async getMyStore(): Promise<StoreSettings> {
    const res: any = await api.get('/stores/my-store');
    return res?.data || res;
  },

  async getMyStores(): Promise<StoreSettings[]> {
    const res: any = await api.get('/stores/my-stores');
    return res?.data || res || [];
  },

  async updateMyStore(data: Partial<StoreSettings>) {
    const res: any = await api.put('/stores/my-store', data);
    return res?.data || res;
  },

  async getPublicStore(slug: string) {
    const res: any = await api.get(`/stores/public/${slug}`);
    return res?.data || res;
  },
};
