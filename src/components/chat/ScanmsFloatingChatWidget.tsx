import { lazy, Suspense, useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { Categories as EmojiCategory, PickerProps, EmojiClickData } from 'emoji-picker-react';
import {
  X,
  Maximize2,
  Send,
  Smile,
  Image as ImageIcon,
  Video,
  Ticket,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useScanmsChat, isUnsafeShopLogo, parseExclusiveDealMessage, type ChatCouponVoucher, type ChatExclusiveDeal } from '../../context/ScanmsChatContext';
import { toast } from '../../utils/toast';
import api from '../../services/api';
import { couponService, type PublicStoreCoupon } from '../../services/coupon.service';
import { authService, type UserProfile } from '../../services/auth.service';
import { getSafeProductImageUrl } from '../../features/marketplace/marketplaceUtils';
import type { ChatAttachmentType } from '../../types/chat';

const EmojiPicker = lazy(() => import('emoji-picker-react'));
const emojiCategories: NonNullable<PickerProps['categories']> = [
  { category: 'suggested' as EmojiCategory, name: 'Gần đây' },
  { category: 'smileys_people' as EmojiCategory, name: 'Mặt cười & người' },
  { category: 'animals_nature' as EmojiCategory, name: 'Động vật & thiên nhiên' },
  { category: 'food_drink' as EmojiCategory, name: 'Đồ ăn & thức uống' },
  { category: 'travel_places' as EmojiCategory, name: 'Du lịch & địa điểm' },
  { category: 'activities' as EmojiCategory, name: 'Hoạt động' },
  { category: 'objects' as EmojiCategory, name: 'Đồ vật' },
  { category: 'symbols' as EmojiCategory, name: 'Ký hiệu' },
  { category: 'flags' as EmojiCategory, name: 'Cờ' },
];

async function fetchProductsForStore(storeId: string) {
  const result: any = await api.get('/public/products', {
    params: { storeId, page: 1, limit: 48 },
  });
  const payload = result?.data?.data ?? result?.data ?? result;
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.data)
        ? payload.data
        : [];
  return items;
}

function ExclusiveDealMessageBubble({
  card,
  isMine,
  isShop,
  timestamp,
}: {
  card: ChatExclusiveDeal;
  isMine: boolean;
  isShop: boolean;
  timestamp: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<ChatExclusiveDeal['status']>(card.status || 'PENDING');
  const [shortUrl, setShortUrl] = useState(card.shortUrl || null);
  const [error, setError] = useState('');
  const isDecision = card.type === 'EXCLUSIVE_DEAL_DECISION';
  const canReview = isShop && !isMine && !isDecision && status === 'PENDING';

  const decide = async (approve: boolean) => {
    if (!card.proposalId || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const response: any = await api.patch(
        `/affiliate-deals/${card.proposalId}/${approve ? 'approve' : 'reject'}`,
        approve ? {} : { reason: '' },
      );
      const result = response?.data?.data || response?.data || response;
      setStatus(approve ? 'APPROVED' : 'REJECTED');
      if (result?.shortUrl) setShortUrl(result.shortUrl);
      toast.success(approve ? 'Đã duyệt deal và tạo link VIP.' : 'Đã từ chối đề xuất deal.');
    } catch (actionError: any) {
      setError(actionError?.response?.data?.message || 'Không thể xử lý đề xuất lúc này.');
    } finally {
      setIsLoading(false);
    }
  };

  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';

  return (
    <div className={`my-2 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <article className="w-full max-w-[340px] rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-3.5 text-[#1A1612] shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EEDFC6] bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#B88E4F]">
            <Sparkles className="h-3.5 w-3.5" /> EXCLUSIVE DEAL
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isApproved ? 'bg-white text-[#B88E4F]' : isRejected ? 'bg-rose-50 text-rose-700' : 'bg-[#F3EFE6] text-[#7D715E]'}`}>
            {isApproved ? 'Đã duyệt' : isRejected ? 'Đã từ chối' : 'Chờ Shop duyệt'}
          </span>
        </div>
        <div className="mt-3">
          <div className="text-sm font-extrabold">{card.productTitle || 'Sản phẩm'}</div>
          {card.storeName && <div className="mt-0.5 text-[11px] text-[#7D715E]">Shop: {card.storeName}</div>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-[#EAE4D7] bg-white p-2.5">
            Hoa hồng sàn<strong className="mt-1 block text-sm">{card.publicCommissionRate ?? '—'}%</strong>
          </div>
          <div className="rounded-lg border border-[#EEDFC6] bg-white p-2.5">
            Hoa hồng độc quyền<strong className="mt-1 block text-sm text-[#B88E4F]">{card.approvedCommissionRate ?? card.proposedCommissionRate ?? '—'}%</strong>
          </div>
        </div>
        {card.isRevision && card.currentCommissionRate != null && (
          <div className="mt-2 rounded-lg border border-[#EEDFC6] bg-white p-2.5 text-xs">
            Hoa hồng độc quyền đang áp dụng<strong className="mt-1 block text-sm text-[#B88E4F]">{card.currentCommissionRate}%</strong>
          </div>
        )}
        {isMine && status === 'PENDING' && card.isRevision && (
          <p className="mt-2 text-[11px] leading-relaxed text-[#7D715E]">Mức hoa hồng độc quyền hiện tại vẫn áp dụng trong lúc Shop xem xét đề xuất mới.</p>
        )}
        {!isMine && status === 'PENDING' && card.isRevision && (
          <p className="mt-2 text-[11px] leading-relaxed text-[#7D715E]">Đề xuất điều chỉnh hoa hồng độc quyền. Nếu duyệt, mức mới áp dụng cho đơn hàng mới; đơn đã tạo giữ nguyên mức cũ.</p>
        )}
        {isDecision && card.message && <p className="mt-2 text-xs leading-relaxed text-[#7D715E]">{card.message}</p>}
        {card.salesCommitment && (
          <div className="mt-3 rounded-lg border border-[#EAE4D7] bg-white p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#7D715E]">Cam kết doanh số</div>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">{card.salesCommitment}</p>
          </div>
        )}
        {card.shopResponse && <p className="mt-2 text-xs text-[#7D715E]">Phản hồi Shop: {card.shopResponse}</p>}
        {error && <p role="alert" className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}
        {isApproved && shortUrl && (
          <div className="mt-3 flex items-center gap-2">
            <a href={shortUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 break-all text-xs font-bold text-[#B88E4F] underline">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" /> Link tiếp thị độc quyền
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(shortUrl);
                toast.success('Đã sao chép link tiếp thị độc quyền!');
              }}
              className="p-1 rounded text-[#7D715E] hover:text-[#B88E4F] hover:bg-white border border-[#EAE4D7] cursor-pointer"
              title="Sao chép link tiếp thị"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        )}
        {canReview && (
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={isLoading} onClick={() => void decide(false)} className="flex-1 rounded-lg border border-[#EAE4D7] bg-white px-2 py-2 text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6] disabled:opacity-50">
              Từ chối
            </button>
            <button type="button" disabled={isLoading} onClick={() => void decide(true)} className="flex-1 rounded-lg bg-[#C59B58] px-2 py-2 text-xs font-bold text-white hover:bg-[#B88E4F] disabled:opacity-50">
              {isLoading ? 'Đang xử lý...' : card.isRevision ? 'Duyệt đổi deal' : 'Duyệt & tạo link'}
            </button>
          </div>
        )}
        {isMine && status === 'PENDING' && <div className="mt-3 text-center text-[11px] font-semibold text-[#7D715E]">Đã gửi Shop · Đang chờ phản hồi</div>}
        <div className="mt-2 text-right text-[10px] text-[#7D715E]">{timestamp}</div>
      </article>
    </div>
  );
}

function currentUserIsShopManager() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')?.role === 'SHOP_MANAGER';
  } catch {
    return false;
  }
}

function currentUserCanSeeAffiliateDeals() {
  try {
    const role = JSON.parse(localStorage.getItem('user') || 'null')?.role;
    return role === 'SHOP_MANAGER' || role === 'COLLABORATOR';
  } catch {
    return false;
  }
}

export function ScanmsFloatingChatWidget() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());

  useEffect(() => {
    const syncUser = () => setCurrentUser(authService.getCurrentUser());
    window.addEventListener('storage', syncUser);
    window.addEventListener('auth-user-updated', syncUser);
    window.addEventListener('scanms_auth_changed', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('auth-user-updated', syncUser);
      window.removeEventListener('scanms_auth_changed', syncUser);
    };
  }, []);

  const isAuthRoute =
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/forgot-password') ||
    location.pathname.startsWith('/reset-password');

  const isAuthenticated = Boolean(currentUser && localStorage.getItem('token'));

  const isLiveRoute = location.pathname.startsWith('/live');

  // Draggable launcher pill state
  const [launcherPos, setLauncherPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('scanms_chat_launcher_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isDraggingLauncher, setIsDraggingLauncher] = useState(false);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialLeft: number;
    initialTop: number;
    moved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    moved: false,
  });

  // Clamp launcher inside viewport if window resizes
  useEffect(() => {
    const handleResize = () => {
      setLauncherPos((prev) => {
        if (!prev) return null;
        const width = launcherRef.current?.offsetWidth || 120;
        const height = launcherRef.current?.offsetHeight || 44;
        const maxX = Math.max(8, window.innerWidth - width - 8);
        const maxY = Math.max(8, window.innerHeight - height - 8);
        if (maxX <= 8 || maxY <= 8) return prev;
        const clampedX = Math.max(8, Math.min(maxX, prev.x));
        const clampedY = Math.max(8, Math.min(maxY, prev.y));
        if (clampedX !== prev.x || clampedY !== prev.y) {
          const next = { x: clampedX, y: clampedY };
          try {
            localStorage.setItem('scanms_chat_launcher_pos', JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLauncherPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleLauncherPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.buttons === 0 && !isDraggingLauncher) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (!dragStartRef.current.moved && Math.hypot(dx, dy) > 4) {
      dragStartRef.current.moved = true;
      setIsDraggingLauncher(true);
    }
    if (dragStartRef.current.moved) {
      const width = launcherRef.current?.offsetWidth || 120;
      const height = launcherRef.current?.offsetHeight || 44;
      const maxX = Math.max(8, window.innerWidth - width - 8);
      const maxY = Math.max(8, window.innerHeight - height - 8);
      const nextX = Math.max(8, Math.min(maxX, dragStartRef.current.initialLeft + dx));
      const nextY = Math.max(8, Math.min(maxY, dragStartRef.current.initialTop + dy));
      setLauncherPos({ x: nextX, y: nextY });
    }
  };

  const handleLauncherPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (dragStartRef.current.moved) {
      const width = launcherRef.current?.offsetWidth || 120;
      const height = launcherRef.current?.offsetHeight || 44;
      const maxX = Math.max(8, window.innerWidth - width - 8);
      const maxY = Math.max(8, window.innerHeight - height - 8);
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      const finalX = Math.max(8, Math.min(maxX, dragStartRef.current.initialLeft + dx));
      const finalY = Math.max(8, Math.min(maxY, dragStartRef.current.initialTop + dy));
      const finalPos = { x: finalX, y: finalY };
      setLauncherPos(finalPos);
      try {
        localStorage.setItem('scanms_chat_launcher_pos', JSON.stringify(finalPos));
      } catch {}
    } else {
      openChat();
    }
    setIsDraggingLauncher(false);
  };

  const handleLauncherPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDraggingLauncher(false);
  };

  const isMerchantOrChatRoute =
    location.pathname.startsWith('/merchant') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/collaborator/shop-collaboration') ||
    location.pathname.startsWith('/chat');

  const {
    isOpen,
    isMinimized,
    activeConversation,
    conversations,
    activeProduct,
    closeChat,
    toggleMinimize,
    selectConversation,
    sendMessage,
    sendAttachment,
    sendProductsInquiry,
    shareCouponVoucher,
    clearActiveProduct,
    openChat,
    deleteConversation,
    clearConversationMessages,
    clearAllConversations,
  } = useScanmsChat();

  const [inputText, setInputText] = useState('');
  const [conversationToDelete, setConversationToDelete] = useState<any | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [isClearMessagesModalOpen, setIsClearMessagesModalOpen] = useState(false);
  const [isClearingMessages, setIsClearingMessages] = useState(false);
  const [isClearAllConversationsModalOpen, setIsClearAllConversationsModalOpen] = useState(false);

  const handleConfirmDeleteConversation = async () => {
    if (!conversationToDelete) return;
    setIsDeletingConversation(true);
    try {
      await deleteConversation(conversationToDelete.id);
      setConversationToDelete(null);
    } finally {
      setIsDeletingConversation(false);
    }
  };

  const handleConfirmClearMessages = async () => {
    if (!activeConversation) return;
    setIsClearingMessages(true);
    try {
      await clearConversationMessages(activeConversation.id);
      setIsClearMessagesModalOpen(false);
    } finally {
      setIsClearingMessages(false);
    }
  };

  const handleConfirmClearAll = () => {
    clearAllConversations();
    setIsClearAllConversationsModalOpen(false);
  };

  useEffect(() => {
    if (isOpen && (isAuthRoute || !isAuthenticated)) {
      closeChat();
    }
  }, [isOpen, isAuthRoute, isAuthenticated, closeChat]);
  const [searchLeftQuery, setSearchLeftQuery] = useState('');
  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [isLoadingShopProducts, setIsLoadingShopProducts] = useState(false);
  const [shopProductLoadError, setShopProductLoadError] = useState('');
  const [isCouponPickerOpen, setIsCouponPickerOpen] = useState(false);
  const [isLoadingShopCoupons, setIsLoadingShopCoupons] = useState(false);
  const [shopCoupons, setShopCoupons] = useState<PublicStoreCoupon[]>([]);
  const [shopCouponLoadError, setShopCouponLoadError] = useState('');
  const [copiedCouponId, setCopiedCouponId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // Only load real, active products belonging to the currently selected shop.
  useEffect(() => {
    const storeId = activeConversation?.store.id;
    let isCurrent = true;
    setStoreProducts([]);
    setShopProductLoadError('');
    if (!storeId) {
      setIsLoadingShopProducts(false);
      return;
    }

    setIsLoadingShopProducts(true);
    fetchProductsForStore(storeId)
      .then((items) => {
        if (isCurrent) setStoreProducts(items);
      })
      .catch((error: any) => {
        if (isCurrent) {
          setShopProductLoadError(error?.message || 'Không tải được sản phẩm của Shop.');
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoadingShopProducts(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [activeConversation?.store.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text && !activeProduct) return;

    if (activeProduct) {
      sendProductsInquiry([activeProduct]);
      clearActiveProduct();
    }

    if (text) {
      sendMessage(text);
      setInputText('');
    }
  };

  const handleSendActiveProduct = () => {
    if (!activeProduct) return;
    sendProductsInquiry([activeProduct]);
    clearActiveProduct();
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setInputText(suggestion);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && isEmojiPickerOpen) {
      e.preventDefault();
      setIsEmojiPickerOpen(false);
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? inputText.length;
    const end = textarea?.selectionEnd ?? inputText.length;
    const nextText = `${inputText.slice(0, start)}${emoji}${inputText.slice(end)}`;
    const nextCaret = start + emoji.length;

    setInputText(nextText);
    setIsEmojiPickerOpen(false);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  useEffect(() => {
    if (!isEmojiPickerOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!emojiPickerRef.current?.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsEmojiPickerOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isEmojiPickerOpen]);

  const handleAttachmentChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: ChatAttachmentType,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const validImage = type === 'IMAGE' && ['png', 'jpg', 'jpeg'].includes(extension);
    const validVideo = type === 'VIDEO' && ['mp4', 'mov', 'webm'].includes(extension);
    const validDocument = type === 'DOCUMENT' && ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'].includes(extension);
    if (!validImage && !validVideo && !validDocument) {
      toast.error(type === 'IMAGE'
        ? 'Ảnh phải có định dạng PNG hoặc JPG.'
        : type === 'VIDEO'
          ? 'Video phải có định dạng MP4, MOV hoặc WEBM.'
          : 'Tài liệu hỗ trợ PDF, Office, TXT hoặc CSV.');
      return;
    }

    const maxBytes = type === 'IMAGE' ? 5 * 1024 * 1024 : type === 'VIDEO' ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(type === 'IMAGE' ? 'Ảnh chat tối đa 5 MB.' : type === 'VIDEO' ? 'Video chat tối đa 50 MB.' : 'Tài liệu chat tối đa 20 MB.');
      return;
    }

    setIsUploadingAttachment(true);
    try {
      await sendAttachment(file, type, inputText);
      setInputText('');
      toast.success('Đã gửi tệp vào cuộc trò chuyện.');
    } catch (error: any) {
      toast.error(error?.message || 'Không thể gửi tệp. Vui lòng thử lại.');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const isShopManager = currentUserIsShopManager();
  const canSeeAffiliateDeals = currentUserCanSeeAffiliateDeals();
  const visibleMessages = useMemo(() => {
    const messages = activeConversation?.messages || [];
    return canSeeAffiliateDeals
      ? messages
      : messages.filter((message) => !parseExclusiveDealMessage(message.content));
  }, [activeConversation?.messages, canSeeAffiliateDeals]);

  // Filter conversations in left list
  const filteredConversations = conversations.filter((c) =>
    c.store.name.toLowerCase().includes(searchLeftQuery.toLowerCase())
  );

  // The API is already store-scoped; keep an exact store ID guard and never
  // substitute demo products or fabricated sales/discount figures.
  const currentShopProducts = useMemo(() => {
    if (!activeConversation) return [];
    const storeId = activeConversation.store.id;
    return storeProducts
      .filter((p: any) => (p.storeId || p.store?.id) === storeId)
      .map((p: any) => ({
      id: p.id,
      title: p.title || p.name,
      price: Number(p.price || 0),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      imageUrl: p.imageUrl || p.mediaAssets?.[0]?.urlOrContent || undefined,
      sku: p.sku || undefined,
    }));
  }, [activeConversation, storeProducts]);

  // Filter products by search query
  const filteredShopProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return currentShopProducts;
    return currentShopProducts.filter((p) =>
      p.title.toLowerCase().includes(productSearchQuery.toLowerCase())
    );
  }, [currentShopProducts, productSearchQuery]);

  const openProductPicker = () => {
    setSelectedProductIds([]);
    setProductSearchQuery('');
    setIsProductSelectOpen(true);
  };

  const retryLoadShopProducts = async () => {
    const storeId = activeConversation?.store.id;
    if (!storeId) return;
    setIsLoadingShopProducts(true);
    setShopProductLoadError('');
    try {
      setStoreProducts(await fetchProductsForStore(storeId));
    } catch (error: any) {
      setShopProductLoadError(error?.message || 'Không tải được sản phẩm của Shop.');
    } finally {
      setIsLoadingShopProducts(false);
    }
  };

  const openCouponPicker = async () => {
    const storeId = activeConversation?.store.id;
    if (!storeId) {
      toast.error('Chưa xác định được gian hàng trong cuộc trò chuyện.');
      return;
    }
    setIsCouponPickerOpen(true);
    setIsLoadingShopCoupons(true);
    setShopCouponLoadError('');
    try {
      setShopCoupons(await couponService.getPublicStoreCoupons(storeId));
    } catch (error: any) {
      setShopCouponLoadError(error?.message || 'Không tải được mã giảm giá của Shop.');
    } finally {
      setIsLoadingShopCoupons(false);
    }
  };

  const handleShareCoupon = (coupon: PublicStoreCoupon) => {
    const voucher: ChatCouponVoucher = {
      ...coupon,
      products: coupon.products || [],
      categories: coupon.categories || [],
    };
    if (shareCouponVoucher(voucher)) setIsCouponPickerOpen(false);
  };

  const handleCopyCoupon = async (coupon: ChatCouponVoucher) => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedCouponId(coupon.id);
      window.setTimeout(() => setCopiedCouponId(''), 1800);
    } catch {
      toast.error('Không thể sao chép mã trên thiết bị này.');
    }
  };

  // Toggle product selection in checkbox list
  const toggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Send a single product immediately when clicking "Gửi" on a row
  const handleSendSingleProduct = (prod: any) => {
    const sent = sendProductsInquiry([
      {
        id: prod.id,
        title: prod.title,
        price: prod.price,
        originalPrice: prod.originalPrice,
        imageUrl: prod.imageUrl,
        sku: prod.sku,
      },
    ]);
    if (!sent) return;
    setIsProductSelectOpen(false);
    setSelectedProductIds([]);
  };

  // Send all selected products when clicking "Gửi" at bottom bar
  const handleSendSelectedProducts = () => {
    const selectedProds = currentShopProducts.filter((p) => selectedProductIds.includes(p.id));
    if (selectedProds.length === 0) return;
    const sent = sendProductsInquiry(
      selectedProds.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        originalPrice: p.originalPrice,
        imageUrl: p.imageUrl,
        sku: p.sku,
      }))
    );
    if (!sent) return;
    setIsProductSelectOpen(false);
    setSelectedProductIds([]);
  };

  // Completely hide the floating widget on auth pages, when unauthenticated, or on merchant/admin/dedicated chat pages
  if (isAuthRoute || !isAuthenticated || isMerchantOrChatRoute) {
    return null;
  }

  // If chat is completely closed, show floating launcher pill (SCANMS Brand Gold style)
  // Supports click to open, drag and drop to move anywhere on screen, and remembers position
  if (!isOpen) {
    const isCustomPositioned = launcherPos !== null;
    return (
      <button
        ref={launcherRef}
        type="button"
        onPointerDown={handleLauncherPointerDown}
        onPointerMove={handleLauncherPointerMove}
        onPointerUp={handleLauncherPointerUp}
        onPointerCancel={handleLauncherPointerCancel}
        onContextMenu={(e) => {
          e.preventDefault();
          localStorage.removeItem('scanms_chat_launcher_pos');
          setLauncherPos(null);
          toast.info('Đã đặt lại vị trí nút Chat về góc phải');
        }}
        style={
          isCustomPositioned
            ? {
                left: `${launcherPos.x}px`,
                top: `${launcherPos.y}px`,
                right: 'auto',
                bottom: 'auto',
              }
            : undefined
        }
        className={`fixed z-40 px-3.5 py-2.5 bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-white rounded-full border-2 border-[#FAF8F5] select-none group touch-none ${
          isCustomPositioned
            ? ''
            : isLiveRoute
              ? 'bottom-20 right-4'
              : 'bottom-4 right-4'
        } ${
          isDraggingLauncher
            ? 'cursor-grabbing shadow-2xl scale-105 transition-none'
            : 'cursor-grab shadow-xl shadow-[#C59B58]/25 transition-all duration-200 active:scale-95'
        }`}
        title="Bấm để mở Chat • Giữ & kéo để di chuyển vị trí bất kỳ (Chuột phải để về mặc định)"
        aria-label="Chat"
      >
        <div className="flex items-center gap-1.5 pointer-events-none">
          <GripVertical className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors shrink-0" />
          <div className="relative">
            <svg viewBox="0 0 16 16" className="w-4.5 h-4.5 fill-current">
              <path d="M14 1H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2v3.5L8.5 12H14a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm-3 7.5a4.5 4.5 0 0 1-6 0 .5.5 0 0 1 .7-.7 3.5 3.5 0 0 0 4.6 0 .5.5 0 0 1 .7.7z" />
            </svg>
            {totalUnread > 0 && (
              <span className="absolute -top-2 -right-2.5 w-4 h-4 bg-[#DC2626] text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                {totalUnread}
              </span>
            )}
          </div>
          <span className="font-bold text-xs tracking-wide">Chat {totalUnread > 0 ? `(${totalUnread})` : ''}</span>
        </div>
      </button>
    );
  }

  // Minimized Bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 sm:right-6 z-50 w-72 bg-white rounded-t-xl shadow-2xl border border-[#EAE4D7] flex items-center justify-between px-3.5 py-2.5 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-[#EEDFC6] text-[#B88E4F] flex items-center justify-center font-black text-[11px] shrink-0 border border-[#EAE4D7] overflow-hidden select-none">
            {activeConversation?.store.logoUrl && !isUnsafeShopLogo(activeConversation.store.logoUrl) ? (
              <img
                src={activeConversation.store.logoUrl}
                alt={activeConversation.store.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span>{activeConversation?.store.name ? activeConversation.store.name.charAt(0).toUpperCase() : 'S'}</span>
            )}
          </div>
          <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shrink-0" />
          <strong className="text-xs font-bold text-[#1A1612] truncate">
            {activeConversation?.store.name || 'Chat với Shop'}
          </strong>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleMinimize}
            className="p-1 text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] rounded transition cursor-pointer"
            title="Mở rộng khung chat"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={closeChat}
            className="p-1 text-[#7D715E] hover:text-[#DC2626] hover:bg-[#F3EFE6] rounded transition cursor-pointer"
            title="Đóng chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // SCANMS 2-COLUMN CHAT WINDOW: FULL 2-COLUMN CHAT WINDOW (w-[690px] on desktop)
  return (
    <>
      {isCouponPickerOpen && (
        <div
          className="fixed inset-0 z-[110] flex animate-in fade-in-50 items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
          onClick={() => setIsCouponPickerOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-coupon-picker-title"
            className="flex h-[min(560px,88vh)] w-[480px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white text-left shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-[#EAE4D7] px-4 py-3">
              <div>
                <h3 id="chat-coupon-picker-title" className="m-0 text-base font-bold text-[#1A1612]">Mã giảm giá của Shop</h3>
                <p className="m-0 mt-0.5 text-xs text-[#7D715E]">Chọn ưu đãi còn hiệu lực để gửi vào cuộc trò chuyện.</p>
              </div>
              <button type="button" aria-label="Đóng danh sách mã giảm giá" onClick={() => setIsCouponPickerOpen(false)} className="rounded-lg p-2 text-[#7D715E] hover:bg-[#F3EFE6]">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#FAF8F5] p-4">
              {isLoadingShopCoupons ? (
                <div className="py-14 text-center text-sm text-[#7D715E]">Đang tìm ưu đãi của Shop…</div>
              ) : shopCouponLoadError ? (
                <div className="py-14 text-center text-sm text-[#7D715E]">
                  <p className="mb-3">{shopCouponLoadError}</p>
                  <button type="button" onClick={() => void openCouponPicker()} className="rounded-lg bg-[#C59B58] px-3 py-2 text-xs font-bold text-white hover:bg-[#B88E4F]">Tải lại</button>
                </div>
              ) : shopCoupons.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#EAE4D7] bg-white px-5 py-12 text-center">
                  <Ticket className="mx-auto h-8 w-8 text-[#C59B58]" />
                  <p className="mb-1 mt-3 text-sm font-semibold text-[#1A1612]">Shop chưa có mã giảm giá còn hiệu lực</p>
                  <p className="m-0 text-xs leading-relaxed text-[#7D715E]">Các mã hết hạn hoặc hết lượt sử dụng đã được ẩn khỏi danh sách.</p>
                </div>
              ) : (
                shopCoupons.map((coupon) => (
                  <article key={coupon.id} className="rounded-xl border border-[#EEDFC6] bg-white p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FBF5EB] text-[#B88E4F]">
                          <Ticket className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="font-mono text-sm font-extrabold tracking-wide text-[#B88E4F]">{coupon.code}</div>
                          <div className="mt-0.5 text-sm font-bold text-[#1A1612]">
                            Giảm {coupon.discountType === 'PERCENTAGE'
                              ? `${coupon.discountValue}%`
                              : `${coupon.discountValue.toLocaleString('vi-VN')}₫`}
                            {coupon.discountType === 'PERCENTAGE' && coupon.maximumDiscountAmount
                              ? ` · tối đa ${coupon.maximumDiscountAmount.toLocaleString('vi-VN')}₫`
                              : ''}
                          </div>
                        </div>
                      </div>
                      <button type="button" onClick={() => handleShareCoupon(coupon)} className="shrink-0 rounded-lg bg-[#C59B58] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#B88E4F]">
                        Gửi mã
                      </button>
                    </div>
                    <div className="mt-3 space-y-1 border-t border-[#F3EFE6] pt-2 text-[11px] leading-relaxed text-[#7D715E]">
                      {coupon.minimumOrderAmount ? <div>Đơn tối thiểu {coupon.minimumOrderAmount.toLocaleString('vi-VN')}₫</div> : null}
                      {coupon.scopeType === 'PRODUCTS' && <div>Áp dụng cho {coupon.products.length} sản phẩm được chọn</div>}
                      {coupon.scopeType === 'CATEGORIES' && <div>Áp dụng cho: {coupon.categories.join(', ') || 'danh mục được chọn'}</div>}
                      {coupon.expiresAt && <div>Hạn dùng đến {new Date(coupon.expiresAt).toLocaleDateString('vi-VN')}</div>}
                      {coupon.remainingUses !== null && <div>Còn {coupon.remainingUses} lượt sử dụng</div>}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL "CHỌN SẢN PHẨM" CHUẨN SCANMS ẢNH 1 & ẢNH 3 (POPUP CHÍNH GIỮA MÀN HÌNH) */}
      {/* ========================================================================= */}
      {isProductSelectOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4 animate-in fade-in-50 duration-150"
          onClick={() => {
            setIsProductSelectOpen(false);
            setSelectedProductIds([]);
          }}
        >
          <div
            className="w-[500px] max-w-[95vw] h-[540px] max-h-[88vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-[#EAE4D7] animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Chọn sản phẩm + Close ✕ */}
            <div className="h-12 px-4 border-b border-[#F0ECE1] flex items-center justify-between bg-white shrink-0">
              <h3 className="m-0 text-sm sm:text-base font-semibold text-[#1A1612]">Chọn sản phẩm</h3>
              <button
                type="button"
                onClick={() => {
                  setIsProductSelectOpen(false);
                  setSelectedProductIds([]);
                }}
                className="p-1 text-[#757575] hover:text-[#1A1612] rounded transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input Box: Tìm tên sản phẩm 🔍 */}
            <div className="p-3 border-b border-[#F0ECE1] bg-white shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Tìm tên sản phẩm"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 bg-white border border-[#EAE4D7] rounded text-xs text-[#1A1612] placeholder:text-[#999999] focus:outline-hidden focus:border-[#ee4d2d]"
                />
                <Search className="w-4 h-4 text-[#999999] absolute right-3 pointer-events-none" />
              </div>
            </div>

            {/* Scrollable Products List (Chuẩn Ảnh 1 & Ảnh 3) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {isLoadingShopProducts ? (
                <div className="py-12 text-center text-xs text-[#7D715E]">Đang tải sản phẩm của Shop…</div>
              ) : shopProductLoadError ? (
                <div className="py-12 text-center text-xs text-[#7D715E]">
                  <p className="mb-3">{shopProductLoadError}</p>
                  <button type="button" onClick={() => void retryLoadShopProducts()} className="rounded-lg bg-[#C59B58] px-3 py-2 font-semibold text-white hover:bg-[#B88E4F]">Thử tải lại</button>
                </div>
              ) : currentShopProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7D715E]">Shop hiện chưa có sản phẩm đang kinh doanh để chia sẻ.</div>
              ) : filteredShopProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7D715E]">Không tìm thấy sản phẩm phù hợp.</div>
              ) : (
                filteredShopProducts.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelectProduct(p.id)}
                      className={`p-2.5 bg-white border rounded-lg transition flex items-center justify-between gap-3 cursor-pointer group ${
                        isChecked ? 'border-[#ee4d2d] bg-[#FFF5F1]/30 shadow-xs' : 'border-[#EAE4D7] hover:border-[#D5CBB8]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Checkbox (Ảnh 1 & 3) */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by row click
                          className="w-4 h-4 rounded border-gray-300 accent-[#ee4d2d] text-[#ee4d2d] focus:ring-0 cursor-pointer shrink-0"
                        />

                        {/* Thumbnail */}
                        <img
                          src={getSafeProductImageUrl(p.imageUrl, p.title)}
                          alt={p.title}
                          className="w-13 h-13 rounded-xs object-cover border border-[#EAE4D7] shrink-0 bg-white"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (!target.dataset.hasFallback) {
                              target.dataset.hasFallback = 'true';
                              target.src = getSafeProductImageUrl(null, p.title);
                            }
                          }}
                        />

                        {/* Title & Prices */}
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-xs font-normal text-[#1A1612] line-clamp-2 leading-snug group-hover:text-[#ee4d2d] transition-colors"
                            title={p.title}
                          >
                            {p.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[11px] text-[#888888] line-through">
                                {p.originalPrice.toLocaleString('vi-VN')}₫
                              </span>
                            )}
                            <span className="text-xs font-bold text-[#ee4d2d]">
                              {p.price.toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nút Gửi riêng từng dòng (Ảnh 1 & 3) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendSingleProduct(p);
                        }}
                        className="px-3.5 py-1.5 bg-[#ee4d2d] hover:bg-[#d03e1e] text-white text-xs font-bold rounded-[3px] shadow-xs shrink-0 cursor-pointer transition active:scale-95"
                      >
                        Gửi
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Action Footer khi có sản phẩm được tick chọn (Ảnh 3) */}
            {selectedProductIds.length > 0 && (
              <div className="px-4 py-2.5 border-t border-[#F0ECE1] bg-white flex items-center justify-between shrink-0 shadow-lg">
                <div className="text-xs text-[#555]">
                  <span className="text-[#ee4d2d] font-bold">{selectedProductIds.length}/{currentShopProducts.length}</span> sản phẩm đã chọn
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProductIds([])}
                    className="px-4 py-1.5 border border-[#D9D9D9] hover:bg-gray-50 text-xs font-medium text-[#555] rounded-[3px] transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSendSelectedProducts}
                    className="px-5 py-1.5 bg-[#ee4d2d] hover:bg-[#d03e1e] text-white text-xs font-bold rounded-[3px] shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 right-2 sm:right-6 z-[90] w-[95vw] sm:w-[690px] h-[550px] max-h-[92vh] bg-white rounded-t-xl shadow-2xl border border-[#EAE4D7] flex overflow-hidden font-sans text-left animate-in slide-in-from-bottom-4 duration-200">
        {/* ========================================================================= */}
        {/* CỘT TRÁI (LEFT PANEL): DANH SÁCH CUỘC HỘI THOẠI CHUẨN SCANMS ẢNH 1 */}
        {/* ========================================================================= */}
        <div className="w-[230px] shrink-0 border-r border-[#EAE4D7] bg-white flex flex-col min-w-0">
          {/* Header trái: Chat (2) + [↗] + [⌄] */}
          <div className="h-11 px-3 border-b border-[#EAE4D7] flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-1 text-[#ee4d2d] font-bold text-sm sm:text-[15px]">
              <span>Chat</span>
              <span className="font-semibold text-xs sm:text-sm">({totalUnread > 0 ? totalUnread : filteredConversations.length})</span>
            </div>
            <div className="flex items-center gap-1 text-[#757575]">
              {conversations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsClearAllConversationsModalOpen(true)}
                  className="p-1 text-[#7D715E] hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                  title="Xóa toàn bộ lịch sử trò chuyện"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={toggleMinimize}
                className="p-1 hover:text-[#1A1612] rounded transition cursor-pointer"
                title="Thu nhỏ"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thanh tìm kiếm + Lọc (Tìm theo tên + Tất cả ⌵) */}
          <div className="p-2 border-b border-[#EAE4D7] flex items-center gap-1.5 bg-white shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FAF8F5] border border-[#EAE4D7] rounded flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-[#999999] shrink-0" />
              <input
                type="text"
                placeholder="Tìm theo tên"
                value={searchLeftQuery}
                onChange={(e) => setSearchLeftQuery(e.target.value)}
                className="w-full text-xs text-[#1A1612] placeholder:text-[#999999] outline-none border-none bg-transparent"
              />
            </div>
            <div className="text-xs text-[#757575] flex items-center gap-0.5 cursor-pointer shrink-0 hover:text-[#1A1612]">
              <span>Tất cả</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {/* Danh sách hội thoại cuộn dọc (Chuẩn Ảnh 1) */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F5F5F5]">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#7D715E]">
                <p>Chưa có cuộc trò chuyện nào.</p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = c.id === activeConversation?.id;
                const snippetText = (() => {
                  const msg = c.lastMessage || 'Bắt đầu cuộc trò chuyện';
                  if (msg.trim().startsWith('{')) {
                    try {
                      const parsed = JSON.parse(msg);
                      if (parsed.type === 'PRODUCT_INQUIRY') return `[Sản phẩm] ${parsed.message || ''}`;
                      if (parsed.type === 'COUPON_VOUCHER') return '[Mã giảm giá]';
                      const deal = parseExclusiveDealMessage(msg);
                      if (deal?.type === 'EXCLUSIVE_DEAL_PROPOSAL') {
                        if (!canSeeAffiliateDeals) return 'Shop đã gửi tin nhắn';
                        return `Đề xuất Exclusive Deal: ${deal.productTitle || 'sản phẩm'} · ${deal.proposedCommissionRate ?? '—'}%`;
                      }
                      if (deal?.type === 'EXCLUSIVE_DEAL_DECISION') {
                        if (!canSeeAffiliateDeals) return 'Shop đã gửi tin nhắn';
                        const decision = deal.status === 'APPROVED' ? 'đã được duyệt' : deal.status === 'REJECTED' ? 'đã bị từ chối' : 'đang cập nhật';
                        return `Exclusive Deal ${deal.productTitle || 'sản phẩm'} · ${decision}`;
                      }
                    } catch {}
                  }
                  if (!canSeeAffiliateDeals && /^(Đề xuất|Cập nhật) Exclusive Deal:/i.test(msg)) {
                    return 'Shop đã gửi tin nhắn';
                  }
                  return msg;
                })();

                return (
                  <div
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={`group px-3 py-2.5 flex items-center gap-2.5 cursor-pointer hover:bg-[#FAF8F5] transition relative ${
                      isSelected ? 'bg-[#FBF5EB] border-l-3 border-l-[#ee4d2d]' : ''
                    }`}
                  >
                    {/* Avatar Shop chuẩn thương hiệu SCANMS (Đồng bộ với Card Shop trên sàn) */}
                    <div className="w-9 h-9 rounded-xl bg-[#EEDFC6] text-[#B88E4F] flex items-center justify-center font-black text-sm shrink-0 border border-[#EAE4D7] shadow-2xs overflow-hidden relative select-none">
                      {c.store.logoUrl && !isUnsafeShopLogo(c.store.logoUrl) ? (
                        <img
                          src={c.store.logoUrl}
                          alt={c.store.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span>{c.store.name ? c.store.name.charAt(0).toUpperCase() : 'S'}</span>
                      )}
                    </div>

                    {/* Info - Giới hạn nghiêm ngặt 1 dòng CHUẨN SCANMS Ảnh 1 */}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1 min-w-0">
                        <span
                          className="text-xs font-semibold text-[#1A1612] truncate block min-w-0 flex-1"
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '120px',
                          }}
                          title={c.store.name}
                        >
                          {c.store.name}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0 ml-1">
                          <span className="text-[10px] text-[#999999] whitespace-nowrap group-hover:hidden">
                            {c.lastTime}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConversationToDelete(c);
                            }}
                            className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded hover:bg-rose-50 text-[#7D715E] hover:text-rose-600 transition cursor-pointer"
                            title="Xóa cuộc trò chuyện này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5 min-w-0">
                        <p
                          className="text-[11px] text-[#757575] m-0 leading-tight truncate block min-w-0 flex-1"
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '145px',
                          }}
                          title={snippetText}
                        >
                          {snippetText}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#ee4d2d] text-white text-[9.5px] font-bold flex items-center justify-center shrink-0 ml-1">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT PHẢI (RIGHT PANEL): CỬA SỔ CHAT CHI TIẾT CHUẨN SCANMS ẢNH 1 */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col bg-white min-w-0 relative">
          {/* Header phải (Chuẩn Ảnh 1: GOOJODOQ OFFICIAL SHOP ⌵ ... Thu nhỏ ⌃) */}
          <div className="h-11 px-3.5 border-b border-[#EAE4D7] flex items-center justify-between bg-white shrink-0 relative z-20">
            <div className="flex items-center gap-2 min-w-0 cursor-pointer">
              <div className="w-6 h-6 rounded-md bg-[#EEDFC6] text-[#B88E4F] flex items-center justify-center font-black text-xs shrink-0 border border-[#EAE4D7] overflow-hidden select-none">
                {activeConversation?.store.logoUrl && !isUnsafeShopLogo(activeConversation.store.logoUrl) ? (
                  <img
                    src={activeConversation.store.logoUrl}
                    alt={activeConversation.store.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{activeConversation?.store.name ? activeConversation.store.name.charAt(0).toUpperCase() : 'S'}</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-[13px] font-bold text-[#1A1612] uppercase tracking-tight truncate max-w-[240px]">
                <span className="truncate">{activeConversation?.store.name || 'SORA SKIN OFFICIAL STORE'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#757575] shrink-0" />
              </div>
            </div>

          <div className="flex items-center gap-1.5 text-[#757575]">
            {activeConversation && activeConversation.messages.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClearMessagesModalOpen(true)}
                className="flex items-center gap-1 px-1.5 py-1 text-xs text-[#7D715E] hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer select-none"
                title="Xóa lịch sử tin nhắn trong cuộc trò chuyện này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden sm:inline">Xóa lịch sử</span>
              </button>
            )}
            <button
              type="button"
              onClick={toggleMinimize}
              className="flex items-center gap-1 px-1.5 py-1 text-xs hover:text-[#1A1612] hover:bg-[#FAF8F5] rounded transition cursor-pointer select-none"
              title="Thu nhỏ khung chat"
            >
              <span className="text-[12px] font-medium">Thu nhỏ</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={closeChat}
              className="p-1 text-[#757575] hover:text-[#DC2626] hover:bg-[#FAF8F5] rounded transition cursor-pointer"
              title="Đóng chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 bg-[#F8F9FA]/40">
          {/* Date separator: Ngày hôm qua / Ngày hôm nay */}
          <div className="text-center my-1.5">
            <span className="inline-block px-3 py-0.5 bg-[#EAE4D7]/80 text-[#7D715E] text-[10.5px] font-medium rounded-full">
              Ngày hôm qua
            </span>
          </div>

          {/* SCANMS UI 1 Yellow Notice Box */}
          <div className="p-2.5 bg-[#FFF9E6] border border-[#FFE082] rounded-lg text-[11px] text-[#7A5A00] leading-relaxed flex items-start gap-2 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <strong>LƯU Ý:</strong> SCANMS <u>KHÔNG</u> cho phép các hành vi: Đặt cọc / Chuyển khoản riêng cho người bán / Giao dịch ngoài hệ thống SCANMS / Cung cấp thông tin liên hệ cho người bán / Các hoạt động tuyển CTV / Tặng quà miễn phí,... Vui lòng chỉ mua-bán trực tiếp trên ứng dụng SCANMS để tránh nguy cơ bị lừa đảo bạn nhé!{' '}
              <a
                href="#rules"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info('Chính sách bảo vệ người mua SCANMS: Giao dịch được bảo đảm 100% khi thanh toán qua sàn.');
                }}
                className="text-[#0055AA] hover:underline font-semibold ml-0.5"
              >
                Tìm hiểu thêm
              </a>
            </div>
          </div>

          {/* Message Bubbles */}
          {visibleMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            const hasProducts = msg.products && msg.products.length > 0;
            const exclusiveDeal = parseExclusiveDealMessage(msg.content);

            if (exclusiveDeal) {
              return (
                <ExclusiveDealMessageBubble
                  key={msg.id}
                  card={exclusiveDeal}
                  isMine={isUser}
                  isShop={isShopManager}
                  timestamp={msg.timestamp}
                />
              );
            }

            if (msg.coupon) {
              const coupon = msg.coupon;
              const discount = coupon.discountType === 'PERCENTAGE'
                ? `Giảm ${coupon.discountValue}%`
                : `Giảm ${coupon.discountValue.toLocaleString('vi-VN')}₫`;
              return (
                <div key={msg.id} className={`my-2 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <article className="w-full max-w-[340px] rounded-2xl border border-[#EEDFC6] bg-white p-3.5 text-[#1A1612] shadow-sm">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#B88E4F]">
                      <Ticket className="h-4 w-4" /> Ưu đãi từ {coupon.storeName}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#C59B58] bg-[#FBF5EB] p-3">
                      <span className="font-mono text-base font-extrabold tracking-wider text-[#8F682E]">{coupon.code}</span>
                      <button type="button" onClick={() => void handleCopyCoupon(coupon)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#EEDFC6] bg-white px-2.5 py-1.5 text-xs font-bold text-[#7D715E] hover:bg-[#FAF8F5]">
                        {copiedCouponId === coupon.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedCouponId === coupon.id ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                    <div className="mt-2 text-sm font-extrabold">{discount}</div>
                    {coupon.minimumOrderAmount && <div className="mt-1 text-[11px] text-[#7D715E]">Đơn tối thiểu {coupon.minimumOrderAmount.toLocaleString('vi-VN')}₫</div>}
                    {coupon.maximumDiscountAmount && coupon.discountType === 'PERCENTAGE' && <div className="text-[11px] text-[#7D715E]">Giảm tối đa {coupon.maximumDiscountAmount.toLocaleString('vi-VN')}₫</div>}
                    {coupon.scopeType === 'PRODUCTS' && <div className="mt-1 text-[11px] text-[#7D715E]">Áp dụng cho {coupon.products.length} sản phẩm trong danh sách Shop.</div>}
                    {coupon.scopeType === 'CATEGORIES' && <div className="mt-1 text-[11px] text-[#7D715E]">Danh mục: {coupon.categories.join(', ') || 'theo điều kiện của Shop'}.</div>}
                    {coupon.expiresAt && <div className="mt-1 text-[11px] text-[#7D715E]">Hạn đến {new Date(coupon.expiresAt).toLocaleDateString('vi-VN')}</div>}
                    <div className="mt-2 border-t border-[#F3EFE6] pt-2 text-right text-[10px] text-[#7D715E]">{msg.timestamp}</div>
                  </article>
                </div>
              );
            }

            // Dạng thẻ tin nhắn sản phẩm CHUẨN SCANMS Ảnh 4
            if (hasProducts) {
              return (
                <div key={msg.id} className="flex items-end justify-end gap-1.5 my-2">
                  {/* Ellipsis button on left of user message like in SCANMS UI 4 */}
                  <div
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer rounded hover:bg-gray-100 transition shrink-0"
                    title="Tuỳ chọn"
                  >
                    <span className="text-sm font-black leading-none">⋯</span>
                  </div>

                  <div className="flex flex-col items-end max-w-[85%] sm:max-w-[320px]">
                    {/* Card Container */}
                    <div className="bg-white border border-[#EAE4D7] rounded-xl shadow-xs overflow-hidden w-full text-left">
                      <div className="px-3 pt-2.5 pb-1 text-xs font-semibold text-[#1A1612]">
                        Sản phẩm
                      </div>
                      <div className="divide-y divide-[#F3F4F6] px-3 pb-2.5">
                        {msg.products!.map((p) => {
                          const discountPercent =
                            p.originalPrice && p.originalPrice > p.price
                              ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                              : null;
                          return (
                            <div key={p.id} className="flex gap-2.5 items-center pt-2 first:pt-1">
                              <img
                                src={getSafeProductImageUrl(p.imageUrl, p.title)}
                                alt={p.title}
                                className="w-14 h-14 rounded-xs object-cover border border-[#EAE4D7] shrink-0 bg-white"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  if (!target.dataset.hasFallback) {
                                    target.dataset.hasFallback = 'true';
                                    target.src = getSafeProductImageUrl(null, p.title);
                                  }
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs text-[#1A1612] font-normal line-clamp-2 leading-tight">
                                  {p.title}
                                </div>
                                <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[11px]">
                                  {p.originalPrice && p.originalPrice > p.price && (
                                    <span className="text-gray-400 line-through">
                                      {p.originalPrice.toLocaleString('vi-VN')}₫
                                    </span>
                                  )}
                                  <span className="font-bold text-[#ee4d2d]">
                                    {p.price.toLocaleString('vi-VN')}₫
                                  </span>
                                  {discountPercent && discountPercent > 0 && (
                                    <span className="text-[10px] text-[#ee4d2d] font-semibold">
                                      -{discountPercent}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timestamp & double checkmark status */}
                    <div className="flex items-center gap-1 text-[10px] text-[#7D715E] mt-1 pr-1">
                      <span>{msg.timestamp}</span>
                      <span className="text-emerald-500 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              );
            }

            // Tin nhắn văn bản thông thường (Chuẩn Ảnh 5 cho Shop)
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] ${
                  isUser ? 'ml-auto' : 'mr-auto'
                } my-1`}
              >
                <div
                  className={`max-w-full rounded-2xl text-xs leading-relaxed shadow-2xs overflow-hidden ${
                    msg.mediaUrl
                      ? 'bg-white text-[#1A1612] border border-[#EAE4D7]'
                      : isUser
                        ? 'px-3.5 py-2.5 bg-[#ee4d2d] text-white rounded-br-none'
                        : 'px-3.5 py-2.5 bg-white text-[#1A1612] border border-[#EAE4D7] rounded-bl-none'
                  }`}
                >
                  {msg.mediaUrl && msg.mediaType === 'IMAGE' && (
                    <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="block">
                      <img src={msg.mediaUrl} alt={msg.mediaName || 'Ảnh được gửi trong chat'} className="max-h-64 max-w-full object-contain" />
                    </a>
                  )}
                  {msg.mediaUrl && msg.mediaType === 'VIDEO' && (
                    <video src={msg.mediaUrl} controls preload="metadata" className="max-h-64 max-w-full" aria-label={msg.mediaName || 'Video gửi trong chat'} />
                  )}
                  {msg.mediaUrl && msg.mediaType === 'DOCUMENT' && (
                    <a href={msg.mediaUrl} target="_blank" rel="noreferrer" download={msg.mediaName || true} className="flex items-center gap-2.5 px-3.5 py-3 text-[#1A1612] hover:bg-[#FAF8F5]">
                      <FileText className="w-5 h-5 text-[#B88E4F] shrink-0" />
                      <span className="min-w-0 break-all">{msg.mediaName || 'Tải tài liệu đính kèm'}</span>
                    </a>
                  )}
                  {msg.content && <div className={msg.mediaUrl ? 'px-3.5 py-2.5' : ''}>{msg.content}</div>}
                </div>
                <div
                  className={`flex items-center gap-1 text-[9.5px] text-[#7D715E] mt-1 ${
                    isUser ? 'pr-1' : 'pl-1'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {isUser && <span className="text-emerald-500 font-bold">✓✓</span>}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ========================================================================= */}
        {/* CARD SẢN PHẨM ĐANG ĐÍNH KÈM / HỎI SHOP (GHIM NGAY TRÊN Ô NHẬP TIN NHẮN) */}
        {/* ========================================================================= */}
        {activeProduct && (
          <div className="border-t border-[#EAE4D7] bg-[#FBF5EB] px-3 py-2.5 shrink-0 transition-all shadow-xs">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={getSafeProductImageUrl(activeProduct.imageUrl, activeProduct.title)}
                  alt={activeProduct.title}
                  className="w-12 h-12 rounded-lg object-cover border border-[#EAE4D7] bg-white shrink-0 shadow-2xs"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.dataset.hasFallback) {
                      target.dataset.hasFallback = 'true';
                      target.src = getSafeProductImageUrl(null, activeProduct.title);
                    }
                  }}
                />
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F3EFE6] text-[#B88E4F] border border-[#EEDFC6]">
                    <Package className="w-3 h-3 text-[#B88E4F]" />
                    <span>Đang đính kèm sản phẩm</span>
                  </div>
                  <div className="text-xs font-semibold text-[#1A1612] truncate max-w-[170px] sm:max-w-[220px] mt-0.5" title={activeProduct.title}>
                    {activeProduct.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-[#B88E4F]">
                      {activeProduct.price.toLocaleString('vi-VN')}₫
                    </span>
                    {activeProduct.originalPrice && activeProduct.originalPrice > activeProduct.price && (
                      <span className="text-[10px] text-[#7D715E] line-through">
                        {activeProduct.originalPrice.toLocaleString('vi-VN')}₫
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSendActiveProduct}
                  className="px-2.5 py-1.5 bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1"
                  title="Gửi thông tin sản phẩm vào cuộc trò chuyện"
                >
                  <Send className="w-3 h-3" />
                  <span>Gửi SP</span>
                </button>
                <button
                  type="button"
                  onClick={openProductPicker}
                  className="px-2 py-1.5 bg-white border border-[#EAE4D7] hover:border-[#B88E4F] text-xs font-medium text-[#1A1612] rounded-lg cursor-pointer transition shadow-2xs"
                  title="Chọn sản phẩm khác"
                >
                  Thay đổi
                </button>
                <button
                  type="button"
                  onClick={clearActiveProduct}
                  className="p-1 text-[#7D715E] hover:text-[#DC2626] rounded-md cursor-pointer transition"
                  title="Bỏ đính kèm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Gợi ý nhanh câu hỏi chuẩn giao diện SCANMS */}
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#EAE4D7]/70 overflow-x-auto text-[11px]">
              <span className="text-[#7D715E] font-medium shrink-0 flex items-center gap-1">
                <span>✨ Gợi ý:</span>
              </span>
              <button
                type="button"
                onClick={() => handleQuickSuggestion('Chào Shop, mình quan tâm đến sản phẩm này và muốn xin mẫu thử (Sample) để review/livestream.')}
                className="px-2 py-0.5 bg-white border border-[#EAE4D7] hover:border-[#B88E4F] hover:text-[#B88E4F] rounded-full text-[#1A1612] whitespace-nowrap transition cursor-pointer shadow-2xs"
              >
                Xin mẫu thử (Sample)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSuggestion('Chào Shop, sản phẩm này hiện còn sẵn hàng trong kho không ạ?')}
                className="px-2 py-0.5 bg-white border border-[#EAE4D7] hover:border-[#B88E4F] hover:text-[#B88E4F] rounded-full text-[#1A1612] whitespace-nowrap transition cursor-pointer shadow-2xs"
              >
                Kiểm tra còn hàng
              </button>
              <button
                type="button"
                onClick={() => handleQuickSuggestion('Chào Shop, mình muốn tư vấn kỹ hơn về công dụng và cách dùng sản phẩm này.')}
                className="px-2 py-0.5 bg-white border border-[#EAE4D7] hover:border-[#B88E4F] hover:text-[#B88E4F] rounded-full text-[#1A1612] whitespace-nowrap transition cursor-pointer shadow-2xs"
              >
                Tư vấn chi tiết
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* KHUNG NHẬP NỘI DUNG & ICON DƯỚI (CHUẨN 100% ẢNH 1 & ẢNH 2 CỦA BẠN GỬI) */}
        {/* ========================================================================= */}
        <div className="border-t border-[#EAE4D7] bg-white p-2.5 shrink-0">
          <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" className="hidden" onChange={(event) => void handleAttachmentChange(event, 'IMAGE')} />
          <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" className="hidden" onChange={(event) => void handleAttachmentChange(event, 'VIDEO')} />
          <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={(event) => void handleAttachmentChange(event, 'DOCUMENT')} />
          {/* Ô nhập tin nhắn không viền thô, chữ mờ CHUẨN SCANMS */}
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isUploadingAttachment ? 'Đang tải tệp lên cuộc trò chuyện…' : 'Nhập nội dung tin nhắn'}
            disabled={isUploadingAttachment}
            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs sm:text-[13px] text-[#1A1612] placeholder:text-[#999999] resize-none p-1 font-sans"
          />

          {/* Dải Icon chuẩn 100% Ảnh 2: Mặt cười, Ảnh, Video, Voucher, Hộp quà, Tài liệu, và Mũi tên gửi */}
          <div className="flex items-center justify-between mt-1 pt-1">
            <div className="flex items-center gap-2.5 sm:gap-3 text-[#757575]">
              {/* Icon 1: Smiley face ☺ */}
              <div ref={emojiPickerRef} className="relative">
                <button
                  type="button"
                  aria-label="Mở danh sách biểu tượng cảm xúc"
                  aria-expanded={isEmojiPickerOpen}
                  onClick={() => setIsEmojiPickerOpen((open) => !open)}
                  className={`transition cursor-pointer p-0.5 ${isEmojiPickerOpen ? 'text-[#B88E4F]' : 'hover:text-[#B88E4F]'}`}
                  title="Biểu tượng cảm xúc"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {isEmojiPickerOpen && (
                  <div
                    className="absolute bottom-full left-0 z-[80] mb-2 w-[min(320px,calc(95vw-24px))] overflow-hidden rounded-xl border border-[#EAE4D7] shadow-xl [--epr-highlight-color:#C59B58] [--epr-hover-bg-color:#FBF5EB] [--epr-category-icon-active-color:#B88E4F] [--epr-picker-border-color:#EAE4D7] [--epr-search-input-bg-color:#FAF8F5]"
                  >
                    <Suspense fallback={<div className="h-[350px]" aria-label="Đang tải biểu tượng cảm xúc" />}>
                      <EmojiPicker
                        onEmojiClick={(data: EmojiClickData) => insertEmoji(data.emoji)}
                        theme={'light' as NonNullable<PickerProps['theme']>}
                        emojiStyle={'native' as NonNullable<PickerProps['emojiStyle']>}
                        suggestedEmojisMode={'recent' as NonNullable<PickerProps['suggestedEmojisMode']>}
                        categories={emojiCategories}
                        searchPlaceholder="Tìm biểu tượng cảm xúc"
                        autoFocusSearch
                        lazyLoadEmojis
                        height={350}
                        width="100%"
                        previewConfig={{ showPreview: false }}
                      />
                    </Suspense>
                  </div>
                )}
              </div>

              {/* Icon 2: Image 🖼️ */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingAttachment}
                className="hover:text-[#ee4d2d] transition cursor-pointer p-0.5 disabled:opacity-50"
                title="Gửi ảnh PNG/JPG (tối đa 5 MB)"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Icon 3: Video 🎥 */}
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={isUploadingAttachment}
                className="hover:text-[#ee4d2d] transition cursor-pointer p-0.5 disabled:opacity-50"
                title="Gửi video review (MP4/MOV/WEBM, tối đa 50 MB)"
              >
                <Video className="w-4 h-4" />
              </button>

              {/* Icon 4: Voucher / Coupon 🎫 */}
              <button
                type="button"
                onClick={() => void openCouponPicker()}
                className="hover:text-[#ee4d2d] transition cursor-pointer p-0.5"
                title="Xem và gửi mã giảm giá của Shop"
              >
                <Ticket className="w-4 h-4" />
              </button>

              {/* Icon 5: Package / Box 📦 -> Mở modal Chọn sản phẩm */}
              <button
                type="button"
                onClick={openProductPicker}
                className="hover:text-[#ee4d2d] transition cursor-pointer p-0.5"
                title="Chọn sản phẩm thật của Shop để gửi trong chat"
              >
                <Package className="w-4 h-4" />
              </button>

              {/* Icon 6: Document / File 📄 */}
              <button
                type="button"
                onClick={() => documentInputRef.current?.click()}
                disabled={isUploadingAttachment}
                className="hover:text-[#ee4d2d] transition cursor-pointer p-0.5 disabled:opacity-50"
                title="Đính kèm biên lai / hóa đơn (tối đa 20 MB)"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>

            {/* Mũi tên Gửi (Paper airplane) */}
            <button
              type="button"
              onClick={handleSend}
              disabled={(!inputText.trim() && !activeProduct) || isUploadingAttachment}
              className={`p-1 transition active:scale-95 cursor-pointer ${
                inputText.trim() || activeProduct
                  ? 'text-[#C59B58] hover:text-[#B88E4F]'
                  : 'text-[#C0C0C0] cursor-not-allowed'
              }`}
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal xác nhận xóa 1 cuộc trò chuyện */}
      <ConfirmModal
        isOpen={Boolean(conversationToDelete)}
        onClose={() => setConversationToDelete(null)}
        onConfirm={handleConfirmDeleteConversation}
        title="Xóa cuộc trò chuyện?"
        message={`Bạn có chắc muốn xóa cuộc trò chuyện với "${conversationToDelete?.store?.name || 'gian hàng'}"? Toàn bộ lịch sử tin nhắn của cuộc trò chuyện này sẽ bị xóa khỏi danh sách.`}
        confirmText="Xóa cuộc trò chuyện"
        cancelText="Hủy"
        variant="danger"
        isLoading={isDeletingConversation}
      />

      {/* Modal xác nhận xóa lịch sử tin nhắn cuộc trò chuyện hiện tại */}
      <ConfirmModal
        isOpen={isClearMessagesModalOpen}
        onClose={() => setIsClearMessagesModalOpen(false)}
        onConfirm={handleConfirmClearMessages}
        title="Xóa lịch sử tin nhắn?"
        message={`Bạn có chắc muốn xóa toàn bộ lịch sử tin nhắn trong cuộc trò chuyện với "${activeConversation?.store?.name || 'Shop'}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa sạch tin nhắn"
        cancelText="Hủy"
        variant="danger"
        isLoading={isClearingMessages}
      />

      {/* Modal xác nhận xóa tất cả các cuộc trò chuyện */}
      <ConfirmModal
        isOpen={isClearAllConversationsModalOpen}
        onClose={() => setIsClearAllConversationsModalOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="Xóa toàn bộ lịch sử chat?"
        message="Bạn có chắc muốn xóa tất cả các cuộc trò chuyện và lịch sử chat trên thiết bị này? Hành động này sẽ dọn sạch danh sách tin nhắn."
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  </>
);
}

export const ShopeeFloatingChatWidget = ScanmsFloatingChatWidget;
