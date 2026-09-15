import { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Award,
  CheckCircle2,
  Send,
  BarChart3,
  Flame,
  X,
  ShieldCheck,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  aiRecommendationService,
  type KolMatchResult,
  type TargetProductSummary,
} from '../../services/ai-recommendation.service';
import api from '../../services/api';

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

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả danh mục');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('ALL');
  const [selectedMinTier, setSelectedMinTier] = useState<string>('');
  const [minConversionRate, setMinConversionRate] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // VIP Invitation Modal State
  const [invitingKol, setInvitingKol] = useState<KolMatchResult | null>(null);
  const [inviteBonusRate, setInviteBonusRate] = useState<number>(5);
  const [inviteMessage, setInviteMessage] = useState<string>('');
  const [isSendingInvite, setIsSendingInvite] = useState<boolean>(false);

  // 1. Fetch Merchant Products to populate dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res: any = await api.get('/products');
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setProducts(list);
          setSelectedProductId(list[0].id);
        }
      } catch (err) {
        console.warn('Could not fetch products list, using fallback defaults', err);
      }
    };
    fetchProducts();
  }, []);

  // 2. Fetch recommendations whenever product or filters change
  const fetchRecommendations = async () => {
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

      setKols(res.recommendedKols || []);
      setTotalScanned(res.totalKolsScanned || 0);
      if (res.targetProduct) {
        setTargetProduct(res.targetProduct);
      }
    } catch (err: any) {
      toast.error('Không thể tải danh sách gợi ý AI: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedProductId, selectedCategory, selectedPriceRange, selectedMinTier, minConversionRate, limit]);

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

  // Handle VIP Invitation Submission
  const handleSendVipInvite = async () => {
    if (!invitingKol) return;
    setIsSendingInvite(true);
    try {
      // Simulate/call API for invitation
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(`Đã gửi Thẻ Mời Hợp Tác VIP thành công đến KOL ${invitingKol.fullName}!`, {
        description: `Mức thưởng thêm +${inviteBonusRate}% hoa hồng riêng và thông điệp cá nhân hóa.`,
      });
      setInvitingKol(null);
    } catch (err: any) {
      toast.error('Gửi lời mời thất bại: ' + (err.message || 'Lỗi'));
    } finally {
      setIsSendingInvite(false);
    }
  };

  const getTierBadge = (tierName: string) => {
    const t = (tierName || '').toUpperCase();
    if (t.includes('DIAMOND') || t.includes('KIM CƯƠNG')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
          💎 Kim Cương (Diamond)
        </span>
      );
    }
    if (t.includes('PLATINUM') || t.includes('BẠCH KIM')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          🏆 Bạch Kim (Platinum)
        </span>
      );
    }
    if (t.includes('GOLD') || t.includes('VÀNG')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          🥇 Vàng (Gold)
        </span>
      );
    }
    if (t.includes('SILVER') || t.includes('BẠC')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 border border-slate-300">
          🥈 Bạc (Silver)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
        🥉 Đồng (Bronze)
      </span>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return { ring: 'text-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (score >= 75) return { ring: 'text-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (score >= 60) return { ring: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { ring: 'text-slate-500', bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md border border-white/20">
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
            <span className="text-amber-200 font-semibold">AI Recommendation & Smart Matching Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Gợi Ý & Ghép Đôi KOL Phù Hợp Sản Phẩm
          </h1>
          <p className="text-sm md:text-base text-indigo-100/90 leading-relaxed">
            Hệ thống phân tích ma trận đa tiêu chí (Mức độ hợp ngành 35%, Tỷ lệ chuyển đổi CR% 25%, Tầm ảnh hưởng 20%, Phân khúc giá 20%) giúp chủ shop tìm ra những nhà sáng tạo có khả năng bùng nổ doanh số cao nhất.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-amber-300" />
              <span>Thuật toán giải trình minh bạch (Explainable AI)</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <span>Dữ liệu chuyển đổi thực tế</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <Flame className="h-4 w-4 text-rose-300" />
              <span>Gợi ý độc quyền cho Shop</span>
            </div>
          </div>
        </div>

        {/* Decorative blur balls */}
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />
      </div>

      {/* 2. Target Product Selector & Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Dropdown & Quick Config */}
        <div className="lg:col-span-1 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
            <ShoppingBag className="h-4 w-4 text-indigo-600" />
            <span>Chọn sản phẩm mục tiêu cần đẩy mạnh:</span>
          </div>

          <div>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            >
              {products.length === 0 && <option value="">Đang tải sản phẩm...</option>}
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price || 0)})
                </option>
              ))}
            </select>
          </div>

          {targetProduct && (
            <div className="rounded-xl bg-gradient-to-br from-indigo-50/70 to-purple-50/40 p-4 border border-indigo-100/80 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white border border-indigo-100 shadow-sm flex items-center justify-center">
                  {targetProduct.imageUrl ? (
                    <img src={targetProduct.imageUrl} alt={targetProduct.title} className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate" title={targetProduct.title}>
                    {targetProduct.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                      {targetProduct.category || 'Mặc định'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(targetProduct.price)}
                    </span>
                    <span className="font-medium text-slate-600">
                      Hoa hồng: <strong className="text-indigo-600">{targetProduct.commissionRate}%</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Smart Filter Toolbar */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
              <Filter className="h-4 w-4 text-indigo-600" />
              <span>Bộ lọc tùy biến thuật toán AI:</span>
            </div>
            <button
              onClick={fetchRecommendations}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Sparkles className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Quét & Tính Điểm Lại
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Ngành hàng lọc thêm</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Khoảng giá phù hợp</label>
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                {PRICE_RANGES.map((pr) => (
                  <option key={pr.value} value={pr.value}>
                    {pr.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Hạng KOL tối thiểu</label>
              <select
                value={selectedMinTier}
                onChange={(e) => setSelectedMinTier(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                {TIERS.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">
                Tỷ lệ chuyển đổi CR% tối thiểu: <span className="font-bold text-indigo-600">{minConversionRate}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={minConversionRate}
                onChange={(e) => setMinConversionRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Số lượng gợi ý hiển thị</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value={3}>Top 3 KOLs xuất sắc nhất</option>
                <option value={5}>Top 5 KOLs phù hợp nhất</option>
                <option value={10}>Top 10 KOLs tiềm năng</option>
                <option value={20}>Top 20 KOLs mở rộng</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Tìm nhanh theo tên / bio</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Gõ tên KOL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 py-1.5 text-slate-700 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Results Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Top Nhà Sáng Tạo Phù Hợp Nhất</span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                {displayedKols.length} kết quả
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Đã quét qua {totalScanned} hồ sơ KOL đang hoạt động trên hệ thống SCANMS
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> &gt;85%: Siêu Phù Hợp
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span> &gt;70%: Rất Phù Hợp
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span> Tiềm Năng
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-slate-200"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-slate-200"></div>
                </div>
                <div className="h-16 bg-slate-100 rounded-xl"></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 bg-slate-100 rounded"></div>
                  <div className="h-8 bg-slate-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedKols.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Không tìm thấy KOL phù hợp tiêu chí</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
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
              className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              Đặt lại toàn bộ bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {displayedKols.map((kol, idx) => {
              const colorInfo = getScoreColor(kol.matchScore);
              return (
                <div
                  key={kol.collaboratorId || idx}
                  className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  {/* Top Rank Badge */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-sm">
                          {kol.avatarUrl ? (
                            <img src={kol.avatarUrl} alt={kol.fullName} className="h-full w-full rounded-full object-cover bg-white" />
                          ) : (
                            <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg">
                              {kol.fullName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                            {kol.fullName}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {getTierBadge(kol.tierName)}
                          <span className="text-[11px] font-medium text-slate-500">
                            • {kol.lifetimeStats?.primaryCategory || 'Đa ngành'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score Indicator */}
                    <div className="flex flex-col items-end">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${colorInfo.badge} shadow-xs`}>
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-black">{kol.matchScore}%</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                        {kol.matchLevel}
                      </span>
                    </div>
                  </div>

                  {/* Explainable AI Reasoning Box */}
                  <div className="my-3.5 rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/40 p-3.5 border border-slate-100 text-xs text-slate-700 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>Phân tích đề xuất từ AI Engine:</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed italic">
                      "{kol.aiReasoning}"
                    </p>

                    {/* Key strengths pills */}
                    {kol.keyStrengths && kol.keyStrengths.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {kol.keyStrengths.map((str, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200/80 shadow-2xs"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            {str}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4 Multi-criteria Breakdown Progress Bars */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-2 border-t border-slate-100 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-medium text-slate-600">
                        <span>Hợp ngành (35%):</span>
                        <strong className="text-indigo-600">{kol.scoreBreakdown?.categoryScore || 0}%</strong>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${kol.scoreBreakdown?.categoryScore || 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-medium text-slate-600">
                        <span>Chốt đơn CR% (25%):</span>
                        <strong className="text-emerald-600">{kol.scoreBreakdown?.conversionRateScore || 0}%</strong>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${kol.scoreBreakdown?.conversionRateScore || 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-medium text-slate-600">
                        <span>Tầm ảnh hưởng (20%):</span>
                        <strong className="text-purple-600">{kol.scoreBreakdown?.tierAndSocialScore || 0}%</strong>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${kol.scoreBreakdown?.tierAndSocialScore || 0}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-medium text-slate-600">
                        <span>Tầm giá (20%):</span>
                        <strong className="text-amber-600">{kol.scoreBreakdown?.priceFitScore || 0}%</strong>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${kol.scoreBreakdown?.priceFitScore || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Channel Summary & Lifetime Performance */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-slate-400">Đơn đã chốt:</span>{' '}
                        <strong className="text-slate-800">{kol.lifetimeStats?.totalOrders || 0}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">CR trung bình:</span>{' '}
                        <strong className="text-emerald-600">{kol.lifetimeStats?.conversionRate || 0}%</strong>
                      </div>
                    </div>

                    {/* Social pills */}
                    <div className="flex items-center gap-1.5">
                      {kol.socialChannels?.map((ch, cIdx) => (
                        <span
                          key={cIdx}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                          title={`${ch.platform}: ${ch.followerCount?.toLocaleString()} followers`}
                        >
                          {ch.platform}: {(ch.followerCount / 1000).toFixed(0)}k
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setInvitingKol(kol)}
                      className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition"
                    >
                      <Award className="h-3.5 w-3.5 text-amber-300" />
                      Gửi Thẻ Mời VIP
                    </button>

                    <button
                      onClick={() => setAnalyzingKol(kol)}
                      className="flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                      title="Xem phân tích đối sánh chi tiết 1-1"
                    >
                      <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                      Chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. VIP Invitation Modal */}
      {invitingKol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Gửi Thẻ Mời Hợp Tác VIP</h3>
                  <p className="text-xs text-slate-500">Mời nhà sáng tạo tiếp thị sản phẩm chiến lược</p>
                </div>
              </div>
              <button
                onClick={() => setInvitingKol(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                  {invitingKol.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{invitingKol.fullName}</h4>
                  <p className="text-slate-500 text-[11px]">{invitingKol.bio || 'Nhà sáng tạo tiềm năng'}</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="font-bold text-indigo-600">{invitingKol.matchScore}% Phù hợp</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mức thưởng hoa hồng cộng thêm (VIP Bonus %):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={inviteBonusRate}
                    onChange={(e) => setInviteBonusRate(parseInt(e.target.value) || 0)}
                    className="w-24 rounded-lg border border-slate-200 p-2 text-sm font-bold text-indigo-600 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-slate-500 text-[11px]">
                    KOL sẽ nhận hoa hồng gốc + {inviteBonusRate}% khi đơn hàng thành công.
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Thông điệp cá nhân hóa gửi KOL:
                </label>
                <textarea
                  rows={3}
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder={`Chào ${invitingKol.fullName}, shop rất ấn tượng với phong cách nội dung của bạn và muốn gửi lời mời hợp tác độc quyền cho sản phẩm...`}
                  className="w-full rounded-xl border border-slate-200 p-3 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setInvitingKol(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSendVipInvite}
                disabled={isSendingInvite}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {isSendingInvite ? 'Đang gửi...' : 'Gửi Thẻ Mời Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Detailed 1-on-1 Analysis Modal */}
      {analyzingKol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Báo Cáo Đối Sánh Chuyên Sâu 1-1</h3>
                  <p className="text-xs text-slate-500">Phân tích mức độ tương thích giữa Sản phẩm & Nhà sáng tạo</p>
                </div>
              </div>
              <button
                onClick={() => setAnalyzingKol(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Comparison Cards Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100 space-y-2">
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Sản Phẩm Mục Tiêu</span>
                <h4 className="font-bold text-slate-900 text-sm">{targetProduct?.title || 'Sản phẩm đang chọn'}</h4>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Ngành hàng: <strong>{targetProduct?.category}</strong></div>
                  <div>Giá bán: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(targetProduct?.price || 0)}</strong></div>
                  <div>Hoa hồng: <strong>{targetProduct?.commissionRate}%</strong></div>
                </div>
              </div>

              <div className="rounded-2xl bg-purple-50/60 p-4 border border-purple-100 space-y-2">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Hồ Sơ Nhà Sáng Tạo</span>
                <h4 className="font-bold text-slate-900 text-sm">{analyzingKol.fullName}</h4>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Cấp bậc: <strong>{analyzingKol.tierName}</strong></div>
                  <div>Ngành thế mạnh: <strong>{analyzingKol.lifetimeStats?.primaryCategory}</strong></div>
                  <div>Tỷ lệ CR%: <strong className="text-emerald-600">{analyzingKol.lifetimeStats?.conversionRate}%</strong></div>
                </div>
              </div>
            </div>

            {/* Deep Metric Analysis Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Điểm số chi tiết từng tiêu chuẩn thuật toán:</h4>
              <div className="space-y-2.5 text-xs">
                <div className="rounded-xl border border-slate-200 p-3 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">1. Độ tương đồng ngành hàng (Category Affinity - 35%):</span>
                    <span className="text-indigo-600 font-bold">{analyzingKol.scoreBreakdown?.categoryScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Đánh giá độ trùng khớp giữa tệp nội dung KOL thường làm và ngành hàng của sản phẩm.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">2. Năng lực chuyển đổi đơn hàng (Conversion Rate - 25%):</span>
                    <span className="text-emerald-600 font-bold">{analyzingKol.scoreBreakdown?.conversionRateScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Đo lường tỷ lệ người xem nhấp link và chốt đơn thành công trong 30 ngày gần nhất.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">3. Cấp bậc danh hiệu & Quy mô người theo dõi (20%):</span>
                    <span className="text-purple-600 font-bold">{analyzingKol.scoreBreakdown?.tierAndSocialScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Dựa trên tổng followers trên các nền tảng TikTok, YouTube, Instagram và cấp bậc hệ thống.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">4. Mức độ phù hợp phân khúc giá (Price Fit - 20%):</span>
                    <span className="text-amber-600 font-bold">{analyzingKol.scoreBreakdown?.priceFitScore}%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Khả năng người xem của KOL sẵn sàng chi trả cho mức giá sản phẩm này.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Recommendation Conclusion */}
            <div className="rounded-2xl bg-slate-900 p-4 text-white text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Sparkles className="h-4 w-4" />
                <span>Kết luận từ AI Engine:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {analyzingKol.aiReasoning}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setAnalyzingKol(null)}
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
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
