export const DEFAULT_AVATAR = "/illustrations/empty-wallet.webp";

const PLACEHOLDERS = new Set([
  "",
  "/illustrations/empty-wallet.webp",
  "/illustrations/empty-wallet.png",
  "/illustrations/avatar-modest.webp",
  "/illustrations/avatar-modest.png",
]);

export function isDefaultAvatar(src?: string | null) {
  const value = (src || "").trim();
  return !value || PLACEHOLDERS.has(value) || value === DEFAULT_AVATAR;
}

export function resolveAvatar(src?: string | null) {
  const value = (src || "").trim();
  if (!value || PLACEHOLDERS.has(value)) return DEFAULT_AVATAR;
  return value;
}

export function nameInitials(name?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0];
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1];
  return `${first[0] || ""}${last[0] || ""}`.toUpperCase();
}
