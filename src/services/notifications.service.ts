import api from './api';
import { unwrapApi } from '@/utils/api-response';
const fresh = { headers: { 'x-skip-cache': '1' } };

export type NotificationCategory = 'ALL' | 'ORDER' | 'PROMOTION' | 'SYSTEM';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
  categoryUnreadCounts?: {
    ORDER: number;
    PROMOTION: number;
    SYSTEM: number;
  };
}

export const notificationsService = {
  async getNotifications(
    category: NotificationCategory = 'ALL',
    page = 1,
    limit = 20,
  ): Promise<NotificationResponse> {
    const res: any = await api.get('/notifications', {
      params: { category, page, limit },
      ...fresh,
    });
    const result = unwrapApi<NotificationResponse>(res);
    if (!Array.isArray(result?.items)) throw new Error('Chưa tải được danh sách thông báo hợp lệ.');
    return result;
  },

  async getUnreadCount(): Promise<number | null> {
    try {
      const data = unwrapApi<{ unreadCount?: number }>(await api.get('/notifications/unread-count', fresh));
      return typeof data?.unreadCount === 'number' ? data.unreadCount : null;
    } catch {
      return null;
    }
  },

  async getUnreadDetails(): Promise<{
    unreadCount: number;
    categoryUnreadCounts: {
      ORDER: number;
      PROMOTION: number;
      SYSTEM: number;
    };
  } | null> {
    try {
      const data = unwrapApi<{ unreadCount?: number; categoryUnreadCounts?: { ORDER: number; PROMOTION: number; SYSTEM: number } }>(await api.get('/notifications/unread-count', fresh));
      if (typeof data?.unreadCount !== 'number') return null;
      return {
        unreadCount: data.unreadCount,
        categoryUnreadCounts: data?.categoryUnreadCounts || { ORDER: 0, PROMOTION: 0, SYSTEM: 0 },
      };
    } catch {
      return null;
    }
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await api.patch(`/notifications/${encodeURIComponent(notificationId)}/read`);
      return true;
    } catch {
      return false;
    }
  },

  async markAllAsRead(): Promise<boolean> {
    try {
      await api.patch('/notifications/read-all');
      return true;
    } catch {
      return false;
    }
  },
};
