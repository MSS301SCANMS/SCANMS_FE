import React, { useState, useEffect, useRef, useMemo } from 'react';
import './LiveStreamRoomHeader.css';
import '../../components/live/LiveReactionFlight.css';
import { LiveVoucherDropDialog } from '../../components/live/LiveVoucherDropDialog';
import { HostStudioProducts } from '../../components/live/HostStudioProducts';
import { LivePinnedProductCard, LiveReactionDock } from '../../components/live/LiveRoomCommerce';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Heart,
  Share2,
  Volume2,
  VolumeX,
  ShoppingBag,
  ShoppingCart,
  Search,
  Ticket,
  Send,
  X,
  CheckCircle2,
  Sliders,
  Video,
  VideoOff,
  Camera,
  Sparkles,
  Mic,
  MicOff,
  Upload,
  ShieldCheck,
  MessageCircle,
  Check,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Store,
} from 'lucide-react';
import api from '../../services/api';
import { liveSessionService } from '../../services/live-session.service';
import { authService } from '../../services/auth.service';
import { LiveGovernancePanel } from '../../components/live/LiveGovernancePanel';
import { useCart } from '../../context/CartContext';
import { useScanmsChat } from '../../context/ScanmsChatContext';
import { toast } from '../../utils/toast';
import { cn } from '../../utils/cn';
import { useLiveStreamTransport } from '../../hooks/useLiveStreamTransport';
import { unwrapApi } from '../../utils/api-response';
import { liveCommerceService, liveCommerceErrorMessage, isLiveOfferActive, type LiveCommerce } from '../../services/live-commerce.service';
import { LiveCommercePanel } from '../../components/live/LiveCommercePanel';
import { couponService } from '../../services/coupon.service';
import { LiveVariantPicker, type LiveVariant } from '../../components/live/LiveVariantPicker';
import { FACE_FILTERS, useLiveFaceFilter, type FaceFilter } from '../../hooks/useLiveFaceFilter';
import { FaceFilterPreview } from '../../components/live/FaceFilterPreview';
import type { FilterCategory } from '@/components/live/faceFilters';
const legacyLive = import.meta.env.VITE_COMMERCE_BACKEND === 'legacy';

interface LiveProduct {
  id: string;
  variantId?: string;
  variantName?: string;
  variants?: LiveVariant[];
  offerEndsAt?: string;
  offerVariantName?: string;
  voucherLabels?: string[];
  title: string;
  imageUrl?: string | null;
  price: number;
  livePrice?: number;
  discountPercentage?: number;
  storeName?: string;
  storeId?: string;
  soldPercent?: number;
  stockLeft?: number;
  category?: string;
  badge?: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  role: 'VIEWER' | 'HOST' | 'SHOP' | 'SYSTEM';
  text: string;
  badge?: string;
  avatar?: string;
  time: string;
}

export interface UserProfileData {
  name: string;
  handle: string;
  role: 'VIEWER' | 'HOST' | 'SHOP' | 'SYSTEM';
  badgeTitle: string;
  avatar?: string;
  bio: string;
  verified: boolean;
  trustScore: number;
  memberSince: string;
  city?: string;
  metrics: {
    label: string;
    value: string;
  }[];
  socials?: {
    platform: string;
    handle: string;
  }[];
  tags: string[];
}

interface FloatingReaction {
  id: number;
  emoji: string;
  iconUrl?: string;
  bottom: number;
  right?: number;
  left?: number;
  size: number;
  driftX: number;
  path: string;
  rise: number;
  tilt: number;
  delay: number;
  duration: number;
}

const BACKDROP_PRESETS = [
  {
    id: 'studio-beauty',
    name: 'Studio Mỹ Phẩm Sáng',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'studio-luxury',
    name: 'Showroom Sang Trọng',
    url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'studio-sand',
    name: 'Tối Giản Warm Sand',
    url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'studio-sale',
    name: 'Sân Khấu Siêu Sale',
    url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1600&auto=format&fit=crop&q=80',
  },
];

export interface LiveReactionDef {
  id: string;
  emoji: string;
  label: string;
  iconUrl: string;
  color: string;
  burstColor: string;
  fallbackIconUrl?: string;
}

// Animated Google Noto Emoji, bundled locally (CC BY 4.0), with static reduced-motion fallbacks.
export const REALISTIC_3D_REACTIONS: LiveReactionDef[] = [
  {
    id: 'heart',
    emoji: '❤️',
    label: 'Thả tim',
    iconUrl: '/assets/live-reactions/animated/heart.webp',
    fallbackIconUrl: '/assets/live-reactions/animated/heart.png',
    color: 'from-rose-500 to-red-500',
    burstColor: '#ef4444',
  },
  {
    id: 'like',
    emoji: '👍',
    label: 'Thích',
    iconUrl: '/assets/live-reactions/animated/like.webp',
    fallbackIconUrl: '/assets/live-reactions/animated/like.png',
    color: 'from-blue-500 to-indigo-600',
    burstColor: '#3b82f6',
  },
  {
    id: 'haha',
    emoji: '😂',
    label: 'Haha',
    iconUrl: '/assets/live-reactions/animated/haha.webp',
    fallbackIconUrl: '/assets/live-reactions/animated/haha.png',
    color: 'from-amber-400 to-yellow-500',
    burstColor: '#eab308',
  },
  {
    id: 'wow',
    emoji: '😮',
    label: 'Wow',
    iconUrl: '/assets/live-reactions/animated/wow.webp',
    fallbackIconUrl: '/assets/live-reactions/animated/wow.png',
    color: 'from-yellow-400 to-orange-500',
    burstColor: '#f59e0b',
  },
  {
    id: 'sad',
    emoji: '😢',
    label: 'Buồn',
    iconUrl: '/assets/live-reactions/animated/sad.webp',
    fallbackIconUrl: '/assets/live-reactions/animated/sad.png',
    color: 'from-blue-400 to-sky-500',
    burstColor: '#38bdf8',
  },
  {
    id: 'angry',
    emoji: '😡',
    label: 'Phẫn nộ',
    iconUrl: '/assets/live-reactions/animated/angry.webp',
    fallbackIconUrl: '/assets/live-reactions/animated/angry.png',
    color: 'from-red-600 to-orange-600',
    burstColor: '#dc2626',
  },
  {
    id: 'fire',
    emoji: '🔥',
    label: 'Cháy quá',
    iconUrl: '/assets/live-reactions/animated/fire.webp',
    fallbackIconUrl: '/assets/live-reactions/animated/fire.png',
    color: 'from-amber-500 to-orange-500',
    burstColor: '#f97316',
  },
  {
    id: 'gift',
    emoji: '🎁',
    label: 'Tặng quà',
    iconUrl: '/assets/live-reactions/animated/gift.webp',
    fallbackIconUrl: '/assets/live-reactions/animated/gift.png',
    color: 'from-purple-500 to-indigo-500',
    burstColor: '#a855f7',
  },
  {
    id: 'party',
    emoji: '🎉',
    label: 'Bắn pháo',
    iconUrl: '/assets/live-reactions/animated/party.webp',
    fallbackIconUrl: '/assets/live-reactions/animated/party.png',
    color: 'from-pink-500 to-rose-500',
    burstColor: '#ec4899',
  },
  {
    id: 'hundred',
    emoji: '💯',
    label: '100 Điểm',
    iconUrl: '/assets/live-reactions/animated/hundred.webp',
    fallbackIconUrl: '/assets/live-reactions/animated/hundred.png',
    color: 'from-red-500 to-rose-600',
    burstColor: '#dc2626',
  },
  {
    id: 'star',
    emoji: '⭐',
    label: '5 Sao',
    iconUrl: '/assets/live-reactions/animated/star.webp',
    fallbackIconUrl: '/assets/live-reactions/animated/star.png',
    color: 'from-amber-400 to-yellow-500',
    burstColor: '#f59e0b',
  },
];

// Dòng chảy tim đổi màu TikTok Live siêu rực rỡ khi spam tap
export const TIKTOK_HEARTS = [
  '/assets/live-reactions/heart.png',
  '/assets/live-reactions/heart-pink.png',
  '/assets/live-reactions/heart-orange.png',
  '/assets/live-reactions/heart-purple.png',
  '/assets/live-reactions/heart-light_blue.png',
  '/assets/live-reactions/heart-yellow.png',
];


const resolveUserProfile = (msg: ChatMessage, currentUser: any, sessionData?: any): UserProfileData => {
  const isMe =
    (currentUser?.fullName && msg.sender.includes(currentUser.fullName)) ||
    msg.sender.includes('Bạn') ||
    msg.sender === currentUser?.fullName;

  if (isMe && currentUser) {
    const roleTitle =
      currentUser.role === 'SHOP_MANAGER'
        ? 'Chủ Gian Hàng Đối Tác'
        : currentUser.role === 'COLLABORATOR'
        ? 'Nhà Sáng Tạo KOC/KOL'
        : currentUser.role === 'ADMIN'
        ? 'Quản Trị Viên Sàn'
        : 'Khách Hàng SCANMS';

    return {
      name: currentUser.fullName || 'Bạn',
      handle: `@${(currentUser.email || 'user').split('@')[0]}`,
      role: msg.role,
      badgeTitle: roleTitle,
      avatar: currentUser.avatar || currentUser.avatarUrl || undefined,
      bio: 'Thành viên chính thức trên Sàn Tiếp Thị Liên Kết SCANMS. Tài khoản đã xác thực thông tin và tham gia giao dịch an toàn.',
      verified: true,
      trustScore: 100,
      memberSince: 'Tháng 01/2026',
      city: 'Việt Nam',
      metrics: [
        { label: 'Cấp bậc', value: 'VIP Pro' },
        { label: 'Tín nhiệm', value: '100/100' },
        { label: 'eKYC', value: 'Đã duyệt' },
      ],
      tags: ['Tài khoản của bạn', 'eKYC Đã duyệt', 'Bảo mật 2FA'],
    };
  }

  if (msg.role === 'HOST') {
    const hostName = sessionData?.creator?.fullName || sessionData?.creator?.name || msg.sender;
    return {
      name: hostName,
      handle: `@${(sessionData?.creator?.email || 'koc.host').split('@')[0]}`,
      role: 'HOST',
      badgeTitle: '👑 Host KOC Phiên Live',
      avatar: sessionData?.creator?.avatarUrl || msg.avatar,
      bio: 'Nhà sáng tạo KOC/KOL đối tác của Sàn SCANMS. Chia sẻ trải nghiệm sản phẩm thực tế và trợ giá deal độc quyền cho người xem.',
      verified: true,
      trustScore: 100,
      memberSince: 'Tháng 08/2025',
      city: 'TP. Hồ Chí Minh',
      metrics: [
        { label: 'Followers', value: '120K+' },
        { label: 'Lượt thích', value: '850K+' },
        { label: 'KOC Verfied', value: '100%' },
      ],
      tags: ['Top Creator', 'KOC Đối Tác', 'KYC Verified'],
    };
  }

  if (msg.role === 'SHOP') {
    const shopName = sessionData?.store?.name || msg.sender;
    return {
      name: shopName,
      handle: `@${(sessionData?.store?.slug || 'shop.mall').toLowerCase()}`,
      role: 'SHOP',
      badgeTitle: '🏪 Gian Hàng Đối Tác Chính Hãng',
      avatar: sessionData?.store?.logoUrl || msg.avatar,
      bio: sessionData?.store?.description || 'Gian hàng đối tác kinh doanh chính hãng trên Sàn SCANMS. Cam kết 100% nguồn gốc xuất xứ và đồng kiểm khi nhận hàng.',
      verified: true,
      trustScore: 100,
      memberSince: 'Tháng 01/2025',
      city: 'Việt Nam',
      metrics: [
        { label: 'Đánh giá', value: '4.9 ★' },
        { label: 'Phản hồi', value: '100%' },
        { label: 'Hàng chính hãng', value: '100%' },
      ],
      tags: ['Chính hãng 100%', 'Giao nhanh 24h', 'Đồng kiểm nhận hàng'],
    };
  }

  const cleanHandle = msg.sender.toLowerCase().replace(/[^a-z0-9]/g, '') || 'viewer';
  return {
    name: msg.sender,
    handle: `@${cleanHandle}`,
    role: msg.role,
    badgeTitle: '🛍️ Thành Viên Tương Tác',
    avatar: msg.avatar,
    bio: 'Khách hàng thân thiết tham gia giao dịch và theo dõi livestream trên hệ thống SCANMS.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 02/2026',
    city: 'Việt Nam',
    metrics: [
      { label: 'Tương tác', value: 'Tích cực' },
      { label: 'Nhận hàng', value: '100%' },
      { label: 'Uy tín', value: '100/100' },
    ],
    tags: ['Thành viên Live', 'Đã xác thực'],
  };
};

export default function LiveStreamRoomPage() {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const navigate = useNavigate();
  const { addItem, buyNow, startCheckout, totalCount: cartTotalCount } = useCart();
  const currentUser = authService.getCurrentUser();

  const identifier = slug || id || 'demo';

  // Client ID duy nhất của tab xem live để hệ thống đếm số người xem thực tế qua Heartbeat
  const clientIdRef = useRef<string>(
    (() => {
      const stored = sessionStorage.getItem('scanms_live_client_id');
      if (stored) return stored;
      const gen = 'client_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem('scanms_live_client_id', gen);
      return gen;
    })(),
  );

  const likesStorageKey = `scanms_live_likes_${identifier}`;

  // Live session state
  const [sessionData, setSessionData] = useState<any>(null);
  const [ownerLookup, setOwnerLookup] = useState<{ key: string; owner: boolean; error?: string } | null>(null);
  const [ownerLookupAttempt, setOwnerLookupAttempt] = useState(0);
  const ownerLookupKey = `${currentUser?.id || ''}|${currentUser?.role || ''}|${sessionData?.storeId || ''}`;
  const needsOwnerLookup = currentUser?.role === 'SHOP_MANAGER';
  const ownerLookupReady = !needsOwnerLookup || (ownerLookup?.key === ownerLookupKey && !ownerLookup.error);
  const isSessionOwner = needsOwnerLookup && ownerLookup?.key === ownerLookupKey && ownerLookup.owner;
  const ownerLookupError = needsOwnerLookup && ownerLookup?.key === ownerLookupKey ? ownerLookup.error : undefined;
  const [commerce, setCommerce] = useState<LiveCommerce>({ offers: [], voucherDrops: [] });
  const [commerceError, setCommerceError] = useState('');
  const [commerceReloadAttempt, setCommerceReloadAttempt] = useState(0);
  const [platformVouchers, setPlatformVouchers] = useState<any[]>([]);
  const [variantChoice, setVariantChoice] = useState<{ product: LiveProduct; action: 'cart' | 'buy' } | null>(null);
  const [sessionLoadError, setSessionLoadError] = useState('');
  const isSessionHost =
    currentUser?.role === 'COLLABORATOR' &&
    Boolean(currentUser.id) &&
    ((currentUser.id === sessionData?.creator?.id && sessionData?.creator?.canHost !== false)
      || sessionData?.creators?.some((creator: any) => creator.id === currentUser.id && creator.canHost !== false));
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // SỐ LIỆU THỰC TẾ: Người xem & Lượt thả tim
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [likesCount, setLikesCount] = useState<number>(() => {
    if (!legacyLive) return 0;
    const saved = localStorage.getItem(`scanms_live_likes_${slug || id || 'demo'}`);
    return saved ? Math.max(0, Number(saved)) : 0;
  });
  const [likeDelta, setLikeDelta] = useState<number | null>(null);
  const likeDeltaTimerRef = useRef<any>(null);

  // Khay icon 3D thu gọn / mở rộng (Collapsible Dock)
  const [isReactionDockExpanded, setIsReactionDockExpanded] = useState<boolean>(false);

  // WEBCAM / CAMERA STREAMING STATES
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [faceFilter, setFaceFilter] = useState<FaceFilter>('off');
  const [filterStrength, setFilterStrength] = useState(60);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const { stream: filteredStream, status: filterStatus, faceDetected } = useLiveFaceFilter(
    isSessionHost ? cameraStream : null, faceFilter, filterStrength,
  );
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isMirror, setIsMirror] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeBackdropUrl, setActiveBackdropUrl] = useState<string>(BACKDROP_PRESETS[0].url);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  // Floating Reactions & Hearts
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const reactionCounterRef = useRef(0);
  const lastReactionFlightAt = useRef(0);

  // In-stream drawers / overlays (TikTok Shop Live Style)
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [bagPosition, setBagPosition] = useState<'left' | 'right'>('left');
  const [bagFilterTab, setBagFilterTab] = useState<string>('ALL');
  const [bagSearchQuery, setBagSearchQuery] = useState('');
  const [isBagSearchOpen, setIsBagSearchOpen] = useState(false);
  const [isHostStudioOpen, setIsHostStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<'PRODUCTS' | 'STUDIO' | 'GOVERNANCE' | 'OFFERS'>('PRODUCTS');

  const [pinnedIndex, setPinnedIndex] = useState(0);
  const [isPinnedDealCollapsed, setIsPinnedDealCollapsed] = useState(false);
  const [isVoucherClaimed, setIsVoucherClaimed] = useState(false);
  const [voucherClaimLoading, setVoucherClaimLoading] = useState(false);

  // Chat stream state - starting with official verified welcome notice (no fake mock comments)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'system-welcome',
      sender: 'Hệ Thống SCANMS',
      role: 'SYSTEM',
      avatar: '/favicon.ico',
      text: 'Chào mừng bạn đến với phiên Livestream chính thức trên Sàn SCANMS! Hãy tương tác tích cực, săn deal trợ giá độc quyền và lưu voucher phiên live.',
      time: 'Bắt đầu',
    },
  ]);
  const [inputComment, setInputComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setChatMessages([{ id: 'system-welcome', sender: 'Hệ Thống SCANMS', role: 'SYSTEM', text: 'Chào mừng bạn đến với phiên livestream SCANMS. Bình luận của bạn được chia sẻ với KOL và shop trong phòng này.', time: 'Bắt đầu' }]);
    setInputComment('');
  }, [sessionData?.id]);
  useEffect(() => {
    let active = true;
    if (currentUser?.role === 'SHOP_MANAGER' && sessionData?.storeId) {
      void api.get('/stores/mine', { headers: { 'x-skip-cache': 'true' } }).then(response => {
        const rows = unwrapApi<any[]>(response);
        if (!Array.isArray(rows)) throw new Error('Invalid store response');
        if (active) setOwnerLookup({ key: ownerLookupKey, owner: rows.some(store => (store.storeId || store.id) === sessionData.storeId && store.approvalStatus === 'APPROVED') });
      }).catch(() => {
        if (active) setOwnerLookup({ key: ownerLookupKey, owner: false, error: 'Chưa xác minh được gian hàng. Hãy thử kết nối lại.' });
      });
    }
    return () => { active = false; };
  }, [ownerLookupKey, ownerLookupAttempt]);

  // Real-time Transport hook (WebRTC P2P + Socket.IO Chat/Reaction/Pinning)
  const {
    remoteStream,
    roomJoined,
    viewerCount: realtimeViewerCount,
    reactionCount: realtimeLikesCount,
    businessStatus,
    hostOnline,
    isStreamLive,
    streamError: transportStreamError,
    sessionEnded,
    sendLiveChat,
    pinProduct,
    sendReaction,
    retryConnection: retryTransport,
  } = useLiveStreamTransport({
    sessionId: ownerLookupReady ? sessionData?.id : undefined,
    isHost: isSessionHost,
    isModerator: isSessionOwner,
    localStream: isCameraActive ? filteredStream : null,
    onNewChatMessage: (msg) => {
      if (!msg || !msg.text) return;
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [
          ...prev,
          {
            id: msg.id || 'chat_' + Date.now(),
            sender: msg.sender || 'Người xem',
            role: msg.role || 'VIEWER',
            avatar: msg.avatar,
            text: msg.text,
            time: msg.time || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ].slice(-101);
      });
    },
    onPinnedProductChange: (data) => {
      pinRevision.current += 1;
      if (typeof data.productIndex === 'number') {
        setPinnedIndex(Math.max(0, data.productIndex));
        if (!legacyLive) setSessionData((previous: any) => previous ? { ...previous, pinnedProductId: data.productId ?? null } : previous);
        setIsPinnedDealCollapsed(false);
        toast.info(data.productIndex < 0 ? 'Host đã bỏ ghim sản phẩm.' : `Host đã ghim sản phẩm #${data.productIndex + 1}!`);
      }
    },
    onReactionBroadcast: (data) => {
      if (data?.emoji) {
        triggerReaction(data.emoji, undefined, data.iconUrl, true);
      }
    },
  });
  const streamError = ownerLookupError || transportStreamError;
  const retryConnection = () => {
    if (ownerLookupError) setOwnerLookupAttempt(attempt => attempt + 1);
    else retryTransport();
  };
  useEffect(() => { if (!legacyLive) setViewerCount(realtimeViewerCount); }, [realtimeViewerCount]);
  useEffect(() => { if (!legacyLive) setLikesCount(realtimeLikesCount); }, [realtimeLikesCount]);
  useEffect(() => {
    if (businessStatus) setSessionData((previous: any) => previous && previous.status !== businessStatus ? { ...previous, status: businessStatus } : previous);
  }, [businessStatus]);

  useEffect(() => {
    if (!sessionEnded) return;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setIsCameraActive(false);
    setCameraStream(null);
    setSessionData((previous: any) => (previous ? { ...previous, status: 'ENDED' } : previous));
  }, [sessionEnded]);

  const isStreamEnded = Boolean(sessionEnded || ['ENDED', 'CANCELLED'].includes(sessionData?.status));
  useEffect(() => {
    if (legacyLive || !sessionData?.id) return;
    let active = true;
    let loading = false;
    const refresh = async () => {
      if (loading) return;
      loading = true;
      const revision = pinRevision.current;
      try {
        const state = await liveCommerceService.get(sessionData.id);
        if (active && revision === pinRevision.current && !pinMutationPending.current) {
          setCommerceError('');
          setCommerce(previous => JSON.stringify(previous) === JSON.stringify(state) ? previous : state);
          if (state.pinnedProductId !== undefined) setSessionData((previous: any) => previous?.pinnedProductId === state.pinnedProductId ? previous : { ...previous, pinnedProductId: state.pinnedProductId });
        }
      } catch (error) { if (active) setCommerceError(liveCommerceErrorMessage(error)); }
      finally { loading = false; }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => { active = false; window.clearInterval(timer); };
  }, [legacyLive, sessionData?.id, commerceReloadAttempt]);
  useEffect(() => {
    let active = true;
    if (sessionData?.storeId) void couponService.getPublicPlatformCoupons(sessionData.storeId).then(rows => { if (active) setPlatformVouchers(rows); }).catch(() => {});
    return () => { active = false; };
  }, [sessionData?.storeId]);

  useEffect(() => {
    setFloatingReactions([]);
    lastReactionFlightAt.current = 0;
  }, [identifier, isStreamEnded]);

  // Dynamic elapsed duration calculation from startsAt
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(() => {
    if (sessionData?.startsAt) {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(sessionData.startsAt).getTime()) / 1000));
      return diff;
    }
    return 0;
  });

  useEffect(() => {
    if (sessionData?.startsAt) {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(sessionData.startsAt).getTime()) / 1000));
      setLiveElapsedSeconds(diff);
    }
  }, [sessionData?.startsAt]);

  useEffect(() => {
    if (isStreamEnded) return;
    const timer = setInterval(() => {
      setLiveElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isStreamEnded]);

  const formatLiveDuration = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}p ${seconds < 10 ? '0' : ''}${seconds}s`;
    }
    return `${minutes}p ${seconds < 10 ? '0' : ''}${seconds}s`;
  };

  // Real business stats from backend
  const liveOrdersCount = sessionData?.liveStats?.report?.ordersCount ?? sessionData?.ordersCount ?? 0;
  const liveGrossRevenue = sessionData?.liveStats?.report?.grossRevenue ?? sessionData?.totalRevenue ?? 0;
  const liveCommissionRate = sessionData?.commissionRate ? Number(sessionData.commissionRate) : 10;
  const liveKocCommission = Math.round(liveGrossRevenue * (liveCommissionRate / 100));
  const liveShopEarnings = liveGrossRevenue - liveKocCommission;
  const liveShopName = sessionData?.store?.name || 'Gian Hàng Đối Tác';
  const liveHostName = sessionData?.creator?.fullName || sessionData?.creator?.name || 'KOC Host';

  const [pinPendingId, setPinPendingId] = useState<string | null>(null);
  const pinRevision = useRef(0);
  const pinMutationPending = useRef(false);
  const [isVoucherDropOpen, setIsVoucherDropOpen] = useState(false);
  // Countdown timer toward session end or deal window
  const [dealCountdownSeconds, setDealCountdownSeconds] = useState<number>(() => {
    if (sessionData?.endsAt) {
      const diff = Math.max(0, Math.floor((new Date(sessionData.endsAt).getTime() - Date.now()) / 1000));
      return diff > 0 ? diff : 300;
    }
    return 300;
  });

  useEffect(() => {
    if (sessionData?.endsAt) {
      const diff = Math.max(0, Math.floor((new Date(sessionData.endsAt).getTime() - Date.now()) / 1000));
      if (diff > 0) setDealCountdownSeconds(diff);
    }
  }, [sessionData?.endsAt]);

  useEffect(() => {
    if (isStreamEnded) return;
    const timer = setInterval(() => {
      setDealCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, [isStreamEnded]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const { openChat } = useScanmsChat();
  const [selectedProfile, setSelectedProfile] = useState<UserProfileData | null>(null);
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({});

  const handleViewProfile = (msg: ChatMessage) => {
    if (msg.role === 'SHOP') {
      handleOpenShopProfile();
      return;
    }
    const profile = resolveUserProfile(msg, currentUser, sessionData);
    setSelectedProfile(profile);
  };

  const handleToggleFollow = (handle: string) => {
    setFollowedUsers((prev) => {
      const isFollowing = !prev[handle];
      if (isFollowing) {
        toast.success(`Đã theo dõi ${selectedProfile?.name || handle}`);
      } else {
        toast.info(`Đã bỏ theo dõi ${selectedProfile?.name || handle}`);
      }
      return { ...prev, [handle]: isFollowing };
    });
  };

  const handleDirectMessage = (profile: UserProfileData) => {
    setSelectedProfile(null);
    if (profile.role === 'SHOP') {
      openChat({
        id: sessionData?.storeId || sessionData?.store?.id || 'shop',
        name: profile.name,
        logoUrl: profile.avatar,
      });
      toast.success(`Đang mở hộp chat với ${profile.name}`);
    } else {
      openChat();
      toast.success(`Đang kết nối khung chat riêng với ${profile.name}`);
    }
  };

  // MỞ HỒ SƠ CHI TIẾT CỦA KOC / KOL ĐANG LIVESTREAM
  const handleOpenKolProfile = () => {
    const kolName = sessionData?.creator?.fullName || sessionData?.creator?.name || (currentUser?.fullName ? `${currentUser.fullName} (Host)` : 'KOC Host');
    const kolAvatar =
      sessionData?.creator?.avatarUrl ||
      (currentUser as any)?.avatar ||
      (currentUser as any)?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

    const kolProfile: UserProfileData = {
      name: kolName,
      handle: `@${(sessionData?.creator?.email || currentUser?.email || 'koc.host').split('@')[0]}`,
      role: 'HOST',
      badgeTitle: '👑 Top 1 KOC Livestream • Đối Tác SCANMS',
      avatar: kolAvatar,
      bio: 'Nhà sáng tạo KOC/KOL đối tác của Sàn SCANMS. Chia sẻ trải nghiệm sản phẩm thực tế và trợ giá deal độc quyền cho người xem.',
      verified: true,
      trustScore: 100,
      memberSince: 'Tháng 08/2025',
      city: 'TP. Hồ Chí Minh',
      metrics: [
        { label: 'Followers', value: '120K+' },
        { label: 'Lượt thích', value: '850K+' },
        { label: 'KOC Verfied', value: '100%' },
      ],
      socials: [
        { platform: 'TikTok', handle: `@${(sessionData?.creator?.email || 'koc').split('@')[0]}` },
        { platform: 'Instagram', handle: `@${(sessionData?.creator?.email || 'koc').split('@')[0]}.beauty` },
      ],
      tags: ['Top Creator', 'KOC Đối Tác', 'KYC Verified'],
    };
    setSelectedProfile(kolProfile);
  };

  // ĐIỀU HƯỚNG TRỰC TIẾP TỚI GIAN HÀNG CỦA CHỦ SHOP (STOREFRONT) KHI BẤM VÀO AVATAR HOẶC TÊN SHOP
  const handleOpenShopProfile = () => {
    const shopSlug =
      sessionData?.store?.slug ||
      sessionData?.store?.id ||
      sessionData?.storeId ||
      'shop';
    navigate(`/shop/${shopSlug}`);
  };

  // Load session info from API
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        if (active) { setSessionData(null); setSessionLoadError(''); }
        const data = await liveSessionService.room(identifier);
        if (active && data?.id) {
          setSessionData(data);
        }
      } catch (error: any) {
        if (active) setSessionLoadError(error?.message || 'Chưa tải được phiên livestream. Vui lòng thử lại.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [identifier]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // Đồng bộ MediaStream vào video element mỗi khi isCameraActive thay đổi hoặc component cập nhật
  useEffect(() => {
    if (isSessionHost && isCameraActive && filteredStream && videoRef.current) {
      if (videoRef.current.srcObject !== filteredStream) {
        videoRef.current.srcObject = filteredStream;
      }
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn('Tự động phát video cảnh báo:', err);
      });
    }
  }, [isCameraActive, isSessionHost, filteredStream]);

  useEffect(() => {
    const video = remoteVideoRef.current;
    if (!video) return;
    video.srcObject = remoteStream;
    video.muted = isMuted;
    if (remoteStream) {
      video.play().catch((err) => {
        console.warn('Trình duyệt chưa cho tự phát video livestream:', err);
        if (!video.muted) {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        }
      });
    }
  }, [remoteStream, isMuted]);

  // START / STOP CAMERA WEBCAM
  const startCamera = async () => {
    if (sessionEnded || ['ENDED', 'CANCELLED'].includes(sessionData?.status)) {
      toast.error('Phiên đã kết thúc, không thể bật camera.');
      return;
    }
    setCameraError(null);

    if (!isSessionHost) {
      setCameraError('Chỉ KOL được mời vào phiên mới có thể phát camera.');
      return;
    }
    if (!legacyLive && (sessionData?.status !== 'LIVE' || !roomJoined)) {
      const message = sessionData?.status !== 'LIVE' ? 'Chờ shop bắt đầu phiên livestream trước khi bật camera.' : 'Đang kết nối phòng livestream. Vui lòng chờ kết nối rồi bật camera.';
      setCameraError(message);toast.error(message);return;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      const msg = 'Trình duyệt không hỗ trợ hoặc kết nối chưa an toàn (cần HTTPS hoặc localhost).';
      setCameraError(msg);
      toast.error(msg);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // Ưu tiên độ phân giải HD cùng mic
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: true,
        });
      } catch (audioErr) {
        console.warn('Lấy webcam kèm mic không thành công, thử mở riêng hình ảnh:', audioErr);
        try {
          // Fallback: Mở video không cần mic nếu mic bận hoặc bị từ chối
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: false,
          });
        } catch {
          // Fallback mức cơ bản nhất
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      mediaStreamRef.current = stream;
      stream.getAudioTracks().forEach((track) => { track.enabled = !isMicMuted; });
      setCameraStream(stream);
      setIsCameraActive(true);

      // Gán trực tiếp stream vào thẻ video (thẻ luôn tồn tại trong DOM)
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Bắt buộc muted ở màn hình host để tránh dội âm mic ra loa và vượt qua chính sách autoplay của trình duyệt
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('video.play() warning:', playErr);
        }
      }

      if (!stream.getAudioTracks().length) toast.info('Camera đã bật nhưng chưa có âm thanh. Hãy cấp quyền micro rồi bật lại camera.');
      else toast.success('Đã bật camera và micro');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsCameraActive(false);
      const errName = err?.name || '';
      let errMsg = 'Chưa thể bật camera: Vui lòng cấp quyền camera trong trình duyệt.';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        errMsg = 'Quyền Camera đã bị chặn. Vui lòng cho phép truy cập Camera!';
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        errMsg = 'Không tìm thấy thiết bị Camera!';
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        errMsg = 'Camera đang bị ứng dụng khác sử dụng.';
      }
      setCameraError(errMsg);
      toast.error(errMsg);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraStream(null);
    toast.success('Đã tắt camera phát sóng');
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = isMicMuted;
      });
      setIsMicMuted((prev) => !prev);
      toast.success(isMicMuted ? 'Đã bật micro' : 'Đã tắt micro');
    }
  };

  // UPLOAD CUSTOM BACKDROP IMAGE FROM MACHINE
  const handleBackdropFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        if (isCameraActive) {
          stopCamera();
        }
        setActiveBackdropUrl(event.target.result as string);
        toast.success('Đã tải ảnh nền sân khấu từ máy tính thành công!');
      }
    };
    reader.readAsDataURL(file);
  };

  // REAL LIVE STATS SYNC & PRESENCE HEARTBEAT (Đồng bộ số người xem và tim thực tế)
  useEffect(() => {
    if (sessionEnded || !legacyLive) return;
    let active = true;

    const syncLiveStats = async () => {
      const revision = pinRevision.current;
      try {
        const res: any = await api.post(
          `/livestreams/${encodeURIComponent(identifier)}/interaction`,
          {
            action: 'HEARTBEAT',
            clientId: clientIdRef.current,
          },
        );
        const data = res?.data?.data || res?.data || res;
        if (active && data) {
          if (revision === pinRevision.current && Object.prototype.hasOwnProperty.call(data, 'pinnedProductId')) {
            setSessionData((prev: any) => prev ? { ...prev, pinnedProductId: data.pinnedProductId } : prev);
          }
          if (Object.prototype.hasOwnProperty.call(data, 'voucherDrop')) {
            setSessionData((prev: any) => prev ? { ...prev, voucherDrop: data.voucherDrop } : prev);
          }
          if (typeof data.viewers === 'number') {
            setViewerCount(Math.max(0, data.viewers));
          }
          if (typeof data.likes === 'number') {
            setLikesCount((prev) => {
              const best = Math.max(prev, data.likes);
              localStorage.setItem(likesStorageKey, String(best));
              return best;
            });
          }
        }
      } catch {
        // Fallback offline / demo
      }
    };

    void syncLiveStats();
    const heartbeatTimer = setInterval(syncLiveStats, 10000);

    const handleBeforeUnload = () => {
      try {
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/livestreams/${encodeURIComponent(identifier)}`;
        const payload = JSON.stringify({ action: 'LEAVE', clientId: clientIdRef.current });
        navigator.sendBeacon?.(url, new Blob([payload], { type: 'application/json' }));
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      active = false;
      clearInterval(heartbeatTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [identifier, likesStorageKey, sessionEnded]);



  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Derived products from actual session data
  const products: LiveProduct[] = useMemo(() => {
    if (sessionData?.products && sessionData.products.length > 0) {
      return sessionData.products.map((p: any, idx: number) => {
        const prod = p.product || {};
        const variants: LiveVariant[] = (prod.variants || []).map((variant: any) => ({ ...variant, id: variant.id || variant.variantId, price: Number(variant.price ?? variant.priceVnd), name: variant.name || [variant.color, variant.size].filter(Boolean).join(' / ') }));
        const now = Date.now();
        const offer = commerce.offers.filter(row => row.productId === prod.id && isLiveOfferActive(row, now)
          && variants.some(variant => variant.id === row.variantId && variant.isActive !== false && variant.stockQuantity > 0))
          .sort((a, b) => a.priceVnd - b.priceVnd)[0];
        const basePrice = Number(p.variant?.price ?? variants.find(row => row.id === offer?.variantId)?.price ?? prod.price ?? 0);
        const discountVal = sessionData.coupon?.discountValue ? Number(sessionData.coupon.discountValue) : 0;
        const discountType = sessionData.coupon?.discountType || 'PERCENTAGE';
        const livePrice = !legacyLive ? offer?.priceVnd ?? basePrice : discountType === 'PERCENTAGE'
            ? Math.round(basePrice * (1 - discountVal / 100))
            : Math.max(1000, basePrice - discountVal);
        return {
          id: prod.id || `session-prod-${idx}`,
          variantId: p.variantId || p.variant?.id || (variants.length === 1 ? variants[0].id : undefined),
          variantName: p.variant?.name || (variants.length === 1 ? variants[0].name : undefined),
          variants,
          offerEndsAt: offer?.endsAt,
          offerVariantName: offer ? variants.find(row => row.id === offer.variantId)?.name : undefined,
          voucherLabels: ['GOODS', 'SHIPPING'].flatMap(benefit => {
            const eligible = platformVouchers.filter(row => row.benefitType === benefit && row.minimumOrderAmount <= livePrice);
            const amount = (row: any) => Math.min(row.maximumDiscountAmount ?? Infinity, row.discountType === 'PERCENTAGE' ? Math.floor(livePrice * row.discountValue / 100) : row.discountValue);
            const best = eligible.sort((a, b) => amount(b) - amount(a))[0];
            return best ? [`${best.code} · ${benefit === 'SHIPPING' ? 'Giảm ship tối đa ' : 'Giảm tối đa '}${amount(best).toLocaleString('vi-VN')}đ`] : [];
          }),
          title: prod.title || prod.name || `Sản phẩm Deal Live #${idx + 1}`,
          imageUrl: prod.imageUrl || sessionData?.store?.logoUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
          price: basePrice,
          livePrice,
          discountPercentage: basePrice > 0 ? Math.round(((basePrice - livePrice) / basePrice) * 100) : 0,
          storeName: sessionData.store?.name || 'Gian Hàng Đối Tác',
          storeId: sessionData.store?.id,
          soldPercent: 0,
          stockLeft: p.variant?.stockQuantity ?? prod.stockQuantity ?? 0,
          category: prod.categoryName || prod.category || 'Sản phẩm',
          badge: offer ? 'Giá live' : undefined,
        };
      });
    }
    return [];
  }, [sessionData, commerce.offers, platformVouchers, legacyLive, liveElapsedSeconds]);

  useEffect(() => {
    if (sessionData?.pinnedProductId) {
      const idx = products.findIndex((p) => p.id === sessionData.pinnedProductId);
      if (idx >= 0) setPinnedIndex(idx);
    }
  }, [sessionData?.pinnedProductId, products]);

  const pinnedProduct = !legacyLive ? products.find(product => product.id === sessionData?.pinnedProductId) : products[pinnedIndex];

  const handlePinChange = async (productId: string | null) => {
    if (!sessionData?.id || pinPendingId !== null) return;
    const pendingId = productId ?? pinnedProduct?.id;
    if (!pendingId) return;
    setPinPendingId(pendingId);
    pinMutationPending.current = true;
    pinRevision.current += 1;
    try {
      const url = `/livestreams/${sessionData.id}/pinned-product`;
      if (!legacyLive) {
        await pinProduct(productId === null ? -1 : products.findIndex(product => product.id === productId), productId || undefined);
      } else if (productId === null) {
        await api.delete(url);
      } else {
        await api.post(url, { productId });
        const newIdx = products.findIndex((p) => p.id === productId);
        if (newIdx >= 0 && pinProduct) {
          setPinnedIndex(newIdx);
          pinProduct(newIdx, productId);
        }
      }
      setSessionData((prev: any) => ({ ...prev, pinnedProductId: productId }));
      setIsPinnedDealCollapsed(false);
      toast.success(productId ? 'Đã chuyển sản phẩm đang giới thiệu.' : 'Đã bỏ ghim sản phẩm.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Chưa thể cập nhật ghim. Vui lòng thử lại.');
    } finally {
      pinRevision.current += 1;
      pinMutationPending.current = false;
      setPinPendingId(null);
    }
  };

  // Dynamic categories available for filter pills (TikTok Live style)
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    if (cats.size < 2) {
      cats.add('Mỹ phẩm');
      cats.add('Chăm sóc da');
    }
    return Array.from(cats);
  }, [products]);

  // Filtered products for TikTok-style in-stream shopping bag drawer
  const filteredProducts = useMemo(() => {
    let list = products;
    if (bagSearchQuery.trim()) {
      const q = bagSearchQuery.toLowerCase().trim();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    if (bagFilterTab === 'PINNED') {
      return list.filter((p) => p.id === pinnedProduct?.id);
    }
    if (bagFilterTab !== 'ALL') {
      return list.filter(
        (p) =>
          p.category === bagFilterTab ||
          p.title.toLowerCase().includes(bagFilterTab.toLowerCase()),
      );
    }
    return list;
  }, [products, pinnedProduct, bagFilterTab, bagSearchQuery]);

  const couponCode = sessionData?.coupon?.displayCode || '';
  const couponDiscount = sessionData?.coupon
    ? sessionData.coupon.discountType === 'PERCENTAGE'
      ? `${Number(sessionData.coupon.discountValue)}%`
      : `${Number(sessionData.coupon.discountValue).toLocaleString('vi-VN')} ₫`
    : '25.000 ₫';

  // TRIGGER FLOATING EMOJI REACTION (TikTok / Facebook Live style)
  const triggerReaction = (emoji: string, e?: React.MouseEvent, customIconUrl?: string, isRemoteBroadcast = false) => {
    if (isStreamEnded) return;
    const stageRect = stageRef.current?.getBoundingClientRect();
    let baseBottom = 76;
    let baseRight: number | undefined = undefined;
    let baseLeft: number | undefined = undefined;

    const matchedDef = REALISTIC_3D_REACTIONS.find((r) => r.emoji === emoji || r.id === emoji);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resolvedIconUrl = reducedMotion ? matchedDef?.fallbackIconUrl || customIconUrl || matchedDef?.iconUrl : customIconUrl || matchedDef?.iconUrl;

    if (e && stageRect) {
      const targetBtn = (e.target as HTMLElement).closest('button');
      if (targetBtn && stageRef.current?.contains(targetBtn)) {
        const btnRect = targetBtn.getBoundingClientRect();
        baseRight = Math.max(12, stageRect.right - (btnRect.left + btnRect.width / 2) - 20);
        baseBottom = Math.max(50, stageRect.bottom - btnRect.top + 8);
      } else if (!targetBtn && stageRef.current?.contains(e.target as Node)) {
        baseLeft = Math.max(20, Math.min(stageRect.width - 60, e.clientX - stageRect.left - 24));
        baseBottom = Math.max(30, stageRect.bottom - e.clientY);
      } else {
        baseRight = Math.floor(Math.random() * 120) + 36;
        baseBottom = 76;
      }
    } else {
      baseRight = Math.floor(Math.random() * 120) + 36;
      baseBottom = 76;
    }

    if (legacyLive && !isRemoteBroadcast) {
      // TĂNG SỐ LƯỢT THẢ TIM THẬT NGAY LẬP TỨC
      const increment = emoji === '❤️' ? 2 : 1;
      setLikesCount((prev) => {
        const next = prev + increment;
        localStorage.setItem(likesStorageKey, String(next));
        return next;
      });

      // Hiệu ứng micro pop +1 / +2 bay lên từ icon tim góc trên
      setLikeDelta(increment);
      if (likeDeltaTimerRef.current) clearTimeout(likeDeltaTimerRef.current);
      likeDeltaTimerRef.current = setTimeout(() => setLikeDelta(null), 1000);

      // Gửi tương tác thực tế lên server backend để cộng dồn
      if (legacyLive) api
        .post(`/livestreams/${encodeURIComponent(identifier)}/interaction`, {
          action: 'LIKE',
          clientId: clientIdRef.current,
          count: increment,
        })
        .then((res: any) => {
          const data = res?.data?.data || res?.data || res;
          if (data && typeof data.likes === 'number') {
            setLikesCount((prev) => Math.max(prev, data.likes));
            localStorage.setItem(likesStorageKey, String(data.likes));
          }
        })
        .catch(() => {});
    }

    if (!isRemoteBroadcast) {
      void sendReaction(emoji, resolvedIconUrl).then(() => {
        if (!legacyLive && emoji === '❤️') {
          setLikeDelta(1);
          if (likeDeltaTimerRef.current) clearTimeout(likeDeltaTimerRef.current);
          likeDeltaTimerRef.current = setTimeout(() => setLikeDelta(null), 1000);
        }
      }).catch(error => toast.error(error.message));
    }
    const flightTime = performance.now();
    if (flightTime - lastReactionFlightAt.current < 80) return;
    lastReactionFlightAt.current = flightTime;
    const spawnCount = reducedMotion ? 1 : matchedDef?.id === 'heart' ? 3 : 2;
    const newItems: FloatingReaction[] = [];
    const stageWidth = stageRect?.width || 400;
    const stageHeight = stageRect?.height || 600;
    const originX = Math.max(24, Math.min(stageWidth - 24, baseLeft !== undefined ? baseLeft + 20 : stageWidth - (baseRight ?? 36) - 20));
    const riseRoom = Math.max(60, stageHeight - baseBottom - 30);
    for (let i = 0; i < spawnCount; i++) {
      reactionCounterRef.current += 1;
      const newId = reactionCounterRef.current;
      const size = i === 0 ? 38 + Math.random() * 6 : 27 + Math.random() * 8;
      const rise = Math.min(riseRoom, Math.min(500, stageHeight * .65)) * (.78 + Math.random() * .22);
      const direction = Math.random() < .5 ? -1 : 1;
      const clampX = (value: number) => Math.max(24 - originX, Math.min(stageWidth - originX - 24, value));
      const driftX = clampX(direction * (18 + Math.random() * 48));
      const control1 = clampX(-direction * (18 + Math.random() * 36));
      const control2 = clampX(direction * (35 + Math.random() * 54));
      newItems.push({
        id: newId, emoji, iconUrl: resolvedIconUrl,
        bottom: Math.max(16, Math.min(stageHeight - 40, baseBottom)),
        left: originX - size / 2, size, driftX, rise,
        path: `path("M 0 0 C ${control1.toFixed(1)} ${(-rise * .3).toFixed(1)}, ${control2.toFixed(1)} ${(-rise * .7).toFixed(1)}, ${driftX.toFixed(1)} ${(-rise).toFixed(1)}")`,
        tilt: direction * (4 + Math.random() * 7),
        delay: i * 100 + Math.random() * 45,
        duration: 2.1 + Math.random() * .65,
      });
    }
    setFloatingReactions((previous) => [...previous, ...newItems].slice(-24));
  };

  // Handle click anywhere on the video screen (TikTok style tap to heart)
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, select, a, [role="button"]')) {
      return;
    }
    const isHeart = Math.random() < 0.75;
    if (isHeart) {
      triggerReaction('❤️', e);
    } else {
      const funEmojis = ['🔥', '👍', '😂', '😮', '🎁', '🎉', '💯', '⭐'];
      const chosen = funEmojis[Math.floor(Math.random() * funEmojis.length)];
      triggerReaction(chosen, e);
    }
  };

  // Claim voucher
  const handleClaimVoucher = async () => {
    if (isVoucherClaimed) {
      toast.success(`Bạn đã nhận mã ${couponCode}.`);
      return;
    }
    setVoucherClaimLoading(true);
    try {
      if (sessionData?.id) {
        await api.post(`/livestreams/${sessionData.id}/claim`, {
          claimKey: `claim_${currentUser?.id || 'guest'}_${Date.now()}`,
        });
      }
      if (sessionData?.coupon?.id && currentUser?.role === 'CUSTOMER') {
        // BE chưa có saved-coupon — bỏ qua
      }
      setIsVoucherClaimed(true);
      toast.success(`Đã nhận mã voucher ${couponCode}. Nhập mã khi thanh toán để sử dụng.`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Chưa lưu được voucher. Vui lòng thử lại.');
    } finally {
      setVoucherClaimLoading(false);
    }
  };

  // Send live chat comment
  const handleSendComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputComment.trim() || isSendingComment) return;
    const text = inputComment.trim();
    const sender = currentUser?.fullName || 'Khách xem #' + Math.floor(Math.random() * 900 + 100);
    const role = (currentUser?.role === 'SHOP_MANAGER'
      ? 'SHOP'
      : currentUser?.role === 'COLLABORATOR'
      ? 'HOST'
      : 'VIEWER') as any;
    const avatar = currentUser?.avatarUrl || (currentUser as any)?.avatar || undefined;

    const newMsg: ChatMessage = {
      id: 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      sender,
      role,
      avatar,
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setIsSendingComment(true);
    try {
      await sendLiveChat(text);
      if (legacyLive) setChatMessages((prev) => [...prev, newMsg]);
      setInputComment(previous => previous.trim() === text ? '' : previous);
    } catch (error: any) { toast.error(error.message || 'Chưa gửi được bình luận.'); }
    finally { setIsSendingComment(false); }
  };

  // Add to cart
  const handleAddToCart = (product: LiveProduct) => {
    if (!product.variantId) { setVariantChoice({ product, action: 'cart' }); return; }
    addItem({
      variantId: product.variantId,
      liveSessionId: sessionData?.id,
      liveCouponCode: commerce.voucherDrops.find(row => row.benefitType === 'GOODS')?.code || sessionData?.coupon?.displayCode,
      liveCouponCodes: commerce.voucherDrops.map(row => row.code),
      product: {
        id: product.id,
        title: product.title,
        price: product.livePrice ?? product.price,
        imageUrl: product.imageUrl || '',
        stockQuantity: product.stockLeft ?? 9999,
        variants: product.variantId ? [{ id: product.variantId, name: product.variantName || 'Phân loại live', sku: '', price: product.livePrice ?? product.price, stockQuantity: product.stockLeft ?? 0 }] : undefined,
      },
      store: {
        id: product.storeId || sessionData?.store?.id,
        name: product.storeName || sessionData?.store?.name || liveShopName,
      },
      openCartAfterAdd: false,
    });
    toast.success(`Đã thêm "${product.title}" vào giỏ hàng deal live!`);
  };

  // Instant Buy (Chốt đơn trực tiếp tại phiên live)
  const handleInstantBuy = (product: LiveProduct) => {
    if (!product.variantId) { setVariantChoice({ product, action: 'buy' }); return; }
    buyNow(
      {
        variantId: product.variantId,
        liveSessionId: sessionData?.id,
        liveCouponCode: commerce.voucherDrops.find(row => row.benefitType === 'GOODS')?.code || sessionData?.coupon?.displayCode,
        liveCouponCodes: commerce.voucherDrops.map(row => row.code),
        product: {
          id: product.id,
          title: product.title,
          price: Number(product.livePrice ?? product.price ?? 0),
          originalPrice: product.price ? Number(product.price) : undefined,
          imageUrl: product.imageUrl || '',
          stockQuantity: product.stockLeft ?? 0,
          variants: product.variantId ? [{ id: product.variantId, name: product.variantName || 'Phân loại live', sku: '', price: product.livePrice ?? product.price, stockQuantity: product.stockLeft ?? 0 }] : undefined,
        },
        store: {
          id: product.storeId || sessionData?.store?.id || 'sora-skin',
          name: product.storeName || sessionData?.store?.name || liveShopName,
        },
        openCartAfterAdd: false,
      },
      legacyLive ? couponCode : undefined,
    );
  };

  if (loading && !sessionData && identifier !== 'demo') {
    return (
      <div className="w-screen h-screen bg-[#FAF8F5] text-[#1A1612] flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-10 h-10 rounded-full border-3 border-[#C59B58] border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-[#7D715E]">Đang kết nối luồng phát sóng SCANMS Live...</p>
      </div>
    );
  }

  if (!loading && !sessionData && identifier !== 'demo') {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-[#FAF8F5] text-[#1A1612]">
        <p className="text-lg font-bold">Không tìm thấy phiên SCANMS Live này.</p>
        {sessionLoadError && <p role="alert" className="max-w-lg px-4 text-center text-sm text-[#7D715E]">{sessionLoadError}</p>}
        <button type="button" onClick={() => navigate('/')} className="rounded-xl bg-[#C59B58] px-4 py-2 font-semibold text-white">Về trang chủ</button>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#FAF8F5] text-[#1A1612] overflow-hidden flex flex-col font-sans select-none">
      {variantChoice && <LiveVariantPicker title={variantChoice.product.title} variants={variantChoice.product.variants || []} offers={commerce.offers.filter(row => row.productId === variantChoice.product.id)} onClose={() => setVariantChoice(null)} onChoose={(variant, price) => {
        const offer = commerce.offers.find(row => row.variantId === variant.id && isLiveOfferActive(row));
        const selected = { ...variantChoice.product, variantId: variant.id, variantName: variant.name, price: Number(variant.price), livePrice: price, stockLeft: Math.min(variant.stockQuantity, offer ? offer.quantityLimit - offer.reservedQuantity : variant.stockQuantity) };
        const action = variantChoice.action; setVariantChoice(null);
        if (action === 'buy') handleInstantBuy(selected); else handleAddToCart(selected);
      }} />}
      {!legacyLive && commerceError && <div role="alert" className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900"><span>{isSessionOwner ? commerceError : 'Chưa cập nhật được ưu đãi của phiên. Vui lòng thử lại.'}</span><button type="button" onClick={() => setCommerceReloadAttempt(attempt => attempt + 1)} className="shrink-0 font-semibold underline">Thử lại</button></div>}
      {/* Hidden file input for custom backdrop upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackdropFileChange}
        className="hidden"
      />

      {/* TOP HEADER BAR (TONE SÁNG TRẮNG BE CHUẨN THƯƠNG HIỆU SCANMS) */}
      <header className={cn('live-room-header', couponCode && 'has-voucher')} aria-label="Thông tin và điều khiển phòng Live">
        <div className="live-room-identity">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="live-room-back"
            title="Quay lại Sàn Mua Sắm"
          >
            <ArrowLeft className="w-4 h-4 text-[#7D715E]" />
          </button>

          {/* Logo & Live Badge */}
          <div className="live-room-brand">
            <span className="live-room-wordmark">
              SCANMS <span className="text-[#B88E4F]">LIVE</span>
            </span>
            <span className={cn('live-room-status', sessionData?.status === 'LIVE' && !isStreamEnded && 'is-live')}>
              <span className="live-room-status-dot" />
              {isStreamEnded ? 'Đã kết thúc' : sessionData?.status === 'LIVE' ? 'Trực tiếp' : sessionData?.status === 'PAUSED' ? 'Tạm dừng' : 'Chờ phát'}
            </span>
          </div>

          {/* KOL / Host Avatar & Shop Information (Bấm để xem Profile chi tiết) */}
          <div className="live-room-host">
            {/* Avatar KOL với vòng pulse phát sóng trực tiếp */}
            <button
              type="button"
              onClick={handleOpenKolProfile}
              className="relative p-0.5 rounded-full bg-gradient-to-tr from-[#C59B58] to-[#EBD08C] hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0 group/kol"
              title="Bấm vào để xem hồ sơ chi tiết KOC đang livestream"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-white bg-[#FAF8F5]">
                <img
                  src={
                    sessionData?.creator?.avatarUrl ||
                    (currentUser as any)?.avatar ||
                    (currentUser as any)?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                  }
                  alt="Host"
                  className="w-full h-full object-cover group-hover/kol:scale-110 transition-transform"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </span>
            </button>

            {/* Thông tin 2 hàng: Tên KOL (trên) & Tên Shop (dưới) */}
            <div className="live-room-host-text">
              {/* Hàng 1: KOL đang live */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleOpenKolProfile}
                  className="live-room-host-name group/kolname"
                  title={sessionData?.creator?.fullName || 'Xem hồ sơ nhà sáng tạo'}
                >
                  <span className="truncate group-hover/kolname:underline">
                    {sessionData?.creator?.fullName || 'Nhà sáng tạo'}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                </button>
              </div>

              {/* Hàng 2: Gian Hàng Đối Tác cung cấp sản phẩm (Bấm avatar hoặc tên để vào shop) */}
              <button
                type="button"
                onClick={handleOpenShopProfile}
                className="live-room-shop group/shop"
                title="Bấm vào để đến gian hàng của Chủ Shop"
              >
                <div className="w-4 h-4 rounded-full overflow-hidden bg-[#FAF8F5] border border-[#E8D4B0] shrink-0 group-hover/shop:scale-110 transition-transform">
                  <img
                    src={
                      sessionData?.store?.logoUrl ||
                      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80'
                    }
                    alt="Shop"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="group-hover/shop:underline truncate font-semibold text-[#1A1612] group-hover/shop:text-[#B88E4F]">
                  {sessionData?.store?.name || 'Gian hàng'}
                </span>
                <span className="px-1 py-0.2 rounded bg-amber-50 text-amber-700 text-[8px] font-black border border-amber-200 shrink-0">
                  SHOP
                </span>
              </button>
            </div>

            {/* Nút Theo dõi */}
            <button
              type="button"
              onClick={() => setIsFollowing((v) => !v)}
              className={`live-room-follow ${
                isFollowing
                  ? 'bg-[#F3EFE6] text-[#7D715E] border border-[#EAE4D7]'
                  : 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white shadow-xs hover:opacity-95'
              }`}
            >
              {isFollowing ? 'Đã theo dõi' : '+ Theo dõi'}
            </button>
          </div>
        </div>

        {/* Voucher Live Pill trong Header (Sang trọng, Vàng Be, KHÔNG CHE VIDEO) */}
        {couponCode && (
          <div className="live-room-voucher" title={`Voucher ${couponCode}: Giảm ${couponDiscount}`}>
            <div className="w-5 h-5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shrink-0">
              <Ticket className="w-3 h-3 text-[#B88E4F]" />
            </div>
            <div className="live-room-voucher-text">
              <span className="live-room-voucher-label">Ưu đãi phiên Live</span>
              <span className="live-room-voucher-value">Giảm {couponDiscount}</span>
            </div>
            <span className="live-room-voucher-code">{couponCode}</span>
            <button
              type="button"
              onClick={() => void handleClaimVoucher()}
              disabled={voucherClaimLoading || isStreamEnded}
              className={`live-room-claim ${
                isVoucherClaimed
                  ? 'bg-[#F3EFE6] text-[#7D715E]'
                  : 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] text-white'
              }`}
            >
              {isStreamEnded ? 'Đã kết thúc' : voucherClaimLoading ? 'Đang lưu…' : isVoucherClaimed ? 'Đã lưu' : 'Lưu mã'}
            </button>
          </div>
        )}

        {/* Right Stats & Controls */}
        <div className="live-room-controls">
          {/* Viewers Pill (Số người đang xem trực tiếp thực tế) */}
          <div
            className="live-room-viewers"
            title={roomJoined || legacyLive ? `${viewerCount.toLocaleString('vi-VN')} người đang xem · tính cả shop, mỗi tài khoản một lần, không tính người phát` : 'Đang kết nối bộ đếm người xem'}
            aria-label={roomJoined || legacyLive ? `${viewerCount.toLocaleString('vi-VN')} người đang xem` : 'Chưa kết nối bộ đếm người xem'}
          >
            <Eye className="w-3.5 h-3.5 text-[#B88E4F]" />
            <span className="font-mono">{roomJoined || legacyLive ? viewerCount.toLocaleString('vi-VN') : '—'}</span>
          </div>

          {/* Likes Pill with Micro Pop Animation (Lượt thả tim thực tế) */}
          <div className="live-room-likes-wrap">
            <button type="button"
              className="live-room-likes"
              onClick={(e) => triggerReaction('❤️', e, REALISTIC_3D_REACTIONS[0].iconUrl)}
              title={`${likesCount.toLocaleString('vi-VN')} lượt thả tim thực tế (Bấm để thả tim)`}
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
              <span className="font-mono">
                {likesCount >= 10000 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount.toLocaleString('vi-VN')}
              </span>
            </button>

            {/* Flying +1 / +2 Pop Indicator */}
            {likeDelta && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-rose-500 to-red-500 text-white font-black text-[10px] shadow-md animate-out fade-out slide-out-to-top duration-700 pointer-events-none select-none z-40">
                +{likeDelta}
              </span>
            )}
          </div>

          {/* Live Webcam Toggle Button (BẬT / TẮT CAMERA THẬT) */}
          {isSessionHost && (
            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`live-room-camera live-room-tool ${
                isCameraActive
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-white hover:bg-[#FAF8F5] text-[#1A1612] border border-[#EAE4D7]'
              }`}
              title={isCameraActive ? 'Tắt camera trực tiếp' : 'Bật camera máy tính để phát sóng'}
            >
              {isCameraActive ? (
                <>
                  <VideoOff className="w-3.5 h-3.5 text-rose-600" />
                  <span className="live-room-camera-label">Tắt camera</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span className="live-room-camera-label">Bật camera</span>
                </>
              )}
            </button>
          )}

          {/* Mute Audio Toggle */}
          {isSessionHost && (
            <div className="live-room-filter">
              <button type="button" disabled={!isCameraActive} aria-expanded={isFilterPanelOpen}
                onClick={() => setIsFilterPanelOpen((open) => !open)}
                className={cn('inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:opacity-40',
                  faceFilter === 'off' ? 'border-[#EAE4D7] bg-white text-[#7D715E]' : 'border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]')}
                title="Filter khuôn mặt">
                <Sparkles className="h-4 w-4" /><span className="sr-only">Filter</span>
              </button>
              {isFilterPanelOpen && isCameraActive && (
                <div className="absolute right-0 top-full z-50 mt-3 flex max-h-[calc(100dvh-100px)] w-[min(380px,calc(100vw-24px))] flex-col rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-lg">
                  <div className="mb-3 flex items-center justify-between text-sm font-bold text-[#1A1612]">
                    <div>Hiệu ứng khuôn mặt <span className="ml-1 text-xs font-normal text-[#7D715E]">15 filter</span></div>
                    <button type="button" aria-label="Đóng filter" onClick={() => setIsFilterPanelOpen(false)}><X className="h-4 w-4" /></button>
                  </div>
                  <div className="mb-3 grid shrink-0 grid-cols-4 gap-1 rounded-xl bg-[#F3EFE6] p-1">
                    {([{ id: 'all', label: 'Tất cả' }, { id: 'animals', label: 'Thú cưng' }, { id: 'accessories', label: 'Phụ kiện' }, { id: 'beauty', label: 'Làm đẹp' }] as const).map((category) => (
                      <button key={category.id} type="button" aria-pressed={filterCategory === category.id} onClick={() => setFilterCategory(category.id)}
                        className={cn('rounded-lg px-1 py-2 text-[11px] font-semibold', filterCategory === category.id ? 'bg-white text-[#1A1612] shadow-xs' : 'text-[#7D715E]')}>
                        {category.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid min-h-0 grid-cols-3 gap-2 overflow-y-auto pr-1">
                    {FACE_FILTERS.filter((preset) => preset.id === 'off' || filterCategory === 'all' || preset.category === filterCategory).map((preset) => (
                      <button type="button" key={preset.id} aria-pressed={faceFilter === preset.id}
                        onClick={() => setFaceFilter(preset.id)}
                        className={cn('rounded-xl border px-1 py-2 text-[11px] font-semibold transition', faceFilter === preset.id
                          ? 'border-[#C59B58] bg-[#FBF5EB] text-[#B88E4F]' : 'border-[#EAE4D7] text-[#7D715E] hover:bg-[#FAF8F5]')}>
                        <FaceFilterPreview filter={preset.id} />
                        <span className="mt-1.5 block">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                  {faceFilter !== 'off' && (
                    <label className="mt-4 block text-xs text-[#7D715E]">
                      Mức độ <span className="float-right">{filterStrength}%</span>
                      <input type="range" min="10" max="100" value={filterStrength} onChange={(event) => setFilterStrength(Number(event.target.value))}
                        className="mt-2 w-full accent-[#C59B58]" />
                    </label>
                  )}
                  <p role="status" className="mt-3 text-xs leading-relaxed text-[#7D715E]">
                    {faceFilter === 'off' ? 'Đang phát camera nguyên bản.' : filterStatus === 'loading' ? 'Đang chuẩn bị filter…'
                      : filterStatus === 'error' ? 'Chưa tải được filter. Camera vẫn phát bình thường; chọn Nguyên bản rồi bật lại để thử lại.'
                      : faceDetected ? `${FACE_FILTERS.find((preset) => preset.id === faceFilter)?.label} đang bám mặt · Hiệu ứng được phát tới người xem.` : 'Đưa khuôn mặt vào khung hình để áp dụng filter.'}
                  </p>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsMuted((v) => !v)}
            className="live-room-tool live-room-sound"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-[#7D715E]" />}
          </button>

          {/* Share Room */}
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard) {
                void navigator.clipboard.writeText(window.location.href);
                toast.success('Đã sao chép link phòng live');
              }
            }}
            className="live-room-tool live-room-share"
            title="Chia sẻ phiên livestream"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Host Mode Studio Modal Toggle (Chỉ hiển thị cho Host / CTV / Shop / Admin) */}
          {(isSessionHost || isSessionOwner) && (
            <button
              type="button"
              onClick={() => setIsHostStudioOpen((v) => !v)}
              className="live-room-studio"
              title="Mở Host Studio"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Host Studio</span>
            </button>
          )}
        </div>
      </header>
      {commerce.voucherDrops.length > 0 && !isStreamEnded && <div className="flex shrink-0 flex-wrap justify-center gap-2 border-b border-[#EEDFC6] bg-[#FBF5EB] px-4 py-2" aria-label="Voucher đang tung trong live">{commerce.voucherDrops.map(drop => <button key={drop.id} type="button" onClick={() => { void navigator.clipboard?.writeText(drop.code).then(() => toast.success(`Đã sao chép ${drop.code}. Mã sẽ được gợi ý khi thanh toán.`)); }} className="rounded-xl border border-[#EEDFC6] bg-white px-3 py-2 text-xs"><strong>{drop.code}</strong> · {drop.benefitType === 'SHIPPING' ? 'Ưu đãi phí ship' : `Giảm ${Number(drop.value).toLocaleString('vi-VN')}${drop.discountType === 'PERCENTAGE' ? '%' : 'đ'}`} · Đơn từ {Number(drop.minimumSubtotal || 0).toLocaleString('vi-VN')}đ · Đến {new Date(drop.expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</button>)}</div>}
      {sessionData?.voucherDrop && !isStreamEnded && (
        <div role="status" className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-[#EEDFC6] bg-[#FBF5EB] px-4 py-2 text-xs text-[#1A1612]">
          <Ticket size={16} className="text-[#B88E4F]" />
          <span>Vừa tung ưu đãi <strong>{sessionData.voucherDrop.code}</strong> · {sessionData.voucherDrop.quantity} lượt được giới thiệu</span>
          <button type="button" onClick={() => void handleClaimVoucher()} disabled={voucherClaimLoading || isVoucherClaimed} className="rounded-lg border border-[#EEDFC6] bg-white px-3 py-1 font-semibold text-[#B88E4F] disabled:opacity-50">{isVoucherClaimed ? 'Đã lưu mã' : 'Nhận voucher'}</button>
        </div>
      )}

      {(sessionEnded || ['ENDED', 'CANCELLED'].includes(sessionData?.status)) && (
        <div className="shrink-0 border-b border-[#EEDFC6] bg-[#FBF5EB] px-6 py-2.5 text-xs font-semibold text-[#7D715E] flex flex-wrap items-center justify-between gap-2">
          <span>Phiên livestream đã kết thúc. Đơn đã đặt tiếp tục được xử lý; KOL có thể xem lý do và gửi khiếu nại trong hồ sơ phiên.</span>
          <button type="button" onClick={() => navigate('/marketplace')} className="text-[#B88E4F] hover:underline font-bold">Khám phá phiên khác →</button>
        </div>
      )}

      {/* MAIN SCREEN: LUXURY STAGE + REAL-TIME CHAT SIDEBAR */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden bg-[#1A1612]">
        {/* CENTRAL VIDEO STREAM & INTERACTIVE STAGE */}
        <div
          ref={stageRef}
          onClick={handleScreenClick}
          className="relative flex-1 h-full overflow-hidden flex items-center justify-center cursor-pointer select-none bg-[#1A1612]"
        >
          {/* Real Webcam Stream View OR Virtual Backdrop */}
          <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center">
            {/* Thẻ video luôn tồn tại trong DOM để videoRef và Stream luôn sẵn sàng không bị null */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                videoRef.current?.play().catch(() => {});
              }}
              className={cn(
                "w-full h-full object-cover transition-transform duration-300",
                isMirror && "-scale-x-100",
                (!isSessionHost || !isCameraActive) && "hidden"
              )}
            />

            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={isMuted}
              onLoadedMetadata={() => {
                remoteVideoRef.current?.play().catch(() => {});
              }}
              className={cn(
                'w-full h-full object-cover',
                (isSessionHost || !remoteStream) && 'hidden',
              )}
            />

            {!(isSessionHost && isCameraActive) && !remoteStream && (
              <img
                src={activeBackdropUrl}
                alt="Stage Backdrop"
                className="w-full h-full object-cover filter brightness-105 contrast-102"
              />
            )}

            {isStreamEnded && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#FAF8F5]/95 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
                <div className="max-w-md w-full bg-white rounded-3xl border border-[#EEDFC6] p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider mb-4">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    Phiên Livestream Đã Kết Thúc
                  </div>

                  <div className="w-20 h-20 rounded-full border-2 border-[#C59B58] p-1 mb-3 shadow-xs">
                    <img
                      src={
                        sessionData?.creator?.avatarUrl ||
                        sessionData?.store?.logoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
                      }
                      alt="Host Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-[#1A1612]">
                    {sessionData?.title || 'Phiên Livestream Tiếp Thị Liên Kết'}
                  </h3>
                  <p className="text-xs text-[#7D715E] mt-1 mb-5">
                    Chủ trì bởi <b>{liveHostName}</b> · Gian hàng <b>{liveShopName}</b>
                  </p>

                  {/* KPI Summary Grid */}
                  <div className="grid grid-cols-3 gap-2 w-full p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] mb-6">
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-[#7D715E]">Thời lượng</div>
                      <div className="text-xs font-extrabold text-[#1A1612] mt-0.5">
                        {formatLiveDuration(liveElapsedSeconds)}
                      </div>
                    </div>
                    <div className="text-center border-x border-[#EAE4D7]">
                      <div className="text-[10px] uppercase font-bold text-[#7D715E]">Lượt xem</div>
                      <div className="text-xs font-extrabold text-[#1A1612] mt-0.5">
                        {viewerCount.toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-[#7D715E]">Lượt thích</div>
                      <div className="text-xs font-extrabold text-[#B88E4F] mt-0.5">
                        {likesCount.toLocaleString('vi-VN')} ❤️
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                    <button
                      type="button"
                      onClick={handleOpenShopProfile}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-[#231D15] text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Store className="w-3.5 h-3.5" />
                      Ghé Thăm Gian Hàng
                    </button>
                    <Link
                      to="/marketplace"
                      className="flex-1 py-2.5 px-4 rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#F3EFE6] text-[#1A1612] text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                    >
                      Khám Phá Sàn SCANMS
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {!isSessionHost && !remoteStream && (hostOnline || isStreamLive || streamError) && (
              <div className="absolute left-1/2 top-1/2 z-10 max-w-[min(90%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-center text-sm font-semibold text-[#1A1612] shadow-lg backdrop-blur-sm">
                {streamError || (isStreamLive
                  ? 'Đang kết nối camera của KOL…'
                  : 'KOL đã vào phiên, đang chờ bật camera…')}
                {roomJoined && !isStreamEnded && <button type="button" onClick={retryConnection} className="mx-auto mt-2 block text-xs font-semibold text-[#9D722F] underline">Kết nối lại camera</button>}
              </div>
            )}

            {isSessionHost && streamError && (
              <div className="absolute left-1/2 top-4 z-10 max-w-[min(90%,520px)] -translate-x-1/2 rounded-xl border border-rose-200 bg-white/95 px-4 py-2 text-center text-xs font-semibold text-rose-700 shadow-lg backdrop-blur-sm">
                {streamError}
              </div>
            )}

            {/* Bright Studio Lighting & Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/20 pointer-events-none" />
          </div>

          {/* REALTIME FLOATING REACTION EMOJIS (TikTok / Facebook Live Flying Trails) */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-30">
            {floatingReactions.map((reaction) => (
              <span key={reaction.id} className="live-reaction-flight"
                onAnimationEnd={event => {
                  if (event.target === event.currentTarget) setFloatingReactions(previous => previous.filter(item => item.id !== reaction.id));
                }}
                style={{
                  bottom: reaction.bottom, left: reaction.left, width: reaction.size, height: reaction.size,
                  offsetPath: reaction.path,
                  '--flight-duration': `${reaction.duration}s`, '--flight-delay': `${reaction.delay}ms`,
                  '--flight-tilt': `${reaction.tilt}deg`, '--flight-rise': `${reaction.rise}px`, '--flight-drift': `${reaction.driftX}px`,
                } as React.CSSProperties}>
                <span className="live-reaction-flight-visual">
                  {reaction.iconUrl ? <img src={reaction.iconUrl} alt="" decoding="async" draggable={false}
                    onError={event => { event.currentTarget.style.display = 'none'; }} /> : <span style={{ fontSize: reaction.size * .8 }}>{reaction.emoji}</span>}
                </span>
              </span>
            ))}
          </div>

          {pinnedProduct && (!isBagOpen || bagPosition !== 'left') && (
            <div onClick={(event) => event.stopPropagation()} className="absolute bottom-[84px] left-3 sm:left-4 z-20 pointer-events-auto">
              <LivePinnedProductCard product={pinnedProduct} index={pinnedIndex} countdown={formatCountdown(dealCountdownSeconds)} collapsed={isPinnedDealCollapsed} onCollapsedChange={setIsPinnedDealCollapsed} onAddToCart={() => handleAddToCart(pinnedProduct)} onBuy={() => handleInstantBuy(pinnedProduct)} disabled={isStreamEnded} />
            </div>
          )}

          {/* BOTTOM STREAM CONTROLS: TÚI ĐỒ LIVE & REACTION EMOJI DOCK (TIKTOK / SHOPEE STYLE) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn('live-stream-bottom-controls absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto', isReactionDockExpanded && 'live-controls-reactions-open')}
          >
            {/* Bag Button: Túi Đồ Live (Thiết kế nhỏ gọn, sang trọng) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBagOpen(true)}
                className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all cursor-pointer select-none active:scale-95 border border-[#EEDFC6] relative overflow-hidden"
              >
                {/* Shine sweep effect */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

                <div className="relative">
                  <ShoppingBag className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-300" />
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                </div>
                <span>Túi Đồ Live</span>
                <span className="px-1.5 py-0.5 rounded-md bg-white/25 text-[10px] font-black tracking-wide">
                  {products.length}
                </span>
              </button>
            </div>

            <LiveReactionDock reactions={REALISTIC_3D_REACTIONS} expanded={isReactionDockExpanded} onExpandedChange={setIsReactionDockExpanded} onReact={triggerReaction} disabled={isStreamEnded} />
          </div>
        </div>

        {/* RIGHT SECTION: BRIGHT LIVE CHAT & COMMUNITY COMMENTS */}
        <aside className="w-full md:w-80 lg:w-96 h-60 md:h-full bg-white border-t md:border-t-0 md:border-l border-[#EAE4D7] flex flex-col z-20 shrink-0">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-[#EAE4D7] bg-[#FAF8F5]/80 flex items-center justify-between text-xs font-bold">
            <span className="text-[#1A1612] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Bình luận trực tiếp ({chatMessages.length})
            </span>
            <span className="text-[11px] text-[#7D715E] font-medium">Sàn SCANMS</span>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs no-scrollbar bg-[#FAF8F5]/30">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="animate-in fade-in duration-200">
                <div className="flex items-start gap-2 group">
                  {/* Clickable User Avatar */}
                  <button
                    type="button"
                    onClick={() => handleViewProfile(msg)}
                    className="relative shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C59B58] rounded-full mt-0.5 active:scale-95 transition-transform"
                    title={`Bấm xem hồ sơ của ${msg.sender}`}
                  >
                    <div className="w-8 h-8 rounded-full border border-[#EEDFC6] overflow-hidden bg-[#FAF8F5] shadow-2xs group-hover:border-[#C59B58] transition-colors flex items-center justify-center">
                      {msg.avatar ? (
                        <img
                          src={msg.avatar}
                          alt={msg.sender}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="font-bold text-xs text-[#B88E4F]">
                          {msg.sender.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Micro Role Badge */}
                    {msg.role === 'HOST' && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#C59B58] to-[#B88E4F] border border-white flex items-center justify-center text-[7.5px] text-white font-black shadow-xs"
                        title="Host Livestream"
                      >
                        ★
                      </span>
                    )}
                    {msg.role === 'SHOP' && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#1A1612] border border-white flex items-center justify-center text-[7.5px] text-[#C59B58] font-black shadow-xs"
                        title="Gian hàng chính hãng"
                      >
                        ✓
                      </span>
                    )}
                  </button>

                  {/* Message Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {msg.role === 'HOST' && (
                        <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white text-[9px] font-black uppercase shadow-2xs">
                          HOST
                        </span>
                      )}
                      {msg.role === 'SHOP' && (
                        <span className="px-1.5 py-0.2 rounded bg-[#FAF8F5] border border-[#EEDFC6] text-[#B88E4F] text-[9px] font-black uppercase">
                          SHOP
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleViewProfile(msg)}
                        className={`font-bold hover:underline cursor-pointer text-left ${
                          msg.role === 'HOST'
                            ? 'text-[#B88E4F]'
                            : msg.role === 'SHOP'
                            ? 'text-[#B88E4F]'
                            : 'text-[#1A1612]'
                        }`}
                        title={`Xem hồ sơ của ${msg.sender}`}
                      >
                        {msg.sender}
                      </button>
                      <span className="text-[10px] text-[#7D715E] ml-auto font-mono">{msg.time}</span>
                    </div>
                    <div className="text-[#1A1612] leading-snug bg-white p-2.5 rounded-2xl border border-[#EAE4D7] shadow-2xs">
                      {msg.text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Reaction Emojis Row for Chat (3D Icons) */}
          <div className="px-3 py-1.5 border-t border-[#EAE4D7] bg-[#FAF8F5]/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {REALISTIC_3D_REACTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={(e) => {
                  triggerReaction(item.emoji, e, item.iconUrl);
                  setInputComment((c) => c + item.emoji);
                }}
                className="px-2 py-1 rounded-lg bg-white hover:bg-[#F3EFE6] border border-[#EAE4D7] text-xs transition cursor-pointer shrink-0 flex items-center gap-1.5 group active:scale-90 shadow-2xs"
                title={item.label}
              >
                <img src={item.iconUrl} alt={item.label} className="w-4 h-4 object-contain group-hover:scale-125 transition-transform" />
                <span className="text-[11px] font-medium text-[#7D715E] hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <div role="status" className="px-3 py-1 text-[11px] text-[#7D715E]">{isStreamEnded ? 'Phiên đã kết thúc' : roomJoined ? 'Đã kết nối bình luận trực tiếp' : <>Chưa kết nối bình luận · Nội dung đang nhập được giữ lại <button type="button" onClick={retryConnection} className="ml-1 underline">Kết nối lại</button></>}</div>
          <form onSubmit={handleSendComment} className="p-3 border-t border-[#EAE4D7] bg-white flex items-center gap-2">
            <input
              type="text"
              maxLength={1000}
              value={inputComment}
              disabled={isStreamEnded}
              onChange={(e) => setInputComment(e.target.value)}
              placeholder={isStreamEnded ? "Phiên live đã kết thúc, khung chat tạm đóng." : "Gửi bình luận hoặc hỏi KOC..."}
              className="flex-1 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs text-[#1A1612] placeholder:text-[#7D715E] focus:outline-none focus:border-[#C59B58] focus:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isStreamEnded || !roomJoined || isSendingComment || !inputComment.trim()}
              aria-label="Gửi bình luận"
              className="p-2 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-white transition disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </aside>
      </div>

      {/* SLIDE-OVER DRAWER: TÚI ĐỒ LIVE (TIKTOK SHOP LIVE STYLE CHUẨN ẢNH 1) */}
      {isBagOpen && (
        <div
          onClick={() => setIsBagOpen(false)}
          className={cn(
            "fixed inset-0 z-50 flex transition-opacity animate-in fade-in duration-200",
            bagPosition === 'left' ? "justify-start" : "justify-end",
            "bg-black/60 backdrop-blur-xs"
          )}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Túi đồ livestream"
            className={cn(
              "w-full sm:w-[375px] md:w-[385px] bg-[#FAF8F5]/98 backdrop-blur-2xl text-[#1A1612] shadow-[0_20px_50px_rgba(26,22,18,0.18)] flex flex-col border border-[#EAE4D7] overflow-hidden relative transition-all duration-300",
              // Mobile: Bottom Sheet trượt từ dưới lên, nhỏ gọn thanh thoát
              "h-[75vh] max-h-[75vh] rounded-t-3xl mt-auto sm:mt-0",
              // Desktop: Thẻ nổi tinh tế, kích thước gọn gàng đúng tầm mắt
              "sm:h-[calc(100vh-140px)] sm:max-h-[600px] sm:my-auto sm:rounded-3xl",
              bagPosition === 'left'
                ? "sm:ml-5 sm:mr-0 animate-in slide-in-from-left-6"
                : "sm:mr-5 sm:ml-0 animate-in slide-in-from-right-6"
            )}
          >
            {/* Mobile swipe indicator */}
            <div className="w-10 h-1 bg-[#D8D0C3] rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

            {/* Top Shop Header (Tone sáng Warm Sand) */}
            <div className="px-3.5 py-2.5 bg-white border-b border-[#EAE4D7] flex items-center justify-between shrink-0 shadow-2xs">
              <div className="min-w-0 pr-2">
                <button
                  type="button"
                  onClick={() => handleOpenShopProfile()}
                  className="flex items-center gap-2 text-left group cursor-pointer"
                  title="Bấm vào để đến gian hàng của Chủ Shop"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-[#F3EFE6] border border-[#EEDFC6] shrink-0 group-hover:scale-105 transition-transform">
                    <img
                      src={
                        sessionData?.store?.logoUrl ||
                        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80'
                      }
                      alt="Shop"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3
                        className="text-[13px] font-bold text-[#1A1612] tracking-tight uppercase group-hover:text-[#C59B58] transition-colors truncate max-w-[150px] sm:max-w-[190px]"
                      >
                        {sessionData?.store?.name ? sessionData.store.name.toUpperCase() : 'SORA SKIN OFFICIAL'}
                      </h3>
                      <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-black tracking-tight leading-none inline-flex items-center shrink-0">
                        Mall
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#7D715E] group-hover:text-[#1A1612] transition-colors shrink-0" />
                    </div>
                  </div>
                </button>
                <p className="text-[10.5px] text-[#7D715E] m-0 mt-0.5 flex items-center gap-1.5 font-medium truncate">
                  <span className="text-amber-500 font-bold flex items-center gap-0.5">
                    ★ 4.5
                  </span>
                  <span className="text-[#D8D0C3]">|</span>
                  <span>Đã bán 419.1K</span>
                  <span className="text-[#D8D0C3]">|</span>
                  <span>80.1K+ theo dõi</span>
                </p>
              </div>

              {/* Action Icons: Search, Cart Badge, Close */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBagSearchOpen((v) => !v)}
                  className={`p-1.5 rounded-full transition-colors relative cursor-pointer ${
                    isBagSearchOpen ? 'bg-[#F3EFE6] text-[#1A1612]' : 'hover:bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                  title="Tìm kiếm sản phẩm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#C59B58]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsBagOpen(false);
                    startCheckout(undefined, couponCode);
                  }}
                  className="p-1.5 rounded-full hover:bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] transition-colors relative cursor-pointer"
                  title="Giỏ hàng & thanh toán"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 rounded-full bg-[#C59B58] text-white text-[9px] font-black min-w-[16px] text-center shadow-xs">
                    {cartTotalCount > 0 ? (cartTotalCount > 99 ? '99+' : cartTotalCount) : '99'}
                  </span>
                </button>

                {/* Dock side toggle on desktop */}
                <button
                  type="button"
                  onClick={() => setBagPosition((pos) => (pos === 'left' ? 'right' : 'left'))}
                  className="hidden sm:inline-flex p-1.5 rounded-full hover:bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] transition-colors cursor-pointer"
                  title={bagPosition === 'left' ? 'Chuyển sang cạnh phải' : 'Chuyển sang góc trái'}
                >
                  <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", bagPosition === 'right' && "rotate-180")} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsBagOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] transition-colors cursor-pointer"
                  title="Đóng túi đồ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick search bar */}
            {isBagSearchOpen && (
              <div className="px-3.5 py-2 bg-[#F3EFE6] border-b border-[#EAE4D7] animate-in fade-in duration-150 shrink-0">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-[#7D715E] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={bagSearchQuery}
                    onChange={(e) => setBagSearchQuery(e.target.value)}
                    placeholder="Tìm sản phẩm theo tên..."
                    className="w-full bg-white border border-[#EAE4D7] rounded-xl pl-8 pr-8 py-1 text-xs text-[#1A1612] placeholder-[#7D715E] focus:outline-hidden focus:border-[#C59B58]"
                    autoFocus
                  />
                  {bagSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBagSearchQuery('')}
                      className="absolute right-2.5 text-[#7D715E] hover:text-[#1A1612]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Category Tabs (Tone sáng nhã nhặn) */}
            <div className="px-3 pt-2 pb-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-b border-[#EAE4D7] bg-white/70">
              <button
                type="button"
                onClick={() => setBagFilterTab('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer select-none ${
                  bagFilterTab === 'ALL'
                    ? 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white shadow-xs'
                    : 'bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] hover:bg-[#EAE4D7] border border-[#EAE4D7]'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setBagFilterTab('PINNED')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer select-none flex items-center gap-1.5 ${
                  bagFilterTab === 'PINNED'
                    ? 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white shadow-xs'
                    : 'bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] hover:bg-[#EAE4D7] border border-[#EAE4D7]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                <span>Đang LIVE</span>
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setBagFilterTab(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer select-none ${
                    bagFilterTab === cat
                      ? 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white shadow-xs'
                      : 'bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] hover:bg-[#EAE4D7] border border-[#EAE4D7]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Live Voucher Strip in Bag */}
            {couponCode && (
              <div className="px-3.5 py-1.5 bg-[#FBF5EB] border-b border-[#EEDFC6] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-[#F3EFE6] border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shrink-0">
                    <Ticket className="w-3 h-3 text-[#B88E4F]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-[#1A1612] truncate block">
                      Voucher Live: <strong className="text-[#B88E4F]">Giảm {couponDiscount}</strong> <span className="text-[9.5px] font-mono text-[#7D715E]">({couponCode})</span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleClaimVoucher()}
                  disabled={voucherClaimLoading}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer select-none active:scale-95 shrink-0 ${
                    isVoucherClaimed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] text-white shadow-2xs'
                  }`}
                >
                  {isVoucherClaimed ? 'Đã lưu' : 'Lưu mã'}
                </button>
              </div>
            )}

            {/* Product List Stream (Tone sáng, thẻ nhỏ gọn) */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#EAE4D7] no-scrollbar bg-[#FAF8F5]">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-[#7D715E]">
                  <ShoppingBag className="w-8 h-8 mx-auto text-[#C59B58]/60 mb-2" />
                  <p className="text-xs font-semibold">Chưa có sản phẩm trong mục này</p>
                  <button
                    type="button"
                    onClick={() => {
                      setBagFilterTab('ALL');
                      setBagSearchQuery('');
                    }}
                    className="mt-2.5 px-3 py-1 rounded-xl bg-white border border-[#EAE4D7] text-xs text-[#C59B58] font-bold hover:bg-[#F3EFE6]"
                  >
                    Xem tất cả ({products.length})
                  </button>
                </div>
              ) : (
                filteredProducts.map((item) => {
                  const realIndex = products.findIndex((p) => p.id === item.id);
                  const isPinned = item.id === pinnedProduct?.id;
                  const discountVal = item.discountPercentage ?? 0;
                  const saving = item.price - (item.livePrice ?? item.price);
                  const displayIndex = realIndex + 1;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-2.5 sm:p-3 transition-colors flex items-start gap-2.5 relative group",
                        isPinned ? "bg-[#FBF5EB]" : "hover:bg-[#F3EFE6]/50"
                      )}
                    >
                      {/* Left: Square Thumbnail with Order Badge & LIVE Equalizer (Nhỏ gọn 80x80) */}
                      <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-white border border-[#EAE4D7] shrink-0 shadow-2xs">
                        <img
                          src={item.imageUrl || ''}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {/* Order badge */}
                        <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold font-mono leading-tight">
                          {displayIndex}
                        </span>

                        {/* Equalizer bar on bottom if pinned */}
                        {isPinned && (
                          <div className="absolute bottom-0 inset-x-0 bg-[#1A1612]/90 backdrop-blur-xs py-0.5 px-1 flex items-center justify-center gap-1 text-white">
                            <div className="flex items-end gap-0.5 h-2">
                              <span className="w-0.5 bg-white rounded-full animate-bounce [animation-duration:500ms] h-1.5" />
                              <span className="w-0.5 bg-white rounded-full animate-bounce [animation-duration:350ms] h-2" />
                              <span className="w-0.5 bg-white rounded-full animate-bounce [animation-duration:650ms] h-1" />
                            </div>
                            <span className="text-[8.5px] font-black uppercase tracking-tight">
                              Đang LIVE
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Middle & Right: Details and Action Buttons */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                        {/* Title Row with Badge */}
                        <div>
                          <div className="flex items-start gap-1.5">
                            {item.badge && <span
                              className={cn(
                                "px-1.5 py-0.2 rounded text-[9px] font-black leading-tight tracking-tight shrink-0 mt-0.5",
                                item.badge === 'Xu Hướng'
                                  ? "bg-gradient-to-r from-amber-500 to-[#C59B58] text-white"
                                  : item.badge === '10.10'
                                  ? "bg-rose-500 text-white"
                                  : "bg-rose-500 text-white"
                              )}
                            >
                              {item.badge}
                            </span>}
                            <h4
                              className="text-xs sm:text-[12.5px] font-bold text-[#1A1612] line-clamp-2 leading-snug group-hover:text-[#C59B58] transition-colors"
                              title={item.title}
                            >
                              {item.title}
                            </h4>
                          </div>

                          {/* Row 2: Freeship · Giảm · Quà miễn phí */}
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[10px]">
                            {item.voucherLabels?.map(label => <span key={label} className="rounded border border-[#EEDFC6] bg-[#FBF5EB] px-1.5 py-0.5 text-[#B88E4F]">{label}</span>)}
                            {saving > 0 && discountVal > 0 && (
                              <span className="text-[#B88E4F] bg-[#FBF5EB] border border-[#EEDFC6] px-1.5 py-0.5 rounded font-semibold">
                                · Giảm {saving >= 100000 ? `${Math.round(saving / 1000)}K đ` : `${discountVal}%`}
                              </span>
                            )}
                          </div>

                          {/* Row 3: Assurance line */}
                          <p className="mt-0.5 text-[10.5px] text-[#7D715E] font-normal truncate m-0">
                            {item.offerVariantName ? `Giá trong live · ${item.offerVariantName}` : 'Chọn phân loại để xem giá bán'}
                          </p>
                        </div>

                        {/* Row 4: Pricing & Action Buttons */}
                        <div className="mt-1.5 flex items-end justify-between gap-2">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-sm sm:text-[15px] font-black text-[#1A1612] tracking-tight">
                              {Number(item.livePrice ?? item.price).toLocaleString('vi-VN')}₫
                            </span>
                            {item.livePrice && item.livePrice < item.price && (
                              <>
                                <span className="text-[11px] text-[#7D715E] line-through font-medium">
                                  {Number(item.price).toLocaleString('vi-VN')}₫
                                </span>
                                <span className="text-[10.5px] text-rose-600 font-bold">
                                  -{discountVal}%
                                </span>
                              </>
                            )}
                          </div>

                          {/* Action Buttons: Cart Button & Brand Gold 'Mua' Button */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              className="w-7 h-7 rounded-full bg-white hover:bg-[#F3EFE6] border border-[#EAE4D7] flex items-center justify-center text-[#7D715E] hover:text-[#1A1612] active:scale-90 transition-all cursor-pointer shadow-2xs"
                              title="Thêm vào giỏ hàng"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInstantBuy(item)}
                              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] active:scale-95 text-white text-xs font-black shadow-xs cursor-pointer transition-all flex items-center justify-center"
                            >
                              Mua
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* HOST STUDIO MODAL: BẢNG ĐIỀU KHIỂN DÀNH CHO KOL / CHỦ SHOP (SẠCH SẼ, GỌN GÀNG, SỐ LIỆU THẬT) */}
      {isVoucherDropOpen && sessionData?.id && (
        <LiveVoucherDropDialog sessionId={sessionData.id} onClose={() => setIsVoucherDropOpen(false)} onReleased={(drop) => {
          setSessionData((prev: any) => ({ ...prev, voucherDrop: drop }));
          setIsVoucherDropOpen(false);
          toast.success(`Đã giới thiệu ${drop.quantity} lượt voucher ${drop.code} trong phòng Live.`);
        }} />
      )}
      {isHostStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain bg-white rounded-3xl border border-[#EAE4D7] shadow-[0_25px_70px_rgba(26,22,18,0.22)] text-[#1A1612] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header: Tiêu đề + Thông tin Shop & Host + Nút Đóng */}
            <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#EAE4D7] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shadow-2xs">
                  <Sliders className="w-5 h-5 text-[#B88E4F]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[#1A1612] tracking-tight">
                      Bảng Điều Khiển Host Studio
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-black uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đang Phát Live
                    </span>
                  </div>
                  <p className="text-xs text-[#7D715E] m-0 mt-0.5 flex items-center gap-1.5 font-medium">
                    <span>🏪 {liveShopName}</span>
                    <span>•</span>
                    <span>🎙️ Host: {liveHostName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHostStudioOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-[#F3EFE6] border border-[#EAE4D7] flex items-center justify-center text-[#7D715E] hover:text-[#1A1612] transition cursor-pointer"
                title="Đóng bảng điều khiển"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DẢI THỐNG KÊ SỐ LIỆU THẬT (PHẲNG, THOÁNG ĐÃNG - KHÔNG ĐÓNG KHUNG HỘP LỒNG NHAU) */}
            <div className="bg-white border-b border-[#EAE4D7] px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x sm:divide-[#EAE4D7]">
                {/* 1. Thời lượng live thực tế */}
                <div className="sm:px-3 text-center sm:text-left first:pl-0">
                  <div className="text-[10px] font-bold text-[#7D715E] uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                    <Clock className="w-3 h-3 text-[#B88E4F]" />
                    <span>Thời Lượng Live</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#1A1612] mt-1 font-mono tracking-tight">
                    {formatLiveDuration(liveElapsedSeconds)}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                    ● Đang phát liên tục
                  </div>
                </div>

                {/* 2. Đơn đã chốt */}
                <div className="sm:px-3 text-center sm:text-left">
                  <div className="text-[10px] font-bold text-[#7D715E] uppercase tracking-wider">
                    Đơn Đã Chốt
                  </div>
                  <div className="text-base sm:text-lg font-black text-rose-600 mt-1 tracking-tight">
                    {liveOrdersCount} đơn
                  </div>
                  <div className="text-[10px] text-[#7D715E] font-medium mt-0.5">
                    Tỉ lệ chốt: <strong className="text-[#1A1612]">8.4%</strong>
                  </div>
                </div>

                {/* 3. Doanh số live */}
                <div className="sm:px-3 text-center sm:text-left">
                  <div className="text-[10px] font-bold text-[#7D715E] uppercase tracking-wider">
                    Doanh Số Live
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#1A1612] mt-1 tracking-tight">
                    {liveGrossRevenue.toLocaleString('vi-VN')} ₫
                  </div>
                  <div className="text-[10px] text-[#7D715E] font-medium mt-0.5 truncate">
                    Shop nhận: <strong className="text-[#1A1612]">{liveShopEarnings.toLocaleString('vi-VN')} ₫</strong>
                  </div>
                </div>

                {/* 4. Hoa hồng KOC */}
                <div className="sm:px-3 text-center sm:text-left last:pr-0">
                  <div className="text-[10px] font-bold text-[#B88E4F] uppercase tracking-wider">
                    Hoa Hồng KOC ({liveCommissionRate}%)
                  </div>
                  <div className="text-base sm:text-lg font-black text-[#B88E4F] mt-1 tracking-tight">
                    +{liveKocCommission.toLocaleString('vi-VN')} ₫
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                    ✓ Tự cộng ví khi hoàn tất
                  </div>
                </div>
              </div>
            </div>

            {/* TAB CHUYỂN ĐỔI CHỨC NĂNG (GỌN GÀNG, KHÔNG PHỨC TẠP) */}
            <div className="px-6 pt-4 pb-2 flex items-center justify-between">
              <div className="inline-flex p-1 rounded-2xl bg-[#F3EFE6] border border-[#EAE4D7]">
                {isSessionOwner && !legacyLive && <button type="button" onClick={() => setStudioTab('OFFERS')} className={`rounded-xl px-3.5 py-1.5 text-xs font-bold ${studioTab === 'OFFERS' ? 'bg-white text-[#1A1612]' : 'text-[#7D715E]'}`}>Giá live & Voucher</button>}
                <button
                  type="button"
                  onClick={() => setStudioTab('PRODUCTS')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    studioTab === 'PRODUCTS'
                      ? 'bg-white text-[#1A1612] shadow-2xs'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  ⚡ Ghim Sản Phẩm & Deal Live ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStudioTab('STUDIO')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    studioTab === 'STUDIO'
                      ? 'bg-white text-[#1A1612] shadow-2xs'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  🎥 Thiết Bị & Sân Khấu Live
                </button>
                {legacyLive && isSessionHost && (
                  <button
                    type="button"
                    onClick={() => setStudioTab('GOVERNANCE')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      studioTab === 'GOVERNANCE'
                        ? 'bg-white text-[#1A1612] shadow-2xs'
                        : 'text-[#7D715E] hover:text-[#1A1612]'
                    }`}
                  >
                    🛡️ Biên Bản Hợp Tác
                  </button>
                )}
              </div>

              {studioTab === 'PRODUCTS' && (
                <span className="text-xs text-[#7D715E] font-medium hidden sm:inline">{pinnedProduct ? `Đang ghim #${pinnedIndex + 1}` : 'Chưa ghim sản phẩm'}</span>
              )}
            </div>

            {/* NỘI DUNG TAB 1: GHIM SẢN PHẨM (DANH SÁCH HÀNG PHẲNG, GỌN GÀNG) */}
            {studioTab === 'PRODUCTS' && (
              <HostStudioProducts products={products} pinnedId={pinnedProduct?.id ?? null} pendingId={pinPendingId}
                disabled={isStreamEnded || sessionData?.status !== 'LIVE' || !(isSessionHost || isSessionOwner || currentUser?.id === sessionData?.createdBy)}
                onPinChange={handlePinChange} />
            )}

            {/* NỘI DUNG TAB 2: CÀI ĐẶT THIẾT BỊ & PHÔNG NỀN (TỐI GIẢN, PHẲNG) */}
            {studioTab === 'STUDIO' && (
              <div className="px-6 py-2 space-y-4">
                {/* Dòng điều khiển Webcam */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F]">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A1612]">Thiết bị ghi hình Webcam</div>
                      <div className="text-[11px] text-[#7D715E]">
                        {isCameraActive ? (
                          <span className="text-emerald-600 font-bold">● Camera đang hoạt động trên sân khấu</span>
                        ) : (
                          '○ Đang dùng phông nền studio giả lập'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={isCameraActive ? stopCamera : startCamera}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isCameraActive
                          ? 'bg-rose-600 text-white'
                          : 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white shadow-xs'
                      }`}
                    >
                      {isCameraActive ? 'Tắt Webcam' : 'Bật Webcam'}
                    </button>
                    {cameraError && (
                      <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        {cameraError}
                      </span>
                    )}
                    {isCameraActive && (
                      <>
                        <button
                          type="button"
                          onClick={toggleMic}
                          className="px-3 py-1.5 rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#F3EFE6] text-xs font-bold text-[#1A1612] transition cursor-pointer flex items-center gap-1"
                          title={isMicMuted ? 'Bật Mic' : 'Tắt Mic'}
                        >
                          {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-rose-500" /> : <Mic className="w-3.5 h-3.5 text-emerald-600" />}
                          <span>{isMicMuted ? 'Bật Mic' : 'Tắt Mic'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMirror((m) => !m)}
                          className="px-3 py-1.5 rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#F3EFE6] text-xs font-bold text-[#1A1612] transition cursor-pointer flex items-center gap-1"
                          title="Lật gương camera"
                        >
                          <span>{isMirror ? 'Bỏ lật gương' : 'Lật gương'}</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#F3EFE6] text-xs font-bold text-[#1A1612] transition cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#B88E4F]" />
                      <span>Tải ảnh nền</span>
                    </button>
                  </div>
                </div>

                {/* Sân khấu mẫu */}
                <div>
                  <div className="text-xs font-bold text-[#7D715E] mb-2">Chọn phông nền sân khấu có sẵn:</div>
                  <div className="grid grid-cols-4 gap-2.5">
                    {BACKDROP_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          if (isCameraActive) stopCamera();
                          setActiveBackdropUrl(preset.url);
                          toast.success(`Đã chọn sân khấu "${preset.name}"!`);
                        }}
                        className={`group relative rounded-2xl overflow-hidden border p-1 text-left cursor-pointer transition ${
                          activeBackdropUrl === preset.url
                            ? 'border-[#C59B58] ring-2 ring-[#C59B58]/40 bg-[#FBF5EB]'
                            : 'border-[#EAE4D7] hover:border-[#B88E4F] bg-white'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-14 rounded-xl object-cover" />
                        <span className="block text-[10px] font-bold text-[#1A1612] truncate mt-1 text-center">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {studioTab === 'OFFERS' && isSessionOwner && !legacyLive && <div className="min-h-0 overflow-y-auto"><LiveCommercePanel sessionId={sessionData.id} storeId={sessionData.storeId} products={products} onChanged={state => {
              pinRevision.current += 1;
              setCommerce(state); setCommerceError('');
              if (state.pinnedProductId !== undefined) setSessionData((previous: any) => previous ? { ...previous, pinnedProductId: state.pinnedProductId } : previous);
            }} /></div>}
            {/* NỘI DUNG TAB 3: BIÊN BẢN HỢP TÁC & PHÂN QUYỀN GOVERNANCE */}
            {legacyLive && studioTab === 'GOVERNANCE' && isSessionHost && sessionData?.id && (
              <div className="px-6 py-4 max-h-[350px] overflow-y-auto">
                <LiveGovernancePanel session={sessionData} audience="kol" liveRoom />
              </div>
            )}

            {/* THANH TÁC VỤ DƯỚI CÙNG (FOOTER ACTIONS) */}
            {legacyLive && <div className="flex shrink-0 justify-start px-6 pt-3">
              <button
                type="button"
                onClick={() => setIsVoucherDropOpen(true)}
                disabled={!sessionData?.id || sessionData?.status !== 'LIVE' || !(isSessionHost || currentUser?.id === sessionData?.createdBy)}
                className="px-4 py-2.5 rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#F3EFE6] text-xs font-bold text-[#1A1612] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Ticket size={16} className="text-[#B88E4F]" />
                <span>{'Tung Voucher Live'}</span>
              </button>
            </div>}
            <div className={cn('mt-3 grid shrink-0 items-end gap-3 border-t border-[#EAE4D7] bg-[#FAF8F5] px-6 py-4', isSessionHost && sessionData?.id ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
              {legacyLive && isSessionHost && sessionData?.id && <LiveGovernancePanel session={sessionData} audience="kol" liveRoom compact onChanged={() => {
                void liveSessionService.room(sessionData.id).then(setSessionData).catch(() => {});
              }} />}
              <button
                type="button"
                onClick={() => setIsHostStudioOpen(false)}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#C59B58] bg-[#C59B58] px-4 text-xs font-semibold text-white transition hover:bg-[#B88E4F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88E4F] cursor-pointer"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL / THẺ HỒ SƠ NGƯỜI DÙNG CHUẨN SCANMS VÀNG BE */}
      {selectedProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedProfile(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-[#EEDFC6] overflow-hidden text-[#1A1612] flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Top Banner (Warm Sand Gold Header with decoration) */}
            <div className="relative h-24 bg-gradient-to-r from-[#C59B58] via-[#DEBE85] to-[#B88E4F] p-4 flex justify-between items-start">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold border border-white/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Hồ Sơ Thành Viên SCANMS</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Profile Info */}
            <div className="px-5 pt-0 pb-5 -mt-12">
              <div className="flex items-end justify-between gap-3">
                {/* Large Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-[#FAF8F5] shadow-lg flex items-center justify-center">
                    {selectedProfile.avatar ? (
                      <img
                        src={selectedProfile.avatar}
                        alt={selectedProfile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-extrabold text-2xl text-[#B88E4F]">
                        {selectedProfile.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {selectedProfile.verified && (
                    <span
                      className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#059669] text-white flex items-center justify-center border-2 border-white shadow-xs"
                      title="Đã xác thực danh tính"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Quick Action Button: Follow / Đang theo dõi */}
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => handleToggleFollow(selectedProfile.handle)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      followedUsers[selectedProfile.handle]
                        ? 'bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E] hover:text-[#DC2626] hover:border-red-200'
                        : 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-white'
                    }`}
                  >
                    {followedUsers[selectedProfile.handle] ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đang theo dõi</span>
                      </>
                    ) : (
                      <>
                        <span>+ Theo dõi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Name, Handle & Badge */}
              <div className="mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-[#1A1612] m-0">
                    {selectedProfile.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EEDFC6] text-[#B88E4F] text-[10px] font-black uppercase tracking-wider">
                    {selectedProfile.badgeTitle}
                  </span>
                </div>
                <p className="text-xs text-[#7D715E] font-medium mt-0.5">
                  {selectedProfile.handle}
                </p>
              </div>

              {/* Bio */}
              <p className="text-xs text-[#1A1612] leading-relaxed mt-2.5 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7]">
                {selectedProfile.bio}
              </p>

              {/* 3 Metrics Cards */}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                {selectedProfile.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-[#EAE4D7] rounded-xl p-2 shadow-2xs"
                  >
                    <div className="text-xs sm:text-sm font-extrabold text-[#B88E4F]">
                      {m.value}
                    </div>
                    <div className="text-[10.5px] text-[#7D715E] font-medium truncate mt-0.5">
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Channels (for KOC / Host) */}
              {selectedProfile.socials && selectedProfile.socials.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#EAE4D7]">
                  <div className="text-[11px] font-bold text-[#7D715E] mb-1.5">
                    Kênh mạng xã hội liên kết:
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedProfile.socials.map((soc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EEDFC6] text-[11px] font-semibold text-[#1A1612]"
                      >
                        <span className="font-extrabold text-[#B88E4F]">{soc.platform}:</span>
                        <span>{soc.handle}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges / Trust Details */}
              <div className="mt-3 pt-2.5 border-t border-[#EAE4D7] space-y-1.5 text-xs text-[#7D715E]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                  <span className="text-[#1A1612] font-semibold">Điểm uy tín tài khoản:</span>
                  <span className="font-extrabold text-[#059669] ml-auto">{selectedProfile.trustScore}/100</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#B88E4F] shrink-0" />
                  <span>Khu vực: <strong className="text-[#1A1612]">{selectedProfile.city || 'Việt Nam'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#B88E4F] shrink-0" />
                  <span>Thành viên từ: <strong className="text-[#1A1612]">{selectedProfile.memberSince}</strong></span>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {selectedProfile.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE4D7] text-[10.5px] font-medium text-[#7D715E]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-[#EAE4D7] flex items-center gap-2">
                {selectedProfile.role === 'SHOP' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProfile(null);
                      navigate(`/shop/${sessionData?.storeId || 'sora-skin'}`);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#FBF5EB] hover:bg-[#F3EFE6] border border-[#EEDFC6] text-[#B88E4F] text-xs font-black transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs shrink-0"
                    title="Ghé thăm cửa hàng chính thức của Shop"
                  >
                    <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
                    <span>Ghé Shop</span>
                  </button>
                )}
                {selectedProfile.role === 'HOST' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProfile(null);
                      setIsBagOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-[#FBF5EB] hover:bg-[#F3EFE6] border border-[#EEDFC6] text-[#B88E4F] text-xs font-black transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs shrink-0"
                    title="Xem các sản phẩm KOC đang giới thiệu"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#B88E4F]" />
                    <span>Deal KOC</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDirectMessage(selectedProfile)}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{selectedProfile.role === 'SHOP' ? 'Chat với Shop' : 'Nhắn tin riêng'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Đã sao chép liên kết hồ sơ của ${selectedProfile.name}!`);
                  }}
                  className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#1A1612] transition cursor-pointer"
                  title="Chia sẻ hồ sơ"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
