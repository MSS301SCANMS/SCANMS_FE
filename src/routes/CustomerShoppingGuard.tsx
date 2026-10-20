import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { canAccessShopping, shoppingHomeForRole } from '@/utils/shopping-access';

/** Chặn role shop/kol/admin khỏi sàn mua sắm khi đang ở workspace vận hành. */
export function CustomerShoppingGuard() {
  const location = useLocation();
  if (!canAccessShopping()) {
    return (
      <Navigate
        to={shoppingHomeForRole()}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  return <Outlet />;
}
