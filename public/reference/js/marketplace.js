// ==========================================================================
// SCANMS MARKETPLACE - Sàn Mua Sắm & Tiếp Thị Liên Kết Công Khai (FR-15, FR-16, FR-17, FR-29)
// Truy cập không cần đăng nhập • Toàn bộ danh mục sản phẩm • Tra cứu đơn • Xem review KOL
// ==========================================================================

export const marketplaceProducts = [
  {
    id: "P01",
    backendSku: "SR-VTC-15",
    name: "Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Sora Skin",
    brand: "Sora Skin Official",
    category: "skincare",
    categoryLabel: "Chăm sóc da & Serum",
    rating: 4.9,
    reviews: 142,
    sold: "1.4k",
    origPrice: 520000,
    price: 459000,
    kolDiscountPrice: 413100, // -10%
    image: "./assets/serum-hero-optimized.jpg",
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
    image: "./assets/sunscreen-product.jpg",
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
    image: "./assets/toner-bha-product.jpg",
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
    image: "./assets/cica-mask-product.jpg",
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
    image: "./assets/cleanser-product.jpg",
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
    image: "./assets/shop-ctv-collab-hero.jpg",
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
    image: "./assets/toner-bha-product.jpg",
    kol: {
      name: "Phạm Khánh Linh",
      handle: "@linhskincare",
      coupon: "LINHSKIN",
      tier: "KOL Bạc"
    }
  },
  {
    id: "P08",
    backendSku: "TECH-KB-002",
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
    image: "./assets/creator-shop-collab-hero.jpg",
    kol: {
      name: "Tuấn Review",
      handle: "@tuanreview",
      coupon: "TUANREVIEW",
      tier: "KOL Bạc"
    },
    badge: "Công nghệ Hot"
  }
];

export const marketplaceKOLs = [
  {
    id: "nhat",
    name: "Trần Văn Nhật",
    handle: "@nhatbeauty",
    channel: "TikTok (185K followers)",
    platform: "TikTok",
    platformIcon: "ph-tiktok-logo",
    followers: "185K followers",
    avatar: "N",
    avatarImg: "./assets/kol-avatar-nhat.jpg",
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
    avatarImg: "./assets/kol-avatar-maianh.jpg",
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
    avatarImg: "./assets/kol-avatar-linh.jpg",
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
    avatarImg: "./assets/kol-avatar-tuan.jpg",
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

export const marketplaceVideos = [
  {
    id: "vid-01",
    title: "Routine sáng 3 bước với Serum C15 mờ thâm sau 2 tuần rõ rệt!",
    kol: "Trần Văn Nhật",
    handle: "@nhatbeauty",
    views: "185.4K",
    duration: "00:45",
    productId: "P01",
    coupon: "NHATXINH10",
    thumbnail: "./assets/serum-hero-optimized.jpg"
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
    thumbnail: "./assets/sunscreen-product.jpg"
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
    thumbnail: "./assets/cica-mask-product.jpg"
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
    thumbnail: "./assets/shop-ctv-collab-hero.jpg"
  }
];

let state = {
  searchQuery: "",
  selectedCategory: "all",
  selectedCreatorId: "nhat",
  activeCoupon: "NHATXINH10",
  activeKol: "Trần Văn Nhật",
  creatorFilterId: null, // chỉ lọc sản phẩm khi người dùng chọn lọc
  cartCount: 0,
  isChatOpen: false,
  trackingPhone: "",
  trackingOrders: [],
  activeProfileCreator: null
};

// Khởi tạo đơn hàng mẫu cho tra cứu SĐT
function getDemoOrders() {
  const saved = localStorage.getItem("scanms-guest-orders");
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  const defaults = [
    {
      code: "IN23944",
      phone: "0903218456",
      name: "Nguyễn Hải Yến",
      product: "Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Sora Skin",
      amount: 413100,
      coupon: "NHATXINH10",
      kol: "Trần Văn Nhật",
      status: "Đang giao hàng",
      statusStep: 3,
      date: "08/09/2026",
      carrier: "Giao Hàng Nhanh (GHN)",
      trackingNum: "GHN88421092VN",
      escrowDaysLeft: 12
    },
    {
      code: "IN23931",
      phone: "0912345678",
      name: "Lê Hoàng Nam",
      product: "Kem Chống Nắng Phục Hồi Aqua Sunscreen SPF50+",
      amount: 350100,
      coupon: "MAIANH12",
      kol: "Lê Mai Anh",
      status: "Đã giao thành công",
      statusStep: 4,
      date: "01/09/2026",
      carrier: "Giao Hàng Tiết Kiệm (GHTK)",
      trackingNum: "GHTK77120938VN",
      escrowDaysLeft: 8
    }
  ];
  localStorage.setItem("scanms-guest-orders", JSON.stringify(defaults));
  return defaults;
}

function money(v) {
  return `${new Intl.NumberFormat("vi-VN").format(v)} ₫`;
}

function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function resolveBackendProduct(product) {
  const response = await fetch("/api/public/products?limit=100", {
    credentials: "include",
    headers: { Accept: "application/json" }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message || "Không thể tải sản phẩm từ hệ thống.");
  const items = body?.data?.items || body?.items || [];
  return items.find(item => item.sku === product.backendSku) || null;
}

function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() || `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function maskPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.replace(/^(\d{3})\d+(\d{3})$/, "$1****$2");
}

export function marketplaceScreen() {
  const q = state.searchQuery.trim().toLowerCase();
  const cat = state.selectedCategory;
  const filterCreator = state.creatorFilterId ? marketplaceKOLs.find(k => k.id === state.creatorFilterId) : null;
  const activeCreator = marketplaceKOLs.find(k => k.id === state.selectedCreatorId) || marketplaceKOLs[0];
  const featuredProduct = marketplaceProducts.find(p => p.kol?.name === activeCreator.name) || marketplaceProducts[0];
  const featuredVideo = marketplaceVideos.find(v => v.productId === featuredProduct.id || v.kol === activeCreator.name) || marketplaceVideos[0];

  const filteredProducts = marketplaceProducts.filter(p => {
    const matchCat = cat === "all" || p.category === cat;
    if (!matchCat) return false;
    if (filterCreator && p.kol?.name !== filterCreator.name) return false;
    if (!q) return true;
    const matchName = p.name.toLowerCase().includes(q);
    const matchBrand = p.brand.toLowerCase().includes(q);
    const matchKol = p.kol && (p.kol.name.toLowerCase().includes(q) || p.kol.handle.toLowerCase().includes(q) || p.kol.coupon.toLowerCase().includes(q));
    return matchName || matchBrand || matchKol;
  });

  return `
    <div class="storefront-wrapper mp-page-wrapper">
      <!-- 2. MAIN HEADER BAR (ĐỒNG BỘ 1400PX, STICKY TOÀN BỘ) -->
      <header class="mp-header">
        <div class="mp-header-main">
          <!-- Logo Brand -->
          <a href="#marketplace" class="mp-brand" title="Trang chủ sàn SCANMS">
            <div class="mp-brand-mark">S</div>
            <div class="mp-brand-text">
              <span class="mp-brand-title">SCANMS</span>
              <span class="mp-brand-subtitle">Sàn Mua Sắm & Tiếp Thị Liên Kết</span>
            </div>
          </a>

          <!-- Smart Search Bar: Placeholder rút gọn & Gợi ý chia nhóm -->
          <div class="mp-search-container">
            <div class="mp-search-box">
              <i class="ph ph-magnifying-glass search-icon"></i>
              <input
                type="text"
                id="mp-search-input"
                class="mp-search-input"
                placeholder="Tìm sản phẩm, thương hiệu, Creator"
                value="${escapeHtml(state.searchQuery)}"
                autocomplete="off"
              />
              ${state.searchQuery ? `<button type="button" class="text-btn" id="mp-clear-search-btn" style="padding:0 8px;font-size:16px;color:var(--muted)" title="Xóa tìm kiếm"><i class="ph ph-x"></i></button>` : ''}
              <button type="button" class="mp-search-btn" id="mp-search-btn">
                <span>Tìm kiếm</span>
              </button>
            </div>
            <div class="mp-search-suggestions-dropdown" id="mp-search-suggestions"></div>
          </div>

          <!-- Header Actions (Tra cứu đơn duy nhất, Giỏ hàng, Đăng nhập phụ) -->
          <div class="mp-header-actions">
            <button class="mp-action-btn" data-action="scroll-tracking" title="Tra cứu trạng thái đơn hàng qua SĐT">
              <i class="ph ph-package"></i>
              <span>Tra cứu đơn</span>
            </button>

            <button class="mp-action-btn" id="mp-cart-btn" title="Giỏ hàng của bạn">
              <i class="ph ph-shopping-cart-simple"></i>
              <span>Giỏ hàng</span>
              <span class="mp-badge-count" id="mp-cart-count">${state.cartCount}</span>
            </button>

            <!-- Role Login Entrance (Hành động phụ) -->
            <div class="mp-login-dropdown-wrap">
              <button class="mp-login-btn secondary-style" id="mp-login-toggle-btn" title="Cổng đăng nhập theo vai trò">
                <i class="ph ph-user-circle"></i>
                <span>Tài khoản</span>
                <i class="ph ph-caret-down" style="font-size:11px;margin-left:2px"></i>
              </button>

              <div class="mp-login-dropdown" id="mp-login-dropdown">
                <div class="mp-login-dropdown-head">
                  <h4>Cổng đăng nhập đối tác</h4>
                  <p>Truy cập bảng điều khiển chuyên biệt theo vai trò</p>
                </div>

                <div class="mp-role-list">
                  <button class="mp-role-item" data-goto-role="kol">
                    <div class="mp-role-icon" style="background:var(--brand-soft);color:var(--brand-strong)">
                      <i class="ph ph-chart-line-up"></i>
                    </div>
                    <div class="mp-role-info">
                      <span class="mp-role-name">Cộng Tác Viên / KOL</span>
                      <span class="mp-role-desc">Tạo link tiếp thị & rút hoa hồng</span>
                    </div>
                  </button>

                  <button class="mp-role-item" data-goto-role="shop">
                    <div class="mp-role-icon" style="background:#F5E7CC;color:#7A561B">
                      <i class="ph ph-storefront"></i>
                    </div>
                    <div class="mp-role-info">
                      <span class="mp-role-name">Chủ Gian Hàng (Shop)</span>
                      <span class="mp-role-desc">Quản lý sản phẩm & đối soát</span>
                    </div>
                  </button>

                  <button class="mp-role-item" data-goto-role="customer">
                    <div class="mp-role-icon" style="background:#fef3c7;color:#b45309">
                      <i class="ph ph-user-circle"></i>
                    </div>
                    <div class="mp-role-info">
                      <span class="mp-role-name">Khách Hàng Thành Viên</span>
                      <span class="mp-role-desc">Sổ địa chỉ & lịch sử tích lũy</span>
                    </div>
                  </button>

                  <button class="mp-role-item" data-goto-role="manager">
                    <div class="mp-role-icon" style="background:#e0e7ff;color:#4338ca">
                      <i class="ph ph-gauge"></i>
                    </div>
                    <div class="mp-role-info">
                      <span class="mp-role-name">Vận Hành Nền Tảng</span>
                      <span class="mp-role-desc">Kiểm duyệt shop & đối soát thuế</span>
                    </div>
                  </button>

                  <button class="mp-role-item" data-goto-role="admin">
                    <div class="mp-role-icon" style="background:#1e1b4b;color:#a5b4fc">
                      <i class="ph ph-shield-checkered"></i>
                    </div>
                    <div class="mp-role-info">
                      <span class="mp-role-name">Quản Trị Hệ Thống</span>
                      <span class="mp-role-desc">RBAC, an ninh & cấu hình sàn</span>
                    </div>
                  </button>
                </div>

                <div class="mp-login-dropdown-footer">
                  <button class="btn secondary" data-goto-auth="login">Trang Đăng Nhập</button>
                  <button class="btn" data-goto-auth="register">Đăng Ký Mới</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Secondary Categories Strip: Danh mục sản phẩm cải tiến trạng thái chọn -->
        <div class="mp-cat-strip">
          <div class="mp-cat-inner">
            <button class="mp-cat-pill ${cat === 'all' ? 'active' : ''}" data-cat="all">
              <i class="ph ph-squares-four"></i> Tất cả sản phẩm (${marketplaceProducts.length})
            </button>
            <button class="mp-cat-pill ${cat === 'skincare' ? 'active' : ''}" data-cat="skincare">
              <i class="ph ph-sparkle"></i> Chăm sóc da & Mỹ phẩm
            </button>
            <button class="mp-cat-pill ${cat === 'home' ? 'active' : ''}" data-cat="home">
              <i class="ph ph-house-line"></i> Gia dụng & Đời sống
            </button>
            <button class="mp-cat-pill ${cat === 'tech' ? 'active' : ''}" data-cat="tech">
              <i class="ph ph-cpu"></i> Công nghệ & Phụ kiện
            </button>
          </div>
        </div>
      </header>

      <!-- 3. HERO BANNER: 48% NỘI DUNG / 52% SẢN PHẨM SPOTLIGHT, GAP 32PX, PADDING 40PX, BO 24PX -->
      <section class="mp-hero-section">
        <div class="mp-hero-banner">
          <!-- Cột Trái 48%: Tiêu đề, mô tả, CTA chính & 3-card Value Strip tinh tế -->
          <div class="mp-hero-content">
            <div class="mp-hero-kicker">
              <span class="mp-kicker-dot"></span>
              <span class="mp-kicker-text">SCANMS MARKETPLACE · MUA SẮM CÙNG CREATOR</span>
            </div>

            <h1 class="mp-hero-title">
              Chọn món bạn thích.<br/>
              <span class="mp-gold-highlight">Ưu đãi từ Creator.</span>
            </h1>
            <p class="mp-hero-desc">
              Khám phá sản phẩm qua review chân thực và áp dụng mã ưu đãi từ Creator yêu thích để nhận mức giá tốt nhất cùng bảo hộ đổi trả 14 ngày.
            </p>

            <div class="mp-hero-cta-group">
              <button type="button" class="mp-hero-btn-primary" data-action="scroll-to-catalog">
                <i class="ph-bold ph-shopping-bag"></i>
                <span>Khám phá sản phẩm</span>
                <i class="ph-bold ph-arrow-right mp-btn-arrow"></i>
              </button>
              <button type="button" class="mp-hero-btn-secondary" data-action="open-guide-modal">
                <i class="ph ph-shield-check"></i>
                <span>Chính sách mua an tâm</span>
              </button>
            </div>

            <!-- Dải 3 Thẻ Giá Trị (Thay thế avatar stack & dòng chữ chấm nghiệp dư) -->
            <div class="mp-hero-value-strip">
              <div class="mp-value-card">
                <div class="mp-value-icon">
                  <i class="ph-fill ph-seal-check"></i>
                </div>
                <div class="mp-value-text">
                  <strong class="mp-value-title">100% Chính hãng</strong>
                  <span class="mp-value-sub">Kiểm định nguồn gốc rõ ràng</span>
                </div>
              </div>

              <div class="mp-value-card">
                <div class="mp-value-icon">
                  <i class="ph-fill ph-shield-check"></i>
                </div>
                <div class="mp-value-text">
                  <strong class="mp-value-title">Bảo hộ 14 ngày</strong>
                  <span class="mp-value-sub">Đổi trả &amp; kiểm tra khi nhận</span>
                </div>
              </div>

              <div class="mp-value-card">
                <div class="mp-value-icon">
                  <i class="ph-fill ph-ticket"></i>
                </div>
                <div class="mp-value-text">
                  <strong class="mp-value-title">Ưu đãi Creator</strong>
                  <span class="mp-value-sub">Trừ tiền trực tiếp vào đơn</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Cột Phải 52%: VOUCHER CHÀO MỪNG TOÀN SÀN (ƯU ĐÃI CHUNG CHO KHÁCH MỚI) -->
          <div class="mp-hero-spotlight-card mp-voucher-hero mp-platform-voucher-card">
            <!-- 1. Header: Biểu tượng voucher sàn + Tiêu đề & Trạng thái hoạt động -->
            <div class="mp-voucher-hero-heading">
              <div class="mp-voucher-heading-left">
                <span class="mp-voucher-emblem platform-emblem"><i class="ph-fill ph-sparkle" aria-hidden="true"></i></span>
                <div>
                  <span class="mp-voucher-caption">ĐẶC QUYỀN KHÁCH HÀNG MỚI</span>
                  <strong class="mp-voucher-heading-title">Voucher Chào Mừng SCANMS</strong>
                </div>
              </div>
              <span class="mp-voucher-status-tag platform-status">
                <span class="mp-pulse-dot"></span> Toàn sàn áp dụng
              </span>
            </div>

            <!-- 2. Thẻ giải thích quyền lợi sàn -->
            <div class="mp-platform-voucher-intro">
              <div class="mp-platform-badge-row">
                <span class="mp-platform-pill"><i class="ph-fill ph-check-circle"></i> Đơn đầu tiên</span>
                <span class="mp-platform-pill"><i class="ph-fill ph-shield-check"></i> Không cần tài khoản</span>
                <span class="mp-platform-pill"><i class="ph-fill ph-lightning"></i> Trừ trực tiếp</span>
              </div>
              <p class="mp-platform-desc">Ưu đãi giảm giá độc quyền áp dụng cho mọi sản phẩm chính hãng trên toàn sàn SCANMS. Mua sắm an toàn, đồng kiểm COD khi nhận.</p>
            </div>

            <!-- 3. Highlight Giảm giá toàn sàn: 15% -->
            <div class="mp-voucher-hero-discount platform-discount">
              <div class="mp-discount-left">
                <span class="mp-discount-prefix">ƯU ĐÃI TOÀN SÀN</span>
                <strong class="mp-discount-val">15%</strong>
              </div>
              <div class="mp-discount-right">
                <div class="mp-discount-max-tag">Giảm tối đa <strong>75.000 ₫</strong></div>
                <div class="mp-discount-min">Đơn từ <strong>200.000 ₫</strong> · Áp dụng mọi danh mục</div>
              </div>
            </div>

            <!-- 4. Khung Mã Voucher Toàn Sàn kèm nút Sao chép -->
            <div class="mp-voucher-code-group platform-code-box">
              <div class="mp-voucher-code-left">
                <i class="ph-fill ph-tag mp-ticket-icon" aria-hidden="true"></i>
                <code class="mp-voucher-code">SCANMSNEW</code>
              </div>
              <button type="button" class="mp-voucher-copy-btn" data-copy-coupon="SCANMSNEW" aria-label="Sao chép mã SCANMSNEW">
                <i class="ph ph-copy" aria-hidden="true"></i>
                <span>Sao chép mã</span>
              </button>
            </div>

            <!-- 5. Cam kết quyền lợi -->
            <div class="mp-voucher-meta-row">
              <span class="mp-voucher-scope"><i class="ph-fill ph-shield-check"></i> Đồng kiểm COD &amp; Đổi trả 14 ngày</span>
              <button type="button" class="mp-terms-link" data-action="open-guide-modal">
                <i class="ph ph-info" aria-hidden="true"></i> Hướng dẫn áp mã
              </button>
            </div>

            <!-- 6. Thao tác: Mua ngay áp dụng mã & Cuộn xuống xem Creator -->
            <div class="mp-spotlight-actions">
              <button type="button" class="mp-spotlight-btn-view" data-action="scroll-to-catalog">
                <i class="ph-bold ph-shopping-bag"></i> Mua ngay áp dụng mã
              </button>
              <button type="button" class="mp-spotlight-btn-creators" data-action="scroll-to-creators">
                <i class="ph-bold ph-users-three"></i> Ưu đãi Creator bên dưới <i class="ph-bold ph-arrow-down" style="font-size:12px"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. THANH QUYỀN LỢI: BA MỤC TRÊN MỘT HÀNG (76-88PX, 3 CỘT CÂN ĐỐI) -->
      <section class="mp-benefits-section">
        <div class="mp-benefits-bar">
          <div class="mp-benefit-item" data-action="open-policy" data-policy="guest">
            <div class="mp-benefit-icon">
              <i class="ph ph-lightning"></i>
            </div>
            <div class="mp-benefit-text">
              <strong class="mp-benefit-title">Mua không cần tài khoản</strong>
              <span class="mp-benefit-desc">Đặt hàng nhanh, chỉ cần số điện thoại & địa chỉ</span>
            </div>
          </div>

          <div class="mp-benefit-item" data-action="open-policy" data-policy="voucher">
            <div class="mp-benefit-icon">
              <i class="ph ph-tag"></i>
            </div>
            <div class="mp-benefit-text">
              <strong class="mp-benefit-title">Ưu đãi từ Creator</strong>
              <span class="mp-benefit-desc">Tiết kiệm thêm với mã giảm giá độc quyền</span>
            </div>
          </div>

          <div class="mp-benefit-item" data-action="open-policy" data-policy="return">
            <div class="mp-benefit-icon">
              <i class="ph ph-arrows-clockwise"></i>
            </div>
            <div class="mp-benefit-text">
              <strong class="mp-benefit-title">Chính sách đổi trả</strong>
              <span class="mp-benefit-desc">Hỗ trợ đổi trả trong 7 ngày minh bạch</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. KHU VỰC CREATOR: DẠNG THẺ GỌN (230-270PX, 4 CARD/HÀNG, ĐÁY NÚT THẲNG HÀNG) -->
      <section class="mp-creator-section" id="mp-creator-section">
        <div class="mp-creator-head">
          <h2 class="mp-creator-heading">Creator bạn thích, ưu đãi bạn chọn</h2>
          <p class="mp-creator-subheading">Xem lĩnh vực review, so sánh mức giảm và chọn mã phù hợp.</p>
          <p class="mp-selection-summary" role="status"><i class="ph ph-check-circle" aria-hidden="true"></i> Bạn đang chọn mã <strong>${activeCreator.coupon}</strong> từ ${escapeHtml(activeCreator.name)}.</p>
        </div>

        <div class="mp-creator-grid">
          ${marketplaceKOLs.map(k => {
            const isSelected = state.selectedCreatorId === k.id || state.activeCoupon === k.coupon;
            const isFiltered = state.creatorFilterId === k.id;
            const shortNiche = k.id === "nhat" ? "Chăm sóc da & Mờ thâm" :
                               k.id === "maianh" ? "Chống nắng & Căng bóng" :
                               k.id === "linh" ? "Da nhạy cảm & Dị ứng" : "Gia dụng & Thiết bị số";

            return `
              <div class="mp-creator-card ${isSelected ? 'selected' : ''}" data-creator-id="${k.id}">
                <!-- 1. Hàng đầu: Avatar ảnh thật kèm huy hiệu xác minh, tên, phân hạng & nền tảng -->
                <div class="mp-creator-top">
                  <div class="mp-creator-card-avatar-wrap">
                    <img src="${k.avatarImg}" alt="${escapeHtml(k.name)}" class="mp-creator-card-avatar-img" />
                    <span class="mp-creator-verified-badge" title="Creator chính thức"><i class="ph-fill ph-seal-check"></i></span>
                  </div>
                  <div class="mp-creator-meta">
                    <div class="mp-creator-name-row">
                      <strong class="mp-creator-name">${escapeHtml(k.name)}</strong>
                      <span class="mp-creator-tier-pill">${escapeHtml(k.tier)}</span>
                    </div>
                    <div class="mp-creator-platform-row">
                      <span class="mp-creator-platform-text"><i class="ph ${k.platformIcon}" aria-hidden="true"></i> ${escapeHtml(k.followers || k.platform)}</span>
                    </div>
                  </div>
                </div>

                <!-- 2. Một dòng lĩnh vực ngắn -->
                <div class="mp-creator-niche-line">
                  <span class="mp-niche-tag"><i class="ph ${k.id === 'nhat' ? 'ph-drop' : k.id === 'maianh' ? 'ph-sun' : k.id === 'linh' ? 'ph-shield-check' : 'ph-devices'}" aria-hidden="true"></i> ${escapeHtml(shortNiche)}</span>
                </div>

                <!-- 3. Một dải voucher gọn: mức giảm bên trái, mã & nút sao chép bên phải -->
                <div class="mp-creator-voucher-strip">
                  <strong class="mp-voucher-discount-text">Giảm ${k.voucherInfo.discount}</strong>
                  <div class="mp-voucher-code-group">
                    <code class="mp-voucher-code">${k.coupon}</code>
                    <button type="button" class="mp-voucher-copy-btn" data-copy-coupon="${k.coupon}" title="Sao chép mã ${k.coupon}">
                      <i class="ph ph-copy"></i>
                      <span>Sao chép</span>
                    </button>
                  </div>
                </div>

                <!-- 4. Liên kết điều kiện áp dụng -->
                <div class="mp-creator-terms-line">
                  <button type="button" class="mp-terms-link" data-open-terms="${k.id}">
                    <i class="ph ph-info"></i> Điều kiện áp dụng
                  </button>
                </div>

                <!-- 5. Nút chính full-width "Chọn ưu đãi" / "Đã chọn" -->
                <div class="mp-creator-action-box">
                  <button type="button" class="mp-creator-select-btn ${isSelected ? 'active' : ''}" data-select-creator="${k.id}" aria-pressed="${isSelected}">
                    ${isSelected ? `<i class="ph-fill ph-check-circle"></i> Đã chọn` : `Chọn ưu đãi`}
                  </button>
                </div>

                <!-- 6. Liên kết phụ "Xem hồ sơ" -->
                <div class="mp-creator-footer-link">
                  <button type="button" class="mp-creator-profile-link" data-open-profile="${k.id}">
                    Xem hồ sơ <i class="ph ph-arrow-right"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- 5. VIDEO REVIEWS & ADVERTISEMENTS REEL (FR-15) -->
      <section class="mp-video-section">
        <div class="mp-section-head">
          <div class="mp-section-title-wrap">
            <h2><i class="ph ph-video" style="color:#dc2626"></i> Góc Review & Quảng Cáo Sản Phẩm Của KOL</h2>
            <p>Xem trải nghiệm thực tế từ các nhà sáng tạo nội dung trước khi quyết định mua hàng</p>
          </div>
        </div>

        <div class="mp-video-reel">
          ${marketplaceVideos.map(v => `
            <div class="mp-video-card" data-video-id="${v.id}" data-product-id="${v.productId}" data-coupon="${v.coupon}">
              <div class="mp-video-thumbnail-box">
                <img src="${v.thumbnail}" alt="${escapeHtml(v.title)}" />
                <div class="mp-video-views"><i class="ph ph-eye"></i> ${v.views}</div>
                <div class="mp-video-duration">${v.duration}</div>
                <button class="mp-video-play-btn" data-play-video="${v.id}" aria-label="Xem video review">
                  <i class="ph-fill ph-play"></i>
                </button>
              </div>
              <div class="mp-video-body">
                <div class="mp-video-kol-tag">
                  <i class="ph ph-check-circle"></i> Review bởi: ${escapeHtml(v.kol)}
                </div>
                <h3 class="mp-video-title">${escapeHtml(v.title)}</h3>
                <div class="mp-video-cta">
                  <button class="mp-video-btn" data-buy-from-video="${v.productId}" data-coupon="${v.coupon}">
                    <i class="ph ph-shopping-bag"></i> Mua theo gợi ý (-10%)
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 6. ALL PRODUCTS CATALOG GRID -->
      <section class="mp-catalog-section" id="mp-products-anchor">
        <div class="mp-section-head">
          <div class="mp-section-title-wrap">
            <h2><i class="ph ph-storefront" style="color:var(--brand)"></i> Toàn Bộ Sản Phẩm Sàn SCANMS (${filteredProducts.length})</h2>
            <p>
              ${q ? `Kết quả tìm kiếm cho: "<strong>${escapeHtml(q)}</strong>"` : (
                state.creatorFilterId ? `Đang hiển thị các sản phẩm được đề xuất bởi <strong>${escapeHtml(activeCreator.name)}</strong>` : 'Sản phẩm chính hãng liên kết trực tiếp với các xưởng và thương hiệu uy tín'
              )}
            </p>
          </div>
          <div class="mp-catalog-head-actions">
            ${state.creatorFilterId ? `
              <div class="mp-active-creator-chip">
                <span>Sản phẩm từ <strong>${escapeHtml(activeCreator.name)}</strong></span>
                <button type="button" class="mp-chip-close-btn" data-action="clear-creator-filter" title="Bỏ lọc sản phẩm (Vẫn giữ ưu đãi)">
                  <i class="ph ph-x"></i>
                  <span>Bỏ lọc</span>
                </button>
              </div>
            ` : ''}
            ${q ? `<button type="button" class="text-btn" id="mp-reset-filter-btn">Hủy lọc tìm kiếm</button>` : ''}
          </div>
        </div>

        ${filteredProducts.length === 0 ? `
          <div class="card" style="text-align:center;padding:48px 20px;border-radius:16px;margin:20px 0">
            <i class="ph ph-magnifying-glass" style="font-size:44px;color:var(--muted);margin-bottom:12px;display:block"></i>
            <h3 style="margin:0 0 6px">Không tìm thấy sản phẩm nào phù hợp</h3>
            <p style="color:var(--muted);font-size:13.5px;margin:0 0 18px">Thử tìm kiếm với từ khóa khác như "Serum", "Kem chống nắng", hoặc tên KOL "Nhật", "Mai Anh"...</p>
            <button class="btn secondary" id="mp-empty-reset-btn">Xem tất cả sản phẩm</button>
          </div>
        ` : `
          <div class="mp-catalog-grid">
            ${filteredProducts.map(p => `
              <div class="mp-product-card" data-product-id="${p.id}">
                <div class="mp-product-image-box">
                  <img src="${p.image}" alt="${escapeHtml(p.name)}" />
                  <span class="mp-badge-shop"><i class="ph ph-storefront"></i> ${escapeHtml(p.brand)}</span>
                  ${p.badge ? `<span class="mp-badge-discount">${p.badge}</span>` : ''}
                </div>
                <div class="mp-product-body">
                  <!-- KOL Banner -->
                  <div class="mp-product-kol-banner">
                    <div class="mp-product-kol-banner-left">
                      <i class="ph ph-tag"></i>
                      <span>Gợi ý: <strong>${escapeHtml(p.kol ? p.kol.name : 'KOL')}</strong></span>
                    </div>
                    <span class="mp-product-kol-banner-code">${p.kol ? p.kol.coupon : 'SCANMS10'}</span>
                  </div>

                  <h3 class="mp-product-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>

                  <div class="mp-product-rating-row">
                    <div class="mp-stars">
                      <i class="ph-fill ph-star"></i>
                      <i class="ph-fill ph-star"></i>
                      <i class="ph-fill ph-star"></i>
                      <i class="ph-fill ph-star"></i>
                      <i class="ph-fill ph-star"></i>
                    </div>
                    <span><strong>${p.rating}</strong> (${p.reviews})</span>
                    <span>•</span>
                    <span>Đã bán ${p.sold}</span>
                  </div>

                  <div class="mp-product-price-box">
                    <div class="mp-price-final-row">
                      <span class="mp-price-final">${money(p.kolDiscountPrice)}</span>
                      <span class="mp-price-orig">${money(p.origPrice)}</span>
                    </div>
                    <div class="mp-price-sub">
                      <i class="ph ph-check-circle"></i> Đã giảm 10% khi áp mã <strong>${p.kol ? p.kol.coupon : ''}</strong>
                    </div>
                  </div>

                  <div class="mp-product-actions">
                    <button class="mp-btn-details" data-view-detail="${p.id}">
                      <i class="ph ph-info"></i> Chi tiết
                    </button>
                    <button class="mp-btn-buy" data-quick-buy="${p.id}" data-coupon="${p.kol ? p.kol.coupon : ''}">
                      <i class="ph ph-lightning"></i> Mua ngay
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </section>

      <!-- 7. PHONE ORDER LOOKUP SECTION (TRA CỨU ĐƠN HÀNG BẰNG SĐT) -->
      <section class="mp-tracking-banner-section" id="mp-tracking-anchor">
        <div class="mp-tracking-card">
          <div class="mp-tracking-left">
            <span class="badge warning" style="font-size:11px;font-weight:750;margin-bottom:8px">
              <i class="ph ph-shield-check"></i> KHÔNG CẦN ĐĂNG NHẬP
            </span>
            <h3>Tra cứu đơn hàng bằng Số Điện Thoại</h3>
            <p>
              Khách mua qua Guest Checkout có thể nhập số điện thoại đặt hàng để kiểm tra tiến độ đóng gói, mã vận đơn GHN/GHTK và thời hạn 14 ngày bảo hộ đổi trả.
            </p>
            <div class="mp-tracking-input-group">
              <input
                type="tel"
                id="mp-tracking-phone-input"
                class="mp-tracking-input"
                placeholder="Nhập số điện thoại (VD: 0903 218 456)..."
                value="${state.trackingPhone}"
              />
              <button class="mp-tracking-submit-btn" id="mp-tracking-submit-btn">
                <i class="ph ph-magnifying-glass"></i> Tra cứu
              </button>
            </div>
          </div>

          <div class="mp-tracking-right" id="mp-tracking-result-container">
            <div class="mp-tracking-result-box">
              <div class="mp-tracking-result-head">
                <strong><i class="ph ph-truck"></i> Tình trạng đơn hàng gần nhất</strong>
                <span class="badge success">Demo có sẵn</span>
              </div>
              <div style="font-size:13px;line-height:1.6;color:var(--ink)">
                <div>Mã đơn: <strong class="mono">#IN23944</strong> (Nguyễn Hải Yến - 0903 218 456)</div>
                <div>Sản phẩm: <strong>Serum Vitamin C 15% Sora Skin</strong></div>
                <div>Đơn vị: <strong>GHN Express</strong> (Mã: <span class="mono">GHN88421092VN</span>)</div>
                <div style="margin-top:6px;padding:6px 10px;background:#fff;border-radius:8px;border:1px dashed #DEBE85;color:#7A561B">
                  <i class="ph ph-clock-counter-clockwise"></i> <strong>Escrow 14 ngày:</strong> Còn 12 ngày trong thời hạn bảo hộ đổi trả an toàn.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 8. FLOATING CHAT WIDGET -->
      <button class="mp-floating-chat-btn" id="mp-floating-chat-btn" title="Nhắn tin & Tư vấn nhanh">
        <i class="ph ph-chat-circle-dots"></i>
        <span>Tư vấn & Hỏi Shop</span>
      </button>

      <div class="mp-chat-modal-window ${state.isChatOpen ? 'show' : ''}" id="mp-chat-window">
        <div class="mp-chat-head">
          <div class="mp-chat-head-user">
            <div class="avatar" style="width:32px;height:32px;font-size:13px;background:var(--brand-soft);color:var(--brand-strong)">CS</div>
            <div>
              <strong>Tư vấn viên SCANMS</strong>
              <small><i class="ph ph-circle-fill" style="font-size:8px"></i> Trực tuyến 24/7</small>
            </div>
          </div>
          <button class="icon-btn small" id="mp-close-chat-btn" style="width:30px;height:30px">
            <i class="ph ph-x"></i>
          </button>
        </div>

        <div class="mp-chat-body" id="mp-chat-messages">
          <div class="mp-chat-bubble bot">
            Xin chào quý khách! Em là trợ lý trực tuyến của sàn SCANMS. Quý khách cần hỗ trợ chọn sản phẩm nào hoặc cần giải đáp về mã ưu đãi của KOL không ạ?
          </div>
          <div class="mp-chat-quick-chips">
            <button class="mp-chat-chip" data-chat-ask="Serum C15 có hợp da mụn không?">Serum C15 hợp da mụn?</button>
            <button class="mp-chat-chip" data-chat-ask="Cách áp mã giảm giá của KOL?">Cách áp mã KOL?</button>
            <button class="mp-chat-chip" data-chat-ask="Chính sách bảo hộ đổi trả 14 ngày?">Đổi trả 14 ngày?</button>
          </div>
        </div>

        <form class="mp-chat-footer" id="mp-chat-form">
          <input type="text" id="mp-chat-input" class="mp-chat-input" placeholder="Nhập tin nhắn..." required />
          <button type="submit" class="mp-chat-send-btn"><i class="ph ph-paper-plane-tilt"></i></button>
        </form>
      </div>

      <!-- 9. PUBLIC FOOTER (LUXURY WARM BEIGE THEME) -->
      <footer class="mp-footer">
        <div class="mp-footer-inner">
          <div class="mp-footer-col">
            <div class="mp-footer-brand-wrap">
              <div class="mp-footer-brand-mark">S</div>
              <strong class="mp-footer-brand-title">SCANMS Network</strong>
            </div>
            <p class="mp-footer-desc">
              Hệ thống Tiếp thị Liên kết và Mua sắm Minh bạch (Sales Collaborator and Affiliate Network Management System). Đề tài NCKH/Khóa luận FA26SE032.
            </p>
            <div class="mp-footer-trust-badge">
              <i class="ph ph-shield-check"></i>
              <span>Được bảo hộ bởi cơ chế Escrow 14 ngày & AI Fraud Sentinel</span>
            </div>
          </div>
          <div class="mp-footer-col">
            <h4>Khám Phá Sàn</h4>
            <ul>
              <li><a href="#marketplace" class="mp-footer-cat-link" data-footer-cat="all">Tất cả sản phẩm</a></li>
              <li><a href="#marketplace" class="mp-footer-cat-link" data-footer-cat="tech">Công nghệ & Phụ kiện</a></li>
              <li><a href="#marketplace" class="mp-footer-cat-link" data-footer-cat="beauty">Mỹ phẩm & Chăm sóc da</a></li>
              <li><a href="#marketplace" class="mp-footer-cat-link" data-footer-cat="fashion">Thời trang & Phụ kiện</a></li>
              <li><a href="#marketplace" class="mp-footer-cat-link" data-footer-cat="lifestyle">Gia dụng & Đời sống</a></li>
            </ul>
          </div>

          <div class="mp-footer-col">
            <h4>Hỗ Trợ & Chính Sách</h4>
            <ul>
              <li><a href="#marketplace" class="mp-footer-scroll" data-target="#mp-tracking">Tra cứu vận đơn</a></li>
              <li><a href="javascript:void(0)" class="mp-footer-policy-link" data-policy="escrow">Cơ chế bảo vệ Escrow</a></li>
              <li><a href="javascript:void(0)" class="mp-footer-policy-link" data-policy="return">Chính sách đổi trả 7 ngày</a></li>
              <li><a href="javascript:void(0)" class="mp-footer-policy-link" data-policy="shipping">Chính sách giao hàng</a></li>
              <li><a href="javascript:void(0)" class="mp-footer-policy-link" data-policy="privacy">Bảo mật thông tin khách hàng</a></li>
            </ul>
          </div>

          <div class="mp-footer-col">
            <h4>Dành Cho Đối Tác</h4>
            <ul>
              <li><a href="#register-kol" class="mp-footer-nav" data-go="register-kol">Đăng ký trở thành KOL/Creator</a></li>
              <li><a href="#register-brand" class="mp-footer-nav" data-go="register-brand">Hợp tác thương hiệu/Nhà cung cấp</a></li>
              <li><a href="javascript:void(0)" class="mp-footer-policy-link" data-policy="affiliate">Chính sách đối tác Affiliate</a></li>
              <li><a href="javascript:void(0)" class="mp-footer-contact-link">Liên hệ đội ngũ hỗ trợ</a></li>
            </ul>
          </div>
        </div>

        <div class="mp-footer-bottom">
          <div class="mp-footer-bottom-inner">
            <p>&copy; 2026 SCANMS Network • Nền tảng Tiếp thị Liên kết & Thương mại D2C Minh Bạch Hàng Đầu Việt Nam.</p>
            <div class="mp-footer-bottom-links">
              <a href="javascript:void(0)" class="mp-footer-policy-link" data-policy="terms">Điều khoản sử dụng</a>
              <span class="mp-footer-dot">•</span>
              <a href="javascript:void(0)" class="mp-footer-policy-link" data-policy="privacy">Chính sách riêng tư</a>
              <span class="mp-footer-dot">•</span>
              <a href="javascript:void(0)" class="mp-footer-policy-link" data-policy="complaint">Quy trình giải quyết tranh chấp</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `;
}

// BIND INTERACTIONS & EVENT LISTENERS
export function bindMarketplace(root, { toast, go, renderCurrentPage, modal }) {
  // 1. Search Bar & Suggestions
  const searchInput = root.querySelector("#mp-search-input");
  const searchBtn = root.querySelector("#mp-search-btn");
  const clearSearchBtn = root.querySelector("#mp-clear-search-btn");
  const suggestionsBox = root.querySelector("#mp-search-suggestions");

  const doSearch = () => {
    if (suggestionsBox) suggestionsBox.classList.remove("show");
    state.searchQuery = searchInput ? searchInput.value.trim() : "";
    renderCurrentPage();
  };

  searchBtn?.addEventListener("click", doSearch);
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch();
    }
  });

  clearSearchBtn?.addEventListener("click", () => {
    state.searchQuery = "";
    if (suggestionsBox) suggestionsBox.classList.remove("show");
    renderCurrentPage();
  });

  root.querySelector("#mp-reset-filter-btn")?.addEventListener("click", () => {
    state.searchQuery = "";
    state.selectedCategory = "all";
    renderCurrentPage();
  });

  root.querySelector("#mp-empty-reset-btn")?.addEventListener("click", () => {
    state.searchQuery = "";
    state.selectedCategory = "all";
    state.creatorFilterId = null;
    renderCurrentPage();
  });

  // Search Live Suggestions
  const updateSuggestions = (query) => {
    if (!suggestionsBox) return;
    const term = query.trim().toLowerCase();
    if (term.length < 2) {
      suggestionsBox.classList.remove("show");
      suggestionsBox.innerHTML = "";
      return;
    }

    const matchedProds = marketplaceProducts.filter(p =>
      p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term)
    ).slice(0, 3);

    const matchedCreators = marketplaceKOLs.filter(k =>
      k.name.toLowerCase().includes(term) || k.handle.toLowerCase().includes(term) || k.niche.toLowerCase().includes(term)
    ).slice(0, 2);

    const matchedBrands = Array.from(new Set(
      marketplaceProducts.filter(p => p.brand.toLowerCase().includes(term)).map(p => p.brand)
    )).slice(0, 2);

    if (!matchedProds.length && !matchedCreators.length && !matchedBrands.length) {
      suggestionsBox.innerHTML = `
        <div class="mp-suggestion-empty">
          <i class="ph ph-magnifying-glass"></i>
          <span>Không tìm thấy sản phẩm, thương hiệu hoặc Creator cho "<strong>${escapeHtml(term)}</strong>"</span>
        </div>
      `;
      suggestionsBox.classList.add("show");
      return;
    }

    let html = '';
    if (matchedProds.length) {
      html += `
        <div class="mp-suggestion-group">
          <span class="mp-suggestion-group-title"><i class="ph ph-shopping-bag"></i> Sản phẩm (${matchedProds.length})</span>
          ${matchedProds.map(p => `
            <div class="mp-suggestion-item" data-suggestion-prod="${p.id}">
              <img src="${p.image}" alt="${escapeHtml(p.name)}" class="mp-suggestion-thumb" />
              <div class="mp-suggestion-meta">
                <span class="mp-suggestion-name">${escapeHtml(p.name)}</span>
                <span class="mp-suggestion-sub">${escapeHtml(p.brand)} • <strong>${money(p.kolDiscountPrice || p.price)}</strong></span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (matchedCreators.length) {
      html += `
        <div class="mp-suggestion-group">
          <span class="mp-suggestion-group-title"><i class="ph ph-user"></i> Creator đối tác</span>
          ${matchedCreators.map(c => `
            <div class="mp-suggestion-item" data-suggestion-creator="${c.id}">
              <img src="${c.avatarImg}" alt="${escapeHtml(c.name)}" class="mp-suggestion-thumb avatar" />
              <div class="mp-suggestion-meta">
                <span class="mp-suggestion-name">${escapeHtml(c.name)} <i class="ph-fill ph-check-circle"></i></span>
                <span class="mp-suggestion-sub">${escapeHtml(c.niche || c.handle)} • Mã: <strong>${c.coupon}</strong></span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (matchedBrands.length) {
      html += `
        <div class="mp-suggestion-group">
          <span class="mp-suggestion-group-title"><i class="ph ph-storefront"></i> Thương hiệu</span>
          ${matchedBrands.map(b => `
            <div class="mp-suggestion-item" data-suggestion-brand="${escapeHtml(b)}">
              <span class="mp-suggestion-brand-pill"><i class="ph ph-seal-check"></i> ${escapeHtml(b)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    suggestionsBox.innerHTML = html;
    suggestionsBox.classList.add("show");

    // Suggestion Click Bindings
    suggestionsBox.querySelectorAll("[data-suggestion-prod]").forEach(item => {
      item.addEventListener("click", () => {
        const prodId = item.dataset.suggestionProd;
        const prod = marketplaceProducts.find(p => p.id === prodId);
        if (prod) {
          state.searchQuery = prod.name;
          suggestionsBox.classList.remove("show");
          renderCurrentPage();
          const anchor = root.querySelector("#mp-products-anchor");
          anchor?.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    suggestionsBox.querySelectorAll("[data-suggestion-creator]").forEach(item => {
      item.addEventListener("click", () => {
        const creatorId = item.dataset.suggestionCreator;
        const creator = marketplaceKOLs.find(k => k.id === creatorId);
        if (creator) {
          state.selectedCreatorId = creator.id;
          state.activeCoupon = creator.coupon;
          state.activeKol = creator.name;
          state.creatorFilterId = creator.id;
          suggestionsBox.classList.remove("show");
          renderCurrentPage();
          toast(`Đã chọn Creator ${creator.name} và lọc các sản phẩm bảo chứng!`);
          const anchor = root.querySelector("#mp-products-anchor");
          anchor?.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    suggestionsBox.querySelectorAll("[data-suggestion-brand]").forEach(item => {
      item.addEventListener("click", () => {
        const brand = item.dataset.suggestionBrand;
        state.searchQuery = brand;
        suggestionsBox.classList.remove("show");
        renderCurrentPage();
      });
    });
  };

  searchInput?.addEventListener("input", (e) => {
    updateSuggestions(e.target.value);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".mp-search-container")) {
      suggestionsBox?.classList.remove("show");
    }
  });

  // 2. Category Pills
  root.querySelectorAll(".mp-cat-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      state.selectedCategory = pill.dataset.cat;
      renderCurrentPage();
    });
  });

  // 3. Creator Selection (Tách biệt: Chọn ưu đãi)
  root.querySelectorAll("[data-select-creator]").forEach(btn => {
    btn.addEventListener("click", () => {
      const creatorId = btn.dataset.selectCreator;
      const creator = marketplaceKOLs.find(k => k.id === creatorId);
      if (!creator) return;
      state.selectedCreatorId = creator.id;
      state.activeCoupon = creator.coupon;
      state.activeKol = creator.name;
      renderCurrentPage();
      toast(`Đã chọn ưu đãi của ${creator.name}! Mã ${creator.coupon} sẽ tự động áp dụng khi mua hàng.`);
    });
  });

  // 4. Copy Coupon Code (CHỈ sao chép, không tự đổi Creator, không đổi bộ lọc)
  root.querySelectorAll("[data-copy-coupon]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (btn.classList.contains("copied")) return;
      const code = btn.dataset.copyCoupon;
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        toast(`Mã ưu đãi: ${code} (Vui lòng sao chép thủ công)`);
        return;
      }
      toast(`Đã sao chép mã ưu đãi: ${code}!`);
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<i class="ph ph-check" aria-hidden="true"></i> <span>Đã sao chép</span>`;
      btn.classList.add("copied");
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.classList.remove("copied");
      }, 1800);
    });
  });

  // 5. Filter Products by Creator
  root.querySelectorAll("[data-filter-creator]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const creatorId = btn.dataset.filterCreator;
      if (state.creatorFilterId === creatorId) {
        state.creatorFilterId = null;
        renderCurrentPage();
        toast("Đã bỏ lọc sản phẩm theo Creator.");
      } else {
        state.creatorFilterId = creatorId;
        const creator = marketplaceKOLs.find(k => k.id === creatorId);
        renderCurrentPage();
        toast(`Đang lọc sản phẩm được đề xuất bởi ${creator?.name}!`);
        const anchor = root.querySelector("#mp-products-anchor");
        anchor?.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  root.querySelectorAll("[data-action='clear-creator-filter']").forEach(btn => {
    btn.addEventListener("click", () => {
      state.creatorFilterId = null;
      renderCurrentPage();
      toast("Đã bỏ lọc sản phẩm. Mã ưu đãi của Creator vẫn được lưu giữ!");
    });
  });

  // 6. View Creator Profile Modal
  root.querySelectorAll("[data-open-profile]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const creatorId = btn.dataset.openProfile;
      const creator = marketplaceKOLs.find(k => k.id === creatorId);
      if (!creator) return;
      openCreatorProfileModal(creator, {
        toast,
        onSelectCreator: (c) => {
          state.selectedCreatorId = c.id;
          state.activeCoupon = c.coupon;
          state.activeKol = c.name;
          renderCurrentPage();
          toast(`Đã chọn ưu đãi của Creator ${c.name} (Mã ${c.coupon})!`);
        },
        onFilterProducts: (c) => {
          state.creatorFilterId = c.id;
          renderCurrentPage();
          const anchor = root.querySelector("#mp-products-anchor");
          anchor?.scrollIntoView({ behavior: "smooth" });
        },
        openVideoModal: (vid) => openVideoPlayerModal(vid, { toast, go }),
        openCheckoutModal: (prod, coupon) => openGuestCheckoutModal(prod, coupon, { toast, renderCurrentPage })
      });
    });
  });

  // 7. Role Login Dropdown Toggle
  const loginToggleBtn = root.querySelector("#mp-login-toggle-btn");
  const loginDropdown = root.querySelector("#mp-login-dropdown");

  loginToggleBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    loginDropdown?.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".mp-login-dropdown-wrap")) {
      loginDropdown?.classList.remove("show");
    }
  });

  // Switch to Role Login
  root.querySelectorAll("[data-goto-role]").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetRole = btn.dataset.gotoRole;
      window.location.hash = `#auth`;
      sessionStorage.setItem("scanms-preferred-role", targetRole);
      go("auth");
      toast(`Chuyển đến màn hình Đăng nhập dành cho vai trò ${targetRole.toUpperCase()}`);
    });
  });

  root.querySelectorAll("[data-goto-auth]").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.gotoAuth;
      window.location.hash = mode === "register" ? "#register" : "#auth";
      go("auth");
    });
  });

  // 8. Scroll navigation helpers
  root.querySelectorAll("[data-action='scroll-products'], [data-action='scroll-to-catalog']").forEach(btn => {
    btn.addEventListener("click", () => {
      const anchor = root.querySelector("#mp-products-anchor");
      anchor?.scrollIntoView({ behavior: "smooth" });
    });
  });

  root.querySelectorAll("[data-action='scroll-to-creators']").forEach(btn => {
    btn.addEventListener("click", () => {
      const anchor = root.querySelector("#mp-creator-section");
      anchor?.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Open Guide modal ("Cách nhận ưu đãi")
  root.querySelectorAll("[data-action='open-guide-modal']").forEach(btn => {
    btn.addEventListener("click", () => {
      openGuideModal({ toast });
    });
  });

  // Quick View Product Modal
  root.querySelectorAll("[data-quick-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.dataset.quickView;
      const prod = marketplaceProducts.find(p => p.id === prodId) || marketplaceProducts[0];
      const activeCreator = marketplaceKOLs.find(k => k.id === state.selectedCreatorId) || marketplaceKOLs[0];
      openProductQuickViewModal(prod, activeCreator, {
        toast,
        openCheckoutModal: (p, c) => openGuestCheckoutModal(p, c, { toast, renderCurrentPage }),
        go,
        onAddToCart: () => {
          state.cartCount++;
          const badge = root.querySelector("#mp-cart-count");
          if (badge) badge.innerText = state.cartCount;
        }
      });
    });
  });

  // Open Voucher Terms Modal
  root.querySelectorAll("[data-open-terms]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const creatorId = btn.dataset.openTerms;
      const creator = marketplaceKOLs.find(k => k.id === creatorId) || marketplaceKOLs[0];
      openVoucherTermsModal(creator, {
        toast,
        onSelectCreator: (c) => {
          state.selectedCreatorId = c.id;
          state.activeCoupon = c.coupon;
          state.activeKol = c.name;
          renderCurrentPage();
          toast(`Đã lưu ưu đãi từ ${c.name} (Mã ${c.coupon})!`);
        }
      });
    });
  });

  // Open Benefits Policy Modal
  root.querySelectorAll("[data-action='open-policy']").forEach(item => {
    item.setAttribute("role", "button");
    item.tabIndex = 0;
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        item.click();
      }
    });
    item.addEventListener("click", () => {
      const policyType = item.dataset.policy;
      openPolicyModal(policyType);
    });
  });

  root.querySelectorAll("[data-action='scroll-tracking']").forEach(btn => {
    btn.addEventListener("click", () => {
      const anchor = root.querySelector("#mp-tracking-anchor");
      anchor?.scrollIntoView({ behavior: "smooth" });
      const input = root.querySelector("#mp-tracking-phone-input");
      input?.focus();
    });
  });

  // 9. View detail button -> Navigate to storefront detail
  root.querySelectorAll("[data-view-detail]").forEach(btn => {
    btn.addEventListener("click", () => {
      go("storefront");
    });
  });

  // 10. Video Play Modal
  root.querySelectorAll("[data-play-video]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const vidId = btn.dataset.playVideo;
      const vid = marketplaceVideos.find(v => v.id === vidId);
      if (!vid) return;
      openVideoPlayerModal(vid, { toast, go });
    });
  });

  root.querySelectorAll("[data-action='open-video-hero']").forEach(btn => {
    btn.addEventListener("click", () => {
      const vid = marketplaceVideos[0];
      if (vid) openVideoPlayerModal(vid, { toast, go });
    });
  });

  // 11. Quick Buy / Guest Checkout (FR-16)
  root.querySelectorAll("[data-quick-buy]").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.dataset.quickBuy;
      const coupon = btn.dataset.coupon || state.activeCoupon || "NHATXINH10";
      const prod = marketplaceProducts.find(p => p.id === prodId) || marketplaceProducts[0];
      openGuestCheckoutModal(prod, coupon, { toast, renderCurrentPage });
    });
  });

  root.querySelectorAll("[data-buy-from-video]").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.dataset.buyFromVideo;
      const coupon = btn.dataset.coupon || "NHATXINH10";
      const prod = marketplaceProducts.find(p => p.id === prodId) || marketplaceProducts[0];
      openGuestCheckoutModal(prod, coupon, { toast, renderCurrentPage });
    });
  });

  // 12. Phone Order Lookup
  const trackingInput = root.querySelector("#mp-tracking-phone-input");
  const trackingBtn = root.querySelector("#mp-tracking-submit-btn");

  const doTrackingLookup = () => {
    const phone = trackingInput?.value.trim().replace(/\s+/g, "");
    if (!phone) {
      toast("Vui lòng nhập số điện thoại đặt hàng để tra cứu!");
      return;
    }
    const orders = getDemoOrders();
    const matches = orders.filter(o => o.phone.replace(/\s+/g, "") === phone);

    const resultBox = root.querySelector("#mp-tracking-result-container");
    if (!resultBox) return;

    if (matches.length > 0) {
      resultBox.innerHTML = `
        <div class="mp-tracking-result-box" style="animation:mpFadeInDown 0.3s">
          <div class="mp-tracking-result-head">
            <strong><i class="ph ph-check-circle" style="color:#059669"></i> Tìm thấy ${matches.length} đơn hàng của ${escapeHtml(matches[0].name)}</strong>
            <span class="badge success">Đã xác minh</span>
          </div>
          ${matches.map(o => `
            <div style="background:#fff;border-radius:10px;padding:12px;margin-bottom:10px;border:1px solid var(--line)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span class="mono" style="font-weight:750;color:var(--brand)">#${o.code}</span>
                <span class="badge ${o.status.includes('thành công') ? 'success' : 'warning'}">${o.status}</span>
              </div>
              <div style="font-weight:700;font-size:13.5px;color:var(--ink)">${escapeHtml(o.product)}</div>
              <div style="font-size:12.5px;color:var(--muted);margin:3px 0">
                Thanh toán: <strong>${money(o.amount)}</strong> • Mã KOL: <strong>${o.coupon}</strong>
              </div>
              <div style="font-size:12px;color:var(--muted)">
                Vận chuyển: ${o.carrier} (${o.trackingNum})
              </div>
              <div style="margin-top:6px;font-size:11.5px;color:#7A561B;background:#FFF9ED;padding:4px 8px;border-radius:6px;border:1px dashed #DEBE85">
                <i class="ph ph-hourglass"></i> Bảo hộ 14 ngày: <strong>Còn ${o.escrowDaysLeft} ngày</strong> đối soát an toàn.
              </div>
            </div>
          `).join('')}
        </div>
      `;
      toast(`Đã tìm thấy ${matches.length} đơn hàng cho SĐT ${phone}!`);
    } else {
      resultBox.innerHTML = `
        <div class="mp-tracking-result-box" style="text-align:center;padding:24px 16px">
          <i class="ph ph-warning-circle" style="font-size:32px;color:var(--danger);margin-bottom:8px;display:block"></i>
          <h4 style="margin:0 0 4px">Không tìm thấy đơn hàng nào với SĐT ${escapeHtml(phone)}</h4>
          <p style="font-size:12.5px;color:var(--muted);margin:0">Quý khách vui lòng kiểm tra lại số điện thoại hoặc thử với SĐT mẫu: <strong>0903 218 456</strong>.</p>
        </div>
      `;
    }
  };

  trackingBtn?.addEventListener("click", doTrackingLookup);
  trackingInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doTrackingLookup();
    }
  });

  // 13. Floating Chat Interactions (FR-29)
  const chatToggleBtn = root.querySelector("#mp-floating-chat-btn");
  const chatWindow = root.querySelector("#mp-chat-window");
  const closeChatBtn = root.querySelector("#mp-close-chat-btn");
  const chatForm = root.querySelector("#mp-chat-form");
  const chatInput = root.querySelector("#mp-chat-input");
  const chatMessages = root.querySelector("#mp-chat-messages");

  chatToggleBtn?.addEventListener("click", () => {
    state.isChatOpen = !state.isChatOpen;
    chatWindow?.classList.toggle("show", state.isChatOpen);
    if (state.isChatOpen) chatInput?.focus();
  });

  closeChatBtn?.addEventListener("click", () => {
    state.isChatOpen = false;
    chatWindow?.classList.remove("show");
  });

  root.querySelectorAll("[data-action='open-chat']").forEach(btn => {
    btn.addEventListener("click", () => {
      state.isChatOpen = true;
      chatWindow?.classList.add("show");
      chatInput?.focus();
    });
  });

  const appendChatMessage = (text, isUser = false) => {
    if (!chatMessages) return;
    const bubble = document.createElement("div");
    bubble.className = `mp-chat-bubble ${isUser ? "user" : "bot"}`;
    bubble.innerText = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  chatForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = chatInput?.value.trim();
    if (!msg) return;
    appendChatMessage(msg, true);
    if (chatInput) chatInput.value = "";

    setTimeout(() => {
      appendChatMessage("Dạ em đã nhận được câu hỏi. Đội ngũ tư vấn SCANMS đang kiểm tra thông tin và sẽ phản hồi quý khách trong giây lát ạ!");
    }, 600);
  });

  root.querySelectorAll("[data-chat-ask]").forEach(chip => {
    chip.addEventListener("click", () => {
      const query = chip.dataset.chatAsk;
      appendChatMessage(query, true);
      setTimeout(() => {
        let answer = "Dạ, quý khách yên tâm mua hàng qua form Guest Checkout không cần tài khoản vẫn nhận đủ bảo hộ đổi trả 14 ngày ạ!";
        if (query.includes("Serum C15")) {
          answer = "Serum Vitamin C 15% Sora Skin có công thức không cồn, bổ sung B5 & Hyaluronate nên da dầu mụn dùng buổi sáng kết hợp kem chống nắng rất êm và sáng da nhanh ạ!";
        } else if (query.includes("mã giảm giá") || query.includes("mã KOL")) {
          answer = "Khi bấm 'Mua ngay', quý khách chỉ cần nhập mã của KOL (ví dụ NHATXINH10 hoặc MAIANH12) vào ô mã giảm giá là hệ thống tự trừ ưu đãi khi đủ điều kiện đơn hàng ạ!";
        }
        appendChatMessage(answer);
      }, 500);
    });
  });

  // Modal Policy & Terms triggers
  root.querySelectorAll("[data-modal-terms]").forEach(el => {
    el.addEventListener("click", () => modal("terms"));
  });
  root.querySelectorAll("[data-modal-policy]").forEach(el => {
    el.addEventListener("click", () => modal("policy"));
  });
}

// ==========================================================================
// 1. GUIDE MODAL ("Cách nhận ưu đãi")
// ==========================================================================
function openGuideModal({ toast }) {
  const triggerEl = document.activeElement;
  const modalRoot = document.querySelector("#modal-root");
  modalRoot.innerHTML = `
    <div class="modal-backdrop mp-modal-backdrop" data-close-guide-modal>
      <div class="mp-guide-modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <div class="mp-modal-header">
          <div class="mp-modal-header-text">
            <h2 class="mp-modal-title"><i class="ph ph-info" style="color:var(--brand-strong)"></i> Hướng Dẫn Nhận Ưu Đãi Creator</h2>
            <p class="mp-modal-subtitle">3 bước đơn giản để mua sắm sản phẩm với mức giá ưu đãi nhất</p>
          </div>
          <button type="button" class="mp-modal-close-btn" data-close-guide-modal aria-label="Đóng">
            <i class="ph ph-x"></i>
          </button>
        </div>

        <div class="mp-guide-body">
          <div class="mp-guide-step">
            <div class="mp-guide-step-num">1</div>
            <div class="mp-guide-step-content">
              <strong>Chọn Creator hoặc Sao chép mã ưu đãi</strong>
              <p>Nhấp "Chọn ưu đãi" tại thẻ Creator hoặc sao chép mã voucher (VD: NHATXINH10, MAIANH12). Hệ thống sẽ tự động ghi nhớ lựa chọn của bạn.</p>
            </div>
          </div>

          <div class="mp-guide-step">
            <div class="mp-guide-step-num">2</div>
            <div class="mp-guide-step-content">
              <strong>Chọn sản phẩm & xem review thực tế</strong>
              <p>Khám phá sản phẩm được đề xuất, kiểm tra video trải nghiệm thực tế và chọn đúng phân loại mong muốn.</p>
            </div>
          </div>

          <div class="mp-guide-step">
            <div class="mp-guide-step-num">3</div>
            <div class="mp-guide-step-content">
              <strong>Đặt hàng nhanh không cần tài khoản</strong>
              <p>Bấm "Xem sản phẩm" hoặc "Mua ngay", nhập số điện thoại và địa chỉ. Ưu đãi tự động giảm trực tiếp vào tổng tiền khi đơn hàng đạt mức tối thiểu.</p>
            </div>
          </div>
        </div>

        <div class="mp-guide-footer">
          <button type="button" class="mp-modal-btn-submit" data-close-guide-modal style="width:100%">
            Đã hiểu, tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => {
    modalRoot.innerHTML = "";
    document.removeEventListener("keydown", escHandler);
    triggerEl?.focus();
  };

  const escHandler = (e) => {
    if (e.key === "Escape") closeModal();
  };
  document.addEventListener("keydown", escHandler);

  modalRoot.querySelectorAll("[data-close-guide-modal]").forEach(b => {
    b.addEventListener("click", closeModal);
  });
}

// ==========================================================================
// 2. PRODUCT QUICK VIEW MODAL ("Xem nhanh sản phẩm")
// ==========================================================================
function openProductQuickViewModal(product, activeCreator, { toast, openCheckoutModal, go, onAddToCart }) {
  const triggerEl = document.activeElement;
  const modalRoot = document.querySelector("#modal-root");

  const variants = product.category === "skincare" 
    ? ["Chai 30ml (Tiêu chuẩn)", "Chai 50ml (Tiết kiệm)"]
    : product.category === "home" 
      ? ["Bản Tiêu Chuẩn", "Bản Cao Cấp"]
      : ["Phiên bản Tiêu Chuẩn", "Phiên bản Nâng Cấp"];

  let selectedVariant = variants[0];

  const renderModal = () => `
    <div class="modal-backdrop mp-modal-backdrop" data-close-quickview>
      <div class="mp-quickview-modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <button type="button" class="mp-modal-close-btn mp-quickview-close" data-close-quickview aria-label="Đóng">
          <i class="ph ph-x"></i>
        </button>

        <div class="mp-quickview-grid">
          <!-- Cột Trái: Ảnh lớn -->
          <div class="mp-quickview-media">
            <img src="${product.image}" alt="${escapeHtml(product.name)}" class="mp-quickview-img" />
            <div class="mp-quickview-badge">
              <i class="ph-fill ph-seal-check"></i> Chính hãng 100%
            </div>
          </div>

          <!-- Cột Phải: Thông tin chi tiết -->
          <div class="mp-quickview-details">
            <div class="mp-quickview-brand">
              <i class="ph ph-storefront"></i> ${escapeHtml(product.brand)}
            </div>

            <h2 class="mp-quickview-title">${escapeHtml(product.name)}</h2>

            <div class="mp-quickview-rating">
              <span class="mp-star">★</span>
              <strong>${product.rating || 4.9}</strong>
              <span class="mp-rev-count">(${product.reviews || 128} đánh giá)</span>
              <span class="mp-dot">•</span>
              <span class="mp-sold-count">Đã bán ${product.sold || "1k+"}</span>
            </div>

            <!-- Giá hiển thị -->
            <div class="mp-quickview-pricing">
              <div class="mp-quickview-price-main">
                <strong class="mp-price-now">${money(product.kolDiscountPrice || Math.round(product.price * 0.9))}</strong>
                <span class="mp-price-was">${money(product.origPrice || product.price)}</span>
              </div>
              ${activeCreator ? `
                <div class="mp-quickview-deal-tag">
                  <i class="ph ph-tag"></i> Đã áp mã <strong>${activeCreator.coupon}</strong> (-${activeCreator.voucherInfo?.discount || "10%"})
                </div>
              ` : ''}
            </div>

            <!-- Chọn Biến Thể -->
            <div class="mp-quickview-variants">
              <label class="mp-variant-label">Phân loại đã chọn: <strong>${escapeHtml(selectedVariant)}</strong></label>
              <div class="mp-variant-chips">
                ${variants.map(v => `
                  <button type="button" class="mp-variant-chip ${v === selectedVariant ? 'active' : ''}" data-variant="${escapeHtml(v)}">
                    ${escapeHtml(v)}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Creator đề xuất -->
            <div class="mp-quickview-creator-note">
              <img src="${activeCreator.avatarImg}" alt="${escapeHtml(activeCreator.name)}" class="mp-quickview-creator-avatar" />
              <div class="mp-quickview-creator-text">
                <span>Creator đề xuất: <strong>${escapeHtml(activeCreator.name)}</strong></span>
                <small>${escapeHtml(activeCreator.niche)}</small>
              </div>
            </div>

            <!-- Nút hành động -->
            <div class="mp-quickview-actions">
              <button type="button" class="mp-quickview-btn-add" id="mp-quickview-add-cart">
                <i class="ph ph-shopping-cart-simple"></i> Thêm vào giỏ
              </button>
              <button type="button" class="mp-quickview-btn-buy" id="mp-quickview-buy-now">
                <i class="ph-fill ph-lightning"></i> Mua ngay
              </button>
            </div>

            <div class="mp-quickview-footer-links">
              <button type="button" class="mp-quickview-more-link" id="mp-quickview-go-storefront">
                Xem trang chi tiết sản phẩm <i class="ph ph-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.innerHTML = renderModal();

  const bindEvents = () => {
    const closeModal = () => {
      modalRoot.innerHTML = "";
      document.removeEventListener("keydown", escHandler);
      triggerEl?.focus();
    };

    const escHandler = (e) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", escHandler);

    modalRoot.querySelectorAll("[data-close-quickview]").forEach(b => {
      b.addEventListener("click", closeModal);
    });

    modalRoot.querySelectorAll("[data-variant]").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedVariant = btn.dataset.variant;
        modalRoot.innerHTML = renderModal();
        bindEvents();
      });
    });

    modalRoot.querySelector("#mp-quickview-add-cart")?.addEventListener("click", () => {
      if (!selectedVariant) {
        toast("Vui lòng chọn phân loại sản phẩm trước khi thêm vào giỏ!");
        return;
      }
      onAddToCart?.();
      toast(`Đã thêm "${product.name} (${selectedVariant})" vào giỏ hàng!`);
      closeModal();
    });

    modalRoot.querySelector("#mp-quickview-buy-now")?.addEventListener("click", () => {
      if (!selectedVariant) {
        toast("Vui lòng chọn phân loại sản phẩm trước khi mua!");
        return;
      }
      closeModal();
      openCheckoutModal(product, activeCreator.coupon);
    });

    modalRoot.querySelector("#mp-quickview-go-storefront")?.addEventListener("click", () => {
      closeModal();
      go("storefront");
    });
  };

  bindEvents();
}

// ==========================================================================
// 3. VOUCHER TERMS MODAL ("Điều kiện áp dụng")
// ==========================================================================
function openVoucherTermsModal(creator, { toast, onSelectCreator }) {
  const triggerEl = document.activeElement;
  const modalRoot = document.querySelector("#modal-root");
  modalRoot.innerHTML = `
    <div class="modal-backdrop mp-modal-backdrop" data-close-terms-modal>
      <div class="mp-terms-modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <div class="mp-modal-header">
          <div class="mp-modal-header-text">
            <h2 class="mp-modal-title"><i class="ph ph-tag" style="color:var(--brand-strong)"></i> Điều Kiện Ưu Đãi: Mã ${creator.coupon}</h2>
            <p class="mp-modal-subtitle">Mã ưu đãi độc quyền từ Creator ${escapeHtml(creator.name)}</p>
          </div>
          <button type="button" class="mp-modal-close-btn" data-close-terms-modal aria-label="Đóng">
            <i class="ph ph-x"></i>
          </button>
        </div>

        <div class="mp-terms-body">
          <div class="mp-terms-creator-summary">
            <img src="${creator.avatarImg}" alt="${escapeHtml(creator.name)}" class="mp-terms-avatar" />
            <div>
              <strong>${escapeHtml(creator.name)}</strong>
              <span>${escapeHtml(creator.platform)} • ${escapeHtml(creator.niche)}</span>
            </div>
          </div>

          <div class="mp-terms-details-table">
            <div class="mp-terms-row">
              <span class="label"><i class="ph ph-ticket"></i> Mã ưu đãi:</span>
              <span class="value"><code class="mp-voucher-code">${creator.coupon}</code></span>
            </div>
            <div class="mp-terms-row">
              <span class="label"><i class="ph ph-percent"></i> Mức giảm:</span>
              <span class="value"><strong>Giảm ${creator.voucherInfo.discount}</strong> (Tối đa ${creator.voucherInfo.maxDiscount})</span>
            </div>
            <div class="mp-terms-row">
              <span class="label"><i class="ph ph-receipt"></i> Đơn hàng tối thiểu:</span>
              <span class="value"><strong>${creator.voucherInfo.minOrder}</strong></span>
            </div>
            <div class="mp-terms-row">
              <span class="label"><i class="ph ph-package"></i> Phạm vi áp dụng:</span>
              <span class="value">${escapeHtml(creator.voucherInfo.appliesTo)}</span>
            </div>
            <div class="mp-terms-row">
              <span class="label"><i class="ph ph-calendar"></i> Hạn sử dụng:</span>
              <span class="value">${creator.voucherInfo.expiry}</span>
            </div>
            <div class="mp-terms-row">
              <span class="label"><i class="ph ph-info"></i> Quy tắc áp dụng:</span>
              <span class="value">Mỗi đơn hàng áp dụng tối đa 01 mã Creator. Giảm trực tiếp vào tổng tiền khi thỏa điều kiện đơn hàng.</span>
            </div>
          </div>
        </div>

        <div class="mp-terms-footer">
          <button type="button" class="mp-terms-btn-copy" id="mp-terms-copy-btn">
            <i class="ph ph-copy"></i> Sao chép mã
          </button>
          <button type="button" class="mp-terms-btn-apply" id="mp-terms-apply-btn">
            <i class="ph-fill ph-check-circle"></i> Chọn ưu đãi này
          </button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => {
    modalRoot.innerHTML = "";
    document.removeEventListener("keydown", escHandler);
    triggerEl?.focus();
  };

  const escHandler = (e) => {
    if (e.key === "Escape") closeModal();
  };
  document.addEventListener("keydown", escHandler);

  modalRoot.querySelectorAll("[data-close-terms-modal]").forEach(b => {
    b.addEventListener("click", closeModal);
  });

  modalRoot.querySelector("#mp-terms-copy-btn")?.addEventListener("click", () => {
    const code = creator.coupon;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        toast(`Đã sao chép mã ưu đãi ${code}!`);
      }).catch(() => {
        toast(`Mã: ${code}`);
      });
    }
  });

  modalRoot.querySelector("#mp-terms-apply-btn")?.addEventListener("click", () => {
    onSelectCreator?.(creator);
    closeModal();
  });
}

// ==========================================================================
// 4. POLICY MODAL ("Chính sách mua hàng & đổi trả")
// ==========================================================================
function openPolicyModal(policyType) {
  const triggerEl = document.activeElement;
  const modalRoot = document.querySelector("#modal-root");

  let title = "Chính Sách Mua Hàng SCANMS";
  let content = "";

  if (policyType === "guest") {
    title = "Mua Sắm Không Cần Tài Khoản";
    content = `
      <div class="mp-policy-block">
        <h4><i class="ph ph-lightning" style="color:var(--brand-strong)"></i> Đặt Hàng Trực Tiếp & Nhanh Chóng</h4>
        <p>SCANMS cho phép khách hàng trải nghiệm mua sắm tiện lợi mà không bắt buộc phải tạo tài khoản thành viên:</p>
        <ul>
          <li><strong>Thông tin tối giản:</strong> Chỉ cần cung cấp Họ tên, Số điện thoại và Địa chỉ nhận hàng.</li>
          <li><strong>Thanh toán khi nhận hàng (COD):</strong> Quý khách được quyền kiểm tra hàng trước khi thanh toán cho nhân viên giao vận.</li>
          <li><strong>Tra cứu đơn hàng dễ dàng:</strong> Bất cứ lúc nào, bạn chỉ cần nhập Số điện thoại đã đặt hàng tại thanh tra cứu để theo dõi lộ trình đơn.</li>
        </ul>
      </div>
    `;
  } else if (policyType === "voucher") {
    title = "Chính Sách Ưu Đãi Từ Creator";
    content = `
      <div class="mp-policy-block">
        <h4><i class="ph ph-tag" style="color:var(--brand-strong)"></i> Quyền Lợi Ưu Đãi Độc Quyền</h4>
        <p>Hệ thống voucher Creator của SCANMS được thiết kế nhằm đem lại quyền lợi tốt nhất cho người mua:</p>
        <ul>
          <li><strong>Mã giảm giá thực tế:</strong> Giảm từ 10% đến 12% trực tiếp trên giá bán của các sản phẩm được Creator đề xuất.</li>
          <li><strong>Minh bạch điều kiện:</strong> Mỗi mã đều công khai rõ đơn hàng tối thiểu và mức giảm tối đa.</li>
          <li><strong>Tự động ghi nhớ:</strong> Khi chọn "Chọn ưu đãi", hệ thống tự lưu mã và tự động áp dụng vào giỏ hàng hoặc form đặt hàng nhanh khi đủ điều kiện.</li>
        </ul>
      </div>
    `;
  } else {
    title = "Chính Sách Đổi Trả Minh Bạch";
    content = `
      <div class="mp-policy-block">
        <h4><i class="ph ph-arrows-clockwise" style="color:var(--brand-strong)"></i> Quy Trình Đổi Trả Trong 7 - 14 Ngày</h4>
        <p>SCANMS cam kết bảo vệ quyền lợi chính đáng của khách hàng với chính sách đổi trả minh bạch:</p>
        <ul>
          <li><strong>Thời hạn hỗ trợ:</strong> Đổi trả miễn phí trong vòng 07 ngày (và bảo hộ lên tới 14 ngày) kể từ khi nhận hàng thành công.</li>
          <li><strong>Điều kiện áp dụng:</strong> Sản phẩm có lỗi từ nhà sản xuất, hư hại trong quá trình vận chuyển, hoặc không đúng với mô tả/sản phẩm đã đặt.</li>
          <li><strong>Kênh tiếp nhận:</strong> Quý khách có thể yêu cầu hỗ trợ trực tiếp qua khung tư vấn trực tuyến 24/7 hoặc liên hệ hotline bưu cục giao nhận.</li>
        </ul>
      </div>
    `;
  }

  modalRoot.innerHTML = `
    <div class="modal-backdrop mp-modal-backdrop" data-close-policy-modal>
      <div class="mp-policy-modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <div class="mp-modal-header">
          <div class="mp-modal-header-text">
            <h2 class="mp-modal-title">${title}</h2>
            <p class="mp-modal-subtitle">Cam kết dịch vụ và quyền lợi khách hàng tại sàn SCANMS</p>
          </div>
          <button type="button" class="mp-modal-close-btn" data-close-policy-modal aria-label="Đóng">
            <i class="ph ph-x"></i>
          </button>
        </div>

        <div class="mp-policy-body">
          ${content}
        </div>

        <div class="mp-policy-footer">
          <button type="button" class="mp-modal-btn-submit" data-close-policy-modal style="width:100%">
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => {
    modalRoot.innerHTML = "";
    document.removeEventListener("keydown", escHandler);
    triggerEl?.focus();
  };

  const escHandler = (e) => {
    if (e.key === "Escape") closeModal();
  };
  document.addEventListener("keydown", escHandler);

  modalRoot.querySelectorAll("[data-close-policy-modal]").forEach(b => {
    b.addEventListener("click", closeModal);
  });
}

// CREATOR PROFILE MODAL ("Xem hồ sơ")
function openCreatorProfileModal(creator, { toast, onSelectCreator, onFilterProducts, openVideoModal, openCheckoutModal }) {
  const modalRoot = document.querySelector("#modal-root");
  const creatorProducts = marketplaceProducts.filter(p => p.kol?.name === creator.name);
  const creatorVideos = marketplaceVideos.filter(v => v.kol === creator.name);

  modalRoot.innerHTML = `
    <div class="modal-backdrop mp-modal-backdrop" data-close-profile-modal>
      <div class="mp-creator-profile-dialog" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <!-- Header -->
        <div class="mp-profile-head">
          <div class="mp-profile-user-row">
            <img src="${creator.avatarImg}" alt="${escapeHtml(creator.name)}" class="mp-profile-avatar" />
            <div class="mp-profile-user-info">
              <div class="mp-profile-name-line">
                <h2 class="mp-profile-name">${escapeHtml(creator.name)}</h2>
                <i class="ph-fill ph-check-circle mp-check-icon" title="Creator đối tác chính thức"></i>
                <span class="mp-creator-tier-tag">${creator.tier}</span>
              </div>
              <p class="mp-profile-niche">${escapeHtml(creator.niche)}</p>
              <div class="mp-profile-social-line">
                <span><i class="ph ${creator.platformIcon}"></i> ${escapeHtml(creator.platform)}: <strong>${escapeHtml(creator.handle)}</strong></span>
                <span class="mp-dot">•</span>
                <span>⭐ ${creator.rating} đánh giá</span>
              </div>
            </div>
          </div>
          <button type="button" class="mp-modal-close-btn" data-close-profile-modal aria-label="Đóng">
            <i class="ph ph-x"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="mp-profile-body">
          <!-- Bio -->
          <div class="mp-profile-bio-box">
            <h4><i class="ph ph-info"></i> Giới thiệu chuyên môn</h4>
            <p>${escapeHtml(creator.bio)}</p>
          </div>

          <!-- Voucher card -->
          <div class="mp-profile-voucher-card">
            <div class="mp-profile-voucher-head">
              <div>
                <span class="mp-profile-voucher-badge">ƯU ĐÃI ĐỘC QUYỀN</span>
                <h3 class="mp-profile-voucher-title">Mã: <span class="mono">${creator.coupon}</span> (${creator.voucherInfo.discount})</h3>
              </div>
              <button type="button" class="mp-profile-copy-btn" data-copy-coupon="${creator.coupon}">
                <i class="ph ph-copy"></i> Sao chép mã
              </button>
            </div>
            <div class="mp-profile-voucher-details">
              <div><i class="ph ph-tag"></i> Mức giảm: <strong>${creator.voucherInfo.discount} (Tối đa ${creator.voucherInfo.maxDiscount})</strong></div>
              <div><i class="ph ph-receipt"></i> Đơn tối thiểu: <strong>${creator.voucherInfo.minOrder}</strong></div>
              <div><i class="ph ph-calendar-blank"></i> Hạn sử dụng: <strong>${creator.voucherInfo.expiry}</strong></div>
              <div><i class="ph ph-check-square-offset"></i> Áp dụng cho: <strong>${creator.voucherInfo.appliesTo}</strong></div>
            </div>
          </div>

          <!-- Recommended Products -->
          <div class="mp-profile-products-section">
            <div class="mp-profile-section-title">
              <h4><i class="ph ph-package"></i> Sản phẩm được ${escapeHtml(creator.name)} bảo chứng (${creatorProducts.length})</h4>
            </div>
            <div class="mp-profile-products-grid">
              ${creatorProducts.map(p => `
                <div class="mp-profile-product-item">
                  <img src="${p.image}" alt="${escapeHtml(p.name)}" class="mp-profile-prod-img" />
                  <div class="mp-profile-prod-info">
                    <strong class="mp-profile-prod-title">${escapeHtml(p.name)}</strong>
                    <div class="mp-profile-prod-price-line">
                      <span class="old">${money(p.origPrice || p.price)}</span>
                      <strong class="new">${money(p.kolDiscountPrice || Math.round(p.price * 0.9))}</strong>
                    </div>
                  </div>
                  <button type="button" class="mp-profile-prod-buy-btn" data-quick-buy="${p.id}" data-coupon="${creator.coupon}">
                    Mua ngay
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Video review if available -->
          ${creatorVideos.length ? `
            <div class="mp-profile-video-section">
              <div class="mp-profile-section-title">
                <h4><i class="ph ph-video"></i> Video review thực tế</h4>
              </div>
              <div class="mp-profile-videos-list">
                ${creatorVideos.map(v => `
                  <div class="mp-profile-video-row" data-play-video="${v.id}">
                    <img src="${v.thumbnail}" alt="${escapeHtml(v.title)}" class="mp-profile-video-thumb" />
                    <div class="mp-profile-video-info">
                      <strong>${escapeHtml(v.title)}</strong>
                      <small><i class="ph ph-eye"></i> ${v.views} lượt xem • ${v.duration}</small>
                    </div>
                    <button type="button" class="mp-profile-play-btn" title="Xem video"><i class="ph-fill ph-play"></i></button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Footer actions -->
        <div class="mp-profile-footer">
          <button type="button" class="btn secondary" data-close-profile-modal>Đóng</button>
          <button type="button" class="btn" id="mp-profile-apply-btn" style="background:#A06716;color:#fff">
            <i class="ph-fill ph-check"></i> Chọn ưu đãi của ${escapeHtml(creator.name)}
          </button>
        </div>
      </div>
    </div>
  `;

  // Close handlers
  const closeModal = () => {
    modalRoot.innerHTML = "";
    document.removeEventListener("keydown", escHandler);
  };
  const escHandler = (e) => {
    if (e.key === "Escape") closeModal();
  };
  document.addEventListener("keydown", escHandler);

  modalRoot.querySelectorAll("[data-close-profile-modal]").forEach(b => {
    b.addEventListener("click", closeModal);
  });

  modalRoot.querySelector("#mp-profile-apply-btn")?.addEventListener("click", () => {
    onSelectCreator(creator);
    closeModal();
  });

  // Quick buy inside profile
  modalRoot.querySelectorAll("[data-quick-buy]").forEach(btn => {
    btn.addEventListener("click", () => {
      const prodId = btn.dataset.quickBuy;
      const coupon = btn.dataset.coupon || creator.coupon;
      const prod = marketplaceProducts.find(p => p.id === prodId) || marketplaceProducts[0];
      closeModal();
      openCheckoutModal(prod, coupon);
    });
  });

  // Play video inside profile
  modalRoot.querySelectorAll("[data-play-video]").forEach(btn => {
    btn.addEventListener("click", () => {
      const vidId = btn.dataset.playVideo;
      const vid = marketplaceVideos.find(v => v.id === vidId);
      if (vid) {
        closeModal();
        openVideoModal(vid);
      }
    });
  });

  // Copy inside profile
  modalRoot.querySelectorAll("[data-copy-coupon]").forEach(btn => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.copyCoupon;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
          toast(`Đã sao chép mã ưu đãi ${code}!`);
        }).catch(() => {
          toast(`Mã: ${code}`);
        });
      }
      btn.innerHTML = `<i class="ph ph-check"></i> Đã sao chép`;
      setTimeout(() => {
        btn.innerHTML = `<i class="ph ph-copy"></i> Sao chép mã`;
      }, 1800);
    });
  });
}

// 14. Guest Checkout Modal Helper (Phân biệt rõ Đã chọn ưu đãi và Đã áp dụng giảm giá)
async function openGuestCheckoutModal(product, defaultCoupon, { toast, renderCurrentPage }) {
  let couponDraft = defaultCoupon ? defaultCoupon.trim().toUpperCase() : "";
  let appliedCoupon = "";
  let backendProduct = null;
  try {
    backendProduct = await resolveBackendProduct(product);
  } catch (error) {
    toast(error?.message || "Không thể kết nối hệ thống đặt hàng.");
    return;
  }
  if (!backendProduct) {
    toast("Sản phẩm này chưa có dữ liệu thật trong hệ thống nên chưa thể đặt hàng.");
    return;
  }
  let basePrice = Number(backendProduct.price);
  const idempotencyKey = createIdempotencyKey();

  // Kiểm tra điều kiện voucher
  const checkVoucherEligibility = (code) => {
    if (!code) return { eligible: false, pct: 0, msg: "Chưa áp dụng mã ưu đãi.", amount: 0 };
    if (code === "SCANMSNEW") {
      const minVal = 200000;
      if (basePrice < minVal) {
        return {
          eligible: false,
          pct: 0,
          amount: 0,
          msg: `Đơn hàng (${money(basePrice)}) chưa đạt mức tối thiểu 200.000 ₫ của mã SCANMSNEW.`
        };
      }
      const pct = 15;
      const maxVal = 75000;
      const computedDiscount = Math.min(Math.round(basePrice * (pct / 100)), maxVal);
      return {
        eligible: true,
        pct,
        amount: computedDiscount,
        kolName: "SCANMS Toàn Sàn",
        msg: `Đã áp dụng Voucher Chào Mừng Toàn Sàn -${pct}% (${money(computedDiscount)})!`
      };
    }
    const matchedKol = marketplaceKOLs.find(k => k.coupon === code);
    if (!matchedKol) {
      return { eligible: false, pct: 0, msg: `Mã ${code} không tồn tại trên hệ thống.`, amount: 0 };
    }
    const minVal = parseInt((matchedKol.voucherInfo?.minOrder || "0").replace(/\D/g, "")) || 0;
    if (basePrice < minVal) {
      return {
        eligible: false,
        pct: 0,
        amount: 0,
        msg: `Đơn hàng (${money(basePrice)}) chưa đạt mức tối thiểu ${matchedKol.voucherInfo.minOrder} của mã ${code}.`
      };
    }
    const pct = matchedKol.voucherInfo?.discountPct || 10;
    const maxVal = parseInt((matchedKol.voucherInfo?.maxDiscount || "999999").replace(/\D/g, "")) || 50000;
    const computedDiscount = Math.min(Math.round(basePrice * (pct / 100)), maxVal);
    return {
      eligible: true,
      pct,
      amount: computedDiscount,
      kolName: matchedKol.name,
      msg: `Đã áp dụng giảm giá -${pct}% (${money(computedDiscount)}) từ Creator ${matchedKol.name}!`
    };
  };

  let voucherStatus = {
    eligible: false,
    amount: 0,
    msg: couponDraft ? "Mã gợi ý chưa được xác thực. Nhấn Áp dụng để kiểm tra." : "Chưa áp dụng mã ưu đãi."
  };
  let discountAmount = 0;
  let finalPrice = basePrice - discountAmount;

  const renderModalContent = () => `
    <div class="modal-backdrop mp-modal-backdrop" data-close-modal>
      <div class="mp-checkout-modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <!-- 1. Header cố định ở trên -->
        <div class="mp-modal-header">
          <div class="mp-modal-header-text">
            <div class="mp-modal-badges">
              <span class="mp-badge-lightning"><i class="ph-fill ph-lightning"></i> MUA KHÔNG CẦN TÀI KHOẢN</span>
              <span class="mp-badge-escrow"><i class="ph-fill ph-shield-check"></i> Đổi Trả An Toàn 14 Ngày</span>
            </div>
            <h2 class="mp-modal-title">Đặt Hàng Nhanh & Nhận Ưu Đãi</h2>
            <p class="mp-modal-subtitle">Không cần đăng ký tài khoản • Nhận hàng kiểm tra mới thanh toán COD</p>
          </div>
          <button type="button" class="mp-modal-close-btn" data-close-modal aria-label="Đóng">
            <i class="ph ph-x"></i>
          </button>
        </div>

        <!-- 2. Form bao trùm body và footer -->
        <form id="mp-guest-checkout-form" class="mp-modal-form-wrapper">
          <div class="mp-modal-body">
            <!-- Product snippet -->
            <div class="mp-modal-product-card">
              <img src="${product.image}" alt="${escapeHtml(product.name)}" class="mp-modal-product-img" />
              <div class="mp-modal-product-info">
                <strong class="mp-modal-product-title">${escapeHtml(product.name)}</strong>
                <span class="mp-modal-product-supplier">Cung cấp bởi: <strong>${escapeHtml(product.brand)}</strong></span>
              </div>
              <div class="mp-modal-product-price">
                <strong>${money(basePrice)}</strong>
              </div>
            </div>

            <!-- Form fields -->
            <div class="mp-form-group">
              <label for="mp-buyer-name">Họ và tên người nhận <span class="req">*</span></label>
              <input class="mp-form-input" id="mp-buyer-name" name="customerName" autocomplete="name" placeholder="VD: Nguyễn Văn A" required />
            </div>

            <div class="mp-form-group">
              <label for="mp-buyer-phone">Số điện thoại nhận hàng <span class="req">*</span></label>
              <input class="mp-form-input" id="mp-buyer-phone" name="customerPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="VD: 0912 345 678" required />
            </div>

            <div class="mp-form-group">
              <label for="mp-buyer-address">Địa chỉ giao hàng chi tiết <span class="req">*</span></label>
              <input class="mp-form-input" id="mp-buyer-address" name="shippingAddress" autocomplete="street-address" placeholder="Số nhà, tên đường, phường/xã, quận/huyện" required />
            </div>

            <!-- Coupon section -->
            <div class="mp-form-group">
              <label for="mp-coupon-input">Mã giảm giá Creator</label>
              <div class="mp-coupon-input-wrap">
                <input class="mp-form-input mp-coupon-input" id="mp-coupon-input" placeholder="Nhập mã ưu đãi..." value="${couponDraft}" />
                <button type="button" class="mp-coupon-apply-btn" id="mp-apply-coupon-btn">Áp dụng</button>
              </div>

              ${voucherStatus.eligible ? `
                <div class="mp-coupon-success-msg">
                  <i class="ph-fill ph-check-circle"></i> ${voucherStatus.msg}
                </div>
              ` : (appliedCoupon ? `
                <div class="mp-coupon-warn-msg" style="color:#b45309;font-size:12px;margin-top:6px;display:flex;align-items:center;gap:6px">
                  <i class="ph-fill ph-warning"></i> ${voucherStatus.msg}
                </div>
              ` : `
                <div class="mp-coupon-hint-msg">
                  <i class="ph-fill ph-info"></i> Nhập mã Creator để nhận giảm giá từ 10-12% theo chính sách.
                </div>
              `)}
            </div>

            <!-- Safe Shopping Notice -->
            <div class="mp-escrow-box">
              <i class="ph-fill ph-shield-check"></i>
              <div>
                <strong>Cơ chế bảo hộ mua sắm an toàn:</strong> Quý khách được quyền kiểm tra hàng khi nhận. Tiền thanh toán COD được đảm bảo an toàn trong 14 ngày để quý khách yên tâm đổi trả minh bạch.
              </div>
            </div>

            <!-- Order Summary -->
            <div class="mp-order-summary">
              <div class="mp-summary-row"><span>Tạm tính</span><strong>${money(basePrice)}</strong></div>
              ${voucherStatus.eligible ? `<div class="mp-summary-row discount"><span>Ưu đãi Creator (${appliedCoupon})</span><strong>-${money(discountAmount)}</strong></div>` : ''}
              <div class="mp-summary-row"><span>Phí vận chuyển bưu cục</span><strong class="free">Miễn phí (0 ₫)</strong></div>
              <div class="mp-summary-total">
                <span>Tổng thanh toán COD</span>
                <strong class="total-amount">${money(finalPrice)}</strong>
              </div>
            </div>
          </div>

          <!-- 4. Footer cố định ở dưới -->
          <div class="mp-modal-footer">
            <div class="mp-modal-footer-summary">
              <span class="label">Tổng thu COD:</span>
              <span class="value">${money(finalPrice)}</span>
            </div>
            <div class="mp-modal-footer-btns">
              <button type="button" class="mp-modal-btn-cancel" data-close-modal>Hủy bỏ</button>
              <button type="submit" class="mp-modal-btn-submit" id="mp-submit-order-btn">
                <i class="ph-fill ph-check-circle"></i> Xác nhận đặt hàng
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  const modalRoot = document.querySelector("#modal-root");
  modalRoot.innerHTML = renderModalContent();

  const bindInner = () => {
    modalRoot.querySelectorAll("[data-close-modal]").forEach(b => {
      b.addEventListener("click", (e) => {
        if (b.classList.contains("modal-backdrop") && e.target !== b) return;
        modalRoot.innerHTML = "";
      });
    });

    const couponInput = modalRoot.querySelector("#mp-coupon-input");
    const applyBtn = modalRoot.querySelector("#mp-apply-coupon-btn");

    applyBtn?.addEventListener("click", async () => {
      const code = couponInput?.value.trim().toUpperCase();
      const preservedName = modalRoot.querySelector("#mp-buyer-name")?.value || "";
      const preservedPhone = modalRoot.querySelector("#mp-buyer-phone")?.value || "";
      const preservedAddress = modalRoot.querySelector("#mp-buyer-address")?.value || "";
      if (!code) {
        toast("Vui lòng nhập mã ưu đãi!");
        return;
      }
      couponDraft = code;
      applyBtn.disabled = true;
      applyBtn.textContent = "Đang kiểm tra...";
      try {
        const response = await fetch("/api/coupons/validate", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            code,
            storeId: backendProduct.store?.id,
            customerPhone: modalRoot.querySelector("#mp-buyer-phone")?.value.trim() || undefined,
            items: [{ productId: backendProduct.id, quantity: 1 }]
          })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.message || "Mã giảm giá không hợp lệ.");
        const result = body?.data || body;
        appliedCoupon = code;
        discountAmount = Number(result.discountAmount ?? result.appliedDiscountAmount ?? 0);
        voucherStatus = {
          eligible: true,
          amount: discountAmount,
          msg: `Đã áp dụng ${code}, giảm ${money(discountAmount)}.`
        };
        finalPrice = basePrice - discountAmount;
        toast(voucherStatus.msg);
      } catch (error) {
        appliedCoupon = "";
        discountAmount = 0;
        finalPrice = basePrice;
        voucherStatus = { eligible: false, amount: 0, msg: error?.message || "Mã giảm giá không hợp lệ." };
        toast(voucherStatus.msg);
      }
      modalRoot.innerHTML = renderModalContent();
      bindInner();
      modalRoot.querySelector("#mp-buyer-name").value = preservedName;
      modalRoot.querySelector("#mp-buyer-phone").value = preservedPhone;
      modalRoot.querySelector("#mp-buyer-address").value = preservedAddress;
    });

    const form = modalRoot.querySelector("#mp-guest-checkout-form");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const buyerName = modalRoot.querySelector("#mp-buyer-name")?.value.trim();
      const buyerPhone = modalRoot.querySelector("#mp-buyer-phone")?.value.trim();
      const shippingAddress = modalRoot.querySelector("#mp-buyer-address")?.value.trim();
      const submitButton = modalRoot.querySelector("#mp-submit-order-btn");

      if (!buyerName || !buyerPhone || !shippingAddress) {
        toast("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.");
        return;
      }

      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Đang tạo đơn...';

      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            storeId: backendProduct.store?.id,
            customerName: buyerName,
            customerPhone: buyerPhone,
            shippingAddress,
            paymentMethod: "COD",
            couponCode: appliedCoupon || undefined,
            idempotencyKey,
            items: [{ productId: backendProduct.id, quantity: 1 }]
          })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
          throw new Error(message || "Không thể tạo đơn hàng.");
        }
        const result = body?.data || body;
        const newOrder = {
          code: result.publicOrderCode,
          cancellationToken: result.cancellationToken,
          phone: buyerPhone,
          name: buyerName,
          product: backendProduct.title || product.name,
          amount: Number(result.finalAmount),
          coupon: appliedCoupon || "Không áp dụng",
          status: result.status || "PENDING"
        };

        state.cartCount = 0;
        modalRoot.innerHTML = "";
        openOrderSuccessModal(newOrder, { toast });
      } catch (error) {
        toast(error?.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="ph-fill ph-check-circle"></i> Xác nhận đặt hàng';
      }
    });
  };

  bindInner();
}

function openOrderSuccessModal(order, { toast }) {
  const modalRoot = document.querySelector("#modal-root");
  modalRoot.innerHTML = `
    <div class="modal-backdrop mp-modal-backdrop" data-close-modal>
      <div class="mp-checkout-modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()" style="position:relative;max-width:480px;text-align:center;padding:24px 20px;border-radius:20px">
        <button type="button" data-close-modal aria-label="Đóng thông báo đặt hàng" title="Đóng" style="position:absolute;top:14px;right:14px;width:36px;height:36px;border:1px solid #EADCC7;border-radius:50%;background:#fff;color:#715842;display:grid;place-items:center;font-size:20px;cursor:pointer">
          <i class="ph ph-x"></i>
        </button>
        <div style="width:64px;height:64px;border-radius:50%;background:#dcfce7;color:#15803d;display:grid;place-items:center;font-size:32px;margin:0 auto 16px">
          <i class="ph-fill ph-check-circle"></i>
        </div>
        <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#261A0E">Đặt hàng thành công!</h2>
        <p style="font-size:13.5px;color:#715842;line-height:1.5;margin:0 0 20px">
          Cảm ơn quý khách <strong>${escapeHtml(order.name)}</strong>. Đơn hàng <strong>${escapeHtml(order.code)}</strong> đã được ghi nhận trên hệ thống.
        </p>

        <div style="background:#FDFBF7;border:1.5px solid #EADCC7;border-radius:14px;padding:16px;text-align:left;font-size:13px;line-height:1.6;margin-bottom:20px">
          <div>Trạng thái: <strong style="color:#261A0E">${escapeHtml(order.status)}</strong></div>
          <div>Tổng thanh toán COD: <strong style="color:#9E6413;font-size:15px">${money(order.amount)}</strong></div>
          <div>Mã ưu đãi: <strong>${order.coupon}</strong></div>
          ${order.cancellationToken ? `<div style="margin-top:8px">Mã bảo mật hủy đơn: <strong class="mono" style="overflow-wrap:anywhere">${escapeHtml(order.cancellationToken)}</strong></div>` : ''}
          <div style="margin-top:10px;padding-top:10px;border-top:1px dashed #DECCA8;color:#7A561B;font-size:12px;line-height:1.5">
            <i class="ph-fill ph-shield-check"></i> Hãy lưu mã đơn và mã bảo mật để tra cứu hoặc hủy đơn. SĐT: <strong>${maskPhone(order.phone)}</strong>.
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:center">
          <button class="mp-modal-btn-submit" data-close-modal style="padding:10px 28px;font-size:14px">
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll("[data-close-modal]").forEach(b => {
    b.addEventListener("click", (e) => {
      if (b.classList.contains("modal-backdrop") && e.target !== b) return;
      modalRoot.innerHTML = "";
    });
  });

  toast(`Đặt hàng thành công! Mã đơn: ${order.code}`);
}

function openVideoPlayerModal(video, { toast, go }) {
  const triggerEl = document.activeElement;
  const modalRoot = document.querySelector("#modal-root");
  modalRoot.innerHTML = `
    <div class="modal-backdrop mp-modal-backdrop" data-close-video-modal>
      <section class="modal" role="dialog" aria-modal="true" style="max-width:440px;padding:0;overflow:hidden;border-radius:20px;background:#000" onclick="event.stopPropagation()">
        <div style="position:relative;aspect-ratio:9/14;background:#1a1a1a">
          <video id="mp-active-video" src="./assets/sample-video.mp4" controls playsinline muted style="width:100%;height:100%;object-fit:cover"></video>
          <button type="button" class="icon-btn small" data-close-video-modal style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:32px;height:32px" aria-label="Đóng video">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div style="padding:16px;background:#ffffff">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span class="badge" style="background:#fee2e2;color:#991b1b;font-size:11px;font-weight:750">
              <i class="ph ph-tiktok-logo"></i> ${escapeHtml(video.kol)}
            </span>
            <span class="badge success" style="font-size:11px">Mã: ${video.coupon} (-10%)</span>
          </div>
          <h3 style="margin:0 0 12px;font-size:14.5px;line-height:1.4">${escapeHtml(video.title)}</h3>
          <div style="display:flex;gap:10px">
            <button type="button" class="btn secondary" data-close-video-modal style="flex:1">Đóng clip</button>
            <button type="button" class="btn" id="mp-buy-video-inner" style="flex:1.5;background:#A06716;color:#fff">
              <i class="ph ph-lightning"></i> Mua theo gợi ý
            </button>
          </div>
        </div>
      </section>
    </div>
  `;

  const closeVideo = () => {
    const v = document.getElementById("mp-active-video");
    if (v) {
      v.pause();
      v.src = "";
    }
    modalRoot.innerHTML = "";
    document.removeEventListener("keydown", escVideoHandler);
    triggerEl?.focus();
  };

  const escVideoHandler = (e) => {
    if (e.key === "Escape") closeVideo();
  };
  document.addEventListener("keydown", escVideoHandler);

  modalRoot.querySelectorAll("[data-close-video-modal]").forEach(b => {
    b.addEventListener("click", closeVideo);
  });

  modalRoot.querySelector("#mp-buy-video-inner")?.addEventListener("click", () => {
    closeVideo();
    const prod = marketplaceProducts.find(p => p.id === video.productId) || marketplaceProducts[0];
    openGuestCheckoutModal(prod, video.coupon, { toast, renderCurrentPage: () => {} });
  });
}
