
import axios from 'axios';

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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response.data,
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
