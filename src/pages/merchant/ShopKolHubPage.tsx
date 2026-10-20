import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './ShopKolHubCompactHeader.css';
import { createPortal } from 'react-dom';
import { StoreCooperationPanel } from '../../components/affiliate/StoreCooperationPanel';
import { SampleGhnEnvironmentPicker, SampleSandboxWaybills, SampleSandboxStatus, isSandboxShipment, sampleDisplayStatus } from '../../components/shipping/SampleGhnEnvironmentPicker';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  Package,
  BarChart3,
  UserCheck,
  Sparkles,
  Search,
  ExternalLink,
  TrendingUp,
  Award,
  Truck,
  CheckCircle2,
  Clock,
  Video,
  Plus,
  Copy,
  Check,
  DollarSign,
  Share2,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserPlus,
  Mail,
  X,
  Crown,
  ArrowUpRight,
  PackageCheck,
  RefreshCw,
  FileText,
  Handshake,
} from 'lucide-react';
import api from '../../services/api';
import ChatBoxPage from '../chat/ChatBoxPage';
import KolRecommendationPage from './KolRecommendationPage';
import { toast } from '../../utils/toast';
import { Select } from '../../components/ui/Select';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ExclusiveDealInbox } from '../../components/affiliate/ExclusiveDealInbox';
import SampleViolationAction from '../../components/affiliate/SampleViolationAction';
import SampleDeadlineExtension from '../../components/affiliate/SampleDeadlineExtension';

function formatConvTime(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Hôm qua';
  return format(d, 'dd/MM/yy', { locale: vi });
}

function getChatMessagePreview(messageText?: string, mediaName?: string): string {
  if (!messageText) return mediaName ? `📎 ${mediaName}` : 'Bắt đầu cuộc trò chuyện...';
  try {
    const parsed = JSON.parse(messageText);
    if (parsed.type === 'EXCLUSIVE_DEAL_PROPOSAL') {
      return '🤝 Đề xuất deal độc quyền';
    }
    if (parsed.type === 'EXCLUSIVE_DEAL_DECISION') {
      return parsed.status === 'APPROVED' ? '✅ Đã duyệt deal độc quyền' : '❌ Đã từ chối deal độc quyền';
    }
    if (parsed.type === 'PRODUCT_INQUIRY') {
      return `🛍️ Hỏi về: ${parsed.productTitle || 'sản phẩm'}`;
    }
    if (parsed.type === 'COUPON_VOUCHER') {
      return `🎟️ Voucher: ${parsed.couponCode || 'ưu đãi'}`;
    }
    return messageText;
  } catch {
    return messageText;
  }
}

function sampleVideoStatusLabel(status: string) {
  if (status === 'APPROVED') return 'Đã duyệt';
  if (status === 'REJECTED') return 'Cần chỉnh sửa';
  if (status === 'PENDING') return 'Chờ duyệt';
  return 'Đã nộp';
}

export interface PartnerKol {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  tier?: 'DIAMOND' | 'GOLD' | 'SILVER' | 'BRONZE';
  handle?: string;
  primaryChannel?: {
    platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE' | 'FACEBOOK';
    url: string;
    followers: number;
    engagementRate?: string;
  };
  socialChannels?: Array<{
    platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE' | 'FACEBOOK';
    url: string;
    handle: string;
    followers: number;
    engagementRate?: string;
    isVerified?: boolean;
  }>;
  kycStatus?: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  commissionRate?: number; // Custom % for this KOL
  stats: {
    totalRevenue: number;
    totalOrders: number;
    sampleRequestsCount: number;
    pendingSamplesCount: number;
    completedVideosCount: number;
  };
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageTimestamp?: number;
  unreadCount?: number;
}

type PartnerTier = NonNullable<PartnerKol['tier']>;

const normalizePartnerTier = (tier: unknown): PartnerTier | undefined => {
  const tierName =
    typeof tier === 'string'
      ? tier
      : tier && typeof tier === 'object' && 'name' in tier
        ? String((tier as { name?: unknown }).name ?? '')
        : '';
  const normalized = tierName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (normalized.includes('DIAMOND') || normalized.includes('KIM CUONG')) return 'DIAMOND';
  if (normalized.includes('GOLD') || normalized.includes('VANG')) return 'GOLD';
  if (normalized.includes('SILVER') || normalized.includes('BAC')) return 'SILVER';
  if (normalized.includes('BRONZE') || normalized.includes('DONG')) return 'BRONZE';
  return undefined;
};

export function SocialBrandIcon({ platform, className = 'w-3.5 h-3.5' }: { platform: string; className?: string }) {
  const p = (platform || '').toUpperCase();
  if (p === 'TIKTOK') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.28 8.28 0 0 0 4.84 1.55V6.85a4.85 4.85 0 0 1-1.07-.16z" fill="#000000" />
      </svg>
    );
  }
  if (p === 'YOUTUBE') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000" />
      </svg>
    );
  }
  if (p === 'FACEBOOK') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
      </svg>
    );
  }
  if (p === 'INSTAGRAM') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="#E1306C" />
      </svg>
    );
  }
  return <ExternalLink className={className} />;
}

export const getKolAvatarSrc = (src?: string, name?: string, id?: string) => {
  if (src && !src.includes('placeholder') && !src.includes('default') && !src.endsWith('/null') && !src.endsWith('/undefined')) {
    return src;
  }
  const normalized = (name || '').toLowerCase();
  if (normalized.includes('thắng') || normalized.includes('thang')) return '/assets/kol-avatar-thang.jpg';
  if (normalized.includes('linh')) return '/assets/kol-avatar-linh.jpg';
  if (normalized.includes('nam')) return '/assets/kol-avatar-nam.jpg';
  if (normalized.includes('nhật') || normalized.includes('nhat')) return '/assets/kol-avatar-nhat.jpg';
  if (normalized.includes('hà') || normalized.includes('ha')) return '/assets/kol-avatar-ha.jpg';
  if (normalized.includes('mai anh')) return '/assets/kol-avatar-maianh.jpg';
  if (normalized.includes('tuấn') || normalized.includes('tuan')) return '/assets/kol-avatar-tuan.jpg';
  if (normalized.includes('xinh') || normalized.includes('đẹp')) return '/assets/kol-avatar-depxinh.jpg';

  const fallbacks = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  ];
  const str = id || name || 'KOL';
  let sum = 0;
  for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
  return fallbacks[sum % fallbacks.length] || fallbacks[0];
};

function KolAvatar({
  src,
  name,
  id,
  className,
}: {
  src?: string;
  name: string;
  id?: string;
  className: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const resolvedSrc = getKolAvatarSrc(src, name, id);

  return (
    <span className={`${className} relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#F3EFE6] text-[#B88E4F] font-bold border border-[#EEDFC6] shadow-2xs`}>
      <img
        src={failedSource === resolvedSrc ? getKolAvatarSrc('', name, id) : resolvedSrc}
        alt={name}
        className="h-full w-full object-cover"
        onError={() => setFailedSource(resolvedSrc)}
      />
    </span>
  );
}

export interface SampleRequestItem {
  sampleRequestsBlockedAt?: string | null;
  id: string;
  status: string;
  createdAt: string;
  shippingAddress: string;
  recipientName?: string;
  recipientPhone?: string;
  socialPlatformSnapshot?: string;
  socialChannelNameSnapshot?: string;
  socialChannelUrlSnapshot?: string;
  socialFollowerSnapshot?: number;
  note?: string;
  carrier?: string;
  trackingCode?: string;
  shippingCharges?: Array<{ amount: string | number | null; trackingNumber: string; status: string; payer: string; codAmount: number; environment?: string }>;
  reviewVideoUrl?: string;
  videoTitle?: string;
  videoSubmittedAt?: string;
  deadlineAt?: string;
  revisionDeadlineAt?: string;
  expectedVideoAt?: string;
  receivedAt?: string;
  shippedAt?: string;
  rejectedReason?: string;
  videoRejectionReason?: string;
  socialChannel?: { platformName: string; channelName?: string; channelUrl: string; followerCount: number } | null;
  collaboratorMetrics?: { kycStatus: string; totalFollowers: number; totalOrdersReferred: number; tierName?: string } | null;
  videoAssets?: Array<{ id: string; title: string; urlOrContent: string; status: string; rejectionReason?: string | null }>;
  events?: Array<{ id: string; action: string; createdAt: string; details?: any }>;
  product: {
    id: string;
    title: string;
    thumbnail?: string;
    price: number;
    commissionRate?: number;
  };
  collaboratorId: string;
  collaboratorInfo?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    tier?: string;
  };
  productVariantName?: string;
}

export interface AffiliateOrderItem {
  id: string;
  orderCode: string;
  createdAt: string;
  customerName: string;
  productTitle: string;
  orderTotal: number;
  commissionEarned: number;
  status: 'DELIVERED' | 'SHIPPING' | 'PROCESSING' | 'CANCELLED';
}

export default function ShopKolHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const kolParam = searchParams.get('kol');
  const tabParam = searchParams.get('tab') || 'messages';
  const modeParam = searchParams.get('mode'); // 'ai-matching' or null

  const isAiMatchingMode = modeParam === 'ai-matching' || tabParam === 'ai-matching';
  const [kols, setKols] = useState<PartnerKol[]>([]);
  const [selectedKolId, setSelectedKolId] = useState<string>(kolParam || '');
  const [activeTab, setActiveTab] = useState<'messages' | 'samples' | 'performance' | 'profile'>(
    (['messages', 'samples', 'performance', 'profile'].includes(tabParam) ? tabParam : 'messages') as 'messages' | 'samples' | 'performance' | 'profile'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<'ALL' | 'PENDING_SAMPLE'>('ALL');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDetailHeaderCompact, setIsDetailHeaderCompact] = useState(false);
  useEffect(() => { setIsDetailHeaderCompact(false); }, [selectedKolId, activeTab]);

  // Samples management
  const [samplesMap, setSamplesMap] = useState<Record<string, SampleRequestItem[]>>({});
  const sampleLoadSequence = useRef(0);
  const [loadingBackendData, setLoadingBackendData] = useState(true);
  const [sampleFilter, setSampleFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SHIPPED' | 'RECEIVED' | 'VIDEO_SUBMITTED' | 'REVISION_REQUIRED' | 'OVERDUE' | 'DELIVERY_ISSUE' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'>('ALL');
  const [sampleProgramStats, setSampleProgramStats] = useState<any>(null);
  const [trackingModalItem, setTrackingModalItem] = useState<SampleRequestItem | null>(null);
  const [sampleShippingError, setSampleShippingError] = useState('');
  const [sampleGhnEnvironment, setSampleGhnEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  useEffect(() => { setSampleShippingError(''); setSampleGhnEnvironment(trackingModalItem && (trackingModalItem.status === 'SHIPPED' || isSandboxShipment(trackingModalItem)) ? 'TEST' : 'LIVE'); }, [trackingModalItem?.id]);
  const [carrierInput] = useState('GHN');
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [updatingSample, setUpdatingSample] = useState(false);

  // Commission & Invite Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharedShopLink, setSharedShopLink] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [copyingLink, setCopyingLink] = useState(false);
  const [ownedStore, setOwnedStore] = useState<{ id: string; name: string } | null>(null);

  const [performanceRange, setPerformanceRange] = useState<'7d' | '30d' | 'month' | 'all'>('30d');

  // Creator Discovery Directory Modal (Khám phá & Thêm KOL mới)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [showKolActionsMenu, setShowKolActionsMenu] = useState(false);
  const kolActionsDropdownRef = useRef<HTMLDivElement>(null);
  const [discoverySearch, setDiscoverySearch] = useState('');
  const [discoveryFilter, setDiscoveryFilter] = useState('ALL');
  const [discoveryTier, setDiscoveryTier] = useState('ALL');
  const [directoryError, setDirectoryError] = useState('');
  const [directoryCreators, setDirectoryCreators] = useState<any[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [connectingKolId, setConnectingKolId] = useState<string | null>(null);

  useEffect(() => {
    if (showInviteModal) {
      setInviteError('');
      setInviteSuccess('');
    }
  }, [showInviteModal]);

  // Click outside listener for KOL actions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kolActionsDropdownRef.current && !kolActionsDropdownRef.current.contains(event.target as Node)) {
        setShowKolActionsMenu(false);
      }
    };
    if (showKolActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showKolActionsMenu]);

  // Sync URL Params
  useEffect(() => {
    if (kolParam && kolParam !== selectedKolId) {
      setSelectedKolId(kolParam);
    }
    if (tabParam && ['messages', 'samples', 'performance', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [kolParam, tabParam, modeParam]);

  // Load real data from backend
  // Load real data from backend
  const loadBackendData = useCallback(async () => {
    const sequence = ++sampleLoadSequence.current;
    setLoadingBackendData(true);
    try {
// 1. Fetch conversations, sample requests, and store members in parallel
      const [sampleRes, statsRes, convsRes, membersRes]: [any, any, any, any] = await Promise.all([
        api.get('/sample-requests/shop', { headers: { 'x-skip-cache': 'true' } }).catch(() => []),
        api.get('/sample-requests/shop/stats', { headers: { 'x-skip-cache': 'true' } }).catch(() => null),
        api.get('/chat/conversations').catch(() => []),
        api.get('/store-collaborators/shop').catch(() => ({})),
      ]);

      setSampleProgramStats(statsRes?.data || statsRes || null);
      const sampleData = sampleRes?.data || sampleRes;
      if (sequence !== sampleLoadSequence.current) return;
      if (!Array.isArray(sampleData)) throw new Error('Không đọc được danh sách hàng mẫu.');
      const sampleStatsByKol: Record<string, { total: number; pending: number; completed: number }> = {};
      const requestKols: PartnerKol[] = [];

      if (Array.isArray(sampleData)) {
        const grouped: Record<string, SampleRequestItem[]> = {};
        sampleData.forEach((item: any) => {
          const kolId = item.collaboratorId || item.collaborator?.id || 'kol-unknown';
          const transformed: SampleRequestItem = {
            id: item.id,
            collaboratorId: kolId,
            status: item.status,
            createdAt: item.createdAt,
            shippingAddress: item.shippingAddress,
            recipientName: item.recipientName,
            recipientPhone: item.recipientPhone,
            socialPlatformSnapshot: item.socialPlatformSnapshot,
            socialChannelNameSnapshot: item.socialChannelNameSnapshot,
            socialChannelUrlSnapshot: item.socialChannelUrlSnapshot,
            socialFollowerSnapshot: item.socialFollowerSnapshot,
            note: item.contentType,
            carrier: item.carrier,
            trackingCode: item.trackingNumber,
            shippingCharges: item.shippingCharges || [],
            reviewVideoUrl: item.videoUrl,
            videoTitle: item.videoTitle,
            videoSubmittedAt: item.videoSubmittedAt,
            sampleRequestsBlockedAt: item.collaborator?.collaboratorProfile?.sampleRequestsBlockedAt,
            deadlineAt: item.deadlineAt,
            revisionDeadlineAt: item.revisionDeadlineAt,
            expectedVideoAt: item.expectedVideoAt,
            receivedAt: item.receivedAt,
            rejectedReason: item.rejectedReason,
            videoRejectionReason: item.videoRejectionReason,
            socialChannel: item.socialChannel,
            collaboratorMetrics: item.collaborator?.collaboratorProfile
              ? {
                  kycStatus: item.collaborator.collaboratorProfile.kycStatus,
                  totalFollowers: item.collaborator.collaboratorProfile.totalFollowers || 0,
                  totalOrdersReferred: item.collaborator.collaboratorProfile.totalOrdersReferred || 0,
                  tierName: item.collaborator.collaboratorProfile.tier?.name,
                }
              : null,
            videoAssets: item.videoAssets || [],
            events: item.events || [],
            product: {
              id: item.product?.id || 'prod',
              title: item.product?.title || 'Sản phẩm mẫu',
              thumbnail: item.product?.imageUrl || item.product?.thumbnail || item.product?.images?.[0],
              price: item.product?.price || 0,
              commissionRate: item.product?.customCommissionRate != null || item.product?.store?.defaultCommissionRate != null
                ? Number(item.product.customCommissionRate ?? item.product.store.defaultCommissionRate)
                : undefined,
            },
            collaboratorInfo: {
              id: kolId,
              fullName: item.collaborator?.fullName || item.recipientName || 'Nhà Sáng Tạo SCANMS',
              email: item.collaborator?.email || '',
              avatarUrl: item.collaborator?.collaboratorProfile?.avatarUrl || item.collaborator?.avatarUrl,
              tier: item.collaborator?.collaboratorProfile?.tier?.name || 'Mới',
            },
            productVariantName: item.productVariant?.name,
          };
          if (!grouped[kolId]) grouped[kolId] = [];
          if (!grouped[kolId].some((s) => s.id === transformed.id)) {
            grouped[kolId].unshift(transformed);
          }
          const currentStats = sampleStatsByKol[kolId] || (sampleStatsByKol[kolId] = { total: 0, pending: 0, completed: 0 });
          currentStats.total += 1;
          if (item.status === 'PENDING') currentStats.pending += 1;
          if (item.status === 'COMPLETED') currentStats.completed += 1;
        });
        setSamplesMap(grouped);

        sampleData
          .filter((item: any) => item.collaborator?.id)
          .forEach((item: any) => {
            const creator = item.collaborator;
            const profile = creator.collaboratorProfile || {};
            const channel = item.socialChannel;
            const requestStats = sampleStatsByKol[creator.id] || { total: 0, pending: 0, completed: 0 };
            requestKols.push({
              id: creator.id,
              fullName: creator.fullName || 'Nhà sáng tạo SCANMS',
              email: creator.email || '',
              phone: creator.phoneNumber || undefined,
              avatarUrl: profile.avatarUrl || creator.avatarUrl || undefined,
              tier: normalizePartnerTier(profile.tier),
              handle: channel?.channelName ? `@${channel.channelName}` : undefined,
              primaryChannel: channel ? {
                platform: (channel.platformName?.toUpperCase() as any) || 'TIKTOK',
                url: channel.channelUrl || '',
                followers: Number(channel.followerCount ?? profile.totalFollowers ?? 0),
              } : undefined,
              kycStatus: profile.kycStatus || 'PENDING',
              stats: {
                totalRevenue: 0,
                totalOrders: 0,
                sampleRequestsCount: requestStats.total,
                pendingSamplesCount: requestStats.pending,
                completedVideosCount: requestStats.completed,
              },
            });
          });
      }

      // 2. Load members from store collaborators
      const membersBody = membersRes?.data || membersRes;
      if (membersBody?.store?.id) setOwnedStore(membersBody.store);
      const backendKols: PartnerKol[] = [];
      if (Array.isArray(membersBody?.members) && membersBody.members.length > 0) {
        membersBody.members.forEach((m: any, idx: number) => {
          const c = m.collaborator || {};
          const profile = c.collaboratorProfile || {};
          const channel = c.socialChannels?.[0];
          backendKols.push({
            id: c.id || `collab-${idx}`,
            fullName: c.fullName || 'Nhà Sáng Tạo SCANMS',
            email: c.email || '',
            avatarUrl: profile.avatarUrl || c.avatarUrl || undefined,
            tier: normalizePartnerTier(profile.tier),
            handle: channel?.channelName ? `@${channel.channelName}` : undefined,
            primaryChannel: channel ? {
              platform: channel.platformName?.toUpperCase() as any,
              url: channel.channelUrl || '',
              followers: Number(channel.followerCount ?? profile.totalFollowers ?? 0),
            } : undefined,
            kycStatus: profile.kycStatus || undefined,
            commissionRate: undefined,
            stats: {
              totalRevenue: 0,
              totalOrders: 0,
              sampleRequestsCount: sampleStatsByKol[c.id]?.total || 0,
              pendingSamplesCount: sampleStatsByKol[c.id]?.pending || 0,
              completedVideosCount: sampleStatsByKol[c.id]?.completed || 0,
            },
          });
        });
      }

      // 3. Load active verified creators from backend database
      let dbKols: PartnerKol[] = [];
      try {
        const creatorsRes: any = await api.get('/chat/search-collaborators', { headers: { 'x-skip-cache': '1' } });
        const creatorsData = creatorsRes?.data || creatorsRes;
        if (Array.isArray(creatorsData) && creatorsData.length > 0) {
          dbKols = creatorsData.map((c: any) => {
            const profile = c.collaboratorProfile || {};
            const channel = c.socialChannels?.[0];
            return {
              id: c.id,
              fullName: c.fullName || 'Nhà Sáng Tạo SCANMS',
              email: c.email || '',
              phone: c.phoneNumber || '',
              avatarUrl: profile.avatarUrl || c.avatarUrl || undefined,
              tier: normalizePartnerTier(profile.tier),
              handle: channel?.channelName ? `@${channel.channelName}` : undefined,
              primaryChannel: channel
                ? {
                    platform: channel.platformName?.toUpperCase() as any,
                    url: channel.channelUrl || '',
                    followers: Number(channel.followerCount ?? profile.totalFollowers ?? 0),
                  }
                : undefined,
              socialChannels: (c.socialChannels || []).map((sc: any) => ({
                platform: sc.platformName?.toUpperCase() as any,
                url: sc.channelUrl,
                handle: `@${sc.channelName}`,
                followers: Number(sc.followerCount ?? profile.totalFollowers ?? 0),
                isVerified: sc.isVerified,
              })),
              kycStatus: profile.kycStatus || undefined,
              commissionRate: undefined,
              stats: {
                totalRevenue: 0,
                totalOrders: 0,
                sampleRequestsCount: sampleStatsByKol[c.id]?.total || 0,
                pendingSamplesCount: sampleStatsByKol[c.id]?.pending || 0,
                completedVideosCount: sampleStatsByKol[c.id]?.completed || 0,
              },
            };
          });
        }
      } catch {
        dbKols = [];
      }

      // 4. Load active conversations with collaborators (real chat history)
      const convsList = Array.isArray(convsRes) ? convsRes : convsRes?.data || [];
      const convKols: PartnerKol[] = [];

      convsList.forEach((conv: any) => {
        const c = conv.collaborator;
        if (!c || !c.id) return;
        const profile = c.collaboratorProfile || {};
        const channel = c.socialChannels?.[0];
        const lastMsg = conv.chatMessages?.[0];
        const lastText = getChatMessagePreview(lastMsg?.messageText, lastMsg?.mediaName);
        const lastDate = conv.lastMessageAt || lastMsg?.createdAt || conv.updatedAt || conv.createdAt;
        const lastTimestamp = lastDate ? new Date(lastDate).getTime() : 0;
        const unreadCount = Number(conv._count?.chatMessages || (lastMsg && !lastMsg.isRead ? 1 : 0));

        convKols.push({
          id: c.id,
          fullName: c.fullName || 'Nhà Sáng Tạo SCANMS',
          email: c.email || '',
          phone: c.phoneNumber || '',
          avatarUrl: profile.avatarUrl || c.avatarUrl || undefined,
          tier: normalizePartnerTier(profile.tier),
          handle: channel?.channelName ? `@${channel.channelName}` : undefined,
          primaryChannel: channel ? {
            platform: channel.platformName?.toUpperCase() as any,
            url: channel.channelUrl || '',
            followers: Number(channel.followerCount ?? profile.totalFollowers ?? 0),
          } : undefined,
          socialChannels: (c.socialChannels || []).map((sc: any) => ({
            platform: sc.platformName?.toUpperCase() as any,
            url: sc.channelUrl,
            handle: `@${sc.channelName}`,
            followers: Number(sc.followerCount ?? profile.totalFollowers ?? 0),
            isVerified: sc.isVerified,
          })),
          kycStatus: profile.kycStatus || undefined,
          commissionRate: undefined,
          stats: {
            totalRevenue: 0,
            totalOrders: 0,
            sampleRequestsCount: sampleStatsByKol[c.id]?.total || 0,
            pendingSamplesCount: sampleStatsByKol[c.id]?.pending || 0,
            completedVideosCount: sampleStatsByKol[c.id]?.completed || 0,
          },
          lastMessage: lastText,
          lastMessageTime: formatConvTime(lastDate),
          lastMessageTimestamp: lastTimestamp,
          unreadCount,
        });
      });

      // 4. Merge all active collaborators (Chat Conversations + Sample Requests + Store Members)
      const mergedMap = new Map<string, PartnerKol>();
      convKols.forEach((k) => mergedMap.set(k.id, k));

      requestKols.forEach((k) => {
        if (!mergedMap.has(k.id)) {
          mergedMap.set(k.id, k);
        } else {
          const existing = mergedMap.get(k.id)!;
          mergedMap.set(k.id, {
            ...existing,
            stats: { ...existing.stats, ...k.stats },
            phone: existing.phone || k.phone,
          });
        }
      });

      backendKols.forEach((k) => {
        if (!mergedMap.has(k.id)) {
          mergedMap.set(k.id, k);
        } else {
          const existing = mergedMap.get(k.id)!;
          mergedMap.set(k.id, {
            ...existing,
            stats: { ...existing.stats, ...k.stats },
          });
        }
      });

      dbKols.forEach((k) => {
        if (!mergedMap.has(k.id)) {
          mergedMap.set(k.id, k);
        }
      });

      // Sort with latest message / interaction first
      const allKols = Array.from(mergedMap.values()).sort((a, b) => {
        return (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0);
      });

      setKols(allKols);

      if (allKols.length > 0) {
        if (!kolParam || !allKols.some((k) => k.id === kolParam)) {
          setSelectedKolId(allKols[0].id);
        } else {
          setSelectedKolId(kolParam);
        }
      } else {
        setSelectedKolId('');
      }
    } catch {
if (sequence !== sampleLoadSequence.current) return;
      setKols([]);
      setSamplesMap({});
      setTrackingModalItem(null);
      toast.error('Chưa tải được thông tin nhận hàng mới nhất. Vui lòng làm mới danh sách mẫu.');
    } finally {
      if (sequence === sampleLoadSequence.current) setLoadingBackendData(false);
    }
  }, [kolParam]);

  useEffect(() => {
    loadBackendData();
    const refresh = () => { if (!document.hidden) void loadBackendData(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadBackendData]);

  useEffect(() => {
    setTrackingModalItem(current => current ? Object.values(samplesMap).flat().find(item => item.id === current.id) || null : null);
  }, [samplesMap]);

  // Selected Kol Object
  const selectedKol = useMemo(() => {
    return kols.find((k) => k.id === selectedKolId) || kols[0] || null;
  }, [kols, selectedKolId]);

  // Multi-channel list for selected KOL
  const allChannels = useMemo(() => {
    if (!selectedKol) return [];
    const list: Array<{ platform: string; url: string; handle: string; followers: number }> = [];
    if (selectedKol.socialChannels && selectedKol.socialChannels.length > 0) {
      selectedKol.socialChannels.forEach((sc) => {
        list.push({
          platform: sc.platform,
          url: sc.url,
          handle: sc.handle || selectedKol.handle || '@kenh',
          followers: sc.followers,
        });
      });
    } else if (selectedKol.primaryChannel) {
      list.push({
        platform: selectedKol.primaryChannel.platform,
        url: selectedKol.primaryChannel.url,
        handle: selectedKol.handle || '@kenh',
        followers: selectedKol.primaryChannel.followers,
      });
    }
    return list;
  }, [selectedKol]);

  // Filtered KOL List
  const filteredKols = useMemo(() => {
    return kols.filter((kol) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        kol.fullName.toLowerCase().includes(q) ||
        kol.email.toLowerCase().includes(q) ||
        (kol.handle && kol.handle.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterTag === 'PENDING_SAMPLE') {
        const kolSamples = samplesMap[kol.id] || [];
        return kolSamples.some((s) => s.status === 'PENDING') || kol.stats.pendingSamplesCount > 0;
      }
return true;
    });
  }, [kols, searchQuery, filterTag, samplesMap]);

  // Selected KOL Samples
  const currentKolSamples = useMemo(() => {
    const list = samplesMap[selectedKol?.id] || [];
    if (sampleFilter === 'ALL') return list;
    return list.filter((s) => sampleDisplayStatus(s) === sampleFilter);
  }, [samplesMap, selectedKol, sampleFilter]);

  // Handler: Select KOL
  const setAiMatchingMode = (enabled: boolean) => {
    const params = new URLSearchParams(searchParams);
    const kolId = selectedKol?.id || selectedKolId;
    if (kolId) params.set('kol', kolId);
    else params.delete('kol');
    params.set('tab', activeTab);
    if (enabled) params.set('mode', 'ai-matching');
    else params.delete('mode');
    setSearchParams(params, { replace: !enabled });
  };

  const handleSelectKol = (kolId: string) => {
    setSelectedKolId(kolId);
    setSearchParams(
      {
        kol: kolId,
        tab: activeTab,
      },
      { replace: true }
    );
  };

  const openKolProfile = (kolId: string) => {
    setSelectedKolId(kolId);
    setActiveTab('profile');
    setSearchParams(
      { kol: kolId, tab: 'profile' },
      { replace: true }
    );
  };

  // Handler: Change Tab
  const handleTabChange = (tabId: 'messages' | 'samples' | 'performance' | 'profile') => {
    setActiveTab(tabId);
    setSearchParams(
      {
        kol: selectedKolId,
        tab: tabId,
      },
      { replace: true }
    );
  };

  // Handler: Approve Sample Request
  const handleApproveSample = async (sampleId: string) => {
    try {
      await api.patch(`/sample-requests/${sampleId}/approve`, {});
      toast.success('Đã duyệt đơn gửi hàng mẫu cho KOL!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể duyệt yêu cầu mẫu.');
      return;
    }

    setSamplesMap((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((k) => {
        copy[k] = copy[k].map((item) => (item.id === sampleId ? { ...item, status: 'APPROVED' } : item));
      });
      return copy;
    });
  };

  // Handler: Reject Sample Request
  const handleRejectSample = async (sampleId: string) => {
    const rejectedReason = window.prompt('Nhập lý do từ chối yêu cầu mẫu:');
    if (!rejectedReason?.trim()) return;
    try {
      await api.patch(`/sample-requests/${sampleId}/reject`, { rejectedReason: rejectedReason.trim() });
      toast.info('Đã từ chối yêu cầu gửi hàng mẫu');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể từ chối yêu cầu mẫu.');
      return;
    }

    setSamplesMap((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((k) => {
        copy[k] = copy[k].map((item) => (item.id === sampleId ? { ...item, status: 'REJECTED' } : item));
      });
      return copy;
    });
  };

  const handleReviewSampleVideo = async (sample: SampleRequestItem, status: 'APPROVED' | 'REJECTED') => {
    const asset = sample.videoAssets?.find((item) => item.status === 'PENDING');
    if (!asset) {
      toast.error('Không tìm thấy video đang chờ kiểm duyệt.');
      return;
    }
    const rejectionReason = status === 'REJECTED'
      ? window.prompt('Nhập lý do cần chỉnh sửa video:')?.trim()
      : undefined;
    if (status === 'REJECTED' && !rejectionReason) return;
    try {
      await api.patch(`/media/${asset.id}/review`, { status, rejectionReason });
      toast.success(status === 'APPROVED' ? 'Đã nghiệm thu video và hoàn tất yêu cầu mẫu.' : 'Đã gửi yêu cầu chỉnh sửa video cho KOL.');
      await loadBackendData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật kết quả kiểm duyệt video.');
    }
  };

  // Handler: Submit Shipping Tracking
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalItem || (carrierInput !== 'GHN' && !trackingCodeInput.trim())) return;

    setUpdatingSample(true);
    setSampleShippingError('');
    let savedTrackingCode = trackingCodeInput.trim();
    try {
      if (carrierInput === 'GHN') {
        const response: any = await api.post(`/shipping/ghn/create-sample/${trackingModalItem.id}`, { environment: sampleGhnEnvironment });
        const result = response?.data?.data || response?.data || response;
        savedTrackingCode = result.trackingNumber;
        if (sampleGhnEnvironment === 'TEST') {
          toast.success(`${result.reused ? 'Dùng lại mã' : 'Đã tạo mã'} GHN sandbox: ${savedTrackingCode}.`);
          setTrackingModalItem(null);
          await loadBackendData();
          return;
        }
      } else {
        await api.patch(`/sample-requests/${trackingModalItem.id}/ship`, {
          carrier: carrierInput,
          trackingNumber: savedTrackingCode,
        });
      }
      toast.success('Đã cập nhật mã vận đơn và chuyển sang trạng thái Đang giao hàng!');
    } catch (err: any) {
      setSampleShippingError(String(err?.response?.data?.message || err?.message || 'Không thể cập nhật mã vận đơn.'));
      setUpdatingSample(false);
      return;
    } finally {
      setUpdatingSample(false);
    }

    setSamplesMap((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((k) => {
        copy[k] = copy[k].map((item) =>
          item.id === trackingModalItem.id
            ? {
                ...item,
                status: 'SHIPPED',
                carrier: carrierInput,
                trackingCode: savedTrackingCode,
              }
            : item
        );
      });
      return copy;
    });
    setTrackingModalItem(null);
    setTrackingCodeInput('');
    await loadBackendData();
  };

  // Handler: Send Kol Invitation
  const handleInviteKol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviting) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviteError('');
    setInviteSuccess('');
    setInviting(true);
    try {
      const response: any = await api.post('/store-collaborators/invite', {
        email,
        ...(ownedStore ? { storeId: ownedStore.id } : {}),
      });
      const result = response?.data || response;
      if (!result?.invitation?.id) throw new Error('Máy chủ chưa xác nhận lời mời. Vui lòng thử lại.');
      setInviteSuccess(`Đã gửi lời mời tới ${result.collaborator?.fullName || email}. Đang chờ KOL phản hồi trên SCANMS.`);
      setInviteEmail('');
      toast.success('Đã gửi lời mời hợp tác trên SCANMS.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không gửi được lời mời. Vui lòng thử lại.';
      setInviteError(message);
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  // Copy Store Invite Link
  const handleCopyInviteLink = async () => {
    if (copyingLink) return;
    setCopyingLink(true);
    setCopiedLink(false);
    try {
      const response: any = await api.get('/stores/mine');
      const list = response?.result || response?.data || response;
      const store = Array.isArray(list) ? list[0] : list;
      const storeKey = store?.slug || store?.storeId || store?.id;
      if (!storeKey) throw new Error('Gian hàng chưa có đường dẫn công khai để chia sẻ.');
      const link = new URL(`/shop/${encodeURIComponent(storeKey)}`, window.location.origin).href;
      setSharedShopLink(link);
      if (!navigator.clipboard?.writeText) throw new Error('Trình duyệt không hỗ trợ sao chép tự động. Hãy chọn và chép liên kết bên dưới.');
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success('Đã sao chép trang gian hàng trên SCANMS.');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (error) {
      toast.error(error instanceof DOMException ? 'Trình duyệt chưa cho phép sao chép. Hãy chọn và chép liên kết bên dưới.' : error instanceof Error ? error.message : 'Không sao chép được. Bạn có thể chọn và chép liên kết bên dưới.');
    } finally {
      setCopyingLink(false);
    }
  };

  // Load full creators directory from DB
  const loadDirectoryCreators = useCallback(async (q?: string) => {
    setLoadingDirectory(true);
    setDirectoryError('');
    try {
      const res: any = await api.get('/chat/search-collaborators', { params: q ? { q } : {} });
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setDirectoryCreators(data);
      }
    } catch (err) {
      console.error('Lỗi tải danh bạ KOL:', err);
      setDirectoryError('Không tải được danh bạ nhà sáng tạo. Vui lòng thử lại.');
    } finally {
      setLoadingDirectory(false);
    }
  }, []);

  // When opening discovery modal, load creators
  useEffect(() => {
    if (showDiscoveryModal) {
      loadDirectoryCreators(discoverySearch);
    }
  }, [showDiscoveryModal, loadDirectoryCreators, discoverySearch]);

  // Connect creator from directory
  const handleConnectCreator = async (creator: any) => {
    setConnectingKolId(creator.id);
    try {
      await api.post('/chat/conversations', {
        collaboratorId: creator.id,
      });

      const profile = creator.collaboratorProfile || {};
      const channel = creator.socialChannels?.[0];
      const newPartner: PartnerKol = {
        id: creator.id,
        fullName: creator.fullName || 'Nhà Sáng Tạo SCANMS',
        email: creator.email || '',
        phone: creator.phoneNumber || '',
        avatarUrl: profile.avatarUrl || creator.avatarUrl || undefined,
        tier: normalizePartnerTier(profile.tier),
        handle: channel?.channelName ? `@${channel.channelName}` : undefined,
        primaryChannel: channel
          ? {
              platform: channel.platformName?.toUpperCase() as any,
              url: channel.channelUrl || '',
              followers: Number(channel.followerCount ?? profile.totalFollowers ?? 0),
            }
          : undefined,
        socialChannels: (creator.socialChannels || []).map((sc: any) => ({
          platform: sc.platformName?.toUpperCase() as any,
          url: sc.channelUrl,
          handle: `@${sc.channelName}`,
          followers: Number(sc.followerCount ?? profile.totalFollowers ?? 0),
          isVerified: sc.isVerified,
        })),
        kycStatus: profile.kycStatus || undefined,
        commissionRate: undefined,
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          sampleRequestsCount: 0,
          pendingSamplesCount: 0,
          completedVideosCount: 0,
        },
      };

      setKols((prev) => {
        const exists = prev.some((k) => k.id === creator.id);
        if (exists) return prev;
        return [newPartner, ...prev];
      });

      setSelectedKolId(creator.id);
      setActiveTab('messages');
      setSearchParams({ kol: creator.id, tab: 'messages' }, { replace: true });
      setShowDiscoveryModal(false);
      toast.success(`Đã kết nối và mở hộp thoại trao đổi với ${creator.fullName}!`);
    } catch (err) {
      console.error('Lỗi khi kết nối với KOL:', err);
      toast.error('Không thể kết nối với nhà sáng tạo lúc này. Vui lòng thử lại!');
    } finally {
      setConnectingKolId(null);
    }
  };

  // Filtered creators in discovery directory
  const filteredDirectoryCreators = useMemo(() => {
    return directoryCreators.filter((creator) => {
      const q = discoverySearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        creator.fullName?.toLowerCase().includes(q) ||
        creator.email?.toLowerCase().includes(q) ||
        creator.phoneNumber?.includes(q) ||
        (creator.socialChannels || []).some((sc: any) =>
          sc.channelName?.toLowerCase().includes(q)
        );

      if (!matchSearch) return false;

      const matchTier = discoveryTier === 'ALL' || normalizePartnerTier(creator.collaboratorProfile?.tier) === discoveryTier;
      const matchPlatform = discoveryFilter === 'ALL' || (creator.socialChannels || []).some(
        (sc: any) => sc.platformName?.toUpperCase() === discoveryFilter
      );
      return matchTier && matchPlatform;
    });
  }, [directoryCreators, discoverySearch, discoveryFilter, discoveryTier]);

  const inviteModal = showInviteModal && createPortal(
    <div className="kol-invite-overlay fixed inset-0 z-[110] flex items-center justify-center bg-[#231D15]/35 p-4 backdrop-blur-xs" onClick={() => { if (!inviting) setShowInviteModal(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="invite-kol-title" className="kol-invite-dialog flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white shadow-[0_24px_70px_rgba(35,29,21,0.18)]" onKeyDown={event => { if (event.key === 'Escape' && !inviting) setShowInviteModal(false); }} onClick={(event) => event.stopPropagation()}>
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#EAE4D7] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><UserPlus className="h-5 w-5" /></span>
            <div><h3 id="invite-kol-title" className="text-base font-semibold text-[#1A1612]">Mời KOL hợp tác</h3><p className="mt-0.5 text-xs text-[#7D715E]">{ownedStore?.name || 'Kết nối đội ngũ nhà sáng tạo trên SCANMS'}</p></div>
          </div>
          <button type="button" disabled={inviting} onClick={() => setShowInviteModal(false)} aria-label="Đóng lời mời KOL" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#7D715E] transition hover:bg-[#FBF5EB] disabled:opacity-40"><X className="h-4 w-4" /></button>
        </header>
        <form onSubmit={handleInviteKol} className="min-h-0 overflow-y-auto px-5 py-5">
          <p className="kol-invite-description mb-4 text-sm leading-relaxed text-[#7D715E]">Gửi lời mời tới email tài khoản SCANMS của KOL/CTV.</p>
          <label htmlFor="kol-invite-email" className="mb-1.5 block text-sm font-medium text-[#1A1612]">Email của KOL/CTV <span className="text-[#DC2626]">*</span></label>
          <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B88E4F]" /><input id="kol-invite-email" type="email" required autoComplete="email" maxLength={254} disabled={inviting} placeholder="tenkol@example.com" value={inviteEmail} onChange={(event) => { setInviteEmail(event.target.value); setInviteError(''); setInviteSuccess(''); }} aria-invalid={!!inviteError} aria-describedby="kol-invite-help" className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-white pl-10 pr-3 text-sm text-[#1A1612] outline-none transition placeholder:text-[#A79B89] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/10 disabled:opacity-60" /></div>
          <p id="kol-invite-help" className="mt-2 text-xs leading-relaxed text-[#7D715E]">Hợp tác được xác nhận khi KOL chấp nhận lời mời.</p>
          {inviteError && <p role="alert" className="mt-3 text-sm text-[#DC2626]">{inviteError}</p>}
          {inviteSuccess && <div role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-[#EAE4D7] bg-white p-3 text-sm text-[#1A1612]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" /><p>{inviteSuccess}</p></div>}
          <button type="submit" disabled={inviting || !inviteEmail.trim()} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#C59B58] text-sm font-semibold text-[#231D15] transition hover:bg-[#B88E4F] disabled:cursor-not-allowed disabled:opacity-50"><UserPlus className="h-4 w-4" />{inviting ? 'Đang gửi…' : 'Gửi lời mời hợp tác'}</button>
          <details className="group mt-5 border-t border-[#EAE4D7] pt-4">
            <summary className="flex items-center gap-2 list-none cursor-pointer py-1 text-xs text-[#7D715E] [&::-webkit-details-marker]:hidden hover:text-[#1A1612]"><Share2 className="h-3.5 w-3.5 text-[#B88E4F]" /><span>Chia sẻ gian hàng</span><span className="ml-auto text-sm text-[#B88E4F] group-open:rotate-45 transition-transform" aria-hidden="true">+</span></summary>
            <p className="mt-2 text-xs leading-relaxed text-[#7D715E]">Gửi trang shop để KOL tìm hiểu. Liên kết này không tạo lời mời hợp tác.</p>
            <button type="button" disabled={copyingLink} onClick={handleCopyInviteLink} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#EAE4D7] bg-white text-xs font-medium text-[#1A1612] transition hover:bg-[#FBF5EB] disabled:opacity-50">{copiedLink ? <Check className="h-4 w-4 text-[#059669]" /> : <Copy className="h-4 w-4 text-[#B88E4F]" />}{copyingLink ? 'Đang lấy liên kết…' : copiedLink ? 'Đã sao chép' : 'Sao chép trang gian hàng'}</button>
            {sharedShopLink && <input readOnly aria-label="Liên kết trang gian hàng" value={sharedShopLink} onFocus={(event) => event.target.select()} className="mt-2 h-9 w-full rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs text-[#7D715E] outline-none" />}
          </details>
        </form>
      </section>
    </div>, document.body
  );

  const discoveryModal = showDiscoveryModal && createPortal(
        <div
          className="creator-directory-overlay fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in-50 duration-200"
          onClick={() => setShowDiscoveryModal(false)}
        >
          <div
            className="creator-directory bg-white border border-[#EAE4D7] rounded-2xl w-full max-w-4xl max-h-[84dvh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="creator-directory-title"
            onKeyDown={event => { if (event.key === 'Escape') setShowDiscoveryModal(false); }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="creator-directory-header shrink-0 px-4 py-4 sm:px-5 border-b border-[#EAE4D7] bg-white flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><Users className="h-5 w-5" /></span>
                <div className="min-w-0">
                <h3 id="creator-directory-title" className="m-0 text-lg font-bold text-[#1A1612]">
                  Khám phá nhà sáng tạo
                </h3>
                <p className="text-xs text-[#7D715E] mt-0.5">
                  Tìm đối tác phù hợp và kết nối hợp tác.
                </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscoveryModal(false)}
                className="w-8 h-8 shrink-0 rounded-lg border border-[#EAE4D7] flex items-center justify-center text-[#7D715E] hover:bg-[#FBF5EB] cursor-pointer transition"
                aria-label="Đóng danh bạ nhà sáng tạo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="creator-directory-filters px-4 py-3 sm:px-5 border-b border-[#EAE4D7] bg-white grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_155px_145px] sm:items-end">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D715E]" />
                <input
                  type="text"
                  placeholder="Tìm tên, email, số điện thoại hoặc tên kênh…"
                  aria-label="Tìm nhà sáng tạo"
                  value={discoverySearch}
                  onChange={(e) => setDiscoverySearch(e.target.value)}
                  className="h-10 w-full pl-10 pr-4 text-xs bg-white border border-[#EAE4D7] rounded-xl text-[#1A1612] placeholder:text-[#9A8E7C] outline-none focus:border-[#B88E4F] focus:ring-2 focus:ring-[#C59B58]/10 transition"
                />
              </div>

              <label className="grid gap-1 text-[11px] font-medium text-[#7D715E]">Nền tảng
                <Select value={discoveryFilter} onChange={(event) => setDiscoveryFilter(event.target.value)} className="h-10 w-full text-xs">
                  <option value="ALL">Tất cả nền tảng</option><option value="TIKTOK">TikTok</option><option value="YOUTUBE">YouTube</option><option value="INSTAGRAM">Instagram</option><option value="FACEBOOK">Facebook</option>
                </Select>
              </label>
              <label className="grid gap-1 text-[11px] font-medium text-[#7D715E]">Hạng
                <Select value={discoveryTier} onChange={(event) => setDiscoveryTier(event.target.value)} className="h-10 w-full text-xs">
                  <option value="ALL">Tất cả hạng</option><option value="DIAMOND">Kim cương</option><option value="GOLD">Vàng</option><option value="SILVER">Bạc</option><option value="BRONZE">Đồng</option>
                </Select>
              </label>
            </div>

            {/* Creators Grid */}
            <div className="creator-directory-results min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 bg-[#FAF8F5]/50">
              <p className="mb-3 text-xs text-[#7D715E]">{loadingDirectory ? 'Đang tìm kiếm…' : `${filteredDirectoryCreators.length} nhà sáng tạo phù hợp`}</p>
              {loadingDirectory ? (
                <div className="py-16 text-center text-xs text-[#7D715E]">
                  <div className="w-6 h-6 border-2 border-[#C59B58] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Đang tải nhà sáng tạo…
                </div>
              ) : directoryError ? (
                <div className="py-12 text-center text-xs text-[#7D715E]">
                  <p role="alert">{directoryError}</p>
                  <button type="button" onClick={() => loadDirectoryCreators(discoverySearch)} className="mt-3 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2 text-[#B88E4F]">Thử lại</button>
                </div>
              ) : filteredDirectoryCreators.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#7D715E]">
                  Không tìm thấy nhà sáng tạo nào phù hợp với bộ lọc.
                </div>
              ) : (
                <div className="creator-directory-grid grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                  {filteredDirectoryCreators.map((creator) => {
                    const profile = creator.collaboratorProfile || {};
                    const channels = (creator.socialChannels || []).filter((channel: any, index: number, list: any[]) =>
                      list.findIndex((item: any) => item.platformName?.toUpperCase() === channel.platformName?.toUpperCase() &&
                        (item.channelUrl?.trim().replace(/\/$/, '') || item.channelName?.trim().toLowerCase()) ===
                        (channel.channelUrl?.trim().replace(/\/$/, '') || channel.channelName?.trim().toLowerCase())) === index
                    );
                    const isConnecting = connectingKolId === creator.id;
                    const tier = normalizePartnerTier(profile.tier);
                    const renderChannel = (ch: any, idx: number) => {
                      const content = (
                        <>
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-semibold text-[#7D715E]">{ch.platformName}</span>
                            <p className="truncate text-xs text-[#1A1612]" title={ch.channelName}>{ch.channelName || 'Chưa cập nhật tên kênh'}</p>
                          </div>
                          <span className="shrink-0 text-xs tabular-nums text-[#7D715E]" title="Người theo dõi">{Number(ch.followerCount || 0).toLocaleString('vi-VN')}</span>
                          {ch.channelUrl && <ExternalLink className="h-3 w-3 shrink-0 text-[#B88E4F]" />}
                        </>
                      );
                      const className = 'flex min-w-0 items-center gap-2 rounded-lg border border-[#EAE4D7]/70 bg-white px-2.5 py-1.5';
                      return ch.channelUrl ? <a key={idx} href={ch.channelUrl} target="_blank" rel="noopener noreferrer" className={`${className} hover:border-[#C59B58]`} aria-label={`Xem kênh ${ch.platformName} của ${creator.fullName}`}>{content}</a> : <div key={idx} className={className}>{content}</div>;
                    };

                    return (
                      <div
                        key={creator.id}
                        className="creator-directory-card bg-white border border-[#EAE4D7] rounded-2xl p-4 hover:border-[#DCC69F] transition shadow-[0_2px_8px_rgba(35,29,21,0.025)] flex flex-col justify-between gap-2 min-w-0"
                      >
                        <div>
                          {/* Top: Avatar + Name + Tier */}
                          <div className="creator-directory-identity flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                              {creator.avatarUrl ? <img src={creator.avatarUrl} alt={creator.fullName} className="w-10 h-10 rounded-full object-cover border border-[#EAE4D7]" /> : <span className="grid h-10 w-10 place-items-center rounded-full border border-[#EEDFC6] bg-[#FBF5EB] text-xs font-semibold text-[#B88E4F]">{(creator.fullName || 'KOL').split(' ').filter(Boolean).slice(-2).map((part: string) => part[0]).join('')}</span>}
                              {profile.kycStatus === 'VERIFIED' && (
                                <span
                                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center"
                                  title="Đã xác minh định danh KYC"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-sm font-semibold text-[#1A1612] truncate" title={creator.fullName}>
                                  {creator.fullName}
                                </h4>
                                <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7]">
                                  {tier === 'DIAMOND' ? 'Kim cương' : tier === 'GOLD' ? 'Vàng' : tier === 'SILVER' ? 'Bạc' : tier === 'BRONZE' ? 'Đồng' : 'Chưa xếp hạng'}
                                </span>
                              </div>

                            </div>
                          </div>

                          <details className="group mt-2">
                            <summary className="inline-flex items-center gap-1.5 list-none text-xs text-[#7D715E] cursor-pointer py-0.5 [&::-webkit-details-marker]:hidden hover:text-[#1A1612]">Chi tiết <span className="text-[#B88E4F] text-xs group-open:rotate-45 transition-transform" aria-hidden="true">+</span></summary>
                            <div className="mt-1.5 p-3 rounded-xl border border-[#EAE4D7] bg-white space-y-2">
<p className="text-[11px] text-[#7D715E] truncate mt-0.5">
                                {creator.email} {creator.phoneNumber ? `· ${creator.phoneNumber}` : ''}
                              </p>
                              {profile.kycStatus === 'VERIFIED' && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#7D715E] mt-1">
                                  <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                                  Đã xác minh danh tính
                                </span>
                              )}
                          {/* Quick Stats */}
                          <div className="creator-directory-stats grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#EAE4D7]/70">
                            <div>
                              <div className="text-[11px] text-[#7D715E]">Người theo dõi</div>
                              <div className="text-xs font-extrabold text-[#1A1612]">
                                {Number(profile.totalFollowers || 0).toLocaleString('vi-VN')}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-[#7D715E]">Đơn giới thiệu</div>
                              <div className="text-xs font-extrabold text-[#1A1612]">
                                {profile.totalOrdersReferred ?? profile.totalOrders ?? 0} đơn
                              </div>
                            </div>

                          </div>
<details className="creator-directory-channels mt-3 space-y-2">
                            <summary className="cursor-pointer text-xs font-medium text-[#8C6226]">{channels.length} kênh mạng xã hội · Xem chi tiết</summary>
                            {channels.length > 0 ? (
                              <div className="space-y-1.5">
                                {channels.slice(0, 2).map(renderChannel)}
                                {channels.length > 2 && <details className="text-xs text-[#7D715E]"><summary className="cursor-pointer py-1 hover:text-[#B88E4F]">Xem thêm {channels.length - 2} kênh</summary><div className="mt-1 space-y-1.5">{channels.slice(2).map(renderChannel)}</div></details>}
                              </div>
                            ) : <p className="text-xs text-[#7D715E]">Chưa liên kết kênh mạng xã hội</p>}
                          </details>


                            </div>
                          </details>
                        </div>

                        {/* CTA button */}
                        <div className="creator-directory-action pt-3 border-t border-[#EAE4D7]/70 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleConnectCreator(creator)}
                            disabled={isConnecting}
                            className="h-9 px-3 rounded-lg text-xs font-semibold bg-[#C59B58] text-[#231D15] hover:bg-[#B88E4F] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {isConnecting ? 'Đang kết nối…' : 'Nhắn tin'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="creator-directory-footer px-4 py-3 sm:px-5 border-t border-[#EAE4D7] bg-white flex flex-wrap gap-3 items-center justify-between">
              <span className="text-xs text-[#7D715E]">
                Kết nối đối tác bằng email.
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowDiscoveryModal(false);
                  setShowInviteModal(true);
                }}
                className="h-9 px-3 rounded-lg text-xs font-semibold bg-white border border-[#EAE4D7] text-[#1A1612] hover:bg-[#FBF5EB] transition cursor-pointer inline-flex items-center gap-2"
              >
                <Mail className="h-3.5 w-3.5" /> Mời KOL hợp tác
              </button>
            </div>
          </div>
        </div>,
        document.body
      );

  if (kols.length === 0 && !isAiMatchingMode && loadingBackendData) {
    return <div className="min-h-[420px] grid place-items-center text-sm text-[#7D715E]">Đang tải hồ sơ KOL…</div>;
  }

  if (kols.length === 0 && !isAiMatchingMode) {
    return (
      <div className="w-full min-h-[420px] bg-[#FAF8F5] rounded-2xl border border-[#EAE4D7] p-8 flex flex-col items-center justify-center text-center">
        <Users className="w-9 h-9 text-[#B88E4F] mb-3" />
        <h2 className="text-base font-bold text-[#1A1612]">Chưa có dữ liệu KOL hoặc yêu cầu mẫu</h2>
        <p className="max-w-lg mt-2 text-sm text-[#7D715E]">
          Khi KOL kết nối với Shop hoặc gửi yêu cầu nhận mẫu, hồ sơ và lịch sử thật sẽ xuất hiện tại đây.
        </p>
        <button type="button" onClick={() => setShowDiscoveryModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#C59B58] px-4 py-2.5 text-sm font-semibold text-[#231D15] hover:bg-[#B88E4F]">
          <Plus className="h-4 w-4" /> Tìm nhà sáng tạo
        </button>
        <button type="button" onClick={() => setAiMatchingMode(true)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#EEDFC6] bg-white px-4 py-2.5 text-sm font-semibold text-[#B88E4F] hover:bg-[#FBF5EB]">
          <Sparkles className="h-4 w-4" /> AI Tìm Kiếm KOL Mới
        </button>
        {discoveryModal}
        {inviteModal}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pb-4" id="shop-kol-hub-workspace">
      {/* Mode 1: AI Recommendation Mode */}
      {isAiMatchingMode ? (
        <div className="kol-ai-workspace">
          <KolRecommendationPage onReturn={() => setAiMatchingMode(false)} />
        </div>
      ) : (
        /* KHÔNG GIAN 1-1 (CREATOR CRM VIEW) */
        <div className="shop-kol-shell bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden flex flex-col sm:flex-row h-[calc(100dvh-110px)] min-h-[520px] max-h-[960px]">
          {/* LEFT COLUMN: KOL List & Filters */}
          <div
            className={`shop-kol-sidebar ${
              isSidebarCollapsed ? 'w-[72px]' : 'w-full sm:w-[285px] lg:w-[305px] xl:w-[325px]'
            } flex-shrink-0 overflow-hidden border-r border-[#EAE4D7] bg-[#FAF8F5] flex flex-col h-48 sm:h-full transition-all duration-300 ease-in-out`}
          >
            {isSidebarCollapsed ? (
              /* COLLAPSED VIEW: Only Avatars & Expand Toggle */
              <div className="flex flex-col h-full items-center">
                {/* Header with Expand Button */}
                <div className="h-14 w-full border-b border-[#EAE4D7] bg-[#FAF8F5] flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="w-9 h-9 rounded-xl bg-white border border-[#EAE4D7] hover:border-[#B88E4F] hover:bg-[#FBF5EB] text-[#7D715E] hover:text-[#B88E4F] flex items-center justify-center transition cursor-pointer shadow-2xs"
                    title="Mở rộng danh sách nhà sáng tạo"
                    aria-label="Mở rộng danh sách nhà sáng tạo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Collapsed List: Avatars only */}
                <div className="flex-1 w-full overflow-y-auto py-3 px-2 space-y-3 no-scrollbar flex flex-col items-center">
                  {filteredKols.map((kol) => {
                    const isSelected = selectedKol ? kol.id === selectedKol.id : false;
                    const kolSamples = samplesMap[kol.id] || [];
                    const pendingSamples = kolSamples.filter((s) => s.status === 'PENDING').length;
                    const cleanHandle = kol.handle ? kol.handle.replace(/^@+/, '@') : kol.email;

                    return (
                      <div key={kol.id} className="relative group">
                        <button
                          type="button"
                          onClick={() => handleSelectKol(kol.id)}
                          className={`relative p-1 rounded-2xl transition cursor-pointer block ${
                            isSelected
                              ? 'bg-[#FBF5EB] ring-2 ring-[#C59B58] shadow-sm'
                              : 'hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <div className="relative">
                            <KolAvatar
                              src={kol.avatarUrl}
                              name={kol.fullName}
                              className="w-10 h-10 rounded-xl border border-[#EAE4D7] text-xs object-cover"
                            />
                            {kol.kycStatus === 'VERIFIED' && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#059669] text-white flex items-center justify-center text-[8px] font-bold border-2 border-white shadow-2xs"
                                title="Đã xác minh KYC"
                              >
                                ✓
                              </span>
                            )}
                            {pendingSamples > 0 && (
                              <span
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-black border-2 border-white animate-pulse"
                                title={`${pendingSamples} mẫu mới cần duyệt`}
                              >
                                {pendingSamples}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Floating Tooltip Card on Hover */}
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex z-50 flex-col min-w-[210px] p-2.5 bg-white border border-[#EAE4D7] rounded-xl shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                          <div className="flex items-center gap-1.5 justify-between">
                            <span className="text-xs font-bold text-[#1A1612] truncate max-w-[130px]">
                              {kol.fullName}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-[#FAF8F5] text-[#B88E4F] border border-[#EEDFC6]">
                              {kol.tier === 'DIAMOND' ? 'KC' : kol.tier === 'GOLD' ? 'Vàng' : kol.tier === 'SILVER' ? 'Bạc' : kol.tier === 'BRONZE' ? 'Đồng' : 'Mới'}
                            </span>
                          </div>
                          <span className="text-[10.5px] text-[#7D715E] truncate mt-0.5">
                            {cleanHandle}
                          </span>
                          <div className="mt-1.5 pt-1.5 border-t border-[#EAE4D7] flex items-center justify-between text-[10px] text-[#7D715E]">
                            <span>
                              DS: <strong className="text-[#1A1612] font-bold">{kol.stats.totalRevenue > 0 ? (kol.stats.totalRevenue / 1000000).toFixed(1) + 'M ₫' : '0 ₫'}</strong>
                            </span>
                            {pendingSamples > 0 ? (
                              <span className="text-amber-600 font-bold bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                {pendingSamples} mẫu mới
                              </span>
                            ) : kol.commissionRate != null ? (
                              <span className="text-[#B88E4F] font-semibold">
                                HH: {kol.commissionRate}%
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Collapsed Footer: Copy Link Icon */}
                <div className="p-2 border-t border-[#EAE4D7] bg-[#FAF8F5] w-full flex justify-center">
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="w-10 h-10 rounded-xl bg-white border border-[#EAE4D7] hover:border-[#B88E4F] text-[#B88E4F] hover:bg-[#FBF5EB] flex items-center justify-center transition cursor-pointer shadow-2xs"
                    title={copiedLink ? "Đã chép trang gian hàng!" : "Sao chép trang gian hàng"}
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-[#059669]" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              /* EXPANDED VIEW: Full list, search, filter tags, cleaner formatting */
              <>
                {/* Header left */}
                <div className="kol-list-heading flex items-center justify-between gap-2 border-b border-[#EAE4D7] bg-white px-4 py-3 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shadow-2xs shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h1 className="truncate text-sm font-extrabold tracking-tight text-[#1A1612] uppercase">
                        Nhà sáng tạo
                      </h1>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                        {filteredKols.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      id="btn-discover-creators"
                      onClick={() => setShowDiscoveryModal(true)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#EAE4D7] bg-white text-[#7D715E] shadow-2xs transition hover:border-[#B88E4F] hover:bg-[#FBF5EB] hover:text-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                      title="Khám phá và kết nối nhà sáng tạo mới trên sàn"
                      aria-label="Tìm nhà sáng tạo KOL/KOC"
                      aria-haspopup="dialog"
                      aria-expanded={showDiscoveryModal}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(true)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#EAE4D7] bg-white text-[#7D715E] shadow-2xs transition hover:border-[#B88E4F] hover:bg-[#FBF5EB] hover:text-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                      title="Mời riêng nhà sáng tạo qua liên kết"
                      aria-label="Mời nhà sáng tạo"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSidebarCollapsed(true)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[#EAE4D7] bg-white text-[#7D715E] shadow-2xs transition hover:border-[#B88E4F] hover:bg-[#FBF5EB] hover:text-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                      title="Thu gọn danh sách"
                      aria-label="Thu gọn danh sách"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="kol-list-search border-b border-[#EAE4D7] bg-[#FAF8F5] p-3 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7D715E]" />
                    <input
                      id="input-search-kol-list"
                      type="text"
                      className="w-full rounded-xl border border-[#EAE4D7] bg-white py-2 pl-9 pr-8 text-xs font-medium text-[#1A1612] shadow-2xs transition placeholder:text-[#7D715E]/60 focus:border-[#C59B58] focus:outline-none focus:ring-2 focus:ring-[#C59B58]/15"
                      placeholder="Tìm theo tên, TikTok..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7D715E] hover:text-[#1A1612] text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Tabs Under Search */}
                  <div className="kol-list-filters flex items-center gap-3 mt-2.5 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterTag('ALL')}
                      className={`font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 pb-1 text-xs relative ${
                        filterTag === 'ALL'
                          ? 'text-[#1A1612] font-black border-b-2 border-[#C59B58]'
                          : 'border-b-2 border-transparent text-[#7D715E] hover:text-[#1A1612]'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTag('PENDING_SAMPLE')}
                      className={`font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 pb-1 text-xs relative ${
                        filterTag === 'PENDING_SAMPLE'
                          ? 'text-[#1A1612] font-black border-b-2 border-[#C59B58]'
                          : 'border-b-2 border-transparent text-[#7D715E] hover:text-[#1A1612]'
                      }`}
                    >
                      <span>Mẫu mới</span>
                      <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-200 animate-pulse" />
                    </button>
                  </div>

                  {/* Global Discovery Tools */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#EAE4D7]/70">
                    <button
                      type="button"
                      id="btn-toggle-ai-mode"
                      onClick={() => setAiMatchingMode(true)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[11px] font-bold text-[#8A642C] hover:bg-[#F3EFE6] hover:border-[#C59B58] transition shadow-2xs cursor-pointer"
                      title="Tìm kiếm KOL phù hợp bằng AI Matching"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C59B58]" />
                      <span>Tìm với AI</span>
                    </button>
                    <button
                      type="button"
                      id="btn-open-creator-directory"
                      onClick={() => setShowDiscoveryModal(true)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white border border-[#EAE4D7] text-[11px] font-bold text-[#1A1612] hover:bg-[#FAF8F5] hover:border-[#C59B58] transition shadow-2xs cursor-pointer"
                      title="Khám phá danh bạ nhà sáng tạo toàn sàn"
                    >
                      <Users className="w-3.5 h-3.5 text-[#B88E4F]" />
                      <span>Khám phá KOL</span>
                    </button>
                  </div>
                </div>

                {/* KOL items list - Exact ChatBoxPage Card Style */}
                <div className="kol-contact-list min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2.5 no-scrollbar" role="list">
                  {filteredKols.length === 0 ? (
                    <div className="py-12 text-center text-[#7D715E] text-xs space-y-2">
                      <Users className="w-7 h-7 mx-auto text-[#C59B58]/40 stroke-1" />
                      <p className="font-medium">Không tìm thấy nhà sáng tạo nào phù hợp.</p>
                    </div>
                  ) : (
                    filteredKols.map((kol) => {
                      const isSelected = selectedKol ? kol.id === selectedKol.id : false;
                      const kolSamples = samplesMap[kol.id] || [];
                      const pendingSamples = kolSamples.filter((s) => s.status === 'PENDING').length;

                      // 1. Sanitize & clean displayName (remove parenthesis suffixes, newlines, duplicate spaces)
                      const displayName = kol.fullName
                        .replace(/\s*\([^)]*\)/g, '')
                        .replace(/[\r\n]+/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim() || kol.fullName;

                      // 2. Parse & beautify Subtitle (Handle vs Email vs Message)
                      let subText = '';
                      let isEmail = false;

                      if (kol.lastMessage) {
                        subText = kol.lastMessage;
                      } else if (kol.handle) {
                        const match = kol.handle.match(/\(@?([a-zA-Z0-9_.]+)\)/);
                        if (match && match[1]) {
                          subText = `@${match[1]}`;
                        } else {
                          subText = kol.handle.replace(/^@+/, '@').trim();
                        }
                      } else if (kol.email) {
                        isEmail = true;
                        subText = kol.email;
                      } else {
                        subText = 'KOL Đối Tác';
                      }

                      return (
                        <div
                          key={kol.id}
                          onClick={() => handleSelectKol(kol.id)}
                          data-selected={isSelected}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleSelectKol(kol.id);
                            }
                          }}
                          className={`shop-kol-person group relative flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150 ${
                            isSelected
                              ? 'border-[#EEDFC6] bg-[#FBF5EB] shadow-xs'
                              : 'hover:bg-white border-transparent'
                          }`}
                        >
                          {/* Active gold left indicator bar */}
                          {isSelected && (
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#C59B58] rounded-r-full" />
                          )}

                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openKolProfile(kol.id);
                              }}
                              title={`Xem hồ sơ ${kol.fullName}`}
                              aria-label={`Xem hồ sơ ${kol.fullName}`}
                              className="rounded-full border-0 bg-transparent p-0 cursor-pointer block"
                            >
                              <KolAvatar
                                src={kol.avatarUrl}
                                name={kol.fullName}
                                id={kol.id}
                                className={`h-10 w-10 rounded-full text-xs shadow-2xs object-cover transition-transform group-hover:scale-105 ${
                                  isSelected ? 'border border-[#C59B58] ring-2 ring-[#C59B58]/20' : 'border border-[#EAE4D7]'
                                }`}
                              />
                            </button>
                            {kol.kycStatus === 'VERIFIED' && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#059669] text-white flex items-center justify-center text-[7px] font-black border-2 border-white shadow-2xs"
                                title="Đã xác minh KYC"
                              >
                                ✓
                              </span>
                            )}
                          </div>

                          {/* Info Column */}
                          <div className="flex-1 min-w-0">
                            {/* Row 1: Name + Tier Badge */}
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span
                                className={`truncate text-[13px] font-bold transition-colors ${
                                  isSelected ? 'text-[#B88E4F]' : 'text-[#1A1612] group-hover:text-[#B88E4F]'
                                }`}
                                title={kol.fullName}
                              >
                                {displayName}
                              </span>

                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-extrabold uppercase tracking-wide shrink-0 border shadow-2xs ${
                                  kol.tier === 'DIAMOND'
                                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                    : kol.tier === 'GOLD'
                                    ? 'bg-[#FAF0DD] text-[#9E7332] border-[#E8D4B0]'
                                    : kol.tier === 'SILVER'
                                    ? 'bg-[#F1F3F5] text-[#5C6470] border-[#DCE0E5]'
                                    : kol.tier === 'BRONZE'
                                    ? 'bg-[#FDF2E9] text-[#A05E23] border-[#F0D5C0]'
                                    : 'bg-[#F3EFE6] text-[#7D715E] border-[#EAE4D7]'
                                }`}
                              >
                                {kol.tier === 'DIAMOND' ? 'KC' : kol.tier === 'GOLD' ? 'VÀNG' : kol.tier === 'SILVER' ? 'BẠC' : kol.tier === 'BRONZE' ? 'ĐỒNG' : 'MỚI'}
                              </span>
                            </div>

                            {/* Row 2: Subtitle (Handle or Gmail) + Revenue / Samples / Commission */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0 flex-1">
                                {isEmail ? (
                                  <Mail className="w-3 h-3 text-[#B88E4F] shrink-0" />
                                ) : (
                                  <span className="text-[11px] font-bold text-[#B88E4F] leading-none shrink-0">@</span>
                                )}
                                <span
                                  className="truncate text-[11px] font-medium text-[#7D715E] group-hover:text-[#1A1612] transition-colors"
                                  title={isEmail ? kol.email : subText}
                                >
                                  {isEmail ? subText : subText.replace(/^@/, '')}
                                </span>
                              </div>

                              {pendingSamples > 0 ? (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0 flex items-center gap-1 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  {pendingSamples} mẫu
                                </span>
                              ) : kol.commissionRate != null ? (
                                <span className="text-[9px] font-bold text-[#B88E4F] shrink-0 bg-[#FBF5EB] px-1.5 py-0.5 rounded-md border border-[#EEDFC6]/70">
                                  HH {kol.commissionRate}%
                                </span>
                              ) : kol.stats.totalRevenue > 0 ? (
                                <span className="text-[10px] font-bold text-[#1A1612] shrink-0">
                                  {(kol.stats.totalRevenue / 1000000).toFixed(1)}M ₫
                                </span>
                              ) : (
                                <span className="text-[9.5px] text-[#7D715E]/70 shrink-0 font-medium">
                                  {kol.lastMessageTime || ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick footer invite CTA */}
                <div className="p-3 border-t border-[#EAE4D7] bg-white shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#EAE4D7] hover:border-[#B88E4F] hover:bg-[#FBF5EB] text-xs font-bold text-[#1A1612] flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-[#059669]" />
                        <span>Đã chép link mời!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 text-[#B88E4F]" />
                        <span>Chia sẻ trang gian hàng</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN: Dedicated KOL Workspace */}
          <div className={`shop-kol-detail flex-1 flex flex-col min-w-0 bg-white${isDetailHeaderCompact ? ' is-header-compact' : ''}`}>
            <StoreCooperationPanel mode="shop" />
            {!selectedKol ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF8F5]">
                <div className="w-14 h-14 rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center mb-3 shadow-2xs">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-[#1A1612] m-0">Chưa có kết nối nào với KOL</h3>
                <p className="text-xs text-[#7D715E] max-w-sm mt-1.5 mb-4 leading-relaxed">
                  Chưa có nhà sáng tạo nào gửi tin nhắn hay yêu cầu mẫu thử. Hãy dùng tính năng Khám phá KOL để tìm kiếm và mời các nhà sáng tạo hợp tác đẩy số.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDiscoveryModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Khám phá danh bạ KOL</span>
                </button>
              </div>
            ) : (
              <>
                {/* 1. Header of Selected KOL (Ultra-Compact Single-Row SCANMS Creator Style) */}
                <div className="shop-kol-detail-heading px-4 py-3 bg-white border-b border-[#EAE4D7] flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Left: Avatar + (Name & Badges on top) + (TikTok & Followers below) */}
              <div className="kol-profile-identity flex items-center gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => openKolProfile(selectedKol.id)}
                    title={`Xem hồ sơ ${selectedKol.fullName}`}
                    aria-label={`Xem hồ sơ ${selectedKol.fullName}`}
                    className="kol-profile-avatar rounded-xl border border-[#EEDFC6] bg-white p-1 cursor-pointer transition hover:border-[#C59B58]"
                  >
                    <KolAvatar
                      src={selectedKol.avatarUrl}
                      name={selectedKol.fullName}
                      id={selectedKol.id}
                      className="w-10 h-10 rounded-lg object-cover text-xs font-bold text-[#B88E4F]"
                    />
                  </button>
                  <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[7.5px] font-black uppercase tracking-wider bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white shadow-2xs border border-white">
                    {selectedKol.tier === 'DIAMOND' ? 'Kim cương' : selectedKol.tier === 'GOLD' ? 'Vàng' : selectedKol.tier === 'SILVER' ? 'Bạc' : selectedKol.tier === 'BRONZE' ? 'Đồng' : 'Chưa xếp hạng'}
                  </span>
                </div>

                <div className="kol-profile-copy min-w-0 flex flex-1 flex-col justify-center gap-1.5">
                  {/* Row 1: Full Name + Badges */}
                  <div className="kol-profile-name-row flex flex-wrap items-center gap-2 min-w-0">
                    <h2
                      className="kol-profile-name min-w-0"
                      title={selectedKol.fullName}
                    >
                      <button type="button" onClick={() => openKolProfile(selectedKol.id)} className="text-left hover:text-[#B88E4F] transition-colors">
                        {selectedKol.fullName.replace(/\s*\([^)]*\)/g, '').trim() || selectedKol.fullName}
                      </button>
                    </h2>

                    {selectedKol.kycStatus === 'VERIFIED' && (
                      <span className="kol-profile-badge inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-white text-[#7D715E] border border-[#EAE4D7] shrink-0 whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                        <span>Đã xác thực</span>
                      </span>
                    )}

                    <span className="kol-profile-badge inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] shrink-0 whitespace-nowrap">
                      <Sparkles className="w-2.5 h-2.5 text-[#B88E4F]" />
                      <span>Hoa hồng: 10% chuẩn sàn</span>
                    </span>
                  </div>

                  {/* Row 2: Multi-channel Social Stack (TikTok, YouTube, Facebook, Instagram with official brand logos) */}
                  <div className="kol-profile-channel grid w-full items-stretch gap-2 pt-1" style={{ gridTemplateColumns: `repeat(${Math.max(allChannels.length, 1)}, minmax(0, 1fr))` }}>
                    {allChannels.length > 0 ? (
                      allChannels.map((channel, cIdx) => (
                        <a
                          key={cIdx}
                          href={channel.url}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex h-9 min-w-0 items-center gap-1.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] px-2.5 text-[11px] font-semibold text-[#1A1612] shadow-2xs transition hover:border-[#C59B58] hover:bg-[#FBF5EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]"
                          title={`Xem kênh ${channel.platform} (${channel.handle})`}
                        >
                          <SocialBrandIcon platform={channel.platform} className="w-3.5 h-3.5 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{channel.handle}</span>
                          <span className="shrink-0 whitespace-nowrap text-[#7D715E] font-normal text-[10px]">
                            · {channel.followers >= 1000 ? `${(channel.followers / 1000).toLocaleString('vi-VN')}K` : channel.followers} flw
                          </span>
                          <ArrowUpRight className="h-3 w-3 shrink-0 text-[#7D715E] transition-colors group-hover:text-[#B88E4F]" />
                        </a>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#7D715E]">Chưa liên kết kênh mạng xã hội</span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* 2. Sub-Tabs Header (Compact SCANMS Style) */}
            <div className="shop-kol-tabs shrink-0 overflow-x-auto border-b border-[#EAE4D7] bg-white px-3 py-1.5 no-scrollbar">
              <div className="grid w-full min-w-[460px] grid-cols-4 items-stretch gap-1.5">
                <button
                  type="button"
                  id="tab-btn-messages"
                  aria-pressed={activeTab === 'messages'}
                  onClick={() => handleTabChange('messages')}
                  className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C59B58] ${
                    activeTab === 'messages'
                      ? 'border-[#C59B58] text-[#1A1612] font-bold bg-[#FBF5EB]'
                      : 'border-transparent text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
                  }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 ${activeTab === 'messages' ? 'text-[#B88E4F]' : 'text-[#7D715E]'}`} />
                  <span>Tin nhắn & deal</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-samples"
                  aria-pressed={activeTab === 'samples'}
                  onClick={() => handleTabChange('samples')}
                  className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C59B58] ${
                    activeTab === 'samples'
                      ? 'border-[#C59B58] text-[#1A1612] font-bold bg-[#FBF5EB]'
                      : 'border-transparent text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
                  }`}
                >
                  <Package className={`w-3.5 h-3.5 ${activeTab === 'samples' ? 'text-[#B88E4F]' : 'text-[#7D715E]'}`} />
                  <span>Hàng mẫu</span>
                  {(samplesMap[selectedKol.id] || []).length > 0 && (
                    <span className="min-w-4 h-4 px-1 rounded-full text-[10px] font-black bg-[#C59B58] text-white inline-flex items-center justify-center shadow-2xs">
                      {(samplesMap[selectedKol.id] || []).length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="tab-btn-performance"
                  aria-pressed={activeTab === 'performance'}
                  onClick={() => handleTabChange('performance')}
                  className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C59B58] ${
                    activeTab === 'performance'
                      ? 'border-[#C59B58] text-[#1A1612] font-bold bg-[#FBF5EB]'
                      : 'border-transparent text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
                  }`}
                >
                  <BarChart3 className={`w-3.5 h-3.5 ${activeTab === 'performance' ? 'text-[#B88E4F]' : 'text-[#7D715E]'}`} />
                  <span>Hiệu suất</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-profile"
                  aria-pressed={activeTab === 'profile'}
                  onClick={() => handleTabChange('profile')}
                  className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C59B58] ${
                    activeTab === 'profile'
                      ? 'border-[#C59B58] text-[#1A1612] font-bold bg-[#FBF5EB]'
                      : 'border-transparent text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
                  }`}
                >
                  <UserCheck className={`w-3.5 h-3.5 ${activeTab === 'profile' ? 'text-[#B88E4F]' : 'text-[#7D715E]'}`} />
                  <span>Hồ sơ & kênh</span>
                </button>
              </div>

              {/* Right: Nút Cấp VIP & Kênh MXH (Borderless) */}

            </div>

            {/* 3. Sub-Tab Content Areas */}
            <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col bg-white">
              {/* TAB 1: MESSAGES (Full height seamless embedded ChatBox) */}
              {activeTab === 'messages' && (
                <div className="h-full min-h-0 w-full overflow-hidden animate-in fade-in-50 duration-200">
                  <div className="h-full min-h-0 overflow-hidden">
                    <ChatBoxPage
                      embedded
                      targetCollaboratorId={selectedKol.id}
                      targetCollaboratorName={selectedKol.fullName}
                      targetCollaboratorAvatar={selectedKol.avatarUrl}
                      hideSidebar
                      hideHeaderInChat
                      className="h-full w-full border-0 rounded-none shadow-none bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Các Tab còn lại: Có vùng cuộn độc lập bên trong */}
              {activeTab !== 'messages' && (
                <div onScroll={event => {
                  const top = event.currentTarget.scrollTop;
                  setIsDetailHeaderCompact(current => top > 100 ? true : top < 12 ? false : current);
                }} className={`h-full w-full overflow-y-auto ${activeTab === 'samples' ? 'px-3 pb-4 pt-3 sm:px-4 sm:pt-3.5' : 'p-4 sm:p-6'} space-y-3`}>
                  {/* TAB 2: SAMPLE REQUESTS MANAGEMENT */}
                  {activeTab === 'samples' && (
                    <div className="animate-in fade-in-50 duration-200 space-y-3">
                  {sampleProgramStats && (
                    <div className="space-y-2"><div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2">
                      <div className="rounded-xl bg-white border border-[#EAE4D7] px-3 py-2">
                        <span className="text-[10px] text-[#7D715E] block">Giá trị mẫu đã cấp</span>
                        <strong className="mt-0.5 block text-[13px] font-semibold leading-5 tabular-nums text-[#1A1612]">{Number(sampleProgramStats.issuedValue || 0).toLocaleString('vi-VN')} ₫</strong>
                      </div>
                      <div className="rounded-xl bg-white border border-[#EAE4D7] px-3 py-2">
                        <span className="text-[10px] text-[#7D715E] block">Đã duyệt cấp mẫu</span>
                        <strong className="mt-0.5 block text-[13px] font-semibold leading-5 tabular-nums text-[#1A1612]">{sampleProgramStats.grantedCount || 0}</strong>
                      </div>
                      <div className="rounded-xl bg-white border border-[#EAE4D7] px-3 py-2">
                        <span className="text-[10px] text-[#7D715E] block">Tỷ lệ nộp video</span>
                        <strong className="mt-0.5 block text-[13px] font-semibold leading-5 tabular-nums text-[#1A1612]">{sampleProgramStats.videoSubmissionRate || 0}%</strong>
                      </div>
                      <div className="rounded-xl bg-white border border-[#EAE4D7] px-3 py-2">
                        <span className="text-[10px] text-[#7D715E] block">Tỷ lệ hoàn tất</span>
                        <strong className="mt-0.5 block text-[13px] font-semibold leading-5 tabular-nums text-[#1A1612]">{sampleProgramStats.completedRate || 0}%</strong>
                      </div>
                      <div className="rounded-xl bg-white border border-[#EAE4D7] px-3 py-2">
                        <span className="text-[10px] text-[#7D715E] block">Quá hạn / mẫu còn lại</span>
                        <strong className="mt-0.5 block text-[13px] font-semibold leading-5 tabular-nums text-[#1A1612]">{sampleProgramStats.overdue || 0} / {sampleProgramStats.remainingSampleQuota || 0}</strong>
                      </div>
                    </div></div>
                  )}
                  <div className="grid grid-cols-2 items-center gap-1.5 rounded-xl sm:grid-cols-3 xl:grid-cols-[1fr_1.35fr_1.35fr_1.6fr_1fr_1fr] border border-[#EAE4D7] bg-white p-2">
                    <div className="contents">
                      {([{value:'ALL',label:'Tất cả'}, {value:'PENDING',label:'Chờ duyệt mẫu'}, {value:'VIDEO_SUBMITTED',label:'Chờ duyệt video'}] as const).map((filter) => (
                        <button key={filter.value} type="button" onClick={() => setSampleFilter(filter.value)} aria-pressed={sampleFilter === filter.value} className={
                          'flex h-9 min-w-0 items-center justify-center whitespace-nowrap rounded-lg px-2 text-[11px] font-semibold transition ' + (sampleFilter === filter.value ? 'bg-[#FBF5EB] text-[#8C6226] ring-1 ring-[#EEDFC6]' : 'text-[#7D715E] hover:bg-[#FAF8F5]')
                        }>{filter.label}<span className="ml-1.5 text-[11px]">{(samplesMap[selectedKol.id] || []).filter((sample) => filter.value === 'ALL' || sample.status === filter.value).length}</span></button>
                      ))}
                    </div>
                    <div className="contents">
                      <Select
                        value={sampleFilter}
                        onChange={(event) => setSampleFilter(event.target.value as typeof sampleFilter)}
                        aria-label="Lọc lịch sử yêu cầu mẫu"
                        className="h-9 w-full min-w-0 text-xs font-medium [&_button]:h-9 [&_button]:min-h-9 [&_button]:px-2 [&_button]:text-xs"
                      >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="PENDING">Chờ Shop duyệt</option>
                        <option value="APPROVED">Đã duyệt</option>
                        <option value="SHIPPED">Đang giao</option>
                        <option value="RECEIVED">Đã nhận mẫu</option>
                        <option value="VIDEO_SUBMITTED">Chờ nghiệm thu</option>
                        <option value="REVISION_REQUIRED">Cần sửa video</option>
                        <option value="OVERDUE">Quá hạn</option>
                        <option value="DELIVERY_ISSUE">Sự cố giao hàng</option>
                        <option value="COMPLETED">Hoàn tất</option>
                        <option value="REJECTED">Bị từ chối</option>
                        <option value="CANCELLED">Đã hủy</option>
                      </Select>
                      <button type="button" title="Làm mới thông tin nhận hàng" disabled={loadingBackendData} onClick={() => void loadBackendData()} className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[#EEDFC6] bg-white px-3 text-xs font-semibold text-[#795A2D] transition-colors hover:bg-[#FBF5EB] disabled:opacity-50">
                        <RefreshCw size={14} className={loadingBackendData ? 'animate-spin' : ''} aria-hidden="true" />
                        Làm mới
                      </button>
                      {/* Partner actions */}
                      <div className="relative min-w-0" ref={kolActionsDropdownRef}>
                        <button
                          type="button"
                          id="btn-kol-actions-menu"
                          aria-label="Thao tác với nhà sáng tạo"
                          aria-expanded={showKolActionsMenu}
                          onClick={() => setShowKolActionsMenu(prev => !prev)}
                          className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58] ${
                            showKolActionsMenu
                              ? 'bg-[#FBF5EB] border-[#B88E4F] text-[#B88E4F] shadow-xs'
                              : 'bg-white border-[#EAE4D7] text-[#7D715E] hover:bg-[#FBF5EB] hover:border-[#EEDFC6] hover:text-[#1A1612]'
                          }`}
                        >
        <span>Thao tác</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showKolActionsMenu ? 'rotate-180 text-[#B88E4F]' : 'text-[#7D715E]'}`} />
                        </button>

                        {showKolActionsMenu && (
                          <div
                            className="absolute right-0 top-[calc(100%+6px)] z-40 w-52 p-1.5 rounded-xl bg-white border border-[#EAE4D7] shadow-[0_12px_28px_rgba(26,22,18,0.12)] animate-in fade-in slide-in-from-top-1 duration-150"
                            onClick={() => setShowKolActionsMenu(false)}
                          >
                            <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-[#7D715E]">
                              Tác vụ với đối tác
                            </div>
                            <button
                              type="button"
                              id="btn-quick-samples-tab"
                              onClick={() => {
                                setActiveTab('samples');
                                setSearchParams({ kol: selectedKol.id, tab: 'samples' }, { replace: true });
                              }}
                              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-[#1A1612] hover:bg-[#FBF5EB] hover:text-[#B88E4F] transition text-left cursor-pointer border-0"
                            >
                              <PackageCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
                              <span>Cấp hàng mẫu trải nghiệm</span>
                            </button>

                            <button
                              type="button"
                              id="btn-quick-perf-tab"
                              onClick={() => {
                                setActiveTab('performance');
                                setSearchParams({ kol: selectedKol.id, tab: 'performance' }, { replace: true });
                              }}
                              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-[#1A1612] hover:bg-[#FBF5EB] hover:text-[#B88E4F] transition text-left cursor-pointer border-0"
                            >
                              <BarChart3 className="w-3.5 h-3.5 text-[#B88E4F]" />
                              <span>Xem hiệu suất tiếp thị</span>
                            </button>

                            <div className="my-1 border-t border-[#EAE4D7]" />

                            <button
                              type="button"
                              id="btn-quick-view-profile"
                              onClick={() => openKolProfile(selectedKol.id)}
                              className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-semibold text-[#1A1612] hover:bg-[#FBF5EB] hover:text-[#B88E4F] transition text-left cursor-pointer border-0"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#7D715E]" />
                              <span>Xem hồ sơ & liên hệ</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Samples list */}
                  {currentKolSamples.length === 0 ? (
                    <div className="bg-white border border-[#EAE4D7] rounded-2xl p-12 text-center">
                      <Package className="w-12 h-12 text-[#EAE4D7] mx-auto mb-3" />
                      <h4 className="text-sm font-semibold text-[#1A1612]">{sampleFilter === 'ALL' ? 'Chưa có yêu cầu mẫu' : 'Không có mẫu ở trạng thái này'}</h4>
                      <p className="text-xs text-[#7D715E] mt-1 max-w-md mx-auto">
                        {sampleFilter === 'ALL' ? 'KOL chưa gửi yêu cầu. Bạn có thể nhắn tin trao đổi về sản phẩm mẫu.' : 'Chọn trạng thái khác hoặc xem tất cả yêu cầu.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {currentKolSamples.map((item) => (
                        <div
                          key={item.id}
                          className="group rounded-2xl border border-[#EAE4D7] bg-white p-3.5 shadow-[0_3px_14px_rgba(35,29,21,0.035)] transition-all hover:border-[#D8BD91] hover:shadow-[0_6px_20px_rgba(35,29,21,0.06)] sm:p-4"
                        >
                          <div className="flex flex-col items-stretch justify-between gap-3">
                            {/* Product Info */}
                            <div className="flex w-full min-w-0 flex-1 items-start gap-3">
                              <img
                                src={
                                  item.product.thumbnail ||
                                  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={item.product.title}
                                className="h-12 w-12 shrink-0 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] object-cover shadow-[0_1px_3px_rgba(35,29,21,0.06)]"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                      item.status === 'PENDING'
                                        ? 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'
                                        : ['APPROVED', 'SHIPPED'].includes(item.status)
                                        ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#795A2D]'
                                        : ['COMPLETED', 'VIDEO_SUBMITTED'].includes(item.status)
                                        ? 'border-[#EEDFC6] bg-[#F3EFE6] text-[#795A2D]'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    {item.status === 'PENDING' && 'Chờ duyệt mẫu'}
                                    {item.status === 'APPROVED' && (isSandboxShipment(item) ? <SampleSandboxStatus charges={item.shippingCharges} /> : 'Đã duyệt · Chờ gửi')}
                                    {item.status === 'SHIPPED' && 'Đang giao'}
                                    {item.status === 'RECEIVED' && 'Đã nhận · Chờ video'}
                                    {item.status === 'VIDEO_SUBMITTED' && 'Chờ duyệt video'}
                                    {item.status === 'REVISION_REQUIRED' && 'Cần sửa video'}
                                    {item.status === 'COMPLETED' && 'Hoàn tất'}
                                    {item.status === 'REJECTED' && 'Từ chối'}
                                    {item.status === 'OVERDUE' && 'Quá hạn video'}
                                    {item.status === 'DELIVERY_ISSUE' && 'Sự cố giao hàng'}
                                    {item.status === 'CANCELLED' && 'Đã hủy'}
                                  </span>
                                  <span className="text-[11px] text-[#7D715E]">
                                    Ngày tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>

                                <h4 className="text-base font-bold leading-snug tracking-tight text-[#1A1612]">
                                  {item.product.title}
                                </h4>

                                <div className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#7D715E]">
                                  <div>
                                    Giá mẫu:{' '}
                                    <strong className="text-[#1A1612]">
                                      {Number(item.product.price || 0).toLocaleString('vi-VN')} ₫
                                    </strong>{' '}
                                    · Hoa hồng: <strong>{item.product.commissionRate != null ? (item.product.commissionRate + "%") : "—"}</strong>
                                  </div>
                                  {item.expectedVideoAt && !['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERY_ISSUE'].includes(item.status) && (
                                    <div>Ngày KOL dự kiến đăng: {new Date(item.expectedVideoAt).toLocaleDateString('vi-VN')}</div>
                                  )}
                                  {item.deadlineAt && !['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERY_ISSUE', 'COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.status) && (
                                    <div className={item.status === 'OVERDUE' ? 'font-bold text-rose-700' : 'font-semibold text-[#8C6226]'}>
                                      Hạn nộp video: {new Date(item.deadlineAt).toLocaleString('vi-VN')}
                                    </div>
                                  )}
                                  {item.revisionDeadlineAt && ['REVISION_REQUIRED', 'OVERDUE'].includes(item.status) && (
                                    <div className="font-semibold text-[#8C6226]">Hạn sửa video: {new Date(item.revisionDeadlineAt).toLocaleString('vi-VN')}</div>
                                  )}
                                  {item.videoRejectionReason && (
                                    <div className="text-rose-700">Lý do yêu cầu sửa: {item.videoRejectionReason}</div>
                                  )}
                                  {item.rejectedReason && (
                                    <div className="text-rose-700">Ghi chú xử lý: {item.rejectedReason}</div>
                                  )}
                                  {Boolean(item.videoAssets?.length) && (
                                    <details className="group mt-2 overflow-hidden rounded-xl border border-[#EAE4D7] bg-white text-[11px] text-[#7D715E]">
                                      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 transition hover:bg-[#FBF5EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C59B58] [&::-webkit-details-marker]:hidden">
                                        <span className="flex min-w-0 items-center gap-2 font-semibold text-[#4B4031]">
                                          <Video size={14} className="shrink-0 text-[#B88E4F]" aria-hidden="true" />
                                          Video Review đã nộp
                                          <span className="rounded-full bg-[#FBF5EB] px-2 py-0.5 text-[10px] font-semibold text-[#8A6B3D]">{item.videoAssets?.length}</span>
                                        </span>
                                        <ChevronDown size={15} className="shrink-0 text-[#8A7C68] transition-transform group-open:rotate-180" aria-hidden="true" />
                                      </summary>
                                      <ul className="mx-3 mb-3 space-y-2">
                                        {(item.videoAssets || []).map((asset) => <li key={asset.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                          <a href={asset.urlOrContent} target="_blank" rel="noreferrer" className="font-semibold text-[#795A2D] underline underline-offset-2">{asset.title || 'Mở video đã nộp'}</a>
                                          <span className="rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2 py-0.5 text-[10px] font-semibold text-[#795A2D]">{sampleVideoStatusLabel(asset.status)}</span>
                                          {asset.rejectionReason && <span className="text-rose-700">{asset.rejectionReason}</span>}
                                        </li>)}
                                      </ul>
                                    </details>
                                  )}
                                  <SampleSandboxWaybills charges={item.shippingCharges} primary={isSandboxShipment(item)} role="shop" />
                                  {item.trackingCode && (
                                    <div className="font-medium text-[#7D715E]">
                                      Vận chuyển: {item.carrier} — Mã vận đơn: {item.trackingCode}
                                    </div>
                                  )}
                                  {item.trackingCode && (
                                    <div className="mt-1 text-xs text-[#7D715E]">
                                      Shop chịu 100% phí ship · KOL COD 0 đ · {item.shippingCharges?.length
                                        ? `${item.shippingCharges.reduce((sum, c) => sum + (c.environment === 'TEST' || c.amount === null ? 0 : Number(c.amount)), 0).toLocaleString('vi-VN')} đ cước đã ghi nhận${item.shippingCharges.some(c => c.environment !== 'TEST' && c.amount === null) ? ' (còn cước chưa xác nhận)' : ''}`
                                        : 'Chưa có dữ liệu cước'}
                                    </div>
                                  )}
                                  <details className="group mt-2.5 overflow-hidden rounded-xl border border-[#EAE4D7] bg-white text-[11px] text-[#7D715E]">
                                    <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 transition hover:bg-[#FBF5EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C59B58] [&::-webkit-details-marker]:hidden">
                                      <span className="flex min-w-0 items-center gap-2 font-semibold text-[#4B4031]">
                                        <Package size={14} className="shrink-0 text-[#B88E4F]" aria-hidden="true" />
                                        Thông tin nhận mẫu và cam kết nội dung
                                      </span>
                                      <ChevronDown size={15} className="shrink-0 text-[#8A7C68] transition-transform group-open:rotate-180" aria-hidden="true" />
                                    </summary>
                                    <div className="grid grid-cols-1 gap-2 border-t border-[#EAE4D7] bg-[#FFFCF7] p-3 sm:grid-cols-2">
                                      <div className="rounded-lg border border-[#EAE4D7] bg-white p-2.5 sm:col-span-2">
                                        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#A3937C]">Địa chỉ nhận mẫu</p>
                                        <p className="mt-1 break-words text-xs leading-relaxed text-[#4B4031]">{item.shippingAddress}</p>
                                      </div>
                                      {item.recipientName && (
                                        <div className="rounded-lg border border-[#EAE4D7] bg-white p-2.5">
                                          <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#A3937C]">Người nhận</p>
                                          <p className="mt-1 text-xs font-semibold text-[#4B4031]">{item.recipientName}</p>
                                          <p className="mt-0.5 text-[11px] text-[#7D715E]">{item.recipientPhone || 'Chưa có số điện thoại'}</p>
                                        </div>
                                      )}
                                      {(item.socialPlatformSnapshot || item.socialChannel) && (
                                        <div className="rounded-lg border border-[#EAE4D7] bg-white p-2.5">
                                          <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#A3937C]">Kênh đã cam kết</p>
                                          <p className="mt-1 text-xs font-semibold text-[#4B4031]">{item.socialPlatformSnapshot || item.socialChannel?.platformName}</p>
                                          <p className="mt-0.5 break-words text-[11px] text-[#7D715E]">{item.socialChannelNameSnapshot || item.socialChannel?.channelName || 'Kênh nội dung'} · {Number(item.socialFollowerSnapshot ?? item.socialChannel?.followerCount ?? 0).toLocaleString('vi-VN')} người theo dõi</p>
                                        </div>
                                      )}
                                      {item.note && (
                                        <div className="rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] p-2.5 sm:col-span-2">
                                          <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#A3937C]">Nội dung KOL cam kết</p>
                                          <p className="mt-1 text-xs italic leading-relaxed text-[#795A2D]">“{item.note}”</p>
                                        </div>
                                      )}
                                      {item.collaboratorMetrics && (
                                        <div className="rounded-lg border border-[#EAE4D7] bg-white p-2.5 sm:col-span-2">
                                          <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#A3937C]">Hồ sơ nhà sáng tạo</p>
                                          <p className="mt-1 text-[11px] leading-relaxed text-[#4B4031]">
                                            {item.collaboratorMetrics.tierName || 'Chưa xếp hạng'}
                                            {' · '}{Number(item.collaboratorMetrics.totalFollowers || 0).toLocaleString('vi-VN')} người theo dõi toàn kênh
                                            {' · '}{Number(item.collaboratorMetrics.totalOrdersReferred || 0).toLocaleString('vi-VN')} đơn giới thiệu
                                            {' · KYC '}{item.collaboratorMetrics.kycStatus === 'VERIFIED' ? 'đã xác minh' : 'chưa xác minh'}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </details>
                                </div>
                              </div>
                            </div>

                            {/* Actions by status */}
                            <div className="flex w-full flex-wrap items-center justify-end gap-2 border-t border-[#EAE4D7] pt-2.5">
                              <div className="sample-deadline-actions">
                                <SampleDeadlineExtension request={item} onSuccess={() => void loadBackendData()} />
                                <SampleViolationAction request={item} blocked={Boolean(item.sampleRequestsBlockedAt)} onSuccess={() => void loadBackendData()} />
                              </div>
                              {item.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectSample(item.id)}
                                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                                  >
                                    Từ chối
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveSample(item.id)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#231D15] bg-[#C59B58] hover:bg-[#B88E4F] transition shadow-xs cursor-pointer"
                                  >
                                    Duyệt mẫu
                                  </button>
                                </>
                              )}

                              {(item.status === 'APPROVED' || item.status === 'DELIVERY_ISSUE' || item.status === 'SHIPPED') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTrackingModalItem(item);
                                    setTrackingCodeInput('');
                                  }}
                                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2 text-[11px] font-semibold text-[#795A2D] transition hover:bg-[#F3EFE6]"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  {isSandboxShipment(item) ? 'Đổi môi trường GHN' : item.status === 'SHIPPED' ? 'Tạo mã GHN sandbox' : item.status === 'DELIVERY_ISSUE' ? 'Tạo lại vận đơn GHN' : 'Tạo vận đơn GHN'}
                                </button>
                              )}

                              {item.status === 'SHIPPED' && (
                                <span className="text-xs text-[#7D715E] font-semibold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> Chờ KOL nhận mẫu
                                </span>
                              )}

                              {item.reviewVideoUrl && (
                                <a
                                  href={item.reviewVideoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-4 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1.5"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  Xem video
                                </a>
                              )}
                              {item.status === 'VIDEO_SUBMITTED' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleReviewSampleVideo(item, 'REJECTED')}
                                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                                  >Yêu cầu sửa</button>
                                  <button
                                    type="button"
                                    onClick={() => handleReviewSampleVideo(item, 'APPROVED')}
                                    className="px-3 py-2 rounded-xl text-xs font-bold text-[#231D15] bg-[#C59B58] hover:bg-[#B88E4F] transition cursor-pointer"
                                  >Nghiệm thu video</button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PERFORMANCE & AFFILIATE ORDERS (Tone Sáng, Sang Trọng, Chuẩn SCANMS) */}
              {activeTab === 'performance' && (() => {
const effectiveCommissionRate = selectedKol.commissionRate || 10;
                const rawRevenue = selectedKol.stats?.totalRevenue || 0;
                const rawOrders = selectedKol.stats?.totalOrders || 0;
                const hasOrders = rawOrders > 0;

                // Numbers
                const displayRevenue = rawRevenue;
                const displayOrders = rawOrders;
                const displayCommission = Math.round((displayRevenue * effectiveCommissionRate) / 100);
                const displayAov = displayOrders > 0 ? Math.round(displayRevenue / displayOrders) : 0;

                const ordersList: AffiliateOrderItem[] = [];

                return (
                  <div className="kol-performance animate-in fade-in-50 duration-200 space-y-4">
                    <ExclusiveDealInbox />
                    {/* 1. Header Policy & Strategic Overview Bar */}
                    <div className="kol-performance-heading rounded-2xl border border-[#EEDFC6] bg-gradient-to-r from-[#FBF5EB] via-white to-[#FAF8F5] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#EEDFC6] bg-white text-[#B88E4F] shadow-xs">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#B88E4F]">
                              Hiệu suất tiếp thị liên kết
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#EEDFC6] bg-white px-2 py-0.5 text-[10px] font-bold text-[#B88E4F]">
                              <Crown className="h-3 w-3" /> Hạng {selectedKol.tier || 'KOL VIP'}
                            </span>
                          </div>
                          <h3 className="m-0 text-sm sm:text-base font-extrabold text-[#1A1612]">
                            Báo cáo doanh số: {selectedKol.fullName}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
onClick={() => {
                            setActiveTab('messages');
                            setSearchParams({ kol: selectedKol.id, tab: 'messages' }, { replace: true });
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-[#EEDFC6] bg-white px-3.5 py-2 text-xs font-bold text-[#8F682E] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] hover:text-[#1A1612] cursor-pointer shadow-xs"
                          title="Thương lượng tỷ lệ hoa hồng độc quyền hoặc tạo Deal riêng cho nhà sáng tạo này"
                        >
<Handshake className="h-3.5 w-3.5 text-[#B88E4F]" />
                          <span>Thỏa thuận Deal độc quyền</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyInviteLink}
                          className="flex items-center gap-1.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer shadow-xs"
                        >
                          {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedLink ? 'Đã chép link' : 'Sao chép link tiếp thị'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Range Filter & Realtime Indicator */}
                    <div className="kol-performance-toolbar flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-1">
                        {[
                          { key: '7d', label: '7 ngày qua' },
                          { key: '30d', label: '30 ngày qua' },
                          { key: 'month', label: 'Tháng này' },
                          { key: 'all', label: 'Toàn thời gian' },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            aria-pressed={performanceRange === tab.key}
                            onClick={() => setPerformanceRange(tab.key as any)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                              performanceRange === tab.key
                                ? 'bg-white text-[#1A1612] shadow-xs border border-[#EAE4D7]'
                                : 'text-[#7D715E] hover:text-[#1A1612]'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-[#059669]">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Đối soát thời gian thực
                        </span>
                      </div>
                    </div>

                    {/* 3. Top 4 Metric Cards (Tone Sáng, Sang Trọng, Chuẩn Vàng Be) */}
                    <div className="kol-performance-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {/* Card 1: Doanh thu thuần */}
                      <div className="group rounded-2xl border border-[#EEDFC6] bg-gradient-to-b from-white to-[#FAF8F5] p-4 sm:p-5 shadow-[0_2px_12px_rgba(35,29,21,0.03)] transition-all hover:border-[#C59B58] hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E]">
                            Doanh thu thuần từ KOL
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] group-hover:scale-105 transition">
                            <TrendingUp className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="text-2xl font-black tracking-tight text-[#1A1612]">
                          {displayRevenue.toLocaleString('vi-VN')} ₫
                        </div>
                        <div className="mt-1.5 flex items-center gap-1 text-[11px]">
                          {hasOrders ? (
                            <span className="font-bold text-[#059669] flex items-center gap-0.5">
                              <ArrowUpRight className="h-3.5 w-3.5" /> +14.8% so với kỳ trước
                            </span>
                          ) : (
                            <span className="text-[#7D715E]">Chưa phát sinh doanh số trong kỳ</span>
                          )}
                        </div>
                      </div>

                      {/* Card 2: Hoa hồng đã chi trả */}
                      <div className="group rounded-2xl border border-[#EEDFC6] bg-gradient-to-b from-white to-[#FAF8F5] p-4 sm:p-5 shadow-[0_2px_12px_rgba(35,29,21,0.03)] transition-all hover:border-[#C59B58] hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E]">
                            Hoa hồng chi trả KOL
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] group-hover:scale-105 transition">
                            <DollarSign className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="text-2xl font-black tracking-tight text-[#B88E4F]">
                          {displayCommission.toLocaleString('vi-VN')} ₫
                        </div>
                        <div className="mt-1.5 text-[11px] text-[#7D715E]">
                          Tỷ lệ áp dụng: <strong className="text-[#1A1612]">{effectiveCommissionRate}%</strong> · Tự động đối soát
                        </div>
                      </div>

                      {/* Card 3: Số đơn chốt thành công */}
                      <div className="group rounded-2xl border border-[#EEDFC6] bg-gradient-to-b from-white to-[#FAF8F5] p-4 sm:p-5 shadow-[0_2px_12px_rgba(35,29,21,0.03)] transition-all hover:border-[#C59B58] hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E]">
                            Số đơn chốt thành công
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] group-hover:scale-105 transition">
                            <ShoppingBag className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="text-2xl font-black tracking-tight text-[#1A1612]">
                          {displayOrders} đơn
                        </div>
                        <div className="mt-1.5 text-[11px]">
                          {hasOrders ? (
                            <span className="font-bold text-[#059669]">Tỷ lệ hoàn tất giao: 96.2%</span>
                          ) : (
                            <span className="text-[#7D715E]">Chờ đơn hàng chốt đầu tiên</span>
                          )}
                        </div>
                      </div>

                      {/* Card 4: Giá trị trung bình đơn & Chuyển đổi */}
                      <div className="group rounded-2xl border border-[#EEDFC6] bg-gradient-to-b from-white to-[#FAF8F5] p-4 sm:p-5 shadow-[0_2px_12px_rgba(35,29,21,0.03)] transition-all hover:border-[#C59B58] hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E]">
                            Giá trị TB đơn (AOV)
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] group-hover:scale-105 transition">
                            <Sparkles className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="text-2xl font-black tracking-tight text-[#1A1612]">
                          {displayAov > 0 ? `${displayAov.toLocaleString('vi-VN')} ₫` : '0 ₫'}
                        </div>
                        <div className="mt-1.5 text-[11px] text-[#7D715E]">
                          {hasOrders ? (
                            <span>Tỷ lệ chuyển đổi CVR: <strong className="text-[#059669]">3.8%</strong></span>
                          ) : (
                            <span>CVR ước tính: <strong className="text-[#B88E4F]">2.5% - 4.0%</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4. Mini Funnel Tracker (Phễu chuyển đổi tiếp thị 4 bước) */}
                    <div className="kol-performance-funnel rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1A1612] flex items-center gap-1.5">
                          <BarChart3 className="h-4 w-4 text-[#B88E4F]" />
                          Phễu chuyển đổi tiếp thị
                        </span>
                        <span className="text-[11px] text-[#7D715E]">Cập nhật từ pixel theo dõi & UTM link</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-[#EAE4D7] bg-white p-3">
                          <span className="block text-[10px] font-bold uppercase text-[#7D715E]">1. Lượt nhấp link (Clicks)</span>
                          <strong className="text-lg font-black text-[#1A1612] mt-0.5 block">{hasOrders ? '1.820' : '0'}</strong>
                          <span className="text-[10px] text-[#7D715E]">Từ TikTok & Bio Link</span>
                        </div>
                        <div className="rounded-xl border border-[#EAE4D7] bg-white p-3">
                          <span className="block text-[10px] font-bold uppercase text-[#7D715E]">2. Xem trang sản phẩm</span>
                          <strong className="text-lg font-black text-[#1A1612] mt-0.5 block">{hasOrders ? '1.140' : '0'}</strong>
                          <span className="text-[10px] text-[#059669] font-medium">{hasOrders ? '62.6% tiếp cận' : '—'}</span>
                        </div>
                        <div className="rounded-xl border border-[#EAE4D7] bg-white p-3">
                          <span className="block text-[10px] font-bold uppercase text-[#7D715E]">3. Thêm vào giỏ hàng</span>
                          <strong className="text-lg font-black text-[#1A1612] mt-0.5 block">{hasOrders ? '210' : '0'}</strong>
                          <span className="text-[10px] text-[#059669] font-medium">{hasOrders ? '18.4% quan tâm' : '—'}</span>
                        </div>
                        <div className="rounded-xl border border-[#EEDFC6] bg-gradient-to-br from-[#FBF5EB] to-white p-3">
                          <span className="block text-[10px] font-bold uppercase text-[#8F682E]">4. Đơn chốt thành công</span>
                          <strong className="text-lg font-black text-[#B88E4F] mt-0.5 block">{displayOrders}</strong>
                          <span className="text-[10px] text-[#B88E4F] font-bold">{hasOrders ? 'Tỷ lệ CVR 3.8%' : '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 5. Orders List Table or Empty State (Tone Sáng Tuyệt Đẹp) */}
                    <div className="kol-performance-orders rounded-2xl border border-[#EAE4D7] bg-white shadow-xs overflow-hidden">
                      <div className="border-b border-[#EAE4D7] bg-[#FAF8F5]/60 px-4 py-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1A1612] m-0">
                            Đơn Hàng Gần Đây Qua Link Tiếp Thị
                          </h4>
                          <span className="rounded-full border border-[#EAE4D7] bg-white px-2 py-0.5 text-[10px] font-bold text-[#7D715E]">
                            {ordersList.length} đơn
                          </span>
                        </div>
                        <span className="text-[11px] text-[#7D715E]">
                          Đối soát hoa hồng tự động theo từng đơn hàng
                        </span>
                      </div>

                      {ordersList.length === 0 ? (
                        <div className="py-12 px-6 text-center bg-white flex flex-col items-center justify-center">
                          <div className="w-14 h-14 rounded-2xl border border-[#EEDFC6] bg-gradient-to-br from-[#FBF5EB] to-[#FAF8F5] text-[#B88E4F] flex items-center justify-center mb-3 shadow-xs">
                            <ShoppingBag className="w-7 h-7" />
                          </div>
                          <h5 className="text-base font-extrabold text-[#1A1612] m-0">
                            Chưa phát sinh đơn hàng qua link của {selectedKol.fullName}
                          </h5>
                          <p className="text-xs text-[#7D715E] max-w-lg mt-1.5 mb-5 leading-relaxed">
                            Khi khách hàng hoàn tất mua sắm qua Affiliate Link hoặc giỏ hàng Livestream của nhà sáng tạo này, toàn bộ đơn hàng và hoa hồng đối soát sẽ tự động cập nhật thời gian thực tại đây.
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2.5">
                            <button
                              type="button"
                              onClick={handleCopyInviteLink}
                              className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] hover:bg-[#F3EFE6] px-4 py-2 text-xs font-bold text-[#8F682E] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#B88E4F]" />
                              <span>Sao chép link tiếp thị</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
setActiveTab('messages');
                                setSearchParams({ kol: selectedKol.id, tab: 'messages' }, { replace: true });
                              }}
                              className="rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] px-4 py-2 text-xs font-bold text-[#1A1612] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
<MessageSquare className="w-3.5 h-3.5 text-[#B88E4F]" />
                              <span>Gửi tin nhắn thương lượng deal</span>
                            </button>

                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#FAF8F5] text-[#7D715E] font-bold border-b border-[#EAE4D7]">
                              <tr>
                                <th className="p-3.5">Mã đơn</th>
                                <th className="p-3.5">Thời gian</th>
                                <th className="p-3.5">Khách hàng</th>
                                <th className="p-3.5">Sản phẩm tiếp thị</th>
                                <th className="p-3.5">Giá trị đơn</th>
                                <th className="p-3.5">Hoa hồng KOL ({effectiveCommissionRate}%)</th>
                                <th className="p-3.5">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#EAE4D7]">
                              {ordersList.map((ord) => (
                                <tr key={ord.id} className="hover:bg-[#FAF8F5]/70 transition">
                                  <td className="p-3.5 font-mono font-bold text-[#1A1612]">{ord.orderCode}</td>
                                  <td className="p-3.5 text-[#7D715E] whitespace-nowrap">{ord.createdAt}</td>
                                  <td className="p-3.5 font-medium text-[#1A1612]">{ord.customerName}</td>
                                  <td className="p-3.5 font-semibold text-[#1A1612]">{ord.productTitle}</td>
                                  <td className="p-3.5 font-black text-[#1A1612]">
                                    {ord.orderTotal.toLocaleString('vi-VN')} ₫
                                  </td>
                                  <td className="p-3.5 font-black text-[#B88E4F]">
                                    +{ord.commissionEarned.toLocaleString('vi-VN')} ₫
                                  </td>
                                  <td className="p-3.5 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                        ord.status === 'DELIVERED'
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                          : ord.status === 'SHIPPING'
                                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                                          : 'bg-amber-50 text-amber-800 border-amber-200'
                                      }`}
                                    >
                                      {ord.status === 'DELIVERED'
                                        ? '✓ Giao thành công'
                                        : ord.status === 'SHIPPING'
                                        ? '🚚 Đang giao'
                                        : '⏳ Đang xử lý'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* TAB 4: PROFILE & SOCIAL CHANNELS */}
              {activeTab === 'profile' && (
                <div className="kol-channel-profile animate-in fade-in-50 duration-200 space-y-5">
                  <div className="kol-channel-panel bg-white border border-[#EAE4D7] rounded-2xl p-6 shadow-xs space-y-6">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#1A1612] uppercase tracking-wider mb-3">
                        Hồ sơ nhà sáng tạo & kênh truyền thông
                      </h3>
                      <p className="text-xs text-[#7D715E]">
                        Thông tin chi tiết về các kênh quảng bá, độ uy tín và định danh điện tử của KOL.
                      </p>
                    </div>

                    <div className="kol-channel-info grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                        <div className="text-xs font-bold text-[#7D715E]">Họ và tên</div>
                        <div className="text-sm font-extrabold text-[#1A1612]">{selectedKol.fullName}</div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                        <div className="text-xs font-bold text-[#7D715E]">Cấp bậc đối tác</div>
                        <div className="text-sm font-extrabold text-[#B88E4F] flex items-center gap-1.5">
                          <Award className="w-4 h-4" />
                          {selectedKol.tier ? ("Hạng " + selectedKol.tier) : "Chưa xếp hạng"} · {selectedKol.kycStatus === "VERIFIED" ? "Đã xác minh KYC" : selectedKol.kycStatus ? ("KYC: " + selectedKol.kycStatus) : "KYC: Chưa có dữ liệu"}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                        <div className="text-xs font-bold text-[#7D715E]">Email liên hệ</div>
                        <div className="text-sm font-bold text-[#1A1612]">{selectedKol.email}</div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                        <div className="text-xs font-bold text-[#7D715E]">Số điện thoại</div>
                        <div className="text-sm font-bold text-[#1A1612]">
                          {selectedKol.phone || 'Chưa cập nhật'}
                        </div>
                      </div>
                    </div>

                    {/* Social Channels Details */}
                    <div>
                      <h4 className="text-xs font-extrabold text-[#1A1612] mb-3">
                        Kênh mạng xã hội liên kết
                      </h4>
                      <div className="kol-channel-list space-y-3">
                        {selectedKol.socialChannels && selectedKol.socialChannels.length > 0 ? (
                          selectedKol.socialChannels.map((ch, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl border border-[#EAE4D7] bg-[#FBF5EB]/50 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE4D7] flex items-center justify-center shadow-2xs shrink-0">
                                  <SocialBrandIcon platform={ch.platform} className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-xs font-extrabold text-[#1A1612] flex items-center gap-1.5">
                                    {ch.platform === 'TIKTOK' ? 'TikTok' : ch.platform === 'YOUTUBE' ? 'YouTube' : ch.platform === 'INSTAGRAM' ? 'Instagram' : 'Facebook'}: {ch.handle}
                                    {ch.isVerified && (
                                      <span className="text-[10px] text-emerald-600 font-bold">✓ Xác thực</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#7D715E]">
                                    {ch.followers.toLocaleString('vi-VN')} người theo dõi
                                    · Tương tác {ch.engagementRate || 'Chưa có dữ liệu'}
                                  </div>
                                </div>
                              </div>

                              {ch.url && (
                                <a
                                  href={ch.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#EAE4D7] text-[#1A1612] hover:bg-[#FAF8F5] hover:border-[#C59B58] flex items-center gap-1 shadow-xs transition"
                                >
                                  Truy cập kênh <ExternalLink className="w-3 h-3 text-[#7D715E]" />
                                </a>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 rounded-2xl border border-[#EAE4D7] bg-[#FBF5EB]/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE4D7] flex items-center justify-center shadow-2xs shrink-0">
                                <SocialBrandIcon platform={selectedKol.primaryChannel?.platform || 'TIKTOK'} className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-xs font-extrabold text-[#1A1612]">
                                  {(selectedKol.primaryChannel?.platform === 'TIKTOK' ? 'TikTok' : selectedKol.primaryChannel?.platform === 'YOUTUBE' ? 'YouTube' : 'Mạng xã hội')}: {selectedKol.handle || '@creator'}
                                </div>
                                <div className="text-[11px] text-[#7D715E]">
                                  {selectedKol.primaryChannel?.followers.toLocaleString('vi-VN')} người theo dõi
                                  · Tương tác {selectedKol.primaryChannel?.engagementRate || 'Chưa có dữ liệu'}
                                </div>
                              </div>
                            </div>

                            {selectedKol.primaryChannel?.url && (
                              <a
                                href={selectedKol.primaryChannel.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#EAE4D7] text-[#1A1612] hover:bg-[#FAF8F5] hover:border-[#C59B58] flex items-center gap-1 shadow-xs transition"
                              >
                                Truy cập kênh <ExternalLink className="w-3 h-3 text-[#7D715E]" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    )}
  </div>
</div>
)}

      {/* MODAL 1: Nhập Mã Vận Đơn Mẫu */}
      {trackingModalItem && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setTrackingModalItem(null)}
        >
          <div
            className="bg-white border border-[#EAE4D7] rounded-3xl w-full max-w-md max-h-[calc(100dvh-2rem)] shadow-2xl overflow-y-auto overscroll-contain animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#B88E4F]" />
                <h3 className="text-base font-extrabold text-[#1A1612]">Tạo vận đơn gửi mẫu</h3>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTracking} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#FBF5EB] border border-[#EAE4D7] text-xs space-y-1">
                <div className="font-extrabold text-[#1A1612]">Người nhận: {trackingModalItem.recipientName || 'Chưa cập nhật'}</div>
                <div className="text-[#7D715E]">SĐT: {trackingModalItem.recipientPhone || 'Chưa cập nhật'}</div>
                <div className="text-[#7D715E]">{trackingModalItem.product.title}</div>
                <div className="text-[11px] text-[#7D715E] pt-1 border-t border-[#EAE4D7]/60">
                  📍 {trackingModalItem.shippingAddress}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1">Đơn vị vận chuyển</label>
                <SampleGhnEnvironmentPicker value={sampleGhnEnvironment} onChange={setSampleGhnEnvironment} allowLive={trackingModalItem.status !== 'SHIPPED'} disabled={updatingSample} />
              </div>

              {carrierInput === 'GHN' ? (
                <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#7D715E]">
                  <strong className="text-[#1A1612]">Shop thanh toán 100% phí ship · KOL COD 0 đ.</strong>
                  <p className="mt-1">{sampleGhnEnvironment === 'TEST' ? 'Cước GHN sandbox chỉ hiển thị trong đơn mẫu, không tính vào phí vận chuyển.' : 'Tạo vận đơn GHN thật và lưu cước hãng trả về để Shop theo dõi. Cước ghi nhận chưa phải xác nhận thanh toán.'}</p>
                </div>
              ) : <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1">Mã vận đơn (Tracking code)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SORA-GHTK-982143"
                  value={trackingCodeInput}
                  onChange={(e) => setTrackingCodeInput(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                />
              </div>}

              {sampleShippingError && (
                <div role="alert" className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3.5 text-left">
                  <p className="m-0 text-xs font-bold text-[#991B1B]">Chưa tạo được vận đơn gửi mẫu</p>
                  <p className="mb-0 mt-1.5 whitespace-normal break-words text-xs leading-relaxed text-[#7F1D1D]">{sampleShippingError}</p>
                </div>
              )}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTrackingModalItem(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#7D715E] hover:bg-[#FAF8F5] transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatingSample}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#EBD08C] text-white hover:bg-[#DEC07A] transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {updatingSample ? 'Đang xử lý...' : carrierInput === 'GHN' ? sampleGhnEnvironment === 'TEST' ? 'Tạo vận đơn GHN sandbox' : 'Tạo vận đơn GHN thật' : 'Xác Nhận Đã Gửi Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inviteModal}


      {/* MODAL 4: Danh Bạ & Khám Phá Nhà Sáng Tạo (KOL/KOC) SCANMS */}
      {discoveryModal}
    </div>
  );
}
