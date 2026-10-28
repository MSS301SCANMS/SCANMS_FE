import api from './api';

export interface SearchHistoryEntry { eventId: string; keyword: string; resultCount: number; createdAt: string }
const unwrap = (response: any) => response?.result ?? response?.data?.result ?? response?.data ?? response;
export const searchHistoryService = {
  async record(keyword: string, resultCount: number, filters: Record<string, string>, sessionId: string) {
    return unwrap(await api.post('/public/search-events', { requestId: crypto.randomUUID(), sessionId, keyword, resultCount, filters }));
  },
  async recent(): Promise<SearchHistoryEntry[]> {
    return unwrap(await api.get('/search-history', { headers: { 'x-skip-cache': 'true' } }));
  },
  async clear() { await api.delete('/search-history'); },
};
