const KEY = "lbpay.authNext";
const BLOCKED_NEXT_PREFIXES = ["/login", "/signup", "/verify", "/forgot"];

export function isSafeNextPath(value: string) {
  const path = String(value || "").trim();
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
  return !BLOCKED_NEXT_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function rememberAuthNext(path: string) {
  if (typeof window === "undefined") return;
  if (!isSafeNextPath(path)) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* ignore */
  }
}

export function consumeAuthNext(fallback = "/wallet") {
  if (typeof window === "undefined") return fallback;
  try {
    const next = sessionStorage.getItem(KEY) || "";
    sessionStorage.removeItem(KEY);
    if (isSafeNextPath(next)) return next;
  } catch {
    /* ignore */
  }
  return fallback;
}
