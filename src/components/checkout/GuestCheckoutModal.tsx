import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Ticket, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { ScanMSLogo } from '../common/ScanMSLogo';
import { CheckoutOrderConfirmation, type CheckoutOrderResult } from './CheckoutOrderConfirmation';
import { CheckoutItemsSection } from './CheckoutItemsSection';
import { CheckoutPaymentMethods } from './CheckoutPaymentMethods';
import {
  ScanmsCheckoutVoucherModal,
  type AppliedShopVoucher,
  type AppliedPlatformVoucher,
} from './ScanmsCheckoutVoucherModal';
import { CheckoutAddressSection } from './sections/CheckoutAddressSection';
import { CheckoutSummaryTotals } from './sections/CheckoutSummaryTotals';
import { CheckoutPoliciesSection } from './sections/CheckoutPoliciesSection';
import { useCheckoutQuote } from '../../hooks/useCheckoutQuote';
import { useCart, type CartItem } from '../../context/CartContext';
import { useScanmsChat } from '../../context/ScanmsChatContext';
import api from '../../services/api';
import { checkoutService } from '../../services/checkout.service';
import { getProductReferral } from '@/utils/referral-attribution';
import { authService } from '../../services/auth.service';
import { customerService, type CustomerAddress } from '../../services/customer.service';
import { loadShippingAddresses, type ShippingProvince } from '../../services/order-address.service';
import { walletService, type WalletSummary } from '../../services/wallet.service';
import { toast } from '../../utils/toast';
import { apiCache } from '@/utils/api-cache.utils';
import { formatMoney } from '@/utils/marketplace.utils';
import { resolveSavedShippingAddress, resolveMapShippingAddress } from '@/utils/checkout-address.utils';
import { type AddressLocationResult } from '../customer/AddressLocationPicker';
import type {
  ProductVariantItem,
  CheckoutProductItem,
  CheckoutStoreInfo,
  GuestCheckoutModalProps,
} from './checkout.types';

export type { ProductVariantItem, CheckoutProductItem, CheckoutStoreInfo };

const UUID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function readAddressCoordinates(address: CustomerAddress) {
  if (address.latitude == null || address.longitude == null || address.latitude === '' || address.longitude === '') {
    return null;
  }
  const latitude = Number(address.latitude);
  const longitude = Number(address.longitude);
  return Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude) && Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
}

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

const normalizeVariantToken = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLocaleLowerCase() : '';

/**
 * Shell Component chính của luồng thanh toán SCANMS (Checkout Flow).
 * Áp dụng triệt để kiến trúc Component Decomposition (phong cách Nam - Frontend Lead).
 * Tách biệt Address, Totals, Policies, Hooks và Services độc lập.
 */
export const GuestCheckoutModal: React.FC<GuestCheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  store,
  checkoutItems,
  initialQuantity = 1,
  initialCouponCode: _initialCouponCode = '',
  initialShippingCouponCode: _initialShippingCouponCode,
  initialExtraVoucher: _initialExtraVoucher,
  initialVariantId,
  initialLiveSessionId,
  onOrderPlaced,
  onPaymentConfirmed,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { removeItems, editCheckoutCart, continueShoppingFromCheckout } = useCart();
  const { openChat } = useScanmsChat();

  // Khóa cuộn trang nền khi mở modal thanh toán
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Thông tin người dùng hiện tại
  const [currentUser, setCurrentUser] = useState<any>(() => authService.getCurrentUser());
  const isSignedIn = Boolean(localStorage.getItem('token') && authService.getCurrentUser());

  useEffect(() => {
    if (isOpen) {
      const user = authService.getCurrentUser();
      if (user) setCurrentUser(user);
    }
  }, [isOpen]);

  // Quản lý địa chỉ giao hàng
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>(() => {
    try {
      const cached = localStorage.getItem('scanms_cached_addresses');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string>(() => {
    try {
      const cached = localStorage.getItem('scanms_cached_addresses');
      if (cached) {
        const list = JSON.parse(cached);
        if (Array.isArray(list) && list.length > 0) {
          const def = list.find((a: any) => a.isDefault) || list[0];
          return def?.id || '';
        }
      }
    } catch {}
    return '';
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const addressDraftEdited = useRef(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [shippingProvinces, setShippingProvinces] = useState<ShippingProvince[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressLoadRetry, setAddressLoadRetry] = useState(0);
  const [addressValidationField] = useState<string | null>(null);
  const [saveToAddressBook, setSaveToAddressBook] = useState(true);
  const [setAsDefaultAddress, setSetAsDefaultAddress] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<CustomerAddress | null>(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  // Bản đồ GPS vị trí giao hàng
  const [deliveryLocation, setDeliveryLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapResetKey, setMapResetKey] = useState(0);
  const [mappedAddress, setMappedAddress] = useState<AddressLocationResult | null>(null);

  // Quản lý đăng nhập tại chỗ
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Phương thức thanh toán & ví SCANMS
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'PAYOS'>('WALLET');
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [payosAvailable, setPayosAvailable] = useState<boolean | null>(null);

  // Voucher state
  const [appliedShopCoupons, setAppliedShopCoupons] = useState<Record<string, AppliedShopVoucher>>({});
  const [appliedPlatformCoupon, setAppliedPlatformCoupon] = useState<AppliedPlatformVoucher | null>(null);
  const [appliedShippingCoupon, setAppliedShippingCoupon] = useState<AppliedPlatformVoucher | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isScanmsVoucherModalOpen, setIsScanmsVoucherModalOpen] = useState(false);

  // Chính sách cửa hàng & Trạng thái đặt hàng
  const [shopPolicies, setShopPolicies] = useState<Record<string, any>>({});
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policyAccepted, setPolicyAccepted] = useState(true);
  const [orderNotes, setOrderNotes] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const revealSubmissionError = useRef(false);
  const [isValidatingCart, setIsValidatingCart] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [orderSuccess, setOrderSuccess] = useState<CheckoutOrderResult | null>(null);

  // Xác định danh sách sản phẩm thanh toán
  const activeItems: CartItem[] = useMemo(() => {
    if (checkoutItems && checkoutItems.length > 0) return checkoutItems;
    if (product) {
      let resolvedPrice = typeof product.price === 'number' ? product.price : parseFloat(String(product.price)) || 0;
      let resolvedVariantName: string | undefined;
      let resolvedStock = product.stockQuantity;

      if (initialVariantId && product.variants?.length) {
        const found = product.variants.find((v) => v.id === initialVariantId);
        if (found) {
          if (found.price != null && !Number.isNaN(Number(found.price))) resolvedPrice = Number(found.price);
          resolvedVariantName = found.name;
          resolvedStock = found.stockQuantity;
        }
      }

      return [
        {
          cartItemId: `direct-${product.id}`,
          productId: product.id,
          variantId: initialVariantId,
          variantName: resolvedVariantName,
          title: product.title,
          sku: product.sku || product.id,
          price: resolvedPrice,
          originalPrice:
            typeof product.originalPrice === 'number'
              ? product.originalPrice
              : parseFloat(String(product.originalPrice || resolvedPrice)),
          quantity: initialQuantity,
          imageUrl: product.imageUrl || '',
          stockQuantity: resolvedStock,
          isActive: true,
          store: store
            ? { id: store.id, name: store.name, slug: store.slug, logoUrl: store.logoUrl }
            : { id: 'default-store', name: 'Gian Hàng' },
          liveSessionId: initialLiveSessionId,
        },
      ];
    }
    return [];
  }, [checkoutItems, product, store, initialQuantity, initialVariantId, initialLiveSessionId]);

  // Gom nhóm sản phẩm theo gian hàng (Chuẩn CheckoutShopGroup)
  const itemsGroupedByShop = useMemo(() => {
    const groups: { [storeId: string]: { store: CartItem['store']; items: CartItem[]; subtotal: number } } = {};
    activeItems.forEach((item) => {
      const sId = item.store?.id || 'default-store';
      const sName = item.store?.name || 'Gian Hàng';
      if (!groups[sId]) {
        groups[sId] = {
          store: item.store || { id: sId, name: sName },
          items: [],
          subtotal: 0,
        };
      }
      groups[sId].items.push(item);
      groups[sId].subtotal += item.price * item.quantity;
    });
    return Object.values(groups);
  }, [activeItems]);

  const targetVoucherStoreId = itemsGroupedByShop[0]?.store?.id || 'default-store';

  // Tỉnh/Thành, Quận/Huyện, Phường/Xã đang chọn
  const selectedProvince = shippingProvinces.find((p) => String(p.code) === String(provinceCode));
  const selectedDistrict = selectedProvince?.districts.find((d) => String(d.code) === String(districtCode));
  const selectedWard = selectedDistrict?.wards.find((w) => String(w.code) === String(wardCode));

  const shippingAddressHint = addressError || (addressLoading ? 'Đang tải danh mục địa chỉ…'
    : !selectedProvince ? 'Chọn Tỉnh/Thành phố để tính phí ship.'
    : !selectedDistrict ? 'Chọn Quận/Huyện để tính phí ship.'
    : !selectedWard ? 'Chọn Phường/Xã để tính phí ship.'
    : shippingAddress.trim().length < 5 ? 'Bổ sung địa chỉ chi tiết (ít nhất 5 ký tự) để tính phí ship.'
    : null);

  const shippingDestination = !shippingAddressHint && selectedProvince && selectedDistrict && selectedWard
    ? { province: selectedProvince.name, district: selectedDistrict.name, ward: selectedWard.name, detail: shippingAddress.trim() }
    : undefined;

  // Custom Hook báo giá vận chuyển GHN & tính toán chiết khấu
  const {
    rawSubtotal,
    activeUnitCount,
    shippingFee,
    shippingFeesByStore,
    shippingFeeLoading,
    shippingFeeError,
    shippingQuoteMode,
    totalShopDiscount,
    totalCombinedDiscount,
    appliedVoucherCount,
    finalTotal,
    retryShippingQuote,
  } = useCheckoutQuote({
    isOpen,
    activeItems,
    itemsGroupedByShop,
    shippingDestination,
    shippingAddress,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    appliedShopCoupons,
    appliedPlatformCoupon,
    appliedShippingCoupon,
    onVouchersAutoReset: () => {
      setAppliedShopCoupons({});
      setAppliedPlatformCoupon(null);
      setCouponMessage(null);
    },
  });

  // Tải danh mục tỉnh thành
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

  // Cập nhật địa chỉ khi định vị bản đồ trả về
  useEffect(() => {
    if (!mappedAddress) return;
    const resolved = resolveMapShippingAddress(mappedAddress, shippingProvinces);
    setProvinceCode(resolved.provinceCode);
    setDistrictCode(resolved.districtCode);
    setWardCode(resolved.wardCode);
  }, [mappedAddress, shippingProvinces]);

  const handleCheckoutLocationChange = (result: AddressLocationResult) => {
    setIsEditingAddress(true);
    addressDraftEdited.current = true;
    setDeliveryLocation({ latitude: result.latitude, longitude: result.longitude });
    setMappedAddress(result);
    setShippingAddress(result.detailAddress || '');
    const resolved = resolveMapShippingAddress(result, shippingProvinces);
    setProvinceCode(resolved.provinceCode);
    setDistrictCode(resolved.districtCode);
    setWardCode(resolved.wardCode);
  };

  // Pre-fill thông tin tài khoản & sổ địa chỉ khi mở modal
  useEffect(() => {
    let active = true;
    if (isOpen) {
      addressDraftEdited.current = false;
      setPolicyAccepted(true);
      const user = authService.getCurrentUser();
      if (user) {
        setCustomerEmail(user.email || '');
        if (!customerName) setCustomerName(user.fullName || '');
        if (!customerPhone && user.phoneNumber) setCustomerPhone(user.phoneNumber);

        customerService
          .getAddresses()
          .then((addrs) => {
            if (!active) return;
            if (Array.isArray(addrs) && addrs.length > 0) {
              setCustomerAddresses(addrs);
              try {
                localStorage.setItem('scanms_cached_addresses', JSON.stringify(addrs));
              } catch {}

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

      // Pre-checkout validation
      if (activeItems.length > 0) {
        setIsValidatingCart(true);
        checkoutService
          .validateCart(
            activeItems.map((i) => ({
              productId: i.productId,
              variantId: i.variantId || undefined,
              quantity: i.quantity,
              clientPrice: i.price,
            })),
          )
          .then((res: any) => {
            if (res?.warnings && res.warnings.length > 0) {
              setValidationWarnings(res.warnings);
            } else {
              setValidationWarnings([]);
            }
          })
          .catch(() => {})
          .finally(() => setIsValidatingCart(false));
      }
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Tải chính sách đổi trả của các shop
  const policyStoreIds = useMemo(() => {
    return itemsGroupedByShop.map((g) => g.store.id).filter(Boolean).sort().join(',');
  }, [itemsGroupedByShop]);

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
    Promise.all(
      policyStoreIds.split(',').map(async (id) => {
        const response: any = await api.get(`/stores/public/id/${id}`);
        return [id, response?.data || response] as const;
      }),
    )
      .then((entries) => {
        if (active) setShopPolicies(Object.fromEntries(entries));
      })
      .catch(() => {
        if (active) setPolicyError('Không tải được chính sách hiện hành của Shop. Vui lòng thử lại sau.');
      })
      .finally(() => {
        if (active) setPolicyLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, policyStoreIds]);

  // Kiểm tra cổng PayOS & số dư ví
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setPayosAvailable(null);
    checkoutService
      .paymentAvailable()
      .then((available: boolean) => {
        if (active) setPayosAvailable(available);
      })
      .catch(() => {
        if (active) setPayosAvailable(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, isSignedIn]);

  useEffect(() => {
    if (!isOpen || !isSignedIn) return;
    let active = true;
    setWalletLoading(true);
    walletService
      .getMyWallet()
      .then((res) => {
        if (active) setWallet(res);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setWalletLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, isSignedIn]);

  const populateAddressFromRecord = (addr: CustomerAddress, provinces: ShippingProvince[]) => {
    if (addr.fullName) setCustomerName(addr.fullName);
    if (addr.phoneNumber) setCustomerPhone(addr.phoneNumber);
    setDeliveryLocation(readAddressCoordinates(addr));
    setMappedAddress(null);
    setMapResetKey((val) => val + 1);

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
        if (foundWard) setWardCode(String(foundWard.code));
      }
    }
  };

  const handleSelectSavedAddress = (id: string) => {
    setSelectedSavedAddressId(id);
    setIsEditingAddress(false);
    addressDraftEdited.current = false;
    const found = customerAddresses.find((a) => a.id === id);
    if (found) {
      populateAddressFromRecord(found, shippingProvinces);
    }
  };

  const handleStartNewAddress = () => {
    setSelectedSavedAddressId('');
    setIsEditingAddress(true);
    addressDraftEdited.current = true;
    setShippingAddress('');
    setProvinceCode('');
    setDistrictCode('');
    setWardCode('');
    setDeliveryLocation(null);
    setMappedAddress(null);
    setMapResetKey((val) => val + 1);
  };

  const handleConfirmDeleteAddress = async (addr: CustomerAddress) => {
    try {
      setIsDeletingAddress(true);
      await customerService.deleteAddress(addr.id);
      const next = customerAddresses.filter((a) => a.id !== addr.id);
      setCustomerAddresses(next);
      try {
        localStorage.setItem('scanms_cached_addresses', JSON.stringify(next));
      } catch {}
      if (selectedSavedAddressId === addr.id) {
        const def = next.find((a) => a.isDefault) || next[0];
        if (def) {
          handleSelectSavedAddress(def.id);
        } else {
          handleStartNewAddress();
        }
      }
      setAddressToDelete(null);
      toast.success('Đã xóa địa chỉ thành công.');
    } catch {
      toast.error('Không thể xóa địa chỉ. Vui lòng thử lại sau.');
    } finally {
      setIsDeletingAddress(false);
    }
  };

  const isPhoneValid = (phone: string) => {
    return /^0\d{9}$/.test(phone.trim().replace(/\s+/g, ''));
  };

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
      setShowPasswordLogin(false);
      toast.success('Đăng nhập thành công! Vui lòng kiểm tra lại địa chỉ.');
    } catch (err: any) {
      setLoginError(err?.response?.data?.message || err?.message || 'Đăng nhập thất bại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const resolveOrderVariantId = async (item: CartItem): Promise<string | undefined> => {
    const currentId = item.variantId?.trim();
    if (!currentId) return undefined;
    if (UUID_RE.test(currentId)) return currentId;

    let variants: any[] = item.availableVariants || [];
    try {
      const response: any = await api.get(`/public/products/${encodeURIComponent(item.productId)}/landing`, {
        headers: { 'x-skip-cache': 'true' },
      });
      const payload = response?.product ? response : response?.data?.product ? response.data : response?.data?.data || response?.data || response;
      if (Array.isArray(payload?.product?.variants)) {
        variants = payload.product.variants;
      }
    } catch {
      if (!variants.some((v) => typeof v?.id === 'string' && UUID_RE.test(v.id))) {
        throw new Error(`Không thể kiểm tra phân loại của “${item.title}”. Hãy tải lại trang rồi thử lại.`);
      }
    }

    const tokens = new Set([currentId, item.sku, item.variantName].map(normalizeVariantToken).filter(Boolean));
    const matched =
      variants.find((v) => typeof v?.id === 'string' && UUID_RE.test(v.id) && [v.id, v.sku, v.name].map(normalizeVariantToken).some((t) => t && tokens.has(t))) ||
      (variants.length === 1 && UUID_RE.test(String(variants[0]?.id || '')) ? variants[0] : null);

    if (matched) return matched.id;
    if (variants.length === 0) return undefined;
    throw new Error(`Phân loại của “${item.title}” đã cũ hoặc không còn khớp. Hãy chọn lại phân loại trong giỏ hàng.`);
  };

  // Xử lý gửi đơn hàng (Place Order)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setErrorMessage('Vui lòng nhập họ và tên người nhận.');
      return;
    }
    if (!customerPhone.trim() || !isPhoneValid(customerPhone)) {
      setErrorMessage('Vui lòng nhập số điện thoại hợp lệ của người nhận (10 chữ số).');
      return;
    }
    if (!selectedProvince || !selectedDistrict || !selectedWard || shippingAddress.trim().length < 5) {
      setErrorMessage('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã và địa chỉ chi tiết.');
      return;
    }
    if (shippingFee === null || shippingFeeError) {
      setErrorMessage('Chưa tính được cước vận chuyển giao hàng. Vui lòng kiểm tra lại địa chỉ hoặc thử lại.');
      return;
    }
    if (!policyAccepted) {
      setErrorMessage('Vui lòng đọc và xác nhận đồng ý với chính sách đổi trả của các gian hàng.');
      return;
    }

    try {
      setIsSubmitting(true);
      const normalizedItems = await Promise.all(
        activeItems.map(async (item) => {
          const resolvedVariantId = await resolveOrderVariantId(item);
          const referralLinkId = getProductReferral(item.productId);
          return {
            productId: item.productId,
            variantId: resolvedVariantId,
            quantity: item.quantity,
            clientPrice: item.price,
            storeId: item.store?.id || targetVoucherStoreId,
            liveSessionId: item.liveSessionId || undefined,
            referralLinkId: referralLinkId || undefined,
          };
        }),
      );

      const finalCouponsByStore: Record<string, string> = {};
      Object.entries(appliedShopCoupons).forEach(([storeId, v]) => {
        if (v?.code) finalCouponsByStore[storeId] = v.code;
      });

      const payload = {
        customerName: trimmedName,
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        shippingAddress: [shippingAddress.trim(), selectedWard.name, selectedDistrict.name, selectedProvince.name].join(', '),
        shippingDestination,
        expectedShippingFeeVnd: shippingFee,
        orderNotes: orderNotes.trim() || undefined,
        paymentMethod,
        couponCode: Object.values(appliedShopCoupons)[0]?.code || undefined,
        couponsByStore: Object.keys(finalCouponsByStore).length > 0 ? finalCouponsByStore : undefined,
        platformCouponsByStore: appliedPlatformCoupon ? { [appliedPlatformCoupon.storeId || targetVoucherStoreId]: appliedPlatformCoupon.code } : undefined,
        shippingCouponsByStore: appliedShippingCoupon ? { [appliedShippingCoupon.storeId || targetVoucherStoreId]: appliedShippingCoupon.code } : undefined,
        platformCouponCode: appliedPlatformCoupon?.code || undefined,
        shippingCouponCode: appliedShippingCoupon?.code || undefined,
        idempotencyKey,
        items: normalizedItems,
      };

      const res: any = await api.post('/orders', payload, { timeout: 45000 });
      const resData = res?.data?.data || res?.data || res;
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

      // Xóa các sản phẩm đã đặt khỏi giỏ hàng
      removeItems(activeItems.map((i) => i.cartItemId));

      // Tự động lưu địa chỉ nếu chọn checkbox
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
            detailAddress: shippingAddress.trim(),
            ...(deliveryLocation || {}),
            isDefault: setAsDefaultAddress,
          })
          .catch(() => {});
      }

      onOrderPlaced?.(orderResult);

      if (localStorage.getItem('token') && authService.getCurrentUser()) {
        if (orderResult.paymentMethod === 'PAYOS' && orderResult.paymentStatus === 'PAID') {
          onPaymentConfirmed?.(orderResult);
        }
        onClose();
        navigate('/customer/orders', {
          replace: true,
          state: { placedOrderCodes: formattedOrders.map((o) => o.publicOrderCode).filter(Boolean) },
        });
        toast.success(
          orderResult.paymentMethod === 'PAYOS' && orderResult.paymentStatus !== 'PAID'
            ? 'Đã tạo đơn. Bạn có thể tiếp tục thanh toán trong Đơn mua.'
            : 'Đặt hàng thành công. Theo dõi đơn trong Đơn mua của tôi.',
        );
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
      className="scanms-checkout fixed inset-0 z-[80] bg-[#FAF8F5] overflow-y-auto min-h-[100dvh] text-[#1A1612] font-sans animate-in fade-in duration-150 text-left [--checkout-line:#EAE4D7] text-[color:#1A1612]! [&_.checkout-flow-form_:is(input,select,textarea):focus-visible]:outline-[2px] [&_.checkout-flow-form_:is(input,select,textarea):focus-visible]:outline-solid [&_.checkout-flow-form_:is(input,select,textarea):focus-visible]:outline-[#C59B58] [&_.checkout-flow-form_:is(input,select,textarea):focus-visible]:outline-offset-[2px] [&_.checkout-flow-form_:is(button,a,summary):focus-visible]:outline-[2px] [&_.checkout-flow-form_:is(button,a,summary):focus-visible]:outline-solid [&_.checkout-flow-form_:is(button,a,summary):focus-visible]:outline-[#B88E4F] [&_.checkout-flow-form_:is(button,a,summary):focus-visible]:outline-offset-[3px]"
    >
      {/* 1. Header SCANMS */}
      <header className="bg-white border-b border-[#EAE4D7] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Link to="/" onClick={onClose} className="inline-flex min-w-0 no-underline" title="Về trang chủ SCANMS" aria-label="Về trang chủ SCANMS">
              <ScanMSLogo size="md" className="checkout-brand-logo [&_.scanms-logo-subtitle]:whitespace-nowrap [@media_(max-width:639px)]:gap-[8px] [@media_(max-width:639px)]:[&_.scanms-logo-subtitle]:text-[8px] [@media_(max-width:639px)]:[&_.scanms-logo-subtitle]:tracking-[0.08em]!" />
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

      <div className="h-px w-full bg-[#EEDFC6]" />

      {/* 2. Main Checkout Container */}
      <main className="max-w-6xl mx-auto px-4 py-5 sm:py-6 space-y-4 sm:space-y-5">
        {orderSuccess ? (
          <CheckoutOrderConfirmation
            order={orderSuccess}
            customerEmail={customerEmail.trim() || authService.getCurrentUser()?.email || ''}
            onClose={onClose}
            onPayosPaid={() => {}}
          />
        ) : (
          <form noValidate onSubmit={handleSubmitOrder} className="checkout-flow-form grid gap-[16px] min-w-0">
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

            {errorMessage && (
              <div id="checkout-error" role="alert" tabIndex={-1} className="p-3.5 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#DC2626] flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            {/* BLOCK 1: ĐỊA CHỈ NHẬN HÀNG */}
            <CheckoutAddressSection
              currentUser={currentUser}
              isSignedIn={isSignedIn}
              loginError={loginError}
              isLoggingIn={isLoggingIn}
              showPasswordLogin={showPasswordLogin}
              setShowPasswordLogin={setShowPasswordLogin}
              loginIdentifier={loginIdentifier}
              setLoginIdentifier={setLoginIdentifier}
              loginPassword={loginPassword}
              setLoginPassword={setLoginPassword}
              onGoogleSuccess={onTokenSuccessInCheckout}
              onPasswordLogin={handlePasswordLoginInCheckout}
              onGoogleError={(msg) => setLoginError(msg)}
              hasCompleteShippingAddress={hasCompleteShippingAddress}
              fullShippingAddressString={fullShippingAddressString}
              isEditingAddress={isEditingAddress}
              setIsEditingAddress={setIsEditingAddress}
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              customerEmail={customerEmail}
              setCustomerEmail={setCustomerEmail}
              shippingAddress={shippingAddress}
              setShippingAddress={setShippingAddress}
              customerAddresses={customerAddresses}
              selectedSavedAddressId={selectedSavedAddressId}
              onSelectSavedAddress={handleSelectSavedAddress}
              onStartNewAddress={handleStartNewAddress}
              addressToDelete={addressToDelete}
              setAddressToDelete={setAddressToDelete}
              isDeletingAddress={isDeletingAddress}
              onConfirmDeleteAddress={handleConfirmDeleteAddress}
              shippingProvinces={shippingProvinces}
              provinceCode={provinceCode}
              districtCode={districtCode}
              wardCode={wardCode}
              selectedProvince={selectedProvince}
              selectedDistrict={selectedDistrict}
              selectedWard={selectedWard}
              addressLoading={addressLoading}
              addressError={addressError}
              onProvinceChange={(code) => {
                setProvinceCode(code);
                setDistrictCode('');
                setWardCode('');
                addressDraftEdited.current = true;
              }}
              onDistrictChange={(code) => {
                setDistrictCode(code);
                setWardCode('');
                addressDraftEdited.current = true;
              }}
              onWardChange={(code) => {
                setWardCode(code);
                addressDraftEdited.current = true;
              }}
              onRetryLoadAddresses={() => setAddressLoadRetry((v) => v + 1)}
              deliveryLocation={deliveryLocation}
              mapResetKey={mapResetKey}
              mappedAddress={mappedAddress}
              onLocationChange={handleCheckoutLocationChange}
              saveToAddressBook={saveToAddressBook}
              setSaveToAddressBook={setSaveToAddressBook}
              setAsDefaultAddress={setAsDefaultAddress}
              setSetAsDefaultAddress={setSetAsDefaultAddress}
              addressValidationField={addressValidationField}
              markAddressEdited={(dirty) => {
                addressDraftEdited.current = true;
                if (dirty) setErrorMessage(null);
              }}
              isPhoneValid={isPhoneValid}
            />

            {/* BLOCK 2: SẢN PHẨM THANH TOÁN */}
            <CheckoutItemsSection
              groups={itemsGroupedByShop}
              shippingFees={shippingFeesByStore}
              notes={orderNotes}
              onNotesChange={setOrderNotes}
              onChat={(st) => openChat(st?.id || targetVoucherStoreId)}
              onEditCart={() => {
                onClose();
                editCheckoutCart(activeItems);
              }}
              onContinueShopping={() => {
                onClose();
                continueShoppingFromCheckout(activeItems);
              }}
            />

            {/* BLOCK 3: VOUCHER TOÀN ĐƠN */}
            <div className="checkout-section checkout-voucher-trigger border border-[#EAE4D7] rounded-[14px] bg-white p-[18px_24px]">
              <button
                type="button"
                onClick={() => setIsScanmsVoucherModalOpen(true)}
                className="w-full flex items-center justify-between gap-3 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#1A1612] group-hover:text-[#B88E4F] transition-colors">
                      Mã giảm giá SCANMS & Gian hàng
                    </h3>
                    <p className="text-[11px] text-[#7D715E] mt-0.5">
                      Áp dụng đồng thời voucher gian hàng, voucher SCANMS và voucher miễn phí vận chuyển
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {appliedVoucherCount > 0 ? (
                    <span className="text-xs font-bold text-[#8A642C] bg-[#FBF5EB] px-2.5 py-1 rounded-md border border-[#EEDFC6]">
                      Đã áp dụng {appliedVoucherCount} mã (−{formatMoney(totalCombinedDiscount)})
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-[#7D715E] group-hover:text-[#C59B58] transition-colors">
                      Chọn hoặc nhập mã
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#7D715E] group-hover:text-[#C59B58] group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>

              {couponMessage && (
                <div
                  className={`mt-2.5 text-xs font-medium px-2.5 py-1.5 rounded-md ${
                    couponMessage.type === 'error'
                      ? 'bg-red-50 text-[#DC2626] border border-red-200'
                      : 'bg-amber-50 text-[#8A642C] border border-[#EEDFC6]'
                  }`}
                >
                  {couponMessage.text}
                </div>
              )}
            </div>

            {/* SCANMS Voucher Modal */}
            <ScanmsCheckoutVoucherModal
              isOpen={isScanmsVoucherModalOpen}
              onClose={() => setIsScanmsVoucherModalOpen(false)}
              onRequestSignIn={() => {
                setIsScanmsVoucherModalOpen(false);
                setShowPasswordLogin(true);
                window.requestAnimationFrame(() => {
                  const gate = document.getElementById('mandatory-auth-gate');
                  gate?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  gate?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
                });
              }}
              groups={itemsGroupedByShop}
              shippingFeesByStore={shippingFeesByStore}
              totalShippingFee={shippingFee || 0}
              rawGoodsSubtotal={rawSubtotal}
              customerPhone={customerPhone}
              appliedShopCoupons={appliedShopCoupons}
              appliedPlatformCoupon={appliedPlatformCoupon}
              appliedShippingCoupon={appliedShippingCoupon}
              onApplyShopCoupon={(storeId, v) => {
                setAppliedPlatformCoupon((prev) => ((prev?.storeId || targetVoucherStoreId) === storeId ? null : prev));
                setAppliedShopCoupons((prev) => ({ ...prev, [storeId]: { ...v, storeId } }));
              }}
              onRemoveShopCoupon={(storeId) => {
                setAppliedPlatformCoupon((prev) => ((prev?.storeId || targetVoucherStoreId) === storeId ? null : prev));
                setAppliedShopCoupons((prev) => {
                  const next = { ...prev };
                  delete next[storeId];
                  return next;
                });
              }}
              onApplyPlatformCoupon={(v) => setAppliedPlatformCoupon(v)}
              onRemovePlatformCoupon={() => setAppliedPlatformCoupon(null)}
              onApplyShippingCoupon={(v) => setAppliedShippingCoupon(v)}
              onRemoveShippingCoupon={() => setAppliedShippingCoupon(null)}
            />

            {/* BLOCK 4: PHƯƠNG THỨC THANH TOÁN & TỔNG TIỀN */}
            <section
              className="checkout-section checkout-payment min-w-0 border border-[#EAE4D7] rounded-[14px] bg-[color:#FFFFFF] text-left"
              aria-labelledby="checkout-payment-title"
            >
              <CheckoutPaymentMethods
                method={paymentMethod}
                onChange={setPaymentMethod}
                balance={Number(wallet?.availableBalance || 0)}
                loading={walletLoading}
                total={finalTotal}
                payosAvailable={payosAvailable}
              />

              <CheckoutSummaryTotals
                activeUnitCount={activeUnitCount}
                rawSubtotal={rawSubtotal}
                shippingAddressHint={shippingAddressHint}
                shippingFeeError={shippingFeeError}
                shippingFeeLoading={shippingFeeLoading}
                shippingFee={shippingFee}
                onRetryShipping={retryShippingQuote}
                totalShopDiscount={totalShopDiscount}
                appliedShopCoupons={appliedShopCoupons}
                appliedPlatformCoupon={appliedPlatformCoupon}
                appliedShippingCoupon={appliedShippingCoupon}
                finalTotal={finalTotal}
                shippingQuoteMode={shippingQuoteMode}
                shopCount={itemsGroupedByShop.length}
              />

              <CheckoutPoliciesSection
                policyLoading={policyLoading}
                policyError={policyError}
                shopPolicies={shopPolicies}
                itemsGroupedByShop={itemsGroupedByShop}
                policyAccepted={policyAccepted}
                onPolicyAcceptedChange={setPolicyAccepted}
                onClearPolicyError={() => {
                  if (errorMessage?.includes('chính sách đổi trả')) setErrorMessage(null);
                }}
              />

              <div className="p-[0_24px_22px] flex justify-end [@media_(max-width:639px)]:p-[0_16px_18px]">
                <button
                  type="submit"
                  className="checkout-submit [font-family:inherit]! text-[14px] font-[650] leading-[1.5] [font-style:inherit] [font-variant:inherit] [font-stretch:inherit] inline-flex items-center justify-center gap-[8px] shrink-0 min-w-[220px] min-h-[48px] p-[12px_22px] border border-[#EEDFC6] rounded-[10px] bg-[color:#FBF5EB] text-[color:#1A1612]! cursor-pointer [&:hover:not(:disabled)]:bg-[color:#F3EFE6] [&:hover:not(:disabled)]:border-[#C59B58] [&:disabled]:bg-[color:#F3EFE6] [&:disabled]:border-[#EAE4D7] [&:disabled]:text-[color:#7D715E]! [&:disabled]:cursor-wait [@media_(max-width:639px)]:w-full [@media_(max-width:639px)]:min-w-0"
                  disabled={isSubmitting || activeItems.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                      Đang đặt hàng…
                    </>
                  ) : !currentUser ? (
                    'Đăng nhập để đặt hàng'
                  ) : (
                    'Đặt hàng'
                  )}
                </button>
              </div>
            </section>
          </form>
        )}
      </main>
    </div>
  );
};
