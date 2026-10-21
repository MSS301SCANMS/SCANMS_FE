import axios from 'axios';
import { apiCache } from '@/utils/api-cache.utils';
import { prepareSessionRequest, assertCurrentSession, handleSessionApiError } from './auth-session';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    await prepareSessionRequest(config);

    // Client Memory Cache Hit: Nếu là GET request hợp lệ và chưa hết hạn, trả về ngay từ cache không cần chờ mạng
    const isGet = (config.method || 'get').toLowerCase() === 'get';
    const skipCache = Boolean((config.headers as any)?.['x-skip-cache']);
    if (config.headers && (config.headers as any)['x-skip-cache']) {
      delete (config.headers as any)['x-skip-cache'];
    }

    if (isGet && !skipCache && config.url && apiCache.isCacheable(config.url)) {
      const cachedData = apiCache.get(config.url, config.params);
      if (cachedData !== null) {
        config.adapter = () =>
          Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK (From Client Cache)',
            headers: {},
            config,
          });
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    assertCurrentSession(response.config);
    const method = (response.config.method || 'get').toLowerCase();
    const url = response.config.url;

    // Lưu tạm vào cache nếu là GET request thành công
    if (method === 'get' && url && apiCache.isCacheable(url)) {
      apiCache.set(url, response.config.params, response.data);
    } else if (['post', 'put', 'patch', 'delete'].includes(method)) {
      // Khi có hành động thay đổi dữ liệu -> Invalidate cache của domain bị ảnh hưởng (targeted invalidation)
      const affectedDomain = apiCache.getAffectedDomain(url);
      apiCache.invalidate(affectedDomain);
    }

    // Spring ApiResponse uses `result`; keep Nest-compatible `data` alias.
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'result' in payload && !('data' in payload)) {
      return { ...payload, data: (payload as any).result };
    }
    return payload;
  },
  (error) => handleSessionApiError(error, api)
);

export default api;
