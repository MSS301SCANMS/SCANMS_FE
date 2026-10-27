import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { getSessionId } from '../services/auth-session';
import { useAuthUser } from '../hooks/useAuthUser';
import { defaultWorkspace, workspaceHome, workspaceKeys } from '../utils/workspace-access';

export function CustomerPortalGuard() {
  const user = useAuthUser();
  const location = useLocation();
  const allowed = workspaceKeys(user).includes('customer');
  useEffect(() => {
    if (allowed && window.location.pathname === location.pathname) authService.setActiveWorkspace('customer');
  }, [allowed, location.pathname]);
  if (!user) return <Navigate to={`/login?role=customer&redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`} replace />;
  if (!allowed) return <Navigate to={workspaceHome(defaultWorkspace(user), user)} replace />;
  return <Outlet key={getSessionId()} />;
}
