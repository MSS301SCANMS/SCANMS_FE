import { authService } from '../services/auth.service';
import { apiCache } from './api-cache.utils';
import { queryClient } from '../config/query-client.config';
import { disconnectChatSocket } from '../services/chat-socket.service';

function sessionIdentity() {
  const user = authService.getCurrentUser();
  return { token: localStorage.getItem('token'), userId: user?.id, role: user?.role };
}

export function startAuthTabSync() {
  let previous = sessionIdentity();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let navigating = false;
  const clearPreviousAccount = () => {
    apiCache.clear();
    queryClient.clear();
    disconnectChatSocket();
  };
  const sync = (fromOtherTab: boolean) => {
    if (navigating) return;
    const current = sessionIdentity();
    if (current.token === previous.token && current.userId === previous.userId && current.role === previous.role) return;
    const accountChanged = current.userId !== previous.userId || current.role !== previous.role;
    previous = current;
    clearPreviousAccount();
    if (!fromOtherTab) return;

    // Recreate the old tab's providers, page state and sockets together. Updating
    // just the header leaves the previous user's private page mounted.
    navigating = true;
    const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const workspace = /^\/collaborator(?:\/|$)/.test(window.location.pathname) ? 'kol'
      : /^\/merchant(?:\/|$)/.test(window.location.pathname) ? 'shop'
      : /^\/admin(?:\/|$)/.test(window.location.pathname) ? 'admin' : null;
    const allowed = authService.getUserAvailableWorkspaces().some(item => item.key === workspace);
    if (workspace && accountChanged && (!current.token || !allowed)) {
      const params = new URLSearchParams({ role: workspace, redirect: path, sessionChanged: '1' });
      window.location.replace(`/login?${params}`);
    } else {
      window.location.reload();
    }
  };
  const queueSync = (event: StorageEvent) => {
    if (event.storageArea !== localStorage || (event.key !== null && !['token', 'user'].includes(event.key))) return;
    clearTimeout(timer);
    timer = setTimeout(() => sync(true), 0);
  };
  const onFocus = () => { if (!document.hidden) sync(true); };
  const onLocalAuth = () => sync(false);
  window.addEventListener('storage', queueSync);
  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onFocus);
  window.addEventListener('auth-user-updated', onLocalAuth);
  return () => {
    clearTimeout(timer);
    window.removeEventListener('storage', queueSync);
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onFocus);
    window.removeEventListener('auth-user-updated', onLocalAuth);
  };
}
