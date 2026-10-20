import api from './api';

export interface KycProfile {
  id: string;
  userId: string;
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
  return {
    id: raw?.collaboratorId || raw?.id || '',
    userId: raw?.userId || '',
    idCardNumber: raw?.idCardNumber,
    taxCode: raw?.taxCode,
    bankName: raw?.bankName,
    bankAccountNumber: raw?.bankAccountNumber,
    bankAccountName: raw?.bankAccountName,
    bio: raw?.bio || raw?.policyVersion,
    kycStatus: status,
    socialLinksJson: raw?.socialLinksJson || {
      submittedAt: raw?.joinedAt || raw?.createdAt,
      rejectionReason: raw?.rejectionReason,
    },
  };
}

async function currentUserId(): Promise<string> {
  const me: any = await api.get('/users/me');
  const user = me?.result ?? me?.data ?? me;
  const id = user?.userId || user?.id;
  if (!id) throw new Error('Không lấy được userId.');
  return id;
}

/** Map Nest KYC → Spring CollaboratorProfile (/collaborators) */
export const kycService = {
  async getMyKyc(_options: { forceRefresh?: boolean } = {}): Promise<KycProfile> {
    try {
      const res: any = await api.get('/collaborators/me');
      return mapCollaborator(res?.result ?? res?.data ?? res);
    } catch {
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

  async applyKolUpgrade(_data: ApplyKolData) {
    const userId = await currentUserId();
    const res: any = await api.post('/collaborators', {
      userId,
      approvalStatus: 'PENDING',
      policyVersion: 'v1',
    });
    return mapCollaborator(res?.result ?? res?.data ?? res);
  },

  async applyShopUpgrade(data: ApplyShopData) {
    const res: any = await api.post('/store-applications', {
      shopName: data.shopName,
      description: data.description,
      warehouseAddress: data.warehouseAddress,
      businessType: data.businessType,
      taxCode: data.taxCode,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
    });
    return res?.result ?? res?.data ?? res;
  },

  async getMyUpgradeStatus(): Promise<UpgradeStatusResponse> {
    let user: any = null;
    try {
      const me: any = await api.get('/users/me');
      user = me?.result ?? me?.data ?? me;
    } catch {
      user = null;
    }
    let kol: KycProfile | null = null;
    try {
      kol = await this.getMyKyc({ forceRefresh: true });
      if (!kol?.id) kol = null;
    } catch {
      kol = null;
    }
    return {
      userRole: user?.role || 'USER',
      kolApplication: kol
        ? {
            id: kol.id,
            status: kol.kycStatus || 'UNVERIFIED',
            totalFollowers: 0,
            socialLinksJson: kol.socialLinksJson,
            submittedAt: kol.socialLinksJson?.submittedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : null,
      shopApplication: null,
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
  }> {
    const kolApplications = await this.getPendingKyc();
    let shopApplications: StoreApplication[] = [];
    try {
      const res: any = await api.get('/store-applications');
      const list = res?.result ?? res?.data ?? [];
      shopApplications = Array.isArray(list) ? list : [];
    } catch {
      shopApplications = [];
    }
    return { kolApplications, shopApplications };
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

  async reviewShopApplication(
    storeId: string,
    status: 'VERIFIED' | 'NEEDS_INFO' | 'REJECTED',
    note?: string,
  ) {
    const res: any = await api.patch(`/store-applications/${storeId}/review`, { status, note });
    return res?.result ?? res?.data ?? res;
  },
};
