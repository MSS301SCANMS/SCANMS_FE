import api from './api';

function safeLoginReturn(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//') || /[\\\r\n\t]/.test(path)) return null;
  try {
    const base = 'https://scanms.invalid';
    const url = new URL(path, base);
    if (url.origin !== base || /^\/(?:login|register)(?:\/|$)/.test(url.pathname)) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return null; }
}

function productLoginUrl(returnTo: string): string {
  const safePath = safeLoginReturn(returnTo);
  const params = new URLSearchParams({ role: 'customer' });
  if (safePath) params.set('redirect', safePath);
  return `/login?${params}`;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'SYSTEM_ADMIN' | 'SYSTEM_MANAGER' | 'SHOP_MANAGER' | 'COLLABORATOR' | 'CUSTOMER';
  phoneNumber?: string;
  avatarUrl?: string | null;
  stores?: any[];
  collaboratorProfile?: any;
  wallet?: any;
}

export interface AvailableWorkspace {
  key: 'customer' | 'kol' | 'shop' | 'admin';
  label: string;
  badge: string;
  route: string;
  description: string;
}

// Thu tu uu tien role khi user co nhieu role cung luc (cao -> thap)
const ROLE_PRIORITY = ['ADMIN', 'MANAGER', 'SHOP_MANAGER', 'SHOP_OWNER', 'KOL_CTV', 'COLLABORATOR', 'CUSTOMER', 'USER'];

const ROLE_MAP: Record<string, string> = {
  'ADMIN': 'SYSTEM_ADMIN',
  'MANAGER': 'SYSTEM_MANAGER',
  'SHOP_MANAGER': 'SHOP_MANAGER',
  'SHOP_OWNER': 'SHOP_MANAGER',
  'KOL_CTV': 'COLLABORATOR',
  'COLLABORATOR': 'COLLABORATOR',
  'CUSTOMER': 'CUSTOMER',
  'USER': 'CUSTOMER',
};

function normalizeUser(raw: any): any {
  if (!raw) return raw;
  const user = { ...raw };
  if (!user.id && user.userId) {
    user.id = user.userId;
  }
  if (!user.role && Array.isArray(user.roles) && user.roles.length > 0) {
    const beRoles: string[] = user.roles;
    const highestRole =
      ROLE_PRIORITY.find((r) => beRoles.includes(r)) || beRoles[0];
    user.role = ROLE_MAP[highestRole] || highestRole;
  }
  return user;
}

export const authService = {
  async sendOtp(email: string) {
    return api.post('/auth/send-otp', { email });
  },

  async sendForgotPasswordOtp(email: string) {
    return api.post('/auth/forgot-password/send-otp', { email });
  },

  async verifyResetOtp(email: string, otp: string) {
    return api.post('/auth/forgot-password/verify-otp', { email, otp });
  },

  async resetPassword(data: { email: string; otp: string; newPassword: string }) {
    return api.post('/auth/forgot-password/reset', data);
  },

  async register(data: {
    username?: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    roleNames?: string[];
    fullName?: string;
    otp?: string;
    role?: string;
    storeName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    logoUrl?: string;
  }) {
    return api.post('/auth/register', data);
  },

  async login(identifier: string, password: string) {
    const res: any = await api.post('/auth/login', {
      identifier: identifier.trim(),
      password,
    });
    const accessToken =
      res?.result?.access_token ||
      res?.data?.access_token ||
      res?.result?.accessToken ||
      res?.data?.accessToken ||
      res?.access_token ||
      res?.accessToken;
    let user = normalizeUser(res?.result?.user || res?.data?.user || res?.user);

    if (accessToken) {
      localStorage.setItem('token', accessToken);
      if (!user || !user.id) {
        try {
          const meRes: any = await api.get('/users/me');
          user = normalizeUser(meRes?.result || meRes?.data || meRes);
        } catch {
          try {
            const meRes: any = await api.get('/auth/me');
            user = normalizeUser(meRes?.result || meRes?.data || meRes);
          } catch (e) {
            console.warn('Failed to fetch user profile after login:', e);
          }
        }
      }

      if (user && (user.id || user.userId)) {
        user = normalizeUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        const uiRole =
          user.role === 'SHOP_MANAGER'
            ? 'shop'
            : user.role === 'SYSTEM_ADMIN' || user.role === 'SYSTEM_MANAGER'
            ? 'admin'
            : user.role === 'CUSTOMER'
            ? 'customer'
            : 'kol';
        localStorage.setItem('scanms-current-role', uiRole);
        localStorage.setItem('scanms-active-workspace', uiRole);
        if (user.stores?.[0]?.id) {
          localStorage.setItem('current_store_id', user.stores[0].id);
        } else {
          localStorage.removeItem('current_store_id');
        }
        window.dispatchEvent(new CustomEvent('scanms_auth_changed', { detail: { userId: user.id } }));
        window.dispatchEvent(new Event('auth-user-updated'));
      }
    }
    return res;
  },

  async googleLogin(idToken: string, role?: string, storeName?: string) {
    const res: any = await api.post('/auth/google', { idToken, role, storeName });
    const accessToken =
      res?.result?.access_token ||
      res?.data?.access_token ||
      res?.result?.accessToken ||
      res?.data?.accessToken ||
      res?.access_token ||
      res?.accessToken;
    let user = normalizeUser(res?.result?.user || res?.data?.user || res?.user);

    if (accessToken) {
      localStorage.setItem('token', accessToken);
      if (!user || !user.id) {
        try {
          const meRes: any = await api.get('/users/me');
          user = normalizeUser(meRes?.result || meRes?.data || meRes);
        } catch {
          try {
            const meRes: any = await api.get('/auth/me');
            user = normalizeUser(meRes?.result || meRes?.data || meRes);
          } catch (e) {
            console.warn('Failed to fetch user profile after google login:', e);
          }
        }
      }

      if (user && (user.id || user.userId)) {
        user = normalizeUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        const uiRole =
          user.role === 'SHOP_MANAGER'
            ? 'shop'
            : user.role === 'SYSTEM_ADMIN' || user.role === 'SYSTEM_MANAGER'
            ? 'admin'
            : user.role === 'CUSTOMER'
            ? 'customer'
            : 'kol';
        localStorage.setItem('scanms-current-role', uiRole);
        localStorage.setItem('scanms-active-workspace', uiRole);
        if (user.stores?.[0]?.id) {
          localStorage.setItem('current_store_id', user.stores[0].id);
        } else {
          localStorage.removeItem('current_store_id');
        }
        window.dispatchEvent(new CustomEvent('scanms_auth_changed', { detail: { userId: user.id } }));
        window.dispatchEvent(new Event('auth-user-updated'));
      }
    }
    return res;
  },

  async getMe(): Promise<UserProfile> {
    const token = localStorage.getItem('token');
    const res: any = await api.get('/auth/me');
    if (token !== localStorage.getItem('token')) throw new Error('Phiên đăng nhập đã thay đổi.');
    const user = res?.data || res;
    if (user && user.id) {
      const previousUserId = this.getCurrentUser()?.id;
      localStorage.setItem('user', JSON.stringify(user));
      if (user.stores?.[0]?.id) {
        localStorage.setItem('current_store_id', user.stores[0].id);
      }
      if (previousUserId !== user.id) window.dispatchEvent(new Event('auth-user-updated'));
    }
    return user;
  },

  async updateAvatar(avatarUrl: string): Promise<any> {
    const res: any = await api.patch('/auth/avatar', { avatarUrl });
    const user = this.getCurrentUser();
    if (user) {
      user.avatarUrl = avatarUrl;
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-user-updated'));
    }
    return res?.data || res;
  },

  logout(returnTo?: string) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('scanms-current-role');
    localStorage.removeItem('scanms-active-workspace');
    localStorage.removeItem('current_store_id');
    localStorage.removeItem('scanms_cart_v1');
    localStorage.removeItem('scanms_cart_selected_v1');
    localStorage.removeItem('scanms_cart_guest');
    localStorage.removeItem('scanms_cart_selected_guest');
    localStorage.removeItem('scanms_pending_checkout');
    window.dispatchEvent(new CustomEvent('scanms_auth_changed', { detail: { userId: null } }));
    window.dispatchEvent(new Event('auth-user-updated'));
    window.location.href = returnTo ? productLoginUrl(returnTo) : '/login';
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

  /**
   * Tính danh sách không gian làm việc (Workspaces) người dùng có quyền truy cập
   * Khách hàng sau khi nâng cấp lên KOL hoặc Shop Manager KHÔNG BAO GIỜ mất quyền Khách Hàng!
   */
  getUserAvailableWorkspaces(user?: UserProfile | null): AvailableWorkspace[] {
    const u = user || this.getCurrentUser();
    if (!u) return [];

    const workspaces: AvailableWorkspace[] = [
      {
        key: 'customer',
        label: 'Khách Hàng',
        badge: 'Mua Sắm',
        route: '/customer/orders',
        description: 'Xem đơn mua, địa chỉ nhận hàng, lịch sử đặt hàng cá nhân',
      },
    ];

    const isKol =
      u.role === 'COLLABORATOR' ||
      (Boolean(u.collaboratorProfile) && u.collaboratorProfile?.kycStatus === 'VERIFIED') ||
      u.role === 'SYSTEM_ADMIN' ||
      u.role === 'SYSTEM_MANAGER';

    const isShop =
      u.role === 'SHOP_MANAGER' ||
      Boolean(u.stores?.some((s: any) => s.isActive || s.isVerified || s.onboardingStatus === 'APPROVED')) ||
      u.role === 'SYSTEM_ADMIN' ||
      u.role === 'SYSTEM_MANAGER';

    const isAdmin = u.role === 'SYSTEM_ADMIN' || u.role === 'SYSTEM_MANAGER';

    if (isKol) {
      workspaces.push({
        key: 'kol',
        label: 'KOL Tiếp Thị',
        badge: 'Affiliate',
        route: '/collaborator/dashboard',
        description: 'Tạo link tiếp thị, xem hoa hồng, chiến dịch & đối soát',
      });
    }

    if (isShop) {
      workspaces.push({
        key: 'shop',
        label: 'Chủ Gian Hàng',
        badge: 'Merchant',
        route: '/merchant/dashboard',
        description: 'Quản lý sản phẩm, tồn kho, đơn hàng shop & chiến dịch affiliate',
      });
    }

    if (isAdmin) {
      const isSuperAdmin = u.role === 'SYSTEM_ADMIN';
      workspaces.push({
        key: 'admin',
        label: isSuperAdmin ? 'Ban Quản Trị Tối Cao' : 'Vận Hành & Tuân Thủ',
        badge: isSuperAdmin ? 'SuperAdmin' : 'Operations',
        route: isSuperAdmin ? '/admin/analytics' : '/admin/users',
        description: isSuperAdmin
          ? 'Quản trị dòng tiền toàn sàn, chính sách, phân quyền & nhật ký kiểm toán'
          : 'Thẩm định hồ sơ KYC, kiểm duyệt sản phẩm & AI giám sát gian lận',
      });
    }

    return workspaces;
  },

  getActiveWorkspace(): 'customer' | 'kol' | 'shop' | 'admin' {
    const user = this.getCurrentUser();
    if (!user) return 'customer';

    const availableWorkspaces = this.getUserAvailableWorkspaces(user).map((w) => w.key);

    const stored = localStorage.getItem('scanms-active-workspace') as any;
    if (stored && availableWorkspaces.includes(stored)) {
      return stored;
    }

    if (user.role === 'SHOP_MANAGER' && availableWorkspaces.includes('shop')) return 'shop';
    if ((user.role === 'SYSTEM_ADMIN' || user.role === 'SYSTEM_MANAGER') && availableWorkspaces.includes('admin')) return 'admin';
    if (user.role === 'COLLABORATOR' && availableWorkspaces.includes('kol')) return 'kol';
    return 'customer';
  },

  switchWorkspace(target: 'customer' | 'kol' | 'shop' | 'admin', navigate?: (path: string) => void) {
    localStorage.setItem('scanms-active-workspace', target);
    localStorage.setItem('scanms-current-role', target);
    window.dispatchEvent(new CustomEvent('scanms_workspace_changed', { detail: { workspace: target } }));

    const user = this.getCurrentUser();
    const isSuperAdmin = user?.role === 'SYSTEM_ADMIN';

    const targetRoute =
      target === 'shop'
        ? '/merchant/dashboard'
        : target === 'admin'
        ? (isSuperAdmin ? '/admin/analytics' : '/admin/users')
        : target === 'kol'
        ? '/collaborator/dashboard'
        : '/customer/orders';

    if (navigate) {
      navigate(targetRoute);
    } else {
      window.location.href = targetRoute;
    }
  },
};
