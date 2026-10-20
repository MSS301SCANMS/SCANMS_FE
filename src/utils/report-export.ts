export function csvCell(value: unknown): string {
  let text = value == null ? '' : String(value);
  // Prevent spreadsheet formula execution, including leading invisible whitespace.
  if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text) && typeof value !== 'number')
    text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function reportCsv(rows: unknown[][]): string {
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}
export function downloadReport(filename: string, rows: unknown[][]): void {
  const url = URL.createObjectURL(
    new Blob([reportCsv(rows)], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function vietnamDateRange(
  start: string,
  end: string,
): { startDate: string; endDate: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end))
    throw new Error('Vui lòng chọn đủ hai ngày hợp lệ.');
  const first = new Date(`${start}T00:00:00+07:00`);
  const last = new Date(`${end}T23:59:59.999+07:00`);
  if (
    !Number.isFinite(first.getTime()) ||
    !Number.isFinite(last.getTime()) ||
    first > last
  )
    throw new Error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
  const localDay = (date: Date) =>
    new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 10);
  if (localDay(first) !== start || localDay(last) !== end)
    throw new Error('Ngày được chọn không tồn tại.');
  if (last.getTime() - first.getTime() > 366 * 86400000)
    throw new Error('Vui lòng chọn khoảng thời gian tối đa 366 ngày.');
  return { startDate: first.toISOString(), endDate: last.toISOString() };
}
