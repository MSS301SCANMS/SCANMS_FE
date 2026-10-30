import { useMemo, useSyncExternalStore } from 'react';
import { authService } from '../services/auth.service';
import { getSessionId } from '../services/auth-session';

function subscribe(onChange: () => void) {
  const events = ['scanms_auth_changed', 'auth-user-updated', 'scanms_workspace_changed', 'storage'];
  events.forEach(event => window.addEventListener(event, onChange));
  return () => events.forEach(event => window.removeEventListener(event, onChange));
}

export function useAuthUser() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => JSON.stringify([getSessionId(), localStorage.getItem('user'), localStorage.getItem('scanms-active-workspace')]),
    () => '',
  );
  return useMemo(() => authService.getCurrentUser(), [snapshot]);
}
