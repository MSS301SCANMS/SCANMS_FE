import type { ReturnDetail, ReturnStatus } from '../../services/return.service';
import { returnStatusLabel } from '@/utils/return-status.utils';

const eventLabels: Record<string, string> = {
  REQUEST_CREATED: 'Khách đã gửi yêu cầu đổi trả',
  REQUESTED_TO_SHOP_APPROVED: 'Shop chấp thuận yêu cầu',
  REQUESTED_TO_SHOP_REJECTED: 'Shop từ chối yêu cầu',
  PICKUP_WAREHOUSE_READY: 'Shop đã cấu hình kho nhận hàng trả',
  SHOP_APPROVED_TO_PICKUP_BOOKED: 'Khách đã đặt shipper lấy hàng',
  PICKUP_BOOKED_TO_RETURN_SHIPPED: 'Shipper đã lấy hàng',
  PICKUP_PROVIDER_STATUS: 'Đơn vị vận chuyển đã cập nhật trạng thái',
  RETURN_INSTRUCTIONS_SET: 'Shop đã cung cấp hướng dẫn gửi hàng',
  SHOP_APPROVED_TO_RETURN_SHIPPED: 'Khách xác nhận đã gửi hàng',
  TRACKING_CORRECTED: 'Khách đã sửa mã vận đơn',
  RETURN_SHIPPED_TO_RETURN_RECEIVED: 'Shop xác nhận đã nhận hàng',
  RETURN_RECEIVED_TO_INSPECTING: 'Shop bắt đầu kiểm tra',
  INSPECTION_SLA_ESCALATED: 'Quá 48 giờ chưa hoàn tất kiểm tra',
  INSPECTING_TO_REFUND_PENDING: 'Shop chấp thuận hoàn tiền',
  INSPECTING_TO_EXCHANGE_PENDING: 'Shop chấp thuận đổi hàng',
  INSPECTING_TO_INSPECTION_REJECTED: 'Shop từ chối sau kiểm tra',
  EXCHANGE_PENDING_TO_EXCHANGE_SHIPPED: 'Shop đã gửi hàng đổi',
  EXCHANGE_SHIPPED_TO_COMPLETED: 'Khách xác nhận hoàn tất',
  AWAITING_CUSTOMER_CONFIRMATION_TO_COMPLETED: 'Khách xác nhận hoàn tất',
  SHIPMENT_DEADLINE_EXPIRED: 'Quá hạn gửi hàng trả',
};

const steps = [
  'Shop phản hồi',
  'Đặt lấy hàng',
  'Shop nhận và kiểm tra',
  'Đổi hàng / hoàn tiền',
  'Hoàn tất',
];

function currentStep(status: ReturnStatus): number {
  if (['REQUESTED', 'SHOP_REJECTED'].includes(status)) return 0;
  if (['SHOP_APPROVED', 'PICKUP_BOOKED', 'EXPIRED', 'RETURN_SHIPPED'].includes(status)) return 1;
  if (['RETURN_RECEIVED', 'INSPECTING', 'INSPECTION_REJECTED'].includes(status)) return 2;
  if (['REFUND_PENDING', 'REFUND_PROCESSING', 'REFUND_FAILED',
    'EXCHANGE_PENDING', 'EXCHANGE_SHIPPED', 'AWAITING_CUSTOMER_CONFIRMATION'].includes(status)) return 3;
  if (status === 'DISPUTED') return 3;
  return 4;
}

export function ReturnTimeline({ request }: { request: ReturnDetail }) {
  const active = currentStep(request.status);
  const interrupted = ['SHOP_REJECTED', 'EXPIRED', 'INSPECTION_REJECTED', 'REFUND_FAILED', 'DISPUTED', 'CLOSED'].includes(request.status);

  return (
    <section aria-label="Tiến trình đổi trả" className="rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-[#1A1612]">Tiến trình xử lý</h2>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${interrupted
          ? 'border-red-200 bg-red-50 text-[#DC2626]'
          : 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8A6736]'}`}>
          {returnStatusLabel(request.status)}
        </span>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-5">
        {steps.map((step, index) => (
          <li key={step} aria-current={index === active ? 'step' : undefined}
            className={`rounded-xl border p-3 text-sm ${index <= active
              ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#1A1612]'
              : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'}`}>
            <span className="mb-1 block text-xs font-bold text-[#B88E4F]">{index + 1}/5</span>
            {step}
          </li>
        ))}
      </ol>
      {interrupted && <p className="mt-3 text-sm text-[#7D715E]">Quy trình đang tạm dừng; xem lý do và hướng xử lý bên dưới.</p>}
      {request.events.length > 0 && <details className="mt-4 border-t border-[#EAE4D7] pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-[#8A6736]">Lịch sử xử lý ({request.events.length})</summary>
        <ol className="mt-3 space-y-2 text-sm">
          {request.events.map((event) => <li key={event.id} className="flex flex-wrap justify-between gap-2">
            <span>{eventLabels[event.type] ?? 'Hồ sơ được cập nhật'}</span>
            <time className="text-[#7D715E]" dateTime={event.createdAt}>
              {new Date(event.createdAt).toLocaleString('vi-VN')}
            </time>
          </li>)}
        </ol>
      </details>}
    </section>
  );
}
