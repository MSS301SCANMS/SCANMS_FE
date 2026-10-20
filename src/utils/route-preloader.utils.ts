/**
 * Route Preloader — chỉ prefetch route thuộc mainflow SCANMS.
 */

import api from '../services/api';

type ComponentLoader = () => Promise<any>;

const ROUTE_LOADERS: Record<string, ComponentLoader> = {
  '/merchant/dashboard': () => import('@/pages/merchant/ShopDashboardPage'),
  '/merchant/orders': () => import('@/pages/merchant/OrdersManagementPage'),
  '/merchant/products': () => import('@/pages/merchant/ProductManagementPage'),
  '/merchant/promotions': () => import('@/pages/merchant/ShopPromotionsHubPage'),
  '/merchant/live-sessions': () => import('@/pages/merchant/LiveSessionsPage'),
  '/merchant/payouts': () => import('@/pages/merchant/PayoutApprovalPage'),
  '/merchant/settings': () => import('@/pages/merchant/ShopSettingsPage'),
  '/collaborator/dashboard': () => import('@/pages/collaborator/KolDashboardPage'),
  '/collaborator/marketing': () => import('@/pages/collaborator/MarketingToolkitPage'),
  '/collaborator/wallet': () => import('@/pages/collaborator/WalletPage'),
  '/collaborator/profile': () => import('@/pages/collaborator/CreatorProfilePage'),
  '/admin/users': () => import('@/pages/admin/AdminUsersPage'),
  '/admin/product-moderation': () => import('@/pages/admin/ProductModerationPage'),
  '/admin/affiliate-oversight': () => import('@/pages/admin/AdminOversightHubPage'),
  '/customer/orders': () => import('@/pages/customer/CustomerPortalPage'),
  '/marketplace': () => import('@/pages/public/MarketplacePage'),
};

const ROUTE_DATA_PREFETCH: Record<string, () => Promise<any>> = {
  '/merchant/orders': () => api.get('/seller-orders'),
  '/merchant/products': () => api.get('/products'),
  '/merchant/payouts': () => api.get('/finance/settlements'),
  '/collaborator/marketing': () => api.get('/referrals'),
  '/collaborator/wallet': () => api.get('/finance/wallets/me'),
  '/admin/users': () => api.get('/users/admin'),
  '/admin/product-moderation': () => api.get('/products'),
  '/customer/orders': () => api.get('/orders/my-orders'),
  '/marketplace': () => api.get('/public/products', { params: { limit: 48, sortBy: 'newest' } }),
};

const preloadedRoutes = new Set<string>();
const prefetchedDataRoutes = new Set<string>();

export function preloadRoute(path: string): void {
  const cleanPath = path.split('?')[0].split('#')[0];
  if (preloadedRoutes.has(cleanPath)) return;
  const loader = ROUTE_LOADERS[cleanPath];
  if (loader) {
    preloadedRoutes.add(cleanPath);
    void loader().catch(() => preloadedRoutes.delete(cleanPath));
  }
}

export function prefetchRouteData(path: string): void {
  const cleanPath = path.split('?')[0].split('#')[0];
  if (prefetchedDataRoutes.has(cleanPath)) return;
  const fetcher = ROUTE_DATA_PREFETCH[cleanPath];
  if (fetcher) {
    prefetchedDataRoutes.add(cleanPath);
    void fetcher().catch(() => prefetchedDataRoutes.delete(cleanPath));
  }
}

let hoverTimer: ReturnType<typeof setTimeout> | null = null;

export function handleRouteHover(path: string): void {
  if (hoverTimer) clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => {
    preloadRoute(path);
    prefetchRouteData(path);
  }, 60);
}

export function cancelRouteHover(): void {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
}

export function prewarmCoreRoutes(role?: string): void {
  const routes =
    role === 'SHOP_MANAGER' || role === 'shop'
      ? ['/merchant/dashboard', '/merchant/orders', '/merchant/products']
      : role === 'COLLABORATOR' || role === 'kol'
        ? ['/collaborator/dashboard', '/collaborator/marketing']
        : role === 'SYSTEM_ADMIN' || role === 'SYSTEM_MANAGER' || role === 'admin'
          ? ['/admin/users', '/admin/product-moderation']
          : ['/marketplace', '/customer/orders'];
  routes.forEach((r) => {
    preloadRoute(r);
    prefetchRouteData(r);
  });
}
