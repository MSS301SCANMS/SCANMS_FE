import api from './api';
import { unwrapApi } from '@/utils/api-response';
import type { ShopReturnRequest } from './shop-returns.service';

export const managerReturnsService = {
  async list(signal?: AbortSignal): Promise<ShopReturnRequest[]> {
    let response;
    try {
      response = await api.get('/returns/manager', { signal, headers: { 'x-skip-cache': 'true' } });
    } catch (error: any) {
      if (error?.response?.status === 404) throw new Error('Dịch vụ đổi trả chưa được cập nhật. Hãy khởi động lại order-service rồi tải lại danh sách.');
      throw error;
    }
    const data = unwrapApi(response);
    if (!Array.isArray(data) || data.some(row => !row?.returnRequestId || !row.orderId || !row.status)) throw new Error('Dữ liệu yêu cầu đổi trả chưa hợp lệ. Vui lòng tải lại.');
    return data;
  },
  async decide(id: string, status: 'APPROVED' | 'REJECTED', notes: string) {
    const data = unwrapApi(await api.post(`/returns/manager/${encodeURIComponent(id)}/decision`, { status, notes }));
    if (data?.returnRequestId !== id || data?.status !== status) throw new Error('Máy chủ chưa xác nhận kết quả xử lý. Hãy tải lại hồ sơ để kiểm tra.');
    return data;
  },
};
