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

const memoryCache = new Map<string, CacheEntry>();

// Danh sách các tiền tố URL an toàn được phép lưu tạm (Cache-friendly GET requests)
const CACHEABLE_URL_PREFIXES = [
  '/stores',
  '/products',
  '/kyc/profile',
  '/social-channels',
  '/sample-requests',
  '/media',
  '/chat/conversations',
  '/tiers',
  '/campaigns',
  '/wallets',
  '/coupons',
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
    if (url.includes('/auth/') || url.includes('/refresh') || url.includes('/otp')) {
      return false;
    }
    return CACHEABLE_URL_PREFIXES.some((prefix) => url.includes(prefix));
  },

  /**
   * Lấy dữ liệu đã lưu tạm nếu còn hiệu lực (chưa hết hạn TTL)
   */
  get<T = any>(url: string, params?: any): T | null {
    const key = generateKey(url, params);
    const entry = memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttlMs) {
      memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  },

  /**
   * Lưu tạm dữ liệu vào bộ nhớ
   * @param ttlMs Thời gian tồn tại mặc định: 90 giây
   */
  set(url: string, params: any, data: any, ttlMs: number = 90000): void {
    const key = generateKey(url, params);
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  },

  /**
   * Xóa cache của một URL hoặc xóa toàn bộ cache khi có thao tác thêm/sửa/xóa
   */
  invalidate(urlPattern?: string): void {
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
