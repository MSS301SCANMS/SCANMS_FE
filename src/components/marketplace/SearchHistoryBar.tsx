import type { SearchHistoryEntry } from '../../services/search-history.service';

export function SearchHistoryBar({ history, onSelect, onClear, error }: {
  history: SearchHistoryEntry[]; onSelect: (keyword: string) => void; onClear: () => void; error?: string;
}) {
  if (!history.length && !error) return null;
  return <section aria-label="Lịch sử tìm kiếm" className="mb-4 rounded-xl border border-[#EAE4D7] bg-white p-3 text-xs">
    <div className="flex items-center justify-between gap-4"><strong>Tìm kiếm gần đây</strong><button type="button" onClick={onClear} className="text-[#795A2D] underline">Xóa lịch sử</button></div>
    <div className="mt-2 flex flex-wrap gap-2">{history.slice(0, 8).map(entry => <button key={entry.eventId} type="button" onClick={() => onSelect(entry.keyword)} className="rounded-full border border-[#EAE4D7] px-3 py-1.5 text-[#795A2D]">{entry.keyword}</button>)}</div>
    {error && <p role="status" className="mt-2 text-[#7D715E]">{error}</p>}
  </section>;
}
