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
  kycStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  tier?: {
    id: string;
    name: string;
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
  policyShipping?: string; // Địa chỉ kho hàng
  policyReturn?: string;   // JSON giấy tờ pháp lý
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

export interface ApplyKolData {
  idCardNumber: string;
  taxCode?: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bio?: string;
  frontCardUrl?: string;
  backCardUrl?: string;
  platform: 'TIKTOK' | 'FACEBOOK' | 'YOUTUBE' | 'INSTAGRAM' | 'LEMON8' | 'OTHER';
  channelName: string;
  channelUrl: string;
  followerCount: number;
  channelProofUrl?: string;
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
}

export interface UpgradeStatusResponse {
  userRole: string;
  kolApplication: {
    id: string;
    status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
    tier?: string;
    totalFollowers: number;
    socialLinksJson?: any;
    submittedAt: string;
    updatedAt: string;
  } | null;
  shopApplication: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean;
    warehouseAddress?: string;
    submittedAt: string;
    updatedAt: string;
  } | null;
}

export const kycService = {
  async getMyKyc(): Promise<KycProfile> {
    const res: any = await api.get('/kyc/profile');
    return res.data;
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
  }) {
    const res: any = await api.put('/kyc/submit', data);
    return res.data;
  },

  async applyKolUpgrade(data: ApplyKolData) {
    const res: any = await api.post('/kyc/upgrade/kol', data);
    return res.data;
  },

  async applyShopUpgrade(data: ApplyShopData) {
    const res: any = await api.post('/kyc/upgrade/shop', data);
    return res.data;
  },

  async getMyUpgradeStatus(): Promise<UpgradeStatusResponse> {
    const res: any = await api.get('/kyc/upgrade/my-status');
    return res.data;
  },

  async getPendingKyc(): Promise<KycProfile[]> {
    const res: any = await api.get('/kyc/admin/pending');
    return res.data;
  },

  async getUpgradeApplications(): Promise<{
    kolApplications: KycProfile[];
    shopApplications: StoreApplication[];
  }> {
    const res: any = await api.get('/kyc/admin/applications');
    return res.data;
  },

  async reviewKyc(profileId: string, status: 'VERIFIED' | 'REJECTED', note?: string) {
    const res: any = await api.patch(`/kyc/admin/${profileId}/review`, { status, note });
    return res.data;
  },

  async reviewKolApplication(profileId: string, status: 'VERIFIED' | 'REJECTED', note?: string) {
    const res: any = await api.patch(`/kyc/admin/kol/${profileId}/review`, { status, note });
    return res.data;
  },

  async reviewShopApplication(storeId: string, status: 'VERIFIED' | 'REJECTED', note?: string) {
    const res: any = await api.patch(`/kyc/admin/shop/${storeId}/review`, { status, note });
    return res.data;
  },
};
