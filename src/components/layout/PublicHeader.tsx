import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Package,
  TrendingUp,
  User,
  LogOut,
  ChevronDown,
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
  ArrowRight,
  X,
} from 'lucide-react';
import { ScanMSLogo } from '../common/ScanMSLogo';
import { authService, type UserProfile } from '../../services/auth.service';
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
  const userMenuRef = useRef<HTMLDivElement>(null);

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
      <div className="max-w-[1520px] mx-auto px-3 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/marketplace" className="flex items-center gap-2 group" title="Về trang chủ Sàn SCANMS">
            <ScanMSLogo size="sm" />
          </Link>
        </div>

        {/* Center: Search Form - Consistent with Marketplace Header */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex min-w-0 flex-1 max-w-2xl mx-auto items-center gap-1.5 sm:gap-2 rounded-2xl border border-[#EAE4D7] bg-white p-1 sm:p-1.5 shadow-sm shadow-[#C59B58]/10 transition-all duration-300 ease-in-out focus-within:border-[#C59B58]"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2 sm:px-2.5">
            <Search className="h-4 w-4 shrink-0 text-[#B88E4F]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm sản phẩm, thương hiệu, gian hàng..."
              aria-label="Tìm sản phẩm, thương hiệu hoặc gian hàng"
              className="min-w-0 w-full bg-transparent text-xs font-medium text-[#1A1612] placeholder:text-[#8C7D6B] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  if (onSearchSubmit) onSearchSubmit('');
                }}
                className="shrink-0 rounded-lg p-1 text-[#7D715E] transition hover:bg-[#F3EFE6] hover:text-[#1A1612] cursor-pointer"
                aria-label="Xóa nội dung tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleFilterClick}
            className="inline-flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-[#B88E4F] transition hover:bg-[#F3EFE6] cursor-pointer active:scale-[0.98]"
            title="Mở bộ lọc tìm kiếm"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#B88E4F]" />
            <span>Bộ lọc</span>
          </button>
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-[#1A1612] transition cursor-pointer active:scale-[0.98]"
          >
            <span>Tìm kiếm</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Right Navigation & User Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isCustomer && currentUser?.id && <ChatBell userId={currentUser.id} />}
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
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] transition cursor-pointer"
            title="Tra cứu đơn hàng"
          >
            <Package className="w-4 h-4 text-[#B88E4F]" />
            <span>Tra cứu đơn</span>
          </button>

          {/* Leaderboard Link */}
          <Link
            to="/leaderboard"
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] transition"
            title="Bảng xếp hạng doanh số & thưởng"
          >
            <TrendingUp className="w-4 h-4 text-[#B88E4F]" />
            <span>BXH Doanh Số</span>
          </Link>

          {/* Quick Cart Button */}
          <button
            type="button"
            onClick={handleCartClick}
            className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A1612] bg-[#FAF8F5] border border-[#EAE4D7] hover:bg-[#F3EFE6] transition cursor-pointer shadow-2xs"
            title="Mở giỏ hàng sàn SCANMS"
          >
            <ShoppingCart className="w-4 h-4 text-[#B88E4F]" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {effectiveCartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#EBD08C] text-white text-[10px] font-black flex items-center justify-center -mr-1">
                {effectiveCartCount}
              </span>
            )}
          </button>

          {/* AUTHENTICATION & ROLE SECTION */}
          {currentUser ? (
            /* Logged in User Profile & Workspace Link */
            <div className="flex items-center gap-2">
              {/* User Dropdown Pill */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full bg-[#F3EFE6] border border-[#EAE4D7] hover:bg-[#EAE4D7] transition cursor-pointer shadow-2xs"
                  title="Xem thông tin tài khoản và đăng xuất"
                >
                  <span className="w-7 h-7 rounded-full bg-[#EAE4D7] text-[#B88E4F] flex items-center justify-center font-bold text-xs shrink-0 border border-[#EAE4D7]">
                    {currentUser.fullName?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <div className="text-left hidden md:block max-w-[140px]">
                    <strong className="block text-xs font-bold text-[#1A1612] truncate leading-none">
                      {currentUser.fullName || currentUser.email}
                    </strong>
                    <span className="block text-[10px] font-semibold text-[#B88E4F] truncate leading-tight mt-0.5">
                      {isCustomer ? '🛍️ Khách Mua Hàng' : isKol ? '⭐ KOL / KOC' : isShop ? `🏪 ${storeName}` : '🛡️ Quản Trị'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#7D715E] transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-[#B88E4F]' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#EAE4D7] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                    {/* User Identity Box */}
                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-[#EAE4D7] text-[#B88E4F] flex items-center justify-center font-black text-sm shrink-0 border border-[#EAE4D7]">
                          {currentUser.fullName?.[0]?.toUpperCase() || 'U'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <strong className="block text-xs font-bold text-[#1A1612] truncate">
                            {currentUser.fullName || 'Người dùng SCANMS'}
                          </strong>
                          <span className="block text-[11px] text-[#7D715E] truncate">
                            {currentUser.email}
                          </span>
                        </div>
                      </div>

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
                            to="/customer/wallet"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <Wallet className="w-4 h-4 text-[#B88E4F]" />
                            <span>Ví của tôi · Nạp tiền & Thanh toán</span>
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
                          to="/customer/orders?tab=upgrade"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#B88E4F] bg-[#FBF5EB] rounded-xl hover:bg-[#F3EFE6] border border-[#EAE4D7] transition mt-1"
                        >
                          <Sparkles className="w-4 h-4 text-[#B88E4F]" />
                          <span>Nâng cấp Đối tác (KOL / Shop)</span>
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
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F3EFE6] text-[#7D715E]">
                <User className="w-3.5 h-3.5" />
                <span>Khách mua sắm</span>
              </span>

              <Link
                to="/login"
                className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-[#1A1612] bg-[#FAF8F5] border border-[#EAE4D7] hover:bg-[#F3EFE6] hover:border-[#C59B58] transition shadow-2xs"
              >
                Đăng nhập
              </Link>

              <Link
                to="/register"
                className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#EBD08C] hover:bg-[#DEC07A] transition shadow-2xs"
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
          className="flex min-w-0 items-center gap-2 rounded-xl border border-[#EAE4D7] bg-white p-1.5 shadow-sm focus-within:border-[#C59B58]"
        >
          <Search className="ml-2 h-4 w-4 shrink-0 text-[#B88E4F]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm sản phẩm, thương hiệu, gian hàng..."
            aria-label="Tìm sản phẩm, thương hiệu hoặc gian hàng"
            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[#1A1612] placeholder:text-[#8C7D6B] outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                if (onSearchSubmit) onSearchSubmit('');
              }}
              className="shrink-0 rounded-lg p-1 text-[#7D715E] transition hover:bg-[#F3EFE6] hover:text-[#1A1612] cursor-pointer"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleFilterClick}
            className="shrink-0 p-1.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] text-[#B88E4F] hover:bg-[#F3EFE6] cursor-pointer"
            title="Bộ lọc"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] px-3 py-1.5 text-xs font-bold text-[#1A1612] cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>
      </div>
    </header>
  );
}
