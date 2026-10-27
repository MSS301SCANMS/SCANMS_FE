import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, LogOut, Settings, Camera, Loader2, ShoppingBag } from 'lucide-react';
import { authService, type UserProfile } from '../../services/auth.service';
import { uploadService } from '../../services/upload.service';
import { toast } from '../../utils/toast';
import { ScanMSLogo } from '../common/ScanMSLogo';
import { HeaderAccountButton } from './HeaderAccountButton';
import { AccountConnectionStatus } from './AccountConnectionStatus';
import { useResolvedWorkspaceRole } from '../../hooks/useResolvedWorkspaceRole';

export interface TopbarProps {
  currentUser: UserProfile | null;
  onLogout?: () => void;
}

export function Topbar({
  currentUser,
  onLogout,
}: TopbarProps) {
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const updateHeight = () => document.documentElement.style.setProperty('--workspace-header-height', `${header.getBoundingClientRect().height}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { role, isShop, isCustomer, isAdmin } = useResolvedWorkspaceRole(currentUser);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trang chủ khu quản trị — khớp với điều hướng sau đăng nhập.
  const adminHomePath = role === 'SYSTEM_MANAGER' ? '/admin/ops-dashboard' : '/admin/dashboard';

  const displayName =
    currentUser?.fullName ||
    (isShop ? 'Chủ gian hàng' : isCustomer ? 'Khách mua sắm' : isAdmin ? 'Quản trị viên' : 'Cộng tác viên');
  const displaySub = isShop
    ? currentUser?.stores?.[0]?.name || 'Chủ gian hàng'
    : isCustomer
    ? 'Khách mua sắm'
    : isAdmin
    ? role === 'SYSTEM_MANAGER' ? 'Vận hành & tuân thủ' : 'Quản trị hệ thống'
    : currentUser?.collaboratorProfile?.tier?.name
    ? `KOL Hạng ${currentUser.collaboratorProfile.tier.name}`
    : 'KOL / KOC Đối Tác';

  const avatarInitial = currentUser?.fullName?.charAt(0).toUpperCase() || (isShop ? 'S' : isCustomer ? 'K' : isAdmin ? 'A' : 'K');

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
    ? '/admin/profile'
    : '/collaborator/profile';

  return (
    <header ref={headerRef} className="scanms-site-header sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE4D7] shadow-2xs">
      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[68px] flex items-center justify-between gap-3 sm:gap-6 relative z-30">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            to={isShop ? '/merchant/dashboard' : isAdmin ? adminHomePath : isCustomer ? '/marketplace' : '/collaborator/dashboard'}
            className="flex items-center gap-2 group shrink-0"
            title={isCustomer ? 'Về sàn mua sắm' : 'Về trang làm việc'}
          >
            <ScanMSLogo size="md" className="scanms-header-logo" />
          </Link>

        </div>

        {/* Right: Actions, Notifications & User Card */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <AccountConnectionStatus userId={currentUser?.id} />
          {/* Notifications Nest không thuộc mainflow — đã gỡ */}

          <div className="relative z-50" ref={menuRef}>
            <HeaderAccountButton
              user={currentUser}
              role={role}
              expanded={isMenuOpen}
              menuId="topbar-account-menu"
              detail={displaySub}
              onClick={() => setIsMenuOpen((open) => !open)}
            />

            {isMenuOpen && (
              <div id="topbar-account-menu" className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#EAE4D7] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
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
                        {avatarInitial}
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
                    to={isShop ? '/merchant/orders' : isCustomer ? '/customer/orders' : isAdmin ? adminHomePath : '/collaborator/dashboard'}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#B88E4F]" />
                    <span>{isShop ? 'Quản lý đơn hàng' : isCustomer ? 'Đơn mua của tôi' : isAdmin ? 'Quản trị hệ thống' : 'Không gian KOL'}</span>
                  </Link>

                  <Link
                    to={profilePath}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#B88E4F]" />
                    <span>Cài đặt & Hồ sơ</span>
                  </Link>

                  {isCustomer && (
                    <Link
                      to="/marketplace"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                    >
                      <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
                      <span>Sàn mua sắm</span>
                    </Link>
                  )}
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
      </div>
    </header>
  );
}
