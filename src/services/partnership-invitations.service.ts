import api from './api';
import { unwrapApi } from '@/utils/api-response';

export interface PartnershipInvitation {
  id: string; storeId: string; storeName: string; collaboratorId: string; collaboratorName: string;
  productId: string | null; productName: string | null; message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  referralLinkId: string | null; referralToken: string | null; createdAt: string; respondedAt: string | null;
}
export interface InvitationCatalog {
  storeId: string; storeName: string;
  products: { id: string; name: string }[];
  creators: { id: string; name: string; platform: string; followers: number; channelUrl: string | null }[];
}
const root = '/referrals/invitations';
const fresh = { headers: { 'x-skip-cache': 'true' } };
async function execute<T>(operation: () => Promise<unknown>): Promise<T> {
  try { return unwrapApi(await operation()) as T; }
  catch (error: any) {
    if (error?.response?.status === 404 || (error?.response?.status >= 500 && /unexpected error/i.test(error.message)))
      throw Object.assign(new Error('Chưa kết nối được chức năng lời mời hợp tác. Vui lòng cập nhật và khởi động lại dịch vụ hợp tác rồi thử lại.'), { unavailableEndpoint: true });
    throw error;
  }
}
export const partnershipInvitationsService = {
  catalog: () => execute<InvitationCatalog>(() => api.get(`${root}/catalog`, fresh)),
  list: async (mode: 'shop' | 'kol') => {
    const rows = await execute<PartnershipInvitation[]>(() => api.get(`${root}/${mode === 'shop' ? 'shop' : 'mine'}`, fresh));
    if (!Array.isArray(rows)) throw new Error('Dữ liệu lời mời chưa hợp lệ. Vui lòng thử lại.');
    return rows;
  },
  async send(data: { storeId: string; collaboratorId: string; productId?: string; message: string }) {
    const saved = await execute<PartnershipInvitation>(() => api.post(root, data));
    if (!saved?.id || saved.status !== 'PENDING' || saved.storeId !== data.storeId || saved.collaboratorId !== data.collaboratorId || (saved.productId ?? null) !== (data.productId ?? null) || saved.message !== data.message.trim())
      throw new Error('Máy chủ chưa xác nhận đầy đủ lời mời. Hãy kiểm tra danh sách đã gửi trước khi thử lại.');
    const rows = await this.list('shop');
    if (!rows.some(row => row.id === saved.id && (row.productId ?? null) === (data.productId ?? null) && row.message === data.message.trim()))
      throw new Error('Chưa đọc lại được lời mời đã gửi. Nội dung vẫn được giữ; hãy kiểm tra danh sách trước khi gửi lại.');
    return saved;
  },
  async respond(id: string, decision: 'ACCEPTED' | 'REJECTED') {
    const saved = await execute<PartnershipInvitation>(() => api.post(`${root}/${encodeURIComponent(id)}/respond`, { decision }));
    if (saved?.id !== id || saved.status !== decision || (decision === 'ACCEPTED' && saved.productId && (!saved.referralLinkId || !saved.referralToken)))
      throw new Error('Máy chủ chưa xác nhận phản hồi và liên kết tiếp thị. Hãy tải lại danh sách để kiểm tra.');
    return saved;
  },
  async cancel(id: string) {
    const saved = await execute<PartnershipInvitation>(() => api.post(`${root}/${encodeURIComponent(id)}/cancel`));
    if (saved?.id !== id || saved.status !== 'CANCELLED') throw new Error('Máy chủ chưa xác nhận thu hồi lời mời.');
    return saved;
  },
};
