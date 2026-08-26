"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader, BottomNav } from "@/components/layout/app-header";
import { ConsoleSidebar, type NavItem } from "@/components/layout/console-sidebar";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/cn";

export function Guard({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.session) router.replace("/login");
  }, [state.session, router]);

  if (!state.session) {
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
      <div className="min-h-screen pb-24 lg:pb-0">
        <AppHeader />
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</main>
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
        <main className={cn("px-4 py-6 pb-24 md:px-8 lg:ml-64 lg:pb-8")}>{children}</main>
        <BottomNav />
      </div>
    </Guard>
  );
}
