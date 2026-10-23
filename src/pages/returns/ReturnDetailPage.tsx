import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Loader2, Package, RefreshCw, ShieldCheck, Truck, Video, Wallet } from 'lucide-react';
import { returnService, type ReturnDetail } from '../../services/return.service';
import { safeReturnMedia } from '../../services/shop-returns.service';
import { canReceiveReturn, returnArrived, returnStep } from '../../utils/return-flow';
import { returnStatusLabel } from '../../utils/return-status.utils';
import { formatMoney } from '../../utils/marketplace.utils';
import { serverDate } from '../../utils/server-date';
import './return-detail.css';

type Mode = 'customer' | 'shop' | 'admin';
const steps = ['Gửi yêu cầu', 'Sàn xét duyệt', 'Gửi hàng trả', 'Shop nhận hàng', 'Hoàn tiền'];
const reasons: Record<string, string> = { DAMAGED: 'Sản phẩm hư hỏng', WRONG_ITEM: 'Giao sai sản phẩm', EXPIRED: 'Sản phẩm hết hạn', OTHER: 'Lý do khác' };
const date = (value?: string | null) => {
  const parsed = serverDate(value || '');
  return parsed && Number.isFinite(Date.parse(parsed)) ? new Date(parsed).toLocaleString('vi-VN') : 'Chưa ghi nhận';
};
function nextAction(row: ReturnDetail, mode: Mode): string {
  if (row.status === 'REQUESTED') return 'Sàn đang đối chiếu bằng chứng của khách hàng và giải trình của shop.';
  if (row.status === 'APPROVED') return mode === 'customer' ? 'Yêu cầu đã được duyệt. Bạn có thể tạo chuyến trả hàng mô phỏng hoặc nhập vận đơn đã gửi.' : 'Yêu cầu đã được duyệt. Đang chờ khách gửi hàng trả về shop.';
  if (returnArrived(row)) return mode === 'shop' ? 'Kiểm tra kiện hàng và xác nhận đã nhận để hệ thống tiếp tục xử lý hoàn tiền.' : 'Shop cần xác nhận đã nhận hàng trả trước khi hệ thống xử lý hoàn tiền.';
  if (row.status === 'RETURNING') return 'Chuyến hàng trả đang được vận chuyển về shop. Theo dõi các mốc vận chuyển bên dưới.';
  if (['RECEIVED', 'REFUND_PENDING'].includes(row.status)) return 'Shop đã xác nhận nhận hàng trả. Dịch vụ ví đang xử lý; hệ thống sẽ thử lại nếu kết nối thanh toán chưa sẵn sàng.';
  if (row.status === 'REFUNDED') return 'Hệ thống đã ghi nhận hoàn tiền. Khách mua có thể đối chiếu số dư và giao dịch trong ví SCANMS.';
  return row.status === 'REJECTED' ? 'Yêu cầu không được chấp thuận. Xem căn cứ xét duyệt trong hồ sơ bên dưới.' : 'Hồ sơ này đã đóng. Không còn thao tác gửi hàng trả.';
}

export default function ReturnDetailPage({ mode }: { mode: Mode }) {
  const { id } = useParams();
  const [request, setRequest] = useState<ReturnDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [carrier, setCarrier] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [manual, setManual] = useState(false);
  const acting = useRef(false);
  const sequence = useRef(0);
  const load = useCallback(async () => {
    if (!id || acting.current) return;
    const number = ++sequence.current;
    try { const row = await returnService.getOne(id); if (number === sequence.current) { setRequest(row); setError(''); } }
    catch (cause: any) { if (number === sequence.current) setError(cause?.response?.data?.message || 'Không tải được yêu cầu trả hàng.'); }
    finally { if (number === sequence.current) setLoading(false); }
  }, [id]);
  useEffect(() => {
    setRequest(null); setLoading(true); setCarrier(''); setTrackingCode(''); setManual(false);
    void load();
    const refresh = () => { if (!document.hidden) void load(); };
    const timer = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);
    return () => { sequence.current++; window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [load]);
  const act = async (action: () => Promise<ReturnDetail>) => {
    if (acting.current) return;
    acting.current = true; setBusy(true); setError('');
    const number = ++sequence.current;
    try { const row = await action(); if (number === sequence.current) setRequest(row); }
    catch (cause: any) { if (number === sequence.current) setError(cause?.response?.data?.message || cause?.message || 'Thao tác thất bại. Vui lòng thử lại.'); }
    finally { acting.current = false; setBusy(false); }
  };
  const back = mode === 'shop' ? '/merchant/returns' : mode === 'admin' ? '/admin/return-disputes' : '/customer/orders';
  const images = (request?.imageUrls || []).map(safeReturnMedia).filter((url): url is string => Boolean(url));
  const video = safeReturnMedia(request?.unboxingVideoUrl);
  const current = request ? returnStep(request) : 0;
  const closed = request && ['REJECTED', 'CANCELLED'].includes(request.status);
  const status = request && (returnArrived(request) ? 'Hàng trả đã đến shop · chờ shop xác nhận nhận hàng' : returnStatusLabel(request.status));

  return <main className="return-page">
    <header className="return-page-header"><div>
      <Link to={back} className="return-back"><ArrowLeft size={15} />{mode === 'shop' ? 'Danh sách trả hàng của shop' : mode === 'admin' ? 'Hồ sơ cần xét duyệt' : 'Đơn mua của tôi'}</Link>
      <h1>Trả hàng / Hoàn tiền</h1><p>Theo dõi hồ sơ, hành trình hàng trả và tiến trình hoàn tiền.</p>
    </div><button className="return-button" disabled={busy || loading} onClick={() => void load()}><RefreshCw size={15} />Tải lại</button></header>
    {error && <div role="alert" className="return-error">{error}</div>}
    {loading && <div role="status" className="return-card return-loading"><Loader2 size={22} className="animate-spin" />Đang tải hồ sơ trả hàng…</div>}
    {request && <>
      <section className="return-status-card"><span className="return-status-icon">{request.status === 'REFUNDED' ? <CheckCircle2 size={26} /> : returnArrived(request) ? <Package size={26} /> : <ShieldCheck size={26} />}</span>
        <div><span className="return-eyebrow">Tiến trình xử lý</span><h2 role="status">{status}</h2><p>{nextAction(request, mode)}</p></div>
      </section>
      <ol className="return-steps" aria-label="Tiến trình trả hàng">{steps.map((label, index) => <li key={label} aria-current={!closed && current === index ? 'step' : undefined} className={`${(index < current || request.status === 'REFUNDED') && !closed ? 'is-done' : ''} ${index === current && !closed ? 'is-current' : ''}`}><span>{(index < current || request.status === 'REFUNDED') && !closed ? <Check size={16} /> : index + 1}</span><strong>{label}</strong></li>)}</ol>
      <div className="return-content-grid"><div className="return-main-column">
        <section className="return-card"><div className="return-section-heading"><Package size={18} /><h2>Sản phẩm trả lại</h2></div><p className="return-muted">{request.order.storeName || 'Gian hàng'}</p>
          {request.items.map(item => <div key={item.id} className="return-product">{safeReturnMedia(item.orderItem.product.imageUrl) ? <img src={item.orderItem.product.imageUrl!} alt={item.orderItem.product.title} /> : <span className="return-product-placeholder"><Package size={24} /></span>}<div><strong>{item.orderItem.product.title}</strong><p>Số lượng trả: {item.quantity}</p></div></div>)}
          <details className="return-identifiers"><summary>Mã đơn và mã hồ sơ</summary><p>Đơn hàng: {request.orderId}</p><p>Hồ sơ: {request.id}</p></details>
        </section>
        <section className="return-card"><div className="return-section-heading"><Truck size={18} /><h2>Vận chuyển hàng trả</h2></div>
          {!request.logistics ? <p className="return-muted">Chưa tạo chuyến trả hàng.</p> : <>
            <div className="return-shipment-meta"><span className="return-tag">{request.logistics.environment === 'TEST' ? 'Vận chuyển mô phỏng' : request.logistics.carrier}</span><span>Mã vận đơn: {request.logistics.trackingCode}</span></div>
            <ol className="return-timeline">{[
              { label: 'Đã tạo chuyến trả hàng', done: true, timestamp: undefined },
              { label: 'Đã lấy hàng trả', done: !!request.logistics.pickedUpAt, timestamp: request.logistics.pickedUpAt },
              { label: 'Đã giao hàng trả đến shop', done: !!request.logistics.deliveredAt, timestamp: request.logistics.deliveredAt },
              { label: 'Shop xác nhận nhận hàng', done: !!request.logistics.receivedAt, timestamp: request.logistics.receivedAt },
            ].map(event => <li key={event.label} className={event.done ? 'is-done' : ''}><span>{event.done ? <Check size={12} /> : <Clock3 size={12} />}</span><div><strong>{event.label}</strong><p>{event.timestamp ? date(event.timestamp) : event.done ? 'Đã ghi nhận' : 'Chưa ghi nhận'}</p></div></li>)}</ol>
          </>}
          {request.status === 'RETURNING' && request.simulationEnabled && request.logistics?.environment === 'TEST' && !request.logistics.deliveredAt && mode !== 'admin' && <button disabled={busy} className="return-button return-button-primary" onClick={() => void act(() => returnService.simulatePickup(request.id, { status: request.logistics?.pickedUpAt ? 'delivered' : 'picked' }))}>{busy && <Loader2 size={15} className="animate-spin" />}{request.logistics.pickedUpAt ? 'Mô phỏng giao hàng trả đến shop' : 'Mô phỏng lấy hàng trả'}</button>}
        </section>
        <section className="return-card"><div className="return-section-heading"><ShieldCheck size={18} /><h2>Lý do & bằng chứng</h2></div><h3>{reasons[request.reason] || request.reason}</h3><p className="return-text">{request.details || 'Khách chưa bổ sung mô tả.'}</p>
          {!!images.length && <div className="return-evidence">{images.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Ảnh bằng chứng ${index + 1}`} /><span>Ảnh bằng chứng {index + 1}</span></a>)}</div>}
          {video && <a href={video} target="_blank" rel="noreferrer" className="return-media-link"><Video size={16} />Xem video mở hộp<ArrowRight size={14} /></a>}
          {request.shopResponse && <div className="return-statement"><span className="return-eyebrow">Giải trình của shop</span><p className="return-text">{request.shopResponse}</p></div>}
          {request.decisionReason && <div className="return-statement"><span className="return-eyebrow">Kết quả xét duyệt của sàn</span><p className="return-text">{request.decisionReason}</p></div>}
        </section>
      </div><aside className="return-side-column">
        {mode === 'shop' && canReceiveReturn(request) && <section className="return-card return-receive-card"><h2>Xác nhận nhận hàng trả</h2><p className="return-muted">Kiểm tra kiện hàng trước khi xác nhận. Thao tác này chuyển hồ sơ sang xử lý hoàn tiền.</p><button disabled={busy} className="return-button return-button-primary" onClick={() => void act(() => returnService.confirmReceipt(request.id))}>{busy && <Loader2 size={15} className="animate-spin" />}Xác nhận shop đã nhận hàng trả</button></section>}
        <section className="return-card return-refund-card"><div className="return-section-heading"><Wallet size={18} /><h2>Thông tin hoàn tiền</h2></div><span className="return-muted">{request.status === 'REFUNDED' && request.refundReference ? 'Số tiền đã hoàn' : 'Số tiền hoàn dự kiến'}</span><strong className="return-amount">{formatMoney(request.refundAmountVnd || 0)}</strong>
          <dl><div><dt>Hình thức</dt><dd>Ví SCANMS của người mua</dd></div><div><dt>Phí vận chuyển</dt><dd>Không nằm trong tiền hoàn sản phẩm</dd></div></dl>
          <p className="return-notice">Sàn duyệt yêu cầu chưa cộng tiền ngay. Sau khi shop xác nhận nhận hàng trả, hệ thống mới xử lý hoàn tiền.</p>
          {request.refundReference && <p className="return-reference">Mã giao dịch: {request.refundReference}</p>}
          {request.status === 'REFUNDED' && request.refundReference && mode === 'customer' && <Link className="return-button return-button-primary" to="/customer/wallet">Xem số dư và lịch sử ví<ArrowRight size={15} /></Link>}
          {['RECEIVED', 'REFUND_PENDING'].includes(request.status) && <p role="status" className="return-notice">Đang chờ dịch vụ ví xử lý. Trang tự cập nhật; hệ thống sẽ thử lại khi dịch vụ thanh toán sẵn sàng.</p>}
        </section>
        {mode === 'customer' && request.status === 'APPROVED' && <section className="return-card"><h2>Gửi hàng trả về shop</h2><p className="return-muted">Chọn cách gửi hàng để tiếp tục hồ sơ đã được sàn duyệt.</p>
          {request.simulationEnabled && <button disabled={busy} className="return-button return-button-primary" onClick={() => void act(() => returnService.send(request.id, { environment: 'TEST' }))}>{busy && <Loader2 size={15} className="animate-spin" />}Tạo chuyến trả hàng mô phỏng</button>}
          <button className="return-button" aria-expanded={manual} onClick={() => setManual(value => !value)}>Nhập vận đơn gửi hàng thật</button>
          {manual && <form onSubmit={event => { event.preventDefault(); if (carrier.trim() && trackingCode.trim()) void act(() => returnService.send(request.id, { environment: 'MANUAL', carrier: carrier.trim(), trackingCode: trackingCode.trim() })); }} className="return-manual-form"><p className="return-muted">Liên hệ shop xác nhận địa chỉ nhận hàng trước khi gửi.</p><label>Đơn vị vận chuyển<input required disabled={busy} maxLength={100} value={carrier} onChange={event => setCarrier(event.target.value)} /></label><label>Mã vận đơn<input required disabled={busy} maxLength={100} value={trackingCode} onChange={event => setTrackingCode(event.target.value)} /></label><button disabled={busy || !carrier.trim() || !trackingCode.trim()} className="return-button return-button-primary">Xác nhận đã gửi hàng trả</button></form>}
        </section>}
        {mode === 'customer' && request.status === 'REQUESTED' && <section className="return-card"><p className="return-muted">Bạn có thể hủy yêu cầu khi sàn chưa ra quyết định.</p><button disabled={busy} className="return-button" onClick={() => void act(() => returnService.cancel(request.id))}>Hủy yêu cầu trả hàng</button></section>}
      </aside></div>
    </>}
  </main>;
}
