import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { getChatSocket } from '../services/chat-socket.service';
import type { ChatAttachmentType } from '../types/chat';
import { toast } from '../utils/toast';

export interface ChatProductInfo {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  sku?: string;
  soldCount?: number;
}

export interface ChatStoreInfo {
  id: string;
  name: string;
  logoUrl?: string;
  isVerified?: boolean;
}

export interface ChatCouponVoucher {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minimumOrderAmount: number | null;
  maximumDiscountAmount: number | null;
  remainingUses: number | null;
  expiresAt: string | null;
  scopeType: string;
  products: Array<{ id: string; title: string }>;
  categories: string[];
  storeName: string;
}

export interface ChatExclusiveDeal {
  type: 'EXCLUSIVE_DEAL_PROPOSAL' | 'EXCLUSIVE_DEAL_DECISION';
  proposalId?: string;
  productTitle?: string;
  storeName?: string;
  publicCommissionRate?: number;
  currentCommissionRate?: number | null;
  previousCommissionRate?: number | null;
  isRevision?: boolean;
  message?: string;
  proposedCommissionRate?: number;
  approvedCommissionRate?: number;
  salesCommitment?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  shopResponse?: string | null;
  shortUrl?: string | null;
}

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'shop';
  content: string;
  timestamp: string;
  product?: ChatProductInfo;
  products?: ChatProductInfo[];
  coupon?: ChatCouponVoucher;
  mediaUrl?: string;
  mediaType?: ChatAttachmentType;
  mediaName?: string;
}

export interface ChatConversationItem {
  id: string;
  store: ChatStoreInfo;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  messages: ChatMessageItem[];
}

export interface ScanmsChatContextType {
  isOpen: boolean;
  isMinimized: boolean;
  activeConversationId: string;
  conversations: ChatConversationItem[];
  activeConversation: ChatConversationItem | null;
  activeProduct: ChatProductInfo | null;
  openChat: (store?: ChatStoreInfo, product?: ChatProductInfo) => void;
  closeChat: () => void;
  toggleMinimize: () => void;
  selectConversation: (id: string) => void;
  sendMessage: (content: string) => void;
  sendAttachment: (file: File, type: ChatAttachmentType, caption?: string) => Promise<void>;
  sendProductsInquiry: (products: ChatProductInfo[]) => boolean;
  shareCouponVoucher: (coupon: ChatCouponVoucher) => boolean;
  clearActiveProduct: () => void;
  deleteConversation: (id: string) => Promise<boolean>;
  clearConversationMessages: (id: string) => Promise<boolean>;
  clearAllConversations: () => void;
}

const DEFAULT_CONVERSATIONS: ChatConversationItem[] = [
  {
    id: 'conv-sora-skin',
    store: {
      id: 'a7e7bd20-bebc-44c9-a98b-004de44cf773',
      name: 'Sora Skin Official Store',
      isVerified: true,
    },
    lastMessage: 'Dạ Shop chào bạn! Shop có thể hỗ trợ gì cho bạn về sản phẩm ạ?',
    lastTime: '10:33',
    unreadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'shop',
        content: 'Xin chào! Cảm ơn bạn đã ghé thăm gian hàng chính hãng Sora Skin trên SCANMS. Bạn cần tư vấn về dòng serum hay kem chống nắng nào ạ?',
        timestamp: '10:30',
      },
    ],
  },
];

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

function loadCachedConversations(scope: string): ChatConversationItem[] {
  try {
    const key = getChatStorageKey(scope);
    const legacyKey = `scanms_shopee_chat_conversations:${encodeURIComponent(scope)}`;
    const saved = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    if (!saved) return DEFAULT_CONVERSATIONS;
    const parsed: ChatConversationItem[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) return DEFAULT_CONVERSATIONS;
    const filtered = parsed.filter(
      (c) =>
        c?.store?.name &&
        !c.store.name.toLowerCase().includes('marie.japan') &&
        !c.store.name.toLowerCase().includes('umizoku') &&
        c.id !== 'conv-marie-japan' &&
        c.id !== 'conv-umizoku'
    );
    const deduped = deduplicateConversations(filtered);
    return deduped.length > 0 ? deduped : DEFAULT_CONVERSATIONS;
  } catch {
    return DEFAULT_CONVERSATIONS;
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
    lastTime: last?.createdAt
      ? new Date(last.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '',
    unreadCount: 0,
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

  const ensureSocket = () => {
    const socket = getChatSocket();
    if (socketRef.current !== socket) {
      socket.on('new_message', (raw: any) => {
        const message = mapServerMessage(raw);
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
        setConversations(loadCachedConversations(currentScope));
        setActiveConversationId('conv-sora-skin');
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
            return deduplicateConversations([...mergedMapped, ...prev]);
          });
          if (mapped.length) {
            setActiveConversationId((current) => UUID_REGEX.test(current) ? current : mapped[0].id);
          }
          ensureSocket();
        })
        .catch(() => {});
    };
    reloadConversations();
    window.addEventListener('auth-user-updated', reloadConversations);
    return () => {
      cancelled = true;
      window.removeEventListener('auth-user-updated', reloadConversations);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !UUID_REGEX.test(activeConversationId) || !localStorage.getItem('token')) return;
    let cancelled = false;
    const socket = ensureSocket();
    socket.emit('join_conversation', { conversationId: activeConversationId });
    api.get(`/chat/conversations/${activeConversationId}/messages?take=50`)
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
      })
      .catch((error: any) => toast.error(error?.message || 'Không tải được lịch sử chat.'));
    return () => {
      cancelled = true;
      socket.emit('leave_conversation', { conversationId: activeConversationId });
    };
  }, [activeConversationId, isOpen]);

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
          messages: [
            {
              id: `m-init-${Date.now()}`,
              sender: 'shop',
              content: `Kính chào quý khách! Gian hàng ${cleanStore.name} đã sẵn sàng tư vấn. Bạn có câu hỏi nào về sản phẩm hoặc chính sách bảo hành không ạ?`,
              timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            },
          ],
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
        } catch {
          // Local conversation remains active if network is offline
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
      } catch (err: any) {
        console.warn('Backend delete conversation failed, proceeding with local removal:', err);
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
      } catch (err: any) {
        console.warn('Backend clear messages failed:', err);
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
    toast.success('Đã xóa toàn bộ lịch sử các cuộc trò chuyện.');
  };

  const sendMessage = (content: string) => {
    if (!content.trim() || !activeConversation) return;

    if (UUID_REGEX.test(activeConversation.id) && localStorage.getItem('token')) {
      const socket = ensureSocket();
      socket.emit('join_conversation', { conversationId: activeConversation.id });
      socket.emit('send_message', { conversationId: activeConversation.id, messageText: content.trim() });
      return;
    }

    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: content.trim(),
      timestamp: timeStr,
      product: activeProduct || undefined,
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeConversationId) return conv;
        return {
          ...conv,
          lastMessage: userMsg.content,
          lastTime: timeStr,
          messages: [...conv.messages, userMsg],
        };
      })
    );

    const currentStoreName = activeConversation.store.name;
    setTimeout(() => {
      const replies = [
        `Dạ ${currentStoreName} xin chào bạn! Shop đã ghi nhận tin nhắn: "${content.trim()}". Shop sẽ kiểm tra và phản hồi kỹ hơn cho bạn ngay nhé!`,
        `Dạ sản phẩm chính hãng 100% được bảo hành đổi trả trong 14 ngày ạ. Bạn cần Shop hướng dẫn cách đặt mã giảm giá không ạ?`,
        `Dạ hàng có sẵn tại kho và đóng gói bàn giao đơn vị vận chuyển ngay trong ngày hôm nay bạn nhé!`,
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const shopMsg: ChatMessageItem = {
        id: `msg-shop-${Date.now()}`,
        sender: 'shop',
        content: randomReply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== activeConversationId) return conv;
          return {
            ...conv,
            lastMessage: shopMsg.content,
            lastTime: shopMsg.timestamp,
            messages: [...conv.messages, shopMsg],
          };
        })
      );
    }, 1200);
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

  const sendProductsInquiry = (productsToSend: ChatProductInfo[]) => {
    if (!productsToSend || productsToSend.length === 0 || !activeConversation) return false;

    // Guest / Offline fallback: Append product card locally into chat history
    if (!localStorage.getItem('token') || !UUID_REGEX.test(activeConversation.id)) {
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const userMsg: ChatMessageItem = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        content: `Khách đang quan tâm sản phẩm này.`,
        timestamp: timeStr,
        products: productsToSend,
        product: productsToSend[0],
      };
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== activeConversationId) return conv;
          return {
            ...conv,
            lastMessage: `[Sản phẩm] ${productsToSend[0].title}`,
            lastTime: timeStr,
            messages: [...conv.messages, userMsg],
          };
        })
      );
      toast.success(`Đã gửi ${productsToSend.length} sản phẩm vào cuộc trò chuyện.`);
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
  if (!context) {
    throw new Error('useScanmsChat must be used within a ScanmsChatProvider');
  }
  return context;
}

// Aliases for clean adoption and backward compatibility
export const useFloatingChat = useScanmsChat;
export const useShopeeChat = useScanmsChat;
export const ShopeeChatProvider = ScanmsChatProvider;
