import api from './api';

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
}

export const notificationsService = {
  async getNotifications(category: 'ALL' | 'ORDER' | 'FINANCE' | 'SYSTEM' = 'ALL', page = 1, limit = 20): Promise<NotificationResponse> {
    const res: any = await api.get('/notifications', {
      params: { category, page, limit },
    });
    return res?.data?.data || res?.data || res;
  },

  async getUnreadCount(): Promise<number> {
    try {
      const res: any = await api.get('/notifications/unread-count');
      const data = res?.data?.data || res?.data || res;
      return typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
    } catch {
      return 0;
    }
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
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
