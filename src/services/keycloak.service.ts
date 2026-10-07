import axios from 'axios';
import type { UserProfile } from './auth.service';

const issuer = (import.meta.env.VITE_KEYCLOAK_ISSUER || 'http://localhost:8180/realms/scanms').replace(/\/$/, '');
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'scanms-fe';
const redirectUri = `${window.location.origin}/auth/keycloak/callback`;
const gateway = (import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export async function startKeycloakLogin(returnTo = '/customer/wallet') {
  const verifier = b64(crypto.getRandomValues(new Uint8Array(32))); const state = crypto.randomUUID();
  sessionStorage.setItem('scanms-pkce', JSON.stringify({ verifier, state, returnTo: returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\') ? returnTo : '/customer/wallet', createdAt: Date.now() }));
  const challenge = b64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'openid profile email', state, code_challenge: challenge, code_challenge_method: 'S256' });
  window.location.assign(`${issuer}/protocol/openid-connect/auth?${params}`);
}
export async function keycloakProfile(token: string): Promise<UserProfile> {
  const { data } = await axios.get(`${gateway}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  const source = data.result; const roles: string[] = source?.roles || [];
  if (!source?.userId || source.status !== 'ACTIVE') throw new Error('Hồ sơ người dùng chưa được cấp hoặc đang bị khóa. Liên hệ người quản lý tài khoản.');
  const role: UserProfile['role'] = roles.includes('ADMIN') ? 'SYSTEM_ADMIN' : roles.includes('MANAGER') ? 'SYSTEM_MANAGER' : roles.includes('SHOP_OWNER') ? 'SHOP_MANAGER' : roles.includes('KOL_CTV') ? 'COLLABORATOR' : 'CUSTOMER';
  const user: UserProfile = { id: source.userId, email: source.email, fullName: source.fullName, role };
  localStorage.setItem('user', JSON.stringify(user)); return user;
}
export async function finishKeycloakLogin(): Promise<string> {
  const params = new URLSearchParams(window.location.search); const pending = JSON.parse(sessionStorage.getItem('scanms-pkce') || 'null');
  if (params.get('error')) throw new Error('Đăng nhập đã bị hủy hoặc không được chấp nhận.');
  if (!pending || pending.state !== params.get('state') || !params.get('code') || Date.now() - pending.createdAt > 600000) throw new Error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại.');
  sessionStorage.removeItem('scanms-pkce');
  const { data } = await axios.post(`${issuer}/protocol/openid-connect/token`, new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId, redirect_uri: redirectUri, code: params.get('code')!, code_verifier: pending.verifier }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  const user = await keycloakProfile(data.access_token);
  localStorage.setItem('token', data.access_token); localStorage.setItem('scanms-auth-provider', 'keycloak');
  const workspace = user.role === 'SYSTEM_ADMIN' || user.role === 'SYSTEM_MANAGER' ? 'admin' : user.role === 'SHOP_MANAGER' ? 'shop' : user.role === 'COLLABORATOR' ? 'kol' : 'customer';
  localStorage.setItem('scanms-active-workspace', workspace); localStorage.setItem('scanms-current-role', workspace);
  window.dispatchEvent(new CustomEvent('scanms_auth_changed', { detail: { userId: user.id } }));
  return pending.returnTo;
}
