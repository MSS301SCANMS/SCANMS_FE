/**
 * Hàm thuần cho phần chi tiết service (thông tin tiến trình, log): định dạng số liệu, ghép đường dẫn tới
 * endpoint ops qua gateway và phân loại lỗi để hiển thị đúng lý do. Không import module nào khác để test được
 * bằng node.
 */

export type OpsEndpoint = 'scanmsinfo' | 'scanmslogs';

const OPS_KEY: Record<string, string> = {
  'user-service': 'user',
  'product-service': 'product',
  'order-service': 'order',
  'payment-service': 'payment',
  'promotion-affiliate-service': 'promotion',
};

/** Gateway tự trả lời ở /actuator, các service đi qua /api/v1/ops/{khóa}/ rồi gateway viết lại thành /actuator/. */
export function opsPath(serviceId: string, endpoint: OpsEndpoint): string | null {
  if (serviceId === 'scanms-gateway') return `/actuator/${endpoint}`;
  const key = OPS_KEY[serviceId];
  return key ? `/api/v1/ops/${key}/${endpoint}` : null;
}

export function formatBytes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${i === 0 ? size : size.toFixed(size >= 100 ? 0 : 1)} ${units[i]}`;
}

export function percentOf(part: number | null | undefined, total: number | null | undefined): number | null {
  if (part == null || total == null || total <= 0) return null;
  return Math.round((part / total) * 1000) / 10;
}

export type OpsErrorKind = 'unauthenticated' | 'forbidden' | 'unsupported' | 'unavailable' | 'error';

export type OpsFailure = { kind: OpsErrorKind; message: string };

/**
 * Phân loại lỗi khi gọi endpoint ops. Không có phản hồi hoặc gateway báo 502/503/504 nghĩa là service đang
 * ngừng; 404 nghĩa là service chưa chạy bản có scanms-ops-starter.
 */
export function classifyOpsError(err: unknown): OpsFailure {
  const e = err as { status?: number; response?: { status?: number }; name?: string } | undefined;
  const status = e?.status ?? e?.response?.status;
  if (status === 401) return { kind: 'unauthenticated', message: 'Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại.' };
  if (status === 403) return { kind: 'forbidden', message: 'Chỉ quản trị viên (ADMIN, SYSTEM_ADMIN) được xem phần này.' };
  if (status === 404) {
    return { kind: 'unsupported', message: 'Service này chưa chạy bản có thông tin chi tiết. Cần build và chạy lại bản mới.' };
  }
  if (status === undefined || status === 502 || status === 503 || status === 504) {
    return { kind: 'unavailable', message: 'Không đọc được vì service đang ngừng hoạt động hoặc không phản hồi.' };
  }
  return { kind: 'error', message: `Service trả lỗi HTTP ${status}.` };
}
