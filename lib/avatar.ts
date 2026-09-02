export const DEFAULT_AVATAR = "/illustrations/avatar-modest.webp";

const PLACEHOLDERS = new Set([
  "",
  "/illustrations/empty-wallet.webp",
  "/illustrations/empty-wallet.png",
]);

export function resolveAvatar(src?: string | null) {
  const value = (src || "").trim();
  if (!value || PLACEHOLDERS.has(value)) return DEFAULT_AVATAR;
  return value;
}
