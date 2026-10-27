/** Shared fashion tags for merchant products + customer preferences + outfit AI. */

export const APPAREL_TYPES = [
  { value: 'SHOE', label: 'Giày dép' },
  { value: 'HAT', label: 'Nón / mũ' },
  { value: 'TOP', label: 'Áo' },
  { value: 'BOTTOM', label: 'Quần' },
  { value: 'OUTERWEAR', label: 'Áo khoác' },
  { value: 'DRESS', label: 'Đầm / váy' },
  { value: 'SET', label: 'Bộ trang phục' },
  { value: 'OTHER', label: 'Khác' },
] as const;

export const FASHION_STYLES = [
  { value: 'STREETWEAR', label: 'Streetwear' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'FORMAL', label: 'Formal / công sở' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'CHIC', label: 'Chic' },
  { value: 'MINIMAL', label: 'Minimal' },
  { value: 'OTHER', label: 'Khác' },
] as const;

export const GENDER_TARGETS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'UNISEX', label: 'Unisex' },
] as const;

export const FASHION_COLOR_OPTIONS = [
  'black', 'white', 'grey', 'beige', 'brown', 'navy', 'blue', 'green', 'red', 'pink', 'yellow', 'orange', 'purple', 'cream',
] as const;

export type ApparelType = (typeof APPAREL_TYPES)[number]['value'];
export type FashionStyle = (typeof FASHION_STYLES)[number]['value'];
export type GenderTarget = (typeof GENDER_TARGETS)[number]['value'];

export type FashionProductTags = {
  apparelType?: ApparelType | '';
  fashionStyle?: FashionStyle | '';
  genderTarget?: GenderTarget | '';
  colorTags?: string[];
};

export type CustomerFashionPreferences = {
  preferredColors?: string[];
  preferredStyles?: FashionStyle[];
  preferredGenderTarget?: GenderTarget | '';
};

export const FASHION_ATTR = {
  apparelType: 'apparelType',
  fashionStyle: 'fashionStyle',
  genderTarget: 'genderTarget',
  colorTags: 'colorTags',
} as const;

export function readFashionTags(attributes?: Record<string, unknown> | null): FashionProductTags {
  const attrs = attributes && typeof attributes === 'object' ? attributes : {};
  const colors = attrs[FASHION_ATTR.colorTags];
  return {
    apparelType: (String(attrs[FASHION_ATTR.apparelType] || '') as ApparelType) || '',
    fashionStyle: (String(attrs[FASHION_ATTR.fashionStyle] || '') as FashionStyle) || '',
    genderTarget: (String(attrs[FASHION_ATTR.genderTarget] || '') as GenderTarget) || '',
    colorTags: Array.isArray(colors)
      ? colors.map((c) => String(c).toLowerCase()).filter(Boolean)
      : typeof colors === 'string'
        ? colors.split(/[,;/|]/).map((c) => c.trim().toLowerCase()).filter(Boolean)
        : [],
  };
}

export function mergeFashionTagsIntoAttributes(
  attributes: Record<string, unknown> | undefined,
  tags: FashionProductTags,
): Record<string, unknown> {
  const next = { ...(attributes || {}) };
  if (tags.apparelType) next[FASHION_ATTR.apparelType] = tags.apparelType;
  else delete next[FASHION_ATTR.apparelType];
  if (tags.fashionStyle) next[FASHION_ATTR.fashionStyle] = tags.fashionStyle;
  else delete next[FASHION_ATTR.fashionStyle];
  if (tags.genderTarget) next[FASHION_ATTR.genderTarget] = tags.genderTarget;
  else delete next[FASHION_ATTR.genderTarget];
  if (tags.colorTags?.length) next[FASHION_ATTR.colorTags] = tags.colorTags;
  else delete next[FASHION_ATTR.colorTags];
  return next;
}
