"use client";

import { useEffect, useRef, useState } from "react";
import {
  getBlob,
  getDownloadURL,
  ref as storageRef,
} from "firebase/storage";
import { ExternalLink, Film, ImageOff, Loader2 } from "lucide-react";
import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase";
import { resolveMediaKind, youtubeEmbedUrl } from "@/lib/media";

async function loadVideoSrc(
  mediaPath: string | undefined,
  mediaUrl: string,
): Promise<{ src: string; revoke?: string }> {
  const storage = getFirebaseStorage();
  const errors: string[] = [];

  // 1) Auth’lu Storage blob (CORS’suz oynatma)
  if (mediaPath) {
    try {
      const blob = await getBlob(storageRef(storage, mediaPath));
      const objectUrl = URL.createObjectURL(blob);
      return { src: objectUrl, revoke: objectUrl };
    } catch (e) {
      errors.push(`getBlob: ${errMsg(e)}`);
    }

    // 2) Taze download URL
    try {
      const fresh = await getDownloadURL(storageRef(storage, mediaPath));
      return { src: fresh };
    } catch (e) {
      errors.push(`getDownloadURL: ${errMsg(e)}`);
    }

    // 3) Bearer token ile doğrudan Storage REST
    try {
      const user = getFirebaseAuth().currentUser;
      if (user) {
        const token = await user.getIdToken();
        const bucket = storage.app.options.storageBucket;
        const encoded = encodeURIComponent(mediaPath);
        const restUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
        const res = await fetch(restUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        return { src: objectUrl, revoke: objectUrl };
      }
    } catch (e) {
      errors.push(`REST: ${errMsg(e)}`);
    }
  }

  // 4) Firestore’daki mediaUrl
  if (mediaUrl) {
    return { src: mediaUrl };
  }

  throw new Error(errors.join(" | ") || "Medya yolu yok");
}

function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "code" in e) {
    return String((e as { code?: string; message?: string }).code || (e as { message?: string }).message);
  }
  return e instanceof Error ? e.message : String(e);
}

export function ContentMedia({
  mediaUrl,
  mediaPath,
  mediaType,
  className = "aspect-[4/5]",
}: {
  mediaUrl: string;
  mediaPath?: string;
  mediaType: string;
  className?: string;
}) {
  const kind = resolveMediaKind(mediaType, mediaUrl);
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(kind === "video" || kind === "image");
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>("");
  const revokeRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (kind === "youtube" || kind === "external") {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setSrc(null);
      setDebug(`${kind} | path=${mediaPath || "—"}`);

      if (kind === "image") {
        if (cancelled) return;
        setSrc(mediaUrl || null);
        setLoading(false);
        if (!mediaUrl) setError("Görsel URL yok");
        return;
      }

      // video
      try {
        const result = await loadVideoSrc(mediaPath, mediaUrl);
        if (cancelled) {
          if (result.revoke) URL.revokeObjectURL(result.revoke);
          return;
        }
        if (revokeRef.current) URL.revokeObjectURL(revokeRef.current);
        revokeRef.current = result.revoke || null;
        setSrc(result.src);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(errMsg(e));
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [kind, mediaPath, mediaUrl]);

  useEffect(() => {
    return () => {
      if (revokeRef.current) {
        URL.revokeObjectURL(revokeRef.current);
        revokeRef.current = null;
      }
    };
  }, []);

  if (!mediaUrl && !mediaPath) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}
      >
        <ImageOff size={28} />
      </div>
    );
  }

  if (kind === "youtube") {
    const embed = youtubeEmbedUrl(mediaUrl);
    return (
      <div className={`relative overflow-hidden bg-black ${className}`}>
        {embed ? (
          <iframe
            src={embed}
            title="YouTube"
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <ExternalFallback url={mediaUrl} label="YouTube bağlantısı" />
        )}
      </div>
    );
  }

  if (kind === "external") {
    return (
      <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
        <ExternalFallback url={mediaUrl} label="Harici video / bağlantı" />
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-slate-900 text-white ${className}`}
      >
        <Loader2 className="animate-spin" size={28} />
        <span className="px-3 text-center text-[11px] text-white/70">
          Video yükleniyor…
        </span>
      </div>
    );
  }

  if (error || !src) {
    return (
      <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
        <ExternalFallback
          url={mediaUrl || "#"}
          label={error || "Medya yüklenemedi"}
          hint={debug}
        />
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div className={`relative min-h-[220px] overflow-hidden bg-black ${className}`}>
        <video
          key={src}
          src={src}
          className="absolute inset-0 h-full w-full object-contain"
          controls
          playsInline
          preload="auto"
          onLoadedData={() => setDebug((d) => d + " | ok")}
          onError={() =>
            setError(
              "Tarayıcı bu video formatını oynatamıyor (.mov/HEVC olabilir). Mp4 deneyin veya Aç’a tıklayın.",
            )
          }
        />
        {mediaUrl ? (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-semibold text-white hover:bg-black"
          >
            <Film size={12} />
            Aç
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setError("Görsel yüklenemedi")}
      />
    </div>
  );
}

function ExternalFallback({
  url,
  label,
  hint,
}: {
  url: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center text-white">
      <Film size={32} className="opacity-80" />
      <p className="text-sm font-semibold">{label}</p>
      {hint ? (
        <p className="max-w-full truncate text-[10px] text-white/50">{hint}</p>
      ) : null}
      {url && url !== "#" ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100"
        >
          <ExternalLink size={14} />
          Yeni sekmede aç
        </a>
      ) : null}
    </div>
  );
}
