import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Truck,
  Store,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  ChevronRight,
  LogIn,
  Clock,
} from 'lucide-react';
import type { CheckoutShopGroup } from './CheckoutItemsSection';
import { couponService, type PublicStoreCoupon } from '@/services/coupon.service';
import { collectCheckoutVouchers, checkoutVoucherDisabledReason } from '@/utils/checkout-vouchers';
import { validateCheckoutVoucher } from '@/utils/checkout-voucher-validation';
import type { VoucherSlot } from '@/utils/voucher-intent';
import { formatMoney } from '@/utils/marketplace.utils';
import { authService } from '@/services/auth.service';
import api from '@/services/api';
import type { ShippingDestination } from '@/services/checkout.service';

function formatVoucherRemainingTime(expiresAt?: string | null): { text: string; isUrgent: boolean } {
  if (!expiresAt) return { text: 'Vô thời hạn', isUrgent: false };
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diffMs = exp - now;
  if (diffMs <= 0) return { text: 'Đã hết hạn', isUrgent: false };

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 24) {
    const hours = Math.max(1, diffHours);
    return { text: `Hết hạn sau ${hours} giờ`, isUrgent: true };
  }
  if (diffDays <= 3) {
    return { text: `Còn ${diffDays} ngày`, isUrgent: true };
  }
  const d = new Date(expiresAt);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return { text: `HSD: ${day}.${month}.${year}`, isUrgent: false };
}

export interface AppliedShopVoucher {
  code: string;
  discountAmount: number;
  discountType?: string;
  storeId: string;
  storeName?: string;
}

export interface AppliedPlatformVoucher {
  storeId?: string;
  code: string;
  discountAmount: number;
  benefitType: 'GOODS' | 'SHIPPING';
}

export interface ScanmsCheckoutVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSignIn?: () => void;
  groups: CheckoutShopGroup[];
  shippingFeesByStore: Record<string, number>;
  totalShippingFee: number;
  rawGoodsSubtotal: number;
  customerPhone?: string;
  shippingDestination?: ShippingDestination;

  // Selected state
  appliedShopCoupons: Record<string, AppliedShopVoucher>;
  appliedPlatformCoupon: AppliedPlatformVoucher | null;
  appliedShippingCoupon: AppliedPlatformVoucher | null;

  // Apply callbacks
  onApplyShopCoupon: (storeId: string, voucher: { code: string; discountAmount: number; discountType?: string; storeName?: string }) => void;
  onRemoveShopCoupon: (storeId: string) => void;
  onApplyPlatformCoupon: (voucher: AppliedPlatformVoucher) => void;
  onRemovePlatformCoupon: () => void;
  onApplyShippingCoupon: (voucher: AppliedPlatformVoucher) => void;
  onRemoveShippingCoupon: () => void;
}

export function ScanmsCheckoutVoucherModal({
  isOpen,
  onClose,
  onRequestSignIn,
  groups,
  shippingFeesByStore,
  totalShippingFee,
  rawGoodsSubtotal,
  customerPhone,
  shippingDestination,
  appliedShopCoupons,
  appliedPlatformCoupon,
  appliedShippingCoupon,
  onApplyShopCoupon,
  onRemoveShopCoupon,
  onApplyPlatformCoupon,
  onRemovePlatformCoupon,
  onApplyShippingCoupon,
  onRemoveShippingCoupon,
}: ScanmsCheckoutVoucherModalProps) {
  const [inputCode, setInputCode] = useState('');
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [inputFeedback, setInputFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Available coupons state
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [savedShopCouponsMap, setSavedShopCouponsMap] = useState<Record<string, PublicStoreCoupon[]>>({});
  const [platformCoupons, setPlatformCoupons] = useState<PublicStoreCoupon[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const applyingRef = useRef(false);
  const revisionRef = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState(Date.now);
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLElement>('button, input')?.focus();
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => {
      window.clearInterval(timer);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);
  useEffect(() => {
    revisionRef.current++;
    applyingRef.current = false;
    setIsApplyingCode(false);
    return () => { revisionRef.current++; };
  }, [isOpen, groups, customerPhone, shippingFeesByStore]);

  // Public product-scoped offers are usable immediately; saved codes are optional.
  useEffect(() => {
    if (!isOpen) { setInputFeedback(null); return; }
    let active = true;
    const controller = new AbortController();
    setLoadingCoupons(true);
    setLoadError('');
    setSavedShopCouponsMap({});
    setPlatformCoupons([]);
    const loggedIn = Boolean(authService.getCurrentUser() && localStorage.getItem('token'));
    setIsLoggedIn(loggedIn);
    const errors: string[] = [];
    const fetchAll = async () => {
      const savedPromise = Promise.resolve([] as PublicStoreCoupon[]);
      const publicPromise = Promise.all(groups.map(async group => {
        try {
          const coupons = await couponService.getPublicStoreCoupons(group.store.id);
          return { storeId: group.store.id, coupons: coupons.map(c => ({ ...c, storeId: group.store.id })) };
        } catch {
          return { storeId: group.store.id, coupons: [] };
        }
      }));
      const platformPromise = couponService.getPublicPlatformCoupons(undefined, controller.signal)
        .then((vouchers) => vouchers.map(v => ({
          ...v,
          fundingSource: 'PLATFORM_FUNDED',
          scopeType: 'STORE_WIDE',
          products: [],
          categories: [],
          storeName: 'Sàn SCANMS',
        } as unknown as PublicStoreCoupon)))
        .catch(() => [] as PublicStoreCoupon[]);
      const [saved, publicGroups, platform] = await Promise.all([savedPromise, publicPromise, platformPromise]);
      if (!active) return;
      const storeMap: Record<string, PublicStoreCoupon[]> = {};
      for (const group of publicGroups) {
        const productIds = new Set(groups.find(item => item.store.id === group.storeId)?.items.map(item => item.productId));
        // Saved scoped codes remain validated by the server, never estimated locally.
        storeMap[group.storeId] = collectCheckoutVouchers([
          group.coupons.filter(c => c.fundingSource !== 'PLATFORM_FUNDED' && c.benefitType !== 'SHIPPING'),
          saved.filter(c => (c.store?.id || c.storeId) === group.storeId && c.fundingSource !== 'PLATFORM_FUNDED' && c.benefitType !== 'SHIPPING' &&
            (c.scopeType !== 'PRODUCTS' || c.products?.some(product => productIds.has(product.id)))),
        ]);
      }
      setSavedShopCouponsMap(storeMap);
      const storeIds = new Set(groups.map(group => group.store.id));
      setPlatformCoupons(collectCheckoutVouchers([platform, ...publicGroups.map(group => group.coupons)])
        .filter(c => c.fundingSource === 'PLATFORM_FUNDED' || storeIds.has(c.store?.id || c.storeId || '') || publicGroups.some(group => group.coupons.some(item => item.id === c.id))));
      setLoadError([...new Set(errors)].join(' '));
      setLoadingCoupons(false);
    };
    void fetchAll().catch(() => {
      if (active) { setLoadError('Chưa thể tải voucher. Vui lòng thử lại.'); setLoadingCoupons(false); }
    });
    return () => { active = false; controller.abort(); };
  }, [isOpen, groups, reload]);

  const { freeshipVouchers, platformGoodsVouchers } = useMemo(() => ({
    freeshipVouchers: platformCoupons.filter(c => c.benefitType === 'SHIPPING'),
    platformGoodsVouchers: platformCoupons.filter(c => c.fundingSource === 'PLATFORM_FUNDED' && c.benefitType !== 'SHIPPING'),
  }), [platformCoupons]);

  const handleApplyInputCode = async (overrideCode?: string, slot?: VoucherSlot, storeId?: string) => {
    const code = (overrideCode ?? inputCode).trim().toUpperCase();
    if (!code || applyingRef.current) return;
    applyingRef.current = true;
    const revision = revisionRef.current;
    setIsApplyingCode(true);
    setInputFeedback(null);
    try {
      const result = await validateCheckoutVoucher((path, body) => api.post(path, body), {
        code, slot, storeId, groups, shippingFees: shippingFeesByStore,
        shopDiscounts: appliedShopCoupons, customerPhone, shippingDestination,
      });
      if (revision !== revisionRef.current) return;
      if (result.slot === 'SHOP') onApplyShopCoupon(result.storeId, result);
      else if (result.slot === 'PLATFORM') onApplyPlatformCoupon({ ...result, benefitType: 'GOODS' });
      else onApplyShippingCoupon({ ...result, benefitType: 'SHIPPING' });
      setInputFeedback({ type: 'success', text: `Đã áp dụng ${result.code} cho ${result.storeName}: −${formatMoney(result.discountAmount)}` });
      setInputCode('');
    } catch (error: any) {
      if (revision === revisionRef.current) setInputFeedback({ type: 'error', text: error?.message || 'Chưa thể kiểm tra voucher. Vui lòng thử lại.' });
    } finally {
      if (revision === revisionRef.current) { applyingRef.current = false; setIsApplyingCode(false); }
    }
  };

  // Tính tổng số tiền tiết kiệm
  const totalSavings = useMemo(() => {
    let sum = 0;
    for (const voucher of Object.values(appliedShopCoupons)) {
      sum += Number(voucher.discountAmount || 0);
    }
    if (appliedPlatformCoupon) {
      sum += Number(appliedPlatformCoupon.discountAmount || 0);
    }
    if (appliedShippingCoupon) {
      sum += Math.min(totalShippingFee, Number(appliedShippingCoupon.discountAmount || 0));
    }
    return sum;
  }, [appliedShopCoupons, appliedPlatformCoupon, appliedShippingCoupon, totalShippingFee]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="scanms-voucher-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 text-[#1A1612]"
      onClick={onClose}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
        if (event.key !== 'Tab') return;
        const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), a[href], [role="button"][tabindex="0"]') || []);
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
    >
      <div
        className="w-full max-w-2xl bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EAE4D7] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Modal Tinh Gọn (Không văn bản thừa) */}
        <div className="p-4 sm:px-6 sm:py-4 bg-white border-b border-[#EAE4D7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <h2 id="scanms-voucher-modal-title" className="text-base font-bold text-[#1A1612] truncate">
              Chọn SCANMS Voucher
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng chọn voucher"
            className="p-1.5 rounded-lg text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="border-b border-[#EAE4D7] bg-white px-6 py-2 text-xs text-[#7D715E]">Chọn 1 mã giảm tiền hàng từ shop hoặc sàn và 1 mã vận chuyển.</p>
        {/* 2. Ô Nhập Mã Giảm Giá Trực Tiếp */}
        <div className="p-3 sm:px-6 sm:py-3.5 bg-white border-b border-[#EAE4D7] shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="Nhập mã giảm giá của Shop hoặc mã KOL..."
                className="w-full pl-3.5 pr-3 py-2 text-xs sm:text-sm font-bold tracking-wider uppercase bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:bg-white focus:outline-none focus:border-[#C59B58] transition"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleApplyInputCode();
                  }
                }}
              />
            </div>
            <button
              type="button"
              disabled={!inputCode.trim() || isApplyingCode}
              onClick={() => void handleApplyInputCode()}
              className="px-4 py-2 bg-[#C59B58] hover:bg-[#B88E4F] text-[#231D15] text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5"
            >
              {isApplyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Áp Dụng</span>
            </button>
          </div>

          {inputFeedback && (
            <div role="status" aria-live="polite"
              className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                inputFeedback.type === 'success'
                  ? 'bg-[#FBF5EB] text-[#8A642C] border-[#EEDFC6]'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {inputFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <span>{inputFeedback.text}</span>
            </div>
          )}
        </div>

        {/* 3. Danh Sách Thẻ Voucher (Trực quan, không câu chữ giảng giải) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {loadError && <div role="alert" className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#7D715E]">
            {loadError} <button type="button" className="ml-2 font-semibold text-[#B88E4F] underline" onClick={() => setReload(value => value + 1)}>Thử tải lại</button>
          </div>}
          {!loadingCoupons && !platformCoupons.length && !Object.values(savedShopCouponsMap).some(list => list.length) && !loadError &&
            <p className="text-xs text-[#7D715E]">Hiện chưa có voucher phù hợp. Bạn vẫn có thể nhập mã Shop hoặc KOL được chia sẻ.</p>}
          {loadingCoupons ? (
            <div className="py-12 text-center text-xs text-[#7D715E] flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#B88E4F]" />
              <span>Đang tải danh sách voucher phù hợp...</span>
            </div>
          ) : (
            <>
              {/* ============================================================== */}
              {/* NHÓM 1: 🚚 MÃ MIỄN PHÍ VẬN CHUYỂN */}
              {/* ============================================================== */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#B88E4F]" />
                    <h3 className="text-sm font-bold text-[#1A1612]">
                      Mã Miễn Phí Vận Chuyển
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#7D715E]">Chọn tối đa 1 mã</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {freeshipVouchers.map((voucher) => {
                    const isSelected = appliedShippingCoupon?.code === voucher.code;
                    const minAmount = voucher.minimumOrderAmount || 0;
                    const voucherGroup = groups.find(group => group.store.id === (voucher.store?.id || voucher.storeId));
                    const isEligible = !isApplyingCode && !checkoutVoucherDisabledReason(voucher, voucherGroup?.subtotal ?? rawGoodsSubtotal, voucherGroup ? shippingFeesByStore[voucherGroup.store.id] || 0 : totalShippingFee, clock);
                    const lackAmount = minAmount - rawGoodsSubtotal;

                    return (
                      <div
                        key={voucher.id || voucher.code}
                        role="button"
                        aria-pressed={isSelected}
                        aria-disabled={!isEligible && !isSelected}
                        tabIndex={isEligible || isSelected ? 0 : -1}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); }
                        }}
                        onClick={() => {
                          if ((!isEligible && !isSelected) || applyingRef.current) return;
                          if (isSelected) {
                            onRemoveShippingCoupon();
                          } else {
                            void handleApplyInputCode(voucher.code, 'SHIPPING', voucher.store?.id || voucher.storeId);
                          }
                        }}
                        className={`rounded-xl border transition-all flex items-stretch overflow-hidden select-none cursor-pointer ${
                          isSelected
                            ? 'bg-white border-[#C59B58] ring-2 ring-[#C59B58]/20 shadow-xs'
                            : isEligible
                            ? 'bg-white border-[#EAE4D7] hover:border-[#C59B58]'
                            : 'bg-[#FAF8F5] border-[#EAE4D7] opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {/* Cuống vé Freeship */}
                        <div className="w-24 bg-[#F3EFE6] border-r border-dashed border-[#EEDFC6] p-3 flex flex-col items-center justify-center text-center shrink-0">
                          <Truck className="w-5 h-5 mb-1 text-[#B88E4F]" />
                          <span className="text-[10px] font-bold text-[#B88E4F] uppercase">FREESHIP</span>
                        </div>

                        {/* Thân vé */}
                        <div className="flex-1 p-3 flex items-center justify-between gap-3 min-w-0 pl-3.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-[#1A1612]">
                                Giảm tối đa {formatMoney(Number(voucher.discountValue) || 0)}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-[#8A642C] bg-[#FBF5EB] border border-[#EEDFC6] px-1.5 py-0.2 rounded">
                                {voucher.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#7D715E] mt-0.5">
                              Đơn tối thiểu {formatMoney(minAmount)}
                            </p>
                            {/* Thời gian còn lại / HSD */}
                            {(() => {
                              const expiry = formatVoucherRemainingTime(voucher.expiresAt);
                              return (
                                <div className="flex items-center gap-1 mt-1 text-[10px]">
                                  <Clock size={11} className={expiry.isUrgent ? 'text-[#D97706]' : 'text-[#7D715E]'} />
                                  <span className={expiry.isUrgent ? 'font-bold text-[#D97706]' : 'text-[#7D715E]'}>
                                    {expiry.text}
                                  </span>
                                </div>
                              );
                            })()}
                            {!isEligible && totalShippingFee > 0 && lackAmount > 0 ? (
                              <p className="text-[10.5px] font-semibold text-rose-600 mt-0.5">
                                Mua thêm {formatMoney(lackAmount)} để dùng được mã này
                              </p>
                            ) : totalShippingFee <= 0 ? (
                              <p className="text-[10.5px] text-[#7D715E] mt-0.5 italic">
                                Đơn chưa có phí vận chuyển
                              </p>
                            ) : null}
                          </div>

                          <div className="shrink-0 pr-1">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-[#C59B58] bg-[#C59B58] text-[#231D15]'
                                  : 'border-[#EAE4D7] bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================== */}
              {/* NHÓM 2: 🎟️ MÃ GIẢM GIÁ TOÀN SÀN */}
              {/* ============================================================== */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#B88E4F]" />
                    <h3 className="text-sm font-bold text-[#1A1612]">
                      Mã Giảm Giá Sàn
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#7D715E]">Chọn tối đa 1 mã</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {platformGoodsVouchers.map((voucher) => {
                    const isSelected = appliedPlatformCoupon?.code === voucher.code;
                    const minAmount = voucher.minimumOrderAmount || 0;
                    const voucherGroup = groups.find(group => group.store.id === (voucher.store?.id || voucher.storeId));
                    const isEligible = !isApplyingCode && !checkoutVoucherDisabledReason(voucher, voucherGroup?.subtotal ?? rawGoodsSubtotal, totalShippingFee, clock);
                    const lackAmount = minAmount - rawGoodsSubtotal;
                    const isPercent = voucher.discountType === 'PERCENTAGE';

                    return (
                      <div
                        key={voucher.id || voucher.code}
                        role="button"
                        aria-pressed={isSelected}
                        aria-disabled={!isEligible && !isSelected}
                        tabIndex={isEligible || isSelected ? 0 : -1}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); }
                        }}
                        onClick={() => {
                          if ((!isEligible && !isSelected) || applyingRef.current) return;
                          if (isSelected) {
                            onRemovePlatformCoupon();
                          } else {
                            void handleApplyInputCode(voucher.code, 'PLATFORM', voucher.store?.id || voucher.storeId);
                          }
                        }}
                        className={`rounded-xl border transition-all flex items-stretch overflow-hidden select-none cursor-pointer ${
                          isSelected
                            ? 'bg-white border-[#C59B58] ring-2 ring-[#C59B58]/20 shadow-xs'
                            : isEligible
                            ? 'bg-white border-[#EAE4D7] hover:border-[#C59B58]'
                            : 'bg-[#FAF8F5] border-[#EAE4D7] opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="w-24 bg-[#F3EFE6] border-r border-dashed border-[#EEDFC6] p-3 flex flex-col items-center justify-center text-center shrink-0">
                          <Ticket className="w-5 h-5 mb-1 text-[#B88E4F]" />
                          <span className="text-[10px] font-bold text-[#B88E4F] uppercase">SCANMS DEAL</span>
                        </div>

                        <div className="flex-1 p-3 flex items-center justify-between gap-3 min-w-0 pl-3.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-[#1A1612]">
                                Giảm {isPercent ? `${voucher.discountValue}%` : formatMoney(Number(voucher.discountValue))}
                                {voucher.maximumDiscountAmount ? ` (Tối đa ${formatMoney(voucher.maximumDiscountAmount)})` : ''}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-[#B88E4F] bg-[#FBF5EB] border border-[#EEDFC6] px-1.5 py-0.2 rounded">
                                {voucher.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#7D715E] mt-0.5">
                              Đơn tối thiểu {formatMoney(minAmount)}
                            </p>
                            {/* Thời gian còn lại / HSD */}
                            {(() => {
                              const expiry = formatVoucherRemainingTime(voucher.expiresAt);
                              return (
                                <div className="flex items-center gap-1 mt-1 text-[10px]">
                                  <Clock size={11} className={expiry.isUrgent ? 'text-[#D97706]' : 'text-[#7D715E]'} />
                                  <span className={expiry.isUrgent ? 'font-bold text-[#D97706]' : 'text-[#7D715E]'}>
                                    {expiry.text}
                                  </span>
                                </div>
                              );
                            })()}
                            {!isEligible && lackAmount > 0 && (
                              <p className="text-[10.5px] font-semibold text-rose-600 mt-0.5">
                                Mua thêm {formatMoney(lackAmount)} để dùng được mã này
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 pr-1">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-[#C59B58] bg-[#C59B58] text-[#231D15]'
                                  : 'border-[#EAE4D7] bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================== */}
              {/* NHÓM 3: Mã công khai đúng sản phẩm, mã đã lưu và mã đang áp dụng */}
              {/* ============================================================== */}
              <div className="space-y-4 pt-2 border-t border-[#EAE4D7]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-[#C59B58]" />
                    <h3 className="text-sm font-bold text-[#1A1612]">
                      Mã Giảm Giá Gian Hàng
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#7D715E]">Áp dụng ngay, không cần lưu</span>
                </div>

                {/* Danh sách shop trong giỏ hàng */}
                {groups.map((group) => {
                  const storeId = group.store.id;
                  const storeName = group.store.name || 'Gian hàng đối tác';
                  const savedForThisStore = savedShopCouponsMap[storeId] || [];
                  const appliedForThisStore = appliedShopCoupons[storeId];

                  // Hỗ trợ hiển thị mã đã áp dụng (ví dụ: mã độc quyền KOL từ link hoặc tự gõ tay)
                  const displayVouchers = [...savedForThisStore];
                  if (appliedForThisStore && !displayVouchers.some((v) => v.code === appliedForThisStore.code)) {
                    displayVouchers.unshift({
                      id: `applied-${appliedForThisStore.code}`,
                      code: appliedForThisStore.code,
                      discountType: 'FIXED_AMOUNT',
                      discountValue: appliedForThisStore.discountAmount,
                      minimumOrderAmount: 0,
                      maximumDiscountAmount: appliedForThisStore.discountAmount,
                      remainingUses: 1,
                      expiresAt: null,
                      scopeType: 'STORE_WIDE',
                      products: [],
                      categories: [],
                      storeName,
                      benefitType: 'GOODS',
                      fundingSource: 'SHOP_FUNDED',
                      description: 'Mã ưu đãi độc quyền từ Creator / KOL',
                    } as any);
                  }

                  return (
                    <div
                      key={storeId}
                      className="rounded-xl border border-[#EAE4D7] bg-white p-3.5 space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-[#F3EFE6] pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Store size={15} className="text-[#C59B58] shrink-0" />
                          <h4 className="font-bold text-xs text-[#1A1612] truncate">
                            {storeName}
                          </h4>
                        </div>

                        {appliedForThisStore && (
                          <span className="text-[11px] font-bold text-[#B88E4F] bg-[#FBF5EB] px-2 py-0.5 rounded-md border border-[#EEDFC6]">
                            Đã chọn: {appliedForThisStore.code} (−{formatMoney(appliedForThisStore.discountAmount)})
                          </span>
                        )}
                      </div>

                      {/* Không bắt buộc lưu voucher trước khi áp dụng. */}
                      {displayVouchers.length === 0 ? (
                        <div className="py-2.5 px-3 rounded-lg border border-dashed border-[#EAE4D7] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                          <p className="text-xs text-[#7D715E]">
                            Chưa có voucher phù hợp sản phẩm của <strong>{storeName}</strong>.
                          </p>
                          <Link
                            to={`/shops/${storeId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#B88E4F] hover:underline shrink-0"
                          >
                            <span>Xem ưu đãi Shop</span>
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {displayVouchers.map((voucher) => {
                            const isSelected = appliedForThisStore?.code === voucher.code;
                            const minAmount = voucher.minimumOrderAmount || 0;
                            const isEligible = !isApplyingCode && !checkoutVoucherDisabledReason(voucher, group.subtotal, shippingFeesByStore[storeId] || 0, clock);
                            const lackAmount = minAmount - group.subtotal;
                            const isPercent = voucher.discountType === 'PERCENTAGE';
                            const isCreatorCoupon =
                              voucher.id?.startsWith('applied-') ||
                              voucher.code?.startsWith('KOL') ||
                              voucher.code?.startsWith('PHAN');
                            const expiry = formatVoucherRemainingTime(voucher.expiresAt);

                            return (
                              <div
                                key={voucher.id || voucher.code}
                        role="button"
                        aria-pressed={isSelected}
                        aria-disabled={!isEligible && !isSelected}
                        tabIndex={isEligible || isSelected ? 0 : -1}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); }
                        }}
                                onClick={() => {
                                  if ((!isEligible && !isSelected) || applyingRef.current) return;
                                  if (isSelected) {
                                    onRemoveShopCoupon(storeId);
                                  } else {
                                    void handleApplyInputCode(voucher.code, 'SHOP', storeId);
                                  }
                                }}
                                className={`rounded-lg border p-2.5 flex items-center justify-between gap-3 transition-all select-none cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#FBF5EB] border-[#C59B58] ring-1 ring-[#C59B58]'
                                    : isEligible
                                    ? 'bg-[#FAF8F5] border-[#EAE4D7] hover:border-[#C59B58] hover:bg-white'
                                    : 'bg-[#FAF8F5] border-[#EAE4D7] opacity-60 cursor-not-allowed'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono text-xs font-bold text-[#B88E4F] bg-white border border-[#EEDFC6] px-1.5 py-0.2 rounded">
                                      {voucher.code}
                                    </span>
                                    {isCreatorCoupon && (
                                      <span className="text-[10px] font-bold text-[#8A642C] bg-[#FBF5EB] border border-[#DEBE85] px-1.5 py-0.2 rounded">
                                        Ưu đãi Creator
                                      </span>
                                    )}
                                    <strong className="text-xs text-[#1A1612]">
                                      Giảm {isPercent ? `${voucher.discountValue}%` : formatMoney(Number(voucher.discountValue))}
                                      {voucher.maximumDiscountAmount ? ` (Tối đa ${formatMoney(voucher.maximumDiscountAmount)})` : ''}
                                    </strong>
                                  </div>
                                  <div className="text-[10.5px] text-[#7D715E] mt-0.5">
                                    Đơn từ {formatMoney(minAmount)}
                                    {!isEligible && lackAmount > 0 && (
                                      <span className="text-rose-600 font-semibold ml-2">
                                        (Mua thêm {formatMoney(lackAmount)})
                                      </span>
                                    )}
                                  </div>
                                  {/* Thời gian còn lại / HSD */}
                                  <div className="flex items-center gap-1 mt-1 text-[10px]">
                                    <Clock size={11} className={expiry.isUrgent ? 'text-[#D97706]' : 'text-[#7D715E]'} />
                                    <span className={expiry.isUrgent ? 'font-bold text-[#D97706]' : 'text-[#7D715E]'}>
                                      {expiry.text}
                                    </span>
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  <div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                      isSelected
                                        ? 'border-[#C59B58] bg-[#C59B58] text-[#231D15]'
                                        : 'border-[#EAE4D7] bg-white'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!isLoggedIn && (
                  <div className="rounded-xl border border-dashed border-[#EEDFC6] bg-[#FBF5EB] p-3 text-center flex flex-col sm:flex-row items-center justify-between gap-2 mt-2">
                    <p className="text-xs text-[#7D715E]">
                      Đăng nhập để xem và áp dụng thêm các mã giảm giá bạn đã sưu tập trong Ví.
                    </p>
                    <button
                      type="button"
                      onClick={onRequestSignIn || onClose}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C59B58] hover:bg-[#B88E4F] text-[#231D15] rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      <LogIn size={13} />
                      <span>Đăng nhập</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 4. Footer Tinh Gọn: Tổng Tiết Kiệm & Nút Xác Nhận */}
        <div className="p-4 sm:px-6 bg-white border-t border-[#EAE4D7] flex items-center justify-between gap-4 shrink-0 shadow-sm">
          <div className="min-w-0">
            <span className="text-xs text-[#7D715E] block">Tổng tiết kiệm:</span>
            <span className="text-base sm:text-lg font-bold text-[#B88E4F]">
              {formatMoney(totalSavings)}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-[#231D15] text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            Đồng Ý
          </button>
        </div>
      </div>
    </div>
  );
}
