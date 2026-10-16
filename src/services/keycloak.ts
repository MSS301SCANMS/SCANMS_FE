const issuer = (import.meta.env.VITE_KEYCLOAK_ISSUER || 'http://localhost:8180/realms/scanms').replace(/\/$/, '');
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'scanms-frontend';
const redirectUri = () => `${window.location.origin}/auth/callback`;
const pendingKey = 'scanms-oidc-pending';

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randomToken() { return base64Url(crypto.getRandomValues(new Uint8Array(32))); }
export async function startKeycloakLogin(mode: 'login' | 'register' = 'login', returnTo = '/portal'): Promise<void> {
  const verifier = randomToken();
  const state = randomToken();
  const challenge = base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  sessionStorage.setItem(pendingKey, JSON.stringify({ verifier, state, returnTo: safeReturnTo(returnTo), createdAt: Date.now() }));
  const query = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri(),
    response_type: 'code', scope: 'openid profile email', state, code_challenge: challenge,
    code_challenge_method: 'S256' });
  window.location.assign(`${issuer}/protocol/openid-connect/${mode === 'register' ? 'registrations' : 'auth'}?${query}`);
}
export function safeReturnTo(value: string): string {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
    && !value.startsWith('/auth/') && value !== '/login' && value !== '/register' ? value : '/portal';
}
export async function finishKeycloakLogin(query: URLSearchParams): Promise<string> {
  const raw = sessionStorage.getItem(pendingKey);
  sessionStorage.removeItem(pendingKey);
  if (!raw) throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  const pending = JSON.parse(raw) as { state: string; verifier: string; returnTo: string; createdAt: number };
  if (pending.state !== query.get('state') || Date.now() - pending.createdAt > 600000) {
    throw new Error('Phiên đăng nhập hết hạn hoặc không khớp. Vui lòng thử lại.');
  }
  if (query.has('error')) throw new Error('Đăng nhập đã bị hủy hoặc từ chối.');
  const code = query.get('code');
  if (!code) throw new Error('Không nhận được mã xác thực.');
  window.history.replaceState(null, '', '/auth/callback');
  const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', client_id: clientId,
      redirect_uri: redirectUri(), code, code_verifier: pending.verifier }),
  });
  if (!response.ok) throw new Error('Không hoàn tất được đăng nhập. Kiểm tra cấu hình tài khoản hoặc thử lại.');
  const tokens = await response.json();
  if (typeof tokens.access_token !== 'string') throw new Error('Máy chủ xác thực chưa trả access token.');
  sessionStorage.setItem('scanms-access-token', tokens.access_token);
  sessionStorage.removeItem('scanms-user');
  apiCacheCleanup();
  if (typeof tokens.id_token === 'string') sessionStorage.setItem('scanms-id-token', tokens.id_token);
  // Access token stays in this tab; expired sessions sign in again via Keycloak SSO.
  localStorage.removeItem('token');
  return safeReturnTo(pending.returnTo);
}
function apiCacheCleanup() {
  // Remove the previous account's persisted UI identity before /users/me.
  for (const key of ['token', 'user', 'current_store_id', 'scanms-active-workspace', 'scanms-current-role']) localStorage.removeItem(key);
}
export function endKeycloakSession() {
  const idToken = sessionStorage.getItem('scanms-id-token');
  sessionStorage.removeItem('scanms-access-token');
  sessionStorage.removeItem('scanms-id-token');
  sessionStorage.removeItem(pendingKey);
  const query = new URLSearchParams({ client_id: clientId, post_logout_redirect_uri: `${window.location.origin}/login` });
  if (idToken) query.set('id_token_hint', idToken);
  window.location.assign(`${issuer}/protocol/openid-connect/logout?${query}`);
}
