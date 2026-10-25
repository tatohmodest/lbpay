import { payoutsPausedResponse } from "@/lib/server/payout-gate";
import { NextResponse } from "next/server";
import { authenticateApiKey, logApi, railForEnv } from "@/lib/server/apikey";
import { getWallet } from "@/lib/server/db";
import { runPayout } from "@/lib/server/payout-flow";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { momoOutFee } from "@/lib/fees";
import { assertAmount, assertDailyOutbound } from "@/lib/server/limits";

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
