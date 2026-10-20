import { useCallback, useRef, useState, type SetStateAction } from 'react';

export function useConversationDraft(
  userId?: string,
  conversationId?: string | null,
) {
  const key =
    userId && conversationId
      ? `scanms:chat:draft:${userId}:${conversationId}`
      : '';
  const cache = useRef(new Map<string, string>());
  const [, refresh] = useState(0);
  const read = (draftKey: string) => {
    if (!draftKey) return '';
    if (cache.current.has(draftKey)) return cache.current.get(draftKey)!;
    let saved = '';
    try {
      saved = sessionStorage.getItem(draftKey) || '';
    } catch {
      /* In-memory drafts remain available. */
    }
    cache.current.set(draftKey, saved);
    return saved;
  };
  const value = read(key);
  const setValue = useCallback(
    (action: SetStateAction<string>) => {
      if (!key) return;
      let previous = cache.current.get(key) || '';
      if (!cache.current.has(key)) {
        try {
          previous = sessionStorage.getItem(key) || '';
        } catch {
          /* Storage is optional. */
        }
      }
      const next = (
        typeof action === 'function' ? action(previous) : action
      ).slice(0, 5000);
      cache.current.set(key, next);
      try {
        if (next) sessionStorage.setItem(key, next);
        else sessionStorage.removeItem(key);
      } catch {
        /* Keep the draft in memory. */
      }
      refresh((revision) => revision + 1);
    },
    [key],
  );
  return [value, setValue] as const;
}
