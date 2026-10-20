import { useCallback, useEffect, useState } from 'react';
import { customerService, type CustomerWishlistItem } from '@/services/customer.service';

/** Wishlist local — không phụ thuộc @tanstack/react-query (tránh crash nếu package lỗi). */
export function useCustomerWishlist(userId?: string) {
  const [items, setItems] = useState<CustomerWishlistItem[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await customerService.getWishlist();
      setItems(Array.isArray(list) ? list.filter((i) => i?.product?.id) : []);
      setError(false);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    const onChange = (event: Event) => {
      if ((event as CustomEvent).detail?.userId !== userId) return;
      void refresh();
    };
    window.addEventListener('customer-wishlist-changed', onChange);
    return () => window.removeEventListener('customer-wishlist-changed', onChange);
  }, [userId, refresh]);

  const remove = async (productId: string) => {
    await customerService.removeFromWishlist(productId);
    setItems((prev) => prev.filter((item) => item.product?.id !== productId && (item as any).productId !== productId));
  };

  return { items, count: items.length, loading, error, remove, refresh };
}
