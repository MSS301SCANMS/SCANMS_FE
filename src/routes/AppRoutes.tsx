import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ComponentType, useSyncExternalStore } from 'react';

function lazyRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch {
      await new Promise((r) => setTimeout(r, 400));
      return await factory();
    }
  });
}

import MainLayout from '../components/layout/MainLayout';
const DashboardDispatcher = lazyRetry(() => import('@/pages/DashboardDispatcher'));
const KolDashboardPage = lazyRetry(() => import('@/pages/collaborator/KolDashboardPage'));
const LoginPage = lazyRetry(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazyRetry(() => import('@/pages/auth/RegisterPage'));
const ProductDetailPage = lazyRetry(() => import('@/pages/public/ProductDetailPage'));
const RedirectHandlerPage = lazyRetry(() => import('@/pages/public/RedirectHandlerPage'));
const MarketplacePage = lazyRetry(() => import('../pages/public/MarketplacePage'));
const ShortVideosPage = lazyRetry(() => import('../pages/public/ShortVideosPage'));
const ShortVideoStudioPage = lazyRetry(() => import('../pages/collaborator/ShortVideoStudioPage'));
const ShopPage = lazyRetry(() => import('../pages/public/ShopPage'));
const SearchPage = lazyRetry(() => import('../pages/public/SearchPage'));
const OutfitMatchPage = lazyRetry(() => import('../pages/public/OutfitMatchPage'));
const PayosReturnPage = lazyRetry(() => import('../pages/public/PayosReturnPage'));
const LiveStreamRoomPage = lazyRetry(() => import('../pages/public/LiveStreamRoomPage'));
const ProductManagementPage = lazyRetry(() => import('../pages/merchant/ProductManagementPage'));
const ShopDashboardPage = lazyRetry(() => import('../pages/merchant/ShopDashboardPage'));
const ShopApplicationPage = lazyRetry(() => import('../pages/merchant/ShopApplicationPage'));
const ShopSettingsPage = lazyRetry(() => import('../pages/merchant/ShopSettingsPage'));
const ChatBoxPage = lazyRetry(() => import('../pages/chat/ChatBoxPage'));
const AdminUsersPage = lazyRetry(() => import('../pages/admin/AdminUsersPage'));
const KycApprovalPage = lazyRetry(() => import('../pages/admin/KycApprovalPage'));
const OrdersManagementPage = lazyRetry(() => import('../pages/merchant/OrdersManagementPage'));
const FinanceWalletPage = lazyRetry(() => import('../pages/finance/FinanceWalletPage'));
const SettlementPage = lazyRetry(() => import('../pages/finance/SettlementPage'));
const OrderTrackingPage = lazyRetry(() => import('../pages/public/OrderTrackingPage'));
const CustomerPortalPage = lazyRetry(() => import('../pages/customer/CustomerPortalPage'));
const ReturnDetailPage = lazyRetry(() => import('../pages/returns/ReturnDetailPage'));
const AdminReturnDisputesPage = lazyRetry(() => import('../pages/admin/AdminReturnDisputesPage'));
const MarketingToolkitPage = lazy(() => import('../pages/collaborator/MarketingToolkitPage'));
const CreatorProfilePage = lazy(() => import('../pages/collaborator/CreatorProfilePage'));
const ShopPromotionsHubPage = lazy(() => import('../pages/merchant/ShopPromotionsHubPage'));
const LiveSessionsPage = lazy(() => import('../pages/merchant/LiveSessionsPage'));
const AdminOversightHubPage = lazy(() => import('../pages/admin/AdminOversightHubPage'));
const AdminProfilePage = lazyRetry(() => import('../pages/admin/AdminProfilePage'));
const ProductModerationPage = lazy(() => import('../pages/admin/ProductModerationPage'));
const ManagerOpsDashboardPage = lazy(() => import('../pages/admin/ManagerOpsDashboardPage'));
const AdminSystemHealthPage = lazy(() => import('../pages/admin/AdminSystemHealthPage'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminSystemWalletPage = lazy(() => import('../pages/admin/AdminSystemWalletPage'));
const AdminStatsPage = lazy(() => import('../pages/admin/AdminStatsPage'));
const AdminCommissionPoliciesPage = lazy(() => import('../pages/admin/AdminCommissionPoliciesPage'));
const CollaborationsPage = lazy(() => import('../pages/shared/CollaborationsPage'));
const ShopReturnRequestsPage = lazy(() =>
  import('../pages/merchant/ShopReturnRequestsPage').then((m) => ({ default: m.ShopReturnRequestsPage })),
);
const ShopStorefrontPage = lazy(() => import('../pages/public/ShopStorefrontPage'));

import { RouteContent } from './RouteContent';
import { RoleGuard } from './RoleGuard';
import { CustomerShoppingGuard } from './CustomerShoppingGuard';
import { CartProvider, useCart } from '../context/CartContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { CartDrawer } from '../components/cart/CartDrawer';
import { GuestCheckoutModal } from '../components/checkout/GuestCheckoutModal';
import { StorePresenceHeartbeat } from '../components/store/StorePresenceHeartbeat';
import { canAccessShopping } from '../utils/shopping-access';
import { authService } from '../services/auth.service';

function AdminUsersEntry() {
  const role = authService.getCurrentUser()?.role;
  return role === 'SYSTEM_MANAGER' || role === 'MANAGER'
    ? <Navigate to="/admin/kyc-approval" replace /> : <AdminUsersPage />;
}

function ShopApplicationEntry() {
  const user = authService.getCurrentUser();
  const hasShopWorkspace = user && authService.getUserAvailableWorkspaces(user).some(workspace => workspace.key === 'shop');
  return hasShopWorkspace ? <Navigate to="/merchant/store-application" replace /> : <CustomerPortalPage />;
}

function GlobalCheckoutModal() {
  const { isCheckoutOpen, closeCheckout, checkoutItems, checkoutCouponCode } = useCart();
  if (!isCheckoutOpen || !canAccessShopping()) return null;
  return (
    <GuestCheckoutModal
      isOpen={isCheckoutOpen}
      onClose={closeCheckout}
      checkoutItems={checkoutItems}
      initialCouponCode={checkoutCouponCode}
    />
  );
}

function ShoppingChrome() {
  const allowed = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('scanms_workspace_changed', onStoreChange);
      window.addEventListener('scanms_auth_changed', onStoreChange);
      window.addEventListener('auth-user-updated', onStoreChange);
      window.addEventListener('storage', onStoreChange);
      return () => {
        window.removeEventListener('scanms_workspace_changed', onStoreChange);
        window.removeEventListener('scanms_auth_changed', onStoreChange);
        window.removeEventListener('auth-user-updated', onStoreChange);
        window.removeEventListener('storage', onStoreChange);
      };
    },
    () => canAccessShopping(),
    () => true,
  );
  if (!allowed) return null;
  return (
    <>
      <CartDrawer />
      <GlobalCheckoutModal />
    </>
  );
}

function AppRoutes() {
  return (
    <Router>
      <CartProvider>
        <StorePresenceHeartbeat />
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="min-h-screen bg-[#FAF8F5] grid place-items-center text-[#7D715E]">
                Đang tải SCANMS...
              </div>
            }
          >
            <Routes>
              {/* ===== Mua sắm: chỉ guest + workspace customer ===== */}
              <Route element={<CustomerShoppingGuard />}>
                <Route path="/" element={<MarketplacePage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/shops/:shopId" element={<ShopPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/marketplace/search" element={<SearchPage />} />
                <Route path="/outfit-match" element={<OutfitMatchPage />} />
                <Route path="/customer/outfit-match" element={<OutfitMatchPage />} />
                <Route path="/store" element={<MarketplacePage />} />
                <Route path="/storefront" element={<MarketplacePage />} />
                <Route path="/shop" element={<ShopStorefrontPage />} />
                <Route path="/shop/:slug" element={<ShopStorefrontPage />} />
                <Route path="/stores/:slug" element={<ShopStorefrontPage />} />
                <Route path="/tracking" element={<OrderTrackingPage />} />
                <Route path="/order-tracking" element={<OrderTrackingPage />} />
              </Route>

              {/* Shared product links are public across workspaces. */}
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              {/* Hosts and viewers share the live room across workspaces. */}
              <Route path="/live/:slug" element={<LiveStreamRoomPage />} />
              <Route path="/live" element={<LiveStreamRoomPage />} />
              <Route path="/shorts" element={<ShortVideosPage />} />
              <Route path="/payment/payos-return" element={<PayosReturnPage />} />
              <Route path="/r/:shortCode" element={<RedirectHandlerPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Out-of-scope UI → redirect */}
              <Route path="/prototype" element={<Navigate to="/" replace />} />
              <Route path="/ui-reference" element={<Navigate to="/" replace />} />
              <Route path="/app" element={<Navigate to="/" replace />} />
              <Route path="/app/:screenId" element={<Navigate to="/" replace />} />
              <Route path="/leaderboard" element={<Navigate to="/" replace />} />
              <Route path="/chat" element={<Navigate to="/customer/orders" replace />} />

              {/* Customer portal */}
              <Route path="/customer" element={<CustomerPortalPage />} />
              <Route path="/customer/portal" element={<CustomerPortalPage />} />
              <Route path="/customer/orders" element={<CustomerPortalPage />} />
              <Route path="/customer/profile" element={<CustomerPortalPage />} />
              <Route path="/customer/identity" element={<CustomerPortalPage />} />
              <Route path="/customer/addresses" element={<CustomerPortalPage />} />
              <Route path="/customer/upgrade" element={<CustomerPortalPage />} />
              <Route path="/customer/upgrade/kol" element={<CustomerPortalPage />} />
              <Route path="/customer/upgrade/shop" element={<ShopApplicationEntry />} />
              <Route path="/customer/returns/:id" element={<ReturnDetailPage mode="customer" />} />
              <Route path="/customer/vouchers" element={<CustomerPortalPage />} />
              <Route path="/customer/security" element={<CustomerPortalPage />} />
              <Route path="/customer/wallet" element={<CustomerPortalPage />} />
              <Route path="/customer/wallet/topup" element={<CustomerPortalPage />} />
              <Route path="/customer/wishlist" element={<CustomerPortalPage />} />
              <Route path="/customer/notifications" element={<CustomerPortalPage />} />

              <Route element={<MainLayout />}>
                <Route path="/portal" element={<DashboardDispatcher />} />
                <Route path="/dashboard" element={<DashboardDispatcher />} />

                {/* Shop owner */}
                <Route element={<RoleGuard requiredWorkspace="shop" />}>
                  <Route element={<RouteContent />}>
                    <Route path="merchant/dashboard" element={<ShopDashboardPage />} />
                    <Route path="merchant/store-application" element={<ShopApplicationPage />} />
                    <Route path="merchant/products" element={<ProductManagementPage />} />
                    <Route path="merchant/orders" element={<OrdersManagementPage />} />
                    <Route path="merchant/returns/:id" element={<ReturnDetailPage mode="shop" />} />
                    <Route path="merchant/returns" element={<ShopReturnRequestsPage />} />
                    <Route path="merchant/return-requests" element={<ShopReturnRequestsPage />} />
                    <Route path="merchant/payouts" element={<FinanceWalletPage />} />
                    <Route path="merchant/wallet" element={<FinanceWalletPage />} />
                    <Route path="merchant/settlements" element={<SettlementPage />} />
                    <Route path="shop/wallet" element={<FinanceWalletPage />} />
                    <Route path="stores/:storeId/payouts" element={<FinanceWalletPage />} />
                    <Route path="merchant/settings" element={<ShopSettingsPage />} />
                    <Route path="merchant/promotions" element={<ShopPromotionsHubPage />} />
                    <Route path="merchant/live-sessions" element={<LiveSessionsPage />} />
                    <Route path="merchant/livestream" element={<Navigate to="/merchant/live-sessions" replace />} />
                    <Route path="merchant/collaborations" element={<CollaborationsPage mode="shop" />} />
                    <Route path="merchant/commission-rules" element={<Navigate to="/merchant/promotions?tab=commission-rules" replace />} />
                    <Route path="merchant/referral-links" element={<Navigate to="/merchant/promotions?tab=referral-links" replace />} />
                    <Route path="merchant/coupons" element={<Navigate to="/merchant/promotions?tab=coupons" replace />} />
                    <Route path="shop" element={<Navigate to="/merchant/dashboard" replace />} />
                    <Route path="shop/dashboard" element={<Navigate to="/merchant/dashboard" replace />} />
                    {/* Out of scope shop UI */}
                    <Route path="merchant/kol-hub" element={<Navigate to="/merchant/collaborations" replace />} />
                    <Route path="merchant/customer-messages" element={<ChatBoxPage />} />
                    <Route path="merchant/campaigns" element={<Navigate to="/merchant/promotions" replace />} />
                    <Route path="merchant/messages" element={<Navigate to="/merchant/orders" replace />} />
                    <Route path="merchant/sample-requests" element={<Navigate to="/merchant/promotions" replace />} />
                    <Route path="merchant/collaborators" element={<Navigate to="/merchant/collaborations" replace />} />
                    <Route path="merchant/analytics" element={<Navigate to="/merchant/dashboard" replace />} />
                    <Route path="merchant/stats" element={<Navigate to="/merchant/dashboard" replace />} />
                    <Route path="merchant/leaderboard" element={<Navigate to="/merchant/dashboard" replace />} />
                    <Route path="merchant/fraud-sentinel" element={<Navigate to="/merchant/dashboard" replace />} />
                    <Route path="merchant/audit-logs" element={<Navigate to="/merchant/dashboard" replace />} />
                    <Route path="merchant/kyc-approval" element={<Navigate to="/admin/kyc-approval" replace />} />
                  </Route>
                </Route>

                {/* KOL */}
                <Route element={<RoleGuard requiredWorkspace="kol" />}>
                  <Route element={<RouteContent />}>
                    <Route path="collaborator/dashboard" element={<KolDashboardPage />} />
                    <Route path="collaborator/short-videos" element={<ShortVideoStudioPage />} />
                    <Route path="collaborator/wallet" element={<FinanceWalletPage />} />
                    <Route path="collaborator/marketing" element={<MarketingToolkitPage />} />
                    <Route path="collaborator/profile" element={<CreatorProfilePage />} />
                    <Route path="collaborator/links" element={<Navigate to="/collaborator/marketing?tab=links" replace />} />
                    <Route path="collaborator/referral-links" element={<Navigate to="/collaborator/marketing?tab=links" replace />} />
                    <Route path="collaborator/coupons" element={<Navigate to="/collaborator/marketing?tab=coupons" replace />} />
                    <Route path="collaborator/kyc" element={<Navigate to="/collaborator/profile" replace />} />
                    {/* Out of scope KOL UI */}
                    <Route path="collaborator/collaboration" element={<Navigate to="/collaborator/marketing" replace />} />
                    <Route path="collaborator/live-sessions" element={<Navigate to="/collaborator/marketing?tab=live" replace />} />
                    <Route path="collaborator/samples" element={<Navigate to="/collaborator/dashboard" replace />} />
                    <Route path="collaborator/sample-requests" element={<Navigate to="/collaborator/dashboard" replace />} />
                    <Route path="collaborator/messages" element={<Navigate to="/collaborator/dashboard" replace />} />
                    <Route path="collaborator/media-hub" element={<Navigate to="/collaborator/marketing?tab=links" replace />} />
                    <Route path="collaborator/campaigns" element={<Navigate to="/collaborator/marketing" replace />} />
                    <Route path="collaborator/social-channels" element={<Navigate to="/collaborator/profile" replace />} />
                    <Route path="collaborator/tiers" element={<Navigate to="/collaborator/profile" replace />} />
                    <Route path="collaborator/analytics" element={<Navigate to="/collaborator/dashboard" replace />} />
                    <Route path="collaborator/leaderboard" element={<Navigate to="/collaborator/dashboard" replace />} />
                    <Route path="collaborator/bonus-progress" element={<Navigate to="/collaborator/wallet" replace />} />
                  </Route>
                </Route>

                {/* Admin / Manager */}
                <Route element={<RoleGuard requiredWorkspace="admin" />}>
                  <Route element={<RouteContent />}>
                    <Route path="admin/users" element={<AdminUsersEntry />} />
                    <Route path="admin/kyc-approval" element={<KycApprovalPage />} />
                    <Route path="admin/profile" element={<AdminProfilePage />} />
                    <Route path="admin/product-moderation" element={<ProductModerationPage />} />
                    <Route path="admin/affiliate-oversight" element={<AdminOversightHubPage />} />
                    <Route path="admin/return-disputes" element={<AdminReturnDisputesPage />} />
                    <Route path="admin/returns/:id" element={<ReturnDetailPage mode="admin" />} />
                    <Route path="admin/ops-dashboard" element={<ManagerOpsDashboardPage />} />
                    <Route path="admin/commission-policies" element={<AdminCommissionPoliciesPage />} />
                    <Route path="admin/collaborations" element={<CollaborationsPage mode="admin" />} />
                    <Route path="admin/stats" element={<AdminStatsPage />} />
                    <Route path="admin/system-wallet" element={<AdminSystemWalletPage />} />
                    <Route path="admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="admin/system-health" element={<AdminSystemHealthPage />} />
                    <Route path="admin/referral-links" element={<Navigate to="/admin/affiliate-oversight?tab=links" replace />} />
                    <Route path="admin/coupons" element={<Navigate to="/admin/affiliate-oversight?tab=coupons" replace />} />
                    <Route path="admin/disputes" element={<Navigate to="/admin/return-disputes" replace />} />
                    <Route path="admin/arbitration" element={<Navigate to="/admin/return-disputes" replace />} />
                    <Route path="admin/analytics" element={<Navigate to="/admin/ops-dashboard" replace />} />
                    <Route path="admin/sample-requests" element={<Navigate to="/admin/users" replace />} />
                    <Route path="admin/fraud-sentinel" element={<Navigate to="/admin/users" replace />} />
                    <Route path="admin/audit-logs" element={<Navigate to="/admin/system-health" replace />} />
                    <Route path="admin/audit" element={<Navigate to="/admin/system-health" replace />} />
                    <Route path="admin/leaderboard" element={<Navigate to="/admin/stats" replace />} />
                    <Route path="admin/kol-recommendations" element={<Navigate to="/admin/collaborations" replace />} />
                  </Route>
                </Route>

                <Route path="analytics" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <ShoppingChrome />
      </CartProvider>
    </Router>
  );
}

export default AppRoutes;
