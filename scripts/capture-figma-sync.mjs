import { mkdir } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const base = 'http://127.0.0.1:5173';
const out = 'public/redraw-kit/figma-sync-2026-09-21';
await mkdir(out, { recursive: true });

const users = {
  collaborator: {
    id: 'kol-01', email: 'demo@scanms.vn', fullName: 'Nguyễn Thành Thắng', role: 'COLLABORATOR',
  },
  merchant: {
    id: 'shop-01', email: 'shop@scanms.vn', fullName: 'Sora Skin Official', role: 'SHOP_MANAGER',
    stores: [{ id: 'frontend-demo-store', name: 'Sora Skin Official' }],
  },
  admin: {
    id: 'admin-01', email: 'admin@scanms.vn', fullName: 'Nguyễn Quản Trị', role: 'SYSTEM_ADMIN',
  },
};

const screens = [
  { file: '01_Dang_Nhap_Auth.png', url: '/login' },
  { file: '01_Dang_Ky_Register.png', url: '/register' },
  { file: '02_Tong_Quan_KOL_Dashboard.png', url: '/collaborator/dashboard', role: 'collaborator' },
  { file: '03_Link_Va_QR_Tiep_Thi.png', url: '/collaborator/marketing', role: 'collaborator' },
  { file: '04_Quan_Ly_Kenh_MXH.png', url: '/collaborator/profile', role: 'collaborator' },
  { file: '05_Kho_Noi_Dung_Media_Hub.png', url: '/collaborator/marketing?tab=media', role: 'collaborator' },
  { file: '06_Hang_Mau_Dung_Thu_Master_Detail.png', url: '/collaborator/collaboration?tab=samples', role: 'collaborator' },
  { file: '07_Bang_Vinh_Danh_Leaderboard.png', url: '/collaborator/leaderboard', role: 'collaborator' },
  { file: '08_Vi_Tien_Va_Rut_Tien.png', url: '/collaborator/wallet', role: 'collaborator' },
  { file: '09_Tong_Quan_Shop_Dashboard.png', url: '/merchant/dashboard', role: 'merchant' },
  { file: '10_Danh_Muc_SanPham_Hoa_Hong.png', url: '/merchant/products', role: 'merchant' },
  { file: '11_Doi_Ngu_CTV_Cap_Mau.png', url: '/merchant/kol-hub', role: 'merchant' },
  { file: '12_Doi_Soat_Don_Hang.png', url: '/merchant/orders', role: 'merchant' },
  { file: '13_Duyet_Chi_Tra_Hoa_Hong.png', url: '/merchant/payouts', role: 'merchant' },
  { file: '14_AI_Fraud_Sentinel.png', url: '/merchant/fraud-sentinel', role: 'merchant' },
  { file: '15_Tong_Quan_San_Super_Admin.png', url: '/admin/analytics', role: 'admin' },
  { file: '23_Admin_Quan_Ly_Dich_Vu_He_Thong.png', url: '/admin/system', role: 'admin' },
  { file: '16_Quan_Ly_Gian_Hang_Moi.png', url: '/merchant/products', role: 'admin' },
  { file: '17_Nguoi_Dung_Duyet_KYC.png', url: '/admin/users', role: 'admin' },
  { file: '18_Cong_Ngan_Hang_Napas.png', url: '/admin/affiliate-oversight', role: 'admin' },
  { file: '19_Nhat_Ky_Audit_Trail.png', url: '/admin/audit-logs', role: 'admin' },
];

const requestedFiles = new Set(process.argv.slice(2));
const selectedScreens = requestedFiles.size
  ? screens.filter((screen) => requestedFiles.has(screen.file))
  : screens;

for (const screen of selectedScreens) {
  const page = await browser.newPage();
  page.on('pageerror', (error) => console.error(`[${screen.file}] ${error.message}`));
  await page.setViewport({ width: 1440, height: 1024, deviceScaleFactor: 1 });
  if (screen.role) {
    const user = users[screen.role];
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('/auth/me')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { user } }),
        });
        return;
      }
      request.continue();
    });
    await page.evaluateOnNewDocument((profile) => {
      localStorage.setItem('token', 'figma-sync-session');
      localStorage.setItem('auth_token', 'figma-sync-session');
      localStorage.setItem('user', JSON.stringify(profile));
      localStorage.setItem('scanms-current-role', profile.role);
      localStorage.setItem('scanms_sidebar_collapsed', 'false');
      if (profile.stores?.[0]?.id) localStorage.setItem('current_store_id', profile.stores[0].id);
    }, user);
  }
  await page.goto(`${base}${screen.url}`, { waitUntil: 'networkidle0', timeout: 45000 });
  await new Promise((resolve) => setTimeout(resolve, 1800));
  await page.screenshot({ path: `${out}/${screen.file}`, type: 'png', fullPage: false });
  await page.close();
  console.log(`Captured ${screen.file}`);
}

await browser.close();
console.log(`Captured ${selectedScreens.length} synchronized screens.`);
