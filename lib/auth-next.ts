const KEY = "lbpay.authNext";

export function isSafeNextPath(value: string) {
  return Boolean(value) && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
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
