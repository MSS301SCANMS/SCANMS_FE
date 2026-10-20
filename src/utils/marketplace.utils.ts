import type { CartLine, Creator, Product } from '@/types/marketplace.types';

export function formatMoney(value: number | string): string {
  const num = typeof value === 'number' ? value : Number(value) || 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function calculateCart(lines: CartLine[], products: Product[], creator: Creator) {
  const subtotal = lines.reduce(
    (sum, line) => sum + (products.find((p) => p.id === line.productId)?.price ?? 0) * line.quantity,
    0
  );

  const eligibleSubtotal = lines.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    return sum + (product?.kol?.coupon === creator.coupon ? (product.price ?? 0) * line.quantity : 0);
  }, 0);
  const minimum = Number(creator.voucherInfo.minOrder.replace(/\D/g, ''));
  const maximum = Number(creator.voucherInfo.maxDiscount.replace(/\D/g, ''));
  const discount =
    eligibleSubtotal >= minimum
      ? Math.min(Math.round((eligibleSubtotal * creator.voucherInfo.discountPct) / 100), maximum)
      : 0;
  return { subtotal, discount, total: subtotal - discount };
}

export function getSafeProductImageUrl(
  imageUrl?: string | null,
  title?: string,
  categoryName?: string
): string {
  if (
    imageUrl &&
    typeof imageUrl === 'string' &&
    imageUrl.trim() &&
    !imageUrl.includes('data:image/svg+xml') &&
    !imageUrl.includes('scanms-placeholder') &&
    !imageUrl.includes('placeholder.png') &&
    !imageUrl.includes('placeholder')
  ) {
    return imageUrl.trim();
  }

  // A missing photo must not silently display a different product or brand.
  // Keep this fallback local so upstream image outages cannot break it too.
  void title;
  void categoryName;
  return '/assets/product-placeholder.svg';
}
