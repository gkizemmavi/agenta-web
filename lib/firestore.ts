import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  deleteDoc,
  where,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";
import {
  agentTypeLabel,
  LISTING_COLLECTIONS,
  normalizeAgentType,
  type AgentApplication,
  type AgentAppStatus,
  type ContentDoc,
  type ListingCollection,
  type ListingDoc,
  type ModerationStatus,
  type UserDoc,
} from "./types";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

export function mapUser(id: string, data: DocumentData): UserDoc {
  return {
    id,
    uid: asString(data.uid, id),
    fullName: asString(data.fullName),
    nickname: asString(data.nickname),
    email: asString(data.email),
    phone: asString(data.phone),
    bio: (data.bio as string | null | undefined) ?? null,
    avatarUrl: (data.avatarUrl as string | null | undefined) ?? null,
    credits: asNumber(data.credits),
    isPremium: Boolean(data.isPremium),
    isAdmin: Boolean(data.isAdmin),
    listingCount: asNumber(data.listingCount),
    followerCount: asNumber(data.followerCount),
    followingCount: asNumber(data.followingCount),
    referralCode: asString(data.referralCode) || undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function fetchUsers(max = 200): Promise<UserDoc[]> {
  const q = query(collection(getFirestoreDb(), "users"), orderBy("createdAt", "desc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapUser(d.id, d.data()));
}

export async function fetchUser(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(getFirestoreDb(), "users", uid));
  if (!snap.exists()) return null;
  return mapUser(snap.id, snap.data());
}

export async function updateUser(
  uid: string,
  data: Partial<
    Pick<
      UserDoc,
      | "fullName"
      | "nickname"
      | "email"
      | "phone"
      | "bio"
      | "credits"
      | "isPremium"
      | "isAdmin"
    >
  >,
): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "users", uid), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteUserDoc(uid: string): Promise<void> {
  await deleteDoc(doc(getFirestoreDb(), "users", uid));
}

export function mapContent(id: string, data: DocumentData): ContentDoc {
  // Legacy docs without status are treated as approved (already live in the app).
  const raw = data.status;
  const status = (
    typeof raw === "string" && raw
      ? raw
      : "approved"
  ) as ModerationStatus;
  return {
    id,
    ownerUid: asString(data.ownerUid),
    mediaUrl: asString(data.mediaUrl),
    mediaType: asString(data.mediaType, "image"),
    description: asString(data.description),
    likeCount: asNumber(data.likeCount),
    commentCount: asNumber(data.commentCount),
    viewCount: asNumber(data.viewCount),
    status: ["pending", "approved", "rejected"].includes(status)
      ? status
      : "pending",
    createdAt: toDate(data.createdAt),
  };
}

export async function fetchContents(opts?: {
  status?: ModerationStatus | "all";
  ownerUid?: string;
  max?: number;
}): Promise<ContentDoc[]> {
  const constraints: QueryConstraint[] = [];
  if (opts?.status && opts.status !== "all") {
    constraints.push(where("status", "==", opts.status));
  }
  if (opts?.ownerUid) {
    constraints.push(where("ownerUid", "==", opts.ownerUid));
  }
  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(opts?.max ?? 100));

  try {
    const snap = await getDocs(query(collection(getFirestoreDb(), "contents"), ...constraints));
    return snap.docs.map((d) => mapContent(d.id, d.data()));
  } catch {
    // Fallback when composite index is missing or legacy docs lack status.
    const snap = await getDocs(
      query(collection(getFirestoreDb(), "contents"), orderBy("createdAt", "desc"), limit(opts?.max ?? 100)),
    );
    let items = snap.docs.map((d) => mapContent(d.id, d.data()));
    if (opts?.status && opts.status !== "all") {
      items = items.filter((c) => c.status === opts.status);
    }
    if (opts?.ownerUid) {
      items = items.filter((c) => c.ownerUid === opts.ownerUid);
    }
    return items;
  }
}

export async function setContentStatus(
  id: string,
  status: ModerationStatus,
): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "contents", id), {
    status,
    moderatedAt: Timestamp.now(),
  });
}

export async function updateContent(
  id: string,
  data: Partial<Pick<ContentDoc, "description" | "status">>,
): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), "contents", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteContent(id: string): Promise<void> {
  await deleteDoc(doc(getFirestoreDb(), "contents", id));
}

function listingTitle(data: DocumentData, collectionName: ListingCollection): string {
  if (typeof data.title === "string" && data.title.trim()) return data.title;
  if (collectionName === "tutors" || collectionName === "helpers") {
    return asString(data.category) || asString(data.name) || "İlan";
  }
  return "İlan";
}

export function mapListing(
  id: string,
  collectionName: ListingCollection,
  data: DocumentData,
): ListingDoc {
  const photos =
    (data.photoUrls as string[] | undefined) ??
    (data.photoPaths as string[] | undefined) ??
    [];
  const statusRaw = asString(data.status);
  const status = ["pending", "approved", "rejected"].includes(statusRaw)
    ? (statusRaw as ModerationStatus)
    : undefined;

  return {
    id,
    collection: collectionName,
    title: listingTitle(data, collectionName),
    price: typeof data.price === "number" ? data.price : null,
    location: asString(data.location) || asString(data.province) || undefined,
    ownerUid: asString(data.ownerUid),
    isPublished: data.isPublished !== false,
    status,
    photoUrls: Array.isArray(photos) ? photos.filter(Boolean) : [],
    description: asString(data.description) || asString(data.details) || undefined,
    phone: asString(data.phone) || undefined,
    createdAt: toDate(data.createdAt),
    raw: data as Record<string, unknown>,
  };
}

export async function fetchListings(opts?: {
  collection?: ListingCollection | "all";
  ownerUid?: string;
  max?: number;
}): Promise<ListingDoc[]> {
  const collections =
    opts?.collection && opts.collection !== "all"
      ? LISTING_COLLECTIONS.filter((c) => c.key === opts.collection)
      : LISTING_COLLECTIONS;

  const pages = await Promise.all(
    collections.map(async ({ key }) => {
      try {
        const constraints: QueryConstraint[] = [];
        if (opts?.ownerUid) constraints.push(where("ownerUid", "==", opts.ownerUid));
        constraints.push(orderBy("createdAt", "desc"));
        constraints.push(limit(opts?.max ?? 80));
        const snap = await getDocs(query(collection(getFirestoreDb(), key), ...constraints));
        return snap.docs.map((d) => mapListing(d.id, key, d.data()));
      } catch {
        const snap = await getDocs(query(collection(getFirestoreDb(), key), limit(opts?.max ?? 80)));
        let items = snap.docs.map((d) => mapListing(d.id, key, d.data()));
        if (opts?.ownerUid) items = items.filter((l) => l.ownerUid === opts.ownerUid);
        return items;
      }
    }),
  );

  return pages
    .flat()
    .sort(
      (a, b) =>
        (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );
}

export async function updateListing(
  collectionName: ListingCollection,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), collectionName, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteListing(
  collectionName: ListingCollection,
  id: string,
): Promise<void> {
  await deleteDoc(doc(getFirestoreDb(), collectionName, id));
}

export async function fetchAgentApplications(
  status: AgentAppStatus | "all" = "all",
): Promise<AgentApplication[]> {
  const snap = await getDocs(collection(getFirestoreDb(), "agents"));
  const apps: AgentApplication[] = [];

  for (const d of snap.docs) {
    const data = d.data();
    if (!data.user) continue; // seeded directory agents

    const appStatus = (asString(data.status, "pending") ||
      "pending") as AgentAppStatus;
    if (status !== "all" && appStatus !== status) continue;

    let userName = "";
    let userEmail = "";
    let userPhone = "";
    let avatarUrl: string | null = null;

    try {
      const userSnap = await getDoc(doc(getFirestoreDb(), "users", d.id));
      if (userSnap.exists()) {
        const u = userSnap.data();
        userName = asString(u.fullName) || asString(u.nickname);
        userEmail = asString(u.email);
        userPhone = asString(u.phone);
        avatarUrl = (u.avatarUrl as string | null | undefined) ?? null;
      }
    } catch {
      /* ignore */
    }

    apps.push({
      id: d.id,
      type: asString(data.type),
      typeKey: normalizeAgentType(asString(data.type)),
      status: ["pending", "approved", "rejected"].includes(appStatus)
        ? appStatus
        : "pending",
      nationalId: asString(data.nationalId),
      province: asString(data.province),
      district: asString(data.district),
      address: asString(data.address),
      submittedAt: toDate(data.submittedAt),
      submittedAtIso: asString(data.submittedAtIso) || undefined,
      userName,
      userEmail,
      userPhone,
      avatarUrl,
    });
  }

  return apps.sort(
    (a, b) =>
      (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0),
  );
}

export async function setAgentApplicationStatus(
  id: string,
  status: AgentAppStatus,
  options?: { normalizeType?: boolean },
): Promise<void> {
  const ref = doc(getFirestoreDb(), "agents", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Başvuru bulunamadı");

  const data = snap.data();
  const payload: Record<string, unknown> = {
    status,
    reviewedAt: Timestamp.now(),
  };

  if (options?.normalizeType !== false && status === "approved") {
    const typeKey = normalizeAgentType(asString(data.type));
    if (["individual", "master", "expert", "service"].includes(typeKey)) {
      payload.type = typeKey;
      payload.typeLabel = agentTypeLabel(typeKey);
    }
  }

  if (status === "approved") {
    const userSnap = await getDoc(doc(getFirestoreDb(), "users", id));
    if (userSnap.exists()) {
      const u = userSnap.data();
      payload.name =
        asString(data.name) ||
        asString(u.fullName) ||
        asString(u.nickname) ||
        "Ajan";
      if (!data.rating) payload.rating = 0;
      if (!data.reviewCount) payload.reviewCount = 0;
    }
  }

  await updateDoc(ref, payload);
}

export async function deleteAgentApplication(id: string): Promise<void> {
  await deleteDoc(doc(getFirestoreDb(), "agents", id));
}

export async function fetchDashboardStats() {
  const [users, contents, agents, listings] = await Promise.all([
    getDocs(query(collection(getFirestoreDb(), "users"), limit(500))),
    getDocs(query(collection(getFirestoreDb(), "contents"), limit(500))),
    getDocs(collection(getFirestoreDb(), "agents")),
    Promise.all(
      LISTING_COLLECTIONS.map(({ key }) =>
        getDocs(query(collection(getFirestoreDb(), key), limit(200))),
      ),
    ),
  ]);

  const contentDocs = contents.docs.map((d) => mapContent(d.id, d.data()));
  const agentApps = agents.docs.filter((d) => d.data().user);

  return {
    users: users.size,
    contentsPending: contentDocs.filter((c) => c.status === "pending").length,
    contentsApproved: contentDocs.filter((c) => c.status === "approved").length,
    applicationsPending: agentApps.filter(
      (d) => asString(d.data().status, "pending") === "pending",
    ).length,
    listings: listings.reduce((sum, snap) => sum + snap.size, 0),
  };
}
