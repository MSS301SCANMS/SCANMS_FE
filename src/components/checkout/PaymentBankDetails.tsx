import bankNames from '../../utils/paymentBankNames.json';
import { formatMoney } from '../../features/marketplace/marketplaceUtils';

export interface ReceivingAccount {
  bin?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  description?: string | null;
  amount: number;
}

export function PaymentBankDetails({ payment }: { payment: ReceivingAccount }) {
  const bankName = payment.bin ? (bankNames as Record<string, string>)[payment.bin] || payment.bin : null;
  return <div className="bg-[#FAF8F5] rounded-xl p-3 text-xs text-left space-y-1 font-mono text-[#1A1612]">
    {bankName && <div><strong>Ngân hàng:</strong> {bankName}</div>}
    {payment.accountNumber && <div><strong>Số tài khoản:</strong> {payment.accountNumber}</div>}
    {payment.accountName && <div><strong>Chủ tài khoản:</strong> {payment.accountName}</div>}
    <div><strong>Số tiền:</strong> {formatMoney(payment.amount)}</div>
    {payment.description && <div><strong>Nội dung:</strong> {payment.description}</div>}
    {(!payment.accountNumber || !payment.accountName) && <p className="pt-2 font-sans text-[#7D715E]">Thông tin tài khoản của link này chưa được lưu. Quét QR để ứng dụng ngân hàng hiển thị người nhận; kiểm tra trước khi xác nhận chuyển khoản.</p>}
  </div>;
}
