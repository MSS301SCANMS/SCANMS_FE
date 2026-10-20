import { useState, type FormEvent } from 'react';
import { useReturnAction } from '../../hooks/useReturnDetail';
import { returnService } from '../../services/return.service';

export function DisputeModal({ returnId, onClose }: { returnId: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const mutation = useReturnAction(returnId, returnService.openDispute);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await mutation.mutateAsync({ reason, details: details.trim() });
      onClose();
    } catch {
      // Keep the form open with the server error visible.
    }
  }

  return (
    <div role="presentation" className="fixed inset-0 z-[80] grid place-items-center bg-[#231D15]/65 p-4">
      <form onSubmit={(event) => void submit(event)} role="dialog" aria-modal="true" aria-labelledby="return-dispute-title"
        className="w-full max-w-lg space-y-4 rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-2xl">
        <h2 id="return-dispute-title" className="text-lg font-bold text-[#1A1612]">Gửi khiếu nại đổi trả</h2>
        <label className="block text-sm font-medium">Lý do
          <select required value={reason} onChange={(event) => setReason(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white p-3">
            <option value="">Chọn lý do</option>
            <option value="UNJUSTIFIED_REJECTION">Từ chối chưa hợp lý</option>
            <option value="WRONG_INSPECTION">Kết quả kiểm tra không đúng</option>
            <option value="REFUND_PROBLEM">Vấn đề hoàn tiền</option>
            <option value="DELIVERY_PROBLEM">Vấn đề vận chuyển</option>
            <option value="OTHER">Khác</option>
          </select>
        </label>
        <label className="block text-sm font-medium">Mô tả chi tiết
          <textarea required minLength={20} maxLength={2000} rows={5} value={details}
            onChange={(event) => setDetails(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#EAE4D7] p-3" />
        </label>
        {mutation.error && <p role="alert" className="text-sm text-[#DC2626]">
          {mutation.error instanceof Error ? mutation.error.message : 'Không thể gửi khiếu nại.'}
        </p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={mutation.isPending}
            className="rounded-xl border border-[#EAE4D7] px-4 py-2">Hủy</button>
          <button type="submit" disabled={mutation.isPending || !reason || details.trim().length < 20}
            className="rounded-xl bg-[#C59B58] px-4 py-2 font-semibold text-white disabled:opacity-50">
            {mutation.isPending ? 'Đang gửi…' : 'Gửi khiếu nại'}
          </button>
        </div>
      </form>
    </div>
  );
}
