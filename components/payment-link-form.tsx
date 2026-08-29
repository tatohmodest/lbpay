"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductPhotoField } from "@/components/product-photo-field";
import { ProductLinkFrame } from "@/components/product-link-frame";
import { DEFAULT_LINK_TEMPLATE, LINK_TEMPLATES, type LinkTemplateId } from "@/lib/link-templates";
import { cn } from "@/lib/cn";

const BOX: Record<LinkTemplateId, { head: string; body: string }> = {
  statement: { head: "bg-navy text-white", body: "bg-white" },
  invoice: { head: "bg-brand text-white", body: "bg-white" },
  receipt: { head: "bg-[#fbfaf6] text-ink", body: "bg-[#fbfaf6]" },
  voucher: { head: "bg-brand-dark text-white", body: "bg-brand" },
  display: { head: "bg-[#07140f] text-white", body: "bg-navy" },
};

export function PaymentLinkForm({
  merchantName,
  submitting,
  submitLabel,
  initial,
  onSubmit,
}: {
  merchantName?: string;
  submitting?: boolean;
  submitLabel?: string;
  initial?: {
    title?: string;
    amount?: number | null;
    imageUrl?: string;
    imagePublicId?: string;
    template?: string;
  };
  onSubmit: (input: {
    title: string;
    amount: string;
    imageUrl?: string;
    imagePublicId?: string;
    template: LinkTemplateId;
  }) => void | Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [imagePublicId, setImagePublicId] = useState(initial?.imagePublicId || "");
  const [template, setTemplate] = useState<LinkTemplateId>(
    (initial?.template as LinkTemplateId) || DEFAULT_LINK_TEMPLATE,
  );
  const editing = Boolean(initial);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        void Promise.resolve(
          onSubmit({
            title,
            amount,
            imageUrl: imageUrl || undefined,
            imagePublicId: imagePublicId || undefined,
            template,
          }),
        )
          .then(() => {
            if (editing) return;
            setTitle("");
            setAmount("");
            setImageUrl("");
            setImagePublicId("");
            setTemplate(DEFAULT_LINK_TEMPLATE);
          })
          .catch(() => undefined);
      }}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <Field label="Product / service title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Amount (XAF)">
            <Input
              type="number"
              className="font-mono"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <ProductPhotoField
            url={imageUrl}
            onUploaded={(url, publicId) => {
              setImageUrl(url);
              setImagePublicId(publicId || "");
            }}
          />
          <div className="min-w-0">
            <p className="mb-1 text-sm font-semibold text-ink">Finance template</p>
            <p className="mb-3 text-sm text-muted">Pick a wrap. Slide the row if you need more.</p>
            <div className="relative -mx-5 md:mx-0">
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:thin] overscroll-x-contain md:px-0">
                {LINK_TEMPLATES.map((item) => {
                  const box = BOX[item.id];
                  const selected = template === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTemplate(item.id)}
                      className={cn(
                        "w-[8.5rem] shrink-0 snap-start overflow-hidden rounded-2xl border text-left shadow-[0_8px_24px_rgba(7,20,15,0.06)] transition",
                        selected ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-brand/40",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 items-center px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                          box.head,
                        )}
                      >
                        {item.name}
                      </div>
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="" className="h-20 w-full object-cover" />
                      ) : (
                        <div className={cn("grid h-20 place-items-center", box.body)}>
                          <span
                            className={cn(
                              "text-[11px] font-semibold",
                              item.id === "voucher" || item.id === "display" ? "text-white/80" : "text-brand-deep",
                            )}
                          >
                            LBPay
                          </span>
                        </div>
                      )}
                      <span className="block bg-white px-2.5 py-2">
                        <span className="block text-xs font-semibold text-ink">{item.name}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted">{item.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent sm:hidden" />
            </div>
          </div>
        </div>
        <div className="min-w-0 lg:sticky lg:top-8">
          <p className="mb-1 text-sm font-semibold text-ink">Preview</p>
          <p className="mb-3 text-sm text-muted">This is the wrap customers see.</p>
          <ProductLinkFrame
            size="hero"
            template={template}
            title={title || "Your product"}
            amount={amount ? Number(amount) : null}
            merchantName={merchantName}
            imageUrl={imageUrl}
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (editing ? "Saving…" : "Creating…") : submitLabel || (editing ? "Save changes" : "Create link")}
      </Button>
    </form>
  );
}
