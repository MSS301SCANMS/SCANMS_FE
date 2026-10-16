import type { ComponentType } from 'react';
import { Store, Package, Video, Tag, ShoppingBag, Wallet, Link2, User, ShieldCheck, Settings } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export interface NavItemConfig { path: string; label: string; icon: ComponentType<LucideProps>; badge?: string; numBadge?: string; }
export interface RoleNavigationGroup { title: string; subTitle: string; items: NavItemConfig[]; }
const profile = { path: '/account', label: 'Hồ sơ của tôi', icon: User };
export const NAVIGATION_BY_ROLE: Record<string, RoleNavigationGroup> = {
  CUSTOMER: { title: 'KHÁCH HÀNG', subTitle: 'Tài khoản mua hàng', items: [
    { path: '/', label: 'Sản phẩm', icon: Package }, { path: '/customer/orders', label: 'Đơn mua', icon: ShoppingBag },
    { path: '/customer/wallet', label: 'Ví khách hàng', icon: Wallet }, { path: '/customer/upgrade', label: 'Đăng ký shop / KOL', icon: Store }, profile,
  ] },
  SHOP_MANAGER: { title: 'CHỦ GIAN HÀNG', subTitle: 'Shop & sản phẩm', items: [
    { path: '/merchant/dashboard', label: 'Gian hàng', icon: Store }, { path: '/merchant/products', label: 'Sản phẩm & tồn kho', icon: Package },
    { path: '/merchant/livestreams', label: 'Livestream', icon: Video }, { path: '/merchant/vouchers', label: 'Voucher', icon: Tag },
    { path: '/merchant/orders', label: 'Đơn theo shop', icon: ShoppingBag }, { path: '/merchant/affiliate', label: 'Tiếp thị & hoa hồng', icon: Link2 },
    { path: '/merchant/wallet', label: 'Ví & đối soát', icon: Wallet }, profile,
  ] },
  COLLABORATOR: { title: 'KOL / CTV', subTitle: 'Tiếp thị liên kết', items: [
    { path: '/collaborator/dashboard', label: 'Link & hoa hồng', icon: Link2 },
    { path: '/collaborator/wallet', label: 'Ví & rút tiền', icon: Wallet }, profile,
  ] },
  SYSTEM_MANAGER: { title: 'VẬN HÀNH', subTitle: 'Kiểm duyệt & hỗ trợ', items: [
    { path: '/admin/applications', label: 'Hồ sơ đối tác', icon: ShieldCheck }, { path: '/admin/products', label: 'Sản phẩm & đánh giá', icon: Package }, { path: '/admin/orders', label: 'Đơn & trả hàng', icon: ShoppingBag }, profile,
  ] },
  SYSTEM_ADMIN: { title: 'QUẢN TRỊ', subTitle: 'Quản trị hệ thống', items: [
    { path: '/admin/applications', label: 'Hồ sơ đối tác', icon: ShieldCheck }, { path: '/admin/products', label: 'Sản phẩm & đánh giá', icon: Package }, { path: '/admin/orders', label: 'Đơn & trả hàng', icon: ShoppingBag },
    { path: '/admin/vouchers', label: 'Voucher sàn', icon: Tag }, { path: '/admin/affiliate-oversight', label: 'Tiếp thị liên kết', icon: Link2 },
    { path: '/admin/wallets', label: 'Ví & đối soát', icon: Wallet }, { path: '/admin/policies', label: 'Phí & hoa hồng', icon: Settings }, profile,
  ] },
};
