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
