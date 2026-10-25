import { NextResponse } from "next/server";
import { findTxById, getWallet, patchTx, recordLedgerMove, settleRailTx } from "@/lib/server/db";
import { formatXAF } from "@/lib/format";
import { payunitReference } from "@/lib/server/crypto";
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

    const rail = getPaymentRail();
    const reference = payunitReference("DISB");
    const kind = note.toLowerCase().includes("payout") ? "payout" : "withdraw";
    const label = fee
      ? `Disbursement to ${network.toUpperCase()} · ${fee} XAF fee`
      : `Disbursement to ${network.toUpperCase()}`;

    // Reserve the money first, under the ledger lock. Two withdrawals at once can
    // no longer both be paid out; the second simply finds the balance already used.
    let reserved;
    try {
      reserved = await recordLedgerMove({
        userId: user.id,
        amount,
        fee,
        direction: "debit",
        kind,
        method: network,
        counterparty: phone,
        note: label,
        status: "pending",
        rail: "payunit",
        railRef: reference,
        meta: { payoutRef: reference },
      });
    } catch (reserveError) {
      const message = reserveError instanceof Error ? reserveError.message : "";
      if (/insufficient wallet balance/i.test(message)) {
        return NextResponse.json(
          { error: "Your balance changed a moment ago. Refresh and try again." },
          { status: 409 },
        );
      }
      throw reserveError;
    }

    let result;
    try {
      result = await rail.disburse({
        amount,
        currency: "XAF",
        network,
        phone,
        reference,
        beneficiaryName: user.name,
        note,
      });
    } catch (railError) {
      // We can't tell whether the network sent it. Keep it pending: the status check
      // and the gateway callback settle it (and refund it if it failed).
      console.error("[lbpay] disburse threw after reserving", reference, railError);
      return NextResponse.json({
        ok: true,
        rail: "payunit",
        status: "pending",
        balance: reserved.balance,
        fee,
        debitAmount: amount + fee,
        transactionId: reference,
        transaction: reserved.tx,
      });
    }

    if (result.status === "failed") {
      // Gateway refused: give the money straight back.
      await settleRailTx(reference, "failed");
      return NextResponse.json(
        { error: result.message || "Your transaction could not be completed. No money has been deducted. Please try again." },
        { status: 502 },
      );
    }

    const railRef = result.reference || reference;
    await patchTx(reserved.tx.id, {
      rail: result.provider,
      railRef,
      meta: { ...reserved.tx.meta, payoutRef: reference, ...(result.providerRef ? { payToken: result.providerRef } : {}) },
    });
    const settled = result.status === "success" ? await settleRailTx(railRef, "success") : null;
    const tx = await findTxById(reserved.tx.id);
    return NextResponse.json({
      ok: true,
      rail: result.provider,
      status: result.status,
      balance: settled && "balance" in settled ? settled.balance : reserved.balance,
      fee,
      debitAmount: amount + fee,
      transactionId: railRef,
      transaction: tx ?? reserved.tx,
    });
  } catch (error) {
    return NextResponse.json({ error: publicPaymentError(error) }, { status: 500 });
  }
}
