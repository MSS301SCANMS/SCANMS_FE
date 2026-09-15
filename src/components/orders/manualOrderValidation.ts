import type { Product } from "../../services/product.service";

export interface ManualItemForm {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
}
export const moneyInCents = (value: string): number | null => {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= 999999999999999 ? cents : null;
};

export function validateManualItems(
  items: ManualItemForm[],
  products: Product[],
): string | null {
  if (!items.length || items.length > 500)
    return "Đơn hàng cần từ 1 đến 500 dòng sản phẩm";
  const quantities = new Map<string, number>();
  let subtotal = 0;
  for (const [index, item] of items.entries()) {
    const product = products.find((p) => p.id === item.productId && p.isActive);
    if (!product) return `Dòng ${index + 1}: vui lòng chọn sản phẩm đang bán`;
    const quantity = Number(item.quantity);
    if (
      !/^\d+$/.test(item.quantity) ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 2147483647
    )
      return `Dòng ${index + 1}: số lượng phải là số nguyên lớn hơn 0`;
    const price = moneyInCents(item.unitPrice);
    if (price === null || price <= 0)
      return `Dòng ${index + 1}: đơn giá phải lớn hơn 0, tối đa 2 chữ số thập phân`;
    quantities.set(product.id, (quantities.get(product.id) ?? 0) + quantity);
    if (quantities.get(product.id)! > product.stockQuantity)
      return `Dòng ${index + 1}: tổng số lượng ${product.title} vượt tồn kho (${product.stockQuantity})`;
    subtotal += price * quantity;
    if (!Number.isSafeInteger(subtotal) || subtotal > 999999999999999)
      return "Tổng tiền hàng vượt giới hạn";
  }
  return null;
}

export function validateExcelFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".xlsx"))
    return "Chỉ hỗ trợ file Excel .xlsx";
  if (file.size === 0) return "File Excel rỗng";
  if (file.size > 5 * 1024 * 1024) return "File Excel không được vượt quá 5 MB";
  return null;
}
