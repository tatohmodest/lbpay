"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Code2, Download, Menu, Store, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { RightDrawer } from "@/components/ui/right-drawer";
import { Container } from "@/components/marketing/container";
import { cn } from "@/lib/cn";
import { openInstallPrompt, useStandaloneDisplay } from "@/lib/pwa";

const links = [
  { href: "/products/wallet", label: "Personal", icon: Wallet, copy: "XAF wallet and transfers" },
  { href: "/products/business", label: "Business", icon: Store, copy: "Checkout, QR, and links" },
  { href: "/products/developers", label: "Developers", icon: Code2, copy: "Payments API and keys" },
  { href: "/docs", label: "Docs", icon: BookOpen, copy: "Reference and sandbox notes" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const [scrolled, setScrolled] = useState(false);
  const standalone = useStandaloneDisplay();
  const showInstall = !standalone;
  const onHome = pathname === "/";
  const dark = onHome && !scrolled;

  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-200",
          dark
            ? "border-b border-white/10 bg-[#0a2540]/55 backdrop-blur-xl"
            : "border-b border-line/80 bg-white/80 backdrop-blur-xl",
        )}
      >
        <Container className="flex h-[var(--header-h)] items-center justify-between gap-4">
          <Logo tone={dark ? "dark" : "light"} />
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3.5 py-2 text-sm font-medium transition",
                    active
                      ? dark
                        ? "bg-white/10 text-white"
                        : "bg-brand-soft text-brand-deep"
                      : dark
                        ? "text-white/70 hover:text-white"
                        : "text-muted hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            {showInstall ? (
              <button
                type="button"
                onClick={() => openInstallPrompt()}
                className={cn(
                  "px-3 text-sm font-medium",
                  dark ? "text-white/70 hover:text-white" : "text-muted hover:text-ink",
                )}
              >
                Get app
              </button>
            ) : null}
            <Link
              href="/login"
              className={cn(
                "px-3 text-sm font-medium",
                dark ? "text-white/70 hover:text-white" : "text-muted hover:text-ink",
              )}
            >
              Sign in
            </Link>
            <Link href="/signup">
              <Button size="sm" className="rounded-lg">
                Start now
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            {showInstall ? (
              <button
                type="button"
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-lg border",
                  dark ? "border-white/15 text-white" : "border-line text-ink",
                )}
                aria-label="Get the LBPay app"
                onClick={() => openInstallPrompt()}
              >
                <Download className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-lg border",
                dark ? "border-white/15 text-white" : "border-line text-ink",
              )}
              aria-expanded={open}
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </Container>
      </header>

      <RightDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Menu"
        subtitle="Payments infrastructure for Cameroon."
        footer={
          <div className="grid gap-2">
            {showInstall ? (
              <Button
                variant="secondary"
                className="w-full rounded-lg"
                onClick={() => {
                  setOpen(false);
                  openInstallPrompt();
                }}
              >
                Get the app
              </Button>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login">
                <Button variant="secondary" className="w-full rounded-lg">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="w-full rounded-lg">Start now</Button>
              </Link>
            </div>
          </div>
        }
      >
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 transition",
                  active ? "bg-brand-soft text-brand-deep" : "text-ink hover:bg-paper",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    active ? "bg-white text-brand-deep" : "bg-paper text-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{link.label}</span>
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
