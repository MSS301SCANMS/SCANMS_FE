import type { UserProfile } from '../../../services/auth.service';

export type WorkspaceNavRole =
  | 'CUSTOMER'
  | 'SHOP_MANAGER'
  | 'COLLABORATOR'
  | 'SYSTEM_ADMIN'
  | 'SYSTEM_MANAGER';

export type WorkspaceKey = 'customer' | 'kol' | 'shop' | 'admin';

export function workspaceKeyFromRole(role: WorkspaceNavRole): WorkspaceKey {
  if (role === 'SHOP_MANAGER') return 'shop';
  if (role === 'COLLABORATOR') return 'kol';
  if (role === 'SYSTEM_ADMIN' || role === 'SYSTEM_MANAGER') return 'admin';
  return 'customer';
}

function adminRoleFromUser(currentUser: UserProfile | null): 'SYSTEM_ADMIN' | 'SYSTEM_MANAGER' {
  return currentUser?.role === 'SYSTEM_MANAGER' ? 'SYSTEM_MANAGER' : 'SYSTEM_ADMIN';
}

/**
 * Role hiển thị trên Topbar/Sidebar: ưu tiên path hiện tại,
 * rồi workspace đã lưu, rồi role gốc của tài khoản.
 * Tránh kẹt nhãn "Khách mua sắm" khi đang ở /merchant, /collaborator, /admin.
 */
export function resolveWorkspaceRole(
  currentPath: string,
  activeWs: string | null | undefined,
  currentUser: UserProfile | null,
): WorkspaceNavRole {
  if (currentPath.startsWith('/customer')) return 'CUSTOMER';
  if (currentPath.startsWith('/merchant') || currentPath.startsWith('/shop')) return 'SHOP_MANAGER';
  if (currentPath.startsWith('/collaborator')) return 'COLLABORATOR';
  if (currentPath.startsWith('/admin')) return adminRoleFromUser(currentUser);

  if (activeWs === 'shop') return 'SHOP_MANAGER';
  if (activeWs === 'kol') return 'COLLABORATOR';
  if (activeWs === 'customer') return 'CUSTOMER';
  if (activeWs === 'admin') return adminRoleFromUser(currentUser);

  const fallback = currentUser?.role;
  if (
    fallback === 'CUSTOMER' ||
    fallback === 'SHOP_MANAGER' ||
    fallback === 'COLLABORATOR' ||
    fallback === 'SYSTEM_ADMIN' ||
    fallback === 'SYSTEM_MANAGER'
  ) {
    return fallback;
  }
  return 'CUSTOMER';
}
