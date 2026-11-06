import { NextResponse } from "next/server";
import { authenticateApiKey, logApi, railForEnv } from "@/lib/server/apikey";
import { recordLedgerMove } from "@/lib/server/db";
import { payunitReference } from "@/lib/server/crypto";
import { assertAmount } from "@/lib/server/limits";
import { apiCollectionFee } from "@/lib/fees";

export async function POST(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  const { user, env } = auth;

  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount);
  if (!amount) {
    await logApi(user.id, "POST", "/v1/payments", 400);
    return NextResponse.json({ error: "Enter an amount." }, { status: 400 });
  }
  if (body.method === "wallet") {
    // Nobody pays here: a wallet payment needs the payer's own sign-in and PIN,
    // which only the hosted checkout has. Marking it paid would create money.
    await logApi(user.id, "POST", "/v1/payments", 400);
    return NextResponse.json(
      { error: "Wallet payments go through a payment link or the hosted checkout, where the payer confirms with their PIN." },
      { status: 400 },
    );
  }
  const method = body.method === "orange" ? "orange" : body.method === "card" ? "card" : "mtn";
  try {
    await assertAmount(amount, "deposit");
  } catch (limitErr) {
    await logApi(user.id, "POST", "/v1/payments", 400);
    return NextResponse.json(
      { error: limitErr instanceof Error ? limitErr.message : "That amount is not allowed." },
      { status: 400 },
    );
  }
  const reference = payunitReference("PAY");
  const rail = railForEnv(env);
  const result = await rail.collect({
    amount,
    currency: "XAF",
    method,
    customer: body.customer ?? {},
    reference,
  });
  // Developers pay 2.5% on Mobile Money and card collections.
  const fee = apiCollectionFee(amount);
  if (env === "sandbox") {
    // Test money never touches the real wallet.
    await logApi(user.id, "POST", "/v1/payments", 200);
    return NextResponse.json({
      id: `sbx_${reference}`,
      object: "payment",
      amount,
      fee,
      net: amount - fee,
      currency: "XAF",
      status: result.status,
      rail: result.provider,
      environment: env,
      customer: body.customer ?? {},
    });
  }
  const moved = await recordLedgerMove({
    userId: user.id,
    amount: amount - fee,
    fee,
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
    fee,
    net: amount - fee,
    currency: "XAF",
    status: moved.tx.status,
    rail: result.provider,
    environment: env,
    customer: body.customer ?? {},
  });
}
