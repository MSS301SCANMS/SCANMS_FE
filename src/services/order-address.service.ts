export interface ShippingWard {
  code: number;
  name: string;
}
export interface ShippingDistrict {
  code: number;
  name: string;
  wards: ShippingWard[];
}
export interface ShippingProvince {
  code: number;
  name: string;
  districts: ShippingDistrict[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";
const isWard = (value: unknown): value is ShippingWard =>
  isRecord(value) &&
  typeof value.code === "number" &&
  typeof value.name === "string";
const isDistrict = (value: unknown): value is ShippingDistrict =>
  isWard(value) &&
  isRecord(value) &&
  Array.isArray(value.wards) &&
  value.wards.every(isWard);
const isProvince = (value: unknown): value is ShippingProvince =>
  isWard(value) &&
  isRecord(value) &&
  Array.isArray(value.districts) &&
  value.districts.every(isDistrict);

export async function loadShippingAddresses(
  signal: AbortSignal,
): Promise<ShippingProvince[]> {
  const baseUrl =
    import.meta.env.VITE_MANUAL_ORDER_ADDRESS_API_URL ||
    "https://provinces.open-api.vn/api/v1/";
  const url = new URL(baseUrl);
  url.searchParams.set("depth", "3");
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
    });
  } catch {
    throw new Error(
      "Không tải được danh mục địa chỉ. Kiểm tra kết nối và thử lại",
    );
  }
  if (!response.ok)
    throw new Error("Không tải được danh mục địa chỉ. Vui lòng thử lại");
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.length || !data.every(isProvince))
    throw new Error("Danh mục địa chỉ không đúng cấu trúc tỉnh / huyện / xã");
  return data;
}
