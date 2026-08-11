"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PAGE_SIZE,
  type PageCursor,
  type PageResult,
} from "@/lib/firestore";

export function useFirestorePagination<T>(
  fetcher: (cursor: PageCursor) => Promise<PageResult<T>>,
  deps: unknown[],
  pageSize: number = PAGE_SIZE,
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [startCursors, setStartCursors] = useState<PageCursor[]>([null]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (pageNum: number, cursors: PageCursor[]) => {
      setLoading(true);
      setError(null);
      try {
        const cursor = cursors[pageNum - 1] ?? null;
        const result = await fetcher(cursor);
        setItems(result.items);
        setHasMore(result.hasMore);
        setPage(pageNum);
        setStartCursors(() => {
          const next = cursors.slice(0, pageNum);
          while (next.length < pageNum) next.push(null);
          next[pageNum] = result.lastDoc;
          return next;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Yüklenemedi");
        setItems([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetcher, ...deps],
  );

  // Reset to page 1 when deps change
  useEffect(() => {
    void loadPage(1, [null]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const onPrev = useCallback(() => {
    if (page <= 1 || loading) return;
    void loadPage(page - 1, startCursors);
  }, [page, loading, loadPage, startCursors]);

  const onNext = useCallback(() => {
    if (!hasMore || loading) return;
    void loadPage(page + 1, startCursors);
  }, [hasMore, loading, loadPage, page, startCursors]);

  const reload = useCallback(() => {
    void loadPage(page, startCursors);
  }, [loadPage, page, startCursors]);

  return {
    items,
    page,
    hasMore,
    loading,
    error,
    pageSize,
    onPrev,
    onNext,
    reload,
    setError,
  };
}
