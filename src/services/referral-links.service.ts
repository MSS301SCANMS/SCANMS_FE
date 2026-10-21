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
  const expiry = raw.expiresAt && (/Z$|[+-]\d{2}:\d{2}$/.test(raw.expiresAt) ? raw.expiresAt : `${raw.expiresAt}Z`);
  const status = expiry && Date.parse(expiry) <= Date.now() ? 'EXPIRED' : raw.status === 'INACTIVE' ? 'PAUSED' : raw.status || 'ACTIVE';
  return {
    id,
    collaboratorId: raw.collaboratorId,
    storeId: raw.storeId || '',
    productId: raw.productId,
    campaignId: null,
    shortCode: token,
    shortUrl: new URL(`/r/${encodeURIComponent(token)}`, window.location.origin).href,
    label: raw.label || null,
    channel: raw.channel || null,
    destinationPath: `/products/${raw.productId}`,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    status,
    isActive: status === 'ACTIVE',
    expiresAt: expiry || null,
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
      imageUrl: raw.productImageUrl || raw.product?.imageUrl || null,
      price: raw.productPrice ?? raw.product?.price ?? 0,
    },
    store: { id: raw.storeId || '', name: '', slug: '' },
  };
}

export const EXCLUSIVE_DEALS_UNSUPPORTED_MESSAGE = 'Thỏa thuận độc quyền chưa được hỗ trợ';

const noDeal = () => {
  throw new Error(EXCLUSIVE_DEALS_UNSUPPORTED_MESSAGE);
};

/** Map Nest referral/affiliate → Spring /referrals */
export const referralLinksService = {
  // Enable only when the configured backend implements the complete deal API.
  supportsExclusiveDeals: false,
  async getMyExclusiveDeals(): Promise<ExclusiveDealProposal[]> { return noDeal(); },
  async createExclusiveDeal(_payload?: any): Promise<ExclusiveDealProposal> { return noDeal(); },
  async getShopExclusiveDeals(): Promise<ExclusiveDealProposal[]> { return noDeal(); },
  async approveExclusiveDeal(_id?: string, _voucher?: any) { return noDeal(); },
  async rejectExclusiveDeal(_id?: string, _reason?: string) { return noDeal(); },
  async terminateExclusiveDeal(_id?: string, _payload?: any) { return noDeal(); },
  async deleteExclusiveDeal(_id: string) { return noDeal(); },
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
    const res: any = await api.get('/public/products', { params: { ...params, eligibleForReferral: true } });
    const payload = res?.result ?? res?.data ?? res;
    const list = Array.isArray(payload) ? payload : payload?.items || [];
    return list.filter((p: any) => p.status === 'ACTIVE').map((p: any) => ({
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
        id: p.storeId || p.store?.id || '',
        name: p.storeName || p.store?.name || 'Gian hàng',
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

  async createLink(payload: CreateReferralLinkPayload, requestToken: string = crypto.randomUUID()): Promise<ReferralLinkItem> {
    const res: any = await api.post('/referrals', {
      productId: payload.productId,
      token: requestToken,
      label: payload.label?.trim() || undefined,
      channel: payload.channel,
      status: 'ACTIVE',
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt).toISOString().replace(/Z$/, '') : undefined,
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

  async getStoreLinks(storeId: string, params?: QueryReferralLinksParams) {
    if (!storeId) throw new Error('Chưa xác định được gian hàng. Vui lòng thử lại.');
    const res: any = await api.get(`/referrals/store/${encodeURIComponent(storeId)}`, { headers: { 'x-skip-cache': 'true' } });
    const payload = res?.result ?? res?.data ?? res;
    if (!Array.isArray(payload)) throw new Error('Danh sách liên kết chưa hợp lệ. Vui lòng thử lại.');
    let list = payload.map(mapReferral).filter(link => link.storeId === storeId);
    if (params?.status) list = list.filter(link => link.status === params.status);
    if (params?.channel) list = list.filter(link => link.channel === params.channel);
    if (params?.search) {
      const query = params.search.trim().toLocaleLowerCase('vi-VN');
      list = list.filter(link => [link.shortCode, link.product.title, link.collaboratorId, link.collaborator?.fullName, link.label]
        .some(value => value?.toLocaleLowerCase('vi-VN').includes(query)));
    }
    list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const page = Math.max(1, params?.page || 1), limit = Math.max(1, params?.limit || 30);
    return { data: list.slice((page - 1) * limit, page * limit), meta: { total: list.length, page, limit, totalPages: Math.max(1, Math.ceil(list.length / limit)) } };
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

  async downloadQrCode(id: string, shortCode: string, _format?: 'png' | 'svg', _size?: number): Promise<void> {
    const text = `${window.location.origin}/r/${shortCode || id}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  },
};

export default referralLinksService;
