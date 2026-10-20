import { authService } from '@/services/auth.service';

/** Mua sắm chỉ dành cho khách (guest hoặc workspace customer). */
export function canAccessShopping(): boolean {
  const user = authService.getCurrentUser();
  const token = localStorage.getItem('token');
  if (!user || !token) return true; // guest
  return authService.getActiveWorkspace() === 'customer';
}

export function shoppingHomeForRole(): string {
  const ws = authService.getActiveWorkspace();
  if (ws === 'shop') return '/merchant/dashboard';
  if (ws === 'kol') return '/collaborator/dashboard';
  if (ws === 'admin') return '/admin/users';
  return '/marketplace';
}
