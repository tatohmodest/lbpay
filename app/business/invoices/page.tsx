"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
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
    <div>
      <h1 className="text-2xl font-black">Invoices</h1>
      <p className="text-sm text-muted">Send a bill your customer can pay online.</p>
      <Card className="mt-6 divide-y divide-line">
        {links.length === 0 ? (
          <p className="p-6 text-sm text-muted">No invoices yet. Create a payment link to get started.</p>
        ) : (
          links.map((link: { id: string; title: string; slug: string; amount: number | null; collected: number }) => (
            <div key={link.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{link.title}</p>
                <p className="text-xs text-muted">{payLinkUrl(link.slug, origin)}</p>
                <Link href={payLinkPath(link.slug)} className="mt-1 inline-block text-sm font-bold text-brand">
                  Open checkout
                </Link>
              </div>
              <p className="font-mono text-sm">{link.amount ? formatXAF(link.amount) : "Open"}</p>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
