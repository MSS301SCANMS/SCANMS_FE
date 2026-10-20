import { io, Socket } from 'socket.io-client';

/**
 * Soft-fix: chỉ kết nối Socket.IO khi VITE_SOCKET_URL được set rõ
 * (không rỗng, không "disabled"). Mặc định tắt trên Spring stack.
 */
export function isChatSocketEnabled(): boolean {
  const raw = String(import.meta.env.VITE_SOCKET_URL ?? '').trim();
  if (!raw) return false;
  const lowered = raw.toLowerCase();
  if (lowered === 'disabled' || lowered === 'false' || lowered === 'off' || lowered === '0') {
    return false;
  }
  return true;
}

const SOCKET_URL = String(import.meta.env.VITE_SOCKET_URL || '').trim();

let socket: Socket | null = null;
let noOpSocket: Socket | null = null;
const authenticatedUsers = new WeakMap<Socket, string>();

function createNoOpSocket(): Socket {
  const handlers = new Map<string, Set<(...args: any[]) => void>>();
  const noop = () => {};
  const api = {
    id: undefined as string | undefined,
    connected: false,
    active: false,
    disconnected: true,
    on(event: string, fn: (...args: any[]) => void) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(fn);
      return api;
    },
    off(event: string, fn?: (...args: any[]) => void) {
      if (!fn) handlers.delete(event);
      else handlers.get(event)?.delete(fn);
      return api;
    },
    once(event: string, fn: (...args: any[]) => void) {
      const wrap = (...args: any[]) => {
        api.off(event, wrap);
        fn(...args);
      };
      return api.on(event, wrap);
    },
    emit: noop,
    connect: noop,
    disconnect: noop,
    close: noop,
    removeListener(event: string, fn?: (...args: any[]) => void) {
      return api.off(event, fn);
    },
    removeAllListeners(event?: string) {
      if (event) handlers.delete(event);
      else handlers.clear();
      return api;
    },
    io: { opts: {} },
  };
  return api as unknown as Socket;
}

export const isChatSocketAuthenticated = (candidate: Socket, userId: string): boolean =>
  isChatSocketEnabled() && candidate.connected && authenticatedUsers.get(candidate) === userId;

export const getChatSocket = (): Socket => {
  if (!isChatSocketEnabled()) {
    if (!noOpSocket) noOpSocket = createNoOpSocket();
    return noOpSocket;
  }

  const token = localStorage.getItem('token');

  if (socket) {
    if ((socket as any)._currentToken !== token) {
      socket.disconnect();
      socket = null;
    } else {
      return socket;
    }
  }

  socket = io(`${SOCKET_URL}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  (socket as any)._currentToken = token;

  const currentSocket = socket;
  currentSocket.on('connected', (payload: { userId?: string }) => {
    if (payload?.userId) authenticatedUsers.set(currentSocket, payload.userId);
  });
  currentSocket.on('disconnect', () => authenticatedUsers.delete(currentSocket));
  currentSocket.on('connect_error', () => authenticatedUsers.delete(currentSocket));

  socket.on('connect', () => {
    console.log('✅ Chat socket connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Chat socket error:', err.message);
  });

  return socket;
};

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
