import { NextResponse } from "next/server";
import { addLink, listLinks, listTx } from "@/lib/server/db";
import { requireKind } from "@/lib/server/guard";
import { buildPaymentLink, parsePaymentLinkInput } from "@/lib/server/payment-links";

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
