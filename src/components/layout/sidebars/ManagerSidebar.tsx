import { useLocation } from 'react-router-dom';
import { NAVIGATION_BY_ROLE } from '../../../config/navigation.config';
import type { UserProfile } from '../../../services/auth.service';
import { SidebarShell } from './SidebarShell';
import { SIDEBAR_THEMES } from './sidebarTheme';
import { useSidebarBadges } from './useSidebarBadges';

export function ManagerSidebar({
  currentUser,
  onLogout,
}: {
  currentUser: UserProfile | null;
  onLogout: () => void;
}) {
  const location = useLocation();
  const { getItemBadge } = useSidebarBadges('SYSTEM_MANAGER', currentUser?.id, location.pathname);
  return (
    <SidebarShell
      role="SYSTEM_MANAGER"
      theme={SIDEBAR_THEMES.SYSTEM_MANAGER}
      navConfig={NAVIGATION_BY_ROLE.SYSTEM_MANAGER}
      currentUser={currentUser}
      onLogout={onLogout}
      displayName={currentUser?.fullName || currentUser?.email || 'System Manager'}
      editProfilePath="/admin/profile"
      editProfileLabel="Hồ sơ cá nhân"
      getItemBadge={getItemBadge}
      showMarketplaceLink={false}
    />
  );
}
