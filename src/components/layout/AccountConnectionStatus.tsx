import { useEffect, useState } from 'react';
import {
  getChatSocket,
  isChatSocketAuthenticated,
  isChatSocketEnabled,
} from '@/services/chat-socket.service';

type ConnectionStatus = 'connecting' | 'online' | 'offline' | 'api-ready';

export function AccountConnectionStatus({ userId }: { userId?: string }) {
  const token = localStorage.getItem('token');
  const socketEnabled = isChatSocketEnabled();
  const [connection, setConnection] = useState<{
    userId?: string;
    token: string | null;
    status: ConnectionStatus;
  }>({ token: null, status: socketEnabled ? 'connecting' : 'api-ready' });

  useEffect(() => {
    if (!userId || !token) return;

    if (!isChatSocketEnabled()) {
      setConnection({ userId, token, status: navigator.onLine ? 'api-ready' : 'offline' });
      const onOffline = () => setConnection({ userId, token, status: 'offline' });
      const onOnline = () => setConnection({ userId, token, status: 'api-ready' });
      window.addEventListener('offline', onOffline);
      window.addEventListener('online', onOnline);
      return () => {
        window.removeEventListener('offline', onOffline);
        window.removeEventListener('online', onOnline);
      };
    }

    const socket = getChatSocket();
    const update = (status: ConnectionStatus) => {
      if (localStorage.getItem('token') === token) setConnection({ userId, token, status });
    };
    const refresh = () =>
      update(
        !navigator.onLine
          ? 'offline'
          : isChatSocketAuthenticated(socket, userId)
            ? 'online'
            : socket.active
              ? 'connecting'
              : 'offline',
      );
    const disconnected = () => update('offline');
    const authenticated = (payload: { userId?: string }) =>
      update(payload?.userId === userId && navigator.onLine ? 'online' : 'offline');
    const reconnect = () => {
      if (navigator.onLine && !socket.connected && !socket.active) socket.connect();
      refresh();
    };
    refresh();
    socket.on('connected', authenticated);
    socket.on('disconnect', disconnected);
    socket.on('connect_error', disconnected);
    window.addEventListener('offline', disconnected);
    window.addEventListener('online', reconnect);
    window.addEventListener('focus', reconnect);
    return () => {
      socket.off('connected', authenticated);
      socket.off('disconnect', disconnected);
      socket.off('connect_error', disconnected);
      window.removeEventListener('offline', disconnected);
      window.removeEventListener('online', reconnect);
      window.removeEventListener('focus', reconnect);
    };
  }, [userId, token]);

  if (!userId || !token) return null;
  const status =
    connection.userId === userId && connection.token === token
      ? connection.status
      : socketEnabled
        ? 'connecting'
        : 'api-ready';
  const label =
    status === 'online'
      ? 'Đang trực tuyến'
      : status === 'api-ready'
        ? 'API đang sẵn sàng'
        : status === 'offline'
          ? 'Mất kết nối'
          : 'Đang kết nối';
  const dotClass =
    status === 'online' || status === 'api-ready'
      ? 'bg-[#059669]'
      : status === 'connecting'
        ? 'bg-[#C59B58]'
        : 'bg-[#7D715E]';

  return (
    <span
      role="status"
      aria-label={`Trạng thái tài khoản: ${label}`}
      data-account-connection={status}
      className="hidden h-8 items-center gap-2 whitespace-nowrap rounded-[10px] border border-[#EAE4D7] bg-white px-2.5 text-[11px] font-medium text-[#7D715E] lg:inline-flex"
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
}
