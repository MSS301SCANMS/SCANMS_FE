import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { authService, type UserProfile } from '../services/auth.service';
import {
  resolveWorkspaceRole,
  workspaceKeyFromRole,
  type WorkspaceKey,
  type WorkspaceNavRole,
} from '../components/layout/sidebars/resolveWorkspaceRole';

/**
 * Role UI theo path hiện tại + đồng bộ scanms-active-workspace
 * (shop / kol / admin / customer) để Topbar, Sidebar, switcher khớp nhau.
 */
export function useResolvedWorkspaceRole(currentUser: UserProfile | null) {
  const location = useLocation();
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceKey>(
    () => authService.getActiveWorkspace(),
  );

  useEffect(() => {
    const sync = () => setActiveWorkspace(authService.getActiveWorkspace());
    window.addEventListener('scanms_workspace_changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('scanms_workspace_changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const role: WorkspaceNavRole = resolveWorkspaceRole(
    location.pathname,
    activeWorkspace,
    currentUser,
  );

  useEffect(() => {
    const expected = workspaceKeyFromRole(role);
    if (activeWorkspace === expected) return;
    const available = currentUser
      ? authService.getUserAvailableWorkspaces(currentUser).map((w) => w.key)
      : [];
    if (!available.includes(expected)) return;
    localStorage.setItem('scanms-active-workspace', expected);
    localStorage.setItem('scanms-current-role', expected);
    window.dispatchEvent(
      new CustomEvent('scanms_workspace_changed', { detail: { workspace: expected } }),
    );
  }, [role, activeWorkspace, currentUser]);

  return {
    role,
    activeWorkspace,
    isShop: role === 'SHOP_MANAGER',
    isCustomer: role === 'CUSTOMER',
    isKol: role === 'COLLABORATOR',
    isAdmin: role === 'SYSTEM_ADMIN' || role === 'SYSTEM_MANAGER',
  };
}
