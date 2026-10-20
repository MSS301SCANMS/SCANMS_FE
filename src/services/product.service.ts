import api from './api';
import { unwrapApi, unwrapList } from '@/utils/api-response';

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
  barcode?: string | null;
  packageWeight?: number | null;
  packageLength?: number | null;
  packageWidth?: number | null;
  packageHeight?: number | null;
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

function firstImage(refs: any): string | undefined {
  if (!refs) return undefined;
  if (typeof refs === 'string') return refs;
  if (Array.isArray(refs)) return refs[0];
  if (typeof refs === 'object') {
    const values = Object.values(refs);
    const first = values[0];
    return typeof first === 'string' ? first : undefined;
  }
  return undefined;
}

function stockFromSizes(sizesStock: any): number {
  if (!sizesStock || typeof sizesStock !== 'object') return 0;
  return Object.values(sizesStock).reduce((sum: number, v: any) => sum + Number(v || 0), 0);
}

function normalizeProduct(raw: any): Product {
  if (!raw) return raw;
  const id = raw.id || raw.productId;
  const title = raw.title || raw.name || '';
  const price = Number(raw.price ?? raw.priceVnd ?? 0);
  const imageUrl = raw.imageUrl || firstImage(raw.imageRefs);
  const stockQuantity = Number(
    raw.stockQuantity ?? stockFromSizes(raw.sizesStock) ?? 0,
  );
  const status = String(raw.status || raw.moderationStatus || '').toUpperCase();
  return {
    ...raw,
    id,
    sku: raw.sku || id,
    title,
    price,
    imageUrl,
    stockQuantity,
    isActive: raw.isActive ?? (status === 'ACTIVE' || status === 'APPROVED'),
    moderationStatus:
      status === 'ACTIVE' || status === 'APPROVED'
        ? 'APPROVED'
        : status === 'REJECTED'
          ? 'REJECTED'
          : 'DRAFT',
  } as Product;
}

function toCreateBody(data: any) {
  return {
    storeId: data.storeId,
    categoryId: data.categoryId,
    name: data.name || data.title,
    description: data.description,
    category: data.category || data.categoryName,
    material: data.material || data.ingredients,
    attributes: data.attributes,
    sizesStock: data.sizesStock || { DEFAULT: data.stockQuantity ?? 0 },
    sizeGuide: data.sizeGuide,
    imageRefs: data.imageRefs || (data.imageUrl ? { primary: data.imageUrl } : undefined),
    priceVnd: data.priceVnd ?? data.price,
    status: data.status,
  };
}

function toUpdateBody(data: any) {
  const body: Record<string, unknown> = {};
  if (data.name != null || data.title != null) body.name = data.name || data.title;
  if (data.description != null) body.description = data.description;
  if (data.category != null || data.categoryName != null) body.category = data.category || data.categoryName;
  if (data.material != null || data.ingredients != null) body.material = data.material || data.ingredients;
  if (data.attributes != null) body.attributes = data.attributes;
  if (data.sizesStock != null || data.stockQuantity != null) {
    body.sizesStock = data.sizesStock || { DEFAULT: data.stockQuantity };
  }
  if (data.imageRefs != null || data.imageUrl != null) {
    body.imageRefs = data.imageRefs || { primary: data.imageUrl };
  }
  if (data.priceVnd != null || data.price != null) body.priceVnd = data.priceVnd ?? data.price;
  if (data.status != null || data.moderationStatus != null) {
    body.status =
      data.status ||
      (data.moderationStatus === 'APPROVED'
        ? 'ACTIVE'
        : data.moderationStatus === 'REJECTED'
          ? 'INACTIVE'
          : 'DRAFT');
  }
  return body;
}

export const productService = {
  async getProducts(params?: {
    storeId?: string;
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }, fresh = false) {
    const res: any = await api.get('/products', {
      params,
      headers: fresh ? { 'x-skip-cache': 'true' } : undefined,
    });
    let items = unwrapList(res).map(normalizeProduct);
    if (params?.storeId) items = items.filter((p) => p.storeId === params.storeId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q),
      );
    }
    return { items, data: items, total: items.length };
  },

  async getProduct(id: string): Promise<Product> {
    const res: any = await api.get(`/products/${id}`);
    return normalizeProduct(unwrapApi(res));
  },

  async getModerationProducts(status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'ALL' = 'DRAFT') {
    const all = unwrapList(await api.get('/products', { headers: { 'x-skip-cache': 'true' } })).map(
      normalizeProduct,
    );
    if (status === 'ALL') return { items: all, data: all };
    const filtered = all.filter((p) => p.moderationStatus === status);
    return { items: filtered, data: filtered };
  },

  async moderateProduct(id: string, status: 'APPROVED' | 'REJECTED', _reason?: string) {
    const res: any = await api.patch(`/products/${id}`, {
      status: status === 'APPROVED' ? 'ACTIVE' : 'INACTIVE',
    });
    return normalizeProduct(unwrapApi(res));
  },

  async createProduct(
    data: Omit<Partial<Product>, 'variants'> & { storeId?: string; variants?: ProductVariantDraft[] },
  ) {
    const res: any = await api.post('/products', toCreateBody(data));
    const created = normalizeProduct(unwrapApi(res));
    if (data.variants?.length && created.id) {
      await this.syncProductVariants(created.id, data.variants);
    }
    return created;
  },

  async updateProduct(id: string, data: Partial<Product>) {
    const res: any = await api.patch(`/products/${id}`, toUpdateBody(data));
    return normalizeProduct(unwrapApi(res));
  },

  async updateVariantSamplePolicy(
    _productId: string,
    variantId: string,
    data: { inheritProductPolicy: boolean; sampleEnabled: boolean; sampleQuota: number },
  ) {
    // BE has no sample-policy endpoint; persist what we can on the variant resource.
    const res: any = await api.patch(`/product-variants/${variantId}`, {
      attributes: {
        sampleEnabled: data.sampleEnabled,
        sampleQuota: data.sampleQuota,
        inheritProductPolicy: data.inheritProductPolicy,
      },
    });
    return unwrapApi(res);
  },

  async syncProductVariants(productId: string, variants: ProductVariantDraft[]) {
    const results = [];
    for (const variant of variants) {
      if (variant.id) {
        results.push(
          unwrapApi(
            await api.patch(`/product-variants/${variant.id}`, {
              sku: variant.sku,
              name: variant.name,
              attributes: variant.attributes,
              priceVnd: variant.price,
              imageRefs: variant.imageUrl ? { primary: variant.imageUrl } : undefined,
            }),
          ),
        );
      } else {
        results.push(
          unwrapApi(
            await api.post('/product-variants', {
              productId,
              sku: variant.sku,
              name: variant.name,
              attributes: variant.attributes,
              priceVnd: variant.price,
              stockQuantity: variant.stockQuantity,
              imageRefs: variant.imageUrl ? { primary: variant.imageUrl } : undefined,
            }),
          ),
        );
      }
    }
    return results;
  },

  async softDeleteProduct(id: string) {
    const res: any = await api.delete(`/products/${id}`);
    return normalizeProduct(unwrapApi(res));
  },

  async bulkUpdateCommission(productIds: string[], commissionRate: number) {
    // No bulk BE endpoint — patch each product attributes.
    const results = [];
    for (const id of productIds) {
      results.push(
        unwrapApi(
          await api.patch(`/products/${id}`, {
            attributes: { customCommissionRate: commissionRate },
          }),
        ),
      );
    }
    return results;
  },
};
