"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentLinkForm, type PaymentLinkFormInput } from "@/components/payment-link-form";
import { ProductCard } from "@/components/product-card";
import { useNotify } from "@/lib/notify";
import { copyText } from "@/lib/clipboard";
import { payLinkPath, payLinkUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";

export type ManagedPaymentLink = {
  id: string;
  slug: string;
  title: string;
  amount: number | null;
  compareAtAmount?: number | null;
  description?: string;
  imageUrl?: string;
};

async function readJson(res: Response) {
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export function PaymentLinkManageList({
  links,
  merchantName,
  apiPath,
  queryKeys,
  layout = "cards",
}: {
  links: ManagedPaymentLink[];
  merchantName?: string;
  apiPath: "/api/business" | "/api/wallet/links";
  queryKeys: string[][];
  layout?: "cards" | "rows";
}) {
  const notify = useNotify();
  const client = useQueryClient();
  const origin = useBrowserOrigin();
  const [editing, setEditing] = useState<ManagedPaymentLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function refresh() {
    queryKeys.forEach((queryKey) => client.invalidateQueries({ queryKey }));
  }

  async function saveEdit(input: PaymentLinkFormInput) {
    if (!editing) return;
    setSaving(true);
    try {
      await readJson(
        await fetch(apiPath, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editing.id,
            title: input.title,
            amount: input.amount ? Number(input.amount) : null,
            compareAtAmount: input.compareAtAmount ? Number(input.compareAtAmount) : null,
            description: input.description,
            imageUrl: input.imageUrl,
            imagePublicId: input.imagePublicId,
          }),
        }),
      );
      notify.success("Updated", "Product saved.");
      setEditing(null);
      refresh();
    } catch (err) {
      notify.error("Could not update", err instanceof Error ? err.message : "Failed");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function remove(link: ManagedPaymentLink) {
    if (!confirm(`Delete “${link.title}”? Customers will no longer see this product.`)) return;
    setDeletingId(link.id);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    try {
      await readJson(
        await fetch(`${apiPath}?id=${encodeURIComponent(link.id)}`, {
          method: "DELETE",
          signal: controller.signal,
        }),
      );
      if (editing?.id === link.id) setEditing(null);
      notify.success("Deleted", "Product and photo removed.");
      refresh();
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === "AbortError";
      notify.error(
        "Could not delete",
        timedOut ? "The request timed out. Refresh and try again." : err instanceof Error ? err.message : "Failed",
      );
    } finally {
      window.clearTimeout(timer);
      setDeletingId(null);
    }
  }

  if (links.length === 0) return null;

  return (
    <div className={layout === "cards" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
      {links.map((link) => {
        const url = payLinkUrl(link.slug, origin);
        const isEditing = editing?.id === link.id;
        return (
          <Card
            key={link.id}
            className={
              isEditing || layout === "rows"
                ? "rounded-[1.75rem] p-4"
                : "overflow-hidden rounded-[1.75rem] border-0 bg-transparent p-0 shadow-none"
            }
          >
            {isEditing ? (
              <div>
                <p className="text-sm font-semibold">Edit product</p>
                <p className="mt-1 text-xs text-muted">The product URL stays the same.</p>
                <div className="mt-4">
                  <PaymentLinkForm
                    key={link.id}
                    merchantName={merchantName}
                    submitting={saving}
                    initial={{
                      title: link.title,
                      amount: link.amount,
                      compareAtAmount: link.compareAtAmount,
                      description: link.description,
                      imageUrl: link.imageUrl,
                    }}
                    onSubmit={saveEdit}
                  />
                </div>
                <Button type="button" variant="ghost" className="mt-2" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            ) : layout === "rows" ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="h-44 w-full shrink-0 overflow-hidden rounded-2xl bg-paper sm:h-28 sm:w-36">
                  {link.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={link.imageUrl} alt={link.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center px-3 text-center">
                      <p className="text-sm font-black text-brand-deep">{link.title}</p>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{link.title}</p>
                  <p className="truncate font-mono text-xs text-muted">{url}</p>
                </div>
                <div className="sm:ml-auto sm:text-right">
                  <LinkActions
                    slug={link.slug}
                    busy={deletingId === link.id}
                    onCopy={() =>
                      copyText(url)
                        .then(() => notify.success("Copied", "Share this product page."))
                        .catch((err: Error) => notify.error("Could not copy", err.message))
                    }
                    onEdit={() => setEditing(link)}
                    onDelete={() => void remove(link)}
                  />
                </div>
              </div>
            ) : (
              <ProductCard
                mode="hero"
                merchantName={merchantName}
                product={{
                  slug: link.slug,
                  title: link.title,
                  amount: link.amount,
                  compareAtAmount: link.compareAtAmount,
                  description: link.description,
                  imageUrl: link.imageUrl,
                }}
                actions={
                  <LinkActions
                    slug={link.slug}
                    busy={deletingId === link.id}
                    onCopy={() =>
                      copyText(url)
                        .then(() => notify.success("Copied", "Share this product page."))
                        .catch((err: Error) => notify.error("Could not copy", err.message))
                    }
                    onEdit={() => setEditing(link)}
                    onDelete={() => void remove(link)}
                  />
                }
              />
            )}
          </Card>
        );
      })}
    </div>
  );
}

function LinkActions({
  slug,
  busy,
  onCopy,
  onEdit,
  onDelete,
}: {
  slug: string;
  busy?: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      <Link
        href={payLinkPath(slug)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-[0_10px_24px_rgba(0,179,105,0.28)] hover:bg-brand-dark"
      >
        View as customer
      </Link>
      <button
        type="button"
        className="inline-flex h-11 w-full items-center justify-center rounded-full border border-line bg-white text-sm font-bold text-ink hover:border-brand/30 hover:bg-paper"
        onClick={onCopy}
      >
        Copy product link
      </button>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-1">
        <button type="button" className="text-sm font-bold text-brand" onClick={onEdit} disabled={busy}>
          Edit
        </button>
        <button type="button" className="text-sm font-bold text-rose-600" onClick={onDelete} disabled={busy}>
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
