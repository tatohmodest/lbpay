"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { MethodDot, StatusBadge } from "@/components/ui/badge";
import { PayQR } from "@/components/qr";
import { PaymentLinkForm } from "@/components/payment-link-form";
import { formatDate, formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";
import { useMe } from "@/lib/hooks/wallet";
import { payHandleUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";

export default function BusinessPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const me = useMe();
  const origin = useBrowserOrigin();
  const data = useQuery({
    queryKey: ["business"],
    queryFn: async () => {
      const res = await fetch("/api/business");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      return json as {
        businessName: string;
        revenue: number;
        links: Array<{ id: string; slug: string; title: string; amount: number | null }>;
        collections: Array<{
          id: string;
          createdAt: string;
          counterparty: string;
          method: "mtn" | "orange" | "card" | "wallet";
          amount: number;
          status: "success" | "failed" | "pending" | "cancelled" | "expired";
        }>;
      };
    },
  });
  const create = useMutation({
    mutationFn: (input: { title: string; amount: string; imageUrl?: string; template: string }) =>
      fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          amount: input.amount ? Number(input.amount) : null,
          imageUrl: input.imageUrl,
          template: input.template,
        }),
      }).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        return json;
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["business"] });
      notify.success("Link created", "Share the checkout URL.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  const links = data.data?.links || [];
  const collections = data.data?.collections || [];
  const handle = me.data?.user?.lbpayId || "";
  const payUrl = handle && origin ? payHandleUrl(handle, origin) : "";

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-black">Business overview</h1>
        <p className="text-muted">See how your shop is doing today.</p>
      </header>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Revenue (XAF)</p>
          <p className="mt-3 font-mono text-3xl font-bold">
            {formatXAF(data.data?.revenue || 0, { withCurrency: false })}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Active links</p>
          <p className="mt-3 font-mono text-3xl font-bold">{links.length}</p>
        </Card>
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wide">Generate payment link</h2>
          <PaymentLinkForm
            preview={false}
            merchantName={data.data?.businessName}
            submitting={create.isPending}
            onSubmit={(input) => create.mutateAsync(input)}
          />
        </Card>
        <Card className="flex flex-col items-center bg-navy p-6 text-white">
          <h2 className="text-2xl font-bold">Scan to pay</h2>
          <div className="mt-4">
            {payUrl ? (
              <PayQR value={payUrl} />
            ) : (
              <div className="h-[180px] w-[180px] rounded-2xl bg-white/10" />
            )}
          </div>
          <p className="mt-3 break-all font-mono text-xs text-white/70">{payUrl}</p>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-line p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide">Recent collections</h2>
        </div>
        {collections.length === 0 ? (
          <p className="p-6 text-sm text-muted">No collections yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {collections.map((tx) => (
                <tr key={tx.id}>
                  <td className="p-3 font-mono text-xs">{tx.id}</td>
                  <td className="p-3 text-muted">{formatDate(tx.createdAt)}</td>
                  <td className="p-3">{tx.counterparty}</td>
                  <td className="p-3">
                    <MethodDot method={tx.method} />
                  </td>
                  <td className="p-3 text-right font-mono font-bold">
                    {formatXAF(tx.amount, { withCurrency: false })}
                  </td>
                  <td className="p-3 text-center">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
