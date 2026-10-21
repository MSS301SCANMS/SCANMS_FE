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

  async updateStatus(_storeId: string, _ruleId: string, _isActive: boolean) {
    throw new Error('Chưa hỗ trợ thay đổi trạng thái chính sách từ khu vực gian hàng. Thao tác chưa được lưu.');
  },

  async deleteRule(_storeId: string, _ruleId: string) {
    throw new Error('BE chưa hỗ trợ xóa commission policy.');
  },

  async previewBonus(_storeId: string, _monthlyRevenue: string): Promise<BonusPreviewResult> {
    throw new Error('Chưa có chức năng tính thử thưởng KPI. Không thể dùng kết quả này để chốt thưởng.');
  },

  async settleMonthlyBonus(
    _storeId?: string,
    _collaboratorId?: string,
    _yearMonth?: string,
    _allowUnfinishedMonth?: boolean,
  ): Promise<any> {
    throw new Error('BE chưa hỗ trợ settle bonus tháng.');
  },

  async getSettlementHistory(_storeId?: string, _yearMonth?: string): Promise<SettlementHistoryItem[]> {
    return [];
  },

  async approveSettlement(_storeId?: string, _settlementId?: string): Promise<any> {
    throw new Error('BE chưa hỗ trợ approve settlement.');
  },

  async payoutSettlement(_storeId?: string, _settlementId?: string): Promise<any> {
    throw new Error('BE chưa hỗ trợ payout settlement.');
  },

  async restoreRule(_storeId: string, _ruleId: string) {
    throw new Error('Chưa hỗ trợ khôi phục chính sách. Thao tác chưa được lưu.');
  },

  async handleRefund(_storeId?: string, _data?: any): Promise<any> {
    throw new Error('BE chưa hỗ trợ adjustment refund hoa hồng.');
  },

  async getKolProgress(_storeId?: string, _collaboratorId?: string, _yearMonth?: string): Promise<any> {
    return null;
  },

  async getMyBonusProgress(_storeId?: string, _yearMonth?: string): Promise<any> {
    return null;
  },

  async getMyBonusHistory(_storeId?: string, _yearMonth?: string): Promise<any[]> {
    return [];
  },

  async getCollaboratorStores(_discovery?: boolean): Promise<any[]> {
    const res: any = await api.get('/stores/marketplace');
    return res?.result ?? res?.data ?? [];
  },
};

export default commissionRulesService;
