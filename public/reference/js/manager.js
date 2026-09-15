// ==========================================================================
// SCANMS SYSTEM MANAGER MODULE (Vận Hành Nền Tảng)
// ==========================================================================

import { compressAvatarImage, safeSaveProfile } from './image-utils.js';

const icon = (name) => `<i class="ph ${name}" aria-hidden="true"></i>`;
const money = (v) => `${new Intl.NumberFormat("vi-VN").format(v)} ₫`;

export const managerState = {
  activeStoreFilter: "all",
  storeSearchQuery: "",
  selectedStoreDetailId: "STORE-007",
  stores: [
    {
      id: "STORE-007",
      name: "titok shop",
      owner: "Nguyễn Đình Tuấn",
      email: "tuan.store@scanms.vn",
      phone: "0787 664 860",
      taxCode: "0109988776",
      category: "Thương mại điện tử & Bán lẻ",
      submittedAt: "09/09/2026 22:15",
      status: "pending", // 'pending' | 'reviewing' | 'approved' | 'need_info' | 'rejected'
      productsCount: 15,
      kolCount: 0,
      gmv: 0,
      notes: "Hồ sơ đăng ký gian hàng mới trực tuyến của Nguyễn Đình Tuấn. Đang chờ Ban Quản Trị & Vận Hành Sàn thẩm định pháp lý và phê duyệt kích hoạt.",
      rejectionReason: "",
      documents: ["GPKD_titok_shop.pdf", "GiayUyQuyenThuongHieu.pdf"]
    },
    {
      id: "STORE-001",
      name: "Sora Skin Official",
      owner: "Nguyễn Thu Hà",
      email: "shop@scanms.vn",
      phone: "0912 345 678",
      taxCode: "0109823456",
      category: "Mỹ phẩm & Chăm sóc da",
      submittedAt: "05/09/2026 14:30",
      status: "approved", // 'pending' | 'reviewing' | 'approved' | 'need_info' | 'rejected'
      productsCount: 24,
      kolCount: 156,
      gmv: 428000000,
      notes: "Hồ sơ pháp lý đầy đủ GPKD và công bố mỹ phẩm chuẩn Bộ Y Tế.",
      rejectionReason: "",
      documents: ["GPKD_SoraSkin_2026.pdf", "CongBoMyPham_15C.pdf", "HopDong_DaiLy.pdf"]
    },
    {
      id: "STORE-002",
      name: "Gia Dụng Thông Minh ZenHome",
      owner: "Phạm Quốc Hưng",
      email: "contact@zenhome.vn",
      phone: "0988 776 655",
      taxCode: "0312456789",
      category: "Gia dụng & Đời sống",
      submittedAt: "07/09/2026 09:15",
      status: "reviewing",
      productsCount: 18,
      kolCount: 42,
      gmv: 165000000,
      notes: "Đang kiểm tra đối chiếu tài khoản ngân hàng thụ hưởng và hóa đơn đầu vào.",
      rejectionReason: "",
      documents: ["GPKD_ZenHome.pdf", "GiayUyQuyenThuongHieu.pdf"]
    },
    {
      id: "STORE-003",
      name: "Thời Trang Thiết Kế Aura Studio",
      owner: "Lê Cẩm Tú",
      email: "aura.studio@gmail.com",
      phone: "0909 112 233",
      taxCode: "0107654321",
      category: "Thời trang & Phụ kiện",
      submittedAt: "08/09/2026 11:20",
      status: "pending",
      productsCount: 35,
      kolCount: 0,
      gmv: 0,
      notes: "Cửa hàng mới nộp hồ sơ. Chờ chuyên viên vận hành tiếp nhận thẩm định.",
      rejectionReason: "",
      documents: ["GPKD_AuraStudio.pdf"]
    },
    {
      id: "STORE-004",
      name: "Thực Phẩm Xanh EcoMart",
      owner: "Trần Minh Đạt",
      email: "ecomart.vn@gmail.com",
      phone: "0934 567 890",
      taxCode: "0319876543",
      category: "Thực phẩm & Sức khỏe",
      submittedAt: "06/09/2026 16:45",
      status: "need_info",
      productsCount: 12,
      kolCount: 0,
      gmv: 0,
      notes: "Thiếu giấy chứng nhận Vệ sinh an toàn thực phẩm (VSATTP) cho mặt hàng hạt dinh dưỡng.",
      rejectionReason: "",
      documents: ["GPKD_EcoMart.pdf"]
    },
    {
      id: "STORE-005",
      name: "Phụ Kiện Công Nghệ TechVolt",
      owner: "Hoàng Nam",
      email: "techvolt@outlook.com",
      phone: "0945 678 123",
      taxCode: "0105558889",
      category: "Công nghệ & Điện tử",
      submittedAt: "04/09/2026 10:00",
      status: "rejected",
      productsCount: 0,
      kolCount: 0,
      gmv: 0,
      notes: "Từ chối do sản phẩm không có giấy chứng nhận hợp quy ICT theo quy định.",
      rejectionReason: "Sản phẩm sạc dự phòng không cung cấp được chứng nhận hợp quy ICT & hồ sơ xuất xứ CO/CQ.",
      documents: ["GPKD_TechVolt.pdf"]
    }
  ],

  banks: [
    { id: "VCB", code: "970436", name: "Vietcombank", shortName: "VCB", logo: "ph-bank", active: true, transferTime: "Tức thì (24/7)", sandboxLabel: "Sandbox Simulator", totalPayouts: "1.240 đơn" },
    { id: "MB", code: "970422", name: "MB Bank (Ngân hàng Quân Đội)", shortName: "MB", logo: "ph-bank", active: true, transferTime: "Tức thì (24/7)", sandboxLabel: "Sandbox Simulator", totalPayouts: "890 đơn" },
    { id: "TCB", code: "970407", name: "Techcombank", shortName: "TCB", logo: "ph-bank", active: true, transferTime: "Tức thì (24/7)", sandboxLabel: "Sandbox Simulator", totalPayouts: "720 đơn" },
    { id: "ACB", code: "970416", name: "ACB (Ngân hàng Á Châu)", shortName: "ACB", logo: "ph-bank", active: true, transferTime: "Tức thì (24/7)", sandboxLabel: "Sandbox Simulator", totalPayouts: "430 đơn" },
    { id: "VPB", code: "970432", name: "VPBank", shortName: "VPB", logo: "ph-bank", active: false, transferTime: "Tạm dừng bảo trì cổng", sandboxLabel: "Sandbox Simulator", totalPayouts: "210 đơn" }
  ],

  fraudAlerts: [
    {
      id: "FRD-901",
      kolName: "Hoàng Đức (hoangduc.review)",
      kolId: "KOL-782",
      riskLevel: "high", // 'high' | 'medium' | 'low'
      score: 94,
      reason: "Bất thường tần suất click (Velocity Spike): 1.420 clicks trong 2 phút từ cùng dải IP proxy.",
      detectedAt: "08/09/2026 15:24",
      ipAddress: "14.241.88.19 (VNPT Proxy)",
      targetStore: "Sora Skin Official",
      status: "pending", // 'pending' | 'processing' | 'resolved_fraud' | 'false_positive' | 'escalated'
      handledBy: "",
      resolutionNote: ""
    },
    {
      id: "FRD-902",
      kolName: "Mai Linh (linhmai.deals)",
      kolId: "KOL-419",
      riskLevel: "medium",
      score: 68,
      reason: "Trùng khớp dấu vân tay thiết bị (Device Fingerprint) giữa tài khoản mua hàng và tài khoản tạo link tiếp thị.",
      detectedAt: "08/09/2026 11:10",
      ipAddress: "113.161.45.88",
      targetStore: "Gia Dụng ZenHome",
      status: "processing",
      handledBy: "Lê Hồng Phúc (Vận Hành Sàn)",
      resolutionNote: "Đang yêu cầu Shop xác minh đối chiếu địa chỉ nhận hàng và họ tên người mua."
    },
    {
      id: "FRD-903",
      kolName: "Phương Anh (panh.beauty)",
      kolId: "KOL-155",
      riskLevel: "low",
      score: 42,
      reason: "Tỷ lệ chuyển đổi đơn hàng tăng đột biến trong khung giờ 02:00 - 04:00 sáng.",
      detectedAt: "07/09/2026 22:40",
      ipAddress: "27.72.102.15",
      targetStore: "Sora Skin Official",
      status: "false_positive",
      handledBy: "Lê Hồng Phúc (Vận Hành Sàn)",
      resolutionNote: "Xác minh hợp lệ: KOL đang chạy buổi livestream đêm muộn có 12.000 người xem đồng thời."
    }
  ],

  opsLogs: [
    { id: "LOG-01", time: "08/09 15:30", actor: "Lê Hồng Phúc (Vận Hành Sàn)", action: "TIẾP NHẬN XỬ LÝ", target: "FRD-901 (KOL-782)", note: "Tiếp nhận cảnh báo click bất thường để phân tích log truy cập." },
    { id: "LOG-02", time: "08/09 14:15", actor: "Lê Hồng Phúc (Vận Hành Sàn)", action: "YÊU CẦU BỔ SUNG", target: "STORE-004 (EcoMart)", note: "Yêu cầu bổ sung Giấy chứng nhận VSATTP." },
    { id: "LOG-03", time: "07/09 18:20", actor: "Lê Hồng Phúc (Vận Hành Sàn)", action: "DUYỆT HỒ SƠ", target: "STORE-001 (Sora Skin)", note: "Phê duyệt kích hoạt gian hàng đối tác Enterprise." },
    { id: "LOG-04", time: "07/09 10:00", actor: "Lê Hồng Phúc (Vận Hành Sàn)", action: "KẾT LUẬN HỢP LỆ", target: "FRD-903 (KOL-155)", note: "Ghi nhận Livestream đêm là đơn hàng thực tế." }
  ],

  activeStoreFilter: "all",
  activeFraudFilter: "all",
  selectedStoreDetailId: null
};

// --------------------------------------------------------------------------
// 1. TỔNG QUAN VẬN HÀNH (MANAGER DASHBOARD)
// --------------------------------------------------------------------------
export function managerDashboardScreen() {
  const pendingStores = managerState.stores.filter(s => s.status === "pending" || s.status === "reviewing").length;
  const needInfoStores = managerState.stores.filter(s => s.status === "need_info").length;
  const pendingFrauds = managerState.fraudAlerts.filter(f => f.status === "pending" || f.status === "processing").length;
  const activeBanks = managerState.banks.filter(b => b.active).length;

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Vận hành nền tảng / </span><strong>Tổng quan vận hành</strong></div>
        <h1>Trung Tâm Vận Hành Sàn (Platform Operations)</h1>
        <p>Giám sát tiến độ xét duyệt gian hàng Shop, điều phối danh mục ngân hàng hỗ trợ và xử lý cảnh báo gian lận thời gian thực.</p>
      </div>
      <div class="actions">
        <span class="badge" style="background:var(--brand-soft);color:var(--brand-strong);padding:8px 14px;border-radius:10px;font-weight:600">
          ${icon("ph-shield-check")} Quyền hạn: Vận Hành Sàn
        </span>
      </div>
    </header>

    <!-- 4 Khối Chỉ Số Vận Hành Cốt Lõi (Clickable chuyển nhanh) -->
    <div class="grid kpis" style="grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
      <div class="card kpi-card clickable" data-mgr-goto="manager-stores" data-mgr-filter="pending" style="cursor:pointer;transition:transform .18s ease" title="Bấm để xem danh sách Shop chờ duyệt">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <small style="color:var(--muted);font-weight:600">Shop Chờ Xét Duyệt</small>
          <span style="background:#fef3c7;color:#d97706;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:18px">${icon("ph-hourglass-high")}</span>
        </div>
        <strong style="font-size:30px;display:block;margin:8px 0 4px;color:#d97706">${pendingStores}</strong>
        <span style="font-size:12px;color:var(--muted)">Cần xử lý thẩm định trong 24h &rarr;</span>
      </div>

      <div class="card kpi-card clickable" data-mgr-goto="manager-stores" data-mgr-filter="need_info" style="cursor:pointer;transition:transform .18s ease" title="Bấm để xem danh sách Shop cần bổ sung">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <small style="color:var(--muted);font-weight:600">Hồ Sơ Cần Bổ Sung</small>
          <span style="background:#e0e7ff;color:#4f46e5;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:18px">${icon("ph-file-arrow-up")}</span>
        </div>
        <strong style="font-size:30px;display:block;margin:8px 0 4px;color:#4f46e5">${needInfoStores}</strong>
        <span style="font-size:12px;color:var(--muted)">Đang chờ Shop nộp lại tài liệu &rarr;</span>
      </div>

      <div class="card kpi-card clickable" data-mgr-goto="manager-fraud" data-mgr-filter="pending" style="cursor:pointer;transition:transform .18s ease" title="Bấm để xem cảnh báo gian lận">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <small style="color:var(--muted);font-weight:600">Cảnh Báo Gian Lận Chưa Xử Lý</small>
          <span style="background:#fee2e2;color:#dc2626;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:18px">${icon("ph-warning-octagon")}</span>
        </div>
        <strong style="font-size:30px;display:block;margin:8px 0 4px;color:#dc2626">${pendingFrauds}</strong>
        <span style="font-size:12px;color:var(--muted)">AI Sentinel phát hiện rủi ro &rarr;</span>
      </div>

      <div class="card kpi-card clickable" data-mgr-goto="manager-banks" style="cursor:pointer;transition:transform .18s ease" title="Bấm để quản lý danh mục ngân hàng">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <small style="color:var(--muted);font-weight:600">Ngân Hàng Hoạt Động</small>
          <span style="background:#d1fae5;color:#059669;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:18px">${icon("ph-bank")}</span>
        </div>
        <strong style="font-size:30px;display:block;margin:8px 0 4px;color:#059669">${activeBanks} / ${managerState.banks.length}</strong>
        <span style="font-size:12px;color:var(--muted)">Hạ tầng VietQR / Napas (Sandbox) &rarr;</span>
      </div>
    </div>

    <!-- Hàng Nội dung: Bảng Hồ Sơ Mới Nhất & Cảnh Báo Gần Nhất -->
    <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px;align-items:start">
      <div class="card" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div>
            <h3 style="margin:0;font-size:16px">${icon("ph-buildings")} Hồ sơ Shop cần xử lý gấp</h3>
            <small style="color:var(--muted)">Tuân thủ quy trình thẩm định 4 bước không bỏ qua kiểm tra pháp lý</small>
          </div>
          <button class="btn small secondary" data-mgr-goto="manager-stores">Xem tất cả</button>
        </div>
        <div class="table-wrap" style="border:none">
          <table style="width:100%">
            <thead>
              <tr>
                <th>Tên Gian Hàng</th>
                <th>Chủ Sở Hữu</th>
                <th>Thời Gian Gửi</th>
                <th>Trạng Thái</th>
                <th style="text-align:right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              ${managerState.stores.slice(0, 4).map(st => `
                <tr>
                  <td>
                    <strong>${st.name}</strong>
                    <div style="font-size:11px;color:var(--muted)">${st.category}</div>
                  </td>
                  <td>${st.owner}</td>
                  <td style="font-size:12px;color:var(--muted)">${st.submittedAt}</td>
                  <td>${renderStoreStatusBadge(st.status)}</td>
                  <td style="text-align:right">
                    <button class="btn small" data-mgr-view-store="${st.id}" style="padding:4px 10px;font-size:12px">Thẩm định</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div>
            <h3 style="margin:0;font-size:16px">${icon("ph-shield-warning")} Cảnh báo gian lận mới</h3>
            <small style="color:var(--muted)">AI Sentinel gắn cờ tự động</small>
          </div>
          <button class="btn small secondary" data-mgr-goto="manager-fraud">Xem tất cả</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${managerState.fraudAlerts.map(fa => `
            <div style="padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span class="badge ${fa.riskLevel === 'high' ? 'danger' : (fa.riskLevel === 'medium' ? 'warning' : 'neutral')}" style="font-size:11px;font-weight:700">
                  RỦI RO ${fa.riskLevel.toUpperCase()} • ${fa.score}đ
                </span>
                <span style="font-size:11.5px;color:var(--muted)">${fa.detectedAt}</span>
              </div>
              <strong style="font-size:13px;display:block;margin-bottom:4px">${fa.kolName}</strong>
              <p style="font-size:12px;color:var(--muted);margin:0 0 8px;line-height:1.4">${fa.reason}</p>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <small style="color:var(--muted)">Mục tiêu: <strong>${fa.targetStore}</strong></small>
                <button class="text-btn" data-mgr-handle-fraud="${fa.id}" style="font-size:12px;font-weight:600">Xử lý ngay &rarr;</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function getStoreAvatarGradient(id) {
  const gradients = [
    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    "linear-gradient(135deg, #10b981 0%, #047857 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
    "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)"
  ];
  let sum = 0;
  for (let i = 0; i < (id || "").length; i++) sum += id.charCodeAt(i);
  return gradients[sum % gradients.length];
}

function getStoreShadow(id) {
  const shadows = [
    "rgba(59, 130, 246, 0.28)",
    "rgba(139, 92, 246, 0.28)",
    "rgba(236, 72, 153, 0.28)",
    "rgba(16, 185, 129, 0.28)",
    "rgba(245, 158, 11, 0.28)",
    "rgba(99, 102, 241, 0.28)",
    "rgba(14, 165, 233, 0.28)"
  ];
  let sum = 0;
  for (let i = 0; i < (id || "").length; i++) sum += id.charCodeAt(i);
  return shadows[sum % shadows.length];
}

// Helper render status badge
function renderStoreStatusBadge(status) {
  switch (status) {
    case "approved":
      return `<span class="status-pill status-approved" style="display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);color:#065f46;border:1px solid #a7f3d0;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;box-shadow:0 1px 3px rgba(16,185,129,0.1);white-space:nowrap"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 0 2px rgba(16,185,129,0.25)"></span><i class="ph-fill ph-seal-check" style="color:#059669;font-size:12px"></i> Đã duyệt</span>`;
    case "reviewing":
      return `<span class="status-pill status-reviewing" style="display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);color:#1e40af;border:1px solid #bfdbfe;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;box-shadow:0 1px 3px rgba(59,130,246,0.1);white-space:nowrap"><span style="width:6px;height:6px;border-radius:50%;background:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,0.25)"></span><i class="ph-bold ph-hourglass-high" style="color:#2563eb;font-size:11px"></i> Đang xét</span>`;
    case "pending":
      return `<span class="status-pill status-pending" style="display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);color:#92400e;border:1px solid #fde68a;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;box-shadow:0 1px 3px rgba(245,158,11,0.12);white-space:nowrap"><span style="width:6px;height:6px;border-radius:50%;background:#d97706;box-shadow:0 0 0 2px rgba(217,119,6,0.25)"></span><i class="ph-bold ph-clock-countdown" style="color:#d97706;font-size:11px"></i> Chờ duyệt</span>`;
    case "need_info":
      return `<span class="status-pill status-need-info" style="display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%);color:#9a3412;border:1px solid #fed7aa;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;box-shadow:0 1px 3px rgba(234,88,12,0.1);white-space:nowrap"><span style="width:6px;height:6px;border-radius:50%;background:#ea580c;box-shadow:0 0 0 2px rgba(234,88,12,0.25)"></span><i class="ph-fill ph-warning-circle" style="color:#ea580c;font-size:12px"></i> Bổ sung</span>`;
    case "rejected":
      return `<span class="status-pill status-rejected" style="display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#fef2f2 0%,#fee2e2 100%);color:#991b1b;border:1px solid #fecaca;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(220,38,38,0.1);white-space:nowrap"><span style="width:6px;height:6px;border-radius:50%;background:#dc2626"></span><i class="ph-fill ph-x-circle" style="color:#dc2626;font-size:12px"></i> Từ chối</span>`;
    default:
      return `<span class="badge neutral">${status}</span>`;
  }
}

// --------------------------------------------------------------------------
// 2. HỒ SƠ & XÉT DUYỆT SHOP (MANAGER STORES)
// --------------------------------------------------------------------------
export function managerStoresScreen() {
  try {
    const raw = localStorage.getItem("scanms-pending-shop");
    if (raw) {
      const ps = JSON.parse(raw);
      if (ps && ps.id) {
        const found = managerState.stores.find(s => s.id === ps.id || s.email === ps.email);
        if (found) {
          if (ps.status) found.status = ps.status;
        } else {
          managerState.stores.unshift(ps);
        }
      }
    }
  } catch (e) {}

  const filter = managerState.activeStoreFilter;
  const searchQ = (managerState.storeSearchQuery || "").trim().toLowerCase();
  const filtered = managerState.stores.filter(s => {
    let matchFilter = true;
    if (filter === "all") matchFilter = true;
    else if (filter === "pending") matchFilter = s.status === "pending" || s.status === "reviewing";
    else matchFilter = s.status === filter;

    if (!matchFilter) return false;
    if (!searchQ) return true;
    return (
      (s.name && s.name.toLowerCase().includes(searchQ)) ||
      (s.id && s.id.toLowerCase().includes(searchQ)) ||
      (s.taxCode && s.taxCode.toLowerCase().includes(searchQ)) ||
      (s.owner && s.owner.toLowerCase().includes(searchQ)) ||
      (s.email && s.email.toLowerCase().includes(searchQ))
    );
  });

  return `
    <header class="page-head" style="margin-bottom:24px">
      <div>
        <div class="crumb"><span>Vận hành / </span><strong>Hồ sơ Cửa hàng (Shop)</strong></div>
        <h1 style="font-size:26px;font-weight:800;letter-spacing:-0.02em;margin:6px 0">Thẩm Định & Xét Duyệt Gian Hàng Shop</h1>
        <p style="color:var(--muted);font-size:14px;margin:0">Quy trình thẩm định pháp lý 4 trạng thái chuẩn: Chờ xét duyệt &rarr; Đang xem xét &rarr; Được duyệt / Cần bổ sung / Bị từ chối.</p>
      </div>
      <div class="actions">
        <button class="btn secondary" data-mgr-toast="Đã xuất danh sách hồ sơ Shop" style="display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:11px;font-weight:700;font-size:13px;border:1.5px solid rgba(16,185,129,0.3);background:linear-gradient(135deg,#ffffff 0%,#f0fdf4 100%);color:#047857;box-shadow:0 2px 6px rgba(16,185,129,0.08);cursor:pointer;transition:all .18s ease">
          <i class="ph-bold ph-microsoft-excel-logo" style="font-size:17px;color:#10b981"></i>
          <span>Xuất Excel</span>
        </button>
      </div>
    </header>

    <!-- Bộ Lọc Trạng Thái Pipeline Chuẩn -->
    <div class="toolbar" style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">
      <div class="segmented" style="margin:0;display:inline-flex;background:var(--surface-2);padding:4px;border-radius:12px;border:1px solid var(--line);gap:2px">
        <button class="${filter === 'all' ? 'active' : ''}" data-mgr-store-filter="all" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer;transition:all .15s ease">
          <i class="ph ph-storefront" style="font-size:14px"></i> Tất cả (${managerState.stores.length})
        </button>
        <button class="${filter === 'pending' ? 'active' : ''}" data-mgr-store-filter="pending" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer;transition:all .15s ease">
          <i class="ph-bold ph-hourglass-high" style="font-size:14px;color:#d97706"></i> Chờ & Đang duyệt (${managerState.stores.filter(s => s.status === 'pending' || s.status === 'reviewing').length})
        </button>
        <button class="${filter === 'need_info' ? 'active' : ''}" data-mgr-store-filter="need_info" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer;transition:all .15s ease">
          <i class="ph-bold ph-warning-circle" style="font-size:14px;color:#ea580c"></i> Cần bổ sung (${managerState.stores.filter(s => s.status === 'need_info').length})
        </button>
        <button class="${filter === 'approved' ? 'active' : ''}" data-mgr-store-filter="approved" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer;transition:all .15s ease">
          <i class="ph-bold ph-seal-check" style="font-size:14px;color:#059669"></i> Đã duyệt (${managerState.stores.filter(s => s.status === 'approved').length})
        </button>
        <button class="${filter === 'rejected' ? 'active' : ''}" data-mgr-store-filter="rejected" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer;transition:all .15s ease">
          <i class="ph-bold ph-x-circle" style="font-size:14px;color:#e11d48"></i> Bị từ chối (${managerState.stores.filter(s => s.status === 'rejected').length})
        </button>
      </div>
      <div style="display:flex;gap:10px">
        <div class="mgr-search-box" style="margin:0;display:inline-flex;align-items:center;gap:10px;background:var(--surface);border:1.5px solid var(--line);border-radius:11px;padding:0 14px;height:42px;box-shadow:0 1px 3px rgba(0,0,0,0.03);min-width:280px;box-sizing:border-box">
          <i class="ph ph-magnifying-glass" style="font-size:17px;color:var(--muted);flex-shrink:0;position:static !important"></i>
          <input type="text" style="border:none;background:transparent;outline:none;font-size:13px;padding:0;width:100%;color:var(--ink);font-family:inherit" placeholder="Tìm kiếm tên Shop, MST, email..." id="mgr-store-search" value="${managerState.storeSearchQuery || ''}" />
          ${managerState.storeSearchQuery ? `<button id="mgr-store-search-clear" style="border:none;background:transparent;cursor:pointer;color:var(--muted);padding:2px;display:grid;place-items:center" title="Xóa tìm kiếm"><i class="ph ph-x" style="font-size:14px"></i></button>` : ''}
        </div>
      </div>
    </div>

    <!-- Bảng Hồ Sơ Shop -->
    <div class="table-wrap" style="background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow-x:auto;box-shadow:0 4px 20px rgba(0,0,0,0.04)">
      <table style="width:100%;border-collapse:separate;border-spacing:0;font-size:12px">
        <thead>
          <tr style="background:var(--surface-2);border-bottom:1px solid var(--line)">
            <th style="padding:10px 10px;font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;color:var(--muted);text-align:left;white-space:nowrap"><div style="display:inline-flex;align-items:center;gap:5px"><span style="width:18px;height:18px;border-radius:5px;background:rgba(217,119,6,0.1);display:grid;place-items:center;color:var(--brand)"><i class="ph ph-storefront" style="font-size:11px"></i></span> Gian Hàng</div></th>
            <th style="padding:10px 10px;font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;color:var(--muted);text-align:left;white-space:nowrap"><div style="display:inline-flex;align-items:center;gap:5px"><span style="width:18px;height:18px;border-radius:5px;background:rgba(217,119,6,0.1);display:grid;place-items:center;color:var(--brand)"><i class="ph ph-user-circle" style="font-size:11px"></i></span> Đại Diện Pháp Luật</div></th>
            <th style="padding:10px 8px;font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;color:var(--muted);text-align:left;white-space:nowrap"><div style="display:inline-flex;align-items:center;gap:5px"><span style="width:18px;height:18px;border-radius:5px;background:rgba(217,119,6,0.1);display:grid;place-items:center;color:var(--brand)"><i class="ph ph-identification-card" style="font-size:11px"></i></span> Mã Số Thuế</div></th>
            <th style="padding:10px 8px;font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;color:var(--muted);text-align:left;white-space:nowrap"><div style="display:inline-flex;align-items:center;gap:5px"><span style="width:18px;height:18px;border-radius:5px;background:rgba(217,119,6,0.1);display:grid;place-items:center;color:var(--brand)"><i class="ph ph-files" style="font-size:11px"></i></span> Tài Liệu</div></th>
            <th style="padding:10px 8px;font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;color:var(--muted);text-align:left;white-space:nowrap"><div style="display:inline-flex;align-items:center;gap:5px"><span style="width:18px;height:18px;border-radius:5px;background:rgba(217,119,6,0.1);display:grid;place-items:center;color:var(--brand)"><i class="ph ph-calendar-blank" style="font-size:11px"></i></span> Ngày Nộp</div></th>
            <th style="padding:10px 8px;font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;color:var(--muted);text-align:left;white-space:nowrap"><div style="display:inline-flex;align-items:center;gap:5px"><span style="width:18px;height:18px;border-radius:5px;background:rgba(217,119,6,0.1);display:grid;place-items:center;color:var(--brand)"><i class="ph ph-flag-banner" style="font-size:11px"></i></span> Trạng Thái</div></th>
            <th style="padding:10px 10px;font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;color:var(--muted);text-align:right;white-space:nowrap"><div style="display:inline-flex;align-items:center;gap:5px;justify-content:flex-end"><span style="width:18px;height:18px;border-radius:5px;background:rgba(217,119,6,0.1);display:grid;place-items:center;color:var(--brand)"><i class="ph ph-lightning" style="font-size:11px"></i></span> Thao Tác</div></th>
          </tr>
        </thead>
        <tbody>
          ${filtered.length > 0 ? filtered.map(st => `
            <tr style="border-bottom:1px solid var(--line);transition:background .15s ease">
              <!-- Cột 1: Mã / Tên Gian Hàng -->
              <td style="padding:10px 10px">
                <div style="display:flex;align-items:center;gap:9px">
                  <div style="width:36px;height:36px;border-radius:11px;background:${getStoreAvatarGradient(st.id)};color:#fff;display:grid;place-items:center;font-weight:800;font-size:14px;box-shadow:0 3px 8px ${getStoreShadow(st.id)};position:relative;border:1.5px solid rgba(255,255,255,0.85);flex-shrink:0">
                    ${st.name.charAt(0).toUpperCase()}
                    ${st.status === 'approved' ? `
                      <div style="position:absolute;bottom:-2px;right:-2px;width:13px;height:13px;border-radius:50%;background:#059669;color:#fff;border:1.5px solid #fff;display:grid;place-items:center;font-size:7.5px;box-shadow:0 1px 3px rgba(0,0,0,0.2)" title="Gian hàng đã xác thực">
                        <i class="ph ph-check" style="font-weight:700"></i>
                      </div>
                    ` : ''}
                  </div>
                  <div style="min-width:0">
                    <div style="font-weight:800;font-size:13px;color:var(--text);letter-spacing:-0.01em;display:flex;align-items:center;gap:5px;line-height:1.2;white-space:nowrap">
                      <span>${st.name}</span>
                      ${st.status === 'approved' ? `
                        <span style="font-size:9.5px;font-weight:700;color:#059669;background:rgba(5,150,105,0.1);padding:1px 5px;border-radius:4px;display:inline-flex;align-items:center;gap:2px">
                          <i class="ph-fill ph-seal-check"></i> Verified
                        </span>
                      ` : ''}
                    </div>
                    <div style="font-size:10.5px;color:var(--muted);display:flex;align-items:center;gap:4px;margin-top:2px;white-space:nowrap">
                      <span class="mono" style="font-weight:700;color:#b45309;background:#fef3c7;border:1px solid #fde68a;padding:0.5px 5px;border-radius:4px;font-size:10px;display:inline-flex;align-items:center;gap:2px;white-space:nowrap;flex-shrink:0">#${st.id}</span>
                      <span style="color:var(--line)">•</span>
                      <span style="color:var(--muted);font-weight:500;max-width:105px;overflow:hidden;text-overflow:ellipsis" title="${st.category}">${st.category}</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Cột 2: Người Đại Diện Pháp Luật -->
              <td style="padding:10px 10px">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%);color:#334155;border:1px solid #cbd5e1;display:grid;place-items:center;font-size:11.5px;font-weight:800;flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
                    ${st.owner.charAt(0).toUpperCase()}
                  </div>
                  <div style="min-width:0">
                    <strong style="font-size:12.5px;color:var(--text);font-weight:700;display:block;line-height:1.2;white-space:nowrap">${st.owner}</strong>
                    <div style="font-size:10.5px;display:flex;align-items:center;gap:4px;margin-top:2px;white-space:nowrap">
                      <span style="display:inline-flex;align-items:center;gap:3px;padding:1.5px 5px;border-radius:4px;background:rgba(37,99,235,0.06);border:1px solid rgba(37,99,235,0.15);color:#1d4ed8;font-size:10px;font-family:var(--font-mono);font-weight:600;white-space:nowrap">
                        <i class="ph-fill ph-phone" style="font-size:9px;color:#2563eb"></i>
                        <span>${st.phone}</span>
                      </span>
                      <span style="color:var(--line)">•</span>
                      <span style="display:inline-flex;align-items:center;gap:3px;padding:1.5px 5px;border-radius:4px;background:rgba(100,116,139,0.06);border:1px solid rgba(100,116,139,0.15);color:#475569;font-size:10px;font-weight:600;white-space:nowrap;max-width:85px;overflow:hidden;text-overflow:ellipsis" title="${st.email}">
                        <i class="ph-fill ph-envelope" style="font-size:9px;color:#64748b"></i>
                        <span>${st.email.split('@')[0]}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Cột 3: Mã Số Thuế -->
              <td style="padding:10px 8px;white-space:nowrap">
                <div style="display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#ffffff 0%,#f8fafc 100%);border:1px solid var(--line);padding:3px 7px;border-radius:7px;box-shadow:0 1px 2px rgba(0,0,0,0.03)">
                  <div style="width:16px;height:16px;border-radius:4px;background:rgba(217,119,6,0.1);display:grid;place-items:center;color:#d97706">
                    <i class="ph ph-barcode" style="font-size:10.5px"></i>
                  </div>
                  <span class="mono" style="font-weight:800;font-size:11px;color:var(--text);letter-spacing:0.02em">${st.taxCode}</span>
                </div>
              </td>

              <!-- Cột 4: Tài Liệu Đính Kèm -->
              <td style="padding:10px 8px;white-space:nowrap">
                <div style="display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,#fff1f2 0%,#ffe4e6 100%);border:1px solid #fecdd3;padding:3px 7px;border-radius:7px;cursor:pointer;transition:all .18s ease;box-shadow:0 1px 2px rgba(225,29,72,0.05)" data-mgr-view-store="${st.id}" title="Xem hồ sơ GPKD">
                  <div style="width:16px;height:16px;border-radius:4px;background:#ef4444;color:#fff;display:grid;place-items:center;box-shadow:0 1px 3px rgba(239,68,68,0.3)">
                    <i class="ph-fill ph-file-pdf" style="font-size:9.5px"></i>
                  </div>
                  <span style="font-weight:700;font-size:10.5px;color:#9f1239">${st.documents.length} PDF</span>
                  <i class="ph ph-arrow-up-right" style="color:#e11d48;font-size:9px"></i>
                </div>
              </td>

              <!-- Cột 5: Ngày Nộp -->
              <td style="padding:10px 8px;white-space:nowrap">
                <div style="display:inline-flex;align-items:center;gap:4px;color:var(--text);font-size:10px;background:var(--surface-2);border:1px solid var(--line);padding:2.5px 6px;border-radius:6px">
                  <i class="ph ph-calendar-blank" style="color:var(--muted);font-size:10px"></i>
                  <span class="mono" style="font-weight:600;font-size:9.5px">${st.submittedAt}</span>
                </div>
              </td>

              <!-- Cột 6: Trạng Thái -->
              <td style="padding:10px 8px;white-space:nowrap">
                ${renderStoreStatusBadge(st.status)}
              </td>

              <!-- Cột 7: Thao Tác Thẩm Định -->
              <td style="padding:10px 10px;text-align:right;white-space:nowrap">
                <div style="display:inline-flex;align-items:center;justify-content:flex-end;gap:4px;flex-wrap:nowrap">
                  <!-- Nút Chi tiết -->
                  <button class="btn small secondary" data-mgr-view-store="${st.id}" style="display:inline-flex;align-items:center;gap:3px;padding:4px 8px;border-radius:7px;font-weight:700;font-size:10.5px;border:1px solid var(--line);background:var(--surface);cursor:pointer;transition:all .15s ease" title="Xem hồ sơ chi tiết">
                    <i class="ph ph-eye" style="font-size:11.5px;color:var(--brand)"></i>
                    <span>Chi tiết</span>
                  </button>

                  ${st.status !== 'approved' ? `
                    <!-- Nút Duyệt -->
                    <button data-mgr-approve-store="${st.id}" style="display:inline-flex;align-items:center;gap:3px;padding:4px 9px;border-radius:7px;border:none;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;font-size:10.5px;font-weight:700;box-shadow:0 2px 5px rgba(5,150,105,0.25);cursor:pointer;transition:all .15s ease" title="Duyệt gian hàng này">
                      <i class="ph ph-check" style="font-size:11px;font-weight:700"></i>
                      <span>Duyệt</span>
                    </button>

                    <!-- Khung Icon Yêu cầu bổ sung -->
                    <button class="icon-btn-luxury" data-mgr-need-info="${st.id}" title="Yêu cầu bổ sung hồ sơ" style="width:26px;height:26px;border-radius:7px;border:1px solid #fde68a;background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);color:#d97706;display:inline-flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;box-shadow:0 1px 2px rgba(217,119,6,0.1);transition:all .15s ease">
                      <i class="ph ph-pencil-simple-line"></i>
                    </button>

                    <!-- Khung Icon Từ chối -->
                    <button class="icon-btn-luxury" data-mgr-reject-store="${st.id}" title="Từ chối hồ sơ Shop" style="width:26px;height:26px;border-radius:7px;border:1px solid #fecdd3;background:linear-gradient(135deg,#fff1f2 0%,#ffe4e6 100%);color:#e11d48;display:inline-flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;box-shadow:0 1px 2px rgba(225,29,72,0.1);transition:all .15s ease">
                      <i class="ph ph-x"></i>
                    </button>
                  ` : `
                    <!-- Khung Đang hoạt động -->
                    <div style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:7px;background:linear-gradient(135deg,rgba(16,185,129,0.08) 0%,rgba(5,150,105,0.12) 100%);border:1px solid rgba(16,185,129,0.25);color:#047857;font-size:10.5px;font-weight:700;white-space:nowrap;box-shadow:0 1px 2px rgba(16,185,129,0.06)">
                      <span style="width:5px;height:5px;border-radius:50%;background:#10b981;box-shadow:0 0 0 2px rgba(16,185,129,0.25)"></span>
                      <i class="ph-fill ph-shield-check" style="font-size:12px;color:#059669"></i>
                      <span>Đang hoạt động</span>
                    </div>
                  `}
                </div>
              </td>
            </tr>
          `).join("") : `
            <tr>
              <td colspan="7" style="text-align:center;padding:48px 24px;color:var(--muted)">
                <div style="width:56px;height:56px;border-radius:16px;background:var(--surface-2);color:var(--muted);display:grid;place-items:center;margin:0 auto 12px;font-size:26px">
                  <i class="ph ph-storefront"></i>
                </div>
                <strong style="font-size:15px;color:var(--text);display:block;margin-bottom:4px">Không tìm thấy hồ sơ Shop phù hợp</strong>
                <p style="margin:0;font-size:13px">Thử chọn bộ lọc trạng thái khác hoặc nhập từ khóa tìm kiếm mới.</p>
              </td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 3. CHI TIẾT HỒ SƠ SHOP (STORE DETAIL)
// --------------------------------------------------------------------------
export function managerStoreDetailScreen() {
  const storeId = managerState.selectedStoreDetailId || "STORE-001";
  const st = managerState.stores.find(s => s.id === storeId) || managerState.stores[0];

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Vận hành / </span><a href="#manager-stores" style="color:var(--brand);text-decoration:none">Hồ sơ Shop</a> / <strong>${st.name}</strong></div>
        <h1>Chi Tiết Thẩm Định: ${st.name}</h1>
        <p>Kiểm tra thông tin pháp lý doanh nghiệp, người đại diện, danh mục sản phẩm và lịch sử thẩm định.</p>
      </div>
      <div class="actions">
        <button class="btn secondary" data-mgr-goto="manager-stores">&larr; Quay lại danh sách</button>
        ${st.status !== 'approved' ? `
          <button class="btn" data-mgr-approve-store="${st.id}" style="background:#059669;color:#fff"><i class="ph ph-check"></i> Phê duyệt & Kích hoạt</button>
          <button class="btn secondary" data-mgr-need-info="${st.id}"><i class="ph ph-file-arrow-up"></i> Yêu cầu bổ sung</button>
          <button class="btn danger" data-mgr-reject-store="${st.id}"><i class="ph ph-x"></i> Từ chối</button>
        ` : ''}
      </div>
    </header>

    <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px">
      <!-- Cột Trái: Thông tin pháp lý & Giấy phép -->
      <div class="card" style="padding:22px">
        <h3 style="margin-top:0;font-size:16px;border-bottom:1px solid var(--line);padding-bottom:10px">
          ${icon("ph-certificate")} Thông tin pháp lý doanh nghiệp
        </h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0">
          <div><small style="color:var(--muted)">Tên gian hàng</small><strong style="display:block;margin-top:2px">${st.name}</strong></div>
          <div><small style="color:var(--muted)">Mã số thuế (MST)</small><strong class="mono" style="display:block;margin-top:2px">${st.taxCode}</strong></div>
          <div><small style="color:var(--muted)">Người đại diện pháp luật</small><strong style="display:block;margin-top:2px">${st.owner}</strong></div>
          <div><small style="color:var(--muted)">Lĩnh vực kinh doanh</small><strong style="display:block;margin-top:2px">${st.category}</strong></div>
          <div><small style="color:var(--muted)">Email đối tác</small><strong style="display:block;margin-top:2px">${st.email}</strong></div>
          <div><small style="color:var(--muted)">Số điện thoại liên hệ</small><strong style="display:block;margin-top:2px">${st.phone}</strong></div>
        </div>

        <h3 style="margin:24px 0 12px;font-size:15px;border-bottom:1px solid var(--line);padding-bottom:8px">
          ${icon("ph-files")} Hồ sơ & Tài liệu đính kèm (${st.documents.length})
        </h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${st.documents.map(doc => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2)">
              <div style="display:flex;align-items:center;gap:10px">
                <i class="ph ph-file-pdf" style="font-size:22px;color:#dc2626"></i>
                <span style="font-weight:600;font-size:13px">${doc}</span>
              </div>
              <button class="text-btn" data-mgr-toast="Đang mở bản xem trước tài liệu ${doc}"><i class="ph ph-eye"></i> Xem tài liệu</button>
            </div>
          `).join("")}
        </div>

        <h3 style="margin:24px 0 12px;font-size:15px;border-bottom:1px solid var(--line);padding-bottom:8px">
          ${icon("ph-note")} Ghi chú thẩm định của chuyên viên
        </h3>
        <div style="padding:14px;background:var(--surface-2);border-radius:8px;font-size:13px;line-height:1.5">
          ${st.notes || "Chưa có ghi chú thẩm định nào."}
          ${st.rejectionReason ? `<div style="margin-top:8px;color:#dc2626;font-weight:600">Lý do từ chối: ${st.rejectionReason}</div>` : ''}
        </div>
      </div>

      <!-- Cột Phải: Trạng thái & Quy trình thẩm định -->
      <div class="card" style="padding:22px">
        <h3 style="margin-top:0;font-size:16px;border-bottom:1px solid var(--line);padding-bottom:10px">
          ${icon("ph-git-commit")} Tiến trình xét duyệt
        </h3>
        
        <div class="stepper" style="display:flex;flex-direction:column;gap:18px;margin:20px 0">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="background:#059669;color:#fff;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:12px"><i class="ph ph-check"></i></span>
            <div>
              <strong style="font-size:13px">1. Nộp hồ sơ ban đầu</strong>
              <div style="font-size:11.5px;color:var(--muted)">Đã tiếp nhận vào lúc ${st.submittedAt}</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="background:${st.status !== 'pending' ? '#059669' : 'var(--brand)'};color:#fff;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:12px">
              ${st.status !== 'pending' ? '<i class="ph ph-check"></i>' : '2'}
            </span>
            <div>
              <strong style="font-size:13px">2. Thẩm định pháp lý & GPKD</strong>
              <div style="font-size:11.5px;color:var(--muted)">Kiểm tra thông tin trên Cổng thông tin ĐKKD Quốc gia</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="background:${st.status === 'approved' ? '#059669' : (st.status === 'rejected' ? '#dc2626' : 'var(--muted)')};color:#fff;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:12px">
              ${st.status === 'approved' ? '<i class="ph ph-check"></i>' : (st.status === 'rejected' ? '<i class="ph ph-x"></i>' : '3')}
            </span>
            <div>
              <strong style="font-size:13px">3. Kết luận & Phê duyệt</strong>
              <div style="font-size:11.5px;color:var(--muted)">Trạng thái hiện tại: ${renderStoreStatusBadge(st.status)}</div>
            </div>
          </div>
        </div>

        <div style="background:var(--surface-3);padding:14px;border-radius:10px;margin-top:20px">
          <small style="color:var(--muted);font-size:12px;display:block;margin-bottom:6px">Nguyên tắc phân quyền:</small>
          <ul style="margin:0;padding-left:18px;font-size:12px;color:var(--muted);line-height:1.6">
            <li>Chuyên viên Vận Hành Sàn chỉ duyệt hồ sơ gian hàng hợp lệ theo danh mục GPKD.</li>
            <li>Không tự ý can thiệp chính sách hoa hồng riêng của Shop.</li>
            <li>Không duyệt rút tiền chi trả thay Shop.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 4. DANH MỤC NGÂN HÀNG HỖ TRỢ (MANAGER BANKS)
// --------------------------------------------------------------------------
export function managerBanksScreen() {
  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Vận hành / </span><strong>Cổng & Ngân hàng Hỗ trợ</strong></div>
        <h1>Danh Mục Ngân Hàng Chi Trả VietQR / Napas</h1>
        <p>Quản lý danh sách ngân hàng đối tác phục vụ thanh toán hoa hồng và liên kết tài khoản (Môi trường Sandbox Mô Phỏng).</p>
      </div>
      <div class="actions">
        <button class="btn" data-mgr-add-bank><i class="ph ph-plus"></i> Thêm ngân hàng hỗ trợ</button>
      </div>
    </header>

    <div class="toolbar" style="margin-bottom:18px">
      <span class="badge warning" style="font-size:12.5px;padding:8px 14px">
        ${icon("ph-warning")} <strong>Lưu ý vận hành:</strong> Khi tạm ngừng hỗ trợ một ngân hàng, các lệnh rút tiền đang chờ của CTV qua ngân hàng đó sẽ chuyển sang trạng thái chờ đổi tài khoản.
      </span>
    </div>

    <div class="grid" style="grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:16px">
      ${managerState.banks.map(bank => `
        <div class="card" style="padding:18px;position:relative;border:${bank.active ? '1px solid var(--line)' : '1px dashed #ef4444'}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:44px;height:44px;background:var(--brand-soft);color:var(--brand-strong);border-radius:10px;display:grid;place-items:center;font-size:22px">
                ${icon(bank.logo)}
              </div>
              <div>
                <strong style="font-size:15px;display:block">${bank.name}</strong>
                <small class="mono" style="color:var(--muted)">Mã BIN: ${bank.code} • ${bank.shortName}</small>
              </div>
            </div>
            <span class="badge ${bank.active ? 'success' : 'danger'}" style="font-size:11px">
              ${bank.active ? 'Hoạt động' : 'Tạm dừng'}
            </span>
          </div>

          <div style="font-size:12.5px;color:var(--muted);margin:12px 0;line-height:1.5">
            <div>${icon("ph-lightning")} Tốc độ: <strong>${bank.transferTime}</strong></div>
            <div>${icon("ph-receipt")} Sản lượng đối soát: <strong>${bank.totalPayouts}</strong></div>
            <div>${icon("ph-shield-check")} Cơ chế: <span class="badge neutral" style="font-size:11px">${bank.sandboxLabel}</span></div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--line)">
            <button class="btn small secondary" data-mgr-edit-bank="${bank.id}"><i class="ph ph-gear"></i> Cấu hình</button>
            <button class="btn small ${bank.active ? 'danger' : ''}" data-mgr-toggle-bank="${bank.id}" style="${!bank.active ? 'background:#059669;color:#fff' : ''}">
              ${bank.active ? '<i class="ph ph-pause"></i> Tạm dừng cổng' : '<i class="ph ph-play"></i> Bật kích hoạt'}
            </button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// --------------------------------------------------------------------------
// 5. XỬ LÝ CẢNH BÁO GIAN LẬN (MANAGER FRAUD)
// --------------------------------------------------------------------------
export function managerFraudScreen() {
  const filter = managerState.activeFraudFilter;
  const filtered = managerState.fraudAlerts.filter(f => {
    if (filter === "all") return true;
    if (filter === "pending") return f.status === "pending" || f.status === "processing";
    return f.riskLevel === filter;
  });

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Vận hành / </span><strong>Kiểm Soát Gian Lận</strong></div>
        <h1>Xử Lý Cảnh Báo Gian Lận (AI Fraud Sentinel)</h1>
        <p>Phân tích bằng chứng vi phạm, ghi nhận kết luận thẩm định hợp lệ/báo động giả hoặc chuyển cấp Admin xử lý khóa tài khoản.</p>
      </div>
      <div class="actions">
        <span class="badge neutral" style="font-size:12px"><i class="ph ph-info"></i> AI chỉ cảnh báo xác suất, quyền kết luận thuộc về nhân sự vận hành.</span>
      </div>
    </header>

    <div class="toolbar" style="margin-bottom:18px;display:flex;justify-content:space-between;align-items:center">
      <div class="segmented" style="margin:0">
        <button class="${filter === 'all' ? 'active' : ''}" data-mgr-fraud-filter="all">Tất cả (${managerState.fraudAlerts.length})</button>
        <button class="${filter === 'pending' ? 'active' : ''}" data-mgr-fraud-filter="pending">Chờ & Đang xử lý (${managerState.fraudAlerts.filter(f => f.status === 'pending' || f.status === 'processing').length})</button>
        <button class="${filter === 'high' ? 'active' : ''}" data-mgr-fraud-filter="high">Rủi ro cao (${managerState.fraudAlerts.filter(f => f.riskLevel === 'high').length})</button>
        <button class="${filter === 'medium' ? 'active' : ''}" data-mgr-fraud-filter="medium">Rủi ro vừa (${managerState.fraudAlerts.filter(f => f.riskLevel === 'medium').length})</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Mã / Thời Gian</th>
            <th>Đối Tượng Bị Cảnh Báo</th>
            <th>Mức Độ Rủi Ro</th>
            <th>Bằng Chứng / Dấu Hiệu Vi Phạm</th>
            <th>Địa Chỉ IP / Thiết Bị</th>
            <th>Trạng Thái Xử Lý</th>
            <th style="text-align:right">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(fa => `
            <tr>
              <td>
                <strong class="mono">${fa.id}</strong>
                <div style="font-size:11px;color:var(--muted)">${fa.detectedAt}</div>
              </td>
              <td>
                <strong style="color:var(--text)">${fa.kolName}</strong>
                <div style="font-size:11.5px;color:var(--muted)">${fa.kolId} &rarr; Shop: ${fa.targetStore}</div>
              </td>
              <td>
                <span class="badge ${fa.riskLevel === 'high' ? 'danger' : (fa.riskLevel === 'medium' ? 'warning' : 'neutral')}" style="font-weight:700">
                  ${fa.riskLevel.toUpperCase()} (${fa.score}đ)
                </span>
              </td>
              <td style="max-width:320px;font-size:12.5px;line-height:1.4">
                ${fa.reason}
                ${fa.resolutionNote ? `<div style="font-size:11px;color:#059669;margin-top:4px"><strong>Kết luận:</strong> ${fa.resolutionNote}</div>` : ''}
              </td>
              <td class="mono" style="font-size:12px">${fa.ipAddress}</td>
              <td>
                ${fa.status === 'pending' ? '<span class="badge warning">Chờ tiếp nhận</span>' :
                  (fa.status === 'processing' ? '<span class="badge info">Đang xử lý</span>' :
                  (fa.status === 'false_positive' ? '<span class="badge success">Báo động giả</span>' : '<span class="badge danger">Đã xử lý gian lận</span>'))}
              </td>
              <td style="text-align:right">
                <button class="btn small" data-mgr-handle-fraud="${fa.id}">
                  ${fa.status === 'pending' ? 'Tiếp nhận' : 'Xem kết luận'}
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 6. NHẬT KÝ VẬN HÀNH (MANAGER AUDIT - READ ONLY)
// --------------------------------------------------------------------------
export function managerAuditScreen() {
  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Vận hành / </span><strong>Nhật ký Vận hành</strong></div>
        <h1>Nhật Ký Thao Tác Vận Hành (Operational Audit Log)</h1>
        <p>Lưu vết bất biến mọi hành động xét duyệt hồ sơ Shop, cấu hình ngân hàng và kết luận xử lý gian lận (Chỉ đọc - Không sửa/xóa).</p>
      </div>
      <div class="actions">
        <button class="btn secondary" data-mgr-toast="Đã xuất log vận hành ra file CSV"><i class="ph ph-download-simple"></i> Xuất CSV Log</button>
      </div>
    </header>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Mã Log</th>
            <th>Thời Gian (UTC+7)</th>
            <th>Chuyên Viên Vận Hành</th>
            <th>Hành Động Thực Hiện</th>
            <th>Đối Tượng Tác Động</th>
            <th>Ghi Chú Chi Tiết</th>
          </tr>
        </thead>
        <tbody>
          ${managerState.opsLogs.map(log => `
            <tr>
              <td class="mono" style="font-weight:600">${log.id}</td>
              <td class="mono" style="font-size:12px;color:var(--muted)">${log.time}</td>
              <td><strong>${log.actor}</strong></td>
              <td><span class="badge neutral" style="font-weight:600">${log.action}</span></td>
              <td class="mono">${log.target}</td>
              <td style="font-size:12.5px">${log.note}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 7. TÀI KHOẢN VẬN HÀNH (MANAGER PROFILE)
// ==========================================================================
// 7. TÀI KHOẢN VẬN HÀNH (MANAGER PROFILE & OPS DUTIES)
// ==========================================================================
export const managerProfileState = {
  activeTab: 'info', // 'info' | 'duties' | 'security'
  profile: {
    avatar: 'VH',
    name: 'Lê Hồng Phúc',
    id: 'SM-0042',
    department: 'Khối Vận Hành Sàn Thương Mại Điện Tử SCANMS',
    title: 'Trưởng nhóm Thẩm định Gian hàng & Đối soát',
    email: 'manager@scanms.vn',
    phone: '0988 123 456',
    internalExt: '104 (Phòng Điều Phối Vận Hành)',
    assignedCategories: ['Mỹ phẩm & Chăm sóc da', 'Thiết bị số & Công nghệ', 'Thời trang & Phụ kiện'],
    approvalLimits: 'Duyệt chi trả hoa hồng tới 50.000.000 ₫/lệnh • Thẩm định hồ sơ Shop Mall • Xử lý kháng cáo Fraud'
  }
};

// Khôi phục từ localStorage nếu có
try {
  const saved = localStorage.getItem('scanms_profile_manager');
  if (saved) {
    const parsed = JSON.parse(saved);
    managerProfileState.profile = { ...managerProfileState.profile, ...parsed };
  }
} catch (e) {}

export function managerProfileScreen() {
  // Luôn đồng bộ dữ liệu mới nhất từ localStorage để cập nhật avatar kể cả sau khi đổi role hay F5
  try {
    const saved = localStorage.getItem('scanms_profile_manager');
    if (saved) {
      const parsed = JSON.parse(saved);
      managerProfileState.profile = { ...managerProfileState.profile, ...parsed };
    }
  } catch (e) {}

  const p = managerProfileState.profile;
  const tab = managerProfileState.activeTab;

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Vận hành / </span><strong>Hồ sơ Vận hành</strong></div>
        <h1>Tài Khoản & Nhiệm Vụ Chuyên Viên Vận Hành Sàn</h1>
        <p>Quản lý thông tin tài khoản công vụ, phân công cụm ngành hàng phụ trách và bảo mật phiên trực.</p>
      </div>
      <div class="actions">
        <span class="badge" style="background:#e0e7ff;color:#4338ca;font-weight:750"><i class="ph ph-shield-check"></i> OPS LEVEL 2</span>
        <span class="badge success"><i class="ph ph-circle"></i> ĐANG TRONG CA TRỰC</span>
      </div>
    </header>

    <div class="profile-view-wrap">
      <!-- Tab Navigation -->
      <div class="profile-tab-nav" role="tablist">
        <button class="profile-tab-btn ${tab === 'info' ? 'active' : ''}" data-mgr-tab="info">
          <i class="ph ph-user"></i> Thông tin Cán bộ Vận hành
        </button>
        <button class="profile-tab-btn ${tab === 'duties' ? 'active' : ''}" data-mgr-tab="duties">
          <i class="ph ph-briefcase"></i> Phân công & Phạm vi Phụ trách
        </button>
        <button class="profile-tab-btn ${tab === 'security' ? 'active' : ''}" data-mgr-tab="security">
          <i class="ph ph-lock-key"></i> Đổi mật khẩu & Quản lý phiên
        </button>
      </div>

      <!-- Tab 1: Thông tin Cán bộ -->
      ${tab === 'info' ? `
        <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-identification-badge" style="color:var(--brand)"></i> Thông tin nhân sự Vận Hành Nền Tảng
            </h3>

            <div class="profile-avatar-uploader">
              <div class="profile-avatar-uploader-circle" id="mgr-avatar-circle-trigger" onclick="document.getElementById('mgr-avatar-file')?.click()" style="background:#e0e7ff;color:#4338ca;cursor:pointer" title="Click để chọn ảnh từ máy">
                ${p.avatarImg ? `<img src="${p.avatarImg}" alt="${p.name}" />` : p.avatar}
                <div class="profile-avatar-uploader-overlay">
                  <i class="ph ph-camera"></i>
                  <span>Đổi ảnh</span>
                </div>
              </div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                  <strong style="font-size:16px;color:var(--text)">${p.name}</strong>
                  <span class="badge" style="background:#e0e7ff;color:#4338ca;font-size:11.5px;font-weight:700">${p.department}</span>
                </div>
                <span style="font-size:12.5px;color:var(--muted);display:block;margin:3px 0 8px">${p.title} • <strong>Mã NV: ${p.id}</strong></span>
                <div class="profile-avatar-actions">
                  <input type="file" id="mgr-avatar-file" accept="image/*" style="display:none" />
                  <label for="mgr-avatar-file" class="btn small outline" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin:0">
                    <i class="ph ph-upload-simple"></i> Tải ảnh từ máy
                  </label>
                  ${p.avatarImg ? `
                    <button type="button" class="btn small text-danger" id="mgr-avatar-remove-btn" style="border:1px solid #fecaca;background:#fef2f2;color:#dc2626;display:inline-flex;align-items:center;gap:6px;cursor:pointer" title="Gỡ ảnh đại diện">
                      <i class="ph ph-trash"></i> Gỡ ảnh
                    </button>
                  ` : ''}
                  <span style="font-size:11.5px;color:var(--muted)">Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 5MB)</span>
                </div>
              </div>
            </div>

            <form id="mgr-info-form" class="form-stack">
              <div class="field">
                <label>Họ và tên cán bộ *</label>
                <input class="input" id="mgr-name" value="${p.name}" required />
              </div>

              <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
                <div class="field">
                  <label>Email công vụ (Đăng nhập)</label>
                  <input class="input" id="mgr-email" value="${p.email}" disabled />
                </div>
                <div class="field">
                  <label>Số điện thoại xác thực *</label>
                  <input class="input" id="mgr-phone" value="${p.phone}" required />
                </div>
              </div>

              <div class="field">
                <label>Số máy nhánh nội bộ (Ext)</label>
                <input class="input" id="mgr-ext" value="${p.internalExt}" />
              </div>

              <div class="field">
                <label>Chức danh nghiệp vụ</label>
                <input class="input" id="mgr-title" value="${p.title}" required />
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:14px">
                <button type="submit" class="btn" style="padding:10px 24px;font-weight:750">
                  <i class="ph ph-floppy-disk"></i> Lưu thông tin cán bộ
                </button>
              </div>
            </form>
          </div>

          <div style="display:flex;flex-direction:column;gap:18px">
            <div class="card" style="padding:22px">
              <h4 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
                <i class="ph ph-calendar-check" style="color:var(--brand)"></i> Ca trực & Trạng thái hoạt động
              </h4>
              <p style="font-size:13px;color:var(--muted);line-height:1.6;margin:0 0 10px">
                Ca hành chính: <strong>08:30 - 17:30</strong> (Thứ 2 đến Thứ 6). Hỗ trợ trực đối soát tự động cuối tuần qua kênh Slack Ops.
              </p>
              <div style="font-size:12.5px;color:var(--muted)">
                <div>• Trạng thái trực: <span class="badge success" style="font-size:10.5px">Đang trực tuyến</span></div>
                <div>• Số yêu cầu chờ xử lý: <strong>4 gian hàng</strong></div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Tab 2: Phân công & Phạm vi phụ trách -->
      ${tab === 'duties' ? `
        <div class="card" style="padding:26px">
          <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
            <i class="ph ph-briefcase" style="color:var(--brand)"></i> Phân công quản trị & Giới hạn thẩm quyền
          </h3>

          <div class="grid" style="grid-template-columns:1fr 1fr;gap:18px;margin-top:18px">
            <div style="padding:18px;background:var(--surface-2);border-radius:14px;border:1px solid var(--line)">
              <h4 style="margin:0 0 10px;font-size:14.5px;color:var(--text);display:flex;align-items:center;gap:8px">
                <i class="ph ph-folders" style="color:var(--brand)"></i> Cụm ngành hàng được phân công
              </h4>
              <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--muted);line-height:1.7">
                ${p.assignedCategories.map(cat => `<li><strong>${cat}</strong></li>`).join('')}
              </ul>
            </div>

            <div style="padding:18px;background:var(--surface-2);border-radius:14px;border:1px solid var(--line)">
              <h4 style="margin:0 0 10px;font-size:14.5px;color:var(--text);display:flex;align-items:center;gap:8px">
                <i class="ph ph-check-circle" style="color:#15803d"></i> Thẩm quyền phê duyệt
              </h4>
              <p style="font-size:13px;color:var(--muted);line-height:1.6;margin:0">
                ${p.approvalLimits}
              </p>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Tab 3: Mật khẩu & Quản lý phiên -->
      ${tab === 'security' ? `
        <div class="split" style="grid-template-columns:1fr 1fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-lock-key" style="color:var(--brand)"></i> Đổi mật khẩu tài khoản Vận hành
            </h3>
            <form id="mgr-pass-form" class="form-stack" style="margin-top:16px">
              <div class="field">
                <label>Mật khẩu hiện tại *</label>
                <input class="input" type="password" id="mgr-cur-pass" placeholder="••••••••" required />
              </div>
              <div class="field">
                <label>Mật khẩu mới * (Tối thiểu 8 ký tự, có ký tự đặc biệt)</label>
                <input class="input" type="password" id="mgr-new-pass" placeholder="Nhập mật khẩu mới" required />
              </div>
              <div class="field">
                <label>Xác nhận mật khẩu mới *</label>
                <input class="input" type="password" id="mgr-confirm-pass" placeholder="Nhập lại mật khẩu mới" required />
              </div>
              <button type="submit" class="btn" style="margin-top:8px;font-weight:750">
                <i class="ph ph-shield-check"></i> Đổi mật khẩu công vụ
              </button>
            </form>
          </div>

          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-desktop" style="color:var(--brand)"></i> Phiên làm việc hiện tại
            </h3>
            <div style="margin:16px 0;padding:14px;background:var(--surface-2);border-radius:10px;border:1px solid var(--line)">
              <small style="color:var(--muted);display:block;margin-bottom:4px">Phiên đang kết nối: <strong>Chrome trên Windows 11</strong></small>
              <div style="font-size:12px;color:var(--muted)">Địa chỉ IP công vụ: <strong>118.69.12.44</strong> (Văn phòng SCANMS Tower)</div>
            </div>
            <button id="btn-mgr-logout-others" class="btn danger small" style="width:100%;font-weight:750">
              <i class="ph ph-sign-out"></i> Đăng xuất khỏi các thiết bị khác
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}


// --------------------------------------------------------------------------
// BINDING LOGIC CHO SYSTEM MANAGER
// --------------------------------------------------------------------------
export function bindManager(root, { toast, go, renderCurrentPage }) {
  // Navigation shortcuts
  root.querySelectorAll("[data-mgr-goto]").forEach(el => {
    el.addEventListener("click", () => {
      const scr = el.dataset.mgrGoto;
      if (el.dataset.mgrFilter) {
        if (scr === "manager-stores") managerState.activeStoreFilter = el.dataset.mgrFilter;
        if (scr === "manager-fraud") managerState.activeFraudFilter = el.dataset.mgrFilter;
      }
      go(scr);
    });
  });

  // Store filters
  root.querySelectorAll("[data-mgr-store-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      managerState.activeStoreFilter = btn.dataset.mgrStoreFilter;
      renderCurrentPage();
    });
  });

  // Store search input filter
  const storeSearchInput = root.querySelector("#mgr-store-search");
  if (storeSearchInput) {
    storeSearchInput.addEventListener("input", (e) => {
      managerState.storeSearchQuery = e.target.value;
      renderCurrentPage();
      const updated = document.querySelector("#mgr-store-search");
      if (updated) {
        updated.focus();
        updated.setSelectionRange(updated.value.length, updated.value.length);
      }
    });
  }

  const storeSearchClear = root.querySelector("#mgr-store-search-clear");
  if (storeSearchClear) {
    storeSearchClear.addEventListener("click", () => {
      managerState.storeSearchQuery = "";
      renderCurrentPage();
    });
  }

  // Fraud filters
  root.querySelectorAll("[data-mgr-fraud-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      managerState.activeFraudFilter = btn.dataset.mgrFraudFilter;
      renderCurrentPage();
    });
  });

  // View store detail
  root.querySelectorAll("[data-mgr-view-store]").forEach(btn => {
    btn.addEventListener("click", () => {
      managerState.selectedStoreDetailId = btn.dataset.mgrViewStore;
      go("manager-store-detail");
    });
  });

  // Approve store
  root.querySelectorAll("[data-mgr-approve-store]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.mgrApproveStore;
      const st = managerState.stores.find(s => s.id === id);
      if (!st) return;
      if (confirm(`Xác nhận phê duyệt và kích hoạt gian hàng "${st.name}" lên hệ thống SCANMS?`)) {
        st.status = "approved";
        try {
          const raw = localStorage.getItem("scanms-pending-shop");
          if (raw) {
            const pending = JSON.parse(raw);
            if (pending.id === st.id || pending.email === st.email) {
              pending.status = "approved";
              localStorage.setItem("scanms-pending-shop", JSON.stringify(pending));
            }
          }
        } catch(e) {}
        managerState.opsLogs.unshift({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          time: "Vừa xong",
          actor: "Lê Hồng Phúc (Vận Hành Sàn)",
          action: "PHÊ DUYỆT SHOP",
          target: `${st.id} (${st.name})`,
          note: "Đã kiểm tra đầy đủ hồ sơ pháp lý và kích hoạt tài khoản đối tác."
        });
        toast(`Đã phê duyệt và kích hoạt thành công gian hàng ${st.name}!`);
        renderCurrentPage();
      }
    });
  });

  // Request additional info
  root.querySelectorAll("[data-mgr-need-info]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.mgrNeedInfo;
      const st = managerState.stores.find(s => s.id === id);
      if (!st) return;
      const reason = prompt(`Nhập nội dung/tài liệu yêu cầu Shop "${st.name}" bổ sung:`, "Vui lòng bổ sung Giấy chứng nhận công bố sản phẩm hoặc Giấy ủy quyền phân phối thương hiệu.");
      if (reason) {
        st.status = "need_info";
        st.notes = `Yêu cầu bổ sung: ${reason}`;
        managerState.opsLogs.unshift({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          time: "Vừa xong",
          actor: "Lê Hồng Phúc (Vận Hành Sàn)",
          action: "YÊU CẦU BỔ SUNG",
          target: `${st.id} (${st.name})`,
          note: reason
        });
        toast(`Đã gửi yêu cầu bổ sung hồ sơ tới Shop ${st.name}.`);
        renderCurrentPage();
      }
    });
  });

  // Reject store
  root.querySelectorAll("[data-mgr-reject-store]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.mgrRejectStore;
      const st = managerState.stores.find(s => s.id === id);
      if (!st) return;
      const reason = prompt(`Nhập lý do từ chối hồ sơ Shop "${st.name}":`, "Không đáp ứng tiêu chuẩn kinh doanh ngành hàng theo quy chế sàn.");
      if (reason) {
        st.status = "rejected";
        st.rejectionReason = reason;
        managerState.opsLogs.unshift({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          time: "Vừa xong",
          actor: "Lê Hồng Phúc (Vận Hành Sàn)",
          action: "TỪ CHỐI SHOP",
          target: `${st.id} (${st.name})`,
          note: `Lý do từ chối: ${reason}`
        });
        toast(`Đã từ chối hồ sơ Shop ${st.name}. Thông báo đã được gửi qua email.`);
        renderCurrentPage();
      }
    });
  });

  // Handle fraud
  root.querySelectorAll("[data-mgr-handle-fraud]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.mgrHandleFraud;
      const fa = managerState.fraudAlerts.find(f => f.id === id);
      if (!fa) return;
      const action = prompt(`Xử lý cảnh báo ${fa.id} (${fa.kolName}):\n1. Nhập 'OK' để kết luận Hợp Lệ (Báo động giả)\n2. Nhập 'FRAUD' để kết luận Gian Lận (Tạm giữ hoa hồng)\n3. Nhập 'ADMIN' để Chuyển cấp Quản Trị Hệ Thống khóa tài khoản`, "OK");
      if (action === "OK") {
        fa.status = "false_positive";
        fa.resolutionNote = "Đã xác minh lưu lượng truy cập thực tế, kết luận báo động giả.";
        toast(`Đã cập nhật cảnh báo ${fa.id}: Báo động giả (Hợp lệ).`);
        renderCurrentPage();
      } else if (action === "FRAUD") {
        fa.status = "resolved_fraud";
        fa.resolutionNote = "Xác nhận vi phạm gian lận click: Đã khóa tạm giữ các đơn hàng liên quan.";
        toast(`Đã xử lý gian lận cho cảnh báo ${fa.id}!`);
        renderCurrentPage();
      } else if (action === "ADMIN") {
        fa.status = "escalated";
        fa.resolutionNote = "Đã chuyển cấp Quản Trị Hệ Thống đề xuất khóa tài khoản.";
        toast(`Đã chuyển cảnh báo ${fa.id} lên Quản Trị Hệ Thống xử lý khóa.`);
        renderCurrentPage();
      }
    });
  });

  // Toggle bank
  root.querySelectorAll("[data-mgr-toggle-bank]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.mgrToggleBank;
      const b = managerState.banks.find(bk => bk.id === id);
      if (!b) return;
      b.active = !b.active;
      toast(`Đã ${b.active ? 'kích hoạt' : 'tạm dừng'} kết nối cổng ngân hàng ${b.name}!`);
      renderCurrentPage();
    });
  });

  // Add bank demo
  root.querySelector("[data-mgr-add-bank]")?.addEventListener("click", () => {
    const name = prompt("Nhập tên ngân hàng đối tác mới:", "BIDV (Ngân hàng Đầu tư và Phát triển)");
    if (name) {
      managerState.banks.push({
        id: `BANK-${Date.now().toString().slice(-3)}`,
        code: "970418",
        name: name,
        shortName: "BIDV",
        logo: "ph-bank",
        active: true,
        transferTime: "Tức thì (24/7)",
        sandboxLabel: "Sandbox Simulator",
        totalPayouts: "0 đơn"
      });
      toast(`Đã bổ sung ${name} vào danh mục ngân hàng hỗ trợ!`);
      renderCurrentPage();
    }
  });

  // Generic toasts
  root.querySelectorAll("[data-mgr-toast]").forEach(el => {
    el.addEventListener("click", () => toast(el.dataset.mgrToast));
  });

  // Manager Profile Event Bindings
  const mgrAvatarCircle = root.querySelector('#mgr-avatar-circle-trigger');
  const mgrAvatarInput = root.querySelector('#mgr-avatar-file');
  const mgrAvatarRemoveBtn = root.querySelector('#mgr-avatar-remove-btn');

  if (mgrAvatarCircle && mgrAvatarInput) {
    mgrAvatarCircle.addEventListener('click', () => {
      mgrAvatarInput.click();
    });
  }

  if (mgrAvatarInput) {
    mgrAvatarInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast?.('Vui lòng chọn tệp định dạng hình ảnh hợp lệ!', 'error');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast?.('Kích thước ảnh tối đa là 10MB!', 'error');
        return;
      }

      try {
        const compressedBase64 = await compressAvatarImage(file, 256, 0.82);
        managerProfileState.profile.avatarImg = compressedBase64;
        safeSaveProfile('scanms_profile_manager', managerProfileState.profile);
        toast?.('Đã đổi ảnh đại diện cán bộ vận hành thành công!', 'success');
        renderCurrentPage();
      } catch (err) {
        console.error('Lỗi khi nén ảnh đại diện manager:', err);
        toast?.('Không thể xử lý ảnh này. Vui lòng chọn ảnh khác!', 'error');
      }
    });
  }

  if (mgrAvatarRemoveBtn) {
    mgrAvatarRemoveBtn.addEventListener('click', () => {
      managerProfileState.profile.avatarImg = null;
      safeSaveProfile('scanms_profile_manager', managerProfileState.profile);
      toast?.('Đã gỡ ảnh đại diện, chuyển về chữ cái mặc định!', 'info');
      renderCurrentPage();
    });
  }

  root.querySelectorAll('[data-mgr-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      managerProfileState.activeTab = btn.dataset.mgrTab;
      renderCurrentPage();
    });
  });

  const mgrInfoForm = root.querySelector('#mgr-info-form');
  if (mgrInfoForm) {
    mgrInfoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = root.querySelector('#mgr-name')?.value || managerProfileState.profile.name;
      const phone = root.querySelector('#mgr-phone')?.value || managerProfileState.profile.phone;
      const ext = root.querySelector('#mgr-ext')?.value || managerProfileState.profile.internalExt;
      const title = root.querySelector('#mgr-title')?.value || managerProfileState.profile.title;

      managerProfileState.profile = {
        ...managerProfileState.profile,
        name,
        phone,
        internalExt: ext,
        title,
      };
      safeSaveProfile('scanms_profile_manager', managerProfileState.profile);
      toast?.('Đã cập nhật thông tin cán bộ Vận Hành Sàn thành công!', 'success');
      renderCurrentPage();
    });
  }

  const mgrPassForm = root.querySelector('#mgr-pass-form');
  if (mgrPassForm) {
    mgrPassForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newP = root.querySelector('#mgr-new-pass')?.value;
      const confP = root.querySelector('#mgr-confirm-pass')?.value;
      if (!newP || newP.length < 8) {
        toast?.('Mật khẩu mới phải có tối thiểu 8 ký tự!', 'error');
        return;
      }
      if (newP !== confP) {
        toast?.('Mật khẩu xác nhận không khớp!', 'error');
        return;
      }
      toast?.('Đã đổi mật khẩu tài khoản vận hành thành công!', 'success');
      mgrPassForm.reset();
    });
  }

  const btnMgrLogoutOthers = root.querySelector('#btn-mgr-logout-others');
  if (btnMgrLogoutOthers) {
    btnMgrLogoutOthers.addEventListener('click', () => {
      toast?.('Đã đăng xuất khỏi các thiết bị khác thành công!', 'success');
    });
  }
}
