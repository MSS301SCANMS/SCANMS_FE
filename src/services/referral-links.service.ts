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
  exclusiveDealId?: string | null;
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
  commissionRate?: number | null;
  commissionType?: 'OPEN_OFFER' | 'CAMPAIGN' | 'EXCLUSIVE_DEAL';
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

export interface ExclusiveDealProposal {
  id: string;
  productId: string;
  storeId: string;
  conversationId: string;
  proposedCommissionRate: number;
  approvedCommissionRate?: number | null;
  currentCommissionRate?: number | null;
  isCurrentDeal?: boolean;
  salesCommitment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  shopResponse?: string | null;
  shortUrl?: string | null;
  product?: { id: string; title: string; imageUrl?: string | null; price?: string | number };
  store?: { id: string; name: string; logoUrl?: string | null };
  collaborator?: { id: string; fullName: string; email: string };
  createdAt: string;
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

function mapReferral(raw: any): ReferralLinkItem {
  const id = raw.id || raw.referralLinkId;
  const token = raw.token || raw.shortCode || id;
  return {
    id,
    collaboratorId: raw.collaboratorId,
    storeId: raw.storeId || '',
    productId: raw.productId,
    campaignId: null,
    shortCode: token,
    shortUrl: `/r/${token}`,
    label: null,
    channel: null,
    destinationPath: `/products/${raw.productId}`,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    status: (raw.status || 'ACTIVE') as ReferralLinkItem['status'],
    isActive: String(raw.status || 'ACTIVE').toUpperCase() === 'ACTIVE',
    expiresAt: raw.expiresAt || null,
    disabledReason: null,
    disabledBy: null,
    disabledAt: null,
    lastAccessedAt: null,
    customCouponCode: null,
    qrCodeUrl: null,
    totalClicks: 0,
    uniqueClicks: 0,
    totalOrders: 0,
    createdAt: raw.createdAt || new Date().toISOString(),
    product: {
      id: raw.productId,
      title: raw.productName || raw.productId,
      imageUrl: null,
      price: 0,
    },
    store: { id: raw.storeId || '', name: '', slug: '' },
  };
}

const noDeal = () => {
  throw new Error('BE chưa hỗ trợ affiliate-deals. Dùng /referrals.');
};

/** Map Nest referral/affiliate → Spring /referrals */
export const referralLinksService = {
  async getMyExclusiveDeals(): Promise<ExclusiveDealProposal[]> { return []; },
  async createExclusiveDeal(): Promise<ExclusiveDealProposal> { return noDeal(); },
  async getShopExclusiveDeals(): Promise<ExclusiveDealProposal[]> { return []; },
  async approveExclusiveDeal() { return noDeal(); },
  async rejectExclusiveDeal() { return noDeal(); },
  async terminateExclusiveDeal() { return noDeal(); },
  async deleteExclusiveDeal(id: string) {
    return { success: false, message: 'BE chưa hỗ trợ affiliate-deals', deletedId: id };
  },
  async getMyDealStatus() {
    return {
      isBlocked: false,
      violationsCount: 0,
      cooldownUntil: null,
      remainingDays: 0,
      reason: null,
      sampleRequestsBlocked: false,
      sampleRequestsBlockReason: null,
    };
  },

  async getEligibleProducts(params?: { search?: string; storeId?: string; page?: number; limit?: number }): Promise<EligibleProduct[]> {
    const res: any = await api.get('/public/products', { params });
    const payload = res?.result ?? res?.data ?? res;
    const list = Array.isArray(payload) ? payload : payload?.items || [];
    return list.map((p: any) => ({
      id: p.id || p.productId,
      title: p.title || p.name,
      sku: p.sku || '',
      categoryName: p.categoryName || null,
      imageUrl: p.imageUrl || null,
      originalPrice: p.originalPrice ?? null,
      price: p.price ?? p.priceVnd ?? 0,
      customCommissionRate: null,
      stockQuantity: p.stockQuantity ?? 0,
      store: {
        id: p.storeId || '',
        name: p.storeName || '',
        slug: p.storeId || '',
        defaultCommissionRate: 0,
      },
      estimatedCommissionRate: 0,
      estimatedCommissionAmount: 0,
    }));
  },

  async getMyLinks(_params?: QueryReferralLinksParams): Promise<{ data: ReferralLinkItem[]; meta: any }> {
    const res: any = await api.get('/referrals');
    const list = (res?.result ?? res?.data ?? []).map(mapReferral);
    return { data: list, meta: { total: list.length, page: 1, limit: list.length || 20, totalPages: 1 } };
  },

  async getLinkDetail(id: string): Promise<ReferralLinkItem> {
    const res: any = await api.get(`/referrals/${id}`);
    return mapReferral(res?.result ?? res?.data ?? res);
  },

  async createLink(payload: CreateReferralLinkPayload): Promise<ReferralLinkItem> {
    const me: any = await api.get('/collaborators/me');
    const collaboratorId = me?.result?.collaboratorId || me?.result?.id || me?.data?.id;
    if (!collaboratorId) throw new Error('Không tìm thấy hồ sơ collaborator.');
    const token = `ref-${payload.productId.slice(0, 8)}-${Date.now().toString(36)}`;
    const res: any = await api.post('/referrals', {
      collaboratorId,
      productId: payload.productId,
      token,
      status: 'ACTIVE',
      expiresAt: payload.expiresAt,
    });
    return mapReferral(res?.result ?? res?.data ?? res);
  },

  async updateLink(_id: string, _payload: Partial<CreateReferralLinkPayload>): Promise<ReferralLinkItem> {
    throw new Error('BE chưa hỗ trợ cập nhật referral link.');
  },

  async toggleStatus(_id: string): Promise<ReferralLinkItem> {
    throw new Error('BE chưa hỗ trợ đổi trạng thái referral link.');
  },

  async deleteLink(_id: string): Promise<{ success: boolean; message: string }> {
    throw new Error('BE chưa hỗ trợ xóa referral link.');
  },

  async getStoreLinks(_storeId: string, params?: QueryReferralLinksParams) {
    return this.getMyLinks(params);
  },

  async blockLink(_storeId: string, _linkId: string, _reason: string) {
    throw new Error('BE chưa hỗ trợ block referral link.');
  },
  async unblockLink(_storeId: string, _linkId: string) {
    throw new Error('BE chưa hỗ trợ unblock referral link.');
  },
  async getAdminReferralLinks(params?: QueryReferralLinksParams) {
    return this.getMyLinks(params);
  },
  async blockLinkByAdmin(_linkId: string, _reason: string) {
    throw new Error('BE chưa hỗ trợ block referral link.');
  },
  async unblockLinkByAdmin(_linkId: string) {
    throw new Error('BE chưa hỗ trợ unblock referral link.');
  },

  getQrDownloadUrl(id: string, _format: 'png' | 'svg' = 'png', _size: number = 1024): string {
    return `${window.location.origin}/r/${id}`;
  },

  async downloadQrCode(id: string, shortCode: string): Promise<void> {
    const text = `${window.location.origin}/r/${shortCode || id}`;
    await navigator.clipboard.writeText(text);
  },
};

export default referralLinksService;
