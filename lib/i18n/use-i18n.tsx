"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localeFromNavigator, type Locale } from "@/lib/i18n/locale";
import { translate } from "@/lib/i18n/messages";

type I18nApi = {
  locale: Locale;
  t: (path: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nApi | null>(null);

function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = locale;
}

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const router = useRouter();
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE;

  const setLocale = useCallback(
    (next: Locale) => {
      persistLocale(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nApi>(
    () => ({
      locale: resolved,
      t: (path, vars) => translate(resolved, path, vars),
      setLocale,
    }),
    [resolved, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      t: (path: string, vars?: Record<string, string | number>) => translate(DEFAULT_LOCALE, path, vars),
      setLocale: (next: Locale) => persistLocale(next),
    };
  }
  return ctx;
}

export function detectBrowserLocale() {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  return localeFromNavigator(navigator.languages?.length ? navigator.languages : navigator.language);
}
