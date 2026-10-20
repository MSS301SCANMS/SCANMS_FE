/**
 * In-Memory & Session Client Cache for Axios
 * Giúp lưu tạm dữ liệu API để khi người dùng chuyển trang qua lại,
 * nội dung xuất hiện ngay lập tức (0ms) mà không phải reload hay hiện spinner chớp tắt.
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttlMs: number;
}

const MAX_CACHE_ENTRIES = 120;
const memoryCache = new Map<string, CacheEntry>();

// Danh sách các tiền tố URL an toàn được phép lưu tạm (Cache-friendly GET requests)
const CACHEABLE_URL_PREFIXES = [
  '/stores',
  '/products',
  '/orders',
  '/chat/conversations',
  '/wallets',
  '/payouts',
  '/analytics',
  '/audit',
  '/kyc/profile',
  '/kyc/pending',
  '/social-channels',
  '/sample-requests',
  '/media',
  '/tiers',
  '/campaigns',
  '/coupons',
  '/referral-links',
  '/returns',
];

function generateKey(url: string, params?: any): string {
  const paramStr = params ? JSON.stringify(params) : '';
  return `${url}::${paramStr}`;
}

export const apiCache = {
  /**
   * Kiểm tra xem URL này có đủ điều kiện lưu tạm không
   */
  isCacheable(url?: string): boolean {
    if (!url) return false;
    // Không cache các endpoint auth hoặc nhạy cảm
    if (
      url.includes('/auth/') ||
      url.includes('/refresh') ||
      url.includes('/otp') ||
      url.includes('/sample-requests') ||
      url.includes('/wallets') ||
      url.includes('/payouts') ||
      url.includes('/wallets/top-up-demo')
    ) {
      return false;
    }
    return CACHEABLE_URL_PREFIXES.some((prefix) => url.includes(prefix));
  },

  /**
   * Xác định domain dữ liệu bị ảnh hưởng khi có POST/PUT/PATCH/DELETE
   * để chỉ xóa cache liên quan, tránh xóa nhầm dữ liệu của các trang khác.
   */
  getAffectedDomain(url?: string): string | null {
    if (!url) return null;
    // Đọc tin nhắn chat không cần xóa danh sách tin nhắn hoặc cuộc trò chuyện
    if (url.includes('/chat/conversations/') && url.includes('/read')) {
      return null;
    }
    // Shipping creates the waybill and changes the purchase order's fulfillment state.
    if (url.includes('/shipping/ghn/create-order/')) return '/orders';
    if (url.includes('/shipping/ghn/simulation/')) return '/orders';
    if (url.includes('/orders')) return '/orders';
    if (url.includes('/products')) return '/products';
    if (url.includes('/chat')) return '/chat';
    if (url.includes('/wallets') || url.includes('/payouts')) return '/wallets';
    if (url.includes('/coupons')) return '/coupons';
    if (url.includes('/stores')) return '/stores';
    if (url.includes('/sample-requests')) return '/sample-requests';
    if (url.includes('/kyc')) return '/kyc';
    if (url.includes('/returns')) return '/returns';
    if (url.includes('/campaigns')) return '/campaigns';
    return null;
  },

  /**
   * Lấy dữ liệu đã lưu tạm (sống suốt phiên tab cho tới khi F5 hoặc mutate)
   * Sử dụng cơ chế LRU: truy cập vào entry nào thì đưa entry đó lên đầu
   */
  get<T = any>(url: string, params?: any): T | null {
    const key = generateKey(url, params);
    const entry = memoryCache.get(key);
    if (!entry) return null;

    // Kiểm tra nếu có thiết lập TTL hữu hạn riêng biệt
    if (entry.ttlMs && entry.ttlMs !== Infinity) {
      const now = Date.now();
      if (now - entry.timestamp > entry.ttlMs) {
        memoryCache.delete(key);
        return null;
      }
    }

    // Đẩy entry lên vị trí mới nhất (LRU hit)
    memoryCache.delete(key);
    memoryCache.set(key, entry);

    return entry.data as T;
  },

  /**
   * Kiểm tra xem dữ liệu đã có trong cache chưa
   */
  has(url: string, params?: any): boolean {
    const key = generateKey(url, params);
    return memoryCache.has(key);
  },

  /**
   * Lưu tạm dữ liệu vào bộ nhớ RAM
   * Mặc định lưu suốt phiên làm việc của Tab (ttlMs = Infinity) cho tới khi F5 hoặc Mutate
   * Có cơ chế giới hạn MAX_CACHE_ENTRIES = 120 để chống rò rỉ RAM (Zero Memory Leak)
   */
  set(url: string, params: any, data: any, ttlMs: number = Infinity): void {
    const key = generateKey(url, params);

    // Nếu đã chạm trần 120 mục, xóa mục cũ nhất (mục đầu tiên trong Map)
    if (memoryCache.size >= MAX_CACHE_ENTRIES && !memoryCache.has(key)) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) {
        memoryCache.delete(oldestKey);
      }
    }

    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  },

  /**
   * Xóa cache của một domain hoặc xóa toàn bộ cache khi có thao tác thêm/sửa/xóa
   */
  invalidate(urlPattern?: string | null): void {
    if (urlPattern === null) return; // Bỏ qua nếu là thao tác vô hại (như đánh dấu đã đọc)
    if (!urlPattern) {
      memoryCache.clear();
      return;
    }
    for (const key of memoryCache.keys()) {
      if (key.includes(urlPattern)) {
        memoryCache.delete(key);
      }
    }
  },

  /**
   * Xóa toàn bộ bộ nhớ tạm
   */
  clear(): void {
    memoryCache.clear();
  },
};
