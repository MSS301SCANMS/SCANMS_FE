// =====================================================================
// SCANMS - Màn hình Link & QR Tiếp Thị (KOL / Cộng Tác Viên)
// Quản lý tạo liên kết định danh, mã QR động, coupon riêng & đa kênh
// =====================================================================

const products = [
  {
    id: 'SKIN-C15',
    sku: 'SKIN-C15',
    name: 'Serum vitamin C 15%',
    category: 'Chăm sóc da',
    price: 459000,
    rate: 8, // 8% cơ bản
    bonusRate: 3, // +3% thưởng hạng Vàng
    stock: 426,
    status: 'active',
    image: './assets/serum-hero-optimized.jpg',
    description: 'Serum dưỡng sáng mờ thâm, chống oxy hóa với vitamin C tinh khiết 15%.'
  },
  {
    id: 'SUN-AQUA',
    sku: 'SUN-AQUA',
    name: 'Kem chống nắng SPF50+',
    category: 'Bảo vệ da',
    price: 389000,
    rate: 10,
    bonusRate: 3,
    stock: 238,
    status: 'active',
    image: './assets/serum-hero-optimized.jpg',
    description: 'Màng lọc phổ rộng 5 tia, kiềm dầu 8 giờ, kháng nước mồ hôi.'
  },
  {
    id: 'TONER-BHA',
    sku: 'TONER-BHA',
    name: 'Nước hoa hồng BHA 2%',
    category: 'Tẩy tế bào chết',
    price: 320000,
    rate: 9,
    bonusRate: 3,
    stock: 154,
    status: 'active',
    image: './assets/serum-hero-optimized.jpg',
    description: 'Làm sạch sâu bã nhờn, se khít lỗ chân lông, cân bằng pH 3.8.'
  },
  {
    id: 'CLEANSER-02',
    sku: 'CLEANSER-02',
    name: 'Gel rửa mặt dịu nhẹ',
    category: 'Làm sạch',
    price: 279000,
    rate: 7,
    bonusRate: 3,
    stock: 0,
    status: 'out_of_stock',
    image: './assets/serum-hero-optimized.jpg',
    description: 'Độ pH 5.5 chuẩn da liễu, chiết xuất rau má làm dịu kích ứng.'
  },
  {
    id: 'MASK-CICA',
    sku: 'MASK-CICA',
    name: 'Mặt nạ phục hồi Cica',
    category: 'Phục hồi da',
    price: 69000,
    rate: 12,
    bonusRate: 3,
    stock: 812,
    status: 'paused',
    image: './assets/serum-hero-optimized.jpg',
    description: 'Chiết xuất rau má đậm đặc, làm dịu da sau nặn mụn hoặc treatment.'
  }
];

const channels = [
  { id: 'tiktok', name: 'TikTok', handle: '@nhatdepmoingay', followers: '184.200 người theo dõi', icon: 'ph-tiktok-logo' },
  { id: 'facebook', name: 'Facebook', handle: 'Nhật Beauty Review', followers: '68.450 người theo dõi', icon: 'ph-facebook-logo' },
  { id: 'youtube', name: 'YouTube', handle: 'Nhật Dùng Gì', followers: '42.800 người đăng ký', icon: 'ph-youtube-logo' },
  { id: 'threads', name: 'Threads', handle: '@nhatdepmoingay', followers: '21.360 người theo dõi', icon: 'ph-threads-logo' },
  { id: 'zalo', name: 'Zalo', handle: 'Nhật Beauty OA', followers: '15.200 quan tâm', icon: 'ph-chat-circle-dots' },
  { id: 'instagram', name: 'Instagram', handle: '@nhat.beauty', followers: '35.100 người theo dõi', icon: 'ph-instagram-logo' }
];

const duplicateCoupons = ['DUPLICATE10', 'SHOP10', 'SALE10', 'MAIANH12', 'TIKTOK10'];
const expiredCoupons = ['EXPIRED10', 'TET2025', 'HE2025', 'BLACKFRIDAY'];

const model = {
  product: 'SKIN-C15',
  channel: 'tiktok',
  campaign: 'routine_sang',
  coupon: 'NHATXINH10',
  color: '#9E7933',
  mode: 'ready', // 'ready' | 'empty' | 'error'
  busy: false,
  isStale: false,
  result: null,
  history: []
};

let host = null;

const money = (n) => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';

function feedback(id, text, type = 'info') {
  const el = host?.querySelector('#' + id);
  if (!el) return;
  el.textContent = text;
  el.className = 'link-feedback';
  if (type === 'error') el.classList.add('error');
  if (type === 'warning') el.classList.add('warning');
}

function getActiveChannels() {
  if (typeof window !== 'undefined' && Array.isArray(window.__SCANMS_CHANNELS__) && window.__SCANMS_CHANNELS__.length > 0) {
    return window.__SCANMS_CHANNELS__;
  }
  return channels;
}

export function linksPage() {
  return `
    <section class="link-fullstack-embed" aria-label="Quản trị link tiếp thị FR-10">
      <iframe
        id="referral-links-iframe"
        src="/collaborator/referral-links"
        title="Quản trị Link Tiếp Thị Rút Gọn FR-10"
        scrolling="auto"
        style="width:100%;height:calc(100vh - 112px);min-height:760px;border:0;border-radius:16px;background:#f8fafc;display:block"
      ></iframe>
    </section>
  `;
}

// Giữ màn hình prototype cũ để tham chiếu thiết kế; luồng chính dùng trang React
// Fullstack phía trên nhằm không tạo hai giao diện quản trị song song.
function legacyLinksPage() {
  const activeChannels = getActiveChannels();
  if (typeof window !== 'undefined' && window.__SCANMS_PRESELECTED_CHANNEL__) {
    model.channel = window.__SCANMS_PRESELECTED_CHANNEL__;
    delete window.__SCANMS_PRESELECTED_CHANNEL__;
  } else if (!activeChannels.some((c) => c.id === model.channel)) {
    model.channel = activeChannels[0]?.id || 'tiktok';
  }
  return `
  <section class="link-workspace">
    <!-- Header & UX State Testing Switcher -->
    <header class="page-head">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <h1>Tạo Link Tiếp Thị Rút Gọn (FR-10)</h1>
          <span class="badge" style="background:#FEF3C7;color:#92400E;font-weight:700">scanms.vn/r/{code}</span>
        </div>
        <p>KOL chọn sản phẩm &rarr; Hệ thống sinh link <strong>scanms.vn/r/{short_code}</strong> kèm mã QR quét được và cơ chế gắn Cookie 30 ngày.</p>
      </div>
      <div class="actions" style="display:flex;gap:10px;align-items:center">
        <a href="/collaborator/referral-links" class="btn small" style="background:#231D15;color:#EAD2A3;border:1px solid #C59B58;font-weight:700">
          <i class="ph ph-sliders"></i> Quản Trị Link React Fullstack &rarr;
        </a>
        <div class="link-state-capsule" title="Trạng thái nguồn dữ liệu kho hàng">
          <i class="ph ph-sliders-horizontal"></i>
          <select id="link-mode" class="link-mode-select">
            <option value="ready">Kho hàng khả dụng</option>
            <option value="empty">Kho hàng tạm hết</option>
            <option value="error">Mất kết nối máy chủ</option>
          </select>
        </div>
      </div>
    </header>

    <div class="link-workspace-grid">
      <!-- CỘT TRÁI: Form thiết lập các bước -->
      <div class="card form-stack" style="gap:24px">
        
        <!-- BƯỚC 1: Chọn sản phẩm -->
        <section class="step-section">
          <div class="step-title">
            <span class="step-badge">1</span>
            <span>Chọn sản phẩm & Xem hoa hồng</span>
          </div>

          <div class="field">
            <label for="product-search">Tìm kiếm nhanh</label>
            <div style="position:relative">
              <input class="input" id="product-search" placeholder="Nhập tên sản phẩm hoặc mã SKU..." type="search" />
            </div>
            <small id="product-count" style="color:var(--muted)"></small>
          </div>

          <div class="field">
            <label for="link-product">Sản phẩm tiếp thị</label>
            <select id="link-product" class="select"></select>
          </div>

          <!-- Preview & Bảng tính hoa hồng chi tiết -->
          <div id="product-preview-container"></div>
        </section>

        <!-- BƯỚC 2: Chọn kênh & Tracking tag -->
        <section class="step-section">
          <div class="step-title">
            <span class="step-badge">2</span>
            <span>Kênh phân phối & Chiến dịch</span>
          </div>

          <div class="field">
            <label for="link-channel">Kênh phân phối</label>
            <select class="select" id="link-channel">
              <option value="">-- Chọn kênh mạng xã hội --</option>
              ${activeChannels.map((c) => `<option value="${c.id}" ${c.id === model.channel ? 'selected' : ''}>${c.name || c.displayName} • ${c.handle}</option>`).join('')}
            </select>
            <small style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
              <span>Mỗi kênh sẽ gắn tag UTM riêng để báo cáo hiệu suất chính xác.</span>
              <button class="text-btn" data-go="channels" style="font-weight:600">+ Quản lý kênh</button>
            </small>
          </div>

          <div class="field">
            <label for="campaign-tag">Tên chiến dịch / UTM Campaign (tùy chọn)</label>
            <input class="input mono" id="campaign-tag" placeholder="VD: routine_sang, deal_thang9" value="${model.campaign}" />
          </div>
        </section>

        <!-- NÚT TẠO LINK CHÍNH -->
        <section style="display:flex;flex-direction:column;gap:10px">
          <div id="stale-warning" class="stale-warning-banner" hidden>
            <i class="ph ph-warning-circle" aria-hidden="true"></i>
            <span>Bạn vừa thay đổi sản phẩm hoặc kênh. Hãy nhấn nút dưới đây để tạo lại link & mã QR mới.</span>
          </div>

          <button class="btn" id="generate-link" style="width:100%;height:48px;font-size:15px;font-weight:700;background:linear-gradient(135deg, #C59B58, #B88E4F);color:#fff">
            <i class="ph ph-link-simple-horizontal" aria-hidden="true"></i> Tạo Link Tiếp Thị Rút Gọn & Mã QR
          </button>
          <div id="generate-feedback" class="link-feedback" role="status" aria-live="polite"></div>
        </section>

        <!-- BƯỚC 3: Kết quả link tiếp thị -->
        <section class="step-section">
          <div class="step-title">
            <span class="step-badge">3</span>
            <span>Link tiếp thị rút gọn định danh CTV (scanms.vn/r/{code})</span>
          </div>

          <div class="link-result-card" style="border: 2px solid #EEDFC6; background: #FFFCF7; padding: 18px; border-radius: 12px">
            <!-- Ô LINK RÚT GỌN NỔI BẬT THEO ĐẶC TẢ -->
            <div style="margin-bottom: 14px">
              <label for="generated-short-url" style="font-weight:800;font-size:14px;color:#92400E;display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <i class="ph ph-lightning"></i> Link Rút Gọn Tiếp Thị (FR-10): scanms.vn/r/{short_code}
              </label>
              <div class="link-row" style="display:flex;gap:8px">
                <input class="input mono" id="generated-short-url" readonly placeholder="Chưa tạo link. Bấm nút Tạo link ở trên..." style="font-weight:800;font-size:14.5px;color:#92400E;background:#FEF3C7;border:1.5px solid #F59E0B" />
                <button class="btn" id="copy-short-link" disabled style="white-space:nowrap;background:#92400E;color:#fff;font-weight:700">
                  <i class="ph ph-copy" aria-hidden="true"></i> <span id="copy-short-btn-text">Sao chép Link Rút Gọn</span>
                </button>
              </div>
            </div>

            <!-- Ô URL ĐÍCH ĐẦY ĐỦ -->
            <label for="generated-url" style="font-weight:600;font-size:12px;color:var(--muted)">
              URL Đích Chuyển Tiếp (Đã gắn UTM & Token Attribution):
            </label>
            <div class="link-row" style="display:flex;gap:8px;margin-top:4px">
              <input class="input mono" id="generated-url" readonly placeholder="URL đích..." style="font-size:12px;color:var(--muted)" />
              <button class="btn secondary" id="copy-link" disabled style="white-space:nowrap;font-size:12px">
                <i class="ph ph-copy" aria-hidden="true"></i> <span>URL dài</span>
              </button>
            </div>
            <div id="copy-feedback" class="link-feedback" role="status"></div>

            <div class="link-result-meta-tags" style="margin-top:10px">
              <span class="meta-pill active"><i class="ph ph-shield-check"></i> Định danh CTV duy nhất</span>
              <span class="meta-pill"><i class="ph ph-clock"></i> Cookie 30 ngày</span>
              <span class="meta-pill"><i class="ph ph-cursor-click"></i> Last-Click Attribution</span>
            </div>

            <div class="actions" style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">
              <a class="btn secondary small" id="open-link" target="_blank" rel="noopener noreferrer" hidden style="display:inline-flex;align-items:center;gap:6px">
                <i class="ph ph-arrow-square-out" aria-hidden="true"></i> Thử nghiệm Click Link (/r/:code)
              </a>
              <a class="btn small" href="/collaborator/referral-links" style="display:inline-flex;align-items:center;gap:6px;background:#231D15;color:#EAD2A3">
                <i class="ph ph-arrow-up-right"></i> Mở Trang Quản Trị Link React Fullstack
              </a>
            </div>
          </div>
        </section>

        <!-- BƯỚC 4: Mã giảm giá riêng (Coupon) -->
        <section class="step-section">
          <div class="step-title">
            <span class="step-badge">4</span>
            <span>Mã giảm giá riêng (Coupon Attribution)</span>
          </div>
          <p style="font-size:13px;color:var(--muted);margin:0;line-height:1.6">
            Khách nhập mã này sẽ được giảm ngay 10% (mức ưu đãi do Shop ấn định). Đơn hàng tự động được tính cho bạn ngay cả khi khách xóa cookie hoặc đổi thiết bị.
          </p>

          <div class="coupon-input-group">
            <input class="input mono" id="coupon-code" maxlength="20" placeholder="VD: NHATXINH10, TUANBEAUTY10" style="text-transform:uppercase" />
            <button class="btn secondary" id="check-coupon" style="white-space:nowrap">
              <i class="ph ph-check-circle" aria-hidden="true"></i> Kiểm tra mã
            </button>
            <button class="btn" id="save-coupon" disabled style="white-space:nowrap">
              Áp dụng vào Link
            </button>
          </div>
          <div id="coupon-feedback" class="link-feedback" role="status"></div>

          <div class="coupon-test-pills">
            <span>Bấm thử kịch bản:</span>
            <button type="button" class="test-pill-btn" data-test-coupon="NHATXINH10">NHATXINH10 (Hợp lệ)</button>
            <button type="button" class="test-pill-btn" data-test-coupon="DUPLICATE10">DUPLICATE10 (Trùng mã)</button>
            <button type="button" class="test-pill-btn" data-test-coupon="EXPIRED10">EXPIRED10 (Hết hạn)</button>
          </div>
        </section>

        <!-- BƯỚC 5: Chia sẻ mạng xã hội -->
        <section class="step-section">
          <div class="step-title">
            <span class="step-badge">5</span>
            <span>Chia sẻ nhanh lên mạng xã hội</span>
          </div>

          <div class="share-matrix">
            <button class="share-btn primary-share" id="share-system" disabled>
              <i class="ph ph-share-network"></i> Thiết bị
            </button>
            <button class="share-btn" id="share-facebook" disabled>
              <i class="ph ph-facebook-logo"></i> Facebook
            </button>
            <button class="share-btn" id="share-zalo" disabled>
              <i class="ph ph-chat-circle-dots"></i> Zalo
            </button>
            <button class="share-btn" id="share-caption" disabled>
              <i class="ph ph-article"></i> Chép Caption
            </button>
          </div>
          <div id="share-feedback" class="link-feedback" role="status"></div>
        </section>
      </div>

      <!-- CỘT PHẢI: Khung hiển thị & tùy chỉnh mã QR -->
      <aside class="qr-output-card">
        <div class="card" style="display:flex;flex-direction:column;gap:18px">
          <div class="card-title">
            <h2>Mã QR Động Quét Được</h2>
            <span class="status" id="qr-status-badge">Chờ tạo link</span>
          </div>

          <!-- Khu vực vẽ Canvas QR thật -->
          <div class="qr-canvas-container">
            <div class="qr-empty-placeholder" id="qr-placeholder">
              <i class="ph ph-qr-code"></i>
              <strong>Chưa có mã QR</strong>
              <span>Vui lòng chọn sản phẩm, kênh và nhấn "Tạo link tiếp thị" để xem mã QR quét được.</span>
            </div>

            <canvas id="qr-canvas" width="512" height="512" hidden aria-label="Mã QR liên kết tiếp thị SCANMS"></canvas>

            <div class="qr-meta-caption" id="qr-meta" hidden>
              <strong id="qr-product-name">Serum vitamin C 15%</strong>
              <span id="qr-channel-name">Dành cho TikTok • @nhatdepmoingay</span>
            </div>
          </div>

          <div id="qr-feedback" class="link-feedback" role="status"></div>

          <button class="btn secondary" id="download-qr" disabled style="height:44px;font-weight:600">
            <i class="ph ph-download-simple"></i> Tải ảnh QR PNG (Độ nét cao)
          </button>

          <details style="font-size:13px;color:var(--muted);line-height:1.6;cursor:pointer">
            <summary style="font-weight:600;color:var(--ink)">Mẹo sử dụng mã QR hiệu quả</summary>
            <div style="margin-top:8px">
              <p style="margin:0 0 6px">• In lên ấn phẩm, card cảm ơn hoặc chèn vào góc video TikTok / YouTube Shorts.</p>
              <p style="margin:0 0 6px">• Mã QR tạo bởi hệ thống là mã thật 512x512px, máy ảnh điện thoại có thể quét trực tiếp.</p>
              <p style="margin:0">• Giữ độ tương phản màu trên 4.5:1 để camera bắt nét nhanh ngay cả trong điều kiện thiếu sáng.</p>
            </div>
          </details>
        </div>
      </aside>
    </div>

    <!-- LỊCH SỬ LINK ĐÃ TẠO TRONG PHIÊN (RE-DESIGNED) -->
    <section class="card history-section" id="history-section">
      <div class="history-section-head">
        <div class="history-head-title-group">
          <div class="history-head-icon" aria-hidden="true">
            <i class="ph ph-clock-counter-clockwise"></i>
          </div>
          <div>
            <div class="history-title-row">
              <h2>Link Đã Tạo Trong Phiên Làm Việc</h2>
              <span class="history-count-badge" id="history-count-badge">0 liên kết</span>
            </div>
            <p>
              Tự động lưu trữ các tracking link & mã QR bạn đã tạo trong phiên để bạn xem lại thông số, đổi màu mã QR, sao chép hoặc kiểm thử tức thì.
            </p>
          </div>
        </div>
        <div class="history-head-actions" id="history-head-actions"></div>
      </div>
      <div id="link-history"></div>
    </section>
  </section>
  `;
}

// Cập nhật danh sách dropdown sản phẩm
function renderProductOptions(search = '') {
  if (!host) return;
  const select = host.querySelector('#link-product');
  if (!select) return;

  const q = search.trim().toLowerCase();
  const list =
    model.mode === 'empty'
      ? []
      : products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));

  select.replaceChildren(
    new Option('-- Chọn sản phẩm tiếp thị --', ''),
    ...list.map((p) => {
      const stockText = p.stock > 0 ? `Còn ${p.stock}` : 'Hết hàng';
      const statusNote = p.status === 'paused' ? ' (Tạm dừng)' : '';
      return new Option(
        `${p.name} • ${money(p.price)} • Hoa hồng ${p.rate + p.bonusRate}% [${stockText}${statusNote}]`,
        p.id
      );
    })
  );

  // Chọn lại sản phẩm hiện tại nếu còn tồn tại
  if (list.some((p) => p.id === model.product)) {
    select.value = model.product;
  } else if (list.length > 0 && model.mode !== 'empty') {
    model.product = list[0].id;
    select.value = model.product;
  } else {
    model.product = '';
    select.value = '';
  }

  const countEl = host.querySelector('#product-count');
  if (countEl) {
    if (model.mode === 'empty') {
      countEl.textContent = 'Kho hàng đang trống hoặc không có sản phẩm nào khả dụng.';
    } else if (list.length === 0) {
      countEl.textContent = `Không tìm thấy sản phẩm nào khớp với từ khóa "${search}".`;
    } else {
      countEl.textContent = `Tìm thấy ${list.length} sản phẩm phù hợp.`;
    }
  }
}

// Hiển thị chi tiết sản phẩm và bảng tính hoa hồng (Commission Calculator)
function renderProductPreview() {
  const container = host.querySelector('#product-preview-container');
  if (!container) return;

  if (model.mode === 'empty') {
    container.innerHTML = `
      <div class="empty-product-state">
        <i class="ph ph-package"></i>
        <strong>Không có sản phẩm để tiếp thị</strong>
        <span>Hãy chọn trạng thái "Bình thường" ở góc trên để nạp lại dữ liệu demo.</span>
      </div>
    `;
    return;
  }

  const p = products.find((item) => item.id === model.product);
  if (!p) {
    container.innerHTML = `
      <div class="empty-product-state">
        <i class="ph ph-cursor-click"></i>
        <span>Vui lòng chọn một sản phẩm ở danh sách trên để xem chi tiết hoa hồng.</span>
      </div>
    `;
    return;
  }

  const baseCommission = Math.round((p.price * p.rate) / 100);
  const bonusCommission = Math.round((p.price * p.bonusRate) / 100);
  const totalCommission = baseCommission + bonusCommission;
  const totalRate = p.rate + p.bonusRate;

  let stockBadge = `<span class="status"><i class="ph ph-check"></i> Còn ${p.stock} sản phẩm</span>`;
  if (p.stock === 0) {
    stockBadge = `<span class="status danger"><i class="ph ph-x-circle"></i> Hết hàng</span>`;
  } else if (p.status === 'paused') {
    stockBadge = `<span class="status warning"><i class="ph ph-pause-circle"></i> Tạm dừng chiến dịch</span>`;
  }

  container.innerHTML = `
    <div class="product-preview-card">
      <img src="${p.image}" alt="${p.name}" class="product-preview-thumb" />
      <div class="product-preview-info">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div>
            <h4>${p.name}</h4>
            <div class="product-preview-meta">
              <span>Mã SKU: <strong class="mono">${p.sku}</strong></span>
              <span>Danh mục: ${p.category}</span>
              ${stockBadge}
            </div>
          </div>
          <div class="product-price-tag">${money(p.price)}</div>
        </div>

        <!-- Bảng tính hoa hồng chi tiết -->
        <div class="commission-calc-box">
          <div class="commission-item">
            <small>Hoa hồng cơ bản (${p.rate}%)</small>
            <strong>${money(baseCommission)}</strong>
          </div>
          <div class="commission-item">
            <small>Thưởng hạng Vàng (+${p.bonusRate}%)</small>
            <strong style="color:var(--brand)">+${money(bonusCommission)}</strong>
          </div>
          <div class="commission-item highlight">
            <small>Tổng thực nhận / đơn (${totalRate}%)</small>
            <strong>${money(totalCommission)}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Vẽ mã QR thật lên Canvas bằng qrcode.js
function drawQR() {
  const canvas = host?.querySelector('#qr-canvas');
  const placeholder = host?.querySelector('#qr-placeholder');
  const meta = host?.querySelector('#qr-meta');
  const downloadBtn = host?.querySelector('#download-qr');
  const statusBadge = host?.querySelector('#qr-status-badge');

  if (!canvas) return;

  if (!model.result) {
    canvas.hidden = true;
    if (placeholder) placeholder.hidden = false;
    if (meta) meta.hidden = true;
    if (downloadBtn) downloadBtn.disabled = true;
    if (statusBadge) {
      statusBadge.textContent = 'Chờ tạo link';
      statusBadge.className = 'status neutral';
    }
    return;
  }

  if (downloadBtn) downloadBtn.disabled = false;
  feedback('qr-feedback', 'Mã QR đã sẵn sàng. Có thể quét trực tiếp hoặc tải ảnh PNG.');

  try {
    if (typeof window.qrcode !== 'function') {
      throw new Error('Thư viện tạo mã QR chưa sẵn sàng. Vui lòng tải lại trang.');
    }

    const qr = window.qrcode(0, 'M');
    qr.addData(model.result.url);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const quietZone = 4;
    const totalModules = moduleCount + quietZone * 2;
    const cellSize = Math.floor(512 / totalModules);
    const canvasSize = cellSize * totalModules;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.fillStyle = model.color;
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + quietZone) * cellSize, (r + quietZone) * cellSize, cellSize, cellSize);
        }
      }
    }

    canvas.hidden = false;
    if (placeholder) placeholder.hidden = true;
    if (meta) {
      meta.hidden = false;
      host.querySelector('#qr-product-name').textContent = model.result.product.name;
      host.querySelector('#qr-channel-name').textContent = `Kênh: ${model.result.channel.name} • Mã ref: ${model.result.code}`;
    }

    if (statusBadge) {
      statusBadge.textContent = 'Sẵn sàng quét';
      statusBadge.className = 'status';
    }
  } catch (err) {
    canvas.hidden = true;
    if (placeholder) placeholder.hidden = false;
    if (meta) meta.hidden = true;
    if (downloadBtn) downloadBtn.disabled = true;
    feedback('qr-feedback', err.message || 'Không thể vẽ mã QR.', 'error');
  }
}

// Cập nhật hiển thị kết quả tạo link
function updateResultUI() {
  if (!host) return;
  const r = model.result;
  const urlInput = host.querySelector('#generated-url');
  const shortUrlInput = host.querySelector('#generated-short-url');
  const copyBtn = host.querySelector('#copy-link');
  const copyShortBtn = host.querySelector('#copy-short-link');
  const openLink = host.querySelector('#open-link');
  const staleBanner = host.querySelector('#stale-warning');

  if (staleBanner) {
    staleBanner.hidden = !model.isStale;
  }

  if (shortUrlInput) {
    shortUrlInput.value = r ? (r.shortUrl || `https://scanms.vn/r/${r.code.toLowerCase()}`) : '';
  }

  if (urlInput) {
    urlInput.value = r?.url || '';
  }

  if (copyShortBtn) {
    copyShortBtn.disabled = !r || model.isStale;
  }

  const actionIds = ['copy-link', 'copy-short-link', 'share-system', 'share-facebook', 'share-zalo', 'share-caption'];
  actionIds.forEach((id) => {
    const el = host.querySelector('#' + id);
    if (el) el.disabled = !r || model.isStale;
  });

  if (openLink) {
    openLink.hidden = !r;
    if (r) openLink.href = r.localShortUrl || `/r/${r.code.toLowerCase()}`;
  }

  drawQR();
}

// Nạp 3 liên kết mẫu để kiểm thử UX/UI lịch sử phiên
function seedDemoHistory() {
  const p1 = products[0]; // SKIN-C15 Serum vitamin C 15%
  const p2 = products[1]; // SUN-AQUA Kem chống nắng SPF50+
  const p3 = products[3] || products[0]; // MASK-CICA

  const activeChannels = getActiveChannels();
  const c1 = activeChannels.find((c) => c.platform === 'tiktok' || c.id === 'tiktok') || activeChannels[0];
  const c2 = activeChannels.find((c) => c.platform === 'facebook' || c.id === 'facebook') || activeChannels[1] || activeChannels[0];
  const c3 = activeChannels.find((c) => c.platform === 'youtube' || c.id === 'youtube') || activeChannels[2] || activeChannels[0];

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const t1 = `${pad(now.getHours())}:${pad(Math.max(0, now.getMinutes() - 5))}`;
  const t2 = `${pad(now.getHours())}:${pad(Math.max(0, now.getMinutes() - 18))}`;
  const t3 = `${pad(now.getHours())}:${pad(Math.max(0, now.getMinutes() - 42))}`;

  const baseOrigin = location.origin || 'http://127.0.0.1:4173';
  const basePath = location.pathname || '/';

  const samples = [
    {
      code: 'R9K2N7',
      url: `${baseOrigin}${basePath}?product=${p1.id}&channel=${c1.id}&ref=R9K2N7&utm_source=${c1.id}&utm_medium=affiliate&utm_campaign=routine_sang&coupon=NHATXINH10#storefront`,
      shortUrl: 'https://scanms.vn/r/R9K2N7',
      product: p1,
      channel: c1,
      coupon: 'NHATXINH10',
      time: t1
    },
    {
      code: 'RF83M2',
      url: `${baseOrigin}${basePath}?product=${p2.id}&channel=${c2.id}&ref=RF83M2&utm_source=${c2.id}&utm_medium=affiliate&utm_campaign=deal_thang9&coupon=TUANBEAUTY10#storefront`,
      shortUrl: 'https://scanms.vn/r/RF83M2',
      product: p2,
      channel: c2,
      coupon: 'TUANBEAUTY10',
      time: t2
    },
    {
      code: 'RA19P4',
      url: `${baseOrigin}${basePath}?product=${p3.id}&channel=${c3.id}&ref=RA19P4&utm_source=${c3.id}&utm_medium=affiliate&utm_campaign=review_muathudong#storefront`,
      shortUrl: 'https://scanms.vn/r/RA19P4',
      product: p3,
      channel: c3,
      coupon: '',
      time: t3
    }
  ];

  samples.forEach((sample) => {
    if (!model.history.some((h) => h.code === sample.code)) {
      model.history.push(sample);
    }
  });

  const latest = model.history[model.history.length - 1];
  if (latest) {
    model.result = latest;
    model.product = latest.product.id;
    model.channel = latest.channel.id;
    model.coupon = latest.coupon || '';
    model.isStale = false;

    renderProductOptions();
    renderProductPreview();

    const channelSelect = host?.querySelector('#link-channel');
    if (channelSelect) channelSelect.value = model.channel;

    const couponInput = host?.querySelector('#coupon-code');
    if (couponInput) couponInput.value = model.coupon;

    updateResultUI();
  }

  renderHistory();
  feedback('generate-feedback', 'Đã nạp 3 liên kết mẫu vào lịch sử phiên làm việc thành công!');
}

// Cập nhật danh sách lịch sử link đã tạo trong phiên (Modern Fintech Redesign)
function renderHistory() {
  if (!host) return;
  const container = host.querySelector('#link-history');
  const countBadge = host.querySelector('#history-count-badge');
  const actionsContainer = host.querySelector('#history-head-actions');
  if (!container) return;

  const total = model.history.length;

  if (countBadge) {
    countBadge.textContent = `${total} liên kết`;
    countBadge.classList.toggle('has-items', total > 0);
  }

  if (actionsContainer) {
    actionsContainer.innerHTML = '';
    if (total > 0) {
      actionsContainer.innerHTML = `
        <button type="button" class="btn small secondary" id="seed-demo-history" title="Nạp thêm 3 link demo kiểm thử">
          <i class="ph ph-plus-circle"></i> Thêm mẫu
        </button>
        <button type="button" class="btn small secondary danger-ghost-btn" id="clear-history" title="Xóa toàn bộ lịch sử link trong phiên">
          <i class="ph ph-trash"></i> Xóa tất cả (${total})
        </button>
      `;
    } else {
      actionsContainer.innerHTML = `
        <button type="button" class="btn small secondary" id="seed-demo-history" title="Nạp 3 liên kết mẫu demo vào phiên">
          <i class="ph ph-magic-wand"></i> Nạp dữ liệu mẫu
        </button>
      `;
    }

    const clearBtn = actionsContainer.querySelector('#clear-history');
    if (clearBtn) {
      clearBtn.onclick = () => {
        model.history = [];
        renderHistory();
        feedback('generate-feedback', 'Đã xóa toàn bộ lịch sử link trong phiên.');
      };
    }

    const seedBtn = actionsContainer.querySelector('#seed-demo-history');
    if (seedBtn) {
      seedBtn.onclick = () => seedDemoHistory();
    }
  }

  container.replaceChildren();

  if (!total) {
    container.innerHTML = `
      <div class="history-empty-card">
        <div class="history-empty-icon-wrap">
          <i class="ph ph-link-break" aria-hidden="true"></i>
          <span class="history-empty-sparkle"><i class="ph ph-sparkle"></i></span>
        </div>
        <h3>Chưa có liên kết tiếp thị nào trong phiên</h3>
        <p>
          Khi bạn chọn sản phẩm, kênh phân phối và bấm <strong>"Tạo link tiếp thị & QR"</strong> ở trên, toàn bộ thông số sẽ được tự động lưu trữ tại đây để bạn nạp lại hoặc quét QR bất cứ lúc nào.
        </p>
        <div class="history-empty-actions">
          <button type="button" class="btn small" id="empty-cta-create">
            <i class="ph ph-link-simple-horizontal"></i> Tạo link tiếp thị ngay
          </button>
          <button type="button" class="btn small secondary" id="empty-cta-demo">
            <i class="ph ph-magic-wand"></i> Nạp 3 link mẫu kiểm thử
          </button>
        </div>
      </div>
    `;

    const ctaCreate = container.querySelector('#empty-cta-create');
    if (ctaCreate) {
      ctaCreate.onclick = () => {
        const generateBtn = host.querySelector('#generate-link');
        if (generateBtn) {
          generateBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          generateBtn.focus();
          generateBtn.click();
        }
      };
    }

    const ctaDemo = container.querySelector('#empty-cta-demo');
    if (ctaDemo) {
      ctaDemo.onclick = () => seedDemoHistory();
    }

    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'history-grid-container';

  const metaBar = document.createElement('div');
  metaBar.className = 'history-grid-meta-bar';
  metaBar.innerHTML = `
    <span>Hiển thị <strong>${total}</strong> liên kết đã tạo trong phiên • Nhấn vào thẻ để nạp lại mã QR và thông số lên bảng điều khiển</span>
  `;
  wrapper.appendChild(metaBar);

  const grid = document.createElement('div');
  grid.className = 'history-grid';

  [...model.history].reverse().forEach((item) => {
    const isActive = model.result?.code === item.code;
    const card = document.createElement('article');
    card.className = `history-card ${isActive ? 'active' : ''}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Liên kết sản phẩm ${item.product.name} mã ${item.code}`);

    const channelIcon = item.channel?.icon || 'ph-share-network';

    card.innerHTML = `
      <div class="history-card-header">
        <img src="${item.product.image || productImage}" alt="${item.product.name}" class="history-card-thumb" />
        <div class="history-card-info">
          <strong title="${item.product.name}">${item.product.name}</strong>
          <small>${item.product.sku} • ${money(item.product.price)} • Hoa hồng ${item.product.rate}%</small>
        </div>
        <div class="history-card-top-actions">
          ${isActive ? `<span class="history-active-tag"><i class="ph ph-check-circle"></i> Đang xem QR</span>` : ''}
          <button type="button" class="history-item-remove-btn" title="Xóa liên kết này" data-del-code="${item.code}">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      </div>

      <div class="history-card-tags">
        <span class="history-tag-pill channel-pill">
          <i class="ph ${channelIcon}"></i> ${item.channel.name}
        </span>
        <span class="history-tag-pill code-pill" title="Mã tracking định danh">
          <i class="ph ph-barcode"></i> ${item.code}
        </span>
        ${item.coupon ? `
          <span class="history-tag-pill coupon-pill" title="Mã ưu đãi 10%">
            <i class="ph ph-tag"></i> ${item.coupon}
          </span>
        ` : ''}
        <span class="history-tag-pill time-pill">
          <i class="ph ph-clock"></i> ${item.time}
        </span>
      </div>

      <div class="history-card-url-box" title="${item.url}">
        <span>${item.url}</span>
        <i class="ph ph-link"></i>
      </div>

      <div class="history-card-actions">
        <button type="button" class="btn small ${isActive ? 'primary' : 'secondary'} select-link-btn">
          <i class="ph ${isActive ? 'ph-check' : 'ph-arrow-counter-clockwise'}"></i> ${isActive ? 'Đang chọn' : 'Nạp lại QR'}
        </button>
        <button type="button" class="btn small secondary copy-card-link-btn" title="Sao chép đường dẫn này">
          <i class="ph ph-copy"></i> Sao chép
        </button>
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn small secondary icon-only" title="Mở trang đích mua hàng demo">
          <i class="ph ph-arrow-square-out"></i>
        </a>
      </div>
    `;

    // Click vào thẻ hoặc nút nạp lại để activate
    const activateLink = () => {
      model.result = item;
      model.product = item.product.id;
      model.channel = item.channel.id;
      model.coupon = item.coupon || '';
      model.isStale = false;

      renderProductOptions();
      renderProductPreview();

      const channelSelect = host.querySelector('#link-channel');
      if (channelSelect) channelSelect.value = model.channel;

      const couponInput = host.querySelector('#coupon-code');
      if (couponInput) couponInput.value = model.coupon;

      updateResultUI();
      renderHistory();
      feedback('generate-feedback', `Đang xem lại mã ${item.code} của sản phẩm "${item.product.name}".`);

      const qrCanvas = host.querySelector('#qr-canvas');
      if (qrCanvas && window.innerWidth <= 980) {
        qrCanvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    card.onclick = (e) => {
      if (e.target.closest('.history-item-remove-btn')) return;
      if (e.target.closest('.copy-card-link-btn')) return;
      if (e.target.closest('a')) return;
      activateLink();
    };

    const selectBtn = card.querySelector('.select-link-btn');
    if (selectBtn) {
      selectBtn.onclick = (e) => {
        e.stopPropagation();
        activateLink();
      };
    }

    const copyBtn = card.querySelector('.copy-card-link-btn');
    if (copyBtn) {
      copyBtn.onclick = (e) => {
        e.stopPropagation();
        copyToClipboard(item.url, 'generate-feedback', `Đã sao chép link mã ${item.code} vào clipboard!`);
        const origHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i class="ph ph-check"></i> Đã chép!`;
        setTimeout(() => {
          if (copyBtn.isConnected) copyBtn.innerHTML = origHtml;
        }, 1800);
      };
    }

    const removeBtn = card.querySelector('.history-item-remove-btn');
    if (removeBtn) {
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        model.history = model.history.filter((h) => h.code !== item.code);
        if (model.result?.code === item.code) {
          model.result = model.history[model.history.length - 1] || null;
          if (model.result) {
            model.product = model.result.product.id;
            model.channel = model.result.channel.id;
            model.coupon = model.result.coupon || '';
          }
          updateResultUI();
        }
        renderHistory();
        feedback('generate-feedback', `Đã xóa link mã ${item.code} khỏi lịch sử phiên.`);
      };
    }

    grid.appendChild(card);
  });

  wrapper.appendChild(grid);
  container.appendChild(wrapper);
}


// Sao chép an toàn vào Clipboard kèm fallback
async function copyToClipboard(text, feedbackId, successMsg = 'Đã sao chép vào bộ nhớ tạm thành công!') {
  let ok = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      ok = true;
    } else {
      throw new Error('Clipboard API not available');
    }
  } catch {
    // Fallback qua input selection
    try {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.focus();
      temp.select();
      ok = document.execCommand('copy');
      document.body.removeChild(temp);
    } catch {
      ok = false;
    }
  }

  if (ok) {
    feedback(feedbackId, successMsg);
    // Hiển thị trạng thái đổi nhãn nút tạm thời
    const btnText = host.querySelector('#copy-btn-text');
    if (btnText) {
      const orig = btnText.textContent;
      btnText.textContent = 'Đã sao chép! ✓';
      setTimeout(() => {
        if (btnText) btnText.textContent = orig;
      }, 2000);
    }
  } else {
    feedback(
      feedbackId,
      'Trình duyệt chặn sao chép tự động. Vui lòng nhấp chọn link trong ô và nhấn Ctrl + C.',
      'error'
    );
    const input = host.querySelector('#generated-url');
    if (input) {
      input.focus();
      input.select();
    }
  }
}

// Gán toàn bộ sự kiện tương tác
export function bindLinks(root) {
  host = root.querySelector('.link-workspace');
  if (!host) return;

  const local = host;

  // Khởi tạo giao diện
  renderProductOptions();
  renderProductPreview();

  const channelSelect = local.querySelector('#link-channel');
  if (channelSelect) channelSelect.value = model.channel;

  const modeSelect = local.querySelector('#link-mode');
  if (modeSelect) modeSelect.value = model.mode;

  const couponInput = local.querySelector('#coupon-code');
  if (couponInput) couponInput.value = model.coupon;

  updateResultUI();
  renderHistory();

  // Đánh dấu stale khi thay đổi lựa chọn
  const invalidate = () => {
    if (model.result) {
      model.isStale = true;
      updateResultUI();
      feedback(
        'generate-feedback',
        'Lựa chọn đã thay đổi! Hãy nhấn nút "Tạo link tiếp thị & QR" để cập nhật mã mới.',
        'warning'
      );
    }
  };

  // 1. Tìm kiếm sản phẩm
  local.querySelector('#product-search').oninput = (e) => {
    renderProductOptions(e.target.value);
    renderProductPreview();
    invalidate();
  };

  // 2. Thay đổi chọn sản phẩm
  local.querySelector('#link-product').onchange = (e) => {
    model.product = e.target.value;
    renderProductPreview();
    invalidate();
  };

  // 3. Thay đổi chọn kênh
  local.querySelector('#link-channel').onchange = (e) => {
    model.channel = e.target.value;
    invalidate();
  };

  // 4. Thay đổi UTM campaign
  local.querySelector('#campaign-tag').oninput = (e) => {
    model.campaign = e.target.value.trim();
    invalidate();
  };

  // 5. Chuyển đổi trạng thái thử nghiệm UX
  local.querySelector('#link-mode').onchange = (e) => {
    model.mode = e.target.value;
    model.result = null;
    model.isStale = false;
    renderProductOptions();
    renderProductPreview();
    updateResultUI();

    if (model.mode === 'error') {
      feedback('generate-feedback', 'Mất kết nối máy chủ dữ liệu sản phẩm.', 'error');
    } else if (model.mode === 'empty') {
      feedback('generate-feedback', 'Kho hàng hiện tại tạm hết sản phẩm.', 'warning');
    } else {
      feedback('generate-feedback', 'Dữ liệu kho hàng đã sẵn sàng.');
    }
  };

  // 6. NÚT TẠO LINK TIẾP THỊ
  local.querySelector('#generate-link').onclick = async () => {
    if (model.busy) return;

    const p = products.find((item) => item.id === model.product);
    const c = getActiveChannels().find((item) => item.id === model.channel) || getActiveChannels()[0];

    if (!p) {
      feedback('generate-feedback', 'Vui lòng chọn sản phẩm muốn tiếp thị trước khi tạo link.', 'error');
      return;
    }
    if (!c) {
      feedback('generate-feedback', 'Vui lòng chọn kênh phân phối dự kiến xuất bản.', 'error');
      return;
    }
    if (p.stock === 0) {
      feedback('generate-feedback', 'Sản phẩm này đã hết hàng trong kho. Không thể tạo link tiếp thị lúc này.', 'error');
      return;
    }
    if (p.status === 'paused') {
      feedback('generate-feedback', 'Sản phẩm này đang tạm dừng chiến dịch quảng bá. Vui lòng chọn sản phẩm khác.', 'error');
      return;
    }

    // Loading State
    model.busy = true;
    const btn = local.querySelector('#generate-link');
    btn.disabled = true;
    btn.innerHTML = `<i class="ph ph-spinner spin-icon" aria-hidden="true"></i> Đang khởi tạo mã định danh...`;

    await new Promise((resolve) => setTimeout(resolve, 350));

    model.busy = false;
    if (!local.isConnected) return;

    btn.disabled = false;
    btn.innerHTML = `<i class="ph ph-link-simple-horizontal" aria-hidden="true"></i> Tạo link tiếp thị & QR`;

    // Mô phỏng lỗi server
    if (model.mode === 'error') {
      feedback(
        'generate-feedback',
        'Lỗi máy chủ (Mô phỏng): Không thể cấp phát mã tracking lúc này. Hãy chuyển sang "Bình thường" và thử lại!',
        'error'
      );
      return;
    }

    // Sinh mã định danh Tracking ngẫu nhiên (Ví dụ: REF-A8K2N)
    const code = 'R' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Tạo URL demo thật mở trực tiếp storefront
    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('product', p.id);
    url.searchParams.set('channel', c.id);
    url.searchParams.set('ref', code);
    url.searchParams.set('utm_source', c.id);
    url.searchParams.set('utm_medium', 'affiliate');
    if (model.campaign) url.searchParams.set('utm_campaign', model.campaign);
    if (model.coupon) url.searchParams.set('coupon', model.coupon);
    url.hash = 'storefront';

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    model.result = {
      code,
      url: url.href,
      shortUrl: `https://scanms.vn/r/${code}`,
      product: p,
      channel: c,
      coupon: model.coupon,
      time: timeStr
    };

    model.isStale = false;
    model.history.push(model.result);

    updateResultUI();
    renderHistory();
    feedback('generate-feedback', `Đã tạo link tiếp thị và mã QR cho sản phẩm "${p.name}" trên kênh ${c.name}!`);
  };

  // 7. Sao chép link tiếp thị
  local.querySelector('#copy-link').onclick = () => {
    if (!model.result) return;
    copyToClipboard(model.result.url, 'copy-feedback', 'Đã sao chép link tiếp thị đầy đủ vào clipboard!');
  };

  // 7b. Sao chép Link Rút Gọn scanms.vn/r/{code}
  const copyShortBtn = local.querySelector('#copy-short-link');
  if (copyShortBtn) {
    copyShortBtn.onclick = () => {
      if (!model.result) return;
      const shortUrl = model.result.shortUrl || `https://scanms.vn/r/${model.result.code.toLowerCase()}`;
      copyToClipboard(shortUrl, 'copy-feedback', `Đã sao chép Link Rút Gọn (${shortUrl}) vào clipboard!`);
      const btnText = local.querySelector('#copy-short-btn-text');
      if (btnText) {
        const orig = btnText.textContent;
        btnText.textContent = 'Đã chép link! ✓';
        setTimeout(() => { if (btnText) btnText.textContent = orig; }, 2000);
      }
    };
  }

  // 9. Tải ảnh QR PNG
  local.querySelector('#download-qr').onclick = () => {
    const canvas = local.querySelector('#qr-canvas');
    if (!canvas || !model.result) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        feedback('qr-feedback', 'Không xuất được ảnh PNG. Vui lòng thử lại.', 'error');
        return;
      }
      const fileUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = `SCANMS-QR-${model.result.code}-${model.result.channel.id}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
      feedback('qr-feedback', `Đã tải xuống file "${a.download}" thành công!`);
    }, 'image/png');
  };

  // 10. Kiểm tra & Lưu Coupon
  let validatedCoupon = '';
  const couponInputEl = local.querySelector('#coupon-code');

  couponInputEl.oninput = () => {
    validatedCoupon = '';
    local.querySelector('#save-coupon').disabled = true;
    feedback('coupon-feedback', 'Nhấn "Kiểm tra mã" để xác thực tính khả dụng của mã coupon.');
  };

  local.querySelector('#check-coupon').onclick = () => {
    const raw = couponInputEl.value.trim().toUpperCase();
    couponInputEl.value = raw;
    validatedCoupon = '';
    local.querySelector('#save-coupon').disabled = true;

    if (!raw) {
      feedback('coupon-feedback', 'Vui lòng nhập mã coupon cần kiểm tra.', 'error');
      return;
    }

    if (!/^[A-Z0-9]{4,20}$/.test(raw)) {
      feedback(
        'coupon-feedback',
        'Mã không đúng định dạng: Chỉ chấp nhận 4–20 ký tự chữ in hoa không dấu hoặc số (VD: NHATXINH10).',
        'error'
      );
      return;
    }

    if (duplicateCoupons.includes(raw)) {
      feedback('coupon-feedback', `Trùng mã: Mã "${raw}" đã được KOL khác hoặc Shop đăng ký. Vui lòng chọn mã khác!`, 'error');
      return;
    }

    if (expiredCoupons.includes(raw)) {
      feedback('coupon-feedback', `Mã đã hết hạn: Chiến dịch liên kết với mã "${raw}" đã kết thúc.`, 'warning');
      return;
    }

    validatedCoupon = raw;
    local.querySelector('#save-coupon').disabled = false;
    feedback('coupon-feedback', `Mã "${raw}" hợp lệ (Giảm 10%)! Bạn có thể nhấn "Áp dụng vào Link".`);
  };

  local.querySelector('#save-coupon').onclick = () => {
    if (!validatedCoupon) return;
    model.coupon = validatedCoupon;
    local.querySelector('#save-coupon').disabled = true;
    feedback('coupon-feedback', `Đã lưu mã ưu đãi "${validatedCoupon}".`);

    // Nếu đã có kết quả link, tự động cập nhật URL và vẽ lại QR
    if (model.result) {
      const url = new URL(model.result.url);
      url.searchParams.set('coupon', model.coupon);
      model.result.url = url.href;
      model.result.coupon = model.coupon;
      updateResultUI();
      renderHistory();
      feedback('generate-feedback', `Đã gắn mã coupon "${model.coupon}" vào link và mã QR hiện tại.`);
    }
  };

  // Test coupon pills
  local.querySelectorAll('[data-test-coupon]').forEach((btn) => {
    btn.onclick = () => {
      couponInputEl.value = btn.dataset.testCoupon;
      couponInputEl.dispatchEvent(new Event('input'));
      local.querySelector('#check-coupon').click();
    };
  });

  // 11. Chia sẻ mạng xã hội
  local.querySelector('#share-system').onclick = async () => {
    if (!model.result) return;
    if (!navigator.share) {
      feedback('share-feedback', 'Thiết bị không hỗ trợ chia sẻ native. Hãy dùng Sao chép link.', 'warning');
      return;
    }
    try {
      await navigator.share({
        title: model.result.product.name,
        text: `Xem ngay ${model.result.product.name} chính hãng! Mã ưu đãi: ${model.coupon || 'KOL Special'}`,
        url: model.result.url
      });
      feedback('share-feedback', 'Đã hoàn tất chia sẻ qua thiết bị.');
    } catch (e) {
      if (e.name === 'AbortError') {
        feedback('share-feedback', 'Bạn đã đóng hộp thoại chia sẻ.');
      } else {
        feedback('share-feedback', 'Không thể mở hộp thoại chia sẻ. Vui lòng thử sao chép link.', 'error');
      }
    }
  };

  local.querySelector('#share-facebook').onclick = () => {
    if (!model.result) return;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(model.result.url)}`;
    window.open(shareUrl, 'fb-share-dialog', 'width=620,height=500,menubar=no,toolbar=no');
    feedback('share-feedback', 'Đã mở cửa sổ chia sẻ lên Facebook.');
  };

  local.querySelector('#share-zalo').onclick = () => {
    if (!model.result) return;
    const shareUrl = `https://sp.zalo.me/share_inline?link=${encodeURIComponent(model.result.url)}`;
    window.open(shareUrl, 'zalo-share-dialog', 'width=620,height=500,menubar=no,toolbar=no');
    feedback('share-feedback', 'Đã mở liên kết chia sẻ Zalo.');
  };

  local.querySelector('#share-caption').onclick = () => {
    if (!model.result) return;
    const p = model.result.product;
    const caption = `✨ ${p.name} - ${p.description}\n💰 Giá chính hãng: ${money(p.price)}\n👉 Đặt mua ngay tại: ${model.result.url}${
      model.coupon ? `\n🎁 Nhập mã ưu đãi [${model.coupon}] để được giảm thêm 10% khi thanh toán!` : ''
    }\n#SCANMS #Affiliate #${p.id} #${model.result.channel.id}`;

    copyToClipboard(caption, 'share-feedback', 'Đã sao chép nội dung bài đăng mẫu chuẩn SEO cho TikTok / Threads / Zalo!');
  };

  // 12. Xóa lịch sử link (được gắn động trong renderHistory)
  const clearHistoryBtn = local.querySelector('#clear-history');
  if (clearHistoryBtn) {
    clearHistoryBtn.onclick = () => {
      model.history = [];
      renderHistory();
      feedback('generate-feedback', 'Đã xóa danh sách lịch sử link trong phiên.');
    };
  }
}
