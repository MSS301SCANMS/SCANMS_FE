import type { ComponentType } from 'react';
import {
  TrendingUp,
  Link2,
  Share2,
  Images,
  Package,
  Trophy,
  Wallet,
  MessageSquare,
  ShoppingBag,
  Search,
  Store,
  Box,
  Settings,
  ShieldCheck,
  Users,
  SlidersHorizontal,
  Gift,
  Target,
  Tag,
  Flame,
  Award,
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
    title: 'CHỨC NĂNG KOL / CTV',
    subTitle: 'Không gian KOL / CTV',
    items: [
      { path: '/collaborator/dashboard', label: 'Tổng quan KOL', icon: TrendingUp },
      { path: '/collaborator/analytics', label: 'Doanh số Realtime', icon: Flame },
      { path: '/collaborator/referral-links', label: 'Link tiếp thị', icon: Link2 },
      { path: '/collaborator/coupons', label: 'Coupon tiếp thị', icon: Tag },
      { path: '/collaborator/bonus-progress', label: 'Tiến độ thưởng doanh số', icon: Target },
      { path: '/collaborator/campaigns', label: 'Chiến dịch mời', icon: Gift },
      { path: '/collaborator/sample-requests', label: 'Hàng mẫu', icon: Package },
      { path: '/collaborator/social-channels', label: 'Kênh xã hội', icon: Share2 },
      { path: '/collaborator/media-hub', label: 'Kho nội dung', icon: Images },
      { path: '/collaborator/leaderboard', label: 'Bảng vinh danh', icon: Trophy },
      { path: '/collaborator/tiers', label: 'Cấp bậc & Danh hiệu', icon: Award },
      { path: '/collaborator/wallet', label: 'Ví & rút tiền', icon: Wallet },
      { path: '/collaborator/kyc', label: 'Hồ sơ KYC', icon: ShieldCheck },
      { path: '/collaborator/messages', label: 'Tin nhắn hỗ trợ', icon: MessageSquare },
      { path: '/storefront', label: 'Trang mua hàng', icon: ShoppingBag },
      { path: '/tracking', label: 'Tra cứu đơn', icon: Search },
    ],
  },
  SHOP_MANAGER: {
    title: 'CHỨC NĂNG CHỦ SHOP',
    subTitle: 'Không gian Chủ Shop',
    items: [
      { path: '/merchant/dashboard', label: 'Tổng quan Shop', icon: Store },
      { path: '/merchant/kol-recommendations', label: 'AI Gợi ý KOL phù hợp', icon: Sparkles },
      { path: '/merchant/analytics', label: 'Doanh số Realtime', icon: Flame },
      { path: '/merchant/leaderboard', label: 'Bảng vinh danh Top KOL', icon: Trophy },
      { path: '/merchant/products', label: 'Danh mục sản phẩm', icon: Box },
      { path: '/merchant/referral-links', label: 'Quản lý Link tiếp thị', icon: Link2 },
      { path: '/merchant/coupons', label: 'Quản lý Coupon KOL', icon: Tag },
      { path: '/merchant/commission-rules', label: 'Chính sách thưởng doanh số', icon: Trophy },
      { path: '/merchant/campaigns', label: 'Chiến dịch & Mời KOL', icon: Gift },
      { path: '/merchant/sample-requests', label: 'Duyệt gửi hàng mẫu', icon: Package },
      { path: '/collaborator/media-hub', label: 'Kho tài nguyên', icon: Images },
      { path: '/merchant/settings', label: 'Cài đặt gian hàng', icon: Settings },
      { path: '/merchant/kyc-approval', label: 'Duyệt KYC CTV', icon: ShieldCheck },
      { path: '/merchant/messages', label: 'Tin nhắn hỗ trợ', icon: MessageSquare },
      { path: '/merchant/orders', label: 'Quản lý đơn hàng', icon: ShoppingBag },
      { path: '/merchant/payouts', label: 'Duyệt chi trả KOL', icon: Wallet },
    ],
  },
  SYSTEM_ADMIN: {
    title: 'QUẢN TRỊ TOÀN SÀN',
    subTitle: 'Không gian Quản Trị Hệ Thống',
    items: [
      { path: '/admin/analytics', label: 'Analytics Toàn sàn', icon: Flame },
      { path: '/admin/leaderboard', label: 'Bảng vinh danh Top KOL', icon: Trophy },
      { path: '/merchant/kol-recommendations', label: 'AI Gợi ý KOL phù hợp', icon: Sparkles },
      { path: '/admin/users', label: 'Quản lý User & KYC', icon: Users },
      { path: '/admin/referral-links', label: 'Quản trị Link toàn sàn', icon: Link2 },
      { path: '/admin/coupons', label: 'Quản trị Coupon', icon: Tag },
      { path: '/merchant/products', label: 'Danh mục Toàn sàn', icon: Box },
      { path: '/collaborator/tiers', label: 'Cấp bậc toàn sàn', icon: Trophy },
      { path: '/merchant/settings', label: 'Cấu hình Sàn & Shop', icon: SlidersHorizontal },
    ],
  },
  SYSTEM_MANAGER: {
    title: 'QUẢN TRỊ TOÀN SÀN',
    subTitle: 'Không gian Quản Trị Hệ Thống',
    items: [
      { path: '/admin/analytics', label: 'Analytics Toàn sàn', icon: Flame },
      { path: '/admin/leaderboard', label: 'Bảng vinh danh Top KOL', icon: Trophy },
      { path: '/merchant/kol-recommendations', label: 'AI Gợi ý KOL phù hợp', icon: Sparkles },
      { path: '/admin/users', label: 'Quản lý User & KYC', icon: Users },
      { path: '/admin/referral-links', label: 'Quản trị Link toàn sàn', icon: Link2 },
      { path: '/admin/coupons', label: 'Quản trị Coupon', icon: Tag },
      { path: '/merchant/products', label: 'Danh mục Toàn sàn', icon: Box },
      { path: '/collaborator/tiers', label: 'Cấp bậc toàn sàn', icon: Trophy },
      { path: '/merchant/settings', label: 'Cấu hình Sàn & Shop', icon: SlidersHorizontal },
    ],
  },
};
