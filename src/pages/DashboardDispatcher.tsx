import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import HomePage from './HomePage';
import ShopDashboardPage from './merchant/ShopDashboardPage';
import KycApprovalPage from './merchant/KycApprovalPage';

export default function DashboardDispatcher() {
  const user = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/store" replace />;
  }

  if (user.role === 'SHOP_MANAGER') {
    return <ShopDashboardPage />;
  }

  if (user.role === 'SYSTEM_ADMIN' || user.role === 'SYSTEM_MANAGER') {
    return <KycApprovalPage />;
  }

  return <HomePage />;
}
