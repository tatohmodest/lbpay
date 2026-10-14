"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentLinkForm } from "@/components/payment-link-form";
import { PaymentLinkManageList } from "@/components/payment-link-manage";
import { ShareRow } from "@/components/share-row";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { Button } from "@/components/ui/button";
import { ACTION_ART } from "@/lib/assets";
import { AppImg } from "@/components/app-img";
import { Copy, ExternalLink, Plus } from "lucide-react";
import { copyText } from "@/lib/clipboard";
import { formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";
import { useMe } from "@/lib/hooks/wallet";
import { shopHandlePath } from "@/lib/origin";
import { shopShareText, shopUrl } from "@/lib/shop";
import { shopSlotState, SHOP_LIMITS } from "@/lib/shop-limits";
import { useBrowserOrigin } from "@/lib/use-origin";
import { mediaSrc } from "@/lib/media";

type LinkRow = {
  id: string;
  title: string;
  slug: string;
  amount: number | null;
  compareAtAmount?: number | null;
  description?: string;
  imageUrl?: string;
};

type Quota = ReturnType<typeof shopSlotState>;

export default function WalletLinksPage() {
  const notify = useNotify();
  const client = useQueryClient();
  const me = useMe();
  const [pinOpen, setPinOpen] = useState(false);
  const [adding, setAdding] = useState(false);
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
      compareAtAmount: string;
      description: string;
      imageUrl?: string;
      imagePublicId?: string;
    }) =>
      fetch("/api/wallet/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          amount: input.amount ? Number(input.amount) : null,
          compareAtAmount: input.compareAtAmount ? Number(input.compareAtAmount) : null,
          description: input.description,
          imageUrl: input.imageUrl,
          imagePublicId: input.imagePublicId,
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
      <section className="relative overflow-hidden rounded-[2rem] bg-forest p-5 text-white sm:p-8">
        <div className="lb-glow pointer-events-none absolute inset-0" />
        <div className="lb-grid-bg pointer-events-none absolute inset-0" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <AppImg
                src={mediaSrc(me.data?.user?.avatar)}
                alt=""
                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/20"
              />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-hero-muted">Your shop</p>
                <h1 className="truncate text-[1.75rem] font-black leading-tight tracking-tight">{shopName}</h1>
              </div>
            </div>
            {handle ? <p className="mt-3 truncate font-mono text-[12px] text-hero-muted">{listingUrl}</p> : null}
            <div className="mt-4 max-w-sm">
              <div className="flex justify-between text-[12px] font-semibold text-hero-muted">
                <span>
                  {quota.used} of {quota.limit} products
                </span>
                <span>{quota.remaining} free slots</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${Math.min(100, Math.round((quota.used / Math.max(1, quota.limit)) * 100))}%` }}
                />
              </div>
            </div>
          </div>
          {handle ? (
            <div className="grid w-full grid-cols-2 gap-2 lg:w-80">
              <a
                href={shopHandlePath(handle)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-white text-[14px] font-bold text-forest transition hover:bg-white/90"
              >
                <ExternalLink className="h-4 w-4" /> View shop
              </a>
              <button
                type="button"
                onClick={() =>
                  void copyText(listingUrl).then(() => notify.success("Shop link copied", "Paste it in WhatsApp or Instagram."))
                }
                className="inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-white/10 text-[14px] font-bold text-white ring-1 ring-white/20 transition hover:bg-white/15"
              >
                <Copy className="h-4 w-4" /> Copy link
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {handle ? (
        <ShareRow url={listingUrl} text={shopShareText(shopName, listingUrl)} copyLabel="Share my shop" className="sm:hidden" />
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
      ) : links.length > 0 && !adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center gap-4 rounded-[1.75rem] border-2 border-dashed border-line bg-white p-5 text-left transition hover:border-brand/50"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-white">
            <Plus className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-[16px] font-bold text-ink">Add a product</span>
            <span className="block text-[13px] text-muted">A photo and a price. It goes live on your shop instantly.</span>
          </span>
        </button>
      ) : (
        <section className="rounded-[1.75rem] bg-white p-4 ring-1 ring-line/80 md:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-black md:text-lg">New product</h2>
              <p className="mt-1 text-sm text-muted">
                Photo, details, selling price, optional original price. {quota.remaining} slots left.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <PaymentLinkForm
              merchantName={shopName}
              submitting={create.isPending}
              onSubmit={(input) => create.mutateAsync(input).then((r) => (setAdding(false), r))}
            />
          </div>
        </section>
      )}

      {links.length > 0 ? (
        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-ink">Your products</h2>
              <p className="mt-0.5 text-[13px] text-muted">Exactly what customers see. Tap Copy to share one product.</p>
            </div>
          </div>
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
