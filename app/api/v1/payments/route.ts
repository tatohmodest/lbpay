import { NextResponse } from "next/server";
import { authenticateApiKey, logApi, railForEnv } from "@/lib/server/apikey";
import { listTx, recordLedgerMove, type StoredTx } from "@/lib/server/db";
import { payunitReference } from "@/lib/server/crypto";
import { assertAmount } from "@/lib/server/limits";
import { apiCollectionFee } from "@/lib/fees";
import { dispatchWebhooksForTx, formatApiPayment } from "@/lib/server/webhooks";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  const { user, env } = auth;

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") || 20);
  const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 20));
  const statusFilter = url.searchParams.get("status")?.trim();

  const rows = (await listTx(user.id))
    .filter(
      (tx) =>
        (tx.kind === "collection" || (tx.kind === "receive" && Boolean(tx.meta?.handle || tx.meta?.linkSlug))) &&
        (!statusFilter || tx.status === statusFilter),
    )
    .slice(0, limit)
    .map((tx) => formatApiPayment(tx, env));

  await logApi(user.id, "GET", "/v1/payments", 200);
  return NextResponse.json({
    object: "list",
    data: rows,
    environment: env,
  });
}

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
  const customerPhone = body.customer?.phone ? String(body.customer.phone) : undefined;
  const customerName = body.customer?.name ? String(body.customer.name) : undefined;
  const customerEmail = body.customer?.email ? String(body.customer.email) : undefined;

  if (env === "sandbox") {
    // Test money never touches the real wallet, but still fires sandbox webhooks so developers can test.
    const sbxId = `sbx_${reference}`;
    const sbxTx: StoredTx = {
      id: sbxId,
      userId: user.id,
      kind: "collection",
      amount: amount - fee,
      fee,
      status: result.status === "failed" ? "failed" : result.status,
      method,
      counterparty: customerPhone || customerName || "Sandbox customer",
      note: body.description || "API collection",
      createdAt: new Date().toISOString(),
      rail: "sandbox",
      railRef: reference,
      meta: {
        source: "api",
        grossAmount: amount,
        customerPhone,
        customerName,
        customerEmail,
      },
    };
    if (sbxTx.status !== "pending") {
      await dispatchWebhooksForTx(sbxTx, { env: "sandbox" }).catch((err) =>
        console.error("[lbpay] sandbox payment webhook failed", err),
      );
    }
    await logApi(user.id, "POST", "/v1/payments", 200);
    return NextResponse.json({
      ...formatApiPayment(sbxTx, "sandbox"),
      rail: result.provider,
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
    counterparty: customerPhone || customerName || "API customer",
    note: body.description || "API collection",
    status: result.status === "failed" ? "failed" : result.status,
    rail: result.provider,
    railRef: reference,
    meta: {
      source: "api",
      grossAmount: amount,
      customerPhone,
      customerName,
      customerEmail,
    },
  });

  await logApi(user.id, "POST", "/v1/payments", 200);
  return NextResponse.json({
    ...formatApiPayment(moved.tx, env),
    rail: result.provider,
    customer: body.customer ?? {},
  });
}
