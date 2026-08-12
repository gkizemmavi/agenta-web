"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Check, Eye, EyeOff, Pencil, Trash2, X } from "lucide-react";
import {
  deleteListing,
  fetchListingsPage,
  PAGE_SIZE,
  setListingStatus,
  updateListing,
  type PageCursor,
} from "@/lib/firestore";
import { useFirestorePagination } from "@/lib/use-firestore-pagination";
import {
  LISTING_COLLECTIONS,
  type ListingCollection,
  type ListingDoc,
  type ModerationStatus,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PaginationBar } from "@/components/ui/pagination-bar";

const statusFilters: { key: ModerationStatus | "all"; label: string }[] = [
  { key: "pending", label: "Bekleyen" },
  { key: "approved", label: "Onaylı" },
  { key: "rejected", label: "Reddedilen" },
  { key: "all", label: "Tümü" },
];

export default function AdminListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Yükleniyor…
        </div>
      }
    >
      <AdminListingsInner />
    </Suspense>
  );
}

function AdminListingsInner() {
  const searchParams = useSearchParams();
  const initialStatus =
    (searchParams.get("status") as ModerationStatus | "all") || "pending";
  const initialCollection =
    (searchParams.get("collection") as ListingCollection | "all") || "all";

  const [status, setStatus] = useState<ModerationStatus | "all">(
    ["pending", "approved", "rejected", "all"].includes(initialStatus)
      ? initialStatus
      : "pending",
  );
  const [collection, setCollection] = useState<ListingCollection | "all">(
    initialCollection === "all" ||
      LISTING_COLLECTIONS.some((c) => c.key === initialCollection)
      ? initialCollection
      : "all",
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ListingDoc | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (["pending", "approved", "rejected", "all"].includes(initialStatus)) {
      setStatus(initialStatus);
    }
  }, [initialStatus]);

  const fetcher = useCallback(
    (cursor: PageCursor) =>
      fetchListingsPage({
        collection,
        status,
        pageSize: PAGE_SIZE,
        cursor,
      }),
    [collection, status],
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
  } = useFirestorePagination(fetcher, [collection, status]);

  async function moderate(item: ListingDoc, next: ModerationStatus) {
    setBusyId(item.id);
    try {
      await setListingStatus(item.collection, item.id, next);
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "İşlem başarısız");
    } finally {
      setBusyId(null);
    }
  }

  async function togglePublish(item: ListingDoc) {
    setBusyId(item.id);
    try {
      await updateListing(item.collection, item.id, {
        isPublished: !item.isPublished,
        status: !item.isPublished ? "approved" : item.status,
      });
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Güncellenemedi");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: ListingDoc) {
    if (!confirm("İlanı silmek istediğinize emin misiniz?")) return;
    setBusyId(item.id);
    try {
      await deleteListing(item.collection, item.id);
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
      const payload: Record<string, unknown> = {
        title,
        description,
      };
      if (price !== "") payload.price = Number(price);
      await updateListing(editItem.collection, editItem.id, payload);
      setEditItem(null);
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Güncellenemedi");
    } finally {
      setBusyId(null);
    }
  }

  const collectionLabel = (key: ListingCollection) =>
    LISTING_COLLECTIONS.find((c) => c.key === key)?.label ?? key;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">İlanlar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Paylaşılan ilanlar onay bekler. Onaylayınca mobilde yayınlanır.
            Sayfa başı {pageSize} kayıt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={collection}
            onChange={(e) =>
              setCollection(e.target.value as ListingCollection | "all")
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none ring-[var(--brand)] focus:ring-2"
          >
            <option value="all">Tüm kategoriler</option>
            {LISTING_COLLECTIONS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          {statusFilters.map((f) => (
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">İlan</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Fiyat</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Tarih</th>
                <th className="px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Yükleniyor…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    İlan bulunamadı.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={`${item.collection}-${item.id}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.photoUrls?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.photoUrls[0]}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                            N/A
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-xs text-slate-500">
                            {item.location || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {collectionLabel(item.collection)}
                    </td>
                    <td className="px-4 py-3">
                      {item.price != null
                        ? `${item.price.toLocaleString("tr-TR")} ₺`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={item.status ?? "pending"}>
                          {item.status ?? "pending"}
                        </Badge>
                        <Badge tone={item.isPublished ? "success" : "warn"}>
                          {item.isPublished ? "Yayında" : "Gizli"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.createdAt
                        ? format(item.createdAt, "dd.MM.yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.status !== "approved" ? (
                          <Button
                            variant="success"
                            disabled={busyId === item.id}
                            onClick={() => moderate(item, "approved")}
                          >
                            <Check size={16} /> Onayla
                          </Button>
                        ) : null}
                        {item.status !== "rejected" ? (
                          <Button
                            variant="danger"
                            disabled={busyId === item.id}
                            onClick={() => moderate(item, "rejected")}
                          >
                            <X size={16} /> Reddet
                          </Button>
                        ) : null}
                        <Button
                          variant="secondary"
                          disabled={busyId === item.id}
                          onClick={() => togglePublish(item)}
                        >
                          {item.isPublished ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditItem(item);
                            setTitle(item.title);
                            setPrice(
                              item.price != null ? String(item.price) : "",
                            );
                            setDescription(item.description || "");
                          }}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={busyId === item.id}
                          onClick={() => remove(item)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
        title="İlanı düzenle"
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-500">Başlık</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-500">Fiyat</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-slate-500">
              Açıklama
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
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
