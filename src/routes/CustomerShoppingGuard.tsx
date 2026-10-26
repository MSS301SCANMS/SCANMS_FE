import { Outlet } from 'react-router-dom';
import { canAccessShopping } from '@/utils/shopping-access';
import { authService } from '@/services/auth.service';

/** Cho phép tài khoản vào sàn mua sắm bằng cách tự động kích hoạt workspace khách hàng */
export function CustomerShoppingGuard() {
  if (!canAccessShopping()) {
    authService.setActiveWorkspace('customer');
  }
  return <Outlet />;
}
