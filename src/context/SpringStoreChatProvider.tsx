import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StoreChatContext } from './store-chat-context';
import {
  storeChatService as service,
  type StoreChatConversation,
  type StoreChatMessage
} from '@/services/store-chat.service';
import { disconnectChatSocket, getChatSocket } from '@/services/chat-socket.service';
import type {ChatConversationItem, ChatMessageItem, ChatProductInfo, ChatStoreInfo} from '@/types/chat.types';
import { toast } from '@/utils/toast';

function account() {
  try {
    return String(JSON.parse(localStorage.getItem('user') || '{}').id || '');
  } catch {
    return '';
  }
}

const errorText = (error: unknown) => error instanceof Error ? error.message : 'Không kết nối được dịch vụ chat.';

function message(raw: StoreChatMessage, userId: string): ChatMessageItem {
  let product: ChatProductInfo | undefined;
  try {
    const card = JSON.parse(raw.messageText);
    if (card.type === 'PRODUCT_INQUIRY') product = {
      id: card.productId,
      title: card.productTitle,
      price: Number(card.productPrice || 0),
      imageUrl: card.productImage
    };
  } catch { /* Plain text. */
  }
  return {
    id: raw.id, sender: raw.senderId === userId ? 'user' : 'shop', content: raw.messageText,
    createdAt: raw.createdAt, timestamp: new Date(raw.createdAt).toLocaleString('vi-VN'), delivery: 'sent',
    ...(product ? {product, products: [product]} : {})
  };
}

function merge(previous: ChatMessageItem[], incoming: ChatMessageItem[]) {
  const rows = new Map(previous.map(row => [row.id, row]));
  for (const row of incoming) rows.set(row.id, row);
  return [...rows.values()].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '') || a.id.localeCompare(b.id));
}

function conversation(raw: StoreChatConversation): ChatConversationItem {
  return {
    id: raw.id, customerId: raw.customerId, isStoreOwner: raw.isStoreOwner,
    peerName: raw.isStoreOwner ? raw.customer?.fullName || 'Khách hàng' : raw.store.name,
    store: {id: raw.storeId, name: raw.store.name, logoUrl: raw.store.logoUrl},
    unreadCount: raw._count?.chatMessages || 0, messages: [],
    lastMessage: raw.chatMessages?.[0]?.messageText || 'Bắt đầu trò chuyện',
    lastTime: raw.chatMessages?.[0]?.createdAt ? new Date(raw.chatMessages[0].createdAt).toLocaleString('vi-VN') : ''
  };
}

export function SpringStoreChatProvider({children}: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [activeConversationId, setActive] = useState('');
  const [activeProduct, setActiveProduct] = useState<ChatProductInfo | null>(null);
  const [userId, setUserId] = useState(account);
  const [sessionToken, setSessionToken] = useState(() => localStorage.getItem('token'));
  const [connectionState, setConnection] = useState('Đang kết nối');
  const [chatError, setError] = useState('');
  const [loadingMessages, setLoading] = useState(false);
  const [hasOlderMessages, setHasOlder] = useState(false);
  const scope = useRef(userId);
  const generation = useRef(0);
  const inboxRequest = useRef(0);
  const rowsRef = useRef(conversations);
  rowsRef.current = conversations;
  const visible = useRef({id: activeConversationId, open: isOpen && !isMinimized});
  visible.current = {id: activeConversationId, open: isOpen && !isMinimized};
  const refreshInbox = useCallback(async () => {
    const current = scope.current;
    const request = ++inboxRequest.current;
    if (!current || !localStorage.getItem('token')) return;
    try {
      const rows = await service.list();
      if (current !== scope.current || request !== inboxRequest.current) return;
      setConversations(previous => rows.map(raw => ({
        ...conversation(raw),
        messages: previous.find(row => row.id === raw.id)?.messages || []
      })));
      setError('');
    } catch (error) {
      if (current === scope.current) setError(errorText(error));
    }
  }, []);

  useEffect(() => {
    const changed = () => {
      const next = account();
      setSessionToken(localStorage.getItem('token'));
      if (next !== scope.current) {
        scope.current = next;
        generation.current++;
        setUserId(next);
        setConversations([]);
        setActive('');
        setActiveProduct(null);
        setIsOpen(false);
        disconnectChatSocket();
      }
      void refreshInbox();
    };
    window.addEventListener('auth-user-updated', changed);
    window.addEventListener('storage', changed);
    const timer = window.setInterval(changed, 10000);
    changed();
    return () => {
      clearInterval(timer);
      window.removeEventListener('auth-user-updated', changed);
      window.removeEventListener('storage', changed);
    };
  }, [refreshInbox]);

  useEffect(() => {
    if (!userId || !localStorage.getItem('token')) return;
    const socket = getChatSocket();
    const current = userId;
    const receive = (raw: StoreChatMessage) => {
      if (current !== scope.current) return;
      setConversations(previous => previous.map(row => row.id === raw.conversationId ? {
        ...row, lastMessage: raw.messageText, lastTime: new Date(raw.createdAt).toLocaleString('vi-VN'),
        unreadCount: raw.senderId !== current && !(visible.current.open && visible.current.id === row.id) ? row.unreadCount + (row.messages.some(m => m.id === raw.id) ? 0 : 1) : row.unreadCount,
        messages: merge(row.messages, [message(raw, current)]),
      } : row));
      if (visible.current.open && visible.current.id === raw.conversationId && document.visibilityState === 'visible') void service.read(raw.conversationId).catch(() => undefined);
      void refreshInbox();
    };
    const connected = () => {
      setConnection('Đã kết nối trực tiếp');
      void refreshInbox();
    };
    const disconnected = () => setConnection('Đang kết nối lại · lịch sử được lưu trên máy chủ');
    socket.on('new_message', receive);
    socket.on('connect', connected);
    socket.on('disconnect', disconnected);
    socket.on('connect_error', disconnected);
    if (socket.connected) connected();
    return () => {
      socket.off('new_message', receive);
      socket.off('connect', connected);
      socket.off('disconnect', disconnected);
      socket.off('connect_error', disconnected);
    };
  }, [userId, sessionToken, refreshInbox]);

  useEffect(() => {
    if (!activeConversationId || !isOpen || isMinimized || !userId) return;
    let cancelled = false;
    let initialPage = true;
    const revision = ++generation.current;
    setLoading(true);
    setHasOlder(false);
    const socket = getChatSocket();
    const join = () => socket.emit('join_conversation', {conversationId: activeConversationId}, (result: {
      ok?: boolean;
      message?: string
    }) => {
      if (!cancelled && !result?.ok) setError(result?.message || 'Không có quyền truy cập chat.');
    });
    const load = async () => {
      try {
        const rows = await service.history(activeConversationId);
        if (cancelled || revision !== generation.current) return;
        setConversations(previous => previous.map(row => row.id === activeConversationId ? {
          ...row,
          unreadCount: 0,
          messages: merge(row.messages, rows.map(raw => message(raw, userId)))
        } : row));
        if (initialPage) {
          setHasOlder(rows.length === 50);
          initialPage = false;
        }
        setError('');
        if (document.visibilityState === 'visible') await service.read(activeConversationId);
      } catch (error) {
        if (!cancelled) setError(errorText(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    join();
    socket.on('connect', join);
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
      socket.off('connect', join);
      socket.emit('leave_conversation', {conversationId: activeConversationId});
    };
  }, [activeConversationId, isOpen, isMinimized, userId, sessionToken]);

  const openChat = async (store?: ChatStoreInfo, product?: ChatProductInfo) => {
    if (!localStorage.getItem('token')) {
      toast.error('Vui lòng đăng nhập để nhắn tin.');
      return;
    }
    setIsOpen(true);
    setIsMinimized(false);
    setActiveProduct(product || null);
    if (!store) {
      if (!activeConversationId && conversations[0]) setActive(conversations[0].id);
      return;
    }
    const current = scope.current;
    try {
      const raw = await service.open(store.id, store.customerId);
      if (current !== scope.current) return;
      const row = conversation(raw);
      inboxRequest.current++;
      setConversations(previous => [{
        ...row,
        messages: previous.find(c => c.id === row.id)?.messages || []
      }, ...previous.filter(c => c.id !== row.id)]);
      setActive(row.id);
      setError('');
    } catch (error) {
      setError(errorText(error));
      toast.error(errorText(error));
    }
  };
  const deliver = async (conversationId: string, content: string, id: string) => {
    const current = scope.current;
    setConversations(previous => previous.map(row => row.id === conversationId ? {
      ...row,
      messages: row.messages.map(m => m.id === id ? {...m, delivery: 'sending'} : m)
    } : row));
    try {
      const raw = await service.send(conversationId, content, id);
      if (current !== scope.current) return false;
      setConversations(previous => previous.map(row => row.id === conversationId ? {
        ...row,
        messages: merge(row.messages, [message(raw, current)])
      } : row));
      void refreshInbox();
      return true;
    } catch (error) {
      if (current !== scope.current) return false;
      setConversations(previous => previous.map(row => row.id === conversationId ? {
        ...row,
        messages: row.messages.map(m => m.id === id && m.delivery !== 'sent' ? {...m, delivery: 'failed'} : m)
      } : row));
      setError(errorText(error));
      return false;
    }
  };
  const sendMessage = async (content: string) => {
    if (!activeConversationId || !content.trim()) return false;
    const id = crypto.randomUUID();
    const pending: ChatMessageItem = {
      id,
      sender: 'user',
      content: content.trim(),
      timestamp: new Date().toLocaleString('vi-VN'),
      createdAt: new Date().toISOString(),
      delivery: 'sending'
    };
    setConversations(previous => previous.map(row => row.id === activeConversationId ? {
      ...row,
      messages: merge(row.messages, [pending])
    } : row));
    // Draft becomes a message immediately; failed items keep their original retry identity.
    void deliver(activeConversationId, pending.content, id);
    return true;
  };
  const retryMessage = async (id: string) => {
    const row = rowsRef.current.find(c => c.messages.some(m => m.id === id));
    const item = row?.messages.find(m => m.id === id);
    return row && item?.delivery === 'failed' ? deliver(row.id, item.content, id) : false;
  };
  const loadOlderMessages = async () => {
    const id = activeConversationId, current = scope.current;
    const oldest = rowsRef.current.find(row => row.id === id)?.messages.find(m => m.delivery === 'sent');
    if (!oldest || loadingMessages) return;
    setLoading(true);
    try {
      const rows = await service.history(id, oldest.id);
      if (current !== scope.current || id !== visible.current.id) return;
      setHasOlder(rows.length === 50);
      setConversations(previous => previous.map(row => row.id === id ? {
        ...row,
        messages: merge(row.messages, rows.map(raw => message(raw, current)))
      } : row));
    } catch (error) {
      setError(errorText(error));
    } finally {
      setLoading(false);
    }
  };
  return <StoreChatContext.Provider value={{
    accountId: userId,
    isOpen,
    isMinimized,
    conversations,
    activeConversationId,
    activeConversation: conversations.find(row => row.id === activeConversationId) || null,
    activeProduct,
    openChat,
    closeChat: () => setIsOpen(false),
    toggleMinimize: () => setIsMinimized(value => !value),
    selectConversation: setActive,
    sendMessage,
    retryMessage,
    loadOlderMessages,
    hasOlderMessages,
    loadingMessages,
    connectionState,
    chatError,
    sendProductsInquiry: async products => {
      for (const p of products) if (!await sendMessage(JSON.stringify({
        type: 'PRODUCT_INQUIRY',
        productId: p.id
      }))) return false;
      return true;
    },
    clearActiveProduct: () => setActiveProduct(null),
    sendAttachment: async () => {
      throw new Error('Hiện hỗ trợ tin nhắn văn bản và thẻ sản phẩm.');
    },
    shareCouponVoucher: () => false,
    deleteConversation: async () => false,
    clearConversationMessages: async () => false,
    clearAllConversations: () => undefined,
  }}>{children}</StoreChatContext.Provider>;
}
