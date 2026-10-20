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
  role:
    | 'SYSTEM_ADMIN'
    | 'SYSTEM_MANAGER'
    | 'SHOP_MANAGER'
    | 'SHOP_OWNER'
    | 'COLLABORATOR'
    | 'KOL_CTV'
    | 'CUSTOMER'
    | 'ADMIN'
    | 'MANAGER'
    | string;
  phoneNumber?: string;
  avatarUrl?: string | null;
  stores?: any[];
  collaboratorProfile?: any;
  wallet?: any;
  roles?: string[];
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

  const beRoles: string[] = Array.isArray(user.roles)
    ? user.roles.map((r: any) => (typeof r === 'string' ? r : r?.name || r?.roleName || '')).filter(Boolean)
    : [];

  // BE dùng SHOP_OWNER / KOL_CTV / USER — luôn map lại từ roles (ưu tiên cao hơn field role thô)
  if (beRoles.length > 0) {
    const highestRole = ROLE_PRIORITY.find((r) => beRoles.includes(r)) || beRoles[0];
    user.role = ROLE_MAP[highestRole] || highestRole;
  } else if (user.role && ROLE_MAP[user.role]) {
    user.role = ROLE_MAP[user.role];
  } else if (typeof user.role === 'string' && user.role === 'SHOP_OWNER') {
    user.role = 'SHOP_MANAGER';
  }

  return user;
}

function workspaceKeyFromRole(role?: string): 'shop' | 'admin' | 'customer' | 'kol' {
  if (role === 'SHOP_MANAGER') return 'shop';
  if (role === 'SYSTEM_ADMIN' || role === 'SYSTEM_MANAGER') return 'admin';
  if (role === 'CUSTOMER') return 'customer';
  return 'kol';
}

async function attachOwnedStores(user: any): Promise<any> {
  if (!user || user.role !== 'SHOP_MANAGER') return user;
  if (Array.isArray(user.stores) && user.stores.length > 0) return user;
  try {
    const storesRes: any = await api.get('/stores/mine', { headers: { 'x-skip-cache': 'true' } });
    const payload = storesRes?.result ?? storesRes?.data ?? storesRes;
    const list = Array.isArray(payload) ? payload : payload ? [payload] : [];
    if (!list.length) return user;
    user.stores = list.map((s: any) => ({
      ...s,
      id: s.storeId || s.id,
      isActive: s.isActive ?? true,
      onboardingStatus: s.onboardingStatus || s.status || 'APPROVED',
    }));
    if (user.stores[0]?.id) {
      localStorage.setItem('current_store_id', user.stores[0].id);
    }
  } catch {
    /* store list optional at login */
  }
  return user;
}

export const authService = {
  async sendOtp(email: string) {
    // BE không có /auth/send-otp — dùng flow forgot-password OTP
    return api.post('/auth/forgot-password/send-otp', { email });
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
    const fullName = (data.fullName || '').trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = data.firstName || nameParts[0] || data.email.split('@')[0];
    const lastName = data.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName);
    return api.post('/auth/register', {
      username: data.username || data.email.split('@')[0],
      email: data.email.trim(),
      password: data.password,
      firstName,
      lastName,
    });
  },

  async login(identifier: string, password: string) {
    // BE LoginRequest expects `email` (Keycloak username = email)
    // AuthResponse chỉ có token — luôn gọi /users/me để lấy roles (SHOP_OWNER → SHOP_MANAGER)
    const res: any = await api.post('/auth/login', {
      email: identifier.trim(),
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
      try {
        const meRes: any = await api.get('/users/me', { headers: { 'x-skip-cache': 'true' } });
        user = normalizeUser(meRes?.result || meRes?.data || meRes);
      } catch (e) {
        console.warn('Failed to fetch user profile after login:', e);
      }

      if (user && (user.id || user.userId)) {
        user = await attachOwnedStores(normalizeUser(user));
        localStorage.setItem('user', JSON.stringify(user));
        const uiRole = workspaceKeyFromRole(user.role);
        localStorage.setItem('scanms-current-role', uiRole);
        localStorage.setItem('scanms-active-workspace', uiRole);
        if (user.stores?.[0]?.id) {
          localStorage.setItem('current_store_id', user.stores[0].id);
        } else if (uiRole !== 'shop') {
          localStorage.removeItem('current_store_id');
        }
        window.dispatchEvent(new CustomEvent('scanms_auth_changed', { detail: { userId: user.id } }));
        window.dispatchEvent(new Event('auth-user-updated'));
      }
    }
    return { ...res, user, data: { ...(res?.data || {}), user, access_token: accessToken } };
  },

  async googleLogin(idToken: string, role?: string, storeName?: string) {
    // BE GoogleLoginRequest chỉ nhận idToken
    void role;
    void storeName;
    const res: any = await api.post('/auth/google', { idToken });
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
      try {
        const meRes: any = await api.get('/users/me', { headers: { 'x-skip-cache': 'true' } });
        user = normalizeUser(meRes?.result || meRes?.data || meRes);
      } catch (e) {
        console.warn('Failed to fetch user profile after google login:', e);
      }

      if (user && (user.id || user.userId)) {
        user = await attachOwnedStores(normalizeUser(user));
        localStorage.setItem('user', JSON.stringify(user));
        const uiRole = workspaceKeyFromRole(user.role);
        localStorage.setItem('scanms-current-role', uiRole);
        localStorage.setItem('scanms-active-workspace', uiRole);
        if (user.stores?.[0]?.id) {
          localStorage.setItem('current_store_id', user.stores[0].id);
        } else if (uiRole !== 'shop') {
          localStorage.removeItem('current_store_id');
        }
        window.dispatchEvent(new CustomEvent('scanms_auth_changed', { detail: { userId: user.id } }));
        window.dispatchEvent(new Event('auth-user-updated'));
      }
    }
    return { ...res, user, data: { ...(res?.data || {}), user, access_token: accessToken } };
  },

  async getMe(): Promise<UserProfile> {
    const token = localStorage.getItem('token');
    const res: any = await api.get('/users/me', { headers: { 'x-skip-cache': 'true' } });
    if (token !== localStorage.getItem('token')) throw new Error('Phiên đăng nhập đã thay đổi.');
    let user = normalizeUser(res?.result || res?.data || res);
    if (user && (user.id || user.userId)) {
      const previousUserId = this.getCurrentUser()?.id;
      user = await attachOwnedStores(user);
      localStorage.setItem('user', JSON.stringify(user));
      const uiRole = workspaceKeyFromRole(user.role);
      if (!localStorage.getItem('scanms-active-workspace') || user.role === 'SHOP_MANAGER') {
        localStorage.setItem('scanms-current-role', uiRole);
        localStorage.setItem('scanms-active-workspace', uiRole);
      }
      if (user.stores?.[0]?.id) {
        localStorage.setItem('current_store_id', user.stores[0].id);
      }
      if (previousUserId !== user.id) window.dispatchEvent(new Event('auth-user-updated'));
    }
    return user;
  },

  async updateAvatar(avatarUrl: string): Promise<any> {
    const res: any = await api.patch('/users/me', { avatarUrl });
    const user = this.getCurrentUser();
    if (user) {
      user.avatarUrl = avatarUrl;
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('auth-user-updated'));
    }
    return normalizeUser(res?.result || res?.data || res);
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

    // Admin/Manager chỉ workspace admin — không gán KOL/Shop (tránh sidebar KOL nhầm)
    const isAdmin = u.role === 'SYSTEM_ADMIN' || u.role === 'SYSTEM_MANAGER';

    const isKol =
      !isAdmin &&
      (u.role === 'COLLABORATOR' ||
        (Boolean(u.collaboratorProfile) &&
          ['VERIFIED', 'APPROVED', 'ACTIVE'].includes(
            String(u.collaboratorProfile?.kycStatus || u.collaboratorProfile?.approvalStatus || '').toUpperCase(),
          )));

    const isShop =
      !isAdmin &&
      (u.role === 'SHOP_MANAGER' ||
        u.role === 'SHOP_OWNER' ||
        (Array.isArray(u.roles) &&
          u.roles.some((r: any) => ['SHOP_OWNER', 'SHOP_MANAGER'].includes(String(r?.name || r)))) ||
        Boolean(
          u.stores?.some(
            (s: any) =>
              s.isActive ||
              s.isVerified ||
              ['APPROVED', 'VERIFIED', 'PENDING_APPROVAL', 'ACTIVE'].includes(
                String(s.onboardingStatus || s.status || '').toUpperCase(),
              ),
          ),
        ));

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
        route: isSuperAdmin ? '/admin/users' : '/admin/ops-dashboard',
        description: isSuperAdmin
          ? 'Tài khoản, phân quyền, ví hệ thống & giám sát service'
          : 'Duyệt shop/KOL, chính sách hoa hồng, voucher & dashboard vận hành',
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

    if (
      (user.role === 'SHOP_MANAGER' || user.role === 'SHOP_OWNER') &&
      availableWorkspaces.includes('shop')
    ) {
      return 'shop';
    }
    if ((user.role === 'SYSTEM_ADMIN' || user.role === 'SYSTEM_MANAGER') && availableWorkspaces.includes('admin')) return 'admin';
    if (user.role === 'COLLABORATOR' && availableWorkspaces.includes('kol')) return 'kol';
    return 'customer';
  },

  switchWorkspace(target: 'customer' | 'kol' | 'shop' | 'admin', navigate?: (path: string) => void) {
    localStorage.setItem('scanms-active-workspace', target);
    localStorage.setItem('scanms-current-role', target);
    window.dispatchEvent(new CustomEvent('scanms_workspace_changed', { detail: { workspace: target } }));

    const user = this.getCurrentUser();
    const targetRoute =
      target === 'shop'
        ? '/merchant/dashboard'
        : target === 'admin'
        ? user?.role === 'SYSTEM_MANAGER'
          ? '/admin/ops-dashboard'
          : '/admin/users'
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
