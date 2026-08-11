export type ModerationStatus = "pending" | "approved" | "rejected";

export type AgentAppStatus = "pending" | "approved" | "rejected";

export type ListingCollection =
  | "listings"
  | "estate"
  | "secondhand"
  | "spare_parts"
  | "tutors"
  | "helpers";

export interface UserDoc {
  id: string;
  uid: string;
  fullName: string;
  nickname: string;
  email: string;
  phone: string;
  bio?: string | null;
  avatarUrl?: string | null;
  credits: number;
  isPremium: boolean;
  isAdmin?: boolean;
  listingCount: number;
  followerCount: number;
  followingCount: number;
  referralCode?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface ContentDoc {
  id: string;
  ownerUid: string;
  mediaUrl: string;
  mediaPath?: string;
  mediaType: string;
  description: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  status: ModerationStatus;
  createdAt?: Date | null;
  ownerName?: string;
  publisherName?: string;
  publisherAvatarUrl?: string;
  publisherFollowerCount?: number;
}

export interface ListingDoc {
  id: string;
  collection: ListingCollection;
  title: string;
  price?: number | null;
  location?: string;
  ownerUid: string;
  isPublished: boolean;
  status?: ModerationStatus;
  photoUrls?: string[];
  description?: string;
  phone?: string;
  createdAt?: Date | null;
  raw: Record<string, unknown>;
}

export interface AgentApplication {
  id: string;
  type: string;
  typeKey: string;
  status: AgentAppStatus;
  nationalId: string;
  province: string;
  district: string;
  address: string;
  submittedAt?: Date | null;
  submittedAtIso?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  avatarUrl?: string | null;
}

export const LISTING_COLLECTIONS: {
  key: ListingCollection;
  label: string;
}[] = [
  { key: "listings", label: "Vasıta" },
  { key: "estate", label: "Emlak" },
  { key: "secondhand", label: "İkinci El" },
  { key: "spare_parts", label: "Yedek Parça / Ekipman" },
  { key: "tutors", label: "Eğitmen" },
  { key: "helpers", label: "Yardımcı" },
];

export function normalizeAgentType(type: string): string {
  const t = type.trim().toLowerCase();
  if (t.includes("bireysel") || t === "individual" || t === "ajan")
    return "individual";
  if (t.includes("usta") || t === "master") return "master";
  if (t.includes("exper") || t.includes("expert")) return "expert";
  if (t.includes("servis") || t === "service") return "service";
  return type || "unknown";
}

export function agentTypeLabel(type: string): string {
  const key = normalizeAgentType(type);
  switch (key) {
    case "individual":
      return "Ajan (Bireysel)";
    case "master":
      return "Usta";
    case "expert":
      return "Exper";
    case "service":
      return "Servis";
    default:
      return type || "—";
  }
}
