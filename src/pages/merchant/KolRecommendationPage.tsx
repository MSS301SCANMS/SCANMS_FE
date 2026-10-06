import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Award,
  Send,
  BarChart3,
  X,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  aiRecommendationService,
  type KolMatchResult,
  type TargetProductSummary,
} from '../../services/ai-recommendation.service';
import api from '../../services/api';
import { Select } from '../../components/ui/Select';

const CATEGORIES = [
  'Tất cả danh mục',
  'Thời trang & Phụ kiện',
  'Mỹ phẩm & Làm đẹp',
  'Đồ gia dụng & Đời sống',
  'Công nghệ & Thiết bị số',
  'Ăn vặt & Ẩm thực',
  'Sách & Văn phòng phẩm',
  'Mẹ & Bé',
  'Thể thao & Dã ngoại',
];

const PRICE_RANGES = [
  { label: 'Tất cả khoảng giá', value: 'ALL' },
  { label: 'Dưới 200.000đ', value: 'UNDER_200K' },
  { label: '200.000đ - 500.000đ', value: 'FROM_200K_TO_500K' },
  { label: '500.000đ - 1.000.000đ', value: 'FROM_500K_TO_1M' },
  { label: 'Trên 1.000.000đ', value: 'OVER_1M' },
];

const TIERS = [
  { label: 'Tất cả cấp bậc', value: '' },
  { label: 'Đồng (Bronze) trở lên', value: 'BRONZE' },
  { label: 'Bạc (Silver) trở lên', value: 'SILVER' },
  { label: 'Vàng (Gold) trở lên', value: 'GOLD' },
  { label: 'Bạch Kim (Platinum) trở lên', value: 'PLATINUM' },
  { label: 'Kim Cương (Diamond)', value: 'DIAMOND' },
];

export default function KolRecommendationPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [targetProduct, setTargetProduct] = useState<TargetProductSummary | null>(null);
  const [kols, setKols] = useState<KolMatchResult[]>([]);
  const [totalScanned, setTotalScanned] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzingKol, setAnalyzingKol] = useState<KolMatchResult | null>(null);

  const [productsReady, setProductsReady] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [calculatedAt, setCalculatedAt] = useState('');
  const [scanError, setScanError] = useState('');
  const scanVersion = useRef(0);
  const scanBusy = useRef(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả danh mục');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('ALL');
  const [selectedMinTier, setSelectedMinTier] = useState<string>('');
  const [minConversionRate, setMinConversionRate] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // VIP Invitation Modal State
  const [invitingKol, setInvitingKol] = useState<KolMatchResult | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string>('');
  const [isSendingInvite, setIsSendingInvite] = useState<boolean>(false);

  // 1. Fetch Merchant Products to populate dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res: any = await api.get('/products', { params: { limit: 100 } });
        const body = res?.data?.data || res?.data || res;
        const list = (Array.isArray(body) ? body : body?.items || []).filter((p: any) => p.moderationStatus === 'APPROVED' && p.isActive !== false && !p.isDeleted);
        if (Array.isArray(list) && list.length > 0) {
          setProducts(list);
          setSelectedProductId(list[0].id);
        }
      } catch {
        toast.error('Không tải được sản phẩm của shop. Bạn vẫn có thể quét hồ sơ KOL chung.');
      } finally {
        setProductsReady(true);
      }
    };
    fetchProducts();
  }, []);

  // 2. Fetch recommendations whenever product or filters change
  const fetchRecommendations = useCallback(async () => {
    const version = ++scanVersion.current;
    scanBusy.current = true;
    setScanError('');
    setLoading(true);
    try {
      const params: any = {
        limit,
      };
      if (selectedCategory && selectedCategory !== 'Tất cả danh mục') {
        params.category = selectedCategory;
      }
      if (selectedPriceRange && selectedPriceRange !== 'ALL') {
        params.priceRange = selectedPriceRange;
      }
      if (selectedMinTier) {
        params.minTier = selectedMinTier;
      }
      if (minConversionRate > 0) {
        params.minConversionRate = minConversionRate;
      }

      let res;
      if (selectedProductId) {
        res = await aiRecommendationService.getRecommendationsForProduct(selectedProductId, params);
      } else {
        res = await aiRecommendationService.getGeneralRecommendations(params);
      }

      if (version !== scanVersion.current) return;
      setCalculatedAt(res.calculatedAt || '');
      setKols(res.recommendedKols || []);
      setTotalScanned(res.totalKolsScanned || 0);
      setTargetProduct(res.targetProduct || null);
    } catch (err: any) {
      if (version !== scanVersion.current) return;
      setKols([]);
      setTargetProduct(null);
      setTotalScanned(0);
      setScanError(err.message || 'Không kết nối được máy chủ để quét KOL.');
    } finally {
      if (version === scanVersion.current) { scanBusy.current = false; setLoading(false); }
    }
  }, [selectedProductId, selectedCategory, selectedPriceRange, selectedMinTier, minConversionRate, limit]);

  const latestRecommendationScan = useRef(fetchRecommendations);

  useEffect(() => {
    if (!productsReady) return;
    const debounce = setTimeout(() => { void fetchRecommendations(); }, 300);
    return () => { clearTimeout(debounce); scanVersion.current += 1; scanBusy.current = false; };
  }, [productsReady, fetchRecommendations]);

  useEffect(() => { latestRecommendationScan.current = fetchRecommendations; }, [fetchRecommendations]);

  useEffect(() => {
    if (!productsReady || !autoScan) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !scanBusy.current) void latestRecommendationScan.current();
    }, 60000);
    return () => clearInterval(timer);
  }, [productsReady, autoScan]);

  // Filtered KOLs by search
  const displayedKols = useMemo(() => {
    if (!searchQuery.trim()) return kols;
    const q = searchQuery.toLowerCase();
    return kols.filter(
      (k) =>
        k.fullName.toLowerCase().includes(q) ||
        k.bio?.toLowerCase().includes(q) ||
        k.tierName.toLowerCase().includes(q) ||
        k.lifetimeStats?.primaryCategory?.toLowerCase().includes(q)
    );
  }, [kols, searchQuery]);
  const selectedProduct = products.find((product) => String(product.id) === selectedProductId);

  // Handle VIP Invitation Submission
  const handleSendVipInvite = async () => {
    if (!invitingKol) return;
    setIsSendingInvite(true);
    try {
      const result: any = await api.post('/store-collaborators/invite', { email: invitingKol.email, note: inviteMessage.trim() || undefined });
      const body = result?.data || result;
      if (!body?.invitation?.id) throw new Error('Máy chủ chưa xác nhận lời mời.');
      toast.success('Đã gửi lời mời hợp tác trên SCANMS. KOL cần xác nhận để tham gia.');
      setInvitingKol(null);
    } catch (err: any) {
      toast.error('Gửi lời mời thất bại: ' + (err.message || 'Lỗi'));
    } finally {
      setIsSendingInvite(false);
    }
  };

  const getTierBadge = (tierName: string) => {
    const tier = (tierName || '').toUpperCase();
    const label = tier.includes('DIAMOND') || tier.includes('KIM CƯƠNG') ? 'Kim cương'
      : tier.includes('PLATINUM') || tier.includes('BẠCH KIM') ? 'Bạch kim'
      : tier.includes('GOLD') || tier.includes('VÀNG') ? 'Vàng'
      : tier.includes('SILVER') || tier.includes('BẠC') ? 'Bạc'
      : tier.includes('BRONZE') || tier.includes('ĐỒNG') ? 'Đồng' : 'Chưa xếp hạng';
    return <span className="inline-flex rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-0.5 text-xs font-semibold text-[#8C6226]">{label}</span>;
  };

  const getScoreColor = (score: number) => score >= 78
    ? { ring: 'text-[#B88E4F]', bg: 'bg-[#FBF5EB]', text: 'text-[#8C6226]', badge: 'bg-[#FBF5EB] text-[#8C6226] border-[#EEDFC6]' }
    : { ring: 'text-[#C59B58]', bg: 'bg-[#FAF8F5]', text: 'text-[#7D715E]', badge: 'bg-[#FAF8F5] text-[#7D715E] border-[#EAE4D7]' };

  return (
    <div className="space-y-4 pb-24">
      <section className="flex flex-col gap-3 rounded-2xl border border-[#EAE4D7] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FBF5EB] text-[#B88E4F]"><Sparkles className="h-4 w-4" /></span>
          <div className="min-w-0 text-xs text-[#7D715E]">
            <p className="font-semibold text-[#1A1612]">Đối sánh KOL từ dữ liệu SCANMS</p>
            <p className="mt-0.5 leading-relaxed">Dựa trên hồ sơ KYC, đơn hoàn tất và lượt nhấp hợp lệ. Điểm số tham khảo; không quét trực tiếp TikTok/YouTube.</p>
            {calculatedAt && <p className="mt-0.5 text-[11px]">Cập nhật: {new Date(calculatedAt).toLocaleString('vi-VN')}</p>}
          </div>
        </div>
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#FAF8F5] px-3 py-2 text-xs font-medium text-[#7D715E]">
          <input type="checkbox" checked={autoScan} onChange={(event) => setAutoScan(event.target.checked)} className="h-4 w-4 accent-[#C59B58]" />
          Tự cập nhật mỗi 60 giây
        </label>
      </section>
      {scanError && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-[#DC2626]">{scanError}<button type="button" onClick={() => void fetchRecommendations()} className="font-medium text-[#B88E4F] underline">Thử quét lại</button></div>}
      {/* 2. Target Product Selector & Profile Summary */}
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-12">
        {/* Left: Product Dropdown & Quick Config */}
        <div className="space-y-3 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-sm lg:col-span-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1612]">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FBF5EB] text-[#B88E4F]"><ShoppingBag className="h-4 w-4" /></span>
            <span>Sản phẩm cần đẩy mạnh</span>
          </div>

          <div className="min-w-0">
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs sm:text-sm"
            >
              <option value="">{productsReady ? "Quét hồ sơ KOL chung" : "Đang tải sản phẩm…"}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price || 0)})
                </option>
              ))}
            </Select>
          </div>

          {(targetProduct || selectedProduct) && (
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-2.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#EAE4D7] bg-white">
                  {(targetProduct?.imageUrl || selectedProduct?.imageUrl) ? (
                    <img src={targetProduct?.imageUrl || selectedProduct?.imageUrl} alt={targetProduct?.title || selectedProduct?.title || selectedProduct?.name || 'Sản phẩm'} className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-[#B88E4F]" />
                  )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-xs font-semibold text-[#1A1612]" title={targetProduct?.title || selectedProduct?.title || selectedProduct?.name}>
                  {targetProduct?.title || selectedProduct?.title || selectedProduct?.name}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#7D715E]">
                  {(targetProduct?.price ?? selectedProduct?.price) != null && <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(targetProduct?.price ?? selectedProduct?.price)}</span>}
                  {(targetProduct?.commissionRate ?? selectedProduct?.commissionRate) != null && <span>Hoa hồng <strong className="text-[#8F682E]">{targetProduct?.commissionRate ?? selectedProduct?.commissionRate}%</strong></span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Smart Filter Toolbar */}
        <div className="space-y-3 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-sm lg:col-span-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1612]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#FBF5EB] text-[#B88E4F]"><Filter className="h-4 w-4" /></span>
              <span>Điều kiện tìm KOL</span>
            </div>
            <button
              onClick={() => void fetchRecommendations()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2 text-xs font-semibold text-[#8F682E] transition-colors hover:bg-[#F3EFE6] disabled:opacity-50"
            >
              <Sparkles className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Quét lại
            </button>
          </div>

          <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 text-xs sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-1 block font-medium text-[#7D715E]">Ngành hàng</label>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block font-medium text-[#7D715E]">Khoảng giá</label>
              <Select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="w-full text-xs"
              >
                {PRICE_RANGES.map((pr) => (
                  <option key={pr.value} value={pr.value}>
                    {pr.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block font-medium text-[#7D715E]">Hạng KOL tối thiểu</label>
              <Select
                value={selectedMinTier}
                onChange={(e) => setSelectedMinTier(e.target.value)}
                className="w-full text-xs"
              >
                {TIERS.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block font-medium text-[#7D715E]">
                Tỷ lệ chuyển đổi CR% tối thiểu: <span className="font-bold text-[#B88E4F]">{minConversionRate}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={minConversionRate}
                onChange={(e) => setMinConversionRate(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#EAE4D7] accent-[#C59B58]"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium text-[#7D715E]">Số lượng gợi ý</label>
              <Select
                value={String(limit)}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full text-xs"
              >
                <option value="3">Top 3 KOLs xuất sắc nhất</option>
                <option value="5">Top 5 KOLs phù hợp nhất</option>
                <option value="10">Top 10 KOLs tiềm năng</option>
                <option value="20">Top 20 KOLs mở rộng</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block font-medium text-[#7D715E]">Tìm theo tên / bio</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7D715E]" />
                <input
                  type="text"
                  placeholder="Gõ tên KOL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[#EAE4D7] bg-white py-2 pl-9 pr-3 text-xs text-[#1A1612] placeholder:text-[#A89D8B] focus:border-[#C59B58] focus:outline-none focus:ring-2 focus:ring-[#C59B58]/15"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Results Section */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 border-b border-[#EAE4D7] pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-[#1A1612]">
              <span>Nhà sáng tạo được gợi ý</span>
              <span className="rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[11px] font-semibold text-[#8F682E]">
                {displayedKols.length} kết quả
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-[#7D715E]">
              Đã đối sánh {totalScanned} hồ sơ KOL đang hoạt động trên SCANMS
            {loading && kols.length > 0 && <span className="ml-2 text-[#8F682E]">· Đang cập nhật…</span>}
            </p>
          </div>

          <p className="text-[11px] text-[#7D715E]">Điểm /100 · Dùng để tham khảo</p>

        </div>

        {loading && kols.length === 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse space-y-3 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#F3EFE6]"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/2 rounded bg-[#F3EFE6]"></div>
                    <div className="h-3 w-1/3 rounded bg-[#F3EFE6]"></div>
                  </div>
                  <div className="h-9 w-12 rounded-lg bg-[#FBF5EB]"></div>
                </div>
                <div className="h-10 rounded-lg bg-[#FAF8F5]"></div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-11 rounded-lg bg-[#FAF8F5]"></div>
                  <div className="h-11 rounded-lg bg-[#FAF8F5]"></div>
                  <div className="h-11 rounded-lg bg-[#FAF8F5]"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedKols.length === 0 ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-[#EAE4D7] bg-white p-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#FBF5EB] text-[#B88E4F]">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#1A1612]">Không tìm thấy KOL phù hợp tiêu chí</h3>
            <p className="mx-auto max-w-md text-xs text-[#7D715E]">
              Hãy thử nới lỏng bộ lọc (giảm tỷ lệ CR% hoặc mở rộng ngành hàng) để AI tiếp cận thêm nhiều nhà sáng tạo tiềm năng.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Tất cả danh mục');
                setSelectedPriceRange('ALL');
                setSelectedMinTier('');
                setMinConversionRate(0);
                setSearchQuery('');
              }}
              className="mt-1 rounded-lg bg-[#C59B58] px-4 py-2 text-xs font-semibold text-[#231D15] transition hover:bg-[#B88E4F]"
            >
              Đặt lại toàn bộ bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {displayedKols.map((kol, idx) => {
              const colorInfo = getScoreColor(kol.matchScore);
              const breakdown = [
                { label: 'Ngành hàng', weight: 35, value: kol.scoreBreakdown?.categoryScore },
                { label: 'Chuyển đổi', weight: 25, value: kol.scoreBreakdown?.conversionRateScore },
                { label: 'Hạng & kênh', weight: 20, value: kol.scoreBreakdown?.tierAndSocialScore },
                { label: 'Khoảng giá', weight: 20, value: kol.scoreBreakdown?.priceFitScore },
              ];
              return (
                <article key={kol.collaboratorId || idx} className="min-w-0 rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_8px_rgba(35,29,21,0.025)]">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {kol.avatarUrl ? <img src={kol.avatarUrl} alt={kol.fullName} className="h-10 w-10 rounded-full object-cover border border-[#EAE4D7]" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF5EB] text-sm font-semibold text-[#8C6226]">{kol.fullName.charAt(0)}</div>}
                      <span className="absolute -bottom-1 -right-1 rounded-full border border-white bg-[#F3EFE6] px-1 text-[10px] font-semibold text-[#7D715E]">#{idx + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold leading-5 text-[#1A1612]">{kol.fullName}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">{getTierBadge(kol.tierName)}</div>
                    </div>
                    <span className={'shrink-0 rounded-lg border px-2 py-1 text-sm font-bold ' + colorInfo.badge}>{kol.matchScore}<span className="text-[10px] font-normal">/100</span></span>
                  </div>
                  <p className="mt-2 min-h-[40px] text-xs text-[#7D715E] leading-5">{kol.lifetimeStats?.primaryCategory || 'Chưa có lịch sử ngành hàng'}<span className="mx-1.5">·</span>{kol.matchLevel}</p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-[#FAF8F5] px-3 py-2.5">
                    <div><dt className="text-[11px] text-[#7D715E]">Đơn hoàn tất</dt><dd className="mt-0.5 text-sm font-semibold text-[#1A1612]">{Number(kol.lifetimeStats?.totalOrders || 0).toLocaleString('vi-VN')}</dd></div>
                    <div><dt className="text-[11px] text-[#7D715E]">Nhấp hợp lệ</dt><dd className="mt-0.5 text-sm font-semibold text-[#1A1612]">{Number(kol.lifetimeStats?.totalClicks || 0).toLocaleString('vi-VN')}</dd></div>
                    <div><dt className="text-[11px] text-[#7D715E]">Đơn / nhấp</dt><dd className="mt-0.5 text-sm font-semibold text-[#1A1612]">{kol.lifetimeStats?.conversionRate || 0}%</dd></div>
                  </dl>
                  <p className="mt-2 text-[11px] leading-4 text-[#7D715E]">{kol.lifetimeStats?.dataConfidence === 'HIGH' ? 'Đủ dữ liệu bán hàng để đối sánh' : kol.lifetimeStats?.dataConfidence === 'MEDIUM' ? 'Dữ liệu ở mức tham khảo' : 'Dữ liệu còn ít · Nên xem hồ sơ trước khi mời'}</p>
                  <details className="mt-3 border-t border-[#EAE4D7] pt-2.5 text-xs">
                    <summary className="w-fit cursor-pointer font-medium text-[#8C6226]">Căn cứ & điểm thành phần</summary>
                    <div className="mt-3 space-y-3">
                      <p className="leading-relaxed text-[#7D715E]">{kol.aiReasoning}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {breakdown.map((criterion) => <div key={criterion.label}>
                          <div className="mb-1 flex justify-between gap-2 text-[11px] text-[#7D715E]"><span>{criterion.label} ({criterion.weight}%)</span><strong className="text-[#8C6226]">{criterion.value || 0}/100</strong></div>
                          <div className="h-1 rounded-full bg-[#F3EFE6]"><div className="h-full rounded-full bg-[#C59B58]" style={{ width: (criterion.value || 0) + '%' }} /></div>
                        </div>)}
                      </div>
                      {!!kol.socialChannels?.length && <div className="flex flex-wrap gap-1.5">{kol.socialChannels.map((channel, channelIdx) => <span key={channelIdx} className="rounded-md bg-[#FAF8F5] px-2 py-1 text-[11px] text-[#7D715E]">{channel.platform} · {Number(channel.followerCount || 0).toLocaleString('vi-VN')} người theo dõi</span>)}</div>}
                    </div>
                  </details>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setInviteMessage(''); setInvitingKol(kol); }} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#C59B58] px-3 py-2 text-xs font-semibold text-[#231D15] hover:bg-[#B88E4F] transition"><Send className="h-3.5 w-3.5" />Mời hợp tác</button>
                    <button type="button" onClick={() => setAnalyzingKol(kol)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#EAE4D7] bg-white px-3 py-2 text-xs font-medium text-[#7D715E] hover:bg-[#FAF8F5] transition" title="Xem phân tích đối sánh chi tiết"><BarChart3 className="h-3.5 w-3.5" />Phân tích</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. VIP Invitation Modal */}
      {invitingKol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg space-y-4 rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-xl animate-in fade-in zoom-in duration-150 sm:p-6">
            <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FBF5EB] text-[#8F682E]">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1612]">Mời KOL hợp tác</h3>
                  <p className="text-xs text-[#7D715E]">Lời mời gửi trong SCANMS, chờ KOL xác nhận</p>
                </div>
              </div>
              <button
                onClick={() => setInvitingKol(null)}
                className="rounded-full p-1 text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FBF5EB] font-bold text-[#B88E4F]">
                  {invitingKol.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-[#1A1612]">{invitingKol.fullName}</h4>
                  <p className="text-[11px] text-[#7D715E]">{invitingKol.bio || 'Nhà sáng tạo tiềm năng'}</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="font-bold text-[#8F682E]">{invitingKol.matchScore}/100 phù hợp</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-[#7D715E]">
                  Thông điệp cá nhân hóa gửi KOL:
                </label>
                <textarea
                  rows={3}
                  maxLength={255}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder={`Chào ${invitingKol.fullName}, shop rất ấn tượng với phong cách nội dung của bạn và muốn gửi lời mời hợp tác cho sản phẩm…`}
                  className="w-full rounded-xl border border-[#EAE4D7] p-3 text-[#1A1612] placeholder:text-[#A89D8B] focus:border-[#C59B58] focus:outline-none focus:ring-2 focus:ring-[#C59B58]/15"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#EAE4D7] pt-3">
              <button
                onClick={() => setInvitingKol(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-[#7D715E] hover:bg-[#FAF8F5]"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSendVipInvite}
                disabled={isSendingInvite}
                className="flex items-center gap-1.5 rounded-lg bg-[#C59B58] px-4 py-2 text-xs font-semibold text-[#1A1612] transition-colors hover:bg-[#B88E4F] disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {isSendingInvite ? 'Đang gửi...' : 'Gửi lời mời hợp tác'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Detailed 1-on-1 Analysis Modal */}
      {analyzingKol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-xl md:p-6">
            <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBF5EB] text-[#B88E4F]">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1612]">Báo cáo đối sánh 1-1</h3>
                  <p className="text-xs text-[#7D715E]">Mức độ phù hợp giữa sản phẩm và nhà sáng tạo</p>
                </div>
              </div>
              <button
                onClick={() => setAnalyzingKol(null)}
                className="rounded-full p-1 text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Comparison Cards Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#FBF5EB] p-4 border border-[#EEDFC6] space-y-2">
                <span className="text-[11px] font-bold text-[#B88E4F] uppercase tracking-wider">Sản Phẩm Mục Tiêu</span>
                <h4 className="text-sm font-bold text-[#1A1612]">{targetProduct?.title || 'Sản phẩm đang chọn'}</h4>
                <div className="space-y-1 text-xs text-[#7D715E]">
                  <div>Ngành hàng: <strong>{targetProduct?.category}</strong></div>
                  <div>Giá bán: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(targetProduct?.price || 0)}</strong></div>
                  <div>Hoa hồng: <strong>{targetProduct?.commissionRate}%</strong></div>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F682E]">Hồ sơ nhà sáng tạo</span>
                <h4 className="text-sm font-bold text-[#1A1612]">{analyzingKol.fullName}</h4>
                <div className="space-y-1 text-xs text-[#7D715E]">
                  <div>Cấp bậc: <strong>{analyzingKol.tierName}</strong></div>
                  <div>Ngành thế mạnh: <strong>{analyzingKol.lifetimeStats?.primaryCategory}</strong></div>
                  <div>Tỷ lệ CR%: <strong className="text-[#B88E4F]">{analyzingKol.lifetimeStats?.conversionRate}%</strong></div>
                </div>
              </div>
            </div>

            {/* Deep Metric Analysis Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#1A1612]">Điểm chi tiết theo từng tiêu chí</h4>
              <div className="space-y-2.5 text-xs">
                <div className="space-y-1.5 rounded-xl border border-[#EAE4D7] p-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#1A1612]">1. Độ tương đồng ngành hàng (35%)</span>
                    <span className="text-[#B88E4F] font-bold">{analyzingKol.scoreBreakdown?.categoryScore}%</span>
                  </div>
                  <p className="text-[11px] text-[#7D715E]">
                    Đối chiếu ngành hàng từng bán trên SCANMS với ngành của sản phẩm.
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-[#EAE4D7] p-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#1A1612]">2. Năng lực chuyển đổi đơn hàng (25%)</span>
                    <span className="text-[#B88E4F] font-bold">{analyzingKol.scoreBreakdown?.conversionRateScore}%</span>
                  </div>
                  <p className="text-[11px] text-[#7D715E]">
                    Dựa trên đơn đã giao/hoàn tất và lượt nhấp hợp lệ duy nhất trên SCANMS; giảm trọng số khi dữ liệu ít.
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-[#EAE4D7] p-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#1A1612]">3. Cấp bậc & quy mô người theo dõi (20%)</span>
                    <span className="font-bold text-[#8F682E]">{analyzingKol.scoreBreakdown?.tierAndSocialScore}%</span>
                  </div>
                  <p className="text-[11px] text-[#7D715E]">
                    Dựa trên tổng followers trên các nền tảng TikTok, YouTube, Instagram và cấp bậc hệ thống.
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-[#EAE4D7] p-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#1A1612]">4. Mức độ phù hợp phân khúc giá (20%)</span>
                    <span className="font-bold text-[#8F682E]">{analyzingKol.scoreBreakdown?.priceFitScore}%</span>
                  </div>
                  <p className="text-[11px] text-[#7D715E]">
                    So sánh giá sản phẩm với giá trị sản phẩm KOL từng bán trên SCANMS.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Recommendation Conclusion */}
            <div className="rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] p-4 text-[#1A1612] text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#8F682E] font-bold">
                <Sparkles className="h-4 w-4" />
                <span>Căn cứ đề xuất:</span>
              </div>
              <p className="text-[#7D715E] leading-relaxed">
                {analyzingKol.aiReasoning}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setAnalyzingKol(null)}
                className="rounded-lg bg-[#F3EFE6] px-5 py-2.5 text-xs font-semibold text-[#7D715E] hover:bg-[#EAE4D7]"
              >
                Đóng báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
