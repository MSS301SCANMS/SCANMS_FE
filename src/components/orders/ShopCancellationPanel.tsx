import { useState } from 'react';
import { orderService } from '../../services/order.service';
import type { OrderCancellation } from '../../types/order-cancellation.types';
import { OrderCancellationNotice } from './OrderCancellationNotice';

interface ShopCancellationPanelProps {
  sellerOrderId: string;
  cancellation?: OrderCancellation;
  onUpdated: () => void;
}

export function ShopCancellationPanel({ sellerOrderId, cancellation, onUpdated }: ShopCancellationPanelProps) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const decide = async (approved: boolean) => {
    if (busy) return;
    if (!approved && !reason.trim()) {
      setError('Vui lòng nhập lý do từ chối.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await orderService.decideCancellation(sellerOrderId, approved, reason.trim());
      onUpdated();
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : 'Chưa xử lý được yêu cầu hủy.');
    } finally {
      setBusy(false);
    }
  };
  if (!cancellation?.state) return null;
  return <section aria-label="Yêu cầu hủy đơn" className="my-4">
    <OrderCancellationNotice cancellation={cancellation} />
    {cancellation.state === 'REQUESTED' && <>
      <p className="mb-2 text-xs text-[#7D715E]">Phản hồi trước khi giao hàng. Đơn nhiều shop chỉ hủy sau khi tất cả shop đồng ý.</p>
      <label className="block text-xs">Phản hồi cho khách<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={500} disabled={busy} className="mt-1 block w-full rounded-lg border border-[#EAE4D7] p-2" /></label>
      <div className="mt-2 flex gap-3">
        <button type="button" disabled={busy} onClick={() => void decide(true)} className="rounded-lg bg-[#C59B58] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">Đồng ý hủy</button>
        <button type="button" disabled={busy} onClick={() => void decide(false)} className="rounded-lg border border-[#EAE4D7] px-4 py-2 text-xs disabled:opacity-50">Từ chối hủy</button>
      </div>
    </>}
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </section>;
}
