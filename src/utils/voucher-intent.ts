export type VoucherSlot = "SHOP" | "PLATFORM" | "SHIPPING";

export function voucherSlot(voucher: {
  fundingSource?: string;
  benefitType?: string;
}): VoucherSlot {
  // Shipping takes precedence: platform-funded shipping is not a goods discount.
  if (voucher.benefitType === "SHIPPING") return "SHIPPING";
  return voucher.fundingSource === "PLATFORM_FUNDED" ? "PLATFORM" : "SHOP";
}

export function voucherProductUrl(productId: string, code: string): string {
  return `/products/${encodeURIComponent(productId)}?${new URLSearchParams({ voucher: code.trim().toUpperCase() })}`;
}
