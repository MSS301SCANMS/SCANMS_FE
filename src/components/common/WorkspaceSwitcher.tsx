import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Store,
  ShieldCheck,
  ShoppingBag,
  ChevronDown,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { authService, type AvailableWorkspace, type UserProfile } from '../../services/auth.service';

interface WorkspaceSwitcherProps {
  variant?: 'header' | 'sidebar';
  className?: string;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  variant = 'header',
  className = '',
}) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [activeWorkspace, setActiveWorkspace] = useState(authService.getActiveWorkspace());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWorkspaceChange = () => {
      setCurrentUser(authService.getCurrentUser());
      setActiveWorkspace(authService.getActiveWorkspace());
    };

    window.addEventListener('scanms_workspace_changed', handleWorkspaceChange);
    window.addEventListener('storage', handleWorkspaceChange);
    return () => {
      window.removeEventListener('scanms_workspace_changed', handleWorkspaceChange);
      window.removeEventListener('storage', handleWorkspaceChange);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!currentUser) return null;

  const workspaces = authService.getUserAvailableWorkspaces(currentUser);
  const currentWs = workspaces.find((w) => w.key === activeWorkspace) || workspaces[0];

  const getWorkspaceIcon = (key: string, iconClass = 'w-4 h-4') => {
    switch (key) {
      case 'kol':
        return <Sparkles className={`${iconClass} text-[#B88E4F]`} />;
      case 'shop':
        return <Store className={`${iconClass} text-[#B88E4F]`} />;
      case 'admin':
        return <ShieldCheck className={`${iconClass} text-[#B88E4F]`} />;
      default:
        return <ShoppingBag className={`${iconClass} text-[#B88E4F]`} />;
    }
  };

  const handleSelectWorkspace = (key: AvailableWorkspace['key']) => {
    setIsOpen(false);
    authService.switchWorkspace(key, navigate);
  };

  if (variant === 'sidebar') {
    return (
      <div
        className={`w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl p-2.5 flex flex-col gap-2 shadow-2xs ${className}`}
        title="Chuyển đổi không gian làm việc"
      >
        {/* Header trực quan trên Sidebar */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#7D715E] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C59B58]" />
            Chuyển đổi không gian làm việc
          </span>
          <span className="text-[9.5px] font-bold text-[#B88E4F] bg-[#FAF5EB] px-1.5 py-0.2 rounded-full border border-[#EEDFC6]">
            {workspaces.length} vai trò
          </span>
        </div>

        {/* Danh sách các nút vai trò trực tiếp (Inline Role Buttons) - Không dropdown */}
        <div className="flex flex-col gap-1.5">
          {workspaces.map((ws) => {
            const isActive = ws.key === activeWorkspace;
            return (
              <button
                key={ws.key}
                type="button"
                onClick={() => handleSelectWorkspace(ws.key)}
                className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-left transition cursor-pointer group ${
                  isActive
                    ? 'bg-[#FAF5EB] border-2 border-[#C59B58] text-[#B88E4F] shadow-xs'
                    : 'bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58]/60 text-[#1A1612]'
                }`}
                title={isActive ? `Không gian hiện tại: ${ws.label}` : `Chuyển sang không gian ${ws.label}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-white border-[#EEDFC6] text-[#B88E4F]'
                        : 'bg-[#FAF8F5] border-[#EAE4D7] text-[#7D715E] group-hover:text-[#B88E4F]'
                    }`}
                  >
                    {getWorkspaceIcon(ws.key, 'w-3.5 h-3.5')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <strong
                        className={`text-xs truncate ${
                          isActive ? 'font-black text-[#1A1612]' : 'font-bold text-[#1A1612]'
                        }`}
                      >
                        {ws.label}
                      </strong>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          isActive
                            ? 'bg-[#C59B58] text-white'
                            : 'bg-[#F3EFE6] text-[#7D715E]'
                        }`}
                      >
                        {ws.badge}
                      </span>
                    </div>
                  </div>
                </div>

                {isActive ? (
                  <div className="flex items-center gap-1 shrink-0 text-[#B88E4F] ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <Check className="w-3.5 h-3.5 text-[#B88E4F]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-[#7D715E] group-hover:text-[#B88E4F] shrink-0 opacity-70 group-hover:opacity-100 transition ml-1">
                    Vào →
                  </span>
                )}
              </button>
            );
          })}

          {/* Nếu tài khoản chỉ mới có 1 vai trò (Khách hàng), hiển thị nút đăng ký mở rộng */}
          {workspaces.length === 1 && (
            <button
              type="button"
              onClick={() => navigate('/customer/upgrade')}
              className="w-full px-2.5 py-2 rounded-xl border border-dashed border-[#C59B58]/60 bg-gradient-to-r from-[#FAF5EB] to-white hover:from-[#F3EFE6] hover:to-[#FAF5EB] text-left transition flex items-center justify-between text-xs font-bold text-[#B88E4F] cursor-pointer shadow-2xs group"
            >
              <span className="flex items-center gap-1.5 min-w-0 truncate">
                <Sparkles className="w-3.5 h-3.5 text-[#C59B58] shrink-0" />
                <span className="truncate">Mở quyền KOL / Gian Hàng</span>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Header Variant
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] text-xs font-bold text-[#1A1612] transition shadow-2xs cursor-pointer group"
        title="Chuyển đổi vai trò làm việc"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <div className="flex items-center gap-1.5">
          {getWorkspaceIcon(currentWs.key, 'w-3.5 h-3.5')}
          <span className="hidden md:inline text-[#7D715E] font-normal">Vai trò:</span>
          <span className="text-[#1A1612]">{currentWs.label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#7D715E] transition-transform ${
            isOpen ? 'rotate-180 text-[#B88E4F]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white border border-[#EAE4D7] rounded-2xl p-2.5 shadow-xl z-50 flex flex-col gap-1 w-72 animate-in fade-in zoom-in-95 duration-150 text-left">
          <div className="px-2.5 py-1.5 border-b border-[#EAE4D7]">
            <span className="text-[10px] uppercase tracking-wider text-[#7D715E] font-bold block">
              Chuyển vai trò
            </span>
            <span className="text-xs text-[#1A1612] font-semibold mt-0.5 block truncate">
              {currentUser.fullName || currentUser.email}
            </span>
          </div>

          <div className="flex flex-col gap-1 py-1">
            {workspaces.map((ws) => {
              const isActive = ws.key === activeWorkspace;
              return (
                <button
                  key={ws.key}
                  type="button"
                  onClick={() => handleSelectWorkspace(ws.key)}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                    isActive
                      ? 'bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F]'
                      : 'hover:bg-[#FAF8F5] text-[#1A1612]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#EAE4D7] flex items-center justify-center shrink-0 shadow-2xs">
                      {getWorkspaceIcon(ws.key)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{ws.label}</span>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E]">
                          {ws.badge}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-[#7D715E] block truncate mt-0.5">
                        {ws.description}
                      </span>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-[#B88E4F] shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>

          <div className="mt-1 pt-2 border-t border-[#EAE4D7]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/customer/upgrade');
              }}
              className="w-full p-2 rounded-xl text-left text-xs font-bold text-[#B88E4F] hover:bg-[#FBF5EB] transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nâng cấp Đối tác (KOL / Shop)</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
