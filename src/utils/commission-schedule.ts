import type { CommissionRow } from '../services/commission.service';

export function commissionSchedule(row: CommissionRow, now = Date.now()) {
  if (row.status === 'CANCELLED') return { label: 'Đã hủy hoa hồng', note: 'Không còn khoản hoa hồng được nhận.', date: null };
  if (row.transferReference) return { label: 'Đã ghi vào ví', note: '', date: row.paidAt || null };
  if (row.timelineUnavailable || !row.timeline) return { label: 'Chưa tải được hạn trả hàng', note: 'Bấm Cập nhật hoa hồng để thử lại.', date: null };
  const { deliveredAt, returnDeadline, hasUnresolvedReturn } = row.timeline;
  if (!deliveredAt) return { label: 'Chờ giao thành công', note: 'Ngày dự kiến được xác định sau khi giao hàng.', date: null };
  if (!returnDeadline) return { label: 'Chờ cập nhật hạn trả hàng', note: 'Chưa xác định được ngày đủ điều kiện.', date: null };
  if (hasUnresolvedReturn) return { label: 'Tạm chờ xử lý trả hàng', note: 'Chỉ đối soát sau khi xử lý xong yêu cầu trả hàng.', date: returnDeadline };
  const timestamp = Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/.test(returnDeadline) ? returnDeadline : `${returnDeadline}Z`);
  if (!Number.isFinite(timestamp)) return { label: 'Chờ cập nhật hạn trả hàng', note: 'Thời hạn từ đơn hàng chưa hợp lệ.', date: null };
  const minutes = Math.ceil((timestamp - now) / 60000);
  if (minutes <= 0) return { label: 'Đã hết hạn trả hàng', note: 'Đang chờ đối soát và ghi vào ví.', date: returnDeadline };
  const days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), remainingMinutes = minutes % 60;
  const remaining = days ? `${days} ngày${hours ? ` ${hours} giờ` : ''}` : hours ? `${hours} giờ${remainingMinutes ? ` ${remainingMinutes} phút` : ''}` : `${remainingMinutes} phút`;
  return { label: `Còn ${remaining}`, note: 'Dự kiến đủ điều kiện sau khi hết hạn trả hàng.', date: returnDeadline };
}
