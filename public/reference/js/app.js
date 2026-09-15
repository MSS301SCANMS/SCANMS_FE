import { dashboard, bindDashboard, withdrawal, kolProfileScreen, bindKolProfile, kolProfileState } from './dashboard.js?v=62';
import { linksPage, bindLinks } from './links.js?v=50';
import { mediaPage, bindMedia } from './media.js?v=191';
import { samplesPage, bindSamples } from './samples.js?v=50';
import { trackingScreen, bindTracking } from './tracking.js?v=50';
import { storefrontScreen, bindStorefront } from './storefront.js?v=66';
import { marketplaceScreen, bindMarketplace } from './marketplace.js?v=15';

import {
  managerState,
  managerDashboardScreen,
  managerStoresScreen,
  managerStoreDetailScreen,
  managerBanksScreen,
  managerFraudScreen,
  managerAuditScreen,
  managerProfileScreen,
  managerProfileState,
  bindManager
} from './manager.js?v=143';

import {
  customerState,
  customerProfileScreen,
  customerOrdersScreen,
  customerOrderDetailScreen,
  customerAddressesScreen,
  customerWishlistScreen,
  customerReviewsScreen,
  customerSupportScreen,
  customerSecurityScreen,
  bindCustomer
} from './customer.js?v=6';

import {
  adminInternalAccountsScreen,
  adminRbacScreen,
  adminServiceHealthScreen,
  adminSystemConfigScreen,
  adminProfileScreen,
  bindAdmin,
  bindAdminProfile,
  adminProfileState
} from './admin.js?v=2';

import {
  shopSamplesScreen,
  shopMediaScreen,
  shopCampaignsScreen,
  shopCustomerRequestsScreen,
  shopSettingsScreen,
  shopProfileScreen,
  bindShopOps,
  bindShopProfile,
  shopProfileState
} from './shop-ops.js?v=2';

import { compressAvatarImage, safeSaveProfile } from './image-utils.js';

const productImage = "./assets/serum-hero-optimized.jpg";

const screens = [
  // ==========================================
  // 1. NHÓM CHỨC NĂNG CỘNG TÁC VIÊN / KOL (COLLABORATOR)
  // ==========================================
  { id: "kol-dashboard", label: "Tổng quan KOL", icon: "ph-chart-line-up", role: "kol" },
  { id: "links", label: "Link và QR", icon: "ph-link", role: "kol" },
  { id: "kol-coupons", label: "Mã giảm giá (Coupon)", icon: "ph-tag", role: "kol" },
  { id: "channels", label: "Kênh xã hội", icon: "ph-share-network", role: "kol" },
  { id: "media", label: "Kho nội dung", icon: "ph-images", role: "kol" },
  { id: "samples", label: "Hàng mẫu", icon: "ph-package", role: "kol" },
  { id: "kol-bonus", label: "Thưởng doanh số", icon: "ph-medal", role: "kol" },
  { id: "leaderboard", label: "Bảng vinh danh", icon: "ph-trophy", role: "kol" },
  { id: "wallet", label: "Ví của tôi", icon: "ph-wallet", role: "kol" },
  { id: "kol-profile", label: "Hồ sơ cá nhân", icon: "ph-user-gear", role: "kol" },

  // ==========================================
  // 2. NHÓM CHỨC NĂNG CHỦ SHOP (SHOP MANAGER)
  // ==========================================
  { id: "shop-dashboard", label: "Tổng quan Shop", icon: "ph-storefront", role: "shop" },
  { id: "catalog", label: "Sản phẩm & Giá", icon: "ph-cube", role: "shop" },
  { id: "shop-campaigns", label: "Chiến dịch & Hoa hồng", icon: "ph-tag", role: "shop" },
  { id: "shop-coupons", label: "Quản lý Coupon (FR-12)", icon: "ph-ticket", role: "shop" },
  { id: "commission-rules", label: "Mốc thưởng Doanh số", icon: "ph-trophy", role: "shop" },
  { id: "shop-collaborators", label: "Đội ngũ CTV", icon: "ph-users-three", role: "shop" },
  { id: "orders", label: "Đối soát đơn", icon: "ph-receipt", role: "shop" },
  { id: "payouts", label: "Duyệt chi trả", icon: "ph-bank", role: "shop" },
  { id: "shop-samples", label: "Duyệt hàng mẫu", icon: "ph-package", role: "shop" },
  { id: "shop-media", label: "Kho tài nguyên", icon: "ph-images-square", role: "shop" },
  { id: "shop-customer-requests", label: "Yêu cầu khách mua", icon: "ph-hand-waving", role: "shop" },
  { id: "fraud", label: "AI Fraud", icon: "ph-shield-warning", role: "shop" },
  { id: "shop-settings", label: "Cài đặt Shop", icon: "ph-gear", role: "shop" },
  { id: "shop-profile", label: "Hồ sơ Shop & Pháp lý", icon: "ph-identification-card", role: "shop" },

  // ==========================================
  // 3. NHÓM CHỨC NĂNG VẬN HÀNH NỀN TẢNG (SYSTEM MANAGER)
  // ==========================================
  { id: "manager-dashboard", label: "Tổng quan Vận hành", icon: "ph-gauge", role: "manager" },
  { id: "manager-stores", label: "Hồ sơ Cửa hàng", icon: "ph-buildings", role: "manager" },
  { id: "manager-store-detail", label: "Chi tiết Shop", icon: "ph-file-text", role: "manager" },
  { id: "manager-banks", label: "Cổng & Ngân hàng", icon: "ph-credit-card", role: "manager" },
  { id: "manager-fraud", label: "Kiểm soát Gian lận", icon: "ph-shield-warning", role: "manager" },
  { id: "manager-audit", label: "Nhật ký Vận hành", icon: "ph-notebook", role: "manager" },
  { id: "manager-profile", label: "Tài khoản Vận hành", icon: "ph-user", role: "manager" },

  // ==========================================
  // 4. NHÓM CHỨC NĂNG QUẢN TRỊ KỸ THUẬT (SYSTEM ADMINISTRATOR)
  // ==========================================
  { id: "admin-dashboard", label: "Tổng quan Sàn", icon: "ph-chart-polar", role: "admin" },
  { id: "admin-service-health", label: "Sức khỏe Hệ thống", icon: "ph-heartbeat", role: "admin" },
  { id: "admin-internal", label: "Tài khoản Nội bộ", icon: "ph-user-gear", role: "admin" },
  { id: "admin-rbac", label: "Ma trận Phân quyền", icon: "ph-shield-checkered", role: "admin" },
  { id: "admin-users", label: "Quản lý User & KOL", icon: "ph-users", role: "admin" },
  { id: "admin-coupons", label: "Quản trị Coupon (FR-12)", icon: "ph-tag", role: "admin" },
  { id: "admin-audit", label: "Nhật ký An ninh (Audit)", icon: "ph-lock-key", role: "admin" },
  { id: "admin-config", label: "Cấu hình Sàn", icon: "ph-sliders", role: "admin" },
  { id: "admin-profile", label: "Hồ sơ Quản trị Root", icon: "ph-shield-check", role: "admin" },

  // ==========================================
  // 5. NHÓM CHỨC NĂNG KHÁCH MUA HÀNG (CUSTOMER)
  // ==========================================
  { id: "customer-profile", label: "Tài khoản của tôi", icon: "ph-user-circle", role: "customer" },
  { id: "customer-orders", label: "Đơn hàng của tôi", icon: "ph-receipt", role: "customer" },
  { id: "customer-order-detail", label: "Chi tiết đơn hàng", icon: "ph-file-search", role: "customer" },
  { id: "customer-addresses", label: "Sổ địa chỉ", icon: "ph-map-pin", role: "customer" },
  { id: "customer-wishlist", label: "Sản phẩm đã lưu", icon: "ph-heart", role: "customer" },
  { id: "customer-reviews", label: "Đánh giá của tôi", icon: "ph-star", role: "customer" },
  { id: "customer-support", label: "Hỗ trợ đơn hàng", icon: "ph-chat-circle-dots", role: "customer" },
  { id: "customer-security", label: "Bảo mật tài khoản", icon: "ph-shield-check", role: "customer" },

  // ==========================================
  // 6. CHỨC NĂNG DÙNG CHUNG & CÔNG KHAI
  // ==========================================
  { id: "marketplace", label: "Sàn Mua Sắm", icon: "ph-storefront", role: "public" },
  { id: "storefront", label: "Trang mua hàng", icon: "ph-shopping-bag-open", role: "public" },
  { id: "tracking", label: "Tra cứu đơn", icon: "ph-map-trifold", role: "public" },
  { id: "chat", label: "Tin nhắn", icon: "ph-chats-circle", role: "both" },
  { id: "auth", label: "Đăng nhập", icon: "ph-sign-in", role: "auth" },
];

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const platformConfig = {
  tiktok: {
    name: "TikTok",
    icon: "ph-tiktok-logo",
    color: "#000000",
    bgColor: "#0000000f",
    urlPattern: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+/i,
    urlPlaceholder: "https://www.tiktok.com/@kenh_cua_ban",
    handlePlaceholder: "@kenh_cua_ban",
    followerName: "Người theo dõi"
  },
  facebook: {
    name: "Facebook Fanpage",
    icon: "ph-facebook-logo",
    color: "#1877f2",
    bgColor: "#1877f215",
    urlPattern: /^https?:\/\/(www\.)?facebook\.com\/[\w.-]+/i,
    urlPlaceholder: "https://www.facebook.com/tenfanpage",
    handlePlaceholder: "Tên Fanpage hoặc Handle",
    followerName: "Người theo dõi"
  },
  youtube: {
    name: "YouTube",
    icon: "ph-youtube-logo",
    color: "#ff0000",
    bgColor: "#ff000015",
    urlPattern: /^https?:\/\/(www\.)?youtube\.com\/(@[\w.-]+|c\/[\w.-]+|channel\/[\w.-]+)/i,
    urlPlaceholder: "https://www.youtube.com/@tenkenh",
    handlePlaceholder: "@tenkenh",
    followerName: "Người đăng ký"
  },
  instagram: {
    name: "Instagram",
    icon: "ph-instagram-logo",
    color: "#e1306c",
    bgColor: "#e1306c15",
    urlPattern: /^https?:\/\/(www\.)?instagram\.com\/[\w.-]+/i,
    urlPlaceholder: "https://www.instagram.com/ten_instagram",
    handlePlaceholder: "@ten_instagram",
    followerName: "Người theo dõi"
  },
  threads: {
    name: "Threads",
    icon: "ph-threads-logo",
    color: "#101010",
    bgColor: "#10101015",
    urlPattern: /^https?:\/\/(www\.)?threads\.net\/@[\w.-]+/i,
    urlPlaceholder: "https://www.threads.net/@ten_threads",
    handlePlaceholder: "@ten_threads",
    followerName: "Người theo dõi"
  },
  zalo: {
    name: "Zalo OA",
    icon: "ph-chat-circle-dots",
    color: "#0068ff",
    bgColor: "#0068ff15",
    urlPattern: /^https?:\/\/zalo\.me\/[\w.-]+/i,
    urlPlaceholder: "https://zalo.me/sodienthoai_hoac_oa",
    handlePlaceholder: "Số ĐT hoặc Mã Zalo OA",
    followerName: "Người quan tâm"
  }
};

function formatFollowers(num) {
  num = Number(num) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(num);
}

function formatFollowersCompact(num) {
  num = Number(num) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(".", ",").replace(/,0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(".", ",").replace(/,0$/, "") + "K";
  return String(num);
}

function formatCompactMoney(amount) {
  const n = Number(amount) || 0;
  if (n >= 1000000000) {
    return (n / 1000000000).toFixed(2).replace(".", ",").replace(/,00$/, "").replace(/,0$/, "") + " tỷ";
  }
  if (n >= 1000000) {
    const inMillions = n / 1000000;
    const formatted = inMillions >= 100
      ? inMillions.toFixed(1).replace(".", ",").replace(/,0$/, "")
      : inMillions.toFixed(2).replace(".", ",").replace(/,00$/, "").replace(/,0$/, "");
    return formatted + " tr";
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(0) + "k";
  }
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

function validateChannelUrl(platform, url) {
  if (!url || typeof url !== "string") return false;
  const cfg = platformConfig[platform];
  if (!cfg || !cfg.urlPattern) return url.startsWith("http://") || url.startsWith("https://");
  return cfg.urlPattern.test(url.trim());
}

const defaultChannels = [
  {
    id: "tiktok-official",
    platform: "tiktok",
    name: "TikTok",
    handle: "@tuanaffiliate.official",
    displayName: "Tuấn Review Công Nghệ & Tiện Ích",
    url: "https://www.tiktok.com/@tuanaffiliate.official",
    followers: 184200,
    followersFormatted: "184.2K",
    category: "Công nghệ & Tiện ích",
    isPrimary: true,
    verificationStatus: "verified",
    verificationLabel: "Đã xác minh API",
    authMethod: "oauth",
    connectedAt: "15/01/2026",
    icon: "ph-tiktok-logo",
    stats: {
      clicks: 14280,
      orders: 864,
      cvr: "6.05%",
      gmv: 182500000,
      commission: 24650000,
      topProducts: [
        { name: "Serum Vitamin C 15% Sora Skin", orders: 482, gmv: 89400000 },
        { name: "Kem chống nắng SPF50+ Ultra Light", orders: 258, gmv: 62100000 },
        { name: "Gel Rửa Mặt Dịu Nhẹ Tràm Trà", orders: 124, gmv: 31000000 }
      ]
    }
  },
  {
    id: "fb-fanpage",
    platform: "facebook",
    name: "Facebook Fanpage",
    handle: "Tuấn Review Đồ Gia Dụng Thông Minh",
    displayName: "Tuấn Review Đồ Gia Dụng Thông Minh",
    url: "https://www.facebook.com/tuanreviewgiadung",
    followers: 95000,
    followersFormatted: "95.0K",
    category: "Gia dụng & Đời sống",
    isPrimary: false,
    verificationStatus: "verified",
    verificationLabel: "Tick xanh Fanpage",
    authMethod: "oauth",
    connectedAt: "20/01/2026",
    icon: "ph-facebook-logo",
    stats: {
      clicks: 8910,
      orders: 490,
      cvr: "5.50%",
      gmv: 98400000,
      commission: 12800000,
      topProducts: [
        { name: "Nồi chiên không dầu 6L", orders: 280, gmv: 56000000 },
        { name: "Máy hút bụi cầm tay Mini", orders: 150, gmv: 31500000 },
        { name: "Đèn LED để bàn thông minh", orders: 60, gmv: 10900000 }
      ]
    }
  },
  {
    id: "youtube-channel",
    platform: "youtube",
    name: "YouTube",
    handle: "Tuấn Tech & Lifestyle Affiliate",
    displayName: "Tuấn Tech & Lifestyle Affiliate",
    url: "https://www.youtube.com/@tuantechvn",
    followers: 48200,
    followersFormatted: "48.2K",
    category: "Công nghệ & Tiện ích",
    isPrimary: false,
    verificationStatus: "pending",
    verificationLabel: "Chờ duyệt API",
    authMethod: "oauth",
    connectedAt: "02/02/2026",
    icon: "ph-youtube-logo",
    stats: {
      clicks: 4320,
      orders: 215,
      cvr: "4.98%",
      gmv: 62100000,
      commission: 8450000,
      topProducts: [
        { name: "Bàn phím cơ không dây Bluetooth", orders: 110, gmv: 35200000 },
        { name: "Chuột Ergonomic công thái học", orders: 75, gmv: 18750000 },
        { name: "Giá đỡ laptop hợp kim nhôm", orders: 30, gmv: 8150000 }
      ]
    }
  },
  {
    id: "threads-creator",
    platform: "threads",
    name: "Threads",
    handle: "@tuan.lifestyle",
    displayName: "Tuấn Daily Micro Blog",
    url: "https://www.threads.net/@tuan.lifestyle",
    followers: 16800,
    followersFormatted: "16.8K",
    category: "Phong cách sống",
    isPrimary: false,
    verificationStatus: "unverified",
    verificationLabel: "Tự khai báo",
    authMethod: "manual",
    connectedAt: "10/02/2026",
    icon: "ph-threads-logo",
    stats: {
      clicks: 1250,
      orders: 62,
      cvr: "4.96%",
      gmv: 14200000,
      commission: 1950000,
      topProducts: [
        { name: "Sổ tay kế hoạch Daily Planner", orders: 35, gmv: 7000000 },
        { name: "Bình giữ nhiệt phong cách Bắc Âu", orders: 27, gmv: 7200000 }
      ]
    }
  },
  {
    id: "instagram-account",
    platform: "instagram",
    name: "Instagram",
    handle: "@tuan.affiliate.creator",
    displayName: "Tuấn Creator & Deals",
    url: "https://www.instagram.com/tuan.affiliate.creator",
    followers: 24500,
    followersFormatted: "24.5K",
    category: "Thời trang & Phụ kiện",
    isPrimary: false,
    verificationStatus: "unverified",
    verificationLabel: "Tự khai báo",
    authMethod: "manual",
    connectedAt: "14/02/2026",
    icon: "ph-instagram-logo",
    stats: {
      clicks: 2180,
      orders: 110,
      cvr: "5.05%",
      gmv: 23600000,
      commission: 3100000,
      topProducts: [
        { name: "Áo Polo Nam Co Giãn Form Regular", orders: 65, gmv: 14300000 },
        { name: "Kính râm chống tia UV cao cấp", orders: 45, gmv: 9300000 }
      ]
    }
  }
];

let savedChannels = null;
try {
  const parsed = JSON.parse(localStorage.getItem("scanms-channels"));
  if (Array.isArray(parsed) && parsed.length > 0) savedChannels = parsed;
} catch (e) { }

const rawHash = location.hash.replace("#", "");
const isRegHash = rawHash === "register" || rawHash === "auth-register";
const isLoginHash = rawHash === "login" || rawHash === "auth" || rawHash === "auth-login";
const isMarketplaceHash = rawHash === "" || rawHash === "marketplace" || rawHash === "home";

// Khởi tạo role từ localStorage hoặc suy luận từ màn hình hiện tại
let initialRole = "shop";
try {
  const savedRole = localStorage.getItem("scanms-current-role");
  if (savedRole) initialRole = savedRole;
} catch (e) { }

const targetFromHash = screens.find((s) => s.id === rawHash);
if (targetFromHash && targetFromHash.role && targetFromHash.role !== "both" && targetFromHash.role !== "public" && targetFromHash.role !== "auth") {
  initialRole = targetFromHash.role;
  try { localStorage.setItem("scanms-current-role", initialRole); } catch (e) { }
}

let savedScreen = null;
try { savedScreen = localStorage.getItem("scanms-current-screen"); } catch (e) { }

let savedPendingShop = null;
try {
  const raw = localStorage.getItem("scanms-pending-shop");
  if (raw) savedPendingShop = JSON.parse(raw);
} catch (e) { }

let savedLastRegEmail = null;
try {
  savedLastRegEmail = localStorage.getItem("scanms-last-reg-email");
} catch (e) { }

if (savedPendingShop && !managerState.stores.some(s => s.id === savedPendingShop.id)) {
  managerState.stores.unshift(savedPendingShop);
}

let state = {
  screen: (isRegHash || isLoginHash) ? "auth" : (rawHash ? rawHash : (savedScreen || getDefaultScreenForRole(initialRole))),
  theme: localStorage.getItem("scanms-theme") || "light",
  role: initialRole,
  authMode: isRegHash ? "register" : "login", // 'login' | 'register'
  loginFeatureTab: "link-qr", // 'link-qr' | 'team-mgmt' | 'commission'
  search: "",
  navScrollTop: 0,
  navScrollLeft: 0,
  pendingShop: savedPendingShop,
  lastRegisteredEmail: savedLastRegEmail,
  lastRegisteredRole: savedPendingShop ? "shop" : (savedLastRegEmail ? "kol" : null),
  currentStore: savedPendingShop || null,
  regData: {
    name: "",
    email: "",
    phone: "",
    handle: "",
    shopName: "",
    password: "",
    confirm: "",
    terms: false
  },
  // Channels state
  channels: savedChannels || defaultChannels,
  channelSearch: "",
  channelPlatformFilter: "all",
  channelStatusFilter: "all",
  channelSort: "followers_desc",
};

function saveCurrentRegFormValues(root) {
  if (!root) return;
  const nameInput = root.querySelector("#reg-name");
  if (nameInput) {
    if (!state.regData) state.regData = {};
    state.regData.name = nameInput.value;
    state.regData.email = root.querySelector("#reg-email")?.value || "";
    state.regData.phone = root.querySelector("#reg-phone")?.value || "";
    const handleInput = root.querySelector("#reg-handle");
    if (handleInput) state.regData.handle = handleInput.value;
    const shopInput = root.querySelector("#reg-shop-name");
    if (shopInput) state.regData.shopName = shopInput.value;
    state.regData.password = root.querySelector("#reg-password")?.value || "";
    state.regData.confirm = root.querySelector("#reg-confirm")?.value || "";
    state.regData.terms = root.querySelector("#reg-terms")?.checked || false;
  }
}

window.__SCANMS_CHANNELS__ = state.channels;

function persistChannels() {
  try {
    localStorage.setItem("scanms-channels", JSON.stringify(state.channels));
  } catch (e) { }
  window.__SCANMS_CHANNELS__ = state.channels;
}

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;
const icon = (name) => `<i class="ph ${name}" aria-hidden="true"></i>`;
const status = (text, tone = "") => `<span class="status ${tone}">${text}</span>`;

function header(title, description, actions = "") {
  return `<header class="page-head"><div><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="actions">${actions}</div>` : ""}</header>`;
}

function kpi(title, value, trend, iconName, down = false) {
  return `<article class="card kpi"><div class="kpi-icon">${icon(iconName)}</div><div><small>${title}</small><strong>${value}</strong><span class="trend ${down ? "down" : ""}">${trend}</span></div></article>`;
}

function bars(valuesA, valuesB) {
  return `<div class="chart" aria-label="Biểu đồ hiệu suất 7 ngày">${valuesA.map((v, i) => `<div class="chart-col"><span class="chart-bar" style="height:${v}%"></span><span class="chart-bar alt" style="height:${valuesB[i]}%"></span><label>T${i + 2}</label></div>`).join("")}</div>`;
}

function feedRow(iconName, title, subtitle, amount, minus = false) {
  return `<div class="feed-row"><div class="feed-icon">${icon(iconName)}</div><div><strong>${title}</strong><p>${subtitle}</p></div><span class="amount ${minus ? "minus" : ""}">${amount}</span></div>`;
}

const LOGIN_SHOWCASE_FEATURES = {
  "link-qr": {
    id: "link-qr",
    tabLabel: "Tạo link & QR",
    tabIcon: "ph-qr-code",
    badge: "Công Nghệ Định Danh",
    title: "Tạo link định danh & mã QR tiếp thị tức thì",
    desc: "Tự động gắn mã giới thiệu cá nhân vào link sản phẩm, phát hành mã VietQR động hỗ trợ quét mua hàng và đối soát chính xác theo thời gian thực.",
    visual: () => `
      <div class="sc-card sc-card-link">
        <div class="sc-link-head">
          <div class="sc-chip-gold"><i class="ph ph-sparkle"></i> Smart Link Generator</div>
          <span class="sc-status-pill"><span class="sc-live-dot"></span> Sẵn sàng phân phối</span>
        </div>
        <div class="sc-product-row">
          <div class="sc-prod-avatar"><i class="ph ph-drop"></i></div>
          <div class="sc-prod-body">
            <strong>Serum Cica Calming B5 (50ml)</strong>
            <small>Giá niêm yết: 450.000 đ • Hoa hồng CTV: 18% (81.000 đ)</small>
          </div>
        </div>
        <div class="sc-url-box">
          <span class="sc-url-text">https://scanms.vn/l/kol99-serum-b5</span>
          <span class="sc-copy-badge"><i class="ph ph-copy"></i> 1-Chạm</span>
        </div>
        <div class="sc-qr-showcase">
          <div class="sc-qr-graphic">
            <div class="sc-qr-pattern">
              <i class="ph ph-qr-code"></i>
            </div>
            <div class="sc-qr-center-emblem">
              <i class="ph ph-shield-check"></i>
            </div>
          </div>
          <div class="sc-qr-info">
            <strong>VietQR Động Gắn Mã CTV</strong>
            <small>Khách quét mua qua app ngân hàng được tự động ghi nhận hoa hồng tức thì.</small>
          </div>
        </div>
        <div class="sc-link-footer">
          <span><i class="ph ph-cookie"></i> Cookie lưu vết 30 ngày</span>
          <span class="sc-sep">•</span>
          <span><i class="ph ph-fingerprint"></i> Phân bổ Last-Click minh bạch</span>
        </div>
      </div>
    `
  },
  "team-mgmt": {
    id: "team-mgmt",
    tabLabel: "Quản lý đội ngũ",
    tabIcon: "ph-tree-structure",
    badge: "Quản Trị Mạng Lưới",
    title: "Mô hình mạng lưới phân cấp & theo dõi thành viên",
    desc: "Trực quan hóa sơ đồ cộng tác viên đa tầng, cập nhật thứ hạng năng động và phân quyền vận hành minh bạch cho từng nhóm bán hàng.",
    visual: () => `
      <div class="sc-card sc-card-team">
        <div class="sc-tree-box">
          <!-- Root Leader -->
          <div class="sc-tree-leader">
            <div class="sc-leader-badge"><i class="ph ph-crown"></i></div>
            <div class="sc-leader-info">
              <strong>Trưởng Nhóm KOL (Cấp Kim Cương)</strong>
              <small>Doanh số nhóm: 185.000.000 đ • Thưởng tầng 5%</small>
            </div>
            <span class="sc-rank-tag">Trưởng Nhóm</span>
          </div>
          <!-- Connector Tree -->
          <div class="sc-tree-connectors">
            <div class="sc-tree-stem"></div>
            <div class="sc-tree-branch-bar">
              <div class="sc-branch-leg"></div>
              <div class="sc-branch-leg"></div>
              <div class="sc-branch-leg"></div>
            </div>
          </div>
          <!-- Tier Nodes -->
          <div class="sc-tier-nodes">
            <div class="sc-node-box">
              <div class="sc-node-icon gold"><i class="ph ph-medal"></i></div>
              <div class="sc-node-meta">
                <strong>CTV Cấp Vàng</strong>
                <small>142 đơn • 28.5M</small>
              </div>
            </div>
            <div class="sc-node-box">
              <div class="sc-node-icon silver"><i class="ph ph-shield-star"></i></div>
              <div class="sc-node-meta">
                <strong>CTV Cấp Bạc</strong>
                <small>89 đơn • 14.2M</small>
              </div>
            </div>
            <div class="sc-node-box">
              <div class="sc-node-icon bronze"><i class="ph ph-user-plus"></i></div>
              <div class="sc-node-meta">
                <strong>Thành Viên Mới</strong>
                <small>24 đơn • 4.8M</small>
              </div>
            </div>
          </div>
        </div>
        <!-- Summary Stats Strip -->
        <div class="sc-team-metric-strip">
          <div class="sc-t-item"><i class="ph ph-users-three"></i> <div><strong>48 CTV</strong><small>Đang hoạt động</small></div></div>
          <div class="sc-t-div"></div>
          <div class="sc-t-item"><i class="ph ph-trend-up"></i> <div><strong class="sc-gold">+24.8%</strong><small>Tăng trưởng</small></div></div>
          <div class="sc-t-div"></div>
          <div class="sc-t-item"><i class="ph ph-lock-key"></i> <div><strong>RBAC</strong><small>Phân quyền tự động</small></div></div>
        </div>
      </div>
    `
  },
  "commission": {
    id: "commission",
    tabLabel: "Đối soát hoa hồng",
    tabIcon: "ph-receipt",
    badge: "Tự Động Khớp Lệnh",
    title: "Tự động hóa đối soát & chi trả hoa hồng 24/7",
    desc: "Khớp lệnh hoa hồng tự động khi đơn hàng hoàn tất, minh bạch từng giao dịch và hỗ trợ rút tiền nhanh chóng qua ngân hàng.",
    visual: () => `
      <div class="sc-card sc-card-comm">
        <!-- Balance Overview -->
        <div class="sc-comm-balance-card">
          <div class="sc-bal-left">
            <span class="sc-bal-title">Hoa hồng khả dụng</span>
            <div class="sc-bal-number">18.450.000 <span class="sc-bal-cur">đ</span></div>
          </div>
          <div class="sc-bal-badge">
            <i class="ph ph-bank"></i>
            <span>VietQR Rút 24/7</span>
          </div>
        </div>
        <!-- Live Ledger -->
        <div class="sc-ledger-card">
          <div class="sc-ledger-item">
            <div class="sc-l-icon success"><i class="ph ph-check-circle"></i></div>
            <div class="sc-l-text">
              <strong>Đơn #DH-8921 • Serum Cica B5</strong>
              <small>Giao thành công • Tự động đối soát</small>
            </div>
            <span class="sc-l-val plus">+125.000 đ</span>
          </div>
          <div class="sc-ledger-item">
            <div class="sc-l-icon success"><i class="ph ph-check-circle"></i></div>
            <div class="sc-l-text">
              <strong>Đơn #DH-8922 • Combo Trị Mụn BHA</strong>
              <small>Giao thành công • Tự động đối soát</small>
            </div>
            <span class="sc-l-val plus">+340.000 đ</span>
          </div>
          <div class="sc-ledger-item">
            <div class="sc-l-icon payout"><i class="ph ph-arrow-up-right"></i></div>
            <div class="sc-l-text">
              <strong>Rút tiền về Vietcombank</strong>
              <small>Xác thực sinh trắc học • Tức thì</small>
            </div>
            <span class="sc-l-val minus">-5.000.000 đ</span>
          </div>
        </div>
        <div class="sc-comm-audit-foot">
          <i class="ph ph-shield-check"></i>
          <span>Khớp lệnh đối soát tự động 24/7 • Báo cáo sao kê chuẩn kiểm toán</span>
        </div>
      </div>
    `
  }
};

function switchLoginShowcase(tabId) {
  if (!LOGIN_SHOWCASE_FEATURES[tabId]) return;
  state.loginFeatureTab = tabId;
  const feat = LOGIN_SHOWCASE_FEATURES[tabId];

  // Update nav tabs
  document.querySelectorAll("[data-login-tab]").forEach(b => {
    const isAct = b.dataset.loginTab === tabId;
    b.classList.toggle("active", isAct);
    b.setAttribute("aria-selected", isAct ? "true" : "false");
  });

  const titleEl = document.getElementById("login-sc-title");
  const descEl = document.getElementById("login-sc-desc");
  const stageInner = document.getElementById("login-sc-stage-inner");

  if (titleEl && descEl && stageInner) {
    stageInner.classList.add("sc-anim-exit");
    titleEl.classList.add("sc-anim-exit");
    descEl.classList.add("sc-anim-exit");

    setTimeout(() => {
      titleEl.textContent = feat.title;
      descEl.textContent = feat.desc;
      stageInner.innerHTML = feat.visual();

      stageInner.classList.remove("sc-anim-exit");
      titleEl.classList.remove("sc-anim-exit");
      descEl.classList.remove("sc-anim-exit");
      stageInner.classList.add("sc-anim-enter");
      titleEl.classList.add("sc-anim-enter");
      descEl.classList.add("sc-anim-enter");

      setTimeout(() => {
        stageInner.classList.remove("sc-anim-enter");
        titleEl.classList.remove("sc-anim-enter");
        descEl.classList.remove("sc-anim-enter");
      }, 280);
    }, 100);
  }
}

function authScreen() {
  const isRegister = state.authMode === "register";
  // Admin và System Manager không được đăng ký công khai -> Chỉ cho phép KOL/CTV, Shop hoặc Customer đăng ký
  if (isRegister && (state.role === "admin" || state.role === "manager")) {
    state.role = "kol";
  }

  const isKol = state.role === "kol";
  const isShop = state.role === "shop";
  const isCustomer = state.role === "customer";
  const isManager = state.role === "manager";
  const isAdmin = state.role === "admin";

  let artBadgeText = "Chuẩn Đề Án FA26SE032 • Quản Trị Mạng Lưới CTV Toàn Diện";
  let artTitleHtml = `Quản trị mạng lưới CTV <span class="art-hl">& bứt phá doanh số tiếp thị.</span>`;
  let artDesc = "Không gian hợp nhất kết nối hàng ngàn cộng tác viên bán hàng, phát hành link & QR định danh, đối soát hoa hồng minh bạch và mở rộng kênh phân phối vượt trội.";

  let artStat1 = "Đa Nền Tảng";
  let artStatLabel1 = "TikTok, Shopee, Web";
  let artStatIcon1 = "ph-arrows-split";
  let artStatTrend1 = "Shopee, TikTok, Web";

  let artStat2 = "Đối Soát 100%";
  let artStatLabel2 = "Tự động khớp đơn";
  let artStatIcon2 = "ph-shield-check";
  let artStatTrend2 = "Khớp trạng thái giao";

  let artStat3 = "Cookie 30 Ngày";
  let artStatLabel3 = "Lưu vết Last-Click";
  let artStatIcon3 = "ph-cookie";
  let artStatTrend3 = "Mô hình Last-Click";

  let previewCardTitle = "Công nghệ định danh tiếp thị";
  let previewCardAmount = "Dynamic QR & Smart Link";
  let previewCardBadge = "Công Nghệ Định Danh";
  let previewCardBadgeIcon = "ph-qr-code";
  let previewCardSub = "Tự động gán mã CTV & tracking đa kênh";
  let previewMetricTitle = "Quản lý hoa hồng và phân cấp CTV minh bạch";
  let previewMetricValue = "Sơ Đồ Phân Cấp & Đối Soát";
  let previewMetricTrend = "Tự động 24/7";
  let previewTag1 = "Định Danh CTV Đa Kênh";
  let previewTag2 = "QR Động 1 Chạm";
  let previewTag3 = "Đối Soát Tự Động 100%";

  if (isRegister) {
    if (isKol) {
      artBadgeText = "Gia nhập đội ngũ CTV bán hàng & Tiếp thị liên kết 2026";
      artTitleHtml = `Khởi đầu sự nghiệp <span class="art-hl">CTV bán hàng & Affiliate.</span>`;
      artDesc = "Đăng ký chỉ 1 phút. Nhận ngay kho sản phẩm hoa hồng cao, công cụ tạo link & QR tiếp thị động và chính sách chi trả hoa hồng tự động 24/7.";
      artStat1 = "Kích Hoạt 0Đ";
      artStatLabel1 = "Miễn phí hoàn toàn";
      artStatIcon1 = "ph-sparkle";
      artStatTrend1 = "Kích hoạt 0Đ";
      artStat2 = "Kho Hàng Mở";
      artStatLabel2 = "500+ sản phẩm mẫu";
      artStatIcon2 = "ph-tote";
      artStatTrend2 = "Sẵn sàng liên kết";
      artStat3 = "Chi Trả 24/7";
      artStatLabel3 = "Nhận tiền qua VietQR";
      artStatIcon3 = "ph-bank";
      artStatTrend3 = "Qua VietQR";

      previewCardTitle = "Bệ phóng khởi nghiệp CTV";
      previewCardAmount = "Kích Hoạt Tài Khoản 0Đ";
      previewCardBadge = "Gia Nhập Hệ Thống";
      previewCardBadgeIcon = "ph-user-plus";
      previewCardSub = "Cấp ngay bộ công cụ tạo link & QR tiếp thị động";
      previewMetricTitle = "Cấu hình theo danh mục sản phẩm & cấp bậc CTV";
      previewMetricValue = "Chính Sách Linh Hoạt Đa Tầng";
      previewMetricTrend = "Minh bạch 100%";
      previewTag1 = "Kích Hoạt Tức Thì";
      previewTag2 = "Tạo Link QR 1 Chạm";
      previewTag3 = "Hoa Hồng Tự Động";
    } else if (isCustomer) {
      artBadgeText = "Tài khoản Mua sắm & Tích điểm Ưu đãi Độc quyền";
      artTitleHtml = `Mua sắm thông minh, <span class="art-hl">nhận voucher ưu đãi từ KOL.</span>`;
      artDesc = "Theo dõi hành trình đơn hàng chi tiết (GHN/GHTK), lưu sổ địa chỉ giao hàng tiện lợi và bảo đảm quyền đổi trả hàng miễn phí trong 14 ngày.";
      artStat1 = "Đồng Kiểm";
      artStatLabel1 = "Kiểm hàng khi nhận";
      artStatIcon1 = "ph-box";
      artStatTrend1 = "Đồng kiểm an toàn";
      artStat2 = "Đổi Trả 14N";
      artStatLabel2 = "Miễn phí toàn quốc";
      artStatIcon2 = "ph-arrow-u-down-left";
      artStatTrend2 = "14 ngày bảo đảm";
      artStat3 = "Voucher KOL";
      artStatLabel3 = "Giảm giá độc quyền";
      artStatIcon3 = "ph-tag";
      artStatTrend3 = "Mã độc quyền";

      previewCardTitle = "Bảo chứng mua hàng chính hãng";
      previewCardAmount = "Tài Khoản Mua Sắm Cá Nhân";
      previewCardBadge = "Khách Mua Hàng";
      previewCardBadgeIcon = "ph-shopping-bag";
      previewCardSub = "Tra cứu đơn hàng, lưu sổ địa chỉ và đánh giá";
      previewMetricTitle = "Miễn phí đổi trả 14 ngày nếu lỗi từ nhà sản xuất";
      previewMetricValue = "Bảo Đảm An Toàn Mua Sắm";
      previewMetricTrend = "Bảo vệ người mua";
      previewTag1 = "Theo Dõi Vận Đơn";
      previewTag2 = "Sổ Địa Chỉ Thông Minh";
      previewTag3 = "Đổi Trả 14 Ngày";
    } else {
      artBadgeText = "Giải pháp mở rộng kênh phân phối CTV cho Doanh nghiệp";
      artTitleHtml = `Xây dựng đội ngũ CTV <span class="art-hl">bán hàng đa kênh cho Shop.</span>`;
      artDesc = "Mở gian hàng liên kết để kết nối hàng ngàn CTV bán hàng, cấu hình hoa hồng bậc thang linh hoạt và tự động hóa toàn bộ khâu đối soát thanh toán.";
      artStat1 = "Tăng Trưởng";
      artStatLabel1 = "Mở rộng mạng lưới CTV";
      artStatIcon1 = "ph-rocket-launch";
      artStatTrend1 = "Mô hình Affiliate";
      artStat2 = "Đa Nền Tảng";
      artStatLabel2 = "Đồng bộ đơn tự động";
      artStatIcon2 = "ph-arrows-split";
      artStatTrend2 = "Shopee & TikTok";
      artStat3 = "0 Rủi Ro";
      artStatLabel3 = "Chỉ trả phí khi có đơn";
      artStatIcon3 = "ph-shield-check";
      artStatTrend3 = "Chuẩn mô hình CPS";

      previewCardTitle = "Phát triển kênh CTV bán hàng";
      previewCardAmount = "Mở Rộng Kênh Phân Phối";
      previewCardBadge = "Phủ Sóng Đa Kênh";
      previewCardBadgeIcon = "ph-storefront";
      previewCardSub = "Tối ưu chi phí quảng cáo, chỉ trả phí khi giao thành công";
      previewMetricTitle = "Chuẩn hóa quy trình khớp đơn và xử lý hoàn hủy";
      previewMetricValue = "Tự Động Hóa Đối Soát";
      previewMetricTrend = "Chính xác tuyệt đối";
      previewTag1 = "Đa Sàn TikTok & Shopee";
      previewTag2 = "Tạm Giữ An Toàn 14 Ngày";
      previewTag3 = "Cấu Hình Bậc Thang";
    }
  } else {
    if (isShop) {
      artBadgeText = "Hệ thống Quản trị CTV & Tăng trưởng doanh số Shop";
      artTitleHtml = `Mở rộng mạng lưới CTV, <span class="art-hl">tăng trưởng doanh thu đột phá.</span>`;
      artDesc = "Theo dõi doanh số và đơn hàng từ hàng trăm CTV bán hàng, thiết lập hoa hồng bậc thang linh hoạt và tự động hóa 100% quy trình đối soát chi trả.";
      artStat1 = "Thời Gian Thực";
      artStatLabel1 = "Theo dõi đơn & GMV";
      artStatIcon1 = "ph-chart-line-up";
      artStatTrend1 = "Real-time Dashboard";
      artStat2 = "Cây Đội Ngũ";
      artStatLabel2 = "Phân tầng cấp bậc CTV";
      artStatIcon2 = "ph-tree-structure";
      artStatTrend2 = "Phân tầng cấp bậc";
      artStat3 = "Tạm Giữ 14 Ngày";
      artStatLabel3 = "Bảo vệ an toàn vốn";
      artStatIcon3 = "ph-lock-key";
      artStatTrend3 = "Bảo vệ vốn hàng";

      previewCardTitle = "Kết nối bán hàng đa nền tảng";
      previewCardAmount = "Đồng Bộ Đơn Hàng Đa Sàn";
      previewCardBadge = "Kết Nối Bán Hàng";
      previewCardBadgeIcon = "ph-storefront";
      previewCardSub = "Liên kết TikTok Shop, Shopee & Website bán hàng";
      previewMetricTitle = "Tạm giữ 14 ngày an toàn, bảo vệ vốn gian hàng";
      previewMetricValue = "Khớp Đơn & Kiểm Soát Hoàn Hủy";
      previewMetricTrend = "Tự động 100%";
      previewTag1 = "Đa Sàn TikTok/Shopee";
      previewTag2 = "Tạm Giữ 14 Ngày";
      previewTag3 = "Hoa Hồng Linh Hoạt";
    } else if (isManager) {
      artBadgeText = "Trung tâm Điều phối Vận hành Sàn (Platform Operations)";
      artTitleHtml = `Vận hành chuẩn hóa, <span class="art-hl">duyệt Shop & kiểm soát gian lận.</span>`;
      artDesc = "Thẩm định hồ sơ pháp lý gian hàng Shop theo luồng 4 trạng thái chuẩn, quản lý danh mục ngân hàng VietQR/Napas và xử lý cảnh báo AI Fraud Sentinel.";
      artStat1 = "Thẩm Định";
      artStatLabel1 = "Luồng 4 trạng thái";
      artStatIcon1 = "ph-buildings";
      artStatTrend1 = "Quy trình 4 bước";
      artStat2 = "Ngân Hàng";
      artStatLabel2 = "VietQR/Napas Sandbox";
      artStatIcon2 = "ph-bank";
      artStatTrend2 = "Sandbox Simulator";
      artStat3 = "Anti-Fraud";
      artStatLabel3 = "AI Sentinel 24/7";
      artStatIcon3 = "ph-shield-warning";
      artStatTrend3 = "Tự động phát hiện";

      previewCardTitle = "Trung tâm Vận hành Nền tảng";
      previewCardAmount = "Xét Duyệt & Điều Phối Sàn";
      previewCardBadge = "Vận Hành Nền Tảng";
      previewCardBadgeIcon = "ph-gauge";
      previewCardSub = "Duyệt hồ sơ Shop, quản lý ngân hàng và xử lý gian lận";
      previewMetricTitle = "AI cảnh báo rủi ro, chuyên viên vận hành ra quyết định";
      previewMetricValue = "Kiểm Soát Rủi Ro 24/7";
      previewMetricTrend = "Tuân thủ chặt chẽ";
      previewTag1 = "Thẩm Định GPKD 4 Bước";
      previewTag2 = "Cổng Ngân Hàng VietQR";
      previewTag3 = "AI Fraud Sentinel";
    } else if (isAdmin) {
      artBadgeText = "Trung tâm Quản trị Kỹ thuật & Giám sát Toàn Sàn";
      artTitleHtml = `Bảo chứng an ninh, <span class="art-hl">RBAC & Sức khỏe toàn hệ thống.</span>`;
      artDesc = "Giám sát sức khỏe hạ tầng (Uptime 99.98%), quản lý tài khoản nội bộ, ma trận phân quyền 5 vai trò và lưu vết kiểm toán Audit Trail bất biến.";
      artStat1 = "Minh Bạch Sàn";
      artStatLabel1 = "Kiểm toán luồng tiền";
      artStatIcon1 = "ph-vault";
      artStatTrend1 = "Kiểm toán độc lập";
      artStat2 = "Phân Quyền";
      artStatLabel2 = "RBAC 5 vai trò chuẩn";
      artStatIcon2 = "ph-user-gear";
      artStatTrend2 = "RBAC 5 vai trò";
      artStat3 = "Bảo Mật Kép";
      artStatLabel3 = "Mã hóa JWT & Bcrypt";
      artStatIcon3 = "ph-shield-check";
      artStatTrend3 = "Mã hóa JWT & Bcrypt";

      previewCardTitle = "Hạ tầng giám sát toàn diện";
      previewCardAmount = "Giám Sát & Điều Phối Luồng Tiền";
      previewCardBadge = "Hạ Tầng Hệ Thống";
      previewCardBadgeIcon = "ph-cpu";
      previewCardSub = "Bảo chứng minh bạch luồng tiền và kiểm toán độc lập";
      previewMetricTitle = "Ngăn chặn click ảo, phát hiện IP bất thường tự động";
      previewMetricValue = "Bộ Lọc Chống Gian Lận (Anti-Fraud)";
      previewMetricTrend = "Chống click ảo";
      previewTag1 = "Mã Hóa JWT Đa Tầng";
      previewTag2 = "Uptime SLA 99.98%";
      previewTag3 = "Audit Trail Bất Biến";
    } else if (isCustomer) {
      artBadgeText = "Không gian Khách hàng & Quản lý Đơn Mua Sắm";
      artTitleHtml = `Theo dõi đơn hàng, <span class="art-hl">sổ địa chỉ & đánh giá tiện lợi.</span>`;
      artDesc = "Tra cứu hành trình vận chuyển chi tiết, quản lý sổ địa chỉ giao hàng và nhận mã voucher độc quyền từ các đối tác KOL/KOC.";
      artStat1 = "Tiến Trình";
      artStatLabel1 = "Timeline GHN/GHTK";
      artStatIcon1 = "ph-truck";
      artStatTrend1 = "Tra cứu chi tiết";
      artStat2 = "Địa Chỉ";
      artStatLabel2 = "Lưu nhiều địa chỉ";
      artStatIcon2 = "ph-map-pin";
      artStatTrend2 = "Điền nhanh 1 chạm";
      artStat3 = "Đổi Trả";
      artStatLabel3 = "Bảo đảm 14 ngày";
      artStatIcon3 = "ph-shield-check";
      artStatTrend3 = "Chính hãng 100%";

      previewCardTitle = "Mua sắm thông minh cùng SCANMS";
      previewCardAmount = "Tài Khoản Thành Viên VIP";
      previewCardBadge = "Khách Mua Hàng";
      previewCardBadgeIcon = "ph-shopping-bag";
      previewCardSub = "Đơn hàng được lưu tự động, theo dõi trực quan";
      previewMetricTitle = "Đánh giá chất lượng sản phẩm sau khi nhận hàng";
      previewMetricValue = "Đánh Giá Thực Tế 100%";
      previewMetricTrend = "Khách quan minh bạch";
      previewTag1 = "Vận Chuyển Toàn Quốc";
      previewTag2 = "Voucher Giảm 10%";
      previewTag3 = "Hỗ Trợ Nhanh Chóng";
    }
  }

  const roleNameMap = {
    kol: "Cộng Tác Viên (KOL / CTV)",
    shop: "Chủ Cửa Hàng",
    customer: "Khách Mua Hàng",
    manager: "Vận Hành Sàn",
    admin: "Quản Trị Hệ Thống"
  };
  const roleName = roleNameMap[state.role] || "Thành viên";

  const demoEmailMap = {
    kol: "demo@scanms.vn",
    shop: "shop@scanms.vn",
    customer: "customer@scanms.vn",
    manager: "manager@scanms.vn",
    admin: "admin@scanms.vn"
  };
  const isLastRegRoleMatch = Boolean(state.lastRegisteredRole === state.role && state.lastRegisteredEmail);
  const demoEmail = isLastRegRoleMatch ? state.lastRegisteredEmail : (demoEmailMap[state.role] || "demo@scanms.vn");
  const defaultPasswordVal = isLastRegRoleMatch ? "" : "12345678";

  const heroImageSrc = isRegister ? "./assets/affiliate-register-onboarding-3d.jpg" : "./assets/affiliate-ecosystem-3d.jpg";
  const heroImageAlt = isRegister ? "Khởi đầu sự nghiệp CTV bán hàng và tiếp thị liên kết SCANMS" : "Hệ sinh thái Quản lý CTV và Tiếp thị liên kết SCANMS";
  const badgeTopTag = previewCardBadge;
  const badgeTopVal = previewCardAmount;
  const badgeTopSub = previewCardSub;
  const badgeBottomTag = isRegister ? "Chính Sách Hoa Hồng" : (isShop ? "Đối Soát Tự Động" : (isAdmin ? "An Ninh & Bảo Mật" : (isManager ? "Thẩm Định Shop" : "Quản Trị Đội Ngũ")));
  const badgeBottomVal = previewMetricValue;
  const badgeBottomSub = previewMetricTitle;
  const badgeIcon1 = isRegister ? "ph-user-plus" : (isKol ? "ph-qr-code" : (isShop ? "ph-storefront" : (isManager ? "ph-gauge" : (isAdmin ? "ph-cpu" : "ph-shopping-bag"))));
  const badgeIcon2 = isRegister ? "ph-sparkle" : (isKol ? "ph-tree-structure" : (isShop ? "ph-shield-check" : "ph-shield-check"));
  const regData = state.regData || {};

  if (isRegister) {
    return `
    <section class="register-spec-view">
      <div class="register-spec-container">
        <!-- 1. LEFT + CENTER HERO COMPOSITION -->
        <div class="register-spec-main-area">
          <div class="register-spec-hero-grid">
            <!-- CỘT TRÁI: Editorial Art Banner -->
            <div class="register-spec-left">
              <!-- Brand Header -->
              <a href="#/" class="register-spec-brand" title="Trang chủ SCANMS">
                <div class="register-spec-brand-icon">
                  <i class="ph-fill ph-sparkle"></i>
                </div>
                <div class="register-spec-brand-text">
                  <span class="register-spec-brand-name">SCANMS</span>
                  <span class="register-spec-brand-sub">HỆ THỐNG QUẢN LÝ MẠNG LƯỚI CTV &amp; TIẾP THỊ</span>
                </div>
              </a>

              <!-- Badge Pill -->
              <div class="register-spec-pill">
                <i class="ph-fill ph-sparkle"></i>
                <span>THAM GIA NGAY CỘNG ĐỒNG CTV CÙNG SCANMS</span>
              </div>

              <!-- Headline -->
              <h1 class="register-spec-heading">
                Biến sức ảnh hưởng<br>thành <span class="text-gold">thu nhập thật</span>
              </h1>

              <!-- Description -->
              <p class="register-spec-desc">
                Đăng ký trở thành Cộng tác viên (KOL/CTV) cùng SCANMS, nhận hoa hồng hấp dẫn, tiếp cận hàng nghìn sản phẩm chất lượng và được hỗ trợ toàn diện để phát triển lâu dài.
              </p>

              <!-- 4 Feature Bullets -->
              <div class="register-spec-features">
                <div class="register-feat-item">
                  <div class="register-feat-icon">
                    <i class="ph ph-shopping-bag"></i>
                  </div>
                  <div class="register-feat-info">
                    <strong>Hàng ngàn sản phẩm</strong>
                    <span>đa dạng, dễ bán</span>
                  </div>
                </div>

                <div class="register-feat-item">
                  <div class="register-feat-icon">
                    <i class="ph ph-percent"></i>
                  </div>
                  <div class="register-feat-info">
                    <strong>Hoa hồng hấp dẫn</strong>
                    <span>chi trả minh bạch, đúng hạn</span>
                  </div>
                </div>

                <div class="register-feat-item">
                  <div class="register-feat-icon">
                    <i class="ph ph-lightbulb"></i>
                  </div>
                  <div class="register-feat-info">
                    <strong>Công cụ hỗ trợ mạnh mẽ</strong>
                    <span>Link, QR, báo cáo, quản lý doanh thu.</span>
                  </div>
                </div>

                <div class="register-feat-item">
                  <div class="register-feat-icon">
                    <i class="ph ph-users-three"></i>
                  </div>
                  <div class="register-feat-info">
                    <strong>Cộng đồng CTV năng động</strong>
                    <span>Học hỏi, chia sẻ và phát triển cùng nhau</span>
                  </div>
                </div>
              </div>

              <!-- Cursive script bottom left -->
              <div class="register-spec-script-left">
                <span class="script-text">Cơ hội tốt hơn<br>đang chờ bạn!</span>
                <span class="script-arrow">↗</span>
              </div>
            </div>

            <!-- CỘT GIỮA: 3D Visual & Floating Badges -->
            <div class="register-spec-center">
              <div class="register-visual-stage">
                <!-- Glowing Arch Backdrop -->
                <div class="register-arch-glow"></div>

                <!-- Top Right Handwritten Text -->
                <div class="register-script-creators">
                  <span class="script-text">Small <i class="ph-fill ph-sparkle"></i><br>Creators<br>Big Income</span>
                  <span class="script-arrow-curved">↗</span>
                </div>

                <!-- Floating Badge 1: Top Left -->
                <div class="register-float-badge badge-top-left">
                  <div class="float-badge-icon gold-badge">
                    <i class="ph ph-users-three"></i>
                  </div>
                  <div class="float-badge-info">
                    <span class="float-badge-label">Cộng đồng CTV</span>
                    <strong class="float-badge-val">10,000+</strong>
                    <span class="float-badge-sub">đang hoạt động</span>
                  </div>
                </div>

                <!-- Floating Badge 2: Top Right -->
                <div class="register-float-badge badge-top-right">
                  <div class="float-badge-icon gold-badge">
                    <i class="ph ph-chart-bar"></i>
                  </div>
                  <div class="float-badge-info">
                    <span class="float-badge-label">Thu nhập hấp dẫn</span>
                    <strong class="float-badge-val">Không giới hạn</strong>
                  </div>
                </div>

                <!-- Floating Badge 3: Mid Left -->
                <div class="register-float-badge badge-mid-left">
                  <div class="float-badge-icon box-badge">
                    <i class="ph ph-package"></i>
                  </div>
                  <div class="float-badge-info">
                    <strong class="float-badge-val">Sản phẩm</strong>
                    <span class="float-badge-sub">đa dạng</span>
                  </div>
                </div>

                <!-- Floating Badge 4: Mid Right -->
                <div class="register-float-badge badge-mid-right">
                  <div class="float-badge-icon heart-badge">
                    <i class="ph ph-heart"></i>
                  </div>
                  <div class="float-badge-info">
                    <strong class="float-badge-val">Hỗ trợ 24/7</strong>
                    <span class="float-badge-sub">Luôn đồng hành</span>
                  </div>
                </div>

                <!-- 3D Smartphone Image Showcase -->
                <div class="register-phone-wrap">
                  <img src="./assets/register-gold-phone-transparent.png" alt="SCANMS 3D Phone with Gold Bar Chart & Boxes" class="register-phone-img" />
                  
                  <!-- Golden Pill Overlay inside phone screen -->
                  <div class="phone-gold-pill">Thu nhập không giới hạn</div>

                  <!-- Gold Coin Overlay Badge -->
                  <div class="phone-coin-symbol">$</div>
                </div>
              </div>
            </div>
          </div>

          <!-- THANH 4 THỐNG KÊ (BOTTOM STATS BAR) -->
          <div class="register-spec-bottom-bar">
            <div class="reg-stat-col">
              <div class="reg-stat-icon"><i class="ph ph-users-three"></i></div>
              <div class="reg-stat-content">
                <strong>10,000+</strong>
                <small>CTV đã tham gia</small>
              </div>
            </div>
            <div class="reg-stat-col">
              <div class="reg-stat-icon"><i class="ph ph-package"></i></div>
              <div class="reg-stat-content">
                <strong>5,000+</strong>
                <small>Sản phẩm đa dạng</small>
              </div>
            </div>
            <div class="reg-stat-col">
              <div class="reg-stat-icon"><i class="ph ph-hand-coins"></i></div>
              <div class="reg-stat-content">
                <strong>95%</strong>
                <small>Hài lòng &amp; tiếp tục đồng hành</small>
              </div>
            </div>
            <div class="reg-stat-col">
              <div class="reg-stat-icon"><i class="ph ph-trophy"></i></div>
              <div class="reg-stat-content">
                <strong>Top 1</strong>
                <small>Nền tảng CTV uy tín</small>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. CỘT PHẢI: FORM ĐĂNG KÝ (CARD WHITE CONTAINER) -->
        <div class="register-spec-card-area">
          <div class="register-spec-card">
            <div class="reg-card-head">
              <h2>Tạo tài khoản mới</h2>
              <p>Đăng ký trở thành <strong>${roleName}</strong> cùng SCANMS.</p>
            </div>

            <!-- CHỌN VAI TRÒ -->
            <div class="reg-role-section">
              <span class="reg-role-title">Chọn vai trò của bạn</span>
              <div class="reg-role-grid" role="radiogroup" aria-label="Chọn vai trò của bạn">
                <button type="button" class="reg-role-btn ${isKol ? 'active' : ''}" data-role="kol">
                  <i class="ph-fill ph-sparkle"></i>
                  <span>KOL/CTV</span>
                </button>
                <button type="button" class="reg-role-btn ${isShop ? 'active' : ''}" data-role="shop">
                  <i class="ph ph-storefront"></i>
                  <span>Chủ Shop</span>
                </button>
                <button type="button" class="reg-role-btn ${isCustomer ? 'active' : ''}" data-role="customer">
                  <i class="ph ph-shopping-bag"></i>
                  <span>Khách hàng</span>
                </button>
              </div>
            </div>

            <!-- FORM FIELDS -->
            <form class="auth-form reg-card-form" data-action="register">
              <div class="reg-form-stack">
                <!-- Họ và tên -->
                <div class="reg-field">
                  <label for="reg-name"><i class="ph ph-user"></i> Họ và tên đầy đủ</label>
                  <div class="reg-input-wrap">
                    <i class="ph ph-user reg-input-lead"></i>
                    <input id="reg-name" class="reg-input" type="text" placeholder="VD: Nguyễn Văn A" value="${escapeHtml(regData.name || '')}" required />
                  </div>
                </div>

                <!-- Email & SĐT (2 Cột) -->
                <div class="reg-split-row">
                  <div class="reg-field">
                    <label for="reg-email"><i class="ph ph-envelope-simple"></i> Email</label>
                    <div class="reg-input-wrap">
                      <i class="ph ph-envelope-simple reg-input-lead"></i>
                      <input id="reg-email" class="reg-input" type="email" placeholder="VD: your@email.com" value="${escapeHtml(regData.email || '')}" required />
                    </div>
                  </div>
                  <div class="reg-field">
                    <label for="reg-phone"><i class="ph ph-phone"></i> Số điện thoại</label>
                    <div class="reg-input-wrap">
                      <i class="ph ph-phone reg-input-lead"></i>
                      <input id="reg-phone" class="reg-input" type="tel" placeholder="VD: 0901 234 567" value="${escapeHtml(regData.phone || '')}" required />
                    </div>
                  </div>
                </div>

                <!-- Trường theo vai trò -->
                ${isKol ? `
                  <div class="reg-field">
                    <label for="reg-handle"><i class="ph ph-link"></i> Kênh mạng xã hội (Tùy chọn)</label>
                    <div class="reg-input-wrap">
                      <i class="ph ph-link reg-input-lead"></i>
                      <input id="reg-handle" class="reg-input" placeholder="VD: @tiktok, youtube, facebook..." value="${escapeHtml(regData.handle || '')}" />
                    </div>
                  </div>
                ` : isShop ? `
                  <div class="reg-field">
                    <label for="reg-shop-name"><i class="ph ph-storefront"></i> Tên gian hàng / Thương hiệu</label>
                    <div class="reg-input-wrap">
                      <i class="ph ph-storefront reg-input-lead"></i>
                      <input id="reg-shop-name" class="reg-input" placeholder="VD: Sora Skin Vietnam Official" value="${escapeHtml(regData.shopName || '')}" required />
                    </div>
                  </div>
                ` : `
                  <div class="reg-field">
                    <label><i class="ph ph-shopping-bag"></i> Quyền lợi thành viên mua sắm</label>
                    <div class="reg-input-wrap reg-input-info">
                      <i class="ph ph-seal-check reg-input-lead" style="color:var(--brand)"></i>
                      <span style="font-size:11px;color:#52525b">Tài khoản Khách hàng nhận ngay ưu đãi giảm 10% &amp; tích điểm đơn hàng.</span>
                    </div>
                  </div>
                `}

                <!-- Mật khẩu -->
                <div class="reg-field">
                  <label for="reg-password"><i class="ph ph-lock"></i> Mật khẩu</label>
                  <div class="reg-input-wrap">
                    <i class="ph ph-lock reg-input-lead"></i>
                    <input id="reg-password" class="reg-input" type="password" placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)" value="${escapeHtml(regData.password || '')}" required />
                    <button type="button" class="auth-eye-btn reg-eye-btn" data-toggle-password="#reg-password" title="Hiện/ẩn mật khẩu">
                      <i class="ph ph-eye"></i>
                    </button>
                  </div>
                  <div class="password-meter-card" id="pass-meter" style="display:none">
                    <div class="meter-header">
                      <span class="meter-title">
                        <i class="ph ph-shield-check" id="pass-meter-icon"></i>
                        <span>Độ mạnh mật khẩu</span>
                      </span>
                      <span class="meter-badge" id="pass-meter-badge">Chưa nhập</span>
                    </div>
                    <div class="meter-track">
                      <span class="meter-seg" id="seg-1"></span>
                      <span class="meter-seg" id="seg-2"></span>
                      <span class="meter-seg" id="seg-3"></span>
                      <span class="meter-seg" id="seg-4"></span>
                    </div>
                    <div class="meter-hint" id="pass-meter-hint">
                      <i class="ph ph-info"></i> Tối thiểu 8 ký tự, kết hợp chữ hoa, chữ thường và số.
                    </div>
                  </div>
                </div>

                <!-- Xác nhận mật khẩu -->
                <div class="reg-field">
                  <label for="reg-confirm"><i class="ph ph-lock-key"></i> Xác nhận mật khẩu</label>
                  <div class="reg-input-wrap">
                    <i class="ph ph-lock-key reg-input-lead"></i>
                    <input id="reg-confirm" class="reg-input" type="password" placeholder="Nhập lại mật khẩu" value="${escapeHtml(regData.confirm || '')}" required />
                    <button type="button" class="auth-eye-btn reg-eye-btn" data-toggle-password="#reg-confirm" title="Hiện/ẩn mật khẩu">
                      <i class="ph ph-eye"></i>
                    </button>
                  </div>
                </div>

                <!-- Checkbox Điều khoản -->
                <div class="reg-terms-block">
                  <label class="reg-checkbox-label" for="reg-terms">
                    <input type="checkbox" id="reg-terms" ${regData.terms ? 'checked' : ''} required />
                    <span class="reg-terms-text">
                      Tôi đã đọc và đồng ý với <button type="button" class="text-link-btn" data-modal="terms">Điều khoản dịch vụ</button> và <button type="button" class="text-link-btn" data-modal="policy">Chính sách bảo mật</button> của SCANMS.
                    </span>
                  </label>
                </div>

                <!-- Nút Đăng Ký Ngay -->
                <button class="btn-register-primary" type="submit" id="reg-submit-btn">
                  <i class="ph ph-key"></i>
                  <span>Đăng ký ngay</span>
                </button>

                <!-- Divider -->
                <div class="reg-social-divider">
                  <span>Hoặc đăng ký nhanh với</span>
                </div>

                <!-- 3 Social Buttons (Google, TikTok, Facebook) -->
                <div class="reg-social-grid">
                  <button type="button" class="btn-reg-social" data-social="Google">
                    <svg class="social-google-svg" width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.32 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.32 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Google</span>
                  </button>
                  <button type="button" class="btn-reg-social" data-social="TikTok">
                    <svg class="social-tiktok-svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.11V8.98a6.52 6.52 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 3.77.93v-3.4a4.85 4.85 0 0 1-3.77-4.22h3.77z"/>
                    </svg>
                    <span>TikTok</span>
                  </button>
                  <button type="button" class="btn-reg-social" data-social="Facebook">
                    <svg class="social-fb-svg" width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </button>
                </div>

                <!-- Chuyển sang đăng nhập -->
                <div class="reg-login-switch">
                  Đã có tài khoản? <button type="button" class="text-link-btn gold-link" data-auth-mode="login">Đăng nhập ngay →</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
    `;
  }

  // =========================================================================
  // GIAO DIỆN ĐĂNG NHẬP: CHUẨN XÁC 100% THEO ẢNH MẪU THIẾT KẾ
  // Bố cục 3 vùng (30% Intro - 38% Center Photo - 32% Form) + Thanh 4 Lợi Ích
  // =========================================================================
  return `
  <section class="auth-spec-view">
    <div class="auth-spec-main">
      <div class="auth-spec-layout">
        <!-- 1. PHẦN CHỮ BÊN TRÁI (LEFT TEXT & FEATURES) -->
        <div class="auth-spec-left-panel">
          <div class="auth-spec-left-top">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap">
              <a href="#marketplace" class="auth-spec-brand" title="Trang chủ SCANMS">
                <div class="auth-spec-brand-icon">
                  <i class="ph-fill ph-sparkle"></i>
                </div>
                <div class="auth-spec-brand-text">
                  <span class="auth-spec-brand-name">SCANMS</span>
                  <span class="auth-spec-brand-sub">HỆ THỐNG QUẢN LÝ MẠNG LƯỚI CTV &amp; TIẾP THỊ</span>
                </div>
              </a>
              <a href="#marketplace" class="btn secondary auth-back-to-shop-btn" style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:10px;background:#fff;border:1px solid #EAE4D7;color:#1A1612;font-size:12px;font-weight:700;text-decoration:none;box-shadow:0 1px 3px rgba(0,0,0,0.04);cursor:pointer">
                <i class="ph ph-arrow-left" style="color:#B88E4F"></i>
                <i class="ph ph-shopping-bag" style="color:#B88E4F"></i>
                <span>Quay về Sàn mua sắm</span>
              </a>
            </div>

            <!-- Badge Pill -->
            <div class="auth-spec-pill">
              Giải pháp toàn diện cho doanh nghiệp hiện đại
            </div>

            <!-- Main Heading -->
            <h1 class="auth-spec-heading">
              <span class="heading-dark">Kết nối cộng tác viên</span>
              <span class="heading-gold">Kiến tạo doanh thu</span>
              <span class="heading-gold">bền vững</span>
            </h1>

            <!-- Description -->
            <p class="auth-spec-desc">
              SCANMS giúp doanh nghiệp dễ dàng quản lý đội ngũ cộng tác viên bán hàng và tiếp thị liên kết, mở rộng kênh phân phối, tối ưu hiệu suất và tăng trưởng doanh thu vượt trội.
            </p>

            <!-- 4 Features List -->
            <div class="auth-spec-features">
              <div class="auth-spec-feat-item">
                <div class="auth-spec-feat-icon">
                  <i class="ph-fill ph-users-three"></i>
                </div>
                <div class="auth-spec-feat-info">
                  <strong>Quản lý CTV tập trung</strong>
                  <span>Dễ dàng phân quyền, theo dõi hiệu suất.</span>
                </div>
              </div>

              <div class="auth-spec-feat-item">
                <div class="auth-spec-feat-icon">
                  <i class="ph-fill ph-chart-bar"></i>
                </div>
                <div class="auth-spec-feat-info">
                  <strong>Tối ưu kênh bán hàng</strong>
                  <span>Mở rộng thị trường, gia tăng doanh thu.</span>
                </div>
              </div>

              <div class="auth-spec-feat-item">
                <div class="auth-spec-feat-icon">
                  <i class="ph-fill ph-shield-check"></i>
                </div>
                <div class="auth-spec-feat-info">
                  <strong>Bảo mật &amp; ổn định</strong>
                  <span>Dữ liệu an toàn, vận hành tin cậy.</span>
                </div>
              </div>

              <div class="auth-spec-feat-item">
                <div class="auth-spec-feat-icon">
                  <i class="ph-fill ph-rocket-launch"></i>
                </div>
                <div class="auth-spec-feat-info">
                  <strong>Đồng hành phát triển</strong>
                  <span>Cùng doanh nghiệp vươn xa thương hiệu.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Handwritten Script Bottom Left -->
          <div class="auth-spec-handwritten-wrap">
            <img src="./assets/handwritten-cung-ctv-clean.png" 
                 alt="Cùng CTV Vươn xa thương hiệu" 
                 class="auth-spec-handwritten-img" />
          </div>
        </div>

        <!-- 2. PHẦN ẢNH Ở GIỮA (CENTER PHOTO COLLABORATION) -->
        <div class="auth-spec-center-panel">
          <img src="./assets/team-center-clean.png" 
               alt="Đội ngũ SCANMS - More Opportunities Together" 
               class="auth-spec-center-img" />
        </div>

        <!-- 3. FORM ĐĂNG NHẬP BÊN PHẢI (~32%) -->
        <div class="auth-spec-card-area">
          <div class="auth-spec-card">
            <div class="auth-spec-card-head">
              <h2>Chào mừng trở lại!</h2>
              <p>Chọn vai trò và đăng nhập vào không gian của bạn.</p>
            </div>

            <!-- Bộ chọn vai trò nhỏ gọn (hàng trên 3 nút, hàng dưới 2 nút căn giữa) -->
            <div class="auth-spec-role-hub">
              <div class="auth-spec-role-caption">CHỌN VAI TRÒ</div>
              <div class="auth-spec-role-grid" role="radiogroup" aria-label="Chọn vai trò">
                <div class="auth-spec-role-row-top">
                  <button type="button" class="auth-role-btn ${isKol ? 'active' : ''}" data-role="kol" title="Cộng tác viên / KOL / KOC tiếp thị">
                    <i class="ph ph-sparkle"></i>
                    <span>KOL/CTV</span>
                  </button>

                  <button type="button" class="auth-role-btn ${isShop ? 'active' : ''}" data-role="shop" title="Chủ gian hàng">
                    <i class="ph ph-storefront"></i>
                    <span>Chủ Shop</span>
                  </button>

                  <button type="button" class="auth-role-btn ${isCustomer ? 'active' : ''}" data-role="customer" title="Khách mua hàng">
                    <i class="ph ph-envelope-simple"></i>
                    <span>Khách hàng</span>
                  </button>
                </div>

                <div class="auth-spec-role-row-bottom">
                  <button type="button" class="auth-role-btn ${isManager ? 'active' : ''}" data-role="manager" title="Chuyên viên Vận hành">
                    <i class="ph ph-shield-check"></i>
                    <span>Vận hành</span>
                  </button>

                  <button type="button" class="auth-role-btn ${isAdmin ? 'active' : ''}" data-role="admin" title="Quản trị viên">
                    <i class="ph ph-gear-six"></i>
                    <span>Quản trị</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Form Fields -->
            <form class="auth-form" data-action="login">
              <div class="form-stack">
                ${isLastRegRoleMatch ? `
                  <div class="auth-notice-registered" style="background:#fffbeb;border:1.5px solid #f59e0b;border-radius:12px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:flex-start;gap:12px;box-shadow:0 4px 14px rgba(245,158,11,0.12)">
                    <div style="width:36px;height:36px;border-radius:10px;background:#fef3c7;color:#d97706;display:grid;place-items:center;font-size:20px;flex-shrink:0">
                      <i class="ph ${state.role === 'shop' ? 'ph-hourglass-high' : 'ph-check-circle'}"></i>
                    </div>
                    <div style="font-size:12.5px;color:#78350f;line-height:1.5">
                      <strong style="font-size:13.5px;color:#92400e;display:block;margin-bottom:3px">
                        ${state.role === 'shop' ? `Đã tiếp nhận hồ sơ đăng ký gian hàng ${state.pendingShop ? `"${escapeHtml(state.pendingShop.name)}" (${state.pendingShop.id})` : ''}` : 'Đăng ký tài khoản thành công!'}
                      </strong>
                      ${state.role === 'shop' ? `
                        <div style="color:#92400e;margin-bottom:4px">
                          Trạng thái: <span class="badge warning" style="background:#fef3c7;color:#b45309;font-weight:700;padding:2px 6px;border-radius:4px;font-size:11px"><i class="ph ph-clock"></i> CHỜ DUYỆT BỞI ADMIN &amp; VẬN HÀNH</span>
                        </div>
                        <div style="color:#78350f">Vui lòng nhập mật khẩu tài khoản <strong>${escapeHtml(state.lastRegisteredEmail)}</strong> để đăng nhập vào trang theo dõi tiến độ thẩm định hồ sơ.</div>
                      ` : `
                        <div>Vui lòng nhập lại mật khẩu tài khoản <strong>${escapeHtml(state.lastRegisteredEmail)}</strong> để đăng nhập.</div>
                      `}
                    </div>
                  </div>
                ` : ''}

                <div class="field">
                  <label for="login-email">Email đăng nhập</label>
                  <div class="auth-input-wrap has-lead-icon">
                    <i class="ph ph-envelope-simple auth-lead-icon"></i>
                    <input id="login-email" class="input" type="email" value="${escapeHtml(demoEmail)}" placeholder="demo@scanms.vn" required />
                  </div>
                </div>

                <div class="field">
                  <div class="label-with-link">
                    <label for="login-password">Mật khẩu</label>
                    <button class="text-btn forgot-pass-btn" type="button" data-action="forgot-pass">Quên mật khẩu?</button>
                  </div>
                  <div class="auth-input-wrap has-lead-icon">
                    <i class="ph ph-lock auth-lead-icon"></i>
                    <input id="login-password" class="input" type="password" value="${defaultPasswordVal}" placeholder="${isLastRegRoleMatch ? 'Nhập mật khẩu vừa tạo' : '12345678'}" required />
                    <button type="button" class="auth-eye-btn" data-toggle-password="#login-password" title="Hiện/ẩn mật khẩu">
                      <i class="ph ph-eye"></i>
                    </button>
                  </div>
                </div>

                <div class="field-remember">
                  <label class="checkbox-label">
                    <input type="checkbox" checked /> Ghi nhớ đăng nhập trên thiết bị này
                  </label>
                </div>

                <button class="btn btn-auth-submit" type="submit">
                  <i class="ph ph-sign-in"></i> Đăng nhập an toàn
                </button>

                <div class="auth-divider">
                  <span>HOẶC ĐĂNG NHẬP NHANH</span>
                </div>

                <div class="social-auth-grid">
                  <button type="button" class="btn secondary btn-social" data-social="Google">
                    <svg class="social-google-svg" width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.37 7.32 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.32 0 3.25 2.63 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    <span>Google</span>
                  </button>
                  <button type="button" class="btn secondary btn-social" data-social="TikTok">
                    <svg class="social-tiktok-svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.11V8.98a6.52 6.52 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 3.77.93v-3.4a4.85 4.85 0 0 1-3.77-4.22h3.77z"/>
                    </svg>
                    <span>TikTok</span>
                  </button>
                </div>

                <div class="auth-switch-note">
                  Chưa có tài khoản? <button type="button" class="text-btn auth-inline-switch" data-auth-mode="register">Đăng ký thành viên ngay →</button>
                </div>

                <div style="margin-top:14px;padding:12px 14px;border-radius:14px;background:#FBF5EB;border:1px solid #EEDFC6;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left">
                  <div style="display:flex;align-items:center;gap:10px;min-width:0">
                    <div style="width:32px;height:32px;border-radius:10px;background:#C59B58;color:#fff;display:grid;place-items:center;flex-shrink:0">
                      <i class="ph ph-shopping-bag"></i>
                    </div>
                    <div style="min-width:0">
                      <strong style="font-size:12px;color:#1A1612;display:block">Khách mua hàng trực tiếp</strong>
                      <span style="font-size:11px;color:#7D715E;display:block">Không cần tài khoản đối tác</span>
                    </div>
                  </div>
                  <a href="#marketplace" class="btn" style="flex-shrink:0;padding:6px 12px;border-radius:10px;background:#fff;border:1px solid #EEDFC6;color:#B88E4F;font-size:11.5px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px">
                    <span>Vào mua sắm</span>
                    <i class="ph ph-arrow-right"></i>
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. THANH BỐN LỢI ÍCH TRẢI NGANG DƯỚI CÙNG -->
    <footer class="auth-spec-bottom-bar">
      <div class="bottom-bar-inner">
        <div class="bar-item">
          <div class="bar-icon-wrap">
            <i class="ph ph-lightbulb"></i>
          </div>
          <div class="bar-info">
            <strong>Dễ dàng bắt đầu</strong>
            <small>Triển khai nhanh chóng</small>
          </div>
        </div>

        <div class="bar-divider-line"></div>

        <div class="bar-item">
          <div class="bar-icon-wrap">
            <i class="ph ph-chart-bar"></i>
          </div>
          <div class="bar-info">
            <strong>Linh hoạt mở rộng</strong>
            <small>Phù hợp mọi quy mô</small>
          </div>
        </div>

        <div class="bar-divider-line"></div>

        <div class="bar-item">
          <div class="bar-icon-wrap">
            <i class="ph ph-users-three"></i>
          </div>
          <div class="bar-info">
            <strong>Cộng đồng năng động</strong>
            <small>Hàng ngàn CTV tiềm năng</small>
          </div>
        </div>

        <div class="bar-divider-line"></div>

        <div class="bar-item">
          <div class="bar-icon-wrap">
            <i class="ph-fill ph-heart"></i>
          </div>
          <div class="bar-info">
            <strong>Hỗ trợ 24/7</strong>
            <small>Luôn đồng hành cùng bạn</small>
          </div>
        </div>
      </div>
    </footer>
  </section>
  `;
}


function kolDashboard() {
  return `${header("Hôm nay bạn bán được gì?", "Thu nhập, cấp bậc và hiệu suất của bạn được cập nhật theo thời gian thực.", `<button class="btn" data-go="links">${icon("ph-plus")} Tạo link tiếp thị</button>`)}
  <section class="wallet-hero card"><small>Số dư khả dụng</small><div class="balance">12.450.000 ₫</div><div class="wallet-meta"><button class="btn" data-modal="withdraw">Yêu cầu rút tiền</button><span>Chờ duyệt 1.850.000 ₫</span></div></section>
  <div class="grid kpis" style="margin-top:16px">${kpi("Lượt nhấp hôm nay", "1.426", "+18,4% so với hôm qua", "ph-cursor-click")}${kpi("Đơn thành công", "38", "+7 đơn mới", "ph-shopping-bag")}${kpi("Tỷ lệ chuyển đổi", "2,67%", "+0,31 điểm", "ph-funnel")}${kpi("Cấp bậc", "Vàng", "+3% hoa hồng", "ph-medal")}</div>
  <div class="split"><section class="card"><div class="card-title"><h2>Hiệu suất 7 ngày</h2><span>Click / Đơn hàng</span></div>${bars([34, 48, 42, 68, 55, 78, 88], [12, 18, 16, 31, 24, 35, 43])}</section><section class="card"><div class="card-title"><h2>Hoa hồng gần đây</h2><button class="text-btn" data-go="wallet">Xem ví</button></div><div class="feed">${feedRow("ph-check-circle", "Đơn #IN23918", "Serum vitamin C, 2 sản phẩm", "+185.000 ₫")}${feedRow("ph-hourglass", "Đơn #IN23902", "Còn 9 ngày chờ đối soát", "+92.000 ₫")}${feedRow("ph-arrow-u-down-left", "Đơn #IN23845", "Khách hoàn trả sản phẩm", "-75.000 ₫", true)}</div></section></div>
  <section class="card soft" style="margin-top:18px"><div class="card-title"><h2>Tiến độ lên hạng Kim Cương</h2><strong>74%</strong></div><div class="bar"><span style="width:74%"></span></div><p style="color:var(--muted);margin:12px 0 0">Còn 12.500.000 ₫ doanh số trong tháng để nhận thêm 5% hoa hồng.</p></section>`;
}
// Screen 3: Link và QR (được quản lý hoàn chỉnh trong links.js - linksPage / bindLinks)

function channelsScreen() {
  const allChannels = state.channels || [];

  // Aggregate KPIs
  const totalChannels = allChannels.length;
  const verifiedCount = allChannels.filter(c => c.verificationStatus === "verified").length;
  const totalFollowers = allChannels.reduce((sum, c) => sum + (Number(c.followers) || 0), 0);
  const primaryChannel = allChannels.find(c => c.isPrimary) || allChannels[0];
  const totalGMV = allChannels.reduce((sum, c) => sum + (c.stats?.gmv || 0), 0);
  const totalCommission = allChannels.reduce((sum, c) => sum + (c.stats?.commission || 0), 0);

  // Apply filters
  let filtered = allChannels.filter(c => {
    // Search query
    if (state.channelSearch) {
      const q = state.channelSearch.toLowerCase().trim();
      const match = (c.name && c.name.toLowerCase().includes(q)) ||
        (c.displayName && c.displayName.toLowerCase().includes(q)) ||
        (c.handle && c.handle.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.platform && c.platform.toLowerCase().includes(q));
      if (!match) return false;
    }
    // Platform filter
    if (state.channelPlatformFilter && state.channelPlatformFilter !== "all") {
      if (c.platform !== state.channelPlatformFilter) return false;
    }
    // Status filter
    if (state.channelStatusFilter && state.channelStatusFilter !== "all") {
      if (c.verificationStatus !== state.channelStatusFilter) return false;
    }
    return true;
  });

  // Apply sort
  filtered.sort((a, b) => {
    if (state.channelSort === "followers_desc") {
      return (Number(b.followers) || 0) - (Number(a.followers) || 0);
    }
    if (state.channelSort === "gmv_desc") {
      return (b.stats?.gmv || 0) - (a.stats?.gmv || 0);
    }
    if (state.channelSort === "orders_desc") {
      return (b.stats?.orders || 0) - (a.stats?.orders || 0);
    }
    if (state.channelSort === "name_asc") {
      return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
    }
    return 0;
  });

  const cardsHtml = filtered.length > 0 ? `
    <div class="channel-grid-v2">
      ${filtered.map(c => {
    const cfg = platformConfig[c.platform] || {
      name: c.name || "Mạng xã hội",
      icon: c.icon || "ph-share-network",
      color: "var(--brand)",
      bgColor: "var(--brand-soft)",
      followerName: "Người theo dõi"
    };

    let statusBadgeHtml = '';
    if (c.verificationStatus === 'verified') {
      statusBadgeHtml = `<span class="channel-status-badge verified" title="Kênh đã xác minh danh tính và API Creator"><i class="ph ph-seal-check"></i> ${c.verificationLabel || 'Đã xác minh'}</span>`;
    } else if (c.verificationStatus === 'pending') {
      statusBadgeHtml = `<span class="channel-status-badge pending" title="Đang chờ xét duyệt kết nối API"><i class="ph ph-clock-clockwise"></i> Chờ duyệt API</span>`;
    } else {
      statusBadgeHtml = `<span class="channel-status-badge unverified" title="Kênh tự khai báo thủ công"><i class="ph ph-shield-warning"></i> Tự khai báo</span>`;
    }

    const primaryStarHtml = c.isPrimary
      ? `<span class="channel-primary-star" title="Kênh chính mặc định dùng khi tạo link tiếp thị"><i class="ph-fill ph-star"></i></span>`
      : '';

    const stats = c.stats || { clicks: 0, orders: 0, cvr: '0%', gmv: 0, commission: 0 };

    return `
          <article class="channel-card-v2 ${c.isPrimary ? 'is-primary-card' : ''}" data-channel-id="${c.id}">
            <!-- Card Head: icon 36px, tên 15px, platform & @handle 12-13px, badge nhỏ, sao kênh chính -->
            <div class="channel-card-head">
              <div class="channel-brand-meta">
                <div class="channel-avatar" style="background:${cfg.bgColor};color:${cfg.color}" title="${cfg.name}">
                  <i class="ph ${cfg.icon}"></i>
                </div>
                <div class="channel-title-group">
                  <h3 class="channel-card-title" title="${escapeHtml(c.displayName || c.name)}">${escapeHtml(c.displayName || c.name)}</h3>
                  <div class="channel-card-subline">
                    <span class="channel-platform-name">${cfg.name}</span>
                    <span class="channel-sub-dot">•</span>
                    <a href="${c.url || '#'}" target="_blank" rel="noopener noreferrer" class="channel-handle-link" title="Mở trang cá nhân trên ${cfg.name}">
                      ${escapeHtml(c.handle)}
                    </a>
                    <span class="channel-sub-dot">•</span>
                    <span class="channel-followers-sub" title="${Number(c.followers || 0).toLocaleString('vi-VN')} người theo dõi">
                      <i class="ph ph-users"></i> ${formatFollowersCompact(c.followers)}
                    </span>
                  </div>
                </div>
              </div>
              <div class="channel-badges-col">
                ${primaryStarHtml}
                ${statusBadgeHtml}
              </div>
            </div>

            <!-- 4 Performance Metrics Strip (Lượt Click | Đơn / CVR | GMV Bán | Hoa hồng) -->
            <div class="channel-stats-strip-v3">
              <div class="c-stat-col">
                <span class="c-stat-lbl">Lượt Click</span>
                <span class="c-stat-val val-clicks">${(stats.clicks || 0).toLocaleString('vi-VN')}</span>
              </div>
              <div class="c-stat-divider"></div>
              <div class="c-stat-col">
                <span class="c-stat-lbl">Đơn / CVR</span>
                <span class="c-stat-val val-cvr">${stats.orders || 0} <small class="cvr-badge">${stats.cvr || '0%'}</small></span>
              </div>
              <div class="c-stat-divider"></div>
              <div class="c-stat-col">
                <span class="c-stat-lbl">GMV Bán</span>
                <span class="c-stat-val val-gmv" title="${money(stats.gmv || 0)}">${money(stats.gmv || 0)}</span>
              </div>
              <div class="c-stat-divider"></div>
              <div class="c-stat-col">
                <span class="c-stat-lbl">Hoa hồng</span>
                <span class="c-stat-val val-comm" title="${money(stats.commission || 0)}">${money(stats.commission || 0)}</span>
              </div>
            </div>

            <!-- Card Footer: "Tạo link", "Chi tiết" & menu ⋯ -->
            <div class="channel-card-actions">
              <div class="channel-left-actions">
                <button class="btn small primary btn-channel-link" data-action="create-link-for-channel" data-id="${c.id}" title="Tạo link tiếp thị ngay cho kênh này">
                  <i class="ph ph-link"></i> Tạo link
                </button>
                <button class="btn small secondary btn-channel-detail" data-action="view-channel-detail" data-id="${c.id}" title="Xem chi tiết ngành hàng, ngày kết nối & hiệu suất">
                  <i class="ph ph-sidebar-simple"></i> Chi tiết
                </button>
              </div>
              <div class="channel-menu-wrap">
                <button class="channel-more-btn" data-action="toggle-channel-menu" data-id="${c.id}" aria-label="Tùy chọn khác" aria-haspopup="true" aria-expanded="false" title="Tùy chọn khác">
                  <i class="ph ph-dots-three-vertical"></i>
                </button>
                <div class="channel-action-popover" id="channel-popover-${c.id}" role="menu">
                  <button class="popover-item" data-action="view-analytics" data-id="${c.id}" role="menuitem">
                    <i class="ph ph-chart-line-up"></i> Hiệu suất
                  </button>
                  <button class="popover-item" data-action="edit-channel" data-id="${c.id}" role="menuitem">
                    <i class="ph ph-pencil-simple"></i> Chỉnh sửa
                  </button>
                  ${!c.isPrimary ? `
                    <button class="popover-item" data-action="set-primary" data-id="${c.id}" role="menuitem">
                      <i class="ph ph-star"></i> Đặt làm kênh chính
                    </button>
                  ` : ''}
                  <div class="popover-divider"></div>
                  <button class="popover-item danger" data-action="delete-channel" data-id="${c.id}" role="menuitem">
                    <i class="ph ph-trash"></i> Gỡ kênh
                  </button>
                </div>
              </div>
            </div>
          </article>
        `;
  }).join('')}
    </div>
  ` : `
    <div class="channel-empty-state card">
      <div class="empty-icon-wrap"><i class="ph ph-share-network"></i></div>
      <h3 style="margin:0 0 8px;font-size:17px">Không tìm thấy kênh mạng xã hội phù hợp</h3>
      <p style="margin:0 0 16px;color:var(--muted);font-size:13.5px;max-width:420px">
        Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc nền tảng / trạng thái để xem đầy đủ danh sách kênh.
      </p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn secondary" data-action="clear-channel-search"><i class="ph ph-x-circle"></i> Xóa bộ lọc</button>
        <button class="btn" data-action="open-add-channel"><i class="ph ph-plus"></i> Thêm kênh mới</button>
      </div>
    </div>
  `;

  return `
    <header class="channel-page-header">
      <div class="channel-header-info">
        <div class="channel-header-title-row">
          <h1>Kênh mạng xã hội của KOL / CTV</h1>
          <span class="status primary" style="font-size:12px">${filtered.length} / ${totalChannels} kênh hiển thị</span>
          <span class="channel-status-badge verified"><i class="ph ph-shield-check"></i> Attribution Tracking v2</span>
        </div>
        <p class="channel-header-desc">
          Quản lý đa kênh truyền thông của bạn (TikTok, Facebook, YouTube, Instagram, Threads, Zalo). Hệ thống tự động phân tách link tiếp thị và báo cáo chuyển đổi theo từng kênh phân phối.
        </p>
      </div>
      <div class="channel-header-actions">
        <button class="btn secondary" data-action="reset-demo-channels" title="Khôi phục danh sách kênh mẫu mặc định">
          ${icon("ph-arrow-counter-clockwise")} Khôi phục mẫu
        </button>
        <button class="btn" data-action="open-add-channel">
          ${icon("ph-plus")} Thêm kênh mới
        </button>
      </div>
    </header>

    <!-- KPI Summary Cards -->
    <div class="grid kpis channel-kpi-bar" style="margin-bottom:20px">
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Tổng kênh liên kết</span>
          <span class="kpi-icon-wrap" style="background:#ecfdf5;color:#059669">${icon("ph-share-network")}</span>
        </div>
        <div class="kpi-val">${totalChannels} <span style="font-size:14px;font-weight:500;color:var(--muted)">kênh</span></div>
        <div class="kpi-meta"><strong style="color:#059669">${verifiedCount} kênh</strong> đã xác minh API / tick xanh</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Tổng lượt tiếp cận (Followers)</span>
          <span class="kpi-icon-wrap" style="background:#eff6ff;color:#2563eb">${icon("ph-users-three")}</span>
        </div>
        <div class="kpi-val">${formatFollowers(totalFollowers)}</div>
        <div class="kpi-meta">Độ phủ trên ${new Set(allChannels.map(c => c.platform)).size} nền tảng MXH</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Kênh chính hoạt động</span>
          <span class="kpi-icon-wrap" style="background:#fef3c7;color:#d97706">${icon("ph-star")}</span>
        </div>
        <div class="kpi-val" style="font-size:17px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${primaryChannel ? primaryChannel.handle : 'Chưa đặt'}">
          ${primaryChannel ? primaryChannel.handle : 'Chưa đặt'}
        </div>
        <div class="kpi-meta">${primaryChannel ? (primaryChannel.name + ' • ' + formatFollowers(primaryChannel.followers) + ' followers') : 'Hãy chọn 1 kênh chính'}</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Tổng GMV từ các kênh</span>
          <span class="kpi-icon-wrap" style="background:#faf5ff;color:#9333ea">${icon("ph-coins")}</span>
        </div>
        <div class="kpi-val" style="color:var(--brand);font-size:22px">${money(totalGMV)}</div>
        <div class="kpi-meta">Hoa hồng ròng: <strong style="color:#059669">${money(totalCommission)}</strong></div>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="channel-toolbar card" style="padding:14px 18px;margin-bottom:20px">
      <div class="channel-search-box">
        <i class="ph ph-magnifying-glass"></i>
        <input type="text" id="channel-search-input" class="input" placeholder="Tìm theo tên hiển thị, handle (@username) hoặc lĩnh vực..." value="${escapeHtml(state.channelSearch)}" />
        ${state.channelSearch ? `<button class="channel-clear-search-btn" data-action="clear-channel-search" title="Xóa tìm kiếm">${icon("ph-x")}</button>` : ''}
      </div>

      <div class="channel-filter-group">
        <div class="filter-item">
          <label for="channel-platform-filter"><i class="ph ph-funnel"></i> Nền tảng:</label>
          <select class="select filter-select" id="channel-platform-filter">
            <option value="all" ${state.channelPlatformFilter === 'all' ? 'selected' : ''}>Tất cả nền tảng</option>
            <option value="tiktok" ${state.channelPlatformFilter === 'tiktok' ? 'selected' : ''}>TikTok</option>
            <option value="facebook" ${state.channelPlatformFilter === 'facebook' ? 'selected' : ''}>Facebook</option>
            <option value="youtube" ${state.channelPlatformFilter === 'youtube' ? 'selected' : ''}>YouTube</option>
            <option value="instagram" ${state.channelPlatformFilter === 'instagram' ? 'selected' : ''}>Instagram</option>
            <option value="threads" ${state.channelPlatformFilter === 'threads' ? 'selected' : ''}>Threads</option>
            <option value="zalo" ${state.channelPlatformFilter === 'zalo' ? 'selected' : ''}>Zalo OA</option>
          </select>
        </div>

        <div class="filter-item">
          <label for="channel-status-filter"><i class="ph ph-shield-check"></i> Trạng thái:</label>
          <select class="select filter-select" id="channel-status-filter">
            <option value="all" ${state.channelStatusFilter === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
            <option value="verified" ${state.channelStatusFilter === 'verified' ? 'selected' : ''}>Đã xác minh (Tick xanh/API)</option>
            <option value="pending" ${state.channelStatusFilter === 'pending' ? 'selected' : ''}>Chờ duyệt API</option>
            <option value="unverified" ${state.channelStatusFilter === 'unverified' ? 'selected' : ''}>Tự khai báo</option>
          </select>
        </div>

        <div class="filter-item">
          <label for="channel-sort"><i class="ph ph-sort-ascending"></i> Sắp xếp:</label>
          <select class="select filter-select" id="channel-sort">
            <option value="followers_desc" ${state.channelSort === 'followers_desc' ? 'selected' : ''}>Followers: Cao đến thấp</option>
            <option value="gmv_desc" ${state.channelSort === 'gmv_desc' ? 'selected' : ''}>GMV: Doanh số cao nhất</option>
            <option value="orders_desc" ${state.channelSort === 'orders_desc' ? 'selected' : ''}>Đơn hàng: Nhiều nhất</option>
            <option value="name_asc" ${state.channelSort === 'name_asc' ? 'selected' : ''}>Tên kênh (A - Z)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Cards Grid -->
    ${cardsHtml}
  `;
}

// Ghi chú: Màn hình Kho nội dung bán hàng (Media Hub - FR-08) được module hóa toàn diện tại ./media.js


function samplesScreen() {
  return `${header("Hàng mẫu dùng thử", "Gửi đề xuất review và theo dõi hành trình giao hàng mẫu ngay trong hệ thống.", `<button class="btn" data-modal="sample">${icon("ph-plus")} Xin sản phẩm mẫu</button>`)}<div class="split equal"><section class="card"><div class="product-cell"><img class="thumb" src="${productImage}" alt="Serum vitamin C" /><div><h2 style="margin:0 0 5px;font-size:17px">Serum vitamin C 15%</h2>${status("Đang vận chuyển", "warning")}</div></div><div style="margin-top:24px" class="timeline"><div class="timeline-item"><span class="timeline-mark">${icon("ph-check")}</span><div><h3>Đã gửi yêu cầu</h3><p>02/09/2026, 09:42</p></div></div><div class="timeline-item"><span class="timeline-mark">${icon("ph-check")}</span><div><h3>Shop đã duyệt</h3><p>03/09/2026, 14:15</p></div></div><div class="timeline-item"><span class="timeline-mark">${icon("ph-truck")}</span><div><h3>Đang giao qua GHTK</h3><p class="mono">Mã vận đơn 88992211</p></div></div><div class="timeline-item pending"><span class="timeline-mark">${icon("ph-package")}</span><div><h3>Chờ xác nhận đã nhận</h3><p>Dự kiến 08/09/2026</p></div></div></div></section><section class="card"><div class="card-title"><h2>Thông tin nhận hàng</h2><button class="text-btn">Chỉnh sửa</button></div><div class="feed">${feedRow("ph-user", "Trần Văn Nhật", "Người nhận", "")}${feedRow("ph-phone", "0987 123 456", "Số điện thoại", "")}${feedRow("ph-map-pin", "12 Nguyễn Văn Bảo, Gò Vấp", "TP. Hồ Chí Minh", "")}</div><div class="card soft" style="margin-top:16px"><strong>Cam kết nội dung</strong><p style="color:var(--muted);line-height:1.5">Video review trải nghiệm thật, dự kiến đăng trong 7 ngày sau khi nhận sản phẩm.</p></div></section></div>`;
}

function walletScreen() {
  return `
    <div style="padding:0;width:100%;height:calc(100vh - 68px);background:#FAF8F5;">
      <iframe id="wallet-iframe" src="/collaborator/wallet" style="width: 100%; height: 100%; border: none; background: transparent; display: block;" title="Ví & Lịch Sử Rút Tiền"></iframe>
    </div>
  `;
}

function shopDashboard() {
  const currentStore = state.currentStore || state.pendingShop || managerState.stores.find(s => s.email === (state.lastRegisteredEmail || "shop@scanms.vn")) || managerState.stores[0];
  const isPending = currentStore && (currentStore.status === "pending" || currentStore.status === "reviewing");
  const storeDisplayName = currentStore ? currentStore.name : "Sora Skin";

  if (isPending) {
    return `
      <header class="page-head">
        <div>
          <div class="crumb"><span>Chủ Shop / </span><strong>Hồ sơ gian hàng</strong></div>
          <h1 style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span>Gian hàng: ${escapeHtml(storeDisplayName)}</span>
            <span class="badge warning" style="background:#fef3c7;color:#b45309;border:1.5px solid #f59e0b;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px">
              <i class="ph ph-clock"></i> CHỜ ADMIN &amp; VẬN HÀNH DUYỆT
            </span>
          </h1>
          <p>Mã hồ sơ: <strong>${currentStore.id}</strong> • Đại diện: <strong>${escapeHtml(currentStore.owner)}</strong> • Nộp ngày: <em>${escapeHtml(currentStore.submittedAt || "Hôm nay")}</em></p>
        </div>
        <div class="actions">
          <button type="button" class="btn" data-action="switch-to-manager" data-store-id="${currentStore.id}" style="background:#2563eb;color:#fff">
            <i class="ph ph-shield-check"></i> Đến trang Vận Hành Sàn để duyệt (Demo)
          </button>
          <button type="button" class="btn secondary" data-action="quick-approve-shop" data-store-id="${currentStore.id}" style="border-color:#059669;color:#059669;font-weight:700">
            <i class="ph ph-check-circle"></i> [DEMO] Phê duyệt nhanh ngay
          </button>
        </div>
      </header>

      <!-- BANNER TIẾP NHẬN & CẢNH BÁO -->
      <div style="background:#fffbeb;border:1.5px solid #f59e0b;border-radius:14px;padding:20px;margin-bottom:24px;box-shadow:0 4px 16px rgba(245,158,11,0.12)">
        <div style="display:flex;align-items:flex-start;gap:16px">
          <div style="width:52px;height:52px;border-radius:14px;background:#fef3c7;color:#d97706;display:grid;place-items:center;font-size:28px;flex-shrink:0">
            <i class="ph ph-hourglass-high"></i>
          </div>
          <div style="flex:1">
            <h3 style="margin:0 0 6px;font-size:16px;color:#92400e;font-weight:800">
              HỒ SƠ GIAN HÀNG ĐANG TRONG QUY TRÌNH THẨM ĐỊNH (CHƯA ĐƯỢC KÍCH HOẠT MỞ BÁN)
            </h3>
            <p style="margin:0 0 10px;font-size:13.5px;color:#78350f;line-height:1.55">
              Gian hàng <strong>${escapeHtml(currentStore.name)}</strong> (Mã: <code>${currentStore.id}</code>) đã được hệ thống tiếp nhận.
              Theo quy chuẩn quản trị sàn thương mại điện tử SCANMS, Ban Quản Trị &amp; Chuyên viên Vận Hành sàn đang thẩm định giấy phép kinh doanh, mã số thuế và phân loại ngành hàng trong vòng <strong>24 giờ làm việc</strong>.
            </p>
            <div style="font-size:13px;color:#b45309;background:#fef3c7;padding:10px 14px;border-radius:8px;border:1px solid #fde68a">
              🔒 <strong>Giới hạn quyền hạn trong trạng thái Chờ duyệt:</strong> Gian hàng hiện đang ở chế độ xem trước (Sandbox). Bạn chưa thể đăng bán sản phẩm công khai, chưa thể tạo link tiếp thị cho KOL hoặc thực hiện rút tiền cho đến khi hồ sơ được phê duyệt chính thức.
            </div>
          </div>
        </div>
      </div>

      <!-- TIẾN TRÌNH 4 BƯỚC THẨM ĐỊNH -->
      <section class="card" style="margin-bottom:24px;padding:22px">
        <h2 style="font-size:16px;margin:0 0 18px;display:flex;align-items:center;gap:8px">
          <i class="ph ph-steps" style="color:var(--brand)"></i>
          Tiến Trình Thẩm Định Hồ Sơ Gian Hàng
        </h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px">
          <div style="background:var(--surface-2);border:1.5px solid #10b981;border-radius:12px;padding:14px;position:relative">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:12px;font-weight:800;color:#059669">BƯỚC 1</span>
              <span class="badge success" style="background:#d1fae5;color:#059669;font-size:11px;padding:2px 6px;border-radius:4px"><i class="ph ph-check"></i> HOÀN THÀNH</span>
            </div>
            <strong style="display:block;font-size:14px;margin-bottom:4px;color:var(--text)">Nộp hồ sơ trực tuyến</strong>
            <small style="color:var(--muted);font-size:12px;line-height:1.4;display:block">Đã gửi thông tin đại diện &amp; tên thương hiệu vào hệ thống.</small>
          </div>

          <div style="background:#fffbeb;border:1.5px solid #f59e0b;border-radius:12px;padding:14px;position:relative">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:12px;font-weight:800;color:#b45309">BƯỚC 2</span>
              <span class="badge warning" style="background:#fef3c7;color:#b45309;font-size:11px;padding:2px 6px;border-radius:4px"><i class="ph ph-hourglass"></i> ĐANG XỬ LÝ</span>
            </div>
            <strong style="display:block;font-size:14px;margin-bottom:4px;color:#92400e">Vận Hành sàn thẩm định</strong>
            <small style="color:#78350f;font-size:12px;line-height:1.4;display:block">Kiểm tra GPKD, mã số thuế và chứng nhận chất lượng sản phẩm.</small>
          </div>

          <div style="background:var(--surface-2);border:1px dashed var(--line);border-radius:12px;padding:14px;opacity:0.75">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:12px;font-weight:700;color:var(--muted)">BƯỚC 3</span>
              <span class="badge neutral" style="font-size:11px;padding:2px 6px;border-radius:4px">CHỜ DUYỆT</span>
            </div>
            <strong style="display:block;font-size:14px;margin-bottom:4px;color:var(--text)">Ký cam kết sàn</strong>
            <small style="color:var(--muted);font-size:12px;line-height:1.4;display:block">Chính sách hoa hồng bậc thang &amp; thời gian đối soát 14 ngày.</small>
          </div>

          <div style="background:var(--surface-2);border:1px dashed var(--line);border-radius:12px;padding:14px;opacity:0.75">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:12px;font-weight:700;color:var(--muted)">BƯỚC 4</span>
              <span class="badge neutral" style="font-size:11px;padding:2px 6px;border-radius:4px">CHƯA MỞ</span>
            </div>
            <strong style="display:block;font-size:14px;margin-bottom:4px;color:var(--text)">Kích hoạt gian hàng</strong>
            <small style="color:var(--muted);font-size:12px;line-height:1.4;display:block">Mở bán toàn diện và kết nối mạng lưới 10,000+ CTV &amp; KOL.</small>
          </div>
        </div>
      </section>

      <!-- 2 CỘT THÔNG TIN: CHI TIẾT HỒ SƠ & HƯỚNG DẪN DEMO -->
      <div class="split" style="grid-template-columns:1.2fr 0.8fr;gap:20px;margin-bottom:24px">
        <section class="card" style="padding:22px">
          <div class="card-title">
            <h2 style="font-size:16px;margin:0"><i class="ph ph-file-text"></i> Thông tin hồ sơ đã tiếp nhận</h2>
            <span class="badge warning" style="font-size:11px;background:#fef3c7;color:#b45309">Chờ kiểm duyệt</span>
          </div>
          <div class="feed" style="margin-top:14px">
            ${feedRow("ph-storefront", escapeHtml(currentStore.name), `Mã gian hàng: ${currentStore.id}`, "")}
            ${feedRow("ph-user", escapeHtml(currentStore.owner), "Người đại diện pháp luật", "")}
            ${feedRow("ph-envelope-simple", escapeHtml(currentStore.email), "Email đăng nhập đối tác", "")}
            ${feedRow("ph-phone", escapeHtml(currentStore.phone || "0787664860"), "Số điện thoại liên hệ", "")}
            ${feedRow("ph-tag", currentStore.category || "Thương mại điện tử & Bán lẻ", "Ngành hàng đăng ký", "")}
          </div>
        </section>

        <section class="card" style="padding:22px;background:var(--surface-alt)">
          <div class="card-title">
            <h2 style="font-size:16px;margin:0"><i class="ph ph-laptop"></i> Thao Tác Kiểm Thử (Demo)</h2>
          </div>
          <p style="font-size:13px;color:var(--muted);line-height:1.5;margin:12px 0 18px">
            Hệ thống SCANMS mô phỏng đầy đủ quy trình hai chiều giữa <strong>Chủ Shop</strong> và <strong>Vận Hành Sàn</strong>.
            Để xem gian hàng sau khi được duyệt, bạn có thể thực hiện theo 2 cách:
          </p>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button type="button" class="btn" data-action="switch-to-manager" data-store-id="${currentStore.id}" style="width:100%;justify-content:center;background:#2563eb;color:#fff">
              <i class="ph ph-shield-check"></i> 1. Chuyển sang Vận Hành Sàn để bấm Duyệt
            </button>
            <button type="button" class="btn secondary" data-action="quick-approve-shop" data-store-id="${currentStore.id}" style="width:100%;justify-content:center;border-color:#059669;color:#059669">
              <i class="ph ph-check-circle"></i> 2. Phê duyệt nhanh ngay tại đây
            </button>
          </div>
        </section>
      </div>

      <!-- BẢNG SẢN PHẨM TRẠNG THÁI CHỜ DUYỆT -->
      <section class="card">
        <div class="card-title">
          <h2>Danh mục sản phẩm của gian hàng</h2>
          <span class="badge neutral">Chưa kích hoạt</span>
        </div>
        <div style="text-align:center;padding:36px 20px;color:var(--muted)">
          <div style="width:54px;height:54px;border-radius:50%;background:var(--surface-2);display:grid;place-items:center;font-size:26px;margin:0 auto 12px;color:var(--muted)">
            <i class="ph ph-package"></i>
          </div>
          <strong style="font-size:15px;color:var(--text);display:block;margin-bottom:6px">Chưa có sản phẩm nào được công bố</strong>
          <p style="font-size:13px;max-width:480px;margin:0 auto 16px;line-height:1.5">
            Các chức năng đăng tải sản phẩm, cấu hình hoa hồng cho CTV và phát hành mã QR tiếp thị sẽ được mở khóa ngay sau khi hồ sơ gian hàng được Ban Quản Trị &amp; Vận Hành Sàn phê duyệt.
          </p>
        </div>
      </section>
    `;
  }

  return `${header(`Tổng quan ${storeDisplayName}`, "Theo dõi doanh thu liên kết, chi phí hoa hồng và sức khỏe mạng lưới KOL.", `<button class="btn">${icon("ph-plus")} Tạo chiến dịch</button>`)}
  <div class="grid kpis">${kpi("Doanh thu liên kết", "684,2 tr ₫", "+12,8% trong 30 ngày", "ph-chart-line-up")}${kpi("Hoa hồng phải trả", "52,7 tr ₫", "7,7% doanh thu", "ph-coins")}${kpi("KOL đang hoạt động", "128", "+16 KOL mới", "ph-users-three")}${kpi("Tỷ lệ hoàn hàng", "3,18%", "-0,42 điểm", "ph-arrow-u-down-left")}</div>
  <div class="split"><section class="card"><div class="card-title"><h2>Doanh thu và hoa hồng</h2><span>30 ngày gần nhất</span></div>${bars([28, 38, 45, 37, 61, 70, 88], [10, 14, 17, 16, 24, 29, 35])}</section><section class="card"><div class="card-title"><h2>Hoạt động trực tiếp</h2>${status("Đang cập nhật")}</div><div class="feed">${feedRow("ph-shopping-bag", "Đơn #IN23931", "Attribution qua coupon NHATXINH10", "+459.000 ₫")}${feedRow("ph-cursor-click", "218 click mới", "TikTok, 10 phút vừa qua", "")}${feedRow("ph-user-plus", "KOL mới tham gia", "Lê Mai Anh, ngành làm đẹp", "")}</div></section></div>
  <section class="card" style="margin-top:18px"><div class="card-title"><h2>Sản phẩm dẫn đầu</h2><button class="text-btn" data-go="catalog">Quản lý danh mục</button></div><div class="table-wrap" style="border:0"><table><thead><tr><th>Sản phẩm</th><th>Doanh thu</th><th>Đơn hàng</th><th>Tỷ lệ chuyển đổi</th><th>Hoa hồng</th></tr></thead><tbody><tr><td><div class="product-cell"><img class="thumb" src="${productImage}" alt="Serum vitamin C" /><strong>Serum vitamin C 15%</strong></div></td><td>184.600.000 ₫</td><td>402</td><td>3,21%</td><td>8%</td></tr><tr><td><strong>Kem chống nắng SPF50+</strong></td><td>146.800.000 ₫</td><td>377</td><td>2,89%</td><td>10%</td></tr></tbody></table></div></section>`;
}

const products = [
  ["SKIN-C15", "Serum vitamin C 15%", "459.000 ₫", "8%", "426", "Đang bán"],
  ["SUN-AQUA", "Kem chống nắng SPF50+", "389.000 ₫", "10%", "238", "Đang bán"],
  ["CLEANSER-02", "Gel rửa mặt dịu nhẹ", "279.000 ₫", "7%", "0", "Hết hàng"],
  ["MASK-CICA", "Mặt nạ phục hồi Cica", "69.000 ₫", "12%", "812", "Tạm dừng"],
];

function catalogScreen() {
  return `<iframe id="products-management-iframe" src="/merchant/products" style="width:100%;min-height:calc(100vh - 68px);height:calc(100vh - 68px);border:0;background:transparent;display:block" title="Quản lý Sản phẩm và Giá"></iframe>`;
  const q = state.search.toLowerCase();
  const rows = products.filter((p) => p.join(" ").toLowerCase().includes(q));
  return `${header("Danh mục sản phẩm", "Cập nhật tồn kho, giá bán và mức hoa hồng riêng cho từng sản phẩm.", `<button class="btn">${icon("ph-plus")} Thêm sản phẩm</button>`)}<div class="toolbar"><label class="search">${icon("ph-magnifying-glass")}<input class="input" data-search placeholder="Tìm tên hoặc SKU" value="${state.search}" /></label><select class="select" style="width:auto"><option>Tất cả trạng thái</option><option>Đang bán</option><option>Hết hàng</option></select><button class="btn secondary">Bộ lọc</button></div><div class="table-wrap">${rows.length ? `<table><thead><tr><th><input type="checkbox" aria-label="Chọn tất cả" /></th><th>Sản phẩm</th><th>Giá</th><th>Hoa hồng</th><th>Tồn kho</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.map((p, i) => `<tr><td><input type="checkbox" aria-label="Chọn ${p[1]}" /></td><td><div class="product-cell">${i === 0 ? `<img class="thumb" src="${productImage}" alt="${p[1]}" />` : `<span class="thumb" style="display:grid;place-items:center">${icon("ph-drop")}</span>`}<div><strong>${p[1]}</strong><div class="mono" style="color:var(--muted)">${p[0]}</div></div></div></td><td>${p[2]}</td><td><input class="input" style="width:72px" value="${p[3]}" aria-label="Hoa hồng ${p[1]}" /></td><td>${p[4]}</td><td>${status(p[5], p[5] === "Hết hàng" ? "danger" : p[5] === "Tạm dừng" ? "neutral" : "")}</td><td><button class="icon-btn" aria-label="Thêm thao tác">${icon("ph-dots-three")}</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty">${icon("ph-magnifying-glass")}<h3>Không tìm thấy sản phẩm</h3><p>Thử tìm với tên hoặc mã SKU khác.</p></div>`}</div>`;
}

function ordersScreen() {
  return `${header(
    "Đối soát đơn hàng & Động cơ hoa hồng (FR-16, FR-21, FR-22)",
    "Kiểm tra nguồn ghi nhận, điều kiện áp mã KOL giảm giá, phân biệt đơn Guest Checkout và giám sát bộ đếm 14 ngày bảo hộ đổi trả.",
    `<button class="btn secondary" data-toast="Đã chạy Cron Job: Tự động đối soát và giải ngân các đơn hàng vượt mốc 14 ngày!"><i class="ph ph-clock-clockwise"></i> Chạy Cron Job 14 ngày</button><button class="btn secondary" data-order-form="excel">${icon("ph-upload-simple")} Import Excel (FR-20)</button><button class="btn" data-order-form="manual">Tạo đơn thủ công</button>`
  )}
  <div class="grid kpis">
    ${kpi("Tổng đơn trong tháng", "425 đơn", "74% đơn qua tiếp thị KOL", "ph-receipt")}
    ${kpi("Đơn Guest Checkout", "314 đơn", "Mua nhanh qua form không nick", "ph-lightning")}
    ${kpi("Ví Chờ đóng băng (14 ngày)", "86,4 tr ₫", "Bảo hộ thời hạn đổi trả", "ph-hourglass")}
    ${kpi("Hoa hồng đã giải ngân", "142,8 tr ₫", "Đã chuyển sang Ví Khả Dụng", "ph-check-circle")}
  </div>

  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:12px 16px;margin:16px 0;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
    <div style="display:flex;align-items:center;gap:10px">
      <i class="ph ph-info" style="font-size:20px;color:#2563eb;flex-shrink:0"></i>
      <span style="font-size:13px;color:#1e40af">
        <strong>Chính sách đối soát 14 ngày:</strong> Khách mua qua <strong>Guest Checkout</strong> không cần đăng nhập. Khi có mã KOL, khách được giảm giá 10% và hoa hồng được giữ trong <strong>Ví Chờ</strong>. Sau đúng 14 ngày giao thành công (không đổi trả), hệ thống tự động giải ngân cho KOL.
      </span>
    </div>
    <span class="badge success" style="font-size:11.5px;padding:4px 10px"><i class="ph ph-shield-check"></i> Escrow 14 ngày chuẩn TMĐT</span>
  </div>

  <div class="toolbar" style="margin-top:14px">
    <label class="search">${icon("ph-magnifying-glass")}<input class="input" placeholder="Tìm mã đơn, khách hàng, số điện thoại hoặc mã KOL..." /></label>
    <select class="select" style="width:auto">
      <option>Tất cả phương thức mua</option>
      <option>Guest Checkout (Mua qua form)</option>
      <option>Khách thành viên VIP</option>
    </select>
    <select class="select" style="width:auto">
      <option>Tất cả trạng thái hoa hồng</option>
      <option>Đang đếm ngược 14 ngày (Ví Chờ)</option>
      <option>Đã giải ngân Ví Khả Dụng</option>
      <option>Thu hồi Clawback (Hoàn hàng)</option>
      <option>Không có hoa hồng (Mua nguyên giá)</option>
    </select>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Mã đơn</th>
          <th>Khách mua hàng</th>
          <th>KOL & Mã áp dụng</th>
          <th>Giá trị / Thanh toán</th>
          <th>Hoa hồng KOL</th>
          <th>Đối soát 14 ngày (Escrow)</th>
          <th>Trạng thái đơn</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="mono"><strong>#IN23944</strong></td>
          <td>
            <strong>Nguyễn Hải Yến</strong><br>
            <small class="mono">0903 218 456</small><br>
            <span class="badge" style="background:#e0f2fe;color:#0369a1;font-size:10px;margin-top:2px;display:inline-flex;align-items:center;gap:3px"><i class="ph ph-lightning"></i> Guest Checkout</span>
          </td>
          <td>
            <div class="person">
              <span class="avatar" style="background:var(--brand-soft);color:var(--brand-strong)">N</span>
              <div>
                <strong>Trần Văn Nhật</strong><br>
                <span class="badge success" style="font-size:10px">MÃ: NHATXINH10 (-10%)</span>
              </div>
            </div>
          </td>
          <td>
            <strong>413.100 ₫</strong><br>
            <small style="color:#059669">Đã giảm -45.900 ₫</small>
          </td>
          <td>
            <strong style="color:var(--brand)">36.720 ₫</strong><br>
            <small>8% giá trị món</small>
          </td>
          <td>
            <span class="status warning"><i class="ph ph-hourglass"></i> Ví Chờ: Còn 12 ngày</span><br>
            <small style="color:var(--muted)">Đang đếm ngược</small>
          </td>
          <td>${status("Đang giao", "warning")}</td>
          <td>
            <button class="btn small secondary" data-toast="Đơn #IN23944 đang giao hàng. Bộ đếm 14 ngày bắt đầu sau khi giao thành công.">Chi tiết</button>
          </td>
        </tr>

        <tr>
          <td class="mono"><strong>#IN23931</strong></td>
          <td>
            <strong>Lê Hoàng Nam</strong><br>
            <small class="mono">0912 345 678</small><br>
            <span class="badge" style="background:#e0f2fe;color:#0369a1;font-size:10px;margin-top:2px;display:inline-flex;align-items:center;gap:3px"><i class="ph ph-lightning"></i> Guest Checkout</span>
          </td>
          <td>
            <div class="person">
              <span class="avatar" style="background:#f3e8ff;color:#7e22ce">M</span>
              <div>
                <strong>Lê Mai Anh</strong><br>
                <span class="badge success" style="font-size:10px">MÃ: MAIANH12 (-10%)</span>
              </div>
            </div>
          </td>
          <td>
            <strong>826.200 ₫</strong><br>
            <small style="color:#059669">Đã giảm -91.800 ₫</small>
          </td>
          <td>
            <strong style="color:var(--brand)">91.800 ₫</strong><br>
            <small>10% giá trị món</small>
          </td>
          <td>
            <span class="status warning"><i class="ph ph-hourglass"></i> Ví Chờ: Còn 8 ngày</span><br>
            <small style="color:var(--muted)">Giao lúc 01/09</small>
          </td>
          <td>${status("Đã giao")}</td>
          <td>
            <button class="btn small" data-toast="Mô phỏng Cron: Đã kích hoạt giải ngân sớm 91.800 ₫ sang Ví Khả Dụng cho Lê Mai Anh!">Duyệt 14 ngày</button>
          </td>
        </tr>

        <tr>
          <td class="mono"><strong>#IN23712</strong></td>
          <td>
            <strong>Vũ Minh Tuấn</strong><br>
            <small class="mono">0988 776 543</small><br>
            <span class="badge" style="background:#fef3c7;color:#92400e;font-size:10px;margin-top:2px;display:inline-flex;align-items:center;gap:3px"><i class="ph ph-crown"></i> Thành viên VIP</span>
          </td>
          <td>
            <div class="person">
              <span class="avatar" style="background:#ffedd5;color:#9a3412">T</span>
              <div>
                <strong>Nguyễn Đình Tuấn</strong><br>
                <span class="badge success" style="font-size:10px">MÃ: TUANREVIEW</span>
              </div>
            </div>
          </td>
          <td>
            <strong>525.000 ₫</strong><br>
            <small style="color:#059669">Đã giảm -30.000 ₫</small>
          </td>
          <td>
            <strong style="color:#059669">55.500 ₫</strong><br>
            <small>10% giá trị món</small>
          </td>
          <td>
            <span class="status success"><i class="ph ph-check-circle"></i> Đã giải ngân (14 ngày OK)</span><br>
            <small style="color:#059669">Ví Khả Dụng</small>
          </td>
          <td>${status("Đã giao")}</td>
          <td>
            <button class="text-btn" data-toast="Đơn đã hoàn tất 14 ngày an toàn. Hoa hồng đã nằm trong Ví Khả Dụng của KOL.">Lịch sử</button>
          </td>
        </tr>

        <tr>
          <td class="mono"><strong>#IN23845</strong></td>
          <td>
            <strong>Võ Thanh Tâm</strong><br>
            <small class="mono">0912 508 866</small><br>
            <span class="badge" style="background:#e0f2fe;color:#0369a1;font-size:10px;margin-top:2px;display:inline-flex;align-items:center;gap:3px"><i class="ph ph-lightning"></i> Guest Checkout</span>
          </td>
          <td>
            <div class="person">
              <span class="avatar" style="background:#fee2e2;color:#991b1b">L</span>
              <div>
                <strong>Phạm Khánh Linh</strong><br>
                <span class="badge success" style="font-size:10px">MÃ: LINHSKIN</span>
              </div>
            </div>
          </td>
          <td>
            <strong>703.000 ₫</strong><br>
            <small style="color:#059669">Đã giảm -45.000 ₫</small>
          </td>
          <td>
            <strong style="color:#dc2626">0 ₫</strong><br>
            <small style="text-decoration:line-through;color:var(--muted)">67.320 ₫</small>
          </td>
          <td>
            <span class="status danger"><i class="ph ph-arrow-u-down-left"></i> Thu hồi Clawback</span><br>
            <small style="color:#dc2626">Hoàn hàng ngày thứ 4</small>
          </td>
          <td>${status("Hoàn trả", "danger")}</td>
          <td>
            <button class="btn small danger" data-modal="clawback">Xử lý thu hồi</button>
          </td>
        </tr>

        <tr>
          <td class="mono"><strong>#IN23950</strong></td>
          <td>
            <strong>Trần Ngọc Ánh</strong><br>
            <small class="mono">0934 112 233</small><br>
            <span class="badge" style="background:#e0f2fe;color:#0369a1;font-size:10px;margin-top:2px;display:inline-flex;align-items:center;gap:3px"><i class="ph ph-lightning"></i> Guest Checkout</span>
          </td>
          <td>
            <span class="status neutral" style="font-size:11px">Không qua mã KOL</span><br>
            <small style="color:var(--muted)">Mua trực tiếp</small>
          </td>
          <td>
            <strong>459.000 ₫</strong><br>
            <small style="color:var(--muted)">Nguyên giá (0 ₫ giảm)</small>
          </td>
          <td>
            <strong>0 ₫</strong><br>
            <small style="color:var(--muted)">Không có KOL</small>
          </td>
          <td>
            <span class="status neutral">Không phát sinh hoa hồng</span><br>
            <small style="color:var(--muted)">Đơn trực tiếp</small>
          </td>
          <td>${status("Đang đóng gói")}</td>
          <td>
            <button class="text-btn" data-toast="Đơn mua trực tiếp không có mã KOL nên không tính giảm giá và không ghi nhận hoa hồng.">Chi tiết</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

// The prototype delegates FR-20 to the same React form used by /merchant/orders.
document.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest('[data-order-form]') : null;
  if (!button) return;
  const action = button.getAttribute('data-order-form');
  if (action !== 'manual' && action !== 'excel') return;
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'SCANMS_OPEN_ORDER_FORM', action }, window.location.origin);
  } else {
    window.location.href = '/merchant/orders';
  }
});
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.source !== window.parent) return;
  if (event.data?.type === 'SCANMS_ORDER_FORM_COMPLETED' && typeof event.data.message === 'string') toast(event.data.message);
});

function payoutsScreen() {
  // Real shop-scoped payouts replace actionable demo records.
  return `<iframe id="payout-approval-iframe" src="/merchant/payouts" style="width:100%;height:calc(100vh - 100px);min-height:650px;border:0;background:transparent;display:block" title="Duyệt payout và xuất Excel VietQR"></iframe>`;
}

function chatScreen() {
  try {
    const currentToken = localStorage.getItem('token');
    const role = state.role || 'kol';
    const email = role === 'shop' ? 'shop@scanms.vn' : (role === 'admin' ? 'admin@scanms.vn' : 'demo@scanms.vn');
    if (!currentToken || currentToken.startsWith('session-')) {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password@123' })
      }).then(r => r.json()).then(res => {
        const tok = res?.data?.accessToken || res?.accessToken;
        const u = res?.data?.user || res?.user;
        if (tok) {
          localStorage.setItem('token', tok);
          if (u) localStorage.setItem('user', JSON.stringify(u));
          const iframe = document.getElementById('chat-realtime-iframe');
          if (iframe && iframe.contentWindow) {
            try { iframe.contentWindow.postMessage({ type: 'SCANMS_AUTH_SYNC' }, '*'); } catch (e) {}
          }
        }
      }).catch(() => {});
    }
  } catch {}

  return `
    <div style="padding:0;width:100%;height:calc(100vh - 68px);background:#FAF8F5;">
      <iframe id="chat-realtime-iframe" src="/chat" style="width: 100%; height: 100%; border: none; background: transparent; display: block;" title="Hệ thống Tin nhắn Realtime SCANMS"></iframe>
    </div>
  `;
}

// Ghi chú: Màn hình Trang mua hàng (Storefront - FR-15, FR-16) được module hóa tại ./storefront.js

// Ghi chú: Màn hình Tra cứu đơn hàng (Tracking - FR-17, FR-18) được module hóa tại ./tracking.js


function fraudScreen() {
  return `${header("AI Fraud Sentinel", "Ưu tiên các bất thường có rủi ro cao và lưu lại toàn bộ quyết định trong audit log.", `<button class="btn secondary">${icon("ph-sliders-horizontal")} Cấu hình ngưỡng</button>`)}<div class="grid kpis">${kpi("Cảnh báo mở", "8", "3 mức rủi ro cao", "ph-warning-circle", true)}${kpi("Click bị chặn", "12.846", "Trong 24 giờ", "ph-shield-check")}${kpi("IP đang theo dõi", "46", "7 cụm thiết bị", "ph-map-pin")}${kpi("Độ chính xác mẫu", "94,2%", "Theo dữ liệu đã gắn nhãn", "ph-brain")}</div><div class="split"><section class="card"><div class="card-title"><h2>Cảnh báo cần xử lý</h2>${status("3 mức cao", "danger")}</div><div class="feed">${feedRow("ph-warning-octagon", "Click tăng đột biến", "5.284 click / giờ, không có đơn hàng", "Rủi ro 96%", true)}${feedRow("ph-devices", "Cụm thiết bị trùng lặp", "17 tài khoản dùng cùng fingerprint", "Rủi ro 88%", true)}${feedRow("ph-bank", "Rút tiền bất thường", "3 yêu cầu từ vị trí mới trong 6 phút", "Rủi ro 81%", true)}</div></section><section class="card"><div class="card-title"><h2>Chi tiết tín hiệu</h2><span class="mono">FLAG-20260907-084</span></div><div class="summary"><div><span>Link liên kết</span><strong class="mono">a9k2N7</strong></div><div><span>Địa chỉ IP</span><strong class="mono">14.241.***.18</strong></div><div><span>Tần suất</span><strong>8,7 click / giây</strong></div><div><span>Tỷ lệ chuyển đổi</span><strong>0%</strong></div></div><div class="actions"><button class="btn danger" data-toast="Đã chặn nguồn traffic và ghi Audit Log">Chặn nguồn traffic</button><button class="btn secondary" data-toast="Đã chuyển cảnh báo sang trạng thái theo dõi">Theo dõi thêm</button></div></section></div><section class="card" style="margin-top:18px"><div class="card-title"><h2>Audit log bất biến</h2><button class="btn small secondary">Xuất JSON</button></div><div class="table-wrap" style="border:0"><table><thead><tr><th>Thời gian</th><th>Hành động</th><th>Chủ thể</th><th>Đối tượng</th><th>Hash xác thực</th></tr></thead><tbody><tr><td>15:42:18</td><td>${status("AI_FRAUD_FLAG", "danger")}</td><td>fraud-engine</td><td class="mono">link:a9k2N7</td><td class="mono">9c42...a08f</td></tr><tr><td>15:39:02</td><td>${status("PAYOUT_APPROVED")}</td><td>accountant:182</td><td class="mono">payout:9482</td><td class="mono">2bb1...c73d</td></tr></tbody></table></div></section>`;
}

// ==========================================
// SCREEN MỚI CHO KOL: BẢNG VINH DANH LEADERBOARD (UI-16)
// ==========================================
function leaderboardScreen() {
  return `${header(
    "Bảng vinh danh Top KOLs",
    "Bảng xếp hạng hiệu suất Gamification theo tháng. Vinh danh Top 10 đối tác xuất sắc nhất hệ sinh thái SCANMS (UI-16).",
    `<button class="btn secondary" data-toast="Đã lọc dữ liệu Tháng 9/2026">${icon("ph-calendar")} Tháng 9/2026</button>`
  )}
  <div class="podium-grid">
    <!-- Hạng 2: Mai Anh -->
    <div class="podium-card rank-2">
      <span class="podium-badge">2</span>
      <div class="podium-avatar" style="background:#e2e8f0;color:#334155">M</div>
      <strong style="font-size:16px">Lê Mai Anh</strong>
      <p style="margin:4px 0;color:var(--muted);font-size:12px">@maianh.beauty • TikTok</p>
      <div style="margin:8px 0;font-size:18px;font-weight:800;color:var(--ink)">94.200.000 ₫</div>
      <span class="tier-pill gold"><i class="ph ph-medal"></i> Cấp Vàng</span>
      <div class="podium-prize">Thưởng nóng: +2.500.000 ₫</div>
    </div>

    <!-- Hạng 1: Trần Văn Nhật -->
    <div class="podium-card rank-1">
      <i class="ph ph-crown podium-crown"></i>
      <span class="podium-badge">1</span>
      <div class="podium-avatar" style="background:var(--brand-soft);color:var(--brand-strong)">N</div>
      <strong style="font-size:18px">Trần Văn Nhật (Bạn)</strong>
      <p style="margin:4px 0;color:var(--muted);font-size:12px">@nhatdepmoingay • TikTok/Threads</p>
      <div style="margin:8px 0;font-size:22px;font-weight:850;color:var(--brand)">142.850.000 ₫</div>
      <span class="tier-pill diamond"><i class="ph ph-sketch-logo"></i> Kim Cương</span>
      <div class="podium-prize" style="background:rgba(245,158,11,.15);color:#b45309">Thưởng nóng: +5.000.000 ₫ & +5% HH</div>
    </div>

    <!-- Hạng 3: Tuấn Nguyễn -->
    <div class="podium-card rank-3">
      <span class="podium-badge">3</span>
      <div class="podium-avatar" style="background:#ffedd5;color:#9a3412">T</div>
      <strong style="font-size:16px">Nguyễn Đình Tuấn</strong>
      <p style="margin:4px 0;color:var(--muted);font-size:12px">@tuanreview • YouTube</p>
      <div style="margin:8px 0;font-size:18px;font-weight:800;color:var(--ink)">78.600.000 ₫</div>
      <span class="tier-pill silver"><i class="ph ph-shield"></i> Cấp Bạc</span>
      <div class="podium-prize">Thưởng nóng: +1.000.000 ₫</div>
    </div>
  </div>

  <section class="card" style="margin-top:18px">
    <div class="card-title">
      <h2>Danh sách Top 4 - 10 tháng 9</h2>
      <span>Cập nhật tự động lúc 18:00</span>
    </div>
    <div class="table-wrap" style="border:0">
      <table>
        <thead>
          <tr>
            <th>Hạng</th>
            <th>KOL / CTV</th>
            <th>Kênh chính</th>
            <th>Cấp bậc</th>
            <th>Lượt nhấp</th>
            <th>Đơn hàng</th>
            <th>Tỷ lệ chuyển đổi</th>
            <th>Doanh số ghi nhận</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight:800;color:var(--muted)">#04</td>
            <td><strong>Phạm Khánh Linh</strong></td>
            <td>TikTok (@linhskincare)</td>
            <td><span class="tier-pill silver">Cấp Bạc</span></td>
            <td>8.420</td>
            <td>192</td>
            <td>2,28%</td>
            <td><strong>64.250.000 ₫</strong></td>
          </tr>
          <tr>
            <td style="font-weight:800;color:var(--muted)">#05</td>
            <td><strong>Hoàng Hải Đăng</strong></td>
            <td>Facebook (Đăng Review)</td>
            <td><span class="tier-pill silver">Cấp Bạc</span></td>
            <td>6.110</td>
            <td>145</td>
            <td>2,37%</td>
            <td><strong>48.900.000 ₫</strong></td>
          </tr>
          <tr>
            <td style="font-weight:800;color:var(--muted)">#06</td>
            <td><strong>Đỗ Thùy Trang</strong></td>
            <td>Instagram (@trangmakeup)</td>
            <td><span class="tier-pill bronze">Cấp Đồng</span></td>
            <td>5.200</td>
            <td>118</td>
            <td>2,26%</td>
            <td><strong>39.400.000 ₫</strong></td>
          </tr>
          <tr>
            <td style="font-weight:800;color:var(--muted)">#07</td>
            <td><strong>Nguyễn Phương Uyên</strong></td>
            <td>Threads (@uyendaily)</td>
            <td><span class="tier-pill bronze">Cấp Đồng</span></td>
            <td>4.850</td>
            <td>94</td>
            <td>1,93%</td>
            <td><strong>31.200.000 ₫</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>`;
}

// ==========================================
// SCREEN MỚI CHO SHOP: QUẢN LÝ ĐỘI NGŨ CTV
// ==========================================
function shopCollaboratorsScreen() {
  return `<iframe id="store-collaborators-iframe" src="/merchant/collaborators" style="width:100%;min-height:760px;height:calc(100vh - 125px);border:0;background:transparent;display:block" title="Quản lý Đội ngũ Cộng tác viên"></iframe>`;
  return `${header(
    "Quản lý Đội ngũ Cộng tác viên",
    "Theo dõi danh sách KOL/KOC đang chạy tiếp thị cho Sora Skin, doanh số mang về và thiết lập hoa hồng riêng.",
    `<button class="btn">${icon("ph-user-plus")} Mời KOL mới</button>`
  )}
  <div class="grid kpis">
    ${kpi("CTV đang liên kết", "128", "+14 người trong tháng", "ph-users-three")}
    ${kpi("Doanh số từ CTV", "684,2 tr ₫", "Chiếm 88% tổng shop", "ph-chart-line-up")}
    ${kpi("Chờ duyệt mẫu", "6 yêu cầu", "3 KOL trên 100k follow", "ph-package")}
    ${kpi("Cần gắn cờ rủi ro", "1 KOL", "Traffic tăng bất thường", "ph-warning-circle", true)}
  </div>
  <div class="toolbar" style="margin-top:18px">
    <label class="search">${icon("ph-magnifying-glass")}<input class="input" placeholder="Tìm theo tên KOL, TikTok handle hoặc mã ref..." /></label>
    <select class="select" style="width:auto">
      <option>Tất cả cấp bậc</option>
      <option>Kim Cương (5%)</option>
      <option>Vàng (3%)</option>
      <option>Bạc (1.5%)</option>
      <option>Đồng (Cơ bản)</option>
    </select>
    <button class="btn secondary">Bộ lọc</button>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>KOL / KOC</th>
          <th>Kênh MXH</th>
          <th>Cấp bậc</th>
          <th>Doanh số đem lại</th>
          <th>Đơn chốt</th>
          <th>Hoa hồng hưởng</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="person"><span class="avatar" style="background:var(--brand-soft);color:var(--brand-strong)">N</span><div><strong>Trần Văn Nhật</strong><br><small class="mono">REF: NHATXINH10</small></div></div>
          </td>
          <td>TikTok (@nhatdepmoingay)</td>
          <td><span class="tier-pill gold">Vàng (+3%)</span></td>
          <td><strong>142.850.000 ₫</strong></td>
          <td>312</td>
          <td>14% (VIP)</td>
          <td>${status("Đang hoạt động")}</td>
          <td>
            <div class="actions">
              <button class="btn small" data-toast="Đã mở cấu hình hoa hồng VIP cho Trần Văn Nhật">Chỉnh % HH</button>
              <button class="icon-btn" data-go="chat" aria-label="Nhắn tin">${icon("ph-chats-circle")}</button>
            </div>
          </td>
        </tr>
        <tr>
          <td>
            <div class="person"><span class="avatar">M</span><div><strong>Lê Mai Anh</strong><br><small class="mono">REF: MAIANH12</small></div></div>
          </td>
          <td>TikTok (@maianh.beauty)</td>
          <td><span class="tier-pill gold">Vàng (+3%)</span></td>
          <td><strong>94.200.000 ₫</strong></td>
          <td>206</td>
          <td>12%</td>
          <td>${status("Đang hoạt động")}</td>
          <td>
            <div class="actions">
              <button class="btn small" data-toast="Đã mở cấu hình hoa hồng VIP cho Lê Mai Anh">Chỉnh % HH</button>
              <button class="icon-btn" data-go="chat" aria-label="Nhắn tin">${icon("ph-chats-circle")}</button>
            </div>
          </td>
        </tr>
        <tr>
          <td>
            <div class="person"><span class="avatar">L</span><div><strong>Phạm Khánh Linh</strong><br><small class="mono">REF: LINHSKIN</small></div></div>
          </td>
          <td>Instagram (@linhskincare)</td>
          <td><span class="tier-pill silver">Bạc (+1.5%)</span></td>
          <td><strong>64.250.000 ₫</strong></td>
          <td>138</td>
          <td>10%</td>
          <td>${status("Chờ gửi mẫu", "warning")}</td>
          <td>
            <div class="actions">
              <button class="btn small secondary" data-go="samples">Duyệt mẫu</button>
              <button class="icon-btn" data-go="chat" aria-label="Nhắn tin">${icon("ph-chats-circle")}</button>
            </div>
          </td>
        </tr>
        <tr>
          <td>
            <div class="person"><span class="avatar" style="background:#fee2e2;color:#991b1b">K</span><div><strong>Trần Hữu Kiên</strong><br><small class="mono">REF: KIENPRO99</small></div></div>
          </td>
          <td>Facebook</td>
          <td><span class="tier-pill bronze">Đồng</span></td>
          <td><strong>2.100.000 ₫</strong></td>
          <td>4</td>
          <td>8%</td>
          <td>${status("Cảnh báo AI Fraud", "danger")}</td>
          <td>
            <div class="actions">
              <button class="btn small danger" data-toast="Đã tạm ngưng quyền affiliate của KOL vi phạm">Tạm ngưng</button>
              <button class="icon-btn" data-go="fraud" aria-label="Xem fraud">${icon("ph-shield-warning")}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

// ==========================================
// SCREENS CHO QUẢN TRỊ SÀN (SYSTEM ADMIN)
// ==========================================
function adminDashboardScreen() {
  const pendingStores = managerState.stores.filter(s => s.status === 'pending' || s.status === 'reviewing');
  return `${header(
    "Executive SaaS Super Admin",
    "Bảng điều phối trung tâm toàn bộ nền tảng SCANMS: giám sát dòng tiền, tổng GMV và tỷ lệ an toàn hệ thống (UI-19).",
    `<button class="btn secondary" data-toast="Đã làm mới dữ liệu realtime toàn sàn">${icon("ph-arrows-clockwise")} Làm mới dữ liệu</button>`
  )}
  ${pendingStores.length > 0 ? `
    <div style="background:#fffbeb;border:1.5px solid #f59e0b;border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 4px 14px rgba(245,158,11,0.12)">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:44px;height:44px;border-radius:12px;background:#fef3c7;color:#d97706;display:grid;place-items:center;font-size:24px">
          <i class="ph ph-hourglass-high"></i>
        </div>
        <div>
          <strong style="font-size:14px;color:#92400e;display:block">Có ${pendingStores.length} hồ sơ gian hàng Shop đang chờ duyệt</strong>
          <span style="font-size:12.5px;color:#78350f">Gian hàng mới nhất: <strong>${escapeHtml(pendingStores[0].name)} (${pendingStores[0].id})</strong> • Email: ${escapeHtml(pendingStores[0].email)}</span>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn small" data-mgr-approve-store="${pendingStores[0].id}" style="background:#059669;color:#fff;font-weight:700">
          <i class="ph ph-check"></i> Duyệt ngay
        </button>
        <button class="btn small secondary" data-go="manager-stores">
          Xem tất cả (${pendingStores.length}) &rarr;
        </button>
      </div>
    </div>
  ` : ''}
  <div class="admin-hero">
    <div class="admin-hero-title">
      <div>
        <span class="admin-core-badge">
          <i class="ph ph-shield-check"></i> SCANMS SaaS Network Core • Phiên bản 2.4 Enterprise
        </span>
        <h2 class="admin-hero-heading">Tổng quan Nền tảng Toàn Sàn</h2>
        <p class="admin-hero-sub">Theo dõi 156 cửa hàng đối tác và 10.420 cộng tác viên trên toàn quốc.</p>
      </div>
      <button class="btn btn-admin-audit" data-toast="Đã tạo báo cáo kiểm toán tài chính PDF">
        <i class="ph ph-file-pdf"></i> Xuất Audit Report
      </button>
    </div>
    <div class="admin-hero-stats">
      <div class="admin-stat-item">
        <small>Tổng GMV toàn sàn (Tháng 9)</small>
        <strong>24,85 Tỷ ₫</strong>
        <span class="admin-stat-badge positive"><i class="ph ph-trend-up"></i> +18,2% MoM</span>
      </div>
      <div class="admin-stat-item">
        <small>Doanh thu phí sàn SaaS (3%)</small>
        <strong class="stat-brand">745,5 Tr ₫</strong>
        <span class="admin-stat-badge positive"><i class="ph ph-check-circle"></i> Đã thu 100%</span>
      </div>
      <div class="admin-stat-item">
        <small>Tổng hoa hồng luân chuyển</small>
        <strong>2,86 Tỷ ₫</strong>
        <span class="admin-stat-badge neutral"><i class="ph ph-hourglass"></i> Giữ an toàn 14 ngày</span>
      </div>
      <div class="admin-stat-item">
        <small>Chỉ số rủi ro / AI Fraud</small>
        <strong style="color:#059669">0,38%</strong>
        <span class="admin-stat-badge safe"><i class="ph ph-shield-check"></i> Dưới ngưỡng 1%</span>
      </div>
    </div>
  </div>

  <div class="grid kpis">
    ${kpi("Shop đang hoạt động", "156", "+12 shop mới onboard", "ph-buildings")}
    ${kpi("Tổng CTV / KOL", "10.420", "8.910 đã xác minh KYC", "ph-users")}
    ${kpi("Lệnh rút tiền chờ duyệt", "48", money(118500000), "ph-bank")}
    ${kpi("Audit Logs 24h", "42.850 logs", "100% SHA-256 Valid", "ph-shield-checkered")}
  </div>

  <div class="split">
    <section class="card">
      <div class="card-title">
        <h2>Tăng trưởng GMV & Giao dịch toàn sàn (7 ngày)</h2>
        <span>Triệu VNĐ / Số đơn</span>
      </div>
      ${bars([45, 58, 62, 75, 84, 91, 98], [18, 24, 28, 36, 42, 48, 55])}
    </section>
    <section class="card">
      <div class="card-title">
        <h2>Top Gian hàng doanh số cao nhất</h2>
        <button class="text-btn" data-go="manager-stores">Xem &amp; Duyệt tất cả &rarr;</button>
      </div>
      <div class="feed">
        ${feedRow("ph-storefront", "Sora Skin Official", "Doanh số: 684,2 Tr ₫ • 128 CTV", "+52,7 Tr HH")}
        ${feedRow("ph-storefront", "Glow Cosmetics Vietnam", "Doanh số: 512,8 Tr ₫ • 94 CTV", "+41,0 Tr HH")}
        ${feedRow("ph-storefront", "The Daily Skincare", "Doanh số: 389,1 Tr ₫ • 76 CTV", "+29,8 Tr HH")}
      </div>
    </section>
  </div>`;
}

function adminStoresScreen() {
  return `${header(
    "Quản lý & Duyệt Gian hàng (Store Onboarding)",
    "Thẩm định giấy phép kinh doanh, mã số thuế và kiểm duyệt các gian hàng đối tác tham gia nền tảng (Screen 18).",
    `<button class="btn">${icon("ph-plus")} Thêm Gian hàng</button>`
  )}
  <div class="toolbar">
    <label class="search">${icon("ph-magnifying-glass")}<input class="input" placeholder="Tìm theo tên shop, MST hoặc chủ doanh nghiệp..." /></label>
    <select class="select" style="width:auto">
      <option>Tất cả trạng thái</option>
      <option>Đang hoạt động</option>
      <option>Chờ duyệt hồ sơ</option>
      <option>Tạm khóa</option>
    </select>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Tên Gian hàng</th>
          <th>Người đại diện</th>
          <th>Mã số thuế</th>
          <th>Gói SaaS</th>
          <th>Doanh số 30 ngày</th>
          <th>Phí sàn (3%)</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><div class="product-cell"><span class="avatar" style="background:#F5E7CC;color:#7A561B">S</span><div><strong>Sora Skin Official</strong><div class="mono" style="color:var(--muted)">STORE-001</div></div></div></td>
          <td>Nguyễn Văn Quý<br><small>quy.nguyen@soraskin.vn</small></td>
          <td class="mono">0318492811</td>
          <td><span class="status">Enterprise</span></td>
          <td>684.200.000 ₫</td>
          <td><strong>20.526.000 ₫</strong></td>
          <td>${status("Đang hoạt động")}</td>
          <td><button class="btn small secondary" data-toast="Đã mở hồ sơ pháp lý Sora Skin">Xem hồ sơ</button></td>
        </tr>
        <tr>
          <td><div class="product-cell"><span class="avatar" style="background:#fef3c7;color:#b45309">G</span><div><strong>Glow Cosmetics</strong><div class="mono" style="color:var(--muted)">STORE-002</div></div></div></td>
          <td>Trần Thị Thu Hà<br><small>ha.tran@glowcos.vn</small></td>
          <td class="mono">0109284729</td>
          <td><span class="status">Growth</span></td>
          <td>512.800.000 ₫</td>
          <td><strong>15.384.000 ₫</strong></td>
          <td>${status("Đang hoạt động")}</td>
          <td><button class="btn small secondary" data-toast="Đã mở hồ sơ pháp lý Glow Cosmetics">Xem hồ sơ</button></td>
        </tr>
        <tr>
          <td><div class="product-cell"><span class="avatar" style="background:#e0e7ff;color:#4338ca">A</span><div><strong>An An Fashion House</strong><div class="mono" style="color:var(--muted)">STORE-015</div></div></div></td>
          <td>Lê Hoàng An<br><small>an.le@ananfashion.vn</small></td>
          <td class="mono">0319984712</td>
          <td><span class="status warning">Chờ Onboard</span></td>
          <td>0 ₫</td>
          <td>0 ₫</td>
          <td>${status("Chờ duyệt MST", "warning")}</td>
          <td><button class="btn small" data-toast="Đã phê duyệt Onboarding gian hàng An An Fashion">Duyệt mở Shop</button></td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

function adminUsersScreen() {
  return `
    <div style="padding:0;width:100%;height:calc(100vh - 68px);background:#FAF8F5;">
      <iframe id="admin-users-iframe" src="/admin/users" style="width: 100%; height: 100%; border: none; background: transparent; display: block;" title="Quan Tri User va Duyet KYC"></iframe>
    </div>
  `;
}

function adminBanksScreen() {
  return `${header(
    "Cổng Ngân hàng & Đối soát Chi trả Sàn",
    "Quản lý danh sách ngân hàng kết nối tự động Napas247, mã định danh VietQR và giám sát pool thanh khoản chi trả toàn hệ thống.",
    `<button class="btn">${icon("ph-plus")} Thêm Ngân hàng</button>`
  )}
  <div class="grid kpis">
    ${kpi("Ngân hàng tích hợp", "38 ngân hàng", "Napas247 / VietQR API", "ph-bank")}
    ${kpi("Pool thanh khoản toàn sàn", "8,45 Tỷ ₫", "Sẵn sàng chi trả", "ph-vault")}
    ${kpi("Lệnh chuyển lô hôm nay", "142 lệnh", "Tỷ lệ thành công 99,8%", "ph-check-circle")}
    ${kpi("Giao dịch lỗi mã tra soát", "2 lệnh", "Chờ phản hồi ngân hàng", "ph-warning-octagon", true)}
  </div>

  <section class="card" style="margin-top:18px">
    <div class="card-title">
      <h2>Các Ngân hàng trọng điểm có tỷ trọng giao dịch cao nhất</h2>
      ${status("Kết nối Realtime 24/7")}
    </div>
    <div class="channel-grid">
      <article class="card channel-card">
        <div class="channel-top"><span class="channel-icon">${icon("ph-bank")}</span>${status("99.9% Uptime")}</div>
        <div><h2>Vietcombank</h2><strong>Ngân hàng TMCP Ngoại thương</strong><p>Hạn mức lô: 2.000.000.000 ₫/lần</p></div>
        <div class="actions"><button class="btn small secondary" data-toast="Webhook Vietcombank hoạt động ổn định">Kiểm tra Ping</button></div>
      </article>
      <article class="card channel-card">
        <div class="channel-top"><span class="channel-icon">${icon("ph-bank")}</span>${status("99.9% Uptime")}</div>
        <div><h2>Techcombank</h2><strong>Ngân hàng TMCP Kỹ Thương</strong><p>Hạn mức lô: 1.500.000.000 ₫/lần</p></div>
        <div class="actions"><button class="btn small secondary" data-toast="Webhook Techcombank hoạt động ổn định">Kiểm tra Ping</button></div>
      </article>
      <article class="card channel-card">
        <div class="channel-top"><span class="channel-icon">${icon("ph-bank")}</span>${status("99.8% Uptime")}</div>
        <div><h2>MB Bank</h2><strong>Ngân hàng TMCP Quân Đội</strong><p>Hạn mức lô: 1.000.000.000 ₫/lần</p></div>
        <div class="actions"><button class="btn small secondary" data-toast="Webhook MB Bank hoạt động ổn định">Kiểm tra Ping</button></div>
      </article>
      <article class="card channel-card">
        <div class="channel-top"><span class="channel-icon">${icon("ph-bank")}</span>${status("99.9% Uptime")}</div>
        <div><h2>ACB</h2><strong>Ngân hàng TMCP Á Châu</strong><p>Hạn mức lô: 1.000.000.000 ₫/lần</p></div>
        <div class="actions"><button class="btn small secondary" data-toast="Webhook ACB hoạt động ổn định">Kiểm tra Ping</button></div>
      </article>
    </div>
  </section>`;
}

// Dữ liệu mẫu Nhật ký An ninh Toàn hệ thống (Audit Trail)
const auditTrailRecords = [
  {
    time: "08/09 19:42:18",
    event: "AI_FRAUD_FLAG",
    tone: "danger",
    actor: "system:ai-sentinel",
    target: "link:a9k2N7",
    ip: "14.241.88.19",
    hash: "9c42f8e12ab0478129eacbc029147a08",
    payload: {
      event_id: "EVT-9042",
      detector: "AI_VELOCITY_SPIKE_SENTINEL",
      risk_score: 94,
      threshold: 85,
      trigger: "1,420 clicks / 120s from VNPT Proxy Pool",
      source_ips: ["14.241.88.19", "14.241.88.20", "14.241.88.21"],
      kol_id: "KOL-782",
      target_store: "STORE-001 (Sora Skin Official)",
      recommendation: "HOLD_PAYOUT_AND_NOTIFY_MANAGER",
      tamper_proof_hash: "SHA256:9c42f8e12ab0478129eacbc029147a08"
    }
  },
  {
    time: "08/09 19:39:02",
    event: "PAYOUT_APPROVED",
    tone: "success",
    actor: "shop:soraskin:mgr01",
    target: "payout:9482",
    ip: "118.69.12.44",
    hash: "2bb1fa93012de94129bc89214711c73d",
    payload: {
      event_id: "EVT-9041",
      action: "MERCHANT_APPROVE_PAYOUT",
      payout_id: "PO-9482",
      kol_recipient: "KOL-R9K2N7 (Trần Văn Nhật)",
      gross_commission: 4000000,
      personal_income_tax_10pct: 400000,
      net_payout: 3600000,
      bank_transfer_ref: "VCB-FT2609088219",
      gateway: "VietQR Sandbox Simulator",
      escrow_hold_passed_days: 14,
      authorized_by: "Nguyễn Thu Hà (Shop Manager)",
      tamper_proof_hash: "SHA256:2bb1fa93012de94129bc89214711c73d"
    }
  },
  {
    time: "08/09 18:15:30",
    event: "STORE_ONBOARDED",
    tone: "info",
    actor: "manager:phuc-lh",
    target: "store:soraskin",
    ip: "113.161.45.88",
    hash: "e712ca89012bb49129ac1002931499bc",
    payload: {
      event_id: "EVT-9040",
      action: "PLATFORM_APPROVE_STORE",
      store_id: "STORE-001",
      business_name: "Sora Skin Official",
      tax_code: "0109823456",
      license_doc: "GPKD_SoraSkin_2026.pdf",
      approved_by: "Lê Hồng Phúc (Vận Hành Sàn)",
      status_transition: "reviewing -> approved",
      tamper_proof_hash: "SHA256:e712ca89012bb49129ac1002931499bc"
    }
  },
  {
    time: "08/09 17:02:11",
    event: "USER_KYC_VERIFIED",
    tone: "info",
    actor: "admin:thang-nt25",
    target: "user:kol:nhat-tv",
    ip: "113.161.45.88",
    hash: "51aa8912bc091244e8bc1947219484e1",
    payload: {
      event_id: "EVT-9039",
      action: "VERIFY_CITIZEN_ID_AND_TAX",
      user_id: "KOL-R9K2N7",
      full_name: "Trần Văn Nhật",
      cccd_masked: "079***0084",
      tax_identification_number: "882947192",
      kyc_status: "VERIFIED_ELIGIBLE_FOR_WITHDRAWAL",
      verified_by: "Nguyễn Thành Thắng (Quản Trị Hệ Thống)",
      tamper_proof_hash: "SHA256:51aa8912bc091244e8bc1947219484e1"
    }
  },
  {
    time: "08/09 16:40:05",
    event: "COMMISSION_CLAWBACK",
    tone: "warning",
    actor: "system:refund-engine",
    target: "order:IN23845",
    ip: "127.0.0.1 (Internal Worker)",
    hash: "88cf01928bc940129ac19401298412da",
    payload: {
      event_id: "EVT-9038",
      action: "REVERSE_COMMISSION_ON_CUSTOMER_RETURN",
      order_id: "IN23845",
      clawback_amount: 67320,
      reason: "CUSTOMER_RETURN_WITHIN_14_DAYS",
      wallet_affected: "WALLET-KOL-R9K2N7 (Pending Escrow Balance)",
      ledger_entry_type: "REVERSE_DOUBLE_ENTRY",
      tamper_proof_hash: "SHA256:88cf01928bc940129ac19401298412da"
    }
  }
];

function openAuditJsonModal(recordIndex) {
  const rec = auditTrailRecords[recordIndex] || auditTrailRecords[0];
  const formattedJson = JSON.stringify(rec.payload, null, 2);
  const content = `
    <div style="display:flex;align-items:center;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--line)">
      <div style="width:40px;height:40px;border-radius:10px;background:var(--brand-soft);color:var(--brand-strong);display:grid;place-items:center;font-size:20px">
        <i class="ph ph-code"></i>
      </div>
      <div>
        <h2 style="margin:0;font-size:17px">Chi Tiết Payload Audit Trail: ${rec.event}</h2>
        <p style="margin:2px 0 0;color:var(--muted);font-size:12.5px">
          Bản ghi bất biến • Thời gian: ${rec.time} • IP: <span class="mono">${rec.ip}</span>
        </p>
      </div>
    </div>

    <div style="margin:16px 0;background:var(--surface-2);padding:12px 14px;border-radius:8px;font-size:12px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <small style="color:var(--muted)">Mã băm toàn vẹn (SHA-256):</small>
        <div class="mono" style="font-weight:700;color:var(--brand);margin-top:2px">${rec.hash}</div>
      </div>
      <span class="badge success" style="font-size:11px"><i class="ph ph-shield-check"></i> Hash Verified</span>
    </div>

    <div style="position:relative;margin-bottom:16px">
      <pre class="audit-json-pre" style="background:#0f172a;color:#f8fafc;padding:16px;border-radius:10px;font-family:monospace;font-size:12.5px;max-height:300px;overflow:auto;line-height:1.5;margin:0"><code>${escapeHtml(formattedJson)}</code></pre>
      <button class="btn small" id="copy-audit-json-btn" style="position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.18);color:#fff;border:none;backdrop-filter:blur(4px);cursor:pointer">
        <i class="ph ph-copy"></i> Sao chép JSON
      </button>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
      <button class="btn secondary" id="download-audit-json-btn">
        <i class="ph ph-download-simple"></i> Tải bản ghi (.json)
      </button>
      <button class="btn" data-close-modal>Đóng</button>
    </div>
  `;

  document.querySelector("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-close-modal>
      <section class="modal modal-lg" role="dialog" aria-modal="true" style="max-width:680px">
        <div class="modal-head">
          <div style="width:100%">${content}</div>
          <button class="icon-btn" data-close-modal aria-label="Đóng"><i class="ph ph-x"></i></button>
        </div>
      </section>
    </div>
  `;

  bindModal();

  document.querySelector("#copy-audit-json-btn")?.addEventListener("click", () => {
    navigator.clipboard?.writeText(formattedJson);
    toast("Đã sao chép nội dung JSON Payload vào clipboard!");
  });

  document.querySelector("#download-audit-json-btn")?.addEventListener("click", () => {
    const blob = new Blob([formattedJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_${rec.event}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Đã tải xuống tệp JSON bản ghi Audit!");
  });
}

function adminAuditScreen() {
  return `${header(
    "Nhật ký An ninh Toàn hệ thống (Audit Trail)",
    "Chuỗi bản ghi bất biến lưu vết mọi hành động can thiệp tài chính, cấp quyền RBAC và phát hiện gian lận bằng mã băm SHA-256.",
    `<button class="btn secondary" id="export-all-audit-btn">${icon("ph-code")} Xuất Toàn Bộ Audit JSON</button>`
  )}
  <div class="toolbar">
    <label class="search">${icon("ph-magnifying-glass")}<input class="input" placeholder="Tìm theo Action, User ID, IP hoặc Hash..." /></label>
    <select class="select" style="width:auto">
      <option>Tất cả sự kiện</option>
      <option>AI_FRAUD_FLAG</option>
      <option>PAYOUT_APPROVED</option>
      <option>STORE_ONBOARDED</option>
      <option>USER_KYC_VERIFIED</option>
      <option>COMMISSION_CLAWBACK</option>
    </select>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Thời gian (UTC+7)</th>
          <th>Sự kiện (Event)</th>
          <th>Chủ thể thực hiện</th>
          <th>Đối tượng tác động</th>
          <th>Địa chỉ IP</th>
          <th>Mã Hash SHA-256</th>
          <th style="text-align:right">Chi tiết Payload</th>
        </tr>
      </thead>
      <tbody>
        ${auditTrailRecords.map((rec, idx) => `
          <tr>
            <td class="mono" style="font-size:12px">${rec.time}</td>
            <td>${status(rec.event, rec.tone)}</td>
            <td><strong>${rec.actor}</strong></td>
            <td class="mono">${rec.target}</td>
            <td class="mono" style="font-size:11.5px">${rec.ip}</td>
            <td class="mono" style="font-size:11.5px;color:var(--brand)">${rec.hash.slice(0, 8)}...${rec.hash.slice(-4)}</td>
            <td style="text-align:right">
              <button class="text-btn" data-view-audit-json="${idx}" style="font-weight:600">Xem JSON</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>`;
}

function commissionRulesScreen() {
  try {
    const currentToken = localStorage.getItem('token');
    const currentUserStr = localStorage.getItem('user');
    let currentRole = null;
    if (currentUserStr) {
      try { currentRole = JSON.parse(currentUserStr)?.role; } catch (e) {}
    }

    // Nếu đang lưu vai trò không tương thích (COLLABORATOR), xóa token cũ để tránh 403
    const roleMismatch = currentRole && currentRole !== 'SHOP_MANAGER' && currentRole !== 'SYSTEM_ADMIN';
    if (roleMismatch) {
      localStorage.removeItem('token');
      localStorage.setItem('user', JSON.stringify({
        role: 'SHOP_MANAGER',
        email: 'shop@scanms.vn',
        fullName: 'Trần Văn Chủ Shop'
      }));
    } else if (!currentUserStr) {
      localStorage.setItem('user', JSON.stringify({
        role: 'SHOP_MANAGER',
        email: 'shop@scanms.vn',
        fullName: 'Trần Văn Chủ Shop'
      }));
    }

    // Nếu chưa có token hoặc token cũ dạng session-, tự động lấy JWT thật
    if (roleMismatch || !currentToken || currentToken.startsWith('session-')) {
      localStorage.removeItem('token');
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'shop@scanms.vn', password: 'Password@123' })
      }).then(r => r.json()).then(res => {
        const tok = res?.data?.accessToken || res?.accessToken;
        const u = res?.data?.user || res?.user;
        if (tok && u && localStorage.getItem('scanms-current-role') === 'shop') {
          localStorage.setItem('token', tok);
          localStorage.setItem('user', JSON.stringify(u));
          const iframe = document.getElementById('commission-rules-iframe');
          if (iframe && iframe.contentWindow) {
            try { iframe.contentWindow.postMessage({ type: 'SCANMS_AUTH_SYNC' }, '*'); } catch (e) {}
          }
        }
      }).catch(() => {});
    }
  } catch { }

  return `
    <div style="padding:0;width:100%;height:calc(100vh - 68px);">
      <iframe id="commission-rules-iframe" src="/merchant/commission-rules" style="width: 100%; height: 100%; border: none; background: transparent; display: block;" title="Cấu hình Mốc Thưởng Doanh Số"></iframe>
    </div>
  `;
}

function kolBonusScreen() {
  try {
    const currentToken = localStorage.getItem('token');
    const currentUserStr = localStorage.getItem('user');
    let currentRole = null;
    if (currentUserStr) {
      try { currentRole = JSON.parse(currentUserStr)?.role; } catch (e) {}
    }

    // Nếu đang lưu vai trò khác COLLABORATOR (ví dụ SHOP_MANAGER còn sót), xóa token cũ và đổi sang COLLABORATOR
    const roleMismatch = currentRole && currentRole !== 'COLLABORATOR';
    if (roleMismatch) {
      localStorage.removeItem('token');
      localStorage.setItem('user', JSON.stringify({
        role: 'COLLABORATOR',
        email: 'demo@scanms.vn',
        fullName: 'Trần Văn Nhật'
      }));
    } else if (!currentUserStr) {
      localStorage.setItem('user', JSON.stringify({
        role: 'COLLABORATOR',
        email: 'demo@scanms.vn',
        fullName: 'Trần Văn Nhật'
      }));
    }

    // Nếu chưa có token hoặc token cũ dạng session-, tự động lấy JWT thật
    if (roleMismatch || !currentToken || currentToken.startsWith('session-')) {
      localStorage.removeItem('token');
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@scanms.vn', password: 'Password@123' })
      }).then(r => r.json()).then(res => {
        const tok = res?.data?.accessToken || res?.accessToken;
        const u = res?.data?.user || res?.user;
        if (tok && u && localStorage.getItem('scanms-current-role') === 'kol') {
          localStorage.setItem('token', tok);
          localStorage.setItem('user', JSON.stringify(u));
          const iframe = document.getElementById('kol-bonus-iframe');
          if (iframe && iframe.contentWindow) {
            try { iframe.contentWindow.postMessage({ type: 'SCANMS_AUTH_SYNC' }, '*'); } catch (e) {}
          }
        }
      }).catch(() => {});
    }
  } catch { }

  return `
    <div style="padding:0;width:100%;height:calc(100vh - 68px);">
      <iframe id="kol-bonus-iframe" src="/collaborator/bonus-progress" style="width: 100%; height: 100%; border: none; background: transparent; display: block;" title="Tiến Độ Mốc Thưởng Doanh Số"></iframe>
    </div>
  `;
}

function kolCouponsScreen() {
  try {
    const currentToken = localStorage.getItem('token');
    const currentUserStr = localStorage.getItem('user');
    let roleMismatch = false;
    if (currentUserStr) {
      try {
        const parsed = JSON.parse(currentUserStr);
        if (parsed.role !== 'COLLABORATOR') {
          roleMismatch = true;
        }
      } catch (e) {}
    }
    if (roleMismatch || !currentToken || currentToken.startsWith('session-')) {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@scanms.vn', password: 'Password@123' })
      }).then(r => r.json()).then(res => {
        const tok = res?.data?.accessToken || res?.accessToken;
        const u = res?.data?.user || res?.user;
        if (tok && u && localStorage.getItem('scanms-current-role') === 'kol') {
          localStorage.setItem('token', tok);
          localStorage.setItem('user', JSON.stringify(u));
          document.querySelectorAll('iframe').forEach(ifr => {
            try { ifr.contentWindow.postMessage({ type: 'SCANMS_AUTH_SYNC' }, '*'); } catch (e) {}
          });
        }
      }).catch(() => {});
    }
  } catch {}

  return `
    <div style="padding:0;width:100%;height:calc(100vh - 68px);height:calc(100dvh - 68px);min-height:calc(100vh - 68px);min-height:calc(100dvh - 68px);position:relative;overflow:hidden;">
      <iframe id="kol-coupons-iframe" src="/collaborator/coupons" style="width: 100%; height: 100%; border: none; border-radius: 0; background: transparent; display: block;" scrolling="auto" title="Mã Giảm Giá Riêng (Coupon Attribution)"></iframe>
    </div>
  `;
}

function shopCouponsScreen() {
  try {
    const currentToken = localStorage.getItem('token');
    const currentUserStr = localStorage.getItem('user');
    let roleMismatch = false;
    if (currentUserStr) {
      try {
        const parsed = JSON.parse(currentUserStr);
        if (parsed.role !== 'SHOP_MANAGER') {
          roleMismatch = true;
        }
      } catch (e) {}
    }
    if (roleMismatch || !currentToken || currentToken.startsWith('session-')) {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'shop@scanms.vn', password: 'Password@123' })
      }).then(r => r.json()).then(res => {
        const tok = res?.data?.accessToken || res?.accessToken;
        const u = res?.data?.user || res?.user;
        if (tok && u && localStorage.getItem('scanms-current-role') === 'shop') {
          localStorage.setItem('token', tok);
          localStorage.setItem('user', JSON.stringify(u));
          document.querySelectorAll('iframe').forEach(ifr => {
            try { ifr.contentWindow.postMessage({ type: 'SCANMS_AUTH_SYNC' }, '*'); } catch (e) {}
          });
        }
      }).catch(() => {});
    }
  } catch {}

  return `
    <div style="padding:0;width:100%;height:calc(100vh - 68px);height:calc(100dvh - 68px);min-height:calc(100vh - 68px);min-height:calc(100dvh - 68px);position:relative;overflow:hidden;">
      <iframe id="shop-coupons-iframe" src="/merchant/coupons" style="width: 100%; height: 100%; border: none; border-radius: 0; background: transparent; display: block;" scrolling="auto" title="Quản Lý Mã Giảm Giá Gian Hàng"></iframe>
    </div>
  `;
}

function adminCouponsScreen() {
  try {
    const currentToken = localStorage.getItem('token');
    const currentUserStr = localStorage.getItem('user');
    let roleMismatch = false;
    if (currentUserStr) {
      try {
        const parsed = JSON.parse(currentUserStr);
        if (parsed.role !== 'SYSTEM_ADMIN') {
          roleMismatch = true;
        }
      } catch (e) {}
    }
    if (roleMismatch || !currentToken || currentToken.startsWith('session-')) {
      localStorage.removeItem('token');
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@scanms.vn', password: 'Password@123' })
      }).then(r => r.json()).then(res => {
        const tok = res?.data?.accessToken || res?.accessToken;
        const u = res?.data?.user || res?.user;
        if (tok && u && localStorage.getItem('scanms-current-role') === 'admin') {
          localStorage.setItem('token', tok);
          localStorage.setItem('user', JSON.stringify(u));
        }
      }).catch(() => {});
    }
  } catch {}

  return `
    <div style="padding:0;width:100%;height:calc(100vh - 68px);height:calc(100dvh - 68px);min-height:calc(100vh - 68px);min-height:calc(100dvh - 68px);position:relative;overflow:hidden;">
      <iframe id="admin-coupons-iframe" src="/admin/coupons" style="width: 100%; height: 100%; border: none; border-radius: 0; background: transparent; display: block;" scrolling="auto" title="Quản Trị Coupon Toàn Sàn"></iframe>
    </div>
  `;
}

const renderers = {
  auth: authScreen,
  "kol-dashboard": dashboard,
  links: linksPage,
  "kol-coupons": kolCouponsScreen,
  channels: channelsScreen,
  media: mediaPage,
  samples: samplesPage,
  "kol-bonus": kolBonusScreen,
  leaderboard: leaderboardScreen,
  wallet: walletScreen,
  "kol-profile": kolProfileScreen,

  "shop-dashboard": shopDashboard,
  catalog: catalogScreen,
  "shop-campaigns": shopCampaignsScreen,
  "shop-coupons": shopCouponsScreen,
  "commission-rules": commissionRulesScreen,
  "shop-collaborators": shopCollaboratorsScreen,
  orders: ordersScreen,
  payouts: payoutsScreen,
  "shop-samples": shopSamplesScreen,
  "shop-media": shopMediaScreen,
  "shop-customer-requests": shopCustomerRequestsScreen,
  fraud: fraudScreen,
  "shop-settings": shopSettingsScreen,
  "shop-profile": shopProfileScreen,

  "manager-dashboard": managerDashboardScreen,
  "manager-stores": managerStoresScreen,
  "manager-store-detail": managerStoreDetailScreen,
  "manager-banks": managerBanksScreen,
  "manager-fraud": managerFraudScreen,
  "manager-audit": managerAuditScreen,
  "manager-profile": managerProfileScreen,

  "admin-dashboard": adminDashboardScreen,
  "admin-service-health": adminServiceHealthScreen,
  "admin-internal": adminInternalAccountsScreen,
  "admin-rbac": adminRbacScreen,
  "admin-users": adminUsersScreen,
  "admin-coupons": adminCouponsScreen,
  "admin-audit": adminAuditScreen,
  "admin-config": adminSystemConfigScreen,
  "admin-profile": adminProfileScreen,

  "customer-profile": customerProfileScreen,
  "customer-orders": customerOrdersScreen,
  "customer-order-detail": customerOrderDetailScreen,
  "customer-addresses": customerAddressesScreen,
  "customer-wishlist": customerWishlistScreen,
  "customer-reviews": customerReviewsScreen,
  "customer-support": customerSupportScreen,
  "customer-security": customerSecurityScreen,

  chat: chatScreen,
  storefront: storefrontScreen,
  marketplace: marketplaceScreen,
  tracking: trackingScreen,
};

function getDefaultScreenForRole(role) {
  switch (role) {
    case "admin": return "admin-dashboard";
    case "manager": return "manager-dashboard";
    case "shop": return "shop-dashboard";
    case "customer": return "customer-profile";
    case "kol":
    default: return "kol-dashboard";
  }
}

function forbiddenScreen(requiredRole, currentRole, screenId) {
  const roleNames = {
    admin: "Quản Trị Hệ Thống",
    manager: "Vận Hành Sàn",
    shop: "Chủ Cửa Hàng",
    kol: "Cộng Tác Viên (KOL / CTV)",
    customer: "Khách Mua Hàng"
  };
  const targetName = roleNames[requiredRole] || requiredRole;
  const currName = roleNames[currentRole] || currentRole;
  const defaultScreen = getDefaultScreenForRole(currentRole);

  return `
    <div class="forbidden-card card" style="max-width:680px;margin:40px auto;padding:36px;text-align:center;border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,0.06)">
      <div style="width:72px;height:72px;border-radius:50%;background:#fee2e2;color:#dc2626;display:grid;place-items:center;font-size:36px;margin:0 auto 18px">
        <i class="ph ph-shield-warning"></i>
      </div>
      <h1 style="font-size:24px;margin:0 0 10px;color:var(--text)">403 - Không Đủ Quyền Truy Cập (Access Denied)</h1>
      <p style="font-size:14px;color:var(--muted);line-height:1.6;margin:0 0 20px">
        Trang này yêu cầu đặc quyền của vai trò <strong>${targetName}</strong>.<br/>
        Vai trò hiện tại của bạn là <span class="badge neutral" style="font-size:12.5px;font-weight:700">${currName}</span>.
      </p>
      <div style="background:var(--surface-2);padding:14px 18px;border-radius:10px;font-size:12.5px;color:var(--muted);margin-bottom:24px;text-align:left;line-height:1.5">
        <i class="ph ph-info" style="color:var(--brand);margin-right:4px"></i>
        <strong>Nguyên tắc phân quyền RBAC:</strong> Việc gõ URL trực tiếp không tự ý biến người dùng thành Admin hoặc vượt quyền. Bạn cần đăng nhập tài khoản có thẩm quyền hoặc sử dụng công cụ chuyển đổi không gian demo.
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <button class="btn secondary" data-go="${defaultScreen}">
          <i class="ph ph-arrow-left"></i> Quay lại màn hình của tôi
        </button>
        <button class="btn" onclick="window.logoutScanms(event)">
          <i class="ph ph-sign-out"></i> Đăng xuất để đổi tài khoản
        </button>
      </div>
    </div>
  `;
}

function shell(content) {
  const isKol = state.role === "kol";
  const isShop = state.role === "shop";
  const isManager = state.role === "manager";
  const isAdmin = state.role === "admin";
  const isCustomer = state.role === "customer";

  let activeScreens = screens.filter(
    (screen) => screen.role !== "auth" && (screen.role === state.role || screen.role === "both" || screen.role === "public" || (state.role === "admin" && screen.id === "manager-stores"))
  );

  if (isCustomer) {
    const customerOrder = [
      "storefront",
      "tracking",
      "customer-reviews",
      "customer-profile",
      "customer-orders",
      "customer-order-detail",
      "customer-addresses",
      "customer-support",
      "customer-wishlist",
      "customer-security",
      "chat"
    ];
    activeScreens.sort((a, b) => {
      const idxA = customerOrder.indexOf(a.id);
      const idxB = customerOrder.indexOf(b.id);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }

  const current = screens.find((s) => s.id === state.screen) || activeScreens[0];
  const isAuth = state.screen === "auth" || state.screen === "register" || state.screen === "login" || state.screen === "auth-register";
  const isMarketplace = state.screen === "marketplace" || state.screen === "home";
  const isStorefront = state.screen === "storefront";
  const hideSidebar = isAuth || isMarketplace;

  // Dynamic profiles loaded from localStorage
  let kolSaved = null, shopSaved = null, mgrSaved = null, admSaved = null, custSaved = null;
  try { kolSaved = JSON.parse(localStorage.getItem("scanms_profile_kol")); } catch (e) {}
  try { shopSaved = JSON.parse(localStorage.getItem("scanms_profile_shop")); } catch (e) {}
  try { mgrSaved = JSON.parse(localStorage.getItem("scanms_profile_manager")); } catch (e) {}
  try { admSaved = JSON.parse(localStorage.getItem("scanms_profile_admin")); } catch (e) {}
  try { custSaved = JSON.parse(localStorage.getItem("scanms_profile_customer")); } catch (e) {}

  const kolName = kolSaved?.name || "Trần Văn Nhật";
  const kolEmail = kolSaved?.email || "kol@scanms.vn";

  const curSt = state.currentStore || state.pendingShop;
  const isPending = curSt && (curSt.status === "pending" || curSt.status === "reviewing");
  const shopName = shopSaved?.storeName || (curSt && curSt.name ? curSt.name : "Sora Skin Official");
  const shopEmail = shopSaved?.email || "shop@scanms.vn";

  const mgrName = mgrSaved?.name || "Lê Hồng Phúc";
  const mgrEmail = mgrSaved?.email || "manager@scanms.vn";

  const admName = admSaved?.name || "Nguyễn Thành Thắng";
  const admEmail = admSaved?.email || "admin@scanms.vn";

  const custName = custSaved?.name || "Nguyễn Hải Yến";
  const custEmail = custSaved?.email || "haiyen.nguyen@gmail.com";

  const kolAvatarImg = kolSaved?.avatarImg || null;
  const shopAvatarImg = shopSaved?.avatarImg || null;
  const mgrAvatarImg = mgrSaved?.avatarImg || null;
  const admAvatarImg = admSaved?.avatarImg || null;
  const custAvatarImg = custSaved?.avatarImg || null;

  const allAccounts = [
    { role: "kol", name: kolName, email: kolEmail, avatarImg: kolAvatarImg, sub: "KOL hạng Vàng (Collaborator)", roleTitle: "KOL / Tiếp Thị", roleBadge: "KOL Hạng Vàng", roleIcon: "ph-fill ph-sparkle", avatar: kolName.charAt(0).toUpperCase(), bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", color: "#92400e", defaultScreen: "kol-dashboard", profileScreen: "kol-profile" },
    { role: "shop", name: shopName, email: shopEmail, avatarImg: shopAvatarImg, sub: isPending ? "Chủ shop (Chờ duyệt)" : "Chủ gian hàng Mall", roleTitle: "Chủ Gian Hàng", roleBadge: isPending ? "Shop Chờ Duyệt" : "Mall Verified", roleIcon: "ph-fill ph-storefront", avatar: shopName.charAt(0).toUpperCase(), bg: isPending ? "linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)" : "linear-gradient(135deg, #fed7aa 0%, #fcd34d 100%)", color: isPending ? "#b45309" : "#7c2d12", defaultScreen: "shop-dashboard", profileScreen: "shop-profile" },
    { role: "manager", name: mgrName, email: mgrEmail, avatarImg: mgrAvatarImg, sub: "Vận hành sàn (SM-0042)", roleTitle: "Vận Hành Sàn", roleBadge: "SM-0042 • Vận Hành", roleIcon: "ph-fill ph-shield-check", avatar: "VH", bg: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", color: "#3730a3", defaultScreen: "manager-dashboard", profileScreen: "manager-profile" },
    { role: "admin", name: admName, email: admEmail, avatarImg: admAvatarImg, sub: "Quản trị hệ thống (Root)", roleTitle: "Quản Trị Root", roleBadge: "Master Root Admin", roleIcon: "ph-fill ph-lock-key", avatar: "QT", bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", color: "#e0e7ff", defaultScreen: "admin-dashboard", profileScreen: "admin-profile" },
    { role: "customer", name: custName, email: custEmail, avatarImg: custAvatarImg, sub: "Khách mua hàng VIP", roleTitle: "Khách Mua Hàng", roleBadge: "Customer VIP Gold", roleIcon: "ph-fill ph-crown", avatar: custName.charAt(0).toUpperCase(), bg: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", color: "#166534", defaultScreen: "customer-profile", profileScreen: "customer-profile" },
  ];

  let userProfile = allAccounts.find(a => a.role === state.role) || allAccounts[0];
  let brandSub = "Không gian KOL / CTV";
  let navTitle = `Chức năng KOL / CTV (${activeScreens.length})`;
  let roleBadgeName = "KOL / CTV";

  if (isShop) {
    brandSub = isPending ? "Hồ sơ đang chờ phê duyệt" : "Không gian Chủ Shop";
    navTitle = `Chức năng Chủ Shop (${activeScreens.length})`;
    roleBadgeName = isPending ? "Chủ Shop • Chờ duyệt" : "Chủ Shop";
  } else if (isManager) {
    brandSub = "Không gian Vận Hành Sàn";
    navTitle = `Vận Hành Nền Tảng (${activeScreens.length})`;
    roleBadgeName = "Vận Hành Sàn";
  } else if (isAdmin) {
    brandSub = "Không gian Quản Trị Kỹ Thuật";
    navTitle = `Quản Trị Hệ Thống (${activeScreens.length})`;
    roleBadgeName = "Quản Trị Hệ Thống";
  } else if (isCustomer) {
    brandSub = "Khu Vực Khách Hàng";
    navTitle = `Tài Khoản & Mua Sắm (${activeScreens.length})`;
    roleBadgeName = "Khách Hàng";
  }

  return `<div class="prototype ${isAuth ? "is-auth" : ""} ${isStorefront ? "is-storefront" : ""} ${isMarketplace ? "is-marketplace" : ""}">
    ${hideSidebar ? "" : `
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">S</span>
        <strong>SCANMS<small>${brandSub}</small></strong>
      </div>

      <div class="nav-label">${navTitle}</div>
      <nav class="screen-nav" aria-label="Danh sách màn hình">
        ${isCustomer ? `
          <div class="nav-sub-label" style="font-size:10.5px;font-weight:800;letter-spacing:0.6px;color:var(--brand-strong);padding:8px 12px 4px;text-transform:uppercase;display:flex;align-items:center;gap:6px">
            <i class="ph ph-shopping-bag-open"></i> Mua sắm & Tra cứu (Guest)
          </div>
          ${activeScreens.slice(0, 3).map((s, i) => `
            <button class="nav-item ${s.id === state.screen ? "active" : ""}" data-go="${s.id}">
              ${icon(s.icon)}<span>${s.label}</span>
              <span class="nav-num">${String(i + 1).padStart(2, "0")}</span>
            </button>
          `).join("")}
          <div class="nav-sub-label" style="font-size:10.5px;font-weight:800;letter-spacing:0.6px;color:var(--muted);padding:14px 12px 4px;text-transform:uppercase;border-top:1px dashed var(--line);margin-top:6px;display:flex;align-items:center;gap:6px">
            <i class="ph ph-user-circle"></i> Tài khoản VIP (Thành viên)
          </div>
          ${activeScreens.slice(3).map((s, i) => `
            <button class="nav-item ${s.id === state.screen ? "active" : ""}" data-go="${s.id}">
              ${icon(s.icon)}<span>${s.label}</span>
              <span class="nav-num">${String(i + 4).padStart(2, "0")}</span>
            </button>
          `).join("")}
        ` : activeScreens.map((s, i) => `
          <button class="nav-item ${s.id === state.screen ? "active" : ""}" data-go="${s.id}">
            ${icon(s.icon)}<span>${s.label}</span>
            <span class="nav-num">${String(i + 1).padStart(2, "0")}</span>
          </button>
        `).join("")}
      </nav>

      <div class="account-nav" aria-label="Tài khoản">
        <button class="nav-item ${state.screen === "auth" ? "active" : ""}" data-go="auth">
          ${icon("ph-sign-in")}<span>Đổi vai trò / Đăng nhập</span>
        </button>
        <button class="nav-item logout-item" data-action="logout">
          ${icon("ph-sign-out")}<span>Đăng xuất</span>
        </button>
      </div>
    </aside>
    `}

    <main class="main">
      ${hideSidebar ? "" : `
      <header class="topbar">
        <div class="crumb"><strong>${current ? current.label : 'Màn hình'}</strong></div>
        <div class="top-actions">
          <a href="./figma-board.html" target="_blank" class="btn small secondary" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;background:var(--surface-2);border:1px solid color-mix(in srgb, var(--brand) 40%, var(--line));color:var(--brand);font-weight:700" title="Mở Ma Trận 22 Màn Hình Figma Canvas">
            <i class="ph ph-squares-four"></i> Ma Trận Figma
          </a>
          <button class="icon-btn" data-theme aria-label="Đổi giao diện">${icon(state.theme === "dark" ? "ph-sun" : "ph-moon")}</button>
          <button class="icon-btn" aria-label="Thông báo">${icon("ph-bell")}</button>
          
          <!-- Redesigned Luxury Profile Button -->
          <div class="profile topbar-profile-btn" id="topbar-profile-btn" onclick="window.toggleProfilePopover(event)" role="button" tabindex="0" title="Click để xem thông tin hồ sơ và đăng xuất">
            <div class="profile-avatar-wrapper">
              <div class="profile-avatar-circle" style="background:${userProfile.bg};color:${userProfile.color}">
                ${userProfile.avatarImg ? `<img src="${userProfile.avatarImg}" alt="${userProfile.name}" />` : userProfile.avatar}
              </div>
              <span class="profile-online-badge" title="Tài khoản đang hoạt động"></span>
            </div>
            <div class="profile-text-block hide-mobile">
              <div class="profile-name-line">${userProfile.name}</div>
              <span class="profile-role-pill role-${userProfile.role}">
                <i class="${userProfile.roleIcon}"></i> ${userProfile.roleBadge}
              </span>
            </div>
            <div class="profile-caret-pill" title="Xem hồ sơ & Đăng xuất">
              <i class="ph ph-caret-down"></i>
            </div>

            <!-- Glassmorphic Profile Popover -->
            <div class="profile-popover" id="topbar-profile-popover" onclick="event.stopPropagation()">
              <!-- Popover Header -->
              <div class="profile-popover-header">
                <div class="profile-avatar-wrapper">
                  <div class="profile-popover-avatar" id="popover-avatar-trigger" onclick="window.triggerPopoverAvatarUpload(event)" style="background:${userProfile.bg};color:${userProfile.color}" title="Bấm vào ảnh để đổi Avatar từ máy tính">
                    ${userProfile.avatarImg ? `<img src="${userProfile.avatarImg}" alt="${userProfile.name}" />` : userProfile.avatar}
                    <div class="profile-popover-avatar-overlay">
                      <i class="ph ph-camera"></i>
                      <span>Đổi ảnh</span>
                    </div>
                  </div>
                  <input type="file" id="popover-avatar-file" accept="image/*" style="display:none" onchange="window.handlePopoverAvatarChange(this)" />
                  <span class="profile-online-badge" style="width:13px;height:13px;bottom:1px;right:1px"></span>
                </div>
                <div class="profile-popover-userinfo">
                  <div class="profile-popover-name" title="${userProfile.name}">${userProfile.name}</div>
                  <span class="profile-role-pill role-${userProfile.role}"><i class="${userProfile.roleIcon}"></i> ${userProfile.roleBadge}</span>
                  <div class="profile-popover-email" title="${userProfile.email}">${userProfile.email}</div>
                </div>
              </div>

              <!-- Profile Popover Actions -->
              <div class="profile-popover-actions">
                <button class="profile-popover-btn" onclick="window.openProfileScreen(event)" data-popover-action="view-profile">
                  <i class="ph ph-user-circle"></i>
                  <span>Hồ sơ chi tiết (${userProfile.roleTitle})</span>
                </button>
                <button class="profile-popover-btn" onclick="window.openProfileSecurity(event)" data-popover-action="change-password">
                  <i class="ph ph-lock-key"></i>
                  <span>Đổi mật khẩu & Bảo mật</span>
                </button>
                <button class="profile-popover-btn danger" onclick="window.logoutScanms(event)" data-popover-action="logout">
                  <i class="ph ph-sign-out"></i>
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      `}
      <div class="page ${['kol-bonus', 'commission-rules', 'kol-coupons', 'shop-coupons', 'admin-coupons', 'catalog', 'shop-collaborators'].includes(state.screen) ? 'page-wide page-full-iframe' : ''}">${content}</div>
    </main>
  </div>`;
}

function render() {
  const isIframeScreen = ['kol-bonus', 'commission-rules', 'kol-coupons', 'shop-coupons', 'admin-coupons'].includes(state.screen);
  if (isIframeScreen) {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    const main = document.querySelector('.main');
    if (main) {
      main.style.overflow = 'hidden';
      main.scrollTop = 0;
    }
  } else {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    const main = document.querySelector('.main');
    if (main) main.style.overflow = '';
  }

  if (state.screen !== 'kol-coupons' && state.screen !== 'shop-coupons' && state.screen !== 'admin-coupons') {
    document.body.classList.remove('scanms-modal-open', 'fr10-modal-open');
    const topbar = document.querySelector('.topbar') || document.querySelector('header.topbar');
    if (topbar) topbar.style.display = '';
  }
  const prefRole = sessionStorage.getItem("scanms-preferred-role");
  if (prefRole) {
    state.role = prefRole;
    sessionStorage.removeItem("scanms-preferred-role");
  }
  try {
    localStorage.setItem("scanms-current-role", state.role);
    localStorage.setItem("scanms-current-screen", state.screen);
  } catch (e) { }
  const previousNav = document.querySelector(".screen-nav");
  if (previousNav) {
    state.navScrollTop = previousNav.scrollTop;
    state.navScrollLeft = previousNav.scrollLeft;
  }
  const curHash = location.hash.replace("#", "");
  if (state.screen === "register" || curHash === "register" || curHash === "auth-register") {
    state.screen = "auth";
    state.authMode = "register";
  }
  if (state.screen === "login" || curHash === "login" || curHash === "auth-login") {
    state.screen = "auth";
    state.authMode = "login";
  }

  const targetScr = screens.find((s) => s.id === state.screen);
  const defaultScreen = getDefaultScreenForRole(state.role);

  // Role authorization check (DO NOT auto-change state.role!)
  let pageContent = "";
  const isAuth = state.screen === "auth";
  const isPublic = targetScr && (targetScr.role === "both" || targetScr.role === "public" || targetScr.role === "auth");
  const isAuthorized = isAuth || isPublic || (targetScr && (targetScr.role === state.role || (state.role === "admin" && (targetScr.role === "manager" || targetScr.id === "manager-stores" || targetScr.id === "manager-store-detail"))));

  if (targetScr && !isAuthorized) {
    // Show 403 Forbidden Screen without transforming user's role
    pageContent = forbiddenScreen(targetScr.role, state.role, state.screen);
  } else if (renderers[state.screen]) {
    pageContent = renderers[state.screen]();
  } else {
    state.screen = defaultScreen;
    history.replaceState(null, "", `#${state.screen}`);
    pageContent = renderers[state.screen] ? renderers[state.screen]() : "<div>Màn hình không tồn tại.</div>";
  }

  document.documentElement.dataset.theme = state.theme;
  document.querySelector("#app").innerHTML = shell(pageContent);
  bind();
  const nextNav = document.querySelector(".screen-nav");
  if (nextNav) {
    nextNav.scrollTop = state.navScrollTop;
    nextNav.scrollLeft = state.navScrollLeft;
  }
}

function renderCurrentPage() {
  render();
}

function go(screen) {
  document.body.classList.remove('scanms-modal-open', 'fr10-modal-open');
  document.body.style.overflow = '';
  const topbar = document.querySelector('.topbar') || document.querySelector('header.topbar');
  if (topbar) topbar.style.display = '';
  const main = document.querySelector('.main');
  if (main) main.scrollTop = 0;
  state.screen = screen;
  state.search = "";
  try {
    localStorage.setItem("scanms-current-screen", screen);
    const scrObj = screens.find(s => s.id === screen);
    if (scrObj && scrObj.role && scrObj.role !== "both" && scrObj.role !== "public" && scrObj.role !== "auth") {
      if (!(state.role === "admin" && (scrObj.role === "manager" || scrObj.id === "manager-stores" || scrObj.id === "manager-store-detail"))) {
        state.role = scrObj.role;
        localStorage.setItem("scanms-current-role", scrObj.role);
      }
    }
  } catch (e) { }
  history.replaceState(null, "", `#${screen}`);
  render();
  scrollTo(0, 0);
}

function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2400);
}

function modal(type) {
  if (type === 'withdraw') { withdrawal(); return; }
  if (type === 'channel') { openAddEditChannelModal(); return; }
  const content = {
    withdraw: `<h2>Yêu cầu rút tiền</h2><p>Số dư sẽ được khóa an toàn trong lúc tạo yêu cầu.</p><div class="form-stack" style="margin-top:20px"><div class="field"><label>Số tiền muốn rút</label><input class="input" id="withdraw-amount" type="number" value="4000000" min="200000" /></div><div class="summary"><div><span>Số tiền yêu cầu</span><strong>4.000.000 ₫</strong></div><div><span>Thuế TNCN 10%</span><strong>-400.000 ₫</strong></div><div><span>Thực nhận</span><strong>3.600.000 ₫</strong></div></div><button class="btn" data-confirm="Đã tạo yêu cầu rút tiền. Số dư đang được khóa để xử lý.">Xác nhận bằng OTP</button></div>`,
    sample: `<h2>Xin sản phẩm mẫu</h2><p>Shop sẽ xem xét hồ sơ và đề xuất nội dung của bạn.</p><div class="form-stack" style="margin-top:20px"><div class="field"><label>Sản phẩm</label><select class="select"><option>Serum vitamin C 15%</option></select></div><div class="field"><label>Địa chỉ nhận</label><input class="input" value="12 Nguyễn Văn Bảo, Gò Vấp, TP. Hồ Chí Minh" /></div><div class="field"><label>Đề xuất nội dung</label><textarea class="textarea">Video routine buổi sáng, thời lượng 45 giây.</textarea></div><button class="btn" data-confirm="Đã gửi yêu cầu sản phẩm mẫu đến Shop.">Gửi yêu cầu</button></div>`,
    clawback: `<h2>Xác nhận hoàn trả</h2><p>Thao tác sẽ thu hồi 67.320 ₫ khỏi ví chờ và ghi một dòng mới vào sổ cái.</p><div class="summary"><div><span>Đơn hàng</span><strong class="mono">IN23845</strong></div><div><span>Giá trị đơn</span><strong>748.000 ₫</strong></div><div><span>Hoa hồng thu hồi</span><strong>67.320 ₫</strong></div></div><button class="btn danger" data-confirm="Đã thu hồi hoa hồng và ghi Audit Log.">Xác nhận thu hồi</button>`,
    approve: `<h2>Duyệt chi trả</h2><p>Tải bằng chứng chuyển khoản và nhập mã tham chiếu ngân hàng.</p><div class="form-stack" style="margin-top:20px"><div class="field"><label>Ảnh bill ngân hàng</label><input class="input" type="file" accept="image/*" /></div><div class="field"><label>Mã giao dịch ngân hàng</label><input class="input mono" placeholder="VD: VCB09072026A82" /></div><button class="btn" data-confirm="Đã duyệt chi trả và lưu bằng chứng ngân hàng.">Hoàn tất chi trả</button></div>`,
    checkout: `<h2>Thông tin giao hàng</h2><p>Không cần tạo tài khoản. Mã KOL đã được áp dụng tự động.</p><div class="form-stack" style="margin-top:20px"><div class="field"><label>Họ và tên</label><input class="input" placeholder="Nguyễn Hải Yến" /></div><div class="field"><label>Số điện thoại</label><input class="input" placeholder="0903 218 456" /></div><div class="field"><label>Địa chỉ nhận hàng</label><textarea class="textarea" placeholder="Số nhà, tên đường, phường/xã, tỉnh/thành"></textarea></div><div class="field"><label>Thanh toán</label><select class="select"><option>Thanh toán khi nhận hàng</option><option>Chuyển khoản ngân hàng</option></select></div><div class="summary"><div><span>Tạm tính</span><strong>459.000 ₫</strong></div><div><span>Mã NHATXINH10</span><strong>-45.900 ₫</strong></div><div><span>Tổng thanh toán</span><strong>413.100 ₫</strong></div></div><button class="btn" data-confirm="Đặt hàng thành công. Mã đơn của bạn là IN23944.">Xác nhận đặt hàng</button></div>`,
    forgot_pass: `<h2>Khôi phục mật khẩu</h2><p>Nhập email tài khoản để nhận liên kết đặt lại mật khẩu an toàn qua OTP.</p><div class="form-stack" style="margin-top:20px"><div class="field"><label>Email của bạn</label><input class="input" type="email" value="demo@scanms.vn" required /></div><button class="btn" data-confirm="Đã gửi liên kết khôi phục mật khẩu đến email. Vui lòng kiểm tra hộp thư.">Gửi mã xác nhận</button></div>`,
    terms: `<h2>Điều khoản dịch vụ SCANMS</h2><p>Quy chế hoạt động của mạng lưới tiếp thị liên kết (Đề tài FA26SE032).</p><div style="font-size:13.5px;color:var(--muted);line-height:1.6;margin:16px 0;display:flex;flex-direction:column;gap:10px"><p>• <strong>Attribution:</strong> Áp dụng cơ chế Last-Click kết hợp mã ưu đãi (Coupon Attribution). Thời gian lưu vết Cookie là 30 ngày.</p><p>• <strong>Đối soát hoa hồng:</strong> Thời gian giữ hoa hồng bảo đảm là 14 ngày để xử lý các trường hợp đổi trả hoặc hủy đơn hàng.</p><p>• <strong>Kiểm soát gian lận:</strong> AI Fraud Sentinel tự động phát hiện và chặn các hành vi click ảo hoặc tự mua hàng nhận hoa hồng.</p></div><button class="btn" data-close-modal>Tôi đã hiểu</button>`,
    policy: `<h2>Chính sách hoa hồng & Bảo mật</h2><p>Quy định chi trả và bảo mật thông tin tài chính cá nhân.</p><div style="font-size:13.5px;color:var(--muted);line-height:1.6;margin:16px 0;display:flex;flex-direction:column;gap:10px"><p>• <strong>Cấp bậc hoa hồng:</strong> Cấp Đồng (Cơ bản), Cấp Bạc (+1,5%), Cấp Vàng (+3%), Cấp Kim Cương (+5%).</p><p>• <strong>Khấu trừ thuế TNCN:</strong> Khấu trừ 10% thuế TNCN cho các lệnh rút tiền từ 2.000.000 ₫ theo quy định pháp luật.</p><p>• <strong>Bảo mật:</strong> Mật khẩu được băm mã hóa bcrypt, xác thực hai lớp (2FA OTP) khi rút tiền.</p></div><button class="btn" data-close-modal>Đóng</button>`,
  }[type];
  if (!content) return;
  document.querySelector("#modal-root").innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div>${content}</div><button class="icon-btn" data-close-modal aria-label="Đóng">${icon("ph-x")}</button></div></section></div>`;
  const modalEl = document.querySelector(".modal");
  const inner = modalEl.querySelector(".modal-head > div");
  modalEl.innerHTML = `<div class="modal-head"><div></div><button class="icon-btn" data-close-modal aria-label="Đóng">${icon("ph-x")}</button></div>`;
  modalEl.querySelector(".modal-head > div").replaceWith(inner);
  bindModal();
}

function closeModal() { document.querySelector("#modal-root").innerHTML = ""; }

function openPendingShopApprovalModal(store) {
  const modalRoot = document.querySelector("#modal-root");
  if (!modalRoot) return;

  const content = `
    <div class="pending-shop-modal" style="max-width:540px;width:100%;padding:4px">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid var(--line,#e2e8f0)">
        <div style="width:50px;height:50px;border-radius:14px;background:#fef3c7;color:#d97706;display:grid;place-items:center;font-size:26px;flex-shrink:0">
          <i class="ph ph-hourglass-high"></i>
        </div>
        <div>
          <h2 style="margin:0;font-size:18px;color:var(--text);font-weight:800">Đăng Ký Thành Công - Hồ Sơ Chờ Phê Duyệt</h2>
          <p style="margin:2px 0 0;font-size:13px;color:var(--muted)">Hồ sơ gian hàng đã được chuyển đến Ban Quản Trị &amp; Vận Hành Sàn</p>
        </div>
      </div>

      <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:14px 16px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-size:11.5px;font-weight:800;color:#92400e;letter-spacing:0.06em;text-transform:uppercase">Hồ sơ gian hàng mới tiếp nhận</span>
          <span class="badge warning" style="background:#f59e0b;color:#fff;font-weight:700;font-size:11px;padding:3px 8px;border-radius:999px"><i class="ph ph-clock"></i> ĐANG CHỜ DUYỆT</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;color:#78350f">
          <div>Mã hồ sơ: <strong style="color:#451a03">${store.id}</strong></div>
          <div>Tên gian hàng: <strong style="color:#451a03">${escapeHtml(store.name)}</strong></div>
          <div>Chủ sở hữu: <strong style="color:#451a03">${escapeHtml(store.owner)}</strong></div>
          <div>Số điện thoại: <strong style="color:#451a03">${escapeHtml(store.phone)}</strong></div>
          <div style="grid-column:span 2">Email đăng nhập: <strong style="color:#451a03">${escapeHtml(store.email)}</strong></div>
        </div>
      </div>

      <div style="background:var(--surface-alt,#f8fafc);border:1px solid var(--line,#e2e8f0);border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:12.5px;color:var(--text);line-height:1.55">
        <strong style="display:flex;align-items:center;gap:6px;color:#b45309;margin-bottom:4px">
          <i class="ph ph-shield-check"></i> Quy trình thẩm định bắt buộc của sàn:
        </strong>
        <p style="margin:0 0 6px">Theo quy chuẩn sàn SCANMS, gian hàng của bạn <strong>chưa thể mở bán ngay</strong> mà cần được <strong>Admin &amp; Chuyên viên Vận Hành sàn thẩm định giấy phép kinh doanh</strong> trong vòng <strong>24 giờ làm việc</strong>.</p>
        <p style="margin:0;color:var(--muted)">Bây giờ hệ thống sẽ chuyển sang <strong>màn hình Đăng nhập</strong> để bạn nhập tài khoản và mật khẩu vừa tạo theo dõi tiến độ.</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px">
        <button type="button" class="btn btn-primary" id="btn-modal-to-login" style="width:100%;justify-content:center;background:linear-gradient(135deg,#eab308,#ca8a04);color:#fff;border:none;padding:11px;font-weight:700;border-radius:10px">
          <i class="ph ph-sign-in"></i> Đã hiểu, chuyển sang Đăng nhập lại
        </button>
        <button type="button" class="btn secondary" id="btn-modal-demo-review" style="width:100%;justify-content:center;border-radius:10px;font-size:12.5px">
          <i class="ph ph-shield-check" style="color:#2563eb"></i> [DEMO] Chuyển sang vai trò Vận Hành Sàn để duyệt hồ sơ này ngay
        </button>
      </div>
    </div>
  `;

  modalRoot.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div>${content}</div><button class="icon-btn" data-close-modal aria-label="Đóng">${icon("ph-x")}</button></div></section></div>`;
  const modalEl = modalRoot.querySelector(".modal");
  const inner = modalEl.querySelector(".modal-head > div");
  modalEl.innerHTML = `<div class="modal-head"><div></div><button class="icon-btn" data-close-modal aria-label="Đóng">${icon("ph-x")}</button></div>`;
  modalEl.querySelector(".modal-head > div").replaceWith(inner);
  bindModal();

  modalRoot.querySelector("#btn-modal-to-login")?.addEventListener("click", () => {
    closeModal();
    const pwInput = document.querySelector("#login-password");
    if (pwInput) {
      pwInput.value = "";
      pwInput.focus();
    }
    toast(`Vui lòng nhập mật khẩu tài khoản ${store.email} để đăng nhập.`);
  });

  modalRoot.querySelector("#btn-modal-demo-review")?.addEventListener("click", () => {
    closeModal();
    state.role = "manager";
    managerState.activeStoreFilter = "pending";
    managerState.selectedStoreDetailId = store.id;
    try { localStorage.setItem("scanms-current-role", "manager"); } catch (e) { }
    go("manager-stores");
    toast(`Đã chuyển sang Vận Hành Sàn (Màn hình 16). Hãy nhấn 'Duyệt' để kích hoạt gian hàng ${store.name}.`);
  });
}

function bindModal() {
  document.querySelectorAll("[data-close-modal]").forEach((el) => el.addEventListener("click", (event) => {
    if (event.target === el || el.matches("button") || el.closest("button[data-close-modal]")) closeModal();
  }));
  document.querySelectorAll("[data-confirm]").forEach((el) => el.addEventListener("click", () => {
    const message = el.dataset.confirm;
    closeModal();
    toast(message);
  }));
}

function openAddEditChannelModal(channelId = null) {
  const isEdit = Boolean(channelId);
  const ch = isEdit ? state.channels.find(c => c.id === channelId) : null;
  const currentPlatform = ch ? ch.platform : "tiktok";
  const cfg = platformConfig[currentPlatform] || platformConfig.tiktok;

  const content = `
    <div class="modal-title-wrap" style="display:flex;align-items:center;gap:12px;padding-bottom:14px;border-bottom:1px solid var(--line)">
      <div class="channel-icon" style="background:${cfg.bgColor};color:${cfg.color};width:46px;height:46px;font-size:24px;border-radius:12px;display:grid;place-items:center">
        <i class="ph ${cfg.icon}" id="form-platform-icon"></i>
      </div>
      <div>
        <h2 style="margin:0;font-size:18px">${isEdit ? "Chỉnh sửa kênh mạng xã hội" : "Thêm kênh mạng xã hội mới"}</h2>
        <p style="margin:4px 0 0;color:var(--muted);font-size:13px">${isEdit ? "Cập nhật thông tin kênh để đảm bảo dữ liệu ghi nhận chính xác." : "Kênh mới sẽ được dùng để phân tách nguồn và tạo link tiếp thị."}</p>
      </div>
    </div>

    <form id="channel-form" class="form-stack channel-modal-form" style="margin-top:18px">
      <div class="field-grid-2">
        <div class="field">
          <label for="ch-form-platform">Nền tảng mạng xã hội <span class="required-star">*</span></label>
          <select class="select" id="ch-form-platform" required>
            <option value="tiktok" ${currentPlatform === "tiktok" ? "selected" : ""}>TikTok</option>
            <option value="facebook" ${currentPlatform === "facebook" ? "selected" : ""}>Facebook</option>
            <option value="youtube" ${currentPlatform === "youtube" ? "selected" : ""}>YouTube</option>
            <option value="instagram" ${currentPlatform === "instagram" ? "selected" : ""}>Instagram</option>
            <option value="threads" ${currentPlatform === "threads" ? "selected" : ""}>Threads</option>
            <option value="zalo" ${currentPlatform === "zalo" ? "selected" : ""}>Zalo OA</option>
          </select>
        </div>

        <div class="field">
          <label for="ch-form-category">Lĩnh vực nội dung chính</label>
          <select class="select" id="ch-form-category">
            <option value="Công nghệ & Tiện ích" ${(ch?.category === "Công nghệ & Tiện ích" || ch?.category === "Công nghệ số" || ch?.category === "Công nghệ & Đời sống") ? "selected" : ""}>Công nghệ & Tiện ích</option>
            <option value="Gia dụng & Đời sống" ${ch?.category === "Gia dụng & Đời sống" ? "selected" : ""}>Gia dụng & Đời sống</option>
            <option value="Thời trang & Phụ kiện" ${ch?.category === "Thời trang & Phụ kiện" ? "selected" : ""}>Thời trang & Phụ kiện</option>
            <option value="Mỹ phẩm & Làm đẹp" ${ch?.category === "Mỹ phẩm & Làm đẹp" ? "selected" : ""}>Mỹ phẩm & Làm đẹp</option>
            <option value="Sức khỏe & FMCG" ${ch?.category === "Sức khỏe & FMCG" ? "selected" : ""}>Sức khỏe & FMCG</option>
            <option value="Phong cách sống" ${ch?.category === "Phong cách sống" ? "selected" : ""}>Phong cách sống & Vlog</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label for="ch-form-name">Tên hiển thị của kênh <span class="required-star">*</span></label>
        <input class="input" id="ch-form-name" placeholder="VD: Tuấn Review Đồ Công Nghệ" value="${escapeHtml(ch?.displayName || ch?.name || "")}" required />
      </div>

      <div class="field-grid-2">
        <div class="field">
          <label for="ch-form-handle">Handle / ID người dùng <span class="required-star">*</span></label>
          <input class="input mono" id="ch-form-handle" placeholder="${cfg.handlePlaceholder}" value="${escapeHtml(ch?.handle || "")}" required />
        </div>

        <div class="field">
          <label for="ch-form-followers">Số người theo dõi (${cfg.followerName}) <span class="required-star">*</span></label>
          <input class="input" type="number" id="ch-form-followers" placeholder="VD: 50000" min="0" value="${ch?.followers ?? 10000}" required />
        </div>
      </div>

      <div class="field">
        <label for="ch-form-url">Đường dẫn URL kênh / Profile <span class="required-star">*</span></label>
        <input class="input mono" id="ch-form-url" placeholder="${cfg.urlPlaceholder}" value="${escapeHtml(ch?.url || "")}" required />
        <div id="ch-url-feedback" class="url-validation-feedback">
          <i class="ph ph-info"></i>
          <span>Nhập đúng định dạng URL trang cá nhân hoặc kênh của bạn.</span>
        </div>
      </div>

      <div class="field-box-card">
        <div class="field-box-title">Phương thức xác minh</div>
        <div class="radio-option-group">
          <label class="radio-card">
            <input type="radio" name="ch-auth-method" value="oauth" ${(!ch || ch.authMethod === 'oauth') ? 'checked' : ''} />
            <div class="radio-card-content">
              <strong><i class="ph ph-lightning"></i> Xác thực qua API Creator (Tick xanh xác minh)</strong>
              <small>Hệ thống tự động kích hoạt trạng thái xác minh bảo đảm cho chiến dịch trả hoa hồng cao.</small>
            </div>
          </label>
          <label class="radio-card">
            <input type="radio" name="ch-auth-method" value="manual" ${(ch && ch.authMethod === 'manual') ? 'checked' : ''} />
            <div class="radio-card-content">
              <strong><i class="ph ph-hand"></i> Tự khai báo thủ công</strong>
              <small>Kênh sẽ hiển thị nhãn "Tự khai báo" và chờ quản trị viên duyệt khi phát sinh doanh số lớn.</small>
            </div>
          </label>
        </div>
      </div>

      <div class="checkbox-line" style="margin-top:4px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="ch-form-is-primary" ${(ch?.isPrimary || state.channels.length === 0) ? "checked" : ""} />
          <span><strong>Đặt làm Kênh chính (Primary Channel)</strong> - Mặc định ưu tiên khi tạo link tiếp thị và mã QR.</span>
        </label>
      </div>

      <div class="modal-form-actions" style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">
        <button type="button" class="btn secondary" data-close-modal>Hủy bỏ</button>
        <button type="submit" class="btn" id="ch-submit-btn">
          <i class="ph ${isEdit ? 'ph-check' : 'ph-plus'}"></i>
          <span>${isEdit ? "Lưu thay đổi" : "Kết nối kênh mới"}</span>
        </button>
      </div>
    </form>
  `;

  document.querySelector("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-close-modal>
      <section class="modal modal-lg" role="dialog" aria-modal="true" style="max-width:580px">
        <div class="modal-head">
          <div style="width:100%">${content}</div>
          <button class="icon-btn" data-close-modal aria-label="Đóng">${icon("ph-x")}</button>
        </div>
      </section>
    </div>
  `;

  bindModal();

  const modalRoot = document.querySelector("#modal-root");
  const platformSelect = modalRoot.querySelector("#ch-form-platform");
  const urlInput = modalRoot.querySelector("#ch-form-url");
  const handleInput = modalRoot.querySelector("#ch-form-handle");
  const feedbackEl = modalRoot.querySelector("#ch-url-feedback");
  const platformIcon = modalRoot.querySelector("#form-platform-icon");

  function checkUrlValidity() {
    const plat = platformSelect.value;
    const url = urlInput.value.trim();
    const platConf = platformConfig[plat];
    if (!url) {
      feedbackEl.className = "url-validation-feedback";
      feedbackEl.innerHTML = `<i class="ph ph-info"></i> <span>Nhập đúng định dạng URL theo nền tảng ${platConf?.name || plat}.</span>`;
      return false;
    }
    const isValid = validateChannelUrl(plat, url);
    if (isValid) {
      feedbackEl.className = "url-validation-feedback valid";
      feedbackEl.innerHTML = `<i class="ph ph-check-circle"></i> <span>URL hợp lệ chuẩn định dạng ${platConf?.name || plat}.</span>`;
      return true;
    } else {
      feedbackEl.className = "url-validation-feedback invalid";
      feedbackEl.innerHTML = `<i class="ph ph-warning"></i> <span>URL chưa đúng định dạng. Ví dụ: <code>${platConf?.urlPlaceholder || ''}</code></span>`;
      return false;
    }
  }

  platformSelect.addEventListener("change", () => {
    const plat = platformSelect.value;
    const platConf = platformConfig[plat];
    if (platConf) {
      urlInput.placeholder = platConf.urlPlaceholder;
      handleInput.placeholder = platConf.handlePlaceholder;
      platformIcon.className = `ph ${platConf.icon}`;
      platformIcon.parentElement.style.background = platConf.bgColor;
      platformIcon.parentElement.style.color = platConf.color;
    }
    checkUrlValidity();
  });

  urlInput.addEventListener("input", checkUrlValidity);
  if (ch) checkUrlValidity();

  const form = modalRoot.querySelector("#channel-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const plat = platformSelect.value;
    const name = modalRoot.querySelector("#ch-form-name").value.trim();
    let handle = handleInput.value.trim();
    const url = urlInput.value.trim();
    const followers = parseInt(modalRoot.querySelector("#ch-form-followers").value, 10) || 0;
    const category = modalRoot.querySelector("#ch-form-category").value;
    const isPrimary = modalRoot.querySelector("#ch-form-is-primary").checked;
    const authMethod = modalRoot.querySelector("input[name='ch-auth-method']:checked")?.value || "oauth";

    if (!name) {
      toast("Vui lòng nhập tên hiển thị của kênh.");
      return;
    }
    if (!handle) {
      toast("Vui lòng nhập handle / tên người dùng.");
      return;
    }
    if (!checkUrlValidity()) {
      toast("Vui lòng nhập đúng định dạng URL của kênh.");
      return;
    }

    const isDuplicate = state.channels.some(c => c.id !== channelId && (c.url.toLowerCase() === url.toLowerCase() || (c.platform === plat && c.handle.toLowerCase() === handle.toLowerCase())));
    if (isDuplicate) {
      toast("Đã tồn tại kênh có URL hoặc Handle này trong danh sách của bạn!");
      return;
    }

    if (["tiktok", "instagram", "threads"].includes(plat) && !handle.startsWith("@")) {
      handle = "@" + handle;
    }

    const platConf = platformConfig[plat] || platformConfig.tiktok;
    const submitBtn = modalRoot.querySelector("#ch-submit-btn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="ph ph-spinner spin-icon"></i> Đang lưu...`;

    setTimeout(() => {
      if (isPrimary) {
        state.channels.forEach(c => c.isPrimary = false);
      }

      if (isEdit) {
        const idx = state.channels.findIndex(c => c.id === channelId);
        if (idx !== -1) {
          state.channels[idx] = {
            ...state.channels[idx],
            platform: plat,
            name: platConf.name,
            displayName: name,
            handle: handle,
            url: url,
            followers: followers,
            followersFormatted: formatFollowers(followers),
            category: category,
            isPrimary: isPrimary,
            authMethod: authMethod,
            verificationStatus: authMethod === "oauth" ? "verified" : "unverified",
            verificationLabel: authMethod === "oauth" ? "Đã xác minh API" : "Tự khai báo",
            icon: platConf.icon,
          };
        }
        toast(`Đã cập nhật kênh ${platConf.name} (${handle}) thành công.`);
      } else {
        const newId = `${plat}-${Date.now().toString(36)}`;
        const newChannel = {
          id: newId,
          platform: plat,
          name: platConf.name,
          displayName: name,
          handle: handle,
          url: url,
          followers: followers,
          followersFormatted: formatFollowers(followers),
          category: category,
          isPrimary: isPrimary || state.channels.length === 0,
          verificationStatus: authMethod === "oauth" ? "verified" : "unverified",
          verificationLabel: authMethod === "oauth" ? "Đã xác minh API" : "Tự khai báo",
          authMethod: authMethod,
          connectedAt: new Intl.DateTimeFormat("vi-VN").format(new Date()),
          icon: platConf.icon,
          stats: {
            clicks: 0,
            orders: 0,
            cvr: "0%",
            gmv: 0,
            commission: 0,
            topProducts: []
          }
        };
        state.channels.unshift(newChannel);
        toast(`Đã kết nối thành công kênh ${platConf.name} (${handle}).`);
      }

      if (!state.channels.some(c => c.isPrimary) && state.channels.length > 0) {
        state.channels[0].isPrimary = true;
      }

      persistChannels();
      closeModal();
      renderCurrentPage();
    }, 350);
  });
}

function openDeleteChannelModal(channelId) {
  const ch = state.channels.find(c => c.id === channelId);
  if (!ch) return;

  const content = `
    <div class="delete-modal-wrap" style="text-align:center;padding:10px 0">
      <div style="width:56px;height:56px;border-radius:50%;background:#fee2e2;color:#dc2626;display:grid;place-items:center;font-size:28px;margin:0 auto 16px">
        <i class="ph ph-warning"></i>
      </div>
      <h2 style="margin:0 0 8px;font-size:19px">Gỡ kênh mạng xã hội</h2>
      <p style="color:var(--muted);font-size:14px;line-height:1.5;margin:0 0 16px">
        Bạn có chắc chắn muốn gỡ kênh <strong>${escapeHtml(ch.displayName || ch.name)}</strong> (${escapeHtml(ch.handle)}) khỏi hệ thống tiếp thị?
      </p>

      <div class="card soft" style="text-align:left;font-size:13px;line-height:1.5;background:#fef2f2;border-color:#fecaca;color:#991b1b;margin-bottom:20px">
        <div><strong><i class="ph ph-shield-check"></i> Lưu ý an toàn dữ liệu:</strong></div>
        <ul style="margin:6px 0 0;padding-left:18px">
          <li>Doanh số GMV và hoa hồng lịch sử của kênh này được lưu trữ bất biến và không bị ảnh hưởng.</li>
          <li>Các affiliate link cũ gắn mã kênh này sẽ tự động chuyển hướng quy về kênh chính để bảo toàn doanh số.</li>
          ${ch.isPrimary ? '<li><strong style="color:#b91c1c">Đây là Kênh chính hiện tại. Hệ thống sẽ tự động chỉ định kênh còn lại làm Kênh chính mới.</strong></li>' : ''}
        </ul>
      </div>

      <div style="display:flex;gap:12px;justify-content:center">
        <button class="btn secondary" data-close-modal>Hủy bỏ</button>
        <button class="btn danger" id="confirm-delete-channel-btn">
          <i class="ph ph-trash"></i> Xác nhận gỡ kênh
        </button>
      </div>
    </div>
  `;

  document.querySelector("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-close-modal>
      <section class="modal" role="dialog" aria-modal="true" style="max-width:480px">
        <div class="modal-head">
          <div style="width:100%">${content}</div>
          <button class="icon-btn" data-close-modal aria-label="Đóng">${icon("ph-x")}</button>
        </div>
      </section>
    </div>
  `;

  bindModal();

  const confirmBtn = document.querySelector("#confirm-delete-channel-btn");
  confirmBtn?.addEventListener("click", () => {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<i class="ph ph-spinner spin-icon"></i> Đang gỡ...`;

    setTimeout(() => {
      const wasPrimary = ch.isPrimary;
      state.channels = state.channels.filter(c => c.id !== channelId);
      if (wasPrimary && state.channels.length > 0) {
        state.channels[0].isPrimary = true;
      }
      persistChannels();
      closeModal();
      renderCurrentPage();
      toast(`Đã gỡ kênh ${ch.name} (${ch.handle}) khỏi hệ thống.`);
    }, 300);
  });
}

function openChannelAnalyticsModal(channelId) {
  const ch = state.channels.find(c => c.id === channelId);
  if (!ch) return;

  const cfg = platformConfig[ch.platform] || platformConfig.tiktok;
  const stats = ch.stats || { clicks: 0, orders: 0, cvr: "0%", gmv: 0, commission: 0, topProducts: [] };

  const content = `
    <div class="analytics-modal-header" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:14px;border-bottom:1px solid var(--line)">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="channel-avatar" style="background:${cfg.bgColor};color:${cfg.color};width:46px;height:46px;font-size:24px;border-radius:12px;display:grid;place-items:center">
          <i class="ph ${cfg.icon}"></i>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:8px">
            <h2 style="margin:0;font-size:18px">${escapeHtml(ch.displayName || ch.name)}</h2>
            ${ch.isPrimary ? '<span class="channel-primary-badge"><i class="ph ph-star"></i> Kênh chính</span>' : ''}
          </div>
          <p style="margin:2px 0 0;color:var(--muted);font-size:13px">
            ${escapeHtml(ch.handle)} • ${formatFollowers(ch.followers)} followers • Lĩnh vực: <strong>${escapeHtml(ch.category || "Tổng hợp")}</strong>
          </p>
        </div>
      </div>
      <a href="${ch.url}" target="_blank" rel="noopener noreferrer" class="btn small secondary" style="white-space:nowrap">
        <i class="ph ph-arrow-square-out"></i> Mở kênh gốc
      </a>
    </div>

    <!-- 4 Key Analytics Cards -->
    <div class="grid kpis" style="grid-template-columns:repeat(4, 1fr);gap:12px;margin:20px 0">
      <div class="card kpi-card" style="padding:14px">
        <small style="color:var(--muted);font-size:12px">Lượt Click</small>
        <strong style="font-size:20px;display:block;margin-top:4px">${(stats.clicks || 0).toLocaleString("vi-VN")}</strong>
        <span style="font-size:11.5px;color:#059669"><i class="ph ph-trend-up"></i> +14.2% so với tháng trước</span>
      </div>
      <div class="card kpi-card" style="padding:14px">
        <small style="color:var(--muted);font-size:12px">Đơn hàng thành công</small>
        <strong style="font-size:20px;display:block;margin-top:4px">${(stats.orders || 0).toLocaleString("vi-VN")}</strong>
        <span style="font-size:11.5px;color:#2563eb">CVR: <strong>${stats.cvr || "0%"}</strong></span>
      </div>
      <div class="card kpi-card" style="padding:14px">
        <small style="color:var(--muted);font-size:12px">Doanh số GMV</small>
        <strong style="font-size:20px;display:block;margin-top:4px;color:var(--brand)">${money(stats.gmv || 0)}</strong>
        <span style="font-size:11.5px;color:var(--muted)">Đóng góp vào tier</span>
      </div>
      <div class="card kpi-card" style="padding:14px">
        <small style="color:var(--muted);font-size:12px">Hoa hồng ròng</small>
        <strong style="font-size:20px;display:block;margin-top:4px;color:#059669">${money(stats.commission || 0)}</strong>
        <span style="font-size:11.5px;color:#059669">Đã đối soát an toàn</span>
      </div>
    </div>

    <!-- Top Products Table -->
    <div class="card" style="padding:16px;margin-bottom:20px">
      <div class="card-title" style="margin-bottom:12px">
        <h3 style="margin:0;font-size:15px"><i class="ph ph-fire" style="color:#ea580c"></i> Top sản phẩm bán chạy nhất qua kênh này</h3>
        <span style="font-size:12px;color:var(--muted)">30 ngày gần nhất</span>
      </div>
      <div class="table-wrap" style="border:0">
        <table style="width:100%">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th style="text-align:center">Đơn hàng</th>
              <th style="text-align:right">Doanh thu GMV</th>
            </tr>
          </thead>
          <tbody>
            ${(stats.topProducts && stats.topProducts.length > 0) ? stats.topProducts.map(tp => `
              <tr>
                <td><strong>${escapeHtml(tp.name)}</strong></td>
                <td style="text-align:center"><span class="badge neutral">${tp.orders} đơn</span></td>
                <td style="text-align:right"><strong style="color:var(--brand)">${money(tp.gmv)}</strong></td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="3" style="text-align:center;color:var(--muted);padding:20px">Chưa có đơn hàng nào được ghi nhận cho kênh này. Hãy tạo link tiếp thị để bắt đầu!</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Actions -->
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
      <div style="font-size:12.5px;color:var(--muted)">
        <i class="ph ph-clock"></i> Cập nhật gần nhất: vừa xong (Real-time telemetry)
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn secondary" data-close-modal>Đóng</button>
        <button class="btn" id="modal-create-link-btn" data-channel-id="${ch.id}">
          <i class="ph ph-link"></i> Tạo link tiếp thị cho kênh này
        </button>
      </div>
    </div>
  `;

  document.querySelector("#modal-root").innerHTML = `
    <div class="modal-backdrop" data-close-modal>
      <section class="modal modal-lg" role="dialog" aria-modal="true" style="max-width:720px">
        <div class="modal-head">
          <div style="width:100%">${content}</div>
          <button class="icon-btn" data-close-modal aria-label="Đóng">${icon("ph-x")}</button>
        </div>
      </section>
    </div>
  `;

  bindModal();

  document.querySelector("#modal-create-link-btn")?.addEventListener("click", () => {
    closeModal();
    window.__SCANMS_PRESELECTED_CHANNEL__ = ch.id;
    go("links");
    toast(`Đã chọn kênh ${ch.name} (${ch.handle}) cho màn hình Tạo Link!`);
  });
}

function closeChannelDetailDrawer() {
  const backdrop = document.querySelector(".channel-drawer-backdrop");
  if (!backdrop) {
    closeModal();
    return;
  }
  backdrop.classList.add("closing");
  setTimeout(() => {
    closeModal();
  }, 190);
}

function openChannelDetailDrawer(channelId) {
  const ch = state.channels.find(c => c.id === channelId);
  if (!ch) return;

  const cfg = platformConfig[ch.platform] || {
    name: ch.name || "Mạng xã hội",
    icon: ch.icon || "ph-share-network",
    color: "var(--brand)",
    bgColor: "var(--brand-soft)",
    followerName: "Người theo dõi"
  };
  const stats = ch.stats || { clicks: 0, orders: 0, cvr: "0%", gmv: 0, commission: 0, topProducts: [] };

  let statusBadgeHtml = '';
  if (ch.verificationStatus === 'verified') {
    statusBadgeHtml = `<span class="channel-status-badge verified" title="Kênh đã xác minh danh tính và API Creator"><i class="ph ph-seal-check"></i> ${ch.verificationLabel || 'Đã xác minh'}</span>`;
  } else if (ch.verificationStatus === 'pending') {
    statusBadgeHtml = `<span class="channel-status-badge pending" title="Đang chờ xét duyệt kết nối API"><i class="ph ph-clock-clockwise"></i> Chờ duyệt API</span>`;
  } else {
    statusBadgeHtml = `<span class="channel-status-badge unverified" title="Kênh tự khai báo thủ công"><i class="ph ph-shield-warning"></i> Tự khai báo</span>`;
  }

  const drawerHtml = `
    <div class="channel-drawer-backdrop" id="channel-drawer-backdrop">
      <aside class="channel-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-channel-title">
        <header class="channel-drawer-header">
          <div class="channel-drawer-header-info">
            <div class="channel-avatar" style="background:${cfg.bgColor};color:${cfg.color};width:40px;height:40px;font-size:20px;border-radius:10px;display:grid;place-items:center">
              <i class="ph ${cfg.icon}"></i>
            </div>
            <div style="min-width:0">
              <div style="display:flex;align-items:center;gap:6px">
                <h2 id="drawer-channel-title" style="margin:0;font-size:16px;font-weight:700;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  ${escapeHtml(ch.displayName || ch.name)}
                </h2>
                ${ch.isPrimary ? '<span class="channel-primary-star" title="Kênh chính mặc định"><i class="ph-fill ph-star"></i></span>' : ''}
              </div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:2px;font-size:12px;color:var(--muted)">
                <span style="font-weight:600">${cfg.name}</span>
                <span>•</span>
                <span class="mono">${escapeHtml(ch.handle)}</span>
              </div>
            </div>
          </div>
          <button class="icon-btn" data-close-drawer aria-label="Đóng ngăn chi tiết">${icon("ph-x")}</button>
        </header>

        <div class="channel-drawer-body">
          <!-- Thông tin kết nối & Danh mục -->
          <div class="drawer-card">
            <h3 class="drawer-card-title"><i class="ph ph-sliders-horizontal"></i> Thông tin kết nối & Danh mục</h3>
            <div class="drawer-detail-grid">
              <div class="drawer-detail-item">
                <span class="detail-label">Trạng thái xác minh</span>
                <span class="detail-value">${statusBadgeHtml}</span>
              </div>
              <div class="drawer-detail-item">
                <span class="detail-label">Ngành hàng / Lĩnh vực</span>
                <span class="detail-value"><strong>${escapeHtml(ch.category || 'Tổng hợp')}</strong></span>
              </div>
              <div class="drawer-detail-item">
                <span class="detail-label">Ngày liên kết</span>
                <span class="detail-value">${ch.connectedAt || 'Mới đây'}</span>
              </div>
              <div class="drawer-detail-item">
                <span class="detail-label">Phương thức kết nối</span>
                <span class="detail-value">
                  <span class="badge ${ch.authMethod === 'oauth' ? 'primary' : 'neutral'}" style="font-size:11.5px">
                    <i class="ph ${ch.authMethod === 'oauth' ? 'ph-lightning' : 'ph-hand'}"></i>
                    ${ch.authMethod === 'oauth' ? 'Kết nối API Creator' : 'Khai báo thủ công'}
                  </span>
                </span>
              </div>
              <div class="drawer-detail-item">
                <span class="detail-label">Số người theo dõi</span>
                <span class="detail-value"><strong>${Number(ch.followers || 0).toLocaleString('vi-VN')}</strong> (${formatFollowersCompact(ch.followers)})</span>
              </div>
              <div class="drawer-detail-item">
                <span class="detail-label">Đường dẫn gốc</span>
                <span class="detail-value">
                  <a href="${ch.url || '#'}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;color:var(--brand);text-decoration:none;font-size:12.5px">
                    Mở hồ sơ trên ${cfg.name} <i class="ph ph-arrow-square-out"></i>
                  </a>
                </span>
              </div>
            </div>
          </div>

          <!-- Chỉ số chuyển đổi & Hiệu suất -->
          <div class="drawer-card">
            <h3 class="drawer-card-title"><i class="ph ph-chart-bar"></i> Chỉ số chuyển đổi & Doanh số</h3>
            <div class="drawer-stats-grid">
              <div class="drawer-stat-box">
                <span class="d-stat-label">Lượt click tiếp thị</span>
                <span class="d-stat-val">${(stats.clicks || 0).toLocaleString('vi-VN')}</span>
                <span class="d-stat-sub">Lượt click phát sinh</span>
              </div>
              <div class="drawer-stat-box">
                <span class="d-stat-label">Số đơn phát sinh</span>
                <span class="d-stat-val">${(stats.orders || 0).toLocaleString('vi-VN')}</span>
                <span class="d-stat-sub">Đã tạo đơn thành công</span>
              </div>
              <div class="drawer-stat-box">
                <span class="d-stat-label">Tỷ lệ chuyển đổi (CVR)</span>
                <span class="d-stat-val" style="color:#2563eb">${stats.cvr || '0%'}</span>
                <span class="d-stat-sub">Click → Đơn hàng</span>
              </div>
              <div class="drawer-stat-box">
                <span class="d-stat-label">Doanh thu GMV</span>
                <span class="d-stat-val" style="color:var(--brand)">${money(stats.gmv || 0)}</span>
                <span class="d-stat-sub">Tổng giá trị đơn</span>
              </div>
              <div class="drawer-stat-box span-2">
                <span class="d-stat-label">Hoa hồng thực nhận</span>
                <span class="d-stat-val" style="color:#059669">${money(stats.commission || 0)}</span>
                <span class="d-stat-sub">Đã ghi nhận đối soát an toàn</span>
              </div>
            </div>
          </div>

          <!-- Top sản phẩm qua kênh -->
          <div class="drawer-card">
            <h3 class="drawer-card-title"><i class="ph ph-fire" style="color:#ea580c"></i> Top sản phẩm bán chạy qua kênh</h3>
            <div class="drawer-table-wrap">
              <table class="drawer-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th style="text-align:center">Số đơn</th>
                    <th style="text-align:right">GMV</th>
                  </tr>
                </thead>
                <tbody>
                  ${(stats.topProducts && stats.topProducts.length > 0) ? stats.topProducts.map(p => `
                    <tr>
                      <td class="drawer-prod-title" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</td>
                      <td style="text-align:center"><span class="badge neutral">${p.orders} đơn</span></td>
                      <td style="text-align:right;font-weight:600;color:var(--brand)">${money(p.gmv)}</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="3" style="text-align:center;color:var(--muted);padding:14px">Chưa ghi nhận sản phẩm bán qua kênh này.</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer class="channel-drawer-footer">
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn secondary" data-close-drawer>Đóng</button>
            <button class="btn" id="drawer-create-link-btn">
              <i class="ph ph-link"></i> Tạo link cho kênh này
            </button>
          </div>
        </footer>
      </aside>
    </div>
  `;

  document.querySelector("#modal-root").innerHTML = drawerHtml;

  // Bind close buttons
  document.querySelectorAll("[data-close-drawer]").forEach(el => {
    el.addEventListener("click", () => closeChannelDetailDrawer());
  });

  // Close on backdrop click (outside drawer)
  const backdrop = document.querySelector("#channel-drawer-backdrop");
  backdrop?.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      closeChannelDetailDrawer();
    }
  });

  // Action button in drawer
  document.querySelector("#drawer-create-link-btn")?.addEventListener("click", () => {
    closeChannelDetailDrawer();
    window.__SCANMS_PRESELECTED_CHANNEL__ = ch.id;
    go("links");
    toast(`Đã chọn kênh ${ch.name} (${ch.handle}) cho màn hình Tạo Link!`);
  });
}

function setPrimaryChannel(channelId) {
  const ch = state.channels.find(c => c.id === channelId);
  if (!ch) return;
  state.channels.forEach(c => c.isPrimary = (c.id === channelId));
  persistChannels();
  renderCurrentPage();
  toast(`Đã đặt "${ch.displayName || ch.name}" làm Kênh chính mặc định.`);
}

function resetDemoChannels() {
  state.channels = JSON.parse(JSON.stringify(defaultChannels));
  state.channelSearch = "";
  state.channelPlatformFilter = "all";
  state.channelStatusFilter = "all";
  persistChannels();
  renderCurrentPage();
  toast("Đã khôi phục danh sách kênh mạng xã hội mặc định.");
}

function bind(root = document) {
  bindLinks(root);
  bindDashboard(root, { refresh: renderCurrentPage, go, toast });
  bindMedia(root, { refresh: renderCurrentPage, toast, state, go });
  bindSamples(root, { refresh: renderCurrentPage, toast, state, go });
  root.querySelector("#btn-clear-chat-ctx")?.addEventListener("click", () => {
    delete window.__SCANMS_CHAT_CONTEXT__;
    renderCurrentPage();
    toast("Đã gỡ ngữ cảnh đơn hàng mẫu khỏi cuộc trò chuyện.");
  });
  const screenNav = root.querySelector(".screen-nav");
  screenNav?.addEventListener("scroll", () => {
    state.navScrollTop = screenNav.scrollTop;
    state.navScrollLeft = screenNav.scrollLeft;
  }, { passive: true });
  const sidebar = root.querySelector(".sidebar");
  if (sidebar && !sidebar.__scanmsWheelBound) {
    sidebar.__scanmsWheelBound = true;
    sidebar.addEventListener("wheel", (e) => {
      const nav = sidebar.querySelector(".screen-nav");
      if (nav && nav.scrollHeight > nav.clientHeight) {
        nav.scrollTop += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  }

  root.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", () => go(el.dataset.go)));
  // data-theme also exists on <html>; bind ONLY the explicit button.
  root.querySelector("button[data-theme]")?.addEventListener("click", (event) => {
    state.theme = state.theme === "light" ? "dark" : "light";
    localStorage.setItem("scanms-theme", state.theme);
    document.documentElement.dataset.theme = state.theme;
    event.currentTarget.innerHTML = icon(state.theme === "dark" ? "ph-sun" : "ph-moon");
  });
  root.querySelectorAll("[data-toast]").forEach((el) => el.addEventListener("click", () => toast(el.dataset.toast)));
  root.querySelectorAll("[data-modal]").forEach((el) => el.addEventListener("click", (event) => {
    event.stopPropagation();
    modal(el.dataset.modal);
  }));
  root.querySelectorAll("[data-copy]").forEach((el) => el.addEventListener("click", async () => {
    const target = document.querySelector(el.dataset.copy);
    const value = target.value || target.textContent;
    try { await navigator.clipboard.writeText(value); } catch { /* Clipboard can be blocked on file URLs. */ }
    toast("Đã sao chép vào bộ nhớ tạm.");
  }));

  // Topbar Profile Popover Global Actions & Account Switcher
  window.triggerPopoverAvatarUpload = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const fileInput = document.querySelector("#popover-avatar-file");
    if (fileInput) {
      fileInput.click();
    }
  };

  window.handlePopoverAvatarChange = async function(input) {
    const file = input?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Vui lòng chọn tệp định dạng hình ảnh hợp lệ!", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast("Kích thước ảnh tối đa là 10MB!", "error");
      return;
    }

    try {
      const base64 = await compressAvatarImage(file, 256, 0.82);
      const curRole = state.role;
      if (curRole === "kol") {
        kolProfileState.profile.avatarImg = base64;
        safeSaveProfile("scanms_profile_kol", kolProfileState.profile);
      } else if (curRole === "shop") {
        shopProfileState.profile.avatarImg = base64;
        safeSaveProfile("scanms_profile_shop", shopProfileState.profile);
      } else if (curRole === "manager") {
        managerProfileState.profile.avatarImg = base64;
        safeSaveProfile("scanms_profile_manager", managerProfileState.profile);
      } else if (curRole === "admin") {
        adminProfileState.profile.avatarImg = base64;
        safeSaveProfile("scanms_profile_admin", adminProfileState.profile);
      } else if (curRole === "customer") {
        customerState.profile.avatarImg = base64;
        safeSaveProfile("scanms_profile_customer", customerState.profile);
      }

      toast("Đã đổi ảnh đại diện tài khoản thành công!", "success");

      // Re-render and keep the popover open so the user immediately sees the updated avatar!
      render();
      setTimeout(() => {
        const popover = document.querySelector("#topbar-profile-popover");
        const btn = document.querySelector("#topbar-profile-btn");
        if (popover) popover.classList.add("show");
        if (btn) btn.classList.add("popover-open");
      }, 40);
    } catch (err) {
      console.error("Lỗi khi nén ảnh avatar từ popover:", err);
      toast("Có lỗi khi xử lý ảnh đại diện. Vui lòng thử ảnh khác!", "error");
    }
  };

  window.toggleProfilePopover = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const popover = document.querySelector("#topbar-profile-popover");
    const btn = document.querySelector("#topbar-profile-btn");
    if (!popover) return;
    const isShow = popover.classList.contains("show");
    if (isShow) {
      popover.classList.remove("show");
      btn?.classList.remove("popover-open");
    } else {
      popover.classList.add("show");
      btn?.classList.add("popover-open");
    }
  };

  window.handleIframeAutoHeight = function(iframe) {
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (doc && doc.body) {
        const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 480);
        iframe.style.height = (h + 10) + 'px';
      }
    } catch (e) {}
  };

  // Lắng nghe thông điệp tự động co giãn chiều cao và đồng bộ xác thực từ ứng dụng React trong iframe
  if (!window.__scanmsIframeListenerAttached) {
    window.__scanmsIframeListenerAttached = true;
    window.addEventListener('message', function(e) {
      if (e.origin === window.location.origin && (
        e.data?.type === 'SCANMS_REFERRAL_MODAL_STATE' ||
        e.data?.type === 'SCANMS_PRODUCT_MODAL_STATE' ||
        e.data?.type === 'SCANMS_MODAL_STATE'
      )) {
        const isOpen = e.data.open === true;
        document.body.classList.toggle('fr10-modal-open', isOpen);
        document.body.classList.toggle('scanms-modal-open', isOpen);
        const topbar = document.querySelector('.topbar') || document.querySelector('header.topbar');
        if (topbar) {
          topbar.style.display = isOpen ? 'none' : '';
        }
      }

      if (e.data && (e.data.type === 'SCANMS_IFRAME_RESIZE' || e.data.type === 'SCANMS_RESIZE_IFRAME') && typeof e.data.height === 'number') {
        const kolIframe = document.getElementById('kol-bonus-iframe');
        if (kolIframe) {
          kolIframe.style.height = Math.max(e.data.height + 35, 680) + 'px';
        }
        const shopIframe = document.getElementById('commission-rules-iframe');
        if (shopIframe) {
          shopIframe.style.height = Math.max(e.data.height + 35, 680) + 'px';
        }
        const referralLinksIframe = document.getElementById('referral-links-iframe');
        if (referralLinksIframe) {
          referralLinksIframe.style.height = Math.max(e.data.height + 15, 760) + 'px';
        }
      }

      if (e.origin === window.location.origin && e.data?.type === 'SCANMS_TOAST' && e.data?.message) {
        toast(e.data.message);
      }
    });
  }

  window.switchScanmsRole = function(targetRole, e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const popover = document.querySelector("#topbar-profile-popover");
    const btn = document.querySelector("#topbar-profile-btn");
    if (popover) popover.classList.remove("show");
    if (btn) btn.classList.remove("popover-open");

    if (targetRole && targetRole !== state.role) {
      state.role = targetRole;
      try { localStorage.setItem("scanms-current-role", targetRole); } catch (err) {}

      // Đồng bộ xác thực với ứng dụng React bên trong iframe
      try {
        if (targetRole === 'kol') {
          // Xóa token / role của SHOP_MANAGER còn sót khi đổi sang KOL
          localStorage.removeItem('token');
          localStorage.setItem('user', JSON.stringify({
            role: 'COLLABORATOR',
            email: 'demo@scanms.vn',
            fullName: 'Trần Văn Nhật'
          }));
          // Lấy Access Token JWT thật từ backend
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'demo@scanms.vn', password: 'Password@123' })
          }).then(r => r.json()).then(res => {
            const tok = res?.data?.accessToken || res?.accessToken;
            const u = res?.data?.user || res?.user;
            if (tok && u && localStorage.getItem('scanms-current-role') === 'kol') {
              localStorage.setItem('token', tok);
              localStorage.setItem('user', JSON.stringify(u));
              document.querySelectorAll('iframe').forEach(ifr => {
                try { ifr.contentWindow.postMessage({ type: 'SCANMS_AUTH_SYNC' }, '*'); } catch (err) {}
              });
            }
          }).catch(() => {});
        } else if (targetRole === 'shop') {
          // Xóa token / role của COLLABORATOR còn sót khi đổi sang Shop
          localStorage.removeItem('token');
          localStorage.setItem('user', JSON.stringify({
            role: 'SHOP_MANAGER',
            email: 'shop@scanms.vn',
            fullName: 'Sora Skin Official'
          }));
          // Lấy Access Token JWT thật từ backend
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'shop@scanms.vn', password: 'Password@123' })
          }).then(r => r.json()).then(res => {
            const tok = res?.data?.accessToken || res?.accessToken;
            const u = res?.data?.user || res?.user;
            if (tok && u && localStorage.getItem('scanms-current-role') === 'shop') {
              localStorage.setItem('token', tok);
              localStorage.setItem('user', JSON.stringify(u));
              document.querySelectorAll('iframe').forEach(ifr => {
                try { ifr.contentWindow.postMessage({ type: 'SCANMS_AUTH_SYNC' }, '*'); } catch (err) {}
              });
            }
          }).catch(() => {});
        } else if (targetRole === 'admin') {
          localStorage.removeItem('token');
          localStorage.setItem('user', JSON.stringify({
            role: 'SYSTEM_ADMIN',
            email: 'admin@scanms.vn',
            fullName: 'Nguyễn Thành Thắng'
          }));
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@scanms.vn', password: 'Password@123' })
          }).then(r => r.json()).then(res => {
            const tok = res?.data?.accessToken || res?.accessToken;
            const u = res?.data?.user || res?.user;
            if (tok && u && localStorage.getItem('scanms-current-role') === 'admin') {
              localStorage.setItem('token', tok);
              localStorage.setItem('user', JSON.stringify(u));
              document.querySelectorAll('iframe').forEach(ifr => {
                try { ifr.contentWindow.postMessage({ type: 'SCANMS_AUTH_SYNC' }, '*'); } catch (err) {}
              });
            }
          }).catch(() => {});
        } else if (targetRole === 'manager') {
          localStorage.removeItem('token');
          localStorage.setItem('user', JSON.stringify({
            role: 'SYSTEM_MANAGER',
            email: 'manager@scanms.vn',
            fullName: 'Lê Hồng Phúc'
          }));
        }
      } catch (err) {}

      const targetScreen = getDefaultScreenForRole(targetRole);
      toast(`Đã chuyển vai trò sang: ${targetRole.toUpperCase()}`);
      go(targetScreen);
    }
  };

  window.openProfileScreen = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const popover = document.querySelector("#topbar-profile-popover");
    const btn = document.querySelector("#topbar-profile-btn");
    if (popover) popover.classList.remove("show");
    if (btn) btn.classList.remove("popover-open");

    const profileScreens = {
      kol: "kol-profile",
      shop: "shop-profile",
      manager: "manager-profile",
      admin: "admin-profile",
      customer: "customer-profile"
    };
    go(profileScreens[state.role] || "kol-profile");
  };

  window.openProfileSecurity = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const popover = document.querySelector("#topbar-profile-popover");
    const btn = document.querySelector("#topbar-profile-btn");
    if (popover) popover.classList.remove("show");
    if (btn) btn.classList.remove("popover-open");

    if (state.role === "kol") {
      try { kolProfileState.activeTab = "security"; } catch (err) {}
    } else if (state.role === "shop") {
      try { shopProfileState.activeTab = "security"; } catch (err) {}
    } else if (state.role === "manager") {
      try { managerProfileState.activeTab = "security"; } catch (err) {}
    } else if (state.role === "admin") {
      try { adminProfileState.activeTab = "security"; } catch (err) {}
    } else if (state.role === "customer") {
      try { customerState.activeProfileTab = "security"; } catch (err) {}
    }
    const profileScreens = {
      kol: "kol-profile",
      shop: "shop-profile",
      manager: "manager-profile",
      admin: "admin-profile",
      customer: "customer-profile"
    };
    go(profileScreens[state.role] || "kol-profile");
  };

  window.logoutScanms = function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const popover = document.querySelector("#topbar-profile-popover");
    const btn = document.querySelector("#topbar-profile-btn");
    if (popover) popover.classList.remove("show");
    if (btn) btn.classList.remove("popover-open");

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("scanms_token");
      localStorage.removeItem("scanms_user");
      localStorage.removeItem("scanms-current-role");
      sessionStorage.removeItem("scanms-preferred-role");
    } catch (err) {}

    state.screen = "auth";
    state.authMode = "login";
    toast("Đã đăng xuất tài khoản. Vui lòng đăng nhập vào vai trò bạn muốn.");
    renderCurrentPage();
  };

  // Auth Mode (Login vs Register) & Role switcher
  root.querySelectorAll("[data-auth-mode]").forEach((el) => el.addEventListener("click", () => {
    if (state.authMode === "register") {
      saveCurrentRegFormValues(root);
    }
    state.authMode = el.dataset.authMode;
    if (state.authMode === "register" && (state.role === "admin" || state.role === "manager")) {
      state.role = "kol";
    }
    history.replaceState(null, "", state.authMode === "register" ? "#register" : "#auth");
    renderCurrentPage();
  }));

  root.querySelectorAll("[data-role]").forEach((el) => el.addEventListener("click", () => {
    if (state.authMode === "register") {
      saveCurrentRegFormValues(root);
    }
    state.role = el.dataset.role;
    renderCurrentPage();
  }));

  // Subtle desktop mouse parallax on login hero background image (max 4-6px)
  const landingBg = root.querySelector("#login-hero-bg");
  if (landingBg && !window.__SCANMS_PARALLAX_BOUND__) {
    window.__SCANMS_PARALLAX_BOUND__ = true;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;

    if (!isReduced && isFinePointer) {
      let mouseX = 0, mouseY = 0;
      let currentX = 0, currentY = 0;
      let rafId = null;

      window.addEventListener("mousemove", (e) => {
        const bgEl = document.querySelector("#login-hero-bg");
        if (!bgEl) return;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        // Limit max movement to 5px
        mouseX = ((e.clientX - cx) / cx) * 5;
        mouseY = ((e.clientY - cy) / cy) * 5;

        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            currentX += (mouseX - currentX) * 0.12;
            currentY += (mouseY - currentY) * 0.12;
            bgEl.style.transform = `scale(1.04) translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;
            rafId = null;
          });
        }
      }, { passive: true });
    }
  }

  // Auto-persist register input data on typing
  const regForm = root.querySelector("[data-action='register']");
  if (regForm) {
    regForm.addEventListener("input", () => saveCurrentRegFormValues(root));
    regForm.addEventListener("change", () => saveCurrentRegFormValues(root));
  }

  // Password toggle
  root.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = root.querySelector(btn.dataset.togglePassword);
      if (!target) return;
      const isPass = target.type === "password";
      target.type = isPass ? "text" : "password";
      btn.innerHTML = `<i class="ph ${isPass ? 'ph-eye-slash' : 'ph-eye'}"></i>`;
    });
  });

  // Password strength meter
  const regPassInput = root.querySelector("#reg-password");
  if (regPassInput) {
    regPassInput.addEventListener("input", () => {
      const val = regPassInput.value;
      const seg1 = root.querySelector("#seg-1");
      const seg2 = root.querySelector("#seg-2");
      const seg3 = root.querySelector("#seg-3");
      const seg4 = root.querySelector("#seg-4");
      const badge = root.querySelector("#pass-meter-badge");
      const icon = root.querySelector("#pass-meter-icon");
      const hint = root.querySelector("#pass-meter-hint");
      if (!seg1 || !badge || !hint) return;

      const segs = [seg1, seg2, seg3, seg4];
      segs.forEach((s) => {
        s.style.backgroundColor = "var(--surface-3)";
        s.style.opacity = "0.45";
      });

      if (!val) {
        badge.textContent = "Chưa nhập";
        badge.style.backgroundColor = "var(--surface-3)";
        badge.style.color = "var(--muted)";
        if (icon) {
          icon.className = "ph ph-shield";
          icon.style.color = "var(--muted)";
        }
        hint.innerHTML = '<i class="ph ph-info"></i> Tối thiểu 8 ký tự, kết hợp chữ hoa, chữ thường và số.';
        hint.style.color = "var(--muted)";
        return;
      }

      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      if (val.length < 6) {
        score = Math.min(score, 1);
      }

      if (score <= 1) {
        seg1.style.backgroundColor = "var(--danger)";
        seg1.style.opacity = "1";
        badge.textContent = "Yếu";
        badge.style.backgroundColor = "var(--danger-soft)";
        badge.style.color = "var(--danger)";
        if (icon) {
          icon.className = "ph ph-warning-circle";
          icon.style.color = "var(--danger)";
        }
        hint.innerHTML = '<i class="ph ph-warning-circle"></i> Mật khẩu quá đơn giản. Hãy thêm chữ in hoa và số.';
        hint.style.color = "var(--danger)";
      } else if (score === 2) {
        seg1.style.backgroundColor = "var(--warning)";
        seg2.style.backgroundColor = "var(--warning)";
        seg1.style.opacity = "1";
        seg2.style.opacity = "1";
        badge.textContent = "Trung bình";
        badge.style.backgroundColor = "var(--warning-soft)";
        badge.style.color = "var(--warning)";
        if (icon) {
          icon.className = "ph ph-shield-warning";
          icon.style.color = "var(--warning)";
        }
        hint.innerHTML = '<i class="ph ph-shield-warning"></i> Khá tốt! Thêm ký tự đặc biệt (!@#$%) để tăng độ an toàn ví.';
        hint.style.color = "var(--warning)";
      } else if (score === 3) {
        const c = "var(--brand)";
        seg1.style.backgroundColor = c;
        seg2.style.backgroundColor = c;
        seg3.style.backgroundColor = c;
        seg1.style.opacity = "1";
        seg2.style.opacity = "1";
        seg3.style.opacity = "1";
        badge.textContent = "Khá mạnh";
        badge.style.backgroundColor = "var(--brand-soft)";
        badge.style.color = "var(--brand)";
        if (icon) {
          icon.className = "ph ph-shield-check";
          icon.style.color = "var(--brand)";
        }
        hint.innerHTML = '<i class="ph ph-shield-check"></i> Mật khẩu an toàn! Đã đủ điều kiện bảo vệ tài khoản hoa hồng.';
        hint.style.color = "var(--brand)";
      } else {
        const c = "var(--brand-strong)";
        segs.forEach((s) => {
          s.style.backgroundColor = c;
          s.style.opacity = "1";
        });
        badge.textContent = "Rất an toàn";
        badge.style.backgroundColor = "var(--brand-soft)";
        badge.style.color = "var(--brand-strong)";
        if (icon) {
          icon.className = "ph ph-check-circle";
          icon.style.color = "var(--brand-strong)";
        }
        hint.innerHTML = '<i class="ph ph-check-circle"></i> Xuất sắc! Mật khẩu đạt tiêu chuẩn mã hóa Fintech & Ngân hàng.';
        hint.style.color = "var(--brand-strong)";
      }
    });
    if (regPassInput.value) {
      regPassInput.dispatchEvent(new Event("input"));
    }
  }

  // Quên mật khẩu
  root.querySelector("[data-action='forgot-pass']")?.addEventListener("click", () => {
    modal("forgot_pass");
  });

  // Social Auth
  root.querySelectorAll("[data-social]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const provider = btn.dataset.social;
      const targetScreen = getDefaultScreenForRole(state.role);
      toast(`Đang xác thực bảo mật qua ${provider}...`);
      setTimeout(() => {
        toast(`Đăng nhập thành công qua ${provider}!`);
        go(targetScreen);
      }, 700);
    });
  });

  // Submit Login
  root.querySelector("[data-action='login']")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const pwInput = root.querySelector("#login-password")?.value;
    if (!pwInput) {
      toast("Vui lòng nhập mật khẩu để đăng nhập.");
      root.querySelector("#login-password")?.focus();
      return;
    }

    const roleNames = {
      admin: "Quản Trị Hệ Thống",
      manager: "Vận Hành Sàn",
      shop: "Chủ Cửa Hàng",
      kol: "Cộng Tác Viên (KOL / CTV)",
      customer: "Khách Mua Hàng"
    };
    const roleName = roleNames[state.role] || "Thành viên";
    const targetScreen = getDefaultScreenForRole(state.role);

    if (state.role === "shop") {
      const emailInput = root.querySelector("#login-email")?.value.trim().toLowerCase();
      const st = managerState.stores.find(s => s.email.toLowerCase() === emailInput) || state.pendingShop;
      if (st) {
        state.currentStore = st;
      }
      if (st && (st.status === "pending" || st.status === "reviewing")) {
        toast(`Đăng nhập thành công! Gian hàng "${st.name}" đang trong trạng thái CHỜ XÉT DUYỆT.`);
        go(targetScreen);
        return;
      }
    }

    go(targetScreen);
    toast(`Đăng nhập thành công với vai trò ${roleName}.`);
  });

  // Submit Register
  root.querySelector("[data-action='register']")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCurrentRegFormValues(root);
    const name = state.regData?.name?.trim() || root.querySelector("#reg-name")?.value.trim() || "Thành viên mới";
    const email = state.regData?.email?.trim() || root.querySelector("#reg-email")?.value.trim() || "";
    const phone = state.regData?.phone?.trim() || root.querySelector("#reg-phone")?.value.trim() || "";
    const shopName = state.regData?.shopName?.trim() || root.querySelector("#reg-shop-name")?.value.trim() || "Gian hàng mới";
    const pass = state.regData?.password || root.querySelector("#reg-password")?.value;
    const confirm = state.regData?.confirm || root.querySelector("#reg-confirm")?.value;
    const terms = state.regData?.terms || root.querySelector("#reg-terms")?.checked;
    const roleNames = {
      kol: "Cộng Tác Viên (KOL / CTV)",
      shop: "Chủ Cửa Hàng",
      customer: "Khách Mua Hàng"
    };
    const roleName = roleNames[state.role] || "Thành viên";

    if (!terms) {
      toast("Vui lòng tích chọn đồng ý với Điều khoản dịch vụ & Chính sách của SCANMS.");
      return;
    }

    if (pass !== confirm) {
      toast("Mật khẩu xác nhận không trùng khớp. Vui lòng nhập lại!");
      return;
    }

    const submitBtn = root.querySelector("#reg-submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="ph ph-spinner spin-icon"></i> Đang xử lý hồ sơ...`;
    }

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="ph ph-key"></i> Đăng ký ngay`;
      }

      state.lastRegisteredEmail = email;
      state.lastRegisteredRole = state.role;
      try { localStorage.setItem("scanms-last-reg-email", email); } catch (e) { }

      if (state.role === "shop") {
        // Tạo hồ sơ gian hàng mới với trạng thái PENDING
        const newStoreId = `STORE-${String(managerState.stores.length + 1).padStart(3, "0")}`;
        const newStore = {
          id: newStoreId,
          name: shopName || "Gian hàng mới",
          owner: name,
          email: email,
          phone: phone,
          taxCode: "Chưa cập nhật",
          category: "Thương mại điện tử & Bán lẻ",
          submittedAt: new Date().toLocaleString("vi-VN"),
          status: "pending", // CHƯA ĐƯỢC KÍCH HOẠT - CHỜ DUYỆT BỞI ADMIN/VẬN HÀNH
          productsCount: 0,
          kolCount: 0,
          gmv: 0,
          notes: `Hồ sơ đăng ký trực tuyến gửi bởi ${name}. Đang chờ Ban Quản Trị & Vận Hành Sàn SCANMS thẩm định pháp lý và ngành hàng.`,
          rejectionReason: "",
          documents: [`GPKD_${shopName.replace(/\s+/g, '_')}.pdf`, "GiayUyQuyenThuongHieu.pdf"]
        };

        // Thêm vào danh sách quản trị của Vận Hành Sàn
        managerState.stores.unshift(newStore);
        managerState.opsLogs.unshift({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          time: "Vừa xong",
          actor: "Hệ thống Đăng Ký (SCANMS Auth)",
          action: "TIẾP NHẬN ĐĂNG KÝ SHOP",
          target: `${newStore.id} (${newStore.name})`,
          note: `Chủ shop ${name} nộp hồ sơ mở gian hàng mới. Trạng thái: Chờ Vận Hành thẩm định.`
        });

        state.pendingShop = newStore;
        state.currentStore = newStore;
        try { localStorage.setItem("scanms-pending-shop", JSON.stringify(newStore)); } catch (e) { }

        // Chuyển thẳng sang màn hình đăng nhập (state.authMode = "login")
        state.authMode = "login";
        state.screen = "auth";
        state.role = "shop";
        location.hash = "login";
        renderCurrentPage();

        toast(`Hồ sơ gian hàng "${newStore.name}" (${newStore.id}) đã được tiếp nhận (Chờ duyệt). Vui lòng nhập mật khẩu để đăng nhập theo dõi tiến độ!`);
        setTimeout(() => {
          const pwInput = document.querySelector("#login-password");
          if (pwInput) {
            pwInput.value = "";
            pwInput.focus();
          }
        }, 150);
      } else {
        // KOL hoặc Khách hàng: chuyển sang màn hình đăng nhập để nhập mật khẩu
        state.authMode = "login";
        state.screen = "auth";
        location.hash = "login";
        renderCurrentPage();
        toast(`Đăng ký tài khoản ${roleName} thành công! Vui lòng nhập mật khẩu tài khoản ${email} để đăng nhập.`);
        setTimeout(() => {
          const pwInput = document.querySelector("#login-password");
          if (pwInput) {
            pwInput.value = "";
            pwInput.focus();
          }
        }, 150);
      }
    }, 400);
  });

  // Quick approve shop action
  root.querySelectorAll("[data-action='quick-approve-shop']").forEach(btn => {
    btn.addEventListener("click", () => {
      const storeId = btn.dataset.storeId;
      const st = managerState.stores.find(s => s.id === storeId) || state.currentStore || state.pendingShop;
      if (st) {
        st.status = "approved";
        if (state.currentStore) state.currentStore.status = "approved";
        if (state.pendingShop) state.pendingShop.status = "approved";
        try { localStorage.setItem("scanms-pending-shop", JSON.stringify(st)); } catch (e) { }
        managerState.opsLogs.unshift({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          time: "Vừa xong",
          actor: "Admin / Chuyên viên Vận Hành",
          action: "PHÊ DUYỆT GIAN HÀNG",
          target: `${st.id} (${st.name})`,
          note: "Đã thẩm định hồ sơ đạt tiêu chuẩn và kích hoạt gian hàng chính thức trên SCANMS."
        });
        toast(`Gian hàng "${st.name}" đã được phê duyệt và kích hoạt thành công trên SCANMS!`);
        renderCurrentPage();
      }
    });
  });

  // Switch to manager review
  root.querySelectorAll("[data-action='switch-to-manager']").forEach(btn => {
    btn.addEventListener("click", () => {
      const storeId = btn.dataset.storeId;
      state.role = "manager";
      managerState.activeStoreFilter = "pending";
      if (storeId) managerState.selectedStoreDetailId = storeId;
      try { localStorage.setItem("scanms-current-role", "manager"); } catch (e) { }
      go("manager-stores");
      toast("Đã chuyển sang vai trò Vận Hành Sàn để kiểm tra và duyệt hồ sơ gian hàng.");
    });
  });

  root.querySelector("[data-action='logout']")?.addEventListener("click", () => {
    state.authMode = "login";
    go("auth");
    toast("Bạn đã đăng xuất khỏi SCANMS.");
  });
  root.querySelector("[data-action='message']")?.addEventListener("submit", (event) => { event.preventDefault(); const input = event.currentTarget.elements.message; toast(`Đã gửi: ${input.value}`); input.value = ""; });
  if (state.screen === "tracking") {
    bindTracking(root, { toast, go, renderCurrentPage });
  }
  if (state.screen === "storefront") {
    bindStorefront(root, { toast, go, renderCurrentPage, modal });
  }
  if (state.screen === "marketplace" || state.screen === "home") {
    bindMarketplace(root, { toast, go, renderCurrentPage, modal });
  }
  // Channels toolbar search & filters
  const chSearchInput = root.querySelector("#channel-search-input");
  if (chSearchInput) {
    chSearchInput.addEventListener("input", (e) => {
      state.channelSearch = e.target.value;
      renderCurrentPage();
      const nextInput = document.querySelector("#channel-search-input");
      if (nextInput) {
        nextInput.focus();
        nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
      }
    });
  }

  root.querySelector("[data-action='clear-channel-search']")?.addEventListener("click", () => {
    state.channelSearch = "";
    state.channelPlatformFilter = "all";
    state.channelStatusFilter = "all";
    renderCurrentPage();
  });

  root.querySelector("#channel-platform-filter")?.addEventListener("change", (e) => {
    state.channelPlatformFilter = e.target.value;
    renderCurrentPage();
  });

  root.querySelector("#channel-status-filter")?.addEventListener("change", (e) => {
    state.channelStatusFilter = e.target.value;
    renderCurrentPage();
  });

  root.querySelector("#channel-sort")?.addEventListener("change", (e) => {
    state.channelSort = e.target.value;
    renderCurrentPage();
  });

  root.querySelectorAll("[data-action='open-add-channel']").forEach(btn => {
    btn.addEventListener("click", () => openAddEditChannelModal());
  });

  root.querySelectorAll("[data-action='reset-demo-channels']").forEach(btn => {
    btn.addEventListener("click", () => resetDemoChannels());
  });

  // Channels card actions
  root.querySelectorAll("[data-action='view-channel-detail']").forEach(btn => {
    btn.addEventListener("click", () => openChannelDetailDrawer(btn.dataset.id));
  });

  root.querySelectorAll("[data-action='toggle-channel-menu']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const chId = btn.dataset.id;
      const popover = root.querySelector(`#channel-popover-${chId}`);
      if (!popover) return;
      const isOpen = popover.classList.contains("show");
      root.querySelectorAll(".channel-action-popover.show").forEach(p => {
        p.classList.remove("show");
        const trigger = p.closest(".channel-menu-wrap")?.querySelector(".channel-more-btn");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        popover.classList.add("show");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  root.querySelectorAll(".channel-action-popover .popover-item").forEach(item => {
    item.addEventListener("click", () => {
      item.closest(".channel-action-popover")?.classList.remove("show");
      const trigger = item.closest(".channel-menu-wrap")?.querySelector(".channel-more-btn");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  });

  root.querySelectorAll("[data-action='view-analytics']").forEach(btn => {
    btn.addEventListener("click", () => openChannelAnalyticsModal(btn.dataset.id));
  });

  root.querySelectorAll("[data-action='create-link-for-channel']").forEach(btn => {
    btn.addEventListener("click", () => {
      const chId = btn.dataset.id;
      const ch = state.channels.find(c => c.id === chId);
      window.__SCANMS_PRESELECTED_CHANNEL__ = chId;
      go("links");
      toast(`Đã chọn kênh ${ch ? ch.name : ''} để tạo link tiếp thị.`);
    });
  });

  root.querySelectorAll("[data-action='set-primary']").forEach(btn => {
    btn.addEventListener("click", () => setPrimaryChannel(btn.dataset.id));
  });

  root.querySelectorAll("[data-action='edit-channel']").forEach(btn => {
    btn.addEventListener("click", () => openAddEditChannelModal(btn.dataset.id));
  });

  root.querySelectorAll("[data-action='delete-channel']").forEach(btn => {
    btn.addEventListener("click", () => openDeleteChannelModal(btn.dataset.id));
  });

  root.querySelector("[data-search]")?.addEventListener("input", (event) => { state.search = event.target.value; const pos = event.target.selectionStart; renderCurrentPage(); const next = document.querySelector("[data-search]"); next.focus(); next.setSelectionRange(pos, pos); });

  // Switch role from 403 Forbidden Screen button
  root.querySelectorAll("[data-switch-role-to]").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetRole = btn.dataset.switchRoleTo;
      const targetScr = btn.dataset.targetScreen;
      if (targetRole) {
        window.switchScanmsRole(targetRole);
        if (targetScr) {
          go(targetScr);
        }
      }
    });
  });

  // ==========================================
  // AUDIT TRAIL JSON & EXPORT
  // ==========================================
  root.querySelectorAll("[data-view-audit-json]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.viewAuditJson, 10);
      openAuditJsonModal(idx);
    });
  });

  root.querySelector("#export-all-audit-btn")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(auditTrailRecords, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit_trail_full_${Date.now()}.json`;
    a.click();
    toast("Đã xuất toàn bộ hồ sơ Audit Log hệ thống (.JSON)!");
  });

  // ==========================================
  // BIND SUB-MODULES FOR 5 ROLES
  // ==========================================
  bindManager(root, { toast, go, renderCurrentPage });
  bindCustomer(root, { toast, go, renderCurrentPage, modal });
  bindAdmin(root, { toast, go, renderCurrentPage });
  bindShopOps(root, { toast, go, renderCurrentPage });
  bindKolProfile(root, { toast, go, renderCurrentPage });
  bindShopProfile(root, { toast, go, renderCurrentPage });
  bindAdminProfile(root, { toast, go, renderCurrentPage });

  // Tự động đồng bộ chiều cao Iframe mốc thưởng để loại bỏ hoàn toàn thanh cuộn lồng nhau (cuộn êm mượt 100%)
  const crIframe = root.querySelector("#commission-rules-iframe") || root.querySelector("#kol-bonus-iframe");
  if (crIframe) {
    const syncIframeHeight = () => {
      try {
        if (crIframe.contentDocument && crIframe.contentDocument.body) {
          const doc = crIframe.contentDocument;
          doc.documentElement.style.overflow = "hidden";
          doc.body.style.overflow = "hidden";
          const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
          if (h > 600) {
            const curH = parseInt(crIframe.style.height || "0", 10);
            if (Math.abs(curH - h) > 10) {
              crIframe.style.height = `${h}px`;
            }
          }
        }
      } catch (e) { }
    };
    crIframe.addEventListener("load", () => {
      syncIframeHeight();
      try {
        if (crIframe.contentDocument && window.ResizeObserver) {
          const ro = new ResizeObserver(() => syncIframeHeight());
          ro.observe(crIframe.contentDocument.body);
        }
      } catch (e) { }
    });
  }
}

// Lắng nghe resize từ iframe để trang cuộn tự nhiên 1 thanh cuộn duy nhất mượt mà
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SCANMS_RESIZE_IFRAME") {
    const iframe = document.querySelector("#commission-rules-iframe") || document.querySelector("#kol-bonus-iframe");
    if (iframe && event.data.height) {
      const curH = parseInt(iframe.style.height || "0", 10);
      if (Math.abs(curH - event.data.height) > 10) {
        iframe.style.height = `${event.data.height}px`;
      }
    }
  }
});


addEventListener("hashchange", () => {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  const h = location.hash.replace("#", "");
  if (h === "register" || h === "auth-register") {
    state.screen = "auth";
    state.authMode = "register";
  } else if (h === "login" || h === "auth" || h === "auth-login") {
    state.screen = "auth";
    state.authMode = "login";
  } else {
    state.screen = h || "marketplace";
    if (state.screen === "auth" && !h.includes("register")) {
      state.authMode = "login";
    }
  }
  renderCurrentPage();
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#topbar-profile-btn") && !e.target.closest("#topbar-profile-popover")) {
    const p = document.querySelector("#topbar-profile-popover");
    const b = document.querySelector("#topbar-profile-btn");
    if (p) p.classList.remove("show");
    if (b) b.classList.remove("popover-open");
  }
  if (!e.target.closest(".channel-menu-wrap")) {
    document.querySelectorAll(".channel-action-popover.show").forEach(p => {
      p.classList.remove("show");
      const trigger = p.closest(".channel-menu-wrap")?.querySelector(".channel-more-btn");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const p = document.querySelector("#topbar-profile-popover");
    const b = document.querySelector("#topbar-profile-btn");
    if (p) p.classList.remove("show");
    if (b) b.classList.remove("popover-open");
    document.querySelectorAll(".channel-action-popover.show").forEach(p => {
      p.classList.remove("show");
      const trigger = p.closest(".channel-menu-wrap")?.querySelector(".channel-more-btn");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
    if (document.querySelector(".channel-drawer-backdrop")) {
      closeChannelDetailDrawer();
    }
  }
});

window.addEventListener("wheel", (e) => {
  const activeIframe = document.querySelector("#kol-bonus-iframe, #commission-rules-iframe, #kol-coupons-iframe, #shop-coupons-iframe, #admin-coupons-iframe");
  if (activeIframe && activeIframe.contentWindow) {
    try {
      activeIframe.contentWindow.scrollBy({ top: e.deltaY, behavior: "auto" });
    } catch {}
  }
}, { passive: true });

render();
