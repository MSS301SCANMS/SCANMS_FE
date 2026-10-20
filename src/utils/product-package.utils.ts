export function isValidEan13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  const sum = [...value.slice(0, 12)].reduce(
    (total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1),
    0,
  );
  return (10 - (sum % 10)) % 10 === Number(value[12]);
}

type PackageValues = { barcode?: string | null; packageWeight?: number | null;
  packageLength?: number | null; packageWidth?: number | null; packageHeight?: number | null };
type PackageForm = { barcode: string; packageWeight: number | ''; packageLength: number | '';
  packageWidth: number | ''; packageHeight: number | '' };

/** Legacy products may update sample policy without inventing missing physical measurements. */
export function productPackageInput(form: PackageForm, previous?: PackageValues | null): PackageValues {
  const result: PackageValues = {};
  if (!previous || form.barcode.trim() || previous.barcode) {
    if (!isValidEan13(form.barcode.trim())) throw new Error('Nhập barcode EAN-13 gồm 13 chữ số, đúng số kiểm tra trên bao bì.');
    result.barcode = form.barcode.trim();
  }
  for (const key of ['packageWeight', 'packageLength', 'packageWidth', 'packageHeight'] as const) {
    const value = form[key];
    if (previous && value === '' && previous[key] == null) continue;
    if (value === '' || !Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > (key === 'packageWeight' ? 30000 : 150)) {
      throw new Error('Nhập số đo đóng gói thực tế: khối lượng 1–30.000 g, mỗi chiều 1–150 cm, đều là số nguyên.');
    }
    result[key] = Number(value);
  }
  return result;
}
