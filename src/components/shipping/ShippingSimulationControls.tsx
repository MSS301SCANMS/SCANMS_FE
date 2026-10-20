import { useRef, useState } from 'react';
import { shippingService, type GhnTrackingDetail } from '../../services/shipping.service';

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
    <section className="mt-3 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-sm text-[#231D15]" aria-label="Kiểm thử giao vận">
      <p className="font-semibold">Chỉ kiểm thử đơn GHN TEST</p>
      <p className="mt-1 text-xs text-[#7D715E]">
        Không điều phối shipper hoặc xác nhận thanh toán thật. Mỗi mốc cách nhau 1 phút.
        Khi timeline đã giao thử (sau 4 phút), bấm đồng bộ để khách kiểm thử nhận hàng/đổi trả.
      </p>
      {error && <p role="alert" className="mt-2 text-xs text-[#DC2626]">{error}</p>}
      <button type="button" disabled={busy} onClick={() => void submit()}
        className="mt-3 rounded-xl bg-[#C59B58] px-4 py-2 text-xs font-semibold text-[#231D15] hover:bg-[#B88E4F] disabled:opacity-50">
        {busy ? 'Đang xử lý…' : tracking.isSimulation ? 'Đồng bộ kết quả giao thử' : 'Bắt đầu mô phỏng giao hàng'}
      </button>
    </section>
  );
}
