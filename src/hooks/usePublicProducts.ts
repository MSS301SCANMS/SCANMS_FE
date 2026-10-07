import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../lib/api';

// ─── Query Keys ────────────────────────────────────────────────────────────────
export const publicProductKeys = {
  list: (params?: object) => ['public', 'products', 'list', params] as const,
  categories: ['public', 'products', 'categories'] as const,
  stores: ['public', 'products', 'stores'] as const,
  marketplace: (params?: object) => ['public', 'marketplace', params] as const,
  shopPublic: (shopId: string) => ['public', 'shop', shopId] as const,
  shopFollow: (shopId: string) => ['public', 'shop', shopId, 'follow'] as const,
  orderTrack: ['public', 'order-track'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePublicProducts(params?: {
  storeId?: string;
  search?: string;
  category?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: publicProductKeys.list(params),
    queryFn: async () => {
      const res: any = await api.get('/public/products', { params });
      return res?.data || res;
    },
  });
}

export function usePublicProductCategories() {
  return useQuery({
    queryKey: publicProductKeys.categories,
    queryFn: async () => {
      const res: any = await api.get('/public/products/categories');
      return res?.data || res || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function usePublicProductStores() {
  return useQuery({
    queryKey: publicProductKeys.stores,
    queryFn: async () => {
      const res: any = await api.get('/public/products/stores');
      return res?.data || res || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMarketplaceStores() {
  return useQuery({
    queryKey: publicProductKeys.marketplace(),
    queryFn: async () => {
      const res: any = await api.get('/stores/marketplace').catch(() => ({ data: [] }));
      return res?.data?.data || res?.data || [];
    },
  });
}

export function usePublicShopInfo(shopId: string) {
  return useQuery({
    queryKey: publicProductKeys.shopPublic(shopId),
    queryFn: async () => {
      const res: any = await api.get(`/stores/public/id/${shopId}`);
      return res?.data || res;
    },
    enabled: Boolean(shopId),
  });
}

export function useShopFollowStatus(shopId: string) {
  return useQuery({
    queryKey: publicProductKeys.shopFollow(shopId),
    queryFn: async () => {
      const res: any = await api.get(`/stores/public/id/${shopId}/follow`);
      return res?.data || res;
    },
    enabled: Boolean(shopId),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useToggleShopFollow() {
  return useMutation({
    mutationFn: async ({ shopId, following }: { shopId: string; following: boolean }) => {
      if (following) {
        return api.delete(`/stores/public/id/${shopId}/follow`);
      } else {
        return api.post(`/stores/public/id/${shopId}/follow`);
      }
    },
  });
}

export function useTrackPublicOrder() {
  return useMutation({
    mutationFn: async ({ phone, orderSn }: { phone: string; orderSn: string }) => {
      const res: any = await api.get(
        `/public/orders/track?phone=${encodeURIComponent(phone.trim())}&orderSn=${encodeURIComponent(orderSn.trim())}`,
      );
      return res?.data || res;
    },
  });
}
