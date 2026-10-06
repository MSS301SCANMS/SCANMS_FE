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
  MapPin,
  Heart,
  User,
  Package,
  Radio,
  Scale,
  type LucideProps,
} from 'lucide-react';

export interface NavItemConfig {
  path: string;
  label: string;
  icon: ComponentType<LucideProps>;
  badge?: string;
  numBadge?: string;
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
      { path: '/customer/wallet', label: 'Ví khách hàng', icon: Wallet },
      { path: '/customer/orders', label: 'Đơn mua của tôi', icon: ShoppingBag },
      { path: '/customer/profile', label: 'Hồ sơ & Bảo mật', icon: User },
      { path: '/customer/addresses', label: 'Sổ địa chỉ nhận hàng', icon: MapPin },
      { path: '/customer/wishlist', label: 'Sản phẩm yêu thích', icon: Heart },
    ],
  },
  COLLABORATOR: {
    title: 'KHÔNG GIAN KOL / CTV',
    subTitle: 'KOL / CTV Tiếp Thị',
    items: [
      { path: '/collaborator/dashboard', label: 'Tổng quan & Doanh số', icon: TrendingUp },
      { path: '/collaborator/marketing', label: 'Trung tâm Tiếp thị', icon: Link2 },
      { path: '/collaborator/collaboration', label: 'Hợp tác & Liên hệ Shop', icon: MessageSquare },
      { path: '/collaborator/live-sessions', label: 'Phiên Livestream', icon: Radio },
      { path: '/collaborator/wallet', label: 'Ví & Rút hoa hồng', icon: Wallet },
      { path: '/collaborator/profile', label: 'Hồ sơ & Cấp bậc KOL', icon: ShieldCheck },
    ],
  },
  SHOP_MANAGER: {
    title: 'QUẢN LÝ GIAN HÀNG',
    subTitle: 'Chủ Shop Bán Lẻ',
    items: [
      { path: '/merchant/dashboard', label: 'Tổng quan Gian hàng', icon: Store },
      { path: '/merchant/orders', label: 'Quản lý Đơn hàng', icon: ShoppingBag },
      { path: '/merchant/products', label: 'Danh mục Sản phẩm', icon: Box },
      { path: '/merchant/kol-hub', label: 'Mạng lưới KOL & Hợp tác', icon: Sparkles },
      { path: '/merchant/customer-messages', label: 'Tin nhắn khách hàng', icon: MessageSquare },
      { path: '/merchant/promotions', label: 'Khuyến mãi & Hoa hồng', icon: Tag },
      { path: '/merchant/wallet', label: 'Ví shop & Rút tiền', icon: Wallet },
      { path: '/merchant/settlements', label: 'Đối soát doanh thu', icon: ShoppingBag },
      { path: '/merchant/fraud-sentinel', label: 'AI Chống gian lận traffic', icon: ShieldAlert },
      { path: '/merchant/audit-logs', label: 'Nhật ký kiểm toán', icon: ShieldCheck },
      { path: '/merchant/settings', label: 'Cài đặt gian hàng', icon: Settings },
    ],
  },
  SYSTEM_ADMIN: {
    title: 'QUẢN TRỊ TỐI CAO',
    subTitle: 'Ban Quản Trị Hệ Thống',
    items: [
      { path: '/merchant/orders', label: 'Quản lý Đơn hàng Toàn sàn', icon: ShoppingBag },
      { path: '/admin/finance', label: 'Quản lý tài chính', icon: Wallet },
      { path: '/admin/disputes', label: 'Trọng tài & Khiếu nại Đổi trả', icon: Scale },
      { path: '/admin/analytics', label: 'Báo cáo Doanh số & Sàn', icon: TrendingUp },
      { path: '/admin/users', label: 'Tài khoản & Phân quyền', icon: Users },
      { path: '/admin/sample-requests', label: 'Quản trị hàng mẫu KOL', icon: Package },
      { path: '/admin/product-moderation', label: 'Kiểm duyệt sản phẩm', icon: Box },
      { path: '/admin/affiliate-oversight', label: 'Tiếp thị & Dòng tiền Sàn', icon: Link2 },
      { path: '/merchant/fraud-sentinel', label: 'AI Giám sát Gian lận Sàn', icon: ShieldAlert },
      { path: '/admin/audit-logs', label: 'Nhật ký Kiểm toán Toàn sàn', icon: ShieldCheck },
    ],
  },
  SYSTEM_MANAGER: {
    title: 'VẬN HÀNH & TUÂN THỦ',
    subTitle: 'Chuyên Viên Vận Hành Sàn',
    items: [
      { path: '/admin/users', label: 'Thẩm định & Duyệt KYC', icon: Users },
      { path: '/admin/sample-requests', label: 'Quản trị hàng mẫu KOL', icon: Package },
      { path: '/admin/product-moderation', label: 'Kiểm duyệt sản phẩm', icon: Box },
      { path: '/merchant/products', label: 'Kiểm duyệt Hàng hóa & Shop', icon: Box },
      { path: '/merchant/fraud-sentinel', label: 'AI Chống gian lận Traffic', icon: ShieldAlert },
      { path: '/admin/affiliate-oversight', label: 'Giám sát Link & Khuyến mãi', icon: Link2 },
      { path: '/admin/finance', label: 'Quản lý tài chính', icon: Wallet },
      { path: '/admin/analytics', label: 'Báo cáo Vận hành', icon: TrendingUp },
      { path: '/admin/audit-logs', label: 'Tra cứu Nhật ký Hoạt động', icon: ShieldCheck },
    ],
  },
};
