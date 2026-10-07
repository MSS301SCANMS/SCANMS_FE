import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Package,
  User,
  LogOut,
  ChevronRight,
  Store,
  Sparkles,
  Shield,
  Settings,
  MessageSquare,
  Wallet,
  ShoppingBag,
  MapPin,
  Heart,
  SlidersHorizontal,
  X,
  Camera,
  Loader2,
} from 'lucide-react';
import { ScanMSLogo } from '../common/ScanMSLogo';
import { authService, type UserProfile } from '../../services/auth.service';
import { uploadService } from '../../services/upload.service';
import { toast } from '../../utils/toast';
import { useCart } from '../../context/CartContext';
import { ChatBell } from '../chat/ChatBell';

export interface PublicHeaderProps {
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenTracking?: () => void;
  defaultSearchQuery?: string;
  onSearchSubmit?: (query: string) => void;
  onOpenFilter?: () => void;
}

export function PublicHeader({
  cartCount,
  onOpenCart,
  onOpenTracking,
  defaultSearchQuery = '',
  onSearchSubmit,
  onOpenFilter,
}: PublicHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalCount, openCart } = useCart();

  const effectiveCartCount = cartCount !== undefined ? cartCount : totalCount;
  const handleCartClick = onOpenCart || openCart;

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [searchQuery, setSearchQuery] = useState(defaultSearchQuery);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchQuery(defaultSearchQuery);
  }, [defaultSearchQuery]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    const token = localStorage.getItem('token');
    if (token) {
      authService
        .getMe()
        .then((fresh) => {
          if (fresh && fresh.id) setCurrentUser(fresh);
        })
        .catch(() => {
          // Token expired or invalid
        });
    }

    const handleUserSync = () => {
      setCurrentUser(authService.getCurrentUser());
    };
    window.addEventListener('auth-user-updated', handleUserSync);
    return () => window.removeEventListener('auth-user-updated', handleUserSync);
  }, [location.pathname]);

  // Click outside listener for user dropdown menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (onSearchSubmit) {
      onSearchSubmit(query);
    } else {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleFilterClick = () => {
    if (onOpenFilter) {
      onOpenFilter();
    } else if (location.pathname !== '/search') {
      navigate('/search');
    }
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    authService.logout();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const secureUrl = await uploadService.uploadImage(file, 'scanms/avatars');
      await authService.updateAvatar(secureUrl);
      setCurrentUser(authService.getCurrentUser());
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (err: any) {
      console.error('Lỗi tải ảnh đại diện:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể tải ảnh đại diện lên');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const role = currentUser?.role;
  const isCustomer = role === 'CUSTOMER';
  const isKol = role === 'COLLABORATOR';
  const isShop = role === 'SHOP_MANAGER';
  const isAdmin = role === 'SYSTEM_ADMIN' || role === 'SYSTEM_MANAGER';

  const workspacePath = isCustomer
    ? '/customer/orders'
    : isShop
    ? '/merchant/dashboard'
    : isAdmin
    ? '/admin/users'
    : '/collaborator/dashboard';

  const workspaceLabel = isCustomer
    ? 'Đơn Mua Của Tôi 🛍️'
    : isShop
    ? 'Vào Quản Lý Shop ↗'
    : isAdmin
    ? 'Vào Ban Quản Trị ↗'
    : 'Vào Không Gian KOL ↗';

  const storeName = currentUser?.stores?.[0]?.name || 'Gian Hàng Đối Tác';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE4D7] shadow-2xs">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[68px] flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/marketplace" className="flex items-center gap-2 group" title="Về trang chủ Sàn SCANMS">
            <ScanMSLogo size="md" />
          </Link>
        </div>

        {/* Center: Search Form - SCANMS Standard Minimalist with Gold Tone */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex min-w-[280px] w-full flex-1 max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-2 sm:mx-6 items-center rounded-[3px] border border-[#EAE4D7] bg-white p-[3px] shadow-2xs transition-all duration-200 focus-within:border-[#C59B58]"
        >
          <div className="flex min-w-0 flex-1 items-center px-3.5">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              aria-label="Tìm kiếm sản phẩm"
              className="min-w-0 w-full bg-transparent text-xs sm:text-sm font-normal text-[#1A1612] placeholder:text-[#8C7D6B] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (onSearchSubmit) onSearchSubmit('');
                }}
                className="shrink-0 rounded p-1 text-[#7D715E] transition hover:bg-[#F3EFE6] hover:text-[#1A1612] cursor-pointer mr-1"
                aria-label="Xóa nội dung tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="w-14 sm:w-16 h-8 sm:h-9 rounded-[2px] bg-[#C59B58] hover:bg-[#B88E4F] text-white flex items-center justify-center transition cursor-pointer active:scale-95 shrink-0 shadow-2xs"
            title="Tìm kiếm"
            aria-label="Tìm kiếm"
          >
            <Search className="w-4 h-4 text-white" />
          </button>
        </form>

        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* Quick Tracking Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenTracking) {
                onOpenTracking();
              } else {
                navigate('/tracking');
              }
            }}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#1A1612] bg-white border border-[#EAE4D7] hover:border-[#C59B58]/70 hover:bg-[#FAF8F5] transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs group active:scale-[0.98]"
            title="Tra cứu lộ trình đơn hàng & vận chuyển"
          >
            <span className="w-6 h-6 rounded-lg bg-[#FAF8F5] border border-[#EAE4D7] group-hover:bg-[#F3EFE6] group-hover:border-[#C59B58]/40 flex items-center justify-center transition-colors">
              <Package className="w-3.5 h-3.5 text-[#B88E4F] group-hover:scale-110 transition-transform" />
            </span>
            <span>Tra cứu đơn</span>
          </button>

          {/* Quick Cart Button - SCANMS Standard Minimalist Cart Icon */}
          <button
            type="button"
            onClick={handleCartClick}
            className="relative p-2 sm:p-2.5 text-[#B88E4F] hover:text-[#C59B58] transition-colors duration-200 cursor-pointer group active:scale-95 flex items-center justify-center rounded-full hover:bg-[#FBF5EB]"
            title="Mở giỏ hàng sàn SCANMS"
            aria-label="Giỏ hàng"
          >
            <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-[#B88E4F] group-hover:text-[#C59B58] transition-transform group-hover:scale-105" />
            {effectiveCartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[19px] px-1 rounded-full bg-white border border-[#C59B58] text-[#B88E4F] text-[11px] font-black flex items-center justify-center shadow-xs">
                {effectiveCartCount > 99 ? '99+' : effectiveCartCount}
              </span>
            )}
          </button>

          {isCustomer && currentUser?.id && <ChatBell userId={currentUser.id} />}

          {/* AUTHENTICATION & ROLE SECTION */}
          {currentUser ? (
            /* Logged in User Profile & Workspace Link */
            <div className="flex items-center gap-2">
              {isCustomer && (
                <Link
                  to="/customer/upgrade"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#B88E4F] bg-[#FBF5EB] border border-[#EEDFC6] hover:bg-[#F3EFE6] hover:border-[#C59B58] transition shadow-2xs group"
                  title="Nâng cấp tài khoản Khách Hàng lên KOL Tiếp Thị hoặc Mở Shop"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B88E4F] group-hover:scale-110 transition-transform" />
                  <span>Nâng cấp Đối tác</span>
                </Link>
              )}

              {/* User Dropdown Pill - Framed VIP Card */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 sm:gap-2.5 pl-1.5 pr-3 py-1.5 sm:pl-2 sm:pr-3.5 sm:py-1.5 rounded-2xl bg-white/95 border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs group active:scale-[0.98] min-w-[160px] sm:min-w-[190px] ${
                    isUserMenuOpen
                      ? 'border-[#C59B58] ring-2 ring-[#C59B58]/20 bg-[#FAF8F5]'
                      : 'border-[#EAE4D7] hover:border-[#C59B58]/60 hover:bg-[#FAF8F5]'
                  }`}
                  title="Xem thông tin tài khoản và đăng xuất"
                >
                  <div className="relative shrink-0">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.fullName || 'Avatar'}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 border border-[#E8D4B0] shadow-2xs"
                      />
                    ) : (
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#FAF0DD] to-[#F3EFE6] text-[#8C6226] flex items-center justify-center font-black text-xs shrink-0 border border-[#E8D4B0] shadow-2xs">
                        {currentUser.fullName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#059669] border-2 border-white" />
                  </div>
                  <div className="text-left hidden md:block max-w-[130px] sm:max-w-[155px] flex-1 min-w-0">
                    <strong className="block text-xs font-bold text-[#1A1612] truncate leading-none mb-1">
                      {currentUser.fullName || currentUser.email}
                    </strong>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FAF0DD] border border-[#E8D4B0] text-[9.5px] font-black text-[#8C6226] truncate leading-none">
                      {isCustomer ? '🛍️ Khách Mua' : isKol ? '⭐ KOL/KOC' : isShop ? `🏪 ${storeName}` : '🛡️ Admin'}
                    </span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 text-[#7D715E] shrink-0 transition-transform duration-200 group-hover:text-[#B88E4F] ml-auto ${isUserMenuOpen ? 'rotate-90 text-[#B88E4F]' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#EAE4D7] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                    {/* User Identity Box with Avatar Upload */}
                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="relative group shrink-0">
                          {currentUser.avatarUrl ? (
                            <img
                              src={currentUser.avatarUrl}
                              alt={currentUser.fullName || 'Avatar'}
                              className="w-10 h-10 rounded-xl object-cover border border-[#E8D4B0] shadow-2xs"
                            />
                          ) : (
                            <span className="w-10 h-10 rounded-xl bg-[#EAE4D7] text-[#B88E4F] flex items-center justify-center font-black text-sm border border-[#EAE4D7]">
                              {currentUser.fullName?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              avatarInputRef.current?.click();
                            }}
                            disabled={uploadingAvatar}
                            title="Bấm để tải ảnh đại diện lên"
                            className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#C59B58] hover:bg-[#B88E4F] text-white shadow-xs border-2 border-white transition cursor-pointer"
                          >
                            {uploadingAvatar ? (
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            ) : (
                              <Camera className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <strong className="block text-xs font-bold text-[#1A1612] truncate">
                            {currentUser.fullName || 'Người dùng SCANMS'}
                          </strong>
                          <span className="block text-[11px] text-[#7D715E] truncate">
                            {currentUser.email}
                          </span>
                        </div>
                      </div>

                      {/* Hidden avatar input */}
                      <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        className="hidden"
                      />

                      {/* Official Role Badge */}
                      <div className="mt-2 pt-2 border-t border-[#EAE4D7] flex items-center justify-between text-[11px]">
                        <span className="text-[#7D715E] font-medium">Vai trò:</span>
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7]">
                          {isCustomer
                            ? '🛍️ Khách Mua Sắm'
                            : isKol
                            ? '⭐ KOL / KOC Đối Tác'
                            : isShop
                            ? `🏪 Chủ Shop (${storeName})`
                            : '🛡️ Quản Trị Hệ Thống'}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Options */}
                    <div className="space-y-1 py-1">
                      {isCustomer && (
                        <>
                          <Link
                            to="/customer/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <ShoppingBag className="w-4 h-4 text-[#B88E4F]" />
                            <span>Đơn mua của tôi</span>
                          </Link>
                          <Link
                            to="/customer/addresses"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <MapPin className="w-4 h-4 text-[#B88E4F]" />
                            <span>Sổ địa chỉ nhận hàng</span>
                          </Link>
                          <Link
                            to="/customer/wishlist"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <Heart className="w-4 h-4 text-[#B88E4F]" />
                            <span>Sản phẩm yêu thích</span>
                          </Link>
                          <Link
                            to="/customer/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <Settings className="w-4 h-4 text-[#7D715E]" />
                            <span>Hồ sơ & Bảo mật</span>
                          </Link>
                        </>
                      )}

                      {!isCustomer && (
                        <Link
                          to={workspacePath}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                        >
                          {isKol && <Sparkles className="w-4 h-4 text-[#B88E4F]" />}
                          {isShop && <Store className="w-4 h-4 text-[#B88E4F]" />}
                          {isAdmin && <Shield className="w-4 h-4 text-[#B88E4F]" />}
                          <span>{workspaceLabel}</span>
                        </Link>
                      )}

                      {!isCustomer && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            authService.switchWorkspace('customer', navigate);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition text-left cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4 text-[#B88E4F]" />
                          <span>Đơn mua cá nhân (Cổng Khách Hàng)</span>
                        </button>
                      )}

                      {isCustomer && (
                        <Link
                          to="/customer/upgrade"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-[#B88E4F] bg-gradient-to-r from-[#FBF5EB] to-[#F7EDE0] hover:from-[#F3EFE6] hover:to-[#EAE4D7] rounded-xl border border-[#EEDFC6] transition mt-1 shadow-2xs group"
                          title="Nộp hồ sơ nâng cấp thành KOL Tiếp Thị hoặc Mở Shop"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Sparkles className="w-4 h-4 text-[#B88E4F] shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate">Nâng cấp Đối tác (KOL / Shop)</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-black uppercase bg-[#C59B58] text-white shrink-0 shadow-2xs">
                            MỚI
                          </span>
                        </Link>
                      )}

                      {isKol && (
                        <>
                          <Link
                            to="/collaborator/collaboration?tab=messages"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <MessageSquare className="w-4 h-4 text-[#B88E4F]" />
                            <span>Tin nhắn & Hợp tác Shop</span>
                          </Link>
                          <Link
                            to="/collaborator/wallet"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <Wallet className="w-4 h-4 text-[#B88E4F]" />
                            <span>Ví hoa hồng & Rút tiền</span>
                          </Link>
                        </>
                      )}

                      {isShop && (
                        <>
                          <Link
                            to="/merchant/products"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <Store className="w-4 h-4 text-[#B88E4F]" />
                            <span>Quản lý kho sản phẩm</span>
                          </Link>
                          <Link
                            to="/merchant/kol-hub?tab=messages"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <MessageSquare className="w-4 h-4 text-[#B88E4F]" />
                            <span>KOL Hub & Tin nhắn đối tác</span>
                          </Link>
                        </>
                      )}

                      {!isCustomer && (
                        <Link
                          to={isShop ? '/merchant/settings' : isAdmin ? '/admin/users' : '/collaborator/profile'}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                        >
                          <Settings className="w-4 h-4 text-[#7D715E]" />
                          <span>Cài đặt & Hồ sơ tài khoản</span>
                        </Link>
                      )}
                    </div>

                    {/* Explicit Logout Button */}
                    <div className="pt-2 mt-1 border-t border-[#EAE4D7]">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition w-full text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Đăng xuất tài khoản</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Guest (Not Logged In) Authentication Actions */
            <div className="flex items-center gap-1.5">
              <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E]">
                <User className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span>Khách mua sắm</span>
              </span>

              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#1A1612] bg-white/95 border border-[#EAE4D7] hover:bg-[#FAF8F5] hover:border-[#C59B58]/70 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98]"
              >
                Đăng nhập
              </Link>

              <Link
                to="/register"
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#1A1612] bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] transition-all duration-200 shadow-sm shadow-[#C59B58]/20 active:scale-[0.98]"
              >
                Đăng ký đối tác
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-3 pt-1 border-t border-[#F3EFE6] bg-[#FFFEFC]">
        <form
          onSubmit={handleSearch}
          className="flex min-w-0 items-center rounded-[3px] border border-[#EAE4D7] bg-white p-[2px] shadow-2xs focus-within:border-[#C59B58]"
        >
          <div className="flex min-w-0 flex-1 items-center px-2.5">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              aria-label="Tìm kiếm sản phẩm"
              className="min-w-0 w-full bg-transparent text-xs font-normal text-[#1A1612] placeholder:text-[#8C7D6B] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (onSearchSubmit) onSearchSubmit('');
                }}
                className="shrink-0 rounded p-1 text-[#7D715E] transition hover:bg-[#F3EFE6] hover:text-[#1A1612] cursor-pointer mr-1"
                aria-label="Xóa nội dung tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleFilterClick}
            className="shrink-0 p-1.5 rounded-[2px] border border-[#EAE4D7] bg-[#FAF8F5] text-[#B88E4F] hover:bg-[#F3EFE6] cursor-pointer mr-1"
            title="Bộ lọc"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <button
            type="submit"
            className="w-11 h-8 rounded-[2px] bg-[#C59B58] hover:bg-[#B88E4F] text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title="Tìm kiếm"
            aria-label="Tìm kiếm"
          >
            <Search className="w-3.5 h-3.5 text-white" />
          </button>
        </form>
      </div>
    </header>
  );
}
