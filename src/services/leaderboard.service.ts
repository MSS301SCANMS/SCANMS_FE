import api from './api';

export type LeaderboardMetric = 'REVENUE' | 'ORDERS' | 'CONVERSION_RATE' | 'COMMISSION';
export type LeaderboardTimeRange = 'this_month' | 'last_month' | 'this_quarter' | 'all_time' | 'custom';
export type LeaderboardScope = 'GLOBAL' | 'STORE';

export interface LeaderboardItem {
  rank: number;
  rankDelta: number;
  collaboratorId: string;
  fullName: string;
  avatarUrl?: string;
  primaryChannelHandle?: string;
  primaryPlatform?: string;
  tierName: string;
  grossRevenue: number;
  totalOrders: number;
  totalClicks: number;
  conversionRate: number;
  totalCommission: number;
  bonusPrizeAmount?: number;
  badgeTitle?: string;
  isCurrentUser: boolean;
}

export interface LeaderboardPodium {
  rank1: LeaderboardItem | null;
  rank2: LeaderboardItem | null;
  rank3: LeaderboardItem | null;
}

export interface MyRankStatus {
  myRank: number;
  rankDelta: number;
  myRevenue: number;
  myOrders: number;
  gapToTop10Revenue: number;
  gapToNextRankRevenue: number;
  currentPeriodLabel: string;
}

export interface LeaderboardFullResponse {
  metric: LeaderboardMetric;
  periodLabel: string;
  updatedAt: string;
  podium: LeaderboardPodium;
  rankings: LeaderboardItem[];
  myRankStatus?: MyRankStatus;
  totalParticipants: number;
}

export interface CreatorHallOfFameProfile {
  creatorId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  tierName: string;
  socialChannels: Array<{
    platform: string;
    channelName?: string;
    channelUrl: string;
    followerCount: number;
    isPrimary: boolean;
  }>;
  lifetimeStats: {
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    totalSamplesReceived: number;
  };
  topProducts: Array<{
    productId: string;
    title: string;
    imageUrl?: string;
    price: number;
    quantitySold: number;
  }>;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
  }>;
}

export interface LeaderboardQueryParams {
  metric?: LeaderboardMetric;
  timeRange?: LeaderboardTimeRange;
  month?: number;
  year?: number;
  scope?: LeaderboardScope;
  storeId?: string;
  category?: string;
  limit?: number;
}

export const leaderboardService = {
  getLeaderboard: async (params?: LeaderboardQueryParams): Promise<LeaderboardFullResponse> => {
    const res = await api.get<{ data?: LeaderboardFullResponse } | LeaderboardFullResponse>(
      '/leaderboard',
      { params },
    );
    return (res.data as any)?.data || res.data;
  },

  getPodium: async (params?: LeaderboardQueryParams): Promise<LeaderboardPodium> => {
    const res = await api.get<{ data?: LeaderboardPodium } | LeaderboardPodium>(
      '/leaderboard/podium',
      { params },
    );
    return (res.data as any)?.data || res.data;
  },

  getMyRank: async (params?: LeaderboardQueryParams): Promise<MyRankStatus> => {
    const res = await api.get<{ data?: MyRankStatus } | MyRankStatus>(
      '/leaderboard/my-rank',
      { params },
    );
    return (res.data as any)?.data || res.data;
  },

  getCreatorProfile: async (creatorId: string): Promise<CreatorHallOfFameProfile> => {
    const res = await api.get<{ data?: CreatorHallOfFameProfile } | CreatorHallOfFameProfile>(
      `/leaderboard/creator/${creatorId}`,
    );
    return (res.data as any)?.data || res.data;
  },
};
