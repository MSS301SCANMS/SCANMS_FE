import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Bell, ChevronDown, Store } from 'lucide-react';
import type { UserProfile } from '../../services/auth.service';
import { toast } from '../../utils/toast';

export interface TopbarProps {
  currentUser: UserProfile | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenRoleSwitcher: () => void;
}

export function Topbar({
  currentUser,
  theme,
  onToggleTheme,
  onOpenRoleSwitcher,
}: TopbarProps) {
  const location = useLocation();
  const pathname = location.pathname;

  const role = currentUser?.role || 'COLLABORATOR';
  const isShop = role === 'SHOP_MANAGER';
  const isAdmin = role === 'SYSTEM_ADMIN' || role === 'SYSTEM_MANAGER';

  const displayName =
    currentUser?.fullName ||
    (isShop ? 'Chủ gian hàng' : isAdmin ? 'Quản trị viên' : 'Cộng tác viên');

  const displaySub = isShop
    ? currentUser?.stores?.[0]?.name || 'Chủ gian hàng'
    : isAdmin
    ? 'Quản trị viên Hệ thống'
    : currentUser?.collaboratorProfile?.tier?.name
    ? `KOL Hạng ${currentUser.collaboratorProfile.tier.name}`
    : 'Cộng tác viên SCANMS';

  const userProfile = {
    avatar: currentUser?.fullName?.charAt(0).toUpperCase() || (isShop ? 'S' : isAdmin ? 'A' : 'K'),
    name: displayName,
    sub: displaySub,
    avatarBg: isAdmin ? '#0F172A' : '#FEF3C7',
    avatarColor: isAdmin ? '#F59E0B' : isShop ? '#B45309' : '#92400E',
  };

  const getPageTitle = () => {
    if (pathname === '/' || pathname === '/collaborator/dashboard') {
      if (isShop) return 'Tổng quan Shop';
      if (isAdmin) return 'Giám sát Toàn Sàn';
      return 'Tổng quan & Doanh số';
    }
    if (pathname.includes('/collaborator/marketing') || pathname.includes('/collaborator/referral-links') || pathname.includes('/collaborator/media-hub')) {
      return 'Trung tâm Tiếp thị';
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
    if (pathname.includes('/merchant/payouts')) return 'Duyệt Chi trả Hoa hồng';
    if (pathname.includes('/merchant/settings')) return 'Cài đặt Gian hàng';

    if (pathname.includes('/admin/analytics')) return 'Giám sát Toàn sàn';
    if (pathname.includes('/admin/affiliate-oversight')) return 'Tiếp thị & Dòng tiền Sàn';
    if (pathname.includes('/admin/users') || pathname.includes('/merchant/kyc-approval')) {
      return 'Quản trị Người dùng & Duyệt KYC';
    }

    return 'Hệ thống Quản Trị SCANMS';
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
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#8A662C] bg-[#FBF5EB] border border-[#EEDFC6] hover:bg-[#F5E7CC] transition shadow-2xs group"
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

        <button
          type="button"
          aria-label="Thông báo"
          onClick={() => toast.info('Hệ thống hoạt động bình thường. Không có cảnh báo mới.')}
          className="w-8.5 h-8.5 rounded-full border border-[#EAE4D7] bg-[#FAF8F5] text-[#1A1612] hover:bg-[#F3EFE6] flex items-center justify-center transition cursor-pointer shadow-2xs relative"
        >
          <Bell className="w-4 h-4 text-[#7D715E]" />
          <span className="w-2 h-2 rounded-full bg-[#B88E4F] absolute top-1.5 right-1.5"></span>
        </button>

        <div
          onClick={onOpenRoleSwitcher}
          title="Bấm để chuyển đổi nhanh vai trò"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#F3EFE6] border border-[#EAE4D7] hover:bg-[#EAE4D7] transition cursor-pointer shadow-2xs"
        >
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-[#EEDFC6] text-[#B88E4F]"
          >
            {userProfile.avatar}
          </span>
          <div className="text-left hidden md:block">
            <strong className="block text-xs font-bold text-[#1A1612] leading-none">
              {userProfile.name}
            </strong>
            <small className="text-[11px] font-semibold text-[#B88E4F] leading-tight block mt-0.5">
              {userProfile.sub}
            </small>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#A49B8B]" />
        </div>
      </div>
    </header>
  );
}

