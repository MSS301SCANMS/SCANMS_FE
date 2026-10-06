import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ComponentType } from 'react';

/**
 * Tự động retry dynamic import module nếu gặp lỗi kết nối hoặc Vite HMR reload
 */
function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
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
const DashboardDispatcher = lazyRetry(() => import('../pages/DashboardDispatcher'));
const HomePage = lazyRetry(() => import('../pages/HomePage'));

const LoginPage = lazyRetry(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazyRetry(() => import('../pages/auth/RegisterPage'));

const ProductDetailPage = lazyRetry(() => import('../pages/ProductDetailPage'));
const RedirectHandlerPage = lazyRetry(() => import('../pages/RedirectHandlerPage'));

const UiReferencePage = lazyRetry(() => import('../pages/UiReferencePage'));
const MarketplacePage = lazyRetry(() => import('../pages/public/MarketplacePage'));
const ShopPage = lazyRetry(() => import('../pages/public/ShopPage'));
const SearchPage = lazyRetry(() => import('../pages/public/SearchPage'));
const PayosReturnPage = lazyRetry(() => import('../pages/public/PayosReturnPage'));
const LiveStreamRoomPage = lazyRetry(() => import('../pages/public/LiveStreamRoomPage'));
const FinanceWalletPage = lazyRetry(() => import('../pages/finance/FinanceWalletPage'));
const SettlementPage = lazyRetry(() => import('../pages/finance/SettlementPage'));
const AdminFinancePage = lazyRetry(() => import('../pages/finance/AdminFinancePage'));
const FinanceLoginPage = lazyRetry(() => import('../pages/finance/FinanceLoginPage'));

const ProductManagementPage = lazyRetry(() => import('../pages/merchant/ProductManagementPage'));
const ShopDashboardPage = lazyRetry(() => import('../pages/merchant/ShopDashboardPage'));
const ShopSettingsPage = lazyRetry(() => import('../pages/merchant/ShopSettingsPage'));
const KycApprovalPage = lazyRetry(() => import('../pages/merchant/KycApprovalPage'));
const OrdersManagementPage = lazyRetry(() => import('../pages/merchant/OrdersManagementPage'));
const PayoutApprovalPage = lazyRetry(() => import('../pages/merchant/PayoutApprovalPage'));

const WalletPage = lazyRetry(() => import('../pages/collaborator/WalletPage'));
const OrderTrackingPage = lazyRetry(() => import('../pages/public/OrderTrackingPage'));
const CustomerPortalPage = lazyRetry(() => import('../pages/customer/CustomerPortalPage'));
const ReturnDetailPage = lazyRetry(() => import('../pages/returns/ReturnDetailPage'));
const AdminReturnDisputesPage = lazyRetry(() => import('../pages/admin/AdminReturnDisputesPage'));
const ChatBoxPage = lazyRetry(() => import('../pages/chat/ChatBoxPage'));
const RealtimeAnalyticsPage = lazyRetry(() => import('../pages/dashboard/RealtimeAnalyticsPage'));
const LeaderboardPage = lazyRetry(() => import('../pages/dashboard/LeaderboardPage'));

// Consolidated Hub Pages (Tối ưu trải nghiệm gộp Menu)
const ShopCollaborationPage = lazy(() => import('../pages/collaborator/ShopCollaborationPage'));
const MarketingToolkitPage = lazy(() => import('../pages/collaborator/MarketingToolkitPage'));
const CreatorProfilePage = lazy(() => import('../pages/collaborator/CreatorProfilePage'));
const ShopKolHubPage = lazy(() => import('../pages/merchant/ShopKolHubPage'));
const ShopPromotionsHubPage = lazy(() => import('../pages/merchant/ShopPromotionsHubPage'));
const CollaboratorLiveSessionsPage = lazy(() => import('../pages/collaborator/LiveSessionsPage'));
const AdminOversightHubPage = lazy(() => import('../pages/admin/AdminOversightHubPage'));
const AdminAnalyticsHubPage = lazy(() => import('../pages/admin/AdminAnalyticsHubPage'));
const AdminSampleRequestsPage = lazy(() => import('../pages/admin/AdminSampleRequestsPage'));
const ProductModerationPage = lazy(() => import('../pages/admin/ProductModerationPage'));

// AI Anti-Fraud Sentinel & Traffic Defense (Quý - FR-31)
const AiFraudSentinelPage = lazy(() => import('../pages/merchant/AiFraudSentinelPage'));

// Audit Logs & Security Trail (Quý - FR-32)
const AuditLogsPage = lazy(() => import('../pages/admin/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));

// Dispute Arbitration Portal (Leader Thắng - Nhiệm vụ 4)
const DisputeResolutionPage = lazy(() => import('../pages/admin/DisputeResolutionPage').then(m => ({ default: m.DisputeResolutionPage })));

// Shop Return Requests (Merchant - Tiếp nhận đổi trả 14 ngày)
const ShopReturnRequestsPage = lazy(() => import('../pages/merchant/ShopReturnRequestsPage').then(m => ({ default: m.ShopReturnRequestsPage })));
const ShopStorefrontPage = lazy(() => import('../pages/public/ShopStorefrontPage'));

import { RouteContent } from './RouteContent';
import { CartProvider, useCart } from '../context/CartContext';
import { ScanmsChatProvider } from '../context/ScanmsChatContext';
import { ScanmsFloatingChatWidget } from '../components/chat/ScanmsFloatingChatWidget';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { CartDrawer } from '../components/cart/CartDrawer';
import { GuestCheckoutModal } from '../components/checkout/GuestCheckoutModal';
import { PublicHeader } from '../components/layout/PublicHeader';
import { authService } from '../services/auth.service';

function GlobalCheckoutModal() {
  const { isCheckoutOpen, closeCheckout, checkoutItems, checkoutCouponCode } = useCart();
  if (!isCheckoutOpen) return null;
  return (
    <GuestCheckoutModal
      isOpen={isCheckoutOpen}
      onClose={closeCheckout}
      checkoutItems={checkoutItems}
      initialCouponCode={checkoutCouponCode}
    />
  );
}

function PublicLeaderboardPage() {
  const user = authService.getCurrentUser();
  const isCustomerWorkspace = Boolean(
    user && (user.role === 'CUSTOMER' || authService.getActiveWorkspace() === 'customer'),
  );

  if (isCustomerWorkspace) {
    return <Navigate to="/customer/orders" replace />;
  }

  return (
    <>
      <PublicHeader />
      <LeaderboardPage />
    </>
  );
}

function AppRoutes() {
  return (
    <Router>
      <CartProvider>
        <ScanmsChatProvider>
          <ErrorBoundary>
            <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] grid place-items-center text-[#7D715E]">Đang tải SCANMS...</div>}>
              <Routes>
              <Route path="/" element={<MarketplacePage />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/shops/:shopId" element={<ShopPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/marketplace/search" element={<SearchPage />} />
              <Route path="/payment/payos-return" element={<PayosReturnPage />} />
              <Route path="/store" element={<MarketplacePage />} />
              <Route path="/storefront" element={<MarketplacePage />} />
              <Route path="/shop" element={<ShopStorefrontPage />} />
              <Route path="/shop/:slug" element={<ShopStorefrontPage />} />
              <Route path="/stores/:slug" element={<ShopStorefrontPage />} />
              <Route path="/leaderboard" element={<PublicLeaderboardPage />} />
              <Route path="/live/:slug" element={<LiveStreamRoomPage />} />
              <Route path="/live/:id" element={<LiveStreamRoomPage />} />
              <Route path="/live" element={<LiveStreamRoomPage />} />

        <Route path="/prototype" element={<UiReferencePage />} />
        <Route path="/ui-reference" element={<UiReferencePage />} />
        <Route path="/app" element={<UiReferencePage />} />
        <Route path="/app/:screenId" element={<UiReferencePage />} />

        <Route path="/tracking" element={<OrderTrackingPage />} />
        <Route path="/order-tracking" element={<OrderTrackingPage />} />

        {/* Customer Portal & Buyer Center (SCANMS E-Commerce) */}
        <Route path="/customer" element={<CustomerPortalPage />} />
        <Route path="/customer/portal" element={<CustomerPortalPage />} />
        <Route path="/customer/orders" element={<CustomerPortalPage />} />
        <Route path="/customer/profile" element={<CustomerPortalPage />} />
        <Route path="/customer/identity" element={<CustomerPortalPage />} />
        <Route path="/customer/addresses" element={<CustomerPortalPage />} />
        <Route path="/customer/wishlist" element={<CustomerPortalPage />} />
        <Route path="/customer/upgrade" element={<CustomerPortalPage />} />
        <Route path="/customer/upgrade/kol" element={<CustomerPortalPage />} />
        <Route path="/customer/upgrade/shop" element={<CustomerPortalPage />} />
        <Route path="/customer/returns/:id" element={<ReturnDetailPage mode="customer" />} />
        <Route path="/customer/vouchers" element={<CustomerPortalPage />} />
        <Route path="/customer/notifications" element={<CustomerPortalPage />} />
        <Route path="/customer/security" element={<CustomerPortalPage />} />
        <Route path="/customer/wallet" element={<CustomerPortalPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/finance/login" element={<FinanceLoginPage />} />
        <Route path="/auth/keycloak/callback" element={<FinanceLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/r/:shortCode" element={<RedirectHandlerPage />} />

        <Route path="/products/:slug" element={<ProductDetailPage />} />

        <Route element={<MainLayout />}>
          <Route path="/portal" element={<DashboardDispatcher />} />
          <Route path="/dashboard" element={<DashboardDispatcher />} />

          <Route element={<RouteContent />}>
            <Route path="merchant/dashboard" element={<ShopDashboardPage />} />
            <Route path="merchant/products" element={<ProductManagementPage />} />
            <Route path="merchant/orders" element={<OrdersManagementPage />} />
            <Route path="merchant/returns/:id" element={<ReturnDetailPage mode="shop" />} />
            <Route path="merchant/settlements" element={<SettlementPage />} />
            <Route path="admin/finance" element={<AdminFinancePage />} />
            <Route path="merchant/payouts" element={<FinanceWalletPage />} />
            <Route path="merchant/wallet" element={<FinanceWalletPage />} />
            <Route path="shop/wallet" element={<FinanceWalletPage />} />
            <Route path="stores/:storeId/payouts" element={<FinanceWalletPage />} />
            <Route path="merchant/settings" element={<ShopSettingsPage />} />
            <Route path="merchant/kyc-approval" element={<KycApprovalPage />} />

            {/* Merchant Consolidated Hubs */}
            <Route path="merchant/kol-hub" element={<ShopKolHubPage />} />
            <Route path="merchant/customer-messages" element={<ChatBoxPage />} />
            <Route path="merchant/promotions" element={<ShopPromotionsHubPage />} />
            <Route path="merchant/fraud-sentinel" element={<AiFraudSentinelPage />} />
            <Route path="merchant/ai-fraud" element={<AiFraudSentinelPage />} />
            <Route path="merchant/audit-logs" element={<AuditLogsPage />} />
            <Route path="merchant/returns" element={<ShopReturnRequestsPage />} />
            <Route path="merchant/return-requests" element={<ShopReturnRequestsPage />} />

            {/* Merchant Backward Compatibility Redirects */}
            <Route path="merchant/commission-rules" element={<Navigate to="/merchant/promotions?tab=commission-rules" replace />} />
            <Route path="stores/:storeId/commission-rules" element={<Navigate to="/merchant/promotions?tab=commission-rules" replace />} />
            <Route path="merchant/referral-links" element={<Navigate to="/merchant/promotions?tab=referral-links" replace />} />
            <Route path="stores/:storeId/referral-links" element={<Navigate to="/merchant/promotions?tab=referral-links" replace />} />
            <Route path="merchant/coupons" element={<Navigate to="/merchant/promotions?tab=coupons" replace />} />
            <Route path="stores/:storeId/coupons" element={<Navigate to="/merchant/promotions?tab=coupons" replace />} />
            <Route path="merchant/collaborators" element={<Navigate to="/merchant/kol-hub?tab=collaborators" replace />} />
            <Route path="merchant/sample-requests" element={<Navigate to="/merchant/kol-hub?tab=samples" replace />} />
            <Route path="merchant/campaigns" element={<Navigate to="/merchant/kol-hub?tab=messages" replace />} />
            <Route path="merchant/kol-recommendations" element={<Navigate to="/merchant/kol-hub?tab=ai-matching" replace />} />
            <Route path="merchant/messages" element={<Navigate to="/merchant/kol-hub?tab=messages" replace />} />
            <Route path="merchant/collaboration" element={<Navigate to="/merchant/kol-hub" replace />} />
            <Route path="shop/collaboration" element={<Navigate to="/merchant/kol-hub" replace />} />
            <Route path="shop" element={<Navigate to="/merchant/dashboard" replace />} />
            <Route path="shop/dashboard" element={<Navigate to="/merchant/dashboard" replace />} />
            <Route path="merchant/analytics" element={<RealtimeAnalyticsPage />} />
            <Route path="merchant/stats" element={<RealtimeAnalyticsPage />} />
            <Route path="merchant/leaderboard" element={<LeaderboardPage />} />
          </Route>

          <Route element={<RouteContent />}>
            <Route path="collaborator/dashboard" element={<HomePage />} />
            <Route path="collaborator/wallet" element={<FinanceWalletPage />} />

            {/* Collaborator Consolidated Hubs */}
            <Route path="collaborator/marketing" element={<MarketingToolkitPage />} />
            <Route path="collaborator/live-sessions" element={<CollaboratorLiveSessionsPage />} />
            <Route path="collaborator/collaboration" element={<ShopCollaborationPage />} />
            <Route path="collaborator/profile" element={<CreatorProfilePage />} />

            {/* Collaborator Backward Compatibility Redirects */}
            <Route path="collaborator/links" element={<Navigate to="/collaborator/marketing?tab=links" replace />} />
            <Route path="collaborator/referral-links" element={<Navigate to="/collaborator/marketing?tab=links" replace />} />
            <Route path="kol/referral-links" element={<Navigate to="/collaborator/marketing?tab=links" replace />} />
            <Route path="collaborator/coupons" element={<Navigate to="/collaborator/marketing?tab=coupons" replace />} />
            <Route path="kol/coupons" element={<Navigate to="/collaborator/marketing?tab=coupons" replace />} />
            <Route path="collaborator/media-hub" element={<Navigate to="/collaborator/marketing?tab=media" replace />} />
            <Route path="collaborator/samples" element={<Navigate to="/collaborator/collaboration?tab=samples" replace />} />
            <Route path="collaborator/sample-requests" element={<Navigate to="/collaborator/collaboration?tab=samples" replace />} />
            <Route path="collaborator/campaigns" element={<Navigate to="/collaborator/collaboration?tab=invites" replace />} />
            <Route path="collaborator/messages" element={<Navigate to="/collaborator/collaboration?tab=messages" replace />} />
            <Route path="collaborator/kyc" element={<Navigate to="/collaborator/profile?tab=kyc" replace />} />
            <Route path="collaborator/social-channels" element={<Navigate to="/collaborator/profile?tab=social" replace />} />
            <Route path="collaborator/tiers" element={<Navigate to="/collaborator/profile?tab=tiers" replace />} />
            <Route path="collaborator/bonus-progress" element={<Navigate to="/collaborator/profile?tab=tiers" replace />} />
            <Route path="kol/bonus-progress" element={<Navigate to="/collaborator/profile?tab=tiers" replace />} />
            <Route path="collaborator/analytics" element={<RealtimeAnalyticsPage />} />
            <Route path="collaborator/leaderboard" element={<LeaderboardPage />} />
            <Route path="collaborator/stats" element={<RealtimeAnalyticsPage />} />
          </Route>

          <Route element={<RouteContent />}>
            <Route path="admin/analytics" element={<AdminAnalyticsHubPage />} />
            <Route path="admin/affiliate-oversight" element={<AdminOversightHubPage />} />
            <Route path="admin/users" element={<KycApprovalPage />} />
            <Route path="admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="admin/audit" element={<AuditLogsPage />} />
            <Route path="admin/fraud-sentinel" element={<AiFraudSentinelPage />} />
            <Route path="admin/leaderboard" element={<Navigate to="/admin/analytics?tab=leaderboard" replace />} />
            <Route path="admin/kol-recommendations" element={<Navigate to="/admin/analytics?tab=ai-matching" replace />} />
            <Route path="admin/disputes" element={<DisputeResolutionPage />} />
            <Route path="admin/return-disputes" element={<AdminReturnDisputesPage />} />
            <Route path="admin/returns/:id" element={<ReturnDetailPage mode="admin" />} />
            <Route path="admin/arbitration" element={<DisputeResolutionPage />} />
            <Route path="admin/sample-requests" element={<AdminSampleRequestsPage />} />
            <Route path="admin/product-moderation" element={<ProductModerationPage />} />
            <Route path="admin/referral-links" element={<Navigate to="/admin/affiliate-oversight?tab=links" replace />} />
            <Route path="admin/coupons" element={<Navigate to="/admin/affiliate-oversight?tab=coupons" replace />} />
          </Route>

          <Route path="analytics" element={<RealtimeAnalyticsPage />} />
          <Route path="chat" element={<ChatBoxPage />} />
          <Route path="collaborator/messages" element={<Navigate to="/collaborator/collaboration?tab=messages" replace />} />
          <Route path="merchant/messages" element={<Navigate to="/merchant/kol-hub?tab=messages" replace />} />
        </Route>
            </Routes>
          </Suspense>
          </ErrorBoundary>
          <CartDrawer />
          <GlobalCheckoutModal />
          <ScanmsFloatingChatWidget />
        </ScanmsChatProvider>
      </CartProvider>
    </Router>
  );
}

export default AppRoutes;
