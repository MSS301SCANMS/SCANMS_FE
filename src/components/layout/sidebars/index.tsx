import { useEffect } from 'react';
import type { UserProfile } from '../../../services/auth.service';
import { prewarmCoreRoutes } from '../../../utils/route-preloader.utils';
import { useResolvedWorkspaceRole } from '../../../hooks/useResolvedWorkspaceRole';
import { AdminSidebar } from './AdminSidebar';
import { CollaboratorSidebar } from './CollaboratorSidebar';
import { CustomerSidebar } from './CustomerSidebar';
import { ManagerSidebar } from './ManagerSidebar';
import { ShopSidebar } from './ShopSidebar';

export interface SidebarProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

/** Router chọn sidebar riêng theo workspace/role. */
export function Sidebar({ currentUser, onLogout }: SidebarProps) {
  const { role } = useResolvedWorkspaceRole(currentUser);

  useEffect(() => prewarmCoreRoutes(role), [role]);

  switch (role) {
    case 'CUSTOMER':
      return <CustomerSidebar currentUser={currentUser} onLogout={onLogout} />;
    case 'SHOP_MANAGER':
      return <ShopSidebar currentUser={currentUser} onLogout={onLogout} />;
    case 'SYSTEM_ADMIN':
      return <AdminSidebar currentUser={currentUser} onLogout={onLogout} />;
    case 'SYSTEM_MANAGER':
      return <ManagerSidebar currentUser={currentUser} onLogout={onLogout} />;
    case 'COLLABORATOR':
    default:
      return <CollaboratorSidebar currentUser={currentUser} onLogout={onLogout} />;
  }
}

export { resolveWorkspaceRole } from './resolveWorkspaceRole';
export { SIDEBAR_THEMES } from './sidebarTheme';
