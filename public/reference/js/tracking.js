/* ==========================================================================
   SCANMS - TRA CỨU ĐƠN HÀNG (TRACKING SCREEN) MODULE
   Tác giả: Nguyễn Đình Tuấn
   Đề tài: Hệ thống quản lý đội ngũ CTV bán hàng và tiếp thị liên kết (FA26SE032)
   ========================================================================== */

const productImage = "./assets/serum-hero-optimized.jpg";

// Danh mục đơn hàng mẫu hỗ trợ tra cứu toàn diện
const mockOrders = [
  {
    id: "IN23931",
    phone: "0903218456",
    customer: {
      name: "Nguyễn Hải Yến",
      phone: "0903 218 456",
      address: "Số 48 Đường số 7, KDC Cityland, Phường 7, Quận Gò Vấp, TP. Hồ Chí Minh"
    },
    status: "DELIVERED",
    statusLabel: "Giao hàng thành công",
    statusType: "success",
    product: {
      name: "Serum Vitamin C 15% Sáng Da & Mờ Thâm",
      sku: "SKIN-C15",
      qty: 2,
      price: 459000,
      img: productImage
    },
    voucher: {
      code: "MAIANH12",
      discount: 91800,
      label: "Mã tiếp thị KOL Lê Mai Anh (-10%)"
    },
    subtotal: 918000,
    shippingFee: 0,
    total: 826200,
    paymentMethod: "COD (Thanh toán khi nhận hàng)",
    paymentStatus: "Đã thanh toán đủ 826.200 ₫",
    carrier: {
      name: "Giao Hàng Tiết Kiệm (GHTK)",
      code: "88492019",
      badgeClass: "ghtk",
      hotline: "1900 6092",
      shipper: "Nguyễn Văn Hùng - 0912 345 678"
    },
    timeline: [
      { time: "03/09/2026, 14:15", title: "Shop đã tiếp nhận & đóng gói", desc: "Kho Sora Skin Củ Chi, TP.HCM", icon: "ph-check", done: true },
      { time: "04/09/2026, 08:30", title: "Bưu tá GHTK đã lấy hàng", desc: "Nhập kho trung chuyển Tân Bình", icon: "ph-check", done: true },
      { time: "05/09/2026, 09:10", title: "Đang vận chuyển liên quận", desc: "Xuất kho Gò Vấp - Bưu tá đang đi phát", icon: "ph-truck", done: true },
      { time: "05/09/2026, 15:45", title: "Giao hàng thành công", desc: "Khách hàng Nguyễn Hải Yến đã kiểm tra và ký nhận bưu phẩm", icon: "ph-check-circle", done: true, current: true }
    ],
    canReview: true,
    reviewEligibilityReason: "Đơn hàng đã được giao thành công vào 05/09/2026. Mời bạn chia sẻ trải nghiệm thực tế!"
  },
  {
    id: "IN23918",
    phone: "0988442107",
    customer: {
      name: "Trần Gia Hân",
      phone: "0988 442 107",
      address: "Tòa S2.03 Vinhomes Grand Park, Phường Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh"
    },
    status: "SHIPPING",
    statusLabel: "Đang vận chuyển",
    statusType: "warning",
    product: {
      name: "Serum Vitamin C 15% Sáng Da & Mờ Thâm",
      sku: "SKIN-C15",
      qty: 1,
      price: 459000,
      img: productImage
    },
    voucher: {
      code: "NHATXINH10",
      discount: 45900,
      label: "Mã giảm giá KOL Trần Văn Nhật (-10%)"
    },
    subtotal: 459000,
    shippingFee: 25000,
    total: 438100,
    paymentMethod: "Chuyển khoản VietQR / Napas247",
    paymentStatus: "Đã thanh toán trực tuyến",
    carrier: {
      name: "Giao Hàng Nhanh (GHN)",
      code: "GHN993021",
      badgeClass: "ghn",
      hotline: "1900 636677",
      shipper: "Lê Minh Tuấn - 0978 654 321"
    },
    timeline: [
      { time: "06/09/2026, 11:20", title: "Shop đã đóng gói hoàn tất", desc: "Kho Sora Skin Củ Chi", icon: "ph-check", done: true },
      { time: "07/09/2026, 07:45", title: "Bưu cục GHN đã nhập kho trung chuyển", desc: "Kho phân loại Thủ Đức", icon: "ph-check", done: true },
      { time: "Hôm nay, 08:30", title: "Bưu tá đang trên đường đi phát", desc: "Bưu tá Lê Minh Tuấn đang liên hệ phát hàng", icon: "ph-truck", done: false, current: true },
      { time: "Dự kiến chiều nay 08/09/2026", title: "Giao đến người nhận", desc: "Quý khách vui lòng để ý điện thoại", icon: "ph-house-line", done: false }
    ],
    canReview: false,
    reviewEligibilityReason: "Đơn hàng đang trên đường vận chuyển. Form đánh giá sẽ tự động mở sau khi đơn hàng được giao thành công."
  },
  {
    id: "IN23845",
    phone: "0912508866",
    customer: {
      name: "Võ Thanh Tâm",
      phone: "0912 508 866",
      address: "Số 88/12 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
    },
    status: "FAILED",
    statusLabel: "Giao thất bại / Hủy đơn",
    statusType: "danger",
    product: {
      name: "Serum Vitamin C 15% (Combo Chăm Sóc Da)",
      sku: "SKIN-C15",
      qty: 1,
      price: 748000,
      img: productImage
    },
    voucher: null,
    subtotal: 748000,
    shippingFee: 0,
    total: 748000,
    paymentMethod: "COD (Thanh toán khi nhận hàng)",
    paymentStatus: "Chưa thanh toán (Hủy đơn)",
    carrier: {
      name: "Viettel Post",
      code: "VT839102",
      badgeClass: "viettel",
      hotline: "1900 8095",
      shipper: "Trần Đình Trọng - 0982 111 222"
    },
    timeline: [
      { time: "30/08/2026, 09:00", title: "Shop đã đóng gói & chuyển Viettel Post", desc: "Bưu cục Viettel Post Củ Chi", icon: "ph-check", done: true },
      { time: "31/08/2026, 14:20", title: "Phát hàng lần 1 không thành công", desc: "Người nhận bận việc, hẹn phát lại ngày hôm sau", icon: "ph-x-circle", done: true },
      { time: "01/09/2026, 16:30", title: "Phát hàng lần 2 không thành công", desc: "Không liên lạc được với số điện thoại người nhận", icon: "ph-x-circle", done: true },
      { time: "02/09/2026, 11:00", title: "Khách hủy đơn / Bưu kiện hoàn về Shop", desc: "Khách xác nhận hủy đơn. Bưu kiện đã nhập kho hoàn trả của Shop Sora Skin.", icon: "ph-arrow-u-down-left", done: true, failed: true }
    ],
    canReview: false,
    reviewEligibilityReason: "Đơn hàng đã bị hủy hoặc hoàn trả. Chỉ các đơn hàng giao thành công mới đủ điều kiện gửi đánh giá."
  },
  {
    id: "SMP-9821",
    phone: "0987123456",
    customer: {
      name: "Trần Văn Nhật (KOL)",
      phone: "0987 123 456",
      address: "12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh"
    },
    status: "SHIPPING",
    statusLabel: "Đang giao quà mẫu KOL",
    statusType: "warning",
    product: {
      name: "Serum Vitamin C 15% (Hàng mẫu trải nghiệm)",
      sku: "SMP-SKIN-C15",
      qty: 1,
      price: 0,
      img: productImage
    },
    voucher: {
      code: "KOL-GIFT",
      discount: 459000,
      label: "Tài trợ 100% từ Shop Sora Skin"
    },
    subtotal: 459000,
    shippingFee: 0,
    total: 0,
    paymentMethod: "Sản phẩm mẫu trải nghiệm (Miễn phí)",
    paymentStatus: "Tài trợ 100%",
    carrier: {
      name: "Giao Hàng Tiết Kiệm (GHTK)",
      code: "88992211",
      badgeClass: "ghtk",
      hotline: "1900 6092",
      shipper: "Nguyễn Văn Hùng - 0912 345 678"
    },
    timeline: [
      { time: "02/09/2026, 09:42", title: "KOL gửi yêu cầu xin sản phẩm mẫu", desc: "Đề xuất video routine chăm sáng", icon: "ph-check", done: true },
      { time: "03/09/2026, 14:15", title: "Shop Sora Skin đã duyệt gửi mẫu", desc: "Đã xuất kho mẫu Củ Chi", icon: "ph-check", done: true },
      { time: "04/09/2026, 08:30", title: "Bưu tá GHTK đã nhận kiện hàng", desc: "Mã vận đơn bưu phẩm 88992211", icon: "ph-truck", done: false, current: true },
      { time: "Dự kiến 08/09/2026", title: "Chờ KOL nhận hàng & làm nội dung", desc: "Cam kết lên video review trong 7 ngày", icon: "ph-package", done: false }
    ],
    canReview: false,
    reviewEligibilityReason: "Đơn hàng mẫu đang vận chuyển. KOL vui lòng xác nhận 'Đã nhận mẫu' tại mục Hàng Mẫu trước khi đánh giá."
  }
];

const STORAGE_KEY_REVIEWS = "scanms_prototype_tracking_reviews";
function loadSavedReviews() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_REVIEWS) || "{}");
  } catch {
    return {};
  }
}
function saveReviewsToStorage(reviews) {
  try {
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
  } catch {}
}

// State quản lý màn hình Tra cứu
const trackingState = {
  query: "IN23931",
  activeOrder: mockOrders[0],
  searchState: "found", // 'idle' | 'searching' | 'found' | 'not_found'
  isUnlockedPII: false,
  reviews: loadSavedReviews(),
  currentRating: 5,
  reviewComment: "",
  reviewImages: [],
  isSubmittingReview: false
};

// Masking helpers bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP)
function maskName(name) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0] + "***";
  return parts.map((p, idx) => (idx === 0 || idx === parts.length - 1) ? p[0] + "***" : p[0] + "*").join(" ");
}

function maskPhone(phone) {
  if (!phone) return "";
  const clean = phone.replace(/\s+/g, "");
  if (clean.length < 7) return clean;
  return clean.slice(0, 4) + " *** " + clean.slice(-3);
}

function maskAddress(addr) {
  if (!addr) return "";
  const parts = addr.split(",");
  if (parts.length <= 2) return "Số ** ***, " + addr.slice(-15);
  return "Số ** ***, " + parts.slice(-3).join(",").trim();
}

function formatMoney(amount) {
  return (amount || 0).toLocaleString("vi-VN") + " ₫";
}

const starLabels = {
  1: "Rất tệ",
  2: "Chưa hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Rất ưng ý"
};

// Render giao diện Tra cứu
export function trackingScreen() {
  const order = trackingState.activeOrder;
  const isFound = trackingState.searchState === "found" && order;
  const isSearching = trackingState.searchState === "searching";
  const isNotFound = trackingState.searchState === "not_found";

  // Quick pills dữ liệu
  const quickPills = [
    { id: "IN23931", label: "Đã giao thành công", badge: "Có thể đánh giá", active: trackingState.query === "IN23931" },
    { id: "IN23918", label: "Đang vận chuyển", badge: "Đang giao", active: trackingState.query === "IN23918" },
    { id: "IN23845", label: "Đã hủy / Hoàn trả", badge: "Giao thất bại", active: trackingState.query === "IN23845" },
    { id: "SMP-9821", label: "Hàng mẫu KOL", badge: "GHTK 88992211", active: trackingState.query === "SMP-9821" || trackingState.query === "88992211" }
  ];

  return `
    <div class="screen-header">
      <div>
        <h1 style="margin:0;font-size:24px;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:10px">
          <i class="ph ph-map-trifold" style="color:var(--brand)"></i> Tra cứu đơn hàng & Hành trình bưu cục
        </h1>
        <p style="margin:6px 0 0;color:var(--muted);font-size:14px">
          Khách mua hoặc đối tác có thể theo dõi tiến độ vận chuyển trực tiếp, bảo mật thông tin cá nhân và đánh giá sau khi nhận hàng.
        </p>
      </div>
      <div>
        <button class="btn secondary" id="btn-contact-shop-header" title="Kết nối trực tiếp hỗ trợ">
          <i class="ph ph-chats-circle"></i> Liên hệ Shop Sora Skin
        </button>
      </div>
    </div>

    <!-- Thanh tìm kiếm chính & Quick Pills -->
    <section class="card tracking-search-card">
      <form class="tracking-search-form" id="tracking-search-form">
        <div class="tracking-search-input-wrap">
          <i class="ph ph-magnifying-glass search-icon"></i>
          <input 
            type="text" 
            id="tracking-query-input" 
            class="input" 
            placeholder="Nhập mã đơn hàng (VD: IN23931, IN23918) hoặc số điện thoại đặt mua..." 
            value="${escapeHtml(trackingState.query)}" 
            required 
          />
          ${trackingState.query ? `<button type="button" class="tracking-clear-btn" id="btn-clear-tracking-query" title="Xóa"><i class="ph ph-x"></i></button>` : ""}
        </div>
        <button type="submit" class="btn" id="btn-submit-track" style="white-space:nowrap;padding:0 24px">
          <i class="ph ph-magnifying-glass"></i> Tra cứu ngay
        </button>
      </form>

      <div class="tracking-quick-bar">
        <span class="tracking-quick-label"><i class="ph ph-lightning"></i> Thử nhanh ca mẫu:</span>
        ${quickPills.map(p => `
          <button type="button" class="tracking-pill ${p.active ? 'active' : ''}" data-track-code="${p.id}">
            <strong>${p.id}</strong>
            <span>${p.label}</span>
            <span class="pill-badge">${p.badge}</span>
          </button>
        `).join("")}
      </div>
    </section>

    <!-- Trạng thái Loading -->
    ${isSearching ? `
      <div class="tracking-loading">
        <div class="tracking-spinner"></div>
        <h3 style="margin:0 0 6px;font-size:16px;color:var(--ink)">Đang truy vấn hành trình bưu cục...</h3>
        <p style="margin:0;color:var(--muted);font-size:13px">Hệ thống đang đồng bộ dữ liệu theo thời gian thực từ hãng vận chuyển.</p>
      </div>
    ` : ""}

    <!-- Trạng thái Không tìm thấy (Not Found) -->
    ${isNotFound ? `
      <div class="tracking-not-found">
        <div class="tracking-not-found-icon">
          <i class="ph ph-magnifying-glass"></i>
        </div>
        <h3 style="margin:0 0 8px;font-size:18px;color:var(--ink)">Không tìm thấy thông tin đơn hàng</h3>
        <p style="margin:0 auto 18px;max-width:480px;color:var(--muted);font-size:13.5px;line-height:1.5">
          Không tìm thấy đơn hàng nào khớp với từ khóa <strong>"${escapeHtml(trackingState.query)}"</strong>. Vui lòng kiểm tra lại số điện thoại hoặc mã đơn hàng trên hóa đơn đặt mua.
        </p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn secondary" id="btn-retry-notfound"><i class="ph ph-arrow-counter-clockwise"></i> Thử lại với mã khác</button>
          <button class="btn" data-track-code="IN23931"><i class="ph ph-check"></i> Xem đơn mẫu IN23931</button>
        </div>
      </div>
    ` : ""}

    <!-- Trạng thái Tìm thấy đơn hàng -->
    ${isFound ? renderOrderDetails(order) : ""}
  `;
}

// Render chi tiết đơn hàng khi tìm thấy
function renderOrderDetails(order) {
  const isDelivered = order.status === "DELIVERED";
  const isFailed = order.status === "FAILED";
  const isShipping = order.status === "SHIPPING";

  const customerName = trackingState.isUnlockedPII ? order.customer.name : maskName(order.customer.name);
  const customerPhone = trackingState.isUnlockedPII ? order.customer.phone : maskPhone(order.customer.phone);
  const customerAddress = trackingState.isUnlockedPII ? order.customer.address : maskAddress(order.customer.address);

  // Review state
  const submittedReview = trackingState.reviews[order.id];

  return `
    <div class="split equal" style="margin-top:20px">
      <!-- Cột trái: Thông tin đơn hàng & Bảo mật người nhận -->
      <section class="card">
        <div class="card-title">
          <div>
            <h2 style="margin:0;font-size:17px;display:flex;align-items:center;gap:8px">
              <span>Đơn hàng #${order.id}</span>
              <span class="badge ${order.statusType}" style="font-size:11px;padding:2px 8px">
                ${order.statusLabel}
              </span>
            </h2>
            <small style="color:var(--muted)">Phương thức: ${order.paymentMethod}</small>
          </div>
          <span class="mono" style="font-size:12px;color:var(--muted)">Cập nhật vừa xong</span>
        </div>

        <!-- Khối Bảo vệ Thông tin cá nhân (PII Protection) -->
        <div class="tracking-pii-box">
          <div class="tracking-pii-head">
            <span class="tracking-pii-title">
              <i class="ph ph-shield-check"></i> Bảo mật thông tin người nhận (Nghị định 13)
            </span>
            <button class="tracking-pii-toggle-btn" id="btn-toggle-pii" title="${trackingState.isUnlockedPII ? 'Ẩn thông tin bảo mật' : 'Xác thực để xem thông tin đầy đủ'}">
              <i class="ph ${trackingState.isUnlockedPII ? 'ph-eye-slash' : 'ph-lock-key-open'}"></i>
              ${trackingState.isUnlockedPII ? "Ẩn bảo mật" : "Xem đầy đủ"}
            </button>
          </div>
          <div class="tracking-pii-grid">
            <div class="tracking-pii-item">
              <small>Người nhận hàng:</small>
              <strong>${customerName}</strong>
            </div>
            <div class="tracking-pii-item">
              <small>Số điện thoại:</small>
              <strong class="${trackingState.isUnlockedPII ? '' : 'mono-masked'}">${customerPhone}</strong>
            </div>
            <div class="tracking-pii-item" style="grid-column: span 3">
              <small>Địa chỉ giao hàng:</small>
              <strong style="line-height:1.35">${customerAddress}</strong>
            </div>
          </div>
        </div>

        <!-- Chi tiết sản phẩm trong đơn -->
        <div class="tracking-product-card">
          <img class="product-thumb" src="${order.product.img}" alt="${escapeHtml(order.product.name)}" />
          <div class="tracking-product-info">
            <h4>${escapeHtml(order.product.name)}</h4>
            <p>Mã sản phẩm: <span class="mono">${order.product.sku}</span> • Số lượng: <strong>x${order.product.qty}</strong></p>
          </div>
          <div class="tracking-product-price">
            <strong>${formatMoney(order.product.price * order.product.qty)}</strong>
            <small>${formatMoney(order.product.price)} / sản phẩm</small>
          </div>
        </div>

        <!-- Tổng kết tài chính / Khuyến mãi tiếp thị -->
        <div class="tracking-finance-summary">
          <div class="tracking-finance-row">
            <span>Tạm tính hàng hóa:</span>
            <strong>${formatMoney(order.subtotal)}</strong>
          </div>
          ${order.voucher ? `
            <div class="tracking-finance-row">
              <span class="tracking-voucher-tag"><i class="ph ph-tag"></i> ${order.voucher.label}:</span>
              <strong style="color:#d97706">-${formatMoney(order.voucher.discount)}</strong>
            </div>
          ` : ""}
          <div class="tracking-finance-row">
            <span>Phí vận chuyển bưu điện:</span>
            <span>${order.shippingFee === 0 ? '<strong style="color:#059669">Miễn phí</strong>' : formatMoney(order.shippingFee)}</span>
          </div>
          <div class="tracking-finance-row total">
            <span>Tổng số tiền thanh toán:</span>
            <strong>${formatMoney(order.total)}</strong>
          </div>
        </div>

        <!-- Hãng vận chuyển & Mã vận đơn -->
        <div class="tracking-carrier-card">
          <div class="carrier-brand-wrap">
            <div class="carrier-logo-badge ${order.carrier.badgeClass}">
              <i class="ph ph-truck"></i>
            </div>
            <div class="carrier-details">
              <strong>${order.carrier.name}</strong>
              <p>Mã vận đơn: <span class="mono" style="font-weight:700">${order.carrier.code}</span></p>
            </div>
          </div>
          <div class="carrier-actions">
            <button class="btn-copy-code" id="btn-copy-waybill" data-code="${order.carrier.code}" title="Sao chép mã vận đơn">
              <i class="ph ph-copy"></i> Sao chép
            </button>
            <a href="tel:${order.carrier.hotline}" class="btn-copy-code" title="Gọi tổng đài bưu điện">
              <i class="ph ph-phone"></i> ${order.carrier.hotline}
            </a>
          </div>
        </div>

        <!-- Nút hành động bổ trợ -->
        <div class="tracking-actions-bar">
          <button class="btn secondary" id="btn-contact-shop-order">
            <i class="ph ph-chat-circle-dots"></i> Nhắn tin Shop Sora Skin
          </button>
          <button class="btn" id="btn-reorder" data-order-id="${order.id}">
            <i class="ph ph-arrow-counter-clockwise"></i> Đặt mua lại sản phẩm
          </button>
        </div>
      </section>

      <!-- Cột phải: Timeline Hành trình giao hàng -->
      <section class="card">
        <div class="card-title">
          <h2>Hành trình vận chuyển chi tiết</h2>
          <span class="badge ${order.statusType}">${order.statusLabel}</span>
        </div>

        <!-- Timeline các bước -->
        <div class="timeline" style="margin-top:16px">
          ${order.timeline.map((item) => `
            <div class="timeline-item ${item.failed ? 'failed' : ''} ${item.current ? 'current' : ''} ${!item.done && !item.current ? 'pending' : ''}">
              <span class="timeline-mark">
                <i class="ph ${item.icon}"></i>
              </span>
              <div>
                <h3 style="font-size:14px;margin:0 0 3px">${item.title}</h3>
                <p style="margin:0;color:var(--muted);font-size:12.5px">${item.desc}</p>
                <small class="mono" style="display:block;margin-top:3px;color:var(--muted);font-size:11.5px">${item.time}</small>
              </div>
            </div>
          `).join("")}
        </div>

        <!-- Banner cảnh báo sự cố nếu có -->
        ${isFailed ? `
          <div class="timeline-alert-box">
            <i class="ph ph-warning-circle" style="font-size:20px;flex-shrink:0;color:#dc2626"></i>
            <div>
              <strong style="display:block;margin-bottom:2px">Sự cố giao hàng: Đơn hàng đã hoàn về Shop</strong>
              Do bưu tá đã liên hệ 2 lần không thành công và khách hàng xác nhận hủy đơn qua điện thoại. Nếu bạn có nhu cầu nhận lại bưu phẩm, vui lòng bấm nút "Nhắn tin Shop Sora Skin" để được hỗ trợ giao lại miễn phí.
            </div>
          </div>
        ` : ""}

        ${isDelivered ? `
          <div class="timeline-success-box">
            <i class="ph ph-check-circle" style="font-size:20px;flex-shrink:0;color:#059669"></i>
            <div>
              <strong>Đơn hàng đã hoàn tất!</strong> Bưu phẩm đã được giao an toàn đến tận tay người nhận.
            </div>
          </div>
        ` : ""}
      </section>
    </div>

    <!-- Khối Đánh giá sau khi nhận hàng (Chỉ mở khi đã giao) -->
    <section class="card tracking-review-card" style="margin-top:20px">
      <div class="card-title">
        <div>
          <h2 style="margin:0;font-size:17px;display:flex;align-items:center;gap:8px">
            <i class="ph ph-star" style="color:#f59e0b"></i> Đánh giá chất lượng sản phẩm
          </h2>
          <small style="color:var(--muted)">Đánh giá của bạn giúp cộng đồng KOL & khách hàng có trải nghiệm mua sắm minh bạch.</small>
        </div>
        ${order.canReview ? `
          <span class="badge success"><i class="ph ph-check-circle"></i> Đủ điều kiện đánh giá</span>
        ` : `
          <span class="badge warning"><i class="ph ph-lock-key"></i> Đang tạm khóa</span>
        `}
      </div>

      <!-- Trạng thái 1: Không đủ điều kiện đánh giá (Đang giao hoặc Bị hủy) -->
      ${!order.canReview ? `
        <div class="review-locked-banner">
          <div class="review-locked-icon ${isFailed ? 'danger' : ''}">
            <i class="ph ${isFailed ? 'ph-prohibit' : 'ph-lock-key'}"></i>
          </div>
          <div class="review-locked-text">
            <strong>${isFailed ? 'Đơn hàng không đủ điều kiện đánh giá' : 'Form đánh giá chỉ mở sau khi nhận hàng'}</strong>
            <p>${order.reviewEligibilityReason}</p>
          </div>
        </div>
      ` : ""}

      <!-- Trạng thái 2: Đã gửi đánh giá trước đó -->
      ${order.canReview && submittedReview ? `
        <div class="review-submitted-card">
          <div class="review-submitted-head">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="avatar" style="width:36px;height:36px;background:var(--brand);color:#fff;border-radius:50%;display:grid;place-items:center;font-weight:700">
                ${customerName[0] || 'K'}
              </span>
              <div>
                <strong style="display:block;font-size:14px">${customerName}</strong>
                <div class="review-submitted-stars">
                  ${[1,2,3,4,5].map(s => `<i class="ph-fill ph-star" style="color:${s <= submittedReview.rating ? '#f59e0b' : '#cbd5e1'}"></i>`).join("")}
                  <span style="font-size:12px;font-weight:700;margin-left:6px;color:#d97706">${starLabels[submittedReview.rating]}</span>
                </div>
              </div>
            </div>
            <span class="badge success"><i class="ph ph-seal-check"></i> Đã chứng thực người mua</span>
          </div>

          <p class="review-submitted-body">${escapeHtml(submittedReview.comment)}</p>

          ${submittedReview.images && submittedReview.images.length > 0 ? `
            <div class="review-submitted-photos">
              ${submittedReview.images.map(imgSrc => `<img src="${imgSrc}" alt="Ảnh review thực tế" />`).join("")}
            </div>
          ` : ""}

          <div class="review-submitted-footer">
            <span><i class="ph ph-clock"></i> Đã đánh giá lúc: ${submittedReview.submittedAt}</span>
            <button class="text-btn" id="btn-edit-review" style="font-size:12.5px;color:var(--brand)">
              <i class="ph ph-pencil-simple"></i> Chỉnh sửa nhận xét
            </button>
          </div>
        </div>
      ` : ""}

      <!-- Trạng thái 3: Đủ điều kiện và Đang mở Form đánh giá -->
      ${order.canReview && !submittedReview ? `
        <form id="tracking-review-form" style="margin-top:14px">
          <!-- Chọn số sao tương tác -->
          <label style="font-size:13px;font-weight:650;color:var(--ink);display:block">
            Mức độ hài lòng của bạn về sản phẩm:
          </label>
          <div class="review-interactive-stars" id="review-stars-wrap">
            ${[1, 2, 3, 4, 5].map(star => `
              <button 
                type="button" 
                class="star-btn ${star <= trackingState.currentRating ? 'active' : ''}" 
                data-star="${star}"
                title="${starLabels[star]}"
              >
                <i class="ph${star <= trackingState.currentRating ? '-fill' : ''} ph-star"></i>
              </button>
            `).join("")}
            <span class="star-rating-label" id="star-rating-label">${starLabels[trackingState.currentRating]}</span>
          </div>

          <!-- Nhận xét Textarea với bộ đếm ký tự -->
          <div class="review-textarea-wrap">
            <label style="font-size:13px;font-weight:650;color:var(--ink);display:block;margin-bottom:6px">
              Nhận xét thực tế (tối thiểu 10 ký tự):
            </label>
            <textarea 
              class="textarea" 
              id="review-comment-textarea" 
              placeholder="Chia sẻ trải nghiệm sử dụng serum (kết cấu, mùi hương, khả năng thẩm thấu, hiệu quả làm sáng da)..." 
              maxlength="500" 
              rows="3"
            >${escapeHtml(trackingState.reviewComment)}</textarea>
            <span class="review-char-count" id="review-char-count">
              ${trackingState.reviewComment.length} / 500 ký tự (tối thiểu 10)
            </span>
          </div>

          <!-- Tải ảnh review thực tế -->
          <div class="review-upload-section">
            <span class="review-upload-label">
              <i class="ph ph-camera"></i> Đính kèm hình ảnh thực tế (tối đa 3 ảnh):
            </span>
            <div class="review-photos-grid" id="review-photos-grid">
              ${trackingState.reviewImages.map((imgSrc, idx) => `
                <div class="review-photo-thumb-wrap">
                  <img src="${imgSrc}" alt="Ảnh trải nghiệm ${idx + 1}" />
                  <button type="button" class="review-photo-delete-btn" data-delete-img="${idx}" title="Xóa ảnh">
                    <i class="ph ph-x"></i>
                  </button>
                </div>
              `).join("")}

              ${trackingState.reviewImages.length < 3 ? `
                <label class="review-upload-trigger-btn" title="Chọn ảnh tải lên">
                  <i class="ph ph-cloud-arrow-up"></i>
                  <span>Thêm ảnh</span>
                  <input type="file" id="review-photo-file-input" accept="image/*" style="display:none" />
                </label>
              ` : ""}
            </div>
          </div>

          <!-- Nút gửi đánh giá -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:18px;padding-top:14px;border-top:1px solid var(--line)">
            <div style="font-size:12px;color:var(--muted);display:flex;align-items:center;gap:6px">
              <i class="ph ph-shield-check" style="color:var(--brand)"></i> Đánh giá được kiểm duyệt tự động chống spam & review ảo.
            </div>
            <button type="submit" class="btn" id="btn-submit-review" ${trackingState.isSubmittingReview ? 'disabled' : ''}>
              ${trackingState.isSubmittingReview ? `<i class="ph ph-spinner spin-icon"></i> Đang gửi...` : `<i class="ph ph-paper-plane-tilt"></i> Gửi đánh giá ngay`}
            </button>
          </div>
        </form>
      ` : ""}
    </section>
  `;
}

// Bắt sự kiện tương tác của module
export function bindTracking(root, helpers) {
  const toast = helpers?.toast || window.toast || ((m) => alert(m));
  const go = helpers?.go || window.go || (() => {});
  const renderCurrentPage = helpers?.renderCurrentPage || window.renderCurrentPage || (() => {});

  // Form tìm kiếm
  const searchForm = root.querySelector("#tracking-search-form");
  const searchInput = root.querySelector("#tracking-query-input");

  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = searchInput?.value.trim() || "";
    executeSearch(q, toast, renderCurrentPage);
  });

  // Clear query button
  root.querySelector("#btn-clear-tracking-query")?.addEventListener("click", () => {
    trackingState.query = "";
    if (searchInput) {
      searchInput.value = "";
      searchInput.focus();
    }
  });

  // Click quick pills
  root.querySelectorAll("[data-track-code]").forEach(pill => {
    pill.addEventListener("click", () => {
      const code = pill.dataset.trackCode;
      trackingState.query = code;
      executeSearch(code, toast, renderCurrentPage);
    });
  });

  // Nút thử lại khi không tìm thấy
  root.querySelector("#btn-retry-notfound")?.addEventListener("click", () => {
    trackingState.query = "";
    trackingState.searchState = "idle";
    renderCurrentPage();
    setTimeout(() => {
      document.querySelector("#tracking-query-input")?.focus();
    }, 50);
  });

  // Nút mở/ẩn PII bảo mật
  root.querySelector("#btn-toggle-pii")?.addEventListener("click", () => {
    if (trackingState.isUnlockedPII) {
      trackingState.isUnlockedPII = false;
      renderCurrentPage();
      toast("Đã bật chế độ che thông tin bảo mật người nhận.");
    } else {
      openPiiVerifyModal(toast, renderCurrentPage);
    }
  });

  // Nút sao chép mã vận đơn
  root.querySelector("#btn-copy-waybill")?.addEventListener("click", (e) => {
    const code = e.currentTarget.dataset.code;
    if (code) {
      navigator.clipboard?.writeText(code).catch(() => {});
      toast(`Đã sao chép mã vận đơn [${code}] vào clipboard!`);
    }
  });

  // Nút liên hệ Shop Sora Skin
  const openContact = () => {
    window.__SCANMS_CHAT_CONTEXT__ = {
      orderId: trackingState.activeOrder ? trackingState.activeOrder.id : "IN23931",
      productName: trackingState.activeOrder ? trackingState.activeOrder.product.name : "Serum Vitamin C 15%",
      status: trackingState.activeOrder ? trackingState.activeOrder.statusLabel : "Đang giao",
      image: productImage
    };
    go("chat");
    toast("Đã mở kết nối trò chuyện với Shop Sora Skin.");
  };

  root.querySelector("#btn-contact-shop-header")?.addEventListener("click", openContact);
  root.querySelector("#btn-contact-shop-order")?.addEventListener("click", openContact);

  // Nút đặt mua lại
  root.querySelector("#btn-reorder")?.addEventListener("click", () => {
    go("storefront");
    toast("Đã thêm Serum Vitamin C 15% vào giỏ hàng và mở trang mua hàng!");
  });

  // Star Rating Interaction
  const starBtns = root.querySelectorAll("#review-stars-wrap .star-btn");
  const starLabelEl = root.querySelector("#star-rating-label");

  starBtns.forEach(btn => {
    const starVal = parseInt(btn.dataset.star, 10);

    // Hover effect
    btn.addEventListener("mouseenter", () => {
      starBtns.forEach(b => {
        const v = parseInt(b.dataset.star, 10);
        b.classList.toggle("hovered", v <= starVal);
        b.querySelector("i").className = v <= starVal ? "ph-fill ph-star" : "ph ph-star";
      });
      if (starLabelEl) starLabelEl.textContent = starLabels[starVal];
    });

    btn.addEventListener("mouseleave", () => {
      starBtns.forEach(b => {
        const v = parseInt(b.dataset.star, 10);
        b.classList.remove("hovered");
        b.classList.toggle("active", v <= trackingState.currentRating);
        b.querySelector("i").className = v <= trackingState.currentRating ? "ph-fill ph-star" : "ph ph-star";
      });
      if (starLabelEl) starLabelEl.textContent = starLabels[trackingState.currentRating];
    });

    // Click to select star
    btn.addEventListener("click", () => {
      trackingState.currentRating = starVal;
      starBtns.forEach(b => {
        const v = parseInt(b.dataset.star, 10);
        b.classList.toggle("active", v <= starVal);
        b.querySelector("i").className = v <= starVal ? "ph-fill ph-star" : "ph ph-star";
      });
      if (starLabelEl) starLabelEl.textContent = starLabels[starVal];
    });
  });

  // Textarea input & character counter
  const textarea = root.querySelector("#review-comment-textarea");
  const charCountEl = root.querySelector("#review-char-count");

  textarea?.addEventListener("input", (e) => {
    const val = e.target.value;
    trackingState.reviewComment = val;
    if (charCountEl) {
      charCountEl.textContent = `${val.length} / 500 ký tự (tối thiểu 10)`;
      charCountEl.classList.toggle("warning", val.length > 0 && val.length < 10);
    }
  });

  // Image upload
  const fileInput = root.querySelector("#review-photo-file-input");
  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast("Dung lượng ảnh không được vượt quá 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (trackingState.reviewImages.length < 3) {
        trackingState.reviewImages.push(evt.target.result);
        renderCurrentPage();
        toast("Đã thêm ảnh đánh giá thực tế.");
      }
    };
    reader.readAsDataURL(file);
  });

  // Delete uploaded photo
  root.querySelectorAll("[data-delete-img]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.currentTarget.dataset.deleteImg, 10);
      if (!isNaN(idx) && idx >= 0) {
        trackingState.reviewImages.splice(idx, 1);
        renderCurrentPage();
        toast("Đã gỡ ảnh đánh giá.");
      }
    });
  });

  // Submit Review Form
  root.querySelector("#tracking-review-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const comment = trackingState.reviewComment.trim();

    if (comment.length < 10) {
      toast("Vui lòng nhập nhận xét ít nhất 10 ký tự để chia sẻ trải nghiệm có ích.");
      document.querySelector("#review-comment-textarea")?.focus();
      return;
    }

    trackingState.isSubmittingReview = true;
    renderCurrentPage();

    setTimeout(() => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

      if (trackingState.activeOrder) {
        trackingState.reviews[trackingState.activeOrder.id] = {
          rating: trackingState.currentRating,
          comment: comment,
          images: [...trackingState.reviewImages],
          submittedAt: timeStr
        };
        saveReviewsToStorage(trackingState.reviews);
      }

      trackingState.isSubmittingReview = false;
      renderCurrentPage();
      toast("Cảm ơn bạn! Đánh giá đã được gửi và ghi nhận chứng thực thành công.");
    }, 600);
  });

  // Sửa đánh giá đã gửi
  root.querySelector("#btn-edit-review")?.addEventListener("click", () => {
    if (trackingState.activeOrder) {
      const rev = trackingState.reviews[trackingState.activeOrder.id];
      if (rev) {
        trackingState.currentRating = rev.rating;
        trackingState.reviewComment = rev.comment;
        trackingState.reviewImages = [...rev.images];
        delete trackingState.reviews[trackingState.activeOrder.id];
        saveReviewsToStorage(trackingState.reviews);
        renderCurrentPage();
        toast("Bạn có thể cập nhật lại số sao và nhận xét.");
      }
    }
  });
}

// Logic thực thi tìm kiếm
function executeSearch(rawQuery, toast, renderCurrentPage) {
  const q = (rawQuery || "").trim();
  trackingState.query = q;

  if (!q) {
    trackingState.searchState = "idle";
    trackingState.activeOrder = null;
    renderCurrentPage();
    return;
  }

  // Bật loading mô phỏng kết nối API bưu tá
  trackingState.searchState = "searching";
  renderCurrentPage();

  setTimeout(() => {
    const cleanQ = q.toLowerCase().replace(/[^a-z0-9]/g, "");
    const found = mockOrders.find(o => {
      const cleanId = o.id.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanPhone = o.phone.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanCarrierCode = o.carrier.code.toLowerCase().replace(/[^a-z0-9]/g, "");
      return cleanId.includes(cleanQ) || cleanPhone.includes(cleanQ) || cleanCarrierCode.includes(cleanQ);
    });

    if (found) {
      trackingState.activeOrder = found;
      trackingState.searchState = "found";
      toast(`Đã tìm thấy đơn hàng #${found.id} (${found.statusLabel}).`);
    } else {
      trackingState.activeOrder = null;
      trackingState.searchState = "not_found";
    }
    renderCurrentPage();
  }, 350);
}

// Modal xác minh bảo mật PII bằng OTP
function openPiiVerifyModal(toast, renderCurrentPage) {
  const modalRoot = document.querySelector("#modal-root");
  if (!modalRoot) return;

  const activeOrder = trackingState.activeOrder;
  const last4Digits = activeOrder ? activeOrder.phone.slice(-4) : "8456";

  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="pii-modal-backdrop">
      <section class="modal" style="max-width:440px" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div>
            <h2 style="margin:0;font-size:18px;display:flex;align-items:center;gap:8px">
              <i class="ph ph-shield-check" style="color:var(--brand)"></i> Xác thực Bảo mật Thông tin
            </h2>
            <p style="margin:6px 0 0;font-size:13px;color:var(--muted)">
              Để bảo vệ quyền riêng tư theo Nghị định 13/2023/NĐ-CP, vui lòng nhập mã OTP 4 số đã gửi về SĐT đuôi <strong>***${last4Digits}</strong>.
            </p>
          </div>
          <button class="icon-btn" id="btn-close-pii-modal" aria-label="Đóng"><i class="ph ph-x"></i></button>
        </div>

        <div style="margin:20px 0 10px">
          <div class="otp-input-boxes">
            <input type="text" maxlength="1" class="otp-box" value="8" />
            <input type="text" maxlength="1" class="otp-box" value="2" />
            <input type="text" maxlength="1" class="otp-box" value="6" />
            <input type="text" maxlength="1" class="otp-box" value="9" />
          </div>
          <small style="display:block;text-align:center;color:var(--brand);font-weight:600">
            <i class="ph ph-check-circle"></i> Mã OTP demo: 8269
          </small>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button class="btn secondary" id="btn-cancel-pii" style="flex:1">Hủy bỏ</button>
          <button class="btn" id="btn-confirm-pii" style="flex:1">
            <i class="ph ph-lock-key-open"></i> Xác nhận mở khóa
          </button>
        </div>
      </section>
    </div>
  `;

  const closeModal = () => {
    modalRoot.innerHTML = "";
  };

  document.querySelector("#btn-close-pii-modal")?.addEventListener("click", closeModal);
  document.querySelector("#btn-cancel-pii")?.addEventListener("click", closeModal);
  document.querySelector("#pii-modal-backdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "pii-modal-backdrop") closeModal();
  });

  document.querySelector("#btn-confirm-pii")?.addEventListener("click", () => {
    trackingState.isUnlockedPII = true;
    closeModal();
    renderCurrentPage();
    toast("Xác thực OTP thành công! Đã hiển thị đầy đủ tên, số điện thoại và địa chỉ giao hàng.");
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
