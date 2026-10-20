/**
 * Route Preloader & Data Prefetch Engine for SCANMS
 * Cho phép nạp trước (preload) mã nguồn JS và nạp trước dữ liệu API (Data Prefetch)
 * ngay khi người dùng rê chuột (hover) vào nút menu trên Sidebar / Navbar.
 * Áp dụng cơ chế Debounce 60ms để chống kích hoạt hàng loạt, bảo vệ CPU & RAM.
 * Giúp chuyển trang đạt 0ms tuyệt đối (Instant Zero-Latency Feel).
 */

import api from '../services/api';

type ComponentLoader = () => Promise<any>;

const ROUTE_LOADERS: Record<string, ComponentLoader> = {
  // Merchant / Shop
  '/merchant/dashboard': () => import('@/pages/merchant/ShopDashboardPage'),
  '/merchant/orders': () => import('@/pages/merchant/OrdersManagementPage'),
  '/merchant/products': () => import('@/pages/merchant/ProductManagementPage'),
  '/merchant/customer-messages': () => import('@/pages/chat/ChatBoxPage'),
  '/merchant/kol-hub': () => import('@/pages/merchant/ShopKolHubPage'),
  '/merchant/promotions': () => import('@/pages/merchant/ShopPromotionsHubPage'),
  '/merchant/live-sessions': () => import('@/pages/merchant/LiveSessionsPage'),
  '/merchant/payouts': () => import('@/pages/merchant/PayoutApprovalPage'),
  '/merchant/settings': () => import('@/pages/merchant/ShopSettingsPage'),

  // Collaborator / KOL
  '/collaborator/dashboard': () => import('@/pages/collaborator/KolDashboardPage'),
  '/collaborator/marketing': () => import('@/pages/collaborator/MarketingToolkitPage'),
  '/collaborator/collaboration': () => import('@/pages/collaborator/ShopCollaborationPage'),
  '/collaborator/live-sessions': () => import('@/pages/collaborator/LiveSessionsPage'),
  '/collaborator/wallet': () => import('@/pages/collaborator/WalletPage'),
  '/collaborator/profile': () => import('@/pages/collaborator/CreatorProfilePage'),

  // Admin & System Manager
  '/admin/analytics': () => import('@/pages/admin/AdminAnalyticsHubPage'),
  '/admin/users': () => import('@/pages/admin/KycApprovalPage'),
  '/admin/sample-requests': () => import('@/pages/admin/AdminSampleRequestsPage'),
  '/admin/product-moderation': () => import('@/pages/admin/ProductModerationPage'),
  '/admin/affiliate-oversight': () => import('@/pages/admin/AdminOversightHubPage'),
  '/admin/fraud-sentinel': () => import('@/pages/admin/AiFraudSentinelPage'),
  '/admin/audit-logs': () => import('@/pages/admin/AuditLogsPage'),

  // Customer & Public
  '/customer/orders': () => import('@/pages/customer/CustomerPortalPage'),
  '/marketplace': () => import('@/pages/public/MarketplacePage'),
  '/chat': () => import('@/pages/chat/ChatBoxPage'),
};

const ROUTE_DATA_PREFETCH: Record<string, () => Promise<any>> = {
  '/merchant/orders': () => api.get('/orders/my-store', { params: { page: 1, limit: 10 } }),
  '/merchant/products': () => api.get('/products', { params: { page: 1, limit: 10 } }),
  '/merchant/customer-messages': () => api.get('/chat/conversations'),
  '/merchant/kol-hub': () => api.get('/sample-requests/shop'),
  '/merchant/payouts': () => {
    const sId = localStorage.getItem('current_store_id');
    return sId ? api.get(`/stores/${sId}/payouts`, { params: { page: 1, limit: 10 } }) : Promise.resolve();
  },
  '/collaborator/marketing': () => api.get('/referral-links'),
  '/collaborator/collaboration': () => api.get('/campaigns/my-invitations'),
  '/collaborator/wallet': () => api.get('/wallets/me'),
  '/admin/users': () => api.get('/kyc/pending'),
  '/admin/audit-logs': () => api.get('/audit'),
  '/admin/fraud-sentinel': () => api.get('/audit/fraud-alerts'),
  '/admin/product-moderation': () => api.get('/products', { params: { status: 'PENDING_APPROVAL' } }),
  '/customer/orders': () => api.get('/customer/orders'),
  '/marketplace': () => api.get('/public/products', { params: { limit: 48, sortBy: 'newest' } }),
};

const preloadedRoutes = new Set<string>();
const prefetchedDataRoutes = new Set<string>();

/**
 * Nạp trước mã nguồn JS của một đường dẫn
 */
export function preloadRoute(path: string): void {
  const cleanPath = path.split('?')[0].split('#')[0];
  if (preloadedRoutes.has(cleanPath)) return;

  const loader = ROUTE_LOADERS[cleanPath];
  if (loader) {
    preloadedRoutes.add(cleanPath);
    loader().catch(() => {
      preloadedRoutes.delete(cleanPath);
    });
  }
}

/**
 * Nạp trước dữ liệu API chính của đường dẫn
 */
export function prefetchRouteData(path: string): void {
  const cleanPath = path.split('?')[0].split('#')[0];
  const dataLoader = ROUTE_DATA_PREFETCH[cleanPath];
  if (!dataLoader) return;

  if (prefetchedDataRoutes.has(cleanPath)) return;

  prefetchedDataRoutes.add(cleanPath);
  dataLoader().catch(() => {
    prefetchedDataRoutes.delete(cleanPath);
  });
}

let hoverTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Xử lý khi người dùng hover chuột hoặc focus phím vào nút menu
 * Debounce 60ms: Ngăn chặn kích hoạt nếu chuột chỉ quét lướt nhanh qua.
 */
export function handleRouteHover(path: string): void {
  if (hoverTimer) clearTimeout(hoverTimer);

  hoverTimer = setTimeout(() => {
    preloadRoute(path);
    prefetchRouteData(path);
  }, 60);
}

/**
 * Hủy kích hoạt nếu chuột rời nút trước 60ms
 */
export function cancelRouteHover(): void {
  if (hoverTimer) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
}

/**
 * Tự động nạp trước các trang và dữ liệu cốt lõi của vai trò hiện tại sau khi tải trang xong
 */
export function prewarmCoreRoutes(role?: string): () => void {
  const routesToPrewarm: string[] = [];

  if (role === 'SHOP_MANAGER') {
    routesToPrewarm.push(
      '/merchant/orders',
      '/merchant/products',
      '/merchant/customer-messages',
      '/merchant/kol-hub'
    );
  } else if (role === 'COLLABORATOR') {
    routesToPrewarm.push(
      '/collaborator/marketing',
      '/collaborator/collaboration',
      '/collaborator/wallet'
    );
  } else if (role === 'SYSTEM_ADMIN' || role === 'SYSTEM_MANAGER') {
    routesToPrewarm.push(
      '/admin/users',
      '/admin/product-moderation',
      '/admin/fraud-sentinel',
      '/admin/audit-logs'
    );
  } else {
    routesToPrewarm.push('/customer/orders', '/marketplace');
  }

  // Chờ 800ms khi trang chính đã render ổn định, nạp ngầm trong background
  const timeoutId = setTimeout(() => {
    routesToPrewarm.forEach((r) => {
      preloadRoute(r);
      prefetchRouteData(r);
    });
  }, 800);

  return () => clearTimeout(timeoutId);
}
