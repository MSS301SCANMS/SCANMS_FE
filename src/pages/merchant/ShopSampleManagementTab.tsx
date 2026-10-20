import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Package,
  Clock,
  Video,
  AlertTriangle,
  PackageCheck,
  Award,
  Handshake,
  Search,
  Truck,
  CheckCircle2,
  Check,
  X,
  Copy,
  BellRing,
  MessageSquare,
  RefreshCw,
  Plus,
} from 'lucide-react';
import api from '../../services/api';
import SampleDeadlineExtension from '../../components/affiliate/SampleDeadlineExtension';
import SampleViolationAction from '../../components/affiliate/SampleViolationAction';
import { SampleGhnEnvironmentPicker, SampleSandboxWaybills, SampleSandboxStatus, isSandboxShipment, sampleDisplayStatus } from '../../components/shipping/SampleGhnEnvironmentPicker';
import { toast } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';

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
  shippingCharges?: Array<{ amount: string | number | null; trackingNumber: string; status: string; payer: string; codAmount: number; environment?: string }>;
  reviewVideoUrl?: string;
  videoTitle?: string;
  videoSubmittedAt?: string;
  sampleRequestsBlockedAt?: string | null;
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

export interface CreatorLeaderboardItem {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  kycStatus?: string;
  handle?: string;
  platform?: string;
  followers?: number;
  gmv: number;
  ordersCount: number;
  commissionRate: number;
}

const getKolAvatarSrc = (src?: string, name?: string, id?: string) => {
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

  const fallbacks = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80',
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
  className = 'w-9 h-9',
}: {
  src?: string;
  name: string;
  id?: string;
  className?: string;
}) {
  const resolvedSrc = getKolAvatarSrc(src, name, id);

  return (
    <span className={`${className} relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-[#F3EFE6] text-[#B88E4F] font-bold border border-[#EEDFC6] shadow-2xs shrink-0`}>
      <img
        src={resolvedSrc}
        alt={name}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/assets/kol-avatar-thang.jpg';
        }}
      />
    </span>
  );
}

export default function ShopSampleManagementTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [samples, setSamples] = useState<SampleRequestItem[]>([]);
  const sampleLoadSequence = useRef(0);
  const [storeTab, setStoreTab] = useState<'SAMPLES_QUEUE' | 'LEADERBOARD' | 'DEALS'>('SAMPLES_QUEUE');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SHIPPED' | 'RECEIVED' | 'VIDEO_SUBMITTED' | 'OVERDUE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [remindedSamples, setRemindedSamples] = useState<Record<string, boolean>>({});
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);

  // Tracking modal state
  const [trackingModalItem, setTrackingModalItem] = useState<SampleRequestItem | null>(null);
  const [sampleShippingError, setSampleShippingError] = useState('');
  const [sampleGhnEnvironment, setSampleGhnEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  useEffect(() => { setSampleShippingError(''); }, [trackingModalItem?.id]);
  const [carrierInput, setCarrierInput] = useState('GHN');
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);

  // Load data from Backend
  const loadData = useCallback(async () => {
    const sequence = ++sampleLoadSequence.current;
    setLoading(true);
    try {
      const res: any = await api.get('/sample-requests/shop', { headers: { 'x-skip-cache': 'true' } });
      const data = res?.data || res;
      if (sequence !== sampleLoadSequence.current) return;
      if (!Array.isArray(data)) throw new Error('Không đọc được danh sách hàng mẫu.');
      if (Array.isArray(data)) {
        const transformed: SampleRequestItem[] = data.map((item: any) => {
          const kolId = item.collaboratorId || item.collaborator?.id || 'kol-unknown';
          return {
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
            shippedAt: item.shippedAt,
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
        });
        setSamples(transformed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err: any) {
      if (sequence !== sampleLoadSequence.current) return;
      setSamples([]);
      setTrackingModalItem(null);
      toast.error('Chưa tải được thông tin nhận hàng mới nhất. Vui lòng làm mới danh sách mẫu.');
    } finally {
      if (sequence === sampleLoadSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const refresh = () => { if (!document.hidden) void loadData(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadData]);

  useEffect(() => {
    setTrackingModalItem(current => current ? samples.find(item => item.id === current.id) || null : null);
  }, [samples]);

  // Aggregate Stats
  const storeStats = useMemo(() => {
    let pending = 0;
    let readyToShip = 0;
    let videoPending = 0;
    let overdue = 0;

    const now = Date.now();
    samples.forEach((s) => {
      if (s.status === 'PENDING') pending++;
      if (sampleDisplayStatus(s) === 'APPROVED') readyToShip++;
      if (s.status === 'RECEIVED') {
        videoPending++;
        if (s.deadlineAt && new Date(s.deadlineAt).getTime() <= now) overdue++;
      }
      if (s.status === 'OVERDUE') overdue++;
    });

    return {
      pending,
      readyToShip,
      videoPending,
      overdue,
      total: samples.length,
    };
  }, [samples]);

  // Filtered samples
  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      if (statusFilter === 'PENDING' && s.status !== 'PENDING') return false;
      if (statusFilter === 'APPROVED' && sampleDisplayStatus(s) !== 'APPROVED') return false;
      if (statusFilter === 'SHIPPED' && sampleDisplayStatus(s) !== 'SHIPPED') return false;
      if (statusFilter === 'RECEIVED' && s.status !== 'RECEIVED') return false;
      if (statusFilter === 'VIDEO_SUBMITTED' && s.status !== 'VIDEO_SUBMITTED') return false;
      if (statusFilter === 'COMPLETED' && s.status !== 'COMPLETED') return false;
      if (statusFilter === 'OVERDUE') {
        const pastDeadline = s.status === 'RECEIVED' && Boolean(s.deadlineAt && new Date(s.deadlineAt).getTime() <= Date.now());
        if (s.status !== 'OVERDUE' && !pastDeadline) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchCreator = (s.collaboratorInfo?.fullName || '').toLowerCase().includes(q);
        const matchProduct = s.product.title.toLowerCase().includes(q);
        const matchTracking = s.trackingCode?.toLowerCase().includes(q) || false;
        if (!matchCreator && !matchProduct && !matchTracking) return false;
      }

      return true;
    });
  }, [samples, statusFilter, searchQuery]);

  // Leaderboard data derived from samples & collaborators
  const leaderboardCreators = useMemo(() => {
    const map = new Map<string, CreatorLeaderboardItem>();
    samples.forEach((s) => {
      const id = s.collaboratorId;
      if (!map.has(id)) {
        map.set(id, {
          id,
          fullName: s.collaboratorInfo?.fullName || 'Nhà Sáng Tạo SCANMS',
          email: s.collaboratorInfo?.email || '',
          avatarUrl: s.collaboratorInfo?.avatarUrl,
          kycStatus: s.collaboratorMetrics?.kycStatus || 'VERIFIED',
          handle: s.socialChannel?.channelName ? `@${s.socialChannel.channelName}` : undefined,
          platform: s.socialChannel?.platformName || 'TIKTOK',
          followers: s.socialChannel?.followerCount || s.collaboratorMetrics?.totalFollowers || 25000,
          gmv: 0,
          ordersCount: s.collaboratorMetrics?.totalOrdersReferred || 0,
          commissionRate: 10,
        });
      }
    });

    // Populate mock realistic GMV if zero for demo
    const arr = Array.from(map.values());
    return arr.map((creator, idx) => ({
      ...creator,
      gmv: creator.gmv || (idx === 0 ? 48500000 : idx === 1 ? 32100000 : idx === 2 ? 19800000 : 7200000),
      ordersCount: creator.ordersCount || (idx === 0 ? 112 : idx === 1 ? 74 : idx === 2 ? 46 : 18),
      commissionRate: idx === 0 ? 15 : idx === 1 ? 12 : 10,
    })).sort((a, b) => b.gmv - a.gmv);
  }, [samples]);

  // Handlers
  const handleApproveSample = async (sampleId: string) => {
    try {
      await api.patch(`/sample-requests/${sampleId}/approve`, {});
      toast.success('Đã duyệt đơn gửi hàng mẫu cho KOL!');
      setSamples((prev) => prev.map((s) => (s.id === sampleId ? { ...s, status: 'APPROVED' } : s)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể duyệt yêu cầu mẫu.');
    }
  };

  const handleRejectSample = async (sampleId: string) => {
    const rejectedReason = window.prompt('Nhập lý do từ chối yêu cầu mẫu:');
    if (!rejectedReason?.trim()) return;
    try {
      await api.patch(`/sample-requests/${sampleId}/reject`, { rejectedReason: rejectedReason.trim() });
      toast.info('Đã từ chối yêu cầu gửi hàng mẫu');
      setSamples((prev) => prev.map((s) => (s.id === sampleId ? { ...s, status: 'REJECTED' } : s)));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể từ chối yêu cầu mẫu.');
    }
  };

  const handleRemindVideo = (sampleId: string) => {
    setRemindedSamples((prev) => ({ ...prev, [sampleId]: true }));
    toast.success('Đã gửi thông báo nhắc KOL đăng tải video review theo cam kết 14 ngày!');
  };

  const handleCopyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    setCopiedTracking(tracking);
    toast.success('Đã sao chép mã vận đơn!');
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const handleReviewSampleVideo = async (sample: SampleRequestItem, status: 'APPROVED' | 'REJECTED') => {
    const asset = sample.videoAssets?.find((item) => item.status === 'PENDING');
    const rejectionReason = status === 'REJECTED'
      ? window.prompt('Nhập lý do cần chỉnh sửa video:')?.trim()
      : undefined;
    if (status === 'REJECTED' && !rejectionReason) return;

    try {
      if (asset?.id) {
        await api.patch(`/media/${asset.id}/review`, { status, rejectionReason });
      }
      toast.success(status === 'APPROVED' ? 'Đã nghiệm thu video và hoàn tất yêu cầu mẫu.' : 'Đã gửi yêu cầu chỉnh sửa video cho KOL.');
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật kết quả kiểm duyệt video.');
    }
  };

  const handleSubmitTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingModalItem || (carrierInput !== 'GHN' && !trackingCodeInput.trim())) return;
    setIsSubmittingTracking(true);
    setSampleShippingError('');
    let reusedSandbox = false;
    try {
      if (carrierInput === 'GHN') {
        const response: any = await api.post(`/shipping/ghn/create-sample/${trackingModalItem.id}`, { environment: sampleGhnEnvironment });
        const result = response?.data?.data || response?.data || response;
        reusedSandbox = Boolean(result.reused);
      } else {
        await api.patch(`/sample-requests/${trackingModalItem.id}/ship`, {
          trackingNumber: trackingCodeInput.trim(), carrier: carrierInput,
        });
      }
      toast.success(carrierInput === 'GHN' ? sampleGhnEnvironment === 'TEST' ? reusedSandbox ? 'Dùng lại mã sandbox hiện có, không tạo thêm vận đơn.' : 'Đã tạo mã sandbox. Giữ nguyên đơn thật và hạn video.' : 'Đã phát hành vận đơn mẫu. Shop chịu phí ship, KOL nhận hàng với COD 0 đ.' : 'Đã lưu mã vận đơn hàng mẫu.');
      await loadData();
      setTrackingModalItem(null);
    } catch (err: any) {
      setSampleShippingError(String(err?.response?.data?.message || err?.message || 'Không thể tạo vận đơn hàng mẫu.'));
    } finally {
      setIsSubmittingTracking(false);
    }
  };

  const openTrackingModal = (s: SampleRequestItem) => {
    setSampleGhnEnvironment(s.status === 'SHIPPED' || isSandboxShipment(s) ? 'TEST' : 'LIVE');
    setTrackingModalItem(s);
    setCarrierInput('GHN');
    setTrackingCodeInput(s.trackingCode || '');
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EEDFC6] bg-white p-4">
        <div>
          <div className="font-bold text-[#1A1612]">Phí vận chuyển hàng mẫu · Shop chi trả 100%</div>
          <p className="mt-1 text-xs text-[#7D715E]">KOL nhận mẫu với COD 0 đ. Cước bên dưới do GHN báo khi tạo vận đơn, chưa phải xác nhận thanh toán.</p>
        </div>
        <div className="text-right">
          <div className="font-bold text-[#B88E4F]">{samples.flatMap(s => s.shippingCharges || []).reduce((sum, c) => sum + (c.environment === 'TEST' || c.amount === null ? 0 : Number(c.amount)), 0).toLocaleString('vi-VN')} đ đã ghi nhận</div>
          <div className="mt-1 text-xs text-[#7D715E]">{samples.flatMap(s => s.shippingCharges || []).filter(c => c.environment !== 'TEST' && c.amount === null).length} vận đơn chưa xác nhận cước</div>
        </div>
      </div>
      {/* 4 THẺ SỐ LIỆU NHANH (STAT BADGES) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Stat 1: Chờ duyệt */}
        <div
          onClick={() => {
            setStoreTab('SAMPLES_QUEUE');
            setStatusFilter('PENDING');
          }}
          className={`p-4 rounded-2xl bg-white border transition shadow-2xs cursor-pointer text-left group ${
            storeTab === 'SAMPLES_QUEUE' && statusFilter === 'PENDING'
              ? 'border-[#C59B58] ring-2 ring-[#C59B58]/20 bg-[#FBF5EB]/50'
              : 'border-[#EAE4D7] hover:border-[#C59B58]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7D715E]">Mẫu chờ duyệt</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center group-hover:scale-105 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1A1612]">{storeStats.pending}</div>
          <div className="text-[11px] text-[#7D715E] mt-1">Cần shop duyệt cấp mẫu</div>
        </div>

        {/* Stat 2: Chờ gửi (Đóng gói) */}
        <div
          onClick={() => {
            setStoreTab('SAMPLES_QUEUE');
            setStatusFilter('APPROVED');
          }}
          className={`p-4 rounded-2xl bg-white border transition shadow-2xs cursor-pointer text-left group ${
            storeTab === 'SAMPLES_QUEUE' && statusFilter === 'APPROVED'
              ? 'border-[#C59B58] ring-2 ring-[#C59B58]/20 bg-[#FBF5EB]/50'
              : 'border-[#EAE4D7] hover:border-[#C59B58]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7D715E]">Mẫu chờ gửi (Đóng gói)</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center group-hover:scale-105 transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1A1612]">{storeStats.readyToShip}</div>
          <div className="text-[11px] text-[#7D715E] mt-1">Chờ tạo mã vận đơn GHN</div>
        </div>

        {/* Stat 3: Video chờ nghiệm thu */}
        <div
          onClick={() => {
            setStoreTab('SAMPLES_QUEUE');
            setStatusFilter('VIDEO_SUBMITTED');
          }}
          className={`p-4 rounded-2xl bg-white border transition shadow-2xs cursor-pointer text-left group ${
            storeTab === 'SAMPLES_QUEUE' && statusFilter === 'VIDEO_SUBMITTED'
              ? 'border-[#C59B58] ring-2 ring-[#C59B58]/20 bg-[#FBF5EB]/50'
              : 'border-[#EAE4D7] hover:border-[#C59B58]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7D715E]">Video chờ nghiệm thu</span>
            <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center group-hover:scale-105 transition">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1A1612]">{storeStats.videoPending}</div>
          <div className="text-[11px] text-[#7D715E] mt-1">KOL đã gửi video review</div>
        </div>

        {/* Stat 4: Quá hạn 14 ngày */}
        <div
          onClick={() => {
            setStoreTab('SAMPLES_QUEUE');
            setStatusFilter('OVERDUE');
          }}
          className={`p-4 rounded-2xl bg-white border transition shadow-2xs cursor-pointer text-left group ${
            storeTab === 'SAMPLES_QUEUE' && statusFilter === 'OVERDUE'
              ? 'border-[#DC2626] ring-2 ring-[#DC2626]/20 bg-rose-50/50'
              : 'border-rose-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#DC2626]">Quá hạn 14 ngày</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-[#DC2626] flex items-center justify-center group-hover:scale-105 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#DC2626]">{storeStats.overdue}</div>
          <div className="text-[11px] text-rose-600 mt-1">Đã khóa xin mẫu toàn sàn</div>
        </div>
      </div>

      {/* STORE TABS CONTAINER */}
      <div className="bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden shadow-2xs">
        {/* Tab Header Navigation */}
        <div className="flex items-center justify-between border-b border-[#EAE4D7] px-4 pt-3 bg-[#FAF8F5]">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setStoreTab('SAMPLES_QUEUE')}
              className={`pb-3 px-3.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
                storeTab === 'SAMPLES_QUEUE'
                  ? 'border-[#C59B58] text-[#1A1612]'
                  : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
              }`}
            >
              <PackageCheck className="w-4 h-4 text-[#B88E4F]" />
              <span>Hàng Đợi Hàng Mẫu Toàn Shop</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#F3EFE6] text-[#7D715E] text-[10px] font-bold">
                {samples.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStoreTab('LEADERBOARD')}
              className={`pb-3 px-3.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
                storeTab === 'LEADERBOARD'
                  ? 'border-[#C59B58] text-[#1A1612]'
                  : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
              }`}
            >
              <Award className="w-4 h-4 text-[#B88E4F]" />
              <span>Bảng Xếp Hạng KOL Tiếp Thị</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#F3EFE6] text-[#7D715E] text-[10px] font-bold">
                {leaderboardCreators.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStoreTab('DEALS')}
              className={`pb-3 px-3.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
                storeTab === 'DEALS'
                  ? 'border-[#C59B58] text-[#1A1612]'
                  : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
              }`}
            >
              <Handshake className="w-4 h-4 text-[#B88E4F]" />
              <span>Deal Độc Quyền & Voucher VIP</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="mb-3 px-2.5 py-1.5 rounded-lg border border-[#EAE4D7] bg-white hover:bg-[#FBF5EB] text-[#7D715E] hover:text-[#1A1612] text-xs font-medium flex items-center gap-1 transition cursor-pointer"
            title="Làm mới danh sách mẫu"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B88E4F] ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>

        {/* TAB 1: CENTRAL SAMPLE QUEUE (HÀNG ĐỢI HÀNG MẪU TOÀN SHOP) */}
        {storeTab === 'SAMPLES_QUEUE' && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Search & Filters bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#7D715E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên KOL, sản phẩm, mã vận đơn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1A1612] outline-none focus:border-[#C59B58]"
                />
              </div>

              {/* Status Filter buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'PENDING', label: `Chờ duyệt (${storeStats.pending})` },
                  { key: 'APPROVED', label: `Chờ gửi (${storeStats.readyToShip})` },
                  { key: 'SHIPPED', label: 'Đang giao' },
                  { key: 'RECEIVED', label: 'Đã nhận' },
                  { key: 'VIDEO_SUBMITTED', label: `Chờ duyệt video (${storeStats.videoPending})` },
                  { key: 'OVERDUE', label: `Quá hạn (${storeStats.overdue})`, isDanger: true },
                  { key: 'COMPLETED', label: 'Hoàn tất' },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    type="button"
                    onClick={() => setStatusFilter(btn.key as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      statusFilter === btn.key
                        ? btn.isDanger
                          ? 'bg-[#DC2626] text-white shadow-xs'
                          : 'bg-[#C59B58] text-white shadow-xs'
                        : btn.isDanger && storeStats.overdue > 0
                          ? 'bg-rose-50 border border-rose-200 text-[#DC2626]'
                          : 'bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612]'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Central Sample Queue Table */}
            <div className="overflow-x-auto border border-[#EAE4D7] rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[#7D715E] font-bold">
                    <th className="py-3 px-4">Nhà Sáng Tạo / KOL</th>
                    <th className="py-3 px-4">Sản Phẩm Mẫu</th>
                    <th className="py-3 px-4">Trạng Thái & Hạn Nộp Video</th>
                    <th className="py-3 px-4">Vận Đơn GHN</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D7]">
                  {filteredSamples.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#7D715E]">
                        <Package className="w-8 h-8 mx-auto mb-2 text-[#C59B58]/40" />
                        <p className="font-semibold text-xs text-[#1A1612]">Không tìm thấy yêu cầu mẫu nào</p>
                        <p className="text-[11px] mt-0.5">Thử đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSamples.map((s) => {
                      const now = Date.now();
                      const deadlineTime = s.deadlineAt ? new Date(s.deadlineAt).getTime() : Number.POSITIVE_INFINITY;
                      const msLeft = deadlineTime - now;
                      const daysLeft = Math.floor(msLeft / 86400000);
                      const hoursLeft = Math.floor((msLeft % 86400000) / 3600000);
                      const isOverdue = s.status === 'OVERDUE' || (s.status === 'RECEIVED' && msLeft <= 0);

                      return (
                        <tr key={s.id} className="hover:bg-[#FAF8F5]/60 transition">
                          {/* Column 1: KOL */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <KolAvatar
                                src={s.collaboratorInfo?.avatarUrl}
                                name={s.collaboratorInfo?.fullName || 'KOL'}
                                id={s.collaboratorId}
                                className="w-9 h-9 rounded-xl border border-[#EAE4D7] shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-[#1A1612] truncate max-w-[160px] flex items-center gap-1">
                                  <span>{s.collaboratorInfo?.fullName || 'Nhà Sáng Tạo'}</span>
                                  {s.collaboratorMetrics?.kycStatus === 'VERIFIED' && (
                                    <span className="text-[#059669] text-[10px]" title="Đã xác minh KYC">✓</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#7D715E] flex items-center gap-1.5 mt-0.5">
                                  <span className="px-1.5 py-0.2 rounded bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] font-semibold text-[10px]">
                                    {s.collaboratorInfo?.tier || 'Silver'}
                                  </span>
                                  <span>{s.collaboratorMetrics?.totalFollowers ? `${s.collaboratorMetrics.totalFollowers.toLocaleString('vi-VN')} flw` : ''}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Sản phẩm */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={s.product.thumbnail || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100'}
                                alt={s.product.title}
                                className="w-10 h-10 rounded-lg object-cover border border-[#EAE4D7] shrink-0 bg-[#FAF8F5]"
                              />
                              <div className="min-w-0 max-w-[220px]">
                                <p className="font-bold text-[#1A1612] truncate text-xs">{s.product.title}</p>
                                <p className="text-[11px] text-[#7D715E] mt-0.5">
                                  {s.productVariantName ? `Biến thể: ${s.productVariantName}` : 'Bản tiêu chuẩn'}
                                </p>
                                <details className="mt-2 text-[11px] text-[#7D715E]">
                                  <summary className="cursor-pointer font-semibold text-[#8C6226]">Thông tin nhận hàng</summary>
                                  <div className="mt-1 space-y-1 whitespace-normal break-words">
                                    <p>Người nhận: <strong className="text-[#1A1612]">{s.recipientName || 'Chưa cập nhật'}</strong></p>
                                    <p>SĐT: {s.recipientPhone || 'Chưa cập nhật'}</p>
                                    <p>Địa chỉ: {s.shippingAddress || 'Chưa cập nhật'}</p>
                                  </div>
                                </details>
                                <SampleSandboxWaybills charges={s.shippingCharges} primary={isSandboxShipment(s)} role="shop" />
                              </div>
                            </div>
                          </td>

                          {/* Column 3: Trạng thái & Hạn nộp video */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {s.status === 'PENDING' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                                  <Clock className="w-3 h-3 text-amber-600" /> Chờ Shop duyệt
                                </span>
                              )}
                              {s.status === 'APPROVED' && !isSandboxShipment(s) && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                                  <Package className="w-3 h-3 text-blue-600" /> Chờ tạo vận đơn
                                </span>
                              )}
                              {(s.status === 'SHIPPED' || isSandboxShipment(s)) && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold">
                                  <Truck className="w-3 h-3 text-indigo-600" /> {isSandboxShipment(s) ? <SampleSandboxStatus charges={s.shippingCharges} /> : 'Đang vận chuyển'}
                                </span>
                              )}
                              {s.status === 'RECEIVED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã nhận hàng · Chờ video
                                </span>
                              )}
                              {s.status === 'VIDEO_SUBMITTED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold">
                                  <Video className="w-3 h-3 text-purple-600" /> Đã nộp video review
                                </span>
                              )}
                              {isOverdue && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[#DC2626] text-[11px] font-bold">
                                  <AlertTriangle className="w-3 h-3 text-[#DC2626]" /> Quá hạn 14 ngày
                                </span>
                              )}
                              {s.status === 'COMPLETED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F3EFE6] border border-[#EAE4D7] text-[#1A1612] text-[11px] font-bold">
                                  <Check className="w-3 h-3 text-[#059669]" /> Đã hoàn tất
                                </span>
                              )}
                              {s.status === 'REJECTED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-semibold">
                                  <X className="w-3 h-3" /> Đã từ chối
                                </span>
                              )}

                              {/* Đếm ngược 14 ngày */}
                              {s.status === 'RECEIVED' && s.deadlineAt && (
                                <div className="text-[11px] mt-1 font-semibold">
                                  {isOverdue ? (
                                    <span className="text-[#DC2626]">⚠️ Đã quá thời hạn 14 ngày</span>
                                  ) : daysLeft <= 3 ? (
                                    <span className="text-amber-700">⏳ Gấp: Còn {daysLeft} ngày {hoursLeft}h</span>
                                  ) : (
                                    <span className="text-[#7D715E]">⏳ Hạn video: Còn {daysLeft} ngày</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Column 4: Mã vận đơn */}
                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            {s.trackingCode ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#1A1612] bg-[#FAF8F5] px-2 py-1 rounded-md border border-[#EAE4D7]">
                                  {s.trackingCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyTracking(s.trackingCode!)}
                                  className="p-1 rounded hover:bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] cursor-pointer"
                                  title="Sao chép mã"
                                >
                                  {copiedTracking === s.trackingCode ? (
                                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[#7D715E] italic">Chưa phát hành</span>
                            )}
                            {s.trackingCode && (
                              <div className="mt-2 text-[11px] text-[#7D715E]">
                                Shop chịu phí · COD 0 đ<br />
                                {s.shippingCharges?.length
                                  ? `${s.shippingCharges.reduce((sum, charge) => sum + (charge.environment === 'TEST' || charge.amount === null ? 0 : Number(charge.amount)), 0).toLocaleString('vi-VN')} đ đã ghi nhận${s.shippingCharges.some(charge => charge.environment !== 'TEST' && charge.amount === null) ? ' · còn cước chưa xác nhận' : ''}`
                                  : 'Chưa có dữ liệu cước'}
                              </div>
                            )}
                          </td>

                          {/* Column 5: Thao tác */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <SampleDeadlineExtension request={s} onSuccess={() => void loadData()} />
                              <SampleViolationAction request={s} blocked={Boolean(s.sampleRequestsBlockedAt)} onSuccess={() => void loadData()} />
                              {/* Chờ duyệt */}
                              {s.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveSample(s.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold text-[11px] transition cursor-pointer shadow-2xs"
                                  >
                                    Duyệt gửi
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectSample(s.id)}
                                    className="px-2.5 py-1.5 rounded-lg border border-[#EAE4D7] bg-white hover:bg-rose-50 hover:text-[#DC2626] font-semibold text-[11px] text-[#7D715E] transition cursor-pointer"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              )}

                              {/* Chờ gửi -> Tạo vận đơn GHN */}
                              {['APPROVED', 'DELIVERY_ISSUE', 'SHIPPED'].includes(s.status) && (
                                <button
                                  type="button"
                                  onClick={() => openTrackingModal(s)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#231D15] hover:bg-[#1A1612] text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Truck className="w-3 h-3 text-[#C59B58]" />
                                  <span>{isSandboxShipment(s) ? 'Đổi môi trường GHN' : s.status === 'SHIPPED' ? 'Tạo mã GHN sandbox' : 'Tạo vận đơn GHN'}</span>
                                </button>
                              )}

                              {/* Chỉ nhắc nộp video sau khi đã nhận hàng */}
                              {s.status === 'RECEIVED' && s.deadlineAt && (
                                <button
                                  type="button"
                                  onClick={() => handleRemindVideo(s.id)}
                                  disabled={Boolean(remindedSamples[s.id])}
                                  className="px-2.5 py-1.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] hover:bg-[#F3EFE6] text-[#B88E4F] font-bold text-[11px] flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                                >
                                  <BellRing className="w-3 h-3" />
                                  <span>{remindedSamples[s.id] ? 'Đã nhắc' : 'Nhắc nộp video'}</span>
                                </button>
                              )}

                              {/* Đã nộp video -> Nghiệm thu */}
                              {s.status === 'VIDEO_SUBMITTED' && (
                                <div className="flex items-center gap-1">
                                  {s.reviewVideoUrl && (
                                    <a
                                      href={s.reviewVideoUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] text-[#1A1612]"
                                      title="Xem video"
                                    >
                                      <Video className="w-3.5 h-3.5 text-[#C59B58]" />
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleReviewSampleVideo(s, 'APPROVED')}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#059669] text-white font-bold text-[11px] hover:bg-[#047857] transition cursor-pointer"
                                  >
                                    Nghiệm thu
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReviewSampleVideo(s, 'REJECTED')}
                                    className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-[#DC2626] font-bold text-[11px] hover:bg-rose-100 transition cursor-pointer"
                                  >
                                    Sửa
                                  </button>
                                </div>
                              )}

                              {/* Nút Chat 1-1 */}
                              <button
                                type="button"
                                onClick={() => navigate(`/merchant/kol-hub?kol=${s.collaboratorId}`)}
                                className="p-1.5 rounded-lg border border-[#EAE4D7] bg-white hover:bg-[#FBF5EB] hover:border-[#C59B58] text-[#7D715E] hover:text-[#B88E4F] transition cursor-pointer"
                                title="Mở chat trao đổi 1-1 với KOL"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: AFFILIATE LEADERBOARD (BẢNG XẾP HẠNG KOL TIẾP THỊ) */}
        {storeTab === 'LEADERBOARD' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1A1612]">Top Đối Tác Tiếp Thị Xuất Sắc Của Gian Hàng</h3>
                <p className="text-xs text-[#7D715E] mt-0.5">Xếp hạng theo tổng doanh số GMV thực tế mang về cho Shop</p>
              </div>
              <div className="text-xs text-[#7D715E] font-medium">
                Tổng số: <strong className="text-[#1A1612]">{leaderboardCreators.length}</strong> nhà sáng tạo
              </div>
            </div>

            <div className="overflow-x-auto border border-[#EAE4D7] rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[#7D715E] font-bold">
                    <th className="py-3 px-4 w-14 text-center">Hạng</th>
                    <th className="py-3 px-4">Nhà Sáng Tạo / KOC</th>
                    <th className="py-3 px-4">Kênh & Lượt Theo Dõi</th>
                    <th className="py-3 px-4 text-right">Doanh Số GMV</th>
                    <th className="py-3 px-4 text-center">Đơn Hàng</th>
                    <th className="py-3 px-4 text-center">Mức Hoa Hồng</th>
                    <th className="py-3 px-4 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D7]">
                  {leaderboardCreators.map((creator, idx) => (
                    <tr key={creator.id} className="hover:bg-[#FAF8F5]/60 transition">
                      <td className="py-3.5 px-4 text-center">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-black text-xs border border-amber-300">
                            👑 1
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-black text-xs border border-slate-300">
                            🥈 2
                          </span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-800 font-black text-xs border border-amber-200">
                            🥉 3
                          </span>
                        ) : (
                          <span className="font-bold text-[#7D715E]">#{idx + 1}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <KolAvatar
                            src={creator.avatarUrl}
                            name={creator.fullName}
                            id={creator.id}
                            className="w-9 h-9 rounded-xl border border-[#EAE4D7] shrink-0"
                          />
                          <div>
                            <div className="font-bold text-[#1A1612] flex items-center gap-1.5">
                              <span>{creator.fullName}</span>
                              {creator.kycStatus === 'VERIFIED' && (
                                <span className="text-[#059669] text-[10px]" title="Đã KYC">✓</span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#7D715E]">
                              {creator.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-[#1A1612]">
                            {creator.handle || creator.platform}
                          </div>
                          <div className="text-[11px] text-[#7D715E]">
                            {(creator.followers || 0).toLocaleString('vi-VN')} người theo dõi
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-[#1A1612]">
                        {creator.gmv.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-[#7D715E]">
                        {creator.ordersCount}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] font-bold text-[11px]">
                          {creator.commissionRate}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/merchant/kol-hub?kol=${creator.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs ml-auto"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Nhắn tin</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: EXCLUSIVE DEALS & VIP AGREEMENTS */}
        {storeTab === 'DEALS' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#1A1612]">Thỏa Thuận Hoa Hồng & Deal Độc Quyền (VIP)</h3>
                <p className="text-xs text-[#7D715E] mt-0.5">Quản lý các chính sách hoa hồng cá nhân hóa và voucher riêng dành cho KOL cấp cao</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/merchant/kol-hub')}
                className="px-3.5 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mời Thêm KOL & Tạo Deal</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {leaderboardCreators.slice(0, 6).map((creator, idx) => (
                <div
                  key={creator.id}
                  className="p-4 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-white hover:border-[#C59B58] transition text-left space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] text-[10px] font-bold">
                      {idx % 2 === 0 ? 'Deal VIP 15%' : 'Deal Độc Quyền 18%'}
                    </span>
                    <span className="text-[11px] font-bold text-[#059669]">Đang hiệu lực</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <KolAvatar
                      src={creator.avatarUrl}
                      name={creator.fullName}
                      id={creator.id}
                      className="w-9 h-9 rounded-xl border border-[#EAE4D7] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-[#1A1612] truncate text-xs">{creator.fullName}</div>
                      <div className="text-[11px] text-[#7D715E] truncate">{creator.email}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-[#EAE4D7] space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-[#7D715E]">Hoa hồng thỏa thuận:</span>
                      <strong className="text-[#B88E4F]">{10 + (idx % 3) * 4}%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7D715E]">Mã voucher riêng:</span>
                      <strong className="font-mono text-[#1A1612]">VIP-{creator.fullName.split(' ').pop()?.toUpperCase() || 'SCANMS'}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/merchant/kol-hub?kol=${creator.id}`)}
                    className="w-full py-1.5 rounded-lg border border-[#EAE4D7] bg-white hover:bg-[#FBF5EB] hover:text-[#B88E4F] text-[#1A1612] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Trao đổi chi tiết</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: TẠO VẬN ĐƠN GHN CHO HÀNG MẪU */}
      {trackingModalItem && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
          onClick={() => setTrackingModalItem(null)}
        >
          <div
            className="bg-white border border-[#EAE4D7] rounded-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] shadow-2xl overflow-y-auto overscroll-contain animate-in zoom-in-95 text-left"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#1A1612]">Tạo Vận Đơn Giao Hàng Mẫu</h3>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer"
                onClick={() => setTrackingModalItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="p-4 mx-6 mt-4 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-xs space-y-1">
              <div className="font-bold text-[#1A1612]">Người nhận: {trackingModalItem.recipientName || 'Chưa cập nhật'}</div>
              <div className="text-[#7D715E]">SĐT: {trackingModalItem.recipientPhone || 'Chưa cập nhật'}</div>
              <div className="text-[#7D715E]">{trackingModalItem.product.title}</div>
              <div className="text-[11px] text-[#7D715E] pt-1 border-t border-[#EAE4D7]">
                📍 {trackingModalItem.shippingAddress}
              </div>
            </div>

            <form onSubmit={handleSubmitTracking} className="p-6 space-y-4">
              <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#7D715E]">
                <strong className="text-[#1A1612]">Shop thanh toán 100% phí vận chuyển · KOL COD 0 đ.</strong>
                <p className="mt-1">Khi tạo vận đơn GHN thành công, cước hãng trả về được lưu vào yêu cầu mẫu để Shop theo dõi.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                  Đơn vị vận chuyển
                </label>
                <select
                  value={carrierInput}
                  onChange={(e) => setCarrierInput(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs text-[#1A1612] outline-none focus:border-[#C59B58]"
                >
                  <option value="GHN">Giao Hàng Nhanh (GHN Express)</option>
                </select>
              </div>

              {carrierInput === 'GHN' && <SampleGhnEnvironmentPicker value={sampleGhnEnvironment} onChange={setSampleGhnEnvironment} allowLive={trackingModalItem.status !== 'SHIPPED'} disabled={isSubmittingTracking} />}
              {carrierInput !== 'GHN' ? <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                  Mã vận đơn bưu cục
                </label>
                <input
                  type="text"
                  placeholder="Nhập mã vận đơn do bưu cục cấp"
                  value={trackingCodeInput}
                  onChange={(e) => setTrackingCodeInput(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs font-mono text-[#1A1612] outline-none focus:border-[#C59B58]"
                  required
                />
                <p className="text-[11px] text-[#7D715E] mt-1">
                  Mã vận đơn phục vụ đối soát giao nhận với đối tác bưu tá.
                </p>
              </div> : <p className="text-xs text-[#7D715E]">GHN sẽ cấp mã vận đơn sau khi tạo thành công. Hạn nộp video chỉ bắt đầu sau khi GHN xác nhận giao hàng.</p>}

              {sampleShippingError && (
                <div role="alert" className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3.5 text-left">
                  <p className="m-0 text-xs font-bold text-[#991B1B]">Chưa tạo được vận đơn gửi mẫu</p>
                  <p className="mb-0 mt-1.5 whitespace-normal break-words text-xs leading-relaxed text-[#7F1D1D]">{sampleShippingError}</p>
                </div>
              )}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EAE4D7]">
                <button
                  type="button"
                  onClick={() => setTrackingModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE4D7] text-xs font-semibold text-[#7D715E] hover:bg-[#FAF8F5] transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTracking || (carrierInput !== 'GHN' && !trackingCodeInput.trim())}
                  className="px-4 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTracking ? 'Đang phát hành…' : 'Xác nhận tạo vận đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
