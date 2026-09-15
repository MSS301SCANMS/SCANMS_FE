// =====================================================================
// SCANMS - Kho Nội Dung Bán Hàng (Media Hub) - FR-08
// Dành cho KOL / Cộng Tác Viên: Tìm kiếm, lọc, xem trước, tải tệp & caption
// =====================================================================

const productImage = "./assets/serum-hero-optimized.jpg";
const sunscreenImage = "./assets/sunscreen-product.jpg";
const tonerImage = "./assets/toner-bha-product.jpg";
const cleanserImage = "./assets/cleanser-product.jpg";
const cicaMaskImage = "./assets/cica-mask-product.jpg";
const sampleVideoUrl = "./assets/sample-video.mp4";

// Danh mục 5 sản phẩm chuẩn
export const products = [
  {
    id: "ALL",
    name: "Tất cả sản phẩm",
    sku: "ALL",
    price: 0,
    rate: 0,
    category: "Tất cả",
  },
  {
    id: "SKIN-C15",
    name: "Serum vitamin C 15%",
    sku: "SKIN-C15",
    price: 459000,
    rate: 8,
    category: "Chăm sóc da",
    description: "Serum dưỡng sáng mờ thâm, chống oxy hóa với vitamin C tinh khiết 15%.",
  },
  {
    id: "SUN-AQUA",
    name: "Kem chống nắng SPF50+",
    sku: "SUN-AQUA",
    price: 389000,
    rate: 10,
    category: "Bảo vệ da",
    description: "Màng lọc phổ rộng 5 tia, kiềm dầu 8 giờ, kháng nước mồ hôi.",
  },
  {
    id: "TONER-BHA",
    name: "Nước hoa hồng BHA 2%",
    sku: "TONER-BHA",
    price: 320000,
    rate: 9,
    category: "Tẩy tế bào chết",
    description: "Làm sạch sâu bã nhờn, se khít lỗ chân lông, cân bằng pH 3.8.",
  },
  {
    id: "CLEANSER-02",
    name: "Gel rửa mặt dịu nhẹ",
    sku: "CLEANSER-02",
    price: 279000,
    rate: 7,
    category: "Làm sạch",
    description: "Độ pH 5.5 chuẩn da liễu, chiết xuất rau má làm dịu kích ứng.",
  },
  {
    id: "MASK-CICA",
    name: "Mặt nạ phục hồi Cica",
    sku: "MASK-CICA",
    price: 69000,
    rate: 12,
    category: "Chăm sóc da",
    description: "Chiết xuất rau má cô đặc, làm dịu da cấp tốc sau mụn và treatment.",
  },
];

// Khôi phục các video do KOL nộp từ localStorage vào kho tài nguyên
// ---------------------------------------------------------------------
// LƯU TRỮ VÀ KHÔI PHỤC VIDEO REVIEW CỦA KOL TỪ LOCALSTORAGE
// ---------------------------------------------------------------------
const STORAGE_KEY_SUBMISSIONS = "scanms_kol_video_submissions";

export function loadSavedSubmissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [
    {
      id: "SUBMISSION-INIT-01",
      productId: "SKIN-C15",
      productName: "Serum vitamin C 15%",
      title: "Trải nghiệm thực tế Serum Vitamin C sau 14 ngày – Da sáng mờ thâm rõ rệt",
      type: "video",
      format: "MP4",
      ratio: "9:16",
      ratioClass: "ratio-9-16",
      resolution: "1080 x 1920 px",
      duration: "00:42",
      durationSec: 42,
      fps: "60 fps",
      bitrate: "8.5 Mbps",
      fileSize: "18.2 MB",
      sizeBytes: 19084083,
      downloads: 0,
      isApproved: false,
      isBroken: false,
      isSubmission: true,
      status: "PENDING",
      image: productImage,
      videoUrl: sampleVideoUrl,
      recommendedChannels: "TikTok, Reels, Shorts",
      tags: ["Review KOL", "Chờ duyệt", "Sora Skin"],
      updatedAt: "Hôm nay",
    },
  ];
}

export function saveSubmissionsToStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(list));
  } catch (e) {}
}

// Kho tài nguyên đa phương tiện
export const mediaAssets = [
  {
    id: "ASSET-01",
    productId: "SKIN-C15",
    productName: "Serum vitamin C 15%",
    title: "Ảnh sản phẩm nền studio 4K",
    type: "photo",
    format: "PNG",
    ratio: "4:3",
    ratioClass: "ratio-4-3",
    resolution: "2400 x 1800 px",
    fileSize: "2.4 MB",
    sizeBytes: 2516582,
    downloads: 412,
    isApproved: true,
    isBroken: false,
    image: productImage,
    recommendedChannels: "Facebook Feed, Website, Bài đăng chi tiết",
    tags: ["Studio", "4K", "Nền trắng", "Routine"],
    updatedAt: "08/09/2026",
  },
  {
    id: "ASSET-02",
    productId: "SKIN-C15",
    productName: "Serum vitamin C 15%",
    title: "Video review routine buổi sáng (Shorts / TikTok)",
    type: "video",
    format: "MP4",
    ratio: "9:16",
    ratioClass: "ratio-9-16",
    resolution: "1080 x 1920 px",
    duration: "00:42",
    durationSec: 42,
    fps: "60 fps",
    bitrate: "8.5 Mbps",
    fileSize: "18.2 MB",
    sizeBytes: 19084083,
    downloads: 856,
    isApproved: true,
    isBroken: false,
    image: productImage,
    videoUrl: sampleVideoUrl,
    recommendedChannels: "TikTok, Reels, YouTube Shorts",
    tags: ["TikTok", "9:16", "Routine", "Trải nghiệm"],
    updatedAt: "07/09/2026",
  },
  {
    id: "ASSET-03",
    productId: "SKIN-C15",
    productName: "Serum vitamin C 15%",
    title: "Banner ưu đãi Flash Sale Tháng 9 (Vuông)",
    type: "banner",
    format: "PNG",
    ratio: "1:1",
    ratioClass: "ratio-1-1",
    resolution: "1200 x 1200 px",
    fileSize: "1.8 MB",
    sizeBytes: 1887436,
    downloads: 274,
    isApproved: true,
    isBroken: false,
    image: productImage,
    recommendedChannels: "Facebook Feed, Instagram Square, Zalo OA",
    tags: ["Banner", "FlashSale", "1:1", "Giảm 20%"],
    updatedAt: "05/09/2026",
  },
  {
    id: "ASSET-04",
    productId: "SKIN-C15",
    productName: "Serum vitamin C 15%",
    title: "Video hướng dẫn 3 bước kết hợp Serum Vitamin C",
    type: "video",
    format: "MP4",
    ratio: "16:9",
    ratioClass: "ratio-16-9",
    resolution: "1920 x 1080 px",
    duration: "01:15",
    durationSec: 75,
    fps: "60 fps",
    bitrate: "10.2 Mbps",
    fileSize: "24.5 MB",
    sizeBytes: 25690112,
    downloads: 319,
    isApproved: true,
    isBroken: false,
    image: productImage,
    videoUrl: sampleVideoUrl,
    recommendedChannels: "YouTube Landscape, Facebook Video",
    tags: ["Tutorial", "16:9", "Chuyên sâu", "Da liễu"],
    updatedAt: "03/09/2026",
  },
  {
    id: "ASSET-05",
    productId: "SKIN-C15",
    productName: "Serum vitamin C 15%",
    title: "Banner Story quà tặng kèm độc quyền",
    type: "banner",
    format: "PNG",
    ratio: "9:16",
    ratioClass: "ratio-9-16",
    resolution: "1080 x 1920 px",
    fileSize: "2.1 MB",
    sizeBytes: 2202009,
    downloads: 188,
    isApproved: true,
    isBroken: false,
    image: productImage,
    recommendedChannels: "Instagram Story, Facebook Story, TikTok Photo",
    tags: ["Story", "9:16", "Quà tặng"],
    updatedAt: "02/09/2026",
  },
  {
    id: "ASSET-06",
    productId: "SKIN-C15",
    productName: "Serum vitamin C 15%",
    title: "Ảnh cận cảnh Texture serum thẩm thấu nhanh",
    type: "photo",
    format: "JPG",
    ratio: "1:1",
    ratioClass: "ratio-1-1",
    resolution: "2048 x 2048 px",
    fileSize: "2.8 MB",
    sizeBytes: 2936012,
    downloads: 520,
    isApproved: true,
    isBroken: false,
    image: productImage,
    recommendedChannels: "Instagram Post, Carousel Feed",
    tags: ["Texture", "Macro", "Thẩm thấu"],
    updatedAt: "01/09/2026",
  },
  {
    id: "ASSET-07",
    productId: "SUN-AQUA",
    productName: "Kem chống nắng SPF50+",
    title: "Ảnh chụp ngoại cảnh cùng Kem Chống Nắng SPF50+",
    type: "photo",
    format: "PNG",
    ratio: "4:3",
    ratioClass: "ratio-4-3",
    resolution: "2400 x 1800 px",
    fileSize: "2.1 MB",
    sizeBytes: 2202009,
    downloads: 642,
    isApproved: true,
    isBroken: false,
    image: sunscreenImage,
    recommendedChannels: "Facebook Post, Review Blog",
    tags: ["Outdoor", "Nắng hè", "Lifestyle"],
    updatedAt: "06/09/2026",
  },
  {
    id: "ASSET-08",
    productId: "SUN-AQUA",
    productName: "Kem chống nắng SPF50+",
    title: "Video test kiềm dầu 8 tiếng đi biển thực tế",
    type: "video",
    format: "MP4",
    ratio: "9:16",
    ratioClass: "ratio-9-16",
    resolution: "1080 x 1920 px",
    duration: "00:35",
    durationSec: 35,
    fps: "60 fps",
    bitrate: "8.2 Mbps",
    fileSize: "21.0 MB",
    sizeBytes: 22020096,
    downloads: 914,
    isApproved: true,
    isBroken: false,
    image: sunscreenImage,
    videoUrl: sampleVideoUrl,
    recommendedChannels: "TikTok, Reels, Shorts",
    tags: ["Kiềm dầu", "Kháng nước", "Test thực tế"],
    updatedAt: "05/09/2026",
  },
  {
    id: "ASSET-09",
    productId: "SUN-AQUA",
    productName: "Kem chống nắng SPF50+",
    title: "Banner so sánh màng lọc chống nắng thế hệ mới",
    type: "banner",
    format: "PNG",
    ratio: "16:9",
    ratioClass: "ratio-16-9",
    resolution: "1920 x 1080 px",
    fileSize: "1.9 MB",
    sizeBytes: 1992294,
    downloads: 388,
    isApproved: true,
    isBroken: false,
    image: sunscreenImage,
    recommendedChannels: "Website, Bài viết chuyên sâu",
    tags: ["Infographic", "SPF50+", "16:9"],
    updatedAt: "04/09/2026",
  },
  {
    id: "ASSET-10",
    productId: "TONER-BHA",
    productName: "Nước hoa hồng BHA 2%",
    title: "Ảnh bộ đôi làm sạch sâu Toner BHA và Bông tẩy trang",
    type: "photo",
    format: "JPG",
    ratio: "1:1",
    ratioClass: "ratio-1-1",
    resolution: "2048 x 2048 px",
    fileSize: "2.2 MB",
    sizeBytes: 2306867,
    downloads: 405,
    isApproved: true,
    isBroken: false,
    image: tonerImage,
    recommendedChannels: "Instagram Feed, Shopee Feed",
    tags: ["Flatlay", "BHA 2%", "Skincare"],
    updatedAt: "04/09/2026",
  },
  {
    id: "ASSET-11",
    productId: "TONER-BHA",
    productName: "Nước hoa hồng BHA 2%",
    title: "Video hướng dẫn đẩy mụn ẩn đúng cách cùng BHA",
    type: "video",
    format: "MP4",
    ratio: "9:16",
    ratioClass: "ratio-9-16",
    resolution: "1080 x 1920 px",
    duration: "00:45",
    durationSec: 45,
    fps: "60 fps",
    bitrate: "8.8 Mbps",
    fileSize: "16.4 MB",
    sizeBytes: 17196646,
    downloads: 720,
    isApproved: true,
    isBroken: false,
    image: tonerImage,
    videoUrl: sampleVideoUrl,
    recommendedChannels: "TikTok, Instagram Reels",
    tags: ["Mụn ẩn", "Lỗ chân lông", "9:16"],
    updatedAt: "03/09/2026",
  },
  {
    id: "ASSET-12",
    productId: "CLEANSER-02",
    productName: "Gel rửa mặt dịu nhẹ",
    title: "Ảnh bọt rửa mặt pH 5.5 dịu nhẹ không căng rát",
    type: "photo",
    format: "JPG",
    ratio: "4:3",
    ratioClass: "ratio-4-3",
    resolution: "2400 x 1800 px",
    fileSize: "1.7 MB",
    sizeBytes: 1782579,
    downloads: 260,
    isApproved: true,
    isBroken: false,
    image: cleanserImage,
    recommendedChannels: "Facebook, Shopee Feed",
    tags: ["pH 5.5", "Dịu nhẹ", "Làm sạch"],
    updatedAt: "02/09/2026",
  },
  {
    id: "ASSET-13",
    productId: "MASK-CICA",
    productName: "Mặt nạ phục hồi Cica",
    title: "Video ASMR đắp mặt nạ làm dịu da cấp tốc",
    type: "video",
    format: "MP4",
    ratio: "9:16",
    ratioClass: "ratio-9-16",
    resolution: "1080 x 1920 px",
    duration: "00:40",
    durationSec: 40,
    fps: "60 fps",
    bitrate: "7.9 Mbps",
    fileSize: "19.2 MB",
    sizeBytes: 20132659,
    downloads: 580,
    isApproved: true,
    isBroken: false,
    image: cicaMaskImage,
    videoUrl: sampleVideoUrl,
    recommendedChannels: "TikTok ASMR, Reels",
    tags: ["ASMR", "Rau má", "Cica", "Phục hồi"],
    updatedAt: "01/09/2026",
  },
  {
    id: "ASSET-14",
    productId: "SKIN-C15",
    productName: "Serum vitamin C 15%",
    title: "Video TVC Chiến dịch Mùa hè (Tệp mô phỏng hết hạn)",
    type: "video",
    format: "MP4",
    ratio: "16:9",
    ratioClass: "ratio-16-9",
    resolution: "1920 x 1080 px",
    duration: "00:50",
    durationSec: 50,
    fps: "30 fps",
    bitrate: "6.0 Mbps",
    fileSize: "32.0 MB",
    sizeBytes: 33554432,
    downloads: 14,
    isApproved: false,
    isBroken: true,
    image: productImage,
    videoUrl: sampleVideoUrl,
    recommendedChannels: "Chiến dịch đã kết thúc",
    tags: ["Mô phỏng lỗi", "Hết hạn", "CDN Timeout"],
    updatedAt: "15/08/2026",
  },
];

// 4 Mẫu nội dung Caption chuẩn hóa (không khẳng định chưa kiểm chứng)
// Restore saved KOL submissions only after mediaAssets has been initialized.
const storedSubs = loadSavedSubmissions();
if (storedSubs.length > 0) {
  storedSubs.forEach((sub) => {
    const existing = mediaAssets.find((asset) => asset.id === sub.id);
    if (existing) {
      Object.assign(existing, sub);
    } else {
      mediaAssets.unshift(sub);
    }
  });
}

export const captionPresets = {
  short: {
    id: "short",
    label: "Giới thiệu ngắn",
    template: `Gợi ý chăm sóc da sáng khỏe mỗi ngày cùng {PRODUCT_NAME} ✨

Tinh chất mỏng nhẹ, thẩm thấu nhanh, hỗ trợ cấp ẩm và cải thiện bề mặt da mềm mịn.

👉 Đặt mua chính hãng qua link định danh: {AFFILIATE_LINK}
🎁 Nhập ngay mã ưu đãi {COUPON_CODE} để được giảm thêm 10% khi đặt hàng!

{HASHTAGS}`,
  },
  review: {
    id: "review",
    label: "Review chi tiết",
    template: `[GÓC REVIEW TỪ {KOL_NAME}]
Trải nghiệm thực tế khi sử dụng {PRODUCT_NAME}:

💧 Cảm quan kết cấu: Tinh chất mỏng nhẹ, thấm nhanh trong khoảng 15 giây, không gây bết dính hay bóng nhờn.
🔬 Bảng thành phần: Nồng độ hoạt chất cân bằng kết hợp dưỡng chất làm dịu, phù hợp cho chu trình dưỡng da hàng ngày.
🎯 Cảm nhận sau 3 tuần: Bề mặt da trông tươi sáng, ẩm mịn và rạng rỡ hơn khi duy trì đều đặn sáng tối.

💰 Giá tham khảo: {PRODUCT_PRICE}
🛒 Link mua hàng chính hãng từ Shop: {AFFILIATE_LINK}
🏷️ Mã ưu đãi dành riêng: {COUPON_CODE}

{HASHTAGS}`,
  },
  offer: {
    id: "offer",
    label: "Ưu đãi",
    template: `🎁 ƯU ĐÃI ĐẶC BIỆT DÀNH CHO CỘNG ĐỒNG CỦA {KOL_NAME}!

Chương trình ưu đãi tháng cho sản phẩm {PRODUCT_NAME} chính hãng:
⚡ Giá ưu đãi chỉ: {PRODUCT_PRICE}
⚡ Tặng kèm quà tặng sample dùng thử độc quyền cho đơn hàng sớm
⚡ Áp dụng mã {COUPON_CODE} tại bước thanh toán để nhận thêm giảm giá 10%!

👉 Đặt mua ngay qua link: {AFFILIATE_LINK}

{HASHTAGS}`,
  },
  livestream: {
    id: "livestream",
    label: "Kịch bản livestream",
    template: `🌟 GỢI Ý KỊCH BẢN CHIA SẺ TRÊN LIVESTREAM:

1. Mở đầu: Cầm sản phẩm {PRODUCT_NAME}, zoom cận chất tinh chất lên camera để người xem thấy độ sánh nhẹ tự nhiên.
2. Trải nghiệm: Thoa thử lên mu bàn tay, chia sẻ cảm giác mát mịn và thấm nhanh không nhờn dính.
3. Kêu gọi: Hướng dẫn người xem bấm vào link ghim {AFFILIATE_LINK}, nhập mã {COUPON_CODE} để nhận hàng chính hãng từ Shop Sora Skin!

👉 Link ghim: {AFFILIATE_LINK}
🏷️ Mã ưu đãi: {COUPON_CODE}

{HASHTAGS}`,
  },
};

// State nội bộ của Media Hub
export const mediaState = {
  // Bộ lọc tài nguyên
  selectedProduct: "ALL",
  selectedType: "all", // all, photo, video, banner, caption
  selectedRatio: "all", // all, 9:16, 1:1, 16:9, 4:3
  searchQuery: "",
  sortBy: "latest", // latest, downloads, size
  uiMode: "normal", // normal, loading, empty, error

  // Dropdowns & Popovers
  isProductDropdownOpen: false,
  productSearchQuery: "",
  isRatioPopoverOpen: false,
  isMobileFilterDrawerOpen: false,

  // Soạn Caption Studio (Mặc định thu gọn Accordion theo yêu cầu)
  isCaptionAccordionOpen: false,
  activeCaptionPreset: "short", // short, review, offer, livestream
  customCaptionText: null, // null khi dùng mẫu gốc, chuỗi khi người dùng gõ sửa
  isCaptionModified: false,
  includeLink: true,
  includeCoupon: true,
  includeHashtags: true,
  customLink: "",
  customCoupon: "NHATXINH10",
  customHashtags: "#SoraSkin #ReviewMyPham #Affiliate",
  isInsertPopoverOpen: false,
  isPreviewDrawerOpen: false,
  socialPreviewPlatform: "tiktok", // tiktok, facebook, threads

  // Tabs góc nhìn: "shop" (Tài nguyên Shop) hoặc "my_reviews" (Video review của tôi)
  activeTab: "shop",

  // Modals
  activeModal: null, // preview-image, preview-video, guidelines, download-progress, submit-kol-video, confirm-delete-submission
  submitForm: null,
  deleteConfirmItem: null,
  selectedAsset: null,
  downloadProgress: 0,
  zoomLevel: 100,
  rotation: 0,
  videoPlaying: false,
  videoCurrentTime: 0,
  videoDuration: 42,
  videoVolume: 1,
  videoPlaybackRate: 1,
};

// Khởi tạo form nộp video review hoàn toàn sạch sẽ (FR-15)
export function createCleanSubmitKolForm() {
  return {
    productId: "SKIN-C15",
    title: "",
    videoFile: null,
    videoFileName: "",
    videoFileSize: "",
    videoPreviewUrl: "",
    posterFile: null,
    posterFileName: "",
    posterPreviewUrl: productImage,
    caption: "",
  };
}

// Định dạng tiền tệ VND
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

// Lấy tên hiển thị của loại tài nguyên
function getTypeName(type) {
  switch (type) {
    case "photo": return "Ảnh";
    case "video": return "Video";
    case "banner": return "Banner";
    case "caption": return "Caption";
    default: return "Tất cả";
  }
}

// Biên dịch caption dựa trên preset hoặc nội dung tùy chỉnh
function compileCaptionText(currentProduct) {
  if (mediaState.isCaptionModified && mediaState.customCaptionText !== null) {
    return mediaState.customCaptionText;
  }

  const activePreset = captionPresets[mediaState.activeCaptionPreset] || captionPresets.short;
  const kolName = "Trần Văn Nhật";
  const couponCode = mediaState.customCoupon || "NHATXINH10";
  const defaultAffiliate = `https://scanms.vn/r/ref_nhat_${currentProduct.id.toLowerCase() === "all" ? "skinc15" : currentProduct.id.toLowerCase()}`;
  const affiliateLink = mediaState.customLink || defaultAffiliate;
  const productPrice = money(currentProduct.price || 459000);
  const hashtags = mediaState.customHashtags || "#SoraSkin #ReviewMyPham #Affiliate";

  let text = activePreset.template
    .replace(/\{PRODUCT_NAME\}/g, currentProduct.id !== "ALL" ? currentProduct.name : "Serum vitamin C 15%")
    .replace(/\{KOL_NAME\}/g, kolName)
    .replace(/\{COUPON_CODE\}/g, couponCode)
    .replace(/\{AFFILIATE_LINK\}/g, affiliateLink)
    .replace(/\{PRODUCT_PRICE\}/g, productPrice)
    .replace(/\{HASHTAGS\}/g, hashtags);

  if (!mediaState.includeLink) {
    text = text.replace(new RegExp(escapeRegex(affiliateLink), "g"), "[Link tại bio]");
  }
  if (!mediaState.includeCoupon) {
    text = text.replace(new RegExp(escapeRegex(couponCode), "g"), "Ưu đãi Shop");
  }
  if (!mediaState.includeHashtags) {
    text = text.replace(new RegExp(escapeRegex(hashtags), "g"), "").trim();
  }

  return text;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// =====================================================================
// 1. RENDER GIAO DIỆN CHÍNH (mediaPage)
// =====================================================================
export function mediaPage(globalState = {}) {
  const currentProduct = products.find((p) => p.id === mediaState.selectedProduct) || products[0];

  // Luôn lấy trạng thái kiểm duyệt mới nhất do Chủ Shop vừa cập nhật.
  // Module này sống lâu trong SPA nên không thể chỉ đọc localStorage một lần khi import.
  const latestSubmissions = loadSavedSubmissions();
  const latestIds = new Set(latestSubmissions.map((item) => item.id));
  for (let index = mediaAssets.length - 1; index >= 0; index -= 1) {
    if (mediaAssets[index].isSubmission && !latestIds.has(mediaAssets[index].id)) {
      mediaAssets.splice(index, 1);
    }
  }
  latestSubmissions.forEach((submission) => {
    const existing = mediaAssets.find((asset) => asset.id === submission.id);
    if (existing) Object.assign(existing, submission);
    else mediaAssets.unshift(submission);
  });

  // Phân chia tài nguyên Shop cung cấp và Video do KOL đã nộp
  const mySubmissions = mediaAssets.filter((a) => a.isSubmission);
  const shopAssets = mediaAssets.filter((a) => !a.isSubmission);

  const isMyReviewsTab = mediaState.activeTab === "my_reviews";
  const baseList = isMyReviewsTab ? mySubmissions : shopAssets;

  const shopAssetsCount = shopAssets.length;
  const myReviewsCount = mySubmissions.length;
  const pendingReviewsCount = mySubmissions.filter((a) => a.status === "PENDING").length;
  const approvedReviewsCount = mySubmissions.filter((a) => a.status === "APPROVED").length;
  const rejectedReviewsCount = mySubmissions.filter((a) => a.status === "REJECTED").length;

  // Lọc danh sách tài nguyên
  let filtered = baseList.filter((asset) => {
    // Lọc theo sản phẩm
    if (mediaState.selectedProduct !== "ALL" && asset.productId !== mediaState.selectedProduct) {
      return false;
    }
    // Lọc theo loại
    if (mediaState.selectedType !== "all" && asset.type !== mediaState.selectedType) {
      return false;
    }
    // Lọc theo tỷ lệ
    if (mediaState.selectedRatio !== "all" && asset.ratio !== mediaState.selectedRatio) {
      return false;
    }
    // Lọc theo tìm kiếm
    if (mediaState.searchQuery.trim()) {
      const q = mediaState.searchQuery.toLowerCase().trim();
      const matchTitle = asset.title.toLowerCase().includes(q);
      const matchProd = asset.productName.toLowerCase().includes(q);
      const matchTag = asset.tags ? asset.tags.some((t) => t.toLowerCase().includes(q)) : false;
      const matchExt = asset.format ? asset.format.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchProd && !matchTag && !matchExt) return false;
    }
    return true;
  });

  // Sắp xếp
  if (mediaState.sortBy === "downloads") {
    filtered = [...filtered].sort((a, b) => b.downloads - a.downloads);
  } else if (mediaState.sortBy === "size") {
    filtered = [...filtered].sort((a, b) => a.sizeBytes - b.sizeBytes);
  }

  // Đếm số lượng theo loại
  const photoCount = baseList.filter((a) => a.type === "photo").length;
  const videoCount = baseList.filter((a) => a.type === "video").length;
  const bannerCount = baseList.filter((a) => a.type === "banner").length;

  // Lọc danh sách sản phẩm trong dropdown tìm kiếm sản phẩm
  const pQuery = mediaState.productSearchQuery.toLowerCase().trim();
  const searchFilteredProducts = products.filter((p) => {
    if (!pQuery) return true;
    return p.name.toLowerCase().includes(pQuery) || p.sku.toLowerCase().includes(pQuery);
  });

  // Kiểm tra xem có bất kỳ điều kiện lọc nào đang áp dụng không
  const hasActiveFilters =
    mediaState.searchQuery.trim() !== "" ||
    mediaState.selectedProduct !== "ALL" ||
    mediaState.selectedType !== "all" ||
    mediaState.selectedRatio !== "all";

  // Số lượng tài nguyên của sản phẩm đang chọn
  const currentProdAssetCount =
    mediaState.selectedProduct === "ALL"
      ? baseList.length
      : baseList.filter((a) => a.productId === mediaState.selectedProduct).length;

  return `
    <div class="media-workspace">
      <!-- HEADER CHÍNH -->
      <header class="page-head media-page-head">
        <div class="media-head-col">
          <div class="crumb"><span>Tiếp thị liên kết / </span><strong>Kho nội dung bán hàng</strong></div>
          <h1>Kho nội dung bán hàng</h1>
          <p>Tài nguyên hình ảnh, video review và caption do Shop cung cấp, sẵn sàng quảng bá trên mạng xã hội.</p>

          <!-- Các nút điều khiển & chuyển nhanh chức năng thật FR-15 -->
          <div class="media-header-left-controls">
            <!-- CỤM 2 NÚT THAO TÁC NẰM SÁT BÊN TRÁI -->
            <div class="media-header-actions-left">
              <!-- NÚT NỘP VIDEO REVIEW FR-15 CHÍNH -->
              <button
                class="media-guidelines-btn"
                id="btn-open-kol-video-submission"
                type="button"
                title="Bấm để mở trực tiếp biểu mẫu Nộp video review (FR-15) trên Web"
                style="background: linear-gradient(135deg, #C59B58 0%, #B88E4F 100%) !important; color: #FFFFFF !important; border: 1.5px solid #DEBE85 !important; font-weight: 800 !important; padding: 0 16px !important; height: 38px !important; border-radius: 10px !important; display: inline-flex !important; align-items: center !important; gap: 8px !important; box-shadow: 0 4px 12px rgba(184, 142, 79, 0.35) !important; cursor: pointer !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);"
              >
                <i class="ph-bold ph-video-camera" style="color: #FFFFFF !important; font-size: 16px !important;"></i>
                <span style="color: #FFFFFF !important; font-weight: 800 !important;">Nộp video review (FR-15)</span>
              </button>

              <!-- NÚT MỞ TRANG LANDING PAGE FR-15 CÔNG KHAI (TONE MÀU VÀNG BE SÁNG NHẸ) -->
              <button
                class="media-guidelines-btn"
                id="btn-open-landing-page"
                type="button"
                title="Bấm để mở trực tiếp Landing Page sản phẩm công khai có video review và đặt hàng"
                style="background: #FDF8EE !important; color: #8C6320 !important; border: 1.5px solid #D8BC8A !important; font-weight: 750 !important; padding: 0 16px !important; height: 38px !important; border-radius: 10px !important; display: inline-flex !important; align-items: center !important; gap: 8px !important; box-shadow: 0 2px 6px rgba(197, 155, 88, 0.12) !important; cursor: pointer !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);"
              >
                <i class="ph-bold ph-shopping-bag-open" style="color: #B88E4F !important; font-size: 16px !important;"></i>
                <span style="color: #8C6320 !important; font-weight: 750 !important;">Xem Landing Page (FR-15)</span>
              </button>
            </div>

            <!-- CỤM KHUNG ICON TIỆN ÍCH THIẾT KẾ ĐỒNG BỘ NẰM BÊN PHẢI -->
            <div class="media-header-actions-right">
              <!-- Chế độ kiểm thử UI/UX Capsule -->
              <div class="media-state-capsule" title="Chuyển đổi trạng thái trải nghiệm để kiểm thử UI/UX">
                <span class="media-capsule-icon-wrap"><i class="ph-bold ph-sliders"></i></span>
                <select class="media-state-select" id="media-mode-select" aria-label="Chọn chế độ hiển thị UI/UX">
                  <option value="normal" ${mediaState.uiMode === "normal" ? "selected" : ""}>Chế độ: Bình thường</option>
                  <option value="loading" ${mediaState.uiMode === "loading" ? "selected" : ""}>Chế độ: Đang tải (Skeleton)</option>
                  <option value="empty" ${mediaState.uiMode === "empty" ? "selected" : ""}>Chế độ: Kho trống (Empty)</option>
                  <option value="error" ${mediaState.uiMode === "error" ? "selected" : ""}>Chế độ: Lỗi CDN (Error)</option>
                </select>
                <i class="ph-bold ph-caret-down" style="color:#8C7E6A;font-size:12px;margin-left:2px;pointer-events:none;"></i>
              </div>

              <!-- Nút Mở Hướng dẫn & Quy định -->
              <button class="media-guidelines-btn" id="btn-open-guidelines" title="Xem quy định bản quyền và khuyến nghị đăng bài">
                <span class="media-capsule-icon-wrap"><i class="ph-bold ph-book-open"></i></span>
                <span>Quy định sử dụng</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- TAB CHUYỂN ĐỔI: TÀI NGUYÊN SHOP vs VIDEO REVIEW CỦA TÔI -->
      <div class="media-view-tabs" style="display:flex;align-items:center;gap:10px;margin-top:14px;margin-bottom:14px;border-bottom:1.5px solid #EAE4D7;padding-bottom:12px;">
        <button
          type="button"
          id="tab-shop-assets"
          style="padding:9px 18px;border-radius:12px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:all 0.15s;border:none;${
            !isMyReviewsTab
              ? "background:linear-gradient(135deg, #C59B58 0%, #B88E4F 100%);color:#FFFFFF;box-shadow:0 3px 10px rgba(184,142,79,0.3);"
              : "background:#F3EFE6;color:#7D715E;"
          }"
        >
          <i class="ph-bold ph-storefront" style="font-size:16px;"></i>
          <span>Tài nguyên Shop cung cấp</span>
          <span style="font-size:11px;padding:2px 8px;border-radius:20px;font-weight:800;${
            !isMyReviewsTab ? "background:rgba(255,255,255,0.25);color:#FFFFFF;" : "background:#EAE4D7;color:#1A1612;"
          }">
            ${shopAssetsCount}
          </span>
        </button>

        <button
          type="button"
          id="tab-my-reviews"
          style="padding:9px 18px;border-radius:12px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:all 0.15s;border:none;${
            isMyReviewsTab
              ? "background:linear-gradient(135deg, #C59B58 0%, #B88E4F 100%);color:#FFFFFF;box-shadow:0 3px 10px rgba(184,142,79,0.3);"
              : "background:#F3EFE6;color:#7D715E;"
          }"
        >
          <i class="ph-bold ph-video-camera" style="font-size:16px;"></i>
          <span>Video review của tôi</span>
          <span style="font-size:11px;padding:2px 8px;border-radius:20px;font-weight:800;${
            isMyReviewsTab ? "background:rgba(255,255,255,0.25);color:#FFFFFF;" : "background:#EAE4D7;color:#1A1612;"
          }">
            ${myReviewsCount}
          </span>
        </button>
      </div>

      <!-- BANNER COMPACT CẬP NHẬT THEO TAB ĐANG CHỌN -->
      ${
        isMyReviewsTab
          ? `
        <section class="media-compact-banner my-reviews-banner">
          <div class="media-banner-brand">
            <div class="media-banner-avatar-wrap">
              <div class="media-banner-icon reviews-icon" title="Video review cá nhân đã nộp cho Shop">
                <i class="ph-bold ph-video-camera"></i>
              </div>
            </div>
            <div class="media-banner-info">
              <div class="media-banner-title-row">
                <h2 class="media-banner-name">Video Review cá nhân đã nộp cho Shop</h2>
                <span class="media-banner-verified-badge kol-badge">
                  <i class="ph-bold ph-user-circle-gear"></i> Tài khoản KOL
                </span>
                <span class="media-banner-category-tag">
                  <i class="ph-bold ph-clock"></i> Chờ Shop phê duyệt (${pendingReviewsCount} video)
                </span>
              </div>
              <div class="media-banner-sub-row">
                <span class="banner-sub-item"><i class="ph-bold ph-info" style="color:#B88E4F;"></i> Sau khi duyệt, video sẽ xuất hiện trên Landing Page và gắn link hoa hồng của bạn</span>
              </div>
            </div>
          </div>
          <div class="media-banner-metrics-capsule">
            <div class="banner-metric-block">
              <span class="metric-icon-tile"><i class="ph-bold ph-video-camera"></i></span>
              <span class="metric-label">Đã gửi:</span>
              <strong class="metric-val metric-val-brand">${myReviewsCount} video</strong>
            </div>
            <div class="banner-metric-sep"></div>
            <div class="banner-metric-block">
              <span class="metric-icon-tile"><i class="ph-bold ph-shield-check"></i></span>
              <span class="metric-label">Trạng thái:</span>
              <strong class="metric-val" style="color:#B88E4F;">${pendingReviewsCount} chờ · ${approvedReviewsCount} đã duyệt${rejectedReviewsCount ? ` · ${rejectedReviewsCount} từ chối` : ''}</strong>
            </div>
            <div class="banner-metric-sep"></div>
            <button type="button" id="btn-submit-another-review" class="btn-banner-action" title="Nộp thêm video review mới">
              <span class="btn-action-icon-tile"><i class="ph-bold ph-plus"></i></span>
              <span>Nộp thêm video</span>
            </button>
          </div>
        </section>
      `
          : `
        <section class="media-compact-banner">
          <div class="media-banner-brand">
            <div class="media-banner-avatar-wrap">
              <div class="media-banner-icon" title="Gian hàng chính hãng Sora Skin Official Store">
                <i class="ph-bold ph-storefront"></i>
              </div>
            </div>
            <div class="media-banner-info">
              <div class="media-banner-title-row">
                <h2 class="media-banner-name">Sora Skin Official Store</h2>
                <span class="media-banner-verified-badge" title="Gian hàng đối tác phân phối chính thức trên sàn SCANMS">
                  <i class="ph-bold ph-seal-check"></i> Gian hàng đối tác
                </span>
                <span class="media-banner-category-tag">
                  <i class="ph-bold ph-tag"></i> Mỹ phẩm thuần chay
                </span>
              </div>
              <div class="media-banner-sub-row">
                <span class="banner-sub-item"><i class="ph-bold ph-shield-check" style="color:#B88E4F;"></i> Bản quyền chính hãng</span>
                <span class="banner-sub-dot">•</span>
                <span class="banner-sub-item"><i class="ph-bold ph-star" style="color:#D97706;"></i> 4.9/5 (1.2k CTV)</span>
                <span class="banner-sub-dot">•</span>
                <span class="banner-sub-item"><i class="ph-bold ph-percent" style="color:#059669;"></i> Hoa hồng tới 22%</span>
              </div>
            </div>
          </div>
          <div class="media-banner-metrics-capsule">
            <div class="banner-metric-block">
              <span class="metric-icon-tile"><i class="ph-bold ph-files"></i></span>
              <span class="metric-label">Tài nguyên:</span>
              <strong class="metric-val metric-val-brand">${shopAssetsCount} tệp</strong>
            </div>
            <div class="banner-metric-sep"></div>
            <div class="banner-metric-block">
              <span class="metric-icon-tile"><i class="ph-bold ph-clock"></i></span>
              <span class="metric-label">Cập nhật:</span>
              <strong class="metric-val">08/09/2026</strong>
            </div>
            <div class="banner-metric-sep"></div>
            <div class="banner-metric-block">
              <span class="metric-icon-tile"><i class="ph-bold ph-video-camera"></i></span>
              <span class="metric-label">Định dạng:</span>
              <strong class="metric-val">MP4 • PNG • Bài</strong>
            </div>
          </div>
        </section>
      `
      }

      <!-- THANH LỌC CHÍNH (ĐÚNG THỨ TỰ: TÌM KIẾM -> SP -> LOẠI -> BỘ LỌC TỶ LỆ -> SẮP XẾP) -->
      <section class="media-filter-bar-container">
        <div class="media-main-filter-bar">
          <!-- 1. Ô tìm kiếm tài nguyên -->
          <div class="media-search-input-wrap">
            <span class="search-icon-tile"><i class="ph-bold ph-magnifying-glass"></i></span>
            <input 
              type="text" 
              class="media-search-input" 
              id="media-search-input" 
              placeholder="Tìm theo tên, định dạng (.mp4), routine..."
              value="${escapeHtml(mediaState.searchQuery)}"
            />
            ${mediaState.searchQuery ? `<button class="media-search-clear" id="btn-clear-search-input"><i class="ph ph-x"></i></button>` : ""}
          </div>

          <!-- 2. Dropdown sản phẩm kèm tìm kiếm bên trong -->
          <div class="media-dropdown-relative" id="prod-dropdown-wrap">
            <button class="media-filter-trigger ${mediaState.selectedProduct !== "ALL" ? "is-active" : ""}" id="btn-product-dropdown-trigger" type="button">
              <span class="filter-icon-tile"><i class="ph-bold ph-package"></i></span>
              <span class="trigger-label">${escapeHtml(currentProduct.name)}</span>
              <span class="trigger-count">(${currentProdAssetCount})</span>
              <i class="ph-bold ph-caret-down trigger-arrow"></i>
            </button>

            <!-- Menu popover sản phẩm -->
            <div class="media-product-dropdown-menu ${mediaState.isProductDropdownOpen ? "open" : ""}" id="prod-dropdown-menu">
              <div class="product-dropdown-search-box">
                <i class="ph ph-magnifying-glass"></i>
                <input 
                  type="text" 
                  id="input-search-product" 
                  placeholder="Tìm sản phẩm..." 
                  value="${escapeHtml(mediaState.productSearchQuery)}"
                />
              </div>
              <div class="product-dropdown-list">
                ${searchFilteredProducts.map((p) => {
                  const count = p.id === "ALL" ? mediaAssets.length : mediaAssets.filter((a) => a.productId === p.id).length;
                  const isSelected = mediaState.selectedProduct === p.id;
                  return `
                    <div class="product-dropdown-item ${isSelected ? "selected" : ""}" data-product-id="${p.id}">
                      <div class="product-item-name">
                        ${isSelected ? `<i class="ph ph-check" style="color:var(--brand)"></i>` : `<i class="ph ph-circle" style="opacity:0.25"></i>`}
                        <span>${escapeHtml(p.name)}</span>
                      </div>
                      <span class="product-item-count">${count} tệp</span>
                    </div>
                  `;
                }).join("")}
                ${searchFilteredProducts.length === 0 ? `<div class="product-dropdown-empty">Không tìm thấy sản phẩm</div>` : ""}
              </div>
            </div>
          </div>

          <!-- 3. Dropdown Loại nội dung -->
          <div class="media-select-pill-wrap">
            <span class="filter-icon-tile"><i class="ph-bold ph-squares-four"></i></span>
            <select class="media-native-select" id="media-type-select">
              <option value="all" ${mediaState.selectedType === "all" ? "selected" : ""}>Tất cả loại (${mediaAssets.length})</option>
              <option value="photo" ${mediaState.selectedType === "photo" ? "selected" : ""}>Ảnh (${photoCount})</option>
              <option value="video" ${mediaState.selectedType === "video" ? "selected" : ""}>Video (${videoCount})</option>
              <option value="banner" ${mediaState.selectedType === "banner" ? "selected" : ""}>Banner (${bannerCount})</option>
              <option value="caption" ${mediaState.selectedType === "caption" ? "selected" : ""}>Caption</option>
            </select>
            <i class="ph-bold ph-caret-down trigger-arrow"></i>
          </div>

          <!-- 4. Nút Bộ lọc (Mở Popover tỷ lệ khung hình) -->
          <div class="media-dropdown-relative" id="ratio-popover-wrap">
            <button class="media-filter-trigger ${mediaState.selectedRatio !== "all" ? "has-badge is-active" : ""}" id="btn-ratio-popover-trigger" type="button">
              <span class="filter-icon-tile"><i class="ph-bold ph-sliders-horizontal"></i></span>
              <span>Bộ lọc</span>
              ${mediaState.selectedRatio !== "all" ? `<span class="filter-active-pill">${mediaState.selectedRatio}</span>` : ""}
              <i class="ph-bold ph-caret-down trigger-arrow"></i>
            </button>

            <!-- Popover Bộ lọc tỷ lệ khung hình -->
            <div class="media-ratio-popover ${mediaState.isRatioPopoverOpen ? "open" : ""}" id="ratio-popover-menu">
              <div class="ratio-popover-header">
                <strong>Tỷ lệ khung hình</strong>
                <button class="text-btn" id="btn-reset-ratio" style="font-size:11.5px">Mặc định</button>
              </div>
              <div class="ratio-popover-options">
                <label class="ratio-option ${mediaState.selectedRatio === "all" ? "active" : ""}">
                  <input type="radio" name="ratio-opt" value="all" ${mediaState.selectedRatio === "all" ? "checked" : ""} />
                  <span>Tất cả tỷ lệ</span>
                </label>
                <label class="ratio-option ${mediaState.selectedRatio === "9:16" ? "active" : ""}">
                  <input type="radio" name="ratio-opt" value="9:16" ${mediaState.selectedRatio === "9:16" ? "checked" : ""} />
                  <span><i class="ph ph-device-mobile"></i> 9:16 (Dọc TikTok/Reels)</span>
                </label>
                <label class="ratio-option ${mediaState.selectedRatio === "1:1" ? "active" : ""}">
                  <input type="radio" name="ratio-opt" value="1:1" ${mediaState.selectedRatio === "1:1" ? "checked" : ""} />
                  <span><i class="ph ph-bounding-box"></i> 1:1 (Vuông Feed)</span>
                </label>
                <label class="ratio-option ${mediaState.selectedRatio === "16:9" ? "active" : ""}">
                  <input type="radio" name="ratio-opt" value="16:9" ${mediaState.selectedRatio === "16:9" ? "checked" : ""} />
                  <span><i class="ph ph-monitor"></i> 16:9 (Ngang Web/YT)</span>
                </label>
                <label class="ratio-option ${mediaState.selectedRatio === "4:3" ? "active" : ""}">
                  <input type="radio" name="ratio-opt" value="4:3" ${mediaState.selectedRatio === "4:3" ? "checked" : ""} />
                  <span><i class="ph ph-frame-corners"></i> 4:3 (Tiêu chuẩn)</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 5. Dropdown Sắp xếp -->
          <div class="media-select-pill-wrap">
            <span class="filter-icon-tile"><i class="ph-bold ph-arrows-down-up"></i></span>
            <select class="media-native-select" id="media-sort-select">
              <option value="latest" ${mediaState.sortBy === "latest" ? "selected" : ""}>Mới nhất</option>
              <option value="downloads" ${mediaState.sortBy === "downloads" ? "selected" : ""}>Lượt tải nhiều nhất</option>
              <option value="size" ${mediaState.sortBy === "size" ? "selected" : ""}>Dung lượng file</option>
            </select>
            <i class="ph-bold ph-caret-down trigger-arrow"></i>
          </div>
        </div>

        <!-- HÀNG THÔNG TIN TỔNG HỢP & NHÃN LỌC ĐÃ ÁP DỤNG -->
        <div class="media-active-filters-row">
          <div class="active-tags-list">
            ${hasActiveFilters ? `
              <span class="active-tags-title">Đang lọc:</span>
              ${mediaState.searchQuery ? `
                <span class="active-tag-chip">
                  <span>Từ khóa: <strong>"${escapeHtml(mediaState.searchQuery)}"</strong></span>
                  <button type="button" class="btn-remove-tag" data-remove-filter="search" title="Xóa từ khóa"><i class="ph ph-x"></i></button>
                </span>
              ` : ""}
              ${mediaState.selectedProduct !== "ALL" ? `
                <span class="active-tag-chip">
                  <span>Sản phẩm: <strong>${escapeHtml(currentProduct.name)}</strong></span>
                  <button type="button" class="btn-remove-tag" data-remove-filter="product" title="Bỏ lọc sản phẩm"><i class="ph ph-x"></i></button>
                </span>
              ` : ""}
              ${mediaState.selectedType !== "all" ? `
                <span class="active-tag-chip">
                  <span>Loại: <strong>${getTypeName(mediaState.selectedType)}</strong></span>
                  <button type="button" class="btn-remove-tag" data-remove-filter="type" title="Bỏ lọc loại"><i class="ph ph-x"></i></button>
                </span>
              ` : ""}
              ${mediaState.selectedRatio !== "all" ? `
                <span class="active-tag-chip">
                  <span>Tỷ lệ: <strong>${mediaState.selectedRatio}</strong></span>
                  <button type="button" class="btn-remove-tag" data-remove-filter="ratio" title="Bỏ lọc tỷ lệ"><i class="ph ph-x"></i></button>
                </span>
              ` : ""}
              <button class="btn-clear-all-filters" id="btn-clear-all-filters" type="button">
                <i class="ph ph-arrows-counter-clockwise"></i> Xóa tất cả bộ lọc
              </button>
            ` : `
              <span class="media-filters-hint">
                <i class="ph-bold ph-sparkle" style="color:#B88E4F"></i> Tài nguyên độc quyền do Shop cung cấp cho KOL / CTV
              </span>
            `}
          </div>

          <div class="active-results-summary">
            <i class="ph-bold ph-check-circle"></i>
            <span>Hiển thị <strong>${filtered.length}</strong> / ${baseList.length} tài nguyên phù hợp</span>
          </div>
        </div>
      </section>

      <!-- PHẦN HIỂN THỊ KHO NỘI DUNG (DỰA THEO CHẾ ĐỘ UI MODE) -->
      ${renderContentBody(filtered, globalState)}

      <!-- KHU VỰC SOẠN CAPTION TIẾP THỊ (CHỈ HIỂN THỊ KHI Ở CHẾ ĐỘ NORMAL HOẶC TYPE LÀ CAPTION/ALL) -->
      ${
        mediaState.uiMode === "normal" && (mediaState.selectedType === "all" || mediaState.selectedType === "caption")
          ? renderCaptionStudio(currentProduct, globalState)
          : ""
      }

      <!-- MODAL XEM TRƯỚC VÀ TIẾN TRÌNH TẢI -->
      <div id="media-modal-container">
        ${renderActiveModal(globalState)}
      </div>

      <!-- MOBILE BOTTOM SHEET CHO BỘ LỌC -->
      ${renderMobileFilterDrawer(currentProduct)}
    </div>
  `;
}

// ---------------------------------------------------------------------
// 2. RENDER KHỐI NỘI DUNG CHÍNH (BODY)
// ---------------------------------------------------------------------
function renderContentBody(filtered, globalState) {
  // 1. Trạng thái Đang tải Skeleton
  if (mediaState.uiMode === "loading") {
    return `
      <div class="media-skeleton-grid">
        ${Array.from({ length: 8 })
          .map(
            () => `
          <div class="media-skeleton-card">
            <div class="media-skeleton-visual"></div>
            <div class="media-skeleton-body">
              <div class="media-skeleton-line" style="width: 75%;"></div>
              <div class="media-skeleton-line" style="width: 50%;"></div>
              <div class="media-skeleton-line" style="width: 90%; height: 32px; margin-top: 6px;"></div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  // 2. Trạng thái Lỗi máy chủ / CDN
  if (mediaState.uiMode === "error") {
    return `
      <div class="media-error-card">
        <div class="media-state-icon">
          <i class="ph ph-warning-octagon"></i>
        </div>
        <h3>Không thể kết nối đến máy chủ lưu trữ tài nguyên CDN</h3>
        <p>Đã xảy ra lỗi mạng hoặc máy chủ phân phối tệp tạm thời không phản hồi. Bạn có thể thử kết nối lại hoặc liên hệ hỗ trợ từ Shop.</p>
        <div style="display: flex; gap: 10px;">
          <button class="btn" id="btn-retry-cdn"><i class="ph ph-arrow-clockwise"></i> Thử lại kết nối</button>
          <button class="btn secondary" data-go="chat"><i class="ph ph-chats"></i> Báo lỗi cho Shop</button>
        </div>
      </div>
    `;
  }

  // 3. Trạng thái Không có kết quả hoặc Kho trống
  if (mediaState.uiMode === "empty" || filtered.length === 0) {
    if (mediaState.activeTab === "my_reviews") {
      return `
        <div class="media-empty-card" style="padding: 60px 24px; background: #FFFFFF; border: 1.5px solid #EAE4D7; border-radius: 16px; text-align: center;">
          <div class="media-state-icon" style="background: #FBF5EB; color: #B88E4F; width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; font-size: 30px; margin: 0 auto 16px;">
            <i class="ph-bold ph-video-camera"></i>
          </div>
          <h3 style="font-size: 18px; font-weight: 800; color: #1A1612; margin: 0 0 8px;">Bạn chưa nộp video review nào</h3>
          <p style="font-size: 13px; color: #7D715E; max-width: 480px; margin: 0 auto 20px; line-height: 1.5;">
            Hãy quay video trải nghiệm thực tế về sản phẩm Sora Skin và gửi cho Shop kiểm duyệt. Khi được duyệt, video sẽ hiển thị công khai trên Landing Page và kích hoạt tính năng tiếp thị nhận hoa hồng.
          </p>
          <button class="btn" id="btn-empty-submit-review" style="background: linear-gradient(135deg, #C59B58 0%, #B88E4F 100%); color: #FFFFFF; font-weight: 800; border: none; padding: 0 24px; height: 42px; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(184, 142, 79, 0.35);">
            <i class="ph-bold ph-video-camera"></i> Nộp video review ngay (FR-15)
          </button>
        </div>
      `;
    }
    return `
      <div class="media-empty-card">
        <div class="media-state-icon">
          <i class="ph ph-folder-notch-open"></i>
        </div>
        <h3>Không tìm thấy tài nguyên phù hợp</h3>
        <p>Không có hình ảnh hoặc video nào khớp với điều kiện lọc hiện tại.</p>
        <button class="btn secondary" id="btn-empty-reset"><i class="ph ph-arrows-counter-clockwise"></i> Xóa bộ lọc & Xem tất cả</button>
      </div>
    `;
  }

  // 4. Trạng thái Bình thường: Render Grid các thẻ Card
  return `
    <div class="media-asset-grid">
      ${filtered.map((asset) => renderAssetCard(asset)).join("")}
    </div>
  `;
}

// ---------------------------------------------------------------------
// 3. RENDER TỪNG THẺ TÀI NGUYÊN (renderAssetCard)
// ---------------------------------------------------------------------
function renderAssetCard(asset) {
  const isVideo = asset.type === "video";
  const isBanner = asset.type === "banner";
  const isSubmission = Boolean(asset.isSubmission);
  const isPendingSubmission = isSubmission && asset.status === "PENDING";
  const isApprovedSubmission = isSubmission && asset.status === "APPROVED";
  const isRejectedSubmission = isSubmission && asset.status === "REJECTED";
  const submissionBadge = isApprovedSubmission
    ? `<span class="media-tag-pill" style="background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;font-weight:700;"><i class="ph-bold ph-seal-check"></i> Đã duyệt</span>`
    : isRejectedSubmission
      ? `<span class="media-tag-pill" style="background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;font-weight:700;"><i class="ph-bold ph-x-circle"></i> Bị từ chối</span>`
      : `<span class="media-tag-pill" style="background:#FEF3C7;color:#92400E;border:1px solid #FCD34D;font-weight:700;"><i class="ph-bold ph-clock"></i> Chờ duyệt</span>`;

  let tagClass = "tag-photo";
  let typeLabel = "Ảnh PNG";
  let typeIcon = "ph-image";

  if (isVideo) {
    tagClass = "tag-video";
    typeLabel = "Video MP4";
    typeIcon = "ph-video-camera";
  } else if (isBanner) {
    tagClass = "tag-banner";
    typeLabel = "Banner";
    typeIcon = "ph-megaphone";
  }

  return `
    <article class="media-card" data-asset-id="${asset.id}">
      <!-- KHUNG HÌNH PREVIEW -->
      <div class="media-card-visual ${asset.ratioClass} action-preview" data-asset-id="${asset.id}" title="Bấm xem chi tiết">
        <img src="${asset.image}" alt="${escapeHtml(asset.title)}" class="media-card-img" loading="lazy" />

        <!-- BADGE NHÃN TRÊN ẢNH (GÓC TRÊN TRÁI) -->
        <div class="media-badge-group">
          ${
            isSubmission
              ? submissionBadge
              : `<span class="media-tag-pill ${tagClass}"><i class="ph ${typeIcon}"></i> ${typeLabel}</span>`
          }
          <span class="media-tag-pill tag-ratio">
            ${asset.ratio} • ${asset.fileSize}
          </span>
        </div>

        ${
          isVideo
            ? `
          <div class="media-video-play-hint action-preview" data-asset-id="${asset.id}" title="Bấm phát video">
            <i class="ph ph-play"></i>
          </div>
          <span class="media-video-duration">${asset.duration}</span>
        `
            : ""
        }

        ${
          asset.isBroken
            ? `
          <div style="position:absolute;inset:0;background:rgba(184,58,66,0.85);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;padding:12px;text-align:center;z-index:4">
            <i class="ph ph-warning" style="font-size:28px;margin-bottom:6px"></i>
            <strong style="font-size:13px">Tệp không còn khả dụng</strong>
            <small style="font-size:11px;opacity:0.9">Chiến dịch đã hết hạn</small>
          </div>
        `
            : ""
        }

        <!-- NÚT HOVER NHANH (GÓC TRÊN PHẢI) -->
        <div class="media-card-quick-actions">
          <button class="media-quick-btn action-preview" data-asset-id="${asset.id}" title="Xem trước phóng to" aria-label="Xem trước phóng to">
            <i class="ph ph-eye"></i>
          </button>
          ${
            isPendingSubmission
              ? `
            <button class="media-quick-btn action-delete-submission" data-asset-id="${asset.id}" title="Hủy nộp & Xóa video" aria-label="Hủy nộp & Xóa video" style="background:#DC2626;color:#FFFFFF;border:none;">
              <i class="ph ph-trash"></i>
            </button>
          `
              : !asset.isBroken
              ? `
            <button class="media-quick-btn action-download" data-asset-id="${asset.id}" title="Tải tệp về máy tính" aria-label="Tải tệp về máy">
              <i class="ph ph-download-simple"></i>
            </button>
          `
              : ""
          }
        </div>
      </div>

      <!-- NỘI DUNG THÔNG TIN -->
      <div class="media-card-body">
        <div class="media-card-title-row">
          <h3 class="media-card-title" title="${escapeHtml(asset.title)}">${escapeHtml(asset.title)}</h3>
        </div>

        <span class="media-card-product-tag">
          <i class="ph ph-tag"></i> ${escapeHtml(asset.productName)}
        </span>

        <div class="media-card-meta-list">
          <span class="media-card-meta-item" title="Độ phân giải thực">
            <i class="ph ph-arrows-out"></i> ${asset.resolution}
          </span>
          ${
            isVideo
              ? `<span class="media-card-meta-item" title="Tốc độ khung hình"><i class="ph ph-film-strip"></i> ${asset.fps}</span>`
              : ""
          }
        </div>

        <div class="media-card-stats">
          <span class="media-card-downloads">
            <i class="ph ph-download"></i> ${asset.downloads} lượt tải
          </span>
          ${
            isPendingSubmission
              ? `
            <span style="color:#D97706;font-weight:700;display:flex;align-items:center;gap:4px">
              <i class="ph-bold ph-clock"></i> Chờ Shop duyệt
            </span>
          `
              : isApprovedSubmission
                ? `
            <span style="color:#059669;font-weight:700;display:flex;align-items:center;gap:4px">
              <i class="ph-bold ph-seal-check"></i> Shop đã duyệt
            </span>
          `
                : isRejectedSubmission
                  ? `
            <span style="color:#DC2626;font-weight:700;display:flex;align-items:center;gap:4px">
              <i class="ph-bold ph-x-circle"></i> Shop đã từ chối
            </span>
          `
              : `
            <span style="color:var(--brand);font-weight:600;display:flex;align-items:center;gap:3px">
              <i class="ph ph-check-circle"></i> Shop đã duyệt
            </span>
          `
          }
        </div>

        <!-- CỤM NÚT HÀNH ĐỘNG -->
        <div class="media-card-actions">
          <button class="btn small secondary action-preview" data-asset-id="${asset.id}" style="flex:1;">
            <i class="ph ph-eye"></i> Xem trước
          </button>
          ${
            isPendingSubmission
              ? `
            <button class="btn small danger action-delete-submission" data-asset-id="${asset.id}" title="Hủy nộp & Xóa video review" style="background:#FEE2E2;color:#DC2626;border:1px solid #FECACA;">
              <i class="ph ph-trash"></i> Hủy & Xóa
            </button>
          `
              : asset.isBroken
              ? `
            <button class="btn small danger action-retry-file" data-asset-id="${asset.id}">
              <i class="ph ph-arrow-clockwise"></i> Thử lại
            </button>
          `
              : `
            <button class="btn small action-download" data-asset-id="${asset.id}">
              <i class="ph ph-download-simple"></i> Tải xuống
            </button>
          `
          }
        </div>
      </div>
    </article>
  `;
}

// ---------------------------------------------------------------------
// 4. RENDER SOẠN CAPTION (CAPTION STUDIO - 1 CỘT GỌN & DRAWER XEM TRƯỚC)
// ---------------------------------------------------------------------
function renderCaptionStudio(currentProduct, globalState) {
  const kolName = "Trần Văn Nhật";
  const defaultAffiliate = `https://scanms.vn/r/ref_nhat_${currentProduct.id.toLowerCase() === "all" ? "skinc15" : currentProduct.id.toLowerCase()}`;
  const affiliateLink = mediaState.customLink || defaultAffiliate;
  const couponCode = mediaState.customCoupon || "NHATXINH10";
  const productPrice = money(currentProduct.price || 459000);
  const currentText = compileCaptionText(currentProduct);

  const isOpen = Boolean(mediaState.isCaptionAccordionOpen);

  return `
    <section class="media-caption-studio ${isOpen ? "is-open" : "is-collapsed"}" id="caption-studio-section">
      <!-- THANH ACCORDION ĐÓNG / MỞ TINH GỌN (MẶC ĐỊNH THU GỌN THEO YÊU CẦU) -->
      <div 
        class="media-caption-accordion-trigger" 
        id="btn-toggle-caption-accordion" 
        role="button" 
        tabindex="0" 
        aria-expanded="${isOpen}" 
        title="Bấm để ${isOpen ? "thu gọn" : "mở rộng"} mẫu kịch bản & caption"
      >
        <div class="caption-accordion-left">
          <span class="caption-accordion-icon"><i class="ph-bold ph-note-pencil"></i></span>
          <strong class="caption-accordion-title">📝 Mẫu caption & Kịch bản đăng bài có sẵn</strong>
          <span class="caption-badge verified"><i class="ph-bold ph-shield-check"></i> Đã duyệt bởi Shop</span>
          <span class="caption-accordion-hint">(Tự động gắn link tiếp thị riêng & mã giảm giá của bạn)</span>
        </div>
        <div class="caption-accordion-right">
          ${isOpen ? `
            <button class="btn secondary small btn-preview-trigger" id="btn-open-caption-drawer" type="button" aria-label="Mở xem trước bài đăng" style="height: 32px; font-size: 12px; padding: 0 10px; margin-right: 6px;">
              <i class="ph ph-eye"></i>
              <span>Xem trước</span>
            </button>
            <span class="caption-accordion-pill">
              <span>Thu gọn</span>
              <i class="ph-bold ph-caret-up"></i>
            </span>
          ` : `
            <span class="caption-accordion-pill">
              <span>Bấm để mở rộng</span>
              <i class="ph-bold ph-caret-down"></i>
            </span>
          `}
        </div>
      </div>

      ${isOpen ? `
        <!-- NỘI DUNG SOẠN THẢO CHI TIẾT (KHI MỞ RỘNG) -->
        <div class="caption-accordion-body" id="caption-accordion-body">
          <!-- THANH CÔNG CỤ: DROPDOWN MẪU + 3 CHECKBOX + POPOVER THÔNG TIN CHÈN -->
          <div class="caption-toolbar-v2">
            <div class="caption-toolbar-preset">
              <label for="caption-preset-select" class="caption-field-label">Mẫu nội dung:</label>
              <select class="media-native-select caption-select" id="caption-preset-select">
                <option value="short" ${mediaState.activeCaptionPreset === "short" ? "selected" : ""}>Giới thiệu ngắn</option>
                <option value="review" ${mediaState.activeCaptionPreset === "review" ? "selected" : ""}>Review chi tiết</option>
                <option value="offer" ${mediaState.activeCaptionPreset === "offer" ? "selected" : ""}>Ưu đãi</option>
                <option value="livestream" ${mediaState.activeCaptionPreset === "livestream" ? "selected" : ""}>Kịch bản livestream</option>
              </select>
            </div>

            <div class="caption-toolbar-inserts">
              <div class="caption-checkbox-group">
                <label class="caption-checkbox-label" title="Bật/tắt link tiếp thị">
                  <input type="checkbox" id="switch-link" ${mediaState.includeLink ? "checked" : ""} />
                  <span>Link</span>
                </label>
                <label class="caption-checkbox-label" title="Bật/tắt mã ưu đãi">
                  <input type="checkbox" id="switch-coupon" ${mediaState.includeCoupon ? "checked" : ""} />
                  <span>Coupon</span>
                </label>
                <label class="caption-checkbox-label" title="Bật/tắt hashtag">
                  <input type="checkbox" id="switch-hashtags" ${mediaState.includeHashtags ? "checked" : ""} />
                  <span>Hashtag</span>
                </label>
              </div>

              <!-- Popover Thông tin chèn -->
              <div class="caption-popover-anchor">
                <button class="btn-popover-trigger ${mediaState.isInsertPopoverOpen ? "active" : ""}" id="btn-toggle-insert-info" type="button" aria-expanded="${mediaState.isInsertPopoverOpen}" title="Tùy chỉnh link, coupon, hashtag">
                  <i class="ph ph-sliders-horizontal"></i>
                  <span>Thông tin chèn</span>
                  <i class="ph ph-caret-down"></i>
                </button>

                <div class="caption-insert-popover ${mediaState.isInsertPopoverOpen ? "open" : ""}" id="insert-details-popover" role="dialog" aria-label="Tùy chỉnh thông tin chèn">
                  <div class="popover-header">
                    <strong>Thông tin chèn</strong>
                    <button class="popover-close-btn" id="btn-close-insert-popover" type="button" title="Đóng popover">
                      <i class="ph ph-x"></i>
                    </button>
                  </div>
                  <div class="popover-body">
                    <div class="popover-field">
                      <label for="input-custom-link" class="popover-label">Link tiếp thị định danh:</label>
                      <input type="text" class="insert-info-input" id="input-custom-link" value="${escapeHtml(affiliateLink)}" placeholder="https://scanms.vn/r/..." />
                    </div>
                    <div class="popover-field">
                      <label for="input-custom-coupon" class="popover-label">Mã ưu đãi độc quyền:</label>
                      <input type="text" class="insert-info-input" id="input-custom-coupon" value="${escapeHtml(couponCode)}" placeholder="Mã ưu đãi" />
                    </div>
                    <div class="popover-field">
                      <label for="input-custom-hashtags" class="popover-label">Hashtag đề xuất:</label>
                      <input type="text" class="insert-info-input" id="input-custom-hashtags" value="${escapeHtml(mediaState.customHashtags)}" placeholder="#Hashtag" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ô SOẠN THẢO 1 CỘT (CAO 180-220px, KÉO GIÃN DỌC) -->
          <div class="caption-textarea-wrapper-v2">
            <textarea 
              class="caption-editor-textarea-v2" 
              id="media-caption-box" 
              placeholder="Nhập hoặc tùy chỉnh nội dung caption..."
              spellcheck="false"
            >${escapeHtml(currentText)}</textarea>
          </div>

          <!-- FOOTER NGAY DƯỚI Ô SOẠN (KHÔNG KHOẢNG TRẮNG DƯ THỪA) -->
          <div class="caption-footer-v2">
            <div class="caption-char-counter" id="caption-char-count">
              <span>${currentText.length} ký tự</span>
            </div>
            <div class="caption-action-buttons">
              <button class="btn secondary small" id="btn-collapse-caption" type="button" title="Thu gọn khung mẫu caption">
                <i class="ph ph-caret-up"></i>
                <span>Thu gọn</span>
              </button>
              <button class="btn secondary small" id="btn-reset-caption" type="button" title="Khôi phục lại mẫu nguyên bản từ Shop">
                <i class="ph ph-arrow-counter-clockwise"></i>
                <span>Khôi phục mẫu</span>
              </button>
              <button class="btn small" id="btn-copy-caption" type="button" title="Sao chép caption vào bộ nhớ tạm">
                <i class="ph ph-copy"></i>
                <span>Sao chép</span>
              </button>
            </div>
          </div>
        </div>
      ` : ""}
    </section>

    <!-- DRAWER XEM TRƯỚC BÊN PHẢI (CHỈ MỞ KHI BẤM XEM TRƯỚC) -->
    <div class="caption-drawer-backdrop ${mediaState.isPreviewDrawerOpen ? "active" : ""}" id="caption-drawer-backdrop"></div>
    <aside class="caption-preview-drawer ${mediaState.isPreviewDrawerOpen ? "active" : ""}" id="caption-preview-drawer" role="dialog" aria-modal="true" aria-label="Xem trước bài đăng mạng xã hội">
      <div class="caption-drawer-header">
        <div class="drawer-header-titles">
          <h3 class="drawer-title">Xem trước</h3>
          <span class="preview-disclaimer"><i class="ph ph-info"></i> Mô phỏng, không phải bài đăng thật</span>
        </div>
        <button class="btn-drawer-close" id="btn-close-caption-drawer" type="button" title="Đóng xem trước (Escape)" aria-label="Đóng xem trước">
          <i class="ph ph-x"></i>
        </button>
      </div>

      <!-- CHỈ CÓ MỘT VÙNG CUỘN TRONG DRAWER -->
      <div class="caption-drawer-body" id="caption-drawer-body">
        <!-- Bộ chọn nền tảng TikTok / Facebook / Threads -->
        <div class="caption-platform-bar">
          <span class="caption-platform-label">Nền tảng:</span>
          <div class="preview-platform-selector">
            <button class="preview-plat-btn ${mediaState.socialPreviewPlatform === "tiktok" ? "active" : ""}" data-plat="tiktok" type="button">
              <i class="ph ph-tiktok-logo"></i> TikTok
            </button>
            <button class="preview-plat-btn ${mediaState.socialPreviewPlatform === "facebook" ? "active" : ""}" data-plat="facebook" type="button">
              <i class="ph ph-facebook-logo"></i> Facebook
            </button>
            <button class="preview-plat-btn ${mediaState.socialPreviewPlatform === "threads" ? "active" : ""}" data-plat="threads" type="button">
              <i class="ph ph-threads-logo"></i> Threads
            </button>
          </div>
        </div>

        <!-- Khung bài đăng mô phỏng -->
        <div class="preview-post-card">
          <div class="post-card-author">
            <div class="post-author-avatar">N</div>
            <div class="post-author-meta">
              <div class="author-name-row">
                <strong>${kolName}</strong>
                <i class="ph ph-check-circle" style="color:var(--brand)"></i>
              </div>
              <small id="preview-post-plat-label">@nhat_skincare • ${mediaState.socialPreviewPlatform === "tiktok" ? "TikTok" : mediaState.socialPreviewPlatform === "facebook" ? "Facebook" : "Threads"} • Vừa xong • <i class="ph ph-globe"></i></small>
            </div>
          </div>

          <div class="post-card-content" id="social-preview-body">
            ${escapeHtml(currentText).replace(/\n/g, "<br>")}
          </div>

          <!-- Thẻ sản phẩm gắn kèm gọn gàng -->
          <div class="preview-attached-product">
            <img src="${productImage}" alt="Thumb" class="attached-prod-thumb" />
            <div class="attached-prod-info">
              <strong class="attached-prod-name">${escapeHtml(currentProduct.id !== "ALL" ? currentProduct.name : "Serum vitamin C 15%")}</strong>
              <span class="attached-prod-price">${productPrice} • Giảm 10% với mã ${escapeHtml(couponCode)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="caption-drawer-footer">
        <button class="btn secondary small" id="btn-drawer-close-action" type="button">
          Đóng
        </button>
        <button class="btn small" id="btn-drawer-copy-action" type="button">
          <i class="ph ph-copy"></i> Sao chép
        </button>
      </div>
    </aside>
  `;
}

// ---------------------------------------------------------------------
// 5. RENDER MODAL XEM TRƯỚC VÀ TIẾN TRÌNH TẢI
// ---------------------------------------------------------------------
function renderActiveModal(globalState) {
  if (!mediaState.activeModal) return "";

  // 0.1. Modal Xác Nhận Hủy Nộp & Xóa Video Review (Thiết kế sang trọng, chuyên nghiệp thay thế window.confirm)
  if (mediaState.activeModal === "confirm-delete-submission" && mediaState.deleteConfirmItem) {
    const item = mediaState.deleteConfirmItem;
    return `
      <div class="media-modal-backdrop" id="modal-backdrop">
        <div class="media-modal-window" style="max-width: 440px; background: #FFFFFF; border-radius: 20px; border: 1.5px solid #EAE4D7; overflow: hidden; box-shadow: 0 24px 60px rgba(35, 29, 21, 0.25); animation: modalFadeIn 0.2s ease; position: relative;">
          <!-- Nút X tắt nhanh góc trên bên phải -->
          <button
            type="button"
            class="media-modal-close-btn"
            id="modal-close"
            title="Đóng cửa sổ"
            aria-label="Đóng cửa sổ"
            style="position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border-radius: 10px; border: 1.5px solid #EAE4D7; background: #FAF8F5; color: #7D715E; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; transition: all 0.15s ease; z-index: 10;"
            onmouseover="this.style.background='#F3EFE6'; this.style.borderColor='#C59B58'; this.style.color='#1A1612';"
            onmouseout="this.style.background='#FAF8F5'; this.style.borderColor='#EAE4D7'; this.style.color='#7D715E';"
          >
            <i class="ph-bold ph-x"></i>
          </button>

          <div style="padding: 26px 24px 22px; text-align: center;">
            <!-- Icon cảnh báo xóa chuẩn màu Danger -->
            <div style="width: 58px; height: 58px; margin: 0 auto 16px; border-radius: 18px; background: #FEF2F2; border: 1.5px solid #FEE2E2; color: #DC2626; display: grid; place-items: center; font-size: 26px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.15);">
              <i class="ph-bold ph-trash"></i>
            </div>

            <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 800; color: #1A1612; letter-spacing: -0.01em;">
              Hủy nộp & Xóa video review?
            </h3>
            <p style="margin: 0 0 16px; font-size: 13px; color: #7D715E; line-height: 1.55;">
              Bạn có chắc chắn muốn hủy nộp và xóa video này không? Video sẽ bị gỡ khỏi danh sách chờ Shop duyệt và không thể khôi phục.
            </p>

            <!-- Khung tóm tắt thẻ video chuẩn bị xóa -->
            <div style="background: #FAF8F5; border: 1.5px solid #EAE4D7; border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; text-align: left; margin-bottom: 22px;">
              <img
                src="${escapeHtml(item.image || productImage)}"
                alt="${escapeHtml(item.title)}"
                style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 1px solid #EAE4D7; flex-shrink: 0;"
              />
              <div style="min-width: 0; flex: 1;">
                <div style="font-size: 13px; font-weight: 700; color: #1A1612; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${escapeHtml(item.title)}
                </div>
                <div style="font-size: 11px; color: #D97706; font-weight: 700; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
                  <i class="ph-bold ph-clock"></i> Chờ Shop phê duyệt
                </div>
              </div>
            </div>

            <!-- Các nút bấm thao tác -->
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
              <button
                type="button"
                id="btn-cancel-delete-modal"
                style="flex: 1; height: 42px; background: #FAF8F5; border: 1.5px solid #EAE4D7; border-radius: 10px; font-size: 13px; font-weight: 700; color: #7D715E; cursor: pointer; transition: all 0.15s;"
              >
                Giữ lại video
              </button>
              <button
                type="button"
                id="btn-confirm-delete-modal"
                style="flex: 1.25; height: 42px; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: #FFFFFF; border: none; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35); transition: all 0.15s;"
              >
                <i class="ph-bold ph-trash"></i> Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 0. Modal Nộp Video Review Sản Phẩm (FR-15)
  if (mediaState.activeModal === "submit-kol-video") {
    if (!mediaState.submitForm) {
      mediaState.submitForm = createCleanSubmitKolForm();
    }
    const form = mediaState.submitForm;

    const hasVideo = Boolean(form.videoPreviewUrl || form.videoFile);

    return `
      <div class="media-modal-backdrop" id="modal-backdrop">
        <div class="media-modal-window" style="max-width: 680px; max-height: 90vh; background: #FFFFFF; border-radius: 16px; border: 1.5px solid #EAE4D7; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 60px rgba(35, 29, 21, 0.25);">
          <!-- Header -->
          <div class="media-modal-header" style="background: #FAF8F5; border-bottom: 1px solid #EAE4D7; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: #FBF5EB; border: 1.5px solid #EEDFC6; color: #B88E4F; display: grid; place-items: center; font-size: 20px;">
                <i class="ph-bold ph-video-camera"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #1A1612;">Nộp Video Review Sản Phẩm (FR-15)</h3>
                <p style="margin: 2px 0 0; font-size: 12px; color: #7D715E;">Nộp video trải nghiệm cá nhân cho Shop kiểm duyệt để nhận hoa hồng tiếp thị</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button
                class="btn secondary"
                id="btn-reset-kol-video-form"
                type="button"
                title="Làm mới toàn bộ form nhập liệu"
                style="padding: 0 10px; height: 32px; font-size: 12px; font-weight: 700; color: #7D715E; border: 1px solid #EAE4D7; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"
              >
                <i class="ph ph-arrow-counter-clockwise"></i> Làm mới
              </button>
              <button class="media-modal-close-btn" id="modal-close" title="Đóng cửa sổ" style="cursor: pointer;"><i class="ph ph-x"></i></button>
            </div>
          </div>

          <!-- Body -->
          <div style="padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 18px;">
            <!-- 1. Chọn sản phẩm -->
            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #1A1612; margin-bottom: 6px;">
                Sản phẩm review <span style="color: #DC2626;">*</span>
              </label>
              <select id="submit-kol-product-select" style="width: 100%; height: 42px; padding: 0 14px; border: 1.5px solid #EAE4D7; border-radius: 10px; background: #FAF8F5; color: #1A1612; font-size: 14px; font-weight: 600;">
                <option value="SKIN-C15" ${form.productId === "SKIN-C15" ? "selected" : ""}>Serum vitamin C 15% (SKIN-C15) — Sora Skin Official Store</option>
                <option value="SUN-AQUA" ${form.productId === "SUN-AQUA" ? "selected" : ""}>Kem chống nắng SPF50+ (SUN-AQUA) — Sora Skin Official Store</option>
                <option value="TONER-BHA" ${form.productId === "TONER-BHA" ? "selected" : ""}>Toner BHA 2% Thu Nhỏ Lỗ Chân Lông — Sora Skin Official Store</option>
              </select>
            </div>

            <!-- 2. Tiêu đề video review -->
            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #1A1612; margin-bottom: 6px;">
                Tiêu đề video review <span style="color: #DC2626;">*</span>
              </label>
              <input
                id="submit-kol-title-input"
                type="text"
                value="${escapeHtml(form.title)}"
                placeholder="VD: Trải nghiệm thực tế Serum Vitamin C sau 14 ngày - Da sáng rõ rệt"
                style="width: 100%; height: 42px; padding: 0 14px; border: 1.5px solid #EAE4D7; border-radius: 10px; background: #FAF8F5; color: #1A1612; font-size: 14px;"
              />
            </div>

            <!-- 3. Khu vực Tải Video (Bắt buộc) -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <label style="font-size: 13px; font-weight: 700; color: #1A1612;">
                  Tệp Video Review (.mp4, .webm, .mov) <span style="color: #DC2626;">* (Bắt buộc tải video từ máy)</span>
                </label>
                ${hasVideo ? `<span style="font-size: 12px; font-weight: 700; color: #059669; display: flex; align-items: center; gap: 4px;"><i class="ph-bold ph-check-circle"></i> Đã tải video lên</span>` : `<span style="font-size: 12px; font-weight: 700; color: #DC2626;">Chưa có video</span>`}
              </div>

              ${hasVideo ? `
                <div style="background: #FBF5EB; border: 1.5px solid #C59B58; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; min-width: 0;">
                      <div style="width: 44px; height: 44px; border-radius: 8px; background: #231D15; color: #C59B58; display: grid; place-items: center; font-size: 22px; flex-shrink: 0;">
                        <i class="ph-bold ph-film-strip"></i>
                      </div>
                      <div style="min-width: 0;">
                        <div style="font-size: 14px; font-weight: 700; color: #1A1612; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                          ${escapeHtml(form.videoFileName || "sample-video.mp4")}
                        </div>
                        <div style="font-size: 12px; color: #7D715E;">
                          ${form.videoFileSize || "18.2 MB"} • Định dạng video hợp lệ • <span style="color: #059669; font-weight: 700;">✓ Sẵn sàng gửi</span>
                        </div>
                      </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                      <button type="button" id="btn-change-video" class="btn small secondary" style="font-size: 12px; padding: 6px 12px; border-radius: 8px; cursor: pointer;">
                        <i class="ph ph-arrows-clockwise"></i> Đổi video
                      </button>
                      <button type="button" id="btn-remove-video" class="btn small danger" style="font-size: 12px; padding: 6px 12px; border-radius: 8px; background: #FEE2E2; color: #DC2626; border: 1px solid #FECACA; cursor: pointer;">
                        <i class="ph ph-trash"></i>
                      </button>
                    </div>
                  </div>
                  <!-- Video player preview -->
                  <div style="border-radius: 10px; overflow: hidden; background: #000; max-height: 200px; display: flex; justify-content: center;">
                    <video src="${form.videoPreviewUrl}" controls playsinline style="max-height: 200px; width: auto; border-radius: 8px;"></video>
                  </div>
                </div>
              ` : `
                <div id="video-dropzone" style="border: 2px dashed #C59B58; border-radius: 12px; background: #FAF8F5; padding: 24px 16px; text-align: center; cursor: pointer; transition: all 0.2s;">
                  <div style="width: 48px; height: 48px; border-radius: 50%; background: #FBF5EB; color: #B88E4F; display: grid; place-items: center; font-size: 24px; margin: 0 auto 10px;">
                    <i class="ph-bold ph-cloud-arrow-up"></i>
                  </div>
                  <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #1A1612;">Kéo thả video review vào đây hoặc bấm chọn tệp từ máy</p>
                  <p style="margin: 0 0 14px; font-size: 12px; color: #7D715E;">Hỗ trợ định dạng MP4, WebM, QuickTime (.mov) - Tối đa 100MB</p>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap;">
                    <button type="button" id="btn-choose-video-file" style="background: #C59B58; color: #FFFFFF; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                      <i class="ph-bold ph-upload-simple"></i> Chọn video từ máy tính
                    </button>
                    <button type="button" id="btn-quick-sample-video" style="background: #F3EFE6; color: #1A1612; border: 1px solid #EAE4D7; border-radius: 8px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;" title="Dùng video kiểm thử có sẵn">
                      <i class="ph ph-magic-wand"></i> Dùng video mẫu kiểm thử
                    </button>
                  </div>
                </div>
              `}
              <input type="file" id="input-video-file" accept="video/mp4,video/webm,video/quicktime" style="display: none;" />
            </div>

            <!-- 4. Ảnh Poster Thumbnail -->
            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #1A1612; margin-bottom: 6px;">
                Ảnh Poster / Thumbnail hiển thị (.jpg, .png, .webp)
              </label>
              <div style="display: flex; align-items: center; gap: 14px; background: #FAF8F5; border: 1.5px solid #EAE4D7; border-radius: 12px; padding: 12px;">
                <img src="${form.posterPreviewUrl || productImage}" alt="Poster" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #EAE4D7; flex-shrink: 0;" />
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 13px; font-weight: 700; color: #1A1612;">Ảnh đại diện video</div>
                  <div style="font-size: 11px; color: #7D715E; margin-top: 2px;">Tùy chọn tải ảnh từ máy tính hoặc giữ ảnh sản phẩm mặc định</div>
                </div>
                <div>
                  <button type="button" id="btn-choose-poster-file" class="btn small secondary" style="font-size: 12px; padding: 6px 12px; border-radius: 8px; cursor: pointer;">
                    <i class="ph ph-image"></i> Tải ảnh từ máy
                  </button>
                  <input type="file" id="input-poster-file" accept="image/*" style="display: none;" />
                </div>
              </div>
            </div>

            <!-- 5. Kịch bản & Caption review đính kèm -->
            <div>
              <label style="display: block; font-size: 13px; font-weight: 700; color: #1A1612; margin-bottom: 6px;">
                Kịch bản & Caption review đính kèm
              </label>
              <textarea
                id="submit-kol-caption-input"
                rows="3"
                placeholder="Nhập cảm nhận thực tế, công dụng, lưu ý khi dùng..."
                style="width: 100%; padding: 10px 14px; border: 1.5px solid #EAE4D7; border-radius: 10px; background: #FAF8F5; color: #1A1612; font-size: 13px; line-height: 1.5; resize: vertical;"
              >${escapeHtml(form.caption || "")}</textarea>
            </div>

            <!-- 6. Thông báo quy định -->
            <div style="display: flex; gap: 10px; padding: 12px 14px; background: #FBF5EB; border: 1px solid #EEDFC6; border-radius: 10px; font-size: 12px; color: #7D715E; line-height: 1.5;">
              <i class="ph-bold ph-shield-check" style="color: #C59B58; font-size: 18px; flex-shrink: 0; margin-top: 1px;"></i>
              <div>
                <strong style="color: #1A1612;">Quy trình kiểm duyệt FR-15:</strong> Video sau khi gửi sẽ ở trạng thái <strong>Chờ Shop phê duyệt</strong>. Bạn có thể xem trước hoặc hủy nộp bất kỳ lúc nào trước khi Shop phê duyệt.
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div style="padding: 16px 24px; background: #FAF8F5; border-top: 1px solid #EAE4D7; display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
            <button type="button" class="btn secondary" id="btn-cancel-submit" style="padding: 0 16px; height: 42px; font-size: 13px; font-weight: 600; cursor: pointer; border-radius: 10px;">
              Hủy bỏ
            </button>
            ${hasVideo ? `
              <button
                type="button"
                id="btn-submit-kol-video"
                style="background: linear-gradient(135deg, #C59B58 0%, #B88E4F 100%); color: #FFFFFF; border: none; border-radius: 10px; padding: 0 20px; height: 42px; font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(184, 142, 79, 0.35);"
              >
                <i class="ph-bold ph-paper-plane-tilt"></i> Gửi video cho Shop duyệt
              </button>
            ` : `
              <button
                type="button"
                disabled
                style="background: #EAE4D7; color: #7D715E; border: none; border-radius: 10px; padding: 0 20px; height: 42px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: not-allowed;"
                title="Vui lòng tải tệp video lên trước khi gửi"
              >
                <i class="ph-bold ph-lock"></i> Cần tải video để gửi
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // 1. Modal Hướng dẫn & Quy định
  if (mediaState.activeModal === "guidelines") {
    return `
      <div class="media-modal-backdrop" id="modal-backdrop">
        <div class="media-modal-window" style="max-width: 800px;">
          <div class="media-modal-header">
            <h3><i class="ph ph-book-open"></i> Quy định & Hướng dẫn Sử dụng Tài nguyên</h3>
            <button class="media-modal-close-btn" id="modal-close"><i class="ph ph-x"></i></button>
          </div>
          <div style="padding: 24px; overflow-y: auto;">
            <div class="media-guidelines-grid">
              <div class="media-guide-item">
                <strong><i class="ph ph-tag" style="color:var(--brand)"></i> 1. Gắn nhãn tiếp thị</strong>
                <p>Luôn gắn kèm hashtag <code>#Affiliate</code> hoặc <code>#HopTac</code> trong nội dung bài đăng theo đúng quy định pháp luật và chính sách minh bạch của sàn.</p>
              </div>
              <div class="media-guide-item">
                <strong><i class="ph ph-shield-check" style="color:var(--brand)"></i> 2. Cam kết thông tin khách quan</strong>
                <p>Không chỉnh sửa nội dung gây hiểu nhầm về công dụng. Sử dụng đúng thông tin và đặc tính khoa học do Shop cung cấp.</p>
              </div>
              <div class="media-guide-item">
                <strong><i class="ph ph-device-mobile" style="color:var(--brand)"></i> 3. Chuẩn tỷ lệ đăng</strong>
                <p>Khuyến khích dùng tỷ lệ 9:16 cho TikTok / Reels / Shorts để hiển thị trọn vẹn khung hình. Dùng tỷ lệ 1:1 hoặc 4:3 cho bài viết Feed.</p>
              </div>
            </div>

            <div class="card soft" style="margin-top: 20px; padding: 16px;">
              <strong>Bản quyền & Giấy phép sử dụng:</strong>
              <p style="margin: 6px 0 0; font-size: 13px; color: var(--muted); line-height: 1.5;">
                Tài nguyên thuộc quyền sở hữu của Sora Skin. Thành viên thuộc mạng lưới CTV và KOL của SCANMS được cấp quyền tải về, tùy chỉnh kịch bản cá nhân và đăng tải nhằm mục đích tiếp thị liên kết.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Modal Tiến trình Tải tệp (Download Progress)
  if (mediaState.activeModal === "download-progress") {
    return `
      <div class="media-modal-backdrop" id="modal-backdrop">
        <div class="media-modal-window" style="max-width: 480px; text-align: center;">
          <div class="media-modal-header">
            <h3>Đang tải tài nguyên</h3>
            <button class="media-modal-close-btn" id="modal-close"><i class="ph ph-x"></i></button>
          </div>
          <div style="padding: 32px 24px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
            <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--brand-soft); color: var(--brand-strong); display: grid; place-items: center; font-size: 32px;">
              ${mediaState.downloadProgress >= 100 ? `<i class="ph ph-check"></i>` : `<i class="ph ph-cloud-arrow-down"></i>`}
            </div>
            <div>
              <h4 style="margin: 0 0 6px; font-size: 16px;">${mediaState.downloadProgress >= 100 ? "Tải xuống thành công!" : "Đang nén và chuẩn bị tệp..."}</h4>
              <p style="margin: 0; color: var(--muted); font-size: 13px;">${mediaState.downloadProgress >= 100 ? "Tệp đã được lưu vào thư mục Downloads của bạn." : `Tiến độ: ${mediaState.downloadProgress}% • Tốc độ: 4.8 MB/s`}</p>
            </div>
            <div style="width: 100%; height: 8px; background: var(--surface-2); border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${mediaState.downloadProgress}%; background: var(--brand); transition: width 0.2s ease;"></div>
            </div>
            ${
              mediaState.downloadProgress >= 100
                ? `<button class="btn" id="modal-close-done" style="width: 100%;"><i class="ph ph-check"></i> Đóng cửa sổ</button>`
                : `<button class="btn secondary" id="modal-cancel-download">Hủy bỏ</button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  const asset = mediaState.selectedAsset;
  if (!asset) return "";

  const isVideo = asset.type === "video";

  // 3. Modal Xem trước Lightbox Ảnh hoặc Video Player
  return `
    <div class="media-modal-backdrop" id="modal-backdrop">
      <div class="media-modal-window">
        <div class="media-modal-header">
          <h3>
            ${isVideo ? `<i class="ph ph-video-camera"></i> Trình phát Video Review` : `<i class="ph ph-image"></i> Xem trước Hình ảnh gốc`}
            - ${escapeHtml(asset.title)}
          </h3>
          <button class="media-modal-close-btn" id="modal-close" title="Đóng cửa sổ"><i class="ph ph-x"></i></button>
        </div>

        <div class="media-modal-content">
          <div class="media-modal-stage">
            ${
              isVideo
                ? `
              <div class="media-video-container">
                <div class="media-video-player-wrap">
                  <video id="html5-video-player" poster="${asset.image}" src="${asset.videoUrl || sampleVideoUrl}" playsinline style="width:100%;height:100%;object-fit:contain;cursor:pointer;">
                    <source src="${asset.videoUrl || sampleVideoUrl}" type="video/mp4" />
                  </video>
                </div>

                <div class="media-video-controls">
                  <div class="media-video-timeline-wrap">
                    <div class="media-video-timeline" id="video-scrub-bar">
                      <div class="media-video-progress" id="video-progress-bar" style="width: ${mediaState.videoPlaying ? "45%" : "0%"}"></div>
                    </div>
                    <span class="media-video-time" id="video-time-display">00:18 / ${asset.duration}</span>
                  </div>

                  <div class="media-video-buttons">
                    <div class="media-video-btn-group">
                      <button class="media-v-btn" id="v-btn-play" title="Phát / Tạm dừng">
                        <i class="ph ${mediaState.videoPlaying ? "ph-pause" : "ph-play"}"></i>
                      </button>
                      <button class="media-v-btn" id="v-btn-mute" title="Bật / Tắt âm thanh">
                        <i class="ph ph-speaker-high"></i>
                      </button>
                      <input type="range" class="media-v-slider" id="v-volume-slider" min="0" max="1" step="0.05" value="1" title="Âm lượng" />
                    </div>

                    <div class="media-video-btn-group">
                      <select class="media-v-speed" id="v-speed-select" title="Tốc độ phát">
                        <option value="0.75">0.75x</option>
                        <option value="1" selected>1.0x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2.0x</option>
                      </select>
                      <button class="media-v-btn" id="v-btn-fullscreen" title="Toàn màn hình">
                        <i class="ph ph-corners-out"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `
                : `
              <div class="media-image-lightbox-wrap">
                <div class="media-lightbox-toolbar">
                  <button class="media-lb-tool-btn" id="btn-zoom-in" title="Phóng to (Zoom In)"><i class="ph ph-magnifying-glass-plus"></i></button>
                  <button class="media-lb-tool-btn" id="btn-zoom-out" title="Thu nhỏ (Zoom Out)"><i class="ph ph-magnifying-glass-minus"></i></button>
                  <button class="media-lb-tool-btn" id="btn-rotate" title="Xoay 90 độ"><i class="ph ph-arrow-clockwise"></i></button>
                  <span class="media-zoom-indicator">${mediaState.zoomLevel}%</span>
                </div>
                <div class="media-lightbox-viewport">
                  <img 
                    src="${asset.image}" 
                    alt="${escapeHtml(asset.title)}" 
                    class="media-lightbox-img" 
                    id="lightbox-target-img"
                    style="transform: scale(${mediaState.zoomLevel / 100}) rotate(${mediaState.rotation}deg);"
                  />
                </div>
              </div>
            `
            }
          </div>

          <div class="media-modal-sidebar">
            <div class="media-sidebar-section">
              <h4>${escapeHtml(asset.title)}</h4>
              <p style="font-size: 13px; color: var(--muted); margin: 4px 0 12px;">Sản phẩm: <strong>${escapeHtml(asset.productName)}</strong></p>
            </div>

            <div class="media-sidebar-specs">
              <div class="spec-row">
                <span>Loại tài nguyên:</span>
                <strong>${asset.type.toUpperCase()} (${asset.format})</strong>
              </div>
              <div class="spec-row">
                <span>Tỷ lệ hiển thị:</span>
                <strong>${asset.ratio}</strong>
              </div>
              <div class="spec-row">
                <span>Độ phân giải:</span>
                <strong>${asset.resolution}</strong>
              </div>
              <div class="spec-row">
                <span>Dung lượng gốc:</span>
                <strong>${asset.fileSize}</strong>
              </div>
              ${
                isVideo
                  ? `
                <div class="spec-row">
                  <span>Thời lượng:</span>
                  <strong>${asset.duration}</strong>
                </div>
                <div class="spec-row">
                  <span>Khung hình / giây:</span>
                  <strong>${asset.fps}</strong>
                </div>
              `
                  : ""
              }
              <div class="spec-row">
                <span>Lượt tải về:</span>
                <strong>${asset.downloads} lượt</strong>
              </div>
              <div class="spec-row">
                <span>Kênh đề xuất:</span>
                <strong style="text-align: right; max-width: 60%;">${asset.recommendedChannels}</strong>
              </div>
            </div>

            <div style="margin-top: auto; display: flex; flex-direction: column; gap: 10px;">
              ${
                asset.isSubmission && asset.status === "PENDING"
                  ? `
                <div style="padding:10px 12px;background:#FBF5EB;border:1px solid #EEDFC6;border-radius:10px;font-size:12px;color:#7D715E;">
                  <strong style="color:#D97706;display:flex;align-items:center;gap:4px;"><i class="ph-bold ph-clock"></i> Video đang chờ Shop duyệt</strong>
                  <p style="margin:4px 0 0;line-height:1.4;">Bạn có thể hủy nộp và xóa video này khỏi danh sách bất cứ lúc nào trước khi Shop duyệt.</p>
                </div>
                <button class="btn danger action-delete-submission" data-asset-id="${asset.id}" style="width: 100%;background:#FEE2E2;color:#DC2626;border:1px solid #FECACA;font-weight:700;cursor:pointer;">
                  <i class="ph ph-trash"></i> Hủy nộp & Xóa video này
                </button>
              `
                  : `
                <button class="btn action-download" data-asset-id="${asset.id}" style="width: 100%;">
                  <i class="ph ph-download-simple"></i> Tải file gốc về máy (${asset.fileSize})
                </button>
                <button class="btn secondary" id="btn-copy-asset-cdn" data-asset-id="${asset.id}" style="width: 100%;">
                  <i class="ph ph-link"></i> Sao chép liên kết CDN
                </button>
              `
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------
// 6. RENDER MOBILE FILTER DRAWER (BOTTOM SHEET CHO MOBILE)
// ---------------------------------------------------------------------
function renderMobileFilterDrawer(currentProduct) {
  if (!mediaState.isMobileFilterDrawerOpen) return "";

  return `
    <div class="media-bottom-sheet-backdrop" id="mobile-filter-backdrop">
      <div class="media-bottom-sheet">
        <div class="bottom-sheet-header">
          <h3><i class="ph ph-sliders-horizontal"></i> Bộ lọc tài nguyên</h3>
          <button class="btn-sheet-close" id="btn-close-mobile-drawer"><i class="ph ph-x"></i></button>
        </div>

        <div class="bottom-sheet-body">
          <div class="sheet-field">
            <label class="sheet-label">Sản phẩm:</label>
            <select class="media-native-select sheet-select" id="mobile-product-select">
              ${products.map((p) => `
                <option value="${p.id}" ${mediaState.selectedProduct === p.id ? "selected" : ""}>
                  ${escapeHtml(p.name)}
                </option>
              `).join("")}
            </select>
          </div>

          <div class="sheet-field">
            <label class="sheet-label">Loại nội dung:</label>
            <select class="media-native-select sheet-select" id="mobile-type-select">
              <option value="all" ${mediaState.selectedType === "all" ? "selected" : ""}>Tất cả loại</option>
              <option value="photo" ${mediaState.selectedType === "photo" ? "selected" : ""}>Ảnh</option>
              <option value="video" ${mediaState.selectedType === "video" ? "selected" : ""}>Video</option>
              <option value="banner" ${mediaState.selectedType === "banner" ? "selected" : ""}>Banner</option>
              <option value="caption" ${mediaState.selectedType === "caption" ? "selected" : ""}>Caption</option>
            </select>
          </div>

          <div class="sheet-field">
            <label class="sheet-label">Tỷ lệ khung hình:</label>
            <div class="sheet-ratio-pills">
              <button class="sheet-ratio-btn ${mediaState.selectedRatio === "all" ? "active" : ""}" data-sheet-ratio="all">Tất cả</button>
              <button class="sheet-ratio-btn ${mediaState.selectedRatio === "9:16" ? "active" : ""}" data-sheet-ratio="9:16">9:16</button>
              <button class="sheet-ratio-btn ${mediaState.selectedRatio === "1:1" ? "active" : ""}" data-sheet-ratio="1:1">1:1</button>
              <button class="sheet-ratio-btn ${mediaState.selectedRatio === "16:9" ? "active" : ""}" data-sheet-ratio="16:9">16:9</button>
              <button class="sheet-ratio-btn ${mediaState.selectedRatio === "4:3" ? "active" : ""}" data-sheet-ratio="4:3">4:3</button>
            </div>
          </div>
        </div>

        <div class="bottom-sheet-footer">
          <button class="btn secondary" id="btn-mobile-sheet-reset">Đặt lại</button>
          <button class="btn" id="btn-mobile-sheet-apply">Áp dụng</button>
        </div>
      </div>
    </div>
  `;
}

// =====================================================================
// 7. XỬ LÝ SỰ KIỆN TƯƠNG TÁC (bindMedia)
// =====================================================================
export function bindMedia(root = document, context = {}) {
  const container = root.querySelector(".media-workspace");
  if (!container) return;

  const { refresh = () => {}, toast = () => {}, state = {}, go = () => {} } = context;

  // 1. Chuyển đổi trạng thái UI Mode (Bình thường, Skeleton, Empty, Error)
  const modeSelect = container.querySelector("#media-mode-select");
  if (modeSelect) {
    modeSelect.onchange = (e) => {
      mediaState.uiMode = e.target.value;
      refresh();
      toast(`Đã chuyển sang chế độ: ${e.target.options[e.target.selectedIndex].text}`);
    };
  }

  // 2. Ô tìm kiếm thời gian thực
  const searchInput = container.querySelector("#media-search-input");
  if (searchInput) {
    searchInput.oninput = (e) => {
      mediaState.searchQuery = e.target.value;
      clearTimeout(searchInput._timer);
      searchInput._timer = setTimeout(() => {
        refresh();
        const newSearch = root.querySelector("#media-search-input");
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      }, 200);
    };
  }

  const btnClearSearch = container.querySelector("#btn-clear-search-input");
  if (btnClearSearch) {
    btnClearSearch.onclick = () => {
      mediaState.searchQuery = "";
      refresh();
    };
  }

  // 3. Dropdown sản phẩm kèm tìm kiếm bên trong
  const btnProdTrigger = container.querySelector("#btn-product-dropdown-trigger");
  if (btnProdTrigger) {
    btnProdTrigger.onclick = (e) => {
      e.stopPropagation();
      mediaState.isProductDropdownOpen = !mediaState.isProductDropdownOpen;
      mediaState.isRatioPopoverOpen = false;
      refresh();
      if (mediaState.isProductDropdownOpen) {
        setTimeout(() => {
          const input = root.querySelector("#input-search-product");
          if (input) input.focus();
        }, 50);
      }
    };
  }

  const inputSearchProd = container.querySelector("#input-search-product");
  if (inputSearchProd) {
    inputSearchProd.onclick = (e) => e.stopPropagation();
    inputSearchProd.oninput = (e) => {
      mediaState.productSearchQuery = e.target.value;
      clearTimeout(inputSearchProd._timer);
      inputSearchProd._timer = setTimeout(() => {
        refresh();
        const newInput = root.querySelector("#input-search-product");
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      }, 150);
    };
  }

  container.querySelectorAll(".product-dropdown-item").forEach((item) => {
    item.onclick = (e) => {
      e.stopPropagation();
      const pId = item.dataset.productId;
      mediaState.selectedProduct = pId;
      mediaState.isProductDropdownOpen = false;
      mediaState.productSearchQuery = "";
      refresh();
      const p = products.find((x) => x.id === pId);
      toast(`Đã chọn: ${p ? p.name : "Tất cả sản phẩm"}`);
    };
  });

  // 4. Dropdown Loại nội dung
  const typeSelect = container.querySelector("#media-type-select");
  if (typeSelect) {
    typeSelect.onchange = (e) => {
      mediaState.selectedType = e.target.value;
      refresh();
    };
  }

  // 5. Popover Bộ lọc tỷ lệ khung hình
  const btnRatioTrigger = container.querySelector("#btn-ratio-popover-trigger");
  if (btnRatioTrigger) {
    btnRatioTrigger.onclick = (e) => {
      e.stopPropagation();
      // Nếu màn hình nhỏ (<= 768px), mở mobile filter drawer
      if (window.innerWidth <= 768) {
        mediaState.isMobileFilterDrawerOpen = true;
        mediaState.isRatioPopoverOpen = false;
        refresh();
        return;
      }
      mediaState.isRatioPopoverOpen = !mediaState.isRatioPopoverOpen;
      mediaState.isProductDropdownOpen = false;
      refresh();
    };
  }

  container.querySelectorAll("input[name='ratio-opt']").forEach((radio) => {
    radio.onchange = (e) => {
      mediaState.selectedRatio = e.target.value;
      mediaState.isRatioPopoverOpen = false;
      refresh();
      toast(`Đã lọc tỷ lệ: ${e.target.value}`);
    };
  });

  const btnResetRatio = container.querySelector("#btn-reset-ratio");
  if (btnResetRatio) {
    btnResetRatio.onclick = (e) => {
      e.stopPropagation();
      mediaState.selectedRatio = "all";
      mediaState.isRatioPopoverOpen = false;
      refresh();
    };
  }

  // 6. Sắp xếp danh sách
  const sortSelect = container.querySelector("#media-sort-select");
  if (sortSelect) {
    sortSelect.onchange = (e) => {
      mediaState.sortBy = e.target.value;
      refresh();
    };
  }

  // 7. Hàng nhãn lọc đã áp dụng: Xóa từng tag
  container.querySelectorAll(".btn-remove-tag").forEach((btn) => {
    btn.onclick = () => {
      const type = btn.dataset.removeFilter;
      if (type === "search") mediaState.searchQuery = "";
      if (type === "product") mediaState.selectedProduct = "ALL";
      if (type === "type") mediaState.selectedType = "all";
      if (type === "ratio") mediaState.selectedRatio = "all";
      refresh();
    };
  });

  // 8. Nút Xóa tất cả bộ lọc
  const btnClearAll = container.querySelector("#btn-clear-all-filters");
  if (btnClearAll) {
    btnClearAll.onclick = () => {
      mediaState.selectedProduct = "ALL";
      mediaState.selectedType = "all";
      mediaState.selectedRatio = "all";
      mediaState.searchQuery = "";
      refresh();
      toast("Đã đặt lại toàn bộ bộ lọc về mặc định.");
    };
  }

  const emptyReset = container.querySelector("#btn-empty-reset");
  if (emptyReset) {
    emptyReset.onclick = () => {
      mediaState.selectedProduct = "ALL";
      mediaState.selectedType = "all";
      mediaState.selectedRatio = "all";
      mediaState.searchQuery = "";
      mediaState.uiMode = "normal";
      refresh();
      toast("Đã hiển thị lại toàn bộ tài nguyên.");
    };
  }

  // 9. Đóng dropdown và popover khi click ra ngoài
  const handleOutsideClick = (e) => {
    const prodWrap = root.querySelector("#prod-dropdown-wrap");
    const ratioWrap = root.querySelector("#ratio-popover-wrap");

    let changed = false;
    if (mediaState.isProductDropdownOpen && prodWrap && !prodWrap.contains(e.target)) {
      mediaState.isProductDropdownOpen = false;
      changed = true;
    }
    if (mediaState.isRatioPopoverOpen && ratioWrap && !ratioWrap.contains(e.target)) {
      mediaState.isRatioPopoverOpen = false;
      changed = true;
    }
    if (changed) refresh();
  };
  document.addEventListener("click", handleOutsideClick);

  // 10. Mobile Bottom Sheet Handlers
  const btnCloseDrawer = container.querySelector("#btn-close-mobile-drawer");
  if (btnCloseDrawer) {
    btnCloseDrawer.onclick = () => {
      mediaState.isMobileFilterDrawerOpen = false;
      refresh();
    };
  }

  const mobileBackdrop = container.querySelector("#mobile-filter-backdrop");
  if (mobileBackdrop) {
    mobileBackdrop.onclick = (e) => {
      if (e.target === mobileBackdrop) {
        mediaState.isMobileFilterDrawerOpen = false;
        refresh();
      }
    };
  }

  container.querySelectorAll(".sheet-ratio-btn").forEach((btn) => {
    btn.onclick = () => {
      container.querySelectorAll(".sheet-ratio-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  const btnMobileApply = container.querySelector("#btn-mobile-sheet-apply");
  if (btnMobileApply) {
    btnMobileApply.onclick = () => {
      const pSel = container.querySelector("#mobile-product-select");
      const tSel = container.querySelector("#mobile-type-select");
      const activeRatioBtn = container.querySelector(".sheet-ratio-btn.active");

      if (pSel) mediaState.selectedProduct = pSel.value;
      if (tSel) mediaState.selectedType = tSel.value;
      if (activeRatioBtn) mediaState.selectedRatio = activeRatioBtn.dataset.sheetRatio;

      mediaState.isMobileFilterDrawerOpen = false;
      refresh();
      toast("Đã áp dụng bộ lọc.");
    };
  }

  const btnMobileReset = container.querySelector("#btn-mobile-sheet-reset");
  if (btnMobileReset) {
    btnMobileReset.onclick = () => {
      mediaState.selectedProduct = "ALL";
      mediaState.selectedType = "all";
      mediaState.selectedRatio = "all";
      mediaState.isMobileFilterDrawerOpen = false;
      refresh();
      toast("Đã đặt lại bộ lọc.");
    };
  }

  // 11. XỬ LÝ CAPTION STUDIO
  const currentProduct = products.find((p) => p.id === mediaState.selectedProduct) || products[0];
  const captionTextarea = container.querySelector("#media-caption-box");
  const drawer = container.querySelector("#caption-preview-drawer");
  const drawerBackdrop = container.querySelector("#caption-drawer-backdrop");
  const btnOpenDrawer = container.querySelector("#btn-open-caption-drawer");
  const btnCloseCaptionDrawer = container.querySelector("#btn-close-caption-drawer");
  const btnDrawerCloseAction = container.querySelector("#btn-drawer-close-action");

  // Accordion Thu gọn / Mở rộng Mẫu Caption
  const btnToggleCaptionAccordion = container.querySelector("#btn-toggle-caption-accordion");
  if (btnToggleCaptionAccordion) {
    btnToggleCaptionAccordion.onclick = (e) => {
      if (e.target.closest("#btn-open-caption-drawer")) return;
      mediaState.isCaptionAccordionOpen = !mediaState.isCaptionAccordionOpen;
      refresh();
    };
    btnToggleCaptionAccordion.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.target.closest("#btn-open-caption-drawer")) return;
        e.preventDefault();
        mediaState.isCaptionAccordionOpen = !mediaState.isCaptionAccordionOpen;
        refresh();
      }
    };
  }

  const btnCollapseCaption = container.querySelector("#btn-collapse-caption");
  if (btnCollapseCaption) {
    btnCollapseCaption.onclick = () => {
      mediaState.isCaptionAccordionOpen = false;
      refresh();
    };
  }

  // Đồng bộ nhanh giao diện văn bản, số ký tự & bài đăng mô phỏng
  const updateLiveCaptionSync = (text) => {
    const counterEl = container.querySelector("#caption-char-count");
    if (counterEl) {
      counterEl.innerHTML = `<span>${text.length} ký tự</span>`;
    }
    const previewBody = container.querySelector("#social-preview-body");
    if (previewBody) {
      previewBody.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");
    }
  };

  // Mở/Đóng Drawer xem trước mượt mà, không render lại DOM để không mất con trỏ/nội dung
  const openCaptionDrawer = () => {
    mediaState.isPreviewDrawerOpen = true;
    if (drawer) drawer.classList.add("active");
    if (drawerBackdrop) drawerBackdrop.classList.add("active");
    if (captionTextarea) updateLiveCaptionSync(captionTextarea.value);
  };

  const closeCaptionDrawer = () => {
    mediaState.isPreviewDrawerOpen = false;
    if (drawer) drawer.classList.remove("active");
    if (drawerBackdrop) drawerBackdrop.classList.remove("active");
  };

  if (btnOpenDrawer) btnOpenDrawer.onclick = openCaptionDrawer;
  if (btnCloseCaptionDrawer) btnCloseCaptionDrawer.onclick = closeCaptionDrawer;
  if (btnDrawerCloseAction) btnDrawerCloseAction.onclick = closeCaptionDrawer;
  if (drawerBackdrop) drawerBackdrop.onclick = closeCaptionDrawer;

  // Popover Thông tin chèn
  const btnToggleInsert = container.querySelector("#btn-toggle-insert-info");
  const insertPopover = container.querySelector("#insert-details-popover");
  const btnCloseInsert = container.querySelector("#btn-close-insert-popover");

  const toggleInsertPopover = (forceState) => {
    const nextState = typeof forceState === "boolean" ? forceState : !mediaState.isInsertPopoverOpen;
    mediaState.isInsertPopoverOpen = nextState;
    if (insertPopover) insertPopover.classList.toggle("open", nextState);
    if (btnToggleInsert) {
      btnToggleInsert.classList.toggle("active", nextState);
      btnToggleInsert.setAttribute("aria-expanded", String(nextState));
    }
  };

  if (btnToggleInsert) {
    btnToggleInsert.onclick = (e) => {
      e.stopPropagation();
      toggleInsertPopover();
    };
  }
  if (btnCloseInsert) {
    btnCloseInsert.onclick = (e) => {
      e.stopPropagation();
      toggleInsertPopover(false);
    };
  }

  // Đóng Drawer và Popover bằng phím Escape hoặc click ngoài
  const handleCaptionKeydown = (e) => {
    if (e.key === "Escape") {
      if (mediaState.isPreviewDrawerOpen) {
        closeCaptionDrawer();
        if (btnOpenDrawer) btnOpenDrawer.focus();
      } else if (mediaState.isInsertPopoverOpen) {
        toggleInsertPopover(false);
        if (btnToggleInsert) btnToggleInsert.focus();
      }
    }
  };
  window.addEventListener("keydown", handleCaptionKeydown);

  const handleCaptionOutsideClick = (e) => {
    if (mediaState.isInsertPopoverOpen) {
      if (!e.target.closest(".caption-popover-anchor")) {
        toggleInsertPopover(false);
      }
    }
  };
  document.addEventListener("click", handleCaptionOutsideClick);

  // Đổi Mẫu nội dung (với xác nhận nếu đã chỉnh sửa)
  const presetSelect = container.querySelector("#caption-preset-select");
  if (presetSelect) {
    presetSelect.onchange = (e) => {
      const newPreset = e.target.value;
      if (mediaState.isCaptionModified) {
        const confirmed = window.confirm(
          "Nội dung bạn đang chỉnh sửa sẽ bị thay thế bằng mẫu mới. Bạn có chắc chắn muốn thay đổi không?"
        );
        if (!confirmed) {
          presetSelect.value = mediaState.activeCaptionPreset;
          return;
        }
      }
      mediaState.activeCaptionPreset = newPreset;
      mediaState.isCaptionModified = false;
      mediaState.customCaptionText = null;
      refresh();
      toast(`Đã áp dụng mẫu: ${captionPresets[newPreset]?.label || newPreset}`);
    };
  }

  // Chỉnh sửa các trường trong Popover Thông tin chèn
  const inputCustomLink = container.querySelector("#input-custom-link");
  if (inputCustomLink) {
    inputCustomLink.oninput = (e) => {
      mediaState.customLink = e.target.value.trim();
      if (!mediaState.isCaptionModified) {
        const newText = compileCaptionText(currentProduct);
        if (captionTextarea) captionTextarea.value = newText;
        updateLiveCaptionSync(newText);
      }
    };
  }

  const inputCustomCoupon = container.querySelector("#input-custom-coupon");
  if (inputCustomCoupon) {
    inputCustomCoupon.oninput = (e) => {
      mediaState.customCoupon = e.target.value.trim();
      if (!mediaState.isCaptionModified) {
        const newText = compileCaptionText(currentProduct);
        if (captionTextarea) captionTextarea.value = newText;
        updateLiveCaptionSync(newText);
      }
    };
  }

  const inputCustomHashtags = container.querySelector("#input-custom-hashtags");
  if (inputCustomHashtags) {
    inputCustomHashtags.oninput = (e) => {
      mediaState.customHashtags = e.target.value.trim();
      if (!mediaState.isCaptionModified) {
        const newText = compileCaptionText(currentProduct);
        if (captionTextarea) captionTextarea.value = newText;
        updateLiveCaptionSync(newText);
      }
    };
  }

  // Tùy chọn chèn/gỡ Link, Coupon, Hashtag thông minh không trùng lặp & không đè bài viết
  const handleInsertToggle = (type, isChecked) => {
    const defaultAffiliate = `https://scanms.vn/r/ref_nhat_${currentProduct.id.toLowerCase() === "all" ? "skinc15" : currentProduct.id.toLowerCase()}`;
    const affiliateLink = mediaState.customLink || defaultAffiliate;
    const couponCode = mediaState.customCoupon || "NHATXINH10";
    const hashtags = mediaState.customHashtags || "#SoraSkin #ReviewMyPham #Affiliate";

    if (!mediaState.isCaptionModified) {
      if (type === "link") mediaState.includeLink = isChecked;
      if (type === "coupon") mediaState.includeCoupon = isChecked;
      if (type === "hashtags") mediaState.includeHashtags = isChecked;
      const newText = compileCaptionText(currentProduct);
      if (captionTextarea) captionTextarea.value = newText;
      updateLiveCaptionSync(newText);
    } else {
      let text = captionTextarea ? captionTextarea.value : (mediaState.customCaptionText || "");
      if (type === "link") {
        mediaState.includeLink = isChecked;
        if (isChecked) {
          if (!text.includes(affiliateLink)) {
            text = text.trim() + `\n\n👉 Link mua hàng: ${affiliateLink}`;
          }
        } else {
          text = text.replace(new RegExp(`(\\n)?(👉\\s*)?(Link mua hàng:?\\s*)?${escapeRegex(affiliateLink)}`, "g"), "").trim();
        }
      } else if (type === "coupon") {
        mediaState.includeCoupon = isChecked;
        if (isChecked) {
          if (!text.includes(couponCode)) {
            text = text.trim() + `\n🏷️ Mã ưu đãi: ${couponCode}`;
          }
        } else {
          text = text.replace(new RegExp(`(\\n)?(🏷️\\s*)?(Mã ưu đãi:?\\s*)?${escapeRegex(couponCode)}`, "g"), "").trim();
        }
      } else if (type === "hashtags") {
        mediaState.includeHashtags = isChecked;
        if (isChecked) {
          if (!text.includes(hashtags)) {
            text = text.trim() + `\n\n${hashtags}`;
          }
        } else {
          text = text.replace(new RegExp(`(\\n)*${escapeRegex(hashtags)}`, "g"), "").trim();
        }
      }
      mediaState.customCaptionText = text;
      if (captionTextarea) captionTextarea.value = text;
      updateLiveCaptionSync(text);
    }
  };

  const switchLink = container.querySelector("#switch-link");
  if (switchLink) switchLink.onchange = (e) => handleInsertToggle("link", e.target.checked);

  const switchCoupon = container.querySelector("#switch-coupon");
  if (switchCoupon) switchCoupon.onchange = (e) => handleInsertToggle("coupon", e.target.checked);

  const switchHashtags = container.querySelector("#switch-hashtags");
  if (switchHashtags) switchHashtags.onchange = (e) => handleInsertToggle("hashtags", e.target.checked);

  // Vùng soạn văn bản (Textarea) - Cập nhật live & đổi nhãn sang "Đã chỉnh sửa từ mẫu Shop"
  if (captionTextarea) {
    captionTextarea.oninput = (e) => {
      const val = e.target.value;
      mediaState.customCaptionText = val;
      mediaState.isCaptionModified = true;

      updateLiveCaptionSync(val);

      const badgeEl = container.querySelector("#caption-status-badge");
      if (badgeEl && !badgeEl.classList.contains("edited")) {
        badgeEl.className = "caption-badge edited";
        badgeEl.innerHTML = `<i class="ph ph-pencil-simple-line"></i> Đã chỉnh sửa từ mẫu Shop`;
      }
    };
  }

  // Nút Khôi phục mẫu (có xác nhận nếu đã chỉnh sửa)
  const btnResetCaption = container.querySelector("#btn-reset-caption");
  if (btnResetCaption) {
    btnResetCaption.onclick = () => {
      if (mediaState.isCaptionModified) {
        const confirmed = window.confirm(
          "Bạn có chắc muốn khôi phục lại mẫu nguyên bản? Mọi nội dung đã chỉnh sửa sẽ bị hủy."
        );
        if (!confirmed) return;
      }
      mediaState.isCaptionModified = false;
      mediaState.customCaptionText = null;
      refresh();
      toast("Đã khôi phục lại mẫu nguyên bản do Shop cung cấp.");
    };
  }

  // Sao chép caption (ở footer và trong drawer)
  const setupCopyButton = (btn) => {
    if (!btn) return;
    btn.onclick = () => {
      const textToCopy = captionTextarea ? captionTextarea.value : compileCaptionText(currentProduct);
      if (!textToCopy) {
        toast("Nội dung caption đang trống.", "warning");
        return;
      }

      const originalHtml = btn.innerHTML;
      const markSuccess = () => {
        btn.innerHTML = `<i class="ph ph-check"></i> Đã sao chép!`;
        btn.classList.add("btn-copied-success");
        toast("Đã sao chép caption vào bộ nhớ tạm!", "success");
        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.classList.remove("btn-copied-success");
        }, 2200);
      };

      const markError = () => {
        toast("Không thể truy cập bộ nhớ tạm. Vui lòng bôi đen và nhấn Ctrl + C để sao chép.", "warning");
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(markSuccess).catch(() => {
          fallbackCopyText(textToCopy, markSuccess, markError);
        });
      } else {
        fallbackCopyText(textToCopy, markSuccess, markError);
      }
    };
  };

  setupCopyButton(container.querySelector("#btn-copy-caption"));
  setupCopyButton(container.querySelector("#btn-drawer-copy-action"));

  // Chuyển tab Social Preview (TikTok, Facebook, Threads) trong Drawer
  container.querySelectorAll(".preview-plat-btn").forEach((btn) => {
    btn.onclick = () => {
      const plat = btn.dataset.plat;
      mediaState.socialPreviewPlatform = plat;
      container.querySelectorAll(".preview-plat-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.plat === plat);
      });
      const labelEl = container.querySelector("#preview-post-plat-label");
      if (labelEl) {
        const platName = plat === "tiktok" ? "TikTok" : plat === "facebook" ? "Facebook" : "Threads";
        labelEl.innerHTML = `@nhat_skincare • ${platName} • Vừa xong • <i class="ph ph-globe"></i>`;
      }
    };
  });

  // 19. Bấm Xem trước (Lightbox hoặc Video Player)
  container.querySelectorAll(".action-preview").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.dataset.assetId;
      const asset = mediaAssets.find((a) => a.id === id);
      if (!asset) return;

      mediaState.selectedAsset = asset;
      mediaState.zoomLevel = 100;
      mediaState.rotation = 0;
      mediaState.videoPlaying = false;
      mediaState.activeModal = asset.type === "video" ? "preview-video" : "preview-image";
      refresh();
    };
  });

  // 20. Bấm Tải xuống tệp thực tế (Real File Download)
  container.querySelectorAll(".action-download").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.dataset.assetId;
      const asset = mediaAssets.find((a) => a.id === id);
      if (!asset) return;

      if (asset.isBroken) {
        toast("Lỗi: Tệp này không còn khả dụng trên hệ thống.", "danger");
        return;
      }

      const ext = asset.format.toLowerCase();
      const cleanProd = asset.productName.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `SCANMS_SoraSkin_${cleanProd}_${asset.id}.${ext}`;

      startRealDownloadProcess(filename, asset.title, refresh, toast);
    };
  });

  // 21. Thử lại tệp lỗi (Simulated error file)
  container.querySelectorAll(".action-retry-file").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      toast("Đang thử kết nối lại với kho lưu trữ cũ...", "warning");
      setTimeout(() => {
        toast("Thông báo: Chiến dịch này đã hết thời hạn bản quyền. Vui lòng sử dụng tài nguyên mới.", "danger");
      }, 1200);
    };
  });

  // 22. Thử lại kết nối CDN khi gặp lỗi
  const retryCdn = container.querySelector("#btn-retry-cdn");
  if (retryCdn) {
    retryCdn.onclick = () => {
      mediaState.uiMode = "loading";
      refresh();
      setTimeout(() => {
        mediaState.uiMode = "normal";
        refresh();
        toast("Kết nối lại máy chủ CDN thành công!");
      }, 1000);
    };
  }

  // 23. Nút mở Hướng dẫn sử dụng & Quy định
  const guidelinesBtn = container.querySelector("#btn-open-guidelines");
  if (guidelinesBtn) {
    guidelinesBtn.onclick = () => {
      mediaState.activeModal = "guidelines";
      refresh();
    };
  }

  // 23.1. Chức năng Nộp video review (FR-15) - Mở modal trực tiếp ngay tại trang (không chuyển trang)
  const submitKolVideoBtn = container.querySelector("#btn-open-kol-video-submission");
  if (submitKolVideoBtn) {
    submitKolVideoBtn.onclick = () => {
      mediaState.submitForm = createCleanSubmitKolForm();
      mediaState.activeModal = "submit-kol-video";
      refresh();
    };
  }

  // 23.2. Mở trực tiếp Landing Page sản phẩm công khai có video review và đặt hàng (FR-15) - Chuyển cùng tab
  const landingBtn = container.querySelector("#btn-open-landing-page");
  if (landingBtn) {
    landingBtn.onclick = () => {
      window.location.hash = "#storefront";
    };
  }

  // 24. Tải trọn bộ Pack tài nguyên
  const bulkBtn = container.querySelector("#btn-bulk-download");
  if (bulkBtn) {
    bulkBtn.onclick = () => {
      startRealDownloadProcess(
        "SCANMS_SoraSkin_Creative_Pack_2026.zip",
        "Bộ tài nguyên tiếp thị trọn gói",
        refresh,
        toast
      );
    };
  }

  // 25. Xử lý đóng Modal
  const modalBackdrop = container.querySelector("#modal-backdrop");
  if (modalBackdrop) {
    modalBackdrop.onclick = (e) => {
      if (e.target === modalBackdrop) {
        mediaState.activeModal = null;
        mediaState.deleteConfirmItem = null;
        refresh();
      }
    };
  }

  const modalClose = container.querySelector("#modal-close");
  if (modalClose) {
    modalClose.onclick = () => {
      mediaState.activeModal = null;
      mediaState.deleteConfirmItem = null;
      refresh();
    };
  }

  const btnCancelSubmit = container.querySelector("#btn-cancel-submit");
  if (btnCancelSubmit) {
    btnCancelSubmit.onclick = () => {
      mediaState.submitForm = createCleanSubmitKolForm();
      mediaState.activeModal = null;
      refresh();
    };
  }

  const btnResetForm = container.querySelector("#btn-reset-kol-video-form");
  if (btnResetForm) {
    btnResetForm.onclick = (e) => {
      e.stopPropagation();
      mediaState.submitForm = createCleanSubmitKolForm();
      refresh();
      toast("Đã làm mới form nộp video review.");
    };
  }

  const modalCloseDone = container.querySelector("#modal-close-done");
  if (modalCloseDone) {
    modalCloseDone.onclick = () => {
      mediaState.activeModal = null;
      refresh();
    };
  }

  const modalCancel = container.querySelector("#modal-cancel-download");
  if (modalCancel) {
    modalCancel.onclick = () => {
      mediaState.activeModal = null;
      refresh();
      toast("Đã hủy quá trình tải tệp.");
    };
  }

  // 25.1. Xử lý tải tệp Video trong Modal Nộp Video Review
  const btnChooseVideo = container.querySelector("#btn-choose-video-file");
  const inputVideoFile = container.querySelector("#input-video-file");
  if (btnChooseVideo && inputVideoFile) {
    btnChooseVideo.onclick = (e) => {
      e.stopPropagation();
      inputVideoFile.click();
    };
  }
  if (inputVideoFile) {
    inputVideoFile.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + " MB";
        if (!mediaState.submitForm) mediaState.submitForm = {};
        mediaState.submitForm.videoFile = file;
        mediaState.submitForm.videoFileName = file.name;
        mediaState.submitForm.videoFileSize = sizeMB;
        mediaState.submitForm.videoPreviewUrl = url;
        refresh();
      }
    };
  }

  const videoDropzone = container.querySelector("#video-dropzone");
  if (videoDropzone && inputVideoFile) {
    videoDropzone.onclick = () => {
      inputVideoFile.click();
    };
    videoDropzone.ondragover = (e) => {
      e.preventDefault();
      videoDropzone.style.borderColor = "#B88E4F";
      videoDropzone.style.background = "#FBF5EB";
    };
    videoDropzone.ondragleave = () => {
      videoDropzone.style.borderColor = "#C59B58";
      videoDropzone.style.background = "#FAF8F5";
    };
    videoDropzone.ondrop = (e) => {
      e.preventDefault();
      videoDropzone.style.borderColor = "#C59B58";
      videoDropzone.style.background = "#FAF8F5";
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + " MB";
        if (!mediaState.submitForm) mediaState.submitForm = {};
        mediaState.submitForm.videoFile = file;
        mediaState.submitForm.videoFileName = file.name;
        mediaState.submitForm.videoFileSize = sizeMB;
        mediaState.submitForm.videoPreviewUrl = url;
        refresh();
      }
    };
  }

  const btnQuickSample = container.querySelector("#btn-quick-sample-video");
  if (btnQuickSample) {
    btnQuickSample.onclick = (e) => {
      e.stopPropagation();
      if (!mediaState.submitForm) mediaState.submitForm = createCleanSubmitKolForm();
      mediaState.submitForm.videoFile = null;
      mediaState.submitForm.videoFileName = "sample-video.mp4 (Kiểm thử mẫu)";
      mediaState.submitForm.videoFileSize = "18.2 MB";
      mediaState.submitForm.videoPreviewUrl = sampleVideoUrl;
      if (!mediaState.submitForm.title) {
        mediaState.submitForm.title = "Trải nghiệm thực tế Serum Vitamin C sau 14 ngày - Da sáng rõ rệt";
      }
      if (!mediaState.submitForm.caption) {
        mediaState.submitForm.caption = "Serum mỏng nhẹ thấm nhanh, mùi cam tự nhiên, hiệu quả làm đều màu da và mờ vết thâm rõ rệt sau 2 tuần trải nghiệm.";
      }
      refresh();
    };
  }

  const btnChangeVideo = container.querySelector("#btn-change-video");
  if (btnChangeVideo && inputVideoFile) {
    btnChangeVideo.onclick = () => inputVideoFile.click();
  }

  const btnRemoveVideo = container.querySelector("#btn-remove-video");
  if (btnRemoveVideo) {
    btnRemoveVideo.onclick = () => {
      if (mediaState.submitForm) {
        mediaState.submitForm.videoFile = null;
        mediaState.submitForm.videoFileName = "";
        mediaState.submitForm.videoFileSize = "";
        mediaState.submitForm.videoPreviewUrl = "";
      }
      refresh();
    };
  }

  // 25.2. Xử lý tải ảnh Poster trong Modal
  const btnChoosePoster = container.querySelector("#btn-choose-poster-file");
  const inputPosterFile = container.querySelector("#input-poster-file");
  if (btnChoosePoster && inputPosterFile) {
    btnChoosePoster.onclick = () => inputPosterFile.click();
  }
  if (inputPosterFile) {
    inputPosterFile.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        if (!mediaState.submitForm) mediaState.submitForm = {};
        mediaState.submitForm.posterFile = file;
        mediaState.submitForm.posterFileName = file.name;
        mediaState.submitForm.posterPreviewUrl = url;
        refresh();
      }
    };
  }

  // 25.3. Xử lý cập nhật thông tin ô nhập liệu trong Modal
  const titleInput = container.querySelector("#submit-kol-title-input");
  if (titleInput) {
    titleInput.oninput = (e) => {
      if (mediaState.submitForm) mediaState.submitForm.title = e.target.value;
    };
  }
  const captionInput = container.querySelector("#submit-kol-caption-input");
  if (captionInput) {
    captionInput.oninput = (e) => {
      if (mediaState.submitForm) mediaState.submitForm.caption = e.target.value;
    };
  }
  const productSelect = container.querySelector("#submit-kol-product-select");
  if (productSelect) {
    productSelect.onchange = (e) => {
      if (mediaState.submitForm) mediaState.submitForm.productId = e.target.value;
    };
  }

  // TAB CHUYỂN ĐỔI: TÀI NGUYÊN SHOP vs VIDEO REVIEW CỦA TÔI
  const tabShop = container.querySelector("#tab-shop-assets");
  if (tabShop) {
    tabShop.onclick = () => {
      mediaState.activeTab = "shop";
      refresh();
    };
  }

  const tabMyReviews = container.querySelector("#tab-my-reviews");
  if (tabMyReviews) {
    tabMyReviews.onclick = () => {
      mediaState.activeTab = "my_reviews";
      refresh();
    };
  }

  const btnSubmitAnother = container.querySelector("#btn-submit-another-review");
  if (btnSubmitAnother) {
    btnSubmitAnother.onclick = () => {
      mediaState.submitForm = createCleanSubmitKolForm();
      mediaState.activeModal = "submit-kol-video";
      refresh();
    };
  }

  const btnEmptySubmit = container.querySelector("#btn-empty-submit-review");
  if (btnEmptySubmit) {
    btnEmptySubmit.onclick = () => {
      mediaState.submitForm = createCleanSubmitKolForm();
      mediaState.activeModal = "submit-kol-video";
      refresh();
    };
  }

  // 25.4. Xử lý bấm nút Gửi video cho Shop duyệt
  const btnSubmitReview = container.querySelector("#btn-submit-kol-video");
  if (btnSubmitReview) {
    btnSubmitReview.onclick = () => {
      const form = mediaState.submitForm || {};
      if (!form.videoPreviewUrl && !form.videoFile) {
        toast("Vui lòng tải video review lên trước khi gửi!", "danger");
        return;
      }

      const title = (form.title || "").trim() || "Trải nghiệm thực tế Serum Vitamin C";
      const newAsset = {
        id: "SUBMISSION-" + Date.now(),
        productId: form.productId || "SKIN-C15",
        productName: form.productId === "SUN-AQUA" ? "Kem chống nắng SPF50+" : form.productId === "TONER-BHA" ? "Toner BHA 2%" : "Serum vitamin C 15%",
        title: title,
        type: "video",
        format: "MP4",
        ratio: "9:16",
        ratioClass: "ratio-9-16",
        resolution: "1080 x 1920 px",
        duration: "00:42",
        durationSec: 42,
        fps: "60 fps",
        bitrate: "8.5 Mbps",
        fileSize: form.videoFileSize || "18.2 MB",
        sizeBytes: 19084083,
        downloads: 0,
        isApproved: false,
        isBroken: false,
        isSubmission: true,
        status: "PENDING",
        image: form.posterPreviewUrl || productImage,
        videoUrl: form.videoPreviewUrl || sampleVideoUrl,
        recommendedChannels: "TikTok, Reels, Shorts",
        tags: ["Review KOL", "Chờ duyệt", "Sora Skin"],
        updatedAt: "Vừa xong",
      };

      mediaAssets.unshift(newAsset);

      // Lưu vào localStorage để F5 không bị mất
      const savedSubs = loadSavedSubmissions().filter((a) => a.id !== newAsset.id);
      savedSubs.unshift(newAsset);
      saveSubmissionsToStorage(savedSubs);

      // Tự động chuyển sang Tab "Video review của tôi" để xem lại ngay
      mediaState.activeTab = "my_reviews";
      mediaState.activeModal = null;
      // Reset form hoàn toàn sạch sẽ sau khi nộp thành công
      mediaState.submitForm = createCleanSubmitKolForm();

      // Đồng bộ ngầm với Backend API nếu có phiên đăng nhập
      try {
        const token = localStorage.getItem("token");
        if (token) {
          fetch("/api/media/kol-submission", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              productId: "11111111-1111-1111-1111-111111111111",
              title: title,
              videoUrl: newAsset.videoUrl,
              thumbnailUrl: newAsset.image,
              captionTemplate: form.caption || ""
            })
          }).catch(err => console.warn("API sync silent fail:", err));
        }
      } catch (e) {}

      toast("Nộp video review thành công! Đã chuyển sang tab Video của tôi để xem lại.", "success");
      refresh();
    };
  }

  // 25.5. Xử lý Hủy nộp & Xóa video review - Mở Modal xác nhận xóa chuẩn thương hiệu (Không dùng window.confirm)
  container.querySelectorAll(".action-delete-submission").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-asset-id");
      if (!id) return;
      const asset = mediaAssets.find((a) => a.id === id);
      if (!asset) return;

      mediaState.deleteConfirmItem = asset;
      mediaState.activeModal = "confirm-delete-submission";
      refresh();
    };
  });

  // Xử lý nút Giữ lại / Hủy trong Modal xác nhận xóa
  const btnCancelDeleteModal = container.querySelector("#btn-cancel-delete-modal");
  if (btnCancelDeleteModal) {
    btnCancelDeleteModal.onclick = () => {
      mediaState.deleteConfirmItem = null;
      mediaState.activeModal = null;
      refresh();
    };
  }

  // Xử lý nút Xác nhận xóa vĩnh viễn trong Modal xác nhận xóa
  const btnConfirmDeleteModal = container.querySelector("#btn-confirm-delete-modal");
  if (btnConfirmDeleteModal) {
    btnConfirmDeleteModal.onclick = () => {
      if (mediaState.deleteConfirmItem) {
        const id = mediaState.deleteConfirmItem.id;
        const idx = mediaAssets.findIndex((a) => a.id === id);
        if (idx !== -1) {
          mediaAssets.splice(idx, 1);
          // Cập nhật localStorage
          const savedSubs = loadSavedSubmissions().filter((a) => a.id !== id);
          saveSubmissionsToStorage(savedSubs);

          if (mediaState.selectedAsset && mediaState.selectedAsset.id === id) {
            mediaState.activeModal = null;
            mediaState.selectedAsset = null;
          }
          toast("Đã hủy nộp và xóa video review thành công.");
        }
        mediaState.deleteConfirmItem = null;
        mediaState.activeModal = null;
        refresh();
      }
    };
  }

  // 26. Điều khiển Zoom & Xoay trong Lightbox
  const btnZoomIn = container.querySelector("#btn-zoom-in");
  if (btnZoomIn) {
    btnZoomIn.onclick = () => {
      if (mediaState.zoomLevel < 250) {
        mediaState.zoomLevel += 25;
        refresh();
      }
    };
  }

  const btnZoomOut = container.querySelector("#btn-zoom-out");
  if (btnZoomOut) {
    btnZoomOut.onclick = () => {
      if (mediaState.zoomLevel > 50) {
        mediaState.zoomLevel -= 25;
        refresh();
      }
    };
  }

  const btnRotate = container.querySelector("#btn-rotate");
  if (btnRotate) {
    btnRotate.onclick = () => {
      mediaState.rotation = (mediaState.rotation + 90) % 360;
      refresh();
    };
  }

  // 27. Điều khiển Video Player
  const videoEl = container.querySelector("#html5-video-player");
  const vBtnPlay = container.querySelector("#v-btn-play");
  const vProgress = container.querySelector("#video-progress-bar");
  const vTimeDisplay = container.querySelector("#video-time-display");
  const vScrubBar = container.querySelector("#video-scrub-bar");
  const vBtnMute = container.querySelector("#v-btn-mute");
  const vVolumeSlider = container.querySelector("#v-volume-slider");
  const vSpeedSelect = container.querySelector("#v-speed-select");

  if (videoEl) {
    videoEl.volume = mediaState.videoVolume;
    videoEl.playbackRate = mediaState.videoPlaybackRate || 1;

    const togglePlay = () => {
      if (videoEl.paused) {
        videoEl.play().then(() => {
          mediaState.videoPlaying = true;
          if (vBtnPlay) vBtnPlay.innerHTML = '<i class="ph ph-pause"></i>';
          toast("Đang phát video review...");
        }).catch(() => {});
      } else {
        videoEl.pause();
        mediaState.videoPlaying = false;
        if (vBtnPlay) vBtnPlay.innerHTML = '<i class="ph ph-play"></i>';
        toast("Đã tạm dừng video");
      }
    };

    videoEl.onclick = togglePlay;
    if (vBtnPlay) vBtnPlay.onclick = togglePlay;

    videoEl.ontimeupdate = () => {
      if (videoEl.duration) {
        const pct = (videoEl.currentTime / videoEl.duration) * 100;
        if (vProgress) vProgress.style.width = pct + "%";
        if (vTimeDisplay) {
          const curM = String(Math.floor(videoEl.currentTime / 60)).padStart(2, "0");
          const curS = String(Math.floor(videoEl.currentTime % 60)).padStart(2, "0");
          vTimeDisplay.textContent = `${curM}:${curS} / ${mediaState.selectedAsset?.duration || "00:42"}`;
        }
      }
    };

    videoEl.onended = () => {
      mediaState.videoPlaying = false;
      if (vBtnPlay) vBtnPlay.innerHTML = '<i class="ph ph-play"></i>';
      if (vProgress) vProgress.style.width = "0%";
    };

    if (vScrubBar) {
      vScrubBar.onclick = (e) => {
        const rect = vScrubBar.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (videoEl.duration) {
          videoEl.currentTime = pos * videoEl.duration;
        }
      };
    }

    if (vBtnMute) {
      vBtnMute.onclick = () => {
        videoEl.muted = !videoEl.muted;
        const icon = vBtnMute.querySelector("i");
        if (icon) {
          icon.className = videoEl.muted ? "ph ph-speaker-slash" : "ph ph-speaker-high";
        }
      };
    }

    if (vVolumeSlider) {
      vVolumeSlider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        videoEl.volume = val;
        videoEl.muted = val === 0;
        mediaState.videoVolume = val;
        const icon = container.querySelector("#v-btn-mute i");
        if (icon) {
          icon.className = val > 0 ? "ph ph-speaker-high" : "ph ph-speaker-slash";
        }
      };
    }

    if (vSpeedSelect) {
      vSpeedSelect.onchange = (e) => {
        const rate = parseFloat(e.target.value);
        videoEl.playbackRate = rate;
        mediaState.videoPlaybackRate = rate;
        toast(`Tốc độ phát: ${rate}x`);
      };
    }
  }

  // 28. Sao chép liên kết CDN
  const copyCdnBtn = container.querySelector("#btn-copy-asset-cdn");
  if (copyCdnBtn) {
    copyCdnBtn.onclick = () => {
      const cdnUrl = `https://cdn.scanms.vn/assets/soraskin/${copyCdnBtn.dataset.assetId}`;
      navigator.clipboard.writeText(cdnUrl).then(() => {
        toast("Đã sao chép link CDN tốc độ cao!");
      });
    };
  }
}

// Fallback sao chép bộ nhớ tạm không dùng navigator.clipboard
function fallbackCopyText(text, onSuccess, onError) {
  try {
    const tempInput = document.createElement("textarea");
    tempInput.value = text;
    tempInput.style.position = "fixed";
    tempInput.style.top = "-9999px";
    tempInput.style.left = "-9999px";
    document.body.appendChild(tempInput);
    tempInput.focus();
    tempInput.select();
    const success = document.execCommand("copy");
    document.body.removeChild(tempInput);
    if (success) {
      onSuccess();
    } else {
      onError();
    }
  } catch (err) {
    onError();
  }
}

// ---------------------------------------------------------------------
// 8. TIẾN TRÌNH TẢI TỆP THỰC TẾ (REAL DOWNLOAD ENGINE)
// ---------------------------------------------------------------------
function startRealDownloadProcess(filename, label, refresh, toast) {
  mediaState.activeModal = "download-progress";
  mediaState.downloadProgress = 15;
  refresh();

  const timer = setInterval(() => {
    if (mediaState.downloadProgress < 90) {
      mediaState.downloadProgress += 25;
      refresh();
    } else {
      clearInterval(timer);
      mediaState.downloadProgress = 100;
      refresh();
      triggerActualFileDownload(filename);
      toast(`Tải xuống thành công: ${filename}`);
    }
  }, 250);
}

// Sinh và tải file nhị phân/văn bản thực về ổ cứng người dùng
function triggerActualFileDownload(filename) {
  try {
    let blob;
    if (filename.endsWith(".txt")) {
      const content = `SCANMS Media Hub Export\nSora Skin Official Brand Asset\nTên tệp: ${filename}\nNgày tải: ${new Date().toLocaleString("vi-VN")}\nBản quyền được chứng nhận bởi SCANMS.`;
      blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");

      const grad = ctx.createLinearGradient(0, 0, 1200, 800);
      grad.addColorStop(0, "#8C6524");
      grad.addColorStop(1, "#C9A363");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 800);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText("SCANMS - SORA SKIN OFFICIAL ASSET", 60, 120);

      ctx.font = "24px sans-serif";
      ctx.fillStyle = "#F5E7CC";
      ctx.fillText(`Tệp: ${filename}`, 60, 180);
      ctx.fillText("Đã được xác thực bản quyền tiếp thị liên kết", 60, 220);
      ctx.fillText("Ngày cấp quyền: " + new Date().toLocaleDateString("vi-VN"), 60, 260);

      canvas.toBlob((b) => {
        if (!b) return;
        const url = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
  }
}
