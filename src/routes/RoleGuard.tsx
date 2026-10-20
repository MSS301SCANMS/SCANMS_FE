import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { toast } from '../utils/toast';

interface RoleGuardProps {
  requiredWorkspace: 'kol' | 'shop' | 'admin';
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ requiredWorkspace }) => {
  const location = useLocation();
  const user = authService.getCurrentUser();
  const token = localStorage.getItem('token');
  const hasNotifiedRef = useRef(false);

  const availableWorkspaces = user ? authService.getUserAvailableWorkspaces(user).map((w) => w.key) : [];
  const hasPermission = Boolean(user && token && availableWorkspaces.includes(requiredWorkspace));

  useEffect(() => {
    if (user && token && !hasPermission && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      if (requiredWorkspace === 'kol') {
        toast.error('Tài khoản của bạn chưa kích hoạt quyền Đối tác KOL Tiếp Thị. Vui lòng hoàn tất đăng ký nâng cấp để truy cập.');
      } else if (requiredWorkspace === 'shop') {
        toast.error('Tài khoản của bạn chưa kích hoạt quyền Chủ Gian Hàng. Vui lòng hoàn tất đăng ký mở shop để truy cập.');
      } else if (requiredWorkspace === 'admin') {
        toast.error('Bạn không có quyền truy cập khu vực Quản Trị Hệ Thống SCANMS.');
      }
    }
  }, [hasPermission, requiredWorkspace, user, token]);

  // 1. Chưa đăng nhập -> Chuyển về trang đăng nhập kèm returnTo
  if (!user || !token) {
    return <Navigate to={`/login?role=${requiredWorkspace}&redirect=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`} replace />;
  }

  // 2. Không có quyền -> Chuyển hướng
  if (!hasPermission) {
    if (requiredWorkspace === 'kol' || requiredWorkspace === 'shop') {
      return <Navigate to="/customer/upgrade" replace />;
    }
    return <Navigate to="/customer/orders" replace />;
  }

  return <Outlet />;
};
