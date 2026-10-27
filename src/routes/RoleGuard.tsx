import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { toast } from '../utils/toast';
import { useAuthUser } from '../hooks/useAuthUser';
import { getSessionId } from '../services/auth-session';
import { canUseWorkspaceRoute, defaultWorkspace, routeWorkspace, workspaceHome } from '../utils/workspace-access';

interface RoleGuardProps {
  requiredWorkspace: 'kol' | 'shop' | 'admin';
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ requiredWorkspace }) => {
  const location = useLocation();
  const user = useAuthUser();
  const token = localStorage.getItem('token');
  const hasNotifiedRef = useRef(false);

  const availableWorkspaces = user
    ? authService.getUserAvailableWorkspaces(user).map((w) => w.key)
    : [];

  const hasPermission = Boolean(user && token && availableWorkspaces.includes(requiredWorkspace)
    && canUseWorkspaceRoute(user, location.pathname));

  useEffect(() => {
    // Suspense can replay an old route's effects after navigation has started.
    if (hasPermission && routeWorkspace(window.location.pathname) === requiredWorkspace
      && authService.getActiveWorkspace() !== requiredWorkspace) {
      authService.setActiveWorkspace(requiredWorkspace);
    }
  }, [hasPermission, requiredWorkspace, location.pathname]);

  useEffect(() => {
    if (user && token && !hasPermission && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      if (requiredWorkspace === 'kol') {
        toast.error(
          'Tài khoản của bạn chưa kích hoạt quyền Đối tác KOL Tiếp Thị. Vui lòng hoàn tất đăng ký nâng cấp để truy cập.',
        );
      } else if (requiredWorkspace === 'shop') {
        toast.error(
          'Tài khoản của bạn chưa kích hoạt quyền Chủ Gian Hàng. Vui lòng hoàn tất đăng ký mở shop để truy cập.',
        );
      } else if (requiredWorkspace === 'admin') {
        toast.error('Bạn không có quyền truy cập khu vực Quản Trị Hệ Thống SCANMS.');
      }
    }
  }, [hasPermission, requiredWorkspace, user, token]);

  if (!user || !token) {
    return (
      <Navigate
        to={`/login?role=${requiredWorkspace}&redirect=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`}
        replace
      />
    );
  }

  if (!hasPermission) {
    const workspace = defaultWorkspace(user);
    return <Navigate to={workspace === 'customer' && requiredWorkspace !== 'admin' ? '/customer/upgrade' : workspaceHome(workspace, user)} replace />;
  }

  return <Outlet key={getSessionId()} />;
};
