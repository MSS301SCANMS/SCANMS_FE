import { useEffect, useState } from 'react';
import { shippingService, type GhnTrackingDetail } from '../../services/shipping.service';
import { ShippingSimulationControls } from './ShippingSimulationControls';

export function OrderShipmentPanel({ sellerOrderId, onDelivered }: { sellerOrderId: string; onDelivered: () => void }) {
  const [tracking, setTracking] = useState<GhnTrackingDetail | null>(null);
  const [error, setError] = useState('');
  const load = async () => {
    try { setTracking(await shippingService.trackOrder(sellerOrderId)); setError(''); }
    catch (e: any) { setError(e?.response?.data?.message || 'Chưa tải được vận đơn.'); }
  };
  useEffect(() => { void load(); }, [sellerOrderId]);
  return <section className="rounded-xl border border-[#EAE4D7] p-4 text-sm">
    <strong>Hành trình giao hàng</strong>
    {error && <p role="alert">{error}</p>}
    {tracking && <><p className="break-all">{tracking.orderCode} · {tracking.statusText}</p>
      <ShippingSimulationControls orderId={sellerOrderId} tracking={tracking} onStarted={setTracking}
        onCompleted={() => { void load(); onDelivered(); }} /></>}
    <button type="button" className="mt-2 underline" onClick={() => void load()}>Làm mới vận đơn</button>
  </section>;
}
