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
  COLLABORATOR: {
    title: 'KHÔNG GIAN KOL / CTV',
    subTitle: 'KOL / CTV Tiếp Thị',
    items: [
      { path: '/collaborator/dashboard', label: 'Tổng quan & Doanh số', icon: TrendingUp },
      { path: '/collaborator/marketing', label: 'Trung tâm Tiếp thị', icon: Link2 },
      { path: '/collaborator/collaboration', label: 'Hợp tác & Liên hệ Shop', icon: MessageSquare },
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
      { path: '/merchant/promotions', label: 'Khuyến mãi & Hoa hồng', icon: Tag },
      { path: '/merchant/payouts', label: 'Duyệt chi trả KOL', icon: Wallet },
      { path: '/merchant/fraud-sentinel', label: 'AI Chống gian lận traffic', icon: ShieldAlert },
      { path: '/merchant/audit-logs', label: 'Nhật ký kiểm toán', icon: ShieldCheck },
      { path: '/merchant/settings', label: 'Cài đặt gian hàng', icon: Settings },
    ],
  },
  SYSTEM_ADMIN: {
    title: 'QUẢN TRỊ TOÀN SÀN',
    subTitle: 'Hệ Thống & Vận Hành',
    items: [
      { path: '/admin/analytics', label: 'Giám sát Toàn sàn', icon: TrendingUp },
      { path: '/admin/users', label: 'Người dùng & Duyệt KYC', icon: Users },
      { path: '/merchant/products', label: 'Gian hàng & Danh mục', icon: Box },
      { path: '/admin/affiliate-oversight', label: 'Tiếp thị & Dòng tiền Sàn', icon: Link2 },
      { path: '/merchant/fraud-sentinel', label: 'AI Chống gian lận toàn sàn', icon: ShieldAlert },
      { path: '/admin/audit-logs', label: 'Nhật ký kiểm toán toàn sàn', icon: ShieldCheck },
      { path: '/merchant/settings', label: 'Cấu hình Hệ thống', icon: Settings },
    ],
  },
  SYSTEM_MANAGER: {
    title: 'VẬN HÀNH HỆ THỐNG',
    subTitle: 'Hệ Thống & Vận Hành',
    items: [
      { path: '/admin/analytics', label: 'Giám sát Toàn sàn', icon: TrendingUp },
      { path: '/admin/users', label: 'Người dùng & Duyệt KYC', icon: Users },
      { path: '/merchant/products', label: 'Gian hàng & Danh mục', icon: Box },
      { path: '/admin/affiliate-oversight', label: 'Tiếp thị & Dòng tiền Sàn', icon: Link2 },
      { path: '/merchant/fraud-sentinel', label: 'AI Chống gian lận toàn sàn', icon: ShieldAlert },
      { path: '/admin/audit-logs', label: 'Nhật ký kiểm toán toàn sàn', icon: ShieldCheck },
      { path: '/merchant/settings', label: 'Cấu hình Hệ thống', icon: Settings },
    ],
  },
};
