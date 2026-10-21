import { Fragment, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Info, Loader2, RefreshCw } from 'lucide-react';
import { financeService, type MoneyPage, type MoneySettlement } from '../../services/finance.service';
import { checkoutService } from '../../services/checkout.service';
import { money, when } from './money';
import './settlement-page.css';

const settlementLabels: Record<string, string> = {
  PENDING: 'Chờ đối soát', ELIGIBLE: 'Đủ điều kiện', APPROVED: 'Đã duyệt',
  PROCESSING: 'Đang xử lý', PAID: 'Đã ghi có vào ví', FAILED: 'Xử lý thất bại',
};
const breakdownLabels: Record<string, string> = {
  grossRevenueVnd: 'Doanh thu', refundVnd: 'Hoàn tiền', sellerDiscountVnd: 'Giảm giá do shop chi trả',
  platformSubsidyVnd: 'Trợ giá từ nền tảng', platformFeeVnd: 'Phí nền tảng',
  serviceFeeVnd: 'Phí dịch vụ', commissionVnd: 'Hoa hồng KOL', feeBasisVnd: 'Cơ sở tính phí',
};
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Không tải được dữ liệu đối soát. Vui lòng thử lại.';

function SettlementStatus({ status }: { status: string }) {
  return <span className={`settlement-status ${status === 'PAID' ? 'paid' : status === 'FAILED' ? 'failed' : 'pending'}`}>{settlementLabels[status] || 'Chưa xác định'}</span>;
}

export function SettlementDetail({ row }: { row: MoneySettlement }) {
  return <article className="settlement-detail" aria-label="Chi tiết đối soát">
    <div className="settlement-detail-heading"><div><span>Số tiền thực nhận</span><strong>{money(row.netAmountVnd)}</strong></div><SettlementStatus status={row.status} /></div>
    <dl className="settlement-breakdown">{Object.entries(breakdownLabels).filter(([key]) => typeof row.breakdown?.[key] === 'number').map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{money(row.breakdown[key] as number)}</dd></div>)}</dl>
    <div className="settlement-references"><p><span>Mã đơn gian hàng</span><strong>{row.sellerOrderId}</strong></p><p><span>Mã đối soát</span><strong>{row.settlementId}</strong></p>{row.walletTransactionId && <p><span>Mã giao dịch ghi có</span><strong>{row.walletTransactionId}</strong></p>}</div>
    {row.paidAt && <p className="settlement-paid-at">Đã ghi có vào ví lúc {when(row.paidAt)}</p>}
  </article>;
}
type Store = { storeId: string; name: string };
type Result = { key: string; data?: MoneyPage<MoneySettlement>; error?: string };

export default function SettlementPage() {
  const [params, setParams] = useSearchParams();
  const [stores, setStores] = useState<Store[] | null>(null);
  const [storeError, setStoreError] = useState('');
  const [storeAttempt, setStoreAttempt] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const requestedId = params.get('storeId') || localStorage.getItem('current_store_id') || '';
  const store = stores?.find(item => item.storeId === requestedId) || (!params.get('storeId') ? stores?.[0] : undefined);
  const storeId = store?.storeId || '';
  const requestedPage = Number(params.get('page') || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage - 1 : 0;
  const requestKey = `${storeId}:${page}:${refresh}`;
  const data = result?.key === requestKey ? result.data : undefined;
  const error = storeError || (stores?.length && !storeId ? 'Gian hàng này không có trong danh sách gian hàng của bạn. Hãy chọn lại gian hàng.' : '') || (result?.key === requestKey ? result.error : '') || '';
  const loading = (!stores && !storeError) || Boolean(storeId && result?.key !== requestKey);

  useEffect(() => {
    let active = true;
    void checkoutService.stores().then(list => {
      if (!active) return;
      if (!Array.isArray(list) || list.some(item => !item.storeId || !item.name)) throw new Error('Danh sách gian hàng chưa hợp lệ. Vui lòng thử lại.');
      setStores(list); setStoreError('');
    }).catch(cause => { if (active) setStoreError(errorMessage(cause)); });
    return () => { active = false; };
  }, [storeAttempt]);

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    void financeService.settlements(storeId, page).then(value => {
      if (!active) return;
      if (!Array.isArray(value?.items) || !Number.isSafeInteger(value.total) || value.total < 0 || !Number.isSafeInteger(value.size) || value.size <= 0 || value.page !== page || value.items.some(row => row.storeId !== storeId)) {
        throw new Error('Dữ liệu đối soát chưa hợp lệ. Vui lòng thử tải lại.');
      }
      const lastPage = Math.max(0, Math.ceil(value.total / value.size) - 1);
      if (page > lastPage) {
        setParams({ storeId, ...(lastPage > 0 ? { page: String(lastPage + 1) } : {}) }, { replace: true });
        return;
      }
      setResult({ key: requestKey, data: value });
    }).catch(cause => { if (active) setResult({ key: requestKey, error: errorMessage(cause) }); });
    return () => { active = false; };
  }, [storeId, page, requestKey, setParams]);

  function update() {
    if (storeError) { setStores(null); setStoreError(''); setStoreAttempt(attempt => attempt + 1); }
    else setRefresh(value => value + 1);
  }
  function changePage(next: number) {
    setExpandedId(null);
    setParams({ storeId, ...(next > 0 ? { page: String(next + 1) } : {}) });
  }
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  return <section className="merchant-settlement" aria-label="Đối soát doanh thu gian hàng">
    <div className="settlement-toolbar">
      <label htmlFor="settlement-store">Gian hàng<select id="settlement-store" value={storeId} disabled={!stores?.length} onChange={event => { setExpandedId(null); setParams({ storeId: event.target.value }); }}>
        {!storeId && <option value="">{loading ? 'Đang tải gian hàng…' : 'Chọn gian hàng'}</option>}
        {stores?.map(item => <option key={item.storeId} value={item.storeId}>{item.name}</option>)}
      </select></label>
      <button type="button" className="settlement-button" disabled={loading || (!storeId && !storeError)} onClick={update}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} />Cập nhật</button>
      <Link className="settlement-button" to={storeId ? `/merchant/payouts?storeId=${encodeURIComponent(storeId)}` : '/merchant/payouts'}><ArrowLeft size={16} />Về ví gian hàng</Link>
    </div>

    <div className="settlement-notice"><Info size={18} /><p>Đơn hàng hoàn tất và hết thời hạn trả hàng mới đủ điều kiện đối soát. Khoản <strong>đã ghi có</strong> được cộng vào ví gian hàng; bạn có thể tạo yêu cầu rút tiền từ ví.</p></div>

    <div className="settlement-list" aria-busy={loading}>
      <header className="settlement-list-heading"><span className="settlement-heading-icon"><ClipboardList size={21} /></span><div><h1>Đối soát doanh thu</h1><p>{store?.name || 'Gian hàng của bạn'} · Theo dõi doanh thu, phí và số tiền thực nhận</p></div>{data && <span className="settlement-count">{data.total.toLocaleString('vi-VN')} bản ghi</span>}</header>

      {loading ? <div className="settlement-state" role="status"><Loader2 size={28} className="animate-spin" /><strong>Đang tải đối soát…</strong></div> : error ? <div className="settlement-state settlement-error" role="alert"><AlertCircle size={28} /><strong>Chưa tải được đối soát</strong><p>{error}</p><button type="button" className="settlement-button" onClick={update}>Thử lại</button></div> : !stores?.length ? <div className="settlement-state"><ClipboardList size={30} /><strong>Chưa có gian hàng để đối soát</strong><p>Gian hàng của bạn sẽ xuất hiện tại đây sau khi được liên kết với tài khoản.</p></div> : data?.items.length === 0 ? <div className="settlement-state"><span className="settlement-empty-icon"><ClipboardList size={30} /></span><strong>Chưa có bản ghi đối soát</strong><p>Doanh thu sẽ hiển thị khi đơn hàng đủ điều kiện và được hệ thống lập đối soát.</p><Link className="settlement-button" to="/merchant/orders">Xem đơn hàng</Link></div> : data ? <>
        <div className="settlement-table-scroll" tabIndex={0} aria-label="Danh sách đối soát"><table className="settlement-table"><thead><tr><th>Đơn gian hàng</th><th className="settlement-amount">Thực nhận</th><th>Trạng thái</th><th>Ngày ghi có</th><th><span className="sr-only">Chi tiết</span></th></tr></thead><tbody>{data.items.map(row => <Fragment key={row.settlementId}>
          <tr><td><strong className="settlement-order-code" title={row.sellerOrderId}>{row.sellerOrderId}</strong><small title={row.settlementId}>{row.settlementId}</small></td><td className="settlement-amount">{money(row.netAmountVnd)}</td><td><SettlementStatus status={row.status} /></td><td>{row.paidAt ? when(row.paidAt) : 'Chưa ghi có'}</td><td><button type="button" className="settlement-detail-button" aria-label={`Chi tiết đối soát ${row.settlementId}`} aria-expanded={expandedId === row.settlementId} aria-controls={`detail-${row.settlementId}`} onClick={() => setExpandedId(current => current === row.settlementId ? null : row.settlementId)}>Chi tiết<ChevronDown size={15} className={expandedId === row.settlementId ? 'rotate-180' : ''} /></button></td></tr>
          {expandedId === row.settlementId && <tr id={`detail-${row.settlementId}`} className="settlement-expanded"><td colSpan={5}><SettlementDetail row={row} /></td></tr>}
        </Fragment>)}</tbody></table></div>
        {data.total > 0 && <footer className="settlement-pagination"><span>Hiển thị {(page * data.size + 1).toLocaleString('vi-VN')}–{Math.min((page + 1) * data.size, data.total).toLocaleString('vi-VN')} / {data.total.toLocaleString('vi-VN')} bản ghi</span><nav aria-label="Phân trang đối soát"><button type="button" className="settlement-button" disabled={page === 0} onClick={() => changePage(page - 1)}><ChevronLeft size={16} />Trước</button><span>Trang {page + 1} / {totalPages}</span><button type="button" className="settlement-button" disabled={page + 1 >= totalPages} onClick={() => changePage(page + 1)}>Sau<ChevronRight size={16} /></button></nav></footer>}
      </> : null}
    </div>
  </section>;
}
