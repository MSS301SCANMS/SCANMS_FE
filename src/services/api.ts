import axios from 'axios';
import { isBackendEndpoint, readBackendEnvelope, UnsupportedOperationError } from './backend-contract';
import { apiCache } from '../utils/apiCache';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  withCredentials: false,
});

api.interceptors.request.use(config => {
  if (!isBackendEndpoint(config.method || 'get', config.url || '')) {
    throw new UnsupportedOperationError();
  }
  const token = sessionStorage.getItem('scanms-access-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(response => {
  const envelope = readBackendEnvelope(response.data);
  // Compatibility for retained visual components; new services use .result.
  // Stock, prices, ownership and balances must not use the legacy shared cache.
  if (response.config.method !== 'get') apiCache.clear();
  return { ...envelope, data: envelope.result } as unknown as typeof response;
}, error => {
  if (error instanceof UnsupportedOperationError) return Promise.reject(error);
  const status = error.response?.status;
  if (status === 401) {
    sessionStorage.removeItem('scanms-access-token');
    sessionStorage.removeItem('scanms-refresh-token');
    sessionStorage.removeItem('scanms-user');
    sessionStorage.removeItem('scanms-id-token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiCache.clear();
    window.dispatchEvent(new CustomEvent('scanms_auth_changed', { detail: { userId: null } }));
  }
  const failure = new Error(error.response?.data?.message || error.message || 'Không kết nối được máy chủ.');
  Object.assign(failure, { response: error.response, status, statusCode: status });
  return Promise.reject(failure);
});

export async function backendGet<T>(url: string, signal?: AbortSignal): Promise<T> {
  return (await api.get<unknown, { result: T }>(url, { signal })).result;
}
export async function backendPost<T>(url: string, body: unknown): Promise<T> {
  return (await api.post<unknown, { result: T }>(url, body)).result;
}
export async function backendPatch<T>(url: string, body: unknown): Promise<T> {
  return (await api.patch<unknown, { result: T }>(url, body)).result;
}
export default api;
