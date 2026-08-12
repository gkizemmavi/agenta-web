import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  limit,
  orderBy,
  query,
  updateDoc,
  deleteDoc,
  where,
  startAfter,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";
import {
  agentTypeLabel,
  LISTING_COLLECTIONS,
  normalizeAgentType,
  type AgentApplication,
  type AgentApplicationDocument,
  type AgentAppStatus,
  type ContentDoc,
  type ListingCollection,
  type ListingDoc,
  type ModerationStatus,
  type UserDoc,
} from "./types";

export const PAGE_SIZE = 20;

export type PageCursor = QueryDocumentSnapshot<DocumentData> | null;

export type PageResult<T> = {
  items: T[];
  lastDoc: PageCursor;
  hasMore: boolean;
};

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

function pageSlice<T>(
  docs: QueryDocumentSnapshot<DocumentData>[],
  pageSize: number,
  mapFn: (d: QueryDocumentSnapshot<DocumentData>) => T,
): PageResult<T> {
  const hasMore = docs.length > pageSize;
  const slice = hasMore ? docs.slice(0, pageSize) : docs;
  return {
    items: slice.map(mapFn),
    lastDoc: slice.length ? slice[slice.length - 1] : null,
    hasMore,
  };
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

export async function fetchUsersPage(opts?: {
  pageSize?: number;
  cursor?: PageCursor;
}): Promise<PageResult<UserDoc>> {
  const pageSize = opts?.pageSize ?? PAGE_SIZE;
  const constraints: QueryConstraint[] = [
    orderBy("createdAt", "desc"),
    limit(pageSize + 1),
  ];
  if (opts?.cursor) constraints.push(startAfter(opts.cursor));

  try {
    const snap = await getDocs(
      query(collection(getFirestoreDb(), "users"), ...constraints),
    );
    return pageSlice(snap.docs, pageSize, (d) => mapUser(d.id, d.data()));
  } catch {
    // Fallback if createdAt index/order missing on some docs
    const snap = await getDocs(
      query(collection(getFirestoreDb(), "users"), limit(pageSize + 1)),
    );
    return pageSlice(snap.docs, pageSize, (d) => mapUser(d.id, d.data()));
  }
}

/** @deprecated use fetchUsersPage */
export async function fetchUsers(max = PAGE_SIZE): Promise<UserDoc[]> {
  const page = await fetchUsersPage({ pageSize: max });
  return page.items;
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
  const raw = data.status;
  const status = (
    typeof raw === "string" && raw ? raw : "approved"
  ) as ModerationStatus;
  return {
    id,
    ownerUid: asString(data.ownerUid),
    mediaUrl: asString(data.mediaUrl),
    mediaPath: asString(data.mediaPath) || undefined,
    mediaType: asString(data.mediaType, "image"),
    description: asString(data.description),
    likeCount: asNumber(data.likeCount),
    commentCount: asNumber(data.commentCount),
    viewCount: asNumber(data.viewCount),
    status: ["pending", "approved", "rejected"].includes(status)
      ? status
      : "pending",
    createdAt: toDate(data.createdAt),
    publisherName: asString(data.publisherName) || undefined,
    publisherAvatarUrl: asString(data.publisherAvatarUrl) || undefined,
    publisherFollowerCount:
      data.publisherFollowerCount == null
        ? undefined
        : asNumber(data.publisherFollowerCount),
  };
}

export async function fetchContentsPage(opts?: {
  status?: ModerationStatus | "all";
  ownerUid?: string;
  pageSize?: number;
  cursor?: PageCursor;
}): Promise<PageResult<ContentDoc>> {
  const pageSize = opts?.pageSize ?? PAGE_SIZE;
  const constraints: QueryConstraint[] = [];
  if (opts?.status && opts.status !== "all") {
    constraints.push(where("status", "==", opts.status));
  }
  if (opts?.ownerUid) {
    constraints.push(where("ownerUid", "==", opts.ownerUid));
  }
  constraints.push(orderBy("createdAt", "desc"));
  if (opts?.cursor) constraints.push(startAfter(opts.cursor));
  constraints.push(limit(pageSize + 1));

  try {
    const snap = await getDocs(
      query(collection(getFirestoreDb(), "contents"), ...constraints),
    );
    return pageSlice(snap.docs, pageSize, (d) => mapContent(d.id, d.data()));
  } catch {
    // Fallback: no composite index — paginate by createdAt only, filter client-side
    const fallback: QueryConstraint[] = [orderBy("createdAt", "desc")];
    if (opts?.cursor) fallback.push(startAfter(opts.cursor));
    fallback.push(limit(pageSize + 1));
    const snap = await getDocs(
      query(collection(getFirestoreDb(), "contents"), ...fallback),
    );
    let docs = snap.docs;
    if (opts?.status && opts.status !== "all") {
      docs = docs.filter((d) => mapContent(d.id, d.data()).status === opts.status);
    }
    if (opts?.ownerUid) {
      docs = docs.filter((d) => d.data().ownerUid === opts.ownerUid);
    }
    return pageSlice(docs, pageSize, (d) => mapContent(d.id, d.data()));
  }
}

/** @deprecated use fetchContentsPage */
export async function fetchContents(opts?: {
  status?: ModerationStatus | "all";
  ownerUid?: string;
  max?: number;
}): Promise<ContentDoc[]> {
  const page = await fetchContentsPage({
    status: opts?.status,
    ownerUid: opts?.ownerUid,
    pageSize: opts?.max ?? PAGE_SIZE,
  });
  return page.items;
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
    // Legacy listings without status are treated as approved when published.
    status: status ?? (data.isPublished === false ? "pending" : "approved"),
    photoUrls: Array.isArray(photos) ? photos.filter(Boolean) : [],
    description: asString(data.description) || asString(data.details) || undefined,
    phone: asString(data.phone) || undefined,
    createdAt: toDate(data.createdAt),
    raw: data as Record<string, unknown>,
  };
}

function listingMatchesStatus(
  item: ListingDoc,
  status: ModerationStatus | "all",
): boolean {
  if (status === "all") return true;
  return item.status === status;
}

async function loadRecentListings(
  key: ListingCollection,
  limitN: number,
  ownerUid?: string,
): Promise<ListingDoc[]> {
  try {
    const constraints: QueryConstraint[] = [];
    if (ownerUid) constraints.push(where("ownerUid", "==", ownerUid));
    constraints.push(orderBy("createdAt", "desc"), limit(limitN));
    const snap = await getDocs(
      query(collection(getFirestoreDb(), key), ...constraints),
    );
    return snap.docs.map((d) => mapListing(d.id, key, d.data()));
  } catch {
    try {
      const snap = await getDocs(
        query(collection(getFirestoreDb(), key), limit(limitN)),
      );
      let rows = snap.docs.map((d) => mapListing(d.id, key, d.data()));
      if (ownerUid) rows = rows.filter((r) => r.ownerUid === ownerUid);
      rows.sort(
        (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
      );
      return rows;
    } catch {
      return [];
    }
  }
}

export async function fetchListingsPage(opts: {
  collection: ListingCollection | "all";
  status?: ModerationStatus | "all";
  ownerUid?: string;
  pageSize?: number;
  cursor?: PageCursor;
}): Promise<PageResult<ListingDoc>> {
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const status = opts.status ?? "all";
  const collections: ListingCollection[] =
    opts.collection === "all"
      ? LISTING_COLLECTIONS.map((c) => c.key)
      : [opts.collection];

  // Status / multi-collection: merge then page by document id offset.
  if (collections.length > 1 || status !== "all") {
    const rows = (
      await Promise.all(
        collections.map((key) =>
          loadRecentListings(key, Math.max(80, pageSize * 3), opts.ownerUid),
        ),
      )
    )
      .flat()
      .filter((r) => listingMatchesStatus(r, status));
    rows.sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );

    let start = 0;
    if (opts.cursor) {
      const cursorId = (opts.cursor as { id?: string }).id;
      if (cursorId) {
        const idx = rows.findIndex((r) => r.id === cursorId);
        start = idx >= 0 ? idx + 1 : 0;
      }
    }
    const window = rows.slice(start, start + pageSize + 1);
    const hasMore = window.length > pageSize;
    const items = hasMore ? window.slice(0, pageSize) : window;
    return {
      items,
      lastDoc: items.length
        ? ({ id: items[items.length - 1].id } as unknown as PageCursor)
        : null,
      hasMore,
    };
  }

  const key = collections[0];
  const constraints: QueryConstraint[] = [];
  if (opts.ownerUid) constraints.push(where("ownerUid", "==", opts.ownerUid));
  constraints.push(orderBy("createdAt", "desc"));
  if (opts.cursor) constraints.push(startAfter(opts.cursor));
  constraints.push(limit(pageSize + 1));

  try {
    const snap = await getDocs(
      query(collection(getFirestoreDb(), key), ...constraints),
    );
    return pageSlice(snap.docs, pageSize, (d) =>
      mapListing(d.id, key, d.data()),
    );
  } catch {
    const fallback: QueryConstraint[] = [];
    if (opts.cursor) fallback.push(startAfter(opts.cursor));
    fallback.push(limit(pageSize + 1));
    const snap = await getDocs(
      query(collection(getFirestoreDb(), key), ...fallback),
    );
    let docs = snap.docs;
    if (opts.ownerUid) {
      docs = docs.filter((d) => d.data().ownerUid === opts.ownerUid);
    }
    return pageSlice(docs, pageSize, (d) => mapListing(d.id, key, d.data()));
  }
}

export async function setListingStatus(
  collectionName: ListingCollection,
  id: string,
  status: ModerationStatus,
): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), collectionName, id), {
    status,
    isPublished: status === "approved",
    updatedAt: Timestamp.now(),
  });
}

/** @deprecated use fetchListingsPage */
export async function fetchListings(opts?: {
  collection?: ListingCollection | "all";
  ownerUid?: string;
  max?: number;
}): Promise<ListingDoc[]> {
  const key =
    opts?.collection && opts.collection !== "all"
      ? opts.collection
      : "listings";
  const page = await fetchListingsPage({
    collection: key,
    ownerUid: opts?.ownerUid,
    pageSize: opts?.max ?? PAGE_SIZE,
  });
  return page.items;
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

function mapAgentDocuments(raw: unknown): AgentApplicationDocument[] {
  if (!Array.isArray(raw)) return [];
  const docs: AgentApplicationDocument[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const d = item as Record<string, unknown>;
    const url = asString(d.url);
    if (!url) continue;
    docs.push({
      key: asString(d.key),
      title: asString(d.title) || asString(d.key) || "Belge",
      category: asString(d.category),
      url,
      path: asString(d.path) || undefined,
      contentType: asString(d.contentType) || undefined,
    });
  }
  return docs;
}

function ownerUidFromAgentDoc(
  d: QueryDocumentSnapshot<DocumentData>,
): string {
  const data = d.data();
  const owner = asString(data.ownerUid);
  if (owner) return owner;
  const user = data.user;
  if (user && typeof user === "object" && "id" in user) {
    return String((user as { id: string }).id);
  }
  // Legacy applications used agents/{uid} as the doc id.
  if (!d.id.includes("_")) return d.id;
  return d.id.split("_")[0] ?? d.id;
}

function mapAgentDoc(
  d: QueryDocumentSnapshot<DocumentData>,
  profile?: { name: string; email: string; phone: string; avatarUrl: string | null },
): AgentApplication {
  const data = d.data();
  const appStatus = (asString(data.status, "pending") ||
    "pending") as AgentAppStatus;
  return {
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
    userName: profile?.name || "",
    userEmail: profile?.email || "",
    userPhone: profile?.phone || "",
    avatarUrl: profile?.avatarUrl ?? null,
    documents: mapAgentDocuments(data.documents),
  };
}

async function enrichAgent(d: QueryDocumentSnapshot<DocumentData>) {
  let profile = {
    name: "",
    email: "",
    phone: "",
    avatarUrl: null as string | null,
  };
  const ownerUid = ownerUidFromAgentDoc(d);
  try {
    if (ownerUid) {
      const userSnap = await getDoc(doc(getFirestoreDb(), "users", ownerUid));
      if (userSnap.exists()) {
        const u = userSnap.data();
        profile = {
          name: asString(u.fullName) || asString(u.nickname),
          email: asString(u.email),
          phone: asString(u.phone),
          avatarUrl: (u.avatarUrl as string | null | undefined) ?? null,
        };
      }
    }
  } catch {
    /* ignore */
  }
  return mapAgentDoc(d, profile);
}

export async function fetchAgentApplicationsPage(opts?: {
  status?: AgentAppStatus | "all";
  typeKey?: string | "all";
  pageSize?: number;
  cursor?: PageCursor;
}): Promise<PageResult<AgentApplication>> {
  const pageSize = opts?.pageSize ?? PAGE_SIZE;
  const status = opts?.status ?? "all";
  const typeKey = opts?.typeKey ?? "all";

  // Over-fetch a bit when client-side type filter is needed.
  const fetchLimit = typeKey !== "all" ? pageSize * 3 + 1 : pageSize + 1;

  const constraints: QueryConstraint[] = [];
  if (status !== "all") {
    constraints.push(where("status", "==", status));
  }
  constraints.push(orderBy("submittedAt", "desc"));
  if (opts?.cursor) constraints.push(startAfter(opts.cursor));
  constraints.push(limit(fetchLimit));

  let docs: QueryDocumentSnapshot<DocumentData>[] = [];
  try {
    const snap = await getDocs(
      query(collection(getFirestoreDb(), "agents"), ...constraints),
    );
    docs = snap.docs.filter((d) => d.data().user);
  } catch {
    const fallback: QueryConstraint[] = [];
    if (opts?.cursor) fallback.push(startAfter(opts.cursor));
    fallback.push(limit(fetchLimit));
    const snap = await getDocs(
      query(collection(getFirestoreDb(), "agents"), ...fallback),
    );
    docs = snap.docs.filter((d) => {
      if (!d.data().user) return false;
      if (status === "all") return true;
      return asString(d.data().status, "pending") === status;
    });
  }

  if (typeKey !== "all") {
    docs = docs.filter(
      (d) => normalizeAgentType(asString(d.data().type)) === typeKey,
    );
  }

  const hasMore = docs.length > pageSize;
  const slice = hasMore ? docs.slice(0, pageSize) : docs;
  const items = await Promise.all(slice.map((d) => enrichAgent(d)));

  return {
    items,
    lastDoc: slice.length ? slice[slice.length - 1] : null,
    hasMore,
  };
}

/** @deprecated use fetchAgentApplicationsPage */
export async function fetchAgentApplications(
  status: AgentAppStatus | "all" = "all",
): Promise<AgentApplication[]> {
  const page = await fetchAgentApplicationsPage({ status, pageSize: PAGE_SIZE });
  return page.items;
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
    const ownerUid =
      asString(data.ownerUid) ||
      (data.user && typeof data.user === "object" && "id" in data.user
        ? String((data.user as { id: string }).id)
        : "") ||
      (!id.includes("_") ? id : id.split("_")[0] ?? "");
    if (ownerUid) {
      const userSnap = await getDoc(doc(getFirestoreDb(), "users", ownerUid));
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
  }

  await updateDoc(ref, payload);
}

export async function deleteAgentApplication(id: string): Promise<void> {
  await deleteDoc(doc(getFirestoreDb(), "agents", id));
}

export async function fetchDashboardStats() {
  async function countCol(
    col: string,
    ...constraints: QueryConstraint[]
  ): Promise<number> {
    try {
      const snap = await getCountFromServer(
        query(collection(getFirestoreDb(), col), ...constraints),
      );
      return snap.data().count;
    } catch {
      const snap = await getDocs(
        query(collection(getFirestoreDb(), col), ...constraints, limit(100)),
      );
      return snap.size;
    }
  }

  const [
    users,
    contentsPending,
    contentsApproved,
    applicationsPending,
    ...listingPendingCounts
  ] = await Promise.all([
    countCol("users"),
    countCol("contents", where("status", "==", "pending")),
    countCol("contents", where("status", "==", "approved")),
    countCol("agents", where("status", "==", "pending")),
    ...LISTING_COLLECTIONS.map(({ key }) =>
      countCol(key, where("status", "==", "pending")),
    ),
  ]);

  const listingCounts = await Promise.all(
    LISTING_COLLECTIONS.map(({ key }) => countCol(key)),
  );

  return {
    users,
    contentsPending,
    contentsApproved,
    applicationsPending,
    listingsPending: listingPendingCounts.reduce((a, b) => a + b, 0),
    listings: listingCounts.reduce((a, b) => a + b, 0),
  };
}
