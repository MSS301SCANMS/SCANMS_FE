const DEFAULT_REDIRECT = '/marketplace';

export function hasAuthenticatedSession() {
  return Boolean(localStorage.getItem('token'));
}

export function buildLoginUrl(returnTo?: string) {
  const target = returnTo || `${window.location.pathname}${window.location.search}`;
  return `/login?redirect=${encodeURIComponent(target)}`;
}

export function getSafeRedirect(value: string | null) {
  if (!value) return null;
  const decoded = value.trim();
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
  if (decoded.startsWith('/login') || decoded.startsWith('/register')) return DEFAULT_REDIRECT;
  return decoded;
}

