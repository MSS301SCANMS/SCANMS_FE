import api from './api';

export interface StoreSettings {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  defaultCommissionRate: number;
  attributionWindowDays: number;
  minPayoutAmount: number;
  _count?: {
    products: number;
    orders: number;
    campaigns: number;
  };
}

export const storeService = {
  async getMyStore(): Promise<StoreSettings> {
    const res: any = await api.get('/stores/my-store');
    return res.data;
  },

  async updateMyStore(data: Partial<StoreSettings>) {
    const res: any = await api.put('/stores/my-store', data);
    return res.data;
  },

  async getPublicStore(slug: string) {
    const res: any = await api.get(`/stores/public/${slug}`);
    return res.data;
  },
};
