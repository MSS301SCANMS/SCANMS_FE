import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StoreChatContext } from './store-chat-context';
import {
  storeChatService as service,
  type StoreChatConversation,
  type StoreChatMessage
} from '@/services/store-chat.service';
import { disconnectChatSocket, getChatSocket } from '@/services/chat-socket.service';
import { isChatSocketEnabled } from '@/services/chat-socket.service';
import type {ChatConversationItem, ChatMessageItem, ChatProductInfo, ChatStoreInfo} from '@/types/chat.types';
import { toast } from '@/utils/toast';
import { attachmentError, chatMessagePreview } from '@/utils/chat-attachment.utils';
import type { ChatAttachmentType } from '@/types/chat.types';

function account() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return String(user.id || user.userId || '');
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
    senderName: raw.sender?.fullName,
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
    store: {id: raw.storeId, name: raw.store.name, logoUrl: raw.store.logoUrl, slug: raw.store.slug, isVerified: raw.store.isVerified},
    unreadCount: raw._count?.chatMessages || 0, messages: [],
    lastMessage: chatMessagePreview(raw.chatMessages?.[0]?.messageText || 'Bắt đầu trò chuyện'),
    lastTime: raw.chatMessages?.[0]?.createdAt ? new Date(raw.chatMessages[0].createdAt).toLocaleString('vi-VN') : '',
    lastCreatedAt: raw.chatMessages?.[0]?.createdAt,
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
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [hasOlderMessages, setHasOlder] = useState(false);
  const scope = useRef(userId);
  const generation = useRef(0);
  const inboxRequest = useRef(0);
  const rowsRef = useRef(conversations);
  const pendingFiles = useRef(new Map<string, File>());
  rowsRef.current = conversations;
  const visible = useRef({id: activeConversationId, open: isOpen && !isMinimized});
  visible.current = {id: activeConversationId, open: isOpen && !isMinimized};
  const refreshInbox = useCallback(async () => {
    const current = scope.current;
    const request = ++inboxRequest.current;
    if (!current || !localStorage.getItem('token')) { setLoadingConversations(false); return; }
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
    } finally {
      if (current === scope.current && request === inboxRequest.current) setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    const changed = () => {
      const next = account();
      setSessionToken(localStorage.getItem('token'));
      if (next !== scope.current) {
        scope.current = next;
        generation.current++;
        pendingFiles.current.clear();
        setUserId(next);
        setConversations([]);
        setLoadingConversations(true);
        setError('');
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
    if (!isChatSocketEnabled()) { setConnection('Đồng bộ qua máy chủ'); return; }
    const socket = getChatSocket();
    const current = userId;
    const receive = (raw: StoreChatMessage) => {
      if (current !== scope.current) return;
      pendingFiles.current.delete(raw.id);
      setConversations(previous => previous.map(row => row.id === raw.conversationId ? {
        ...row, lastMessage: chatMessagePreview(raw.messageText), lastTime: new Date(raw.createdAt).toLocaleString('vi-VN'), lastCreatedAt: raw.createdAt,
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
        for (const raw of rows) pendingFiles.current.delete(raw.id);
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
      setLoadingConversations(false);
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
  const deliverAttachment = async (conversationId: string, id: string, file: File) => {
    const current = scope.current;
    const update = (values: Partial<ChatMessageItem>) => {
      if (current !== scope.current) return;
      setConversations(previous => previous.map(row => row.id === conversationId ? {
        ...row, messages: row.messages.map(item => item.id === id && item.delivery !== 'sent' ? { ...item, ...values } : item),
      } : row));
    };
    update({ delivery: 'sending', uploadProgress: 0 });
    try {
      const raw = await service.upload(conversationId, file, id, percent => update({ uploadProgress: percent }));
      if (current !== scope.current) return false;
      pendingFiles.current.delete(id);
      setConversations(previous => previous.map(row => row.id === conversationId ? {
        ...row, messages: merge(row.messages, [message(raw, current)]),
      } : row));
      // The multipart endpoint already committed both file and message. Reuse that identity
      // for the relay broadcast; a lost relay ACK cannot turn the saved message into a failure.
      void service.send(conversationId, raw.messageText, raw.id).catch(() => undefined);
      void refreshInbox();
      return true;
    } catch (error) {
      if (current !== scope.current) return false;
      if (rowsRef.current.find(row => row.id === conversationId)?.messages.some(item => item.id === id && item.delivery === 'sent')) {
        pendingFiles.current.delete(id);
        return true;
      }
      update({ delivery: 'failed', uploadProgress: undefined });
      if (current === scope.current) setError(errorText(error));
      return false;
    }
  };
  const sendAttachment = async (file: File, _type: ChatAttachmentType) => {
    const error = attachmentError(file);
    if (error) throw new Error(error);
    if (!activeConversationId) throw new Error('Chọn cuộc trò chuyện trước khi gửi tệp.');
    const id = crypto.randomUUID();
    pendingFiles.current.set(id, file);
    const pending: ChatMessageItem = {
      id, sender: 'user', delivery: 'sending', uploadProgress: 0,
      timestamp: new Date().toLocaleString('vi-VN'), createdAt: new Date().toISOString(),
      content: JSON.stringify({ type: 'ATTACHMENT', attachmentId: id, fileName: file.name,
        contentType: file.type, sizeBytes: file.size, mediaType: /\.(jpe?g|png|webp)$/i.test(file.name) ? 'IMAGE' : 'DOCUMENT' }),
    };
    setConversations(previous => previous.map(row => row.id === activeConversationId ? {
      ...row, messages: merge(row.messages, [pending]),
    } : row));
    void deliverAttachment(activeConversationId, id, file);
  };
  const retryMessage = async (id: string) => {
    const row = rowsRef.current.find(c => c.messages.some(m => m.id === id));
    const item = row?.messages.find(m => m.id === id);
    const file = pendingFiles.current.get(id);
    if (!row || item?.delivery !== 'failed') return false;
    return file ? deliverAttachment(row.id, id, file) : deliver(row.id, item.content, id);
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
    loadingConversations,
    refreshConversations: async () => { setLoadingConversations(true); await refreshInbox(); },
    sendProductsInquiry: async products => {
      for (const p of products) if (!await sendMessage(JSON.stringify({
        type: 'PRODUCT_INQUIRY',
        productId: p.id
      }))) return false;
      return true;
    },
    clearActiveProduct: () => setActiveProduct(null),
    sendAttachment,
    shareCouponVoucher: () => false,
    deleteConversation: async () => false,
    clearConversationMessages: async () => false,
    clearAllConversations: () => undefined,
  }}>{children}</StoreChatContext.Provider>;
}
