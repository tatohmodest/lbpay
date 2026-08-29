"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { PaymentLinkForm } from "@/components/payment-link-form";
import { PaymentLinkManageList } from "@/components/payment-link-manage";
import { useNotify } from "@/lib/notify";
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

  const links = data.data?.links || [];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-black">Payment links</h1>
      <p className="mt-1 text-sm text-muted">Create, edit, or delete a checkout anyone can open and pay.</p>
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
      {links.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-lg font-black">Your links</h2>
          <p className="mt-1 mb-3 text-sm text-muted">Change the title, amount, photo, or template. Delete a link to take it offline.</p>
          <PaymentLinkManageList
            links={links}
            merchantName={me.data?.user?.businessName || me.data?.user?.name}
            apiPath="/api/wallet/links"
            queryKeys={[["wallet-links"], ["business"]]}
            layout="rows"
          />
        </div>
      ) : null}
    </div>
  );
}
