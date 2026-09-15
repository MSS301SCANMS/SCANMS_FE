import api from './api';

export interface ScoreBreakdown {
  categoryScore: number;
  conversionRateScore: number;
  tierAndSocialScore: number;
  priceFitScore: number;
}

export interface KolSocialChannelSummary {
  platform: string;
  channelName: string;
  channelUrl: string;
  followerCount: number;
  isPrimary: boolean;
}

export interface KolLifetimeStatsSummary {
  totalOrders: number;
  grossRevenue: number;
  conversionRate: number;
  primaryCategory: string;
}

export interface KolMatchResult {
  collaboratorId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  tierName: string;
  bio: string;
  matchScore: number;
  matchLevel: string;
  scoreBreakdown: ScoreBreakdown;
  aiReasoning: string;
  keyStrengths: string[];
  socialChannels: KolSocialChannelSummary[];
  lifetimeStats: KolLifetimeStatsSummary;
}

export interface TargetProductSummary {
  productId: string;
  title: string;
  category: string;
  price: number;
  imageUrl?: string;
  commissionRate: number;
}

export interface AiRecommendationResponse {
  calculatedAt: string;
  targetProduct?: TargetProductSummary;
  totalKolsScanned: number;
  recommendedKols: KolMatchResult[];
}

export interface RecommendKolsParams {
  productId?: string;
  category?: string;
  priceRange?: 'ALL' | 'UNDER_200K' | 'FROM_200K_TO_500K' | 'FROM_500K_TO_1M' | 'OVER_1M';
  minTier?: string;
  minConversionRate?: number;
  limit?: number;
}

export const aiRecommendationService = {
  // Gợi ý Top KOLs cho 1 sản phẩm cụ thể
  getRecommendationsForProduct: async (
    productId: string,
    params?: RecommendKolsParams,
  ): Promise<AiRecommendationResponse> => {
    const res = await api.get(`/ai/recommend-kols/${productId}`, { params });
    return res.data?.data || res.data || res;
  },

  // Gợi ý KOLs theo bộ lọc tùy chỉnh
  getGeneralRecommendations: async (
    params?: RecommendKolsParams,
  ): Promise<AiRecommendationResponse> => {
    const res = await api.get('/ai/recommend-kols', { params });
    return res.data?.data || res.data || res;
  },

  // Phân tích đối sánh 1-1 chuyên sâu
  analyzeMatch: async (productId: string, collaboratorId: string) => {
    const res = await api.post('/ai/match-analysis', { productId, collaboratorId });
    return res.data?.data || res.data || res;
  },
};
