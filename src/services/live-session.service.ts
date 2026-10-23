import api from './api';
import { unwrapApi } from '@/utils/api-response';

const fresh = { headers: { 'x-skip-cache': 'true' } };

export const liveSessionService = {
  async mine() {
    const [sessionResponse, profileResponse] = await Promise.all([
      api.get('/livestreams', fresh), api.get('/collaborators/me', fresh),
    ]);
    const sessions = unwrapApi<any[]>(sessionResponse);
    const profile = unwrapApi<any>(profileResponse);
    if (!Array.isArray(sessions)) throw new Error('Không tải được danh sách phiên livestream.');
    if (!profile?.collaboratorId) return [];
    return sessions.filter(row => row.collaboratorRefs?.collaboratorIds?.includes(profile.collaboratorId)
      || (!row.livestreamId && row.creator?.id === profile.userId)).map(row => ({
      ...row,
      participantRefs: {
        ...row.participantRefs,
        inviteStatus: row.participantRefs?.collaboratorResponses?.[profile.collaboratorId]
          || row.participantRefs?.inviteStatus || row.inviteStatus || 'PENDING',
      },
    }));
  },

  async room(id: string) {
    const raw = unwrapApi<any>(await api.get(`/livestreams/${encodeURIComponent(id)}`, fresh));
    if (!raw?.livestreamId) {
      if (!raw?.id) throw new Error('Không tìm thấy phiên livestream.');
      return raw;
    }
    const participants = raw.participantRefs || {};
    const productIds: string[] = raw.productRefs?.productIds || [];
    const collaboratorIds: string[] = raw.collaboratorRefs?.collaboratorIds || [];
    const [storeResponse, profilesResponse, ...productResponses] = await Promise.all([
      api.get(`/stores/public/id/${encodeURIComponent(raw.storeId)}`, fresh),
      api.get('/collaborators', fresh),
      ...productIds.map(productId => api.get(`/public/products/${encodeURIComponent(productId)}/landing`, fresh)),
    ]);
    const store = unwrapApi<any>(storeResponse);
    const profiles = unwrapApi<any[]>(profilesResponse);
    const creators = (Array.isArray(profiles) ? profiles : []).filter(profile => collaboratorIds.includes(profile.collaboratorId))
      .map(profile => ({ id: profile.userId, collaboratorId: profile.collaboratorId,
        canHost: profile.approvalStatus === 'APPROVED' && participants.collaboratorResponses?.[profile.collaboratorId] === 'ACCEPTED',
        fullName: profile.applicationData?.channelName || participants.creatorName || 'Nhà sáng tạo' }));
    return {
      ...raw, id: raw.livestreamId,
      startsAt: raw.startedAt || raw.scheduledAt, endsAt: raw.endedAt || participants.endsAt,
      store: { ...store, id: store.id || store.storeId || raw.storeId }, creators, creator: creators[0],
      products: productResponses.map(response => {
        const landing = unwrapApi<any>(response);
        const product = landing?.product;
        if (!product?.id) throw new Error('Không tải được sản phẩm trong phiên livestream.');
        return { product };
      }),
      // A voucher code alone does not establish a discount; checkout obtains the actual quote.
      coupon: participants.voucherCode ? { displayCode: participants.voucherCode, discountValue: 0 } : null,
    };
  },
};
