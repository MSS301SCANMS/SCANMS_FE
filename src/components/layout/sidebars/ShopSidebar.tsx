import { useLocation } from 'react-router-dom';
import { NAVIGATION_BY_ROLE } from '../../../config/navigation.config';
import type { UserProfile } from '../../../services/auth.service';
import { SidebarShell } from './SidebarShell';
import { SIDEBAR_THEMES } from './sidebarTheme';
import { useSidebarBadges } from './useSidebarBadges';

export function ShopSidebar({
  currentUser,
  onLogout,
}: {
  currentUser: UserProfile | null;
  onLogout: () => void;
}) {
  const location = useLocation();
  const { getItemBadge } = useSidebarBadges('SHOP_MANAGER', currentUser?.id, location.pathname);
  return (
    <SidebarShell
      role="SHOP_MANAGER"
      theme={SIDEBAR_THEMES.SHOP_MANAGER}
      navConfig={NAVIGATION_BY_ROLE.SHOP_MANAGER}
      currentUser={currentUser}
      onLogout={onLogout}
      displayName={
        currentUser?.stores?.[0]?.name || currentUser?.fullName || 'Gian Hàng Của Bạn'
      }
      editProfilePath="/merchant/settings"
      editProfileLabel="Cài Đặt Gian Hàng"
      getItemBadge={getItemBadge}
    />
  );
}
