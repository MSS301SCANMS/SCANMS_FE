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
  }) {
    return api.post('/auth/register', data);
  },

  async login(email: string, password: string) {
    const res: any = await api.post('/auth/login', { email, password });
    if (res?.data?.accessToken) {
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res;
  },

  async googleLogin(idToken: string, role?: string, storeName?: string) {
    const res: any = await api.post('/auth/google', { idToken, role, storeName });
    if (res?.data?.accessToken) {
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res;
  },

  async getMe(): Promise<UserProfile> {
    const res: any = await api.get('/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
