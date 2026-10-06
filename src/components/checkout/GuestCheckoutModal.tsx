import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckoutPaymentQr } from './CheckoutPaymentQr';
import { PaymentBankDetails, type ReceivingAccount } from './PaymentBankDetails';
import {
  X,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Truck,
  QrCode,
  Tag,
  Loader2,
  Store as StoreIcon,
  Package,
  MapPin,
  ExternalLink,
  Pencil,
  ShoppingCart,
  Lock,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import { financeService } from '../../services/finance.service';
import { checkoutService, usesLegacyCheckout } from '../../services/checkout.service';
import { apiCache } from '../../utils/apiCache';
import { authService } from '../../services/auth.service';
import { customerService, type CustomerAddress } from '../../services/customer.service';
import { GoogleOfficialButton } from '../auth/GoogleOfficialButton';
import { toast } from '../../utils/toast';
import {
  loadShippingAddresses,
  type ShippingProvince,
} from '../../services/order-address.service';
import { useCart, type CartItem } from '../../context/CartContext';
import { formatMoney } from '../../features/marketplace/marketplaceUtils';
import { formatSavedAddressOption, resolveSavedShippingAddress } from '../../utils/checkoutAddress';

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
  initialVariantId?: string;
  onOrderPlaced?: (orderData: any) => void;
}

export const GuestCheckoutModal: React.FC<GuestCheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  store,
  checkoutItems,
  initialQuantity = 1,
  initialCouponCode = '',
  initialVariantId,
  onOrderPlaced,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { removeItems, editCheckoutCart, continueShoppingFromCheckout } = useCart();
  const isSignedIn = Boolean(localStorage.getItem('token') && authService.getCurrentUser());
  const [currentUser, setCurrentUser] = useState<any>(() => authService.getCurrentUser());

  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string>('');

  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
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
        customerService.getAddresses().then((addrs) => {
          if (Array.isArray(addrs) && addrs.length > 0) {
            setCustomerAddresses(addrs);
            const def = addrs.find((a) => a.isDefault) || addrs[0];
            if (def) {
              setSelectedSavedAddressId(def.id);
            }
          }
        }).catch(() => {});
      }
      toast.success('Đăng nhập thành công! Vui lòng hoàn tất thông tin đặt hàng.');
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || err?.message || 'Đăng nhập Google thất bại');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailLoginInCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res: any = await authService.login(loginEmail.trim(), loginPassword);
      const user = res?.user || authService.getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setCustomerName(user.fullName || '');
        setCustomerEmail(user.email || '');
        if (user.phoneNumber) setCustomerPhone(user.phoneNumber);
        customerService.getAddresses().then((addrs) => {
          if (Array.isArray(addrs) && addrs.length > 0) {
            setCustomerAddresses(addrs);
            const def = addrs.find((a) => a.isDefault) || addrs[0];
            if (def) {
              setSelectedSavedAddressId(def.id);
            }
          }
        }).catch(() => {});
      }
      toast.success('Đăng nhập thành công! Vui lòng hoàn tất thông tin đặt hàng.');
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || err?.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingProvinces, setShippingProvinces] = useState<ShippingProvince[]>([]);
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [shopPolicies, setShopPolicies] = useState<Record<string, CheckoutStoreInfo>>({});
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);

  // Payment Method: Default to COD (reliable & always available), with PayOS option
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'PAYOS'>('PAYOS');

  // Single-product fallback state
  const [singleQuantity] = useState(initialQuantity);
  const [selectedVariantId] = useState<string | undefined>(initialVariantId);

  // Coupons
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

  // Pre-checkout validation state (Requirement 6)
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isValidatingCart, setIsValidatingCart] = useState(false);

  // Submission state
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Order Placement Success Details (Supports single & multi-store orders)
  const [orderSuccess, setOrderSuccess] = useState<{
    isMultiStore?: boolean;
    publicOrderCode: string;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    orders: Array<{
      publicOrderCode: string;
      storeId?: string;
      storeName?: string;
      finalAmount: number;
      trackingUrl?: string;
      items?: any[];
      paymentStatus?: string;
      payos?: ReceivingAccount & { checkoutUrl: string; qrCode: string };
      paymentError?: string;
    }>;
    paymentError?: string;
    payos?: {
      paymentId?: string;
      qrCode: string;
      checkoutUrl: string;
      bin?: string | null;
      accountNumber?: string | null;
      accountName?: string | null;
      description?: string | null;
      amount: number;
    };
    cancellationToken?: string;
    confirmationEmailQueued?: boolean;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [payosAvailable, setPayosAvailable] = useState<boolean | null>(null);

  // Normalize active items to order
  const activeItems = useMemo<CartItem[]>(() => {
    if (checkoutItems && checkoutItems.length > 0) {
      return checkoutItems;
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
          variantName: matchedVariant?.name,
          title: product.title,
          sku: matchedVariant?.sku || product.sku || '',
          price: unitPrice,
          originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
          imageUrl: product.imageUrl || '/assets/marketplace/scanms-placeholder.png',
          quantity: singleQuantity,
          stockQuantity: matchedVariant ? matchedVariant.stockQuantity : product.stockQuantity,
          isActive: true,
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
  }, [checkoutItems, product, store, selectedVariantId, singleQuantity]);

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
  const policyStoreIds = itemsGroupedByShop.map((group) => group.store.id).join(',');

  useEffect(() => {
    if (!isOpen || !policyStoreIds) return;
    let active = true;
    setPolicyLoading(true);
    setPolicyError(null);
    setPolicyAccepted(false);
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
  const finalTotal = Math.max(0, rawSubtotal - discountAmount);

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

  // Status check for PayOS
  useEffect(() => {
    if (!isOpen || !orderSuccess?.payos || orderSuccess.paymentStatus === 'PAID') return;
    if (!usesLegacyCheckout && !orderSuccess.payos.paymentId) return;
    const check = async () => {
      try {
        if (usesLegacyCheckout && orderSuccess.isMultiStore) {
          const statuses = await Promise.all(orderSuccess.orders.map(async order => ({ code: order.publicOrderCode, result: await checkoutService.legacyPaymentStatus(order.publicOrderCode) })));
          setOrderSuccess(current => current ? { ...current, paymentStatus: statuses.every(row => row.result.paymentStatus === 'PAID') ? 'PAID' : 'UNPAID', orders: current.orders.map(order => ({ ...order, paymentStatus: statuses.find(row => row.code === order.publicOrderCode)?.result.paymentStatus || order.paymentStatus })) } : current);
          return;
        }
        const response = usesLegacyCheckout
          ? await checkoutService.legacyPaymentStatus(orderSuccess.publicOrderCode)
          : await financeService.paymentStatus(orderSuccess.payos!.paymentId!);
        const status = usesLegacyCheckout ? response.paymentStatus : response.status === 'SUCCESS' ? 'PAID' : response.status;
        if (status === 'PAID') {
          setOrderSuccess((current) => (current ? { ...current, paymentStatus: 'PAID' } : current));
        }
      } catch {
        /* Keep pending until the signed webhook is received. */
      }
    };
    const timer = window.setInterval(check, 5000);
    return () => window.clearInterval(timer);
  }, [isOpen, orderSuccess?.payos, orderSuccess?.orders, orderSuccess?.isMultiStore, orderSuccess?.publicOrderCode, orderSuccess?.paymentStatus]);

  // Auth requirement check (Requirement 5)
  useEffect(() => {
    if (isOpen && !isSignedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
    }
  }, [isOpen, isSignedIn, location.pathname, location.search, navigate]);

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
    if (isOpen) {
      setPolicyAccepted(false);
      const user = authService.getCurrentUser();

      if (user) {
        setCustomerName(user.fullName || '');
        setCustomerEmail(user.email || '');
        if (user.phoneNumber) setCustomerPhone(user.phoneNumber);

        if (user.role === 'CUSTOMER') {
          customerService
            .getAddresses()
            .then((addrs) => {
              if (Array.isArray(addrs) && addrs.length > 0) {
                setCustomerAddresses(addrs);
                const def = addrs.find((a) => a.isDefault) || addrs[0];
                if (def) {
                  setSelectedSavedAddressId(def.id);
                  setShippingAddress(def.detailAddress);
                  if (def.fullName) setCustomerName(def.fullName);
                  if (def.phoneNumber) setCustomerPhone(def.phoneNumber);
                }
              }
            })
            .catch(() => {});
        }
      }

      const newKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setIdempotencyKey(newKey);

      // Pre-checkout validation (Requirement 6)
      if (activeItems.length > 0) {
        setIsValidatingCart(true);
        api
          .post('/orders/validate-cart', {
            items: activeItems.map((i) => ({
              productId: i.productId,
              variantId: i.variantId || undefined,
              quantity: i.quantity,
              clientPrice: i.price,
            })),
          })
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
  }, [isOpen]);

  // Load Shipping Provinces
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setAddressLoading(true);
    setAddressError(null);
    loadShippingAddresses()
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
    };
  }, [isOpen]);

  const selectedProvince = shippingProvinces.find((p) => String(p.code) === String(provinceCode));
  const selectedDistrict = selectedProvince?.districts.find((d) => String(d.code) === String(districtCode));
  const selectedWard = selectedDistrict?.wards.find((w) => String(w.code) === String(wardCode));

  const applySavedAddress = useCallback((addrId: string) => {
    const addr = customerAddresses.find((a) => a.id === addrId);
    if (!addr) return;

    if (addr.fullName) setCustomerName(addr.fullName);
    if (addr.phoneNumber) setCustomerPhone(addr.phoneNumber);

    const resolved = resolveSavedShippingAddress(addr, shippingProvinces);
    setShippingAddress(resolved.detailAddress);
    setProvinceCode(resolved.provinceCode);
    setDistrictCode(resolved.districtCode);
    setWardCode(resolved.wardCode);
  }, [customerAddresses, shippingProvinces]);

  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedSavedAddressId(addrId);
    if (addrId) applySavedAddress(addrId);
  };

  // Address data and the province catalog load independently. Re-apply the
  // selected address once both are available so all three selects are filled.
  useEffect(() => {
    if (!isOpen || !selectedSavedAddressId || shippingProvinces.length === 0) return;
    applySavedAddress(selectedSavedAddressId);
  }, [applySavedAddress, isOpen, selectedSavedAddressId, shippingProvinces.length]);

  const isPhoneValid = (phone: string) => /^(0[3|5|7|8|9])[0-9]{8}$/.test(phone.trim());
  const isEmailValid = (email: string) =>
    !email.trim() || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());

  // Validate coupon
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const data = await checkoutService.quote({ couponCode: couponCode.trim(), storeId: activeItems[0]?.store.id || store?.id, customerPhone: customerPhone.trim() || undefined, items: activeItems.map(item => ({ productId: item.productId, variantId: item.variantId || undefined, quantity: item.quantity, unitPrice: item.price })) });
      setAppliedCoupon({
        code: data.code,
        discountAmount: Number(data.discountAmount) || 0,
        discountType: data.discountType,
      });
      setCouponMessage({
        type: 'success',
        text: `Áp dụng thành công! Tiết kiệm ${Number(data.discountAmount).toLocaleString('vi-VN')} ₫.`,
      });
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc không áp dụng được.',
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
  };

  // Submit Order (Requirements 7, 8, 9, 10)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentUser && (!localStorage.getItem('token') || !authService.getCurrentUser())) {
      setErrorMessage(
        'Vui lòng đăng nhập hoặc xác thực với Google trước khi hoàn tất đặt hàng để kích hoạt quyền lợi bảo hộ đơn hàng và chính sách Escrow 14 ngày.',
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
        'PayOS hiện chưa sẵn sàng. Vui lòng thử lại sau hoặc chọn thanh toán khi nhận hàng (COD).',
      );
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

    if (!isEmailValid(customerEmail)) {
      setErrorMessage('Email nhận thông tin đơn hàng không hợp lệ.');
      return;
    }

    const addressDetail = shippingAddress.trim();
    if (!addressDetail || addressDetail.length < 5) {
      setErrorMessage('Vui lòng nhập số nhà, tên đường hoặc tòa nhà (ít nhất 5 ký tự).');
      return;
    }

    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      setErrorMessage('Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Phường/Xã.');
      return;
    }

    if (!policyAccepted || policyLoading || policyError || itemsGroupedByShop.some((group) => !shopPolicies[group.store.id])) {
      setErrorMessage('Bạn cần đọc và đồng ý chính sách đổi trả của các gian hàng trước khi đặt mua.');
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
      const payload = {
        storeId: activeItems[0]?.store.id || store?.id,
        customerName: trimmedName,
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim().toLowerCase() || undefined,
        shippingAddress: fullShippingAddress,
        policyAccepted: true,
        orderNotes: orderNotes.trim() || undefined,
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
        idempotencyKey,
        items: activeItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
        })),
      };

      const res = await checkoutService.create(payload);
      const rawResponse = res as any;
      const resData = rawResponse?.result || rawResponse?.data?.data || rawResponse?.data || rawResponse;

      // Extract created orders list (Requirement 8 & 10)
      const isMultiStore = Boolean(resData.isMultiStore);
      const rawOrders = Array.isArray(resData.orders) && resData.orders.length > 0 ? resData.orders : [resData];

      const formattedOrders = rawOrders.map((o: any) => ({
        publicOrderCode: o.publicOrderCode || o.externalOrderSn || o.order?.externalOrderSn || resData.publicOrderCode,
        storeId: o.store?.id || o.storeId,
        storeName: o.store?.name || o.storeName || 'Gian Hàng Đối Tác',
        finalAmount: Number(o.finalAmount !== undefined ? o.finalAmount : o.order?.finalAmount || resData.finalAmount || 0),
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
      };

      // If PayOS was chosen and available, fetch link
      if (paymentMethod === 'PAYOS' && payosAvailable) {
        try {
          if (usesLegacyCheckout) {
            if (!primaryOrderCode) throw new Error('Backend chưa trả mã đơn để tạo thanh toán.');
            if (isMultiStore) {
              const links = await Promise.all(orderResult.orders.map(async order => {
                try {
                  const link = await checkoutService.legacyPaymentLink(order.publicOrderCode);
                  if (!link.qrCode || !/^https:\/\/pay\.payos\.vn\//.test(link.checkoutUrl || '')) throw new Error('Liên kết PayOS trả về không hợp lệ.');
                  return { ...order, payos: link, paymentStatus: link.paymentStatus || 'UNPAID' };
                } catch (e) { return { ...order, paymentError: e instanceof Error ? e.message : 'Chưa tạo được link PayOS.' }; }
              }));
              orderResult.orders = links;
              orderResult.payos = links.find(order => order.payos)?.payos as NonNullable<typeof orderResult.payos> | undefined;
              orderResult.paymentStatus = links.every(order => order.paymentStatus === 'PAID') ? 'PAID' : 'UNPAID';
            } else {
              const payment = await checkoutService.legacyPaymentLink(primaryOrderCode);
              if (!payment.qrCode || !/^https:\/\/pay\.payos\.vn\//.test(payment.checkoutUrl || '')) throw new Error('Liên kết PayOS trả về không hợp lệ.');
              orderResult.payos = payment;
              orderResult.paymentStatus = payment.paymentStatus || orderResult.paymentStatus;
            }
          } else {
            const orderId = resData.orderId || resData.order?.orderId;
            if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) throw new Error('Dịch vụ đơn hàng chưa trả mã Order UUID cho thanh toán. Đơn đã được tạo; liên hệ hỗ trợ để kiểm tra.');
            const payment = await financeService.payment(orderId, `checkout:${idempotencyKey}`);
            orderResult.payos = { paymentId: payment.paymentId, qrCode: payment.qrCode || '', checkoutUrl: `/payment/payos-return?payment=${payment.paymentId}`, bin: payment.bin, accountNumber: payment.accountNumber, accountName: payment.accountName, description: payment.description, amount: payment.amountVnd };
          }
        } catch (error) {
          orderResult.paymentError = error instanceof Error ? error.message : 'Chưa tạo được thanh toán. Kiểm tra giao dịch trước khi thử lại.';
        }
      }
      // Requirement 10: Only remove placed items from cart!
      const placedCartItemIds = activeItems.map((i) => i.cartItemId);
      removeItems(placedCartItemIds);

      // Save recent order code for guest lookup
      localStorage.setItem(
        'scanms-recent-guest-order',
        JSON.stringify({ publicOrderCode: primaryOrderCode, createdAt: Date.now() }),
      );

      setOrderSuccess(orderResult);
      if (onOrderPlaced) {
        onOrderPlaced(orderResult);
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
      setErrorMessage(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-checkout-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FFFFFF] rounded-3xl max-w-4xl lg:max-w-5xl xl:max-w-6xl w-full p-5 sm:p-7 lg:p-8 border border-[#EAE4D7] shadow-2xl relative max-h-[92vh] overflow-y-auto font-sans text-left"
      >
        {/* Close Button at Top Right Corner */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
          title="Đóng cửa sổ"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-10 h-10 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58] text-[#7D715E] hover:text-[#1A1612] flex items-center justify-center transition-all duration-200 active:scale-90 shadow-2xs cursor-pointer z-30 group"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        </button>

        {orderSuccess ? (
          /* Order Confirmation Screen (Requirement 10) */
          <div className="max-w-2xl mx-auto py-2 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FBF5EB] border-2 border-[#C59B58] text-[#B88E4F] flex items-center justify-center mx-auto mb-3 shadow-xs">
              {orderSuccess.paymentMethod === 'PAYOS' && orderSuccess.paymentStatus !== 'PAID'
                ? <QrCode className="w-10 h-10" />
                : <CheckCircle2 className="w-10 h-10" />}
            </div>

            <h2 id="guest-checkout-title" className="text-2xl font-black text-[#1A1612] mb-1">
              {orderSuccess.paymentMethod === 'PAYOS'
                ? orderSuccess.paymentStatus === 'PAID' ? 'PayOS đã xác nhận thanh toán' : 'Đơn đã tạo — chờ thanh toán PayOS'
                : 'Đã tạo đơn thanh toán khi nhận hàng (COD)'}
            </h2>
            <p className="text-xs text-[#7D715E] mb-5 max-w-md mx-auto">
              {orderSuccess.paymentMethod === 'PAYOS' && orderSuccess.paymentStatus !== 'PAID'
                ? 'Bạn chưa thanh toán. Quét mã QR bên dưới và xác nhận chuyển tiền trong ứng dụng ngân hàng. Hệ thống chỉ xác nhận sau khi kiểm tra đã nhận tiền.'
                : orderSuccess.isMultiStore
                ? `Hệ thống đã tự động tách thành ${orderSuccess.orders.length} đơn con tương ứng cho từng Gian hàng để xử lý và giao hàng tận nơi.`
                : 'Đơn hàng của bạn đã được ghi nhận vào hệ thống SCANMS và gửi tới gian hàng để đóng gói.'}
            </p>

            {orderSuccess.confirmationEmailQueued && customerEmail.trim() && (
              <div className="mb-4 rounded-xl border border-[#EAE4D7] bg-[#FBF5EB] px-3 py-2 text-left text-[11px] text-[#7D715E]">
                Mã đơn và liên kết tra cứu đang được gửi tới{' '}
                <strong className="text-[#1A1612]">{customerEmail.trim().toLowerCase()}</strong>.
              </div>
            )}

            {/* List of Created Orders (Requirement 10: Mã từng đơn, Shop tương ứng, đường theo dõi) */}
            <div className="space-y-3 mb-5">
              {orderSuccess.orders.map((subOrder, index) => (
                <div
                  key={subOrder.publicOrderCode || index}
                  className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl p-4 text-left space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAE4D7]">
                    <div className="flex items-center gap-2">
                      <StoreIcon className="w-4 h-4 text-[#B88E4F]" />
                      <strong className="text-xs sm:text-sm font-bold text-[#1A1612]">
                        {subOrder.storeName || 'Gian Hàng Đối Tác'}
                      </strong>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-[#F3EFE6] text-[#B88E4F] text-[11px] font-black">
                      {formatMoney(subOrder.finalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#7D715E] text-[11px] block">MÃ ĐƠN HÀNG:</span>
                      <strong className="text-sm font-mono text-[#1A1612]">
                        {subOrder.publicOrderCode}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(subOrder.publicOrderCode)}
                        className="px-2.5 py-1.5 bg-[#F3EFE6] hover:bg-[#EAE4D7] text-[#1A1612] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Sao chép mã đơn hàng"
                      >
                        {copiedCode === subOrder.publicOrderCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#B88E4F]" />
                        )}
                        <span>{copiedCode === subOrder.publicOrderCode ? 'Đã chép' : 'Sao chép'}</span>
                      </button>

                      <Link
                        to={`/tracking?sn=${encodeURIComponent(subOrder.publicOrderCode)}`}
                        target="_blank"
                        className="px-2.5 py-1.5 bg-[#EBD08C] hover:bg-[#DEC07A] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Tra cứu</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {orderSuccess.paymentError && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-amber-900">{orderSuccess.paymentError}</p>}
            {/* PayOS QR Box if PayOS payment method was selected */}
            {orderSuccess.paymentMethod === 'PAYOS' && orderSuccess.payos && (!usesLegacyCheckout || !orderSuccess.isMultiStore) && (
              <div className="bg-[#FFFFFF] border-2 border-[#C59B58] rounded-2xl p-4 text-center mb-5 shadow-sm">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FBF5EB] rounded-full text-xs font-bold text-[#B88E4F] mb-3">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>
                    {orderSuccess.paymentStatus === 'PAID'
                      ? 'PAYOS ĐÃ XÁC NHẬN THANH TOÁN'
                      : 'QUÉT MÃ PAYOS ĐỂ THANH TOÁN'}
                  </span>
                </div>

                {orderSuccess.paymentStatus !== 'PAID' && <CheckoutPaymentQr
                  qrCode={orderSuccess.payos.qrCode}
                  recoveryUrl={orderSuccess.payos.paymentId
                    ? `/payment/payos-return?payment=${encodeURIComponent(orderSuccess.payos.paymentId)}`
                    : `/payment/payos-return?order=${encodeURIComponent(orderSuccess.publicOrderCode)}`}
                />}

                <PaymentBankDetails payment={orderSuccess.payos} />

              </div>
            )}

            {usesLegacyCheckout && orderSuccess.isMultiStore && orderSuccess.paymentMethod === 'PAYOS' && <div className="mb-5 space-y-3 rounded-2xl border p-4">
              <strong>Thanh toán PayOS riêng cho từng shop</strong>
              {orderSuccess.orders.map(order => <article key={order.publicOrderCode} className="space-y-2 rounded-xl border p-3">
                <p>{order.storeName} · {order.publicOrderCode}</p>
                <p>{formatMoney(order.payos?.amount ?? order.finalAmount)} · {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}</p>
                {order.paymentError && <p role="alert">{order.paymentError}</p>}
                {order.payos && order.paymentStatus !== 'PAID' && <CheckoutPaymentQr qrCode={order.payos.qrCode} recoveryUrl={`/payment/payos-return?order=${encodeURIComponent(order.publicOrderCode)}`} />}
                {order.payos && <PaymentBankDetails payment={order.payos} />}
                {!order.payos && <Link className="block underline" to={`/payment/payos-return?order=${encodeURIComponent(order.publicOrderCode)}`}>Kiểm tra và tạo lại link thanh toán</Link>}
              </article>)}
            </div>}

            {/* COD Notice */}
            {orderSuccess.paymentMethod === 'COD' && (
              <div className="p-3.5 rounded-2xl bg-[#FBF5EB] border border-[#EAE4D7] text-xs text-[#B88E4F] flex items-center gap-2.5 mb-5 text-left">
                <Truck className="w-5 h-5 shrink-0" />
                <div>
                  <strong className="block text-[#1A1612]">Thanh toán tiền mặt khi nhận hàng (COD)</strong>
                  <span>Nhân viên giao vận sẽ liên hệ với bạn trước khi giao. Vui lòng kiểm tra kiện hàng trước khi thanh toán.</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Link
                to="/customer/orders"
                onClick={onClose}
                className="w-full py-3 bg-[#EBD08C] hover:bg-[#DEC07A] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Xem danh sách đơn mua trong tài khoản</span>
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
          /* Checkout Form (Requirements 6, 7, 8, 9) */
          <div>
<div className="mb-6 pb-4 border-b border-[#EAE4D7] pr-8 sm:pr-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[10px] font-bold text-[#B88E4F] uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span>SCANMS SECURE CHECKOUT • XÁC THỰC DANH TÍNH & BẢO HỘ ĐƠN HÀNG 100%</span>
              </div>
              <h2 id="guest-checkout-title" className="text-xl sm:text-2xl font-black text-[#1A1612]">
                Thông Tin Giao Hàng & Thanh Toán
              </h2>
            </div>

            {isValidatingCart && (
              <div className="mb-4 p-2.5 rounded-xl bg-[#FBF5EB] border border-[#EAE4D7] text-xs text-[#B88E4F] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span className="font-semibold">Đang đối chiếu giá và tồn kho từ hệ thống...</span>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-800 space-y-1">
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
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#EEDFC6] text-[10px] font-black text-[#B88E4F] uppercase tracking-wider mb-1">
                      BẮT BUỘC XÁC THỰC KHÁCH HÀNG (MANDATORY AUTH GATE)
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-[#1A1612]">
                      Đăng Nhập Hoặc Xác Thực Google Trước Khi Đặt Hàng
                    </h3>
                    <p className="text-xs text-[#7D715E] mt-1 leading-relaxed">
                      Hệ thống SCANMS yêu cầu liên kết tài khoản để đảm bảo:
                      <span className="font-semibold text-[#1A1612]"> (1) Kích hoạt Quỹ Bảo Chứng Escrow 14 ngày</span>,
                      <span className="font-semibold text-[#1A1612]"> (2) Quyền gửi khiếu nại Trọng tài độc lập</span>, và
                      <span className="font-semibold text-[#1A1612]"> (3) Quản lý đơn hàng trong tài khoản</span>.
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
                          onClick={() => setShowEmailLogin(!showEmailLogin)}
                          className="px-3.5 py-2.5 bg-white border border-[#EAE4D7] hover:border-[#1A1612] text-[#1A1612] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5 text-[#7D715E]" />
                          <span>{showEmailLogin ? 'Đóng đăng nhập Email' : 'Đăng nhập Email'}</span>
                        </button>
                      </div>
                    </div>

                    {showEmailLogin && (
                      <div className="mt-3.5 p-3.5 bg-white rounded-xl border border-[#EAE4D7] space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="email"
                            placeholder="Email tài khoản"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
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
                            onClick={handleEmailLoginInCheckout}
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
            ) : (
              <div className="mb-4 p-3 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-xs text-[#1A1612] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                  <span>
                    Khách hàng: <strong className="text-[#1A1612]">{currentUser.fullName || currentUser.email}</strong> ({currentUser.email})
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#059669] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã xác thực danh tính
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#DC2626] flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrder}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-3">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#EAE4D7]">
                      <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#EBD08C] to-[#DEC07A] text-[#231D15] text-xs font-black flex items-center justify-center shadow-xs ring-2 ring-[#DEC07A]/30 shrink-0">
                        1
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-[#1A1612]">Thông Tin Người Nhận</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className="w-full px-3.5 py-2.5 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58] transition"
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
                          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-[#1A1612] focus:outline-hidden transition font-mono ${
                            customerPhone && !isPhoneValid(customerPhone)
                              ? 'border-[#DC2626] focus:border-[#DC2626]'
                              : 'border-[#EAE4D7] focus:border-[#C59B58]'
                          }`}
                        />
                        {customerPhone && !isPhoneValid(customerPhone) && (
                          <span className="text-[10px] text-[#DC2626] mt-1 block">
                            Số điện thoại chưa đúng định dạng Việt Nam (10 chữ số).
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="checkout-customer-email" className="block text-xs font-bold text-[#1A1612] mb-1">
                        Email nhận xác nhận đơn <span className="font-medium text-[#7D715E]">(Tùy chọn)</span>
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
                        className="w-full px-3.5 py-2.5 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58] transition"
                      />
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-3">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#EAE4D7]">
                      <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#EBD08C] to-[#DEC07A] text-[#231D15] text-xs font-black flex items-center justify-center shadow-xs ring-2 ring-[#DEC07A]/30 shrink-0">
                        2
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-[#1A1612]">Địa Chỉ Nhận Hàng</h3>
                    </div>

                    {customerAddresses.length > 0 && (
                      <div className="min-w-0 rounded-xl border border-[#EAE4D7] bg-[#FBF5EB] px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#B88E4F] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#B88E4F]" />
                            Sổ địa chỉ của bạn ({customerAddresses.length} địa chỉ)
                          </span>
                        </div>
                        <select
                          value={selectedSavedAddressId}
                          onChange={(e) => handleSelectSavedAddress(e.target.value)}
                          aria-label="Chọn địa chỉ nhận hàng đã lưu"
                          className="block w-full min-w-0 truncate rounded-xl border border-[#EAE4D7] bg-white px-3 py-2 text-xs font-medium text-[#1A1612] outline-hidden focus:border-[#C59B58]"
                        >
                          <option value="">Chọn địa chỉ đã lưu</option>
                          {customerAddresses.map((a) => (
                            <option key={a.id} value={a.id}>
                              {formatSavedAddressOption(a, shippingProvinces)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <select
                        required
                        value={provinceCode}
                        disabled={addressLoading}
                        onChange={(e) => {
                          setProvinceCode(e.target.value);
                          setDistrictCode('');
                          setWardCode('');
                        }}
                        className="w-full appearance-none rounded-xl border border-[#EAE4D7] bg-white px-3.5 py-2.5 text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58]"
                      >
                        <option value="">{addressLoading ? 'Đang tải Tỉnh/Thành...' : 'Chọn Tỉnh/Thành phố *'}</option>
                        {shippingProvinces.map((province) => (
                          <option key={province.code} value={province.code}>
                            {province.name}
                          </option>
                        ))}
                      </select>

                      <select
                        required
                        value={districtCode}
                        disabled={!selectedProvince || addressLoading}
                        onChange={(e) => {
                          setDistrictCode(e.target.value);
                          setWardCode('');
                        }}
                        className="w-full appearance-none rounded-xl border border-[#EAE4D7] bg-white px-3.5 py-2.5 text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58]"
                      >
                        <option value="">Chọn Quận/Huyện *</option>
                        {selectedProvince?.districts.map((district) => (
                          <option key={district.code} value={district.code}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <select
                      required
                      value={wardCode}
                      disabled={!selectedDistrict || addressLoading}
                      onChange={(e) => setWardCode(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[#EAE4D7] bg-white px-3.5 py-2.5 text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58]"
                    >
                      <option value="">Chọn Phường/Xã *</option>
                      {selectedDistrict?.wards.map((ward) => (
                        <option key={ward.code} value={ward.code}>
                          {ward.name}
                        </option>
                      ))}
                    </select>

                    {addressError && (
                      <p className="text-[11px] text-[#DC2626] font-medium">{addressError}</p>
                    )}

                    <textarea
                      required
                      rows={2}
                      placeholder="Số nhà, tên đường, tòa nhà, căn hộ... *"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58] transition resize-none"
                    />
                  </div>

                  {/* Card 3: Payment Method Selection (Requirement 9) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-3">
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#EAE4D7]">
                      <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#EBD08C] to-[#DEC07A] text-[#231D15] text-xs font-black flex items-center justify-center shadow-xs ring-2 ring-[#DEC07A]/30 shrink-0">
                        3
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-[#1A1612]">Phương Thức Thanh Toán</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* COD Option */}
                      <label
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          paymentMethod === 'COD'
                            ? 'bg-[#FBF5EB] border-[#C59B58] ring-2 ring-[#DEC07A]/30 shadow-xs'
                            : 'bg-white border-[#EAE4D7] hover:border-[#C59B58]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="COD"
                              checked={paymentMethod === 'COD'}
                              onChange={() => setPaymentMethod('COD')}
                              className="w-4 h-4 text-[#B88E4F] accent-[#EBD08C]"
                            />
                            <strong className="text-xs sm:text-sm text-[#1A1612]">Thanh toán khi nhận (COD)</strong>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Trả khi nhận
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7D715E] mt-1.5 pl-6 leading-relaxed">
                          Kiểm tra kiện hàng tận nơi, thanh toán tiền mặt trực tiếp cho nhân viên giao hàng.
                        </p>
                      </label>

                      {/* PayOS Option */}
                      <label
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          paymentMethod === 'PAYOS'
                            ? 'bg-[#FBF5EB] border-[#C59B58] ring-2 ring-[#DEC07A]/30 shadow-xs'
                            : 'bg-white border-[#EAE4D7] hover:border-[#C59B58]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="PAYOS"
                              checked={paymentMethod === 'PAYOS'}
                              onChange={() => setPaymentMethod('PAYOS')}
                              className="w-4 h-4 text-[#B88E4F] accent-[#EBD08C]"
                            />
                            <strong className="text-xs sm:text-sm text-[#1A1612]">Chuyển khoản PayOS (QR)</strong>
                          </div>
                          <span className="text-[10px] font-bold text-[#B88E4F] bg-white px-2 py-0.5 rounded-full border border-[#EAE4D7]">
                            Tự động 24/7
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7D715E] mt-1.5 pl-6 leading-relaxed">
                          Quét mã VietQR chuyển khoản ngân hàng. Hệ thống tự động xác nhận sau khi nhận tiền.
                        </p>
                      </label>
                    </div>

                    {paymentMethod === 'PAYOS' && payosAvailable === false && (
                      <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        PayOS hiện chưa sẵn sàng. Vui lòng thử lại sau hoặc chọn thanh toán khi nhận hàng (COD).
                      </p>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[#1A1612] mb-1">
                        Ghi chú cho các Shop (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58] transition"
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Full Product List Grouped by Shop & Pricing (5 cols) */}
                <div className="lg:col-span-5 space-y-4 text-left lg:sticky lg:top-3">
                  {/* Order Items Grouped by Store (Requirement 7 & 8) */}
                  <div className="p-4 sm:p-5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-3xl space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EAE4D7]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FBF5EB] to-[#F3EFE6] border border-[#EAE4D7] text-[#B88E4F] flex items-center justify-center shrink-0 shadow-2xs">
                          <Package className="w-4 h-4 text-[#B88E4F]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-xs sm:text-sm font-black text-[#1A1612] truncate">
                              Danh Sách Đặt Hàng
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7] shrink-0">
                              {activeItems.length} món · {itemsGroupedByShop.length} Shop
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Luxury Segmented Action Buttons (Pure Icon, Bright Pink-Purple Tone, Symmetrical Rounded Boxes) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          title="Sửa giỏ hàng"
                          aria-label="Sửa giỏ hàng"
                          onClick={() => {
                            editCheckoutCart(activeItems);
                            onClose();
                          }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-[#A855F7] bg-gradient-to-br from-white via-[#FAF5FF] to-[#F5D0FE]/40 border border-[#F0ABFC] hover:border-[#D946EF] hover:bg-white hover:text-[#7E22CE] transition-all duration-200 active:scale-90 cursor-pointer shadow-xs group"
                        >
                          <Pencil className="w-4 h-4 text-[#A855F7] group-hover:text-[#7E22CE] group-hover:scale-105 transition-all" strokeWidth={2.2} />
                        </button>
                        <div className="w-px h-4.5 bg-gradient-to-b from-[#F5D0FE] via-[#E879F9]/60 to-[#F5D0FE]" />
                        <button
                          type="button"
                          title="Mua thêm sản phẩm"
                          aria-label="Mua thêm sản phẩm"
                          onClick={() => {
                            continueShoppingFromCheckout(activeItems);
                            onClose();
                            navigate('/marketplace#catalog-section');
                          }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-[#C026D3] bg-gradient-to-br from-white via-[#FDF2F8] to-[#F5D0FE]/40 border border-[#F0ABFC] hover:border-[#D946EF] hover:bg-white transition-all duration-200 active:scale-90 cursor-pointer shadow-xs group"
                        >
                          <ShoppingCart className="w-4 h-4 text-[#C026D3] group-hover:text-[#A21CAF] group-hover:scale-105 transition-all" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>

                    {/* Shop Groups */}
                    <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                      {itemsGroupedByShop.map((shopGroup, sIdx) => (
                        <div key={shopGroup.store.id || sIdx} className="p-3 bg-white border border-[#EAE4D7] rounded-2xl space-y-2.5">
                          {/* Store title */}
                          <div className="flex items-center justify-between pb-2 border-b border-[#EAE4D7]/70">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] flex items-center justify-center shrink-0">
                                <StoreIcon className="w-3.5 h-3.5 text-[#B88E4F]" />
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <strong className="text-xs font-bold text-[#1A1612] truncate">
                                  {shopGroup.store.name}
                                </strong>
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#1A1612] text-[#FAF8F5] shrink-0">
                                  SHOP
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-[#B88E4F] bg-[#FBF5EB] px-2 py-0.5 rounded-md border border-[#EAE4D7]/60 shrink-0">
                              {formatMoney(shopGroup.subtotal)}
                            </span>
                          </div>

                          {/* Items for this Shop */}
                          <div className="space-y-2">
                            {shopGroup.items.map((item) => (
                              <div key={item.cartItemId} className="flex items-center gap-2.5 text-xs">
                                <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] overflow-hidden shrink-0">
                                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-[#1A1612] truncate leading-tight" title={item.title}>
                                    {item.title}
                                  </h4>
                                  {item.variantName && (
                                    <span className="text-[10px] text-[#B88E4F] font-semibold block mt-0.5">
                                      Phân loại: {item.variantName}
                                    </span>
                                  )}
                                  <div className="text-[11px] text-[#7D715E] mt-0.5 flex justify-between">
                                    <span>
                                      {formatMoney(item.price)} × {item.quantity}
                                    </span>
                                    <strong className="text-[#1A1612] font-black">
                                      {formatMoney(item.price * item.quantity)}
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coupon Box */}
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                    <label className="block text-xs font-bold text-[#1A1612]">
                      Mã giảm giá voucher (Toàn sàn hoặc Shop)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-[#B88E4F] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Nhập mã ưu đãi (VD: SCANMS50K)"
                          value={couponCode}
                          disabled={!!appliedCoupon}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponMessage(null);
                          }}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-white disabled:bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] uppercase font-bold focus:outline-hidden focus:border-[#C59B58] transition"
                        />
                      </div>

                      {appliedCoupon ? (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="px-3.5 py-2 bg-[#F3EFE6] hover:bg-[#EAE4D7] text-[#DC2626] font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                        >
                          Bỏ mã
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!couponCode.trim() || couponLoading}
                          onClick={handleValidateCoupon}
                          className="px-4 py-2 bg-[#F3EFE6] hover:bg-[#DEC07A] hover:text-white disabled:opacity-50 text-[#1A1612] font-bold text-xs rounded-xl border border-[#EAE4D7] transition flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Áp dụng'}
                        </button>
                      )}
                    </div>

                    {couponMessage && (
                      <div
                        className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                          couponMessage.type === 'success' ? 'text-emerald-700' : 'text-[#DC2626]'
                        }`}
                      >
                        {couponMessage.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{couponMessage.text}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 bg-gradient-to-br from-[#FBF5EB] to-[#FAF8F5] border-2 border-[#EEDFC6] rounded-2xl space-y-2 text-xs shadow-xs">
                    <div className="flex justify-between text-[#7D715E]">
                      <span>Tiền hàng ({activeUnitCount} món):</span>
                      <span className="font-semibold text-[#1A1612]">{formatMoney(rawSubtotal)}</span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-[#B88E4F] font-bold">
                        <span>Giảm giá voucher ({appliedCoupon.code}):</span>
                        <span>-{formatMoney(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#7D715E]">
                      <span>Phí vận chuyển:</span>
                      <span className="text-emerald-700 font-bold">Miễn phí toàn quốc</span>
                    </div>

                    <div className="pt-2.5 border-t border-[#EEDFC6] flex justify-between items-baseline">
                      <span className="font-black text-[#1A1612] text-sm">Tổng thanh toán:</span>
                      <span className="font-black text-[#B88E4F] text-xl">{formatMoney(finalTotal)}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-4 text-xs">
                    <div className="mb-3 flex items-center gap-2 font-black text-[#1A1612]">
                      <ShieldCheck className="h-4 w-4 text-[#B88E4F]" />
                      <span>Cam kết chính sách gian hàng</span>
                    </div>
                    <div className="space-y-2 text-[11px] leading-relaxed text-[#7D715E]">
                      {itemsGroupedByShop.map((group) => (
                        <div key={group.store.id} className="rounded-xl border border-[#EAE4D7] bg-white p-3">
                          <strong className="block text-[#1A1612]">{group.store.name}</strong>
                          {shopPolicies[group.store.id]?.policyReturn
                            ? <p>• Đổi trả (Shop): {shopPolicies[group.store.id].policyReturn}</p>
                            : <p>• Đổi trả (quy định SCANMS): yêu cầu trong 14 ngày kể từ khi giao, kèm ảnh và video mở hộp.</p>}
                          <p>• Bảo hành: {shopPolicies[group.store.id]?.policyWarranty || 'Shop chưa công bố chính sách bảo hành riêng.'}</p>
                          <p>• Giao hàng: {shopPolicies[group.store.id]?.policyShipping || 'Shop chưa công bố chính sách giao hàng riêng.'}</p>
                        </div>
                      ))}
                    </div>
                    {policyLoading && <p className="text-xs text-[#7D715E]">Đang tải chính sách hiện hành...</p>}
                    {policyError && <p role="alert" className="text-xs text-[#DC2626]">{policyError}</p>}
                    <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#EEDFC6] bg-white p-3">
                      <input
                        type="checkbox"
                        checked={policyAccepted}
                        disabled={policyLoading || !!policyError || itemsGroupedByShop.some((group) => !shopPolicies[group.store.id])}
                        onChange={(event) => setPolicyAccepted(event.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-[#C59B58]"
                      />
                      <span className="font-semibold leading-relaxed text-[#1A1612]">
                        Tôi đã đọc và đồng ý với chính sách đổi trả, bảo hành của các Shop trong đơn hàng.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button (Requirement 10: debounce & disable) */}
                  <button
                    type="submit"
                    disabled={isSubmitting || activeItems.length === 0 || !policyAccepted || policyLoading || !!policyError || itemsGroupedByShop.some((group) => !shopPolicies[group.store.id]) || (paymentMethod === 'PAYOS' && payosAvailable !== true)}
                    className="w-full py-3.5 bg-gradient-to-r from-[#EBD08C] to-[#DEC07A] hover:from-[#DEC07A] hover:to-[#D4B26F] disabled:opacity-50 text-[#231D15] font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg shadow-[#C59B58]/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-[#DEC07A]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Đang ghi nhận đơn hàng...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {paymentMethod === 'PAYOS'
                            ? payosAvailable === null ? 'ĐANG KIỂM TRA PAYOS' : payosAvailable === false ? 'PAYOS CHƯA SẴN SÀNG' : 'TẠO ĐƠN & HIỆN QR PAYOS'
                            : 'XÁC NHẬN ĐẶT HÀNG COD'} • {formatMoney(finalTotal)}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
