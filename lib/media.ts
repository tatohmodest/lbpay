/**
 * Stored photos (KYC, products, avatars) live in our R2 bucket. Its public
 * address is not reliable and KYC photos must never be public, so the app
 * always shows them through /api/media, which reads the bucket itself.
 */
const MEDIA_PREFIXES = ["kyc/", "links/", "avatars/"];

function r2Hosts() {
  const hosts = new Set<string>();
  for (const raw of [process.env.NEXT_PUBLIC_R2_PUBLIC_URL, "https://pub-98c2191bb9e1446f9eafa841d5d5be11.r2.dev"]) {
    try {
      if (raw) hosts.add(new URL(raw.trim()).hostname);
    } catch {
      /* ignore */
    }
  }
  return hosts;
}

/** The storage key of one of our R2 files, or null for anything else. */
export function mediaKey(url: string | null | undefined): string | null {
  const raw = String(url || "").trim();
  if (!raw) return null;
  let key = "";
  if (raw.startsWith("/api/media/")) key = raw.slice("/api/media/".length);
  else {
    try {
      const parsed = new URL(raw);
      if (!(parsed.hostname.endsWith(".r2.dev") || r2Hosts().has(parsed.hostname))) return null;
      key = parsed.pathname.replace(/^\/+/, "");
    } catch {
      return null;
    }
  }
  key = decodeURIComponent(key);
  if (!key || key.includes("..") || !MEDIA_PREFIXES.some((p) => key.startsWith(p))) return null;
  return key;
}

/** What to put in <img src>. Our R2 files go through /api/media; anything else is unchanged. */
export function mediaSrc<T extends string | null | undefined>(url: T): T | string {
  const key = mediaKey(url);
  return key ? `/api/media/${key.split("/").map(encodeURIComponent).join("/")}` : url;
}
