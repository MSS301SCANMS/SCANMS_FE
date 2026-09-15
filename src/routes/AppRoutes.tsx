import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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


const CommissionRulesPage = lazy(() => import('../pages/merchant/CommissionRulesPage'));
const StoreReferralLinksPage = lazy(() => import('../pages/merchant/StoreReferralLinksPage'));
const StoreCollaboratorsPage = lazy(() => import('../pages/merchant/StoreCollaboratorsPage'));
const AdminReferralLinksPage = lazy(() => import('../pages/admin/AdminReferralLinksPage'));
const KolBonusProgressPage = lazy(() => import('../pages/collaborator/KolBonusProgressPage'));
const ReferralLinksPage = lazy(() => import('../pages/collaborator/ReferralLinksPage'));
const KolCouponsPage = lazy(() => import('../pages/collaborator/KolCouponsPage'));
const ShopCouponsPage = lazy(() => import('../pages/merchant/ShopCouponsPage'));


const ProductManagementPage = lazy(() => import('../pages/merchant/ProductManagementPage'));
const ShopDashboardPage = lazy(() => import('../pages/merchant/ShopDashboardPage'));
const ShopSettingsPage = lazy(() => import('../pages/merchant/ShopSettingsPage'));
const KycApprovalPage = lazy(() => import('../pages/merchant/KycApprovalPage'));
const OrdersManagementPage = lazy(() => import('../pages/merchant/OrdersManagementPage'));
const PayoutApprovalPage = lazy(() => import('../pages/merchant/PayoutApprovalPage'));


const KolTierStatusPage = lazy(() => import('../pages/collaborator/KolTierStatusPage'));
const SocialChannelsPage = lazy(() => import('../pages/collaborator/SocialChannelsPage'));
const KycSubmissionPage = lazy(() => import('../pages/collaborator/KycSubmissionPage'));
const WalletPage = lazy(() => import('../pages/collaborator/WalletPage'));
const MediaHubBrowserPage = lazy(() => import('../pages/collaborator/MediaHubBrowserPage'));
const SamplesPage = lazy(() => import('../pages/collaborator/SamplesPage'));


const OrderTrackingPage = lazy(() => import('../pages/public/OrderTrackingPage'));

const ChatBoxPage = lazy(() => import('../pages/chat/ChatBoxPage'));


const SampleRequestsPage = lazy(() => import('../pages/collaborator/SampleRequestsPage'));
const ShopSampleRequestsPage = lazy(() => import('../pages/merchant/ShopSampleRequestsPage'));


const ShopCampaignsPage = lazy(() => import('../pages/merchant/ShopCampaignsPage'));
const KolCampaignsPage = lazy(() => import('../pages/collaborator/KolCampaignsPage'));


const RealtimeAnalyticsPage = lazy(() => import('../pages/dashboard/RealtimeAnalyticsPage'));

// Leaderboard Top 10 Creators (Quý - FR-29)
const LeaderboardPage = lazy(() => import('../pages/dashboard/LeaderboardPage'));

// AI KOL Smart Recommendation & Matching Engine (Quý - FR-30)
const KolRecommendationPage = lazy(() => import('../pages/merchant/KolRecommendationPage'));

// Admin Pages (FR-12)
const AdminCouponsPage = lazy(() => import('../pages/admin/AdminCouponsPage'));
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
            <Route path="merchant/commission-rules" element={<CommissionRulesPage />} />
            <Route path="stores/:storeId/commission-rules" element={<CommissionRulesPage />} />
            <Route path="merchant/referral-links" element={<StoreReferralLinksPage />} />
            <Route path="merchant/coupons" element={<ShopCouponsPage />} />
            <Route path="stores/:storeId/coupons" element={<ShopCouponsPage />} />
            <Route path="merchant/collaborators" element={<StoreCollaboratorsPage />} />
            <Route path="stores/:storeId/referral-links" element={<StoreReferralLinksPage />} />
            <Route path="merchant/sample-requests" element={<ShopSampleRequestsPage />} />
            <Route path="merchant/campaigns" element={<ShopCampaignsPage />} />
            <Route path="merchant/kol-recommendations" element={<KolRecommendationPage />} />
            <Route path="merchant/analytics" element={<RealtimeAnalyticsPage />} />
            <Route path="merchant/stats" element={<RealtimeAnalyticsPage />} />
            <Route path="merchant/leaderboard" element={<LeaderboardPage />} />
          </Route>


          <Route element={<RouteContent />}>
            <Route path="collaborator/dashboard" element={<HomePage />} />
            <Route path="collaborator/analytics" element={<RealtimeAnalyticsPage />} />
            <Route path="collaborator/leaderboard" element={<LeaderboardPage />} />
            <Route path="collaborator/links" element={<ReferralLinksPage />} />
            <Route path="collaborator/referral-links" element={<ReferralLinksPage />} />
            <Route path="kol/referral-links" element={<ReferralLinksPage />} />
            <Route path="collaborator/coupons" element={<KolCouponsPage />} />
            <Route path="kol/coupons" element={<KolCouponsPage />} />
            <Route path="collaborator/bonus-progress" element={<KolBonusProgressPage />} />
            <Route path="kol/bonus-progress" element={<KolBonusProgressPage />} />
            <Route path="collaborator/social-channels" element={<SocialChannelsPage />} />
            <Route path="collaborator/media-hub" element={<MediaHubBrowserPage />} />
            <Route path="collaborator/samples" element={<SamplesPage />} />
            <Route path="collaborator/tiers" element={<KolTierStatusPage />} />
            <Route path="collaborator/kyc" element={<KycSubmissionPage />} />
            <Route path="collaborator/wallet" element={<WalletPage />} />
            <Route path="collaborator/sample-requests" element={<SampleRequestsPage />} />
            <Route path="collaborator/campaigns" element={<KolCampaignsPage />} />
            <Route path="collaborator/stats" element={<RealtimeAnalyticsPage />} />
          </Route>


          <Route element={<RouteContent />}>
            <Route path="admin/analytics" element={<RealtimeAnalyticsPage />} />
            <Route path="admin/leaderboard" element={<LeaderboardPage />} />
            <Route path="admin/kol-recommendations" element={<KolRecommendationPage />} />
            <Route path="admin/users" element={<KycApprovalPage />} />
            <Route path="admin/referral-links" element={<AdminReferralLinksPage />} />
            <Route path="admin/coupons" element={<AdminCouponsPage />} />
          </Route>


          <Route path="analytics" element={<RealtimeAnalyticsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="chat" element={<ChatBoxPage />} />
          <Route path="collaborator/messages" element={<ChatBoxPage />} />
          <Route path="merchant/messages" element={<ChatBoxPage />} />
        </Route>
      </Routes>
      </Suspense>
    </Router>
  );
}

export default AppRoutes;
