"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import {
  deleteListing,
  fetchListings,
  updateListing,
} from "@/lib/firestore";
import {
  LISTING_COLLECTIONS,
  type ListingCollection,
  type ListingDoc,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function AdminListingsPage() {
  const [collection, setCollection] = useState<ListingCollection | "all">("all");
  const [items, setItems] = useState<ListingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ListingDoc | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchListings({ collection, max: 100 }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "İlanlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    void load();
  }, [load]);

  async function togglePublish(item: ListingDoc) {
    setBusyId(item.id);
    try {
      await updateListing(item.collection, item.id, {
        isPublished: !item.isPublished,
      });
      await load();
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
      await load();
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
      await load();
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
            Tüm kategori ilanlarını görüntüleyin, yayınlayın veya silin.
          </p>
        </div>
        <select
          value={collection}
          onChange={(e) =>
            setCollection(e.target.value as ListingCollection | "all")
          }
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none ring-[var(--brand)] focus:ring-2"
        >
          <option value="all">Tüm kategoriler</option>
          {LISTING_COLLECTIONS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
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
                <th className="px-4 py-3 font-semibold">Yayın</th>
                <th className="px-4 py-3 font-semibold">Tarih</th>
                <th className="px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Yükleniyor…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    İlan bulunamadı.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={`${item.collection}-${item.id}`} className="border-t border-slate-100">
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
                      <Badge tone={item.isPublished ? "success" : "warn"}>
                        {item.isPublished ? "Yayında" : "Gizli"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.createdAt
                        ? format(item.createdAt, "dd.MM.yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
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

      <Modal
        open={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        title="İlan düzenle"
        wide
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Başlık
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[var(--brand)] focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Fiyat
            </span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[var(--brand)] focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Açıklama
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[var(--brand)] focus:ring-2"
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
