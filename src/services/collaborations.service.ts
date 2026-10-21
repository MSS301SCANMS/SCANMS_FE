import api from './api';
import { unwrapApi } from '@/utils/api-response';

export interface Collaboration {
  id: string;
  kind: 'REFERRAL' | 'LIVESTREAM';
  collaboratorId: string;
  collaboratorName: string | null;
  collaboratorStatus: string;
  storeId: string;
  storeName: string | null;
  productId: string | null;
  productName: string | null;
  livestreamId: string | null;
  livestreamTitle: string | null;
  token: string | null;
  status: string;
  inviteStatus: string | null;
  createdAt: string | null;
  scheduledAt: string | null;
  expiresAt: string | null;
}

export const collaborationsService = {
  async list(mode: 'shop' | 'admin', signal?: AbortSignal): Promise<Collaboration[]> {
    const result = unwrapApi(await api.get(`/referrals/${mode}-collaborations`, {
      signal, headers: { 'x-skip-cache': 'true' },
    }));
    if (!Array.isArray(result)) throw new Error('Không tải được danh sách hợp tác. Vui lòng thử lại.');
    return result;
  },
};
