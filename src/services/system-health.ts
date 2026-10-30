/**
 * Probe sức khỏe hệ thống qua các route public của gateway (không cần JWT).
 * Dùng chung cho trang Giám sát hệ thống và trang Tổng quan admin.
 */

import { financeService, type KafkaStatus } from './finance.service';
import {
  loadHistory,
  recordSample,
  saveHistory,
  type ErrorType,
  type HistoryMap,
} from './system-health-history';

export const HEALTH_AUTO_REFRESH_MS = 30_000;
const PROBE_TIMEOUT_MS = 6_000;

const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
export const GATEWAY_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return 'http://localhost:8080';
  }
})();
export const KEYCLOAK_ISSUER: string =
  import.meta.env.VITE_KEYCLOAK_ISSUER || 'http://localhost:8180/realms/scanms';

export type ServiceDef = { id: string; name: string; url: string; port: number; role: string };

/**
 *  - gateway: /v3/api-docs/swagger-config (do chính gateway trả về)
 *  - service: /openapi/{svc} → gateway forward tới /v3/api-docs của service
 */
const AI_SERVICE_ORIGIN = (() => {
  const configured = import.meta.env.VITE_AI_SERVICE_URL as string | undefined;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through */
    }
  }
  return 'http://localhost:8000';
})();

export const HEALTH_SERVICES: ServiceDef[] = [
  { id: 'scanms-gateway', name: 'API Gateway', url: `${GATEWAY_ORIGIN}/v3/api-docs/swagger-config`, port: 8080, role: 'Cổng vào duy nhất, định tuyến và xác thực JWT' },
  { id: 'user-service', name: 'User Service', url: `${GATEWAY_ORIGIN}/openapi/user`, port: 8081, role: 'Tài khoản, đăng nhập, phân quyền' },
  { id: 'product-service', name: 'Product Service', url: `${GATEWAY_ORIGIN}/openapi/product`, port: 8082, role: 'Cửa hàng, sản phẩm, livestream, video ngắn' },
  { id: 'order-service', name: 'Order Service', url: `${GATEWAY_ORIGIN}/openapi/order`, port: 8083, role: 'Giỏ hàng, thanh toán đơn, giao hàng, đổi trả' },
  { id: 'payment-service', name: 'Payment Service', url: `${GATEWAY_ORIGIN}/openapi/payment`, port: 8084, role: 'Ví, thanh toán payOS, rút tiền, quyết toán' },
  { id: 'promotion-affiliate-service', name: 'Promotion Service', url: `${GATEWAY_ORIGIN}/openapi/promotion`, port: 8085, role: 'Khuyến mãi, voucher, tiếp thị liên kết' },
  // AI không qua Spring OpenAPI — probe health FastAPI trực tiếp (kèm trạng thái Kafka trong payload).
  { id: 'ai-service', name: 'AI Service', url: `${AI_SERVICE_ORIGIN}/api/v1/ai/health`, port: 8000, role: 'Nhận diện trang phục, màu sắc, style và gợi ý phối đồ' },
];

export type ProbeResult = {
  up: boolean;
  ms: number | null;
  httpStatus?: number;
  /** Cách lần kiểm tra thất bại, dùng để gợi ý nguyên nhân. */
  errorType?: ErrorType;
  message: string;
  json?: any;
};

/** unknown = chưa lấy được (chưa đăng nhập quyền admin / payment-service tắt), không tính là lỗi Kafka. */
export type KafkaProbe = {
  state: 'up' | 'down' | 'unknown';
  ms: number | null;
  message: string;
  data?: KafkaStatus;
};

export type OverallStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export type HealthSnapshot = {
  services: Record<string, ProbeResult>;
  keycloak: ProbeResult;
  kafka: KafkaProbe;
  checkedAt: Date;
  /** Lịch sử quan sát của trình duyệt này, đã gồm lần kiểm tra vừa rồi. */
  history: HistoryMap;
  upCount: number;
  total: number;
  /** Thời gian phản hồi trung bình của các service đang hoạt động (ms). */
  avgMs: number | null;
  overall: OverallStatus;
};

async function timedFetch(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const started = performance.now();
  try {
    const res = await fetch(url, { cache: 'no-store', ...init, signal: controller.signal });
    return { res, ms: Math.round(performance.now() - started) };
  } finally {
    window.clearTimeout(timer);
  }
}

/** 2xx/3xx/4xx = service vẫn phản hồi; 5xx hoặc lỗi mạng/timeout = ngừng hoạt động. */
export async function probeService(url: string): Promise<ProbeResult> {
  try {
    const { res, ms } = await timedFetch(url);
    if (res.status >= 500) {
      return { up: false, ms, httpStatus: res.status, errorType: 'http5xx', message: `Không thể kết nối service (HTTP ${res.status})` };
    }
    return { up: true, ms, httpStatus: res.status, message: 'Service đang hoạt động' };
  } catch (err: any) {
    const timeout = err?.name === 'AbortError';
    return {
      up: false,
      ms: null,
      errorType: timeout ? 'timeout' : 'network',
      message: timeout ? 'Quá thời gian phản hồi' : 'Không thể kết nối service',
    };
  }
}

export async function probeKeycloak(): Promise<ProbeResult> {
  const url = `${KEYCLOAK_ISSUER}/.well-known/openid-configuration`;
  try {
    const { res, ms } = await timedFetch(url);
    if (!res.ok) {
      return { up: res.status < 500, ms, httpStatus: res.status, message: `Keycloak trả về HTTP ${res.status}` };
    }
    const json = await res.json().catch(() => undefined);
    return { up: true, ms, httpStatus: res.status, message: 'Keycloak đang hoạt động', json };
  } catch (err: any) {
    if (err?.name === 'AbortError') return { up: false, ms: null, message: 'Quá thời gian phản hồi' };
    // Có thể bị chặn CORS → thử no-cors để kiểm tra server còn sống không.
    try {
      const { ms } = await timedFetch(url, { mode: 'no-cors' });
      return { up: true, ms, message: 'Keycloak đang hoạt động' };
    } catch {
      return { up: false, ms: null, message: 'Không thể kết nối Keycloak' };
    }
  }
}

export async function probeKafka(): Promise<KafkaProbe> {
  try {
    const data = await financeService.kafkaStatus();
    if (!data.up) return { state: 'down', ms: null, message: data.message || 'Không kết nối được broker Kafka', data };
    return { state: 'up', ms: data.latencyMs ?? null, message: 'Kafka đang hoạt động', data };
  } catch (err: any) {
    return { state: 'unknown', ms: null, message: err?.message || 'Không lấy được trạng thái Kafka' };
  }
}

export async function runHealthCheck(): Promise<HealthSnapshot> {
  const [entries, keycloak, kafka] = await Promise.all([
    Promise.all(HEALTH_SERVICES.map(async (s) => [s.id, await probeService(s.url)] as const)),
    probeKeycloak(),
    probeKafka(),
  ]);
  const services = Object.fromEntries(entries) as Record<string, ProbeResult>;
  const checkedAt = new Date();
  const storage = typeof window !== 'undefined' ? window.localStorage : undefined;
  const history = loadHistory(storage);
  for (const [id, r] of Object.entries(services)) {
    history[id] = recordSample(history[id], {
      t: checkedAt.getTime(),
      up: r.up,
      ms: r.ms,
      status: r.httpStatus,
      err: r.errorType,
    });
  }
  saveHistory(storage, history);
  const ups = Object.values(services).filter((r) => r.up);
  const upCount = ups.length;
  const total = HEALTH_SERVICES.length;
  const msList = ups.map((r) => r.ms).filter((m): m is number => m != null);
  const avgMs = msList.length ? Math.round(msList.reduce((a, b) => a + b, 0) / msList.length) : null;
  const overall: OverallStatus =
    upCount === 0 ? 'DOWN' : upCount === total && keycloak.up && kafka.state !== 'down' ? 'HEALTHY' : 'DEGRADED';
  return { services, keycloak, kafka, checkedAt, history, upCount, total, avgMs, overall };
}

export const OVERALL_LABEL: Record<OverallStatus, string> = {
  HEALTHY: 'Ổn định',
  DEGRADED: 'Không ổn định',
  DOWN: 'Ngừng hoạt động',
};

export type ApiInfo = {
  title: string | null;
  version: string | null;
  endpoints: number;
  operations: number;
  tags: string[];
  /** Gateway: số tài liệu API mà nó gom lại (swagger-config). */
  documents?: number;
};

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/** Đọc tài liệu OpenAPI công khai của service (chỉ có khi service đang chạy). */
export async function fetchApiInfo(def: ServiceDef): Promise<ApiInfo> {
  const { res } = await timedFetch(def.url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (Array.isArray(json?.urls)) {
    return { title: 'Tài liệu API gom bởi Gateway', version: null, endpoints: 0, operations: 0, tags: [], documents: json.urls.length };
  }
  const paths = (json?.paths ?? {}) as Record<string, Record<string, unknown>>;
  const operations = Object.values(paths).reduce(
    (n, item) => n + HTTP_METHODS.filter((m) => item && m in item).length,
    0,
  );
  const tags: string[] = Array.isArray(json?.tags)
    ? json.tags.map((t: { name?: string }) => t?.name).filter(Boolean)
    : [];
  return {
    title: json?.info?.title ?? null,
    version: json?.info?.version ?? null,
    endpoints: Object.keys(paths).length,
    operations,
    tags,
  };
}
