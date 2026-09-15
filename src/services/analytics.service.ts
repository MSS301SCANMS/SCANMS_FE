import api from './api';

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
  rank: number;
  productId: string;
  title: string;
  sku: string;
  imageUrl?: string;
  unitPrice: number;
  storeName?: string;
  ordersCount: number;
  quantitySold: number;
  grossRevenue: number;
}

export interface TopChannelItem {
  channel: string;
  clicks: number;
  orders: number;
  conversionRate: number;
  trafficSharePercent: number;
}

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  percentage: number;
}

export interface FunnelResponse {
  stages: FunnelStage[];
  conversionRate: number;
  fulfillmentRate: number;
}

export interface CampaignPerformanceItem {
  campaignId: string;
  name: string;
  bonusCommissionRate: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  storeName?: string;
  participantsCount: number;
  totalOrders: number;
  totalRevenue: number;
  totalCommissions: number;
  myStatus?: string;
}

export const analyticsService = {
  getRealtimeOverview: async (params?: {
    range?: string;
    days?: number;
    startDate?: string;
    endDate?: string;
    interval?: string;
    storeId?: string;
    channel?: string;
    campaignId?: string;
  }) => {
    const res = await api.get<{ data?: DashboardOverviewResponse } | DashboardOverviewResponse>(
      '/dashboard/realtime/overview',
      { params },
    );
    return (res.data as any)?.data || res.data;
  },

  getTimeSeries: async (params?: {
    range?: string;
    days?: number;
    startDate?: string;
    endDate?: string;
    interval?: string;
    storeId?: string;
  }) => {
    const res = await api.get<{ data?: TimeSeriesPoint[] } | TimeSeriesPoint[]>(
      '/dashboard/realtime/timeseries',
      { params },
    );
    return (res.data as any)?.data || res.data;
  },

  getTopProducts: async (params?: { range?: string; limit?: number; startDate?: string; endDate?: string }) => {
    const res = await api.get<{ data?: TopProductItem[] } | TopProductItem[]>(
      '/dashboard/realtime/top-products',
      { params },
    );
    return (res.data as any)?.data || res.data;
  },

  getTopChannels: async (params?: { range?: string; limit?: number; startDate?: string; endDate?: string }) => {
    const res = await api.get<{ data?: TopChannelItem[] } | TopChannelItem[]>(
      '/dashboard/realtime/top-channels',
      { params },
    );
    return (res.data as any)?.data || res.data;
  },

  getConversionFunnel: async (params?: { range?: string; startDate?: string; endDate?: string }) => {
    const res = await api.get<{ data?: FunnelResponse } | FunnelResponse>(
      '/dashboard/realtime/funnel',
      { params },
    );
    return (res.data as any)?.data || res.data;
  },

  getCampaignPerformance: async (params?: { range?: string; startDate?: string; endDate?: string }) => {
    const res = await api.get<{ data?: CampaignPerformanceItem[] } | CampaignPerformanceItem[]>(
      '/dashboard/realtime/campaigns',
      { params },
    );
    return (res.data as any)?.data || res.data;
  },
};
