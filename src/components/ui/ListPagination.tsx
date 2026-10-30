type ListPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label?: string;
  className?: string;
};

export function ListPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  label = 'mục',
  className = '',
}: ListPaginationProps) {
  if (total <= 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Phân trang"
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE4D7] bg-[#FAF8F5]/80 px-3 py-3 sm:px-4 ${className}`}
    >
      <p className="m-0 text-[11px] text-[#7D715E]">
        Hiển thị <strong className="text-[#1A1612]">{from}–{to}</strong> / {total} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="min-h-9 rounded-lg border border-[#EAE4D7] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1612] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trước
        </button>
        <span className="min-w-[4.5rem] text-center text-xs font-semibold tabular-nums text-[#1A1612]">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="min-h-9 rounded-lg border border-[#EAE4D7] bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1612] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </nav>
  );
}
