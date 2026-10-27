import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, Check, Loader2, Search, Tag, TicketPercent, Truck, X } from 'lucide-react';
import { couponService } from '../../services/coupon.service';
import type { PlatformVoucher } from '../../utils/platform-voucher.utils';
import './PlatformVoucherPicker.css';

const money = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

export interface VoucherSelection { goodsCode: string; shippingCode: string; enteredCode?: string }

export function PlatformVoucherPicker({ storeId, subtotal, selectedCode = '', selectedShippingCode = '', initialEnteredCode = '', busy = false, error, onClose, onChoose, onChoosePair }: {
  storeId: string; subtotal: number; selectedCode?: string; busy?: boolean; error?: string | null;
  selectedShippingCode?: string;
  initialEnteredCode?: string;
  onClose: () => void; onChoose?: (code: string) => Promise<boolean>;
  onChoosePair?: (selection: VoucherSelection) => Promise<boolean>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [vouchers, setVouchers] = useState<PlatformVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [code, setCode] = useState(onChoosePair ? initialEnteredCode : selectedCode);
  const [goodsCode, setGoodsCode] = useState(selectedCode);
  const [shippingCode, setShippingCode] = useState(selectedShippingCode);
  const [pending, setPending] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const sending = useRef(false);
  const disabled = busy || pending;
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError(false); setVouchers([]);
    void couponService.getPublicPlatformCoupons(storeId, controller.signal).then(items => {
      if (!controller.signal.aborted) setVouchers(items);
    }).catch(() => { if (!controller.signal.aborted) setLoadError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [storeId, retry]);
  const choose = async () => {
    if (sending.current || disabled) return;
    const selected = vouchers.find(voucher => voucher.code === code.trim().toUpperCase());
    if (selected && (Date.parse(selected.expiresAt) <= Date.now() || subtotal < selected.minimumOrderAmount)) {
      setSelectionError('Voucher đã hết hạn hoặc đơn hàng chưa đạt giá trị tối thiểu.'); return;
    }
    sending.current = true; setPending(true); setSelectionError('');
    try {
      const accepted = onChoosePair
        ? await onChoosePair({ goodsCode, shippingCode, enteredCode: code.trim().toUpperCase() || undefined })
        : await onChoose?.(code.trim().toUpperCase());
      if (accepted) onClose();
    }
    catch { setSelectionError('Chưa áp dụng được voucher. Vui lòng thử lại.'); }
    finally { sending.current = false; setPending(false); }
  };
  return <dialog ref={dialog} className="platform-voucher-picker" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!disabled) onClose(); }}
    onClick={event => { if (event.target === dialog.current && !disabled) onClose(); }}>
    <div className="pvp-shell">
      <header className="pvp-header"><span className="pvp-heading-icon"><TicketPercent size={23} /></span><div><h2 id={titleId}>Chọn voucher SCANMS</h2><p>Chọn tối đa 1 mã giảm giá và 1 mã freeship</p></div><button type="button" aria-label="Đóng chọn voucher" disabled={disabled} onClick={onClose}><X size={21} /></button></header>
      <div className="pvp-content">
        <label className="pvp-code"><Search size={18} /><input autoFocus aria-label="Nhập mã voucher sàn" placeholder="Nhập mã voucher sàn" value={code} disabled={disabled} maxLength={100} onChange={event => { setCode(event.target.value.toUpperCase()); setSelectionError(''); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void choose(); } }} /></label>
        {loading ? <p role="status" className="pvp-state"><Loader2 size={18} className="animate-spin" />Đang tìm ưu đãi của sàn…</p>
          : loadError ? <div role="alert" className="pvp-state pvp-error"><AlertCircle size={18} /><span>Chưa tải được voucher của sàn.</span><button type="button" onClick={() => setRetry(value => value + 1)}>Thử lại</button></div>
          : <div className="pvp-groups">{(['SHIPPING', 'GOODS'] as const).map(type => {
            const list = vouchers.filter(voucher => voucher.benefitType === type);
            return <section key={type} aria-label={type === 'SHIPPING' ? 'Ưu đãi phí vận chuyển' : 'Mã giảm giá của sàn'}>
              <h3>{type === 'SHIPPING' ? <Truck size={19} /> : <Tag size={19} />}{type === 'SHIPPING' ? 'Ưu đãi phí vận chuyển' : 'Mã giảm giá của sàn'}<span>{list.length}</span></h3>
              {!list.length ? <p className="pvp-empty">{type === 'SHIPPING' ? 'Chưa có voucher miễn/giảm phí vận chuyển của sàn.' : 'Chưa có mã giảm giá của sàn phù hợp.'}</p>
                : list.map(voucher => {
                  const eligible = subtotal >= voucher.minimumOrderAmount;
                  const selected = onChoosePair ? (type === 'SHIPPING' ? shippingCode : goodsCode) === voucher.code : code.trim().toUpperCase() === voucher.code;
                  const amount = voucher.discountType === 'PERCENTAGE' ? `${voucher.discountValue}%` : money(voucher.discountValue);
                  return <article key={voucher.id} className={`pvp-voucher ${type === 'SHIPPING' ? 'pvp-shipping' : ''} ${selected ? 'pvp-selected' : ''} ${!eligible ? 'pvp-unavailable' : ''}`}>
                    <label><span className="pvp-ticket">{type === 'SHIPPING' ? <Truck size={25} /> : <TicketPercent size={25} />}<strong>{type === 'SHIPPING' ? 'FREESHIP' : 'SCANMS'}</strong><small>Voucher sàn</small></span>
                      <span className="pvp-description"><strong>{type === 'SHIPPING' ? 'Giảm phí vận chuyển ' : 'Giảm '}{amount}</strong>
                        {voucher.maximumDiscountAmount !== null && <span>Giảm tối đa {money(voucher.maximumDiscountAmount)}</span>}
                        <span>Đơn tối thiểu {money(voucher.minimumOrderAmount)}</span><code>{voucher.code}</code>
                        <small>HSD: {new Date(voucher.expiresAt).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</small>
                        {!eligible && <small className="pvp-requirement">Mua thêm {money(voucher.minimumOrderAmount-subtotal)} để dùng mã</small>}
                      </span>
                      <input type={onChoosePair ? 'checkbox' : 'radio'} name={`${titleId}-${type}`} aria-label={`Chọn ${voucher.code}`} checked={selected} disabled={!eligible || disabled} onChange={() => {
                        if(onChoosePair) { (type === 'SHIPPING' ? setShippingCode : setGoodsCode)(selected ? '' : voucher.code); setCode(''); }
                        else setCode(voucher.code);
                        setSelectionError('');
                      }} />
                    </label>
                    <details><summary>Điều kiện</summary><p>Ưu đãi của SCANMS áp dụng cho đơn đạt giá trị tối thiểu. {type === 'SHIPPING' ? 'Khoản giảm được trừ vào phí vận chuyển khi thanh toán.' : 'Khoản giảm được trừ vào tiền hàng.'}{voucher.remainingUses !== null ? ` Còn ${voucher.remainingUses.toLocaleString('vi-VN')} lượt sử dụng.` : ''} Mức giảm được kiểm tra lại khi đặt hàng.</p></details>
                  </article>;
                })}
            </section>;
          })}</div>}
      </div>
      <footer className="pvp-footer">{(selectionError || error) && <p role="alert"><AlertCircle size={15} />{selectionError || error}</p>}<div><span>{onChoosePair ? <>Đã chọn {[goodsCode,shippingCode].filter(Boolean).length}/2 voucher: <strong>{[goodsCode,shippingCode].filter(Boolean).join(' + ') || 'Chưa chọn mã'}</strong>{code.trim() && <> · Mã nhập: {code.trim()}</>}</> : code.trim() ? <>Mã đã chọn: <strong>{code.trim().toUpperCase()}</strong></> : 'Chọn voucher phù hợp cho đơn hàng'}</span><button type="button" disabled={disabled || !onChoosePair && !code.trim()} onClick={() => void choose()}>{disabled ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}{disabled ? 'Đang kiểm tra…' : 'Đồng ý'}</button></div></footer>
    </div>
  </dialog>;
}
