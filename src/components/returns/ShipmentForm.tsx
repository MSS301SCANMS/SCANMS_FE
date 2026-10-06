import { useState, type FormEvent } from 'react';
import { useConfirmShipment } from '../../hooks/useReturnDetail';

export function ShipmentForm({ returnId, shipByAt }: { returnId: string; shipByAt: string }) {
  const mutation = useConfirmShipment(returnId);
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [validationError, setValidationError] = useState('');
  const overdue = new Date(shipByAt).getTime() <= Date.now();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!receipt) return setValidationError('Vui lòng chọn ảnh biên nhận.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(receipt.type) || receipt.size > 5 * 1024 * 1024) {
      return setValidationError('Chỉ nhận ảnh JPG, PNG hoặc WEBP không quá 5 MB.');
    }
    setValidationError('');
    try {
      await mutation.mutateAsync({ carrierName: carrierName.trim(), trackingNumber: trackingNumber.trim(), receipt });
    } catch {
      // The mutation exposes the server error below; retain the input for retry.
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-3 rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-4">
      <h3 className="font-bold text-[#1A1612]">Xác nhận đã gửi hàng</h3>
      <p className="text-sm text-[#7D715E]">Hạn gửi: {new Date(shipByAt).toLocaleString('vi-VN')}</p>
      <label className="block text-sm font-medium text-[#1A1612]">Đơn vị vận chuyển
        <input required minLength={2} maxLength={100} value={carrierName} disabled={mutation.isPending || overdue}
          onChange={(event) => setCarrierName(event.target.value)}
          className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white p-3 outline-none focus:border-[#C59B58]" />
      </label>
      <label className="block text-sm font-medium text-[#1A1612]">Mã vận đơn
        <input required minLength={5} maxLength={100} value={trackingNumber} disabled={mutation.isPending || overdue}
          onChange={(event) => setTrackingNumber(event.target.value)}
          className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white p-3 outline-none focus:border-[#C59B58]" />
      </label>
      <label className="block text-sm font-medium text-[#1A1612]">Ảnh biên nhận
        <input required type="file" accept="image/jpeg,image/png,image/webp" disabled={mutation.isPending || overdue}
          onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm" />
      </label>
      {overdue && <p role="alert" className="text-sm text-[#DC2626]">Đã quá hạn gửi hàng. Bạn có thể mở khiếu nại sau khi hồ sơ cập nhật trạng thái.</p>}
      {(validationError || mutation.error) && <p role="alert" className="text-sm text-[#DC2626]">
        {validationError || (mutation.error instanceof Error ? mutation.error.message : 'Không thể gửi vận đơn.')}
      </p>}
      <button type="submit" disabled={mutation.isPending || overdue || !receipt}
        className="rounded-xl bg-[#C59B58] px-5 py-2.5 font-bold text-white hover:bg-[#B88E4F] disabled:opacity-50">
        {mutation.isPending ? 'Đang tải ảnh và gửi…' : 'Xác nhận đã gửi'}
      </button>
    </form>
  );
}
