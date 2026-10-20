import { useLocation } from 'react-router-dom';
import { NAVIGATION_BY_ROLE } from '../../../config/navigation.config';
import type { UserProfile } from '../../../services/auth.service';
import { SidebarShell } from './SidebarShell';
import { SIDEBAR_THEMES } from './sidebarTheme';
import { useSidebarBadges } from './useSidebarBadges';

export function AdminSidebar({
  currentUser,
  onLogout,
}: {
  currentUser: UserProfile | null;
  onLogout: () => void;
}) {
  const location = useLocation();
  const { getItemBadge } = useSidebarBadges('SYSTEM_ADMIN', currentUser?.id, location.pathname);
  return (
    <SidebarShell
      role="SYSTEM_ADMIN"
      theme={SIDEBAR_THEMES.SYSTEM_ADMIN}
      navConfig={NAVIGATION_BY_ROLE.SYSTEM_ADMIN}
      currentUser={currentUser}
      onLogout={onLogout}
      displayName={currentUser?.fullName || currentUser?.email || 'System Admin'}
      editProfilePath="/admin/profile"
      editProfileLabel="Hồ sơ cá nhân"
      getItemBadge={getItemBadge}
    />
  );
}
