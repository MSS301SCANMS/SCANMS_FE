import api from './api';

export interface MediaAsset {
  id: string;
  storeId: string;
  productId?: string;
  collaboratorId?: string | null;
  title: string;
  assetType: 'IMAGE' | 'VIDEO' | 'COPYWRITE_TEXT';
  urlOrContent: string;
  posterUrl?: string | null;
  caption?: string | null;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  isFeatured?: boolean;
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  store?: { id?: string; name: string; slug: string };
  product?: { id: string; title: string; sku: string; price?: number | string };
  collaborator?: { id: string; fullName: string };
}

export const mediaService = {
  async getMediaAssets(params?: {
    productId?: string;
    assetType?: string;
    page?: number;
    limit?: number;
  }) {
    const res: any = await api.get('/media', { params });
    return res.data;
  },

  async createMediaAsset(data: {
    productId?: string;
    title: string;
    assetType: 'IMAGE' | 'VIDEO' | 'COPYWRITE_TEXT';
    urlOrContent: string;
    posterUrl?: string;
    caption?: string;
  }) {
    const res: any = await api.post('/media', data);
    return res.data;
  },


  async submitKolVideo(data: {
    productId: string;
    title: string;
    videoUrl: string;
    posterUrl?: string;
    caption?: string;
    campaignId?: string;
    requiresCampaignParticipation?: boolean;
  }) {
    const res: any = await api.post('/media/kol-submission', data);
    return res.data;
  },

  async deleteMediaAsset(id: string) {
    const res: any = await api.delete(`/media/${id}`);
    return res.data;
  },
};

