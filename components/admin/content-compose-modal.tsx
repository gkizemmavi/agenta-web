"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Upload, UserRound } from "lucide-react";
import { publishContentAsAdmin } from "@/lib/content-publish";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function ContentComposeModal({
  open,
  onClose,
  onPublished,
}: {
  open: boolean;
  onClose: () => void;
  onPublished: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [publisherName, setPublisherName] = useState("");
  const [publisherFollowerCount, setPublisherFollowerCount] = useState("");
  const [publisherAvatarUrl, setPublisherAvatarUrl] = useState("");
  const [publisherAvatarFile, setPublisherAvatarFile] = useState<File | null>(
    null,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState("");
  const [viewCount, setViewCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  function reset() {
    setDescription("");
    setExternalUrl("");
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPublisherName("");
    setPublisherFollowerCount("");
    setPublisherAvatarUrl("");
    setPublisherAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setLikeCount("");
    setViewCount("");
    setError(null);
    setProgress("");
    if (fileRef.current) fileRef.current.value = "";
    if (avatarRef.current) avatarRef.current.value = "";
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  function onFileChange(f: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    if (f) setExternalUrl("");
  }

  function onAvatarFileChange(f: File | null) {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setPublisherAvatarFile(f);
    setAvatarPreview(f ? URL.createObjectURL(f) : null);
    if (f) setPublisherAvatarUrl("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    setProgress(
      file || publisherAvatarFile ? "Medya yükleniyor…" : "Kaydediliyor…",
    );
    try {
      await publishContentAsAdmin({
        description,
        file,
        externalUrl: file ? undefined : externalUrl,
        publisherName,
        publisherAvatarFile,
        publisherAvatarUrl: publisherAvatarFile
          ? undefined
          : publisherAvatarUrl,
        publisherFollowerCount: publisherFollowerCount
          ? Number(publisherFollowerCount)
          : undefined,
        likeCount: likeCount ? Number(likeCount) : undefined,
        viewCount: viewCount ? Number(viewCount) : undefined,
      });
      reset();
      onClose();
      onPublished();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paylaşım başarısız");
    } finally {
      setSubmitting(false);
      setProgress("");
    }
  }

  const canSubmit =
    description.trim().length > 0 &&
    (Boolean(file) || externalUrl.trim().length > 0) &&
    !submitting;

  return (
    <Modal open={open} onClose={handleClose} title="İçerik paylaş" wide>
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Paylaştığınız içerik mobilde hemen yayınlanır (onaylı). Yayıncı
          bilgilerini boş bırakırsanız admin hesabınız görünür.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <UserRound size={14} />
            Yayıncı (mobilde görünen)
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">İsim</span>
              <input
                type="text"
                value={publisherName}
                onChange={(e) => setPublisherName(e.target.value)}
                placeholder="Örn. Agenta Resmi"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[var(--brand)] focus:ring-2"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Takipçi sayısı
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={publisherFollowerCount}
                onChange={(e) => setPublisherFollowerCount(e.target.value)}
                placeholder="Örn. 12500"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[var(--brand)] focus:ring-2"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Avatar URL
              </span>
              <input
                type="url"
                value={publisherAvatarUrl}
                onChange={(e) => {
                  setPublisherAvatarUrl(e.target.value);
                  if (e.target.value) onAvatarFileChange(null);
                }}
                placeholder="https://…"
                disabled={Boolean(publisherAvatarFile)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[var(--brand)] focus:ring-2 disabled:opacity-60"
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={() => avatarRef.current?.click()}
            >
              Avatar yükle
            </Button>
          </div>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              onAvatarFileChange(e.target.files?.[0] ?? null)
            }
          />
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt=""
              className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
            />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Başlangıç beğeni
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={likeCount}
                onChange={(e) => setLikeCount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[var(--brand)] focus:ring-2"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-500">
                Başlangıç görüntülenme
              </span>
              <input
                type="number"
                min={0}
                step={1}
                value={viewCount}
                onChange={(e) => setViewCount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[var(--brand)] focus:ring-2"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm font-semibold text-slate-700 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
          >
            <Upload size={22} />
            Dosya seç (görsel / video)
          </button>
          <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Link2 size={14} /> Harici bağlantı
            </span>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => {
                setExternalUrl(e.target.value);
                if (e.target.value) onFileChange(null);
              }}
              placeholder="https://youtube.com/… veya medya URL"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-[var(--brand)] focus:ring-2"
              disabled={Boolean(file)}
            />
          </label>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />

        {preview && file ? (
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black">
            {file.type.startsWith("video/") ? (
              <video
                src={preview}
                controls
                className="mx-auto max-h-64 w-full object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="mx-auto max-h-64 w-full object-contain"
              />
            )}
            <p className="truncate bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Açıklama
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            placeholder="İçerik açıklaması…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-[var(--brand)] focus:ring-2"
          />
        </label>

        {error ? (
          <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {progress ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="animate-spin" size={16} />
            {progress}
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            İptal
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <ImagePlus size={16} />
            )}
            Yayınla
          </Button>
        </div>
      </form>
    </Modal>
  );
}
