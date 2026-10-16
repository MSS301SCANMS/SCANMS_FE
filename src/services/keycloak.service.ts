// Compatibility entry points used by older screens. All OIDC flows share the
// same public client, PKCE state and tab-local session as the active routes.
import { authService, type UserProfile } from './auth.service';
import { finishKeycloakLogin as finishLogin, startKeycloakLogin as startLogin } from './keycloak';

export async function startKeycloakLogin(returnTo = '/customer/wallet'): Promise<void> {
  return startLogin('login', returnTo);
}

export async function keycloakProfile(token: string): Promise<UserProfile> {
  sessionStorage.setItem('scanms-access-token', token);
  return authService.getMe();
}

export async function finishKeycloakLogin(): Promise<string> {
  const returnTo = await finishLogin(new URLSearchParams(window.location.search));
  await authService.getMe();
  return returnTo;
}
