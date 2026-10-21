import api from './api';

/** Một bucket thời gian do BE trả về (start là LocalDateTime giờ server, đã lấp đủ bucket rỗng = 0). */
export type StatsBucket = { start: string | number[]; count: number };

/** Khớp `AdminStatsResponse` ở user/product/order-service. */
export type AdminStats = {
  total: number;
  newToday: number;
  newLast7Days: number;
  newLast30Days: number;
  byStatus: Record<string, number>;
  /** 24 bucket theo giờ, kết thúc ở giờ hiện tại. */
  hourly: StatsBucket[];
  /** 30 bucket theo ngày, kết thúc ở hôm nay. */
  daily: StatsBucket[];
  /** 6 bucket theo tháng, kết thúc ở tháng hiện tại. */
  monthly: StatsBucket[];
  generatedAt: string;
};

export type AdminStatsKey = 'users' | 'stores' | 'products' | 'orders';

const ENDPOINTS: Record<AdminStatsKey, string> = {
  users: '/users/admin/stats',
  stores: '/stores/admin/stats',
  products: '/products/admin/stats',
  orders: '/orders/admin/stats',
};

export const adminStatsService = {
  async get(key: AdminStatsKey): Promise<AdminStats> {
    const res: any = await api.get(ENDPOINTS[key], { headers: { 'x-skip-cache': 'true' } });
    return res?.result ?? res?.data ?? res;
  },
};

/** LocalDateTime của Jackson có thể là chuỗi ISO hoặc mảng [y, M, d, h, m, s]. */
export function bucketDate(start: StatsBucket['start']): Date {
  if (Array.isArray(start)) {
    const [y, mo = 1, d = 1, h = 0, mi = 0, s = 0] = start;
    return new Date(y, mo - 1, d, h, mi, s);
  }
  return new Date(start);
}
