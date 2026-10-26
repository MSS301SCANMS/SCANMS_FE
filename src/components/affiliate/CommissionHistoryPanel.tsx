import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Info, ReceiptText, RefreshCw, Search, X } from 'lucide-react';
import { commissionService, type CommissionRow } from '../../services/commission.service';
import { financeService } from '../../services/finance.service';
import { money, when } from '../../pages/finance/money';
import { commissionAmounts } from '../../utils/commission-display';
import { ConfirmModal } from '../ui/ConfirmModal';

const labels: Record<string, string> = { PENDING: 'Chờ hết hạn trả hàng', ELIGIBLE: 'Đủ điều kiện ghi có', CREDITED: 'Đã cộng vào ví', PAID: 'Đã cộng vào ví', ADJUSTED: 'Đã điều chỉnh', CANCELLED: 'Đã hủy hoa hồng' };
const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#EAE4D7] bg-white px-3 text-xs font-semibold text-[#62533F] transition hover:border-[#B88E4F] hover:bg-[#FAF8F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88E4F] disabled:cursor-not-allowed disabled:opacity-50';
const fold = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi');
const shortId = (id: string) => id.length > 15 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;

function CommissionStatus({ row }: { row: CommissionRow }) {
  const { needsReconciliation, recorded } = commissionAmounts(row);
  const paid = Boolean(row.transferReference) && !needsReconciliation && row.status !== 'CANCELLED';
  const cancelled = row.status === 'CANCELLED' && !needsReconciliation;
  const Icon = paid || cancelled ? CheckCircle2 : Clock3;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${needsReconciliation ? 'border-amber-200 bg-amber-50 text-amber-800' : paid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : cancelled ? 'border-[#EAE4D7] bg-[#F5F3EF] text-[#625747]' : 'border-[#EEDFC6] bg-[#FBF5EB] text-[#805C28]'}`}><Icon size={13} aria-hidden="true" />{needsReconciliation ? recorded === null ? 'Đang đối chiếu' : 'Đang đồng bộ thu hồi' : labels[row.status]}</span>;
}

export function CommissionHistoryPanel({ operator = false, onRefresh }: { operator?: boolean; onRefresh?: () => void }) {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updatedAt, setUpdatedAt] = useState('');
  const [detail, setDetail] = useState<CommissionRow | null>(null);
  const [selected, setSelected] = useState<{ row: CommissionRow; reversal: boolean } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const sequence = useRef(0);
  const lock = useRef(false);
  const load = useCallback(async () => {
    const current = ++sequence.current; setLoading(true); setError('');
    try {
      const data = await commissionService.list();
      if (current === sequence.current) {
        setRows(data); setUpdatedAt(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setDetail(previous => previous ? data.find(row => row.commissionId === previous.commissionId) || null : null);
      }
    } catch (cause) { if (current === sequence.current) setError(cause instanceof Error ? cause.message : 'Không tải được hoa hồng.'); }
    finally { if (current === sequence.current) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { sequence.current++; }; }, [load]);
  useEffect(() => {
    if (detail && !dialog.current?.open) dialog.current?.showModal();
    if (!detail && dialog.current?.open) dialog.current.close();
  }, [detail]);
  const shown = rows.filter(row => (filter === 'ALL' || (filter === 'RECOVERY' ? commissionAmounts(row).needsReconciliation : row.status === filter)) && fold([row.orderItemId, row.commissionId, row.collaboratorId, row.adjustmentHistory?.productName || ''].join(' ')).includes(fold(search.trim())));
  const pages = Math.max(1, Math.ceil(shown.length / 10)), activePage = Math.min(page, pages);
  const visible = shown.slice((activePage - 1) * 10, activePage * 10);
  const amounts = rows.map(commissionAmounts);
  const pending = rows.filter(row => row.status === 'PENDING').reduce((total, row) => total + Number(row.amountVnd), 0);
  const ready = amounts.filter(row => row.ready).reduce((total, row) => total + row.current, 0);
  const credited = amounts.some(row => row.recorded === null) ? null : amounts.reduce((total, row) => total + (row.recorded || 0), 0);
  const reduced = amounts.some(row => row.original === null && (row.refunded || 0) > 0) ? null : amounts.reduce((total, row) => total + (row.reduced || 0), 0);
  async function confirm() {
    if (!selected || lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      if (selected.reversal) await financeService.reconcileCommission(selected.row.commissionId);
      else await financeService.creditCommission(selected.row.commissionId);
      setSelected(null); setNotice('Đã xử lý giao dịch. Trạng thái hoa hồng sẽ cập nhật sau khi hệ thống đồng bộ xác nhận.'); await load();
    } catch (cause) { setSelected(null); setError(cause instanceof Error ? cause.message : 'Chưa xử lý được hoa hồng.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function actions(row: CommissionRow) {
    const value = commissionAmounts(row);
    return <div className="flex flex-wrap items-center gap-2"><button type="button" className={button} onClick={() => setDetail(row)} aria-label={`Chi tiết hoa hồng ${row.orderItemId}`}>Chi tiết<ArrowRight size={13} /></button>{operator && (value.needsReconciliation || value.ready) && <button type="button" disabled={busy || loading} className={`${button} !border-[#DCCAAD] !bg-[#FBF5EB] !text-[#805C28]`} onClick={() => setSelected({ row, reversal: value.needsReconciliation })}>{value.needsReconciliation ? 'Đồng bộ thu hồi' : 'Ghi có hoa hồng'}</button>}</div>;
  }
  const selectedAmounts = detail ? commissionAmounts(detail) : null;
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white text-[#1A1612]" aria-label="Theo dõi hoa hồng KOL">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EAE4D7] px-5 py-5 sm:px-6"><div className="flex min-w-0 items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#A17A3D]"><ReceiptText size={21} /></span><div><h2 className="m-0 text-lg font-bold leading-6">{operator ? 'Đối soát hoa hồng KOL' : 'Hoa hồng từ đơn giới thiệu'}</h2><p className="mb-0 mt-1 text-xs leading-5 text-[#7D715E]">Theo dõi từng khoản từ lúc thanh toán đến khi ghi có hoặc hoàn tiền.</p></div></div><div className="flex flex-wrap items-center gap-3"><span className="text-[11px] text-[#7D715E]">{updatedAt ? `Cập nhật lúc ${updatedAt}` : 'Chưa có dữ liệu'}</span><button type="button" className={button} disabled={loading || busy} onClick={() => { void load(); onRefresh?.(); }}><RefreshCw size={15} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} />Cập nhật hoa hồng</button></div></header>
    <dl className="m-0 grid grid-cols-2 border-b border-[#EAE4D7] bg-[#FCFBF9] lg:grid-cols-4">{[
      { label: 'Chờ hết hạn trả hàng', value: pending, note: 'Chưa ghi có vào ví' }, { label: 'Sẵn sàng ghi có', value: ready, note: 'Đã đủ điều kiện chốt' },
      { label: 'Đã ghi có thuần', value: credited, note: 'Đã cộng, trừ phần đã thu hồi' }, { label: 'Đã giảm do hoàn tiền', value: reduced, note: 'Tỷ lệ hoa hồng giữ nguyên' },
    ].map(item => <div key={item.label} className="min-w-0 border-b border-r border-[#EAE4D7] px-4 py-4 last:border-r-0 sm:px-6 lg:border-b-0"><dt className="text-[11px] font-medium text-[#7D715E] sm:text-xs">{item.label}</dt><dd className="m-0 mt-2 break-words text-lg font-bold tabular-nums tracking-tight sm:text-xl">{error || loading ? '—' : item.value === null ? 'Chờ đối chiếu' : money(item.value)}</dd><p className="mb-0 mt-1 text-[10px] leading-4 text-[#7D715E]">{item.note}</p></div>)}</dl>
    <details className="border-b border-[#EAE4D7] px-5 py-3 text-xs sm:px-6"><summary className="cursor-pointer font-medium text-[#805C28]">Cách tính hoa hồng và xử lý trả hàng</summary><div className="mt-3 grid gap-3 pb-1 text-[#625747] sm:grid-cols-2"><p className="m-0 leading-6">Hoa hồng = tiền hàng còn lại sau giảm giá và hoàn tiền × tỷ lệ đã chốt. Phí giao hàng không nằm trong cơ sở tính.</p><p className="m-0 leading-6">Hoàn toàn bộ tiền hàng của sản phẩm: hoa hồng về <strong>0đ</strong>. Nếu đã cộng ví, hệ thống thu hồi khoản đó; nếu đã rút, thu nhập tiếp theo bù lại phần cần thu hồi.</p></div><p className="mb-0 mt-3 flex flex-wrap items-center gap-2 border-t border-[#EAE4D7] pt-3 text-[11px] leading-5 text-[#7D715E]">Thanh toán đơn<ArrowRight size={12} />Hết hạn trả hàng, xử lý xong yêu cầu hoàn<ArrowRight size={12} />Ghi có hoa hồng</p></details>
    <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6"><label className="flex min-h-11 min-w-0 flex-[1_1_240px] items-center gap-2 rounded-xl border border-[#EAE4D7] px-3 focus-within:border-[#B88E4F]"><Search size={16} className="shrink-0 text-[#95836B]" /><input aria-label="Tìm hoa hồng" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm sản phẩm, mã đơn hoặc mã hoa hồng…" className="min-w-0 flex-1 border-0 bg-transparent text-xs outline-none" />{search && <button type="button" aria-label="Xóa tìm kiếm hoa hồng" onClick={() => { setSearch(''); setPage(1); }} className="p-1"><X size={15} /></button>}</label><select aria-label="Lọc trạng thái hoa hồng" className="min-h-11 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 text-xs sm:w-auto" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="ALL">Tất cả trạng thái</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}<option value="RECOVERY">Đang đồng bộ thu hồi</option></select></div>
    {error && <div role="alert" className="mx-5 mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-6 text-red-700"><AlertCircle size={17} className="mt-1 shrink-0" />{error}</div>}
    {notice && <p role="status" className="mx-5 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-6 text-emerald-800">{notice}</p>}
    {loading ? <p role="status" className="flex items-center justify-center gap-2 p-12 text-sm text-[#7D715E]"><RefreshCw size={17} className="animate-spin motion-reduce:animate-none" />Đang tải hoa hồng…</p> : !error && !shown.length ? <div className="grid justify-items-center gap-3 px-5 py-12 text-center"><ReceiptText size={28} className="text-[#B88E4F]" /><p className="m-0 text-sm font-semibold">{search ? 'Không tìm thấy khoản hoa hồng phù hợp.' : filter === 'ALL' ? 'Chưa có hoa hồng từ đơn hàng giới thiệu.' : 'Không có hoa hồng ở trạng thái này.'}</p><p className="m-0 max-w-md text-xs leading-6 text-[#7D715E]">{search || filter !== 'ALL' ? 'Thử đổi từ khóa hoặc chọn tất cả trạng thái.' : 'Khi khách thanh toán qua liên kết của bạn, khoản hoa hồng sẽ được ghi nhận tại đây.'}</p></div> : !error && <>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[920px] text-left text-xs"><thead className="border-y border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]"><tr>{['Sản phẩm / đơn giới thiệu', 'Tiền hàng còn lại', 'Tỷ lệ', 'Hoa hồng còn lại', 'Trạng thái', 'Thao tác'].map(title => <th key={title} scope="col" className="whitespace-nowrap px-5 py-3 text-[11px] font-semibold">{title}</th>)}</tr></thead><tbody>{visible.map(row => {
        const value = commissionAmounts(row);
        return <tr key={row.commissionId} className="border-b border-[#EAE4D7] last:border-b-0 hover:bg-[#FCFBF9]"><td className="max-w-60 px-5 py-5"><strong className="block truncate text-[13px]" title={row.adjustmentHistory?.productName}>{row.adjustmentHistory?.productName || 'Đơn giới thiệu'}</strong><span className="mt-1.5 block font-mono text-[10px] text-[#7D715E]" title={row.orderItemId}>{shortId(row.orderItemId)}</span><span className="mt-1 block text-[10px] text-[#7D715E]">{when(row.createdAt)}</span></td><td className="px-5 py-5 tabular-nums"><strong className="whitespace-nowrap font-medium">{money(Number(row.basisVnd))}</strong>{(value.refunded || 0) > 0 && <span className="mt-1 block whitespace-nowrap text-[10px] text-[#9B4940]">Đã hoàn {money(value.refunded)}</span>}</td><td className="px-5 py-5 font-medium tabular-nums">{Number(row.rate)}%</td><td className="px-5 py-5"><strong className="block whitespace-nowrap text-[13px] tabular-nums">{money(value.current)}</strong>{value.reduced !== null && value.reduced > 0 && <span className="mt-1 block whitespace-nowrap text-[10px] text-[#9B4940]">Giảm {money(value.reduced)}</span>}</td><td className="px-5 py-5"><CommissionStatus row={row} />{row.adjustmentHistory?.reversalTransactionId && !value.needsReconciliation && <span className="mt-2 block text-[10px] text-[#7D715E]">Đã cập nhật giao dịch thu hồi</span>}</td><td className="px-5 py-5">{actions(row)}</td></tr>;
      })}</tbody></table></div>
      <div className="grid gap-3 px-4 pb-4 md:hidden">{visible.map(row => {
        const value = commissionAmounts(row);
        return <article key={row.commissionId} className="min-w-0 rounded-xl border border-[#EAE4D7] p-4"><div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="m-0 break-words text-sm font-semibold">{row.adjustmentHistory?.productName || 'Đơn giới thiệu'}</h3><p className="mb-0 mt-1 text-[10px] text-[#7D715E]">{shortId(row.orderItemId)} · {when(row.createdAt)}</p></div><CommissionStatus row={row} /></div><dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-[#EAE4D7] py-3 text-xs"><div><dt className="text-[11px] text-[#7D715E]">Tiền hàng còn lại</dt><dd className="m-0 mt-1 font-medium">{money(Number(row.basisVnd))}</dd></div><div><dt className="text-[11px] text-[#7D715E]">Tỷ lệ đã chốt</dt><dd className="m-0 mt-1 font-medium">{Number(row.rate)}%</dd></div><div><dt className="text-[11px] text-[#7D715E]">Hoa hồng còn lại</dt><dd className="m-0 mt-1 text-base font-bold">{money(value.current)}</dd></div><div><dt className="text-[11px] text-[#7D715E]">Đã giảm do hoàn tiền</dt><dd className="m-0 mt-1 font-medium text-[#9B4940]">{value.reduced === null ? 'Chưa có dữ liệu gốc' : money(value.reduced)}</dd></div></dl>{(value.refunded || 0) > 0 && <p className="mb-0 mt-3 text-[11px] text-[#9B4940]">Tiền hàng đã hoàn: {money(value.refunded)}</p>}<div className="mt-3">{actions(row)}</div></article>;
      })}</div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE4D7] px-5 py-3 text-[11px] text-[#7D715E]"><span>{shown.length} khoản hoa hồng{search || filter !== 'ALL' ? ` / ${rows.length} khoản` : ''} · Tổng ghi có không phải số dư ví</span>{pages > 1 && <div className="flex items-center gap-3"><button type="button" aria-label="Trang hoa hồng trước" className={button} disabled={activePage === 1} onClick={() => setPage(activePage - 1)}><ChevronLeft size={15} /></button><span>{activePage} / {pages}</span><button type="button" aria-label="Trang hoa hồng sau" className={button} disabled={activePage === pages} onClick={() => setPage(activePage + 1)}><ChevronRight size={15} /></button></div>}</footer>
    </>}
    <dialog aria-label="Chi tiết hoa hồng" ref={dialog} onClose={() => setDetail(null)} className="fixed inset-0 m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-[#EAE4D7] bg-white p-0 text-[#1A1612] shadow-xl backdrop:bg-black/40">
      {detail && selectedAmounts && <><header className="flex items-start justify-between gap-3 border-b border-[#EAE4D7] p-5"><div><h3 className="m-0 text-lg font-bold">Chi tiết hoa hồng</h3><p className="mb-0 mt-1 text-xs text-[#7D715E]">{detail.adjustmentHistory?.productName || 'Đơn hàng giới thiệu'}</p></div><button type="button" autoFocus aria-label="Đóng chi tiết hoa hồng" className={button} onClick={() => setDetail(null)}><X size={17} /></button></header><div className="grid gap-5 p-5"><CommissionStatus row={detail} /><div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-4"><span className="text-xs text-[#7D715E]">Hoa hồng còn được hưởng</span><strong className="mt-1 block text-2xl font-bold tabular-nums">{money(selectedAmounts.current)}</strong><p className="mb-0 mt-2 text-xs leading-6">{money(Number(detail.basisVnd))} tiền hàng còn lại × {Number(detail.rate)}%<br />Tỷ lệ giữ nguyên khi hoàn tiền; chỉ điều chỉnh số tiền hoa hồng.</p></div><dl className="m-0 grid grid-cols-2 gap-4 text-xs">{[
        ['Hoa hồng ban đầu', selectedAmounts.original === null ? 'Chưa có dữ liệu gốc' : money(selectedAmounts.original)], ['Đã giảm do hoàn tiền', selectedAmounts.reduced === null ? 'Chưa có dữ liệu gốc' : money(selectedAmounts.reduced)],
        ['Tiền hàng đã hoàn', selectedAmounts.refunded === null ? 'Chưa có dữ liệu' : money(selectedAmounts.refunded)], ['Ghi nhận vào ví (sau thu hồi)', selectedAmounts.recorded === null ? 'Đang đối chiếu' : money(selectedAmounts.recorded)],
        ['Ngày ghi nhận', when(detail.createdAt)], ['Ngày ghi có', detail.transferReference ? when(detail.paidAt) : 'Chưa ghi có'],
      ].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-[#7D715E]">{label}</dt><dd className="m-0 mt-1 break-words font-semibold leading-5">{value}</dd></div>)}</dl>{selectedAmounts.needsReconciliation && <p className="m-0 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-800"><Info size={16} className="mt-1 shrink-0" />{selectedAmounts.pendingRecovery === null ? 'Đang đối chiếu số tiền đã ghi có với khoản hoa hồng còn lại.' : `Cần thu hồi ${money(selectedAmounts.pendingRecovery)} từ ví KOL. Hệ thống đang đồng bộ giao dịch.`}</p>}<dl className="m-0 grid gap-3 border-t border-[#EAE4D7] pt-4 text-[11px]">{[['Mã hoa hồng', detail.commissionId], ['Mã dòng đơn hàng', detail.orderItemId], ...(operator ? [['Mã KOL', detail.collaboratorId]] : []), ['Giao dịch ghi có gốc', detail.transferReference || 'Chưa ghi có'], ['Giao dịch thu hồi', detail.adjustmentHistory?.reversalTransactionId || 'Chưa phát sinh']].map(([label, value]) => <div key={label}><dt className="text-[#7D715E]">{label}</dt><dd className="m-0 mt-1 break-all font-mono leading-5">{value}</dd></div>)}</dl><p className="m-0 text-[11px] leading-6 text-[#7D715E]">Giao dịch ghi có gốc được giữ nguyên. Khoản đã cộng sẽ có giao dịch thu hồi riêng nếu khách được hoàn tiền.</p></div></>}
    </dialog>
    <ConfirmModal isOpen={Boolean(selected)} onClose={() => { if (!busy) setSelected(null); }} onConfirm={() => void confirm()} variant={selected?.reversal ? 'warning' : 'brand'} title={selected?.reversal ? 'Đồng bộ thu hồi hoa hồng' : 'Ghi có hoa hồng KOL'} message={selected?.reversal ? 'Đối chiếu tiền đã hoàn và thu hồi đúng phần hoa hồng không còn được hưởng. Giao dịch được kiểm tra để không trừ trùng.' : `Ghi có ${money(Number(selected?.row.amountVnd || 0))} vào ví KOL. Hệ thống kiểm tra lại điều kiện trước khi thực hiện.`} confirmText="Xác nhận xử lý" isLoading={busy} />
  </section>;
}
