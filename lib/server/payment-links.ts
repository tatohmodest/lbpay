import { slugify, uid } from "@/lib/format";
import { cloudinaryPublicId, isOurCloudinaryUrl } from "@/lib/server/cloudinary";
import { isSafeProductImageUrl } from "@/lib/product-image";
import { DEFAULT_LINK_TEMPLATE, normalizeLinkTemplate, type LinkTemplateId } from "@/lib/link-templates";
import type { StoredLink } from "@/lib/server/db";

export type ParsedPaymentLink = {
  title: string;
  amount: number | null;
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
  if (imageUrl && !isSafeProductImageUrl(imageUrl) && !isOurCloudinaryUrl(imageUrl)) {
    return { ok: false, error: "Upload the product photo from this page." };
  }

  return {
    ok: true,
    value: {
      title,
      amount,
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
    const rawAmount = body.amount;
    if (rawAmount === null || rawAmount === "") {
      value.amount = null;
    } else {
      const amount = Number(rawAmount);
      if (!Number.isFinite(amount) || amount < 0) {
        return { ok: false, error: "Amount has to be a number, or left empty." };
      }
      value.amount = Math.round(amount);
    }
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
    status: "active",
    collected: 0,
    payments: 0,
    createdAt: new Date().toISOString(),
    imageUrl: input.imageUrl,
    imagePublicId: input.imagePublicId || cloudinaryPublicId(input.imageUrl) || undefined,
    template: input.template,
  };
}
