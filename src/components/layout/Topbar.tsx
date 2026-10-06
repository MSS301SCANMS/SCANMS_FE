import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, ChevronDown, Store, LogOut, Settings, Camera, Loader2 } from 'lucide-react';
import { authService, type UserProfile } from '../../services/auth.service';
import { uploadService } from '../../services/upload.service';
import { toast } from '../../utils/toast';
import { NotificationDropdown } from './NotificationDropdown';
import { ChatBell } from '../chat/ChatBell';

export interface TopbarProps {
  currentUser: UserProfile | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout?: () => void;
}

export function Topbar({
  currentUser,
  theme,
  onToggleTheme,
  onLogout,
}: TopbarProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(() => authService.getActiveWorkspace());
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const syncWorkspace = () => setActiveWorkspace(authService.getActiveWorkspace());
    window.addEventListener('scanms_workspace_changed', syncWorkspace);
    window.addEventListener('storage', syncWorkspace);
    return () => {
      window.removeEventListener('scanms_workspace_changed', syncWorkspace);
      window.removeEventListener('storage', syncWorkspace);
    };
  }, []);

  const role = activeWorkspace === 'shop'
    ? 'SHOP_MANAGER'
    : activeWorkspace === 'admin'
    ? currentUser?.role === 'SYSTEM_MANAGER' ? 'SYSTEM_MANAGER' : 'SYSTEM_ADMIN'
    : activeWorkspace === 'customer'
    ? 'CUSTOMER'
    : 'COLLABORATOR';
  const isShop = role === 'SHOP_MANAGER';
  const isCustomer = role === 'CUSTOMER';
  const isAdmin = role === 'SYSTEM_ADMIN' || role === 'SYSTEM_MANAGER';

  const displayName =
    currentUser?.fullName ||
    (isShop ? 'Chủ gian hàng' : isCustomer ? 'Khách mua sắm' : isAdmin ? 'Quản trị viên' : 'Cộng tác viên');

  const displaySub = isShop
    ? currentUser?.stores?.[0]?.name || 'Chủ gian hàng'
    : isCustomer
    ? 'Khách mua sắm'
    : isAdmin
    ? 'Quản trị viên Hệ thống'
    : currentUser?.collaboratorProfile?.tier?.name
    ? `KOL Hạng ${currentUser.collaboratorProfile.tier.name}`
    : 'KOL / KOC Đối Tác';

  const userProfile = {
    avatar: currentUser?.fullName?.charAt(0).toUpperCase() || (isShop ? 'S' : isCustomer ? 'K' : isAdmin ? 'A' : 'K'),
    name: displayName,
    sub: displaySub,
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      authService.logout();
    }
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

    setUploading(true);
    try {
      const secureUrl = await uploadService.uploadImage(file, 'scanms/avatars');
      await authService.updateAvatar(secureUrl);
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (err: any) {
      console.error('Lỗi tải ảnh đại diện:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể tải ảnh đại diện lên');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const profilePath = isShop
    ? '/merchant/settings'
    : isCustomer
    ? '/customer/profile'
    : isAdmin
    ? '/admin/users'
    : '/collaborator/profile';

  const getPageTitle = () => {
    if (pathname === '/leaderboard' || pathname.endsWith('/leaderboard')) return 'Bảng xếp hạng Creators';
    if (pathname === '/' || pathname === '/collaborator/dashboard') {
      if (isShop) return 'Tổng quan Shop';
      if (isAdmin) return 'Giám sát Toàn Sàn';
      return 'Tổng quan & Doanh số';
    }
    if (pathname.includes('/collaborator/marketing') || pathname.includes('/collaborator/referral-links') || pathname.includes('/collaborator/media-hub')) {
      return 'Trung tâm Tiếp thị';
    }
    if (pathname.includes('/collaborator/live-sessions')) {
      return 'Phiên Livestream';
    }
    if (pathname.includes('/collaborator/collaboration') || pathname.includes('/collaborator/sample-requests') || pathname.includes('/collaborator/messages')) {
      return 'Hợp tác & Liên hệ Shop';
    }
    if (pathname.includes('/collaborator/profile') || pathname.includes('/collaborator/kyc') || pathname.includes('/collaborator/tiers')) {
      return 'Hồ sơ & Cấp bậc KOL';
    }
    if (pathname.includes('/collaborator/wallet')) return 'Ví Hoa Hồng & Rút Tiền';

    if (pathname.includes('/merchant/dashboard')) return 'Tổng quan Gian Hàng';
    if (pathname.includes('/merchant/products')) return 'Danh mục Sản phẩm & Kho';
    if (pathname.includes('/merchant/orders')) return 'Quản lý Đơn hàng Sàn';
    if (pathname.includes('/merchant/kol-hub')) return 'Mạng lưới KOL & Hợp tác';
    if (pathname.includes('/merchant/promotions')) return 'Khuyến mãi & Hoa hồng';
    if (pathname.includes('/merchant/live-sessions')) return 'Chiến dịch Livestream & Voucher';
    if (pathname.includes('/merchant/payouts')) return 'Duyệt Chi trả Hoa hồng';
    if (pathname.includes('/merchant/settings')) return 'Cài đặt Gian hàng';
    if (pathname.includes('/merchant/fraud-sentinel') || pathname.includes('/merchant/ai-fraud')) return 'AI Chống Gian Lận (Sentinel)';
    if (pathname.includes('/merchant/customer-messages')) return 'Tin Nhắn Khách Hàng';
    if (pathname.includes('/merchant/analytics') || pathname.includes('/merchant/stats')) return 'Phân Tích & Thống Kê Gian Hàng';

    if (pathname.includes('/admin/analytics')) return 'Giám sát Toàn sàn';
    if (pathname.includes('/admin/affiliate-oversight')) return 'Tiếp thị & Dòng tiền Sàn';
    if (pathname.includes('/admin/sample-requests')) return 'Quản trị hàng mẫu KOL';
    if (pathname.includes('/admin/product-moderation') || pathname.includes('/admin/products/moderation')) return 'Kiểm duyệt Sản phẩm Sàn';
    if (pathname.includes('/admin/disputes')) return 'Giải quyết Tranh chấp Sàn';
    if (pathname.includes('/admin/audit-logs') || pathname.includes('/merchant/audit-logs')) return 'Nhật ký Hệ thống & Kiểm toán';
    if (pathname.includes('/admin/users') || pathname.includes('/merchant/kyc-approval')) {
      return 'Quản trị Người dùng & Duyệt KYC';
    }

    if (pathname.includes('/chat')) return 'Tin nhắn & Trò chuyện Trực tiếp';

    if (pathname.startsWith('/customer')) {
      if (pathname.includes('/orders')) return 'Đơn Hàng Của Tôi';
      if (pathname.includes('/upgrade')) return 'Nâng Cấp Đối Tác (KOL / Shop)';
      if (pathname.includes('/wishlist')) return 'Danh Sách Yêu Thích';
      if (pathname.includes('/vouchers')) return 'Kho Mã Giảm Giá';
      return 'Cổng Mua Sắm Khách Hàng';
    }

    if (isShop) return 'Kênh Người Bán SCANMS';
    if (isAdmin) return 'Trung Tâm Quản Trị Toàn Sàn';
    return 'Cổng Nhà Sáng Tạo (KOL) SCANMS';
  };

  return (
    <header className="shrink-0 min-h-[60px] px-6 py-2.5 bg-white/95 backdrop-blur-md border-b border-[#EAE4D7] flex items-center justify-between gap-4 z-20">

      <div className="flex items-center gap-2 text-xs sm:text-sm text-[#7D715E]">
        <span className="font-extrabold text-[#B88E4F] tracking-wide">SCANMS</span>
        <span className="text-[#CDC4B5]">/</span>
        <strong className="text-[#1A1612] font-bold">{getPageTitle()}</strong>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Hệ thống trực tuyến</span>
        </div>

        <Link
          to="/marketplace"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#B88E4F] bg-[#FBF5EB] border border-[#EAE4D7] hover:bg-[#ECE1CD] transition shadow-2xs group"
          title="Xem Sàn Mua Sắm & Tiếp Thị Đa Gian Hàng"
        >
          <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
          <span>Sàn mua sắm</span>
        </Link>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Đổi giao diện"
          className="w-8.5 h-8.5 rounded-full border border-[#EAE4D7] bg-[#FAF8F5] text-[#1A1612] hover:bg-[#F3EFE6] flex items-center justify-center transition cursor-pointer shadow-2xs"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[#B88E4F]" /> : <Moon className="w-4 h-4 text-[#7D715E]" />}
        </button>

        <NotificationDropdown />
        {(isCustomer || isShop || currentUser?.role === 'CUSTOMER' || currentUser?.role === 'SHOP_MANAGER') && currentUser?.id && <ChatBell userId={currentUser.id} isShop={isShop} />}

        <div className="relative" ref={menuRef}>
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58] transition cursor-pointer shadow-2xs"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-[#E8D4B0] shadow-2xs"
              />
            ) : (
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-[#EAE4D7] text-[#B88E4F]"
              >
                {userProfile.avatar}
              </span>
            )}
            <div className="text-left hidden md:block">
              <strong className="block text-xs font-bold text-[#1A1612] leading-none">
                {userProfile.name}
              </strong>
              <small className="text-[11px] font-semibold text-[#B88E4F] leading-tight block mt-0.5">
                {userProfile.sub}
              </small>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#7D715E] transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-[#B88E4F]' : ''}`} />
          </div>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#EAE4D7] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
              <div className="p-2.5 border-b border-[#EAE4D7] flex items-center gap-2.5">
                <div className="relative group shrink-0">
                  {currentUser?.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt="Avatar"
                      className="w-10 h-10 rounded-xl object-cover border border-[#E8D4B0] shadow-2xs"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-xl bg-[#EAE4D7] text-[#B88E4F] flex items-center justify-center font-bold text-sm border border-[#EAE4D7]">
                      {userProfile.avatar}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      avatarInputRef.current?.click();
                    }}
                    disabled={uploading}
                    title="Bấm để tải ảnh đại diện lên"
                    className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#C59B58] hover:bg-[#B88E4F] text-white shadow-xs border-2 border-white transition cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Camera className="w-2.5 h-2.5" />
                    )}
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#1A1612] truncate">
                    {currentUser?.fullName || displayName}
                  </div>
                  <div className="text-[11px] text-[#7D715E] truncate mt-0.5">
                    {currentUser?.email || 'N/A'}
                  </div>
                  <div className="mt-1 inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7]">
                    {displaySub}
                  </div>
                </div>
              </div>

              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
              />

              <div className="py-1 flex flex-col gap-0.5">
                <Link
                  to={profilePath}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                >
                  <Settings className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Cài đặt & Hồ sơ</span>
                </Link>

                <Link
                  to="/marketplace"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                >
                  <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Sàn mua sắm công khai</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-[#EAE4D7]">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition w-full text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Đăng xuất an toàn</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

