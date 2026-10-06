import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authService, type UserProfile } from '../../services/auth.service';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Menu, X } from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mobileNavigation, setMobileNavigation] = useState(false);
  useEffect(() => { setMobileNavigation(false); }, [location.pathname]);

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
  }, [location.pathname]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

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
    <div className="h-screen w-screen overflow-hidden flex bg-[#FAF8F5] text-[#1A1612]">
      <div className="hidden lg:block h-full"><Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
      /></div>
      {mobileNavigation && <div className="fixed inset-0 z-50 flex bg-black/40 lg:hidden" role="dialog" aria-label="Điều hướng" aria-modal="true">
        <Sidebar currentUser={currentUser} onLogout={handleLogout} />
        <button aria-label="Đóng điều hướng" onClick={() => setMobileNavigation(false)} className="self-start m-3 rounded-full bg-white p-3"><X size={20} /></button>
      </div>}

      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <button aria-label="Mở điều hướng" onClick={() => setMobileNavigation(true)} className="lg:hidden flex items-center gap-2 border-b bg-[#F3EFE6] px-4 py-2 text-sm font-semibold"><Menu size={18} />Menu</button>
        <Topbar
          currentUser={currentUser}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-[#FAF8F5]">
          <div className="max-w-[1520px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

