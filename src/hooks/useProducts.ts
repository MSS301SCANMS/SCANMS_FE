import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService, type Product } from '../services/product.service';
import api from '../lib/api';

// ─── AI Analyze Types ─────────────────────────────────────────────────────────
export interface AiDetectionItem {
  classId: number;
  className: string;
  confidence: number;
  boundingBox?: { x1: number; y1: number; x2: number; y2: number };
}

export interface AiTopPrediction {
  className: string;
  confidence: number;
}

export interface AiDominantColor {
  name: string;
  ratio: number;
}

export interface AiStylePrediction {
  style: string;
  confidence: number;
}

export interface AiAnalyzeProductResult {
  detections: AiDetectionItem[];
  topPrediction: AiTopPrediction | null;
  dominantColors: AiDominantColor[];
  stylePrediction: AiStylePrediction | null;
  detectionFallback: boolean;
  embeddingGenerated: boolean;
  inferenceTimeMs: number;
}

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const productKeys = {
  all: ['products'] as const,
  list: (params?: object) => ['products', 'list', params] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
  moderation: (status?: string) => ['products', 'moderation', status] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useProducts(params?: {
  storeId?: string;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productService.getProducts(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: Boolean(id),
  });
}

export function useModerationProducts(status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'ALL' = 'DRAFT') {
  return useQuery({
    queryKey: productKeys.moderation(status),
    queryFn: () => productService.getModerationProducts(status),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof productService.createProduct>[0]) =>
      productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productService.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useModerateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED';
      reason?: string;
    }) => productService.moderateProduct(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useSyncProductVariants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variants,
    }: {
      productId: string;
      variants: Parameters<typeof productService.syncProductVariants>[1];
    }) => productService.syncProductVariants(productId, variants),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}

export function useUpdateVariantSamplePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      data,
    }: {
      productId: string;
      variantId: string;
      data: Parameters<typeof productService.updateVariantSamplePolicy>[2];
    }) => productService.updateVariantSamplePolicy(productId, variantId, data),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}

export function useSoftDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.softDeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useBulkUpdateCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productIds,
      commissionRate,
    }: {
      productIds: string[];
      commissionRate: number;
    }) => productService.bulkUpdateCommission(productIds, commissionRate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/**
 * Gửi ảnh sản phẩm tới AI service (qua product-service gateway) để phân tích:
 * - Nhận diện loại hàng hóa (clothing detection / object detection)
 * - Màu sắc chủ đạo
 * - Phong cách (casual, formal, sporty…)
 *
 * Endpoint: POST /products/ai-analyze (multipart/form-data, field: image)
 */
export function useAiAnalyzeProduct() {
  return useMutation({
    mutationFn: async (imageFile: File): Promise<AiAnalyzeProductResult> => {
      const body = new FormData();
      body.append('image', imageFile);
      const res: any = await api.post('/products/ai-analyze', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res?.data || res;
    },
  });
}
