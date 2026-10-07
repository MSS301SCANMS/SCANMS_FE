import { useMutation, useQuery } from '@tanstack/react-query';
import { auditService, type AuditQueryFilters } from '../services/audit.service';

export const auditKeys = {
  logs: (params?: object) => ['audit', 'logs', params] as const,
  stats: (timeframe?: string) => ['audit', 'stats', timeframe] as const,
  actions: ['audit', 'actions'] as const,
  detail: (id: string) => ['audit', 'detail', id] as const,
};

export function useAuditLogs(params?: AuditQueryFilters) {
  return useQuery({
    queryKey: auditKeys.logs(params),
    queryFn: () => auditService.getAuditLogs(params),
  });
}

export function useAuditStats(timeframe?: '24h' | '7d' | '30d' | 'all') {
  return useQuery({
    queryKey: auditKeys.stats(timeframe),
    queryFn: () => auditService.getAuditStats(timeframe),
  });
}

export function useAvailableAuditActions() {
  return useQuery({
    queryKey: auditKeys.actions,
    queryFn: () => auditService.getAvailableActions(),
    staleTime: 1000 * 60 * 30, // action codes hiếm thay đổi
  });
}

export function useAuditLogDetail(id: string) {
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: () => auditService.getAuditLogById(id),
    enabled: Boolean(id),
  });
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: (params?: Partial<AuditQueryFilters>) => auditService.exportAuditLogsCsv(params),
  });
}
