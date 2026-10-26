import { useRef, useState } from 'react';
import { shippingService, type GhnTrackingDetail } from '../../services/shipping.service';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  orderId: string;
  tracking: GhnTrackingDetail;
  onStarted: (tracking: GhnTrackingDetail) => void;
  onCompleted: () => void;
}

/** The server advertises capability; LIVE shipments never expose test actions. */
export function ShippingSimulationControls({ orderId, tracking, onStarted, onCompleted }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  if (tracking.environment !== 'TEST' || !tracking.simulationAvailable) return null;

  const submit = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      if (tracking.isSimulation) {
        await shippingService.completeCustomerSimulation(orderId);
        onCompleted();
      } else {
        onStarted(await shippingService.startCustomerSimulation(orderId));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Chưa thể cập nhật hành trình thử. Vui lòng thử lại.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 rounded-xl border border-[#EEE8DF] bg-white p-4 text-sm text-[#51483B]" aria-label="Kiểm thử giao vận">
      <p className="m-0 text-[13px] font-semibold">{tracking.isSimulation ? 'Xác nhận kết quả giao hàng' : 'Tiếp tục hành trình thử'}</p>
      <p className="mb-3 mt-1 text-xs leading-5 text-[#7D715E]">{tracking.isSimulation ? 'Xác nhận để chuyển đơn sang đã giao và kiểm tra bước nhận hàng, đổi trả.' : 'Bắt đầu để chuyển bưu kiện sang trạng thái đang vận chuyển.'}</p>
      {error && <p role="alert" className="mt-2 text-xs text-[#DC2626]">{error}</p>}
      <button type="button" disabled={busy} onClick={() => void submit()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E7D5B7] bg-[#FFFCF5] px-4 py-3 text-xs font-semibold text-[#99733D] hover:bg-[#FBF5EB] disabled:opacity-50">
        {busy ? <Loader2 size={16} className="animate-spin" /> : tracking.isSimulation ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
        {busy ? 'Đang xử lý…' : tracking.isSimulation ? 'Xác nhận giao thử thành công' : 'Bắt đầu mô phỏng giao hàng'}
      </button>
      <p className="mb-0 mt-2 text-[11px] leading-5 text-[#91816B]">Không gọi GHN và không điều phối shipper thật.</p>
    </section>
  );
}
