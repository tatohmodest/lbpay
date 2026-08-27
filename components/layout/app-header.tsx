"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Code2, Shield, Store, Wallet, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { cn } from "@/lib/cn";
import { isAdmin } from "@/lib/roles";
import Image from "next/image";

export function AppHeader() {
  const pathname = usePathname();
  const { state } = useApp();
  const me = useMe();
  const user = me.data?.user;
  const products = [
    { href: "/wallet", label: "Personal", show: true },
    { href: "/business", label: "Business", show: true },
    { href: "/developers", label: "Developers", show: true },
    { href: "/admin", label: "Admin", show: isAdmin(user) },
  ].filter((item) => item.show);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Logo href="/wallet" markClassName="h-8 w-8" />
          <nav className="hidden items-center gap-6 md:flex">
            {products.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "pb-1 text-[15px] transition",
                    active
                      ? "border-b-2 border-brand font-bold text-brand"
                      : "text-muted hover:text-brand",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {state.user.status === "frozen" ? (
            <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold uppercase text-danger">
              Frozen
            </span>
          ) : null}
          <button className="rounded-full p-2 text-muted hover:bg-brand-soft hover:text-brand">
            <Bell className="h-5 w-5" />
          </button>
          <Link
            href="/wallet/profile"
            className="ml-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line"
          >
            <Image
              src={state.user.avatar || "/illustrations/empty-wallet.png"}
              alt={state.user.name || "Account"}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const me = useMe();
  const user = me.data?.user;
  const items = [
    { href: "/wallet", label: "Wallet", icon: Wallet, show: true },
    { href: "/business", label: "Business", icon: Store, show: true },
    { href: "/developers", label: "Dev", icon: Code2, show: true },
    { href: "/admin", label: "Admin", icon: Shield, show: isAdmin(user) },
    { href: "/wallet/profile", label: "Profile", icon: UserRound, show: true },
  ].filter((item) => item.show);

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-[4.5rem] w-full items-center justify-around border-t border-line bg-white pb-safe md:hidden">
      {items.map((item) => {
        const active =
          item.href === "/wallet"
            ? pathname === "/wallet" ||
              (pathname.startsWith("/wallet/") && !pathname.startsWith("/wallet/profile"))
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 text-[11px] font-bold uppercase tracking-wide",
              active ? "text-brand" : "text-muted",
            )}
          >
            <Icon className={cn("h-5 w-5", active && "fill-brand/15")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
