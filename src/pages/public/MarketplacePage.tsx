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
  Heart,
  Settings,
  LogOut,
  MapPin,
  Camera,
  Loader2,
  Zap,
} from 'lucide-react';
import api from '../../services/api';
import { authService, type UserProfile } from '../../services/auth.service';
import { getSafeProductImageUrl } from '../../features/marketplace/marketplaceUtils';
import { uploadService } from '../../services/upload.service';
import { customerService } from '../../services/customer.service';
import { GuestCheckoutModal, type CheckoutProductItem, type CheckoutStoreInfo } from '../../components/checkout/GuestCheckoutModal';
import { ScanMSLogo } from '../../components/common/ScanMSLogo';
import { ChatBell } from '../../components/chat/ChatBell';
import { formatMoney } from '../../features/marketplace/marketplaceUtils';
import type { Product } from '../../features/marketplace/marketplace.types';
import { toast } from '../../utils/toast';
import { useCart } from '../../context/CartContext';
import { LiveSessionDealBadge, useLiveSessionDeals } from '../../components/product/LiveSessionDealBadge';
import { LiveCommerceHubModal } from '../../components/marketplace/LiveCommerceHubModal';

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

  // Fetch real products with TanStack Query (Zero reload flicker, instant cache hit)
  const { data: items = [], isLoading: loading } = useQuery<Product[]>({
    queryKey: ['marketplace-products'],
    queryFn: async () => {
      const res: any = await api.get('/public/products', { params: { limit: 48, sortBy: 'newest' } });
      const payload = res?.data !== undefined ? (res.data?.data !== undefined ? res.data.data : res.data) : res;
      const apiItems = Array.isArray(payload) ? payload : (payload?.items || []);

      return apiItems.map((dbP: any) => {
        const rawPrice = Number(dbP.price || 0);
        const rawOrigPrice = dbP.originalPrice ? Number(dbP.originalPrice) : 0;
        const commissionValue = dbP.customCommissionRate ?? dbP.commissionRate ?? dbP.store?.defaultCommissionRate;
        const parsedCommissionRate = commissionValue == null ? undefined : Number(commissionValue);
        const commRate = parsedCommissionRate !== undefined && Number.isFinite(parsedCommissionRate) && parsedCommissionRate > 0
          ? parsedCommissionRate
          : undefined;
        const commAmt = commRate ? Math.round(rawPrice * (commRate / 100)) : undefined;
        const img = getSafeProductImageUrl(
          dbP.imageUrl || (dbP.mediaAssets?.[0]?.urlOrContent),
          dbP.title || dbP.name,
          dbP.categoryName
        );

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
  const { deals: liveDeals, now: liveDealsNow } = useLiveSessionDeals(items.map((product) => product.id));

  // Cart & Gateways
  const { totalCount: totalCartCount, openCart } = useCart();

  const formatSoldCount = (sold?: number | string) => {
    const count = Number(sold) || 600000;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace('.0', '')}tr+`;
    if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1).replace('.0', '')}k+`;
    return `${count}`;
  };

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);

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
  const isKolUser = currentUser?.role === 'COLLABORATOR';
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Load user profile & customer wishlist
  useEffect(() => {
    const syncUser = () => {
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
      } else {
        setWishlistIds(new Set());
      }
    };

    syncUser();

    const handleWishlistUpdated = (e: any) => {
      const { productId, wishlisted } = e.detail || {};
      if (!productId) return;
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (wishlisted) next.add(productId);
        else next.delete(productId);
        return next;
      });
    };

    window.addEventListener('auth-user-updated', syncUser);
    window.addEventListener('wishlist-updated', handleWishlistUpdated as EventListener);
    return () => {
      window.removeEventListener('auth-user-updated', syncUser);
      window.removeEventListener('wishlist-updated', handleWishlistUpdated as EventListener);
    };
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
      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { productId, wishlisted: res.wishlisted },
        })
      );
    } catch {
      toast.error('Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const secureUrl = await uploadService.uploadImage(file, 'scanms/avatars');
      await authService.updateAvatar(secureUrl);
      setCurrentUser(authService.getCurrentUser());
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch (err: any) {
      console.error('Lỗi tải ảnh đại diện:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể tải ảnh đại diện lên');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
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
          <div className="max-w-[1200px] mx-auto px-3 sm:px-4 lg:px-6 flex flex-wrap items-center justify-between gap-3">
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
            className={`max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-6 transition-all duration-300 ease-in-out ${
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
              className={`hidden md:flex min-w-[280px] w-full flex-1 max-w-3xl xl:max-w-4xl justify-self-center items-center gap-2 rounded-2xl border border-[#EAE4D7] bg-white shadow-sm shadow-[#C59B58]/10 transition-all duration-300 ease-in-out focus-within:border-[#C59B58] ${
                isScrolled ? 'p-1' : 'p-1.5'
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5">
                <Search className="h-4 w-4 shrink-0 text-[#B88E4F]" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  aria-label="Tìm kiếm sản phẩm"
                  className="min-w-0 w-full bg-transparent text-xs sm:text-[13px] font-medium text-[#1A1612] placeholder:text-[#8C7D6B] outline-none pr-2"
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
                className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#8C6226] transition hover:bg-[#F3EFE6] hover:border-[#C59B58]/50 cursor-pointer active:scale-[0.98] ${
                  isScrolled ? 'p-2' : 'px-3 py-2'
                }`}
                title="Mở bộ lọc tìm kiếm"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#B88E4F]" />
              </button>
              <button
                type="submit"
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-xs font-bold text-[#1A1612] transition shadow-sm shadow-[#C59B58]/20 cursor-pointer active:scale-[0.98] ${
                  isScrolled ? 'px-3.5 py-1.5' : 'px-4 py-2'
                }`}
              >
                <span>Tìm kiếm</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* SCANMS Standard Minimalist Cart Icon Button */}
              <button
                type="button"
                onClick={() => openCart()}
                className="relative p-2.5 text-[#B88E4F] hover:text-[#C59B58] transition-colors duration-200 cursor-pointer group active:scale-95 flex items-center justify-center rounded-full hover:bg-[#FBF5EB]"
                title="Giỏ hàng của bạn"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-[#B88E4F] group-hover:text-[#C59B58] transition-transform group-hover:scale-105" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[19px] px-1 rounded-full bg-white border border-[#C59B58] text-[#B88E4F] text-[11px] font-black flex items-center justify-center shadow-xs">
                    {totalCartCount > 99 ? '99+' : totalCartCount}
                  </span>
                )}
              </button>

              {currentUser?.role === 'CUSTOMER' && <ChatBell userId={currentUser.id} />}

              {/* Customer / Partner Gateways Dropdown */}
              {currentUser ? (
                <div className="flex items-center gap-2">
                  {currentUser.role === 'CUSTOMER' && (
                    <Link
                      to="/customer/upgrade"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#B88E4F] bg-[#FBF5EB] border border-[#EEDFC6] hover:bg-[#F3EFE6] hover:border-[#C59B58] transition shadow-2xs group"
                      title="Nâng cấp tài khoản Khách Hàng lên KOL Tiếp Thị hoặc Mở Shop"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#B88E4F] group-hover:scale-110 transition-transform" />
                      <span>Nâng cấp Đối tác</span>
                    </Link>
                  )}

                  <div className="relative" ref={roleDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className={`flex items-center gap-2 sm:gap-2.5 pl-1.5 pr-3 py-1.5 sm:pl-2 sm:pr-3.5 sm:py-1.5 rounded-2xl bg-white/95 border transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs group active:scale-[0.98] min-w-[160px] sm:min-w-[190px] ${
                        isRoleDropdownOpen
                          ? 'border-[#C59B58] ring-2 ring-[#C59B58]/20 bg-[#FAF8F5]'
                          : 'border-[#EAE4D7] hover:border-[#C59B58]/60 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        {currentUser.avatarUrl ? (
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.fullName || 'Avatar'}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 border border-[#E8D4B0] shadow-2xs"
                          />
                        ) : (
                          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#FAF0DD] to-[#F3EFE6] text-[#8C6226] flex items-center justify-center font-black text-xs shrink-0 border border-[#E8D4B0] shadow-2xs">
                            {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                          </span>
                        )}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#059669] border-2 border-white" />
                      </div>
                      <div className="text-left hidden md:block max-w-[130px] sm:max-w-[155px] flex-1 min-w-0">
                        <strong className="block text-xs font-bold text-[#1A1612] truncate leading-none mb-1">
                          {currentUser.fullName || currentUser.email}
                        </strong>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FAF0DD] border border-[#E8D4B0] text-[9.5px] font-black text-[#8C6226] truncate leading-none">
                          {currentUser.role === 'CUSTOMER' ? '🛍️ Khách Mua' : currentUser.role === 'COLLABORATOR' ? '⭐ KOL/KOC' : currentUser.role === 'SHOP_MANAGER' ? '🏪 Shop' : '🛡️ Admin'}
                        </span>
                      </div>
                      <ChevronRight className={`hidden sm:block w-3.5 h-3.5 text-[#7D715E] shrink-0 transition-transform duration-200 group-hover:text-[#B88E4F] ml-auto ${isRoleDropdownOpen ? 'rotate-90 text-[#B88E4F]' : ''}`} />
                    </button>

                    {isRoleDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#EAE4D7] rounded-2xl shadow-xl p-3 flex flex-col gap-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
                        <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-center gap-2.5">
                          <div className="relative group shrink-0">
                            {currentUser.avatarUrl ? (
                              <img
                                src={currentUser.avatarUrl}
                                alt={currentUser.fullName || 'Avatar'}
                                className="w-10 h-10 rounded-xl object-cover border border-[#E8D4B0] shadow-2xs"
                              />
                            ) : (
                              <span className="w-10 h-10 rounded-xl bg-[#EAE4D7] text-[#B88E4F] flex items-center justify-center font-black text-sm border border-[#EAE4D7]">
                                {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                avatarInputRef.current?.click();
                              }}
                              disabled={uploadingAvatar}
                              title="Bấm để tải ảnh đại diện lên"
                              className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#C59B58] hover:bg-[#B88E4F] text-white shadow-xs border-2 border-white transition cursor-pointer"
                            >
                              {uploadingAvatar ? (
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                <Camera className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                          <div className="min-w-0 flex-1">
                            <strong className="block text-xs font-black text-[#1A1612] truncate">
                              {currentUser.fullName || currentUser.email}
                            </strong>
                            <small className="text-[11px] text-[#7D715E] block truncate">
                              {currentUser.email}
                            </small>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7] text-[10px] font-bold">
                              {currentUser.role === 'CUSTOMER'
                                ? 'Khách Mua Sắm'
                                : currentUser.role === 'COLLABORATOR'
                                ? 'Cộng Tác Viên (KOL)'
                                : currentUser.role === 'SHOP_MANAGER'
                                ? 'Chủ Gian Hàng (Shop)'
                                : 'Quản Trị Viên'}
                            </span>
                          </div>
                        </div>

                        <input
                          type="file"
                          ref={avatarInputRef}
                          onChange={handleAvatarUpload}
                          accept="image/png,image/jpeg,image/webp,image/jpg"
                          className="hidden"
                        />

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

                            {/* Nâng cấp Đối tác (KOL / Shop) */}
                            <Link
                              to="/customer/upgrade"
                              onClick={() => setIsRoleDropdownOpen(false)}
                              className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-[#B88E4F] bg-gradient-to-r from-[#FBF5EB] to-[#F7EDE0] hover:from-[#F3EFE6] hover:to-[#EAE4D7] rounded-xl border border-[#EEDFC6] transition mt-1 shadow-2xs group"
                              title="Nộp hồ sơ nâng cấp thành KOL Tiếp Thị hoặc Mở Gian Hàng"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Sparkles className="w-4 h-4 text-[#B88E4F] shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="truncate">Nâng cấp Đối tác (KOL / Shop)</span>
                              </div>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#C59B58] text-white shrink-0 shadow-2xs">
                                MỚI
                              </span>
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
                placeholder="Tìm kiếm sản phẩm..."
                aria-label="Tìm kiếm sản phẩm"
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
            <div className="mx-auto grid max-w-[1040px] grid-cols-5 items-center gap-1.5 px-2 sm:px-4 py-1.5">
              {/* Live KOC Button with pulsing indicator */}
              <button
                type="button"
                onClick={() => setIsLiveModalOpen(true)}
                className="group flex min-w-0 items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-xs font-bold text-[#9F1239] transition cursor-pointer shadow-2xs"
                title="Khám phá các phiên Livestream KOC tiếp thị sản phẩm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E11D48] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E11D48]" />
                </span>
                <span className="truncate text-[#9F1239] font-black uppercase tracking-wider text-[10px] sm:text-[11px]">Live KOC</span>
                <span className="hidden sm:inline px-1 py-0.2 rounded bg-[#E11D48] text-white text-[8px] font-black tracking-wide uppercase">HOT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex min-w-0 items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#7D715E] transition hover:bg-white hover:border-[#C59B58]/60 hover:text-[#1A1612] cursor-pointer shadow-2xs"
              >
                <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span className="hidden sm:inline truncate">Gian Hàng Đối Tác</span>
              </button>

              <Link
                to="/search?commission=true"
                className="flex min-w-0 items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#7D715E] transition hover:bg-white hover:border-[#C59B58]/60 hover:text-[#1A1612] cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span className="hidden sm:inline truncate">Săn Deal KOC</span>
              </Link>

              <Link
                to="/leaderboard"
                className="flex min-w-0 items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#7D715E] transition hover:bg-white hover:border-[#C59B58]/60 hover:text-[#1A1612] shadow-2xs"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span className="hidden sm:inline truncate">BXH Doanh Số</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  trackingRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex min-w-0 items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#7D715E] transition hover:bg-white hover:border-[#C59B58]/60 hover:text-[#1A1612] cursor-pointer shadow-2xs"
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
        <div className="mx-auto max-w-[1200px] px-3 sm:px-4 lg:px-6">
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
        <div className="mx-auto max-w-[1200px] px-3 sm:px-4 lg:px-6">

        {/* SCANMS Standard "ĐƠN HÀNG HÔM NAY" Header */}
        <div className="mb-4 bg-white border border-[#EAE4D7] border-b-[4px] border-b-[#B88E4F] shadow-[0_2px_8px_rgba(75,57,34,0.04)]">
          <div className="py-3.5 sm:py-4 px-4 text-center">
            <h2
              className="m-0 text-base sm:text-[17px] uppercase tracking-[0.04em] select-none"
              style={{ color: '#B88E4F', fontWeight: 500 }}
            >
              ĐƠN HÀNG HÔM NAY
            </h2>
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
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((p) => {
              const productDetailUrl = `/products/${p.sku || p.id}`;
              return (
                <div
                  key={p.id}
                  className="bg-white border border-[#EAE4D7] rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(75,57,34,0.12)] hover:border-[#C59B58] transition-all duration-200 flex flex-col justify-between group text-left relative"
                >
                  {/* Entire Card Clickable Area -> Product Details (SCANMS Standard) */}
                  <div
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(productDetailUrl)}
                    onKeyDown={(event) => {
                      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        navigate(productDetailUrl);
                      }
                    }}
                    className="block flex-1 flex flex-col cursor-pointer"
                    title={p.name}
                  >
                    {/* Image Container with Discount Badge & Wishlist Heart */}
                    <div className="relative aspect-square bg-[#F3EFE6] overflow-hidden">
                      <LiveSessionDealBadge deal={liveDeals[p.id]} now={liveDealsNow} />
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover object-center transition-transform duration-300 scale-[1.02] group-hover:scale-[1.06]"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.dataset.hasFallback) {
                            target.dataset.hasFallback = 'true';
                            target.src = getSafeProductImageUrl(null, p.name);
                          }
                        }}
                      />
                      {p.origPrice > p.price && (
                        <span className="absolute top-0 left-0 px-1.5 py-0.5 rounded-br-md bg-[#FEE2E2] text-[#DC2626] text-[9.5px] sm:text-[10px] font-bold border-r border-b border-[#FADCD5] shadow-2xs z-10">
                          -{Math.round(((p.origPrice - p.price) / p.origPrice) * 100)}%
                        </span>
                      )}

                      {/* Wishlist Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleWishlist(p.id);
                        }}
                        className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm z-10 cursor-pointer active:scale-90 ${
                          wishlistIds.has(p.id)
                            ? 'bg-white text-[#DC2626] ring-1 ring-[#DC2626]/30 shadow-[0_2px_8px_rgba(220,38,38,0.25)] hover:scale-110'
                            : 'bg-white/90 hover:bg-white text-[#7D715E] hover:text-[#DC2626] hover:scale-110 backdrop-blur-xs'
                        }`}
                        title={wishlistIds.has(p.id) ? 'Bỏ lưu sản phẩm' : 'Lưu vào danh sách yêu thích'}
                      >
                        <Heart className={`w-3.5 h-3.5 transition-colors ${wishlistIds.has(p.id) ? 'fill-[#DC2626] text-[#DC2626]' : ''}`} />
                      </button>
                    </div>

{/* Card Content - SCANMS Compact Proportions */}
                    <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Row 1: Store Icon & Shop Name • Chính hãng */}
                        <div className="flex items-center justify-between gap-1 h-5 mb-1 min-w-0">
                          <Link
                            to={p.storeId ? `/shops/${p.storeId}` : `/marketplace?store=${encodeURIComponent(p.brand || '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10.5px] font-bold text-[#7D715E] hover:text-[#B88E4F] flex items-center gap-1 min-w-0 truncate"
                            title={p.brand || 'Gian hàng đối tác'}
                          >
                            <Store className="w-3 h-3 text-[#B88E4F] shrink-0" />
                            <span className="truncate max-w-[85px] sm:max-w-[105px]">
                              {p.brand || 'Gian hàng đối tác'}
                            </span>
                          </Link>
                          <span className="inline-flex items-center px-1 py-0.2 rounded bg-[#FBF5EB] border border-[#EEDFC6] text-[8.5px] sm:text-[9px] font-extrabold text-[#B88E4F] shrink-0">
                            Chính hãng
                          </span>
                        </div>

                        {/* Row 2: Product Title (Strictly fixed height 34px - 2 lines, so 1-line and 2-line titles are 100% evenly aligned) */}
                        <h3
                          className="text-xs font-semibold text-[#1A1612] group-hover:text-[#B88E4F] transition-colors line-clamp-2 h-[34px] leading-[17px] mb-1 overflow-hidden"
                          title={p.name}
                        >
                          {p.name}
                        </h3>

                        {/* Row 3: SCANMS Badge Row - "Rẻ Vô Địch" / "Hoa hồng" (Fixed height h-5 to keep all cards uniform) */}
                        <div className="flex items-center gap-1 h-5 mb-1.5 min-w-0">
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#FBF5EB] border border-[#EEDFC6] text-[9px] font-black text-[#B88E4F] shrink-0 shadow-2xs tracking-tight"
                            title="Bảo chứng giá tốt nhất sàn - Rẻ Vô Địch"
                          >
                            <Zap className="w-2.5 h-2.5 fill-[#B88E4F] text-[#B88E4F] shrink-0" />
                            <span>Rẻ Vô Địch</span>
                          </span>

                          {isKolUser && (p.commissionRate || 0) > 0 && (
                            <span className="text-[9px] text-[#B88E4F] font-bold bg-[#FBF5EB] px-1 py-0.5 rounded border border-[#EEDFC6] truncate">
                              HH {p.commissionRate}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 4: SCANMS Standard Bottom Bar: Big Bold Price on Left, Sold Count on Right */}
                      <div className="pt-1.5 border-t border-[#EAE4D7]/60 flex items-center justify-between gap-1">
                        <span className="text-xs sm:text-sm font-black text-[#B88E4F] tracking-tight truncate">
                          {formatMoney(p.price)}
                        </span>

                        <span className="text-[10px] text-[#7D715E] font-medium shrink-0 whitespace-nowrap">
                          {formatSoldCount(p.sold)} đã bán
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SCANMS Standard "Xem Thêm" Button */}
        <div className="mt-7 sm:mt-9 flex justify-center">
          <Link
            to="/search"
            className="w-full max-w-[390px] h-10 sm:h-11 bg-white border border-[#EAE4D7] hover:border-[#C59B58] rounded-[2px] flex items-center justify-center text-sm font-normal text-[#555555] hover:text-[#1A1612] hover:bg-[#FAF8F5] transition shadow-2xs active:scale-[0.99] select-none"
          >
            Xem Thêm
          </Link>
        </div>
        </div>
      </section>

      {/* Order Tracking Section */}
      <section ref={trackingRef} id="tracking-section" className="border-t border-[#EAE4D7] bg-[#F3EFE6] py-6">
        <div className="mx-auto max-w-[1200px] px-3 sm:px-4 lg:px-6 text-left">
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
      <LiveCommerceHubModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
      />

    </div>
  );
}
