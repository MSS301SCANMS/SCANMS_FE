import api from './api';

export interface EligibleProduct {
  id: string;
  title: string;
  sku: string;
  categoryName: string | null;
  imageUrl: string | null;
  originalPrice: string | number | null;
  price: string | number;
  customCommissionRate: string | number | null;
  stockQuantity: number;
  store: {
    id: string;
    name: string;
    slug: string;
    defaultCommissionRate: string | number;
  };
  estimatedCommissionRate: number;
  estimatedCommissionAmount: number;
}

export interface ReferralLinkItem {
  id: string;
  collaboratorId: string;
  storeId: string;
  productId: string;
  campaignId: string | null;
  shortCode: string;
  shortUrl: string;
  label: string | null;
  channel: string | null;
  destinationPath: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'BLOCKED';
  isActive: boolean;
  expiresAt: string | null;
  disabledReason: string | null;
  disabledBy: string | null;
  disabledAt: string | null;
  lastAccessedAt: string | null;
  customCouponCode: string | null;
  qrCodeUrl: string | null;
  qrDownloadCount?: number;
  totalClicks: number;
  uniqueClicks: number;
  totalOrders: number;
  createdAt: string;
  commissionRate?: number;
  product: {
    id: string;
    title: string;
    imageUrl: string | null;
    price: string | number;
    customCommissionRate?: string | number | null;
    store?: {
      id: string;
      name: string;
      defaultCommissionRate: string | number;
    };
  };
  store: {
    id: string;
    name: string;
    slug: string;
  };
  collaborator?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
  };
}

export interface CreateReferralLinkPayload {
  productId: string;
  campaignId?: string;
  label?: string;
  channel?: string;
  customCouponCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  expiresAt?: string;
}

export interface QueryReferralLinksParams {
  page?: number;
  limit?: number;
  status?: string;
  channel?: string;
  storeId?: string;
  campaignId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const referralLinksService = {

  async getEligibleProducts(params?: { search?: string; storeId?: string }): Promise<EligibleProduct[]> {
    const res: any = await api.get('/collaborator/referral-links/products', { params });
    return res?.data || res || [];
  },

  async getMyLinks(params?: QueryReferralLinksParams): Promise<{ data: ReferralLinkItem[]; meta: any }> {
    const res: any = await api.get('/collaborator/referral-links', { params });
    const payload = res?.data || res;
    return {
      data: payload?.data || [],
      meta: payload?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  async getLinkDetail(id: string): Promise<ReferralLinkItem> {
    const res: any = await api.get(`/collaborator/referral-links/${id}`);
    return res?.data?.data || res?.data || res;
  },

  async createLink(payload: CreateReferralLinkPayload): Promise<ReferralLinkItem> {
    const res: any = await api.post('/collaborator/referral-links', payload);
    return res?.data?.data || res?.data || res;
  },

  async updateLink(id: string, payload: Partial<CreateReferralLinkPayload>): Promise<ReferralLinkItem> {
    const res: any = await api.patch(`/collaborator/referral-links/${id}`, payload);
    return res?.data?.data || res?.data || res;
  },

  async toggleStatus(id: string): Promise<ReferralLinkItem> {
    const res: any = await api.patch(`/collaborator/referral-links/${id}/status`);
    return res?.data?.data || res?.data || res;
  },

  async deleteLink(id: string): Promise<{ success: boolean; message: string }> {
    const res: any = await api.delete(`/collaborator/referral-links/${id}`);
    return res?.data || res;
  },

  async getStoreLinks(storeId: string, params?: QueryReferralLinksParams): Promise<{ data: ReferralLinkItem[]; meta: any }> {
    const res: any = await api.get(`/stores/${storeId}/referral-links`, { params });
    const payload = res?.data || res;
    return {
      data: payload?.data || [],
      meta: payload?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  async blockLink(storeId: string, linkId: string, reason: string): Promise<any> {
    const res: any = await api.patch(`/stores/${storeId}/referral-links/${linkId}/block`, { reason });
    return res?.data || res;
  },

  async unblockLink(storeId: string, linkId: string): Promise<any> {
    const res: any = await api.patch(`/stores/${storeId}/referral-links/${linkId}/unblock`);
    return res?.data || res;
  },

  async getAdminReferralLinks(params?: QueryReferralLinksParams): Promise<{ data: ReferralLinkItem[]; meta: any }> {
    const res: any = await api.get('/admin/referral-links', { params });
    const payload = res?.data || res;
    return {
      data: payload?.data || [],
      meta: payload?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  async blockLinkByAdmin(linkId: string, reason: string): Promise<any> {
    const res: any = await api.patch(`/admin/referral-links/${linkId}/block`, { reason });
    return res?.data || res;
  },

  async unblockLinkByAdmin(linkId: string): Promise<any> {
    const res: any = await api.patch(`/admin/referral-links/${linkId}/unblock`);
    return res?.data || res;
  },

  getQrDownloadUrl(id: string, format: 'png' | 'svg' = 'png', size: number = 1024): string {
    const baseURL = (api.defaults.baseURL || '/api').replace(/\/$/, '');
    return `${baseURL}/referral-links/${id}/qr?format=${format}&size=${size}&download=true`;
  },

  async downloadQrCode(
    id: string,
    shortCode: string,
    format: 'png' | 'svg' = 'png',
    size: number = 1024,
  ): Promise<void> {
    const res = await api.get(`/referral-links/${id}/qr`, {
      params: { format, size, download: true },
      responseType: 'blob',
    });
    const mimeType = format === 'png' ? 'image/png' : 'image/svg+xml;charset=utf-8';
    const responseData = res instanceof Blob ? res : (res as any)?.data ?? res;
    const blob =
      responseData instanceof Blob
        ? responseData
        : new Blob([responseData], { type: mimeType });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `SCANMS-QR-${shortCode}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  },
};

export default referralLinksService;
