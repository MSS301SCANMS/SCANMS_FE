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
  requiresModeration?: boolean;
  product?: Product;
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
  const metadata = raw.attributes && typeof raw.attributes === 'object' ? raw.attributes : {};
  const id = raw.id || raw.productId;
  const title = raw.title || raw.name || '';
  const price = Number(raw.price ?? raw.priceVnd ?? 0);
  const imageUrl = raw.imageUrl || firstImage(raw.imageRefs);
  const stockQuantity = Number(
    raw.stockQuantity ?? stockFromSizes(raw.sizesStock) ?? 0,
  );
  const status = String(raw.status || raw.moderationStatus || '').toUpperCase();
  return {
    ...metadata,
    ...raw,
    id,
    sku: raw.sku || metadata.sku || id,
    title,
    price,
    imageUrl,
    stockQuantity,
    ingredients: raw.ingredients ?? raw.material ?? metadata.ingredients,
    isActive: raw.isActive ?? (status === 'ACTIVE' || status === 'APPROVED'),
    moderationStatus:
      status === 'ACTIVE' || status === 'APPROVED'
        ? 'APPROVED'
        : status === 'REJECTED'
          ? 'REJECTED'
          : 'DRAFT',
  } as Product;
}

function productMetadata(data: any) {
  const attributes = { ...(data.attributes || {}) };
  for (const key of ['sku', 'origin', 'labelInfo', 'barcode', 'packageWeight', 'packageLength', 'packageWidth',
    'packageHeight', 'originProofLinks', 'originProofImages', 'labelProofLinks', 'labelProofImages', 'originalPrice']) {
    if (data[key] !== undefined) attributes[key] = data[key];
  }
  return attributes;
}

function variantOptions(variant: ProductVariantDraft) {
  const options = Object.entries(variant.attributes || {});
  const read = (keys: string[]) => options.find(([key]) => keys.includes(
    key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, ''),
  ))?.[1];
  return {
    size: read(['size', 'kichco', 'kichthuoc', 'specification', 'quycach']) || (!options.length ? variant.name : undefined),
    color: read(['color', 'mau', 'mausac']),
  };
}

async function hydrateProducts(rows: any[]): Promise<Product[]> {
  if (!rows.length || import.meta.env.VITE_COMMERCE_BACKEND === 'legacy') return rows.map(normalizeProduct);
  const [variantResponse, imageResponse] = await Promise.all([
    api.get('/product-variants', { headers: { 'x-skip-cache': 'true' } }),
    api.get('/product-images', { headers: { 'x-skip-cache': 'true' } }),
  ]);
  const allVariants = unwrapList(variantResponse);
  const allImages = unwrapList(imageResponse);
  return rows.map(raw => {
    const id = raw.productId || raw.id;
    const variants = allVariants.filter((v: any) => v.productId === id).map((v: any) => ({
      ...v, id: v.variantId || v.id,
      name: [v.color, v.size].filter(Boolean).join(' / ') || v.sku,
      attributes: { ...(v.color ? { color: v.color } : {}), ...(v.size ? { size: v.size } : {}) },
      price: Number(v.priceVnd ?? v.price ?? 0),
      stockQuantity: Math.max(0, Number(v.stockQuantity) || 0),
      isActive: v.status === 'ACTIVE', sampleEnabled: null, sampleQuota: null, sampleGrantedCount: 0,
    }));
    const gallery = allImages.filter((i: any) => i.productId === id)
      .sort((a: any, b: any) => Number(b.primaryImage) - Number(a.primaryImage) || (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    const hydratedVariants = variants.map((v: any) => ({ ...v, imageUrl: v.imageUrl || gallery[0]?.imageUrl || firstImage(raw.imageRefs) || '' }));
    return normalizeProduct({ ...raw, variants: hydratedVariants,
      ...(variants.length ? { stockQuantity: variants.filter((v: any) => v.isActive).reduce((sum: number, v: any) => sum + v.stockQuantity, 0) } : {}),
      ...(gallery.length ? { imageUrl: gallery[0].imageUrl, subImages: gallery.slice(1).map((i: any) => i.imageUrl) } : {}),
    });
  });
}

function toCreateBody(data: any) {
  return {
    storeId: data.storeId,
    categoryId: data.categoryId,
    name: data.name || data.title,
    description: data.description,
    category: data.category || data.categoryName,
    material: data.material || data.ingredients,
    attributes: productMetadata(data),
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
  const metadata = productMetadata(data);
  if (Object.keys(metadata).length) body.attributes = metadata;
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
          : 'INACTIVE');
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
    let items = await hydrateProducts(unwrapList(res));
    if (params?.storeId) items = items.filter((p) => p.storeId === params.storeId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q),
      );
    }
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const totalPages = Math.max(1, Math.ceil(items.length / limit));
    return {
      items,
      data: items,
      total: items.length,
      pagination: { total: items.length, page, limit, totalPages },
    };
  },

  async getProduct(id: string): Promise<Product> {
    const res: any = await api.get(`/products/${id}`);
    return (await hydrateProducts([unwrapApi(res)]))[0];
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
    if (created.id) {
      const variants = data.variants?.length ? data.variants : [{
        sku: data.sku || `SKU-${created.id.slice(0, 8)}`, name: 'Tiêu chuẩn',
        price: Number(data.price) || 0, stockQuantity: data.stockQuantity || 0, imageUrl: data.imageUrl || '',
      }];
      await this.syncProductVariants(created.id, variants);
      await this.syncProductImages(created.id, data.imageUrl, data.subImages, data.title);
      return this.getProduct(created.id);
    }
    return created;
  },

  async updateProduct(id: string, data: Partial<Product>) {
    const body = toUpdateBody(data);
    if (body.attributes) {
      const current = unwrapApi<any>(await api.get(`/products/${id}`, { headers: { 'x-skip-cache': 'true' } }));
      body.attributes = { ...(current?.attributes || {}), ...(body.attributes as Record<string, unknown>) };
    }
    const res: any = await api.patch(`/products/${id}`, body);
    if (data.imageUrl !== undefined || data.subImages !== undefined) {
      await this.syncProductImages(id, data.imageUrl, data.subImages, data.title);
    }
    return normalizeProduct(unwrapApi(res));
  },

  async syncProductImages(productId: string, primary?: string, additional?: string[], title?: string) {
    if (import.meta.env.VITE_COMMERCE_BACKEND === 'legacy') return;
    const desired = [...new Set([primary, ...(additional || [])].filter((url): url is string => Boolean(url?.trim())))];
    const existing = unwrapList(await api.get('/product-images', { headers: { 'x-skip-cache': 'true' } }))
      .filter((image: any) => image.productId === productId);
    for (const [sortOrder, imageUrl] of desired.entries()) {
      const old: any = existing.find((image: any) => image.imageUrl === imageUrl);
      const body = { objectKey: imageUrl, imageUrl, primaryImage: sortOrder === 0, sortOrder, altText: title || 'Ảnh sản phẩm' };
      if (old) await api.patch(`/product-images/${old.imageId || old.id}`, body);
      else await api.post('/product-images', { productId, ...body });
    }
    for (const image of existing as any[]) {
      if (!desired.includes(image.imageUrl)) await api.delete(`/product-images/${image.imageId || image.id}`);
    }
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
      const options = variantOptions(variant);
      if (variant.id) {
        results.push(
          unwrapApi(
            await api.patch(`/product-variants/${variant.id}`, {
              ...options,
              priceVnd: variant.price,
              stockQuantity: variant.stockQuantity,
            }),
          ),
        );
      } else {
        results.push(
          unwrapApi(
            await api.post('/product-variants', {
              productId,
              sku: variant.sku,
              ...options,
              priceVnd: variant.price,
              stockQuantity: variant.stockQuantity,
              status: 'ACTIVE',
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
