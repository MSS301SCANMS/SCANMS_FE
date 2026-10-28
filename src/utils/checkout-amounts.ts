export function listedUnitPrice(item: { price: number; listPrice?: number }): number {
  return Number.isSafeInteger(item.listPrice) && item.listPrice! >= item.price ? item.listPrice! : item.price;
}

export function listedGoodsTotals(items: Array<{ price: number; listPrice?: number; quantity: number }>) {
  let listedSubtotal = 0;
  let saleSubtotal = 0;
  for (const item of items) {
    listedSubtotal += listedUnitPrice(item) * item.quantity;
    saleSubtotal += item.price * item.quantity;
  }
  return { listedSubtotal, directDiscount: listedSubtotal - saleSubtotal, saleSubtotal };
}

export function insufficientWalletMessage(balance: number, total: number): string | null {
  if (!Number.isFinite(balance) || !Number.isFinite(total)) return 'Chưa kiểm tra được số dư hoặc tổng thanh toán. Vui lòng tải lại trước khi đặt hàng.';
  if (balance >= total) return null;
  const money = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  return `Ví có ${money(balance)}, đơn cần ${money(total)}. Bạn còn thiếu ${money(total - balance)}. Vui lòng nạp thêm tiền hoặc đổi phương thức thanh toán.`;
}
