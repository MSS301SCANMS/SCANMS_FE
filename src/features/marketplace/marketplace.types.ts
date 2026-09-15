export type Category = 'all' | 'skincare' | 'home' | 'tech';
export interface Product {
  id: string; name: string; brand: string; category: Exclude<Category, 'all'>;
  categoryLabel: string; rating: number; reviews: number; sold: string;
  origPrice: number; price: number; kolDiscountPrice: number; image: string;
  kol: { name: string; handle: string; coupon: string; tier: string };
  badge?: string;
}
export interface Creator {
  id: string; name: string; handle: string; channel: string; platform: string;
  platformIcon: string; followers: string; avatar: string; avatarImg: string;
  coupon: string; tier: string; rating: string; tag: string; niche: string;
  sales: string; bg: string; color: string; bio: string;
  voucherInfo: { code: string; discount: string; discountPct: number;
    maxDiscount: string; minOrder: string; appliesTo: string; expiry: string };
}
export interface ReviewVideo {
  id: string; title: string; kol: string; handle: string; views: string;
  duration: string; productId: string; coupon: string; thumbnail: string;
}
export interface CartLine { productId: string; quantity: number }
export interface DemoOrder {
  id: string; phone: string; name: string; address: string; createdAt: string;
  lines: CartLine[]; subtotal: number; discount: number; total: number; coupon: string;
}
export type MarketplaceDialog =
  | { kind: 'guide' }
  | { kind: 'policy'; policy: 'guest' | 'voucher' | 'return' }
  | { kind: 'creator'; creator: Creator }
  | { kind: 'terms'; creator: Creator }
  | { kind: 'product'; product: Product }
  | { kind: 'video'; video: ReviewVideo }
  | { kind: 'cart' } | { kind: 'checkout' } | null;
