import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { getChatSocket, isChatSocketEnabled } from '../services/chat-socket.service';
import type {
  ChatAttachmentType,
  ChatProductInfo,
  ChatStoreInfo,
  ChatCouponVoucher,
  ChatExclusiveDeal,
  ChatMessageItem,
  ChatConversationItem,
  ScanmsChatContextType,
} from '@/types/chat.types';
import { toast } from '../utils/toast';

export type {
  ChatAttachmentType,
  ChatProductInfo,
  ChatStoreInfo,
  ChatCouponVoucher,
  ChatExclusiveDeal,
  ChatMessageItem,
  ChatConversationItem,
  ScanmsChatContextType,
};

const DEFAULT_CONVERSATIONS: ChatConversationItem[] = [];

const ScanmsChatContext = createContext<ScanmsChatContextType | undefined>(undefined);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getCurrentUserId(): string | undefined {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')?.id;
  } catch {
    return undefined;
  }
}

function getChatStorageScope(): string {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id ? `${user.id}:${user.role || 'unknown'}` : 'guest';
  } catch {
    return 'guest';
  }
}

function getChatStorageKey(scope = getChatStorageScope()): string {
  return `scanms_chat_conversations:${encodeURIComponent(scope)}`;
}

function formatTimeDisplay(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua';
  }
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function loadCachedConversations(scope: string): ChatConversationItem[] {
  try {
    const isGuest = scope === 'guest';
    const key = getChatStorageKey(scope);
    const legacyKey = `scanms_shopee_chat_conversations:${encodeURIComponent(scope)}`;
    const saved = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (!saved) return isGuest ? DEFAULT_CONVERSATIONS : [];
    const parsed: ChatConversationItem[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) return isGuest ? DEFAULT_CONVERSATIONS : [];
    const filtered = parsed.filter(
      (c) =>
        c?.store?.name &&
        !c.store.name.toLowerCase().includes('marie.japan') &&
        !c.store.name.toLowerCase().includes('umizoku') &&
        c.id !== 'conv-marie-japan' &&
        c.id !== 'conv-umizoku' &&
        (isGuest || c.id !== 'conv-sora-skin')
    );
    const deduped = deduplicateConversations(filtered.map(conversation => ({
      ...conversation,
      messages: (conversation.messages || []).filter(message => !message.id.startsWith('m-init-')),
    })));
    return deduped.length > 0 ? deduped : (isGuest ? DEFAULT_CONVERSATIONS : []);
  } catch {
    return scope === 'guest' ? DEFAULT_CONVERSATIONS : [];
  }
}

function parseProductInquiry(text: string): ChatProductInfo | undefined {
  try {
    const card = JSON.parse(text);
    if (card?.type !== 'PRODUCT_INQUIRY' || !card.productId || !card.productTitle) return;
    return {
      id: card.productId,
      title: card.productTitle,
      price: Number(card.productPrice || 0),
      imageUrl: card.productImage || undefined,
      sku: card.productSku || undefined,
    };
  } catch {
    return;
  }
}

function parseCouponVoucher(text: string): ChatCouponVoucher | undefined {
  try {
    const card = JSON.parse(text);
    if (card?.type !== 'COUPON_VOUCHER' || !card.couponId || !card.couponCode) return;
    return {
      id: card.couponId,
      code: card.couponCode,
      discountType: card.discountType,
      discountValue: Number(card.discountValue || 0),
      minimumOrderAmount: card.minimumOrderAmount == null ? null : Number(card.minimumOrderAmount),
      maximumDiscountAmount: card.maximumDiscountAmount == null ? null : Number(card.maximumDiscountAmount),
      remainingUses: card.remainingUses == null ? null : Number(card.remainingUses),
      expiresAt: card.expiresAt || null,
      scopeType: card.scopeType || 'STORE_WIDE',
      products: Array.isArray(card.products) ? card.products : [],
      categories: Array.isArray(card.categories) ? card.categories : [],
      storeName: card.storeName || 'Gian hàng',
    };
  } catch {
    return;
  }
}

export function parseExclusiveDealMessage(text?: string): ChatExclusiveDeal | undefined {
  if (!text) return;
  try {
    const card = JSON.parse(text);
    if (!['EXCLUSIVE_DEAL_PROPOSAL', 'EXCLUSIVE_DEAL_DECISION'].includes(card?.type)) return;
    return card as ChatExclusiveDeal;
  } catch {
    return;
  }
}

function getChatMessagePreview(messageText?: string, mediaName?: string) {
  if (!messageText) return mediaName ? `📎 ${mediaName}` : 'Bắt đầu cuộc trò chuyện';
  const product = parseProductInquiry(messageText);
  if (product) return `Sản phẩm: ${product.title}`;
  const coupon = parseCouponVoucher(messageText);
  if (coupon) return `Mã giảm giá: ${coupon.code}`;
  const exclusiveDeal = parseExclusiveDealMessage(messageText);
  if (exclusiveDeal) {
    const productTitle = exclusiveDeal.productTitle || 'sản phẩm';
    return exclusiveDeal.type === 'EXCLUSIVE_DEAL_PROPOSAL'
      ? `Đề xuất Exclusive Deal: ${productTitle} · ${exclusiveDeal.proposedCommissionRate ?? '—'}%`
      : `Cập nhật Exclusive Deal: ${productTitle} · ${exclusiveDeal.status === 'APPROVED' ? 'đã duyệt' : 'đã từ chối'}`;
  }
  return messageText;
}

export function isUnsafeShopLogo(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase().trim();
  if (!lower) return true;
  return (
    lower.includes('unsplash.com') ||
    lower.includes('photo-1522337360788') ||
    lower.includes('photo-1571781926291') ||
    lower.includes('photo-1550009158') ||
    lower.includes('photo-1540420773') ||
    lower.includes('photo-1532413992')
  );
}

export function deduplicateConversations(list: ChatConversationItem[]): ChatConversationItem[] {
  const seenStores = new Set<string>();
  const seenIds = new Set<string>();
  const result: ChatConversationItem[] = [];

  for (const conv of list) {
    if (!conv || !conv.store) continue;

    const storeIdKey = (conv.store.id || '').trim().toLowerCase();
    const storeNameKey = (conv.store.name || '').trim().toLowerCase();
    const convIdKey = (conv.id || '').trim();

    const isStoreDuplicate =
      (storeIdKey && seenStores.has(storeIdKey)) ||
      (storeNameKey && seenStores.has(`name:${storeNameKey}`));
    const isIdDuplicate = convIdKey && seenIds.has(convIdKey);

    if (!isStoreDuplicate && !isIdDuplicate) {
      if (storeIdKey) seenStores.add(storeIdKey);
      if (storeNameKey) seenStores.add(`name:${storeNameKey}`);
      if (convIdKey) seenIds.add(convIdKey);

      result.push({
        ...conv,
        store: {
          ...conv.store,
          logoUrl: isUnsafeShopLogo(conv.store.logoUrl) ? undefined : conv.store.logoUrl,
        },
      });
    }
  }

  return result;
}

function mapServerConversation(raw: any): ChatConversationItem {
  const last = raw?.chatMessages?.[0];
  const rawLogo = raw.store?.logoUrl;
  return {
    id: raw.id,
    store: {
      id: raw.store?.id || raw.storeId,
      name: raw.store?.name || 'Cửa hàng',
      logoUrl: isUnsafeShopLogo(rawLogo) ? undefined : rawLogo,
    },
    lastMessage: getChatMessagePreview(last?.messageText, last?.mediaName),
    lastTime: last?.createdAt ? formatTimeDisplay(last.createdAt) : '',
    unreadCount: Number(raw._count?.chatMessages) || 0,
    messages: [],
  };
}

function mapServerMessage(raw: any, userId = getCurrentUserId()): ChatMessageItem {
  const content = raw.messageText || '';
  const product = parseProductInquiry(content);
  const coupon = parseCouponVoucher(content);
  return {
    id: raw.id,
    sender: raw.senderId === userId ? 'user' : 'shop',
    content,
    timestamp: new Date(raw.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    mediaUrl: raw.mediaUrl || undefined,
    mediaType: raw.mediaType || undefined,
    mediaName: raw.mediaName || undefined,
    ...(product ? { product, products: [product] } : {}),
    ...(coupon ? { coupon } : {}),
  };
}

export function ScanmsChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<ChatConversationItem[]>(() =>
    loadCachedConversations(getChatStorageScope())
  );
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-sora-skin');
  const [activeProduct, setActiveProduct] = useState<ChatProductInfo | null>(null);
  const socketRef = useRef<ReturnType<typeof getChatSocket> | null>(null);
  const authScopeRef = useRef(getChatStorageScope());
  const visibleChatRef = useRef({ isOpen: false, conversationId: activeConversationId });
  visibleChatRef.current = { isOpen: isOpen && !isMinimized, conversationId: activeConversationId };

  const ensureSocket = () => {
    const socket = getChatSocket();
    if (socketRef.current !== socket) {
      socket.on('new_message', (raw: any) => {
        const message = mapServerMessage(raw);
        if (message.sender !== 'user' && visibleChatRef.current.isOpen &&
            visibleChatRef.current.conversationId === raw.conversationId && document.visibilityState === 'visible') {
          void api.patch(`/chat/conversations/${raw.conversationId}/read`).catch(() => undefined);
        }
        setConversations((prev) => prev.map((conv) => {
          if (conv.id !== raw.conversationId || conv.messages.some((item) => item.id === message.id)) return conv;
          return {
            ...conv,
            lastMessage: getChatMessagePreview(message.content, message.mediaName),
            lastTime: message.timestamp,
            messages: [...conv.messages, message],
          };
        }));
      });
      socket.on('error', (error: { message?: string }) => {
        if (error?.message) toast.error(error.message);
      });
      socket.on('messages_read', (event: { readerId: string; conversationId: string }) => {
        if (event.readerId === getCurrentUserId()) {
          setConversations((prev) => prev.map((conv) => conv.id === event.conversationId ? { ...conv, unreadCount: 0 } : conv));
        }
      });
      socketRef.current = socket;
    }
    return socket;
  };

  useEffect(() => {
    let cancelled = false;
    localStorage.removeItem('scanms_shopee_chat_conversations');

    const reloadConversations = () => {
      const currentScope = getChatStorageScope();
      if (authScopeRef.current !== currentScope) {
        authScopeRef.current = currentScope;
        const initial = loadCachedConversations(currentScope);
        setConversations(initial);
        setActiveConversationId(initial[0]?.id || '');
        setActiveProduct(null);
        setIsOpen(false);
        setIsMinimized(false);
      }
      if (!localStorage.getItem('token')) return;
      const requestedScope = currentScope;
      api.get('/chat/conversations')
        .then((result: any) => {
          const rows = Array.isArray(result) ? result : result?.data || [];
          if (cancelled || requestedScope !== getChatStorageScope() || !Array.isArray(rows)) return;
          const mapped = rows.map(mapServerConversation);
          setConversations((prev) => {
            const mergedMapped = mapped.map((srv) => {
              const localMatch = prev.find((p) => p.id === srv.id);
              return {
                ...srv,
                messages: srv.messages.length > 0 ? srv.messages : (localMatch?.messages || []),
                lastMessage: srv.lastMessage !== 'Bắt đầu cuộc trò chuyện' ? srv.lastMessage : (localMatch?.lastMessage || srv.lastMessage),
              };
            });
            const pendingOptimistic = prev.filter(
              (p) => !UUID_REGEX.test(p.id) && p.id !== 'conv-sora-skin' && p.store?.id && !mapped.some((m) => m.store?.id === p.store?.id)
            );
            return deduplicateConversations([...mergedMapped, ...pendingOptimistic]);
          });
          if (mapped.length) {
            setActiveConversationId((current) => UUID_REGEX.test(current) && mapped.some((m) => m.id === current) ? current : mapped[0].id);
          } else {
            setActiveConversationId('');
          }
          ensureSocket();
        })
        .catch(() => {});
    };
    reloadConversations();
    const refresh = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !isChatSocketEnabled()) reloadConversations();
    }, 10000);
    const readVisibleChat = () => {
      const current = visibleChatRef.current;
      if (current.isOpen && document.visibilityState === 'visible' && UUID_REGEX.test(current.conversationId) && localStorage.getItem('token')) {
        void api.patch(`/chat/conversations/${current.conversationId}/read`).catch(() => undefined);
      }
    };
    window.addEventListener('auth-user-updated', reloadConversations);
    document.addEventListener('visibilitychange', readVisibleChat);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
      window.removeEventListener('auth-user-updated', reloadConversations);
      document.removeEventListener('visibilitychange', readVisibleChat);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || isMinimized || !UUID_REGEX.test(activeConversationId) || !localStorage.getItem('token')) return;
    let cancelled = false;
    const socket = ensureSocket();
    socket.emit('join_conversation', { conversationId: activeConversationId });
    const load = () => api.get(`/chat/conversations/${activeConversationId}/messages?take=50`, { headers: { 'x-skip-cache': '1' } })
      .then((result: any) => {
        const rows = Array.isArray(result) ? result : result?.data || [];
        if (cancelled || !Array.isArray(rows)) return;
        setConversations((prev) => prev.map((conv) => {
          if (conv.id !== activeConversationId) return conv;
          const fetched = rows.map((row: any) => mapServerMessage(row));
          const fetchedIds = new Set(fetched.map((message: ChatMessageItem) => message.id));
          const justArrived = conv.messages.filter((message) => !fetchedIds.has(message.id));
          return { ...conv, messages: [...fetched, ...justArrived] };
        }));
        if (document.visibilityState === 'visible') {
          void api.patch(`/chat/conversations/${activeConversationId}/read`).catch(() => undefined);
        }
      })
      .catch((error: any) => toast.error(error?.message || 'Không tải được lịch sử chat.'));
    void load();
    const refresh = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !isChatSocketEnabled()) void load();
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
      socket.emit('leave_conversation', { conversationId: activeConversationId });
    };
  }, [activeConversationId, isOpen, isMinimized]);

  useEffect(() => {
    try {
      const scope = authScopeRef.current;
      if (scope !== getChatStorageScope()) return;
      localStorage.setItem(getChatStorageKey(scope), JSON.stringify(conversations));
    } catch (e) {
      console.warn('Could not persist chat conversations', e);
    }
  }, [conversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  const openChat = async (store?: ChatStoreInfo, product?: ChatProductInfo) => {
    if (!localStorage.getItem('token')) {
      toast.error('Vui lòng đăng nhập để nhắn tin với shop.');
      return;
    }
    setIsOpen(true);
    setIsMinimized(false);

    if (product) {
      setActiveProduct(product);
    }

    if (store) {
      const cleanStore: ChatStoreInfo = {
        ...store,
        logoUrl: isUnsafeShopLogo(store.logoUrl) ? undefined : store.logoUrl,
      };

      const normalizedStoreName = cleanStore.name.trim().toLowerCase();
      const existingConv = conversations.find(
        (c) =>
          (c.store.id && cleanStore.id && c.store.id.toLowerCase() === cleanStore.id.toLowerCase()) ||
          c.store.name.trim().toLowerCase() === normalizedStoreName
      );

      let currentConvId = '';

      if (existingConv) {
        currentConvId = existingConv.id;
        setActiveConversationId(currentConvId);

        setConversations((prev) => {
          const others = prev.filter((c) => c.id !== existingConv.id);
          const updatedConv = {
            ...existingConv,
            store: {
              ...existingConv.store,
              logoUrl: cleanStore.logoUrl || existingConv.store.logoUrl,
            },
            unreadCount: 0,
          };
          return deduplicateConversations([updatedConv, ...others]);
        });
      } else {
        const newConvId = `conv-${Date.now()}`;
        currentConvId = newConvId;
        const newConv: ChatConversationItem = {
          id: newConvId,
          store: cleanStore,
          lastMessage: 'Bắt đầu cuộc trò chuyện mới',
          lastTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          unreadCount: 0,
          messages: [],
        };
        setConversations((prev) => deduplicateConversations([newConv, ...prev]));
        setActiveConversationId(newConvId);
      }

      if (localStorage.getItem('token') && cleanStore.id) {
        try {
          const result: any = await api.post('/chat/conversations', { storeId: cleanStore.id });
          const raw = result?.data || result;
          if (raw?.id) {
            const mapped = mapServerConversation(raw);
            const cleanMapped: ChatConversationItem = {
              ...mapped,
              store: {
                ...mapped.store,
                logoUrl: isUnsafeShopLogo(mapped.store.logoUrl) ? undefined : mapped.store.logoUrl,
              },
            };

            setConversations((prev) => {
              const oldMatch = prev.find(
                (c) =>
                  c.id === currentConvId ||
                  (c.store.id && c.store.id.toLowerCase() === cleanStore.id.toLowerCase()) ||
                  c.store.name.trim().toLowerCase() === normalizedStoreName
              );

              const remaining = prev.filter(
                (c) =>
                  c.id !== currentConvId &&
                  c.id !== cleanMapped.id &&
                  c.store.id?.toLowerCase() !== cleanStore.id.toLowerCase() &&
                  c.store.name.trim().toLowerCase() !== normalizedStoreName
              );

              const mergedMessages =
                cleanMapped.messages && cleanMapped.messages.length > 0
                  ? cleanMapped.messages
                  : oldMatch?.messages || [];

              const finalConv: ChatConversationItem = {
                ...cleanMapped,
                messages: mergedMessages,
                lastMessage: oldMatch?.lastMessage || cleanMapped.lastMessage,
                lastTime: oldMatch?.lastTime || cleanMapped.lastTime,
              };

              return deduplicateConversations([finalConv, ...remaining]);
            });

            setActiveConversationId(cleanMapped.id);
            ensureSocket();
          }
        } catch (error: any) {
          toast.error(error?.message || 'Chưa kết nối được với shop. Vui lòng thử lại.');
        }
      }
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  const selectConversation = (id: string) => {
    setActiveConversationId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  const clearActiveProduct = () => {
    setActiveProduct(null);
  };

  const deleteConversation = async (conversationId: string): Promise<boolean> => {
    if (!conversationId) return false;

    if (UUID_REGEX.test(conversationId) && localStorage.getItem('token')) {
      try {
        await api.delete(`/chat/conversations/${conversationId}`);
      } catch {
        toast.error('Chưa xóa được cuộc trò chuyện trên máy chủ. Vui lòng thử lại.');
        return false;
      }
    }

    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== conversationId);
      return remaining;
    });

    setActiveConversationId((current) => {
      if (current === conversationId) {
        const remaining = conversations.filter((c) => c.id !== conversationId);
        return remaining.length > 0 ? remaining[0].id : '';
      }
      return current;
    });

    toast.success('Đã xóa cuộc trò chuyện khỏi danh sách.');
    return true;
  };

  const clearConversationMessages = async (conversationId: string): Promise<boolean> => {
    if (!conversationId) return false;

    if (UUID_REGEX.test(conversationId) && localStorage.getItem('token')) {
      try {
        await api.delete(`/chat/conversations/${conversationId}/messages`);
      } catch {
        toast.error('Chưa xóa được lịch sử tin nhắn trên máy chủ. Vui lòng thử lại.');
        return false;
      }
    }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          messages: [],
          lastMessage: 'Bắt đầu cuộc trò chuyện',
        };
      })
    );

    toast.success('Đã xóa sạch lịch sử tin nhắn.');
    return true;
  };

  const clearAllConversations = () => {
    setConversations([]);
    setActiveConversationId('');
    setActiveProduct(null);
    const scope = authScopeRef.current;
    try {
      localStorage.removeItem(getChatStorageKey(scope));
    } catch {}
    toast.success('Đã xóa lịch sử trò chuyện lưu trên thiết bị này.');
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeConversation) return false;

    if (UUID_REGEX.test(activeConversation.id) && localStorage.getItem('token')) {
      if (!isChatSocketEnabled()) {
        try {
          const scope = getChatStorageScope();
          const result: any = await api.post(`/chat/conversations/${activeConversation.id}/messages`, {
            messageText: content.trim(), messageId: crypto.randomUUID(),
          });
          if (scope !== getChatStorageScope()) return false;
          const message = mapServerMessage(result?.data || result);
          setConversations(prev => prev.map(conv => conv.id === activeConversation.id ? {
            ...conv, lastMessage: message.content, lastTime: message.timestamp,
            messages: conv.messages.some(item => item.id === message.id) ? conv.messages : [...conv.messages, message],
          } : conv));
          return true;
        } catch (error: any) { toast.error(error?.message || 'Tin nhắn chưa được gửi. Vui lòng thử lại.'); return false; }
      }
      const socket = ensureSocket();
      socket.emit('join_conversation', { conversationId: activeConversation.id });
      socket.emit('send_message', { conversationId: activeConversation.id, messageText: content.trim() });
      return true;
    }

    toast.error('Chat chưa kết nối máy chủ. Tin nhắn chưa được gửi đến shop.');
    return false;
  };

  const sendAttachment = async (file: File, type: ChatAttachmentType, caption = '') => {
    if (!localStorage.getItem('token')) throw new Error('Vui lòng đăng nhập để gửi tệp trong chat.');
    if (!activeConversation || !UUID_REGEX.test(activeConversation.id)) {
      throw new Error('Cuộc trò chuyện chưa kết nối với máy chủ. Hãy đóng và mở lại chat của Shop.');
    }

    const formData = new FormData();
    formData.append('file', file);
    const result: any = await api.post(
      `/chat/conversations/${activeConversation.id}/attachments`,
      formData,
      { timeout: 120000, headers: { 'Content-Type': 'multipart/form-data' } },
    );
    const attachment = result?.data || result;
    if (!attachment?.url) throw new Error('Máy chủ chưa trả về đường dẫn tệp đã tải lên.');

    const socket = ensureSocket();
    socket.emit('join_conversation', { conversationId: activeConversation.id });
    socket.emit('send_message', {
      conversationId: activeConversation.id,
      messageText: caption.trim(),
      mediaUrl: attachment.url,
      mediaType: type,
      mediaName: attachment.fileName || file.name,
    });
  };

  const sendProductsInquiry = async (productsToSend: ChatProductInfo[]) => {
    if (!productsToSend || productsToSend.length === 0 || !activeConversation) return false;

    if (!localStorage.getItem('token') || !UUID_REGEX.test(activeConversation.id)) {
      toast.error('Chưa kết nối chat. Sản phẩm chưa được gửi đến shop.');
      return false;
    }

    if (!isChatSocketEnabled()) {
      for (const product of productsToSend) {
        const sent = await sendMessage(JSON.stringify({
          type: 'PRODUCT_INQUIRY', productId: product.id, productTitle: product.title,
          productImage: product.imageUrl, productPrice: product.price, productSku: product.sku,
          message: 'Mình muốn tìm hiểu thêm về sản phẩm này.',
        }));
        if (!sent) return false;
      }
      return true;
    }
    const socket = ensureSocket();
    if (!socket.connected) {
      toast.error('Chat đang kết nối lại. Vui lòng thử gửi sản phẩm sau ít giây.');
      return false;
    }
    socket.emit('join_conversation', { conversationId: activeConversation.id });
    let completed = 0;
    let sent = 0;
    const failures: string[] = [];
    productsToSend.forEach((product) => {
      socket.emit(
        'send_message',
        {
          conversationId: activeConversation.id,
          messageText: JSON.stringify({
            type: 'PRODUCT_INQUIRY',
            productId: product.id,
            message: 'Mình muốn tìm hiểu thêm về sản phẩm này.',
          }),
        },
        (result: { ok?: boolean; message?: string }) => {
          if (result?.ok) {
            sent += 1;
          } else {
            failures.push(result?.message || `Không gửi được ${product.title}.`);
          }
          completed += 1;
          if (completed === productsToSend.length) {
            if (sent === productsToSend.length) {
              toast.success(`Đã gửi ${sent} sản phẩm cho Shop.`);
            } else if (sent > 0) {
              toast.error(`Đã gửi ${sent}/${productsToSend.length} sản phẩm. ${failures[0] || ''}`);
            } else {
              toast.error(failures[0] || 'Không gửi được sản phẩm cho Shop.');
            }
          }
        },
      );
    });
    return true;
  };

  const shareCouponVoucher = (coupon: ChatCouponVoucher) => {
    if (!activeConversation) return false;
    if (!localStorage.getItem('token')) {
      toast.info('Đăng nhập để gửi mã giảm giá trực tiếp cho Shop.');
      return false;
    }
    if (!UUID_REGEX.test(activeConversation.id)) {
      toast.error('Cuộc trò chuyện chưa kết nối máy chủ. Hãy mở lại chat của Shop.');
      return false;
    }

    const socket = ensureSocket();
    if (!socket.connected) {
      toast.error('Chat đang kết nối lại. Vui lòng thử gửi mã sau ít giây.');
      return false;
    }
    socket.emit('join_conversation', { conversationId: activeConversation.id });
    socket.emit(
      'send_message',
      {
        conversationId: activeConversation.id,
        messageText: JSON.stringify({ type: 'COUPON_VOUCHER', couponId: coupon.id }),
      },
      (result: { ok?: boolean; message?: string }) => {
        if (result?.ok) toast.success(`Đã gửi mã ${coupon.code} vào cuộc trò chuyện.`);
        else toast.error(result?.message || 'Không gửi được mã giảm giá.');
      },
    );
    return true;
  };

  return (
    <ScanmsChatContext.Provider
      value={{
        isOpen,
        isMinimized,
        activeConversationId,
        conversations,
        activeProduct,
        activeConversation,
        openChat,
        closeChat,
        toggleMinimize,
        selectConversation,
        sendMessage,
        sendAttachment,
        sendProductsInquiry,
        shareCouponVoucher,
        clearActiveProduct,
        deleteConversation,
        clearConversationMessages,
        clearAllConversations,
      }}
    >
      {children}
    </ScanmsChatContext.Provider>
  );
}

export function useScanmsChat() {
  const context = useContext(ScanmsChatContext);
  // Soft-fallback: tránh ErrorBoundary trắng khi provider chưa mount
  if (!context) {
    return {
      isOpen: false,
      isMinimized: false,
      activeConversationId: '',
      conversations: [],
      activeProduct: null,
      activeConversation: undefined,
      openChat: () => undefined,
      closeChat: () => undefined,
      toggleMinimize: () => undefined,
      selectConversation: () => undefined,
      sendMessage: async () => false,
      sendAttachment: async () => undefined,
      sendProductsInquiry: async () => false,
      shareCouponVoucher: async () => undefined,
      clearActiveProduct: () => undefined,
      deleteConversation: () => undefined,
      clearConversationMessages: () => undefined,
      clearAllConversations: () => undefined,
    } as any;
  }
  return context;
}

// Aliases for clean adoption and backward compatibility
export const useFloatingChat = useScanmsChat;
export const useShopeeChat = useScanmsChat;
export const ShopeeChatProvider = ScanmsChatProvider;
