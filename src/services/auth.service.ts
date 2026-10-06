import api from './api';

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

  logout() {
    window.dispatchEvent(new CustomEvent('scanms_auth_changed', { detail: { userId: null } }));
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
    window.dispatchEvent(new Event('auth-user-updated'));
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
      Boolean(u.collaboratorProfile) ||
      u.role === 'SYSTEM_ADMIN' ||
      u.role === 'SYSTEM_MANAGER';

    const isShop =
      u.role === 'SHOP_MANAGER' ||
      Boolean(u.stores && u.stores.length > 0) ||
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
    const stored = localStorage.getItem('scanms-active-workspace') as any;
    if (stored && ['customer', 'kol', 'shop', 'admin'].includes(stored)) {
      return stored;
    }
    const user = this.getCurrentUser();
    if (!user) return 'customer';

    if (user.role === 'SHOP_MANAGER') return 'shop';
    if (user.role === 'SYSTEM_ADMIN' || user.role === 'SYSTEM_MANAGER') return 'admin';
    if (user.role === 'COLLABORATOR') return 'kol';
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
