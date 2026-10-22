/** Accept province/ward addresses and legacy addresses that include a district. */
export function isCompleteWarehouseAddress(value: string): boolean {
  const text = value.trim();
  const parts = text.split(',').map(part => part.trim());
  return text.length <= 500 && parts.length >= 3 && parts.every(Boolean);
}

export const WAREHOUSE_ADDRESS_HINT = 'Nhập số nhà/đường, phường/xã, tỉnh/thành; có thể thêm quận/huyện theo địa chỉ cũ.';
