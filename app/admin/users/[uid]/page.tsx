"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import {
  deleteContent,
  deleteListing,
  deleteUserDoc,
  fetchContentsPage,
  fetchListingsPage,
  fetchUser,
  PAGE_SIZE,
  updateListing,
  updateUser,
  type PageCursor,
} from "@/lib/firestore";
import { useFirestorePagination } from "@/lib/use-firestore-pagination";
import type { ListingCollection, UserDoc } from "@/lib/types";
import { LISTING_COLLECTIONS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentMedia } from "@/components/admin/content-media";
import { PaginationBar } from "@/components/ui/pagination-bar";

export default function AdminUserDetailPage() {
  const params = useParams<{ uid: string }>();
  const router = useRouter();
  const uid = params.uid;

  const [user, setUser] = useState<UserDoc | null>(null);
  const [listingCollection, setListingCollection] =
    useState<ListingCollection>("listings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [credits, setCredits] = useState("0");
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const contentsFetcher = useCallback(
    (cursor: PageCursor) =>
      fetchContentsPage({
        ownerUid: uid,
        status: "all",
        pageSize: PAGE_SIZE,
        cursor,
      }),
    [uid],
  );

  const listingsFetcher = useCallback(
    (cursor: PageCursor) =>
      fetchListingsPage({
        collection: listingCollection,
        ownerUid: uid,
        pageSize: PAGE_SIZE,
        cursor,
      }),
    [uid, listingCollection],
  );

  const contentsPage = useFirestorePagination(contentsFetcher, [uid]);
  const listingsPage = useFirestorePagination(listingsFetcher, [
    uid,
    listingCollection,
  ]);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await fetchUser(uid);
      if (!u) {
        setError("Kullanıcı bulunamadı");
        setUser(null);
        return;
      }
      setUser(u);
      setFullName(u.fullName);
      setNickname(u.nickname);
      setEmail(u.email);
      setPhone(u.phone);
      setBio(u.bio || "");
      setCredits(String(u.credits));
      setIsPremium(u.isPremium);
      setIsAdmin(Boolean(u.isAdmin));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  async function save() {
    setSaving(true);
    try {
      await updateUser(uid, {
        fullName,
        nickname,
        email,
        phone,
        bio,
        credits: Number(credits) || 0,
        isPremium,
        isAdmin,
      });
      await loadUser();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  }

  async function removeUser() {
    if (
      !confirm(
        "Kullanıcı belgesi silinsin mi? Auth hesabı Firebase Console’dan ayrıca silinmelidir.",
      )
    ) {
      return;
    }
    try {
      await deleteUserDoc(uid);
      router.push("/admin/users");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Silinemedi");
    }
  }

  if (loading) {
    return <div className="text-slate-500">Yükleniyor…</div>;
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" onClick={() => router.push("/admin/users")}>
          <ArrowLeft size={16} /> Geri
        </Button>
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error || "Kullanıcı yok"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => router.push("/admin/users")}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {user.fullName || user.nickname || "Kullanıcı"}
            </h1>
            <p className="text-sm text-slate-500">{user.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="danger" onClick={removeUser}>
            <Trash2 size={16} /> Sil
          </Button>
          <Button onClick={save} disabled={saving}>
            <Save size={16} /> Kaydet
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold">Profil bilgileri</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(
              [
                ["Ad Soyad", fullName, setFullName],
                ["Kullanıcı adı", nickname, setNickname],
                ["E-posta", email, setEmail],
                ["Telefon", phone, setPhone],
              ] as const
            ).map(([label, value, setter]) => (
              <label key={label} className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  {label}
                </span>
                <input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[var(--brand)] focus:ring-2"
                />
              </label>
            ))}
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Bio
              </span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[var(--brand)] focus:ring-2"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Kredi
              </span>
              <input
                type="number"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[var(--brand)] focus:ring-2"
              />
            </label>
            <div className="flex items-end gap-4 pb-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                />
                Premium
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                />
                Admin
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold">Özet</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Takipçi</dt>
              <dd className="font-semibold">{user.followerCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Takip</dt>
              <dd className="font-semibold">{user.followingCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">İlan sayısı (profil)</dt>
              <dd className="font-semibold">{user.listingCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Referral</dt>
              <dd className="font-semibold">{user.referralCode || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Kayıt</dt>
              <dd className="font-semibold">
                {user.createdAt ? format(user.createdAt, "dd.MM.yyyy") : "—"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">
          İçerikler
          {contentsPage.loading ? "" : ` (${contentsPage.items.length})`}
        </h2>
        {contentsPage.loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Yükleniyor…
          </div>
        ) : contentsPage.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            İçerik yok.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {contentsPage.items.map((c) => (
              <div
                key={c.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <ContentMedia
                  mediaUrl={c.mediaUrl}
                  mediaPath={c.mediaPath}
                  mediaType={c.mediaType}
                  className="aspect-video"
                />
                <div className="space-y-2 p-3">
                  <Badge tone={c.status}>{c.status}</Badge>
                  <p className="line-clamp-2 text-sm">{c.description || "—"}</p>
                  <Button
                    variant="ghost"
                    className="!px-2"
                    onClick={async () => {
                      if (!confirm("İçerik silinsin mi?")) return;
                      await deleteContent(c.id);
                      contentsPage.reload();
                    }}
                  >
                    <Trash2 size={16} /> Sil
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <PaginationBar
          page={contentsPage.page}
          hasMore={contentsPage.hasMore}
          loading={contentsPage.loading}
          onPrev={contentsPage.onPrev}
          onNext={contentsPage.onNext}
          pageSize={contentsPage.pageSize}
          itemCount={contentsPage.items.length}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            İlanlar
            {listingsPage.loading ? "" : ` (${listingsPage.items.length})`}
          </h2>
          <select
            value={listingCollection}
            onChange={(e) =>
              setListingCollection(e.target.value as ListingCollection)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none ring-[var(--brand)] focus:ring-2"
          >
            {LISTING_COLLECTIONS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {listingsPage.loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Yükleniyor…
          </div>
        ) : listingsPage.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            İlan yok.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Başlık</th>
                  <th className="px-4 py-3 text-left">Kategori</th>
                  <th className="px-4 py-3 text-left">Yayın</th>
                  <th className="px-4 py-3 text-left">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {listingsPage.items.map((l) => (
                  <tr key={`${l.collection}-${l.id}`} className="border-t">
                    <td className="px-4 py-3 font-medium">{l.title}</td>
                    <td className="px-4 py-3">
                      {LISTING_COLLECTIONS.find((c) => c.key === l.collection)
                        ?.label ?? l.collection}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={l.isPublished ? "success" : "warn"}>
                        {l.isPublished ? "Yayında" : "Gizli"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            await updateListing(l.collection, l.id, {
                              isPublished: !l.isPublished,
                            });
                            listingsPage.reload();
                          }}
                        >
                          {l.isPublished ? "Gizle" : "Yayınla"}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            if (!confirm("İlan silinsin mi?")) return;
                            await deleteListing(l.collection, l.id);
                            listingsPage.reload();
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar
          page={listingsPage.page}
          hasMore={listingsPage.hasMore}
          loading={listingsPage.loading}
          onPrev={listingsPage.onPrev}
          onNext={listingsPage.onNext}
          pageSize={listingsPage.pageSize}
          itemCount={listingsPage.items.length}
        />
      </section>
    </div>
  );
}
