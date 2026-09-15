// ==========================================================================
// SCANMS STOREFRONT - Module Trang Mua Hàng Qua Link Tiếp Thị KOL/CTV (FR-15, FR-16)
// ==========================================================================

const defaultProductImage = "./assets/serum-hero-optimized.jpg";
const sampleVideoPath = "./assets/sample-video.mp4";

// Danh mục sản phẩm demo
const storefrontProducts = {
  P01: {
    id: "P01",
    name: "Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Sora Skin",
    brand: "Sora Skin Official",
    rating: 4.9,
    reviewCount: 128,
    soldCount: "1.4k",
    images: [
      { src: "./assets/serum-hero-optimized.jpg", label: "Chai Serum chính diện" },
      { src: "./assets/toner-bha-product.jpg", label: "Kết cấu serum mỏng nhẹ" },
      { src: "./assets/cica-mask-product.jpg", label: "Bảng thành phần 15% C" },
      { src: "./assets/cleanser-product.jpg", label: "Hộp & Tem niêm phong" }
    ],
    variants: [
      { id: "30ml", label: "Dung tích 30ml", sub: "Tiêu chuẩn", price: 459000, origPrice: 520000 },
      { id: "50ml", label: "Dung tích 50ml", sub: "Tiết kiệm +40%", price: 689000, origPrice: 820000 }
    ],
    stockCount: 48,
    details: [
      "Nồng độ Vitamin C tinh khiết 15% (L-Ascorbic Acid) kết hợp 2% Ferulic Acid ổn định hóa cao.",
      "Bổ sung Sodium Hyaluronate và Panthenol B5 giúp cấp ẩm tức thì, làm dịu da không gây châm chích.",
      "Công thức không cồn khô, không hương liệu nhân tạo, phù hợp cho da dầu mụn và da không đều màu."
    ],
    usageGuide: [
      "Bước 1: Sử dụng vào buổi sáng sau bước Toner / Nước hoa hồng và trước kem dưỡng.",
      "Bước 2: Nhỏ 3–4 giọt ra lòng bàn tay, vỗ nhẹ đều khắp mặt và cổ cho tinh chất thẩm thấu.",
      "Bước 3: Bắt buộc thoa kem chống nắng quang phổ rộng SPF50+ để bảo vệ tối ưu hiệu quả làm sáng."
    ],
    shippingPolicy: [
      "Miễn phí vận chuyển toàn quốc cho đơn hàng từ 399.000 ₫ (Giao hỏa tốc 24h tại TP.HCM & Hà Nội qua GHN/GHTK).",
      "Hỗ trợ đổi trả miễn phí trong 14 ngày nếu sản phẩm lỗi từ nhà sản xuất hoặc còn nguyên seal bao bì.",
      "Cho phép kiểm tra hàng trước khi thanh toán (COD đồng kiểm)."
    ]
  }
};

// Danh sách KOL/CTV đối tác demo
const affiliateKOLs = {
  R9K2N7: {
    refCode: "R9K2N7",
    name: "Trần Văn Nhật",
    tier: "KOL hạng Vàng",
    channel: "@nhatbeauty • TikTok (185K followers)",
    avatar: "N",
    defaultCoupon: "NHATXINH10",
    discountPct: 10,
    maxDiscount: 50000,
    minSpend: 299000,
    quote: "“Sau 3 tuần dùng thử em serum này vào mỗi sáng, Nhật thấy các vết thâm mụn mờ rõ rệt mà không hề bị châm chích hay đổ dầu bí bách. Giá hợp lý lại còn được giảm thêm 10% độc quyền cho các bạn của Nhật nữa nhé!”"
  },
  MAIANH12: {
    refCode: "MAIANH12",
    name: "Lê Mai Anh",
    tier: "KOL hạng Vàng",
    channel: "@maianh.beauty • TikTok (140K followers)",
    avatar: "M",
    defaultCoupon: "MAIANH12",
    discountPct: 10,
    maxDiscount: 50000,
    minSpend: 299000,
    quote: "“Serum đỉnh của chóp cho da thâm mụn sau treatment. Mình khuyên chân thành các bạn nên thử ít nhất 1 chai 30ml!”"
  },
  LINHSKIN: {
    refCode: "LINHSKIN",
    name: "Phạm Khánh Linh",
    tier: "KOL hạng Bạc",
    channel: "@linhskincare • Instagram (45K followers)",
    avatar: "L",
    defaultCoupon: "LINHSKIN",
    discountPct: 10,
    maxDiscount: 45000,
    minSpend: 250000,
    quote: "“Sản phẩm làm dịu da nhanh, texture lỏng thấm ngay không dính!”"
  },
  TUANREVIEW: {
    refCode: "TUANREVIEW",
    name: "Nguyễn Đình Tuấn",
    tier: "KOL hạng Bạc",
    channel: "@tuanreview • YouTube (80K subs)",
    avatar: "T",
    defaultCoupon: "TUANREVIEW",
    discountPct: 10,
    maxDiscount: 50000,
    minSpend: 250000,
    quote: "“Bình dân, thành phần chuẩn, hiệu quả cao!”"
  }
};

function getKOLByCoupon(code) {
  if (!code) return null;
  const clean = String(code).trim().toUpperCase();
  return Object.values(affiliateKOLs).find(k => k.defaultCoupon.toUpperCase() === clean) || null;
}

// Dữ liệu đánh giá khách hàng (Được đồng bộ 100% với điểm trung bình và bộ lọc sao)
const customerReviewsData = [
  {
    id: "rev-01",
    name: "Hồng Nhung",
    rating: 5,
    date: "06/09/2026",
    variant: "30ml",
    comment: "Xem clip review của Nhật xong bấm link mua luôn. Giao hàng GHTK 1 ngày là tới nơi, serum thấm cực nhanh, sáng dậy da căng mịn không đổ dầu. Đóng gói rất cẩn thận 2 lớp bóng khí. Rất hài lòng!",
    verified: true,
    photos: ["./assets/serum-hero-optimized.jpg", "./assets/toner-bha-product.jpg"]
  },
  {
    id: "rev-02",
    name: "Thu Thảo",
    rating: 5,
    date: "04/09/2026",
    variant: "50ml",
    comment: "Được áp mã NHATXINH10 giảm được gần 50k, hời dã man. Da nhạy cảm như mình dùng không hề rát hay đỏ da. Mình theo dõi kênh của Nhật lâu rồi, thấy review chân thực nên quyết định đặt chai 50ml dưỡng sau mụn. Sau 3 tuần thì các nốt thâm mờ đi trông thấy, da đều màu và mịn màng hơn hẳn. Rất khuyên các bạn nên thử!",
    verified: true,
    photos: ["./assets/cica-mask-product.jpg"]
  },
  {
    id: "rev-03",
    name: "Minh Quân",
    rating: 5,
    date: "01/09/2026",
    variant: "30ml",
    comment: "Đóng gói 2 lớp bong bóng chống sốc rất cẩn thận, có tem phụ tiếng Việt và mã vạch check auth chuẩn chỉ.",
    verified: true,
    photos: []
  },
  {
    id: "rev-04",
    name: "Phương Uyên",
    rating: 4,
    date: "28/08/2026",
    variant: "30ml",
    comment: "Serum tốt, mùi thơm cam nhẹ dễ chịu, thấm nhanh không nhờn dính. Mình trừ 1 sao vì bưu tá giao lúc trưa nắng hơi muộn một chút.",
    verified: true,
    photos: []
  },
  {
    id: "rev-05",
    name: "Khánh Linh",
    rating: 5,
    date: "25/08/2026",
    variant: "50ml",
    comment: "Dung tích 50ml xài rất dôi, dùng được hơn 2 tháng. Khuyên các bạn nên lấy chai 50ml tiết kiệm hơn nhiều nha. Da sáng đều màu rõ rệt sau 4 tuần.",
    verified: true,
    photos: []
  },
  {
    id: "rev-06",
    name: "Bảo Trâm",
    rating: 5,
    date: "20/08/2026",
    variant: "30ml",
    comment: "Chất serum lỏng nhẹ thấm cực nhanh. Nhớ thoa kem chống nắng kỹ vào ban ngày để bảo vệ tối ưu hiệu quả làm sáng nha các nàng.",
    verified: false,
    photos: []
  },
  {
    id: "rev-07",
    name: "Hoàng Yến",
    rating: 5,
    date: "15/08/2026",
    variant: "30ml",
    comment: "Lần đầu mua mỹ phẩm qua link tiếp thị của KOL mà ưng ý đến vậy. Sản phẩm chính hãng 100%, có tin nhắn bảo hành điện tử rõ ràng.",
    verified: true,
    photos: []
  },
  {
    id: "rev-08",
    name: "Anh Khoa",
    rating: 5,
    date: "10/08/2026",
    variant: "50ml",
    comment: "Mua tặng bạn gái dùng thử dịp 20/10, bạn khen serum mờ thâm mụn rất ổn, da sáng và căng bóng hơn nhiều. Không hề bị châm chích hay nổi mụn li ti. Đóng gói hộp giấy bảo vệ môi trường rất đẹp và sang trọng. Bạn mình dùng hợp nên chuẩn bị đặt thêm chai thứ 2 để duy trì đều đặn mỗi sáng tối.",
    verified: true,
    photos: []
  },
  {
    id: "rev-09",
    name: "Thanh Trúc",
    rating: 5,
    date: "05/08/2026",
    variant: "30ml",
    comment: "Chất serum trong suốt hơi ngả vàng nhẹ chuẩn C tươi tinh khiết. Mình để ngăn mát tủ lạnh thoa buổi sáng phê mát rượi!",
    verified: true,
    photos: []
  },
  {
    id: "rev-10",
    name: "Ngọc Mai",
    rating: 4,
    date: "01/08/2026",
    variant: "30ml",
    comment: "Serum lành tính, da mịn màng hơn. Thiết kế vòi bóp nhỏ giọt tiện lợi, kiểm soát lượng dùng dễ dàng.",
    verified: true,
    photos: []
  },
  {
    id: "rev-11",
    name: "Quốc Hưng",
    rating: 5,
    date: "26/07/2026",
    variant: "50ml",
    comment: "Mua lần thứ 2 tại gian hàng Sora Skin. Dịch vụ chăm sóc khách hàng nhiệt tình, giao nhanh đóng gói cẩn thận.",
    verified: true,
    photos: []
  },
  {
    id: "rev-12",
    name: "Cẩm Tú",
    rating: 5,
    date: "20/07/2026",
    variant: "30ml",
    comment: "Serum lành tính không kích ứng, kết cấu nhẹ thấm tức thì. Rất thích hợp dùng lót trước kem chống nắng mỗi sáng.",
    verified: true,
    photos: []
  },
  {
    id: "rev-13",
    name: "Hải Đăng",
    rating: 5,
    date: "14/07/2026",
    variant: "30ml",
    comment: "Hàng chuẩn chính hãng tem phụ đẩy đủ, check QR ra thông tin phân phối ngay. Cho shop 5 sao chất lượng!",
    verified: true,
    photos: []
  },
  {
    id: "rev-14",
    name: "Kim Ngân",
    rating: 5,
    date: "08/07/2026",
    variant: "50ml",
    comment: "Thấy Nhật chia sẻ bí quyết chăm sóc da nên tò mò dùng thử, không ngờ hiệu quả vượt mong đợi. Da đều màu hẳn luôn.",
    verified: true,
    photos: []
  }
];

// State quản lý cục bộ của Storefront
export const storefrontState = {
  currentProductId: "P01",
  currentRefCode: "R9K2N7",
  activePhotoIdx: 0,
  activeVariantId: "30ml",
  quantity: 1,
  isWishlistSaved: false,
  appliedCoupon: "NHATXINH10",
  couponInput: "",
  couponErrorMsg: "",
  cart: [
    {
      productId: "P01",
      variantId: "30ml",
      qty: 1
    }
  ],
  isCartDrawerOpen: false,
  isCheckoutModalOpen: false,
  isLightboxOpen: false,
  lightboxPhotoSrc: null,
  isAskShopOpen: false,
  isOutOfStockDemo: false,
  
  // Accordion 3 mục: Mặc định ĐÓNG cả 3 mục theo yêu cầu
  accordions: {
    details: false,
    usage: false,
    shipping: false
  },
  showFullIngredients: false,

  // Đánh giá sản phẩm
  reviewStarFilter: "all", // "all", "5", "4", "3", "2", "1"
  reviewSort: "newest", // "newest", "highest", "lowest"
  reviewVisibleCount: 3, // Mặc định hiển thị 3 đánh giá
  expandedCommentIds: {}, // Track các comment bấm "Xem thêm"
  isReviewsLoading: false,
  reviewsError: false,
  isDemoEmpty: false,

  // Form khách mua hàng
  checkoutForm: {
    name: "Nguyễn Hải Yến",
    phone: "0903218456",
    city: "TP. Hồ Chí Minh",
    district: "Quận Gò Vấp",
    address: "12 Nguyễn Văn Bảo, Phường 4",
    notes: "Giao giờ hành chính, gọi trước khi giao",
    paymentMethod: "cod" // 'cod' | 'vietqr'
  },
  isSubmittingOrder: false,
  latestPlacedOrder: null
};

// Helper format tiền tệ VNĐ
function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("vi-VN") + " ₫";
}

// Helper escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Hàm render toàn bộ màn hình Storefront
export function storefrontScreen() {
  const prod = storefrontProducts[storefrontState.currentProductId] || storefrontProducts.P01;
  const kol = affiliateKOLs[storefrontState.currentRefCode] || affiliateKOLs.R9K2N7;
  const currentVariant = prod.variants.find(v => v.id === storefrontState.activeVariantId) || prod.variants[0];
  const activeImg = prod.images[storefrontState.activePhotoIdx] || prod.images[0];

  // Tính toán giá và coupon (CHỈ GIẢM GIÁ KHI CÓ MÃ KOL HỢP LỆ)
  const unitPrice = currentVariant.price;
  const subtotal = unitPrice * storefrontState.quantity;
  let discountAmount = 0;
  const activeCouponKOL = getKOLByCoupon(storefrontState.appliedCoupon);
  if (activeCouponKOL && subtotal >= activeCouponKOL.minSpend) {
    discountAmount = Math.min(subtotal * (activeCouponKOL.discountPct / 100), activeCouponKOL.maxDiscount);
  }
  const finalCalculatedPrice = Math.max(0, subtotal - discountAmount);
  const unitFinalPrice = Math.round(finalCalculatedPrice / storefrontState.quantity);

  // Đồng bộ số liệu đánh giá thực tế từ dữ liệu
  const activeReviews = storefrontState.isDemoEmpty ? [] : customerReviewsData;
  const totalReviews = activeReviews.length;
  const avgRating = totalReviews > 0 ? (activeReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) : "0.0";
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  activeReviews.forEach(r => {
    if (starCounts[r.rating] !== undefined) starCounts[r.rating]++;
  });

  // Đồng bộ lại thông tin sản phẩm ở Hero
  prod.reviewCount = totalReviews;
  prod.rating = Number(avgRating);

  // Lọc và sắp xếp đánh giá theo dropdown
  let filteredReviews = [...activeReviews];
  if (storefrontState.reviewStarFilter !== "all") {
    const starNum = Number(storefrontState.reviewStarFilter);
    filteredReviews = filteredReviews.filter(r => r.rating === starNum);
  }

  if (storefrontState.reviewSort === "newest") {
    filteredReviews.sort((a, b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-')));
  } else if (storefrontState.reviewSort === "highest") {
    filteredReviews.sort((a, b) => b.rating - a.rating);
  } else if (storefrontState.reviewSort === "lowest") {
    filteredReviews.sort((a, b) => a.rating - b.rating);
  }

  const visibleReviews = filteredReviews.slice(0, storefrontState.reviewVisibleCount);

  // Số lượng món trong giỏ
  const totalCartCount = storefrontState.cart.reduce((acc, item) => acc + item.qty, 0);

  // FR-15: chỉ hiển thị video KOL đã được Chủ Shop duyệt.
  let approvedKolVideos = [];
  try {
    const saved = JSON.parse(localStorage.getItem("scanms_kol_video_submissions") || "[]");
    const productAliases = new Set([prod.id, "P01", "SKIN-C15", "SR-VTC-15"]);
    approvedKolVideos = (Array.isArray(saved) ? saved : [])
      .filter(video =>
        productAliases.has(video.productId) &&
        (video.status === "APPROVED" || video.isApproved === true)
      )
      .sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
  } catch (error) {
    approvedKolVideos = [];
  }

  return `
    <div class="storefront-wrapper">
      <!-- 1. HEADER DÀNH CHO KHÁCH MUA HÀNG -->
      <header class="sf-header" id="sf-header">
        <div class="sf-brand-group">
          <a href="#storefront" class="sf-brand-logo">
            <span class="brand-mark" style="width:32px;height:32px;font-size:15px">S</span>
            <span>Sora Skin</span>
          </a>
          <span class="sf-brand-badge">
            <i class="ph ph-seal-check"></i> Gian Hàng Xác Thực
          </span>
        </div>

        <div class="sf-nav-actions">
          <!-- Nút chuyển sang màn hình tra cứu đơn hàng -->
          <button class="sf-admin-link" id="btn-sf-to-tracking" title="Tra cứu bưu tá GHN/GHTK">
            <i class="ph ph-map-trifold"></i> <span>Tra cứu đơn</span>
          </button>

          <!-- Nút mở giỏ hàng -->
          <button class="sf-cart-btn" id="btn-open-cart-drawer" aria-label="Mở giỏ hàng">
            <i class="ph ph-shopping-bag-open" style="font-size:18px"></i>
            <span>Giỏ hàng</span>
            <span class="sf-cart-badge" id="sf-cart-badge-count">${totalCartCount}</span>
          </button>
        </div>
      </header>

      <!-- 2. NỘI DUNG CHÍNH (MAIN CONTAINER) -->
      <main class="sf-main-container">
        
        <!-- FIRST FOLD 50/50: GALLERY BÊN TRÁI & THÔNG TIN MUA BÊN PHẢI -->
        <section class="sf-product-hero">
          
          <!-- Cột trái: Gallery ảnh -->
          <div class="sf-gallery-column">
            <div class="sf-main-photo-card" id="sf-main-photo-container">
              <img src="${activeImg.src}" alt="${activeImg.label}" class="sf-main-photo-img" id="sf-main-photo-img" />
              <button class="sf-zoom-trigger" id="btn-open-lightbox" title="Bấm để phóng to ảnh">
                <i class="ph ph-arrows-out"></i>
              </button>
            </div>

            <!-- 4 Thumbnail chuyển ảnh mượt -->
            <div class="sf-thumbnails-row">
              ${prod.images.map((img, idx) => `
                <button 
                  type="button" 
                  class="sf-thumb-btn ${idx === storefrontState.activePhotoIdx ? 'is-active' : ''}" 
                  data-thumb-idx="${idx}"
                  title="${img.label}">
                  <img src="${img.src}" alt="${img.label}" />
                </button>
              `).join("")}
            </div>
          </div>

          <!-- Cột phải: Thông tin sản phẩm & Thao tác mua -->
          <div class="sf-info-column">
            
            <!-- Thẻ KOL Affiliate giới thiệu -->
            <div class="sf-kol-badge-card">
              <div class="sf-kol-left">
                <div class="sf-kol-avatar">${kol.avatar}</div>
                <div class="sf-kol-meta">
                  <strong>${kol.name} <span class="badge warning" style="font-size:10.5px;padding:2px 6px">${kol.tier}</span></strong>
                  <span class="sf-kol-channel">${kol.channel}</span>
                </div>
              </div>
            </div>

            <!-- Tiêu đề sản phẩm chính (28-32px, tối đa 2 dòng) -->
            <h1 class="sf-product-title">${prod.name}</h1>

            <!-- Đánh giá & Số lượng đã bán -->
            <div class="sf-rating-sold-row">
              <span class="sf-star-pill">
                <i class="ph-fill ph-star"></i> ${prod.rating}
              </span>
              <span class="sf-divider-dot">•</span>
              <a href="#sf-customer-reviews-section" style="color:inherit;text-decoration:none">${prod.reviewCount} đánh giá</a>
              <span class="sf-divider-dot">•</span>
              <span>Đã bán ${prod.soldCount}</span>
            </div>

            <!-- Khối Giá tiền & Tiết kiệm -->
            <div class="sf-price-box">
              <div class="sf-price-row">
                <span class="sf-final-price">${formatMoney(unitFinalPrice)}</span>
                <span class="sf-original-price">${formatMoney(currentVariant.origPrice)}</span>
                <span class="sf-discount-tag">Tiết kiệm 21%</span>
              </div>
              ${activeCouponKOL && discountAmount > 0 ? `
                <div class="sf-coupon-hint">
                  <i class="ph ph-tag-chevron"></i> 
                  <span>Đã áp dụng mã KOL <strong>${storefrontState.appliedCoupon}</strong> (${activeCouponKOL.name}: -${formatMoney(discountAmount / storefrontState.quantity)})</span>
                </div>
              ` : `
                <div style="font-size:12px;color:var(--muted)">Đơn hàng thanh toán nguyên giá. Nhập mã KOL để được nhận ưu đãi giảm 10%!</div>
              `}
            </div>

            <!-- Bộ chọn phiên bản (Variants) -->
            <div>
              <div class="sf-section-label">
                <span>Chọn dung tích:</span>
                <span style="color:var(--brand-strong);font-weight:600">${currentVariant.label}</span>
              </div>
              <div class="sf-variants-group">
                ${prod.variants.map(v => `
                  <button 
                    type="button" 
                    class="sf-variant-btn ${v.id === storefrontState.activeVariantId ? 'is-active' : ''}" 
                    data-variant-id="${v.id}">
                    <i class="ph ${v.id === storefrontState.activeVariantId ? 'ph-check-circle' : 'ph-circle'}"></i>
                    <span>${v.label}</span>
                    <small style="opacity:0.75">(${formatMoney(v.price)})</small>
                  </button>
                `).join("")}
              </div>
            </div>

            <!-- Chọn số lượng & Tình trạng kho -->
            <div class="sf-quantity-stock-row">
              <div>
                <div class="sf-section-label" style="margin-bottom:4px">Số lượng:</div>
                <div class="sf-qty-selector">
                  <button type="button" class="sf-qty-btn" id="btn-qty-minus" ${storefrontState.quantity <= 1 ? 'disabled' : ''}>
                    <i class="ph ph-minus"></i>
                  </button>
                  <span class="sf-qty-val" id="sf-qty-val">${storefrontState.quantity}</span>
                  <button type="button" class="sf-qty-btn" id="btn-qty-plus">
                    <i class="ph ph-plus"></i>
                  </button>
                </div>
              </div>

              <div>
                <div class="sf-section-label" style="margin-bottom:4px">Kho hàng:</div>
                ${storefrontState.isOutOfStockDemo ? `
                  <span class="sf-stock-badge out-stock">
                    <i class="ph ph-x-circle"></i> Tạm hết hàng
                  </span>
                ` : `
                  <span class="sf-stock-badge in-stock">
                    <i class="ph ph-check-circle"></i> Sẵn ${prod.stockCount} chai tại kho TP.HCM
                  </span>
                `}
              </div>
            </div>

            <!-- Cụm nút Mua hàng Desktop First Fold -->
            <div class="sf-actions-row">
              <button 
                type="button" 
                class="sf-btn-add-cart" 
                id="btn-add-to-cart" 
                ${storefrontState.isOutOfStockDemo ? 'disabled' : ''}>
                <i class="ph ph-shopping-bag"></i>
                <span>Thêm vào giỏ</span>
              </button>

              <button 
                type="button" 
                class="sf-btn-buy-now" 
                id="btn-buy-now" 
                ${storefrontState.isOutOfStockDemo ? 'disabled' : ''}>
                <i class="ph ph-lightning"></i>
                <span>${storefrontState.isOutOfStockDemo ? 'Tạm hết hàng' : 'Đặt Mua Ngay'}</span>
              </button>

              <button 
                type="button" 
                class="sf-btn-wishlist ${storefrontState.isWishlistSaved ? 'is-saved' : ''}" 
                id="btn-toggle-wishlist" 
                title="${storefrontState.isWishlistSaved ? 'Đã lưu sản phẩm' : 'Lưu sản phẩm'}">
                <i class="ph${storefrontState.isWishlistSaved ? '-fill' : ''} ph-heart"></i>
              </button>
            </div>

            <!-- Minh bạch tiếp thị liên kết -->
            <div class="sf-affiliate-disclosure">
              <i class="ph ph-info" style="color:var(--brand-strong)"></i>
              <span>Link tiếp thị chính thức từ <strong>${kol.name}</strong>. Người giới thiệu có thể nhận hoa hồng từ đơn hàng này theo chính sách minh bạch của SCANMS.</span>
            </div>

            <!-- Cam kết dịch vụ nhanh (Trust Perks) -->
            <div class="sf-trust-mini-strip">
              <div class="sf-trust-item"><i class="ph ph-truck"></i> Giao nhanh 24h</div>
              <div class="sf-trust-item"><i class="ph ph-shield-check"></i> 100% Chính hãng</div>
              <div class="sf-trust-item"><i class="ph ph-arrow-counter-clockwise"></i> Đổi trả 14 ngày</div>
            </div>

          </div>
        </section>


        <!-- 4. VIDEO REVIEW KOL ĐÃ ĐƯỢC SHOP DUYỆT (FR-15) -->
        <section class="sf-kol-video-section" id="sf-kol-video-section">
          <div class="sf-kol-video-heading">
            <div>
              <span class="sf-kol-video-eyebrow"><i class="ph ph-video-camera"></i> FR-15 · NỘI DUNG ĐÃ KIỂM DUYỆT</span>
              <h2>Video review từ Nhà sáng tạo</h2>
              <p>Trải nghiệm thực tế do KOL gửi và được ${prod.brand} phê duyệt.</p>
            </div>
            <span class="sf-kol-video-count">${approvedKolVideos.length} video công khai</span>
          </div>

          ${approvedKolVideos.length ? `
            <div class="sf-kol-video-grid">
              ${approvedKolVideos.map((video, index) => {
                const videoSrc = video.videoUrl || sampleVideoPath;
                const posterSrc = video.image || defaultProductImage;
                return `
                  <article class="sf-kol-video-card ${video.isFeatured ? 'is-featured' : ''}">
                    <div class="sf-kol-video-player">
                      <video controls playsinline preload="metadata" poster="${escapeHtml(posterSrc)}" aria-label="${escapeHtml(video.title || 'Video review KOL')}">
                        <source src="${escapeHtml(videoSrc)}" type="video/mp4" />
                        Trình duyệt không hỗ trợ phát video.
                      </video>
                      <span class="sf-kol-video-status"><i class="ph ph-seal-check"></i> Shop đã duyệt</span>
                      ${video.isFeatured ? '<span class="sf-kol-video-featured"><i class="ph-fill ph-star"></i> Video nổi bật</span>' : ''}
                    </div>
                    <div class="sf-kol-video-body">
                      <span class="sf-kol-video-number">VIDEO ${String(index + 1).padStart(2, '0')}</span>
                      <h3>${escapeHtml(video.title || 'Video review sản phẩm')}</h3>
                      ${video.caption ? `<p>${escapeHtml(video.caption)}</p>` : ''}
                      <div class="sf-kol-video-author">
                        <span class="sf-kol-video-avatar">N</span>
                        <span><strong>${escapeHtml(video.collaborator?.fullName || kol.name)}</strong><small>Nội dung có liên kết tiếp thị</small></span>
                      </div>
                    </div>
                  </article>
                `;
              }).join("")}
            </div>
          ` : `
            <div class="sf-kol-video-empty">
              <i class="ph ph-video-camera-slash"></i>
              <div><strong>Chưa có video review công khai</strong><span>Video chỉ xuất hiện sau khi được Chủ Shop duyệt.</span></div>
            </div>
          `}
        </section>


        <!-- 5. KHỐI COUPON ĐỘC QUYỀN CỦA KOL -->
        <section class="sf-coupon-section">
          <div class="sf-coupon-left">
            <div class="sf-coupon-icon">
              <i class="ph ph-ticket"></i>
            </div>
            <div class="sf-coupon-info">
              <strong>Mã ưu đãi độc quyền từ ${kol.name}</strong>
              <p>Giảm 10% (tối đa 50.000 ₫) cho đơn hàng từ 299.000 ₫. Tiết kiệm thực tế: <strong>${formatMoney(discountAmount)}</strong></p>
            </div>
          </div>

          <div class="sf-coupon-actions">
            <span class="sf-coupon-code-pill">${kol.defaultCoupon}</span>
            <button 
              type="button" 
              class="sf-coupon-btn ${storefrontState.appliedCoupon === kol.defaultCoupon ? 'is-applied' : ''}" 
              id="btn-toggle-kol-coupon">
              <i class="ph ${storefrontState.appliedCoupon === kol.defaultCoupon ? 'ph-check' : 'ph-plus'}"></i>
              <span>${storefrontState.appliedCoupon === kol.defaultCoupon ? 'Đã áp dụng' : 'Áp dụng mã'}</span>
            </button>
          </div>
        </section>

        <!-- 5. ACCORDION NHÓM GOM 3 MỤC (Chi tiết, HDSD, Giao hàng) - TIÊU ĐỀ 46px, 1 VIỀN -->
        <section class="sf-accordion-group">
          
          <!-- Mục 1: Thông tin sản phẩm -->
          <div class="sf-acc-item ${storefrontState.accordions.details ? 'is-open' : ''}">
            <button type="button" class="sf-acc-header" data-acc="details" aria-expanded="${storefrontState.accordions.details}">
              <span class="sf-acc-title">
                <i class="ph ph-file-text sf-acc-icon"></i>
                <span>Thông tin sản phẩm</span>
                <span class="sf-acc-tag-sample">Nội dung mẫu từ nhãn hàng</span>
              </span>
              <i class="ph ph-caret-down sf-acc-arrow"></i>
            </button>
            <div class="sf-acc-content">
              <ul class="sf-acc-list">
                ${prod.details.map(d => `<li>${escapeHtml(d)}</li>`).join("")}
              </ul>
              <div class="sf-ingredients-wrap">
                <button type="button" class="sf-btn-text" id="btn-toggle-ingredients">
                  <span>${storefrontState.showFullIngredients ? 'Thu gọn bảng thành phần' : 'Xem đầy đủ thành phần'}</span>
                  <i class="ph ${storefrontState.showFullIngredients ? 'ph-caret-up' : 'ph-caret-down'}"></i>
                </button>
                ${storefrontState.showFullIngredients ? `
                  <p class="sf-ingredients-text">
                    <strong>Bảng thành phần đầy đủ (INCI):</strong> Aqua/Water, 3-O-Ethyl Ascorbic Acid (15%), Niacinamide (Vitamin B3), Butylene Glycol, Glycerin, Ferulic Acid (2%), Sodium Hyaluronate, Panthenol (Pro-Vitamin B5), Tocopheryl Acetate (Vitamin E), Allantoin, Dipotassium Glycyrrhizate, Xanthan Gum, Disodium EDTA, Phenoxyethanol, Ethylhexylglycerin.
                  </p>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Mục 2: Cách sử dụng -->
          <div class="sf-acc-item ${storefrontState.accordions.usage ? 'is-open' : ''}">
            <button type="button" class="sf-acc-header" data-acc="usage" aria-expanded="${storefrontState.accordions.usage}">
              <span class="sf-acc-title">
                <i class="ph ph-sparkle sf-acc-icon"></i>
                <span>Cách sử dụng</span>
                <span class="sf-acc-tag-sample">Khuyến nghị chuẩn hãng</span>
              </span>
              <i class="ph ph-caret-down sf-acc-arrow"></i>
            </button>
            <div class="sf-acc-content">
              <ul class="sf-acc-list">
                ${prod.usageGuide.map(u => `<li>${escapeHtml(u)}</li>`).join("")}
              </ul>
            </div>
          </div>

          <!-- Mục 3: Giao hàng & đổi trả -->
          <div class="sf-acc-item ${storefrontState.accordions.shipping ? 'is-open' : ''}">
            <button type="button" class="sf-acc-header" data-acc="shipping" aria-expanded="${storefrontState.accordions.shipping}">
              <span class="sf-acc-title">
                <i class="ph ph-truck sf-acc-icon"></i>
                <span>Giao hàng & đổi trả</span>
                <span class="sf-acc-tag-sample">Chính sách sàn SCANMS</span>
              </span>
              <i class="ph ph-caret-down sf-acc-arrow"></i>
            </button>
            <div class="sf-acc-content">
              <ul class="sf-acc-list">
                ${prod.shippingPolicy.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
              </ul>
            </div>
          </div>

        </section>

        <!-- 6. KHU VỰC ĐÁNH GIÁ SẢN PHẨM (Gọn gàng, Dropdown lọc & sắp xếp, Load more) -->
        <section class="sf-reviews-compact-section" id="sf-customer-reviews-section">
          <div class="sf-reviews-header-row">
            <div class="sf-reviews-title-block">
              <h2 class="sf-reviews-title">Đánh giá sản phẩm</h2>
              <div class="sf-reviews-summary-line">
                <span class="sf-score-bold">${avgRating.replace('.', ',')}/5</span>
                <span class="sf-star-gold">★</span>
                <span class="sf-summary-dot">·</span>
                <span class="sf-reviews-count-text">${totalReviews} đánh giá</span>
              </div>
            </div>

            <!-- Bộ đôi Dropdown: Lọc sao & Sắp xếp -->
            <div class="sf-reviews-toolbar">
              <div class="sf-select-wrap">
                <select class="sf-filter-select" id="sf-star-filter" aria-label="Lọc theo số sao">
                  <option value="all" ${storefrontState.reviewStarFilter === 'all' ? 'selected' : ''}>Tất cả số sao (${totalReviews})</option>
                  <option value="5" ${storefrontState.reviewStarFilter === '5' ? 'selected' : ''}>5 sao (${starCounts[5]})</option>
                  <option value="4" ${storefrontState.reviewStarFilter === '4' ? 'selected' : ''}>4 sao (${starCounts[4]})</option>
                  <option value="3" ${storefrontState.reviewStarFilter === '3' ? 'selected' : ''}>3 sao (${starCounts[3]})</option>
                  <option value="2" ${storefrontState.reviewStarFilter === '2' ? 'selected' : ''}>2 sao (${starCounts[2]})</option>
                  <option value="1" ${storefrontState.reviewStarFilter === '1' ? 'selected' : ''}>1 sao (${starCounts[1]})</option>
                </select>
                <i class="ph ph-caret-down sf-select-caret"></i>
              </div>

              <div class="sf-select-wrap">
                <select class="sf-filter-select" id="sf-sort-reviews" aria-label="Sắp xếp đánh giá">
                  <optgroup label="Sắp xếp theo">
                    <option value="newest" ${storefrontState.reviewSort === 'newest' ? 'selected' : ''}>Mới nhất</option>
                    <option value="highest" ${storefrontState.reviewSort === 'highest' ? 'selected' : ''}>Điểm cao nhất</option>
                    <option value="lowest" ${storefrontState.reviewSort === 'lowest' ? 'selected' : ''}>Điểm thấp nhất</option>
                  </optgroup>
                  <optgroup label="Kiểm thử trạng thái">
                    <option value="demo_normal" ${!storefrontState.isReviewsLoading && !storefrontState.reviewsError && !storefrontState.isDemoEmpty ? 'selected' : ''}>Bình thường (${customerReviewsData.length} đánh giá)</option>
                    <option value="demo_loading" ${storefrontState.isReviewsLoading ? 'selected' : ''}>⚡ Đang tải...</option>
                    <option value="demo_error" ${storefrontState.reviewsError ? 'selected' : ''}>⚡ Lỗi mạng (Thử lại)</option>
                    <option value="demo_empty" ${storefrontState.isDemoEmpty ? 'selected' : ''}>⚡ Chưa có đánh giá</option>
                  </optgroup>
                </select>
                <i class="ph ph-caret-down sf-select-caret"></i>
              </div>
            </div>
          </div>

          <!-- Trạng thái Đang tải -->
          ${storefrontState.isReviewsLoading ? `
            <div class="sf-reviews-state-box">
              <i class="ph ph-spinner ph-spin" style="font-size:24px;color:var(--brand)"></i>
              <span>Đang tải danh sách đánh giá...</span>
            </div>
          ` : storefrontState.reviewsError ? `
            <!-- Trạng thái Lỗi / Thử lại -->
            <div class="sf-reviews-state-box is-error">
              <i class="ph ph-warning-circle" style="font-size:24px;color:#dc2626"></i>
              <span>Không thể tải đánh giá vào lúc này.</span>
              <button type="button" class="btn small" id="btn-retry-reviews">Thử lại</button>
            </div>
          ` : activeReviews.length === 0 ? `
            <!-- Trạng thái Chưa có đánh giá nào -->
            <div class="sf-reviews-state-box">
              <i class="ph ph-chat-circle-dots" style="font-size:30px;opacity:0.5"></i>
              <span>Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên trải nghiệm!</span>
            </div>
          ` : filteredReviews.length === 0 ? `
            <!-- Trạng thái Không có kết quả theo bộ lọc -->
            <div class="sf-reviews-state-box">
              <i class="ph ph-funnel" style="font-size:26px;opacity:0.5"></i>
              <span>Không tìm thấy đánh giá nào cho mức lọc ${storefrontState.reviewStarFilter} sao.</span>
              <button type="button" class="sf-btn-text" id="btn-reset-review-filter">Đặt lại bộ lọc (Hiện tất cả)</button>
            </div>
          ` : `
            <!-- Danh sách đánh giá (Mặc định 3 đánh giá) -->
            <div class="sf-reviews-compact-list">
              ${visibleReviews.map(rev => {
                const isLong = rev.comment.length > 220 || rev.comment.includes('\n');
                const isExpanded = !!storefrontState.expandedCommentIds[rev.id];
                return `
                  <div class="sf-rev-compact-item" id="rev-${rev.id}">
                    <div class="sf-rev-meta-row">
                      <div class="sf-rev-author-group">
                        <strong class="sf-rev-name">${escapeHtml(rev.name)}</strong>
                        ${rev.verified ? `
                          <span class="sf-badge-buyer" title="Người mua thực tế đã nhận hàng thành công">
                            <i class="ph-fill ph-seal-check"></i> Đã mua hàng
                          </span>
                        ` : ''}
                        <span class="sf-rev-variant">• Phân loại: ${rev.variant}</span>
                      </div>
                      <span class="sf-rev-date">${rev.date}</span>
                    </div>

                    <div class="sf-rev-stars-row">
                      <span class="sf-rev-stars">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</span>
                    </div>

                    <div class="sf-rev-comment-box">
                      <p class="sf-rev-comment-text ${isLong && !isExpanded ? 'is-clamped' : ''}">
                        ${escapeHtml(rev.comment)}
                      </p>
                      ${isLong ? `
                        <button type="button" class="sf-btn-toggle-expand" data-expand-id="${rev.id}">
                          <span>${isExpanded ? 'Thu gọn' : 'Xem thêm'}</span>
                          <i class="ph ${isExpanded ? 'ph-caret-up' : 'ph-caret-down'}"></i>
                        </button>
                      ` : ''}
                    </div>

                    ${rev.photos && rev.photos.length > 0 ? `
                      <div class="sf-rev-photos-row">
                        ${rev.photos.map((p, pIdx) => `
                          <button type="button" class="sf-rev-thumb-btn" data-photo-src="${p}" title="Bấm để phóng to ảnh chụp thực tế">
                            <img src="${p}" alt="Ảnh feedback thực tế ${pIdx + 1}" />
                          </button>
                        `).join("")}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join("")}
            </div>

            <!-- Nút Xem thêm đánh giá nếu còn đánh giá chưa hiển thị -->
            <div class="sf-reviews-footer-actions">
              ${filteredReviews.length > storefrontState.reviewVisibleCount ? `
                <button type="button" class="sf-btn-load-more" id="btn-load-more-reviews">
                  <span>Xem thêm đánh giá (${filteredReviews.length - storefrontState.reviewVisibleCount} còn lại)</span>
                  <i class="ph ph-caret-down"></i>
                </button>
              ` : storefrontState.reviewVisibleCount > 3 ? `
                <button type="button" class="sf-btn-text-sm" id="btn-collapse-reviews">
                  <i class="ph ph-caret-up"></i> Thu gọn về 3 đánh giá ban đầu
                </button>
              ` : ''}
            </div>
          `}
        </section>

        <!-- 7. MỤC HỎI SHOP VỀ SẢN PHẨM (Gọn gàng, khoảng đệm 14px 16px) -->
        <section class="sf-ask-shop-compact">
          <div class="sf-ask-content">
            <h3 class="sf-ask-title">
              <i class="ph ph-chats-circle" style="color:var(--brand)"></i>
              <span>Hỏi Shop về sản phẩm</span>
            </h3>
            <p class="sf-ask-desc">
              Chuyên viên chăm sóc khách hàng của Sora Skin Official sẵn sàng hỗ trợ tư vấn da miễn phí.
            </p>
          </div>
          <button type="button" class="sf-btn-ask-compact" id="btn-open-ask-shop">
            <i class="ph ph-chat-text"></i>
            <span>Hỏi Shop ngay</span>
          </button>
        </section>

      </main>

      <!-- 8. MOBILE BOTTOM STICKY ACTION BAR (< 768px) -->
      <div class="sf-mobile-sticky-bar">
        <div class="sf-sticky-price">
          <strong>${formatMoney(unitFinalPrice)}</strong>
          <small>${formatMoney(currentVariant.origPrice)}</small>
        </div>
        <div class="sf-sticky-buttons">
          <button type="button" class="sf-btn-add-cart sf-sticky-btn" id="btn-mobile-add-cart">
            <i class="ph ph-shopping-bag"></i> Thêm giỏ
          </button>
          <button type="button" class="sf-btn-buy-now sf-sticky-btn" id="btn-mobile-buy-now">
            <i class="ph ph-lightning"></i> Mua ngay
          </button>
        </div>
      </div>

      <!-- 9. RIGHT-SLIDE CART DRAWER -->
      <div class="sf-cart-drawer-backdrop ${storefrontState.isCartDrawerOpen ? 'is-open' : ''}" id="sf-cart-drawer-backdrop">
        <div class="sf-cart-drawer">
          <div class="sf-cart-header">
            <h3>Giỏ hàng của bạn (${totalCartCount})</h3>
            <button type="button" class="icon-btn" id="btn-close-cart-drawer" aria-label="Đóng giỏ hàng">
              <i class="ph ph-x"></i>
            </button>
          </div>

          <div class="sf-cart-items-body">
            ${storefrontState.cart.length > 0 ? storefrontState.cart.map((cItem, cIdx) => {
              const itemProd = storefrontProducts[cItem.productId] || prod;
              const itemVar = itemProd.variants.find(v => v.id === cItem.variantId) || itemProd.variants[0];
              return `
                <div class="sf-cart-item-row">
                  <img src="${itemProd.images[0].src}" alt="${itemProd.name}" class="sf-cart-item-thumb" />
                  <div class="sf-cart-item-details">
                    <strong>${itemProd.name}</strong>
                    <span class="sf-cart-item-variant">Phân loại: ${itemVar.label}</span>
                    <div class="sf-cart-item-price">${formatMoney(itemVar.price)}</div>
                  </div>
                  <div class="sf-cart-item-actions">
                    <button type="button" class="text-btn" data-remove-cart-idx="${cIdx}" style="color:#B83A42;font-size:12px">
                      <i class="ph ph-trash"></i> Xóa
                    </button>
                    <div class="sf-qty-selector" style="transform:scale(0.85);transform-origin:right center">
                      <button type="button" class="sf-qty-btn" data-cart-minus-idx="${cIdx}">-</button>
                      <span class="sf-qty-val">${cItem.qty}</span>
                      <button type="button" class="sf-qty-btn" data-cart-plus-idx="${cIdx}">+</button>
                    </div>
                  </div>
                </div>
              `;
            }).join("") : `
              <div style="text-align:center;padding:40px 20px;color:var(--muted)">
                <i class="ph ph-shopping-bag" style="font-size:48px;opacity:0.35;margin-bottom:10px;display:block"></i>
                <strong>Giỏ hàng đang trống</strong>
                <p style="font-size:13px;margin:6px 0 16px">Hãy chọn một sản phẩm yêu thích để trải nghiệm.</p>
                <button type="button" class="btn small" id="btn-cart-continue-shopping">Tiếp tục mua sắm</button>
              </div>
            `}
          </div>

          ${storefrontState.cart.length > 0 ? `
            <div class="sf-cart-footer">
              <div class="sf-cart-summary-line">
                <span>Tạm tính hàng:</span>
                <strong>${formatMoney(subtotal)}</strong>
              </div>
              <div class="sf-cart-summary-line" style="color:#059669">
                <span>Voucher KOL (${storefrontState.appliedCoupon || 'Chưa áp dụng'}):</span>
                <strong>-${formatMoney(discountAmount)}</strong>
              </div>
              <div class="sf-cart-summary-line">
                <span>Phí vận chuyển (GHN/GHTK):</span>
                <strong style="color:#059669">${subtotal >= 399000 ? 'Miễn phí' : '25.000 ₫'}</strong>
              </div>
              <div class="sf-cart-total-line">
                <span>Tổng cộng:</span>
                <span style="color:var(--brand-strong)">${formatMoney(finalCalculatedPrice)}</span>
              </div>
              <button type="button" class="sf-btn-checkout" id="btn-drawer-proceed-checkout">
                <span>Tiến hành Đặt Hàng</span>
                <i class="ph ph-arrow-right"></i>
              </button>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- 10. GUEST CHECKOUT MODAL (Không bắt đăng ký) -->
      ${storefrontState.isCheckoutModalOpen ? `
        <div class="sf-modal-backdrop" id="sf-checkout-backdrop">
          <div class="sf-checkout-card" role="dialog" aria-modal="true">
            <div class="sf-checkout-head">
              <div>
                <h3 style="margin:0;font-size:18px;display:flex;align-items:center;gap:8px">
                  <i class="ph ph-shield-check" style="color:var(--brand)"></i> Đặt Hàng Nhanh (Guest Checkout)
                </h3>
                <small style="color:var(--muted)">Không cần đăng ký tài khoản • Nhận hàng kiểm tra thanh toán</small>
              </div>
              <button type="button" class="icon-btn" id="btn-close-checkout-modal"><i class="ph ph-x"></i></button>
            </div>

            <form class="sf-checkout-body" id="sf-checkout-form">
              <!-- Thông tin người nhận -->
              <div class="sf-form-grid">
                <div class="sf-form-field">
                  <label for="co-name">Họ và tên người nhận *</label>
                  <input type="text" id="co-name" class="sf-form-input" value="${storefrontState.checkoutForm.name}" required placeholder="VD: Nguyễn Hải Yến" />
                </div>
                <div class="sf-form-field">
                  <label for="co-phone">Số điện thoại liên hệ *</label>
                  <input type="tel" id="co-phone" class="sf-form-input" value="${storefrontState.checkoutForm.phone}" required placeholder="VD: 0903218456" />
                </div>
                <div class="sf-form-field">
                  <label for="co-city">Tỉnh / Thành phố *</label>
                  <select id="co-city" class="sf-form-select">
                    <option value="TP. Hồ Chí Minh" selected>TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                  </select>
                </div>
                <div class="sf-form-field">
                  <label for="co-district">Quận / Huyện *</label>
                  <input type="text" id="co-district" class="sf-form-input" value="${storefrontState.checkoutForm.district}" required placeholder="VD: Quận Gò Vấp" />
                </div>
                <div class="sf-form-field full-width">
                  <label for="co-address">Địa chỉ cụ thể (Số nhà, tên đường, phường) *</label>
                  <input type="text" id="co-address" class="sf-form-input" value="${storefrontState.checkoutForm.address}" required placeholder="VD: 12 Nguyễn Văn Bảo, Phường 4" />
                </div>
                <div class="sf-form-field full-width">
                  <label for="co-notes">Ghi chú giao hàng</label>
                  <textarea id="co-notes" class="sf-form-textarea" placeholder="VD: Giao giờ hành chính, gọi điện trước khi tới...">${storefrontState.checkoutForm.notes}</textarea>
                </div>
              </div>

              <!-- Phương thức thanh toán -->
              <div>
                <label style="font-size:12.5px;font-weight:700;display:block;margin-bottom:8px">Phương thức thanh toán:</label>
                <div class="sf-pay-methods-group">
                  <label class="sf-pay-method-card ${storefrontState.checkoutForm.paymentMethod === 'cod' ? 'is-selected' : ''}">
                    <input type="radio" name="sf-payment" value="cod" ${storefrontState.checkoutForm.paymentMethod === 'cod' ? 'checked' : ''} />
                    <div>
                      <strong style="font-size:13.5px;display:block"><i class="ph ph-hand-coins"></i> Tiền mặt khi nhận (COD)</strong>
                      <small style="color:var(--muted);font-size:11.5px">Kiểm tra hàng trước khi gửi tiền</small>
                    </div>
                  </label>

                  <label class="sf-pay-method-card ${storefrontState.checkoutForm.paymentMethod === 'vietqr' ? 'is-selected' : ''}">
                    <input type="radio" name="sf-payment" value="vietqr" ${storefrontState.checkoutForm.paymentMethod === 'vietqr' ? 'checked' : ''} />
                    <div>
                      <strong style="font-size:13.5px;display:block"><i class="ph ph-qr-code"></i> Chuyển khoản VietQR</strong>
                      <small style="color:var(--muted);font-size:11.5px">Quét mã QR ngân hàng nhanh</small>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Ô NHẬP MÃ GIẢM GIÁ KOL TRỰC TIẾP TRÊN FORM (FR-12, FR-16) -->
              <div style="background:var(--surface-2);padding:14px;border-radius:12px;border:1px solid var(--line)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <label for="co-coupon-input" style="font-size:12.5px;font-weight:700;display:flex;align-items:center;gap:6px">
                    <i class="ph ph-ticket" style="color:var(--brand)"></i> Mã ưu đãi KOL / Người giới thiệu:
                  </label>
                  <span style="font-size:11.5px;color:var(--muted)">Bắt buộc có mã để được giảm 10%</span>
                </div>
                <div style="display:flex;gap:8px">
                  <input type="text" id="co-coupon-input" class="sf-form-input" style="text-transform:uppercase;font-weight:700;letter-spacing:0.5px" placeholder="VD: NHATXINH10, MAIANH12, LINHSKIN..." value="${storefrontState.appliedCoupon || ''}" />
                  <button type="button" class="btn small" id="btn-apply-co-coupon" style="min-width:90px;font-weight:700">
                    ${storefrontState.appliedCoupon ? 'Cập nhật' : 'Áp dụng'}
                  </button>
                </div>
                ${activeCouponKOL && discountAmount > 0 ? `
                  <div style="margin-top:8px;padding:8px 12px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;font-size:12px;color:#065f46;display:flex;align-items:center;justify-content:space-between">
                    <div>
                      <i class="ph ph-check-circle" style="color:#059669;margin-right:4px"></i>
                      <span>Mã KOL hợp lệ: <strong>${storefrontState.appliedCoupon}</strong> (${activeCouponKOL.name} - Giảm 10%).</span>
                    </div>
                    <button type="button" id="btn-remove-co-coupon" style="background:none;border:none;color:#b91c1c;font-size:11.5px;cursor:pointer;font-weight:700">Gỡ mã</button>
                  </div>
                ` : `
                  <div style="margin-top:6px;font-size:11.5px;color:var(--muted);display:flex;align-items:center;gap:4px">
                    <i class="ph ph-info"></i> Bạn chưa nhập mã KOL hợp lệ. Đơn hàng sẽ mua theo nguyên giá niêm yết (không giảm).
                  </div>
                `}
              </div>

              <!-- CHÍNH SÁCH BẢO HỘ 14 NGÀY & ĐỐI SOÁT HOA HỒNG MINH BẠCH (FR-22) -->
              <div style="background:#fffbeb;border:1px solid #fef3c7;padding:10px 12px;border-radius:10px;font-size:12px;color:#92400e;display:flex;align-items:flex-start;gap:8px">
                <i class="ph ph-shield-check" style="font-size:18px;color:#d97706;flex-shrink:0;margin-top:1px"></i>
                <div>
                  <strong style="display:block;margin-bottom:2px">Bảo hộ đổi trả 14 ngày & Đối soát hoa hồng an toàn:</strong>
                  <span>Khách hàng có 14 ngày đổi trả miễn phí. Tiền hoa hồng của KOL sẽ được giữ trong <strong>Ví Chờ</strong> và tự động giải ngân sau 14 ngày khi đơn hoàn tất an toàn.</span>
                </div>
              </div>

              <!-- Tóm tắt chi phí thanh toán -->
              <div style="background:var(--surface-2);padding:14px;border-radius:12px;border:1px solid var(--line);font-size:13px;display:flex;flex-direction:column;gap:6px">
                <div style="display:flex;justify-content:space-between">
                  <span>Sản phẩm:</span>
                  <strong>${prod.name} (${currentVariant.label}) x ${storefrontState.quantity}</strong>
                </div>
                <div style="display:flex;justify-content:space-between">
                  <span>Tạm tính:</span>
                  <span>${formatMoney(subtotal)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;color:${discountAmount > 0 ? '#059669' : 'var(--muted)'}">
                  <span>Mã KOL (${storefrontState.appliedCoupon || 'Không dùng mã'}):</span>
                  <span>${discountAmount > 0 ? `-${formatMoney(discountAmount)}` : '0 ₫ (Nguyên giá)'}</span>
                </div>
                <div style="display:flex;justify-content:space-between">
                  <span>Phí giao hàng:</span>
                  <span style="color:#059669">${subtotal >= 399000 ? '0 ₫ (Miễn phí)' : '25.000 ₫'}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:850;color:var(--brand-strong);padding-top:6px;border-top:1px solid var(--line)">
                  <span>Tổng thanh toán:</span>
                  <span>${formatMoney(finalCalculatedPrice)}</span>
                </div>
              </div>

              <!-- Nút xác nhận đặt hàng chống gửi trùng -->
              <button 
                type="submit" 
                class="sf-btn-buy-now" 
                id="btn-confirm-checkout" 
                ${storefrontState.isSubmittingOrder ? 'disabled' : ''}
                style="width:100%;height:48px;font-size:15px">
                ${storefrontState.isSubmittingOrder ? `
                  <i class="ph ph-spinner" style="animation:spin 1s linear infinite"></i> Đang xử lý đơn hàng...
                ` : `
                  <i class="ph ph-check-circle"></i> Xác Nhận Đặt Hàng (${formatMoney(finalCalculatedPrice)})
                `}
              </button>
            </form>
          </div>
        </div>
      ` : ''}

      <!-- 11. MODAL ĐẶT HÀNG THÀNH CÔNG -->
      ${storefrontState.latestPlacedOrder ? `
        <div class="sf-modal-backdrop">
          <div class="sf-checkout-card" style="max-width:480px">
            <div class="sf-success-card">
              <div class="sf-success-icon">
                <i class="ph ph-check"></i>
              </div>
              <h2 style="margin:0;font-size:22px;color:var(--ink)">Đặt Hàng Thành Công!</h2>
              <p style="margin:0;font-size:13.5px;color:var(--muted)">
                ${storefrontState.latestPlacedOrder.discountAmount > 0 ? `
                  Cảm ơn bạn đã mua hàng qua liên kết ưu đãi của KOL <strong>${storefrontState.latestPlacedOrder.kolName}</strong>.
                ` : `
                  Cảm ơn bạn đã đặt hàng tại gian hàng chính hãng Sora Skin Official.
                `}
              </p>

              <div class="sf-order-badge-pill">
                Mã đơn: #${storefrontState.latestPlacedOrder.orderId}
              </div>

              <div style="width:100%;background:var(--surface-2);border-radius:12px;padding:14px;border:1px solid var(--line);text-align:left;font-size:13px;display:flex;flex-direction:column;gap:6px">
                <div><strong>Người nhận:</strong> ${storefrontState.latestPlacedOrder.customerName} - ${storefrontState.latestPlacedOrder.phone}</div>
                <div><strong>Địa chỉ:</strong> ${storefrontState.latestPlacedOrder.address}</div>
                <div><strong>Mã ưu đãi KOL:</strong> <span class="badge" style="background:${storefrontState.latestPlacedOrder.discountAmount > 0 ? '#dcfce7;color:#15803d' : '#f1f5f9;color:#64748b'}">${storefrontState.latestPlacedOrder.appliedCoupon}</span></div>
                <div><strong>Giảm giá KOL:</strong> <span style="color:#059669;font-weight:700">-${formatMoney(storefrontState.latestPlacedOrder.discountAmount)}</span></div>
                <div><strong>Thanh toán:</strong> ${storefrontState.latestPlacedOrder.paymentMethod === 'cod' ? 'Thanh toán tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản VietQR'}</div>
                <div><strong>Tổng thanh toán:</strong> <span style="color:var(--brand-strong);font-weight:800">${formatMoney(storefrontState.latestPlacedOrder.totalAmount)}</span></div>
              </div>

              <!-- THÔNG BÁO BỘ ĐẾM 14 NGÀY ĐỐI SOÁT HOA HỒNG (FR-21, FR-22) -->
              <div style="width:100%;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 12px;text-align:left;font-size:12px;color:#1e40af;display:flex;align-items:flex-start;gap:8px">
                <i class="ph ph-hourglass" style="font-size:20px;color:#2563eb;flex-shrink:0;margin-top:1px"></i>
                <div>
                  <strong>Cơ chế bảo hộ 14 ngày & Giải ngân hoa hồng:</strong>
                  <div>Đơn hàng sau khi giao thành công sẽ đếm ngược 14 ngày đổi trả. Tiền hoa hồng của KOL tạm lưu giữ tại <strong>Ví Chờ</strong> và tự động chuyển sang <strong>Ví Khả Dụng</strong> sau 14 ngày an toàn.</div>
                </div>
              </div>

              <div style="display:flex;gap:10px;width:100%;margin-top:10px">
                <button type="button" class="btn secondary" id="btn-success-continue-shopping" style="flex:1">
                  Mua tiếp
                </button>
                <button type="button" class="sf-btn-buy-now" id="btn-success-go-tracking" style="flex:1.4">
                  <i class="ph ph-map-trifold"></i> Theo dõi đơn hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- 12. LIGHTBOX PHÓNG TO ẢNH -->
      ${storefrontState.isLightboxOpen ? `
        <div class="sf-lightbox-modal" id="sf-lightbox-modal">
          <button type="button" class="sf-lightbox-close" id="btn-close-lightbox">&times;</button>
          <img src="${storefrontState.lightboxPhotoSrc || activeImg.src}" alt="${storefrontState.lightboxPhotoSrc ? 'Ảnh feedback phóng to' : activeImg.label}" class="sf-lightbox-img" />
        </div>
      ` : ''}

      <!-- 13. DRAWER HỎI SHOP VỀ SẢN PHẨM (Tách biệt khỏi chat KOL) -->
      ${storefrontState.isAskShopOpen ? `
        <div class="sf-modal-backdrop" id="sf-ask-shop-backdrop">
          <div class="sf-checkout-card" style="max-width:500px">
            <div class="sf-checkout-head">
              <div>
                <h3 style="margin:0;font-size:17px;display:flex;align-items:center;gap:8px">
                  <i class="ph ph-chats-circle" style="color:var(--brand)"></i> Đặt Câu Hỏi Cho Gian Hàng Sora Skin
                </h3>
                <small style="color:var(--muted)">Tư vấn trực tiếp từ dược sĩ & chuyên viên CSKH</small>
              </div>
              <button type="button" class="icon-btn" id="btn-close-ask-shop"><i class="ph ph-x"></i></button>
            </div>

            <form class="sf-checkout-body" id="sf-ask-shop-form">
              <div class="sf-form-field full-width">
                <label>Sản phẩm cần tư vấn:</label>
                <input type="text" class="sf-form-input" value="${prod.name}" readonly style="background:var(--surface-2)" />
              </div>
              <div class="sf-form-field full-width">
                <label for="ask-user-name">Họ và tên của bạn *</label>
                <input type="text" id="ask-user-name" class="sf-form-input" required placeholder="VD: Nguyễn Hải Yến" />
              </div>
              <div class="sf-form-field full-width">
                <label for="ask-contact">Số điện thoại hoặc Zalo *</label>
                <input type="text" id="ask-contact" class="sf-form-input" required placeholder="VD: 0903 218 456" />
              </div>
              <div class="sf-form-field full-width">
                <label for="ask-question">Câu hỏi hoặc tình trạng da của bạn *</label>
                <textarea id="ask-question" class="sf-form-textarea" required placeholder="VD: Da mình đang có mụn ẩn và thâm đỏ, có dùng được nồng độ 15% không?"></textarea>
              </div>
              <button type="submit" class="sf-btn-buy-now" style="width:100%;height:44px">
                <i class="ph ph-paper-plane-tilt"></i> Gửi Câu Hỏi Cho Shop
              </button>
            </form>
          </div>
        </div>
      ` : ''}

    </div>
  `;
}

// Gắn toàn bộ sự kiện tương tác của Storefront
export function bindStorefront(root, { toast, go, renderCurrentPage }) {
  document.querySelector(".prototype")?.classList.remove("is-pure-customer");
  const prod = storefrontProducts[storefrontState.currentProductId] || storefrontProducts.P01;
  const kol = affiliateKOLs[storefrontState.currentRefCode] || affiliateKOLs.R9K2N7;

  // 1. Chuyển ảnh Thumbnail
  root.querySelectorAll("[data-thumb-idx]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.thumbIdx, 10);
      storefrontState.activePhotoIdx = idx;
      renderCurrentPage();
    });
  });

  // 2. Lightbox Zoom
  root.querySelector("#btn-open-lightbox")?.addEventListener("click", () => {
    storefrontState.isLightboxOpen = true;
    renderCurrentPage();
  });

  root.querySelector("#btn-close-lightbox")?.addEventListener("click", () => {
    storefrontState.isLightboxOpen = false;
    storefrontState.lightboxPhotoSrc = null;
    renderCurrentPage();
  });

  root.querySelector("#sf-lightbox-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "sf-lightbox-modal") {
      storefrontState.isLightboxOpen = false;
      storefrontState.lightboxPhotoSrc = null;
      renderCurrentPage();
    }
  });

  // 3. Chọn Variant dung tích
  root.querySelectorAll("[data-variant-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      storefrontState.activeVariantId = btn.dataset.variantId;
      renderCurrentPage();
    });
  });

  // 4. Tăng / Giảm số lượng
  root.querySelector("#btn-qty-minus")?.addEventListener("click", () => {
    if (storefrontState.quantity > 1) {
      storefrontState.quantity--;
      renderCurrentPage();
    }
  });

  root.querySelector("#btn-qty-plus")?.addEventListener("click", () => {
    storefrontState.quantity++;
    renderCurrentPage();
  });

  // 5. Lưu sản phẩm (Wishlist)
  root.querySelector("#btn-toggle-wishlist")?.addEventListener("click", () => {
    storefrontState.isWishlistSaved = !storefrontState.isWishlistSaved;
    toast(storefrontState.isWishlistSaved ? "Đã thêm sản phẩm vào danh sách yêu thích!" : "Đã bỏ lưu sản phẩm.");
    renderCurrentPage();
  });

  // 6. Áp dụng / Gỡ Coupon độc quyền KOL
  root.querySelector("#btn-toggle-kol-coupon")?.addEventListener("click", () => {
    if (storefrontState.appliedCoupon === kol.defaultCoupon) {
      storefrontState.appliedCoupon = "";
      toast("Đã gỡ mã ưu đãi của KOL.");
    } else {
      storefrontState.appliedCoupon = kol.defaultCoupon;
      toast(`Đã áp dụng mã ${kol.defaultCoupon} giảm 10%!`);
    }
    renderCurrentPage();
  });

  // 7. Thao tác Thêm vào giỏ
  const handleAddToCart = () => {
    const existing = storefrontState.cart.find(
      item => item.productId === storefrontState.currentProductId && item.variantId === storefrontState.activeVariantId
    );
    if (existing) {
      existing.qty += storefrontState.quantity;
    } else {
      storefrontState.cart.push({
        productId: storefrontState.currentProductId,
        variantId: storefrontState.activeVariantId,
        qty: storefrontState.quantity
      });
    }
    storefrontState.isCartDrawerOpen = true;
    toast(`Đã thêm ${storefrontState.quantity} sản phẩm vào giỏ hàng!`);
    renderCurrentPage();
  };

  root.querySelector("#btn-add-to-cart")?.addEventListener("click", handleAddToCart);
  root.querySelector("#btn-mobile-add-cart")?.addEventListener("click", handleAddToCart);

  // 8. Thao tác Đặt mua ngay (Mở thẳng Checkout)
  const handleBuyNow = () => {
    // Đảm bảo giỏ hàng có sản phẩm hiện tại
    storefrontState.cart = [{
      productId: storefrontState.currentProductId,
      variantId: storefrontState.activeVariantId,
      qty: storefrontState.quantity
    }];
    storefrontState.isCheckoutModalOpen = true;
    renderCurrentPage();
  };

  root.querySelector("#btn-buy-now")?.addEventListener("click", handleBuyNow);
  root.querySelector("#btn-mobile-buy-now")?.addEventListener("click", handleBuyNow);

  // 9. Drawer Giỏ Hàng Controls
  root.querySelector("#btn-open-cart-drawer")?.addEventListener("click", () => {
    storefrontState.isCartDrawerOpen = true;
    renderCurrentPage();
  });

  root.querySelector("#btn-close-cart-drawer")?.addEventListener("click", () => {
    storefrontState.isCartDrawerOpen = false;
    renderCurrentPage();
  });

  root.querySelector("#sf-cart-drawer-backdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "sf-cart-drawer-backdrop") {
      storefrontState.isCartDrawerOpen = false;
      renderCurrentPage();
    }
  });

  root.querySelector("#btn-cart-continue-shopping")?.addEventListener("click", () => {
    storefrontState.isCartDrawerOpen = false;
    renderCurrentPage();
  });

  // Tăng/giảm/xóa item trong giỏ
  root.querySelectorAll("[data-cart-minus-idx]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.cartMinusIdx, 10);
      if (storefrontState.cart[idx]) {
        if (storefrontState.cart[idx].qty > 1) {
          storefrontState.cart[idx].qty--;
        } else {
          storefrontState.cart.splice(idx, 1);
        }
        renderCurrentPage();
      }
    });
  });

  root.querySelectorAll("[data-cart-plus-idx]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.cartPlusIdx, 10);
      if (storefrontState.cart[idx]) {
        storefrontState.cart[idx].qty++;
        renderCurrentPage();
      }
    });
  });

  root.querySelectorAll("[data-remove-cart-idx]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.removeCartIdx, 10);
      storefrontState.cart.splice(idx, 1);
      toast("Đã xóa sản phẩm khỏi giỏ hàng.");
      renderCurrentPage();
    });
  });

  // Tiến hành đặt hàng từ Giỏ
  root.querySelector("#btn-drawer-proceed-checkout")?.addEventListener("click", () => {
    storefrontState.isCartDrawerOpen = false;
    storefrontState.isCheckoutModalOpen = true;
    renderCurrentPage();
  });

  // 10. Guest Checkout Form Submission
  root.querySelector("#btn-close-checkout-modal")?.addEventListener("click", () => {
    storefrontState.isCheckoutModalOpen = false;
    renderCurrentPage();
  });

  // Xử lý áp dụng mã KOL trực tiếp trên form checkout
  const applyCouponHandler = () => {
    const code = (root.querySelector("#co-coupon-input")?.value || "").trim().toUpperCase();
    if (!code) {
      storefrontState.appliedCoupon = "";
      toast("Đã bỏ áp dụng mã. Đơn hàng sẽ mua nguyên giá.");
      renderCurrentPage();
      return;
    }
    const foundKOL = getKOLByCoupon(code);
    if (foundKOL) {
      storefrontState.appliedCoupon = code;
      toast(`Áp dụng thành công mã KOL ${code} (${foundKOL.name}) giảm 10%!`);
    } else {
      storefrontState.appliedCoupon = "";
      toast(`Mã ${code} không tồn tại hoặc chưa kích hoạt.`);
    }
    renderCurrentPage();
  };

  root.querySelector("#btn-apply-co-coupon")?.addEventListener("click", applyCouponHandler);
  root.querySelector("#co-coupon-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyCouponHandler();
    }
  });

  root.querySelector("#btn-remove-co-coupon")?.addEventListener("click", () => {
    storefrontState.appliedCoupon = "";
    toast("Đã gỡ mã ưu đãi KOL. Đơn hàng mua theo nguyên giá.");
    renderCurrentPage();
  });

  // Chọn phương thức thanh toán trong form
  root.querySelectorAll("input[name='sf-payment']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      storefrontState.checkoutForm.paymentMethod = e.target.value;
      renderCurrentPage();
    });
  });

  // Submit đơn hàng (Chống gửi trùng)
  const checkoutFormEl = root.querySelector("#sf-checkout-form");
  checkoutFormEl?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (storefrontState.isSubmittingOrder) return;

    // Validate họ tên và SĐT
    const nameVal = root.querySelector("#co-name")?.value.trim();
    const phoneVal = root.querySelector("#co-phone")?.value.trim();
    const addressVal = root.querySelector("#co-address")?.value.trim();

    if (!nameVal || !phoneVal || !addressVal) {
      toast("Vui lòng điền đầy đủ Họ tên, SĐT và Địa chỉ nhận hàng.");
      return;
    }

    if (!/^[0-9]{9,11}$/.test(phoneVal.replace(/\s+/g, ""))) {
      toast("Số điện thoại không hợp lệ. Vui lòng kiểm tra lại!");
      return;
    }

    // Cập nhật state form
    storefrontState.checkoutForm.name = nameVal;
    storefrontState.checkoutForm.phone = phoneVal;
    storefrontState.checkoutForm.address = addressVal;
    storefrontState.checkoutForm.district = root.querySelector("#co-district")?.value.trim() || "";
    storefrontState.checkoutForm.city = root.querySelector("#co-city")?.value || "";
    storefrontState.checkoutForm.notes = root.querySelector("#co-notes")?.value.trim() || "";

    // Bật trạng thái gửi đơn
    storefrontState.isSubmittingOrder = true;
    renderCurrentPage();

    setTimeout(() => {
      // Sinh mã đơn hàng mới
      const newOrderId = "IN" + (23940 + Math.floor(Math.random() * 50));
      const currentVariant = prod.variants.find(v => v.id === storefrontState.activeVariantId) || prod.variants[0];
      const subtotal = currentVariant.price * storefrontState.quantity;
      const activeKOL = getKOLByCoupon(storefrontState.appliedCoupon);
      const discount = (activeKOL && subtotal >= activeKOL.minSpend)
        ? Math.min(subtotal * (activeKOL.discountPct / 100), activeKOL.maxDiscount)
        : 0;
      const total = Math.max(0, subtotal - discount);

      storefrontState.latestPlacedOrder = {
        orderId: newOrderId,
        customerName: nameVal,
        phone: phoneVal,
        address: `${addressVal}, ${storefrontState.checkoutForm.district}, ${storefrontState.checkoutForm.city}`,
        paymentMethod: storefrontState.checkoutForm.paymentMethod,
        totalAmount: total,
        appliedCoupon: storefrontState.appliedCoupon ? storefrontState.appliedCoupon : "Không dùng mã (Nguyên giá)",
        discountAmount: discount,
        kolName: activeKOL ? activeKOL.name : "Gian hàng chính hãng",
        refCode: activeKOL ? activeKOL.refCode : storefrontState.currentRefCode,
        settlementDays: 14
      };

      storefrontState.isSubmittingOrder = false;
      storefrontState.isCheckoutModalOpen = false;
      storefrontState.cart = []; // Reset giỏ hàng
      toast(`Đặt hàng thành công! Mã đơn của bạn là #${newOrderId}.`);
      renderCurrentPage();
    }, 600);
  });

  // Đặt hàng thành công actions
  root.querySelector("#btn-success-continue-shopping")?.addEventListener("click", () => {
    storefrontState.latestPlacedOrder = null;
    renderCurrentPage();
  });

  root.querySelector("#btn-success-go-tracking")?.addEventListener("click", () => {
    const placedOrderId = storefrontState.latestPlacedOrder?.orderId || "IN23931";
    storefrontState.latestPlacedOrder = null;
    go("tracking");
    toast(`Đang mở hành trình vận chuyển của đơn hàng #${placedOrderId}...`);
  });

  // 11. Accordion Toggles (Thông tin, HDSD, Vận chuyển)
  root.querySelectorAll("[data-acc]").forEach(btn => {
    btn.addEventListener("click", () => {
      const accKey = btn.dataset.acc;
      storefrontState.accordions[accKey] = !storefrontState.accordions[accKey];
      renderCurrentPage();
    });
  });

  // Toggle xem bảng thành phần đầy đủ
  root.querySelector("#btn-toggle-ingredients")?.addEventListener("click", (e) => {
    e.stopPropagation();
    storefrontState.showFullIngredients = !storefrontState.showFullIngredients;
    renderCurrentPage();
  });

  // 12. Dropdown Lọc Đánh giá theo Sao & Sắp xếp
  root.querySelector("#sf-star-filter")?.addEventListener("change", (e) => {
    storefrontState.reviewStarFilter = e.target.value;
    storefrontState.reviewVisibleCount = 3; // Reset về 3 đánh giá
    renderCurrentPage();
  });

  root.querySelector("#sf-sort-reviews")?.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "demo_loading") {
      storefrontState.isReviewsLoading = true;
      storefrontState.reviewsError = false;
      storefrontState.isDemoEmpty = false;
    } else if (val === "demo_error") {
      storefrontState.isReviewsLoading = false;
      storefrontState.reviewsError = true;
      storefrontState.isDemoEmpty = false;
    } else if (val === "demo_empty") {
      storefrontState.isReviewsLoading = false;
      storefrontState.reviewsError = false;
      storefrontState.isDemoEmpty = true;
    } else if (val === "demo_normal") {
      storefrontState.isReviewsLoading = false;
      storefrontState.reviewsError = false;
      storefrontState.isDemoEmpty = false;
      storefrontState.reviewSort = "newest";
    } else {
      storefrontState.isReviewsLoading = false;
      storefrontState.reviewsError = false;
      storefrontState.isDemoEmpty = false;
      storefrontState.reviewSort = val;
    }
    renderCurrentPage();
  });

  // Xem thêm / Thu gọn nội dung đánh giá dài
  root.querySelectorAll("[data-expand-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const revId = btn.dataset.expandId;
      storefrontState.expandedCommentIds[revId] = !storefrontState.expandedCommentIds[revId];
      renderCurrentPage();
    });
  });

  // Bấm thumbnail ảnh đánh giá để phóng to (Lightbox)
  root.querySelectorAll("[data-photo-src]").forEach(btn => {
    btn.addEventListener("click", () => {
      storefrontState.lightboxPhotoSrc = btn.dataset.photoSrc;
      storefrontState.isLightboxOpen = true;
      renderCurrentPage();
    });
  });

  // Xem thêm đánh giá (Load more) & Thu gọn
  root.querySelector("#btn-load-more-reviews")?.addEventListener("click", () => {
    storefrontState.reviewVisibleCount += 3;
    renderCurrentPage();
  });

  root.querySelector("#btn-collapse-reviews")?.addEventListener("click", () => {
    storefrontState.reviewVisibleCount = 3;
    renderCurrentPage();
  });

  // Đặt lại bộ lọc sao khi không có kết quả
  root.querySelector("#btn-reset-review-filter")?.addEventListener("click", () => {
    storefrontState.reviewStarFilter = "all";
    storefrontState.reviewVisibleCount = 3;
    renderCurrentPage();
  });

  // Thử lại khi gặp lỗi tải đánh giá (mô phỏng)
  root.querySelector("#btn-retry-reviews")?.addEventListener("click", () => {
    storefrontState.reviewsError = false;
    storefrontState.isReviewsLoading = true;
    renderCurrentPage();
    setTimeout(() => {
      storefrontState.isReviewsLoading = false;
      storefrontState.reviewsError = false;
      storefrontState.isDemoEmpty = false;
      storefrontState.reviewSort = "newest";
      toast("Đã tải lại danh sách đánh giá thành công!");
      renderCurrentPage();
    }, 500);
  });

  // Bàn phím ESC để đóng Lightbox hoặc Modal Hỏi shop
  if (!window._sfEscBound) {
    window._sfEscBound = true;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (storefrontState.isLightboxOpen) {
          storefrontState.isLightboxOpen = false;
          storefrontState.lightboxPhotoSrc = null;
          renderCurrentPage();
        } else if (storefrontState.isAskShopOpen) {
          storefrontState.isAskShopOpen = false;
          renderCurrentPage();
        }
      }
    });
  }

  // 13. Hỏi Shop về sản phẩm (Tách biệt khỏi chat nội bộ KOL)
  root.querySelector("#btn-open-ask-shop")?.addEventListener("click", () => {
    storefrontState.isAskShopOpen = true;
    renderCurrentPage();
  });

  root.querySelector("#btn-close-ask-shop")?.addEventListener("click", () => {
    storefrontState.isAskShopOpen = false;
    renderCurrentPage();
  });

  root.querySelector("#sf-ask-shop-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    storefrontState.isAskShopOpen = false;
    toast("Shop Sora Skin đã nhận được câu hỏi và sẽ phản hồi qua SĐT/Zalo trong 15 phút!");
    renderCurrentPage();
  });

  // 14. Nút Chuyển hướng sang tra cứu
  root.querySelector("#btn-sf-to-tracking")?.addEventListener("click", () => {
    go("tracking");
  });

}
