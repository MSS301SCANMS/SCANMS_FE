import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthUser } from '../hooks/useAuthUser';
import { workspaceHome } from '../utils/workspace-access';

export default function DashboardDispatcher() {
  const user = useAuthUser();
  if (!user) return <Navigate to="/marketplace" replace />;

  const workspace = authService.getActiveWorkspace();
  const destination = workspace === 'customer' ? '/customer/orders' : workspaceHome(workspace, user);
  return <Navigate to={destination} replace />;
}
