import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, Copy, Handshake, Link2, Loader2, RefreshCw, Search, Video } from 'lucide-react';
import { collaborationsService, type Collaboration } from '../../services/collaborations.service';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { toast } from '../../utils/toast';
import { PartnershipInvitations } from '../../components/affiliate/PartnershipInvitations';
import { ProductCommissionDeals } from '../../components/affiliate/ProductCommissionDeals';

const statusLabels: Record<string, string> = {
  ACTIVE: 'Đang hoạt động', INACTIVE: 'Tạm ngừng', EXPIRED: 'Hết hạn', PENDING: 'Chờ KOL xác nhận',
  ACCEPTED: 'KOL đã đồng ý', REJECTED: 'KOL đã từ chối', LIVE: 'Đang phát trực tiếp',
  SCHEDULED: 'Đã lên lịch', ENDED: 'Đã kết thúc', CANCELLED: 'Đã hủy',
};
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
const kolName = (row: Collaboration) => row.collaboratorName || `KOL #${row.collaboratorId.slice(0, 8)}`;
const rowStatus = (row: Collaboration) => row.kind === 'REFERRAL' || ['ENDED', 'CANCELLED', 'LIVE'].includes(row.status)
  ? row.status : row.inviteStatus || row.status;
const date = (value: string | null) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString('vi-VN') : 'Chưa cập nhật';
const controlClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#EAE4D7] bg-white px-3 py-2 text-xs font-semibold text-[#625747] transition hover:bg-[#FBF5EB] disabled:opacity-50';

function Status({ row }: { row: Collaboration }) {
  const status = rowStatus(row);
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${['ACTIVE', 'ACCEPTED', 'LIVE'].includes(status)
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : status === 'PENDING'
      ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'}`}>{statusLabels[status] || 'Chưa cập nhật'}</span>;
}

export default function CollaborationsPage({ mode }: { mode: 'shop' | 'admin' }) {
  const [rows, setRows] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const requestNumber = useRef(0);
  const load = useCallback(async (signal?: AbortSignal) => {
    const number = ++requestNumber.current;
    setLoading(true); setError('');
    try {
      const result = await collaborationsService.list(mode, signal);
      if (!signal?.aborted && number === requestNumber.current) setRows(result);
    } catch (cause) {
      if (!signal?.aborted && number === requestNumber.current) setError(cause instanceof Error ? cause.message : 'Không tải được danh sách hợp tác.');
    } finally { if (!signal?.aborted && number === requestNumber.current) setLoading(false); }
  }, [mode]);
  useEffect(() => {
    setRows([]); setSelectedId(null);
    const request = requestNumber;
    const controller = new AbortController(); void load(controller.signal);
    return () => { controller.abort(); request.current++; };
  }, [load]);
  const filtered = useMemo(() => rows.filter(row => (kind === 'ALL' || row.kind === kind)
    && (status === 'ALL' || rowStatus(row) === status)
    && normalize(`${kolName(row)} ${row.collaboratorId} ${row.productName || ''} ${row.storeName || ''} ${row.livestreamTitle || ''} ${row.token || ''}`).includes(normalize(query.trim()))), [rows, query, kind, status]);
  const selected = rows.find(row => row.id === selectedId);
  const copyCode = async (token: string) => {
    try { await navigator.clipboard.writeText(token); toast.success('Đã sao chép mã referral.'); }
    catch { toast.error('Không sao chép được. Bạn có thể chọn và sao chép mã trong phần chi tiết.'); }
  };

  return <section aria-label={mode === 'shop' ? 'Hợp tác của gian hàng' : 'Hợp tác trên sàn'} className="grid w-full min-w-0 gap-4 pb-10 text-left text-[#1A1612]">
    {mode === 'shop' && <><PartnershipInvitations mode="shop" /><ProductCommissionDeals mode="shop" /></>}
    <div className="flex min-w-0 flex-wrap items-center gap-2.5 rounded-xl border border-[#EAE4D7] bg-white p-3">
      <div className="relative min-w-0 flex-1 basis-64"><Search size={16} className="pointer-events-none absolute left-3 top-3 text-[#7D715E]" /><input aria-label="Tìm hợp tác KOL" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm KOL, sản phẩm, mã referral…" className="h-10 w-full min-w-0 rounded-lg border border-[#EAE4D7] bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-[#C59B58]" /></div>
      <div className="min-w-0 flex-1 basis-40 sm:max-w-44"><Select aria-label="Lọc loại hợp tác" value={kind} onChange={event => setKind(event.target.value)} className="h-10 w-full rounded-lg py-2 text-xs sm:text-xs shadow-none"><option value="ALL">Tất cả hình thức</option><option value="REFERRAL">Liên kết referral</option><option value="LIVESTREAM">Livestream</option></Select></div>
      <div className="min-w-0 flex-1 basis-44 sm:max-w-48"><Select aria-label="Lọc trạng thái hợp tác" value={status} onChange={event => setStatus(event.target.value)} className="h-10 w-full rounded-lg py-2 text-xs sm:text-xs shadow-none"><option value="ALL">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div>
      <button type="button" onClick={() => void load()} disabled={loading} aria-label="Làm mới hợp tác KOL" className={controlClass}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Làm mới</button>
      {mode === 'shop' && <Link to="/merchant/live-sessions" className={`${controlClass} border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]`}><Video size={15} />Quản lý livestream<ArrowUpRight size={14} /></Link>}
    </div>

    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0" /><div>{error}{rows.length > 0 && <p className="mb-0 mt-1">Đang hiển thị dữ liệu từ lần tải trước.</p>}<button type="button" onClick={() => void load()} disabled={loading} className="mt-2 block font-semibold underline underline-offset-4">Thử lại</button></div></div>}
    <div aria-busy={loading} className="min-w-0 overflow-hidden rounded-xl border border-[#EAE4D7] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#EAE4D7] px-4 py-3 text-xs text-[#7D715E]"><span>{loading ? 'Đang tải danh sách…' : `${filtered.length} / ${rows.length} hợp tác`}</span><span className="text-[11px]">Liên kết & livestream</span></div>
      {loading && !rows.length ? <div role="status" className="flex items-center justify-center gap-2 p-12 text-xs text-[#7D715E]"><Loader2 size={18} className="animate-spin" />Đang tải hợp tác…</div> : !filtered.length ? <div className="grid justify-items-center gap-2 px-5 py-12 text-center"><Handshake size={30} className="mb-1 text-[#B88E4F]" /><p className="m-0 text-sm font-semibold">{error ? 'Chưa tải được danh sách' : rows.length ? 'Không tìm thấy hợp tác phù hợp' : 'Chưa có hoạt động tiếp thị'}</p><p className="m-0 max-w-md text-xs leading-5 text-[#7D715E]">{error ? 'Thử tải lại để kiểm tra dữ liệu.' : rows.length ? 'Đổi từ khóa hoặc bộ lọc để xem các hợp tác khác.' : 'Liên kết referral của KOL và lời mời livestream sẽ được hiển thị tại đây.'}</p>{rows.length > 0 && <button type="button" onClick={() => { setQuery(''); setKind('ALL'); setStatus('ALL'); }} className={`${controlClass} mt-2`}>Xóa bộ lọc</button>}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-[#FAF8F5] text-[#7D715E]"><tr>{['KOL / Đối tác', 'Nội dung hợp tác', 'Hình thức', 'Trạng thái', 'Thao tác'].map(label => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{filtered.map(row => <tr key={row.id} className="border-t border-[#EAE4D7] hover:bg-[#FFFCF8]"><td className="px-4 py-4"><span className="block font-semibold">{kolName(row)}</span><span className="mt-1 block text-[11px] text-[#7D715E]">{row.storeName || 'Gian hàng chưa cập nhật'}</span></td><td className="max-w-72 px-4 py-4"><span className="block font-medium leading-5">{row.kind === 'REFERRAL' ? row.productName || 'Sản phẩm chưa cập nhật' : row.livestreamTitle || 'Phiên livestream'}</span><span className="mt-1 block max-w-64 truncate font-mono text-[10px] text-[#7D715E]">{row.kind === 'REFERRAL' ? row.token : row.scheduledAt ? date(row.scheduledAt) : 'Chưa có lịch phát'}</span></td><td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[#7D715E]">{row.kind === 'REFERRAL' ? <Link2 size={14} /> : <Video size={14} />}{row.kind === 'REFERRAL' ? 'Referral' : 'Livestream'}</span></td><td className="px-4 py-4"><Status row={row} /></td><td className="px-4 py-4"><button type="button" onClick={() => setSelectedId(row.id)} aria-label={`Xem chi tiết ${row.kind === 'REFERRAL' ? row.productName || row.token : row.livestreamTitle}`} className={`${controlClass} whitespace-nowrap`}>Chi tiết<ArrowUpRight size={14} /></button></td></tr>)}</tbody></table></div>}
    </div>

    {selected && <Modal isOpen onClose={() => setSelectedId(null)} title="Chi tiết hợp tác" maxWidth="lg"><div className="grid min-w-0 gap-4" role="region" aria-label="Chi tiết hợp tác KOL"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{kolName(selected)}</strong><Status row={selected} /></div><dl className="m-0 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">{[
      ['Mã KOL', selected.collaboratorId], ['Gian hàng', selected.storeName || selected.storeId],
      ['Hình thức', selected.kind === 'REFERRAL' ? 'Liên kết referral' : 'Livestream'],
      ['Ngày tạo', date(selected.createdAt)],
      ...(selected.productId ? [['Sản phẩm', selected.productName || selected.productId]] : []),
      ...(selected.livestreamId ? [['Livestream', selected.livestreamTitle || selected.livestreamId]] : []),
      ...(selected.scheduledAt ? [['Lịch phát', date(selected.scheduledAt)]] : []),
      ...(selected.expiresAt ? [['Ngày hết hạn', date(selected.expiresAt)]] : []),
    ].map(([label, value]) => <div key={label} className="min-w-0 rounded-lg bg-[#FAF8F5] p-3"><dt className="text-[#7D715E]">{label}</dt><dd className="mb-0 ml-0 mt-1 break-words font-medium leading-5">{value}</dd></div>)}</dl>{selected.token && <div className="min-w-0 rounded-lg border border-[#EAE4D7] p-3"><span className="text-xs text-[#7D715E]">Mã referral</span><code className="mt-2 block break-all text-xs">{selected.token}</code><button type="button" onClick={() => void copyCode(selected.token!)} className={`${controlClass} mt-3`}><Copy size={14} />Sao chép mã</button></div>}<div className="flex flex-wrap justify-end gap-2">{selected.productId && <Link to={`/products/${encodeURIComponent(selected.productId)}`} className={controlClass}>Xem sản phẩm<ArrowUpRight size={14} /></Link>}{selected.livestreamId && mode === 'shop' && <Link to="/merchant/live-sessions" className={controlClass}>Quản lý livestream<ArrowUpRight size={14} /></Link>}</div></div></Modal>}
  </section>;
}
