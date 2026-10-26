import api from './api';
import { platformVoucher, type PlatformVoucher } from '../utils/platform-voucher.utils';

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

export interface PlatformSubsidySummary {
  storeId: string;
  storeName: string;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  orderCount: number;
  reimbursementReady: boolean;
  orders: Array<{ orderId: string; orderCode: string; amount: number; paidAmount: number; outstandingAmount: number; payments: Array<{ amount: number; bankReference: string; paidAt: string }> }>;
}

export interface PublicStoreCoupon {
  benefitType?: 'GOODS' | 'SHIPPING';
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number | null;
  maximumDiscountAmount: number | null;
  remainingUses: number | null;
  expiresAt: string | null;
  scopeType: CouponScope;
  products: Array<{ id: string; title: string }>;
  categories: string[];
  storeName: string;
}

export interface CouponItem {
  benefitType?: 'GOODS' | 'SHIPPING';
  id: string;
  codeNormalized: string;
  displayCode: string;
  collaboratorId: string;
  storeId: string;
  campaignId?: string | null;
  campaign?: { id: string; name: string; isActive: boolean; startDate: string; endDate: string } | null;
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

export interface CreateStoreCouponPayload {
  benefitType?: 'GOODS' | 'SHIPPING';
  code: string;
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
  campaignId?: string;
  productIds?: string[];
  categoryNames?: string[];
  stackableWithProductDiscount?: boolean;
  stackableWithShopVoucher?: boolean;
  stackableWithPlatformVoucher?: boolean;
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

function mapVoucher(raw: any): any {
  if (!raw) return raw;
  return {
    ...raw,
    id: raw.id || raw.voucherId,
    displayCode: raw.code,
    codeNormalized: raw.code,
    discountType: raw.discountType,
    discountValue: raw.value,
    minimumOrderAmount: raw.minimumSubtotal,
    maximumDiscountAmount: raw.cap,
    expiresAt: raw.validUntil,
    status: 'ACTIVE',
    storeId: raw.storeId,
  };
}

function toCreateVoucherBody(storeId: string | undefined, payload: any) {
  return {
    code: payload.code || payload.displayCode,
    issuerType: storeId ? 'STORE' : 'PLATFORM',
    storeId: storeId || payload.storeId,
    productId: payload.productId,
    livestreamId: payload.livestreamId,
    scopeType: payload.scopeType || 'STORE',
    discountType: payload.discountType,
    value: payload.discountValue ?? payload.value,
    cap: payload.maximumDiscountAmount ?? payload.cap,
    minimumSubtotal: payload.minimumOrderAmount ?? payload.minimumSubtotal,
    validFrom: payload.startsAt || payload.validFrom || new Date().toISOString(),
    validUntil: payload.expiresAt || payload.validUntil,
    limits: payload.limits,
    scope: payload.scope,
    funding: payload.funding,
  };
}

/** Map Nest /coupons → Spring /vouchers + /checkout/quote */
export const couponService = {

  getPublicPlatformCoupons: async (storeId?: string, signal?: AbortSignal): Promise<PlatformVoucher[]> => {
    const res: any = await api.get('/vouchers/public/platform', { params: { storeId }, signal, headers: { 'x-skip-cache': 'true' } });
    const payload = res?.result ?? res?.data ?? res;
    return (Array.isArray(payload) ? payload : []).flatMap(raw => {
      const voucher = platformVoucher(raw, storeId);
      return voucher ? [voucher] : [];
    });
  },

  getPublicStoreCoupons: async (storeId: string): Promise<PublicStoreCoupon[]> => {
    const res: any = await api.get('/vouchers/public', { params: { storeId } });
    const payload = res?.result ?? res?.data ?? res;
    const list = Array.isArray(payload) ? payload : [];
    return list.filter((v: any) => !storeId || v.storeId === storeId).map(mapVoucher);
  },

  validateCoupon: async (
    payload: ValidateCouponPayload,
  ): Promise<ValidateCouponResponse> => {
    const res: any = await api.post('/checkout/quote', {
      couponCode: (payload as any).code || (payload as any).couponCode,
      items: ((payload as any).items || []).map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    });
    const result = res?.result ?? res?.data ?? res;
    return {
      valid: true,
      discountAmount: Number(result?.discountAmount ?? result?.voucherDiscountVnd ?? 0),
      message: result?.message || 'OK',
      ...result,
    } as ValidateCouponResponse;
  },

  getKolCoupons: async (_params?: CouponFilterParams): Promise<any> => {
    const res: any = await api.get('/vouchers');
    const list = (res?.result ?? res?.data ?? []).map(mapVoucher);
    return {
      data: list,
      items: list,
      coupons: list,
      summary: { total: list.length, active: list.length, pending: 0, rejected: 0 },
    };
  },

  getKolCouponDetail: async (id: string): Promise<CouponItem> => {
    const res: any = await api.get(`/vouchers/${id}`);
    return mapVoucher(res?.result ?? res?.data ?? res);
  },

  proposeCoupon: async (payload: CreateCouponPayload): Promise<any> => {
    const res: any = await api.post('/vouchers', toCreateVoucherBody((payload as any).storeId, payload));
    return mapVoucher(res?.result ?? res?.data ?? res);
  },

  togglePauseCoupon: async (_id: string): Promise<any> => {
    throw new Error('BE chưa hỗ trợ pause voucher.');
  },

  deleteCoupon: async (_id: string, _reason?: string): Promise<any> => {
    throw new Error('BE chưa hỗ trợ xóa voucher.');
  },

  createStoreCoupon: async (storeId: string, payload: CreateStoreCouponPayload): Promise<any> => {
    const res: any = await api.post('/vouchers', toCreateVoucherBody(storeId, payload));
    return mapVoucher(res?.result ?? res?.data ?? res);
  },

  getStoreCoupons: async (storeId: string, _params?: CouponFilterParams): Promise<any> => {
    const res: any = await api.get('/vouchers');
    const list = (res?.result ?? res?.data ?? [])
      .filter((v: any) => v.storeId === storeId)
      .map(mapVoucher);
    return { data: list, items: list, coupons: list, summary: { total: list.length } };
  },

  approveCoupon: async (_storeId: string, _couponId: string, _payload: ApproveCouponPayload): Promise<any> => {
    throw new Error('BE chưa hỗ trợ duyệt voucher.');
  },

  rejectCoupon: async (_storeId: string, _couponId: string, _reason: string): Promise<any> => {
    throw new Error('BE chưa hỗ trợ từ chối voucher.');
  },

  updatePolicy: async (_storeId: string, _couponId: string, _payload: Partial<ApproveCouponPayload>): Promise<any> => {
    throw new Error('BE chưa hỗ trợ cập nhật policy voucher.');
  },

  blockCoupon: async (_storeId: string, _couponId: string, _reason: string): Promise<any> => {
    throw new Error('BE chưa hỗ trợ block voucher.');
  },

  getAdminCoupons: async (_params?: CouponFilterParams): Promise<any> => {
    const res: any = await api.get('/vouchers');
    const list = (res?.result ?? res?.data ?? []).map(mapVoucher);
    return { data: list, items: list, coupons: list, summary: { total: list.length } };
  },

  createPlatformCoupon: async (payload: { storeId: string; code: string; benefitType: 'GOODS' | 'SHIPPING'; discountType: DiscountType; discountValue: number; budgetTotal: number; usageLimitTotal: number; maximumDiscountAmount?: number; minimumOrderAmount?: number; expiresAt?: string }): Promise<any> => {
    const perUse = payload.discountType === 'PERCENTAGE' ? payload.maximumDiscountAmount : Math.min(payload.discountValue,payload.maximumDiscountAmount ?? payload.discountValue);
    if (!perUse || !Number.isFinite(perUse) || !Number.isSafeInteger(payload.usageLimitTotal) || payload.usageLimitTotal<=0
        || !Number.isFinite(payload.budgetTotal) || perUse*payload.usageLimitTotal>payload.budgetTotal)
      throw new Error('Ngân sách phải đủ cho tổng số lượt sử dụng theo mức giảm tối đa. Vui lòng điều chỉnh hạn mức.');
    const res: any = await api.post('/vouchers', {
      ...toCreateVoucherBody(payload.storeId, payload), issuerType: 'PLATFORM', scopeType: 'STORE',
      discountType: payload.discountType === 'FIXED_AMOUNT' ? 'FIXED' : 'PERCENTAGE',
      scope: { benefitType: payload.benefitType }, funding: { fundedBy: 'PLATFORM' },
      limits: { totalUsageLimit: payload.usageLimitTotal },
    });
    return mapVoucher(res?.result ?? res?.data ?? res);
  },
  getPlatformSubsidies: async (): Promise<PlatformSubsidySummary[]> => [],
  recordPlatformReimbursement: async (_orderId: string, _amount: number, _bankReference: string): Promise<any> => {
    throw new Error('BE chưa hỗ trợ hoàn trợ cấp voucher.');
  },
  getStorePlatformSubsidies: async (_storeId: string): Promise<PlatformSubsidySummary[]> => [],
  adminBlockCoupon: async (_id: string, _reason: string): Promise<any> => {
    throw new Error('BE chưa hỗ trợ block voucher.');
  },
  adminUnblockCoupon: async (_id: string): Promise<any> => {
    throw new Error('BE chưa hỗ trợ unblock voucher.');
  },
};
