import { useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Camera, Edit2, Loader2, LogIn, LogOut, Store } from 'lucide-react';
import type { NavItemConfig, RoleNavigationGroup } from '../../../config/navigation.config';
import { authService, type UserProfile } from '../../../services/auth.service';
import { uploadService } from '../../../services/upload.service';
import { toast } from '../../../utils/toast';
import { cancelRouteHover, handleRouteHover } from '../../../utils/route-preloader.utils';
import { isNavLinkActive } from './isNavLinkActive';
import type { WorkspaceNavRole } from './resolveWorkspaceRole';
import type { SidebarTheme } from './sidebarTheme';

export interface SidebarShellProps {
  role: WorkspaceNavRole;
  theme: SidebarTheme;
  navConfig: RoleNavigationGroup;
  currentUser: UserProfile | null;
  onLogout: () => void;
  displayName: string;
  editProfilePath: string;
  editProfileLabel: string;
  getItemBadge: (path: string, staticBadge?: string) => { text: string; isHighlight: boolean } | null;
  showMarketplaceLink?: boolean;
  headerExtra?: ReactNode;
}

export function SidebarShell({
  role,
  theme,
  navConfig,
  currentUser,
  onLogout,
  displayName,
  editProfilePath,
  editProfileLabel,
  getItemBadge,
  showMarketplaceLink = false,
  headerExtra,
}: SidebarShellProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const avatarFallback =
    currentUser?.fullName?.charAt(0).toUpperCase() ||
    (role === 'CUSTOMER' ? 'C' : role === 'SHOP_MANAGER' ? 'S' : role === 'COLLABORATOR' ? 'K' : 'A');

  return (
    <aside
      data-workspace-role={role}
      className="workspace-sidebar w-full lg:w-[250px] shrink-0 px-3.5 pt-4 sm:pt-5 pb-3.5 lg:h-full self-start text-left select-none flex flex-col gap-2.5 z-30 bg-transparent"
    >
      <input
        type="file"
        ref={avatarInputRef}
        onChange={async (e) => {
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
            toast.error(err?.response?.data?.message || err?.message || 'Không thể tải ảnh đại diện lên');
          } finally {
            setUploading(false);
            e.target.value = '';
          }
        }}
        accept="image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
      />

      <div className={`flex items-center gap-3 px-2 py-1 pb-3 border-b ${theme.headerBorder}`}>
        <div className="relative shrink-0 group">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading}
            className={`w-11 h-11 rounded-full border ${theme.avatarBorder} overflow-hidden ${theme.avatarBg} flex items-center justify-center ${theme.avatarText} font-bold text-base select-none relative cursor-pointer group-hover:opacity-90 transition shadow-2xs`}
            title="Bấm vào để tải/đổi ảnh đại diện"
          >
            {uploading ? (
              <Loader2 className={`w-4 h-4 ${theme.spinner} animate-spin`} />
            ) : currentUser?.avatarUrl ||
              (role === 'SHOP_MANAGER' &&
                (currentUser?.stores?.[0]?.logoUrl || '/assets/shops/shop-sora-skin.png')) ? (
              <img
                src={
                  currentUser?.avatarUrl ||
                  currentUser?.stores?.[0]?.logoUrl ||
                  '/assets/shops/shop-sora-skin.png'
                }
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (role === 'SHOP_MANAGER') {
                    e.currentTarget.src = '/assets/shops/shop-sora-skin.png';
                  }
                }}
              />
            ) : (
              <span>{avatarFallback}</span>
            )}
            {!uploading && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-3.5 h-3.5 text-white drop-shadow" />
              </div>
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5 min-w-0">
            <strong className="block text-sm font-bold text-[#1A1612] truncate leading-tight" title={displayName}>
              {displayName}
            </strong>
            <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${theme.roleBadge}`}>
              {theme.badgeLabel}
            </span>
          </div>
          <p className="text-[10px] text-[#9A8D78] truncate mt-0.5">{navConfig.subTitle}</p>
          <Link
            to={editProfilePath}
            className={`inline-flex items-center gap-1 text-[11px] ${theme.profileLink} transition-colors mt-0.5 cursor-pointer font-normal`}
          >
            <Edit2 className="w-3 h-3" />
            <span>{editProfileLabel}</span>
          </Link>
          {headerExtra}
        </div>
      </div>

      <nav className="flex flex-col gap-1 text-xs sm:text-[13px] flex-1 overflow-y-auto no-scrollbar pt-1" aria-label="Menu chức năng">
        {navConfig.items.map((item: NavItemConfig) => {
          const active = isNavLinkActive(item.path, currentPath, location.search);
          const Icon = item.icon;
          const badge = getItemBadge(item.path, item.badge);
          return (
            <div key={item.path} className="flex flex-col">
              <Link
                to={item.path}
                onMouseEnter={() => handleRouteHover(item.path)}
                onMouseLeave={cancelRouteHover}
                onFocus={() => handleRouteHover(item.path)}
                onBlur={cancelRouteHover}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] transition-all duration-150 cursor-pointer min-h-[40px] ${
                  active ? theme.linkActive : theme.linkIdle
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? theme.iconActive : theme.iconIdle}`} />
                <span className="flex-1 truncate tracking-tight">{item.label}</span>
                {badge && (
                  <span
                    className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 transition-transform ${
                      badge.isHighlight ? theme.badgeHighlight : theme.badgeMuted
                    }`}
                  >
                    {badge.text}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className={`mt-auto pt-3 border-t ${theme.footerBorder} flex flex-col gap-1 text-xs sm:text-[13px] shrink-0`}>
        {currentUser ? (
          <>
            {showMarketplaceLink && (
              <Link
                to="/marketplace"
                className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] min-h-[44px] font-medium ${theme.marketplaceHover} transition-all duration-150 cursor-pointer`}
                title="Quay lại Sàn Mua Sắm SCANMS"
                aria-label="Quay lại Sàn Mua Sắm SCANMS"
              >
                <ArrowLeft className={`w-4 h-4 shrink-0 ${theme.iconIdle}`} aria-hidden="true" />
                <Store className={`w-4 h-4 shrink-0 ${theme.iconIdle}`} aria-hidden="true" />
                <span className="flex-1 truncate tracking-tight">Sàn Mua Sắm</span>
              </Link>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] min-h-[40px] font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-150 cursor-pointer text-left w-full"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-500 transition-colors" />
              <span className="flex-1 truncate tracking-tight font-semibold">Đăng xuất</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold ${theme.loginBtn} transition cursor-pointer text-center w-full shadow-2xs`}
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>Đăng nhập</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
