import React, { useState, useEffect, useMemo, useCallback, useRef, useSyncExternalStore } from 'react';
import { getSessionId } from '../../services/auth-session';
import { getProductReferral } from '../../utils/referral-attribution';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckoutOrderConfirmation, type CheckoutOrderResult } from './CheckoutOrderConfirmation';
import { CheckoutItemsSection } from './CheckoutItemsSection';
import { CheckoutVoucherSection } from './CheckoutVoucherSection';
import { CheckoutPaymentMethods } from './CheckoutPaymentMethods';
import { ScanMSLogo } from '../common/ScanMSLogo';
import './CheckoutPage.css';
import {
  ArrowLeft,
  ChevronDown,
  AlertCircle,
  Loader2,
  MapPin,
  Lock,
  LogIn,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
} from 'lucide-react';

function normalizeVietnameseAddress(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\b(thanh pho|tp\.?|tinh|quan|huyen|thi xa|tx\.?|phuong|p\.?|xa|thi tran|tt\.?)\b/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
import api from '../../services/api';
import { authService } from '../../services/auth.service';
import { customerService, type CustomerAddress } from '../../services/customer.service';
import { GoogleOfficialButton } from '../auth/GoogleOfficialButton';
import { toast } from '../../utils/toast';
import { apiCache } from '@/utils/api-cache.utils';
import {
  loadShippingAddresses,
  type ShippingProvince,
} from '../../services/order-address.service';
import { useCart, type CartItem } from '../../context/CartContext';
import { useScanmsChat } from '../../context/ScanmsChatContext';
import { formatMoney, getSafeProductImageUrl } from '@/utils/marketplace.utils';
import { CustomSelect } from '../ui/CustomSelect';
import { resolveSavedShippingAddress, resolveMapShippingAddress } from '@/utils/checkout-address.utils';
import { AddressLocationPicker, type AddressLocationResult } from '../customer/AddressLocationPicker';
import { walletService, type WalletSummary } from '../../services/wallet.service';
import { normalizeOrderVariantId } from '../../utils/order-variant.utils';
import { checkoutService, usesLegacyCheckout } from '../../services/checkout.service';
import { financeService } from '../../services/finance.service';
import { PlatformVoucherPicker, type VoucherSelection } from '../vouchers/PlatformVoucherPicker';
import { quoteVoucherSelection, recommendVoucherSelection } from '../../services/checkout-voucher.service';

const UUID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function readAddressCoordinates(address: CustomerAddress) {
  if (address.latitude == null || address.longitude == null || address.latitude === '' || address.longitude === '') return null;
  const latitude = Number(address.latitude), longitude = Number(address.longitude);
  return Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude) && Math.abs(longitude) <= 180
    ? { latitude, longitude } : null;
}

const normalizeVariantToken = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLocaleLowerCase() : '';

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
  policyReturn?: string;
  policyWarranty?: string;
  policyShipping?: string;
}

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: CheckoutProductItem;
  store?: CheckoutStoreInfo;
  checkoutItems?: CartItem[];
  initialQuantity?: number;
  initialCouponCode?: string;
  initialShippingCouponCode?: string;
  initialVariantId?: string;
  initialLiveSessionId?: string;
  onOrderPlaced?: (orderData: any) => void;
  onPaymentConfirmed?: (orderData: any) => void;
}

function subscribeCheckoutSession(callback: () => void) {
  window.addEventListener('scanms_auth_changed', callback);
  window.addEventListener('auth-user-updated', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('scanms_auth_changed', callback);
    window.removeEventListener('auth-user-updated', callback);
    window.removeEventListener('storage', callback);
  };
}

export const GuestCheckoutModal: React.FC<GuestCheckoutModalProps> = (props) => {
  const session = useSyncExternalStore(subscribeCheckoutSession, getSessionId, () => null);
  // Account changes discard private form state; access-token renewal keeps it.
  return <CheckoutForm key={session || 'guest'} {...props} />;
};

const CheckoutForm: React.FC<GuestCheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  store,
  checkoutItems,
  initialQuantity = 1,
  initialCouponCode = '',
  initialShippingCouponCode = '',
  initialVariantId,
  initialLiveSessionId,
  onOrderPlaced,
  onPaymentConfirmed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { removeItems, editCheckoutCart, continueShoppingFromCheckout } = useCart();
  const { openChat } = useScanmsChat();
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const addressDraftEdited = useRef(false);
  const isSignedIn = Boolean(localStorage.getItem('token') && authService.getCurrentUser());
  const [currentUser, setCurrentUser] = useState<any>(() => authService.getCurrentUser());

  // Cập nhật currentUser khi mở modal
  useEffect(() => {
    if (isOpen) {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
    }
  }, [isOpen]);

  // Khóa cuộn trang nền khi mở giao diện thanh toán toàn màn hình
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Saved addresses are fetched for the authenticated session, never persisted globally.
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState('');

  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const onTokenSuccessInCheckout = async (idToken: string) => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const res: any = await authService.googleLogin(idToken, 'CUSTOMER');
      const user = res?.user || authService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setCustomerName(user.fullName || '');
        setCustomerEmail(user.email || '');
        if (user.phoneNumber) setCustomerPhone(user.phoneNumber);
      }
      toast.success('Đăng nhập thành công! Vui lòng hoàn tất thông tin đặt hàng.');
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || err?.message || 'Đăng nhập Google thất bại');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePasswordLoginInCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError('Vui lòng nhập email hoặc số điện thoại và mật khẩu.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res: any = await authService.login(loginIdentifier.trim(), loginPassword);
      const user = res?.user || authService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setCustomerName(user.fullName || '');
        setCustomerEmail(user.email || '');
        if (user.phoneNumber) setCustomerPhone(user.phoneNumber);
      }
      toast.success('Đăng nhập thành công! Vui lòng hoàn tất thông tin đặt hàng.');
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || err?.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [customerName, setCustomerName] = useState(() => authService.getCurrentUser()?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(() => authService.getCurrentUser()?.phoneNumber || '');

  const [customerEmail, setCustomerEmail] = useState(() => {
    const user = authService.getCurrentUser();
    return user?.email || '';
  });

  const [shippingAddress, setShippingAddress] = useState('');

  const [shippingProvinces, setShippingProvinces] = useState<ShippingProvince[]>([]);
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [shippingFeesByStore, setShippingFeesByStore] = useState<Record<string, number>>({});
  const [shippingQuoteMode, setShippingQuoteMode] = useState<string | null>(null);
  const [shippingFeeError, setShippingFeeError] = useState<string | null>(null);
  const [shippingFeeLoading, setShippingFeeLoading] = useState(false);
  const [shippingQuoteRetry, setShippingQuoteRetry] = useState(0);
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');

  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressLoadRetry, setAddressLoadRetry] = useState(0);
  const [deliveryLocation, setDeliveryLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mappedAddress, setMappedAddress] = useState<AddressLocationResult | null>(null);
  const [mapResetKey, setMapResetKey] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [saveToAddressBook, setSaveToAddressBook] = useState(true);
  const [setAsDefaultAddress, setSetAsDefaultAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(true);
  const [shopPolicies, setShopPolicies] = useState<Record<string, CheckoutStoreInfo>>({});
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);

  // PayOS is selected by default; customers can also choose their SCANMS wallet.
  const [paymentMethod, setPaymentMethod] = useState<'PAYOS' | 'WALLET'>('PAYOS');
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);


  useEffect(() => {
    if (isOpen && isSignedIn) {
      setWalletLoading(true);
      walletService
        .getMyWallet()
        .then((w) => {
          setWallet(w);
        })
        .catch(() => {})
        .finally(() => setWalletLoading(false));
    }
  }, [isOpen, isSignedIn]);

  // Single-product fallback state
  const [singleQuantity] = useState(initialQuantity);
  const [selectedVariantId] = useState<string | undefined>(initialVariantId);

  // Coupons
  const [couponCode, setCouponCode] = useState(initialCouponCode);
  const [voucherTargetStoreId, setVoucherTargetStoreId] = useState('');
  const [platformCouponCode, setPlatformCouponCode] = useState('');
  const [shippingCouponCode, setShippingCouponCode] = useState(initialShippingCouponCode);
  const [appliedPlatformCoupon, setAppliedPlatformCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [appliedShippingCoupon, setAppliedShippingCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [stackedCouponBusy, setStackedCouponBusy] = useState<'GOODS' | 'SHIPPING' | null>(null);
  const [autoCouponDismissed, setAutoCouponDismissed] = useState(false);
  const [showVoucherPicker, setShowVoucherPicker] = useState(false);
  const couponRequest = useRef(0);
  const autoCouponController = useRef<AbortController | null>(null);
  const takeManualVoucherControl = () => {
    couponRequest.current++;
    autoCouponController.current?.abort();
    setAutoCouponDismissed(true);
    setCouponLoading(false);
  };
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    discountType: string;
    shippingDiscountAmount?: number;
  } | null>(null);
  const [couponMessage, setCouponMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Pre-checkout validation state (Requirement 6)
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isValidatingCart, setIsValidatingCart] = useState(false);

  // Submission state
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const revealSubmissionError = useRef(false);
  const [addressValidationField, setAddressValidationField] = useState<'detail' | 'province' | 'district' | 'ward' | null>(null);

  useEffect(() => {
    if (!isOpen || isSubmitting || !errorMessage || !revealSubmissionError.current) return;
    revealSubmissionError.current = false;
    const banner = document.getElementById('checkout-error');
    banner?.scrollIntoView({ block: 'center' });
    banner?.focus({ preventScroll: true });
  }, [isOpen, isSubmitting, errorMessage]);

  const markAddressEdited = (clearLocation = false) => {
    addressDraftEdited.current = true;
    setSelectedSavedAddressId('');
    // Keep the address form open while the customer is filling its levels.
    setIsEditingAddress(true);
    if (clearLocation) {
      setDeliveryLocation(null);
      setMappedAddress(null);
      setMapResetKey(value => value + 1);
    }
  };

  const reportAddressError = (field: NonNullable<typeof addressValidationField>, message: string) => {
    setAddressValidationField(field);
    setErrorMessage(message);
    setIsEditingAddress(true);
    const ids = { detail: 'checkout-shipping-address', province: 'checkout-province', district: 'checkout-district', ward: 'checkout-ward' };
    window.requestAnimationFrame(() => {
      const input = document.getElementById(ids[field]);
      input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      input?.focus({ preventScroll: true });
    });
  };

  // Order Placement Success Details (Supports single & multi-store orders)
  const [orderSuccess, setOrderSuccess] = useState<CheckoutOrderResult | null>(null);
  const paymentConfirmedOrders = useRef(new Set<string>());

  const handlePayosOrderPaid = useCallback((publicOrderCode: string) => {
    setOrderSuccess(current => {
      if (!current || current.paymentMethod !== 'PAYOS') return current;
      const target = current.orders.find(order => order.publicOrderCode === publicOrderCode);
      if (!target || target.paymentStatus === 'PAID') return current;
      const orders = current.orders.map(order => order.publicOrderCode === publicOrderCode ? { ...order, paymentStatus: 'PAID' } : order);
      return { ...current, orders, paymentStatus: orders.every(order => order.paymentStatus === 'PAID') ? 'PAID' : 'WAITING_PAYMENT' };
    });
  }, []);

  useEffect(() => {
    if (!orderSuccess || orderSuccess.paymentMethod !== 'PAYOS' || orderSuccess.paymentStatus !== 'PAID') return;
    if (paymentConfirmedOrders.current.has(orderSuccess.publicOrderCode)) return;
    paymentConfirmedOrders.current.add(orderSuccess.publicOrderCode);
    onPaymentConfirmed?.(orderSuccess);
  }, [orderSuccess, onPaymentConfirmed]);

  const [payosAvailable, setPayosAvailable] = useState<boolean | null>(null);

  // Normalize active items to order
  const activeItems = useMemo<CartItem[]>(() => {
    if (checkoutItems && checkoutItems.length > 0) {
      return checkoutItems.map((item) => ({
        ...item,
        imageUrl: getSafeProductImageUrl(item.imageUrl, item.title, item.variantName),
      }));
    }

    if (product && store) {
      const matchedVariant = product.variants?.find((v) => v.id === selectedVariantId);
      const unitPrice =
        matchedVariant && matchedVariant.price !== undefined && matchedVariant.price !== null
          ? Number(matchedVariant.price)
          : Number(product.price);

      return [
        {
          cartItemId: `${product.id}_${selectedVariantId || 'base'}`,
          productId: product.id,
          variantId: selectedVariantId,
          liveSessionId: initialLiveSessionId,
          variantName: matchedVariant?.name,
          title: product.title,
          sku: matchedVariant?.sku || product.sku || '',
          price: unitPrice,
          originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
          imageUrl: getSafeProductImageUrl(product.imageUrl, product.title, matchedVariant?.name),
          quantity: singleQuantity,
          stockQuantity: matchedVariant ? matchedVariant.stockQuantity : product.stockQuantity,
          isActive: true,
          availableVariants: product.variants,
          store: {
            id: store.id,
            name: store.name,
            slug: store.slug,
            logoUrl: store.logoUrl,
            policyReturn: store.policyReturn,
            policyWarranty: store.policyWarranty,
            policyShipping: store.policyShipping,
          },
        },
      ];
    }

    return [];
  }, [checkoutItems, product, store, selectedVariantId, singleQuantity, initialLiveSessionId]);

  // Group active items by Shop
  const itemsGroupedByShop = useMemo(() => {
    const map = new Map<string, { store: CartItem['store']; items: CartItem[]; subtotal: number }>();
    for (const item of activeItems) {
      const storeId = item.store.id || 'default_store';
      let group = map.get(storeId);
      if (!group) {
        group = {
          store: item.store,
          items: [],
          subtotal: 0,
        };
        map.set(storeId, group);
      }
      group.items.push(item);
      group.subtotal += item.price * item.quantity;
    }
    return Array.from(map.values());
  }, [activeItems]);

  const targetVoucherStoreId = voucherTargetStoreId || itemsGroupedByShop[0]?.store.id || store?.id || '';
  const targetVoucherSubtotal = itemsGroupedByShop.find((group) => group.store.id === targetVoucherStoreId)?.subtotal || 0;
  const voucherBasisKey = activeItems.map((item) => `${item.store.id}:${item.productId}:${item.variantId || ''}:${item.quantity}:${item.price}`).join('|') + `:${customerPhone.trim()}`;
  const previousVoucherBasis = useRef(voucherBasisKey);
  useEffect(() => {
    if (previousVoucherBasis.current !== voucherBasisKey) {
      previousVoucherBasis.current = voucherBasisKey;
      couponRequest.current++;
      autoCouponController.current?.abort();
      setCouponLoading(false);
      setAppliedCoupon(null);
      setAppliedPlatformCoupon(null);
      setAppliedShippingCoupon(null);
    }
  }, [voucherBasisKey]);

  const policyStoreIds = useMemo(
    () => Array.from(new Set(itemsGroupedByShop.map((g) => g.store.id).filter(Boolean))).sort().join(','),
    [itemsGroupedByShop],
  );

  useEffect(() => {
    if (!isOpen || !policyStoreIds) {
      setShopPolicies({});
      setPolicyLoading(false);
      setPolicyError(null);
      return;
    }
    let active = true;
    setPolicyLoading(true);
    setPolicyError(null);
    apiCache.invalidate('/stores/public/id/');
    Promise.all(policyStoreIds.split(',').map(async (id) => {
      const response: any = await api.get(`/stores/public/id/${id}`);
      return [id, response?.data || response] as const;
    }))
      .then((entries) => { if (active) setShopPolicies(Object.fromEntries(entries)); })
      .catch(() => { if (active) setPolicyError('Không tải được chính sách hiện hành của Shop. Vui lòng thử lại sau.'); })
      .finally(() => { if (active) setPolicyLoading(false); });
    return () => { active = false; };
  }, [isOpen, policyStoreIds]);

  // Calculate Subtotal & Totals
  const rawSubtotal = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [activeItems]);
  const activeUnitCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, rawSubtotal - discountAmount - (appliedPlatformCoupon?.discountAmount || 0)) + Math.max(0, (shippingFee || 0) - (appliedShippingCoupon?.discountAmount || 0) - (appliedCoupon?.shippingDiscountAmount || 0));

  const applyStackedCoupon = async (benefitType: 'GOODS' | 'SHIPPING') => {
    const code = benefitType === 'GOODS' ? platformCouponCode : shippingCouponCode;
    if (!code.trim()) return;
    try {
      setStackedCouponBusy(benefitType);
      const response: any = await api.post('/coupons/preview-stacked', {
        code: code.trim(), storeId: targetVoucherStoreId,
        benefitType, goodsSubtotal: targetVoucherSubtotal, shippingFee: shippingFeesByStore[targetVoucherStoreId] || 0,
        shopDiscount: discountAmount, shopCouponCode: appliedCoupon?.code || undefined, customerPhone: customerPhone.trim() || undefined,
      });
      const result = response?.data || response;
      if (benefitType === 'GOODS') setAppliedPlatformCoupon(result);
      else setAppliedShippingCoupon(result);
      const successMessage = `Đã áp dụng mã ${result.code} thành công! Giảm ${formatMoney(Number(result.discountAmount) || 0)}${benefitType === 'SHIPPING' ? ' phí vận chuyển' : ' tiền hàng'}.`;
      setErrorMessage(null);
      setCouponMessage({ type: 'success', text: successMessage });
      toast.success(successMessage);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Voucher không hợp lệ.'); }
    finally { setStackedCouponBusy(null); }
  };

  // Check PayOS Availability
  useEffect(() => {
    if (!isOpen || !isSignedIn) return;
    let active = true;
    setPayosAvailable(null);
    checkoutService.paymentAvailable()
      .then((available) => {
        if (active) setPayosAvailable(available);
      })
      .catch(() => {
        if (active) setPayosAvailable(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, isSignedIn]);

  // Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Pre-fill user data & addresses on open
  useEffect(() => {
    let active = true;
    const session = getSessionId();
    if (isOpen) {
      addressDraftEdited.current = false;
      setPolicyAccepted(true);
      const user = authService.getCurrentUser();

      if (user) {
        setCustomerEmail(user.email || '');
        if (!customerName) setCustomerName(user.fullName || '');
        if (!customerPhone && user.phoneNumber) setCustomerPhone(user.phoneNumber);

        // Luôn tải sổ địa chỉ đã lưu cho mọi người dùng đã đăng nhập (không giới hạn role)
        customerService
          .getAddresses()
          .then((addrs) => {
            if (!active || session !== getSessionId()) return;
            setCustomerAddresses(Array.isArray(addrs) ? addrs : []);
            if (Array.isArray(addrs) && addrs.length > 0) {

              const def = addrs.find((a) => a.id === selectedSavedAddressId) || addrs.find((a) => a.isDefault) || addrs[0];
              if (def && !addressDraftEdited.current) {
                setSelectedSavedAddressId(def.id);
                if (def.fullName) setCustomerName(def.fullName);
                if (def.phoneNumber) setCustomerPhone(def.phoneNumber);
                setShippingAddress(def.detailAddress || '');
                setDeliveryLocation(readAddressCoordinates(def));
                if (def.provinceCode) setProvinceCode(String(def.provinceCode));
                if (def.districtCode) setDistrictCode(String(def.districtCode));
                if (def.wardCode) setWardCode(String(def.wardCode));
                if (shippingProvinces.length > 0) {
                  populateAddressFromRecord(def, shippingProvinces);
                }
              }
            }
          })
          .catch(() => {});
      }

      const newKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setIdempotencyKey(newKey);

      // Pre-checkout validation (Requirement 6)
      if (activeItems.length > 0) {
        setIsValidatingCart(true);
        checkoutService.validateCart(activeItems.map((i) => ({
              productId: i.productId,
              variantId: i.variantId || undefined,
              quantity: i.quantity,
              clientPrice: i.price,
            })))
          .then((res: any) => {
            const data = res?.data || res;
            if (data?.warnings && data.warnings.length > 0) {
              setValidationWarnings(data.warnings);
            } else {
              setValidationWarnings([]);
            }
          })
          .catch(() => {})
          .finally(() => setIsValidatingCart(false));
      }
    }
    return () => { active = false; };
  }, [isOpen]);

  // Load Shipping Provinces
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const controller = new AbortController();
    setAddressLoading(true);
    setAddressError(null);
    loadShippingAddresses(controller.signal)
      .then((provinces) => {
        if (!active) return;
        setShippingProvinces(provinces);
      })
      .catch((err) => {
        if (!active) return;
        setAddressError(err?.message || 'Không thể tải danh sách Tỉnh/Thành phố.');
      })
      .finally(() => {
        if (active) setAddressLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [isOpen, addressLoadRetry]);

  const selectedProvince = shippingProvinces.find((p) => String(p.code) === String(provinceCode));
  const selectedDistrict = selectedProvince?.districts.find((d) => String(d.code) === String(districtCode));
  const selectedWard = selectedDistrict?.wards.find((w) => String(w.code) === String(wardCode));
  useEffect(() => {
    if (!mappedAddress) return;
    const resolved = resolveMapShippingAddress(mappedAddress, shippingProvinces);
    setProvinceCode(resolved.provinceCode);
    setDistrictCode(resolved.districtCode);
    setWardCode(resolved.wardCode);
  }, [mappedAddress, shippingProvinces]);

  const handleCheckoutLocationChange = (result: AddressLocationResult) => {
    setIsEditingAddress(true);
    markAddressEdited();
    setDeliveryLocation({ latitude: result.latitude, longitude: result.longitude });
    setMappedAddress(result);
    setShippingAddress(result.detailAddress || '');
    const resolved = resolveMapShippingAddress(result, shippingProvinces);
    setProvinceCode(resolved.provinceCode);
    setDistrictCode(resolved.districtCode);
    setWardCode(resolved.wardCode);
  };
  const shippingAddressHint = addressError || (addressLoading ? 'Đang tải danh mục địa chỉ…'
    : !selectedProvince ? 'Chọn Tỉnh/Thành phố để tính phí ship.'
    : !selectedDistrict ? 'Chọn Quận/Huyện để tính phí ship.'
    : !selectedWard ? 'Chọn Phường/Xã để tính phí ship.'
    : shippingAddress.trim().length < 5 ? 'Bổ sung địa chỉ chi tiết (ít nhất 5 ký tự) để tính phí ship.'
    : null);
  const shippingDestination = !shippingAddressHint && selectedProvince && selectedDistrict && selectedWard ? {
    province: selectedProvince.name, district: selectedDistrict.name, ward: selectedWard.name, detail: shippingAddress.trim(),
  } : undefined;
  const shippingDestinationKey = JSON.stringify(shippingDestination || null);

  useEffect(() => {
    if (!isOpen || !isSignedIn || !selectedProvince || !selectedDistrict || !selectedWard || shippingAddress.trim().length < 5 || !itemsGroupedByShop.length) {
      setShippingFee(null);
      setShippingFeesByStore({});
      setShippingQuoteMode(null);
      setAppliedShippingCoupon(null);
      setShippingFeeError(null);
      setShippingFeeLoading(false);
      return;
    }
    let active = true;
    const address = [shippingAddress.trim(), selectedWard.name, selectedDistrict.name, selectedProvince.name].join(', ');
    setShippingFee(null);
    setShippingFeesByStore({});
    setShippingQuoteMode(null);
    setAppliedShippingCoupon(null);
    if (!usesLegacyCheckout) {
      couponRequest.current++;
      setAppliedCoupon(null); setAppliedPlatformCoupon(null); setCouponMessage(null);
    }
    setShippingFeeError(null);
    setShippingFeeLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => { void Promise.all(itemsGroupedByShop.map(async (group) => {
      let response: any;
      try {
        response = await checkoutService.shippingQuote(
          group.items.map((item) => ({ productId: item.productId, variantId: normalizeOrderVariantId(item.variantId), quantity: item.quantity })),
          group.store.id, address, controller.signal, shippingDestination,
        );
      } catch (error: any) {
        const detail = error?.response?.data?.message || error?.message;
        const message = Array.isArray(detail) ? detail.join(' ') : detail;
        throw new Error(`Chưa tính được phí giao hàng của ${group.store.name || 'gian hàng'}: ${message || 'Vui lòng thử lại sau.'}`);
      }
      const quote = response?.data?.data || response?.data || response;
      if (typeof quote.totalFee !== 'number' || !Number.isFinite(quote.totalFee) || quote.totalFee < 0) throw new Error('Phí vận chuyển không hợp lệ. Vui lòng thử tính lại phí vận chuyển.');
      return { storeId: group.store.id, fee: Number(quote.totalFee), mode: quote.mode };
    }))
      .then((fees) => { if (active) { setShippingFeesByStore(Object.fromEntries(fees.map((item) => [item.storeId, item.fee]))); setShippingFee(fees.reduce((sum, item) => sum + item.fee, 0)); setShippingQuoteMode(fees.some(fee => fee.mode === 'GHN_SANDBOX') ? 'GHN_SANDBOX' : fees.some(fee => fee.mode === 'SIMULATED') ? 'SIMULATED' : 'FIXED'); } })
      .catch((error: any) => { if (active) setShippingFeeError(error?.message || 'Chưa lấy được phí vận chuyển. Vui lòng thử lại sau.'); })
      .finally(() => { if (active) setShippingFeeLoading(false); }); }, 350);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [isOpen, isSignedIn, shippingAddress, selectedProvince?.name, selectedDistrict?.name, selectedWard?.name, itemsGroupedByShop, shippingQuoteRetry]);

  // Remove an address validation message as soon as its field is corrected.
  useEffect(() => {
    if (!addressValidationField) return;
    const corrected = {
      detail: shippingAddress.trim().length >= 5,
      province: Boolean(selectedProvince),
      district: Boolean(selectedDistrict),
      ward: Boolean(selectedWard),
    }[addressValidationField];
    if (corrected) {
      setErrorMessage(null);
      setAddressValidationField(null);
    }
  }, [addressValidationField, shippingAddress, selectedProvince, selectedDistrict, selectedWard]);

  const resolveOrderVariantId = async (item: CartItem): Promise<string | undefined> => {
    const currentId = item.variantId?.trim();
    if (!currentId) return undefined;
    if (UUID_RE.test(currentId)) return currentId;

    let variants: any[] = item.availableVariants || [];
    try {
      const response: any = await api.get(
        `/public/products/${encodeURIComponent(item.productId)}/landing`,
        { headers: { 'x-skip-cache': 'true' } },
      );
      const payload = response?.product
        ? response
        : response?.data?.product
          ? response.data
          : response?.data?.data || response?.data || response;
      if (Array.isArray(payload?.product?.variants)) {
        variants = payload.product.variants;
      }
    } catch {
      if (!variants.some((variant) => typeof variant?.id === 'string' && UUID_RE.test(variant.id))) {
        throw new Error(`Không thể kiểm tra phân loại của “${item.title}”. Hãy tải lại trang rồi thử lại.`);
      }
    }

    const tokens = new Set(
      [currentId, item.sku, item.variantName]
        .map(normalizeVariantToken)
        .filter(Boolean),
    );
    const matched = variants.find((variant) => {
      if (typeof variant?.id !== 'string' || !UUID_RE.test(variant.id)) return false;
      return [variant.id, variant.sku, variant.name]
        .map(normalizeVariantToken)
        .some((token) => token && tokens.has(token));
    }) || (variants.length === 1 && UUID_RE.test(String(variants[0]?.id || '')) ? variants[0] : null);

    if (matched) return matched.id;
    if (variants.length === 0) return undefined;
    throw new Error(`Phân loại của “${item.title}” đã cũ hoặc không còn khớp. Hãy chọn lại phân loại trong giỏ hàng.`);
  };

  const populateAddressFromRecord = (
    addr: CustomerAddress,
    provinces: ShippingProvince[],
  ) => {
    if (addr.fullName) setCustomerName(addr.fullName);
    if (addr.phoneNumber) setCustomerPhone(addr.phoneNumber);
    setDeliveryLocation(readAddressCoordinates(addr));
    setMappedAddress(null);
    setMapResetKey(value => value + 1);

    const resolved = resolveSavedShippingAddress(addr, provinces);
    setShippingAddress(resolved.detailAddress || addr.detailAddress || '');
    if (resolved.provinceCode) {
      setProvinceCode(resolved.provinceCode);
      setDistrictCode(resolved.districtCode);
      setWardCode(resolved.wardCode);
      return;
    }

    const normProv = normalizeVietnameseAddress(addr.provinceName || '');
    const foundProv = provinces.find(
      (p) =>
        String(p.code) === String(addr.provinceCode) ||
        (normProv && (normalizeVietnameseAddress(p.name).includes(normProv) || normProv.includes(normalizeVietnameseAddress(p.name)))),
    );

    if (foundProv) {
      setProvinceCode(String(foundProv.code));

      const normDist = normalizeVietnameseAddress(addr.districtName || '');
      const foundDist = foundProv.districts.find(
        (d) =>
          String(d.code) === String(addr.districtCode) ||
          (normDist && (normalizeVietnameseAddress(d.name).includes(normDist) || normDist.includes(normalizeVietnameseAddress(d.name)))),
      );

      if (foundDist) {
        setDistrictCode(String(foundDist.code));

        const normWard = normalizeVietnameseAddress(addr.wardName || '');
        const foundWard = foundDist.wards.find(
          (w) =>
            String(w.code) === String(addr.wardCode) ||
            (normWard && (normalizeVietnameseAddress(w.name).includes(normWard) || normWard.includes(normalizeVietnameseAddress(w.name)))),
        );

        if (foundWard) {
          setWardCode(String(foundWard.code));
        } else {
          setWardCode('');
        }
      } else {
        setDistrictCode('');
        setWardCode('');
      }
    }
  };

  const applySavedAddress = useCallback((addrId: string) => {
    const addr = customerAddresses.find((a) => a.id === addrId);
    if (!addr) return;
    populateAddressFromRecord(addr, shippingProvinces);
  }, [customerAddresses, shippingProvinces]);

  // Tự động phân giải và điền đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã khi cả sổ địa chỉ và shippingProvinces đã tải xong
  useEffect(() => {
    if (!isOpen || !selectedSavedAddressId || addressDraftEdited.current || shippingProvinces.length === 0) return;
    applySavedAddress(selectedSavedAddressId);
  }, [applySavedAddress, isOpen, selectedSavedAddressId, shippingProvinces.length]);

  const handleSelectSavedAddress = (addrId: string) => {
    addressDraftEdited.current = false;
    if (addressValidationField) { setAddressValidationField(null); setErrorMessage(null); }
    setSelectedSavedAddressId(addrId);
    setIsEditingAddress(false);
    if (addrId) applySavedAddress(addrId);
  };

  const handleStartNewAddress = () => {
    addressDraftEdited.current = true;
    if (addressValidationField) { setAddressValidationField(null); setErrorMessage(null); }
    setSelectedSavedAddressId('');
    setProvinceCode('');
    setDistrictCode('');
    setWardCode('');
    setShippingAddress('');
    setDeliveryLocation(null);
    setMappedAddress(null);
    setMapResetKey(value => value + 1);
    setIsEditingAddress(true);
  };

  // Quản lý xác nhận xóa địa chỉ chuẩn sàn SCANMS (Chỉ xóa khi click xác nhận, tuyệt đối không đếm giờ)
  const [addressToDelete, setAddressToDelete] = useState<CustomerAddress | null>(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  const handleExecuteDeleteAddress = async (addr: CustomerAddress) => {
    setIsDeletingAddress(true);
    try {
      await customerService.deleteAddress(addr.id);
      toast.success('Đã xóa địa chỉ thành công!');

      const updated = await customerService.getAddresses();
      const newAddresses = Array.isArray(updated) ? updated : [];
      setCustomerAddresses(newAddresses);

      // Nếu địa chỉ vừa xóa là địa chỉ đang được chọn
      if (selectedSavedAddressId === addr.id) {
        if (newAddresses.length > 0) {
          const nextAddr = newAddresses.find((a) => a.isDefault) || newAddresses[0];
          setSelectedSavedAddressId(nextAddr.id);
          populateAddressFromRecord(nextAddr, shippingProvinces);
        } else {
          handleStartNewAddress();
        }
      }
      setAddressToDelete(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể xóa địa chỉ lúc này.');
    } finally {
      setIsDeletingAddress(false);
    }
  };

  const handleSaveNewAddressNow = async () => {
    if (!customerName.trim()) {
      toast.error('Vui lòng nhập Họ và tên người nhận hàng.');
      document.getElementById('checkout-customer-name')?.focus();
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('Vui lòng nhập Số điện thoại nhận hàng.');
      document.getElementById('checkout-customer-phone')?.focus();
      return;
    }
    if (!isPhoneValid(customerPhone)) {
      toast.error('Số điện thoại nhận hàng chưa đúng định dạng Việt Nam (10 chữ số, ví dụ: 0987654321).');
      document.getElementById('checkout-customer-phone')?.focus();
      return;
    }
    if (!selectedProvince) {
      toast.error('Vui lòng chọn Tỉnh/Thành phố nhận hàng.');
      return;
    }
    if (!selectedDistrict) {
      toast.error('Vui lòng chọn Quận/Huyện nhận hàng.');
      return;
    }
    if (!selectedWard) {
      toast.error('Vui lòng chọn Phường/Xã nhận hàng.');
      return;
    }
    if (!shippingAddress.trim()) {
      toast.error('Vui lòng nhập địa chỉ cụ thể (số nhà, tổ/ngõ, tên đường).');
      document.getElementById('checkout-shipping-address')?.focus();
      return;
    }

    setIsSavingAddress(true);
    try {
      const res: any = await customerService.createAddress({
        fullName: customerName.trim(),
        phoneNumber: customerPhone.trim(),
        provinceCode: String(selectedProvince.code),
        provinceName: selectedProvince.name,
        districtCode: String(selectedDistrict.code),
        districtName: selectedDistrict.name,
        wardCode: String(selectedWard.code),
        wardName: selectedWard.name,
        detailAddress: shippingAddress.trim(),
        ...(deliveryLocation || {}),
        isDefault: setAsDefaultAddress,
      });

      const newAddr = res?.address || res?.data?.address;
      toast.success('Đã lưu địa chỉ mới vào sổ địa chỉ thành công!');

      const updated = await customerService.getAddresses();
      if (Array.isArray(updated)) {
        setCustomerAddresses(updated);
        if (newAddr?.id) {
          setSelectedSavedAddressId(newAddr.id);
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể lưu địa chỉ.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const isPhoneValid = (phone: string) => /^(0[3|5|7|8|9])[0-9]{8}$/.test(phone.trim());
  const isEmailValid = (email: string) =>
    !email.trim() || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());

  // Validate coupon
  const voucherItems = () => activeItems.map(item => ({ productId: item.productId, variantId: normalizeOrderVariantId(item.variantId), quantity: item.quantity }));
  const captureVoucherQuote = (data: any) => {
    setCouponCode(data.code || ''); setShippingCouponCode(data.shippingCouponCode || '');
    setAppliedCoupon(data.code ? { code: data.code, discountAmount: Number(data.discountAmount) || 0, discountType: data.discountType } : null);
    setAppliedShippingCoupon(data.shippingCouponCode ? { code: data.shippingCouponCode, discountAmount: Number(data.shippingDiscountVnd) || 0 } : null);
    setAppliedPlatformCoupon(null);
    const saved=(Number(data.discountAmount)||0)+(Number(data.shippingDiscountVnd)||0);
    setCouponMessage(saved>0 ? {type:'success',text:`Đã chọn ${[data.code,data.shippingCouponCode].filter(Boolean).join(' + ')}. Tiết kiệm ${formatMoney(saved)}; bạn có thể đổi hoặc bỏ từng mã.`}:null);
  };
  const handleChooseVoucherPair = async (selection: VoucherSelection): Promise<boolean> => {
    takeManualVoucherControl();
    const request=++couponRequest.current; setCouponLoading(true); setCouponMessage(null);
    try {
      const data=await quoteVoucherSelection(selection,voucherItems(),undefined,shippingDestination);
      if(request!==couponRequest.current) return false;
      captureVoucherQuote(data); setErrorMessage(null); return true;
    } catch(err:any) {
      if(request===couponRequest.current) setCouponMessage({type:'error',text:err?.response?.data?.message || 'Chưa áp dụng được voucher. Vui lòng kiểm tra điều kiện.'});
      return false;
    } finally { if(request===couponRequest.current) setCouponLoading(false); }
  };
  const validateCheckoutCoupon = (code: string) => usesLegacyCheckout
    ? api.post('/coupons/validate', {
        code, storeId: targetVoucherStoreId, customerPhone: customerPhone.trim() || undefined,
        items: activeItems.filter(item => item.store.id === targetVoucherStoreId).map(item => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, unitPrice: item.price })),
        hasProductDiscount: false, hasShopVoucher: false, hasPlatformVoucher: Boolean(appliedPlatformCoupon),
      })
    : checkoutService.quote({ couponCode: code, shippingDestination, items: activeItems.map(item => ({ productId: item.productId, variantId: normalizeOrderVariantId(item.variantId), quantity: item.quantity })) });
  const handleValidateCoupon = async (selectedCode = couponCode): Promise<boolean> => {
    if (!selectedCode.trim()) return false;
    if(!usesLegacyCheckout) return handleChooseVoucherPair({goodsCode:appliedCoupon?.code||'',shippingCode:appliedShippingCoupon?.code||'',enteredCode:selectedCode});
    takeManualVoucherControl();
    const request = ++couponRequest.current;
    setCouponCode(selectedCode.trim().toUpperCase());
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const res: any = await validateCheckoutCoupon(selectedCode.trim());
      if (request !== couponRequest.current) return false;

      const data = res?.data || res;
      setAppliedCoupon({
        code: data.code,
        discountAmount: Number(data.discountAmount) || 0,
        discountType: data.discountType,
        shippingDiscountAmount: Number(data.shippingDiscountVnd) || 0,
      });
      setAppliedPlatformCoupon(null);
      const successMessage = Number(data.shippingDiscountVnd) > 0
        ? `Đã áp dụng mã ${data.code}, giảm ${formatMoney(Number(data.shippingDiscountVnd))} phí vận chuyển.`
        : `Đã áp dụng mã ${data.code} thành công! Giảm ${formatMoney(Number(data.discountAmount) || 0)} tiền hàng.`;
      setErrorMessage(null);
      setCouponMessage({
        type: 'success',
        text: successMessage,
      });
      toast.success(successMessage);
      return true;
    } catch (err: any) {
      if (request !== couponRequest.current) return false;
      setAppliedCoupon(null);
      setCouponMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc không áp dụng được.',
      });
      return false;
    } finally {
      if (request === couponRequest.current) setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    takeManualVoucherControl();
    setCouponLoading(false);
    setAppliedCoupon(null);
    setAppliedPlatformCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
  };

  const liveCouponCodes = [...new Set(activeItems.map((item) => item.liveCouponCode).filter(Boolean))];
  const autoCouponCode = initialCouponCode || (liveCouponCodes.length === 1 ? liveCouponCodes[0]! : '');
  useEffect(() => {
    if (!isOpen) { setAutoCouponDismissed(false); setCouponLoading(false); setShowVoucherPicker(false); return; }
    if (autoCouponDismissed || !isSignedIn || !activeItems.length) return;
    if (usesLegacyCheckout && !autoCouponCode) return;
    if (!usesLegacyCheckout && (!shippingDestination || shippingFee == null || shippingFeeLoading || shippingFeeError)) return;
    let active = true;
    const controller = new AbortController();
    autoCouponController.current = controller;
    const request = ++couponRequest.current;
    const isCurrent = () => active && !controller.signal.aborted && request === couponRequest.current;
    setCouponLoading(true);
    setAppliedCoupon(null);
    setAppliedPlatformCoupon(null);
    const timer = window.setTimeout(() => {
      setCouponLoading(true);
      const recommend = async () => {
        if (usesLegacyCheckout) return validateCheckoutCoupon(autoCouponCode);
        return recommendVoucherSelection(voucherItems(),activeItems.map(item=>item.store.id),controller.signal,
          initialCouponCode,initialShippingCouponCode,liveCouponCodes.length===1?liveCouponCodes[0]:undefined,shippingDestination);
      };
      void recommend().then((response: any) => {
        if (!isCurrent()) return;
        const data = response?.data || response;
        if (!data) { setCouponCode(''); setCouponMessage(null); return; }
        if(!usesLegacyCheckout) { captureVoucherQuote(data); return; }
        setCouponCode(data.code);
        setAppliedCoupon({ code: data.code, discountAmount: Number(data.discountAmount) || 0, discountType: data.discountType, shippingDiscountAmount: Number(data.shippingDiscountVnd) || 0 });
        setCouponMessage({ type: 'success', text: Number(data.shippingDiscountVnd) > 0
          ? `Đã ${initialCouponCode ? 'áp dụng' : 'tự chọn'} ${data.code}, giảm ${formatMoney(Number(data.shippingDiscountVnd))} phí vận chuyển. Bạn có thể đổi hoặc bỏ mã.`
          : `Đã ${initialCouponCode ? 'áp dụng' : 'tự chọn'} ${data.code}, giảm ${formatMoney(Number(data.discountAmount) || 0)} tiền hàng. Bạn có thể đổi hoặc bỏ mã.` });
      }).catch((error: any) => {
        if (!isCurrent()) return;
        setAppliedCoupon(null);
        setCouponMessage({ type: 'error', text: error?.response?.data?.message || 'Voucher live không còn áp dụng được.' });
      }).finally(() => { if (isCurrent()) setCouponLoading(false); });
    }, 300);
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [isOpen, isSignedIn, autoCouponCode, initialShippingCouponCode, autoCouponDismissed, voucherBasisKey, store?.id, shippingDestinationKey, shippingFee, shippingFeeLoading, shippingFeeError]);

  // Submit Order (Requirements 7, 8, 9, 10)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setAddressValidationField(null);
    if (couponLoading || stackedCouponBusy) { setErrorMessage('Đang kiểm tra voucher. Vui lòng đợi một chút rồi đặt hàng.'); return; }

    const pendingVoucherLabels = [
      couponCode.trim() && !appliedCoupon ? 'Voucher Shop / KOL' : null,
      platformCouponCode.trim() && !appliedPlatformCoupon ? 'Voucher SCANMS' : null,
      shippingCouponCode.trim() && !appliedShippingCoupon ? 'Voucher vận chuyển' : null,
    ].filter(Boolean);
    if (pendingVoucherLabels.length) {
      const message = `Chưa thể đặt hàng: mã tại ${pendingVoucherLabels.join(', ')} chưa được áp dụng thành công. Chỉ được dùng 1 voucher tiền hàng Shop hoặc KOL cho mỗi Shop. Vui lòng bấm “Áp dụng” đúng loại voucher hoặc xóa mã chưa dùng.`;
      setErrorMessage(message);
      setCouponMessage({ type: 'error', text: message });
      document.getElementById('checkout-vouchers-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!currentUser && (!localStorage.getItem('token') || !authService.getCurrentUser())) {
      setErrorMessage(
        'Vui lòng đăng nhập hoặc xác thực Google ở phía trên để hoàn tất đặt hàng.',
      );
      const gateEl = document.getElementById('mandatory-auth-gate');
      if (gateEl) {
        gateEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      }
      return;
    }

    if (paymentMethod === 'PAYOS' && payosAvailable !== true) {
      setErrorMessage(
        'Chưa kết nối được PayOS. Vui lòng thử lại sau hoặc chọn phương thức thanh toán khác.',
      );
      return;
    }
    if (paymentMethod === 'WALLET' && (walletLoading || !wallet || Number(wallet.availableBalance) < finalTotal)) {
      setErrorMessage('Số dư ví chưa đủ hoặc chưa tải xong. Vui lòng kiểm tra ví trước khi đặt hàng.');
      return;
    }

    const trimmedName = customerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Họ và tên người nhận phải có ít nhất 2 ký tự.');
      return;
    }

    if (!isPhoneValid(customerPhone)) {
      setErrorMessage('Số điện thoại không hợp lệ. Vui lòng nhập 10 số (bắt đầu bằng 03, 05, 07, 08, 09).');
      return;
    }

    const orderEmail = customerEmail.trim() || authService.getCurrentUser()?.email || '';
    if (!isEmailValid(orderEmail)) {
      setErrorMessage('Email nhận thông tin đơn hàng không hợp lệ.');
      return;
    }

    const addressDetail = shippingAddress.trim();
    if (!addressDetail || addressDetail.length < 5) {
      reportAddressError('detail', 'Vui lòng nhập số nhà, tên đường hoặc tòa nhà (ít nhất 5 ký tự).');
      return;
    }

    if (addressLoading) {
      setErrorMessage('Đang tải danh mục địa chỉ. Vui lòng đợi một chút rồi đặt hàng.');
      return;
    }
    if (!selectedProvince) {
      reportAddressError('province', 'Vui lòng chọn Tỉnh/Thành phố nhận hàng.');
      return;
    }
    if (!selectedDistrict) {
      reportAddressError('district', 'Vui lòng chọn Quận/Huyện nhận hàng.');
      return;
    }
    if (!selectedWard) {
      reportAddressError('ward', 'Vui lòng chọn Phường/Xã nhận hàng.');
      return;
    }

    if (shippingFee === null || shippingFeeError) {
      setErrorMessage(shippingFeeError || 'Đang tính phí vận chuyển. Vui lòng đợi trước khi đặt hàng.');
      return;
    }

    if (policyLoading) {
      setErrorMessage('Đang tải chính sách của gian hàng. Vui lòng chờ một chút rồi thử lại.');
      return;
    }

    if (policyError || itemsGroupedByShop.some((group) => !shopPolicies[group.store.id])) {
      setErrorMessage(policyError || 'Chưa tải được chính sách của một gian hàng. Vui lòng tải lại trang trước khi đặt mua.');
      return;
    }

    if (!policyAccepted) {
      setErrorMessage('Vui lòng đọc chính sách đổi trả bên dưới và tích xác nhận trước khi đặt mua.');
      return;
    }

    const fullShippingAddress = [
      addressDetail,
      selectedWard.name,
      selectedDistrict.name,
      selectedProvince.name,
    ].join(', ');

    // Check stock for all items
    for (const item of activeItems) {
      if (item.quantity > item.stockQuantity) {
        setErrorMessage(
          `Sản phẩm "${item.title}" chỉ còn ${item.stockQuantity} món trong kho (bạn đặt ${item.quantity}).`,
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const normalizedItems = await Promise.all(
        activeItems.map(async (item) => ({
          productId: item.productId,
          referralLinkId: getProductReferral(item.productId),
          liveSessionId: item.liveSessionId || (item.productId === product?.id ? initialLiveSessionId : undefined),
          variantId: await resolveOrderVariantId(item),
          quantity: item.quantity,
        })),
      );

      const payload = {
        storeId: activeItems[0]?.store.id || store?.id,
        customerName: trimmedName,
        customerPhone: customerPhone.trim(),
        customerEmail: orderEmail.trim().toLowerCase() || undefined,
        shippingAddress: fullShippingAddress,
        ...(!usesLegacyCheckout && { expectedShippingFeeVnd: shippingFee }),
        ...(!usesLegacyCheckout && { shippingDestination }),
        policyAccepted: true,
        orderNotes: orderNotes.trim() || undefined,
        paymentMethod,
        couponCode: !usesLegacyCheckout || itemsGroupedByShop.length === 1 ? appliedCoupon?.code || undefined : undefined,
        couponsByStore: appliedCoupon ? { [targetVoucherStoreId]: appliedCoupon.code } : undefined,
        platformCouponsByStore: appliedPlatformCoupon ? { [targetVoucherStoreId]: appliedPlatformCoupon.code } : undefined,
        shippingCouponsByStore: appliedShippingCoupon ? { [targetVoucherStoreId]: appliedShippingCoupon.code } : undefined,
        platformCouponCode: itemsGroupedByShop.length === 1 ? appliedPlatformCoupon?.code || undefined : undefined,
        shippingCouponCode: !usesLegacyCheckout || itemsGroupedByShop.length === 1 ? appliedShippingCoupon?.code || undefined : undefined,
        idempotencyKey,
        items: normalizedItems,
      };

      const res = await checkoutService.create(usesLegacyCheckout ? payload : {
        ...payload,
        items: normalizedItems.map(({ liveSessionId, ...item }) => ({ ...item, sourceLivestreamId: liveSessionId })),
      });
      const rawResponse = res as any;
      const resData = rawResponse?.data?.data || rawResponse?.data || rawResponse;
      if (!usesLegacyCheckout && Number(resData.finalAmount) !== finalTotal) {
        throw new Error('Giá hoặc phí vận chuyển đã thay đổi. Đơn đang chờ thanh toán; hãy kiểm tra tổng tiền trong Đơn mua trước khi trả tiền.');
      }
      if (!usesLegacyCheckout && paymentMethod === 'WALLET') {
        const customerWallet = await financeService.wallet('CUSTOMER');
        const payment = await financeService.payWallet(resData.orderId, customerWallet.walletId, `checkout-wallet:${idempotencyKey}`);
        if (payment.status !== 'SUCCESS') throw new Error('Chưa xác nhận được thanh toán ví. Vui lòng kiểm tra đơn mua trước khi thử lại.');
        resData.paymentStatus = 'PAID';
        resData.orders?.forEach((order: any) => { order.paymentStatus = 'PAID'; });
      }

      // Extract created orders list (Requirement 8 & 10)
      const isMultiStore = Boolean(resData.isMultiStore);
      const rawOrders = Array.isArray(resData.orders) && resData.orders.length > 0 ? resData.orders : [resData];

      const formattedOrders: NonNullable<typeof orderSuccess>['orders'] = rawOrders.map((o: any) => ({
        publicOrderCode: o.publicOrderCode || o.externalOrderSn || o.order?.externalOrderSn || resData.publicOrderCode,
        storeId: o.store?.id || o.storeId,
        storeName: o.store?.name || o.storeName || 'Gian Hàng Đối Tác',
        finalAmount: Number(o.finalAmount !== undefined ? o.finalAmount : o.order?.finalAmount || resData.finalAmount || 0),
        paymentStatus: o.paymentStatus || o.order?.rawPayload?.paymentStatus || (!isMultiStore ? resData.paymentStatus : undefined) || 'WAITING_PAYMENT',
        trackingUrl: o.trackingUrl || `/tracking?sn=${o.publicOrderCode || resData.publicOrderCode}`,
        items: o.items || [],
      }));

      const primaryOrderCode = formattedOrders[0]?.publicOrderCode || resData.publicOrderCode;

      const orderResult: NonNullable<typeof orderSuccess> = {
        isMultiStore,
        publicOrderCode: primaryOrderCode,
        totalAmount: Number(resData.finalAmount || finalTotal),
        paymentMethod: resData.paymentMethod || paymentMethod,
        paymentStatus: resData.paymentStatus || 'UNPAID',
        orders: formattedOrders,
        cancellationToken: resData.cancellationToken,
        confirmationEmailQueued: Boolean(resData.confirmationEmailQueued),
        confirmationEmailStatus: resData.confirmationEmailStatus,
      };
      if (orderResult.paymentMethod === 'PAYOS') {
        orderResult.paymentStatus = formattedOrders.every(order => order.paymentStatus === 'PAID') ? 'PAID' : 'WAITING_PAYMENT';
      }

      // Requirement 10: Only remove placed items from cart!
      const placedCartItemIds = activeItems.map((i) => i.cartItemId);
      removeItems(placedCartItemIds);

      // Save recent order code for guest lookup
      localStorage.setItem(
        'scanms-recent-guest-order',
        JSON.stringify({ publicOrderCode: primaryOrderCode, createdAt: Date.now() }),
      );

      // Tự động lưu địa chỉ mới vào Sổ địa chỉ nếu người dùng chọn checkbox và tài khoản đã đăng nhập
      if (saveToAddressBook && !selectedSavedAddressId && isSignedIn && selectedProvince && selectedDistrict && selectedWard) {
        customerService
          .createAddress({
            fullName: trimmedName,
            phoneNumber: customerPhone.trim(),
            provinceCode: String(selectedProvince.code),
            provinceName: selectedProvince.name,
            districtCode: String(selectedDistrict.code),
            districtName: selectedDistrict.name,
            wardCode: String(selectedWard.code),
            wardName: selectedWard.name,
            detailAddress: addressDetail,
            ...(deliveryLocation || {}),
            isDefault: setAsDefaultAddress,
          })
          .catch(() => {});
      }

      if (onOrderPlaced) {
        onOrderPlaced(orderResult);
      }
      if (localStorage.getItem('token') && authService.getCurrentUser()) {
        if (orderResult.paymentStatus === 'PAID') onPaymentConfirmed?.(orderResult);
        onClose();
        navigate('/customer/orders', {
          replace: true,
          state: { placedOrderCodes: formattedOrders.map(order => order.publicOrderCode).filter(Boolean) },
        });
        toast.success(orderResult.paymentMethod === 'PAYOS' && orderResult.paymentStatus !== 'PAID'
          ? 'Đã tạo đơn. Bạn có thể tiếp tục thanh toán trong Đơn mua.'
          : 'Đặt hàng thành công. Theo dõi đơn trong Đơn mua của tôi.');
      } else {
        setOrderSuccess(orderResult);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }
      const rawMessage = err?.response?.data?.message || err?.message;
      const serverMsg =
        err?.response?.status === 429
          ? rawMessage || 'Bạn thao tác quá nhiều lần. Vui lòng chờ 5 phút rồi thử lại.'
          : Array.isArray(rawMessage)
          ? rawMessage.join(' ')
          : rawMessage || 'Không thể hoàn tất đặt hàng lúc này. Vui lòng kiểm tra lại thông tin và thử lại.';
      // Reveal the explanation after React has committed the error banner.
      revealSubmissionError.current = true;
      setErrorMessage(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const fullShippingAddressString = [
    shippingAddress.trim(),
    selectedWard?.name,
    selectedDistrict?.name,
    selectedProvince?.name,
  ]
    .filter(Boolean)
    .join(', ');
  const hasCompleteShippingAddress = Boolean(
    selectedProvince && selectedDistrict && selectedWard && shippingAddress.trim().length >= 5,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-checkout-title"
      className="scanms-checkout fixed inset-0 z-[80] bg-[#FAF8F5] overflow-y-auto min-h-[100dvh] text-[#1A1612] font-sans animate-in fade-in duration-150 text-left"
    >
      {/* 1. Header Chuẩn SCANMS & các sàn lớn (Logo SCANMS | Thanh Toán) */}
      <header className="bg-white border-b border-[#EAE4D7] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Link to="/" onClick={onClose} className="inline-flex min-w-0 no-underline" title="Về trang chủ SCANMS" aria-label="Về trang chủ SCANMS">
              <ScanMSLogo size="md" className="checkout-brand-logo" />
            </Link>
            <div className="hidden sm:block h-8 w-px bg-[#EAE4D7]" />
            <span id={!orderSuccess ? 'guest-checkout-title' : undefined} className="text-sm sm:text-base font-semibold text-[#7D715E]">
              Thanh toán
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[11px] font-bold text-[#B88E4F]">
              <ShieldCheck className="w-4 h-4 text-[#B88E4F]" />
              <span>Cổng thanh toán SCANMS</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[44px] items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EAE4D7] hover:border-[#EEDFC6] text-xs font-semibold text-[#7D715E] bg-white hover:bg-[#FBF5EB] transition cursor-pointer"
              title="Quay lại mua sắm"
            >
              <ArrowLeft className="w-4 h-4 text-[#7D715E]" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>
          </div>
        </div>
      </header>

      {/* Warm gold divider */}
      <div className="h-px w-full bg-[#EEDFC6]" />

      {/* 3. Main Checkout Container */}
      <main className="max-w-6xl mx-auto px-4 py-5 sm:py-6 space-y-4 sm:space-y-5">
        {/* Order Confirmation Screen (Requirement 10) */}
        {orderSuccess ? (
          <CheckoutOrderConfirmation
            order={orderSuccess}
            customerEmail={customerEmail.trim() || authService.getCurrentUser()?.email || ''}
            onClose={onClose}
            onPayosPaid={handlePayosOrderPaid}
          />
        ) : (
          /* Checkout Form (SCANMS Style) */
          <form noValidate onSubmit={handleSubmitOrder} className="checkout-flow-form">
            {/* Status alerts */}
            {isValidatingCart && (
              <div className="p-3 rounded-lg bg-[#FBF5EB] border border-[#EAE4D7] text-xs text-[#B88E4F] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span className="font-semibold">Đang đối chiếu giá và tồn kho từ hệ thống...</span>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-800 space-y-1 shadow-2xs">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Thông báo biến động giỏ hàng từ máy chủ:</span>
                </div>
                {validationWarnings.map((warning, idx) => (
                  <p key={idx} className="pl-5 text-[11px] leading-relaxed">
                    • {warning}
                  </p>
                ))}
              </div>
            )}

            {!currentUser ? (
              <div id="mandatory-auth-gate" className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FBF5EB] to-[#FAF8F5] border-2 border-[#C59B58] shadow-sm text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C59B58] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#EEDFC6] text-[10px] font-bold text-[#B88E4F] uppercase tracking-wider mb-1">
                      XÁC THỰC TÀI KHOẢN KHÁCH HÀNG
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#1A1612]">
                      Đăng nhập để tiếp tục thanh toán
                    </h3>
                    <p className="text-xs text-[#7D715E] mt-1 leading-relaxed">
                      Vui lòng xác thực tài khoản Google hoặc Email để quản lý đơn mua và kích hoạt bảo hộ Escrow 14 ngày.
                    </p>

                    {loginError && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#DC2626] font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <div className={`shrink-0 min-w-[220px] ${isLoggingIn ? 'pointer-events-none opacity-60' : ''}`}>
                        <GoogleOfficialButton
                          onSuccess={onTokenSuccessInCheckout}
                          text="continue_with"
                          onError={(errMsg) => setLoginError(errMsg)}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPasswordLogin(!showPasswordLogin)}
                          className="px-3.5 py-2.5 bg-white border border-[#EAE4D7] hover:border-[#1A1612] text-[#1A1612] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5 text-[#7D715E]" />
                          <span>{showPasswordLogin ? 'Đóng đăng nhập bằng mật khẩu' : 'Đăng nhập bằng mật khẩu'}</span>
                        </button>
                      </div>
                    </div>

                    {showPasswordLogin && (
                      <div className="mt-3.5 p-3.5 bg-white rounded-xl border border-[#EAE4D7] space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            autoComplete="username"
                            aria-label="Email hoặc số điện thoại đã đăng ký"
                            placeholder="Email hoặc số điện thoại"
                            maxLength={254}
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE4D7] rounded-lg text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58]"
                          />
                          <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE4D7] rounded-lg text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58]"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#7D715E]">
                            Chưa có tài khoản? Nhấn nút Google ở trên để đăng ký 1 chạm.
                          </span>
                          <button
                            type="button"
                            disabled={isLoggingIn}
                            onClick={handlePasswordLoginInCheckout}
                            className="px-4 py-2 bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            {isLoggingIn && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>Đăng nhập ngay</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Error Message banner */}
            {errorMessage && (
              <div id="checkout-error" role="alert" tabIndex={-1} className="p-3.5 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#DC2626] flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* BLOCK 1: ĐỊA CHỈ NHẬN HÀNG (Chuẩn SCANMS ẢNH 2) */}
            {/* ========================================================================= */}
            <div className="checkout-section checkout-address" aria-labelledby="checkout-address-title">
              <header className="checkout-section-heading"><h2 id="checkout-address-title"><MapPin size={19} aria-hidden="true" />Địa chỉ nhận hàng</h2></header>
              <div className="checkout-address-body">
                <div className="checkout-address-summary">
                  <div className="checkout-address-summary-info">
                    <strong>{customerName ? `${customerName} · ${customerPhone || 'Chưa có SĐT'}` : 'Chưa nhập thông tin nhận hàng'}</strong>
                    <span>{hasCompleteShippingAddress
                      ? fullShippingAddressString
                      : fullShippingAddressString
                        ? `Đang nhập địa chỉ: ${fullShippingAddressString}`
                        : 'Thêm địa chỉ để tính phí vận chuyển và nhận hàng.'}</span>
                    {hasCompleteShippingAddress && customerAddresses.find(address => address.id === selectedSavedAddressId)?.isDefault
                      ? <span className="checkout-address-label">Mặc định</span>
                      : hasCompleteShippingAddress && !selectedSavedAddressId ? <span className="checkout-address-label">Địa chỉ giao mới</span> : null}
                  </div>
                  <button
                    type="button"
                    className="checkout-address-change disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isEditingAddress && !hasCompleteShippingAddress}
                    onClick={() => setIsEditingAddress(previous => !previous)}
                  >
                    {isEditingAddress ? hasCompleteShippingAddress ? 'Thu gọn' : 'Đang nhập' : 'Thay Đổi'}
                  </button>
                </div>
                {/* Form chi tiết địa chỉ (Mở khi bấm Thay Đổi hoặc khi chưa có địa chỉ) */}
                {(!hasCompleteShippingAddress || isEditingAddress) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3.5 animate-in fade-in duration-150">
                    {/* Sổ địa chỉ đã lưu dạng thẻ card sáng đẹp */}
                    {customerAddresses.length > 0 && (
                      <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#B88E4F] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#B88E4F]" />
                            Chọn từ sổ địa chỉ đã lưu ({customerAddresses.length} địa chỉ)
                          </span>
                          <button
                            type="button"
                            onClick={handleStartNewAddress}
                            className="px-2.5 py-1 text-xs font-bold text-[#B88E4F] hover:bg-[#FBF5EB] rounded-md border border-[#EEDFC6] flex items-center gap-1 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Giao đến địa chỉ khác</span>
                          </button>
                        </div>

                        {!selectedSavedAddressId && (
                          <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-50/90 text-amber-900 text-xs flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-bold">
                              <MapPin className="w-4 h-4 text-[#C59B58] shrink-0" />
                              Đang sử dụng địa chỉ giao hàng mới bên dưới
                            </span>
                            <span className="text-[11px] text-[#7D715E]">
                              (Bấm vào thẻ địa chỉ ở trên nếu muốn dùng lại)
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-2 pt-1">
                          {customerAddresses.map((a) => {
                            const isSelected = selectedSavedAddressId === a.id;
                            return (
                              <div
                                key={a.id}
                                onClick={() => handleSelectSavedAddress(a.id)}
                                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-[#FBF5EB] border-[#C59B58] ring-1 ring-[#C59B58] shadow-2xs'
                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-[#FAF8F5]'
                                }`}
                              >
                                <div className="space-y-1 text-xs min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                        isSelected ? 'border-[#C59B58] bg-[#C59B58]' : 'border-gray-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                    <strong className="text-[#1A1612] font-bold">{a.fullName}</strong>
                                    <span className="text-gray-500 font-mono">({a.phoneNumber})</span>
                                    {a.isDefault && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-[#B88E4F] border border-[#EEDFC6] bg-[#FBF5EB]">
                                        Mặc Định
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-600 pl-5.5 leading-relaxed text-[11px]">
                                    {a.detailAddress}, {a.wardName}, {a.districtName}, {a.provinceName}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-center">
                                  {isSelected && (
                                    <span className="text-[11px] font-bold text-[#B88E4F]">
                                      Đang dùng ✓
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddressToDelete(a);
                                    }}
                                    className="w-7 h-7 rounded-md flex items-center justify-center text-[#DC2626] hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer active:scale-90 shrink-0"
                                    title="Xóa địa chỉ này"
                                    aria-label="Xóa địa chỉ"
                                  >
                                    <Trash2 className="w-4 h-4 text-[#DC2626]" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Họ tên, SĐT, Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label htmlFor="checkout-customer-name" className="block text-xs font-bold text-[#1A1612] mb-1">
                          Họ và tên người nhận <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                          id="checkout-customer-name"
                          type="text"
                          required
                          placeholder="Ví dụ: Hoàng Minh Tuấn"
                          value={customerName}
                          onChange={(e) => {
                            setCustomerName(e.target.value);
                            markAddressEdited();
                          }}
                          className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-xs text-[#1A1612] focus:outline-none focus:border-[#C59B58] transition"
                        />
                      </div>

                      <div>
                        <label htmlFor="checkout-customer-phone" className="block text-xs font-bold text-[#1A1612] mb-1">
                          Số điện thoại nhận hàng <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                          id="checkout-customer-phone"
                          type="tel"
                          required
                          placeholder="Ví dụ: 0987654321"
                          value={customerPhone}
                          onChange={(e) => {
                            setCustomerPhone(e.target.value);
                            markAddressEdited();
                          }}
                          className={`w-full px-3.5 py-2 bg-white border rounded-md text-xs text-[#1A1612] focus:outline-none transition font-mono ${
                            customerPhone && !isPhoneValid(customerPhone)
                              ? 'border-[#DC2626] focus:border-[#DC2626]'
                              : 'border-gray-300 focus:border-[#C59B58]'
                          }`}
                        />
                        {customerPhone && !isPhoneValid(customerPhone) && (
                          <span className="text-[10px] text-[#DC2626] mt-1 block">
                            Số điện thoại chưa đúng định dạng Việt Nam (10 chữ số).
                          </span>
                        )}
                      </div>

                      <div>
                        <label htmlFor="checkout-customer-email" className="block text-xs font-bold text-[#1A1612] mb-1">
                          Email nhận xác nhận đơn
                        </label>
                        <input
                          id="checkout-customer-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          maxLength={254}
                          placeholder="Ví dụ: khachhang@gmail.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-xs text-[#1A1612] focus:outline-none focus:border-[#C59B58] transition"
                        />
                        <p className="mt-1 mb-0 text-[10px] leading-relaxed text-[#7D715E]">Tự động gửi thông tin đơn hàng. Để trống sẽ dùng email tài khoản đang đăng nhập.</p>
                      </div>
                    </div>

                    {/* Địa chỉ 3 cấp: Tỉnh / Quận / Phường */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <CustomSelect
                        id="checkout-province"
                        required
                        value={provinceCode}
                        disabled={addressLoading}
                        onChange={(code) => {
                          setProvinceCode(code);
                          setDistrictCode('');
                          setWardCode('');
                          markAddressEdited(true);
                        }}
                        placeholder={addressLoading ? 'Đang tải Tỉnh/Thành...' : 'Chọn Tỉnh/Thành phố *'}
                        options={shippingProvinces.map((province) => ({
                          value: String(province.code),
                          label: province.name,
                        }))}
                      />

                      <CustomSelect
                        id="checkout-district"
                        required
                        value={districtCode}
                        disabled={!selectedProvince || addressLoading}
                        onChange={(code) => {
                          setDistrictCode(code);
                          setWardCode('');
                          markAddressEdited(true);
                        }}
                        placeholder="Chọn Quận/Huyện *"
                        options={(selectedProvince?.districts || []).map((district) => ({
                          value: String(district.code),
                          label: district.name,
                        }))}
                      />

                      <CustomSelect
                        id="checkout-ward"
                        required
                        value={wardCode}
                        disabled={!selectedDistrict || addressLoading}
                        onChange={(code) => {
                          setWardCode(code);
                          markAddressEdited(true);
                        }}
                        placeholder="Chọn Phường/Xã *"
                        options={(selectedDistrict?.wards || []).map((ward) => ({
                          value: String(ward.code),
                          label: ward.name,
                        }))}
                      />
                    </div>

                    {addressError && (
                      <p role="alert" className="text-[11px] text-[#DC2626] font-medium">{addressError} <button type="button" onClick={() => setAddressLoadRetry(value => value + 1)} className="ml-1 underline underline-offset-2 text-[#8A642C]">Tải lại danh mục</button></p>
                    )}

                    <div>
                      <textarea
                        id="checkout-shipping-address"
                        required
                        rows={2}
                        placeholder="Số nhà, tên đường, ngõ/tổ, tòa nhà, căn hộ... *"
                        value={shippingAddress}
                        aria-invalid={addressValidationField === 'detail'}
                        aria-describedby={addressValidationField === 'detail' ? 'checkout-error' : undefined}
                        onChange={(e) => {
                          setShippingAddress(e.target.value);
                          markAddressEdited(true);
                        }}
                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-xs text-[#1A1612] focus:outline-none focus:border-[#C59B58] transition resize-none"
                      />
                      {shippingAddress.trim().length > 0 && shippingAddress.trim().length < 5 && <p role="status" className="mt-1.5 text-[11px] text-[#795A2D]">Vui lòng bổ sung địa chỉ chi tiết, ít nhất 5 ký tự, để tính phí giao hàng.</p>}
                    </div>

                    <AddressLocationPicker
                      nationwide
                      latitude={deliveryLocation?.latitude}
                      longitude={deliveryLocation?.longitude}
                      resetKey={mapResetKey}
                      addressQuery={[shippingAddress, selectedWard?.name, selectedDistrict?.name, selectedProvince?.name, 'Việt Nam'].filter(Boolean).join(', ')}
                      onChange={handleCheckoutLocationChange}
                    />
                    {mappedAddress && (!selectedProvince || !selectedDistrict || !selectedWard) && (
                      <p role="status" className="text-[11px] leading-relaxed text-[#7D715E]">
                        Đã ghim vị trí. {addressLoading ? 'Đang tải danh mục địa chỉ…' : 'Một số địa danh chưa khớp với danh mục. Vui lòng chọn lại Tỉnh/Thành phố, Quận/Huyện và Phường/Xã trước khi đặt hàng.'}
                      </p>
                    )}

                    {/* Hộp tùy chọn Lưu địa chỉ mới vào Sổ địa chỉ */}
                    {isSignedIn && !selectedSavedAddressId && (
                      <div className="p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-lg space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-xs font-medium text-[#1A1612] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={saveToAddressBook}
                              onChange={(e) => setSaveToAddressBook(e.target.checked)}
                              className="w-4 h-4 rounded text-[#C59B58] focus:ring-[#C59B58] cursor-pointer"
                            />
                            <span>Lưu địa chỉ này vào Sổ địa chỉ của tôi</span>
                          </label>

                          <button
                            type="button"
                            disabled={isSavingAddress}
                            onClick={handleSaveNewAddressNow}
                            className="px-3.5 py-1.5 bg-[#C59B58] hover:bg-[#B88E4F] disabled:opacity-50 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                            title="Lưu địa chỉ này vào Sổ địa chỉ"
                          >
                            {isSavingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Lưu vào sổ địa chỉ ngay</span>
                          </button>
                        </div>

                        {saveToAddressBook && (
                          <label className="flex items-center gap-2 text-[11px] text-[#7D715E] pl-6 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={setAsDefaultAddress}
                              onChange={(e) => setSetAsDefaultAddress(e.target.checked)}
                              className="w-3.5 h-3.5 rounded text-[#C59B58] focus:ring-[#C59B58] cursor-pointer"
                            />
                            <span>Đặt làm địa chỉ nhận hàng mặc định cho tài khoản</span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* BLOCK 2: SẢN PHẨM (Chuẩn SCANMS ẢNH 2 & TIKTOK SHOP) */}
            {/* ========================================================================= */}
            <CheckoutItemsSection
              groups={itemsGroupedByShop}
              shippingFees={shippingFeesByStore}
              notes={orderNotes}
              onNotesChange={setOrderNotes}
              onChat={openChat}
              onEditCart={() => { editCheckoutCart(activeItems); onClose(); }}
              onContinueShopping={() => { continueShoppingFromCheckout(activeItems); onClose(); navigate('/marketplace#catalog-section'); }}
            />
            <CheckoutVoucherSection
              supportsStacked={usesLegacyCheckout}
              onChooseVoucher={!usesLegacyCheckout ? () => { takeManualVoucherControl(); setShowVoucherPicker(true); } : undefined}
              groups={itemsGroupedByShop}
              targetStoreId={targetVoucherStoreId}
              onTargetChange={id => { setVoucherTargetStoreId(id); setAppliedCoupon(null); setAppliedPlatformCoupon(null); setAppliedShippingCoupon(null); setCouponMessage(null); }}
              shop={{ value: couponCode, applied: Boolean(appliedCoupon), busy: couponLoading,
                onChange: value => { takeManualVoucherControl(); setCouponCode(value); setAppliedCoupon(null); setCouponMessage(null); },
                onApply: () => { void handleValidateCoupon(); }, onRemove: handleRemoveCoupon }}
              platform={{ value: platformCouponCode, applied: Boolean(appliedPlatformCoupon), busy: stackedCouponBusy === 'GOODS',
                onChange: value => { setPlatformCouponCode(value); setAppliedPlatformCoupon(null); }, onApply: () => { void applyStackedCoupon('GOODS'); }, onRemove: () => { setAppliedPlatformCoupon(null); setPlatformCouponCode(''); } }}
              shipping={{ value: shippingCouponCode, applied: Boolean(appliedShippingCoupon), busy: stackedCouponBusy === 'SHIPPING' || couponLoading,
                onChange: value => { takeManualVoucherControl(); setShippingCouponCode(value); setAppliedShippingCoupon(null); },
                onApply: () => { if(usesLegacyCheckout) void applyStackedCoupon('SHIPPING'); else void handleChooseVoucherPair({goodsCode:appliedCoupon?.code||'',shippingCode:shippingCouponCode}); },
                onRemove: () => { takeManualVoucherControl(); setAppliedShippingCoupon(null); setShippingCouponCode(''); setCouponMessage(null); } }}
              message={couponMessage}
            />

            <section className="checkout-section checkout-payment" aria-labelledby="checkout-payment-title">
              <CheckoutPaymentMethods method={paymentMethod} onChange={setPaymentMethod} balance={Number(wallet?.availableBalance || 0)} loading={walletLoading} total={finalTotal} payosAvailable={payosAvailable} />
              <dl className="checkout-totals" aria-label="Chi tiết thanh toán">
                <div><dt>Tổng tiền hàng ({activeUnitCount} sản phẩm)</dt><dd>{formatMoney(rawSubtotal)}</dd></div>
                <div><dt>Phí vận chuyển</dt><dd role="status">{shippingAddressHint || shippingFeeError || (shippingFeeLoading ? 'Đang tính cước…' : shippingFee === null ? 'Chưa có phí vận chuyển.' : formatMoney(shippingFee))}{shippingFeeError && !shippingAddressHint && <button type="button" onClick={() => setShippingQuoteRetry(value => value + 1)} className="ml-2 text-[#795A2D] underline underline-offset-2">Tính lại</button>}</dd></div>
                {appliedCoupon && !appliedCoupon.shippingDiscountAmount && <div className="checkout-total-discount"><dt>Voucher giảm tiền hàng ({appliedCoupon.code})</dt><dd>−{formatMoney(discountAmount)}</dd></div>}
                {!!appliedCoupon?.shippingDiscountAmount && <div className="checkout-total-discount"><dt>Voucher vận chuyển ({appliedCoupon.code})</dt><dd>−{formatMoney(appliedCoupon.shippingDiscountAmount)}</dd></div>}
                {appliedPlatformCoupon && <div className="checkout-total-discount"><dt>Voucher SCANMS ({appliedPlatformCoupon.code})</dt><dd>−{formatMoney(appliedPlatformCoupon.discountAmount)}</dd></div>}
                {appliedShippingCoupon && <div className="checkout-total-discount"><dt>Voucher vận chuyển ({appliedShippingCoupon.code})</dt><dd>−{formatMoney(appliedShippingCoupon.discountAmount)}</dd></div>}
                <div className="checkout-total-final"><dt>Tổng thanh toán</dt><dd>{shippingFee === null || shippingFeeError || shippingAddressHint || shippingFeeLoading ? <span>Chờ tính phí ship</span> : formatMoney(finalTotal)}</dd></div>
              </dl>
              {shippingQuoteMode === 'SIMULATED' && <p className="text-xs text-[#795A2D]" role="note">Phí giao hàng mô phỏng: {formatMoney(shippingFee || 0)} cho {itemsGroupedByShop.length} shop. Khách thanh toán cùng tiền hàng; chưa phát sinh phí với hãng vận chuyển.</p>}
              {shippingQuoteMode === 'GHN_SANDBOX' && <p className="text-xs leading-6 text-[#795A2D]" role="note">Cước GHN sandbox theo tuyến giao hàng và khối lượng kiện thử nghiệm. Đây là môi trường kiểm thử, chưa tạo đơn giao hàng thật. Các địa chỉ cùng tuyến có thể có cùng phí.</p>}

              <details className="checkout-policy-details" id="checkout-return-policies">
                <summary><span><ShieldCheck size={16} aria-hidden="true" />Chính sách đổi trả & giao hàng của các gian hàng</span><ChevronDown size={15} aria-hidden="true" /></summary>
                <div className="checkout-policy-details-body">
                  {policyLoading ? <p>Đang tải chính sách Shop…</p> : policyError ? <p className="checkout-policy-error">{policyError}</p> : itemsGroupedByShop.map(group => {
                    const policy = shopPolicies[group.store.id];
                    return <article key={group.store.id}><h3>{group.store.name}</h3>{policy ? <>
                      <p>{policy.policyReturn || 'Shop chưa công bố nội dung đổi trả riêng.'}</p>
                      {policy.policyWarranty && <p><strong>Bảo hành: </strong>{policy.policyWarranty}</p>}
                      {policy.policyShipping && <p><strong>Giao hàng: </strong>{policy.policyShipping}</p>}
                    </> : <p className="checkout-policy-error">Chưa tải được chính sách của gian hàng. Vui lòng thử lại sau.</p>}</article>;
                  })}
                </div>
              </details>
              {policyError && <p className="checkout-payment-notice checkout-policy-error" role="alert">{policyError}</p>}
              <footer className="checkout-place-order">
                <label htmlFor="checkout-policy-agreement"><input id="checkout-policy-agreement" type="checkbox" checked={policyAccepted} disabled={policyLoading || Boolean(policyError) || itemsGroupedByShop.some(group => !shopPolicies[group.store.id])} onChange={event => { setPolicyAccepted(event.target.checked); if (event.target.checked && errorMessage?.includes('chính sách đổi trả')) setErrorMessage(null); }} /><span>Tôi đã đọc và đồng ý với <a href="#checkout-return-policies" onClick={event => { event.preventDefault(); const details = document.getElementById('checkout-return-policies') as HTMLDetailsElement | null; if (details) { details.open = true; details.scrollIntoView({ block: 'center' }); details.querySelector('summary')?.focus(); } }}>chính sách đổi trả, giao hàng của các gian hàng</a> trong đơn.</span></label>
                <button type="submit" className="checkout-submit" disabled={isSubmitting || activeItems.length === 0}>{isSubmitting ? <><Loader2 size={17} className="animate-spin" aria-hidden="true" />Đang đặt hàng…</> : !currentUser ? 'Đăng nhập để đặt hàng' : 'Đặt hàng'}</button>
              </footer>
            </section>
          </form>
        )}
      </main>

      {/* Modal xác nhận xóa địa chỉ - Chuẩn SCANMS & các sàn lớn (Chỉ xóa khi bấm xác nhận, không bao giờ tự động đếm giờ) */}
      {showVoucherPicker && <PlatformVoucherPicker storeId={targetVoucherStoreId} subtotal={rawSubtotal}
        selectedCode={appliedCoupon?.code || ''} selectedShippingCode={appliedShippingCoupon?.code || ''} busy={couponLoading}
        error={couponMessage?.type === 'error' ? couponMessage.text : null}
        onClose={() => setShowVoucherPicker(false)} onChoosePair={handleChooseVoucherPair} />}
      {addressToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => !isDeletingAddress && setAddressToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-address-title"
          >
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="delete-address-title" className="text-base font-bold text-[#1A1612]">
                  Xóa địa chỉ nhận hàng?
                </h3>
                <p className="text-xs text-[#7D715E] mt-0.5 leading-relaxed">
                  Địa chỉ này sẽ bị xóa khỏi sổ địa chỉ của bạn. Thao tác này không thể hoàn tác.
                </p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 mb-5 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#1A1612] mb-1">
                <span>{addressToDelete.fullName}</span>
                <span className="text-gray-400">|</span>
                <span className="font-mono text-gray-600 font-medium">{addressToDelete.phoneNumber}</span>
                {addressToDelete.isDefault && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-[#B88E4F] border border-[#EEDFC6] bg-[#FBF5EB]">
                    Mặc định
                  </span>
                )}
              </div>
              <div className="text-gray-600 leading-relaxed text-[11px]">
                {[
                  addressToDelete.detailAddress,
                  addressToDelete.wardName,
                  addressToDelete.districtName,
                  addressToDelete.provinceName,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={isDeletingAddress}
                onClick={() => setAddressToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition cursor-pointer select-none active:scale-95 disabled:opacity-50"
              >
                Trở lại
              </button>
              <button
                type="button"
                disabled={isDeletingAddress}
                onClick={() => handleExecuteDeleteAddress(addressToDelete)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-rose-700 rounded-lg transition cursor-pointer select-none active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {isDeletingAddress ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                    <span>Xác nhận xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
