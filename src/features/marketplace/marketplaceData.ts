import type { Product, Creator, ReviewVideo } from './marketplace.types';






export const marketplaceProducts: Product[] = [
  {
    id: "P01",
    name: "Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Sora Skin",
    brand: "Sora Skin Official",
    category: "skincare",
    categoryLabel: "Chăm sóc da & Serum",
    rating: 4.9,
    reviews: 142,
    sold: "1.4k",
    origPrice: 520000,
    price: 459000,
    kolDiscountPrice: 413100,
    image: "/reference/assets/serum-hero-optimized.jpg",
    kol: {
      name: "Trần Văn Nhật",
      handle: "@nhatbeauty",
      coupon: "NHATXINH10",
      tier: "KOL Vàng"
    },
    badge: "Bán chạy nhất"
  },
  {
    id: "P02",
    name: "Kem Chống Nắng Phục Hồi Quang Phổ Rộng Aqua Sunscreen SPF50+ PA++++",
    brand: "Sora Skin Official",
    category: "skincare",
    categoryLabel: "Chăm sóc da & Chống nắng",
    rating: 4.8,
    reviews: 98,
    sold: "2.1k",
    origPrice: 430000,
    price: 389000,
    kolDiscountPrice: 350100,
    image: "/reference/assets/sunscreen-product.jpg",
    kol: {
      name: "Lê Mai Anh",
      handle: "@maianh.beauty",
      coupon: "MAIANH12",
      tier: "KOL Vàng"
    },
    badge: "Top 1 Chống nắng"
  },
  {
    id: "P03",
    name: "Toner BHA 2% Làm Sạch Sâu & Kiềm Dầu Thu Nhỏ Lỗ Chân Lông",
    brand: "Sora Skin Official",
    category: "skincare",
    categoryLabel: "Chăm sóc da & Toner",
    rating: 4.7,
    reviews: 86,
    sold: "820",
    origPrice: 390000,
    price: 349000,
    kolDiscountPrice: 314100,
    image: "/reference/assets/toner-bha-product.jpg",
    kol: {
      name: "Lê Mai Anh",
      handle: "@maianh.beauty",
      coupon: "MAIANH12",
      tier: "KOL Vàng"
    }
  },
  {
    id: "P04",
    name: "Mặt Nạ Phục Hồi Cica Soothing Mask (Hộp 5 miếng làm dịu da cấp tốc)",
    brand: "Sora Skin Official",
    category: "skincare",
    categoryLabel: "Chăm sóc da & Mặt nạ",
    rating: 5.0,
    reviews: 114,
    sold: "980",
    origPrice: 220000,
    price: 189000,
    kolDiscountPrice: 170100,
    image: "/reference/assets/cica-mask-product.jpg",
    kol: {
      name: "Trần Văn Nhật",
      handle: "@nhatbeauty",
      coupon: "NHATXINH10",
      tier: "KOL Vàng"
    }
  },
  {
    id: "P05",
    name: "Gel Rửa Mặt Dịu Nhẹ Tràm Trà Gentle Foam Cleanser Phục Hồi Hàng Rào Da",
    brand: "Sora Skin Official",
    category: "skincare",
    categoryLabel: "Chăm sóc da & Rửa mặt",
    rating: 4.9,
    reviews: 215,
    sold: "3.2k",
    origPrice: 310000,
    price: 279000,
    kolDiscountPrice: 251100,
    image: "/reference/assets/cleanser-product.jpg",
    kol: {
      name: "Phạm Khánh Linh",
      handle: "@linhskincare",
      coupon: "LINHSKIN",
      tier: "KOL Bạc"
    },
    badge: "Da dầu mụn"
  },
  {
    id: "P06",
    name: "Nồi Chiên Không Dầu Điện Tử ZenHome Smart AirFryer 6.5L Cảm Ứng",
    brand: "ZenHome Official",
    category: "home",
    categoryLabel: "Gia dụng & Đời sống",
    rating: 4.9,
    reviews: 74,
    sold: "640",
    origPrice: 1450000,
    price: 1250000,
    kolDiscountPrice: 1125000,
    image: "/reference/assets/shop-ctv-collab-hero.jpg",
    kol: {
      name: "Tuấn Review",
      handle: "@tuanreview",
      coupon: "TUANREVIEW",
      tier: "KOL Bạc"
    },
    badge: "Gia dụng thông minh"
  },
  {
    id: "P07",
    name: "Bình Giữ Nhiệt Inox 316 Khắc Tên ZenHome Smart 800ml Kèm Lọc Trà",
    brand: "ZenHome Official",
    category: "home",
    categoryLabel: "Gia dụng & Đời sống",
    rating: 4.9,
    reviews: 160,
    sold: "1.8k",
    origPrice: 320000,
    price: 265000,
    kolDiscountPrice: 238500,
    image: "/reference/assets/toner-bha-product.jpg",
    kol: {
      name: "Phạm Khánh Linh",
      handle: "@linhskincare",
      coupon: "LINHSKIN",
      tier: "KOL Bạc"
    }
  },
  {
    id: "P08",
    name: "Bàn Phím Cơ Không Dây Bluetooth RGB ZenHome Pro Switch Hot-Swap",
    brand: "TechSmart Store",
    category: "tech",
    categoryLabel: "Công nghệ & Tiện ích",
    rating: 4.8,
    reviews: 89,
    sold: "1.1k",
    origPrice: 990000,
    price: 890000,
    kolDiscountPrice: 801000,
    image: "/reference/assets/creator-shop-collab-hero.jpg",
    kol: {
      name: "Tuấn Review",
      handle: "@tuanreview",
      coupon: "TUANREVIEW",
      tier: "KOL Bạc"
    },
    badge: "Công nghệ Hot"
  }
];

export const marketplaceKOLs: Creator[] = [
  {
    id: "nhat",
    name: "Trần Văn Nhật",
    handle: "@nhatbeauty",
    channel: "TikTok (185K followers)",
    platform: "TikTok",
    platformIcon: "ph-tiktok-logo",
    followers: "185K followers",
    avatar: "N",
    avatarImg: "/reference/assets/kol-avatar-nhat.jpg",
    coupon: "NHATXINH10",
    tier: "KOL Vàng",
    rating: "4.9",
    tag: "Chuyên gia Skincare",
    niche: "Chăm sóc da khoa học & Mờ thâm",
    sales: "1.4k+ đơn",
    bg: "var(--brand-soft)",
    color: "var(--brand-strong)",
    bio: "Chuyên gia review chu trình skincare khoa học, mờ thâm mụn và phục hồi hàng rào da nhạy cảm.",
    voucherInfo: {
      code: "NHATXINH10",
      discount: "10%",
      discountPct: 10,
      maxDiscount: "50.000 ₫",
      minOrder: "250.000 ₫",
      appliesTo: "Mỹ phẩm chăm sóc da Sora Skin",
      expiry: "31/12/2026"
    }
  },
  {
    id: "maianh",
    name: "Lê Mai Anh",
    handle: "@maianh.beauty",
    channel: "TikTok (140K followers)",
    platform: "TikTok",
    platformIcon: "ph-tiktok-logo",
    followers: "140K followers",
    avatar: "M",
    avatarImg: "/reference/assets/kol-avatar-maianh.jpg",
    coupon: "MAIANH12",
    tier: "KOL Vàng",
    rating: "5.0",
    tag: "Chống Nắng & Căng Bóng",
    niche: "Bí quyết chống nắng & Chăm da chuẩn Hàn",
    sales: "2.1k+ đơn",
    bg: "#f3e8ff",
    color: "#7e22ce",
    bio: "Bí quyết chống nắng quang phổ rộng và dưỡng da ẩm mượt căng bóng chuẩn phong cách Hàn Quốc.",
    voucherInfo: {
      code: "MAIANH12",
      discount: "12%",
      discountPct: 12,
      maxDiscount: "60.000 ₫",
      minOrder: "300.000 ₫",
      appliesTo: "Các dòng chống nắng & toner Sora Skin",
      expiry: "31/12/2026"
    }
  },
  {
    id: "linh",
    name: "Phạm Khánh Linh",
    handle: "@linhskincare",
    channel: "Instagram (45K followers)",
    platform: "Instagram",
    platformIcon: "ph-instagram-logo",
    followers: "45K followers",
    avatar: "L",
    avatarImg: "/reference/assets/kol-avatar-linh.jpg",
    coupon: "LINHSKIN",
    tier: "KOL Bạc",
    rating: "4.8",
    tag: "Review Da Nhạy Cảm",
    niche: "Dược mỹ phẩm & Da nhạy cảm dị ứng",
    sales: "820+ đơn",
    bg: "#fee2e2",
    color: "#991b1b",
    bio: "Review trung thực các dòng mỹ phẩm an toàn, thành phần lành tính cho da nhạy cảm và mẹ bầu.",
    voucherInfo: {
      code: "LINHSKIN",
      discount: "10%",
      discountPct: 10,
      maxDiscount: "40.000 ₫",
      minOrder: "200.000 ₫",
      appliesTo: "Sản phẩm làm sạch dịu nhẹ & đồ cá nhân",
      expiry: "31/12/2026"
    }
  },
  {
    id: "tuan",
    name: "Nguyễn Đình Tuấn",
    handle: "@tuanreview",
    channel: "YouTube (80K subs)",
    platform: "YouTube",
    platformIcon: "ph-youtube-logo",
    followers: "80K subs",
    avatar: "T",
    avatarImg: "/reference/assets/kol-avatar-tuan.jpg",
    coupon: "TUANREVIEW",
    tier: "KOL Bạc",
    rating: "4.9",
    tag: "Gia Dụng & Công Nghệ",
    niche: "Trải nghiệm thiết bị gia dụng & Đồ công nghệ",
    sales: "1.1k+ đơn",
    bg: "#ffedd5",
    color: "#9a3412",
    bio: "Trải nghiệm thực tế thiết bị gia dụng thông minh và phụ kiện công nghệ tiện ích nâng tầm cuộc sống.",
    voucherInfo: {
      code: "TUANREVIEW",
      discount: "10%",
      discountPct: 10,
      maxDiscount: "150.000 ₫",
      minOrder: "500.000 ₫",
      appliesTo: "Thiết bị ZenHome & phụ kiện công nghệ",
      expiry: "31/12/2026"
    }
  }
];

export const marketplaceVideos: ReviewVideo[] = [
  {
    id: "vid-01",
    title: "Routine sáng 3 bước với Serum C15 mờ thâm sau 2 tuần rõ rệt!",
    kol: "Trần Văn Nhật",
    handle: "@nhatbeauty",
    views: "185.4K",
    duration: "00:45",
    productId: "P01",
    coupon: "NHATXINH10",
    thumbnail: "/reference/assets/serum-hero-optimized.jpg"
  },
  {
    id: "vid-02",
    title: "Test độ kiềm dầu & chống trôi 8 tiếng của Kem chống nắng Aqua SPF50+",
    kol: "Lê Mai Anh",
    handle: "@maianh.beauty",
    views: "142.1K",
    duration: "00:58",
    productId: "P02",
    coupon: "MAIANH12",
    thumbnail: "/reference/assets/sunscreen-product.jpg"
  },
  {
    id: "vid-03",
    title: "Cấp cứu da ửng đỏ sau khi đi nắng về cùng Mặt nạ Cica Soothing Mask",
    kol: "Trần Văn Nhật",
    handle: "@nhatbeauty",
    views: "98.7K",
    duration: "00:32",
    productId: "P04",
    coupon: "NHATXINH10",
    thumbnail: "/reference/assets/cica-mask-product.jpg"
  },
  {
    id: "vid-04",
    title: "Đập hộp & nướng gà nguyên con bằng Nồi chiên không dầu ZenHome 6.5L",
    kol: "Tuấn Review",
    handle: "@tuanreview",
    views: "116.3K",
    duration: "01:15",
    productId: "P06",
    coupon: "TUANREVIEW",
    thumbnail: "/reference/assets/shop-ctv-collab-hero.jpg"
  }
];


