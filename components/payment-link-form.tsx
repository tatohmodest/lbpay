"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductPhotoField } from "@/components/product-photo-field";
import { ProductLinkFrame } from "@/components/product-link-frame";
import { DEFAULT_LINK_TEMPLATE, LINK_TEMPLATES, type LinkTemplateId } from "@/lib/link-templates";
import { cn } from "@/lib/cn";

export function PaymentLinkForm({
  merchantName,
  submitting,
  preview = true,
  onSubmit,
}: {
  merchantName?: string;
  submitting?: boolean;
  preview?: boolean;
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

  return (
    <form
      className={cn("grid gap-6", preview && "lg:grid-cols-[minmax(0,1fr)_280px]")}
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
          <p className="mb-2 text-xs font-medium text-muted">Template</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LINK_TEMPLATES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTemplate(item.id)}
                className={cn(
                  "rounded-2xl border p-1 text-left transition",
                  template === item.id ? "border-brand ring-2 ring-brand/20" : "border-line hover:border-brand/40",
                )}
              >
                <ProductLinkFrame
                  compact
                  template={item.id}
                  title={title || item.name}
                  amount={amount ? Number(amount) : null}
                  merchantName={merchantName}
                  imageUrl={imageUrl}
                />
                <span className="mt-1 block px-1 pb-1 text-xs font-semibold">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create link"}
        </Button>
      </div>
      {preview ? (
        <div className="hidden lg:block">
          <p className="mb-2 text-xs font-medium text-muted">Preview</p>
          <ProductLinkFrame
            template={template}
            title={title || "Your product"}
            amount={amount ? Number(amount) : null}
            merchantName={merchantName}
            imageUrl={imageUrl}
          />
        </div>
      ) : null}
    </form>
  );
}
