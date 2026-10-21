/**
 * Probe sức khỏe hệ thống qua các route public của gateway (không cần JWT).
 * Dùng chung cho trang Giám sát hệ thống và trang Tổng quan admin.
 */

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

export type ServiceDef = { id: string; name: string; url: string };

/**
 *  - gateway: /v3/api-docs/swagger-config (do chính gateway trả về)
 *  - service: /openapi/{svc} → gateway forward tới /v3/api-docs của service
 */
export const HEALTH_SERVICES: ServiceDef[] = [
  { id: 'scanms-gateway', name: 'API Gateway', url: `${GATEWAY_ORIGIN}/v3/api-docs/swagger-config` },
  { id: 'user-service', name: 'User Service', url: `${GATEWAY_ORIGIN}/openapi/user` },
  { id: 'product-service', name: 'Product Service', url: `${GATEWAY_ORIGIN}/openapi/product` },
  { id: 'order-service', name: 'Order Service', url: `${GATEWAY_ORIGIN}/openapi/order` },
  { id: 'payment-service', name: 'Payment Service', url: `${GATEWAY_ORIGIN}/openapi/payment` },
  { id: 'promotion-affiliate-service', name: 'Promotion Service', url: `${GATEWAY_ORIGIN}/openapi/promotion` },
];

export type ProbeResult = {
  up: boolean;
  ms: number | null;
  httpStatus?: number;
  message: string;
  json?: any;
};

export type OverallStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export type HealthSnapshot = {
  services: Record<string, ProbeResult>;
  keycloak: ProbeResult;
  checkedAt: Date;
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
      return { up: false, ms, httpStatus: res.status, message: `Không thể kết nối service (HTTP ${res.status})` };
    }
    return { up: true, ms, httpStatus: res.status, message: 'Service đang hoạt động' };
  } catch (err: any) {
    const timeout = err?.name === 'AbortError';
    return { up: false, ms: null, message: timeout ? 'Quá thời gian phản hồi' : 'Không thể kết nối service' };
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

export async function runHealthCheck(): Promise<HealthSnapshot> {
  const [entries, keycloak] = await Promise.all([
    Promise.all(HEALTH_SERVICES.map(async (s) => [s.id, await probeService(s.url)] as const)),
    probeKeycloak(),
  ]);
  const services = Object.fromEntries(entries) as Record<string, ProbeResult>;
  const ups = Object.values(services).filter((r) => r.up);
  const upCount = ups.length;
  const total = HEALTH_SERVICES.length;
  const msList = ups.map((r) => r.ms).filter((m): m is number => m != null);
  const avgMs = msList.length ? Math.round(msList.reduce((a, b) => a + b, 0) / msList.length) : null;
  const overall: OverallStatus =
    upCount === 0 ? 'DOWN' : upCount === total && keycloak.up ? 'HEALTHY' : 'DEGRADED';
  return { services, keycloak, checkedAt: new Date(), upCount, total, avgMs, overall };
}

export const OVERALL_LABEL: Record<OverallStatus, string> = {
  HEALTHY: 'Ổn định',
  DEGRADED: 'Không ổn định',
  DOWN: 'Ngừng hoạt động',
};
