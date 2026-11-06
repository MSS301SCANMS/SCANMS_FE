import api from './api';
import { unwrapApi } from '@/utils/api-response';
import { serverDate } from '../utils/server-date';
import { livestreamLifecycle } from '../utils/livestream-lifecycle.utils';

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
    const mine = sessions.filter(row => row.collaboratorRefs?.collaboratorIds?.includes(profile.collaboratorId)
      || (!row.livestreamId && row.creator?.id === profile.userId)).map(row => ({
      ...row,
      participantRefs: {
        ...row.participantRefs,
        inviteStatus: row.participantRefs?.collaboratorResponses?.[profile.collaboratorId]
          || row.participantRefs?.inviteStatus || row.inviteStatus || 'PENDING',
      },
    }));
    // Cards show two products. Resolve only those previews, once per unique ID.
    const previewIds = [...new Set<string>(mine.flatMap(row =>
      (row.productRefs?.productIds || []).slice(0, 2),
    ))];
    const previews = await Promise.allSettled(previewIds.map(async id => {
      const product = unwrapApi<any>(await api.get(`/public/products/${encodeURIComponent(id)}`));
      return [id, product] as const;
    }));
    const products = new Map(previews.flatMap(result => result.status === 'fulfilled' ? [result.value] : []));
    return mine.map(row => ({
      ...row,
      products: (row.productRefs?.productIds || []).map((id: string) => {
        const product = products.get(id);
        return { product: { id, title: product?.title || product?.name || '', imageUrl: product?.imageUrl || null } };
      }),
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
        fullName: [profile.applicationData?.channelName, participants.creatorName].find(value => typeof value === 'string' && value.trim() && !/^https?:\/\//i.test(value)) || 'Nhà sáng tạo' }));
    return {
      ...raw, ...livestreamLifecycle(raw), id: raw.livestreamId,
      pinnedProductId: raw.productRefs?.pinnedProductId ?? null,
      startsAt: serverDate(raw.startedAt || raw.scheduledAt), endsAt: serverDate(raw.endedAt || participants.endsAt),
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
