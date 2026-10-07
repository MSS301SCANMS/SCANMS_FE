import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Truck,
  Tag,
  Loader2,
  Store as StoreIcon,
  MapPin,
  ExternalLink,
  Pencil,
  ShoppingCart,
  Lock,
  LogIn,
  ShieldCheck,
  MessageSquare,
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
import { checkoutService } from '../../services/checkout.service';
import { checkoutPaymentStatus, loadCheckoutPayments, loadOrderPayment, type PayosPaymentDetails } from '../../utils/checkoutPayments';
import { CheckoutOrderPaymentPanel } from './CheckoutOrderPaymentPanel';
import { authService } from '../../services/auth.service';
import { customerService, type CustomerAddress } from '../../services/customer.service';
import { GoogleOfficialButton } from '../auth/GoogleOfficialButton';
import { toast } from '../../utils/toast';
import { apiCache } from '../../utils/apiCache';
import {
  loadShippingAddresses,
  type ShippingProvince,
} from '../../services/order-address.service';
import { useCart, type CartItem } from '../../context/CartContext';
import { useScanmsChat } from '../../context/ScanmsChatContext';
import { formatMoney, getSafeProductImageUrl } from '../../features/marketplace/marketplaceUtils';
import { CustomSelect } from '../ui/CustomSelect';
import { resolveSavedShippingAddress } from '../../utils/checkoutAddress';

const UUID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

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
  const { openChat } = useScanmsChat();
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const isSignedIn = Boolean(localStorage.getItem('token') && authService.getCurrentUser());
  const [currentUser, setCurrentUser] = useState<any>(() => authService.getCurrentUser());

  // Bắt buộc đăng nhập khi vào Checkout: nếu chưa đăng nhập, tự động chuyển sang /login
  useEffect(() => {
    if (isOpen && !isSignedIn) {
      toast.info('Vui lòng đăng nhập để tiến hành mua hàng!');
      onClose();
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
    }
  }, [isOpen, isSignedIn, navigate, location, onClose]);

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
  const [saveToAddressBook, setSaveToAddressBook] = useState(true);
  const [setAsDefaultAddress, setSetAsDefaultAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(true);
  const [shopPolicies, setShopPolicies] = useState<Record<string, CheckoutStoreInfo>>({});
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);

  // Payment Method: Default to COD (reliable & always available), with PayOS option
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'PAYOS'>('COD');

  // Single-product fallback state
  const [singleQuantity] = useState(initialQuantity);
  const [selectedVariantId] = useState<string | undefined>(initialVariantId);

  // Coupons
  const [couponCode, setCouponCode] = useState(initialCouponCode);
  const [autoCouponDismissed, setAutoCouponDismissed] = useState(false);
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
      payos?: PayosPaymentDetails;
      paymentError?: string;
    }>;
    cancellationToken?: string;
    confirmationEmailQueued?: boolean;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [payosAvailable, setPayosAvailable] = useState<boolean | null>(null);
  const [retryingPaymentCode, setRetryingPaymentCode] = useState<string | null>(null);
  const paymentRetryActive = React.useRef(false);

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
  const finalTotal = Math.max(0, rawSubtotal - discountAmount);

  // Check PayOS Availability
  useEffect(() => {
    if (!isOpen || !isSignedIn) return;
    let active = true;
    setPayosAvailable(null);
    checkoutService
      .paymentAvailable()
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
    if (!isOpen || !orderSuccess?.publicOrderCode || orderSuccess.paymentMethod !== 'PAYOS' || orderSuccess.paymentStatus === 'PAID') return;
    let active = true;
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      const statuses = await Promise.allSettled(orderSuccess.orders.filter(order => order.paymentStatus !== 'PAID').map(async order => ({
        code: order.publicOrderCode, response: await checkoutService.legacyPaymentStatus(order.publicOrderCode),
      })));
      if (active) setOrderSuccess(current => {
        if (!current) return current;
        const orders = current.orders.map(order => {
          if (order.paymentStatus === 'PAID') return order;
          const result = statuses.find(result => result.status === 'fulfilled' && result.value.code === order.publicOrderCode);
          if (!result || result.status !== 'fulfilled' || !result.value.response?.paymentStatus) return order;
          return { ...order, paymentStatus: result.value.response.paymentStatus };
        });
        return { ...current, orders, paymentStatus: checkoutPaymentStatus(orders) };
      });
      checking = false;
    };
    const timer = window.setInterval(check, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [isOpen, orderSuccess]);

  const retryPayosPayment = async (code: string) => {
    const order = orderSuccess?.orders.find(order => order.publicOrderCode === code);
    if (!order || paymentRetryActive.current || order.paymentStatus === 'PAID') return;
    paymentRetryActive.current = true;
    setRetryingPaymentCode(code);
    try {
      const result = await loadOrderPayment(order, checkoutService.legacyPaymentLink);
      setOrderSuccess(current => {
        if (!current) return current;
        const orders = current.orders.map(row => row.publicOrderCode === code && row.paymentStatus !== 'PAID' ? result : row);
        return { ...current, orders, paymentStatus: checkoutPaymentStatus(orders) };
      });
    } finally {
      paymentRetryActive.current = false;
      setRetryingPaymentCode(null);
    }
  };


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
      setPolicyAccepted(true);
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

    const resolved = resolveSavedShippingAddress(addr, provinces);
    if (resolved.provinceCode) {
      setShippingAddress(resolved.detailAddress || addr.detailAddress || '');
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
    if (!isOpen || !selectedSavedAddressId || shippingProvinces.length === 0) return;
    applySavedAddress(selectedSavedAddressId);
  }, [applySavedAddress, isOpen, selectedSavedAddressId, shippingProvinces.length]);

  const handleSelectSavedAddress = (addrId: string) => {
    setSelectedSavedAddressId(addrId);
    if (addrId) applySavedAddress(addrId);
  };

  const handleStartNewAddress = () => {
    setSelectedSavedAddressId('');
    setProvinceCode('');
    setDistrictCode('');
    setWardCode('');
    setShippingAddress('');
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
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const targetStoreId = activeItems[0]?.store.id || store?.id || '';
      const res: any = await api.post('/coupons/validate', {
        code: couponCode.trim(),
        storeId: targetStoreId,
        customerPhone: customerPhone.trim() || undefined,
        items: activeItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        hasProductDiscount: false,
        hasShopVoucher: false,
        hasPlatformVoucher: false,
      });

      const data = res?.data || res;
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
    setAutoCouponDismissed(true);
    setCouponLoading(false);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
  };

  const liveCouponCodes = [...new Set(activeItems.map((item) => item.liveCouponCode).filter(Boolean))];
  const autoCouponCode = initialCouponCode || (liveCouponCodes.length === 1 ? liveCouponCodes[0]! : '');
  useEffect(() => {
    if (!isOpen) { setAutoCouponDismissed(false); return; }
    if (!autoCouponCode || autoCouponDismissed) return;
    let active = true;
    setCouponLoading(true);
    setAppliedCoupon(null);
    const timer = window.setTimeout(() => {
      setCouponCode(autoCouponCode);
      setCouponLoading(true);
      void api.post('/coupons/validate', {
        code: autoCouponCode,
        storeId: activeItems[0]?.store.id || store?.id,
        customerPhone: customerPhone.trim() || undefined,
        items: activeItems.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, unitPrice: item.price })),
        hasProductDiscount: false, hasShopVoucher: false, hasPlatformVoucher: false,
      }).then((response: any) => {
        if (!active) return;
        const data = response?.data || response;
        setAppliedCoupon({ code: data.code, discountAmount: Number(data.discountAmount) || 0, discountType: data.discountType });
        setCouponMessage({ type: 'success', text: `Đã áp dụng voucher live, giảm ${formatMoney(Number(data.discountAmount) || 0)}.` });
      }).catch((error: any) => {
        if (!active) return;
        setAppliedCoupon(null);
        setCouponMessage({ type: 'error', text: error?.response?.data?.message || 'Voucher live không còn áp dụng được.' });
      }).finally(() => { if (active) setCouponLoading(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); setCouponLoading(false); };
  }, [isOpen, autoCouponCode, autoCouponDismissed, activeItems, customerPhone, store?.id]);

  // Submit Order (Requirements 7, 8, 9, 10)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (couponLoading) { setErrorMessage('Đang kiểm tra voucher. Vui lòng đợi một chút rồi đặt hàng.'); return; }

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
        payosAvailable === null ? 'Đang kiểm tra kết nối PayOS. Vui lòng chờ rồi thử lại.' : 'Chưa kết nối được dịch vụ PayOS. Vui lòng thử lại hoặc chọn thanh toán khi nhận hàng.',
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
          liveSessionId: item.liveSessionId,
          variantId: await resolveOrderVariantId(item),
          quantity: item.quantity,
        })),
      );

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
        items: normalizedItems,
      };

      const res = await api.post('/orders', payload);
      const rawResponse = res as any;
      const resData = rawResponse?.data?.data || rawResponse?.data || rawResponse;

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
        paymentStatus: o.paymentStatus || resData.paymentStatus || 'UNPAID',
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

      // Each shop order owns a separate durable provider payment.
      if (paymentMethod === 'PAYOS' && payosAvailable) {
        orderResult.orders = await loadCheckoutPayments(formattedOrders, checkoutService.legacyPaymentLink);
        orderResult.paymentStatus = checkoutPaymentStatus(orderResult.orders);
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
            isDefault: setAsDefaultAddress,
          })
          .catch(() => {});
      }

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

  const fullShippingAddressString = [
    shippingAddress.trim(),
    selectedWard?.name,
    selectedDistrict?.name,
    selectedProvince?.name,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-checkout-title"
      className="fixed inset-0 z-[80] bg-[#F5F5F5] overflow-y-auto min-h-screen text-[#1A1612] font-sans animate-in fade-in duration-150 text-left"
    >
      {/* 1. Header Chuẩn SCANMS & các sàn lớn (Logo SCANMS | Thanh Toán) */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" onClick={onClose} className="flex items-center gap-1.5" title="Về trang chủ SCANMS">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1612]">
                Scan<span className="text-[#C59B58]">MS</span>
              </span>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <span className="text-lg sm:text-xl font-medium text-[#ee4d2d]">
              Thanh Toán
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[11px] font-bold text-[#B88E4F]">
              <ShieldCheck className="w-4 h-4 text-[#B88E4F]" />
              <span>SCANMS SECURE CHECKOUT • XÁC THỰC DANH TÍNH & BẢO HỘ ĐƠN HÀNG 100%</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer"
              title="Quay lại mua sắm"
            >
              <X className="w-4 h-4 text-gray-500" />
              <span>Quay lại</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Dải ruy băng phong bì thư chuyển phát (SCANMS Iconic Address Envelope Stripe) */}
      <div className="h-1 w-full bg-[repeating-linear-gradient(45deg,#ee4d2d_0,#ee4d2d_30px,#3b82f6_30px,#3b82f6_60px,#f59e0b_60px,#f59e0b_90px)] opacity-85" />

      {/* 3. Main Checkout Container */}
      <main className="max-w-6xl mx-auto px-4 py-5 sm:py-6 space-y-4 sm:space-y-5">
        {orderSuccess ? (
          /* Order Confirmation Screen (Requirement 10) */
          <div className="max-w-2xl mx-auto py-8 text-center bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8">
            <div className="w-16 h-16 rounded-full bg-[#FBF5EB] border-2 border-[#C59B58] text-[#B88E4F] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 id="guest-checkout-title" className="text-2xl font-black text-[#1A1612] mb-1">
              {orderSuccess.paymentMethod === 'PAYOS' && orderSuccess.paymentStatus !== 'PAID' ? 'Đơn Hàng Đang Chờ Thanh Toán' : 'Đặt Hàng Thành Công!'}
            </h2>
            <p className="text-xs text-[#7D715E] mb-5 max-w-md mx-auto">
              {orderSuccess.paymentMethod === 'PAYOS' && orderSuccess.paymentStatus !== 'PAID'
                ? 'Đơn hàng đã được tạo. Vui lòng hoàn tất thanh toán PayOS bên dưới.'
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
                  className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-4 text-left space-y-2.5 shadow-2xs"
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
                        className="px-2.5 py-1.5 bg-[#ee4d2d] hover:bg-[#d03e1e] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Tra cứu</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                  {orderSuccess.paymentMethod === 'PAYOS' && <CheckoutOrderPaymentPanel
                    order={subOrder}
                    busy={retryingPaymentCode !== null}
                    retrying={retryingPaymentCode === subOrder.publicOrderCode}
                    onRetry={() => void retryPayosPayment(subOrder.publicOrderCode)}
                  />}
                </div>
              ))}
            </div>

            {/* COD Notice */}
            {orderSuccess.paymentMethod === 'COD' && (
              <div className="p-3.5 rounded-xl bg-[#FBF5EB] border border-[#EAE4D7] text-xs text-[#B88E4F] flex items-center gap-2.5 mb-5 text-left">
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
                className="w-full py-3 bg-[#ee4d2d] hover:bg-[#d03e1e] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
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
          /* Checkout Form (SCANMS Style) */
          <form onSubmit={handleSubmitOrder} className="space-y-4">
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

            {/* Error Message banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#DC2626] flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* BLOCK 1: ĐỊA CHỈ NHẬN HÀNG (Chuẩn SCANMS ẢNH 2) */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-lg p-5 sm:p-6 shadow-xs border border-gray-200 text-left">
              {/* Tiêu đề mục: 📍 Địa Chỉ Nhận Hàng */}
              <div className="flex items-center gap-2 text-base font-bold text-[#ee4d2d] pb-3 border-b border-gray-100">
                <MapPin className="w-5 h-5 text-[#ee4d2d] shrink-0" />
                <span>Địa Chỉ Nhận Hàng</span>
              </div>

              {/* Dòng tóm tắt địa chỉ người nhận Chuẩn SCANMS (Ảnh 2):
                  kim ngọc (+84) 787 664 860   43/4f, Đường Giác Đạo, Xã Bà Điểm, Hóc Môn... [Mặc Định] [Thay Đổi] */}
              <div className="pt-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-800">
                    <strong className="font-bold text-[#1A1612]">
                      {customerName ? `${customerName} (${customerPhone || 'Chưa có SĐT'})` : 'Chưa nhập thông tin nhận hàng'}
                    </strong>
                    <span className="text-gray-600">
                      {fullShippingAddressString || 'Vui lòng cung cấp địa chỉ nhận hàng để shop giao tận nơi'}
                    </span>
                    {customerAddresses.find((a) => a.id === selectedSavedAddressId)?.isDefault ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-[#ee4d2d] border border-[#ee4d2d] bg-[#FFF5F1]">
                        Mặc Định
                      </span>
                    ) : !selectedSavedAddressId && fullShippingAddressString ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-700 border border-blue-300 bg-blue-50">
                        Địa Chỉ Giao Mới
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingAddress((prev) => !prev)}
                    className="text-xs font-semibold text-[#0055AA] hover:underline cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    {isEditingAddress ? 'Thu gọn' : 'Thay Đổi'}
                  </button>
                </div>

                {/* Form chi tiết địa chỉ (Mở khi bấm Thay Đổi hoặc khi chưa có địa chỉ) */}
                {(!fullShippingAddressString || isEditingAddress) && (
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
                            className="px-2.5 py-1 text-xs font-bold text-[#ee4d2d] hover:bg-[#FFF5F1] rounded-md border border-[#ee4d2d] flex items-center gap-1 transition cursor-pointer"
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
                                    ? 'bg-[#FFF5F1] border-[#ee4d2d] ring-1 ring-[#ee4d2d] shadow-2xs'
                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-[#FAF8F5]'
                                }`}
                              >
                                <div className="space-y-1 text-xs min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                        isSelected ? 'border-[#ee4d2d] bg-[#ee4d2d]' : 'border-gray-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </span>
                                    <strong className="text-[#1A1612] font-bold">{a.fullName}</strong>
                                    <span className="text-gray-500 font-mono">({a.phoneNumber})</span>
                                    {a.isDefault && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-[#ee4d2d] border border-[#ee4d2d] bg-[#FFF5F1]">
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
                                    <span className="text-[11px] font-bold text-[#ee4d2d]">
                                      Đang dùng ✓
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAddressToDelete(a);
                                    }}
                                    className="w-7 h-7 rounded-md flex items-center justify-center text-[#ee4d2d] hover:bg-[#ffeae6] border border-transparent hover:border-[#ffd4cc] transition-colors cursor-pointer active:scale-90 shrink-0"
                                    title="Xóa địa chỉ này"
                                    aria-label="Xóa địa chỉ"
                                  >
                                    <Trash2 className="w-4 h-4 text-[#ee4d2d]" />
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
                            if (selectedSavedAddressId) setSelectedSavedAddressId('');
                          }}
                          className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-xs text-[#1A1612] focus:outline-none focus:border-[#ee4d2d] transition"
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
                            if (selectedSavedAddressId) setSelectedSavedAddressId('');
                          }}
                          className={`w-full px-3.5 py-2 bg-white border rounded-md text-xs text-[#1A1612] focus:outline-none transition font-mono ${
                            customerPhone && !isPhoneValid(customerPhone)
                              ? 'border-[#DC2626] focus:border-[#DC2626]'
                              : 'border-gray-300 focus:border-[#ee4d2d]'
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
                          Email nhận xác nhận đơn <span className="font-normal text-[#7D715E]">(Tùy chọn)</span>
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
                          className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-xs text-[#1A1612] focus:outline-none focus:border-[#ee4d2d] transition"
                        />
                      </div>
                    </div>

                    {/* Địa chỉ 3 cấp: Tỉnh / Quận / Phường */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <CustomSelect
                        required
                        value={provinceCode}
                        disabled={addressLoading}
                        onChange={(code) => {
                          setProvinceCode(code);
                          setDistrictCode('');
                          setWardCode('');
                          setSelectedSavedAddressId('');
                        }}
                        placeholder={addressLoading ? 'Đang tải Tỉnh/Thành...' : 'Chọn Tỉnh/Thành phố *'}
                        options={shippingProvinces.map((province) => ({
                          value: String(province.code),
                          label: province.name,
                        }))}
                      />

                      <CustomSelect
                        required
                        value={districtCode}
                        disabled={!selectedProvince || addressLoading}
                        onChange={(code) => {
                          setDistrictCode(code);
                          setWardCode('');
                          setSelectedSavedAddressId('');
                        }}
                        placeholder="Chọn Quận/Huyện *"
                        options={(selectedProvince?.districts || []).map((district) => ({
                          value: String(district.code),
                          label: district.name,
                        }))}
                      />

                      <CustomSelect
                        required
                        value={wardCode}
                        disabled={!selectedDistrict || addressLoading}
                        onChange={(code) => {
                          setWardCode(code);
                          setSelectedSavedAddressId('');
                        }}
                        placeholder="Chọn Phường/Xã *"
                        options={(selectedDistrict?.wards || []).map((ward) => ({
                          value: String(ward.code),
                          label: ward.name,
                        }))}
                      />
                    </div>

                    {addressError && (
                      <p className="text-[11px] text-[#DC2626] font-medium">{addressError}</p>
                    )}

                    <div>
                      <textarea
                        id="checkout-shipping-address"
                        required
                        rows={2}
                        placeholder="Số nhà, tên đường, ngõ/tổ, tòa nhà, căn hộ... *"
                        value={shippingAddress}
                        onChange={(e) => {
                          setShippingAddress(e.target.value);
                          if (selectedSavedAddressId) setSelectedSavedAddressId('');
                        }}
                        className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-md text-xs text-[#1A1612] focus:outline-none focus:border-[#ee4d2d] transition resize-none"
                      />
                    </div>

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
            <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden text-left">
              {/* Header các cột (Chuẩn Ảnh 2: Sản phẩm | Đơn giá | Số lượng | Thành tiền) */}
              <div className="hidden sm:grid grid-cols-12 px-6 py-4 border-b border-gray-100 text-xs sm:text-sm font-semibold text-gray-500 bg-white">
                <div className="col-span-6">Sản phẩm</div>
                <div className="col-span-2 text-center">Đơn giá</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-2 text-right">Thành tiền</div>
              </div>

              {/* Từng Gian hàng */}
              <div className="divide-y divide-gray-200">
                {itemsGroupedByShop.map((shopGroup, sIdx) => (
                  <div key={shopGroup.store.id || sIdx} className="space-y-0">
                    {/* Header Shop (Chuẩn Ảnh 2: [Yêu thích] [Tên Shop] | Chat ngay) */}
                    <div className="px-5 sm:px-6 py-3 bg-[#FAF8F5]/80 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ee4d2d] text-white shrink-0">
                          Yêu thích
                        </span>
                        <strong className="text-xs sm:text-sm font-bold text-[#1A1612] truncate">
                          {shopGroup.store.name}
                        </strong>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#F3EFE6] text-[#B88E4F] border border-[#EEDFC6] shrink-0">
                          SHOP
                        </span>
                        <button
                          type="button"
                          onClick={() => openChat(shopGroup.store)}
                          className="text-xs text-[#059669] hover:underline flex items-center gap-1 shrink-0 ml-1.5 cursor-pointer font-medium"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat ngay</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            editCheckoutCart(activeItems);
                            onClose();
                          }}
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer font-medium"
                          title="Sửa giỏ hàng"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Sửa giỏ hàng</span>
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            continueShoppingFromCheckout(activeItems);
                            onClose();
                            navigate('/marketplace#catalog-section');
                          }}
                          className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer font-medium"
                          title="Mua thêm sản phẩm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Mua thêm</span>
                        </button>
                      </div>
                    </div>

                    {/* Danh sách sản phẩm của Shop */}
                    <div className="divide-y divide-gray-100">
                      {shopGroup.items.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="grid grid-cols-1 sm:grid-cols-12 px-5 sm:px-6 py-4 items-center gap-3 sm:gap-0"
                        >
                          {/* Cột 1: Sản phẩm (Ảnh + Tên + Phân loại) */}
                          <div className="sm:col-span-6 flex items-center gap-3 min-w-0">
                            <img
                              src={getSafeProductImageUrl(item.imageUrl, item.title, item.variantName)}
                              alt={item.title}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xs object-cover border border-gray-200 shrink-0 bg-white"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (!target.dataset.hasFallback) {
                                  target.dataset.hasFallback = 'true';
                                  target.src = getSafeProductImageUrl(null, item.title);
                                }
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-sm text-[#1A1612] font-normal line-clamp-2 leading-snug">
                                {item.title}
                              </h4>
                              {item.variantName && (
                                <span className="text-xs text-gray-500 block mt-1">
                                  Phân loại: {item.variantName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Cột 2: Đơn giá */}
                          <div className="sm:col-span-2 sm:text-center text-xs sm:text-sm text-gray-700">
                            <span className="sm:hidden font-medium text-gray-500 mr-2">Đơn giá:</span>
                            {formatMoney(item.price)}
                          </div>

                          {/* Cột 3: Số lượng */}
                          <div className="sm:col-span-2 sm:text-center text-xs sm:text-sm text-gray-700">
                            <span className="sm:hidden font-medium text-gray-500 mr-2">Số lượng:</span>
                            {item.quantity}
                          </div>

                          {/* Cột 4: Thành tiền */}
                          <div className="sm:col-span-2 sm:text-right text-xs sm:text-sm font-semibold text-[#ee4d2d]">
                            <span className="sm:hidden font-medium text-gray-500 mr-2">Thành tiền:</span>
                            {formatMoney(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tiện ích chân Shop: Lời nhắn + Vận chuyển (Chuẩn Ảnh 2) */}
                    <div className="bg-[#FAF8F5]/80 px-5 sm:px-6 py-3.5 border-t border-gray-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        {/* Lời nhắn cho Người bán */}
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <span className="text-gray-600 shrink-0">Lời nhắn cho Người bán:</span>
                          <input
                            type="text"
                            placeholder="Lưu ý cho người bán (giờ giao, gọi trước...)"
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#ee4d2d]"
                          />
                        </div>

                        {/* Đơn vị vận chuyển */}
                        <div className="flex items-center gap-2 text-gray-700 shrink-0">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Truck className="w-4 h-4 text-emerald-600" />
                            Vận Chuyển Nhanh
                          </span>
                          <span className="text-gray-500">(2-3 ngày)</span>
                          <span className="font-bold text-emerald-700">Miễn phí toàn quốc</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end text-xs pt-2 border-t border-dashed border-gray-200">
                        <span className="text-gray-600 mr-2">
                          Tổng số tiền ({shopGroup.items.reduce((s, i) => s + i.quantity, 0)} sản phẩm):
                        </span>
                        <strong className="text-sm font-bold text-[#ee4d2d]">
                          {formatMoney(shopGroup.subtotal)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <section className="rounded-lg border border-[#EEDFC6] bg-white p-4 sm:p-5 text-left space-y-3" aria-labelledby="checkout-return-policies-title">
              <div className="flex items-center gap-2 border-b border-[#EAE4D7] pb-3">
                <ShieldCheck className="h-5 w-5 text-[#B88E4F]" />
                <div>
                  <h3 id="checkout-return-policies-title" className="text-sm font-bold text-[#1A1612]">Chính sách của gian hàng</h3>
                  <p className="mt-0.5 text-xs text-[#7D715E]">Vui lòng đọc chính sách đổi trả trước khi đặt hàng.</p>
                </div>
              </div>

              {policyLoading ? (
                <p className="flex items-center gap-2 text-xs text-[#7D715E]"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải chính sách Shop…</p>
              ) : policyError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{policyError}</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {itemsGroupedByShop.map((group) => {
                      const policy = shopPolicies[group.store.id];
                      if (!policy) {
                        return <p key={group.store.id} className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">Chưa tải được chính sách của {group.store.name}. Hãy tải lại trang rồi thử lại.</p>;
                      }

                      return (
                        <article key={group.store.id} className="rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] p-3 text-xs text-[#1A1612]">
                          <h4 className="font-bold">{policy.name || group.store.name}</h4>
                          <p className="mt-1"><strong>Đổi trả / hoàn tiền:</strong> {policy.policyReturn?.trim() || 'Theo quy định SCANMS: yêu cầu đổi trả trong 14 ngày kể từ khi nhận hàng, kèm ảnh và video mở hộp.'}</p>
                          {policy.policyWarranty?.trim() && <p className="mt-1"><strong>Bảo hành:</strong> {policy.policyWarranty}</p>}
                          {policy.policyShipping?.trim() && <p className="mt-1"><strong>Giao hàng:</strong> {policy.policyShipping}</p>}
                        </article>
                      );
                    })}
                  </div>

                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#1A1612]">
                    <input
                      type="checkbox"
                      checked={policyAccepted}
                      disabled={itemsGroupedByShop.some((group) => !shopPolicies[group.store.id])}
                      onChange={(event) => setPolicyAccepted(event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#C59B58]"
                    />
                    <span>Tôi xác nhận đã đọc và đồng ý với chính sách đổi trả của tất cả gian hàng trong đơn.</span>
                  </label>
                </>
              )}
            </section>

            {/* ========================================================================= */}
            {/* BLOCK 3: PHƯƠNG THỨC THANH TOÁN (CHUẨN CÁC SÀN LỚN) */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-lg p-5 sm:p-6 shadow-xs border border-gray-200 text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm sm:text-base font-bold text-[#1A1612]">Phương Thức Thanh Toán</h3>
                <span className="text-xs text-gray-500">Mọi giao dịch được bảo hộ 100% qua Quỹ Escrow SCANMS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* COD Option */}
                <label
                  className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'bg-[#FFF5F1]/50 border-[#ee4d2d] ring-1 ring-[#ee4d2d] shadow-2xs'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="w-4 h-4 text-[#ee4d2d] accent-[#ee4d2d]"
                      />
                      <strong className="text-xs sm:text-sm text-[#1A1612]">Thanh toán khi nhận hàng (COD)</strong>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Khuyên dùng
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1.5 pl-6.5 leading-relaxed">
                    Kiểm tra kiện hàng tận nơi, thanh toán tiền mặt trực tiếp cho nhân viên giao vận.
                  </p>
                </label>

                {/* PayOS Option */}
                <label
                  className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
                    paymentMethod === 'PAYOS'
                      ? 'bg-[#FFF5F1]/50 border-[#ee4d2d] ring-1 ring-[#ee4d2d] shadow-2xs'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="PAYOS"
                        checked={paymentMethod === 'PAYOS'}
                        onChange={() => setPaymentMethod('PAYOS')}
                        className="w-4 h-4 text-[#ee4d2d] accent-[#ee4d2d]"
                      />
                      <strong className="text-xs sm:text-sm text-[#1A1612]">Chuyển khoản PayOS (VietQR)</strong>
                    </div>
                    <span className="text-[10px] font-bold text-[#B88E4F] bg-amber-50 px-2 py-0.5 rounded-full border border-[#EEDFC6]">
                      Tự động 24/7
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1.5 pl-6.5 leading-relaxed">
                    Quét mã VietQR trên ứng dụng ngân hàng bất kỳ. Hệ thống tự động xác nhận sau 10 giây.
                  </p>
                </label>
              </div>

              {paymentMethod === 'PAYOS' && payosAvailable === false && (
                <p className="text-[11px] font-semibold text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  Chưa kết nối được dịch vụ PayOS. Bạn có thể thử lại sau hoặc chọn thanh toán khi nhận hàng.
                </p>
              )}
            </div>

            {/* ========================================================================= */}
            {/* BLOCK 4: TỔNG KẾT ĐƠN HÀNG & ĐẶT HÀNG (Chuẩn SCANMS ẢNH 2) */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-lg p-5 sm:p-6 shadow-xs border border-gray-200 text-left space-y-4">
              {/* Voucher sàn SCANMS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1A1612]">
                  <Tag className="w-4 h-4 text-[#ee4d2d]" />
                  <span>Voucher của SCANMS</span>
                </div>

                <div className="flex items-center gap-2 max-w-md w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Nhập mã ưu đãi (VD: SCANMS50K)"
                    value={couponCode}
                    disabled={!!appliedCoupon}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setAutoCouponDismissed(true);
                      setCouponLoading(false);
                      setAppliedCoupon(null);
                      setCouponMessage(null);
                    }}
                    className="px-3.5 py-1.5 bg-white border border-gray-300 rounded text-xs text-[#1A1612] uppercase font-bold focus:outline-none focus:border-[#ee4d2d] flex-1 sm:w-60"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#DC2626] font-bold text-xs rounded transition cursor-pointer shrink-0"
                    >
                      Bỏ mã
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!couponCode.trim() || couponLoading}
                      onClick={handleValidateCoupon}
                      className="px-4 py-1.5 bg-[#ee4d2d] hover:bg-[#d03e1e] text-white disabled:opacity-50 font-bold text-xs rounded transition cursor-pointer shrink-0"
                    >
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Áp Dụng'}
                    </button>
                  )}
                </div>
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

              {/* Bảng chi tiết tài chính */}
              <div className="flex flex-col items-end space-y-2.5 text-xs text-gray-600 pt-2">
                <div className="flex justify-between sm:justify-end gap-8 w-full sm:w-auto">
                  <span>Tổng tiền hàng ({activeUnitCount} món):</span>
                  <span className="font-semibold text-[#1A1612] min-w-[130px] text-right">{formatMoney(rawSubtotal)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between sm:justify-end gap-8 w-full sm:w-auto text-[#ee4d2d]">
                    <span>Giảm giá Voucher ({appliedCoupon.code}):</span>
                    <span className="font-bold min-w-[130px] text-right">-{formatMoney(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between sm:justify-end gap-8 w-full sm:w-auto">
                  <span>Tổng cộng Tiền phí vận chuyển:</span>
                  <span className="font-semibold text-emerald-700 min-w-[130px] text-right">Miễn phí toàn quốc</span>
                </div>

                <div className="flex justify-between sm:justify-end gap-8 w-full sm:w-auto items-baseline pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-800">Tổng thanh toán:</span>
                  <strong className="text-2xl sm:text-3xl font-black text-[#ee4d2d] min-w-[150px] text-right">
                    {formatMoney(finalTotal)}
                  </strong>
                </div>
              </div>

              {/* Chính sách đổi trả & cam kết Escrow 14 ngày */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8C6B32]">
                  <ShieldCheck className="w-4 h-4 text-[#C59B58]" />
                  <span>Chính sách đổi trả 14 ngày & Quỹ Bảo Chứng SCANMS</span>
                </div>
                <div className="text-[11px] text-[#7D715E] leading-relaxed space-y-1">
                  <p>
                    • <b>Bảo đảm đổi trả:</b> Khách hàng được quyền gửi yêu cầu đổi hàng / trả hàng hoàn tiền trong vòng <b>14 ngày</b> kể từ khi nhận kiện hàng (kèm hình ảnh / video mở hộp).
                  </p>
                  <p>
                    • <b>Bảo vệ quyền lợi:</b> Tiền thanh toán được giữ an toàn tại Quỹ bảo chứng Escrow của sàn cho đến khi khách xác nhận hài lòng hoặc hết hạn khiếu nại.
                  </p>
                </div>
                <label className="flex items-start gap-2.5 pt-2 border-t border-[#EAE4D7] text-xs text-[#1A1612] cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    id="checkout-policy-agreement"
                    checked={policyAccepted}
                    onChange={(e) => {
                      setPolicyAccepted(e.target.checked);
                      if (e.target.checked && errorMessage?.includes('chính sách đổi trả')) {
                        setErrorMessage(null);
                      }
                    }}
                    className="w-4 h-4 mt-0.5 rounded text-[#ee4d2d] focus:ring-[#ee4d2d] cursor-pointer shrink-0"
                  />
                  <span>
                    Tôi đã đọc, hiểu rõ và đồng ý với <b>Chính sách đổi trả 14 ngày</b> và điều kiện bảo hành của các gian hàng trên sàn SCANMS.
                  </span>
                </label>
              </div>

              {/* Chân trang thanh toán và nút ĐẶT HÀNG */}
              <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] text-gray-500 leading-relaxed text-center sm:text-left max-w-md">
                  Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo{' '}
                  <a
                    href="#rules"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info('Chính sách giao dịch an toàn SCANMS: Escrow 14 ngày & Bảo hộ 100%.');
                    }}
                    className="text-[#0055AA] hover:underline"
                  >
                    Điều khoản SCANMS
                  </a>{' '}
                  & Cam kết bảo vệ quyền lợi người mua 100%.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || activeItems.length === 0}
                  className="w-full sm:w-60 py-3.5 bg-[#ee4d2d] hover:bg-[#d03e1e] disabled:opacity-50 text-white font-bold text-base rounded shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>ĐANG XỬ LÝ...</span>
                    </>
                  ) : (
                    <span>ĐẶT HÀNG</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>

      {/* Modal xác nhận xóa địa chỉ - Chuẩn SCANMS & các sàn lớn (Chỉ xóa khi bấm xác nhận, không bao giờ tự động đếm giờ) */}
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
              <div className="w-10 h-10 rounded-full bg-[#FFF5F1] text-[#ee4d2d] flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 className="w-5 h-5 text-[#ee4d2d]" />
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
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-[#ee4d2d] border border-[#ee4d2d] bg-[#FFF5F1]">
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
                className="px-4 py-2 text-xs font-bold text-white bg-[#ee4d2d] hover:bg-[#d03e1e] rounded-lg transition cursor-pointer select-none active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
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
