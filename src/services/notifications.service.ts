import api from './api';
const notificationsEnabled = import.meta.env.VITE_COMMERCE_BACKEND === 'legacy';

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
    if (!notificationsEnabled) return { items: [], total: 0, page, limit, totalPages: 0, unreadCount: 0 };
    const res: any = await api.get('/notifications', {
      params: { category, page, limit },
    });
    return res?.data?.data || res?.data || res;
  },

  async getUnreadCount(): Promise<number | null> {
    if (!notificationsEnabled) return 0;
    try {
      const res: any = await api.get('/notifications/unread-count');
      const data = res?.data?.data || res?.data || res;
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
    if (!notificationsEnabled) return null;
    try {
      const res: any = await api.get('/notifications/unread-count');
      const data = res?.data?.data || res?.data || res;
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
    if (!notificationsEnabled) return false;
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      return true;
    } catch {
      return false;
    }
  },

  async markAllAsRead(): Promise<boolean> {
    if (!notificationsEnabled) return false;
    try {
      await api.patch('/notifications/read-all');
      return true;
    } catch {
      return false;
    }
  },
};
