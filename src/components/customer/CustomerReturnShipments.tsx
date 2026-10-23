import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { returnService, type ReturnDetail } from '../../services/return.service';
import { returnStatusLabel } from '../../utils/return-status.utils';
import { formatMoney } from '../../utils/marketplace.utils';

type ShipmentInput = Parameters<typeof returnService.send>[1];
type Plan = { rows: ReturnDetail[]; inputs: Record<string, ShipmentInput> };
const title = (row: ReturnDetail) => row.items.map(item => `${item.orderItem.product.title} × ${item.quantity}`).join(', ') || 'Sản phẩm trả lại';
const message = (cause: unknown) => cause instanceof Error ? cause.message : 'Chưa gửi được hàng trả. Vui lòng thử lại.';

export function CustomerReturnShipments({ requests, onUpdated }: {
  requests: ReturnDetail[];
  onUpdated: (row: ReturnDetail) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [review, setReview] = useState<ReturnDetail[] | null>(null);
  const [environment, setEnvironment] = useState<'TEST' | 'MANUAL'>('MANUAL');
  const [manual, setManual] = useState<Record<string, { carrier: string; trackingCode: string }>>({});
  const [plan, setPlan] = useState<Plan | null>(null);
  const completed = useRef(new Set<string>());
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const acting = useRef(false);
  const [error, setError] = useState('');
  const allRef = useRef<HTMLInputElement>(null);
  const eligible = requests.filter(row => row.status === 'APPROVED' && !row.logistics);
  const selected = eligible.filter(row => selectedIds.includes(row.id));
  const allChecked = eligible.length > 0 && selected.length === eligible.length;
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = selected.length > 0 && !allChecked;
  }, [selected.length, allChecked]);

  const open = async () => {
    if (acting.current || !selected.length) return;
    acting.current = true; setBusy(true); setError('');
    try {
      const fresh = await Promise.all(selected.map(row => returnService.getOne(row.id)));
      fresh.forEach(onUpdated);
      if (fresh.some(row => row.status !== 'APPROVED' || row.logistics)) throw new Error('Trạng thái đã thay đổi. Hãy chọn lại các sản phẩm còn chờ gửi hàng.');
      setReview(fresh);
      setEnvironment(fresh.every(row => row.simulationEnabled) ? 'TEST' : 'MANUAL');
    } catch (cause) { setError(message(cause)); }
    finally { acting.current = false; setBusy(false); }
  };
  const close = () => {
    if (acting.current) return;
    setReview(null); setPlan(null); setCompletedIds([]); completed.current.clear(); setError('');
    setSelectedIds(ids => ids.filter(id => eligible.some(row => row.id === id)));
  };
  const send = async () => {
    if (acting.current || !review?.length) return;
    if (!plan && environment === 'MANUAL' && review.some(row => !manual[row.id]?.carrier.trim() || !manual[row.id]?.trackingCode.trim())) return;
    acting.current = true; setBusy(true); setError('');
    const submission: Plan = plan || {
      rows: review,
      inputs: Object.fromEntries(review.map(row => [row.id, environment === 'TEST' ? { environment: 'TEST' } : {
        environment: 'MANUAL', carrier: manual[row.id].carrier.trim(), trackingCode: manual[row.id].trackingCode.trim(),
      }])),
    };
    setPlan(submission);
    try {
      for (const row of submission.rows) {
        if (completed.current.has(row.id)) continue;
        // Reconcile an uncertain response before retrying, so an existing shipment is not sent twice.
        const fresh = await returnService.getOne(row.id);
        onUpdated(fresh);
        if (['RETURNING', 'RECEIVED', 'REFUND_PENDING', 'REFUNDED'].includes(fresh.status)) {
          completed.current.add(row.id); setCompletedIds([...completed.current]); continue;
        }
        if (fresh.status !== 'APPROVED' || fresh.logistics) throw new Error(`${title(row)}: hồ sơ không còn ở trạng thái chờ gửi hàng.`);
        if (submission.inputs[row.id].environment === 'TEST' && !fresh.simulationEnabled) throw new Error(`${title(row)}: mô phỏng vận chuyển hiện không được bật.`);
        const updated = await returnService.send(row.id, submission.inputs[row.id]);
        completed.current.add(row.id); setCompletedIds([...completed.current]); onUpdated(updated);
      }
    } catch (cause) { setError(message(cause)); }
    finally { acting.current = false; setBusy(false); }
  };

  return <section aria-label="Hồ sơ trả hàng / hoàn tiền" className="mx-4 mb-3 grid min-w-0 gap-3 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3">
    <h3 className="text-xs font-semibold">Trả hàng / Hoàn tiền</h3>
    {eligible.length > 0 && <label className="flex min-h-10 cursor-pointer items-center gap-3 text-xs font-semibold"><input ref={allRef} type="checkbox" checked={allChecked} disabled={busy || Boolean(review)} onChange={event => setSelectedIds(event.target.checked ? eligible.map(row => row.id) : [])} className="h-4 w-4 accent-[#9A7033]" />Chọn tất cả sản phẩm chờ gửi ({selected.length}/{eligible.length})</label>}
    <div role="group" aria-label="Chọn sản phẩm gửi trả về shop" className="grid gap-2">{requests.map(row => {
      const canSend = row.status === 'APPROVED' && !row.logistics;
      return <div key={row.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-[#EAE4D7] bg-white p-3">
        <label className="flex min-w-0 flex-1 basis-48 items-start gap-3 text-xs">
          <input type="checkbox" aria-label={`Gửi trả ${title(row)}`} checked={canSend && selectedIds.includes(row.id)} disabled={!canSend || busy || Boolean(review)} onChange={event => setSelectedIds(ids => event.target.checked ? [...ids, row.id] : ids.filter(id => id !== row.id))} className="mt-0.5 h-4 w-4 shrink-0 accent-[#9A7033]" />
          <span className="grid min-w-0 gap-1"><strong className="break-words">{title(row)}</strong><span>{returnStatusLabel(row.status)}</span>{row.refundAmountVnd != null && <span className="text-[#7D715E]">Tiền hoàn sản phẩm: {formatMoney(row.refundAmountVnd)}</span>}</span>
        </label>
        <Link to={`/customer/returns/${encodeURIComponent(row.id)}`} className="rounded-lg border border-[#DCCAAD] bg-[#FBF5EB] px-3 py-2 text-xs font-semibold text-[#725120] no-underline">{canSend ? 'Gửi hàng trả về shop' : 'Theo dõi trả hàng / hoàn tiền'}</Link>
      </div>;
    })}</div>
    {error && <p role="alert" className="m-0 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    {!review && eligible.length > 0 && <button type="button" disabled={busy || !selected.length} onClick={() => void open()} className="min-h-11 justify-self-start rounded-lg bg-[#9A7033] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Đang kiểm tra…' : `Gửi các sản phẩm đã chọn về shop (${selected.length})`}</button>}
    {review && <form aria-label="Gửi các sản phẩm đã chọn" onSubmit={event => { event.preventDefault(); void send(); }} className="grid min-w-0 gap-3 rounded-xl border border-[#DCCAAD] bg-white p-4">
      <h4 className="text-sm font-semibold">Gửi {review.length} sản phẩm trả về shop</h4>
      <p className="m-0 text-xs leading-6 text-[#7D715E]">Một lần thao tác cho các món đã chọn. Mỗi hồ sơ vẫn có trạng thái vận chuyển và tiền hoàn riêng; gửi hàng chưa cộng tiền vào ví.</p>
      <fieldset disabled={busy || Boolean(plan)} className="grid min-w-0 gap-3">
        <legend className="mb-2 text-xs font-semibold">Cách gửi hàng</legend>
        {review.every(row => row.simulationEnabled) && <label className="flex min-h-10 items-center gap-2 text-xs"><input type="radio" name={`return-shipping-${review[0].id}`} checked={environment === 'TEST'} onChange={() => setEnvironment('TEST')} />Vận chuyển mô phỏng</label>}
        <label className="flex min-h-10 items-center gap-2 text-xs"><input type="radio" name={`return-shipping-${review[0].id}`} checked={environment === 'MANUAL'} onChange={() => setEnvironment('MANUAL')} />Nhập vận đơn gửi hàng thật</label>
        {environment === 'MANUAL' && <p className="m-0 text-xs text-[#7D715E]">Liên hệ shop xác nhận địa chỉ nhận hàng trước khi gửi. Điền vận đơn tương ứng cho từng sản phẩm.</p>}
        {review.map(row => <div key={row.id} className="grid min-w-0 gap-3 rounded-lg border border-[#EAE4D7] p-3 text-xs">
          <strong className="break-words">{title(row)}</strong>
          {environment === 'MANUAL' && <>{(['carrier', 'trackingCode'] as const).map(field => <label key={field} className="grid gap-1">{field === 'carrier' ? 'Đơn vị vận chuyển' : 'Mã vận đơn'}<input aria-label={`${field === 'carrier' ? 'Đơn vị vận chuyển' : 'Mã vận đơn'} ${title(row)}`} required maxLength={100} value={manual[row.id]?.[field] || ''} onChange={event => setManual(previous => ({ ...previous, [row.id]: { ...(previous[row.id] || { carrier: '', trackingCode: '' }), [field]: event.target.value } }))} className="min-h-10 w-full min-w-0 rounded-lg border border-[#EAE4D7] p-2" /></label>)}</>}
          {completedIds.includes(row.id) && <span className="font-semibold text-green-700">Đã ghi nhận gửi hàng</span>}
        </div>)}
      </fieldset>
      {plan && <p role="status" className="m-0 text-xs text-[#7D715E]">Đã ghi nhận {completedIds.length}/{plan.rows.length} hồ sơ.{completedIds.length < plan.rows.length && !busy ? ' Thử lại để tiếp tục các hồ sơ còn lại.' : ''}</p>}
      <div className="flex flex-wrap gap-2">
        {(!plan || completedIds.length < plan.rows.length) && <button disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#9A7033] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy && <Loader2 size={15} className="animate-spin" />}{busy ? 'Đang gửi…' : plan ? 'Thử lại các hồ sơ còn lại' : environment === 'TEST' ? 'Tạo chuyến trả hàng mô phỏng cho các món đã chọn' : 'Xác nhận đã gửi các món đã chọn'}</button>}
        <button type="button" disabled={busy} onClick={close} className="min-h-11 rounded-lg border border-[#DCCAAD] px-4 py-2 text-xs font-semibold disabled:opacity-50">{plan && completedIds.length === plan.rows.length ? 'Hoàn tất' : 'Đóng'}</button>
      </div>
    </form>}
  </section>;
}
