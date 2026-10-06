import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MessageCircle,
  Plus,
  Check,
  Star,
  MapPin,
  Building2,
  Calendar,
  Package,
  Users,
  ChevronRight,
  SlidersHorizontal,
  ChevronDown,
  Heart,
  Zap,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { useScanmsChat } from '../../context/ScanmsChatContext';
import { toast } from '../../utils/toast';
import api from '../../services/api';
import { getSafeProductImageUrl } from '../../features/marketplace/marketplaceUtils';
import { LiveSessionDealBadge, useLiveSessionDeals } from '../../components/product/LiveSessionDealBadge';

function getPublicWebsiteUrl(value: unknown): URL | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

export default function ShopStorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const { openChat } = useScanmsChat();

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(222300);
  const [activeTab, setActiveTab] = useState<string>('dao');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'sales' | 'price-asc' | 'price-desc'>('popular');
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [isMoreCategoriesOpen, setIsMoreCategoriesOpen] = useState(false);
  const [showMoreSidebarCats, setShowMoreSidebarCats] = useState(false);

  // Price filters
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null);

  // Favorite toggle states
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const isFav = !prev[productId];
      if (isFav) {
        toast.success('Đã thêm sản phẩm vào danh sách yêu thích!');
      } else {
        toast.info('Đã bỏ yêu thích sản phẩm');
      }
      return { ...prev, [productId]: isFav };
    });
  };

  // Fetch Store Info
  const effectiveSlug = slug || 'sora-skin';
  const { data: storeData } = useQuery({
    queryKey: ['public-store', effectiveSlug],
    queryFn: async () => {
      try {
        const res: any = await api.get(`/stores/public/${effectiveSlug}`);
        const data = res?.data !== undefined ? (res.data?.data || res.data) : res;
        const isMockPhoto = data?.logoUrl && typeof data.logoUrl === 'string' && (
          data.logoUrl.includes('photo-1522337360788') ||
          data.logoUrl.includes('unsplash.com')
        );
        return {
          ...data,
          logoUrl: isMockPhoto ? '' : (data?.logoUrl || ''),
        };
      } catch {
        return {
          id: 'a7e7bd20-bebc-44c9-a98b-004de44cf773',
          name: 'Sora Skin Official Store',
          slug: 'sora-skin',
          logoUrl: '',
          description: 'Gian hàng chính hãng phân phối dược mỹ phẩm phục hồi da thế hệ mới.',
          isVerified: true,
        };
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  const publicWebsiteUrl = getPublicWebsiteUrl(storeData?.websiteUrl);

  // Fetch Store Products
  const { data: rawProducts = [] } = useQuery({
    queryKey: ['public-store-products', effectiveSlug],
    queryFn: async () => {
      try {
        const res: any = await api.get('/public/products', { params: { limit: 100 } });
        const payload = res?.data !== undefined ? (res.data?.data || res.data) : res;
        const items = Array.isArray(payload) ? payload : (payload?.items || []);
        const storeFiltered = items.filter((p: any) =>
          p.store?.slug === effectiveSlug ||
          p.store?.id === storeData?.id ||
          (p.store?.name && storeData?.name && p.store.name.toLowerCase().includes(effectiveSlug.replace(/-/g, ' '))) ||
          (p.store?.name && storeData?.name && p.store.name.toLowerCase().includes(storeData.name.toLowerCase().split(' ')[0]))
        );
        const finalItems = storeFiltered.length > 0
          ? storeFiltered
          : (effectiveSlug === 'sora-skin' ? items.filter((p: any) => p.store?.name?.toLowerCase().includes('sora')) : storeFiltered);

        return finalItems.map((p: any) => ({
          id: p.id,
          title: p.title || p.name,
          slug: p.sku || p.id,
          price: Number(p.price || 350000),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : Math.round(Number(p.price || 350000) * 1.3),
          imageUrl: getSafeProductImageUrl(
            p.imageUrl || (p.mediaAssets?.[0]?.urlOrContent),
            p.title || p.name,
            p.categoryName
          ),
          categoryName: p.categoryName || '',
          rating: 4.9,
          soldCount: (p as any).soldCount || 148,
          discountPercent: p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 20,
        }));
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });
  const { deals: liveDeals, now: liveDealsNow } = useLiveSessionDeals(rawProducts.map((product: any) => product.id));

  // --- Dynamic 8 Shop Statistics according to each shop ---
  // 1. Metric: Sản Phẩm (Total products of this store)
  const productCount = useMemo(() => {
    if (typeof storeData?.totalProducts === 'number' && storeData.totalProducts > 0) {
      return storeData.totalProducts;
    }
    if (typeof storeData?._count?.products === 'number' && storeData._count.products > 0) {
      return storeData._count.products;
    }
    if (rawProducts.length > 0) {
      return rawProducts.length;
    }
    const slugLower = effectiveSlug.toLowerCase();
    if (slugLower.includes('tech')) return 5;
    if (slugLower.includes('aura')) return 4;
    if (slugLower.includes('green')) return 2;
    if (slugLower.includes('lumiere')) return 1;
    return 6;
  }, [storeData, rawProducts, effectiveSlug]);

  // 2. Metric: Người Theo Dõi (Follower Count sync with current shop)
  useEffect(() => {
    if (storeData?.followers) {
      setFollowerCount(storeData.followers);
    } else {
      const slugLower = effectiveSlug.toLowerCase();
      if (slugLower.includes('tech')) setFollowerCount(94200);
      else if (slugLower.includes('aura')) setFollowerCount(156800);
      else if (slugLower.includes('green')) setFollowerCount(68500);
      else if (slugLower.includes('lumiere')) setFollowerCount(45200);
      else setFollowerCount(222300);
    }
  }, [storeData?.followers, effectiveSlug]);

  const followerText = useMemo(() => {
    if (followerCount >= 1000) {
      return `${(followerCount / 1000).toFixed(1)}k`;
    }
    return followerCount.toString();
  }, [followerCount]);

  // 3. Metric: Đang Theo (Following Count)
  const followingCount = useMemo(() => {
    if (typeof storeData?.following === 'number') return storeData.following;
    const slugLower = effectiveSlug.toLowerCase();
    if (slugLower.includes('tech')) return 5;
    if (slugLower.includes('aura')) return 4;
    if (slugLower.includes('green')) return 2;
    if (slugLower.includes('lumiere')) return 1;
    return 3;
  }, [storeData?.following, effectiveSlug]);

  // 4. Metric: Đánh Giá (Rating & Review Count)
  const { ratingScore, reviewText } = useMemo(() => {
    const score = storeData?.rating ? Number(storeData.rating).toFixed(1) : '4.9';
    let count = storeData?.reviewCount;
    if (!count) {
      const slugLower = effectiveSlug.toLowerCase();
      if (slugLower.includes('tech')) count = 42600;
      else if (slugLower.includes('aura')) count = 89400;
      else if (slugLower.includes('green')) count = 25100;
      else if (slugLower.includes('lumiere')) count = 18300;
      else count = 131800;
    }
    const formattedCount = count >= 1000 ? `${(count / 1000).toFixed(1).replace('.', ',')}k` : count.toString();
    return {
      ratingScore: score,
      reviewText: formattedCount,
    };
  }, [storeData?.rating, storeData?.reviewCount, effectiveSlug]);

  // 5. Metric: Tỉ Lệ Phản Hồi Chat
  const chatResponseRate = useMemo(() => {
    if (storeData?.chatResponseRate) return storeData.chatResponseRate;
    const slugLower = effectiveSlug.toLowerCase();
    if (slugLower.includes('green')) return '98% (Trong Vài Giờ)';
    if (slugLower.includes('tech')) return '99% (Trong Vài Phút)';
    return '100% (Trong Vài Phút)';
  }, [storeData?.chatResponseRate, effectiveSlug]);

  // 6. Metric: Tham Gia (Join Duration)
  const joinDurationText = useMemo(() => {
    if (storeData?.joinDuration) return storeData.joinDuration;
    const slugLower = effectiveSlug.toLowerCase();
    if (slugLower.includes('tech')) return '18 Tháng Trước';
    if (slugLower.includes('aura')) return '14 Tháng Trước';
    if (slugLower.includes('green')) return '9 Tháng Trước';
    if (slugLower.includes('lumiere')) return '6 Tháng Trước';
    return '25 Tháng Trước';
  }, [storeData?.joinDuration, effectiveSlug]);

  // Full text for hover tooltip
  const fullAddress = useMemo(() => {
    if (storeData?.address) return storeData.address;
    const slugLower = effectiveSlug.toLowerCase();
    if (slugLower.includes('tech')) return 'Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội';
    if (slugLower.includes('aura')) return 'Phường Võ Thị Sáu, Quận 3, TP. HCM';
    if (slugLower.includes('green')) return 'Phường Thảo Điền, TP. Thủ Đức, TP. HCM';
    if (slugLower.includes('lumiere')) return 'Phường Liễu Giai, Quận Ba Đình, Hà Nội';
    return 'Phường Bến Nghé, Quận 1, TP. HCM';
  }, [storeData?.address, effectiveSlug]);

  const fullCompanyName = useMemo(() => {
    if (storeData?.companyName) return storeData.companyName;
    const slugLower = effectiveSlug.toLowerCase();
    if (slugLower.includes('tech')) return 'CÔNG TY TNHH CÔNG NGHỆ TECHSTORE VIỆT NAM';
    if (slugLower.includes('aura')) return 'CÔNG TY CỔ PHẦN DƯỢC MỸ PHẨM AURA BIO';
    if (slugLower.includes('green')) return 'HỘ KINH DOANH GREENBIO HEALTH & HERBS';
    if (slugLower.includes('lumiere')) return 'CÔNG TY TNHH CÔNG NGHỆ SINH HỌC LUMIÈRE LAB';
    return 'CÔNG TY TNHH SORA SKIN VIỆT NAM';
  }, [storeData?.companyName, effectiveSlug]);

  // 7. Metric: Địa Chỉ (Che bảo mật thông tin Chuẩn SCANMS: *****, [Địa chỉ])
  const addressText = useMemo(() => {
    return `*****, ${fullAddress}`;
  }, [fullAddress]);

  // 8. Metric: Công Ty/HKD (Che bảo mật thông tin pháp nhân Chuẩn SCANMS: C***********G)
  const companyNameText = useMemo(() => {
    const trimmed = fullCompanyName.trim();
    const first = trimmed.charAt(0) || 'C';
    return `${first}***********G`;
  }, [fullCompanyName]);

  // Dynamic Categories from actual store products (matching what the shop sells)
  const shopCategories = useMemo(() => {
    const catMap = new Map<string, { id: string; name: string; filterFn: (p: any) => boolean }>();

    rawProducts.forEach((p: any) => {
      const cat = p.categoryName?.trim();
      if (cat && !catMap.has(cat)) {
        catMap.set(cat, {
          id: cat.toLowerCase().replace(/\s+/g, '-'),
          name: cat,
          filterFn: (item: any) => item.categoryName === cat || (item.categoryName && item.categoryName.toLowerCase().includes(cat.toLowerCase())),
        });
      }
    });

    if (catMap.size >= 3) {
      return Array.from(catMap.values());
    }

    // Comprehensive rule set for cosmetics, technology, and health/lifestyle
    const allRules = [
      // Cosmetics
      {
        id: 'serum',
        name: 'Serum & Tinh Chất',
        filterFn: (p: any) => {
          const t = (p.title || '').toLowerCase();
          return t.includes('serum') || t.includes('tinh chất') || t.includes('ampoule');
        },
      },
      {
        id: 'kem-duong',
        name: 'Kem Dưỡng',
        filterFn: (p: any) => {
          const t = (p.title || '').toLowerCase();
          return t.includes('kem dưỡng') || t.includes('dưỡng ẩm') || t.includes('cream');
        },
      },
      {
        id: 'chong-nang',
        name: 'Kem Chống Nắng',
        filterFn: (p: any) => {
          const t = (p.title || '').toLowerCase();
          return t.includes('chống nắng') || t.includes('sunscreen') || t.includes('shield');
        },
      },
      {
        id: 'rua-mat',
        name: 'Sữa Rửa Mặt',
        filterFn: (p: any) => {
          const t = (p.title || '').toLowerCase();
          return t.includes('sữa rửa mặt') || t.includes('rửa mặt') || t.includes('cleanser') || t.includes('tẩy trang');
        },
      },
      // Tech
      {
        id: 'tai-nghe',
        name: 'Tai Nghe & Âm Thanh',
        filterFn: (p: any) => {
          const t = (p.title || '').toLowerCase();
          return t.includes('tai nghe') || t.includes('headphone') || t.includes('earphone') || t.includes('anc') || t.includes('audio');
        },
      },
      {
        id: 'ban-phim',
        name: 'Bàn Phím & Phụ Kiện',
        filterFn: (p: any) => {
          const t = (p.title || '').toLowerCase();
          return t.includes('bàn phím') || t.includes('chuột') || t.includes('keyboard') || t.includes('phụ kiện');
        },
      },
      // Health & Food
      {
        id: 'thao-moc',
        name: 'Trà Thảo Mộc & Sức Khỏe',
        filterFn: (p: any) => {
          const t = (p.title || '').toLowerCase();
          return t.includes('trà') || t.includes('thảo mộc') || t.includes('sức khỏe');
        },
      },
      {
        id: 'dinh-duong',
        name: 'Hạt Dinh Dưỡng & Healthy',
        filterFn: (p: any) => {
          const t = (p.title || '').toLowerCase();
          return t.includes('granola') || t.includes('hạt') || t.includes('dinh dưỡng');
        },
      },
    ];

    const activeRules = allRules.filter((rule) => rawProducts.some(rule.filterFn));
    if (activeRules.length > 0) {
      return activeRules;
    }

    return [
      { id: 'serum', name: 'Serum & Tinh Chất', filterFn: () => true },
      { id: 'kem-duong', name: 'Kem Dưỡng', filterFn: () => true },
      { id: 'chong-nang', name: 'Kem Chống Nắng', filterFn: () => true },
      { id: 'rua-mat', name: 'Sữa Rửa Mặt', filterFn: () => true },
    ];
  }, [rawProducts]);

  // Filter products by active tab, category, price range, and sort order
  const filteredProducts = useMemo(() => {
    let result = rawProducts;

    // Filter by active category if not 'dao' and not 'all'
    if (activeTab !== 'dao' && activeTab !== 'all') {
      const targetCat = shopCategories.find((c) => c.id === activeTab);
      if (targetCat) {
        result = result.filter(targetCat.filterFn);
      }
    }

    // Filter by applied price range
    if (appliedMinPrice !== null) {
      result = result.filter((p: any) => p.price >= appliedMinPrice);
    }
    if (appliedMaxPrice !== null) {
      result = result.filter((p: any) => p.price <= appliedMaxPrice);
    }

    // Sort order
    const sorted = [...result];
    if (sortBy === 'popular') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'newest') {
      sorted.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'sales') {
      sorted.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    } else if (sortBy === 'price-asc') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => b.price - a.price);
    }

    return sorted;
  }, [rawProducts, activeTab, shopCategories, appliedMinPrice, appliedMaxPrice, sortBy]);

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = minPriceInput ? Number(minPriceInput.replace(/\D/g, '')) : null;
    const maxVal = maxPriceInput ? Number(maxPriceInput.replace(/\D/g, '')) : null;
    if (minVal !== null && maxVal !== null && minVal > maxVal) {
      toast.error('Giá tối thiểu không được lớn hơn giá tối đa!');
      return;
    }
    setAppliedMinPrice(minVal);
    setAppliedMaxPrice(maxVal);
    toast.success('Đã áp dụng bộ lọc khoảng giá!');
  };

  const handleResetFilters = () => {
    setActiveTab('all');
    setMinPriceInput('');
    setMaxPriceInput('');
    setAppliedMinPrice(null);
    setAppliedMaxPrice(null);
    setSortBy('popular');
  };

  const handleFollowToggle = () => {
    setIsFollowing((prev) => {
      const next = !prev;
      setFollowerCount((count) => (next ? count + 1 : count - 1));
      if (next) {
        toast.success(`Đã theo dõi gian hàng ${storeData?.name || 'Sora Skin'}`);
      } else {
        toast.info('Đã hủy theo dõi gian hàng');
      }
      return next;
    });
  };

  const handleOpenChat = () => {
    openChat({
      id: storeData?.id || 'a7e7bd20-bebc-44c9-a98b-004de44cf773',
      name: storeData?.name || 'Sora Skin Official Store',
      logoUrl: storeData?.logoUrl,
      isVerified: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans text-left">
      <PublicHeader />

      <main className="max-w-[1240px] w-full mx-auto px-3 sm:px-4 py-4 space-y-4 flex-1">
        {/* TOP STORE BANNER (Image 1 Shop Header Card) */}
        <div className="bg-white rounded-xl shadow-xs border border-[#EAE4D7] overflow-hidden">
          <div className="p-3 sm:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
              {/* Left Shop Profile Card (Warm Sand Tone sáng đồng bộ memory SCANMS) */}
              <div className="lg:col-span-4 bg-gradient-to-br from-[#FBF5EB] via-[#F3EFE6] to-[#EFE9DC] border border-[#EEDFC6] rounded-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden shadow-2xs">
                {/* Decorative subtle ambient brand glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#C59B58]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-[#C59B58]/10 rounded-full blur-xl pointer-events-none" />

                {/* Top: Avatar & Title Block */}
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className="relative shrink-0">
                    {storeData?.logoUrl ? (
                      <img
                        src={storeData.logoUrl}
                        alt={storeData.name}
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover border-2 border-[#EEDFC6] shadow-xs"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-18 sm:h-18 shrink-0 rounded-xl bg-white text-[#B88E4F] flex items-center justify-center font-black text-2xl sm:text-3xl border-2 border-[#EEDFC6] shadow-xs">
                        {storeData?.name?.charAt(0) || 'S'}
                      </div>
                    )}
                  </div>

                  {/* Shop Name & Online Status */}
                  <div className="min-w-0 flex-1">
                    <h1 className="m-0 text-base sm:text-lg font-bold text-[#1A1612] uppercase tracking-tight leading-snug truncate">
                      {storeData?.name || 'SORA SKIN OFFICIAL STORE'}
                    </h1>
                    <div className="flex items-center gap-1.5 text-xs text-[#059669] font-medium mt-1">
                      <span className="w-2 h-2 rounded-full bg-[#059669] inline-block animate-pulse" />
                      <span className="text-[#059669] text-[11px] font-medium">Online</span>
                    </div>
                    {publicWebsiteUrl && (
                      <a
                        href={publicWebsiteUrl.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={publicWebsiteUrl.href}
                        aria-label={`Mở website chính thức của ${storeData?.name || 'gian hàng'}`}
                        className="mt-2 inline-flex max-w-full items-center gap-1.5 text-[11px] font-semibold text-[#8A642C] transition-colors hover:text-[#B88E4F]"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{publicWebsiteUrl.hostname.replace(/^www\./, '')}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Bottom: Follow & Chat Action Buttons (Nằm sát đáy khung) */}
                <div className="relative z-10 grid grid-cols-2 gap-2 mt-auto pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    className={`h-8 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer select-none ${
                      isFollowing
                        ? 'bg-[#EAE4D7] hover:bg-[#DDD5C5] text-[#1A1612] border border-[#DDD5C5]'
                        : 'bg-[#d0011b] hover:bg-[#b80017] text-white shadow-xs'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đang Theo Dõi</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Theo Dõi</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenChat}
                    className="h-8 px-3 bg-white hover:bg-[#FAF8F5] text-[#1A1612] border border-[#EAE4D7] hover:border-[#C59B58] rounded text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer select-none shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#B88E4F]" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>

              {/* Right Statistics Panel (SCANMS UI Reference Shop Metrics - 8 Metrics) */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs sm:text-[13px] self-center">
                {/* Metric 1: Sản Phẩm */}
                <div className="flex items-center gap-1.5 py-0.5">
                  <Package className="w-4 h-4 text-[#333333] shrink-0" />
                  <span className="text-[#333333]">Sản Phẩm:</span>
                  <span className="font-semibold text-[#d0011b]">{productCount}</span>
                </div>

                {/* Metric 2: Người Theo Dõi */}
                <div className="flex items-center gap-1.5 py-0.5">
                  <Users className="w-4 h-4 text-[#333333] shrink-0" />
                  <span className="text-[#333333]">Người Theo Dõi:</span>
                  <span className="font-semibold text-[#d0011b]">{followerText}</span>
                </div>

                {/* Metric 3: Đang Theo */}
                <div className="flex items-center gap-1.5 py-0.5">
                  <Users className="w-4 h-4 text-[#333333] shrink-0" />
                  <span className="text-[#333333]">Đang Theo:</span>
                  <span className="font-semibold text-[#d0011b]">{followingCount}</span>
                </div>

                {/* Metric 4: Đánh Giá */}
                <div className="flex items-center gap-1.5 py-0.5">
                  <Star className="w-4 h-4 text-[#333333] shrink-0" />
                  <span className="text-[#333333]">Đánh Giá:</span>
                  <span className="font-semibold text-[#d0011b]">
                    {ratingScore} ({reviewText} Đánh Giá)
                  </span>
                </div>

                {/* Metric 5: Tỉ Lệ Phản Hồi Chat */}
                <div className="flex items-center gap-1.5 py-0.5">
                  <MessageCircle className="w-4 h-4 text-[#333333] shrink-0" />
                  <span className="text-[#333333]">Tỉ Lệ Phản Hồi Chat:</span>
                  <span className="font-semibold text-[#d0011b]">{chatResponseRate}</span>
                </div>

                {/* Metric 6: Tham Gia */}
                <div className="flex items-center gap-1.5 py-0.5">
                  <Calendar className="w-4 h-4 text-[#333333] shrink-0" />
                  <span className="text-[#333333]">Tham Gia:</span>
                  <span className="font-semibold text-[#d0011b]">{joinDurationText}</span>
                </div>

                {/* Metric 7: Địa Chỉ (Che bảo mật thông tin Chuẩn SCANMS) */}
                <div className="flex items-center gap-1.5 py-0.5 min-w-0">
                  <MapPin className="w-4 h-4 text-[#333333] shrink-0" />
                  <span className="text-[#333333] shrink-0">Địa Chỉ:</span>
                  <span className="font-semibold text-[#d0011b] truncate" title={fullAddress}>
                    {addressText}
                  </span>
                </div>

                {/* Metric 8: Công Ty/HKD (Che bảo mật thông tin Chuẩn SCANMS) */}
                <div className="flex items-center gap-1.5 py-0.5 min-w-0">
                  <Building2 className="w-4 h-4 text-[#333333] shrink-0" />
                  <span className="text-[#333333] shrink-0">Công Ty/HKD:</span>
                  <span className="font-semibold text-[#d0011b] truncate" title={fullCompanyName}>
                    {companyNameText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FULL-WIDTH NAVIGATION TABS BAR (Bên dưới header card) */}
        <div className="bg-white rounded-xl shadow-xs border border-[#EAE4D7] px-4 sm:px-6 relative z-10">
          <div className="flex items-center gap-7 sm:gap-10 overflow-x-auto text-sm sm:text-[15px] select-none scrollbar-none">
            {/* Tab 1: Dạo (Trang chủ gian hàng) */}
            <button
              type="button"
              onClick={() => setActiveTab('dao')}
              className={`py-3.5 sm:py-4 transition relative cursor-pointer whitespace-nowrap ${
                activeTab === 'dao'
                  ? 'text-[#d0011b] font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#d0011b]'
                  : 'text-[#333333] hover:text-[#d0011b] font-medium'
              }`}
            >
              Dạo
            </button>

            {/* Tab 2: TẤT CẢ SẢN PHẨM -> Chuyển sang trang tất cả sản phẩm toàn sàn (/search như Ảnh 4) */}
            <Link
              to="/search"
              className="py-3.5 sm:py-4 transition relative cursor-pointer whitespace-nowrap uppercase text-[#333333] hover:text-[#d0011b] font-medium no-underline"
            >
              TẤT CẢ SẢN PHẨM
            </Link>

            {/* Dynamic Store Categories Tabs */}
            {shopCategories.slice(0, 4).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`py-3.5 sm:py-4 transition relative cursor-pointer whitespace-nowrap ${
                  activeTab === cat.id
                    ? 'text-[#d0011b] font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#d0011b]'
                    : 'text-[#333333] hover:text-[#d0011b] font-medium'
                }`}
              >
                {cat.name}
              </button>
            ))}

            {/* Separator and Thêm ▾ (Dropdown chứa các danh mục thêm) */}
            <span className="h-4 w-px bg-[#EAE4D7] shrink-0" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMoreCategoriesOpen((prev) => !prev)}
                className={`py-3.5 sm:py-4 flex items-center gap-1 cursor-pointer font-medium whitespace-nowrap shrink-0 transition-colors ${
                  shopCategories.slice(4).some((c) => c.id === activeTab)
                    ? 'text-[#d0011b] font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-[#d0011b]'
                    : 'text-[#333333] hover:text-[#d0011b]'
                }`}
              >
                <span>Thêm</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Dropdown Menu when clicking Thêm ▾ */}
              {isMoreCategoriesOpen && (
                <div className="absolute top-full left-0 w-56 bg-white rounded-xl shadow-xl border border-[#EAE4D7] py-1.5 z-30 animate-in fade-in-50 duration-150">
                  {shopCategories.length > 4 ? (
                    shopCategories.slice(4).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(cat.id);
                          setIsMoreCategoriesOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-[#FAF8F5] transition ${
                          activeTab === cat.id ? 'text-[#d0011b] font-bold bg-[#FBF5EB]' : 'text-[#1A1612]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))
                  ) : (
                    shopCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(cat.id);
                          setIsMoreCategoriesOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-[#FAF8F5] transition ${
                          activeTab === cat.id ? 'text-[#d0011b] font-bold bg-[#FBF5EB]' : 'text-[#1A1612]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CASE 1: TAB "DẠO" -> HIỂN THỊ STOREFRONT FEED VỚI "GỢI Ý CHO BẠN" VÀ "XEM TẤT CẢ >" */}
        {/* ========================================================================= */}
        {activeTab === 'dao' ? (
          <div>
            <div className="flex items-center justify-between py-2 sm:py-2.5 px-0.5 mb-1">
              <h2 className="m-0 text-xs sm:text-sm font-medium text-[#757575] uppercase tracking-wide">
                GỢI Ý CHO BẠN
              </h2>
              <Link
                to="/search"
                className="text-xs sm:text-[13px] font-normal text-[#d0011b] hover:opacity-80 flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 transition-opacity no-underline"
              >
                <span>Xem Tất Cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Product Grid in Dạo View (6 Columns) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {rawProducts.map((prod: any) => (
                <Link
                  key={prod.id}
                  to={`/products/${prod.slug}`}
                  className="group bg-white rounded-lg border border-[#EAE4D7] hover:border-[#d0011b] hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between no-underline"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#FAF8F5]">
                    <LiveSessionDealBadge deal={liveDeals[prod.id]} now={liveDealsNow} />
                    <img
                      src={getSafeProductImageUrl(prod.imageUrl, prod.title)}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.dataset.hasFallback) {
                          target.dataset.hasFallback = 'true';
                          target.src = getSafeProductImageUrl(null, prod.title);
                        }
                      }}
                    />
                    {prod.discountPercent > 0 && (
                      <span className="absolute top-0 right-0 bg-[#ffd839] text-[#d0011b] text-[10px] font-black px-1.5 py-0.5 rounded-bl">
                        -{prod.discountPercent}%
                      </span>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 bg-[#d0011b] text-white text-[8px] font-bold px-1 rounded-[2px] uppercase">
                      Mall
                    </span>
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <h3 className="m-0 text-xs text-[#1A1612] font-medium line-clamp-2 leading-tight group-hover:text-[#d0011b] transition-colors">
                      {prod.title}
                    </h3>

                    <div className="mt-2">
                      <div className="text-xs sm:text-sm font-bold text-[#d0011b]">
                        {prod.price.toLocaleString('vi-VN')} ₫
                      </div>
                      {prod.originalPrice > prod.price && (
                        <div className="text-[10px] text-[#7D715E] line-through">
                          {prod.originalPrice.toLocaleString('vi-VN')} ₫
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-[#7D715E] mt-1.5 pt-1 border-t border-[#F5F5F5]">
                        <div className="flex items-center gap-0.5 text-[#f59e0b]">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{prod.rating}</span>
                        </div>
                        <span>Đã bán {prod.soldCount}+</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* SCANMS Standard "Xem thêm sản phẩm" button -> Chuyển sang trang tất cả sản phẩm toàn sàn (/search như Ảnh 4) */}
            <div className="mt-6 sm:mt-8 flex justify-center">
              <Link
                to="/search"
                className="w-full max-w-[390px] h-10 sm:h-11 bg-white border border-[#EAE4D7] hover:border-[#C59B58] rounded-[2px] flex items-center justify-center text-sm font-normal text-[#555555] hover:text-[#1A1612] hover:bg-[#FAF8F5] transition shadow-2xs active:scale-[0.99] select-none no-underline"
              >
                Xem thêm sản phẩm
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CASE 2: TAB KHÁC "DẠO" (TẤT CẢ SẢN PHẨM, SERUM, KEM DƯỠNG,...) */
          /* -> HIỂN THỊ CHUẨN ẢNH 2: BỘ LỌC BÊN TRÁI + SẮP XẾP VÀ GRID 5 CỘT BÊN PHẢI */
          /* ========================================================================= */
          <div className="flex flex-col lg:flex-row gap-5 items-start mt-2">
            {/* LEFT SIDEBAR: BỘ LỌC SẢN PHẨM (Chuẩn SCANMS UI Reference) */}
            <aside className="w-full lg:w-[210px] shrink-0 text-left space-y-4">
              {/* Header: BỘ LỌC SẢN PHẨM */}
              <div className="flex items-center gap-2 pb-2.5 border-b border-[#EAE4D7]">
                <SlidersHorizontal className="w-4 h-4 text-[#1A1612]" />
                <h3 className="m-0 text-xs sm:text-sm font-black uppercase tracking-wider text-[#1A1612]">
                  Bộ lọc sản phẩm
                </h3>
              </div>

              {/* Section 1: Tất cả danh mục của Shop */}
              <div className="space-y-2 pb-3 border-b border-[#EAE4D7]">
                <Link
                  to="/search"
                  className="text-xs sm:text-[13px] cursor-pointer transition flex items-center gap-1.5 text-[#1A1612] hover:text-[#d0011b] font-medium no-underline"
                >
                  <span>Tất cả sản phẩm</span>
                </Link>

                {/* List categories */}
                {(showMoreSidebarCats ? shopCategories : shopCategories.slice(0, 5)).map((cat) => {
                  const isSelected = activeTab === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      className={`text-xs sm:text-[13px] cursor-pointer transition flex items-center gap-1.5 pl-2 ${
                        isSelected
                          ? 'text-[#d0011b] font-bold'
                          : 'text-[#4A4A4A] hover:text-[#d0011b]'
                      }`}
                    >
                      {isSelected && <span className="text-[#d0011b] text-xs">▶</span>}
                      <span>{cat.name}</span>
                    </div>
                  );
                })}

                {shopCategories.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowMoreSidebarCats((prev) => !prev)}
                    className="text-xs text-[#7D715E] hover:text-[#d0011b] flex items-center gap-1 cursor-pointer pl-2 pt-1 font-medium"
                  >
                    <span>{showMoreSidebarCats ? 'Thu gọn' : 'Thêm'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreSidebarCats ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {/* Section 2: Gian Hàng Đối Tác (Chuẩn Image 2) */}
              <div className="space-y-2 pb-3 border-b border-[#EAE4D7]">
                <h4 className="m-0 text-xs font-bold text-[#1A1612] uppercase tracking-wide">
                  Gian Hàng Đối Tác
                </h4>
                <div className="text-xs text-[#B88E4F] font-bold flex items-center gap-1">
                  <span>▶</span>
                  <span>Toàn bộ gian hàng</span>
                </div>
                <div className="text-xs text-[#1A1612] font-medium pl-2 flex items-center gap-1.5">
                  <span className="truncate">{storeData?.name || 'Sora Skin Official Store'}</span>
                  <Check className="w-3 h-3 text-[#059669] shrink-0" />
                </div>
              </div>

              {/* Section 3: Khoảng Giá (Chuẩn Image 2) */}
              <div className="space-y-2.5 pb-3 border-b border-[#EAE4D7]">
                <h4 className="m-0 text-xs font-bold text-[#1A1612] uppercase tracking-wide">
                  Khoảng Giá
                </h4>
                <form onSubmit={handleApplyPrice} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="đ TỪ"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-[#EAE4D7] rounded text-xs text-[#1A1612] placeholder:text-[#7D715E] focus:outline-hidden focus:border-[#C59B58]"
                    />
                    <span className="text-[#7D715E]">-</span>
                    <input
                      type="text"
                      placeholder="đ ĐẾN"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-[#EAE4D7] rounded text-xs text-[#1A1612] placeholder:text-[#7D715E] focus:outline-hidden focus:border-[#C59B58]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold rounded transition cursor-pointer shadow-2xs active:scale-98"
                  >
                    ÁP DỤNG
                  </button>
                </form>
              </div>

              {/* Reset Filters Button */}
              {(activeTab !== 'all' || appliedMinPrice !== null || appliedMaxPrice !== null) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-1.5 bg-white hover:bg-[#FAF8F5] text-[#d0011b] border border-[#d0011b] text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa tất cả bộ lọc</span>
                </button>
              )}
            </aside>

            {/* RIGHT COLUMN: SORT BAR + PRODUCT GRID (Chuẩn SCANMS UI Reference) */}
            <div className="flex-1 min-w-0 space-y-3.5">
              {/* SCANMS Standard Sort Bar (Exact Image 2) */}
              <div className="bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-wrap">
                  <span className="text-xs sm:text-sm font-medium text-[#7D715E] shrink-0">
                    Sắp xếp theo
                  </span>

                  {/* Phổ Biến Button */}
                  <button
                    type="button"
                    onClick={() => setSortBy('popular')}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                      sortBy === 'popular'
                        ? 'bg-[#C59B58] text-white shadow-2xs border border-[#C59B58]'
                        : 'bg-white text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F] border border-[#EAE4D7]'
                    }`}
                  >
                    Phổ Biến
                  </button>

                  {/* Mới Nhất Button */}
                  <button
                    type="button"
                    onClick={() => setSortBy('newest')}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                      sortBy === 'newest'
                        ? 'bg-[#C59B58] text-white shadow-2xs border border-[#C59B58]'
                        : 'bg-white text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F] border border-[#EAE4D7]'
                    }`}
                  >
                    Mới Nhất
                  </button>

                  {/* Bán Chạy Button */}
                  <button
                    type="button"
                    onClick={() => setSortBy('sales')}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                      sortBy === 'sales'
                        ? 'bg-[#C59B58] text-white shadow-2xs border border-[#C59B58]'
                        : 'bg-white text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F] border border-[#EAE4D7]'
                    }`}
                  >
                    Bán Chạy
                  </button>

                  {/* Giá ▾ Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsPriceDropdownOpen((prev) => !prev)}
                      className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                        sortBy.startsWith('price')
                          ? 'bg-[#C59B58] text-white font-bold border border-[#C59B58]'
                          : 'bg-white text-[#1A1612] hover:bg-[#FAF8F5] border border-[#EAE4D7]'
                      }`}
                    >
                      <span>
                        {sortBy === 'price-asc'
                          ? 'Giá: Thấp đến Cao'
                          : sortBy === 'price-desc'
                          ? 'Giá: Cao đến Thấp'
                          : 'Giá'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {isPriceDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-[#EAE4D7] py-1 z-30 animate-in fade-in-50">
                        <button
                          type="button"
                          onClick={() => {
                            setSortBy('price-asc');
                            setIsPriceDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#FAF8F5] transition text-[#1A1612]"
                        >
                          Giá: Thấp đến Cao
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSortBy('price-desc');
                            setIsPriceDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#FAF8F5] transition text-[#1A1612]"
                        >
                          Giá: Cao đến Thấp
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Product count */}
                <div className="text-xs sm:text-sm font-medium text-[#7D715E] shrink-0">
                  {filteredProducts.length} sản phẩm
                </div>
              </div>

              {/* Product Grid (5 Columns on Desktop, Exact SCANMS UI Reference) */}
              {filteredProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredProducts.map((prod: any) => {
                      const isFav = !!favorites[prod.id];
                      return (
                        <Link
                          key={prod.id}
                          to={`/products/${prod.slug}`}
                          className="group bg-white rounded-lg border border-[#EAE4D7] hover:border-[#d0011b] hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between no-underline relative"
                        >
                          {/* Thumbnail Container */}
                          <div className="relative aspect-square overflow-hidden bg-[#FAF8F5]">
                            <LiveSessionDealBadge deal={liveDeals[prod.id]} now={liveDealsNow} />
                            <img
                              src={getSafeProductImageUrl(prod.imageUrl, prod.title)}
                              alt={prod.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (!target.dataset.hasFallback) {
                                  target.dataset.hasFallback = 'true';
                                  target.src = getSafeProductImageUrl(null, prod.title);
                                }
                              }}
                            />

                            {/* Discount badge (-20%) */}
                            {prod.discountPercent > 0 && (
                              <span className="absolute top-0 right-0 bg-[#ffd839] text-[#d0011b] text-[10px] font-black px-1.5 py-0.5 rounded-bl shadow-2xs">
                                -{prod.discountPercent}%
                              </span>
                            )}

                            {/* Heart favorite button in top-right area (SCANMS UI Reference) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(prod.id);
                              }}
                              className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-white/80 hover:bg-white shadow-2xs flex items-center justify-center transition active:scale-90 cursor-pointer"
                              title={isFav ? 'Bỏ yêu thích' : 'Yêu thích'}
                            >
                              <Heart
                                className={`w-4 h-4 transition-colors ${
                                  isFav ? 'text-[#d0011b] fill-[#d0011b]' : 'text-[#7D715E] hover:text-[#d0011b]'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Card Body */}
                          <div className="p-2.5 flex-1 flex flex-col justify-between">
                            {/* Store Name + Chính hãng pill */}
                            <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[#7D715E]">
                              <span className="truncate max-w-[85px] sm:max-w-[95px] font-medium text-[#1A1612]">
                                🏪 {storeData?.name ? storeData.name.split(' ')[0] + ' ' + (storeData.name.split(' ')[1] || '') : 'Sora Skin'}...
                              </span>
                              <span className="px-1 py-0.2 border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] rounded-xs text-[9px] font-semibold shrink-0">
                                Chính hãng
                              </span>
                            </div>

                            {/* Product Title */}
                            <h3 className="m-0 text-xs text-[#1A1612] font-medium line-clamp-2 leading-tight group-hover:text-[#d0011b] transition-colors mb-1.5">
                              {prod.title}
                            </h3>

                            {/* Badge: ⚡ Rẻ Vô Địch (Chuẩn SCANMS UI Reference) */}
                            <div className="mb-1.5">
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#FFF7ED] border border-[#FED7AA] text-[#EA580C] text-[9.5px] font-bold rounded-xs">
                                <Zap className="w-2.5 h-2.5 fill-current" />
                                <span>Rẻ Vô Địch</span>
                              </span>
                            </div>

                            {/* Price & Sold count Row */}
                            <div className="mt-auto">
                              <div className="flex items-baseline justify-between gap-1">
                                <span className="text-xs sm:text-[13px] font-bold text-[#d0011b]">
                                  {prod.price.toLocaleString('vi-VN')} ₫
                                </span>
                                <span className="text-[10px] text-[#7D715E] shrink-0">
                                  {prod.soldCount} đã bán
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Nút xem thêm sản phẩm toàn sàn (/search như Ảnh 4) */}
                  <div className="mt-6 sm:mt-8 flex justify-center">
                    <Link
                      to="/search"
                      className="w-full max-w-[390px] h-10 sm:h-11 bg-white border border-[#EAE4D7] hover:border-[#C59B58] rounded-[2px] flex items-center justify-center text-sm font-normal text-[#555555] hover:text-[#1A1612] hover:bg-[#FAF8F5] transition shadow-2xs active:scale-[0.99] select-none no-underline"
                    >
                      Xem thêm sản phẩm
                    </Link>
                  </div>
                </>
              ) : (
                /* Empty state when no products match filter */
                <div className="bg-white rounded-xl border border-[#EAE4D7] p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center mx-auto text-xl font-bold">
                    📦
                  </div>
                  <h4 className="text-sm font-bold text-[#1A1612]">
                    Không tìm thấy sản phẩm phù hợp trong danh mục này
                  </h4>
                  <p className="text-xs text-[#7D715E] max-w-sm mx-auto">
                    Hãy thử chọn lại danh mục khác hoặc xóa bộ lọc khoảng giá để xem thêm sản phẩm.
                  </p>
                  <Link
                    to="/search"
                    className="inline-block px-4 py-2 bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer no-underline"
                  >
                    Xem tất cả sản phẩm toàn sàn
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
