/**
 * Nest realtime dashboard chưa có trên Spring gateway.
 * Soft-stub: không gọi /dashboard/realtime/* (tránh 404 spam).
 */

export interface DashboardOverviewResponse {
  period: {
    startDate: string;
    endDate: string;
    prevStartDate: string;
    prevEndDate: string;
    range: string;
  };
  metrics: {
    totalClicks: number;
    previousClicks: number;
    growthClicks: number;
    totalOrders: number;
    previousOrders: number;
    growthOrders: number;
    completedOrders: number;
    grossRevenue: number;
    previousRevenue: number;
    growthRevenue: number;
    totalCommission: number;
    previousCommission: number;
    growthCommission: number;
    vipBonusCommission: number;
    conversionRate: number;
    previousConversionRate: number;
    growthConversionRate: number;
    averageOrderValue: number;
    activeReferralLinks: number;
  };
}

export interface TimeSeriesPoint {
  date?: string;
  hour?: number;
  label: string;
  clicks: number;
  orders: number;
  revenue: number;
  commission: number;
  conversionRate: number;
}

export interface TopProductItem {
  productId: string;
  productName: string;
  imageUrl?: string | null;
  clicks: number;
  orders: number;
  revenue: number;
  commission: number;
}

export interface TopChannelItem {
  channel: string;
  clicks: number;
  orders: number;
  revenue: number;
  commission: number;
}

export interface FunnelResponse {
  clicks: number;
  addToCart: number;
  checkouts: number;
  paidOrders: number;
}

export interface CampaignPerformanceItem {
  campaignId: string;
  name: string;
  clicks: number;
  orders: number;
  revenue: number;
  commission: number;
}

export interface ShopKolProgressItem {
  collaboratorId: string;
  fullName: string;
  totalRevenue: number;
  totalCommissions: number;
  myStatus?: string;
}

const emptyOverview = (): DashboardOverviewResponse => {
  const now = new Date().toISOString();
  return {
    period: {
      startDate: now,
      endDate: now,
      prevStartDate: now,
      prevEndDate: now,
      range: 'custom',
    },
    metrics: {
      totalClicks: 0,
      previousClicks: 0,
      growthClicks: 0,
      totalOrders: 0,
      previousOrders: 0,
      growthOrders: 0,
      completedOrders: 0,
      grossRevenue: 0,
      previousRevenue: 0,
      growthRevenue: 0,
      totalCommission: 0,
      previousCommission: 0,
      growthCommission: 0,
      vipBonusCommission: 0,
      conversionRate: 0,
      previousConversionRate: 0,
      growthConversionRate: 0,
      averageOrderValue: 0,
      activeReferralLinks: 0,
    },
  };
};

export const analyticsService = {
  getRealtimeOverview: async (_params?: {
    range?: string;
    days?: number;
    startDate?: string;
    endDate?: string;
    interval?: string;
    storeId?: string;
    channel?: string;
    campaignId?: string;
  }, _fresh = false) => emptyOverview(),

  getTimeSeries: async (_params?: {
    range?: string;
    days?: number;
    startDate?: string;
    endDate?: string;
    interval?: string;
    storeId?: string;
  }, _fresh = false): Promise<TimeSeriesPoint[]> => [],

  getTopProducts: async (_params?: {
    range?: string;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TopProductItem[]> => [],

  getTopChannels: async (_params?: {
    range?: string;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TopChannelItem[]> => [],

  getConversionFunnel: async (_params?: {
    range?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<FunnelResponse> => ({
    clicks: 0,
    addToCart: 0,
    checkouts: 0,
    paidOrders: 0,
  }),

  getCampaignPerformance: async (_params?: {
    range?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CampaignPerformanceItem[]> => [],
};
