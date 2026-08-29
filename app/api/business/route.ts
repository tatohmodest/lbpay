import { after, NextResponse } from "next/server";
import { addLink, deleteLink, listLinks, listTx, updateLink } from "@/lib/server/db";
import { deleteCloudinaryImage } from "@/lib/server/cloudinary";
import { requireKind } from "@/lib/server/guard";
import {
  buildPaymentLink,
  parsePaymentLinkInput,
  parsePaymentLinkPatch,
  paymentLinkIdFromRequest,
} from "@/lib/server/payment-links";

export async function GET() {
  const auth = await requireKind("business");
  if (auth.error || !auth.user) return auth.error!;
  const links = await listLinks(auth.user.id);
  const txs = (await listTx(auth.user.id)).filter((tx) => ["collection", "receive"].includes(tx.kind));
  const revenue = txs.filter((tx) => tx.status === "success").reduce((sum, tx) => sum + tx.amount, 0);
  return NextResponse.json({
    businessName: auth.user.businessName || auth.user.name,
    businessKind: auth.user.businessKind || null,
    links,
    collections: txs,
    revenue,
    kyc: auth.user.kyc.business,
  });
}

export async function POST(request: Request) {
  const auth = await requireKind("business");
  if (auth.error || !auth.user) return auth.error!;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parsePaymentLinkInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const link = await addLink(buildPaymentLink(auth.user.id, parsed.value));
  return NextResponse.json({ ok: true, link });
}

export async function PATCH(request: Request) {
  const auth = await requireKind("business");
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
  const auth = await requireKind("business");
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
