export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lbpay_lang";
export const LOCALE_HEADER = "x-lbpay-lang";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "fr";
}

export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  const raw = String(header || "").toLowerCase();
  if (!raw) return DEFAULT_LOCALE;
  const parts = raw.split(",").map((item) => {
    const [tag, ...params] = item.trim().split(";");
    const q = params.find((p) => p.trim().startsWith("q="));
    const quality = q ? Number(q.trim().slice(2)) : 1;
    return { tag: (tag || "").trim(), quality: Number.isFinite(quality) ? quality : 0 };
  });
  parts.sort((a, b) => b.quality - a.quality);
  for (const part of parts) {
    if (part.tag === "*" || !part.tag) continue;
    if (part.tag === "fr" || part.tag.startsWith("fr-")) return "fr";
    if (part.tag === "en" || part.tag.startsWith("en-")) return "en";
  }
  return DEFAULT_LOCALE;
}

export function localeFromCookieHeader(cookie: string | null | undefined): Locale | null {
  const match = String(cookie || "").match(/(?:^|;\s*)lbpay_lang=([^;]+)/i);
  const value = match?.[1] ? decodeURIComponent(match[1].trim()) : "";
  return isLocale(value) ? value : null;
}

export function localeFromRequest(request: Request): Locale {
  const header = request.headers.get(LOCALE_HEADER);
  if (isLocale(header)) return header;
  return localeFromCookieHeader(request.headers.get("cookie")) || localeFromAcceptLanguage(request.headers.get("accept-language"));
}

export function localeFromNavigator(languages: readonly string[] | string | undefined): Locale {
  const list = Array.isArray(languages) ? languages : languages ? [languages] : [];
  return localeFromAcceptLanguage(list.join(","));
}
