import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Flame,
  ChevronUp,
  ChevronDown,
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
import { authService } from '../../services/auth.service';
import { LiveGovernancePanel } from '../../components/live/LiveGovernancePanel';
import { useCart } from '../../context/CartContext';
import { useScanmsChat } from '../../context/ScanmsChatContext';
import { toast } from '../../utils/toast';
import { cn } from '../../utils/cn';
import { useLiveStreamTransport } from '../../hooks/useLiveStreamTransport';
import { FACE_FILTERS, useLiveFaceFilter, type FaceFilter } from '../../hooks/useLiveFaceFilter';
import { FaceFilterPreview } from '../../components/live/FaceFilterPreview';
import type { FilterCategory } from '../../features/live/faceFilters';

interface LiveProduct {
  id: string;
  variantId?: string;
  variantName?: string;
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
  sway: number;
  rotStart: number;
  rotMid: number;
  rotEnd: number;
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
}

// Official Animated Facebook Live Reactions & Authentic TikTok 3D Elements
export const REALISTIC_3D_REACTIONS: LiveReactionDef[] = [
  {
    id: 'heart',
    emoji: '❤️',
    label: 'Thả tim',
    iconUrl: 'https://raw.githubusercontent.com/duytq94/react-native-fb-reactions-animation/master/Images/love.gif',
    color: 'from-rose-500 to-red-500',
    burstColor: '#ef4444',
  },
  {
    id: 'like',
    emoji: '👍',
    label: 'Thích',
    iconUrl: 'https://raw.githubusercontent.com/duytq94/react-native-fb-reactions-animation/master/Images/like.gif',
    color: 'from-blue-500 to-indigo-600',
    burstColor: '#3b82f6',
  },
  {
    id: 'haha',
    emoji: '😂',
    label: 'Haha',
    iconUrl: 'https://raw.githubusercontent.com/duytq94/react-native-fb-reactions-animation/master/Images/haha.gif',
    color: 'from-amber-400 to-yellow-500',
    burstColor: '#eab308',
  },
  {
    id: 'wow',
    emoji: '😮',
    label: 'Wow',
    iconUrl: 'https://raw.githubusercontent.com/duytq94/react-native-fb-reactions-animation/master/Images/wow.gif',
    color: 'from-yellow-400 to-orange-500',
    burstColor: '#f59e0b',
  },
  {
    id: 'sad',
    emoji: '😢',
    label: 'Buồn',
    iconUrl: 'https://raw.githubusercontent.com/duytq94/react-native-fb-reactions-animation/master/Images/sad.gif',
    color: 'from-blue-400 to-sky-500',
    burstColor: '#38bdf8',
  },
  {
    id: 'angry',
    emoji: '😡',
    label: 'Phẫn nộ',
    iconUrl: 'https://raw.githubusercontent.com/duytq94/react-native-fb-reactions-animation/master/Images/angry.gif',
    color: 'from-red-600 to-orange-600',
    burstColor: '#dc2626',
  },
  {
    id: 'fire',
    emoji: '🔥',
    label: 'Cháy quá',
    iconUrl: 'https://em-content.zobj.net/source/apple/354/fire_1f525.png',
    color: 'from-amber-500 to-orange-500',
    burstColor: '#f97316',
  },
  {
    id: 'gift',
    emoji: '🎁',
    label: 'Tặng quà',
    iconUrl: 'https://em-content.zobj.net/source/apple/354/wrapped-gift_1f381.png',
    color: 'from-purple-500 to-indigo-500',
    burstColor: '#a855f7',
  },
  {
    id: 'party',
    emoji: '🎉',
    label: 'Bắn pháo',
    iconUrl: 'https://em-content.zobj.net/source/apple/354/party-popper_1f389.png',
    color: 'from-pink-500 to-rose-500',
    burstColor: '#ec4899',
  },
  {
    id: 'hundred',
    emoji: '💯',
    label: '100 Điểm',
    iconUrl: 'https://em-content.zobj.net/source/apple/354/hundred-points_1f4af.png',
    color: 'from-red-500 to-rose-600',
    burstColor: '#dc2626',
  },
  {
    id: 'star',
    emoji: '⭐',
    label: '5 Sao',
    iconUrl: 'https://em-content.zobj.net/source/microsoft-teams/363/glowing-star_1f31f.png',
    color: 'from-amber-400 to-yellow-500',
    burstColor: '#f59e0b',
  },
];

// Dòng chảy tim đổi màu TikTok Live siêu rực rỡ khi spam tap
export const TIKTOK_HEARTS = [
  'https://raw.githubusercontent.com/duytq94/react-native-fb-reactions-animation/master/Images/love.gif',
  'https://em-content.zobj.net/source/apple/354/red-heart_2764-fe0f.png',
  'https://em-content.zobj.net/source/apple/354/pink-heart_1fa77.png',
  'https://em-content.zobj.net/source/apple/354/orange-heart_1f9e1.png',
  'https://em-content.zobj.net/source/apple/354/purple-heart_1f49c.png',
  'https://em-content.zobj.net/source/apple/354/light-blue-heart_1fa75.png',
];


const USER_PROFILES_MAP: Record<string, Partial<UserProfileData>> = {
  'Hương Giang': {
    name: 'Hương Giang',
    handle: '@huonggiang.beauty',
    role: 'VIEWER',
    badgeTitle: '💎 Người mua Kim Cương',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    bio: 'Tín đồ dưỡng da khoa học • Chuyên săn deal độc quyền trên SCANMS Live • Đã review 35+ sản phẩm đạt chuẩn.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 02/2024',
    city: 'Hà Nội',
    metrics: [
      { label: 'Đơn hoàn tất', value: '48 đơn' },
      { label: 'Tỉ lệ nhận hàng', value: '100%' },
      { label: 'Đánh giá 5★', value: '35 bài' },
    ],
    tags: ['Khách hàng VIP', 'Fan cứng Live', 'Đã xác thực CCCD'],
  },
  'KOC Linh Trương': {
    name: 'KOC Linh Trương',
    handle: '@linhtruong.koc',
    role: 'HOST',
    badgeTitle: '👑 Host KOC Triệu View',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'KOC Beauty & Skincare Reviewer • Đại sứ thương hiệu liên kết SCANMS • Chia sẻ bí quyết làm đẹp khoa học & deal chính hãng.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 08/2023',
    city: 'TP. Hồ Chí Minh',
    metrics: [
      { label: 'Followers', value: '1.2M' },
      { label: 'Lượt thích', value: '8.6M' },
      { label: 'Đã tiếp thị', value: '45.2K đơn' },
    ],
    socials: [
      { platform: 'TikTok', handle: '@linhtruong.koc' },
      { platform: 'Instagram', handle: '@linhtruong.beauty' },
      { platform: 'YouTube', handle: 'Linh Trương Official' },
    ],
    tags: ['Top Creator', 'Beauty & Care', 'KOC Kim Cương', 'KYC Verified'],
  },
  'Sora Skin Official': {
    name: 'Sora Skin Official Store',
    handle: '@soraskin.official',
    role: 'SHOP',
    badgeTitle: '🏪 Gian Hàng Chính Hãng Mall',
    avatar: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
    bio: 'Thương hiệu dược mỹ phẩm phục hồi da sinh học thuần chay hàng đầu Việt Nam. Cam kết 100% hàng chính hãng, đồng kiểm 14 ngày.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 01/2023',
    city: 'Hà Nội',
    metrics: [
      { label: 'Đánh giá', value: '4.9/5.0 ★' },
      { label: 'Tỉ lệ phản hồi', value: '99% (5p)' },
      { label: 'Sản phẩm', value: '68 SKU' },
    ],
    tags: ['Chính hãng 100%', 'Hỗ trợ KOC 25%', 'Giao nhanh 24h', 'Đồng kiểm 14 ngày'],
  },
  'Thanh Nga': {
    name: 'Thanh Nga',
    handle: '@thanhnga.glow',
    role: 'VIEWER',
    badgeTitle: '✨ Người Mua Tích Cực',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    bio: 'Yêu thích skincare phục hồi và chống lão hóa • Hay săn voucher độc quyền trong livestream SCANMS.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 05/2024',
    city: 'Đà Nẵng',
    metrics: [
      { label: 'Đơn hoàn tất', value: '29 đơn' },
      { label: 'Tỉ lệ nhận hàng', value: '100%' },
      { label: 'Đánh giá 5★', value: '24 bài' },
    ],
    tags: ['Người mua tích cực', 'Thành viên Bạc', 'Đã KYC'],
  },
  'Hoàng Long': {
    name: 'Hoàng Long',
    handle: '@hoanglong.tech',
    role: 'VIEWER',
    badgeTitle: '⚡ Người Mua Uy Tín VIP',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Kỹ sư công nghệ & Content Creator • Thích trải nghiệm sản phẩm chăm sóc nam giới & gia đình.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 04/2024',
    city: 'Hải Phòng',
    metrics: [
      { label: 'Đơn hoàn tất', value: '34 đơn' },
      { label: 'Tỉ lệ nhận hàng', value: '100%' },
      { label: 'Chi tiêu', value: '18.5 tr' },
    ],
    tags: ['VIP Vàng', 'Fan cứng Live', 'Đã xác thực eKYC'],
  },
  'Minh Tuấn': {
    name: 'Minh Tuấn',
    handle: '@minhtuan.review',
    role: 'VIEWER',
    badgeTitle: '🛍️ Khách Hàng Thân Thiết',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    bio: 'Thích săn deal KCN và serum B5 • Đánh giá sản phẩm trung thực và khách quan.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 03/2024',
    city: 'TP. Hồ Chí Minh',
    metrics: [
      { label: 'Đơn hoàn tất', value: '41 đơn' },
      { label: 'Tỉ lệ nhận hàng', value: '100%' },
      { label: 'Đánh giá 5★', value: '30 bài' },
    ],
    tags: ['Khách hàng thân thiết', 'Đã KYC CCCD', 'Đồng kiểm 100%'],
  },
  'Thu Thảo': {
    name: 'Thu Thảo',
    handle: '@thuthao.skincare',
    role: 'VIEWER',
    badgeTitle: '🌸 Fan Cứng Phiên Live',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
    bio: 'Dược sĩ tư vấn mỹ phẩm & Khách hàng quen của Sora Skin • Luôn theo dõi các buổi live săn deal.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 01/2024',
    city: 'Hà Nội',
    metrics: [
      { label: 'Đơn hoàn tất', value: '62 đơn' },
      { label: 'Tỉ lệ nhận hàng', value: '100%' },
      { label: 'Đánh giá 5★', value: '55 bài' },
    ],
    tags: ['Fan cứng Live', 'Khách VIP Kim Cương', 'Đã xác thực CCCD'],
  },
  'Quốc Bảo': {
    name: 'Quốc Bảo',
    handle: '@quocbao.buyer',
    role: 'VIEWER',
    badgeTitle: '💎 Khách Hàng Kim Cương',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    bio: 'Người tiêu dùng thông minh • Thường mua trọn bộ combo chăm sóc da toàn diện cho cả gia đình.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 06/2024',
    city: 'Đà Nẵng',
    metrics: [
      { label: 'Đơn hoàn tất', value: '25 đơn' },
      { label: 'Tỉ lệ nhận hàng', value: '100%' },
      { label: 'Đánh giá 5★', value: '20 bài' },
    ],
    tags: ['Khách hàng thân thiết', 'VIP Bạc', 'Đã KYC'],
  },
  'Kim Ngân': {
    name: 'Kim Ngân',
    handle: '@kimngan.beauty',
    role: 'VIEWER',
    badgeTitle: '✨ Người Mua Uy Tín',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    bio: 'Yêu thích làm đẹp và mỹ phẩm sạch hữu cơ • Rất thích cách KOC tư vấn nhiệt tình trên Live!',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 07/2024',
    city: 'Hà Nội',
    metrics: [
      { label: 'Đơn hoàn tất', value: '19 đơn' },
      { label: 'Tỉ lệ nhận hàng', value: '100%' },
      { label: 'Đánh giá 5★', value: '16 bài' },
    ],
    tags: ['Người mua tích cực', 'Thành viên Mới', 'Đã KYC'],
  },
  'Thùy Chi': {
    name: 'Thùy Chi',
    handle: '@thuychi.cosmetics',
    role: 'VIEWER',
    badgeTitle: '🌿 Khách Hàng Thân Thiết',
    avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80',
    bio: 'Chuyên viên trang điểm tự do • Chọn SCANMS vì nguồn hàng chính hãng 100% minh bạch xuất xứ.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 02/2024',
    city: 'Bình Dương',
    metrics: [
      { label: 'Đơn hoàn tất', value: '54 đơn' },
      { label: 'Tỉ lệ nhận hàng', value: '100%' },
      { label: 'Đánh giá 5★', value: '46 bài' },
    ],
    tags: ['Khách VIP Vàng', 'Đã định danh eKYC', 'Fan cứng Live'],
  },
  'Ngọc Hân': {
    name: 'Ngọc Hân',
    handle: '@ngochan.daily',
    role: 'VIEWER',
    badgeTitle: '⚡ Fan Cứng Livestream',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'Nhân viên văn phòng • Thường xem livestream buổi trưa và tối để săn voucher giảm giá sâu.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 03/2024',
    city: 'Cần Thơ',
    metrics: [
      { label: 'Đơn hoàn tất', value: '28 đơn' },
      { label: 'Tỉ lệ nhận hàng', value: '100%' },
      { label: 'Đánh giá 5★', value: '25 bài' },
    ],
    tags: ['Fan cứng Live', 'Đã xác thực CCCD', 'Khách thân thiết'],
  },
};

const resolveUserProfile = (msg: ChatMessage, currentUser: any): UserProfileData => {
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
        : 'Thành Viên SCANMS';

    return {
      name: currentUser.fullName || 'Nguyễn Thành Thắng',
      handle: `@${(currentUser.email || 'thang.leader').split('@')[0]}`,
      role: msg.role,
      badgeTitle: roleTitle,
      avatar: currentUser.avatar || undefined,
      bio: 'Thành viên tích cực trên Sàn Thương Mại Tiếp Thị Liên Kết SCANMS. Đã liên kết tài khoản ngân hàng và xác minh định danh eKYC.',
      verified: true,
      trustScore: 100,
      memberSince: 'Tháng 01/2024',
      city: 'TP. Hồ Chí Minh',
      metrics: [
        { label: 'Cấp bậc', value: 'VIP Pro' },
        { label: 'Điểm tín nhiệm', value: '100/100' },
        { label: 'Đã hoàn tất KYC', value: '100%' },
      ],
      tags: ['Tài khoản của bạn', 'eKYC Đã duyệt', 'Bảo mật 2FA'],
    };
  }

  const preset = USER_PROFILES_MAP[msg.sender];
  if (preset) {
    return {
      name: preset.name || msg.sender,
      handle: preset.handle || `@${msg.sender.toLowerCase().replace(/\\s+/g, '')}`,
      role: preset.role || msg.role,
      badgeTitle:
        preset.badgeTitle ||
        (msg.role === 'HOST'
          ? '👑 Host Phiên Live'
          : msg.role === 'SHOP'
          ? '🏪 Gian Hàng Chính Hãng'
          : '🛍️ Khách Hàng Thân Thiết'),
      avatar: preset.avatar || msg.avatar,
      bio: preset.bio || 'Thành viên uy tín tham gia giao dịch và tương tác trên Sàn SCANMS.',
      verified: preset.verified ?? true,
      trustScore: preset.trustScore ?? 100,
      memberSince: preset.memberSince || 'Tháng 03/2024',
      city: preset.city || 'Việt Nam',
      metrics: preset.metrics || [
        { label: 'Đơn thành công', value: '30+ đơn' },
        { label: 'Tỉ lệ nhận hàng', value: '100%' },
        { label: 'Đánh giá 5★', value: '25 bài' },
      ],
      socials: preset.socials,
      tags: preset.tags || ['Người mua uy tín', 'Đã xác thực CCCD'],
    };
  }

  return {
    name: msg.sender,
    handle: `@${msg.sender.toLowerCase().replace(/[^a-z0-9]/g, '') || 'viewer'}`,
    role: msg.role,
    badgeTitle:
      msg.role === 'HOST'
        ? '👑 Host Phiên Live'
        : msg.role === 'SHOP'
        ? '🏪 Gian Hàng Đối Tác'
        : '🛍️ Người Mua Uy Tín',
    avatar: msg.avatar,
    bio: 'Khách hàng thân thiết tham gia giao dịch và theo dõi livestream trên hệ thống SCANMS.',
    verified: true,
    trustScore: 100,
    memberSince: 'Tháng 04/2024',
    city: 'Việt Nam',
    metrics: [
      { label: 'Đơn thành công', value: '15+ đơn' },
      { label: 'Tỉ lệ nhận hàng', value: '100%' },
      { label: 'Điểm uy tín', value: '100/100' },
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
  const isSessionHost =
    currentUser?.role === 'COLLABORATOR' &&
    Boolean(currentUser.id) &&
    currentUser.id === sessionData?.creator?.id;
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // SỐ LIỆU THỰC TẾ: Người xem & Lượt thả tim
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [likesCount, setLikesCount] = useState<number>(() => {
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
  const { remoteStream, hostOnline, isStreamLive, streamError, sessionEnded } = useLiveStreamTransport({
    sessionId: sessionData?.id,
    isHost: isSessionHost,
    localStream: isCameraActive ? filteredStream : null,
  });

  useEffect(() => {
    if (!sessionEnded) return;
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    setIsCameraActive(false);
    setCameraStream(null);
    setSessionData((previous: any) => previous ? { ...previous, status: 'ENDED' } : previous);
  }, [sessionEnded]);

  // Floating Reactions & Hearts
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const reactionCounterRef = useRef(0);

  // In-stream drawers / overlays (TikTok Shop Live Style)
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [bagPosition, setBagPosition] = useState<'left' | 'right'>('left');
  const [bagFilterTab, setBagFilterTab] = useState<string>('ALL');
  const [bagSearchQuery, setBagSearchQuery] = useState('');
  const [isBagSearchOpen, setIsBagSearchOpen] = useState(false);
  const [isHostStudioOpen, setIsHostStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<'PRODUCTS' | 'STUDIO'>('PRODUCTS');
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(2720); // 45p 20s

  // Đồng hồ đếm thời gian phát live thực tế (Live duration timer)
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLiveDuration = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}p ${seconds < 10 ? '0' : ''}${seconds}s`;
    }
    return `${minutes}p ${seconds < 10 ? '0' : ''}${seconds}s`;
  };

  const liveOrdersCount = sessionData?.ordersCount ?? (identifier === 'demo' ? 64 : 0);
  const liveGrossRevenue = sessionData?.totalRevenue ?? (identifier === 'demo' ? 18450000 : 0);
  const liveCommissionRate = sessionData?.commissionRate ? Number(sessionData.commissionRate) : (identifier === 'demo' ? 20 : 0);
  const liveKocCommission = Math.round(liveGrossRevenue * (liveCommissionRate / 100));
  const liveShopEarnings = liveGrossRevenue - liveKocCommission;
  const liveShopName = sessionData?.store?.name || 'Sora Skin Official Store';
  const liveHostName = sessionData?.creator?.fullName || sessionData?.creator?.name || 'Nguyễn Thành Thắng (Leader)';

  const [pinnedIndex, setPinnedIndex] = useState(0);
  const [isPinnedDealCollapsed, setIsPinnedDealCollapsed] = useState(false);
  const [dealCountdownSeconds, setDealCountdownSeconds] = useState(405); // 06:45
  const [isVoucherClaimed, setIsVoucherClaimed] = useState(false);
  const [voucherClaimLoading, setVoucherClaimLoading] = useState(false);

  // Live countdown timer for deal price
  useEffect(() => {
    const timer = setInterval(() => {
      setDealCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 405));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    const profile = resolveUserProfile(msg, currentUser);
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
        id: sessionData?.storeId || 'sora-skin',
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
    const kolName = sessionData?.creator?.fullName || (currentUser?.fullName ? `${currentUser.fullName} (Host)` : 'KOC Linh Trương');
    const kolAvatar =
      sessionData?.creator?.avatarUrl ||
      (currentUser as any)?.avatar ||
      (currentUser as any)?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

    const kolProfile: UserProfileData = {
      name: kolName,
      handle: `@${(sessionData?.creator?.email || currentUser?.email || 'thang.koc').split('@')[0]}`,
      role: 'HOST',
      badgeTitle: '👑 Top 1 KOC Livestream • Đối Tác SCANMS',
      avatar: kolAvatar,
      bio: 'Nhà sáng tạo nội dung & KOC độc quyền trên Sàn Thương Mại Tiếp Thị Liên Kết SCANMS. Chuyên review mỹ phẩm chăm sóc da thực tế và tung deal trợ giá độc quyền từ các Gian hàng đối tác.',
      verified: true,
      trustScore: 100,
      memberSince: 'Tháng 08/2023',
      city: 'TP. Hồ Chí Minh',
      metrics: [
        { label: 'Followers', value: '1.2M' },
        { label: 'Lượt thích', value: '8.6M' },
        { label: 'Đã tiếp thị', value: '45.2K đơn' },
      ],
      socials: [
        { platform: 'TikTok', handle: '@thang.koc' },
        { platform: 'Instagram', handle: '@thang.beauty' },
        { platform: 'Facebook', handle: 'Nguyễn Thành Thắng Official' },
        { platform: 'YouTube', handle: 'Thắng Review Official' },
      ],
      tags: ['Top Creator SCANMS', 'Đại sứ Sora Skin', 'KOL Kim Cương', 'eKYC Đã duyệt'],
    };
    setSelectedProfile(kolProfile);
  };

  // ĐIỀU HƯỚNG TRỰC TIẾP TỚI GIAN HÀNG CỦA CHỦ SHOP (STOREFRONT) KHI BẤM VÀO AVATAR HOẶC TÊN SHOP
  const handleOpenShopProfile = () => {
    const shopSlug =
      sessionData?.store?.slug ||
      sessionData?.store?.id ||
      sessionData?.storeId ||
      (sessionData?.store?.name?.toLowerCase().includes('aura') ? 'aura-bio' : 'sora-skin');
    navigate(`/shop/${shopSlug}`);
  };

  // Chat & Realtime ticker
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'Hương Giang',
      role: 'VIEWER',
      avatar: USER_PROFILES_MAP['Hương Giang']?.avatar,
      text: 'Chào chị Linh! Da dầu mụn dùng serum B5 này cấp ẩm ổn không ạ?',
      time: '19:42',
    },
    {
      id: '2',
      sender: 'KOC Linh Trương',
      role: 'HOST',
      avatar: USER_PROFILES_MAP['KOC Linh Trương']?.avatar,
      text: 'Siêu hợp em nhé, dòng B5 Centella này thẩm thấu cực nhanh, kiềm dầu nhẹ và không bết dính chút nào!',
      time: '19:42',
    },
    {
      id: '3',
      sender: 'Sora Skin Official',
      role: 'SHOP',
      avatar: USER_PROFILES_MAP['Sora Skin Official']?.avatar,
      text: 'Shop trợ giá độc quyền phiên live giảm 30% + voucher 25k cho mọi người nha ❤️',
      time: '19:43',
    },
    {
      id: '4',
      sender: 'Thanh Nga',
      role: 'VIEWER',
      avatar: USER_PROFILES_MAP['Thanh Nga']?.avatar,
      text: 'Đã nhận mã 25k, đang chốt combo 2 món luôn ạ!',
      time: '19:43',
    },
  ]);
  const [inputComment, setInputComment] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Default demo products if session has none (chuẩn số liệu thực tế ảnh 1 và danh mục)
  const defaultProducts: LiveProduct[] = useMemo(
    () => [
      {
        id: 'demo-prod-5',
        title: 'Set quà Armaf Scent Love - Thiệp n...',
        imageUrl:
          'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=400&auto=format&fit=crop&q=80',
        price: 1350000,
        livePrice: 1190000,
        discountPercentage: 12,
        storeName: 'ARMAFVIETNAM',
        soldPercent: 95,
        stockLeft: 3,
        category: 'Nước hoa',
        badge: 'Mall',
      },
      {
        id: 'demo-prod-6',
        title: 'Nước hoa unisex Armaf Perle D\'or...',
        imageUrl:
          'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&auto=format&fit=crop&q=80',
        price: 2800000,
        livePrice: 2205000,
        discountPercentage: 21,
        storeName: 'ARMAFVIETNAM',
        soldPercent: 84,
        stockLeft: 6,
        category: 'Nước hoa',
        badge: '10.10',
      },
      {
        id: 'demo-prod-7',
        title: 'Nước Hoa Nữ ARMAF Club De N...',
        imageUrl:
          'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&auto=format&fit=crop&q=80',
        price: 1350000,
        livePrice: 1040000,
        discountPercentage: 23,
        storeName: 'ARMAFVIETNAM',
        soldPercent: 91,
        stockLeft: 5,
        category: 'Nước hoa',
        badge: 'Xu Hướng',
      },
      {
        id: 'demo-prod-1',
        title: 'Kem Chống Nắng Phổ Rộng Kiềm Dầu Sora Skin Invisible Shield SPF50+ 50g',
        imageUrl:
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
        price: 420000,
        livePrice: 315000,
        discountPercentage: 25,
        storeName: 'Sora Skin Official Store',
        soldPercent: 88,
        stockLeft: 7,
        category: 'Chăm sóc da',
        badge: 'Mall',
      },
      {
        id: 'demo-prod-2',
        title: 'Serum Phục Hồi & Làm Dịu Da B5 Centella Sora Skin 50ml',
        imageUrl:
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80',
        price: 385000,
        livePrice: 289000,
        discountPercentage: 25,
        storeName: 'Sora Skin Official Store',
        soldPercent: 79,
        stockLeft: 12,
        category: 'Serum & Kem',
        badge: '10.10',
      },
      {
        id: 'demo-prod-3',
        title: 'Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Niacinamide 30ml',
        imageUrl:
          'https://images.unsplash.com/photo-1608248597359-0098f62f9fd1?w=400&auto=format&fit=crop&q=80',
        price: 350000,
        livePrice: 265000,
        discountPercentage: 24,
        storeName: 'Sora Skin Official Store',
        soldPercent: 92,
        stockLeft: 4,
        category: 'Serum & Kem',
        badge: 'Xu Hướng',
      },
      {
        id: 'demo-prod-4',
        title: 'Sữa Rửa Mặt Dịu Nhẹ pH 5.5 Chiết Xuất Rau Má Centella 150ml',
        imageUrl:
          'https://images.unsplash.com/photo-1556228722-d0b71239c4d5?w=400&auto=format&fit=crop&q=80',
        price: 245000,
        livePrice: 185000,
        discountPercentage: 24,
        storeName: 'Sora Skin Official Store',
        soldPercent: 64,
        stockLeft: 19,
        category: 'Chăm sóc da',
        badge: 'Mall',
      },
    ],
    [],
  );

  // Load session info from API
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const res: any = await api.get(`/live-sessions/public/detail/${encodeURIComponent(identifier)}`);
        const data = res?.data || res;
        if (active && data?.id) {
          setSessionData(data);
        }
      } catch {
        // Fallback demo mode is active
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

      toast.success('Đã bật camera phát sóng');
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
    if (sessionEnded) return;
    let active = true;

    const syncLiveStats = async () => {
      try {
        const res: any = await api.post(
          `/live-sessions/public/${encodeURIComponent(identifier)}/interaction`,
          {
            action: 'HEARTBEAT',
            clientId: clientIdRef.current,
          },
        );
        const data = res?.data?.data || res?.data || res;
        if (active && data) {
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
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/live-sessions/public/${encodeURIComponent(identifier)}/interaction`;
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

  // Real-time purchase alert ticker
  useEffect(() => {
    if (identifier !== 'demo') return;
    const buyerNames = ['Thu Thảo', 'Quốc Bảo', 'Minh Tuấn', 'Ngọc Hân', 'Hoàng Long', 'Thùy Chi', 'Kim Ngân'];
    const buyerCities = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương'];
    const items = [
      'Serum B5 Centella',
      'Kem Chống Nắng Kiềm Dầu',
      'Combo Serum + KCN',
      'Sữa Rửa Mặt Amino Acid',
    ];

    const alertInterval = setInterval(() => {
      const name = buyerNames[Math.floor(Math.random() * buyerNames.length)];
      const city = buyerCities[Math.floor(Math.random() * buyerCities.length)];
      const item = items[Math.floor(Math.random() * items.length)];

      // Add automated comment occasionally
      if (Math.random() > 0.4) {
        const preset = USER_PROFILES_MAP[name];
        setChatMessages((prev) => [
          ...prev.slice(-30),
          {
            id: String(Date.now()),
            sender: name,
            role: 'VIEWER',
            avatar: preset?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
            text: `(${city}) Vừa chốt đơn ${item} nhận voucher phiên live rồi nha shop!`,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }, 9000);

    return () => {
      clearInterval(alertInterval);
    };
  }, [identifier]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Derived products
  const products: LiveProduct[] = useMemo(() => {
    if (sessionData?.products && sessionData.products.length > 0) {
      return sessionData.products.map((p: any, idx: number) => {
        const prod = p.product || {};
        const basePrice = Number(p.variant?.price ?? prod.price ?? 0);
        const discountVal = sessionData.coupon?.discountValue ? Number(sessionData.coupon.discountValue) : 20;
        const discountType = sessionData.coupon?.discountType || 'PERCENTAGE';
        const livePrice =
          discountType === 'PERCENTAGE'
            ? Math.round(basePrice * (1 - discountVal / 100))
            : Math.max(1000, basePrice - discountVal);
        return {
          id: prod.id || `session-prod-${idx}`,
          variantId: p.variantId || p.variant?.id || undefined,
          variantName: p.variant?.name,
          title: prod.title || prod.name || `Sản phẩm Deal Live #${idx + 1}`,
          imageUrl: prod.imageUrl || defaultProducts[idx % defaultProducts.length]?.imageUrl,
          price: basePrice,
          livePrice,
          discountPercentage: Math.round(((basePrice - livePrice) / basePrice) * 100),
          storeName: sessionData.store?.name || 'Gian Hàng Đối Tác',
          storeId: sessionData.store?.id,
          soldPercent: 75 + ((idx * 7) % 20),
          stockLeft: Math.max(3, 15 - idx * 2),
          category: prod.category || (idx % 2 === 0 ? 'Chăm sóc da' : 'Nước hoa'),
          badge: idx === 0 ? 'Mall' : idx % 2 === 1 ? '10.10' : 'Xu Hướng',
        };
      });
    }
    return defaultProducts;
  }, [sessionData, defaultProducts]);

  const pinnedProduct = products[pinnedIndex] || products[0];

  // Dynamic categories available for filter pills (TikTok Live style)
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    if (cats.size < 2) {
      cats.add('Nước hoa');
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
      return [products[pinnedIndex] || products[0]];
    }
    if (bagFilterTab !== 'ALL') {
      return list.filter(
        (p) =>
          p.category === bagFilterTab ||
          p.title.toLowerCase().includes(bagFilterTab.toLowerCase()),
      );
    }
    return list;
  }, [products, pinnedIndex, bagFilterTab, bagSearchQuery]);

  const couponCode = sessionData?.coupon?.displayCode || 'LIVEDEAL25K';
  const couponDiscount = sessionData?.coupon
    ? sessionData.coupon.discountType === 'PERCENTAGE'
      ? `${Number(sessionData.coupon.discountValue)}%`
      : `${Number(sessionData.coupon.discountValue).toLocaleString('vi-VN')} ₫`
    : '25.000 ₫';

  // TRIGGER FLOATING EMOJI REACTION (TikTok / Facebook Live style)
  const triggerReaction = (emoji: string, e?: React.MouseEvent, customIconUrl?: string) => {
    const stageRect = stageRef.current?.getBoundingClientRect();
    let baseBottom = 76;
    let baseRight: number | undefined = undefined;
    let baseLeft: number | undefined = undefined;

    const matchedDef = REALISTIC_3D_REACTIONS.find((r) => r.emoji === emoji || r.id === emoji);
    const resolvedIconUrl = customIconUrl || matchedDef?.iconUrl;

    if (e && stageRect) {
      const targetBtn = (e.target as HTMLElement).closest('button');
      if (targetBtn && stageRef.current?.contains(targetBtn)) {
        // Bấm trực tiếp vào các nút icon reaction ở thanh dock dưới góc phải
        const btnRect = targetBtn.getBoundingClientRect();
        baseRight = Math.max(12, stageRect.right - (btnRect.left + btnRect.width / 2) - 20);
        baseBottom = Math.max(50, stageRect.bottom - btnRect.top + 8);
      } else if (!targetBtn && stageRef.current?.contains(e.target as Node)) {
        // Bấm trực tiếp vào màn hình live stage
        baseLeft = Math.max(20, Math.min(stageRect.width - 60, e.clientX - stageRect.left - 24));
        baseBottom = Math.max(30, stageRect.bottom - e.clientY);
      } else {
        baseRight = Math.floor(Math.random() * 120) + 36;
        baseBottom = 76;
      }
    } else {
      // Mặc định xuất hiện phía góc dưới bên phải khu vực reaction dock
      baseRight = Math.floor(Math.random() * 120) + 36;
      baseBottom = 76;
    }

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
    api
      .post(`/live-sessions/public/${encodeURIComponent(identifier)}/interaction`, {
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

    // Khi bấm tim hoặc icon, bắn ra 1 đến 2 icon với kích thước và độ lệch khác nhau
    const spawnCount = emoji === '❤️' ? (Math.random() < 0.6 ? 2 : 3) : 1;
    const newItems: FloatingReaction[] = [];

    for (let i = 0; i < spawnCount; i++) {
      reactionCounterRef.current += 1;
      const newId = reactionCounterRef.current;
      // Drift & sway chuẩn vật lý tự nhiên TikTok / Facebook
      const driftX = (Math.random() - 0.5) * 110;
      const sway = Math.floor(Math.random() * 22) + 16;
      const rotStart = Math.floor(Math.random() * 20) - 10;
      const rotMid = Math.floor(Math.random() * 26) - 13;
      const rotEnd = Math.floor(Math.random() * 32) - 16;
      // Tốc độ bay nhanh, dứt khoát: 0.95s - 1.25s (thay vì 2s chậm chạp)
      const duration = +(Math.random() * 0.3 + 0.95).toFixed(2);

      const offsetSpread = (Math.random() - 0.5) * 26;
      // Dòng chảy tim luân chuyển màu rực rỡ như TikTok Live
      const assignedIconUrl = emoji === '❤️'
        ? TIKTOK_HEARTS[(newId + i) % TIKTOK_HEARTS.length]
        : resolvedIconUrl;

      newItems.push({
        id: newId,
        emoji,
        iconUrl: assignedIconUrl,
        bottom: baseBottom + i * 10,
        right: baseRight !== undefined ? Math.max(8, baseRight + offsetSpread) : undefined,
        left: baseLeft !== undefined ? Math.max(8, baseLeft + offsetSpread) : undefined,
        size: Math.floor(Math.random() * 14) + (i === 0 ? 48 : 40),
        driftX,
        sway,
        rotStart,
        rotMid,
        rotEnd,
        duration,
      });

      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== newId));
      }, Math.floor(duration * 1000) + 60);
    }

    setFloatingReactions((prev) => [...prev.slice(-45), ...newItems]);
  };

  // Handle click anywhere on the video screen (TikTok style tap to heart)
  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Không kích hoạt nếu bấm vào nút, input, card tương tác
    if ((e.target as HTMLElement).closest('button, input, select, a, [role="button"]')) {
      return;
    }
    // 75% ra tim đổi màu TikTok, 25% ra các reaction biểu cảm vui nhộn Facebook
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
      toast.success(`Bạn đã lưu mã ${couponCode} vào ví rồi!`);
      return;
    }
    setVoucherClaimLoading(true);
    try {
      if (sessionData?.id) {
        await api.post(`/live-sessions/${sessionData.id}/claim`, {
          claimKey: `claim_${currentUser?.id || 'guest'}_${Date.now()}`,
        });
      }
      setIsVoucherClaimed(true);
      toast.success(`Đã lưu mã voucher ${couponCode} vào ví! Mã sẽ tự áp dụng khi bạn thanh toán.`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Chưa lưu được voucher. Vui lòng thử lại.');
    } finally {
      setVoucherClaimLoading(false);
    }
  };

  // Send live chat comment
  const handleSendComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputComment.trim()) return;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: currentUser?.fullName || 'Bạn (Khách xem)',
      role: (currentUser?.role === 'SHOP_MANAGER' ? 'SHOP' : currentUser?.role === 'COLLABORATOR' ? 'HOST' : 'VIEWER') as any,
      avatar: currentUser?.avatarUrl || (currentUser as any)?.avatar || undefined,
      text: inputComment.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputComment('');
  };

  // Add to cart
  const handleAddToCart = (product: LiveProduct) => {
    addItem({
      variantId: product.variantId,
      liveSessionId: sessionData?.id,
      liveCouponCode: sessionData?.coupon?.displayCode,
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl || '',
        stockQuantity: product.stockLeft ?? 9999,
        variants: product.variantId ? [{ id: product.variantId, name: product.variantName || 'Phân loại live', sku: '', price: product.price, stockQuantity: product.stockLeft ?? 9999 }] : undefined,
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
    buyNow(
      {
        variantId: product.variantId,
        liveSessionId: sessionData?.id,
        liveCouponCode: sessionData?.coupon?.displayCode,
        product: {
          id: product.id,
          title: product.title,
          price: Number(product.price || 0),
          originalPrice: product.price ? Number(product.price) : undefined,
          imageUrl: product.imageUrl || '',
          stockQuantity: 9999,
          variants: product.variantId ? [{ id: product.variantId, name: product.variantName || 'Phân loại live', sku: '', price: product.price, stockQuantity: product.stockLeft ?? 9999 }] : undefined,
        },
        store: {
          id: product.storeId || sessionData?.store?.id || 'sora-skin',
          name: product.storeName || sessionData?.store?.name || liveShopName,
        },
        openCartAfterAdd: false,
      },
      couponCode,
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
        <button type="button" onClick={() => navigate('/')} className="rounded-xl bg-[#C59B58] px-4 py-2 font-semibold text-white">Về trang chủ</button>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#FAF8F5] text-[#1A1612] overflow-hidden flex flex-col font-sans select-none">
      {/* Hidden file input for custom backdrop upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackdropFileChange}
        className="hidden"
      />

      {/* TOP HEADER BAR (TONE SÁNG TRẮNG BE CHUẨN THƯƠNG HIỆU SCANMS) */}
      <header className="h-16 px-3 sm:px-6 bg-white/95 backdrop-blur-md border-b border-[#EAE4D7] flex items-center justify-between z-30 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#1A1612] transition cursor-pointer"
            title="Quay lại Sàn Mua Sắm"
          >
            <ArrowLeft className="w-4 h-4 text-[#7D715E]" />
          </button>

          {/* Logo & Live Badge */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#1A1612] hidden sm:inline">
              SCANMS <span className="text-[#B88E4F]">LIVE</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {isCameraActive ? 'Camera Live' : 'Trực tiếp'}
            </span>
          </div>

          {/* KOL / Host Avatar & Shop Information (Bấm để xem Profile chi tiết) */}
          <div className="flex items-center gap-2 pl-1 sm:pl-3 border-l border-[#EAE4D7] min-w-0">
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
            <div className="min-w-0 flex flex-col justify-center">
              {/* Hàng 1: KOL đang live */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleOpenKolProfile}
                  className="text-xs sm:text-sm font-black text-[#1A1612] hover:text-[#B88E4F] transition-colors truncate max-w-[120px] sm:max-w-[160px] text-left cursor-pointer flex items-center gap-1 group/kolname"
                  title="Xem thông tin chi tiết KOC đang livestream"
                >
                  <span className="truncate group-hover/kolname:underline">
                    {sessionData?.creator?.fullName || (currentUser?.fullName ? `${currentUser.fullName} (Host)` : 'KOC Linh Trương')}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                </button>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-md bg-[#FBF5EB] border border-[#EEDFC6] text-[9px] font-black text-[#B88E4F] uppercase tracking-wide">
                  KOC Live
                </span>
              </div>

              {/* Hàng 2: Gian Hàng Đối Tác cung cấp sản phẩm (Bấm avatar hoặc tên để vào shop) */}
              <button
                type="button"
                onClick={handleOpenShopProfile}
                className="text-[10.5px] text-[#7D715E] hover:text-[#B88E4F] transition-colors truncate max-w-[140px] sm:max-w-[200px] text-left cursor-pointer flex items-center gap-1.5 group/shop"
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
                  {sessionData?.store?.name || 'Sora Skin Official Store'}
                </span>
                <span className="px-1 py-0.2 rounded bg-amber-50 text-amber-700 text-[8px] font-black border border-amber-200 shrink-0">
                  MALL
                </span>
              </button>
            </div>

            {/* Nút Theo dõi */}
            <button
              type="button"
              onClick={() => setIsFollowing((v) => !v)}
              className={`ml-1 px-2.5 py-1 rounded-full text-xs font-bold transition shrink-0 cursor-pointer select-none active:scale-95 ${
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
          <div className="hidden lg:flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-full bg-[#FAF8F5] border border-[#EEDFC6] shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shrink-0">
              <Ticket className="w-3 h-3 text-[#B88E4F]" />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-extrabold text-[#1A1612]">Voucher: Giảm {couponDiscount}</span>
              <span className="text-[10px] text-[#7D715E] font-mono">({couponCode})</span>
            </div>
            <button
              type="button"
              onClick={() => void handleClaimVoucher()}
              disabled={voucherClaimLoading}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer select-none active:scale-95 shadow-2xs ${
                isVoucherClaimed
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] text-white'
              }`}
            >
              {isVoucherClaimed ? 'Đã lưu' : 'Lưu mã'}
            </button>
          </div>
        )}

        {/* Right Stats & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Viewers Pill (Số người đang xem trực tiếp thực tế) */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#EAE4D7] text-xs font-bold text-[#1A1612] shadow-2xs"
            title={`${viewerCount.toLocaleString('vi-VN')} người đang xem trực tiếp phiên live này`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Eye className="w-3.5 h-3.5 text-[#B88E4F]" />
            <span className="font-mono">{viewerCount.toLocaleString('vi-VN')}</span>
          </div>

          {/* Likes Pill with Micro Pop Animation (Lượt thả tim thực tế) */}
          <div className="relative">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-black text-rose-600 shadow-2xs cursor-pointer active:scale-90 transition-transform select-none"
              onClick={(e) => triggerReaction('❤️', e, REALISTIC_3D_REACTIONS[0].iconUrl)}
              title={`${likesCount.toLocaleString('vi-VN')} lượt thả tim thực tế (Bấm để thả tim)`}
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
              <span className="font-mono">
                {likesCount >= 10000 ? `${(likesCount / 1000).toFixed(1)}k` : likesCount.toLocaleString('vi-VN')}
              </span>
            </div>

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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none shadow-xs ${
                isCameraActive
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-white hover:bg-[#FAF8F5] text-[#1A1612] border border-[#EAE4D7]'
              }`}
              title={isCameraActive ? 'Tắt camera trực tiếp' : 'Bật camera máy tính để phát sóng'}
            >
              {isCameraActive ? (
                <>
                  <VideoOff className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Tắt Cam</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span className="hidden sm:inline">Bật Camera Live</span>
                </>
              )}
            </button>
          )}

          {/* Mute Audio Toggle */}
          {isSessionHost && (
            <div className="relative">
              <button type="button" disabled={!isCameraActive} aria-expanded={isFilterPanelOpen}
                onClick={() => setIsFilterPanelOpen((open) => !open)}
                className={cn('inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:opacity-40',
                  faceFilter === 'off' ? 'border-[#EAE4D7] bg-white text-[#7D715E]' : 'border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]')}
                title="Filter khuôn mặt">
                <Sparkles className="h-4 w-4" /><span className="hidden sm:inline">Filter</span>
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
            className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#1A1612] transition cursor-pointer"
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
            className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#7D715E] hover:text-[#1A1612] transition cursor-pointer hidden sm:block"
            title="Chia sẻ phiên livestream"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Host Mode Studio Modal Toggle (Chỉ hiển thị cho Host / CTV / Shop / Admin) */}
          {(currentUser?.role === 'COLLABORATOR' ||
            currentUser?.role === 'SHOP_MANAGER' ||
            currentUser?.role === 'SYSTEM_ADMIN' ||
            currentUser?.role === 'SYSTEM_MANAGER') && (
            <button
              type="button"
              onClick={() => setIsHostStudioOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-white text-xs font-bold transition shadow-xs cursor-pointer select-none"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Host Studio</span>
            </button>
          )}
        </div>
      </header>

      {isSessionHost && sessionData?.id && <div className="max-h-[35vh] shrink-0 overflow-auto px-3 pb-3"><LiveGovernancePanel session={sessionData} audience="kol" liveRoom /></div>}
      {(sessionEnded || ['ENDED', 'CANCELLED'].includes(sessionData?.status)) && <div className="shrink-0 border-b border-[#EEDFC6] bg-[#FBF5EB] px-6 py-3 text-sm text-[#7D715E]">Phiên đã kết thúc. Đơn đã đặt tiếp tục được xử lý; KOL có thể xem lý do và gửi khiếu nại trong hồ sơ phiên.</div>}

      {/* MAIN SCREEN: BRIGHT WARM STAGE + CHAT SIDEBAR */}
      <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden bg-[#F3EFE6]">
        {/* CENTRAL VIDEO STREAM & INTERACTIVE STAGE */}
        <div
          ref={stageRef}
          onClick={handleScreenClick}
          className="relative flex-1 h-full overflow-hidden flex items-center justify-center cursor-pointer select-none bg-[#EAE4D7]/40"
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

            {(sessionEnded || ['ENDED', 'CANCELLED'].includes(sessionData?.status)) && <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#FAF8F5]"><div className="px-6 text-center"><p className="text-lg font-semibold text-[#1A1612]">Phiên livestream đã kết thúc</p><p className="mt-2 text-sm text-[#7D715E]">Cảm ơn bạn đã theo dõi trên SCANMS.</p></div></div>}

            {!isSessionHost && !remoteStream && (hostOnline || isStreamLive || streamError) && (
              <div className="absolute left-1/2 top-1/2 z-10 max-w-[min(90%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-center text-sm font-semibold text-[#1A1612] shadow-lg backdrop-blur-sm">
                {streamError || (isStreamLive
                  ? 'Đang kết nối camera của KOL…'
                  : 'KOL đã vào phiên, đang chờ bật camera…')}
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
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
            {floatingReactions.map((reaction) => (
              <span
                key={reaction.id}
                style={{
                  position: 'absolute',
                  bottom: `${reaction.bottom}px`,
                  right: reaction.right !== undefined ? `${reaction.right}px` : undefined,
                  left: reaction.left !== undefined ? `${reaction.left}px` : undefined,
                  width: `${reaction.size}px`,
                  height: `${reaction.size}px`,
                  fontSize: `${reaction.size}px`,
                  '--drift-x': `${reaction.driftX}px`,
                  '--sway': `${reaction.sway}px`,
                  '--rot-start': `${reaction.rotStart}deg`,
                  '--rot-mid': `${reaction.rotMid}deg`,
                  '--rot-end': `${reaction.rotEnd}deg`,
                  '--reaction-duration': `${reaction.duration}s`,
                } as React.CSSProperties}
                className="animate-floating-reaction select-none drop-shadow-md inline-flex items-center justify-center leading-none pointer-events-none"
              >
                {reaction.iconUrl ? (
                  <img
                    src={reaction.iconUrl}
                    alt={reaction.emoji}
                    style={{ width: `${reaction.size}px`, height: `${reaction.size}px` }}
                    className="object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.42)] select-none pointer-events-none"
                    loading="eager"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span style={{ fontSize: `${reaction.size * 0.75}px` }}>{reaction.emoji}</span>
                )}
              </span>
            ))}
          </div>

          {/* PINNED DEAL CARD (Deal Ghim Đang Giới Thiệu - Thiết Kế Nhỏ Gọn & Hiệu Ứng Lung Linh) */}
          {pinnedProduct && (!isBagOpen || bagPosition !== 'left') && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-16 sm:bottom-18 left-3 sm:left-4 z-20 transition-all duration-300 pointer-events-auto"
            >
              {isPinnedDealCollapsed ? (
                /* Nút Thu Gọn Siêu Nhỏ Gọn Có Hiệu Ứng Nhấp Nháy & Glow */
                <button
                  type="button"
                  onClick={() => setIsPinnedDealCollapsed(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#EEDFC6] shadow-[0_4px_16px_rgba(197,155,88,0.25)] text-[#1A1612] hover:bg-[#FAF8F5] transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold group select-none animate-in fade-in zoom-in-95 duration-200"
                  title="Bấm để mở rộng sản phẩm đang giới thiệu"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                  </span>
                  <Flame className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                  <span className="font-extrabold text-[#B88E4F]">#{pinnedIndex + 1} Deal Live</span>
                  <span className="text-[11px] text-rose-600 font-mono font-black">{formatCountdown(dealCountdownSeconds)}</span>
                  <ChevronUp className="w-3 h-3 text-[#7D715E] group-hover:-translate-y-0.5 transition-transform" />
                </button>
              ) : (
                /* Card Sản Phẩm Nhỏ Gọn Với Hiệu Ứng Ánh Sáng Shimmer & Ticking Countdown */
                <div className="relative w-[280px] sm:w-[310px] rounded-2xl bg-white/95 backdrop-blur-md border border-[#EEDFC6] p-2.5 text-[#1A1612] shadow-[0_8px_30px_rgba(197,155,88,0.22)] hover:shadow-[0_12px_36px_rgba(197,155,88,0.3)] transition-all duration-300 hover:-translate-y-0.5 group overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
                  {/* Subtle top shimmer glow bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C59B58] to-transparent opacity-80" />

                  {/* Header: Pinned Label + Countdown Timer + Minimize Button */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 text-rose-700 text-[9.5px] font-black uppercase tracking-wider shadow-2xs">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600" />
                      </span>
                      <span>ĐANG GIỚI THIỆU #{pinnedIndex + 1}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#B88E4F] bg-[#FBF5EB] px-2 py-0.5 rounded-full border border-[#EEDFC6]/60">
                        <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
                        <span className="font-mono">{formatCountdown(dealCountdownSeconds)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPinnedDealCollapsed(true)}
                        className="p-1 rounded-md text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] transition cursor-pointer"
                        title="Thu nhỏ thẻ giới thiệu"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Product Info Row: Compact Thumbnail + Title + Price */}
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#EAE4D7] shrink-0 bg-white shadow-2xs group-hover:border-[#C59B58]/60 transition-colors">
                      <img
                        src={pinnedProduct.imageUrl || ''}
                        alt={pinnedProduct.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {pinnedProduct.discountPercentage && (
                        <span className="absolute bottom-0 right-0 left-0 bg-gradient-to-r from-rose-600 to-red-600 text-white text-[8px] font-black text-center py-0.2">
                          -{pinnedProduct.discountPercentage}%
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-xs font-bold text-[#1A1612] truncate leading-tight group-hover:text-[#B88E4F] transition-colors"
                        title={pinnedProduct.title}
                      >
                        {pinnedProduct.title}
                      </h4>
                      <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-[13px] font-black text-rose-600 font-mono tracking-tight">
                          {Number(pinnedProduct.livePrice || pinnedProduct.price).toLocaleString('vi-VN')} ₫
                        </span>
                        {pinnedProduct.livePrice && (
                          <span className="text-[10px] text-[#7D715E] line-through font-mono">
                            {Number(pinnedProduct.price).toLocaleString('vi-VN')} ₫
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons: Compact & Shimmer */}
                  <div className="mt-2 pt-2 border-t border-[#EAE4D7]/70 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(pinnedProduct)}
                      className="flex-1 py-1.5 px-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] hover:bg-[#F3EFE6] text-[#B88E4F] hover:text-[#1A1612] text-[11px] font-bold transition cursor-pointer select-none active:scale-95 text-center shadow-2xs"
                    >
                      Thêm vào giỏ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInstantBuy(pinnedProduct)}
                      className="relative flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-[#C59B58] via-[#D4AF37] to-[#B88E4F] hover:brightness-105 text-white text-[11px] font-black tracking-wide transition shadow-xs cursor-pointer select-none active:scale-95 text-center overflow-hidden group/btn"
                    >
                      {/* Sweep shine light effect */}
                      <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
                      <span>MUA NGAY</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BOTTOM STREAM CONTROLS: TÚI ĐỒ LIVE & REACTION EMOJI DOCK (TIKTOK / SHOPEE STYLE) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto"
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

            {/* COLLAPSIBLE 3D REACTION DOCK (TIKTOK & FACEBOOK LIVE STYLE) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Khi Mở Rộng: Hiển thị đầy đủ khay 11 Icon Facebook & TikTok kèm nút Thu gọn */}
              {isReactionDockExpanded ? (
                <div className="flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-xl p-1 sm:p-1.5 rounded-2xl border border-[#EEDFC6] shadow-[0_8px_30px_rgba(197,155,88,0.28)] animate-in slide-in-from-right-4 duration-200">
                  {/* Nút Thu Gọn (Collapse Button) */}
                  <button
                    type="button"
                    onClick={() => setIsReactionDockExpanded(false)}
                    className="p-1 sm:p-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#7D715E] hover:text-[#1A1612] transition-colors cursor-pointer select-none active:scale-90"
                    title="Thu gọn thanh cảm xúc"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="h-6 w-px bg-[#EAE4D7] mx-0.5" />

                  {/* Danh sách 11 Icon sắc nét chuẩn Facebook Live GIF & TikTok */}
                  <div className="flex items-center gap-1 sm:gap-1.5 max-w-[280px] xs:max-w-none overflow-x-auto no-scrollbar py-0.5">
                    {REALISTIC_3D_REACTIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => triggerReaction(item.emoji, e, item.iconUrl)}
                        className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl hover:bg-[#FAF8F5] active:scale-75 hover:scale-125 transition-all duration-150 flex items-center justify-center cursor-pointer select-none shadow-2xs hover:shadow-xs group"
                        title={item.label}
                      >
                        <img
                          src={item.iconUrl}
                          alt={item.label}
                          className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-xs group-hover:scale-115 transition-transform"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="text-base sm:text-lg absolute inset-0 flex items-center justify-center -z-10">
                          {item.emoji}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="h-6 w-px bg-[#EAE4D7] mx-0.5" />

                  {/* Heart Tap Button Trong Khay Mở Rộng */}
                  <button
                    type="button"
                    onClick={(e) => triggerReaction('❤️', e)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-rose-600 to-red-600 hover:from-rose-600 hover:to-red-700 text-white flex items-center justify-center shadow-md hover:shadow-rose-500/35 transition-all duration-150 cursor-pointer select-none active:scale-75 hover:scale-110"
                    title="Thả tim (Bấm liên tục để bắn tim bay)"
                  >
                    <img
                      src={REALISTIC_3D_REACTIONS[0].iconUrl}
                      alt="Heart"
                      className="w-7 h-7 sm:w-8 sm:h-8 object-contain filter drop-shadow-sm animate-pulse pointer-events-none"
                    />
                  </button>
                </div>
              ) : (
                /* Khi Thu Gọn: Nút bấm nhỏ gọn tinh tế + Nút Thả tim đỏ rực */
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-xl p-1 sm:p-1.5 rounded-2xl border border-[#EEDFC6] shadow-[0_4px_24px_rgba(197,155,88,0.22)] animate-in fade-in duration-200">
                  {/* Nút Mở Rộng khay Icon */}
                  <button
                    type="button"
                    onClick={() => setIsReactionDockExpanded(true)}
                    className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#1A1612] text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shadow-2xs"
                    title="Bấm để mở đủ 11 icon cảm xúc chuẩn Facebook & TikTok Live"
                  >
                    <img
                      src={REALISTIC_3D_REACTIONS[1].iconUrl}
                      alt="Like"
                      className="w-5 h-5 object-contain group-hover:scale-125 transition-transform"
                    />
                    <span className="hidden sm:inline text-[11px] text-[#7D715E] group-hover:text-[#1A1612]">
                      Icon Live
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#FBF5EB] border border-[#EEDFC6] text-[9.5px] font-black text-[#B88E4F]">
                      +{REALISTIC_3D_REACTIONS.length}
                    </span>
                  </button>

                  {/* Nút Bắn Tim Lớn (Big Tap Heart - TikTok Fountain) */}
                  <button
                    type="button"
                    onClick={(e) => triggerReaction('❤️', e)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-red-600 hover:from-rose-600 hover:to-red-700 text-white flex items-center justify-center shadow-lg hover:shadow-rose-500/35 transition-all duration-150 cursor-pointer select-none active:scale-75 hover:scale-110 active:rotate-12 group border border-rose-400/40"
                    title="Bắn tim cho phiên live (Bấm liên tục để thả tim bay)"
                  >
                    <img
                      src={REALISTIC_3D_REACTIONS[0].iconUrl}
                      alt="Heart"
                      className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-md group-hover:scale-120 group-active:scale-130 transition-transform duration-150 animate-pulse pointer-events-none"
                    />
                  </button>
                </div>
              )}
            </div>
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
          <form onSubmit={handleSendComment} className="p-3 border-t border-[#EAE4D7] bg-white flex items-center gap-2">
            <input
              type="text"
              value={inputComment}
              onChange={(e) => setInputComment(e.target.value)}
              placeholder="Gửi bình luận hoặc hỏi KOC..."
              className="flex-1 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs text-[#1A1612] placeholder:text-[#7D715E] focus:outline-none focus:border-[#C59B58] focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!inputComment.trim()}
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
                filteredProducts.map((item, index) => {
                  const realIndex = products.findIndex((p) => p.id === item.id);
                  const isPinned = realIndex === pinnedIndex;
                  const discountVal = item.discountPercentage || 25;
                  const saving = (item.price || 0) - (item.livePrice || item.price || 0);
                  const displayIndex = isPinned ? 6 : (index === 0 ? 6 : index);

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
                            <span
                              className={cn(
                                "px-1.5 py-0.2 rounded text-[9px] font-black leading-tight tracking-tight shrink-0 mt-0.5",
                                item.badge === 'Xu Hướng'
                                  ? "bg-gradient-to-r from-amber-500 to-[#C59B58] text-white"
                                  : item.badge === '10.10'
                                  ? "bg-rose-500 text-white"
                                  : "bg-rose-500 text-white"
                              )}
                            >
                              {item.badge || (index === 0 ? 'Mall' : index === 1 ? '10.10' : 'Xu Hướng')}
                            </span>
                            <h4
                              className="text-xs sm:text-[12.5px] font-bold text-[#1A1612] line-clamp-2 leading-snug group-hover:text-[#C59B58] transition-colors"
                              title={item.title}
                            >
                              {item.title}
                            </h4>
                          </div>

                          {/* Row 2: Freeship · Giảm · Quà miễn phí */}
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5">
                              🚚 Freeship
                            </span>
                            {index === 1 ? (
                              <span className="text-[#B88E4F] bg-[#FBF5EB] border border-[#EEDFC6] px-1.5 py-0.5 rounded font-semibold">
                                · Giảm 150K đ
                              </span>
                            ) : index >= 2 && discountVal > 0 ? (
                              <span className="text-[#B88E4F] bg-[#FBF5EB] border border-[#EEDFC6] px-1.5 py-0.5 rounded font-semibold">
                                · Giảm {saving >= 100000 ? `${Math.round(saving / 1000)}K đ` : `${discountVal}%`}
                              </span>
                            ) : null}
                            {index > 0 && (
                              <span className="text-[#B88E4F] bg-[#FBF5EB] border border-[#EEDFC6] px-1.5 py-0.5 rounded font-semibold">
                                · Quà miễn phí
                              </span>
                            )}
                          </div>

                          {/* Row 3: Assurance line */}
                          <p className="mt-0.5 text-[10.5px] text-[#7D715E] font-normal truncate m-0">
                            Thử trước khi quyết định
                          </p>
                        </div>

                        {/* Row 4: Pricing & Action Buttons */}
                        <div className="mt-1.5 flex items-end justify-between gap-2">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-sm sm:text-[15px] font-black text-[#1A1612] tracking-tight">
                              {Number(item.livePrice || item.price).toLocaleString('vi-VN')}₫
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
      {isHostStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#EAE4D7] shadow-[0_25px_70px_rgba(26,22,18,0.22)] overflow-hidden text-[#1A1612] flex flex-col animate-in zoom-in-95 duration-200">
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
              </div>

              {studioTab === 'PRODUCTS' && (
                <span className="text-xs text-[#7D715E] font-medium hidden sm:inline">
                  Đang ghim trên màn hình: <strong className="text-[#B88E4F]">#{pinnedIndex === 0 ? '6' : pinnedIndex}</strong>
                </span>
              )}
            </div>

            {/* NỘI DUNG TAB 1: GHIM SẢN PHẨM (DANH SÁCH HÀNG PHẲNG, GỌN GÀNG) */}
            {studioTab === 'PRODUCTS' && (
              <div className="px-6 py-2">
                <div className="max-h-[250px] overflow-y-auto divide-y divide-[#EAE4D7] rounded-2xl border border-[#EAE4D7] bg-white no-scrollbar">
                  {products.map((p, idx) => {
                    const isCurrentPinned = idx === pinnedIndex;
                    const displayRank = idx === 0 ? 6 : idx;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-3 transition ${
                          isCurrentPinned ? 'bg-[#FBF5EB]/80' : 'hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span className="text-xs font-mono font-bold text-[#7D715E] w-6 shrink-0 text-center">
                            #{displayRank}
                          </span>
                          <img
                            src={p.imageUrl || ''}
                            alt={p.title}
                            className="w-11 h-11 rounded-xl object-cover border border-[#EAE4D7] bg-[#FAF8F5] shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#1A1612] truncate max-w-[260px] sm:max-w-[340px]">
                              {p.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                              <span className="font-black text-rose-600">
                                {Number(p.livePrice || p.price).toLocaleString('vi-VN')} ₫
                              </span>
                              <span className="text-[#7D715E] line-through">
                                {Number(p.price).toLocaleString('vi-VN')} ₫
                              </span>
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                                Đã bán {p.soldPercent || 85}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setPinnedIndex(idx);
                            toast.success(`Đã ghim "${p.title}" lên luồng live!`);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                            isCurrentPinned
                              ? 'bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white shadow-xs'
                              : 'bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#1A1612]'
                          }`}
                        >
                          {isCurrentPinned ? '🔥 Đang ghim' : 'Ghim deal'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
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

            {/* THANH TÁC VỤ DƯỚI CÙNG (FOOTER ACTIONS) */}
            <div className="px-6 py-4 bg-[#FAF8F5] border-t border-[#EAE4D7] flex items-center justify-between gap-3 mt-auto">
              <button
                type="button"
                onClick={() => {
                  toast.success('Đã tung thêm 50 voucher giảm 25K độc quyền phiên live!');
                }}
                className="px-4 py-2.5 rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#F3EFE6] text-xs font-bold text-[#1A1612] transition cursor-pointer flex items-center gap-1.5"
              >
                <span>🎁 Tung 50 Voucher Live</span>
              </button>
              <button
                type="button"
                onClick={() => setIsHostStudioOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-xs font-black text-white transition cursor-pointer shadow-xs active:scale-95"
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
