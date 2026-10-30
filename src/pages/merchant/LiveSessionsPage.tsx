import { LiveGovernancePanel, type LiveGovernance } from '../../components/live/LiveGovernancePanel';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { livestreamLifecycle, livestreamStatusLabel } from '../../utils/livestream-lifecycle.utils';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  ExternalLink,
  Users,
  Clock,
  Ticket,
  Plus,
  Trash2,
  Timer,
  Copy,
  Search,
  CheckCircle2,
  X,
  History,
  Play,
  Pause,
  StopCircle,
  Package,
  Crown,
  Sparkles,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../utils/toast';
import { DateTimePicker } from '../../components/common/DateTimePicker';
import { Select } from '../../components/ui/Select';
import { HubTabs, type HubTabItem } from '../../components/common/HubTabs';
import { liveBroadcastService } from '@/services/live-broadcast.service';
import { productService } from '../../services/product.service';
import { storeService } from '../../services/store.service';
import { partnershipInvitationsService } from '../../services/partnership-invitations.service';
import { unwrapApi } from '../../utils/api-response';
import { serverDate } from '../../utils/server-date';

type LiveProduct = {
  id: string;
  title: string;
  imageUrl?: string | null;
  price: number;
  variants: Array<{ id: string; name: string; sku: string; price: number | null }>;
};

type Creator = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  collaboratorProfile?: { totalFollowers: number; kycStatus: string } | null;
  socialChannels: Array<{ platformName: string; channelName?: string | null; followerCount: number; channelUrl: string }>;
  isExclusiveVip?: boolean;
  exclusiveDealRate?: number | null;
  campaignBonusRate?: number;
  baseRate?: number;
  currentEffectiveRate?: number;
  tierBonusRate?: number;
};

type LiveSessionItem = {
  lifecycleReason?: string;
  governance?: LiveGovernance;
  id: string;
  title: string;
  platform: string;
  liveUrl: string;
  startsAt: string;
  endsAt: string;
  externalChannels?: Array<{ channelUrl: string; followerCount: number }>;
  status: string;
  inviteStatus: string;
  description?: string | null;
  creator: Creator;
  coupon: {
    displayCode: string;
    discountType: string;
    discountValue: number | string;
    usageCount: number;
    usageLimitTotal: number | null;
  };
  products: Array<{ product: { id: string; title: string; imageUrl?: string | null } }>;
  report?: {
    claims: number;
    buyers?: number;
    orders: number;
    pendingOrders?: number;
    grossSales: number;
    voucherDiscount: number;
    commission: number;
    usedUses: number;
    remainingUses: number | null;
    currentViewers?: number | null;
    totalViewers?: number | null;
  };
};

type Catalog = {
  products: LiveProduct[];
  creators: Creator[];
  defaultCommissionRate: number;
};

function CreatorAvatar({ creator, className }: { creator: Creator; className: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (creator.avatarUrl && !imageFailed) {
    return <img src={creator.avatarUrl} alt={creator.fullName} onError={() => setImageFailed(true)} className={`${className} rounded-full border border-[#EEDFC6] object-cover bg-white`} />;
  }
  return <div role="img" aria-label={creator.fullName} className={`${className} flex items-center justify-center rounded-full border border-[#EEDFC6] bg-[#FBF5EB] font-bold text-[#9B7137]`}>
    {(creator.fullName.trim().charAt(0) || 'K').toLocaleUpperCase('vi-VN')}
  </div>;
}

const currency = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const localDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  LIVE: { label: 'Đang live', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500 animate-ping' },
  SCHEDULED: { label: 'Đã lên lịch', bg: 'bg-[#FBF5EB]', text: 'text-[#B88E4F]', border: 'border-[#EEDFC6]', dot: 'bg-[#B88E4F]' },
  PENDING_CREATOR: { label: 'Chờ KOL', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  PAUSED: { label: 'Tạm dừng', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  ENDED: { label: 'Đã kết thúc', bg: 'bg-[#F3EFE6]', text: 'text-[#7D715E]', border: 'border-[#EAE4D7]', dot: 'bg-[#7D715E]' },
  CANCELLED: { label: 'Đã hủy', bg: 'bg-stone-100', text: 'text-stone-600', border: 'border-stone-200', dot: 'bg-stone-400' },
};

const inviteConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  ACCEPTED: { label: 'KOL đồng ý', bg: 'bg-[#FBF5EB]', text: 'text-[#B88E4F]', border: 'border-[#EEDFC6]' },
  PENDING: { label: 'Chờ xác nhận', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  REJECTED: { label: 'KOL từ chối', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const formatToLocalISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
};

const getLiveDurationInfo = (startStr: string, endStr: string) => {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) {
    return {
      isValid: false,
      text: 'Thời gian kết thúc phải sau thời gian bắt đầu',
      countdownText: '',
      isLiveNow: false,
    };
  }

  const totalMinutes = Math.round(diffMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const nowMs = Date.now();
  const isLiveNow = nowMs >= start.getTime() && nowMs <= end.getTime();
  let countdownText = '';
  if (isLiveNow) {
    const remainMs = end.getTime() - nowMs;
    const remMin = Math.max(0, Math.round(remainMs / (60 * 1000)));
    countdownText = `Đang diễn ra (còn ${Math.floor(remMin / 60)}h ${remMin % 60}p)`;
  } else if (nowMs < start.getTime()) {
    const waitMs = start.getTime() - nowMs;
    const waitMin = Math.round(waitMs / (60 * 1000));
    countdownText =
      waitMin > 1440
        ? `Bắt đầu sau ${Math.floor(waitMin / 1440)} ngày`
        : waitMin > 60
        ? `Bắt đầu sau ${Math.floor(waitMin / 60)}h ${waitMin % 60}p`
        : `Bắt đầu sau ${waitMin} phút`;
  } else {
    countdownText = 'Đã qua lịch phát sóng';
  }

  return {
    isValid: true,
    text: `${hours > 0 ? `${hours} giờ ` : ''}${minutes > 0 ? `${minutes} phút` : ''}`.trim() || 'Dưới 1 phút',
    countdownText,
    isLiveNow,
  };
};

const legacyLive = import.meta.env.VITE_COMMERCE_BACKEND === 'legacy';

export default function LiveSessionsPage({
  isActive: _isActive = true,
  refreshKey = 0,
}: {
  isActive?: boolean;
  refreshKey?: number;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSessionId = searchParams.get('sessionId');
  const [storeId, setStoreId] = useState('');
  const [currentStoreName, setCurrentStoreName] = useState('');
  const [activeTab, setActiveTab] = useState<'history' | 'create'>('history');
  const [sessions, setSessions] = useState<LiveSessionItem[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({ products: [], creators: [], defaultCommissionRate: 10 });
  const [collaboratorLoadError, setCollaboratorLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [scheduleNow, setScheduleNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setScheduleNow(Date.now());
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer);window.removeEventListener('focus', refresh); };
  }, []);
  const minimumStart = new Date(Math.ceil((scheduleNow + 1) / 60000) * 60000).toISOString();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'SCHEDULED' | 'ENDED'>('ALL');
  const [detailModalSession, setDetailModalSession] = useState<LiveSessionItem | null>(null);
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);
  const startLiveActionRef = useRef<HTMLButtonElement | null>(null);
  const managementUrl = (id: string) => `/merchant/live-sessions?sessionId=${encodeURIComponent(id)}`;
  const openSessionDetails = (session: LiveSessionItem) => {
    const next = new URLSearchParams(searchParams);
    next.set('sessionId', session.id);
    setSearchParams(next);
    setActiveTab('history');
    setDetailModalSession(session);
  };
  const closeSessionDetails = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('sessionId');
    setSearchParams(next, { replace: true });
    setDetailModalSession(null);
    setEndingSessionId(null);
  };
  useEffect(() => {
    if (!requestedSessionId) { setDetailModalSession(null); return; }
    if (loading || loadError) return;
    // Only select from the current owner's loaded store; never fetch an arbitrary query ID.
    const selected = sessions.find(session => session.id === requestedSessionId);
    if (!selected) { setDetailModalSession(null); return; }
    setActiveTab('history');
    setDetailModalSession(current => current?.id === selected.id ? current : selected);
  }, [requestedSessionId, sessions, loading, loadError]);
  useEffect(() => {
    if (requestedSessionId === detailModalSession?.id) startLiveActionRef.current?.focus();
  }, [requestedSessionId, detailModalSession?.id, detailModalSession?.status]);

  const [form, setForm] = useState({
    creatorId: '',
    title: '',
    platform: 'SCANMS',
    scanmsLiveUrl: '',
    externalChannels: [{ channelUrl: '', followerCount: '' as number | string }],
    startsAt: '',
    endsAt: '',
    productIds: [] as string[],
    variantIds: [] as string[],
    discountType: 'PERCENTAGE',
    discountValue: '',
    minimumOrderAmount: '',
    maximumDiscountAmount: '',
    usageLimitTotal: '',
    usageLimitPerCustomer: '1',
    commissionRate: '10',
    description: '',
    coverImageUrl: '',
    customMessage: '',
    liveBoost: 2,
    acceptedHighRisk: false,
  });

  const [kolSearch, setKolSearch] = useState('');
  const [kolFilterTab, setKolFilterTab] = useState<'ALL' | 'VIP'>('ALL');
  const [kolSortByFollowers, setKolSortByFollowers] = useState(false);
  const [isChangingKol, setIsChangingKol] = useState(false);
  const [showProductError, setShowProductError] = useState(false);

  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productFilterTab, setProductFilterTab] = useState<'ALL' | 'SELECTED'>('ALL');


  const lastRefreshKey = useRef(refreshKey);
  const catalogRef = useRef(catalog);
  const storeNameRef = useRef('');
  const changing = useRef(new Set<string>());
  const [changingId, setChangingId] = useState<string | null>(null);

  const mapLivestream = useCallback((raw: any): LiveSessionItem => {
    const participants = raw?.participantRefs || {};
    const collabIds = raw?.collaboratorRefs?.collaboratorIds || [];
    const productIds = raw?.productRefs?.productIds || [];
    return {
      id: raw.id || raw.livestreamId,
      title: raw.title || 'Phiên live',
      description: raw.description,
      platform: participants.platform || 'SCANMS',
      liveUrl: (participants.platform || 'SCANMS') === 'SCANMS'
        ? `${window.location.origin}/live/${encodeURIComponent(raw.livestreamId || raw.id)}` : raw.playbackRef || participants.liveUrl || '',
      externalChannels: participants.externalChannels || [],
      startsAt: serverDate(raw.scheduledAt || raw.startsAt || raw.createdAt) || '',
      endsAt: serverDate(raw.endedAt || participants.endsAt || raw.endsAt || raw.scheduledAt || raw.createdAt) || '',
      ...livestreamLifecycle(raw),
      inviteStatus: participants.inviteStatus || 'PENDING',
      commissionRate: participants.commissionRate ?? 0,
      store: raw.store || { name: storeNameRef.current || 'Shop', slug: '', logoUrl: null },
      creator: raw.creator || {
        id: collabIds[0] || '',
        fullName: catalogRef.current.creators.find(creator => creator.id === collabIds[0])?.fullName || participants.creatorName || 'KOL',
        avatarUrl: null,
      },
      coupon: raw.coupon || {
        displayCode: participants.voucherCode || '—',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        usageLimitTotal: null,
        usageCount: 0,
      },
      products: (productIds as string[]).map((pid) => ({
        product: catalogRef.current.products.find(product => product.id === pid) || { id: pid, title: 'Sản phẩm trong phiên', imageUrl: null },
      })),
      report: raw.report,
    } as LiveSessionItem;
  }, []);

  const loadSessions = useCallback(async (currentStore: string, notifyError = true) => {
    try {
      const response: any = await api.get('/livestreams', {
        params: { storeId: currentStore },
        headers: { 'x-skip-cache': 'true' },
      });
      const rawList = unwrapApi<any>(response);
      if (!Array.isArray(rawList)) throw new Error('Dữ liệu phiên live chưa hợp lệ. Vui lòng thử lại.');
      const list = rawList
        .filter((item: any) => item.storeId === currentStore)
        .map(mapLivestream);
      setSessions(list);
      setDetailModalSession((current) => current ? list.find((session) => session.id === current.id) || current : current);
      return list;
    } catch (error: any) {
      if (notifyError) toast.error(error?.response?.data?.message || error?.message || 'Không tải được danh sách phiên livestream.');
    }
  }, [mapLivestream]);

  useEffect(() => {
    if (!storeId || !_isActive) return;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing || document.hidden) return;
      refreshing = true;
      try { await loadSessions(storeId, false); } finally { refreshing = false; }
    };
    const timer = window.setInterval(() => void refresh(), 15000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [storeId, _isActive, loadSessions]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        setLoading(true);
        setLoadError('');
        setCollaboratorLoadError('');
        const stores = await storeService.listMyStores(true);
        const myStore = stores.find(store => store.id === localStorage.getItem('current_store_id')) || stores[0];
        const sId = myStore?.id || '';
        if (!active) return;
        setStoreId(sId);
        setCurrentStoreName(myStore?.name || '');
        storeNameRef.current = myStore?.name || '';
        if (!sId) {
          throw new Error('Tài khoản chưa có gian hàng. Hãy hoàn tất hồ sơ và chờ quản lý duyệt.');
        }

        const [productsRes, partnerCatalog, invitations] = await Promise.all([
          productService.getProducts({ storeId: sId }, true),
          partnershipInvitationsService.catalog(),
          partnershipInvitationsService.list('shop'),
        ]);
        if (!active) return;
        const products = productsRes.items
          .filter((product) => product.isActive)
          .map((p) => ({
            id: p.id,
            title: p.title,
            imageUrl: p.imageUrl || null,
            price: p.price,
            variants: (p.variants || []).map((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              price: v.price ?? null,
            })),
          }));
        if (!Array.isArray(partnerCatalog?.creators)) {
          throw new Error('Chưa tải được thông tin KOL đối tác. Vui lòng thử lại.');
        }
        const accepted = new Set(
          invitations
            .filter((invitation) => invitation.storeId === sId && invitation.status === 'ACCEPTED')
            .map((invitation) => invitation.collaboratorId)
        );
        const creators = partnerCatalog.creators
          .filter((creator) => accepted.has(creator.id))
          .map((creator) => ({
            id: creator.id,
            fullName: creator.name,
            avatarUrl: null,
            collaboratorProfile: { totalFollowers: creator.followers, kycStatus: 'VERIFIED' },
            socialChannels: [
              {
                platformName: creator.platform,
                channelName: creator.name,
                followerCount: creator.followers,
                channelUrl: creator.channelUrl || '',
              },
            ],
          }));
        const nextCatalog = { products, creators, defaultCommissionRate: 10 } as Catalog;
        catalogRef.current = nextCatalog;
        setCatalog(nextCatalog);
        const loadedSessions = await loadSessions(sId);
        if (!loadedSessions) {
          throw new Error('Không tải được danh sách phiên. Vui lòng thử lại khi máy chủ kết nối lại.');
        }
        setForm((prev) => ({
          ...prev,
          commissionRate: '10',
        }));
      } catch (err: any) {
        if (active) setCollaboratorLoadError(err?.message || 'Không tải được KOL đối tác.');
        if (active) setLoadError(err?.response?.data?.message || err?.message || 'Mất kết nối máy chủ hoặc không tải được dữ liệu phiên Live. Vui lòng thử lại.');
        if (active) toast.error(err?.response?.data?.message || err?.message || 'Không khởi tạo được dữ liệu.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, [loadSessions, loadAttempt]);

  useEffect(() => {
    if (!loadError) return;
    const retry = () => setLoadAttempt((attempt) => attempt + 1);
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [loadError]);

  useEffect(() => {
    if (refreshKey === lastRefreshKey.current) return;
    lastRefreshKey.current = refreshKey;
    if (!storeId) return;
    void (async () => {
      try {
        await loadSessions(storeId);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || 'Không làm mới được dữ liệu phiên.');
      }
    })();
  }, [storeId, refreshKey, loadSessions]);

  const setField = (field: string, value: any) => {
    if (field === 'creatorId') {
      setForm((prev) => ({ ...prev, creatorId: value, scanmsLiveUrl: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProduct = (productId: string) => {
    const selected = form.productIds.includes(productId);
    const product = catalog.products.find((p) => p.id === productId);
    const productVariantIds = (product?.variants || []).map((v) => v.id);
    setForm((prev) => ({
      ...prev,
      productIds: selected ? prev.productIds.filter((id) => id !== productId) : [...prev.productIds, productId],
      variantIds: selected ? prev.variantIds.filter((id) => !productVariantIds.includes(id)) : prev.variantIds,
    }));
  };

  const toggleVariant = (variantId: string) =>
    setForm((prev) => ({
      ...prev,
      variantIds: prev.variantIds.includes(variantId)
        ? prev.variantIds.filter((id) => id !== variantId)
        : [...prev.variantIds, variantId],
    }));

  const updateExternalChannel = (index: number, field: 'channelUrl' | 'followerCount', value: string) => {
    setForm((prev) => ({
      ...prev,
      externalChannels: prev.externalChannels.map((channel, row) =>
        row === index ? { ...channel, [field]: value } : channel
      ),
    }));
  };

  const scheduleInfo = useMemo(() => getLiveDurationInfo(form.startsAt, form.endsAt), [form.startsAt, form.endsAt]);

  const applyDuration = (hours: number) => {
    const baseStart = form.startsAt ? new Date(form.startsAt) : new Date(Date.now() + 10 * 60 * 1000);
    const startToUse = isNaN(baseStart.getTime()) ? new Date(Date.now() + 10 * 60 * 1000) : baseStart;
    const end = new Date(startToUse.getTime() + hours * 3600 * 1000);

    setForm((prev) => ({
      ...prev,
      startsAt: prev.startsAt || formatToLocalISO(startToUse),
      endsAt: formatToLocalISO(end),
    }));
  };

  const vipCreatorsCount = useMemo(
    () => catalog.creators.filter((c) => c.isExclusiveVip).length,
    [catalog.creators]
  );

  const filteredCreators = useMemo(() => {
    let list = catalog.creators;
    if (kolFilterTab === 'VIP') {
      list = list.filter((c) => c.isExclusiveVip);
    }
    if (kolSortByFollowers) {
      list = [...list].sort(
        (a, b) =>
          (b.collaboratorProfile?.totalFollowers || 0) -
          (a.collaboratorProfile?.totalFollowers || 0)
      );
    }
    if (!kolSearch.trim()) return list;
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
    const q = normalize(kolSearch.trim());
    return list.filter(
      (c) =>
        normalize(c.fullName).includes(q) ||
        c.socialChannels.some(
          (ch) =>
            normalize(ch.platformName).includes(q) ||
            (ch.channelName && normalize(ch.channelName).includes(q)) ||
            (ch.channelUrl && normalize(ch.channelUrl).includes(q))
        )
    );
  }, [catalog.creators, kolSearch, kolFilterTab, kolSortByFollowers]);

  const selectedCreator = useMemo(
    () => catalog.creators.find((c) => c.id === form.creatorId),
    [catalog.creators, form.creatorId]
  );

  // Phân rã hoa hồng 3 tầng (Layered Breakdown)
  const creatorBaseRate = useMemo(() => {
    if (!selectedCreator) return Number(catalog.defaultCommissionRate || 10);
    return Number(selectedCreator.baseRate ?? 10);
  }, [selectedCreator, catalog.defaultCommissionRate]);

  const creatorCampaignBonus = useMemo(() => {
    return Number(selectedCreator?.campaignBonusRate || 0);
  }, [selectedCreator]);

  const preLiveRate = useMemo(() => {
    return creatorBaseRate + creatorCampaignBonus;
  }, [creatorBaseRate, creatorCampaignBonus]);

  const liveBoostRate = useMemo(() => {
    return Number(form.liveBoost || 2);
  }, [form.liveBoost]);

  const totalCommissionRate = useMemo(() => {
    return Math.min(25, preLiveRate + liveBoostRate);
  }, [preLiveRate, liveBoostRate]);

  const financialAlertTier = useMemo<'SAFE' | 'WARNING' | 'DANGER' | 'EXCEEDED'>(() => {
    if (preLiveRate + liveBoostRate > 25) return 'EXCEEDED';
    if (totalCommissionRate >= 20) return 'WARNING';
    return 'SAFE';
  }, [preLiveRate, liveBoostRate, totalCommissionRate]);

  // Đồng bộ form.commissionRate khi thay đổi KOL hoặc Boost
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      commissionRate: String(totalCommissionRate),
    }));
  }, [totalCommissionRate]);

  const filteredCatalogProducts = useMemo(() => {
    let list = catalog.products;
    if (productFilterTab === 'SELECTED') {
      list = list.filter((p) => form.productIds.includes(p.id));
    }
    if (productSearchQuery.trim()) {
      const q = productSearchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.variants.some((v) => v.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q))
      );
    }
    return list;
  }, [catalog.products, productFilterTab, productSearchQuery, form.productIds]);

  const selectAllVisibleProducts = () => {
    const visibleIds = filteredCatalogProducts.map((p) => p.id);
    setForm((prev) => ({
      ...prev,
      productIds: Array.from(new Set([...prev.productIds, ...visibleIds])),
    }));
  };

  const deselectAllProducts = () => {
    setForm((prev) => ({
      ...prev,
      productIds: [],
      variantIds: [],
    }));
  };

  const createSession = async (event: FormEvent) => {
    event.preventDefault();
    if (!storeId) { toast.error('Chưa tải được gian hàng. Vui lòng làm mới trang.'); return; }
    if (!form.creatorId) { toast.error('Vui lòng chọn KOL phát sóng.'); return; }
    if (form.productIds.length === 0) {
      setShowProductError(true);
      setProductFilterTab('ALL');
      setProductSearchQuery('');
      toast.error('Bạn chưa chọn sản phẩm ghim trong Live. Chọn ít nhất 1 sản phẩm.');
      document.getElementById('live-products-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.querySelector<HTMLInputElement>('#live-products-section input[type="checkbox"]')?.focus({ preventScroll: true });
      return;
    }
    if (!form.startsAt || !form.endsAt) {
      toast.error(!form.startsAt ? 'Vui lòng chọn giờ bắt đầu phiên Live.' : 'Vui lòng chọn giờ kết thúc phiên Live.');
      return;
    }
    if (!Number.isFinite(new Date(form.startsAt).getTime()) || !Number.isFinite(new Date(form.endsAt).getTime()) || new Date(form.endsAt) <= new Date(form.startsAt)) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu phiên Live.');
      return;
    }
    if (new Date(form.startsAt).getTime() <= Date.now()) {
      setScheduleNow(Date.now());
      toast.error('Giờ bắt đầu đã qua. Vui lòng chọn thời điểm trong tương lai.');
      return;
    }
    if (legacyLive && (!form.discountValue || !form.usageLimitTotal || !form.usageLimitPerCustomer)) {
      toast.error('Nhập mức giảm, tổng lượt dùng và lượt dùng mỗi khách.');
      return;
    }
    const finalRate = Number(form.liveBoost);
    if (![2, 3].includes(finalRate)) {
      toast.error('Thưởng Live chỉ được chọn +2% hoặc +3%.');
      return;
    }
    const externalChannels =
      form.platform === 'SCANMS'
        ? []
        : form.externalChannels.map((channel) => ({
            channelUrl: channel.channelUrl.trim(),
            followerCount: Number(channel.followerCount),
          }));
    if (
      form.platform !== 'SCANMS' &&
      (form.externalChannels.some((channel) => channel.followerCount === '') ||
        externalChannels.some(
          (channel) => !channel.channelUrl || !Number.isSafeInteger(channel.followerCount) || channel.followerCount < 0
        ) ||
        new Set(externalChannels.map((channel) => channel.channelUrl.toLowerCase())).size !== externalChannels.length)
    ) {
      toast.error('Mỗi kênh cần link riêng và số người theo dõi hợp lệ.');
      return;
    }
    const finalLiveUrl = form.platform === 'SCANMS' ? undefined : externalChannels[0].channelUrl;

    try {
      setSaving(true);
      const res: any = await api.post('/livestreams', {
        storeId,
        title: form.title,
        description: form.description || undefined,
        playbackRef: finalLiveUrl,
        scheduledAt: new Date(form.startsAt).toISOString(),
        productRefs: { productIds: form.productIds, variantIds: form.variantIds },
        collaboratorRefs: { collaboratorIds: [form.creatorId] },
        participantRefs: {
          inviteStatus: 'PENDING',
          creatorId: form.creatorId,
          creatorName: selectedCreator?.fullName,
          platform: form.platform,
          liveUrl: finalLiveUrl,
          externalChannels,
          commissionRate: finalRate,
          voucherCode: undefined,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          usageLimitTotal: Number(form.usageLimitTotal),
          usageLimitPerCustomer: Number(form.usageLimitPerCustomer),
          customMessage: form.customMessage?.trim() || undefined,
          coverImageUrl: form.coverImageUrl || undefined,
          endsAt: new Date(form.endsAt).toISOString(),
        },
      });

      toast.success('Đã tạo phiên live và gửi lời mời đến KOL.');
      setShowProductError(false);
      setForm((prev) => ({
        ...prev,
        title: '',
        scanmsLiveUrl: '',
        startsAt: '',
        endsAt: '',
        productIds: [],
        variantIds: [],
        description: '',
        discountValue: '',
        usageLimitTotal: '',
        usageLimitPerCustomer: '1',
        customMessage: '',
        liveBoost: 2,
        acceptedHighRisk: false,
        externalChannels: [{ channelUrl: '', followerCount: '' }],
      }));
      setIsChangingKol(false);
      const refreshedSessions = await loadSessions(storeId);
      setActiveTab('history');
      const createdItem = mapLivestream(unwrapApi(res));
      if (createdItem?.id) openSessionDetails(refreshedSessions?.find(item => item.id === createdItem.id) || createdItem);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không tạo được phiên livestream.');
    } finally {
      setSaving(false);
    }
  };

  const changeState = async (session: LiveSessionItem, action: 'PAUSED' | 'RESUME' | 'CANCELLED' | 'START_NOW' | string) => {
    if (changing.current.has(session.id)) return;
    changing.current.add(session.id);setChangingId(session.id);
    try {
      if (action === 'START_NOW' || action === 'start' || action === 'START' || action === 'go_live') {
        const saved = unwrapApi<any>(await api.post(`/livestreams/${session.id}/start`));
        if (saved.status !== 'LIVE') throw new Error('Máy chủ chưa xác nhận bắt đầu phiên.');
      } else if (action === 'end' || action === 'END' || action === 'stop') {
        const saved = unwrapApi<any>(await api.post(`/livestreams/${session.id}/end`));
        if (saved.status !== 'ENDED') throw new Error('Máy chủ chưa xác nhận kết thúc phiên.');
      } else if (!legacyLive) {
        throw new Error('Phiên hiện hỗ trợ bắt đầu và kết thúc.');
      } else {
        await api.patch(`/livestreams/${session.id}`, { status: action });
      }
      if (action === 'START_NOW') {
        liveBroadcastService.broadcastLive({
          sessionId: session.id,
          title: session.title,
          storeName: currentStoreName || 'Gian Hàng',
          creatorName: session.creator?.fullName || 'KOL',
          liveUrl: session.liveUrl || `/live/${session.id}`,
          discountText: session.coupon?.discountValue ? `Giảm ${session.coupon.discountValue}%` : 'Ưu đãi live',
          endsAt: session.endsAt,
        });
      } else if (['CANCELLED', 'end', 'END', 'stop'].includes(action)) {
        liveBroadcastService.endBroadcast(session.id);
      }

      toast.success(
        action === 'START_NOW'
          ? 'Đã bắt đầu phát sóng.'
          : action === 'PAUSED'
          ? 'Đã tạm dừng phiên live.'
          : action === 'RESUME'
          ? 'Đã mở lại phiên live.'
          : ['end', 'END', 'stop'].includes(action) ? 'Đã kết thúc phiên live.' : 'Đã hủy phiên live.'
      );
      await loadSessions(storeId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không cập nhật được trạng thái.');
    } finally { changing.current.delete(session.id);setChangingId(null); }
  };

  const copyCouponCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Đã sao chép: ${code}`);
    } catch {
      toast.error('Không sao chép được mã.');
    }
  };

  const endSession = (session: LiveSessionItem) => {
    if (legacyLive) { setEndingSessionId(session.id);openSessionDetails(session); return; }
    if (window.confirm('Kết thúc phiên livestream? Camera của người phát và video của người xem sẽ dừng.')) void changeState(session, 'end');
  };

  const liveCount = useMemo(() => sessions.filter((s) => s.status === 'LIVE').length, [sessions]);
  const scheduledCount = useMemo(
    () => sessions.filter((s) => s.status === 'SCHEDULED' || s.status === 'PENDING_CREATOR').length,
    [sessions]
  );
  const endedCount = useMemo(() => sessions.filter((s) => s.status === 'ENDED' || s.status === 'CANCELLED').length, [sessions]);
  const totalGrossSales = useMemo(() => sessions.reduce((acc, s) => acc + (s.report?.grossSales || 0), 0), [sessions]);
  const totalOrders = useMemo(() => sessions.reduce((acc, s) => acc + (s.report?.orders || 0), 0), [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (statusFilter === 'LIVE' && s.status !== 'LIVE') return false;
      if (statusFilter === 'SCHEDULED' && s.status !== 'SCHEDULED' && s.status !== 'PENDING_CREATOR') return false;
      if (statusFilter === 'ENDED' && s.status !== 'ENDED' && s.status !== 'CANCELLED') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.creator.fullName.toLowerCase().includes(q) ||
        s.coupon.displayCode.toLowerCase().includes(q)
      );
    });
  }, [sessions, statusFilter, searchQuery]);

  const hubTabsList: HubTabItem[] = [
    {
      id: 'history',
      label: 'Lịch sử & Danh sách phiên',
      icon: History,
      badge: sessions.length || undefined,
    },
    {
      id: 'create',
      label: legacyLive ? 'Tạo phiên live & Voucher mới' : 'Tạo phiên live mới',
      icon: Plus,
    },
  ];

  if (loading) return <div className="p-8 text-center text-sm text-[#7D715E]">Đang tải dữ liệu phiên livestream…</div>;
  if (loadError) return (
    <div role="alert" className="mx-auto my-8 max-w-lg rounded-2xl border border-[#EAE4D7] bg-white p-6 text-center">
      <h2 className="font-semibold text-[#1A1612]">Chưa tải được phiên livestream</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#7D715E]">{loadError}</p>
      <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)} className="mt-4 rounded-xl bg-[#C59B58] px-5 py-2.5 text-sm font-semibold text-[#1A1612] hover:bg-[#B88E4F]">Thử lại</button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-4 pb-10 text-[#1A1612]">
      {requestedSessionId && !sessions.some(session => session.id === requestedSessionId) && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Không tìm thấy phiên livestream này trong gian hàng của bạn.</p>}
      {/* Top Navigation Tabs */}
      <HubTabs
        tabs={hubTabsList}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
        stretchTabs
        stretchTabColumns={2}
        tone="white"
        compact
      />

      {/* TAB 1: HISTORY & SESSION LIST */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Top Performance Metric Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#EAE4D7] bg-white p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-[#7D715E]">Tổng phiên live</span>
              <p className="mt-1 text-xl font-black text-[#1A1612]">{sessions.length}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-rose-700">Đang phát sóng</span>
                {liveCount > 0 && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
              </div>
              <p className="mt-1 text-xl font-black text-rose-700">{liveCount}</p>
            </div>
            <div className="rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-[#B88E4F]">Doanh số chốt live</span>
              <p className="mt-1 text-xl font-black text-[#B88E4F]">{currency(totalGrossSales)}</p>
            </div>
            <div className="rounded-2xl border border-[#EAE4D7] bg-white p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold text-[#7D715E]">Đơn hàng qua live</span>
              <p className="mt-1 text-xl font-black text-[#1A1612]">{totalOrders}</p>
            </div>
          </div>

          {/* Search, Filter & Quick Actions */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#EAE4D7] bg-white p-3 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
            <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7D715E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên phiên, KOL, mã voucher..."
                  className="h-10 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] pl-9 pr-3 text-xs text-[#1A1612] outline-none transition focus:border-[#C59B58] focus:bg-white"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-1">
                {[
                  { key: 'ALL', label: 'Tất cả', count: sessions.length },
                  { key: 'LIVE', label: '🔴 Live', count: liveCount },
                  { key: 'SCHEDULED', label: 'Sắp tới', count: scheduledCount },
                  { key: 'ENDED', label: 'Đã xong', count: endedCount },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key as any)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      statusFilter === tab.key
                        ? 'bg-white text-[#B88E4F] shadow-2xs border border-[#EEDFC6]'
                        : 'text-[#7D715E] hover:text-[#1A1612]'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#C59B58] px-4 text-xs font-bold text-white transition hover:bg-[#B88E4F] cursor-pointer shadow-2xs"
            >
              <Plus className="h-4 w-4" />
              Tạo phiên live mới
            </button>
          </div>

          {/* Sessions Grid */}
          {filteredSessions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#EAE4D7] bg-white p-12 text-center">
              <CalendarClock className="mx-auto mb-3 h-8 w-8 text-[#C59B58]/60" />
              <h3 className="text-sm font-bold text-[#1A1612]">Chưa có phiên livestream nào</h3>
              <p className="mt-1 text-xs text-[#7D715E]">Tạo phiên mới, chọn sản phẩm và mời KOL phát sóng.</p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#C59B58] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#B88E4F]"
              >
                <Plus className="h-4 w-4" /> Tạo phiên live ngay
              </button>
            </div>
          ) : (
            <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
              {filteredSessions.map((session) => {
                const conf = statusConfig[session.status] || {
                  label: session.status,
                  bg: 'bg-stone-50',
                  text: 'text-stone-700',
                  border: 'border-stone-200',
                  dot: 'bg-stone-400',
                };
                const invite = inviteConfig[session.inviteStatus] || {
                  label: session.inviteStatus,
                  bg: 'bg-stone-50',
                  text: 'text-stone-700',
                  border: 'border-stone-200',
                };

                return (
                  <article
                    key={session.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-2xs transition-all hover:border-[#C59B58]/70 hover:shadow-xs"
                  >
                    <div className="space-y-3">
                      {/* Card Header: Badges & Platform */}
                      <div className="flex items-center justify-between gap-2 border-b border-[#F0EAE0] pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${conf.bg} ${conf.text} ${conf.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} />
                            {livestreamStatusLabel(session.status, session.lifecycleReason)}
                          </span>
                          {!['ENDED', 'CANCELLED'].includes(session.status) && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${invite.bg} ${invite.text} ${invite.border}`}>
                            {invite.label}
                          </span>}
                        </div>
                        <span className="font-mono text-[10px] font-bold text-[#7D715E]">
                          {session.platform === 'SCANMS' ? 'SCANMS Live' : session.platform}
                        </span>
                      </div>

                      {/* Title & Timing */}
                      <div>
                        <h3 className="line-clamp-1 text-sm font-bold text-[#1A1612]" title={session.title}>
                          {session.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-[#7D715E]">
                          <Clock className="h-3 w-3 text-[#B88E4F]" />
                          {localDateTime(session.startsAt)} – {localDateTime(session.endsAt)}
                        </p>
                      </div>

                      {/* KOL & Voucher Row */}
                      <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-2.5 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <CreatorAvatar creator={session.creator} className="h-7 w-7 shrink-0 text-[10px]" />
                          <div className="min-w-0">
                            <span className="block text-[10px] text-[#7D715E]">KOL hợp tác</span>
                            <span className="mt-0.5 block truncate font-bold text-[#1A1612]">
                              {session.creator.fullName}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[10px] text-[#7D715E]">Voucher live</span>
                          <span className="mt-0.5 block truncate font-mono font-bold text-[#B88E4F]">
                            {session.coupon.displayCode === '—' ? 'Chưa gắn voucher' : <>
                            {session.coupon.displayCode} (
                            {session.coupon.discountType === 'PERCENTAGE'
                              ? `-${session.coupon.discountValue}%`
                              : `-${currency(Number(session.coupon.discountValue))}`}
                            )</>}
                          </span>
                        </div>
                      </div>

                      {/* Metrics bar */}
                      <div className="grid grid-cols-3 gap-2 border-t border-[#F0EAE0] pt-2 text-[11px]">
                        <div>
                          <span className="text-[#7D715E]">Đơn live</span>
                          <p className="font-bold text-[#1A1612]">{session.report?.orders || 0}</p>
                        </div>
                        <div>
                          <span className="text-[#7D715E]">Nhận mã</span>
                          <p className="font-bold text-[#1A1612]">{session.report?.claims || 0}</p>
                        </div>
                        <div>
                          <span className="text-[#7D715E]">Doanh số</span>
                          <p className="font-bold text-[#B88E4F]">{currency(session.report?.grossSales || 0)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#F0EAE0] pt-3">
                      {['LIVE', 'PAUSED'].includes(session.status) && <button type="button" disabled={changingId === session.id} onClick={() => endSession(session)} className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[11px] font-semibold text-[#1A1612] hover:bg-[#F3EFE6] cursor-pointer"><StopCircle className="h-3.5 w-3.5" /> Kết thúc phiên</button>}
                      {session.liveUrl && !['ENDED', 'CANCELLED'].includes(session.status) && (
                        <Link
                          to={managementUrl(session.id)}
                          className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[11px] font-bold text-[#B88E4F] transition hover:bg-[#F3EFE6]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Mở live
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => openSessionDetails(session)}
                        className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] text-[11px] font-bold text-[#1A1612] transition hover:bg-[#F3EFE6]"
                      >
                        Chi tiết
                      </button>

                      {session.inviteStatus === 'ACCEPTED' && session.status === 'SCHEDULED' && (
                        <button
                          type="button"
                          onClick={() => void changeState(session, 'START_NOW')}
                          disabled={changingId === session.id}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-[#C59B58] px-2.5 text-[11px] font-bold text-white transition hover:bg-[#B88E4F]"
                          title="Bắt đầu phiên live ngay"
                        >
                          <Play className="h-3 w-3" /> Live
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE LIVE SESSION FORM */}
      {activeTab === 'create' && (
        <form
          onSubmit={createSession}
          className="space-y-4 rounded-3xl border border-[#EAE4D7] bg-white p-5 sm:p-6 lg:p-7 shadow-xs"
        >
          {/* Header */}
          <div className="flex flex-col gap-2 border-b border-[#EAE4D7] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-extrabold sm:text-lg">{legacyLive ? 'Tạo phiên livestream & Voucher độc quyền' : 'Tạo phiên livestream'}</h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-1.5 text-xs font-semibold text-[#7D715E]">
              <Users className="h-3.5 w-3.5 text-[#B88E4F]" /> {catalog.creators.length} KOL đối tác sẵn sàng
            </div>
          </div>

          {/* Block 1: Thông tin phiên live & Lựa chọn KOL đối tác */}
          <section className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5]/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-[#B88E4F] shadow-2xs">1</span>
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#1A1612]">Thông tin phiên & KOL hợp tác</h3>
              </div>
              <span className="text-[11px] font-semibold text-[#7D715E]">
                {catalog.creators.length} KOL đối tác sẵn sàng ({vipCreatorsCount} VIP)
              </span>
            </div>

            {/* Row 1: Session Title, Platform & Room URL */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-1 text-xs font-bold text-[#5F5547] sm:col-span-2 lg:col-span-1">
                Tên phiên live *
                <input
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="Ví dụ: Mega Live Deal sốc tối nay"
                  className="h-10 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 text-xs font-normal outline-none focus:border-[#C59B58]"
                />
              </label>

              <label className="grid gap-1 text-xs font-bold text-[#5F5547]">
                Nền tảng phát sóng
                <Select
                  value={form.platform}
                  onChange={(e) => setField('platform', e.target.value)}
                  className="h-10 w-full text-xs font-normal"
                >
                  <option value="SCANMS">Sàn SCANMS Live</option>
                  <option value="TIKTOK">TikTok Live</option>
                  <option value="YOUTUBE">YouTube Live</option>
                  <option value="FACEBOOK">Facebook Live</option>
                  <option value="OTHER">Nền tảng khác</option>
                </Select>
              </label>

              {form.platform === 'SCANMS' ? (
                <div className="grid gap-1 text-xs font-bold text-[#5F5547]">
                  Phòng livestream trên SCANMS
                  <p className="m-0 rounded-xl border border-[#EEDFC6] bg-white p-3 text-xs font-normal leading-5">Link phòng được cấp sau khi lưu phiên. KOL nhận lời mời, shop bắt đầu phiên, rồi KOL vào phòng bật camera và micro.</p>
                </div>
              ) : null}
            </div>

            {form.platform !== 'SCANMS' && (
              <div className="space-y-2 border-t border-[#EAE4D7] pt-2">
                <span className="text-[11px] font-bold text-[#5F5547]">Kênh phát sóng ngoài:</span>
                {form.externalChannels.map((channel, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      required
                      type="url"
                      value={channel.channelUrl}
                      onChange={(e) => updateExternalChannel(idx, 'channelUrl', e.target.value)}
                      placeholder="Link kênh phát sóng (https://...)"
                      className="h-10 flex-1 rounded-xl border border-[#EAE4D7] bg-white px-3 text-xs outline-none focus:border-[#C59B58]"
                    />
                    <input
                      required
                      type="number"
                      min="0"
                      value={channel.followerCount}
                      onChange={(e) => updateExternalChannel(idx, 'followerCount', e.target.value)}
                      placeholder="Số follower"
                      className="h-10 w-32 rounded-xl border border-[#EAE4D7] bg-white px-3 text-xs outline-none focus:border-[#C59B58]"
                    />
                    {form.externalChannels.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            externalChannels: p.externalChannels.filter((_, r) => r !== idx),
                          }))
                        }
                        className="h-10 px-2 text-[#7D715E] hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      externalChannels: [...p.externalChannels, { channelUrl: '', followerCount: '' }],
                    }))
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B88E4F] cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Thêm kênh phát sóng
                </button>
              </div>
            )}

            {/* Row 2: Prominent Open KOL Partner Selection */}
            <div className="space-y-2.5 border-t border-[#EAE4D7] pt-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1A1612]">Chọn KOL hợp tác phát sóng *</span>
                  <p className="text-[11px] text-[#7D715E]">Chỉ hiển thị KOL đã đồng ý hợp tác với gian hàng này.</p>
                </div>
                {selectedCreator && !isChangingKol && (
                  <button
                    type="button"
                    onClick={() => setIsChangingKol(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#EEDFC6] bg-white px-3 py-1.5 text-xs font-bold text-[#B88E4F] shadow-2xs hover:bg-[#FBF5EB] cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Thay đổi KOL
                  </button>
                )}
              </div>

              {/* If a KOL is selected and not in changing mode */}
              {selectedCreator && !isChangingKol ? (
                <div className="rounded-2xl border-2 border-[#C59B58] bg-gradient-to-r from-[#FBF5EB] via-white to-[#FBF5EB] p-3.5 shadow-2xs">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <CreatorAvatar creator={selectedCreator} className="h-13 w-13 text-lg shadow-2xs" />
                        {selectedCreator.isExclusiveVip && (
                          <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#C59B58] text-white shadow-xs" title="Đối tác VIP có Deal riêng">
                            <Crown className="h-3 w-3 fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-extrabold text-[#1A1612] truncate">{selectedCreator.fullName}</h4>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> Đã duyệt hợp tác
                          </span>
                          {selectedCreator.isExclusiveVip && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2 py-0.5 text-[10px] font-extrabold text-[#B88E4F]">
                              <Crown className="h-3 w-3 text-[#B88E4F]" /> Deal riêng {selectedCreator.exclusiveDealRate}%
                            </span>
                          )}
                          {(selectedCreator.campaignBonusRate || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              <Sparkles className="h-3 w-3 text-amber-600" /> Thưởng chiến dịch +{selectedCreator.campaignBonusRate}%
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-[#7D715E]">
                          {(selectedCreator.collaboratorProfile?.totalFollowers || 0).toLocaleString('vi-VN')} người theo dõi
                          {selectedCreator.socialChannels?.length > 0 && ` · Kênh: ${selectedCreator.socialChannels.map((ch) => ch.platformName).join(', ')}`}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#EEDFC6] bg-white px-3 py-2 text-right shrink-0 shadow-2xs">
                      <span className="text-[10px] font-semibold text-[#7D715E] block">Hoa hồng trước phiên</span>
                      <span className="text-sm font-black text-[#B88E4F]">
                        {preLiveRate}%
                      </span>
                      <span className="text-[10px] text-[#7D715E] block">
                        (Gốc {creatorBaseRate}%{creatorCampaignBonus > 0 ? ` + ${creatorCampaignBonus}%` : ''})
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Open Search & Filter Grid */
                <div className="space-y-2.5 rounded-2xl border border-[#EAE4D7] bg-white p-3 shadow-2xs">
                  {/* Search bar & filter pills */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7D715E]" />
                      <input
                        type="text"
                        value={kolSearch}
                        onChange={(e) => setKolSearch(e.target.value)}
                        placeholder="Tìm theo tên KOL, kênh TikTok, YouTube..."
                        className="h-9 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] pl-9 pr-3 text-xs outline-none focus:border-[#C59B58] focus:bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-1">
                        <button
                          type="button"
                          onClick={() => setKolFilterTab('ALL')}
                          aria-pressed={kolFilterTab === 'ALL'}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                            kolFilterTab === 'ALL'
                              ? 'bg-white text-[#B88E4F] shadow-2xs border border-[#EEDFC6]'
                              : 'text-[#7D715E] hover:text-[#1A1612]'
                          }`}
                        >
                          Tất cả ({catalog.creators.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setKolFilterTab('VIP')}
                          aria-pressed={kolFilterTab === 'VIP'}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                            kolFilterTab === 'VIP'
                              ? 'bg-white text-[#B88E4F] shadow-2xs border border-[#EEDFC6]'
                              : 'text-[#7D715E] hover:text-[#1A1612]'
                          }`}
                        >
                          👑 Đối tác VIP ({vipCreatorsCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setKolSortByFollowers(previous => !previous)}
                          aria-pressed={kolSortByFollowers}
                          title="Đổi thứ tự theo số người theo dõi; không thay đổi bộ lọc VIP"
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                            kolSortByFollowers
                              ? 'bg-white text-[#B88E4F] shadow-2xs border border-[#EEDFC6]'
                              : 'text-[#7D715E] hover:text-[#1A1612]'
                          }`}
                        >
                          {kolSortByFollowers ? 'Follower: cao → thấp' : 'Sắp xếp follower'}
                        </button>
                      </div>

                      {isChangingKol && (
                        <button
                          type="button"
                          onClick={() => setIsChangingKol(false)}
                          className="h-8 rounded-xl border border-[#EAE4D7] px-2.5 text-[11px] font-bold text-[#7D715E] hover:bg-[#FAF8F5] cursor-pointer"
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </div>

                  <p role="status" className="text-[11px] leading-5 text-[#7D715E]">
                    Hiển thị {filteredCreators.length}/{catalog.creators.length} KOL
                    {kolSortByFollowers ? ' · Follower từ cao xuống thấp' : ' · Ưu tiên đối tác VIP'}
                    {kolFilterTab === 'VIP' && vipCreatorsCount === catalog.creators.length && catalog.creators.length > 0 && ' · Tất cả KOL hiện có đều là VIP'}
                  </p>
                  {/* KOL Cards List */}
                  {filteredCreators.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#EAE4D7] p-6 text-center text-xs text-[#7D715E]">
                      {collaboratorLoadError || (kolSearch.trim()
                        ? 'Không tìm thấy KOL nào khớp với từ khóa.'
                        : 'Chưa có KOL đồng ý hợp tác với gian hàng này.')}
                    </div>
                  ) : (
                    <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 pr-1">
                      {filteredCreators.map((c) => {
                        const isSelected = form.creatorId === c.id;
                        const effectiveRate = c.currentEffectiveRate ?? c.baseRate ?? catalog.defaultCommissionRate ?? 10;

                        return (
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            key={c.id}
                            onClick={() => {
                              setField('creatorId', c.id);
                              setIsChangingKol(false);
                            }}
                            className={`flex w-full min-w-0 items-center justify-between rounded-xl border p-2.5 text-left transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88E4F] ${
                              isSelected
                                ? 'border-[#C59B58] bg-[#FBF5EB] ring-1 ring-[#C59B58]/30 shadow-2xs'
                                : 'border-[#EAE4D7] bg-white hover:border-[#C59B58]/70 hover:bg-[#FAF8F5]/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative shrink-0">
                                <CreatorAvatar creator={c} className="h-10 w-10 shrink-0 text-sm shadow-2xs" />
                                {c.isExclusiveVip && (
                                  <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C59B58] text-white" title="Đối tác VIP">
                                    <Crown className="h-2.5 w-2.5 fill-current" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="truncate text-xs font-bold text-[#1A1612]">{c.fullName}</p>
                                  {c.isExclusiveVip && (
                                    <span className="shrink-0 rounded bg-[#FBF5EB] px-1 text-[9px] font-extrabold text-[#B88E4F] border border-[#EEDFC6]">
                                      VIP {c.exclusiveDealRate}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-[#7D715E]">
                                  {(c.collaboratorProfile?.totalFollowers || 0).toLocaleString('vi-VN')} người theo dõi
                                  {c.socialChannels[0]?.platformName && ` · ${c.socialChannels[0].platformName}`}
                                  {(c.campaignBonusRate || 0) > 0 && <span className="text-amber-700 font-semibold"> · +{c.campaignBonusRate}% Cam</span>}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0 pl-2">
                              <span className="rounded-lg bg-[#FAF8F5] px-1.5 py-0.5 text-[10px] font-bold text-[#B88E4F] border border-[#EAE4D7] block">
                                {effectiveRate}%
                              </span>
                              {isSelected && <span className="mt-0.5 inline-block text-[10px] font-bold text-[#B88E4F]">Đã chọn</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Block 2: Schedule */}
          <section className="rounded-2xl border border-[#EAE4D7] bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FBF5EB] text-xs font-extrabold text-[#B88E4F]">2</span>
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#1A1612]">Lịch phát sóng</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1 text-xs font-bold text-[#5F5547]">
                <span>Bắt đầu *</span>
                <DateTimePicker
                  compact
                  required
                  value={form.startsAt}
                  onChange={(val) => setField('startsAt', val)}
                  minDateTime={minimumStart}
                  placeholder="Chọn thời gian bắt đầu"
                />
              </div>

              <div className="grid gap-1 text-xs font-bold text-[#5F5547]">
                <div className="flex items-center justify-between">
                  <span>Kết thúc *</span>
                  {form.startsAt && (
                    <div className="flex items-center gap-1 font-normal">
                      {[1, 2, 3, 4].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => applyDuration(h)}
                          className="rounded border border-[#EEDFC6] bg-[#FBF5EB] px-1.5 py-0.5 text-[10px] font-bold text-[#B88E4F]"
                        >
                          +{h}h
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <DateTimePicker
                  compact
                  required
                  value={form.endsAt}
                  onChange={(val) => setField('endsAt', val)}
                  minDateTime={form.startsAt ? new Date(new Date(form.startsAt).getTime() + 60000).toISOString() : minimumStart}
                  placeholder="Chọn thời gian kết thúc"
                  popoverAlign="end"
                />
              </div>

              {scheduleInfo && (
                <div className="sm:col-span-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-2.5 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#1A1612]">
                    <Timer className="h-4 w-4 text-[#B88E4F]" />
                    <span>Thời lượng: <strong>{scheduleInfo.text}</strong></span>
                  </div>
                  {scheduleInfo.countdownText && (
                    <span className="font-semibold text-[#B88E4F]">{scheduleInfo.countdownText}</span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Block 3: Products */}
          <section id="live-products-section" className="scroll-mt-28 rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5]/60 p-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-[#B88E4F] shadow-2xs">3</span>
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#1A1612]">
                  Sản phẩm ghim trong live ({form.productIds.length}/{catalog.products.length})
                </h3>
              </div>

              {/* Quick actions & tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-[#EAE4D7] bg-white p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setProductFilterTab('ALL')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                      productFilterTab === 'ALL'
                        ? 'bg-[#C59B58] text-white shadow-2xs'
                        : 'text-[#7D715E] hover:text-[#1A1612]'
                    }`}
                  >
                    Tất cả ({catalog.products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductFilterTab('SELECTED')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                      productFilterTab === 'SELECTED'
                        ? 'bg-[#C59B58] text-white shadow-2xs'
                        : 'text-[#7D715E] hover:text-[#1A1612]'
                    }`}
                  >
                    Đã chọn ({form.productIds.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={selectAllVisibleProducts}
                  className="rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[11px] font-bold text-[#B88E4F] hover:bg-[#F3EFE6] cursor-pointer"
                >
                  Chọn tất cả
                </button>
                {form.productIds.length > 0 && (
                  <button
                    type="button"
                    onClick={deselectAllProducts}
                    className="rounded-lg border border-[#EAE4D7] bg-white px-2.5 py-1 text-[11px] font-bold text-[#7D715E] hover:text-[#DC2626] cursor-pointer"
                  >
                    Bỏ chọn hết
                  </button>
                )}
              </div>
            </div>

            {/* Instant Search Bar */}
            {showProductError && form.productIds.length === 0 && <p role="alert" className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-xs text-[#DC2626]">Chưa chọn sản phẩm. Tích ô bên cạnh tên sản phẩm hoặc bấm “Chọn tất cả”.</p>}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7D715E]" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Tìm nhanh theo tên sản phẩm, mã SKU..."
                className="h-9 w-full rounded-xl border border-[#EAE4D7] bg-white pl-9 pr-8 text-xs outline-none focus:border-[#C59B58]"
              />
              {productSearchQuery && (
                <button
                  type="button"
                  onClick={() => setProductSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7D715E] hover:text-[#1A1612]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Product Grid */}
            {catalog.products.length ? (
              filteredCatalogProducts.length > 0 ? (
                <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-[#EAE4D7] bg-white p-2.5 sm:grid-cols-2">
                  {filteredCatalogProducts.map((p) => {
                    const isChecked = form.productIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`flex flex-col justify-between rounded-xl border p-2.5 transition ${
                          isChecked
                            ? 'border-[#C59B58] bg-[#FBF5EB]/50 ring-1 ring-[#C59B58]/20'
                            : 'border-[#EAE4D7] hover:border-[#C59B58]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProduct(p.id)}
                            className="h-4 w-4 accent-[#C59B58] cursor-pointer shrink-0"
                          />
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="h-11 w-11 rounded-lg border border-[#EAE4D7] object-cover shrink-0 bg-[#FAF8F5]"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] text-[#B88E4F]">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-[#1A1612]" title={p.title}>
                              {p.title}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-xs font-bold text-[#B88E4F]">
                                {currency(Number(p.price))}
                              </span>
                              {p.variants.length > 0 && (
                                <span className="rounded border border-[#EAE4D7] bg-[#FAF8F5] px-1.5 py-0.2 text-[9px] font-semibold text-[#7D715E]">
                                  {p.variants.length} SKU
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isChecked && p.variants.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1 border-t border-[#F0EAE0] pt-2 pl-6">
                            {p.variants.map((v) => (
                              <label
                                key={v.id}
                                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition cursor-pointer ${
                                  form.variantIds.includes(v.id)
                                    ? 'border-[#C59B58] bg-[#FBF5EB] text-[#B88E4F]'
                                    : 'border-[#EAE4D7] bg-white text-[#5F5547]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={form.variantIds.includes(v.id)}
                                  onChange={() => toggleVariant(v.id)}
                                  className="accent-[#C59B58]"
                                />
                                <span>{v.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#EAE4D7] bg-white p-6 text-center text-xs text-[#7D715E]">
                  Không tìm thấy sản phẩm nào khớp với tìm kiếm & bộ lọc.
                </div>
              )
            ) : (
              <p className="text-xs text-[#7D715E]">Cửa hàng chưa có sản phẩm khả dụng.</p>
            )}
          </section>

          {/* Block 4: Live Voucher Rules */}
          {legacyLive && <section className="rounded-2xl border border-[#EAE4D7] bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FBF5EB] text-xs font-extrabold text-[#B88E4F]">4</span>
              <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#1A1612]">Voucher Live độc quyền</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <label className="grid gap-1 text-xs font-bold text-[#5F5547]">
                Loại voucher
                <Select
                  value={form.discountType}
                  onChange={(e) => setField('discountType', e.target.value)}
                  className="h-10 text-xs font-normal"
                >
                  <option value="PERCENTAGE">Giảm theo %</option>
                  <option value="FIXED_AMOUNT">Giảm số tiền cố định (₫)</option>
                </Select>
              </label>

              <label className="grid gap-1 text-xs font-bold text-[#5F5547]">
                Mức giảm {form.discountType === 'PERCENTAGE' ? '(%)' : '(₫)'} *
                <input
                  required
                  type="number"
                  min="0.01"
                  max={form.discountType === 'PERCENTAGE' ? 100 : undefined}
                  step="any"
                  value={form.discountValue}
                  onChange={(e) => setField('discountValue', e.target.value)}
                  placeholder={form.discountType === 'PERCENTAGE' ? '15%' : '50.000'}
                  className="h-10 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs outline-none focus:border-[#C59B58]"
                />
              </label>

              <label className="grid gap-1 text-xs font-bold text-[#5F5547]">
                Tổng lượt dùng *
                <input
                  required
                  type="number"
                  min="1"
                  value={form.usageLimitTotal}
                  onChange={(e) => setField('usageLimitTotal', e.target.value)}
                  placeholder="Ví dụ: 100"
                  className="h-10 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs outline-none focus:border-[#C59B58]"
                />
              </label>

              <label className="grid gap-1 text-xs font-bold text-[#5F5547]">
                Lượt dùng mỗi khách
                <input
                  type="number"
                  min="1"
                  value={form.usageLimitPerCustomer}
                  onChange={(e) => setField('usageLimitPerCustomer', e.target.value)}
                  className="h-10 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs outline-none focus:border-[#C59B58]"
                />
              </label>
            </div>
          </section>}

          {/* Note: đã bỏ block cộng dồn hoa hồng — chỉ giữ lời nhắn KOL */}
          <section className="rounded-2xl border border-[#EAE4D7] bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FBF5EB] text-xs font-extrabold text-[#B88E4F]">5</span>
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#1A1612]">Lời nhắn riêng gửi KOL</h3>
              </div>
              <span className="text-[11px] text-[#7D715E] font-medium">Tuỳ chọn</span>
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={form.customMessage}
                  onChange={(e) => setField('customMessage', e.target.value)}
                  placeholder="Ví dụ: Shop muốn hợp tác giới thiệu sản phẩm mới trong phiên Live, thưởng thêm +3% khi phiên đang phát sóng."
                  className="w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 text-xs outline-none transition focus:border-[#C59B58] focus:bg-white resize-none"
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-1 text-[10px] text-[#7D715E]">
                  <MessageSquare className="h-3 w-3 text-[#B88E4F]" />
                  <span>{form.customMessage.length}/1000 ký tự</span>
                </div>
              </div>
              <p className="text-[11px] text-[#7D715E] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#B88E4F] shrink-0" />
                <span>KOL xem lịch phát sóng, sản phẩm và lời nhắn trong danh sách lời mời livestream.</span>
              </p>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex flex-col gap-2 border-t border-[#EAE4D7] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-[#7D715E]">
              Hoa hồng phiên Live: <strong className="text-[#1A1612]">{totalCommissionRate}%</strong>
              {selectedCreator && ` · KOL: ${selectedCreator.fullName}`}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="h-10 rounded-xl border border-[#EAE4D7] px-4 text-xs font-bold text-[#7D715E] hover:bg-[#FAF8F5] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || financialAlertTier === 'EXCEEDED' || (financialAlertTier === 'DANGER' && !form.acceptedHighRisk)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#C59B58] px-5 text-xs font-bold text-white transition hover:bg-[#B88E4F] disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                {saving ? 'Đang tạo…' : legacyLive ? 'Tạo phiên & Kích hoạt Voucher' : 'Tạo phiên & Mời KOL'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* DETAIL MODAL (Opens when clicking "Chi tiết" from any card in Tab 1) */}
      {detailModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="live-management-title" className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-[#EAE4D7] bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EAE4D7] p-5">
              <div className="flex items-center gap-3">
                  <CreatorAvatar creator={detailModalSession.creator} className="h-10 w-10 shrink-0 text-sm" />
                <div>
                  <h3 id="live-management-title" className="text-base font-extrabold text-[#1A1612]">{detailModalSession.title}</h3>
                  <p className="text-xs text-[#7D715E]">
                    KOL: <strong>{detailModalSession.creator.fullName}</strong> · {localDateTime(detailModalSession.startsAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng chi tiết phiên live"
                onClick={closeSessionDetails}
                className="rounded-xl p-2 text-[#7D715E] hover:bg-[#FAF8F5] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
              {detailModalSession.status === 'SCHEDULED' && <p className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-[#7D715E]">{detailModalSession.inviteStatus === 'ACCEPTED' ? 'KOL đã xác nhận. Đến giờ phát, bấm Bắt đầu phát sóng ở bên dưới để mở phiên.' : 'Chờ KOL xác nhận lời mời trước khi bắt đầu phát sóng.'}</p>}
              {/* Luxury Voucher Row */}
              <div className="flex flex-col gap-3 rounded-2xl border border-[#EEDFC6] bg-gradient-to-r from-[#FBF5EB] via-white to-[#FBF5EB] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C59B58] text-white">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#B88E4F]">VOUCHER ĐỘC QUYỀN PHIÊN LIVE</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-[#1A1612]">
                        {detailModalSession.coupon.displayCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyCouponCode(detailModalSession.coupon.displayCode)}
                        className="rounded p-1 text-[#B88E4F] hover:bg-[#FBF5EB]"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-[#B88E4F]">
                    {detailModalSession.coupon.discountType === 'PERCENTAGE'
                      ? `Giảm ${detailModalSession.coupon.discountValue}%`
                      : `Giảm ${currency(Number(detailModalSession.coupon.discountValue))}`}
                  </span>
                  <p className="text-[10px] text-[#7D715E]">
                    Đã dùng {detailModalSession.coupon.usageCount} / {detailModalSession.coupon.usageLimitTotal || '∞'}
                  </p>
                </div>
              </div>

              {/* 6-box Stats */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3">
                  <span className="text-[10px] text-[#7D715E]">Doanh số live</span>
                  <p className="mt-0.5 font-bold text-sm text-[#B88E4F]">{currency(detailModalSession.report?.grossSales || 0)}</p>
                </div>
                <div className="rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3">
                  <span className="text-[10px] text-[#7D715E]">Đơn hàng</span>
                  <p className="mt-0.5 font-bold text-sm text-[#1A1612]">{detailModalSession.report?.orders || 0}</p>
                </div>
                <div className="rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3">
                  <span className="text-[10px] text-[#7D715E]">Nhận voucher</span>
                  <p className="mt-0.5 font-bold text-sm text-[#1A1612]">{detailModalSession.report?.claims || 0}</p>
                </div>
                <div className="rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3">
                  <span className="text-[10px] text-[#7D715E]">Hoa hồng phiên</span>
                  <p className="mt-0.5 font-bold text-sm text-[#B88E4F]">{currency(detailModalSession.report?.commission || 0)}</p>
                </div>
              </div>

              {/* Pinned Products List */}
              {detailModalSession.products && detailModalSession.products.length > 0 && (
                <div className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1A1612]">
                      Sản phẩm ghim trong phiên ({detailModalSession.products.length})
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 max-h-44 overflow-y-auto">
                    {detailModalSession.products.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 rounded-xl border border-[#EAE4D7] bg-white p-2">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.title}
                            className="h-9 w-9 rounded-lg border border-[#EAE4D7] object-cover shrink-0 bg-[#FAF8F5]"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] text-[#B88E4F]">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                        <span className="truncate text-xs font-semibold text-[#1A1612]" title={item.product.title}>
                          {item.product.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Governance Panel */}
              {legacyLive && (
                <LiveGovernancePanel
                  key={`${detailModalSession.id}:${endingSessionId === detailModalSession.id ? 'end' : 'detail'}`}
                  session={detailModalSession}
                  audience="shop"
                  initialAction={endingSessionId === detailModalSession.id ? 'SHOP_END' : undefined}
                  onChanged={() => {
                    setEndingSessionId(null);
                    if (storeId) void loadSessions(storeId);
                  }}
                />
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EAE4D7] bg-[#FAF8F5] p-4">
              <div className="flex items-center gap-2">
                {detailModalSession.liveUrl && !['ENDED', 'CANCELLED'].includes(detailModalSession.status) && (
                  <Link
                    to={managementUrl(detailModalSession.id)}
                    onClick={() => startLiveActionRef.current?.focus()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#EEDFC6] bg-white px-3.5 text-xs font-bold text-[#B88E4F] hover:bg-[#FBF5EB]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Mở link live
                  </Link>
                )}
                {detailModalSession.status === 'LIVE' && <Link to={`/live/${encodeURIComponent(detailModalSession.id)}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#EEDFC6] bg-white px-3.5 text-xs font-bold text-[#B88E4F] hover:bg-[#FBF5EB]">Vào phòng đang phát</Link>}
              </div>

              <div className="flex items-center gap-2">
                {detailModalSession.inviteStatus === 'ACCEPTED' && detailModalSession.status === 'SCHEDULED' && (
                  <button
                    ref={startLiveActionRef}
                    type="button"
                    onClick={() => void changeState(detailModalSession, 'START_NOW')}
                    disabled={changingId === detailModalSession.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#C59B58] px-4 text-xs font-bold text-white hover:bg-[#B88E4F]"
                  >
                    <Play className="h-3.5 w-3.5" /> Bắt đầu phát sóng
                  </button>
                )}

                {detailModalSession.status === 'LIVE' && (
                  <>
                    {legacyLive && <button
                      type="button"
                      onClick={() => void changeState(detailModalSession, 'PAUSED')}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 text-xs font-bold text-amber-800 hover:bg-amber-100"
                    >
                      <Pause className="h-3.5 w-3.5" /> Tạm dừng
                    </button>}
                    <button
                      type="button"
                      disabled={changingId === detailModalSession.id}
                      onClick={() => endSession(detailModalSession)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <StopCircle className="h-3.5 w-3.5" /> Kết thúc
                    </button>
                  </>
                )}

                {legacyLive && detailModalSession.status === 'PAUSED' && (
                  <button
                    type="button"
                    onClick={() => void changeState(detailModalSession, 'RESUME')}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#C59B58] px-4 text-xs font-bold text-white hover:bg-[#B88E4F]"
                  >
                    <Play className="h-3.5 w-3.5" /> Tiếp tục live
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
