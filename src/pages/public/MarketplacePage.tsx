import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  Play,
  Star,
  ChevronDown,
  Phone,
  Package,
  TrendingUp,
  User,
  Shield,
  Clock,
  Check,
  ChevronLeft,
  ChevronRight,
  Zap,
  Copy,
  Ticket,
  Gift,
  CalendarDays,
  Minus,
  Plus,
  MessageSquare,
  Share2,
  Flame,
  Coins,
  ExternalLink,
  Heart,
  ZoomIn,
} from 'lucide-react';
import api from '../../services/api';
import { GuestCheckoutModal, type CheckoutProductItem, type CheckoutStoreInfo } from '../../components/checkout/GuestCheckoutModal';
import {
  marketplaceProducts,
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
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ReviewVideo | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeCheckoutProduct, setActiveCheckoutProduct] = useState<{
    product: CheckoutProductItem;
    store: CheckoutStoreInfo;
    couponCode?: string;
    quantity?: number;
  } | null>(null);

  const [trackQuery, setTrackQuery] = useState('');
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [recentGuestOrder, setRecentGuestOrder] = useState<{ publicOrderCode: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('scanms-recent-guest-order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.publicOrderCode) {
          setRecentGuestOrder(parsed);
        }
      }
    } catch {}
  }, []);

  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const storeDropdownRef = useRef<HTMLDivElement>(null);
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
            storeId: dbP.store?.id,
            sku: dbP.sku,
            stockQuantity: Number(dbP.stockQuantity || 0),
            variants: Array.isArray(dbP.variants) ? dbP.variants : [],
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
      if (
        storeDropdownRef.current &&
        !storeDropdownRef.current.contains(e.target as Node)
      ) {
        setIsStoreDropdownOpen(false);
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

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += quantity;
        return next;
      }
      return [...prev, { product, quantity }];
    });
    toast.success(`Đã thêm ${quantity > 1 ? `x${quantity} ` : ''}"${product.name.slice(0, 32)}..." vào giỏ hàng!`);
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
    if (!product.storeId) {
      toast.error('Sản phẩm mẫu này chưa được liên kết với gian hàng thật nên chưa thể đặt hàng.');
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

interface FlashDealProduct {
  id: string;
  sku: string;
  campaignTag: string;
  discountBadge: string;
  title: string;
  shortTitle: string;
  shopName: string;
  categoryLabel: string;
  rating: number;
  soldCount: string;
  stock: number;
  images: { id: number; src: string; label: string }[];
  creator: {
    name: string;
    avatar: string;
    tier: string;
    role: string;
    coupon: string;
    quote: string;
    videoDuration: string;
  };
  variants: {
    name: string;
    origPrice: number;
    price: number;
  }[];
}

const ROTATING_DEALS: FlashDealProduct[] = [
  {
    id: 'P01',
    sku: 'SR-VTC-15',
    campaignTag: 'FLASH DEAL ĐỘC QUYỀN',
    discountBadge: '-21% GIẢM',
    title: 'Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm',
    shortTitle: 'Serum Vitamin C',
    shopName: 'Sora Skin Official Store',
    categoryLabel: 'Chăm sóc da & Serum',
    rating: 4.9,
    soldCount: '1,4k đã bán',
    stock: 7,
    images: [
      { id: 1, src: '/reference/assets/serum-hero-optimized.jpg', label: 'Chai Serum 30ml chính diện' },
      { id: 2, src: '/reference/assets/serum-gallery-2.jpg', label: 'Ống hút pipette tinh chất' },
      { id: 3, src: '/reference/assets/serum-gallery-3.jpg', label: 'Kết cấu serum thấm sâu' },
      { id: 4, src: '/reference/assets/serum-gallery-4.jpg', label: 'Vỏ hộp Sora Skin sang trọng' },
      { id: 5, src: '/reference/assets/serum-gallery-5.jpg', label: 'Chiết xuất thảo mộc thiên nhiên' },
    ],
    creator: {
      name: 'Trần Văn Nhật',
      avatar: '/reference/assets/kol-avatar-nhat.jpg',
      tier: 'KOL Vàng',
      role: 'Reviewer chính hãng',
      coupon: 'NHATXINH10',
      quote: 'Chất serum mỏng nhẹ thấm nhanh, mờ thâm mụn sau 2 tuần rõ rệt, da sáng bóng chuẩn phong cách glass skin.',
      videoDuration: '00:35',
    },
    variants: [
      { name: '30ml Tiêu Chuẩn', origPrice: 520000, price: 413100 },
      { name: '50ml Tiết Kiệm', origPrice: 740000, price: 589000 },
    ],
  },
  {
    id: 'P02',
    sku: 'P02-SUN',
    campaignTag: 'MEGA DEAL CHỐNG NẮNG',
    discountBadge: '-19% GIẢM',
    title: 'Kem Chống Nắng Phục Hồi Quang Phổ Rộng Aqua Sunscreen SPF50+',
    shortTitle: 'Kem chống nắng',
    shopName: 'Sora Skin Official Store',
    categoryLabel: 'Chăm sóc da & Chống nắng',
    rating: 4.8,
    soldCount: '2,1k đã bán',
    stock: 9,
    images: [
      { id: 1, src: '/reference/assets/sunscreen-product.jpg', label: 'Tuýp chống nắng Aqua Sunscreen SPF50+' },
      { id: 2, src: '/reference/assets/sunscreen-texture-macro.jpg', label: 'Chất kem mỏng nhẹ tan nhanh' },
      { id: 3, src: '/reference/assets/sunscreen-gallery-2.jpg', label: 'Swatch mỏng mịn trên cổ tay' },
      { id: 4, src: '/reference/assets/serum-gallery-4.jpg', label: 'Vỏ hộp Sora Skin sang trọng' },
      { id: 5, src: '/reference/assets/serum-gallery-5.jpg', label: 'Finish ráo mịn bảo vệ 8 tiếng' },
    ],
    creator: {
      name: 'Lê Mai Anh',
      avatar: '/reference/assets/kol-avatar-maianh.jpg',
      tier: 'KOL Vàng',
      role: 'Chuyên gia Skincare',
      coupon: 'MAIANH12',
      quote: 'Lớp finish ráo mịn nâng tone tự nhiên, kiềm dầu đỉnh cao và bảo vệ da tối ưu suốt ngày dài.',
      videoDuration: '00:28',
    },
    variants: [
      { name: '50ml Tiêu Chuẩn', origPrice: 430000, price: 350100 },
      { name: '100ml Tiết Kiệm', origPrice: 720000, price: 580000 },
    ],
  },
  {
    id: 'P03',
    sku: 'P03-BHA',
    campaignTag: 'DEAL LÀM SẠCH SÂU',
    discountBadge: '-19% GIẢM',
    title: 'Toner BHA 2% Làm Sạch Sâu & Kiềm Dầu Thu Nhỏ Lỗ Chân Lông',
    shortTitle: 'Toner BHA 2%',
    shopName: 'Sora Skin Official Store',
    categoryLabel: 'Chăm sóc da & Toner',
    rating: 4.7,
    soldCount: '820 đã bán',
    stock: 14,
    images: [
      { id: 1, src: '/reference/assets/toner-bha-product.jpg', label: 'Chai toner BHA 2% Sora Skin 150ml' },
      { id: 2, src: '/reference/assets/toner-water-macro.jpg', label: 'Kết cấu lỏng nhẹ gợn sóng tinh khiết' },
      { id: 3, src: '/reference/assets/serum-gallery-3.jpg', label: 'Thấm sâu làm sạch bã nhờn sâu trong lỗ chân lông' },
      { id: 4, src: '/reference/assets/serum-gallery-4.jpg', label: 'Bao bì dược mỹ phẩm tối giản' },
      { id: 5, src: '/reference/assets/serum-gallery-5.jpg', label: 'Độ pH chuẩn dịu lành cho da dầu mụn' },
    ],
    creator: {
      name: 'Lê Mai Anh',
      avatar: '/reference/assets/kol-avatar-maianh.jpg',
      tier: 'KOL Vàng',
      role: 'Chuyên gia Trị Mụn & Kiềm Dầu',
      coupon: 'MAIANH12',
      quote: 'Làm sạch sâu bã nhờn trong lỗ chân lông cực tốt mà không gây rát da hay khô căng một chút nào.',
      videoDuration: '00:32',
    },
    variants: [
      { name: '150ml Tiêu Chuẩn', origPrice: 390000, price: 314100 },
      { name: '250ml Tiết Kiệm', origPrice: 600000, price: 480000 },
    ],
  },
  {
    id: 'P04',
    sku: 'P04-CICA',
    campaignTag: 'DEAL PHỤC HỒI CẤP TỐC',
    discountBadge: '-23% GIẢM',
    title: 'Mặt Nạ Phục Hồi Cica Soothing Mask Làm Dịu Da Cấp Tốc',
    shortTitle: 'Mặt nạ Cica',
    shopName: 'Sora Skin Official Store',
    categoryLabel: 'Chăm sóc da & Mặt nạ',
    rating: 5.0,
    soldCount: '980 đã bán',
    stock: 18,
    images: [
      { id: 1, src: '/reference/assets/cica-mask-product.jpg', label: 'Hộp mặt nạ rau má Cica Soothing Mask 5 miếng' },
      { id: 2, src: '/reference/assets/cica-mask-detail.jpg', label: 'Mặt nạ sợi biocellulose ngậm tinh chất rau má' },
      { id: 3, src: '/reference/assets/serum-gallery-3.jpg', label: 'Cấp ẩm sâu và làm dịu vùng da ửng đỏ sau peel' },
      { id: 4, src: '/reference/assets/serum-gallery-4.jpg', label: 'Bao bì từng gói vô trùng chuẩn y khoa' },
      { id: 5, src: '/reference/assets/serum-gallery-5.jpg', label: 'Làn da căng mọng ngậm nước sau 20 phút' },
    ],
    creator: {
      name: 'Trần Văn Nhật',
      avatar: '/reference/assets/kol-avatar-nhat.jpg',
      tier: 'KOL Vàng',
      role: 'Chuyên gia Phục Hồi Da Nhạy Cảm',
      coupon: 'NHATXINH10',
      quote: 'Đắp sau khi đi nắng về hoặc nặn mụn là dịu da ngay tức thì, da ngậm nước căng mướt sau 20 phút.',
      videoDuration: '00:40',
    },
    variants: [
      { name: 'Hộp 5 Miếng (Tiêu chuẩn)', origPrice: 220000, price: 170100 },
      { name: 'Hộp 10 Miếng (Tiết kiệm)', origPrice: 420000, price: 320000 },
    ],
  },
  {
    id: 'P05',
    sku: 'P05-CLEAN',
    campaignTag: 'DEAL DƯỢC MỸ PHẨM',
    discountBadge: '-19% GIẢM',
    title: 'Gel Rửa Mặt Dịu Nhẹ Tràm Trà Gentle Foam Cleanser Phục Hồi Hàng Rào Da',
    shortTitle: 'Gel rửa mặt',
    shopName: 'Sora Skin Official Store',
    categoryLabel: 'Chăm sóc da & Rửa mặt',
    rating: 4.9,
    soldCount: '3,2k đã bán',
    stock: 22,
    images: [
      { id: 1, src: '/reference/assets/cleanser-product.jpg', label: 'Chai gel rửa mặt tràm trà dịu nhẹ 150ml' },
      { id: 2, src: '/reference/assets/cleanser-foam-macro.jpg', label: 'Cận cảnh bọt mịn pH 5.5 dịu nhẹ không khô căng' },
      { id: 3, src: '/reference/assets/serum-gallery-3.jpg', label: 'Kháng khuẩn ngừa mụn với chiết xuất tràm trà thiên nhiên' },
      { id: 4, src: '/reference/assets/serum-gallery-4.jpg', label: 'Vòi pump tiện dụng kiểm soát liều lượng' },
      { id: 5, src: '/reference/assets/serum-gallery-5.jpg', label: 'Bảo vệ hàng rào ẩm tự nhiên suốt 24h' },
    ],
    creator: {
      name: 'Phạm Khánh Linh',
      avatar: '/reference/assets/kol-avatar-linh.jpg',
      tier: 'KOL Bạc',
      role: 'Dược mỹ phẩm & Da nhạy cảm',
      coupon: 'LINHSKIN',
      quote: 'pH chuẩn 5.5 dịu nhẹ không khô căng, chiết xuất tràm trà kháng viêm hỗ trợ ngừa mụn rất hiệu quả.',
      videoDuration: '00:30',
    },
    variants: [
      { name: '150ml Tiêu Chuẩn', origPrice: 310000, price: 251100 },
      { name: '400ml Siêu Tiết Kiệm', origPrice: 490000, price: 390000 },
    ],
  },
];

  const [countdown, setCountdown] = useState({ hours: 2, minutes: 59, seconds: 50 });
  const [isVoucherSaved, setIsVoucherSaved] = useState(false);
  const [activeDealIndex, setActiveDealIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [isDealAutoPlayPaused, setIsDealAutoPlayPaused] = useState(false);
  const [heroGalleryIndex, setHeroGalleryIndex] = useState(0);
  const [heroQuantity, setHeroQuantity] = useState(1);
  const [heroVoucherId, setHeroVoucherId] = useState<'platform' | 'creator' | 'shop'>('platform');
  const [selectedCity, setSelectedCity] = useState('TP.HCM');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isQuickVideoOpen, setIsQuickVideoOpen] = useState(false);
  const [isVoucherWalletOpen, setIsVoucherWalletOpen] = useState(false);
  const [isCouponCopied, setIsCouponCopied] = useState(false);
  const [isHeroLiked, setIsHeroLiked] = useState(false);
  const [isHeroScrolledPast, setIsHeroScrolledPast] = useState(false);
  const [customCouponInput, setCustomCouponInput] = useState('');
  const [appliedCustomCoupon, setAppliedCustomCoupon] = useState<{
    code: string;
    discountAmount: number;
    description: string;
  } | null>(null);
  
  // Image Lightbox / Zoom Modal State
  const [zoomedImage, setZoomedImage] = useState<{
    src: string;
    title: string;
    brand?: string;
    price?: number;
    origPrice?: number;
    badge?: string;
    images?: Array<{ id: string | number; src: string; label: string }>;
    currentIndex?: number;
  } | null>(null);

  // Keyboard shortcut (Escape) and background scroll lock for image lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomedImage) {
        setZoomedImage(null);
      }
    };
    if (zoomedImage) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomedImage]);

  // Order-to-Delivery Progress Stepper State (Thanh tiến độ Mua hàng -> Nhận hàng)
  const [previewStageIndex, setPreviewStageIndex] = useState<number>(4);

  const ORDER_PROGRESS_STAGES = [
    {
      step: 1,
      title: 'Đặt mua thành công',
      desc: 'Đơn hàng được ghi nhận, trừ tồn kho & cấp mã vận đơn',
      icon: ShoppingBag,
      timeText: 'Tức thì',
    },
    {
      step: 2,
      title: 'Shop tiếp nhận',
      desc: 'Gian hàng xác nhận sản phẩm & chuẩn bị đóng gói',
      icon: Store,
      timeText: 'Trong 2 - 4h',
    },
    {
      step: 3,
      title: 'Đóng gói & Xuất kho',
      desc: 'Niêm phong tem an toàn, bàn giao cho đơn vị vận chuyển',
      icon: Package,
      timeText: 'Trong ngày',
    },
    {
      step: 4,
      title: 'Đang vận chuyển',
      desc: 'Shipper nhận kiện hàng, đang trên đường giao tận tay bạn',
      icon: Truck,
      timeText: '1 - 2 ngày',
    },
    {
      step: 5,
      title: 'Nhận hàng & Đồng kiểm',
      desc: 'Mở hộp kiểm tra trước, ưng ý mới thanh toán cho shipper',
      icon: ShieldCheck,
      timeText: 'Đồng kiểm 100%',
    },
  ];

  const currentActiveStage = useMemo(() => {
    if (!trackResult) return previewStageIndex;
    const statusLower = (trackResult.status || '').toLowerCase();
    if (statusLower.includes('thành công') || statusLower.includes('đã nhận') || statusLower.includes('hoàn tất')) {
      return 5;
    }
    if (statusLower.includes('vận chuyển') || statusLower.includes('đang giao') || statusLower.includes('phát hàng')) {
      return 4;
    }
    if (statusLower.includes('đóng gói') || statusLower.includes('xuất kho') || statusLower.includes('chuẩn bị')) {
      return 3;
    }
    if (statusLower.includes('tiếp nhận') || statusLower.includes('xác nhận') || statusLower.includes('duyệt')) {
      return 2;
    }
    return 1;
  }, [trackResult, previewStageIndex]);

  const heroSectionRef = useRef<HTMLElement>(null);

  const currentDeal = ROTATING_DEALS[activeDealIndex] || ROTATING_DEALS[0];
  const currentVariant = currentDeal.variants[selectedVariantIndex] || currentDeal.variants[0];

  const DELIVERY_OPTIONS = [
    { city: 'TP.HCM', dateText: 'Nhận hàng 17 - 19/09' },
    { city: 'Hà Nội', dateText: 'Nhận hàng 18 - 20/09' },
    { city: 'Đà Nẵng', dateText: 'Nhận hàng 19 - 21/09' },
    { city: 'Cần Thơ', dateText: 'Nhận hàng 17 - 19/09' },
    { city: 'Hải Phòng', dateText: 'Nhận hàng 18 - 20/09' },
    { city: 'Bình Dương', dateText: 'Nhận hàng 17 - 19/09' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 2, minutes: 59, seconds: 50 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Continuous auto-rotation of shop deals every 5.5s (pauses on user hover)
  useEffect(() => {
    if (isDealAutoPlayPaused) return;
    const interval = setInterval(() => {
      setActiveDealIndex((prev) => (prev + 1) % ROTATING_DEALS.length);
      setHeroGalleryIndex(0);
      setSelectedVariantIndex(0);
    }, 5500);
    return () => clearInterval(interval);
  }, [isDealAutoPlayPaused]);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroSectionRef.current) return;
      const rect = heroSectionRef.current.getBoundingClientRect();
      setIsHeroScrolledPast(rect.bottom < 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectDeal = (index: number) => {
    setActiveDealIndex(index);
    setHeroGalleryIndex(0);
    setSelectedVariantIndex(0);
  };

  const handlePrevDeal = () => {
    setActiveDealIndex((prev) => (prev - 1 + ROTATING_DEALS.length) % ROTATING_DEALS.length);
    setHeroGalleryIndex(0);
    setSelectedVariantIndex(0);
  };

  const handleNextDeal = () => {
    setActiveDealIndex((prev) => (prev + 1) % ROTATING_DEALS.length);
    setHeroGalleryIndex(0);
    setSelectedVariantIndex(0);
  };

  const heroProductData = useMemo(() => {
    const origPrice = currentVariant.origPrice;
    let baseFinalPrice = currentVariant.price;
    let discountPercent = Math.round(((origPrice - baseFinalPrice) / origPrice) * 100);
    let activeCoupon = currentDeal.creator.coupon;

    if (appliedCustomCoupon) {
      activeCoupon = appliedCustomCoupon.code;
      baseFinalPrice = Math.max(0, baseFinalPrice - appliedCustomCoupon.discountAmount);
      discountPercent = Math.round(((origPrice - baseFinalPrice) / origPrice) * 100);
    } else {
      if (heroVoucherId === 'platform') {
        activeCoupon = 'SCANMS50K';
      } else if (heroVoucherId === 'shop') {
        activeCoupon = 'SORASKIN5';
      } else {
        activeCoupon = currentDeal.creator.coupon;
      }
    }

    return {
      origPrice,
      finalPrice: baseFinalPrice,
      discountPercent,
      activeCoupon,
      stock: currentDeal.stock,
    };
  }, [currentDeal, currentVariant, heroVoucherId, appliedCustomCoupon]);

  const handleSaveVoucher = () => {
    setIsVoucherSaved(true);
    toast.success('Đã lưu mã voucher SCANMS50K vào ví của bạn.');
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCouponCopied(true);
    toast.success(`Đã sao chép mã ưu đãi ${code}!`);
    setTimeout(() => setIsCouponCopied(false), 2500);
  };

  const handleApplyCustomCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = customCouponInput.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Vui lòng nhập mã ưu đãi.');
      return;
    }

    if (cleanCode === 'NHATXINH10') {
      const discount = Math.round(heroProductData.origPrice * 0.1);
      setAppliedCustomCoupon({
        code: cleanCode,
        discountAmount: discount,
        description: 'Mã Creator Trần Văn Nhật giảm 10%',
      });
      setHeroVoucherId('creator');
      toast.success(`Áp dụng thành công mã Creator ${cleanCode}!`);
    } else if (cleanCode === 'SCANMS50K') {
      setAppliedCustomCoupon({
        code: cleanCode,
        discountAmount: 50000,
        description: 'Voucher toàn sàn SCANMS giảm 50.000₫',
      });
      setHeroVoucherId('platform');
      toast.success(`Áp dụng thành công voucher toàn sàn ${cleanCode}!`);
    } else if (cleanCode === 'SORASKIN5') {
      const discount = Math.round(heroProductData.origPrice * 0.05);
      setAppliedCustomCoupon({
        code: cleanCode,
        discountAmount: discount,
        description: 'Voucher shop Sora Skin giảm 5%',
      });
      setHeroVoucherId('shop');
      toast.success(`Áp dụng thành công voucher gian hàng ${cleanCode}!`);
    } else {
      const discount = Math.round(heroProductData.origPrice * 0.1);
      setAppliedCustomCoupon({
        code: cleanCode,
        discountAmount: discount,
        description: `Mã ưu đãi riêng ${cleanCode} giảm 10%`,
      });
      toast.success(`Áp dụng thành công mã ưu đãi riêng ${cleanCode}!`);
    }
  };

  const handleRemoveCustomCoupon = () => {
    setAppliedCustomCoupon(null);
    setCustomCouponInput('');
    toast.info('Đã gỡ bỏ mã ưu đãi riêng.');
  };

  const handleHeroAddToCart = () => {
    const targetProduct = items.find((p) => p.id === currentDeal.id || p.sku === currentDeal.sku) || {
      id: currentDeal.id,
      name: currentDeal.title,
      brand: currentDeal.shopName,
      price: heroProductData.finalPrice,
      origPrice: heroProductData.origPrice,
      image: currentDeal.images[0].src,
      category: 'skincare' as any,
      categoryLabel: currentDeal.categoryLabel,
      rating: currentDeal.rating,
      reviews: 42,
      sold: currentDeal.soldCount,
      sku: currentDeal.sku,
    };
    handleAddToCart(targetProduct as Product, heroQuantity);
  };

  const handleHeroBuyNow = () => {
    const targetProduct = items.find(
      (p) =>
        p.id === currentDeal.id ||
        p.sku === currentDeal.sku ||
        p.name.toLowerCase().includes(currentDeal.shortTitle.toLowerCase())
    );

    if (!targetProduct?.storeId) {
      toast.error('Deal này chưa được liên kết với sản phẩm thật nên chưa thể đặt hàng.');
      return;
    }

    const normalizedVariantName = currentVariant.name.trim().toLowerCase();
    const selectedRealVariant = targetProduct.variants?.find(
      (variant) =>
        variant.isActive !== false &&
        variant.name.trim().toLowerCase() === normalizedVariantName
    );

    setActiveCheckoutProduct({
      product: {
        id: targetProduct.id,
        title: targetProduct.name,
        sku: targetProduct.sku,
        price: selectedRealVariant?.price ?? targetProduct.price,
        originalPrice: targetProduct.origPrice,
        imageUrl: currentDeal.images[heroGalleryIndex]?.src || currentDeal.images[0].src,
        stockQuantity: selectedRealVariant?.stockQuantity ?? targetProduct.stockQuantity ?? 0,
        variants: selectedRealVariant ? [selectedRealVariant] : undefined,
      },
      store: {
        id: targetProduct.storeId,
        name: targetProduct.brand,
      },
      couponCode: heroProductData.activeCoupon,
      quantity: heroQuantity,
    });
  };

  const handleCopyAffiliateLink = () => {
    const link = `${window.location.origin}/marketplace?deal=${currentDeal.id}&ref=KOL_${currentDeal.creator.coupon}`;
    navigator.clipboard.writeText(link);
    setIsCouponCopied(true);
    toast.success('Đã sao chép Link Tiếp Thị CTV kèm mã giảm giá!');
    setTimeout(() => setIsCouponCopied(false), 2500);
  };

  const handleFilterShop = (shopName: string) => {
    setSelectedStore(shopName);
    toast.info(`Đang xem toàn bộ sản phẩm của gian hàng ${shopName}`);
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChatShop = (shopName: string) => {
    toast.info(`Đang kết nối tin nhắn trực tiếp với ${shopName}...`);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612] flex flex-col font-sans selection:bg-[#F3EFE6] selection:text-[#B88E4F] overflow-x-clip">

      <aside className="bg-[#F3EFE6] text-[#7A561B] text-[11.5px] font-medium py-2 px-4 border-b border-[#EEDFC6]">
        <div className="max-w-[1520px] mx-auto flex flex-wrap items-center justify-between gap-3">
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
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 sm:gap-6">

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

          <div className="flex-1 max-w-2xl xl:max-w-3xl hidden md:block">
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
                      <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0">
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

        <div className="bg-[#F3EFE6]/60 border-t border-[#EAE4D7] px-4 sm:px-6 lg:px-8 py-2 relative z-30">
          <div className="max-w-[1520px] mx-auto flex items-center justify-between gap-4">
            <div
              className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto py-1 flex-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-[#C59B58] text-white shadow-xs'
                    : 'bg-white text-[#7D715E] hover:text-[#B88E4F] hover:bg-[#FBF5EB] border border-[#EAE4D7] hover:border-[#C59B58]/40'
                }`}
              >
                Tất cả sản phẩm ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('skincare')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer shrink-0 ${
                  selectedCategory === 'skincare'
                    ? 'bg-[#C59B58] text-white shadow-xs'
                    : 'bg-white text-[#7D715E] hover:text-[#B88E4F] hover:bg-[#FBF5EB] border border-[#EAE4D7] hover:border-[#C59B58]/40'
                }`}
              >
                Chăm sóc da & Serum
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('home')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer shrink-0 ${
                  selectedCategory === 'home'
                    ? 'bg-[#C59B58] text-white shadow-xs'
                    : 'bg-white text-[#7D715E] hover:text-[#B88E4F] hover:bg-[#FBF5EB] border border-[#EAE4D7] hover:border-[#C59B58]/40'
                }`}
              >
                Gia dụng & Đời sống
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('tech')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer shrink-0 ${
                  selectedCategory === 'tech'
                    ? 'bg-[#C59B58] text-white shadow-xs'
                    : 'bg-white text-[#7D715E] hover:text-[#B88E4F] hover:bg-[#FBF5EB] border border-[#EAE4D7] hover:border-[#C59B58]/40'
                }`}
              >
                Công nghệ & Phụ kiện
              </button>
            </div>

            {/* Custom Warm Sand Gold Store Dropdown (Replaces native select to eliminate dark/black OS popup) */}
            <div ref={storeDropdownRef} className="relative flex items-center gap-2 text-xs shrink-0">
              <span className="text-[#7D715E] font-bold flex items-center gap-1 shrink-0">
                <Store className="w-3.5 h-3.5 text-[#B88E4F]" />
                Gian hàng:
              </span>

              <button
                type="button"
                onClick={() => setIsStoreDropdownOpen((prev) => !prev)}
                className="bg-white hover:bg-[#FBF5EB] border border-[#EAE4D7] hover:border-[#C59B58] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1A1612] flex items-center gap-2 transition cursor-pointer shadow-2xs"
              >
                <span className="truncate max-w-[150px]">
                  {selectedStore === 'all'
                    ? `Tất cả gian hàng (${availableStores.length})`
                    : selectedStore}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#B88E4F] transition-transform duration-200 ${
                    isStoreDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isStoreDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-[#EEDFC6] rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10.5px] font-black uppercase text-[#8C6226] tracking-wider border-b border-[#EAE4D7] mb-1 bg-[#FAF8F5]/80">
                    Chọn gian hàng đối tác
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStore('all');
                      setIsStoreDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition cursor-pointer ${
                      selectedStore === 'all'
                        ? 'bg-[#FBF5EB] text-[#B88E4F] font-black border-l-2 border-[#C59B58]'
                        : 'text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F]'
                    }`}
                  >
                    <span>Tất cả gian hàng ({availableStores.length})</span>
                    {selectedStore === 'all' && (
                      <Check className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                    )}
                  </button>

                  {availableStores.map((st) => {
                    const isSelected = selectedStore === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setSelectedStore(st);
                          setIsStoreDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#FBF5EB] text-[#B88E4F] font-black border-l-2 border-[#C59B58]'
                            : 'text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F]'
                        }`}
                      >
                        <span className="truncate">{st}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
        </div>
      </div>
    </div>
  </header>

      <section ref={heroSectionRef} className="relative bg-gradient-to-b from-[#F3EFE6] via-[#FAF8F5] to-[#FAF8F5] border-b border-[#EAE4D7] pt-6 sm:pt-8 pb-8 overflow-hidden text-left">
        {/* Subtle Luxury Golden Ambient Glow Orbs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#C59B58]/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-[#B88E4F]/10 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8 relative z-10">

          {/* MAIN STAGE: Full-Width Deal Command Center (Dài ngang bằng với phần dưới) */}
          <div className="w-full">
            <div 
              className="bg-white border-2 border-[#EEDFC6] rounded-3xl shadow-xl relative overflow-hidden text-left flex flex-col justify-between group/dealcard"
              onMouseEnter={() => setIsDealAutoPlayPaused(true)}
              onMouseLeave={() => setIsDealAutoPlayPaused(false)}
            >
                
                {/* Stage Header: Flash Sale Banner + Carousel Controls + Countdown */}
                <div className="bg-gradient-to-r from-[#C59B58] via-[#B88E4F] to-[#C59B58] px-4 sm:px-5 py-2.5 text-white flex items-center justify-between gap-3 flex-wrap shadow-xs relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.25),transparent_40%)] pointer-events-none" />

                  <div className="flex items-center gap-2 relative z-10">
                    <span className="inline-flex items-center gap-1.5 font-black text-xs sm:text-sm tracking-wide">
                      <Zap className="w-4 h-4 fill-white text-white" />
                      {currentDeal.campaignTag}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 border border-white/40 text-white text-[11px] font-black">
                      {currentDeal.discountBadge}
                    </span>
                  </div>

                  {/* Deal Carousel Navigation Arrows & Indicators */}
                  <div className="flex items-center gap-2 relative z-10 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
                    <button
                      type="button"
                      onClick={handlePrevDeal}
                      className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/30 grid place-items-center transition cursor-pointer text-white"
                      title="Sản phẩm deal trước"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {ROTATING_DEALS.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectDeal(idx)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            idx === activeDealIndex ? 'w-5 bg-white shadow-xs' : 'w-1.5 bg-white/40 hover:bg-white/70'
                          }`}
                          title={`Deal ${idx + 1}/${ROTATING_DEALS.length}`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleNextDeal}
                      className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/30 grid place-items-center transition cursor-pointer text-white"
                      title="Sản phẩm deal tiếp theo"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[10px] font-mono font-bold text-amber-200 ml-0.5">
                      {activeDealIndex + 1}/{ROTATING_DEALS.length}
                    </span>
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center gap-1.5 text-xs font-bold relative z-10">
                    <Clock className="w-3.5 h-3.5 text-white/90" />
                    <span className="text-[10.5px] text-white/90 font-bold uppercase tracking-wider hidden sm:inline">KẾT THÚC TRONG</span>
                    <span className="bg-white/20 border border-white/30 px-1.5 py-0.5 rounded text-[11px] font-mono font-black shadow-2xs">
                      {String(countdown.hours).padStart(2, '0')}
                    </span>
                    <span className="font-bold">:</span>
                    <span className="bg-white/20 border border-white/30 px-1.5 py-0.5 rounded text-[11px] font-mono font-black shadow-2xs">
                      {String(countdown.minutes).padStart(2, '0')}
                    </span>
                    <span className="font-bold">:</span>
                    <span className="bg-white/20 border border-white/30 px-1.5 py-0.5 rounded text-[11px] font-mono font-black shadow-2xs">
                      {String(countdown.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Mini Deal Quick Tabs Strip for continuous rotation in shop */}
                <div className="bg-[#FAF8F5] border-b border-[#EAE4D7] px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-bold text-[#8C6226] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đang chạy:
                  </span>
                  {ROTATING_DEALS.map((deal, idx) => {
                    const isActive = idx === activeDealIndex;
                    return (
                      <button
                        key={deal.id}
                        type="button"
                        onClick={() => handleSelectDeal(idx)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-[#C59B58] text-white shadow-xs font-black'
                            : 'bg-white border border-[#EAE4D7] text-[#7D715E] hover:border-[#C59B58] hover:text-[#1A1612]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-[#C59B58]'}`} />
                        <span>{deal.shortTitle}</span>
                        <span className={`text-[10px] font-normal ${isActive ? 'text-white/80' : 'text-[#A89F91]'}`}>
                          ({deal.shopName.replace(' Store', '').replace(' Official', '')})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Stage Body: 2 Columns (Balanced ~41% left, ~59% right) */}
                <div className="p-4 sm:p-6 lg:p-7 grid grid-cols-1 lg:grid-cols-[41fr_59fr] gap-6 lg:gap-8 flex-1">
                  
                  {/* Left Column: Product Image Gallery & Integrated ĐẠI HỘI SĂN DEAL Hub */}
                  <div className="flex flex-col gap-3">
                    <div
                      className="group/zoom relative h-[290px] sm:h-[310px] w-full overflow-hidden rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] shadow-inner cursor-zoom-in"
                      onClick={() => {
                        setZoomedImage({
                          src: currentDeal.images[heroGalleryIndex]?.src || currentDeal.images[0].src,
                          title: currentDeal.title,
                          brand: currentDeal.shopName,
                          price: currentVariant.price,
                          origPrice: currentVariant.origPrice,
                          badge: 'Flash Deal',
                          images: currentDeal.images,
                          currentIndex: heroGalleryIndex,
                        });
                      }}
                    >
                      <img
                        key={`${currentDeal.id}-${heroGalleryIndex}`}
                        src={currentDeal.images[heroGalleryIndex]?.src || currentDeal.images[0].src}
                        alt={currentDeal.images[heroGalleryIndex]?.label || currentDeal.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/zoom:scale-110 animate-in fade-in duration-300"
                      />
                      
                      {/* Shop badge on top-left */}
                      <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-lg border border-[#EAE4D7] bg-white/95 px-2 py-1 text-[10px] font-bold text-[#1A1612] shadow-2xs z-10 pointer-events-none">
                        <Store className="h-3 w-3 shrink-0 text-[#B88E4F]" />
                        <span>{currentDeal.shopName}</span>
                      </div>

                      {/* Flash Deal Selling Badge on bottom-left */}
                      <div className="absolute left-2.5 bottom-2.5 flex items-center gap-1.5 rounded-full border border-[#EEDFC6] bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-[#1A1612] shadow-2xs z-10 pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span>Đang mở bán Flash Deal</span>
                      </div>

                      {/* Magnifying Glass Icon Button on top-right */}
                      <button
                        type="button"
                        aria-label="Phóng to ảnh xem chi tiết"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomedImage({
                            src: currentDeal.images[heroGalleryIndex]?.src || currentDeal.images[0].src,
                            title: currentDeal.title,
                            brand: currentDeal.shopName,
                            price: currentVariant.price,
                            origPrice: currentVariant.origPrice,
                            badge: 'Flash Deal',
                            images: currentDeal.images,
                            currentIndex: heroGalleryIndex,
                          });
                        }}
                        className="absolute right-2.5 top-2.5 w-8 h-8 rounded-full border border-[#EEDFC6] bg-white/95 hover:bg-[#C59B58] text-[#1A1612] hover:text-white flex items-center justify-center shadow-md z-10 transition-all cursor-pointer group/zoombtn"
                        title="Bấm để phóng to ảnh xem chi tiết"
                      >
                        <ZoomIn className="w-4 h-4 text-[#B88E4F] group-hover/zoombtn:text-white transition-colors" />
                      </button>

                      {/* Prev/Next arrows for product gallery images */}
                      <button
                        type="button"
                        aria-label="Xem ảnh trước"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHeroGalleryIndex((current) => (current - 1 + currentDeal.images.length) % currentDeal.images.length);
                        }}
                        className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-[#EAE4D7] bg-white/90 text-[#1A1612] opacity-80 sm:opacity-0 group-hover/zoom:opacity-100 transition hover:bg-white shadow-sm cursor-pointer z-10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Xem ảnh tiếp theo"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHeroGalleryIndex((current) => (current + 1) % currentDeal.images.length);
                        }}
                        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-[#EAE4D7] bg-white/90 text-[#1A1612] opacity-80 sm:opacity-0 group-hover/zoom:opacity-100 transition hover:bg-white shadow-sm cursor-pointer z-10"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 5 Thumbnails */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {currentDeal.images.map((img, idx) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setHeroGalleryIndex(idx)}
                          aria-label={img.label}
                          className={`aspect-square overflow-hidden rounded-xl border bg-[#FAF8F5] p-0.5 transition cursor-pointer active:scale-95 ${
                            idx === heroGalleryIndex
                              ? 'border-2 border-[#C59B58] ring-2 ring-[#C59B58]/25'
                              : 'border-[#EAE4D7] hover:border-[#C59B58]'
                          }`}
                        >
                          <img src={img.src} alt="" className="h-full w-full rounded-lg object-cover" />
                        </button>
                      ))}
                    </div>

                    {/* Shopee-style Social Share & Wishlist Bar */}
                    <div className="flex items-center justify-between pt-1 text-xs text-[#7D715E] border-t border-[#EAE4D7]">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium">Chia sẻ:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toast.success('Đã chia sẻ lên Facebook Messenger')}
                            className="w-6 h-6 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] grid place-items-center text-[10px] font-black cursor-pointer transition"
                            title="Chia sẻ Messenger"
                          >
                            M
                          </button>
                          <button
                            type="button"
                            onClick={() => toast.success('Đã chia sẻ lên Facebook')}
                            className="w-6 h-6 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] grid place-items-center text-[10px] font-black cursor-pointer transition"
                            title="Chia sẻ Facebook"
                          >
                            f
                          </button>
                          <button
                            type="button"
                            onClick={handleCopyAffiliateLink}
                            className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#C59B58] text-[10.5px] font-medium text-[#1A1612] flex items-center gap-1 cursor-pointer transition"
                            title="Sao chép link tiếp thị"
                          >
                            <Copy className="w-2.5 h-2.5 text-[#B88E4F]" />
                            <span>{isCouponCopied ? 'Đã chép!' : 'Copy link'}</span>
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsHeroLiked(!isHeroLiked);
                          toast.success(!isHeroLiked ? 'Đã thêm vào danh sách yêu thích!' : 'Đã bỏ thích');
                        }}
                        className="flex items-center gap-1.5 text-xs text-[#DC2626] font-semibold cursor-pointer hover:opacity-80 transition"
                      >
                        <Heart className={`w-4 h-4 ${isHeroLiked ? 'fill-[#DC2626]' : ''}`} />
                        <span>Đã thích ({isHeroLiked ? '1.421' : '1.420'})</span>
                      </button>
                    </div>

                    {/* Compact Creator Endorsement Quote & Video Teaser */}
                    <div className="rounded-2xl border border-[#EEDFC6] bg-gradient-to-br from-[#FAF8F5] via-[#FFFDF9] to-[#FBF5EB] p-3 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={currentDeal.creator.avatar}
                          alt={currentDeal.creator.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#C59B58]/40 shadow-xs shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs font-black text-[#1A1612] truncate">{currentDeal.creator.name}</strong>
                            <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-black uppercase bg-[#FBF5EB] text-[#8C6226] border border-[#EEDFC6] shrink-0">
                              {currentDeal.creator.tier}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7D715E] italic truncate m-0">
                            "{currentDeal.creator.quote}"
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsQuickVideoOpen(true)}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F3EFE6] border border-[#EEDFC6] text-[#8C6226] text-xs font-bold transition shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                      >
                        <Play className="w-3 h-3 text-[#B88E4F] fill-[#B88E4F]" />
                        <span>Xem clip 32s</span>
                      </button>
                    </div>

                    {/* Sàn Voucher Clean Strip */}
                    <div className="rounded-xl border border-[#EEDFC6] bg-white p-2.5 flex items-center justify-between gap-2 shadow-2xs text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] grid place-items-center shrink-0">
                          <Ticket className="w-3.5 h-3.5 text-[#B88E4F]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase bg-[#FBF5EB] border border-[#EEDFC6] text-[#8C6226] px-1 py-0.2 rounded">Voucher Sàn</span>
                            <strong className="font-mono text-xs text-[#1A1612]">SCANMS50K</strong>
                            <button
                              type="button"
                              onClick={() => handleCopyCoupon('SCANMS50K')}
                              className="text-[#7D715E] hover:text-[#B88E4F] transition cursor-pointer p-0.5"
                              title="Sao chép mã"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[10px] text-[#7D715E] block truncate">Giảm 50.000₫ đơn từ 250k</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveVoucher}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                          isVoucherSaved
                            ? 'bg-[#FBF5EB] text-[#059669] border border-[#059669]/40'
                            : 'bg-[#C59B58] hover:bg-[#B88E4F] text-white shadow-2xs'
                        }`}
                      >
                        {isVoucherSaved ? '✓ Đã lưu' : 'Lưu mã'}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Unified Shopee Mall-Style Product Command Center */}
                  <div className="flex flex-col justify-between gap-4 min-w-0">
                    
                    {/* Row 1: Official Store & Endorsing Creator Header */}
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] text-xs flex-wrap">
                      {/* Left: Official Shop Info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#EEDFC6] text-sm flex items-center justify-center shrink-0 shadow-2xs">
                          🏪
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs font-black text-[#1A1612] truncate">
                              {currentDeal.shopName}
                            </strong>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-[#059669]/10 text-[#059669] border border-[#059669]/20 shrink-0">
                              ✓ MALL
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10.5px] text-[#7D715E] mt-0.5">
                            <span className="text-amber-500 font-bold">4.9 ★</span>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleChatShop(currentDeal.shopName)}
                              className="text-[#8C6226] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>Chat ngay</span>
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleFilterShop(currentDeal.shopName)}
                              className="text-[#7D715E] hover:text-[#1A1612] cursor-pointer flex items-center gap-0.5"
                            >
                              <span>Xem Shop</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Endorsing Creator Pill with Video review button */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsQuickVideoOpen(true)}
                          className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-white border border-[#EEDFC6] hover:border-[#C59B58] transition shadow-2xs cursor-pointer group/creator"
                          title="Xem video review từ Creator"
                        >
                          <img
                            src={currentDeal.creator.avatar}
                            alt={currentDeal.creator.name}
                            className="w-6 h-6 rounded-full object-cover border border-[#C59B58]"
                          />
                          <div className="text-left">
                            <span className="text-[10px] text-[#7D715E] block leading-none">Khuyên dùng bởi</span>
                            <strong className="text-[11px] font-bold text-[#1A1612] group-hover/creator:text-[#B88E4F] transition leading-tight block">
                              {currentDeal.creator.name}
                            </strong>
                          </div>
                          <div className="w-5 h-5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0 ml-0.5">
                            <Play className="w-2.5 h-2.5 fill-[#B88E4F] ml-0.5" />
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Product Title & Social Stats (Shopee Style) */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#C59B58] text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                          MALL CHÍNH HÃNG
                        </span>
                        <h1 className="m-0 text-lg sm:text-xl xl:text-2xl font-black text-[#1A1612] leading-snug">
                          {currentDeal.title}
                        </h1>
                      </div>

                      {/* Shopee-style Rating & Sold Row */}
                      <div className="flex items-center gap-3 text-xs text-[#7D715E] flex-wrap pt-0.5">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[#B88E4F] underline underline-offset-2">{currentDeal.rating}</span>
                          <div className="flex items-center text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                        </div>
                        <span className="text-[#EAE4D7]">|</span>
                        <span><strong className="text-[#1A1612] font-bold">1.420</strong> Đánh Giá</span>
                        <span className="text-[#EAE4D7]">|</span>
                        <span><strong className="text-[#1A1612] font-bold">{currentDeal.soldCount}</strong></span>
                        <span className="text-[#EAE4D7]">|</span>
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[10.5px]">
                          <Flame className="w-3 h-3 text-amber-600 animate-pulse" />
                          28 người đang xem lúc này
                        </span>
                      </div>
                    </div>

                    {/* Row 3: Flash Sale Urgency & Pricing Box (Đúng chuẩn Shopee Flash Sale) */}
                    <div className="rounded-2xl border-2 border-[#EEDFC6] bg-gradient-to-r from-[#FAF8F5] via-[#FFFDF9] to-[#FBF5EB] p-4 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-baseline gap-3">
                          <span className="text-sm text-[#7D715E] line-through">
                            {heroProductData.origPrice.toLocaleString('vi-VN')} ₫
                          </span>
                          <strong className="text-2xl sm:text-3xl font-black text-[#B88E4F] tracking-tight">
                            {heroProductData.finalPrice.toLocaleString('vi-VN')} ₫
                          </strong>
                          <span className="px-2 py-0.5 rounded-md bg-[#DC2626] text-white text-xs font-black tracking-wide shadow-2xs">
                            -{heroProductData.discountPercent}% GIẢM
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-[#8C6226] font-bold bg-white px-2.5 py-1 rounded-xl border border-[#EEDFC6] shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-[#B88E4F]" />
                          <span className="text-[10px] uppercase tracking-wider text-[#7D715E]">KẾT THÚC TRONG</span>
                          <span className="font-mono font-black text-[#1A1612]">
                            {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      {/* Urgency Progress Bar (Shopee Flash Sale Style) */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex-1 bg-[#EAE4D7] h-2.5 rounded-full overflow-hidden relative">
                          <div
                            className="bg-gradient-to-r from-[#C59B58] to-[#DC2626] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(20, 100 - heroProductData.stock * 6))}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-[#DC2626] flex items-center gap-1 shrink-0">
                          <Flame className="w-3.5 h-3.5 fill-[#DC2626]" />
                          Đang bán chạy (Còn {heroProductData.stock} suất giá sốc)
                        </span>
                      </div>
                    </div>

                    {/* Row 4: Clickable Voucher Chips (Shopee Style: Click thu thập trực tiếp) */}
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      <span className="text-[#7D715E] font-medium w-24 shrink-0 flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5 text-[#B88E4F]" />
                        Mã giảm giá:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        <button
                          type="button"
                          onClick={() => setHeroVoucherId('platform')}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            heroVoucherId === 'platform'
                              ? 'border-[#C59B58] bg-[#C59B58] text-white shadow-2xs font-black'
                              : 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8C6226] hover:border-[#C59B58]'
                          }`}
                        >
                          <Ticket className="w-3 h-3" />
                          <span>Giảm 10% Toàn Sàn</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setHeroVoucherId('creator')}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            heroVoucherId === 'creator'
                              ? 'border-[#C59B58] bg-[#C59B58] text-white shadow-2xs font-black'
                              : 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8C6226] hover:border-[#C59B58]'
                          }`}
                        >
                          <Gift className="w-3 h-3" />
                          <span>Mã KOL {currentDeal.creator.coupon} (-10%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setHeroVoucherId('shop')}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            heroVoucherId === 'shop'
                              ? 'border-[#C59B58] bg-[#C59B58] text-white shadow-2xs font-black'
                              : 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8C6226] hover:border-[#C59B58]'
                          }`}
                        >
                          <Store className="w-3 h-3" />
                          <span>Giảm 5% Shop</span>
                        </button>

                        {/* Inline Custom Coupon Mini Input */}
                        {!appliedCustomCoupon ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={customCouponInput}
                              onChange={(e) => setCustomCouponInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomCoupon()}
                              placeholder="Nhập mã riêng..."
                              className="w-32 sm:w-36 px-3 py-1.5 rounded-lg border border-[#EEDFC6] bg-white text-xs font-mono uppercase text-[#1A1612] placeholder:text-[#A89F91] placeholder:normal-case placeholder:font-sans focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/25 focus:outline-none shadow-2xs transition"
                            />
                            {customCouponInput && (
                              <button
                                type="button"
                                onClick={() => handleApplyCustomCoupon()}
                                className="px-3 py-1.5 rounded-lg bg-[#C59B58] text-white text-xs font-bold hover:bg-[#B88E4F] cursor-pointer shadow-2xs transition active:scale-95"
                              >
                                Áp dụng
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-[#059669] bg-[#059669]/10 px-2 py-1 rounded-lg border border-[#059669]/20">
                            <span>✓ {appliedCustomCoupon.code}</span>
                            <button
                              type="button"
                              onClick={handleRemoveCustomCoupon}
                              className="text-[#DC2626] hover:underline ml-1 cursor-pointer font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsVoucherWalletOpen(true)}
                          className="text-[11px] font-bold text-[#B88E4F] hover:underline cursor-pointer ml-auto shrink-0"
                        >
                          Ví voucher &gt;
                        </button>
                      </div>
                    </div>

                    {/* Row 5: Shipping Info (Shopee Style) */}
                    <div className="flex items-center gap-3 text-xs flex-wrap border-y border-[#EAE4D7]/70 py-2.5 relative">
                      <span className="text-[#7D715E] font-medium w-24 shrink-0 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-[#B88E4F]" />
                        Vận chuyển:
                      </span>
                      <div className="flex items-center gap-3 flex-wrap flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#1A1612]">Giao tới {selectedCity}</span>
                          <button
                            type="button"
                            onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                            className="text-[#B88E4F] font-bold hover:underline cursor-pointer flex items-center text-[11px]"
                          >
                            [Thay đổi]
                          </button>
                        </div>

                        {/* City Dropdown Menu */}
                        {isCityDropdownOpen && (
                          <div className="absolute top-full left-24 mt-1 z-30 w-48 rounded-xl border border-[#EEDFC6] bg-white p-1.5 shadow-lg">
                            {DELIVERY_OPTIONS.map((opt) => (
                              <button
                                key={opt.city}
                                type="button"
                                onClick={() => {
                                  setSelectedCity(opt.city);
                                  setIsCityDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                  selectedCity === opt.city
                                    ? 'bg-[#FBF5EB] text-[#8C6226]'
                                    : 'text-[#1A1612] hover:bg-[#FAF8F5]'
                                }`}
                              >
                                <span>{opt.city}</span>
                                {selectedCity === opt.city && <Check className="w-3 h-3 text-[#B88E4F]" />}
                              </button>
                            ))}
                          </div>
                        )}

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#059669]/10 text-[#059669] border border-[#059669]/20 flex items-center gap-1">
                          ✓ Freeship Extra
                        </span>
                        <span className="text-[#7D715E] text-[11px] flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-[#B88E4F]" />
                          <span>Dự kiến nhận: 17 - 19/09</span>
                        </span>
                      </div>
                    </div>

                    {/* Row 6: Variants & Quantity Stepper */}
                    <div className="flex flex-col gap-3">
                      {/* Variants */}
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <span className="text-[#7D715E] font-medium w-24 shrink-0">Phân loại:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {currentDeal.variants.map((variant, idx) => {
                            const isSelected = idx === selectedVariantIndex;
                            return (
                              <button
                                key={variant.name}
                                type="button"
                                onClick={() => setSelectedVariantIndex(idx)}
                                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'border-[#C59B58] bg-[#FBF5EB] text-[#8C6226] ring-1 ring-[#C59B58] font-black shadow-2xs'
                                    : 'border-[#EAE4D7] bg-white text-[#1A1612] hover:border-[#C59B58]'
                                }`}
                              >
                                <span>{variant.name}</span>
                                {isSelected && <Check className="w-3 h-3 text-[#B88E4F]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        <span className="text-[#7D715E] font-medium w-24 shrink-0">Số lượng:</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-[#EAE4D7] rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setHeroQuantity((q) => Math.max(1, q - 1))}
                              className="w-7 h-7 flex items-center justify-center hover:bg-[#FAF8F5] text-[#1A1612] transition cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold font-mono text-[#1A1612]">
                              {heroQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setHeroQuantity((q) => Math.min(7, q + 1))}
                              className="w-7 h-7 flex items-center justify-center hover:bg-[#FAF8F5] text-[#1A1612] transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[11px] text-[#7D715E]">Còn {heroProductData.stock} sản phẩm</span>
                          <span className="text-[#EAE4D7]">|</span>
                          <div className="text-xs">
                            <span className="text-[#7D715E]">Tạm tính: </span>
                            <strong className="text-sm font-black text-[#B88E4F]">
                              {(heroProductData.finalPrice * heroQuantity).toLocaleString('vi-VN')} ₫
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 7: Main CTA Buttons */}
                    <div className="flex items-center gap-3.5 pt-1">
                      <button
                        type="button"
                        onClick={handleHeroAddToCart}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl border-2 border-[#C59B58] bg-[#FBF5EB] hover:bg-[#F3EFE6] text-[#8C6226] text-sm font-black transition shadow-xs cursor-pointer active:scale-98"
                      >
                        <ShoppingCart className="w-4.5 h-4.5 text-[#B88E4F]" />
                        <span>Thêm Vào Giỏ Hàng</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleHeroBuyNow}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:opacity-95 text-white text-sm font-black transition shadow-md shadow-[#C59B58]/25 cursor-pointer active:scale-98"
                      >
                        <span>Mua Ngay Deal Này</span>
                        <ArrowRight className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    {/* Row 8: Shopee Mall Guarantees & Affiliate Transparency */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-[#EAE4D7] text-xs">
                      {/* Mall Guarantees */}
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-[11px] text-[#7D715E] flex-wrap">
                        <span className="flex items-center gap-1 text-[#1A1612] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                          100% Chính Hãng
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-[#B88E4F]" />
                          14 Ngày Đổi Trả
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-[#B88E4F]" />
                          Đồng Kiểm Khi Nhận
                        </span>
                      </div>

                      {/* Affiliate CTV Commission & Referral Link */}
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Coins className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                          <div className="truncate">
                            <span className="text-[10px] text-[#7D715E] block leading-none">Hoa hồng CTV nhận:</span>
                            <strong className="text-xs font-black text-[#B88E4F]">
                              18% (~{Math.round(heroProductData.finalPrice * 0.18).toLocaleString('vi-VN')}₫)
                            </strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyAffiliateLink}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:opacity-95 text-white text-[10.5px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Lấy Link CTV</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>


          </div>
      </section>

      <section className="pt-6 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1520px] mx-auto w-full text-left">
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

      <section ref={catalogRef} id="catalog-section" className="py-10 px-4 sm:px-6 lg:px-8 max-w-[1520px] mx-auto w-full text-left border-t border-[#EAE4D7]">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-[#C59B58]/80 transition duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div
                    className="relative aspect-square bg-[#FAF8F5] overflow-hidden group/img cursor-pointer"
                    onClick={() => {
                      setZoomedImage({
                        src: p.image,
                        title: p.name,
                        brand: p.brand,
                        price: p.price,
                        origPrice: p.origPrice,
                        badge: p.badge,
                      });
                    }}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {p.badge && (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#C59B58] text-white text-[10px] font-black shadow-xs pointer-events-none z-10">
                        {p.badge}
                      </span>
                    )}

                    {/* Top-Right: Discount Badge & Compact Magnifying Glass (Icon only, never covers bottom text) */}
                    <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 z-10">
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200 pointer-events-none shadow-2xs">
                        -15%
                      </span>
                      <button
                        type="button"
                        aria-label="Phóng to ảnh sản phẩm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomedImage({
                            src: p.image,
                            title: p.name,
                            brand: p.brand,
                            price: p.price,
                            origPrice: p.origPrice,
                            badge: p.badge,
                          });
                        }}
                        className="w-7 h-7 rounded-full bg-white/95 hover:bg-[#C59B58] text-[#1A1612] hover:text-white border border-[#EAE4D7] hover:border-[#C59B58] shadow-sm flex items-center justify-center transition-all duration-200 cursor-pointer group/btn"
                        title="Bấm để phóng to ảnh"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-[#B88E4F] group-hover/btn:text-white transition-colors" />
                      </button>
                    </div>

                    {/* Subtle hover overlay hint */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 pointer-events-none" />
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

      <section ref={trackingRef} id="tracking-section" className="py-12 px-4 sm:px-6 lg:px-8 bg-[#F3EFE6] border-t border-[#EAE4D7]">
        <div className="max-w-5xl xl:max-w-6xl mx-auto text-left">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold text-[#B88E4F] uppercase tracking-wider">
              Tra cứu minh bạch
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1612] mt-1 m-0">
              Tra cứu hành trình đơn hàng
            </h2>
            <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
              Nhập Số điện thoại mua hàng hoặc Mã vận đơn để kiểm tra trạng thái và lịch trình vận chuyển thực tế.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-[#1A1612] bg-white border border-[#EEDFC6] hover:bg-[#FAF8F5] hover:border-[#C59B58] transition shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span>Quay lại Sàn mua sắm</span>
              </button>
              <Link
                to="/tracking"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#8C6226] bg-[#FBF5EB] border border-[#EEDFC6] hover:bg-[#F3EFE6] transition shadow-2xs cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span>Trang Tra cứu & Đánh giá 5 sao</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#B88E4F]" />
              </Link>
            </div>
            {recentGuestOrder && (
              <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#8C6226] bg-[#FBF5EB] border border-[#EEDFC6]">
                <Package className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span>Đơn hàng vừa đặt: <strong>{recentGuestOrder.publicOrderCode}</strong></span>
                <Link
                  to={`/tracking?sn=${recentGuestOrder.publicOrderCode}`}
                  className="inline-flex items-center gap-1 text-[#B88E4F] hover:underline font-black ml-1"
                >
                  <span>Tra cứu ngay</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          <form
            onSubmit={handleTrackOrder}
            className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto bg-white p-2 rounded-2xl border border-[#EEDFC6] shadow-sm"
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

          {/* Order-to-Delivery Progress Bar Card (Thanh tiến độ Mua hàng ➔ Nhận hàng) */}
          <div className="mt-8 bg-white border border-[#EEDFC6] rounded-3xl p-6 sm:p-8 shadow-sm text-left">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#EAE4D7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shadow-2xs">
                  <Truck className="w-5 h-5 text-[#B88E4F]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1A1612] m-0 flex items-center gap-2 flex-wrap">
                    <span>Thanh Tiến Độ Mua Hàng ➔ Nhận Hàng</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FBF5EB] text-[#8C6226] text-[10px] font-black uppercase border border-[#EEDFC6]">
                      5 Bước Bảo Hộ Minh Bạch
                    </span>
                  </h3>
                  <p className="text-xs text-[#7D715E] mt-0.5 m-0">
                    Theo dõi chi tiết hành trình từ lúc bạn bấm mua đến khi mở hộp kiểm tra và nhận hàng tận tay
                  </p>
                </div>
              </div>

              {trackResult ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Đơn {trackResult.orderCode}: <strong>{trackResult.status}</strong></span>
                </div>
              ) : (
                <div className="text-xs text-[#7D715E] flex items-center gap-2 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#EAE4D7]">
                  <span className="w-2 h-2 rounded-full bg-[#059669]" />
                  <span>Bấm vào từng bước để xem quy trình chi tiết</span>
                </div>
              )}
            </div>

            {/* Stepper Flow with Horizontal Connecting Line */}
            <div className="pt-8 pb-4">
              <div className="relative">
                {/* Connecting Track Line behind the nodes */}
                <div className="absolute top-5 left-10 right-10 h-1 bg-[#EAE4D7] rounded-full hidden md:block" />
                <div
                  className="absolute top-5 left-10 h-1 bg-gradient-to-r from-[#C59B58] via-[#B88E4F] to-[#059669] rounded-full transition-all duration-500 hidden md:block"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((currentActiveStage - 1) / (ORDER_PROGRESS_STAGES.length - 1)) * 100))}%`,
                  }}
                />

                {/* 5 Step Nodes */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-2 relative z-10">
                  {ORDER_PROGRESS_STAGES.map((st, idx) => {
                    const isPassed = idx + 1 < currentActiveStage;
                    const isCurrent = idx + 1 === currentActiveStage;
                    const IconComponent = st.icon;

                    return (
                      <button
                        key={st.step}
                        type="button"
                        onClick={() => !trackResult && setPreviewStageIndex(idx + 1)}
                        className={`flex md:flex-col items-center md:items-center text-left md:text-center gap-3.5 md:gap-2.5 p-3 md:p-2 rounded-2xl transition cursor-pointer border ${
                          isCurrent
                            ? 'bg-[#FBF5EB] border-[#C59B58] shadow-xs'
                            : isPassed
                            ? 'bg-white border-[#EAE4D7] hover:border-[#059669]/40'
                            : 'bg-white/60 border-transparent hover:border-[#EAE4D7]'
                        }`}
                      >
                        {/* Step Node Circle with Icon */}
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm shrink-0 relative ${
                            isPassed
                              ? 'bg-[#059669] text-white'
                              : isCurrent
                              ? 'bg-gradient-to-br from-[#C59B58] to-[#B88E4F] text-white ring-4 ring-[#C59B58]/25 scale-105 shadow-md'
                              : 'bg-[#FAF8F5] border-2 border-[#EAE4D7] text-[#A89F91]'
                          }`}
                        >
                          {isPassed ? (
                            <Check className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <IconComponent className="w-5 h-5" />
                          )}
                          {isCurrent && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C59B58]" />
                            </span>
                          )}
                        </div>

                        {/* Step Texts */}
                        <div className="min-w-0 flex-1 md:flex-initial">
                          <div className="flex items-center gap-1.5 md:justify-center">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider ${
                                isCurrent
                                  ? 'text-[#B88E4F]'
                                  : isPassed
                                  ? 'text-[#059669]'
                                  : 'text-[#A89F91]'
                              }`}
                            >
                              Bước {st.step}
                            </span>
                            <span className="text-[10px] text-[#A89F91] hidden sm:inline">• {st.timeText}</span>
                          </div>
                          <h4
                            className={`text-xs sm:text-sm font-black m-0 mt-0.5 leading-snug ${
                              isCurrent
                                ? 'text-[#1A1612]'
                                : isPassed
                                ? 'text-[#1A1612]'
                                : 'text-[#7D715E]'
                            }`}
                          >
                            {st.title}
                          </h4>
                          <p className="text-[11px] text-[#7D715E] m-0 mt-1 line-clamp-2 leading-relaxed">
                            {st.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Explanatory Policy Callout for Current Stage */}
            <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2 text-[#7D715E]">
                <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                <span>
                  <strong>Đồng kiểm an tâm 100%:</strong> Khi kiện hàng đến nơi, bạn được quyền mở hộp đồng kiểm tra hàng cùng nhân viên giao vận trước khi nhận hàng và thanh toán.
                </span>
              </div>
              <Link
                to="/tracking"
                className="text-xs font-bold text-[#8C6226] hover:text-[#B88E4F] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Xem trang tra cứu chi tiết</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
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

      <footer className="bg-[#F3EFE6] border-t border-[#EAE4D7] text-[#1A1612] py-12 px-4 sm:px-6 lg:px-8 mt-auto text-left">
        <div className="max-w-[1520px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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

        <div className="max-w-[1520px] mx-auto border-t border-[#EAE4D7] mt-8 pt-6 flex flex-wrap items-center justify-between text-xs text-[#7D715E]">
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
          <div className="bg-black text-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
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
          <div className="bg-white rounded-3xl max-w-2xl lg:max-w-3xl w-full p-6 sm:p-8 border border-[#EAE4D7] shadow-2xl relative text-left">
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
          initialQuantity={activeCheckoutProduct.quantity}
          initialCouponCode={activeCheckoutProduct.couponCode}
          onOrderPlaced={(order) => {
            const code = order?.publicOrderCode || order?.orderId;
            toast.success(`Đặt hàng thành công! Mã đơn: ${code}`);
            if (code) {
              setRecentGuestOrder({ publicOrderCode: code });
            }
          }}
        />
      )}

      {/* Quick Video Review Modal */}
      {isQuickVideoOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsQuickVideoOpen(false)}
        >
          <div
            className="bg-[#1A1612] text-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative text-left border border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-2.5">
                <img
                  src="/reference/assets/kol-avatar-nhat.jpg"
                  alt="Trần Văn Nhật"
                  className="w-8 h-8 rounded-full border border-[#C59B58] object-cover"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-bold text-white">Trần Văn Nhật</strong>
                    <span className="px-1.5 py-0.2 rounded bg-[#C59B58] text-black text-[9px] font-black uppercase">
                      KOL Vàng
                    </span>
                  </div>
                  <span className="text-[10px] text-white/70 block">Review thực tế 35s</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickVideoOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-[9/14] max-h-[60vh] w-full bg-black flex items-center justify-center">
              <video
                src="/reference/assets/sample-video.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer / Quick Action */}
            <div className="p-3.5 bg-gradient-to-t from-black via-black/90 to-transparent border-t border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Mã ưu đãi: NHATXINH10 (-10%)</span>
                </div>
                <span className="text-[11px] text-white/80 truncate block">
                  Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsQuickVideoOpen(false);
                  handleHeroBuyNow();
                }}
                className="px-4 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-black transition shadow-sm cursor-pointer shrink-0"
              >
                Mua ngay deal này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Wallet Modal */}
      {isVoucherWalletOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsVoucherWalletOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl lg:max-w-3xl w-full p-6 sm:p-8 border border-[#EEDFC6] shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4D7] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center">
                  <Gift className="w-5 h-5 text-[#B88E4F]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1A1612] m-0">Ví Voucher Ưu Đãi SCANMS</h3>
                  <span className="text-xs text-[#7D715E]">Chọn voucher tốt nhất áp dụng cho sản phẩm này</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherWalletOpen(false)}
                className="text-[#7D715E] hover:text-[#1A1612] p-1.5 rounded-full hover:bg-[#F3EFE6] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {/* Voucher 1: SCANMS50K */}
              <div className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                heroVoucherId === 'platform' ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7] bg-white'
              }`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#C59B58] text-white text-[10px] font-black uppercase">
                      Toàn sàn
                    </span>
                    <strong className="text-sm font-black text-[#1A1612]">SCANMS50K</strong>
                  </div>
                  <p className="text-xs text-[#1A1612] font-semibold m-0">Giảm 10% (Tối đa 100.000đ)</p>
                  <p className="text-[11px] text-[#7D715E] m-0 mt-0.5">Áp dụng đơn từ 250.000đ • HSD: 30/09/2026</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHeroVoucherId('platform');
                    setIsVoucherWalletOpen(false);
                    toast.success('Đã chọn voucher toàn sàn SCANMS50K!');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                    heroVoucherId === 'platform'
                      ? 'bg-[#C59B58] text-white'
                      : 'border border-[#C59B58] text-[#8C6226] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {heroVoucherId === 'platform' ? 'Đang dùng' : 'Áp dụng'}
                </button>
              </div>

              {/* Voucher 2: NHATXINH10 */}
              <div className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                heroVoucherId === 'creator' ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7] bg-white'
              }`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#B88E4F] text-white text-[10px] font-black uppercase">
                      Creator
                    </span>
                    <strong className="text-sm font-black text-[#1A1612]">NHATXINH10</strong>
                  </div>
                  <p className="text-xs text-[#1A1612] font-semibold m-0">Giảm 10% (Tối đa 50.000đ)</p>
                  <p className="text-[11px] text-[#7D715E] m-0 mt-0.5">Mã độc quyền từ Creator Trần Văn Nhật</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHeroVoucherId('creator');
                    setIsVoucherWalletOpen(false);
                    toast.success('Đã chọn voucher Creator NHATXINH10!');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                    heroVoucherId === 'creator'
                      ? 'bg-[#C59B58] text-white'
                      : 'border border-[#C59B58] text-[#8C6226] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {heroVoucherId === 'creator' ? 'Đang dùng' : 'Áp dụng'}
                </button>
              </div>

              {/* Voucher 3: SORASKIN5 */}
              <div className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                heroVoucherId === 'shop' ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7] bg-white'
              }`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#8C6226] text-white text-[10px] font-black uppercase">
                      Shop
                    </span>
                    <strong className="text-sm font-black text-[#1A1612]">SORASKIN5</strong>
                  </div>
                  <p className="text-xs text-[#1A1612] font-semibold m-0">Giảm 5% (Tối đa 30.000đ)</p>
                  <p className="text-[11px] text-[#7D715E] m-0 mt-0.5">Áp dụng gian hàng Sora Skin Official</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHeroVoucherId('shop');
                    setIsVoucherWalletOpen(false);
                    toast.success('Đã chọn voucher Shop SORASKIN5!');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                    heroVoucherId === 'shop'
                      ? 'bg-[#C59B58] text-white'
                      : 'border border-[#C59B58] text-[#8C6226] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {heroVoucherId === 'shop' ? 'Đang dùng' : 'Áp dụng'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsVoucherWalletOpen(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-black transition cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      )}

      {/* Product Image Lightbox / Zoom Modal (Clean: Image + Close Button Only) */}
      {zoomedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh sản phẩm phóng to"
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => {
            setZoomedImage(null);
          }}
        >
          {/* Close Button (Nút tắt ảnh ở góc trên bên phải) */}
          <button
            type="button"
            aria-label="Đóng ảnh"
            onClick={() => {
              setZoomedImage(null);
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-[#C59B58] text-white border border-white/20 hover:border-[#C59B58] flex items-center justify-center transition-all duration-200 shadow-xl cursor-pointer active:scale-95 group"
            title="Đóng (Esc)"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
          </button>

          {/* Gallery Previous Arrow (if multi-images) */}
          {zoomedImage.images && zoomedImage.images.length > 1 && (
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={(e) => {
                e.stopPropagation();
                const images = zoomedImage.images!;
                const cur = zoomedImage.currentIndex ?? 0;
                const nextIdx = (cur - 1 + images.length) % images.length;
                setZoomedImage({
                  ...zoomedImage,
                  src: images[nextIdx].src,
                  currentIndex: nextIdx,
                });
              }}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-[#C59B58] border border-white/20 hover:border-[#C59B58] text-white flex items-center justify-center transition shadow-xl cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main Enlarged Image */}
          <div
            className="relative max-h-[90vh] max-w-[92vw] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedImage.src}
              alt={zoomedImage.title}
              className="max-h-[88vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl select-none animate-in zoom-in-95 duration-200"
            />
          </div>

          {/* Gallery Next Arrow (if multi-images) */}
          {zoomedImage.images && zoomedImage.images.length > 1 && (
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={(e) => {
                e.stopPropagation();
                const images = zoomedImage.images!;
                const cur = zoomedImage.currentIndex ?? 0;
                const nextIdx = (cur + 1) % images.length;
                setZoomedImage({
                  ...zoomedImage,
                  src: images[nextIdx].src,
                  currentIndex: nextIdx,
                });
              }}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-[#C59B58] border border-white/20 hover:border-[#C59B58] text-white flex items-center justify-center transition shadow-xl cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Floating Sticky Quick-Buy Bar on Mobile & Desktop Scroll */}
      {isHeroScrolledPast && (
        <aside
          aria-label="Thanh mua nhanh cố định"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE4D7] shadow-xl px-4 py-2.5 sm:py-3 animate-in slide-in-from-bottom duration-200"
        >
          <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentDeal.images[heroGalleryIndex]?.src || currentDeal.images[0]?.src}
                alt=""
                className="w-10 h-10 rounded-xl object-cover border border-[#EAE4D7] shrink-0"
              />
              <div className="min-w-0">
                <span className="block text-xs sm:text-sm font-black text-[#1A1612] truncate max-w-[180px] sm:max-w-[400px]">
                  {currentDeal.title} ({currentVariant.name})
                </span>
                <div className="flex items-baseline gap-2 text-xs">
                  <strong className="font-black text-[#B88E4F]">
                    {heroProductData.finalPrice.toLocaleString('vi-VN')} đ
                  </strong>
                  <span className="text-[10px] text-[#7D715E] line-through hidden sm:inline">
                    {heroProductData.origPrice.toLocaleString('vi-VN')} đ
                  </span>
                  <span className="text-[10px] font-bold text-[#DC2626]">
                    -{heroProductData.discountPercent}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center border border-[#EAE4D7] rounded-lg bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setHeroQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 flex items-center justify-center hover:bg-[#FAF8F5] text-[#1A1612] transition cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-xs font-bold font-mono text-[#1A1612]">
                  {heroQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setHeroQuantity((q) => Math.min(7, q + 1))}
                  className="w-7 h-7 flex items-center justify-center hover:bg-[#FAF8F5] text-[#1A1612] transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleHeroAddToCart}
                className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#C59B58] bg-white hover:bg-[#FAF8F5] text-[#8C6226] text-xs font-black transition shadow-2xs cursor-pointer active:scale-95"
                title="Thêm vào giỏ hàng"
              >
                <ShoppingCart className="w-4 h-4 text-[#B88E4F]" />
              </button>

              <button
                type="button"
                onClick={handleHeroBuyNow}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:opacity-95 text-white text-xs font-black transition shadow-md shadow-[#C59B58]/20 cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>Mua ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
