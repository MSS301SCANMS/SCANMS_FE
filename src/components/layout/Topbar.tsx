import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, ChevronDown, Store, LogOut, Settings } from 'lucide-react';
import { authService, type UserProfile } from '../../services/auth.service';
import { NAVIGATION_BY_ROLE } from '../../config/navigation.config';

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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const workspace = authService.getActiveWorkspace();
  const role = workspace === 'shop' ? 'SHOP_MANAGER' : workspace === 'kol' ? 'COLLABORATOR'
    : workspace === 'admin' ? currentUser?.roles.includes('ADMIN') ? 'SYSTEM_ADMIN' : 'SYSTEM_MANAGER' : 'CUSTOMER';
  const isShop = workspace === 'shop';
  const isAdmin = workspace === 'admin';
  const displayName = currentUser?.fullName || 'Người dùng';
  const displaySub = workspace === 'shop' ? 'Chủ gian hàng' : workspace === 'kol' ? 'KOL / CTV'
    : workspace === 'admin' ? 'Quản trị / vận hành' : 'Khách hàng';

  const userProfile = {
    avatar: currentUser?.fullName?.charAt(0).toUpperCase() || (isShop ? 'S' : isAdmin ? 'A' : 'K'),
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

  const profilePath = '/account';
  const getPageTitle = () => {
    if (pathname === '/account' || pathname.endsWith('/profile')) return 'Hồ sơ của tôi';
    return NAVIGATION_BY_ROLE[role]?.items.find(item => item.path === pathname)?.label || 'Không gian làm việc';
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
          <span>Không gian làm việc</span>
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


        <div className="relative" ref={menuRef}>
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#F3EFE6] border border-[#EAE4D7] hover:bg-[#EAE4D7] transition cursor-pointer shadow-2xs"
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-[#EAE4D7] text-[#B88E4F]"
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
            <ChevronDown className={`w-3.5 h-3.5 text-[#7D715E] transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-[#B88E4F]' : ''}`} />
          </div>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#EAE4D7] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
              <div className="p-2.5 border-b border-[#EAE4D7]">
                <div className="text-xs font-bold text-[#1A1612] truncate">
                  {currentUser?.fullName || displayName}
                </div>
                <div className="text-[11px] text-[#7D715E] truncate mt-0.5">
                  {currentUser?.email || 'N/A'}
                </div>
                <div className="mt-1.5 inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7]">
                  {displaySub}
                </div>
              </div>

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

