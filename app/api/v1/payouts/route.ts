import { NextResponse } from "next/server";
import { sendPayout } from "@/lib/engine/payments";

export async function POST(request: Request) {
  const header = request.headers.get("authorization") || "";
  const key = header.replace("Bearer ", "").trim();
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_") && key !== "sk_test_demo") {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount);
  const phone = String(body.phone || "");
  const network = body.network === "orange" ? "orange" : "mtn";

  if (!amount || !phone) {
    return NextResponse.json({ error: "amount and phone are required" }, { status: 400 });
  }

  const payout = await sendPayout({ amount, phone, network });
  return NextResponse.json({
    id: payout.id,
    object: "payout",
    amount,
    phone,
    network,
    status: payout.status,
    rail: payout.rail,
  });
}
