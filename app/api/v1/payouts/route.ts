import { payoutsPausedResponse } from "@/lib/server/payout-gate";
import { NextResponse } from "next/server";
import { authenticateApiKey, logApi, railForEnv } from "@/lib/server/apikey";
import { getWallet, listTx, type StoredTx } from "@/lib/server/db";
import { payunitReference } from "@/lib/server/crypto";
import { runPayout } from "@/lib/server/payout-flow";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { momoOutFee } from "@/lib/fees";
import { assertAmount, assertDailyOutbound } from "@/lib/server/limits";
import { dispatchWebhooksForTx, formatApiPayout } from "@/lib/server/webhooks";

export async function GET(request: Request) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.error;
  const { user, env } = auth;

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") || 20);
  const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 20));

  const rows = (await listTx(user.id))
    .filter((tx) => tx.kind === "payout")
    .slice(0, limit)
    .map((tx) => formatApiPayout(tx, env));

  await logApi(user.id, "GET", "/v1/payouts", 200);
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
  if (env === "live") {
    const paused = await payoutsPausedResponse();
    if (paused) return paused;
  }
  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount);
  const phone = cameroonMsisdn(body.phone);
  const network = body.network === "orange" ? "orange" : "mtn";
  const fee = momoOutFee(amount);
  if (!amount || !isCameroonMsisdn(phone)) {
    await logApi(user.id, "POST", "/v1/payouts", 400);
    return NextResponse.json({ error: "amount and a valid Cameroon phone are required" }, { status: 400 });
  }
  try {
    await assertAmount(amount, "withdraw");
    await assertDailyOutbound(user, amount);
  } catch (limitErr) {
    await logApi(user.id, "POST", "/v1/payouts", 400);
    return NextResponse.json(
      { error: limitErr instanceof Error ? limitErr.message : "That amount is not allowed." },
      { status: 400 },
    );
  }
  if (env === "sandbox") {
    // Test payouts are simulated and never take real money from the wallet.
    const reference = payunitReference("PO");
    const result = await railForEnv(env).disburse({
      amount,
      currency: "XAF",
      network,
      phone,
      reference,
      beneficiaryName: user.name,
      note: "API disbursement",
    });
    const sbxId = `sbx_${reference}`;
    const sbxTx: StoredTx = {
      id: sbxId,
      userId: user.id,
      kind: "payout",
      amount,
      fee,
      status: result.status === "failed" ? "failed" : result.status,
      method: network,
      counterparty: phone,
      note: "API disbursement",
      createdAt: new Date().toISOString(),
      rail: "sandbox",
      railRef: reference,
      meta: { to: phone, toNetwork: network },
    };
    if (sbxTx.status !== "pending") {
      await dispatchWebhooksForTx(sbxTx, { env: "sandbox" }).catch((err) =>
        console.error("[lbpay] sandbox payout webhook failed", err),
      );
    }
    await logApi(user.id, "POST", "/v1/payouts", 200);
    return NextResponse.json({
      id: sbxId,
      object: "payout",
      amount,
      fee,
      phone,
      network,
      status: result.status,
      rail: result.provider,
      environment: env,
    });
  }
  const wallet = await getWallet(user.id);
  if (wallet.balance < amount + fee) {
    await logApi(user.id, "POST", "/v1/payouts", 400);
    return NextResponse.json({ error: "Insufficient wallet balance. Deposit funds or enter a lower amount." }, { status: 400 });
  }
  if (env === "live" && user.kyc.developer !== "verified") {
    return NextResponse.json({ error: "Live payouts need approved developer KYC." }, { status: 403 });
  }

  const done = await runPayout({
    rail: railForEnv(env),
    userId: user.id,
    beneficiaryName: user.name,
    amount,
    fee,
    network,
    phone,
    kind: "payout",
    note: "API disbursement",
    label: fee ? `API disbursement · ${fee} XAF fee` : "API disbursement",
    prefix: "PO",
  });
  if (done.outcome === "insufficient") {
    await logApi(user.id, "POST", "/v1/payouts", 409);
    return NextResponse.json({ error: "Balance changed during the request. Retry." }, { status: 409 });
  }
  if (done.outcome === "failed") {
    await logApi(user.id, "POST", "/v1/payouts", 502);
    return NextResponse.json({ error: done.message || "Your transaction could not be completed. No money has been deducted. Please try again." }, { status: 502 });
  }
  const moved = { tx: done.tx };
  const result = { provider: done.provider };
  await logApi(user.id, "POST", "/v1/payouts", 200);
  return NextResponse.json({
    id: moved.tx.id,
    object: "payout",
    amount,
    fee,
    phone,
    network,
    status: moved.tx.status,
    rail: result.provider,
    environment: env,
  });
}
