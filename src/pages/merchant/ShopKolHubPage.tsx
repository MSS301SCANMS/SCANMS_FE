import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  UserPlus,
  Mail,
  X,
  Crown,
  Info,
  ArrowUpRight,
} from 'lucide-react';
import api from '../../services/api';
import ChatBoxPage from '../chat/ChatBoxPage';
import KolRecommendationPage from './KolRecommendationPage';
import { toast } from '../../utils/toast';
import { Select } from '../../components/ui/Select';

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

function KolAvatar({
  src,
  name,
  className,
}: {
  src?: string;
  name: string;
  className: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'K';

  return (
    <span className={`${className} relative inline-flex items-center justify-center overflow-hidden bg-[#F3EFE6] text-[#B88E4F] font-bold`}>
      <span aria-hidden="true">{initials}</span>
      {src && failedSource !== src && (
        <img
          src={src}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedSource(src)}
        />
      )}
    </span>
  );
}

export interface SampleRequestItem {
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
  reviewVideoUrl?: string;
  videoTitle?: string;
  videoSubmittedAt?: string;
  deadlineAt?: string;
  revisionDeadlineAt?: string;
  expectedVideoAt?: string;
  receivedAt?: string;
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

  const [isAiMatchingMode, setIsAiMatchingMode] = useState(modeParam === 'ai-matching');
  const [kols, setKols] = useState<PartnerKol[]>([]);
  const [selectedKolId, setSelectedKolId] = useState<string>(kolParam || '');
  const [activeTab, setActiveTab] = useState<'messages' | 'samples' | 'performance' | 'profile'>(
    (tabParam as any) || 'messages'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<'ALL' | 'PENDING_SAMPLE'>('ALL');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Samples management
  const [samplesMap, setSamplesMap] = useState<Record<string, SampleRequestItem[]>>({});
  const [loadingBackendData, setLoadingBackendData] = useState(true);
  const [sampleFilter, setSampleFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SHIPPED' | 'RECEIVED' | 'VIDEO_SUBMITTED' | 'REVISION_REQUIRED' | 'OVERDUE' | 'DELIVERY_ISSUE' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'>('ALL');
  const [sampleProgramStats, setSampleProgramStats] = useState<any>(null);
  const [trackingModalItem, setTrackingModalItem] = useState<SampleRequestItem | null>(null);
  const [carrierInput, setCarrierInput] = useState('GHTK');
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [updatingSample, setUpdatingSample] = useState(false);

  // Commission & Invite Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [copyingLink, setCopyingLink] = useState(false);
  const [sharedShopLink, setSharedShopLink] = useState('');
  const [ownedStore, setOwnedStore] = useState<{ id: string; name: string } | null>(null);

  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState<number>(22);
  const [updatingCommission, setUpdatingCommission] = useState(false);
  const [performanceRange, setPerformanceRange] = useState<'7d' | '30d' | 'month' | 'all'>('30d');
  const [showSimulatedOrders, setShowSimulatedOrders] = useState(false);

  // Creator Discovery Directory Modal (Khám phá & Thêm KOL mới)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
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

  // Sync URL Params
  useEffect(() => {
    if (kolParam && kolParam !== selectedKolId) {
      setSelectedKolId(kolParam);
    }
    if (tabParam && ['messages', 'samples', 'performance', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    if (modeParam === 'ai-matching') {
      setIsAiMatchingMode(true);
    } else {
      setIsAiMatchingMode(false);
    }
  }, [kolParam, tabParam, modeParam]);

  // Load real data from backend
  const loadBackendData = useCallback(async () => {
    setLoadingBackendData(true);
    try {
      // 1. Load sample requests from shop
      const [sampleRes, statsRes]: [any, any] = await Promise.all([
        api.get('/sample-requests/shop'),
        api.get('/sample-requests/shop/stats').catch(() => null),
      ]);
      setSampleProgramStats(statsRes?.data || statsRes || null);
      const sampleData = sampleRes?.data || sampleRes;
      const sampleStatsByKol: Record<string, { total: number; pending: number; completed: number }> = {};
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
            reviewVideoUrl: item.videoUrl,
            videoTitle: item.videoTitle,
            videoSubmittedAt: item.videoSubmittedAt,
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
          };
          if (!grouped[kolId]) grouped[kolId] = [];
          // Avoid duplicates
          if (!grouped[kolId].some((s) => s.id === transformed.id)) {
            grouped[kolId].unshift(transformed);
          }
          const currentStats = sampleStatsByKol[kolId] || (sampleStatsByKol[kolId] = { total: 0, pending: 0, completed: 0 });
          currentStats.total += 1;
          if (item.status === 'PENDING') currentStats.pending += 1;
          if (item.status === 'COMPLETED') currentStats.completed += 1;
        });
        setSamplesMap(grouped);
        const requestKols: PartnerKol[] = sampleData
          .filter((item: any) => item.collaborator?.id)
          .map((item: any) => {
            const creator = item.collaborator;
            const profile = creator.collaboratorProfile || {};
            const channel = item.socialChannel;
            const requestStats = sampleStatsByKol[creator.id] || { total: 0, pending: 0, completed: 0 };
            return {
              id: creator.id,
              fullName: creator.fullName || 'Nhà sáng tạo SCANMS',
              email: creator.email || '',
              phone: creator.phoneNumber || undefined,
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
            };
          });
        setKols((current) => {
          const merged = [...current];
          requestKols.forEach((kol) => {
            const index = merged.findIndex((item) => item.id === kol.id);
            if (index < 0) merged.push(kol);
            else merged[index] = { ...merged[index], ...kol };
          });
          return merged;
        });
      }

      // 2. Load members from store collaborators
      const membersRes: any = await api.get('/store-collaborators/shop');
      const membersBody = membersRes?.data || membersRes;
      if (membersBody?.store?.id) setOwnedStore(membersBody.store);
      if (Array.isArray(membersBody?.members) && membersBody.members.length > 0) {
        const backendKols: PartnerKol[] = membersBody.members.map((m: any, idx: number) => {
          const c = m.collaborator || {};
          const profile = c.collaboratorProfile || {};
          const channel = c.socialChannels?.[0];
          return {
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
          };
        });

        // Merge without losing default rich preview
        setKols((prev) => {
          const combined = [...prev];
          backendKols.forEach((bk) => {
            const existingIndex = combined.findIndex(
              (k) => k.id === bk.id || k.email === bk.email
            );
            if (existingIndex === -1) {
              combined.push(bk);
            } else {
              combined[existingIndex] = {
                ...combined[existingIndex],
                ...bk,
                stats: bk.stats,
              };
            }
          });
          return combined;
        });
      }

      // 3. Load active verified creators from backend database
      const creatorsRes: any = await api.get('/chat/search-collaborators');
      const creatorsData = creatorsRes?.data || creatorsRes;
      if (Array.isArray(creatorsData) && creatorsData.length > 0) {
        const dbKols: PartnerKol[] = creatorsData.map((c: any) => {
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

        setKols((prev) => {
          const combined = [...prev];
          dbKols.forEach((dk) => {
            const existingIdx = combined.findIndex((k) => k.id === dk.id || k.email === dk.email);
            if (existingIdx >= 0) {
              combined[existingIdx] = { ...combined[existingIdx], ...dk, id: dk.id };
            } else {
              combined.push(dk);
            }
          });
          return combined;
        });
      }
    } catch {
      // Keep rich fallback
    } finally {
      setLoadingBackendData(false);
    }
  }, []);

  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // Selected Kol Object
  const selectedKol = useMemo(() => {
    return kols.find((k) => k.id === selectedKolId) || kols[0];
  }, [kols, selectedKolId]);

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
    return list.filter((s) => s.status === sampleFilter);
  }, [samplesMap, selectedKol, sampleFilter]);

  // Handler: Select KOL
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
    if (!trackingModalItem || !trackingCodeInput.trim()) return;

    setUpdatingSample(true);
    try {
      await api.patch(`/sample-requests/${trackingModalItem.id}/ship`, {
        carrier: carrierInput,
        trackingNumber: trackingCodeInput.trim(),
      });
      toast.success('Đã cập nhật mã vận đơn và chuyển sang trạng thái Đang giao hàng!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật mã vận đơn.');
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
                trackingCode: trackingCodeInput.trim(),
              }
            : item
        );
      });
      return copy;
    });

    setTrackingModalItem(null);
    setTrackingCodeInput('');
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

  // Handler: Update VIP Commission
  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingCommission(true);
    setTimeout(() => {
      setKols((prev) =>
        prev.map((k) => (k.id === selectedKol.id ? { ...k, commissionRate: newCommissionRate } : k))
      );
      setUpdatingCommission(false);
      setShowCommissionModal(false);
      toast.success(`Đã nâng mức hoa hồng đặc quyền cho ${selectedKol.fullName} lên ${newCommissionRate}%!`);
    }, 600);
  };

  // Copy Store Invite Link
  const handleCopyInviteLink = async () => {
    if (copyingLink) return;
    setCopyingLink(true);
    setCopiedLink(false);
    try {
      const response: any = await api.get('/stores/my-store');
      const store = response?.data || response;
      if (!store?.slug) throw new Error('Gian hàng chưa có đường dẫn công khai để chia sẻ.');
      const link = new URL(`/shop/${encodeURIComponent(store.slug)}`, window.location.origin).href;
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#231D15]/35 p-4 backdrop-blur-xs" onClick={() => { if (!inviting) setShowInviteModal(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="invite-kol-title" className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white shadow-[0_24px_70px_rgba(35,29,21,0.18)]" onClick={(event) => event.stopPropagation()}>
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#EAE4D7] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><UserPlus className="h-5 w-5" /></span>
            <div><h3 id="invite-kol-title" className="text-base font-semibold text-[#1A1612]">Mời KOL hợp tác</h3><p className="mt-0.5 text-xs text-[#7D715E]">{ownedStore?.name || 'Kết nối đội ngũ nhà sáng tạo trên SCANMS'}</p></div>
          </div>
          <button type="button" disabled={inviting} onClick={() => setShowInviteModal(false)} aria-label="Đóng lời mời KOL" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#7D715E] transition hover:bg-[#FBF5EB] disabled:opacity-40"><X className="h-4 w-4" /></button>
        </header>
        <form onSubmit={handleInviteKol} className="min-h-0 overflow-y-auto px-5 py-5">
          <p className="mb-4 text-sm leading-relaxed text-[#7D715E]">Nhập email tài khoản KOL/CTV đã có trên SCANMS. Lời mời được gửi trong hệ thống để KOL xác nhận hợp tác.</p>
          <label htmlFor="kol-invite-email" className="mb-1.5 block text-sm font-medium text-[#1A1612]">Email của KOL/CTV <span className="text-[#DC2626]">*</span></label>
          <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B88E4F]" /><input id="kol-invite-email" type="email" required autoComplete="email" maxLength={254} disabled={inviting} placeholder="tenkol@example.com" value={inviteEmail} onChange={(event) => { setInviteEmail(event.target.value); setInviteError(''); setInviteSuccess(''); }} aria-invalid={!!inviteError} aria-describedby="kol-invite-help" className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-white pl-10 pr-3 text-sm text-[#1A1612] outline-none transition placeholder:text-[#A79B89] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/10 disabled:opacity-60" /></div>
          <p id="kol-invite-help" className="mt-2 text-xs leading-relaxed text-[#7D715E]">KOL cần chấp nhận lời mời trước khi trở thành thành viên của gian hàng.</p>
          {inviteError && <p role="alert" className="mt-3 text-sm text-[#DC2626]">{inviteError}</p>}
          {inviteSuccess && <div role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-[#EAE4D7] bg-white p-3 text-sm text-[#1A1612]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" /><p>{inviteSuccess}</p></div>}
          <button type="submit" disabled={inviting || !inviteEmail.trim()} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#C59B58] text-sm font-semibold text-[#231D15] transition hover:bg-[#B88E4F] disabled:cursor-not-allowed disabled:opacity-50"><UserPlus className="h-4 w-4" />{inviting ? 'Đang gửi…' : 'Gửi lời mời hợp tác'}</button>
          <div className="mt-5 border-t border-[#EAE4D7] pt-4">
            <p className="text-xs leading-relaxed text-[#7D715E]">Muốn giới thiệu shop? Chia sẻ trang gian hàng trên SCANMS. Liên kết này không tự tạo lời mời hợp tác.</p>
            <button type="button" disabled={copyingLink} onClick={handleCopyInviteLink} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#EAE4D7] bg-white text-xs font-medium text-[#1A1612] transition hover:bg-[#FBF5EB] disabled:opacity-50">{copiedLink ? <Check className="h-4 w-4 text-[#059669]" /> : <Copy className="h-4 w-4 text-[#B88E4F]" />}{copyingLink ? 'Đang lấy liên kết…' : copiedLink ? 'Đã sao chép' : 'Sao chép trang gian hàng'}</button>
            {sharedShopLink && <input readOnly aria-label="Liên kết trang gian hàng" value={sharedShopLink} onFocus={(event) => event.target.select()} className="mt-2 h-9 w-full rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs text-[#7D715E] outline-none" />}
          </div>
        </form>
      </section>
    </div>, document.body
  );

  const discoveryModal = showDiscoveryModal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in-50 duration-200"
          onClick={() => setShowDiscoveryModal(false)}
        >
          <div
            className="bg-white border border-[#EAE4D7] rounded-2xl w-full max-w-4xl max-h-[84dvh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="creator-directory-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="shrink-0 px-4 py-4 sm:px-5 border-b border-[#EAE4D7] bg-white flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><Users className="h-5 w-5" /></span>
                <div className="min-w-0">
                <h3 id="creator-directory-title" className="m-0 text-lg font-bold text-[#1A1612]">
                  Tìm nhà sáng tạo KOL/KOC
                </h3>
                <p className="text-xs text-[#7D715E] mt-0.5">
                  Khám phá hồ sơ trên SCANMS và nhắn tin trao đổi hợp tác.
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
            <div className="px-4 py-3 sm:px-5 border-b border-[#EAE4D7] bg-white grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_155px_145px] sm:items-end">
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
              <label className="grid gap-1 text-[11px] font-medium text-[#7D715E]">Hạng nhà sáng tạo
                <Select value={discoveryTier} onChange={(event) => setDiscoveryTier(event.target.value)} className="h-10 w-full text-xs">
                  <option value="ALL">Tất cả hạng</option><option value="DIAMOND">Kim cương</option><option value="GOLD">Vàng</option><option value="SILVER">Bạc</option><option value="BRONZE">Đồng</option>
                </Select>
              </label>
            </div>

            {/* Creators Grid */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 bg-[#FAF8F5]/50">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
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
                        className="bg-white border border-[#EAE4D7] rounded-2xl p-4 hover:border-[#DCC69F] transition shadow-[0_2px_8px_rgba(35,29,21,0.025)] flex flex-col justify-between gap-2 min-w-0"
                      >
                        <div>
                          {/* Top: Avatar + Name + Tier */}
                          <div className="flex items-start gap-3">
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
                              <p className="text-[11px] text-[#7D715E] truncate mt-0.5">
                                {creator.email} {creator.phoneNumber ? `· ${creator.phoneNumber}` : ''}
                              </p>
                              {profile.kycStatus === 'VERIFIED' && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#7D715E] mt-1">
                                  <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                                  Đã xác minh danh tính
                                </span>
                              )}
                            </div>
                          </div>

                          <details className="mt-3 space-y-2">
                            <summary className="cursor-pointer text-xs font-medium text-[#8C6226]">{channels.length} kênh mạng xã hội · Xem chi tiết</summary>
                            {channels.length > 0 ? (
                              <div className="space-y-1.5">
                                {channels.slice(0, 2).map(renderChannel)}
                                {channels.length > 2 && <details className="text-xs text-[#7D715E]"><summary className="cursor-pointer py-1 hover:text-[#B88E4F]">Xem thêm {channels.length - 2} kênh</summary><div className="mt-1 space-y-1.5">{channels.slice(2).map(renderChannel)}</div></details>}
                              </div>
                            ) : <p className="text-xs text-[#7D715E]">Chưa liên kết kênh mạng xã hội</p>}
                          </details>

                          {/* Quick Stats */}
                          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#EAE4D7]/70">
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
                        </div>

                        {/* CTA button */}
                        <div className="pt-3 border-t border-[#EAE4D7]/70 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleConnectCreator(creator)}
                            disabled={isConnecting}
                            className="h-9 px-3 rounded-lg text-xs font-semibold bg-[#C59B58] text-[#231D15] hover:bg-[#B88E4F] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {isConnecting ? 'Đang kết nối…' : 'Nhắn tin hợp tác'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 sm:px-5 border-t border-[#EAE4D7] bg-white flex flex-wrap gap-3 items-center justify-between">
              <span className="text-xs text-[#7D715E]">
                Đã có email tài khoản KOL? Gửi lời mời hợp tác trên SCANMS.
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

  if (!selectedKol && !isAiMatchingMode && loadingBackendData) {
    return <div className="min-h-[420px] grid place-items-center text-sm text-[#7D715E]">Đang tải hồ sơ KOL và yêu cầu mẫu…</div>;
  }

  if (!selectedKol && !isAiMatchingMode) {
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
        <button type="button" onClick={() => { setIsAiMatchingMode(true); setSearchParams({ mode: 'ai-matching' }, { replace: true }); }} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[#EEDFC6] bg-white px-4 py-2.5 text-sm font-semibold text-[#B88E4F] hover:bg-[#FBF5EB]">
          <Sparkles className="h-4 w-4" /> AI Tìm Kiếm KOL Mới
        </button>
        {discoveryModal}
        {inviteModal}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pt-3 sm:pt-4 pb-4" id="shop-kol-hub-workspace">
      {/* Mode 1: AI Recommendation Mode */}
      {isAiMatchingMode ? (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between bg-white border border-[#EAE4D7] rounded-2xl px-4 py-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B88E4F]" />
              <span className="text-xs font-black text-[#1A1612] uppercase tracking-wider">
                Hệ Thống AI Đề Xuất & Tìm Kiếm KOL
              </span>
            </div>
            <button
              type="button"
              id="btn-return-workspace"
              onClick={() => {
                setIsAiMatchingMode(false);
                setSearchParams({ kol: selectedKolId, tab: activeTab }, { replace: true });
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#C59B58] text-white hover:bg-[#B88E4F] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>← Quay lại Không Gian 1-1</span>
            </button>
          </div>
          <KolRecommendationPage />
        </div>
      ) : (
        /* Mode 2: Partner-Centric 2-Column Workspace */
        <div className="bg-white border border-[#EAE4D7] rounded-3xl shadow-sm overflow-hidden flex flex-row h-[calc(100vh-125px)] sm:h-[calc(100vh-130px)] min-h-[620px] max-h-[960px]">
          {/* LEFT COLUMN: KOL List & Filters */}
          <div
            className={`${
              isSidebarCollapsed ? 'w-[72px]' : 'w-full sm:w-[285px] lg:w-[305px] xl:w-[325px]'
            } flex-shrink-0 border-r border-[#EAE4D7] bg-[#FAF8F5] flex flex-col h-full transition-all duration-300 ease-in-out`}
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
                    const isSelected = kol.id === selectedKol.id;
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
                <div className="flex items-center justify-between gap-2 border-b border-[#EAE4D7] bg-white px-4 py-3 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shadow-2xs shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h1 className="truncate text-sm font-extrabold tracking-tight text-[#1A1612] uppercase">
                        Nhà Sáng Tạo
                      </h1>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                        {filteredKols.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      id="btn-discover-creators"
                      onClick={() => setShowDiscoveryModal(true)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] shadow-2xs transition hover:border-[#B88E4F] hover:bg-[#FBF5EB] hover:text-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                      title="Khám phá và kết nối nhà sáng tạo mới trên sàn"
                      aria-label="Tìm nhà sáng tạo KOL/KOC"
                      aria-haspopup="dialog"
                      aria-expanded={showDiscoveryModal}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(true)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] shadow-2xs transition hover:border-[#B88E4F] hover:bg-[#FBF5EB] hover:text-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                      title="Mời riêng nhà sáng tạo qua liên kết"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSidebarCollapsed(true)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] shadow-2xs transition hover:border-[#B88E4F] hover:bg-[#FBF5EB] hover:text-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                      title="Thu gọn danh sách"
                      aria-label="Thu gọn danh sách"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="border-b border-[#EAE4D7] bg-[#FAF8F5] p-3 shrink-0">
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
                  <div className="flex items-center gap-3 mt-2.5 pt-1 text-xs">
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
                </div>

                {/* KOL items list - Exact ChatBoxPage Card Style */}
                <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2.5 no-scrollbar" role="list">
                  {filteredKols.length === 0 ? (
                    <div className="py-12 text-center text-[#7D715E] text-xs space-y-2">
                      <Users className="w-7 h-7 mx-auto text-[#C59B58]/40 stroke-1" />
                      <p className="font-medium">Không tìm thấy nhà sáng tạo nào phù hợp.</p>
                    </div>
                  ) : (
                    filteredKols.map((kol) => {
                      const isSelected = kol.id === selectedKol.id;
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
                          className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-150 ${
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
          <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5]/30">
            {/* 1. Header of Selected KOL (Ultra-Compact Single-Row SCANMS Creator Style) */}
            <div className="h-14 px-4 bg-white border-b border-[#EAE4D7] flex items-center justify-between gap-3 shrink-0">
              {/* Left: Avatar + (Name & Badges on top) + (TikTok & Followers below) */}
              <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => openKolProfile(selectedKol.id)}
                    title={`Xem hồ sơ ${selectedKol.fullName}`}
                    aria-label={`Xem hồ sơ ${selectedKol.fullName}`}
                    className="rounded-lg border border-[#E8D4B0] bg-gradient-to-br from-[#FAF0DD] to-[#F3EFE6] p-0.5 cursor-pointer shadow-2xs transition hover:scale-105"
                  >
                    <KolAvatar
                      src={selectedKol.avatarUrl}
                      name={selectedKol.fullName}
                      className="w-9 h-9 rounded-md object-cover text-xs font-black text-[#8C6226]"
                    />
                  </button>
                  <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[7.5px] font-black uppercase tracking-wider bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white shadow-2xs border border-white">
                    {selectedKol.tier === 'DIAMOND' ? 'Kim cương' : selectedKol.tier === 'GOLD' ? 'Vàng' : selectedKol.tier === 'SILVER' ? 'Bạc' : selectedKol.tier === 'BRONZE' ? 'Đồng' : 'Chưa xếp hạng'}
                  </span>
                </div>

                <div className="min-w-0 flex flex-col justify-center gap-0.5">
                  {/* Row 1: Full Name + Badges */}
                  <div className="flex items-center gap-2 min-w-0">
                    <h2
                      onClick={() => openKolProfile(selectedKol.id)}
                      className="text-sm font-black text-[#1A1612] tracking-tight truncate min-w-0 max-w-[150px] sm:max-w-[200px] cursor-pointer hover:text-[#B88E4F] transition-colors"
                      title={selectedKol.fullName}
                    >
                      {selectedKol.fullName.replace(/\s*\([^)]*\)/g, '').trim() || selectedKol.fullName}
                    </h2>

                    {selectedKol.kycStatus === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] shrink-0 whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                        <span>Đã xác thực</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] shrink-0 whitespace-nowrap">
                      <Sparkles className="w-2.5 h-2.5 text-[#B88E4F]" />
                      <span>{selectedKol.commissionRate != null ? `VIP: ${selectedKol.commissionRate}%` : 'Chuẩn sàn'}</span>
                    </span>
                  </div>

                  {/* Row 2: TikTok Handle & Followers Count (Clear, no clipping or overlapping behind buttons!) */}
                  {selectedKol.handle && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#7D715E] truncate">
                      <span>{selectedKol.primaryChannel?.platform || 'Kênh'}: <strong className="text-[#1A1612] font-semibold">{selectedKol.handle.replace(/^@+/, '@')}</strong></span>
                      {selectedKol.primaryChannel?.followers && (
                        <span>
                          • {selectedKol.primaryChannel.followers >= 1000
                            ? `${(selectedKol.primaryChannel.followers / 1000).toLocaleString('vi-VN')}K`
                            : selectedKol.primaryChannel.followers}{' '}
                          người theo dõi
                        </span>
                      )}
                      {selectedKol.primaryChannel?.engagementRate && (
                        <span className="text-[#059669] font-medium hidden lg:inline">
                          • Tương tác: {selectedKol.primaryChannel.engagementRate}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Quick Action Buttons & Discovery CTAs (Borderless) */}
              <div className="flex items-center gap-3 shrink-0">
                {/* 1. Nút AI Tìm Kiếm KOL Mới */}
                <button
                  type="button"
                  id="btn-toggle-ai-mode"
                  onClick={() => {
                    const nextMode = !isAiMatchingMode;
                    setIsAiMatchingMode(nextMode);
                    setSearchParams(
                      nextMode ? { mode: 'ai-matching' } : { kol: selectedKolId, tab: activeTab },
                      { replace: true }
                    );
                  }}
                  className="text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-[#B88E4F] hover:text-[#1A1612] shrink-0 whitespace-nowrap bg-transparent border-0 p-0"
                  title="Sử dụng AI phân tích sản phẩm và tìm kiếm KOL phù hợp"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span className="hidden xl:inline">AI Tìm Kiếm KOL Mới</span>
                  <span className="xl:hidden">AI Tìm KOL</span>
                </button>

                {/* 2. Nút Khám Phá & Mời KOL */}
                <button
                  type="button"
                  id="btn-open-creator-directory"
                  onClick={() => setShowDiscoveryModal(true)}
                  className="text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-[#B88E4F] hover:text-[#1A1612] shrink-0 whitespace-nowrap bg-transparent border-0 p-0 ml-1"
                  title="Khám phá danh bạ và gửi lời mời đến KOL trên sàn"
                >
                  <Users className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span className="hidden xl:inline">Khám Phá & Mời KOL</span>
                  <span className="xl:hidden">Khám Phá KOL</span>
                </button>
              </div>
            </div>

            {/* 2. Sub-Tabs Header (Compact SCANMS Style) */}
            <div className="h-10 px-4 bg-[#FAF8F5] border-b border-[#EAE4D7] flex items-center justify-between overflow-x-auto no-scrollbar shrink-0">
              <div className="flex items-center h-full gap-1 sm:gap-2">
                <button
                  type="button"
                  id="tab-btn-messages"
                  onClick={() => handleTabChange('messages')}
                  className={`h-full px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'messages'
                      ? 'border-[#C59B58] text-[#1A1612] font-black bg-white/60'
                      : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 ${activeTab === 'messages' ? 'text-[#B88E4F]' : 'text-[#7D715E]'}`} />
                  <span>Trao đổi tin nhắn</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-samples"
                  onClick={() => handleTabChange('samples')}
                  className={`h-full px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'samples'
                      ? 'border-[#C59B58] text-[#1A1612] font-black bg-white/60'
                      : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <Package className={`w-3.5 h-3.5 ${activeTab === 'samples' ? 'text-[#B88E4F]' : 'text-[#7D715E]'}`} />
                  <span>Duyệt hàng mẫu</span>
                  {(samplesMap[selectedKol.id] || []).length > 0 && (
                    <span className="min-w-4 h-4 px-1 rounded-full text-[10px] font-black bg-[#C59B58] text-white inline-flex items-center justify-center shadow-2xs">
                      {(samplesMap[selectedKol.id] || []).length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="tab-btn-performance"
                  onClick={() => handleTabChange('performance')}
                  className={`h-full px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'performance'
                      ? 'border-[#C59B58] text-[#1A1612] font-black bg-white/60'
                      : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <BarChart3 className={`w-3.5 h-3.5 ${activeTab === 'performance' ? 'text-[#B88E4F]' : 'text-[#7D715E]'}`} />
                  <span>Hiệu suất doanh số</span>
                </button>

                <button
                  type="button"
                  id="tab-btn-profile"
                  onClick={() => handleTabChange('profile')}
                  className={`h-full px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'profile'
                      ? 'border-[#C59B58] text-[#1A1612] font-black bg-white/60'
                      : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <UserCheck className={`w-3.5 h-3.5 ${activeTab === 'profile' ? 'text-[#B88E4F]' : 'text-[#7D715E]'}`} />
                  <span>Hồ sơ & Mạng xã hội</span>
                </button>
              </div>

              {/* Right: Nút Cấp VIP & Kênh MXH (Borderless) */}
              <div className="flex items-center gap-3 shrink-0 ml-auto">
                <button
                  type="button"
                  id="btn-quick-cap-vip"
                  onClick={() => {
                    setNewCommissionRate(selectedKol.commissionRate || 22);
                    setShowCommissionModal(true);
                  }}
                  className="text-xs font-bold text-[#1A1612] hover:text-[#B88E4F] transition flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap bg-transparent border-0 p-0"
                  title="Cấp mức hoa hồng độc quyền VIP cho KOL này"
                >
                  <DollarSign className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Cấp VIP</span>
                </button>

                {selectedKol.primaryChannel?.url && (
                  <a
                    href={selectedKol.primaryChannel.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#7D715E] hover:text-[#1A1612] transition flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap bg-transparent border-0 p-0"
                    title="Mở kênh TikTok / YouTube của KOL"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#7D715E]" />
                    <span>Kênh MXH</span>
                  </a>
                )}
              </div>
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
                <div className="h-full w-full overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* TAB 2: SAMPLE REQUESTS MANAGEMENT */}
                  {activeTab === 'samples' && (
                    <div className="animate-in fade-in-50 duration-200 space-y-4">
                  {sampleProgramStats && (
                    <div className="space-y-2"><p className="text-xs font-medium text-[#7D715E]">Tổng quan hàng mẫu của gian hàng</p><div className="grid grid-cols-2 xl:grid-cols-5 gap-2">
                      <div className="rounded-xl bg-white border border-[#EAE4D7] px-3 py-2.5">
                        <span className="text-[10px] text-[#7D715E] block">Giá trị mẫu đã cấp</span>
                        <strong className="text-sm text-[#1A1612]">{Number(sampleProgramStats.issuedValue || 0).toLocaleString('vi-VN')} ₫</strong>
                      </div>
                      <div className="rounded-xl bg-white border border-[#EAE4D7] px-3 py-2.5">
                        <span className="text-[10px] text-[#7D715E] block">Đã duyệt cấp mẫu</span>
                        <strong className="text-sm text-[#1A1612]">{sampleProgramStats.grantedCount || 0}</strong>
                      </div>
                      <div className="rounded-xl bg-white border border-[#EAE4D7] px-3 py-2.5">
                        <span className="text-[10px] text-[#7D715E] block">Tỷ lệ nộp video</span>
                        <strong className="text-sm text-[#1A1612]">{sampleProgramStats.videoSubmissionRate || 0}%</strong>
                      </div>
                      <div className="rounded-xl bg-white border border-[#EAE4D7] px-3 py-2.5">
                        <span className="text-[10px] text-[#7D715E] block">Tỷ lệ hoàn tất</span>
                        <strong className="text-sm text-[#1A1612]">{sampleProgramStats.completedRate || 0}%</strong>
                      </div>
                      <div className="rounded-xl bg-white border border-[#EAE4D7] px-3 py-2.5">
                        <span className="text-[10px] text-[#7D715E] block">Quá hạn / mẫu còn lại</span>
                        <strong className="text-sm text-[#1A1612]">{sampleProgramStats.overdue || 0} / {sampleProgramStats.remainingSampleQuota || 0}</strong>
                      </div>
                    </div></div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EAE4D7] bg-white p-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {([{value:'ALL',label:'Tất cả'}, {value:'PENDING',label:'Chờ duyệt mẫu'}, {value:'VIDEO_SUBMITTED',label:'Chờ duyệt video'}] as const).map((filter) => (
                        <button key={filter.value} type="button" onClick={() => setSampleFilter(filter.value)} aria-pressed={sampleFilter === filter.value} className={
                          'rounded-lg px-3 py-2 text-xs font-semibold transition ' + (sampleFilter === filter.value ? 'bg-[#FBF5EB] text-[#8C6226] ring-1 ring-[#EEDFC6]' : 'text-[#7D715E] hover:bg-[#FAF8F5]')
                        }>{filter.label}<span className="ml-1.5 text-[11px]">{(samplesMap[selectedKol.id] || []).filter((sample) => filter.value === 'ALL' || sample.status === filter.value).length}</span></button>
                      ))}
                    </div>
                    <Select
                      value={sampleFilter}
                      onChange={(event) => setSampleFilter(event.target.value as typeof sampleFilter)}
                      aria-label="Lọc lịch sử yêu cầu mẫu"
                      className="w-44 text-xs font-medium"
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
                          className="bg-white border border-[#EAE4D7] rounded-xl p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(35,29,21,0.025)] hover:border-[#B88E4F]/60 transition"
                        >
                          <div className="flex flex-col xl:flex-row items-start justify-between gap-3">
                            {/* Product Info */}
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <img
                                src={
                                  item.product.thumbnail ||
                                  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={item.product.title}
                                className="w-12 h-12 rounded-xl object-cover border border-[#EAE4D7] flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                      item.status === 'PENDING'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : item.status === 'APPROVED'
                                        ? 'bg-[#FBF5EB] text-[#8C6226] border-[#EEDFC6]'
                                        : item.status === 'SHIPPED'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : ['COMPLETED', 'VIDEO_SUBMITTED'].includes(item.status)
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    {item.status === 'PENDING' && 'Chờ duyệt mẫu'}
                                    {item.status === 'APPROVED' && 'Đã duyệt · Chờ gửi'}
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

                                <h4 className="text-sm font-extrabold text-[#1A1612]">
                                  {item.product.title}
                                </h4>

                                <div className="text-xs text-[#7D715E] mt-1 space-y-0.5">
                                  <div>
                                    Giá mẫu:{' '}
                                    <strong className="text-[#1A1612]">
                                      {Number(item.product.price || 0).toLocaleString('vi-VN')} ₫
                                    </strong>{' '}
                                    · Hoa hồng: <strong>{item.product.commissionRate != null ? (item.product.commissionRate + "%") : "—"}</strong>
                                  </div>
                                  {item.expectedVideoAt && (
                                    <div>Ngày KOL dự kiến đăng: {new Date(item.expectedVideoAt).toLocaleDateString('vi-VN')}</div>
                                  )}
                                  {item.deadlineAt && !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.status) && (
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
                                  {(item.events?.length || item.videoAssets?.length) ? (
                                    <details className="mt-1 text-[11px] text-[#7D715E]">
                                      <summary className="cursor-pointer font-semibold text-[#8C6226]">Lịch sử xử lý và video</summary>
                                      <ul className="mt-1 space-y-1 pl-4">
                                        {(item.events || []).map((event) => <li key={event.id}>{new Date(event.createdAt).toLocaleString('vi-VN')} · {event.action}</li>)}
                                        {(item.videoAssets || []).map((asset) => <li key={asset.id}><a href={asset.urlOrContent} target="_blank" rel="noreferrer" className="underline">{asset.title || 'Video đã gửi'}</a> · {asset.status}{asset.rejectionReason ? ` · ${asset.rejectionReason}` : ''}</li>)}
                                      </ul>
                                    </details>
                                  ) : null}
                                  {item.trackingCode && (
                                    <div className="font-medium text-[#7D715E]">
                                      Vận chuyển: {item.carrier} — Mã vận đơn: {item.trackingCode}
                                    </div>
                                  )}
                                  <details className="mt-2 text-xs">
                                    <summary className="w-fit cursor-pointer font-medium text-[#8C6226] hover:underline">Thông tin nhận hàng & cam kết</summary>
                                    <div className="mt-2 space-y-1.5 rounded-lg bg-[#FAF8F5] p-3 leading-relaxed text-[#7D715E]">
                                  <div>📍 Địa chỉ nhận: {item.shippingAddress}</div>
                                  {item.recipientName && (
                                    <div>Người nhận: <strong>{item.recipientName}</strong> · {item.recipientPhone || '—'}</div>
                                  )}
                                  {(item.socialPlatformSnapshot || item.socialChannel) && (
                                    <div>
                                      Kênh đã cam kết: <strong>{item.socialPlatformSnapshot || item.socialChannel?.platformName}</strong>
                                      {item.socialChannelNameSnapshot || item.socialChannel?.channelName ? ` · ${item.socialChannelNameSnapshot || item.socialChannel?.channelName}` : ''}
                                      {' · '}{Number(item.socialFollowerSnapshot ?? item.socialChannel?.followerCount ?? 0).toLocaleString('vi-VN')} followers
                                    </div>
                                  )}
                                  {item.note && (
                                    <div className="italic text-[#B88E4F]">
                                      KOL cam kết: "{item.note}"
                                    </div>
                                  )}
                                  {item.collaboratorMetrics && (
                                    <div>
                                      Hồ sơ KOL: {item.collaboratorMetrics.tierName || 'Chưa xếp hạng'}
                                      {' · '}{Number(item.collaboratorMetrics.totalFollowers || 0).toLocaleString('vi-VN')} followers toàn kênh
                                      {' · '}{Number(item.collaboratorMetrics.totalOrdersReferred || 0).toLocaleString('vi-VN')} đơn giới thiệu
                                      {' · KYC '}{item.collaboratorMetrics.kycStatus === 'VERIFIED' ? 'đã xác minh' : 'chưa xác minh'}
                                    </div>
                                  )}

                                    </div>
                                  </details>
                                </div>
                              </div>
                            </div>

                            {/* Actions by status */}
                            <div className="flex shrink-0 flex-wrap items-center gap-2 w-full xl:w-auto xl:max-w-[260px] justify-end border-t xl:border-t-0 pt-3 xl:pt-0 border-[#EAE4D7]">
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

                              {(item.status === 'APPROVED' || item.status === 'DELIVERY_ISSUE') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTrackingModalItem(item);
                                    setTrackingCodeInput('');
                                  }}
                                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#231D15] bg-[#C59B58] hover:bg-[#B88E4F] transition shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  {item.status === 'DELIVERY_ISSUE' ? 'Cập nhật vận đơn' : 'Nhập vận đơn'}
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
                const effectiveCommissionRate = selectedKol.commissionRate || 18;
                const rawRevenue = selectedKol.stats?.totalRevenue || 0;
                const rawOrders = selectedKol.stats?.totalOrders || 0;
                const hasOrders = showSimulatedOrders || rawOrders > 0;
                
                // Numbers
                const displayRevenue = hasOrders ? (rawRevenue || 12850000) : 0;
                const displayOrders = hasOrders ? (rawOrders || 24) : 0;
                const displayCommission = Math.round((displayRevenue * effectiveCommissionRate) / 100);
                const displayAov = displayOrders > 0 ? Math.round(displayRevenue / displayOrders) : 0;

                const ordersList: AffiliateOrderItem[] = hasOrders ? [
                  {
                    id: 'ord-1',
                    orderCode: '#SCN-99824',
                    createdAt: 'Hôm nay, 10:15',
                    customerName: 'Trần Minh Anh',
                    productTitle: 'Serum Dưỡng Sáng Mờ Thâm Niacinamide 30ml',
                    orderTotal: 485000,
                    commissionEarned: Math.round((485000 * effectiveCommissionRate) / 100),
                    status: 'DELIVERED',
                  },
                  {
                    id: 'ord-2',
                    orderCode: '#SCN-99752',
                    createdAt: 'Hôm qua, 18:40',
                    customerName: 'Hoàng Quốc Bảo',
                    productTitle: 'Kem Dưỡng Ẩm Chuyên Sâu Khóa Nước 50ml',
                    orderTotal: 620000,
                    commissionEarned: Math.round((620000 * effectiveCommissionRate) / 100),
                    status: 'DELIVERED',
                  },
                  {
                    id: 'ord-3',
                    orderCode: '#SCN-99610',
                    createdAt: '03/10/2026',
                    customerName: 'Vũ Thị Thanh Mai',
                    productTitle: 'Sữa Rửa Mặt Dịu Nhẹ Cân Bằng pH 150ml',
                    orderTotal: 290000,
                    commissionEarned: Math.round((290000 * effectiveCommissionRate) / 100),
                    status: 'SHIPPING',
                  },
                  {
                    id: 'ord-4',
                    orderCode: '#SCN-99540',
                    createdAt: '01/10/2026',
                    customerName: 'Lê Hoàng Nam',
                    productTitle: 'Bộ Chăm Sóc Da Toàn Diện Ban Ngày',
                    orderTotal: 1150000,
                    commissionEarned: Math.round((1150000 * effectiveCommissionRate) / 100),
                    status: 'DELIVERED',
                  },
                ] : [];

                return (
                  <div className="animate-in fade-in-50 duration-200 space-y-4">
                    {/* 1. Header Policy & Strategic Overview Bar */}
                    <div className="rounded-2xl border border-[#EEDFC6] bg-gradient-to-r from-[#FBF5EB] via-white to-[#FAF8F5] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
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
                            setNewCommissionRate(effectiveCommissionRate);
                            setShowCommissionModal(true);
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-[#EEDFC6] bg-white px-3.5 py-2 text-xs font-bold text-[#8F682E] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] hover:text-[#1A1612] cursor-pointer shadow-xs"
                        >
                          <DollarSign className="h-3.5 w-3.5 text-[#B88E4F]" />
                          <span>Hoa hồng VIP ({effectiveCommissionRate}%)</span>
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
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
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
                        <button
                          type="button"
                          onClick={() => setShowSimulatedOrders((v) => !v)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                            showSimulatedOrders
                              ? 'border-[#C59B58] bg-[#C59B58] text-white shadow-xs'
                              : 'border-[#EAE4D7] bg-white text-[#7D715E] hover:border-[#EEDFC6] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
                          }`}
                          title="Bật/Tắt dữ liệu minh họa"
                        >
                          <Sparkles className="inline h-3.5 w-3.5 mr-1 text-inherit" />
                          {showSimulatedOrders ? 'Đang bật số liệu mẫu' : 'Xem mẫu có đơn'}
                        </button>
                      </div>
                    </div>

                    {/* 3. Top 4 Metric Cards (Tone Sáng, Sang Trọng, Chuẩn Vàng Be) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
                    <div className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1A1612] flex items-center gap-1.5">
                          <BarChart3 className="h-4 w-4 text-[#B88E4F]" />
                          Phễu hiệu quả tiếp thị qua kênh của {selectedKol.fullName}
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
                    <div className="rounded-2xl border border-[#EAE4D7] bg-white shadow-xs overflow-hidden">
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
                                setNewCommissionRate(effectiveCommissionRate);
                                setShowCommissionModal(true);
                              }}
                              className="rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white px-4 py-2 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Nâng mức hoa hồng VIP</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowSimulatedOrders(true)}
                              className="rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] px-3.5 py-2 text-xs font-semibold text-[#7D715E] transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" />
                              <span>Xem mẫu có đơn</span>
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
                <div className="animate-in fade-in-50 duration-200 space-y-5">
                  <div className="bg-white border border-[#EAE4D7] rounded-2xl p-6 shadow-xs space-y-6">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#1A1612] uppercase tracking-wider mb-3">
                        Hồ Sơ Nhà Sáng Tạo & Kênh Truyền Thông
                      </h3>
                      <p className="text-xs text-[#7D715E]">
                        Thông tin chi tiết về các kênh quảng bá, độ uy tín và định danh điện tử của KOL.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        Kênh Mạng Xã Hội Đã Liên Kết & Được Xác Minh
                      </h4>
                      <div className="space-y-3">
                        {selectedKol.socialChannels && selectedKol.socialChannels.length > 0 ? (
                          selectedKol.socialChannels.map((ch, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl border border-[#EAE4D7] bg-[#FBF5EB]/50 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white ${
                                    ch.platform === 'TIKTOK'
                                      ? 'bg-black'
                                      : ch.platform === 'YOUTUBE'
                                      ? 'bg-red-600'
                                      : ch.platform === 'INSTAGRAM'
                                      ? 'bg-pink-600'
                                      : 'bg-blue-600'
                                  }`}
                                >
                                  {ch.platform === 'TIKTOK'
                                    ? 'TK'
                                    : ch.platform === 'YOUTUBE'
                                    ? 'YT'
                                    : ch.platform === 'INSTAGRAM'
                                    ? 'IG'
                                    : 'FB'}
                                </div>
                                <div>
                                  <div className="text-xs font-extrabold text-[#1A1612] flex items-center gap-1.5">
                                    {ch.platform}: {ch.handle}
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
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#EAE4D7] text-[#1A1612] hover:bg-[#FAF8F5] flex items-center gap-1 shadow-xs"
                                >
                                  Truy cập kênh <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 rounded-2xl border border-[#EAE4D7] bg-[#FBF5EB]/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#F3EFE6] text-[#8F682E] flex items-center justify-center font-bold text-xs">
                                TK
                              </div>
                              <div>
                                <div className="text-xs font-extrabold text-[#1A1612]">
                                  TikTok: {selectedKol.handle || '@creator'}
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
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#EAE4D7] text-[#1A1612] hover:bg-[#FAF8F5] flex items-center gap-1 shadow-xs"
                              >
                                Truy cập kênh <ExternalLink className="w-3 h-3" />
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
            className="bg-white border border-[#EAE4D7] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#B88E4F]" />
                <h3 className="text-base font-extrabold text-[#1A1612]">Nhập Mã Vận Đơn Gửi Mẫu</h3>
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
                <div className="font-extrabold text-[#1A1612]">{selectedKol.fullName}</div>
                <div className="text-[#7D715E]">{trackingModalItem.product.title}</div>
                <div className="text-[11px] text-[#7D715E] pt-1 border-t border-[#EAE4D7]/60">
                  📍 {trackingModalItem.shippingAddress}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1">Đơn vị vận chuyển</label>
                <Select
                  value={carrierInput}
                  onChange={(e) => setCarrierInput(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="GHTK">GHTK — Giao Hàng Tiết Kiệm</option>
                  <option value="GHN">GHN — Giao Hàng Nhanh</option>
                  <option value="VIETTELPOST">Viettel Post</option>
                  <option value="VNPOST">VNPost</option>
                  <option value="OTHER">Đơn vị khác</option>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1">Mã vận đơn (Tracking code)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SORA-GHTK-982143"
                  value={trackingCodeInput}
                  onChange={(e) => setTrackingCodeInput(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                />
              </div>

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
                  {updatingSample ? 'Đang lưu...' : 'Xác Nhận Đã Gửi Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inviteModal}

      {/* MODAL 3: Nâng Cấp Hoa Hồng VIP (Tone Sáng Sang Trọng) */}
      {showCommissionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1A1612]/35 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowCommissionModal(false)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#EEDFC6] bg-white shadow-[0_24px_70px_rgba(77,57,31,0.18)] transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Soft Ambient Glow (Tone Sáng) */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br from-[#FBF5EB] to-[#F3EFE6] opacity-90 blur-2xl" />

            {/* Header */}
            <div className="relative flex items-center justify-between border-b border-[#EAE4D7] bg-white px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#EEDFC6] bg-gradient-to-br from-[#FBF5EB] to-[#F3EFE6] text-[#B88E4F] shadow-xs">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B88E4F]">Đặc quyền đối tác chiến lược</p>
                  <h3 className="m-0 text-base font-extrabold tracking-tight text-[#1A1612] sm:text-lg">Cấp Mức Hoa Hồng VIP Riêng</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCommissionModal(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EAE4D7] bg-white text-[#7D715E] transition-all hover:border-[#C59B58] hover:bg-[#FBF5EB] hover:text-[#1A1612] cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCommission} className="relative p-5 sm:p-6 space-y-4">
              {/* Creator Profile Card (Tone Sáng) */}
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#EEDFC6] bg-gradient-to-b from-[#FBF5EB] to-[#FAF8F5] p-3.5 sm:p-4 shadow-xs">
                <div className="flex min-w-0 items-center gap-3">
                  {selectedKol.avatarUrl ? (
                    <img
                      src={selectedKol.avatarUrl}
                      alt={selectedKol.fullName}
                      className="h-11 w-11 rounded-2xl border-2 border-white object-cover shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#EEDFC6] bg-white text-sm font-black text-[#B88E4F] shadow-xs">
                      {selectedKol.fullName?.charAt(0) || 'K'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <strong className="truncate text-sm font-extrabold text-[#1A1612]">{selectedKol.fullName}</strong>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#059669]" />
                    </div>
                    <p className="m-0 truncate text-xs text-[#7D715E]">
                      {(selectedKol.handle || selectedKol.email || 'Nhà Sáng Tạo SCANMS').replace(/^@+/, '@')}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#EEDFC6] bg-white px-2.5 py-1 text-[11px] font-black text-[#B88E4F] shadow-xs">
                    <Crown className="h-3 w-3" />
                    {selectedKol.tier || 'KOL VIP'}
                  </span>
                  <p className="m-0 mt-1 text-[10px] text-[#7D715E]">
                    Mức hiện tại: <span className="font-bold text-[#1A1612]">{selectedKol.commissionRate || 18}%</span>
                  </p>
                </div>
              </div>

              {/* Commission Rate Control Box (Tone Sáng Đẳng Cấp) */}
              <div className="rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(35,29,21,0.03)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1612]">
                      Mức hoa hồng đặc quyền (%)
                    </label>
                    <span className="text-[11px] text-[#7D715E]">Áp dụng tự động cho mọi đơn hàng chốt qua KOL</span>
                  </div>
                  <div className="flex items-baseline gap-1 rounded-2xl border border-[#EEDFC6] bg-gradient-to-br from-[#FBF5EB] to-[#FAF8F5] px-4 py-1.5 shadow-xs">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#B88E4F]">{newCommissionRate}</span>
                    <span className="text-sm font-bold text-[#B88E4F]">%</span>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min="10"
                    max="45"
                    step="1"
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(Number(e.target.value))}
                    className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-[#EAE4D7] accent-[#C59B58] transition"
                  />
                  <div className="flex justify-between text-[10px] font-medium text-[#7D715E]">
                    <span>10% (Sàn tối thiểu)</span>
                    <span className="font-semibold text-[#B88E4F]">{newCommissionRate}% đã chọn</span>
                    <span>45% (Trần tối đa)</span>
                  </div>
                </div>

                {/* Quick Presets Chips */}
                <div>
                  <span className="mb-2 block text-[11px] font-semibold text-[#7D715E]">Chọn nhanh mức đề xuất:</span>
                  <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4">
                    {[
                      { rate: 18, label: '18% Bạc' },
                      { rate: 22, label: '22% Vàng' },
                      { rate: 28, label: '28% Kim Cương' },
                      { rate: 35, label: '35% VIP Max' },
                    ].map((item) => (
                      <button
                        key={item.rate}
                        type="button"
                        onClick={() => setNewCommissionRate(item.rate)}
                        className={`rounded-xl border py-1.5 px-2 text-center text-xs font-bold transition cursor-pointer ${
                          newCommissionRate === item.rate
                            ? 'border-[#C59B58] bg-[#C59B58] text-white shadow-xs'
                            : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] hover:border-[#EEDFC6] hover:bg-[#FBF5EB] hover:text-[#1A1612]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Smart Simulation Preview (Dự tính hoa hồng thực tế) */}
                <div className="flex items-center justify-between rounded-xl border border-[#EEDFC6] bg-[#FAF8F5] px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#B88E4F]" />
                    <div>
                      <span className="block text-xs font-semibold text-[#1A1612]">Hoa hồng dự tính / đơn 500.000 ₫:</span>
                      <span className="text-[10px] text-[#7D715E]">KOL nhận được khi khách hoàn tất đơn</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-[#B88E4F]">
                      {(Math.round((500000 * newCommissionRate) / 100)).toLocaleString('vi-VN')} ₫
                    </span>
                    {newCommissionRate > (selectedKol.commissionRate || 18) && (
                      <span className="block text-[10px] font-bold text-[#059669]">
                        +{((newCommissionRate - (selectedKol.commissionRate || 18)) * 5000).toLocaleString('vi-VN')} ₫
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Policy Note */}
              <div className="flex items-start gap-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 text-xs leading-relaxed text-[#7D715E]">
                <Info className="h-4 w-4 shrink-0 text-[#B88E4F] mt-0.5" />
                <span>
                  Tỷ lệ hoa hồng này áp dụng tự động cho mọi đơn hàng tiếp thị liên kết và phiên Live của KOL này ngay sau khi lưu.
                </span>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCommissionModal(false)}
                  className="rounded-xl border border-[#EAE4D7] bg-white px-4 py-2.5 text-xs font-bold text-[#7D715E] transition hover:border-[#C59B58] hover:bg-[#FAF8F5] hover:text-[#1A1612] cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={updatingCommission}
                  className="flex items-center gap-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_4px_16px_rgba(197,155,88,0.28)] transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {updatingCommission ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Lưu Tỷ Lệ Hoa Hồng</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Danh Bạ & Khám Phá Nhà Sáng Tạo (KOL/KOC) SCANMS */}
      {discoveryModal}
    </div>
  );
}
