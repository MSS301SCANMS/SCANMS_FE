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
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] flex items-center justify-between gap-2.5 transition cursor-pointer text-left shadow-2xs group"
          title="Chuyển đổi vai trò làm việc"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#EAE4D7] flex items-center justify-center shrink-0 shadow-2xs">
              {getWorkspaceIcon(currentWs.key)}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#7D715E] block leading-tight">
                Không gian hiện tại
              </span>
              <strong className="text-xs font-black text-[#1A1612] truncate block">
                {currentWs.label}
              </strong>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#7D715E] shrink-0 transition-transform ${
              isOpen ? 'rotate-180 text-[#B88E4F]' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-[#EAE4D7] rounded-2xl p-2 shadow-xl z-50 flex flex-col gap-1 min-w-[240px] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 border-b border-[#EAE4D7] text-[11px] font-bold text-[#7D715E]">
              Chuyển đổi không gian làm việc
            </div>
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
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#EAE4D7] flex items-center justify-center shrink-0">
                      {getWorkspaceIcon(ws.key, 'w-3.5 h-3.5')}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{ws.label}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E]">
                          {ws.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#7D715E] block truncate mt-0.5">
                        {ws.description}
                      </span>
                    </div>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-[#B88E4F] shrink-0 ml-1.5" />}
                </button>
              );
            })}

            {workspaces.length === 1 && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/customer/orders?tab=upgrade');
                }}
                className="mt-1 pt-2 border-t border-[#EAE4D7] w-full p-2 rounded-xl text-left text-xs font-bold text-[#B88E4F] hover:bg-[#FBF5EB] transition flex items-center justify-between"
              >
                <span>Nâng cấp lên KOL / Shop</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
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
              Không Gian Làm Việc SCANMS
            </span>
            <span className="text-xs text-[#1A1612] font-semibold mt-0.5 block">
              Tài khoản: {currentUser.fullName || currentUser.email}
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
                navigate('/customer/orders?tab=upgrade');
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
