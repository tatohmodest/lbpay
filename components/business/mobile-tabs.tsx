"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/business", label: "Overview" },
  { href: "/business/payments", label: "Sales" },
  { href: "/business/links", label: "Links" },
  { href: "/business/customers", label: "Customers" },
  { href: "/business/qr", label: "QR" },
  { href: "/business/invoices", label: "Invoices" },
  { href: "/business/analytics", label: "Stats" },
  { href: "/business/settlements", label: "Settle" },
  { href: "/business/settings", label: "Settings" },
];

export function BusinessMobileTabs() {
  const pathname = usePathname();

  return (
    <div className="sticky top-16 z-30 -mx-4 mb-4 border-b border-line/70 bg-paper/95 px-4 py-2 backdrop-blur-xl lg:hidden">
      <nav className="-mx-1 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active =
            tab.href === "/business" ? pathname === "/business" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition",
                active ? "bg-forest text-white" : "bg-white text-muted",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
