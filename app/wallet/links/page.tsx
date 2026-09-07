"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentLinkForm } from "@/components/payment-link-form";
import { PaymentLinkManageList } from "@/components/payment-link-manage";
import { ShareRow } from "@/components/share-row";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { Button } from "@/components/ui/button";
import { ACTION_ART, ONBOARD_ART } from "@/lib/assets";
import { formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";
import { useMe } from "@/lib/hooks/wallet";
import { shopShareText, shopUrl } from "@/lib/shop";
import { shopSlotState, SHOP_LIMITS } from "@/lib/shop-limits";
import { useBrowserOrigin } from "@/lib/use-origin";

type LinkRow = {
  id: string;
  title: string;
  slug: string;
  amount: number | null;
  imageUrl?: string;
  template?: string;
};

type Quota = ReturnType<typeof shopSlotState>;

export default function WalletLinksPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const me = useMe();
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinLockedUntil, setPinLockedUntil] = useState(0);
  const data = useQuery({
    queryKey: ["wallet-links"],
    queryFn: async () =>
      (await fetch("/api/wallet/links")).json() as Promise<{ links: LinkRow[]; quota?: Quota }>,
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
      notify.success("Product listed", "Share the shop or this one product.");
    },
    onError: (err: Error) => notify.error("Failed", err.message),
  });
  const buySlots = useMutation({
    mutationFn: async (pin: string) => {
      const res = await fetch("/api/wallet/links/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (!res.ok) {
        const error = new Error(json.error || "Could not add slots") as Error & { retryAfter?: number };
        error.retryAfter = Number(json.retryAfter) || undefined;
        throw error;
      }
      return json as { quota: Quota; balance: number };
    },
    onSuccess: (result) => {
      setPinOpen(false);
      client.invalidateQueries({ queryKey: ["wallet-links"] });
      client.invalidateQueries({ queryKey: ["me"] });
      notify.success("Slots added", `You now have ${result.quota.limit} product slots.`);
    },
    onError: (err: Error & { retryAfter?: number }) => {
      setPinError(err.message);
      if (err.retryAfter) setPinLockedUntil(Date.now() + err.retryAfter * 1000);
    },
  });

  const links = data.data?.links || [];
  const quota = data.data?.quota || shopSlotState(links.length, 0);
  const origin = useBrowserOrigin();
  const handle = me.data?.user?.lbpayId || "";
  const shopName = me.data?.user?.businessName || me.data?.user?.name || "Your shop";
  const listingUrl = handle ? shopUrl(handle, origin) : "";
  const atLimit = quota.atLimit;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="relative overflow-hidden rounded-[1.85rem] bg-forest px-5 py-6 text-white sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Your shop</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">List it. Share it. Get paid.</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-hero-muted sm:text-base">
            Customers open your shop, pick a product, and pay with MTN, Orange, or wallet. Share the whole
            page or one product.
          </p>
          <p className="mt-4 text-xs font-semibold text-white/70">
            {quota.used} of {quota.limit} products
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ONBOARD_ART.business}
          alt=""
          className="pointer-events-none absolute -bottom-6 -right-4 h-40 w-40 object-contain sm:h-52 sm:w-52"
        />
      </section>

      {handle ? (
        <section className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line/80">
          <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ACTION_ART.products} alt="" className="h-12 w-12 object-contain" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Share the shop</p>
                  <h2 className="text-lg font-black">{shopName}</h2>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted">
                One page for every product. Customers browse, then pay you directly.
              </p>
              <p className="mt-2 truncate font-mono text-xs font-semibold text-ink">{listingUrl}</p>
            </div>
            <div className="w-full sm:w-72">
              <ShareRow url={listingUrl} text={shopShareText(shopName, listingUrl)} copyLabel="Copy shop link" />
            </div>
          </div>
        </section>
      ) : null}

      {atLimit ? (
        <section className="rounded-[1.75rem] bg-gold-soft p-5 ring-1 ring-gold/40 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a5a00]">Shop is full</p>
          <h2 className="mt-1 text-xl font-black text-ink">You have used all {quota.limit} product slots</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink/80">
            Add {SHOP_LIMITS.packSize} more slots for {formatXAF(SHOP_LIMITS.packPrice)}. Paid from your LBPay
            wallet.
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              setPinError("");
              setPinOpen(true);
            }}
          >
            Add {SHOP_LIMITS.packSize} slots · {formatXAF(SHOP_LIMITS.packPrice)}
          </Button>
        </section>
      ) : (
        <section className="rounded-[1.75rem] bg-white p-4 ring-1 ring-line/80 md:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-black md:text-lg">New product</h2>
              <p className="mt-1 text-sm text-muted">Photo, price, then share. {quota.remaining} slots left.</p>
            </div>
          </div>
          <div className="mt-4">
            <PaymentLinkForm
              merchantName={shopName}
              submitting={create.isPending}
              onSubmit={(input) => create.mutateAsync(input)}
            />
          </div>
        </section>
      )}

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
      ) : (
        <section className="rounded-[1.75rem] bg-white px-6 py-10 text-center ring-1 ring-line/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ACTION_ART.products} alt="" className="mx-auto h-16 w-16 object-contain" />
          <h2 className="mt-3 text-lg font-black">No products yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Add your first product above. It appears on your shop page instantly.
          </p>
        </section>
      )}

      <ConfirmSheet
        open={pinOpen}
        title="Add product slots"
        subtitle={`${SHOP_LIMITS.packSize} extra slots`}
        amount={SHOP_LIMITS.packPrice}
        details={[
          { label: "You get", value: `${SHOP_LIMITS.packSize} more products` },
          { label: "Charge", value: formatXAF(SHOP_LIMITS.packPrice) },
        ]}
        loading={buySlots.isPending}
        error={pinError}
        lockedUntil={pinLockedUntil}
        confirmLabel="Enter PIN to pay"
        onClose={() => setPinOpen(false)}
        onConfirm={(pin) => void buySlots.mutateAsync(pin).catch(() => undefined)}
      />
    </div>
  );
}
