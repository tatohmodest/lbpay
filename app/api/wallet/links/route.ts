import { after, NextResponse } from "next/server";
import { addLink, listLinks, shopQuotaFor, updateLink, deleteLink } from "@/lib/server/db";
import { deleteCloudinaryImage } from "@/lib/server/cloudinary";
import { requireActiveUser } from "@/lib/server/guard";
import {
  buildPaymentLink,
  parsePaymentLinkInput,
  parsePaymentLinkPatch,
  paymentLinkIdFromRequest,
} from "@/lib/server/payment-links";
import { isShopSlotLimitError } from "@/lib/shop-limits";

export async function GET() {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const [links, quota] = await Promise.all([listLinks(auth.user.id), shopQuotaFor(auth.user.id)]);
  return NextResponse.json({ links, quota });
}

export async function POST(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parsePaymentLinkInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const link = await addLink(buildPaymentLink(auth.user.id, parsed.value));
    const quota = await shopQuotaFor(auth.user.id);
    return NextResponse.json({ ok: true, link, quota });
  } catch (err: unknown) {
    if (isShopSlotLimitError(err)) {
      const quota = await shopQuotaFor(auth.user.id);
      return NextResponse.json({ error: err.message, code: "SHOP_SLOT_LIMIT", quota }, { status: 403 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || body.slug || "").trim();
  if (!id) return NextResponse.json({ error: "Missing id or slug" }, { status: 400 });
  const parsed = parsePaymentLinkPatch(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const updated = await updateLink(auth.user.id, id, parsed.value);
    return NextResponse.json({ ok: true, link: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const id = await paymentLinkIdFromRequest(request);
  if (!id) return NextResponse.json({ error: "Missing id or slug" }, { status: 400 });
  try {
    const result = await deleteLink(auth.user.id, id);
    if (result.imageRef) {
      after(async () => {
        await deleteCloudinaryImage(result.imageRef);
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}
