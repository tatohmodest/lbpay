"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { cn } from "@/lib/cn";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const home = path === "/";

  return (
    <div className={cn("min-h-screen bg-white", home && "font-mono")}>
      <SiteHeader />
      <div className="pt-header">{children}</div>
      <SiteFooter />
    </div>
  );
}
