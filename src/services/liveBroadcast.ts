/**
 * SCANMS Live Stream Notification & Broadcast Service
 * Broadcasts real-time live stream events across all 5 account roles:
 * - CUSTOMER (User / Khách hàng)
 * - COLLABORATOR (KOL / KOC)
 * - SHOP_MANAGER (Chủ Shop)
 * - SYSTEM_MANAGER (Quản trị viên sàn)
 * - SYSTEM_ADMIN (Admin tối cao)
 */

export interface LiveBroadcastItem {
  id: string;
  sessionId: string;
  title: string;
  storeName: string;
  creatorName: string;
  liveUrl: string;
  discountText?: string;
  isLive: boolean;
  createdAt: string;
  endsAt?: string;
  isRead?: boolean;
}

const STORAGE_KEY = 'scanms_live_broadcasts';
const READ_KEY = 'scanms_live_broadcasts_read';

// Danh sách phát sóng livestream chỉ lưu trữ các phiên thực tế do Chủ Shop tạo


export const liveBroadcastService = {
  // Phát sóng phiên livestream tới toàn bộ 5 role
  broadcastLive(params: {
    sessionId: string;
    title: string;
    storeName?: string;
    creatorName?: string;
    liveUrl?: string;
    discountText?: string;
    endsAt?: string;
  }): LiveBroadcastItem {
    const newItem: LiveBroadcastItem = {
      id: `live-broadcast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionId: params.sessionId,
      title: params.title || 'Phiên livestream đặc biệt đang lên sóng',
      storeName: params.storeName || 'Gian Hàng Đối Tác SCANMS',
      creatorName: params.creatorName || 'KOC Đối Tác',
      liveUrl: params.liveUrl || `/live/${params.sessionId}`,
      discountText: params.discountText || 'Voucher độc quyền trong live',
      isLive: true,
      createdAt: new Date().toISOString(),
      endsAt: params.endsAt,
      isRead: false,
    };

    try {
      const current = liveBroadcastService.getAllBroadcasts();
      const filtered = current.filter((b) => b.sessionId !== newItem.sessionId);
      const updated = [newItem, ...filtered].slice(0, 10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Dispatch real-time custom event to all listeners (chuông thông báo của tất cả user)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('scanms-new-live-broadcast', { detail: newItem })
        );
      }
    } catch (e) {
      console.error('Failed to save live broadcast', e);
    }

    return newItem;
  },

  // Kết thúc phiên live: xóa khỏi thông báo đang phát sóng và cập nhật chuông
  endBroadcast(sessionId: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const items: LiveBroadcastItem[] = raw ? JSON.parse(raw) : [];
      const updated = items.filter((b) => b.sessionId !== sessionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('scanms-new-live-broadcast', { detail: { endedSessionId: sessionId } })
        );
      }
    } catch (e) {
      console.error('Failed to end live broadcast', e);
    }
  },

  // Lấy toàn bộ danh sách livestream đã phát sóng (tự động loại bỏ phiên đã hết hạn)
  getAllBroadcasts(): LiveBroadcastItem[] {
    try {
      const readIds = liveBroadcastService.getReadIds();
      const raw = localStorage.getItem(STORAGE_KEY);
      let items: LiveBroadcastItem[] = raw ? JSON.parse(raw) : [];

      if (!items || !Array.isArray(items)) {
        items = [];
      }

      const now = Date.now();
      // Tự động lọc bỏ các phiên mẫu cũ hoặc các phiên đã qua thời gian kết thúc endsAt
      const validItems = items.filter((item) => {
        if (!item || item.sessionId === 'demo' || item.id === 'live-broadcast-default-1') return false;
        if (!item.endsAt) return true;
        const endTime = new Date(item.endsAt).getTime();
        return Number.isFinite(endTime) && endTime > now;
      });

      // Cập nhật lại localStorage nếu danh sách đã thay đổi (dọn dẹp phiên hết hạn)
      if (validItems.length !== items.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems));
      }

      return validItems.map((item) => ({
        ...item,
        isRead: readIds.has(item.id),
      }));
    } catch {
      return [];
    }
  },

  getUnreadBroadcasts(): LiveBroadcastItem[] {
    return liveBroadcastService.getAllBroadcasts().filter((b) => !b.isRead);
  },

  getReadIds(): Set<string> {
    try {
      const raw = localStorage.getItem(READ_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  },

  markAsRead(id: string): void {
    try {
      const readIds = liveBroadcastService.getReadIds();
      readIds.add(id);
      localStorage.setItem(READ_KEY, JSON.stringify(Array.from(readIds)));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('scanms-live-broadcast-read', { detail: { id } }));
      }
    } catch (e) {
      console.error('Failed to mark live broadcast as read', e);
    }
  },

  markAllAsRead(): void {
    try {
      const all = liveBroadcastService.getAllBroadcasts();
      const readIds = new Set(all.map((item) => item.id));
      localStorage.setItem(READ_KEY, JSON.stringify(Array.from(readIds)));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('scanms-live-broadcast-read', { detail: { all: true } }));
      }
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  },
};
