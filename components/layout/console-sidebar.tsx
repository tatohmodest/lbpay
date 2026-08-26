"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/logo";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export function ConsoleSidebar({
  title,
  subtitle,
  items,
  cta,
}: {
  title: string;
  subtitle: string;
  items: NavItem[];
  cta?: { href: string; label: string };
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col border-r border-line bg-white p-3 lg:flex">
      <div className="mb-6 px-2 pt-3">
        <Logo href="/" markClassName="h-8 w-8" />
        <p className="mt-3 text-sm font-bold text-ink">{title}</p>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          {subtitle}
        </p>
      </div>
      {cta ? (
        <Link
          href={cta.href}
          className="mb-4 flex items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-dark"
        >
          {cta.label}
        </Link>
      ) : null}
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active =
            item.href === items[0]?.href
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-brand-soft hover:text-brand-dark",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/developers/docs"
        className="mt-auto rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-brand-soft hover:text-brand-dark"
      >
        Documentation
      </Link>
    </aside>
  );
}
