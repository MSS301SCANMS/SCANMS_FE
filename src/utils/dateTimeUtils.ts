
export const getVietnamCurrentMonthYear = (): { year: string; month: string } => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find((p) => p.type === 'year')?.value || String(new Date().getFullYear());
    const month =
      parts.find((p) => p.type === 'month')?.value ||
      String(new Date().getMonth() + 1).padStart(2, '0');
    return { year, month };
  } catch {
    const now = new Date();
    return {
      year: String(now.getFullYear()),
      month: String(now.getMonth() + 1).padStart(2, '0'),
    };
  }
};

export const getVietnamCurrentYearMonthString = (): string => {
  const { year, month } = getVietnamCurrentMonthYear();
  return `${year}-${month}`;
};
