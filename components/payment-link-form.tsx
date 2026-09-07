"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductPhotoField } from "@/components/product-photo-field";
import { ProductCard } from "@/components/product-card";
import { PRODUCT_DESCRIPTION_MAX } from "@/lib/shop";

export type PaymentLinkFormInput = {
  title: string;
  amount: string;
  compareAtAmount: string;
  description: string;
  imageUrl?: string;
  imagePublicId?: string;
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
    compareAtAmount?: number | null;
    description?: string;
    imageUrl?: string;
    imagePublicId?: string;
  };
  onSubmit: (input: PaymentLinkFormInput) => void | Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [compareAtAmount, setCompareAtAmount] = useState(
    initial?.compareAtAmount ? String(initial.compareAtAmount) : "",
  );
  const [description, setDescription] = useState(initial?.description || "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [imagePublicId, setImagePublicId] = useState(initial?.imagePublicId || "");
  const [error, setError] = useState("");
  const editing = Boolean(initial);

  const selling = amount ? Number(amount) : 0;
  const original = compareAtAmount ? Number(compareAtAmount) : 0;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        if (original > 0 && (!selling || original <= selling)) {
          setError("Original price has to be higher than the selling price.");
          return;
        }
        void Promise.resolve(
          onSubmit({
            title,
            amount,
            compareAtAmount,
            description,
            imageUrl: imageUrl || undefined,
            imagePublicId: imagePublicId || undefined,
          }),
        )
          .then(() => {
            if (editing) return;
            setTitle("");
            setAmount("");
            setCompareAtAmount("");
            setDescription("");
            setImageUrl("");
            setImagePublicId("");
          })
          .catch(() => undefined);
      }}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          <ProductPhotoField
            url={imageUrl}
            onUploaded={(url, publicId) => {
              setImageUrl(url);
              setImagePublicId(publicId || "");
            }}
          />
          <Field label="Product name">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Red palm oil, 1 litre"
              required
            />
          </Field>
          <Field label="Details" hint="What the customer should know before they pay.">
            <Textarea
              value={description}
              maxLength={PRODUCT_DESCRIPTION_MAX}
              placeholder="Fresh from the market this morning. 1 litre bottle, sealed."
              onChange={(event) => setDescription(event.target.value)}
            />
            <span className="mt-1 block text-right text-[11px] text-muted">
              {description.length}/{PRODUCT_DESCRIPTION_MAX}
            </span>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Selling price (XAF)">
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                className="font-mono"
                value={amount}
                placeholder="8500"
                onChange={(event) => setAmount(event.target.value)}
              />
            </Field>
            <Field label="Original price" hint="Optional. Shows as a strike-through.">
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                className="font-mono"
                value={compareAtAmount}
                placeholder="12000"
                onChange={(event) => setCompareAtAmount(event.target.value)}
              />
            </Field>
          </div>
          {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
        </div>
        <div className="min-w-0 lg:sticky lg:top-8">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Customer preview
          </p>
          <p className="mb-3 text-sm text-muted">This is the card on your shop page.</p>
          <ProductCard
            mode="preview"
            merchantName={merchantName}
            product={{
              slug: "preview",
              title: title.trim() || "Your product",
              amount: selling > 0 ? selling : null,
              compareAtAmount: original > 0 ? original : null,
              description: description.trim() || undefined,
              imageUrl: imageUrl || undefined,
            }}
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting
          ? editing
            ? "Saving…"
            : "Listing…"
          : submitLabel || (editing ? "Save product" : "List this product")}
      </Button>
    </form>
  );
}
