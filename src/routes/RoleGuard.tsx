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

  const availableWorkspaces = user
    ? authService.getUserAvailableWorkspaces(user).map((w) => w.key)
    : [];

  // Role gốc luôn mở đúng workspace — tránh shop/admin bị đẩy /customer/upgrade
  const roleAllows =
    (requiredWorkspace === 'shop' &&
      (user?.role === 'SHOP_MANAGER' || user?.role === 'SHOP_OWNER')) ||
    (requiredWorkspace === 'kol' &&
      (user?.role === 'COLLABORATOR' || user?.role === 'KOL_CTV')) ||
    (requiredWorkspace === 'admin' &&
      (user?.role === 'SYSTEM_ADMIN' ||
        user?.role === 'SYSTEM_MANAGER' ||
        user?.role === 'ADMIN' ||
        user?.role === 'MANAGER'));

  const hasPermission = Boolean(
    user && token && (availableWorkspaces.includes(requiredWorkspace) || roleAllows),
  );

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
    // Shop/KOL chưa nâng cấp → trang upgrade; admin thiếu quyền → đơn khách
    if (requiredWorkspace === 'kol' || requiredWorkspace === 'shop') {
      return <Navigate to="/customer/upgrade" replace />;
    }
    return <Navigate to="/customer/orders" replace />;
  }

  return <Outlet />;
};
