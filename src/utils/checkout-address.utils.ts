import type { CustomerAddress } from '../services/customer.service';
import type { ShippingProvince } from '../services/order-address.service';

const normalizeAdministrativeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\u0111/g, 'd')
    .replace(/\b(thanh pho|tinh|quan|huyen|thi xa|thi tran|phuong|xa)\b/g, '')
    .replace(/[^a-z0-9]/g, '');

const administrativeNamesMatch = (left?: string | null, right?: string | null) => {
  if (!left || !right) return false;
  const normalizedLeft = normalizeAdministrativeName(left);
  const normalizedRight = normalizeAdministrativeName(right);
  return Boolean(normalizedLeft && normalizedLeft === normalizedRight);
};

const findAdministrativeUnit = <T extends { code: number; name: string }>(
  units: T[],
  code?: string | null,
  names: Array<string | null | undefined> = [],
) => {
  const codeMatch = code
    ? units.find((unit) => String(unit.code) === String(code))
    : undefined;
  return (
    codeMatch ||
    units.find((unit) => names.some((name) => administrativeNamesMatch(unit.name, name)))
  );
};

export function resolveSavedShippingAddress(
  address: CustomerAddress,
  provinces: ShippingProvince[],
) {
  const segments = address.detailAddress
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  const province = findAdministrativeUnit(
    provinces,
    address.provinceCode,
    [address.provinceName, ...segments],
  );
  const district = province
    ? findAdministrativeUnit(
        province.districts,
        address.districtCode,
        [address.districtName, ...segments],
      )
    : undefined;
  const ward = district
    ? findAdministrativeUnit(
        district.wards,
        address.wardCode,
        [address.wardName, ...segments],
      )
    : undefined;

  let detailAddress = address.detailAddress;
  const hasStructuredCodes = Boolean(
    address.provinceCode && address.districtCode && address.wardCode,
  );

  // Older checkout records put the full address in detailAddress and saved
  // placeholders instead of administrative codes. Remove only the matched
  // administrative suffix; keep the original text if it cannot be resolved.
  if (!hasStructuredCodes && province && district && ward) {
    const firstAdministrativeSegment = segments.findIndex((segment) =>
      [ward.name, district.name, province.name].some((name) =>
        administrativeNamesMatch(segment, name),
      ),
    );
    if (firstAdministrativeSegment > 0) {
      detailAddress = segments.slice(0, firstAdministrativeSegment).join(', ');
    }
  }

  return {
    detailAddress,
    provinceCode: province ? String(province.code) : '',
    districtCode: district ? String(district.code) : '',
    wardCode: ward ? String(ward.code) : '',
  };
}

/** Geocoder names must resolve within one province/district; never reuse old codes. */
export function resolveMapShippingAddress(
  address: { provinceName: string; districtName: string; wardName: string },
  provinces: ShippingProvince[],
) {
  const matches = provinces.filter(province => administrativeNamesMatch(province.name, address.provinceName));
  const province = matches.length === 1 ? matches[0] : undefined;
  const districts = province?.districts.filter(district => administrativeNamesMatch(district.name, address.districtName)) || [];
  let district = districts.length === 1 ? districts[0] : undefined;
  // Some reverse geocoders omit the old district level. Accept a ward only
  // when its name identifies exactly one district in the matched province.
  if (province && !district && !address.districtName) {
    const candidates = province.districts.filter(candidate => candidate.wards.some(ward => administrativeNamesMatch(ward.name, address.wardName)));
    if (candidates.length === 1) district = candidates[0];
  }
  const wards = district?.wards.filter(ward => administrativeNamesMatch(ward.name, address.wardName)) || [];
  const ward = wards.length === 1 ? wards[0] : undefined;
  return {
    provinceCode: province ? String(province.code) : '',
    districtCode: district ? String(district.code) : '',
    wardCode: ward ? String(ward.code) : '',
  };
}

export function formatSavedAddressOption(
  address: CustomerAddress,
  provinces: ShippingProvince[],
) {
  const resolved = resolveSavedShippingAddress(address, provinces);
  const segments = address.detailAddress.split(',').map((part) => part.trim()).filter(Boolean);
  const street = resolved.detailAddress.split(',')[0]?.trim() || 'Địa chỉ đã lưu';
  const shortStreet = street.length > 36 ? `${street.slice(0, 35).trimEnd()}…` : street;
  const district = address.districtName === 'Địa chỉ nhận hàng'
    ? segments.length >= 3 ? segments.at(-2) : ''
    : address.districtName;
  const area = district
    ?.replace(/^(thành phố|thị xã|quận|huyện|thị trấn)\s+/iu, '')
    .trim();

  return `${address.isDefault ? '⭐ Mặc định · ' : ''}${shortStreet}${area ? ` · ${area}` : ''}`;
}
