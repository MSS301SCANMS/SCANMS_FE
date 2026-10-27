import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Loader2, Percent, Plus, RefreshCw, Send, X } from 'lucide-react';
import { productCommissionDeals as service, type ProductCommissionDeal, type ProductCommissionRate } from '../../services/product-commission-deals.service';
import { referralLinksService, type EligibleProduct } from '../../services/referral-links.service';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { toast } from '../../utils/toast';
import './ProductCommissionDeals.css';

const labels: Record<string,string> = { PENDING: 'Chờ shop duyệt', APPROVED: 'Đang áp dụng', REJECTED: 'Đã từ chối', CANCELLED: 'Đã thu hồi', SUPERSEDED: 'Đã thay thế', ENDED: 'Đã kết thúc' };
const percent = (value: number | string) => Number(value).toLocaleString('vi-VN') + '%';
const date = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '—';
const reason = (error: unknown) => error instanceof Error ? error.message : 'Chưa xử lý được đề xuất. Vui lòng thử lại.';

export function ProductCommissionDeals({ mode }: { mode: 'kol' | 'shop' }) {
  const [rows, setRows] = useState<ProductCommissionDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [compose, setCompose] = useState(false);
  const [selected, setSelected] = useState<ProductCommissionDeal | null>(null);
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true); setError('');
    try { const data = await service.list(mode); if (generation.current === request) setRows(data); }
    catch (cause) { if (generation.current === request) setError(reason(cause)); }
    finally { if (generation.current === request) setLoading(false); }
  }, [mode]);
  useEffect(() => { void load(); return () => { generation.current++; }; }, [load]);
  const act = async (decision: 'APPROVED' | 'REJECTED' | 'ENDED' | 'CANCELLED') => {
    if (!selected || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (decision === 'CANCELLED') await service.cancel(selected.id);
      else await service.respond(selected.id, decision, response);
      setSelected(null); await load();
      window.dispatchEvent(new Event('commission-deals-updated'));
      toast.success(decision === 'APPROVED' ? 'Đã duyệt mức hoa hồng cho các đơn mới.' : 'Đã cập nhật đề xuất.');
    } catch (cause) { setError(reason(cause)); }
    finally { lock.current = false; setBusy(false); }
  };
  const filtered = rows.filter(row => filter === 'ALL' || row.status === filter);
  return <section className="product-deals" aria-label="Deal hoa hồng sản phẩm">
    <header className="product-deals-heading"><div className="product-deals-title"><span className="product-deals-icon"><Percent size={21} /></span><div><h2>Deal hoa hồng sản phẩm</h2><p>{mode === 'kol' ? 'Đề xuất tăng thêm 1–3 điểm phần trăm cho từng sản phẩm.' : 'Xem đề xuất của KOL và duyệt mức hoa hồng cho đơn mới.'}</p></div></div>
      {mode === 'kol' && <button type="button" className="product-deals-button primary" onClick={() => setCompose(true)}><Plus size={16} />Đề xuất tăng hoa hồng</button>}
    </header>
    <div className="product-deals-toolbar"><div className="product-deals-filters">{[['ALL','Tất cả'],['PENDING','Chờ duyệt'],['APPROVED','Đang áp dụng'],['REJECTED','Đã từ chối']].map(([value,label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label} <span>{rows.filter(row => value === 'ALL' || row.status === value).length}</span></button>)}</div><button type="button" className="product-deals-button" disabled={loading || busy} onClick={() => void load()}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Cập nhật</button></div>
    {error && <p role="alert" className="product-deals-error"><AlertCircle size={16} />{error}</p>}
    {loading && !rows.length ? <p className="product-deals-empty"><Loader2 size={20} className="animate-spin" />Đang tải đề xuất…</p> : !filtered.length ? <div className="product-deals-empty"><Percent size={25} /><strong>{error ? 'Chưa tải được đề xuất' : 'Chưa có đề xuất ở mục này'}</strong><p>{mode === 'kol' ? 'Chọn sản phẩm để xem mức cơ bản và gửi đề xuất cho shop.' : 'Đề xuất của KOL sẽ xuất hiện tại đây để bạn xem xét.'}</p></div> : <div className="product-deals-list">{filtered.map(row => <article key={row.id} className="product-deals-row">
      <img src={row.imageUrl || '/assets/product-placeholder.svg'} alt={row.productName} onError={e => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = 'true'; e.currentTarget.src = '/assets/product-placeholder.svg'; } }} />
      <div className="product-deals-row-copy"><strong>{row.productName}</strong><span>{mode === 'kol' ? row.storeName : row.collaboratorName}</span><small>{date(row.createdAt)}</small></div>
      <div className="product-deals-rate"><strong>{percent(row.totalRate ?? Number(row.baseRate) + row.extraPoints)}</strong><span>{percent(row.baseRate)} + {row.extraPoints} điểm %</span></div>
      <span className={`product-deals-status ${row.status.toLowerCase()}`}>{labels[row.status]}</span>
      <button type="button" className="product-deals-button" onClick={() => { setError(''); setResponse(''); setSelected(row); }}>Xem đề xuất</button>
    </article>)}</div>}
    {compose && <DealComposer onClose={() => setCompose(false)} onSent={() => { setCompose(false); void load(); }} />}
    {selected && <Modal isOpen stickyHeader maxWidth="lg" title="Chi tiết deal hoa hồng" subtitle={selected.productName} onClose={() => { if (!busy) setSelected(null); }} footer={<div className="product-deals-footer">
      {mode === 'kol' && selected.status === 'PENDING' && <button type="button" className="product-deals-button" disabled={busy} onClick={() => void act('CANCELLED')}>Thu hồi đề xuất</button>}
      {mode === 'shop' && selected.status === 'PENDING' && <><button type="button" className="product-deals-button" disabled={busy} onClick={() => void act('REJECTED')}><X size={15} />Từ chối</button><button type="button" className="product-deals-button primary" disabled={busy} onClick={() => void act('APPROVED')}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}Duyệt {percent(Number(selected.baseRate) + selected.extraPoints)}</button></>}
      {mode === 'shop' && selected.status === 'APPROVED' && <button type="button" className="product-deals-button" disabled={busy} onClick={() => void act('ENDED')}>Kết thúc cho đơn mới</button>}
    </div>}><div className="product-deals-detail">
      {error && <p role="alert" className="product-deals-error">{error}</p>}
      <div className="product-deals-summary"><span>Hoa hồng {selected.status === 'PENDING' ? 'đề xuất' : 'đã ghi nhận'}</span><strong>{percent(selected.totalRate ?? Number(selected.baseRate) + selected.extraPoints)}</strong><p>Cơ bản {percent(selected.baseRate)} + tăng thêm {selected.extraPoints} điểm phần trăm</p></div>
      <dl><div><dt>Gian hàng</dt><dd>{selected.storeName}</dd></div><div><dt>KOL</dt><dd>{selected.collaboratorName}</dd></div><div><dt>Trạng thái</dt><dd>{labels[selected.status]}</dd></div><div><dt>Áp dụng từ</dt><dd>{date(selected.approvedAt)}</dd></div></dl>
      <div><strong>Lời đề xuất</strong><p className="product-deals-message">{selected.message}</p></div>
      {selected.response && <div><strong>Phản hồi của shop</strong><p className="product-deals-message">{selected.response}</p></div>}
      {mode === 'shop' && ['PENDING','APPROVED'].includes(selected.status) && <label>Phản hồi cho KOL<textarea maxLength={1000} rows={3} value={response} onChange={e => setResponse(e.target.value)} placeholder="Nội dung phản hồi (không bắt buộc)" /></label>}
      <p className="product-deals-note">Duyệt hoặc kết thúc deal không thay đổi tỷ lệ đã ghi nhận cho đơn cũ. Hoàn toàn bộ tiền hàng thì hoa hồng còn 0đ.</p>
    </div></Modal>}
  </section>;
}

function DealComposer({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [products, setProducts] = useState<EligibleProduct[]>([]);
  const [productId, setProductId] = useState('');
  const [rate, setRate] = useState<ProductCommissionRate | null>(null);
  const [points, setPoints] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [rateLoading, setRateLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const selected = products.find(product => product.id === productId);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const list: EligibleProduct[] = [];
      for (let page = 1; page <= 20; page++) {
        const items = await referralLinksService.getEligibleProducts({ page, limit: 100 });
        list.push(...items); if (items.length < 100) break;
      }
      setProducts(list);
    } catch (cause) { setError(reason(cause)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let current = true; setRate(null); setError('');
    if (!productId) return;
    setRateLoading(true);
    service.rate(productId).then(value => { if (current) setRate(value); }).catch(cause => { if (current) setError(reason(cause)); }).finally(() => { if (current) setRateLoading(false); });
    return () => { current = false; };
  }, [productId]);
  const total = rate ? Number(rate.currentPolicyRate ?? rate.baseRate) + points : null;
  const submit = async () => {
    if (lock.current || !selected || !rate || message.trim().length < 10 || total == null || total > 100) return;
    lock.current = true; setBusy(true); setError('');
    try { await service.propose(selected.id, points, message.trim()); toast.success('Đã gửi đề xuất. Chờ shop duyệt trước khi áp dụng.'); onSent(); }
    catch (cause) { setError(reason(cause)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <Modal isOpen stickyHeader maxWidth="lg" title="Đề xuất tăng hoa hồng" subtitle="Mức tăng thêm chỉ áp dụng sau khi chủ shop đồng ý." onClose={() => { if (!busy) onClose(); }} footer={<div className="product-deals-footer"><button type="button" className="product-deals-button" disabled={busy} onClick={onClose}>Hủy bỏ</button><button type="button" className="product-deals-button primary" disabled={busy || loading || rateLoading || !rate || !productId || message.trim().length < 10 || total == null || total > 100} onClick={() => void submit()}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}Gửi đề xuất</button></div>}>
    <div className="product-deals-detail">
      {error && <p role="alert" className="product-deals-error"><AlertCircle size={16} />{error}</p>}
      <label>Sản phẩm<Select aria-label="Sản phẩm đề xuất hoa hồng" value={productId} onChange={e => setProductId(e.target.value)} disabled={loading || busy} searchable placeholder={loading ? 'Đang tải sản phẩm…' : 'Chọn sản phẩm của shop'} options={products.map(product => ({ value: product.id, label: `${product.title} · ${product.store.name}` }))} /></label>
      {!loading && !products.length && <p className="product-deals-note">Chưa có sản phẩm đang bán. <button type="button" onClick={() => void load()}>Tải lại sản phẩm</button></p>}
      {selected && <p className="product-deals-note">Gian hàng: <strong>{selected.store.name}</strong></p>}
      <label>Mức tăng thêm</label><div className="product-deals-choices">{[1,2,3].map(value => <button type="button" key={value} disabled={busy} aria-pressed={points === value} onClick={() => setPoints(value)}><strong>+{value} điểm %</strong><span>{rate ? `Tổng ${percent(Number(rate.currentPolicyRate ?? rate.baseRate) + value)}` : 'Chọn sản phẩm trước'}</span></button>)}</div>
      <div className="product-deals-summary"><span>{rateLoading ? 'Đang kiểm tra chính sách…' : 'Tổng hoa hồng đề xuất'}</span><strong>{total == null ? '—' : percent(total)}</strong><p>{rate ? `Cơ bản ${percent(rate.currentPolicyRate ?? rate.baseRate)} + ${points} điểm phần trăm. ${rate.dealId ? `Mức đang hưởng: ${percent(rate.totalRate)}. Deal mới sẽ thay thế mức này.` : 'Chưa áp dụng cho đến khi shop duyệt.'}` : 'Chính sách được lấy từ hệ thống, không nhập tỷ lệ tùy ý.'}</p></div>
      <label>Lời đề xuất<textarea aria-label="Lời đề xuất hoa hồng" minLength={10} maxLength={2000} rows={4} value={message} disabled={busy} onChange={e => setMessage(e.target.value)} placeholder="Nội dung dự định quảng bá, kênh và cách phối hợp cùng shop…" /><small>{message.trim().length}/2.000 ký tự · tối thiểu 10 ký tự</small></label>
      <p className="product-deals-note">Ví dụ: cơ bản 10% + 2 điểm phần trăm = 12%. Tiền hàng 299.000đ sẽ có hoa hồng 35.880đ nếu đủ điều kiện và không giảm giá/hoàn tiền.</p>
    </div>
  </Modal>;
}
