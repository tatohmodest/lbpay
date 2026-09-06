"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentLinkForm } from "@/components/payment-link-form";
import { PaymentLinkManageList } from "@/components/payment-link-manage";
import { BusinessPageHeader } from "@/components/business/page-header";
import { ShareRow } from "@/components/share-row";
import { useNotify } from "@/lib/notify";
import { useMe } from "@/lib/hooks/wallet";
import { shopShareText, shopUrl } from "@/lib/shop";
import { useBrowserOrigin } from "@/lib/use-origin";

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
  const origin = useBrowserOrigin();
  const handle = me.data?.user?.lbpayId || "";
  const shopName = me.data?.user?.businessName || me.data?.user?.name || "Your shop";
  const listingUrl = handle ? shopUrl(handle, origin) : "";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <BusinessPageHeader
        kicker="Products"
        title="Product listing"
        copy="Create a product, share the whole shop, or send just one link. Customers pay you directly."
      />
      {handle ? (
        <section className="rounded-[1.75rem] bg-white p-5 ring-1 ring-line/80 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Share the shop</p>
          <h2 className="mt-1 text-lg font-black">Your product page</h2>
          <p className="mt-1 text-sm text-muted">
            Send this page so customers can browse every product. Or copy a single product link below.
          </p>
          <p className="mt-2 truncate font-mono text-xs font-semibold text-ink">{listingUrl}</p>
          <div className="mt-4">
            <ShareRow url={listingUrl} text={shopShareText(shopName, listingUrl)} copyLabel="Copy shop link" />
          </div>
        </section>
      ) : null}
      <section className="rounded-[1.75rem] bg-white p-4 ring-1 ring-line/80 md:p-6">
        <h2 className="text-base font-black md:text-lg">New product</h2>
        <p className="mt-1 text-sm text-muted">Add a photo and a price, then share.</p>
        <div className="mt-4">
          <PaymentLinkForm
            merchantName={shopName}
            submitting={create.isPending}
            onSubmit={(input) => create.mutateAsync(input)}
          />
        </div>
      </section>
      {links.length > 0 ? (
        <div>
          <h2 className="text-base font-black md:text-lg">Your products</h2>
          <p className="mt-1 mb-3 text-sm text-muted">Share one product, or send the whole listing.</p>
          <PaymentLinkManageList
            links={links}
            merchantName={shopName}
            apiPath="/api/wallet/links"
            queryKeys={[["wallet-links"], ["business"]]}
            layout="cards"
          />
        </div>
      ) : null}
    </div>
  );
}
