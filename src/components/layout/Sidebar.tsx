import { Link, useLocation } from 'react-router-dom';
import { LogIn, LogOut, RefreshCw, Store, ExternalLink } from 'lucide-react';
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

  const isLinkActive = (path: string) => {
    if (path === '/' || path === '/collaborator/dashboard') {
      return currentPath === '/' || currentPath === '/collaborator/dashboard';
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
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                active
                  ? 'bg-[#B88E4F] text-white shadow-xs font-bold'
                  : 'text-[#4A3E2D] hover:text-[#1A1612] hover:bg-[#EAE4D7]/70'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  active ? 'text-white' : 'text-[#7D715E]'
                }`}
              />
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
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#8A662C] bg-[#FBF5EB] border border-[#EEDFC6] hover:bg-[#F5E7CC] transition cursor-pointer text-left shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#8A662C] shrink-0" />
          <span>Đổi vai trò Demo</span>
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
