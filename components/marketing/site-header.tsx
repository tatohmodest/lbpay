"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/marketing/container";
import { cn } from "@/lib/cn";

const links = [
  { href: "/products/wallet", label: "Personal" },
  { href: "/products/business", label: "Business" },
  { href: "/products/developers", label: "Developers" },
  { href: "/docs", label: "Docs" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
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
          <Link href="/login" className="px-3 text-sm font-medium text-muted hover:text-ink">
            Sign in
          </Link>
          <Link href="/signup">
            <Button size="sm">Open wallet</Button>
          </Link>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>
      {open ? (
        <div className="border-t border-line bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-ink hover:bg-paper"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="secondary" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)}>
                <Button className="w-full">Open wallet</Button>
              </Link>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
