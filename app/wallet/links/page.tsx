"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PaymentLinkForm } from "@/components/payment-link-form";
import { ProductLinkFrame } from "@/components/product-link-frame";
import { formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";
import { copyText } from "@/lib/clipboard";
import { payLinkPath, payLinkUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";
import { useMe } from "@/lib/hooks/wallet";
import { linkTemplateMeta } from "@/lib/link-templates";

type LinkRow = {
  id: string;
  title: string;
  slug: string;
  amount: number | null;
  imageUrl?: string;
  template?: string;
};

export default function WalletLinksPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const me = useMe();
  const origin = useBrowserOrigin();
  const data = useQuery({
    queryKey: ["wallet-links"],
    queryFn: async () => (await fetch("/api/wallet/links")).json() as Promise<{ links: LinkRow[] }>,
  });
  const create = useMutation({
    mutationFn: (input: { title: string; amount: string; imageUrl?: string; template: string }) =>
      fetch("/api/wallet/links", {
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
      client.invalidateQueries({ queryKey: ["wallet-links"] });
      client.invalidateQueries({ queryKey: ["business"] });
      notify.success("Link created", "Share the checkout page.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-black">Payment links</h1>
      <p className="mt-1 text-sm text-muted">A checkout anyone can open and pay.</p>
      <Card className="mt-6 p-6">
        <h2 className="text-lg font-black">New product link</h2>
        <p className="mt-1 text-sm text-muted">
          Add a photo and pick a finance template before you share the checkout.
        </p>
        <div className="mt-5">
          <PaymentLinkForm
            merchantName={me.data?.user?.businessName || me.data?.user?.name}
            submitting={create.isPending}
            onSubmit={(input) => create.mutateAsync(input)}
          />
        </div>
      </Card>
      <div className="mt-4 space-y-3">
        {(data.data?.links || []).map((link) => {
          const url = payLinkUrl(link.slug, origin);
          const template = linkTemplateMeta(link.template);
          return (
            <Card key={link.id} className="flex items-center gap-4 p-4">
              <div className="w-28 shrink-0">
                <ProductLinkFrame
                  compact
                  template={link.template}
                  title={link.title}
                  amount={link.amount}
                  merchantName={me.data?.user?.businessName || me.data?.user?.name}
                  imageUrl={link.imageUrl}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{link.title}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{template.name}</p>
                <p className="truncate font-mono text-xs text-muted">{url}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">{link.amount ? formatXAF(link.amount) : "Open"}</p>
                <div className="mt-1 flex flex-col items-end gap-1">
                  <button
                    type="button"
                    className="text-sm font-bold text-brand"
                    onClick={() =>
                      copyText(url)
                        .then(() => notify.success("Copied", "Share this link."))
                        .catch((err: Error) => notify.error("Could not copy", err.message))
                    }
                  >
                    Copy link
                  </button>
                  <Link href={payLinkPath(link.slug)} className="text-sm font-bold text-brand">
                    Open checkout
                  </Link>
                  <button
                    type="button"
                    className="text-sm text-rose-600"
                    onClick={async () => {
                      if (!confirm('Delete this payment link?')) return;
                      try {
                        const res = await fetch('/api/wallet/links', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: link.id }),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error || 'Failed to delete');
                        client.invalidateQueries({ queryKey: ['wallet-links'] });
                        notify.success('Deleted', 'Payment link removed.');
                      } catch (err: unknown) {
                        notify.error('Could not delete', err instanceof Error ? err.message : 'Failed');
                      }
                    }}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="text-sm text-brand"
                    onClick={async () => {
                      const newTitle = prompt('New title', link.title) || link.title;
                      const newAmountStr = prompt('New amount (leave empty for open)', link.amount ? String(link.amount) : '') ?? '';
                      const newAmount = newAmountStr.trim() === '' ? null : Number(newAmountStr);
                      try {
                        const res = await fetch('/api/wallet/links', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: link.id, title: newTitle, amount: newAmount }),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error || 'Failed to update');
                        client.invalidateQueries({ queryKey: ['wallet-links'] });
                        notify.success('Updated', 'Payment link updated.');
                      } catch (err: unknown) {
                        notify.error('Could not update', err instanceof Error ? err.message : 'Failed');
                      }
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
