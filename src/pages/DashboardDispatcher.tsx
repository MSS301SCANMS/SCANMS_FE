import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import KolDashboardPage from './collaborator/KolDashboardPage';
import ShopDashboardPage from './merchant/ShopDashboardPage';

export default function DashboardDispatcher() {
  const user = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/marketplace" replace />;
  }

  const activeWs = authService.getActiveWorkspace();

  const available = authService.getUserAvailableWorkspaces(user).map((w) => w.key);

  if (activeWs === 'shop' && available.includes('shop')) {
    return <ShopDashboardPage />;
  }

  if (activeWs === 'admin' && available.includes('admin')) {
    return (
      <Navigate
        to={user.role === 'SYSTEM_MANAGER' ? '/admin/ops-dashboard' : '/admin/dashboard'}
        replace
      />
    );
  }

  if (activeWs === 'kol' && available.includes('kol')) {
    return <KolDashboardPage />;
  }

  if (activeWs === 'customer') {
    return <Navigate to="/customer/orders" replace />;
  }

  if (user.role === 'SHOP_MANAGER' && available.includes('shop')) {
    return <ShopDashboardPage />;
  }

  if (user.role === 'SYSTEM_MANAGER') {
    return <Navigate to="/admin/ops-dashboard" replace />;
  }
  if (user.role === 'SYSTEM_ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === 'COLLABORATOR' && available.includes('kol')) {
    return <KolDashboardPage />;
  }

  return <Navigate to="/customer/orders" replace />;
}
