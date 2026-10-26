/**
 * Route Preloader — chỉ prefetch route thuộc mainflow SCANMS.
 */

import api from '../services/api';
import { authService } from '../services/auth.service';

type ComponentLoader = () => Promise<any>;

const ROUTE_LOADERS: Record<string, ComponentLoader> = {
  '/merchant/dashboard': () => import('@/pages/merchant/ShopDashboardPage'),
  '/merchant/orders': () => import('@/pages/merchant/OrdersManagementPage'),
  '/merchant/products': () => import('@/pages/merchant/ProductManagementPage'),
  '/merchant/promotions': () => import('@/pages/merchant/ShopPromotionsHubPage'),
  '/merchant/live-sessions': () => import('@/pages/merchant/LiveSessionsPage'),
  '/merchant/payouts': () => import('@/pages/finance/FinanceWalletPage'),
  '/merchant/wallet': () => import('@/pages/finance/FinanceWalletPage'),
  '/merchant/settlements': () => import('@/pages/finance/SettlementPage'),
  '/merchant/settings': () => import('@/pages/merchant/ShopSettingsPage'),
  '/collaborator/dashboard': () => import('@/pages/collaborator/KolDashboardPage'),
  '/collaborator/marketing': () => import('@/pages/collaborator/MarketingToolkitPage'),
  '/collaborator/wallet': () => import('@/pages/finance/FinanceWalletPage'),
  '/collaborator/profile': () => import('@/pages/collaborator/CreatorProfilePage'),
  '/admin/users': () => import('@/pages/admin/AdminUsersPage'),
  '/admin/kyc-approval': () => import('@/pages/admin/KycApprovalPage'),
  '/admin/ops-dashboard': () => import('@/pages/admin/ManagerOpsDashboardPage'),
  '/admin/product-moderation': () => import('@/pages/admin/ProductModerationPage'),
  '/admin/affiliate-oversight': () => import('@/pages/admin/AdminOversightHubPage'),
  '/customer/orders': () => import('@/pages/customer/CustomerPortalPage'),
  '/marketplace': () => import('@/pages/public/MarketplacePage'),
};

const ROUTE_DATA_PREFETCH: Record<string, () => Promise<any>> = {
  '/merchant/orders': () => api.get('/seller-orders'),
  '/merchant/products': () => api.get('/products'),
  '/collaborator/marketing': () => api.get('/referrals'),
  '/collaborator/wallet': () => api.get('/finance/wallets/me', { params: { ownerType: 'COLLABORATOR' } }),
  '/admin/users': () => api.get('/users/admin'),
  '/admin/product-moderation': () => api.get('/products'),
  '/customer/orders': () => api.get('/orders/my-orders'),
  '/marketplace': () => api.get('/public/products', { params: { limit: 48, sortBy: 'newest' } }),
};

const preloadedRoutes = new Set<string>();
const prefetchedDataRoutes = new Set<string>();

export function preloadRoute(path: string): void {
  const cleanPath = resolvePreloadPath(path);
  if (preloadedRoutes.has(cleanPath)) return;
  const loader = ROUTE_LOADERS[cleanPath];
  if (loader) {
    preloadedRoutes.add(cleanPath);
    void loader().catch(() => preloadedRoutes.delete(cleanPath));
  }
}

export function prefetchRouteData(path: string): void {
  const cleanPath = resolvePreloadPath(path);
  // User administration is restricted to Admin, including speculative requests.
  if (cleanPath === '/admin/users' && !['SYSTEM_ADMIN', 'ADMIN'].includes(authService.getCurrentUser()?.role || '')) return;
  if (prefetchedDataRoutes.has(cleanPath)) return;
  const fetcher = ROUTE_DATA_PREFETCH[cleanPath];
  if (fetcher) {
    prefetchedDataRoutes.add(cleanPath);
    void fetcher().catch(() => prefetchedDataRoutes.delete(cleanPath));
  }
}

function resolvePreloadPath(path: string): string {
  const cleanPath = path.split('?')[0].split('#')[0];
  const role = authService.getCurrentUser()?.role;
  return cleanPath === '/admin/users' && (role === 'SYSTEM_MANAGER' || role === 'MANAGER')
    ? '/admin/kyc-approval' : cleanPath;
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
        : role === 'SYSTEM_MANAGER' || role === 'MANAGER' || (role === 'admin' && ['SYSTEM_MANAGER', 'MANAGER'].includes(authService.getCurrentUser()?.role || ''))
          ? ['/admin/ops-dashboard', '/admin/kyc-approval', '/admin/product-moderation']
        : role === 'SYSTEM_ADMIN' || role === 'ADMIN' || role === 'admin'
          ? ['/admin/users']
          : ['/marketplace', '/customer/orders'];
  routes.forEach((r) => {
    preloadRoute(r);
    prefetchRouteData(r);
  });
}
