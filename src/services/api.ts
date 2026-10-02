import axios from 'axios';
import { apiCache } from '../utils/apiCache';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Client Memory Cache Hit: Nếu là GET request hợp lệ và chưa hết hạn, trả về ngay từ cache không cần chờ mạng
    const isGet = (config.method || 'get').toLowerCase() === 'get';
    const skipCache = Boolean((config.headers as any)?.['x-skip-cache']);

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
    const method = (response.config.method || 'get').toLowerCase();
    const url = response.config.url;

    // Lưu tạm vào cache nếu là GET request thành công
    if (method === 'get' && url && apiCache.isCacheable(url)) {
      apiCache.set(url, response.config.params, response.data);
    } else if (['post', 'put', 'patch', 'delete'].includes(method)) {
      // Khi có hành động thay đổi dữ liệu (tạo mới, cập nhật, xóa) -> Invalidate cache để đồng bộ dữ liệu mới nhất
      apiCache.invalidate();
    }

    return response.data;
  },
  async (error) => {
    const status = error.response?.status;
    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    const customErr: any = new Error(message);
    customErr.response = error.response;
    customErr.status = status;
    customErr.statusCode = status;
    return Promise.reject(customErr);
  }
);

export default api;
