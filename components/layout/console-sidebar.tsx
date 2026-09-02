"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Code2, Store, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/logo";
import { RightDrawer } from "@/components/ui/right-drawer";
import { NotificationsButton } from "@/components/notifications-button";
import { useMe } from "@/lib/hooks/wallet";
import { productUnlocked } from "@/lib/roles";

export type NavItem = { href: string; label: string; icon: LucideIcon };

function ProductSwitch({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const me = useMe();
  const user = me.data?.user;
  const products = [
    { href: "/wallet", label: "Wallet", icon: Wallet, copy: "Send, receive, and pay" },
    {
      href: "/business",
      label: "Business",
      icon: Store,
      copy: productUnlocked(user, "business")
        ? "Get paid by your customers"
        : "Accept payments from your customers",
    },
    {
      href: "/developers",
      label: "Developers",
      icon: Code2,
      copy: productUnlocked(user, "developer")
        ? "Payments for your product"
        : "Add payments to your app",
    },
  ];
  return (
    <div className="mt-auto border-t border-line pt-3">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Products</p>
      <nav className="flex flex-col gap-1">
        {products.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 transition",
                active ? "bg-brand-soft text-brand-deep" : "text-muted hover:bg-paper hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block text-[11px] leading-4 text-muted">{item.copy}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
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
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-ink text-white"
                : "text-muted hover:bg-paper hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ConsoleSidebar({
  title,
  subtitle,
  items,
  cta,
  mobileOpen = false,
  onMobileClose,
}: {
  title: string;
  subtitle: string;
  items: NavItem[];
  cta?: { href: string; label: string };
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const close = () => onMobileClose?.();

  return (
    <>
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col border-r border-line bg-white p-3 lg:flex">
        <div className="mb-6 flex items-start justify-between gap-2 px-2 pt-3">
          <div>
            <Logo href="/" markClassName="h-8 w-8" />
            <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
            <p className="text-xs text-muted">{subtitle}</p>
          </div>
          <NotificationsButton className="mt-1" />
        </div>
        {cta ? (
          <Link
            href={cta.href}
            className="mb-4 flex items-center justify-center rounded-full bg-brand px-4 py-3 text-sm font-medium text-white hover:bg-brand-dark"
          >
            {cta.label}
          </Link>
        ) : null}
        <SidebarLinks items={items} />
        <ProductSwitch />
        <Link
          href="/docs"
          className="rounded-2xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-brand-soft hover:text-brand-deep"
        >
          Documentation
        </Link>
      </aside>

      <RightDrawer
        open={mobileOpen}
        onClose={close}
        title={title}
        subtitle={subtitle}
        footer={
          cta ? (
            <Link
              href={cta.href}
              onClick={close}
              className="flex h-11 items-center justify-center rounded-full bg-brand text-sm font-medium text-white"
            >
              {cta.label}
            </Link>
          ) : null
        }
      >
        <SidebarLinks items={items} onNavigate={close} />
        <ProductSwitch onNavigate={close} />
        <Link
          href="/docs"
          onClick={close}
          className="mt-2 block rounded-2xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-paper"
        >
          Documentation
        </Link>
      </RightDrawer>
    </>
  );
}
