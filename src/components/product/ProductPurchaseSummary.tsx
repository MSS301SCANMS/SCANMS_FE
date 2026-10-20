import { CheckCircle2, Package, Ticket } from 'lucide-react';
import './ProductPurchaseSummary.css';

const money = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;
export function ProductPurchaseSummary({ price, originalPrice, fromPrice, stock, variantName, needsVariantChoice, inactive, quantity, voucher }: {
  price: number; originalPrice?: number | null; fromPrice: boolean; stock: number;
  variantName?: string; needsVariantChoice: boolean; inactive: boolean; quantity: number;
  voucher?: { code: string; discount: number; total: number };
}) {
  const discountPercent = originalPrice && originalPrice > price ? Math.round((originalPrice - price) / originalPrice * 100) : 0;
  return <div className="product-purchase-summary" data-product-price-panel>
    <span className="pps-price-label">{fromPrice ? 'Giá từ' : 'Giá bán'}</span>
    <div className="pps-prices">
      <strong className="pps-price">{money(price)}</strong>
      {!!discountPercent && <><del>{money(originalPrice!)}</del><span className="pps-sale">−{discountPercent}%</span></>}
    </div>
    <div className="pps-availability" data-product-availability>
      <p>{needsVariantChoice ? (stock > 0 ? 'Chọn phân loại để xem số lượng có sẵn.' : 'Các phân loại hiện đã hết hàng.')
        : `${variantName ? `${variantName} · ` : ''}${stock.toLocaleString('vi-VN')} sản phẩm có sẵn`}</p>
      <span className="pps-stock" role="status" aria-live="polite">
        {stock > 0 && !inactive ? <CheckCircle2 size={13} className="pps-stock-tick" /> : <Package size={13} />}
        {inactive ? 'Tạm ngừng kinh doanh' : stock > 0 ? 'Còn hàng' : 'Tạm hết hàng'}
      </span>
    </div>
    {voucher && <div className="pps-voucher" data-product-voucher-total aria-live="polite">
      <div><span>Tạm tính sau voucher · {quantity} sản phẩm</span><strong>{money(voucher.total)}</strong></div>
      <p><Ticket size={13} /><span>{voucher.code} · Giảm {money(voucher.discount)}</span></p>
      <small>Ưu đãi được kiểm tra lại khi thanh toán. Chưa gồm phí vận chuyển.</small>
    </div>}
  </div>;
}
