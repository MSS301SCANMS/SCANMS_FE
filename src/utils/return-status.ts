import type { ReturnStatus } from '../services/return.service';

const labels: Record<ReturnStatus, string> = {
  REQUESTED: 'Chờ Shop phản hồi',
  SHOP_APPROVED: 'Shop đã duyệt · chờ đặt lấy hàng',
  PICKUP_BOOKED: 'Đã đặt shipper lấy hàng',
  SHOP_REJECTED: 'Shop từ chối',
  EXPIRED: 'Quá hạn gửi hàng',
  RETURN_SHIPPED: 'Shipper đã lấy hàng trả',
  RETURN_RECEIVED: 'Shop đã nhận hàng',
  INSPECTING: 'Shop đang kiểm tra',
  INSPECTION_REJECTED: 'Shop từ chối sau kiểm tra',
  REFUND_PENDING: 'Chờ xử lý hoàn tiền',
  REFUND_PROCESSING: 'Đang xử lý hoàn tiền',
  REFUND_FAILED: 'Hoàn tiền gặp lỗi',
  EXCHANGE_PENDING: 'Shop chuẩn bị hàng đổi',
  EXCHANGE_SHIPPED: 'Shop đã gửi hàng đổi',
  AWAITING_CUSTOMER_CONFIRMATION: 'Chờ khách xác nhận',
  COMPLETED: 'Đã hoàn tất',
  DISPUTED: 'Đang khiếu nại',
  REFUNDED: 'Đã hoàn tiền',
  CLOSED: 'Đã đóng hồ sơ',
};

export const returnStatusLabel = (status: ReturnStatus) => labels[status] ?? status;

const carrierLabels: Record<string, string> = {
  ready_to_pick: 'Đã tạo vận đơn, chờ shipper lấy hàng',
  picking: 'Shipper đang đến lấy hàng',
  money_collect_picking: 'Shipper đang đến lấy hàng',
  picked: 'Shipper đã lấy hàng',
  storing: 'Đang ở kho vận chuyển',
  sorting: 'Đang phân loại',
  transporting: 'Đang chuyển giữa các kho',
  delivering: 'Đang giao về Shop',
  money_collect_delivering: 'Đang giao về Shop',
  delivered: 'Đã giao đến Shop',
  delivery_fail: 'Giao về Shop chưa thành công',
  waiting_to_return: 'GHN đang xử lý vận đơn chưa giao được',
  return: 'GHN đang xử lý trả lại kiện hàng',
  return_transporting: 'Đang vận chuyển kiện hàng về điểm gửi',
  return_sorting: 'Đang phân loại kiện hàng trả lại',
  returning: 'Đang trả kiện hàng về điểm gửi',
  return_fail: 'Trả kiện hàng chưa thành công',
  returned: 'Kiện hàng đã trả về điểm gửi',
  exception: 'Vận chuyển gặp sự cố',
  lost: 'Đơn vị vận chuyển báo thất lạc',
  damage: 'Đơn vị vận chuyển báo hư hỏng',
  cancel: 'Vận đơn đã hủy',
  scrap: 'GHN báo kiện hàng đã xử lý tiêu hủy',
};

export const carrierStatusLabel = (status?: string | null) =>
  status ? carrierLabels[status] ?? status : '';
