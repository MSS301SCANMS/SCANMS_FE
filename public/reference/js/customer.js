// ==========================================================================
// SCANMS CUSTOMER MODULE (Khu Vực Tài Khoản Khách Mua Hàng)
// ==========================================================================

import { compressAvatarImage, safeSaveProfile } from './image-utils.js';

const icon = (name) => `<i class="ph ${name}" aria-hidden="true"></i>`;
const money = (v) => `${new Intl.NumberFormat("vi-VN").format(v)} ₫`;
const escapeReviewHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let pendingReviewOrderId = null;
let handleReviewCompleted = null;
window.addEventListener('message', event => {
  if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'SCANMS_PRODUCT_REVIEW_SUBMITTED' || event.data.prototypeOrderId !== pendingReviewOrderId) return;
  handleReviewCompleted?.(event.data);
  pendingReviewOrderId = null;
});

export const customerState = {
  profile: {
    id: "CUST-8821",
    name: "Nguyễn Hải Yến",
    email: "haiyen.nguyen@gmail.com",
    emailVerified: true,
    phone: "0903 218 456",
    phoneVerified: true,
    avatar: "Y",
    memberTier: "Thành viên VIP (Hạng Vàng)",
    joinedDate: "12/03/2026",
    ordersCount: 8,
    totalSpent: 3840000
  },

  orders: [
    {
      id: "IN23944",
      date: "08/09/2026 14:15",
      storeName: "Sora Skin Official",
      kolRef: "NHATXINH10 (Trần Văn Nhật)",
      status: "shipping", // 'pending_pay' | 'shipping' | 'delivered' | 'cancelled' | 'returned'
      items: [
        { id: "P01", name: "Serum Vitamin C 15% Dưỡng Sáng Sora Skin", variant: "Dung tích 30ml", qty: 1, price: 459000, img: "./assets/serum-hero-optimized.jpg" }
      ],
      shippingFee: 0,
      discount: 45900,
      totalAmount: 413100,
      paymentMethod: "Chuyển khoản VietQR (Đã thanh toán)",
      shippingCarrier: "Giao Hàng Nhanh (GHN Express)",
      trackingCode: "GHN88291024VN",
      shippingAddress: "Số 24 ngõ 168 Hào Nam, Phường Ô Chợ Dừa, Đống Đa, Hà Nội",
      timeline: [
        { time: "08/09 14:15", title: "Đặt hàng thành công", desc: "Đơn hàng đã được xác nhận thanh toán qua VietQR." },
        { time: "08/09 16:30", title: "Shop đã đóng gói", desc: "Kiện hàng đã bàn giao cho shipper GHN Express." },
        { time: "08/09 19:45", title: "Đang vận chuyển liên tỉnh", desc: "Kiện hàng đã rời kho phân loại trung tâm Hà Nội." }
      ]
    },
    {
      id: "IN23845",
      date: "28/08/2026 10:20",
      storeName: "Sora Skin Official",
      kolRef: "NHATXINH10 (Trần Văn Nhật)",
      status: "delivered",
      items: [
        { id: "P01", name: "Serum Vitamin C 15% Dưỡng Sáng Sora Skin", variant: "Dung tích 50ml", qty: 1, price: 689000, img: "./assets/serum-hero-optimized.jpg" }
      ],
      shippingFee: 0,
      discount: 50000,
      totalAmount: 639000,
      paymentMethod: "Thanh toán khi nhận hàng (COD)",
      shippingCarrier: "Giao Hàng Tiết Kiệm (GHTK)",
      trackingCode: "GHTK19827411VN",
      shippingAddress: "Số 24 ngõ 168 Hào Nam, Phường Ô Chợ Dừa, Đống Đa, Hà Nội",
      deliveredAt: "30/08/2026 15:40",
      reviewed: true,
      timeline: [
        { time: "28/08 10:20", title: "Đặt hàng thành công", desc: "Hình thức thanh toán: COD đồng kiểm." },
        { time: "29/08 08:30", title: "Đang giao hàng", desc: "Shipper đang trên đường phát kiện hàng." },
        { time: "30/08 15:40", title: "Giao hàng thành công", desc: "Người nhận đã ký nhận và thanh toán 639.000 ₫." }
      ]
    },
    {
      id: "IN23712",
      date: "15/08/2026 09:00",
      storeName: "Gia Dụng Thông Minh ZenHome",
      kolRef: "TUANREVIEW (Tuấn Lifestyle)",
      status: "delivered",
      items: [
        { id: "P05", name: "Bình giữ nhiệt phong cách Bắc Âu 500ml", variant: "Màu Trắng Kem", qty: 2, price: 280000, img: "./assets/serum-hero-optimized.jpg" }
      ],
      shippingFee: 25000,
      discount: 30000,
      totalAmount: 555000,
      paymentMethod: "Thanh toán VietQR",
      shippingCarrier: "Viettel Post",
      trackingCode: "VTP9912048VN",
      shippingAddress: "Số 24 ngõ 168 Hào Nam, Phường Ô Chợ Dừa, Đống Đa, Hà Nội",
      deliveredAt: "17/08/2026 11:15",
      reviewed: false, // Eligible for review!
      timeline: [
        { time: "15/08 09:00", title: "Đặt hàng thành công", desc: "Đơn hàng đã được xác nhận." },
        { time: "17/08 11:15", title: "Giao hàng thành công", desc: "Kiện hàng đã được giao an toàn." }
      ]
    },
    {
      id: "IN23501",
      date: "02/08/2026 21:10",
      storeName: "Thời Trang Thiết Kế Aura Studio",
      kolRef: "AURA10",
      status: "cancelled",
      items: [
        { id: "P09", name: "Váy Linen Dáng Xòe Cổ V Cao Cấp", variant: "Size M / Be", qty: 1, price: 520000, img: "./assets/serum-hero-optimized.jpg" }
      ],
      shippingFee: 0,
      discount: 52000,
      totalAmount: 468000,
      paymentMethod: "COD",
      shippingCarrier: "GHN Express",
      shippingAddress: "Số 24 ngõ 168 Hào Nam, Phường Ô Chợ Dừa, Đống Đa, Hà Nội",
      cancelReason: "Khách hàng đổi ý muốn chọn lại màu sắc khác.",
      timeline: [
        { time: "02/08 21:10", title: "Tạo đơn hàng", desc: "Đơn hàng chờ xác nhận." },
        { time: "02/08 22:00", title: "Đã hủy theo yêu cầu khách", desc: "Lý do: Khách hàng đổi ý." }
      ]
    }
  ],

  addresses: [
    {
      id: "ADDR-1",
      isDefault: true,
      label: "Nhà riêng",
      receiverName: "Nguyễn Hải Yến",
      phone: "0903 218 456",
      province: "Hà Nội",
      district: "Quận Đống Đa",
      ward: "Phường Ô Chợ Dừa",
      street: "Số 24 ngõ 168 Hào Nam"
    },
    {
      id: "ADDR-2",
      isDefault: false,
      label: "Văn phòng công ty",
      receiverName: "Nguyễn Hải Yến",
      phone: "0903 218 456",
      province: "Hà Nội",
      district: "Quận Cầu Giấy",
      ward: "Phường Dịch Vọng",
      street: "Tầng 6, Tòa nhà FPT Tower, số 10 Phạm Văn Bạch"
    }
  ],

  wishlist: [
    {
      id: "P01",
      name: "Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Sora Skin",
      brand: "Sora Skin Official",
      price: 459000,
      origPrice: 520000,
      img: "./assets/serum-hero-optimized.jpg",
      inStock: true,
      kolDeal: "Giảm 10% qua mã NHATXINH10"
    },
    {
      id: "P02",
      name: "Kem Chống Nắng Quang Phổ Rộng SPF50+ Ultra Light",
      brand: "Sora Skin Official",
      price: 380000,
      origPrice: 420000,
      img: "./assets/toner-bha-product.jpg",
      inStock: true,
      kolDeal: "Tặng kèm mẫu thử Serum 5ml"
    },
    {
      id: "P03",
      name: "Nồi Chiên Không Dầu Điện Tử 6L ZenHome",
      brand: "ZenHome",
      price: 1450000,
      origPrice: 1890000,
      img: "./assets/cleanser-product.jpg",
      inStock: false, // Hết hàng
      kolDeal: "Tạm hết hàng - Bật thông báo khi có hàng"
    }
  ],

  reviews: [
    {
      orderId: "IN23845",
      productName: "Serum Vitamin C 15% Dưỡng Sáng Sora Skin",
      rating: 5,
      date: "31/08/2026",
      comment: "Mua qua link giới thiệu của bạn Nhật được giảm 10% hời dã man! Serum thấm nhanh không bị vàng da, da sáng hơn sau 2 tuần dùng.",
      images: ["./assets/serum-hero-optimized.jpg"],
      shopReply: "Cảm ơn bạn Hải Yến đã tin tưởng lựa chọn Sora Skin và ủng hộ đối tác KOL của shop ạ!"
    }
  ],

  supportTickets: [
    {
      id: "TICK-701",
      orderId: "IN23944",
      subject: "Hỏi về thời gian giao hàng dự kiến tại Đống Đa",
      status: "resolved", // 'pending' | 'in_progress' | 'resolved'
      createdAt: "08/09 15:00",
      messages: [
        { sender: "customer", text: "Shop ơi đơn này chiều mai mình nhận kịp trước khi đi công tác không ạ?", time: "08/09 15:00" },
        { sender: "support", text: "Chào bạn Hải Yến, kiện hàng đã xuất kho HN nên dự kiến trưa mai 09/09 shipper GHN sẽ giao tới bạn nhé!", time: "08/09 15:20" }
      ]
    }
  ],

  activeOrderTab: "all",
  selectedOrderDetailId: null
};

// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// 1. TÀI KHOẢN CỦA TÔI (CUSTOMER PROFILE)
// --------------------------------------------------------------------------
try {
  const saved = localStorage.getItem('scanms_profile_customer');
  if (saved) {
    const parsed = JSON.parse(saved);
    customerState.profile = { ...customerState.profile, ...parsed };
  }
} catch (e) {}

if (!customerState.activeProfileTab) {
  customerState.activeProfileTab = 'info';
}

export function customerProfileScreen() {
  // Luôn đồng bộ dữ liệu mới nhất từ localStorage để cập nhật avatar kể cả sau khi đổi role hay F5
  try {
    const saved = localStorage.getItem('scanms_profile_customer');
    if (saved) {
      const parsed = JSON.parse(saved);
      customerState.profile = { ...customerState.profile, ...parsed };
    }
  } catch (e) {}

  const p = customerState.profile;
  const tab = customerState.activeProfileTab;

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Khách hàng / </span><strong>Tài khoản của tôi</strong></div>
        <h1>Hồ Sơ Tài Khoản Khách Hàng VIP</h1>
        <p>Quản lý thông tin cá nhân, sổ địa chỉ nhận hàng, hạng hội viên SCANMS Club và bảo mật tài khoản.</p>
      </div>
      <div class="actions">
        <span class="badge warning" style="font-size:12px;font-weight:750"><i class="ph ph-crown"></i> ${p.memberTier}</span>
        <button class="btn secondary" data-cust-goto="storefront"><i class="ph ph-shopping-bag"></i> Mua sắm ngay</button>
      </div>
    </header>

    <div class="profile-view-wrap">
      <!-- Tab Navigation -->
      <div class="profile-tab-nav" role="tablist">
        <button class="profile-tab-btn ${tab === 'info' ? 'active' : ''}" data-cust-profile-tab="info">
          <i class="ph ph-user"></i> Thông tin cá nhân
        </button>
        <button class="profile-tab-btn ${tab === 'addresses' ? 'active' : ''}" data-cust-profile-tab="addresses">
          <i class="ph ph-map-pin"></i> Sổ địa chỉ nhận hàng (${customerState.addresses.length})
        </button>
        <button class="profile-tab-btn ${tab === 'club' ? 'active' : ''}" data-cust-profile-tab="club">
          <i class="ph ph-gift"></i> SCANMS Club & Ưu đãi
        </button>
        <button class="profile-tab-btn ${tab === 'security' ? 'active' : ''}" data-cust-profile-tab="security">
          <i class="ph ph-lock-key"></i> Đổi mật khẩu & Bảo mật
        </button>
      </div>

      <!-- Tab 1: Thông tin cá nhân -->
      ${tab === 'info' ? `
        <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-user-circle" style="color:var(--brand)"></i> Thông tin cá nhân & Liên hệ
            </h3>

            <div class="profile-avatar-uploader">
              <div class="profile-avatar-uploader-circle" id="cust-avatar-circle-trigger" onclick="document.getElementById('cust-avatar-file')?.click()" style="background:#fef3c7;color:#b45309;cursor:pointer" title="Click để chọn ảnh từ máy">
                ${p.avatarImg ? `<img src="${p.avatarImg}" alt="${p.name}" />` : (p.avatar || 'Y')}
                <div class="profile-avatar-uploader-overlay">
                  <i class="ph ph-camera"></i>
                  <span>Đổi ảnh</span>
                </div>
              </div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                  <strong style="font-size:16px;color:var(--text)">${p.name}</strong>
                  <span class="badge-kyc-verified"><i class="ph ph-check-circle"></i> SĐT & Email đã xác thực</span>
                </div>
                <span style="font-size:12.5px;color:var(--muted);display:block;margin:3px 0 8px">${p.memberTier} • Thành viên từ: ${p.joinedDate}</span>
                <div class="profile-avatar-actions">
                  <input type="file" id="cust-avatar-file" accept="image/*" style="display:none" />
                  <label for="cust-avatar-file" class="btn small outline" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin:0">
                    <i class="ph ph-upload-simple"></i> Tải ảnh từ máy
                  </label>
                  ${p.avatarImg ? `
                    <button type="button" class="btn small text-danger" id="cust-avatar-remove-btn" style="border:1px solid #fecaca;background:#fef2f2;color:#dc2626;display:inline-flex;align-items:center;gap:6px;cursor:pointer" title="Gỡ ảnh đại diện">
                      <i class="ph ph-trash"></i> Gỡ ảnh
                    </button>
                  ` : ''}
                  <span style="font-size:11.5px;color:var(--muted)">Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 5MB)</span>
                </div>
              </div>
            </div>

            <form id="cust-profile-form" class="form-stack">
              <div class="field">
                <label>Họ và tên khách hàng *</label>
                <input class="input" id="cust-name-input" value="${p.name}" required />
              </div>

              <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
                <div class="field">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <label>Địa chỉ Email *</label>
                    <span style="font-size:11.5px;color:#059669;font-weight:600"><i class="ph ph-check-circle"></i> Đã xác minh</span>
                  </div>
                  <input class="input" id="cust-email-input" value="${p.email}" required />
                </div>
                <div class="field">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <label>Số điện thoại *</label>
                    <span style="font-size:11.5px;color:#059669;font-weight:600"><i class="ph ph-check-circle"></i> OTP Verified</span>
                  </div>
                  <input class="input" id="cust-phone-input" value="${p.phone}" required />
                </div>
              </div>

              <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
                <div class="field">
                  <label>Ngày sinh</label>
                  <input class="input" type="date" id="cust-dob" value="${p.dob || '1996-08-20'}" />
                </div>
                <div class="field">
                  <label>Giới tính</label>
                  <select class="select" id="cust-gender">
                    <option value="female" ${p.gender === 'female' ? 'selected' : ''}>Nữ</option>
                    <option value="male" ${p.gender === 'male' ? 'selected' : ''}>Nam</option>
                    <option value="other" ${p.gender === 'other' ? 'selected' : ''}>Khác</option>
                  </select>
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:14px">
                <button type="submit" class="btn" style="padding:10px 24px;font-weight:750">
                  <i class="ph ph-floppy-disk"></i> Lưu hồ sơ khách hàng
                </button>
              </div>
            </form>
          </div>

          <div style="display:flex;flex-direction:column;gap:18px">
            <div class="card" style="padding:22px">
              <h4 style="margin:0 0 12px;font-size:15px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
                <i class="ph ph-chart-pie" style="color:var(--brand)"></i> Tóm tắt mua sắm
              </h4>
              <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
                <div style="padding:14px;background:var(--surface-2);border-radius:10px">
                  <small style="color:var(--muted)">Đơn hàng đã đặt</small>
                  <strong style="font-size:22px;display:block;margin-top:4px;color:var(--text)">${p.ordersCount} đơn</strong>
                  <span style="font-size:11.5px;color:#059669"><i class="ph ph-check"></i> 100% hoàn thành</span>
                </div>
                <div style="padding:14px;background:var(--surface-2);border-radius:10px">
                  <small style="color:var(--muted)">Tổng chi tiêu</small>
                  <strong style="font-size:20px;display:block;margin-top:4px;color:var(--brand)">${money(p.totalSpent)}</strong>
                  <span style="font-size:11.5px;color:var(--muted)">Tiết kiệm ~${money(420000)}</span>
                </div>
              </div>
            </div>

            <div class="card" style="padding:22px">
              <h4 style="margin:0 0 10px;font-size:15px;font-weight:800;color:var(--text);display:flex;align-items:center;gap:8px">
                <i class="ph ph-shield-check" style="color:#15803d"></i> Bảo đảm mua hàng chính hãng
              </h4>
              <p style="font-size:13px;color:var(--muted);line-height:1.6;margin:0">
                Mọi đơn hàng mua qua link tiếp thị KOL hoặc trên sàn SCANMS đều được lưu vết minh bạch, hỗ trợ đổi trả miễn phí trong 14 ngày.
              </p>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Tab 2: Sổ địa chỉ nhận hàng -->
      ${tab === 'addresses' ? `
        <div class="card" style="padding:26px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--line);padding-bottom:12px">
            <h3 style="margin:0;font-size:17px;font-weight:800;color:var(--text)">
              <i class="ph ph-map-pin" style="color:var(--brand)"></i> Danh sách địa chỉ nhận hàng
            </h3>
            <button class="btn small" data-cust-goto="customer-addresses"><i class="ph ph-plus"></i> Thêm địa chỉ mới</button>
          </div>

          <div style="display:flex;flex-direction:column;gap:14px">
            ${customerState.addresses.map(a => `
              <div style="padding:16px;border:1.5px solid ${a.isDefault ? 'var(--brand)' : 'var(--line)'};border-radius:12px;background:var(--surface-2);display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                    <strong style="font-size:14.5px;color:var(--text)">${a.receiverName || a.recipient || 'Khách hàng'}</strong>
                    <span style="font-size:13px;color:var(--muted)">(${a.phone})</span>
                    ${a.isDefault ? '<span class="badge success" style="font-size:10.5px">Mặc định</span>' : ''}
                    <span class="badge" style="font-size:10.5px">${a.label || a.tag || 'Địa chỉ'}</span>
                  </div>
                  <div style="font-size:13px;color:var(--muted);line-height:1.5">${a.street ? `${a.street}, ${a.ward}, ${a.district}, ${a.province}` : a.address}</div>
                </div>
                <div style="display:flex;gap:8px">
                  <button class="btn small secondary" data-cust-goto="customer-addresses"><i class="ph ph-pencil"></i> Sửa</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Tab 3: SCANMS Club & Ưu đãi -->
      ${tab === 'club' ? `
        <div class="split" style="grid-template-columns:1fr 1fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-crown" style="color:#d97706"></i> Hạng hội viên: Customer VIP (Gold)
            </h3>
            <div style="margin:16px 0;padding:18px;background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);border-radius:14px;color:#78350f">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-size:12.5px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase">SCANMS CLUB REWARDS</span>
                <i class="ph ph-sparkle" style="font-size:24px"></i>
              </div>
              <div style="font-size:28px;font-weight:850;margin-bottom:6px">2,450 Xu</div>
              <small style="font-size:12px;opacity:0.9">Tương đương 245.000 ₫ giảm giá trực tiếp cho đơn tiếp theo.</small>
            </div>
            <h4 style="font-size:14px;font-weight:750;color:var(--text);margin:16px 0 8px">Đặc quyền hạng Vàng của bạn</h4>
            <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--muted);line-height:1.7">
              <li>Giảm thêm <strong>5%</strong> trên toàn bộ sản phẩm Mall khi mua qua link KOL.</li>
              <li>Miễn phí vận chuyển toàn quốc cho đơn từ <strong>300.000 ₫</strong>.</li>
              <li>Đặc quyền ưu tiên đổi trả hàng trong vòng <strong>14 ngày</strong> không cần lý do.</li>
            </ul>
          </div>

          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-ticket" style="color:var(--brand)"></i> Voucher độc quyền đang có
            </h3>
            <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
              <div style="padding:14px;background:var(--surface-2);border-radius:10px;border:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">
                <div>
                  <strong style="font-size:14px;color:var(--brand)">KOLVIP50K</strong>
                  <div style="font-size:12px;color:var(--muted)">Giảm 50.000 ₫ đơn từ 400.000 ₫</div>
                </div>
                <button class="btn small" data-cust-goto="storefront">Dùng ngay</button>
              </div>
              <div style="padding:14px;background:var(--surface-2);border-radius:10px;border:1px solid var(--line);display:flex;justify-content:space-between;align-items:center">
                <div>
                  <strong style="font-size:14px;color:var(--brand)">FREESHIPMAX</strong>
                  <div style="font-size:12px;color:var(--muted)">Miễn phí vận chuyển toàn quốc</div>
                </div>
                <button class="btn small" data-cust-goto="storefront">Dùng ngay</button>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Tab 4: Đổi mật khẩu & Bảo mật -->
      ${tab === 'security' ? `
        <div class="split" style="grid-template-columns:1fr 1fr;gap:20px">
          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-lock-key" style="color:var(--brand)"></i> Đổi mật khẩu tài khoản
            </h3>
            <form id="cust-pass-form" class="form-stack" style="margin-top:16px">
              <div class="field">
                <label>Mật khẩu hiện tại *</label>
                <input class="input" type="password" id="cust-cur-pass" placeholder="••••••••" required />
              </div>
              <div class="field">
                <label>Mật khẩu mới * (Tối thiểu 8 ký tự)</label>
                <input class="input" type="password" id="cust-new-pass" placeholder="Nhập mật khẩu mới" required />
              </div>
              <div class="field">
                <label>Xác nhận mật khẩu mới *</label>
                <input class="input" type="password" id="cust-confirm-pass" placeholder="Nhập lại mật khẩu mới" required />
              </div>
              <button type="submit" class="btn" style="margin-top:8px;font-weight:750">
                <i class="ph ph-shield-check"></i> Cập nhật mật khẩu
              </button>
            </form>
          </div>

          <div class="card" style="padding:26px">
            <h3 style="margin-top:0;font-size:17px;font-weight:800;border-bottom:1px solid var(--line);padding-bottom:12px;color:var(--text)">
              <i class="ph ph-shield" style="color:var(--brand)"></i> Bảo mật tài khoản
            </h3>
            <div style="margin:16px 0;padding:14px;background:var(--surface-2);border-radius:10px;border:1px solid var(--line)">
              <small style="color:var(--muted);display:block;margin-bottom:4px">Đăng nhập gần nhất: <strong>08/09/2026 14:15</strong></small>
              <div style="font-size:12px;color:var(--muted)">Thiết bị: <strong>Chrome trên Windows (Hà Nội, VN)</strong></div>
            </div>
            <button id="btn-cust-logout-others" class="btn secondary danger small" style="width:100%;font-weight:750">
              <i class="ph ph-sign-out"></i> Đăng xuất phiên làm việc khác
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// --------------------------------------------------------------------------
// 2. ĐƠN HÀNG CỦA TÔI (CUSTOMER ORDERS)
// --------------------------------------------------------------------------
export function customerOrdersScreen() {
  const tab = customerState.activeOrderTab;
  const filtered = customerState.orders.filter(o => {
    if (tab === "all") return true;
    return o.status === tab;
  });

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Khách hàng / </span><strong>Đơn hàng của tôi</strong></div>
        <h1>Đơn Hàng Của Tôi</h1>
        <p>Theo dõi tiến trình vận chuyển, xem chi tiết hóa đơn, gửi yêu cầu đổi trả hoặc đánh giá sản phẩm.</p>
      </div>
      <div class="actions">
        <label class="search" style="margin:0">${icon("ph-magnifying-glass")}<input class="input" placeholder="Tìm mã đơn hàng (VD: IN23944)..." id="cust-order-search" /></label>
      </div>
    </header>

    <!-- Tabs Trạng Thái Đơn Hàng Chuẩn E-Commerce -->
    <div class="toolbar" style="margin-bottom:18px">
      <div class="segmented" style="margin:0">
        <button class="${tab === 'all' ? 'active' : ''}" data-cust-order-tab="all">Tất cả (${customerState.orders.length})</button>
        <button class="${tab === 'shipping' ? 'active' : ''}" data-cust-order-tab="shipping">Đang vận chuyển (${customerState.orders.filter(o => o.status === 'shipping').length})</button>
        <button class="${tab === 'delivered' ? 'active' : ''}" data-cust-order-tab="delivered">Đã giao (${customerState.orders.filter(o => o.status === 'delivered').length})</button>
        <button class="${tab === 'cancelled' ? 'active' : ''}" data-cust-order-tab="cancelled">Đã hủy (${customerState.orders.filter(o => o.status === 'cancelled').length})</button>
      </div>
    </div>

    <!-- Danh Sách Card Đơn Hàng -->
    <div style="display:flex;flex-direction:column;gap:16px">
      ${filtered.length > 0 ? filtered.map(order => `
        <div class="card" style="padding:20px;border-radius:12px">
          <!-- Header Card: Shop, Trạng thái -->
          <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--line);margin-bottom:14px">
            <div style="display:flex;align-items:center;gap:10px">
              <i class="ph ph-storefront" style="color:var(--brand);font-size:20px"></i>
              <strong>${order.storeName}</strong>
              <span style="font-size:12px;color:var(--muted)">• Mã đơn: <strong class="mono" style="color:var(--text)">${order.id}</strong></span>
              <span style="font-size:11.5px;background:var(--brand-soft);color:var(--brand-strong);padding:2px 8px;border-radius:6px">
                KOL: ${order.kolRef}
              </span>
              <span class="badge" style="background:#fef3c7;color:#92400e;font-size:10.5px;padding:2px 7px;border-radius:6px">
                <i class="ph ph-shield-check"></i> Đổi trả & Escrow 14 ngày
              </span>
            </div>
            <div>
              ${renderOrderStatusBadge(order.status)}
            </div>
          </div>

          <!-- Body Card: Danh sách sản phẩm trong đơn -->
          <div style="display:flex;flex-direction:column;gap:12px">
            ${order.items.map(it => `
              <div style="display:flex;justify-content:space-between;align-items:center;gap:14px">
                <div style="display:flex;align-items:center;gap:12px">
                  <img src="${it.img}" alt="${it.name}" style="width:54px;height:54px;border-radius:8px;object-fit:cover;border:1px solid var(--line)" />
                  <div>
                    <strong style="font-size:14px;display:block">${it.name}</strong>
                    <small style="color:var(--muted)">Phân loại: ${it.variant} • Số lượng: x${it.qty}</small>
                  </div>
                </div>
                <div style="text-align:right">
                  <strong style="font-size:14.5px">${money(it.price)}</strong>
                </div>
              </div>
            `).join("")}
          </div>

          <!-- Footer Card: Tổng tiền & Nút hành động -->
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid var(--line);margin-top:14px">
            <div>
              <small style="color:var(--muted)">Thời gian đặt: ${order.date}</small>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">Đơn vị giao: <strong>${order.shippingCarrier}</strong> (${order.trackingCode || 'Đang cập nhật mã'})</div>
            </div>
            <div style="display:flex;align-items:center;gap:14px">
              <div>
                <span style="font-size:12.5px;color:var(--muted)">Tổng thanh toán:</span>
                <strong style="font-size:18px;color:var(--brand);margin-left:6px">${money(order.totalAmount)}</strong>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn small secondary" data-cust-view-order="${order.id}">Chi tiết</button>
                ${order.status === 'shipping' ? `
                  <button class="btn small" data-cust-track-order="${order.id}"><i class="ph ph-map-pin"></i> Theo dõi</button>
                  <button class="btn small secondary" data-cust-cancel-order="${order.id}" style="color:#dc2626">Hủy đơn</button>
                ` : ''}
                ${order.status === 'delivered' ? `
                  ${!order.reviewed ? `<button class="btn small" data-cust-review-order="${order.id}"><i class="ph ph-star"></i> Đánh giá</button>` : `<span class="badge success" style="font-size:11px"><i class="ph ph-check"></i> Đã đánh giá</span>`}
                  <button class="btn small secondary" data-cust-return-order="${order.id}">Đổi trả / Hỗ trợ</button>
                  <button class="btn small secondary" data-cust-reorder="${order.id}">Mua lại</button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `).join("") : `
        <div class="card" style="text-align:center;padding:48px;color:var(--muted)">
          <i class="ph ph-receipt" style="font-size:40px;display:block;margin-bottom:12px;color:var(--muted)"></i>
          <h3 style="margin:0;font-size:16px;color:var(--text)">Chưa có đơn hàng nào ở trạng thái này</h3>
          <p style="font-size:13px;margin:6px 0 16px">Khám phá các sản phẩm hot đang được các KOL/KOC ưu đãi ngay hôm nay!</p>
          <button class="btn" data-cust-goto="storefront"><i class="ph ph-shopping-bag"></i> Mua sắm ngay</button>
        </div>
      `}
    </div>
  `;
}

function renderOrderStatusBadge(status) {
  switch (status) {
    case "shipping":
      return `<span class="badge info" style="background:#e0e7ff;color:#4f46e5;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600"><i class="ph ph-truck"></i> Đang vận chuyển</span>`;
    case "delivered":
      return `<span class="badge success" style="background:#d1fae5;color:#059669;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600"><i class="ph ph-check-circle"></i> Giao thành công</span>`;
    case "cancelled":
      return `<span class="badge danger" style="background:#fee2e2;color:#dc2626;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600"><i class="ph ph-x-circle"></i> Đã hủy đơn</span>`;
    case "returned":
      return `<span class="badge warning" style="background:#fef3c7;color:#d97706;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600"><i class="ph ph-arrow-u-down-left"></i> Đổi trả hàng</span>`;
    default:
      return `<span class="badge neutral">${status}</span>`;
  }
}

// --------------------------------------------------------------------------
// 3. CHI TIẾT ĐƠN HÀNG (CUSTOMER ORDER DETAIL)
// --------------------------------------------------------------------------
export function customerOrderDetailScreen() {
  const orderId = customerState.selectedOrderDetailId || "IN23944";
  const order = customerState.orders.find(o => o.id === orderId) || customerState.orders[0];

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Khách hàng / </span><a href="#customer-orders" style="color:var(--brand);text-decoration:none">Đơn hàng của tôi</a> / <strong>${order.id}</strong></div>
        <h1>Chi Tiết Đơn Hàng: ${order.id}</h1>
        <p>Thông tin kiện hàng, chi phí đối soát, mã giảm giá tiếp thị và hành trình giao nhận.</p>
      </div>
      <div class="actions">
        <button class="btn secondary" data-cust-goto="customer-orders">&larr; Quay lại danh sách</button>
      </div>
    </header>

    <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px">
      <!-- Cột Trái: Sản phẩm & Thanh toán -->
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="card" style="padding:22px">
          <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--line);margin-bottom:14px">
            <div>
              <strong style="font-size:16px">${order.storeName}</strong>
              <small style="color:var(--muted);display:block">Mã giảm giá KOL đã áp dụng: <strong>${order.kolRef}</strong></small>
            </div>
            ${renderOrderStatusBadge(order.status)}
          </div>

          <div style="display:flex;flex-direction:column;gap:14px">
            ${order.items.map(it => `
              <div style="display:flex;justify-content:space-between;align-items:center;gap:14px">
                <div style="display:flex;align-items:center;gap:12px">
                  <img src="${it.img}" alt="${it.name}" style="width:58px;height:58px;border-radius:8px;object-fit:cover;border:1px solid var(--line)" />
                  <div>
                    <strong style="font-size:14.5px;display:block">${it.name}</strong>
                    <small style="color:var(--muted)">Phân loại: ${it.variant}</small>
                    <div style="font-size:12px;color:var(--muted)">Số lượng: x${it.qty}</div>
                  </div>
                </div>
                <strong style="font-size:15px">${money(it.price * it.qty)}</strong>
              </div>
            `).join("")}
          </div>

          <!-- Chi tiết bảng tiền -->
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px;font-size:13.5px">
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--muted)">Tổng tiền hàng:</span>
              <strong>${money(order.items.reduce((acc, it) => acc + (it.price * it.qty), 0))}</strong>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--muted)">Phí vận chuyển:</span>
              <span>${order.shippingFee > 0 ? money(order.shippingFee) : '<span style="color:#059669;font-weight:600">Miễn phí vận chuyển</span>'}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--muted)">Giảm giá qua KOL (${order.kolRef}):</span>
              <strong style="color:#059669">-${money(order.discount)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:16px;padding-top:10px;border-top:1px dashed var(--line);margin-top:4px">
              <strong>Thành tiền thanh toán:</strong>
              <strong style="color:var(--brand)">${money(order.totalAmount)}</strong>
            </div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">
              Phương thức: <strong>${order.paymentMethod}</strong>
            </div>
          </div>
        </div>

        <div class="card" style="padding:22px">
          <h3 style="margin-top:0;font-size:15px;border-bottom:1px solid var(--line);padding-bottom:10px">
            ${icon("ph-map-pin")} Địa chỉ nhận hàng
          </h3>
          <div style="font-size:13.5px;line-height:1.5;margin-top:10px">
            <strong>${customerState.profile.name}</strong> • ${customerState.profile.phone}
            <div style="color:var(--muted);margin-top:2px">${order.shippingAddress}</div>
          </div>
        </div>
      </div>

      <!-- Cột Phải: Tiến trình giao nhận (Timeline) -->
      <div class="card" style="padding:22px">
        <h3 style="margin-top:0;font-size:16px;border-bottom:1px solid var(--line);padding-bottom:10px">
          ${icon("ph-truck")} Tiến trình vận chuyển
        </h3>
        <div style="font-size:12.5px;color:var(--muted);margin:10px 0 16px">
          Đơn vị: <strong>${order.shippingCarrier}</strong> • Mã vận đơn: <strong class="mono">${order.trackingCode}</strong>
        </div>

        <div class="stepper" style="display:flex;flex-direction:column;gap:18px">
          ${order.timeline ? order.timeline.map((step, idx) => `
            <div style="display:flex;gap:12px;align-items:flex-start">
              <span style="background:#059669;color:#fff;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:12px">
                <i class="ph ph-check"></i>
              </span>
              <div>
                <strong style="font-size:13px">${step.title}</strong>
                <div style="font-size:12px;color:var(--muted);margin-top:1px">${step.desc}</div>
                <small class="mono" style="color:var(--muted);font-size:11px">${step.time}</small>
              </div>
            </div>
          `).join("") : ''}
        </div>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:10px">
          <button class="btn secondary" data-cust-support-order="${order.id}"><i class="ph ph-chat-circle-dots"></i> Yêu cầu hỗ trợ đơn này</button>
          ${order.status === 'shipping' ? `<button class="btn danger" data-cust-cancel-order="${order.id}">Hủy đơn hàng</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 4. SỔ ĐỊA CHỈ (CUSTOMER ADDRESSES)
// --------------------------------------------------------------------------
export function customerAddressesScreen() {
  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Khách hàng / </span><strong>Sổ địa chỉ</strong></div>
        <h1>Sổ Địa Chỉ Nhận Hàng</h1>
        <p>Quản lý các địa chỉ giao hàng để tự động điền nhanh khi thanh toán giỏ hàng (Guest/Member Checkout).</p>
      </div>
      <div class="actions">
        <button class="btn" data-cust-add-address><i class="ph ph-plus"></i> Thêm địa chỉ mới</button>
      </div>
    </header>

    <div class="grid" style="grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:16px">
      ${customerState.addresses.map(addr => `
        <div class="card" style="padding:20px;position:relative;border:${addr.isDefault ? '2px solid var(--brand)' : '1px solid var(--line)'}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:8px">
              <strong style="font-size:15px">${addr.receiverName}</strong>
              <span style="color:var(--muted)">| ${addr.phone}</span>
            </div>
            ${addr.isDefault ? `<span class="badge" style="background:var(--brand-soft);color:var(--brand-strong);font-weight:700;font-size:11px">MẶC ĐỊNH</span>` : ''}
          </div>

          <span class="badge neutral" style="font-size:11.5px;margin-bottom:10px"><i class="ph ph-tag"></i> ${addr.label}</span>

          <div style="font-size:13.5px;color:var(--muted);line-height:1.5;margin-bottom:16px">
            ${addr.street}, ${addr.ward}, ${addr.district}, ${addr.province}
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--line)">
            <div>
              ${!addr.isDefault ? `<button class="text-btn" data-cust-set-default-addr="${addr.id}" style="font-size:12px">Thiết lập mặc định</button>` : '<span style="font-size:12px;color:var(--muted)">Địa chỉ ưu tiên</span>'}
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn small secondary" data-cust-edit-addr="${addr.id}"><i class="ph ph-pencil"></i> Sửa</button>
              ${!addr.isDefault ? `<button class="icon-btn danger" data-cust-delete-addr="${addr.id}" title="Xóa địa chỉ">${icon("ph-trash")}</button>` : ''}
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// --------------------------------------------------------------------------
// 5. SẢN PHẨM ĐÃ LƯU (CUSTOMER WISHLIST)
// --------------------------------------------------------------------------
export function customerWishlistScreen() {
  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Khách hàng / </span><strong>Yêu thích</strong></div>
        <h1>Sản Phẩm Đã Lưu (Wishlist)</h1>
        <p>Danh sách các sản phẩm yêu thích đã lưu để theo dõi chương trình giảm giá và ưu đãi từ KOL.</p>
      </div>
      <div class="actions">
        <button class="btn secondary" data-cust-goto="storefront"><i class="ph ph-shopping-bag"></i> Khám phá thêm</button>
      </div>
    </header>

    <div class="grid" style="grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:20px">
      ${customerState.wishlist.map(item => `
        <div class="card" style="padding:16px;display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div style="position:relative;margin-bottom:12px">
              <img src="${item.img}" alt="${item.name}" style="width:100%;height:180px;object-fit:cover;border-radius:10px" />
              <button class="icon-btn danger" data-cust-remove-wishlist="${item.id}" style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.1)" title="Bỏ lưu">
                ${icon("ph-heart-break")}
              </button>
            </div>
            <small style="color:var(--brand);font-weight:600">${item.brand}</small>
            <strong style="font-size:14.5px;display:block;margin:4px 0 8px;line-height:1.4">${item.name}</strong>
            <div style="font-size:12px;color:#059669;margin-bottom:8px">
              <i class="ph ph-sparkle"></i> ${item.kolDeal}
            </div>
            <div style="display:flex;align-items:baseline;gap:8px">
              <strong style="font-size:17px;color:var(--brand)">${money(item.price)}</strong>
              <small style="color:var(--muted);text-decoration:line-through">${money(item.origPrice)}</small>
            </div>
          </div>

          <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--line)">
            ${item.inStock ? `
              <button class="btn" data-cust-add-to-cart="${item.id}" style="width:100%"><i class="ph ph-shopping-cart-simple"></i> Thêm vào giỏ</button>
            ` : `
              <button class="btn secondary" disabled style="width:100%"><i class="ph ph-prohibit"></i> Tạm hết hàng</button>
            `}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// --------------------------------------------------------------------------
// 6. ĐÁNH GIÁ CỦA TÔI (CUSTOMER REVIEWS)
// --------------------------------------------------------------------------
export function customerReviewsScreen() {
  const pendingOrders = customerState.orders.filter(o => o.status === "delivered" && !o.reviewed);

  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Khách hàng / </span><strong>Đánh giá của tôi</strong></div>
        <h1>Đánh Giá Sản Phẩm Đã Mua</h1>
        <p>Chỉ những đơn hàng đã giao thành công và thuộc tài khoản của bạn mới đủ điều kiện gửi đánh giá (Bảo chứng tính khách quan).</p>
      </div>
    </header>

    <!-- Hàng Đơn Chờ Đánh Giá -->
    ${pendingOrders.length > 0 ? `
      <div class="card" style="padding:20px;margin-bottom:24px;background:var(--brand-soft);border:1px solid color-mix(in srgb, var(--brand) 30%, transparent)">
        <h3 style="margin-top:0;font-size:15px;color:var(--brand-strong)">
          ${icon("ph-star")} Bạn có ${pendingOrders.length} sản phẩm đã nhận hàng đang chờ đánh giá!
        </h3>
        <p style="font-size:12.5px;color:var(--muted);margin:4px 0 14px">
          Chia sẻ trải nghiệm sử dụng thực tế để giúp khách hàng khác lựa chọn phù hợp.
        </p>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${pendingOrders.map(po => `
            <div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface);padding:12px 16px;border-radius:10px">
              <div style="display:flex;align-items:center;gap:12px">
                <img src="${po.items[0].img}" style="width:44px;height:44px;border-radius:6px;object-fit:cover" />
                <div>
                  <strong>${po.items[0].name}</strong>
                  <small style="color:var(--muted);display:block">Đơn hàng: ${po.id} • Nhận ngày: ${po.deliveredAt || 'Gần đây'}</small>
                </div>
              </div>
              <button class="btn small" data-cust-open-review-form="${po.id}"><i class="ph ph-pencil-simple"></i> Viết đánh giá ngay</button>
            </div>
          `).join("")}
        </div>
      </div>
    ` : ''}

    <h3 style="font-size:16px;margin:20px 0 12px">${icon("ph-chats-circle")} Các đánh giá bạn đã gửi (${customerState.reviews.length})</h3>

    <div style="display:flex;flex-direction:column;gap:16px">
      ${customerState.reviews.map(rev => `
        <div class="card" style="padding:20px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div>
              <strong style="font-size:15px">${escapeReviewHtml(rev.productName)}</strong>
              <div style="color:#f59e0b;font-size:15px;margin:4px 0">
                ${'<i class="ph ph-star-fill"></i>'.repeat(rev.rating)}
                <small style="color:var(--muted);margin-left:6px">${rev.date}</small>
              </div>
            </div>
            <span class="badge success" style="font-size:11px"><i class="ph ph-check"></i> Đã duyệt hiển thị</span>
          </div>

          <p style="font-size:13.5px;line-height:1.5;margin:0 0 12px">${escapeReviewHtml(rev.comment)}</p>

          ${rev.images ? `
            <div style="display:flex;gap:10px;margin-bottom:12px">
              ${rev.images.map(img => `<img src="${escapeReviewHtml(img)}" alt="Ảnh khách hàng đánh giá" style="width:68px;height:68px;border-radius:8px;object-fit:cover;border:1px solid var(--line)" />`).join("")}
            </div>
          ` : ''}

          ${rev.video ? `<video src="${escapeReviewHtml(rev.video)}" controls playsinline preload="metadata" style="max-height:240px;max-width:100%;border-radius:8px" aria-label="Video đánh giá"></video>` : ''}

          ${rev.shopReply ? `
            <div style="background:var(--surface-2);padding:12px 14px;border-radius:8px;font-size:12.5px;line-height:1.5;border-left:3px solid var(--brand)">
              <strong style="color:var(--brand)"><i class="ph ph-arrow-bend-down-right"></i> Phản hồi từ Người bán:</strong>
              <div style="margin-top:2px;color:var(--text)">${rev.shopReply}</div>
            </div>
          ` : ''}
        </div>
      `).join("")}
    </div>
  `;
}

// --------------------------------------------------------------------------
// 7. HỖ TRỢ ĐƠN HÀNG (CUSTOMER SUPPORT)
// --------------------------------------------------------------------------
export function customerSupportScreen() {
  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Khách hàng / </span><strong>Hỗ trợ & Khiếu nại</strong></div>
        <h1>Trung Tâm Hỗ Trợ Đơn Hàng</h1>
        <p>Gửi yêu cầu trợ giúp về vận chuyển, đổi trả sản phẩm hoặc hóa đơn mua hàng.</p>
      </div>
      <div class="actions">
        <button class="btn" data-cust-create-ticket><i class="ph ph-plus"></i> Tạo yêu cầu mới</button>
      </div>
    </header>

    <div class="split" style="grid-template-columns:1fr 1fr;gap:20px">
      <!-- Cột Trái: Danh sách Ticket -->
      <div class="card" style="padding:22px">
        <h3 style="margin-top:0;font-size:16px;border-bottom:1px solid var(--line);padding-bottom:10px">
          ${icon("ph-ticket")} Yêu cầu đã gửi (${customerState.supportTickets.length})
        </h3>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">
          ${customerState.supportTickets.map(t => `
            <div style="padding:14px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span class="mono" style="font-weight:700;color:var(--brand)">${t.id}</span>
                <span class="badge ${t.status === 'resolved' ? 'success' : 'warning'}" style="font-size:11px">
                  ${t.status === 'resolved' ? 'Đã giải quyết' : 'Đang xử lý'}
                </span>
              </div>
              <strong style="font-size:13.5px;display:block;margin-bottom:4px">${t.subject}</strong>
              <small style="color:var(--muted)">Đơn hàng liên quan: <strong class="mono">${t.orderId}</strong> • ${t.createdAt}</small>
              <div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);font-size:12.5px;color:var(--muted)">
                ${t.messages[t.messages.length - 1].text}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Cột Phải: FAQ & Hướng dẫn khiếu nại -->
      <div class="card" style="padding:22px">
        <h3 style="margin-top:0;font-size:16px;border-bottom:1px solid var(--line);padding-bottom:10px">
          ${icon("ph-question")} Câu hỏi thường gặp
        </h3>
        <div style="display:flex;flex-direction:column;gap:14px;margin-top:14px;font-size:13px;line-height:1.5">
          <div>
            <strong>1. Thời gian đổi trả hàng là bao lâu?</strong>
            <p style="margin:4px 0 0;color:var(--muted)">Khách hàng được quyền gửi yêu cầu đổi trả miễn phí trong vòng 14 ngày kể từ khi ký nhận hàng thành công.</p>
          </div>
          <div>
            <strong>2. Tiền hoàn trả sẽ về tài khoản như thế nào?</strong>
            <p style="margin:4px 0 0;color:var(--muted)">Nếu thanh toán qua VietQR, tiền sẽ hoàn trực tiếp vào tài khoản ngân hàng trong 24h sau khi Shop xác nhận nhận lại kiện hàng.</p>
          </div>
          <div>
            <strong>3. Mua hàng qua mã KOL có được bảo hành chính hãng?</strong>
            <p style="margin:4px 0 0;color:var(--muted)">Có! Mọi đơn hàng đều do chính hãng Shop xuất kho và bảo hành đầy đủ tem niêm phong.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// 8. BẢO MẬT TÀI KHOẢN (CUSTOMER SECURITY)
// --------------------------------------------------------------------------
export function customerSecurityScreen() {
  return `
    <header class="page-head">
      <div>
        <div class="crumb"><span>Khách hàng / </span><strong>Bảo mật tài khoản</strong></div>
        <h1>Bảo Mật & Quản Lý Phiên Đăng Nhập</h1>
        <p>Đổi mật khẩu định kỳ và theo dõi danh sách thiết bị đang đăng nhập.</p>
      </div>
    </header>

    <div class="split" style="grid-template-columns:1fr 1fr;gap:20px">
      <div class="card" style="padding:22px">
        <h3 style="margin-top:0;font-size:16px;border-bottom:1px solid var(--line);padding-bottom:10px">${icon("ph-lock")} Đổi mật khẩu</h3>
        <form id="cust-change-pass-form" class="form-stack" style="margin-top:16px">
          <div class="field"><label>Mật khẩu hiện tại</label><input class="input" type="password" value="••••••••" required /></div>
          <div class="field"><label>Mật khẩu mới</label><input class="input" type="password" placeholder="Tối thiểu 8 ký tự" required /></div>
          <div class="field"><label>Xác nhận mật khẩu mới</label><input class="input" type="password" placeholder="Nhập lại mật khẩu mới" required /></div>
          <button class="btn" type="submit">Lưu mật khẩu mới</button>
        </form>
      </div>

      <div class="card" style="padding:22px">
        <h3 style="margin-top:0;font-size:16px;border-bottom:1px solid var(--line);padding-bottom:10px">${icon("ph-devices")} Phiên đăng nhập</h3>
        <div style="margin-top:14px;display:flex;flex-direction:column;gap:12px">
          <div style="padding:12px;background:var(--surface-2);border-radius:8px">
            <div style="display:flex;justify-content:space-between">
              <strong>Chrome trên Windows (Thiết bị này)</strong>
              <span class="badge success" style="font-size:11px">Đang hoạt động</span>
            </div>
            <small style="color:var(--muted)">Hà Nội, Việt Nam • IP: 14.241.88.19</small>
          </div>
          <button class="btn danger small" data-cust-toast="Đã đăng xuất phiên trên các thiết bị khác!">Đăng xuất tất cả thiết bị khác</button>
        </div>
      </div>
    </div>
  `;
}

// --------------------------------------------------------------------------
// BINDING LOGIC CHO CUSTOMER
// --------------------------------------------------------------------------
export function bindCustomer(root, { toast, go, renderCurrentPage, modal }) {
  // Navigation
  root.querySelectorAll("[data-cust-goto]").forEach(el => {
    el.addEventListener("click", () => go(el.dataset.custGoto));
  });

  // Order Tabs
  root.querySelectorAll("[data-cust-order-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      customerState.activeOrderTab = btn.dataset.custOrderTab;
      renderCurrentPage();
    });
  });

  // View order detail
  root.querySelectorAll("[data-cust-view-order]").forEach(btn => {
    btn.addEventListener("click", () => {
      customerState.selectedOrderDetailId = btn.dataset.custViewOrder;
      go("customer-order-detail");
    });
  });

  // Track order
  root.querySelectorAll("[data-cust-track-order]").forEach(btn => {
    btn.addEventListener("click", () => {
      customerState.selectedOrderDetailId = btn.dataset.custTrackOrder;
      go("customer-order-detail");
    });
  });

  // Cancel order
  root.querySelectorAll("[data-cust-cancel-order]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.custCancelOrder;
      const order = customerState.orders.find(o => o.id === id);
      if (!order) return;
      if (confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${order.id}?`)) {
        order.status = "cancelled";
        order.cancelReason = "Khách hàng hủy đơn qua giao diện.";
        toast(`Đã hủy thành công đơn hàng ${order.id}.`);
        renderCurrentPage();
      }
    });
  });

  // Return order
  root.querySelectorAll("[data-cust-return-order]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.custReturnOrder;
      const reason = prompt("Vui lòng nhập lý do bạn muốn đổi trả sản phẩm:", "Sản phẩm còn nguyên seal nhưng mình muốn đổi sang phân loại khác.");
      if (reason) {
        toast(`Đã gửi yêu cầu đổi trả cho đơn ${id}. Shop sẽ liên hệ trong 24h.`);
      }
    });
  });

  // Reorder
  root.querySelectorAll("[data-cust-reorder]").forEach(btn => {
    btn.addEventListener("click", () => {
      go("storefront");
      toast("Đã thêm sản phẩm vào giỏ hàng!");
    });
  });

  // FR-18 uses the React modal and real API; never award a fabricated voucher/reply.
  handleReviewCompleted = data => {
    const order = customerState.orders.find(item => item.id === data.prototypeOrderId);
    const review = data.review;
    if (!order || !review || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) return;
    order.reviewed = true;
    customerState.reviews.unshift({ orderId: data.orderSn, productName: data.productName, rating: review.rating, date: 'Hôm nay', comment: review.comment, images: review.images ?? [], video: review.video });
    toast('Đánh giá đã được lưu thành công. Cảm ơn bạn!');
    renderCurrentPage();
  };
  root.querySelectorAll("[data-cust-review-order], [data-cust-open-review-form]").forEach(btn => {
    btn.addEventListener("click", () => {
      const orderId = btn.dataset.custReviewOrder || btn.dataset.custOpenReviewForm;
      const order = customerState.orders.find(o => o.id === orderId);
      if (!order) return;
      if (window.parent === window) { toast('Vui lòng mở trang đánh giá trong ứng dụng SCANMS để gửi đánh giá.'); return; }
      pendingReviewOrderId = order.id;
      window.parent.postMessage({ type: 'SCANMS_OPEN_PRODUCT_REVIEW', orderId: order.id, productId: order.items[0].id, productName: order.items[0].name, imageUrl: order.items[0].img }, window.location.origin);
    });
  });

  // Add Address
  root.querySelector("[data-cust-add-address]")?.addEventListener("click", () => {
    const street = prompt("Nhập số nhà, tên đường:", "Số 15 Lê Văn Lương");
    if (street) {
      customerState.addresses.push({
        id: `ADDR-${Date.now().toString().slice(-3)}`,
        isDefault: false,
        label: "Địa chỉ mới",
        receiverName: customerState.profile.name,
        phone: customerState.profile.phone,
        province: "Hà Nội",
        district: "Quận Thanh Xuân",
        ward: "Phường Nhân Chính",
        street: street
      });
      toast("Đã thêm địa chỉ mới thành công!");
      renderCurrentPage();
    }
  });

  // Set default address
  root.querySelectorAll("[data-cust-set-default-addr]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.custSetDefaultAddr;
      customerState.addresses.forEach(a => a.isDefault = (a.id === id));
      toast("Đã đặt làm địa chỉ giao hàng mặc định!");
      renderCurrentPage();
    });
  });

  // Delete address
  root.querySelectorAll("[data-cust-delete-addr]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.custDeleteAddr;
      customerState.addresses = customerState.addresses.filter(a => a.id !== id);
      toast("Đã xóa địa chỉ khỏi sổ tay!");
      renderCurrentPage();
    });
  });

  // Edit address demo
  root.querySelectorAll("[data-cust-edit-addr]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.custEditAddr;
      const addr = customerState.addresses.find(a => a.id === id);
      if (!addr) return;
      const newStreet = prompt("Chỉnh sửa địa chỉ chi tiết:", addr.street);
      if (newStreet) {
        addr.street = newStreet;
        toast("Đã lưu thay đổi địa chỉ!");
        renderCurrentPage();
      }
    });
  });

  // Remove Wishlist
  root.querySelectorAll("[data-cust-remove-wishlist]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.custRemoveWishlist;
      customerState.wishlist = customerState.wishlist.filter(w => w.id !== id);
      toast("Đã xóa sản phẩm khỏi danh sách yêu thích!");
      renderCurrentPage();
    });
  });

  // Add to cart from wishlist
  root.querySelectorAll("[data-cust-add-to-cart]").forEach(btn => {
    btn.addEventListener("click", () => {
      toast("Đã thêm sản phẩm vào giỏ hàng!");
      go("storefront");
    });
  });

  // Create ticket
  root.querySelector("[data-cust-create-ticket]")?.addEventListener("click", () => {
    const sub = prompt("Nhập tiêu đề yêu cầu hỗ trợ:", "Cần hóa đơn VAT cho đơn hàng vừa nhận");
    if (sub) {
      customerState.supportTickets.unshift({
        id: `TICK-${Date.now().toString().slice(-3)}`,
        orderId: "IN23944",
        subject: sub,
        status: "in_progress",
        createdAt: "Vừa xong",
        messages: [
          { sender: "customer", text: sub, time: "Vừa xong" }
        ]
      });
      toast("Đã tạo yêu cầu hỗ trợ thành công! Nhân viên sẽ phản hồi sớm.");
      renderCurrentPage();
    }
  });

  // Profile Avatar Upload & Remove
  const custAvatarCircle = root.querySelector('#cust-avatar-circle-trigger');
  const custAvatarInput = root.querySelector('#cust-avatar-file');
  const custAvatarRemoveBtn = root.querySelector('#cust-avatar-remove-btn');

  if (custAvatarCircle && custAvatarInput) {
    custAvatarCircle.addEventListener('click', () => {
      custAvatarInput.click();
    });
  }

  if (custAvatarInput) {
    custAvatarInput.addEventListener('change', async (e) => {
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
        customerState.profile.avatarImg = compressedBase64;
        safeSaveProfile('scanms_profile_customer', customerState.profile);
        toast?.('Đã đổi ảnh đại diện khách hàng thành công!', 'success');
        renderCurrentPage();
      } catch (err) {
        console.error('Lỗi khi nén ảnh đại diện customer:', err);
        toast?.('Không thể xử lý ảnh này. Vui lòng chọn ảnh khác!', 'error');
      }
    });
  }

  if (custAvatarRemoveBtn) {
    custAvatarRemoveBtn.addEventListener('click', () => {
      customerState.profile.avatarImg = null;
      safeSaveProfile('scanms_profile_customer', customerState.profile);
      toast?.('Đã gỡ ảnh đại diện, chuyển về chữ cái mặc định!', 'info');
      renderCurrentPage();
    });
  }

  // Profile Tab Switching
  root.querySelectorAll("[data-cust-profile-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      customerState.activeProfileTab = btn.dataset.custProfileTab;
      renderCurrentPage();
    });
  });

  // Profile submit
  root.querySelector("#cust-profile-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = root.querySelector("#cust-name-input")?.value?.trim();
    const email = root.querySelector("#cust-email-input")?.value?.trim();
    const phone = root.querySelector("#cust-phone-input")?.value?.trim();
    const dob = root.querySelector("#cust-dob")?.value;
    const gender = root.querySelector("#cust-gender")?.value;

    if (name) {
      customerState.profile.name = name;
      customerState.profile.avatar = name.charAt(0).toUpperCase();
    }
    if (email) customerState.profile.email = email;
    if (phone) customerState.profile.phone = phone;
    if (dob) customerState.profile.dob = dob;
    if (gender) customerState.profile.gender = gender;

    safeSaveProfile("scanms_profile_customer", customerState.profile);

    toast("Đã lưu thông tin hồ sơ khách hàng thành công!");
    renderCurrentPage();
  });

  // Change pass submit (#cust-pass-form & #cust-change-pass-form)
  root.querySelector("#cust-pass-form, #cust-change-pass-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const newPass = root.querySelector("#cust-new-pass")?.value;
    const confirmPass = root.querySelector("#cust-confirm-pass")?.value;
    if (newPass && confirmPass && newPass !== confirmPass) {
      toast("Mật khẩu xác nhận không khớp, vui lòng kiểm tra lại!");
      return;
    }
    toast("Đã cập nhật mật khẩu mới thành công!");
    e.target.reset();
  });

  // Generic toasts
  root.querySelectorAll("[data-cust-toast]").forEach(el => {
    el.addEventListener("click", () => toast(el.dataset.custToast));
  });
}
