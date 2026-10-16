import type { RoleName, UserResponse } from '../types/backend.generated';

export type Workspace = 'customer' | 'shop' | 'kol' | 'admin';
export type DisplayRole = 'CUSTOMER' | 'SHOP_MANAGER' | 'COLLABORATOR' | 'SYSTEM_MANAGER' | 'SYSTEM_ADMIN';
export function displayRole(roles: RoleName[]): DisplayRole {
  if (roles.includes('ADMIN')) return 'SYSTEM_ADMIN';
  if (roles.includes('MANAGER')) return 'SYSTEM_MANAGER';
  if (roles.includes('SHOP_OWNER')) return 'SHOP_MANAGER';
  if (roles.includes('KOL_CTV')) return 'COLLABORATOR';
  return 'CUSTOMER';
}
export function availableWorkspaces(roles: RoleName[]): Workspace[] {
  const result: Workspace[] = ['customer'];
  if (roles.includes('KOL_CTV') || roles.includes('ADMIN')) result.push('kol');
  if (roles.includes('SHOP_OWNER') || roles.includes('ADMIN')) result.push('shop');
  if (roles.includes('MANAGER') || roles.includes('ADMIN')) result.push('admin');
  return result;
}
export function normalizeIdentity(user: UserResponse) {
  if (!user.userId || !user.identitySubject || !Array.isArray(user.roles)) {
    throw new Error('Hồ sơ người dùng chưa đồng bộ với hệ thống.');
  }
  return { ...user, userId: user.userId, identitySubject: user.identitySubject, id: user.userId, email: user.email || '', fullName: user.fullName || '',
    roles: user.roles, role: displayRole(user.roles) };
}
