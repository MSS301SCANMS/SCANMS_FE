import { mkdir } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const base = 'http://127.0.0.1:5173';
const out = 'public/redraw-kit/figma-complete-sync-2026-09-21';
await mkdir(out, { recursive: true });

const buyer = {
  id: 'frontend-demo-buyer',
  email: 'user.demo@scanms.local',
  fullName: 'Người dùng Demo',
  role: 'COLLABORATOR',
  phoneNumber: '0901234567',
  addressLine: '123 Nguyễn Huệ',
  province: 'Thành phố Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
};

const completedOrder = {
  id: 'demo-completed-order', externalOrderSn: 'ORD-20260921-001',
  customerName: buyer.fullName, customerPhone: buyer.phoneNumber,
  shippingAddress: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
  subtotalAmount: 413100, discountAmount: 50000, finalAmount: 363100,
  paymentMethod: 'VIETQR', paymentStatus: 'PAID', status: 'COMPLETED',
  statusLabel: 'Đã giao thành công', statusColor: '#059669', timelineStep: 4,
  createdAt: '2026-09-20T08:00:00.000Z', updatedAt: '2026-09-21T08:00:00.000Z',
  store: { id: 'frontend-demo-store', name: 'Sora Skin Official', slug: 'sora-skin' },
  items: [{
    id: 'demo-item-1', productId: 'demo-serum',
    productTitle: 'Serum Vitamin C 15% Dưỡng Sáng Mờ Thâm Sora Skin',
    sku: 'SORA-VC15-30', imageUrl: '/assets/serum-hero-optimized.jpg',
    quantity: 1, unitPrice: 413100, totalPrice: 413100,
  }],
  reviews: [],
};

const vouchers = [
  { id: 'platform-scanms50k', code: 'SCANMS50K', title: 'Giảm 50.000₫ cho đơn đủ điều kiện', description: 'Voucher toàn sàn cho đơn từ 250.000₫.', scope: 'PLATFORM', minimumOrderAmount: 250000, expiresAt: '2026-12-31T23:59:59+07:00', savedAt: '2026-09-21T08:00:00.000Z' },
  { id: 'creator-thangvip10', code: 'THANGVIP10', title: 'Ưu đãi từ KOL Thắng', description: 'Giảm 10% cho sản phẩm được giới thiệu.', scope: 'CREATOR', savedAt: '2026-09-21T08:01:00.000Z' },
];

async function pageWithSession(authenticated = false, role = null, collapsed = false) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1024, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((data) => {
    if (data.authenticated) {
      localStorage.setItem('token', data.role ? 'figma-sync-session' : 'frontend-demo-buyer-token');
      localStorage.setItem('auth_token', data.role ? 'figma-sync-session' : 'frontend-demo-buyer-token');
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('scanms-current-role', data.user.role);
    }
    localStorage.setItem('scanms_sidebar_collapsed', String(data.collapsed));
    if (!data.role) {
      localStorage.setItem('scanms-frontend-demo-orders', JSON.stringify([data.order]));
      localStorage.setItem(`scanms-buyer-vouchers:${data.user.id}`, JSON.stringify(data.vouchers));
    }
  }, { authenticated, role, collapsed, user: role || buyer, order: completedOrder, vouchers });
  if (role) {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('/auth/me')) {
        request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { user: role } }) });
      } else request.continue();
    });
  }
  return page;
}

async function shot(page, file) {
  await new Promise((resolve) => setTimeout(resolve, 900));
  await page.screenshot({ path: `${out}/${file}`, type: 'png', fullPage: false });
  console.log(`Captured ${file}`);
}

async function clickText(page, text) {
  const clicked = await page.evaluate((needle) => {
    const nodes = [...document.querySelectorAll('button, a')];
    const target = nodes.find((node) => node.textContent?.replace(/\s+/g, ' ').trim().includes(needle));
    if (!target) return false;
    target.click();
    return true;
  }, text);
  if (!clicked) throw new Error(`Không tìm thấy nút: ${text}`);
  await new Promise((resolve) => setTimeout(resolve, 700));
}

// Public storefront and current product view.
{
  const page = await pageWithSession(false);
  await page.goto(`${base}/marketplace`, { waitUntil: 'networkidle0', timeout: 45000 });
  await shot(page, '21_Storefront_Mua_Hang_Current.png');
  await page.evaluate(() => window.scrollTo({ top: 640, behavior: 'instant' }));
  await shot(page, '21_Chi_Tiet_San_Pham_Login_Required.png');
  await clickText(page, 'Mua ngay');
  await shot(page, '21_Bat_Buoc_Dang_Nhap_Truoc_Khi_Mua.png');
  await page.close();
}

// Authenticated checkout and its interactive states.
{
  const page = await pageWithSession(true);
  await page.goto(`${base}/marketplace`, { waitUntil: 'networkidle0', timeout: 45000 });
  await clickText(page, 'Mua ngay');
  await shot(page, '21_Checkout_Profile_VietQR.png');
  const profileButton = await page.$('button');
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.includes('Lấy thông tin từ hồ sơ'));
    button?.click();
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  await shot(page, '21_Checkout_Da_Lay_Profile.png');
  await page.evaluate(() => document.querySelector('button[aria-label*="ảnh sản phẩm kích thước lớn"]')?.click());
  await shot(page, '21_Xem_Anh_San_Pham_Lon.png');
  await page.keyboard.press('Escape');
  await new Promise((resolve) => setTimeout(resolve, 300));
  await clickText(page, 'Chọn voucher đã săn');
  await shot(page, '21_Chon_Voucher_Da_San.png');
  await page.close();
}

// Completed delivery timeline and review eligibility/modal.
{
  const page = await pageWithSession(true);
  await page.goto(`${base}/my-orders`, { waitUntil: 'networkidle0', timeout: 45000 });
  await shot(page, '22_Tien_Do_Don_Hang_Da_Nhan.png');
  await clickText(page, 'Viết đánh giá');
  await shot(page, '22_Danh_Gia_Sau_Khi_Mua_Xong.png');
  await page.close();
}

// Collapsed navigation states for Shop and Admin.
for (const config of [
  { file: '09_Shop_Dashboard_Navbar_Thu_Gon.png', url: '/merchant/dashboard', user: { id: 'shop-01', email: 'shop@scanms.vn', fullName: 'Sora Skin Official', role: 'SHOP_MANAGER', stores: [{ id: 'frontend-demo-store', name: 'Sora Skin Official' }] } },
  { file: '23_Admin_System_Navbar_Thu_Gon.png', url: '/admin/system', user: { id: 'admin-01', email: 'admin@scanms.vn', fullName: 'Nguyễn Quản Trị', role: 'SYSTEM_ADMIN' } },
]) {
  const page = await pageWithSession(true, config.user, true);
  await page.goto(`${base}${config.url}`, { waitUntil: 'networkidle0', timeout: 45000 });
  await shot(page, config.file);
  await page.close();
}

await browser.close();
console.log('Complete Figma synchronization captures finished.');
