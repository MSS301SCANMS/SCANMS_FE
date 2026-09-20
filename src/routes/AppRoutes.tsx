import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import MainLayout from '../components/layout/MainLayout';
const DashboardDispatcher = lazy(() => import('../pages/DashboardDispatcher'));
const HomePage = lazy(() => import('../pages/HomePage'));

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));

const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const RedirectHandlerPage = lazy(() => import('../pages/RedirectHandlerPage'));

const UiReferencePage = lazy(() => import('../pages/UiReferencePage'));
const MarketplacePage = lazy(() => import('../pages/public/MarketplacePage'));

const ProductManagementPage = lazy(() => import('../pages/merchant/ProductManagementPage'));
const ShopDashboardPage = lazy(() => import('../pages/merchant/ShopDashboardPage'));
const ShopSettingsPage = lazy(() => import('../pages/merchant/ShopSettingsPage'));
const KycApprovalPage = lazy(() => import('../pages/merchant/KycApprovalPage'));
const OrdersManagementPage = lazy(() => import('../pages/merchant/OrdersManagementPage'));
const PayoutApprovalPage = lazy(() => import('../pages/merchant/PayoutApprovalPage'));

const WalletPage = lazy(() => import('../pages/collaborator/WalletPage'));
const OrderTrackingPage = lazy(() => import('../pages/public/OrderTrackingPage'));
const ChatBoxPage = lazy(() => import('../pages/chat/ChatBoxPage'));
const RealtimeAnalyticsPage = lazy(() => import('../pages/dashboard/RealtimeAnalyticsPage'));
const LeaderboardPage = lazy(() => import('../pages/dashboard/LeaderboardPage'));

// Consolidated Hub Pages (Tối ưu trải nghiệm gộp Menu)
const ShopCollaborationPage = lazy(() => import('../pages/collaborator/ShopCollaborationPage'));
const MarketingToolkitPage = lazy(() => import('../pages/collaborator/MarketingToolkitPage'));
const CreatorProfilePage = lazy(() => import('../pages/collaborator/CreatorProfilePage'));
const ShopKolHubPage = lazy(() => import('../pages/merchant/ShopKolHubPage'));
const ShopPromotionsHubPage = lazy(() => import('../pages/merchant/ShopPromotionsHubPage'));
const AdminOversightHubPage = lazy(() => import('../pages/admin/AdminOversightHubPage'));
const AdminAnalyticsHubPage = lazy(() => import('../pages/admin/AdminAnalyticsHubPage'));

// AI Anti-Fraud Sentinel & Traffic Defense (Quý - FR-31)
const AiFraudSentinelPage = lazy(() => import('../pages/merchant/AiFraudSentinelPage'));

// Audit Logs & Security Trail (Quý - FR-32)
const AuditLogsPage = lazy(() => import('../pages/admin/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));

import { RouteContent } from './RouteContent';

function AppRoutes() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] grid place-items-center text-[#7D715E]">Đang tải SCANMS...</div>}>
      <Routes>
        <Route path="/" element={<MarketplacePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/store" element={<MarketplacePage />} />
        <Route path="/storefront" element={<MarketplacePage />} />
        <Route path="/shop" element={<MarketplacePage />} />

        <Route path="/prototype" element={<UiReferencePage />} />
        <Route path="/ui-reference" element={<UiReferencePage />} />
        <Route path="/app" element={<UiReferencePage />} />
        <Route path="/app/:screenId" element={<UiReferencePage />} />

        <Route path="/tracking" element={<OrderTrackingPage />} />
        <Route path="/order-tracking" element={<OrderTrackingPage />} />

        <Route path="/login" element={<LoginPage />} />
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
            <Route path="merchant/payouts" element={<PayoutApprovalPage />} />
            <Route path="stores/:storeId/payouts" element={<PayoutApprovalPage />} />
            <Route path="merchant/settings" element={<ShopSettingsPage />} />
            <Route path="merchant/kyc-approval" element={<KycApprovalPage />} />

            {/* Merchant Consolidated Hubs */}
            <Route path="merchant/kol-hub" element={<ShopKolHubPage />} />
            <Route path="merchant/promotions" element={<ShopPromotionsHubPage />} />
            <Route path="merchant/fraud-sentinel" element={<AiFraudSentinelPage />} />
            <Route path="merchant/ai-fraud" element={<AiFraudSentinelPage />} />
            <Route path="merchant/audit-logs" element={<AuditLogsPage />} />

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
            <Route path="collaborator/wallet" element={<WalletPage />} />

            {/* Collaborator Consolidated Hubs */}
            <Route path="collaborator/marketing" element={<MarketingToolkitPage />} />
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
            <Route path="admin/referral-links" element={<Navigate to="/admin/affiliate-oversight?tab=links" replace />} />
            <Route path="admin/coupons" element={<Navigate to="/admin/affiliate-oversight?tab=coupons" replace />} />
          </Route>

          <Route path="analytics" element={<RealtimeAnalyticsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="chat" element={<ChatBoxPage />} />
          <Route path="collaborator/messages" element={<Navigate to="/collaborator/collaboration?tab=messages" replace />} />
          <Route path="merchant/messages" element={<Navigate to="/merchant/kol-hub?tab=messages" replace />} />
        </Route>
      </Routes>
      </Suspense>
    </Router>
  );
}

export default AppRoutes;
