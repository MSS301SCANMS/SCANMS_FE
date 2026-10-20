import type { UserProfile } from '../../../services/auth.service';

export type WorkspaceNavRole =
  | 'CUSTOMER'
  | 'SHOP_MANAGER'
  | 'COLLABORATOR'
  | 'SYSTEM_ADMIN'
  | 'SYSTEM_MANAGER';

export function resolveWorkspaceRole(
  currentPath: string,
  activeWs: string | null | undefined,
  currentUser: UserProfile | null,
): WorkspaceNavRole {
  // Ưu tiên role hệ thống — không để workspace 'kol' cũ làm Manager/Admin hiện sidebar KOL
  if (currentUser?.role === 'SYSTEM_MANAGER') return 'SYSTEM_MANAGER';
  if (currentUser?.role === 'SYSTEM_ADMIN') return 'SYSTEM_ADMIN';

  if (currentPath.startsWith('/customer')) return 'CUSTOMER';
  if (currentPath.startsWith('/merchant') || currentPath.startsWith('/shop')) return 'SHOP_MANAGER';
  if (currentPath.startsWith('/collaborator')) return 'COLLABORATOR';
  if (currentPath.startsWith('/admin')) {
    return currentUser?.role === 'SYSTEM_MANAGER' ? 'SYSTEM_MANAGER' : 'SYSTEM_ADMIN';
  }
  if (activeWs === 'shop') return 'SHOP_MANAGER';
  if (activeWs === 'kol') return 'COLLABORATOR';
  if (activeWs === 'customer') return 'CUSTOMER';
  if (activeWs === 'admin') {
    return currentUser?.role === 'SYSTEM_MANAGER' ? 'SYSTEM_MANAGER' : 'SYSTEM_ADMIN';
  }
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
