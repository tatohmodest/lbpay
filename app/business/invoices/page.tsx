"use client";

import { Card } from "@/components/ui/card";
import { formatXAF } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";

export default function BusinessInvoicesPage() {
  const data = useQuery({
    queryKey: ["business"],
    queryFn: async () => (await fetch("/api/business")).json(),
  });
  const links = data.data?.links || [];

  return (
    <div>
      <h1 className="text-2xl font-black">Invoices</h1>
      <p className="text-sm text-muted">Payment links you can send as invoices.</p>
      <Card className="mt-6 divide-y divide-line">
        {links.length === 0 ? (
          <p className="p-6 text-sm text-muted">No invoices yet. Create a payment link to get started.</p>
        ) : (
          links.map((link: { id: string; title: string; slug: string; amount: number | null; collected: number }) => (
            <div key={link.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{link.title}</p>
                <p className="text-xs text-muted">/pay/{link.slug}</p>
              </div>
              <p className="font-mono text-sm">{link.amount ? formatXAF(link.amount) : "Open"}</p>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
