import { useEffect, useState } from 'react';
import { orderService } from '../../../services/order.service';
import { storeService } from '../../../services/store.service';
import { notificationsService } from '../../../services/notifications.service';
import { useCustomerVouchers } from '../../../hooks/useCustomerVouchers';
import { useCustomerWishlist } from '../../../hooks/useCustomerWishlist';
import type { WorkspaceNavRole } from './resolveWorkspaceRole';

export function useSidebarBadges(role: WorkspaceNavRole, userId?: string, currentPath = '') {
  const voucherInventory = useCustomerVouchers(
    currentPath.startsWith('/customer') && role === 'CUSTOMER' ? userId : undefined,
  );
  const wishlistInventory = useCustomerWishlist(
    currentPath.startsWith('/customer') ? userId : undefined,
  );
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState<{ ORDER?: number; PROMOTION?: number; SYSTEM?: number }>({});

  useEffect(() => {
    let mounted = true;
    setPendingOrdersCount(null);
    setUnreadNotifs({});
    const loadShopOrders = async () => {
      if (role !== 'SHOP_MANAGER' || !userId) return;
      try {
        const stores = await storeService.listMyStores(true);
        if (!mounted) return;
        const selected = localStorage.getItem('current_store_id');
        const store = stores.find(item => item.id === selected) || stores[0];
        if (!store) { setPendingOrdersCount(null); return; }
        const result = await orderService.getMyStoreOrders({ storeId: store.id, status: 'PENDING', limit: 1 });
        if (mounted) setPendingOrdersCount(result.pagination?.total ?? null);
      } catch { if (mounted) setPendingOrdersCount(null); }
    };
    void loadShopOrders();
    notificationsService
      .getUnreadDetails()
      .then((res) => {
        if (mounted && res?.categoryUnreadCounts) {
          setUnreadNotifs(res.categoryUnreadCounts);
        }
      })
      .catch(() => {});

    const handleOrderUpdate = () => {
      void loadShopOrders();
    };
    window.addEventListener('scanms_order_updated', handleOrderUpdate);
    window.addEventListener('scanms_notification_received', handleOrderUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('scanms_order_updated', handleOrderUpdate);
      window.removeEventListener('scanms_notification_received', handleOrderUpdate);
    };
  }, [role, userId]);

  const getItemBadge = (path: string, staticBadge?: string) => {
    if (path === '/customer/wishlist') {
      return !wishlistInventory.loading && !wishlistInventory.error
        ? { text: String(wishlistInventory.count), isHighlight: false }
        : null;
    }
    if (path === '/customer/vouchers') {
      return !voucherInventory.loading && !voucherInventory.error
        ? { text: String(voucherInventory.vouchers.length), isHighlight: false }
        : null;
    }
    if (staticBadge) return { text: staticBadge, isHighlight: false };
    if (path === '/merchant/orders') {
      if (pendingOrdersCount !== null && pendingOrdersCount > 0) {
        return { text: String(pendingOrdersCount), isHighlight: true };
      }
      if (unreadNotifs.ORDER && unreadNotifs.ORDER > 0) {
        return { text: String(unreadNotifs.ORDER), isHighlight: true };
      }
    }
    if (path === '/merchant/products' && unreadNotifs.SYSTEM && unreadNotifs.SYSTEM > 0) {
      return { text: 'Mới', isHighlight: true };
    }
    if (path === '/merchant/customer-messages' && unreadNotifs.PROMOTION && unreadNotifs.PROMOTION > 0) {
      return { text: String(unreadNotifs.PROMOTION), isHighlight: false };
    }
    if (path === '/customer/orders' && unreadNotifs.ORDER && unreadNotifs.ORDER > 0) {
      return { text: String(unreadNotifs.ORDER), isHighlight: true };
    }
    if (path === '/customer/notifications') {
      const total =
        (unreadNotifs.ORDER || 0) + (unreadNotifs.PROMOTION || 0) + (unreadNotifs.SYSTEM || 0);
      if (total > 0) return { text: String(total), isHighlight: true };
    }
    return null;
  };

  return { getItemBadge };
}
