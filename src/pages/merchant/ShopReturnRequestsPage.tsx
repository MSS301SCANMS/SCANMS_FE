import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, FileText, Image as ImageIcon, Loader2, MessageSquare, Package, Search, Send, Video, XCircle } from 'lucide-react';
import { shopReturnsService, safeReturnMedia, type ShopReturnRequest, type ShopReturnStatus } from '../../services/shop-returns.service';
import { ImageUploadDropzone } from '../../components/ui/ImageUploadDropzone';
import { formatMoney } from '@/utils/marketplace.utils';
import { toast } from '../../utils/toast';
import { Link, useSearchParams } from 'react-router-dom';
import { returnService } from '../../services/return.service';
import { canReceiveReturn, returnArrived } from '../../utils/return-flow';
import { orderDisplayCode } from '../../utils/order-display-code';
import './ShopReturnRequestsPage.css';

const STATUS: Record<ShopReturnStatus, string> = {
  REQUESTED: 'Đang tiếp nhận', APPROVED: 'Đã duyệt yêu cầu', REJECTED: 'Đã từ chối',
  RETURNING: 'Đang trả hàng', RECEIVED: 'Đã nhận hàng trả', REFUND_PENDING: 'Chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền', CANCELLED: 'Đã hủy',
};
const waiting = (row: ShopReturnRequest) => row.status === 'REQUESTED';
const needsResponse = (row: ShopReturnRequest) => waiting(row) && !row.shopResponse;
const orderKey = (row: ShopReturnRequest) => JSON.stringify([row.orderId || row.returnRequestId, row.storeId]);
function groupByOrder(rows: ShopReturnRequest[]) {
  const groups = new Map<string, ShopReturnRequest[]>();
  for (const row of rows) {
    const key = orderKey(row);
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }
  return [...groups].map(([key, requests]) => ({ key, requests }));
}
const REASONS: Record<string, string> = { DAMAGED: 'Sản phẩm hư hỏng', WRONG_ITEM: 'Giao sai sản phẩm', EXPIRED: 'Sản phẩm hết hạn', OTHER: 'Lý do khác' };
const searchText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi');
const date = (value?: string | null) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Chưa cập nhật';

function StatusBadge({ row }: { row: ShopReturnRequest }) {
  const text = returnArrived(row) ? 'Chờ xác nhận nhận hàng trả' : waiting(row) ? 'Chờ Shop duyệt' : STATUS[row.status] || row.status;
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
  return <section aria-labelledby={`${responseId}-title`} className="grid min-w-0 gap-3 rounded-2xl border border-[#EAE4D7] bg-white p-3.5 sm:p-4">
    <div className="flex items-start gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FBF5EB] text-[#A77B3C]"><MessageSquare size={17} /></span><div><h2 id={`${responseId}-title`} className="m-0 text-sm font-semibold">Giải trình của gian hàng</h2><p className="mb-0 mt-1 text-xs leading-5 text-[#7D715E]">Mô tả tình trạng hàng và gửi bằng chứng để bộ phận xử lý đối chiếu.</p></div></div>
    {error && <p role="alert" className="m-0 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</p>}
    <div className="grid gap-2"><label htmlFor={responseId} className="text-xs font-medium">Nội dung giải trình <span className="text-[#B88E4F]">*</span></label><textarea id={responseId} value={response} disabled={saving} maxLength={5000} onChange={event => setResponse(event.target.value)} placeholder="Tình trạng sản phẩm khi xuất kho, đóng gói và thông tin cần đối chiếu…" rows={4} className="min-h-24 w-full resize-y rounded-xl border border-[#EAE4D7] bg-white p-3 text-sm outline-none focus:border-[#B88E4F] disabled:opacity-60" /><span className="text-right text-[10px] text-[#7D715E]">{response.length}/5.000 ký tự</span></div>
    <fieldset disabled={saving} className="m-0 grid min-w-0 grid-cols-1 gap-3 border-0 p-0 sm:grid-cols-2">{images.map((value, index) => <ImageUploadDropzone key={index} variant="document" iconType="file" label={`Bằng chứng ${index + 1} (tùy chọn)`} folder="scanms/returns/shop-evidence" value={value} onChange={url => setImages(previous => previous.map((item, i) => i === index ? url : item))} onUploadingChange={uploading => setUploadingImages(previous => previous.map((item, i) => i === index ? uploading : item))} />)}</fieldset>
    <p className="m-0 text-xs leading-5 text-[#7D715E]">Gửi giải trình sẽ lưu nội dung và bằng chứng. Shop vẫn cần chọn chấp thuận hoặc từ chối bên dưới để quyết định yêu cầu.</p>
    <button type="button" onClick={() => void submit()} disabled={saving || uploadingImages.some(Boolean) || !response.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#C59B58] bg-[#FBF5EB] px-4 py-2.5 text-xs font-semibold text-[#725120] transition hover:bg-[#F3E9D8] disabled:cursor-not-allowed disabled:opacity-50 sm:justify-self-end">{saving || uploadingImages.some(Boolean) ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}{saving ? 'Đang gửi…' : uploadingImages.some(Boolean) ? 'Đang tải ảnh…' : 'Gửi giải trình'}</button>
  </section>;
}

function DecisionActions({ row, onSaved }: { row: ShopReturnRequest; onSaved: (row: ShopReturnRequest) => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const decide = async (status: 'APPROVED' | 'REJECTED') => {
    const note = reason.trim();
    if (busy || (status === 'REJECTED' && note.length < 20)) return;
    setBusy(true);
    setError('');
    try {
      const updated = await shopReturnsService.decide(row.returnRequestId, status, note || undefined);
      onSaved(updated);
      toast.success(status === 'APPROVED' ? 'Đã chấp thuận trả hàng. Khách có thể gửi hàng về shop.' : 'Đã từ chối yêu cầu trả hàng.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa xử lý được yêu cầu. Vui lòng thử lại.');
    } finally { setBusy(false); }
  };
  return <section aria-label="Shop duyệt yêu cầu trả hàng" className="merchant-return-decision grid gap-3 rounded-2xl border border-[#EEE7DB] bg-white p-3.5 sm:p-4">
    <div><h2 className="m-0 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={17} className="text-[#B88E4F]" />Shop xem xét yêu cầu</h2></div>
    <label className="grid gap-1.5 text-xs font-medium" htmlFor={`shop-return-decision-${row.returnRequestId}`}>Căn cứ hoặc ghi chú <span className="font-normal text-[#7D715E]">(bắt buộc tối thiểu 20 ký tự nếu từ chối)</span>
      <textarea id={`shop-return-decision-${row.returnRequestId}`} value={reason} onChange={event => setReason(event.target.value)} disabled={busy} maxLength={3000} rows={3} placeholder="Ghi rõ căn cứ xử lý để khách hàng nắm được…" className="min-h-20 w-full resize-y rounded-xl border border-[#ECE7DE] bg-white p-3 text-sm font-normal outline-none focus:border-[#D5C19D] disabled:opacity-60" />
      <span className="text-right text-[10px] font-normal text-[#7D715E]">{reason.trim().length}/3.000 ký tự</span>
    </label>
    {error && <p role="alert" className="m-0 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" disabled={busy || reason.trim().length < 20} onClick={() => void decide('REJECTED')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#F0DDDA] bg-white px-3.5 text-xs font-semibold text-[#A75E58] transition hover:bg-[#FFFAF9] disabled:cursor-not-allowed disabled:opacity-50"><XCircle size={15} />Từ chối yêu cầu</button>
      <button type="button" disabled={busy} onClick={() => void decide('APPROVED')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#E7D7BA] bg-[#FBF5EB] px-3.5 text-xs font-semibold text-[#805D2C] transition hover:bg-[#F5ECDc] disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}Chấp thuận trả hàng</button>
    </div>
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
  return <section aria-label="Nhận hàng trả" className="grid gap-2.5 rounded-2xl border border-[#EAD8B9] bg-[#FFFCF6] p-3.5 sm:p-4">
    <h2 className="m-0 flex items-center gap-2 text-sm font-semibold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FBF5EB] text-[#A77B3C]"><Package size={16} /></span>{returnArrived(row) ? 'Hàng trả đã đến shop' : 'Theo dõi hàng trả về shop'}</h2>
    <p className="m-0 text-xs leading-6 text-[#7D715E]">{canReceiveReturn(row) ? 'Kiểm tra kiện hàng thực tế trước khi xác nhận. Xác nhận nhận hàng sẽ chuyển hồ sơ sang bước xử lý hoàn tiền cho khách.' : 'Chuyến trả hàng đang được vận chuyển. Nút xác nhận sẽ xuất hiện khi hàng mô phỏng đã đến shop.'}</p>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    {canReceiveReturn(row) && <button disabled={busy} onClick={() => void receive()} className="min-h-11 justify-self-start rounded-xl bg-[#9A7033] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Đang xác nhận…' : 'Xác nhận shop đã nhận hàng trả'}</button>}
    <Link to={`/merchant/returns/${row.returnRequestId}`} className="text-xs font-semibold text-[#725120] underline">Mở tiến trình trả hàng / hoàn tiền</Link>
  </section>;
}

export const ShopReturnRequestsPage = () => {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<ShopReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get('requestId'));
  const [selection, setSelection] = useState<{ scope: string; ids: string[] }>({ scope: '', ids: [] });
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<'ALL' | 'WAITING' | 'HANDLED' | 'TRANSIT' | 'RECEIPT' | 'REFUND'>('ALL');
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

  return <section aria-label="Yêu cầu đổi trả của gian hàng" className="merchant-returns-page grid min-w-0 gap-3.5 text-left text-[#1A1612]">
    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">{[
      { label: 'Đơn có yêu cầu trả hàng', value: groups.length },
      { label: 'Chờ Shop duyệt', value: rows.filter(waiting).length },
      { label: 'Chờ nhận hàng trả', value: rows.filter(canReceiveReturn).length },
      { label: 'Đã xử lý', value: rows.filter(row => !waiting(row)).length },
    ].map((stat, index) => <div key={stat.label} className="merchant-returns-stat flex min-w-0 items-center gap-3 rounded-xl border border-[#EAE4D7] bg-white px-3.5 py-2.5 sm:px-4"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${index === 1 ? 'bg-[#FFF8EB] text-[#AC7B31]' : index === 2 ? 'bg-[#F1F7F2] text-[#568366]' : 'bg-[#FBF5EB] text-[#A77B3C]'}`}>{index === 2 ? <Package size={16} /> : index === 1 ? <CalendarDays size={16} /> : <FileText size={16} />}</span><span className="min-w-0"><span className="block truncate text-[10px] text-[#7D715E]">{stat.label}</span><strong className="mt-0.5 block text-xl font-semibold leading-none">{loading && !rows.length ? '—' : error && !rows.length ? '—' : stat.value}</strong></span></div>)}</div>
    <div className="grid min-w-0 gap-2.5 rounded-xl border border-[#EAE4D7] bg-white p-2.5 sm:grid-cols-[minmax(220px,0.75fr)_minmax(0,1.5fr)] sm:items-center sm:p-3">
      <div className="relative min-w-0"><Search size={15} className="pointer-events-none absolute left-3 top-3 text-[#8C7B63]" /><input aria-label="Tìm yêu cầu đổi trả" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm mã đơn, khách hàng, sản phẩm…" className="min-h-9 w-full rounded-lg border border-[#EAE4D7] bg-[#FFFEFC] py-2 pl-9 pr-3 text-xs outline-none transition focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/10" /></div>
      <div role="group" aria-label="Lọc yêu cầu đổi trả" className="flex min-w-0 flex-wrap gap-1">{([['ALL', 'Tất cả'], ['WAITING', 'Chờ Shop duyệt'], ['TRANSIT', 'Đang trả về'], ['RECEIPT', 'Chờ nhận hàng trả'], ['REFUND', 'Hoàn tiền'], ['HANDLED', 'Đã xử lý']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-8 rounded-lg border px-2.5 text-[11px] font-medium transition ${filter === value ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : 'border-transparent text-[#7D715E] hover:bg-[#FAF8F5]'}`}>{label}</button>)}</div>
    </div>
    {error ? <div role="alert" className="grid justify-items-start gap-3 rounded-xl border border-red-200 bg-white p-5"><span className="flex items-start gap-2 text-sm leading-6 text-red-700"><AlertCircle size={18} className="mt-1 shrink-0" />{error}</span><button type="button" onClick={() => void load()} className="min-h-10 rounded-lg border border-[#EAE4D7] px-4 text-xs font-medium">Thử tải lại</button></div>
    : loading ? <div role="status" className="flex items-center justify-center gap-2 rounded-2xl border border-[#EAE4D7] bg-white py-14 text-sm text-[#7D715E]"><Loader2 size={18} className="animate-spin" />Đang tải yêu cầu đổi trả…</div>
    : !rows.length ? <div className="grid justify-items-center gap-2 rounded-2xl border border-[#EAE4D7] bg-white px-5 py-14 text-center"><Package size={30} className="text-[#B88E4F]" /><strong className="text-sm font-semibold">Chưa có yêu cầu đổi trả</strong><p className="m-0 max-w-md text-xs leading-6 text-[#7D715E]">Yêu cầu thuộc gian hàng của bạn sẽ hiển thị tại đây để xem bằng chứng và gửi giải trình.</p></div>
    : !filtered.length ? <div role="status" className="rounded-2xl border border-[#EAE4D7] bg-white p-10 text-center text-sm text-[#7D715E]">Không có yêu cầu phù hợp với bộ lọc.</div>
    : <div className="merchant-returns-content grid min-w-0 items-start gap-3 xl:grid-cols-[minmax(270px,0.78fr)_minmax(0,2fr)]">
      <aside className="merchant-returns-list min-w-0 overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white" aria-label="Danh sách yêu cầu">
        <div className="flex items-center justify-between border-b border-[#F0EADF] px-3.5 py-3"><h2 className="m-0 text-sm font-semibold">Yêu cầu trả hàng</h2><span className="rounded-full bg-[#FBF5EB] px-2 py-1 text-[10px] font-semibold text-[#8F682E]">{filtered.length}</span></div>
        <div className="grid max-h-[calc(100vh-315px)] min-h-28 content-start gap-2 overflow-y-auto p-2.5">
        {visibleGroups.map(group => {
        const row = group.requests[0];
        const active = selectedGroup?.key === group.key;
        const statuses = [...new Map(group.matching.map(item => [returnArrived(item) ? 'ARRIVED' : waiting(item) ? 'WAITING' : item.status, item])).values()];
        return <button key={group.key} type="button" aria-pressed={active} onClick={() => setSelectedId(active && selected ? selected.returnRequestId : group.matching[0].returnRequestId)} className={`merchant-returns-request grid min-w-0 gap-2 rounded-xl border p-3 text-left transition ${active ? 'border-[#C59B58] bg-[#FFFBF3] shadow-[0_2px_8px_rgba(124,91,41,0.07)]' : 'border-[#EEE8DD] bg-white hover:border-[#DCCAAD] hover:bg-[#FFFEFC]'}`}>
          <span className="flex min-w-0 items-center justify-between gap-2"><span className="truncate font-mono text-[11px] font-bold text-[#5E4A2D]">{orderDisplayCode(row.orderId)}</span><span className="shrink-0 text-[10px] text-[#897B68]">{group.requests.length} {group.requests.length === 1 ? 'mục' : 'mục'}</span></span>
          <span className="text-[10px] text-[#7D715E]">{group.requests.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm được yêu cầu trả</span>
          {group.matching.slice(0, 2).map(item => <span key={item.returnRequestId} className="truncate text-xs font-semibold">{item.productName || 'Sản phẩm trong đơn'} <span className="font-normal text-[#7D715E]">× {item.quantity}</span></span>)}
          {group.matching.length > 2 && <span className="text-[10px] text-[#7D715E]">+{group.matching.length - 2} sản phẩm khác</span>}
          <span className="flex flex-wrap gap-1">{statuses.slice(0, 2).map(item => <StatusBadge key={item.returnRequestId} row={item} />)}</span>
          <span className="truncate text-[10px] text-[#7D715E]">{row.customerName || 'Khách hàng'} · {row.storeName}</span>
        </button>;
      })}
        {!visibleGroups.length && !loading && <p className="m-0 p-5 text-center text-xs text-[#7D715E]">Không có yêu cầu phù hợp.</p>}
        </div>
      </aside>
      {selected && <div className="grid min-w-0 gap-3">
        {selectedGroup && <section aria-label="Sản phẩm trả trong đơn" className="grid min-w-0 gap-2.5 rounded-2xl border border-[#EAE4D7] bg-white p-3.5 sm:p-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div><h2 className="m-0 text-sm font-semibold">Sản phẩm trả trong đơn</h2><p className="m-0 mt-1 text-[11px] text-[#7D715E]">Chọn sản phẩm để xem hồ sơ tương ứng.</p></div><div className="rounded-lg bg-[#FBF5EB] px-2.5 py-1.5 text-right"><span className="block text-[9px] text-[#7D715E]">Tổng tiền hoàn trong đơn</span><strong className="text-xs font-bold text-[#76552A]">{groupRefund == null ? 'Chờ xác định' : formatMoney(groupRefund)}</strong></div></div>
          {selectedGroup.matching.length < selectedGroup.requests.length && <p className="m-0 text-xs text-[#7D715E]">Đang hiển thị {selectedGroup.matching.length}/{selectedGroup.requests.length} yêu cầu theo bộ lọc. Chọn “Tất cả” và xóa tìm kiếm để xem đầy đủ.</p>}
          <label className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg bg-[#FAF8F5] px-2.5 text-[11px] font-semibold"><input ref={selectAllRef} type="checkbox" checked={allChecked} onChange={event => setSelection({ scope: selectionScope, ids: event.target.checked ? selectedGroup.matching.map(row => row.returnRequestId) : [] })} className="h-4 w-4 shrink-0 accent-[#9A7033]" />Chọn tất cả sản phẩm đang hiển thị ({selectedRequests.length}/{selectedGroup.matching.length})</label>
          <div className="grid min-w-0 gap-1.5" role="group" aria-label="Chọn sản phẩm trả hàng">{selectedGroup.matching.map(item => <label key={item.returnRequestId} className={`flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left ${checkedIds.includes(item.returnRequestId) ? 'border-[#D7B881] bg-[#FFFCF6]' : 'border-[#EEE8DD] hover:bg-[#FFFEFC]'}`}>
            <input type="checkbox" checked={checkedIds.includes(item.returnRequestId)} onChange={event => toggleRequest(item.returnRequestId, event.target.checked)} aria-label={`Chọn ${item.productName || 'sản phẩm trong đơn'}`} className="mt-0.5 h-4 w-4 shrink-0 accent-[#9A7033]" />
            <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2"><span className="grid min-w-0 gap-0.5"><span className="break-words text-xs font-semibold">{item.productName || 'Sản phẩm trong đơn'} × {item.quantity}</span><span className="text-[10px] text-[#7D715E]">{item.refundAmountVnd == null ? 'Chờ xác định tiền hoàn' : formatMoney(item.refundAmountVnd)} · {date(item.requestedAt)}</span></span><StatusBadge row={item} /></span>
          </label>)}</div>
          {!selectedRequests.length && <p role="status" className="m-0 text-xs text-[#7D715E]">Chọn ít nhất một sản phẩm để xem hồ sơ và xử lý.</p>}
        </section>}
        {selectedRequests.map(selected => {
          const evidence = selected.evidenceRefs || {};
          const customerImages = evidence.images ?? evidence.imageUrls ?? evidence.customerProofImages;
          const customerVideo = evidence.unboxingVideoUrl ?? evidence.customerProofVideoUrl ?? (Array.isArray(evidence.videos) ? evidence.videos[0] : null);
          const notes = typeof evidence.details === 'string' ? evidence.details : typeof evidence.notes === 'string' ? evidence.notes : '';
          return <div className="grid min-w-0 gap-3" key={selected.returnRequestId} data-return-request-id={selected.returnRequestId}>
        <section className="merchant-return-detail overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white" aria-label="Chi tiết yêu cầu">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[#F0EADF] px-3.5 py-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#FBF5EB] text-[#A77B3C]"><FileText size={17} /></span><div className="min-w-0"><p className="m-0 text-[9px] font-semibold uppercase tracking-wide text-[#8A7A64]">Hồ sơ đổi trả · {orderDisplayCode(selected.orderId)}</p><h2 className="m-0 mt-0.5 truncate text-sm font-semibold">{selected.productName || 'Sản phẩm trong đơn'} × {selected.quantity}</h2></div></div><StatusBadge row={selected} />
          </div>
          <div className="grid gap-3 p-3.5 sm:p-4">
            <dl className="m-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">{[
              ['Khách hàng', selected.customerName || 'Chưa cập nhật'], ['Điện thoại', selected.customerPhone || 'Chưa cập nhật'],
              ['Tiền hoàn dự kiến', selected.refundAmountVnd == null ? 'Chờ xác định' : formatMoney(selected.refundAmountVnd)], ['Gửi yêu cầu', date(selected.requestedAt)],
            ].map(([label, value]) => <div key={label} className="min-w-0 rounded-lg bg-[#FAF8F5] px-2.5 py-2"><dt className="text-[9px] text-[#81735F]">{label}</dt><dd className="m-0 mt-1 break-words text-[11px] font-semibold leading-4">{value}</dd></div>)}</dl>
            <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#7D715E]"><span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-[#B88E4F]" />Đã giao: {date(selected.deliveredAt)}</span><span>Hạn trả hàng: {date(selected.returnDeadline)}</span></p>
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
              <div className="grid content-start gap-1 rounded-xl border border-[#F0EADF] bg-[#FFFEFC] p-3"><h3 className="m-0 text-[11px] font-semibold">Lý do đổi trả</h3><p className="m-0 whitespace-pre-wrap break-words text-xs leading-5">{REASONS[selected.reason] || selected.reason || 'Chưa có nội dung'}</p>{notes && <p className="m-0 whitespace-pre-wrap break-words border-t border-[#F0EADF] pt-2 text-[11px] leading-5 text-[#7D715E]">{notes}</p>}</div>
              <div className="grid content-start gap-2 rounded-xl border border-[#F0EADF] bg-[#FFFEFC] p-3"><CustomerVideo key={`${selected.returnRequestId}-${customerVideo}`} value={customerVideo} /><Images images={customerImages} label="Ảnh bằng chứng của khách" /></div>
            </div>
            <Link className="inline-flex min-h-9 items-center justify-center gap-2 justify-self-start rounded-lg border border-[#EAD8B9] bg-[#FFFCF6] px-3 text-[11px] font-semibold text-[#805D2C] transition hover:bg-[#FBF5EB]" to={`/merchant/returns/${selected.returnRequestId}`}><Package size={14} />Theo dõi hàng trả và xác nhận đã nhận</Link>
          </div>
        </section>
        {selected.status === 'RETURNING' && <ReceiveReturn row={selected} onSaved={() => load(undefined, true)} />}
        {selected.shopResponse ? <section aria-label="Giải trình đã gửi" className="grid gap-2.5 rounded-2xl border border-[#DDE9DF] bg-white p-3.5 sm:p-4"><h2 className="m-0 flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={17} className="text-[#47805A]" />Giải trình đã gửi <span className="text-[10px] font-normal text-[#7D715E]">· {date(selected.shopResponse.submittedAt)}</span></h2><p className="m-0 whitespace-pre-wrap break-words text-xs leading-5">{selected.shopResponse.response}</p><Images images={selected.shopResponse.imageUrls} label="Bằng chứng của gian hàng" /></section> : needsResponse(selected) ? <ResponseForm row={selected} onSaved={update} /> : null}
        {waiting(selected) && <DecisionActions row={selected} onSaved={row => { update(row); setFilter('ALL'); }} />}
        {selected.decisionReason && <section className="grid gap-2 rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5"><h2 className="m-0 flex items-center gap-2 text-sm font-semibold"><FileText size={17} className="text-[#B88E4F]" />Kết quả xử lý</h2><p className="m-0 text-xs text-[#7D715E]">{date(selected.resolvedAt)} · {STATUS[selected.status]}</p><p className="m-0 whitespace-pre-wrap break-words text-sm leading-6">{selected.decisionReason}</p></section>}
        </div>;
        })}
      </div>}
    </div>}
  </section>;
};
