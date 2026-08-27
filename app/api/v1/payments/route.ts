import { NextResponse } from "next/server";
import { authenticateApiKey, logApi, railForEnv } from "@/lib/server/apikey";
import { recordLedgerMove } from "@/lib/server/db";
import { payunitReference } from "@/lib/server/crypto";

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  const { user, env } = auth;

  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount);
  if (!amount || amount < 100) {
    await logApi(user.id, "POST", "/v1/payments", 400);
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

  const reference = payunitReference("PAY");
  const rail = railForEnv(env);
  const result =
    method === "wallet"
      ? { status: "success" as const, provider: "internal" as const, reference }
      : await rail.collect({
          amount,
          currency: "XAF",
          method,
          customer: body.customer ?? {},
          reference,
        });

  const moved = await recordLedgerMove({
    userId: user.id,
    amount,
    direction: "credit",
    kind: "collection",
    method,
    counterparty: body.customer?.phone || body.customer?.name || "API customer",
    note: body.description || "API collection",
    status: result.status === "failed" ? "failed" : result.status,
    rail: result.provider,
    railRef: reference,
  });

  await logApi(user.id, "POST", "/v1/payments", 200);
  return NextResponse.json({
    id: moved.tx.id,
    object: "payment",
    amount,
    currency: "XAF",
    status: moved.tx.status,
    rail: result.provider,
    environment: env,
    customer: body.customer ?? {},
  });
}
