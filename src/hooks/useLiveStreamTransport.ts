import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import api from '../services/api';

type LiveSignal = {
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

type LiveStreamTransportOptions = {
  sessionId?: string;
  isHost: boolean;
  localStream: MediaStream | null;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
];

export function useLiveStreamTransport({
  sessionId,
  isHost,
  localStream,
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
  const [streamError, setStreamError] = useState<string | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  localStreamRef.current = localStream;

  useEffect(() => {
    setSessionEnded(false);
    if (!sessionId) return;
    let alive = true;
    const check = async () => {
      try {
        const response: any = await api.get(`/live-sessions/public/detail/${sessionId}`, { headers: { 'x-skip-cache': 'true' } });
        const session = response?.data || response;
        if (alive && session && (['ENDED', 'CANCELLED'].includes(session.status) || new Date(session.endsAt).getTime() <= Date.now())) {
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
        peer.close();
        hostPeersRef.current.delete(viewerSocketId);
        if (peer.connectionState === 'failed') {
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
        };
        peer.onconnectionstatechange = () => {
          if (peer?.connectionState === 'failed' || peer?.connectionState === 'closed') {
            peer.close();
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

  useEffect(() => {
    if (!sessionId) return undefined;

    let active = true;
    const socket = io(`${SOCKET_URL}/live-stream`, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit(
        'join_live_room',
        { sessionId, requestedRole: isHost ? 'host' : 'viewer' },
        (result: { ok?: boolean; message?: string; hostOnline?: boolean; streamActive?: boolean }) => {
          if (!active) return;
          if (!result?.ok) {
            setRoomJoined(false);
            setStreamError(result?.message || 'Không thể tham gia phiên livestream.');
            return;
          }
          setStreamError(null);
          setRoomJoined(true);
          setHostOnline(Boolean(result.hostOnline) || isHost);
          setIsStreamLive(Boolean(result.streamActive));
        },
      );
    });
    socket.on('disconnect', () => {
      if (!active) return;
      setRoomJoined(false);
      if (!isHost) setIsStreamLive(false);
    });
    socket.on('connect_error', (error) => {
      if (!active) return;
      console.error('Lỗi kết nối live signaling:', error.message);
      setStreamError('Không kết nối được máy chủ phát sóng livestream.');
    });
    socket.on('live_stream_error', (error: { message?: string }) => {
      if (active) setStreamError(error?.message || 'Lỗi kết nối phiên livestream.');
    });

    socket.on('live_viewer_joined', ({ viewerSocketId }: { viewerSocketId?: string }) => {
      if (!active || !isHost || !viewerSocketId) return;
      pendingViewersRef.current.add(viewerSocketId);
      if (localStreamRef.current) void createHostPeer(viewerSocketId);
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

    const hostPeers = hostPeersRef.current;
    const viewerPeers = viewerPeersRef.current;
    const pendingViewers = pendingViewersRef.current;
    const pendingIce = pendingIceRef.current;
    return () => {
      active = false;
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      hostPeers.forEach((peer) => peer.close());
      viewerPeers.forEach((peer) => peer.close());
      hostPeers.clear();
      viewerPeers.clear();
      pendingViewers.clear();
      pendingIce.clear();
      remoteStreamRef.current = null;
    };
  }, [createHostPeer, handleSignal, isHost, sessionId]);

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
      wasPublishingRef.current = true;
      socket.emit('live_stream_started', { sessionId });
      pendingViewersRef.current.forEach((viewerSocketId) => {
        void createHostPeer(viewerSocketId);
      });
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

  return { remoteStream, hostOnline, isStreamLive, streamError, sessionEnded };
}
