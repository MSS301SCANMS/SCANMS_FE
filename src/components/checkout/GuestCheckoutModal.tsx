import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Truck,
  QrCode,
  ShieldCheck,
  Tag,
  Loader2,
  Store as StoreIcon,
} from 'lucide-react';
import api from '../../services/api';

export interface ProductVariantItem {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  price?: number | string | null;
  stockQuantity: number;
  isActive?: boolean;
}

export interface CheckoutProductItem {
  id: string;
  title: string;
  sku?: string;
  price: number | string;
  originalPrice?: number | string;
  imageUrl?: string;
  stockQuantity: number;
  variants?: ProductVariantItem[];
}

export interface CheckoutStoreInfo {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
}

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CheckoutProductItem;
  store: CheckoutStoreInfo;
  initialQuantity?: number;
  initialCouponCode?: string;
  onOrderPlaced?: (orderData: any) => void;
}

export const GuestCheckoutModal: React.FC<GuestCheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  store,
  initialQuantity = 1,
  initialCouponCode = '',
  onOrderPlaced,
}) => {

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [quantity, setQuantity] = useState(initialQuantity);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VIETQR'>('COD');
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    undefined,
  );


  const [couponCode, setCouponCode] = useState(initialCouponCode);
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountType: string;
  } | null>(null);
  const [couponMessage, setCouponMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);


  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    publicOrderCode: string;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    vietqr?: {
      bankCode: string;
      accountNumber: string;
      accountName: string;
      amount: number;
      memo: string;
      qrUrl: string;
    };
    cancellationToken?: string;
  } | null>(null);


  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);


  useEffect(() => {
    if (isOpen) {

      const newKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setIdempotencyKey(newKey);


      if (product.variants && product.variants.length > 0) {
        const available =
          product.variants.find((v) => v.stockQuantity > 0) ||
          product.variants[0];
        setSelectedVariantId(available?.id);
        setQuantity(1);
      } else {
        setSelectedVariantId(undefined);
        setQuantity(
          Math.max(1, Math.min(initialQuantity, product.stockQuantity || 1)),
        );
      }

      setOrderSuccess(null);
      setErrorMessage(null);
      if (initialCouponCode) {
        setCouponCode(initialCouponCode);
      }
    }
  }, [isOpen, initialQuantity, product.stockQuantity, product.variants, initialCouponCode]);

  if (!isOpen) return null;

  const selectedVariant = product.variants?.find(
    (v) => v.id === selectedVariantId,
  );
  const currentPrice =
    selectedVariant?.price !== undefined && selectedVariant?.price !== null
      ? Number(selectedVariant.price)
      : Number(product.price) || 0;
  const currentStock = selectedVariant
    ? selectedVariant.stockQuantity
    : product.stockQuantity || 0;

  const unitPrice = currentPrice;
  const subtotal = unitPrice * quantity;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);



  const isPhoneValid = (phone: string) => {
    const clean = phone.trim().replace(/[()\s-]/g, '');
    return /^(0|\+84)[35789]\d{8}$/.test(clean);
  };


  const handleValidateCoupon = async () => {
    const codeToTest = couponCode.trim().toUpperCase();
    if (!codeToTest) {
      setCouponMessage({ type: 'error', text: 'Vui lòng nhập mã giảm giá' });
      return;
    }

    setCouponLoading(true);
    setCouponMessage(null);

    try {
      const res = await api.post('/coupons/validate', {
        code: codeToTest,
        storeId: store.id,
        customerPhone: customerPhone.trim() || undefined,
        items: [
          {
            productId: product.id,
            quantity,
          },
        ],
      });

      const data = res.data;
      if (data && (data.discountAmount !== undefined || data.appliedDiscountAmount !== undefined)) {
        const discount = Number(data.discountAmount || data.appliedDiscountAmount || 0);
        setAppliedCoupon({
          code: codeToTest,
          discountAmount: discount,
          discountType: data.discountType || 'PERCENTAGE',
        });
        setCouponMessage({
          type: 'success',
          text: `Áp dụng thành công! Tiết kiệm ${discount.toLocaleString('vi-VN')} ₫`,
        });
      } else {
        setCouponMessage({
          type: 'error',
          text: 'Mã giảm giá không hợp lệ cho sản phẩm này.',
        });
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Mã không hợp lệ, đã hết lượt dùng hoặc hết hạn áp dụng.';
      setAppliedCoupon(null);
      setCouponMessage({ type: 'error', text: msg });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
  };


  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);


    const trimmedName = customerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Họ và tên người nhận phải có ít nhất 2 ký tự.');
      return;
    }


    if (!isPhoneValid(customerPhone)) {
      setErrorMessage(
        'Số điện thoại không hợp lệ. Vui lòng nhập 10 số (bắt đầu bằng 03, 05, 07, 08, 09).',
      );
      return;
    }


    const trimmedAddress = shippingAddress.trim();
    if (!trimmedAddress || trimmedAddress.length < 5) {
      setErrorMessage('Địa chỉ giao hàng phải chi tiết ít nhất 5 ký tự.');
      return;
    }


    if (quantity > currentStock) {
      setErrorMessage(
        `Số lượng đặt (${quantity}) vượt quá tồn kho hiện có (${currentStock}).`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        storeId: store.id,
        customerName: trimmedName,
        customerPhone: customerPhone.trim(),
        shippingAddress: trimmedAddress,
        orderNotes: orderNotes.trim() || undefined,
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : couponCode.trim() || undefined,
        idempotencyKey,
        items: [
          {
            productId: product.id,
            variantId: selectedVariantId || undefined,
            quantity,
          },
        ],
      };


      const res = await api.post('/orders', payload);
      const resData = res.data;

      const orderResult = {
        orderId: resData.orderId || resData.order?.id,
        publicOrderCode: resData.publicOrderCode || resData.order?.externalOrderSn,
        totalAmount: resData.finalAmount !== undefined ? resData.finalAmount : resData.order?.finalAmount,
        paymentMethod: resData.paymentMethod || paymentMethod,
        paymentStatus: resData.paymentStatus || (paymentMethod === 'VIETQR' ? 'WAITING_PAYMENT' : 'UNPAID'),
        vietqr: resData.vietqr,
        cancellationToken: resData.cancellationToken || resData.order?.cancellationToken,
      };

      setOrderSuccess(orderResult);
      if (onOrderPlaced) {
        onOrderPlaced(orderResult);
      }
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        'Không thể hoàn tất đặt hàng lúc này. Vui lòng kiểm tra lại thông tin và thử lại.';
      setErrorMessage(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'token') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-checkout-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-[#FFFFFF] rounded-3xl max-w-xl w-full p-5 sm:p-7 border border-[#EAE4D7] shadow-2xl relative max-h-[92vh] overflow-y-auto font-sans">

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
          className="absolute top-4 right-4 text-[#7D715E] hover:text-[#1A1612] p-1.5 rounded-full hover:bg-[#F3EFE6] transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {orderSuccess ? (

          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#FBF5EB] border-2 border-[#C59B58] text-[#C59B58] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 id="guest-checkout-title" className="text-2xl font-black text-[#1A1612] mb-1">
              Đặt Hàng Thành Công!
            </h2>
            <p className="text-xs text-[#7D715E] mb-5 max-w-md mx-auto">
              Đơn hàng của bạn đã được ghi nhận vào hệ thống SCANMS và thông báo tới gian hàng{' '}
              <strong className="text-[#1A1612]">{store.name}</strong> để đóng gói.
            </p>


            <div className="bg-[#FAF8F5] border border-[#EEDFC6] rounded-2xl p-4 text-left space-y-3 mb-5">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#EAE4D7]">
                <div>
                  <div className="text-[11px] text-[#7D715E] font-medium">MÃ ĐƠN HÀNG CÔNG KHAI</div>
                  <div className="text-base font-black text-[#1A1612] font-mono tracking-wider">
                    {orderSuccess.publicOrderCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(orderSuccess.publicOrderCode, 'code')}
                  className="px-2.5 py-1.5 bg-[#F3EFE6] hover:bg-[#EAE4D7] text-[#1A1612] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Sao chép mã đơn hàng"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#B88E4F]" />}
                  <span>{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>


              {orderSuccess.cancellationToken && (
                <div className="bg-[#FBF5EB] border border-[#EEDFC6] rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-[#B88E4F]">
                        MÃ BẢO MẬT HỦY / TRA CỨU ĐƠN (GUEST TOKEN)
                      </div>
                      <div className="font-mono text-[11px] text-[#1A1612] truncate mt-0.5" title={orderSuccess.cancellationToken}>
                        {orderSuccess.cancellationToken}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(orderSuccess.cancellationToken!, 'token')}
                      className="shrink-0 px-2 py-1 bg-white border border-[#EEDFC6] hover:bg-[#FAF8F5] text-[#1A1612] rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedToken ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#B88E4F]" />}
                      <span>{copiedToken ? 'Đã chép' : 'Chép mã'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-[#7D715E] mt-1.5 leading-relaxed">
                    💡 Khách vãng lai không cần tài khoản: Lưu mã này cùng số điện thoại để tra cứu chi tiết hoặc hủy đơn khi cần.
                  </p>
                </div>
              )}


              <div className="text-xs space-y-1.5 pt-1">
                <div className="flex justify-between text-[#7D715E]">
                  <span>Sản phẩm:</span>
                  <span className="font-semibold text-[#1A1612] text-right">
                    {product.title} (x{quantity})
                  </span>
                </div>
                <div className="flex justify-between text-[#7D715E]">
                  <span>Người nhận:</span>
                  <span className="font-medium text-[#1A1612]">{customerName}</span>
                </div>
                <div className="flex justify-between text-[#7D715E]">
                  <span>Số điện thoại:</span>
                  <span className="font-mono text-[#1A1612]">
                    {customerPhone.replace(/^(\d{3})\d+(\d{3})$/, '$1****$2')}
                  </span>
                </div>
                <div className="flex justify-between text-[#7D715E]">
                  <span>Tổng thanh toán:</span>
                  <span className="font-black text-[#B88E4F] text-sm">
                    {Number(orderSuccess.totalAmount).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex justify-between text-[#7D715E]">
                  <span>Hình thức:</span>
                  <span className="font-semibold text-[#1A1612]">
                    {orderSuccess.paymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR 24/7' : 'Thanh toán COD khi nhận hàng'}
                  </span>
                </div>
              </div>
            </div>


            {orderSuccess.paymentMethod === 'VIETQR' && orderSuccess.vietqr && (
              <div className="bg-[#FFFFFF] border-2 border-[#C59B58] rounded-2xl p-4 text-center mb-5 shadow-sm">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FBF5EB] rounded-full text-xs font-bold text-[#B88E4F] mb-3">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QUÉT MÃ VIETQR ĐỂ HOÀN TẤT THANH TOÁN</span>
                </div>

                <div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl border border-[#EAE4D7] shadow-inner mb-3 flex items-center justify-center">
                  <img
                    src={orderSuccess.vietqr.qrUrl}
                    alt="VietQR Chuyển khoản"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="bg-[#FAF8F5] rounded-xl p-3 text-xs text-left space-y-1 font-mono text-[#1A1612]">
                  <div><strong>Ngân hàng:</strong> {orderSuccess.vietqr.bankCode} (Quân Đội - MBBank)</div>
                  <div><strong>Số tài khoản:</strong> {orderSuccess.vietqr.accountNumber}</div>
                  <div><strong>Chủ tài khoản:</strong> {orderSuccess.vietqr.accountName}</div>
                  <div><strong>Số tiền:</strong> {orderSuccess.vietqr.amount.toLocaleString('vi-VN')} ₫</div>
                  <div><strong>Nội dung CK:</strong> <span className="font-black text-[#B88E4F]">{orderSuccess.vietqr.memo}</span></div>
                </div>
                <p className="text-[11px] text-[#7D715E] mt-2">
                  ⚠️ Sau khi chuyển khoản, đơn hàng sẽ được đối soát tự động và chuyển sang trạng thái chuẩn bị hàng.
                </p>
              </div>
            )}


            <div className="flex flex-col gap-2">
              <Link
                to={`/tracking?orderSn=${encodeURIComponent(orderSuccess.publicOrderCode)}`}
                className="w-full py-3 bg-[#C59B58] hover:bg-[#B88E4F] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Truck className="w-4 h-4" />
                <span>Theo dõi tiến trình đơn hàng</span>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 border border-[#EAE4D7] bg-white hover:bg-[#F3EFE6] text-[#1A1612] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        ) : (

          <div>

            <div className="mb-5">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[10px] font-bold text-[#B88E4F] uppercase tracking-wider mb-1.5">
                <ShoppingBag className="w-3 h-3" />
                <span>GUEST CHECKOUT • ĐẶT HÀNG SIÊU TỐC</span>
              </div>
              <h2 id="guest-checkout-title" className="text-xl sm:text-2xl font-black text-[#1A1612]">
                Thông Tin Giao Hàng
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#7D715E] mt-1">
                <span>Gian hàng:</span>
                <span className="font-bold text-[#1A1612] inline-flex items-center gap-1">
                  <StoreIcon className="w-3.5 h-3.5 text-[#B88E4F]" />
                  {store.name}
                </span>
                <span>•</span>
                <span className="text-[#B88E4F] font-semibold">Không bắt buộc tạo tài khoản</span>
              </div>
            </div>


            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}


            <div className="mb-3.5 p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#F3EFE6] border border-[#EAE4D7] overflow-hidden shrink-0">
                <img
                  src={product.imageUrl || '/assets/product-placeholder.svg'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/product-placeholder.svg';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-[#1A1612] line-clamp-1">{product.title}</h3>
                {selectedVariant && (
                  <div className="text-[11px] font-semibold text-[#B88E4F]">
                    Phân loại: {selectedVariant.name}
                  </div>
                )}
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-sm font-black text-[#B88E4F]">
                    {unitPrice.toLocaleString('vi-VN')} ₫
                  </span>
                  {product.originalPrice && Number(product.originalPrice) > unitPrice && (
                    <span className="text-[10px] text-[#7D715E] line-through">
                      {Number(product.originalPrice).toLocaleString('vi-VN')} ₫
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#7D715E] mt-0.5">
                  Kho hàng: <span className="font-semibold text-[#1A1612]">{currentStock} sản phẩm</span>
                </div>
              </div>


              <div className="flex items-center border border-[#EAE4D7] rounded-xl bg-white overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] disabled:opacity-30 cursor-pointer font-bold"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-black text-[#1A1612]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(currentStock, prev + 1))}
                  disabled={quantity >= currentStock}
                  className="w-8 h-8 flex items-center justify-center text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] disabled:opacity-30 cursor-pointer font-bold"
                >
                  +
                </button>
              </div>
            </div>


            {product.variants && product.variants.length > 0 && (
              <div className="mb-4 p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#1A1612]">
                    Chọn phân loại / Phiên bản <span className="text-[#DC2626]">*</span>
                  </label>
                  <span className="text-[10px] text-[#7D715E]">
                    {product.variants.length} lựa chọn
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariantId === v.id;
                    const isOutOfStock = v.stockQuantity <= 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          if (!isOutOfStock) {
                            setSelectedVariantId(v.id);
                            setQuantity(1);
                          }
                        }}
                        disabled={isOutOfStock}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FBF5EB] border-[#B88E4F] ring-2 ring-[#B88E4F]/20 text-[#1A1612] font-bold shadow-xs'
                            : isOutOfStock
                            ? 'bg-[#F3EFE6]/50 border-[#EAE4D7] text-[#7D715E]/50 opacity-50 cursor-not-allowed'
                            : 'bg-white border-[#EAE4D7] text-[#1A1612] hover:border-[#B88E4F]/60'
                        }`}
                      >
                        <div className="font-semibold line-clamp-1">{v.name}</div>
                        <div className="text-[11px] text-[#B88E4F] font-black mt-0.5">
                          {(v.price !== undefined && v.price !== null
                            ? Number(v.price)
                            : Number(product.price) || 0
                          ).toLocaleString('vi-VN')}{' '}
                          ₫
                        </div>
                        <div className="text-[10px] text-[#7D715E] mt-0.5">
                          {isOutOfStock ? 'Hết hàng' : `Còn ${v.stockQuantity}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}


            <form onSubmit={handleSubmitOrder} className="space-y-3.5">


              <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1">
                  Họ và tên người nhận <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Minh Tuấn"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:bg-white focus:outline-hidden focus:border-[#C59B58] transition"
                />
              </div>


              <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1">
                  Số điện thoại nhận hàng <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0987654321"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-[#FAF8F5] border rounded-xl text-xs text-[#1A1612] focus:bg-white focus:outline-hidden transition font-mono ${
                    customerPhone && !isPhoneValid(customerPhone)
                      ? 'border-[#DC2626] focus:border-[#DC2626]'
                      : 'border-[#EAE4D7] focus:border-[#C59B58]'
                  }`}
                />
                {customerPhone && !isPhoneValid(customerPhone) && (
                  <span className="text-[10px] text-[#DC2626] mt-1 block">
                    Số điện thoại chưa đúng định dạng Việt Nam (10 chữ số bắt đầu bằng 03, 05, 07, 08, 09).
                  </span>
                )}
              </div>


              <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1">
                  Địa chỉ nhận hàng chi tiết <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:bg-white focus:outline-hidden focus:border-[#C59B58] transition resize-none"
                />
              </div>


              <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1">
                  Mã giảm giá KOL / Shop (Tùy chọn)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#B88E4F] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Nhập mã coupon (VD: THANGVIP10)"
                      value={couponCode}
                      disabled={!!appliedCoupon}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponMessage(null);
                      }}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] disabled:bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] uppercase font-bold focus:bg-white focus:outline-hidden focus:border-[#C59B58] transition"
                    />
                  </div>

                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-3 py-2 bg-[#F3EFE6] hover:bg-[#EAE4D7] text-[#DC2626] font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Bỏ mã
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!couponCode.trim() || couponLoading}
                      onClick={handleValidateCoupon}
                      className="px-4 py-2 bg-[#F3EFE6] hover:bg-[#C59B58] hover:text-white disabled:opacity-50 text-[#1A1612] font-bold text-xs rounded-xl border border-[#EAE4D7] transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Áp dụng'}
                    </button>
                  )}
                </div>

                {couponMessage && (
                  <div
                    className={`mt-1.5 text-[11px] font-semibold flex items-center gap-1 ${
                      couponMessage.type === 'success' ? 'text-emerald-700' : 'text-[#DC2626]'
                    }`}
                  >
                    {couponMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                    <span>{couponMessage.text}</span>
                  </div>
                )}
              </div>


              <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1">
                  Ghi chú cho gian hàng (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:bg-white focus:outline-hidden focus:border-[#C59B58] transition"
                />
              </div>


              <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'border-[#C59B58] bg-[#FBF5EB] text-[#B88E4F] ring-1 ring-[#C59B58]'
                        : 'border-[#EAE4D7] bg-white text-[#7D715E] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="font-extrabold text-[#1A1612]">💵 Thanh toán COD</div>
                    <div className="text-[10px] text-[#7D715E] mt-0.5">Thanh toán tiền mặt khi nhận hàng</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VIETQR')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      paymentMethod === 'VIETQR'
                        ? 'border-[#C59B58] bg-[#FBF5EB] text-[#B88E4F] ring-1 ring-[#C59B58]'
                        : 'border-[#EAE4D7] bg-white text-[#7D715E] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="font-extrabold text-[#1A1612]">📱 Quét mã VietQR</div>
                    <div className="text-[10px] text-[#7D715E] mt-0.5">Chuyển khoản liên ngân hàng 24/7</div>
                  </button>
                </div>
              </div>


              <div className="p-3.5 bg-[#FAF8F5] border border-[#EEDFC6] rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-[#7D715E]">
                  <span>Tiền hàng ({quantity} món):</span>
                  <span className="font-medium text-[#1A1612]">{subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-[#B88E4F] font-semibold">
                    <span>Giảm giá mã ({appliedCoupon.code}):</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                <div className="flex justify-between text-[#7D715E]">
                  <span>Phí vận chuyển:</span>
                  <span className="text-emerald-700 font-bold">Miễn phí (Toàn quốc)</span>
                </div>
                <div className="pt-2 border-t border-[#EAE4D7] flex justify-between items-baseline">
                  <span className="font-bold text-[#1A1612]">Tổng thanh toán:</span>
                  <span className="font-black text-[#B88E4F] text-lg">
                    {finalTotal.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>


              <button
                type="submit"
                disabled={isSubmitting || product.stockQuantity <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A67D3E] disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg shadow-[#C59B58]/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-[#B88E4F]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Đang xử lý đơn hàng...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>XÁC NHẬN ĐẶT HÀNG — {finalTotal.toLocaleString('vi-VN')} ₫</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-3 text-center text-[11px] text-[#7D715E] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Bảo vệ quyền lợi người mua • Kiểm tra hàng trước khi thanh toán</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
