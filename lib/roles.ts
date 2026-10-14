import type { AccountKind, UserProfile } from "@/lib/types";
import { DEFAULT_AVATAR } from "@/lib/avatar";

export const PRODUCT_ROLES: AccountKind[] = ["personal", "business", "developer"];

export function bootstrapAdminEmails() {
  const fromEnv = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(["modestwilton@gmail.com", ...fromEnv])];
}

export function isBootstrapAdmin(email: string) {
  return bootstrapAdminEmails().includes(email.trim().toLowerCase());
}

export function shouldSkipAdminOtp(user: { email?: string | null } | null | undefined) {
  return Boolean(user?.email && isBootstrapAdmin(user.email));
}

export function hasKind(
  user: { roles?: AccountKind[]; kyc?: { business?: string; developer?: string } } | null | undefined,
  kind: AccountKind,
) {
  if (!user?.roles?.length) return kind === "personal";
  if (user.roles.includes("admin")) return true;
  if (user.roles.includes(kind)) return true;
  if ((kind === "business" || kind === "developer") && user.kyc?.[kind] === "verified") return true;
  return false;
}

export function isAdmin(user: { roles?: AccountKind[] } | null | undefined) {
  return Boolean(user?.roles?.includes("admin"));
}

export function productUnlocked(
  user:
    | {
        roles?: AccountKind[];
        kyc?: { personal?: string; business?: string; developer?: string };
      }
    | null
    | undefined,
  kind: "business" | "developer",
) {
  if (isAdmin(user)) return true;
  return user?.kyc?.[kind] === "verified";
}

export function defaultKyc() {
  return {
    personal: "unverified" as const,
    business: "unverified" as const,
    developer: "unverified" as const,
  };
}

export function emptyProfile(): UserProfile {
  return {
    id: "",
    name: "",
    lbpayId: "",
    email: "",
    phone: "",
    avatar: DEFAULT_AVATAR,
    kycStatus: "unverified",
    roles: ["personal"],
    status: "active",
    kyc: defaultKyc(),
  };
}

/* ------------------------------------------------------------------ */
/* Admin permissions                                                   */
/* ------------------------------------------------------------------ */

/**
 * What a staff admin may touch. Owners (emails in ADMIN_EMAILS) have every
 * scope and are the only ones who can create admins or change scopes.
 */
export const ADMIN_SCOPES = ["support", "kyc", "users", "finance", "audit"] as const;
export type AdminScope = (typeof ADMIN_SCOPES)[number];

export const ADMIN_SCOPE_INFO: Record<AdminScope, { label: string; copy: string }> = {
  support: { label: "Support", copy: "Read and reply to customer chats" },
  kyc: { label: "KYC", copy: "Approve or reject identity and business checks" },
  users: { label: "Users", copy: "Freeze or restore accounts, grant business and developer access" },
  finance: { label: "Finance", copy: "Fix transactions and credit or debit wallets" },
  audit: { label: "Audit", copy: "Read the audit log" },
};

type AdminLike = { email?: string | null; roles?: AccountKind[]; adminScopes?: readonly string[] | null } | null | undefined;

export function isAdminOwner(user: AdminLike) {
  return isAdmin(user) && Boolean(user?.email && isBootstrapAdmin(user.email));
}

/** Scopes this admin holds. Admins created before scopes existed keep full access until an owner sets theirs. */
export function adminScopesFor(user: AdminLike): AdminScope[] {
  if (!isAdmin(user)) return [];
  if (isAdminOwner(user) || !Array.isArray(user?.adminScopes)) return [...ADMIN_SCOPES];
  return ADMIN_SCOPES.filter((scope) => user!.adminScopes!.includes(scope));
}

export function hasAdminScope(user: AdminLike, scope: AdminScope) {
  return adminScopesFor(user).includes(scope);
}
