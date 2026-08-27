"use client";

import { useState } from "react";
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
  const standalone = useStandaloneDisplay();
  const showInstall = !standalone;
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setOpen(false);
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-white/80 backdrop-blur-xl">
        <Container className="flex h-[var(--header-h)] items-center justify-between gap-4">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition",
                    active ? "bg-brand-soft text-brand-deep" : "text-muted hover:text-ink",
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
                className="px-3 text-sm font-medium text-muted hover:text-ink"
              >
                Get app
              </button>
            ) : null}
            <Link href="/login" className="px-3 text-sm font-medium text-muted hover:text-ink">
              Sign in
            </Link>
            <Link href="/signup">
              <Button size="sm">Open wallet</Button>
            </Link>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            {showInstall ? (
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink"
                aria-label="Get the LBPay app"
                onClick={() => openInstallPrompt()}
              >
                <Download className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink"
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
        subtitle="Move money across Cameroon."
        footer={
          <div className="grid gap-2">
            {showInstall ? (
              <Button
                variant="secondary"
                className="w-full"
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
                <Button variant="secondary" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="w-full">Open wallet</Button>
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
                  "flex items-center gap-3 rounded-2xl px-3 py-3 transition",
                  active ? "bg-brand-soft text-brand-deep" : "text-ink hover:bg-paper",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
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
