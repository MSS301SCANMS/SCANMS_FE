export const HOME_CATEGORY_GROUPS = [
  { id: 'skin', label: 'Chăm sóc da', terms: ['cham soc da', 'duong da', 'skincare', 'serum', 'sua rua mat', 'chong nang'] },
  { id: 'makeup', label: 'Trang điểm', terms: ['trang diem', 'makeup', 'son moi', 'phan nen', 'mascara'] },
  { id: 'body', label: 'Chăm sóc cơ thể', terms: ['co the', 'body', 'sua tam', 'cham soc toc', 'dau goi'] },
  { id: 'health', label: 'Thực phẩm sức khỏe', terms: ['suc khoe', 'thuc pham', 'vitamin', 'health', 'dinh duong'] },
] as const;

export function normalizeCategory(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

export function matchesHomeCategory(category: string, groupId: string): boolean {
  const group = HOME_CATEGORY_GROUPS.find((candidate) => candidate.id === groupId);
  if (!group) return true;
  const normalized = normalizeCategory(category);
  return group.terms.some((term) => normalized.includes(term));
}
