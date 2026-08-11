"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Check, Pencil, Trash2, X } from "lucide-react";
import {
  deleteContent,
  fetchContentsPage,
  PAGE_SIZE,
  setContentStatus,
  updateContent,
  type PageCursor,
} from "@/lib/firestore";
import { useFirestorePagination } from "@/lib/use-firestore-pagination";
import type { ContentDoc, ModerationStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ContentMedia } from "@/components/admin/content-media";
import { PaginationBar } from "@/components/ui/pagination-bar";

const filters: { key: ModerationStatus | "all"; label: string }[] = [
  { key: "pending", label: "Bekleyen" },
  { key: "approved", label: "Onaylı" },
  { key: "rejected", label: "Reddedilen" },
  { key: "all", label: "Tümü" },
];

export default function AdminContentsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Yükleniyor…
        </div>
      }
    >
      <AdminContentsInner />
    </Suspense>
  );
}

function AdminContentsInner() {
  const searchParams = useSearchParams();
  const initial =
    (searchParams.get("status") as ModerationStatus | "all") || "pending";
  const [status, setStatus] = useState<ModerationStatus | "all">(
    ["pending", "approved", "rejected", "all"].includes(initial)
      ? initial
      : "pending",
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ContentDoc | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (["pending", "approved", "rejected", "all"].includes(initial)) {
      setStatus(initial);
    }
  }, [initial]);

  const fetcher = useCallback(
    (cursor: PageCursor) =>
      fetchContentsPage({ status, pageSize: PAGE_SIZE, cursor }),
    [status],
  );

  const {
    items,
    page,
    hasMore,
    loading,
    error,
    pageSize,
    onPrev,
    onNext,
    reload,
  } = useFirestorePagination(fetcher, [status]);

  async function moderate(id: string, next: ModerationStatus) {
    setBusyId(id);
    try {
      await setContentStatus(id, next);
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "İşlem başarısız");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Bu içeriği silmek istediğinize emin misiniz?")) return;
    setBusyId(id);
    try {
      await deleteContent(id);
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusyId(null);
    }
  }

  async function saveEdit() {
    if (!editItem) return;
    setBusyId(editItem.id);
    try {
      await updateContent(editItem.id, { description: editText });
      setEditItem(null);
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Güncellenemedi");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">İçerikler</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mobilden paylaşılan içerikleri onaylayın veya reddedin. Sayfa başı{" "}
            {pageSize} kayıt.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                status === f.key
                  ? "bg-[var(--brand)] text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Yükleniyor…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
          Bu filtrede içerik yok.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative">
                <ContentMedia
                  mediaUrl={item.mediaUrl}
                  mediaPath={item.mediaPath}
                  mediaType={item.mediaType}
                />
                <div className="absolute left-3 top-3 z-10">
                  <Badge tone={item.status}>{item.status}</Badge>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <p className="line-clamp-3 text-sm text-slate-700">
                  {item.description || "Açıklama yok"}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>❤ {item.likeCount}</span>
                  <span>💬 {item.commentCount}</span>
                  <span>👁 {item.viewCount}</span>
                  <span>
                    {item.createdAt
                      ? format(item.createdAt, "dd.MM.yyyy HH:mm")
                      : "—"}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {item.mediaType} · owner: {item.ownerUid.slice(0, 8)}…
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status !== "approved" ? (
                    <Button
                      variant="success"
                      disabled={busyId === item.id}
                      onClick={() => moderate(item.id, "approved")}
                    >
                      <Check size={16} /> Onayla
                    </Button>
                  ) : null}
                  {item.status !== "rejected" ? (
                    <Button
                      variant="danger"
                      disabled={busyId === item.id}
                      onClick={() => moderate(item.id, "rejected")}
                    >
                      <X size={16} /> Reddet
                    </Button>
                  ) : null}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditItem(item);
                      setEditText(item.description);
                    }}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busyId === item.id}
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <PaginationBar
        page={page}
        hasMore={hasMore}
        loading={loading}
        onPrev={onPrev}
        onNext={onNext}
        pageSize={pageSize}
        itemCount={items.length}
      />

      <Modal
        open={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        title="İçerik düzenle"
      >
        <div className="space-y-4">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none ring-[var(--brand)] focus:ring-2"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditItem(null)}>
              İptal
            </Button>
            <Button onClick={saveEdit} disabled={busyId === editItem?.id}>
              Kaydet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
