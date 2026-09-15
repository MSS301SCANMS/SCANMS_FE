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

  let userProfile = {
    avatar: currentUser?.fullName?.charAt(0) || 'T',
    name: currentUser?.fullName || 'Nguyễn Thành Thắng',
    sub: 'KOL Hạng Vàng',
    avatarBg: '#FEF3C7',
    avatarColor: '#92400E',
  };

  if (isShop) {
    userProfile = {
      avatar: 'S',
      name: currentUser?.fullName || 'Sora Skin Official',
      sub: 'Chủ gian hàng',
      avatarBg: '#FEF3C7',
      avatarColor: '#B45309',
    };
  } else if (isAdmin) {
    userProfile = {
      avatar: 'QT',
      name: currentUser?.fullName || 'Nguyễn Quản Trị',
      sub: 'Quản trị viên Hệ thống',
      avatarBg: '#0F172A',
      avatarColor: '#F59E0B',
    };
  }

  const getPageTitle = () => {
    if (pathname === '/' || pathname === '/collaborator/dashboard') {
      if (isShop) return 'Tổng quan Shop';
      if (isAdmin) return 'Quản trị User & Duyệt KYC';
      return 'Tổng quan KOL / CTV';
    }
    if (pathname.includes('/merchant/dashboard')) return 'Tổng quan Gian Hàng';
    if (pathname.includes('/merchant/products')) return 'Danh mục Sản phẩm & Giá';
    if (pathname.includes('/merchant/orders')) return 'Quản lý Đơn hàng Sàn';
    if (pathname.includes('/merchant/campaigns')) return 'Chiến dịch Thưởng Doanh số';
    if (pathname.includes('/merchant/settings')) return 'Cài đặt Gian hàng';
    if (pathname.includes('/merchant/kyc-approval') || pathname.includes('/admin/users')) {
      return 'Quản trị Người dùng & Duyệt KYC';
    }
    if (pathname.includes('/collaborator/links')) return 'Link và QR Tiếp thị';
    if (pathname.includes('/collaborator/social-channels')) return 'Quản lý Kênh Mạng Xã Hội';
    if (pathname.includes('/collaborator/media-hub')) return 'Kho Nội Dung Media Hub';
    if (pathname.includes('/collaborator/samples')) return 'Hàng mẫu Dùng thử';
    if (pathname.includes('/collaborator/tiers')) return 'Bảng Vinh Danh & Cấp Bậc KOL';
    if (pathname.includes('/collaborator/kyc')) return 'Xác minh Định danh KYC';
    if (pathname.includes('/collaborator/wallet')) return 'Ví Hoa Hồng & Rút Tiền';
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

