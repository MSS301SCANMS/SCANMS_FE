import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut, RefreshCw, Store, ExternalLink, ChevronRight } from 'lucide-react';
import { NAVIGATION_BY_ROLE } from '../../config/navigation.config';
import type { UserProfile } from '../../services/auth.service';

export interface SidebarProps {
  currentUser: UserProfile | null;
  onOpenRoleSwitcher: () => void;
  onLogout: () => void;
}

export function Sidebar({ currentUser, onOpenRoleSwitcher, onLogout }: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const role = currentUser?.role || 'COLLABORATOR';
  const navConfig = NAVIGATION_BY_ROLE[role] || NAVIGATION_BY_ROLE.COLLABORATOR;
  const roleLabel = {
    COLLABORATOR: 'Cộng tác viên / KOL',
    SHOP_MANAGER: 'Chủ gian hàng',
    SYSTEM_MANAGER: 'Vận hành hệ thống',
    SYSTEM_ADMIN: 'Quản trị hệ thống',
  }[role] || 'Người dùng';

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

    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <aside className="w-64 min-w-[256px] h-full shrink-0 flex flex-col bg-[#F3EFE6] border-r border-[#EAE4D7] z-30 text-left select-none overflow-hidden">

      <div className="p-4 pb-3 border-b border-[#EAE4D7]/80 flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C59B58] to-[#B88E4F] text-white font-black text-lg flex items-center justify-center shadow-xs">
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
          className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-[#8A662C] bg-[#FBF5EB] border border-[#EEDFC6] hover:bg-[#F5E7CC] transition shadow-2xs group"
          title="Mở Sàn Tiếp Thị Đa Gian Hàng Công Khai"
        >
          <span className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
            <span>Sàn Mua Sắm Chính</span>
          </span>
          <ExternalLink className="w-3 h-3 text-[#A49B8B] group-hover:text-[#B88E4F] transition" />
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
                  ? 'bg-[#B88E4F] text-white shadow-xs font-bold'
                  : 'text-[#4A3E2D] hover:bg-[#EAE4D7]/70 hover:text-[#1A1612]'
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-all duration-200 ${
                  active
                    ? 'border-white/25 bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                    : 'border-[#E4D3B7] bg-[#FBF5EB] text-[#8A662C] group-hover:border-[#C59B58] group-hover:bg-[#F5E7CC] group-hover:text-[#6F4E1D]'
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

      <div className="p-3 border-t border-[#EAE4D7] flex flex-col gap-1.5 bg-[#EAE4D7]/30">
        <button
          type="button"
          onClick={onOpenRoleSwitcher}
          aria-label={`Chuyển vai trò. Vai trò hiện tại: ${roleLabel}`}
          title="Chọn không gian làm việc khác"
          className="group flex w-full items-center gap-2.5 rounded-xl border border-[#E4D3B7] bg-white px-2.5 py-2 text-left shadow-[0_2px_8px_rgba(91,65,28,0.06)] transition-all duration-200 hover:-translate-y-px hover:border-[#C59B58] hover:bg-[#FBF5EB] hover:shadow-[0_5px_14px_rgba(91,65,28,0.10)] active:translate-y-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58] focus-visible:ring-offset-2"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FBF5EB] text-[#B88E4F] ring-1 ring-[#EEDFC6] transition-colors group-hover:bg-[#C59B58] group-hover:text-white">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-extrabold leading-tight text-[#1A1612]">
              Chuyển vai trò
            </span>
            <span className="mt-0.5 block truncate text-[10px] font-medium leading-tight text-[#7D715E]">
              Hiện tại: {roleLabel}
            </span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#A49B8B] transition-transform group-hover:translate-x-0.5 group-hover:text-[#B88E4F]" aria-hidden="true" />
        </button>

        {currentUser ? (
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition cursor-pointer text-left"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#1A1612] bg-[#C59B58] text-white hover:bg-[#B88E4F] transition cursor-pointer text-left"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            <span>Đăng nhập</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
