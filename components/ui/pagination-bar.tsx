"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaginationBar({
  page,
  hasMore,
  loading,
  onPrev,
  onNext,
  pageSize,
  itemCount,
}: {
  page: number;
  hasMore: boolean;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  pageSize: number;
  itemCount: number;
}) {
  if (page <= 1 && !hasMore && itemCount === 0) return null;

  const from = itemCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = (page - 1) * pageSize + itemCount;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-sm text-slate-500">
        {itemCount === 0
          ? "Kayıt yok"
          : `${from}–${to} gösteriliyor · Sayfa ${page}`}
        {hasMore ? " · devamı var" : ""}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={page <= 1 || loading}
          onClick={onPrev}
          type="button"
        >
          <ChevronLeft size={16} />
          Önceki
        </Button>
        <Button
          variant="secondary"
          disabled={!hasMore || loading}
          onClick={onNext}
          type="button"
        >
          Sonraki
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
