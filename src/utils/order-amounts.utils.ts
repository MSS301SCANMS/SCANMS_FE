/** Item revenue and carrier charges must remain separate in order history. */
export function checkoutAmounts(raw: any) {
  const lines: any[] = (raw?.sellerOrders || []).flatMap((seller: any) => seller.items || []);
  const shippingFee = Number(raw?.shippingFee ?? raw?.sagaState?.shippingFeeVnd ?? 0);
  const discountAmount = Number(raw?.discountAmount ?? raw?.totalDiscountVnd ?? lines.reduce((sum, item) => sum + Number(item.discountAmountVnd || 0), 0));
  const finalAmount = Number(raw?.finalAmount ?? raw?.payableVnd ?? 0);
  const subtotalAmount = Number(raw?.subtotalAmount ?? raw?.totalGrossVnd ?? (lines.length
    ? lines.reduce((sum, item) => sum + Number(item.grossAmountVnd ?? Number(item.unitPrice || 0) * Number(item.quantity || 0)), 0)
    : Math.max(0, finalAmount - shippingFee + discountAmount)));
  return { subtotalAmount, discountAmount, shippingFee, finalAmount };
}
