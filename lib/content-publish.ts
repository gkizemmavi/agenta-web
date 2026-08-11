import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  type DocumentReference,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { getFirebaseAuth, getFirestoreDb, getFirebaseStorage } from "./firebase";

export type PublishContentInput = {
  description: string;
  /** Local file for image/video upload */
  file?: File | null;
  /** External YouTube / TikTok / direct media URL */
  externalUrl?: string;
  /** Custom display name shown on mobile (not the admin account) */
  publisherName?: string;
  /** Avatar image file for the custom publisher */
  publisherAvatarFile?: File | null;
  /** Or a remote avatar URL */
  publisherAvatarUrl?: string;
  /** Display-only follower count on mobile */
  publisherFollowerCount?: number;
  /** Optional seeded engagement counters */
  likeCount?: number;
  viewCount?: number;
};

function extFromFile(file: File, mediaType: "image" | "video"): string {
  const fromName = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "";
  if (fromName) return fromName;
  return mediaType === "video" ? "mp4" : "jpg";
}

function detectMediaType(file: File): "image" | "video" {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  const name = file.name.toLowerCase();
  if (/\.(mp4|mov|m4v|webm)$/.test(name)) return "video";
  return "image";
}

function nonNegInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}

/**
 * Publishes content the same shape as the mobile app `ContentsService.publish`,
 * with `status: approved` so it appears immediately in the mobile feed.
 * Optional publisher* fields override the on-screen identity on mobile.
 */
export async function publishContentAsAdmin(
  input: PublishContentInput,
): Promise<string> {
  const auth = getFirebaseAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Giriş yapılmamış");

  const description = input.description.trim();
  const externalUrl = (input.externalUrl || "").trim();
  const file = input.file ?? null;
  const publisherName = (input.publisherName || "").trim();
  const publisherAvatarUrlInput = (input.publisherAvatarUrl || "").trim();
  const publisherAvatarFile = input.publisherAvatarFile ?? null;

  if (!file && !externalUrl) {
    throw new Error("Görsel/video dosyası veya harici bağlantı gerekli");
  }

  const db = getFirestoreDb();
  const docRef = doc(collection(db, "contents"));
  const userRef = doc(db, "users", uid) as DocumentReference;
  const storage = getFirebaseStorage();

  let mediaUrl = "";
  let mediaPath = "";
  let mediaType: "image" | "video" | "external" = "image";

  if (file) {
    mediaType = detectMediaType(file);
    const ext = extFromFile(file, mediaType);
    mediaPath = `contents/${uid}/${docRef.id}/media.${ext}`;
    const ref = storageRef(storage, mediaPath);
    await uploadBytes(ref, file, {
      contentType:
        file.type ||
        (mediaType === "video" ? "video/mp4" : "image/jpeg"),
    });
    mediaUrl = await getDownloadURL(ref);
  } else if (externalUrl) {
    mediaUrl = externalUrl;
    if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(externalUrl)) {
      mediaType = "video";
    } else if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(externalUrl)) {
      mediaType = "image";
    } else {
      mediaType = "external";
    }
  }

  let publisherAvatarUrl = publisherAvatarUrlInput;
  if (publisherAvatarFile) {
    const ext = extFromFile(publisherAvatarFile, "image");
    const avatarPath = `contents/${uid}/${docRef.id}/avatar.${ext}`;
    const ref = storageRef(storage, avatarPath);
    await uploadBytes(ref, publisherAvatarFile, {
      contentType: publisherAvatarFile.type || "image/jpeg",
    });
    publisherAvatarUrl = await getDownloadURL(ref);
  }

  const likeCount = nonNegInt(input.likeCount) ?? 0;
  const viewCount = nonNegInt(input.viewCount) ?? 0;
  const publisherFollowerCount = nonNegInt(input.publisherFollowerCount);

  const payload: Record<string, unknown> = {
    user: userRef,
    ownerUid: uid,
    mediaUrl,
    mediaPath,
    mediaType,
    description,
    likes: [] as string[],
    likeCount,
    commentCount: 0,
    viewers: [] as string[],
    viewCount,
    status: "approved",
    source: "admin_web",
    createdAt: serverTimestamp(),
  };

  if (publisherName) {
    payload.publisherName = publisherName;
  }
  if (publisherAvatarUrl) {
    payload.publisherAvatarUrl = publisherAvatarUrl;
  }
  if (publisherFollowerCount !== undefined) {
    payload.publisherFollowerCount = publisherFollowerCount;
  }

  await setDoc(docRef, payload);

  return docRef.id;
}
