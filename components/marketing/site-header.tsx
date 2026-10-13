"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Code2, Download, Heart, Menu, Receipt, ShieldCheck, Store, TrendingUp, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { RightDrawer } from "@/components/ui/right-drawer";
import { Container } from "@/components/marketing/container";
import { cn } from "@/lib/cn";
import { openInstallPrompt, useStandaloneDisplay } from "@/lib/pwa";
import { useI18n, useL } from "@/lib/i18n/use-i18n";
import { LanguageToggle } from "@/components/language-toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedPath, setOpenedPath] = useState(pathname);
  const [scrolled, setScrolled] = useState(false);
  const standalone = useStandaloneDisplay();
  const showInstall = !standalone;
  const menuOpen = open && openedPath === pathname;
  const { t } = useI18n();
  const L = useL();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/products/wallet", label: t("nav.personal"), icon: Wallet, copy: L("Your XAF wallet and @handle", "Votre portefeuille XAF et @identifiant") },
    { href: "/products/business", label: t("nav.business"), icon: Store, copy: L("Shop links, QR and checkout", "Liens boutique, QR et paiement") },
    { href: "/products/developers", label: t("nav.developers"), icon: Code2, copy: L("Payments API, sandbox, webhooks", "API de paiement, sandbox, webhooks") },
    { href: "/pricing", label: t("nav.pricing"), icon: Receipt, copy: L("Every fee, in plain numbers", "Tous les frais, en clair") },
    { href: "/security", label: t("nav.security"), icon: ShieldCheck, copy: L("How your money is protected", "Comment votre argent est protégé") },
    { href: "/investors", label: L("Investors", "Investisseurs"), icon: TrendingUp, copy: L("Back what we're building", "Soutenez ce que nous construisons") },
  ];
  const secondary = [
    { href: "/about", label: t("nav.about"), icon: Heart, copy: L("Who builds LBPay, and why", "Qui construit LBPay, et pourquoi") },
    { href: "/docs", label: t("nav.docs"), icon: BookOpen, copy: L("API reference and guides", "Référence API et guides") },
  ];
  if (pathname === "/welcome") return null;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 pt-[var(--safe-top)] transition-[background-color,box-shadow] duration-300",
          scrolled
            ? "bg-forest/90 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
            : "bg-forest",
        )}
      >
        <Container className="flex h-16 items-center justify-between gap-4 md:h-[4.25rem]">
          <Logo tone="dark" className="shrink-0" />
          <nav aria-label="Primary" className="hidden min-w-0 items-center gap-0 lg:flex xl:gap-0.5">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-full px-2.5 py-2 text-[13.5px] font-medium transition xl:px-3.5 xl:text-[14px]",
                    active ? "bg-white/10 text-white" : "text-white/65 hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden shrink-0 items-center gap-1 lg:flex">
            <LanguageToggle tone="dark" />
            {showInstall ? (
              <button
                type="button"
                onClick={() => openInstallPrompt()}
                className="hidden whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-medium text-white/65 transition hover:text-white xl:inline-flex"
              >
                {t("nav.getApp")}
              </button>
            ) : null}
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full px-2.5 py-2 text-[14px] font-medium text-white/80 transition hover:text-white xl:px-3"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/signup"
              className="ml-1 inline-flex h-10 items-center whitespace-nowrap rounded-full bg-brand px-4 xl:px-5 text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,179,105,0.7)] transition hover:bg-brand-dark"
            >
              {t("nav.signup")}
            </Link>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageToggle tone="dark" />
            {showInstall ? (
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
                aria-label={L("Get the LBPay app", "Installer l'app LBPay")}
                onClick={() => openInstallPrompt()}
              >
                <Download className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
              aria-expanded={menuOpen}
              aria-label={L("Open menu", "Ouvrir le menu")}
              onClick={() => {
                setOpenedPath(pathname);
                setOpen(true);
              }}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </Container>
      </header>

      <RightDrawer
        open={menuOpen}
        onClose={() => setOpen(false)}
        title="LBPay"
        subtitle={L("Money that feels at home.", "Votre argent, enfin chez vous.")}
        footer={
          <div className="grid gap-2">
            {showInstall ? (
              <Button
                variant="secondary"
                className="w-full rounded-full"
                onClick={() => {
                  setOpen(false);
                  openInstallPrompt();
                }}
              >
                <Download className="h-4 w-4" /> {L("Get the app", "Installer l'app")}
              </Button>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-full border border-line bg-white text-sm font-semibold text-ink"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
              >
                {t("nav.signup")}
              </Link>
            </div>
          </div>
        }
      >
        <nav className="flex flex-col gap-1">
          {[...links, ...secondary].map((link, i) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 transition",
                  active ? "bg-brand-soft text-brand-deep" : "text-ink hover:bg-paper",
                  i === links.length && "mt-3 border-t border-line pt-4",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl",
                    active ? "bg-white text-brand-deep" : "bg-paper text-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{link.label}</span>
                  <span className="block text-xs text-muted">{link.copy}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </RightDrawer>
    </>
  );
}
