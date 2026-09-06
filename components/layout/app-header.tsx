"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, Download, Globe2, History, Menu, PiggyBank, Shield, Store, UserRound, Wallet } from "lucide-react";
import { Logo } from "@/components/logo";
import { RightDrawer } from "@/components/ui/right-drawer";
import { NotificationsButton } from "@/components/notifications-button";
import { ChatWithUsButton } from "@/components/chat-with-us-button";
import { useApp } from "@/lib/store";
import { useMe } from "@/lib/hooks/wallet";
import { cn } from "@/lib/cn";
import { isAdmin, productUnlocked } from "@/lib/roles";
import { openInstallPrompt, useStandaloneDisplay } from "@/lib/pwa";
import { AppImg } from "@/components/app-img";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/lib/i18n/use-i18n";

export function AppHeader({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const pathname = usePathname();
  const { state } = useApp();
  const me = useMe();
  const user = me.data?.user;
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [openedPath, setOpenedPath] = useState(pathname);
  const standalone = useStandaloneDisplay();
  const showInstall = !standalone;
  const menuOpen = open && openedPath === pathname;
  const products = [
    { href: "/wallet", label: t("nav.wallet"), icon: Wallet, copy: "Send, receive, and pay from one place", show: true },
    { href: "/wallet/savings", label: t("nav.savings"), icon: PiggyBank, copy: "Daily, weekly or monthly pots with a streak", show: true },
    { href: "/wallet/international", label: t("nav.abroad"), icon: Globe2, copy: "Send to 9 countries, receive from anywhere", show: true },
    {
      href: "/business",
      label: t("nav.business"),
      icon: Store,
      copy: productUnlocked(user, "business")
        ? "Get paid by your customers"
        : "Accept payments from your customers",
      show: true,
    },
    {
      href: "/developers",
      label: t("nav.developers"),
      icon: Code2,
      copy: productUnlocked(user, "developer")
        ? "Payments for your product"
        : "Add payments to your app or website",
      show: true,
    },
    { href: "/admin", label: t("nav.admin"), icon: Shield, copy: "Keep the platform running", show: isAdmin(user) },
  ].filter((item) => item.show);

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-40 bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Logo href="/wallet" markClassName="h-8 w-8" />
          <nav className="hidden items-center gap-1 lg:flex">
            {products.map((item) => {
              const active = item.href === "/wallet" ? isBottomNavActive("/wallet", pathname) : pathname.startsWith(item.href);
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
          <LanguageToggle />
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
          <ChatWithUsButton />
          <NotificationsButton />
          <Link
            href="/wallet/profile"
            className="hidden h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white sm:flex"
          >
            <AppImg
              src={state.user.avatar}
              alt={state.user.name || "Account"}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink lg:hidden"
            aria-label="Open menu"
            onClick={() => {
              if (onOpenMenu) {
                onOpenMenu();
                return;
              }
              setOpenedPath(pathname);
              setOpen(true);
            }}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>

      {!onOpenMenu ? (
        <RightDrawer
          open={menuOpen}
          onClose={() => setOpen(false)}
          title="LBPay"
          subtitle="Account"
          footer={
            <Link
              href="/wallet/profile"
              className="flex items-center gap-3 rounded-2xl bg-paper px-3 py-3"
            >
              <span className="flex h-10 w-10 overflow-hidden rounded-full border border-line">
                <AppImg
                  src={state.user.avatar}
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
              const active = item.href === "/wallet" ? isBottomNavActive("/wallet", pathname) : pathname.startsWith(item.href);
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
  const items = [
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/wallet/savings", label: "Save", icon: PiggyBank },
    { href: "/wallet/history", label: "History", icon: History },
    { href: "/business", label: "Business", icon: Store },
    { href: "/wallet/profile", label: "Profile", icon: UserRound },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-[4.5rem] w-full items-center justify-around bg-white/95 pb-safe backdrop-blur-xl md:hidden">
      {items.map((item) => {
        const active = isBottomNavActive(item.href, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 text-[11px] font-medium tracking-wide",
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

function isBottomNavActive(href: string, pathname: string) {
  if (href === "/wallet") {
    if (pathname === "/wallet") return true;
    if (!pathname.startsWith("/wallet/")) return false;
    return !["/wallet/savings", "/wallet/international", "/wallet/history", "/wallet/profile", "/wallet/support"].some(
      (tab) => pathname === tab || pathname.startsWith(`${tab}/`),
    );
  }
  if (href === "/wallet/profile") {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`) ||
      pathname === "/wallet/support" ||
      pathname.startsWith("/wallet/support/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
