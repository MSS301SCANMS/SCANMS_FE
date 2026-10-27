import type { ComponentType } from 'react';
import {
  TrendingUp,
  Link2,
  Wallet,
  ShoppingBag,
  Store,
  Box,
  Settings,
  ShieldCheck,
  Users,
  Tag,
  User,
  Radio,
  BarChart3,
  Activity,
  Percent,
  Handshake,
  MapPin,
  Heart,
  LayoutDashboard,
  Sparkles,
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

/**
 * Menu theo note.docx + mainflow SCANMS.
 */
export const NAVIGATION_BY_ROLE: Record<string, RoleNavigationGroup> = {
  CUSTOMER: {
    title: 'TÀI KHOẢN KHÁCH HÀNG',
    subTitle: 'Không gian mua sắm',
    items: [
      { path: '/customer/orders', label: 'Đơn mua của tôi', icon: ShoppingBag, section: 'MUA SẮM & VÍ' },
      { path: '/outfit-match', label: 'AI phối giày & nón', icon: Sparkles, section: 'MUA SẮM & VÍ' },
      { path: '/customer/addresses', label: 'Sổ địa chỉ nhận hàng', icon: MapPin, section: 'MUA SẮM & VÍ' },
      { path: '/customer/wishlist', label: 'Sản phẩm yêu thích', icon: Heart, section: 'MUA SẮM & VÍ' },
      { path: '/customer/wallet', label: 'Ví SCANMS', icon: Wallet, badge: 'Ví', section: 'MUA SẮM & VÍ' },
      { path: '/customer/vouchers', label: 'Kho Voucher', icon: Tag, section: 'MUA SẮM & VÍ' },
      { path: '/customer/profile', label: 'Hồ sơ & Bảo mật', icon: User, section: 'TÀI KHOẢN' },
      { path: '/customer/upgrade', label: 'Nâng cấp KOL / Shop', icon: TrendingUp, section: 'TÀI KHOẢN' },
    ],
  },
  COLLABORATOR: {
    title: 'KHÔNG GIAN KOL / CTV',
    subTitle: 'KOL / CTV Tiếp Thị',
    items: [
      { path: '/collaborator/dashboard', label: 'Tổng quan doanh số', icon: TrendingUp, section: 'TỔNG QUAN' },
      { path: '/collaborator/marketing', label: 'Tiếp thị liên kết và phát trực tiếp', icon: Link2, section: 'TIẾP THỊ' },
      { path: '/collaborator/wallet', label: 'Ví & Rút tiền', icon: Wallet, section: 'TÀI CHÍNH' },
      { path: '/collaborator/profile', label: 'Hồ sơ của tôi', icon: User, section: 'HỒ SƠ' },
    ],
  },
  SHOP_MANAGER: {
    title: 'QUẢN LÝ GIAN HÀNG',
    subTitle: 'Chủ Shop',
    items: [
      { path: '/merchant/dashboard', label: 'Tổng quan Gian hàng', icon: Store, section: 'TỔNG QUAN' },
      { path: '/merchant/orders', label: 'Quản lý Đơn hàng', icon: ShoppingBag, section: 'VẬN HÀNH' },
      { path: '/merchant/returns', label: 'Yêu cầu trả hàng', icon: Box, section: 'VẬN HÀNH' },
      { path: '/merchant/products', label: 'Danh mục Sản phẩm', icon: Box, section: 'VẬN HÀNH' },
      { path: '/merchant/promotions', label: 'Voucher & Hoa hồng', icon: Tag, section: 'KHUYẾN MÃI' },
      { path: '/merchant/live-sessions', label: 'Livestream', icon: Radio, section: 'KHUYẾN MÃI' },
      { path: '/merchant/collaborations', label: 'Hợp tác KOL', icon: Handshake, section: 'KHUYẾN MÃI' },
      { path: '/merchant/payouts', label: 'Ví và đối soát', icon: Wallet, section: 'TÀI CHÍNH' },
      { path: '/merchant/settings', label: 'Cài đặt gian hàng', icon: Settings, section: 'TÀI CHÍNH' },
      { path: '/merchant/store-application', label: 'Hồ sơ gian hàng', icon: ShieldCheck, section: 'HỒ SƠ' },
    ],
  },
  SYSTEM_ADMIN: {
    title: 'QUẢN TRỊ HỆ THỐNG',
    subTitle: 'Admin',
    items: [
      { path: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard, section: 'TỔNG QUAN' },
      { path: '/admin/users', label: 'Tài khoản & Phân quyền', icon: Users, section: 'NGƯỜI DÙNG' },
      { path: '/admin/system-wallet', label: 'Ví hệ thống', icon: Wallet, section: 'TÀI CHÍNH' },
      { path: '/admin/system-health', label: 'Giám sát hệ thống', icon: Activity, section: 'VẬN HÀNH' },
    ],
  },
  SYSTEM_MANAGER: {
    title: 'VẬN HÀNH SÀN',
    subTitle: 'Manager',
    items: [
      { path: '/admin/ops-dashboard', label: 'Dashboard vận hành', icon: BarChart3, section: 'TỔNG QUAN' },
      { path: '/admin/kyc-approval', label: 'Duyệt Shop & nâng cấp KOL', icon: Users, section: 'THẨM ĐỊNH' },
      { path: '/admin/commission-policies', label: 'Chiết khấu hoa hồng HT', icon: Percent, section: 'CHÍNH SÁCH' },
      { path: '/admin/affiliate-oversight', label: 'Voucher hệ thống', icon: Tag, section: 'CHÍNH SÁCH' },
      { path: '/admin/collaborations', label: 'Hợp tác Shop–KOL', icon: Handshake, section: 'TIẾP THỊ' },
      { path: '/admin/stats', label: 'Thống kê & Top 10', icon: TrendingUp, section: 'THỐNG KÊ' },
      { path: '/admin/product-moderation', label: 'Kiểm duyệt sản phẩm', icon: Box, section: 'THẨM ĐỊNH' },
      { path: '/admin/return-disputes', label: 'Đổi trả & Khiếu nại', icon: ShieldCheck, section: 'HỖ TRỢ' },
    ],
  },
};
