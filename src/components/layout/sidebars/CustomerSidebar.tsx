import { useLocation } from 'react-router-dom';
import { NAVIGATION_BY_ROLE } from '../../../config/navigation.config';
import type { UserProfile } from '../../../services/auth.service';
import { SidebarShell } from './SidebarShell';
import { SIDEBAR_THEMES } from './sidebarTheme';
import { useSidebarBadges } from './useSidebarBadges';

export function CustomerSidebar({
  currentUser,
  onLogout,
}: {
  currentUser: UserProfile | null;
  onLogout: () => void;
}) {
  const location = useLocation();
  const { getItemBadge } = useSidebarBadges('CUSTOMER', currentUser?.id, location.pathname);
  return (
    <SidebarShell
      role="CUSTOMER"
      theme={SIDEBAR_THEMES.CUSTOMER}
      navConfig={NAVIGATION_BY_ROLE.CUSTOMER}
      currentUser={currentUser}
      onLogout={onLogout}
      displayName={currentUser?.fullName || currentUser?.email || 'Khách Hàng'}
      editProfilePath="/customer/profile"
      editProfileLabel="Sửa Hồ Sơ"
      getItemBadge={getItemBadge}
      showMarketplaceLink
    />
  );
}
