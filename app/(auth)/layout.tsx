"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { isNativeApp } from "@/lib/native";

function subscribe() {
  return () => undefined;
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const native = useSyncExternalStore(subscribe, isNativeApp, () => false);
  return (
    <div className="min-h-screen bg-paper">
      {native ? null : <SiteHeader />}
      <div className={native ? "pt-[env(safe-area-inset-top)]" : "pt-header"}>{children}</div>
    </div>
  );
}
