import api from './api';

export type CouponStatus =
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'PAUSED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'BLOCKED'
  | 'DELETED';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type CouponScope = 'STORE_WIDE' | 'PRODUCTS' | 'CATEGORIES' | 'CAMPAIGN';
export type CouponFundingSource = 'SHOP_FUNDED' | 'CO_FUNDED' | 'PLATFORM_FUNDED';

export interface CouponItem {
  id: string;
  codeNormalized: string;
  displayCode: string;
  collaboratorId: string;
  storeId: string;
  campaignId?: string | null;
  status: CouponStatus;
  discountType: DiscountType;
  discountValue: number | string;
  minimumOrderAmount?: number | string | null;
  maximumDiscountAmount?: number | string | null;
  usageLimitTotal?: number | null;
  usageLimitPerCustomer: number;
  usageCount: number;
  budgetTotal?: number | string | null;
  budgetUsed: number | string;
  startsAt?: string | null;
  expiresAt?: string | null;
  scopeType: CouponScope;
  fundingSource: CouponFundingSource;
  shopFundingRate?: number | string;
  platformFundingRate?: number | string;
  stackableWithProductDiscount?: boolean;
  stackableWithShopVoucher?: boolean;
  stackableWithPlatformVoucher?: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  blockedReason?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deleteReason?: string | null;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  collaborator?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    collaboratorProfile?: {
      avatarUrl?: string | null;
      tier?: { name: string } | null;
    } | null;
  };
  couponProducts?: Array<{
    id: string;
    product: {
      id: string;
      title: string;
      price: number | string;
      imageUrl?: string | null;
    };
  }>;
  couponCategories?: Array<{
    id: string;
    categoryName: string;
  }>;
  _count?: {
    redemptions: number;
    orders: number;
  };
}

export interface ValidateCouponPayload {
  code: string;
  storeId?: string;
  customerPhone?: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface ValidateCouponResponse {
  valid: boolean;
  couponId: string;
  code: string;
  storeId: string;
  storeName: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  eligibleSubtotal: number;
  eligibleProductIds: string[];
  message: string;
}

export interface CreateCouponPayload {
  storeId: string;
  code: string;
  campaignId?: string;
}

export interface ApproveCouponPayload {
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimitTotal?: number;
  usageLimitPerCustomer?: number;
  budgetTotal?: number;
  startsAt?: string;
  expiresAt?: string;
  scopeType?: CouponScope;
  productIds?: string[];
  categoryNames?: string[];
  fundingSource?: CouponFundingSource;
  shopFundingRate?: number;
  platformFundingRate?: number;
  stackableWithProductDiscount?: boolean;
  stackableWithShopVoucher?: boolean;
  stackableWithPlatformVoucher?: boolean;
}

export interface CouponFilterParams {
  search?: string;
  status?: CouponStatus;
  storeId?: string;
  page?: number;
  limit?: number;
}

export const couponService = {



  validateCoupon: async (
    payload: ValidateCouponPayload,
  ): Promise<ValidateCouponResponse> => {
    const res = await api.post('/coupons/validate', payload);
    return res.data;
  },




  getKolCoupons: async (params?: CouponFilterParams) => {
    const res = await api.get('/collaborator/coupons', { params });
    return res.data;
  },

  getKolCouponDetail: async (id: string): Promise<CouponItem> => {
    const res = await api.get(`/collaborator/coupons/${id}`);
    return res.data;
  },

  proposeCoupon: async (payload: CreateCouponPayload) => {
    const res = await api.post('/collaborator/coupons', payload);
    return res.data;
  },

  togglePauseCoupon: async (id: string) => {
    const res = await api.patch(`/collaborator/coupons/${id}/pause`);
    return res.data;
  },

  deleteCoupon: async (id: string, reason?: string) => {
    const res = await api.delete(`/collaborator/coupons/${id}`, {
      data: { reason },
    });
    return res.data;
  },




  getStoreCoupons: async (storeId: string, params?: CouponFilterParams) => {
    const res = await api.get(`/stores/${storeId}/coupons`, { params });
    return res.data;
  },

  approveCoupon: async (
    storeId: string,
    couponId: string,
    payload: ApproveCouponPayload,
  ) => {
    const res = await api.patch(
      `/stores/${storeId}/coupons/${couponId}/approve`,
      payload,
    );
    return res.data;
  },

  rejectCoupon: async (storeId: string, couponId: string, reason: string) => {
    const res = await api.patch(
      `/stores/${storeId}/coupons/${couponId}/reject`,
      { reason },
    );
    return res.data;
  },

  updatePolicy: async (
    storeId: string,
    couponId: string,
    payload: Partial<ApproveCouponPayload>,
  ) => {
    const res = await api.patch(
      `/stores/${storeId}/coupons/${couponId}/policy`,
      payload,
    );
    return res.data;
  },

  blockCoupon: async (storeId: string, couponId: string, reason: string) => {
    const res = await api.patch(`/stores/${storeId}/coupons/${couponId}/block`, {
      reason,
    });
    return res.data;
  },




  getAdminCoupons: async (params?: CouponFilterParams) => {
    const res = await api.get('/admin/coupons', { params });
    return res.data;
  },

  adminBlockCoupon: async (id: string, reason: string) => {
    const res = await api.patch(`/admin/coupons/${id}/block`, { reason });
    return res.data;
  },

  adminUnblockCoupon: async (id: string) => {
    const res = await api.patch(`/admin/coupons/${id}/unblock`);
    return res.data;
  },
};
