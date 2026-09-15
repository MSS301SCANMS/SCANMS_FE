// ==========================================================================
// SCANMS SYSTEM ADMINISTRATOR MODULE (Quản Trị Kỹ Thuật, RBAC & Sức Khỏe)
// ==========================================================================

import { compressAvatarImage, safeSaveProfile } from './image-utils.js';

const icon = (name) => `<i class="ph ${name}" aria-hidden="true"></i>`;

export const adminState = {
  internalAccounts: [
    { id: "SA-001", name: "Nguyễn Thành Thắng", email: "admin@scanms.vn", role: "SYSTEM_ADMIN", title: "Quản trị viên Hệ thống Cấp cao", status: "active", lastLogin: "08/09/2026 22:30", ip: "118.69.12.44", "2fa": true },
    { id: "SM-0042", name: "Lê Hồng Phúc", email: "manager@scanms.vn", role: "SYSTEM_MANAGER", title: "Trưởng nhóm Vận hành Nền tảng", status: "active", lastLogin: "08/09/2026 15:40", ip: "14.241.88.19", "2fa": true },
    { id: "SM-0043", name: "Trần Bảo Ngọc", email: "ngoc.tran@scanms.vn", role: "SYSTEM_MANAGER", title: "Chuyên viên Thẩm định Shop & Tuân thủ", status: "active", lastLogin: "07/09/2026 18:12", ip: "113.161.45.88", "2fa": false },
    { id: "SM-0040", name: "Vũ Đình Trọng", email: "trong.vu@scanms.vn", role: "SYSTEM_MANAGER", title: "Chuyên viên Điều phối (Đã thôi việc)", status: "locked", lockReason: "Hết hợp đồng lao động và thu hồi phiên truy cập", lastLogin: "20/08/2026 09:00", ip: "27.72.102.15", "2fa": true }
  ],

  rbacMatrix: [
    { category: "Quản trị Kỹ thuật & Hạ tầng", permission: "Cấu hình hệ thống & Tham số nền tảng", admin: true, manager: false, shop: false, kol: false, customer: false },
    { category: "Quản trị Kỹ thuật & Hạ tầng", permission: "Quản lý tài khoản nội bộ & Thu hồi phiên", admin: true, manager: false, shop: false, kol: false, customer: false },
    { category: "Quản trị Kỹ thuật & Hạ tầng", permission: "Xem Sức khỏe hệ thống & Lỗi kết nối", admin: true, manager: false, shop: false, kol: false, customer: false },
    { category: "Quản trị Kỹ thuật & Hạ tầng", permission: "Xem Nhật ký an ninh Audit Trail (Bất biến)", admin: true, manager: true, shop: false, kol: false, customer: false },
    { category: "Vận hành Nền tảng (Platform Ops)", permission: "Thẩm định & Duyệt hồ sơ gian hàng Shop", admin: true, manager: true, shop: false, kol: false, customer: false },
    { category: "Vận hành Nền tảng (Platform Ops)", permission: "Quản lý danh mục Ngân hàng VietQR/Napas", admin: true, manager: true, shop: false, kol: false, customer: false },
    { category: "Vận hành Nền tảng (Platform Ops)", permission: "Xử lý & Kết luận cảnh báo AI Fraud", admin: true, manager: true, shop: false, kol: false, customer: false },
    { category: "Cửa hàng & Gian hàng (Merchant)", permission: "Quản lý sản phẩm, giá bán & tồn kho", admin: false, manager: false, shop: true, kol: false, customer: false },
    { category: "Cửa hàng & Gian hàng (Merchant)", permission: "Đối soát đơn hàng & Kiểm soát hoàn hủy", admin: false, manager: false, shop: true, kol: false, customer: false },
    { category: "Cửa hàng & Gian hàng (Merchant)", permission: "Phê duyệt & Chi trả hoa hồng có chứng từ", admin: false, manager: false, shop: true, kol: false, customer: false },
    { category: "Cửa hàng & Gian hàng (Merchant)", permission: "Duyệt yêu cầu hàng mẫu từ KOL", admin: false, manager: false, shop: true, kol: false, customer: false },
    { category: "Cửa hàng & Gian hàng (Merchant)", permission: "Quản lý tài nguyên truyền thông (Media)", admin: false, manager: false, shop: true, kol: false, customer: false },
    { category: "Tiếp thị liên kết (Collaborator)", permission: "Phát hành Smart Link & QR định danh", admin: false, manager: false, shop: false, kol: true, customer: false },
    { category: "Tiếp thị liên kết (Collaborator)", permission: "Kết nối kênh mạng xã hội & Thống kê", admin: false, manager: false, shop: false, kol: true, customer: false },
    { category: "Tiếp thị liên kết (Collaborator)", permission: "Yêu cầu rút tiền hoa hồng về VietQR", admin: false, manager: false, shop: false, kol: true, customer: false },
    { category: "Khách Mua Hàng (Customer)", permission: "Theo dõi đơn hàng & Hành trình giao", admin: false, manager: false, shop: false, kol: false, customer: true },
    { category: "Khách Mua Hàng (Customer)", permission: "Quản lý sổ địa chỉ & Đổi trả trong 14 ngày", admin: false, manager: false, shop: false, kol: false, customer: true },
    { category: "Khách Mua Hàng (Customer)", permission: "Đánh giá sản phẩm đã mua & Nhận voucher", admin: false, manager: false, shop: false, kol: false, customer: true }
  ],

  serviceHealth: [
    { service: "Auth & Identity (JWT / Session)", status: "operational", uptime: "99.99%", latency: "42ms", lastIncident: "Không có trong 30 ngày", errorRetryQueue: 0 },
    { service: "Commission & Ledger (Audit Trail)", status: "operational", uptime: "100%", latency: "58ms", lastIncident: "Không có trong 30 ngày", errorRetryQueue: 0 },
    { service: "Fraud Sentinel Engine (AI Scoring)", status: "operational", uptime: "99.95%", latency: "112ms", lastIncident: "Cảnh báo spike click 02/09", errorRetryQueue: 0 },
    { service: "Banking Gateway (VietQR/Napas Sandbox)", status: "degraded", uptime: "99.82%", latency: "245ms", lastIncident: "Napas bảo trì 05/09 (15 phút)", errorRetryQueue: 3 },
    { service: "Shipping Tracking (GHN/GHTK Webhook)", status: "operational", uptime: "99.98%", latency: "88ms", lastIncident: "Chậm cập nhật trạng thái 01/09", errorRetryQueue: 1 }
  ],

  systemConfig: {
    platformFeeRate: 3.0,
    cookieAttributionDays: 30,
    escrowHoldingDays: 14,
    minWithdrawalAmount: 200000,
    aiFraudThreshold: 85,
    allowGuestCheckout: true,
    lastUpdated: "05/09/2026 bởi Nguyễn Thành Thắng"
  }
};

// --------------------------------------------------------------------------
// 1. QUẢN LÝ TÀI KHOẢN NỘI BỘ (ADMIN INTERNAL ACCOUNTS)
// --------------------------------------------------------------------------
export function adminInternalAccountsScreen() {
  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Hệ thống / </span><strong>Tài khoản nội bộ</strong></div>
        <h1>Quản Trị Tài Khoản Nội Bộ</h1>
        <p>Phân quyền Quản Trị Hệ Thống và Vận Hành Sàn. Không cho phép đăng ký công khai.</p>
      </div>
      <div class="actions">
        <button class="btn" data-adm-invite-manager><i class="ph ph-user-plus"></i> Mời Chuyên Viên Vận Hành Sàn</button>
      </div>
    </header>

    <div class="toolbar" style="margin-bottom:18px">
      <span class="badge" style="background:var(--brand-soft);color:var(--brand-strong);padding:8px 14px;font-size:12.5px">
        ${icon("ph-shield-check")} <strong>Nguyên tắc an ninh:</strong> Mọi tài khoản nội bộ bắt buộc kích hoạt xác thực 2 bước (2FA) và bị thu hồi phiên ngay lập tức khi phát hiện rủi ro.
      </span>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nhân Sự / Mã ID</th>
            <th>Email Công Vụ</th>
            <th>Vai Trò (RBAC)</th>
            <th>Chức Danh Chuyên Môn</th>
            <th>Bảo Mật 2FA</th>
            <th>Lần Đăng Nhập Gần Nhất</th>
            <th>Trạng Thái</th>
            <th style="text-align:right">Thao Tác Quản Trị</th>
          </tr>
        </thead>
        <tbody>
          ${adminState.internalAccounts.map(acc => `
            <tr>
              <td>
                <div style="font-weight:700;color:var(--text)">${acc.name}</div>
                <div class="mono" style="font-size:11.5px;color:var(--muted)">${acc.id}</div>
              </td>
              <td>${acc.email}</td>
              <td>
                <span class="badge ${acc.role === 'SYSTEM_ADMIN' ? 'danger' : 'info'}" style="font-weight:700">
                  ${acc.role === 'SYSTEM_ADMIN' ? 'Quản Trị Hệ Thống' : 'Vận Hành Sàn'}
                </span>
              </td>
              <td style="font-size:12.5px">${acc.title}</td>
              <td>
                ${acc["2fa"] ? '<span class="badge success" style="font-size:11px"><i class="ph ph-shield-check"></i> Đã bật 2FA</span>' : '<span class="badge warning" style="font-size:11px"><i class="ph ph-shield-warning"></i> Chưa bật 2FA</span>'}
              </td>
              <td>
                <div style="font-size:12px">${acc.lastLogin}</div>
                <div class="mono" style="font-size:11px;color:var(--muted)">IP: ${acc.ip}</div>
              </td>
              <td>
                ${acc.status === 'active' ? '<span class="badge success">Hoạt động</span>' : '<span class="badge danger">Đã khóa</span>'}
              </td>
              <td style="text-align:right">
                <div class="actions" style="justify-content:flex-end">
                  ${acc.role !== 'SYSTEM_ADMIN' ? `
                    <button class="btn small ${acc.status === 'active' ? 'danger' : 'secondary'}" data-adm-toggle-lock="${acc.id}">
                      ${acc.status === 'active' ? icon("ph-lock") + " Khóa" : icon("ph-lock-open") + " Mở khóa"}
                    </button>
                    <button class="btn small secondary" data-adm-revoke-session="${acc.id}" title="Thu hồi phiên làm việc">
                      ${icon("ph-sign-out")} Thu hồi phiên
                    </button>
                  ` : `
                    <span style="font-size:11.5px;color:var(--muted);font-weight:600;padding:4px 8px">Quản Trị Cấp Cao</span>
                  `}
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 2. MA TRẬN PHÂN QUYỀN RBAC (ADMIN RBAC MATRIX)
// --------------------------------------------------------------------------
export function adminRbacScreen() {
  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Hệ thống / </span><strong>Phân quyền RBAC</strong></div>
        <h1>Ma Trận Phân Quyền Vai Trò (Role-Based Access Control)</h1>
        <p>Kiểm soát chặt chẽ ranh giới trách nhiệm giữa 5 vai trò hệ thống SCANMS. Đảm bảo nguyên tắc đặc quyền tối thiểu (Least Privilege).</p>
      </div>
      <div class="actions">
        <button class="btn secondary" data-adm-save-rbac><i class="ph ph-floppy-disk"></i> Lưu thay đổi ma trận</button>
      </div>
    </header>

    <div class="table-wrap">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:var(--surface-2)">
            <th style="width:24%">Nhóm Quyền Hạn (Permission Scope)</th>
            <th style="width:36%">Chức Năng Chi Tiết</th>
            <th style="text-align:center;width:8%">Quản Trị Hệ Thống</th>
            <th style="text-align:center;width:8%">Vận Hành Sàn</th>
            <th style="text-align:center;width:8%">Chủ Cửa Hàng</th>
            <th style="text-align:center;width:8%">KOL / CTV</th>
            <th style="text-align:center;width:8%">Khách Hàng</th>
          </tr>
        </thead>
        <tbody>
          ${adminState.rbacMatrix.map(row => `
            <tr>
              <td style="font-weight:600;font-size:12.5px;color:var(--muted)">${row.category}</td>
              <td style="font-weight:600;font-size:13px">${row.permission}</td>
              <td style="text-align:center">${row.admin ? '<span style="color:#059669;font-size:18px"><i class="ph ph-check-circle-fill"></i></span>' : '<span style="color:var(--muted);opacity:0.3"><i class="ph ph-minus"></i></span>'}</td>
              <td style="text-align:center">${row.manager ? '<span style="color:#059669;font-size:18px"><i class="ph ph-check-circle-fill"></i></span>' : '<span style="color:var(--muted);opacity:0.3"><i class="ph ph-minus"></i></span>'}</td>
              <td style="text-align:center">${row.shop ? '<span style="color:#059669;font-size:18px"><i class="ph ph-check-circle-fill"></i></span>' : '<span style="color:var(--muted);opacity:0.3"><i class="ph ph-minus"></i></span>'}</td>
              <td style="text-align:center">${row.kol ? '<span style="color:#059669;font-size:18px"><i class="ph ph-check-circle-fill"></i></span>' : '<span style="color:var(--muted);opacity:0.3"><i class="ph ph-minus"></i></span>'}</td>
              <td style="text-align:center">${row.customer ? '<span style="color:#059669;font-size:18px"><i class="ph ph-check-circle-fill"></i></span>' : '<span style="color:var(--muted);opacity:0.3"><i class="ph ph-minus"></i></span>'}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="card" style="margin-top:20px;padding:18px;background:var(--surface-2)">
      <strong style="font-size:13.5px;color:var(--text)"><i class="ph ph-shield-alert"></i> Cảnh báo an ninh cấp cao:</strong>
      <p style="font-size:12.5px;color:var(--muted);line-height:1.5;margin:6px 0 0">
        Admin là cấp quản trị hạ tầng kỹ thuật cao nhất nhưng <strong>tuyệt đối không được phép sửa/xóa các bản ghi tài chính và lịch sử hoa hồng</strong>. Mọi can thiệp bắt buộc tuân theo nguyên tắc Bút toán đảo (Reverse entry / Clawback) và lưu vết bất biến vào Audit Trail.
      </p>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 3. SỨC KHỎE HỆ THỐNG (ADMIN SERVICE HEALTH)
// --------------------------------------------------------------------------
export function adminServiceHealthScreen() {
  const h = adminState.serviceHealth;

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Hệ thống / </span><strong>Sức khỏe dịch vụ</strong></div>
        <h1>Giám Sát Hạ Tầng & Sức Khỏe Hệ Thống (Telemetry)</h1>
        <p>Theo dõi thời gian hoạt động (Uptime SLA), độ trễ API (p95), trạng thái kết nối cơ sở dữ liệu và cơ chế thử lại khi lỗi.</p>
      </div>
      <div class="actions">
        <button class="btn secondary" data-adm-refresh-health><i class="ph ph-arrows-clockwise"></i> Làm mới trạng thái</button>
      </div>
    </header>

    <!-- 4 Khối Telemetry -->
    <div class="grid kpis" style="grid-template-columns:repeat(4, 1fr);gap:16px;margin-bottom:24px">
      <div class="card kpi-card">
        <small style="color:var(--muted);font-weight:600">Trạng Thái Toàn Hệ Thống</small>
        <strong style="font-size:26px;display:block;margin:6px 0 4px;color:#059669">
          <i class="ph ph-check-circle"></i> Bình Thường
        </strong>
        <span style="font-size:11.5px;color:var(--muted)">Tất cả 5/5 services hoạt động tốt</span>
      </div>

      <div class="card kpi-card">
        <small style="color:var(--muted);font-weight:600">Thời Gian Hoạt Động (Uptime)</small>
        <strong style="font-size:26px;display:block;margin:6px 0 4px;color:var(--text)">${h.uptime}</strong>
        <span style="font-size:11.5px;color:#059669"><i class="ph ph-trend-up"></i> Đạt chuẩn SLA 99.9%</span>
      </div>

      <div class="card kpi-card">
        <small style="color:var(--muted);font-weight:600">Độ Trễ Phản Hồi (p95)</small>
        <strong style="font-size:26px;display:block;margin:6px 0 4px;color:var(--brand)">${h.p95Latency}</strong>
        <span style="font-size:11.5px;color:var(--muted)">Mục tiêu: &lt; 200ms</span>
      </div>

      <div class="card kpi-card">
        <small style="color:var(--muted);font-weight:600">Phiên Bản Triển Khai</small>
        <strong style="font-size:18px;display:block;margin:8px 0 4px" class="mono">v2.4.0-prod</strong>
        <span style="font-size:11.5px;color:var(--muted)">Cập nhật: ${h.lastDeploy}</span>
      </div>
    </div>

    <!-- Bảng Chi Tiết Từng Dịch Vụ -->
    <div class="card" style="padding:20px;margin-bottom:24px">
      <h3 style="margin-top:0;font-size:16px;margin-bottom:14px">${icon("ph-cpu")} Trạng thái các vi dịch vụ cốt lõi</h3>
      <div class="table-wrap" style="border:none">
        <table style="width:100%">
          <thead>
            <tr>
              <th>Tên Dịch Vụ / Phân Hệ</th>
              <th>Độ Trễ Hiện Tại</th>
              <th>Tải Hệ Thống (Load)</th>
              <th>Trạng Thái</th>
              <th>Ghi Chú Kỹ Thuật</th>
            </tr>
          </thead>
          <tbody>
            ${h.services.map(srv => `
              <tr>
                <td><strong>${srv.name}</strong></td>
                <td class="mono">${srv.latency}</td>
                <td class="mono">${srv.load}</td>
                <td><span class="badge success" style="font-size:11px"><i class="ph ph-check"></i> Hoạt động tốt</span></td>
                <td style="font-size:12px;color:var(--muted)">${srv.note}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Nhật Ký Lỗi Kết Nối & Thử Lại (Retry Policy) -->
    <div class="card" style="padding:20px">
      <h3 style="margin-top:0;font-size:16px;margin-bottom:14px">${icon("ph-arrows-split")} Lịch sử lỗi kết nối & Cơ chế thử lại (Retry Backoff)</h3>
      <div class="table-wrap" style="border:none">
        <table style="width:100%">
          <thead>
            <tr>
              <th>Thời Gian</th>
              <th>Dịch Vụ Phát Sinh Lỗi</th>
              <th>Mã Lỗi / Thông Điệp</th>
              <th>Số Lần Thử Lại</th>
              <th>Kết Quả Tự Phục Hồi</th>
            </tr>
          </thead>
          <tbody>
            ${h.connectionErrors.map(err => `
              <tr>
                <td class="mono" style="font-size:12px">${err.timestamp}</td>
                <td><strong>${err.service}</strong></td>
                <td><span class="badge warning mono" style="font-size:11px">${err.error}</span></td>
                <td class="mono">${err.retryCount} lần</td>
                <td style="font-size:12.5px;color:#059669">${err.resolution}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 4. CẤU HÌNH HỆ THỐNG (ADMIN SYSTEM CONFIG)
// --------------------------------------------------------------------------
export function adminSystemConfigScreen() {
  const c = adminState.systemConfig;

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Hệ thống / </span><strong>Cấu hình sàn</strong></div>
        <h1>Cấu Hình Tham Số Nền Tảng (System Parameters)</h1>
        <p>Thiết lập các hằng số quy tắc kinh doanh: thời hạn lưu cookie tiếp thị, thời gian giữ tiền an toàn, thuế và ngưỡng rút.</p>
      </div>
      <div class="actions">
        <button class="btn" data-adm-save-config><i class="ph ph-check"></i> Lưu cấu hình tham số</button>
      </div>
    </header>

    <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px">
      <div class="card" style="padding:22px">
        <h3 style="margin-top:0;font-size:16px;border-bottom:1px solid var(--line);padding-bottom:10px">${icon("ph-sliders")} Tham số Attribution & Thanh Toán</h3>
        
        <form id="adm-config-form" class="form-stack" style="margin-top:16px">
          <div class="field">
            <label>Thời gian lưu vết Cookie Tiếp Thị (Attribution Window)</label>
            <div style="display:flex;gap:10px;align-items:center">
              <input class="input" type="number" id="cfg-cookie-days" value="${c.cookieAttributionDays}" min="1" max="90" style="max-width:140px" />
              <span style="font-size:13px;color:var(--muted)">ngày (Mô hình Last-Click áp dụng trong 30 ngày)</span>
            </div>
          </div>

          <div class="field">
            <label>Thời gian tạm giữ hoa hồng an toàn (Escrow Holding Period)</label>
            <div style="display:flex;gap:10px;align-items:center">
              <input class="input" type="number" id="cfg-escrow-days" value="${c.escrowHoldingDays}" min="7" max="30" style="max-width:140px" />
              <span style="font-size:13px;color:var(--muted)">ngày (Xử lý khiếu nại đổi trả trước khi chuyển ví khả dụng)</span>
            </div>
          </div>

          <div class="field">
            <label>Ngưỡng rút tiền tối thiểu của KOL/CTV</label>
            <div style="display:flex;gap:10px;align-items:center">
              <input class="input" type="number" id="cfg-min-withdraw" value="${c.minWithdrawalAmount}" step="50000" style="max-width:200px" />
              <span style="font-size:13px;color:var(--muted)">VNĐ (Khấu trừ thuế TNCN nếu &ge; 2.000.000 ₫)</span>
            </div>
          </div>

          <div class="field">
            <label>Tỷ lệ khấu trừ thuế TNCN tự động</label>
            <div style="display:flex;gap:10px;align-items:center">
              <input class="input" type="number" id="cfg-tax-pct" value="${c.personalIncomeTaxPct}" disabled style="max-width:120px" />
              <span style="font-size:13px;color:var(--muted)">% (Theo Luật Thuế Thu nhập Cá nhân Việt Nam)</span>
            </div>
          </div>

          <div class="field">
            <label>Chính sách cho phép khách mua hàng không cần tạo tài khoản (Guest Checkout)</label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:6px">
              <input type="checkbox" id="cfg-guest-checkout" ${c.allowGuestCheckout ? 'checked' : ''} />
              <span><strong>Bật Guest Checkout</strong> - Cho phép nhập SĐT và địa chỉ mua ngay không bắt buộc đăng ký.</span>
            </label>
          </div>
        </form>
      </div>

      <div class="card" style="padding:22px">
        <h3 style="margin-top:0;font-size:16px;border-bottom:1px solid var(--line);padding-bottom:10px">${icon("ph-clock-counter-clockwise")} Lịch sử sửa đổi cấu hình</h3>
        <div style="font-size:12.5px;color:var(--muted);margin:12px 0 16px">Cập nhật gần nhất: <strong>${c.lastUpdated}</strong></div>
        
        <div class="stepper" style="display:flex;flex-direction:column;gap:14px">
          <div style="padding:10px 12px;background:var(--surface-2);border-radius:8px">
            <strong>Phiên bản 2.4</strong> <small style="color:var(--muted)">• 05/09/2026</small>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">Điều chỉnh thời gian tạm giữ an toàn thành 14 ngày để bảo vệ vốn đối soát cho Shop.</div>
          </div>
          <div style="padding:10px 12px;background:var(--surface-2);border-radius:8px">
            <strong>Phiên bản 2.3</strong> <small style="color:var(--muted)">• 15/08/2026</small>
            <div style="font-size:12px;color:var(--muted);margin-top:2px">Kích hoạt luồng Guest Checkout kết hợp lưu vết định danh CTV.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// BINDING LOGIC CHO SYSTEM ADMINISTRATOR
// --------------------------------------------------------------------------
export function bindAdmin(root, { toast, go, renderCurrentPage }) {
  // Toggle lock account
  root.querySelectorAll("[data-adm-toggle-lock]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.admToggleLock;
      const acc = adminState.internalAccounts.find(a => a.id === id);
      if (!acc) return;
      if (acc.status === "active") {
        const reason = prompt(`Nhập lý do khóa tài khoản nội bộ "${acc.name}":`, "Rà soát định kỳ bảo mật an ninh.");
        if (reason) {
          acc.status = "locked";
          acc.lockReason = reason;
          toast(`Đã khóa tài khoản nội bộ ${acc.name}. Phiên làm việc đã bị hủy.`);
          renderCurrentPage();
        }
      } else {
        if (confirm(`Xác nhận mở khóa tài khoản cho ${acc.name}?`)) {
          acc.status = "active";
          acc.lockReason = "";
          toast(`Đã mở khóa tài khoản nội bộ ${acc.name}.`);
          renderCurrentPage();
        }
      }
    });
  });

  // Revoke session
  root.querySelectorAll("[data-adm-revoke-session]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.admRevokeSession;
      const acc = adminState.internalAccounts.find(a => a.id === id);
      if (!acc) return;
      if (confirm(`Thu hồi toàn bộ phiên đăng nhập hiện có của nhân sự ${acc.name}?`)) {
        toast(`Đã thu hồi phiên đăng nhập của ${acc.name}. Nhân sự sẽ phải đăng nhập lại.`);
      }
    });
  });

  // Invite Manager
  root.querySelector("[data-adm-invite-manager]")?.addEventListener("click", () => {
    const name = prompt("Họ và tên chuyên viên vận hành mới:", "Đặng Minh Quân");
    if (name) {
      const email = prompt("Email công vụ (@scanms.vn):", "quan.dang@scanms.vn");
      if (email) {
        adminState.internalAccounts.push({
          id: `SM-${Date.now().toString().slice(-4)}`,
          name: name,
          email: email,
          role: "SYSTEM_MANAGER",
          title: "Chuyên viên Thẩm định Shop & Gian hàng",
          status: "active",
          lastLogin: "Chưa đăng nhập",
          ip: "-",
          "2fa": false
        });
        toast(`Đã tạo và gửi thư mời cấp quyền Vận Hành Sàn cho ${name} (${email})!`);
        renderCurrentPage();
      }
    }
  });

  // Save RBAC
  root.querySelector("[data-adm-save-rbac]")?.addEventListener("click", () => {
    if (confirm("Xác nhận cập nhật ma trận phân quyền 5 vai trò hệ thống?")) {
      toast("Đã lưu ma trận phân quyền RBAC thành công và áp dụng cho toàn sàn!");
    }
  });

  // Refresh Health
  root.querySelector("[data-adm-refresh-health]")?.addEventListener("click", () => {
    toast("Đang ping kiểm tra 5 vi dịch vụ...");
    setTimeout(() => {
      toast("Toàn bộ 5/5 dịch vụ hệ thống hoạt động ổn định!");
      renderCurrentPage();
    }, 400);
  });

  // Save Config
  root.querySelector("[data-adm-save-config]")?.addEventListener("click", () => {
    const cookie = root.querySelector("#cfg-cookie-days")?.value;
    const escrow = root.querySelector("#cfg-escrow-days")?.value;
    const minW = root.querySelector("#cfg-min-withdraw")?.value;
    const guest = root.querySelector("#cfg-guest-checkout")?.checked;
    if (cookie) adminState.systemConfig.cookieAttributionDays = Number(cookie);
    if (escrow) adminState.systemConfig.escrowHoldingDays = Number(escrow);
    if (minW) adminState.systemConfig.minWithdrawalAmount = Number(minW);
    adminState.systemConfig.allowGuestCheckout = Boolean(guest);
    adminState.systemConfig.lastUpdated = "Vừa xong bởi Nguyễn Thành Thắng";
    toast("Đã lưu thành công các tham số cấu hình nền tảng!");
    renderCurrentPage();
  });
}

// ==========================================================================
// SCANMS SYSTEM ADMINISTRATOR PROFILE & ROOT SECURITY MODULE
// ==========================================================================
export const adminProfileState = {
  activeTab: 'info', // 'info' | 'privileges' | 'security'
  profile: {
    avatar: 'QT',
    name: 'Nguyễn Thành Thắng',
    adminId: 'ADM-ROOT-01',
    email: 'admin@scanms.vn',
    phone: '0901 888 999',
    title: 'Trưởng ban Quản trị Kỹ thuật & Hạ tầng SCANMS',
    role: 'Master Super Administrator (Root Level)',
    department: 'Khối Công nghệ Thông tin & An toàn Thông tin',
    twoFactorEnabled: true,
    lastLogin: '08/09/2026 22:30:15',
    lastIp: '118.69.12.44 (VNPT Corp Gateway)',
    sessions: [
      { device: 'Chrome 128 trên Windows 11 (Thiết bị này)', ip: '118.69.12.44', location: 'TP. Hồ Chí Minh', active: true, time: 'Đang hoạt động' },
      { device: 'Safari trên macOS Sonoma (Workstation Lab)', ip: '118.69.12.50', location: 'TP. Hồ Chí Minh', active: false, time: 'Hôm qua 18:40' },
      { device: 'SCANMS Admin Mobile (iOS 18)', ip: '14.241.88.19', location: 'TP. Hồ Chí Minh', active: false, time: '06/09/2026 10:15' }
    ]
  }
};

// Khôi phục từ localStorage nếu có
try {
  const saved = localStorage.getItem('scanms_profile_admin');
  if (saved) {
    const parsed = JSON.parse(saved);
    adminProfileState.profile = { ...adminProfileState.profile, ...parsed };
  }
} catch (e) {}

export function adminProfileScreen() {
  // Luôn đồng bộ dữ liệu mới nhất từ localStorage để cập nhật avatar kể cả sau khi đổi role hay F5
  try {
    const saved = localStorage.getItem('scanms_profile_admin');
    if (saved) {
      const parsed = JSON.parse(saved);
      adminProfileState.profile = { ...adminProfileState.profile, ...parsed };
    }
  } catch (e) {}

  const p = adminProfileState.profile;
  const tab = adminProfileState.activeTab;

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Quản trị / </span><strong>Hồ sơ Quản trị viên</strong></div>
        <h1>Hồ Sơ Quản Trị Viên Hệ Thống (Master Admin)</h1>
        <p>Quản lý tài khoản tối cao Root Administrator, khóa xác thực 2FA phần cứng và nhật ký truy cập an ninh.</p>
      </div>
      <div class="actions">
        <span class="badge" style="background:#1e1b4b;color:#a5b4fc;font-weight:750"><i class="ph ph-shield-checkered"></i> ROOT ACCESS</span>
        <span class="badge-kyc-verified"><i class="ph ph-fingerprint"></i> 2FA FIDO2 ACTIVE</span>
      </div>
    </header>

    <div class="profile-view-wrap">
      <!-- Tab Navigation -->
      <div class="profile-tab-nav" role="tablist">
        <button class="profile-tab-btn ${tab === 'info' ? 'active' : ''}" data-admin-tab="info">
          <i class="ph ph-user-gear"></i> Thông tin Quản trị viên
        </button>
        <button class="profile-tab-btn ${tab === 'privileges' ? 'active' : ''}" data-admin-tab="privileges">
          <i class="ph ph-shield-check"></i> Đặc quyền Root & Khóa 2FA
        </button>
        <button class="profile-tab-btn ${tab === 'security' ? 'active' : ''}" data-admin-tab="security">
          <i class="ph ph-lock-key"></i> Mật khẩu Master & Quản lý phiên
        </button>
      </div>

      <!-- Tab 1: Thông tin Quản trị viên -->
      ${tab === 'info' ? `
        <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-user-circle" style="color:var(--brand)"></i> Định danh Quản trị viên Cấp cao
            </h3>

            <div class="profile-avatar-uploader">
              <div class="profile-avatar-uploader-circle" id="admin-avatar-circle-trigger" onclick="document.getElementById('admin-avatar-file')?.click()" style="background:#1e1b4b;color:#a5b4fc;cursor:pointer" title="Click để chọn ảnh từ máy">
                ${p.avatarImg ? `<img src="${p.avatarImg}" alt="${p.name}" />` : p.avatar}
                <div class="profile-avatar-uploader-overlay">
                  <i class="ph ph-camera"></i>
                  <span>Đổi ảnh</span>
                </div>
              </div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                  <strong style="font-size:16px;color:var(--text)">${p.name}</strong>
                  <span class="badge" style="background:#1e1b4b;color:#a5b4fc;font-size:11.5px;font-weight:700">Root Authority (Cấp quyền tối cao)</span>
                </div>
                <span style="font-size:12.5px;color:var(--muted);display:block;margin:3px 0 8px">${p.title} • <strong>ID: ${p.adminId}</strong></span>
                <div class="profile-avatar-actions">
                  <input type="file" id="admin-avatar-file" accept="image/*" style="display:none" />
                  <label for="admin-avatar-file" class="btn small outline" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin:0">
                    <i class="ph ph-upload-simple"></i> Tải ảnh từ máy
                  </label>
                  ${p.avatarImg ? `
                    <button type="button" class="btn small text-danger" id="admin-avatar-remove-btn" style="border:1px solid #fecaca;background:#fef2f2;color:#dc2626;display:inline-flex;align-items:center;gap:6px;cursor:pointer" title="Gỡ ảnh đại diện">
                      <i class="ph ph-trash"></i> Gỡ ảnh
                    </button>
                  ` : ''}
                  <span style="font-size:11.5px;color:var(--muted)">Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 5MB)</span>
                </div>
              </div>
            </div>

            <form id="admin-info-form" class="form-stack">
              <div class="field">
                <label>Họ và tên Quản trị viên *</label>
                <input class="input" id="admin-name" value="${p.name}" required />
              </div>

              <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
                <div class="field">
                  <label>Email Quản trị tối cao (Bất biến)</label>
                  <input class="input" id="admin-email" value="${p.email}" disabled />
                </div>
                <div class="field">
                  <label>Điện thoại khẩn cấp SOC/NOC *</label>
                  <input class="input" id="admin-phone" value="${p.phone}" required />
                </div>
              </div>

              <div class="field">
                <label>Phòng ban / Bộ môn phụ trách</label>
                <input class="input" id="admin-dept" value="${p.department}" required />
              </div>

              <div class="field">
                <label>Chức danh công vụ</label>
                <input class="input" id="admin-title" value="${p.title}" required />
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:14px">
                <button type="submit" class="btn" style="padding:10px 24px;font-weight:750">
                  <i class="ph ph-floppy-disk"></i> Cập nhật hồ sơ Admin
                </button>
              </div>
            </form>
          </div>

          <div style="display:flex;flex-direction:column;gap:18px">
            <div class="card" style="padding:22px">
              <h4 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
                <i class="ph ph-shield-checkered" style="color:#7c3aed"></i> Phạm vi quyền hạn Master Admin
              </h4>
              <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--muted);line-height:1.7">
                <li>Quyền ghi đè ma trận phân quyền <strong>RBAC 5 vai trò</strong>.</li>
                <li>Xem và trích xuất <strong>Nhật ký an ninh Audit Trail</strong> bất biến.</li>
                <li>Quản lý toàn bộ <strong>tham số kỹ thuật & vi dịch vụ</strong> sàn.</li>
                <li>Khóa tài khoản khẩn cấp khi phát hiện gian lận quy mô lớn.</li>
              </ul>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Tab 2: Đặc quyền Root & Khóa 2FA -->
      ${tab === 'privileges' ? `
        <div class="card" style="padding:26px">
          <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
            <i class="ph ph-shield-check" style="color:var(--brand)"></i> Khóa xác thực an ninh 2 lớp (2FA) & Đặc quyền Root
          </h3>

          <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px;margin-top:18px">
            <div style="padding:18px;background:var(--surface-2);border-radius:14px;border:1px solid var(--line)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:8px">
                  <i class="ph ph-fingerprint" style="font-size:24px;color:#15803d"></i>
                  <strong style="font-size:15px;color:var(--text)">Khóa phần cứng FIDO2 / YubiKey</strong>
                </div>
                <span class="badge success">Đã kích hoạt</span>
              </div>
              <p style="font-size:12.5px;color:var(--muted);line-height:1.5;margin:0">
                Yêu cầu chạm khóa bảo mật vật lý mỗi khi đăng nhập vào hệ thống quản trị từ mạng ngoài văn phòng.
              </p>
            </div>

            <div style="padding:18px;background:var(--surface-2);border-radius:14px;border:1px solid var(--line)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div style="display:flex;align-items:center;gap:8px">
                  <i class="ph ph-device-mobile" style="font-size:24px;color:#7c3aed"></i>
                  <strong style="font-size:15px;color:var(--text)">Ứng dụng TOTP (Google Authenticator)</strong>
                </div>
                <span class="badge success">Đã sao lưu</span>
              </div>
              <p style="font-size:12.5px;color:var(--muted);line-height:1.5;margin:0">
                Mã xác thực 6 chữ số thay đổi mỗi 30 giây làm phương thức dự phòng khi không mang khóa vật lý.
              </p>
            </div>
          </div>

          <div style="margin-top:22px;padding:18px;background:#fef2f2;border-radius:14px;border:1px solid #fca5a5;color:#991b1b">
            <h4 style="margin:0 0 6px;font-size:14.5px;font-weight:800;display:flex;align-items:center;gap:8px">
              <i class="ph ph-warning-octagon"></i> Cảnh báo an ninh cấp hệ thống
            </h4>
            <p style="font-size:12.5px;line-height:1.5;margin:0">
              Mọi thao tác chỉnh sửa cấu hình hệ thống, cấp quyền tài khoản hay can thiệp số dư đối soát đều được ghi nhận vĩnh viễn vào bảng Audit Log phục vụ thanh tra an ninh.
            </p>
          </div>
        </div>
      ` : ''}

      <!-- Tab 3: Mật khẩu Master & Quản lý phiên -->
      ${tab === 'security' ? `
        <div class="split" style="grid-template-columns:1fr 1fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-lock-key" style="color:var(--brand)"></i> Đổi mật khẩu Quản trị viên Master
            </h3>
            <form id="admin-pass-form" class="form-stack" style="margin-top:16px">
              <div class="field">
                <label>Mật khẩu quản trị hiện tại *</label>
                <input class="input" type="password" id="adm-cur-pass" placeholder="••••••••" required />
              </div>
              <div class="field">
                <label>Mật khẩu Master mới * (Tối thiểu 10 ký tự, có ký tự đặc biệt)</label>
                <input class="input" type="password" id="adm-new-pass" placeholder="Nhập mật khẩu an ninh cao" required />
              </div>
              <div class="field">
                <label>Xác nhận mật khẩu Master mới *</label>
                <input class="input" type="password" id="adm-confirm-pass" placeholder="Nhập lại mật khẩu mới" required />
              </div>
              <button type="submit" class="btn" style="margin-top:8px;font-weight:750">
                <i class="ph ph-shield-check"></i> Cập nhật mật khẩu Master
              </button>
            </form>
          </div>

          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-desktop" style="color:var(--brand)"></i> Các phiên làm việc an ninh
            </h3>
            <div style="display:flex;flex-direction:column;gap:12px;margin:16px 0">
              ${p.sessions.map(s => `
                <div style="padding:12px 14px;background:var(--surface-2);border-radius:10px;border:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <strong style="font-size:13px;display:block;color:var(--text)">${s.device}</strong>
                    <span style="font-size:12px;color:var(--muted)">IP: ${s.ip} • ${s.location}</span>
                  </div>
                  <span class="badge ${s.active ? 'success' : ''}" style="font-size:11px">${s.time}</span>
                </div>
              `).join('')}
            </div>
            <div style="padding-top:14px;border-top:1px solid var(--line)">
              <button id="btn-adm-revoke-all" class="btn danger small" style="width:100%;font-weight:750">
                <i class="ph ph-shield-slash"></i> Thu hồi toàn bộ phiên đăng nhập ngoại trừ phiên này
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function bindAdminProfile(root, { toast, renderCurrentPage }) {
  // Avatar upload & remove
  const admAvatarCircle = root.querySelector('#admin-avatar-circle-trigger');
  const admAvatarInput = root.querySelector('#admin-avatar-file');
  const admAvatarRemoveBtn = root.querySelector('#admin-avatar-remove-btn');

  if (admAvatarCircle && admAvatarInput) {
    admAvatarCircle.addEventListener('click', () => {
      admAvatarInput.click();
    });
  }

  if (admAvatarInput) {
    admAvatarInput.addEventListener('change', async (e) => {
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
        adminProfileState.profile.avatarImg = compressedBase64;
        safeSaveProfile('scanms_profile_admin', adminProfileState.profile);
        toast?.('Đã đổi ảnh đại diện Quản Trị Viên thành công!', 'success');
        renderCurrentPage();
      } catch (err) {
        console.error('Lỗi khi nén ảnh đại diện admin:', err);
        toast?.('Không thể xử lý ảnh này. Vui lòng chọn ảnh khác!', 'error');
      }
    });
  }

  if (admAvatarRemoveBtn) {
    admAvatarRemoveBtn.addEventListener('click', () => {
      adminProfileState.profile.avatarImg = null;
      safeSaveProfile('scanms_profile_admin', adminProfileState.profile);
      toast?.('Đã gỡ ảnh đại diện, chuyển về chữ cái mặc định!', 'info');
      renderCurrentPage();
    });
  }

  // Chuyển tab
  root.querySelectorAll('[data-admin-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      adminProfileState.activeTab = btn.dataset.adminTab;
      renderCurrentPage();
    });
  });

  // Lưu thông tin Admin
  const infoForm = root.querySelector('#admin-info-form');
  if (infoForm) {
    infoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = root.querySelector('#admin-name')?.value || adminProfileState.profile.name;
      const phone = root.querySelector('#admin-phone')?.value || adminProfileState.profile.phone;
      const dept = root.querySelector('#admin-dept')?.value || adminProfileState.profile.department;
      const title = root.querySelector('#admin-title')?.value || adminProfileState.profile.title;

      adminProfileState.profile = {
        ...adminProfileState.profile,
        name,
        avatar: 'QT',
        phone,
        department: dept,
        title,
      };
      safeSaveProfile('scanms_profile_admin', adminProfileState.profile);
      toast?.('Đã lưu thông tin Quản trị viên Cấp cao thành công!', 'success');
      renderCurrentPage();
    });
  }

  // Đổi mật khẩu
  const passForm = root.querySelector('#admin-pass-form');
  if (passForm) {
    passForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newP = root.querySelector('#adm-new-pass')?.value;
      const confP = root.querySelector('#adm-confirm-pass')?.value;
      if (!newP || newP.length < 8) {
        toast?.('Mật khẩu quản trị an toàn phải có tối thiểu 8 ký tự!', 'error');
        return;
      }
      if (newP !== confP) {
        toast?.('Mật khẩu xác nhận không khớp!', 'error');
        return;
      }
      toast?.('Đã cập nhật mật khẩu Master Administrator thành công!', 'success');
      passForm.reset();
    });
  }

  // Thu hồi phiên
  const btnRevoke = root.querySelector('#btn-adm-revoke-all');
  if (btnRevoke) {
    btnRevoke.addEventListener('click', () => {
      toast?.('Đã thu hồi thành công toàn bộ các phiên làm việc từ xa trên mọi thiết bị!', 'success');
    });
  }
}

