import { useEffect } from 'react';
import api from '@/services/api';
import { authService } from '@/services/auth.service';

export function StorePresenceHeartbeat() {
  useEffect(() => {
    let controller = new AbortController();
    let currentToken: string | null = null;
    let lastSent = 0;
    let retryAt = 0;
    let failures = 0;
    let inFlight = false;
    const pulse = () => {
      const token = localStorage.getItem('token');
      if (token !== currentToken) {
        controller.abort();
        controller = new AbortController();
        currentToken = token;
        lastSent = 0;
        retryAt = 0;
        failures = 0;
        inFlight = false;
      }
      const user = authService.getCurrentUser();
      if (!token || !user || (user.role !== 'SHOP_MANAGER' && !user.stores?.length) ||
          document.visibilityState !== 'visible' || !navigator.onLine || inFlight || Date.now() < retryAt || Date.now() - lastSent < 20_000) return;
      lastSent = Date.now();
      inFlight = true;
      const requestToken = currentToken;
      void api.post('/stores/my-store/presence', undefined, {
        signal: controller.signal,
      }).then(() => {
        if (requestToken === currentToken) { failures = 0; retryAt = 0; }
      }).catch((error: any) => {
        if (requestToken !== currentToken || controller.signal.aborted) return;
        const status = error?.response?.status;
        // No retry loop for a missing API, expired session or unsupported account.
        retryAt = [401, 403, 404, 405, 409].includes(status)
          ? Infinity : Date.now() + Math.min(300_000, 30_000 * 2 ** Math.min(++failures, 4));
      }).finally(() => { if (requestToken === currentToken) inFlight = false; });
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
