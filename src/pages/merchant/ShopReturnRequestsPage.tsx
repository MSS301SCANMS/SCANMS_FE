import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, FileText, Image as ImageIcon, Loader2, MessageSquare, Package, RefreshCw, Search, Send, Video } from 'lucide-react';
import { shopReturnsService, safeReturnMedia, type ShopReturnRequest, type ShopReturnStatus } from '../../services/shop-returns.service';
import { ImageUploadDropzone } from '../../components/ui/ImageUploadDropzone';
import { formatMoney } from '@/utils/marketplace.utils';
import { toast } from '../../utils/toast';
import { Link } from 'react-router-dom';
import { returnService } from '../../services/return.service';
import { canReceiveReturn, returnArrived } from '../../utils/return-flow';

const STATUS: Record<ShopReturnStatus, string> = {
  REQUESTED: 'Đang tiếp nhận', APPROVED: 'Đã duyệt yêu cầu', REJECTED: 'Đã từ chối',
  RETURNING: 'Đang trả hàng', RECEIVED: 'Đã nhận hàng trả', REFUND_PENDING: 'Chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền', CANCELLED: 'Đã hủy',
};
const waiting = (row: ShopReturnRequest) => row.status === 'REQUESTED' && !row.shopResponse;
const searchText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi');
const date = (value?: string | null) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Chưa cập nhật';

function StatusBadge({ row }: { row: ShopReturnRequest }) {
  const text = returnArrived(row) ? 'Chờ xác nhận nhận hàng trả' : waiting(row) ? 'Chờ giải trình' : row.status === 'REQUESTED' ? 'Đã gửi giải trình' : STATUS[row.status] || row.status;
  return <span className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${waiting(row) ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#625747]'}`}>{text}</span>;
}

function Images({ images, label }: { images: unknown; label: string }) {
  const urls = Array.isArray(images) ? images.map(safeReturnMedia).filter((url): url is string => Boolean(url)).slice(0, 10) : [];
  if (!urls.length) return null;
  return <div className="grid gap-2"><p className="m-0 flex items-center gap-1.5 text-xs font-medium text-[#7D715E]"><ImageIcon size={14} />{label}</p><div className="flex flex-wrap gap-2">{urls.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer" aria-label={`${label} ${index + 1}, mở ảnh`} className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-[#EAE4D7] bg-[#FAF8F5]"><img src={url} alt={`${label} ${index + 1}`} loading="lazy" className="h-full w-full object-contain" /></a>)}</div></div>;
}

function CustomerVideo({ value }: { value: unknown }) {
  const source = safeReturnMedia(value);
  if (!source) return <p className="m-0 flex items-center gap-2 rounded-lg bg-[#FAF8F5] p-3 text-xs text-[#7D715E]"><Video size={16} />Khách chưa đính kèm video mở hộp.</p>;
  const url = new URL(source);
  let embed: string | null = null;
  if (['youtube.com', 'www.youtube.com', 'youtu.be'].includes(url.hostname)) {
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.split('/').pop();
    if (id && /^[\w-]{11}$/.test(id)) embed = `https://www.youtube.com/embed/${id}`;
  } else if (['vimeo.com', 'www.vimeo.com'].includes(url.hostname) && /^\/\d+$/.test(url.pathname)) embed = `https://player.vimeo.com/video${url.pathname}`;
  return <div className="grid gap-2"><p className="m-0 flex items-center gap-1.5 text-xs font-medium text-[#7D715E]"><Video size={14} />Video bằng chứng</p>{embed ? <iframe title="Video bằng chứng của khách" src={embed} className="aspect-video w-full rounded-xl border border-[#EAE4D7]" allowFullScreen /> : <video src={source} controls playsInline preload="metadata" className="max-h-72 w-full rounded-xl bg-black" />}<a href={source} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8F682E] underline underline-offset-4">Mở video gốc</a></div>;
}

function ResponseForm({ row, onSaved }: { row: ShopReturnRequest; onSaved: (row: ShopReturnRequest) => void }) {
  const responseId = `shop-return-response-${row.returnRequestId}`;
  const [response, setResponse] = useState('');
  const [images, setImages] = useState(['', '']);
  const [uploadingImages, setUploadingImages] = useState([false, false]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const submit = async () => {
    if (sending.current || uploadingImages.some(Boolean) || !response.trim()) return;
    sending.current = true; setSaving(true); setError('');
    try {
      const updated = await shopReturnsService.respond(row.returnRequestId, response.trim(), images.filter(Boolean));
      onSaved(updated);
      toast.success('Đã lưu giải trình và bằng chứng của gian hàng.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa gửi được giải trình. Vui lòng thử lại.'); }
    finally { sending.current = false; setSaving(false); }
  };
  return <section aria-labelledby={`${responseId}-title`} className="grid min-w-0 gap-4 rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5">
    <div className="flex items-start gap-2.5"><MessageSquare size={19} className="mt-0.5 shrink-0 text-[#B88E4F]" /><div><h2 id={`${responseId}-title`} className="m-0 text-sm font-semibold">Giải trình của gian hàng</h2><p className="mb-0 mt-1 text-xs leading-5 text-[#7D715E]">Mô tả tình trạng hàng và đính kèm bằng chứng để bộ phận xử lý đối chiếu.</p></div></div>
    {error && <p role="alert" className="m-0 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</p>}
    <div className="grid gap-2"><label htmlFor={responseId} className="text-xs font-medium">Nội dung giải trình <span className="text-[#B88E4F]">*</span></label><textarea id={responseId} value={response} disabled={saving} maxLength={5000} onChange={event => setResponse(event.target.value)} placeholder="Tình trạng sản phẩm khi xuất kho, đóng gói và thông tin cần đối chiếu…" rows={5} className="min-h-28 w-full resize-y rounded-xl border border-[#EAE4D7] bg-white p-3 text-sm outline-none focus:border-[#B88E4F] disabled:opacity-60" /><span className="text-right text-[10px] text-[#7D715E]">{response.length}/5.000 ký tự</span></div>
    <fieldset disabled={saving} className="m-0 grid min-w-0 grid-cols-1 gap-3 border-0 p-0 sm:grid-cols-2">{images.map((value, index) => <ImageUploadDropzone key={index} variant="document" iconType="file" label={`Bằng chứng ${index + 1} (tùy chọn)`} folder="scanms/returns/shop-evidence" value={value} onChange={url => setImages(previous => previous.map((item, i) => i === index ? url : item))} onUploadingChange={uploading => setUploadingImages(previous => previous.map((item, i) => i === index ? uploading : item))} />)}</fieldset>
    <p className="m-0 text-xs leading-5 text-[#7D715E]">Gửi giải trình không tự duyệt yêu cầu hoặc hoàn tiền. Kết quả xử lý được cập nhật tại hồ sơ này.</p>
    <button type="button" onClick={() => void submit()} disabled={saving || uploadingImages.some(Boolean) || !response.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#C59B58] bg-[#FBF5EB] px-4 py-2.5 text-xs font-semibold text-[#725120] transition hover:bg-[#F3E9D8] disabled:cursor-not-allowed disabled:opacity-50 sm:justify-self-end">{saving || uploadingImages.some(Boolean) ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}{saving ? 'Đang gửi…' : uploadingImages.some(Boolean) ? 'Đang tải ảnh…' : 'Gửi giải trình'}</button>
  </section>;
}

function ReceiveReturn({ row, onSaved }: { row: ShopReturnRequest; onSaved: () => Promise<void> }) {
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const receive = async () => {
    if (sending.current || !canReceiveReturn(row)) return;
    sending.current = true; setBusy(true); setError('');
    try {
      await returnService.confirmReceipt(row.returnRequestId);
      toast.success('Đã ghi nhận shop nhận hàng trả. Hệ thống tiếp tục xử lý hoàn tiền.');
      await onSaved();
    } catch (cause: any) { setError(cause?.response?.data?.message || cause?.message || 'Chưa xác nhận được nhận hàng trả.'); }
    finally { sending.current = false; setBusy(false); }
  };
  return <section aria-label="Nhận hàng trả" className="grid gap-3 rounded-2xl border border-[#DCCAAD] bg-[#FBF5EB] p-4 sm:p-5">
    <h2 className="text-sm font-semibold">{returnArrived(row) ? 'Hàng trả đã đến shop' : 'Theo dõi hàng trả về shop'}</h2>
    <p className="m-0 text-xs leading-6 text-[#7D715E]">{canReceiveReturn(row) ? 'Kiểm tra kiện hàng thực tế trước khi xác nhận. Xác nhận nhận hàng sẽ chuyển hồ sơ sang bước xử lý hoàn tiền cho khách.' : 'Chuyến trả hàng đang được vận chuyển. Nút xác nhận sẽ xuất hiện khi hàng mô phỏng đã đến shop.'}</p>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    {canReceiveReturn(row) && <button disabled={busy} onClick={() => void receive()} className="min-h-11 justify-self-start rounded-xl bg-[#9A7033] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Đang xác nhận…' : 'Xác nhận shop đã nhận hàng trả'}</button>}
    <Link to={`/merchant/returns/${row.returnRequestId}`} className="text-xs font-semibold text-[#725120] underline">Mở tiến trình trả hàng / hoàn tiền</Link>
  </section>;
}

function ReceiveReturn({ row, onSaved }: { row: ShopReturnRequest; onSaved: () => Promise<void> }) {
  const sending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const receive = async () => {
    if (sending.current || !canReceiveReturn(row)) return;
    sending.current = true; setBusy(true); setError('');
    try {
      await returnService.confirmReceipt(row.returnRequestId);
      toast.success('Đã ghi nhận shop nhận hàng trả. Hệ thống tiếp tục xử lý hoàn tiền.');
      await onSaved();
    } catch (cause: any) { setError(cause?.response?.data?.message || cause?.message || 'Chưa xác nhận được nhận hàng trả.'); }
    finally { sending.current = false; setBusy(false); }
  };
  return <section aria-label="Nhận hàng trả" className="grid gap-3 rounded-2xl border border-[#DCCAAD] bg-[#FBF5EB] p-4 sm:p-5">
    <h2 className="text-sm font-semibold">{returnArrived(row) ? 'Hàng trả đã đến shop' : 'Theo dõi hàng trả về shop'}</h2>
    <p className="m-0 text-xs leading-6 text-[#7D715E]">{canReceiveReturn(row) ? 'Kiểm tra kiện hàng thực tế trước khi xác nhận. Xác nhận nhận hàng sẽ chuyển hồ sơ sang bước xử lý hoàn tiền cho khách.' : 'Chuyến trả hàng đang được vận chuyển. Nút xác nhận sẽ xuất hiện khi hàng mô phỏng đã đến shop.'}</p>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    {canReceiveReturn(row) && <button disabled={busy} onClick={() => void receive()} className="min-h-11 justify-self-start rounded-xl bg-[#9A7033] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Đang xác nhận…' : 'Xác nhận shop đã nhận hàng trả'}</button>}
    <Link to={`/merchant/returns/${row.returnRequestId}`} className="text-xs font-semibold text-[#725120] underline">Mở tiến trình trả hàng / hoàn tiền</Link>
  </section>;
}

export const ShopReturnRequestsPage = () => {
  const [rows, setRows] = useState<ShopReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'WAITING' | 'HANDLED'>('ALL');
  const [query, setQuery] = useState('');
  const requestNumber = useRef(0);
  const load = useCallback(async (signal?: AbortSignal, silent = false) => {
    const number = ++requestNumber.current;
    if (!silent) { setLoading(true); setError(''); }
    try {
      const result = await shopReturnsService.list(signal);
      if (signal?.aborted || number !== requestNumber.current) return;
      setRows(result);
      setError('');
      setSelectedId(current => result.some(row => row.returnRequestId === current) ? current : result[0]?.returnRequestId || null);
    } catch (cause) {
      if (!signal?.aborted && number === requestNumber.current) setError(cause instanceof Error ? cause.message : 'Không tải được yêu cầu đổi trả.');
    } finally { if (!signal?.aborted && number === requestNumber.current) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  useEffect(() => {
    const refresh = () => { if (!document.hidden) void load(undefined, true); };
    const timer = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); requestNumber.current++; };
  }, [load]);
  const filtered = useMemo(() => rows.filter(row => {
    if (filter === 'WAITING' && !waiting(row)) return false;
    if (filter === 'HANDLED' && waiting(row)) return false;
    if (filter === 'TRANSIT' && (row.status !== 'RETURNING' || canReceiveReturn(row))) return false;
    if (filter === 'RECEIPT' && !canReceiveReturn(row)) return false;
    if (filter === 'REFUND' && !['RECEIVED', 'REFUND_PENDING', 'REFUNDED'].includes(row.status)) return false;
    return searchText(`${row.orderId} ${row.returnRequestId} ${row.customerName} ${row.productName} ${row.storeName}`).includes(searchText(query.trim()));
  }), [rows, query, filter]);
  const groups = useMemo(() => groupByOrder(rows), [rows]);
  const visibleGroups = useMemo(() => {
    const matchingIds = new Set(filtered.map(row => row.returnRequestId));
    return groups.map(group => ({ ...group, matching: group.requests.filter(row => matchingIds.has(row.returnRequestId)) }))
      .filter(group => group.matching.length > 0);
  }, [groups, filtered]);
  const selected = filtered.find(row => row.returnRequestId === selectedId) || filtered[0] || null;
  const selectedGroup = visibleGroups.find(group => selected && group.key === orderKey(selected));
  // Selections stay within the displayed order and filter; hidden requests are never acted on.
  const selectionScope = JSON.stringify([selectedGroup?.key, filter, query.trim()]);
  const checkedIds = selection.scope === selectionScope ? selection.ids : selected ? [selected.returnRequestId] : [];
  const selectedRequests = selectedGroup?.matching.filter(row => checkedIds.includes(row.returnRequestId)) || [];
  const allChecked = Boolean(selectedGroup?.matching.length && selectedRequests.length === selectedGroup.matching.length);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selectedRequests.length > 0 && !allChecked;
  }, [selectedRequests.length, allChecked, loading, error]);
  const toggleRequest = (id: string, checked: boolean) => setSelection({
    scope: selectionScope, ids: checked ? [...checkedIds, id] : checkedIds.filter(value => value !== id),
  });
  const groupRefund = selectedGroup && selectedGroup.requests.every(row => row.refundAmountVnd != null)
    ? selectedGroup.requests.reduce((sum, row) => sum + row.refundAmountVnd!, 0) : null;
  const update = (row: ShopReturnRequest) => setRows(previous => previous.map(item => item.returnRequestId === row.returnRequestId ? row : item));

  return <section aria-label="Yêu cầu đổi trả của gian hàng" className="grid min-w-0 gap-4 text-left text-[#1A1612]">
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">{[
      { label: 'Tổng yêu cầu', value: rows.length },
      { label: 'Chờ giải trình', value: rows.filter(waiting).length },
      { label: 'Chờ nhận hàng trả', value: rows.filter(canReceiveReturn).length },
      { label: 'Đã phản hồi / xử lý', value: rows.filter(row => !waiting(row)).length },
    ].map(stat => <div key={stat.label} className="rounded-xl border border-[#EAE4D7] bg-white px-4 py-3"><span className="block text-[11px] text-[#7D715E]">{stat.label}</span><strong className="mt-1 block text-2xl font-semibold">{loading && !rows.length ? '—' : error && !rows.length ? '—' : stat.value}</strong></div>)}</div>
    <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-[#EAE4D7] bg-white p-3">
      <div className="relative min-w-0 flex-1 basis-56"><Search size={16} className="pointer-events-none absolute left-3 top-3 text-[#7D715E]" /><input aria-label="Tìm yêu cầu đổi trả" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm mã đơn, khách hàng, sản phẩm…" className="min-h-10 w-full rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#B88E4F]" /></div>
      <div role="group" aria-label="Lọc yêu cầu đổi trả" className="flex min-w-0 flex-wrap gap-1">{([['ALL', 'Tất cả'], ['WAITING', 'Chờ giải trình'], ['TRANSIT', 'Đang trả về'], ['RECEIPT', 'Chờ nhận hàng trả'], ['REFUND', 'Hoàn tiền'], ['HANDLED', 'Đã phản hồi']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-10 rounded-lg border px-3 text-xs font-medium ${filter === value ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : 'border-transparent text-[#7D715E] hover:bg-[#FAF8F5]'}`}>{label}</button>)}</div>
      <button type="button" onClick={() => void load()} disabled={loading} aria-label="Làm mới yêu cầu đổi trả" title="Làm mới" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#EAE4D7] text-[#7D715E] hover:bg-[#FAF8F5] disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
    </div>
    {error ? <div role="alert" className="grid justify-items-start gap-3 rounded-xl border border-red-200 bg-white p-5"><span className="flex items-start gap-2 text-sm leading-6 text-red-700"><AlertCircle size={18} className="mt-1 shrink-0" />{error}</span><button type="button" onClick={() => void load()} className="min-h-10 rounded-lg border border-[#EAE4D7] px-4 text-xs font-medium">Thử tải lại</button></div>
    : loading ? <div role="status" className="flex items-center justify-center gap-2 rounded-2xl border border-[#EAE4D7] bg-white py-14 text-sm text-[#7D715E]"><Loader2 size={18} className="animate-spin" />Đang tải yêu cầu đổi trả…</div>
    : !rows.length ? <div className="grid justify-items-center gap-2 rounded-2xl border border-[#EAE4D7] bg-white px-5 py-14 text-center"><Package size={30} className="text-[#B88E4F]" /><strong className="text-sm font-semibold">Chưa có yêu cầu đổi trả</strong><p className="m-0 max-w-md text-xs leading-6 text-[#7D715E]">Yêu cầu thuộc gian hàng của bạn sẽ hiển thị tại đây để xem bằng chứng và gửi giải trình.</p></div>
    : !filtered.length ? <div role="status" className="rounded-2xl border border-[#EAE4D7] bg-white p-10 text-center text-sm text-[#7D715E]">Không có yêu cầu phù hợp với bộ lọc.</div>
    : <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(240px,0.85fr)_minmax(0,2fr)]">
      <div className="grid min-w-0 gap-2" aria-label="Danh sách yêu cầu">{filtered.map(row => <button key={row.returnRequestId} type="button" aria-pressed={selected?.returnRequestId === row.returnRequestId} onClick={() => setSelectedId(row.returnRequestId)} className={`grid min-w-0 gap-2 rounded-xl border p-3 text-left ${selected?.returnRequestId === row.returnRequestId ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7] bg-white hover:border-[#DCCAAD]'}`}><div className="flex min-w-0 flex-wrap items-center justify-between gap-2"><span className="min-w-0 break-all font-mono text-xs font-semibold">#{row.orderId}</span><StatusBadge row={row} /></div><span className="text-xs font-medium">{row.productName || 'Sản phẩm trong đơn'} × {row.quantity}</span><span className="text-xs text-[#7D715E]">{row.customerName || 'Khách hàng'} · {row.storeName}</span><span className="text-[10px] text-[#7D715E]">Ngày gửi: {date(row.requestedAt)}</span></button>)}</div>
      {selected && <div className="grid min-w-0 gap-4" key={selected.returnRequestId}>
        <section className="grid min-w-0 gap-4 rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5" aria-label="Chi tiết yêu cầu">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="grid min-w-0 gap-1"><span className="text-[10px] text-[#7D715E]">Mã đơn hàng</span><strong className="break-all font-mono text-sm">{selected.orderId}</strong><span className="break-all text-[10px] text-[#7D715E]">Yêu cầu: {selected.returnRequestId}</span></div><StatusBadge row={selected} /></div>
          <dl className="m-0 grid grid-cols-1 gap-3 border-y border-[#EAE4D7] py-4 sm:grid-cols-2">{[
            ['Khách hàng', selected.customerName || 'Chưa cập nhật'], ['Số điện thoại', selected.customerPhone || 'Chưa cập nhật'],
            ['Sản phẩm', `${selected.productName || 'Sản phẩm trong đơn'} × ${selected.quantity}`], ['Số tiền hoàn dự kiến', selected.refundAmountVnd == null ? 'Chờ xác định' : formatMoney(selected.refundAmountVnd)],
          ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[10px] text-[#7D715E]">{label}</dt><dd className="m-0 mt-1 break-words text-xs font-medium">{value}</dd></div>)}</dl>
          <p className="m-0 flex items-start gap-2 text-xs leading-6 text-[#7D715E]"><CalendarDays size={16} className="mt-1 shrink-0 text-[#B88E4F]" /><span>Đã giao: {date(selected.deliveredAt)}<br />Hạn gửi yêu cầu đổi trả: {date(selected.returnDeadline)}</span></p>
          <div className="grid gap-1 rounded-xl bg-[#FAF8F5] p-3"><h2 className="m-0 text-xs font-semibold">Lý do đổi trả</h2><p className="m-0 whitespace-pre-wrap break-words text-sm leading-6">{REASONS[selected.reason] || selected.reason || 'Chưa có nội dung'}</p>{notes && <p className="m-0 whitespace-pre-wrap break-words text-xs leading-6 text-[#7D715E]">{notes}</p>}</div>
          <CustomerVideo key={`${selected.returnRequestId}-${customerVideo}`} value={customerVideo} />
          <Images images={customerImages} label="Ảnh bằng chứng của khách" />
          <Link className="text-sm font-semibold text-[#725120] underline" to={`/merchant/returns/${selected.returnRequestId}`}>Theo dõi hàng trả và xác nhận đã nhận</Link>
        </section>
        {selected.shopResponse ? <section aria-label="Giải trình đã gửi" className="grid gap-3 rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5"><h2 className="m-0 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={18} className="text-[#47805A]" />Đã gửi giải trình</h2><p className="m-0 text-[10px] text-[#7D715E]">{date(selected.shopResponse.submittedAt)}</p><p className="m-0 whitespace-pre-wrap break-words text-sm leading-6">{selected.shopResponse.response}</p><Images images={selected.shopResponse.imageUrls} label="Bằng chứng của gian hàng" /></section> : waiting(selected) ? <ResponseForm row={selected} onSaved={update} /> : null}
        {selected.decisionReason && <section className="grid gap-2 rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5"><h2 className="m-0 flex items-center gap-2 text-sm font-semibold"><FileText size={17} className="text-[#B88E4F]" />Kết quả xử lý</h2><p className="m-0 text-xs text-[#7D715E]">{date(selected.resolvedAt)} · {STATUS[selected.status]}</p><p className="m-0 whitespace-pre-wrap break-words text-sm leading-6">{selected.decisionReason}</p></section>}
        </div>;
        })}
      </div>}
    </div>}
  </section>;
};
