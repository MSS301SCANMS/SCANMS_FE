import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/services/api';

/** Cancel obsolete reads; only the latest request may update the workspace. */
export function useWorkspaceResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const sequence = useRef(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const request = ++sequence.current;
    setLoading(true);
    setError('');
    void api
      .get<T>(url, {
        signal: controller.signal,
        headers: { 'x-skip-cache': '1' },
      })
      .then((response) => {
        if (request !== sequence.current || controller.signal.aborted) return;
        setData(response.data);
        setUpdatedAt(new Date());
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted && request === sequence.current)
          setError(
            cause instanceof Error ? cause.message : 'Không tải được dữ liệu.',
          );
      })
      .finally(() => {
        if (!controller.signal.aborted && request === sequence.current)
          setLoading(false);
      });
    return () => controller.abort();
  }, [url, revision]);
  return { data, loading, error, updatedAt, refresh };
}
