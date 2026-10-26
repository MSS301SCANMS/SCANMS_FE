import { AlertCircle, CheckCircle2, Loader2, Tag } from 'lucide-react';
import type { CheckoutShopGroup } from './CheckoutItemsSection';

interface VoucherEntry { value: string; applied: boolean; busy: boolean; onChange: (value: string) => void; onApply: () => void; onRemove: () => void }

export function CheckoutVoucherSection({ groups, targetStoreId, onTargetChange, shop, platform, shipping, message, supportsStacked = true, onChooseVoucher }: {
  groups: CheckoutShopGroup[]; targetStoreId: string; onTargetChange: (id: string) => void;
  shop: VoucherEntry; platform: VoucherEntry; shipping: VoucherEntry;
  message: { type: 'success' | 'error'; text: string } | null;
  supportsStacked?: boolean;
  onChooseVoucher?: () => void;
}) {
  return (
    <section className="checkout-section checkout-vouchers" aria-labelledby="checkout-vouchers-title">
      <header className="checkout-section-heading"><h2 id="checkout-vouchers-title"><Tag size={19} aria-hidden="true" />Voucher & ưu đãi</h2></header>
      <div className="checkout-vouchers-body">
        {supportsStacked && groups.length > 1 && <div className="checkout-voucher-target"><label htmlFor="checkout-voucher-store">Gian hàng áp dụng voucher</label><select id="checkout-voucher-store" value={targetStoreId} onChange={event => onTargetChange(event.target.value)}>{groups.map(group => <option key={group.store.id} value={group.store.id}>{group.store.name}</option>)}</select></div>}
        <div className="checkout-voucher-fields">{([
          ['shop', 'Voucher Shop / KOL', shop], ['platform', 'Voucher SCANMS', platform], ['shipping', 'Voucher vận chuyển', shipping],
        ] as const).filter(([key]) => supportsStacked || key !== 'platform').map(([key, label, entry]) => <div key={key} className="checkout-voucher-field">
          <label htmlFor={`checkout-voucher-${key}`}>{!supportsStacked ? key === 'shop' ? 'Voucher giảm tiền hàng' : 'Voucher miễn / giảm phí vận chuyển' : label}</label>
          <div><input id={`checkout-voucher-${key}`} value={entry.value} onChange={event => entry.onChange(event.target.value.toUpperCase())} disabled={entry.applied || entry.busy} placeholder="Nhập mã voucher" autoComplete="off" /><button type="button" disabled={entry.busy || (!entry.applied && !entry.value.trim())} onClick={entry.applied ? entry.onRemove : entry.onApply}>{entry.busy ? <Loader2 size={15} className="animate-spin" aria-label="Đang áp dụng" /> : entry.applied ? 'Bỏ mã' : 'Áp dụng'}</button></div>
        </div>)}</div>
        {onChooseVoucher && <button type="button" className="checkout-voucher-choose" onClick={onChooseVoucher}>Chọn voucher khác</button>}
        {message && <p className="checkout-voucher-message" data-type={message.type} role="status">{message.type === 'success' ? <CheckCircle2 size={14} aria-hidden="true" /> : <AlertCircle size={14} aria-hidden="true" />}{message.text}</p>}
      </div>
    </section>
  );
}
