import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Minus, Plus, RefreshCw, ShoppingBag, Store, Trash2, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import type { CartItem } from '@/types/cart.types';
import { formatMoney, getSafeProductImageUrl } from '@/utils/marketplace.utils';
import './CartDrawer.css';

const isAvailable = (item: CartItem) => item.isActive && item.stockQuantity > 0;

function CartProductRow({ item, selected, onSelect, onQuantity, onVariant, onRemove, onClose }: {
  item: CartItem; selected: boolean; onSelect: () => void;
  onQuantity: (quantity: number) => void; onVariant: (variantId: string) => void;
  onRemove: () => void; onClose: () => void;
}) {
  const available = isAvailable(item);
  const variants = item.availableVariants || [];
  return (
    <article className="scanms-cart-item" data-available={available}>
      <input type="checkbox" className="scanms-cart-check scanms-cart-item__check"
        checked={selected && available} disabled={!available} onChange={onSelect}
        aria-label={`Chọn ${item.title}${item.variantName ? `, ${item.variantName}` : ''}`} />
      <Link to={`/products/${item.productId}`} onClick={onClose} className="scanms-cart-item__image" tabIndex={-1} aria-hidden="true">
        <img key={item.imageUrl} src={getSafeProductImageUrl(item.imageUrl, item.title)} alt=""
          onError={(event) => {
            if (!event.currentTarget.dataset.fallback) {
              event.currentTarget.dataset.fallback = 'true';
              event.currentTarget.src = getSafeProductImageUrl(null, item.title);
            }
          }} />
      </Link>
      <div className="scanms-cart-item__details">
        <div className="scanms-cart-item__heading">
          <h3><Link to={`/products/${item.productId}`} onClick={onClose}>{item.title}</Link></h3>
          <button type="button" className="scanms-cart-icon scanms-cart-item__remove" onClick={onRemove}
            aria-label={`Xóa ${item.title} khỏi giỏ hàng`} title="Xóa sản phẩm"><Trash2 size={16} /></button>
        </div>
        {variants.length > 1 ? (
          <select value={item.variantId || ''} onChange={(event) => onVariant(event.target.value)}
            aria-label={`Tùy chọn của ${item.title}`} className="scanms-cart-variant">
            {!item.variantId && <option value="" disabled>Chọn loại sản phẩm</option>}
            {variants.map((variant) => <option key={variant.id} value={variant.id} disabled={variant.isActive === false || variant.stockQuantity <= 0}>
              {variant.name}{variant.isActive === false ? ' · Ngừng bán' : variant.stockQuantity <= 0 ? ' · Hết hàng' : ''}
            </option>)}
          </select>
        ) : item.variantName ? <p className="scanms-cart-item__variant">{item.variantName}</p> : null}
        {!item.isActive ? <p className="scanms-cart-item__unavailable">Sản phẩm ngừng bán</p>
          : item.stockQuantity <= 0 ? <p className="scanms-cart-item__unavailable">Sản phẩm hết hàng</p>
          : item.stockQuantity <= 3 ? <p className="scanms-cart-item__stock">Chỉ còn {item.stockQuantity} sản phẩm</p> : null}
      </div>
      <div className="scanms-cart-item__bottom">
        <div className="scanms-cart-item__prices">
          <strong>{formatMoney(item.price)}</strong>
          {!!item.originalPrice && item.originalPrice > item.price && <del>{formatMoney(item.originalPrice)}</del>}
        </div>
        <div className="scanms-cart-quantity" role="group" aria-label={`Số lượng ${item.title}`}>
          <button type="button" onClick={() => onQuantity(item.quantity - 1)} disabled={!available || item.quantity <= 1}
            aria-label={`Giảm số lượng ${item.title}`}><Minus size={14} /></button>
          <output aria-live="polite" aria-label={`Số lượng hiện tại: ${item.quantity}`}>{item.quantity}</output>
          <button type="button" onClick={() => onQuantity(item.quantity + 1)} disabled={!available || item.quantity >= item.stockQuantity}
            aria-label={`Tăng số lượng ${item.title}`}><Plus size={14} /></button>
        </div>
      </div>
    </article>
  );
}

export function CartDrawer() {
  const { cart, selectedItemIds, totalCount, isCartOpen, closeCart, groupedByStore,
    updateQuantity, updateVariant, removeItem, toggleSelectItem, toggleSelectStore, toggleSelectAll,
    startCheckout, refreshCartStock, isValidatingStock, isCartSyncing } = useCart();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!isCartOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    titleRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;
  const selectable = cart.filter(isAvailable);
  const selected = selectable.filter((item) => selectedItemIds.includes(item.cartItemId));
  const allSelected = selectable.length > 0 && selectable.every((item) => selectedItemIds.includes(item.cartItemId));
  const selectedCount = selected.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = selected.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return createPortal(
    <dialog ref={dialogRef} className="scanms-cart-dialog" aria-labelledby="scanms-cart-title"
      onCancel={(event) => { event.preventDefault(); closeCart(); }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled])',
        )).filter((element) => element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }}
      onClick={(event) => { if (event.target === event.currentTarget) closeCart(); }}>
      <div className="scanms-cart-panel">
        <header className="scanms-cart-header">
          <div className="scanms-cart-header__identity">
            <span className="scanms-cart-header__icon" aria-hidden="true"><ShoppingBag size={23} strokeWidth={1.7} /></span>
            <div>
              <h2 id="scanms-cart-title" ref={titleRef} tabIndex={-1}>Giỏ hàng của bạn</h2>
              <p>{cart.length ? `${totalCount} sản phẩm · ${groupedByStore.length} gian hàng` : 'Chọn món bạn yêu thích trên SCANMS'}</p>
            </div>
          </div>
          <button type="button" onClick={closeCart} className="scanms-cart-icon scanms-cart-close" aria-label="Đóng giỏ hàng" title="Đóng giỏ hàng (Esc)"><X size={21} /></button>
        </header>

        {cart.length > 0 && <div className="scanms-cart-toolbar">
          <label className="scanms-cart-selection">
            <input type="checkbox" className="scanms-cart-check" checked={allSelected} disabled={!selectable.length}
              ref={(element) => { if (element) element.indeterminate = selected.length > 0 && !allSelected; }}
              onChange={() => toggleSelectAll()} />
            <span>Chọn tất cả</span>
          </label>
          <button type="button" onClick={() => void refreshCartStock()} disabled={isValidatingStock || isCartSyncing}
            className="scanms-cart-refresh" aria-label="Cập nhật giá và tồn kho">
            <RefreshCw size={14} className={isValidatingStock || isCartSyncing ? 'scanms-cart-spin' : ''} aria-hidden="true" />
            <span>{isValidatingStock || isCartSyncing ? 'Đang cập nhật…' : 'Cập nhật'}</span>
          </button>
        </div>}

        <div className="scanms-cart-body">
          {!cart.length ? <div className="scanms-cart-empty">
            <span className="scanms-cart-empty__icon" aria-hidden="true"><ShoppingBag size={36} strokeWidth={1.3} /></span>
            <h3>Giỏ hàng đang trống</h3>
            <p>Thêm sản phẩm yêu thích để chọn mua cùng lúc.</p>
            <button type="button" onClick={closeCart} className="scanms-cart-primary">Tiếp tục mua sắm<ArrowRight size={17} /></button>
          </div> : groupedByStore.map((group) => {
            const groupSelected = group.items.filter((item) => isAvailable(item) && selectedItemIds.includes(item.cartItemId));
            const groupTotal = groupSelected.reduce((sum, item) => sum + item.price * item.quantity, 0);
            return <section key={group.storeId} className="scanms-cart-shop" aria-label={`Gian hàng ${group.storeName}`}>
              <div className="scanms-cart-shop__header">
                <input type="checkbox" className="scanms-cart-check" checked={group.allSelected}
                  aria-label={`Chọn tất cả sản phẩm của ${group.storeName}`} disabled={!group.items.some(isAvailable)}
                  ref={(element) => { if (element) element.indeterminate = group.someSelected; }}
                  onChange={() => toggleSelectStore(group.storeId)} />
                <Link to={`/shops/${group.storeSlug || group.storeId}`} onClick={closeCart} className="scanms-cart-shop__name">
                  <Store size={16} aria-hidden="true" /><span>{group.storeName}</span><ChevronRight size={14} aria-hidden="true" />
                </Link>
                <span className="scanms-cart-shop__count">{group.items.length} mặt hàng</span>
              </div>
              <div className="scanms-cart-shop__items">{group.items.map((item) => <CartProductRow key={item.cartItemId} item={item}
                selected={selectedItemIds.includes(item.cartItemId)} onSelect={() => toggleSelectItem(item.cartItemId)}
                onQuantity={(quantity) => updateQuantity(item.cartItemId, quantity)} onVariant={(variantId) => updateVariant(item.cartItemId, variantId)}
                onRemove={() => removeItem(item.cartItemId)} onClose={closeCart} />)}</div>
              {group.items.length > 1 && <div className="scanms-cart-shop__subtotal"><span>Tiền hàng đã chọn</span><strong>{formatMoney(groupTotal)}</strong></div>}
            </section>;
          })}
        </div>

        {cart.length > 0 && <footer className="scanms-cart-footer">
          <div className="scanms-cart-summary">
            <div><span>Tạm tính tiền hàng</span><small>Đã chọn {selectedCount} sản phẩm</small></div>
            <strong aria-live="polite" aria-atomic="true">{formatMoney(subtotal)}</strong>
          </div>
          <p className="scanms-cart-footer__note">Phí vận chuyển và ưu đãi được tính ở bước thanh toán.</p>
          <button type="button" onClick={() => startCheckout(selected)} disabled={!selected.length || isValidatingStock || isCartSyncing} className="scanms-cart-primary scanms-cart-checkout">
            <span>Thanh toán{selectedCount > 0 ? ` (${selectedCount})` : ''}</span><ArrowRight size={18} />
          </button>
          {!selected.length && <p className="scanms-cart-footer__hint" role="status">Chọn sản phẩm để tiếp tục thanh toán.</p>}
        </footer>}
      </div>
    </dialog>, document.body,
  );
}
