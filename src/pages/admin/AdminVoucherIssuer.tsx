import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Loader2, ShieldCheck, Ticket, X } from 'lucide-react';
import { couponService } from '../../services/coupon.service';
import api from '../../services/api';

const money = (value: number) => `${Number(value).toLocaleString('vi-VN')} đ`;

export function AdminVoucherIssuer({ onClose, onIssued }: { onClose: () => void; onIssued: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [storeError, setStoreError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ storeId: '', code: '', benefitType: 'GOODS' as 'GOODS' | 'SHIPPING', discountType: 'FIXED_AMOUNT' as 'FIXED_AMOUNT' | 'PERCENTAGE', discountValue: 30000, minimumOrderAmount: 0, budgetTotal: 3000000, usageLimitTotal: 100, maximumDiscountAmount: 30000 });
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setStoreError(false);
    void api.get('/stores/marketplace').then((res: any) => {
      const data = res?.data?.data || res?.data || res;
      if (active) setStores(Array.isArray(data) ? data : data?.items || []);
    }).catch(() => { if (active) setStoreError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  const change = <K extends keyof typeof form>(key: K, value: typeof form[K]) => setForm(previous => ({ ...previous, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await couponService.createPlatformCoupon({ ...form, code: form.code.trim().toUpperCase(), maximumDiscountAmount: form.discountType === 'FIXED_AMOUNT' ? form.discountValue : form.maximumDiscountAmount });
      onIssued();
    } catch (err: any) { setError(err?.response?.data?.message || 'Chưa phát hành được voucher. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  };
  const store = stores.find(item => item.id === form.storeId);
  return <dialog ref={dialog} className="av-issue-modal" aria-labelledby="av-issue-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="av-dialog-heading"><span className="av-heading-icon"><Ticket size={21} /></span><div><h2 id="av-issue-title">Phát hành voucher sàn</h2><p>Thiết lập ưu đãi do SCANMS tài trợ cho gian hàng.</p></div><button type="button" className="av-icon-button" aria-label="Đóng phát hành voucher" disabled={busy} onClick={onClose}><X size={20} /></button></header>
    <form onSubmit={submit}>
      <div className="av-issue-body">
        <fieldset disabled={busy} className="av-issue-fields">
          {error && <p className="av-error" role="alert"><AlertCircle size={16} />{error}</p>}
          <div className="av-form-section"><h3>01 <span>Thông tin voucher</span></h3>
            <label>Gian hàng áp dụng <span>*</span><select required autoFocus value={form.storeId} disabled={loading || storeError} onChange={event => change('storeId', event.target.value)}><option value="">{loading ? 'Đang tải gian hàng…' : 'Chọn gian hàng'}</option>{stores.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            {storeError && <p className="av-error" role="alert">Chưa tải được gian hàng. <button type="button" onClick={() => setRetry(value => value + 1)}>Thử lại</button></p>}
            <label>Mã voucher <span>*</span><input required minLength={4} maxLength={20} pattern="[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*" value={form.code} onChange={event => change('code', event.target.value.toUpperCase())} placeholder="VD: SANTEST20K" autoComplete="off" /><small>4–20 ký tự chữ và số, không có dấu hoặc khoảng trắng.</small></label>
          </div>
          <div className="av-form-section"><h3>02 <span>Giá trị ưu đãi</span></h3><div className="av-form-grid">
            <label>Áp dụng cho<select value={form.benefitType} onChange={event => change('benefitType', event.target.value as typeof form.benefitType)}><option value="GOODS">Tiền hàng</option><option value="SHIPPING">Phí vận chuyển GHN</option></select></label>
            <label>Hình thức giảm<select value={form.discountType} onChange={event => setForm(previous => ({ ...previous, discountType: event.target.value as typeof form.discountType, discountValue: event.target.value === 'PERCENTAGE' ? 10 : 30000 }))}><option value="FIXED_AMOUNT">Số tiền cố định</option><option value="PERCENTAGE">Theo phần trăm</option></select></label>
            <label>Mức giảm ({form.discountType === 'PERCENTAGE' ? '%' : 'VNĐ'}) <span>*</span><input required type="number" min={1} max={form.discountType === 'PERCENTAGE' ? 100 : undefined} value={form.discountValue} onChange={event => change('discountValue', Number(event.target.value))} /></label>
            {form.discountType === 'PERCENTAGE' && <label>Giảm tối đa (VNĐ) <span>*</span><input required type="number" min={1} value={form.maximumDiscountAmount} onChange={event => change('maximumDiscountAmount', Number(event.target.value))} /></label>}
            <label>Đơn tối thiểu (VNĐ)<input required type="number" min={0} value={form.minimumOrderAmount} onChange={event => change('minimumOrderAmount', Number(event.target.value))} /></label>
          </div></div>
          <div className="av-form-section"><h3>03 <span>Hạn mức phát hành</span></h3><div className="av-form-grid">
            <label>Tổng ngân sách (VNĐ) <span>*</span><input required type="number" min={1} value={form.budgetTotal} onChange={event => change('budgetTotal', Number(event.target.value))} /></label>
            <label>Tổng lượt sử dụng <span>*</span><input required type="number" min={1} step={1} value={form.usageLimitTotal} onChange={event => change('usageLimitTotal', Number(event.target.value))} /></label>
          </div></div>
        </fieldset>
        <aside className="av-preview"><span className="av-eyebrow">XEM TRƯỚC ƯU ĐÃI</span><div className="av-voucher-preview"><div className="av-preview-brand"><Ticket size={20} /><strong>SCANMS</strong><span>Voucher Sàn</span></div><h3>Giảm {form.discountType === 'PERCENTAGE' ? `${form.discountValue}%` : money(form.discountValue)}</h3><p>{form.benefitType === 'GOODS' ? 'Ưu đãi tiền hàng' : 'Ưu đãi phí vận chuyển'}{form.discountType === 'PERCENTAGE' ? ` · Tối đa ${money(form.maximumDiscountAmount)}` : ''}</p><code>{form.code || 'MÃ VOUCHER'}</code><dl><div><dt>Gian hàng</dt><dd>{store?.name || 'Chưa chọn'}</dd></div><div><dt>Đơn từ</dt><dd>{money(form.minimumOrderAmount)}</dd></div><div><dt>Tổng lượt</dt><dd>{form.usageLimitTotal.toLocaleString('vi-VN')}</dd></div></dl></div>
          <div className="av-funding-note"><ShieldCheck size={19} /><div><strong>SCANMS tài trợ 100%</strong><p>Khoản giảm được ghi nhận để đối soát chuyển hoàn cho Shop theo đơn đủ điều kiện.</p></div></div>
          <div className="av-preview-budget"><span>Ngân sách tối đa</span><strong>{money(form.budgetTotal)}</strong></div>
        </aside>
      </div>
      <footer className="av-dialog-footer"><button type="button" className="av-button" disabled={busy} onClick={onClose}>Hủy bỏ</button><button type="submit" className="av-button av-button-primary" disabled={busy || loading || storeError || !stores.length}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}{busy ? 'Đang phát hành…' : 'Phát hành voucher'}</button></footer>
    </form>
  </dialog>;
}
