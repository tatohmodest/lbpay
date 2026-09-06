import { NextResponse } from "next/server";
import { getWallet, recordLedgerMove } from "@/lib/server/db";
import { payunitReference } from "@/lib/server/crypto";
import { requireActiveUser } from "@/lib/server/guard";
import { assertDailyOutbound } from "@/lib/server/limits";
import { pinFailResponse, verifyUserPin } from "@/lib/server/pin";
import { COUNTRIES, findCountry, findRail, internationalIssue, quote, recipientIssue } from "@/lib/countries";
import { FEATURES, INTERNATIONAL_OPENS } from "@/lib/flags";
import { publicPaymentError } from "@/lib/public-error";

/**
 * Cross-border payouts. Money leaves the wallet immediately and the transfer sits
 * in "pending" until the payout partner confirms delivery (or ops settles it from
 * the console). A failed delivery is reversed back into the wallet.
 * Set INTERNATIONAL_MODE=sandbox to simulate instant outcomes (amount ending 13 fails, 77 stays pending).
 */
export async function GET() {
  return NextResponse.json({
    countries: COUNTRIES.map((c) => ({ ...c, rate: quote(c, 1).rate })),
  });
}

export async function POST(request: Request) {
  if (!FEATURES.international) {
    return NextResponse.json(
      { error: `Transfers abroad open ${INTERNATIONAL_OPENS}. Nothing has been charged.` },
      { status: 503 },
    );
  }
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const user = auth.user;
    const body = await request.json().catch(() => ({}));
    const amount = Math.round(Number(body.amount) || 0);
    const country = findCountry(String(body.country || ""));
    if (!country || country.code === "CM") {
      return NextResponse.json({ error: "Pick a destination country." }, { status: 400 });
    }
    const rail = findRail(country, String(body.rail || ""));
    if (!rail) return NextResponse.json({ error: "Pick how the recipient gets paid." }, { status: 400 });
    const recipient = String(body.recipient || "").trim();
    const recipientName = String(body.recipientName || "").trim();
    const note = String(body.note || "").trim().slice(0, 120);
    const pin = String(body.pin || "");

    if (!amount) return NextResponse.json({ error: "Enter an amount." }, { status: 400 });
    const amountProblem = internationalIssue(amount);
    if (amountProblem) return NextResponse.json({ error: amountProblem }, { status: 400 });
    if (recipientName.length < 2) return NextResponse.json({ error: "Enter the recipient's full name." }, { status: 400 });
    const recipientProblem = recipientIssue(country, rail, recipient);
    if (recipientProblem) return NextResponse.json({ error: recipientProblem }, { status: 400 });
    try {
      await assertDailyOutbound(user, amount);
    } catch (limitErr) {
      return NextResponse.json({ error: limitErr instanceof Error ? limitErr.message : "That amount is not allowed." }, { status: 400 });
    }

    const pinCheck = await verifyUserPin(user, pin);
    if (!pinCheck.ok) return pinFailResponse(pinCheck);

    const q = quote(country, amount);
    const wallet = await getWallet(user.id);
    if (wallet.balance < q.total) {
      return NextResponse.json({ error: "Insufficient wallet balance. Deposit funds or enter a lower amount." }, { status: 400 });
    }

    const reference = payunitReference("INTL");
    let status: "pending" | "success" = "pending";
    if (process.env.INTERNATIONAL_MODE === "sandbox") {
      if (amount % 100 === 13) {
        return NextResponse.json({ error: "Sandbox: the partner rejected this payout. No money has been deducted." }, { status: 502 });
      }
      status = amount % 100 === 77 ? "pending" : "success";
    }

    const moved = await recordLedgerMove({
      userId: user.id,
      amount,
      fee: q.fee,
      direction: "debit",
      kind: "international",
      method: "wallet",
      counterparty: `${recipientName} · ${country.flag} ${country.name}`,
      note: note || `Transfer to ${country.name} via ${rail.label}`,
      status,
      rail: "partner",
      railRef: reference,
      meta: {
        to: recipient,
        stage: status === "success" ? "done" : "paying",
        country: country.code,
        currency: q.currency,
        fxRate: q.rate,
        receiveAmount: q.receiveAmount,
        recipientName,
        corridor: rail.label,
      },
    });

    return NextResponse.json({
      ok: true,
      status,
      balance: moved.balance,
      fee: q.fee,
      debitAmount: q.total,
      receiveAmount: q.receiveAmount,
      currency: q.currency,
      rate: q.rate,
      transactionId: reference,
      transaction: moved.tx,
    });
  } catch (error) {
    return NextResponse.json({ error: publicPaymentError(error) }, { status: 500 });
  }
}
