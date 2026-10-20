export const isGhnCarrier = (carrier: unknown): boolean =>
  typeof carrier === 'string' && /\bGHN\b|giao\s*hàng\s*nhanh/i.test(carrier);

export function getGhnTrackingCode(raw: Record<string, any> | null | undefined): string | null {
  const official = typeof raw?.ghnOrderCode === 'string' ? raw.ghnOrderCode.trim() : '';
  if (official) return official;
  const manual = typeof raw?.trackingNumber === 'string' ? raw.trackingNumber.trim() : '';
  return manual && isGhnCarrier(raw?.carrierName || raw?.shippingCarrier || raw?.carrier) ? manual : null;
}

export const GHN_MILESTONES = [
  { title: 'Bưu tá đã lấy hàng tại kho Shop', statuses: ['picked'] },
  { title: 'Nhập kho trung chuyển', statuses: ['storing', 'sorting', 'transporting'] },
  { title: 'Shipper đang đi giao', statuses: ['delivering', 'money_collect_delivering'] },
  { title: 'Giao hàng thành công', statuses: ['delivered'] },
];
