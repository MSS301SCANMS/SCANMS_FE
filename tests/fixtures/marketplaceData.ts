import type { Product, Creator, ReviewVideo } from '../../src/types/marketplace.types';






export const marketplaceProducts: Product[] = [
  {
    id: "P01",
    name: "Serum Vitamin C 15% DÆ°á»¡ng SĂ¡ng Má» ThĂ¢m Sora Skin",
    brand: "Sora Skin Official",
    category: "skincare",
    categoryLabel: "ChÄƒm sĂ³c da & Serum",
    rating: 4.9,
    reviews: 142,
    sold: "1.4k",
    origPrice: 520000,
    price: 459000,
    kolDiscountPrice: 413100,
    image: "/assets/products/real/vitamin-c-15-serum.jpg",
    kol: {
      name: "Tráº§n VÄƒn Nháº­t",
      handle: "@nhatbeauty",
      coupon: "NHATXINH10",
      tier: "KOL VĂ ng"
    },
    badge: "BĂ¡n cháº¡y nháº¥t"
  },
  {
    id: "P02",
    name: "Kem Chá»‘ng Náº¯ng Phá»¥c Há»“i Quang Phá»• Rá»™ng Aqua Sunscreen SPF50+ PA++++",
    brand: "Sora Skin Official",
    category: "skincare",
    categoryLabel: "ChÄƒm sĂ³c da & Chá»‘ng náº¯ng",
    rating: 4.8,
    reviews: 98,
    sold: "2.1k",
    origPrice: 430000,
    price: 389000,
    kolDiscountPrice: 350100,
    image: "/assets/products/real/spf50-oil-control.jpg",
    kol: {
      name: "LĂª Mai Anh",
      handle: "@maianh.beauty",
      coupon: "MAIANH12",
      tier: "KOL VĂ ng"
    },
    badge: "Top 1 Chá»‘ng náº¯ng"
  },
  {
    id: "P03",
    name: "Toner BHA 2% LĂ m Sáº¡ch SĂ¢u & Kiá»m Dáº§u Thu Nhá» Lá»— ChĂ¢n LĂ´ng",
    brand: "Sora Skin Official",
    category: "skincare",
    categoryLabel: "ChÄƒm sĂ³c da & Toner",
    rating: 4.7,
    reviews: 86,
    sold: "820",
    origPrice: 390000,
    price: 349000,
    kolDiscountPrice: 314100,
    image: "/assets/products/real/bha-toner-2pct.png",
    kol: {
      name: "LĂª Mai Anh",
      handle: "@maianh.beauty",
      coupon: "MAIANH12",
      tier: "KOL VĂ ng"
    }
  },
  {
    id: "P04",
    name: "Máº·t Náº¡ Phá»¥c Há»“i Cica Soothing Mask (Há»™p 5 miáº¿ng lĂ m dá»‹u da cáº¥p tá»‘c)",
    brand: "Sora Skin Official",
    category: "skincare",
    categoryLabel: "ChÄƒm sĂ³c da & Máº·t náº¡",
    rating: 5.0,
    reviews: 114,
    sold: "980",
    origPrice: 220000,
    price: 189000,
    kolDiscountPrice: 170100,
    image: "/assets/products/real/centella-sheet-mask.jpg",
    kol: {
      name: "Tráº§n VÄƒn Nháº­t",
      handle: "@nhatbeauty",
      coupon: "NHATXINH10",
      tier: "KOL VĂ ng"
    }
  },
  {
    id: "P05",
    name: "Gel Rá»­a Máº·t Dá»‹u Nháº¹ TrĂ m TrĂ  Gentle Foam Cleanser Phá»¥c Há»“i HĂ ng RĂ o Da",
    brand: "Sora Skin Official",
    category: "skincare",
    categoryLabel: "ChÄƒm sĂ³c da & Rá»­a máº·t",
    rating: 4.9,
    reviews: 215,
    sold: "3.2k",
    origPrice: 310000,
    price: 279000,
    kolDiscountPrice: 251100,
    image: "/assets/products/real/amino-cleanser-ph55.jpg",
    kol: {
      name: "Pháº¡m KhĂ¡nh Linh",
      handle: "@linhskincare",
      coupon: "LINHSKIN",
      tier: "KOL Báº¡c"
    },
    badge: "Da dáº§u má»¥n"
  },
  {
    id: "P06",
    name: "Ná»“i ChiĂªn KhĂ´ng Dáº§u Äiá»‡n Tá»­ ZenHome Smart AirFryer 6.5L Cáº£m á»¨ng",
    brand: "ZenHome Official",
    category: "home",
    categoryLabel: "Gia dá»¥ng & Äá»i sá»‘ng",
    rating: 4.9,
    reviews: 74,
    sold: "640",
    origPrice: 1450000,
    price: 1250000,
    kolDiscountPrice: 1125000,
    image: "/assets/products/real/air-fryer-65l.jpg",
    kol: {
      name: "Tuáº¥n Review",
      handle: "@tuanreview",
      coupon: "TUANREVIEW",
      tier: "KOL Báº¡c"
    },
    badge: "Gia dá»¥ng thĂ´ng minh"
  },
  {
    id: "P07",
    name: "BĂ¬nh Giá»¯ Nhiá»‡t Inox 316 Kháº¯c TĂªn ZenHome Smart 800ml KĂ¨m Lá»c TrĂ ",
    brand: "ZenHome Official",
    category: "home",
    categoryLabel: "Gia dá»¥ng & Äá»i sá»‘ng",
    rating: 4.9,
    reviews: 160,
    sold: "1.8k",
    origPrice: 320000,
    price: 265000,
    kolDiscountPrice: 238500,
    image: "/assets/products/real/thermos-500ml.jpg",
    kol: {
      name: "Pháº¡m KhĂ¡nh Linh",
      handle: "@linhskincare",
      coupon: "LINHSKIN",
      tier: "KOL Báº¡c"
    }
  },
  {
    id: "P08",
    name: "BĂ n PhĂ­m CÆ¡ KhĂ´ng DĂ¢y Bluetooth RGB ZenHome Pro Switch Hot-Swap",
    brand: "TechSmart Store",
    category: "tech",
    categoryLabel: "CĂ´ng nghá»‡ & Tiá»‡n Ă­ch",
    rating: 4.8,
    reviews: 89,
    sold: "1.1k",
    origPrice: 990000,
    price: 890000,
    kolDiscountPrice: 801000,
    image: "/assets/products/real/keyboard-tri-mode.webp",
    kol: {
      name: "Tuáº¥n Review",
      handle: "@tuanreview",
      coupon: "TUANREVIEW",
      tier: "KOL Báº¡c"
    },
    badge: "CĂ´ng nghá»‡ Hot"
  }
];

export const marketplaceKOLs: Creator[] = [
  {
    id: "nhat",
    name: "Tráº§n VÄƒn Nháº­t",
    handle: "@nhatbeauty",
    channel: "TikTok (185K followers)",
    platform: "TikTok",
    platformIcon: "ph-tiktok-logo",
    followers: "185K followers",
    avatar: "N",
    avatarImg: "/reference/assets/kol-avatar-nhat.jpg",
    coupon: "NHATXINH10",
    tier: "KOL VĂ ng",
    rating: "4.9",
    tag: "ChuyĂªn gia Skincare",
    niche: "ChÄƒm sĂ³c da khoa há»c & Má» thĂ¢m",
    sales: "1.4k+ Ä‘Æ¡n",
    bg: "var(--brand-soft)",
    color: "var(--brand-strong)",
    bio: "ChuyĂªn gia review chu trĂ¬nh skincare khoa há»c, má» thĂ¢m má»¥n vĂ  phá»¥c há»“i hĂ ng rĂ o da nháº¡y cáº£m.",
    voucherInfo: {
      code: "NHATXINH10",
      discount: "10%",
      discountPct: 10,
      maxDiscount: "50.000 â‚«",
      minOrder: "250.000 â‚«",
      appliesTo: "Má»¹ pháº©m chÄƒm sĂ³c da Sora Skin",
      expiry: "31/12/2026"
    }
  },
  {
    id: "maianh",
    name: "LĂª Mai Anh",
    handle: "@maianh.beauty",
    channel: "TikTok (140K followers)",
    platform: "TikTok",
    platformIcon: "ph-tiktok-logo",
    followers: "140K followers",
    avatar: "M",
    avatarImg: "/reference/assets/kol-avatar-maianh.jpg",
    coupon: "MAIANH12",
    tier: "KOL VĂ ng",
    rating: "5.0",
    tag: "Chá»‘ng Náº¯ng & CÄƒng BĂ³ng",
    niche: "BĂ­ quyáº¿t chá»‘ng náº¯ng & ChÄƒm da chuáº©n HĂ n",
    sales: "2.1k+ Ä‘Æ¡n",
    bg: "#f3e8ff",
    color: "#7e22ce",
    bio: "BĂ­ quyáº¿t chá»‘ng náº¯ng quang phá»• rá»™ng vĂ  dÆ°á»¡ng da áº©m mÆ°á»£t cÄƒng bĂ³ng chuáº©n phong cĂ¡ch HĂ n Quá»‘c.",
    voucherInfo: {
      code: "MAIANH12",
      discount: "12%",
      discountPct: 12,
      maxDiscount: "60.000 â‚«",
      minOrder: "300.000 â‚«",
      appliesTo: "CĂ¡c dĂ²ng chá»‘ng náº¯ng & toner Sora Skin",
      expiry: "31/12/2026"
    }
  },
  {
    id: "linh",
    name: "Pháº¡m KhĂ¡nh Linh",
    handle: "@linhskincare",
    channel: "Instagram (45K followers)",
    platform: "Instagram",
    platformIcon: "ph-instagram-logo",
    followers: "45K followers",
    avatar: "L",
    avatarImg: "/reference/assets/kol-avatar-linh.jpg",
    coupon: "LINHSKIN",
    tier: "KOL Báº¡c",
    rating: "4.8",
    tag: "Review Da Nháº¡y Cáº£m",
    niche: "DÆ°á»£c má»¹ pháº©m & Da nháº¡y cáº£m dá»‹ á»©ng",
    sales: "820+ Ä‘Æ¡n",
    bg: "#fee2e2",
    color: "#991b1b",
    bio: "Review trung thá»±c cĂ¡c dĂ²ng má»¹ pháº©m an toĂ n, thĂ nh pháº§n lĂ nh tĂ­nh cho da nháº¡y cáº£m vĂ  máº¹ báº§u.",
    voucherInfo: {
      code: "LINHSKIN",
      discount: "10%",
      discountPct: 10,
      maxDiscount: "40.000 â‚«",
      minOrder: "200.000 â‚«",
      appliesTo: "Sáº£n pháº©m lĂ m sáº¡ch dá»‹u nháº¹ & Ä‘á»“ cĂ¡ nhĂ¢n",
      expiry: "31/12/2026"
    }
  },
  {
    id: "tuan",
    name: "Nguyá»…n ÄĂ¬nh Tuáº¥n",
    handle: "@tuanreview",
    channel: "YouTube (80K subs)",
    platform: "YouTube",
    platformIcon: "ph-youtube-logo",
    followers: "80K subs",
    avatar: "T",
    avatarImg: "/reference/assets/kol-avatar-tuan.jpg",
    coupon: "TUANREVIEW",
    tier: "KOL Báº¡c",
    rating: "4.9",
    tag: "Gia Dá»¥ng & CĂ´ng Nghá»‡",
    niche: "Tráº£i nghiá»‡m thiáº¿t bá»‹ gia dá»¥ng & Äá»“ cĂ´ng nghá»‡",
    sales: "1.1k+ Ä‘Æ¡n",
    bg: "#ffedd5",
    color: "#9a3412",
    bio: "Tráº£i nghiá»‡m thá»±c táº¿ thiáº¿t bá»‹ gia dá»¥ng thĂ´ng minh vĂ  phá»¥ kiá»‡n cĂ´ng nghá»‡ tiá»‡n Ă­ch nĂ¢ng táº§m cuá»™c sá»‘ng.",
    voucherInfo: {
      code: "TUANREVIEW",
      discount: "10%",
      discountPct: 10,
      maxDiscount: "150.000 â‚«",
      minOrder: "500.000 â‚«",
      appliesTo: "Thiáº¿t bá»‹ ZenHome & phá»¥ kiá»‡n cĂ´ng nghá»‡",
      expiry: "31/12/2026"
    }
  }
];

export const marketplaceVideos: ReviewVideo[] = [
  {
    id: "vid-01",
    title: "Routine sĂ¡ng 3 bÆ°á»›c vá»›i Serum C15 má» thĂ¢m sau 2 tuáº§n rĂµ rá»‡t!",
    kol: "Tráº§n VÄƒn Nháº­t",
    handle: "@nhatbeauty",
    views: "185.4K",
    duration: "00:45",
    productId: "P01",
    coupon: "NHATXINH10",
    thumbnail: "/assets/products/real/vitamin-c-15-serum.jpg"
  },
  {
    id: "vid-02",
    title: "Test Ä‘á»™ kiá»m dáº§u & chá»‘ng trĂ´i 8 tiáº¿ng cá»§a Kem chá»‘ng náº¯ng Aqua SPF50+",
    kol: "LĂª Mai Anh",
    handle: "@maianh.beauty",
    views: "142.1K",
    duration: "00:58",
    productId: "P02",
    coupon: "MAIANH12",
    thumbnail: "/assets/products/real/spf50-oil-control.jpg"
  },
  {
    id: "vid-03",
    title: "Cáº¥p cá»©u da á»­ng Ä‘á» sau khi Ä‘i náº¯ng vá» cĂ¹ng Máº·t náº¡ Cica Soothing Mask",
    kol: "Tráº§n VÄƒn Nháº­t",
    handle: "@nhatbeauty",
    views: "98.7K",
    duration: "00:32",
    productId: "P04",
    coupon: "NHATXINH10",
    thumbnail: "/assets/products/real/centella-sheet-mask.jpg"
  },
  {
    id: "vid-04",
    title: "Äáº­p há»™p & nÆ°á»›ng gĂ  nguyĂªn con báº±ng Ná»“i chiĂªn khĂ´ng dáº§u ZenHome 6.5L",
    kol: "Tuáº¥n Review",
    handle: "@tuanreview",
    views: "116.3K",
    duration: "01:15",
    productId: "P06",
    coupon: "TUANREVIEW",
    thumbnail: "/assets/products/real/air-fryer-65l.jpg"
  }
];


