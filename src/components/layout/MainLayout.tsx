import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authService, type UserProfile } from '../../services/auth.service';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NAVIGATION_BY_ROLE } from '../../config/navigation.config';
import { WorkspaceSwitcher } from '../common/WorkspaceSwitcher';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    const update = () => setCurrentUser(authService.getCurrentUser());
    window.addEventListener('scanms_auth_changed', update);
    return () => window.removeEventListener('scanms_auth_changed', update);
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
      <div className="hidden md:flex">
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      </div>

      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <Topbar
          currentUser={currentUser}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
        />
        <div className="md:hidden border-b border-[#EAE4D7] bg-white p-3 space-y-3">
          {currentUser && <WorkspaceSwitcher variant="header" />}
          <nav aria-label="Menu trên điện thoại" className="flex gap-3 overflow-x-auto text-sm whitespace-nowrap">
            {(NAVIGATION_BY_ROLE[authService.getActiveWorkspace() === 'shop' ? 'SHOP_MANAGER' : authService.getActiveWorkspace() === 'kol' ? 'COLLABORATOR' : authService.getActiveWorkspace() === 'admin' ? currentUser?.role || 'SYSTEM_MANAGER' : 'CUSTOMER']?.items || []).map(item => <Link key={item.path} to={item.path} className="rounded-lg px-3 py-2 bg-[#FAF8F5] text-[#7D715E]">{item.label}</Link>)}
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-[#FAF8F5]">
          <div className="max-w-[1520px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
