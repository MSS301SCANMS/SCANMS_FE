import api from '../lib/api';

export interface Product {
  id: string;
  storeId?: string;
  sku: string;
  title: string;
  categoryName?: string;
  description?: string;
  ingredients?: string | null;
  origin?: string | null;
  labelInfo?: string | null;
  originProofLinks?: string[];
  originProofImages?: string[];
  labelProofLinks?: string[];
  labelProofImages?: string[];
  imageUrl?: string;
  subImages?: string[];
  mediaAssets?: { id: string; urlOrContent: string }[];
  price: number;
  originalPrice?: number;
  customCommissionRate?: number;
  stockQuantity: number;
  isActive: boolean;
  moderationStatus?: 'DRAFT' | 'APPROVED' | 'REJECTED';
  moderationReason?: string | null;
  moderatedAt?: string | null;
  isAffiliateEnabled?: boolean;
  sampleEnabled?: boolean;
  sampleQuota?: number;
  sampleGrantedCount?: number;
  variants?: Array<{
    id: string;
    sku: string;
    name: string;
    attributes?: Record<string, string>;
    imageUrl?: string | null;
    price?: number | null;
    stockQuantity?: number;
    isActive: boolean;
    sampleEnabled: boolean | null;
    sampleQuota: number | null;
    sampleGrantedCount: number;
  }>;
  store?: {
    id: string;
    name: string;
    defaultCommissionRate: number;
  };
}

type ProductVariantDraft = {
  id?: string;
  sku: string;
  name: string;
  attributes?: Record<string, string>;
  price: number;
  stockQuantity: number;
  imageUrl: string;
};

export const productService = {
  async getProducts(params?: {
    storeId?: string;
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const res: any = await api.get('/products', { params });
    return res.data;
  },

  async getProduct(id: string): Promise<Product> {
    const res: any = await api.get(`/products/${id}`);
    return res.data;
  },

  async getModerationProducts(status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'ALL' = 'DRAFT') {
    const res: any = await api.get('/products/moderation', { params: { status } });
    return res.data;
  },

  async moderateProduct(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string,
  ) {
    const res: any = await api.patch('/products/' + id + '/moderation', { status, reason });
    return res.data;
  },

  async createProduct(data: Omit<Partial<Product>, 'variants'> & { storeId?: string; variants?: ProductVariantDraft[] }) {
    const res: any = await api.post('/products', data);
    return res.data;
  },

  async updateProduct(id: string, data: Partial<Product>) {
    const res: any = await api.put(`/products/${id}`, data);
    return res.data;
  },

  async updateVariantSamplePolicy(
    productId: string,
    variantId: string,
    data: { inheritProductPolicy: boolean; sampleEnabled: boolean; sampleQuota: number },
  ) {
    const res: any = await api.patch(`/products/${productId}/variants/${variantId}/sample-policy`, data);
    return res.data;
  },

  async syncProductVariants(
    productId: string,
    variants: ProductVariantDraft[],
  ) {
    const res: any = await api.put(`/products/${productId}/variants`, { variants });
    return res.data;
  },

  async softDeleteProduct(id: string) {
    const res: any = await api.delete(`/products/${id}`);
    return res.data;
  },

  async bulkUpdateCommission(productIds: string[], commissionRate: number) {
    const res: any = await api.patch('/products/bulk-commission', { productIds, commissionRate });
    return res.data;
  },
};

