import { NextResponse } from "next/server";
import { collectPayment } from "@/lib/engine/payments";

function unauthorized() {
  return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
}

function getKey(request: Request) {
  const header = request.headers.get("authorization") || "";
  return header.replace("Bearer ", "").trim();
}

export async function POST(request: Request) {
  const key = getKey(request);
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_") && key !== "sk_test_demo") {
    return unauthorized();
  }

  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount);
  if (!amount || amount < 100) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const method =
    body.method === "orange"
      ? "orange"
      : body.method === "card"
        ? "card"
        : body.method === "wallet"
          ? "wallet"
          : "mtn";

  const payment = await collectPayment({
    amount,
    method,
    customer: body.customer ?? {},
    description: body.description,
  });

  return NextResponse.json({
    id: payment.id,
    object: "payment",
    amount,
    currency: "XAF",
    status: payment.status,
    rail: payment.rail,
    customer: body.customer ?? {},
  });
}
