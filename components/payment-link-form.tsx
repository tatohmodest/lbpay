"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductPhotoField } from "@/components/product-photo-field";
import { ProductLinkFrame } from "@/components/product-link-frame";
import { DEFAULT_LINK_TEMPLATE, LINK_TEMPLATES, type LinkTemplateId } from "@/lib/link-templates";
import { cn } from "@/lib/cn";

const SWATCH: Record<LinkTemplateId, { bar: string; label: string }> = {
  statement: { bar: "bg-navy text-white", label: "Payment statement" },
  invoice: { bar: "bg-brand text-white", label: "Invoice" },
  receipt: { bar: "border border-dashed border-line bg-[#fbfaf6] text-ink", label: "Till receipt" },
  voucher: { bar: "bg-brand-dark text-white", label: "Voucher" },
  display: { bar: "bg-[#07140f] text-white", label: "Display" },
};

export function PaymentLinkForm({
  merchantName,
  submitting,
  onSubmit,
}: {
  merchantName?: string;
  submitting?: boolean;
  onSubmit: (input: {
    title: string;
    amount: string;
    imageUrl?: string;
    template: LinkTemplateId;
  }) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [template, setTemplate] = useState<LinkTemplateId>(DEFAULT_LINK_TEMPLATE);

  const preview = (
    <ProductLinkFrame
      template={template}
      title={title || "Your product"}
      amount={amount ? Number(amount) : null}
      merchantName={merchantName}
      imageUrl={imageUrl}
    />
  );

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        void Promise.resolve(
          onSubmit({ title, amount, imageUrl: imageUrl || undefined, template }),
        )
          .then(() => {
            setTitle("");
            setAmount("");
            setImageUrl("");
            setTemplate(DEFAULT_LINK_TEMPLATE);
          })
          .catch(() => undefined);
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
        <div className="flex flex-col gap-4">
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
          <ProductPhotoField url={imageUrl} onUploaded={setImageUrl} />
          <div>
            <p className="mb-1 text-sm font-semibold text-ink">Finance template</p>
            <p className="mb-3 text-sm text-muted">
              Pick how this product looks on the payment page and when someone shares the link.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {LINK_TEMPLATES.map((item) => {
                const swatch = SWATCH[item.id];
                const selected = template === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTemplate(item.id)}
                    className={cn(
                      "rounded-2xl border p-2 text-left transition",
                      selected ? "border-brand ring-2 ring-brand/25" : "border-line hover:border-brand/40",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-11 items-center rounded-xl px-3 text-[11px] font-semibold uppercase tracking-[0.14em]",
                        swatch.bar,
                      )}
                    >
                      {swatch.label}
                    </div>
                    <span className="mt-2 block text-sm font-semibold">{item.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{item.blurb}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Preview</p>
          <p className="mb-3 text-sm text-muted">This is the wrap customers see.</p>
          {preview}
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Creating…" : "Create link"}
      </Button>
    </form>
  );
}
