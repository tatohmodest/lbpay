"use client";

import Link from "next/link";
import { BusinessPageHeader } from "@/components/business/page-header";
import { formatXAF } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { payLinkPath, payLinkUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";

export default function BusinessInvoicesPage() {
  const data = useQuery({
    queryKey: ["business"],
    queryFn: async () => (await fetch("/api/business")).json(),
  });
  const origin = useBrowserOrigin();
  const links = data.data?.links || [];

  return (
    <div className="mx-auto max-w-lg lg:mx-0 lg:max-w-3xl">
      <BusinessPageHeader title="Invoices" copy="Send a bill your customer can pay online." />
      <div className="overflow-hidden rounded-[2rem] bg-white p-2 shadow-[0_1px_2px_rgba(12,25,19,0.04)]">
        {links.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">None</p>
        ) : (
          links.map(
            (link: {
              id: string;
              title: string;
              slug: string;
              amount: number | null;
              collected: number;
              imageUrl?: string;
            }) => (
              <div key={link.id} className="flex items-center gap-3 rounded-2xl px-3 py-3">
                {link.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.imageUrl} alt="" className="h-11 w-11 rounded-2xl object-cover" />
                ) : (
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-[10px] font-bold text-brand-deep">
                    Pay
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{link.title}</p>
                  <p className="truncate font-mono text-[11px] text-muted">{payLinkUrl(link.slug, origin)}</p>
                  <Link href={payLinkPath(link.slug)} className="text-sm font-bold text-brand">
                    Open checkout
                  </Link>
                </div>
                <p className="shrink-0 font-mono text-sm font-black">
                  {link.amount ? formatXAF(link.amount, { withCurrency: false }) : "Open"}
                </p>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}
