import type { OrderCancellation } from '../../types/order-cancellation.types';
import { formatMoney } from '../../utils/marketplace.utils';

export function OrderCancellationNotice({ cancellation }: { cancellation?: OrderCancellation }) {
  if (!cancellation?.state) return null;
  const rejection = Object.values(cancellation.decisions || {}).find(decision => !decision.approved);
  return <div role="status" className="my-3 w-full rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-left text-xs text-[#795A2D]">
    <strong>{cancellation.state === 'REQUESTED' ? 'Đang chờ shop duyệt yêu cầu hủy' : cancellation.state === 'REJECTED' ? 'Shop từ chối yêu cầu hủy' : 'Đơn đã hủy'}</strong>
    {cancellation.reason && <p className="mt-1">Lý do: {cancellation.reason}</p>}
    {rejection?.reason && <p className="mt-1">Phản hồi của shop: {rejection.reason}</p>}
    {cancellation.refundStatus === 'PENDING' && <p className="mt-1">Đang đối chiếu khoản thanh toán. Tiền đã thu được hoàn về ví SCANMS; tồn kho và voucher đang được xử lý.</p>}
    {cancellation.refundStatus === 'REFUNDED' && <p className="mt-1">Đã hoàn {formatMoney(cancellation.refundAmountVnd || 0)} về ví SCANMS.</p>}
    {cancellation.refundStatus === 'NOT_REQUIRED' && <p className="mt-1">Chưa ghi nhận khoản tiền đã thu cho đơn này.</p>}
  </div>;
}
