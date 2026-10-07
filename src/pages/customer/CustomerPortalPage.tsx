import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  MapPin,
  Heart,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  ChevronDown,
  LogOut,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Loader2,
  Store as StoreIcon,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Home,
  X,
  XCircle,
  Camera,
  Ticket,
  MessageCircle,
  User,
  Copy,
  Package,
  CheckCheck,
  Check,
  HelpCircle,
  Shield,
  Mail,
  KeyRound,
  Lock,
  Wallet,
} from 'lucide-react';
import { getSafeProductImageUrl } from '../../features/marketplace/marketplaceUtils';
import { authService, type UserProfile } from '../../services/auth.service';
import { uploadService } from '../../services/upload.service';
import { Select } from '../../components/ui/Select';
import {
  customerService,
  type CustomerProfileResponse,
  type CustomerOrder,
  type CustomerOrderItem,
  type CustomerAddress,
  type CustomerWishlistItem,
} from '../../services/customer.service';
import {
  loadShippingAddresses,
  type ShippingProvince,
} from '../../services/order-address.service';
import { formatMoney } from '../../features/marketplace/marketplaceUtils';
import { toast } from '../../utils/toast';
import { GuestCheckoutModal, type CheckoutProductItem, type CheckoutStoreInfo } from '../../components/checkout/GuestCheckoutModal';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { PartnerUpgradeTab } from './PartnerUpgradeTab';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { useScanmsChat, type ChatProductInfo } from '../../context/ScanmsChatContext';
import { ReturnRequestModal } from '../../components/customer/ReturnRequestModal';
import { VerifiedReviewModal } from '../../components/customer/VerifiedReviewModal';
import {
  AddressLocationPicker,
  type AddressLocationResult,
} from '../../components/customer/AddressLocationPicker';

type CustomerTab = 'orders' | 'addresses' | 'wishlist' | 'profile' | 'identity' | 'upgrade' | 'vouchers' | 'security';
type OrderFilterStatus = 'ALL' | 'UNPAID' | 'PENDING' | 'SHIPPING' | 'DELIVERED' | 'RECEIVING' | 'COMPLETED' | 'RETURN_REQUESTED' | 'CANCELLED' | 'RETURNED';

const normalizeAdministrativeName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLowerCase()
  .replace(/\b(thanh pho|tinh|quan|huyen|thi xa|thi tran|phuong|xa)\b/g, '')
  .replace(/[^a-z0-9]/g, '');

const administrativeNamesMatch = (left: string, right: string) => {
  const normalizedLeft = normalizeAdministrativeName(left);
  const normalizedRight = normalizeAdministrativeName(right);
  return Boolean(
    normalizedLeft &&
    normalizedRight &&
    (normalizedLeft === normalizedRight ||
      normalizedLeft.includes(normalizedRight) ||
      normalizedRight.includes(normalizedLeft))
  );
};

export default function CustomerPortalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const pathTab = location.pathname.includes('/customer/wallet')
    ? 'wallet'
    : location.pathname.includes('/customer/upgrade')
    ? 'upgrade'
    : location.pathname.includes('/customer/identity')
    ? 'identity'
    : location.pathname.includes('/customer/addresses')
    ? 'addresses'
    : location.pathname.includes('/customer/wishlist')
    ? 'wishlist'
    : location.pathname.includes('/customer/profile')
    ? 'profile'
    : location.pathname.includes('/customer/security')
    ? 'security'
    : location.pathname.includes('/customer/vouchers')
    ? 'vouchers'
    : location.pathname.includes('/customer/orders')
    ? 'orders'
    : null;
  const currentTab = pathTab || (searchParams.get('tab') as CustomerTab) || 'orders';

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [profileData, setProfileData] = useState<CustomerProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Submenu open states (SCANMS Accordion)
  const [isAccountSubmenuOpen, setIsAccountSubmenuOpen] = useState(
    currentTab === 'profile' || currentTab === 'identity' || currentTab === 'addresses' || currentTab === 'security'
  );

  // Floating Chat hook
  const { openChat } = useScanmsChat();


  // Tab 1: Orders State
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderFilterStatus>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<CustomerOrder | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [returnOrder, setReturnOrder] = useState<CustomerOrder | null>(null);
  const [reviewOrder, setReviewOrder] = useState<CustomerOrder | null>(null);


  // Tab 2: Addresses State
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phoneNumber: '',
    provinceCode: '',
    provinceName: '',
    districtCode: '',
    districtName: '',
    wardCode: '',
    wardName: '',
    detailAddress: '',
    latitude: null as number | null,
    longitude: null as number | null,
    isDefault: false,
  });
  const [provinces, setProvinces] = useState<ShippingProvince[]>([]);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressPendingDeletion, setAddressPendingDeletion] = useState<CustomerAddress | null>(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  // Tab 3: Wishlist State
  const [wishlist, setWishlist] = useState<CustomerWishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Tab 4: Profile & Password Form (SCANMS Standard)
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [birthDay, setBirthDay] = useState('02');
  const [birthMonth, setBirthMonth] = useState('01');
  const [birthYear, setBirthYear] = useState('2000');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Security / Password Setting Flow (SCANMS Standard)
  const [securityMode, setSecurityMode] = useState<'VERIFY_METHOD' | 'AWAIT_OTP' | 'SET_NEW_PASSWORD' | 'DIRECT_CHANGE'>('VERIFY_METHOD');
  const [securityOtp, setSecurityOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [maskedSecurityEmail, setMaskedSecurityEmail] = useState('');
  const [sendingSecurityOtp, setSendingSecurityOtp] = useState(false);
  const [verifyingSecurityOtp, setVerifyingSecurityOtp] = useState(false);
  const [settingNewPassword, setSettingNewPassword] = useState(false);

  // Identity CCCD State (SCANMS Standard)
  const [cccdFullName, setCccdFullName] = useState('');
  const [cccdIdNumber, setCccdIdNumber] = useState('');
  const [cccdAddress, setCccdAddress] = useState('');
  const [cccdVerified, setCccdVerified] = useState(false);
  const [, setCccdVerifiedAt] = useState<string | null>(null);
  const [loadingIdentity, setLoadingIdentity] = useState(false);
  const [submittingIdentity, setSubmittingIdentity] = useState(false);

  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Masking helpers for SCANMS Profile Display
  const maskEmail = (email?: string) => {
    if (!email) return 'chua-co-email@scanms.vn';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const visible = name.slice(0, 2);
    return `${visible}***********@${parts[1]}`;
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return 'Chưa cập nhật';
    const clean = phone.trim();
    if (clean.length < 4) return clean;
    const last2 = clean.slice(-2);
    return `*********${last2}`;
  };

  const username =
    profileData?.user?.email?.split('@')[0] ||
    currentUser?.email?.split('@')[0] ||
    'tuan15252004';

  // Avatar Upload State & Handler
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const secureUrl = await uploadService.uploadImage(file, 'scanms/avatars');
      await authService.updateAvatar(secureUrl);

      // Cập nhật state nội bộ
      if (profileData) {
        setProfileData({
          ...profileData,
          user: {
            ...profileData.user,
            avatarUrl: secureUrl,
          },
        });
      }
      setCurrentUser(authService.getCurrentUser());
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (error: any) {
      console.error('Lỗi khi tải ảnh đại diện:', error);
      toast.error(error?.message || 'Không thể tải ảnh lên. Vui lòng thử lại!');
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Checkout modal for "Mua lại" / "Mua ngay"
  const [activeCheckoutProduct, setActiveCheckoutProduct] = useState<{
    product: CheckoutProductItem;
    store: CheckoutStoreInfo;
  } | null>(null);

  // Check login & listen for auth user updates
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      toast.error('Vui lòng đăng nhập để truy cập trang cá nhân khách hàng');
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    fetchProfile();

    const handleUserUpdated = () => {
      const u = authService.getCurrentUser();
      setCurrentUser(u);
    };
    window.addEventListener('auth-user-updated', handleUserUpdated);
    return () => window.removeEventListener('auth-user-updated', handleUserUpdated);
  }, [navigate]);

  // Handle Tab changes
  useEffect(() => {
    if (currentTab === 'orders') fetchOrders();
    if (currentTab === 'addresses') fetchAddresses();
    if (currentTab === 'wishlist') fetchWishlist();
    if (currentTab === 'identity') fetchIdentity();
  }, [currentTab, orderStatusFilter]);


  // Keep submenu open if active tab is in account
  useEffect(() => {
    if (currentTab === 'profile' || currentTab === 'identity' || currentTab === 'addresses' || currentTab === 'security') {
      setIsAccountSubmenuOpen(true);
    }
  }, [currentTab]);

  // Load Vietnam Administrative Divisions
  useEffect(() => {
    const controller = new AbortController();
    loadShippingAddresses(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setProvinces(data || []);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.error('Không tải được danh mục địa chỉ:', err);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  const setTab = (tab: CustomerTab) => {
    navigate(`/customer/${tab}`);
  };

  const handleOpenChat = (order: CustomerOrder, specificItem?: CustomerOrderItem) => {
    const item = specificItem || order.orderItems?.[0];
    const productInfo: ChatProductInfo | undefined = item
      ? {
          id: item.productId || item.product?.id || `prod-${order.id}`,
          title: item.product?.title || `Sản phẩm trong đơn #${order.externalOrderSn}`,
          price: Number(item.unitPrice) || Number(order.finalAmount) || 0,
          originalPrice: Math.round((Number(item.unitPrice) || Number(order.finalAmount) || 0) * 1.2),
          imageUrl: item.product?.imageUrl || undefined,
          sku: item.variant?.name || item.product?.sku || undefined,
          soldCount: 99,
        }
      : undefined;

    openChat(
      {
        id: order.storeId,
        name: order.store?.name || 'Gian Hàng Đối Tác',
        logoUrl: order.store?.logoUrl || undefined,
      },
      productInfo,
    );
  };



  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const data = await customerService.getProfile();
      setProfileData(data);
      setNameInput(data.user.fullName || '');
      setPhoneInput(data.user.phoneNumber || '');
    } catch (err: any) {
      console.error('Fetch profile error:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchIdentity = async () => {
    setLoadingIdentity(true);
    try {
      const data = await customerService.getIdentity();
      if (data) {
        setCccdFullName(data.fullName || currentUser?.fullName || '');
        setCccdIdNumber(data.idCardNumber || '');
        setCccdAddress(data.address || '');
        setCccdVerified(Boolean(data.isVerified));
        setCccdVerifiedAt(data.verifiedAt || null);
      }
    } catch (err: any) {
      console.error('Fetch identity error:', err);
    } finally {
      setLoadingIdentity(false);
    }
  };

  const handleSubmitIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cccdFullName.trim()) {
      toast.error('Vui lòng nhập họ và tên đầy đủ trên CCCD');
      return;
    }
    const cleanId = cccdIdNumber.trim().replace(/\s+/g, '');
    if (!/^\d{9,12}$/.test(cleanId)) {
      toast.error('Số CCCD phải gồm 9 hoặc 12 chữ số hợp lệ');
      return;
    }
    if (!cccdAddress.trim() || cccdAddress.trim().length < 5) {
      toast.error('Vui lòng nhập địa chỉ nơi thường trú đầy đủ trên CCCD');
      return;
    }

    setSubmittingIdentity(true);
    try {
      const res = await customerService.verifyIdentity({
        fullName: cccdFullName.trim(),
        idCardNumber: cleanId,
        address: cccdAddress.trim(),
      });
      toast.success(res.message || 'Xác nhận thông tin CCCD thành công');
      setCccdVerified(true);
      setCccdVerifiedAt(new Date().toISOString());
      fetchProfile();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể lưu thông tin CCCD';
      toast.error(msg);
    } finally {
      setSubmittingIdentity(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(false);
    try {
      let statusParam: string | undefined = undefined;
      if (orderStatusFilter === 'UNPAID') statusParam = 'PENDING';
      else if (orderStatusFilter === 'SHIPPING') statusParam = 'SHIPPING';
      else if (orderStatusFilter === 'RECEIVING') statusParam = 'SHIPPING';
      else if (orderStatusFilter === 'COMPLETED') statusParam = 'DELIVERED';
      else if (orderStatusFilter === 'CANCELLED') statusParam = 'CANCELLED';
      else if (orderStatusFilter === 'RETURNED') statusParam = 'RETURNED';

      const res = await customerService.getOrders({
        status: statusParam,
        search: orderSearch.trim() || undefined,
      });
      setOrders(res.orders);
    } catch (err: any) {
      console.error('Fetch orders error:', err);
      setOrdersError(true);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return;
    setIsCancelling(true);
    try {
      await customerService.cancelOrder(cancellingOrderId, cancelReason);
      toast.success('Hủy đơn hàng thành công');
      setCancellingOrderId(null);
      setCancelReason('');
      fetchOrders();
      fetchProfile();
      if (selectedOrderDetails?.id === cancellingOrderId) {
        setSelectedOrderDetails(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmReceipt = async (order: CustomerOrder) => {
    setConfirmingOrderId(order.id);
    try {
      await customerService.confirmReceipt(order.id);
      toast.success('Đơn hàng đã hoàn tất. Bạn có thể gửi đánh giá đã xác minh.');
      await Promise.all([fetchOrders(), fetchProfile()]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xác nhận đã nhận hàng');
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const data = await customerService.getAddresses();
      setAddresses(data);
    } catch (err: any) {
      console.error('Fetch addresses error:', err);
    } finally {
      setAddressesLoading(false);
    }
  };

  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: profileData?.user.fullName || '',
      phoneNumber: profileData?.user.phoneNumber || '',
      provinceCode: '',
      provinceName: '',
      districtCode: '',
      districtName: '',
      wardCode: '',
      wardName: '',
      detailAddress: '',
      latitude: null,
      longitude: null,
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      fullName: addr.fullName,
      phoneNumber: addr.phoneNumber,
      provinceCode: addr.provinceCode || '',
      provinceName: addr.provinceName,
      districtCode: addr.districtCode || '',
      districtName: addr.districtName,
      wardCode: addr.wardCode || '',
      wardName: addr.wardName,
      detailAddress: addr.detailAddress,
      latitude: addr.latitude == null ? null : Number(addr.latitude),
      longitude: addr.longitude == null ? null : Number(addr.longitude),
      isDefault: addr.isDefault,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.provinceName || !addressForm.districtName || !addressForm.wardName) {
      toast.error('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã');
      return;
    }
    setSavingAddress(true);
    try {
      if (editingAddressId) {
        await customerService.updateAddress(editingAddressId, addressForm);
        toast.success('Cập nhật địa chỉ thành công');
      } else {
        await customerService.createAddress(addressForm);
        toast.success('Thêm địa chỉ mới thành công');
      }
      setIsAddressModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể lưu địa chỉ');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressPendingDeletion) return;
    setIsDeletingAddress(true);
    try {
      await customerService.deleteAddress(addressPendingDeletion.id);
      toast.success('Đã xóa địa chỉ');
      setAddressPendingDeletion(null);
      await fetchAddresses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xóa địa chỉ');
    } finally {
      setIsDeletingAddress(false);
    }
  };

  const handleAddressLocationChange = (locationResult: AddressLocationResult) => {
    const matchedProvince = provinces.find((province) =>
      administrativeNamesMatch(province.name, locationResult.provinceName),
    );
    const matchedDistrict = matchedProvince?.districts.find((district) =>
      administrativeNamesMatch(district.name, locationResult.districtName),
    );
    const matchedWard = matchedDistrict?.wards.find((ward) =>
      administrativeNamesMatch(ward.name, locationResult.wardName),
    );

    setAddressForm((current) => ({
      ...current,
      latitude: locationResult.latitude,
      longitude: locationResult.longitude,
      detailAddress: locationResult.detailAddress || current.detailAddress,
      provinceCode: matchedProvince ? String(matchedProvince.code) : current.provinceCode,
      provinceName: matchedProvince?.name || current.provinceName,
      districtCode: matchedDistrict ? String(matchedDistrict.code) : current.districtCode,
      districtName: matchedDistrict?.name || current.districtName,
      wardCode: matchedWard ? String(matchedWard.code) : current.wardCode,
      wardName: matchedWard?.name || current.wardName,
    }));

    if (!matchedProvince || !matchedDistrict || !matchedWard) {
      toast.info('Đã ghim tọa độ. Vui lòng kiểm tra lại Tỉnh/Quận/Phường trước khi lưu.');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await customerService.setDefaultAddress(id);
      toast.success('Đã thiết lập địa chỉ mặc định');
      fetchAddresses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi thiết lập địa chỉ mặc định');
    }
  };

  const fetchWishlist = async () => {
    setWishlistLoading(true);
    try {
      const data = await customerService.getWishlist();
      setWishlist(data);
    } catch (err: any) {
      console.error('Fetch wishlist error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleRemoveWishlist = async (productId: string) => {
    try {
      await customerService.removeFromWishlist(productId);
      toast.success('Đã xóa khỏi danh sách yêu thích');
      setWishlist((prev) => prev.filter((item) => item.product.id !== productId));
      fetchProfile();
    } catch {
      toast.error('Lỗi khi xóa sản phẩm yêu thích');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await customerService.updateProfile({
        fullName: nameInput,
        phoneNumber: phoneInput,
      });
      toast.success('Cập nhật thông tin tài khoản thành công');
      fetchProfile();
      authService.getMe();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmNewPass) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }
    if (newPass.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    setUpdatingPassword(true);
    try {
      await customerService.changePassword({
        currentPassword: currentPass,
        newPassword: newPass,
      });
      toast.success('Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới');
      setCurrentPass('');
      setNewPass('');
      setConfirmNewPass('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Mật khẩu hiện tại không đúng');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSendSecurityOtp = async () => {
    setSendingSecurityOtp(true);
    try {
      const res = await customerService.sendPasswordOtp();
      setMaskedSecurityEmail(res.maskedEmail || maskEmail(currentUser?.email));
      setSecurityMode('AWAIT_OTP');
      setOtpCountdown(60);
      toast.success(res.message || 'Mã xác thực đã được gửi về Gmail của bạn!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể gửi mã xác thực. Vui lòng thử lại!');
    } finally {
      setSendingSecurityOtp(false);
    }
  };

  const handleVerifySecurityOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityOtp.trim()) {
      toast.error('Vui lòng nhập mã OTP 6 số');
      return;
    }
    setVerifyingSecurityOtp(true);
    try {
      await customerService.verifyPasswordOtp(securityOtp.trim());
      toast.success('Xác thực Email thành công! Hãy thiết lập mật khẩu mới.');
      setSecurityMode('SET_NEW_PASSWORD');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn');
    } finally {
      setVerifyingSecurityOtp(false);
    }
  };

  const handleSaveNewPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmNewPass) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }
    if (newPass.length < 6) {
      toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    setSettingNewPassword(true);
    try {
      await customerService.setPasswordWithOtp({
        otp: securityOtp.trim(),
        newPassword: newPass,
      });
      toast.success('Thiết lập mật khẩu mới thành công! Bạn có thể sử dụng mật khẩu này để đăng nhập.');
      setNewPass('');
      setConfirmNewPass('');
      setSecurityOtp('');
      setSecurityMode('VERIFY_METHOD');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi lưu mật khẩu mới. Vui lòng thử lại!');
    } finally {
      setSettingNewPassword(false);
    }
  };

  const handleReorder = (order: CustomerOrder) => {
    const firstItem = order.orderItems[0];
    if (!firstItem?.product) {
      toast.error('Sản phẩm không còn khả dụng để mua lại');
      return;
    }
    setActiveCheckoutProduct({
      product: {
        id: firstItem.product.id,
        title: firstItem.product.title,
        price: firstItem.unitPrice,
        imageUrl: firstItem.product.imageUrl || '',
        stockQuantity: 99,
      },
      store: {
        id: order.storeId,
        name: order.store?.name || 'Gian Hàng Đối Tác',
      },
    });
  };

  const selectedProvince = provinces.find((p) => String(p.code) === String(addressForm.provinceCode));
  const selectedDistrict = selectedProvince?.districts.find((d) => String(d.code) === String(addressForm.districtCode));

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612]">
      <PublicHeader />

      <main className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* ========================================================= */}
          {/* LEFT SIDEBAR - USER CARD & SCANMS Standard NAVIGATION MENU */}
          {/* ========================================================= */}
          {/* ========================================================= */}
          {/* LEFT SIDEBAR - USER CARD & SCANMS Standard NAVIGATION MENU (IMAGE 3) */}
          {/* ========================================================= */}
          <aside className="w-full lg:w-[240px] shrink-0 bg-transparent flex flex-col gap-3.5 text-left sticky top-20 self-start">
            {/* User Identity Header (SCANMS UI Reference Style) */}
            <div className="flex items-center gap-3 px-1 py-1">
              {/* Hidden file input for avatar upload */}
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarFileSelected}
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
              />

              <div className="relative shrink-0 group">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="w-12 h-12 rounded-full border border-[#EAE4D7] overflow-hidden bg-[#FAF8F5] flex items-center justify-center text-[#8C6226] font-bold text-lg select-none relative cursor-pointer group-hover:opacity-90 transition shadow-2xs"
                  title="Bấm vào để tải/đổi ảnh đại diện"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 text-[#B88E4F] animate-spin" />
                  ) : (profileData?.user.avatarUrl || currentUser?.avatarUrl) ? (
                    <img
                      src={profileData?.user.avatarUrl || currentUser?.avatarUrl || ''}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {profileData?.user.fullName ? profileData.user.fullName.charAt(0).toUpperCase() : currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                  {/* Hover Camera Overlay */}
                  {!uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              </div>

              <div className="min-w-0 flex-1 text-left">
                <strong className="block text-sm font-bold text-[#1A1612] truncate">
                  {username}
                </strong>
                <button
                  type="button"
                  onClick={() => setTab('profile')}
                  className="inline-flex items-center gap-1 text-xs text-[#7D715E] hover:text-[#C59B58] transition-colors mt-0.5 cursor-pointer font-normal"
                >
                  <Edit2 className="w-3 h-3 text-[#7D715E]" />
                  <span>Sửa Hồ Sơ</span>
                </button>
              </div>
            </div>

            <div className="border-t border-[#EAE4D7] my-0.5" />

            {/* SCANMS Standard Minimalist Menu Navigation */}
            <nav className="flex flex-col space-y-1 text-xs sm:text-[13px]">
              {/* 1. Tài Khoản Của Tôi (Nằm trên cùng, Expandable) */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsAccountSubmenuOpen(!isAccountSubmenuOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left group ${
                    currentTab === 'profile' || currentTab === 'identity' || currentTab === 'addresses' || currentTab === 'security'
                      ? 'text-[#B88E4F] font-bold'
                      : 'text-[#1A1612] hover:text-[#B88E4F] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className={`w-4 h-4 shrink-0 ${currentTab === 'profile' || currentTab === 'identity' || currentTab === 'addresses' || currentTab === 'security' ? 'text-[#B88E4F]' : 'text-[#7D715E] group-hover:text-[#B88E4F]'}`} />
                    <span>Tài Khoản Của Tôi</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#7D715E] transition-transform duration-200 ${isAccountSubmenuOpen ? 'rotate-180 text-[#B88E4F]' : ''}`} />
                </button>

                {/* Sub-menu items (indented SCANMS Standard) */}
                {isAccountSubmenuOpen && (
                  <div className="pl-10 pr-2 py-1 flex flex-col space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setTab('profile')}
                      className={`w-full text-left py-1 text-xs transition-colors cursor-pointer ${
                        currentTab === 'profile' ? 'text-[#B88E4F] font-bold' : 'text-[#574C3D] hover:text-[#B88E4F]'
                      }`}
                    >
                      Hồ Sơ
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('identity')}
                      className={`w-full text-left py-1 text-xs transition-colors cursor-pointer ${
                        currentTab === 'identity' ? 'text-[#B88E4F] font-bold' : 'text-[#574C3D] hover:text-[#B88E4F]'
                      }`}
                    >
                      Xác minh CCCD
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('addresses')}
                      className={`w-full text-left py-1 text-xs transition-colors cursor-pointer ${
                        currentTab === 'addresses' ? 'text-[#B88E4F] font-bold' : 'text-[#574C3D] hover:text-[#B88E4F]'
                      }`}
                    >
                      Địa Chỉ
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('security')}
                      className={`w-full text-left py-1 text-xs transition-colors cursor-pointer ${
                        currentTab === 'security' ? 'text-[#B88E4F] font-bold' : 'text-[#574C3D] hover:text-[#B88E4F]'
                      }`}
                    >
                      Đổi Mật Khẩu
                    </button>
                  </div>
                )}
              </div>

              {/* Ví Tiền & Nạp Rút */}
              <button
                type="button"
                onClick={() => setTab('wallet')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left group ${
                  currentTab === 'wallet'
                    ? 'text-[#B88E4F] font-bold bg-[#FAF8F5]'
                    : 'text-[#1A1612] hover:text-[#B88E4F] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wallet className={`w-4 h-4 shrink-0 ${currentTab === 'wallet' ? 'text-[#B88E4F]' : 'text-[#7D715E] group-hover:text-[#B88E4F]'}`} />
                  <span>Ví Tiền & Nạp Rút</span>
                </div>
              </button>

              {/* 2. Đơn Mua (Active SCANMS Standard) */}
              <button
                type="button"
                onClick={() => setTab('orders')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left group ${
                  currentTab === 'orders'
                    ? 'text-[#B88E4F] font-bold bg-[#FAF5EB]'
                    : 'text-[#1A1612] hover:text-[#B88E4F] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className={`w-4 h-4 shrink-0 ${currentTab === 'orders' ? 'text-[#B88E4F]' : 'text-[#7D715E] group-hover:text-[#B88E4F]'}`} />
                  <span>Đơn Mua</span>
                </div>
                {(profileData?.stats.pendingOrders ?? 0) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#C59B58] text-white text-[10px] font-bold shrink-0">
                    {profileData?.stats.pendingOrders}
                  </span>
                )}
              </button>

              {/* 3. Kho Voucher */}
              <button
                type="button"
                onClick={() => setTab('vouchers')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left group ${
                  currentTab === 'vouchers'
                    ? 'text-[#B88E4F] font-bold bg-[#FAF5EB]'
                    : 'text-[#1A1612] hover:text-[#B88E4F] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Ticket className={`w-4 h-4 shrink-0 ${currentTab === 'vouchers' ? 'text-[#B88E4F]' : 'text-[#7D715E] group-hover:text-[#B88E4F]'}`} />
                  <span>Kho Voucher</span>
                </div>
              </button>

              {/* 5. Sản Phẩm Yêu Thích */}
              <button
                type="button"
                onClick={() => setTab('wishlist')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left group ${
                  currentTab === 'wishlist'
                    ? 'text-[#B88E4F] font-bold bg-[#FAF5EB]'
                    : 'text-[#1A1612] hover:text-[#B88E4F] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart className={`w-4 h-4 shrink-0 ${currentTab === 'wishlist' ? 'text-[#B88E4F]' : 'text-[#7D715E] group-hover:text-[#B88E4F]'}`} />
                  <span>Sản Phẩm Yêu Thích</span>
                </div>
                {(profileData?.stats.wishlistCount ?? 0) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#FAF0DD] border border-[#E8D4B0] text-[#8C6226] text-[10px] font-bold shrink-0">
                    {profileData?.stats.wishlistCount}
                  </span>
                )}
              </button>

              {/* 6. Nâng Cấp Đối Tác (Cuối cùng, VIP Partner Upgrade) */}
              <button
                type="button"
                onClick={() => setTab('upgrade')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer text-left group ${
                  currentTab === 'upgrade'
                    ? 'text-[#B88E4F] font-bold bg-[#FAF5EB]'
                    : 'text-[#1A1612] hover:text-[#B88E4F] hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#C59B58] shrink-0" />
                  <span className="truncate">Nâng Cấp Đối Tác</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-[3px] bg-[#DC2626] text-white text-[9.5px] font-bold uppercase tracking-wider shrink-0">
                  New
                </span>
              </button>
            </nav>

            <div className="border-t border-[#EAE4D7] my-1" />

            {/* Utilities: Tiếp tục mua sắm & Đăng xuất */}
            <div className="flex flex-col space-y-1 text-xs">
              <Link
                to="/marketplace"
                className="flex items-center gap-2.5 px-3 py-2 text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] rounded-lg transition-colors font-medium group"
              >
                <ArrowLeft className="w-4 h-4 text-[#7D715E] group-hover:text-[#C59B58] transition-colors shrink-0" />
                <Home className="w-4 h-4 text-[#7D715E] group-hover:text-[#C59B58] transition-colors shrink-0" />
                <span>Sàn Mua Sắm</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  authService.logout();
                  navigate('/login');
                }}
                className="flex items-center gap-3 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-medium cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* RIGHT MAIN PANEL - CONTENT ACCORDING TO ACTIVE TAB */}
          {/* ========================================================= */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 text-left">
            {/* ------------------------------------------------------------- */}
            {/* TAB 0: VÍ KHÁCH HÀNG (CUSTOMER WALLET) */}
            {/* ------------------------------------------------------------- */}
            {currentTab === 'wallet' && <CustomerWalletTab />}

            {/* ------------------------------------------------------------- */}
            {/* TAB 1: ĐƠN MUA CỦA TÔI (SCANMS Standard) */}
            {/* ------------------------------------------------------------- */}
            {currentTab === 'orders' && (
              <div className="flex flex-col gap-3">
                {/* 1. SCANMS Standard Top Status Filter Tabs Bar (Image 1) */}
                <div className="bg-white border border-[#EAE4D7] rounded-xl shadow-2xs overflow-hidden">
                  <div className="flex items-center overflow-x-auto scrollbar-none border-b border-[#EAE4D7]">
                    {[
                      { key: 'ALL', label: 'Tất cả' },
                      { key: 'UNPAID', label: 'Chờ thanh toán' },
                      { key: 'SHIPPING', label: 'Vận chuyển' },
                      { key: 'RECEIVING', label: 'Chờ giao hàng' },
                      { key: 'COMPLETED', label: 'Hoàn thành' },
                      { key: 'CANCELLED', label: 'Đã hủy' },
                      { key: 'RETURNED', label: 'Trả hàng/Hoàn tiền' },
                    ].map((tab) => {
                      const isActive = orderStatusFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setOrderStatusFilter(tab.key as OrderFilterStatus)}
                          className={`relative flex-1 py-3.5 px-3 sm:px-4 text-xs sm:text-sm transition-colors cursor-pointer text-center whitespace-nowrap ${
                            isActive
                              ? 'text-[#C59B58] font-bold'
                              : 'text-[#574C3D] hover:text-[#C59B58] font-medium'
                          }`}
                        >
                          <span>{tab.label}</span>
                          {isActive && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#C59B58] rounded-t-full shadow-xs" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* 2. SCANMS Standard Search Bar (Image 1) */}
                  <div className="p-3 sm:p-3.5 bg-[#FAF8F5]">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        fetchOrders();
                      }}
                      className="relative flex items-center bg-white border border-[#EAE4D7] focus-within:border-[#C59B58] focus-within:ring-2 focus-within:ring-[#C59B58]/20 rounded-lg px-3 py-2 transition shadow-2xs group"
                    >
                      <Search className="w-4 h-4 text-[#7D715E] group-focus-within:text-[#B88E4F] shrink-0 mr-2.5 transition-colors" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Bạn có thể tìm kiếm theo tên Shop, ID đơn hàng hoặc Tên Sản phẩm"
                        className="min-w-0 flex-1 bg-transparent text-xs sm:text-sm text-[#1A1612] placeholder-[#8C7E6C] outline-none font-normal"
                      />
                      {orderSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderSearch('');
                            setTimeout(() => fetchOrders(), 0);
                          }}
                          className="p-1 text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] rounded-md transition mr-1 cursor-pointer shrink-0"
                          title="Xóa tìm kiếm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-md bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold text-xs transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
                      >
                        Tìm kiếm
                      </button>
                    </form>
                  </div>
                </div>

                {/* 3. Orders List (SCANMS UI Reference Cards) */}
                {ordersLoading ? (
                  <div className="py-16 bg-white border border-[#EAE4D7] rounded-xl flex flex-col items-center justify-center gap-3 text-[#7D715E]">
                    <Loader2 className="w-8 h-8 text-[#B88E4F] animate-spin" />
                    <span className="text-xs font-semibold">Đang tải danh sách đơn mua...</span>
                  </div>
                ) : ordersError ? (
                  <div className="py-16 bg-white border border-[#EAE4D7] rounded-xl text-center flex flex-col items-center justify-center gap-4 p-6">
                    <div className="w-16 h-16 rounded-full bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] flex items-center justify-center">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-[#1A1612] block">Chưa tải được đơn mua</strong>
                      <p className="text-xs text-[#7D715E] mt-1 max-w-sm m-0">
                        Kiểm tra kết nối rồi thử tải lại. Đơn hàng của bạn vẫn được giữ an toàn trên hệ thống.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void fetchOrders()}
                      className="px-5 py-2.5 rounded-lg bg-[#C59B58] text-white text-xs font-bold hover:bg-[#B88E4F] transition shadow-xs cursor-pointer"
                    >
                      Thử tải lại
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-16 bg-white border border-[#EAE4D7] rounded-xl text-center flex flex-col items-center justify-center gap-4 p-6">
                    <div className="w-16 h-16 rounded-full bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-[#1A1612] block">
                        Chưa có đơn hàng nào
                      </strong>
                      <p className="text-xs text-[#7D715E] mt-1 max-w-sm m-0">
                        {orderStatusFilter === 'ALL'
                          ? 'Bạn chưa có đơn mua nào trên SCANMS. Hãy khám phá ngay các sản phẩm chính hãng với nhiều ưu đãi nhé!'
                          : `Không tìm thấy đơn hàng nào ở mục "${orderStatusFilter}".`}
                      </p>
                    </div>
                    <Link
                      to="/marketplace"
                      className="px-5 py-2.5 rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition shadow-xs"
                    >
                      Khám phá sản phẩm ngay
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {orders.map((order) => {
                      const isPending = order.status === 'PENDING';
                      const isShipping = order.status === 'SHIPPING';
                      const isDelivered = order.status === 'DELIVERED';
                      const isCompleted = order.status === 'COMPLETED';
                      const isCancelled = order.status === 'CANCELLED';
                      const isReturned = order.status === 'RETURNED' || order.status === 'RETURN_REQUESTED';
                      const hasReturnRequest = Boolean(order.returnRequest) || ['RETURN_REQUESTED', 'DISPUTED', 'RETURNED'].includes(order.status);
                      const returnAnchor = new Date(order.deliveredAt || order.completedAt || 0).getTime();
                      const canRequestReturn =
                        (isDelivered || isCompleted) &&
                        !hasReturnRequest &&
                        Date.now() <= returnAnchor + 14 * 24 * 60 * 60 * 1000;

                      return (
                        <div
                          key={order.id}
                          className="bg-white border border-[#EAE4D7] hover:border-[#C59B58]/60 rounded-xl shadow-2xs hover:shadow-xs transition flex flex-col overflow-hidden"
                        >
                          {/* Order Card Header (SCANMS Standard) */}
                          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:px-5 sm:py-3.5 border-b border-[#F0EBE0]">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className="px-1.5 py-0.5 rounded-[2px] bg-[#C59B58] text-white text-[10.5px] font-bold tracking-tight">
                                Yêu thích
                              </span>
                              <Link
                                to={`/shop/${order.store?.slug || order.storeId}`}
                                className="text-xs sm:text-sm font-bold text-[#1A1612] hover:text-[#B88E4F] transition flex items-center gap-1"
                              >
                                <StoreIcon className="w-3.5 h-3.5 text-[#B88E4F]" />
                                <span>{order.store?.name || 'Gian Hàng Đối Tác'}</span>
                              </Link>
                              <span className="text-[11px] font-mono text-[#7D715E] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#EAE4D7]">
                                #{order.externalOrderSn}
                              </span>

                              <div className="flex items-center gap-1.5 ml-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenChat(order)}
                                  className="px-2.5 py-1 rounded-[4px] text-[11px] font-medium text-[#1A1612] bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58]/50 transition flex items-center gap-1 cursor-pointer active:scale-95"
                                  title="Chat ngay với người bán"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-[#B88E4F]" />
                                  <span>Chat</span>
                                </button>

                                <Link
                                  to={`/shop/${order.store?.slug || order.storeId}`}
                                  className="px-2.5 py-1 rounded-[4px] text-[11px] font-medium text-[#7D715E] hover:text-[#1A1612] bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58]/50 transition flex items-center gap-1 active:scale-95"
                                >
                                  <StoreIcon className="w-3.5 h-3.5 text-[#7D715E]" />
                                  <span>Xem Shop</span>
                                </Link>
                              </div>
                            </div>

                            {/* Order Status on Right (Image 1 Style) */}
                            <div className="flex items-center gap-2">
                              {isCancelled && (
                                <span className="text-xs font-bold text-[#DC2626] uppercase tracking-wide">
                                  ĐÃ HỦY
                                </span>
                              )}
                              {isDelivered && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <Truck className="w-3.5 h-3.5 text-[#059669]" />
                                  <span className="text-[#059669] font-medium">Giao hàng thành công</span>
                                  <span className="text-[#EAE4D7]">|</span>
                                  <span className="font-bold text-[#B88E4F] uppercase">HOÀN THÀNH</span>
                                </div>
                              )}
                              {isCompleted && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <Truck className="w-3.5 h-3.5 text-[#059669]" />
                                  <span className="text-[#059669] font-medium">Giao hàng thành công</span>
                                  <span className="text-[#EAE4D7]">|</span>
                                  <span className="font-bold text-[#B88E4F] uppercase">HOÀN THÀNH</span>
                                </div>
                              )}
                              {isDelivered && !isCompleted && (
                                <div className="flex items-center gap-1.5 text-xs text-[#059669]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span className="font-bold uppercase">ĐÃ GIAO HÀNG</span>
                                </div>
                              )}
                              {isShipping && (
                                <div className="flex items-center gap-1.5 text-xs text-blue-700">
                                  <Truck className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                                  <span className="font-bold uppercase">ĐANG VẬN CHUYỂN</span>
                                </div>
                              )}
                              {isPending && (
                                <div className="flex items-center gap-1.5 text-xs text-amber-700">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span className="font-bold uppercase">CHỜ XÁC NHẬN</span>
                                </div>
                              )}
                              {hasReturnRequest && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                                  <RotateCcw className="w-3 h-3" />
                                  <span>{order.returnRequest?.status === 'SHOP_APPROVED' ? 'Shop đã duyệt · chờ xử lý tiền/hàng'
                                    : order.returnRequest?.status === 'SHOP_REJECTED' ? 'Shop đã từ chối đổi trả'
                                    : order.returnRequest?.status === 'REFUNDED' ? 'Đã hoàn tiền'
                                    : 'Đang xử lý trả hàng'}</span>
                                </span>
                              )}
                              {isCancelled && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                                  <XCircle className="w-3 h-3" />
                                  <span>Đã hủy đơn</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {order.returnRequest?.shopResponse && (
                            <div className="mx-3.5 sm:mx-5 mt-3 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#1A1612]">
                              <strong>Phản hồi của Shop:</strong> {order.returnRequest.shopResponse}
                            </div>
                          )}

                          {/* Order Items List (SCANMS Standard) */}
                          <div className="divide-y divide-[#F5EFE6] px-3.5 sm:px-5">
                            {order.orderItems.map((item) => (
                              <div key={item.id} className="py-3.5 flex items-start gap-3.5">
                                <div className="w-20 h-20 rounded-lg bg-[#FAF8F5] border border-[#EAE4D7] overflow-hidden shrink-0 flex items-center justify-center">
                                  <img
                                    src={getSafeProductImageUrl(item.product?.imageUrl, item.product?.title)}
                                    alt={item.product?.title || 'Sản phẩm'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      if (!target.dataset.hasFallback) {
                                        target.dataset.hasFallback = 'true';
                                        target.src = getSafeProductImageUrl(null, item.product?.title);
                                      }
                                    }}
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <strong className="block text-xs sm:text-sm font-medium text-[#1A1612] line-clamp-2 leading-snug hover:text-[#B88E4F] transition">
                                    {item.product?.title || 'Sản phẩm chính hãng SCANMS'}
                                  </strong>
                                  {item.variant?.name && (
                                    <span className="text-xs text-[#7D715E] block mt-1">
                                      Phân loại hàng: {item.variant.name}
                                    </span>
                                  )}
                                  <span className="text-xs text-[#7D715E] block mt-0.5">
                                    x{item.quantity}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-[10.5px] text-[#059669] bg-[#059669]/6 border border-[#059669]/20 px-1.5 py-0.5 rounded-[3px] font-medium">
                                      7 ngày trả hàng miễn phí
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenChat(order, item)}
                                      className="inline-flex items-center gap-1 text-[11px] text-[#7D715E] hover:text-[#C59B58] font-medium transition cursor-pointer hover:underline"
                                      title="Trao đổi với người bán về sản phẩm này"
                                    >
                                      <MessageCircle className="w-3 h-3 text-[#B88E4F]" />
                                      <span>Chat về sản phẩm</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-xs sm:text-sm font-semibold text-[#1A1612] font-mono">
                                    {formatMoney(Number(item.unitPrice) * item.quantity)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Dispute / Return Banner if Returned */}
                          {isReturned && (
                            <div className="mx-3.5 sm:mx-5 my-2.5 p-3 rounded-lg bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <strong className="font-bold text-amber-950">Yêu cầu Trả hàng / Hoàn tiền đang được xử lý</strong>
                                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">ĐANG XÉT DUYỆT</span>
                                </div>
                                <p className="mt-1 text-amber-800/90 leading-relaxed m-0">
                                  {order.overrideReason || (order.rawPayload?.dispute?.reason ? `Lý do: ${order.rawPayload.dispute.reason}` : 'Hệ thống SCANMS đang chuyển yêu cầu tới gian hàng đối tác và trọng tài sàn.')}
                                </p>
                                <span className="text-[11px] text-amber-700 font-mono mt-1.5 block">
                                  Số tiền hoàn dự kiến: <strong className="text-amber-950 font-bold">{formatMoney(order.finalAmount)}</strong>
                                </span>

                                {/* Display uploaded proof images & videos */}
                                {(order.rawPayload?.dispute?.customerProofImages?.length > 0 || order.rawPayload?.dispute?.customerProofVideos?.length > 0) && (
                                  <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center gap-2 overflow-x-auto">
                                    <span className="text-[11px] font-bold text-amber-950 shrink-0">Bằng chứng khui hàng:</span>
                                    {order.rawPayload.dispute.customerProofImages?.map((url: string, idx: number) => (
                                      <a
                                        key={`img-${idx}`}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 rounded-lg border border-amber-300 overflow-hidden shrink-0 hover:opacity-90 block bg-white"
                                        title="Bấm để xem ảnh phóng to"
                                      >
                                        <img src={url} alt={`Bằng chứng ${idx + 1}`} className="w-full h-full object-cover" />
                                      </a>
                                    ))}
                                    {order.rawPayload.dispute.customerProofVideos?.map((url: string, idx: number) => (
                                      <a
                                        key={`vid-${idx}`}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-12 px-3 rounded-lg bg-amber-900 text-white text-[11px] font-bold flex items-center gap-1.5 shrink-0 hover:bg-amber-800 transition"
                                        title="Bấm để xem video mở hộp"
                                      >
                                        <span>▶ Xem Video ({idx + 1})</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Order Footer: Summary & Action Buttons (Image 1 Style) */}
                          <div className="p-3.5 sm:px-5 sm:py-4 bg-[#FAF8F5]/80 border-t border-[#F0EBE0] flex flex-col gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-xs text-[#7D715E]">
                                {isCancelled ? (
                                  <span className="text-[#DC2626] font-medium">Đã hủy bởi bạn</span>
                                ) : isReturned ? (
                                  <span className="text-amber-700 font-medium">Mã đơn: <strong className="font-mono text-[#1A1612]">#{order.externalOrderSn}</strong> • Đang xử lý hoàn tiền</span>
                                ) : (
                                  <span>Mã đơn: <strong className="font-mono text-[#1A1612]">#{order.externalOrderSn}</strong> • Đặt lúc: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm text-[#7D715E]">Thành tiền:</span>
                                <strong className="text-lg sm:text-xl font-bold text-[#C59B58] font-mono">
                                  {formatMoney(order.finalAmount)}
                                </strong>
                              </div>
                            </div>

                            {/* Action Buttons Row (SCANMS Standard) */}
                            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-[#EAE4D7]/70">
                              {/* Primary Button: Mua Lại */}
                              <button
                                type="button"
                                onClick={() => handleReorder(order)}
                                className="px-5 sm:px-6 py-2 rounded-md bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Mua Lại</span>
                              </button>

                              {/* Secondary Button: Xem chi tiết */}
                              <button
                                type="button"
                                onClick={() => setSelectedOrderDetails(order)}
                                className="px-4 py-2 rounded-md bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58]/50 text-xs font-medium text-[#1A1612] transition cursor-pointer"
                              >
                                {isCancelled ? 'Xem Chi Tiết Hủy Đơn' : isReturned ? 'Xem Chi Tiết Khiếu Nại' : 'Xem Chi Tiết Đơn Hàng'}
                              </button>

                              {/* Tertiary Button: Liên hệ người bán */}
                              <button
                                type="button"
                                onClick={() => handleOpenChat(order)}
                                className="px-4 py-2 rounded-md bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58]/50 text-xs font-medium text-[#1A1612] transition cursor-pointer flex items-center gap-1.5"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-[#7D715E]" />
                                <span>Liên Hệ Người Bán</span>
                              </button>

                              {/* Return / Refund Request Button */}
                              {!isCancelled && !isReturned && (
                                <button
                                  type="button"
                                  onClick={() => setReturnOrder(order)}
                                  className="px-4 py-2 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-semibold text-amber-800 transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Yêu Cầu Trả Hàng / Hoàn Tiền</span>
                                </button>
                              )}

                              {/* Cancel Button if Pending */}
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => setCancellingOrderId(order.id)}
                                  className="px-4 py-2 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-medium text-rose-700 transition cursor-pointer"
                                >
                                  Hủy Đơn
                                </button>
                              )}

                              {/* Confirm Receipt Button if Delivered */}
                              {isDelivered && !hasReturnRequest && (
                                <button
                                  type="button"
                                  disabled={confirmingOrderId === order.id}
                                  onClick={() => handleConfirmReceipt(order)}
                                  className="px-4 py-2 rounded-md bg-[#C59B58] hover:bg-[#B88E4F] disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                                >
                                  {confirmingOrderId === order.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                  <span>Đã Nhận Hàng</span>
                                </button>
                              )}

                              {/* Return Request Button */}
                              {canRequestReturn && (
                                <button
                                  type="button"
                                  onClick={() => setReturnOrder(order)}
                                  className="px-4 py-2 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-semibold text-amber-800 transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Yêu Cầu Trả Hàng / Hoàn Tiền</span>
                                </button>
                              )}

                              {/* Verified Review Button if Completed */}
                              {isCompleted && !hasReturnRequest && (
                                <button
                                  type="button"
                                  onClick={() => setReviewOrder(order)}
                                  className="px-4 py-2 rounded-md bg-[#231D15] hover:bg-[#1A1612] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#C59B58]" />
                                  <span>Đánh Giá Đã Xác Minh</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 2: SỔ ĐỊA CHỈ NHẬN HÀNG (ADDRESS BOOK) */}
            {/* ------------------------------------------------------------- */}
            {currentTab === 'addresses' && (
              <div className="bg-white border border-[#EAE4D7] rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE4D7]">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-[#1A1612] m-0 font-display">
                      Sổ Địa Chỉ Nhận Hàng
                    </h1>
                    <p className="text-xs text-[#7D715E] mt-1 m-0">
                      Lưu sẵn địa chỉ giao hàng để đặt hàng 1-chạm cực nhanh chóng
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddAddressModal}
                    className="px-4 py-2.5 rounded-xl bg-[#EBD08C] hover:bg-[#DEC07A] text-white text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm địa chỉ mới</span>
                  </button>
                </div>

                {addressesLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#7D715E]">
                    <Loader2 className="w-8 h-8 text-[#B88E4F] animate-spin" />
                    <span className="text-xs font-semibold">Đang tải sổ địa chỉ...</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] flex items-center justify-center">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-[#1A1612] block">
                        Chưa có địa chỉ nhận hàng
                      </strong>
                      <p className="text-xs text-[#7D715E] mt-1 m-0">
                        Hãy thêm địa chỉ nhận hàng đầu tiên để tự động điền khi mua sắm nhé!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openAddAddressModal}
                      className="px-4 py-2 rounded-xl bg-[#EBD08C] text-white text-xs font-bold hover:bg-[#DEC07A] transition"
                    >
                      Thêm ngay
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 text-left ${
                          addr.isDefault
                            ? 'bg-[#FBF5EB]/60 border-[#C59B58] ring-1 ring-[#C59B58]/30 shadow-xs'
                            : 'bg-white border-[#EAE4D7] hover:border-[#C59B58]'
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <strong className="text-sm font-black text-[#1A1612]">
                                {addr.fullName}
                              </strong>
                              <span className="text-xs text-[#7D715E]">| {addr.phoneNumber}</span>
                            </div>
                            {addr.isDefault && (
                              <span className="text-[10px] font-black uppercase text-[#B88E4F] bg-[#FBF5EB] px-2 py-0.5 rounded-full border border-[#EAE4D7]">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#1A1612] leading-relaxed m-0">
                            {addr.detailAddress}
                          </p>
                          <span className="text-xs text-[#7D715E] block">
                            {addr.wardName}, {addr.districtName}, {addr.provinceName}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-[#EAE4D7] flex items-center justify-between gap-2">
                          {!addr.isDefault ? (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-xs font-bold text-[#B88E4F] hover:underline cursor-pointer"
                            >
                              Đặt làm mặc định
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Địa chỉ giao chính</span>
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditAddressModal(addr)}
                              className="w-8 h-8 rounded-xl bg-white border border-[#EAE4D7] hover:border-[#C59B58] hover:bg-[#FAF8F5] flex items-center justify-center text-[#7D715E] hover:text-[#B88E4F] shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-95 group"
                              title="Sửa địa chỉ"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#8C6226] group-hover:text-[#B88E4F] group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddressPendingDeletion(addr)}
                              className="w-8 h-8 rounded-xl bg-white border border-rose-200 hover:border-rose-400 hover:bg-rose-50 flex items-center justify-center text-rose-500 hover:text-rose-600 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-95 group"
                              title="Xóa địa chỉ"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 3: SẢN PHẨM YÊU THÍCH (WISHLIST) */}
            {/* ------------------------------------------------------------- */}
            {currentTab === 'wishlist' && (
              <div className="bg-white border border-[#EAE4D7] rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                <div className="pb-4 border-b border-[#EAE4D7]">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1A1612] m-0 font-display">
                    Sản Phẩm Yêu Thích
                  </h1>
                  <p className="text-xs text-[#7D715E] mt-1 m-0">
                    Danh sách các sản phẩm bạn đã lưu lại để theo dõi giá và đặt mua sau
                  </p>
                </div>

                {wishlistLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#7D715E]">
                    <Loader2 className="w-8 h-8 text-[#B88E4F] animate-spin" />
                    <span className="text-xs font-semibold">Đang tải sản phẩm yêu thích...</span>
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center">
                      <Heart className="w-8 h-8" />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-[#1A1612] block">
                        Chưa có sản phẩm yêu thích
                      </strong>
                      <p className="text-xs text-[#7D715E] mt-1 m-0">
                        Nhấn nút Trái tim ❤️ ở các sản phẩm trên sàn để lưu vào đây nhé!
                      </p>
                    </div>
                    <Link
                      to="/marketplace"
                      className="px-4 py-2 rounded-xl bg-[#EBD08C] text-white text-xs font-bold hover:bg-[#DEC07A] transition"
                    >
                      Dạo chợ mua sắm
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {wishlist.map((item) => {
                      const p = item.product;
                      return (
                        <div
                          key={item.wishlistId}
                          className="bg-white border border-[#EAE4D7] hover:border-[#C59B58] rounded-2xl p-4 shadow-2xs transition flex flex-col justify-between group"
                        >
                          <div>
                            <div className="relative aspect-square rounded-xl bg-[#FAF8F5] overflow-hidden mb-3">
                              <img
                                src={getSafeProductImageUrl(p.imageUrl, p.title)}
                                alt={p.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  if (!target.dataset.hasFallback) {
                                    target.dataset.hasFallback = 'true';
                                    target.src = getSafeProductImageUrl(null, p.title);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveWishlist(p.id)}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-rose-500 hover:bg-rose-50 flex items-center justify-center shadow-xs transition cursor-pointer"
                                title="Bỏ thích"
                              >
                                <Heart className="w-4 h-4 fill-current" />
                              </button>
                            </div>

                            <Link to={p.store?.id ? `/shops/${p.store.id}` : '/marketplace'} className="text-[10px] font-bold text-[#7D715E] uppercase block mb-1 hover:text-[#B88E4F]">
                              {p.store?.name || 'Gian hàng chính hãng'}
                            </Link>
                            <Link
                              to={`/products/${p.sku || p.id}`}
                              className="text-xs font-bold text-[#1A1612] hover:text-[#B88E4F] line-clamp-2 transition mb-2 block"
                            >
                              {p.title}
                            </Link>

                            <div className="flex items-baseline gap-2 mb-3">
                              <strong className="text-sm font-black text-[#B88E4F]">
                                {formatMoney(p.price)}
                              </strong>
                              {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                                <span className="text-[11px] text-[#7D715E] line-through">
                                  {formatMoney(p.originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[#EAE4D7] flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCheckoutProduct({
                                  product: {
                                    id: p.id,
                                    title: p.title,
                                    price: p.price,
                                    imageUrl: p.imageUrl || '',
                                    stockQuantity: p.stockQuantity || 99,
                                  },
                                  store: {
                                    id: p.store?.id || '',
                                    name: p.store?.name || 'Gian Hàng',
                                  },
                                });
                              }}
                              className="flex-1 py-2 rounded-xl bg-[#EBD08C] hover:bg-[#DEC07A] text-white text-xs font-bold transition text-center cursor-pointer shadow-2xs"
                            >
                              Mua ngay
                            </button>
                            <Link
                              to={`/products/${p.sku || p.id}`}
                              className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#1A1612] transition"
                              title="Xem chi tiết"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 4: HỒ SƠ CỦA TÔI (SCANMS Standard - IMAGE 1) */}
            {/* ------------------------------------------------------------- */}
            {currentTab === 'profile' && (
              <div className="bg-white border border-[#EAE4D7] rounded-xl p-6 sm:p-8 shadow-2xs text-left">
                {/* Header */}
                <div className="pb-4 border-b border-[#EAE4D7]">
                  <h1 className="text-xl font-bold text-[#1A1612] m-0 font-display">
                    Hồ Sơ Của Tôi
                  </h1>
                  <p className="text-xs text-[#7D715E] mt-1 m-0">
                    Quản lý thông tin hồ sơ để bảo mật tài khoản
                  </p>
                </div>

                {/* Form & Avatar Body */}
                <div className="pt-6 flex flex-col-reverse md:flex-row items-start gap-8 lg:gap-12">
                  {/* Left Column: Form Fields (SCANMS UI Reference) */}
                  <form onSubmit={handleUpdateProfile} className="flex-1 w-full space-y-5">
                    {/* 1. Tên đăng nhập */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0">
                        Tên đăng nhập
                      </label>
                      <div className="flex-1">
                        <span className="text-xs sm:text-sm text-[#1A1612] font-semibold">
                          {username}
                        </span>
                        <p className="text-[11px] text-[#A89D8E] mt-0.5 m-0">
                          Tên đăng nhập chỉ có thể thay đổi một lần.
                        </p>
                      </div>
                    </div>

                    {/* 2. Tên */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0">
                        Tên
                      </label>
                      <div className="flex-1 max-w-md">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          required
                          placeholder="Nhập họ và tên"
                          className="w-full bg-white border border-[#EAE4D7] focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58] rounded-md px-3.5 py-2 text-xs sm:text-sm text-[#1A1612] outline-none transition"
                        />
                      </div>
                    </div>

                    {/* 3. Email */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0">
                        Email
                      </label>
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-xs sm:text-sm text-[#1A1612]">
                          {maskEmail(profileData?.user.email || currentUser?.email)}
                        </span>
                        <button
                          type="button"
                          onClick={() => toast.info('Email đã được bảo mật theo chuẩn định danh')}
                          className="text-xs text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
                        >
                          Thay Đổi
                        </button>
                      </div>
                    </div>

                    {/* 4. Số điện thoại */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0">
                        Số điện thoại
                      </label>
                      <div className="flex-1">
                        {isEditingPhone ? (
                          <div className="flex items-center gap-2 max-w-xs">
                            <input
                              type="tel"
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              placeholder="0912345678"
                              className="w-full bg-white border border-[#C59B58] rounded-md px-3 py-1.5 text-xs text-[#1A1612] outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setIsEditingPhone(false)}
                              className="px-2.5 py-1.5 rounded bg-[#FAF5EB] text-xs font-semibold text-[#8C6226] border border-[#EEDFC6] hover:bg-[#C59B58] hover:text-white transition cursor-pointer shrink-0"
                            >
                              Xong
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-xs sm:text-sm text-[#1A1612]">
                              {phoneInput ? maskPhone(phoneInput) : 'Chưa cập nhật'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsEditingPhone(true)}
                              className="text-xs text-blue-600 hover:text-blue-700 underline font-medium cursor-pointer"
                            >
                              Thay Đổi
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 5. Giới tính */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0 flex items-center sm:justify-end gap-1">
                        <span>Giới tính</span>
                        <HelpCircle className="w-3 h-3 text-[#A89D8E]" />
                      </label>
                      <div className="flex items-center gap-5 text-xs sm:text-sm text-[#1A1612]">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            checked={gender === 'MALE'}
                            onChange={() => setGender('MALE')}
                            className="accent-[#C59B58] w-4 h-4 cursor-pointer"
                          />
                          <span>Nam</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            checked={gender === 'FEMALE'}
                            onChange={() => setGender('FEMALE')}
                            className="accent-[#C59B58] w-4 h-4 cursor-pointer"
                          />
                          <span>Nữ</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            checked={gender === 'OTHER'}
                            onChange={() => setGender('OTHER')}
                            className="accent-[#C59B58] w-4 h-4 cursor-pointer"
                          />
                          <span>Khác</span>
                        </label>
                      </div>
                    </div>

                    {/* 6. Ngày sinh */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                      <label className="sm:w-32 sm:text-right text-xs text-[#7D715E] font-medium shrink-0 flex items-center sm:justify-end gap-1">
                        <span>Ngày sinh</span>
                        <HelpCircle className="w-3 h-3 text-[#A89D8E]" />
                      </label>
                      <div className="flex items-center gap-2">
                        <Select
                          value={birthDay}
                          onChange={(e) => setBirthDay(e.target.value)}
                          className="w-28 text-xs font-semibold"
                        >
                          {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                            <option key={d} value={d}>
                              Ngày {d}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={birthMonth}
                          onChange={(e) => setBirthMonth(e.target.value)}
                          className="w-28 text-xs font-semibold"
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                            <option key={m} value={m}>
                              Tháng {m}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={birthYear}
                          onChange={(e) => setBirthYear(e.target.value)}
                          className="w-28 text-xs font-semibold"
                        >
                          {Array.from({ length: 70 }, (_, i) => String(2015 - i)).map((y) => (
                            <option key={y} value={y}>
                              Năm {y}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    {/* 7. Nút Lưu (SCANMS Standard) */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 pt-3">
                      <div className="sm:w-32 shrink-0" />
                      <button
                        type="submit"
                        disabled={updatingProfile || profileLoading}
                        className="px-8 py-2.5 rounded-md bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs flex items-center justify-center gap-2 self-start"
                      >
                        {(updatingProfile || profileLoading) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Lưu</span>
                      </button>
                    </div>
                  </form>

                  {/* Vertical Divider */}
                  <div className="hidden md:block w-px bg-[#EAE4D7] self-stretch mx-2" />

                  {/* Right Column: Avatar Upload (SCANMS UI Reference) */}
                  <div className="w-full md:w-64 flex flex-col items-center justify-center py-4 px-2">
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="w-28 h-28 rounded-full border border-[#EAE4D7] bg-[#FAF8F5] overflow-hidden flex items-center justify-center relative shadow-xs cursor-pointer group hover:border-[#C59B58] transition"
                        title="Bấm để chọn ảnh đại diện mới"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="w-8 h-8 text-[#B88E4F] animate-spin" />
                        ) : profileData?.user.avatarUrl || currentUser?.avatarUrl ? (
                          <img
                            src={profileData?.user.avatarUrl || currentUser?.avatarUrl || ''}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-[#A89D8E]" />
                        )}
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                          <Camera className="w-5 h-5 text-white drop-shadow" />
                          <span className="text-[10px] font-bold mt-1">Đổi ảnh</span>
                        </div>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="mt-4 px-5 py-2 rounded-md border border-[#EAE4D7] hover:border-[#C59B58] bg-white hover:bg-[#FAF8F5] text-xs font-medium text-[#1A1612] hover:text-[#C59B58] transition cursor-pointer shadow-2xs"
                    >
                      {uploadingAvatar ? 'Đang tải...' : 'Chọn Ảnh'}
                    </button>

                    <div className="mt-3 text-center text-[11px] text-[#7D715E] leading-relaxed space-y-0.5">
                      <p className="m-0">Dụng lượng file tối đa 1 MB</p>
                      <p className="m-0">Định dạng:.JPEG, .PNG</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB 5: NÂNG CẤP ĐỐI TÁC (KOL / SHOP MANAGER) */}
            {/* ------------------------------------------------------------- */}
            {currentTab === 'upgrade' && <PartnerUpgradeTab />}

            {currentTab === 'identity' && (
              <section className="bg-white border border-[#EAE4D7] rounded-2xl p-6 sm:p-10 shadow-2xs text-left max-w-4xl">
                {/* Header (Chuẩn SCANMS) */}
                <div className="pb-4 border-b border-[#EAE4D7]">
                  <div className="flex items-center justify-between gap-3">
                    <h1 className="text-lg sm:text-xl font-bold text-[#1A1612] m-0 font-display">
                      Thông tin cá nhân
                    </h1>
                    {cccdVerified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EB] border border-[#EEDFC6] text-[#B88E4F] text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                        Đã xác thực thông quan
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[#7D715E] mt-1.5 leading-relaxed m-0">
                    Bạn vui lòng nhập chính xác thông tin CCCD để đơn hàng được thông quan theo quy định từ ngày 9/7. Thông tin sẽ được bảo mật theo Chính sách Bảo mật SCANMS
                  </p>
                </div>

                {/* Form căn chỉnh 2 cột ngang Chuẩn SCANMS */}
                {loadingIdentity ? (
                  <div className="py-16 flex flex-col items-center justify-center text-[#7D715E] text-xs gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#C59B58]" />
                    <span>Đang tải thông tin cá nhân...</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitIdentity} className="mt-8 space-y-6 max-w-2xl">
                    {/* Hàng 1: Họ và tên */}
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <label className="sm:w-36 text-left sm:text-right pr-6 text-xs sm:text-sm text-[#574C3D] shrink-0 mb-1.5 sm:mb-0">
                        Họ và tên
                      </label>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={cccdFullName}
                          onChange={(e) => setCccdFullName(e.target.value)}
                          placeholder="Họ và tên đầy đủ trên CCCD"
                          className="w-full bg-white border border-[#EAE4D7] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/15 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#1A1612] outline-none transition placeholder:text-[#A89F91]"
                        />
                      </div>
                    </div>

                    {/* Hàng 2: Số CCCD */}
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <label className="sm:w-36 text-left sm:text-right pr-6 text-xs sm:text-sm text-[#574C3D] shrink-0 mb-1.5 sm:mb-0">
                        Số CCCD
                      </label>
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={12}
                          value={cccdIdNumber}
                          onChange={(e) => setCccdIdNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="Số định danh cá nhân trên CCCD"
                          className="w-full bg-white border border-[#EAE4D7] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/15 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#1A1612] outline-none transition placeholder:text-[#A89F91]"
                        />
                      </div>
                    </div>

                    {/* Hàng 3: Địa chỉ */}
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <label className="sm:w-36 text-left sm:text-right pr-6 text-xs sm:text-sm text-[#574C3D] shrink-0 pt-2.5 mb-1.5 sm:mb-0">
                        Địa chỉ
                      </label>
                      <div className="flex-1">
                        <input
                          type="text"
                          maxLength={200}
                          value={cccdAddress}
                          onChange={(e) => setCccdAddress(e.target.value)}
                          placeholder="Địa chỉ Nơi thường trú trên CCCD"
                          className="w-full bg-white border border-[#EAE4D7] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/15 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#1A1612] outline-none transition placeholder:text-[#A89F91]"
                        />
                        <div className="text-right text-xs text-[#7D715E] mt-1.5">
                          {cccdAddress.length}/200
                        </div>
                      </div>
                    </div>

                    {/* Hàng 4: Nút Xác Nhận (Canh lề thẳng hàng với các ô input) */}
                    <div className="flex flex-col sm:flex-row sm:items-center pt-2">
                      <div className="hidden sm:block sm:w-36 shrink-0 pr-6" />
                      <div className="flex-1">
                        <button
                          type="submit"
                          disabled={
                            submittingIdentity ||
                            !cccdFullName.trim() ||
                            !cccdIdNumber.trim() ||
                            !cccdAddress.trim()
                          }
                          className={`px-8 py-2.5 rounded-md text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-center gap-2 ${
                            !cccdFullName.trim() || !cccdIdNumber.trim() || !cccdAddress.trim()
                              ? 'bg-[#F3EFE6] text-[#A89F91] cursor-not-allowed border border-[#EAE4D7]'
                              : 'bg-[#C59B58] hover:bg-[#B88E4F] text-white shadow-xs'
                          }`}
                        >
                          {submittingIdentity && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                          <span>Xác Nhận</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: KHO VOUCHER (COUPONS & DISCOUNTS) */}
            {/* ------------------------------------------------------------- */}
            {currentTab === 'vouchers' && (
              <div className="bg-white border border-[#EAE4D7] rounded-2xl p-6 shadow-2xs flex flex-col gap-6 text-left">
                <div className="pb-4 border-b border-[#EAE4D7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-[#1A1612] m-0 font-display flex items-center gap-2">
                      <Ticket className="w-6 h-6 text-[#C59B58]" />
                      <span>Kho Voucher &amp; Mã Giảm Giá</span>
                    </h1>
                    <p className="text-xs text-[#7D715E] mt-1 m-0">
                      Thu thập các mã giảm giá sàn và voucher độc quyền từ đối tác SCANMS
                    </p>
                  </div>
                  <Link
                    to="/marketplace"
                    className="px-4 py-2 rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <span>Dùng mã mua ngay</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      code: 'SCANMS15',
                      title: 'Giảm 15% Đơn Hàng Đối Tác',
                      discount: '15%',
                      minSpend: 'Đơn từ 200.000₫',
                      expiry: 'HSD: 31/12/2026',
                      scope: 'Toàn bộ gian hàng chính hãng',
                      tag: 'ĐỐI TÁC',
                    },
                    {
                      code: 'FREESHIP50K',
                      title: 'Miễn Phí Vận Chuyển Toàn Sàn',
                      discount: 'Tối đa 50K',
                      minSpend: 'Đơn từ 150.000₫',
                      expiry: 'HSD: 31/12/2026',
                      scope: 'Áp dụng cho mọi đơn hàng',
                      tag: 'VẬN CHUYỂN',
                    },
                    {
                      code: 'KOLWELCOME',
                      title: 'Voucher Khách Mới SCANMS',
                      discount: '30.000₫',
                      minSpend: 'Đơn từ 0₫',
                      expiry: 'HSD: 31/12/2026',
                      scope: 'Khách hàng đăng ký mới',
                      tag: 'KHÁCH MỚI',
                    },
                    {
                      code: 'SORASKIN20',
                      title: 'Giảm 20% Gian Hàng Sora Skin',
                      discount: '20%',
                      minSpend: 'Đơn từ 350.000₫',
                      expiry: 'HSD: 30/11/2026',
                      scope: 'Sora Skin Official Store',
                      tag: 'SHOP VOUCHER',
                    },
                  ].map((voucher) => (
                    <div
                      key={voucher.code}
                      className="border border-[#EAE4D7] hover:border-[#C59B58] rounded-xl p-4 bg-[#FAF8F5] hover:bg-white transition flex flex-col justify-between gap-3 shadow-2xs group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#FAF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center font-black text-sm shrink-0">
                            {voucher.discount}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-[#8C6226] bg-[#FAF5EB] border border-[#EEDFC6] px-1.5 py-0.5 rounded-[3px] uppercase">
                              {voucher.tag}
                            </span>
                            <strong className="block text-xs sm:text-sm font-bold text-[#1A1612] truncate mt-1">
                              {voucher.title}
                            </strong>
                            <p className="text-[11px] text-[#7D715E] m-0 mt-0.5">
                              {voucher.minSpend} • {voucher.scope}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[#EAE4D7] flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#7D715E] font-medium">{voucher.expiry}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(voucher.code);
                              toast.success(`Đã sao chép mã ${voucher.code}`);
                            }}
                            className="px-3 py-1.5 rounded-md border border-[#EAE4D7] hover:border-[#C59B58] bg-white text-xs font-semibold text-[#1A1612] hover:text-[#B88E4F] transition flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{voucher.code}</span>
                          </button>
                          <Link
                            to="/marketplace"
                            className="px-3 py-1.5 rounded-md bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition shadow-xs"
                          >
                            Dùng ngay
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* ------------------------------------------------------------- */}
            {/* TAB: ĐỔI MẬT KHẨU & BẢO MẬT */}
            {/* ------------------------------------------------------------- */}
            {/* ------------------------------------------------------------- */}
            {/* TAB: ĐỔI MẬT KHẨU & BẢO MẬT (Chuẩn SCANMS XÁC THỰC EMAIL) */}
            {/* ------------------------------------------------------------- */}
            {currentTab === 'security' && (
              <div className="flex flex-col gap-6 w-full max-w-xl">
                {/* 1. MÀN HÌNH CHỌN PHƯƠNG THỨC XÁC MINH (Chuẩn SCANMS Ảnh 2) */}
                {securityMode === 'VERIFY_METHOD' && (
                  <div className="flex flex-col gap-6">
                    <div className="bg-white border border-[#EAE4D7] rounded-2xl p-6 sm:p-8 shadow-2xs text-center flex flex-col items-center">
                      {/* Shield Badge Icon */}
                      <div className="w-16 h-16 rounded-full bg-[#FAF5EB] border-2 border-[#EEDFC6] text-[#C59B58] flex items-center justify-center mb-4 shadow-xs">
                        <Shield className="w-8 h-8 text-[#C59B58]" />
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-[#1A1612] max-w-md leading-relaxed m-0 font-display">
                        Để tăng cường bảo mật cho tài khoản của bạn, hãy xác minh thông tin bằng phương thức sau.
                      </h2>

                      {/* Nút gửi link/mã qua Email (SCANMS Standard) */}
                      <button
                        type="button"
                        onClick={handleSendSecurityOtp}
                        disabled={sendingSecurityOtp}
                        className="w-full mt-6 py-3 px-5 rounded-xl border border-[#EAE4D7] hover:border-[#C59B58] bg-[#FAF8F5] hover:bg-white text-xs sm:text-sm font-bold text-[#1A1612] flex items-center justify-center gap-2.5 transition shadow-2xs cursor-pointer group disabled:opacity-60"
                      >
                        {sendingSecurityOtp ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#C59B58]" />
                        ) : (
                          <Mail className="w-4 h-4 text-[#7D715E] group-hover:text-[#C59B58] transition" />
                        )}
                        <span>Xác minh bằng liên kết / Mã OTP gửi qua Email</span>
                      </button>

                      {/* Tùy chọn đổi bằng mật khẩu hiện tại (nếu đã có mật khẩu) */}
                      <div className="mt-5 pt-4 border-t border-[#F0EBE0] w-full text-center">
                        <button
                          type="button"
                          onClick={() => setSecurityMode('DIRECT_CHANGE')}
                          className="text-xs text-[#7D715E] hover:text-[#C59B58] font-semibold transition cursor-pointer flex items-center justify-center gap-1 mx-auto"
                        >
                          <Lock className="w-3.5 h-3.5 text-[#B88E4F]" />
                          <span>Đã có mật khẩu cũ? Đổi trực tiếp bằng mật khẩu hiện tại →</span>
                        </button>
                      </div>
                    </div>

                    {/* Câu hỏi thường gặp FAQs (Theo chuẩn SCANMS Ảnh 2) */}
                    <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl p-5 flex flex-col gap-4 text-xs text-left">
                      <div>
                        <strong className="text-[#1A1612] font-bold block mb-1">
                          Câu hỏi: Vì sao tôi phải xác minh tài khoản?
                        </strong>
                        <p className="text-[#7D715E] leading-relaxed m-0">
                          Trả lời: Nâng cao tiêu chuẩn bảo mật tài khoản cho người dùng là ưu tiên hàng đầu của SCANMS. SCANMS yêu cầu xác minh tài khoản để đảm bảo không ai khác ngoài bạn được phép đăng nhập hoặc thiết lập mật khẩu tài khoản của mình.
                        </p>
                      </div>
                      <div className="border-t border-[#EAE4D7] pt-3">
                        <strong className="text-[#1A1612] font-bold block mb-1">
                          Câu hỏi: Tôi phải làm gì nếu như không xác minh được tài khoản?
                        </strong>
                        <p className="text-[#7D715E] leading-relaxed m-0">
                          Trả lời: Vui lòng liên hệ Bộ phận CSKH của SCANMS qua mục Chat hỗ trợ trực tuyến để được nhân viên hỗ trợ xác minh thủ công.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MÀN HÌNH CHỜ NHẬP MÃ OTP GỬI QUA EMAIL (Chuẩn SCANMS Ảnh 3) */}
                {securityMode === 'AWAIT_OTP' && (
                  <div className="bg-white border border-[#EAE4D7] rounded-2xl p-6 sm:p-8 shadow-2xs text-center flex flex-col items-center relative">
                    <button
                      type="button"
                      onClick={() => setSecurityMode('VERIFY_METHOD')}
                      className="absolute left-5 top-5 p-2 rounded-xl text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] border border-transparent hover:border-[#EAE4D7] transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Quay lại</span>
                    </button>

                    <h2 className="text-base sm:text-lg font-black text-[#1A1612] m-0 font-display mt-2 sm:mt-0">
                      Xác minh bằng mã gửi qua Email
                    </h2>
                    <p className="text-xs text-[#7D715E] mt-1.5 max-w-sm leading-relaxed">
                      Vui lòng kiểm tra hộp thư đến (hoặc thư mục <strong>Thư rác / Spam</strong>) và nhập mã xác thực OTP đã được gửi đến địa chỉ Email:
                    </p>
                    <strong className="text-xs sm:text-sm font-bold text-[#1A1612] bg-[#FAF8F5] px-3 py-1 rounded-lg border border-[#EAE4D7] mt-2 inline-block">
                      {maskedSecurityEmail || maskEmail(currentUser?.email)}
                    </strong>

                    {/* Envelope Icon Circle (SCANMS UI Reference) */}
                    <div className="w-16 h-16 rounded-full bg-[#FAF5EB] border border-[#EEDFC6] text-[#C59B58] flex items-center justify-center my-6 shadow-xs">
                      <Mail className="w-8 h-8 text-[#C59B58]" />
                    </div>

                    <form onSubmit={handleVerifySecurityOtp} className="w-full max-w-xs flex flex-col gap-4">
                      <div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          autoFocus
                          value={securityOtp}
                          onChange={(e) => setSecurityOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-3 px-4 border-2 border-[#EAE4D7] focus:border-[#C59B58] focus:ring-4 focus:ring-[#C59B58]/15 rounded-xl outline-none transition bg-white text-[#1A1612]"
                        />
                      </div>

                      <div className="text-xs text-[#7D715E]">
                        {otpCountdown > 0 ? (
                          <span>
                            Vui lòng chờ trong <strong className="text-[#C59B58] font-bold">{otpCountdown}</strong> giây để gửi lại.
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendSecurityOtp}
                            disabled={sendingSecurityOtp}
                            className="text-[#C59B58] hover:text-[#B88E4F] font-bold underline transition cursor-pointer"
                          >
                            {sendingSecurityOtp ? 'Đang gửi...' : 'Gửi lại mã OTP qua Email'}
                          </button>
                        )}
                      </div>

                      {/* Clean Security Notice (SCANMS Standard) */}
                      <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-left text-xs text-[#7D715E] flex items-start gap-2.5 shadow-2xs">
                        <Mail className="w-4 h-4 text-[#C59B58] shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed text-[#7D715E]">
                          Mã xác thực 6 số bảo mật đã được gửi đến hộp thư Gmail của bạn. Vui lòng mở ứng dụng Gmail (kiểm tra cả mục <strong>Thư rác / Spam</strong> nếu chưa thấy trong Hộp thư chính) để lấy mã OTP.
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={verifyingSecurityOtp || securityOtp.length < 6}
                        className="mt-2 py-3 px-6 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                      >
                        {verifyingSecurityOtp && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>Tiếp Tục (Xác Nhận OTP)</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. MÀN HÌNH THIẾT LẬP MẬT KHẨU MỚI (Sau khi xác thực Email) */}
                {securityMode === 'SET_NEW_PASSWORD' && (
                  <div className="bg-white border border-[#EAE4D7] rounded-2xl p-6 sm:p-8 shadow-2xs text-left flex flex-col gap-6">
                    <div className="pb-4 border-b border-[#EAE4D7]">
                      <h1 className="text-xl sm:text-2xl font-black text-[#1A1612] m-0 font-display flex items-center gap-2">
                        <KeyRound className="w-6 h-6 text-[#C59B58]" />
                        <span>Thiết Lập Mật Khẩu Mới</span>
                      </h1>
                      <p className="text-xs text-[#7D715E] mt-1 m-0">
                        Đã xác minh chủ tài khoản thành công qua Email. Vui lòng thiết lập mật khẩu mới (tối thiểu 6 ký tự)
                      </p>
                    </div>

                    <form onSubmit={handleSaveNewPasswordWithOtp} className="flex flex-col gap-4">
                      {/* Hidden username input for Browser Password Managers (Edge, Chrome) */}
                      <input
                        type="email"
                        name="username"
                        value={currentUser?.email || ''}
                        autoComplete="username"
                        readOnly
                        tabIndex={-1}
                        aria-hidden="true"
                        className="sr-only"
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
                      />
                      <div>
                        <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                          Mật khẩu mới
                        </label>
                        <input
                          type="password"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                          className="w-full bg-white border border-[#EAE4D7] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 rounded-lg px-3.5 py-2.5 text-xs text-[#1A1612] outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          value={confirmNewPass}
                          onChange={(e) => setConfirmNewPass(e.target.value)}
                          required
                          autoComplete="new-password"
                          placeholder="Nhập lại mật khẩu mới..."
                          className="w-full bg-white border border-[#EAE4D7] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 rounded-lg px-3.5 py-2.5 text-xs text-[#1A1612] outline-none transition"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={settingNewPassword}
                        className="mt-2 py-3 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                      >
                        {settingNewPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>Lưu Mật Khẩu Mới</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 4. MÀN HÌNH ĐỔI TRỰC TIẾP BẰNG MẬT KHẨU CŨ */}
                {securityMode === 'DIRECT_CHANGE' && (
                  <div className="bg-white border border-[#EAE4D7] rounded-2xl p-6 sm:p-8 shadow-2xs text-left flex flex-col gap-6">
                    <div className="pb-4 border-b border-[#EAE4D7]">
                      <h1 className="text-xl sm:text-2xl font-black text-[#1A1612] m-0 font-display flex items-center gap-2">
                        <Lock className="w-6 h-6 text-[#C59B58]" />
                        <span>Đổi Mật Khẩu Bằng Mật Khẩu Hiện Tại</span>
                      </h1>
                      <p className="text-xs text-[#7D715E] mt-1 m-0">
                        Để bảo vệ tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
                      </p>
                    </div>

                    <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                      {/* Hidden username input for Browser Password Managers (Edge, Chrome) */}
                      <input
                        type="email"
                        name="username"
                        value={currentUser?.email || ''}
                        autoComplete="username"
                        readOnly
                        tabIndex={-1}
                        aria-hidden="true"
                        className="sr-only"
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
                      />
                      <div>
                        <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                          Mật khẩu hiện tại
                        </label>
                        <input
                          type="password"
                          value={currentPass}
                          onChange={(e) => setCurrentPass(e.target.value)}
                          required
                          autoComplete="current-password"
                          placeholder="Nhập mật khẩu hiện tại..."
                          className="w-full bg-white border border-[#EAE4D7] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 rounded-lg px-3.5 py-2.5 text-xs text-[#1A1612] outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                          Mật khẩu mới
                        </label>
                        <input
                          type="password"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          placeholder="Tối thiểu 6 ký tự..."
                          className="w-full bg-white border border-[#EAE4D7] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 rounded-lg px-3.5 py-2.5 text-xs text-[#1A1612] outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          value={confirmNewPass}
                          onChange={(e) => setConfirmNewPass(e.target.value)}
                          required
                          autoComplete="new-password"
                          placeholder="Nhập lại mật khẩu mới..."
                          className="w-full bg-white border border-[#EAE4D7] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 rounded-lg px-3.5 py-2.5 text-xs text-[#1A1612] outline-none transition"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={updatingPassword}
                        className="mt-2 py-3 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs sm:text-sm font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                      >
                        {updatingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Xác nhận đổi mật khẩu</span>
                      </button>

                      <div className="text-center pt-3 border-t border-[#F0EBE0]">
                        <button
                          type="button"
                          onClick={() => setSecurityMode('VERIFY_METHOD')}
                          className="text-xs text-[#C59B58] hover:text-[#B88E4F] font-bold transition cursor-pointer"
                        >
                          Quên mật khẩu cũ hoặc đăng ký bằng Google? Xác minh qua Email →
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: CHI TIẾT ĐƠN HÀNG & TIMELINE VẬN CHUYỂN */}
      {/* ========================================================= */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE4D7] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-4 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4D7]">
              <div>
                <strong className="text-base font-black text-[#1A1612] block">
                  Chi Tiết Đơn Hàng #{selectedOrderDetails.externalOrderSn}
                </strong>
                <span className="text-xs text-[#7D715E]">
                  Đặt lúc: {new Date(selectedOrderDetails.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-[#F3EFE6] text-[#7D715E] flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Store Info Banner */}
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-[#C59B58]" />
                <strong className="text-xs sm:text-sm font-bold text-[#1A1612]">
                  {selectedOrderDetails.store?.name || 'Gian Hàng Đối Tác'}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenChat(selectedOrderDetails)}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold text-[#1A1612] bg-white border border-[#EAE4D7] hover:border-[#C59B58] transition flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#C59B58]" />
                  <span>Chat Shop</span>
                </button>
                <Link
                  to={`/shop/${selectedOrderDetails.store?.slug || selectedOrderDetails.storeId}`}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold text-[#7D715E] hover:text-[#1A1612] bg-white border border-[#EAE4D7] hover:border-[#C59B58] transition"
                >
                  Xem Shop
                </Link>
              </div>
            </div>

            {/* Timeline Stepper */}
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7] flex items-center justify-between text-center text-xs">
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <span className="font-bold text-[#1A1612]">Đặt hàng</span>
              </div>
              <div className="h-0.5 flex-1 bg-[#EAE4D7] mx-2" />
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    selectedOrderDetails.status !== 'CANCELLED'
                      ? 'bg-[#C59B58] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {selectedOrderDetails.status === 'PENDING' ? '⏳' : '✓'}
                </div>
                <span className="font-bold text-[#1A1612]">Xác nhận</span>
              </div>
              <div className="h-0.5 flex-1 bg-[#EAE4D7] mx-2" />
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    selectedOrderDetails.status === 'SHIPPING' ||
                    selectedOrderDetails.status === 'DELIVERED' ||
                    selectedOrderDetails.status === 'COMPLETED'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  🚚
                </div>
                <span className="font-bold text-[#1A1612]">Đang giao</span>
              </div>
              <div className="h-0.5 flex-1 bg-[#EAE4D7] mx-2" />
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    selectedOrderDetails.status === 'DELIVERED' ||
                    selectedOrderDetails.status === 'COMPLETED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  ★
                </div>
                <span className="font-bold text-[#1A1612]">Hoàn tất</span>
              </div>
            </div>

            {/* Dispute / Return Banner if Returned */}
            {selectedOrderDetails.status === 'RETURNED' && (
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <RotateCcw className="w-4 h-4 text-amber-700" />
                    <span>Yêu cầu Trả hàng / Hoàn tiền đang chờ xử lý</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                    ĐANG XÉT DUYỆT
                  </span>
                </div>
                <p className="text-amber-800/90 leading-relaxed m-0">
                  {selectedOrderDetails.overrideReason || (selectedOrderDetails.rawPayload?.dispute?.reason ? `Lý do: ${selectedOrderDetails.rawPayload.dispute.reason}` : 'Đang được sàn SCANMS & gian hàng xác minh.')}
                </p>
                {selectedOrderDetails.rawPayload?.dispute?.customerNotes && (
                  <p className="text-[#574C3D] bg-white/70 p-2 rounded-lg border border-amber-200/60 m-0">
                    <strong>Ghi chú:</strong> {selectedOrderDetails.rawPayload.dispute.customerNotes}
                  </p>
                )}
                {/* Proof Media Preview */}
                {(selectedOrderDetails.rawPayload?.dispute?.customerProofImages?.length > 0 ||
                  selectedOrderDetails.rawPayload?.dispute?.customerProofVideos?.length > 0) && (
                  <div className="pt-2 border-t border-amber-200 flex flex-col gap-1.5">
                    <span className="font-bold text-amber-950 text-[11px]">Bằng chứng khui hàng & kiểm tra:</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {selectedOrderDetails.rawPayload.dispute.customerProofImages?.map((url: string, idx: number) => (
                        <a
                          key={`dt-img-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-14 h-14 rounded-lg border border-amber-300 overflow-hidden shrink-0 hover:opacity-90 block bg-white shadow-2xs"
                          title="Bấm để xem ảnh phóng to"
                        >
                          <img src={url} alt={`Bằng chứng ${idx + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                      {selectedOrderDetails.rawPayload.dispute.customerProofVideos?.map((url: string, idx: number) => (
                        <a
                          key={`dt-vid-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-14 px-3 rounded-lg bg-amber-950 text-white text-[11px] font-bold flex flex-col items-center justify-center shrink-0 hover:bg-amber-900 transition shadow-2xs gap-0.5"
                          title="Bấm để xem video mở hộp"
                        >
                          <span className="text-amber-300 text-xs">▶</span>
                          <span>Video ({idx + 1})</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shipping Info */}
            <div className="p-3.5 bg-white rounded-xl border border-[#EAE4D7] flex flex-col gap-1 text-xs">
              <strong className="text-xs font-bold text-[#1A1612] flex items-center gap-1.5 mb-1">
                <MapPin className="w-4 h-4 text-[#C59B58]" />
                <span>Địa chỉ nhận hàng:</span>
              </strong>
              <span className="text-[#1A1612] font-bold">
                {selectedOrderDetails.customerName} • {selectedOrderDetails.customerPhone}
              </span>
              <span className="text-[#7D715E] leading-relaxed">{selectedOrderDetails.shippingAddress}</span>
            </div>

            {/* Product List */}
            <div className="flex flex-col gap-2">
              <strong className="text-xs font-bold text-[#1A1612]">Kiện hàng chi tiết:</strong>
              <div className="divide-y divide-[#F0EBE0] border border-[#EAE4D7] rounded-xl overflow-hidden bg-white">
                {selectedOrderDetails.orderItems.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-[#FAF8F5] border border-[#EAE4D7] overflow-hidden shrink-0">
                        <img
                          src={getSafeProductImageUrl(item.product?.imageUrl, item.product?.title)}
                          alt={item.product?.title || 'Sản phẩm'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-xs font-medium text-[#1A1612] truncate">
                          {item.product?.title}
                        </strong>
                        {item.variant?.name && (
                          <span className="text-[11px] text-[#7D715E] block">
                            Phân loại: {item.variant.name}
                          </span>
                        )}
                        <span className="text-[11px] text-[#7D715E] block">
                          Số lượng: x{item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderDetails(null);
                            handleOpenChat(selectedOrderDetails, item);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-[#B88E4F] hover:underline font-semibold mt-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Chat về sản phẩm này</span>
                        </button>
                      </div>
                    </div>
                    <strong className="text-xs font-mono font-bold text-[#1A1612] shrink-0">
                      {formatMoney(Number(item.unitPrice) * item.quantity)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="pt-2 border-t border-[#EAE4D7] flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-[#7D715E]">
                <span>Tạm tính:</span>
                <span>{formatMoney(selectedOrderDetails.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-[#7D715E]">
                <span>Phí vận chuyển:</span>
                <span>{formatMoney(selectedOrderDetails.shippingFee)}</span>
              </div>
              {Number(selectedOrderDetails.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Giảm giá coupon:</span>
                  <span>-{formatMoney(selectedOrderDetails.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-base font-bold text-[#C59B58] pt-2 border-t border-[#EAE4D7]">
                <span>Tổng thanh toán:</span>
                <span>{formatMoney(selectedOrderDetails.finalAmount)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#EAE4D7]">
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 rounded-lg bg-[#FAF8F5] hover:bg-[#F3EFE6] text-xs font-semibold text-[#1A1612] transition cursor-pointer"
              >
                Đóng
              </button>

              {/* Return button if eligible */}
              {selectedOrderDetails.status !== 'CANCELLED' && selectedOrderDetails.status !== 'RETURNED' && (
                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedOrderDetails;
                    setSelectedOrderDetails(null);
                    setReturnOrder(ord);
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-semibold text-amber-800 transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Yêu Cầu Trả Hàng / Hoàn Tiền</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const order = selectedOrderDetails;
                  setSelectedOrderDetails(null);
                  handleReorder(order);
                }}
                className="px-5 py-2 rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mua Lại Đơn Này</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: HỦY ĐƠN HÀNG KHI PENDING */}
      {/* ========================================================= */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE4D7] rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 text-left animate-in fade-in zoom-in-95">
            <div>
              <strong className="text-base font-black text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-5 h-5" />
                <span>Xác nhận hủy đơn hàng</span>
              </strong>
              <p className="text-xs text-[#7D715E] mt-1 m-0">
                Đơn hàng đang ở trạng thái Chờ xác nhận. Bạn có thể hủy ngay mà không mất phí.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                Lý do hủy đơn (Tùy chọn)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="VD: Muốn thay đổi địa chỉ, đổi ý không mua nữa..."
                rows={3}
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 text-xs text-[#1A1612] focus:bg-white focus:border-rose-400 outline-none transition"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrderId(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] text-xs font-bold text-[#7D715E] transition cursor-pointer"
              >
                Giữ lại đơn
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelOrder}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isCancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận hủy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: XÁC NHẬN XÓA ĐỊA CHỈ */}
      {/* ========================================================= */}
      {addressPendingDeletion && (
        <div
          className="fixed inset-0 z-[70] bg-[#231D15]/55 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeletingAddress) {
              setAddressPendingDeletion(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-address-title"
            aria-describedby="delete-address-description"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[#EAE4D7] bg-white shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="p-6 sm:p-7 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>

              <h2 id="delete-address-title" className="mt-4 text-lg font-black text-[#1A1612]">
                Xóa địa chỉ nhận hàng?
              </h2>
              <p id="delete-address-description" className="mt-2 text-xs leading-relaxed text-[#7D715E]">
                Địa chỉ này sẽ bị xóa khỏi sổ địa chỉ của bạn. Thao tác này không thể hoàn tác.
              </p>

              <div className="mt-5 rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm font-black text-[#1A1612] truncate">
                    {addressPendingDeletion.fullName}
                  </strong>
                  <span className="text-[11px] font-semibold text-[#7D715E] shrink-0">
                    {addressPendingDeletion.phoneNumber}
                  </span>
                </div>
                <p className="m-0 mt-2 text-xs font-semibold text-[#1A1612]">
                  {addressPendingDeletion.detailAddress}
                </p>
                <p className="m-0 mt-1 text-[11px] leading-relaxed text-[#7D715E]">
                  {addressPendingDeletion.wardName}, {addressPendingDeletion.districtName}, {addressPendingDeletion.provinceName}
                </p>
                {addressPendingDeletion.isDefault && (
                  <span className="inline-flex mt-3 rounded-full border border-[#EEDFC6] bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#B88E4F]">
                    Địa chỉ mặc định
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[#EAE4D7] bg-[#FAF8F5] p-4 sm:px-7">
              <button
                type="button"
                disabled={isDeletingAddress}
                onClick={() => setAddressPendingDeletion(null)}
                className="rounded-xl border border-[#EAE4D7] bg-white px-4 py-2.5 text-xs font-bold text-[#7D715E] transition hover:bg-[#F3EFE6] hover:text-[#1A1612] disabled:opacity-50"
              >
                Giữ lại địa chỉ
              </button>
              <button
                type="button"
                disabled={isDeletingAddress}
                onClick={handleDeleteAddress}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isDeletingAddress ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeletingAddress ? 'Đang xóa...' : 'Xóa địa chỉ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA ĐỊA CHỈ NHẬN HÀNG */}
      {/* ========================================================= */}
      {/* MODAL: XÁC NHẬN XÓA ĐỊA CHỈ */}
      {/* ========================================================= */}
      {addressPendingDeletion && (
        <div
          className="fixed inset-0 z-[70] bg-[#231D15]/55 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeletingAddress) {
              setAddressPendingDeletion(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-address-title"
            aria-describedby="delete-address-description"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[#EAE4D7] bg-white shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="p-6 sm:p-7 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>

              <h2 id="delete-address-title" className="mt-4 text-lg font-black text-[#1A1612]">
                Xóa địa chỉ nhận hàng?
              </h2>
              <p id="delete-address-description" className="mt-2 text-xs leading-relaxed text-[#7D715E]">
                Địa chỉ này sẽ bị xóa khỏi sổ địa chỉ của bạn. Thao tác này không thể hoàn tác.
              </p>

              <div className="mt-5 rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm font-black text-[#1A1612] truncate">
                    {addressPendingDeletion.fullName}
                  </strong>
                  <span className="text-[11px] font-semibold text-[#7D715E] shrink-0">
                    {addressPendingDeletion.phoneNumber}
                  </span>
                </div>
                <p className="m-0 mt-2 text-xs font-semibold text-[#1A1612]">
                  {addressPendingDeletion.detailAddress}
                </p>
                <p className="m-0 mt-1 text-[11px] leading-relaxed text-[#7D715E]">
                  {addressPendingDeletion.wardName}, {addressPendingDeletion.districtName}, {addressPendingDeletion.provinceName}
                </p>
                {addressPendingDeletion.isDefault && (
                  <span className="inline-flex mt-3 rounded-full border border-[#EEDFC6] bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#B88E4F]">
                    Địa chỉ mặc định
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[#EAE4D7] bg-[#FAF8F5] p-4 sm:px-7">
              <button
                type="button"
                disabled={isDeletingAddress}
                onClick={() => setAddressPendingDeletion(null)}
                className="rounded-xl border border-[#EAE4D7] bg-white px-4 py-2.5 text-xs font-bold text-[#7D715E] transition hover:bg-[#F3EFE6] hover:text-[#1A1612] disabled:opacity-50"
              >
                Giữ lại địa chỉ
              </button>
              <button
                type="button"
                disabled={isDeletingAddress}
                onClick={handleDeleteAddress}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isDeletingAddress ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeletingAddress ? 'Đang xóa...' : 'Xóa địa chỉ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA ĐỊA CHỈ NHẬN HÀNG */}
      {/* ========================================================= */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE4D7] rounded-3xl w-full max-w-2xl max-h-[94vh] overflow-y-auto p-6 shadow-2xl flex flex-col gap-5 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4D7]">
              <strong className="text-base font-black text-[#1A1612]">
                {editingAddressId ? 'Chỉnh Sửa Địa Chỉ' : 'Thêm Địa Chỉ Nhận Hàng Mới'}
              </strong>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-[#F3EFE6] text-[#7D715E] flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1A1612] block mb-1">
                    Họ và tên người nhận
                  </label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    required
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full bg-[#FAF8F5] border border-[#EAE4D7] focus:bg-white focus:border-[#C59B58] rounded-xl px-3 py-2 text-xs text-[#1A1612] outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1A1612] block mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phoneNumber}
                    onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                    required
                    placeholder="VD: 0912345678"
                    className="w-full bg-[#FAF8F5] border border-[#EAE4D7] focus:bg-white focus:border-[#C59B58] rounded-xl px-3 py-2 text-xs text-[#1A1612] outline-none transition"
                  />
                </div>
              </div>

              {/* Tỉnh / Thành phố */}
              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1">
                  Tỉnh / Thành phố
                </label>
                <CustomSelect
                  value={addressForm.provinceCode}
                  onChange={(code) => {
                    const p = provinces.find((item) => String(item.code) === String(code));
                    setAddressForm({
                      ...addressForm,
                      provinceCode: code,
                      provinceName: p?.name || '',
                      districtCode: '',
                      districtName: '',
                      wardCode: '',
                      wardName: '',
                      latitude: null,
                      longitude: null,
                    });
                  }}
                  options={provinces.map((p) => ({ value: String(p.code), label: p.name }))}
                  placeholder="-- Chọn Tỉnh / Thành phố --"
                  required
                />
              </div>

              {/* Quận / Huyện */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1A1612] block mb-1">
                    Quận / Huyện
                  </label>
                  <CustomSelect
                    value={addressForm.districtCode}
                    onChange={(code) => {
                      const d = selectedProvince?.districts.find((item) => String(item.code) === String(code));
                      setAddressForm({
                        ...addressForm,
                        districtCode: code,
                        districtName: d?.name || '',
                        wardCode: '',
                        wardName: '',
                        latitude: null,
                        longitude: null,
                      });
                    }}
                    disabled={!selectedProvince}
                    options={(selectedProvince?.districts || []).map((d) => ({ value: String(d.code), label: d.name }))}
                    placeholder="-- Chọn Quận / Huyện --"
                    required
                  />
                </div>

                {/* Phường / Xã */}
                <div>
                  <label className="text-xs font-bold text-[#1A1612] block mb-1">
                    Phường / Xã
                  </label>
                  <CustomSelect
                    value={addressForm.wardCode}
                    onChange={(code) => {
                      const w = selectedDistrict?.wards.find((item) => String(item.code) === String(code));
                      setAddressForm({
                        ...addressForm,
                        wardCode: code,
                        wardName: w?.name || '',
                        latitude: null,
                        longitude: null,
                      });
                    }}
                    disabled={!selectedDistrict}
                    options={(selectedDistrict?.wards || []).map((w) => ({ value: String(w.code), label: w.name }))}
                    placeholder="-- Chọn Phường / Xã --"
                    required
                  />
                </div>
              </div>

              {/* Địa chỉ chi tiết */}
              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1">
                  Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà)
                </label>
                <input
                  type="text"
                  value={addressForm.detailAddress}
                  onChange={(e) => setAddressForm({
                    ...addressForm,
                    detailAddress: e.target.value,
                    latitude: null,
                    longitude: null,
                  })}
                  required
                  placeholder="Ví dụ: Số 123 Đường D1, Chung cư ABC"
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] focus:bg-white focus:border-[#C59B58] rounded-xl px-3 py-2 text-xs text-[#1A1612] outline-none transition"
                />
              </div>

              <AddressLocationPicker
                latitude={addressForm.latitude}
                longitude={addressForm.longitude}
                addressQuery={[
                  addressForm.detailAddress,
                  addressForm.wardName,
                  addressForm.districtName,
                  addressForm.provinceName,
                  'Việt Nam',
                ].filter(Boolean).join(', ')}
                onChange={handleAddressLocationChange}
              />

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-default-address"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-[#B88E4F] focus:ring-[#B88E4F]"
                />
                <label htmlFor="chk-default-address" className="text-xs text-[#1A1612] font-semibold cursor-pointer">
                  Đặt làm địa chỉ nhận hàng mặc định
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[#EAE4D7]">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] text-xs font-bold text-[#7D715E] transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="flex-1 py-2.5 rounded-xl bg-[#EBD08C] hover:bg-[#DEC07A] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  {savingAddress && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu địa chỉ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guest/Connected Checkout Modal */}
      {activeCheckoutProduct && (
        <GuestCheckoutModal
          isOpen={true}
          onClose={() => setActiveCheckoutProduct(null)}
          product={activeCheckoutProduct.product}
          store={activeCheckoutProduct.store}
          onOrderPlaced={(order) => {
            if (order.paymentMethod === 'PAYOS' && order.paymentStatus !== 'PAID') {
              toast.info('Đơn đã tạo. Vui lòng thanh toán bằng QR PayOS.');
            } else {
              toast.success('Đặt hàng thành công!');
            }
            fetchOrders();
            fetchProfile();
          }}
        />
      )}

      {returnOrder && (
        <ReturnRequestModal
          order={returnOrder}
          onClose={() => setReturnOrder(null)}
          onSubmitted={() => {
            setReturnOrder(null);
            fetchOrders();
          }}
        />
      )}

      {reviewOrder && (
        <VerifiedReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSubmitted={() => {
            setReviewOrder(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
