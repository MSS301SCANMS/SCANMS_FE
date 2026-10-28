import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthUser } from './useAuthUser';
import { getSessionId } from '../services/auth-session';
import { searchHistoryService, type SearchHistoryEntry } from '../services/search-history.service';

function guestSession() {
  let id = sessionStorage.getItem('scanms-search-session');
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('scanms-search-session', id); }
  return id;
}

export function useSearchHistory(keyword: string, resultCount: number, loading: boolean, filters: Record<string, string>) {
  const user = useAuthUser();
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const lastSearch = useRef('');
  const pending = useRef<Promise<SearchHistoryEntry> | null>(null);
  const revision = useRef(0);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const actor = user?.id || 'guest';
  const filtersKey = JSON.stringify(filters);
  const guestKey = 'scanms-search-history:' + guestSession();
  useEffect(() => {
    let active = true;
    const generation = ++revision.current;
    setHistory([]); setError('');
    if (user) void searchHistoryService.recent().then(rows => {
      if (active && generation === revision.current) setHistory(previous => {
        const merged = new Map(previous.map(entry => [entry.keyword.toLowerCase(), entry]));
        for (const row of Array.isArray(rows) ? rows : []) if (!merged.has(row.keyword.toLowerCase())) merged.set(row.keyword.toLowerCase(), row);
        return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
      });
    }).catch(() => {});
    else {
      try { setHistory(JSON.parse(sessionStorage.getItem(guestKey) || '[]')); } catch { setHistory([]); }
    }
    return () => { active = false; };
  }, [actor, reload, guestKey]);

  useEffect(() => {
    const query = keyword.trim().slice(0, 200);
    if (loading || !query) return;
    const key = `${actor}:${query}:${filtersKey}`;
    if (lastSearch.current !== key || !pending.current) {
      lastSearch.current = key;
      pending.current = searchHistoryService.record(query, resultCount, JSON.parse(filtersKey), guestSession());
    }
    const session = getSessionId();
    const generation = revision.current;
    let active = true;
    void pending.current.then((entry: SearchHistoryEntry) => {
      if (!active || session !== getSessionId() || generation !== revision.current) return;
      setError('');
      setHistory(previous => {
        const next = [entry, ...previous.filter(row => row.keyword.toLowerCase() !== query.toLowerCase())].slice(0, 20);
        if (!user) sessionStorage.setItem(guestKey, JSON.stringify(next));
        return next;
      });
    }).catch(() => { if (active) setError('Chưa lưu được lịch sử tìm kiếm.'); });
    return () => { active = false; };
  }, [actor, keyword, resultCount, loading, filtersKey, guestKey, reload]);

  const clear = useCallback(async () => {
    const session = getSessionId();
    revision.current++;
    try {
      if (user) await searchHistoryService.clear(); else sessionStorage.removeItem(guestKey);
      if (session === getSessionId()) { setHistory([]); setError(''); }
    } catch { setError('Chưa xóa được lịch sử. Vui lòng thử lại.'); }
  }, [actor, guestKey]);
  return { history, clear, error, retry: () => { lastSearch.current = ''; setReload(value => value + 1); } };
}
