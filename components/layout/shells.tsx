"use client";

import { useMe } from "@/lib/hooks/wallet";
import { AppHeader, BottomNav } from "@/components/layout/app-header";
import { ConsoleSidebar, type NavItem } from "@/components/layout/console-sidebar";
import { cn } from "@/lib/cn";

export function Guard({ children }: { children: React.ReactNode }) {
  const me = useMe();

  if (!me.isFetched || !me.data?.session) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">
        Opening your account…
      </div>
    );
  }

  return <>{children}</>;
}

export function WalletShell({ children }: { children: React.ReactNode }) {
  return (
    <Guard>
      <div className="min-h-screen pb-24 md:pb-0">
        <AppHeader />
        <main className="mx-auto max-w-7xl px-4 pb-6 pt-[calc(var(--header-h)+1.25rem)] md:px-8 md:pb-8">{children}</main>
        <BottomNav />
      </div>
    </Guard>
  );
}

export function ConsoleShell({
  items,
  title,
  subtitle,
  cta,
  children,
}: {
  items: NavItem[];
  title: string;
  subtitle: string;
  cta?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <Guard>
      <div className="min-h-screen bg-paper">
        <div className="lg:hidden">
          <AppHeader />
        </div>
        <ConsoleSidebar title={title} subtitle={subtitle} items={items} cta={cta} />
        <main className={cn("px-4 pb-24 pt-[calc(var(--header-h)+1.25rem)] md:px-8 md:pb-8 lg:ml-64 lg:pt-8")}>{children}</main>
        <BottomNav />
      </div>
    </Guard>
  );
}
