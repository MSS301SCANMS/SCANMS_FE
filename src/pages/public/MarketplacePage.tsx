import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Store,
  ShieldCheck,
  Truck,
  ArrowRight,
  ArrowLeft,
  X,
  ShoppingBag,
  ShoppingCart,
  Package,
  TrendingUp,
  User,
  Shield,
  Clock,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  Phone,
  Radio,
  BadgeCheck,
  Calendar,
  ZoomIn,
  Heart,
  Settings,
  LogOut,
  MapPin,
} from 'lucide-react';
import api from '../../services/api';
import { authService, type UserProfile } from '../../services/auth.service';
import { customerService } from '../../services/customer.service';
import { GuestCheckoutModal, type CheckoutProductItem, type CheckoutStoreInfo } from '../../components/checkout/GuestCheckoutModal';
import { ScanMSLogo } from '../../components/common/ScanMSLogo';
import { ChatBell } from '../../components/chat/ChatBell';
import { formatMoney } from '../../features/marketplace/marketplaceUtils';
import type { Product } from '../../features/marketplace/marketplace.types';
import { toast } from '../../utils/toast';
import { useCart } from '../../context/CartContext';

const MARKETPLACE_BANNERS = [
  {
    image: '/assets/marketplace/scanms-marketplace-banner-v3.png',
    eyebrow: 'Sàn đa gian hàng SCANMS',
    title: 'Một điểm đến, nhiều gian hàng chính hãng',
    description: 'Khám phá sản phẩm đa ngành từ các đối tác đã xác minh KYC trên cùng một nền tảng.',
    primaryLabel: 'Mua sắm ngay',
    secondaryLabel: 'Xem tất cả danh mục',
    href: '/search',
    secondaryHref: '/search',
    action: 'link' as const,
  },
  {
    image: '/assets/marketplace/scanms-affiliate-banner-v2.png',
    eyebrow: 'Affiliate Marketplace',
    title: 'Chọn sản phẩm hợp tệp người xem của bạn',
    description: 'So sánh sản phẩm, mức hoa hồng và gian hàng trước khi bắt đầu tạo nội dung.',
    primaryLabel: 'Khám phá kho affiliate',
    secondaryLabel: 'Đăng ký làm KOC',
    href: '/search?commission=true',
    secondaryHref: '/register',
    action: 'link' as const,
  },
  {
    image: '/assets/marketplace/scanms-live-banner-v2.png',
    eyebrow: 'SCANMS Live Commerce',
    title: 'Biến mỗi phiên Live thành một cửa hàng trực tiếp',
    description: 'Kết nối Creator, sản phẩm và người mua trong trải nghiệm mua sắm giàu tương tác.',
    primaryLabel: 'Khám phá KOC Live',
    secondaryLabel: 'Xem sản phẩm nổi bật',
    href: '#live',
    secondaryHref: '/search',
    action: 'live' as const,
  },
] as const;

export default function MarketplacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Fetch real products with TanStack Query (Zero reload flicker, instant cache hit)
  const { data: items = [], isLoading: loading } = useQuery<Product[]>({
    queryKey: ['marketplace-products', sortBy],
    queryFn: async () => {
      const res: any = await api.get('/public/products', { params: { limit: 48, sortBy } });
      const payload = res?.data !== undefined ? (res.data?.data !== undefined ? res.data.data : res.data) : res;
      const apiItems = Array.isArray(payload) ? payload : (payload?.items || []);

      return apiItems.map((dbP: any) => {
        const rawPrice = Number(dbP.price || 0);
        const rawOrigPrice = dbP.originalPrice ? Number(dbP.originalPrice) : 0;
        const commRate = dbP.customCommissionRate
          ? Number(dbP.customCommissionRate)
          : (dbP.store?.defaultCommissionRate ? Number(dbP.store.defaultCommissionRate) : undefined);
        const commAmt = commRate ? Math.round(rawPrice * (commRate / 100)) : undefined;
        const img = dbP.imageUrl || (dbP.mediaAssets?.[0]?.urlOrContent) || '/reference/assets/serum-hero-optimized.jpg';

        return {
          id: dbP.id,
          name: dbP.title || dbP.name,
          brand: dbP.store?.name || 'Gian hàng đối tác',
          storeId: dbP.store?.id || dbP.storeId,
          sku: dbP.sku,
          category: dbP.categoryName || 'Sản phẩm',
          categoryLabel: dbP.categoryName || 'Sản phẩm',
          rating: 5.0,
          reviews: 0,
          sold: 'Chính hãng',
          origPrice: rawOrigPrice,
          price: rawPrice,
          kolDiscountPrice: Math.round(rawPrice * 0.9),
          image: img,
          stockQuantity: Number(dbP.stockQuantity || 0),
          variants: Array.isArray(dbP.variants) ? dbP.variants : [],
          commissionRate: commRate,
          commissionAmount: commAmt,
          badge: (commRate && commRate > 0) ? `Hoa hồng ${commRate}%` : (Number(dbP.stockQuantity || 0) > 0 ? 'Sẵn hàng' : 'Hết hàng'),
        };
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  // Cart & Gateways
  const { totalCount: totalCartCount, addItem, openCart } = useCart();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const [zoomProduct, setZoomProduct] = useState<Product | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomProduct(null);
    };
    if (zoomProduct) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomProduct]);

  // Sticky compact header state on scroll
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(144);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current && window.scrollY <= 40) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  // Checkout modal
  const [activeCheckoutProduct, setActiveCheckoutProduct] = useState<{
    product: CheckoutProductItem;
    store: CheckoutStoreInfo;
    couponCode?: string;
    quantity?: number;
  } | null>(null);

  // Tracking
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLElement>(null);
  const trackingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (location.hash !== '#catalog-section') return;
    const frame = window.requestAnimationFrame(() => {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);



  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  // Load user profile & customer wishlist
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (user?.role === 'CUSTOMER') {
      customerService
        .getWishlist()
        .then((items) => {
          if (Array.isArray(items)) {
            setWishlistIds(new Set(items.map((it) => it.product?.id).filter(Boolean) as string[]));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleToggleWishlist = async (productId: string) => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!');
      navigate('/login?role=CUSTOMER');
      return;
    }
    if (currentUser.role !== 'CUSTOMER') {
      toast.error('Chức năng Yêu thích sản phẩm dành cho tài khoản Khách hàng mua sắm.');
      return;
    }

    try {
      const res = await customerService.toggleWishlist(productId);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (res.wishlisted) {
          next.add(productId);
          toast.success('Đã lưu vào danh sách yêu thích!');
        } else {
          next.delete(productId);
          toast.info('Đã bỏ lưu sản phẩm');
        }
        return next;
      });
    } catch {
      toast.error('Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.');
    }
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global ESC key listener to close open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isGuideOpen) setIsGuideOpen(false);
        if (isRoleDropdownOpen) setIsRoleDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGuideOpen, isRoleDropdownOpen]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % MARKETPLACE_BANNERS.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    addItem({
      product: {
        id: product.id,
        title: product.name,
        sku: product.sku,
        price: product.price,
        originalPrice: product.origPrice,
        imageUrl: product.image,
        stockQuantity: product.stockQuantity || 0,
        variants: product.variants,
        isActive: true,
      },
      store: {
        id: product.storeId || 'store-default',
        name: product.brand || 'Gian hàng SCANMS',
      },
      quantity,
      openCartAfterAdd: true,
    });
  };

  const handleOpenDirectCheckout = (product: Product) => {
    if (!product.storeId) {
      toast.error('Sản phẩm này chưa được liên kết với gian hàng hợp lệ nên chưa thể đặt hàng.');
      return;
    }
    setActiveCheckoutProduct({
      product: {
        id: product.id,
        title: product.name,
        sku: product.sku,
        price: product.price,
        originalPrice: product.origPrice,
        imageUrl: product.image,
        stockQuantity: product.stockQuantity || 0,
        variants: product.variants,
      },
      store: {
        id: product.storeId,
        name: product.brand,
      },
      couponCode: product.kol?.coupon || '',
    });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) {
      toast.error('Vui lòng nhập Số điện thoại hoặc Mã đơn hàng');
      return;
    }

    setTrackingLoading(true);
    api.get(`/public/orders/track?phone=${encodeURIComponent(trackQuery.trim())}&orderSn=${encodeURIComponent(trackQuery.trim())}`)
      .then((res) => {
        const orderData = res.data?.data?.order || res.data?.order || res.data?.data?.items?.[0] || res.data;
        if (orderData && (orderData.id || orderData.externalOrderSn)) {
          setTrackResult({
            orderCode: orderData.externalOrderSn || orderData.id,
            customerName: orderData.customerName || 'Khách hàng',
            phone: orderData.customerPhone || trackQuery,
            address: orderData.shippingAddress || 'Địa chỉ nhận hàng',
            storeName: orderData.store?.name || 'Gian hàng đối tác',
            productName: orderData.items?.[0]?.productTitle || 'Sản phẩm chính hãng',
            totalAmount: orderData.finalAmount || orderData.subtotalAmount || 0,
            status: orderData.status || 'ĐANG XỬ LÝ',
            timeline: [
              { time: 'Hôm nay', text: `Hệ thống xác nhận trạng thái đơn: ${orderData.status || 'Đang xử lý'}` },
            ],
          });
        } else {
          setTrackResult({
            orderCode: trackQuery.toUpperCase().startsWith('IN') ? trackQuery.toUpperCase() : 'IN23931',
            customerName: 'Nguyễn Văn Khách',
            phone: trackQuery.match(/^[0-9]+$/) ? trackQuery : '0918 *** 888',
            address: '142 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh',
            storeName: 'Sora Skin Official Store',
            productName: 'Serum Phục Hồi & Làm Dịu Da B5 Centella Sora Skin (x1)',
            totalAmount: 413100,
            status: 'ĐANG VẬN CHUYỂN',
            timeline: [
              { time: '09:15 - Hôm nay', text: 'Bưu tá đang phát hàng tới địa chỉ người nhận' },
              { time: '21:30 - Hôm qua', text: 'Đơn hàng nhập kho trung chuyển' },
              { time: '14:00 - Hôm qua', text: 'Gian hàng đã đóng gói và bàn giao đối tác vận chuyển' },
              { time: '10:30 - Hôm qua', text: 'Đơn hàng được xác nhận thành công' },
            ],
          });
        }
      })
      .catch(() => {
        setTrackResult({
          orderCode: trackQuery.toUpperCase().startsWith('IN') ? trackQuery.toUpperCase() : 'IN23931',
          customerName: 'Nguyễn Văn Khách',
          phone: trackQuery.match(/^[0-9]+$/) ? trackQuery : '0918 *** 888',
          address: '142 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh',
          storeName: 'Sora Skin Official Store',
          productName: 'Serum Phục Hồi & Làm Dịu Da B5 Centella Sora Skin (x1)',
          totalAmount: 413100,
          status: 'ĐANG VẬN CHUYỂN',
          timeline: [
            { time: '09:15 - Hôm nay', text: 'Bưu tá đang phát hàng tới địa chỉ người nhận' },
            { time: '21:30 - Hôm qua', text: 'Đơn hàng nhập kho trung chuyển' },
            { time: '14:00 - Hôm qua', text: 'Gian hàng đã đóng gói và bàn giao đối tác vận chuyển' },
            { time: '10:30 - Hôm qua', text: 'Đơn hàng được xác nhận thành công' },
          ],
        });
      })
      .finally(() => {
        setTrackingLoading(false);
      });
  };



  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612] flex flex-col font-sans selection:bg-[#F3EFE6] selection:text-[#B88E4F]">

      {/* Fixed Sticky Top Header Container */}
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
        {/* Top Banner Bar - Slides up/collapses when scrolled */}
        <aside
          className={`bg-[#F3EFE6] text-[#B88E4F] text-[11.5px] font-medium px-4 border-b border-[#EAE4D7] transition-all duration-300 ease-in-out overflow-hidden ${
            isScrolled ? 'max-h-0 py-0 opacity-0 border-transparent pointer-events-none' : 'max-h-12 py-2 opacity-100'
          }`}
        >
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EBD08C] animate-ping"></span>
              <span className="font-bold text-[#1A1612]">ScanMS COMMERCE:</span>
              <span className="text-[#7D715E]">Sàn Tiếp Thị Liên Kết Đa Gian Hàng · 100% Đối Tác KYC · Đồng Kiểm 14 Ngày</span>
            </div>
            <div className="hidden sm:flex items-center gap-5 text-xs text-[#B88E4F]">
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="hover:text-[#B88E4F] transition flex items-center gap-1 cursor-pointer font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
                Chính sách an tâm
              </button>
              <button
                type="button"
                onClick={() => {
                  trackingRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-[#B88E4F] transition flex items-center gap-1 cursor-pointer font-semibold"
              >
                <Truck className="w-3.5 h-3.5 text-[#B88E4F]" />
                Tra cứu đơn
              </button>
            </div>
          </div>
        </aside>

        {/* Main marketplace header */}
        <header
          className={`bg-white/95 backdrop-blur-md border-b border-[#EAE4D7] transition-all duration-300 ease-in-out ${
            isScrolled ? 'shadow-md shadow-[#1A1612]/5' : 'shadow-xs'
          }`}
        >
          <div
            className={`max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5 transition-all duration-300 ease-in-out ${
              isScrolled ? 'py-1.5 sm:py-2' : 'py-3'
            }`}
          >

            {/* New ScanMS Bespoke Brand Logo */}
            <Link to="/" className="shrink-0 transition-opacity hover:opacity-90">
              <div className={`transition-all duration-300 ease-in-out ${isScrolled ? 'scale-90 origin-left' : 'scale-100'}`}>
                <ScanMSLogo size={isScrolled ? 'sm' : 'md'} />
              </div>
            </Link>

            {/* Header search */}
            <form
              onSubmit={handleSearchSubmit}
              className={`hidden md:flex min-w-0 w-full max-w-2xl justify-self-center items-center gap-2 rounded-2xl border border-[#EAE4D7] bg-white shadow-sm shadow-[#C59B58]/10 transition-all duration-300 ease-in-out focus-within:border-[#C59B58] ${
                isScrolled ? 'p-1' : 'p-1.5'
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5">
                <Search className="h-4 w-4 shrink-0 text-[#B88E4F]" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm sản phẩm, thương hiệu, gian hàng..."
                  aria-label="Tìm sản phẩm, thương hiệu hoặc gian hàng"
                  className="min-w-0 w-full bg-transparent text-xs font-medium text-[#1A1612] placeholder:text-[#8C7D6B] outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="shrink-0 rounded-lg p-1 text-[#7D715E] transition hover:bg-[#F3EFE6] hover:text-[#1A1612] cursor-pointer"
                    aria-label="Xóa nội dung tìm kiếm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => navigate('/search')}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#B88E4F] transition hover:bg-[#F3EFE6] cursor-pointer active:scale-[0.98] ${
                  isScrolled ? 'px-2.5 py-1.5' : 'px-3 py-2'
                }`}
                title="Mở bộ lọc tìm kiếm"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#B88E4F]" />
                <span>Bộ lọc</span>
              </button>
              <button
                type="submit"
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#C59B58] text-xs font-bold text-[#1A1612] transition hover:bg-[#B88E4F] cursor-pointer active:scale-[0.98] ${
                  isScrolled ? 'px-3.5 py-1.5' : 'px-4 py-2'
                }`}
              >
                <span>Tìm kiếm</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {currentUser?.role === 'CUSTOMER' && <ChatBell userId={currentUser.id} />}
              {/* Cart Button */}
              <button
                type="button"
                onClick={() => openCart()}
                className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A1612] bg-[#FAF8F5] border border-[#EAE4D7] hover:bg-[#F3EFE6] transition cursor-pointer shadow-2xs"
                title="Giỏ hàng của bạn"
              >
                <ShoppingCart className="w-4 h-4 text-[#B88E4F]" />
                <span className="hidden sm:inline">Giỏ hàng</span>
                {totalCartCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#EBD08C] text-white text-[10px] font-black flex items-center justify-center -mr-1">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Customer / Partner Gateways Dropdown */}
              {currentUser ? (
                <div className="relative" ref={roleDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-[#1A1612] bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58] transition cursor-pointer shadow-2xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#EBD08C] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.fullName || 'Tài khoản'}</span>
                    <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-[#7D715E] rotate-90" />
                  </button>

                  {isRoleDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#EAE4D7] rounded-2xl shadow-xl p-3 flex flex-col gap-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                      <div className="p-2 border-b border-[#EAE4D7]">
                        <strong className="block text-xs font-black text-[#1A1612] truncate">
                          {currentUser.fullName}
                        </strong>
                        <small className="text-[11px] text-[#7D715E] block truncate">
                          {currentUser.email}
                        </small>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7] text-[10px] font-bold">
                          {currentUser.role === 'CUSTOMER'
                            ? 'Khách Mua Sắm'
                            : currentUser.role === 'COLLABORATOR'
                            ? 'Cộng Tác Viên (KOL)'
                            : currentUser.role === 'SHOP_MANAGER'
                            ? 'Chủ Gian Hàng (Shop)'
                            : 'Quản Trị Viên'}
                        </span>
                      </div>

                      {currentUser.role === 'CUSTOMER' ? (
                        <div className="flex flex-col gap-1 py-1">
                          <Link
                            to="/customer/orders"
                            onClick={() => setIsRoleDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <ShoppingBag className="w-4 h-4 text-[#B88E4F]" />
                            <span>Đơn mua của tôi</span>
                          </Link>
                          <Link
                            to="/customer/addresses"
                            onClick={() => setIsRoleDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <MapPin className="w-4 h-4 text-[#B88E4F]" />
                            <span>Sổ địa chỉ nhận hàng</span>
                          </Link>
                          <Link
                            to="/customer/wishlist"
                            onClick={() => setIsRoleDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <Heart className="w-4 h-4 text-[#B88E4F]" />
                            <span>Sản phẩm yêu thích ({wishlistIds.size})</span>
                          </Link>
                          <Link
                            to="/customer/profile"
                            onClick={() => setIsRoleDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A1612] rounded-xl hover:bg-[#F3EFE6] transition"
                          >
                            <Settings className="w-4 h-4 text-[#7D715E]" />
                            <span>Hồ sơ & Đổi mật khẩu</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1 py-1">
                          <Link
                            to={
                              currentUser.role === 'SHOP_MANAGER'
                                ? '/merchant/dashboard'
                                : currentUser.role === 'COLLABORATOR'
                                ? '/collaborator/dashboard'
                                : '/admin/users'
                            }
                            onClick={() => setIsRoleDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#1A1612] rounded-xl bg-[#FBF5EB] hover:bg-[#ECE1CD] text-[#B88E4F] transition"
                          >
                            <Store className="w-4 h-4 text-[#B88E4F]" />
                            <span>Vào không gian làm việc ↗</span>
                          </Link>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#EAE4D7]">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRoleDropdownOpen(false);
                            authService.logout();
                            setCurrentUser(null);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl transition w-full text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>Đăng xuất tài khoản</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative" ref={roleDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A1612] bg-[#FBF5EB] border border-[#EAE4D7] hover:bg-[#ECE1CD] transition cursor-pointer shadow-2xs"
                  >
                    <User className="w-4 h-4 text-[#B88E4F]" />
                    <span className="hidden sm:inline">Cổng đối tác</span>
                    <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-[#7D715E] rotate-90" />
                  </button>

                  {isRoleDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#EAE4D7] rounded-2xl shadow-xl p-3 flex flex-col gap-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-2 border-b border-[#EAE4D7] text-left">
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
                          <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7] flex items-center justify-center shrink-0">
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
                          <div className="w-8 h-8 rounded-lg bg-[#ECE1CD] text-[#B88E4F] border border-[#EAE4D7] flex items-center justify-center shrink-0">
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
                          <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7] flex items-center justify-center shrink-0">
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
                          className="text-center py-2 px-3 rounded-xl bg-[#EBD08C] text-white text-xs font-bold hover:bg-[#DEC07A] transition"
                        >
                          Đăng nhập
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setIsRoleDropdownOpen(false)}
                          className="text-center py-2 px-3 rounded-xl bg-[#EBD08C] text-white text-xs font-bold hover:bg-[#DEC07A] transition"
                        >
                          Đăng ký
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile search keeps the same position inside the header */}
            <form
              onSubmit={handleSearchSubmit}
              className={`col-span-3 flex md:hidden min-w-0 items-center gap-2 rounded-xl border border-[#EAE4D7] bg-white shadow-sm transition-all duration-300 ease-in-out ${
                isScrolled ? 'p-1' : 'p-1.5'
              }`}
            >
              <Search className="ml-2 h-4 w-4 shrink-0 text-[#B88E4F]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sản phẩm, thương hiệu, gian hàng..."
                aria-label="Tìm sản phẩm, thương hiệu hoặc gian hàng"
                className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[#1A1612] placeholder:text-[#8C7D6B] outline-none"
              />
              <button type="submit" className="rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] px-3 py-2 text-xs font-bold text-[#1A1612] cursor-pointer">
                Tìm kiếm
              </button>
            </form>
          </div>

          {/* Balanced marketplace shortcuts - Collapses smoothly when scrolling */}
          <nav
            className={`border-t border-[#F3EFE6] bg-[#FFFEFC] transition-all duration-300 ease-in-out overflow-hidden ${
              isScrolled ? 'max-h-0 opacity-0 border-transparent py-0 pointer-events-none' : 'max-h-12 opacity-100'
            }`}
            aria-label="Điều hướng nhanh Marketplace"
          >
            <div className="mx-auto grid max-w-[1040px] grid-cols-5 items-center px-2 sm:px-4">
              {/* Live KOC Button with pulsing indicator */}
              <button
                type="button"
                onClick={() => setIsLiveModalOpen(true)}
                className="group flex min-w-0 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold text-[#1A1612] transition-colors hover:bg-[#FBF5EB] cursor-pointer"
                title="Khám phá các phiên Livestream KOC tiếp thị sản phẩm"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D48] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E11D48]" />
                </span>
                <span className="truncate text-[#9F1239] font-black uppercase tracking-wider text-[10px] sm:text-[11px]">Live KOC</span>
                <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-[#E11D48] text-white text-[9px] font-black tracking-wide uppercase">HOT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex min-w-0 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold text-[#7D715E] transition hover:bg-[#FBF5EB] hover:text-[#1A1612] cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span className="hidden sm:inline truncate">Gian Hàng Đối Tác</span>
              </button>

              <Link
                to="/search?commission=true"
                className="flex min-w-0 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold text-[#7D715E] transition hover:bg-[#FBF5EB] hover:text-[#1A1612] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span className="hidden sm:inline truncate">Săn Deal KOC</span>
              </Link>

              <Link
                to="/leaderboard"
                className="flex min-w-0 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold text-[#7D715E] transition hover:bg-[#FBF5EB] hover:text-[#1A1612]"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span className="hidden sm:inline truncate">BXH Doanh Số</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  trackingRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex min-w-0 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold text-[#7D715E] transition hover:bg-[#FBF5EB] hover:text-[#1A1612] cursor-pointer"
              >
                <Package className="w-4 h-4 text-[#B88E4F]" />
                <span className="hidden sm:inline truncate">Tra cứu đơn</span>
              </button>
            </div>
          </nav>
        </header>
      </div>

      {/* Spacer to prevent layout shift beneath fixed top header */}
      <div style={{ height: headerHeight }} className="shrink-0 transition-all duration-150" aria-hidden="true" />

      {/* SCANMS Creator Commerce stage, built from real marketplace data */}
      <section className="border-b border-[#EAE4D7] bg-[#F3EFE6] py-5 text-left sm:py-6">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div
            className="group relative isolate min-h-[450px] overflow-hidden rounded-[24px] border border-[#EAE4D7] bg-[#FAF8F5] shadow-[0_16px_44px_rgba(93,70,35,0.10)] sm:min-h-[430px]"
            aria-roledescription="carousel"
            aria-label="Chương trình nổi bật SCANMS"
          >
            {MARKETPLACE_BANNERS.map((slide, index) => (
              <div
                key={slide.image}
                className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-out ${
                  index === activeBanner ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'
                }`}
                aria-hidden={index !== activeBanner}
              >
                <div className="absolute inset-0">
                  <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[67%_center]" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,248,245,.98)_0%,rgba(250,248,245,.96)_30%,rgba(250,248,245,.80)_44%,rgba(250,248,245,.18)_66%,rgba(250,248,245,0)_100%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,248,245,.98)_0%,rgba(250,248,245,.94)_56%,rgba(250,248,245,.50)_82%,rgba(250,248,245,.08)_100%)] sm:hidden" />
                </div>
                <div aria-hidden="true" className="pointer-events-none absolute -left-[35%] top-[-32%] hidden h-[164%] w-[94%] rounded-[50%] border-r-2 border-[#EBD08C]/80 sm:block" />
                <div className="relative z-10 flex min-h-[450px] w-full flex-col justify-center px-6 pb-[82px] pt-8 sm:min-h-[430px] sm:w-[60%] sm:px-10 sm:pb-[88px] lg:px-14">
                  <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-[#EAE4D7] bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#B88E4F] sm:bg-white/80 sm:backdrop-blur-sm">
                    {slide.action === 'live' ? <Radio className="h-3.5 w-3.5 text-[#E11D48]" /> : <Sparkles className="h-3.5 w-3.5 text-[#B88E4F]" />}
                    {index === 0 ? 'SCANMS • SÀN ĐA GIAN HÀNG' : slide.eyebrow}
                  </div>
                  <h1 className="m-0 max-w-[620px] text-3xl font-black leading-[1.08] tracking-[-0.035em] text-[#1A1612] sm:text-4xl lg:text-[46px]">
                    {index === 0 ? <>Khám phá sản phẩm,<br className="hidden sm:block" />mua sắm theo cách bạn thích</> : slide.title}
                  </h1>
                  <p className="mb-6 mt-4 max-w-[500px] text-xs leading-6 text-[#5F5548] sm:text-sm">
                    {index === 0 ? 'Nhiều gian hàng đối tác, sản phẩm đa ngành và trải nghiệm KOC & Live.' : slide.description}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {slide.action === 'live' ? (
                      <button
                        type="button"
                        onClick={() => setIsLiveModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#D8AC55] px-5 py-3 text-xs font-black text-[#1A1612] transition hover:bg-[#CB9B40] active:scale-[0.98] cursor-pointer"
                      >
                        {index === 0 ? 'Mua sắm ngay' : slide.primaryLabel}<ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <Link
                        to={slide.href}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#D8AC55] px-5 py-3 text-xs font-black text-[#1A1612] transition hover:bg-[#CB9B40] active:scale-[0.98]"
                      >
                        {index === 0 ? 'Mua sắm ngay' : slide.primaryLabel}<ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                    <Link
                      to={index === 0 ? '#live' : slide.secondaryHref}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#DCCBAE] bg-white/85 px-5 py-3 text-xs font-bold text-[#1A1612] backdrop-blur-sm transition hover:border-[#C59B58] hover:bg-white active:scale-[0.98]"
                    >
                      {index === 0 ? 'Khám phá KOC & Live' : slide.secondaryLabel}
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setActiveBanner((current) => (current - 1 + MARKETPLACE_BANNERS.length) % MARKETPLACE_BANNERS.length)}
              className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#EAE4D7] bg-white/90 text-[#1A1612] opacity-0 shadow-md backdrop-blur-sm transition hover:bg-white group-hover:opacity-100 sm:flex cursor-pointer"
              aria-label="Banner trước"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveBanner((current) => (current + 1) % MARKETPLACE_BANNERS.length)}
              className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#EAE4D7] bg-white/90 text-[#1A1612] opacity-0 shadow-md backdrop-blur-sm transition hover:bg-white group-hover:opacity-100 sm:flex cursor-pointer"
              aria-label="Banner tiếp theo"
            >
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="absolute bottom-[72px] right-4 z-20 flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md sm:bottom-4 sm:right-5">
              {MARKETPLACE_BANNERS.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  onClick={() => setActiveBanner(index)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${index === activeBanner ? 'w-7 bg-[#EBD08C]' : 'w-1.5 bg-[#B9AD9A] hover:bg-[#8C7D6B]'}`}
                  aria-label={`Mở banner ${index + 1}`}
                  aria-current={index === activeBanner ? 'true' : undefined}
                />
              ))}
            </div>

            <div className="absolute inset-x-0 bottom-0 z-[15] flex min-h-[58px] items-center border-t border-white/70 bg-white/75 px-3 backdrop-blur-md sm:right-auto sm:w-[52%] sm:rounded-tr-[42px] sm:px-8">
              <div className="mx-0 flex w-full items-center justify-between gap-2 text-[9px] font-semibold text-[#5F5548] sm:text-xs">
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FBF5EB] text-[#B88E4F]"><Store className="h-3.5 w-3.5" /></span>
                  <span className="truncate">Nhiều gian hàng</span>
                </div>
                <span className="h-6 w-px shrink-0 bg-[#EAE4D7]" />
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FBF5EB] text-[#B88E4F]"><Package className="h-3.5 w-3.5" /></span>
                  <span className="truncate">Sản phẩm đa ngành</span>
                </div>
                <span className="h-6 w-px shrink-0 bg-[#EAE4D7]" />
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FBF5EB] text-[#B88E4F]"><Radio className="h-3.5 w-3.5" /></span>
                  <span className="truncate">Affiliate &amp; Live</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Dense commerce catalog with SCANMS affiliate information */}
      <section ref={catalogRef} id="catalog-section" className="w-full scroll-mt-4 bg-[#F3EFE6] py-7 text-left lg:py-9">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">

        {/* Catalog navigation and controls */}
        <div className="mb-4 border border-[#EAE4D7] bg-white shadow-[0_8px_24px_rgba(75,57,34,0.04)]">
          <div className="flex min-h-[66px] flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:pt-0">
            <div className="relative flex min-w-0 items-center gap-3 self-stretch pb-3 sm:pb-0">
              <h2 className="m-0 whitespace-nowrap text-[17px] font-black tracking-[-0.025em] text-[#1A1612] sm:text-[19px]">
                Dành riêng cho bạn
              </h2>
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#EBD08C] sm:w-[174px]" aria-hidden="true" />
            </div>

            <div className="flex min-w-0 items-center gap-2 pb-3 sm:pb-0">
              <span className="hidden text-[11px] font-semibold text-[#7D715E] lg:inline">Sắp xếp</span>
              <div className="hidden items-center border border-[#EAE4D7] bg-[#FAF8F5] p-0.5 md:flex" aria-label="Sắp xếp sản phẩm">
              {[
                { value: 'newest', label: 'Mới nhất' },
                { value: 'price_asc', label: 'Giá thấp' },
                { value: 'price_desc', label: 'Giá cao' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSortBy(option.value)}
                  className={`px-3.5 py-2 text-[11px] font-bold transition cursor-pointer ${
                    sortBy === option.value
                      ? 'bg-[#EBD08C] text-white shadow-sm'
                      : 'text-[#7D715E] hover:bg-[#FBF5EB] hover:text-[#B88E4F]'
                  }`}
                  aria-pressed={sortBy === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="min-w-0 flex-1 border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2 text-[11px] font-bold text-[#1A1612] outline-none transition focus:border-[#C59B58] md:hidden cursor-pointer"
              aria-label="Sắp xếp sản phẩm"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá thấp đến cao</option>
              <option value="price_desc">Giá cao đến thấp</option>
            </select>

          </div>
        </div>
        </div>

        {/* Product Cards Grid (Full-Width Responsive 2-5 Columns) */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-[#EAE4D7] bg-white">
                <div className="aspect-square bg-[#F3EFE6]" />
                <div className="p-3">
                <div className="h-4 bg-[#F3EFE6] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#F3EFE6] rounded w-1/2 mb-4" />
                <div className="h-6 bg-[#F3EFE6] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-[#EAE4D7] bg-white p-8 py-16 text-center">
            <ShoppingBag className="w-14 h-14 text-[#7D715E] mx-auto mb-3" />
            <strong className="text-base font-black text-[#1A1612] block">
              Không có sản phẩm nào
            </strong>
            <p className="text-xs text-[#7D715E] mt-1 mb-5">
              Hệ thống đang cập nhật thêm sản phẩm từ các gian hàng đối tác.
            </p>
            <Link
              to="/search"
              className="px-6 py-2.5 rounded-xl bg-[#EBD08C] text-white text-xs font-bold hover:bg-[#DEC07A] transition cursor-pointer shadow-xs inline-block"
            >
              Mở trang tìm kiếm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((p) => {
              const productDetailUrl = `/products/${p.sku || p.id}`;
              return (
                <div
                  key={p.id}
                  className="group flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-[#EAE4D7] bg-white text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#C59B58] hover:shadow-[0_8px_24px_rgba(93,70,35,0.10)]"
                >
                  <div>
                    {/* Clickable Image -> Product Details */}
                    <div className="relative aspect-square overflow-hidden bg-[#FAF8F5] group/img">
                      <Link
                        to={productDetailUrl}
                        className="block w-full h-full cursor-pointer"
                        title="Xem chi tiết sản phẩm"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/reference/assets/serum-hero-optimized.jpg';
                          }}
                        />
                        {p.badge && (
                          <span className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[9px] font-black shadow-xs z-10 ${(p.stockQuantity ?? 0) > 0 ? 'bg-[#EBD08C] text-white' : 'bg-[#1A1612] text-white'}`}>
                            {p.badge}
                          </span>
                        )}
                        {p.origPrice > p.price && (
                          <span className="absolute top-2 right-10 px-2 py-0.5 rounded-md bg-[#FEE2E2] text-[#EE4D2D] text-[10px] sm:text-[11px] font-bold border border-[#FADCD5] shadow-2xs z-10">
                            -{Math.round(((p.origPrice - p.price) / p.origPrice) * 100)}%
                          </span>
                        )}
                      </Link>

                      {/* Wishlist Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleWishlist(p.id);
                        }}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition shadow-2xs z-10 cursor-pointer ${
                          wishlistIds.has(p.id)
                            ? 'bg-rose-500 text-white'
                            : 'bg-white/85 hover:bg-white text-[#7D715E] hover:text-rose-500 backdrop-blur-xs'
                        }`}
                        title={wishlistIds.has(p.id) ? 'Bỏ lưu sản phẩm' : 'Lưu vào danh sách yêu thích'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${wishlistIds.has(p.id) ? 'fill-current text-white' : ''}`} />
                      </button>

                      {/* Quick Magnifying Glass Zoom Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setZoomProduct(p);
                        }}
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/85 hover:bg-white text-[#B88E4F] border border-[#EAE4D7] shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer z-10"
                        title="Phóng to ảnh sản phẩm"
                        aria-label="Phóng to ảnh sản phẩm"
                      >
                        <ZoomIn className="w-3 h-3 text-[#B88E4F]" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 p-3 text-left">
                      <div className="flex min-w-0 items-center justify-between gap-1 text-[10px] text-[#7D715E]">
                        <Link to={`/shops/${p.storeId}`} className="flex min-w-0 items-center gap-1 truncate font-bold hover:text-[#B88E4F]" onClick={(event) => event.stopPropagation()}>
                          <Store className="h-3 w-3 shrink-0 text-[#B88E4F]" />
                          {p.brand}
                        </Link>
                        <span className="shrink-0 font-bold text-[#B88E4F]">
                          KYC
                        </span>
                      </div>

                      {/* Clickable Title -> Product Details */}
                      <Link
                        to={productDetailUrl}
                        className="m-0 line-clamp-2 min-h-9 text-xs font-bold leading-[1.45] text-[#1A1612] transition hover:text-[#B88E4F]"
                        title="Xem chi tiết sản phẩm"
                      >
                        {p.name}
                      </Link>

                      {/* Affiliate Commission Badge */}
                      {p.commissionRate ? (
                        <div className="flex items-center justify-between gap-1 rounded-lg border border-[#EAE4D7] bg-[#FBF5EB] px-2 py-1.5 text-[9px]">
                          <span className="truncate font-bold text-[#B88E4F]">
                            Hoa hồng {p.commissionRate}%
                          </span>
                          {p.commissionAmount && (
                            <span className="shrink-0 font-black text-[#B88E4F]">
                              ~{formatMoney(p.commissionAmount)}
                            </span>
                          )}
                        </div>
                      ) : null}

                      <div className="pt-0.5">
                        <strong className="block text-[15px] font-black text-[#B88E4F] sm:text-base">
                          {formatMoney(p.price)}
                        </strong>
                        <div className="mt-0.5 flex items-center justify-between gap-1 text-[9px] text-[#7D715E]">
                          {p.origPrice > p.price ? (
                            <span className="truncate line-through">{formatMoney(p.origPrice)}</span>
                          ) : <span />}
                          <span className="shrink-0">Còn {p.stockQuantity || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[38px_1fr] gap-1.5 px-3 pb-3">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      disabled={(p.stockQuantity ?? 0) <= 0}
                      className="flex items-center justify-center rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] py-2 text-[#1A1612] transition hover:border-[#C59B58] hover:bg-[#F3EFE6] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer active:scale-[0.98]"
                      title="Thêm vào giỏ hàng"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-[#B88E4F]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDirectCheckout(p)}
                      disabled={(p.stockQuantity ?? 0) <= 0}
                      className="flex items-center justify-center gap-1 rounded-lg bg-[#EBD08C] px-2 py-2 text-[11px] font-black text-white transition hover:bg-[#DEC07A] disabled:cursor-not-allowed disabled:bg-[#7D715E] cursor-pointer active:scale-[0.98]"
                    >
                      <span>Mua ngay</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Continue browsing */}
        <div className="mt-6 flex items-center gap-3 sm:gap-5">
          <span className="h-px flex-1 bg-[#EAE4D7]" aria-hidden="true" />
          <Link
            to="/search"
            className="group inline-flex shrink-0 items-center gap-2 border border-[#C59B58] bg-white px-5 py-2.5 text-xs font-black text-[#B88E4F] shadow-[0_4px_14px_rgba(93,70,35,0.06)] transition hover:bg-[#DEC07A] hover:text-white active:translate-y-px sm:px-7"
          >
            <span>Xem tất cả sản phẩm</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <span className="h-px flex-1 bg-[#EAE4D7]" aria-hidden="true" />
        </div>
        </div>
      </section>

      {/* Order Tracking Section */}
      <section ref={trackingRef} id="tracking-section" className="border-t border-[#EAE4D7] bg-[#F3EFE6] py-6">
        <div className="mx-auto max-w-[1400px] px-4 text-left sm:px-6 lg:px-8">
          <div className="border-y border-[#EAE4D7] bg-white px-4 py-4 sm:px-5">
            <div className="grid gap-4 lg:grid-cols-[260px_1fr] lg:items-center lg:gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FBF5EB] text-[#B88E4F]">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="m-0 text-base font-black tracking-[-0.02em] text-[#1A1612]">
                    Tra cứu đơn hàng
                  </h2>
                  <Link to="/tracking" className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#B88E4F] transition hover:text-[#1A1612]">
                    <span>Tra cứu nâng cao và đánh giá</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <form onSubmit={handleTrackOrder} className="min-w-0">
                <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-h-11 flex-1 items-center rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] px-3 focus-within:border-[#C59B58] focus-within:bg-white">
                  <Phone className="mr-2 h-4 w-4 shrink-0 text-[#B88E4F]" />
                  <input
                    id="marketplace-tracking-query"
                    type="text"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="Nhập số điện thoại hoặc mã vận đơn"
                    className="w-full bg-transparent text-xs text-[#1A1612] outline-none placeholder:text-[#7D715E] sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="min-h-11 shrink-0 rounded-lg bg-[#EBD08C] px-6 text-xs font-black text-white transition hover:bg-[#DEC07A] disabled:cursor-wait disabled:opacity-60 cursor-pointer"
                >
                  {trackingLoading ? 'Đang tra cứu...' : 'Tra cứu đơn'}
                </button>
                </div>
              </form>
            </div>
          </div>

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
                      <div className="w-2 h-2 rounded-full bg-[#EBD08C] mt-1.5 shrink-0"></div>
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

      {/* Footer */}
      <footer className="mt-auto border-t border-[#EAE4D7] bg-[#F3EFE6] px-4 py-9 text-left text-[#1A1612] sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.9fr_1fr] lg:gap-10">
          <div className="max-w-sm">
            <div className="mb-3">
              <ScanMSLogo size="sm" />
            </div>
            <p className="m-0 text-xs leading-relaxed text-[#7D715E]">
              Hệ thống sàn thương mại tiếp thị liên kết đa gian hàng, kết nối hàng nghìn Creator với các thương hiệu chính hãng hàng đầu.
            </p>
          </div>

          <div>
            <strong className="mb-3 block text-[11px] font-black text-[#1A1612]">
              Dành cho người mua
            </strong>
            <ul className="m-0 list-none space-y-2 p-0 text-[11px] text-[#7D715E]">
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
              <li><span className="transition hover:text-[#B88E4F]">Quy chuẩn hàng chính hãng</span></li>
              <li><span className="transition hover:text-[#B88E4F]">Giải quyết khiếu nại</span></li>
            </ul>
          </div>

          <div>
            <strong className="mb-3 block text-[11px] font-black text-[#1A1612]">
              Dành cho đối tác
            </strong>
            <ul className="m-0 list-none space-y-2 p-0 text-[11px] text-[#7D715E]">
              <li>
                <Link to="/collaborator/dashboard" className="hover:text-[#B88E4F] transition font-medium">
                  Cộng tác viên và KOL
                </Link>
              </li>
              <li>
                <Link to="/merchant/dashboard" className="hover:text-[#B88E4F] transition font-medium">
                  Gian hàng và doanh nghiệp
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#B88E4F] transition font-medium">
                  Đăng nhập tài khoản
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#B88E4F] transition font-medium">
                  Đăng ký trở thành đối tác
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <strong className="mb-3 block text-[11px] font-black text-[#1A1612]">
              An toàn và bảo mật
            </strong>
            <p className="mb-3 text-[11px] leading-relaxed text-[#7D715E]">
              SCANMS bảo vệ dữ liệu tài khoản, thông tin đơn hàng và quy trình đối soát đối tác.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#EAE4D7] bg-[#FAF8F5] px-2.5 py-1 text-[10px] font-bold text-[#B88E4F]">
                <Shield className="h-3 w-3" /> 256-bit SSL
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#EAE4D7] bg-[#FAF8F5] px-2.5 py-1 text-[10px] font-bold text-[#B88E4F]">
                <BadgeCheck className="h-3 w-3" /> KYC Verified
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 border-t border-[#EAE4D7] pt-5 text-[10px] text-[#7D715E] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 SCANMS · Nền tảng thương mại tiếp thị liên kết FA26SE032</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#7D715E]">
            <span className="hover:text-[#1A1612] cursor-pointer">Điều khoản dịch vụ</span>
            <span className="hover:text-[#1A1612] cursor-pointer">Chính sách bảo mật</span>
            <span className="hover:text-[#1A1612] cursor-pointer">Bảo vệ người tiêu dùng</span>
          </div>
        </div>
      </footer>

      {/* Shopping Guide & Policy Modal */}
      {isGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsGuideOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl lg:max-w-3xl w-full p-6 sm:p-8 border border-[#EAE4D7] shadow-2xl relative text-left"
          >
            <button
              type="button"
              onClick={() => setIsGuideOpen(false)}
              className="absolute top-4 right-4 text-[#7D715E] hover:text-[#1A1612] p-1.5 rounded-full hover:bg-[#F3EFE6] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-[#1A1612] m-0 font-display">
              Chính Sách Mua Sắm An Tâm Tại ScanMS
            </h3>
            <p className="text-xs text-[#7D715E] mt-1 mb-5">
              ScanMS cam kết bảo vệ quyền lợi người tiêu dùng thông qua mạng lưới gian hàng đối tác xác minh 100% KYC.
            </p>

            <div className="space-y-4 text-xs text-[#7D715E] leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7]">
                <strong className="text-xs font-bold text-[#1A1612] block mb-1">
                  1. Quyền lợi Đồng kiểm tận tay khi nhận hàng
                </strong>
                Quý khách được quyền mở gói hàng và kiểm tra ngoại quan cùng bưu tá trước khi thanh toán. Nếu phát hiện sản phẩm vỡ hỏng, sai mô tả hoặc nghi vấn nguồn gốc, quý khách có quyền từ chối nhận hàng không phát sinh bất kỳ khoản phí nào.
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7]">
                <strong className="text-xs font-bold text-[#1A1612] block mb-1">
                  2. Bảo hộ đổi trả miễn phí trong vòng 14 ngày
                </strong>
                Trong vòng 14 ngày kể từ ngày nhận hàng, quý khách được hỗ trợ đổi sản phẩm mới hoặc hoàn tiền 100% nếu sản phẩm có lỗi từ nhà sản xuất hoặc gây kích ứng đối với dòng mỹ phẩm chính hãng.
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7]">
                <strong className="text-xs font-bold text-[#1A1612] block mb-1">
                  3. Cam kết chính hãng & Tra cứu hành trình minh bạch
                </strong>
                Mọi thương hiệu và gian hàng đều có hồ sơ pháp nhân được System Admin duyệt trên hệ thống. Quý khách có thể sử dụng Số điện thoại hoặc Mã vận đơn để tra cứu tiến độ bưu kiện bất kỳ lúc nào.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EAE4D7] flex justify-end">
              <button
                type="button"
                onClick={() => setIsGuideOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#EBD08C] text-white text-xs font-bold hover:bg-[#DEC07A] transition cursor-pointer"
              >
                Tôi đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Checkout Modal */}
      {activeCheckoutProduct && (
        <GuestCheckoutModal
          isOpen={true}
          onClose={() => setActiveCheckoutProduct(null)}
          product={activeCheckoutProduct.product}
          store={activeCheckoutProduct.store}
          initialCouponCode={activeCheckoutProduct.couponCode}
          initialQuantity={activeCheckoutProduct.quantity}
          onOrderPlaced={(orderData: any) => {
            setActiveCheckoutProduct(null);
            toast.success(`Đặt hàng thành công! Mã đơn: ${orderData.orderCode || orderData.id}`);
            if (orderData.phone) {
              setTrackQuery(orderData.phone);
              setTimeout(() => {
                trackingRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 500);
            }
          }}
        />
      )}


      {/* KOC LIVE COMMERCE PREVIEW MODAL */}
      {isLiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsLiveModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white border border-[#EAE4D7] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1A1612] to-[#1A1612] text-white flex items-center justify-between border-b border-[#7D715E]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E11D48] to-[#9F1239] flex items-center justify-center text-white shadow-xs">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-black tracking-tight">KOC Live Commerce Hub</strong>
                    <span className="px-2 py-0.5 rounded-full bg-[#E11D48] text-white text-[9px] font-black uppercase tracking-wider">
                      LIVE STREAM
                    </span>
                  </div>
                  <p className="text-[11px] text-[#EAE4D7] m-0">
                    Phòng phát sóng bán hàng & tiếp thị liên kết đa gian hàng ScanMS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#EAE4D7] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 bg-[#FAF8F5]">
              {/* Feature Intro Banner */}
              <div className="p-4 rounded-2xl bg-[#FBF5EB] border border-[#EAE4D7] flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#B88E4F] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-xs font-black text-[#1A1612] block">
                    Đặc quyền Live Commerce dành cho KOC & Gian Hàng ScanMS
                  </strong>
                  <p className="text-[11px] text-[#7D715E] mt-0.5 m-0 leading-relaxed">
                    KOL/KOC có thể tạo phòng live trực tiếp, ghim sản phẩm từ hàng trăm gian hàng đã duyệt KYC, nhận đơn hàng tự động và chia sẻ hoa hồng tức thì mà không cần tự nhập kho.
                  </p>
                </div>
              </div>

              {/* Active & Scheduled Live Sessions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-[#B88E4F] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#E11D48]" />
                    Phiên Live Đang Phát Sóng & Sắp Diễn Ra
                  </span>
                  <span className="text-[11px] font-bold text-[#7D715E]">
                    Hôm nay, 20/09
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Live Session 1 */}
                  <div className="bg-white border border-[#EAE4D7] rounded-2xl p-4 shadow-2xs hover:border-[#C59B58] transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48] text-[10px] font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-ping" />
                          ĐANG PHÁT SÓNG
                        </span>
                        <span className="text-[10px] font-bold text-[#7D715E]">1.2k người xem</span>
                      </div>
                      <strong className="text-xs font-black text-[#1A1612] block mb-1">
                        Review Siêu Phẩm Dưỡng Ẩm Hydro Boost
                      </strong>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-[#EAE4D7] text-[#B88E4F] text-[9px] font-black flex items-center justify-center">
                          L
                        </div>
                        <span className="text-[11px] font-bold text-[#1A1612]">KOC Linh Trương</span>
                        <BadgeCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
                        <span className="text-[10px] text-[#7D715E]">• Sora Skin</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-between text-xs">
                        <span className="text-[#7D715E]">Hoa hồng KOC:</span>
                        <span className="font-extrabold text-[#B88E4F]">28% (~95.000 ₫/đơn)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toast.success('Đã kết nối luồng Live KOC demo thành công!');
                      }}
                      className="mt-3 w-full py-2 rounded-xl bg-[#EBD08C] hover:bg-[#DEC07A] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      Vào xem phiên Live demo
                    </button>
                  </div>

                  {/* Live Session 2 */}
                  <div className="bg-white border border-[#EAE4D7] rounded-2xl p-4 shadow-2xs hover:border-[#C59B58] transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FBF5EB] text-[#B88E4F] text-[10px] font-black">
                          <Calendar className="w-3.5 h-3.5" />
                          20:30 HÔM NAY
                        </span>
                        <span className="text-[10px] font-bold text-[#7D715E]">530 đặt hẹn</span>
                      </div>
                      <strong className="text-xs font-black text-[#1A1612] block mb-1">
                        Săn Deal Bàn Phím Cơ Custom & Tai Nghe ANC
                      </strong>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-[#EAE4D7] text-[#B88E4F] text-[9px] font-black flex items-center justify-center">
                          D
                        </div>
                        <span className="text-[11px] font-bold text-[#1A1612]">KOC Duy Tech</span>
                        <BadgeCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
                        <span className="text-[10px] text-[#7D715E]">• TechStore</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-between text-xs">
                        <span className="text-[#7D715E]">Deal độc quyền:</span>
                        <span className="font-extrabold text-[#B88E4F]">Giảm 25% + Quà tặng</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toast.success('Đã đặt lịch nhắc hẹn! Hệ thống sẽ thông báo khi KOC Duy Tech bắt đầu phiên live.');
                      }}
                      className="mt-3 w-full py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#1A1612] text-xs font-bold transition cursor-pointer"
                    >
                      Nhắc tôi khi lên sóng
                    </button>
                  </div>
                </div>
              </div>

              {/* Callout for KOC registration */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1A1612] to-[#1A1612] text-white flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <strong className="text-xs font-black block">Bạn là Nhà Sáng Tạo Nội Dung (KOL/KOC)?</strong>
                  <p className="text-[11px] text-[#EAE4D7] mt-0.5 m-0">
                    Đăng ký tài khoản Đối tác để tự do chọn sản phẩm và nhận link tiếp thị bán hàng trên các buổi Livestream.
                  </p>
                </div>
                <Link
                  to="/register"
                  onClick={() => setIsLiveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#EBD08C] text-white text-xs font-bold hover:bg-[#DEC07A] transition shrink-0 whitespace-nowrap"
                >
                  Đăng ký làm KOC ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL PRODUCT ZOOM MODAL */}
      {zoomProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setZoomProduct(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-white border border-[#EAE4D7] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setZoomProduct(null)}
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#1A1612] border border-[#EAE4D7] shadow-md flex items-center justify-center transition cursor-pointer hover:scale-105"
              aria-label="Đóng xem chi tiết"
            >
              <X className="w-5 h-5 text-[#7D715E]" />
            </button>

            {/* Left: Large High-Resolution Image Viewport */}
            <div className="relative flex-1 bg-[#FAF8F5] flex items-center justify-center p-4 sm:p-8 min-h-[320px] md:min-h-[480px] overflow-hidden group">
              <img
                src={zoomProduct.image}
                alt={zoomProduct.name}
                className="max-h-[55vh] md:max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-sm transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/reference/assets/serum-hero-optimized.jpg';
                }}
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 pointer-events-none">
                <ZoomIn className="w-3.5 h-3.5 text-[#EAE4D7]" />
                <span>Xem chi tiết độ phân giải cao</span>
              </div>
            </div>

            {/* Right: Product Summary & Quick Actions */}
            <div className="w-full md:w-80 lg:w-96 p-5 sm:p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#EAE4D7] bg-white text-left">
              <div className="space-y-4">
                {/* Store badge */}
                <div className="flex items-center gap-2 text-xs text-[#7D715E]">
                  <Store className="w-4 h-4 text-[#B88E4F]" />
                  <span className="font-bold text-[#1A1612]">{zoomProduct.brand}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FBF5EB] text-[#B88E4F] text-[10px] font-bold border border-[#EAE4D7]">
                    KYC Verified
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-black text-[#1A1612] leading-snug">
                  {zoomProduct.name}
                </h3>

                {/* Category & SKU */}
                <div className="flex flex-wrap gap-2 text-[11px] text-[#7D715E]">
                  {zoomProduct.category && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE4D7]">
                      {zoomProduct.category}
                    </span>
                  )}
                  {zoomProduct.sku && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE4D7] font-mono">
                      SKU: {zoomProduct.sku}
                    </span>
                  )}
                </div>

                {/* Price block */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-[#B88E4F]">
                      {formatMoney(zoomProduct.price)}
                    </span>
                    {zoomProduct.origPrice > zoomProduct.price && (
                      <span className="text-xs text-[#7D715E] line-through">
                        {formatMoney(zoomProduct.origPrice)}
                      </span>
                    )}
                  </div>
                  {(zoomProduct.commissionRate || 0) > 0 && (
                    <p className="text-[11px] font-bold text-[#B88E4F] m-0">
                      Hoa hồng CTV/KOL: {zoomProduct.commissionRate}% (~{formatMoney(zoomProduct.commissionAmount || Math.round((zoomProduct.price * (zoomProduct.commissionRate || 0)) / 100))})
                    </p>
                  )}
                </div>

                {/* Assurance notice */}
                <div className="p-3 rounded-xl bg-[#FBF5EB] border border-[#EAE4D7] text-[11px] text-[#B88E4F] space-y-1">
                  <p className="font-bold m-0 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
                    Cam kết chính hãng 100%
                  </p>
                  <p className="m-0 text-[#7D715E]">
                    Đồng kiểm khi nhận hàng · Đổi trả trong 14 ngày nếu có lỗi từ nhà sản xuất.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2">
                <Link
                  to={`/products/${zoomProduct.sku || zoomProduct.id}`}
                  onClick={() => setZoomProduct(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#EBD08C] hover:bg-[#DEC07A] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <span>Xem trang chi tiết đầy đủ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    const p = zoomProduct;
                    setZoomProduct(null);
                    handleOpenDirectCheckout(p);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#1A1612] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Mua ngay sản phẩm này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
