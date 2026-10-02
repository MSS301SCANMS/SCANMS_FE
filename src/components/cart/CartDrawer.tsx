import React, { useEffect, useRef } from 'react';
import {
  X,
  ShoppingBag,
  Store,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatMoney } from '../../features/marketplace/marketplaceUtils';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    selectedItemIds,
    totalCount,
    selectedCount,
    selectedSubtotal,
    isCartOpen,
    closeCart,
    groupedByStore,
    updateQuantity,
    updateVariant,
    removeItem,
    toggleSelectItem,
    toggleSelectStore,
    toggleSelectAll,
    startCheckout,
    refreshCartStock,
    isValidatingStock,
    isCartSyncing,
    cartSyncedAt,
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const selectableItemsCount = cart.filter((i) => i.isActive && i.stockQuantity > 0).length;
  const isAllSelected = selectableItemsCount > 0 && selectedCount > 0 && selectedItemIds.length >= selectableItemsCount;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeCart}
    >
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#FAF8F5] h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 text-left border-l border-[#EAE4D7]"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#EAE4D7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#1A1612]">
                  Giỏ Hàng SCANMS
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#F3EFE6] text-[#7D715E] text-xs font-bold border border-[#EAE4D7]">
                  {totalCount} món
                </span>
              </div>
              <p className="text-xs text-[#7D715E] mt-0.5">
                {isCartSyncing
                  ? 'Đang đồng bộ giỏ hàng...'
                  : cartSyncedAt
                    ? `Đã đồng bộ lúc ${new Date(cartSyncedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Đồng bộ giỏ hàng trên toàn sàn & đối tác'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Làm Mới / Đồng Bộ Tồn Kho & Giá */}
            <button
              type="button"
              onClick={() => refreshCartStock()}
              disabled={isValidatingStock}
              aria-label="Cập nhật lại giá và tồn kho từ hệ thống"
              title="Cập nhật lại giá & tồn kho từ hệ thống"
              className={`relative group w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all duration-200 cursor-pointer active:scale-95 ${
                isValidatingStock
                  ? 'bg-[#FBF5EB] border-[#C59B58] text-[#B88E4F] ring-2 ring-[#C59B58]/20 shadow-xs'
                  : 'bg-[#FAF8F5] hover:bg-[#FBF5EB] border-[#EAE4D7] hover:border-[#C59B58] text-[#7D715E] hover:text-[#B88E4F] shadow-2xs hover:shadow-xs hover:-translate-y-0.5'
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 transition-transform duration-500 ease-out ${
                  isValidatingStock
                    ? 'animate-spin text-[#B88E4F]'
                    : 'group-hover:rotate-180 group-hover:text-[#B88E4F]'
                }`}
              />
              {isValidatingStock && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C59B58] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B88E4F]"></span>
                </span>
              )}
            </button>

            {/* Nút Đóng Giỏ Hàng */}
            <button
              type="button"
              onClick={closeCart}
              aria-label="Đóng giỏ hàng (Esc)"
              title="Đóng giỏ hàng (Esc)"
              className="group w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FAF8F5] hover:bg-[#FBF5EB] border border-[#EAE4D7] hover:border-[#C59B58] text-[#7D715E] hover:text-[#1A1612] flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
            >
              <X className="w-4.5 h-4.5 group-hover:rotate-90 transition-transform duration-200 ease-out" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#7D715E]">
              <div className="w-20 h-20 rounded-full bg-[#F3EFE6] border border-[#EAE4D7] flex items-center justify-center mb-4 text-[#B88E4F]">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-black text-[#1A1612] mb-1">
                Giỏ hàng của bạn đang trống
              </h3>
              <p className="text-xs sm:text-sm text-[#7D715E] max-w-xs mb-6">
                Chưa có sản phẩm nào được chọn. Hãy khám phá hàng ngàn sản phẩm chính hãng với ưu đãi hấp dẫn từ các Shop!
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="px-6 py-3 rounded-2xl bg-[#EBD08C] hover:bg-[#DEC07A] text-white text-xs font-bold transition shadow-xs"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <>
              {/* Nationwide free shipping notice */}
              <div className="p-3 rounded-2xl bg-[#FBF5EB] border border-[#EAE4D7] flex items-center gap-2.5 text-xs text-[#B88E4F]">
                <Truck className="w-4 h-4 shrink-0" />
                <span className="font-semibold">
                  Miễn phí giao hàng toàn quốc cho tất cả đơn hàng trên sàn SCANMS!
                </span>
              </div>

              {/* Grouped by Store (Requirement 3: Giỏ nhóm sản phẩm theo Shop) */}
              {groupedByStore.map((group) => {
                return (
                  <div
                    key={group.storeId}
                    className="bg-white border border-[#EAE4D7] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5 transition-all"
                  >
                    {/* Store Header with Select-All-For-Store Checkbox */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#EAE4D7]/80">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={group.allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = group.someSelected;
                          }}
                          onChange={() => toggleSelectStore(group.storeId)}
                          className="w-4 h-4 rounded text-[#B88E4F] accent-[#EBD08C] focus:ring-[#C59B58] cursor-pointer"
                        />
                        <div className="flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-[#B88E4F]" />
                          <strong className="text-sm font-bold text-[#1A1612]">
                            {group.storeName}
                          </strong>
                        </div>
                      </label>

                      <span className="text-xs font-semibold text-[#7D715E]">
                        Tạm tính: <strong className="text-[#1A1612]">{formatMoney(group.subtotal)}</strong>
                      </span>
                    </div>

                    {/* Products in this Store */}
                    <div className="space-y-3">
                      {group.items.map((item) => {
                        const isSelected = selectedItemIds.includes(item.cartItemId);
                        const isAvailable = item.isActive && item.stockQuantity > 0;
                        const hasVariants = item.availableVariants && item.availableVariants.length > 1;

                        return (
                          <div
                            key={item.cartItemId}
                            className={`p-3 rounded-2xl border transition-all ${
                              isSelected
                                ? 'bg-[#FBF5EB]/30 border-[#EAE4D7]'
                                : 'bg-[#FAF8F5]/60 border-[#EAE4D7]'
                            } ${!isAvailable ? 'opacity-65' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox per item */}
                              <div className="pt-2">
                                <input
                                  type="checkbox"
                                  disabled={!isAvailable}
                                  checked={isSelected && isAvailable}
                                  onChange={() => toggleSelectItem(item.cartItemId)}
                                  className="w-4 h-4 rounded text-[#B88E4F] accent-[#EBD08C] focus:ring-[#C59B58] cursor-pointer disabled:opacity-40"
                                />
                              </div>

                              {/* Product Image */}
                              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white border border-[#EAE4D7] overflow-hidden shrink-0 relative">
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23F3EFE6'/%3E%3Ctext x='40' y='44' font-size='10' text-anchor='middle' fill='%23B88E4F'%3ESCANMS%3C/text%3E%3C/svg%3E";
                                  }}
                                />
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <h4
                                      className="text-xs sm:text-sm font-bold text-[#1A1612] line-clamp-2 leading-snug"
                                      title={item.title}
                                    >
                                      {item.title}
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => removeItem(item.cartItemId)}
                                      className="p-1 text-[#7D715E] hover:text-red-600 transition cursor-pointer shrink-0"
                                      title="Xóa món này khỏi giỏ"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Variant Selector or Badge */}
                                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                    {hasVariants ? (
                                      <div className="relative inline-block">
                                        <select
                                          value={item.variantId || ''}
                                          onChange={(e) => updateVariant(item.cartItemId, e.target.value)}
                                          className="text-[11px] font-semibold bg-white border border-[#EAE4D7] rounded-lg px-2 py-0.5 text-[#1A1612] hover:border-[#C59B58] focus:outline-none focus:ring-1 focus:ring-[#C59B58] cursor-pointer"
                                        >
                                          {item.availableVariants?.map((v) => (
                                            <option key={v.id} value={v.id}>
                                              {v.name} ({v.stockQuantity > 0 ? `Còn ${v.stockQuantity}` : 'Hết'})
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    ) : item.variantName ? (
                                      <span className="px-2 py-0.5 rounded-md bg-[#F3EFE6] text-[#7D715E] text-[10px] font-semibold border border-[#EAE4D7]">
                                        Phân loại: {item.variantName}
                                      </span>
                                    ) : null}

                                    {/* Out of stock or inactive status warning */}
                                    {!item.isActive ? (
                                      <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">
                                        Ngừng kinh doanh
                                      </span>
                                    ) : item.stockQuantity <= 0 ? (
                                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                        Hết hàng
                                      </span>
                                    ) : item.stockQuantity <= 3 ? (
                                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[10px] font-medium border border-amber-100">
                                        Chỉ còn {item.stockQuantity}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                {/* Price and Quantity Controls */}
                                <div className="mt-2.5 flex items-center justify-between gap-2 pt-1 border-t border-[#EAE4D7]/50">
                                  <div className="flex items-baseline gap-1.5">
                                    <strong className="text-xs sm:text-sm font-black text-[#1A1612]">
                                      {formatMoney(item.price)}
                                    </strong>
                                    {item.originalPrice && item.originalPrice > item.price && (
                                      <span className="text-[10px] text-[#7D715E] line-through">
                                        {formatMoney(item.originalPrice)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Quantity Controls */}
                                  <div className="flex items-center border border-[#EAE4D7] rounded-xl bg-white overflow-hidden shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                      disabled={item.quantity <= 1}
                                      className="p-1 sm:px-2 text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] disabled:opacity-40 transition cursor-pointer"
                                      title="Giảm số lượng"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="px-2.5 text-xs font-bold text-[#1A1612] min-w-[24px] text-center">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                      disabled={item.quantity >= item.stockQuantity}
                                      className="p-1 sm:px-2 text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] disabled:opacity-40 transition cursor-pointer"
                                      title="Tăng số lượng"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-[#EAE4D7] space-y-3.5 shrink-0 shadow-lg">
            {/* Selection bar */}
            <div className="flex items-center justify-between text-xs text-[#7D715E]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => toggleSelectAll()}
                  className="w-4 h-4 rounded text-[#B88E4F] accent-[#EBD08C] focus:ring-[#C59B58] cursor-pointer"
                />
                <span className="font-bold text-[#1A1612]">Chọn tất cả ({cart.length})</span>
              </label>

              <span>
                Đã chọn <strong className="text-[#B88E4F]">{selectedCount}</strong> sản phẩm
              </span>
            </div>

            {/* Total Money */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#7D715E] font-medium">Tổng tiền thanh toán:</span>
              <strong className="text-xl font-black text-[#1A1612]">
                {formatMoney(selectedSubtotal)}
              </strong>
            </div>

            {/* Checkout Action Button */}
            <button
              type="button"
              onClick={() => startCheckout()}
              disabled={selectedCount === 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#EBD08C] hover:bg-[#DEC07A] disabled:bg-[#EAE4D7] disabled:text-[#7D715E] text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-99 disabled:cursor-not-allowed"
            >
              <span>Tiến hành đặt hàng ({selectedCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
