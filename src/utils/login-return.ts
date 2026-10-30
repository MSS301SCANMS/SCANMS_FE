export function safeLoginReturn(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//') || /[\\\r\n\t]/.test(path)) return null;
  try {
    const base = 'https://scanms.invalid';
    const url = new URL(path, base);
    if (url.origin !== base || /^\/(?:login|register)(?:\/|$)/.test(url.pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return null; }
}

/** Trang sàn chung — không dùng làm returnTo cho shop/KOL/admin sau login. */
export function isMarketplaceLanding(path: string | null | undefined): boolean {
  if (!path) return false;
  try {
    const pathname = new URL(path, 'https://scanms.invalid').pathname.replace(/\/+$/, '') || '/';
    return (
      pathname === '/' ||
      pathname === '/marketplace' ||
      pathname === '/store' ||
      pathname === '/storefront' ||
      pathname === '/search' ||
      pathname === '/marketplace/search'
    );
  } catch {
    return false;
  }
}

export function homePathForUserRole(
  role: string | undefined,
  workspaces: string[] = [],
): string {
  if (role === 'SHOP_MANAGER' || role === 'SHOP_OWNER' || workspaces.includes('shop')) {
    return '/merchant/dashboard';
  }
  if (role === 'SYSTEM_MANAGER') return '/admin/ops-dashboard';
  if (role === 'SYSTEM_ADMIN') return '/admin/dashboard';
  if (role === 'COLLABORATOR' || workspaces.includes('kol')) {
    return '/collaborator/dashboard';
  }
  return '/marketplace';
}

/** Ưu tiên home theo role khi redirect chỉ là sàn mua sắm (login từ PublicHeader). */
export function resolvePostLoginPath(
  role: string | undefined,
  workspaces: string[],
  returnTo: string | null,
): string {
  const home = homePathForUserRole(role, workspaces);
  const isStaffHome = home !== '/marketplace';
  if (returnTo && !(isStaffHome && isMarketplaceLanding(returnTo))) {
    return returnTo;
  }
  return home;
}

export function productLoginUrl(returnTo: string): string {
  const safePath = safeLoginReturn(returnTo);
  const params = new URLSearchParams({ role: 'customer' });
  if (safePath) params.set('redirect', safePath);
  return `/login?${params}`;
}
