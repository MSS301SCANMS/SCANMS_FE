import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commissionRulesService } from '../services/commission-rules.service';
import api from '../lib/api';

export const commissionRuleKeys = {
  all: ['commission-rules'] as const,
  list: (storeId: string) => ['commission-rules', 'list', storeId] as const,
  detail: (storeId: string, ruleId: string) => ['commission-rules', 'detail', storeId, ruleId] as const,
  history: (storeId: string, yearMonth?: string) => ['commission-rules', 'history', storeId, yearMonth] as const,
  kolProgress: (storeId: string, collaboratorId: string, yearMonth?: string) =>
    ['commission-rules', 'kol-progress', storeId, collaboratorId, yearMonth] as const,
  myBonusProgress: (storeId: string, yearMonth?: string) =>
    ['commission-rules', 'my-bonus-progress', storeId, yearMonth] as const,
  myBonusHistory: (storeId?: string, yearMonth?: string) =>
    ['commission-rules', 'my-bonus-history', storeId, yearMonth] as const,
  collaboratorStores: (discovery?: boolean) => ['commission-rules', 'collaborator-stores', discovery] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useCommissionRules(storeId: string) {
  return useQuery({
    queryKey: commissionRuleKeys.list(storeId),
    queryFn: () => commissionRulesService.getRules(storeId),
    enabled: Boolean(storeId),
  });
}

export function useCommissionRule(storeId: string, ruleId: string) {
  return useQuery({
    queryKey: commissionRuleKeys.detail(storeId, ruleId),
    queryFn: () => commissionRulesService.getRule(storeId, ruleId),
    enabled: Boolean(storeId) && Boolean(ruleId),
  });
}

export function useSettlementHistory(storeId: string, yearMonth?: string) {
  return useQuery({
    queryKey: commissionRuleKeys.history(storeId, yearMonth),
    queryFn: () => commissionRulesService.getSettlementHistory(storeId, yearMonth),
    enabled: Boolean(storeId),
  });
}

export function useKolBonusProgress(storeId: string, collaboratorId: string, yearMonth?: string) {
  return useQuery({
    queryKey: commissionRuleKeys.kolProgress(storeId, collaboratorId, yearMonth),
    queryFn: () => commissionRulesService.getKolProgress(storeId, collaboratorId, yearMonth),
    enabled: Boolean(storeId) && Boolean(collaboratorId),
  });
}

export function useMyBonusProgress(storeId: string, yearMonth?: string) {
  return useQuery({
    queryKey: commissionRuleKeys.myBonusProgress(storeId, yearMonth),
    queryFn: () => commissionRulesService.getMyBonusProgress(storeId, yearMonth),
    enabled: Boolean(storeId),
  });
}

export function useMyBonusHistory(storeId?: string, yearMonth?: string) {
  return useQuery({
    queryKey: commissionRuleKeys.myBonusHistory(storeId, yearMonth),
    queryFn: () => commissionRulesService.getMyBonusHistory(storeId, yearMonth),
  });
}

export function useCollaboratorStores(discovery?: boolean) {
  return useQuery({
    queryKey: commissionRuleKeys.collaboratorStores(discovery),
    queryFn: () => commissionRulesService.getCollaboratorStores(discovery),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateCommissionRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storeId,
      data,
    }: {
      storeId: string;
      data: Parameters<typeof commissionRulesService.createRule>[1];
    }) => commissionRulesService.createRule(storeId, data),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: commissionRuleKeys.list(storeId) });
    },
  });
}

export function useUpdateCommissionRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storeId,
      ruleId,
      data,
    }: {
      storeId: string;
      ruleId: string;
      data: Parameters<typeof commissionRulesService.updateRule>[2];
    }) => commissionRulesService.updateRule(storeId, ruleId, data),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: commissionRuleKeys.list(storeId) });
    },
  });
}

export function useToggleCommissionRuleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, ruleId, isActive }: { storeId: string; ruleId: string; isActive: boolean }) =>
      commissionRulesService.updateStatus(storeId, ruleId, isActive),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: commissionRuleKeys.list(storeId) });
    },
  });
}

export function useDeleteCommissionRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, ruleId }: { storeId: string; ruleId: string }) =>
      commissionRulesService.deleteRule(storeId, ruleId),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: commissionRuleKeys.list(storeId) });
    },
  });
}

export function usePreviewBonus() {
  return useMutation({
    mutationFn: ({ storeId, monthlyRevenue }: { storeId: string; monthlyRevenue: string }) =>
      commissionRulesService.previewBonus(storeId, monthlyRevenue),
  });
}

export function useSettleMonthlyBonus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      storeId,
      collaboratorId,
      yearMonth,
    }: {
      storeId: string;
      collaboratorId: string;
      yearMonth: string;
    }) => commissionRulesService.settleMonthlyBonus(storeId, collaboratorId, yearMonth),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: commissionRuleKeys.history(storeId) });
    },
  });
}

export function useApproveSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, settlementId }: { storeId: string; settlementId: string }) =>
      commissionRulesService.approveSettlement(storeId, settlementId),
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: commissionRuleKeys.history(storeId) });
    },
  });
}

/**
 * Khởi tạo Commission cho một OrderItem.
 * Gọi bởi admin thủ công hoặc sau khi payment thành công.
 * Idempotent: gọi nhiều lần với cùng itemId đều an toàn.
 */
export function useInitializeCommission() {
  return useMutation({
    mutationFn: ({ itemId, reason }: { itemId: string; reason?: string }) =>
      api.post(`/finance/commission-initializations/${itemId}`, reason ? { reason } : {}),
  });
}
