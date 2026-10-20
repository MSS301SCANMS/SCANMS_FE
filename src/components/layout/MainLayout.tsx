import { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authService, type UserProfile } from '../../services/auth.service';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { applyTheme } from '../../utils/theme.utils';
import { SeedDataNotice } from '../common/SeedDataNotice';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  useEffect(() => {
    applyTheme('light');
  }, []);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    const token = localStorage.getItem('token');
    if (token) {
      authService
        .getMe()
        .then((freshUser) => {
          if (freshUser && freshUser.id) {
            setCurrentUser(freshUser);
          }
        })
        .catch(() => {
          // Token expired or invalid
        });
    }

    const handleUserUpdated = () => {
      const updated = authService.getCurrentUser();
      if (updated) {
        setCurrentUser(updated);
      }
    };

    window.addEventListener('auth-user-updated', handleUserUpdated);
    return () => window.removeEventListener('auth-user-updated', handleUserUpdated);
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  const isAuth = location.pathname === '/login' || location.pathname === '/register';
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  if (isAuth || isIframe) {
    return (
      <main className="w-full">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#FAF8F5] text-[#1A1612] flex flex-col font-sans">
      {/* 1. Topbar nằm full-width trên cùng (chuẩn vị trí Header như Customer) */}
      <Topbar
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* 2. Container nội dung căn giữa đồng bộ 100% với Customer (max-w-[1520px]) */}
      <main className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-0 flex-1 min-h-0 flex flex-col">
        <div className="flex flex-col lg:flex-row gap-5 items-start flex-1 min-h-0">
          {/* Cột trái: Sidebar điều hướng các chức năng của từng vai trò */}
          <div className="relative w-full lg:w-[250px] lg:shrink-0 lg:h-full lg:flex lg:flex-col after:content-[''] after:pointer-events-none after:absolute after:left-3 after:right-3 after:-bottom-2.5 after:h-px after:bg-[linear-gradient(90deg,transparent,#EEDFC6_12%,#EAE4D7_88%,transparent)] lg:after:top-7 lg:after:bottom-5 lg:after:left-auto lg:after:-right-2.5 lg:after:w-px lg:after:h-auto lg:after:bg-[linear-gradient(180deg,transparent,#EEDFC6_32px,#EAE4D7_calc(100%-32px),transparent)]">
            <Sidebar currentUser={currentUser} onLogout={handleLogout} />
          </div>

          {/* Cột phải: Khung nội dung chính của vai trò */}
          <div className="workspace-page-column w-full flex-1 min-w-0 pt-4 sm:pt-5 pb-5 lg:h-full lg:overflow-y-auto flex flex-col gap-4 text-left [scrollbar-width:thin] [scrollbar-color:rgba(180,140,75,0.45)_transparent]">
            <SeedDataNotice user={currentUser} />
            <Suspense
              fallback={
                <div className="w-full py-20 flex flex-col items-center justify-center text-[#7D715E] gap-3 animate-in fade-in duration-200">
                  <div className="w-7 h-7 border-2 border-[#C59B58] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-[#7D715E]">Đang tải dữ liệu chức năng...</span>
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
