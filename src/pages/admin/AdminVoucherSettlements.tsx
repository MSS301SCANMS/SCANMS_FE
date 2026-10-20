import { useState } from 'react';
import { ChevronDown, Search, Store, Wallet, Loader2, Check } from 'lucide-react';
import { type PlatformSubsidySummary, couponService } from '../../services/coupon.service';
import { toast } from '../../utils/toast';

const money = (value: number) => `${Number(value).toLocaleString('vi-VN')} đ`;
export function AdminVoucherSettlements({ items, loading, error, onUpdated }: { items: PlatformSubsidySummary[]; loading: boolean; error: string; onUpdated: () => void }) {
  const [search, setSearch] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const totals = items.reduce((sum, item) => ({ amount: sum.amount + item.amount, paid: sum.paid + item.paidAmount, remaining: sum.remaining + item.outstandingAmount }), { amount: 0, paid: 0, remaining: 0 });
  const visible = items.filter(item => item.storeName.toLowerCase().includes(search.trim().toLowerCase()) && (!pendingOnly || item.outstandingAmount > 0));
  const record = async (event: React.FormEvent, id: string, amount: number) => {
    event.preventDefault();
    if (busy || !reference.trim() || amount <= 0) return;
    setBusy(true); setFormError('');
    try {
      await couponService.recordPlatformReimbursement(id, amount, reference.trim());
      toast.success('Đã ghi nhận khoản chuyển hoàn cho Shop.');
      setOrderId(''); setReference(''); onUpdated();
    } catch (err: any) { setFormError(err?.response?.data?.message || 'Chưa ghi nhận được giao dịch. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  };
  return <section className="av-settlements" aria-label="Đối soát voucher sàn theo gian hàng">
    <div className="av-settlement-totals">{[['Tổng cần hoàn', totals.amount], ['Đã ghi nhận chuyển', totals.paid], ['Còn phải hoàn', totals.remaining]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{loading ? '—' : money(Number(value))}</strong></div>)}</div>
    <div className="av-section-title"><div><h3>Đối soát theo gian hàng</h3><p>Mở từng gian hàng để xem đơn và ghi nhận giao dịch đã chuyển.</p></div><span>{items.length} gian hàng</span></div>
    <div className="av-settlement-filters"><label className="av-search"><Search size={16} /><input aria-label="Tìm gian hàng đối soát" placeholder="Tìm tên gian hàng…" value={search} onChange={event => setSearch(event.target.value)} /></label><label className="av-checkbox"><input type="checkbox" checked={pendingOnly} onChange={event => setPendingOnly(event.target.checked)} />Chỉ hiện còn phải hoàn</label></div>
    {error ? <p className="av-error" role="alert">{error}</p> : loading ? <p className="av-empty">Đang tải dữ liệu đối soát…</p> : !visible.length ? <div className="av-empty"><Wallet size={28} /><strong>Chưa có khoản đối soát phù hợp</strong><p>Các đơn hoàn tất có dùng voucher sàn sẽ được tổng hợp tại đây.</p></div> : <div className="av-store-list">{visible.map(item => <details className="av-store-settlement" key={item.storeId}>
      <summary><span className="av-store-icon"><Store size={18} /></span><span className="av-store-name"><strong>{item.storeName}</strong><small>{item.orderCount} đơn · Đã ghi nhận {money(item.paidAmount)}</small></span><span className="av-store-balance"><small>Còn phải hoàn</small><strong>{money(item.outstandingAmount)}</strong></span><ChevronDown size={17} className="av-chevron" /></summary>
      <div className="av-store-orders">
        {!item.reimbursementReady && <p className="av-error">Chưa thể ghi nhận chuyển hoàn. Vui lòng kiểm tra cấu hình đối soát.</p>}
        {item.orders.map(order => <article className="av-settlement-order" key={order.orderId}><div className="av-order-line"><div><strong>{order.orderCode}</strong><p>Phải hoàn {money(order.amount)} · Đã ghi nhận {money(order.paidAmount)}</p></div>{item.reimbursementReady && order.outstandingAmount > 0 ? <button type="button" className="av-button" disabled={busy} onClick={() => { setOrderId(order.orderId); setReference(''); setFormError(''); }}>Ghi nhận chuyển {money(order.outstandingAmount)}</button> : order.outstandingAmount <= 0 ? <span className="av-settled"><Check size={14} />Đã đối soát</span> : null}</div>
          {order.paidAmount > order.amount && <p className="av-error">Đã hoàn vượt {money(order.paidAmount - order.amount)} sau điều chỉnh đơn. Cần đối soát lại.</p>}
          {order.payments.map((payment, index) => <p className="av-payment-history" key={`${payment.bankReference}-${index}`}>{payment.bankReference} · {money(payment.amount)} · {new Date(payment.paidAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>)}
          {orderId === order.orderId && <form className="av-reimbursement-form" onSubmit={event => void record(event, order.orderId, order.outstandingAmount)}><label>Mã giao dịch ngân hàng<input autoFocus required minLength={3} maxLength={100} disabled={busy} value={reference} onChange={event => setReference(event.target.value)} placeholder="Nhập mã giao dịch đã chuyển cho Shop" /></label><p>Ghi nhận giao dịch đã chuyển ngoài hệ thống; thao tác này không tự chuyển tiền.</p>{formError && <p className="av-error" role="alert">{formError}</p>}<div><button type="button" className="av-button" disabled={busy} onClick={() => setOrderId('')}>Hủy</button><button className="av-button av-button-primary" disabled={busy}>{busy && <Loader2 size={14} className="animate-spin" />}Xác nhận đã chuyển</button></div></form>}
        </article>)}
      </div>
    </details>)}</div>}
  </section>;
}
