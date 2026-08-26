import { NextResponse } from "next/server";
import { slugify, uid } from "@/lib/format";

export async function POST(request: Request) {
  const header = request.headers.get("authorization") || "";
  const key = header.replace("Bearer ", "").trim();
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_") && key !== "sk_test_demo") {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "Payment");
  const slug = slugify(title) || uid("pay");
  return NextResponse.json({
    id: uid("lnk"),
    object: "payment_link",
    title,
    amount: body.amount ?? null,
    currency: "XAF",
    url: `https://lbpay.me/pay/${slug}`,
    status: "active",
  });
}
