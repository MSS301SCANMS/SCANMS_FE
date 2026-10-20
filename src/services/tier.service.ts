import api from './api';

export interface TierPolicy {
  id: string;
  name: string;
  extraBonusPercentage: number;
  minRevenueThreshold: number;
}

export interface TierStatus {
  currentTier: TierPolicy;
  currentRevenue: number;
  totalOrders: number;
  revenueBasis: 'PREVIOUS_MONTH_VIETNAM';
  assessmentPeriod?: { startsAt: string; endsAt: string };
  nextEvaluationAt?: string;
  qualifiedTier: TierPolicy;
  nextTier: TierPolicy | null;
  progressPercentage: number;
  revenueNeeded: number;
}

export const tierService = {
  async getAllTiers(): Promise<TierPolicy[]> {
    const res: any = await api.get('/tiers', { headers: { 'x-skip-cache': 'true' } });
    return res.data;
  },

  async getMyTierStatus(): Promise<TierStatus> {
    const res: any = await api.get('/tiers/my-status', { headers: { 'x-skip-cache': 'true' } });
    return res.data;
  },

  async triggerEvaluation() {
    const res: any = await api.post('/tiers/evaluate');
    return res.data;
  },
};
