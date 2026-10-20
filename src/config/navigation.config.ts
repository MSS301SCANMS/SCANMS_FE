import type { ComponentType } from 'react';
import {
  TrendingUp,
  Link2,
  Wallet,
  MessageSquare,
  ShoppingBag,
  Store,
  Box,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Users,
  Tag,
  Sparkles,
  Heart,
  User,
  Package,
  Radio,
  Bell,
  type LucideProps,
} from 'lucide-react';

export interface NavItemConfig {
  path: string;
  label: string;
  icon: ComponentType<LucideProps>;
  badge?: string;
  numBadge?: string;
  section?: string;
}

export interface RoleNavigationGroup {
  title: string;
  subTitle: string;
  items: NavItemConfig[];
}

export const NAVIGATION_BY_ROLE: Record<string, RoleNavigationGroup> = {
  CUSTOMER: {
    title: 'TÀI KHOẢN KHÁCH HÀNG',
    subTitle: 'Khách Mua Sắm',
    items: [
      { path: '/customer/orders', label: 'Đơn mua của tôi', icon: ShoppingBag, section: 'MUA SẮM & VÍ' },
      { path: '/customer/wallet', label: 'Ví Mua Sắm SCANMS', icon: Wallet, badge: 'Ví', section: 'MUA SẮM & VÍ' },
      { path: '/customer/vouchers', label: 'Kho Voucher', icon: Tag, section: 'MUA SẮM & VÍ' },
      { path: '/customer/wishlist', label: 'Sản phẩm yêu thích', icon: Heart, section: 'MUA SẮM & VÍ' },
      { path: '/customer/notifications', label: 'Thông báo', icon: Bell, section: 'MUA SẮM & VÍ' },
      { path: '/customer/profile', label: 'Hồ sơ cá nhân', icon: User, section: 'TÀI KHOẢN & BẢO MẬT' },
    ],
  },
  COLLABORATOR: {
    title: 'KHÔNG GIAN KOL / CTV',
    subTitle: 'KOL / CTV Tiếp Thị',
    items: [
      { path: '/collaborator/dashboard', label: 'Tổng quan & Doanh số', icon: TrendingUp, section: 'TỔNG QUAN' },
      { path: '/collaborator/marketing', label: 'Trung tâm Tiếp thị', icon: Link2, section: 'TIẾP THỊ & HỢP TÁC' },
      { path: '/collaborator/collaboration', label: 'Hợp tác & Nhận mẫu Shop', icon: MessageSquare, section: 'TIẾP THỊ & HỢP TÁC' },
      { path: '/collaborator/samples', label: 'Tiến độ mẫu & Video', icon: Package, section: 'TIẾP THỊ & HỢP TÁC' },
      { path: '/collaborator/live-sessions', label: 'Phiên Livestream', icon: Radio, section: 'TIẾP THỊ & HỢP TÁC' },
      { path: '/collaborator/wallet', label: 'Ví & Rút hoa hồng', icon: Wallet, section: 'TÀI CHÍNH & HỒ SƠ' },
      { path: '/collaborator/profile', label: 'Hồ sơ & Cấp bậc KOL', icon: ShieldCheck, section: 'TÀI CHÍNH & HỒ SƠ' },
    ],
  },
  SHOP_MANAGER: {
    title: 'QUẢN LÝ GIAN HÀNG',
    subTitle: 'Chủ Shop Bán Lẻ',
    items: [
      { path: '/merchant/dashboard', label: 'Tổng quan Gian hàng', icon: Store, section: 'TỔNG QUAN' },
      { path: '/merchant/orders', label: 'Quản lý Đơn hàng', icon: ShoppingBag, section: 'VẬN HÀNH & HÀNG HÓA' },
      { path: '/merchant/products', label: 'Danh mục Sản phẩm', icon: Box, section: 'VẬN HÀNH & HÀNG HÓA' },
      { path: '/merchant/customer-messages', label: 'Tin nhắn khách hàng', icon: MessageSquare, section: 'VẬN HÀNH & HÀNG HÓA' },
      { path: '/merchant/kol-hub', label: 'Mạng lưới KOL & Hợp tác', icon: Sparkles, section: 'TIẾP THỊ & MẠNG LƯỚI KOL' },
      { path: '/merchant/promotions', label: 'Khuyến mãi & Hoa hồng', icon: Tag, section: 'TIẾP THỊ & MẠNG LƯỚI KOL' },
      { path: '/merchant/live-sessions', label: 'Phiên & Voucher Live', icon: Radio, section: 'TIẾP THỊ & MẠNG LƯỚI KOL' },
      { path: '/merchant/payouts', label: 'Ví & Chi trả KOL', icon: Wallet, section: 'TÀI CHÍNH & CÀI ĐẶT' },
      { path: '/merchant/settings', label: 'Cài đặt gian hàng', icon: Settings, section: 'TÀI CHÍNH & CÀI ĐẶT' },
    ],
  },
  SYSTEM_ADMIN: {
    title: 'QUẢN TRỊ TỐI CAO',
    subTitle: 'Ban Quản Trị Hệ Thống',
    items: [
      { path: '/admin/analytics', label: 'Báo cáo Doanh số & Sàn', icon: TrendingUp, section: 'TỔNG QUAN & BÁO CÁO' },
      { path: '/admin/users', label: 'Tài khoản & Phân quyền', icon: Users, section: 'KIỂM SOÁT & NGƯỜI DÙNG' },
      { path: '/admin/sample-requests', label: 'Trọng tài hàng mẫu KOL', icon: Package, section: 'KIỂM SOÁT & NGƯỜI DÙNG' },
      { path: '/admin/product-moderation', label: 'Kiểm duyệt sản phẩm', icon: Box, section: 'KIỂM DUYỆT SÀN' },
      { path: '/admin/affiliate-oversight', label: 'Tiếp thị & Dòng tiền Sàn', icon: Link2, section: 'KIỂM DUYỆT SÀN' },
      { path: '/admin/fraud-sentinel', label: 'AI Giám sát Gian lận Sàn', icon: ShieldAlert, section: 'AN TOÀN & BẢO MẬT' },
      { path: '/admin/audit-logs', label: 'Nhật ký Kiểm toán Toàn sàn', icon: ShieldCheck, section: 'AN TOÀN & BẢO MẬT' },
    ],
  },
  SYSTEM_MANAGER: {
    title: 'VẬN HÀNH & TUÂN THỦ',
    subTitle: 'Chuyên Viên Vận Hành Sàn',
    items: [
      { path: '/admin/analytics', label: 'Báo cáo Vận hành', icon: TrendingUp, section: 'TỔNG QUAN' },
      { path: '/admin/users', label: 'Thẩm định & Duyệt KYC', icon: Users, section: 'THẨM ĐỊNH & KIỂM DUYỆT' },
      { path: '/admin/sample-requests', label: 'Trọng tài hàng mẫu KOL', icon: Package, section: 'THẨM ĐỊNH & KIỂM DUYỆT' },
      { path: '/admin/product-moderation', label: 'Kiểm duyệt sản phẩm', icon: Box, section: 'THẨM ĐỊNH & KIỂM DUYỆT' },
      { path: '/admin/affiliate-oversight', label: 'Giám sát Link & Khuyến mãi', icon: Link2, section: 'GIÁM SÁT TIẾP THỊ' },
      { path: '/admin/fraud-sentinel', label: 'AI Chống gian lận Traffic', icon: ShieldAlert, section: 'AN NINH & TRA CỨU' },
      { path: '/admin/audit-logs', label: 'Tra cứu Nhật ký Hoạt động', icon: ShieldCheck, section: 'AN NINH & TRA CỨU' },
    ],
  },
};
