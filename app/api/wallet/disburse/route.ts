import { payoutsPausedResponse } from "@/lib/server/payout-gate";
import { NextResponse } from "next/server";
import { getWallet } from "@/lib/server/db";
import { runPayout } from "@/lib/server/payout-flow";
import { formatXAF } from "@/lib/format";
import { getPaymentRail } from "@/lib/providers";
import { requireActiveUser } from "@/lib/server/guard";
import { cameroonMsisdn, detectMobileNetwork, isCameroonMsisdn } from "@/lib/phone";
import { maxWithdrawable, momoOutFee } from "@/lib/fees";
import { assertAmount, assertDailyOutbound } from "@/lib/server/limits";
import { publicPaymentError } from "@/lib/public-error";
import { pinFailResponse, verifyUserPin } from "@/lib/server/pin";

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const paused = await payoutsPausedResponse();
    if (paused) return paused;

    const user = auth.user;
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const phone = cameroonMsisdn(body.phone);
    const network =
      body.network === "orange" || body.network === "mtn"
        ? body.network
        : detectMobileNetwork(phone) === "orange"
          ? "orange"
          : "mtn";
    const pin = String(body.pin || "");
    const note = String(body.note || "Wallet withdrawal");
    const fee = momoOutFee(amount);

    if (!amount) {
      return NextResponse.json({ error: "Enter an amount." }, { status: 400 });
    }
    try {
      await assertAmount(amount, "withdraw");
      await assertDailyOutbound(user, amount);
    } catch (limitErr) {
      return NextResponse.json(
        { error: limitErr instanceof Error ? limitErr.message : "That amount is not allowed." },
        { status: 400 },
      );
    }
    if (!isCameroonMsisdn(phone)) {
      return NextResponse.json({ error: "Enter a valid Cameroon mobile number." }, { status: 400 });
    }

    const pinCheck = await verifyUserPin(user, pin);
    if (!pinCheck.ok) return pinFailResponse(pinCheck);

    const wallet = await getWallet(user.id);
    if (wallet.balance < amount + fee) {
      return NextResponse.json(
        {
          error: `You have ${formatXAF(wallet.balance)}. Withdrawing ${formatXAF(amount)} costs ${formatXAF(amount + fee)} with the ${formatXAF(fee)} fee. Try ${formatXAF(maxWithdrawable(wallet.balance))} or less.`,
        },
        { status: 400 },
      );
    }

    const done = await runPayout({
      rail: getPaymentRail(),
      userId: user.id,
      beneficiaryName: user.name,
      amount,
      fee,
      network,
      phone,
      kind: note.toLowerCase().includes("payout") ? "payout" : "withdraw",
      note,
      label: fee ? `Disbursement to ${network.toUpperCase()} · ${fee} XAF fee` : `Disbursement to ${network.toUpperCase()}`,
      prefix: "DISB",
    });
    if (done.outcome === "insufficient") {
      return NextResponse.json({ error: "Your balance changed a moment ago. Refresh and try again." }, { status: 409 });
    }
    if (done.outcome === "failed") {
      return NextResponse.json(
        { error: done.message || "Your transaction could not be completed. No money has been deducted. Please try again." },
        { status: 502 },
      );
    }
    return NextResponse.json({
      ok: true,
      rail: done.provider,
      status: done.status,
      balance: done.balance,
      fee,
      debitAmount: amount + fee,
      transactionId: done.transactionId,
      transaction: done.tx,
    });
  } catch (error) {
    return NextResponse.json({ error: publicPaymentError(error) }, { status: 500 });
  }
}
