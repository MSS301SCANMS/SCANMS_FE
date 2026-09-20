import api from './api';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'SYSTEM_ADMIN' | 'SYSTEM_MANAGER' | 'SHOP_MANAGER' | 'COLLABORATOR';
  phoneNumber?: string;
  stores?: any[];
  collaboratorProfile?: any;
  wallet?: any;
}

export const authService = {
  async sendOtp(email: string) {
    return api.post('/auth/send-otp', { email });
  },

  async register(data: {
    email: string;
    password: string;
    fullName: string;
    otp: string;
    role?: string;
    storeName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    logoUrl?: string;
  }) {
    return api.post('/auth/register', data);
  },

  async login(email: string, password: string) {
    const res: any = await api.post('/auth/login', { email, password });
    const accessToken = res?.data?.accessToken || res?.accessToken;
    const user = res?.data?.user || res?.user;
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        const uiRole =
          user.role === 'SHOP_MANAGER'
            ? 'shop'
            : user.role === 'SYSTEM_ADMIN' || user.role === 'SYSTEM_MANAGER'
            ? 'admin'
            : 'kol';
        localStorage.setItem('scanms-current-role', uiRole);
        if (user.stores?.[0]?.id) {
          localStorage.setItem('current_store_id', user.stores[0].id);
        } else {
          localStorage.removeItem('current_store_id');
        }
      }
    }
    return res;
  },

  async googleLogin(idToken: string, role?: string, storeName?: string) {
    const res: any = await api.post('/auth/google', { idToken, role, storeName });
    const accessToken = res?.data?.accessToken || res?.accessToken;
    const user = res?.data?.user || res?.user;
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        const uiRole =
          user.role === 'SHOP_MANAGER'
            ? 'shop'
            : user.role === 'SYSTEM_ADMIN' || user.role === 'SYSTEM_MANAGER'
            ? 'admin'
            : 'kol';
        localStorage.setItem('scanms-current-role', uiRole);
        if (user.stores?.[0]?.id) {
          localStorage.setItem('current_store_id', user.stores[0].id);
        } else {
          localStorage.removeItem('current_store_id');
        }
      }
    }
    return res;
  },

  async getMe(): Promise<UserProfile> {
    const res: any = await api.get('/auth/me');
    const user = res?.data || res;
    if (user && user.id) {
      localStorage.setItem('user', JSON.stringify(user));
      if (user.stores?.[0]?.id) {
        localStorage.setItem('current_store_id', user.stores[0].id);
      }
    }
    return user;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('scanms-current-role');
    localStorage.removeItem('current_store_id');
    window.location.href = '/login';
  },

  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
