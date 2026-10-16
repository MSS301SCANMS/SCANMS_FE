import api from '../lib/api';

export type AdminRoleName = 'ADMIN' | 'MANAGER' | 'USER' | 'KOL_CTV' | 'SHOP_OWNER';
export type AdminUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface AdminUser {
  userId: string;
  identitySubject: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  status: AdminUserStatus;
  roles: AdminRoleName[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUserPage {
  content: AdminUser[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AdminUserListParams {
  page?: number;
  size?: number;
  search?: string;
  role?: AdminRoleName | '';
  status?: AdminUserStatus | '';
}

export const adminUserService = {
  async list(params: AdminUserListParams): Promise<AdminUserPage> {
    const res: any = await api.get('/users/admin', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        search: params.search || undefined,
        role: params.role || undefined,
        status: params.status || undefined,
      },
    });
    return res?.result ?? res?.data ?? res;
  },

  async getById(userId: string): Promise<AdminUser> {
    const res: any = await api.get(`/users/admin/${userId}`);
    return res?.result ?? res?.data ?? res;
  },

  async updateStatus(userId: string, status: AdminUserStatus): Promise<AdminUser> {
    const res: any = await api.patch(`/users/admin/${userId}/status`, { status });
    return res?.result ?? res?.data ?? res;
  },
};
