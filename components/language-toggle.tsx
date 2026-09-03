"use client";

import { useI18n } from "@/lib/i18n/use-i18n";
import { cn } from "@/lib/cn";

export function LanguageToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { locale, setLocale, t } = useI18n();
  const next = locale === "fr" ? "en" : "fr";
  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]",
        tone === "dark" ? "text-white/70 hover:text-white" : "text-muted hover:text-ink",
      )}
      aria-label={t("lang.choose")}
    >
      {locale === "fr" ? "FR" : "EN"}
    </button>
  );
}
