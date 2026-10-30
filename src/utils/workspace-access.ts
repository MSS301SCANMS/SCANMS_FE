import type { UserProfile } from '../services/auth.service';
import { isMarketplaceLanding, safeLoginReturn } from './login-return';

export type WorkspaceKey = 'customer' | 'kol' | 'shop' | 'admin';

function roleNames(user: UserProfile | null | undefined) {
  const roles = (user?.roles || []).map((role: any) => typeof role === 'string' ? role : role?.name);
  return new Set([user?.role, ...roles]);
}

export function isAdministrativeUser(user: UserProfile | null | undefined) {
  const roles = roleNames(user);
  return ['ADMIN', 'MANAGER', 'SYSTEM_ADMIN', 'SYSTEM_MANAGER'].some(role => roles.has(role));
}

export function isManagerUser(user: UserProfile | null | undefined) {
  const roles = roleNames(user);
  return !roles.has('ADMIN') && !roles.has('SYSTEM_ADMIN') && (roles.has('MANAGER') || roles.has('SYSTEM_MANAGER'));
}

export function workspaceKeys(user: UserProfile | null | undefined): WorkspaceKey[] {
  if (!user) return [];
  if (isAdministrativeUser(user)) return ['admin'];
  const roles = roleNames(user);
  const keys: WorkspaceKey[] = ['customer'];
  const profile = user.collaboratorProfile;
  const approvedKol = profile && ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(
    String(profile.approvalStatus || profile.kycStatus).toUpperCase(),
  );
  const ownedStore = user.stores?.some(store => store.isActive || store.isVerified
    || ['APPROVED', 'VERIFIED', 'PENDING_APPROVAL', 'ACTIVE'].includes(
      String(store.onboardingStatus || store.status).toUpperCase(),
    ));
  if (roles.has('COLLABORATOR') || roles.has('KOL_CTV') || approvedKol) keys.push('kol');
  if (roles.has('SHOP_OWNER') || roles.has('SHOP_MANAGER') || ownedStore) keys.push('shop');
  return keys;
}

export function workspaceHome(workspace: WorkspaceKey, user?: UserProfile | null) {
  if (workspace === 'admin') return isManagerUser(user) ? '/admin/ops-dashboard' : '/admin/dashboard';
  if (workspace === 'shop') return '/merchant/dashboard';
  if (workspace === 'kol') return '/collaborator/dashboard';
  return '/marketplace';
}

export function defaultWorkspace(user: UserProfile | null | undefined): WorkspaceKey {
  const keys = workspaceKeys(user);
  return keys.includes('admin') ? 'admin' : keys.includes('shop') ? 'shop' : keys.includes('kol') ? 'kol' : 'customer';
}

export function routeWorkspace(path: string): WorkspaceKey | null {
  if (/^\/admin(?:\/|$)/.test(path)) return 'admin';
  if (/^\/merchant(?:\/|$)|^\/shop\/(?:dashboard|wallet)(?:\/|$)|^\/stores\/[^/]+\/payouts(?:\/|$)/.test(path)) return 'shop';
  if (/^\/collaborator(?:\/|$)/.test(path)) return 'kol';
  if (/^\/customer(?:\/|$)/.test(path)) return 'customer';
  return null;
}

export function isShoppingRoute(path: string) {
  return !routeWorkspace(path) && /^\/(?:$|marketplace(?:\/|$)|search(?:\/|$)|shops?(?:\/|$)|stores?(?:\/|$)|storefront(?:\/|$)|tracking(?:\/|$)|order-tracking(?:\/|$))/.test(path);
}

export function canUseWorkspaceRoute(user: UserProfile | null | undefined, path: string) {
  const workspace = routeWorkspace(path);
  if (workspace && !workspaceKeys(user).includes(workspace)) return false;
  if (isManagerUser(user) && /^\/admin\/(?:dashboard|system-wallet|system-health)(?:\/|$)/.test(path)) return false;
  return !(isShoppingRoute(path) && isAdministrativeUser(user));
}

export function loginDestination(user: UserProfile | null | undefined, requested?: string | null) {
  const fallback = defaultWorkspace(user);
  const safe = safeLoginReturn(requested);
  const pathname = safe ? new URL(safe, 'https://scanms.invalid').pathname : null;
  // Login từ header sàn (redirect=/marketplace) không được nuốt home shop/KOL/admin.
  if (
    !safe ||
    !pathname ||
    !canUseWorkspaceRoute(user, pathname) ||
    (fallback !== 'customer' && isMarketplaceLanding(safe))
  ) {
    return { path: workspaceHome(fallback, user), workspace: fallback };
  }
  const workspace = routeWorkspace(pathname) || (isShoppingRoute(pathname) ? 'customer' : fallback);
  return { path: safe, workspace };
}
