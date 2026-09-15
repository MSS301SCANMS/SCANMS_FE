// =====================================================================
// SCANMS - Hàng Mẫu Dùng Thử (Sample Products - FR-30)
// Dành cho KOL / CTV: Đăng ký xin mẫu, theo dõi phê duyệt, hành trình giao hàng & nộp link review
// Bổ sung đầy đủ 7 tính năng UX/UI: Kiểm tra form, Hủy giữ lịch sử, Lưu localStorage, Luồng gửi, Logistics Shipper, Chat ngữ cảnh & Chính sách chiến dịch
// =====================================================================

const serumImage = "./assets/serum-hero-optimized.jpg";
const sunscreenImage = "./assets/sunscreen-product.jpg";
const tonerImage = "./assets/toner-bha-product.jpg";
const cleanserImage = "./assets/cleanser-product.jpg";
const cicaMaskImage = "./assets/cica-mask-product.jpg";

// Danh mục sản phẩm khả dụng cho chương trình hàng mẫu
export const sampleCatalog = [
  {
    id: "SKIN-C15",
    name: "Serum vitamin C 15%",
    sku: "SKIN-C15",
    price: 459000,
    sampleStock: 18,
    image: serumImage,
    category: "Chăm sóc da",
    condition: "Dành cho kênh từ 50K followers hoặc CTV hạng Bạc trở lên",
    minFollowers: 50000,
    requiredTier: "Bạc",
    passProfile: true,
  },
  {
    id: "SUN-AQUA",
    name: "Kem chống nắng SPF50+",
    sku: "SUN-AQUA",
    price: 389000,
    sampleStock: 12,
    image: sunscreenImage,
    category: "Bảo vệ da",
    condition: "Dành cho mọi KOL/CTV đã xác minh danh tính KYC",
    minFollowers: 0,
    requiredTier: "Mọi cấp",
    passProfile: true,
  },
  {
    id: "TONER-BHA",
    name: "Nước hoa hồng BHA 2%",
    sku: "TONER-BHA",
    price: 320000,
    sampleStock: 8,
    image: tonerImage,
    category: "Tẩy tế bào chết",
    condition: "Ưu tiên kênh chuyên sâu Skincare & Trị mụn",
    minFollowers: 10000,
    requiredTier: "Mọi cấp",
    passProfile: true,
  },
  {
    id: "CLEANSER-02",
    name: "Gel rửa mặt dịu nhẹ",
    sku: "CLEANSER-02",
    price: 279000,
    sampleStock: 0,
    image: cleanserImage,
    category: "Làm sạch",
    condition: "Tạm thời hết suất mẫu phân bổ tháng 9 (0/50)",
    minFollowers: 0,
    requiredTier: "Mọi cấp",
    passProfile: false,
  },
  {
    id: "MASK-CICA",
    name: "Mặt nạ phục hồi Cica (Hộp 5 miếng)",
    sku: "MASK-CICA",
    price: 69000,
    sampleStock: 25,
    image: cicaMaskImage,
    category: "Chăm sóc da",
    condition: "Dành cho mọi KOL/CTV (Không giới hạn follower)",
    minFollowers: 0,
    requiredTier: "Mọi cấp",
    passProfile: true,
  },
];

// Dữ liệu mẫu các yêu cầu xin mẫu ban đầu của KOL (Đầy đủ các trạng thái thực tế)
export const initialRequests = [
  {
    id: "SMP-9821",
    productId: "SKIN-C15",
    productName: "Serum vitamin C 15%",
    sku: "SKIN-C15",
    price: 459000,
    image: serumImage,
    status: "shipping", // pending, approved, shipping, delivered, rejected, cancelled
    statusLabel: "Đang vận chuyển",
    statusBadge: "warning",
    carrier: "GHTK Express",
    trackingCode: "88992211",
    createdAt: "02/09/2026, 09:42",
    approvedAt: "03/09/2026, 14:15",
    shippedAt: "04/09/2026, 08:30",
    estimatedDelivery: "Hôm nay, 08/09/2026",
    deliveredAt: null,
    recipient: "Trần Văn Nhật",
    phone: "0987123456",
    address: "12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh",
    channel: "TikTok (@nhat_skincare)",
    channelFollowers: "128K Followers",
    format: "Video review 9:16 (Routine buổi sáng, 45 giây)",
    commitment: "Video review trải nghiệm thật sau 7 ngày nhận sản phẩm, đăng kèm link affiliate định danh và coupon NHATXINH10.",
    reviewDeadline: "15/09/2026",
    reviewLink: null,
    rejectReason: null,
    shipperName: "Nguyễn Văn Hùng",
    shipperPhone: "0912 345 678",
    shipperPlate: "29-X1 889.22",
    journey: [
      { time: "02/09/2026, 09:42", text: "KOL gửi đề xuất xin sản phẩm mẫu", done: true },
      { time: "03/09/2026, 14:15", text: "Shop Sora Skin đã phê duyệt cấp hàng mẫu", done: true },
      { time: "04/09/2026, 08:30", text: "Bưu tá GHTK đã lấy hàng từ kho Sora Skin (Kho Củ Chi)", done: true },
      { time: "05/09/2026, 19:40", text: "Đơn hàng đã nhập kho trung chuyển Tân Bình", done: true },
      { time: "08/09/2026, 08:15", text: "Shipper GHTK (Nguyễn Văn Hùng - 0912 345 678) đang giao hàng đến bạn", done: true },
    ],
  },
  {
    id: "SMP-9810",
    productId: "SUN-AQUA",
    productName: "Kem chống nắng SPF50+",
    sku: "SUN-AQUA",
    price: 389000,
    image: sunscreenImage,
    status: "pending",
    statusLabel: "Chờ Shop duyệt",
    statusBadge: "warning",
    carrier: null,
    trackingCode: null,
    createdAt: "05/09/2026, 16:20",
    approvedAt: null,
    shippedAt: null,
    estimatedDelivery: "Dự kiến 2-3 ngày sau duyệt",
    deliveredAt: null,
    recipient: "Trần Văn Nhật",
    phone: "0987123456",
    address: "12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh",
    channel: "Instagram (@nhat.beauty)",
    channelFollowers: "45K Followers",
    format: "Bài đăng hình ảnh Carousel 1:1 test độ kiềm dầu",
    commitment: "Review kiểm tra độ kiềm dầu và chống trôi nước ngoài trời, cam kết đăng bài trong 5 ngày sau nhận hàng.",
    reviewDeadline: "Dự kiến 18/09/2026",
    reviewLink: null,
    rejectReason: null,
    shipperName: null,
    shipperPhone: null,
    journey: [
      { time: "05/09/2026, 16:20", text: "KOL gửi đề xuất xin sản phẩm mẫu", done: true },
      { time: "Đang chờ", text: "Shop Sora Skin đang thẩm định hồ sơ kênh truyền thông", done: false },
    ],
  },
  {
    id: "SMP-9795",
    productId: "TONER-BHA",
    productName: "Nước hoa hồng BHA 2%",
    sku: "TONER-BHA",
    price: 320000,
    image: tonerImage,
    status: "delivered",
    statusLabel: "Đã nhận hàng",
    statusBadge: "brand",
    carrier: "GHN Express",
    trackingCode: "GHN98214402",
    createdAt: "20/08/2026, 10:15",
    approvedAt: "21/08/2026, 11:30",
    shippedAt: "22/08/2026, 09:00",
    estimatedDelivery: "24/08/2026",
    deliveredAt: "24/08/2026, 15:40",
    recipient: "Trần Văn Nhật",
    phone: "0987123456",
    address: "12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh",
    channel: "TikTok (@nhat_skincare)",
    channelFollowers: "128K Followers",
    format: "Video hướng dẫn 3 bước đẩy mụn ẩn",
    commitment: "Video hướng dẫn chu trình dưỡng da với BHA 2%, đăng trước ngày 31/08/2026.",
    reviewDeadline: "31/08/2026",
    reviewLink: "https://www.tiktok.com/@nhat_skincare/video/7281928410291",
    rejectReason: null,
    shipperName: "Lê Minh Tuấn",
    shipperPhone: "0908 776 543",
    journey: [
      { time: "20/08/2026, 10:15", text: "KOL gửi đề xuất xin sản phẩm mẫu", done: true },
      { time: "21/08/2026, 11:30", text: "Shop Sora Skin duyệt yêu cầu", done: true },
      { time: "22/08/2026, 09:00", text: "GHN tiếp nhận bưu gửi tại kho Củ Chi", done: true },
      { time: "24/08/2026, 15:40", text: "KOL đã xác nhận nhận hàng thành công", done: true },
      { time: "29/08/2026, 19:20", text: "KOL đã nộp link video review hoàn tất cam kết", done: true },
    ],
  },
  {
    id: "SMP-9780",
    productId: "MASK-CICA",
    productName: "Mặt nạ phục hồi Cica (Hộp 5 miếng)",
    sku: "MASK-CICA",
    price: 69000,
    image: cicaMaskImage,
    status: "approved",
    statusLabel: "Shop đã duyệt",
    statusBadge: "neutral",
    carrier: "GHTK Express (Chờ bưu tá lấy hàng)",
    trackingCode: "GHTK-SMP9780",
    createdAt: "06/09/2026, 11:00",
    approvedAt: "07/09/2026, 09:30",
    shippedAt: null,
    estimatedDelivery: "Dự kiến 10/09/2026",
    deliveredAt: null,
    recipient: "Trần Văn Nhật",
    phone: "0987123456",
    address: "12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh",
    channel: "YouTube Shorts",
    channelFollowers: "32K Subscribers",
    format: "Video ngắn ASMR đắp mặt nạ phục hồi sau peel",
    commitment: "Video ngắn làm dịu da cấp tốc, đính kèm link mua hàng trong phần bình luận ghim.",
    reviewDeadline: "17/09/2026",
    reviewLink: null,
    rejectReason: null,
    shipperName: null,
    journey: [
      { time: "06/09/2026, 11:00", text: "KOL gửi đề xuất xin sản phẩm mẫu", done: true },
      { time: "07/09/2026, 09:30", text: "Shop Sora Skin duyệt cấp mẫu. Kho đang đóng gói", done: true },
    ],
  },
  {
    id: "SMP-9755",
    productId: "CLEANSER-02",
    productName: "Gel rửa mặt dịu nhẹ",
    sku: "CLEANSER-02",
    price: 279000,
    image: cleanserImage,
    status: "rejected",
    statusLabel: "Từ chối duyệt",
    statusBadge: "danger",
    carrier: null,
    trackingCode: null,
    createdAt: "15/08/2026, 14:00",
    approvedAt: null,
    shippedAt: null,
    estimatedDelivery: null,
    deliveredAt: null,
    recipient: "Trần Văn Nhật",
    phone: "0987123456",
    address: "12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh",
    channel: "TikTok (@nhat_skincare)",
    channelFollowers: "128K Followers",
    format: "Video test độ pH 5.5",
    commitment: "Quay video so sánh độ ẩm da trước và sau rửa mặt.",
    reviewDeadline: null,
    reviewLink: null,
    rejectReason: "Rất tiếc, số lượng mẫu thử tháng 8 cho dòng Gel rửa mặt đã hết suất phân bổ. Bạn vui lòng chọn sản phẩm Serum Vitamin C hoặc Kem chống nắng để được duyệt nhanh nhé!",
    journey: [
      { time: "15/08/2026, 14:00", text: "KOL gửi đề xuất xin sản phẩm mẫu", done: true },
      { time: "16/08/2026, 10:00", text: "Shop thông báo từ chối cấp mẫu: Hết suất phân bổ tháng 8", done: true },
    ],
  },
  {
    id: "SMP-9740",
    productId: "MASK-CICA",
    productName: "Mặt nạ phục hồi Cica (Hộp 5 miếng)",
    sku: "MASK-CICA",
    price: 69000,
    image: cicaMaskImage,
    status: "cancelled",
    statusLabel: "Đã hủy yêu cầu",
    statusBadge: "neutral",
    carrier: null,
    trackingCode: null,
    createdAt: "10/08/2026, 08:30",
    approvedAt: null,
    cancelledAt: "10/08/2026, 11:20",
    shippedAt: null,
    estimatedDelivery: null,
    deliveredAt: null,
    recipient: "Trần Văn Nhật",
    phone: "0987123456",
    address: "12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh",
    channel: "TikTok (@nhat_skincare)",
    channelFollowers: "128K Followers",
    format: "Video unboxing 9:16",
    commitment: "Quay video unboxing trải nghiệm đắp mặt nạ cica sau nắng.",
    reviewDeadline: null,
    reviewLink: null,
    cancelReason: "KOL chủ động hủy do bận lịch quay ngoại cảnh tỉnh xa, đã hoàn lại suất mẫu cho quỹ chiến dịch.",
    journey: [
      { time: "10/08/2026, 08:30", text: "KOL gửi đề xuất xin sản phẩm mẫu", done: true },
      { time: "10/08/2026, 11:20", text: "KOL đã chủ động hủy yêu cầu nhận mẫu (Suất mẫu đã hoàn trả lại kho)", done: true },
    ],
  },
];

// =====================================================================
// PERSISTENCE LOCALSTORAGE
// =====================================================================
const SAMPLES_STORAGE_KEY = "scanms_sample_requests_v2";

function loadStoredRequests() {
  try {
    const raw = localStorage.getItem(SAMPLES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not parse stored samples requests", e);
  }
  return JSON.parse(JSON.stringify(initialRequests));
}

function persistRequests(requests) {
  try {
    localStorage.setItem(SAMPLES_STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    console.warn("Could not save sample requests to localStorage", e);
  }
}

export function resetSamplesDemoData() {
  localStorage.removeItem(SAMPLES_STORAGE_KEY);
  samplesState.requests = JSON.parse(JSON.stringify(initialRequests));
  samplesState.selectedRequestId = "SMP-9821";
  samplesState.statusFilter = "all";
  samplesState.searchQuery = "";
  samplesState.activeModal = null;
  persistRequests(samplesState.requests);
}

// State nội bộ của Module Hàng Mẫu
export const samplesState = {
  requests: loadStoredRequests(),
  selectedRequestId: "SMP-9821",
  searchQuery: "",
  statusFilter: "all", // all, pending, shipping, approved, delivered, rejected, cancelled
  uiMode: "normal", // normal, loading, empty, error
  activeModal: null, // request, edit, cancel, tracking, submit-review, locked-notice, policy
  tempFormData: null,
  isSubmitting: false,
  formError: null,
  simulatedFailure: false, // Kiểm thử nhánh gửi thất bại
};

// Định dạng tiền tệ
function money(val) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
}

// Xử lý Escape HTML an toàn
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Kiểm tra số điện thoại chuẩn nhà mạng Việt Nam (03x, 05x, 07x, 08x, 09x hoặc +84)
export function validateVNPhone(phone) {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\.]/g, "");
  return /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(clean);
}

// Kiểm tra link review có hợp lệ và khớp với nền tảng đã chọn
export function validateReviewUrl(url, platform) {
  if (!url || !url.trim()) return { valid: false, message: "Vui lòng nhập đường dẫn bài đăng review." };
  const trimmed = url.trim().toLowerCase();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return { valid: false, message: "Đường dẫn bài đăng phải bắt đầu bằng https://" };
  }

  if (platform === "tiktok" && !trimmed.includes("tiktok.com")) {
    return { valid: false, message: "Link không khớp nền tảng: Cần nhập đường dẫn từ tiktok.com" };
  }
  if (platform === "facebook" && !trimmed.includes("facebook.com") && !trimmed.includes("fb.watch")) {
    return { valid: false, message: "Link không khớp nền tảng: Cần nhập đường dẫn từ facebook.com hoặc fb.watch" };
  }
  if (platform === "instagram" && !trimmed.includes("instagram.com")) {
    return { valid: false, message: "Link không khớp nền tảng: Cần nhập đường dẫn từ instagram.com" };
  }
  if (platform === "youtube" && !trimmed.includes("youtube.com") && !trimmed.includes("youtu.be")) {
    return { valid: false, message: "Link không khớp nền tảng: Cần nhập đường dẫn từ youtube.com hoặc youtu.be" };
  }

  return { valid: true, message: "Đường dẫn bài đăng hợp lệ!" };
}

// =====================================================================
// 1. RENDER GIAO DIỆN CHÍNH (samplesPage)
// =====================================================================
export function samplesPage(globalState = {}) {
  // Lọc danh sách yêu cầu
  let filtered = samplesState.requests.filter((item) => {
    // Lọc theo trạng thái
    if (samplesState.statusFilter !== "all" && item.status !== samplesState.statusFilter) {
      return false;
    }
    // Lọc theo từ khóa tìm kiếm
    if (samplesState.searchQuery.trim()) {
      const q = samplesState.searchQuery.toLowerCase().trim();
      const matchCode = item.id.toLowerCase().includes(q);
      const matchName = item.productName.toLowerCase().includes(q);
      const matchTracking = item.trackingCode ? item.trackingCode.toLowerCase().includes(q) : false;
      if (!matchCode && !matchName && !matchTracking) return false;
    }
    return true;
  });

  // Tìm yêu cầu đang chọn hiển thị chi tiết (chỉ trong danh sách đã lọc để không gây nhầm)
  let selected = filtered.find((r) => r.id === samplesState.selectedRequestId);
  if (!selected && filtered.length > 0) {
    selected = filtered[0];
    samplesState.selectedRequestId = selected.id;
  } else if (filtered.length === 0) {
    selected = null;
  }

  // Thống kê số lượng
  const countPending = samplesState.requests.filter((r) => r.status === "pending").length;
  const countShipping = samplesState.requests.filter((r) => r.status === "shipping").length;
  const countApproved = samplesState.requests.filter((r) => r.status === "approved").length;
  const countDelivered = samplesState.requests.filter((r) => r.status === "delivered").length;
  const countRejected = samplesState.requests.filter((r) => r.status === "rejected").length;
  const countCancelled = samplesState.requests.filter((r) => r.status === "cancelled").length;

  return `
    <div class="samples-workspace">
      <!-- HEADER CHÍNH -->
      <div class="page-head samples-head">
        <div class="samples-title-group">
          <h1 class="samples-title">Hàng mẫu dùng thử</h1>
          <p class="samples-subtitle">Gửi yêu cầu nhận mẫu và theo dõi quá trình giao hàng.</p>
        </div>
        <div class="samples-header-controls">
          <div class="samples-secondary-actions">
            <!-- Nút xem chính sách Shop (nút phụ nhỏ) -->
            <button class="btn small secondary btn-policy-compact" id="btn-samples-policy" title="Xem chính sách chiến dịch Sora Skin">
              <i class="ph ph-shield-check"></i> Chính sách Shop
            </button>

            <!-- Menu Tùy chọn demo (Gom Khôi phục demo & bộ chọn trạng thái) -->
            <div class="samples-demo-menu-wrap" id="samples-demo-menu-wrap">
              <button class="btn small secondary btn-demo-menu-trigger" id="btn-samples-demo-toggle" type="button" aria-expanded="false" title="Tùy chọn kiểm thử demo">
                <i class="ph ph-sliders"></i> Tùy chọn demo <i class="ph ph-caret-down"></i>
              </button>
              <div class="samples-demo-popover" id="samples-demo-popover">
                <div class="demo-popover-header">Tùy chọn kiểm thử UX</div>
                <div class="demo-popover-item">
                  <label for="samples-mode-select">Chế độ giao diện:</label>
                  <select class="samples-state-select" id="samples-mode-select">
                    <option value="normal" ${samplesState.uiMode === "normal" ? "selected" : ""}>Bình thường (Đầy đủ)</option>
                    <option value="loading" ${samplesState.uiMode === "loading" ? "selected" : ""}>Đang tải (Skeleton)</option>
                    <option value="empty" ${samplesState.uiMode === "empty" ? "selected" : ""}>Chưa có yêu cầu (Empty)</option>
                    <option value="error" ${samplesState.uiMode === "error" ? "selected" : ""}>Lỗi kết nối (Error)</option>
                  </select>
                </div>
                <div class="demo-popover-divider"></div>
                <button type="button" class="demo-reset-action" id="btn-samples-reset" title="Khôi phục dữ liệu mẫu ban đầu">
                  <i class="ph ph-arrow-counter-clockwise"></i> Khôi phục dữ liệu demo
                </button>
              </div>
            </div>
          </div>

          <!-- Nút chính: Xin mẫu mới (cao khoảng 40px, màu brand) -->
          <button class="btn btn-sample-primary" id="btn-open-request-modal" title="Tạo đề xuất nhận sản phẩm mẫu mới">
            <i class="ph ph-plus"></i> Xin mẫu mới
          </button>
        </div>
      </div>

      <!-- THANH THÔNG TIN GỌN & HÀNG THỐNG KÊ (Thay thế banner lớn) -->
      <section class="samples-info-row">
        <!-- Thanh thông tin Shop & Chiến dịch -->
        <div class="samples-info-strip">
          <div class="samples-info-icon">
            <i class="ph ph-storefront"></i>
          </div>
          <div class="samples-info-content">
            <div class="samples-info-headline">
              <strong class="samples-shop-name">Shop Sora Skin</strong>
              <span class="samples-info-sep">•</span>
              <span class="samples-campaign-name">Chiến dịch Thu Đông 2026</span>
            </div>
            <div class="samples-info-desc">
              <span>Hỗ trợ mẫu thử cho nhà sáng tạo nội dung tham gia chiến dịch review sản phẩm.</span>
              <button type="button" class="samples-policy-link" id="btn-banner-policy-link">Xem chính sách &raquo;</button>
            </div>
          </div>
        </div>

        <!-- Hàng thống kê 3 số liệu: Chờ duyệt – Đang giao – Đã nhận -->
        <div class="samples-stat-bar" role="tablist" aria-label="Bộ lọc nhanh theo trạng thái">
          <button type="button" class="samples-stat-btn ${samplesState.statusFilter === "pending" ? "active" : ""}" data-stat="pending" title="Lọc đơn chờ Shop duyệt">
            <span class="stat-indicator warning"></span>
            <span class="stat-name">Chờ duyệt</span>
            <strong class="stat-num">${countPending}</strong>
          </button>
          <button type="button" class="samples-stat-btn ${samplesState.statusFilter === "shipping" ? "active" : ""}" data-stat="shipping" title="Lọc đơn đang vận chuyển">
            <span class="stat-indicator shipping"></span>
            <span class="stat-name">Đang giao</span>
            <strong class="stat-num">${countShipping}</strong>
          </button>
          <button type="button" class="samples-stat-btn ${samplesState.statusFilter === "delivered" ? "active" : ""}" data-stat="delivered" title="Lọc đơn đã nhận hàng">
            <span class="stat-indicator delivered"></span>
            <span class="stat-name">Đã nhận</span>
            <strong class="stat-num">${countDelivered}</strong>
          </button>
        </div>
      </section>

      <!-- PHẦN THÂN BỐ CỤC DỰA TRÊN TRẠNG THÁI UI -->
      ${renderSamplesBody(filtered, selected, globalState, { countPending, countShipping, countApproved, countDelivered, countRejected, countCancelled })}

      <!-- KHU VỰC CÁC MODAL TƯƠNG TÁC -->
      <div id="samples-modal-container">
        ${renderActiveModal(selected, globalState)}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------
// 2. RENDER KHỐI NỘI DUNG MASTER-DETAIL HOẶC CÁC TRẠNG THÁI UX ĐẶC BIỆT
// ---------------------------------------------------------------------
function renderSamplesBody(filtered, selected, globalState, counts) {
  // 1. Trạng thái Loading Skeleton
  if (samplesState.uiMode === "loading") {
    return `
      <div class="samples-layout">
        <div class="samples-master-card">
          <div class="samples-search-bar">
            <div style="height:34px;background:var(--surface-3);border-radius:6px"></div>
            <div style="height:28px;background:var(--surface-3);border-radius:6px"></div>
          </div>
          <div class="samples-skeleton-master">
            ${Array.from({ length: 4 })
              .map(
                () => `
              <div class="samples-skeleton-item">
                <div class="samples-skeleton-thumb"></div>
                <div class="samples-skeleton-lines">
                  <div class="samples-skeleton-bar" style="width:40%"></div>
                  <div class="samples-skeleton-bar" style="width:75%"></div>
                  <div class="samples-skeleton-bar" style="width:50%"></div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="samples-detail-card">
          <div style="height:60px;background:var(--surface-2);border-radius:8px"></div>
          <div style="height:140px;background:var(--surface-2);border-radius:8px"></div>
          <div style="height:100px;background:var(--surface-2);border-radius:8px"></div>
        </div>
      </div>
    `;
  }

  // 2. Trạng thái Lỗi kết nối
  if (samplesState.uiMode === "error") {
    return `
      <div class="samples-error-card">
        <div class="samples-state-icon">
          <i class="ph ph-warning-octagon"></i>
        </div>
        <h3>Không thể tải danh sách hàng mẫu</h3>
        <p>Hệ thống tạm thời không thể kết nối đến máy chủ logistics. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.</p>
        <button class="btn" id="btn-samples-retry"><i class="ph ph-arrow-clockwise"></i> Thử lại ngay</button>
      </div>
    `;
  }

  // 3. Trạng thái Chưa có yêu cầu nào (Empty)
  if (samplesState.uiMode === "empty" || samplesState.requests.length === 0) {
    return `
      <div class="samples-empty-card">
        <div class="samples-state-icon">
          <i class="ph ph-package"></i>
        </div>
        <h3>Bạn chưa có yêu cầu nhận hàng mẫu nào</h3>
        <p>Đăng ký nhận sản phẩm mẫu miễn phí từ Sora Skin để trải nghiệm và tạo video review chất lượng cao thu hút đơn hàng liên kết.</p>
        <button class="btn" id="btn-empty-request"><i class="ph ph-plus"></i> Xin sản phẩm mẫu ngay</button>
      </div>
    `;
  }

  // 4. Trạng thái Bình thường: Bố cục Master - Detail
  const isFiltered = Boolean(samplesState.searchQuery.trim() || samplesState.statusFilter !== "all");

  return `
    <div class="samples-layout ${samplesState.mobileView === "detail" ? "viewing-detail" : ""}">
      <!-- CỘT TRÁI: DANH SÁCH YÊU CẦU (MASTER LIST) -->
      <aside class="samples-master-card">
        <!-- Thanh tìm kiếm & bộ lọc dropdown gọn gàng -->
        <div class="samples-search-bar">
          <div class="samples-filter-controls-row">
            <div class="samples-search-input-wrap">
              <i class="ph ph-magnifying-glass"></i>
              <input 
                type="text" 
                class="samples-search-input" 
                id="samples-search-input" 
                placeholder="Tìm mã yêu cầu, sản phẩm, vận đơn" 
                value="${escapeHtml(samplesState.searchQuery)}"
              />
              ${
                samplesState.searchQuery
                  ? `<button class="samples-search-clear-btn" id="btn-clear-search-input" type="button" title="Xóa tìm kiếm"><i class="ph ph-x"></i></button>`
                  : ""
              }
            </div>

            <div class="samples-status-dropdown-wrap">
              <select class="samples-status-dropdown" id="samples-status-dropdown" aria-label="Lọc theo trạng thái yêu cầu">
                <option value="all" ${samplesState.statusFilter === "all" ? "selected" : ""}>Tất cả (${samplesState.requests.length})</option>
                <option value="pending" ${samplesState.statusFilter === "pending" ? "selected" : ""}>Chờ duyệt (${counts.countPending})</option>
                <option value="approved" ${samplesState.statusFilter === "approved" ? "selected" : ""}>Đã duyệt (${counts.countApproved})</option>
                <option value="shipping" ${samplesState.statusFilter === "shipping" ? "selected" : ""}>Đang giao (${counts.countShipping})</option>
                <option value="delivered" ${samplesState.statusFilter === "delivered" ? "selected" : ""}>Đã nhận (${counts.countDelivered})</option>
                <option value="rejected" ${samplesState.statusFilter === "rejected" ? "selected" : ""}>Từ chối (${counts.countRejected})</option>
                <option value="cancelled" ${samplesState.statusFilter === "cancelled" ? "selected" : ""}>Đã hủy (${counts.countCancelled})</option>
              </select>
              <i class="ph ph-caret-down samples-dropdown-icon"></i>
            </div>
          </div>

          <!-- Thanh kết quả lọc & Nút Xóa bộ lọc -->
          <div class="samples-filter-status-line">
            <span class="samples-filter-count-text">
              ${isFiltered ? `Hiển thị <strong>${filtered.length}</strong> kết quả` : `<strong>${filtered.length}</strong> yêu cầu`}
            </span>
            ${
              isFiltered
                ? `<button class="samples-btn-clear-filter" id="btn-clear-sample-filter" type="button"><i class="ph ph-x-circle"></i> Xóa bộ lọc</button>`
                : ""
            }
          </div>
        </div>

        <!-- Danh sách yêu cầu -->
        <div class="samples-list" role="list" tabindex="-1">
          ${
            filtered.length === 0
              ? `
            <div class="samples-empty-search">
              <div class="empty-search-icon"><i class="ph ph-magnifying-glass"></i></div>
              <h4>Không tìm thấy yêu cầu nào</h4>
              <p>Không có kết quả nào phù hợp với bộ lọc hiện tại.</p>
              <button class="btn small secondary" id="btn-reset-sample-filter" type="button">
                <i class="ph ph-arrow-counter-clockwise"></i> Xóa bộ lọc
              </button>
            </div>
          `
              : filtered
                  .map((item) => {
                    const isSelected = selected && selected.id === item.id;
                    let badgeClass = "badge-pending";
                    if (item.status === "approved") badgeClass = "badge-approved";
                    if (item.status === "shipping") badgeClass = "badge-shipping";
                    if (item.status === "delivered") badgeClass = "badge-delivered";
                    if (item.status === "rejected") badgeClass = "badge-rejected";
                    if (item.status === "cancelled") badgeClass = "badge-cancelled";

                    return `
                <div 
                  class="sample-item-card ${isSelected ? "active" : ""}" 
                  data-request-id="${item.id}"
                  role="button"
                  tabindex="0"
                  aria-selected="${isSelected ? "true" : "false"}"
                  aria-label="${escapeHtml(item.productName)}, mã ${item.id}, ${item.statusLabel}"
                >
                  <img src="${item.image}" alt="${escapeHtml(item.productName)}" class="sample-item-thumb" />
                  <div class="sample-item-body">
                    <div class="sample-item-header">
                      <h4 class="sample-item-title">${escapeHtml(item.productName)}</h4>
                      <span class="sample-badge ${badgeClass}">${item.statusLabel}</span>
                    </div>
                    <div class="sample-item-sub">
                      <span class="sample-item-code">${item.id}</span>
                      <span class="sample-item-sep">•</span>
                      <span class="sample-item-date">${item.createdAt.split(",")[0]}</span>
                    </div>
                  </div>
                </div>
              `;
                  })
                  .join("")
          }
        </div>
      </aside>

      <!-- CỘT PHẢI: CHI TIẾT YÊU CẦU & TIẾN TRÌNH VẬN CHUYỂN (DETAIL VIEW) -->
      <main class="samples-detail-card">
        ${
          selected
            ? renderSampleDetail(selected)
            : `
          <div class="samples-detail-empty-selection">
            <div class="empty-selection-icon"><i class="ph ph-file-dashed"></i></div>
            <h3>Không có yêu cầu nào được chọn</h3>
            <p>Yêu cầu đang chọn không còn nằm trong kết quả lọc. Vui lòng chọn một yêu cầu khác hoặc xóa bộ lọc để tiếp tục.</p>
            <button class="btn small secondary" id="btn-reset-filter-from-detail" type="button">
              <i class="ph ph-arrow-counter-clockwise"></i> Xem tất cả yêu cầu
            </button>
          </div>
        `
        }
      </main>
    </div>
  `;
}

// ---------------------------------------------------------------------
// 3. RENDER CHI TIẾT YÊU CẦU (renderSampleDetail)
// ---------------------------------------------------------------------
function renderSampleDetail(item) {
  let badgeColor = "warning";
  if (item.status === "shipping") badgeColor = "info";
  if (item.status === "approved" || item.status === "delivered") badgeColor = "brand";
  if (item.status === "rejected") badgeColor = "danger";
  if (item.status === "cancelled") badgeColor = "neutral";

  const isPending = item.status === "pending";
  const isApproved = item.status === "approved";
  const isShipping = item.status === "shipping";
  const isDelivered = item.status === "delivered";
  const isRejected = item.status === "rejected";
  const isCancelled = item.status === "cancelled";

  return `
    <!-- THANH QUAY LẠI DANH SÁCH TRÊN MOBILE -->
    <div class="samples-mobile-back-bar">
      <button class="btn small secondary" id="btn-samples-back-list" type="button">
        <i class="ph ph-arrow-left"></i> Quay lại danh sách
      </button>
      <span class="mono" style="font-weight:700;font-size:12px;color:var(--muted)">${item.id}</span>
    </div>

    <!-- HEADER CHI TIẾT SẢN PHẨM -->
    <div class="sample-detail-header">
      <div class="sample-detail-prod">
        <img src="${item.image}" alt="${escapeHtml(item.productName)}" class="sample-detail-prod-img" />
        <div class="sample-detail-prod-text">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="mono" style="font-weight:700;color:var(--muted);font-size:12px">${item.id}</span>
            <span class="badge ${badgeColor}">${item.statusLabel}</span>
          </div>
          <h2>${escapeHtml(item.productName)}</h2>
          <p>Giá trị hàng mẫu tài trợ: <strong>${money(item.price)}</strong> (Miễn phí theo hạn mức) • SKU: <span class="mono">${item.sku}</span></p>
        </div>
      </div>

      <div style="display: flex; gap: 8px;">
        <button class="btn small secondary" id="btn-contact-shop" data-request-id="${item.id}" title="Gửi tin nhắn hỏi Shop về đơn mẫu này kèm ngữ cảnh">
          <i class="ph ph-chats"></i> Nhắn tin Shop
        </button>
      </div>
    </div>

    <!-- NẾU BỊ TỪ CHỐI: HIỂN THỊ BANNER LÝ DO -->
    ${
      isRejected
        ? `
      <div class="sample-rejected-banner">
        <i class="ph ph-x-circle"></i>
        <div class="sample-rejected-text">
          <h4>Yêu cầu nhận mẫu không được phê duyệt</h4>
          <p>${escapeHtml(item.rejectReason)}</p>
        </div>
      </div>
    `
        : ""
    }

    <!-- NẾU ĐÃ HỦY: HIỂN THỊ BANNER ĐÃ HỦY VÀ NÚT XIN LẠI -->
    ${
      isCancelled
        ? `
      <div class="sample-cancelled-banner">
        <i class="ph ph-prohibit"></i>
        <div class="sample-cancelled-text">
          <h4>Yêu cầu nhận mẫu đã được hủy bỏ</h4>
          <p>${escapeHtml(item.cancelReason || "Bạn đã chủ động hủy yêu cầu này. Suất mẫu đã được hoàn trả lại kho tài trợ của Shop.")}</p>
          <small style="color:var(--muted);display:block;margin-top:4px"><i class="ph ph-clock"></i> Thời gian hủy: ${item.cancelledAt || item.createdAt}</small>
        </div>
        <button class="btn small secondary" id="btn-reapply-sample" data-product-id="${item.productId}" style="margin-left:auto;white-space:nowrap">
          <i class="ph ph-arrow-counter-clockwise"></i> Đăng ký xin lại
        </button>
      </div>
    `
        : ""
    }

    <!-- TIMELINE 4 BƯỚC LOGISTICS & DUYỆT (Ẩn nếu đã hủy) -->
    ${
      !isCancelled
        ? `
    <div class="sample-timeline-wrap">
      <div class="sample-timeline-title">
        <span><i class="ph ph-git-commit"></i> Tiến trình xử lý & Giao nhận hàng mẫu</span>
        ${
          item.trackingCode && !isRejected
            ? `<button class="text-btn" id="btn-view-journey" data-request-id="${item.id}" style="font-size:12.5px"><i class="ph ph-list-magnifying-glass"></i> Xem chi tiết lịch trình</button>`
            : ""
        }
      </div>

      <div class="sample-steps-row">
        <!-- Bước 1: Gửi yêu cầu -->
        <div class="sample-step completed">
          <div class="sample-step-mark"><i class="ph ph-check"></i></div>
          <h4>1. Đã gửi đề xuất</h4>
          <p>${item.createdAt}</p>
        </div>

        <!-- Bước 2: Shop duyệt -->
        <div class="sample-step ${isRejected ? "rejected" : isApproved || isShipping || isDelivered ? "completed" : isPending ? "current" : ""}">
          <div class="sample-step-mark">
            ${isRejected ? `<i class="ph ph-x"></i>` : isApproved || isShipping || isDelivered ? `<i class="ph ph-check"></i>` : `2`}
          </div>
          <h4>2. Shop xét duyệt</h4>
          <p>${isRejected ? "Bị từ chối" : isApproved || isShipping || isDelivered ? item.approvedAt : "Đang thẩm định"}</p>
        </div>

        <!-- Bước 3: Đang giao hàng -->
        <div class="sample-step ${isDelivered ? "completed" : isShipping ? "current" : ""}">
          <div class="sample-step-mark">
            ${isDelivered ? `<i class="ph ph-check"></i>` : isShipping ? `<i class="ph ph-truck"></i>` : `3`}
          </div>
          <h4>3. Đang giao hàng</h4>
          <p>${isDelivered ? "Đã phát thành công" : isShipping ? "Dự kiến " + item.estimatedDelivery : isApproved ? "Chờ bưu tá lấy" : "Chờ chuyển phát"}</p>
        </div>

        <!-- Bước 4: Đã nhận hàng -->
        <div class="sample-step ${isDelivered ? "completed" : ""}">
          <div class="sample-step-mark">
            ${isDelivered ? `<i class="ph ph-seal-check"></i>` : `4`}
          </div>
          <h4>4. Đã nhận mẫu</h4>
          <p>${isDelivered ? item.deliveredAt : "Chờ xác nhận"}</p>
        </div>
      </div>
    </div>
    `
        : ""
    }

    <!-- KHỐI MÃ VẬN ĐƠN & GIAO HÀNG & THÔNG TIN SHIPPER -->
    ${
      item.carrier && !isRejected && !isCancelled
        ? `
      <div class="sample-shipping-box">
        <div class="sample-tracking-row">
          <div class="sample-carrier-info">
            <span class="sample-carrier-badge">${item.carrier.includes("GHTK") ? "GHTK" : "GHN"}</span>
            <div>
              <small style="color:var(--muted);display:block">Đơn vị vận chuyển đối tác</small>
              <strong>${item.carrier}</strong>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <div>
              <small style="color:var(--muted);display:block">Mã vận đơn</small>
              <span class="sample-tracking-code">${item.trackingCode}</span>
            </div>
            ${
              item.trackingCode && !item.trackingCode.includes("Đang")
                ? `
              <button class="icon-btn" id="btn-copy-tracking" data-code="${item.trackingCode}" title="Sao chép mã vận đơn">
                <i class="ph ph-copy"></i>
              </button>
            `
                : ""
            }
          </div>
        </div>

        <!-- Thẻ thông tin shipper nếu đang giao hàng -->
        ${
          item.shipperName
            ? `
          <div class="sample-shipper-card">
            <div class="sample-shipper-avatar"><i class="ph ph-moped"></i></div>
            <div class="sample-shipper-details">
              <strong>Shipper: ${item.shipperName}</strong>
              <small style="color:var(--muted);display:block">SĐT: ${item.shipperPhone} ${item.shipperPlate ? `• Biển số: ${item.shipperPlate}` : ""}</small>
            </div>
            <div class="sample-shipper-actions">
              <a href="tel:${item.shipperPhone.replace(/\s+/g, "")}" class="btn small secondary" title="Gọi điện cho Shipper">
                <i class="ph ph-phone-call"></i> Gọi Shipper
              </a>
              <button class="btn small" id="btn-view-live-tracking" data-request-id="${item.id}" title="Theo dõi lộ trình xe bưu tá">
                <i class="ph ph-map-pin"></i> Theo dõi trực tiếp
              </button>
              <button class="btn small secondary" id="btn-goto-global-tracking" data-code="${item.trackingCode}" title="Xem trên trang Tra cứu vận đơn sàn">
                <i class="ph ph-arrow-square-out"></i> Trang Vận đơn (#tracking)
              </button>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `
        : ""
    }

    <!-- THÔNG TIN NGƯỜI NHẬN & CAM KẾT NỘI DUNG -->
    <div class="sample-info-grid">
      <!-- Cột thông tin nhận hàng -->
      <div class="sample-info-col">
        <div class="sample-info-col-title">
          <span><i class="ph ph-map-pin"></i> Thông tin nhận hàng</span>
          ${isPending ? `<button class="text-btn" id="btn-edit-sample-info" data-request-id="${item.id}">Chỉnh sửa</button>` : `<small style="color:var(--muted)">${isCancelled ? "Đã hủy" : "Đã khóa"}</small>`}
        </div>
        <div class="sample-info-row">
          <i class="ph ph-user"></i>
          <span>Người nhận: <strong>${escapeHtml(item.recipient)}</strong></span>
        </div>
        <div class="sample-info-row">
          <i class="ph ph-phone"></i>
          <span>Số điện thoại: <strong>${item.phone}</strong></span>
        </div>
        <div class="sample-info-row" style="align-items: flex-start;">
          <i class="ph ph-house" style="margin-top:2px"></i>
          <span>Địa chỉ: ${escapeHtml(item.address)}</span>
        </div>
      </div>

      <!-- Cột cam kết truyền thông -->
      <div class="sample-info-col">
        <div class="sample-info-col-title">
          <span><i class="ph ph-video-camera"></i> Kế hoạch đăng tải review</span>
          <span class="badge" style="background:var(--brand-soft);color:var(--brand-strong);font-size:11px">${item.channelFollowers}</span>
        </div>
        <div class="sample-info-row">
          <i class="ph ph-share-network"></i>
          <span>Kênh chính: <strong>${escapeHtml(item.channel)}</strong></span>
        </div>
        <div class="sample-info-row">
          <i class="ph ph-film-strip"></i>
          <span>Định dạng: ${escapeHtml(item.format)}</span>
        </div>
        <div class="sample-info-row">
          <i class="ph ph-clock"></i>
          <span>Hạn nộp link: <strong>${item.reviewDeadline || "Trong 7 ngày"}</strong></span>
        </div>
      </div>
    </div>

    <!-- CAM KẾT & TRẠNG THÁI REVIEW -->
    <div class="sample-commit-box">
      <strong><i class="ph ph-note-pencil"></i> Cam kết nội dung của KOL:</strong>
      <p>"${escapeHtml(item.commitment)}"</p>
      ${
        item.reviewLink
          ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px dashed var(--line);display:flex;align-items:center;justify-content:space-between">
          <span><i class="ph ph-check-circle" style="color:var(--brand)"></i> Đã nộp bài review: <a href="${item.reviewLink}" target="_blank" style="color:var(--brand);font-weight:600">${item.reviewLink}</a></span>
          <span class="badge brand" style="font-size:11px">Hoàn tất nghĩa vụ</span>
        </div>
      `
          : ""
      }
    </div>

    <!-- CỤM NÚT HÀNH ĐỘNG THEO NGỮ CẢNH (CONTEXTUAL ACTIONS) -->
    <div class="sample-detail-actions">
      <div>
        ${
          isPending
            ? `<button class="btn secondary danger" id="btn-cancel-sample" data-request-id="${item.id}"><i class="ph ph-trash"></i> Hủy yêu cầu này</button>`
            : !isRejected && !isCancelled
              ? `<button class="text-btn" id="btn-locked-explain" data-request-id="${item.id}" style="font-size:12.5px;color:var(--muted)"><i class="ph ph-info"></i> Tại sao không thể sửa/hủy đơn này?</button>`
              : ""
        }
      </div>

      <div style="display: flex; gap: 10px;">
        ${
          isShipping
            ? `
          <button class="btn" id="btn-confirm-delivery" data-request-id="${item.id}">
            <i class="ph ph-check-circle"></i> Tôi đã nhận được hàng
          </button>
        `
            : isDelivered && !item.reviewLink
              ? `
          <button class="btn" id="btn-submit-review" data-request-id="${item.id}">
            <i class="ph ph-upload-simple"></i> Nộp link bài đăng review
          </button>
        `
              : isRejected || isCancelled
                ? `
          <button class="btn" id="btn-retry-sample" data-product-id="${item.productId}">
            <i class="ph ph-plus"></i> Xin sản phẩm mẫu khác
          </button>
        `
                : ""
        }
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------
// 4. RENDER CÁC MODAL TƯƠNG TÁC (FORM XIN MẪU, SỬA, HỦY, TRA CỨU VẬN ĐƠN, CHÍNH SÁCH)
// ---------------------------------------------------------------------
function renderActiveModal(selected, globalState) {
  if (!samplesState.activeModal) return "";

  // 1. Modal Form Đăng Ký Xin Mẫu Sản Phẩm Mới
  if (samplesState.activeModal === "request") {
    const selectedProdId = samplesState.tempFormData?.productId || sampleCatalog[0].id;
    const currentProd = sampleCatalog.find((p) => p.id === selectedProdId) || sampleCatalog[0];

    // Kiểm tra đơn trùng cho sản phẩm này
    const duplicateRequest = samplesState.requests.find(
      (r) => r.productId === selectedProdId && ["pending", "approved", "shipping"].includes(r.status)
    );

    const isOutOfStock = currentProd.sampleStock === 0;

    return `
      <div class="samples-modal-backdrop" id="samples-modal-backdrop">
        <div class="samples-modal-window">
          <div class="samples-modal-header">
            <h3><i class="ph ph-plus-circle"></i> Đăng ký Xin Sản Phẩm Mẫu</h3>
            <button class="icon-btn" id="modal-close"><i class="ph ph-x"></i></button>
          </div>
          <form id="form-sample-request" class="samples-modal-body">
            <!-- Chọn sản phẩm -->
            <div class="samples-form-row">
              <label>Sản phẩm muốn nhận mẫu <span class="req">*</span></label>
              <select class="select" id="req-product" required>
                ${sampleCatalog
                  .map(
                    (p) => `
                  <option value="${p.id}" ${p.id === selectedProdId ? "selected" : ""} ${p.sampleStock === 0 ? "disabled" : ""}>
                    ${escapeHtml(p.name)} - ${money(p.price)} (${p.sampleStock > 0 ? "Còn " + p.sampleStock + " suất" : "Hết suất mẫu tháng 9"})
                  </option>
                `
                  )
                  .join("")}
              </select>
            </div>

            <!-- Card hiển thị điều kiện cấp mẫu của Shop & Đối chiếu KOL Profile -->
            <div class="sample-eligibility-card">
              <div class="sample-eligibility-header">
                <div style="display:flex;align-items:center;gap:6px">
                  <i class="ph ph-shield-check" style="color:var(--brand)"></i>
                  <strong>Điều kiện cấp mẫu của Shop:</strong>
                </div>
                ${
                  isOutOfStock
                    ? `<span class="badge danger"><i class="ph ph-x-circle"></i> Hết suất mẫu</span>`
                    : currentProd.passProfile
                      ? `<span class="badge brand"><i class="ph ph-check-circle"></i> Đủ điều kiện nhận</span>`
                      : `<span class="badge warning"><i class="ph ph-warning-circle"></i> Chưa đạt tiêu chí</span>`
                }
              </div>
              <p style="margin:4px 0 0;font-size:12px;color:var(--muted);">${escapeHtml(currentProd.condition)}</p>
              <div class="sample-eligibility-user">
                <span>Hồ sơ KOL của bạn: <strong>Trần Văn Nhật (Hạng Vàng, TikTok 128K Followers)</strong></span>
                ${currentProd.passProfile ? `<span style="color:var(--brand);font-weight:700">✓ Đạt yêu cầu</span>` : `<span style="color:var(--danger)">✗ Chưa đạt</span>`}
              </div>
            </div>

            <!-- Cảnh báo nếu đã có đơn trùng -->
            ${
              duplicateRequest
                ? `
              <div class="sample-warning-alert">
                <i class="ph ph-warning"></i>
                <div>
                  <strong>Bạn đã có yêu cầu cho sản phẩm này!</strong>
                  <p>Mã đơn <strong>${duplicateRequest.id}</strong> đang ở trạng thái <em>${duplicateRequest.statusLabel}</em>. Chính sách Shop giới hạn mỗi CTV chỉ giữ tối đa 1 đơn mẫu cùng sản phẩm tại một thời điểm.</p>
                </div>
              </div>
            `
                : ""
            }

            <div class="samples-form-grid-2">
              <div class="samples-form-row">
                <label>Họ và tên người nhận <span class="req">*</span></label>
                <input class="input" id="req-name" value="Trần Văn Nhật" required />
              </div>
              <div class="samples-form-row">
                <label>Số điện thoại nhận hàng <span class="req">*</span></label>
                <input class="input" id="req-phone" value="0987123456" placeholder="Ví dụ: 0987123456" required />
                <span class="sample-field-hint" id="phone-hint">Đầu số hợp lệ: 03x, 05x, 07x, 08x, 09x hoặc +84</span>
              </div>
            </div>

            <div class="samples-form-row">
              <label>Địa chỉ nhận hàng chi tiết <span class="req">*</span></label>
              <textarea class="textarea" id="req-address" rows="2" required placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành">12 Nguyễn Văn Bảo, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh</textarea>
            </div>

            <div class="samples-form-grid-2">
              <div class="samples-form-row">
                <label>Kênh truyền thông đăng bài <span class="req">*</span></label>
                <select class="select" id="req-channel" required>
                  <option value="TikTok (@nhat_skincare)">TikTok (@nhat_skincare - 128K)</option>
                  <option value="Facebook (Nhật Skincare Review)">Facebook (Nhật Skincare Review)</option>
                  <option value="Instagram (@nhat.beauty)">Instagram (@nhat.beauty)</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                </select>
              </div>
              <div class="samples-form-row">
                <label>Định dạng nội dung dự kiến <span class="req">*</span></label>
                <select class="select" id="req-format" required>
                  <option value="Video review 9:16 (Routine sáng, 45 giây)">Video review dọc 9:16 (TikTok/Reels)</option>
                  <option value="Bài viết review ảnh kèm swatch 1:1">Bài viết review ảnh 1:1 (Facebook)</option>
                  <option value="Video unboxing & Test độ ẩm 16:9">Video unboxing ngang 16:9 (YouTube)</option>
                  <option value="Livestream review và chốt đơn">Livestream tư vấn và chốt đơn</option>
                </select>
              </div>
            </div>

            <div class="samples-form-row">
              <label>Đề xuất kịch bản & Cam kết với Shop <span class="req">*</span></label>
              <textarea class="textarea" id="req-commitment" rows="3" required placeholder="Mô tả ngắn gọn ý tưởng video review...">Video review trải nghiệm thật sau 7 ngày nhận sản phẩm, tập trung vào hiệu quả sáng da mờ thâm, gắn kèm Link Affiliate và Coupon cá nhân NHATXINH10.</textarea>
            </div>

            <div class="sample-policy-note">
              <i class="ph ph-info"></i> <strong>Lưu ý chính sách chiến dịch:</strong> Hạn đăng review 7 ngày và thời gian xét duyệt 24h là quy định theo đợt của Shop Sora Skin. Bạn có thể trao đổi riêng với Shop qua Chat nếu cần điều chỉnh lịch quay.
            </div>

            <div class="samples-modal-footer" style="padding: 0; margin-top: 12px; background: transparent;">
              <button type="button" class="btn secondary" id="modal-cancel">Hủy bỏ</button>
              <button type="submit" class="btn" id="btn-submit-request-form" ${duplicateRequest || isOutOfStock || samplesState.isSubmitting ? "disabled" : ""}>
                ${
                  samplesState.isSubmitting
                    ? `<i class="ph ph-spinner spin-icon"></i> Đang gửi đề xuất...`
                    : duplicateRequest
                      ? `<i class="ph ph-lock"></i> Đã có đơn đang xử lý`
                      : isOutOfStock
                        ? `<i class="ph ph-prohibit"></i> Hết suất mẫu`
                        : `<i class="ph ph-paper-plane-tilt"></i> Gửi đề xuất tới Shop`
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 2. Modal Chỉnh Sửa Thông Tin Nhận Hàng (Khi Chờ Duyệt)
  if (samplesState.activeModal === "edit") {
    return `
      <div class="samples-modal-backdrop" id="samples-modal-backdrop">
        <div class="samples-modal-window" style="max-width: 540px;">
          <div class="samples-modal-header">
            <h3><i class="ph ph-pencil-simple"></i> Cập Nhật Thông Tin Nhận Hàng</h3>
            <button class="icon-btn" id="modal-close"><i class="ph ph-x"></i></button>
          </div>
          <form id="form-edit-sample" class="samples-modal-body">
            <div class="samples-form-row">
              <label>Người nhận hàng <span class="req">*</span></label>
              <input class="input" id="edit-name" value="${escapeHtml(selected.recipient)}" required />
            </div>
            <div class="samples-form-row">
              <label>Số điện thoại liên lạc <span class="req">*</span></label>
              <input class="input" id="edit-phone" value="${selected.phone}" required />
              <span class="sample-field-hint" id="edit-phone-hint">Đầu số hợp lệ: 03x, 05x, 07x, 08x, 09x hoặc +84</span>
            </div>
            <div class="samples-form-row">
              <label>Địa chỉ nhận hàng <span class="req">*</span></label>
              <textarea class="textarea" id="edit-address" rows="2" required>${escapeHtml(selected.address)}</textarea>
            </div>
            <div class="samples-form-row">
              <label>Kịch bản / Cam kết nội dung</label>
              <textarea class="textarea" id="edit-commitment" rows="3">${escapeHtml(selected.commitment)}</textarea>
            </div>

            <div class="samples-modal-footer" style="padding: 0; margin-top: 10px; background: transparent;">
              <button type="button" class="btn secondary" id="modal-cancel">Đóng</button>
              <button type="submit" class="btn"><i class="ph ph-check"></i> Lưu thay đổi</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 3. Modal Xác Nhận Hủy Yêu Cầu Xin Mẫu (Giữ lịch sử)
  if (samplesState.activeModal === "cancel") {
    return `
      <div class="samples-modal-backdrop" id="samples-modal-backdrop">
        <div class="samples-modal-window" style="max-width: 480px;">
          <div class="samples-modal-header">
            <h3><i class="ph ph-warning" style="color:var(--danger)"></i> Xác Nhận Hủy Yêu Cầu</h3>
            <button class="icon-btn" id="modal-close"><i class="ph ph-x"></i></button>
          </div>
          <div class="samples-modal-body" style="text-align: center; padding: 24px 20px;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--danger-soft); color: var(--danger); display: grid; place-items: center; font-size: 28px; margin: 0 auto 14px;">
              <i class="ph ph-prohibit"></i>
            </div>
            <h4 style="margin: 0 0 6px; font-size: 16px;">Bạn có chắc chắn muốn hủy yêu cầu này?</h4>
            <p style="margin: 0; font-size: 13px; color: var(--muted); line-height: 1.5;">
              Yêu cầu nhận mẫu <strong>${selected.id} - ${escapeHtml(selected.productName)}</strong> sẽ chuyển sang trạng thái <strong>Đã hủy</strong> và được lưu lại trong lịch sử tài khoản. Suất mẫu sẽ được hoàn trả lại quỹ chiến dịch của Shop.
            </p>
            <div class="samples-form-row" style="text-align:left;margin-top:14px">
              <label style="font-size:12px">Lý do hủy yêu cầu (Tùy chọn):</label>
              <input class="input" id="cancel-reason-input" placeholder="Ví dụ: Thay đổi kế hoạch quay, muốn đổi sản phẩm khác..." />
            </div>
          </div>
          <div class="samples-modal-footer">
            <button class="btn secondary" id="modal-cancel">Không hủy</button>
            <button class="btn danger" id="btn-confirm-cancel-request" data-request-id="${selected.id}"><i class="ph ph-check"></i> Xác nhận hủy yêu cầu</button>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Modal Giải Thích Tại Sau Không Thể Hủy / Sửa (Khi Đã Duyệt hoặc Đang Giao)
  if (samplesState.activeModal === "locked-notice") {
    return `
      <div class="samples-modal-backdrop" id="samples-modal-backdrop">
        <div class="samples-modal-window" style="max-width: 500px;">
          <div class="samples-modal-header">
            <h3><i class="ph ph-lock-key"></i> Thông Báo Khóa Thông Tin Đơn Mẫu</h3>
            <button class="icon-btn" id="modal-close"><i class="ph ph-x"></i></button>
          </div>
          <div class="samples-modal-body" style="padding: 24px 20px;">
            <div style="display: flex; gap: 14px; align-items: flex-start;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--brand-soft); color: var(--brand-strong); display: grid; place-items: center; font-size: 22px; flex-shrink: 0;">
                <i class="ph ph-truck"></i>
              </div>
              <div>
                <h4 style="margin: 0 0 6px; font-size: 15px;">Đơn hàng đã được bàn giao cho đơn vị vận chuyển</h4>
                <p style="margin: 0; font-size: 13px; color: var(--muted); line-height: 1.5;">
                  Bưu kiện hàng mẫu <strong>${selected.id}</strong> hiện đã được Shop Sora Skin đóng gói và xuất kho với mã vận đơn <strong>${selected.trackingCode || "GHTK"}</strong>.
                  <br><br>
                  Để đảm bảo tính bất biến của quy trình xuất kho và logistics, hệ thống tự động khóa tính năng Sửa địa chỉ và Hủy yêu cầu.
                </p>
              </div>
            </div>

            <div class="card soft" style="margin-top: 14px; padding: 12px; font-size: 12.5px;">
              <strong>Cần đổi địa chỉ khẩn cấp?</strong>
              <p style="margin: 4px 0 0; color: var(--muted);">Vui lòng nhắn tin trực tiếp cho Shop để quản trị viên liên hệ hãng vận chuyển hỗ trợ điều hướng bưu kiện.</p>
            </div>
          </div>
          <div class="samples-modal-footer">
            <button class="btn secondary" id="modal-cancel">Đã hiểu</button>
            <button class="btn" id="btn-locked-chat"><i class="ph ph-chats"></i> Nhắn tin hỏi Shop</button>
          </div>
        </div>
      </div>
    `;
  }

  // 5. Modal Tra Cứu Lịch Trình Bưu Kiện Chi Tiết (Kết nối GHTK/GHN)
  if (samplesState.activeModal === "tracking") {
    return `
      <div class="samples-modal-backdrop" id="samples-modal-backdrop">
        <div class="samples-modal-window" style="max-width: 580px;">
          <div class="samples-modal-header">
            <h3><i class="ph ph-truck"></i> Lịch Trình Chi Tiết Bưu Kiện</h3>
            <button class="icon-btn" id="modal-close"><i class="ph ph-x"></i></button>
          </div>
          <div class="samples-modal-body" style="padding: 20px;">
            <div style="background: var(--surface-2); padding: 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <small style="color:var(--muted)">Đơn vị vận chuyển: <strong>${selected.carrier}</strong></small>
                <div class="mono" style="font-size: 14px; font-weight: 700; color: var(--ink); margin-top: 2px;">
                  Mã VĐ: ${selected.trackingCode}
                </div>
              </div>
              <span class="badge ${selected.status === "delivered" ? "brand" : "warning"}">${selected.statusLabel}</span>
            </div>

            ${
              selected.shipperName
                ? `
              <div style="background:var(--brand-soft);padding:10px 14px;border-radius:8px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
                <div>
                  <strong>Bưu tá phụ trách: ${selected.shipperName}</strong>
                  <small style="display:block;color:var(--muted)">SĐT: ${selected.shipperPhone}</small>
                </div>
                <a href="tel:${selected.shipperPhone.replace(/\s+/g, "")}" class="btn small" style="font-size:12px"><i class="ph ph-phone"></i> Gọi ngay</a>
              </div>
            `
                : ""
            }

            <div class="timeline" style="margin-left: 10px;">
              ${selected.journey
                .map(
                  (step) => `
                <div class="timeline-item ${step.done ? "" : "pending"}">
                  <span class="timeline-mark">${step.done ? `<i class="ph ph-check"></i>` : `<i class="ph ph-circle"></i>`}</span>
                  <div>
                    <h3 style="font-size: 13.5px;">${escapeHtml(step.text)}</h3>
                    <p style="font-size: 11.5px; color: var(--muted);">${step.time}</p>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          <div class="samples-modal-footer">
            <button class="btn secondary" id="modal-cancel">Đóng cửa sổ</button>
            <button class="btn" id="btn-goto-tracking-page"><i class="ph ph-arrow-square-out"></i> Mở trang Vận Đơn sàn (#tracking)</button>
          </div>
        </div>
      </div>
    `;
  }

  // 6. Modal Nộp Link Bài Đăng Review
  if (samplesState.activeModal === "submit-review") {
    return `
      <div class="samples-modal-backdrop" id="samples-modal-backdrop">
        <div class="samples-modal-window" style="max-width: 540px;">
          <div class="samples-modal-header">
            <h3><i class="ph ph-upload-simple"></i> Nộp Link Bài Đăng Review Hoàn Tất Cam Kết</h3>
            <button class="icon-btn" id="modal-close"><i class="ph ph-x"></i></button>
          </div>
          <form id="form-submit-review" class="samples-modal-body">
            <div style="background: var(--brand-soft); padding: 12px; border-radius: 8px; color: var(--brand-strong); font-size: 13px;">
              <i class="ph ph-check-circle"></i> Bạn đã nhận sản phẩm <strong>${escapeHtml(selected.productName)}</strong> vào ngày ${selected.deliveredAt || "24/08/2026"}. Vui lòng gửi link bài đăng công khai để hoàn tất cam kết nhận mẫu.
            </div>

            <div class="samples-form-row">
              <label>Nền tảng đã đăng bài <span class="req">*</span></label>
              <select class="select" id="review-platform" required>
                <option value="tiktok">TikTok Video (tiktok.com)</option>
                <option value="facebook">Facebook Post / Reel (facebook.com)</option>
                <option value="instagram">Instagram Reel (instagram.com)</option>
                <option value="youtube">YouTube Shorts (youtube.com / youtu.be)</option>
              </select>
            </div>

            <div class="samples-form-row">
              <label>Đường dẫn bài đăng (URL) <span class="req">*</span></label>
              <input 
                class="input" 
                id="review-url" 
                placeholder="https://www.tiktok.com/@nhat_skincare/video/..." 
                value="https://www.tiktok.com/@nhat_skincare/video/7281928410291"
                required 
              />
              <span class="sample-field-hint" id="review-url-hint">Link cần bắt đầu bằng https:// và khớp với nền tảng được chọn</span>
            </div>

            <div class="samples-form-row">
              <label>Ghi chú thêm cho Shop</label>
              <textarea class="textarea" id="review-notes" rows="2" placeholder="Video đã gắn thẻ sản phẩm và mã coupon cá nhân..."></textarea>
            </div>

            <div class="samples-modal-footer" style="padding: 0; margin-top: 10px; background: transparent;">
              <button type="button" class="btn secondary" id="modal-cancel">Hủy</button>
              <button type="submit" class="btn"><i class="ph ph-check"></i> Xác nhận nộp bài</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 7. Modal Xem Chính Sách Chiến Dịch Của Shop
  if (samplesState.activeModal === "policy") {
    return `
      <div class="samples-modal-backdrop" id="samples-modal-backdrop">
        <div class="samples-modal-window" style="max-width: 560px;">
          <div class="samples-modal-header">
            <h3><i class="ph ph-shield-check"></i> Chính Sách Tài Trợ Hàng Mẫu - Shop Sora Skin</h3>
            <button class="icon-btn" id="modal-close"><i class="ph ph-x"></i></button>
          </div>
          <div class="samples-modal-body" style="padding: 20px; font-size: 13.5px; line-height: 1.6;">
            <div style="background:var(--surface-2);padding:14px;border-radius:8px;margin-bottom:14px">
              <strong>Thông báo chính sách theo Chiến dịch:</strong>
              <p style="margin:4px 0 0;color:var(--muted);font-size:12.5px">
                Chính sách dưới đây do gian hàng đối tác <strong>Sora Skin Official</strong> quy định riêng cho chiến dịch Thu Đông 2026 trên nền tảng SCANMS.
              </p>
            </div>

            <div style="display:grid;gap:12px">
              <div style="display:flex;gap:10px;align-items:flex-start">
                <i class="ph ph-seal-percent" style="font-size:20px;color:var(--brand);flex-shrink:0;margin-top:2px"></i>
                <div>
                  <strong>Tài trợ 100% chi phí sản phẩm & vận chuyển:</strong>
                  <p style="margin:2px 0 0;color:var(--muted);font-size:12.5px">KOL/CTV không mất bất kỳ chi phí nào khi nhận mẫu trong định mức được Shop duyệt.</p>
                </div>
              </div>

              <div style="display:flex;gap:10px;align-items:flex-start">
                <i class="ph ph-clock" style="font-size:20px;color:var(--brand);flex-shrink:0;margin-top:2px"></i>
                <div>
                  <strong>Hạn đăng bài review 7 ngày:</strong>
                  <p style="margin:2px 0 0;color:var(--muted);font-size:12.5px">Thời hạn chuẩn là 7 ngày kể từ khi bưu tá giao hàng thành công. Nếu bạn cần thời gian test sản phẩm lâu hơn (ví dụ da liễu cần 14 ngày), hoàn toàn có thể thương lượng với Shop qua Chat.</p>
                </div>
              </div>

              <div style="display:flex;gap:10px;align-items:flex-start">
                <i class="ph ph-hourglass-high" style="font-size:20px;color:var(--brand);flex-shrink:0;margin-top:2px"></i>
                <div>
                  <strong>Thời gian xét duyệt dự kiến 24h:</strong>
                  <p style="margin:2px 0 0;color:var(--muted);font-size:12.5px">Là cam kết SLA của Shop trong ngày làm việc. Số lượng duyệt phụ thuộc vào quỹ mẫu phân bổ theo từng tuần.</p>
                </div>
              </div>
            </div>
          </div>
          <div class="samples-modal-footer">
            <button class="btn secondary" id="modal-cancel">Đã hiểu chính sách</button>
            <button class="btn" id="btn-policy-chat"><i class="ph ph-chats"></i> Thỏa thuận riêng qua Chat</button>
          </div>
        </div>
      </div>
    `;
  }

  return "";
}

// =====================================================================
// 5. XỬ LÝ SỰ KIỆN TƯƠNG TÁC (bindSamples)
// =====================================================================
export function bindSamples(root = document, context = {}) {
  const container = root.querySelector(".samples-workspace");
  if (!container) return;

  const { refresh = () => {}, toast = () => {}, state = {}, go = () => {} } = context;

  // 1. Chuyển đổi trạng thái kiểm thử UX (Bình thường, Skeleton, Empty, Error)
  const modeSelect = container.querySelector("#samples-mode-select");
  if (modeSelect) {
    modeSelect.onchange = (e) => {
      samplesState.uiMode = e.target.value;
      const demoPopover = container.querySelector("#samples-demo-popover");
      if (demoPopover) demoPopover.classList.remove("show");
      refresh();
      toast(`Đã chuyển sang chế độ: ${e.target.options[e.target.selectedIndex].text}`);
    };
  }

  // 1b. Menu Tùy chọn Demo (Toggle popover & đóng khi bấm ra ngoài)
  const demoToggle = container.querySelector("#btn-samples-demo-toggle");
  const demoPopover = container.querySelector("#samples-demo-popover");
  if (demoToggle && demoPopover) {
    demoToggle.onclick = (e) => {
      e.stopPropagation();
      const isExpanded = demoToggle.getAttribute("aria-expanded") === "true";
      demoToggle.setAttribute("aria-expanded", String(!isExpanded));
      demoPopover.classList.toggle("show");
    };

    document.addEventListener("click", (e) => {
      if (!demoPopover.contains(e.target) && !demoToggle.contains(e.target)) {
        demoPopover.classList.remove("show");
        demoToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // 1c. Link Xem chính sách trên thanh thông tin Shop
  const bannerPolicyBtn = container.querySelector("#btn-banner-policy-link");
  if (bannerPolicyBtn) {
    bannerPolicyBtn.onclick = () => {
      samplesState.activeModal = "policy";
      refresh();
    };
  }

  // 1d. Hàng thống kê 3 số liệu (Chờ duyệt - Đang giao - Đã nhận): click để lọc danh sách
  container.querySelectorAll(".samples-stat-btn").forEach((btn) => {
    btn.onclick = () => {
      const stat = btn.dataset.stat;
      samplesState.statusFilter = samplesState.statusFilter === stat ? "all" : stat;
      refresh();
    };
  });

  // Helper gắn các sự kiện bên trong panel Chi tiết (Detail View)
  function bindSampleDetailEvents(scope) {
    if (!scope) return;

    // A. Nút quay lại danh sách trên mobile
    const backBtn = scope.querySelector("#btn-samples-back-list");
    if (backBtn) {
      backBtn.onclick = () => {
        const layout = container.querySelector(".samples-layout");
        if (layout) layout.classList.remove("viewing-detail");
      };
    }

    // B. Nút xem tất cả từ trạng thái trống trong detail
    const resetDetailBtn = scope.querySelector("#btn-reset-filter-from-detail");
    if (resetDetailBtn) {
      resetDetailBtn.onclick = () => {
        samplesState.statusFilter = "all";
        samplesState.searchQuery = "";
        refresh();
      };
    }

    // C. Sao chép mã vận đơn 1-click
    const copyTrackingBtn = scope.querySelector("#btn-copy-tracking");
    if (copyTrackingBtn) {
      copyTrackingBtn.onclick = () => {
        const code = copyTrackingBtn.dataset.code;
        navigator.clipboard.writeText(code).then(() => {
          copyTrackingBtn.innerHTML = `<i class="ph ph-check" style="color:var(--brand)"></i>`;
          toast(`Đã sao chép mã vận đơn: ${code}`);
          setTimeout(() => {
            if (copyTrackingBtn) copyTrackingBtn.innerHTML = `<i class="ph ph-copy"></i>`;
          }, 2000);
        });
      };
    }

    // D. Mở modal tra cứu lịch trình bưu kiện
    const viewJourneyBtn = scope.querySelector("#btn-view-journey");
    if (viewJourneyBtn) {
      viewJourneyBtn.onclick = () => {
        samplesState.activeModal = "tracking";
        refresh();
      };
    }

    const liveTrackingBtn = scope.querySelector("#btn-view-live-tracking");
    if (liveTrackingBtn) {
      liveTrackingBtn.onclick = () => {
        samplesState.activeModal = "tracking";
        refresh();
      };
    }

    // E. Nút chuyển sang trang Vận Đơn sàn (#tracking)
    const gotoTrackingBtn = scope.querySelector("#btn-goto-global-tracking");
    if (gotoTrackingBtn) {
      gotoTrackingBtn.onclick = () => {
        const code = gotoTrackingBtn.dataset.code || "88992211";
        window.__SCANMS_TRACKING_QUERY__ = code;
        go("tracking");
        toast(`Đang mở trang Tra cứu vận đơn cho mã ${code}...`);
      };
    }

    // F. Mở modal chỉnh sửa thông tin nhận hàng
    const editInfoBtn = scope.querySelector("#btn-edit-sample-info");
    if (editInfoBtn) {
      editInfoBtn.onclick = () => {
        samplesState.activeModal = "edit";
        refresh();
      };
    }

    // G. Mở modal hủy yêu cầu
    const cancelBtn = scope.querySelector("#btn-cancel-sample");
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        samplesState.activeModal = "cancel";
        refresh();
      };
    }

    // H. Xem giải thích tại sao bị khóa sửa/hủy
    const lockedExplainBtn = scope.querySelector("#btn-locked-explain");
    if (lockedExplainBtn) {
      lockedExplainBtn.onclick = () => {
        samplesState.activeModal = "locked-notice";
        refresh();
      };
    }

    // I. Nhắn tin với Shop có ngữ cảnh đơn hàng mẫu
    const contactShopBtn = scope.querySelector("#btn-contact-shop");
    if (contactShopBtn) {
      contactShopBtn.onclick = () => {
        const id = contactShopBtn.dataset.requestId;
        const target = samplesState.requests.find((r) => r.id === id);
        if (target) {
          window.__SCANMS_CHAT_CONTEXT__ = {
            orderId: target.id,
            productName: target.productName,
            status: target.statusLabel,
            trackingCode: target.trackingCode || "Chờ cấp",
            image: target.image,
            price: money(target.price),
          };
          toast(`Đang mở tin nhắn với Shop Sora Skin kèm ngữ cảnh đơn ${target.id}...`);
          go("chat");
        }
      };
    }

    // J. Thao tác Xác nhận đã nhận được hàng
    const confirmDeliveryBtn = scope.querySelector("#btn-confirm-delivery");
    if (confirmDeliveryBtn) {
      confirmDeliveryBtn.onclick = () => {
        const id = confirmDeliveryBtn.dataset.requestId;
        const target = samplesState.requests.find((r) => r.id === id);
        if (target) {
          target.status = "delivered";
          target.statusLabel = "Đã nhận hàng";
          target.statusBadge = "brand";
          target.deliveredAt = "Hôm nay, 08/09/2026";
          target.journey.push({
            time: "08/09/2026, 14:00",
            text: "KOL đã xác nhận nhận hàng mẫu thành công",
            done: true,
          });
          persistRequests(samplesState.requests);
          refresh();
          toast(`Xác nhận đã nhận hàng mẫu ${id} thành công! Hãy trải nghiệm và chuẩn bị video review bạn nhé.`);
        }
      };
    }

    // K. Mở modal nộp link review
    const submitReviewBtn = scope.querySelector("#btn-submit-review");
    if (submitReviewBtn) {
      submitReviewBtn.onclick = () => {
        samplesState.activeModal = "submit-review";
        refresh();
      };
    }

    // L. Đăng ký xin lại sản phẩm đã hủy
    const reapplyBtn = scope.querySelector("#btn-reapply-sample");
    if (reapplyBtn) {
      reapplyBtn.onclick = () => {
        const prodId = reapplyBtn.dataset.productId || sampleCatalog[0].id;
        samplesState.activeModal = "request";
        samplesState.tempFormData = { productId: prodId };
        refresh();
      };
    }
  }

  // 2. Chọn dòng yêu cầu trong danh sách (giữ nguyên vị trí cuộn, không dựng lại trang)
  function selectSampleItem(id, cardEl) {
    samplesState.selectedRequestId = id;
    const cards = container.querySelectorAll(".sample-item-card");
    cards.forEach((c) => {
      const isMatch = c.dataset.requestId === id;
      c.classList.toggle("active", isMatch);
      c.setAttribute("aria-selected", isMatch ? "true" : "false");
    });

    if (cardEl) {
      cardEl.focus();
    }

    const detailCard = container.querySelector(".samples-detail-card");
    const item = samplesState.requests.find((r) => r.id === id);
    if (detailCard) {
      if (item) {
        detailCard.innerHTML = renderSampleDetail(item);
      } else {
        detailCard.innerHTML = `
          <div class="samples-detail-empty-selection">
            <div class="empty-selection-icon"><i class="ph ph-file-dashed"></i></div>
            <h3>Không có yêu cầu nào được chọn</h3>
            <p>Yêu cầu đang chọn không còn nằm trong kết quả lọc. Vui lòng chọn một yêu cầu khác hoặc xóa bộ lọc để tiếp tục.</p>
            <button class="btn small secondary" id="btn-reset-filter-from-detail" type="button">
              <i class="ph ph-arrow-counter-clockwise"></i> Xem tất cả yêu cầu
            </button>
          </div>
        `;
      }
      bindSampleDetailEvents(detailCard);
    }

    // Trên mobile: chuyển sang panel chi tiết
    const layout = container.querySelector(".samples-layout");
    if (layout) {
      layout.classList.add("viewing-detail");
      if (window.innerWidth <= 768 && detailCard) {
        detailCard.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }
  }

  const itemCards = Array.from(container.querySelectorAll(".sample-item-card"));
  itemCards.forEach((card, index) => {
    card.onclick = () => {
      selectSampleItem(card.dataset.requestId, card);
    };

    // Hỗ trợ bàn phím: Enter / Space để chọn; Mũi tên lên / xuống để duyệt
    card.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectSampleItem(card.dataset.requestId, card);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextCard = itemCards[index + 1];
        if (nextCard) {
          selectSampleItem(nextCard.dataset.requestId, nextCard);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevCard = itemCards[index - 1];
        if (prevCard) {
          selectSampleItem(prevCard.dataset.requestId, prevCard);
        }
      }
    };
  });

  // Gắn sự kiện ban đầu cho panel Chi tiết
  bindSampleDetailEvents(container);

  // 3. Dropdown Trạng thái (thay thế hàng tabs cuộn ngang)
  const statusDropdown = container.querySelector("#samples-status-dropdown");
  if (statusDropdown) {
    statusDropdown.onchange = (e) => {
      samplesState.statusFilter = e.target.value;
      refresh();
    };
  }

  // 4. Tìm kiếm từ khóa thời gian thực & nút Xóa tìm kiếm
  const searchInput = container.querySelector("#samples-search-input");
  if (searchInput) {
    searchInput.oninput = (e) => {
      samplesState.searchQuery = e.target.value;
      clearTimeout(searchInput._timer);
      searchInput._timer = setTimeout(() => {
        refresh();
        const newSearch = root.querySelector("#samples-search-input");
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      }, 200);
    };
  }

  const clearSearchBtn = container.querySelector("#btn-clear-search-input");
  if (clearSearchBtn) {
    clearSearchBtn.onclick = () => {
      samplesState.searchQuery = "";
      refresh();
      const newSearch = root.querySelector("#samples-search-input");
      if (newSearch) newSearch.focus();
    };
  }

  // 5. Nút Xóa bộ lọc / Xem tất cả
  const clearFilterBtns = container.querySelectorAll(
    "#btn-clear-sample-filter, #btn-reset-sample-filter, #btn-reset-filter-from-detail"
  );
  clearFilterBtns.forEach((btn) => {
    btn.onclick = () => {
      samplesState.statusFilter = "all";
      samplesState.searchQuery = "";
      refresh();
    };
  });

  // 6. Nút thử lại khi lỗi
  const retryBtn = container.querySelector("#btn-samples-retry");
  if (retryBtn) {
    retryBtn.onclick = () => {
      samplesState.uiMode = "loading";
      refresh();
      setTimeout(() => {
        samplesState.uiMode = "normal";
        refresh();
        toast("Kết nối thành công! Đã nạp lại danh sách hàng mẫu.");
      }, 800);
    };
  }

  // 7. Mở Modal Xin Mẫu Mới
  const openReqModal = container.querySelector("#btn-open-request-modal");
  if (openReqModal) {
    openReqModal.onclick = () => {
      samplesState.activeModal = "request";
      samplesState.tempFormData = { productId: sampleCatalog[0].id };
      refresh();
    };
  }

  const emptyReqBtn = container.querySelector("#btn-empty-request");
  if (emptyReqBtn) {
    emptyReqBtn.onclick = () => {
      samplesState.activeModal = "request";
      samplesState.uiMode = "normal";
      samplesState.tempFormData = { productId: sampleCatalog[0].id };
      refresh();
    };
  }

  const retrySampleBtn = container.querySelector("#btn-retry-sample");
  if (retrySampleBtn) {
    retrySampleBtn.onclick = () => {
      samplesState.activeModal = "request";
      samplesState.tempFormData = { productId: sampleCatalog[0].id };
      refresh();
    };
  }

  // 8. Đăng ký xin lại sản phẩm đã hủy
  const reapplyBtn = container.querySelector("#btn-reapply-sample");
  if (reapplyBtn) {
    reapplyBtn.onclick = () => {
      const prodId = reapplyBtn.dataset.productId || sampleCatalog[0].id;
      samplesState.activeModal = "request";
      samplesState.tempFormData = { productId: prodId };
      refresh();
    };
  }

  // 9. Nút mở modal Chính sách Shop
  const policyBtn = container.querySelector("#btn-samples-policy");
  if (policyBtn) {
    policyBtn.onclick = () => {
      samplesState.activeModal = "policy";
      refresh();
    };
  }

  const policyChatBtn = container.querySelector("#btn-policy-chat");
  if (policyChatBtn) {
    policyChatBtn.onclick = () => {
      samplesState.activeModal = null;
      window.__SCANMS_CHAT_CONTEXT__ = {
        orderId: "TƯ VẤN CHÍNH SÁCH",
        productName: "Chính sách hàng mẫu Thu Đông 2026",
        status: "Thảo luận",
        trackingCode: "Không có",
        image: serumImage,
      };
      go("chat");
      toast("Đã chuyển sang Chat để thảo luận điều kiện cấp mẫu riêng với Shop.");
    };
  }

  // 10. Nút khôi phục dữ liệu demo ban đầu
  const resetDemoBtn = container.querySelector("#btn-samples-reset");
  if (resetDemoBtn) {
    resetDemoBtn.onclick = () => {
      if (confirm("Khôi phục toàn bộ dữ liệu đơn hàng mẫu về trạng thái demo ban đầu?")) {
        resetSamplesDemoData();
        refresh();
        toast("Đã khôi phục dữ liệu mẫu ban đầu thành công!");
      }
    };
  }

  // Modal tracking & chat shortcuts
  const modalGotoTracking = container.querySelector("#btn-goto-tracking-page");
  if (modalGotoTracking) {
    modalGotoTracking.onclick = () => {
      const selected = samplesState.requests.find((r) => r.id === samplesState.selectedRequestId);
      const code = selected ? selected.trackingCode || "88992211" : "88992211";
      window.__SCANMS_TRACKING_QUERY__ = code;
      samplesState.activeModal = null;
      go("tracking");
      toast(`Đang mở trang Tra cứu vận đơn cho mã ${code}...`);
    };
  }

  const lockedChatBtn = container.querySelector("#btn-locked-chat");
  if (lockedChatBtn) {
    lockedChatBtn.onclick = () => {
      const selected = samplesState.requests.find((r) => r.id === samplesState.selectedRequestId);
      if (selected) {
        window.__SCANMS_CHAT_CONTEXT__ = {
          orderId: selected.id,
          productName: selected.productName,
          status: selected.statusLabel,
          trackingCode: selected.trackingCode || "Chờ cấp",
          image: selected.image,
        };
      }
      samplesState.activeModal = null;
      go("chat");
    };
  }

  // 20. Đóng các Modal
  const modalClose = container.querySelector("#modal-close");
  if (modalClose) {
    modalClose.onclick = () => {
      samplesState.activeModal = null;
      refresh();
    };
  }

  const modalCancel = container.querySelector("#modal-cancel");
  if (modalCancel) {
    modalCancel.onclick = () => {
      samplesState.activeModal = null;
      refresh();
    };
  }

  const backdrop = container.querySelector("#samples-modal-backdrop");
  if (backdrop) {
    backdrop.onclick = (e) => {
      if (e.target === backdrop) {
        samplesState.activeModal = null;
        refresh();
      }
    };
  }

  // 21. Dynamic update khi chọn sản phẩm khác trong modal xin mẫu
  const reqProductSelect = container.querySelector("#req-product");
  if (reqProductSelect) {
    reqProductSelect.onchange = (e) => {
      samplesState.tempFormData = {
        ...samplesState.tempFormData,
        productId: e.target.value,
      };
      refresh();
    };
  }

  // 22. Xử lý Submit Form Xin Mẫu Mới (Kèm Validation & Loading)
  const formRequest = container.querySelector("#form-sample-request");
  if (formRequest) {
    formRequest.onsubmit = (e) => {
      e.preventDefault();
      const prodId = container.querySelector("#req-product").value;
      const prod = sampleCatalog.find((p) => p.id === prodId) || sampleCatalog[0];
      const name = container.querySelector("#req-name").value.trim();
      const phone = container.querySelector("#req-phone").value.trim();
      const address = container.querySelector("#req-address").value.trim();
      const channel = container.querySelector("#req-channel").value;
      const format = container.querySelector("#req-format").value;
      const commitment = container.querySelector("#req-commitment").value.trim();

      // Kiểm tra SĐT
      if (!validateVNPhone(phone)) {
        const hint = container.querySelector("#phone-hint");
        if (hint) {
          hint.style.color = "var(--danger)";
          hint.innerHTML = `<i class="ph ph-warning-circle"></i> Số điện thoại không đúng định dạng VN (Cần có 10 số, bắt đầu bằng 03x, 05x, 07x, 08x, 09x)`;
        }
        toast("Vui lòng kiểm tra lại số điện thoại nhận hàng!");
        return;
      }

      // Kiểm tra địa chỉ
      if (address.length < 10) {
        toast("Vui lòng nhập địa chỉ nhận hàng chi tiết hơn (tối thiểu 10 ký tự).");
        return;
      }

      // Kiểm tra cam kết
      if (commitment.length < 20) {
        toast("Vui lòng nêu rõ hơn đề xuất kịch bản và cam kết nội dung (tối thiểu 20 ký tự).");
        return;
      }

      // Kiểm tra đơn trùng
      const duplicate = samplesState.requests.find(
        (r) => r.productId === prod.id && ["pending", "approved", "shipping"].includes(r.status)
      );
      if (duplicate) {
        toast(`Bạn đã có đơn ${duplicate.id} cho sản phẩm này đang xử lý! Không thể gửi thêm.`);
        return;
      }

      // Bắt đầu luồng gửi (Loading state)
      samplesState.isSubmitting = true;
      refresh();

      setTimeout(() => {
        samplesState.isSubmitting = false;

        // Sinh mã yêu cầu mới
        const newId = `SMP-${Math.floor(1000 + Math.random() * 9000)}`;

        const newRequest = {
          id: newId,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          price: prod.price,
          image: prod.image,
          status: "pending",
          statusLabel: "Chờ Shop duyệt",
          statusBadge: "warning",
          carrier: null,
          trackingCode: null,
          createdAt: "Vừa xong",
          approvedAt: null,
          shippedAt: null,
          estimatedDelivery: "Dự kiến 2-3 ngày sau duyệt",
          deliveredAt: null,
          recipient: name,
          phone: phone,
          address: address,
          channel: channel,
          channelFollowers: "Đã liên kết",
          format: format,
          commitment: commitment,
          reviewDeadline: "Trong 7 ngày sau nhận",
          reviewLink: null,
          rejectReason: null,
          shipperName: null,
          journey: [
            { time: "Vừa xong", text: "KOL gửi đề xuất xin sản phẩm mẫu", done: true },
            { time: "Đang chờ", text: "Shop Sora Skin đang thẩm định hồ sơ kênh truyền thông", done: false },
          ],
        };

        // Thêm vào đầu danh sách và lưu localStorage
        samplesState.requests.unshift(newRequest);
        samplesState.selectedRequestId = newId;
        samplesState.activeModal = null;
        samplesState.tempFormData = null;
        persistRequests(samplesState.requests);
        refresh();
        toast(`Đã gửi đề xuất nhận mẫu ${newId} thành công! Shop sẽ xét duyệt theo quy định chiến dịch.`);
      }, 800);
    };
  }

  // 23. Xử lý Submit Form Chỉnh Sửa Thông Tin
  const formEdit = container.querySelector("#form-edit-sample");
  if (formEdit) {
    formEdit.onsubmit = (e) => {
      e.preventDefault();
      const phone = container.querySelector("#edit-phone").value.trim();
      if (!validateVNPhone(phone)) {
        const hint = container.querySelector("#edit-phone-hint");
        if (hint) {
          hint.style.color = "var(--danger)";
          hint.innerHTML = `<i class="ph ph-warning-circle"></i> Số điện thoại không đúng định dạng VN (03x, 05x, 07x, 08x, 09x)`;
        }
        toast("Số điện thoại không hợp lệ!");
        return;
      }

      const target = samplesState.requests.find((r) => r.id === samplesState.selectedRequestId);
      if (target) {
        target.recipient = container.querySelector("#edit-name").value.trim();
        target.phone = phone;
        target.address = container.querySelector("#edit-address").value.trim();
        target.commitment = container.querySelector("#edit-commitment").value.trim();
        persistRequests(samplesState.requests);
        samplesState.activeModal = null;
        refresh();
        toast("Đã cập nhật thông tin nhận hàng thành công!");
      }
    };
  }

  // 24. Xác nhận Hủy yêu cầu (Không xóa, giữ lịch sử)
  const confirmCancelBtn = container.querySelector("#btn-confirm-cancel-request");
  if (confirmCancelBtn) {
    confirmCancelBtn.onclick = () => {
      const id = confirmCancelBtn.dataset.requestId;
      const target = samplesState.requests.find((r) => r.id === id);
      const reasonInput = container.querySelector("#cancel-reason-input");
      const userReason = reasonInput && reasonInput.value.trim() ? reasonInput.value.trim() : "KOL chủ động hủy yêu cầu nhận mẫu.";

      if (target) {
        target.status = "cancelled";
        target.statusLabel = "Đã hủy yêu cầu";
        target.statusBadge = "neutral";
        target.cancelledAt = "Hôm nay, 08/09/2026";
        target.cancelReason = userReason + " (Suất mẫu đã hoàn trả lại kho chiến dịch).";
        target.journey.push({
          time: "08/09/2026, 14:10",
          text: `KOL đã hủy yêu cầu nhận mẫu: ${userReason}`,
          done: true,
        });
        persistRequests(samplesState.requests);
        samplesState.activeModal = null;
        refresh();
        toast(`Đã hủy yêu cầu nhận mẫu ${id}. Lịch sử đơn vẫn được lưu trong danh sách.`);
      }
    };
  }

  // 25. Xác nhận Nộp link review (Kèm Validation URL)
  const formReview = container.querySelector("#form-submit-review");
  if (formReview) {
    formReview.onsubmit = (e) => {
      e.preventDefault();
      const url = container.querySelector("#review-url").value.trim();
      const platform = container.querySelector("#review-platform").value;

      const check = validateReviewUrl(url, platform);
      if (!check.valid) {
        const hint = container.querySelector("#review-url-hint");
        if (hint) {
          hint.style.color = "var(--danger)";
          hint.innerHTML = `<i class="ph ph-warning-circle"></i> ${check.message}`;
        }
        toast(check.message);
        return;
      }

      const target = samplesState.requests.find((r) => r.id === samplesState.selectedRequestId);
      if (target) {
        target.reviewLink = url;
        target.journey.push({
          time: "Hôm nay, 08/09/2026",
          text: `KOL đã nộp bài review: ${url}`,
          done: true,
        });
        persistRequests(samplesState.requests);
        samplesState.activeModal = null;
        refresh();
        toast("Đã ghi nhận link bài đăng review! Cảm ơn sự đóng góp tuyệt vời của bạn.");
      }
    };
  }
}
