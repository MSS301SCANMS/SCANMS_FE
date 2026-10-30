import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import api from '../services/api';
import { getSessionId, renewSession } from '../services/auth-session';
import { rememberLivePurchase, clearLivePurchase } from '../services/live-purchase-access';
import { livestreamLifecycle } from '../utils/livestream-lifecycle.utils';

type LiveSignal = {
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

type LiveStreamTransportOptions = {
  sessionId?: string;
  isHost: boolean;
  isModerator?: boolean;
  localStream: MediaStream | null;
  onNewChatMessage?: (msg: any) => void;
  onPinnedProductChange?: (data: { productIndex: number; productId?: string }) => void;
  onReactionBroadcast?: (data: { emoji: string; iconUrl?: string }) => void;
};

const SOCKET_URL = String(import.meta.env.VITE_LIVE_SOCKET_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? `${window.location.protocol}//${window.location.hostname}:8090` : '')).trim();
const ICE_SERVERS: RTCIceServer[] = (() => { try {
  const servers = JSON.parse(import.meta.env.VITE_LIVE_ICE_SERVERS || 'null');
  if (Array.isArray(servers) && servers.length) return servers;
} catch { /* Use the default STUN server when no deployment-specific TURN is configured. */ }
return [
  { urls: 'stun:stun.l.google.com:19302' },
]; })();

export function useLiveStreamTransport({
  sessionId,
  isHost,
  isModerator = false,
  localStream,
  onNewChatMessage,
  onPinnedProductChange,
  onReactionBroadcast,
}: LiveStreamTransportOptions) {
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(localStream);
  const hostPeersRef = useRef(new Map<string, RTCPeerConnection>());
  const viewerPeersRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingViewersRef = useRef(new Set<string>());
  const pendingIceRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const wasPublishingRef = useRef(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [hostOnline, setHostOnline] = useState(false);
  const [isStreamLive, setIsStreamLive] = useState(false);
  const [broadcast, setBroadcast] = useState<{ state: string; reconnectUntil?: string } | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [reactionCount, setReactionCount] = useState(0);
  const [businessStatus, setBusinessStatus] = useState<string | null>(null);
  const publishingRef = useRef(false);
  const pendingChatsRef = useRef(new Map<string, string>());
  const rejoinRef = useRef<(() => void) | null>(null);
  const mediaAttemptsRef = useRef(0);

  const onNewChatMessageRef = useRef(onNewChatMessage);
  onNewChatMessageRef.current = onNewChatMessage;
  const onPinnedProductChangeRef = useRef(onPinnedProductChange);
  onPinnedProductChangeRef.current = onPinnedProductChange;
  const onReactionBroadcastRef = useRef(onReactionBroadcast);
  onReactionBroadcastRef.current = onReactionBroadcast;

  localStreamRef.current = localStream;

  useEffect(() => {
    setSessionEnded(false);
    if (!sessionId) return;
    let alive = true;
    const check = async () => {
      try {
        const response: any = await api.get(`/livestreams/${sessionId}`, { headers: { 'x-skip-cache': 'true' } });
        const session = response?.data || response;
        const effective = livestreamLifecycle(session);
        if (alive && session?.status) setBusinessStatus(effective.status);
        if (alive && session && ['ENDED', 'CANCELLED'].includes(effective.status)) {
          setSessionEnded(true);
          setRoomJoined(false);
          setIsStreamLive(false);
          setRemoteStream(null);
          remoteStreamRef.current = null;
          hostPeersRef.current.forEach(peer => peer.close());
          viewerPeersRef.current.forEach(peer => peer.close());
          hostPeersRef.current.clear();
          viewerPeersRef.current.clear();
          localStreamRef.current?.getTracks().forEach(track => track.stop());
        }
      } catch { /* Retry on the next tick when connectivity returns. */ }
    };
    void check();
    const timer = window.setInterval(() => void check(), 10000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [sessionId]);

  const emitSignal = useCallback((targetSocketId: string, signal: LiveSignal) => {
    const socket = socketRef.current;
    if (!sessionId || !socket?.connected) return;
    socket.emit('live_signal', { sessionId, targetSocketId, signal });
  }, [sessionId]);

  const createHostPeer = useCallback(async (viewerSocketId: string) => {
    if (hostPeersRef.current.has(viewerSocketId)) return;
    const socket = socketRef.current;
    const stream = localStreamRef.current;
    if (!socket?.connected || !sessionId) return;
    if (!stream) {
      pendingViewersRef.current.add(viewerSocketId);
      return;
    }

    pendingViewersRef.current.delete(viewerSocketId);
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    hostPeersRef.current.set(viewerSocketId, peer);
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        emitSignal(viewerSocketId, { candidate: event.candidate.toJSON() });
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'failed' || peer.connectionState === 'closed') {
        const failed = peer.connectionState === 'failed';
        peer.onconnectionstatechange = null;
        peer.close();
        if (hostPeersRef.current.get(viewerSocketId) === peer) hostPeersRef.current.delete(viewerSocketId);
        if (failed) {
          pendingViewersRef.current.add(viewerSocketId);
          setStreamError('Kết nối tới người xem bị gián đoạn. Hãy thử tắt rồi bật lại camera.');
        }
      }
    };

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      emitSignal(viewerSocketId, { description: peer.localDescription?.toJSON() });
    } catch (error) {
      console.error('Không tạo được kết nối video tới người xem:', error);
      peer.close();
      hostPeersRef.current.delete(viewerSocketId);
      pendingViewersRef.current.add(viewerSocketId);
      setStreamError('Không tạo được kết nối video. Hãy thử tắt và bật lại camera.');
    }
  }, [emitSignal, sessionId]);

  const flushPendingIce = useCallback(async (peer: RTCPeerConnection, remoteSocketId: string) => {
    const queued = pendingIceRef.current.get(remoteSocketId) || [];
    pendingIceRef.current.delete(remoteSocketId);
    for (const candidate of queued) {
      try {
        await peer.addIceCandidate(candidate);
      } catch (error) {
        console.warn('Bỏ qua ICE candidate không hợp lệ:', error);
      }
    }
  }, []);

  const handleSignal = useCallback(async (payload: {
    fromSocketId?: string;
    signal?: LiveSignal;
  }) => {
    const remoteSocketId = payload?.fromSocketId;
    const signal = payload?.signal;
    if (!remoteSocketId || !signal) return;

    if (isHost) {
      const peer = hostPeersRef.current.get(remoteSocketId);
      if (!peer) return;
      if (signal.description?.type === 'answer') {
        try {
          await peer.setRemoteDescription(signal.description);
          await flushPendingIce(peer, remoteSocketId);
        } catch (error) {
          console.error('Không nhận được phản hồi kết nối từ người xem:', error);
        }
      }
      if (signal.candidate) {
        if (!peer.remoteDescription) {
          const queued = pendingIceRef.current.get(remoteSocketId) || [];
          queued.push(signal.candidate);
          pendingIceRef.current.set(remoteSocketId, queued);
        } else {
          try {
            await peer.addIceCandidate(signal.candidate);
          } catch (error) {
            console.warn('Bỏ qua ICE candidate từ người xem:', error);
          }
        }
      }
      return;
    }

    let peer = viewerPeersRef.current.get(remoteSocketId);
    if (signal.description?.type === 'offer') {
      if (!peer) {
        peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        viewerPeersRef.current.set(remoteSocketId, peer);
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            emitSignal(remoteSocketId, { candidate: event.candidate.toJSON() });
          }
        };
        peer.ontrack = (event) => {
          let stream = event.streams[0] || remoteStreamRef.current;
          if (!stream) stream = new MediaStream();
          if (!stream.getTracks().some((track) => track.id === event.track.id)) {
            stream.addTrack(event.track);
          }
          remoteStreamRef.current = stream;
          setRemoteStream(stream);
          setHostOnline(true);
          setIsStreamLive(true);
          mediaAttemptsRef.current = 0;
          setStreamError(null);
        };
        peer.onconnectionstatechange = () => {
          if (peer?.connectionState === 'failed' || peer?.connectionState === 'closed') {
            peer.onconnectionstatechange = null;
            peer.close();
            if (viewerPeersRef.current.get(remoteSocketId) !== peer) return;
            viewerPeersRef.current.delete(remoteSocketId);
            remoteStreamRef.current = null;
            setRemoteStream(null);
          }
        };
      }

      try {
        await peer.setRemoteDescription(signal.description);
        await flushPendingIce(peer, remoteSocketId);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        emitSignal(remoteSocketId, { description: peer.localDescription?.toJSON() });
      } catch (error) {
        console.error('Không kết nối được video của KOL:', error);
        setStreamError('Không kết nối được camera của KOL. Vui lòng tải lại phiên live.');
      }
    }

    if (signal.candidate) {
      if (!peer?.remoteDescription) {
        const queued = pendingIceRef.current.get(remoteSocketId) || [];
        queued.push(signal.candidate);
        pendingIceRef.current.set(remoteSocketId, queued);
      } else {
        try {
          await peer.addIceCandidate(signal.candidate);
        } catch (error) {
          console.warn('Bỏ qua ICE candidate từ KOL:', error);
        }
      }
    }
  }, [emitSignal, flushPendingIce, isHost]);

  const requestMedia = useCallback(() => {
    const socket = socketRef.current;
    if (isHost || !sessionId || !socket?.connected) return;
    viewerPeersRef.current.forEach(peer => { peer.onconnectionstatechange = null; peer.ontrack = null; peer.close(); });
    viewerPeersRef.current.clear(); pendingIceRef.current.clear();
    remoteStreamRef.current = null; setRemoteStream(null);
    socket.timeout(5000).emit('request_live_stream', { sessionId }, (error: Error | null, result: { ok?: boolean; message?: string; streamActive?: boolean; hostOnline?: boolean }) => {
      if (socketRef.current !== socket || !socket.connected) return;
      if (error || !result?.ok) setStreamError(result?.message || 'Chưa kết nối lại được camera. Vui lòng thử lại.');
      else { setStreamError(null); setHostOnline(Boolean(result.hostOnline)); setIsStreamLive(Boolean(result.streamActive)); }
    });
  }, [isHost, sessionId]);

  useEffect(() => {
    if (isHost || !roomJoined || !isStreamLive || remoteStream || sessionEnded) return;
    const timer = window.setInterval(() => {
      if (mediaAttemptsRef.current++ < 3) requestMedia();
      else {
        window.clearInterval(timer);
        setStreamError('Chưa nhận được camera của KOL. Hãy thử kết nối lại; nếu vẫn lỗi, cần kiểm tra camera và đường truyền của người phát.');
      }
    }, 8000);
    return () => window.clearInterval(timer);
  }, [isHost, roomJoined, isStreamLive, remoteStream, sessionEnded, requestMedia]);

  useEffect(() => {
    setRoomJoined(false); setViewerCount(0); setReactionCount(0); setRemoteStream(null);
    setHostOnline(false); setIsStreamLive(false); mediaAttemptsRef.current = 0;
    if (!sessionId) return undefined;

    if (!SOCKET_URL) {
      setStreamError('Chưa kết nối máy chủ livestream.');
      setRoomJoined(false);
      return undefined;
    }

    let active = true;
    const identity = getSessionId();
    const socket = io(`${SOCKET_URL}/live-stream`, {
      auth: callback => { void renewSession().then(token => callback({ token })).catch(() => callback({ token: null })); },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit(
        'join_live_room',
        { sessionId, requestedRole: isHost ? 'host' : isModerator ? 'moderator' : 'viewer' },
        (result: { ok?: boolean; message?: string; hostOnline?: boolean; streamActive?: boolean; viewerCount?: number; likesCount?: number; purchaseToken?: string; broadcast?: { state: string; reconnectUntil?: string } }) => {
          if (!active) return;
          if (!result?.ok) {
            setRoomJoined(false);
            setStreamError(result?.message || 'Không thể tham gia phiên livestream.');
            return;
          }
          setStreamError(null);
          setRoomJoined(true);
          setBroadcast(result.broadcast || null);
          setHostOnline(Boolean(result.hostOnline) || isHost);
          setIsStreamLive(Boolean(result.streamActive));
          setViewerCount(result.viewerCount ?? 0);
          setReactionCount(Number.isSafeInteger(result.likesCount) ? result.likesCount! : 0);
          rememberLivePurchase(sessionId, result.purchaseToken);
        },
      );
    };
    rejoinRef.current = joinRoom;
    socket.on('connect', joinRoom);
    socket.on('disconnect', () => {
      if (!active) return;
      setRoomJoined(false);
      setViewerCount(0);
      clearLivePurchase(sessionId);
      wasPublishingRef.current = false; publishingRef.current = false;
      hostPeersRef.current.forEach(peer => peer.close());hostPeersRef.current.clear();
      viewerPeersRef.current.forEach(peer => peer.close());viewerPeersRef.current.clear();
      pendingViewersRef.current.clear();pendingIceRef.current.clear();
      remoteStreamRef.current = null;setRemoteStream(null);
      if (!isHost) setIsStreamLive(false);
    });
    socket.on('connect_error', (error) => {
      if (!active) return;
      console.error('Lỗi kết nối live signaling:', error.message);
      setRoomJoined(false);
      setStreamError(error.message === 'websocket error' || error.message === 'xhr poll error' ? 'Mất kết nối livestream. Đang thử kết nối lại…' : error.message);
    });
    socket.on('live_stream_error', (error: { message?: string }) => {
      if (active) setStreamError(error?.message || 'Lỗi kết nối phiên livestream.');
    });
    socket.on('live_service_ready', () => { if (active) setStreamError(null); });

    socket.on('live_viewer_joined', ({ viewerSocketId, replace }: { viewerSocketId?: string; replace?: boolean }) => {
      if (!active || !isHost || !viewerSocketId) return;
      if (replace) {
        const old = hostPeersRef.current.get(viewerSocketId);
        if (old) { old.onconnectionstatechange = null; old.close(); hostPeersRef.current.delete(viewerSocketId); }
        pendingIceRef.current.delete(viewerSocketId);
      }
      pendingViewersRef.current.add(viewerSocketId);
      if (localStreamRef.current && wasPublishingRef.current) void createHostPeer(viewerSocketId);
    });
    socket.on('live_viewer_left', ({ viewerSocketId }: { viewerSocketId?: string }) => {
      if (!viewerSocketId) return;
      pendingViewersRef.current.delete(viewerSocketId);
      hostPeersRef.current.get(viewerSocketId)?.close();
      hostPeersRef.current.delete(viewerSocketId);
      pendingIceRef.current.delete(viewerSocketId);
    });
    socket.on('live_host_available', () => {
      if (!isHost) setHostOnline(true);
    });
    socket.on('live_viewer_count', ({ count }: { count: number }) => { if (active && Number.isInteger(count) && count >= 0) setViewerCount(count); });
    socket.on('live_stream_started', () => {
      if (!isHost) {
        setHostOnline(true);
        setIsStreamLive(true);
        setStreamError(null);
      }
    });
    socket.on('live_governance_changed', () => {
      window.dispatchEvent(new CustomEvent('scanms-live-governance', { detail: { sessionId } }));
    });
    socket.on('live_session_ended', () => {
      setSessionEnded(true);
      setRoomJoined(false);
      setViewerCount(0);
      setHostOnline(false);
      setIsStreamLive(false);
      setRemoteStream(null);
      remoteStreamRef.current = null;
      hostPeersRef.current.forEach(peer => peer.close());
      viewerPeersRef.current.forEach(peer => peer.close());
      hostPeersRef.current.clear();
      viewerPeersRef.current.clear();
      pendingIceRef.current.clear();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      window.dispatchEvent(new CustomEvent('scanms-live-governance', { detail: { sessionId } }));
    });
    socket.on('live_stream_stopped', () => {
      if (!isHost) {
        setIsStreamLive(false);
        remoteStreamRef.current = null;
        setRemoteStream(null);
        viewerPeersRef.current.forEach((peer) => peer.close());
        viewerPeersRef.current.clear();
        pendingIceRef.current.clear();
      }
    });
    socket.on('live_host_left', () => {
      setBroadcast({ state: 'RECONNECTING' });
      if (!isHost) {
        setHostOnline(false);
        setIsStreamLive(false);
        remoteStreamRef.current = null;
        setRemoteStream(null);
        viewerPeersRef.current.forEach((peer) => peer.close());
        viewerPeersRef.current.clear();
        pendingIceRef.current.clear();
      }
    });
    socket.on('live_signal', (payload: { fromSocketId?: string; signal?: LiveSignal }) => {
      void handleSignal(payload);
    });
    socket.on('live_broadcast_state', (state: { state: string; reconnectUntil?: string }) => {
      if (active) setBroadcast(state);
    });
    socket.on('new_live_chat', (msg: any) => {
      onNewChatMessageRef.current?.(msg);
    });
    socket.on('live_chat_history', ({ messages }: { messages?: any[] }) => {
      messages?.forEach(message => onNewChatMessageRef.current?.(message));
    });
    socket.on('product_pinned_changed', (data: any) => {
      onPinnedProductChangeRef.current?.(data);
    });
    socket.on('reaction_broadcast', (data: any) => {
      if (Number.isSafeInteger(data?.likesCount) && data.likesCount >= 0) setReactionCount(previous => Math.max(previous, data.likesCount));
      if (data?.fromSocketId !== socket.id) onReactionBroadcastRef.current?.(data);
    });
    socket.on('live_reaction_count', ({likesCount}: {likesCount: number}) => {
      if (Number.isSafeInteger(likesCount) && likesCount >= 0) setReactionCount(previous => Math.max(previous, likesCount));
    });

    const hostPeers = hostPeersRef.current;
    const viewerPeers = viewerPeersRef.current;
    const pendingViewers = pendingViewersRef.current;
    const pendingIce = pendingIceRef.current;
    const checkIdentity = () => {
      if (getSessionId() === identity) return;
      socket.disconnect();localStreamRef.current?.getTracks().forEach(track => track.stop());
      setRoomJoined(false);setStreamError('Tài khoản đã thay đổi. Hãy mở lại phòng livestream.');
    };
    const authTimer = window.setInterval(() => {
      checkIdentity();
      if (getSessionId() !== identity || !socket.connected) return;
      void renewSession().then(token => { if (active && getSessionId() === identity && token) socket.emit('refresh_live_auth', { token }, (result: { ok?: boolean; purchaseToken?: string }) => {
        if (active && result?.ok) rememberLivePurchase(sessionId, result.purchaseToken);
      }); }).catch(() => {});
    }, 15000);
    window.addEventListener('scanms_auth_changed', checkIdentity);
    window.addEventListener('storage', checkIdentity);
    return () => {
      active = false;
      window.clearInterval(authTimer);
      window.removeEventListener('scanms_auth_changed', checkIdentity);window.removeEventListener('storage', checkIdentity);
      wasPublishingRef.current = false;publishingRef.current = false;
      socket.removeAllListeners();
      socket.disconnect();
      clearLivePurchase(sessionId);
      if (socketRef.current === socket) socketRef.current = null;
      if (rejoinRef.current === joinRoom) rejoinRef.current = null;
      hostPeers.forEach((peer) => peer.close());
      viewerPeers.forEach((peer) => peer.close());
      hostPeers.clear();
      viewerPeers.clear();
      pendingViewers.clear();
      pendingIce.clear();
      remoteStreamRef.current = null;
    };
  }, [createHostPeer, handleSignal, isHost, isModerator, sessionId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!sessionId || !isHost || !roomJoined || !socket?.connected) return;

    if (localStream) {
      // Changing raw/canvas output must also update viewers already connected.
      hostPeersRef.current.forEach((peer) => {
        peer.getSenders().forEach((sender) => {
          const replacement = localStream.getTracks().find((track) => track.kind === sender.track?.kind);
          if (replacement && replacement !== sender.track) {
            void sender.replaceTrack(replacement).catch(() => {
              setStreamError('Chưa cập nhật được video cho người xem. Hãy tắt và bật lại camera.');
            });
          }
        });
      });
      if (!wasPublishingRef.current && !publishingRef.current) {
        publishingRef.current = true;
        socket.timeout(10000).emit('live_stream_started', { sessionId }, (error: Error | null, result: { ok?: boolean; message?: string }) => {
          publishingRef.current = false;
          if (!socket.connected) return;
          if (error || !result?.ok) { setStreamError(result?.message || 'Máy chủ chưa xác nhận phát sóng. Hãy thử bật lại camera.'); return; }
          if (!localStreamRef.current) { socket.emit('live_stream_stopped', { sessionId }); return; }
          wasPublishingRef.current = true;setStreamError(null);
          pendingViewersRef.current.forEach(viewerSocketId => { void createHostPeer(viewerSocketId); });
        });
      }
      return;
    }

    if (wasPublishingRef.current) {
      wasPublishingRef.current = false;
      socket.emit('live_stream_stopped', { sessionId });
      hostPeersRef.current.forEach((peer, viewerSocketId) => {
        pendingViewersRef.current.add(viewerSocketId);
        peer.close();
      });
      hostPeersRef.current.clear();
      pendingIceRef.current.clear();
    }
  }, [createHostPeer, isHost, localStream, roomJoined, sessionId]);

  const sendLiveChat = useCallback((text: string): Promise<void> => {
    const socket = socketRef.current;
    if (!socket?.connected || !roomJoined) return Promise.reject(new Error('Chưa kết nối phòng live. Tin nhắn của bạn vẫn được giữ lại.'));
    const key = `${sessionId}\n${text}`;
    const clientMessageId = pendingChatsRef.current.get(key) || crypto.randomUUID();
    pendingChatsRef.current.set(key, clientMessageId);
    return new Promise((resolve, reject) => socket.timeout(10000).emit('send_live_chat', { sessionId, text, clientMessageId }, (error: Error | null, result: { ok?: boolean; message?: any }) => {
      if (error || !result?.ok) reject(new Error(typeof result?.message === 'string' ? result.message : 'Chưa gửi được bình luận. Vui lòng thử lại.'));
      else { pendingChatsRef.current.delete(key); if (result.message) onNewChatMessageRef.current?.(result.message); resolve(); }
    }));
  }, [sessionId, roomJoined]);

  const pinProduct = useCallback((productIndex: number, productId?: string): Promise<void> => {
    const socket = socketRef.current;
    if (!socket?.connected) return Promise.reject(new Error('Chưa kết nối phòng livestream.'));
    return new Promise((resolve, reject) => socket.timeout(10000).emit('host_pin_product', { sessionId, productIndex, productId }, (error: Error | null, result: { ok?: boolean; message?: string }) => {
      if (error || !result?.ok) reject(new Error(result?.message || 'Chưa xác nhận được sản phẩm ghim.'));
      else resolve();
    }));
  }, [sessionId]);

  const sendReaction = useCallback((emoji: string, iconUrl?: string): Promise<void> => {
    const socket = socketRef.current;
    if (!socket?.connected || !roomJoined) return Promise.reject(new Error('Chưa kết nối phòng để gửi cảm xúc.'));
    const clientReactionId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const send = (retry: boolean) => socket.timeout(3000).emit('send_reaction', { sessionId, emoji, iconUrl, clientReactionId }, (error: Error | null, result: {ok?: boolean; message?: string; reaction?: {likesCount: number}}) => {
        if (error && retry && socket.connected) { send(false); return; }
        if (error || !result?.ok) { reject(new Error(result?.message || 'Chưa xác nhận được cảm xúc. Hãy thử lại.')); return; }
        if (socketRef.current === socket && Number.isSafeInteger(result.reaction?.likesCount)) setReactionCount(previous => Math.max(previous, result.reaction!.likesCount));
        resolve();
      });
      send(true);
    });
  }, [sessionId, roomJoined]);

  return {
    remoteStream,
    roomJoined,
    viewerCount,
    reactionCount,
    businessStatus,
    hostOnline,
    isStreamLive,
    broadcast,
    streamError,
    sessionEnded,
    sendLiveChat,
    pinProduct,
    sendReaction,
    retryConnection: () => {
      setStreamError(null); mediaAttemptsRef.current = 0;
      if (!socketRef.current?.connected) socketRef.current?.connect();
      else if (!roomJoined) rejoinRef.current?.();
      else requestMedia();
    },
    socket: socketRef.current,
  };
}
