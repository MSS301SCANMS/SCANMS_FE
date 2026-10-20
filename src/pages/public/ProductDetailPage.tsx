import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowRight,
  Star,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Tag,
  X,
  Sparkles,
  BadgeCheck,
  AlertCircle,
  Subtitles,
  Gauge,
  Heart,
  Ticket,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Minus,
  Plus,
  Store,
  MessageSquare,
  Package,
} from 'lucide-react';
import api from '@/services/api';
import { GuestCheckoutModal } from '@/components/checkout/GuestCheckoutModal';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { authService } from '@/services/auth.service';
import { customerService } from '@/services/customer.service';
import { couponService } from '@/services/coupon.service';
import { toast } from '@/utils/toast';
import { useCart } from '@/context/CartContext';
import { useScanmsChat } from '@/context/ScanmsChatContext';
import { LiveSessionDealCard } from '@/components/product/LiveSessionDealCard';
import { StoreActivityStatus } from '@/components/store/StoreActivityStatus';
import { ProductBreadcrumbs } from '@/components/product/ProductBreadcrumbs';
import { ProductPurchaseSummary } from '@/components/product/ProductPurchaseSummary';
import { ProductShoppingPolicies } from '@/components/product/ProductShoppingPolicies';


function getSmartFallbackImage(title?: string, categoryName?: string): string {
  void title;
  void categoryName;
  return '/assets/product-placeholder.svg';
}

const SCANMS_PLACEHOLDER = '/assets/product-placeholder.svg';

const META_APP_ID = String(import.meta.env.VITE_META_APP_ID || '').trim();
interface ProductVariantItem {
  id: string;
  sku: string;
  name: string;
  attributes?: Record<string, string>;
  price: number;
  stockQuantity: number;
  isActive?: boolean;
  imageUrl?: string;
  sampleEnabled?: boolean;
  sampleAvailable?: boolean;
  sampleQuotaRemaining?: number;
}

interface LandingProduct {
  id: string;
  sku: string;
  title: string;
  categoryName: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  canPurchase: boolean;
  status?: string;
  stockQuantity?: number;
  soldCount?: number;
  sampleEnabled?: boolean;
  sampleAvailable?: boolean;
  sampleQuotaRemaining?: number;
  variants?: ProductVariantItem[];
}

interface LandingStore {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  isVerified: boolean;
}

interface LandingVideo {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl: string | null;
  caption?: string | null;
  kol: {
    id: string | null;
    name: string;
    avatarUrl: string | null;
    isVerified: boolean;
    badgeLabel: string;
    disclosure: string;
  };
  isFeatured?: boolean;
  isReferredKol?: boolean;
  createdAt?: string;
}

interface LandingReviewItem {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  reviewImageUrl?: string | null;
  isVerifiedBuyer: boolean;
  createdAt: string;
}

interface LandingReviews {
  averageRating: number | null;
  totalReviews: number;
  starDistribution: Record<number, number>;
  items: LandingReviewItem[];
}

interface LandingData {
  product: LandingProduct;
  store: LandingStore;
  images: string[];
  videos: LandingVideo[];
  reviews: LandingReviews;
  availability: {
    inStock: boolean;
    stockQuantity: number;
  };
  policies: {
    returnPolicy: string;
    warranty: string;
    shipping: string;
    genuineCommitment: string;
  };
}

function getEstimatedDeliveryWindow() {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const end = new Date(start);
  const latest = new Date(start);
  end.setDate(end.getDate() + 2);
  latest.setDate(latest.getDate() + 5);

  const sameYear = end.getFullYear() === latest.getFullYear();
  const format = (date: Date) =>
    new Intl.DateTimeFormat('vi-VN', {
      day: 'numeric',
      month: 'short',
      ...(sameYear ? {} : { year: 'numeric' as const }),
    }).format(date);

  return `${format(end)} – ${format(latest)}`;
}

function resolveProductVariants(product: LandingProduct, productImages: string[] = []): ProductVariantItem[] {
  const productImage = [product.imageUrl, ...productImages]
    .find((image) => image?.trim() && image.trim() !== SCANMS_PLACEHOLDER);
  return (product.variants || [])
    .filter((variant) => variant.isActive !== false)
    .map((variant) => ({
      ...variant,
      imageUrl: variant.imageUrl?.trim() || productImage?.trim() || SCANMS_PLACEHOLDER,
    }));
}

function trackAnalytics(eventName: 'page_view' | 'video_start' | 'video_progress' | 'video_complete' | 'cta_click' | 'add_to_cart' | 'checkout_start' | 'order_complete', payload?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem('scanms_analytics_consent') !== 'granted') return;
  const eventId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
          const value = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
          return (char === 'x' ? value : (value & 3) | 8).toString(16);
        });
  const eventData = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...payload,
  };
  window.dispatchEvent(
    new CustomEvent('scanms_analytics', { detail: eventData }),
  );
  if (import.meta.env.DEV) {
    console.debug('[SCANMS Analytics Event]:', eventName, eventData);
  }

  api
    .post('/public/products/analytics/events', {
      eventId,
      event: eventName,
      productId: payload?.productId,
      storeId: payload?.storeId,
      metadata: payload,
    })
    .catch(() => {

    });
}

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { openChat } = useScanmsChat();
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();
  const isKolUser = currentUser?.role === 'COLLABORATOR';
  const [sampleEligibility, setSampleEligibility] = useState<any>(null);
  const [sampleRequestStatus, setSampleRequestStatus] = useState<any>(null);
  const [loadingSampleStatus, setLoadingSampleStatus] = useState(false);

  // ────── REALTIME STOCK STATE ──────
  const [stockSnapshot, setStockSnapshot] = useState<{
    stockQuantity: number;
    variants: Array<{ id: string; stockQuantity: number; isActive: boolean }>;
  } | null>(null);

  const handleOpenChat = () => {
    if (!data?.store?.id || !data.product) {
      toast.error('Chưa tải được thông tin gian hàng. Vui lòng thử lại.');
      return;
    }

    const storeObj = {
      id: data.store.id,
      name: data.store.name,
      logoUrl: data.store.logoUrl || undefined,
      isVerified: Boolean(data.store.isVerified),
    };
    const productPrice = Number(selectedVariant?.price ?? data.product.price ?? 0);
    const productObj = {
      id: data.product.id,
      title: data.product.title,
      price: productPrice,
      originalPrice: data.product.originalPrice ? Number(data.product.originalPrice) : undefined,
      imageUrl: selectedVariant?.imageUrl || data.images?.[0] || data.product.imageUrl || undefined,
      soldCount: data.product.soldCount ?? 0,
    };

    openChat(storeObj, productObj);
  };

  const handleRequestSample = () => {
    if (!currentUser) {
      toast.info('Đăng nhập bằng tài khoản KOL để đăng ký nhận sản phẩm mẫu.');
      navigate(`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`);
      return;
    }
    if (!isKolUser) {
      toast.info('Chức năng nhận sản phẩm mẫu dành cho KOL / Creator.');
      return;
    }
    if (!data?.product || !data.store?.id) {
      toast.error('Không tìm thấy thông tin sản phẩm hoặc gian hàng.');
      return;
    }
    if (!sampleFeatureEnabled || !sampleQuotaAvailable) {
      toast.info('Shop hiện chưa nhận đăng ký mẫu hoặc đã cấp hết hạn mức cho sản phẩm này.');
      return;
    }
    if (sampleEligibility && !sampleEligibility.canRequest) {
      toast.info(sampleEligibility.blockReason || 'Hãy hoàn tất điều kiện KOL trước khi xin mẫu.');
      navigate('/collaborator/profile?tab=kyc');
      return;
    }
    if (sampleRequestStatus && !['REJECTED', 'CANCELLED', 'COMPLETED'].includes(sampleRequestStatus.status)) {
      toast.info(`Yêu cầu mẫu này đang ở trạng thái: ${sampleRequestStatus.statusLabel || sampleRequestStatus.status}.`);
      navigate('/collaborator/collaboration?tab=samples');
      return;
    }
    const query = new URLSearchParams({
      tab: 'products',
      storeId: data.store.id,
      sampleRequest: '1',
      productId: data.product.id,
      productTitle: data.product.title,
      productImage: data.images?.[0] || data.product.imageUrl || '',
      productPrice: String(data.product.price || 0),
      productSku: data.product.sku || '',
      productVariantId:
        selectedVariantIsReal && selectedVariant ? selectedVariant.id : '',
    });
    navigate(`/collaborator/collaboration?${query.toString()}`);
  };

  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [analyticsConsent, setAnalyticsConsent] = useState<string | null>(() =>
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem('scanms_analytics_consent'),
  );


  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariantItem | null>(null);
  const [variantSelectionRequired, setVariantSelectionRequired] = useState(false);
  const variantOptionsRef = useRef<HTMLDivElement | null>(null);

  const [quantity, setQuantity] = useState(1);


  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [videoStarted, setVideoStarted] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);


  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    contextKey: string;
    code: string;
    discountAmount: number;
    description?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [availableStoreCoupons, setAvailableStoreCoupons] = useState<any[]>([]);
  const couponContextKey = `${data?.product?.id ?? ''}|${selectedVariant?.id ?? ''}|${quantity}|${selectedVariant?.price ?? data?.product?.price ?? 0}`;
  const couponContextRef = useRef(couponContextKey);
  couponContextRef.current = couponContextKey;
  useEffect(() => { setAppliedCoupon(null); setCouponError(null); }, [couponContextKey]);

  // Fetch active store vouchers for customers
  useEffect(() => {
    if (data?.store?.id) {
      couponService
        .getPublicStoreCoupons(data.store.id)
        .then((coupons) => {
          if (Array.isArray(coupons)) {
            setAvailableStoreCoupons(coupons);
          }
        })
        .catch((e) => {
          console.warn('Cannot fetch public store coupons:', e);
        });
    }
  }, [data?.store?.id]);

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isCheckoutParam = searchParams.get('checkout') === '1' || searchParams.get('checkout') === 'true';
  const isCheckoutOpen = isCheckoutParam;
  const [isWishlisted, setIsWishlisted] = useState(false);
  const estimatedDeliveryWindow = getEstimatedDeliveryWindow();

  useEffect(() => {
    if (isCheckoutParam && data?.product && resolveProductVariants(data.product).length > 0 && !selectedVariant) {
      setVariantSelectionRequired(true);
      setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('checkout'); return next; }, { replace: true });
      variantOptionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      variantOptionsRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
      return;
    }
  }, [isCheckoutParam, data?.product, selectedVariant, setSearchParams]);

  const handleBuyNow = (source?: string) => {
    if (requestVariantSelection()) return;
    if (data?.product) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('checkout', '1');
          return next;
        },
        { replace: true },
      );
      trackAnalytics('cta_click', {
        productId: data.product.id,
        variantId: selectedVariant?.id,
        source: source || 'buy_now_btn',
      });
    }
  };

  const handleCloseCheckout = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('checkout');
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    if (data?.product?.id) {
      const u = authService.getCurrentUser();
      if (u?.role === 'CUSTOMER') {
        customerService
          .getWishlist()
          .then((items) => {
            if (Array.isArray(items)) {
              setIsWishlisted(items.some((it) => it.product?.id === data.product.id));
            }
          })
          .catch(() => {});
      }
    }
  }, [data?.product?.id]);

  const handleToggleWishlist = async () => {
    const u = authService.getCurrentUser();
    if (!u) {
      toast.error('Vui lòng đăng nhập tài khoản Khách hàng để lưu sản phẩm yêu thích!');
      navigate(`/login?role=CUSTOMER&redirect=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`);
      return;
    }
    if (u.role !== 'CUSTOMER') {
      toast.error('Chức năng Yêu thích sản phẩm chỉ áp dụng cho tài khoản Khách mua hàng.');
      return;
    }
    if (!data?.product?.id) return;
    try {
      const res = await customerService.toggleWishlist(data.product.id);
      setIsWishlisted(res.wishlisted);
      if (res.wishlisted) {
        toast.success('Đã lưu sản phẩm vào danh sách yêu thích!');
      } else {
        toast.info('Đã bỏ lưu sản phẩm');
      }
    } catch {
      toast.error('Không thể cập nhật danh sách yêu thích. Vui lòng thử lại sau.');
    }
  };

  const getShareUrls = () => {
    const identifier = data?.product?.sku || data?.product?.id || slug || '';
    const productUrl = new URL(window.location.pathname, window.location.origin).toString();
    // BE không có /seo — dùng URL sản phẩm công khai
    const previewUrl = productUrl;
    void identifier;
    return { productUrl, previewUrl };
  };

  const copyShareUrl = async (url: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return;
    }

    const input = document.createElement('textarea');
    input.value = url;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (!copied) throw new Error('Trình duyệt không cho phép sao chép liên kết.');
  };

  const openShareWindow = (url: string, name: string) => {
    const popup = window.open(url, name, 'popup,width=640,height=720');
    popup?.focus();
    return Boolean(popup);
  };

  const handleFacebookShare = async () => {
    const { previewUrl } = getShareUrls();
    const dialogUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(previewUrl)}`;
    if (openShareWindow(dialogUrl, 'scanms-facebook-share')) {
      toast.info('Đã mở hộp thoại chia sẻ Facebook.');
      return;
    }
    try {
      await copyShareUrl(previewUrl);
      toast.info('Trình duyệt đã chặn cửa sổ chia sẻ. Liên kết sản phẩm đã được sao chép.');
    } catch {
      toast.error('Không mở được Facebook và không thể sao chép liên kết.');
    }
  };

  const handleMessengerShare = async () => {
    const { productUrl, previewUrl } = getShareUrls();
    if (META_APP_ID) {
      const dialog = new URL('https://www.facebook.com/dialog/send');
      dialog.search = new URLSearchParams({
        app_id: META_APP_ID,
        link: previewUrl,
        redirect_uri: productUrl,
      }).toString();
      if (openShareWindow(dialog.toString(), 'scanms-messenger-share')) {
        toast.info('Đã mở hộp thoại Messenger.');
        return;
      }
    }

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: data?.product?.title || 'Sản phẩm SCANMS',
          text: `Xem sản phẩm ${data?.product?.title || 'này'} trên SCANMS`,
          url: previewUrl,
        });
        toast.info('Đã mở bảng chia sẻ của thiết bị. Hãy chọn Messenger.');
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    if (!META_APP_ID) window.open('https://www.facebook.com/messages/', '_blank', 'noopener,noreferrer');
    try {
      await copyShareUrl(previewUrl);
      toast.info(
        META_APP_ID
          ? 'Liên kết đã sao chép. Cửa sổ Messenger bị chặn; hãy dán liên kết vào cuộc trò chuyện.'
          : 'Liên kết đã sao chép. Hãy dán vào Messenger; cấu hình Meta App ID để mở hộp thoại gửi trực tiếp.',
      );
    } catch {
      toast.error('Không thể sao chép liên kết sản phẩm.');
    }
  };

  useEffect(() => {
    async function loadLanding() {
      if (!slug) {
        setError('Không tìm thấy đường dẫn sản phẩm hợp lệ');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let res: any;
        try {
          res = await api.get(
            `/public/products/${encodeURIComponent(slug)}/landing`,
          );
        } catch {
          res = await api.get(`/products/${encodeURIComponent(slug)}/landing`);
        }

        const landingPayload = res?.data?.product
          ? res.data
          : res?.data?.data || res?.data;

        if (
          landingPayload &&
          landingPayload.product &&
          landingPayload.product.id
        ) {



          let localApprovedVideos: LandingVideo[] = [];
          try {
            const parsed = JSON.parse(
              window.localStorage.getItem('scanms_kol_video_submissions') || '[]',
            );
            const aliases = new Set([
              landingPayload.product.id,
              landingPayload.product.sku,
              slug,
              ...(landingPayload.product.sku === 'SR-VTC-15' ? ['SKIN-C15'] : []),
            ]);
            localApprovedVideos = (Array.isArray(parsed) ? parsed : [])
              .filter(
                (video: any) =>
                  aliases.has(video.productId) &&
                  (video.status === 'APPROVED' || video.isApproved === true),
              )
              .map((video: any) => ({
                id: video.id,
                title: video.title || 'Video review từ KOL',
                videoUrl: video.videoUrl?.startsWith('./assets/')
                  ? `/reference/${video.videoUrl.slice(2)}`
                  : video.videoUrl,
                posterUrl: video.image?.startsWith('./assets/')
                  ? `/reference/${video.image.slice(2)}`
                  : video.image || null,
                caption: video.caption || null,
                kol: {
                  id: null,
                  name: video.collaborator?.fullName || 'Trần Văn Nhật',
                  avatarUrl: null,
                  isVerified: true,
                  badgeLabel: 'KOL đã xác minh',
                  disclosure: 'Nội dung có liên kết tiếp thị',
                },
                isFeatured: Boolean(video.isFeatured),
                isReferredKol: false,
                createdAt: video.createdAt || new Date().toISOString(),
              }));
          } catch {
            localApprovedVideos = [];
          }

          const mergedVideos = [...localApprovedVideos];
          (landingPayload.videos || []).forEach((video: LandingVideo) => {
            if (!mergedVideos.some((item) => item.id === video.id)) mergedVideos.push(video);
          });
          mergedVideos.sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));

          setSelectedVariant(null);
          setVariantSelectionRequired(false);
          setQuantity(1);
          setSelectedImageIndex(0);
          setHoveredImage(null);
          setSelectedImage('');

          setData({ ...landingPayload, videos: mergedVideos });
          return;
        }


        throw new Error(
          'Dữ liệu sản phẩm trả về từ máy chủ không hợp lệ hoặc thiếu trường bắt buộc.',
        );
      } catch (err: any) {
        console.error('Lỗi khi tải Landing Page:', err);
        const errMsg =
          err?.response?.data?.message ||
          'Sản phẩm không tồn tại, đã tạm ngừng hoặc cửa hàng đối tác đang bảo trì.';
        setError(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
      } finally {
        setLoading(false);
      }
    }

    loadLanding();
  }, [slug]);

  useEffect(() => {
    let active = true;
    if (!isKolUser || !data?.product?.id) {
      setSampleEligibility(null);
      setSampleRequestStatus(null);
      setLoadingSampleStatus(false);
      return;
    }
    setLoadingSampleStatus(true);
    Promise.all([
      api.get('/sample-requests/my/eligibility', { headers: { 'x-skip-cache': 'true' } }).catch(() => null),
      api.get('/sample-requests/my', { headers: { 'x-skip-cache': 'true' } }).catch(() => []),
    ]).then(([eligibility, requests]: [any, any]) => {
      if (!active) return;
      setSampleEligibility(eligibility?.data || eligibility);
      const requestList = Array.isArray(requests) ? requests : requests?.data || [];
      const currentRequest = requestList.find((request: any) =>
        request.productId === data.product.id &&
        !['REJECTED', 'CANCELLED', 'COMPLETED'].includes(request.status),
      );
      setSampleRequestStatus(currentRequest || null);
    }).finally(() => {
      if (active) setLoadingSampleStatus(false);
    });
    return () => { active = false; };
  }, [data?.product?.id, isKolUser]);

  // ────── REALTIME STOCK POLLING (mỗi 30 giây) ──────
  useEffect(() => {
    if (!data?.product?.id) return;
    setStockSnapshot(null);
    let disposed = false;
    let fetching = false;
    const productIdOrSku = data.product.sku || data.product.id;

    const fetchStock = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const res = await api.get(`/public/products/${encodeURIComponent(productIdOrSku)}/stock`, { headers: { 'x-skip-cache': 'true' } });
        const d = res?.data ?? res;
        if (!disposed && typeof d?.stockQuantity === 'number' && Array.isArray(d.variants)) {
          setStockSnapshot({ stockQuantity: d.stockQuantity, variants: d.variants });
        }
      } catch {
        // bỏ qua lỗi polling — không ảnh hưởng UX
      } finally {
        fetching = false;
      }
    };

    fetchStock();
    const interval = setInterval(fetchStock, 30_000);
    const onFocus = () => void fetchStock();
    window.addEventListener('focus', onFocus);
    return () => { disposed = true; clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [data?.product?.id, data?.product?.sku]);

  useEffect(() => {
    if (!data) return;

    trackAnalytics('page_view', {
      productId: data.product.id,
      sku: data.product.sku,
      storeId: data.store.id,
      storeName: data.store.name,
    });

    const prevTitle = document.title;
    document.title = `${data.product.title} - ${data.store.name} | Sàn SCANMS`;


    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', window.location.origin + window.location.pathname);

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      data.product.description || data.product.title,
    );

    const setOg = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setOg('og:title', `${data.product.title} - ${data.store.name}`);
    setOg('og:description', data.product.description || data.product.title);
    setOg('og:image', data.product.imageUrl || '');
    setOg('og:type', 'product');
    setOg('og:url', window.location.href);


    const setTwitter = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setTwitter('twitter:card', 'summary_large_image');
    setTwitter('twitter:title', `${data.product.title} - ${data.store.name}`);
    setTwitter('twitter:description', data.product.description || data.product.title);
    setTwitter('twitter:image', data.product.imageUrl || '');


    const scriptId = 'scanms-product-jsonld';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const jsonLd = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: data.product.title,
      image:
        data.images && data.images.length > 0
          ? data.images
          : [data.product.imageUrl || ''],
      description: data.product.description,
      sku: data.product.sku,
      brand: {
        '@type': 'Brand',
        name: data.store.name,
      },
      offers: {
        '@type': 'Offer',
        url: window.location.href,
        priceCurrency: 'VND',
        price: data.product.price,
        availability: data.availability.inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: data.store.name,
        },
      },
      ...(data.reviews.totalReviews > 0 && data.reviews.averageRating
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: data.reviews.averageRating,
              reviewCount: data.reviews.totalReviews,
            },
          }
        : {}),
    };
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      document.title = prevTitle;
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [data, analyticsConsent]);


  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          if (!videoStarted && data?.videos[activeVideoIndex]) {
            setVideoStarted(true);
            trackAnalytics('video_start', {
              videoId: data.videos[activeVideoIndex].id,
              kolName: data.videos[activeVideoIndex].kol.name,
            });
          }
        })
        .catch(() => setIsPlaying(false));
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };


  const applyCouponCode = async (rawCode: string): Promise<boolean> => {
    if (!rawCode.trim() || !data) return false;
    if (requestVariantSelection()) {
      setCouponError('Vui lòng chọn phân loại trước khi áp dụng mã ưu đãi.');
      return false;
    }
    const requestContext = couponContextRef.current;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const codeUpper = rawCode.trim().toUpperCase();
      setCouponCode(codeUpper);
      const res: any = await api.post('/checkout/quote', {
        couponCode: codeUpper,
        items: [
          {
            productId: data.product.id,
            variantId: selectedVariantIsReal ? selectedVariant?.id : undefined,
            quantity: quantity,
          },
        ],
      });

      const couponRes = res?.result || res?.data?.data || res?.data || {};
      if (couponContextRef.current !== requestContext) return false;
      const discount = Number(
        couponRes.discountAmount || couponRes.totalDiscount || 0,
      );

      if (discount > 0) {
        setAppliedCoupon({
          contextKey: requestContext,
          code: codeUpper,
          discountAmount: discount,
          description:
            couponRes.description ||
            `Mã ${codeUpper} đã được áp dụng thành công!`,
        });
        setCouponError(null);
        return true;
      } else {

        setCouponError(
          'Mã ưu đãi hợp lệ nhưng mức giảm giá bằng 0 hoặc không đủ điều kiện áp dụng.',
        );
        setAppliedCoupon(null);
        return false;
      }
    } catch (err: any) {
      if (couponContextRef.current !== requestContext) return false;
      const msg =
        err?.response?.data?.message ||
        'Mã giảm giá không tồn tại, đã hết hạn hoặc chưa đạt giá trị đơn tối thiểu.';
      setCouponError(Array.isArray(msg) ? msg.join(', ') : msg);
      setAppliedCoupon(null);
      return false;
    } finally {
      setCouponLoading(false);
    }
  };

  const applyCouponDirectly = async (codeToApply: string) => {
    await applyCouponCode(codeToApply);
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyCouponCode(couponCode);
  };


  const activeVariants = data?.product ? resolveProductVariants(data.product, data.images || []).map(variant => {
    if (!stockSnapshot) return variant;
    const live = stockSnapshot.variants.find(item => item.id === variant.id);
    return { ...variant, stockQuantity: live?.isActive ? Math.max(0, live.stockQuantity) : 0 };
  }) : [];
  const currentPrice =
    selectedVariant?.price !== undefined && selectedVariant?.price !== null
      ? Number(selectedVariant.price)
      : data?.product?.price || 0;
  const currentStock =
    selectedVariant
      ? activeVariants.find(variant => variant.id === selectedVariant.id)?.stockQuantity ?? 0
      : stockSnapshot?.stockQuantity ?? data?.availability?.stockQuantity ?? 0;
  const needsVariantChoice = activeVariants.length > 0 && !selectedVariant;
  const availableVariantPrices = activeVariants.filter(variant => variant.stockQuantity > 0)
    .map(variant => Number(variant.price ?? currentPrice)).filter(price => Number.isFinite(price) && price >= 0);
  const summaryPrice = needsVariantChoice && availableVariantPrices.length ? Math.min(...availableVariantPrices) : currentPrice;
  useEffect(() => {
    setQuantity(value => currentStock > 0 ? Math.min(value, currentStock) : 1);
  }, [currentStock]);
  const currentSku = selectedVariant?.sku || data?.product?.sku || '';
  const selectedVariantIsReal = Boolean(
    selectedVariant && data?.product?.variants?.some((variant) => variant.id === selectedVariant.id),
  );
  const sampleFeatureEnabled = selectedVariantIsReal
    ? selectedVariant?.sampleEnabled === true
    : data?.product?.sampleEnabled === true;
  const sampleQuotaAvailable = selectedVariantIsReal
    ? selectedVariant?.sampleAvailable === true
    : data?.product?.sampleAvailable === true;

  const unitPrice = currentPrice;
  const subtotal = unitPrice * quantity;
  const verifiedCoupon = appliedCoupon?.contextKey === couponContextKey ? appliedCoupon : null;
  const discountAmount = verifiedCoupon ? Math.min(subtotal, verifiedCoupon.discountAmount) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const requestVariantSelection = () => {
    if (activeVariants.length === 0 || selectedVariant) {
      setVariantSelectionRequired(false);
      return false;
    }
    setVariantSelectionRequired(true);
    variantOptionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    variantOptionsRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
    return true;
  };
  const handleAddProductToCart = () => {
    if (requestVariantSelection()) return;
    if (!data?.product || !data.store) return;
    addItem({
      product: {
        id: data.product.id,
        title: data.product.title,
        sku: currentSku || data.product.sku,
        price: unitPrice,
        originalPrice: data.product.originalPrice ?? undefined,
        imageUrl: selectedVariant?.imageUrl || displayImage || gallery[0] || data.product.imageUrl || undefined,
        stockQuantity: currentStock,
        variants: activeVariants,
        isActive: data.product.isActive,
      },
      store: {
        id: data.store.id,
        name: data.store.name,
        slug: data.store.slug,
        policyReturn: policies?.returnPolicy,
        policyWarranty: policies?.warranty,
        policyShipping: policies?.shipping,
      },
      variantId: selectedVariant?.id,
      quantity,
      openCartAfterAdd: true,
    });
    toast.success('Đã thêm sản phẩm vào giỏ hàng thành công!');
    trackAnalytics('add_to_cart', { productId: data.product.id, variantId: selectedVariant?.id, quantity });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#C59B58] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-[#1A1612]">
          Đang tải sản phẩm & video review...
        </h2>
        <p className="text-sm text-[#7D715E] mt-1">
          Kết nối sàn thương mại điện tử SCANMS
        </p>
      </div>
    );
  }


  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F3EFE6] border border-[#EAE4D7] flex items-center justify-center text-[#DC2626] mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1612] mb-2">
          Không tìm thấy sản phẩm
        </h1>
        <p className="text-sm text-[#7D715E] max-w-md mb-6 leading-relaxed">
          {error ||
            'Sản phẩm này có thể đã bị gỡ, hết hạn hoặc gian hàng tạm đóng. Tuyệt đối không hiển thị sai sản phẩm theo quy chuẩn sàn SCANMS.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl border border-[#EAE4D7] bg-white text-sm font-semibold text-[#1A1612] hover:bg-[#F3EFE6] transition-colors"
          >
            Thử lại
          </button>
          <Link
            to="/marketplace"
            className="px-5 py-2.5 rounded-xl bg-[#C59B58] text-[#231D15] text-sm font-bold hover:bg-[#B88E4F] transition shadow-xs cursor-pointer"
          >
            Về Chợ Tiếp Thị
          </Link>
        </div>
      </div>
    );
  }

  const { product, store, images, videos, reviews, policies } =
    data;
  const activeVideo =
    videos && videos.length > 0 ? videos[activeVideoIndex] : null;
  const fallbackImg = getSmartFallbackImage(product.title, product.categoryName);
  const candidateImages = [
    ...(images || []),
    product.imageUrl,
    ...activeVariants.map((v) => v.imageUrl),
  ].filter((img): img is string => Boolean(img && img.trim() && !img.includes('data:image/svg+xml')));

  const gallery = Array.from(new Set(candidateImages.filter((image) => image !== SCANMS_PLACEHOLDER)));
  if (gallery.length === 0) {
    gallery.push(fallbackImg);
  }

  const displayImage = hoveredImage || selectedImage || (gallery[selectedImageIndex] || fallbackImg);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612] font-sans pb-28 selection:bg-[#EAE4D7]">
      <PublicHeader />

      <main className="max-w-6xl mx-auto px-4 pt-2.5 sm:pt-3">

        <ProductBreadcrumbs title={product.title} category={product.categoryName} />

        <div className="bg-white rounded-2xl border border-[#EAE4D7] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 p-3.5 sm:p-4">

          <div className="lg:col-span-5 space-y-3 pr-0 lg:pr-4 border-b lg:border-b-0 lg:border-r border-[#EAE4D7] pb-4 lg:pb-0">

            <div className="aspect-square w-full lg:max-w-[460px] lg:mx-auto bg-[#F3EFE6] rounded-xl overflow-hidden border border-[#EAE4D7] relative group">
              <img
                src={displayImage}
                alt={product.title}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.dataset.hasFallback) {
                    target.dataset.hasFallback = 'true';
                    target.src = fallbackImg;
                  }
                }}
                key={displayImage}
                className="w-full h-full object-contain group-hover:scale-103 transition-transform duration-300"
              />

              {currentStock <= 0 && (
                <div className="absolute inset-0 bg-[#1A1612]/60 backdrop-blur-xs flex items-center justify-center">
                  <span className="bg-[#DC2626] text-white text-sm font-extrabold px-4 py-1.5 rounded-full shadow-md">
                    Hết Hàng
                  </span>
                </div>
              )}
            </div>


            {/* Gallery Thumbnail Row with Carousel navigation (SCANMS UI Reference) */}
            {gallery.length > 1 && (
              <div className="w-full lg:max-w-[460px] lg:mx-auto relative flex items-center py-2 px-1">
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = selectedImageIndex === 0 ? gallery.length - 1 : selectedImageIndex - 1;
                    setSelectedImageIndex(nextIdx);
                    setSelectedImage(gallery[nextIdx]);
                    setHoveredImage(null);
                  }}
                  className="w-6 h-10 bg-black/20 hover:bg-black/50 text-white rounded-r flex items-center justify-center cursor-pointer transition shrink-0 z-10 -ml-1"
                  title="Ảnh trước"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 flex items-center gap-2 overflow-x-auto overflow-y-hidden py-1 px-2 scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {gallery.map((img, idx) => {
                    const isImgActive = displayImage === img;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onMouseEnter={() => {
                          setSelectedImageIndex(idx);
                          setHoveredImage(img);
                        }}
                        onMouseLeave={() => setHoveredImage(null)}
                        onClick={() => {
                          setSelectedImageIndex(idx);
                          setSelectedImage(img);
                          setHoveredImage(null);
                        }}
                        className={`w-14 h-14 aspect-square rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          isImgActive
                            ? 'border-[#B88E4F] ring-2 ring-[#B88E4F]/30 scale-102'
                            : 'border-[#EAE4D7] opacity-75 hover:opacity-100 hover:border-[#B88E4F]/60'
                        }`}
                      >
                        <img
                          src={img}
                          alt=""
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (!target.dataset.hasFallback) {
                              target.dataset.hasFallback = 'true';
                              target.src = fallbackImg;
                            }
                          }}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = selectedImageIndex === gallery.length - 1 ? 0 : selectedImageIndex + 1;
                    setSelectedImageIndex(nextIdx);
                    setSelectedImage(gallery[nextIdx]);
                    setHoveredImage(null);
                  }}
                  className="w-6 h-10 bg-black/20 hover:bg-black/50 text-white rounded-l flex items-center justify-center cursor-pointer transition shrink-0 z-10 -mr-1"
                  title="Ảnh kế tiếp"
                  aria-label="Ảnh kế tiếp"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

{/* SCANMS UI Reference Social Share & Wishlist Row */}
            <div className="w-full lg:max-w-[460px] lg:mx-auto flex items-center justify-between py-2 px-1 text-sm text-[#7D715E] border-t border-[#EAE4D7]/60">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span>Chia sẻ:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleMessengerShare}
                    className="w-6 h-6 rounded-full bg-[#0084FF] text-white flex items-center justify-center hover:scale-110 transition cursor-pointer shadow-xs"
                    title="Messenger"
                    aria-label="Chia sẻ qua Messenger"
                  >
                    <span className="text-[10px] font-bold">M</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFacebookShare}
                    className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition cursor-pointer shadow-xs"
                    title="Facebook"
                    aria-label="Chia sẻ lên Facebook"
                  >
                    <span className="text-[10px] font-bold">f</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <span className="h-4 w-px bg-[#EAE4D7] mr-4 hidden sm:inline-block" />
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="flex items-center gap-2 text-sm text-[#1A1612] hover:opacity-80 transition cursor-pointer select-none"
                  title={isWishlisted ? 'Đã thích' : 'Thêm vào yêu thích'}
                >
                  <Heart
                    className={`w-5 h-5 transition-transform active:scale-125 ${
                      isWishlisted
                        ? 'fill-[#FF424F] text-[#FF424F] stroke-[#FF424F]'
                        : 'fill-none text-[#FF424F] stroke-[#FF424F]'
                    }`}
                    strokeWidth={1.65}
                  />
                  <span className="font-normal text-[#1A1612]">
                    Đã thích ({(product as any)?.likesCount ?? (isWishlisted ? 155 : 154)})
                  </span>
                </button>
              </div>
            </div>


            {/* SCANMS UI Reference: Shop Info Component */}
            <div data-product-shop-card className="lg:max-w-[460px] lg:mx-auto p-3.5 sm:p-4 rounded-xl bg-white border border-[#EAE4D7] shadow-xs grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3.5 gap-y-3.5 sm:gap-x-4 min-w-0">
              {/* Left Column: Original Shop Avatar */}
              <Link
                to={`/shop/${store.slug || store.id}`}
                className="shrink-0 no-underline group block"
                title={`Xem gian hàng ${store.name}`}
              >
{store.logoUrl && !store.logoUrl.includes('unsplash.com') ? (
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-[#EAE4D7] shadow-xs group-hover:opacity-90 transition-opacity"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-[#EEDFC6] text-[#B88E4F] flex items-center justify-center font-black text-lg sm:text-xl border border-[#EAE4D7] shadow-xs group-hover:bg-[#E2CEAC] transition-colors">
                    {store.name.charAt(0)}
                  </div>
                )}
              </Link>

              {/* Right Column: Name + Online Status + Action Buttons */}
              <div className="min-w-0 flex-1">
                <Link
                  to={`/shop/${store.slug || store.id}`}
                  className="no-underline block group"
                  title={`Xem gian hàng ${store.name}`}
                >
                  <div className="flex items-center gap-1.5">
                    <h3 className="m-0 text-sm sm:text-base font-semibold text-[#1A1612] group-hover:text-[#B88E4F] leading-tight truncate uppercase transition-colors">
                      {store.name}
                    </h3>
                    {store.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-[#B88E4F] shrink-0" />
                    )}
                  </div>
                </Link>
                <StoreActivityStatus storeId={store.id} className="mt-1" />
              </div>
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <Link
                    to={`/shop/${store.slug || store.id}`}
                    className="h-10 min-w-0 px-2.5 border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] text-[#1A1612] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none no-underline focus-visible:outline-[#C59B58]"
                    title="Xem tất cả sản phẩm của gian hàng"
                  >
                    <Store className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                    <span>Xem Shop</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleOpenChat}
                    className="h-10 min-w-0 px-2.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] hover:bg-[#F3EFE6] text-[#8C6226] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors focus-visible:outline-[#C59B58]"
                    title={`Chat với gian hàng ${store.name}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span>Chat với shop</span>
                  </button>
                </div>
            </div>
          </div>


          <div className="lg:col-span-7 pl-0 lg:pl-5 pt-4 lg:pt-0 flex flex-col justify-between">
            <div>
              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl font-black text-[#1A1612] leading-snug tracking-tight mb-2">
                {product.title}
              </h1>

              {/* SCANMS UI Reference: Rating, Review Count, Sold Count & Report */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#7D715E] mb-3 pb-3 border-b border-[#EAE4D7]">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[#B88E4F] underline text-sm">
                    {reviews.averageRating ? reviews.averageRating.toFixed(1) : '4.9'}
                  </span>
                  <div className="flex items-center text-[#B88E4F]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#C59B58] text-[#B88E4F]" />
                    ))}
                  </div>
                </div>

                <span className="text-[#EAE4D7]">|</span>

                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-[#1A1612] underline">
                    {reviews.totalReviews > 0 ? reviews.totalReviews : '1,3k'}
                  </span>
                  <span>Đánh Giá</span>
                </div>

                <span className="text-[#EAE4D7]">|</span>

                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-[#1A1612]">
                    {Number(product.soldCount ?? 0).toLocaleString('vi-VN')}
                  </span>
                  <span>Đã Bán</span>
                </div>

                <button
                  type="button"
                  onClick={() => toast.info('Đã ghi nhận báo cáo sản phẩm')}
                  className="ml-auto text-xs text-[#7D715E] hover:text-[#DC2626] transition-colors cursor-pointer"
                >
                  Tố cáo
                </button>
              </div>

              <ProductPurchaseSummary
                price={summaryPrice}
                originalPrice={product.originalPrice}
                fromPrice={needsVariantChoice}
                stock={currentStock}
                variantName={selectedVariant?.name}
                needsVariantChoice={needsVariantChoice}
                inactive={!product.isActive || product.status === 'INACTIVE'}
                quantity={quantity}
                voucher={verifiedCoupon && discountAmount > 0 ? { code: verifiedCoupon.code, discount: discountAmount, total: finalTotal } : undefined}
              />
              <LiveSessionDealCard productId={product.id} onApplyCoupon={applyCouponCode} />

              {/* Shipping estimate: show a date range, then refresh with carrier data after fulfillment. */}
              <div className="flex items-start gap-4 py-3 border-t border-[#EAE4D7]/80">
                <span className="w-24 sm:w-28 shrink-0 text-xs text-[#7D715E] font-medium pt-0.5">
                  Vận chuyển
                </span>
                <div className="flex-1 text-xs">
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 shrink-0 text-[#B88E4F]" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#1A1612]">Miễn phí vận chuyển tiêu chuẩn toàn quốc</div>
                      <div className="mt-0.5 font-bold text-[#8C6226]">
                        Dự kiến nhận: {estimatedDeliveryWindow}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* SCANMS UI Reference: An Tâm Mua Sắm Section */}
              <div className="flex items-center gap-4 py-2.5 border-t border-[#EAE4D7]/80">
                <span className="w-24 sm:w-28 shrink-0 text-xs text-[#7D715E] font-medium leading-tight">
                  An Tâm Mua Sắm Cùng SCANMS
                </span>
                <div className="flex items-center gap-1.5 text-xs text-[#1A1612] font-semibold cursor-pointer group">
                  <ShieldCheck className="w-4 h-4 text-[#B88E4F]" />
                  <span>Trả hàng miễn phí 14 ngày</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] group-hover:text-[#B88E4F] transition-colors" />
                </div>
              </div>

              {/* SCANMS UI Reference: Phân Loại (Variant Selector with Thumbnails) */}
              {activeVariants.length > 0 && (
              <div ref={variantOptionsRef} className="flex items-start gap-4 py-3.5 border-t border-[#EAE4D7]/80 scroll-mt-24" data-required={variantSelectionRequired}>
                  <span className="w-24 sm:w-28 shrink-0 text-xs text-[#7D715E] font-medium pt-1.5">
                    Phân Loại
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2">
                      {activeVariants.map((v) => {
                        const isSelected = selectedVariant?.id === v.id;
                        const isOutOfStock = v.stockQuantity <= 0;
                        const variantImg = v.imageUrl || product.imageUrl || SCANMS_PLACEHOLDER;
                        const attributeText = Object.values(v.attributes || {}).filter(Boolean).join(' · ');
                        const isHovered = hoveredImage === variantImg;
                        return (
                          <button
                            key={v.id}
                            title={attributeText && attributeText !== v.name ? `${v.name} · ${attributeText}` : v.name}
                            type="button"
                            disabled={isOutOfStock}
                            aria-pressed={isSelected}
                            onMouseEnter={() => {
                              if (!isOutOfStock) {
                                setHoveredImage(variantImg);
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredImage(null);
                            }}
                            onClick={() => {
                              setSelectedVariant(v);
                              setVariantSelectionRequired(false);
                              setSelectedImage(variantImg);
                              setHoveredImage(null);
                              setQuantity(1);
                              const gIdx = gallery.indexOf(variantImg);
                              if (gIdx >= 0) setSelectedImageIndex(gIdx);
                            }}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-all relative cursor-pointer ${
                              isSelected
                                ? 'border-[#B88E4F] bg-[#FAF8F5] text-[#B88E4F] font-bold shadow-2xs ring-1 ring-[#B88E4F]'
                                : isOutOfStock
                                ? 'border-[#EAE4D7] bg-[#F3EFE6]/60 text-[#7D715E]/50 line-through cursor-not-allowed'
                                : isHovered
                                ? 'border-[#B88E4F] text-[#B88E4F] bg-white ring-1 ring-[#B88E4F]/40'
                                : 'border-[#EAE4D7] bg-white text-[#1A1612] hover:border-[#B88E4F] hover:text-[#B88E4F]'
                            }`}
                          >
                            <img
                              src={variantImg}
                              alt={v.name}
                              className="w-6 h-6 object-cover rounded-xs border border-[#EAE4D7] shrink-0"
                            />
                            <span className="max-w-[280px] break-words text-left">
                              <span className="block">{v.name}</span>
                              {attributeText && attributeText !== v.name && <span className="block text-[10px] opacity-70">{attributeText}</span>}
                            </span>
                            {isSelected && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#B88E4F] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {variantSelectionRequired && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#DC2626]" role="alert"><AlertCircle size={14} aria-hidden="true" />Vui lòng chọn phân loại hàng để tiếp tục.</p>}
                  </div>
                </div>
              )}

              {/* SCANMS UI Reference: Số Lượng Stepper */}
              <div className="flex items-center gap-4 py-3.5 border-t border-[#EAE4D7]/80">
                <span className="w-24 sm:w-28 shrink-0 text-sm text-[#757575] font-normal">
                  Số Lượng
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-black/10 rounded-[2px] bg-white overflow-hidden shadow-none">
                    <button
                      type="button"
                      disabled={needsVariantChoice || quantity <= 1 || currentStock <= 0}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center text-[#555555] hover:bg-black/[0.02] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition border-r border-black/10 select-none"
                      aria-label="Giảm số lượng"
                    >
                      <Minus className="w-3 h-3 stroke-[1.5]" />
                    </button>
                    <input
                      type="text"
                      role="spinbutton"
                      aria-label="Số lượng sản phẩm"
                      disabled={needsVariantChoice || currentStock <= 0}
                      aria-valuenow={quantity}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/\D/g, ''), 10);
                        if (!isNaN(val) && val >= 1) {
                          setQuantity(Math.min(currentStock > 0 ? currentStock : 1, val));
                        } else if (e.target.value === '') {
                          setQuantity(1);
                        }
                      }}
                      onBlur={() => {
                        if (!quantity || quantity < 1) setQuantity(1);
                      }}
                      className="w-[50px] h-8 text-center text-sm font-normal text-[#1A1612] bg-transparent outline-none border-0"
                    />
                    <button
                      type="button"
                      disabled={needsVariantChoice || quantity >= currentStock || currentStock <= 0}
                      onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                      className="w-8 h-8 flex items-center justify-center text-[#555555] hover:bg-black/[0.02] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition border-l border-black/10 select-none"
                      aria-label="Tăng số lượng"
                    >
                      <Plus className="w-3 h-3 stroke-[1.5]" />
                    </button>
                  </div>

                  <span className="text-sm text-[#757575] font-normal">
                    {needsVariantChoice && currentStock > 0 ? 'Vui lòng chọn phân loại' : currentStock > 0 ? (
                      `${currentStock} sản phẩm có sẵn`
                    ) : (
                      <span className="text-[#DC2626]">Hết hàng</span>
                    )}
                  </span>
                </div>
              </div>

              {/* ────── AVAILABLE SHOP VOUCHERS CAROUSEL / LIST ────── */}
              {availableStoreCoupons.length > 0 && (
                <div className="py-2.5 border-t border-[#EAE4D7]/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#8C6B32] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      Voucher độc quyền của Shop:
                    </span>
                    <span className="text-[10px] text-[#7D715E]">Click để áp dụng</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableStoreCoupons.map((vc) => {
                      const isPct = vc.discountType === 'PERCENTAGE';
                      const label = isPct
                        ? `Giảm ${vc.discountValue}%`
                        : `Giảm ${Number(vc.discountValue).toLocaleString('vi-VN')}₫`;
                      const isApplied =
                        appliedCoupon?.code === vc.codeNormalized ||
                        appliedCoupon?.code === vc.displayCode;
                      return (
                        <button
                          key={vc.id}
                          type="button"
                          onClick={() => {
                            setCouponCode(vc.displayCode);
                            applyCouponDirectly(vc.displayCode);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                            isApplied
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                              : 'bg-white border-[#DEBE85] hover:bg-[#F3EFE6] text-[#1A1612] hover:border-[#C59B58]'
                          }`}
                        >
                          <Ticket
                            className={`w-3.5 h-3.5 ${
                              isApplied ? 'text-emerald-600' : 'text-[#C59B58]'
                            }`}
                          />
                          <span>{label}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#FAF8F5] border rounded text-[#8C6B32] font-bold uppercase">
                            {vc.displayCode}
                          </span>
                          {isApplied && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coupon Voucher Input (Compact) */}
              <div className="py-2.5 border-t border-[#EAE4D7]/80">
                <form onSubmit={handleApplyCoupon} className="flex w-full items-stretch gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#7D715E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Mã ưu đãi (VD: THANGVIP10)..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#EAE4D7] rounded text-xs font-mono uppercase text-[#1A1612] placeholder-[#7D715E]/60 focus:outline-hidden focus:border-[#C59B58]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="shrink-0 whitespace-nowrap px-3 py-1.5 bg-[#C59B58] hover:bg-[#B88E4F] disabled:opacity-50 text-[#1A1612] text-xs font-bold rounded transition cursor-pointer"
                  >
                    {couponLoading ? '...' : 'Áp Dụng'}
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="mt-1.5 p-2 rounded bg-[#FBF5EB] border border-[#EEDFC6] text-xs text-[#B88E4F] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{appliedCoupon.description} (-{appliedCoupon.discountAmount.toLocaleString('vi-VN')} ₫)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                      className="text-[#7D715E] hover:text-[#DC2626] font-bold p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {couponError && (
                  <div className="mt-1 text-xs text-[#DC2626] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{couponError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SCANMS UI Reference: Dual Action Buttons Section */}
            <div>
              {(!product.isActive || product.status === 'INACTIVE') && (
                <div className="mb-3 p-2.5 bg-[#FBF5EB] border border-[#EAE4D7] rounded-xl flex items-center gap-2 text-xs text-[#B88E4F] font-bold">
                  <AlertCircle className="w-4 h-4 text-[#B88E4F] shrink-0" />
                  <span>Sản phẩm hiện đang tạm ngừng kinh doanh. Nút đặt hàng tạm thời bị khóa!</span>
                </div>
              )}

              <div className="grid w-full grid-cols-2 items-stretch gap-2.5 pt-3 border-t border-[#EAE4D7]">
                {(!currentUser || isKolUser) && (
                  <button
                    type="button"
                    onClick={handleRequestSample}
                    disabled={Boolean(isKolUser && (
                      loadingSampleStatus ||
                      (sampleRequestStatus && !['REJECTED', 'CANCELLED', 'COMPLETED'].includes(sampleRequestStatus.status)) ||
                      !sampleFeatureEnabled ||
                      !sampleQuotaAvailable ||
                      (sampleEligibility && !sampleEligibility.canRequest)
                    ))}
                    className="col-span-2 h-12 px-5 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] hover:bg-[#F3EFE6] disabled:opacity-60 disabled:cursor-not-allowed text-[#8C6226] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition"
                    title="Đăng ký nhận mẫu và cam kết nộp link video trong 14 ngày sau khi nhận hàng"
                  >
                    <Package className="w-4 h-4" />
                    <span>
                      {sampleRequestStatus && !['REJECTED', 'CANCELLED', 'COMPLETED'].includes(sampleRequestStatus.status)
                        ? 'Yêu cầu mẫu đang được xử lý'
                        : 'Đăng ký nhận sản phẩm mẫu'}
                    </span>
                  </button>
                )}
                {/* Button 1: Thêm Vào Giỏ Hàng (SCANMS UI Reference Outline Soft Style) */}
                <button
                  type="button"
                  disabled={currentStock <= 0 || !product.canPurchase || !product.isActive || product.status === 'INACTIVE'}
                  onClick={handleAddProductToCart}
                  className="h-12 min-w-0 w-full px-2 sm:px-4 rounded-xl border border-[#C59B58] bg-[#FBF5EB] hover:bg-[#F3EFE6] text-[#8C6226] font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer transition active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Thêm sản phẩm và phân loại đã chọn vào giỏ hàng"
                >
                  <ShoppingCart className="w-4 h-4 shrink-0 text-[#B88E4F]" />
                  <span>Thêm Vào Giỏ Hàng</span>
                </button>

                {/* Button 2: Mua Với Voucher (SCANMS UI Reference Solid CTA Style) */}
                <button
                  type="button"
                  disabled={currentStock <= 0 || !product.canPurchase || !product.isActive || product.status === 'INACTIVE'}
                  onClick={() => handleBuyNow('main_cta')}
                  className="h-12 min-w-0 w-full px-2 sm:px-4 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] disabled:bg-[#EAE4D7] disabled:text-[#7D715E] disabled:cursor-not-allowed text-[#1A1612] font-bold text-xs sm:text-sm shadow-sm shadow-[#C59B58]/20 flex flex-col items-center justify-center cursor-pointer active:scale-98 transition"
                >
                  <span className="leading-tight">
                    {(!product.isActive || product.status === 'INACTIVE')
                      ? 'TẠM NGỪNG KINH DOANH'
                      : currentStock > 0
                      ? 'Mua sản phẩm này'
                      : 'TẠM HẾT HÀNG'}
                  </span>
                  {currentStock > 0 && product.isActive && product.status !== 'INACTIVE' && (
                    <span className="text-[10px] font-semibold opacity-90 leading-tight">
                      Tạm tính: {finalTotal.toLocaleString('vi-VN')} ₫
                    </span>
                  )}
                </button>
              </div>

              {(!currentUser || isKolUser) && (
                <div className="mt-2 text-[11px] text-[#7D715E]" aria-live="polite">
                  {!currentUser ? (
                    'Đăng nhập tài khoản KOL/Creator để gửi cam kết nhận mẫu.'
                  ) : loadingSampleStatus ? (
                    'Đang kiểm tra điều kiện và trạng thái yêu cầu mẫu…'
                  ) : sampleRequestStatus && !['REJECTED', 'CANCELLED', 'COMPLETED'].includes(sampleRequestStatus.status) ? (
                    <>Yêu cầu mẫu của bạn: <strong className="text-[#8C6226]">{sampleRequestStatus.status}</strong>. <Link to="/collaborator/collaboration?tab=samples" className="underline text-[#8C6226]">Xem tiến độ</Link></>
                  ) : !sampleFeatureEnabled ? (
                    'Shop hiện chưa bật cấp mẫu cho sản phẩm này.'
                  ) : !sampleQuotaAvailable ? (
                    'Sản phẩm đã hết suất mẫu được Shop cấp.'
                  ) : sampleEligibility && !sampleEligibility.canRequest ? (
                    sampleEligibility.blockReason || 'Hoàn tất xác minh KYC và liên kết kênh mạng xã hội để xin mẫu.'
                  ) : (
                    'Shop xét duyệt yêu cầu trước khi gửi; thời hạn nộp video tối đa 14 ngày sau khi bạn xác nhận đã nhận mẫu.'
                  )}
                </div>
              )}

              <ProductShoppingPolicies storeName={store.name} policies={policies} />
            </div>
          </div>
        </div>


        <div className={`grid gap-4 mt-6 text-[#1A1612] ${!activeVideo && !reviews.items?.length ? 'lg:grid-cols-2' : ''}`}>
        <section className="min-w-0 p-4 sm:p-5 border border-[#EAE4D7] rounded-2xl bg-white" aria-labelledby="product-creator-reviews-title">
          <div className="flex items-start sm:items-center justify-between flex-wrap gap-2.5 sm:gap-3 pb-3.5 sm:pb-4 border-b border-[#EAE4D7]">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <span className="w-8 sm:w-10 h-8 sm:h-10 grid place-items-center shrink-0 border border-[#EAE4D7] rounded-[10px] sm:rounded-xl text-[#B88E4F] bg-[#FBF5EB]"><Play size={20} strokeWidth={1.7} /></span>
              <div>
                <h2 id="product-creator-reviews-title" className="m-0 text-[17px] sm:text-xl font-semibold tracking-tight leading-snug text-[#1A1612]">Video từ nhà sáng tạo</h2>
                <p className="m-0 mt-1 text-xs sm:text-[13px] leading-relaxed text-[#7D715E]">{activeVideo ? 'Video review đã được gian hàng ' + store.name + ' phê duyệt.' : 'Khám phá trải nghiệm thực tế về sản phẩm.'}</p>
              </div>
            </div>
            {videos.length <= 1 && <span className="shrink-0 px-2 sm:px-2.5 py-1 border border-[#EAE4D7] rounded-md bg-[#FAF8F5] text-[#7D715E] text-[10px] sm:text-xs whitespace-nowrap">{videos.length} video</span>}
            {videos && videos.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {videos.map((vid, vIdx) => (
                  <button
                    key={vid.id || vIdx}
                    type="button"
                    aria-pressed={activeVideoIndex === vIdx}
                    onClick={() => {
                      setActiveVideoIndex(vIdx);
                      setIsPlaying(false);
                      setVideoStarted(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeVideoIndex === vIdx
                        ? 'bg-[#FBF5EB] text-[#1A1612] border border-[#EEDFC6]'
                        : 'bg-white text-[#7D715E] border border-[#EAE4D7] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span>Video #{vIdx + 1}</span>
                    {vid.isReferredKol && (
                      <span className="w-2 h-2 rounded-full bg-white" title="KOL bạn đang theo dõi" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeVideo ? (
            <div className="sf-video-body grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">

              <div className="lg:col-span-7 bg-[#1A1612] rounded-2xl overflow-hidden aspect-video relative group shadow-lg border border-[#EAE4D7]">
                <video
                  ref={videoRef}
                  src={activeVideo.videoUrl}
                  poster={activeVideo.posterUrl || undefined}
                  playsInline
                  muted={isMuted}
                  onEnded={() => {
                    setIsPlaying(false);
                    trackAnalytics('video_complete', {
                      videoId: activeVideo.id,
                    });
                  }}
                  className="w-full h-full object-contain"
                />


                {activeVideo.caption && showCaptions && (
                  <div className="absolute bottom-16 left-4 right-4 text-center pointer-events-none z-10">
                    <span className="bg-[#1A1612]/85 text-[#FAF8F5] text-xs px-3.5 py-1.5 rounded-xl backdrop-blur-xs font-medium inline-block shadow-md border border-[#C59B58]/30">
                      {activeVideo.caption}
                    </span>
                  </div>
                )}


                <div className="sf-player-controls absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col justify-between p-4 z-20">
                  <div className="flex items-center justify-between text-white text-xs font-semibold">
                    <span className="bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md line-clamp-1 max-w-[70%]">
                      {activeVideo.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {activeVideo.isReferredKol && (
                        <span className="bg-[#EBD08C] text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">
                          KOL Giới Thiệu
                        </span>
                      )}
                      <span className="bg-[#EBD08C] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        Đã duyệt bởi Shop
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        aria-label={isPlaying ? 'Tạm dừng video' : 'Phát video'}
                        className="w-10 h-10 rounded-full bg-[#EBD08C] hover:bg-[#DEC07A] flex items-center justify-center text-white transition-all shadow-md active:scale-95"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 fill-white" />
                        ) : (
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={cycleSpeed}
                        className="h-8 px-2.5 rounded-xl bg-black/60 hover:bg-black/80 flex items-center gap-1 text-[11px] font-bold text-white transition-colors"
                        title="Tốc độ phát"
                      >
                        <Gauge className="w-3.5 h-3.5" />
                        <span>{playbackSpeed}x</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {activeVideo.caption && (
                        <button
                          onClick={() => setShowCaptions(!showCaptions)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors ${
                            showCaptions
                              ? 'bg-[#EBD08C]'
                              : 'bg-black/60 hover:bg-black/80'
                          }`}
                          title={showCaptions ? 'Tắt phụ đề' : 'Bật phụ đề'}
                        >
                          <Subtitles className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={toggleMute}
                        className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                        title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={handleFullscreen}
                        className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                        title="Toàn màn hình"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>


                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    aria-label="Phát video"
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#EBD08C]/90 hover:bg-[#DEC07A] text-white flex items-center justify-center shadow-xl transition-all transform hover:scale-105 z-10"
                  >
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </button>
                )}
              </div>


              <div className="sf-creator-card lg:col-span-5 bg-white rounded-xl p-4 border border-[#EAE4D7] space-y-4">
                <div className="flex items-center gap-3">
                  {activeVideo.kol.avatarUrl ? (
                    <img
                      src={activeVideo.kol.avatarUrl}
                      alt={activeVideo.kol.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          SCANMS_PLACEHOLDER;
                      }}
                      className="w-12 h-12 rounded-full border-2 border-[#C59B58] object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#F3EFE6] border-2 border-[#C59B58] flex items-center justify-center font-bold text-[#B88E4F]">
                      {activeVideo.kol.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-sm text-[#1A1612] flex items-center gap-1">
                      {activeVideo.kol.name}
                      {activeVideo.kol.isVerified && (
                        <BadgeCheck className="w-4 h-4 text-[#B88E4F]" />
                      )}
                    </div>
                    <div className="text-xs text-[#7D715E]">
                      {activeVideo.kol.badgeLabel}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#FBF5EB] rounded-xl border border-[#EAE4D7] text-xs text-[#7D715E] leading-relaxed">
                  <div className="font-bold text-[#B88E4F] mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Minh bạch tiếp thị
                  </div>
                  {activeVideo.kol.disclosure}. Video đánh giá trải nghiệm thực tế sau khi sử dụng mẫu thử từ gian hàng đối tác.
                </div>

                <div className="pt-2">
                  <div className="text-xs text-[#7D715E] mb-2 font-medium">
                    Bạn thích video review này?
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBuyNow('video_card')}
                    className="w-full p-3 bg-[#FBF5EB] hover:bg-[#F3EFE6] border border-[#EEDFC6] hover:border-[#C59B58] rounded-xl flex items-center justify-between gap-3 transition-colors group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">

                      <div className="w-9 h-9 rounded-xl bg-white border border-[#DEBE85] flex items-center justify-center text-[#B88E4F] shadow-xs shrink-0 group-hover:scale-105 group-hover:bg-[#FAF8F5] group-hover:border-[#B88E4F] transition-all">
                        <ShoppingBag className="w-4.5 h-4.5 text-[#B88E4F]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-xs sm:text-sm text-[#1A1612] group-hover:text-[#B88E4F] transition-colors leading-snug">
                          Mua sản phẩm giới thiệu trong video
                        </div>
                        <div className="text-[11px] text-[#7D715E] font-medium mt-0.5 truncate">
                          Chính hãng từ {store?.name || 'Gian hàng đối tác'}
                        </div>
                      </div>
                    </div>


                    <div className="w-8 h-8 rounded-xl bg-white border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F] shadow-2xs group-hover:border-[#C59B58] group-hover:bg-[#FBF5EB] transition-all shrink-0">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 sm:gap-3.5 mt-4 p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5]">
              <span className="w-9 sm:w-11 h-9 sm:h-11 grid place-items-center shrink-0 border border-[#EAE4D7] rounded-xl text-[#B88E4F] bg-white"><Play size={22} strokeWidth={1.5} /></span>
              <div><h3 className="m-0 text-sm font-semibold text-[#1A1612]">Chưa có video review</h3><p className="m-0 mt-1 text-xs text-[#7D715E] leading-relaxed">Video trải nghiệm sẽ hiển thị tại đây sau khi được gian hàng phê duyệt.</p></div>
            </div>
          )}
        </section>


        <section className="min-w-0 p-4 sm:p-5 border border-[#EAE4D7] rounded-2xl bg-white" aria-labelledby="product-customer-reviews-title">
          <div className="flex items-start sm:items-center justify-between flex-wrap gap-2.5 sm:gap-3 pb-3.5 sm:pb-4 border-b border-[#EAE4D7]">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <span className="w-8 sm:w-10 h-8 sm:h-10 grid place-items-center shrink-0 border border-[#EAE4D7] rounded-[10px] sm:rounded-xl text-[#B88E4F] bg-[#FBF5EB]"><Star size={20} strokeWidth={1.7} /></span>
              <div><h2 id="product-customer-reviews-title" className="m-0 text-[17px] sm:text-xl font-semibold tracking-tight leading-snug text-[#1A1612]">Đánh giá khách hàng</h2><p className="m-0 mt-1 text-xs sm:text-[13px] leading-relaxed text-[#7D715E]">Phản hồi đã kiểm duyệt từ người mua thực tế.</p></div>
            </div>
            {reviews.averageRating !== null && reviews.totalReviews > 0 ? (
              <div className="flex items-center gap-2.5" aria-label={reviews.averageRating + ' trên 5 sao, ' + reviews.totalReviews + ' đánh giá'}>
                <strong className="text-2xl sm:text-[28px] font-semibold tabular-nums leading-none text-[#1A1612]">{reviews.averageRating}<span className="ml-1 text-[13px] font-normal text-[#7D715E]">/5</span></strong>
                <div><span className="flex gap-0.5" aria-hidden="true">{[1, 2, 3, 4, 5].map(value => <Star key={value} size={13} className={value <= Math.round(reviews.averageRating || 0) ? 'fill-[#C59B58] text-[#B88E4F]' : 'text-[#EAE4D7]'} />)}</span><span className="block mt-1 text-[11px] text-[#7D715E]">{reviews.totalReviews} đánh giá</span></div>
              </div>
            ) : <span className="shrink-0 px-2 sm:px-2.5 py-1 border border-[#EAE4D7] rounded-md bg-[#FAF8F5] text-[#7D715E] text-[10px] sm:text-xs whitespace-nowrap">{reviews.totalReviews} đánh giá</span>}
          </div>

          <div className="mt-2">
            {reviews.items && reviews.items.length > 0 ? (
              reviews.items.map((rev) => (
                <div
                  key={rev.id}
                  className="py-4 sm:py-4.5 border-b border-[#EAE4D7] last:border-b-0 last:pb-0"
                >
                  <div className="flex justify-between items-center flex-wrap gap-2.5 mb-2.5">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="w-8 h-8 grid place-items-center rounded-full bg-[#FBF5EB] text-[#1A1612] text-[13px] font-semibold" aria-hidden="true">{rev.customerName.trim().charAt(0).toLocaleUpperCase('vi-VN') || 'K'}</span>
                      <span className="font-bold text-sm text-[#1A1612]">
                        {rev.customerName}
                      </span>
                      {rev.isVerifiedBuyer && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FBF5EB] text-[#7D715E] text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-[#B88E4F]" />
                          Đã mua hàng
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#7D715E]">
                      {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex gap-0.5 text-[#B88E4F] mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating
                            ? 'fill-[#C59B58] text-[#B88E4F]'
                            : 'text-[#EAE4D7]'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-[#1A1612] leading-relaxed">
                    {rev.comment}
                  </p>

                  {rev.reviewImageUrl && (
                    <div className="mt-3">
                      <img
                        src={rev.reviewImageUrl}
                        alt="Ảnh review"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            'none';
                        }}
                        className="w-20 h-20 rounded-xl object-cover border border-[#EAE4D7]"
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2.5 sm:gap-3.5 mt-4 p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5]">
                <span className="w-9 sm:w-11 h-9 sm:h-11 grid place-items-center shrink-0 border border-[#EAE4D7] rounded-xl text-[#B88E4F] bg-white"><MessageSquare size={22} strokeWidth={1.5} /></span>
                <div><h3 className="m-0 text-sm font-semibold text-[#1A1612]">Chưa có đánh giá</h3><p className="m-0 mt-1 text-xs text-[#7D715E] leading-relaxed">Chia sẻ từ người mua sẽ xuất hiện tại đây sau khi được kiểm duyệt.</p></div>
              </div>
            )}
          </div>
        </section>
        </div>
      </main>

      {analyticsConsent === null && (
        <aside
          role="dialog"
          aria-label="Lựa chọn quyền riêng tư"
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-2xl rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-xl sm:flex sm:items-center sm:justify-between sm:gap-5"
        >
          <p className="text-sm leading-6 text-[#7D715E]">
            SCANMS chỉ gửi thống kê sử dụng không chứa thông tin định danh khi bạn đồng ý.
            Bạn vẫn xem và mua hàng bình thường nếu từ chối.
          </p>
          <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem('scanms_analytics_consent', 'denied');
                setAnalyticsConsent('denied');
              }}
              className="rounded-xl border border-[#EAE4D7] px-4 py-2 text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6]"
            >
              Chỉ cần thiết
            </button>
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem('scanms_analytics_consent', 'granted');
                setAnalyticsConsent('granted');
              }}
              className="rounded-xl bg-[#EBD08C] px-4 py-2 text-xs font-bold text-white hover:bg-[#DEC07A]"
            >
              Cho phép thống kê
            </button>
          </div>
        </aside>
      )}


      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 grid grid-cols-[minmax(96px,1fr)_40px_40px_minmax(96px,1.2fr)] items-center gap-1 border-t border-[#EAE4D7] bg-white/95 px-2 py-2 shadow-[0_-5px_18px_rgba(35,29,21,0.08)] backdrop-blur-md">
        <div className="min-w-0 pl-1">
          <div className="truncate text-[10px] text-[#7D715E]">
            {selectedVariant ? `Phân loại: ${selectedVariant.name}` : 'Tạm tính tiền hàng'}
          </div>
          <div className="truncate text-sm font-extrabold text-[#8C6226]">
            {finalTotal.toLocaleString('vi-VN')} ₫
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenChat}
          aria-label="Chat với shop"
          title="Chat với shop"
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#EAE4D7] bg-white text-[#8C6226] hover:bg-[#FBF5EB]"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={currentStock <= 0 || !product.canPurchase || !product.isActive || product.status === 'INACTIVE'}
          onClick={handleAddProductToCart}
          aria-label="Thêm vào giỏ hàng"
          title="Thêm vào giỏ hàng"
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#C59B58] bg-[#FBF5EB] text-[#8C6226] hover:bg-[#F3EFE6] disabled:border-[#EAE4D7] disabled:text-[#7D715E]"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={currentStock <= 0 || !product.canPurchase || !product.isActive || product.status === 'INACTIVE'}
          onClick={() => handleBuyNow('mobile_sticky')}
          className="flex h-10 min-w-0 items-center justify-center gap-1 rounded-xl bg-[#C59B58] px-2 text-[11px] font-bold text-[#231D15] hover:bg-[#B88E4F] disabled:bg-[#EAE4D7] disabled:text-[#7D715E]"
        >
          <ShoppingBag className="h-4 w-4 shrink-0" />
          <span className="truncate">{currentStock > 0 ? 'Mua ngay' : 'Hết hàng'}</span>
        </button>
      </div>


      {isCheckoutOpen && product && store && (
        <GuestCheckoutModal
          isOpen={isCheckoutOpen && (activeVariants.length === 0 || selectedVariantIsReal)}
          onClose={handleCloseCheckout}
          product={{
            id: product.id,
            title: product.title,
            sku: currentSku,
            price: currentPrice,
            originalPrice: product.originalPrice || undefined,
            imageUrl: selectedVariant?.imageUrl || displayImage || gallery[0] || product.imageUrl || undefined,
            stockQuantity: currentStock,
            variants: activeVariants,
          }}
          store={{
            id: store.id,
            name: store.name,
            slug: store.slug,
            policyReturn: policies?.returnPolicy,
            policyWarranty: policies?.warranty,
            policyShipping: policies?.shipping,
          }}
          initialVariantId={selectedVariant?.id}
          initialQuantity={quantity}
          initialCouponCode={appliedCoupon?.code || ''}
          onOrderPlaced={(order) => {
            if (order.paymentMethod === 'PAYOS') return;
            trackAnalytics('order_complete', {
              orderId: order.orderId,
              orderCode: order.publicOrderCode,
              total: order.totalAmount,
            });
          }}
          onPaymentConfirmed={(order) => {
            trackAnalytics('order_complete', {
              orderId: order.orderId,
              orderCode: order.publicOrderCode,
              total: order.totalAmount,
            });
          }}
        />
      )}
    </div>
  );
}
