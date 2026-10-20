import { useEffect } from 'react';
import api from '@/services/api';
import { authService } from '@/services/auth.service';

export function StorePresenceHeartbeat() {
  useEffect(() => {
    let controller = new AbortController();
    let currentToken: string | null = null;
    let lastSent = 0;
    const pulse = () => {
      const token = localStorage.getItem('token');
      if (token !== currentToken) {
        controller.abort();
        controller = new AbortController();
        currentToken = token;
        lastSent = 0;
      }
      const user = authService.getCurrentUser();
      if (!token || !user || (user.role !== 'SHOP_MANAGER' && !user.stores?.length) ||
          document.visibilityState !== 'visible' || !navigator.onLine || Date.now() - lastSent < 20_000) return;
      lastSent = Date.now();
      void api.post('/stores/my-store/presence', undefined, {
        signal: controller.signal, headers: { Authorization: `Bearer ${token}` },
      }).catch(() => { /* Retry on the next visible heartbeat. */ });
    };
    pulse();
    const timer = window.setInterval(pulse, 25_000);
    for (const event of ['auth-user-updated', 'scanms_auth_changed', 'storage', 'online', 'focus']) window.addEventListener(event, pulse);
    document.addEventListener('visibilitychange', pulse);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      for (const event of ['auth-user-updated', 'scanms_auth_changed', 'storage', 'online', 'focus']) window.removeEventListener(event, pulse);
      document.removeEventListener('visibilitychange', pulse);
    };
  }, []);
  return null;
}
