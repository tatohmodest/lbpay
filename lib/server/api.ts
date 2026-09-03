import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { MailSendError } from "@/lib/server/mail";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, isLocale, localeFromAcceptLanguage, type Locale } from "@/lib/i18n/locale";
import { translate } from "@/lib/i18n/messages";

export function jsonError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

async function routeLocale(): Promise<Locale> {
  try {
    const header = (await headers()).get(LOCALE_HEADER);
    if (isLocale(header)) return header;
    const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (isLocale(cookie)) return cookie;
    return localeFromAcceptLanguage((await headers()).get("accept-language"));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function catchRoute(scope: string, err: unknown) {
  console.error(`[lbpay] ${scope} failed`, err);
  const locale = await routeLocale();
  if (err instanceof MailSendError || /email|smtp|mail/i.test(err instanceof Error ? err.message : String(err || ""))) {
    return NextResponse.json({ error: translate(locale, "errors.emailSend") }, { status: 503 });
  }
  return NextResponse.json({ error: translate(locale, "errors.generic") }, { status: 500 });
}
