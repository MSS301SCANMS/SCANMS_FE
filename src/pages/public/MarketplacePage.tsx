import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  X,
  ShoppingBag,
  Shield,
  BadgeCheck,
} from 'lucide-react';
import api from '../../services/api';
import { authService, type UserProfile } from '../../services/auth.service';
import { getSafeProductImageUrl } from '@/utils/marketplace.utils';
import { customerService } from '../../services/customer.service';
import { ScanMSLogo } from '../../components/common/ScanMSLogo';
import type { Product } from '@/types/marketplace.types';
import { toast } from '../../utils/toast';
import { useCart } from '../../context/CartContext';
import { useLiveSessionDeals } from '../../components/product/LiveSessionDealBadge';
import { LiveCommerceHubModal } from '../../components/marketplace/LiveCommerceHubModal';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { MarketplaceShortcuts } from '../../components/marketplace/MarketplaceShortcuts';
import { OrderTrackingShortcut } from '../../components/marketplace/OrderTrackingShortcut';
import { QuickCustomerAuth } from '../../components/marketplace/QuickCustomerAuth';
import { MarketplaceProductCard } from '../../components/marketplace/MarketplaceProductCard';
import { LiveNowSection } from '../../components/marketplace/LiveNowSection';
import { SponsoredStores } from '../../components/marketplace/SponsoredStores';
import type { MarketplaceStore } from '@/types/marketplace-home.types';
import { MarketplaceHero } from '../../components/marketplace/MarketplaceHero';


export default function MarketplacePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch real products with TanStack Query (Zero reload flicker, instant cache hit)
  const { data: items = [], isLoading: loading, isError: productsFailed, refetch: retryProducts } = useQuery<Product[]>({
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
          rating: Number(dbP.rating || 0),
          reviews: Number(dbP.reviewCount || 0),
          sold: 'Chính hãng',
          origPrice: rawOrigPrice,
          price: rawPrice,
          image: img,
          stockQuantity: Number(dbP.stockQuantity || 0),
          createdAt: dbP.createdAt,
          soldCount: Number(dbP.soldCount ?? 0),
          viewCount: Number(dbP.viewCount ?? 0),
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

  const { data: featuredStores = [] } = useQuery<MarketplaceStore[]>({
    queryKey: ['marketplace-featured-stores'],
    queryFn: async () => {
      const res: any = await api.get('/stores/marketplace');
      const payload = res?.data?.data ?? res?.data ?? res ?? [];
      return Array.isArray(payload) ? payload : [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const marketplaceStores = featuredStores;

  // Cart & Gateways
  const { openCart, addItem, cart, startCheckout } = useCart();

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  const [pendingPurchase, setPendingPurchase] = useState<{ productId: string; variantId?: string; intent: 'cart' | 'buy' } | null>(null);

  const catalogRef = useRef<HTMLElement>(null);
  const trackingRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const targetId = location.hash.slice(1);
    if (!['catalog-section', 'live', 'tracking-section'].includes(targetId)) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.key]);



  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (!isGuideOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsGuideOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [isGuideOpen]);

  const handlePurchase = (product: Product, intent: 'cart' | 'buy', variantId?: string, quantity = 1) => {
    if (intent === 'buy') {
      navigate(`/products/${product.sku || product.id}`);
      return;
    }
    if (!product.storeId) {
      toast.error('Chưa xác định được gian hàng. Vui lòng mở chi tiết sản phẩm.');
      return;
    }
    const payload = {
      product: { ...product, variants: product.variants?.filter((variant) => variant.isActive !== false) },
      store: { id: product.storeId, name: product.brand },
      variantId, quantity, openCartAfterAdd: false,
    };
    if (!authService.getCurrentUser() || !localStorage.getItem('token')) {
      addItem(payload);
      setPendingPurchase({ productId: product.id, variantId, intent });
    } else {
      addItem(payload);
      openCart();
    }
  };

  const finishAuthentication = () => {
    if (!pendingPurchase) return;
    const matching = cart.filter((item) => item.productId === pendingPurchase.productId
      && (!pendingPurchase.variantId || item.variantId === pendingPurchase.variantId));
    const intent = pendingPurchase.intent;
    setPendingPurchase(null);
    if (intent === 'buy' && matching.length) startCheckout(matching);
    else openCart();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612] flex flex-col font-sans selection:bg-[#F3EFE6] selection:text-[#B88E4F]">

      <PublicHeader onOpenTracking={() => trackingRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      <MarketplaceShortcuts onOpenLive={() => setIsLiveModalOpen(true)} />

      <MarketplaceHero stores={marketplaceStores} onOpenLive={() => setIsLiveModalOpen(true)} />

      <SponsoredStores />

      <LiveNowSection onOpenHub={() => setIsLiveModalOpen(true)} />

      {/* Dense commerce catalog with SCANMS affiliate information */}
      <section ref={catalogRef} id="catalog-section" className="w-full scroll-mt-36 bg-[#F3EFE6] py-7 text-left lg:py-9">
        <div className="mx-auto max-w-[1200px] px-3 sm:px-4 lg:px-6">

        {/* SCANMS Standard "KHÁM PHÁ SẢN PHẨM" Header */}
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
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
              {productsFailed ? 'Chưa tải được sản phẩm' : 'Các gian hàng đang cập nhật sản phẩm'}
            </strong>
            <p className="text-xs text-[#7D715E] mt-1 mb-5">
              {productsFailed ? 'Vui lòng kiểm tra kết nối và thử tải lại.' : 'Khám phá thêm danh mục từ các gian hàng đối tác.'}
            </p>
            <Link
              to="/search"
              className="px-6 py-2.5 rounded-xl bg-[#C59B58] text-white text-xs font-bold hover:bg-[#B88E4F] transition cursor-pointer shadow-xs inline-block"
            >
              Mở trang tìm kiếm
            </Link>
            {productsFailed && <button type="button" onClick={() => void retryProducts()} className="ml-3 min-h-11 rounded-xl border border-[#C59B58] px-4 text-xs font-bold text-[#1A1612]">Thử tải lại</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <MarketplaceProductCard
                key={product.id} product={product} wished={wishlistIds.has(product.id)}
                onWishlist={() => void handleToggleWishlist(product.id)}
                onPurchase={(intent, variantId, quantity) => handlePurchase(product, intent, variantId, quantity)}
                deal={liveDeals[product.id]} now={liveDealsNow}
              />
            ))}
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

      <OrderTrackingShortcut sectionRef={trackingRef} />

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
                className="px-5 py-2.5 rounded-xl bg-[#C59B58] text-white text-xs font-bold hover:bg-[#B88E4F] transition cursor-pointer"
              >
                Tôi đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingPurchase && <QuickCustomerAuth onClose={() => setPendingPurchase(null)} onSuccess={finishAuthentication} />}

      {/* KOC LIVE COMMERCE PREVIEW MODAL */}
      <LiveCommerceHubModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
      />

    </div>
  );
}
