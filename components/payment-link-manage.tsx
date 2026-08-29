"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentLinkForm } from "@/components/payment-link-form";
import { ProductLinkFrame } from "@/components/product-link-frame";
import { formatXAF } from "@/lib/format";
import { useNotify } from "@/lib/notify";
import { copyText } from "@/lib/clipboard";
import { payLinkPath, payLinkUrl } from "@/lib/origin";
import { useBrowserOrigin } from "@/lib/use-origin";
import { linkTemplateMeta } from "@/lib/link-templates";

export type ManagedPaymentLink = {
  id: string;
  slug: string;
  title: string;
  amount: number | null;
  imageUrl?: string;
  template?: string;
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

  async function saveEdit(input: {
    title: string;
    amount: string;
    imageUrl?: string;
    imagePublicId?: string;
    template: string;
  }) {
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
            imageUrl: input.imageUrl,
            imagePublicId: input.imagePublicId,
            template: input.template,
          }),
        }),
      );
      notify.success("Updated", "Payment link saved.");
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
    if (!confirm(`Delete “${link.title}”? Customers will no longer be able to pay this link.`)) return;
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
      notify.success("Deleted", "Payment link and photo removed.");
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
        const template = linkTemplateMeta(link.template);
        const isEditing = editing?.id === link.id;
        return (
          <Card key={link.id} className={layout === "cards" ? "overflow-hidden p-3" : "p-4"}>
            {isEditing ? (
              <div>
                <p className="text-sm font-semibold">Edit payment link</p>
                <p className="mt-1 text-xs text-muted">The checkout URL stays the same.</p>
                <div className="mt-4">
                  <PaymentLinkForm
                    key={link.id}
                    merchantName={merchantName}
                    submitting={saving}
                    initial={{
                      title: link.title,
                      amount: link.amount,
                      imageUrl: link.imageUrl,
                      template: link.template,
                    }}
                    onSubmit={saveEdit}
                  />
                </div>
                <Button type="button" variant="ghost" className="mt-2" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            ) : layout === "rows" ? (
              <div className="flex items-center gap-4">
                <div className="w-28 shrink-0">
                  <ProductLinkFrame
                    compact
                    template={link.template}
                    title={link.title}
                    amount={link.amount}
                    merchantName={merchantName}
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
                  <LinkActions
                    url={url}
                    slug={link.slug}
                    busy={deletingId === link.id}
                    onCopy={() =>
                      copyText(url)
                        .then(() => notify.success("Copied", "Share this link."))
                        .catch((err: Error) => notify.error("Could not copy", err.message))
                    }
                    onEdit={() => setEditing(link)}
                    onDelete={() => void remove(link)}
                  />
                </div>
              </div>
            ) : (
              <>
                <ProductLinkFrame
                  template={link.template}
                  title={link.title}
                  amount={link.amount}
                  merchantName={merchantName}
                  imageUrl={link.imageUrl}
                />
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">{template.name}</p>
                <p className="mt-1 truncate font-mono text-xs text-muted">{url}</p>
                <LinkActions
                  url={url}
                  slug={link.slug}
                  busy={deletingId === link.id}
                  onCopy={() =>
                    copyText(url)
                      .then(() => notify.success("Copied", "Share this link."))
                      .catch((err: Error) => notify.error("Could not copy", err.message))
                  }
                  onEdit={() => setEditing(link)}
                  onDelete={() => void remove(link)}
                />
              </>
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
  url: string;
  slug: string;
  busy?: boolean;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      <button type="button" className="text-sm font-bold text-brand" onClick={onCopy}>
        Copy link
      </button>
      <Link href={payLinkPath(slug)} className="text-sm font-bold text-brand">
        Open checkout
      </Link>
      <button type="button" className="text-sm font-bold text-brand" onClick={onEdit} disabled={busy}>
        Edit
      </button>
      <button type="button" className="text-sm font-bold text-rose-600" onClick={onDelete} disabled={busy}>
        {busy ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
