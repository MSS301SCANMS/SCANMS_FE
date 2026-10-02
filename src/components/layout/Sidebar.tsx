import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut, Store, ExternalLink } from 'lucide-react';
import { NAVIGATION_BY_ROLE } from '../../config/navigation.config';
import { authService, type UserProfile } from '../../services/auth.service';
import { WorkspaceSwitcher } from '../common/WorkspaceSwitcher';

export interface SidebarProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
}

export function Sidebar({ currentUser, onLogout }: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const [activeWs, setActiveWs] = useState(() => authService.getActiveWorkspace());

  useEffect(() => {
    const handleWsChange = () => {
      setActiveWs(authService.getActiveWorkspace());
    };
    window.addEventListener('scanms_workspace_changed', handleWsChange);
    window.addEventListener('storage', handleWsChange);
    return () => {
      window.removeEventListener('scanms_workspace_changed', handleWsChange);
      window.removeEventListener('storage', handleWsChange);
    };
  }, []);

  const role = (() => {
    if (activeWs === 'shop') return 'SHOP_MANAGER';
    if (activeWs === 'kol') return 'COLLABORATOR';
    if (activeWs === 'customer') return 'CUSTOMER';
    if (activeWs === 'admin') {
      return currentUser?.role === 'SYSTEM_MANAGER' ? 'SYSTEM_MANAGER' : 'SYSTEM_ADMIN';
    }
    return currentUser?.role || 'COLLABORATOR';
  })();

  const navConfig = NAVIGATION_BY_ROLE[role] || NAVIGATION_BY_ROLE.COLLABORATOR;
  const roleLabel = {
    CUSTOMER: 'Khách Mua Hàng',
    COLLABORATOR: 'KOL / KOC Đối Tác',
    SHOP_MANAGER: 'Chủ Gian Hàng',
    SYSTEM_MANAGER: 'Vận Hành & Tuân Thủ',
    SYSTEM_ADMIN: 'Ban Quản Trị Tối Cao',
  }[role] || 'Người Dùng';

  const isLinkActive = (path: string) => {
    if (path === '/' || path === '/collaborator/dashboard') {
      return currentPath === '/' || currentPath === '/collaborator/dashboard';
    }

    if (path === '/collaborator/marketing') {
      return (
        currentPath.startsWith('/collaborator/marketing') ||
        currentPath.startsWith('/collaborator/referral-links') ||
        currentPath.startsWith('/collaborator/links') ||
        currentPath.startsWith('/collaborator/media-hub') ||
        currentPath.startsWith('/collaborator/coupons')
      );
    }

    if (path === '/collaborator/collaboration') {
      return (
        currentPath.startsWith('/collaborator/collaboration') ||
        currentPath.startsWith('/collaborator/sample-requests') ||
        currentPath.startsWith('/collaborator/samples') ||
        currentPath.startsWith('/collaborator/messages') ||
        currentPath.startsWith('/collaborator/campaigns') ||
        currentPath === '/chat'
      );
    }

    if (path === '/collaborator/profile') {
      return (
        currentPath.startsWith('/collaborator/profile') ||
        currentPath.startsWith('/collaborator/kyc') ||
        currentPath.startsWith('/collaborator/social-channels') ||
        currentPath.startsWith('/collaborator/tiers') ||
        currentPath.startsWith('/collaborator/bonus-progress')
      );
    }

    if (path === '/merchant/kol-hub') {
      return (
        currentPath.startsWith('/merchant/kol-hub') ||
        currentPath.startsWith('/merchant/sample-requests') ||
        currentPath.startsWith('/merchant/kol-recommendations') ||
        currentPath.startsWith('/merchant/collaborators') ||
        currentPath.startsWith('/merchant/messages')
      );
    }

    if (path === '/merchant/promotions') {
      return (
        currentPath.startsWith('/merchant/promotions') ||
        currentPath.startsWith('/merchant/coupons') ||
        currentPath.startsWith('/merchant/commission-rules') ||
        currentPath.startsWith('/merchant/referral-links')
      );
    }

    if (path === '/admin/affiliate-oversight') {
      return (
        currentPath.startsWith('/admin/affiliate-oversight') ||
        currentPath.startsWith('/admin/referral-links') ||
        currentPath.startsWith('/admin/coupons')
      );
    }

    if (path === '/admin/analytics') {
      return (
        currentPath.startsWith('/admin/analytics') ||
        currentPath.startsWith('/admin/leaderboard') ||
        currentPath.startsWith('/admin/kol-recommendations')
      );
    }

    if (path === '/admin/users') {
      return (
        currentPath.startsWith('/admin/users') ||
        currentPath.startsWith('/merchant/kyc-approval')
      );
    }

    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <aside className="w-64 min-w-[256px] h-full shrink-0 flex flex-col bg-[#F3EFE6] border-r border-[#EAE4D7] z-30 text-left select-none overflow-hidden">

      <div className="p-4 pb-3 border-b border-[#EAE4D7]/80 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EBD08C] to-[#DEC07A] text-[#231D15] font-black text-lg flex items-center justify-center shadow-xs">
            S
          </span>
          <div className="flex flex-col">
            <strong className="text-base font-extrabold text-[#1A1612] leading-tight tracking-wide">
              SCANMS
            </strong>
            <small className="text-[11px] font-bold text-[#7D715E] leading-none mt-1">
              {navConfig.subTitle}
            </small>
          </div>
        </div>

        <Link
          to="/marketplace"
          className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-[#B88E4F] bg-[#FBF5EB] border border-[#EAE4D7] hover:bg-[#ECE1CD] transition shadow-2xs group"
          title="Mở Sàn Tiếp Thị Đa Gian Hàng Công Khai"
        >
          <span className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
            <span>Sàn Mua Sắm Chính</span>
          </span>
          <ExternalLink className="w-3 h-3 text-[#7D715E] group-hover:text-[#B88E4F] transition" />
        </Link>
      </div>

      <div className="px-4 pt-3 pb-1 text-[10.5px] font-bold text-[#8C7D6B] uppercase tracking-wider">
        {navConfig.title}
      </div>


      <nav className="flex-1 px-3 py-1 flex flex-col gap-1 overflow-y-auto" aria-label="Menu chức năng">
        {navConfig.items.map((item) => {
          const active = isLinkActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58] focus-visible:ring-offset-1 ${
                active
                  ? 'bg-[#EBD08C] text-white shadow-xs font-bold'
                  : 'text-[#1A1612] hover:bg-[#EAE4D7]/70 hover:text-[#1A1612]'
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-all duration-200 ${
                  active
                    ? 'border-white/25 bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                    : 'border-[#EAE4D7] bg-[#FBF5EB] text-[#B88E4F] group-hover:border-[#C59B58] group-hover:bg-[#ECE1CD] group-hover:text-[#B88E4F]'
                }`}
                aria-hidden="true"
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1 truncate text-xs">{item.label}</span>
              {item.numBadge && (
                <span
                  className={`text-[10px] font-mono font-bold px-1 py-0.5 rounded ${
                    active ? 'text-white/80' : 'text-[#8C7D6B]'
                  }`}
                >
                  {item.numBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#EAE4D7] flex flex-col gap-2 bg-[#FBF5EB]/50">
        {currentUser ? (
          <>
            {/* Workspace Switcher */}
            <WorkspaceSwitcher variant="sidebar" />

            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#EAE4D7] shadow-2xs">
              <span className="w-8 h-8 rounded-lg bg-[#EAE4D7] text-[#B88E4F] flex items-center justify-center font-bold text-xs shrink-0 border border-[#EAE4D7]">
                {currentUser.fullName?.[0]?.toUpperCase() || 'U'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#1A1612] truncate">
                  {currentUser.fullName || currentUser.email}
                </div>
                <div className="text-[10px] font-semibold text-[#B88E4F] truncate">
                  {roleLabel}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50/70 border border-rose-200/80 hover:bg-rose-100 hover:text-rose-800 transition cursor-pointer text-center w-full shadow-2xs active:scale-98"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Đăng xuất an toàn</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#EBD08C] text-white hover:bg-[#DEC07A] transition cursor-pointer text-center w-full shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>Đăng nhập</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
