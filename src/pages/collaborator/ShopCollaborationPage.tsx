import { useState, useEffect, useMemo, useCallback, useRef, type UIEvent } from 'react';
import './ShopCollaborationPage.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AddressLocationPicker, type AddressLocationResult } from '../../components/customer/AddressLocationPicker';
import { StoreCooperationPanel } from '../../components/affiliate/StoreCooperationPanel';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { GhnTrackingTimeline } from '../../components/shipping/GhnTrackingTimeline';
import { SampleSandboxWaybills, SampleSandboxStatus, isSandboxShipment, sampleDisplayStatus } from '../../components/shipping/SampleGhnEnvironmentPicker';
import { isSamplePhoneValid, normalizeSamplePhone, SAMPLE_PHONE_ERROR } from '../../utils/sample-phone';
import {
  Store,
  MessageSquare,
  Package,
  Search,
  Sparkles,
  Link2,
  ExternalLink,
  TrendingUp,
  MapPin,
  Star,
  Plus,
  Loader2,
  Truck,
  CheckCircle2,
  Video,
  Download,
  ShieldAlert,
  Copy,
  AlertTriangle,
  Handshake,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Image,
  Lightbulb,
} from 'lucide-react';
import api from '../../services/api';
import { getChatSocket } from '../../services/chat-socket.service';
import { kycService, type KycProfile } from '../../services/kyc.service';
import { socialService, type SocialChannel } from '../../services/social.service';
import { type MediaAsset } from '../../services/media.service';
import { referralLinksService } from '../../services/referral-links.service';
import { SubmitKolVideoModal } from '../../components/media/SubmitKolVideoModal';
import ChatBoxPage from '../chat/ChatBoxPage';
import { toast } from '../../utils/toast';
import { Select } from '../../components/ui/Select';
import QRCode from 'qrcode';

const sampleVideoStatusLabels: Record<string, string> = {
  PENDING: 'Chờ Shop duyệt',
  APPROVED: 'Đã được duyệt',
  REJECTED: 'Cần chỉnh sửa',
};

export interface PartnerStore {
  id: string;
  conversationId?: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  ownerAvatarUrl?: string;
  ownerName?: string;
  category?: string;
  commissionRange?: string;
  defaultCommissionRate?: number;
  rating?: number;
  location?: string;
  totalProducts?: number;
  unreadCount?: number;
  pendingSamplesCount?: number;
  lastMessageText?: string;
  lastMessageAt?: string;
}

const getShopLogoUrl = (logoUrl?: string | null) => {
  const normalized = logoUrl?.trim();
  if (!normalized || /unsplash\.com/i.test(normalized)) return undefined;
  return normalized;
};

function StoreAvatar({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string;
  className: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [logoUrl]);

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'S';

  return (
    <span className={`${className} relative inline-flex items-center justify-center overflow-hidden bg-[#F3EFE6] text-[#B88E4F] font-extrabold`}>
      {logoUrl && !imageFailed ? (
        <img
          src={logoUrl}
          alt={`Logo ${name}`}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}

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

const REAL_STORES: PartnerStore[] = [];

export default function ShopCollaborationPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shopParam = searchParams.get('shop') || searchParams.get('storeId');
  const tabParam = searchParams.get('tab') || 'messages';

  // Product context from query params
  const productId = searchParams.get('productId');
  const productTitle = searchParams.get('productTitle');
  const productImage = searchParams.get('productImage');
  const productPrice = searchParams.get('productPrice');
  const productSku = searchParams.get('productSku');
  const productVariantId = searchParams.get('productVariantId');
  const commissionRate = searchParams.get('commissionRate');

  const initialProductContext = useMemo(() => {
    if (!productId || !productTitle) return undefined;
    return {
      id: productId,
      title: productTitle,
      image: productImage || undefined,
      price: productPrice ? Number(productPrice) : 0,
      sku: productSku || undefined,
      productVariantId: productVariantId || undefined,
      commissionRate: commissionRate ? Number(commissionRate) : undefined,
    };
  }, [productId, productTitle, productImage, productPrice, productSku, commissionRate, productVariantId]);

  const [stores, setStores] = useState<PartnerStore[]>(REAL_STORES);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(shopParam || '');
  const [activeTab, setActiveTab] = useState<'messages' | 'products' | 'samples' | 'media'>(
    (tabParam as any) || 'messages'
  );

  const [searchShopQuery, setSearchShopQuery] = useState('');
  const [shopFilter, setShopFilter] = useState<'ALL' | 'CHAT' | 'SAMPLES' | 'HIGH_COMM'>('ALL');

  // KOL verification profile & channels (Business Guard)
  const [kycProfile, setKycProfile] = useState<KycProfile | null>(null);
  const [socialChannels, setSocialChannels] = useState<SocialChannel[]>([]);
  const [sampleEligibility, setSampleEligibility] = useState<any>(null);
  const [loadingKyc, setLoadingKyc] = useState(true);

  // Tab 2: Products
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsLoadError, setProductsLoadError] = useState(false);
  const productLoadSequence = useRef(0);
  const [productSearch, setProductSearch] = useState('');

  // Tab 3: Samples
  const [samples, setSamples] = useState<any[]>([]);
  const [samplesStoreId, setSamplesStoreId] = useState<string | null>(null);
  const [samplesLoadError, setSamplesLoadError] = useState(false);
  const sampleLoadSequence = useRef(0);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [sampleStatusFilter, setSampleStatusFilter] = useState('ALL');

  // Tab 4: Media Toolkit
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [mediaTab, setMediaTab] = useState<'BROLL' | 'PHOTOS' | 'USP' | 'HOOKS'>('BROLL');
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Modal 1: Lấy Link Tiếp Thị Chuyên Nghiệp (Giải pháp 1)
  const [linkModalProduct, setLinkModalProduct] = useState<any | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<'TIKTOK' | 'FACEBOOK' | 'YOUTUBE' | 'INSTAGRAM'>('TIKTOK');
  const [generatedShortlink, setGeneratedShortlink] = useState<string>('');
  const [generatedQr, setGeneratedQr] = useState<string>('');

  // Modal 2: Xin Hàng Mẫu 4 Bước (Giải pháp 2)
  const [requestSampleModalProduct, setRequestSampleModalProduct] = useState<any | null>(null);
  const [sampleSocialChannelId, setSampleSocialChannelId] = useState<string>('');
  const [sampleContentType, setSampleContentType] = useState<string>('Video Review 60s (Routine buổi sáng)');
  const [sampleTermsAccepted, setSampleTermsAccepted] = useState(false);
  const [sampleRecipientName, setSampleRecipientName] = useState('');
  const [sampleRecipientPhone, setSampleRecipientPhone] = useState('');
  const [sampleRecipientPhoneConfirmed, setSampleRecipientPhoneConfirmed] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [sampleLocation, setSampleLocation] = useState<AddressLocationResult | null>(null);
  const [sampleProvinces, setSampleProvinces] = useState<Array<{ ProvinceID: number; ProvinceName: string }>>([]);
  const [sampleDistricts, setSampleDistricts] = useState<Array<{ DistrictID: number; DistrictName: string }>>([]);
  const [sampleWards, setSampleWards] = useState<Array<{ WardCode: string; WardName: string }>>([]);
  const [sampleProvinceId, setSampleProvinceId] = useState('');
  const [sampleDistrictId, setSampleDistrictId] = useState('');
  const [sampleWardCode, setSampleWardCode] = useState('');
  const [sampleAddressError, setSampleAddressError] = useState('');
  const [sampleProvincesLoading, setSampleProvincesLoading] = useState(false);
  const [sampleDistrictsLoading, setSampleDistrictsLoading] = useState(false);
  const [sampleWardsLoading, setSampleWardsLoading] = useState(false);
  const [trackingSampleId, setTrackingSampleId] = useState<string | null>(null);
  const [submittingSample, setSubmittingSample] = useState(false);
  const sampleSubmissionInFlight = useRef(false);

  useEffect(() => {
    if (!requestSampleModalProduct) return;
    let active = true;
    const editing = requestSampleModalProduct._editingRequest;
    setSampleLocation(null);
    setSampleProvinceId(editing?.ghnProvinceId ? String(editing.ghnProvinceId) : '');
    setSampleDistrictId(editing?.ghnDistrictId ? String(editing.ghnDistrictId) : '');
    setSampleWardCode(editing?.ghnWardCode || '');
    setSampleAddressError('');
    setSampleProvinces([]);
    setSampleDistricts([]);
    setSampleWards([]);
    setSampleProvincesLoading(true);
    api.get('/shipping/ghn/provinces')
      .then((response: any) => {
        const data = response?.data?.data || response?.data || response;
        if (!Array.isArray(data) || !data.length) throw new Error('Không có danh mục GHN');
        if (active) setSampleProvinces(data);
      })
      .catch(() => { if (active) setSampleAddressError('Chưa tải được tỉnh/thành GHN. Vui lòng đóng và mở lại form để thử lại.'); })
      .finally(() => { if (active) setSampleProvincesLoading(false); });
    return () => { active = false; };
  }, [requestSampleModalProduct]);

  useEffect(() => {
    setSampleDistricts([]);
    if (!requestSampleModalProduct || !sampleProvinceId) { setSampleDistrictsLoading(false); return; }
    let active = true;
    setSampleDistrictsLoading(true);
    api.get(`/shipping/ghn/districts/${sampleProvinceId}`)
      .then((response: any) => {
        const data = response?.data?.data || response?.data || response;
        if (!Array.isArray(data) || !data.length) throw new Error('Không có danh mục GHN');
        if (active) setSampleDistricts(data);
      })
      .catch(() => { if (active) setSampleAddressError('Chưa tải được quận/huyện GHN. Vui lòng chọn lại tỉnh/thành.'); })
      .finally(() => { if (active) setSampleDistrictsLoading(false); });
    return () => { active = false; };
  }, [sampleProvinceId, requestSampleModalProduct]);

  useEffect(() => {
    setSampleWards([]);
    if (!requestSampleModalProduct || !sampleDistrictId) { setSampleWardsLoading(false); return; }
    let active = true;
    setSampleWardsLoading(true);
    api.get(`/shipping/ghn/wards/${sampleDistrictId}`)
      .then((response: any) => {
        const data = response?.data?.data || response?.data || response;
        if (!Array.isArray(data) || !data.length) throw new Error('Không có danh mục GHN');
        if (active) setSampleWards(data);
      })
      .catch(() => { if (active) setSampleAddressError('Chưa tải được phường/xã GHN. Vui lòng chọn lại quận/huyện.'); })
      .finally(() => { if (active) setSampleWardsLoading(false); });
    return () => { active = false; };
  }, [sampleDistrictId, requestSampleModalProduct]);

  // Modal 3: Nộp link video nghiệm thu
  const [submitVideoSample, setSubmitVideoSample] = useState<any | null>(null);

  // Modal 5: Đề xuất Deal hoa hồng riêng kèm cam kết (KOL -> Shop)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [dealModalProduct, setDealModalProduct] = useState<any | null>(null);
  const [dealModalProducts, setDealModalProducts] = useState<any[]>([]);
  const [dealProposedRate, setDealProposedRate] = useState<number>(11);
  const [dealDurationMonths, setDealDurationMonths] = useState<number>(3);
  const [dealOrderCommitment, setDealOrderCommitment] = useState<number | ''>(100);
  const [dealRevenueCommitment, setDealRevenueCommitment] = useState<string>('25.000.000');
  const [dealContentPlan, setDealContentPlan] = useState<string>('3 Video TikTok/Reels chuyên sâu + 1 Phiên Livestream đẩy số');
  const [dealTermsAccepted, setDealTermsAccepted] = useState(false);
  const [submittingDeal, setSubmittingDeal] = useState(false);

  // Discover Stores Modal
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [marketplaceStores, setMarketplaceStores] = useState<any[]>([]);
  const [loadingMarketplace, setLoadingMarketplace] = useState(false);
  const [discoverSearch, setDiscoverSearch] = useState('');
  const discoveredStores = useMemo(() => {
    const query = discoverSearch.trim().toLocaleLowerCase('vi');
    return marketplaceStores.filter((shop) =>
      `${shop.name || ''} ${shop.description || ''} ${shop.category || ''}`.toLocaleLowerCase('vi').includes(query),
    );
  }, [marketplaceStores, discoverSearch]);
  const [connectingStoreId, setConnectingStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (!showDiscoverModal) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowDiscoverModal(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
      previousFocus?.focus();
    };
  }, [showDiscoverModal]);

  // Sidebar Collapse state (Thu gọn / Mở rộng thanh bên gian hàng)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('scanms_collab_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('scanms_collab_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Sync with URL query
  useEffect(() => {
    if (shopParam && shopParam !== selectedStoreId) {
      setSelectedStoreId(shopParam);
    }
    if (tabParam && ['messages', 'products', 'samples', 'media'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [shopParam, tabParam]);

  const updateUrl = (storeId: string, tab: string) => {
    setSearchParams({ shop: storeId, tab }, { replace: true });
  };

  // Load verification status of current KOL
  useEffect(() => {
    const fetchVerification = async () => {
      if (!kycProfile) setLoadingKyc(true);
      try {
        const [kycRes, socialRes, eligibilityRes] = await Promise.all([
          kycService.getMyKyc().catch(() => null),
          socialService.getMyChannels().catch(() => []),
          api.get('/sample-requests/my/eligibility').catch(() => null),
        ]);
        setKycProfile(kycRes);
        setSocialChannels(socialRes || []);
        setSampleEligibility(eligibilityRes?.data || eligibilityRes);
        if (socialRes?.length) setSampleSocialChannelId((current) => current || socialRes[0].id);
      } finally {
        setLoadingKyc(false);
      }
    };
    fetchVerification();
  }, []);

  const isKycVerified = kycProfile?.kycStatus === 'VERIFIED';
  const hasSocialChannel = socialChannels.length > 0;
  const canRequestSample = Boolean(sampleEligibility?.canRequest ?? (isKycVerified && hasSocialChannel));
  const visibleSamples = sampleStatusFilter === 'ALL'
    ? samples
    : samples.filter((sample) => sampleDisplayStatus(sample) === sampleStatusFilter);

  const overdueSamplesCount = useMemo(() => {
    return samples.filter((s: any) => {
      if (s.status === 'OVERDUE') return true;
      if (['RECEIVED', 'REVISION_REQUIRED'].includes(s.status)) {
        const dl = s.revisionDeadlineAt || s.deadlineAt;
        if (dl && new Date(dl).getTime() <= Date.now()) return true;
      }
      return false;
    }).length;
  }, [samples]);

  const urgentSamplesCount = useMemo(() => {
    return samples.filter((s: any) => {
      if (['RECEIVED', 'REVISION_REQUIRED'].includes(s.status)) {
        const dl = s.revisionDeadlineAt || s.deadlineAt;
        if (dl) {
          const diff = new Date(dl).getTime() - Date.now();
          return diff > 0 && diff <= 3 * 86400000;
        }
      }
      return false;
    }).length;
  }, [samples]);

  const formatDeadlineCountdown = (deadlineStr: string) => {
    const diffMs = new Date(deadlineStr).getTime() - Date.now();
    if (diffMs <= 0) {
      return { isOverdue: true, text: 'Quá hạn 14 ngày', isUrgent: true, days: 0, hours: 0 };
    }
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    return {
      isOverdue: false,
      text: days > 0 ? `Còn ${days} ngày ${hours} giờ` : `Còn ${hours} giờ`,
      isUrgent: days <= 3,
      days,
      hours,
    };
  };

  const handleCancelSampleRequest = async (sampleId: string) => {
    try {
      await api.patch(`/sample-requests/${sampleId}/cancel`, {});
      toast.success('Đã hủy yêu cầu xin mẫu.');
      if (selectedStore?.id) await loadStoreSamples(selectedStore.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể hủy yêu cầu mẫu.');
    }
  };

  useEffect(() => {
    if (searchParams.get('sampleRequest') !== '1' || !initialProductContext) return;
    setRequestSampleModalProduct({
      ...initialProductContext,
      imageUrl: initialProductContext.image,
    });
    setSampleTermsAccepted(false);
    setSampleRecipientName('');
    setSampleRecipientPhone('');
    setSampleRecipientPhoneConfirmed(false);
    setShippingAddress('');
    setActiveTab('products');
  }, [initialProductContext, searchParams]);

  // Load conversations & stores
  const loadConversationsAndStores = useCallback(async () => {
    try {
      const [convRes, marketRes]: [any, any] = await Promise.all([
        api.get('/chat/conversations').catch(() => []),
        api.get('/stores/marketplace').catch(() => ({ data: [] })),
      ]);

      const convList = Array.isArray(convRes) ? convRes : convRes?.data || [];
      const marketStores = Array.isArray(marketRes?.data) ? marketRes.data : Array.isArray(marketRes) ? marketRes : [];

      const mappedStores: PartnerStore[] = [];

      convList.forEach((conv: any) => {
        const st = conv.store || {};
        const storeId = st.id || conv.storeId;
        if (storeId && !mappedStores.some((store) => store.id === storeId)) {
          const lastMsg = conv.chatMessages?.[0];
          mappedStores.push({
            id: storeId,
            conversationId: conv.id,
            name: st.name || 'Gian hàng đối tác',
            slug: st.slug || '',
            logoUrl: getShopLogoUrl(st.logoUrl),
            ownerAvatarUrl: st.owner?.avatarUrl || undefined,
            ownerName: st.owner?.fullName || undefined,
            category: st.description?.slice(0, 30) || 'Gian hàng chính hãng',
            defaultCommissionRate: st.defaultCommissionRate ? Number(st.defaultCommissionRate) : 10,
            commissionRange: `${st.defaultCommissionRate ? Number(st.defaultCommissionRate) : 10}% - 21%`,
            rating: 4.9,
            location: 'Toàn quốc',
            unreadCount: (conv._count?.chatMessages || 0) > 0 || (lastMsg && !lastMsg.isRead) ? 1 : 0,
            lastMessageText: getChatMessagePreview(lastMsg?.messageText, lastMsg?.mediaName),
            lastMessageAt: lastMsg?.createdAt || conv.lastMessageAt || conv.createdAt,
          });
        }
      });

      // Sắp xếp hội thoại có tin nhắn mới nhất lên đầu
      mappedStores.sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return timeB - timeA;
      });

      // Nếu KOL mở từ gian hàng hoặc trang sản phẩm qua URL query ?shop=xxx
      // mà gian hàng này chưa có trong danh sách hội thoại, thêm tạm vào đầu danh sách để bắt đầu chat
      if (shopParam && !mappedStores.some((s) => s.id === shopParam)) {
        const targetStore = marketStores.find((ms: any) => ms.id === shopParam);
        if (targetStore) {
          mappedStores.unshift({
            id: targetStore.id,
            name: targetStore.name,
            slug: targetStore.slug || '',
            logoUrl: getShopLogoUrl(targetStore.logoUrl),
            ownerAvatarUrl: targetStore.owner?.avatarUrl || undefined,
            ownerName: targetStore.owner?.fullName || undefined,
            category: targetStore.description?.slice(0, 30) || 'Gian hàng chính hãng',
            defaultCommissionRate: targetStore.defaultCommissionRate ? Number(targetStore.defaultCommissionRate) : 10,
            commissionRange: `${targetStore.defaultCommissionRate ? Number(targetStore.defaultCommissionRate) : 10}% - 21%`,
            rating: 4.8,
            location: 'Toàn quốc',
            totalProducts: targetStore._count?.products || 10,
            unreadCount: 0,
            lastMessageText: 'Bắt đầu cuộc trò chuyện...',
            lastMessageAt: new Date().toISOString(),
          });
        }
      }

      // Bổ sung các gian hàng khác từ sàn nếu chưa có hội thoại
      marketStores.forEach((ms: any) => {
        if (!mappedStores.some((s) => s.id === ms.id)) {
          mappedStores.push({
            id: ms.id,
            name: ms.name,
            slug: ms.slug || '',
            logoUrl: getShopLogoUrl(ms.logoUrl),
            ownerAvatarUrl: ms.owner?.avatarUrl || undefined,
            ownerName: ms.owner?.fullName || undefined,
            category: ms.description?.slice(0, 30) || 'Mỹ phẩm & Chăm sóc da',
            defaultCommissionRate: ms.defaultCommissionRate ? Number(ms.defaultCommissionRate) : 10,
            commissionRange: `${ms.defaultCommissionRate ? Number(ms.defaultCommissionRate) : 10}% - 21%`,
            rating: 4.8,
            location: 'Toàn quốc',
            totalProducts: ms._count?.products || 10,
            unreadCount: 0,
            lastMessageText: 'Bắt đầu cuộc trò chuyện...',
            lastMessageAt: new Date().toISOString(),
          });
        }
      });

      setStores(mappedStores);

      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (mappedStores.length > 0) {
        if (!shopParam || !UUID_REGEX.test(shopParam) || !mappedStores.some((s) => s.id === shopParam)) {
          setSelectedStoreId(mappedStores[0].id);
          updateUrl(mappedStores[0].id, activeTab);
        } else {
          setSelectedStoreId(shopParam);
        }
      } else {
        setSelectedStoreId('');
      }
    } catch {
      setStores([]);
    }
  }, [shopParam, activeTab]);

  useEffect(() => {
    loadConversationsAndStores();
  }, [loadConversationsAndStores]);

  const selectedStore = useMemo(() => {
    return stores.find((s) => s.id === selectedStoreId) || stores[0] || null;
  }, [stores, selectedStoreId]);
  const [compactContext, setCompactContext] = useState(false);
  const tabScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setCompactContext(false);
    if (tabScrollRef.current) tabScrollRef.current.scrollTop = 0;
  }, [selectedStore?.id, activeTab]);
  const handleContentScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.closest('[data-collaboration-content]') ||
      target.matches('textarea, input') || target.scrollHeight <= target.clientHeight) return;
    setCompactContext(previous => target.scrollTop > (previous ? 8 : 48));
  };

  const [tabCounts, setTabCounts] = useState<{
    storeId: string; messages: number | null; products: number | null;
    samples: number | null; media: number | null;
  }>({ storeId: '', messages: null, products: null, samples: null, media: null });

  useEffect(() => {
    let active = true;
    let fetching = false;
    const storeId = selectedStore?.id;
    if (!storeId) return;
    const refresh = async () => {
      if (fetching || document.hidden) return;
      fetching = true;
      const results = await Promise.allSettled([
        api.get('/chat/conversations', { headers: { 'x-skip-cache': 'true' } }),
        api.get('/products', { params: { storeId, limit: 1 }, headers: { 'x-skip-cache': 'true' } }),
        api.get('/sample-requests/my', { headers: { 'x-skip-cache': 'true' } }),
        api.get('/media', { params: { storeId, limit: 1 }, headers: { 'x-skip-cache': 'true' } }),
      ]);
      fetching = false;
      if (!active) return;
      const data = results.map((result) => result.status === 'fulfilled'
        ? ((result.value as any)?.data ?? result.value) : null);
      const conversations = Array.isArray(data[0]) ? data[0] : null;
      const requests = Array.isArray(data[2]) ? data[2] : null;
      setTabCounts({
        storeId,
        messages: conversations ? conversations.filter((item: any) => (item.storeId || item.store?.id) === storeId)
          .reduce((sum: number, item: any) => sum + Number(item.messageCount || 0), 0) : null,
        products: typeof data[1]?.pagination?.total === 'number' ? data[1].pagination.total : null,
        samples: requests ? requests.filter((item: any) => item.product?.storeId === storeId).length : null,
        media: typeof data[3]?.pagination?.total === 'number' ? data[3].pagination.total : null,
      });
    };
    void refresh();
    let messageTimer: ReturnType<typeof setTimeout> | undefined;
    let refreshingMessages = false;
    const refreshMessageCount = async () => {
      if (!active || refreshingMessages) return;
      refreshingMessages = true;
      try {
        const response: any = await api.get('/chat/conversations', { headers: { 'x-skip-cache': 'true' } });
        const rows = response?.data ?? response;
        if (!active || !Array.isArray(rows)) return;
        const total = rows.filter((item: any) => (item.storeId || item.store?.id) === storeId)
          .reduce((sum: number, item: any) => sum + Number(item.messageCount || 0), 0);
        setTabCounts(previous => previous.storeId === storeId ? { ...previous, messages: total } : previous);
      } finally {
        refreshingMessages = false;
      }
    };
    const onMessage = () => {
      clearTimeout(messageTimer);
      messageTimer = setTimeout(() => { void refreshMessageCount().catch(() => undefined); }, 200);
    };
    const socket = getChatSocket();
    socket.on('new_message', onMessage);
    const timer = window.setInterval(() => void refresh(), 30000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      clearTimeout(messageTimer);
      socket.off('new_message', onMessage);
      window.removeEventListener('focus', refresh);
    };
  }, [selectedStore?.id, activeTab]);

  const openStorefront = useCallback((store: PartnerStore) => {
    if (store.slug) {
      navigate(`/shop/${encodeURIComponent(store.slug)}`);
      return;
    }
    navigate(`/marketplace?shop=${encodeURIComponent(store.id)}`);
  }, [navigate]);

  // Load products (chỉ hiện spinner nếu chưa có sản phẩm)
  const loadStoreProducts = useCallback(async (storeId: string, background = false) => {
    const sequence = ++productLoadSequence.current;
    if (!background) setLoadingProducts(true);
    try {
      const res: any = await api.get('/products', { params: { storeId, limit: 50 }, headers: { 'x-skip-cache': 'true' } });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.items)
        ? res.items
        : null;
      if (!list) throw new Error('Không đọc được sản phẩm của gian hàng.');
      if (sequence !== productLoadSequence.current) return;
      setProducts(list);
      setProductsLoadError(false);
    } catch {
      if (sequence !== productLoadSequence.current) return;
      setProducts([]);
      setProductsLoadError(true);
    } finally {
      if (sequence === productLoadSequence.current) setLoadingProducts(false);
    }
  }, []);

  // Load samples (chỉ hiện spinner nếu chưa có samples)
  const loadStoreSamples = useCallback(async (storeId: string) => {
    const sequence = ++sampleLoadSequence.current;
    setLoadingSamples(true);
    setSamplesStoreId(null);
    setSamplesLoadError(false);
    try {
      const res: any = await api.get('/sample-requests/my', { headers: { 'x-skip-cache': 'true' } });
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : null;
      if (!list) throw new Error('Không đọc được lịch sử xin mẫu.');
      const matching = list.filter((item: any) => item.product?.storeId === storeId || !item.product?.storeId);
      if (sequence !== sampleLoadSequence.current) return;
      setSamples(matching);
      setSamplesStoreId(storeId);
      setTabCounts((previous) => previous.storeId === storeId
        ? { ...previous, samples: matching.length }
        : { storeId, messages: null, products: null, samples: matching.length, media: null });
    } catch {
      if (sequence !== sampleLoadSequence.current) return;
      setSamples([]);
      setSamplesLoadError(true);
    } finally {
      if (sequence === sampleLoadSequence.current) setLoadingSamples(false);
    }
  }, []);

  // Load media (chỉ hiện spinner nếu chưa có media)
  const loadStoreMedia = useCallback(async (storeId: string) => {
    setLoadingMedia((prev) => (mediaAssets.length === 0 ? true : prev));
    try {
      const res: any = await api.get('/media', { params: { storeId, limit: 50 } });
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : data?.items || data?.assets || [];
      setMediaAssets(list);
    } catch {
      setMediaAssets([]);
    } finally {
      setLoadingMedia(false);
    }
  }, [mediaAssets.length]);

  useEffect(() => {
    if (!selectedStore?.id) return;
    if (activeTab === 'products') {
      loadStoreProducts(selectedStore.id);
      loadStoreSamples(selectedStore.id);
    }
    else if (activeTab === 'samples') loadStoreSamples(selectedStore.id);
    else if (activeTab === 'media') loadStoreMedia(selectedStore.id);
  }, [selectedStore?.id, activeTab, loadStoreProducts, loadStoreSamples, loadStoreMedia]);

  useEffect(() => {
    const storeId = selectedStore?.id;
    if (activeTab !== 'products' || !storeId) return;
    const refresh = () => { if (!document.hidden) void loadStoreProducts(storeId, true); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      // Invalidate responses for a shop/tab that is no longer selected.
      productLoadSequence.current++;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [activeTab, selectedStore?.id, loadStoreProducts]);

  // Chọn / bỏ chọn sản phẩm để tạo gói deal
  const handleToggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const handleSelectAllProducts = () => {
    if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  // Mở modal Đề xuất Deal hoa hồng riêng (Đơn lẻ hoặc Gói nhiều sản phẩm)
  const handleOpenDealModal = (singleProduct?: any, bulkProducts?: any[]) => {
    let prodsToDeal: any[] = [];
    if (bulkProducts && bulkProducts.length > 0) {
      prodsToDeal = bulkProducts;
    } else if (singleProduct) {
      prodsToDeal = [singleProduct];
    } else if (selectedProductIds.length > 0) {
      prodsToDeal = products.filter((p) => selectedProductIds.includes(p.id));
    } else if (products.length > 0) {
      prodsToDeal = [products[0]];
    }

    if (!prodsToDeal.length) {
      toast.error('Gian hàng chưa có sản phẩm để tạo đề xuất deal.');
      return;
    }

    setDealModalProducts(prodsToDeal);
    setDealModalProduct(prodsToDeal[0]);
    // Mức hoa hồng sàn cao nhất trong danh sách sản phẩm được chọn
    const maxBaseRate = 10;
    setDealProposedRate(maxBaseRate + 1);
    setDealDurationMonths(3);
    const orderCount = prodsToDeal.length > 1 ? 150 : 100;
    setDealOrderCommitment(orderCount);
    const avgPrice = prodsToDeal.reduce((sum, p) => sum + Number(p.price || 250000), 0) / prodsToDeal.length;
    const estimatedRev = Math.round(avgPrice * orderCount).toLocaleString('vi-VN');
    setDealRevenueCommitment(estimatedRev);
    setDealContentPlan(
      prodsToDeal.length > 1
        ? `Quảng bá trọn bộ Combo ${prodsToDeal.length} sản phẩm: 4 Video TikTok chuyên sâu + 2 Phiên Livestream đẩy số`
        : '3 Video TikTok/Reels chuyên sâu + 1 Phiên Livestream đẩy số',
    );
    setDealTermsAccepted(false);
  };

  // Submit đề xuất Deal hoa hồng kèm cam kết qua API thực tế (Cách 1: Đồng loạt)
  const handleSubmitDealProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = dealModalProducts.length > 0 ? dealModalProducts : (dealModalProduct ? [dealModalProduct] : []);
    if (!items.length) return;
    if (!dealTermsAccepted) {
      toast.error('Vui lòng tích cam kết tuân thủ Quy chế thực thi Deal của SCANMS.');
      return;
    }
    const rate = Number(dealProposedRate);
    const maxBaseRate = 10;
    if (rate <= maxBaseRate) {
      toast.error(`Mức hoa hồng đề xuất (${rate}%) phải cao hơn mức sàn cao nhất trong gói (${maxBaseRate}%).`);
      return;
    }
    if (![11, 12, 13].includes(rate)) {
      toast.error('Chỉ chọn thưởng Deal +1%, +2% hoặc +3% trên nền 10%.');
      return;
    }

    setSubmittingDeal(true);
    try {
      const isBundle = items.length > 1;
      const commitmentSummary = isBundle
        ? `[GÓI DEAL ${items.length} SẢN PHẨM] Kỳ hạn: ${dealDurationMonths} tháng | Cam kết: ${dealOrderCommitment} đơn (Mục tiêu ~${dealRevenueCommitment} ₫) | Kế hoạch: ${dealContentPlan.trim()}`
        : `Kỳ hạn: ${dealDurationMonths} tháng | Cam kết: ${dealOrderCommitment} đơn (Mục tiêu ~${dealRevenueCommitment} ₫) | Kế hoạch: ${dealContentPlan.trim()}`;

      // Gửi proposal cho từng sản phẩm trong gói
      for (const item of items) {
        await referralLinksService.createExclusiveDeal({
          videoReviewCommitment: dealTermsAccepted,
          productId: item.id,
          proposedCommissionRate: rate,
          salesCommitment: commitmentSummary,
        });
      }

      toast.success(
        isBundle
          ? `Đã gửi đề xuất Gói Deal cho ${items.length} sản phẩm (${rate}%) vào khung Chat cho Shop!`
          : `Đã gửi đề xuất Deal độc quyền ${rate}% kèm cam kết doanh số vào khung Chat cho Shop!`,
      );
      setDealModalProduct(null);
      setDealModalProducts([]);
      setSelectedProductIds([]);
      setActiveTab('messages');
      if (selectedStore?.id) updateUrl(selectedStore.id, 'messages');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể gửi đề xuất deal.');
    } finally {
      setSubmittingDeal(false);
    }
  };

  // Open Link Generator Modal (Giải pháp 1)
  const handleOpenLinkModal = async (prod: any) => {
    setLinkModalProduct(prod);
    try {
      const url = `${window.location.origin}/products/${prod.id}?ref=kol&utm_source=${selectedChannel.toLowerCase()}`;
      setGeneratedShortlink(url);
      const qrData = await QRCode.toDataURL(url, { width: 320, margin: 2 });
      setGeneratedQr(qrData);
    } catch {
      // Fallback
    }
  };

  const handleChannelChange = async (ch: 'TIKTOK' | 'FACEBOOK' | 'YOUTUBE' | 'INSTAGRAM') => {
    setSelectedChannel(ch);
    if (linkModalProduct) {
      const url = `${window.location.origin}/products/${linkModalProduct.id}?ref=kol&utm_source=${ch.toLowerCase()}`;
      setGeneratedShortlink(url);
      const qrData = await QRCode.toDataURL(url, { width: 320, margin: 2 });
      setGeneratedQr(qrData);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedShortlink) return;
    await navigator.clipboard.writeText(generatedShortlink);
    toast.success(`Đã sao chép link tiếp thị có gắn UTM [${selectedChannel}] vào bộ nhớ tạm!`);
  };

  // Submit sample request (Giải pháp 2)
  const handleEditSampleRequest = (sample: any) => {
    if (sample.status !== 'PENDING') return;
    setSampleRecipientName(sample.recipientName || '');
    setSampleRecipientPhone(sample.recipientPhone || '');
    const addressParts = String(sample.shippingAddress || '').split(',');
    setShippingAddress(addressParts.length >= 4 ? addressParts.slice(0, -3).join(',').trim() : String(sample.shippingAddress || ''));
    setSampleSocialChannelId(sample.socialChannelId || '');
    setSampleContentType(sample.contentType || '');
    setSampleRecipientPhoneConfirmed(false);
    setSampleTermsAccepted(false);
    setRequestSampleModalProduct({ ...sample.product, id: sample.productId || sample.product?.id, _editingRequest: sample });
  };

  const handleSubmitSampleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sampleSubmissionInFlight.current) return;
    const editingRequest = requestSampleModalProduct?._editingRequest;
    if (!editingRequest && !canRequestSample) {
      toast.error(sampleEligibility?.blockReason || 'Cần hoàn tất KYC, liên kết kênh mạng xã hội và không bị Admin khóa quyền nhận mẫu.');
      return;
    }
    if (!requestSampleModalProduct) return;
    const missingAddressIndex = !sampleProvinceId ? 0 : !sampleDistrictId ? 1 : !sampleWardCode ? 2 : -1;
    if (missingAddressIndex >= 0) {
      const message = `Vui lòng chọn ${['Tỉnh/Thành phố', 'Quận/Huyện', 'Phường/Xã'][missingAddressIndex]} nhận hàng trước khi gửi yêu cầu.`;
      setSampleAddressError(message);
      toast.error(message);
      const addressGroup = document.getElementById('sample-delivery-address');
      addressGroup?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      addressGroup?.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="listbox"]')[missingAddressIndex]?.focus({ preventScroll: true });
      return;
    }
    if (!sampleSocialChannelId || !sampleContentType.trim() || !sampleRecipientName.trim() || !sampleRecipientPhone.trim() || !shippingAddress.trim()) {
      toast.error('Vui lòng điền đủ kênh mạng xã hội, định dạng review và thông tin người nhận.');
      return;
    }
    setSampleAddressError('');
    if (!isSamplePhoneValid(sampleRecipientPhone)) {
      toast.error(SAMPLE_PHONE_ERROR);
      return;
    }
    if (!sampleRecipientPhoneConfirmed) {
      toast.error('Vui lòng xác nhận số điện thoại thuộc người nhận và GHN có thể liên hệ.');
      return;
    }
    if (!sampleTermsAccepted) {
      toast.error('Vui lòng xác nhận cam kết nộp video trong 14 ngày sau khi nhận hàng.');
      return;
    }

    sampleSubmissionInFlight.current = true;
    setSubmittingSample(true);
    try {
      const province = sampleProvinces.find((item) => String(item.ProvinceID) === sampleProvinceId);
      const district = sampleDistricts.find((item) => String(item.DistrictID) === sampleDistrictId);
      const ward = sampleWards.find((item) => item.WardCode === sampleWardCode);
      if (!province || !district || !ward) throw new Error('Địa chỉ GHN chưa đầy đủ.');
      const details = {
        recipientName: sampleRecipientName.trim(),
        recipientPhone: normalizeSamplePhone(sampleRecipientPhone),
        recipientPhoneConfirmed: true,
        shippingAddress: [shippingAddress.trim(), ward.WardName, district.DistrictName, province.ProvinceName].join(', '),
        ghnProvinceId: province.ProvinceID,
        ghnDistrictId: district.DistrictID,
        ghnWardCode: ward.WardCode,
        socialChannelId: sampleSocialChannelId,
        contentType: sampleContentType,
        termsAccepted: true,
      };
      if (editingRequest) {
        await api.patch(`/sample-requests/${editingRequest.id}/details`, details);
      } else {
        await api.post('/sample-requests', {
          ...details, productId: requestSampleModalProduct.id,
          productVariantId: requestSampleModalProduct.productVariantId,
        });
      }
      setRequestSampleModalProduct(null);
setActiveTab('samples');
      setSampleStatusFilter('ALL');
      if (selectedStore?.id) {
        updateUrl(selectedStore.id, 'samples');
        void loadStoreSamples(selectedStore.id);
      }
      toast.success(editingRequest ? 'Đã cập nhật yêu cầu và gửi lại Shop chờ duyệt.' : `Đã gửi yêu cầu nhận mẫu "${requestSampleModalProduct.title}" kèm cam kết video trong 14 ngày sau khi nhận hàng.`);
    } catch (err: any) {
      const message = String(err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu xin mẫu.');
      const duplicateRequest = message.includes('Bạn đã có yêu cầu xin mẫu cho sản phẩm này đang được xử lý');
      if (duplicateRequest || (editingRequest && (err.status === 409 || err.response?.status === 409))) {
        setRequestSampleModalProduct(null);
        setActiveTab('samples');
        setSampleStatusFilter('ALL');
        updateUrl(selectedStore.id, 'samples');
        toast.error(editingRequest ? message : 'Bạn đã có yêu cầu cho sản phẩm này. Xem tại tab Hàng mẫu.');
      } else {
        toast.error(message);
      }
      void loadStoreSamples(selectedStore.id);
    } finally {
      sampleSubmissionInFlight.current = false;
      setSubmittingSample(false);
    }
  };

  // KOL confirms receiving sample -> starts countdown
  const handleConfirmReceivedSample = async (sampleId: string) => {
    try {
      await api.patch(`/sample-requests/${sampleId}/receive`, {});
      toast.success('Đã xác nhận nhận hàng! Bạn có 14 ngày để nộp video review.');
      if (selectedStore?.id) await loadStoreSamples(selectedStore.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Không thể xác nhận đã nhận hàng.');
    }
  };
  // Connect new store
  const handleConnectStore = async (store: any) => {
    setConnectingStoreId(store.id);
    try {
      await api.post('/store-collaborators/request', { storeId: store.id });
      await api.post('/chat/conversations', { storeId: store.id });
      toast.success(`Đã gửi yêu cầu hợp tác tới ${store.name}, chờ Shop duyệt.`);
      setShowDiscoverModal(false);
      await loadConversationsAndStores();
      setSelectedStoreId(store.id);
      setActiveTab('messages');
      updateUrl(store.id, 'messages');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể kết nối gian hàng');
    } finally {
      setConnectingStoreId(null);
    }
  };

  const loadMarketplaceStores = async () => {
    setLoadingMarketplace(true);
    try {
      const res: any = await api.get('/stores/marketplace');
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setMarketplaceStores(list);
    } catch {
      setMarketplaceStores([]);
    } finally {
      setLoadingMarketplace(false);
    }
  };

  // Filtered stores
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchShopQuery.toLowerCase()) ||
        (s.category || '').toLowerCase().includes(searchShopQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (shopFilter === 'CHAT') return Boolean(s.unreadCount);
      if (shopFilter === 'SAMPLES') return Boolean(s.pendingSamplesCount);
      if (shopFilter === 'HIGH_COMM')
        return Number(s.defaultCommissionRate || 0) >= 15;
      return true;
    });
  }, [stores, searchShopQuery, shopFilter]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase('vi');
    if (!query) return products;
    return products.filter((product) =>
      (product.title || '').toLocaleLowerCase('vi').includes(query) ||
      (product.sku || '').toLocaleLowerCase('vi').includes(query),
    );
  }, [products, productSearch]);

  return (
    <div
      className="w-full flex flex-col gap-3 max-w-[1600px] mx-auto h-[calc(100dvh-110px)] min-h-[480px] max-h-[900px]"
      id="partner-collaboration-workspace"
    >
      {/* Top Warning Banner nếu KOL chưa xác minh */}
      {!loadingKyc && !canRequestSample && (
        <div className="shrink-0 bg-[#FBF5EB] border border-[#EAE4D7] px-4 py-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#B88E4F]">
            <ShieldAlert className="w-4 h-4 text-[#B88E4F] shrink-0" />
            <span>
              <strong>Lưu ý:</strong> Cần hoàn tất KYC, liên kết ít nhất một kênh mạng xã hội và không bị khóa quyền nhận mẫu để xin mẫu. Quyết định khóa/mở khóa do Admin xét duyệt.
              {sampleEligibility?.blockReason ? ` ${sampleEligibility.blockReason}` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => sampleEligibility?.isBlocked ? setActiveTab('messages') : navigate('/collaborator/profile?tab=kyc')}
            className="px-3 py-1 bg-[#EBD08C] hover:bg-[#DEC07A] text-white font-extrabold rounded-xl transition shadow-2xs shrink-0 cursor-pointer"
          >
            {sampleEligibility?.isBlocked ? 'Liên hệ gian hàng để giải trình' : 'Hoàn tất KYC ngay →'}
          </button>
        </div>
      )}

      {/* Main Unified Workspace */}
      <div className="flex-1 min-h-0 bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_2px_8px_rgba(35,29,21,0.03)]">
        {/* LEFT COLUMN: Danh Sách Gian Hàng Tinh Gọn (Có thể thu nhỏ chỉ hiện icon) */}
        <div
          data-collapsed={isSidebarCollapsed}
          className={`${
            isSidebarCollapsed ? 'w-full md:w-[64px]' : 'w-full md:w-[260px] xl:w-[275px]'
          } shrink-0 border-b md:border-b-0 md:border-r border-[#EAE4D7] bg-[#FAF8F5]/60 flex flex-col h-auto md:h-full transition-all duration-300 select-none`}
        >
          {isSidebarCollapsed ? (
            /* COLLAPSED VIEW: Chỉ hiển thị icon gian hàng, bấm icon trên đỉnh để mở rộng */
            <>
              <div className="shrink-0 p-2.5 border-b border-[#EAE4D7] bg-white/95 backdrop-blur-xs flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSidebarCollapse}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#7D715E] hover:text-[#B88E4F] transition shadow-2xs cursor-pointer active:scale-95"
                  title="Mở rộng thanh gian hàng"
                  aria-label="Mở rộng thanh gian hàng"
                >
                  <ChevronRight className="w-4 h-4 text-[#B88E4F]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscoverModal(true);
                    loadMarketplaceStores();
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#FBF5EB] hover:bg-[#F3EFE6] border border-[#EEDFC6] text-[#B88E4F] transition shadow-2xs cursor-pointer active:scale-95"
                  title="Khám phá gian hàng trên Sàn"
                  aria-label="Khám phá gian hàng trên Sàn"
                >
                  <Plus className="w-3.5 h-3.5 text-[#B88E4F]" />
                </button>
              </div>

              {/* Stores List: Chỉ hiển thị icon avatar gian hàng */}
              <div className="flex-1 overflow-x-auto md:overflow-y-auto py-2 flex flex-row md:flex-col items-center gap-2 no-scrollbar" role="list">
                {filteredStores.map((st) => {
                  const isSelected = selectedStore ? st.id === selectedStore.id : false;
                  return (
                    <div key={st.id} className="relative group">
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedStoreId(st.id);
                          updateUrl(st.id, activeTab);
                        }}
                        title={`${st.name} • ${st.lastMessageText || `Hoa hồng: ${st.commissionRange || '10% - 21%'}`}`}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FBF5EB] ring-2 ring-[#C59B58] shadow-xs'
                            : 'hover:bg-white hover:shadow-2xs opacity-85 hover:opacity-100'
                        }`}
                      >
                        <StoreAvatar
                          name={st.ownerName || st.name}
                          logoUrl={st.ownerAvatarUrl || st.logoUrl}
                          className="w-8.5 h-8.5 rounded-lg border border-[#EAE4D7] bg-white shadow-2xs text-[11px]"
                        />
                        {st.unreadCount ? (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#EBD08C] border-2 border-white ring-1 ring-[#C59B58]/30 animate-pulse" />
                        ) : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* EXPANDED VIEW: Tinh gọn, thanh mảnh, có nút thu nhỏ */
            <>
              {/* Top Search & Filter Bar */}
              <div className="shrink-0 p-2.5 border-b border-[#EAE4D7] bg-white/95 backdrop-blur-xs flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7D715E]" />
                    <input
                      id="search-partner-store"
                      type="text"
                      aria-label="Tìm gian hàng đối tác"
                      placeholder="Tìm gian hàng..."
                      value={searchShopQuery}
                      onChange={(e) => setSearchShopQuery(e.target.value)}
                      className="w-full pl-7.5 pr-2 py-1.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs font-medium text-[#1A1612] placeholder:text-[#7D715E]/70 focus:bg-white focus:outline-none focus:border-[#C59B58] transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={toggleSidebarCollapse}
                    className="w-7.5 h-7.5 rounded-xl flex items-center justify-center bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#7D715E] hover:text-[#B88E4F] transition shadow-2xs shrink-0 cursor-pointer active:scale-95"
                    title="Thu gọn thanh bên (chỉ hiện icon)"
                    aria-label="Thu gọn thanh bên"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#B88E4F]" />
                  </button>
                </div>

                {/* Filter chips */}
                <div className="flex items-center justify-between px-1 py-0.5 border-b border-[#EAE4D7]/50" aria-label="Lọc danh sách gian hàng">
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'CHAT', label: 'Tin mới' },
                    { id: 'SAMPLES', label: 'Mẫu thử' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={shopFilter === f.id}
                      onClick={() => setShopFilter(f.id as any)}
                      className={`pb-1 text-[11px] font-bold transition cursor-pointer ${
                        shopFilter === f.id
                          ? 'text-[#B88E4F] border-b-2 border-[#B88E4F]'
                          : 'text-[#7D715E] hover:text-[#1A1612] border-b-2 border-transparent'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Nút khám phá gian hàng như bố cục cũ */}
                <button
                  id="btn-discover-stores"
                  type="button"
                  onClick={() => {
                    setShowDiscoverModal(true);
                    loadMarketplaceStores();
                  }}
                  className="w-full py-1 text-[#B88E4F] hover:text-[#9A7233] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer select-none group"
                >
                  <Plus className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span className="truncate">Khám phá gian hàng trên Sàn</span>
                </button>

              </div>

              {/* Stores List: Gọn gàng */}
              <div className="flex-1 overflow-x-auto md:overflow-y-auto divide-y divide-[#EAE4D7]/50" role="list">
                {filteredStores.length === 0 ? (
                  <div className="py-12 px-4 text-center text-xs text-[#7D715E] space-y-2.5">
                    <div className="w-10 h-10 mx-auto rounded-full bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F]">
                      <MessageSquare className="w-5 h-5 stroke-1" />
                    </div>
                    <p className="font-semibold text-[#1A1612]">Chưa có cuộc trò chuyện nào</p>
                    <p className="text-[11px] text-[#7D715E] leading-relaxed max-w-[200px] mx-auto">
                      Khám phá các gian hàng đối tác để bắt đầu trao đổi & nhận mẫu thử.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDiscoverModal(true);
                        loadMarketplaceStores();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EEDFC6] text-xs font-bold text-[#B88E4F] hover:bg-[#FBF5EB] hover:border-[#C59B58] transition shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Khám phá gian hàng</span>
                    </button>
                  </div>
                ) : (
                  filteredStores.map((st) => {
                    const isSelected = selectedStore ? st.id === selectedStore.id : false;
                    return (
                      <div
                        key={st.id}
                        id={`shop-item-${st.id}`}
                        data-selected={isSelected}
                        className={`px-3 py-2.5 flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-[#FBF5EB] border-l-4 border-l-[#C59B58] text-[#1A1612]'
                            : 'hover:bg-[#FAF8F5] text-[#1A1612] border-l-4 border-l-transparent'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => openStorefront(st)}
                            title={`Mở gian hàng ${st.name}`}
                            aria-label={`Mở gian hàng ${st.name}`}
                            className="rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]"
                          >
                            <StoreAvatar
                              name={st.ownerName || st.name}
                              logoUrl={st.ownerAvatarUrl || st.logoUrl}
                              className="w-9 h-9 rounded-xl border border-[#EAE4D7] bg-white shadow-2xs text-xs"
                            />
                          </button>
                          {st.unreadCount ? (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#EBD08C] border-2 border-white ring-1 ring-[#C59B58]/30 animate-pulse" />
                          ) : null}
                        </div>

                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => {
                            setSelectedStoreId(st.id);
                            updateUrl(st.id, activeTab);
                          }}
                          className="flex-1 min-w-0 text-left cursor-pointer bg-transparent border-0 p-0"
                          aria-label={`Mở cuộc trò chuyện với ${st.name}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <strong className="text-xs font-bold truncate text-[#1A1612] leading-snug" title={st.name}>
                              {st.name}
                            </strong>
                            {st.lastMessageAt && (
                              <span className="text-[10px] text-[#7D715E]/80 shrink-0 font-medium">
                                {formatConvTime(st.lastMessageAt)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-0.5">
<span
                              className={`text-[11px] truncate leading-tight flex-1 min-w-0 ${
                                st.unreadCount ? 'font-bold text-[#1A1612]' : 'text-[#7D715E]'
                              }`}
                              title={st.lastMessageText || 'Bắt đầu cuộc trò chuyện'}
                            >
                              {st.lastMessageText || 'Bắt đầu cuộc trò chuyện...'}
                            </span>
                            <span className="text-[9.5px] font-extrabold text-[#B88E4F] bg-[#FBF5EB] px-1.5 py-0.2 rounded border border-[#EEDFC6] shrink-0">
                              {st.commissionRange || `${st.defaultCommissionRate || 10}%`}
                            </span>
                            {st.unreadCount ? (
                              <span className="w-2 h-2 rounded-full bg-[#C59B58] shrink-0" />
                            ) : null}
                          </div>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Không Gian Làm Việc 1-1 Với Shop */}
        <div className="collaboration-chat-pane flex-1 h-full min-h-0 flex flex-col min-w-0 bg-white overflow-hidden" onScrollCapture={handleContentScroll}>
          {!selectedStore ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF8F5]">
              <div className="w-14 h-14 rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center mb-3 shadow-2xs">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-[#1A1612] m-0">Chưa có cuộc trò chuyện nào</h3>
              <p className="text-xs text-[#7D715E] max-w-sm mt-1.5 mb-4 leading-relaxed">
                Bạn chưa nhắn tin với gian hàng nào. Hãy khám phá các gian hàng đối tác uy tín trên sàn SCANMS để bắt đầu trao đổi hoặc xin mẫu thử sản phẩm.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowDiscoverModal(true);
                  loadMarketplaceStores();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Khám phá gian hàng</span>
              </button>
            </div>
          ) : (
            <>
              {/* Shop Context Header Bar */}
              <div className="collaboration-context-bar" data-compact={compactContext}>
              <div className="collaboration-shop-heading shrink-0 px-4 py-3 border-b border-[#EAE4D7] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => openStorefront(selectedStore)}
                    title={`Mở gian hàng ${selectedStore.name}`}
                    aria-label={`Mở gian hàng ${selectedStore.name}`}
                    className="rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58] shrink-0"
                  >
                    <StoreAvatar
                      name={selectedStore.ownerName || selectedStore.name}
                      logoUrl={selectedStore.ownerAvatarUrl || selectedStore.logoUrl}
                      className="collaboration-context-avatar w-10 h-10 rounded-xl border border-[#EAE4D7] shadow-2xs text-sm"
                    />
                  </button>

<div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openStorefront(selectedStore)}
                        className="collaboration-context-name text-sm font-extrabold text-[#1A1612] truncate m-0 p-0 bg-transparent border-0 hover:text-[#B88E4F] cursor-pointer"
                        title={`Mở gian hàng ${selectedStore.name}`}
                      >
                        {selectedStore.name}
                      </button>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7]">
                        <CheckCircle2 className="w-3 h-3 text-[#B88E4F]" /><span className="collaboration-verified-label">Đã xác minh</span>
                      </span>
                    </div>

                    <div className="collaboration-context-meta flex flex-wrap items-center gap-2 text-[11px] text-[#7D715E] mt-0.5">
                      <span className="flex items-center gap-1 text-[#B88E4F] font-semibold">
                        <Star className="w-3 h-3 fill-[#C59B58] text-[#B88E4F]" />
                        <span>{selectedStore.rating || 4.9}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-[#B88E4F]" />
                        <span>Hoa hồng: <strong className="text-[#B88E4F]">{selectedStore.commissionRange || (selectedStore.defaultCommissionRate ? `${selectedStore.defaultCommissionRate}%` : '10%')}</strong></span>
                      </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#7D715E]" />
                    <span>{selectedStore.location || 'TP.HCM'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Nút Xem Trang Gian Hàng Trên Sàn nhẹ nhàng */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={selectedStore.slug
                  ? `/shop/${encodeURIComponent(selectedStore.slug)}`
                  : `/marketplace?shop=${encodeURIComponent(selectedStore.id)}`}
                target="_blank"
                rel="noreferrer"
                className="collaboration-store-link inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EAE4D7] bg-white text-[#1A1612] text-xs font-semibold hover:bg-[#F3EFE6] hover:border-[#C59B58] transition cursor-pointer group shrink-0 select-none"
                aria-label={`Xem gian hàng ${selectedStore.name}`}
                title={`Xem gian hàng ${selectedStore.name} trên Sàn`}
              >
                <span>Xem gian hàng</span>
                <ExternalLink className="w-3 h-3 text-[#B88E4F]" />
              </a>
            </div>
          </div>

          {/* Sub-Tabs Bar: Vừa Vặn 100%, Nhãn Ngắn Gọn, Không Bị Tràn Chữ */}
          <div className="collaboration-context-cooperation"><StoreCooperationPanel key={selectedStoreId} mode="kol" storeId={selectedStoreId || undefined} /></div>
          <div
            className="collaboration-context-tabs shrink-0 px-3 sm:px-4 py-2.5 border-b border-[#EAE4D7] bg-white grid grid-cols-2 sm:grid-cols-4 items-stretch gap-2"
            role="tablist"
            aria-label="Nội dung hợp tác với gian hàng"
          >
            {[
              { id: 'messages', label: 'Tin nhắn', icon: MessageSquare },
              { id: 'products', label: 'Sản phẩm', icon: Package },
              { id: 'samples', label: 'Hàng mẫu', icon: Truck },
              { id: 'media', label: 'Kho nội dung', icon: Sparkles },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const count = tabCounts.storeId === selectedStore.id
                  ? tabCounts[tab.id as 'messages' | 'products' | 'samples' | 'media'] : null;
              return (
                <button
                  key={tab.id}
                  id={`subtab-${tab.id}`}
                  type="button"
                  role="tab"
                  title={tab.label}
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    updateUrl(selectedStore.id, tab.id);
                  }}
                  className={`flex min-w-0 min-h-[42px] items-center justify-center gap-2 px-2 sm:px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer select-none border ${
                    isActive
                      ? 'bg-[#FBF5EB] text-[#1A1612] shadow-2xs border-[#C59B58]'
                      : 'bg-white text-[#7D715E] border-[#EAE4D7] hover:text-[#1A1612] hover:bg-[#FAF8F5] hover:border-[#EEDFC6]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#B88E4F]' : 'text-[#7D715E]'}`} />
                  <span className="collaboration-tab-label">{tab.label}</span>
                  <span className="inline-flex min-w-[24px] h-6 shrink-0 items-center justify-center rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-1.5 text-[11px] font-bold tabular-nums text-[#795A2D]"
                    aria-label={count === null ? 'Chưa có số liệu' : `${count} ${tab.id === 'messages' ? 'tin nhắn trong cuộc trò chuyện' : tab.id === 'products' ? 'sản phẩm' : tab.id === 'samples' ? 'yêu cầu mẫu' : 'nội dung'}`}
                    title={tab.id === 'messages' ? 'Tổng số tin nhắn, gồm cả tin đã đọc và thẻ deal' : 'Tổng số của gian hàng đang chọn'}>
                    {count === null ? '—' : count}
                  </span>
                </button>
              );
            })}
          </div>
          </div>

          {/* SUB-TAB CONTENTS */}
          <div data-collaboration-content className="flex-1 min-h-0 relative overflow-hidden flex flex-col bg-white">
            {/* 1. CHAT TAB */}
            {activeTab === 'messages' && (
              <div className="h-full w-full overflow-hidden animate-in fade-in-50 duration-200 flex flex-col">
                {/* Thanh Deal Bar Đàm Phán Hoa Hồng VIP Tinh Tế */}
                <div className="bg-white border-b border-[#EAE4D7] px-4 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
                  <div className="flex items-center gap-2 text-[#B88E4F]">
                    <Handshake className="w-4 h-4 text-[#B88E4F] shrink-0" />
                    <span className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <strong className="text-[#1A1612]">Thỏa thuận hoa hồng</strong>
                      <span className="text-[#7D715E]">Đề xuất thưởng VIP +1%, +2% hoặc +3%; Shop duyệt trước khi áp dụng.</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/collaborator/marketing?tab=links')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#EAE4D7] text-[#B88E4F] font-semibold hover:bg-[#FAF8F5] transition shrink-0 cursor-pointer"
                  >
                    <Plus size={13} aria-hidden="true" /> Đề xuất deal VIP
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <ChatBoxPage
                    embedded
                    targetStoreId={selectedStore.id}
                    targetStoreName={selectedStore.name}
                    targetStoreLogo={selectedStore.logoUrl}
                    hideSidebar
                    hideHeaderInChat
                    initialProductContext={initialProductContext}
                    className="h-full w-full border-0 rounded-none shadow-none bg-white"
                  />
                </div>
              </div>
            )}

            {/* Các Tab còn lại */}
            {activeTab !== 'messages' && (
              <div ref={tabScrollRef} className={`collaboration-tab-scroll h-full w-full overflow-y-auto ${activeTab === 'products' ? 'p-4' : 'p-5 space-y-4'}`}>
                {/* 2. PRODUCTS & SMART REFERRAL LINKS */}
                {activeTab === 'products' && (
                  <div className="grid content-start gap-3.5 min-w-0 animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between flex-wrap gap-4 min-w-0 p-3.5 sm:px-4 border border-[#EAE4D7] rounded-xl bg-white">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <h3 className="m-0 text-sm sm:text-base font-bold text-[#1A1612]">
                          Kho sản phẩm <span className="text-[#B88E4F]">{selectedStore.name}</span>
                        </h3>
                        <span className="px-2 py-0.5 border border-[#EEDFC6] rounded-full bg-[#FBF5EB] text-[#8D6936] text-[10px] font-bold whitespace-nowrap">{products.length} sản phẩm</span>
                        <button type="button" disabled={loadingProducts} onClick={() => { void loadStoreProducts(selectedStore.id); void loadStoreSamples(selectedStore.id); }} className="rounded-lg border border-[#EEDFC6] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#795A2D] hover:bg-[#FBF5EB] disabled:opacity-50">
                          Làm mới sản phẩm
                        </button>
                        <p className="w-full text-xs text-[#7D715E] m-0">
                          Chính sách hoa hồng mở tự do &amp; độc quyền đối tác VIP
                        </p>
                      </div>

                      <label className="flex items-center gap-2 px-3 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-xs text-[#7D715E] focus-within:border-[#C59B58] w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <input
                          type="text"
                          placeholder="Lọc theo tên, SKU..."
                          aria-label="Lọc sản phẩm theo tên hoặc SKU"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full bg-transparent border-0 outline-none text-[#1A1612] text-xs"
                        />
                      </label>
                    </div>

                    {/* Multi-select Action Bar */}
                    {filteredProducts.length > 0 && (
                      <div className="flex items-center justify-between flex-wrap gap-2.5 p-2.5 px-3.5 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB]">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[#1A1612]">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                              onChange={handleSelectAllProducts}
                              className="rounded border-[#DEBE85] text-[#C59B58] focus:ring-[#C59B58] w-4 h-4 cursor-pointer"
                            />
                            <span>Chọn tất cả ({filteredProducts.length} sản phẩm)</span>
                          </label>
                          {selectedProductIds.length > 0 && (
                            <span className="text-xs text-[#8D6936] font-semibold">
                              (Đã chọn <strong className="text-[#B88E4F]">{selectedProductIds.length}</strong> món)
                            </span>
                          )}
                        </div>

                        {selectedProductIds.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedProductIds([])}
                              className="px-2.5 py-1 text-xs text-[#7D715E] hover:text-[#1A1612] font-semibold cursor-pointer"
                            >
                              Bỏ chọn
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDealModal(undefined, products.filter((p) => selectedProductIds.includes(p.id)))}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                            >
                              <Sparkles size={13} />
                              <span>Đề xuất Deal Gói ({selectedProductIds.length} món)</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#7D715E] italic">
                            Tích chọn nhiều sản phẩm để gửi đề xuất Deal Gói đồng loạt tới Shop.
                          </span>
                        )}
                      </div>
                    )}

                    {loadingProducts ? (
                      <div className="grid place-items-center gap-2 min-h-[140px] p-6 border border-dashed border-[#EAE4D7] rounded-xl bg-white text-[#7D715E] text-xs text-center" role="status">
                        <Loader2 className="w-5 h-5 text-[#B88E4F] animate-spin" aria-hidden="true" />
                        <span>Đang tải danh sách sản phẩm...</span>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="grid place-items-center gap-2 min-h-[140px] p-6 border border-dashed border-[#EAE4D7] rounded-xl bg-white text-[#7D715E] text-xs text-center">
                        {productsLoadError ? 'Chưa tải được sản phẩm. Bấm Làm mới sản phẩm để thử lại.' : products.length === 0 ? 'Chưa có sản phẩm đang bán đã được Admin duyệt tại gian hàng này. Bật xin mẫu không tự duyệt sản phẩm.' : 'Không tìm thấy sản phẩm phù hợp.'}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 min-w-0">
                        {filteredProducts.map((prod) => {
                            const sampleHistoryReady = samplesStoreId === selectedStore.id;
                            const productSamples = sampleHistoryReady
                              ? samples.filter((sample) => (sample.productId || sample.product?.id) === prod.id)
                              : [];
                            const activeSample = productSamples.find((sample) => [
                              'PENDING', 'APPROVED', 'SHIPPED', 'RECEIVED', 'VIDEO_SUBMITTED',
                              'REVISION_REQUIRED', 'OVERDUE', 'DELIVERY_ISSUE',
                            ].includes(sample.status));
                            const sampleStatusLabels: Record<string, string> = {
                              PENDING: 'Đã xin mẫu · Chờ duyệt', APPROVED: 'Đã duyệt mẫu',
                              SHIPPED: 'Mẫu đang giao', RECEIVED: 'Đã nhận mẫu · Chờ review',
                              VIDEO_SUBMITTED: 'Đã nộp review', REVISION_REQUIRED: 'Cần sửa review',
                              OVERDUE: 'Mẫu quá hạn review', DELIVERY_ISSUE: 'Mẫu có sự cố giao hàng',
                              COMPLETED: 'Đã hoàn thành mẫu', REJECTED: 'Yêu cầu trước bị từ chối',
                              CANCELLED: 'Yêu cầu trước đã hủy',
                            };
                            const displayedSample = activeSample || productSamples[0];
                            const isExclusive = prod.policyType === 'EXCLUSIVE';
                            const canRequestThisProduct = Boolean(
                              sampleHistoryReady && !activeSample && canRequestSample && prod.sampleEnabled === true && Number(prod.sampleQuota || 0) > Number(prod.sampleGrantedCount || 0),
                            );
                            const isSelectedForBundle = selectedProductIds.includes(prod.id);
                            const commRate = 10;
                            const commAmount = Math.round((Number(prod.price || 0) * commRate) / 100);

                            return (
                              <div
                                key={prod.id}
                                className={`grid grid-rows-[1fr_auto_auto] content-start gap-2.5 min-w-0 p-3 border rounded-xl bg-white shadow-2xs transition ${
                                  isSelectedForBundle ? 'border-[#C59B58] ring-1 ring-[#C59B58]/30 bg-[#FBF5EB]/20 shadow-xs' : 'border-[#EAE4D7] hover:border-[#E2C99F] hover:shadow-sm'
                                }`}
                              >
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className="relative shrink-0">
                                    <img
                                      src={prod.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150'}
                                      alt={prod.title}
                                      className="w-[68px] h-[72px] border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] object-contain"
                                    />
                                    <label
                                      className="absolute -top-1.5 -left-1.5 p-0.5 rounded-md bg-white border border-[#EAE4D7] shadow-xs cursor-pointer hover:border-[#C59B58]"
                                      title="Chọn sản phẩm này vào gói Deal"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelectedForBundle}
                                        onChange={() => handleToggleProductSelection(prod.id)}
                                        className="rounded border-[#DEBE85] text-[#C59B58] focus:ring-[#C59B58] w-3.5 h-3.5 block cursor-pointer"
                                      />
                                    </label>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1 min-w-0">
                                      <span className="text-[10px] text-[#7D715E] font-mono font-medium truncate">
                                        {prod.sku || 'SKU'}
                                      </span>
                                      {isExclusive ? (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-[#EEDFC6] bg-[#FBF5EB] text-[#9B7136] whitespace-nowrap">
                                          Deal VIP
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#F3EFE6] text-[#74664F] whitespace-nowrap">
                                          Mở tự do
                                        </span>
                                      )}
                                    </div>
                                    <strong className="line-clamp-2 mt-1 text-[#1A1612] text-xs font-semibold leading-snug">
                                      {prod.title}
                                    </strong>
                                    <div className="flex items-baseline gap-1.5 mt-1 text-[#1A1612] text-base font-bold tabular-nums">
                                      <span>
                                        {Number(prod.price).toLocaleString('vi-VN')} ₫
                                      </span>
                                      {prod.originalPrice && (
                                        <span className="text-[10px] text-[#7D715E] line-through font-normal">
                                          {Number(prod.originalPrice).toLocaleString('vi-VN')} ₫
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {displayedSample && <button type="button"
                                  onClick={() => { setActiveTab('samples'); updateUrl(selectedStore.id, 'samples'); }}
                                  className="rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-2 py-1.5 text-left text-xs font-semibold text-[#795A2D]"
                                  title="Xem yêu cầu trong tab Hàng mẫu">
                                  {sampleStatusLabels[displayedSample.status] || 'Đã từng xin mẫu'} · Xem yêu cầu
                                </button>}
                                {!sampleHistoryReady && samplesLoadError && <button type="button"
                                  onClick={() => void loadStoreSamples(selectedStore.id)}
                                  className="text-left text-xs text-[#DC2626]">Chưa tải được lịch sử mẫu · Thử lại</button>}
                                {/* Commission box */}
                                <div className="flex items-center justify-between gap-2 p-2 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB]">
                                  <span className="text-[10px] text-[#7D715E]">Hoa hồng nền</span>
                                  <strong className="text-[#A77C3D] text-xs font-bold leading-normal text-right">
                                    {commRate}% (~{commAmount.toLocaleString('vi-VN')} ₫/đơn)
                                  </strong>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-1.5 pt-2.5 border-t border-[#EAE4D7]">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenLinkModal(prod)}
                                    className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-2 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#795A2D] text-xs font-bold hover:bg-[#F3EFE6] hover:border-[#C59B58] transition cursor-pointer"
                                  >
                                    <Link2 className="w-3.5 h-3.5 text-[#A77C3D]" />
                                    <span>Lấy Link Tiếp Thị</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!canRequestSample) {
                                        toast.error(sampleEligibility?.blockReason || 'Cần hoàn tất KYC và liên kết kênh mạng xã hội trước khi xin mẫu.');
                                        return;
                                      }
                                      if (!canRequestThisProduct) {
                                        toast.error('Shop hiện chưa bật cấp mẫu cho sản phẩm này hoặc đã hết hạn mức.');
                                        return;
                                      }
                                      setSampleTermsAccepted(false);
                                      setSampleRecipientName('');
                                      setSampleRecipientPhone('');
                                      setSampleRecipientPhoneConfirmed(false);
                                      setShippingAddress('');
                                      setRequestSampleModalProduct(prod);
                                    }}
                                    disabled={!canRequestThisProduct}
                                    className="inline-flex items-center justify-center gap-1.5 min-h-[36px] px-2 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-xs font-bold hover:bg-[#FBF5EB] hover:border-[#EEDFC6] transition cursor-pointer disabled:bg-[#FAF8F5] disabled:text-[#9A8E7C] disabled:cursor-not-allowed"
                  title={!sampleHistoryReady ? 'Cần tải lịch sử mẫu trước khi đăng ký' : activeSample ? 'Bạn đã có yêu cầu đang xử lý. Xem tab Hàng mẫu.' : !canRequestSample ? (sampleEligibility?.blockReason || 'Hoàn tất KYC và liên kết kênh mạng xã hội để mở khóa') : !canRequestThisProduct ? 'Shop chưa bật cấp mẫu hoặc đã hết hạn mức' : 'Xin mẫu dùng thử'}
                                  >
                                    <Truck className="w-3.5 h-3.5 text-[#B88E4F]" />
                                    <span>{!sampleHistoryReady ? (samplesLoadError ? 'Chưa tải lịch sử' : 'Đang kiểm tra mẫu…') : activeSample ? 'Đã xin mẫu' : !canRequestSample ? 'Khóa điều kiện' : canRequestThisProduct ? (displayedSample ? 'Xin mẫu lại' : 'Xin mẫu thử') : 'Chưa cấp mẫu'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenDealModal(prod)}
                                    className="col-span-2 inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2.5 py-1.5 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] text-[#8D6936] text-[11px] font-bold hover:bg-[#FBF5EB] hover:border-[#C59B58] hover:text-[#B88E4F] transition cursor-pointer"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" />
                                    <span>Đề xuất Deal hoa hồng riêng với Shop</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SAMPLES TAB - 4 BƯỚC */}
                {activeTab === 'samples' && (
                  <div className="grid content-start gap-3 min-w-0 animate-in fade-in-50 duration-200">
                    <section className="grid gap-3 min-w-0 p-3.5 border border-[#EAE4D7] rounded-xl bg-white" aria-labelledby="sample-guide-title">
                      <div className="flex items-center justify-between gap-3 min-w-0 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="grid place-items-center shrink-0 w-9 h-9 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#B88E4F]"><Package size={17} aria-hidden="true" /></span>
                          <div>
                            <h3 id="sample-guide-title" className="m-0 text-[#1A1612] text-sm font-bold">Quy trình nhận hàng mẫu</h3>
                            <p className="m-0 mt-0.5 text-[#7D715E] text-xs">Theo dõi từ lúc đăng ký đến khi video được nghiệm thu.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('products');
                            updateUrl(selectedStore.id, 'products');
                          }}
                          className="inline-flex items-center justify-center gap-1.5 shrink-0 min-h-[34px] px-2.5 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#1A1612] text-xs font-bold hover:bg-[#F3EFE6] hover:border-[#C59B58] transition cursor-pointer"
                        >
                          <Plus size={14} aria-hidden="true" />Tìm sản phẩm
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        <div className="flex items-start gap-2 p-2 border border-[#EAE4D7] rounded-lg bg-[#FFFEFC]">
                          <span className="grid place-items-center shrink-0 w-[22px] h-[22px] rounded-md bg-[#FBF5EB] text-[#A77C3D] text-[10px] font-bold tabular-nums">01</span>
                          <div className="grid gap-0.5 min-w-0"><strong className="text-[#1A1612] text-xs font-semibold">Đăng ký &amp; cam kết</strong><span className="text-[#7D715E] text-[10px]">Kênh đăng và thời hạn nội dung</span></div>
                        </div>
                        <div className="flex items-start gap-2 p-2 border border-[#EAE4D7] rounded-lg bg-[#FFFEFC]">
                          <span className="grid place-items-center shrink-0 w-[22px] h-[22px] rounded-md bg-[#FBF5EB] text-[#A77C3D] text-[10px] font-bold tabular-nums">02</span>
                          <div className="grid gap-0.5 min-w-0"><strong className="text-[#1A1612] text-xs font-semibold">Shop duyệt &amp; giao hàng</strong><span className="text-[#7D715E] text-[10px]">Theo dõi trạng thái và vận đơn</span></div>
                        </div>
                        <div className="flex items-start gap-2 p-2 border border-[#EAE4D7] rounded-lg bg-[#FFFEFC]">
                          <span className="grid place-items-center shrink-0 w-[22px] h-[22px] rounded-md bg-[#FBF5EB] text-[#A77C3D] text-[10px] font-bold tabular-nums">03</span>
                          <div className="grid gap-0.5 min-w-0"><strong className="text-[#1A1612] text-xs font-semibold">GHN xác nhận giao</strong><span className="text-[#7D715E] text-[10px]">Bắt đầu thời hạn nộp nội dung</span></div>
                        </div>
                        <div className="flex items-start gap-2 p-2 border border-[#EAE4D7] rounded-lg bg-[#FFFEFC]">
                          <span className="grid place-items-center shrink-0 w-[22px] h-[22px] rounded-md bg-[#FBF5EB] text-[#A77C3D] text-[10px] font-bold tabular-nums">04</span>
                          <div className="grid gap-0.5 min-w-0"><strong className="text-[#1A1612] text-xs font-semibold">Nộp bài &amp; nghiệm thu</strong><span className="text-[#7D715E] text-[10px]">Gửi video để Shop xác nhận</span></div>
                        </div>
                      </div>
                    </section>

                    {/* Banners cảnh báo hạn nộp video / khóa quyền xin mẫu */}
                    {overdueSamplesCount > 0 ? (
                      <div className="p-3.5 rounded-xl border border-[#F1C9C6] bg-[#FEF2F1] text-xs text-[#DC2626] flex items-start gap-2.5">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-[#DC2626] mt-0.5" />
                        <div className="flex-1">
                          <strong className="block font-bold">Khóa quyền xin mẫu mới do có đơn quá hạn 14 ngày</strong>
                          <p className="mt-0.5 text-[11px] text-[#7D715E] leading-relaxed">
                            Bạn có <strong className="text-[#DC2626]">{overdueSamplesCount}</strong> đơn mẫu quá hạn chưa nghiệm thu video. Vui lòng bấm "Nộp Link Video Review" ở các đơn bên dưới để mở lại quyền nhận mẫu toàn sàn.
                          </p>
                        </div>
                      </div>
                    ) : urgentSamplesCount > 0 ? (
                      <div className="p-3 rounded-xl border border-[#F59E0B]/40 bg-[#FFFBEB] text-xs text-[#92400E] flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706]" />
                        <div className="flex-1 text-[11px]">
                          Nhắc nhở: Bạn có <strong className="text-[#D97706]">{urgentSamplesCount}</strong> đơn mẫu sắp hết hạn nộp video review (dưới 3 ngày). Vui lòng nộp video sớm để duy trì quyền nhận mẫu.
                        </div>
                      </div>
                    ) : null}

                    {/* Danh sách mẫu */}
                    <div className="flex items-center justify-between gap-3 min-w-0 py-1">
                      <div className="inline-flex items-center gap-2 text-[#1A1612] text-xs font-bold">
                        <Package size={15} className="text-[#B88E4F]" aria-hidden="true" />
                        <span>Lịch sử yêu cầu</span>
                        <strong className="grid place-items-center min-w-[21px] h-[21px] px-1.5 border border-[#EEDFC6] rounded-full bg-[#FBF5EB] text-[#8D6936] text-[10px] font-bold tabular-nums">{samples.length}</strong>
                      </div>
                      <div className="w-48 shrink-0">
                        <Select
                          value={sampleStatusFilter}
                          onChange={(event) => setSampleStatusFilter(event.target.value)}
                          aria-label="Lọc trạng thái yêu cầu mẫu"
                          className="w-full min-h-[35px] text-xs bg-white border border-[#EAE4D7] rounded-lg"
                        >
                          <option value="ALL">Tất cả trạng thái</option>
                          <option value="PENDING">Chờ Shop duyệt</option>
                          <option value="APPROVED">Đã duyệt</option>
                          <option value="SHIPPED">Đang giao</option>
                          <option value="RECEIVED">Đã nhận mẫu</option>
                          <option value="VIDEO_SUBMITTED">Chờ nghiệm thu video</option>
                          <option value="REVISION_REQUIRED">Cần sửa video</option>
                          <option value="OVERDUE">Quá hạn</option>
                          <option value="DELIVERY_ISSUE">Sự cố giao hàng</option>
                          <option value="COMPLETED">Hoàn tất</option>
                          <option value="REJECTED">Bị từ chối</option>
                          <option value="CANCELLED">Đã hủy</option>
                        </Select>
                      </div>
                    </div>
                    {loadingSamples ? (
                      <div className="grid place-items-center gap-2 min-h-[120px] text-xs text-[#7D715E] text-center" role="status">
                        <Loader2 className="w-5 h-5 text-[#B88E4F] animate-spin" aria-hidden="true" />
                        <span>Đang tải dữ liệu hàng mẫu...</span>
                      </div>
                    ) : samples.length === 0 ? (
                      <div className="grid place-items-center content-center gap-2 min-h-[180px] p-6 border border-[#EAE4D7] rounded-xl bg-white text-[#7D715E] text-center">
                        <span className="grid place-items-center w-10 h-10 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]"><Package size={19} aria-hidden="true" /></span>
                        <h4 className="m-0 text-[#1A1612] text-sm font-bold">Chưa có đơn xin mẫu nào từ {selectedStore.name}</h4>
                        <p className="max-w-sm m-0 text-[#7D715E] text-xs leading-relaxed">
                          Chọn sản phẩm ở tab "Kho Sản Phẩm" để đăng ký nhận mẫu trải nghiệm miễn phí.
                        </p>
                      </div>
                    ) : visibleSamples.length === 0 ? (
                      <div className="grid place-items-center gap-2 min-h-[120px] text-xs text-[#7D715E] text-center">
                        Không có yêu cầu nào ở trạng thái đã chọn.
                      </div>
                    ) : (
                      <div className="grid gap-2.5 min-w-0">
                        {visibleSamples.map((samp: any) => {
                          const sandboxShipment = isSandboxShipment(samp);
                          const status = sampleDisplayStatus(samp) || 'PENDING';
                          const isShipped = !sandboxShipment && status === 'SHIPPED';
                          const awaitingReceipt = isShipped || status === 'DELIVERY_ISSUE';
                          const canSubmitVideo = ['RECEIVED', 'OVERDUE', 'REVISION_REQUIRED'].includes(status);
                          const activeDeadline = ['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERY_ISSUE'].includes(status) ? null : samp.revisionDeadlineAt && ['REVISION_REQUIRED', 'OVERDUE'].includes(status)
                            ? samp.revisionDeadlineAt
                            : samp.deadlineAt;
                          const deadlineInfo = activeDeadline ? formatDeadlineCountdown(activeDeadline) : null;
                          const statusLabel: Record<string, string> = {
                            PENDING: 'Chờ Shop duyệt', APPROVED: 'Shop đã duyệt', SHIPPED: 'Đang giao',
                            RECEIVED: 'Đã nhận · chờ video', VIDEO_SUBMITTED: 'Chờ Shop nghiệm thu',
                            REVISION_REQUIRED: 'Shop yêu cầu sửa video', COMPLETED: 'Đã hoàn tất',
                            OVERDUE: 'Quá hạn video · cần xử lý', REJECTED: 'Shop từ chối',
                            CANCELLED: 'Đã hủy', DELIVERY_ISSUE: 'Có sự cố giao hàng',
                          };

                          return (
                            <div
                              key={samp.id}
                              className="grid grid-cols-1 items-start gap-3 min-w-0 p-3 border border-[#EAE4D7] rounded-xl bg-white shadow-2xs hover:border-[#E2C99F] transition"
                              data-status={status.toLowerCase()}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <img
                                  src={samp.product?.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150'}
                                  alt={samp.product?.title || 'Sản phẩm'}
                                  className="w-13 h-13 shrink-0 border border-[#EAE4D7] rounded-lg bg-[#FAF8F5] object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                  <strong className="block break-words text-[#1A1612] text-xs font-bold">
                                    {samp.product?.title || 'Sản phẩm mẫu'}
                                  </strong>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 border border-[#EEDFC6] rounded-md bg-[#FBF5EB] text-[#8D6936] text-[10px] font-semibold" data-status={status.toLowerCase()}>
                                      {sandboxShipment ? <SampleSandboxStatus charges={samp.shippingCharges} /> : statusLabel[status] || status}
                                    </span>
                                    {samp.trackingNumber && (
                                      <span className="inline-flex max-w-full flex-wrap items-center gap-x-1 px-2 py-0.5 border border-[#EAE4D7] rounded-md bg-[#FAF8F5] text-[#7D715E] font-mono text-[10px]">
                                        Mã vận đơn: <strong className="ml-1 text-[#1A1612] font-bold">{samp.trackingNumber}</strong> ({samp.carrier || 'Đơn vị vận chuyển'})
                                      </span>
                                    )}
                                    {deadlineInfo && !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(status) && (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-md text-[10px] font-semibold ${
                                          deadlineInfo.isOverdue
                                            ? 'border-[#F1C9C6] bg-[#FEF2F1] text-[#DC2626]'
                                            : deadlineInfo.isUrgent
                                            ? 'border-[#F59E0B]/50 bg-[#FFFBEB] text-[#D97706]'
                                            : 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8D6936]'
                                        }`}
                                      >
                                        {deadlineInfo.isOverdue ? (
                                          <ShieldAlert size={11} className="text-[#DC2626]" />
                                        ) : deadlineInfo.isUrgent ? (
                                          <AlertTriangle size={11} className="text-[#D97706]" />
                                        ) : null}
                                        <span>{deadlineInfo.text}</span>
                                        <span className="text-[#7D715E] font-normal">· hạn {new Date(activeDeadline).toLocaleDateString('vi-VN')}</span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-[11px] text-[#7D715E] leading-normal break-words">
                                    Kênh cam kết: {samp.socialPlatformSnapshot || samp.socialChannel?.platformName || '—'} · {samp.socialChannelNameSnapshot || samp.socialChannel?.channelName || '—'}
                                    {canSubmitVideo && !activeDeadline && samp.expectedVideoAt ? ` · Dự kiến đăng ${new Date(samp.expectedVideoAt).toLocaleDateString('vi-VN')}` : ''}
                                  </p>
                                  {samp.recipientName && (
                                    <p className="mt-1 text-[11px] text-[#7D715E] leading-normal break-words">
                                      Người nhận: {samp.recipientName} · {samp.recipientPhone} · {samp.shippingAddress}
                                    </p>
                                  )}
                                  {samp.videoRejectionReason && (
                                    <p className="mt-1 text-[11px] text-[#DC2626] leading-normal font-semibold">Lý do cần sửa: {samp.videoRejectionReason}</p>
                                  )}
                                  {samp.rejectedReason && status === 'REJECTED' && (
                                    <p className="mt-1 text-[11px] text-[#DC2626] leading-normal font-semibold">Lý do: {samp.rejectedReason}</p>
                                  )}
                                  {samp.videoAssets?.length > 0 && (
                                    <details className="mt-1.5 text-[11px] text-[#7D715E]">
                                      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] px-3 font-semibold text-[#795A2D] [&::-webkit-details-marker]:hidden"><Video size={14} aria-hidden="true" />Video Review đã nộp <span className="ml-auto text-[10px] text-[#7D715E]">{samp.videoAssets.length}</span><ChevronDown size={14} aria-hidden="true" /></summary>
                                      {samp.videoAssets?.length > 0 && <div className="mt-3 border-t border-[#EAE4D7] pt-2">
                                        <p className="font-semibold text-[#1A1612]">Video đã nộp</p>
                                        <ul className="mt-1 grid gap-2">
                                        {(samp.videoAssets || []).map((asset: any) => (
                                          <li key={asset.id}>
                                            <a href={asset.urlOrContent} target="_blank" rel="noreferrer" className="text-[#8D6936] underline">{asset.title || 'Video đã gửi'}</a>
                                            {' · '}{sampleVideoStatusLabels[asset.status] || 'Đang xử lý'}{asset.rejectionReason ? ` · Lý do: ${asset.rejectionReason}` : ''}
                                          </li>
                                        ))}
                                        </ul>
                                      </div>}
                                    </details>
                                  )}
                                </div>
                              </div>

                              <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 border-t border-[#EAE4D7] pt-3">
                                {status === 'APPROVED' && !sandboxShipment && !samp.trackingNumber && (
                                  <div role="status" className="flex w-full items-center gap-2.5 rounded-xl bg-[#FAF8F5] px-3 py-2.5">
                                    <Truck size={17} className="shrink-0 text-[#B88E4F]" aria-hidden="true" />
                                    <div>
                                      <p className="m-0 text-xs font-semibold text-[#1A1612]">Chờ Shop tạo vận đơn GHN</p>
                                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#7D715E]">Mã vận đơn và nút theo dõi sẽ xuất hiện sau khi Shop tạo vận đơn.</p>
                                    </div>
                                  </div>
                                )}
                                {status === 'PENDING' && <button type="button"
                                  onClick={() => handleEditSampleRequest(samp)}
                                  className="inline-flex items-center justify-center min-h-[32px] px-2.5 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#795A2D] text-xs font-semibold hover:bg-[#F3EFE6]">
                                  Sửa thông tin
                                </button>}
                                {status === 'PENDING' && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelSampleRequest(samp.id)}
                                    className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2.5 py-1.5 border border-[#F1C9C6] rounded-lg bg-white text-[#DC2626] text-xs font-semibold hover:bg-[#FEF2F1] transition cursor-pointer"
                                  >
                                    Hủy yêu cầu
                                  </button>
                                )}
                                {awaitingReceipt && samp.carrier?.toUpperCase().includes('GHN') && (
                                  <span className="basis-full text-[11px] text-[#7D715E] italic">Hạn nộp video bắt đầu khi GHN xác nhận giao thành công.</span>
                                )}
                                {samp.trackingNumber && samp.carrier?.toUpperCase().includes('GHN') && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2.5 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-[#7D715E] text-xs font-medium hover:bg-[#FAF8F5] transition cursor-pointer"
                                    onClick={() => setTrackingSampleId(trackingSampleId === samp.id ? null : samp.id)}
                                  >
                                    Theo dõi hành trình bưu kiện
                                  </button>
                                )}
                                {isShipped && !samp.receivedAt && (
                                  <button
                                    type="button"
                                    onClick={() => void handleConfirmReceivedSample(samp.id)}
                                    className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2.5 py-1.5 border border-[#C59B58] rounded-lg bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white text-xs font-bold hover:opacity-95 transition cursor-pointer shadow-xs"
                                  >
                                    <CheckCircle2 size={13} aria-hidden="true" />
                                    <span>Đã nhận được hàng</span>
                                  </button>
                                )}
                                {isShipped && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const reason = window.prompt('Mô tả sự cố giao hàng:');
                                      if (reason?.trim()) {
                                        api.patch(`/sample-requests/${samp.id}/delivery-issue`, { reason: reason.trim() })
                                          .then(() => loadStoreSamples(selectedStore.id))
                                          .catch((err: any) => toast.error(err?.response?.data?.message || 'Không gửi được báo cáo sự cố.'));
                                      }
                                    }}
                                    className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2.5 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-[#7D715E] text-xs font-semibold hover:border-[#EEDFC6] hover:bg-[#FBF5EB] transition cursor-pointer"
                                  >Báo sự cố</button>
                                )}
                                {canSubmitVideo && (
                                  <button
                                    type="button"
                                    onClick={() => setSubmitVideoSample(samp)}
                                    className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2.5 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#1A1612] text-xs font-bold hover:bg-[#F3EFE6] hover:border-[#C59B58] transition cursor-pointer"
                                  >
                                    <Video size={13} aria-hidden="true" />
                                    <span>Nộp Link Video Review</span>
                                  </button>
                                )}
                              </div>
                              <SampleSandboxWaybills charges={samp.shippingCharges} primary={sandboxShipment} productId={samp.product?.id} productTitle={samp.product?.title} sampleRequestId={samp.id} />
                              {trackingSampleId === samp.id && samp.trackingNumber && <GhnTrackingTimeline orderCode={samp.trackingNumber} environment="LIVE" sampleRequestId={awaitingReceipt ? samp.id : undefined} onSampleDelivered={() => loadStoreSamples(selectedStore.id)} />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. CREATOR TOOLKIT */}
                {activeTab === 'media' && (
                  <div className="grid content-start gap-3 min-w-0 animate-in fade-in-50 duration-200">
                    <section className="grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_auto] items-center gap-2.5 md:gap-4 min-w-0 p-3 sm:p-3.5 border border-[#EAE4D7] rounded-xl bg-white" aria-labelledby="collaboration-media-title">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid place-items-center flex-none w-9 h-9 border border-[#EEDFC6] rounded-[9px] bg-[#FBF5EB] text-[#B88E4F]"><Sparkles className="w-[17px] h-[17px]" aria-hidden="true" /></span>
                        <div>
                          <h3 id="collaboration-media-title" className="m-0 text-[#1A1612] text-sm leading-[1.4] font-semibold tracking-[-0.15px]">Kho nội dung sáng tạo</h3>
                          <p className="mt-0.5 mb-0 text-[#7D715E] text-[10.5px] leading-relaxed">Tài nguyên quay dựng và thông tin sản phẩm từ {selectedStore.name}.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[3px] min-w-0 p-[3px] border border-[#EAE4D7] rounded-[9px] bg-[#FAF8F5]" role="tablist" aria-label="Danh mục nội dung sáng tạo">
                        {[
                          { id: 'BROLL', label: 'Video mẫu', icon: Video },
                          { id: 'PHOTOS', label: 'Ảnh & tài liệu', icon: Image },
                          { id: 'USP', label: 'Điểm nổi bật', icon: ShieldAlert },
                          { id: 'HOOKS', label: 'Gợi ý kịch bản', icon: Lightbulb },
                        ].map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setMediaTab(sub.id as any)}
                            className={`inline-flex items-center justify-center gap-1.5 min-w-0 min-h-[31px] px-2 py-1.5 border rounded-md text-[10px] font-medium transition-colors ${
                              mediaTab === sub.id
                                ? 'border-[#EEDFC6] bg-white text-[#1A1612] shadow-sm'
                                : 'border-transparent bg-transparent text-[#7D715E] hover:text-[#1A1612]'
                            }`}
                            role="tab"
                            aria-selected={mediaTab === sub.id}
                          >
                            <sub.icon className="w-3.5 h-3.5 flex-none text-[#B88E4F]" aria-hidden="true" />
                            <span>{sub.label}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    {loadingMedia ? (
                      <div className="grid justify-items-center content-center gap-2 min-h-[145px] p-6 border border-[#EAE4D7] rounded-[11px] bg-white text-[#7D715E] text-[10.5px] text-center" role="status">
                        <Loader2 className="w-[19px] h-[19px] text-[#B88E4F] animate-spin" aria-hidden="true" />
                        <span>Đang tải kho tài nguyên sáng tạo...</span>
                      </div>
                    ) : (
                      <>
                        {mediaTab === 'BROLL' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 min-w-0">
                        {[
                          {
                            id: 'br-1',
                            title: 'B-Roll Cận Cảnh Chất Kem B5 Thấm Nhanh (9:16)',
                            duration: '15s • Full HD 1080x1920',
                            url: 'https://images.unsplash.com/photo-1608248597359-2e11e3b624f1?w=400',
                            note: 'Góc quay dọc Macro không chữ, KOL tải về lồng giọng nói (Voiceover)',
                          },
                          {
                            id: 'br-2',
                            title: 'Footage Mở Hộp & Chi Tiết Vòi Nhấn Serum',
                            duration: '20s • 60 FPS',
                            url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
                            note: 'Âm thanh ASMR mở nắp sắc nét, thích hợp video unboxing',
                          },
                          {
                            id: 'br-3',
                            title: 'B-Roll Thoa Kem Chống Nắng Lên Da Cổ & Mặt',
                            duration: '18s • Ánh Sáng Tự Nhiên',
                            url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
                            note: 'Hiệu ứng nâng tone nhẹ tự nhiên không vón cục',
                          },
                        ].map((item) => (
                          <article
                            key={item.id}
                            className="grid grid-rows-[auto_1fr] min-w-0 overflow-hidden border border-[#EAE4D7] rounded-[11px] bg-white shadow-sm hover:border-[#E2C99F] hover:shadow-md hover:-translate-y-0.5 transition-all"
                          >
                            <div className="relative isolate overflow-hidden bg-[#F3EFE6] aspect-[16/10] after:content-[''] after:absolute after:inset-[30%_0_0] after:z-0 after:bg-gradient-to-b after:from-transparent after:to-[#1A1612]/70 after:pointer-events-none">
                              <span className="absolute inset-0 -z-10 grid place-items-center text-[#B88E4F]"><Video className="w-7 h-7 stroke-[1.5]" aria-hidden="true" /></span>
                              <img className="block w-full h-full object-cover" src={item.url} alt={item.title} onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                              <div className="absolute z-10 right-2.5 bottom-2 left-2.5 grid justify-items-start gap-1 text-white text-[9px] font-medium leading-tight">
                                <span className="inline-flex items-center min-h-[20px] px-1.5 py-0.5 border border-white/30 rounded-[5px] bg-[#C59B58] text-[#1A1612] text-[8px] font-bold leading-none">
                                  VIDEO DỌC 9:16
                                </span>
                                <span>{item.duration}</span>
                              </div>
                            </div>
                            <div className="grid content-start gap-1.5 min-w-0 p-2.5 sm:p-3">
                              <strong className="line-clamp-2 text-[#1A1612] text-[11px] font-semibold leading-snug">
                                {item.title}
                              </strong>
                              <p className="line-clamp-2 m-0 text-[#7D715E] text-[9.5px] leading-relaxed">
                                {item.note}
                              </p>
                              <div className="flex items-center justify-between gap-2 min-w-0 mt-0.5 pt-2 border-t border-[#EAE4D7] text-[#7D715E] text-[9px]">
                                <span>MP4 · 24 MB</span>
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="inline-flex items-center justify-center gap-1.5 min-h-[31px] px-2 py-1.5 border border-[#EEDFC6] rounded-[7px] bg-[#FBF5EB] text-[#795A2D] text-[9.5px] font-semibold no-underline whitespace-nowrap cursor-pointer hover:border-[#C59B58] hover:bg-[#F3EFE6] transition-colors"
                                >
                                  <Download className="w-[13px] h-[13px] flex-none" aria-hidden="true" />
                                  <span>Tải video</span>
                                </a>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}

                    {mediaTab === 'PHOTOS' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 min-w-0">
                        {[
                          {
                            title: 'Bộ Ảnh Studio Concept Tối Giản Da Khỏe',
                            count: '12 ảnh PNG tách nền',
                            img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
                          },
                          {
                            title: 'Chứng Nhận Thử Nghiệm Lâm Sàng Viện Da Liễu',
                            count: '3 trang PDF & Scan HD',
                            img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300',
                          },
                          {
                            title: 'Banner Khuyến Mãi Flash Sale Dành Cho KOL',
                            count: '8 mẫu kích thước Stories / Feed',
                            img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300',
                          },
                        ].map((p, idx) => (
                          <article key={idx} className="grid grid-rows-[auto_1fr] min-w-0 overflow-hidden border border-[#EAE4D7] rounded-[11px] bg-white shadow-sm hover:border-[#E2C99F] hover:shadow-md hover:-translate-y-0.5 transition-all">
                            <div className="relative isolate overflow-hidden bg-[#F3EFE6] aspect-[16/9]">
                              <span className="absolute inset-0 -z-10 grid place-items-center text-[#B88E4F]"><Image className="w-7 h-7 stroke-[1.5]" aria-hidden="true" /></span>
                              <img className="block w-full h-full object-cover" src={p.img} alt={p.title} onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                            </div>
                            <div className="grid content-start gap-1.5 min-w-0 p-2.5 sm:p-3">
                              <strong className="line-clamp-2 text-[#1A1612] text-[11px] font-semibold leading-snug">{p.title}</strong>
                              <span className="line-clamp-2 m-0 text-[#7D715E] text-[9.5px] leading-relaxed">{p.count}</span>
                              <button
                                type="button"
                                onClick={() => toast.success('Đang tải trọn bộ ảnh độ nét cao...')}
                                className="w-full mt-1 inline-flex items-center justify-center gap-1.5 min-h-[31px] px-2 py-1.5 border border-[#EEDFC6] rounded-[7px] bg-[#FBF5EB] text-[#795A2D] text-[9.5px] font-semibold no-underline whitespace-nowrap cursor-pointer hover:border-[#C59B58] hover:bg-[#F3EFE6] transition-colors"
                              >
                                <Download className="w-[13px] h-[13px] flex-none" aria-hidden="true" /> Tải trọn bộ
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}

                    {mediaTab === 'USP' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 min-w-0">
                        <section className="grid content-start gap-2.5 min-w-0 p-3.5 border border-[#EAE4D7] rounded-[11px] bg-white">
                          <h4 className="flex items-start gap-1.5 m-0 text-[#1A1612] text-[10.5px] font-semibold leading-snug">
                            <Sparkles className="w-[15px] h-[15px] flex-none text-[#B88E4F]" aria-hidden="true" />
                            <span>Top 3 Điểm Mạnh Cốt Lõi (USPs)</span>
                          </h4>
                          <ul className="grid gap-2 m-0 pl-4 text-[#7D715E] text-[10px] leading-relaxed list-disc">
                            <li><strong className="text-[#1A1612] font-semibold">Phức hợp B5 5% tinh khiết:</strong> Phục hồi hàng rào ẩm cho da đang treatment cấp tốc chỉ sau 48 giờ.</li>
                            <li><strong className="text-[#1A1612] font-semibold">Chất kem mỏng nhẹ tan trên da:</strong> Không gây bít tắc lỗ chân lông, không gây mụn ẩn cho da dầu Việt Nam.</li>
                            <li><strong className="text-[#1A1612] font-semibold">Thành phần thuần chay 100%:</strong> Không cồn khô, không hương liệu nhân tạo, an toàn cho mẹ bầu.</li>
                          </ul>
                        </section>

                        <section className="grid content-start gap-2.5 min-w-0 p-3.5 border border-[#EEDFC6] rounded-[11px] bg-[#FBF8F1]">
                          <h4 className="flex items-start gap-1.5 m-0 text-[#1A1612] text-[10.5px] font-semibold leading-snug">
                            <AlertTriangle className="w-[15px] h-[15px] flex-none text-[#A77C3D]" aria-hidden="true" />
                            <span>Từ Khóa Cấm Kỵ (Chống Bóp Tương Tác / Vi Phạm)</span>
                          </h4>
                          <p className="m-0 text-[#7D715E] text-[10px] leading-relaxed">
                            Khi quay video hoặc viết caption, KOL <strong className="text-[#1A1612] font-semibold">tuyệt đối không dùng</strong> các từ sau:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {['Trị dứt điểm 100%', 'Thuốc thần kỳ', 'Trắng bật tone sau 1 đêm', 'Cam kết chữa khỏi', 'Chữa lành vĩnh viễn'].map((t, idx) => (
                              <span key={idx} className="px-2 py-1 border border-[#EEDFC6] rounded-md bg-white text-[#8D6936] text-[9px] font-medium leading-tight">
                                {t}
                              </span>
                            ))}
                          </div>
                        </section>
                      </div>
                    )}

                    {mediaTab === 'HOOKS' && (
                      <div className="grid gap-2 min-w-0">
                        {[
                          {
                            hook: '"Nếu bạn đang dùng kem B5 sai cách suốt 2 năm qua thì dừng ngay lại..."',
                            angle: 'Đánh vào nỗi sợ dùng sai cách gây mụn ẩn -> Hướng dẫn cách bôi chuẩn chuyên gia.',
                            views: 'Ý tưởng video 1.2M View',
                          },
                          {
                            hook: '"Bác sĩ da liễu sẽ không muốn bạn biết hũ kem phục hồi chỉ hơn 300k này..."',
                            angle: 'Tạo cảm giác phát hiện bí mật, so sánh hiệu quả với các dòng đắt đỏ tiền triệu.',
                            views: 'Ý tưởng video 850K View',
                          },
                          {
                            hook: '"Thử thách 7 ngày đổi kem dưỡng và cái kết cho làn da dầu mụn mùa hè..."',
                            angle: 'Format kiểm chứng thực tế (Before / After) cực kỳ uy tín và dễ chốt đơn.',
                            views: 'Ý tưởng video 2.4M View',
                          },
                        ].map((hk, idx) => (
                          <article key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 p-3 border border-[#EAE4D7] rounded-xl bg-white">
                            <div className="grid gap-1 min-w-0">
                              <div className="inline-flex items-center gap-1.5 text-[#8D6936] text-[9px] font-semibold">
                                <Lightbulb className="w-3 h-3" aria-hidden="true" />
                                <span>
                                  {hk.views}
                                </span>
                              </div>
                              <strong className="text-[#1A1612] text-[11px] font-semibold leading-relaxed">
                                {hk.hook}
                              </strong>
                              <p className="m-0 text-[#7D715E] text-[9.5px] leading-relaxed">{hk.angle}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(hk.hook);
                                toast.success('Đã sao chép ý tưởng Hook vào bộ nhớ tạm!');
                              }}
                              className="flex-none self-start sm:self-center inline-flex items-center justify-center gap-1.5 min-h-[31px] px-2 py-1.5 border border-[#EEDFC6] rounded-[7px] bg-[#FBF5EB] text-[#795A2D] text-[9.5px] font-semibold whitespace-nowrap cursor-pointer hover:border-[#C59B58] hover:bg-[#F3EFE6] transition-colors"
                            >
                              <Copy className="w-[13px] h-[13px] flex-none" aria-hidden="true" />
                              <span>Sao chép kịch bản</span>
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )}
</div>
    </div>

      {/* MODAL 1: LẤY LINK TIẾP THỊ CHUẨN KÊNH & MÃ QR */}
      {linkModalProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-[#EAE4D7] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-left">
            <div className="p-5 border-b border-[#EAE4D7] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#B88E4F]" />
                <h3 className="text-sm font-extrabold text-[#1A1612] m-0">
                  Tạo Link Tiếp Thị Đa Kênh &amp; Mã QR
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalProduct(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl flex items-center gap-3">
                <img
                  src={linkModalProduct.imageUrl}
                  alt={linkModalProduct.title}
                  className="w-12 h-12 rounded-xl object-cover border border-[#EAE4D7] bg-white shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <strong className="text-xs font-bold text-[#1A1612] line-clamp-1 block">
                    {linkModalProduct.title}
                  </strong>
                  <span className="text-[11px] text-[#B88E4F] font-bold block mt-0.5">
                    Hoa hồng nền: 10% (~
                    {Math.round(Number(linkModalProduct.price) * 0.1).toLocaleString('vi-VN')} ₫)
                  </span>
                  <span className="mt-1 block text-[10px] text-[#7D715E]">Thưởng cấp bậc, Deal, chiến dịch và Live được cộng riêng khi đủ điều kiện.</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                  Chọn kênh bạn dự kiến đăng (Tự động gắn UTM Source):
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'TIKTOK', label: 'TikTok Bio' },
                    { id: 'FACEBOOK', label: 'Facebook' },
                    { id: 'YOUTUBE', label: 'YouTube' },
                    { id: 'INSTAGRAM', label: 'Instagram' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleChannelChange(ch.id as any)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                        selectedChannel === ch.id
                          ? 'bg-[#EBD08C] text-white shadow-2xs'
                          : 'bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E] hover:bg-[#F3EFE6]'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                  Đường dẫn tiếp thị rút gọn (Shortlink):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedShortlink}
                    className="flex-1 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs font-mono text-[#1A1612] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-[#EBD08C] hover:bg-[#DEC07A] text-white text-xs font-bold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </button>
                </div>
              </div>

              {generatedQr && (
                <div className="flex items-center gap-4 p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE4D7]">
                  <img src={generatedQr} alt="QR Code" className="w-24 h-24 rounded-lg bg-white p-1 border border-[#EAE4D7]" />
                  <div className="flex-1 text-xs text-[#7D715E]">
                    <strong className="text-xs text-[#1A1612] block mb-1">Mã QR Livestream / Bìa Video</strong>
                    <span>Khách quét mã sẽ tự động mở trang thanh toán và ghi nhận hoa hồng cho tài khoản của bạn.</span>
                    <a
                      href={generatedQr}
                      download={`QR_${linkModalProduct.sku || 'scanms'}.png`}
                      className="inline-flex items-center gap-1 text-[#B88E4F] font-bold mt-2 hover:underline block"
                    >
                      <Download className="w-3 h-3" /> Tải ảnh QR HD (PNG)
                    </a>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-[#EAE4D7] flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => navigate('/collaborator/links')}
                  className="text-xs text-[#B88E4F] font-bold hover:underline"
                >
                  Xem Quản Lý Link Đã Tạo (Click &amp; CR%) →
                </button>
                <button
                  type="button"
                  onClick={() => setLinkModalProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7D715E] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sample request: review commitment and delivery details */}
      {requestSampleModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#231D15]/40 p-3 backdrop-blur-xs sm:p-5">
          <div role="dialog" aria-modal="true" aria-labelledby="sample-request-title" className="relative flex max-h-[92dvh] w-full max-w-[640px] flex-col overflow-hidden rounded-3xl border border-[#EAE4D7] bg-white text-left shadow-[0_24px_80px_rgba(35,29,21,0.2)]">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FBF5EB] text-[#B88E4F]">
                  <Package className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="sample-request-title" className="m-0 text-base font-bold tracking-tight text-[#1A1612]">
                    {requestSampleModalProduct._editingRequest ? 'Sửa Thông Tin Yêu Cầu Mẫu' : 'Đăng Ký Nhận Hàng Mẫu'}
                  </h3>
                  <p className="text-[11px] text-[#7D715E] m-0">
                    Hoàn tất thông tin để Shop xét duyệt yêu cầu.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequestSampleModalProduct(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FAF8F5] text-[#7D715E] transition hover:bg-[#F3EFE6] hover:text-[#1A1612] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Mini Bar */}
            <div className="mx-5 mb-1 flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 sm:mx-6">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={requestSampleModalProduct.imageUrl}
                  alt={requestSampleModalProduct.title}
                  className="h-12 w-12 shrink-0 rounded-xl border border-[#EAE4D7] bg-white object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1A1612] truncate m-0">
                    {requestSampleModalProduct.title}
                  </p>
                  <p className="text-[11px] text-[#7D715E] m-0 mt-0.5 flex items-center gap-2">
                    <span>{selectedStore?.name || 'Gian hàng đối tác'}</span>
                    <span>•</span>
                    <span>Giá gốc: <strong className="text-[#1A1612] font-semibold">{Number(requestSampleModalProduct.price).toLocaleString('vi-VN')} ₫</strong></span>
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[#FBF5EB] text-[#8A642C] border border-[#EEDFC6] text-[10px] font-bold whitespace-nowrap shrink-0">
                Mẫu miễn phí
              </span>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitSampleRequest} className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pt-4 sm:px-6">
              <fieldset className="m-0 min-w-0 space-y-3 border-0 p-0">
                <legend className="mb-3 flex items-center gap-2 text-xs font-bold text-[#1A1612]"><Video size={15} className="text-[#B88E4F]" aria-hidden="true" />Nội dung review</legend>
              {/* Row 1: Kênh MXH & Định dạng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#1A1612] block mb-1">
                    Kênh mạng xã hội <span className="text-rose-600">*</span>
                  </label>
                  <Select
                    searchable={socialChannels.length > 5}
                    value={sampleSocialChannelId}
                    onChange={(e) => setSampleSocialChannelId(e.target.value)}
                    className="w-full text-xs h-9 py-0 px-2.5"
                    placeholder="Chọn kênh đăng video"
                    required
                    options={[
                      { value: '', label: 'Chọn kênh đăng video', disabled: true },
                      ...socialChannels.map((channel) => ({
                        value: channel.id,
                        label: `${channel.platformName} · ${channel.channelName || channel.channelUrl} (${Number(channel.followerCount || 0).toLocaleString('vi-VN')} fl)`,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#1A1612] block mb-1">
                    Định dạng review <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={sampleContentType}
                    onChange={(e) => setSampleContentType(e.target.value)}
                    placeholder="VD: Video Review 60s..."
                    className="w-full h-9 px-3 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none transition placeholder:text-[#A99D8A] focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]"
                    required
                  />
                </div>
              </div>

              </fieldset>
              <fieldset className="m-0 min-w-0 space-y-3 border-0 border-t border-solid border-[#EAE4D7] p-0 pt-4">
                <legend className="flex items-center gap-2 pr-3 text-xs font-bold text-[#1A1612]"><MapPin size={15} className="text-[#B88E4F]" aria-hidden="true" />Thông tin nhận hàng</legend>
              {/* Row 2: Tên & SĐT người nhận */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#1A1612] block mb-1">
                    Họ tên người nhận <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={150}
                    minLength={2}
                    required
                    value={sampleRecipientName}
                    onChange={(e) => setSampleRecipientName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full h-9 px-3 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none transition placeholder:text-[#A99D8A] focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#1A1612] block mb-1">
                    Số điện thoại nhận hàng <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={20}
                    required
                    value={sampleRecipientPhone}
                    aria-invalid={Boolean(sampleRecipientPhone && !isSamplePhoneValid(sampleRecipientPhone))}
                    aria-describedby="sample-recipient-phone-help"
                    onChange={(e) => {
                      setSampleRecipientPhone(e.target.value);
                      setSampleRecipientPhoneConfirmed(false);
                    }}
                    placeholder="09xx xxx xxx"
                    className="w-full h-9 px-3 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none transition placeholder:text-[#A99D8A] focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]"
                  />
                  <p id="sample-recipient-phone-help" className={`mt-1 text-[11px] ${sampleRecipientPhone && !isSamplePhoneValid(sampleRecipientPhone) ? 'text-[#DC2626]' : 'text-[#7D715E]'}`}>
                    {sampleRecipientPhone && !isSamplePhoneValid(sampleRecipientPhone) ? SAMPLE_PHONE_ERROR : 'Số di động Việt Nam: 10 chữ số hoặc +84.'}
                  </p>
                </div>
              </div>

              {/* Row 3: 3 Dropdown Tỉnh/Quận/Xã GHN trên 1 hàng (Mở hướng lên trên) */}
              <div id="sample-delivery-address" role="group" aria-labelledby="sample-address-label" aria-describedby={sampleAddressError ? 'sample-address-error' : undefined} aria-invalid={Boolean(sampleAddressError)}>
                <label id="sample-address-label" className="text-[11px] font-bold text-[#1A1612] block mb-1">
                  Địa chỉ nhận hàng GHN <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-medium text-[#7D715E]">Tỉnh / Thành phố</span>
                  <Select
                    placement="top"
                    searchable
                    required
                    disabled={sampleProvincesLoading}
                    value={sampleProvinceId}
                    aria-label="Tỉnh/Thành phố nhận hàng"
                    placeholder="Tỉnh / Thành"
                    className={`w-full text-xs h-10 py-0 px-3 ${sampleAddressError && !sampleProvinceId ? 'rounded-xl ring-1 ring-[#DC2626]' : ''}`}
                    options={[
                      { value: '', label: 'Tỉnh / Thành', disabled: true },
                      ...sampleProvinces.map((item) => ({
                        value: String(item.ProvinceID),
                        label: item.ProvinceName,
                      })),
                    ]}
                    onChange={(e) => {
                      setSampleAddressError('');
                      setSampleDistricts([]);
                      setSampleWards([]);
                      setSampleProvinceId(e.target.value);
                      setSampleDistrictId('');
                      setSampleWardCode('');
                    }}
                  />
                  </label>
                  <label><span className="mb-1.5 block text-[11px] font-medium text-[#7D715E]">Quận / Huyện</span>
                  <Select
                    placement="top"
                    searchable
                    required
                    disabled={!sampleProvinceId || sampleDistrictsLoading || !sampleDistricts.length}
                    value={sampleDistrictId}
                    aria-label="Quận/Huyện nhận hàng"
                    placeholder={sampleProvinceId ? 'Quận / Huyện' : 'Quận / Huyện'}
                    className={`w-full text-xs h-9 py-0 px-2 ${sampleAddressError && sampleProvinceId && !sampleDistrictId ? 'rounded-xl ring-1 ring-[#DC2626]' : ''}`}
                    options={[
                      { value: '', label: 'Quận / Huyện', disabled: true },
                      ...sampleDistricts.map((item) => ({
                        value: String(item.DistrictID),
                        label: item.DistrictName,
                      })),
                    ]}
                    onChange={(e) => {
                      setSampleAddressError('');
                      setSampleWards([]);
                      setSampleDistrictId(e.target.value);
                      setSampleWardCode('');
                    }}
                  />
                  </label>
                  <label><span className="mb-1.5 block text-[11px] font-medium text-[#7D715E]">Phường / Xã</span>
                  <Select
                    placement="top"
                    align="right"
                    searchable
                    required
                    disabled={!sampleDistrictId || sampleWardsLoading || !sampleWards.length}
                    value={sampleWardCode}
                    aria-label="Phường/Xã nhận hàng"
                    placeholder={sampleDistrictId ? 'Phường / Xã' : 'Phường / Xã'}
                    className={`w-full text-xs h-9 py-0 px-2 ${sampleAddressError && sampleDistrictId && !sampleWardCode ? 'rounded-xl ring-1 ring-[#DC2626]' : ''}`}
                    options={[
                      { value: '', label: 'Phường / Xã', disabled: true },
                      ...sampleWards.map((item) => ({
                        value: String(item.WardCode),
                        label: item.WardName,
                      })),
                    ]}
                    onChange={(e) => { setSampleWardCode(e.target.value); setSampleAddressError(''); }}
                  />
                  </label>
                </div>
              </div>

              {/* Row 4: Địa chỉ chi tiết */}
              <div>
                <label htmlFor="sample-street-address" className="mb-1.5 block text-[11px] font-medium text-[#7D715E]">Địa chỉ chi tiết <span className="font-normal">· Số nhà, tên đường, tòa nhà, căn hộ</span></label>
                <input
                  id="sample-street-address"
                  type="text"
                  required
                  minLength={5}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Số nhà, tên đường, tòa nhà, căn hộ..."
                  className="w-full h-9 px-3 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none transition placeholder:text-[#A99D8A] focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]"
                />
                {sampleAddressError && (
                  <p id="sample-address-error" className="text-[11px] text-[#DC2626] mt-1 m-0" role="alert">
                    {sampleAddressError}
                  </p>
                )}
              </div>

              <div className="relative isolate z-0">
                <AddressLocationPicker nationwide latitude={sampleLocation?.latitude} longitude={sampleLocation?.longitude}
                  addressQuery={[shippingAddress, sampleWards.find(item => item.WardCode === sampleWardCode)?.WardName, sampleDistricts.find(item => String(item.DistrictID) === sampleDistrictId)?.DistrictName, sampleProvinces.find(item => String(item.ProvinceID) === sampleProvinceId)?.ProvinceName, 'Việt Nam'].filter(Boolean).join(', ')}
                  onChange={(location) => {
                    setSampleLocation(location);
                    if (location.detailAddress) setShippingAddress(location.detailAddress);
                    toast.info('Đã chọn vị trí. Kiểm tra lại tỉnh, quận/huyện và phường/xã GHN trước khi gửi.');
                  }} />
                <p className="mt-2 text-[10px] leading-relaxed text-[#7D715E]">Ghim hỗ trợ xác định địa chỉ chi tiết; vận đơn sử dụng địa chỉ và mã khu vực GHN bạn chọn ở trên. Vui lòng kiểm tra trước khi gửi.</p>
              </div>

              </fieldset>
              {/* Row 5: Cam kết gọn gàng */}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#7D715E] transition hover:border-[#C59B58]">
                <input
                  type="checkbox"
                  checked={sampleTermsAccepted && sampleRecipientPhoneConfirmed}
                  onChange={(e) => {
                    setSampleTermsAccepted(e.target.checked);
                    setSampleRecipientPhoneConfirmed(e.target.checked);
                  }}
                  className="mt-0.5 accent-[#C59B58] w-4 h-4 cursor-pointer shrink-0"
                  required
                />
                <span className="text-[11.5px] leading-relaxed text-[#1A1612]">
                  Tôi xác nhận thông tin nhận hàng chính xác và cam kết nộp video review trong <strong>14 ngày kể từ khi nhận hàng</strong>.
                </span>
              </label>

              {/* Modal Footer Actions */}
              <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE4D7] bg-white py-4">
                <span className="text-[11px] text-[#7D715E] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#B88E4F]" /> Miễn phí ship GHN
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestSampleModalProduct(null)}
                    className="h-10 rounded-xl border border-[#EAE4D7] px-4 text-xs font-semibold text-[#7D715E] transition hover:bg-[#FAF8F5] hover:text-[#1A1612]"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSample || sampleProvincesLoading || sampleDistrictsLoading || sampleWardsLoading}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#C59B58] px-5 text-xs font-bold text-[#231D15] transition hover:bg-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submittingSample && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{requestSampleModalProduct._editingRequest ? 'Lưu thay đổi & Gửi lại Shop' : 'Gửi Cam Kết & Xin Mẫu'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SUBMIT VIDEO REVIEW NGHIỆM THU */}
              {submitVideoSample && (
                <SubmitKolVideoModal
                  isOpen={!!submitVideoSample}
                  initialProductId={submitVideoSample.product?.id}
                  initialProductTitle={submitVideoSample.product?.title || 'Sản phẩm mẫu'}
                  sampleRequestId={submitVideoSample.id}
          onClose={() => setSubmitVideoSample(null)}
          onSuccess={() => {
            setSubmitVideoSample(null);
            if (selectedStore?.id) loadStoreSamples(selectedStore.id);
          }}
        />
      )}

      {/* MODAL 4: KHÁM PHÁ GIAN HÀNG */}
      {showDiscoverModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-[#231D15]/25 backdrop-blur-[3px]"
          onClick={() => setShowDiscoverModal(false)}
        >
          <div
            className="bg-white w-full max-w-[560px] max-h-[calc(100dvh-32px)] border border-[#EAE4D7] rounded-2xl shadow-[0_20px_70px_rgba(35,29,21,0.12)] flex flex-col overflow-hidden text-left"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-directory-title"
            aria-describedby="shop-directory-description"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 p-4 sm:px-4.5 border-b border-[#EAE4D7]">
              <div className="flex items-center gap-3">
                <div className="grid place-items-center shrink-0 w-[34px] h-[34px] rounded-xl bg-[#FBF5EB] text-[#B88E4F]">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="shop-directory-title" className="m-0 text-base font-bold leading-tight tracking-tight text-[#1A1612]">
                    Shop đối tác SCANMS
                  </h3>
                  <p id="shop-directory-description" className="mt-0.5 text-[11px] leading-normal text-[#7D715E]">
                    Trao đổi hoa hồng riêng và xin mẫu thử từ Shop.
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng danh bạ Shop"
                onClick={() => setShowDiscoverModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 sm:px-4.5 border-b border-[#EAE4D7]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D715E]" />
                <input
                  type="text"
                  aria-label="Tìm Shop theo tên hoặc ngành hàng"
                  autoFocus
                  placeholder="Tìm tên Shop, ngành hàng..."
                  value={discoverSearch}
                  onChange={(e) => setDiscoverSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs font-medium text-[#1A1612] outline-none focus:bg-white focus:border-[#C59B58] transition"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 max-h-[min(360px,calc(100dvh-220px))] overflow-y-auto overscroll-contain px-3 sm:px-4.5 custom-scrollbar divide-y divide-[#EAE4D7]">
              {loadingMarketplace ? (
                <div className="py-16 text-center text-xs font-bold text-[#7D715E] flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#C59B58] border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải danh bạ gian hàng chính hãng...</span>
                </div>
              ) : discoveredStores.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#7D715E]">
                  Không tìm thấy gian hàng nào.
                </div>
              ) : (
                discoveredStores.map((ms) => {
                    const isAlreadyConnected = stores.some((st) => st.id === ms.id);
                    return (
                      <div
                        key={ms.id}
                        className="grid grid-cols-[1fr_auto] items-start gap-2.5 sm:gap-3 py-3"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <StoreAvatar
                            name={ms.name}
                            logoUrl={getShopLogoUrl(ms.logoUrl)}
                            className="w-9 h-9 shrink-0 grid place-items-center border border-[#EAE4D7] rounded-xl bg-[#FBF5EB] text-[#B88E4F] text-xs font-bold overflow-hidden"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 title={ms.name} className="m-0 text-xs font-bold text-[#1A1612] truncate max-w-full">{ms.name}</h4>
                              <span className="inline-flex items-center gap-1 shrink-0 text-[9px] text-[#B88E4F] font-bold whitespace-nowrap" title="Gian hàng chính hãng">
                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                Chính hãng
                              </span>
                            </div>
                            <details className="mt-1">
                              <summary className="inline-flex items-center gap-1 list-none text-[#7D715E] text-[10px] cursor-pointer hover:text-[#B88E4F]">Giới thiệu Shop <ChevronDown size={12} aria-hidden="true" /></summary>
                              <p className="mt-1.5 text-[11px] leading-relaxed text-[#7D715E] break-words">{ms.description || 'Gian hàng đối tác trên sàn SCANMS.'}</p>
                            </details>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 min-w-[82px] sm:min-w-[94px]">
                          {isAlreadyConnected && <span className="text-[9px] text-[#7D715E] leading-tight">Đã kết nối</span>}
                          {isAlreadyConnected ? (
                            <button
                              type="button"
                              onClick={() => {
                                setShowDiscoverModal(false);
                                setSelectedStoreId(ms.id);
                                setActiveTab('messages');
                                updateUrl(ms.id, 'messages');
                              }}
                              className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2.5 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-[#1A1612] text-[11px] font-bold hover:bg-[#FBF5EB] hover:border-[#C59B58] transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <MessageSquare size={13} aria-hidden="true" /> Mở chat
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={connectingStoreId === ms.id}
                              onClick={() => handleConnectStore(ms)}
                              className="inline-flex items-center justify-center gap-1.5 min-h-[32px] px-2.5 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#B88E4F] text-[11px] font-bold hover:bg-[#F3EFE6] hover:border-[#C59B58] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                            >
                              {connectingStoreId === ms.id ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                              <span>{connectingStoreId === ms.id ? 'Đang gửi' : 'Gửi yêu cầu hợp tác'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-1.5 px-3.5 sm:px-4.5 py-2.5 border-t border-[#EAE4D7] text-[#7D715E] text-[10px]" aria-live="polite">
              {loadingMarketplace ? 'Đang tải danh bạ…' : `${discoveredStores.length} gian hàng`}
              <span>Mở giới thiệu để xem chi tiết.</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ĐỀ XUẤT DEAL HOA HỒNG RIÊNG (KOL -> SHOP) */}
      {(dealModalProduct || dealModalProducts.length > 0) && (() => {
        const isBundle = dealModalProducts.length > 1;
        const currentProducts = isBundle ? dealModalProducts : [dealModalProduct];
        const maxBaseRate = 10;
        const avgPrice = Math.round(
          currentProducts.reduce((sum, p) => sum + Number(p?.price || 250000), 0) / currentProducts.length,
        );

        return (
          <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-[#231D15]/30 backdrop-blur-[4px] animate-in fade-in duration-200"
            onClick={() => {
              if (!submittingDeal) {
                setDealModalProduct(null);
                setDealModalProducts([]);
              }
            }}
          >
            <div
              className="bg-white w-full max-w-[660px] max-h-[calc(100dvh-32px)] border border-[#EAE4D7] rounded-2xl shadow-[0_20px_70px_rgba(35,29,21,0.18)] flex flex-col overflow-hidden text-left"
              role="dialog"
              aria-modal="true"
              aria-labelledby="deal-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 p-4 sm:px-5 border-b border-[#EAE4D7] bg-[#FAF8F5]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid place-items-center shrink-0 w-10 h-10 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F]">
                        {isBundle ? `BUNDLE DEAL (${currentProducts.length} SẢN PHẨM)` : 'EXCLUSIVE DEAL PROPOSAL'}
                      </span>
                    </div>
                    <h3 id="deal-modal-title" className="mt-0.5 text-base font-bold text-[#1A1612] truncate">
                      {isBundle
                        ? `Đề xuất Gói Deal Đồng Loạt cho ${currentProducts.length} sản phẩm`
                        : `Đề xuất Deal hoa hồng riêng với ${selectedStore.name}`}
                    </h3>
                    <p className="text-[11px] text-[#7D715E] m-0 truncate">
                      {isBundle
                        ? `Đàm phán mức hoa hồng VIP chung cho danh mục sản phẩm kèm cam kết tổng doanh số.`
                        : 'Thương thảo mức hoa hồng VIP và gửi cam kết doanh số vào khung Chat.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={submittingDeal}
                  onClick={() => {
                    setDealModalProduct(null);
                    setDealModalProducts([]);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitDealProposal} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
                  {/* 1. Danh sách sản phẩm áp dụng */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#1A1612]">
                        {isBundle ? `Danh mục sản phẩm trong gói (${currentProducts.length} món)` : 'Sản phẩm áp dụng Deal'}
                      </label>
                      {isBundle && (
                        <span className="text-[11px] font-medium text-[#7D715E]">
                          Mức sàn cao nhất trong gói: <strong className="text-[#B88E4F]">{maxBaseRate}%</strong>
                        </span>
                      )}
                    </div>

                    {isBundle ? (
                      /* Danh sách các sản phẩm trong Gói */
                      <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar p-1">
                        {currentProducts.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5]"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={p.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150'}
                                alt={p.title}
                                className="w-10 h-10 rounded-lg object-contain bg-white border border-[#EAE4D7] shrink-0"
                              />
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-[#1A1612] truncate">{p.title}</h5>
                                <div className="text-[11px] text-[#7D715E]">
                                  {Number(p.price || 0).toLocaleString('vi-VN')} ₫ · Sàn: <strong className="text-[#B88E4F]">{10}%</strong>
                                </div>
                              </div>
                            </div>
                            {currentProducts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const remaining = currentProducts.filter((item) => item.id !== p.id);
                                  setDealModalProducts(remaining);
                                  if (remaining.length === 1) setDealModalProduct(remaining[0]);
                                }}
                                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition cursor-pointer shrink-0"
                              >
                                Bỏ bớt
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Sản phẩm đơn lẻ */
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5]">
                        <img
                          src={dealModalProduct?.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150'}
                          alt={dealModalProduct?.title}
                          className="w-14 h-14 rounded-lg object-contain bg-white border border-[#EAE4D7] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#1A1612] truncate">{dealModalProduct?.title}</h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#7D715E]">
                            <span>Giá bán: <strong className="text-[#1A1612]">{Number(dealModalProduct?.price || 0).toLocaleString('vi-VN')} ₫</strong></span>
                            <span>·</span>
                            <span>Hoa hồng sàn: <strong className="text-[#B88E4F]">{10}%</strong></span>
                          </div>
                          <div className="text-[10px] text-[#7D715E] mt-0.5">
                            Thu nhập sàn: ~{Math.round((Number(dealModalProduct?.price || 0) * (10)) / 100).toLocaleString('vi-VN')} ₫/đơn
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Mức hoa hồng đề xuất ĐỒNG LOẠT (Cách 1) */}
                  <div className="p-3.5 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#1A1612] flex items-center gap-1.5">
                        <span>Chọn mức thưởng Deal cộng thêm</span>
                        <span className="text-[#DC2626]">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-[#8D6936]">
                        Sàn tối thiểu: {maxBaseRate}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <p className="m-0 text-sm font-bold text-[#1A1612]">10% nền + {dealProposedRate - 10}% Deal = {dealProposedRate}%</p>
                      </div>

                      {/* Quick Boost chips */}
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3].map((delta) => {
                          const targetRate = maxBaseRate + delta;
                          const isSelected = dealProposedRate === targetRate;
                          return (
                            <button
                              key={delta}
                              type="button"
                              onClick={() => setDealProposedRate(targetRate)}
                              className={`px-2.5 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#C59B58] text-white border-[#C59B58] shadow-xs'
                                  : 'bg-white text-[#8D6936] border-[#EEDFC6] hover:bg-[#FAF8F5]'
                              }`}
                            >
                              +{delta}%
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Thu nhập thực tế ước tính */}
                    <div className="mt-2.5 pt-2 border-t border-[#EEDFC6]/60 flex items-center justify-between text-xs text-[#8D6936]">
                      <span>Ước tính thu nhập trung bình:</span>
                      <strong className="text-sm font-black text-[#B88E4F]">
                        ~{Math.round((avgPrice * dealProposedRate) / 100).toLocaleString('vi-VN')} ₫ / đơn
                        <span className="ml-1 text-[11px] font-normal text-[#7D715E]">
                          (+{Math.round((avgPrice * (dealProposedRate - maxBaseRate)) / 100).toLocaleString('vi-VN')} ₫ so với sàn)
                        </span>
                      </strong>
                    </div>
                  </div>

                  {/* 3. Cam kết doanh số SMART */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1612]">
                      <Handshake className="w-4 h-4 text-[#B88E4F]" />
                      <span>{isBundle ? `Cam kết doanh số toàn Gói (${currentProducts.length} sản phẩm)` : 'Cam kết doanh số & Kế hoạch hợp tác'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Kỳ hạn hợp tác */}
                      <div>
                        <label className="block text-[11px] font-semibold text-[#7D715E] mb-1">
                          Kỳ hạn hợp tác cam kết
                        </label>
                        <select
                          value={dealDurationMonths}
                          onChange={(e) => setDealDurationMonths(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-[#EAE4D7] rounded-xl text-xs font-bold text-[#1A1612] outline-none focus:border-[#C59B58]"
                        >
                          <option value={1}>1 Tháng (Thử nghiệm)</option>
                          <option value={3}>3 Tháng (Khuyến nghị chuẩn sàn)</option>
                          <option value={6}>6 Tháng (Đối tác chiến lược)</option>
                          <option value={12}>12 Tháng (Hợp đồng năm)</option>
                        </select>
                      </div>

                      {/* Số đơn cam kết */}
                      <div>
                        <label htmlFor="deal-order-commitment" className="block text-[11px] font-semibold text-[#7D715E] mb-1">
                          {isBundle ? 'Mục tiêu tổng số đơn cả gói' : 'Mục tiêu số đơn tối thiểu'}
                        </label>
                        <div className="flex items-stretch gap-2">
                          <input
                            id="deal-order-commitment"
                            type="number"
                            min={10}
                            step={10}
                            value={dealOrderCommitment}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '') {
                                setDealOrderCommitment('');
                                setDealRevenueCommitment('');
                                return;
                              }
                              const count = Number(raw);
                              setDealOrderCommitment(count);
                              const rev = count > 0 ? Math.round(avgPrice * count).toLocaleString('vi-VN') : '';
                              setDealRevenueCommitment(rev);
                            }}
                            aria-invalid={dealOrderCommitment !== '' && dealOrderCommitment < 10}
                            aria-describedby={dealOrderCommitment !== '' && dealOrderCommitment < 10 ? 'deal-order-commitment-error' : undefined}
                            className="min-w-0 flex-1 px-3 py-2 bg-white border border-[#EAE4D7] rounded-xl text-xs font-bold text-[#1A1612] outline-none focus:border-[#C59B58]"
                            required
                          />
                          <span className="inline-flex min-w-12 items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FBF5EB] px-2 text-xs font-semibold text-[#7D715E]">đơn</span>
                        </div>
                        {dealOrderCommitment !== '' && dealOrderCommitment < 10 && <p id="deal-order-commitment-error" className="mt-1.5 text-[11px] leading-relaxed text-[#DC2626]" role="alert">Số đơn cam kết tối thiểu là 10.</p>}
                      </div>
                    </div>

                    {/* Doanh thu cam kết */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#7D715E] mb-1">
                        Ước tính tổng doanh số mang về cho Shop (VNĐ)
                      </label>
                      <input
                        type="text"
                        value={dealRevenueCommitment}
                        onChange={(e) => setDealRevenueCommitment(e.target.value)}
                        placeholder="Ví dụ: 50.000.000"
                        className="w-full px-3 py-2 bg-white border border-[#EAE4D7] rounded-xl text-xs font-bold text-[#1A1612] outline-none focus:border-[#C59B58]"
                      />
                    </div>

                    {/* Kế hoạch nội dung */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#7D715E] mb-1">
                        Kế hoạch sản xuất nội dung quảng bá cho gói
                      </label>
                      <textarea
                        rows={2}
                        value={dealContentPlan}
                        onChange={(e) => setDealContentPlan(e.target.value)}
                        placeholder="Ví dụ: Quảng bá trọn bộ Routine: 4 Video TikTok chuyên sâu + 2 buổi Livestream bán hàng đẩy số..."
                        className="w-full px-3 py-2 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none focus:border-[#C59B58] resize-none"
                        required
                      />
                    </div>
                  </div>

                  {/* 4. Điều khoản cam kết */}
                  <div className="p-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs space-y-2">
                    <div className="flex items-start gap-2 text-[#7D715E] leading-relaxed">
                      <ShieldAlert className="w-4 h-4 text-[#B88E4F] shrink-0 mt-0.5" />
                      <span>
                        Đề xuất {isBundle ? `Gói Deal cho ${currentProducts.length} sản phẩm` : 'Deal'} sẽ được chuyển thẳng tới Shop qua <strong>Chat</strong>. Nếu Shop chấp thuận, toàn bộ link tiếp thị độc quyền sẽ được tự động kích hoạt.
                      </span>
                    </div>
                    <label className="flex items-start gap-2.5 pt-2 border-t border-[#EAE4D7] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={dealTermsAccepted}
                        onChange={(e) => setDealTermsAccepted(e.target.checked)}
                        className="mt-0.5 rounded border-[#EAE4D7] text-[#C59B58] focus:ring-[#C59B58] cursor-pointer"
                        required
                      />
                      <span className="text-[11px] font-medium text-[#1A1612]">
                        Tôi cam kết thực hiện video review cho sản phẩm, nỗ lực hoàn thành chỉ tiêu đã nêu và tuân thủ quy chế SCANMS. Thưởng Deal chỉ có hiệu lực sau khi Shop duyệt.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:px-5 border-t border-[#EAE4D7] bg-white flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={submittingDeal}
                    onClick={() => {
                      setDealModalProduct(null);
                      setDealModalProducts([]);
                    }}
                    className="px-4 py-2 border border-[#EAE4D7] rounded-xl text-xs font-bold text-[#7D715E] hover:bg-[#FAF8F5] transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDeal || !dealTermsAccepted || ![11, 12, 13].includes(dealProposedRate)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {submittingDeal ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi đề xuất...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {isBundle
                            ? `Gửi Đề Xuất Gói Deal (${currentProducts.length} sản phẩm)`
                            : 'Gửi đề xuất Deal qua Chat'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
