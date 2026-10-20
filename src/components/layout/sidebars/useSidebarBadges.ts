import { useEffect, useState } from 'react';
import { orderService } from '../../../services/order.service';
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
    if (role === 'SHOP_MANAGER') {
      orderService
        .getMyStoreOrders({ status: 'PENDING', limit: 1 })
        .then((res) => {
          if (mounted && res?.pagination?.total !== undefined) {
            setPendingOrdersCount(res.pagination.total);
          }
        })
        .catch(() => {});
    }
    notificationsService
      .getUnreadDetails()
      .then((res) => {
        if (mounted && res?.categoryUnreadCounts) {
          setUnreadNotifs(res.categoryUnreadCounts);
        }
      })
      .catch(() => {});

    const handleOrderUpdate = () => {
      if (role === 'SHOP_MANAGER') {
        orderService
          .getMyStoreOrders({ status: 'PENDING', limit: 1 })
          .then((res) => {
            if (mounted && res?.pagination?.total !== undefined) {
              setPendingOrdersCount(res.pagination.total);
            }
          })
          .catch(() => {});
      }
    };
    window.addEventListener('scanms_order_updated', handleOrderUpdate);
    window.addEventListener('scanms_notification_received', handleOrderUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('scanms_order_updated', handleOrderUpdate);
      window.removeEventListener('scanms_notification_received', handleOrderUpdate);
    };
  }, [role]);

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
