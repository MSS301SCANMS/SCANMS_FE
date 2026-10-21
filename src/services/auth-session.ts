import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const sessionKey = 'scanms-session-id';
const refreshKey = 'refresh_token';
const expiryKey = 'scanms-token-expires-at';
const refreshHttp = axios.create({ baseURL: apiUrl, timeout: 15000, withCredentials: true });
let refreshing: Promise<string | null> | null = null;

export function getSessionId(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  // Reading identity must never mutate storage: another tab may be between
  // logout/login writes. Older logins have no refresh token and use their token
  // as a stable identity until the next explicit login.
  return localStorage.getItem(sessionKey) || `legacy:${token}`;
}

function saveTokens(raw: any, rotating = false): string {
  const tokens = raw?.result ?? raw?.data ?? raw;
  const access = tokens?.access_token || tokens?.accessToken;
  if (typeof access !== 'string' || !access) throw new Error('Không nhận được thông tin phiên đăng nhập.');
  const refresh = tokens.refresh_token || tokens.refreshToken;
  if (!rotating) {
    localStorage.setItem(sessionKey, crypto.randomUUID());
    localStorage.removeItem(refreshKey);
  }
  if (typeof refresh === 'string' && refresh) localStorage.setItem(refreshKey, refresh);
  localStorage.setItem('token', access);
  const seconds = Number(tokens.expires_in ?? tokens.expiresIn);
  if (seconds > 0) localStorage.setItem(expiryKey, String(Date.now() + seconds * 1000));
  else localStorage.removeItem(expiryKey);
  return access;
}

export function saveLoginSession(response: unknown): string {
  return saveTokens(response);
}

export function forceRefreshSession(): Promise<string | null> {
  const token = localStorage.getItem('token');
  if (!token) return Promise.resolve(null);
  if (!localStorage.getItem(refreshKey))
    return Promise.reject(new Error('Phiên đăng nhập cũ chưa hỗ trợ cập nhật quyền. Vui lòng đăng xuất rồi đăng nhập lại.'));
  return renewSession(token, true);
}

export function clearSession(expected?: string | null, notify = true) {
  if (expected !== undefined && getSessionId() !== expected) return;
  for (const key of ['token', refreshKey, expiryKey, sessionKey, 'user', 'scanms-current-role', 'scanms-active-workspace', 'current_store_id']) localStorage.removeItem(key);
  if (notify) {
    window.dispatchEvent(new CustomEvent('scanms_auth_changed', { detail: { userId: null } }));
    window.dispatchEvent(new Event('auth-user-updated'));
  }
}

function expiresSoon(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp === 'number') return payload.exp * 1000 <= Date.now() + 30000;
  } catch { /* Legacy/fixture tokens can use the expiry supplied by the login API. */ }
  const expiry = Number(localStorage.getItem(expiryKey));
  return expiry > 0 && expiry <= Date.now() + 30000;
}

export async function renewSession(failedToken?: string | null, force = false): Promise<string | null> {
  const token = localStorage.getItem('token');
  if (!token) return null;
  if (failedToken && token !== failedToken) return token;
  if (!failedToken && !force && !expiresSoon(token)) return token;
  const session = getSessionId();
  if (!localStorage.getItem(refreshKey)) {
    // Existing logins made before refresh-token persistence need one new login.
    clearSession(session);
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
  if (refreshing) return refreshing;
  const refresh = async () => {
    if (getSessionId() !== session) throw new axios.CanceledError('Phiên đăng nhập đã thay đổi.');
    const current = localStorage.getItem('token');
    if (current !== token) return current;
    const refreshToken = localStorage.getItem(refreshKey);
    if (!refreshToken) throw new axios.CanceledError('Phiên đăng nhập đã kết thúc.');
    try {
      // Do not send an expired Authorization header to the public refresh endpoint.
      const response = await refreshHttp.post('/auth/refresh-token', { refreshToken });
      if (getSessionId() !== session || localStorage.getItem(refreshKey) !== refreshToken)
        throw new axios.CanceledError('Phiên đăng nhập đã thay đổi.');
      return saveTokens(response.data, true);
    } catch (error) {
      if (getSessionId() !== session) throw new axios.CanceledError('Phiên đăng nhập đã thay đổi.');
      // A network/server outage must not erase the login or the current workspace.
      if (axios.isAxiosError(error) && [400, 401].includes(error.response?.status || 0)) {
        clearSession(session);
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      throw error;
    }
  };
  // Serialize rotating refresh tokens across tabs as well as concurrent API calls.
  const task = navigator.locks ? navigator.locks.request('scanms-session-refresh', refresh) : refresh();
  const pending = task.finally(() => { if (refreshing === pending) refreshing = null; });
  refreshing = pending;
  return pending;
}

const isAuthEndpoint = (config: InternalAxiosRequestConfig) => /\/auth\//.test(config.url || '');

export async function prepareSessionRequest(config: InternalAxiosRequestConfig) {
  const session = getSessionId();
  if ((config as any).__sessionId !== undefined && (config as any).__sessionId !== getSessionId())
    throw new axios.CanceledError('Phiên đăng nhập đã thay đổi.', config);
  const token = isAuthEndpoint(config) ? null : await renewSession();
  if (session !== getSessionId()) throw new axios.CanceledError('Phiên đăng nhập đã thay đổi.', config);
  (config as any).__sessionId = session;
  (config as any).__sessionToken = token;
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
}

export function assertCurrentSession(config: InternalAxiosRequestConfig) {
  if ((config as any).__sessionId !== getSessionId()) throw new axios.CanceledError('Phiên đăng nhập đã thay đổi.', config);
}

export async function handleSessionApiError(error: any, client: AxiosInstance): Promise<any> {
  const config = error.config;
  if (config) assertCurrentSession(config);
  if (error.response?.status === 401 && config && !isAuthEndpoint(config) && config.__sessionToken) {
    if (!config.__sessionRetried) {
      const token = await renewSession(config.__sessionToken);
      if (token) {
        config.__sessionRetried = true;
        config.headers.Authorization = `Bearer ${token}`;
        // A replay must reach the server, not return a stale cached adapter.
        delete config.adapter;
        config.headers['x-skip-cache'] = 'true';
        return client.request(config);
      }
    }
  }
  const customError: any = new Error(error.response?.data?.message || error.message || 'Chưa kết nối được máy chủ.');
  customError.response = error.response;
  customError.status = error.response?.status;
  customError.statusCode = customError.status;
  throw customError;
}

/** Keep the full Axios response for checkout/finance clients with their own envelopes. */
export function installRawSessionAuth(client: AxiosInstance) {
  client.interceptors.request.use(prepareSessionRequest);
  client.interceptors.response.use(response => {
    assertCurrentSession(response.config);
    return response;
  }, error => handleSessionApiError(error, client));
}

export function startSessionRefresh() {
  const resume = () => {
    if (!document.hidden) void renewSession().catch(() => { /* API requests display connection errors. */ });
  };
  resume();
  window.addEventListener('focus', resume);
  window.addEventListener('online', resume);
  document.addEventListener('visibilitychange', resume);
  return () => {
    window.removeEventListener('focus', resume);
    window.removeEventListener('online', resume);
    document.removeEventListener('visibilitychange', resume);
  };
}
