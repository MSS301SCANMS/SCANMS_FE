import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getChatSocket } from '../../services/chat-socket.service';
import type { ChatMessage, Conversation } from '../../types/chat';

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;

export function ChatBell({ userId, isShop = false }: { userId: string; isShop?: boolean }) {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('scanms_chat_sound') !== 'off');
  const [soundBlocked, setSoundBlocked] = useState(false);
  const playedIds = useRef(new Set<string>());
  const audioRef = useRef<AudioContext | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [unread, list] = await Promise.all([api.get('/chat/unread-count', { headers: { 'x-skip-cache': '1' } }), api.get('/chat/conversations', { headers: { 'x-skip-cache': '1' } })]);
      setCount(Number(unwrap(unread)) || 0);
      setConversations(unwrap(list) || []);
    } catch { /* session may have expired */ }
  }, []);

  useEffect(() => {
    refresh();
    const socket = getChatSocket();
    const onMessage = (message: ChatMessage) => {
      if (message.senderId === userId) return;
      if (!playedIds.current.has(message.id)) {
        playedIds.current.add(message.id);
        if (soundOn) {
          try {
            const AudioContextType = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextType) {
              const context: AudioContext = audioRef.current || new AudioContextType();
              audioRef.current = context;
              if (context.state === 'running') {
                setSoundBlocked(false);
                const oscillator = context.createOscillator();
                const gain = context.createGain();
                oscillator.frequency.value = 740;
                gain.gain.setValueAtTime(0.06, context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
                oscillator.connect(gain).connect(context.destination);
                oscillator.start(); oscillator.stop(context.currentTime + 0.22);
              } else { setSoundBlocked(true); }
            }
          } catch { /* browser disallows autoplay; badge remains visible */ }
        }
      }
      refresh();
    };
    const onRead = () => refresh();
    socket.on('new_message', onMessage);
    socket.on('messages_read', onRead);
    window.addEventListener('focus', refresh);
    return () => {
      socket.off('new_message', onMessage);
      socket.off('messages_read', onRead);
      window.removeEventListener('focus', refresh);
    };
  }, [userId, soundOn, refresh]);

  useEffect(() => () => { audioRef.current?.close().catch(() => undefined); }, []);

  useEffect(() => {
    const onOutside = (event: MouseEvent) => { if (!boxRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem('scanms_chat_sound', next ? 'on' : 'off');
    if (next) unlockSound();
  };
  const unlockSound = async () => {
    try {
      const AudioContextType = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextType) return;
      const context: AudioContext = audioRef.current || new AudioContextType();
      audioRef.current = context;
      await context.resume();
      setSoundBlocked(context.state !== 'running');
    } catch { setSoundBlocked(true); }
  };
  const unread = conversations.filter((conversation) => {
    const last = conversation.chatMessages?.[0];
    return (conversation._count?.chatMessages || 0) > 0 || (last && !last.isRead && last.senderId !== userId);
  });

  return <div className="relative" ref={boxRef}>
    <button type="button" aria-label={`Tin nhắn: ${count} chưa đọc`} onClick={() => { setOpen(!open); refresh(); }} className="relative rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-2.5 text-[#B88E4F] hover:bg-[#F3EFE6]">
      <Bell size={18} />{count > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 h-5 place-items-center rounded-full bg-[#C59B58] px-1 text-[10px] font-bold text-[#231D15]">{count > 99 ? '99+' : count}</span>}
    </button>
    {open && <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#EAE4D7] bg-white p-3 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-2"><strong className="text-sm">{isShop ? 'Tin nhắn khách hàng' : 'Tin nhắn Shop'}</strong><button type="button" onClick={toggleSound} aria-label={soundOn ? 'Tắt âm báo' : 'Bật âm báo'} title={soundOn ? 'Tắt âm báo' : 'Bật âm báo'} className="rounded-lg p-2 text-[#7D715E] hover:bg-[#F3EFE6]">{soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}</button></div>
      {soundOn && soundBlocked && <button type="button" onClick={unlockSound} className="mt-2 w-full rounded-lg bg-[#FBF5EB] px-2 py-2 text-left text-xs text-[#B88E4F]">Trình duyệt đang chặn âm báo. Bấm để cho phép phát âm.</button>}
      {unread.length === 0 ? <p className="py-5 text-center text-sm text-[#7D715E]">Không có tin nhắn chưa đọc.</p> : unread.map((conversation) => <button key={conversation.id} type="button" onClick={() => { setOpen(false); navigate(isShop && conversation.customerId ? `/merchant/customer-messages?conversationId=${conversation.id}` : `/chat?conversationId=${conversation.id}`); }} className="block w-full border-b border-[#EAE4D7] px-2 py-3 text-left hover:bg-[#FBF5EB]"><strong className="block text-sm">{isShop ? conversation.customer?.fullName || conversation.collaborator?.fullName || 'Khách hàng' : conversation.store?.name || 'Shop'}</strong><span className="block truncate text-xs text-[#7D715E]">{conversation.chatMessages?.[0]?.messageText}</span></button>)}
      <button type="button" onClick={() => { setOpen(false); navigate('/chat'); }} className="mt-2 w-full rounded-lg bg-[#FBF5EB] py-2 text-xs font-semibold text-[#B88E4F]">Xem tất cả hội thoại</button>
    </div>}
  </div>;
}
