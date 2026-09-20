import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Store,
  CheckCircle2,
  ArrowLeft,
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
  Lock,
  Subtitles,
  Gauge,
} from 'lucide-react';
import api from '../services/api';
import { GuestCheckoutModal } from '../components/checkout/GuestCheckoutModal';


const SCANMS_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23F3EFE6'/%3E%3Cg fill='%23C59B58' text-anchor='middle' font-family='sans-serif'%3E%3Ccircle cx='300' cy='260' r='50' fill='%23EEDFC6'/%3E%3Cpath d='M285 245h30v30h-30z' fill='%23B88E4F'/%3E%3Ctext x='300' y='350' font-size='22' font-weight='bold' fill='%231A1612'%3ESCANMS MARKETPLACE%3C/text%3E%3Ctext x='300' y='380' font-size='14' fill='%237D715E'%3EH%C3%ACnh %E1%BA%A3nh s%E1%BA%A3n ph%E1%BA%A9m %C4%91ang %C4%91%C6%B0%E1%BB%A3c c%E1%BA%ADp nh%E1%BA%ADt%3C/text%3E%3C/g%3E%3C/svg%3E";

interface ProductVariantItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  stockQuantity: number;
  isActive?: boolean;
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
  variants?: ProductVariantItem[];
}

interface LandingStore {
  id: string;
  name: string;
  slug: string;
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


function trackAnalytics(eventName: string, payload?: Record<string, any>) {
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
  const { slug } = useParams<{ slug: string }>();
  const [analyticsConsent, setAnalyticsConsent] = useState<string | null>(() =>
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem('scanms_analytics_consent'),
  );


  const [data, setData] = useState<LandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const [selectedImageIndex, setSelectedImageIndex] = useState(0);


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
    code: string;
    discountAmount: number;
    description?: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);


  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);


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
          try {
            res = await api.get(`/products/${encodeURIComponent(slug)}/landing`);
          } catch {
            // Fallback cho các alias hoặc ID thử nghiệm (prod-1, P01, P02, serum-vitamin-c, etc.)
            try {
              res = await api.get('/public/products/SR-VTC-15/landing');
            } catch {
              try {
                const prodList = await api.get('/public/products?limit=5');
                const firstItem = prodList?.data?.data?.items?.[0] || prodList?.data?.items?.[0];
                if (firstItem?.id || firstItem?.sku) {
                  res = await api.get(`/public/products/${firstItem.sku || firstItem.id}/landing`);
                }
              } catch {
                // Ignore fallback error
              }
            }
          }
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


  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !data) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const codeUpper = couponCode.trim().toUpperCase();
      const res: any = await api.post('/coupons/validate', {
        code: codeUpper,
        items: [
          {
            productId: data.product.id,
            storeId: data.store.id,
            quantity: quantity,
            unitPrice: data.product.price,
          },
        ],
      });

      const couponRes = res?.data?.data || res?.data || {};
      const discount = Number(
        couponRes.discountAmount || couponRes.totalDiscount || 0,
      );

      if (discount > 0) {
        setAppliedCoupon({
          code: codeUpper,
          discountAmount: discount,
          description:
            couponRes.description ||
            `Mã ${codeUpper} đã được áp dụng thành công!`,
        });
        setCouponError(null);
      } else {

        setCouponError(
          'Mã ưu đãi hợp lệ nhưng mức giảm giá bằng 0 hoặc không đủ điều kiện áp dụng.',
        );
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Mã giảm giá không tồn tại, đã hết hạn hoặc chưa đạt giá trị đơn tối thiểu.';
      setCouponError(Array.isArray(msg) ? msg.join(', ') : msg);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };


  const unitPrice = data?.product?.price || 0;
  const subtotal = unitPrice * quantity;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);




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
        <div className="w-16 h-16 rounded-full bg-[#F3EFE6] border border-[#EEDFC6] flex items-center justify-center text-[#DC2626] mb-4">
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
            className="px-5 py-2.5 rounded-xl bg-[#C59B58] text-white text-sm font-semibold hover:bg-[#B88E4F] transition-colors shadow-xs"
          >
            Về Chợ Tiếp Thị
          </Link>
        </div>
      </div>
    );
  }

  const { product, store, images, videos, reviews, availability, policies } =
    data;
  const activeVideo =
    videos && videos.length > 0 ? videos[activeVideoIndex] : null;
  const gallery =
    images && images.length > 0
      ? images
      : [product.imageUrl || SCANMS_PLACEHOLDER];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612] font-sans pb-28 selection:bg-[#EEDFC6]">

      <header className="bg-white/95 backdrop-blur-md border-b border-[#EAE4D7] sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          <div className="flex items-center gap-2.5 sm:gap-3">

            <Link
              to="/"
              className="flex items-center gap-2 group shrink-0"
              title="Trang chủ sàn SCANMS"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C59B58] to-[#B88E4F] flex items-center justify-center font-extrabold text-white text-sm shadow-xs group-hover:scale-105 transition-transform">
                S
              </div>
              <span className="font-extrabold text-base tracking-tight text-[#1A1612]">
                SCAN<span className="text-[#C59B58]">MS</span>
              </span>
            </Link>

            <div className="h-4 w-px bg-[#EAE4D7] hidden sm:block mx-1" />


            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.assign('/#media');
                }
              }}
              className="h-8 px-3 rounded-full bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] hover:border-[#C59B58] text-[#7D715E] hover:text-[#1A1612] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Quay lại trang trước đó"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Quay lại</span>
            </button>


            <Link
              to="/marketplace"
              className="h-8 px-3 rounded-full bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] hover:border-[#C59B58] text-[#7D715E] hover:text-[#1A1612] text-xs font-semibold hidden sm:inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
              title="Xem danh mục tất cả sản phẩm toàn sàn"
            >
              <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Chợ Tiếp Thị</span>
            </Link>
          </div>


          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            <div className="hidden md:flex items-center gap-2 h-8 px-3.5 bg-[#FBF5EB] border border-[#EEDFC6] rounded-full text-xs shadow-2xs">
              <span
                className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"
                title="Đang mở bán chính hãng"
              />
              <span className="text-[#7D715E] font-medium">Gian hàng:</span>
              <span className="font-bold text-[#1A1612] max-w-[170px] truncate">
                {store.name}
              </span>
              {store.isVerified && (
                <span title="Gian hàng chính hãng đã xác minh" aria-label="Gian hàng chính hãng đã xác minh">
                  <BadgeCheck className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                </span>
              )}
            </div>


            <Link
              to="/login"
              className="h-8 px-3 rounded-full bg-white hover:bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58] text-[#7D715E] hover:text-[#1A1612] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
              title="Đăng nhập Cổng Quản Trị / Đối Tác Tiếp Thị"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span className="hidden sm:inline">Cổng Đối Tác</span>
            </Link>


            <button
              type="button"
              onClick={() => {
                setIsCheckoutOpen(true);
                trackAnalytics('checkout_start', { productId: product.id });
              }}
              className="h-8 px-4 bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A67D3E] text-white text-xs font-extrabold rounded-full shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border border-[#B88E4F]"
              title="Mở biểu mẫu Đặt hàng nhanh Guest Checkout"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Mua Ngay</span>
            </button>
          </div>
        </div>
      </header>


      <main className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">

        <div className="text-xs text-[#7D715E] mb-4 flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
          <Link to="/marketplace" className="hover:text-[#C59B58]">
            Sàn SCANMS
          </Link>
          <span>/</span>
          <span>{product.categoryName}</span>
          <span>/</span>
          <span className="text-[#1A1612] font-medium truncate">
            {product.title}
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-[#EAE4D7] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 p-6 sm:p-8">

          <div className="lg:col-span-5 space-y-4 pr-0 lg:pr-6 border-b lg:border-b-0 lg:border-r border-[#EAE4D7] pb-6 lg:pb-0">

            <div className="aspect-square bg-[#F3EFE6] rounded-2xl overflow-hidden border border-[#EAE4D7] relative group">
              <img
                src={gallery[selectedImageIndex] || SCANMS_PLACEHOLDER}
                alt={product.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    SCANMS_PLACEHOLDER;
                }}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 bg-[#C59B58] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5" />
                100% Chính Hãng
              </span>

              {!availability.inStock && (
                <div className="absolute inset-0 bg-[#1A1612]/60 backdrop-blur-xs flex items-center justify-center">
                  <span className="bg-[#DC2626] text-white text-sm font-extrabold px-4 py-1.5 rounded-full shadow-md">
                    Hết Hàng
                  </span>
                </div>
              )}
            </div>


            {gallery.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-[#C59B58] ring-2 ring-[#EEDFC6]'
                        : 'border-[#EAE4D7] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          SCANMS_PLACEHOLDER;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}


            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EEDFC6] text-[#B88E4F] flex items-center justify-center font-bold text-sm">
                  {store.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-[#7D715E]">Cung cấp bởi</div>
                  <div className="text-sm font-bold text-[#1A1612] flex items-center gap-1">
                    {store.name}
                    {store.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-[#15803d]" />
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#B88E4F] bg-[#FBF5EB] px-2.5 py-1 rounded-full border border-[#EEDFC6]">
                {store.isVerified
                  ? 'Gian Hàng Xác Minh'
                  : 'Gian Hàng Đối Tác'}
              </span>
            </div>
          </div>


          <div className="lg:col-span-7 pl-0 lg:pl-8 pt-6 lg:pt-0 flex flex-col justify-between">
            <div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] leading-snug tracking-tight mb-2">
                {product.title}
              </h1>


              <div className="flex flex-wrap items-center gap-3 text-xs text-[#7D715E] mb-5">
                <span>
                  SKU:{' '}
                  <strong className="text-[#1A1612] font-mono">
                    {product.sku}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Danh mục:{' '}
                  <strong className="text-[#1A1612]">
                    {product.categoryName}
                  </strong>
                </span>
                <span>•</span>
                {reviews.averageRating !== null && reviews.totalReviews > 0 ? (
                  <div className="flex items-center gap-1 text-[#B88E4F] font-bold">
                    <Star className="w-3.5 h-3.5 fill-[#C59B58] text-[#C59B58]" />
                    <span>{reviews.averageRating}</span>
                    <span className="text-[#7D715E] font-normal">
                      ({reviews.totalReviews} đánh giá)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[#7D715E]">
                    <Star className="w-3.5 h-3.5 text-[#EAE4D7]" />
                    <span className="italic">Chưa có đánh giá</span>
                  </div>
                )}
              </div>


              <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl p-5 mb-5">
                <div className="text-xs text-[#7D715E] mb-1 font-medium">
                  Giá bán niêm yết:
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#B88E4F] tracking-tight">
                    {product.price.toLocaleString('vi-VN')} ₫
                  </span>
                  {product.originalPrice &&
                    product.originalPrice > product.price && (
                      <>
                        <span className="text-base text-[#7D715E] line-through">
                          {product.originalPrice.toLocaleString('vi-VN')} ₫
                        </span>
                        <span className="bg-[#DC2626]/10 text-[#DC2626] font-bold text-xs px-2 py-0.5 rounded-md">
                          -
                          {Math.round(
                            ((product.originalPrice - product.price) /
                              product.originalPrice) *
                              100,
                          )}
                          %
                        </span>
                      </>
                    )}
                </div>


                <div className="mt-3 pt-3 border-t border-[#EAE4D7] flex items-center justify-between text-xs">
                  <span className="text-[#7D715E]">Trạng thái kho hàng:</span>
                  {availability.inStock ? (
                    <span className="font-semibold text-[#15803d] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Còn hàng ({availability.stockQuantity} sản phẩm sẵn có)
                    </span>
                  ) : (
                    <span className="font-bold text-[#DC2626]">
                      Tạm hết hàng
                    </span>
                  )}
                </div>
              </div>


              <p className="text-sm text-[#7D715E] leading-relaxed mb-6">
                {product.description}
              </p>


              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-semibold text-[#7D715E]">
                  Số lượng:
                </span>
                <div className="flex items-center border border-[#EAE4D7] rounded-xl bg-white overflow-hidden shadow-xs">
                  <button
                    type="button"
                    disabled={quantity <= 1 || !availability.inStock}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-1.5 text-sm font-bold text-[#1A1612] hover:bg-[#F3EFE6] disabled:opacity-30 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-bold text-[#1A1612] min-w-[40px] text-center font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={
                      quantity >= availability.stockQuantity ||
                      !availability.inStock
                    }
                    onClick={() =>
                      setQuantity(
                        Math.min(availability.stockQuantity, quantity + 1),
                      )
                    }
                    className="px-3.5 py-1.5 text-sm font-bold text-[#1A1612] hover:bg-[#F3EFE6] disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-[#7D715E]">
                  Tối đa: {availability.stockQuantity} món
                </span>
              </div>


              <div className="mb-6">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-[#7D715E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Nhập mã ưu đãi (VD: THANGVIP10)..."
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAE4D7] rounded-xl text-xs font-mono font-semibold uppercase text-[#1A1612] placeholder-[#7D715E]/60 focus:outline-hidden focus:border-[#C59B58] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-[#C59B58] hover:bg-[#B88E4F] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    {couponLoading ? 'Kiểm tra...' : 'Áp Dụng'}
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-xs text-[#B88E4F] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {appliedCoupon.description} (-
                        {appliedCoupon.discountAmount.toLocaleString('vi-VN')} ₫)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode('');
                      }}
                      className="text-[#7D715E] hover:text-[#DC2626] font-bold p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {couponError && (
                  <div className="mt-2 text-xs text-[#DC2626] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{couponError}</span>
                  </div>
                )}
              </div>
            </div>


            <div>
              <div className="mb-4 flex items-center justify-between text-xs text-[#7D715E]">
                <span>Tổng thanh toán dự kiến:</span>
                <span className="text-xl font-extrabold text-[#1A1612]">
                  {finalTotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>


              {(!product.isActive || product.status === 'INACTIVE') && (
                <div className="mb-3 p-3 bg-[#FBF5EB] border border-[#EEDFC6] rounded-xl flex items-center gap-2 text-xs text-[#B88E4F] font-bold">
                  <AlertCircle className="w-4 h-4 text-[#B88E4F] shrink-0" />
                  <span>Sản phẩm hiện đang tạm ngừng kinh doanh. Nút đặt hàng tạm thời bị khóa!</span>
                </div>
              )}

              <button
                type="button"
                disabled={!availability.inStock || !product.canPurchase || !product.isActive || product.status === 'INACTIVE'}
                onClick={() => {
                  setIsCheckoutOpen(true);
                  trackAnalytics('cta_click', { productId: product.id });
                }}
                className="w-full py-4 px-6 bg-[#C59B58] hover:bg-[#B88E4F] disabled:bg-[#EAE4D7] disabled:text-[#7D715E] disabled:cursor-not-allowed text-white font-extrabold text-base rounded-2xl shadow-md hover:shadow-lg shadow-[#C59B58]/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>
                  {(!product.isActive || product.status === 'INACTIVE')
                    ? 'TẠM NGỪNG KINH DOANH'
                    : availability.inStock
                    ? 'ĐẶT MUA NGAY — GIAO HÀNG TẬN NƠI'
                    : 'TẠM HẾT HÀNG'}
                </span>
              </button>


              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-5 border-t border-[#EAE4D7] text-center text-[11px] text-[#7D715E]">
                <div
                  className="flex flex-col items-center gap-1"
                  title={policies?.genuineCommitment}
                >
                  <ShieldCheck className="w-4 h-4 text-[#C59B58]" />
                  <span>100% Chính hãng</span>
                </div>
                <div
                  className="flex flex-col items-center gap-1"
                  title={policies?.returnPolicy}
                >
                  <RotateCcw className="w-4 h-4 text-[#C59B58]" />
                  <span>{policies?.returnPolicy ? 'Đổi trả bảo đảm' : 'Đổi trả 7 ngày'}</span>
                </div>
                <div
                  className="flex flex-col items-center gap-1"
                  title={policies?.shipping}
                >
                  <Truck className="w-4 h-4 text-[#C59B58]" />
                  <span>Đồng kiểm khi nhận</span>
                </div>
                <div
                  className="flex flex-col items-center gap-1"
                  title={policies?.warranty}
                >
                  <Lock className="w-4 h-4 text-[#C59B58]" />
                  <span>Bảo hành uy tín</span>
                </div>
              </div>
            </div>
          </div>
        </div>


        <section className="mt-12 bg-[#F3EFE6] rounded-3xl border border-[#EEDFC6] p-6 sm:p-10 relative overflow-hidden shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F5] border border-[#EEDFC6] rounded-full text-xs font-bold text-[#B88E4F] mb-2">
                <Play className="w-3.5 h-3.5 fill-[#B88E4F]" />
                <span>VIDEO REVIEW TRẢI NGHIỆM THẬT (FR-15)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1612]">
                Trải Nghiệm & Đánh Giá Thực Tế từ Nhà Sáng Tạo
              </h2>
              <p className="text-xs sm:text-sm text-[#7D715E] mt-0.5">
                Video review đã qua phê duyệt chính thức từ gian hàng {store.name}
              </p>
            </div>


            {videos && videos.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {videos.map((vid, vIdx) => (
                  <button
                    key={vid.id || vIdx}
                    onClick={() => {
                      setActiveVideoIndex(vIdx);
                      setIsPlaying(false);
                      setVideoStarted(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeVideoIndex === vIdx
                        ? 'bg-[#C59B58] text-white shadow-xs'
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

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


                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 z-20">
                  <div className="flex items-center justify-between text-white text-xs font-semibold">
                    <span className="bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-md line-clamp-1 max-w-[70%]">
                      {activeVideo.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {activeVideo.isReferredKol && (
                        <span className="bg-[#C59B58] text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">
                          KOL Giới Thiệu
                        </span>
                      )}
                      <span className="bg-[#B88E4F] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        Đã duyệt bởi Shop
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-full bg-[#C59B58] hover:bg-[#B88E4F] flex items-center justify-center text-white transition-all shadow-md active:scale-95"
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
                              ? 'bg-[#C59B58]'
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
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#C59B58]/90 hover:bg-[#C59B58] text-white flex items-center justify-center shadow-xl transition-all transform hover:scale-105 z-10"
                  >
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </button>
                )}
              </div>


              <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#EEDFC6] shadow-xs space-y-4">
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
                        <BadgeCheck className="w-4 h-4 text-[#15803d]" />
                      )}
                    </div>
                    <div className="text-xs text-[#7D715E]">
                      {activeVideo.kol.badgeLabel}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#FBF5EB] rounded-xl border border-[#EEDFC6] text-xs text-[#7D715E] leading-relaxed">
                  <div className="font-bold text-[#B88E4F] mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Minh bạch tiếp thị (Section 17)
                  </div>
                  {activeVideo.kol.disclosure}. Video đánh giá trải nghiệm thực tế sau khi sử dụng mẫu thử từ gian hàng đối tác.
                </div>

                <div className="pt-2">
                  <div className="text-xs text-[#7D715E] mb-2 font-medium">
                    Bạn thích video review này?
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckoutOpen(true);
                      trackAnalytics('cta_click', {
                        productId: product.id,
                        source: 'video_card',
                      });
                    }}
                    className="w-full p-3 bg-gradient-to-r from-[#FAF8F5] via-[#FBF5EB] to-[#F3EFE6] hover:from-[#F3EFE6] hover:to-[#EEDFC6] border border-[#DEBE85] hover:border-[#B88E4F] rounded-2xl flex items-center justify-between gap-3 transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-[#C59B58]/15 group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">

                      <div className="w-9 h-9 rounded-xl bg-white border border-[#DEBE85] flex items-center justify-center text-[#B88E4F] shadow-xs shrink-0 group-hover:scale-105 group-hover:bg-[#FAF8F5] group-hover:border-[#B88E4F] transition-all">
                        <ShoppingBag className="w-4.5 h-4.5 text-[#B88E4F]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-xs sm:text-sm text-[#1A1612] group-hover:text-[#8C6320] transition-colors leading-snug">
                          Mua sản phẩm giới thiệu trong video
                        </div>
                        <div className="text-[11px] text-[#7D715E] font-medium mt-0.5 truncate">
                          Chính hãng từ {store?.name || 'Gian hàng đối tác'}
                        </div>
                      </div>
                    </div>


                    <div className="w-8 h-8 rounded-xl bg-white border border-[#EEDFC6] flex items-center justify-center text-[#8C6320] shadow-2xs group-hover:border-[#C59B58] group-hover:bg-[#FBF5EB] transition-all shrink-0">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-[#EEDFC6]">
              <Play className="w-8 h-8 text-[#B88E4F] mx-auto mb-2 opacity-50" />
              <div className="text-sm font-bold text-[#1A1612]">
                Sản phẩm đang trong quá trình cập nhật video review
              </div>
              <div className="text-xs text-[#7D715E] mt-1">
                Các KOL đang trải nghiệm hàng mẫu và video sẽ sớm được Shop phê duyệt hiển thị.
              </div>
            </div>
          )}
        </section>


        <section className="mt-12 bg-white rounded-3xl border border-[#EAE4D7] p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EAE4D7]">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1612]">
                Đánh Giá Thực Tế Từ Khách Hàng (FR-18)
              </h2>
              <p className="text-xs sm:text-sm text-[#7D715E] mt-0.5">
                Chỉ hiển thị phản hồi đã kiểm duyệt từ người mua hàng thực tế
              </p>
            </div>

            <div className="flex items-center gap-3">
              {reviews.averageRating !== null && reviews.totalReviews > 0 ? (
                <div className="text-right">
                  <div className="text-3xl font-extrabold text-[#B88E4F]">
                    {reviews.averageRating}{' '}
                    <span className="text-base text-[#7D715E]">/ 5</span>
                  </div>
                  <div className="flex gap-0.5 justify-end text-[#C59B58]">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.round(reviews.averageRating || 0)
                            ? 'fill-[#C59B58] text-[#C59B58]'
                            : 'text-[#EAE4D7]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-right">
                  <div className="text-sm font-bold text-[#7D715E]">
                    Chưa có đánh giá
                  </div>
                  <div className="flex gap-0.5 justify-end text-[#EAE4D7] mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 text-[#EAE4D7]" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>


          <div className="space-y-4">
            {reviews.items && reviews.items.length > 0 ? (
              reviews.items.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] transition-all hover:bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1A1612]">
                        {rev.customerName}
                      </span>
                      {rev.isVerifiedBuyer && (
                        <span className="inline-flex items-center gap-1 bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-[#15803d]" />
                          Đã mua hàng
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#7D715E]">
                      {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex gap-0.5 text-[#C59B58] mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating
                            ? 'fill-[#C59B58] text-[#C59B58]'
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
              <div className="text-center py-8 text-xs text-[#7D715E]">
                Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên trải nghiệm!
              </div>
            )}
          </div>
        </section>
      </main>

      {analyticsConsent === null && (
        <aside
          role="dialog"
          aria-label="Lựa chọn quyền riêng tư"
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-2xl rounded-2xl border border-[#EEDFC6] bg-white p-4 shadow-xl sm:flex sm:items-center sm:justify-between sm:gap-5"
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
              className="rounded-xl bg-[#C59B58] px-4 py-2 text-xs font-bold text-white hover:bg-[#B88E4F]"
            >
              Cho phép thống kê
            </button>
          </div>
        </aside>
      )}


      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#EAE4D7] p-3 px-4 z-20 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-[10px] text-[#7D715E]">Giá thanh toán:</div>
          <div className="text-lg font-extrabold text-[#B88E4F]">
            {finalTotal.toLocaleString('vi-VN')} ₫
          </div>
        </div>

        <button
          type="button"
          disabled={!availability.inStock}
          onClick={() => {
            setIsCheckoutOpen(true);
            trackAnalytics('cta_click', {
              productId: product.id,
              source: 'mobile_sticky',
            });
          }}
          className="px-6 py-2.5 bg-[#C59B58] hover:bg-[#B88E4F] disabled:bg-[#EAE4D7] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 active:scale-98 transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{availability.inStock ? 'Mua Ngay' : 'Hết Hàng'}</span>
        </button>
      </div>


      {isCheckoutOpen && product && store && (
        <GuestCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          product={{
            id: product.id,
            title: product.title,
            sku: product.sku,
            price: product.price,
            originalPrice: product.originalPrice || undefined,
            imageUrl: product.imageUrl || undefined,
            stockQuantity: availability.stockQuantity ?? 0,
            variants: product.variants,
          }}
          store={{
            id: store.id,
            name: store.name,
            slug: store.slug,
          }}
          initialQuantity={quantity}
          initialCouponCode={appliedCoupon?.code || ''}
          onOrderPlaced={(order) => {
            trackAnalytics('purchase', {
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
