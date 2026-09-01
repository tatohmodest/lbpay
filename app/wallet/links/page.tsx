"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentLinkForm } from "@/components/payment-link-form";
import { PaymentLinkManageList } from "@/components/payment-link-manage";
import { BusinessPageHeader } from "@/components/business/page-header";
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
    mutationFn: (input: {
      title: string;
      amount: string;
      imageUrl?: string;
      imagePublicId?: string;
      template: string;
    }) =>
      fetch("/api/wallet/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          amount: input.amount ? Number(input.amount) : null,
          imageUrl: input.imageUrl,
          imagePublicId: input.imagePublicId,
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
      <BusinessPageHeader
        kicker="Checkout"
        title="Payment links"
        copy="Create a checkout anyone can open and pay."
      />
      <section className="rounded-[2rem] bg-white p-4 shadow-[0_1px_2px_rgba(12,25,19,0.04)] md:p-6">
        <h2 className="text-base font-black md:text-lg">New product link</h2>
        <p className="mt-1 text-sm text-muted">Add a photo and pick a wrap, then share.</p>
        <div className="mt-4">
          <PaymentLinkForm
            merchantName={me.data?.user?.businessName || me.data?.user?.name}
            submitting={create.isPending}
            onSubmit={(input) => create.mutateAsync(input)}
          />
        </div>
      </section>
      {links.length > 0 ? (
        <div className="mt-5">
          <h2 className="text-base font-black md:text-lg">Your links</h2>
          <p className="mt-1 mb-3 text-sm text-muted">Edit the title, amount, photo, or wrap.</p>
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
