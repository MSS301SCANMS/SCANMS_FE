import { MessageSquare, Pencil, ShoppingBag, ShoppingCart, Store, Truck } from 'lucide-react';
import type { CartItem } from '../../context/CartContext';
import { formatMoney, getSafeProductImageUrl } from '../../utils/marketplace.utils';

export interface CheckoutShopGroup { store: CartItem['store']; items: CartItem[]; subtotal: number }

export function CheckoutItemsSection({ groups, shippingFees, notes, onNotesChange, onChat, onEditCart, onContinueShopping }: {
  groups: CheckoutShopGroup[];
  shippingFees: Record<string, number>;
  notes: string;
  onNotesChange: (value: string) => void;
  onChat: (store: CartItem['store']) => void;
  onEditCart: () => void;
  onContinueShopping: () => void;
}) {
  return (
    <section className="checkout-section checkout-products" aria-labelledby="checkout-products-title">
      <header className="checkout-section-heading">
        <h2 id="checkout-products-title"><ShoppingBag size={19} aria-hidden="true" />Sản phẩm đặt mua</h2>
        <div className="checkout-products-actions">
          <button type="button" onClick={onEditCart}><Pencil size={14} aria-hidden="true" />Sửa giỏ hàng</button>
          <button type="button" onClick={onContinueShopping}><ShoppingCart size={14} aria-hidden="true" />Mua thêm</button>
        </div>
      </header>
      <div className="checkout-product-columns" aria-hidden="true"><span>Sản phẩm</span><span>Đơn giá</span><span>Số lượng</span><span>Thành tiền</span></div>
      {groups.map(group => <section key={group.store.id} className="checkout-shop" aria-label={`Đặt mua tại ${group.store.name}`}>
        <header className="checkout-shop-heading"><span><Store size={16} aria-hidden="true" /><strong>{group.store.name}</strong></span><button type="button" onClick={() => onChat(group.store)}><MessageSquare size={14} aria-hidden="true" />Chat với shop</button></header>
        <div className="checkout-shop-items">{group.items.map(item => <article className="checkout-product-row" key={item.cartItemId}>
          <div className="checkout-product-identity">
            <img src={getSafeProductImageUrl(item.imageUrl, item.title, item.variantName)} alt={item.title} onError={event => {
              if (!event.currentTarget.dataset.hasFallback) { event.currentTarget.dataset.hasFallback = 'true'; event.currentTarget.src = getSafeProductImageUrl(null, item.title); }
            }} />
            <div><h3>{item.title}</h3>{item.variantName && <p>Phân loại: {item.variantName}</p>}</div>
          </div>
          <div className="checkout-product-unit"><span>Đơn giá</span>{formatMoney(item.price)}</div>
          <div className="checkout-product-quantity"><span>Số lượng</span><strong>×{item.quantity}</strong></div>
          <div className="checkout-product-line-total"><span>Thành tiền</span><strong>{formatMoney(item.price * item.quantity)}</strong></div>
        </article>)}</div>
        <footer className="checkout-shop-footer"><span><Truck size={15} aria-hidden="true" />Vận chuyển GHN{shippingFees[group.store.id] !== undefined && <strong>{formatMoney(shippingFees[group.store.id])}</strong>}</span><span>Tiền hàng ({group.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)<strong>{formatMoney(group.subtotal)}</strong></span></footer>
      </section>)}
      <div className="checkout-notes"><label htmlFor="checkout-order-notes">{groups.length > 1 ? 'Lời nhắn cho các gian hàng' : 'Lời nhắn cho shop'}</label><input id="checkout-order-notes" value={notes} onChange={event => onNotesChange(event.target.value)} placeholder="Ghi chú giao hàng, gọi trước khi giao…" />{groups.length > 1 && <p>Lời nhắn này được gửi tới các gian hàng trong đơn.</p>}</div>
    </section>
  );
}
