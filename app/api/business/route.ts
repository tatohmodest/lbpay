import { NextResponse } from "next/server";
import { addLink, listLinks, listTx } from "@/lib/server/db";
import { requireKind } from "@/lib/server/guard";
import { slugify, uid } from "@/lib/format";

export async function GET() {
  const auth = await requireKind("business");
  if (auth.error || !auth.user) return auth.error!;
  const links = await listLinks(auth.user.id);
  const txs = (await listTx(auth.user.id)).filter((tx) => ["collection", "receive"].includes(tx.kind));
  const revenue = txs.filter((tx) => tx.status === "success").reduce((sum, tx) => sum + tx.amount, 0);
  return NextResponse.json({
    businessName: auth.user.businessName || auth.user.name,
    links,
    collections: txs,
    revenue,
    kyc: auth.user.kyc.business,
  });
}

export async function POST(request: Request) {
  const auth = await requireKind("business");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  const amount = body.amount ? Number(body.amount) : null;
  const link = await addLink({
    id: uid("lnk"),
    userId: auth.user.id,
    slug: `${slugify(title) || "pay"}-${uid("s").slice(-4)}`,
    title,
    amount,
    status: "active",
    collected: 0,
    payments: 0,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, link });
}
