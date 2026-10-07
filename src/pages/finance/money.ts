export const money = (value: number | null | undefined) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);
export const when = (value: string | null | undefined) => value ? new Date(value.endsWith('Z') || /[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`).toLocaleString('vi-VN') : '—';
export function amountVnd(text: string): number {
  if (!/^\d+$/.test(text.trim())) throw new Error('Nhập số tiền nguyên bằng VNĐ, không có dấu chấm hoặc dấu phẩy.');
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value <= 0 || value > 9_000_000_000_000) throw new Error('Số tiền không hợp lệ.');
  return value;
}
export const statusLabels: Record<string, string> = { REQUESTED: 'Chờ duyệt', APPROVED: 'Đã duyệt · tiền đang giữ', PROCESSING: 'Đang xử lý', SUCCESS: 'Thành công', FAILED: 'Thất bại', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy', PENDING: 'Đang chờ', ELIGIBLE: 'Đủ điều kiện', PAID: 'Đã cộng vào ví', CREDITED: 'Đã cộng vào ví', ACTIVE: 'Hoạt động', FROZEN: 'Tạm khóa', CLOSED: 'Đã đóng', VERIFIED: 'Đã xác minh', DRAFT: 'Bản nháp', INACTIVE: 'Ngừng áp dụng', EXPIRED: 'Hết hiệu lực', REFUNDED: 'Đã hoàn tiền' };
export const typeLabels: Record<string, string> = { TOP_UP: 'Nạp tiền', ORDER_PAYMENT: 'Thanh toán đơn', REFUND: 'Hoàn tiền', SELLER_SETTLEMENT: 'Doanh thu đối soát', KOL_COMMISSION: 'Hoa hồng KOL', PLATFORM_FEE: 'Phí nền tảng', WITHDRAWAL: 'Rút tiền', HOLD: 'Giữ tiền rút', RELEASE: 'Giải phóng tiền', ADJUSTMENT: 'Điều chỉnh' };
