
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


function determineTargetRole(url?: string): 'COLLABORATOR' | 'SHOP_MANAGER' | 'SYSTEM_ADMIN' {
  const reqUrl = (url || '').toLowerCase();
  const currentPath = (typeof window !== 'undefined' ? window.location?.pathname || '' : '').toLowerCase();


  if (
    reqUrl.includes('/store-collaborators/shop') ||
    reqUrl.includes('/store-collaborators/invite')
  ) {
    return 'SHOP_MANAGER';
  }
  if (
    reqUrl.includes('/store-collaborators/my-invitations') ||
    /\/store-collaborators\/[^/]+\/(accept|reject)(?:\?|$)/.test(reqUrl)
  ) {
    return 'COLLABORATOR';
  }


  if (
    reqUrl.includes('/sample-requests/shop') ||
    /\/sample-requests\/[^/]+\/(approve|reject|ship)(?:\?|$)/.test(reqUrl)
  ) {
    return 'SHOP_MANAGER';
  }
  if (
    reqUrl.includes('/sample-requests/my') ||
    (reqUrl.includes('/sample-requests') && !currentPath.includes('/merchant'))
  ) {
    return 'COLLABORATOR';
  }


  if (reqUrl.includes('/chat/search-collaborators')) {
    return 'SHOP_MANAGER';
  }
  if (reqUrl.includes('/chat/search-stores')) {
    return 'COLLABORATOR';
  }
  if (reqUrl.includes('/chat/')) {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    try {
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed?.role === 'SHOP_MANAGER') return 'SHOP_MANAGER';
        if (parsed?.role === 'COLLABORATOR') return 'COLLABORATOR';
      }
    } catch {}
    const savedRole = typeof window !== 'undefined' ? localStorage.getItem('scanms-current-role') : null;
    if (savedRole === 'shop' || currentPath.includes('/merchant')) return 'SHOP_MANAGER';
    return 'COLLABORATOR';
  }



  if (
    reqUrl.includes('/collaborator') ||
    reqUrl.includes('/kol') ||
    reqUrl.includes('/referral-links') ||
    reqUrl.includes('/campaigns/my-invitations') ||
    currentPath.includes('/collaborator') ||
    currentPath.includes('/kol')
  ) {
    return 'COLLABORATOR';
  }


  if (reqUrl.includes('/admin') || currentPath.includes('/admin')) {
    return 'SYSTEM_ADMIN';
  }


  if (
    reqUrl.includes('/merchant') ||
    reqUrl.includes('/commission-rules') ||
    currentPath.includes('/merchant') ||
    (reqUrl.includes('/stores/') && !reqUrl.includes('/collaborator/'))
  ) {
    return 'SHOP_MANAGER';
  }

  const savedRole = localStorage.getItem('scanms-current-role');
  if (savedRole === 'shop') return 'SHOP_MANAGER';
  if (savedRole === 'admin') return 'SYSTEM_ADMIN';

  return 'COLLABORATOR';
}


const isDemoAutoLoginEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_AUTO_LOGIN === 'true';

function isStillOnTargetRole(targetRole: 'COLLABORATOR' | 'SHOP_MANAGER' | 'SYSTEM_ADMIN') {
  const activeUiRole = localStorage.getItem('scanms-current-role');
  if (!activeUiRole) return true;

  const uiRoleByApiRole: Record<typeof targetRole, string> = {
    COLLABORATOR: 'kol',
    SHOP_MANAGER: 'shop',
    SYSTEM_ADMIN: 'admin',
  };
  return activeUiRole === uiRoleByApiRole[targetRole];
}

async function getDevFallbackToken(url?: string): Promise<string | null> {
  if (!isDemoAutoLoginEnabled) return null;
  const targetRole = determineTargetRole(url);
  let email = 'demo@scanms.vn';
  if (targetRole === 'SHOP_MANAGER') {
    email = 'shop@scanms.vn';
  } else if (targetRole === 'SYSTEM_ADMIN') {
    email = 'admin@scanms.vn';
  }

  try {
    const res = await axios.post(
      (import.meta.env.VITE_API_URL || 'http://localhost:3000/api') + '/auth/login',
      { email, password: 'Password@123' },
      { timeout: 5000 }
    );
    const newToken = res.data?.data?.accessToken || res.data?.accessToken;
    const user = res.data?.data?.user || res.data?.user;


    if (newToken && isStillOnTargetRole(targetRole)) {
      localStorage.setItem('token', newToken);
      if (user) localStorage.setItem('user', JSON.stringify(user));
      return newToken;
    }
  } catch {

  }
  return null;
}


api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let currentUserRole = '';
    try {
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        currentUserRole = parsedUser?.role || '';
      }
    } catch {}

    const targetRole = determineTargetRole(config.url);
    const isRoleMismatch = currentUserRole && currentUserRole !== targetRole;

    if (isDemoAutoLoginEnabled && !config.url?.includes('/auth/')) {

      if (!token || isRoleMismatch) {
        token = await getDevFallbackToken(config.url);
      }
    }

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
    const originalRequest = error.config;
    const status = error.response?.status;
    if (
      isDemoAutoLoginEnabled &&
      (status === 401 || status === 403) &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      originalRequest._retry = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const freshToken = await getDevFallbackToken(originalRequest.url);
      if (freshToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        const retryRes = await api.request(originalRequest);
        return retryRes;
      }
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
