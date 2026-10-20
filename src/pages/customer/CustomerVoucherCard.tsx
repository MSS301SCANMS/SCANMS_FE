import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Clock3, Copy, Loader2, Store } from 'lucide-react';
import type { CustomerVoucher } from '../../hooks/useCustomerVouchers';
import { formatMoney } from '../../utils/marketplace.utils';
import { formatVoucherDeadline, voucherExpiryCountdown, voucherExpiryState } from '../../utils/voucher-expiry.utils';

interface CustomerVoucherCardProps {
  voucher: CustomerVoucher;
  now: number;
  saved: boolean;
  saving: boolean;
  copied: boolean;
  onToggleSaved: () => void;
  onCopy: () => void;
}

export function CustomerVoucherCard({ voucher, now, saved, saving, copied, onToggleSaved, onCopy }: CustomerVoucherCardProps) {
  const state = voucherExpiryState(voucher.expiresAt, now);
  const expired = state === 'expired';
  const percentage = voucher.discountType === 'PERCENTAGE';
  const amount = new Intl.NumberFormat('vi-VN').format(voucher.discountValue);
  const value = percentage ? `${amount}%` : formatMoney(voucher.discountValue);
  const minimum = voucher.minimumOrderAmount > 0 ? `Đơn từ ${formatMoney(voucher.minimumOrderAmount)}` : 'Không yêu cầu đơn tối thiểu';
  const expiry = formatVoucherDeadline(voucher.expiresAt);
  const countdown = voucherExpiryCountdown(voucher.expiresAt, now);

  return (
    <article className="customer-voucher-card" data-voucher-state={state} aria-label={`Mã ${voucher.code}, giảm ${value}${expired ? ', đã hết hạn' : ''}`}>
      <div className="customer-voucher-main">
        <div className="customer-voucher-value">
          <span className="customer-voucher-value-label">Giảm</span>
          <strong className={`customer-voucher-amount${amount.length > 9 ? ' customer-voucher-amount--wide' : amount.length > 7 ? ' customer-voucher-amount--long' : ''}`} aria-label={value}>
            <span>{amount}{percentage ? '%' : ''}</span>
            {!percentage && <span className="customer-voucher-currency">₫</span>}
          </strong>
          <span className="customer-voucher-benefit">{voucher.benefitType === 'SHIPPING' ? 'Phí vận chuyển' : 'Tiền hàng'}</span>
        </div>
        <div className="customer-voucher-info">
          {state !== 'active' && <div className="customer-voucher-status">
            <span className={`customer-voucher-state customer-voucher-state--${state}`}>{expired ? 'Đã hết hạn' : 'Sắp hết hạn'}</span>
            {countdown && <span className="customer-voucher-countdown">{countdown}</span>}
          </div>}
          <span className="customer-voucher-store"><Store size={14} aria-hidden="true" /><span>{voucher.store.name}</span></span>
          <h2>{voucher.fundingSource === 'PLATFORM_FUNDED' ? 'Voucher sàn SCANMS' : 'Voucher gian hàng'}</h2>
          <p>{minimum}</p>
          {percentage && voucher.maximumDiscountAmount !== null && <p>Giảm tối đa {formatMoney(voucher.maximumDiscountAmount)}</p>}
        </div>
      </div>

      <div className="customer-voucher-actions">
        <button type="button" className="customer-voucher-code" data-copied={copied && !expired} disabled={expired} onClick={() => { if (voucherExpiryState(voucher.expiresAt) !== 'expired') onCopy(); }}
          aria-label={`Sao chép mã ${voucher.code}`} title={copied ? 'Đã sao chép' : `Sao chép mã ${voucher.code}`}>
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          <span>{voucher.code}</span>
          {copied && <span className="sr-only" role="status">Đã sao chép</span>}
        </button>
        <button type="button" className="customer-voucher-save" disabled={saving || expired} aria-pressed={saved} aria-busy={saving}
          onClick={() => { if (voucherExpiryState(voucher.expiresAt) !== 'expired') onToggleSaved(); }}>
          {saving ? <Loader2 size={14} className="customer-voucher-spinner" aria-hidden="true" /> : saved ? <Check size={14} aria-hidden="true" /> : null}
          <span>{expired ? 'Đã lưu' : saved ? 'Bỏ lưu' : 'Lưu mã'}</span>
        </button>
        {expired ? <button type="button" className="customer-voucher-use" disabled>Đã hết hạn</button> : <Link className="customer-voucher-use" to={`/shop/${voucher.store.slug || voucher.store.id}`}
          onClick={event => { if (voucherExpiryState(voucher.expiresAt) === 'expired') event.preventDefault(); }}>
          <span>Dùng ngay</span><ArrowRight size={14} aria-hidden="true" />
        </Link>}
      </div>

      <details className="customer-voucher-terms">
        <summary aria-label={`Điều kiện mã ${voucher.code}${expiry ? `, hạn dùng ${expiry}` : ''}`}>
          <span className="customer-voucher-terms-label">Điều kiện<ChevronDown size={14} aria-hidden="true" /></span>
          <span className="customer-voucher-expiry"><Clock3 size={12} aria-hidden="true" />
            {expiry ? <span>{expired ? 'Đã hết hạn từ' : 'Dùng trước'} <time dateTime={voucher.expiresAt!}>{expiry}</time></span> : 'Không giới hạn thời gian'}
          </span>
        </summary>
        <dl>
          <div><dt>Gian hàng</dt><dd>{voucher.store.name}</dd></div>
          <div><dt>Áp dụng cho</dt><dd>{voucher.benefitType === 'SHIPPING' ? 'Phí vận chuyển' : 'Tiền hàng'}</dd></div>
          <div><dt>Giá trị đơn</dt><dd>{minimum}</dd></div>
          {expiry && <div><dt>Thời hạn</dt><dd>Voucher {expired ? 'đã ngừng' : 'ngừng'} sử dụng từ thời điểm trên, theo giờ Việt Nam.</dd></div>}
          {voucher.maximumDiscountAmount !== null && <div><dt>Giảm tối đa</dt><dd>{formatMoney(voucher.maximumDiscountAmount)}</dd></div>}
          {voucher.remainingUses !== null && <div><dt>Lượt còn lại</dt><dd>{voucher.remainingUses.toLocaleString('vi-VN')}</dd></div>}
        </dl>
      </details>
    </article>
  );
}
