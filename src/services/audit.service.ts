import api from './api';

export type AuditSeverity = 'INFO' | 'WARN' | 'CRITICAL';

export type AuditCategory =
  | 'AUTH'
  | 'FINANCIAL'
  | 'PRODUCT'
  | 'STORE'
  | 'SAMPLE_CAMPAIGN'
  | 'AI_SECURITY'
  | 'SYSTEM'
  | 'OTHER';

export interface AuditActor {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export interface AuditLogItem {
  id: string;
  eventId?: string;
  action: string;
  actionNameVi: string;
  category: AuditCategory;
  severity: AuditSeverity;
  description: string;
  ipAddress: string;
  details?: Record<string, any> | null;
  createdAt: string;
  actor: AuditActor;
}

export interface AuditStats {
  totalEvents: number;
  eventsToday: number;
  financialEventsCount: number;
  securityEventsCount: number;
  authEventsCount: number;
  topActors: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    count: number;
  }>;
  categoryBreakdown: Array<{
    category: AuditCategory;
    categoryNameVi: string;
    count: number;
    percentage: number;
  }>;
  recentSeverityCounts: {
    info: number;
    warn: number;
    critical: number;
  };
}

export interface AuditActionDefinition {
  code: string;
  nameVi: string;
  category: AuditCategory;
  severity: AuditSeverity;
  description: string;
}

export interface AuditQueryFilters {
  page?: number;
  limit?: number;
  action?: string;
  category?: AuditCategory;
  userId?: string;
  role?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  severity?: AuditSeverity;
}

export interface AuditLogsResponse {
  items: AuditLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const auditService = {
  /**
   * Lấy danh sách Audit Logs phân trang và có lọc
   */
  getAuditLogs: async (params?: AuditQueryFilters): Promise<AuditLogsResponse> => {
    const res = await api.get('/audit-logs', { params });
    return res.data?.data || res.data || res;
  },

  /**
   * Lấy thống kê tổng quan KPI Audit Logs
   */
  getAuditStats: async (timeframe?: '24h' | '7d' | '30d' | 'all'): Promise<AuditStats> => {
    const res = await api.get('/audit-logs/stats', {
      params: { timeframe: timeframe || '30d' },
    });
    return res.data?.data || res.data || res;
  },

  /**
   * Lấy danh mục Action codes có sẵn
   */
  getAvailableActions: async (): Promise<AuditActionDefinition[]> => {
    const res = await api.get('/audit-logs/actions');
    return res.data?.data || res.data || res;
  },

  /**
   * Xem chi tiết 1 bản ghi Audit Log theo ID
   */
  getAuditLogById: async (id: string): Promise<AuditLogItem> => {
    const res = await api.get(`/audit-logs/${id}`);
    return res.data?.data || res.data || res;
  },

  /**
   * Xuất file CSV kiểm toán
   */
  exportAuditLogsCsv: async (params?: Partial<AuditQueryFilters>): Promise<Blob> => {
    const res = await api.get('/audit-logs/export', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },
};
