export function collectCheckoutVouchers<T extends { id: string }>(
  lists: T[][],
): T[] {
  return [
    ...new Map(lists.flat().map((voucher) => [voucher.id, voucher])).values(),
  ];
}

export function checkoutVoucherDisabledReason(
  voucher: { minimumOrderAmount: number | null; benefitType?: string; expiresAt?: string | null; remainingUses?: number | null },
  goodsSubtotal: number,
  shippingFee: number,
  now = Date.now(),
): string | null {
  if (voucher.expiresAt && (!Number.isFinite(Date.parse(voucher.expiresAt)) || Date.parse(voucher.expiresAt) <= now))
    return 'Voucher đã hết hạn';
  if (voucher.remainingUses != null && voucher.remainingUses <= 0)
    return 'Voucher đã hết lượt sử dụng';
  if (goodsSubtotal < (voucher.minimumOrderAmount || 0))
    return "Chưa đạt giá trị đơn tối thiểu";
  if (voucher.benefitType === "SHIPPING" && shippingFee <= 0)
    return "Cần có phí vận chuyển để dùng mã này";
  return null;
}
