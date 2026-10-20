export const LOGIN_ROLES = ['customer', 'kol', 'shop', 'manager', 'admin'] as const;
export type LoginRole = typeof LOGIN_ROLES[number];
const LAST_ROLE_KEY = 'scanms-login-last-role';
const identifierKey = (role: LoginRole) => `scanms-login-identifier:${role}`;

export function getRememberedLoginRole(): LoginRole {
  try {
    const role = localStorage.getItem(LAST_ROLE_KEY);
    return LOGIN_ROLES.includes(role as LoginRole) ? role as LoginRole : 'customer';
  } catch { return 'customer'; }
}

export function getRememberedIdentifier(role: LoginRole): string {
  try { return localStorage.getItem(identifierKey(role)) || ''; }
  catch { return ''; }
}

// Passwords are managed by the browser password manager, never by web storage.
export function rememberLoginIdentifier(role: LoginRole, identifier: string, remember: boolean) {
  try {
    if (remember) {
      localStorage.setItem(identifierKey(role), identifier.trim());
      localStorage.setItem(LAST_ROLE_KEY, role);
    } else {
      localStorage.removeItem(identifierKey(role));
      if (localStorage.getItem(LAST_ROLE_KEY) === role) localStorage.removeItem(LAST_ROLE_KEY);
    }
  } catch { /* A blocked storage policy must not prevent login. */ }
}
