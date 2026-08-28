import type { AccountKind, UserProfile } from "@/lib/types";

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
    avatar: "/illustrations/empty-wallet.png",
    kycStatus: "unverified",
    roles: ["personal"],
    status: "active",
    kyc: defaultKyc(),
  };
}
