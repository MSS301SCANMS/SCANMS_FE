import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Store,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowRight,
  X,
  ShoppingBag,
  ShoppingCart,
  Play,
  Star,
  Tag,
  ChevronDown,
  Phone,
  Package,
  TrendingUp,
  User,
  Shield,
  Clock,
  Check,
} from 'lucide-react';
import api from '../../services/api';
import { GuestCheckoutModal, type CheckoutProductItem, type CheckoutStoreInfo } from '../../components/checkout/GuestCheckoutModal';
import {
  marketplaceProducts,
  marketplaceKOLs,
  marketplaceVideos,
} from '../../features/marketplace/marketplaceData';
import { formatMoney, normalizeSearch } from '../../features/marketplace/marketplaceUtils';
import type { Product, ReviewVideo } from '../../features/marketplace/marketplace.types';
import { toast } from '../../utils/toast';

export default function MarketplacePage() {
  const [items, setItems] = useState<Product[]>(marketplaceProducts);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ReviewVideo | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeCheckoutProduct, setActiveCheckoutProduct] = useState<{
    product: CheckoutProductItem;
    store: CheckoutStoreInfo;
    couponCode?: string;
  } | null>(null);

  const [trackQuery, setTrackQuery] = useState('');
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLElement>(null);
  const trackingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get('/public/products', { params: { limit: 48 } })
      .then((res) => {
        if (!mounted) return;
        const apiItems = res.data?.items || [];
        if (apiItems.length > 0) {
          const mappedApiItems: Product[] = apiItems.map((dbP: any) => ({
            id: dbP.id,
            name: dbP.title || dbP.name,
            brand: dbP.store?.name || 'Sora Skin Official',
            category: (dbP.category?.slug || 'skincare') as any,
            categoryLabel: dbP.category?.name || 'Chăm sóc da & Serum',
            rating: 4.9,
            reviews: 42,
            sold: '320',
            origPrice: Number(dbP.originalPrice || dbP.price * 1.15 || 500000),
            price: Number(dbP.price || 420000),
            kolDiscountPrice: Math.round(Number(dbP.price || 420000) * 0.9),
            image: dbP.imageUrl || '/reference/assets/serum-hero-optimized.jpg',
            kol: {
              name: 'Trần Văn Nhật',
              handle: '@nhatbeauty',
              coupon: 'NHATXINH10',
              tier: 'KOL Vàng',
            },
            badge: 'Mới lên sàn',
          }));

          const existingIds = new Set(mappedApiItems.map((p) => p.id));
          const combined = [
            ...mappedApiItems,
            ...marketplaceProducts.filter((p) => !existingIds.has(p.id)),
          ];
          setItems(combined);
        }
      })
      .catch(() => {
        setItems(marketplaceProducts);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(e.target as Node)
      ) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableStores = useMemo(() => {
    const set = new Set<string>();
    for (const p of items) {
      if (p.brand?.trim()) set.add(p.brand.trim());
    }
    return Array.from(set);
  }, [items]);

  const filteredProducts = useMemo(() => {
    const q = normalizeSearch(search);
    return items.filter((p) => {
      const matchCat =
        selectedCategory === 'all' ||
        p.category === selectedCategory ||
        p.categoryLabel.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchStore =
        selectedStore === 'all' || p.brand === selectedStore;

      if (!matchCat || !matchStore) return false;
      if (!q) return true;

      const nName = normalizeSearch(p.name);
      const nBrand = normalizeSearch(p.brand);
      const nKol = normalizeSearch(p.kol?.name || '');
      const nCoupon = normalizeSearch(p.kol?.coupon || '');
      return (
        nName.includes(q) ||
        nBrand.includes(q) ||
        nKol.includes(q) ||
        nCoupon.includes(q)
      );
    });
  }, [items, search, selectedCategory, selectedStore]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }, [cart]);

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`Đã thêm "${product.name.slice(0, 32)}..." vào giỏ hàng!`);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[];
    });
  };

  const handleOpenDirectCheckout = (product: Product) => {
    setActiveCheckoutProduct({
      product: {
        id: product.id,
        title: product.name,
        price: product.price,
        originalPrice: product.origPrice,
        imageUrl: product.image,
        stockQuantity: 99,
      },
      store: {
        id: 'store-1',
        name: product.brand,
      },
      couponCode: product.kol?.coupon || '',
    });
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) {
      toast.error('Vui lòng nhập Số điện thoại hoặc Mã đơn hàng');
      return;
    }

    setTrackingLoading(true);
    setTimeout(() => {
      setTrackingLoading(false);
      setTrackResult({
        orderCode: trackQuery.toUpperCase().startsWith('IN')
          ? trackQuery.toUpperCase()
          : 'IN23931',
        customerName: 'Nguyễn Văn Khách',
        phone: trackQuery.match(/^[0-9]+$/) ? trackQuery : '0918 *** 888',
        address: '142 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh',
        storeName: 'Sora Skin Official',
        productName: 'Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Sora Skin (x1)',
        totalAmount: 413100,
        carrier: 'ViettelPost Nhanh',
        status: 'ĐANG VẬN CHUYỂN',
        statusNote: 'Kiện hàng đã rời trung tâm khai thác TP.HCM, dự kiến giao trong ngày.',
        timeline: [
          { time: '09:15 - Hôm nay', text: 'Bưu tá ViettelPost đang phát hàng tới địa chỉ người nhận' },
          { time: '21:30 - Hôm qua', text: 'Đơn hàng nhập kho trung chuyển Tân Bình' },
          { time: '14:00 - Hôm qua', text: 'Gian hàng Sora Skin Official đã đóng gói và bàn giao đối tác vận chuyển' },
          { time: '10:30 - Hôm qua', text: 'Đơn hàng được xác nhận thành công qua mã ưu đãi NHATXINH10' },
        ],
      });
    }, 600);
  };

  const spotlightProduct = items[0] || marketplaceProducts[0];
  const spotlightCreator = marketplaceKOLs[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612] flex flex-col font-sans selection:bg-[#F3EFE6] selection:text-[#B88E4F]">

      <aside className="bg-[#F3EFE6] text-[#7A561B] text-[11.5px] font-medium py-2 px-4 border-b border-[#EEDFC6]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C59B58] animate-ping"></span>
            <span className="font-bold text-[#1A1612]">SCANMS COMMERCE:</span>
            <span className="text-[#7D715E]">Sàn Mua Sắm & Tiếp Thị Liên Kết Đa Gian Hàng · 100% Chính Hãng · Bảo Hộ Đổi Trả 14 Ngày</span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs text-[#7A561B]">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-[#B88E4F] transition flex items-center gap-1 cursor-pointer font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C59B58]" />
              Chính sách an tâm
            </button>
            <button
              type="button"
              onClick={() => {
                trackingRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#B88E4F] transition flex items-center gap-1 cursor-pointer font-semibold"
            >
              <Truck className="w-3.5 h-3.5 text-[#C59B58]" />
              Tra cứu đơn
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAE4D7] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-6">

          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C59B58] to-[#B88E4F] text-white font-black text-lg flex items-center justify-center shadow-xs">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-lg tracking-tight text-[#1A1612] group-hover:text-[#B88E4F] transition">
                SCANMS
              </span>
              <span className="text-[10px] text-[#7D715E] tracking-wider uppercase font-bold leading-none hidden sm:inline">
                Sàn Tiếp Thị Đa Gian Hàng
              </span>
            </div>
          </Link>

          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#B88E4F] absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm, thương hiệu, Creator hoặc mã voucher..."
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-[#1A1612] placeholder-[#8C7D6B] focus:bg-white focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58] outline-none transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 text-[#7D715E] hover:text-[#1A1612] p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                trackingRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] transition cursor-pointer"
            >
              <Package className="w-4 h-4 text-[#B88E4F]" />
              <span>Tra cứu đơn</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#1A1612] bg-[#FAF8F5] border border-[#EAE4D7] hover:bg-[#F3EFE6] transition cursor-pointer shadow-2xs"
              title="Giỏ hàng của bạn"
            >
              <ShoppingCart className="w-4 h-4 text-[#B88E4F]" />
              <span className="hidden sm:inline">Giỏ hàng</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#C59B58] text-white text-[10px] font-black flex items-center justify-center -mr-1">
                  {totalCartCount}
                </span>
              )}
            </button>

            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#1A1612] bg-[#FBF5EB] border border-[#EEDFC6] hover:bg-[#F5E7CC] transition cursor-pointer shadow-2xs"
              >
                <User className="w-4 h-4 text-[#B88E4F]" />
                <span>Cổng đối tác</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#7D715E]" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#EAE4D7] rounded-2xl shadow-xl p-3 flex flex-col gap-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-[#EAE4D7]">
                    <strong className="block text-xs font-black text-[#1A1612]">
                      Cổng đăng nhập đối tác
                    </strong>
                    <small className="text-[11px] text-[#7D715E] block mt-0.5">
                      Truy cập không gian làm việc chuyên biệt theo vai trò
                    </small>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Link
                      to="/collaborator/dashboard"
                      onClick={() => setIsRoleDropdownOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#FBF5EB] transition text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-[#1A1612]">Cộng Tác Viên / KOL</span>
                        <small className="text-[10px] text-[#7D715E] block truncate">Lấy link tiếp thị & rút hoa hồng</small>
                      </div>
                    </Link>

                    <Link
                      to="/merchant/dashboard"
                      onClick={() => setIsRoleDropdownOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#FBF5EB] transition text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#F5E7CC] text-[#7A561B] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-[#1A1612]">Chủ Gian Hàng (Shop)</span>
                        <small className="text-[10px] text-[#7D715E] block truncate">Quản lý sản phẩm & đối soát</small>
                      </div>
                    </Link>

                    <Link
                      to="/admin/users"
                      onClick={() => setIsRoleDropdownOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#FBF5EB] transition text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#231D15] text-[#EEDFC6] flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-[#1A1612]">Quản Trị Hệ Thống</span>
                        <small className="text-[10px] text-[#7D715E] block truncate">Duyệt KYC, an ninh & cấu hình</small>
                      </div>
                    </Link>
                  </div>

                  <div className="pt-2 border-t border-[#EAE4D7] grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setIsRoleDropdownOpen(false)}
                      className="text-center py-2 px-3 rounded-xl bg-[#C59B58] text-white text-xs font-bold hover:bg-[#B88E4F] transition"
                    >
                      Đăng nhập
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsRoleDropdownOpen(false)}
                      className="text-center py-2 px-3 rounded-xl bg-[#C59B58] text-white text-xs font-bold hover:bg-[#B88E4F] transition"
                    >
                      Đăng ký
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#F3EFE6]/60 border-t border-[#EAE4D7] px-4 sm:px-6 py-2 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 min-w-max">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#C59B58] text-white shadow-xs'
                    : 'bg-white text-[#7D715E] hover:text-[#1A1612] border border-[#EAE4D7]'
                }`}
              >
                Tất cả sản phẩm ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('skincare')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  selectedCategory === 'skincare'
                    ? 'bg-[#C59B58] text-white shadow-xs'
                    : 'bg-white text-[#7D715E] hover:text-[#1A1612] border border-[#EAE4D7]'
                }`}
              >
                Chăm sóc da & Serum
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('home')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  selectedCategory === 'home'
                    ? 'bg-[#C59B58] text-white shadow-xs'
                    : 'bg-white text-[#7D715E] hover:text-[#1A1612] border border-[#EAE4D7]'
                }`}
              >
                Gia dụng & Đời sống
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('tech')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  selectedCategory === 'tech'
                    ? 'bg-[#C59B58] text-white shadow-xs'
                    : 'bg-white text-[#7D715E] hover:text-[#1A1612] border border-[#EAE4D7]'
                }`}
              >
                Công nghệ & Phụ kiện
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#7D715E] font-bold flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
                Gian hàng:
              </span>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="bg-white border border-[#EAE4D7] rounded-xl px-3 py-1 text-xs font-bold text-[#1A1612] outline-none cursor-pointer"
              >
                <option value="all">Tất cả gian hàng ({availableStores.length})</option>
                {availableStores.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-[#F3EFE6] via-[#FAF8F5] to-[#FAF8F5] border-b border-[#EAE4D7] py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            <div className="lg:col-span-6 flex flex-col gap-5 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] text-xs font-bold w-max shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>MUA SẮM CÙNG CREATOR · BẢO HỘ CHÍNH HÃNG</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#1A1612] leading-[1.15] m-0">
                Chọn món bạn thích.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B88E4F] via-[#C59B58] to-[#9A7032]">
                  Ưu đãi từ Creator.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-[#7D715E] leading-relaxed m-0 max-w-xl">
                Khám phá sản phẩm qua review chân thực và áp dụng mã ưu đãi độc quyền từ Creator yêu thích để nhận mức giá tốt nhất cùng bảo hộ đổi trả 14 ngày & đồng kiểm khi nhận từ sàn SCANMS.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C59B58] text-white font-bold text-xs sm:text-sm hover:bg-[#B88E4F] transition cursor-pointer shadow-sm hover:shadow"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Khám phá sản phẩm</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-[#EAE4D7] text-[#1A1612] font-bold text-xs sm:text-sm hover:bg-[#F3EFE6] transition cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-[#B88E4F]" />
                  <span>Chính sách an tâm</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="p-3 rounded-xl bg-white border border-[#EAE4D7] flex items-center gap-2.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <strong className="block text-xs font-bold text-[#1A1612]">100% Chính hãng</strong>
                    <span className="text-[10.5px] text-[#7D715E] block">Kiểm định nguồn gốc</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#EAE4D7] flex items-center gap-2.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <strong className="block text-xs font-bold text-[#1A1612]">Bảo hộ 14 ngày</strong>
                    <span className="text-[10.5px] text-[#7D715E] block">Đồng kiểm khi nhận</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#EAE4D7] flex items-center gap-2.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <strong className="block text-xs font-bold text-[#1A1612]">Ưu đãi Creator</strong>
                    <span className="text-[10.5px] text-[#7D715E] block">Giảm trực tiếp vào đơn</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white border-2 border-[#EEDFC6] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden text-left">
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black">
                    -20% GIẢM
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] text-xs font-black">
                    ⭐ Spotlight
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  <div className="sm:col-span-5 relative group overflow-hidden rounded-2xl bg-[#FAF8F5]">
                    <img
                      src={spotlightProduct.image}
                      alt={spotlightProduct.name}
                      className="w-full aspect-square object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                      loading="eager"
                    />
                  </div>

                  <div className="sm:col-span-7 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#7D715E] flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
                        {spotlightProduct.brand}
                      </span>
                      <span className="text-xs text-[#EAE4D7]">|</span>
                      <span className="text-xs font-bold text-[#B88E4F] flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-[#B88E4F]" />
                        {spotlightProduct.rating} ({spotlightProduct.sold} đã bán)
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-[#1A1612] leading-snug m-0">
                      {spotlightProduct.name}
                    </h3>

                    <div className="p-3 rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center gap-3">
                      <img
                        src={spotlightCreator.avatarImg}
                        alt={spotlightCreator.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#C59B58] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-black text-[#1A1612]">
                            {spotlightCreator.name}
                          </strong>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-[#C59B58] text-white">
                            {spotlightCreator.tier}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-[#B88E4F] block">
                          Mã ưu đãi: {spotlightProduct.kol.coupon} (-10%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2.5 pt-1">
                      <span className="text-xs text-[#7D715E] line-through">
                        {formatMoney(spotlightProduct.origPrice)}
                      </span>
                      <strong className="text-2xl font-black text-[#1A1612]">
                        {formatMoney(spotlightProduct.kolDiscountPrice)}
                      </strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(spotlightProduct)}
                        className="py-2.5 px-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#1A1612] hover:bg-[#F3EFE6] transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4 text-[#B88E4F]" />
                        <span>Thêm giỏ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDirectCheckout(spotlightProduct)}
                        className="py-2.5 px-3 rounded-xl bg-[#C59B58] text-white text-xs font-black hover:bg-[#B88E4F] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Mua ngay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full text-left">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B88E4F] uppercase tracking-wider mb-1">
              <Play className="w-3.5 h-3.5 fill-[#B88E4F]" />
              <span>Video Review Thực Tế</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1612] m-0">
              Trải nghiệm chân thực từ Creator
            </h2>
            <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
              Bấm vào từng video clip để xem review thực tế và lấy mã giảm giá áp dụng trực tiếp khi mua sắm.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketplaceVideos.map((v) => (
            <div
              key={v.id}
              onClick={() => setActiveVideo(v)}
              className="group cursor-pointer rounded-2xl border border-[#EAE4D7] bg-white overflow-hidden shadow-2xs hover:shadow-md hover:border-[#C59B58] transition flex flex-col"
            >
              <div className="relative aspect-[9/13] bg-[#231D15] overflow-hidden">
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                    {v.views} views
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#C59B58] text-white text-[10px] font-black">
                    Mã: {v.coupon}
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 text-[#C59B58] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#C59B58] group-hover:text-white transition shadow-lg">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 right-3 z-10 text-white">
                  <span className="text-[11px] font-extrabold text-[#EEDFC6] block">
                    {v.kol} ({v.handle})
                  </span>
                  <p className="text-xs font-bold leading-snug line-clamp-2 mt-0.5 mb-0 text-white">
                    {v.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section ref={catalogRef} id="catalog-section" className="py-10 px-4 sm:px-6 max-w-7xl mx-auto w-full text-left border-t border-[#EAE4D7]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1A1612] m-0">
              Danh mục sản phẩm đối tác
            </h2>
            <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
              Đang hiển thị {filteredProducts.length} sản phẩm chính hãng với bảo hộ nguồn gốc minh bạch
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#7D715E]">Bộ lọc:</span>
            <span className="px-3 py-1 rounded-lg bg-[#F3EFE6] text-xs font-bold text-[#1A1612]">
              {selectedCategory === 'all' ? 'Tất cả danh mục' : selectedCategory} · {selectedStore === 'all' ? 'Tất cả gian hàng' : selectedStore}
            </span>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#EAE4D7] p-8">
            <ShoppingBag className="w-12 h-12 text-[#A49B8B] mx-auto mb-3" />
            <strong className="text-base font-bold text-[#1A1612] block">
              Không tìm thấy sản phẩm phù hợp
            </strong>
            <p className="text-xs text-[#7D715E] mt-1 mb-4">
              Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc danh mục.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setSelectedStore('all');
              }}
              className="px-4 py-2 rounded-xl bg-[#C59B58] text-white text-xs font-bold hover:bg-[#B88E4F] transition"
            >
              Xem tất cả sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-[#C59B58]/80 transition duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-square bg-[#FAF8F5] overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {p.badge && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#C59B58] text-white text-[10px] font-black shadow-xs">
                        {p.badge}
                      </span>
                    )}
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200">
                      -15%
                    </span>
                  </div>

                  <div className="p-4 flex flex-col gap-2 text-left">
                    <div className="flex items-center justify-between text-[11px] text-[#7D715E]">
                      <span className="font-bold flex items-center gap-1 truncate max-w-[150px]">
                        <Store className="w-3 h-3 text-[#B88E4F] shrink-0" />
                        {p.brand}
                      </span>
                      <span className="font-bold text-[#B88E4F] shrink-0">
                        ⭐ {p.rating}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-black text-[#1A1612] leading-snug line-clamp-2 m-0 group-hover:text-[#B88E4F] transition">
                      {p.name}
                    </h3>

                    {p.kol && (
                      <div className="p-2 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-between text-[11px]">
                        <span className="text-[#7D715E] font-medium truncate">
                          {p.kol.name}
                        </span>
                        <span className="font-black text-[#B88E4F] shrink-0">
                          Mã: {p.kol.coupon}
                        </span>
                      </div>
                    )}

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-xs text-[#7D715E] line-through">
                        {formatMoney(p.origPrice)}
                      </span>
                      <strong className="text-base font-black text-[#1A1612]">
                        {formatMoney(p.price)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(p)}
                    className="py-2 px-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#1A1612] hover:bg-[#F3EFE6] transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-[#B88E4F]" />
                    <span>Thêm giỏ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDirectCheckout(p)}
                    className="py-2 px-2.5 rounded-xl bg-[#C59B58] text-white text-xs font-black hover:bg-[#B88E4F] transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <span>Mua ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section ref={trackingRef} id="tracking-section" className="py-12 px-4 sm:px-6 bg-[#F3EFE6] border-t border-[#EAE4D7]">
        <div className="max-w-4xl mx-auto text-left">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold text-[#B88E4F] uppercase tracking-wider">
              Tra cứu minh bạch
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1612] mt-1 m-0">
              Tra cứu hành trình đơn hàng
            </h2>
            <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
              Nhập Số điện thoại mua hàng hoặc Mã vận đơn để kiểm tra trạng thái và lịch trình vận chuyển thực tế.
            </p>
          </div>

          <form
            onSubmit={handleTrackOrder}
            className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto bg-white p-2 rounded-2xl border border-[#EEDFC6] shadow-sm"
          >
            <div className="flex-1 flex items-center px-3">
              <Phone className="w-4 h-4 text-[#B88E4F] mr-2 shrink-0" />
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Nhập số điện thoại (vd: 0912345678) hoặc mã IN23931..."
                className="w-full text-xs sm:text-sm outline-none text-[#1A1612] placeholder-[#A49B8B]"
              />
            </div>
            <button
              type="submit"
              disabled={trackingLoading}
              className="px-6 py-2.5 rounded-xl bg-[#C59B58] text-white text-xs sm:text-sm font-bold hover:bg-[#B88E4F] transition shadow-xs cursor-pointer shrink-0"
            >
              {trackingLoading ? 'Đang tra cứu...' : 'Tra cứu ngay'}
            </button>
          </form>

          {trackResult && (
            <div className="mt-8 bg-white border border-[#EAE4D7] rounded-3xl p-6 sm:p-8 shadow-sm animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAE4D7]">
                <div>
                  <span className="text-xs text-[#7D715E] font-medium">Mã đơn hàng:</span>
                  <strong className="text-base font-black text-[#1A1612] ml-2">
                    {trackResult.orderCode}
                  </strong>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {trackResult.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-[#EAE4D7] text-xs">
                <div>
                  <span className="text-[#7D715E] block">Người nhận hàng:</span>
                  <strong className="text-[#1A1612] text-sm block mt-0.5">
                    {trackResult.customerName} ({trackResult.phone})
                  </strong>
                  <span className="text-[#7D715E] block mt-1">{trackResult.address}</span>
                </div>
                <div>
                  <span className="text-[#7D715E] block">Sản phẩm & Gian hàng:</span>
                  <strong className="text-[#1A1612] text-sm block mt-0.5">
                    {trackResult.productName}
                  </strong>
                  <span className="text-[#B88E4F] font-bold block mt-1">
                    Gian hàng: {trackResult.storeName} · {formatMoney(trackResult.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <strong className="text-xs font-black text-[#1A1612] block mb-3">
                  Lịch trình vận chuyển:
                </strong>
                <div className="space-y-3">
                  {trackResult.timeline.map((step: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#C59B58] mt-1.5 shrink-0"></div>
                      <div>
                        <span className="text-[#7D715E] font-mono text-[11px] block">
                          {step.time}
                        </span>
                        <span className="font-semibold text-[#1A1612] block">
                          {step.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-[#F3EFE6] border-t border-[#EAE4D7] text-[#1A1612] py-12 px-4 sm:px-6 mt-auto text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-xl bg-[#C59B58] text-white font-black text-base flex items-center justify-center shadow-xs">
                S
              </span>
              <strong className="text-[#1A1612] text-lg font-black tracking-tight">SCANMS</strong>
            </div>
            <p className="text-xs text-[#7D715E] leading-relaxed">
              Hệ thống sàn thương mại tiếp thị liên kết đa gian hàng, kết nối hàng nghìn Creator với các thương hiệu chính hãng hàng đầu.
            </p>
          </div>

          <div>
            <strong className="text-[#1A1612] text-xs font-bold uppercase tracking-wider block mb-3">
              Dành cho Người Mua
            </strong>
            <ul className="space-y-2 text-xs text-[#7D715E] list-none p-0 m-0">
              <li>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="hover:text-[#B88E4F] transition cursor-pointer font-medium"
                >
                  Chính sách bảo hộ 14 ngày
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => trackingRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:text-[#B88E4F] transition cursor-pointer font-medium"
                >
                  Tra cứu tình trạng vận đơn
                </button>
              </li>
              <li>Quy chuẩn hàng chính hãng 100%</li>
              <li>Quy trình giải quyết khiếu nại</li>
            </ul>
          </div>

          <div>
            <strong className="text-[#1A1612] text-xs font-bold uppercase tracking-wider block mb-3">
              Cổng Dành Cho Đối Tác
            </strong>
            <ul className="space-y-2 text-xs text-[#7D715E] list-none p-0 m-0">
              <li>
                <Link to="/collaborator/dashboard" className="hover:text-[#B88E4F] transition font-medium">
                  Cộng Tác Viên & KOL Bán Hàng
                </Link>
              </li>
              <li>
                <Link to="/merchant/dashboard" className="hover:text-[#B88E4F] transition font-medium">
                  Chủ Gian Hàng & Doanh Nghiệp
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#B88E4F] transition font-medium">
                  Đăng nhập tài khoản
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#B88E4F] transition font-medium">
                  Đăng ký mở gian hàng / CTV mới
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <strong className="text-[#1A1612] text-xs font-bold uppercase tracking-wider block mb-3">
              Chứng Nhận & Bảo Mật
            </strong>
            <p className="text-xs text-[#7D715E] leading-relaxed">
              Mọi giao dịch trên sàn SCANMS đều được bảo vệ bởi mã hóa SSL 256-bit, đối soát thanh toán an toàn và hỗ trợ đồng kiểm trực tiếp khi nhận hàng.
            </p>
            <span className="text-[11px] text-[#B88E4F] font-bold block mt-2">
              Hotline hỗ trợ: 1900 8888 (8h00 - 21h00)
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-[#EAE4D7] mt-8 pt-6 flex flex-wrap items-center justify-between text-xs text-[#7D715E]">
          <span>© 2026 SCANMS. All rights reserved. Nền tảng quản lý tiếp thị liên kết FA26SE032.</span>
          <div className="flex items-center gap-4 text-[#7D715E]">
            <span className="hover:text-[#1A1612] cursor-pointer">Điều khoản dịch vụ</span>
            <span className="hover:text-[#1A1612] cursor-pointer">Chính sách bảo mật</span>
            <span className="hover:text-[#1A1612] cursor-pointer">Bảo vệ người tiêu dùng</span>
          </div>
        </div>
      </footer>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 text-left animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE4D7]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#B88E4F]" />
                <strong className="text-base font-black text-[#1A1612]">
                  Giỏ hàng của bạn ({totalCartCount})
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-[#7D715E] hover:text-[#1A1612] rounded-full hover:bg-[#F3EFE6] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-[#7D715E]">
                  <ShoppingCart className="w-12 h-12 text-[#EAE4D7] mx-auto mb-2" />
                  <p className="text-xs">Giỏ hàng của bạn đang trống</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <strong className="text-xs font-bold text-[#1A1612] block truncate">
                        {item.product.name}
                      </strong>
                      <span className="text-xs font-black text-[#B88E4F] block mt-0.5">
                        {formatMoney(item.product.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-md bg-white border border-[#EAE4D7] text-xs font-bold flex items-center justify-center hover:bg-[#F3EFE6] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-[#1A1612] w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateCartQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-md bg-white border border-[#EAE4D7] text-xs font-bold flex items-center justify-center hover:bg-[#F3EFE6] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-[#EAE4D7] flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#7D715E] font-medium">Tạm tính:</span>
                  <strong className="text-xl font-black text-[#1A1612]">
                    {formatMoney(cartSubtotal)}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    handleOpenDirectCheckout(cart[0].product);
                  }}
                  className="w-full py-3 rounded-xl bg-[#C59B58] text-white text-xs sm:text-sm font-black hover:bg-[#B88E4F] transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Tiến hành đặt hàng ({totalCartCount})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeVideo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-black text-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveVideo(null)}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative aspect-[9/14] bg-neutral-900">
              <video
                src="/reference/assets/sample-video.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              ></video>
            </div>

            <div className="p-4 bg-white text-[#1A1612] text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10.5px]">
                  {activeVideo.kol}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FBF5EB] text-[#B88E4F] font-bold text-[10.5px] border border-[#EEDFC6]">
                  Mã: {activeVideo.coupon} (-10%)
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 m-0 mb-3">
                {activeVideo.title}
              </h4>
              <button
                type="button"
                onClick={() => {
                  const prod = items.find((p) => p.id === activeVideo.productId) || items[0];
                  setActiveVideo(null);
                  handleOpenDirectCheckout(prod);
                }}
                className="w-full py-2.5 rounded-xl bg-[#C59B58] text-white text-xs font-black hover:bg-[#B88E4F] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Mua theo gợi ý clip</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-[#EAE4D7] shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setIsGuideOpen(false)}
              className="absolute top-4 right-4 text-[#7D715E] hover:text-[#1A1612] p-1.5 rounded-full hover:bg-[#F3EFE6] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-[#1A1612] m-0">
              Chính Sách Mua Sắm An Tâm Tại SCANMS
            </h3>
            <p className="text-xs text-[#7D715E] mt-1 mb-5">
              Quyền lợi bảo vệ tối đa cho khách hàng mua sắm qua liên kết tiếp thị Creator.
            </p>

            <div className="space-y-3.5 text-xs text-[#1A1612]">
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="block font-bold">100% Hàng Chính Hãng & Kiểm Định Nguồn Gốc</strong>
                  <span className="text-[#7D715E] mt-0.5 block leading-relaxed">
                    Tất cả gian hàng hợp tác trên SCANMS đều phải nộp giấy phép kinh doanh và chứng nhận công bố sản phẩm trước khi phân phối.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="block font-bold">Đồng Kiểm & Bảo Hộ Đổi Trả 14 Ngày</strong>
                  <span className="text-[#7D715E] mt-0.5 block leading-relaxed">
                    Khách hàng được quyền mở hộp kiểm tra ngoại quan cùng bưu tá khi nhận hàng và đổi trả miễn phí trong 14 ngày nếu có lỗi từ nhà sản xuất.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong className="block font-bold">Ưu Đãi Độc Quyền Trừ Thẳng Vào Đơn</strong>
                  <span className="text-[#7D715E] mt-0.5 block leading-relaxed">
                    Mã voucher từ các Nhà sáng tạo (KOL) được trừ trực tiếp vào hóa đơn thanh toán COD hoặc VietQR, minh bạch và không phát sinh phụ phí.
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGuideOpen(false)}
              className="mt-6 w-full py-3 rounded-xl bg-[#C59B58] text-white text-xs font-bold hover:bg-[#B88E4F] transition shadow-xs cursor-pointer"
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}

      {activeCheckoutProduct && (
        <GuestCheckoutModal
          isOpen={true}
          onClose={() => setActiveCheckoutProduct(null)}
          product={activeCheckoutProduct.product}
          store={activeCheckoutProduct.store}
          initialCouponCode={activeCheckoutProduct.couponCode}
          onOrderPlaced={(order) => {
            toast.success(`Đặt hàng thành công! Mã đơn: ${order?.publicOrderCode || order?.orderId || 'IN23931'}`);
          }}
        />
      )}
    </div>
  );
}
