import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, isLocale, type Locale } from "./locale";
import { translate } from "./messages";

export async function getRequestLocale(): Promise<Locale> {
  const header = (await headers()).get(LOCALE_HEADER);
  if (isLocale(header)) return header;
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  return DEFAULT_LOCALE;
}

export async function tServer(path: string, vars?: Record<string, string | number>) {
  return translate(await getRequestLocale(), path, vars);
}
