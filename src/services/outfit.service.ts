import api from '../lib/api';
import type { AiAnalyzeProductResult } from '../hooks/useProducts';

export interface OutfitProductCard {
  productId: string;
  title: string;
  imageUrl?: string | null;
  priceVnd?: number | null;
  storeId?: string | null;
  storeName?: string | null;
  categoryName?: string | null;
  matchReason?: string | null;
  matchScore: number;
}

export interface OutfitRecommendResult {
  detection: AiAnalyzeProductResult;
  shoes: OutfitProductCard[];
  hats: OutfitProductCard[];
  message: string;
}

export const outfitService = {
  async recommend(imageFile: File, limit = 6): Promise<OutfitRecommendResult> {
    const body = new FormData();
    body.append('image', imageFile);
    const res: any = await api.post(`/public/outfit-recommend?limit=${limit}`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    });
    const payload = res?.result ?? res?.data ?? res;
    const detection = payload?.detection || {};
    return {
      detection: {
        detections: detection.detections || [],
        topPrediction: detection.topPrediction || null,
        dominantColors: detection.dominantColors || [],
        stylePrediction: detection.stylePrediction || null,
        detectionFallback: Boolean(detection.detectionFallback),
        embeddingGenerated: Boolean(detection.embeddingGenerated),
        inferenceTimeMs: Number(detection.inferenceTimeMs || 0),
        garmentType: detection.garmentType || 'UNKNOWN',
        displayLabel: detection.displayLabel || '',
        suggestedCategory: detection.suggestedCategory ?? null,
        clothingDetected: Boolean(detection.clothingDetected),
        detectedGarments: Array.isArray(detection.detectedGarments) ? detection.detectedGarments : [],
      },
      shoes: payload?.shoes || [],
      hats: payload?.hats || [],
      message: payload?.message || '',
    };
  },
};
