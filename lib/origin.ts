export function browserOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin.replace(/\/$/, "");
}

export function payHandlePath(handle: string) {
  const id = handle.replace(/^@/, "").trim().toLowerCase();
  return `/p/${encodeURIComponent(id)}`;
}

export function payLinkPath(slug: string) {
  return `/pay/${encodeURIComponent(slug)}`;
}

export function payHandleUrl(handle: string, origin = browserOrigin()) {
  return origin ? `${origin}${payHandlePath(handle)}` : payHandlePath(handle);
}

export function payLinkUrl(slug: string, origin = browserOrigin()) {
  return origin ? `${origin}${payLinkPath(slug)}` : payLinkPath(slug);
}

export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host)
    .split(",")[0]
    .trim();
  const proto = (request.headers.get("x-forwarded-proto") || url.protocol.replace(":", ""))
    .split(",")[0]
    .trim()
    .toLowerCase();
  const scheme = proto === "http" || proto === "https" ? proto : "https";
  if (!host) return url.origin;
  return `${scheme}://${host}`;
}

export function sameOriginReturnUrl(raw: string | undefined, origin: string, fallbackPath: string) {
  const path = fallbackPath.startsWith("/") ? fallbackPath : `/${fallbackPath}`;
  const fallback = `${origin}${path}`;
  if (!raw) return fallback;
  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin) return fallback;
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}
