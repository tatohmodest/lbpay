import { slugify, uid } from "@/lib/format";
import { isOurCloudinaryUrl } from "@/lib/server/cloudinary";
import { DEFAULT_LINK_TEMPLATE, normalizeLinkTemplate, type LinkTemplateId } from "@/lib/link-templates";
import type { StoredLink } from "@/lib/server/db";

export type ParsedPaymentLink = {
  title: string;
  amount: number | null;
  imageUrl?: string;
  template: LinkTemplateId;
};

export function parsePaymentLinkInput(body: Record<string, unknown>):
  | { ok: true; value: ParsedPaymentLink }
  | { ok: false; error: string } {
  const title = String(body.title || "").trim();
  if (!title) return { ok: false, error: "Title is required." };

  const rawAmount = body.amount;
  let amount: number | null = null;
  if (rawAmount !== null && rawAmount !== undefined && rawAmount !== "") {
    amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      return { ok: false, error: "Amount has to be a number, or left empty." };
    }
    amount = Math.round(amount);
  }

  const imageUrl = String(body.imageUrl || "").trim();
  if (imageUrl && !isOurCloudinaryUrl(imageUrl)) {
    return { ok: false, error: "Upload the product photo from this page." };
  }

  return {
    ok: true,
    value: {
      title,
      amount,
      imageUrl: imageUrl || undefined,
      template: normalizeLinkTemplate(body.template) || DEFAULT_LINK_TEMPLATE,
    },
  };
}

export function buildPaymentLink(userId: string, input: ParsedPaymentLink): StoredLink {
  return {
    id: uid("lnk"),
    userId,
    slug: `${slugify(input.title) || "pay"}-${uid("s").slice(-4)}`,
    title: input.title,
    amount: input.amount,
    status: "active",
    collected: 0,
    payments: 0,
    createdAt: new Date().toISOString(),
    imageUrl: input.imageUrl,
    template: input.template,
  };
}
