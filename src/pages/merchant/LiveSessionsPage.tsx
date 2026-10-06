import { LiveGovernancePanel, type LiveGovernance } from '../../components/live/LiveGovernancePanel';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import {
  CalendarClock,
  ExternalLink,
  Radio,
  Users,
  ChevronDown,
  ChevronUp,
  Clock,
  Ticket,
  ShoppingBag,
  Plus,
  Trash2,
  AlertCircle,
  Timer,
  Copy,
} from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../utils/toast';
import { DateTimePicker } from '../../components/common/DateTimePicker';
import { Select } from '../../components/ui/Select';
import { liveBroadcastService } from '../../services/liveBroadcast';

type LiveProduct = { id: string; title: string; imageUrl?: string | null; price: number; variants: Array<{ id: string; name: string; sku: string; price: number | null }> };
type Creator = { id: string; fullName: string; avatarUrl?: string | null; collaboratorProfile?: { totalFollowers: number; kycStatus: string } | null; socialChannels: Array<{ platformName: string; channelName?: string | null; followerCount: number; channelUrl: string }> };
type LiveSessionItem = {
  governance?: LiveGovernance;
  id: string; title: string; platform: string; liveUrl: string; startsAt: string; endsAt: string;
  externalChannels?: Array<{ channelUrl: string; followerCount: number }>;
  status: string; inviteStatus: string; description?: string | null;
  creator: Creator; coupon: { displayCode: string; discountType: string; discountValue: number | string; usageCount: number; usageLimitTotal: number | null };
  products: Array<{ product: { id: string; title: string; imageUrl?: string | null } }>;
  report: { claims: number; buyers?: number; orders: number; pendingOrders?: number; grossSales: number; voucherDiscount: number; commission: number; usedUses: number; remainingUses: number | null; currentViewers?: number | null; totalViewers?: number | null };
};
type Catalog = { products: LiveProduct[]; creators: Creator[]; defaultCommissionRate: number };

const currency = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const localDateTime = (value: string) => new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

const formatToLocalISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
};

const formatTimelineDateTime = (isoStr: string) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayOfWeek = weekdays[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${dayOfWeek}, ${day}/${month}/${year} • ${h}:${m}`;
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

  let text = '';
  if (hours > 0 && minutes > 0) {
    text = `${hours} giờ ${minutes} phút`;
  } else if (hours > 0) {
    text = `${hours} giờ`;
  } else {
    text = `${minutes} phút`;
  }

  const now = new Date();
  const timeToStartMs = start.getTime() - now.getTime();
  let countdownText = '';
  let isLiveNow = false;

  if (timeToStartMs > 0) {
    const cdHours = Math.floor(timeToStartMs / (3600 * 1000));
    const cdMins = Math.floor((timeToStartMs % (3600 * 1000)) / (60 * 1000));
    if (cdHours > 24) {
      const days = Math.floor(cdHours / 24);
      countdownText = `Còn ${days} ngày nữa`;
    } else if (cdHours > 0) {
      countdownText = `Còn ${cdHours} giờ ${cdMins} phút nữa`;
    } else {
      countdownText = `Còn ${cdMins} phút nữa`;
    }
  } else if (now.getTime() <= end.getTime()) {
    isLiveNow = true;
    countdownText = 'Đang diễn ra ngay';
  } else {
    countdownText = 'Đã qua';
  }

  return { isValid: true, text, countdownText, isLiveNow };
};

const statusLabel: Record<string, string> = {
  PENDING_CREATOR: 'Chờ KOL phản hồi', SCHEDULED: 'Đã lên lịch', LIVE: 'Đang livestream', PAUSED: 'Đang tạm dừng', ENDED: 'Đã kết thúc', CANCELLED: 'Đã hủy',
};

interface LiveSessionsPageProps {
  refreshKey?: number;
  isActive?: boolean;
}

const isShortScanmsLiveUrl = (value: string) => /^https?:\/\/[^/]+\/live\/[A-Za-z0-9_-]{12}$/.test(value);
const shortLiveCode = (value: string) => isShortScanmsLiveUrl(value) ? value.slice(-12) : null;

const createInitialLiveForm = () => ({
  creatorId: '',
  title: '',
  platform: 'SCANMS',
  scanmsLiveUrl: '',
  startsAt: '',
  endsAt: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minimumOrderAmount: '',
  maximumDiscountAmount: '',
  usageLimitTotal: '',
  usageLimitPerCustomer: '',
  commissionRate: '',
  productIds: [] as string[],
  variantIds: [] as string[],
  description: '',
  coverImageUrl: '',
  externalChannels: [{ channelUrl: '', followerCount: '' }] as Array<{ channelUrl: string; followerCount: string }>,
});

type LiveForm = ReturnType<typeof createInitialLiveForm>;
type LivePageCache = {
  userId: string;
  storeId: string;
  currentStoreName: string;
  catalog: Catalog;
  sessions: LiveSessionItem[];
  form: LiveForm;
  loadedAt: number;
};

let livePageCache: LivePageCache | null = null;

const getCurrentUserId = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null')?.id as string | undefined; }
  catch { return undefined; }
};

const getLivePageCache = () => {
  const userId = getCurrentUserId();
  return userId && livePageCache?.userId === userId && livePageCache.storeId === localStorage.getItem('current_store_id')
    ? livePageCache : null;
};

export default function LiveSessionsPage({ refreshKey, isActive = true }: LiveSessionsPageProps = {}) {
  const lastRefreshKey = useRef(refreshKey);
  const [storeId, setStoreId] = useState(() => getLivePageCache()?.storeId || '');
  const [currentStoreName, setCurrentStoreName] = useState(() => getLivePageCache()?.currentStoreName || 'Gian Hàng Của Bạn');
  const [catalog, setCatalog] = useState<Catalog>(() => getLivePageCache()?.catalog || { products: [], creators: [], defaultCommissionRate: 10 });
  const [sessions, setSessions] = useState<LiveSessionItem[]>(() => getLivePageCache()?.sessions || []);
  const [loading, setLoading] = useState(() => !getLivePageCache());
  const [loadedAt, setLoadedAt] = useState(() => getLivePageCache()?.loadedAt || 0);
  const [saving, setSaving] = useState(false);
  const [isSessionListCollapsed, setIsSessionListCollapsed] = useState(false);

  const [form, setForm] = useState<LiveForm>(() => ({ ...createInitialLiveForm(), ...getLivePageCache()?.form }));

  const copyScanmsLiveUrl = async () => {
    if (!form.scanmsLiveUrl) return;
    try {
      await navigator.clipboard.writeText(form.scanmsLiveUrl);
      toast.success('Đã sao chép link SCANMS Live.');
    } catch {
      toast.error('Không sao chép được link.');
    }
  };

  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId && storeId && !loading) {
      livePageCache = { userId, storeId, currentStoreName, catalog, sessions, form, loadedAt };
    }
  }, [storeId, currentStoreName, catalog, sessions, form, loadedAt, loading]);

  const loadSessions = useCallback(async (targetStoreId: string) => {
    if (!targetStoreId) return;
    const response: any = await api.get('/live-sessions/shop', { params: { storeId: targetStoreId }, headers: { 'x-skip-cache': 'true' } });
    const result = response?.data || response;
    setSessions(Array.isArray(result) ? result : []);
    setLoadedAt(Date.now());
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const cached = getLivePageCache();
      if (cached && Date.now() - cached.loadedAt < 60_000) return;
      try {
        if (!cached) setLoading(true);
        let stores: any[] = [];
        try {
          const response: any = await api.get('/auth/me');
          const user = response?.data || response;
          stores = Array.isArray(user?.stores) ? user.stores : [];
        } catch {}
        if (!stores.length) {
          const response: any = await api.get('/stores/my-store');
          const store = response?.data || response;
          if (store?.id) stores = [store];
        }
        const store = stores.find((item) => item.id === localStorage.getItem('current_store_id')) || stores[0];
        if (!store?.id) throw new Error('Tài khoản Shop chưa có gian hàng.');
        const catalogResponse: any = await api.get('/live-sessions/shop/catalog', { params: { storeId: store.id }, headers: { 'x-skip-cache': 'true' } });
        const catalogData = catalogResponse?.data || catalogResponse;
        if (!active) return;
        setStoreId(store.id);
        setCurrentStoreName(store.name || 'Gian Hàng Của Bạn');
        localStorage.setItem('current_store_id', store.id);
        setCatalog(catalogData);
        await loadSessions(store.id);
      } catch (error: any) {
        if (active) toast.error(error?.message || 'Không tải được dữ liệu phiên livestream.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void init();
    return () => { active = false; };
  }, [loadSessions]);

  useEffect(() => {
    if (!storeId || !form.creatorId || isShortScanmsLiveUrl(form.scanmsLiveUrl)) return;
    let active = true;
    void api.post('/live-sessions/shop/link-code', { storeId, creatorId: form.creatorId })
      .then((response: any) => {
        const result = response?.data || response;
        if (!active || !/^[A-Za-z0-9_-]{12}$/.test(result?.code || '')) return;
        setForm((previous) => previous.creatorId === form.creatorId
          ? { ...previous, scanmsLiveUrl: `${window.location.origin}/live/${result.code}` } : previous);
      })
      .catch((error: any) => {
        if (active) toast.error(error?.response?.data?.message || 'Không tạo được link SCANMS Live.');
      });
    return () => { active = false; };
  }, [storeId, form.creatorId, form.scanmsLiveUrl]);

  useEffect(() => {
    if (refreshKey === lastRefreshKey.current) return;
    lastRefreshKey.current = refreshKey;
    if (!storeId) return;
    void (async () => {
      try {
        const response: any = await api.get('/live-sessions/shop/catalog', { params: { storeId }, headers: { 'x-skip-cache': 'true' } });
        setCatalog(response?.data || response);
        await loadSessions(storeId);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || 'Không làm mới được dữ liệu phiên livestream.');
      }
    })();
  }, [storeId, refreshKey, loadSessions]);

  useEffect(() => {
    if (!storeId || !isActive) return;
    const refresh = () => {
      if (document.visibilityState === 'visible') void loadSessions(storeId).catch(() => {});
    };
    const timer = window.setInterval(() => {
      refresh();
    }, 15000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [storeId, isActive, loadSessions]);

  const setField = (field: string, value: any) => {
    if (field === 'creatorId') {
      setForm((previous) => ({ ...previous, creatorId: value, scanmsLiveUrl: '' }));
      return;
    }
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const toggleProduct = (productId: string) => setForm((previous) => {
    const selected = previous.productIds.includes(productId);
    const productVariantIds = catalog.products.find((product) => product.id === productId)?.variants.map((variant) => variant.id) || [];
    return {
      ...previous,
      productIds: selected ? previous.productIds.filter((id) => id !== productId) : [...previous.productIds, productId],
      variantIds: selected ? previous.variantIds.filter((id) => !productVariantIds.includes(id)) : previous.variantIds,
    };
  });
  const updateExternalChannel = (index: number, field: 'channelUrl' | 'followerCount', value: string) => {
    setForm((previous) => ({ ...previous, externalChannels: previous.externalChannels.map((channel, row) =>
      row === index ? { ...channel, [field]: value } : channel),
    }));
  };
  const toggleVariant = (variantId: string) => setForm((previous) => ({
    ...previous,
    variantIds: previous.variantIds.includes(variantId)
      ? previous.variantIds.filter((id) => id !== variantId)
      : [...previous.variantIds, variantId],
  }));

  const scheduleInfo = useMemo(
    () => getLiveDurationInfo(form.startsAt, form.endsAt),
    [form.startsAt, form.endsAt]
  );

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

  const createSession = async (event: FormEvent) => {
    event.preventDefault();
    if (!storeId || !form.creatorId || form.productIds.length === 0 || !form.startsAt || !form.endsAt) {
      toast.error('Chọn KOL, sản phẩm và thời gian bắt đầu/kết thúc.');
      return;
    }
    if (!form.discountValue || !form.usageLimitTotal || !form.usageLimitPerCustomer) {
      toast.error('Nhập mức giảm, tổng lượt dùng và lượt dùng mỗi khách.');
      return;
    }
    if (form.commissionRate === '') {
      toast.error('Nhập hoa hồng phiên live.');
      return;
    }
    const externalChannels = form.platform === 'SCANMS' ? [] : form.externalChannels.map((channel) => ({
      channelUrl: channel.channelUrl.trim(), followerCount: Number(channel.followerCount),
    }));
    if (form.platform !== 'SCANMS' && (form.externalChannels.some((channel) => channel.followerCount === '') || externalChannels.some((channel) => !channel.channelUrl || !Number.isSafeInteger(channel.followerCount) || channel.followerCount < 0)
      || new Set(externalChannels.map((channel) => channel.channelUrl.toLowerCase())).size !== externalChannels.length)) {
      toast.error('Mỗi kênh cần link riêng và số người theo dõi hợp lệ.');
      return;
    }
    if (form.platform === 'SCANMS' && !form.scanmsLiveUrl) {
      toast.error('Chọn KOL để hệ thống tạo link SCANMS Live.');
      return;
    }
    const finalLiveUrl = form.platform === 'SCANMS' ? form.scanmsLiveUrl : externalChannels[0].channelUrl;

    try {
      setSaving(true);
      await api.post('/live-sessions/shop', {
        storeId,
        creatorId: form.creatorId,
        title: form.title,
        platform: form.platform,
        liveUrl: finalLiveUrl,
        externalChannels,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        productIds: form.productIds,
        variantIds: form.variantIds,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : undefined,
        maximumDiscountAmount: form.maximumDiscountAmount ? Number(form.maximumDiscountAmount) : undefined,
        usageLimitTotal: Number(form.usageLimitTotal),
        usageLimitPerCustomer: Number(form.usageLimitPerCustomer),
        commissionRate: Number(form.commissionRate),
        description: form.description || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
      });

      toast.success('Đã tạo phiên và gửi lời mời tới KOL thành công! Vui lòng chờ KOL xác nhận tham gia trước khi phát sóng.');
      setForm((previous) => ({
        ...previous,
        title: '',
        scanmsLiveUrl: '',
        startsAt: '',
        endsAt: '',
        productIds: [],
        variantIds: [],
        description: '',
        discountValue: '',
        usageLimitTotal: '',
        usageLimitPerCustomer: '',
        commissionRate: '',
        externalChannels: [{ channelUrl: '', followerCount: '' }],
      }));
      await loadSessions(storeId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không tạo được phiên livestream.');
    } finally {
      setSaving(false);
    }
  };

  const changeState = async (session: LiveSessionItem, action: 'PAUSED' | 'RESUME' | 'CANCELLED' | 'START_NOW') => {
    try {
      await api.patch(`/live-sessions/shop/${session.id}/state`, { action });

      if (action === 'START_NOW') {
        liveBroadcastService.broadcastLive({
          sessionId: session.id,
          title: session.title,
          storeName: currentStoreName || 'Gian Hàng Của Bạn',
          creatorName: session.creator?.fullName || 'KOC Đối Tác',
          liveUrl: session.liveUrl || `/live/${session.id}`,
          discountText: session.coupon?.discountValue ? `Giảm ${session.coupon.discountValue}%` : 'Ưu đãi trực tiếp',
          endsAt: session.endsAt,
        });
      } else if (action === 'CANCELLED') {
        liveBroadcastService.endBroadcast(session.id);
      }

      toast.success(
        action === 'START_NOW'
          ? 'Đã mở phiên phát sóng trực tiếp và gửi thông báo chuông tới tất cả người dùng!'
          : action === 'PAUSED'
          ? 'Đã tạm dừng voucher phiên live.'
          : action === 'RESUME'
          ? 'Đã mở lại phiên livestream.'
          : 'Đã hủy phiên livestream.'
      );
      await loadSessions(storeId);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không cập nhật được phiên.');
    }
  };

  if (loading) return <div className="p-8 text-center text-[#7D715E]">Đang tải quản lý livestream…</div>;

  return (
    <div className="mx-auto w-full max-w-[1560px] space-y-6 pt-1 pb-6 text-[#1A1612]">
      <form onSubmit={createSession} className="space-y-5 rounded-3xl border border-[#EAE4D7] bg-white p-4 shadow-sm sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 border-b border-[#EAE4D7] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><Radio className="h-5 w-5" /></span>
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#B88E4F]">Voucher Livestream</p>
              <h2 className="text-lg font-extrabold sm:text-xl">Tạo phiên & gửi lời mời KOL</h2>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[#7D715E] sm:text-sm">Voucher dành cho KOL đã được Shop duyệt hợp tác và chỉ áp dụng cho những sản phẩm được chọn.</p>
            </div>
          </div>
          <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2 text-xs font-semibold text-[#7D715E]">
            <Users className="h-4 w-4 text-[#B88E4F]" /> {catalog.creators.length} KOL đã duyệt
          </div>
        </div>

        <section className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5]/70 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-[#B88E4F] shadow-xs">1</span>
            <div><h3 className="text-sm font-extrabold">Thông tin phiên</h3><p className="text-xs text-[#7D715E]">Đặt tên, chọn KOL và kênh phát sóng.</p></div>
          </div>
          <div className="grid gap-x-5 gap-y-4 lg:grid-cols-2">
            <label className="grid min-w-0 gap-1.5 text-sm font-bold">
              Tên phiên livestream
              <input required maxLength={200} value={form.title} onChange={(e) => setField('title', e.target.value)} className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-white px-3.5 font-normal outline-none transition placeholder:text-[#A99C88] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/10" placeholder="Ví dụ: Sora Skin săn deal tối nay" />
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm font-bold">
              KOL hợp tác
              <Select required value={form.creatorId} onChange={(e) => setField('creatorId', e.target.value)} className="h-11 w-full font-normal">
                <option value="">Chọn KOL đã duyệt</option>
                {catalog.creators.map((creator) => <option key={creator.id} value={creator.id}>{creator.fullName} · KOL {creator.id.replace(/-/g, '').slice(0, 8).toUpperCase()} · {(creator.collaboratorProfile?.totalFollowers || 0).toLocaleString('vi-VN')} followers</option>)}
              </Select>
            </label>
            <label className="grid min-w-0 gap-1.5 text-sm font-bold">
              Nền tảng phát sóng
              <Select value={form.platform} onChange={(e) => setField('platform', e.target.value)} className="h-11 w-full font-normal">
                <option value="SCANMS">🔴 Sàn SCANMS Live</option><option value="TIKTOK">TikTok Live</option><option value="YOUTUBE">YouTube Live</option><option value="FACEBOOK">Facebook Live</option><option value="OTHER">Nền tảng khác</option>
              </Select>
            </label>
            {form.platform === 'SCANMS' && (
              <div className="grid min-w-0 gap-1.5 text-sm font-bold">
                Link SCANMS Live tự sinh
                <div className="flex h-11 min-w-0 items-center rounded-xl border border-[#EEDFC6] bg-white pl-3.5 pr-1.5">
                  <input readOnly value={form.scanmsLiveUrl} placeholder={form.creatorId ? 'Đang tạo mã phiên...' : 'Chọn KOL hợp tác để tạo link'} aria-label="Link SCANMS Live tự sinh" className="min-w-0 flex-1 bg-transparent text-xs font-normal text-[#1A1612] outline-none sm:text-sm" />
                  <button type="button" disabled={!form.scanmsLiveUrl} onClick={() => void copyScanmsLiveUrl()} title="Sao chép link SCANMS Live" aria-label="Sao chép link SCANMS Live" className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#B88E4F] transition hover:bg-[#FBF5EB] disabled:opacity-40"><Copy className="h-4 w-4" /></button>
                </div>
                <span className="text-[11px] font-normal leading-relaxed text-[#7D715E]">Link dùng được sau khi tạo phiên; Shop và Admin có thể tra cứu KOL trong hồ sơ phiên.</span>
              </div>
            )}
            {form.platform !== 'SCANMS' && (
              <div className="grid gap-3 rounded-xl border border-[#EEDFC6] bg-white p-3.5 lg:col-span-2 sm:p-4">
                <div><h4 className="text-sm font-bold">Kênh phát sóng ngoài sàn</h4><p className="mt-0.5 text-xs text-[#7D715E]">Thêm đường dẫn kênh và số người theo dõi đang hiển thị trên kênh.</p></div>
                {form.externalChannels.map((channel, index) => (
                  <div key={index} className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_190px_auto] sm:items-end">
                    <label className="grid min-w-0 gap-1 text-xs font-bold">Đường dẫn kênh {index + 1}<input required type="url" maxLength={1000} value={channel.channelUrl} onChange={(e) => updateExternalChannel(index, 'channelUrl', e.target.value)} placeholder={{ TIKTOK: 'https://www.tiktok.com/@tenkenh', FACEBOOK: 'https://www.facebook.com/tenkenh', YOUTUBE: 'https://www.youtube.com/@tenkenh', OTHER: 'https://nen-tang.com/tenkenh' }[form.platform] || 'https://...'} className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 font-normal outline-none focus:border-[#C59B58]" /></label>
                    <label className="grid gap-1 text-xs font-bold">Người theo dõi<input required type="number" min="0" step="1" value={channel.followerCount} onChange={(e) => updateExternalChannel(index, 'followerCount', e.target.value)} placeholder="Ví dụ: 12000" className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 font-normal outline-none focus:border-[#C59B58]" /></label>
                    {form.externalChannels.length > 1 && <button type="button" onClick={() => setForm((previous) => ({ ...previous, externalChannels: previous.externalChannels.filter((_, row) => row !== index) }))} aria-label={`Xóa kênh ${index + 1}`} className="flex h-11 items-center justify-center gap-1 rounded-xl border border-[#EAE4D7] px-3 text-xs font-bold text-[#7D715E] transition hover:border-[#C59B58] hover:text-[#1A1612]"><Trash2 className="h-4 w-4" /> Xóa</button>}
                  </div>
                ))}
                <button type="button" onClick={() => setForm((previous) => ({ ...previous, externalChannels: [...previous.externalChannels, { channelUrl: '', followerCount: '' }] }))} className="flex w-fit items-center gap-1 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2 text-xs font-bold text-[#B88E4F] transition hover:bg-[#F3EFE6]"><Plus className="h-4 w-4" /> Thêm kênh</button>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#EAE4D7] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBF5EB] text-sm font-extrabold text-[#B88E4F]">2</span>
            <div><h3 className="text-sm font-extrabold">Lịch phát sóng</h3><p className="text-xs text-[#7D715E]">Chọn thời gian bắt đầu và kết thúc phiên.</p></div>
          </div>
          <div className="grid gap-x-5 gap-y-4 lg:grid-cols-2">
            <div className="grid min-w-0 gap-1.5 text-sm font-bold"><span>Thời gian bắt đầu *</span><DateTimePicker required value={form.startsAt} onChange={(val) => setField('startsAt', val)} minDateTime={new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()} placeholder="Chọn ngày và giờ bắt đầu (24h)" /></div>
            <div className="grid min-w-0 gap-1.5 text-sm font-bold">
              <div className="flex min-h-5 flex-wrap items-center justify-between gap-2"><span>Thời gian kết thúc *</span>
                {form.startsAt && <div className="flex flex-wrap items-center gap-1 font-normal"><span className="mr-1 text-[10px] text-[#7D715E]">Thời lượng:</span>{[{ label: '+1h', h: 1 }, { label: '+1.5h', h: 1.5 }, { label: '+2h', h: 2 }, { label: '+3h', h: 3 }, { label: '+4h', h: 4 }].map((item) => <button key={item.label} type="button" onClick={() => applyDuration(item.h)} className="rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-2 py-1 text-[10px] font-bold text-[#B88E4F] transition hover:bg-[#F3EFE6]" title={`Đặt thời lượng phiên ${item.h} giờ`}>{item.label}</button>)}</div>}
              </div>
              <DateTimePicker required value={form.endsAt} onChange={(val) => setField('endsAt', val)} minDateTime={form.startsAt || new Date().toISOString()} placeholder="Chọn ngày và giờ kết thúc (24h)" popoverAlign="end" />
            </div>
            {scheduleInfo && <div className={`rounded-xl border p-3.5 lg:col-span-2 ${scheduleInfo.isValid ? 'border-[#EEDFC6] bg-[#FBF5EB]/70' : 'border-[#DC2626]/30 bg-rose-50/50'}`}>
              {scheduleInfo.isValid ? <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><div className="flex flex-wrap items-center gap-2 font-semibold text-[#1A1612]"><Timer className="h-4 w-4 text-[#B88E4F]" /><span>Thời lượng phiên</span><span className="rounded-lg border border-[#EEDFC6] bg-white px-2.5 py-1 font-bold text-[#B88E4F]">{scheduleInfo.text}</span><span className="text-[11px] text-[#7D715E]">{formatTimelineDateTime(form.startsAt)} → {formatTimelineDateTime(form.endsAt)}</span></div>{scheduleInfo.countdownText && <span className="rounded-lg border border-[#EAE4D7] bg-white px-2.5 py-1 text-[11px] font-bold text-[#7D715E]">⏰ {scheduleInfo.countdownText}</span>}</div>
                : <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#DC2626]"><div className="flex items-center gap-1.5 font-bold"><AlertCircle className="h-4 w-4 shrink-0" /><span>Thời gian kết thúc phải sau thời gian bắt đầu.</span></div><button type="button" onClick={() => applyDuration(2)} className="rounded-lg bg-[#DC2626] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#b91c1c]">Tự động chỉnh thành +2 tiếng</button></div>}
            </div>}
          </div>
        </section>

        <section className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5]/70 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-[#B88E4F] shadow-xs">3</span><div><h3 className="text-sm font-extrabold">Sản phẩm áp dụng</h3><p className="text-xs text-[#7D715E]">Chọn sản phẩm và SKU được gắn với voucher.</p></div></div>
            <span className="rounded-full border border-[#EEDFC6] bg-white px-3 py-1 text-xs font-bold text-[#B88E4F]">Đã chọn {form.productIds.length} / {catalog.products.length}</span>
          </div>
          {catalog.products.length ? <div className="grid max-h-80 gap-2.5 overflow-y-auto rounded-xl border border-[#EAE4D7] bg-white p-2.5 sm:grid-cols-2 sm:p-3">
            {catalog.products.map((product) => <div key={product.id} className={`min-w-0 rounded-xl border p-3 transition ${form.productIds.includes(product.id) ? 'border-[#C59B58] bg-[#FBF5EB]/70' : 'border-[#EAE4D7] bg-white hover:border-[#DEBE85]'}`}>
              <div className="flex min-w-0 items-center gap-3"><input type="checkbox" checked={form.productIds.includes(product.id)} onChange={() => toggleProduct(product.id)} aria-label={`Chọn ${product.title}`} className="h-4 w-4 shrink-0 cursor-pointer accent-[#C59B58]" />
                {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-[#EAE4D7] bg-white object-cover" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#EAE4D7] bg-white text-[#B88E4F]"><ShoppingBag className="h-5 w-5" /></span>}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1A1612]" title={product.title}>{product.title}</span><span className="shrink-0 text-xs font-bold text-[#B88E4F]">{currency(Number(product.price))}</span>
              </div>
              {form.productIds.includes(product.id) && product.variants.length > 0 && <div className="ml-7 mt-3 border-l-2 border-[#EEDFC6] pl-3"><p className="mb-1.5 text-[11px] text-[#7D715E]">Chọn SKU cụ thể; để trống sẽ áp dụng mọi SKU.</p><div className="flex flex-wrap gap-1.5">{product.variants.map((variant) => <label key={variant.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#EAE4D7] bg-white px-2.5 py-1.5 text-[11px]"><input type="checkbox" checked={form.variantIds.includes(variant.id)} onChange={() => toggleVariant(variant.id)} className="accent-[#C59B58]" />{variant.name}</label>)}</div></div>}
            </div>)}
          </div> : <p className="rounded-xl border border-dashed border-[#EAE4D7] bg-white p-4 text-sm text-[#7D715E]">Shop chưa có sản phẩm đang bán.</p>}
        </section>

        <section className="rounded-2xl border border-[#EAE4D7] p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBF5EB] text-sm font-extrabold text-[#B88E4F]">4</span><div><h3 className="text-sm font-extrabold">Ưu đãi & giới hạn sử dụng</h3><p className="text-xs text-[#7D715E]">Thiết lập mức giảm, lượt dùng và hoa hồng cho phiên live.</p></div></div>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="grid min-w-0 gap-1.5 text-sm font-bold">Loại voucher<Select value={form.discountType} onChange={(e) => setField('discountType', e.target.value)} className="h-11 w-full font-normal"><option value="PERCENTAGE">Giảm theo phần trăm</option><option value="FIXED_AMOUNT">Giảm số tiền</option></Select></label>
            <label className="grid min-w-0 gap-1.5 text-sm font-bold">Mức giảm<input required type="number" min="0.01" max={form.discountType === 'PERCENTAGE' ? 100 : undefined} step="any" value={form.discountValue} onChange={(e) => setField('discountValue', e.target.value)} className="h-11 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 font-normal outline-none focus:border-[#C59B58]" placeholder={form.discountType === 'PERCENTAGE' ? 'Ví dụ: 15%' : 'Nhập số tiền giảm'} /></label>
            <label className="grid min-w-0 gap-1.5 text-sm font-bold">Đơn tối thiểu (₫)<input type="number" min="0" value={form.minimumOrderAmount} onChange={(e) => setField('minimumOrderAmount', e.target.value)} className="h-11 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 font-normal outline-none focus:border-[#C59B58]" placeholder="Không bắt buộc" /></label>
            <label className="grid min-w-0 gap-1.5 text-sm font-bold">Giảm tối đa (₫)<input type="number" min="0" value={form.maximumDiscountAmount} onChange={(e) => setField('maximumDiscountAmount', e.target.value)} className="h-11 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 font-normal outline-none focus:border-[#C59B58]" placeholder="Không bắt buộc" /></label>
            <label className="grid min-w-0 gap-1.5 text-sm font-bold">Tổng lượt dùng<input required type="number" min="1" step="1" value={form.usageLimitTotal} onChange={(e) => setField('usageLimitTotal', e.target.value)} className="h-11 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 font-normal outline-none focus:border-[#C59B58]" placeholder="Nhập tổng lượt dùng" /></label>
            <label className="grid min-w-0 gap-1.5 text-sm font-bold">Lượt dùng mỗi khách<input required type="number" min="1" max="100" step="1" value={form.usageLimitPerCustomer} onChange={(e) => setField('usageLimitPerCustomer', e.target.value)} className="h-11 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 font-normal outline-none focus:border-[#C59B58]" placeholder="Nhập lượt dùng mỗi khách" /></label>
            <label className="grid min-w-0 gap-1.5 text-sm font-bold">Hoa hồng phiên live (%)<input required type="number" min="0" max="100" step="0.01" value={form.commissionRate} onChange={(e) => setField('commissionRate', e.target.value)} className="h-11 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 font-normal outline-none focus:border-[#C59B58]" placeholder="Nhập hoa hồng phiên live" /></label>
            <label className="grid min-w-0 gap-1.5 text-sm font-bold sm:col-span-2 xl:col-span-3">Mô tả phiên<textarea maxLength={2000} value={form.description} onChange={(e) => setField('description', e.target.value)} rows={3} className="resize-y rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 py-3 font-normal outline-none focus:border-[#C59B58]" placeholder="Thông tin ưu đãi hoặc nội dung phiên" /></label>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-[#EAE4D7] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#7D715E]">Kiểm tra lại thông tin trước khi gửi lời mời đến KOL.</p>
          <button type="submit" disabled={saving || !catalog.creators.length || !catalog.products.length} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#C59B58] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#B88E4F] disabled:cursor-not-allowed disabled:opacity-50"><Radio className="h-4 w-4" />{saving ? 'Đang tạo phiên…' : 'Tạo phiên & gửi lời mời'}</button>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EAE4D7] bg-white px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBF5EB] text-[#B88E4F]"><CalendarClock className="h-5 w-5" /></span>
            <div><h2 className="text-base font-extrabold text-[#1A1612] sm:text-lg">Phiên đã tạo</h2><p className="text-xs text-[#7D715E]">{sessions.length} phiên livestream</p></div>
            {sessions.some((s) => s.status === 'LIVE') && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Đang phát trực tiếp
              </span>
            )}
          </div>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={() => setIsSessionListCollapsed((previous) => !previous)}
              aria-expanded={!isSessionListCollapsed}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2 text-xs font-bold text-[#7D715E] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] hover:text-[#1A1612]"
            >
              {isSessionListCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Mở rộng tất cả</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Thu gọn tất cả</span>
                </>
              )}
            </button>
          )}
        </div>

        {sessions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#EAE4D7] bg-white px-5 py-12 text-center text-sm text-[#7D715E]">
            <CalendarClock className="mx-auto mb-3 h-8 w-8 text-[#C59B58]" />
            <p className="font-semibold text-[#1A1612]">Chưa có phiên livestream nào</p><p className="mt-1">Tạo phiên phía trên để gửi lời mời cho KOL.</p>
          </div>
        )}

        {!isSessionListCollapsed && sessions.map((session) => {

          const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
            LIVE: { label: 'Đang livestream', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500 animate-ping' },
            SCHEDULED: { label: 'Đã lên lịch', bg: 'bg-[#FBF5EB]', text: 'text-[#B88E4F]', border: 'border-[#EEDFC6]', dot: 'bg-[#B88E4F]' },
            PENDING_CREATOR: { label: 'Chờ phản hồi', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
            PAUSED: { label: 'Tạm dừng', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
            ENDED: { label: 'Đã kết thúc', bg: 'bg-[#F3EFE6]', text: 'text-[#7D715E]', border: 'border-[#EAE4D7]', dot: 'bg-[#7D715E]' },
            CANCELLED: { label: 'Đã hủy', bg: 'bg-stone-100', text: 'text-stone-600', border: 'border-stone-200', dot: 'bg-stone-400' },
          };
          const statusConf = statusConfig[session.status] || {
            label: statusLabel[session.status] || session.status,
            bg: 'bg-gray-50',
            text: 'text-gray-700',
            border: 'border-gray-200',
            dot: 'bg-gray-400',
          };

          const inviteConfig = {
            ACCEPTED: { label: 'KOL đã đồng ý', bg: 'bg-[#FBF5EB]', text: 'text-[#B88E4F]', border: 'border-[#EEDFC6]' },
            PENDING: { label: 'Chờ KOL xác nhận', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
            REJECTED: { label: 'KOL từ chối', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
          }[session.inviteStatus] || { label: session.inviteStatus, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

          return (
            <article
              key={session.id}
              className="w-full rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-sm transition-colors hover:border-[#C59B58]/50 sm:p-5 lg:p-6"
            >
              {/* Header: Title, Status Pills & Action Buttons */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#1A1612]">{session.title}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                      {statusConf.label}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${inviteConfig.bg} ${inviteConfig.text} ${inviteConfig.border}`}>
                      {inviteConfig.label}
                    </span>
                  </div>

                  {/* Metadata: Platform, Creator, Time Range */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#7D715E]">
                    {session.platform === 'SCANMS' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-xs font-bold text-[#B88E4F]">
                        <Radio className="w-3 h-3 text-[#B88E4F] animate-pulse" />
                        SCANMS Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE4D7] text-xs font-bold text-[#1A1612]">
                        {session.platform}
                      </span>
                    )}
                    {session.platform === 'SCANMS' && shortLiveCode(session.liveUrl) && (
                      <span className="font-mono font-semibold text-[#1A1612]">Mã phiên: {shortLiveCode(session.liveUrl)}</span>
                    )}
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Users className="w-3 h-3 text-[#B88E4F]" />
                      <span>KOL:</span>
                      <strong className="text-[#1A1612]">{session.creator.fullName}</strong>
                      <span>({session.creator.id.replace(/-/g, '').slice(0, 8).toUpperCase()})</span>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#B88E4F]" />
                      <span>{localDateTime(session.startsAt)} – {localDateTime(session.endsAt)}</span>
                    </span>
                  </div>

                  {/* Voucher & Products Section */}
                  {!!session.externalChannels?.length && (
                    <div className="mt-3 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs">
                      <p className="font-bold text-[#1A1612]">Kênh phát sóng · số người theo dõi do Shop nhập</p>
                      <div className="mt-2 grid gap-1.5">
                        {session.externalChannels.map((channel, index) => <a key={`${channel.channelUrl}-${index}`} href={channel.channelUrl} target="_blank" rel="noreferrer" className="flex flex-wrap items-center gap-2 break-all text-[#B88E4F] hover:underline"><ExternalLink className="h-3.5 w-3.5 shrink-0" />{channel.channelUrl}<span className="font-bold text-[#1A1612]">· {Number(channel.followerCount).toLocaleString('vi-VN')} người theo dõi</span></a>)}
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2.5 pt-2.5 border-t border-[#EAE4D7]/60">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] text-xs font-bold text-[#B88E4F]">
                      <Ticket className="w-3.5 h-3.5 text-[#B88E4F]" />
                      <span>Mã {session.coupon.displayCode}</span>
                      <span className="text-[#1A1612]">· Giảm {session.coupon.discountType === 'PERCENTAGE' ? `${session.coupon.discountValue}%` : currency(Number(session.coupon.discountValue))}</span>
                    </div>

                    {session.products.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-[#7D715E]">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                        <span>Sản phẩm:</span>
                        <span className="font-semibold text-[#1A1612]">
                          {session.products.map((item) => item.product.title).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right action buttons: Link & Collapse */}
                <div className="flex items-center gap-2 shrink-0">
                  {session.liveUrl && (
                    <a
                      href={session.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F3EFE6] px-3 py-1.5 text-xs font-bold text-[#1A1612] hover:border-[#C59B58] transition shadow-2xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[#B88E4F]" />
                      <span>{session.platform === 'SCANMS' ? 'Xem phòng live sàn' : 'Mở link live'}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Live viewers and settled financial metrics */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                {[
                  { label: 'Đang xem', value: session.platform === 'SCANMS' ? (session.report.currentViewers ?? 0) : '—', isMoney: false },
                  { label: 'Tổng lượt xem', value: session.platform === 'SCANMS' ? (session.report.totalViewers ?? 0) : '—', isMoney: false },
                  { label: 'Lượt nhận mã', value: session.report.claims, isMoney: false },
                  { label: 'Tổng đơn hàng', value: session.report.orders, isMoney: false },
                  { label: 'Người mua', value: session.report.buyers ?? 0, isMoney: false },
                  { label: 'Đơn chờ thanh toán', value: session.report.pendingOrders || 0, isMoney: false },
                  { label: 'Doanh số đã chốt', value: currency(session.report.grossSales), isMoney: true },
                  { label: 'Giảm giá voucher', value: currency(session.report.voucherDiscount), isMoney: true },
                  { label: 'Hoa hồng đã chốt', value: currency(session.report.commission), isMoney: true },
                ].map((stat, sIdx) => (
                  <div
                    key={sIdx}
                    className="min-w-0 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 transition-colors hover:bg-[#FBF5EB]/70"
                  >
                    <p className="text-[11px] font-medium text-[#7D715E] truncate">{stat.label}</p>
                    <p className={`mt-1 font-mono font-black text-sm truncate ${stat.isMoney ? 'text-[#B88E4F]' : 'text-[#1A1612]'}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Broadcast Controls */}
              {session.status !== 'ENDED' && session.status !== 'CANCELLED' && (
                <div className="mt-4 pt-3 border-t border-[#EAE4D7]/60 flex flex-wrap items-center gap-2">
                  {session.inviteStatus === 'PENDING' && (
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Đang chờ KOL xác nhận lời mời. Sau khi KOL đồng ý mới có thể mở phiên phát sóng.</span>
                    </div>
                  )}

                  {session.inviteStatus === 'REJECTED' && (
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-800">
                      <span>KOL đã từ chối lời mời phiên live này. Bạn có thể tạo lời mời mới.</span>
                    </div>
                  )}

                  {session.inviteStatus === 'ACCEPTED' && session.status !== 'LIVE' && (
                    <button
                      type="button"
                      onClick={() => void changeState(session, 'START_NOW')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] px-4 py-2 text-xs font-bold text-white shadow-2xs transition active:scale-95 cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Mở phiên phát sóng ngay</span>
                    </button>
                  )}
                </div>
              )}
              <LiveGovernancePanel session={session} audience="shop" onChanged={() => void loadSessions(storeId)} />
            </article>
          );
        })}
      </section>
      {!catalog.creators.length && <div className="flex items-center gap-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-sm text-[#7D715E]"><Users className="h-4 w-4 text-[#B88E4F]" /> Shop cần duyệt hợp tác với KOL trước khi có thể mời vào phiên livestream.</div>}
      <div className="flex items-center gap-2 text-xs text-[#7D715E]"><CalendarClock className="h-4 w-4" /> Trạng thái được hệ thống tự chuyển theo thời gian; voucher bị khóa sau thời điểm kết thúc.</div>
    </div>
  );
}
