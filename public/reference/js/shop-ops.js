// ==========================================================================
// SCANMS SHOP MANAGER OPERATIONS MODULE (Nghiệp Vụ Chủ Shop Mở Rộng)
// ==========================================================================

import { compressAvatarImage, safeSaveProfile } from './image-utils.js';

const icon = (name) => `<i class="ph ${name}" aria-hidden="true"></i>`;
const money = (v) => `${new Intl.NumberFormat("vi-VN").format(v)} ₫`;

export const shopOpsState = {
  sampleRequests: [
    {
      id: "SMP-101",
      kolName: "Trần Văn Nhật (nhatbeauty)",
      kolId: "KOL-R9K2N7",
      tier: "KOL Vàng (185K followers)",
      channel: "TikTok (@nhatbeauty)",
      productName: "Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Sora Skin",
      requestedAt: "07/09/2026 10:20",
      pitch: "Em làm video routine sáng 45s so sánh trước/sau 14 ngày, gắn giỏ hàng TikTok Shop và dẫn link affiliate.",
      shippingAddress: "Số 12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, TP.HCM",
      status: "approved", // 'pending' | 'approved' | 'rejected' | 'delivered' | 'reviewed'
      waybillCode: "GHN-SMP-881290",
      reviewLink: "https://tiktok.com/@nhatbeauty/video/7391209381"
    },
    {
      id: "SMP-102",
      kolName: "Lê Cẩm Tú (tu.beauty)",
      kolId: "KOL-382",
      tier: "KOL Bạc (45K followers)",
      channel: "Instagram (@tucam.official)",
      productName: "Kem Chống Nắng SPF50+ Ultra Light",
      requestedAt: "08/09/2026 09:15",
      pitch: "Bộ ảnh Lookbook kết hợp Story swatch chất kem trên da dầu mụn.",
      shippingAddress: "Chung cư Sunrise City, Quận 7, TP.HCM",
      status: "pending",
      waybillCode: "",
      reviewLink: ""
    },
    {
      id: "SMP-103",
      kolName: "Nguyễn Hải Đăng (dangtech)",
      kolId: "KOL-112",
      tier: "KOL Đồng (5K followers)",
      channel: "TikTok (@dangtech)",
      productName: "Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Sora Skin",
      requestedAt: "06/09/2026 14:00",
      pitch: "Review ngắn 15 giây.",
      shippingAddress: "Hà Nội",
      status: "rejected",
      rejectReason: "Kênh chưa đúng tệp khách hàng mục tiêu của ngành hàng mỹ phẩm dưỡng da.",
      waybillCode: "",
      reviewLink: ""
    }
  ],

  mediaAssets: [
    { id: "MED-01", name: "Bộ Banner Khuyến Mãi Mùa Thu 1200x628", type: "image", linkedProduct: "Serum Vitamin C 15%", downloads: 480, status: "active", url: "./assets/serum-hero-optimized.jpg" },
    { id: "MED-02", name: "Video Hướng Dẫn Swatch Chất Serum 9:16", type: "video", linkedProduct: "Serum Vitamin C 15%", downloads: 890, status: "active", url: "./assets/sample-video.mp4" },
    { id: "MED-03", name: "Bảng Thành Phần & Giấy Công Bố Y Tế", type: "document", linkedProduct: "Serum Vitamin C 15%", downloads: 210, status: "active", url: "#" },
    { id: "MED-04", name: "Banner Siêu Sale 9.9 (Đã Hết Hạn)", type: "image", linkedProduct: "Kem Chống Nắng", downloads: 1200, status: "inactive", url: "./assets/serum-hero-optimized.jpg" }
  ],

  campaigns: [
    {
      id: "CMP-01",
      name: "Chiến Dịch Siêu Hoa Hồng Mùa Thu 2026",
      startDate: "01/09/2026",
      endDate: "30/09/2026",
      status: "running",
      rates: { bronze: 10, silver: 12, gold: 15, diamond: 18 },
      totalOrders: 640,
      gmv: 284000000
    },
    {
      id: "CMP-02",
      name: "Chính Sách Hoa Hồng Mặc Định Shop",
      startDate: "01/01/2026",
      endDate: "31/12/2026",
      status: "active",
      rates: { bronze: 8, silver: 10, gold: 12, diamond: 15 },
      totalOrders: 1820,
      gmv: 812000000
    }
  ],

  customerRequests: [
    {
      id: "REQ-301",
      orderId: "IN23944",
      customerName: "Nguyễn Hải Yến",
      type: "Đổi địa chỉ giao hàng",
      reason: "Em muốn đổi sang địa chỉ văn phòng vì mai công ty có mặt.",
      requestedAt: "08/09 15:30",
      status: "resolved",
      note: "Đã cập nhật địa chỉ mới với đơn vị vận chuyển GHN."
    },
    {
      id: "REQ-302",
      orderId: "IN23845",
      customerName: "Trần Bảo An",
      type: "Yêu cầu xuất hóa đơn VAT",
      reason: "Cần xuất VAT cho công ty TNHH Giải Pháp Số.",
      requestedAt: "08/09 11:00",
      status: "pending",
      note: "Chờ kế toán cửa hàng xuất e-invoice gửi email."
    }
  ]
};

// --------------------------------------------------------------------------
// 1. DUYỆT YÊU CẦU HÀNG MẪU (SHOP SAMPLES - MÀN HÌNH RIÊNG CHO SHOP)
// --------------------------------------------------------------------------
export function shopSamplesScreen() {
  return `
    <div style="padding:0;width:100%;height:calc(100vh - 68px);background:#FAF8F5;">
      <iframe id="shop-samples-iframe" src="/merchant/sample-requests" style="width: 100%; height: 100%; border: none; background: transparent; display: block;" title="Duyệt Hàng Mẫu Shop"></iframe>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 2. QUẢN LÝ TÀI NGUYÊN TRUYỀN THÔNG (SHOP MEDIA)
// --------------------------------------------------------------------------
export function shopMediaScreen() {
  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Chủ Shop / </span><strong>Tài nguyên truyền thông</strong></div>
        <h1>Kho Tài Nguyên & Media Cửa Hàng</h1>
        <p>Tải lên banner, video hướng dẫn và tài liệu chứng nhận để cung cấp cho đội ngũ CTV sáng tạo nội dung.</p>
      </div>
      <div class="actions">
        <button class="btn" data-shop-upload-media><i class="ph ph-upload-simple"></i> Tải lên tài nguyên mới</button>
      </div>
    </header>

    <div class="grid" style="grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px">
      ${shopOpsState.mediaAssets.map(asset => `
        <div class="card" style="padding:16px;display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div style="width:100%;height:140px;background:var(--surface-2);border-radius:8px;overflow:hidden;display:grid;place-items:center;margin-bottom:12px">
              ${asset.type === 'video' ? `<i class="ph ph-video" style="font-size:48px;color:var(--brand)"></i>` : 
                (asset.type === 'image' ? `<img src="${asset.url}" style="width:100%;height:100%;object-fit:cover" />` : 
                `<i class="ph ph-file-text" style="font-size:48px;color:#dc2626"></i>`)}
            </div>
            <span class="badge neutral" style="font-size:11px">${asset.type.toUpperCase()}</span>
            <strong style="font-size:14px;display:block;margin:6px 0 4px;line-height:1.4">${asset.name}</strong>
            <small style="color:var(--muted)">Gắn sản phẩm: <strong>${asset.linkedProduct}</strong></small>
            <div style="font-size:12px;color:var(--muted);margin-top:6px">${icon("ph-download-simple")} ${asset.downloads} lượt CTV tải về</div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--line);margin-top:14px">
            <span class="badge ${asset.status === 'active' ? 'success' : 'neutral'}" style="font-size:11px">
              ${asset.status === 'active' ? 'Đang khả dụng' : 'Đã ngừng dùng'}
            </span>
            <div style="display:flex;gap:6px">
              <button class="icon-btn" data-shop-toggle-media="${asset.id}" title="Bật/Tắt sử dụng">${icon("ph-power")}</button>
              <button class="icon-btn danger" data-shop-delete-media="${asset.id}" title="Xóa tài nguyên">${icon("ph-trash")}</button>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// --------------------------------------------------------------------------
// 3. CHIẾN DỊCH & HOA HỒNG BẬC THANG (SHOP CAMPAIGNS)
// --------------------------------------------------------------------------
export function shopCampaignsScreen() {
  return `
    <div style="padding:0;width:100%;height:calc(100vh - 68px);background:#FAF8F5;">
      <iframe id="shop-campaigns-iframe" src="/merchant/campaigns" style="width: 100%; height: 100%; border: none; background: transparent; display: block;" title="Quản Lý Chiến Dịch & Mời KOL"></iframe>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 4. XỬ LÝ ĐƠN KHÁCH MUA & HỖ TRỢ (SHOP CUSTOMER REQUESTS)
// --------------------------------------------------------------------------
export function shopCustomerRequestsScreen() {
  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Chủ Shop / </span><strong>Yêu cầu khách mua</strong></div>
        <h1>Xử Lý Yêu Cầu Đổi Trả & Khiếu Nại Từ Khách Hàng</h1>
        <p>Tiếp nhận và giải quyết trực tiếp các yêu cầu hủy đơn, đổi trả hàng và hỗ trợ thông tin từ Customer.</p>
      </div>
    </header>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Mã Yêu Cầu</th>
            <th>Mã Đơn Hàng</th>
            <th>Tên Khách Hàng</th>
            <th>Loại Yêu Cầu</th>
            <th>Lý Do / Nội Dung</th>
            <th>Thời Gian</th>
            <th>Trạng Thái</th>
            <th style="text-align:right">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          ${shopOpsState.customerRequests.map(req => `
            <tr>
              <td class="mono" style="font-weight:600">${req.id}</td>
              <td class="mono"><strong>${req.orderId}</strong></td>
              <td>${req.customerName}</td>
              <td><span class="badge neutral">${req.type}</span></td>
              <td style="max-width:260px;font-size:12.5px">${req.reason}</td>
              <td style="font-size:12px;color:var(--muted)">${req.requestedAt}</td>
              <td>
                ${req.status === 'resolved' ? '<span class="badge success">Đã giải quyết</span>' : '<span class="badge warning">Đang chờ xử lý</span>'}
              </td>
              <td style="text-align:right">
                <button class="btn small ${req.status === 'pending' ? '' : 'secondary'}" data-shop-handle-cust-req="${req.id}">
                  ${req.status === 'pending' ? 'Xử lý ngay' : 'Xem ghi chú'}
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
// 5. CÀI ĐẶT SHOP (SHOP SETTINGS)
// --------------------------------------------------------------------------
export function shopSettingsScreen() {
  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Chủ Shop / </span><strong>Cài đặt gian hàng</strong></div>
        <h1>Cài Đặt Cửa Hàng & Quy Tắc Đối Soát</h1>
        <p>Thông tin pháp lý doanh nghiệp, tài khoản ngân hàng thụ hưởng và lịch duyệt chi trả hoa hồng tự động.</p>
      </div>
      <div class="actions">
        <button class="btn" data-shop-save-settings><i class="ph ph-check"></i> Lưu cài đặt</button>
      </div>
    </header>

    <div class="split" style="grid-template-columns:1fr 1fr;gap:20px">
      <div class="card" style="padding:22px">
        <h3 style="margin-top:0;font-size:16px;border-bottom:1px solid var(--line);padding-bottom:10px">${icon("ph-storefront")} Thông tin cửa hàng</h3>
        <div class="form-stack" style="margin-top:16px">
          <div class="field"><label>Tên gian hàng</label><input class="input" value="Sora Skin Official" /></div>
          <div class="field"><label>Mã số thuế doanh nghiệp</label><input class="input mono" value="0109823456" disabled /></div>
          <div class="field"><label>Địa chỉ kho xuất hàng</label><input class="input" value="Kho A3, Khu Công Nghiệp Tân Bình, TP.HCM" /></div>
          <div class="field"><label>Hotline CSKH</label><input class="input" value="1900 6868" /></div>
        </div>
      </div>

      <div class="card" style="padding:22px">
        <h3 style="margin-top:0;font-size:16px;border-bottom:1px solid var(--line);padding-bottom:10px">${icon("ph-bank")} Tài khoản ngân hàng đối soát & Chi trả</h3>
        <div class="form-stack" style="margin-top:16px">
          <div class="field"><label>Ngân hàng thụ hưởng</label><select class="select"><option selected>Vietcombank (VCB) - Chi nhánh TP.HCM</option></select></div>
          <div class="field"><label>Số tài khoản</label><input class="input mono" value="0071001234567" /></div>
          <div class="field"><label>Tên chủ tài khoản</label><input class="input" value="CTY TNHH SORA SKIN VIETNAM" disabled /></div>
          <div class="field">
            <label>Lịch đối soát & Duyệt chi trả</label>
            <select class="select">
              <option selected>Định kỳ vào ngày 10 & 25 hàng tháng</option>
              <option>Duyệt hàng tuần vào thứ Hai</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// BINDING LOGIC CHO SHOP OPERATIONS
// --------------------------------------------------------------------------
export function bindShopOps(root, { toast, go, renderCurrentPage }) {
  // Approve sample
  root.querySelectorAll("[data-shop-approve-sample]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.shopApproveSample;
      const smp = shopOpsState.sampleRequests.find(s => s.id === id);
      if (!smp) return;
      const waybill = prompt(`Nhập mã vận đơn gửi hàng mẫu cho KOL "${smp.kolName}":`, "GHN-SMP-" + Date.now().toString().slice(-6));
      if (waybill) {
        smp.status = "approved";
        smp.waybillCode = waybill;
        toast(`Đã duyệt yêu cầu hàng mẫu ${id} và gắn mã vận đơn ${waybill}!`);
        renderCurrentPage();
      }
    });
  });

  // Reject sample
  root.querySelectorAll("[data-shop-reject-sample]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.shopRejectSample;
      const smp = shopOpsState.sampleRequests.find(s => s.id === id);
      if (!smp) return;
      const reason = prompt("Nhập lý do từ chối gửi mẫu:", "Tạm thời hết mẫu thử dung tích 30ml trong kho.");
      if (reason) {
        smp.status = "rejected";
        smp.rejectReason = reason;
        toast(`Đã từ chối yêu cầu hàng mẫu ${id}.`);
        renderCurrentPage();
      }
    });
  });

  // View waybill
  root.querySelectorAll("[data-shop-view-waybill]").forEach(btn => {
    btn.addEventListener("click", () => {
      toast(`Tra cứu vận đơn: ${btn.dataset.shopViewWaybill} (Đang vận chuyển qua GHN)`);
    });
  });

  // Toggle media
  root.querySelectorAll("[data-shop-toggle-media]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.shopToggleMedia;
      const m = shopOpsState.mediaAssets.find(a => a.id === id);
      if (!m) return;
      m.status = (m.status === "active" ? "inactive" : "active");
      toast(`Đã ${m.status === "active" ? "kích hoạt" : "ngừng dùng"} tài nguyên ${m.name}!`);
      renderCurrentPage();
    });
  });

  // Delete media
  root.querySelectorAll("[data-shop-delete-media]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.shopDeleteMedia;
      shopOpsState.mediaAssets = shopOpsState.mediaAssets.filter(a => a.id !== id);
      toast("Đã xóa tài nguyên khỏi kho truyền thông!");
      renderCurrentPage();
    });
  });

  // Upload media demo
  root.querySelector("[data-shop-upload-media]")?.addEventListener("click", () => {
    const name = prompt("Nhập tên tài nguyên media mới:", "Banner Siêu Ưu Đãi Tháng 10 1200x628");
    if (name) {
      shopOpsState.mediaAssets.unshift({
        id: `MED-${Date.now().toString().slice(-2)}`,
        name: name,
        type: "image",
        linkedProduct: "Serum Vitamin C 15%",
        downloads: 0,
        status: "active",
        url: "./assets/serum-hero-optimized.jpg"
      });
      toast("Đã tải lên và gắn tài nguyên vào sản phẩm thành công!");
      renderCurrentPage();
    }
  });

  // Create Campaign demo
  root.querySelector("[data-shop-create-campaign]")?.addEventListener("click", () => {
    const name = prompt("Nhập tên chiến dịch hoa hồng mới:", "Flash Sale 10.10 Tiếp Thị Đỉnh Cao");
    if (name) {
      shopOpsState.campaigns.unshift({
        id: `CMP-${Date.now().toString().slice(-2)}`,
        name: name,
        startDate: "10/10/2026",
        endDate: "15/10/2026",
        status: "running",
        rates: { bronze: 12, silver: 15, gold: 18, diamond: 22 },
        totalOrders: 0,
        gmv: 0
      });
      toast(`Đã tạo thành công chiến dịch ${name}!`);
      renderCurrentPage();
    }
  });

  // Handle Cust Req
  root.querySelectorAll("[data-shop-handle-cust-req]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.shopHandleCustReq;
      const req = shopOpsState.customerRequests.find(r => r.id === id);
      if (!req) return;
      if (req.status === "pending") {
        const note = prompt(`Nhập hướng xử lý cho yêu cầu ${req.id}:`, "Đã xuất hóa đơn điện tử gửi về email khách hàng.");
        if (note) {
          req.status = "resolved";
          req.note = note;
          toast(`Đã xử lý xong yêu cầu ${req.id} của khách!`);
          renderCurrentPage();
        }
      } else {
        toast(`Ghi chú giải quyết: ${req.note}`);
      }
    });
  });

  // Save shop settings
  root.querySelector("[data-shop-save-settings]")?.addEventListener("click", () => {
    toast("Đã lưu thông tin cài đặt cửa hàng và tài khoản đối soát thành công!");
  });
}

// ==========================================================================
// SCANMS SHOP MANAGER PROFILE & BUSINESS IDENTITY MODULE
// ==========================================================================
export const shopProfileState = {
  activeTab: 'owner', // 'owner' | 'store' | 'business' | 'bank' | 'security'
  profile: {
    avatar: 'S',
    ownerName: 'Nguyễn Thu Trang',
    ownerEmail: 'shop@techstore.vn',
    ownerPhone: '0912 345 678',
    ownerIdCard: '001199008877',
    storeName: 'Sora Skin Official',
    storeId: '8ca136c3-9202-4254-bd4c-3704a840fa7b',
    slug: 'sora-skin',
    hotline: '1900 6868',
    supportEmail: 'support@soraskin.vn',
    category: 'Dược Mỹ Phẩm & Chăm Sóc Da Cao Cấp',
    description: 'Gian hàng phân phối chính hãng dòng sản phẩm chăm sóc da chuyên sâu Sora Skin Flagship. Cam kết 100% chính hãng, hoàn tiền 200% nếu phát hiện hàng giả.',
    warehouseAddress: 'Tổng kho Tân Bình, 142 Cộng Hòa, Phường 12, Q. Tân Bình, TP. Hồ Chí Minh',
    returnAddress: 'Trung tâm bảo hành & hoàn đơn, 280 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh',
    companyName: 'Công ty TNHH Dược Mỹ Phẩm Sora Việt Nam',
    taxCode: '0318923841',
    businessLicense: 'GPKD số 0318923841 do Sở KH&ĐT TP.HCM cấp ngày 15/01/2022',
    mallVerified: true,
    bank: {
      bankName: 'Vietcombank - Ngân hàng Ngoại thương Việt Nam',
      accountNumber: '0071001234567',
      accountName: 'CONG TY TNHH DUOC MY PHAM SORA VIET NAM',
      branch: 'Sở Giao Dịch TP.HCM',
      payoutCycle: 'Thứ Hai hàng tuần & Ngày 15, 30 hàng tháng',
      autoPayout: true
    }
  }
};

// Khôi phục từ localStorage nếu có
try {
  const saved = localStorage.getItem('scanms_profile_shop');
  if (saved) {
    const parsed = JSON.parse(saved);
    shopProfileState.profile = { ...shopProfileState.profile, ...parsed };
  }
} catch (e) {}

export function shopProfileScreen() {
  // Luôn đồng bộ dữ liệu mới nhất từ localStorage để cập nhật avatar kể cả sau khi đổi role hay F5
  try {
    const saved = localStorage.getItem('scanms_profile_shop');
    if (saved) {
      const parsed = JSON.parse(saved);
      shopProfileState.profile = { ...shopProfileState.profile, ...parsed };
    }
  } catch (e) {}

  const p = shopProfileState.profile;
  const tab = shopProfileState.activeTab;

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Chủ Shop / </span><strong>Hồ sơ Gian Hàng & Chủ Shop</strong></div>
        <h1>Hồ Sơ Doanh Nghiệp & Tài Khoản Gian Hàng</h1>
        <p>Quản lý danh tính người đại diện, thông tin pháp lý gian hàng Mall, tài khoản đối soát doanh thu và bảo mật.</p>
      </div>
      <div class="actions">
        <span class="badge-kyc-verified"><i class="ph ph-shield-check"></i> SCANMS MALL VERIFIED</span>
        <span class="badge" style="background:#F5E7CC;color:#7A561B;font-weight:700">Mã Shop: ${p.storeId.slice(0, 8)}...</span>
      </div>
    </header>

    <div class="profile-view-wrap">
      <!-- Tab Navigation -->
      <div class="profile-tab-nav" role="tablist">
        <button class="profile-tab-btn ${tab === 'owner' ? 'active' : ''}" data-shop-tab="owner">
          <i class="ph ph-user"></i> Chủ sở hữu & Đại diện
        </button>
        <button class="profile-tab-btn ${tab === 'store' ? 'active' : ''}" data-shop-tab="store">
          <i class="ph ph-storefront"></i> Gian hàng & Kho vận
        </button>
        <button class="profile-tab-btn ${tab === 'business' ? 'active' : ''}" data-shop-tab="business">
          <i class="ph ph-buildings"></i> Pháp lý & Mã số thuế
        </button>
        <button class="profile-tab-btn ${tab === 'bank' ? 'active' : ''}" data-shop-tab="bank">
          <i class="ph ph-bank"></i> Ngân hàng đối soát
        </button>
        <button class="profile-tab-btn ${tab === 'security' ? 'active' : ''}" data-shop-tab="security">
          <i class="ph ph-lock-key"></i> Mật khẩu & API Key
        </button>
      </div>

      <!-- Tab 1: Chủ sở hữu & Đại diện -->
      ${tab === 'owner' ? `
        <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-user-circle" style="color:var(--brand)"></i> Người đại diện pháp luật của gian hàng
            </h3>

            <div class="profile-avatar-uploader">
              <div class="profile-avatar-uploader-circle" id="shop-avatar-circle-trigger" onclick="document.getElementById('shop-avatar-file')?.click()" style="background:#F5E7CC;color:#7A561B;cursor:pointer" title="Click để chọn ảnh từ máy">
                ${p.avatarImg ? `<img src="${p.avatarImg}" alt="${p.ownerName}" />` : p.avatar}
                <div class="profile-avatar-uploader-overlay">
                  <i class="ph ph-camera"></i>
                  <span>Đổi ảnh</span>
                </div>
              </div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                  <strong style="font-size:16px;color:var(--text)">${p.ownerName}</strong>
                  <span class="badge-kyc-verified"><i class="ph ph-check-circle"></i> Đã xác thực CCCD</span>
                </div>
                <span style="font-size:12.5px;color:var(--muted);display:block;margin:3px 0 8px">Đại diện pháp luật • <strong>${p.storeName}</strong></span>
                <div class="profile-avatar-actions">
                  <input type="file" id="shop-avatar-file" accept="image/*" style="display:none" />
                  <label for="shop-avatar-file" class="btn small outline" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin:0">
                    <i class="ph ph-upload-simple"></i> Tải ảnh từ máy
                  </label>
                  ${p.avatarImg ? `
                    <button type="button" class="btn small text-danger" id="shop-avatar-remove-btn" style="border:1px solid #fecaca;background:#fef2f2;color:#dc2626;display:inline-flex;align-items:center;gap:6px;cursor:pointer" title="Gỡ ảnh đại diện">
                      <i class="ph ph-trash"></i> Gỡ ảnh
                    </button>
                  ` : ''}
                  <span style="font-size:11.5px;color:var(--muted)">Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 5MB)</span>
                </div>
              </div>
            </div>

            <form id="shop-owner-form" class="form-stack">
              <div class="field">
                <label>Họ và tên người đại diện *</label>
                <input class="input" id="shop-owner-name" value="${p.ownerName}" required />
              </div>

              <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
                <div class="field">
                  <label>Email chủ shop (Đăng nhập) *</label>
                  <input class="input" id="shop-owner-email" value="${p.ownerEmail}" required />
                </div>
                <div class="field">
                  <label>Số điện thoại liên hệ khẩn cấp *</label>
                  <input class="input" id="shop-owner-phone" value="${p.ownerPhone}" required />
                </div>
              </div>

              <div class="field">
                <label>Số CCCD / Hộ chiếu người đại diện</label>
                <input class="input" id="shop-owner-idcard" value="${p.ownerIdCard}" required />
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:14px">
                <button type="submit" class="btn" style="padding:10px 24px;font-weight:750">
                  <i class="ph ph-floppy-disk"></i> Lưu thông tin chủ sở hữu
                </button>
              </div>
            </form>
          </div>

          <div style="display:flex;flex-direction:column;gap:18px">
            <div class="card" style="padding:22px">
              <h4 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
                <i class="ph ph-shield-check" style="color:#15803d"></i> Tiêu chuẩn chứng nhận Shop
              </h4>
              <p style="font-size:13px;color:var(--muted);line-height:1.6;margin:0 0 10px">
                Gian hàng đạt chứng nhận <strong>SCANMS Mall Official</strong> được ưu tiên hiển thị trên Marketplace, miễn phí API vận chuyển và hưởng chính sách bảo lãnh thanh toán tức thì.
              </p>
              <div style="font-size:12.5px;color:var(--muted)">
                <div>• Trạng thái ký quỹ: <strong>Đầy đủ (50.000.000 ₫)</strong></div>
                <div>• Tỷ lệ hủy đơn gian hàng: <strong>0.12% (Rất tốt)</strong></div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Tab 2: Gian hàng & Kho vận -->
      ${tab === 'store' ? `
        <div class="card" style="padding:26px">
          <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
            <i class="ph ph-storefront" style="color:var(--brand)"></i> Nhận diện thương hiệu & Thông tin kho vận
          </h3>

          <form id="shop-store-form" class="form-stack" style="margin-top:16px">
            <div class="grid" style="grid-template-columns:1.2fr 1fr;gap:16px">
              <div class="field">
                <label>Tên gian hàng hiển thị công khai *</label>
                <input class="input" id="shop-store-name" value="${p.storeName}" required />
              </div>
              <div class="field">
                <label>Đường dẫn gian hàng (Slug)</label>
                <div style="display:flex;align-items:center;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding-left:12px">
                  <span style="font-size:13px;color:var(--muted)">scanms.vn/store/</span>
                  <input class="input" id="shop-store-slug" value="${p.slug}" style="border:none;background:transparent;padding-left:4px" />
                </div>
              </div>
            </div>

            <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
              <div class="field">
                <label>Hotline chăm sóc khách hàng</label>
                <input class="input" id="shop-store-hotline" value="${p.hotline}" />
              </div>
              <div class="field">
                <label>Email tiếp nhận đơn hàng</label>
                <input class="input" id="shop-store-email" value="${p.supportEmail}" />
              </div>
            </div>

            <div class="field">
              <label>Ngành hàng kinh doanh chủ lực</label>
              <input class="input" id="shop-store-category" value="${p.category}" />
            </div>

            <div class="field">
              <label>Mô tả giới thiệu gian hàng</label>
              <textarea class="input" id="shop-store-desc" rows="3">${p.description}</textarea>
            </div>

            <div class="field">
              <label>Địa chỉ Tổng kho lấy hàng (Đồng bộ GHN / GHTK)</label>
              <input class="input" id="shop-store-wh" value="${p.warehouseAddress}" required />
            </div>

            <div class="field">
              <label>Địa chỉ kho tiếp nhận hàng đổi trả / hoàn</label>
              <input class="input" id="shop-store-return" value="${p.returnAddress}" required />
            </div>

            <div style="display:flex;justify-content:flex-end;margin-top:16px">
              <button type="submit" class="btn" style="padding:10px 26px;font-weight:750">
                <i class="ph ph-floppy-disk"></i> Lưu hồ sơ gian hàng & Kho vận
              </button>
            </div>
          </form>
        </div>
      ` : ''}

      <!-- Tab 3: Pháp lý & Mã số thuế -->
      ${tab === 'business' ? `
        <div class="card" style="padding:26px">
          <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
            <i class="ph ph-buildings" style="color:var(--brand)"></i> Thông tin Pháp lý & Thuế Doanh nghiệp
          </h3>

          <div class="form-stack" style="margin-top:16px">
            <div class="field">
              <label>Tên doanh nghiệp / Hộ kinh doanh đăng ký *</label>
              <input class="input" id="shop-biz-name" value="${p.companyName}" />
            </div>

            <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
              <div class="field">
                <label>Mã số thuế doanh nghiệp (MST) *</label>
                <input class="input" id="shop-biz-tax" value="${p.taxCode}" />
              </div>
              <div class="field">
                <label>Giấy chứng nhận đăng ký kinh doanh</label>
                <input class="input" id="shop-biz-license" value="${p.businessLicense}" />
              </div>
            </div>

            <div style="padding:16px;background:var(--surface-2);border-radius:12px;border:1px solid var(--line);margin-top:10px">
              <div style="display:flex;align-items:center;gap:10px">
                <i class="ph ph-certificate" style="font-size:26px;color:#15803d"></i>
                <div>
                  <strong style="font-size:14px;color:var(--text)">Hồ sơ đã được Khối Vận Hành Sàn SCANMS thẩm định phê duyệt</strong>
                  <div style="font-size:12px;color:var(--muted)">Đã đối soát với Cổng thông tin Quốc gia về Đăng ký Doanh nghiệp.</div>
                </div>
              </div>
            </div>

            <div style="display:flex;justify-content:flex-end;margin-top:14px">
              <button id="btn-save-biz" class="btn" style="padding:10px 24px;font-weight:750">
                <i class="ph ph-check"></i> Cập nhật thông tin pháp lý
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Tab 4: Ngân hàng đối soát -->
      ${tab === 'bank' ? `
        <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-bank" style="color:var(--brand)"></i> Tài khoản Ngân hàng nhận đối soát doanh số
            </h3>

            <form id="shop-bank-form" class="form-stack" style="margin-top:16px">
              <div class="field">
                <label>Ngân hàng doanh nghiệp *</label>
                <input class="input" id="shop-bank-name" value="${p.bank.bankName}" required />
              </div>

              <div class="field">
                <label>Số tài khoản ngân hàng nhận tiền *</label>
                <input class="input" id="shop-bank-acc" value="${p.bank.accountNumber}" required />
              </div>

              <div class="field">
                <label>Tên chủ tài khoản thụ hưởng (In hoa) *</label>
                <input class="input" id="shop-bank-holder" value="${p.bank.accountName}" required />
              </div>

              <div class="field">
                <label>Chi nhánh mở tài khoản</label>
                <input class="input" id="shop-bank-branch" value="${p.bank.branch}" />
              </div>

              <div class="field">
                <label>Chu kỳ quyết toán tự động</label>
                <input class="input" value="${p.bank.payoutCycle}" disabled />
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:14px">
                <button type="submit" class="btn" style="padding:10px 24px;font-weight:750">
                  <i class="ph ph-check"></i> Lưu tài khoản ngân hàng đối soát
                </button>
              </div>
            </form>
          </div>

          <div class="card" style="padding:22px;background:linear-gradient(135deg, #7A561B 0%, #3f280b 100%);color:#fff;border-radius:18px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px">
              <span style="font-size:13px;font-weight:700;letter-spacing:1px;opacity:0.85">SCANMS MERCHANT SETTLEMENT</span>
              <i class="ph ph-storefront" style="font-size:28px"></i>
            </div>
            <div style="font-size:20px;font-weight:800;letter-spacing:2px;font-family:monospace;margin-bottom:18px">
              •••• •••• •••• ${p.bank.accountNumber.slice(-4)}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end">
              <div>
                <small style="font-size:10px;opacity:0.75;display:block">TÊN THỤ HƯỞNG</small>
                <strong style="font-size:13.5px">${p.bank.accountName}</strong>
              </div>
              <div style="text-align:right">
                <small style="font-size:10px;opacity:0.75;display:block">TỰ ĐỘNG ĐỐI SOÁT</small>
                <span class="badge success" style="font-size:10.5px">Đang kích hoạt</span>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Tab 5: Mật khẩu & API Key -->
      ${tab === 'security' ? `
        <div class="split" style="grid-template-columns:1fr 1fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-lock-key" style="color:var(--brand)"></i> Đổi mật khẩu tài khoản Shop
            </h3>
            <form id="shop-pass-form" class="form-stack" style="margin-top:16px">
              <div class="field">
                <label>Mật khẩu hiện tại *</label>
                <input class="input" type="password" id="shop-cur-pass" placeholder="••••••••" required />
              </div>
              <div class="field">
                <label>Mật khẩu mới * (Tối thiểu 8 ký tự)</label>
                <input class="input" type="password" id="shop-new-pass" placeholder="Nhập mật khẩu mới" required />
              </div>
              <div class="field">
                <label>Xác nhận mật khẩu mới *</label>
                <input class="input" type="password" id="shop-confirm-pass" placeholder="Nhập lại mật khẩu mới" required />
              </div>
              <button type="submit" class="btn" style="margin-top:8px;font-weight:750">
                <i class="ph ph-shield-check"></i> Đổi mật khẩu gian hàng
              </button>
            </form>
          </div>

          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-key" style="color:var(--brand)"></i> API Token & Khóa Tích Hợp
            </h3>
            <div class="field" style="margin:16px 0">
              <label>API Secret Key (Kết nối kho vận GHN / Viettel Post)</label>
              <input class="input" value="STRIPE_SECRET_CONFIGURED_ON_SERVER" disabled />
            </div>
            <button id="btn-copy-token" class="btn secondary small"><i class="ph ph-copy"></i> Sao chép Secret Token</button>
            <div style="margin-top:20px;padding-top:14px;border-top:1px solid var(--line)">
              <small style="color:var(--muted);display:block;margin-bottom:8px">Phiên làm việc hiện tại: <strong>Chrome trên Windows (IP: 14.162.11.89)</strong></small>
              <button id="btn-shop-logout-others" class="btn secondary danger small">Đăng xuất các phiên khác</button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function bindShopProfile(root, { toast, renderCurrentPage }) {
  // Avatar upload & remove
  const avatarCircle = root.querySelector('#shop-avatar-circle-trigger');
  const avatarInput = root.querySelector('#shop-avatar-file');
  const avatarRemoveBtn = root.querySelector('#shop-avatar-remove-btn');

  if (avatarCircle && avatarInput) {
    avatarCircle.addEventListener('click', () => {
      avatarInput.click();
    });
  }

  if (avatarInput) {
    avatarInput.addEventListener('change', async (e) => {
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
        shopProfileState.profile.avatarImg = compressedBase64;
        safeSaveProfile('scanms_profile_shop', shopProfileState.profile);
        toast?.('Đã đổi ảnh đại diện chủ gian hàng thành công!', 'success');
        renderCurrentPage();
      } catch (err) {
        console.error('Lỗi khi nén ảnh đại diện shop:', err);
        toast?.('Không thể xử lý ảnh này. Vui lòng chọn ảnh khác!', 'error');
      }
    });
  }

  if (avatarRemoveBtn) {
    avatarRemoveBtn.addEventListener('click', () => {
      shopProfileState.profile.avatarImg = null;
      safeSaveProfile('scanms_profile_shop', shopProfileState.profile);
      toast?.('Đã gỡ ảnh đại diện, chuyển về chữ cái mặc định!', 'info');
      renderCurrentPage();
    });
  }

  // Chuyển Tab
  root.querySelectorAll('[data-shop-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      shopProfileState.activeTab = btn.dataset.shopTab;
      renderCurrentPage();
    });
  });

  // Lưu thông tin chủ sở hữu
  const ownerForm = root.querySelector('#shop-owner-form');
  if (ownerForm) {
    ownerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ownerName = root.querySelector('#shop-owner-name')?.value || shopProfileState.profile.ownerName;
      const ownerEmail = root.querySelector('#shop-owner-email')?.value || shopProfileState.profile.ownerEmail;
      const ownerPhone = root.querySelector('#shop-owner-phone')?.value || shopProfileState.profile.ownerPhone;
      const ownerIdCard = root.querySelector('#shop-owner-idcard')?.value || shopProfileState.profile.ownerIdCard;

      shopProfileState.profile = {
        ...shopProfileState.profile,
        ownerName,
        ownerEmail,
        ownerPhone,
        ownerIdCard,
      };
      safeSaveProfile('scanms_profile_shop', shopProfileState.profile);
      toast?.('Đã cập nhật thông tin chủ sở hữu gian hàng thành công!', 'success');
      renderCurrentPage();
    });
  }

  // Lưu thông tin gian hàng & kho
  const storeForm = root.querySelector('#shop-store-form');
  if (storeForm) {
    storeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const storeName = root.querySelector('#shop-store-name')?.value || shopProfileState.profile.storeName;
      const slug = root.querySelector('#shop-store-slug')?.value || shopProfileState.profile.slug;
      const hotline = root.querySelector('#shop-store-hotline')?.value || shopProfileState.profile.hotline;
      const supportEmail = root.querySelector('#shop-store-email')?.value || shopProfileState.profile.supportEmail;
      const category = root.querySelector('#shop-store-category')?.value || shopProfileState.profile.category;
      const description = root.querySelector('#shop-store-desc')?.value || shopProfileState.profile.description;
      const warehouseAddress = root.querySelector('#shop-store-wh')?.value || shopProfileState.profile.warehouseAddress;
      const returnAddress = root.querySelector('#shop-store-return')?.value || shopProfileState.profile.returnAddress;

      shopProfileState.profile = {
        ...shopProfileState.profile,
        storeName,
        avatar: storeName.charAt(0).toUpperCase(),
        slug,
        hotline,
        supportEmail,
        category,
        description,
        warehouseAddress,
        returnAddress,
      };
      safeSaveProfile('scanms_profile_shop', shopProfileState.profile);
      toast?.('Đã cập nhật hồ sơ gian hàng & kho vận thành công!', 'success');
      renderCurrentPage();
    });
  }

  // Lưu Pháp lý & MST
  const btnSaveBiz = root.querySelector('#btn-save-biz');
  if (btnSaveBiz) {
    btnSaveBiz.addEventListener('click', () => {
      const companyName = root.querySelector('#shop-biz-name')?.value || shopProfileState.profile.companyName;
      const taxCode = root.querySelector('#shop-biz-tax')?.value || shopProfileState.profile.taxCode;
      const businessLicense = root.querySelector('#shop-biz-license')?.value || shopProfileState.profile.businessLicense;

      shopProfileState.profile = {
        ...shopProfileState.profile,
        companyName,
        taxCode,
        businessLicense,
      };
      safeSaveProfile('scanms_profile_shop', shopProfileState.profile);
      toast?.('Đã cập nhật thông tin pháp lý doanh nghiệp thành công!', 'success');
      renderCurrentPage();
    });
  }

  // Lưu Ngân hàng
  const bankForm = root.querySelector('#shop-bank-form');
  if (bankForm) {
    bankForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const bankName = root.querySelector('#shop-bank-name')?.value || shopProfileState.profile.bank.bankName;
      const accountNumber = root.querySelector('#shop-bank-acc')?.value || shopProfileState.profile.bank.accountNumber;
      const accountName = (root.querySelector('#shop-bank-holder')?.value || shopProfileState.profile.bank.accountName).toUpperCase();
      const branch = root.querySelector('#shop-bank-branch')?.value || shopProfileState.profile.bank.branch;

      shopProfileState.profile.bank = {
        ...shopProfileState.profile.bank,
        bankName,
        accountNumber,
        accountName,
        branch,
      };
      safeSaveProfile('scanms_profile_shop', shopProfileState.profile);
      toast?.('Đã cập nhật tài khoản ngân hàng đối soát doanh thu!', 'success');
      renderCurrentPage();
    });
  }

  // Đổi mật khẩu
  const passForm = root.querySelector('#shop-pass-form');
  if (passForm) {
    passForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newP = root.querySelector('#shop-new-pass')?.value;
      const confP = root.querySelector('#shop-confirm-pass')?.value;
      if (!newP || newP.length < 8) {
        toast?.('Mật khẩu mới phải có tối thiểu 8 ký tự!', 'error');
        return;
      }
      if (newP !== confP) {
        toast?.('Mật khẩu xác nhận không khớp!', 'error');
        return;
      }
      toast?.('Đã đổi mật khẩu tài khoản gian hàng thành công!', 'success');
      passForm.reset();
    });
  }

  // Sao chép API Token
  const btnCopyToken = root.querySelector('#btn-copy-token');
  if (btnCopyToken) {
    btnCopyToken.addEventListener('click', () => {
      navigator.clipboard?.writeText('STRIPE_SECRET_CONFIGURED_ON_SERVER');
      toast?.('Đã sao chép API Secret Key vào clipboard!', 'success');
    });
  }

  // Đăng xuất phiên khác
  const btnLogoutOthers = root.querySelector('#btn-shop-logout-others');
  if (btnLogoutOthers) {
    btnLogoutOthers.addEventListener('click', () => {
      toast?.('Đã thu hồi quyền truy cập từ các thiết bị khác!', 'success');
    });
  }
}

