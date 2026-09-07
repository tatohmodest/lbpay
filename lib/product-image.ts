const DATA_IMAGE = /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/]+=*$/i;

export function isSafeProductImageUrl(raw: string) {
  const url = String(raw || "").trim();
  if (!url) return false;
  if (DATA_IMAGE.test(url) && url.length <= 700_000) return true;
  if (url.length > 500) return false;
  if (url.includes("\\") || url.includes("..")) return false;
  if (url.startsWith("/uploads/links/") || url.startsWith("/illustrations/")) {
    return /^\/[a-zA-Z0-9/_.-]+$/.test(url);
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function publicProductImageUrl(raw: string | undefined, origin: string) {
  const url = String(raw || "").trim();
  if (!isSafeProductImageUrl(url)) return "";
  if (url.startsWith("http")) return url;
  const base = origin.replace(/\/$/, "");
  return `${base}${url}`;
}
