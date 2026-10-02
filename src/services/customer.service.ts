import api from './api';

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
  status: 'REQUESTED' | 'SHOP_APPROVED' | 'SHOP_REJECTED' | 'DISPUTED' | 'REFUNDED' | 'CLOSED';
  deadlineAt: string;
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

export const customerService = {
  // 1. Profile & Settings
  async getProfile(): Promise<CustomerProfileResponse> {
    const res: any = await api.get('/customer/profile');
    return res?.data?.data || res?.data || res;
  },

  async updateProfile(data: { fullName?: string; phoneNumber?: string }): Promise<any> {
    const res: any = await api.put('/customer/profile', data);
    return res?.data?.data || res?.data || res;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<any> {
    const res: any = await api.post('/customer/change-password', data);
    return res?.data?.data || res?.data || res;
  },

  // 2. Orders
  async getOrders(params?: { status?: string; search?: string }): Promise<{ total: number; orders: CustomerOrder[] }> {
    const res: any = await api.get('/customer/orders', { params });
    const payload = res?.data?.data || res?.data || res;
    return {
      total: payload?.total || (payload?.orders?.length ?? 0),
      orders: payload?.orders || (Array.isArray(payload) ? payload : []),
    };
  },

  async getOrderDetails(orderId: string): Promise<CustomerOrder> {
    const res: any = await api.get(`/customer/orders/${orderId}`);
    return res?.data?.data || res?.data || res;
  },

  async cancelOrder(orderId: string, reason?: string): Promise<any> {
    const res: any = await api.post(`/customer/orders/${orderId}/cancel`, { reason });
    return res?.data?.data || res?.data || res;
  },

  async confirmReceipt(orderId: string): Promise<any> {
    const res: any = await api.post(`/customer/orders/${orderId}/confirm-receipt`);
    return res?.data?.data || res?.data || res;
  },

  async createReturnRequest(
    orderId: string,
    data: {
      reason: CustomerReturnRequest['reason'];
      details?: string;
      imageUrls: string[];
      unboxingVideoUrl: string;
    },
  ): Promise<{ message: string; returnRequest: CustomerReturnRequest }> {
    const res: any = await api.post(`/customer/orders/${orderId}/return-request`, data);
    return res?.data?.data || res?.data || res;
  },

  async submitVerifiedReview(
    orderId: string,
    data: { productId: string; rating: number; comment: string; images?: string[] },
  ): Promise<any> {
    const res: any = await api.post(`/customer/orders/${orderId}/reviews`, data);
    return res?.data?.data || res?.data || res;
  },

  async getCart(): Promise<{ items: SyncedCartItem[]; syncedAt: string }> {
    const res: any = await api.get('/customer/cart', { headers: { 'x-skip-cache': 'true' } });
    return res?.data?.data || res?.data || res;
  },

  async syncCart(
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
  ): Promise<{ items: SyncedCartItem[]; warnings?: string[]; syncedAt: string }> {
    const res: any = await api.put('/customer/cart', { items });
    return res?.data?.data || res?.data || res;
  },

  // 3. Addresses
  async getAddresses(): Promise<CustomerAddress[]> {
    const res: any = await api.get('/customer/addresses');
    const payload = res?.data?.data || res?.data || res;
    return Array.isArray(payload) ? payload : [];
  },

  async createAddress(data: Omit<CustomerAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<any> {
    const res: any = await api.post('/customer/addresses', data);
    return res?.data?.data || res?.data || res;
  },

  async updateAddress(id: string, data: Partial<CustomerAddress>): Promise<any> {
    const res: any = await api.put(`/customer/addresses/${id}`, data);
    return res?.data?.data || res?.data || res;
  },

  async deleteAddress(id: string): Promise<any> {
    const res: any = await api.delete(`/customer/addresses/${id}`);
    return res?.data?.data || res?.data || res;
  },

  async setDefaultAddress(id: string): Promise<any> {
    const res: any = await api.patch(`/customer/addresses/${id}/default`);
    return res?.data?.data || res?.data || res;
  },

  // 4. Wishlist
  async getWishlist(): Promise<CustomerWishlistItem[]> {
    const res: any = await api.get('/customer/wishlist');
    const payload = res?.data?.data || res?.data || res;
    return Array.isArray(payload) ? payload : [];
  },

  async toggleWishlist(productId: string): Promise<{ wishlisted: boolean; message: string }> {
    const res: any = await api.post(`/customer/wishlist/${productId}/toggle`);
    return res?.data?.data || res?.data || res;
  },

  async removeFromWishlist(productId: string): Promise<any> {
    const res: any = await api.delete(`/customer/wishlist/${productId}`);
    return res?.data?.data || res?.data || res;
  },
};
