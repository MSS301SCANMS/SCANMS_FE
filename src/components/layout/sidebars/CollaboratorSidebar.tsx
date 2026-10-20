import { useLocation } from 'react-router-dom';
import { NAVIGATION_BY_ROLE } from '../../../config/navigation.config';
import type { UserProfile } from '../../../services/auth.service';
import { SidebarShell } from './SidebarShell';
import { SIDEBAR_THEMES } from './sidebarTheme';
import { useSidebarBadges } from './useSidebarBadges';

export function CollaboratorSidebar({
  currentUser,
  onLogout,
}: {
  currentUser: UserProfile | null;
  onLogout: () => void;
}) {
  const location = useLocation();
  const { getItemBadge } = useSidebarBadges('COLLABORATOR', currentUser?.id, location.pathname);
  return (
    <SidebarShell
      role="COLLABORATOR"
      theme={SIDEBAR_THEMES.COLLABORATOR}
      navConfig={NAVIGATION_BY_ROLE.COLLABORATOR}
      currentUser={currentUser}
      onLogout={onLogout}
      displayName={currentUser?.fullName || currentUser?.email || 'Đối Tác Tiếp Thị'}
      editProfilePath="/collaborator/profile"
      editProfileLabel="Sửa Hồ Sơ"
      getItemBadge={getItemBadge}
    />
  );
}
