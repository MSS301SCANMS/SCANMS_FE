import api from './api';

export interface TierStatus {
  currentTier: {
    id: string;
    name: string;
    extraBonusPercentage: number;
    minRevenueThreshold: number;
  };
  currentRevenue: number;
  totalOrders: number;
  nextTier: {
    id: string;
    name: string;
    extraBonusPercentage: number;
    minRevenueThreshold: number;
  } | null;
  progressPercentage: number;
  revenueNeeded: number;
}

export const tierService = {
  async getAllTiers() {
    const res: any = await api.get('/tiers');
    return res.data;
  },

  async getMyTierStatus(): Promise<TierStatus> {
    const res: any = await api.get('/tiers/my-status');
    return res.data;
  },

  async triggerEvaluation() {
    const res: any = await api.post('/tiers/evaluate');
    return res.data;
  },
};
