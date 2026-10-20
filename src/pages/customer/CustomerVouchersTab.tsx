import { useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useCustomerVouchers, type CustomerVoucher } from '../../hooks/useCustomerVouchers';
import { toast } from '../../utils/toast';
import { CustomerVoucherCard } from './CustomerVoucherCard';
import './CustomerVouchersTab.css';
import { voucherExpiryState } from '../../utils/voucher-expiry.utils';

export function CustomerVouchersTab() {
  const user = authService.getCurrentUser();
  const { vouchers, expiredVouchers, now, savedIds, loading, error, toggleSaved: toggleInventorySaved } = useCustomerVouchers(user?.role === 'CUSTOMER' ? user.id : undefined);
  const [copiedCode, setCopiedCode] = useState('');
  const [savingId, setSavingId] = useState('');

  const toggleSaved = async (voucher: CustomerVoucher) => {
    setSavingId(voucher.id);
    try {
      await toggleInventorySaved(voucher);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Chưa lưu được voucher. Vui lòng thử lại.');
    } finally {
      setSavingId('');
    }
  };

  const copyCode = async (voucher: CustomerVoucher) => {
    if (voucherExpiryState(voucher.expiresAt) === 'expired') {
      toast.error('Voucher đã hết hạn sử dụng.');
      return;
    }
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopiedCode(voucher.code);
      toast.success(`Đã sao chép mã ${voucher.code}`);
    } catch {
      toast.error('Chưa thể sao chép. Bạn có thể nhập mã khi thanh toán.');
    }
  };

  return (
    <section className="customer-vouchers" aria-label="Kho voucher">
      {loading && <p className="customer-vouchers-message" role="status">Đang tải voucher...</p>}
      {error && <p role="alert" className="customer-vouchers-message customer-vouchers-message--error">Chưa tải được voucher. Vui lòng thử lại sau.</p>}
      {!loading && !error && vouchers.length === 0 && <p className="customer-vouchers-message">Hiện chưa có voucher khả dụng.</p>}
      <div className="customer-vouchers-grid">
        {vouchers.map((voucher) => (
          <CustomerVoucherCard key={voucher.id} voucher={voucher}
            now={now}
            saved={savedIds.includes(voucher.id)} saving={savingId === voucher.id}
            copied={copiedCode === voucher.code}
            onToggleSaved={() => void toggleSaved(voucher)}
            onCopy={() => void copyCode(voucher)} />
        ))}
      </div>
      {expiredVouchers.length > 0 && <details className="customer-vouchers-history">
        <summary>
          <History size={17} aria-hidden="true" />
          <span>Voucher hết hạn</span>
          <span className="customer-vouchers-history-count">{expiredVouchers.length}</span>
          <ChevronDown size={16} className="customer-vouchers-history-chevron" aria-hidden="true" />
        </summary>
        <p className="customer-vouchers-history-note">Các mã bạn đã lưu nhưng đã hết thời hạn sử dụng.</p>
        <div className="customer-vouchers-grid">
          {expiredVouchers.map(voucher => <CustomerVoucherCard key={voucher.id} voucher={voucher} now={now}
            saved saving={false} copied={false} onToggleSaved={() => {}} onCopy={() => {}} />)}
        </div>
      </details>}
    </section>
  );
}
