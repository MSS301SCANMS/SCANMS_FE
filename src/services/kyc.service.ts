import api from './api';

export interface KycProfile {
  id: string;
  userId: string;
  applicationData?: Partial<ApplyKolData>;
  createdAt?: string;
  updatedAt?: string;
  idCardNumber?: string;
  taxCode?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  bio?: string;
  kycStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED' | 'PENDING';
  tier?: {
    id: string;
    name: string;
    description?: string | null;
    extraBonusPercentage: number;
  };
  socialLinksJson?: {
    frontCardUrl?: string;
    backCardUrl?: string;
    platform?: string;
    channelName?: string;
    channelUrl?: string;
    followerCount?: number;
    channelProofUrl?: string;
    submittedAt?: string;
    rejectionReason?: string;
    [key: string]: any;
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    avatarUrl?: string | null;
    role?: string;
    socialChannels?: Array<{
      id: string;
      platformName: string;
      channelName: string;
      channelUrl: string;
      followerCount: number;
      isPrimary: boolean;
      status?: string;
    }>;
  };
}

export interface StoreApplication {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isVerified: boolean;
  onboardingStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'NEEDS_INFO' | 'VERIFIED' | 'REJECTED';
  onboardingData?: Partial<ApplyShopData>;
  onboardingSubmittedAt?: string;
  onboardingReviewedAt?: string;
  onboardingReviewNote?: string | null;
  policyShipping?: string;
  policyReturn?: string;
  createdAt?: string;
  updatedAt?: string;
  owner?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role: string;
  };
}

export class ShopApplicationSaveError extends Error {
  readonly application: StoreApplication;
  constructor(message: string, application: StoreApplication) {
    super(message);
    this.name = 'ShopApplicationSaveError';
    this.application = application;
  }
}

export interface SocialChannelFormItem {
  id?: string;
  platform: 'TIKTOK' | 'FACEBOOK' | 'YOUTUBE' | 'INSTAGRAM' | 'SHOPEE_VIDEO' | 'LEMON8' | 'OTHER';
  channelName: string;
  channelUrl: string;
  followerCount: number;
  channelProofUrl?: string;
  isPrimary?: boolean;
}

export interface ApplyKolData {
  idCardNumber: string;
  taxCode?: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bio?: string;
  frontCardUrl?: string;
  backCardUrl?: string;
  platform?: 'TIKTOK' | 'FACEBOOK' | 'YOUTUBE' | 'INSTAGRAM' | 'SHOPEE_VIDEO' | 'LEMON8' | 'OTHER';
  channelName?: string;
  channelUrl?: string;
  followerCount?: number;
  channelProofUrl?: string;
  channels?: SocialChannelFormItem[];
  specialtyCategories?: string[];
  contentStyles?: string[];
}

export interface ApplyShopData {
  shopName: string;
  description?: string;
  warehouseAddress: string;
  businessType: 'INDIVIDUAL' | 'HOUSEHOLD' | 'ENTERPRISE';
  taxCode: string;
  businessLicenseUrl?: string;
  brandAuthorizationUrl?: string;
  contactPhone: string;
  contactEmail: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  idCardNumber?: string;
  frontCardUrl?: string;
  backCardUrl?: string;
}

export interface UpgradeStatusResponse {
  userRole: string;
  kolApplication: {
    id: string;
    applicationData?: Partial<ApplyKolData>;
    status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED' | 'PENDING';
    tier?: string;
    totalFollowers: number;
    socialLinksJson?: any;
    channels?: any[];
    submittedAt: string;
    updatedAt: string;
  } | null;
  shopApplication: {
    id: string;
    name: string;
    description?: string | null;
    slug: string;
    isVerified: boolean;
    onboardingStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'NEEDS_INFO' | 'VERIFIED' | 'REJECTED';
    onboardingData?: Partial<ApplyShopData>;
    onboardingReviewNote?: string | null;
    warehouseAddress?: string;
    submittedAt: string;
    updatedAt: string;
  } | null;
}

function mapStatus(raw?: string): KycProfile['kycStatus'] {
  const s = String(raw || '').toUpperCase();
  if (s === 'APPROVED' || s === 'ACTIVE' || s === 'VERIFIED') return 'VERIFIED';
  if (s === 'REJECTED') return 'REJECTED';
  if (s === 'PENDING') return 'PENDING';
  return 'UNVERIFIED';
}

function mapCollaborator(raw: any): KycProfile {
  const status = mapStatus(raw?.approvalStatus || raw?.kycStatus || raw?.status);
  const application = raw?.applicationData || {};
  return {
    id: raw?.collaboratorId || raw?.id || '',
    userId: raw?.userId || '',
    applicationData: application,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
    idCardNumber: application.idCardNumber || raw?.idCardNumber,
    taxCode: application.taxCode || raw?.taxCode,
    bankName: application.bankName || raw?.bankName,
    bankAccountNumber: application.bankAccountNumber || raw?.bankAccountNumber,
    bankAccountName: application.bankAccountName || raw?.bankAccountName,
    bio: application.bio || raw?.bio,
    kycStatus: status,
    socialLinksJson: Object.keys(application).length ? { ...application, rejectionReason: raw?.rejectionReason } : raw?.socialLinksJson || {
      submittedAt: raw?.joinedAt || raw?.createdAt,
      rejectionReason: raw?.rejectionReason,
    },
  };
}

function mapStoreApplication(raw: any): StoreApplication {
  const status = String(raw.status || '').toUpperCase();
  return {
    id: raw.applicationId || raw.id,
    name: raw.proposedStoreName || raw.name || '',
    slug: raw.slug || '',
    description: raw.description || '',
    isVerified: status === 'APPROVED',
    onboardingStatus: status === 'APPROVED' ? 'VERIFIED' : status === 'REJECTED' ? 'REJECTED'
      : status === 'NEEDS_INFO' ? 'NEEDS_INFO' : status === 'DRAFT' ? 'DRAFT' : 'PENDING_APPROVAL',
    onboardingData: raw.onboardingData || {},
    onboardingReviewNote: raw.reviewNote || null,
    onboardingSubmittedAt: raw.submittedAt || raw.createdAt,
    onboardingReviewedAt: raw.reviewedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/** Map Nest KYC → Spring CollaboratorProfile (/collaborators) */
export const kycService = {
  async getMyKyc(_options: { forceRefresh?: boolean } = {}): Promise<KycProfile> {
    try {
      const res: any = await api.get('/collaborators/me', { headers: { 'x-skip-cache': 'true' } });
      return mapCollaborator(res?.result ?? res?.data ?? res);
    } catch (error: any) {
      if (error?.response?.status !== 404) throw error;
      return {
        id: '',
        userId: '',
        kycStatus: 'UNVERIFIED',
      };
    }
  },

  async submitKyc(data: {
    idCardNumber: string;
    taxCode: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    bio?: string;
    frontCardUrl?: string;
    backCardUrl?: string;
    channelProofUrl?: string;
    platform?: string;
    channelName?: string;
    channelUrl?: string;
    followerCount?: number;
  }) {
    return this.applyKolUpgrade({
      idCardNumber: data.idCardNumber,
      taxCode: data.taxCode,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
      bankAccountName: data.bankAccountName,
      bio: data.bio,
      frontCardUrl: data.frontCardUrl,
      backCardUrl: data.backCardUrl,
      channelProofUrl: data.channelProofUrl,
      platform: data.platform as ApplyKolData['platform'],
      channelName: data.channelName,
      channelUrl: data.channelUrl,
      followerCount: data.followerCount,
    });
  },

  async applyKolUpgrade(data: ApplyKolData) {
    const payload = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
    let res: any;
    try { res = await api.post('/collaborators/application', payload); }
    catch (error: any) {
      if (error?.response?.status === 404) throw new Error('Dịch vụ chưa hỗ trợ lưu đầy đủ hồ sơ KOL. Hãy cập nhật promotion-affiliate-service; thông tin bạn vừa nhập vẫn được giữ.');
      if (error?.response?.status >= 500 && /unexpected error|internal server error/i.test(error?.message || '')) throw new Error('Chưa lưu được hồ sơ KOL do lỗi máy chủ. Nếu vừa cập nhật backend, hãy Stop rồi Run lại promotion-affiliate-service và gửi lại ngay trên form này. Không tải lại trang để tránh mất nội dung đang nhập.');
      throw error;
    }
    const application = mapCollaborator(res?.result ?? res?.data ?? res);
    const matches = (saved: KycProfile) => saved.id === application.id && saved.kycStatus === 'PENDING'
      && Object.entries(payload).filter(([, value]) => value !== '' && value !== undefined).every(([key, value]) => JSON.stringify(saved.applicationData?.[key as keyof ApplyKolData]) === JSON.stringify(value));
    if (!application.id || !matches(application)) throw new Error('Máy chủ chưa lưu đầy đủ hồ sơ KOL. Thông tin bạn vừa nhập vẫn được giữ; vui lòng cập nhật dịch vụ rồi thử lại.');
    const saved = await this.getMyKyc({ forceRefresh: true });
    if (!matches(saved)) throw new Error('Dữ liệu hồ sơ đọc lại chưa khớp. Thông tin bạn vừa nhập vẫn được giữ để gửi lại.');
    return saved;
  },

  async applyShopUpgrade(data: ApplyShopData, pendingApplicationId?: string) {
    const onboardingData = Object.fromEntries(Object.entries(data)
      .filter(([, value]) => typeof value === 'string' && value.trim())
      .map(([key, value]) => [key, (value as string).trim()]));
    const request = {
      proposedStoreName: data.shopName.trim(),
      description: data.description?.trim(),
      onboardingData,
    };
    const res: any = pendingApplicationId
      ? await api.put(`/store-applications/${encodeURIComponent(pendingApplicationId)}`, request)
      : await api.post('/store-applications', request);
    const application = mapStoreApplication(res?.result ?? res?.data ?? res ?? {});
    const hasSavedDetails = (saved: StoreApplication) => saved.id === application.id
      && saved.name === request.proposedStoreName
      && (saved.description || '') === (request.description || '')
      && Object.entries(onboardingData).every(([key, value]) =>
        saved.onboardingData?.[key as keyof ApplyShopData] === value);
    if (!application.id) throw new Error('Máy chủ chưa xác nhận hồ sơ đã được lưu. Vui lòng kiểm tra trạng thái trước khi gửi lại.');
    if (!hasSavedDetails(application)) {
      throw new ShopApplicationSaveError('Máy chủ chưa lưu đầy đủ thông tin và giấy tờ. Hồ sơ chưa đủ dữ liệu để xét duyệt; các mục bạn vừa nhập vẫn được giữ trong biểu mẫu này.', application);
    }
    // Read the persisted record before reporting success; an old API may accept and ignore new fields.
    try {
      const stored: any = await api.get(`/store-applications/${encodeURIComponent(application.id)}`, { headers: { 'x-skip-cache': 'true' } });
      const verified = mapStoreApplication(stored?.result ?? stored?.data ?? stored ?? {});
      if (!hasSavedDetails(verified)) {
        throw new ShopApplicationSaveError('Dữ liệu đọc lại chưa khớp với thông tin và giấy tờ vừa gửi. Các mục bạn vừa nhập vẫn được giữ trong biểu mẫu này.', application);
      }
      return verified;
    } catch (error) {
      if (error instanceof ShopApplicationSaveError) throw error;
      throw new ShopApplicationSaveError('Chưa xác nhận được thông tin và giấy tờ đã lưu. Các mục bạn vừa nhập vẫn được giữ; vui lòng thử cập nhật lại hồ sơ này.', application);
    }
  },

  async getMyUpgradeStatus(): Promise<UpgradeStatusResponse> {
    let user: any = null;
    try {
      const me: any = await api.get('/users');
      user = me?.result ?? me?.data ?? me;
    } catch {
      user = null;
    }
    if (!user?.userId && !user?.id) throw new Error('Không tải được tài khoản hiện tại. Vui lòng thử lại.');
    let kol: KycProfile | null = null;
    kol = await this.getMyKyc({ forceRefresh: true });
    if (!kol?.id) kol = null;
    const shopResponse: any = await api.get('/store-applications', { headers: { 'x-skip-cache': 'true' } });
    const shopRows = shopResponse?.result ?? shopResponse?.data ?? shopResponse;
    if (!Array.isArray(shopRows)) throw new Error('Không tải được trạng thái hồ sơ gian hàng. Vui lòng thử lại.');
    const ownedShops = shopRows.filter((application: any) => application.applicantUserId === (user?.userId || user?.id));
    // A pending/approved application blocks resubmission; otherwise show the latest rejected draft.
    ownedShops.sort((a: any, b: any) => {
      const priority = (item: any) => item.status === 'APPROVED' ? 2 : item.status === 'PENDING' ? 1 : 0;
      return priority(b) - priority(a) || Date.parse(b.submittedAt || b.createdAt || '1970-01-01') - Date.parse(a.submittedAt || a.createdAt || '1970-01-01');
    });
    const shop = ownedShops[0] ? mapStoreApplication(ownedShops[0]) : null;
    return {
      userRole: user?.role || 'USER',
      kolApplication: kol
        ? {
            id: kol.id,
            applicationData: kol.applicationData,
            status: kol.kycStatus || 'UNVERIFIED',
            totalFollowers: Number(kol.applicationData?.followerCount || 0),
            socialLinksJson: kol.socialLinksJson,
            submittedAt: kol.socialLinksJson?.submittedAt || kol.createdAt || '',
            updatedAt: kol.updatedAt || '',
          }
        : null,
      shopApplication: shop ? {
        id: shop.id, name: shop.name, description: shop.description, slug: shop.slug,
        isVerified: shop.isVerified, onboardingStatus: shop.onboardingStatus,
        onboardingData: shop.onboardingData, onboardingReviewNote: shop.onboardingReviewNote,
        warehouseAddress: shop.onboardingData?.warehouseAddress,
        submittedAt: shop.onboardingSubmittedAt || '', updatedAt: shop.updatedAt || '',
      } : null,
    };
  },

  async getPendingKyc(): Promise<KycProfile[]> {
    const res: any = await api.get('/collaborators');
    const list = res?.result ?? res?.data ?? [];
    return (Array.isArray(list) ? list : [])
      .filter((c: any) => String(c.approvalStatus || '').toUpperCase() === 'PENDING')
      .map(mapCollaborator);
  },

  async getUpgradeApplications(): Promise<{
    kolApplications: KycProfile[];
    shopApplications: StoreApplication[];
    errors: { kol?: string; shop?: string };
  }> {
    const readList = async (path: string) => {
      const res: any = await api.get(path, { headers: { 'x-skip-cache': 'true' } });
      const list = res?.result ?? res?.data ?? res;
      if (!Array.isArray(list)) throw new Error('Dữ liệu hồ sơ chưa hợp lệ. Vui lòng tải lại.');
      return list;
    };
    const [kol, shop] = await Promise.allSettled([readList('/collaborators'), readList('/store-applications')]);
    return {
      kolApplications: kol.status === 'fulfilled' ? kol.value.map(mapCollaborator) : [],
      shopApplications: shop.status === 'fulfilled' ? shop.value.map(mapStoreApplication) : [],
      errors: {
        ...(kol.status === 'rejected' ? { kol: kol.reason?.message || 'Chưa tải được hồ sơ KOL.' } : {}),
        ...(shop.status === 'rejected' ? { shop: shop.reason?.message || 'Chưa tải được hồ sơ gian hàng.' } : {}),
      },
    };
  },

  async reviewKyc(profileId: string, status: 'VERIFIED' | 'REJECTED', note?: string) {
    return this.reviewKolApplication(profileId, status, note);
  },

  async reviewKolApplication(profileId: string, status: 'VERIFIED' | 'REJECTED', note?: string) {
    if (status === 'VERIFIED') {
      const res: any = await api.patch(`/collaborators/${profileId}/approve`);
      return mapCollaborator(res?.result ?? res?.data ?? res);
    }
    const res: any = await api.patch(`/collaborators/${profileId}/reject`, {
      reason: note || 'Rejected by admin',
    });
    return mapCollaborator(res?.result ?? res?.data ?? res);
  },

  async syncApprovedKolRole(profileId: string) {
    const res: any = await api.patch(`/collaborators/${profileId}/approve`);
    return mapCollaborator(res?.result ?? res?.data ?? res);
  },

  async reviewShopApplication(
    storeId: string,
    status: 'VERIFIED' | 'NEEDS_INFO' | 'REJECTED',
    note?: string,
  ) {
    if (status === 'NEEDS_INFO') throw new Error('Yêu cầu bổ sung hồ sơ chưa được hỗ trợ.');
    const action = status === 'VERIFIED' ? 'approve' : 'reject';
    const res: any = await api.post(`/store-applications/${encodeURIComponent(storeId)}/${action}`, { note: note?.trim() || undefined });
    return mapStoreApplication(res?.result ?? res?.data ?? res);
  },
};
