import { slugify, uid } from "@/lib/format";
import { cloudinaryPublicId, isOurCloudinaryUrl } from "@/lib/server/cloudinary";
import { isSafeProductImageUrl } from "@/lib/product-image";
import { DEFAULT_LINK_TEMPLATE, normalizeLinkTemplate, type LinkTemplateId } from "@/lib/link-templates";
import { PRODUCT_DESCRIPTION_MAX } from "@/lib/shop";
import type { StoredLink } from "@/lib/server/db";

export { PRODUCT_DESCRIPTION_MAX };

export type ParsedPaymentLink = {
  title: string;
  amount: number | null;
  compareAtAmount?: number | null;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  template: LinkTemplateId;
};

export async function paymentLinkIdFromRequest(request: Request): Promise<string> {
  const url = new URL(request.url);
  const fromQuery = String(url.searchParams.get("id") || url.searchParams.get("slug") || "").trim();
  if (fromQuery) return fromQuery;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return String(body.id || body.slug || "").trim();
}

function parsedImagePublicId(body: Record<string, unknown>, imageUrl?: string) {
  const fromBody = String(body.imagePublicId || "").trim();
  return fromBody || cloudinaryPublicId(imageUrl) || undefined;
}

function parsedDescription(raw: unknown) {
  const text = String(raw ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, PRODUCT_DESCRIPTION_MAX);
  return text || undefined;
}

function parsedAmount(raw: unknown): { ok: true; value: number | null } | { ok: false; error: string } {
  if (raw === null || raw === undefined || raw === "") return { ok: true, value: null };
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "Amount has to be a number, or left empty." };
  }
  return { ok: true, value: Math.round(amount) };
}

function parsedCompareAt(
  raw: unknown,
  amount: number | null,
  requiredDiscount: boolean,
): { ok: true; value?: number | null } | { ok: false; error: string } {
  if (raw === undefined) return { ok: true };
  if (raw === null || raw === "") return { ok: true, value: null };
  const value = Math.round(Number(raw));
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: "Original price has to be a number." };
  }
  if (value === 0) return { ok: true, value: null };
  if (requiredDiscount) {
    if (!amount || amount <= 0) {
      return { ok: false, error: "Set the selling price before an original price." };
    }
    if (value <= amount) {
      return { ok: false, error: "Original price has to be higher than the selling price." };
    }
  }
  return { ok: true, value };
}

export function parsePaymentLinkInput(body: Record<string, unknown>):
  | { ok: true; value: ParsedPaymentLink }
  | { ok: false; error: string } {
  const title = String(body.title || "").trim();
  if (!title) return { ok: false, error: "Title is required." };

  const amount = parsedAmount(body.amount);
  if (!amount.ok) return amount;

  const compareAt = parsedCompareAt(body.compareAtAmount, amount.value, true);
  if (!compareAt.ok) return compareAt;

  const imageUrl = String(body.imageUrl || "").trim();
  if (imageUrl && !isSafeProductImageUrl(imageUrl) && !isOurCloudinaryUrl(imageUrl)) {
    return { ok: false, error: "Upload the product photo from this page." };
  }

  return {
    ok: true,
    value: {
      title,
      amount: amount.value,
      compareAtAmount: compareAt.value ?? null,
      description: parsedDescription(body.description),
      imageUrl: imageUrl || undefined,
      imagePublicId: parsedImagePublicId(body, imageUrl || undefined),
      template: normalizeLinkTemplate(body.template) || DEFAULT_LINK_TEMPLATE,
    },
  };
}

export function parsePaymentLinkPatch(body: Record<string, unknown>):
  | { ok: true; value: Partial<ParsedPaymentLink> }
  | { ok: false; error: string } {
  const value: Partial<ParsedPaymentLink> = {};

  if (body.title !== undefined) {
    const title = String(body.title || "").trim();
    if (!title) return { ok: false, error: "Title is required." };
    value.title = title;
  }

  if (body.amount !== undefined) {
    const amount = parsedAmount(body.amount);
    if (!amount.ok) return amount;
    value.amount = amount.value;
  }

  if (body.compareAtAmount !== undefined) {
    const amountForDiscount = value.amount !== undefined ? value.amount : null;
    const compareAt = parsedCompareAt(body.compareAtAmount, amountForDiscount, amountForDiscount != null);
    if (!compareAt.ok) return compareAt;
    value.compareAtAmount = compareAt.value ?? null;
  }

  if (body.description !== undefined) {
    value.description = parsedDescription(body.description);
  }

  if (body.imageUrl !== undefined) {
    const imageUrl = String(body.imageUrl || "").trim();
    if (imageUrl && !isSafeProductImageUrl(imageUrl) && !isOurCloudinaryUrl(imageUrl)) {
      return { ok: false, error: "Upload the product photo from this page." };
    }
    value.imageUrl = imageUrl || undefined;
    value.imagePublicId = parsedImagePublicId(body, imageUrl || undefined);
  } else if (body.imagePublicId !== undefined) {
    value.imagePublicId = parsedImagePublicId(body, value.imageUrl);
  }

  if (body.template !== undefined) {
    value.template = normalizeLinkTemplate(body.template) || DEFAULT_LINK_TEMPLATE;
  }

  if (
    value.title === undefined &&
    value.amount === undefined &&
    value.compareAtAmount === undefined &&
    value.description === undefined &&
    value.imageUrl === undefined &&
    value.imagePublicId === undefined &&
    value.template === undefined
  ) {
    return { ok: false, error: "Nothing to update." };
  }

  return { ok: true, value };
}

export function buildPaymentLink(userId: string, input: ParsedPaymentLink): StoredLink {
  return {
    id: uid("lnk"),
    userId,
    slug: `${slugify(input.title) || "pay"}-${uid("s").slice(-4)}`,
    title: input.title,
    amount: input.amount,
    compareAtAmount: input.compareAtAmount ?? null,
    description: input.description,
    status: "active",
    collected: 0,
    payments: 0,
    createdAt: new Date().toISOString(),
    imageUrl: input.imageUrl,
    imagePublicId: input.imagePublicId || cloudinaryPublicId(input.imageUrl) || undefined,
    template: input.template,
  };
}
