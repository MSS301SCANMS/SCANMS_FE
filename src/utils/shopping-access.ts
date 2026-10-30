import { authService } from '@/services/auth.service';
import { workspaceHome, workspaceKeys } from './workspace-access';

/** Mua sắm chỉ dành cho khách (guest hoặc workspace customer). */
export function canAccessShopping(): boolean {
  const user = authService.getCurrentUser();
  const token = localStorage.getItem('token');
  if (!user || !token) return true; // guest
  return workspaceKeys(user).includes('customer') && authService.getActiveWorkspace() === 'customer';
}

export function shoppingHomeForRole(): string {
  const ws = authService.getActiveWorkspace();
  return workspaceHome(ws, authService.getCurrentUser());
}
