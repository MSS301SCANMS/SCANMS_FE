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

function mapPolicy(raw: any, storeId?: string): CommissionRule {
  // BE lưu commissionRate theo % (10 = 10%), FE form cũng dùng %
  const ratePct = Number(raw.commissionRate ?? 0);
  return {
    id: raw.id || raw.policyId,
    storeId: raw.storeId || storeId || '',
    name: raw.policyName || raw.name || 'Policy',
    description: `Scope ${raw.scopeType || 'STORE'} · return ${raw.returnWindowDays ?? 14}d`,
    minMonthlyRevenue: '0',
    achievementBonus: '0',
    bonusPercentage: String(ratePct),
    isActive: String(raw.status || '').toUpperCase() === 'ACTIVE',
    version: Number(raw.priority || 1),
    effectiveFrom: raw.validFrom || null,
    effectiveTo: raw.validTo || null,
    createdBy: null,
    updatedBy: null,
    createdAt: raw.validFrom || new Date().toISOString(),
    updatedAt: raw.validFrom || new Date().toISOString(),
  };
}

/** Map Nest commission-rules → Spring /commission-policies */
export const commissionRulesService = {

  async getRules(storeId: string): Promise<CommissionRule[]> {
    const res: any = await api.get('/commission-policies');
    const list = res?.result ?? res?.data ?? [];
    return (Array.isArray(list) ? list : [])
      .filter((p: any) => !storeId || p.storeId === storeId)
      .map((p: any) => mapPolicy(p, storeId));
  },

  async getRule(_storeId: string, ruleId: string): Promise<CommissionRule> {
    const res: any = await api.get(`/commission-policies/${ruleId}`);
    return mapPolicy(res?.result ?? res?.data ?? res);
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
    const res: any = await api.post('/commission-policies', {
      policyName: data.name,
      scopeType: 'STORE',
      storeId,
      // Percent: 10 = 10% (finalize chia /100)
      commissionRate: Number(data.bonusPercentage),
      returnWindowDays: 14,
      validFrom: new Date().toISOString(),
      status: data.isActive === false ? 'INACTIVE' : 'ACTIVE',
      priority: 1,
    });
    return mapPolicy(res?.result ?? res?.data ?? res, storeId);
  },

  async updateRule(_storeId: string, _ruleId: string, _data: any): Promise<CommissionRule> {
    throw new Error('BE chưa hỗ trợ cập nhật commission policy.');
  },

  async updateStatus(_storeId: string, ruleId: string, isActive: boolean) {
    return { id: ruleId, name: '', isActive, message: 'BE chưa hỗ trợ đổi status policy' };
  },

  async deleteRule(_storeId: string, _ruleId: string) {
    throw new Error('BE chưa hỗ trợ xóa commission policy.');
  },

  async previewBonus(_storeId: string, monthlyRevenue: string): Promise<BonusPreviewResult> {
    return {
      monthlyRevenue,
      highestReachedRule: null,
      achievementBonus: '0',
      rangeBonuses: [],
      totalBonus: '0',
      formula: 'BE chỉ lưu commission-policies, chưa có preview bonus.',
    };
  },

  async settleMonthlyBonus(): Promise<SettlementResponse> {
    throw new Error('BE chưa hỗ trợ settle bonus tháng.');
  },

  async getSettlementHistory(): Promise<SettlementHistoryItem[]> {
    return [];
  },

  async approveSettlement() {
    throw new Error('BE chưa hỗ trợ approve settlement.');
  },

  async payoutSettlement() {
    throw new Error('BE chưa hỗ trợ payout settlement.');
  },

  async restoreRule(_storeId: string, ruleId: string) {
    return { success: false, message: 'BE chưa hỗ trợ restore', id: ruleId };
  },

  async handleRefund() {
    throw new Error('BE chưa hỗ trợ adjustment refund hoa hồng.');
  },

  async getKolProgress() {
    return {};
  },

  async getMyBonusProgress() {
    return {};
  },

  async getMyBonusHistory() {
    return [];
  },

  async getCollaboratorStores(): Promise<any[]> {
    const res: any = await api.get('/stores/marketplace');
    return res?.result ?? res?.data ?? [];
  },
};

export default commissionRulesService;
