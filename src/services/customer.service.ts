import api from './api';
import { authService } from './auth.service';

function notifyWishlistChanged(userId: string | undefined, token: string | null) {
  if (userId && token === localStorage.getItem('token')) {
    window.dispatchEvent(new CustomEvent('customer-wishlist-changed', { detail: { userId } }));
  }
}

export interface CustomerStats {
  totalOrders: number;
  pendingOrders: number;
  totalSpending: number;
  wishlistCount: number;
}

export interface CustomerProfileResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    dateOfBirth?: string | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
    role: string;
    createdAt: string;
  };
  stats: CustomerStats;
}

export interface CustomerOrderItem {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number | string;
  product?: {
    id: string;
    title: string;
    imageUrl?: string | null;
    sku?: string;
  };
  variant?: {
    id: string;
    name: string;
    sku?: string;
  };
}

export interface CustomerOrder {
  id: string;
  storeId: string;
  externalOrderSn: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  shippingAddress: string;
  subtotalAmount: number | string;
  discountAmount: number | string;
  shippingFee: number | string;
  finalAmount: number | string;
  status: string;
  overrideReason?: string | null;
  completedAt?: string | null;
  deliveredAt?: string | null;
  policyAcceptedAt?: string | null;
  policySnapshot?: Record<string, unknown> | null;
  returnRequest?: CustomerReturnRequest | null;
  rawPayload?: any;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    name: string;
    slug?: string;
    logoUrl?: string | null;
  };
  orderItems: CustomerOrderItem[];
  coupon?: {
    displayCode?: string;
    codeNormalized?: string;
    discountValue?: number;
    discountType?: string;
  } | null;
  paymentTransactions?: any[];
  productReviews?: any[];
}

export interface CustomerReturnRequest {
  id: string;
  orderId: string;
  reason: 'DAMAGED' | 'WRONG_ITEM' | 'EXPIRED' | 'OTHER';
  details?: string | null;
  imageUrls: string[];
  unboxingVideoUrl: string;
  status: import('./return.service').ReturnStatus;
  deadlineAt: string;
  shipByAt?: string | null;
  pickupContact?: import('./return.service').PickupBookingInput | null;
  returnAddress?: string | null;
  returnInstructions?: string | null;
  shopResponse?: string | null;
  submittedAt: string;
  updatedAt: string;
}

export interface SyncedCartItem {
  cartItemId: string;
  productId: string;
  variantId?: string;
  variantName?: string;
  title: string;
  sku: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  quantity: number;
  stockQuantity: number;
  isActive: boolean;
  store: {
    id: string;
    name: string;
    slug?: string;
    logoUrl?: string;
    policyReturn?: string;
    policyWarranty?: string;
    policyShipping?: string;
  };
  availableVariants?: Array<{
    id: string;
    name: string;
    sku: string;
    price?: number | null;
    stockQuantity: number;
    isActive?: boolean;
  }>;
}

export interface CartSessionRequest {
  token: string;
  signal: AbortSignal;
}

export interface CustomerAddress {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  provinceCode?: string | null;
  provinceName: string;
  districtCode?: string | null;
  districtName: string;
  wardCode?: string | null;
  wardName: string;
  detailAddress: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWishlistItem {
  wishlistId: string;
  createdAt: string;
  product: {
    id: string;
    sku: string;
    title: string;
    price: number | string;
    originalPrice?: number | string | null;
    imageUrl?: string | null;
    stockQuantity: number;
    isActive: boolean;
    categoryName?: string | null;
    store?: {
      id: string;
      name: string;
      slug: string;
      logoUrl?: string | null;
    };
    variants?: any[];
  };
}

function unwrap(res: any) {
  return res?.result ?? res?.data ?? res;
}

function mapOrder(raw: any): CustomerOrder {
  const ship = raw?.shippingSnapshot || {};
  const shippingAddress =
    typeof raw?.shippingAddress === 'string'
      ? raw.shippingAddress
      : [ship.address, ship.name, ship.phone].filter(Boolean).join(' · ') || '';
  return {
    id: raw?.id || raw?.orderId,
    storeId: raw?.storeId || '',
    externalOrderSn: raw?.externalOrderSn || raw?.orderId || raw?.id || '',
    customerName: raw?.customerName || ship.name || null,
    customerPhone: raw?.customerPhone || ship.phone || null,
    customerEmail: raw?.customerEmail || null,
    shippingAddress,
    subtotalAmount: raw?.subtotalAmount ?? raw?.payableVnd ?? 0,
    discountAmount: raw?.discountAmount ?? 0,
    shippingFee: raw?.shippingFee ?? 0,
    finalAmount: raw?.finalAmount ?? raw?.payableVnd ?? 0,
    status: raw?.status || 'PENDING',
    overrideReason: raw?.overrideReason ?? null,
    completedAt: raw?.completedAt ?? null,
    deliveredAt: raw?.deliveredAt ?? null,
    policyAcceptedAt: raw?.policyAcceptedAt ?? null,
    policySnapshot: raw?.policySnapshot ?? null,
    returnRequest: raw?.returnRequest ?? null,
    rawPayload: raw,
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt || raw?.createdAt || new Date().toISOString(),
    store: raw?.store,
    orderItems: Array.isArray(raw?.orderItems) ? raw.orderItems : [],
    coupon: raw?.coupon ?? null,
    paymentTransactions: raw?.paymentTransactions,
    productReviews: raw?.productReviews,
  };
}

function parseStoredAddresses(me: any): CustomerAddress[] {
  const raw = me?.address;
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      return parsed.map((a: any, idx: number) => ({
        id: a.id || `addr-${idx}`,
        userId: me.userId || me.id,
        fullName: a.fullName || me.fullName || '',
        phoneNumber: a.phoneNumber || me.phoneNumber || '',
        provinceCode: a.provinceCode || null,
        provinceName: a.provinceName || '',
        districtCode: a.districtCode || null,
        districtName: a.districtName || '',
        wardCode: a.wardCode || null,
        wardName: a.wardName || '',
        detailAddress: a.detailAddress || a.addressLine || '',
        latitude: a.latitude ?? null,
        longitude: a.longitude ?? null,
        isDefault: Boolean(a.isDefault ?? idx === 0),
        createdAt: a.createdAt || me.updatedAt || new Date().toISOString(),
        updatedAt: a.updatedAt || me.updatedAt || new Date().toISOString(),
      }));
    }
  } catch {
    /* plain string address */
  }
  if (typeof raw === 'string' && raw.trim()) {
    return [
      {
        id: 'profile-address',
        userId: me.userId || me.id,
        fullName: me.fullName || '',
        phoneNumber: me.phoneNumber || '',
        provinceName: '',
        districtName: '',
        wardName: '',
        detailAddress: raw,
        isDefault: true,
        createdAt: me.createdAt || new Date().toISOString(),
        updatedAt: me.updatedAt || new Date().toISOString(),
      } as CustomerAddress,
    ];
  }
  return [];
}

export const customerService = {
  // 1. Profile & Settings
  async getProfile(): Promise<CustomerProfileResponse> {
    const me: any = unwrap(await api.get('/users/me'));
    const orders = await this.getOrders().catch(() => ({ total: 0, orders: [] as CustomerOrder[] }));
    const wishlist = await this.getWishlist().catch(() => []);
    const pendingStatuses = new Set(['PENDING', 'AWAITING_PAYMENT', 'PROCESSING', 'CONFIRMED']);
    return {
      user: {
        id: me?.userId || me?.id,
        email: me?.email || '',
        fullName: me?.fullName || '',
        phoneNumber: me?.phoneNumber,
        avatarUrl: me?.avatarUrl,
        dateOfBirth: me?.dateOfBirth,
        gender: me?.gender,
        role: Array.isArray(me?.roles) ? me.roles[0] : me?.role || 'CUSTOMER',
        createdAt: me?.createdAt || new Date().toISOString(),
      },
      stats: {
        totalOrders: orders.total,
        pendingOrders: orders.orders.filter((o) => pendingStatuses.has(String(o.status).toUpperCase())).length,
        totalSpending: orders.orders.reduce((sum, o) => sum + Number(o.finalAmount || 0), 0),
        wishlistCount: wishlist.length,
      },
    };
  },

  async updateProfile(data: {
    fullName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    address?: string | null;
    dateOfBirth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
  }): Promise<any> {
    const payload: Record<string, unknown> = {};
    if (data.fullName !== undefined) payload.fullName = data.fullName;
    if (data.phoneNumber !== undefined) payload.phoneNumber = data.phoneNumber;
    if (data.avatarUrl !== undefined) payload.avatarUrl = data.avatarUrl;
    if (data.address !== undefined) payload.address = data.address;
    if (data.dateOfBirth !== undefined) payload.dateOfBirth = data.dateOfBirth;
    if (data.gender !== undefined) payload.gender = data.gender;
    await api.patch('/users/me', payload);
    const saved = unwrap(await api.get('/users/me', { headers: { 'x-skip-cache': 'true' } }));
    if (!(saved?.userId || saved?.id) || Object.entries(payload).some(([key, value]) => (saved[key] ?? null) !== (value ?? null))) {
      throw new Error('Máy chủ chưa lưu đầy đủ thông tin hồ sơ. Nội dung bạn nhập vẫn được giữ để kiểm tra và thử lại.');
    }
    const updated = saved;
    try {
      const current = authService.getCurrentUser();
      if (current && updated) {
        const merged = {
          ...current,
          ...updated,
          id: updated.userId || updated.id || current.id,
        };
        localStorage.setItem('user', JSON.stringify(merged));
        window.dispatchEvent(new Event('auth-user-updated'));
      }
    } catch {
      /* ignore */
    }
    return updated;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<any> {
    const res: any = await api.post('/auth/change-password', null, {
      params: { oldPassword: data.currentPassword, newPassword: data.newPassword },
    });
    return res?.result || res?.data || res;
  },

  async sendPasswordOtp(): Promise<{ success: boolean; maskedEmail: string; message: string; debugOtp?: string }> {
    const email = authService.getCurrentUser()?.email;
    if (!email) throw new Error('Không tìm thấy email tài khoản.');
    const res: any = await api.post('/auth/forgot-password/send-otp', { email });
    return { success: true, maskedEmail: email, message: res?.message || res?.result || 'Đã gửi OTP' };
  },

  async verifyPasswordOtp(otp: string): Promise<{ success: boolean; message: string }> {
    const email = authService.getCurrentUser()?.email;
    if (!email) throw new Error('Không tìm thấy email tài khoản.');
    const res: any = await api.post('/auth/forgot-password/verify-otp', { email, otp });
    return { success: true, message: res?.message || res?.result || 'OTP hợp lệ' };
  },

  async setPasswordWithOtp(data: { otp: string; newPassword: string }): Promise<any> {
    const email = authService.getCurrentUser()?.email;
    if (!email) throw new Error('Không tìm thấy email tài khoản.');
    const res: any = await api.post('/auth/forgot-password/reset', {
      email,
      otp: data.otp,
      newPassword: data.newPassword,
    });
    return res?.result || res?.data || res;
  },

  async getIdentity(): Promise<{ isVerified: boolean; fullName: string; idCardNumber: string; address: string; verifiedAt?: string }> {
    // getProfile() trả { user, stats }; identity lấy thêm address thô từ /users/me
    const profile = await this.getProfile();
    const me: any = unwrap(await api.get('/users/me'));
    const addresses = parseStoredAddresses(me);
    const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
    const addressText =
      defaultAddr
        ? [defaultAddr.detailAddress, defaultAddr.wardName, defaultAddr.districtName, defaultAddr.provinceName]
            .filter(Boolean)
            .join(', ')
        : typeof me?.address === 'string' && !me.address.trim().startsWith('[')
          ? me.address
          : '';
    return {
      isVerified: false,
      fullName: profile?.user?.fullName || me?.fullName || '',
      idCardNumber: '',
      address: addressText,
      verifiedAt: me?.updatedAt,
    };
  },

  async verifyIdentity(_data: { fullName: string; idCardNumber: string; address: string }): Promise<any> {
    throw new Error('Xác minh định danh được thực hiện trong hồ sơ đăng ký KOL hoặc gian hàng. Thao tác này chưa lưu số CCCD.');
  },

  // 2. Orders
  async getOrders(params?: { status?: string; search?: string }): Promise<{ total: number; orders: CustomerOrder[] }> {
    const res: any = await api.get('/orders/my-orders', { params, headers: { 'x-skip-cache': 'true' } });
    const payload = unwrap(res);
    let orders = (Array.isArray(payload) ? payload : payload?.orders || []).map(mapOrder);
    if (params?.status) {
      const status = params.status.toUpperCase();
      orders = orders.filter((o: any) => String(o.status).toUpperCase() === status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      orders = orders.filter(
        (o: any) =>
          o.id?.toLowerCase().includes(q) ||
          o.externalOrderSn?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q),
      );
    }
    return { total: orders.length, orders };
  },

  async getOrderDetails(orderId: string): Promise<CustomerOrder> {
    const res: any = await api.get(`/orders/${orderId}`, { headers: { 'x-skip-cache': 'true' } });
    return mapOrder(unwrap(res));
  },

  async cancelOrder(_orderId: string, _reason?: string): Promise<any> {
    throw new Error('BE chưa hỗ trợ hủy đơn từ phía khách. Liên hệ shop hoặc admin.');
  },

  async requestReturnOrder(
    _orderId: string,
    data: { reason: string; notes?: string; proofImages?: string[]; proofVideos?: string[]; orderItemId?: string; quantity?: number },
  ): Promise<any> {
    if (!data.orderItemId) throw new Error('Thiếu orderItemId để tạo yêu cầu trả hàng.');
    const res: any = await api.post('/returns', {
      orderItemId: data.orderItemId,
      quantity: data.quantity || 1,
      reason: data.reason,
      evidenceRefs: {
        notes: data.notes,
        images: data.proofImages || [],
        videos: data.proofVideos || [],
      },
    });
    return res?.result || res?.data || res;
  },

  async confirmReceipt(_orderId: string): Promise<any> {
    throw new Error('BE chưa hỗ trợ xác nhận nhận hàng từ phía khách.');
  },

  async createReturnRequest(
    _orderId: string,
    data: {
      reason: CustomerReturnRequest['reason'];
      details?: string;
      imageUrls: string[];
      unboxingVideoUrl: string;
      orderItemId?: string;
      quantity?: number;
    },
  ): Promise<{ message: string; returnRequest: CustomerReturnRequest }> {
    if (!data.orderItemId) throw new Error('Thiếu orderItemId để tạo yêu cầu trả hàng.');
    const res: any = await api.post('/returns', {
      orderItemId: data.orderItemId,
      quantity: data.quantity || 1,
      reason: data.reason,
      evidenceRefs: {
        details: data.details,
        images: data.imageUrls,
        unboxingVideoUrl: data.unboxingVideoUrl,
      },
    });
    const returnRequest = res?.result || res?.data || res;
    return { message: 'Đã gửi yêu cầu trả hàng', returnRequest };
  },

  async submitVerifiedReview(
    _orderId: string,
    data: { productId: string; rating: number; comment: string; images?: string[]; orderItemId?: string },
  ): Promise<any> {
    const res: any = await api.post('/feedbacks', {
      productId: data.productId,
      orderItemId: data.orderItemId,
      rating: data.rating,
      comment: data.comment,
      imageRefs: data.images ? { images: data.images } : undefined,
    });
    return res?.result || res?.data || res;
  },

  async getCart(_session?: CartSessionRequest): Promise<{ items: SyncedCartItem[]; syncedAt: string }> {
    // BE không có cart API — giữ local-only
    return { items: [], syncedAt: new Date().toISOString() };
  },

  async syncCart(
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    _session?: CartSessionRequest,
  ): Promise<{ items: SyncedCartItem[]; warnings?: string[]; syncedAt: string }> {
    return { items: items as any, warnings: ['Giỏ hàng đang lưu local (BE chưa có cart API)'], syncedAt: new Date().toISOString() };
  },

  // 3. Addresses — BE lưu JSON list trong users.address
  async getAddresses(): Promise<CustomerAddress[]> {
    const me: any = unwrap(await api.get('/users/me'));
    return parseStoredAddresses(me);
  },

  async createAddress(data: Omit<CustomerAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<any> {
    const me: any = unwrap(await api.get('/users/me'));
    const list = parseStoredAddresses(me);
    const entry: CustomerAddress = {
      id: `addr-${Date.now()}`,
      userId: me.userId || me.id,
      fullName: (data as any).fullName || me.fullName || '',
      phoneNumber: (data as any).phoneNumber || me.phoneNumber || '',
      provinceCode: (data as any).provinceCode ?? null,
      provinceName: (data as any).provinceName || '',
      districtCode: (data as any).districtCode ?? null,
      districtName: (data as any).districtName || '',
      wardCode: (data as any).wardCode ?? null,
      wardName: (data as any).wardName || '',
      detailAddress: (data as any).detailAddress || (data as any).addressLine || '',
      latitude: (data as any).latitude ?? null,
      longitude: (data as any).longitude ?? null,
      isDefault: Boolean((data as any).isDefault ?? list.length === 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = entry.isDefault
      ? [...list.map((a) => ({ ...a, isDefault: false })), entry]
      : [...list, entry];
    return this.updateProfile({
      fullName: entry.fullName,
      phoneNumber: entry.phoneNumber,
      address: JSON.stringify(next),
    });
  },

  async updateAddress(id: string, data: Partial<CustomerAddress>): Promise<any> {
    const me: any = unwrap(await api.get('/users/me'));
    const list = parseStoredAddresses(me);
    const next = list.map((a) =>
      a.id === id
        ? {
            ...a,
            ...data,
            id: a.id,
            updatedAt: new Date().toISOString(),
          }
        : data.isDefault
          ? { ...a, isDefault: false }
          : a,
    );
    return this.updateProfile({ address: JSON.stringify(next) });
  },

  async deleteAddress(id: string): Promise<any> {
    const me: any = unwrap(await api.get('/users/me'));
    const next = parseStoredAddresses(me).filter((a) => a.id !== id);
    if (next.length && !next.some((a) => a.isDefault)) next[0].isDefault = true;
    return this.updateProfile({ address: next.length ? JSON.stringify(next) : null });
  },

  async setDefaultAddress(id: string): Promise<any> {
    const me: any = unwrap(await api.get('/users/me'));
    const next = parseStoredAddresses(me).map((a) => ({ ...a, isDefault: a.id === id }));
    return this.updateProfile({ address: JSON.stringify(next) });
  },

  // 4. Wishlist — BE chưa có resource; lưu local theo user
  _wishlistKey() {
    const userId = authService.getCurrentUser()?.id || (authService.getCurrentUser() as any)?.userId || 'guest';
    return `scanms_wishlist_${userId}`;
  },

  _readWishlist(): CustomerWishlistItem[] {
    try {
      const raw = localStorage.getItem(this._wishlistKey());
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  _writeWishlist(items: CustomerWishlistItem[]) {
    localStorage.setItem(this._wishlistKey(), JSON.stringify(items));
  },

  async getWishlist(_signal?: AbortSignal): Promise<CustomerWishlistItem[]> {
    return this._readWishlist();
  },

  async toggleWishlist(
    productId: string,
    product?: CustomerWishlistItem['product'],
  ): Promise<{ wishlisted: boolean; message: string }> {
    const userId = authService.getCurrentUser()?.id;
    const token = localStorage.getItem('token');
    const list = this._readWishlist();
    const exists = list.some(
      (i: any) => i.productId === productId || i.id === productId || i.product?.id === productId,
    );
    let next: CustomerWishlistItem[];
    if (exists) {
      next = list.filter(
        (i: any) => i.productId !== productId && i.id !== productId && i.product?.id !== productId,
      );
    } else {
      const snapshot =
        product ||
        ({
          id: productId,
          sku: productId,
          title: 'Sản phẩm đã lưu',
          price: 0,
          stockQuantity: 0,
          isActive: true,
        } as CustomerWishlistItem['product']);
      next = [
        ...list,
        {
          wishlistId: `wl-${productId}-${Date.now()}`,
          createdAt: new Date().toISOString(),
          product: snapshot,
        },
      ];
    }
    this._writeWishlist(next);
    notifyWishlistChanged(userId, token);
    return {
      wishlisted: !exists,
      message: exists ? 'Đã bỏ khỏi yêu thích' : 'Đã thêm vào yêu thích (lưu cục bộ)',
    };
  },

  async removeFromWishlist(productId: string): Promise<any> {
    const userId = authService.getCurrentUser()?.id;
    const token = localStorage.getItem('token');
    this._writeWishlist(
      this._readWishlist().filter(
        (i: any) => i.productId !== productId && i.id !== productId && i.product?.id !== productId,
      ),
    );
    notifyWishlistChanged(userId, token);
    return { success: true, productId };
  },
};
