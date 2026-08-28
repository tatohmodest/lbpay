"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PaymentLinkForm } from "@/components/payment-link-form";
import { formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";
import { copyText } from "@/lib/clipboard";
import { payLinkPath, payLinkUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";
import { useMe } from "@/lib/hooks/wallet";

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
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-black">Payment links</h1>
      <p className="mt-1 text-sm text-muted">A checkout anyone can open and pay.</p>
      <Card className="mt-6 p-6">
        <PaymentLinkForm
          merchantName={me.data?.user?.businessName || me.data?.user?.name}
          submitting={create.isPending}
          onSubmit={(input) => create.mutateAsync(input)}
        />
      </Card>
      <div className="mt-4 space-y-3">
        {(data.data?.links || []).map((link) => {
          const url = payLinkUrl(link.slug, origin);
          return (
            <Card key={link.id} className="flex items-center gap-4 p-4">
              {link.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={link.imageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-xs font-semibold text-brand-deep">
                  LBPay
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{link.title}</p>
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
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
