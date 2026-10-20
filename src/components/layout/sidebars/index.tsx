import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { authService, type UserProfile } from '../../../services/auth.service';
import { prewarmCoreRoutes } from '../../../utils/route-preloader.utils';
import { AdminSidebar } from './AdminSidebar';
import { CollaboratorSidebar } from './CollaboratorSidebar';
import { CustomerSidebar } from './CustomerSidebar';
import { ManagerSidebar } from './ManagerSidebar';
import { resolveWorkspaceRole } from './resolveWorkspaceRole';
import { ShopSidebar } from './ShopSidebar';

export interface SidebarProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

/** Router chọn sidebar riêng theo workspace/role. */
export function Sidebar({ currentUser, onLogout }: SidebarProps) {
  const location = useLocation();
  const [activeWs, setActiveWs] = useState(() => authService.getActiveWorkspace());

  useEffect(() => {
    const handleWsChange = () => setActiveWs(authService.getActiveWorkspace());
    window.addEventListener('scanms_workspace_changed', handleWsChange);
    window.addEventListener('storage', handleWsChange);
    return () => {
      window.removeEventListener('scanms_workspace_changed', handleWsChange);
      window.removeEventListener('storage', handleWsChange);
    };
  }, []);

  const role = resolveWorkspaceRole(location.pathname, activeWs, currentUser);

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
