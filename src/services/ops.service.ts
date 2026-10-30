import axios from 'axios';
import { installRawSessionAuth } from './auth-session';
import { GATEWAY_ORIGIN } from './system-health';
import { opsPath, type OpsEndpoint } from './ops-format';

/** Client riêng (không đổi lỗi thành Error trơn như finance.service) để giữ mã HTTP phục vụ phân loại lỗi. */
const client = axios.create({ baseURL: GATEWAY_ORIGIN, timeout: 10_000 });
installRawSessionAuth(client);

export interface OpsDependency {
  name: string;
  status: 'UP' | 'DOWN';
  latencyMs: number;
  detail: string | null;
}

export interface OpsInfo {
  service: string;
  port: number | null;
  process: {
    pid: number;
    host: string | null;
    javaVersion: string;
    javaVendor: string;
    springBootVersion: string;
    os: string;
    startedAt: string;
    uptimeMs: number;
  };
  memory: { heapUsedBytes: number; heapMaxBytes: number; nonHeapUsedBytes: number };
  threads: { live: number; peak: number };
  profiles: string[];
  dependencies: OpsDependency[];
  generatedAt: string;
}

export interface OpsLogEntry {
  time: number;
  level: string;
  logger: string;
  thread: string;
  message: string;
}

export interface OpsErrorEntry {
  time: number;
  logger: string;
  thread: string;
  message: string;
  stackTrace: string | null;
}

export interface OpsLogs {
  service: string;
  capacity: number;
  size: number;
  level: string;
  entries: OpsLogEntry[];
  errors: OpsErrorEntry[];
  note: string;
}

export interface GatewayRoutes {
  count: number;
  routes: { id: string; order: number; predicate: string; target: string }[];
  jwtIssuer: string | null;
}

export interface CountRow {
  key: string;
  count: number;
}

export interface PaymentOverview {
  config: {
    sandboxEnabled: boolean;
    automaticPayouts: boolean;
    payoutDelayMs: number;
    minimumWithdrawalVnd: number;
    paymentProviderConfigured: boolean;
    payoutProviderConfigured: boolean;
    bankEncryptionKeyConfigured: boolean;
    serviceTokenConfigured: boolean;
    financeOutboxConfigured: boolean;
  };
  financeEvents: { pending: number; blocked: number };
  paymentsByStatus: CountRow[];
  withdrawalsByStatus: CountRow[];
  walletsByOwnerType: CountRow[];
}

function pathFor(serviceId: string, endpoint: OpsEndpoint) {
  const path = opsPath(serviceId, endpoint);
  if (!path) throw Object.assign(new Error('Service chưa được hỗ trợ'), { status: 404 });
  return path;
}

export const opsService = {
  info: async (serviceId: string) => (await client.get<OpsInfo>(pathFor(serviceId, 'scanmsinfo'))).data,
  logs: async (serviceId: string, level = 'ALL') =>
    (await client.get<OpsLogs>(pathFor(serviceId, 'scanmslogs'), { params: { level } })).data,
  gatewayRoutes: async () => (await client.get<GatewayRoutes>('/actuator/scanmsroutes')).data,
  paymentOverview: async () =>
    (await client.get<{ result: PaymentOverview }>('/api/v1/finance/system/overview')).data.result,
};
