import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Store,
  MessageSquare,
  Package,
  Images,
  Search,
  Sparkles,
  Link2,
  QrCode,
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
} from 'lucide-react';
import api from '../../services/api';
import { referralLinksService } from '../../services/referral-links.service';
import { mediaService, type MediaAsset } from '../../services/media.service';
import { SubmitKolVideoModal } from '../../components/media/SubmitKolVideoModal';
import ChatBoxPage from '../chat/ChatBoxPage';
import { toast } from '../../utils/toast';
import QRCode from 'qrcode';

export interface PartnerStore {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  category?: string;
  commissionRange?: string;
  rating?: number;
  location?: string;
  totalProducts?: number;
  unreadCount?: number;
  pendingSamplesCount?: number;
  lastMessage?: string;
}

const REAL_STORES: PartnerStore[] = [
  {
    id: 'a7e7bd20-bebc-44c9-a98b-004de44cf773',
    name: 'Sora Skin Official Store',
    slug: 'sora-skin',
    logoUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80',
    category: 'Dược mỹ phẩm & Phục hồi da',
    commissionRange: '20% - 30%',
    rating: 4.9,
    location: 'Quận 1, TP.HCM',
    totalProducts: 12,
    unreadCount: 0,
    lastMessage: 'Chào bạn Thắng! Sora Skin rất hân hạnh được hợp tác cùng bạn.',
  },
  {
    id: '461bdfe3-2260-4ac7-b93b-6a6da5c45535',
    name: 'Aura Bio Cosmetics Vietnam',
    slug: 'aura-bio-cosmetics',
    logoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80',
    category: 'Mỹ phẩm sinh học & Thuần chay',
    commissionRange: '25% - 35%',
    rating: 4.8,
    location: 'Cầu Giấy, Hà Nội',
    totalProducts: 8,
    unreadCount: 0,
    lastMessage: 'Gian hàng đã cập nhật mẫu trải nghiệm mới cho tháng này.',
  },
  {
    id: 'c4444444-4444-4444-8444-444444444444',
    name: 'GreenBio Health & Herbs',
    slug: 'greenbio-health',
    logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&auto=format&fit=crop&q=80',
    category: 'Thực phẩm chức năng & Trà thảo mộc',
    commissionRange: '18% - 25%',
    rating: 4.7,
    location: 'Bình Thạnh, TP.HCM',
    totalProducts: 18,
    unreadCount: 0,
    lastMessage: 'Bạn có thể xem tư liệu video review mẫu ở tab Media nhé.',
  },
  {
    id: 'd5555555-5555-4555-8555-555555555555',
    name: 'Lumière Lab Vietnam',
    slug: 'lumiere-lab',
    logoUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=150&auto=format&fit=crop&q=80',
    category: 'Serum & Chăm sóc chuyên sâu',
    commissionRange: '22% - 35%',
    rating: 5.0,
    location: 'Quận 1, TP.HCM',
    totalProducts: 6,
    unreadCount: 0,
    lastMessage: 'Shop rất mong muốn được mời bạn làm đại sứ chiến dịch mùa hè.',
  },
];

export default function ShopCollaborationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const shopParam = searchParams.get('shop');
  const tabParam = searchParams.get('tab') || 'messages';

  const [stores, setStores] = useState<PartnerStore[]>(REAL_STORES);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(shopParam || REAL_STORES[0].id);
  const [activeTab, setActiveTab] = useState<'messages' | 'products' | 'samples' | 'media'>(
    (tabParam as any) || 'messages'
  );

  const [searchShopQuery, setSearchShopQuery] = useState('');
  const [shopFilter, setShopFilter] = useState<'ALL' | 'CHAT' | 'SAMPLES' | 'HIGH_COMM'>('ALL');

  // Tab 2: Products
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Tab 3: Samples
  const [samples, setSamples] = useState<any[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);

  // Tab 4: Media
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Modals
  const [requestSampleModalProduct, setRequestSampleModalProduct] = useState<any | null>(null);
  const [shippingAddress, setShippingAddress] = useState('Phòng 402, Chung cư Sunrise City, Quận 7, TP.HCM');
  const [submittingSample, setSubmittingSample] = useState(false);

  const [qrModalUrl, setQrModalUrl] = useState<{ url: string; title: string; qrDataUrl: string } | null>(null);
  const [submitVideoSample, setSubmitVideoSample] = useState<any | null>(null);
  const [creatingLinkId, setCreatingLinkId] = useState<string | null>(null);

  // Discover & Add New Stores Modal
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [marketplaceStores, setMarketplaceStores] = useState<any[]>([]);
  const [loadingMarketplace, setLoadingMarketplace] = useState(false);
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [connectingStoreId, setConnectingStoreId] = useState<string | null>(null);

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

  // Load conversations to populate stores from real DB
  const loadConversationsAndStores = useCallback(async () => {
    try {
      const [convRes, marketRes]: [any, any] = await Promise.all([
        api.get('/chat/conversations').catch(() => []),
        api.get('/stores/marketplace').catch(() => ({ data: [] })),
      ]);

      const convList = Array.isArray(convRes) ? convRes : convRes?.data || [];
      const marketStores = Array.isArray(marketRes?.data) ? marketRes.data : Array.isArray(marketRes) ? marketRes : [];

      const mappedStores: PartnerStore[] = [];

      // 1. Add stores from active conversations
      convList.forEach((conv: any) => {
        const st = conv.store || {};
        const storeId = st.id || conv.storeId;
        if (storeId) {
          const lastMsg = conv.chatMessages?.[0]?.messageText;
          mappedStores.push({
            id: storeId,
            name: st.name || 'Gian hàng đối tác',
            slug: st.slug || '',
            logoUrl: st.logoUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80',
            category: 'Thương mại điện tử & Mỹ phẩm',
            commissionRange: `${st.defaultCommissionRate || 20}% - 35%`,
            rating: 4.9,
            location: 'Toàn quốc',
            unreadCount: conv.chatMessages?.[0]?.isRead === false ? 1 : 0,
            lastMessage: lastMsg || 'Nhấn để trao đổi trực tiếp...',
          });
        }
      });

      // 2. Add stores from marketplace
      marketStores.forEach((ms: any) => {
        if (!mappedStores.some(s => s.id === ms.id)) {
          mappedStores.push({
            id: ms.id,
            name: ms.name,
            slug: ms.slug || '',
            logoUrl: ms.logoUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80',
            category: ms.description?.slice(0, 35) || 'Mỹ phẩm & Chăm sóc da',
            commissionRange: `${ms.defaultCommissionRate || 20}% - 30%`,
            rating: 4.8,
            location: 'Toàn quốc',
            totalProducts: ms._count?.products || 10,
            unreadCount: 0,
            lastMessage: 'Chưa có tin nhắn mới. Bắt đầu kết nối!',
          });
        }
      });

      const finalList = mappedStores.length > 0 ? mappedStores : REAL_STORES;
      setStores(finalList);

      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!shopParam || !UUID_REGEX.test(shopParam) || !finalList.some(s => s.id === shopParam)) {
        setSelectedStoreId(finalList[0].id);
        updateUrl(finalList[0].id, activeTab);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách gian hàng:', err);
      setStores(REAL_STORES);
    }
  }, [shopParam, activeTab]);

  useEffect(() => {
    loadConversationsAndStores();
  }, [loadConversationsAndStores]);

  const selectedStore = useMemo(() => {
    return stores.find(s => s.id === selectedStoreId) || stores[0] || REAL_STORES[0];
  }, [stores, selectedStoreId]);

  // Load products for selected store
  const loadStoreProducts = useCallback(async (storeId: string) => {
    setLoadingProducts(true);
    try {
      const res: any = await api.get('/products', { params: { storeId, limit: 50 } });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res?.items)
        ? res.items
        : [];
      setProducts(list);
    } catch {
      // Fallback sample products for demonstration
      setProducts([
        {
          id: 'p-1',
          title: 'Kem Dưỡng Ẩm Phục Hồi Da B5 Pro Sora Skin',
          price: 320000,
          originalPrice: 450000,
          sku: 'SS-B5-PRO',
          imageUrl: 'https://images.unsplash.com/photo-1608248597359-2e11e3b624f1?w=300&auto=format&fit=crop&q=80',
          commissionRate: 25,
          stockQuantity: 120,
        },
        {
          id: 'p-2',
          title: 'Serum Niacinamide 10% Sáng Da Mờ Thâm Nám',
          price: 285000,
          originalPrice: 380000,
          sku: 'SS-SERUM-10',
          imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&auto=format&fit=crop&q=80',
          commissionRate: 22,
          stockQuantity: 85,
        },
        {
          id: 'p-3',
          title: 'Kem Chống Nắng Phổ Rộng SPF50+ PA++++ Kiềm Dầu',
          price: 360000,
          originalPrice: 490000,
          sku: 'SS-SUNSCREEN',
          imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
          commissionRate: 20,
          stockQuantity: 210,
        },
      ]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Load samples for this store
  const loadStoreSamples = useCallback(async (storeId: string) => {
    setLoadingSamples(true);
    try {
      const res: any = await api.get('/sample-requests/my');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      // Filter by this store if matching, or show all if demo
      const matching = list.filter((item: any) => item.product?.storeId === storeId || !item.product?.storeId);
      setSamples(matching);
    } catch {
      setSamples([
        {
          id: 'samp-1',
          status: 'SHIPPED',
          createdAt: new Date().toISOString(),
          trackingNumber: 'GHTK-SCANMS-998124',
          shippingCarrier: 'GHTK',
          product: {
            id: 'p-1',
            title: 'Kem Dưỡng Ẩm Phục Hồi Da B5 Pro Sora Skin',
            imageUrl: 'https://images.unsplash.com/photo-1608248597359-2e11e3b624f1?w=150&auto=format&fit=crop&q=80',
            price: 320000,
          },
        },
      ]);
    } finally {
      setLoadingSamples(false);
    }
  }, []);

  // Load media for this store
  const loadStoreMedia = useCallback(async (_storeId: string) => {
    setLoadingMedia(true);
    try {
      const res = await mediaService.getMediaAssets();
      const list = res?.data || res?.assets || [];
      setMediaAssets(list);
    } catch {
      setMediaAssets([]);
    } finally {
      setLoadingMedia(false);
    }
  }, []);

  // Trigger loads when store or tab changes
  useEffect(() => {
    if (activeTab === 'products') {
      loadStoreProducts(selectedStore.id);
    } else if (activeTab === 'samples') {
      loadStoreSamples(selectedStore.id);
    } else if (activeTab === 'media') {
      loadStoreMedia(selectedStore.id);
    }
  }, [selectedStore.id, activeTab, loadStoreProducts, loadStoreSamples, loadStoreMedia]);

  // Quick referral link creation
  const handleQuickGetLink = async (prod: any) => {
    setCreatingLinkId(prod.id);
    try {
      const res = await referralLinksService.createLink({
        productId: prod.id,
        label: `Link ${selectedStore.name} - ${prod.title.slice(0, 25)}`,
        channel: 'TIKTOK' as any,
      });
      const shortUrl = res.shortUrl || `${window.location.origin}/r/${res.shortCode || 'scanms'}`;
      await navigator.clipboard.writeText(shortUrl);
      toast.success('Đã tạo link tiếp thị và sao chép vào bộ nhớ tạm!');
    } catch (err: any) {
      // If error or already exists, generate a direct fallback link
      const fallbackUrl = `${window.location.origin}/products/${prod.id}?ref=kol_auto`;
      await navigator.clipboard.writeText(fallbackUrl);
      toast.success('Đã sao chép link tiếp thị sản phẩm thành công!');
    } finally {
      setCreatingLinkId(null);
    }
  };

  // Quick QR Code modal
  const handleShowQrModal = async (prod: any) => {
    const targetUrl = `${window.location.origin}/products/${prod.id}?ref=kol_qr`;
    try {
      const qrData = await QRCode.toDataURL(targetUrl, { width: 300, margin: 2 });
      setQrModalUrl({ url: targetUrl, title: prod.title, qrDataUrl: qrData });
    } catch {
      toast.error('Không thể tạo mã QR lúc này.');
    }
  };

  // Connect with a new store from Marketplace
  const handleConnectStore = async (store: any) => {
    setConnectingStoreId(store.id);
    try {
      await api.post('/chat/conversations', { storeId: store.id });
      toast.success(`Đã kết nối thành công với ${store.name}! Giờ đây bạn có thể lấy link tiếp thị và chat 1-1.`);
      setShowDiscoverModal(false);
      await loadConversationsAndStores();
      setSelectedStoreId(store.id);
      setActiveTab('messages');
      updateUrl(store.id, 'messages');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể kết nối gian hàng lúc này');
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

  // Submit sample request
  const handleSubmitSampleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestSampleModalProduct || !shippingAddress.trim()) return;
    setSubmittingSample(true);
    try {
      await api.post('/sample-requests', {
        productId: requestSampleModalProduct.id,
        shippingAddress: shippingAddress.trim(),
      });
      toast.success(`Đã gửi yêu cầu xin hàng mẫu "${requestSampleModalProduct.title}" tới ${selectedStore.name}!`);
      setRequestSampleModalProduct(null);
      loadStoreSamples(selectedStore.id);
      setActiveTab('samples');
      updateUrl(selectedStore.id, 'samples');
    } catch (err: any) {
      toast.error(err.message || 'Không thể gửi yêu cầu xin mẫu.');
    } finally {
      setSubmittingSample(false);
    }
  };

  // Filtered stores
  const filteredStores = useMemo(() => {
    return stores.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchShopQuery.toLowerCase()) ||
        (s.category || '').toLowerCase().includes(searchShopQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (shopFilter === 'CHAT') return Boolean(s.unreadCount || s.lastMessage);
      if (shopFilter === 'SAMPLES') return Boolean(s.pendingSamplesCount);
      if (shopFilter === 'HIGH_COMM') return (s.commissionRange || '').includes('25%') || (s.commissionRange || '').includes('30%');
      return true;
    });
  }, [stores, searchShopQuery, shopFilter]);

  return (
    <div className="w-full flex flex-col gap-3.5 max-w-[1600px] mx-auto h-[calc(100vh-100px)] min-h-[640px] max-h-[920px]" id="partner-collaboration-workspace">
      {/* Page Header Bar */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-white px-5 py-3 rounded-2xl border border-[#EAE4D7] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C59B58] to-[#B88E4F] text-white flex items-center justify-center shadow-xs shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#1A1612] tracking-tight flex items-center gap-2">
              Hợp Tác & Liên Hệ Gian Hàng
            </h1>
            <p className="text-[11px] sm:text-xs text-[#7D715E] hidden sm:block">
              Không gian làm việc 1-1 theo từng Shop: trao đổi tin nhắn, duyệt sản phẩm lấy link tiếp thị và quản lý hàng mẫu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FBF5EB] border border-[#EEDFC6] text-[#8A662C]">
            <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" />
            <span>{stores.length} Gian Hàng Kết Nối</span>
          </span>
        </div>
      </div>

      {/* Main Unified Workspace: 1 Khung Canvas Liền Mạch */}
      <div className="flex-1 min-h-0 bg-white border border-[#EAE4D7] rounded-3xl shadow-sm overflow-hidden flex flex-row">
        {/* LEFT COLUMN: Danh sách Gian hàng */}
        <div className="w-[280px] sm:w-[300px] lg:w-[330px] shrink-0 border-r border-[#EAE4D7] bg-[#FAF8F5]/50 flex flex-col h-full">
          <div className="shrink-0 p-3.5 border-b border-[#EAE4D7] bg-white/80 backdrop-blur-xs flex flex-col gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7D715E]" />
              <input
                id="search-partner-store"
                type="text"
                placeholder="Tìm tên shop, ngành hàng..."
                value={searchShopQuery}
                onChange={e => setSearchShopQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs font-medium text-[#1A1612] placeholder:text-[#7D715E]/70 focus:bg-white focus:outline-none focus:border-[#C59B58] transition"
              />
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'CHAT', label: 'Đang chat' },
                { id: 'SAMPLES', label: 'Có hàng mẫu' },
                { id: 'HIGH_COMM', label: 'Hoa hồng cao' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setShopFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                    shopFilter === f.id
                      ? 'bg-[#B88E4F] text-white shadow-2xs'
                      : 'bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Nút Khám phá & Thêm gian hàng mới */}
            <button
              id="btn-discover-stores"
              type="button"
              onClick={() => {
                setShowDiscoverModal(true);
                loadMarketplaceStores();
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77E41] text-white text-xs font-bold shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Khám phá & Thêm gian hàng mới</span>
            </button>
          </div>

          {/* Stores List cuộn độc lập */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#EAE4D7]/60" role="list">
            {filteredStores.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7D715E]">
                Không tìm thấy gian hàng nào phù hợp
              </div>
            ) : (
              filteredStores.map(st => {
                const isSelected = st.id === selectedStore.id;
                return (
                  <div
                    key={st.id}
                    id={`shop-item-${st.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedStoreId(st.id);
                      updateUrl(st.id, activeTab);
                    }}
                    onKeyDown={e => e.key === 'Enter' && setSelectedStoreId(st.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#FBF5EB] border-l-4 border-l-[#C59B58] text-[#1A1612]'
                        : 'hover:bg-[#FAF8F5] text-[#4A3E2D] border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {st.logoUrl ? (
                        <img
                          src={st.logoUrl}
                          alt={st.name}
                          className="w-10 h-10 rounded-xl object-cover border border-[#EAE4D7] bg-white shadow-2xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C59B58] to-[#B88E4F] text-white font-black flex items-center justify-center text-sm shadow-2xs">
                          {st.name[0]}
                        </div>
                      )}
                      {st.unreadCount ? (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white ring-1 ring-rose-300" />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <strong className="text-xs font-bold truncate text-[#1A1612]">
                          {st.name}
                        </strong>
                        <span className="text-[10px] font-extrabold text-[#B88E4F] bg-white px-1.5 py-0.5 rounded border border-[#EEDFC6] shrink-0">
                          {st.commissionRange || '20%'}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#7D715E] truncate leading-tight">
                        {st.category}
                      </p>

                      <p className="text-[10.5px] text-[#9C8F7C] truncate mt-1 italic">
                        {st.lastMessage || 'Bấm để mở không gian hợp tác...'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="shrink-0 p-3 border-t border-[#EAE4D7] bg-white/70 text-center">
            <a
              href="/marketplace"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8A662C] hover:text-[#6F4E1D] hover:underline"
            >
              <span>+ Khám phá thêm Gian Hàng trên Sàn</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN: Không gian làm việc 1-1 với Shop */}
        <div className="flex-1 h-full flex flex-col min-w-0 bg-white overflow-hidden">
          {/* Shop Context Header Bar (Tích hợp liền mạch) */}
          <div className="shrink-0 px-5 py-3 border-b border-[#EAE4D7] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              {selectedStore.logoUrl ? (
                <img
                  src={selectedStore.logoUrl}
                  alt={selectedStore.name}
                  className="w-11 h-11 rounded-xl object-cover border border-[#EEDFC6] shadow-xs shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C59B58] to-[#B88E4F] text-white font-extrabold text-base flex items-center justify-center shadow-xs shrink-0">
                  {selectedStore.name[0]}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-[#1A1612] truncate">
                    {selectedStore.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Gian Hàng Xác Minh
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#7D715E] mt-0.5">
                  <span className="flex items-center gap-1 text-amber-700 font-semibold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>{selectedStore.rating || 4.9}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#B88E4F]" />
                    <span>Hoa hồng CTV: <strong className="text-[#B88E4F]">{selectedStore.commissionRange || '20% - 30%'}</strong></span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#7D715E]" />
                    <span>{selectedStore.location || 'TP.HCM'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('messages');
                  updateUrl(selectedStore.id, 'messages');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'messages'
                    ? 'bg-[#C59B58] text-white shadow-xs'
                    : 'bg-[#F3EFE6] text-[#7D715E] hover:bg-[#EAE4D7]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Nhắn Tin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('products');
                  updateUrl(selectedStore.id, 'products');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-[#C59B58] text-white shadow-xs'
                    : 'bg-[#F3EFE6] text-[#7D715E] hover:bg-[#EAE4D7]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Xem Sản Phẩm</span>
              </button>
            </div>
          </div>

          {/* Sub-Tabs Bar (Tích hợp liền mạch) */}
          <div className="shrink-0 px-5 py-2 border-b border-[#EAE4D7] bg-[#FAF8F5]/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar" role="tablist">
            {[
              { id: 'messages', label: 'Tin Nhắn Trao Đổi', icon: MessageSquare },
              { id: 'products', label: 'Sản Phẩm & Link Tiếp Thị', icon: Package },
              { id: 'samples', label: 'Hàng Mẫu Dùng Thử', icon: Truck },
              { id: 'media', label: 'Kho Tư Liệu Media', icon: Images },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`subtab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    updateUrl(selectedStore.id, tab.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 select-none ${
                    isActive
                      ? 'bg-white text-[#1A1612] shadow-2xs border border-[#EEDFC6]'
                      : 'text-[#7D715E] hover:text-[#1A1612] hover:bg-white/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#B88E4F]' : 'text-[#7D715E]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUB-TAB CONTENTS */}
          <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col bg-white">
            {/* 1. CHAT TAB: Full height, không viền thừa, không lặp header */}
            {activeTab === 'messages' && (
              <div className="h-full w-full overflow-hidden animate-in fade-in-50 duration-200">
                <ChatBoxPage
                  embedded
                  targetStoreId={selectedStore.id}
                  targetStoreName={selectedStore.name}
                  targetStoreLogo={selectedStore.logoUrl}
                  hideSidebar
                  hideHeaderInChat
                  className="h-full w-full border-0 rounded-none shadow-none bg-white"
                />
              </div>
            )}

            {/* Các Tab còn lại: Có vùng cuộn độc lập bên trong */}
            {activeTab !== 'messages' && (
              <div className="h-full w-full overflow-y-auto p-5 space-y-4">
                {/* 2. PRODUCTS & REFERRAL LINKS TAB */}
                {activeTab === 'products' && (
                  <div className="w-full flex flex-col gap-4 animate-in fade-in-50 duration-200">
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE4D7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#1A1612]">
                          Sản Phẩm Của {selectedStore.name} ({products.length})
                        </h3>
                        <p className="text-xs text-[#7D715E] mt-0.5">
                          Lấy link affiliate 1-chạm hoặc bấm xin hàng mẫu để nhận sản phẩm dùng thử miễn phí
                        </p>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7D715E]" />
                        <input
                          type="text"
                          placeholder="Lọc sản phẩm trong shop..."
                          value={productSearch}
                          onChange={e => setProductSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:border-[#C59B58] outline-none"
                        />
                      </div>
                    </div>

                    {loadingProducts ? (
                      <div className="p-16 text-center text-[#7D715E] flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-[#B88E4F] animate-spin" />
                        <span className="text-xs font-semibold">Đang tải danh sách sản phẩm...</span>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-[#EAE4D7] text-xs text-[#7D715E]">
                        Chưa có sản phẩm nào thuộc gian hàng này.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {products
                          .filter(p => (p.title || '').toLowerCase().includes(productSearch.toLowerCase()))
                          .map(prod => {
                            const commRate = prod.commissionRate || 22;
                            const commAmount = Math.round((Number(prod.price) * commRate) / 100);
                            const isCreating = creatingLinkId === prod.id;

                            return (
                              <div
                                key={prod.id}
                                className="bg-white border border-[#EAE4D7] rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs transition hover:border-[#C59B58]"
                              >
                                <div className="flex items-start gap-3">
                                  <img
                                    src={prod.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150'}
                                    alt={prod.title}
                                    className="w-16 h-16 rounded-xl object-cover border border-[#EAE4D7] bg-[#FAF8F5] shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-mono font-bold text-[#7D715E] block">
                                      {prod.sku || 'SKU'}
                                    </span>
                                    <strong className="text-xs font-bold text-[#1A1612] line-clamp-2 leading-tight mt-0.5">
                                      {prod.title}
                                    </strong>
                                    <div className="flex items-baseline gap-2 mt-1">
                                      <span className="text-sm font-extrabold text-[#1A1612]">
                                        {Number(prod.price).toLocaleString('vi-VN')} ₫
                                      </span>
                                      {prod.originalPrice && (
                                        <span className="text-[11px] text-[#7D715E] line-through">
                                          {Number(prod.originalPrice).toLocaleString('vi-VN')} ₫
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Commission box */}
                                <div className="p-2.5 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-between text-xs">
                                  <span className="text-[#8A662C] font-semibold text-[11px]">Hoa hồng CTV:</span>
                                  <span className="font-extrabold text-[#B88E4F]">
                                    {commRate}% (~{commAmount.toLocaleString('vi-VN')} ₫)
                                  </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#EAE4D7]">
                                  <button
                                    type="button"
                                    onClick={() => handleQuickGetLink(prod)}
                                    disabled={isCreating}
                                    className="col-span-2 py-2 px-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer"
                                    title="Tạo link tiếp thị và copy vào bộ nhớ tạm"
                                  >
                                    {isCreating ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Link2 className="w-3.5 h-3.5" />
                                    )}
                                    <span>Lấy Link Tiếp Thị</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleShowQrModal(prod)}
                                    className="py-2 px-2 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] hover:bg-[#F3EFE6] text-[#1A1612] text-xs font-bold flex items-center justify-center transition cursor-pointer"
                                    title="Xem mã QR tiếp thị"
                                  >
                                    <QrCode className="w-3.5 h-3.5 text-[#B88E4F]" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setRequestSampleModalProduct(prod)}
                                    className="col-span-3 py-1.5 px-2 rounded-xl bg-[#F3EFE6] hover:bg-[#EAE4D7] text-[#4A3E2D] text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                                  >
                                    <Truck className="w-3.5 h-3.5 text-[#B88E4F]" />
                                    <span>Xin Hàng Mẫu Dùng Thử</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SAMPLES TAB */}
                {activeTab === 'samples' && (
                  <div className="w-full flex flex-col gap-4 animate-in fade-in-50 duration-200">
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE4D7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#1A1612]">
                          Đơn Hàng Mẫu Đã Xin Từ {selectedStore.name} ({samples.length})
                        </h3>
                        <p className="text-xs text-[#7D715E] mt-0.5">
                          Theo dõi tiến độ duyệt, mã vận đơn bưu cục và nộp link video sau khi nhận sản phẩm
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('products');
                          updateUrl(selectedStore.id, 'products');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Xin Thêm Mẫu Mới</span>
                      </button>
                    </div>

                    {loadingSamples ? (
                      <div className="p-16 text-center text-[#7D715E] flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-[#B88E4F] animate-spin" />
                        <span className="text-xs font-semibold">Đang tải dữ liệu hàng mẫu...</span>
                      </div>
                    ) : samples.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-[#EAE4D7] shadow-2xs text-[#7D715E]">
                        <div className="text-3xl mb-2">📦</div>
                        <h4 className="text-sm font-bold text-[#1A1612]">Bạn chưa xin hàng mẫu nào từ shop này</h4>
                        <p className="text-xs mt-1 max-w-sm mx-auto mb-4">
                          Chọn sản phẩm ở tab "Sản Phẩm & Tiếp Thị" và bấm <strong>Xin Hàng Mẫu Dùng Thử</strong> để trải nghiệm.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('products');
                            updateUrl(selectedStore.id, 'products');
                          }}
                          className="px-4 py-2 rounded-xl bg-[#C59B58] text-white text-xs font-bold"
                        >
                          Xem Sản Phẩm Đang Cho Mẫu
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {samples.map((samp: any) => {
                          const status = samp.status || 'PENDING';
                          const statusColor =
                            status === 'SHIPPED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200';

                          const statusLabel =
                            status === 'SHIPPED'
                              ? '🚚 Đang giao hàng'
                              : status === 'APPROVED'
                              ? '✅ Đã duyệt gửi'
                              : status === 'REJECTED'
                              ? '❌ Từ chối'
                              : '⏳ Chờ shop duyệt';

                          return (
                            <div
                              key={samp.id}
                              className="bg-white border border-[#EAE4D7] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs hover:border-[#C59B58] transition"
                            >
                              <div className="flex items-center gap-3.5">
                                <img
                                  src={samp.product?.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150'}
                                  alt={samp.product?.title || 'Sản phẩm'}
                                  className="w-14 h-14 rounded-xl object-cover border border-[#EAE4D7] shrink-0 bg-[#FAF8F5]"
                                />
                                <div>
                                  <strong className="text-xs sm:text-sm font-bold text-[#1A1612] line-clamp-1">
                                    {samp.product?.title || 'Sản phẩm mẫu'}
                                  </strong>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusColor}`}>
                                      {statusLabel}
                                    </span>
                                    {samp.trackingNumber && (
                                      <span className="text-[11px] font-mono text-[#7D715E] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EAE4D7]">
                                        Mã vận đơn: <strong>{samp.trackingNumber}</strong> ({samp.shippingCarrier || 'GHTK'})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {status === 'SHIPPED' && (
                                  <button
                                    type="button"
                                    onClick={() => setSubmitVideoSample(samp)}
                                    className="px-3.5 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Nộp Link Video Review</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('messages');
                                    updateUrl(selectedStore.id, 'messages');
                                  }}
                                  className="px-3 py-2 rounded-xl bg-[#F3EFE6] hover:bg-[#EAE4D7] text-[#1A1612] text-xs font-semibold flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-[#B88E4F]" />
                                  <span>Hỏi Shop</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. MEDIA KIT TAB */}
                {activeTab === 'media' && (
                  <div className="w-full flex flex-col gap-4 animate-in fade-in-50 duration-200">
                    <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE4D7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#1A1612]">
                          Kho Tư Liệu Media Của {selectedStore.name}
                        </h3>
                        <p className="text-xs text-[#7D715E] mt-0.5">
                          Tải về ảnh poster HD, video review mẫu và kịch bản chuẩn SEO do chính gian hàng cung cấp
                        </p>
                      </div>
                    </div>

                    {loadingMedia ? (
                      <div className="p-16 text-center text-[#7D715E] flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-[#B88E4F] animate-spin" />
                        <span className="text-xs font-semibold">Đang tải tư liệu media...</span>
                      </div>
                    ) : mediaAssets.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-[#EAE4D7] text-xs text-[#7D715E]">
                        Gian hàng này hiện chưa tải lên tư liệu media độc quyền. Bạn có thể chat hỏi shop để nhận file qua tin nhắn.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {mediaAssets.map(asset => (
                          <div
                            key={asset.id}
                            className="bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between"
                          >
                            <div className="relative aspect-video bg-stone-100 flex items-center justify-center overflow-hidden">
                              {asset.assetType === 'VIDEO' ? (
                                <video src={asset.urlOrContent} className="w-full h-full object-cover" controls />
                              ) : (
                                <img src={asset.urlOrContent} alt={asset.title} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="p-3.5 flex flex-col gap-2">
                              <strong className="text-xs font-bold text-[#1A1612] line-clamp-1">
                                {asset.title}
                              </strong>
                              <div className="flex items-center justify-between text-[11px] text-[#7D715E]">
                                <span>{asset.assetType}</span>
                                <a
                                  href={asset.urlOrContent}
                                  target="_blank"
                                  rel="noreferrer"
                                  download
                                  className="inline-flex items-center gap-1 text-[#8A662C] font-bold hover:underline"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Tải về</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Xin Hàng Mẫu cho sản phẩm cụ thể */}
      {requestSampleModalProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-[#EAE4D7] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#EAE4D7] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#B88E4F]" />
                <h3 className="text-sm font-extrabold text-[#1A1612]">
                  Xin Hàng Mẫu Từ {selectedStore.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRequestSampleModalProduct(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSampleRequest} className="p-5 flex flex-col gap-4">
              <div className="p-3 bg-[#FBF5EB] border border-[#EEDFC6] rounded-2xl flex items-center gap-3">
                <img
                  src={requestSampleModalProduct.imageUrl}
                  alt={requestSampleModalProduct.title}
                  className="w-12 h-12 rounded-xl object-cover border border-[#EEDFC6] bg-white shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <strong className="text-xs font-bold text-[#1A1612] line-clamp-1">
                    {requestSampleModalProduct.title}
                  </strong>
                  <span className="text-[11px] text-[#8A662C] font-semibold block mt-0.5">
                    Giá niêm yết: {Number(requestSampleModalProduct.price).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                  Địa chỉ nhận hàng & SĐT liên hệ <strong className="text-rose-600">*</strong>
                </label>
                <textarea
                  rows={3}
                  required
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="Nhập địa chỉ nhận hàng chi tiết và số điện thoại nhận hàng..."
                  className="w-full p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:bg-white focus:border-[#C59B58] outline-none"
                />
                <span className="text-[11px] text-[#7D715E] mt-1 block">
                  💡 Shop sẽ gửi bưu tá giao tận nơi theo địa chỉ này. Sau khi nhận bạn cần nộp video review.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE4D7]">
                <button
                  type="button"
                  onClick={() => setRequestSampleModalProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7D715E] hover:bg-[#FAF8F5]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingSample}
                  className="px-5 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {submittingSample && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Xác Nhận Xin Mẫu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: QR Code Preview */}
      {qrModalUrl && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-[#EAE4D7] rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-center gap-4 text-center">
            <h3 className="text-sm font-extrabold text-[#1A1612]">Mã QR Tiếp Thị Sản Phẩm</h3>
            <p className="text-xs text-[#7D715E] line-clamp-2">{qrModalUrl.title}</p>
            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE4D7] shadow-inner">
              <img src={qrModalUrl.qrDataUrl} alt="Mã QR Tiếp Thị" className="w-48 h-48" />
            </div>
            <p className="text-[11px] text-[#7D715E]">
              Khách hàng quét mã này sẽ được ghi nhận hoa hồng cho bạn
            </p>
            <button
              type="button"
              onClick={() => setQrModalUrl(null)}
              className="w-full py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-extrabold cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal: Submit Video Review for Sample */}
      {submitVideoSample && (
        <SubmitKolVideoModal
          isOpen={!!submitVideoSample}
          initialProductId={submitVideoSample.product?.id}
          initialProductTitle={submitVideoSample.product?.title || 'Sản phẩm mẫu'}
          onClose={() => setSubmitVideoSample(null)}
          onSuccess={() => {
            setSubmitVideoSample(null);
            loadStoreSamples(selectedStore.id);
          }}
        />
      )}

      {/* MODAL: Khám Phá & Kết Nối Gian Hàng Đối Tác Mới */}
      {showDiscoverModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in-50 duration-200"
          onClick={() => setShowDiscoverModal(false)}
        >
          <div
            className="bg-white border border-[#EAE4D7] rounded-3xl w-full max-w-3xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#EAE4D7] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1A1612]">
                    Danh Bạ Khám Phá Gian Hàng Đối Tác SCANMS
                  </h3>
                  <p className="text-xs text-[#7D715E]">
                    Kết nối trực tiếp với các gian hàng chính hãng để nhận mẫu trải nghiệm và hoa hồng cao nhất
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscoverModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-[#EAE4D7] bg-white">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D715E]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm gian hàng theo tên, ngành hàng, mô tả..."
                  value={discoverSearch}
                  onChange={(e) => setDiscoverSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs font-medium text-[#1A1612] outline-none focus:bg-white focus:border-[#C59B58] transition"
                />
              </div>
            </div>

            {/* Store Grid */}
            <div className="p-6 overflow-y-auto flex-1 divide-y divide-[#EAE4D7]/50 space-y-3">
              {loadingMarketplace ? (
                <div className="py-16 text-center text-xs font-bold text-[#7D715E] flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[#C59B58] border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải danh bạ gian hàng chính hãng...</span>
                </div>
              ) : marketplaceStores.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#7D715E]">
                  Không tìm thấy gian hàng nào.
                </div>
              ) : (
                marketplaceStores
                  .filter((ms) => {
                    const q = discoverSearch.toLowerCase();
                    return (
                      ms.name.toLowerCase().includes(q) ||
                      (ms.description || '').toLowerCase().includes(q) ||
                      (ms.slug || '').toLowerCase().includes(q)
                    );
                  })
                  .map((ms) => {
                    const isAlreadyConnected = stores.some((st) => st.id === ms.id);
                    return (
                      <div
                        key={ms.id}
                        className="pt-3 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5]/50 hover:bg-white transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={ms.logoUrl || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100&auto=format&fit=crop&q=80'}
                            alt={ms.name}
                            className="w-12 h-12 rounded-xl object-cover border border-[#EAE4D7] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-extrabold text-[#1A1612] truncate">{ms.name}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F]">
                                Chính Hãng
                              </span>
                            </div>
                            <p className="text-xs text-[#7D715E] line-clamp-1 mt-0.5">
                              {ms.description || 'Gian hàng phân phối độc quyền uy tín trên sàn SCANMS.'}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-[#7D715E] mt-1">
                              <span>Hoa hồng: <strong className="text-[#059669] font-bold">{ms.defaultCommissionRate || 20}%</strong></span>
                              <span>•</span>
                              <span>{ms._count?.products || 10} sản phẩm</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                          {isAlreadyConnected ? (
                            <button
                              type="button"
                              onClick={() => {
                                setShowDiscoverModal(false);
                                setSelectedStoreId(ms.id);
                                setActiveTab('messages');
                                updateUrl(ms.id, 'messages');
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F3EFE6] text-[#7D715E] hover:bg-[#EAE4D7] transition cursor-pointer"
                            >
                              Đã kết nối • Nhắn tin
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={connectingStoreId === ms.id}
                              onClick={() => handleConnectStore(ms)}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C59B58] hover:bg-[#B88E4F] text-white transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{connectingStoreId === ms.id ? 'Đang kết nối...' : 'Bắt đầu hợp tác'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
