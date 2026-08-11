export type MediaKind = "image" | "video" | "youtube" | "external";

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function pathOf(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function isPlatformUrl(url: string): boolean {
  const host = hostOf(url);
  if (!host) return false;
  return (
    host.includes("youtube.com") ||
    host.includes("youtu.be") ||
    host.includes("tiktok.com")
  );
}

export function isDirectVideoUrl(url: string): boolean {
  const path = pathOf(url);
  return (
    path.endsWith(".mp4") ||
    path.endsWith(".mov") ||
    path.endsWith(".m4v") ||
    path.endsWith(".webm") ||
    path.includes("/media.mp4") ||
    path.includes("/media.mov") ||
    path.includes("/media.m4v") ||
    path.includes("/media.webm")
  );
}

export function isDirectImageUrl(url: string): boolean {
  const path = pathOf(url);
  return (
    path.endsWith(".jpg") ||
    path.endsWith(".jpeg") ||
    path.endsWith(".png") ||
    path.endsWith(".webp") ||
    path.endsWith(".gif") ||
    path.includes("/media.jpg") ||
    path.includes("/media.jpeg") ||
    path.includes("/media.png") ||
    path.includes("/media.webp")
  );
}

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.includes("youtube.com")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").pop();
      if (id && id !== "watch" && id !== "embed") {
        return `https://www.youtube.com/embed/${id}`;
      }
      if (u.pathname.includes("/embed/")) return url;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveMediaKind(mediaType: string, mediaUrl: string): MediaKind {
  const type = (mediaType || "").trim().toLowerCase();
  if (!mediaUrl) return type === "video" ? "video" : "image";

  if (hostOf(mediaUrl)?.includes("youtu")) return "youtube";
  if (isPlatformUrl(mediaUrl) || type === "external") {
    if (isDirectVideoUrl(mediaUrl)) return "video";
    if (isDirectImageUrl(mediaUrl)) return "image";
    return "external";
  }
  // Prefer explicit mediaType from the app.
  if (type === "video") return "video";
  if (type === "image") return "image";
  if (isDirectVideoUrl(mediaUrl)) return "video";
  if (isDirectImageUrl(mediaUrl)) return "image";
  // Firebase Storage content files are often .../media.mp4 without clear type.
  if (mediaUrl.includes("firebasestorage.googleapis.com") && mediaUrl.includes("contents%2F")) {
    if (mediaUrl.toLowerCase().includes("media.mp4") || mediaUrl.toLowerCase().includes("media.mov") || mediaUrl.toLowerCase().includes("media.m4v") || mediaUrl.toLowerCase().includes("media.webm")) {
      return "video";
    }
  }
  return "image";
}
