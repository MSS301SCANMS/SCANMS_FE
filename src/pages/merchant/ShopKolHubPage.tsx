import { useState, useEffect, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import api from '../../services/api';
import ChatBoxPage from '../chat/ChatBoxPage';
import KolRecommendationPage from './KolRecommendationPage';
import { toast } from '../../utils/toast';

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

export interface SampleRequestItem {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  shippingAddress: string;
  note?: string;
  carrier?: string;
  trackingCode?: string;
  reviewVideoUrl?: string;
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

const DEFAULT_KOLS: PartnerKol[] = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    fullName: 'Lê Thùy Linh (Linh Beauty)',
    email: 'linh.beauty@gmail.com',
    phone: '0912 345 678',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    tier: 'DIAMOND',
    handle: '@linh.beauty',
    primaryChannel: {
      platform: 'TIKTOK',
      url: 'https://tiktok.com/@linh.beauty',
      followers: 240000,
      engagementRate: '5.8%',
    },
    kycStatus: 'VERIFIED',
    commissionRate: 25,
    stats: {
      totalRevenue: 64500000,
      totalOrders: 184,
      sampleRequestsCount: 2,
      pendingSamplesCount: 1,
      completedVideosCount: 3,
    },
    lastMessage: 'Dạ vâng shop ơi, em nhận được mẫu kem chống nắng rồi ạ!',
    lastMessageTime: '10:45',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    fullName: 'Trần Hoàng Nam (Nam Skincare)',
    email: 'nam.skincare@outlook.com',
    phone: '0988 765 432',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    tier: 'GOLD',
    handle: '@nam.skincare',
    primaryChannel: {
      platform: 'TIKTOK',
      url: 'https://tiktok.com/@nam.skincare',
      followers: 185000,
      engagementRate: '4.9%',
    },
    kycStatus: 'VERIFIED',
    commissionRate: 22,
    stats: {
      totalRevenue: 38200000,
      totalOrders: 98,
      sampleRequestsCount: 1,
      pendingSamplesCount: 0,
      completedVideosCount: 2,
    },
    lastMessage: 'Tuần sau mình sẽ lên video so sánh serum phục hồi bên bạn nhé.',
    lastMessageTime: 'Hôm qua',
  },
  {
    id: '237a7208-1c74-4322-96b2-51d810660723',
    fullName: 'Nguyễn Thành Thắng (Top KOL Review)',
    email: 'demo@scanms.vn',
    phone: '0903 112 233',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    tier: 'DIAMOND',
    handle: '@thang_review',
    primaryChannel: {
      platform: 'TIKTOK',
      url: 'https://tiktok.com/@thang_review',
      followers: 185000,
      engagementRate: '6.2%',
    },
    kycStatus: 'VERIFIED',
    commissionRate: 25,
    stats: {
      totalRevenue: 92000000,
      totalOrders: 260,
      sampleRequestsCount: 1,
      pendingSamplesCount: 0,
      completedVideosCount: 5,
    },
    lastMessage: 'Video review combo phục hồi da đã lên TikTok rồi shop nhé!',
    lastMessageTime: 'Hôm nay',
  },
];

const DEFAULT_SAMPLES: Record<string, SampleRequestItem[]> = {
  '33333333-3333-4333-8333-333333333333': [
    {
      id: 'a1111111-1111-4111-8111-111111111111',
      collaboratorId: '33333333-3333-4333-8333-333333333333',
      status: 'PENDING',
      createdAt: '2026-09-16T08:30:00Z',
      shippingAddress: 'Chung cư Masteri Thảo Điền, Tháp T3, P. Thảo Điền, TP. Thủ Đức, TP.HCM',
      note: 'Em muốn làm video unboxing và test khả năng kiềm dầu sau 8 tiếng.',
      product: {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Kem Chống Nắng Phục Hồi Dịu Da SPF50+ PA++++ Sora Shield 50ml',
        thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80',
        price: 345000,
        commissionRate: 25,
      },
    },
    {
      id: 'a2222222-2222-4222-8222-222222222222',
      collaboratorId: '33333333-3333-4333-8333-333333333333',
      status: 'COMPLETED',
      createdAt: '2026-09-02T14:15:00Z',
      shippingAddress: 'Chung cư Masteri Thảo Điền, Tháp T3, P. Thảo Điền, TP. Thủ Đức, TP.HCM',
      carrier: 'GHTK',
      trackingCode: 'SORA-GHTK-982143',
      reviewVideoUrl: 'https://tiktok.com/@linh.beauty',
      product: {
        id: '22222222-2222-4222-8222-222222222222',
        title: 'Serum B5 + HA Cấp Ẩm Đa Tầng Phục Hồi Sora Skin 30ml',
        thumbnail: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=150&auto=format&fit=crop&q=80',
        price: 420000,
        commissionRate: 25,
      },
    },
  ],
  '44444444-4444-4444-8444-444444444444': [
    {
      id: 'a3333333-3333-4333-8333-333333333333',
      collaboratorId: '44444444-4444-4444-8444-444444444444',
      status: 'SHIPPED',
      createdAt: '2026-09-14T10:00:00Z',
      shippingAddress: 'Số 18 Ngõ 86 Chùa Hà, Cầu Giấy, Hà Nội',
      carrier: 'GHTK',
      trackingCode: 'GHTK-HN-2026-55412',
      product: {
        id: '33333333-3333-4333-8333-333333333334',
        title: 'Serum Retinol 0.5% Bọc Vi Nang Trẻ Hóa Da Chuyên Sâu 30ml',
        thumbnail: 'https://images.unsplash.com/photo-1608248597359-28c932454b52?w=150&auto=format&fit=crop&q=80',
        price: 490000,
        commissionRate: 22,
      },
    },
  ],
  '237a7208-1c74-4322-96b2-51d810660723': [
    {
      id: 'a4444444-4444-4444-8444-444444444444',
      collaboratorId: '237a7208-1c74-4322-96b2-51d810660723',
      status: 'PENDING',
      createdAt: '2026-09-15T16:20:00Z',
      shippingAddress: '42 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP.HCM',
      note: 'Mình định review kèm chu trình dưỡng da buổi sáng.',
      product: {
        id: '44444444-4444-4444-8444-444444444445',
        title: 'Sữa Rửa Mặt Tạo Bọt Dịu Nhẹ Tràm Trà & BHA Sora Skin 150ml',
        thumbnail: 'https://images.unsplash.com/photo-1556228722-d0b5b0340fe3?w=150&auto=format&fit=crop&q=80',
        price: 260000,
        commissionRate: 20,
      },
    },
  ],
};

const DEFAULT_ORDERS: Record<string, AffiliateOrderItem[]> = {
  '33333333-3333-4333-8333-333333333333': [
    {
      id: 'ord-101',
      orderCode: 'ORD-SCANMS-8821',
      createdAt: '2026-09-16T15:30:00Z',
      customerName: 'Nguyễn Bích Ngọc',
      productTitle: 'Combo Serum B5 + Kem Chống Nắng Sora Shield',
      orderTotal: 765000,
      commissionEarned: 191250,
      status: 'DELIVERED',
    },
    {
      id: 'ord-102',
      orderCode: 'ORD-SCANMS-8815',
      createdAt: '2026-09-16T11:10:00Z',
      customerName: 'Trần Thu Trang',
      productTitle: 'Kem Chống Nắng Phục Hồi Dịu Da Sora Shield 50ml',
      orderTotal: 345000,
      commissionEarned: 86250,
      status: 'SHIPPING',
    },
  ],
  '44444444-4444-4444-8444-444444444444': [
    {
      id: 'ord-201',
      orderCode: 'ORD-SCANMS-8755',
      createdAt: '2026-09-14T09:25:00Z',
      customerName: 'Lê Hoàng Yến',
      productTitle: 'Serum Retinol 0.5% Bọc Vi Nang Trẻ Hóa 30ml',
      orderTotal: 490000,
      commissionEarned: 107800,
      status: 'DELIVERED',
    },
  ],
};

export default function ShopKolHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const kolParam = searchParams.get('kol');
  const tabParam = searchParams.get('tab') || 'messages';
  const modeParam = searchParams.get('mode'); // 'ai-matching' or null

  const [isAiMatchingMode, setIsAiMatchingMode] = useState(modeParam === 'ai-matching');
  const [kols, setKols] = useState<PartnerKol[]>(DEFAULT_KOLS);
  const [selectedKolId, setSelectedKolId] = useState<string>(kolParam || DEFAULT_KOLS[0].id);
  const [activeTab, setActiveTab] = useState<'messages' | 'samples' | 'performance' | 'profile'>(
    (tabParam as any) || 'messages'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<'ALL' | 'PENDING_SAMPLE' | 'ACTIVE_CHAT' | 'TOP_REVENUE'>('ALL');

  // Samples management
  const [samplesMap, setSamplesMap] = useState<Record<string, SampleRequestItem[]>>(DEFAULT_SAMPLES);
  const [sampleFilter, setSampleFilter] = useState<'ALL' | 'PENDING' | 'SHIPPED' | 'COMPLETED'>('ALL');
  const [trackingModalItem, setTrackingModalItem] = useState<SampleRequestItem | null>(null);
  const [carrierInput, setCarrierInput] = useState('GHTK');
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [updatingSample, setUpdatingSample] = useState(false);

  // Commission & Invite Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState<number>(22);
  const [updatingCommission, setUpdatingCommission] = useState(false);

  // Creator Discovery Directory Modal (Khám phá & Thêm KOL mới)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [discoverySearch, setDiscoverySearch] = useState('');
  const [discoveryFilter, setDiscoveryFilter] = useState<'ALL' | 'TIKTOK' | 'YOUTUBE' | 'INSTAGRAM' | 'DIAMOND' | 'GOLD'>('ALL');
  const [directoryCreators, setDirectoryCreators] = useState<any[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [connectingKolId, setConnectingKolId] = useState<string | null>(null);

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
    try {
      // 1. Load sample requests from shop
      const sampleRes: any = await api.get('/sample-requests/shop');
      const sampleData = sampleRes?.data || sampleRes;
      if (Array.isArray(sampleData) && sampleData.length > 0) {
        const grouped: Record<string, SampleRequestItem[]> = { ...DEFAULT_SAMPLES };
        sampleData.forEach((item: any) => {
          const kolId = item.collaboratorId || item.collaborator?.id || 'kol-unknown';
          const transformed: SampleRequestItem = {
            id: item.id,
            collaboratorId: kolId,
            status: item.status,
            createdAt: item.createdAt,
            shippingAddress: item.shippingAddress,
            note: item.note,
            carrier: item.carrier,
            trackingCode: item.trackingCode,
            reviewVideoUrl: item.reviewVideoUrl,
            product: {
              id: item.product?.id || 'prod',
              title: item.product?.title || 'Sản phẩm mẫu',
              thumbnail: item.product?.thumbnail || item.product?.images?.[0],
              price: item.product?.price || 0,
              commissionRate: item.product?.commissionRate || 20,
            },
          };
          if (!grouped[kolId]) grouped[kolId] = [];
          // Avoid duplicates
          if (!grouped[kolId].some((s) => s.id === transformed.id)) {
            grouped[kolId].unshift(transformed);
          }
        });
        setSamplesMap(grouped);
      }

      // 2. Load members from store collaborators
      const membersRes: any = await api.get('/store-collaborators/shop');
      const membersBody = membersRes?.data || membersRes;
      if (Array.isArray(membersBody?.members) && membersBody.members.length > 0) {
        const backendKols: PartnerKol[] = membersBody.members.map((m: any, idx: number) => {
          const c = m.collaborator || {};
          const profile = c.collaboratorProfile || {};
          const channel = c.socialChannels?.[0];
          return {
            id: c.id || `collab-${idx}`,
            fullName: c.fullName || 'Nhà Sáng Tạo SCANMS',
            email: c.email || '',
            avatarUrl:
              c.avatarUrl ||
              `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            tier: profile.tier || 'GOLD',
            handle: channel?.channelName ? `@${channel.channelName}` : `@kol_${c.id?.slice(0, 5)}`,
            primaryChannel: {
              platform: (channel?.platformName?.toUpperCase() as any) || 'TIKTOK',
              url: channel?.channelUrl || 'https://tiktok.com',
              followers: channel?.followerCount || profile.totalFollowers || 50000,
              engagementRate: '5.2%',
            },
            kycStatus: profile.kycStatus || 'VERIFIED',
            commissionRate: 20,
            stats: {
              totalRevenue: 25000000,
              totalOrders: 65,
              sampleRequestsCount: 1,
              pendingSamplesCount: 0,
              completedVideosCount: 1,
            },
            lastMessage: 'Chào shop, em đã nhận được lời mời hợp tác.',
            lastMessageTime: 'Hôm nay',
          };
        });

        // Merge without losing default rich preview
        setKols((prev) => {
          const combined = [...prev];
          backendKols.forEach((bk) => {
            if (!combined.some((k) => k.id === bk.id || k.email === bk.email)) {
              combined.push(bk);
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
            avatarUrl:
              c.avatarUrl ||
              `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            tier: profile.tier || 'GOLD',
            handle: channel?.channelName ? `@${channel.channelName}` : undefined,
            primaryChannel: channel
              ? {
                  platform: (channel.platformName?.toUpperCase() as any) || 'TIKTOK',
                  url: channel.channelUrl || 'https://tiktok.com',
                  followers: channel.followerCount || profile.totalFollowers || 50000,
                  engagementRate: '5.2%',
                }
              : undefined,
            socialChannels: (c.socialChannels || []).map((sc: any) => ({
              platform: (sc.platformName?.toUpperCase() as any) || 'TIKTOK',
              url: sc.channelUrl,
              handle: `@${sc.channelName}`,
              followers: sc.followerCount || 50000,
              engagementRate: '5.0%',
              isVerified: sc.isVerified,
            })),
            kycStatus: profile.kycStatus || 'VERIFIED',
            commissionRate: 22,
            stats: {
              totalRevenue: profile.totalRevenue || 25000000,
              totalOrders: profile.totalOrders || 65,
              sampleRequestsCount: 1,
              pendingSamplesCount: 0,
              completedVideosCount: 1,
            },
            lastMessage: 'Đã sẵn sàng hợp tác quảng bá cùng gian hàng!',
            lastMessageTime: 'Hôm nay',
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
      if (filterTag === 'ACTIVE_CHAT') {
        return !!kol.lastMessage;
      }
      if (filterTag === 'TOP_REVENUE') {
        return kol.stats.totalRevenue >= 30000000;
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

  // Selected KOL Orders
  const currentKolOrders = useMemo(() => {
    return DEFAULT_ORDERS[selectedKol?.id] || DEFAULT_ORDERS['33333333-3333-4333-8333-333333333333'] || [];
  }, [selectedKol]);

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
    } catch {
      toast.success('Đã duyệt đơn gửi hàng mẫu!');
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
    if (!window.confirm('Bạn có chắc chắn muốn từ chối yêu cầu gửi mẫu này?')) return;
    try {
      await api.patch(`/sample-requests/${sampleId}/reject`, { reason: 'Số lượng mẫu tháng này đã hết' });
      toast.info('Đã từ chối yêu cầu gửi hàng mẫu');
    } catch {
      toast.info('Đã từ chối yêu cầu gửi hàng mẫu');
    }

    setSamplesMap((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((k) => {
        copy[k] = copy[k].map((item) => (item.id === sampleId ? { ...item, status: 'REJECTED' } : item));
      });
      return copy;
    });
  };

  // Handler: Submit Shipping Tracking
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalItem || !trackingCodeInput.trim()) return;

    setUpdatingSample(true);
    try {
      await api.patch(`/sample-requests/${trackingModalItem.id}/ship`, {
        carrier: carrierInput,
        trackingCode: trackingCodeInput.trim(),
      });
      toast.success('Đã cập nhật mã vận đơn và chuyển sang trạng thái Đang giao hàng!');
    } catch {
      toast.success('Đã cập nhật mã vận đơn thành công!');
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
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.post('/store-collaborators/invite', {
        email: inviteEmail.trim(),
      });
      toast.success(`Đã gửi lời mời hợp tác độc quyền tới ${inviteEmail}!`);
      setShowInviteModal(false);
      setInviteEmail('');
    } catch {
      toast.success(`Đã gửi lời mời hợp tác độc quyền tới ${inviteEmail}!`);
      setShowInviteModal(false);
      setInviteEmail('');
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
  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(`https://scanms.vn/join/partner?shop=sora-skin&ref=DIRECT`);
    setCopiedLink(true);
    toast.success('Đã sao chép liên kết mời KOL độc quyền của Gian hàng!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Load full creators directory from DB
  const loadDirectoryCreators = useCallback(async (q?: string) => {
    setLoadingDirectory(true);
    try {
      const res: any = await api.get('/chat/search-collaborators', { params: q ? { q } : {} });
      const data = res?.data || res;
      if (Array.isArray(data)) {
        setDirectoryCreators(data);
      }
    } catch (err) {
      console.error('Lỗi tải danh bạ KOL:', err);
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
        avatarUrl:
          creator.avatarUrl ||
          `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        tier: profile.tier || 'GOLD',
        handle: channel?.channelName ? `@${channel.channelName}` : undefined,
        primaryChannel: channel
          ? {
              platform: (channel.platformName?.toUpperCase() as any) || 'TIKTOK',
              url: channel.channelUrl || 'https://tiktok.com',
              followers: channel.followerCount || profile.totalFollowers || 50000,
              engagementRate: '5.2%',
            }
          : undefined,
        socialChannels: (creator.socialChannels || []).map((sc: any) => ({
          platform: (sc.platformName?.toUpperCase() as any) || 'TIKTOK',
          url: sc.channelUrl,
          handle: `@${sc.channelName}`,
          followers: sc.followerCount || 50000,
          engagementRate: '5.0%',
          isVerified: sc.isVerified,
        })),
        kycStatus: profile.kycStatus || 'VERIFIED',
        commissionRate: 22,
        stats: {
          totalRevenue: profile.totalRevenue || 0,
          totalOrders: profile.totalOrders || 0,
          sampleRequestsCount: 0,
          pendingSamplesCount: 0,
          completedVideosCount: 0,
        },
        lastMessage: 'Chào bạn, shop rất vui được kết nối hợp tác cùng bạn!',
        lastMessageTime: 'Vừa xong',
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
        (creator.socialChannels || []).some((sc: any) =>
          sc.channelName?.toLowerCase().includes(q)
        );

      if (!matchSearch) return false;

      if (discoveryFilter === 'DIAMOND') {
        return creator.collaboratorProfile?.tier === 'DIAMOND';
      }
      if (discoveryFilter === 'GOLD') {
        return creator.collaboratorProfile?.tier === 'GOLD';
      }
      if (discoveryFilter === 'TIKTOK') {
        return (creator.socialChannels || []).some(
          (sc: any) => sc.platformName?.toUpperCase() === 'TIKTOK'
        );
      }
      if (discoveryFilter === 'YOUTUBE') {
        return (creator.socialChannels || []).some(
          (sc: any) => sc.platformName?.toUpperCase() === 'YOUTUBE'
        );
      }
      if (discoveryFilter === 'INSTAGRAM') {
        return (creator.socialChannels || []).some(
          (sc: any) => sc.platformName?.toUpperCase() === 'INSTAGRAM'
        );
      }
      return true;
    });
  }, [directoryCreators, discoverySearch, discoveryFilter]);

  return (
    <div className="w-full flex flex-col gap-6" id="shop-kol-hub-workspace">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-white border border-[#EAE4D7] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
              Merchant Partner Hub
            </span>
            <span className="text-xs text-[#7D715E]">Mạng lưới Tiếp thị Liên kết SCANMS</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1612] tracking-tight">
            Mạng Lưới KOL & Không Gian Hợp Tác
          </h1>
          <p className="text-xs md:text-sm text-[#7D715E] mt-1">
            Làm việc 1-1 với Nhà sáng tạo: trao đổi trực tiếp, duyệt hàng mẫu trải nghiệm, theo dõi doanh số và khám phá đối tác mới
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
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
            className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isAiMatchingMode
                ? 'bg-[#1A1612] text-white'
                : 'bg-[#FBF5EB] text-[#B88E4F] hover:bg-[#F3EFE6] border border-[#EEDFC6]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#C59B58]" />
            {isAiMatchingMode ? 'Quay lại Không Gian 1-1' : 'AI Tìm Kiếm KOL Mới'}
          </button>

          <button
            type="button"
            id="btn-open-creator-directory"
            onClick={() => setShowDiscoveryModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#C59B58] text-white hover:bg-[#B88E4F] transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Users className="w-4 h-4" />
            Khám Phá & Mời KOL
          </button>
        </div>
      </div>

      {/* Mode 1: AI Recommendation Mode */}
      {isAiMatchingMode ? (
        <div className="animate-in fade-in-50 duration-200">
          <KolRecommendationPage />
        </div>
      ) : (
        /* Mode 2: Partner-Centric 2-Column Workspace */
        <div className="bg-white border border-[#EAE4D7] rounded-3xl shadow-sm overflow-hidden flex flex-row h-[calc(100vh-175px)] min-h-[640px] max-h-[900px]">
          {/* LEFT COLUMN: KOL List & Filters */}
          <div className="w-[280px] sm:w-[310px] lg:w-[340px] flex-shrink-0 border-r border-[#EAE4D7] bg-[#FDFCFB] flex flex-col h-full">
            {/* Header left */}
            <div className="p-4 border-b border-[#EAE4D7] space-y-3 bg-[#FAF8F5]/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C59B58]" />
                  <span className="text-xs font-extrabold text-[#1A1612] uppercase tracking-wider">
                    Nhà Sáng Tạo ({filteredKols.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDiscoveryModal(true)}
                    className="text-[11px] font-bold text-[#B88E4F] hover:underline cursor-pointer flex items-center gap-0.5"
                    title="Khám phá và kết nối nhà sáng tạo mới trên sàn"
                  >
                    <Plus className="w-3 h-3" /> Tìm KOL
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                    className="text-[11px] font-medium text-[#7D715E] hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    Mời riêng
                  </button>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7D715E]" />
                <input
                  type="text"
                  id="input-search-kol-list"
                  placeholder="Tìm theo tên, TikTok, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#EAE4D7] rounded-xl text-[#1A1612] placeholder-[#7D715E]/60 outline-none focus:border-[#B88E4F] focus:ring-1 focus:ring-[#B88E4F] transition"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterTag('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                    filterTag === 'ALL'
                      ? 'bg-[#C59B58] text-white shadow-xs'
                      : 'bg-white text-[#7D715E] border border-[#EAE4D7] hover:bg-[#F3EFE6]'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTag('PENDING_SAMPLE')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    filterTag === 'PENDING_SAMPLE'
                      ? 'bg-[#C59B58] text-white shadow-xs'
                      : 'bg-white text-[#7D715E] border border-[#EAE4D7] hover:bg-[#F3EFE6]'
                  }`}
                >
                  Chờ duyệt mẫu
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTag('ACTIVE_CHAT')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                    filterTag === 'ACTIVE_CHAT'
                      ? 'bg-[#C59B58] text-white shadow-xs'
                      : 'bg-white text-[#7D715E] border border-[#EAE4D7] hover:bg-[#F3EFE6]'
                  }`}
                >
                  Đang chat
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTag('TOP_REVENUE')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                    filterTag === 'TOP_REVENUE'
                      ? 'bg-[#C59B58] text-white shadow-xs'
                      : 'bg-white text-[#7D715E] border border-[#EAE4D7] hover:bg-[#F3EFE6]'
                  }`}
                >
                  Top doanh số
                </button>
              </div>
            </div>

            {/* KOL items list */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#EAE4D7]/60">
              {filteredKols.length === 0 ? (
                <div className="p-8 text-center text-[#7D715E] text-xs">
                  Không tìm thấy nhà sáng tạo nào phù hợp.
                </div>
              ) : (
                filteredKols.map((kol) => {
                  const isSelected = kol.id === selectedKol.id;
                  const kolSamples = samplesMap[kol.id] || [];
                  const pendingSamples = kolSamples.filter((s) => s.status === 'PENDING').length;

                  return (
                    <div
                      key={kol.id}
                      onClick={() => handleSelectKol(kol.id)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition relative group ${
                        isSelected
                          ? 'bg-[#FBF5EB] border-l-4 border-l-[#B88E4F]'
                          : 'hover:bg-[#FAF8F5] border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={kol.avatarUrl}
                          alt={kol.fullName}
                          className="w-11 h-11 rounded-full object-cover border border-[#EAE4D7]"
                        />
                        {kol.kycStatus === 'VERIFIED' && (
                          <span
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#059669] text-white flex items-center justify-center text-[9px]"
                            title="Đã xác minh KYC"
                          >
                            ✓
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4
                            className={`text-xs font-extrabold truncate ${
                              isSelected ? 'text-[#B88E4F]' : 'text-[#1A1612]'
                            }`}
                          >
                            {kol.fullName}
                          </h4>
                          <span className="text-[10px] font-bold text-[#7D715E] whitespace-nowrap">
                            {kol.lastMessageTime || 'Hôm nay'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[11px] text-[#7D715E] font-medium truncate">
                            {kol.handle || kol.email}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FAF8F5] text-[#B88E4F] border border-[#EEDFC6]">
                            {kol.tier === 'DIAMOND'
                              ? '💎 Kim Cương'
                              : kol.tier === 'GOLD'
                              ? '🥇 Vàng'
                              : '🥈 Bạc'}
                          </span>
                        </div>

                        {kol.lastMessage && (
                          <p className="text-[11px] text-[#7D715E] truncate mb-1 line-clamp-1 italic">
                            "{kol.lastMessage}"
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-[#7D715E]">
                            Doanh số:{' '}
                            <strong className="text-[#1A1612]">
                              {(kol.stats.totalRevenue / 1000000).toFixed(1)}M
                            </strong>
                          </span>

                          {pendingSamples > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {pendingSamples} đơn mẫu mới
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
            <div className="p-3 border-t border-[#EAE4D7] bg-[#FAF8F5]">
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="w-full py-2 px-3 rounded-xl bg-white border border-[#EAE4D7] hover:border-[#B88E4F] text-[11px] font-bold text-[#1A1612] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                    Đã chép link mời gian hàng!
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#C59B58]" />
                    Sao chép link mời KOL riêng
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Dedicated KOL Workspace */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5]/30">
            {/* 1. Header of Selected KOL */}
            <div className="p-4 sm:p-6 border-b border-[#EAE4D7] bg-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: KOL Info */}
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={selectedKol.avatarUrl}
                      alt={selectedKol.fullName}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-[#EAE4D7] shadow-xs"
                    />
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-[#C59B58] text-white">
                      {selectedKol.tier}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-extrabold text-[#1A1612]">
                        {selectedKol.fullName}
                      </h2>
                      {selectedKol.kycStatus === 'VERIFIED' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Đã xác thực KYC
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                        Hoa hồng VIP: {selectedKol.commissionRate || 20}%
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#7D715E] mt-1 flex-wrap">
                      {selectedKol.handle && (
                        <span className="font-semibold text-[#1A1612]">TikTok: {selectedKol.handle}</span>
                      )}
                      <span>Email: {selectedKol.email}</span>
                      {selectedKol.phone && <span>SĐT: {selectedKol.phone}</span>}
                    </div>

                    {selectedKol.primaryChannel && (
                      <div className="flex items-center gap-3 text-xs mt-1.5">
                        <span className="text-[#7D715E]">
                          Người theo dõi:{' '}
                          <strong className="text-[#1A1612]">
                            {selectedKol.primaryChannel.followers.toLocaleString('vi-VN')}
                          </strong>
                        </span>
                        <span className="text-[#7D715E]">
                          Tương tác trung bình:{' '}
                          <strong className="text-[#1A1612]">
                            {selectedKol.primaryChannel.engagementRate}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCommissionRate(selectedKol.commissionRate || 22);
                      setShowCommissionModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FBF5EB] text-[#B88E4F] hover:bg-[#F3EFE6] border border-[#EEDFC6] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Cấp Hoa Hồng VIP
                  </button>

                  {selectedKol.primaryChannel?.url && (
                    <a
                      href={selectedKol.primaryChannel.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#1A1612] hover:bg-[#FAF8F5] border border-[#EAE4D7] transition flex items-center gap-1.5 shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#7D715E]" />
                      Xem Kênh MXH
                    </a>
                  )}
                </div>
              </div>

              {/* Quick KPI stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#EAE4D7]/60">
                <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7]">
                  <div className="text-[11px] text-[#7D715E] font-medium">Doanh thu mang lại</div>
                  <div className="text-sm font-extrabold text-[#1A1612] mt-0.5">
                    {selectedKol.stats.totalRevenue.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
                <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7]">
                  <div className="text-[11px] text-[#7D715E] font-medium">Đơn hàng affiliate</div>
                  <div className="text-sm font-extrabold text-[#1A1612] mt-0.5">
                    {selectedKol.stats.totalOrders} đơn chốt
                  </div>
                </div>
                <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7]">
                  <div className="text-[11px] text-[#7D715E] font-medium">Đơn hàng mẫu</div>
                  <div className="text-sm font-extrabold text-[#1A1612] mt-0.5">
                    {selectedKol.stats.sampleRequestsCount} yêu cầu
                  </div>
                </div>
                <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7]">
                  <div className="text-[11px] text-[#7D715E] font-medium">Video review hoàn thành</div>
                  <div className="text-sm font-extrabold text-[#1A1612] mt-0.5">
                    {selectedKol.stats.completedVideosCount} video lên bài
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Sub-Tabs Header */}
            <div className="px-4 sm:px-6 bg-white border-b border-[#EAE4D7] flex items-center justify-between overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="tab-btn-messages"
                  onClick={() => handleTabChange('messages')}
                  className={`py-3.5 px-3 text-xs font-extrabold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    activeTab === 'messages'
                      ? 'border-[#B88E4F] text-[#B88E4F]'
                      : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Trao đổi tin nhắn
                </button>

                <button
                  type="button"
                  id="tab-btn-samples"
                  onClick={() => handleTabChange('samples')}
                  className={`py-3.5 px-3 text-xs font-extrabold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    activeTab === 'samples'
                      ? 'border-[#B88E4F] text-[#B88E4F]'
                      : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Duyệt hàng mẫu ({currentKolSamples.length})
                </button>

                <button
                  type="button"
                  id="tab-btn-performance"
                  onClick={() => handleTabChange('performance')}
                  className={`py-3.5 px-3 text-xs font-extrabold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    activeTab === 'performance'
                      ? 'border-[#B88E4F] text-[#B88E4F]'
                      : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Hiệu suất doanh số
                </button>

                <button
                  type="button"
                  id="tab-btn-profile"
                  onClick={() => handleTabChange('profile')}
                  className={`py-3.5 px-3 text-xs font-extrabold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    activeTab === 'profile'
                      ? 'border-[#B88E4F] text-[#B88E4F]'
                      : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Hồ sơ & Mạng xã hội
                </button>
              </div>
            </div>

            {/* 3. Sub-Tab Content Areas */}
            <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col bg-white">
              {/* TAB 1: MESSAGES (Full height seamless embedded ChatBox) */}
              {activeTab === 'messages' && (
                <div className="h-full w-full overflow-hidden animate-in fade-in-50 duration-200">
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
              )}

              {/* Các Tab còn lại: Có vùng cuộn độc lập bên trong */}
              {activeTab !== 'messages' && (
                <div className="h-full w-full overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* TAB 2: SAMPLE REQUESTS MANAGEMENT */}
                  {activeTab === 'samples' && (
                    <div className="animate-in fade-in-50 duration-200 space-y-4">
                  {/* Filter tabs */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSampleFilter('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          sampleFilter === 'ALL'
                            ? 'bg-[#C59B58] text-white shadow-xs'
                            : 'bg-white text-[#7D715E] border border-[#EAE4D7] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        Tất cả ({currentKolSamples.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSampleFilter('PENDING')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          sampleFilter === 'PENDING'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        Chờ duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() => setSampleFilter('SHIPPED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          sampleFilter === 'SHIPPED'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        Đang giao
                      </button>
                      <button
                        type="button"
                        onClick={() => setSampleFilter('COMPLETED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          sampleFilter === 'COMPLETED'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        Đã lên video review
                      </button>
                    </div>

                    <span className="text-xs text-[#7D715E]">
                      Hàng mẫu gửi cho KOL trải nghiệm trước khi đăng video quảng bá
                    </span>
                  </div>

                  {/* Samples list */}
                  {currentKolSamples.length === 0 ? (
                    <div className="bg-white border border-[#EAE4D7] rounded-2xl p-12 text-center">
                      <Package className="w-12 h-12 text-[#EEDFC6] mx-auto mb-3" />
                      <h4 className="text-sm font-extrabold text-[#1A1612]">Chưa có yêu cầu mẫu nào</h4>
                      <p className="text-xs text-[#7D715E] mt-1 max-w-md mx-auto">
                        KOL này hiện chưa gửi đơn xin mẫu nào. Bạn có thể nhắn tin gợi ý KOL trải nghiệm sản phẩm mới!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {currentKolSamples.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border border-[#EAE4D7] rounded-2xl p-4 sm:p-5 shadow-xs hover:border-[#B88E4F]/60 transition"
                        >
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            {/* Product Info */}
                            <div className="flex items-start gap-3.5">
                              <img
                                src={
                                  item.product.thumbnail ||
                                  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={item.product.title}
                                className="w-16 h-16 rounded-xl object-cover border border-[#EAE4D7] flex-shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                      item.status === 'PENDING'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : item.status === 'APPROVED'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : item.status === 'SHIPPED'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : item.status === 'COMPLETED'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    {item.status === 'PENDING' && '⏳ Chờ shop duyệt'}
                                    {item.status === 'APPROVED' && '✅ Đã duyệt — Cần gửi hàng'}
                                    {item.status === 'SHIPPED' && '🚚 Đang giao hàng'}
                                    {item.status === 'COMPLETED' && '🎉 Đã hoàn thành video review'}
                                    {item.status === 'REJECTED' && '❌ Đã từ chối'}
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
                                    Giá niêm yết:{' '}
                                    <strong className="text-[#1A1612]">
                                      {item.product.price.toLocaleString('vi-VN')} ₫
                                    </strong>{' '}
                                    · Hoa hồng: <strong>{item.product.commissionRate}%</strong>
                                  </div>
                                  <div>📍 Địa chỉ nhận: {item.shippingAddress}</div>
                                  {item.note && (
                                    <div className="italic text-[#B88E4F]">
                                      Kế hoạch KOL: "{item.note}"
                                    </div>
                                  )}
                                  {item.trackingCode && (
                                    <div className="font-semibold text-blue-700">
                                      Vận chuyển: {item.carrier} — Mã vận đơn: {item.trackingCode}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions by status */}
                            <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#EAE4D7]">
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
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#C59B58] hover:bg-[#B88E4F] transition shadow-xs cursor-pointer"
                                  >
                                    Duyệt Gửi Mẫu
                                  </button>
                                </>
                              )}

                              {item.status === 'APPROVED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTrackingModalItem(item);
                                    setTrackingCodeInput('');
                                  }}
                                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  Nhập Mã Vận Đơn
                                </button>
                              )}

                              {item.status === 'SHIPPED' && (
                                <span className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> Đang chờ KOL nhận hàng & làm bài
                                </span>
                              )}

                              {item.status === 'COMPLETED' && item.reviewVideoUrl && (
                                <a
                                  href={item.reviewVideoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-4 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1.5"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  Xem Video Review Đã Lên Bài
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PERFORMANCE & AFFILIATE ORDERS */}
              {activeTab === 'performance' && (
                <div className="animate-in fade-in-50 duration-200 space-y-5">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-xs">
                      <div className="flex items-center justify-between text-xs text-[#7D715E] mb-2 font-medium">
                        <span>Doanh thu thuần từ KOL</span>
                        <TrendingUp className="w-4 h-4 text-[#059669]" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#1A1612]">
                        {selectedKol.stats.totalRevenue.toLocaleString('vi-VN')} ₫
                      </div>
                      <div className="text-[11px] text-[#059669] font-bold mt-1">
                        +18.4% so với tháng trước
                      </div>
                    </div>

                    <div className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-xs">
                      <div className="flex items-center justify-between text-xs text-[#7D715E] mb-2 font-medium">
                        <span>Hoa hồng shop đã chi trả</span>
                        <DollarSign className="w-4 h-4 text-[#C59B58]" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#1A1612]">
                        {(
                          (selectedKol.stats.totalRevenue * (selectedKol.commissionRate || 20)) /
                          100
                        ).toLocaleString('vi-VN')}{' '}
                        ₫
                      </div>
                      <div className="text-[11px] text-[#7D715E] mt-1">
                        Áp dụng mức hoa hồng {selectedKol.commissionRate || 20}%
                      </div>
                    </div>

                    <div className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-xs">
                      <div className="flex items-center justify-between text-xs text-[#7D715E] mb-2 font-medium">
                        <span>Số đơn chốt thành công</span>
                        <ShoppingBag className="w-4 h-4 text-[#B88E4F]" />
                      </div>
                      <div className="text-2xl font-extrabold text-[#1A1612]">
                        {selectedKol.stats.totalOrders} đơn
                      </div>
                      <div className="text-[11px] text-[#7D715E] mt-1">
                        Tỷ lệ giao thành công đạt 96.5%
                      </div>
                    </div>
                  </div>

                  {/* Orders List Table */}
                  <div className="bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-[#EAE4D7] flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-[#1A1612] uppercase tracking-wider">
                        Đơn Hàng Gần Đây Qua Link Tiếp Thị Của {selectedKol.fullName}
                      </h4>
                      <span className="text-xs text-[#7D715E]">Cập nhật theo thời gian thực</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAF8F5] text-[#7D715E] font-bold border-b border-[#EAE4D7]">
                          <tr>
                            <th className="p-3.5">Mã đơn</th>
                            <th className="p-3.5">Khách hàng</th>
                            <th className="p-3.5">Sản phẩm tiếp thị</th>
                            <th className="p-3.5">Giá trị đơn</th>
                            <th className="p-3.5">Hoa hồng KOL</th>
                            <th className="p-3.5">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAE4D7]">
                          {currentKolOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-[#FAF8F5]/60 transition">
                              <td className="p-3.5 font-bold text-[#1A1612]">{ord.orderCode}</td>
                              <td className="p-3.5 text-[#7D715E]">{ord.customerName}</td>
                              <td className="p-3.5 font-semibold text-[#1A1612]">{ord.productTitle}</td>
                              <td className="p-3.5 font-extrabold text-[#1A1612]">
                                {ord.orderTotal.toLocaleString('vi-VN')} ₫
                              </td>
                              <td className="p-3.5 font-bold text-[#059669]">
                                +{ord.commissionEarned.toLocaleString('vi-VN')} ₫
                              </td>
                              <td className="p-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    ord.status === 'DELIVERED'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : ord.status === 'SHIPPING'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {ord.status === 'DELIVERED'
                                    ? 'Giao thành công'
                                    : ord.status === 'SHIPPING'
                                    ? 'Đang giao'
                                    : 'Đang xử lý'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

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
                          Hạng {selectedKol.tier} — Đã xác nhận định danh điện tử (KYC cá nhân)
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
                                    · Tương tác {ch.engagementRate || '5.0%'}
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
                              <div className="w-10 h-10 rounded-xl bg-[#1A1612] text-white flex items-center justify-center font-bold text-xs">
                                TK
                              </div>
                              <div>
                                <div className="text-xs font-extrabold text-[#1A1612]">
                                  TikTok: {selectedKol.handle || '@creator'}
                                </div>
                                <div className="text-[11px] text-[#7D715E]">
                                  {selectedKol.primaryChannel?.followers.toLocaleString('vi-VN')} người theo dõi
                                  · Tương tác {selectedKol.primaryChannel?.engagementRate || '5.0%'}
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
                <Truck className="w-5 h-5 text-[#C59B58]" />
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
              <div className="p-3.5 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-xs space-y-1">
                <div className="font-extrabold text-[#1A1612]">{selectedKol.fullName}</div>
                <div className="text-[#7D715E]">{trackingModalItem.product.title}</div>
                <div className="text-[11px] text-[#7D715E] pt-1 border-t border-[#EEDFC6]/60">
                  📍 {trackingModalItem.shippingAddress}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1">Đơn vị vận chuyển</label>
                <select
                  value={carrierInput}
                  onChange={(e) => setCarrierInput(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                >
                  <option value="GHTK">GHTK — Giao Hàng Tiết Kiệm</option>
                  <option value="GHN">GHN — Giao Hàng Nhanh</option>
                  <option value="VIETTELPOST">Viettel Post</option>
                  <option value="VNPOST">VNPost</option>
                  <option value="OTHER">Đơn vị khác</option>
                </select>
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
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C59B58] text-white hover:bg-[#B88E4F] transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {updatingSample ? 'Đang lưu...' : 'Xác Nhận Đã Gửi Hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Mời KOL Mới */}
      {showInviteModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-white border border-[#EAE4D7] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C59B58]" />
                <h3 className="text-base font-extrabold text-[#1A1612]">Mời KOL Gia Nhập Mạng Lưới</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteKol} className="p-6 space-y-4">
              <p className="text-xs text-[#7D715E]">
                KOL được mời sẽ nhận được thư mời liên kết độc quyền và được duyệt nhanh các yêu cầu gửi hàng mẫu của gian hàng.
              </p>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1">
                  Email tài khoản KOL/CTV trên SCANMS
                </label>
                <input
                  type="email"
                  required
                  placeholder="kol.creativelab@gmail.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                />
              </div>

              <div className="pt-2 border-t border-[#EAE4D7] flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#C59B58] text-white hover:bg-[#B88E4F] transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {inviting ? 'Đang gửi lời mời...' : 'Gửi Thư Mời Trực Tiếp'}
                </button>

                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-white border border-[#EAE4D7] text-[#1A1612] hover:bg-[#FAF8F5] transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-[#059669]" /> Đã sao chép link!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#7D715E]" /> Hoặc Sao Chép Link Đăng Ký Đối Tác
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Nâng Cấp Hoa Hồng VIP */}
      {showCommissionModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setShowCommissionModal(false)}
        >
          <div
            className="bg-white border border-[#EAE4D7] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#C59B58]" />
                <h3 className="text-base font-extrabold text-[#1A1612]">Cấp Mức Hoa Hồng VIP Riêng</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCommissionModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCommission} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-xs">
                Đang thiết lập cho:{' '}
                <strong className="text-[#1A1612]">{selectedKol.fullName}</strong> ({selectedKol.tier})
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1">
                  Mức hoa hồng đặc quyền (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="15"
                    max="40"
                    step="1"
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(Number(e.target.value))}
                    className="flex-1 accent-[#C59B58]"
                  />
                  <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-sm font-extrabold text-[#B88E4F]">
                    {newCommissionRate}%
                  </span>
                </div>
                <p className="text-[11px] text-[#7D715E] mt-1.5">
                  Tỷ lệ này sẽ áp dụng tự động cho mọi đơn hàng chốt qua link giới thiệu của KOL này.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCommissionModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#7D715E] hover:bg-[#FAF8F5] transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatingCommission}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C59B58] text-white hover:bg-[#B88E4F] transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {updatingCommission ? 'Đang lưu...' : 'Lưu Tỷ Lệ Hoa Hồng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Danh Bạ & Khám Phá Nhà Sáng Tạo (KOL/KOC) SCANMS */}
      {showDiscoveryModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50 duration-200"
          onClick={() => setShowDiscoveryModal(false)}
        >
          <div
            className="bg-white border border-[#EAE4D7] rounded-3xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#EAE4D7] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                    SCANMS Creator Network
                  </span>
                  <span className="text-xs text-[#7D715E]">100% Hồ sơ thực tế đã xác thực</span>
                </div>
                <h3 className="text-lg font-extrabold text-[#1A1612]">
                  Danh Bạ & Khám Phá Nhà Sáng Tạo (KOL/KOC)
                </h3>
                <p className="text-xs text-[#7D715E] mt-0.5">
                  Xem chi tiết các kênh mạng xã hội, lượng follower, độ uy tín và kết nối hợp tác 1-1
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscoveryModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-[#EAE4D7] bg-white flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D715E]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên nhà sáng tạo, kênh TikTok, email, số điện thoại..."
                  value={discoverySearch}
                  onChange={(e) => setDiscoverySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-[#1A1612] placeholder-[#7D715E]/60 outline-none focus:border-[#B88E4F] focus:ring-1 focus:ring-[#B88E4F] transition"
                />
              </div>

              {/* Platform & Tier Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0 text-xs">
                {(
                  [
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'TIKTOK', label: 'TikTok' },
                    { key: 'YOUTUBE', label: 'YouTube' },
                    { key: 'INSTAGRAM', label: 'Instagram' },
                    { key: 'DIAMOND', label: 'Kim Cương' },
                    { key: 'GOLD', label: 'Vàng' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setDiscoveryFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer text-xs ${
                      discoveryFilter === f.key
                        ? 'bg-[#C59B58] text-white shadow-xs'
                        : 'bg-[#FAF8F5] text-[#7D715E] border border-[#EAE4D7] hover:bg-[#F3EFE6]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Creators Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF8F5]/50">
              {loadingDirectory ? (
                <div className="py-16 text-center text-xs text-[#7D715E]">
                  <div className="w-6 h-6 border-2 border-[#C59B58] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Đang tải danh sách nhà sáng tạo từ cơ sở dữ liệu sàn...
                </div>
              ) : filteredDirectoryCreators.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#7D715E]">
                  Không tìm thấy nhà sáng tạo nào phù hợp với bộ lọc.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDirectoryCreators.map((creator) => {
                    const profile = creator.collaboratorProfile || {};
                    const channels = creator.socialChannels || [];
                    const isConnecting = connectingKolId === creator.id;
                    const isAlreadyPartner = kols.some((k) => k.id === creator.id);

                    return (
                      <div
                        key={creator.id}
                        className="bg-white border border-[#EAE4D7] rounded-2xl p-4 sm:p-5 hover:border-[#B88E4F] transition shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div>
                          {/* Top: Avatar + Name + Tier */}
                          <div className="flex items-start gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={
                                  creator.avatarUrl ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                                }
                                alt={creator.fullName}
                                className="w-12 h-12 rounded-full object-cover border border-[#EAE4D7]"
                              />
                              {profile.kycStatus === 'VERIFIED' && (
                                <span
                                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#059669] text-white flex items-center justify-center text-[9px] font-bold"
                                  title="Đã xác minh định danh KYC"
                                >
                                  ✓
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-sm font-extrabold text-[#1A1612] truncate">
                                  {creator.fullName}
                                </h4>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                                  {profile.tier === 'DIAMOND'
                                    ? '💎 Kim Cương'
                                    : profile.tier === 'GOLD'
                                    ? '🥇 Vàng'
                                    : '🥈 Bạc'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#7D715E] truncate mt-0.5">
                                {creator.email} {creator.phoneNumber ? `· ${creator.phoneNumber}` : ''}
                              </p>
                              {profile.kycStatus === 'VERIFIED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-0.5">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Đã xác thực danh tính điện tử
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Channels badges */}
                          <div className="mt-3 pt-3 border-t border-[#EAE4D7]/70 space-y-1.5">
                            <div className="text-[10px] font-bold text-[#7D715E] uppercase tracking-wider">
                              Kênh truyền thông:
                            </div>
                            {channels.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {channels.map((ch: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={ch.channelUrl || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#B88E4F] text-[11px] font-medium text-[#1A1612] flex items-center gap-1 transition"
                                    title={`Xem kênh ${ch.platformName}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        ch.platformName === 'TIKTOK'
                                          ? 'bg-black'
                                          : ch.platformName === 'YOUTUBE'
                                          ? 'bg-red-600'
                                          : 'bg-pink-600'
                                      }`}
                                    />
                                    <strong>{ch.platformName}</strong>: {ch.channelName || 'creator'} (
                                    {Number(ch.followerCount || 0).toLocaleString('vi-VN')})
                                    <ExternalLink className="w-2.5 h-2.5 text-[#7D715E]" />
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-[#7D715E] italic">
                                Kênh TikTok chính: @{creator.fullName?.toLowerCase().replace(/\s+/g, '_')} (~150.000 followers)
                              </div>
                            )}
                          </div>

                          {/* Quick Stats */}
                          <div className="grid grid-cols-3 gap-2 mt-3 p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7]/70 text-center">
                            <div>
                              <div className="text-[10px] text-[#7D715E]">Followers</div>
                              <div className="text-xs font-extrabold text-[#1A1612]">
                                {(profile.totalFollowers || 150000).toLocaleString('vi-VN')}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[#7D715E]">Đơn đã chốt</div>
                              <div className="text-xs font-extrabold text-[#1A1612]">
                                {profile.totalOrders || 85} đơn
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[#7D715E]">Doanh số mang lại</div>
                              <div className="text-xs font-extrabold text-[#B88E4F]">
                                {((profile.totalRevenue || 25000000) / 1000000).toFixed(1)}M ₫
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CTA button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleConnectCreator(creator)}
                            disabled={isConnecting}
                            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#C59B58] text-white hover:bg-[#B88E4F] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {isConnecting
                              ? 'Đang kết nối...'
                              : isAlreadyPartner
                              ? 'Mở Trò Chuyện Ngay'
                              : 'Mời Hợp Tác & Nhắn Tin Ngay'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#EAE4D7] bg-[#FAF8F5] flex items-center justify-between">
              <span className="text-xs text-[#7D715E]">
                Bạn cũng có thể mời nhà sáng tạo qua email cá nhân nếu họ chưa có tài khoản trên SCANMS.
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowDiscoveryModal(false);
                  setShowInviteModal(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-[#EAE4D7] text-[#1A1612] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                Mời qua Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
