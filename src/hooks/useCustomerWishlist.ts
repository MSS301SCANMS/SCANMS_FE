import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService, type CustomerWishlistItem } from '@/services/customer.service';

export function useCustomerWishlist(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['customer-wishlist', userId];
  const query = useQuery<CustomerWishlistItem[]>({
    queryKey, enabled: Boolean(userId), staleTime: 15_000, refetchInterval: 60_000,
    queryFn: ({ signal }) => customerService.getWishlist(signal),
  });
  useEffect(() => {
    if (!userId) return;
    const refresh = (event: Event) => {
      if ((event as CustomEvent).detail?.userId !== userId) return;
      void queryClient.invalidateQueries({ queryKey: ['customer-wishlist', userId], exact: true });
    };
    window.addEventListener('customer-wishlist-changed', refresh);
    return () => window.removeEventListener('customer-wishlist-changed', refresh);
  }, [userId, queryClient]);

  const remove = async (productId: string) => {
    await customerService.removeFromWishlist(productId);
    queryClient.setQueryData<CustomerWishlistItem[]>(queryKey, previous => previous?.filter(item => item.product.id !== productId));
  };
  const items = query.data || [];
  return { items, count: items.length, loading: query.isPending, error: query.isError, remove };
}
