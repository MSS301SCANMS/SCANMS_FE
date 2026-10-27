import { Navigate, Outlet } from 'react-router-dom';
import { canAccessShopping } from '@/utils/shopping-access';
import { shoppingHomeForRole } from '@/utils/shopping-access';
import { useAuthUser } from '@/hooks/useAuthUser';

/** Shop/KOL chủ động chọn workspace mua sắm; guard không đổi vai trò khi mở URL. */
export function CustomerShoppingGuard() {
  useAuthUser();
  if (!canAccessShopping()) return <Navigate to={shoppingHomeForRole()} replace />;
  return <Outlet />;
}
