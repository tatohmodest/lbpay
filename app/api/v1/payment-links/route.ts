import { NextResponse } from "next/server";
import { slugify, uid } from "@/lib/format";
import { addLink } from "@/lib/server/db";
import { authenticateApiKey, logApi } from "@/lib/server/apikey";

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  if (!auth.user.roles.includes("business") && !auth.user.roles.includes("admin")) {
    await logApi(auth.user.id, "POST", "/v1/payment-links", 403);
    return NextResponse.json({ error: "Business role required." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "Payment");
  const slug = `${slugify(title) || "pay"}-${uid("s").slice(-4)}`;
  const link = await addLink({
    id: uid("lnk"),
    userId: auth.user.id,
    slug,
    title,
    amount: body.amount ? Number(body.amount) : null,
    status: "active",
    collected: 0,
    payments: 0,
    createdAt: new Date().toISOString(),
  });
  await logApi(auth.user.id, "POST", "/v1/payment-links", 200);
  return NextResponse.json({
    id: link.id,
    object: "payment_link",
    title: link.title,
    amount: link.amount,
    currency: "XAF",
    url: `/pay/${link.slug}`,
    status: "active",
    environment: auth.env,
  });
}
