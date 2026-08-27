"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Code2, Download, Menu, Shield, Store, Wallet, UserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { RightDrawer } from "@/components/ui/right-drawer";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { cn } from "@/lib/cn";
import { isAdmin, productUnlocked } from "@/lib/roles";
import { openInstallPrompt, useStandaloneDisplay } from "@/lib/pwa";
import { openPushPrompt } from "@/lib/push-client";
import Image from "next/image";

export function AppHeader({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const pathname = usePathname();
  const { state } = useApp();
  const me = useMe();
  const user = me.data?.user;
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const standalone = useStandaloneDisplay();
  const showInstall = !standalone;
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setOpen(false);
  }
  const products = [
    { href: "/wallet", label: "Wallet", icon: Wallet, copy: "Send and receive XAF", show: true },
    {
      href: "/business",
      label: "Business",
      icon: Store,
      copy: productUnlocked(user, "business") ? "Checkout and collections" : "Apply for merchant tools",
      show: true,
    },
    {
      href: "/developers",
      label: "Developers",
      icon: Code2,
      copy: productUnlocked(user, "developer") ? "API keys and webhooks" : "Apply for API access",
      show: true,
    },
    { href: "/admin", label: "Admin", icon: Shield, copy: "Platform control", show: isAdmin(user) },
  ].filter((item) => item.show);

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Logo href="/wallet" markClassName="h-8 w-8" />
          <nav className="hidden items-center gap-1 lg:flex">
            {products.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition",
                    active ? "bg-brand-soft text-brand-deep" : "text-muted hover:text-ink",
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
          {showInstall ? (
            <button
              type="button"
              className="rounded-full p-2 text-muted hover:bg-brand-soft hover:text-brand"
              aria-label="Get the LBPay app"
              onClick={() => openInstallPrompt()}
            >
              <Download className="h-5 w-5" />
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-full p-2 text-muted hover:bg-brand-soft hover:text-brand"
            aria-label="Transaction alerts"
            onClick={() => openPushPrompt()}
          >
            <Bell className="h-5 w-5" />
          </button>
          <Link
            href="/wallet/profile"
            className="hidden h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line sm:flex"
          >
            <Image
              src={state.user.avatar || "/illustrations/empty-wallet.png"}
              alt={state.user.name || "Account"}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink lg:hidden"
            aria-label="Open menu"
            onClick={() => (onOpenMenu ? onOpenMenu() : setOpen(true))}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>

      {!onOpenMenu ? (
        <RightDrawer
          open={open}
          onClose={() => setOpen(false)}
          title="LBPay"
          subtitle="Account"
          footer={
            <Link
              href="/wallet/profile"
              className="flex items-center gap-3 rounded-2xl bg-paper px-3 py-3"
            >
              <span className="flex h-10 w-10 overflow-hidden rounded-full border border-line">
                <Image
                  src={state.user.avatar || "/illustrations/empty-wallet.png"}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </span>
              <span>
                <span className="block text-sm font-medium text-ink">Profile</span>
                <span className="block text-xs text-muted">Settings and account</span>
              </span>
            </Link>
          }
        >
          <nav className="flex flex-col gap-1">
            {products.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3",
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
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block text-xs text-muted">{item.copy}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </RightDrawer>
      ) : null}
    </>
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
              "flex flex-col items-center gap-1 text-[11px] font-medium tracking-wide",
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
