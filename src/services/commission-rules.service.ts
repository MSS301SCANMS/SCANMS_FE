import api from './api';

export interface CommissionRule {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  minMonthlyRevenue: string;
  achievementBonus: string;
  bonusPercentage: string;
  isActive: boolean;
  version: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RangeBonusItem {
  from: string;
  to: string;
  rate: string;
  revenue: string;
  bonus: string;
}

export interface HighestReachedRule {
  id: string;
  name: string;
  minMonthlyRevenue: string;
  achievementBonus: string;
}

export interface BonusPreviewResult {
  monthlyRevenue: string;
  highestReachedRule: HighestReachedRule | null;
  achievementBonus: string;
  rangeBonuses: RangeBonusItem[];
  totalBonus: string;
  formula: string;
}

export interface SettlementHistoryItem {
  id: string;
  storeId: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorEmail: string;
  yearMonth: string;
  validRevenue: string;
  appliedRuleId: string | null;
  appliedRuleName: string;
  bonusPercentage: string;
  bonusAmount: string;
  ruleSnapshot: any;
  status: string;
  settledAt: string;
}

export interface SettlementResponse {
  isAlreadySettled: boolean;
  message: string;
  settlement: {
    id: string;
    storeId: string;
    collaboratorId: string;
    yearMonth: string;
    validRevenue: string;
    appliedRuleId: string | null;
    appliedRuleName: string;
    bonusPercentage: string;
    bonusAmount: string;
    ruleSnapshot: any;
    status: string;
    settledAt: string;
  };
}

export const commissionRulesService = {

  async getRules(storeId: string): Promise<CommissionRule[]> {
    const res: any = await api.get(`/stores/${storeId}/commission-rules`);
    return res.data || res;
  },

  async getRule(storeId: string, ruleId: string): Promise<CommissionRule> {
    const res: any = await api.get(
      `/stores/${storeId}/commission-rules/${ruleId}`,
    );
    return res.data || res;
  },

  async createRule(
    storeId: string,
    data: {
      name: string;
      description?: string;
      minMonthlyRevenue: string;
      achievementBonus?: string;
      bonusPercentage: string;
      isActive?: boolean;
    },
  ): Promise<CommissionRule> {
    const res: any = await api.post(
      `/stores/${storeId}/commission-rules`,
      data,
    );
    return res.data || res;
  },

  async updateRule(
    storeId: string,
    ruleId: string,
    data: {
      name?: string;
      description?: string;
      minMonthlyRevenue?: string;
      achievementBonus?: string;
      bonusPercentage?: string;
      isActive?: boolean;
    },
  ): Promise<CommissionRule> {
    const res: any = await api.patch(
      `/stores/${storeId}/commission-rules/${ruleId}`,
      data,
    );
    return res.data || res;
  },

  async updateStatus(
    storeId: string,
    ruleId: string,
    isActive: boolean,
  ): Promise<{ id: string; name: string; isActive: boolean; message: string }> {
    const res: any = await api.patch(
      `/stores/${storeId}/commission-rules/${ruleId}/status`,
      { isActive },
    );
    return res.data || res;
  },

  async deleteRule(
    storeId: string,
    ruleId: string,
  ): Promise<{ success: boolean; message: string }> {
    const res: any = await api.delete(
      `/stores/${storeId}/commission-rules/${ruleId}`,
    );
    return res.data || res;
  },

  async previewBonus(
    storeId: string,
    monthlyRevenue: string,
  ): Promise<BonusPreviewResult> {
    const res: any = await api.post(
      `/stores/${storeId}/commission-rules/preview`,
      { monthlyRevenue },
    );
    return res.data || res;
  },

  async settleMonthlyBonus(
    storeId: string,
    collaboratorId: string,
    yearMonth: string,
  ): Promise<SettlementResponse> {
    const res: any = await api.post(
      `/stores/${storeId}/commission-rules/settle`,
      { collaboratorId, yearMonth },
    );
    return res.data || res;
  },

  async getSettlementHistory(
    storeId: string,
    yearMonth?: string,
  ): Promise<SettlementHistoryItem[]> {
    const res: any = await api.get(
      `/stores/${storeId}/commission-rules/history`,
      {
        params: yearMonth ? { yearMonth } : {},
      },
    );
    return res.data || res;
  },

  async approveSettlement(
    storeId: string,
    settlementId: string,
  ): Promise<{ success: boolean; message: string; settlement: any }> {
    const res: any = await api.patch(
      `/stores/${storeId}/commission-rules/settlements/${settlementId}/approve`,
    );
    return res.data || res;
  },

  async payoutSettlement(
    storeId: string,
    settlementId: string,
  ): Promise<{ success: boolean; message: string; settlement: any; ledger: any }> {
    const res: any = await api.post(
      `/stores/${storeId}/commission-rules/settlements/${settlementId}/payout`,
    );
    return res.data || res;
  },

  async restoreRule(
    storeId: string,
    ruleId: string,
  ): Promise<{ success: boolean; message: string; id: string }> {
    const res: any = await api.post(
      `/stores/${storeId}/commission-rules/${ruleId}/restore`,
    );
    return res.data || res;
  },

  async handleRefund(
    storeId: string,
    data: { orderId: string; refundAmount: string; reason: string },
  ): Promise<{ success: boolean; message: string; refund: any; adjustment: any }> {
    const res: any = await api.post(
      `/stores/${storeId}/commission-rules/adjustments/refund`,
      data,
    );
    return res.data || res;
  },

  async getKolProgress(
    storeId: string,
    collaboratorId: string,
    yearMonth?: string,
  ): Promise<any> {
    const res: any = await api.get(
      `/stores/${storeId}/commission-rules/kol-progress/${collaboratorId}`,
      { params: yearMonth ? { yearMonth } : {} },
    );
    return res.data || res;
  },

  async getMyBonusProgress(
    storeId: string,
    yearMonth?: string,
  ): Promise<any> {
    const res: any = await api.get(
      `/collaborator/stores/${storeId}/bonus-progress`,
      { params: yearMonth ? { yearMonth } : {} },
    );
    return res.data || res;
  },

  async getMyBonusHistory(
    storeId?: string,
    yearMonth?: string,
  ): Promise<any> {
    const params: any = {};
    if (storeId) params.storeId = storeId;
    if (yearMonth) params.yearMonth = yearMonth;
    const res: any = await api.get('/collaborator/bonus-history', { params });
    return res.data || res;
  },

  async getCollaboratorStores(discovery?: boolean): Promise<any[]> {
    const params = discovery !== undefined ? { discovery } : {};
    const res: any = await api.get('/collaborator/stores', { params });
    return res.data || res;
  },
};

export default commissionRulesService;
