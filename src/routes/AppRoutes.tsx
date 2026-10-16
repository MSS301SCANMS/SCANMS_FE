import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import MainLayout from '../components/layout/MainLayout';
import SessionGate from './SessionGate';
import { authService } from '../services/auth.service';
import type { Area, Section } from '../pages/BackendResourcePage';
import type { RoleName } from '../types/backend.generated';

const IdentityPage = lazy(() => import('../pages/auth/IdentityPage'));
const ResourcePage = lazy(() => import('../pages/BackendResourcePage'));
const CatalogPage = lazy(() => import('../pages/BackendCatalogPage'));
const ProfilePage = lazy(() => import('../pages/BackendProfilePage'));
const PendingPage = lazy(() => import('../pages/PendingFeaturePage'));

function PortalHome() {
  const area = authService.getActiveWorkspace();
  return <Navigate replace to={area === 'shop' ? '/merchant/dashboard' : area === 'kol' ? '/collaborator/dashboard' : area === 'admin' ? '/admin/applications' : '/customer/orders'} />;
}
function PrototypePage() {
  return <div className="h-screen flex flex-col"><p className="p-3 bg-amber-50 text-amber-900 text-sm">Bản thiết kế tham khảo. Các số liệu và thao tác mẫu không đại diện dữ liệu hệ thống.</p><iframe title="SCANMS — thiết kế tham khảo" src="/reference/index.html" sandbox="allow-scripts allow-same-origin" className="flex-1 w-full border-0" /></div>;
}
const resourceRoutes: { paths: string[]; area: Area; section: Section; roles?: RoleName[] }[] = [
  { paths: ['/merchant/dashboard', '/merchant/settings', '/merchant/stores'], area: 'merchant', section: 'stores', roles: ['SHOP_OWNER', 'ADMIN'] },
  { paths: ['/merchant/products'], area: 'merchant', section: 'catalog', roles: ['SHOP_OWNER', 'ADMIN'] },
  { paths: ['/merchant/livestreams'], area: 'merchant', section: 'live', roles: ['SHOP_OWNER', 'ADMIN'] },
  { paths: ['/merchant/vouchers', '/merchant/promotions'], area: 'merchant', section: 'vouchers', roles: ['SHOP_OWNER', 'ADMIN'] },
  { paths: ['/merchant/orders'], area: 'merchant', section: 'orders', roles: ['SHOP_OWNER', 'ADMIN'] },
  { paths: ['/merchant/wallet', '/merchant/payouts', '/stores/:storeId/payouts'], area: 'merchant', section: 'finance', roles: ['SHOP_OWNER', 'ADMIN'] },
  { paths: ['/merchant/affiliate', '/merchant/kol-hub'], area: 'merchant', section: 'affiliate', roles: ['SHOP_OWNER', 'ADMIN'] },
  { paths: ['/collaborator/dashboard', '/collaborator/marketing', '/collaborator/referral-links', '/collaborator/links', '/kol/referral-links'], area: 'collaborator', section: 'affiliate', roles: ['KOL_CTV', 'ADMIN'] },
  { paths: ['/collaborator/wallet'], area: 'collaborator', section: 'finance', roles: ['KOL_CTV', 'ADMIN'] },
  { paths: ['/customer', '/customer/portal', '/customer/orders', '/tracking', '/order-tracking'], area: 'customer', section: 'orders' },
  { paths: ['/customer/wallet'], area: 'customer', section: 'finance' },
  { paths: ['/customer/upgrade', '/customer/upgrade/shop', '/customer/upgrade/kol'], area: 'customer', section: 'applications' },
  { paths: ['/admin/applications'], area: 'admin', section: 'applications', roles: ['ADMIN', 'MANAGER'] },
  { paths: ['/admin/products'], area: 'admin', section: 'catalog', roles: ['ADMIN', 'MANAGER'] },
  { paths: ['/admin/orders', '/admin/disputes', '/admin/arbitration'], area: 'admin', section: 'orders', roles: ['ADMIN', 'MANAGER'] },
  { paths: ['/admin/policies'], area: 'admin', section: 'policies', roles: ['ADMIN'] },
  { paths: ['/admin/wallets'], area: 'admin', section: 'finance', roles: ['ADMIN'] },
  { paths: ['/admin/affiliate-oversight', '/admin/referral-links'], area: 'admin', section: 'affiliate', roles: ['ADMIN', 'MANAGER'] },
  { paths: ['/admin/vouchers', '/admin/coupons'], area: 'admin', section: 'vouchers', roles: ['ADMIN'] },
];
const aliases: Record<string, string> = {
  '/shop': '/merchant/dashboard', '/shop/dashboard': '/merchant/dashboard',
  '/merchant/commission-rules': '/merchant/affiliate?resource=commission-policies',
  '/stores/:storeId/commission-rules': '/merchant/affiliate?resource=commission-policies',
  '/merchant/referral-links': '/merchant/affiliate?resource=referrals',
  '/stores/:storeId/referral-links': '/merchant/affiliate?resource=referrals',
  '/merchant/collaborators': '/merchant/affiliate?resource=collaborators',
  '/merchant/coupons': '/merchant/vouchers', '/stores/:storeId/coupons': '/merchant/vouchers',
};
function PendingRoute() {
  const location = useLocation();
  const title = location.pathname.includes('fraud') || location.pathname.includes('ai-matching') ? 'Giám sát và gợi ý KOL đang được hoàn thiện'
    : location.pathname.includes('chat') || location.pathname.includes('messages') ? 'Tin nhắn đang được hoàn thiện'
    : location.pathname.includes('payos') ? 'Thanh toán đang được hoàn thiện'
    : 'Chức năng đang được hoàn thiện';
  return <PendingPage title={title} />;
}
export default function AppRoutes() {
  return <BrowserRouter><Suspense fallback={<p className="p-8">Đang tải SCANMS…</p>}><Routes>
    {['/', '/marketplace', '/store', '/storefront', '/search', '/marketplace/search', '/shops/:shopId', '/products/:productId'].map(path => <Route key={path} path={path} element={<CatalogPage />} />)}
    <Route path="/login" element={<IdentityPage />} />
    <Route path="/register" element={<IdentityPage mode="register" />} />
    <Route path="/auth/callback" element={<IdentityPage mode="callback" />} />
    <Route path="/prototype" element={<PrototypePage />} />
    <Route path="/ui-reference" element={<Navigate to="/prototype" replace />} />
    <Route path="/app" element={<Navigate to="/portal" replace />} />
    <Route path="/app/:screenId" element={<Navigate to="/portal" replace />} />
    <Route element={<MainLayout />}>
      {['/portal', '/dashboard'].map(path => <Route key={path} path={path} element={<SessionGate><PortalHome /></SessionGate>} />)}
      {resourceRoutes.flatMap(group => group.paths.map(path => <Route key={path} path={path} element={<SessionGate roles={group.roles}><ResourcePage key={path} area={group.area} section={group.section} /></SessionGate>} />))}
      {['/customer/profile', '/collaborator/profile', '/account'].map(path => <Route key={path} path={path} element={<SessionGate><ProfilePage /></SessionGate>} />)}
      {Object.entries(aliases).map(([path, target]) => <Route key={path} path={path} element={<Navigate to={target} replace />} />)}
      <Route path="*" element={<SessionGate><PendingRoute /></SessionGate>} />
    </Route>
  </Routes></Suspense></BrowserRouter>;
}
