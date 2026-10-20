import { CreditCard, QrCode, Wallet } from 'lucide-react';
import { formatMoney } from '../../utils/marketplace.utils';

export function CheckoutPaymentMethods({ method, onChange, balance, loading, total, payosAvailable }: {
  method: 'WALLET' | 'PAYOS'; onChange: (value: 'WALLET' | 'PAYOS') => void;
  balance: number; loading: boolean; total: number; payosAvailable: boolean | null;
}) {
  return (
    <div className="checkout-payment-methods">
      <header className="checkout-section-heading"><h2 id="checkout-payment-title"><CreditCard size={19} aria-hidden="true" />Phương thức thanh toán</h2></header>
      <fieldset className="checkout-payment-options"><legend className="sr-only">Chọn phương thức thanh toán</legend>
        <label className="checkout-payment-option" data-selected={method === 'WALLET'}><input type="radio" name="paymentMethod" value="WALLET" checked={method === 'WALLET'} onChange={() => onChange('WALLET')} /><span className="checkout-payment-option-icon"><Wallet size={21} aria-hidden="true" /></span><span className="checkout-payment-option-info"><strong>Ví SCANMS</strong><span>Số dư khả dụng: {loading ? 'Đang tải…' : formatMoney(balance)}</span>{!loading && balance < total && <span className="checkout-wallet-insufficient">Cần thêm {formatMoney(total - balance)} để thanh toán bằng ví.</span>}</span></label>
        <label className="checkout-payment-option" data-selected={method === 'PAYOS'}><input type="radio" name="paymentMethod" value="PAYOS" checked={method === 'PAYOS'} onChange={() => onChange('PAYOS')} /><span className="checkout-payment-option-icon"><QrCode size={21} aria-hidden="true" /></span><span className="checkout-payment-option-info"><strong>Chuyển khoản PayOS</strong><span>Quét VietQR bằng ứng dụng ngân hàng. Tự động xác nhận khi nhận đủ tiền.</span></span></label>
      </fieldset>
      {method === 'PAYOS' && payosAvailable === false && <p className="checkout-payment-notice" role="status">Chưa kết nối được PayOS. Vui lòng thử lại sau hoặc chọn Ví SCANMS.</p>}
    </div>
  );
}
