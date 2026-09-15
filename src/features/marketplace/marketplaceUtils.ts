import type { CartLine, Creator, Product } from './marketplace.types';

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

export function calculateCart(lines: CartLine[], products: Product[], creator: Creator) {
  const subtotal = lines.reduce((sum, line) => sum + (products.find(p => p.id === line.productId)?.price ?? 0) * line.quantity, 0);

  const eligibleSubtotal = lines.reduce((sum, line) => {
    const product = products.find(p => p.id === line.productId);
    return sum + (product?.kol?.coupon === creator.coupon ? (product.price ?? 0) * line.quantity : 0);
  }, 0);
  const minimum = Number(creator.voucherInfo.minOrder.replace(/\D/g, ''));
  const maximum = Number(creator.voucherInfo.maxDiscount.replace(/\D/g, ''));
  const discount = eligibleSubtotal >= minimum ? Math.min(Math.round(eligibleSubtotal * creator.voucherInfo.discountPct / 100), maximum) : 0;
  return { subtotal, discount, total: subtotal - discount };
}
