import { NextResponse } from "next/server";
import { recordLedgerMove } from "@/lib/server/db";
import { payunitReference, verifySecret } from "@/lib/server/crypto";
import { getPaymentRail } from "@/lib/providers";
import { requireActiveUser } from "@/lib/server/guard";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { depositFee } from "@/lib/fees";
import { assertAmount } from "@/lib/server/limits";
import { publicPaymentError } from "@/lib/public-error";

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const user = auth.user;
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const method = body.method === "orange" ? "orange" : body.method === "card" ? "card" : "mtn";
    const phone = cameroonMsisdn(body.phone || user.phone);
    const pin = String(body.pin || "");
    const fee = depositFee(amount);

    if (!amount) {
      return NextResponse.json({ error: "Enter an amount." }, { status: 400 });
    }
    try {
      await assertAmount(amount, "deposit");
    } catch (limitErr) {
      return NextResponse.json(
        { error: limitErr instanceof Error ? limitErr.message : "That amount is not allowed." },
        { status: 400 },
      );
    }
    if (method !== "card" && !isCameroonMsisdn(phone)) {
      return NextResponse.json({ error: "Enter the Mobile Money number that will pay." }, { status: 400 });
    }

    if (!user.pinHash) return NextResponse.json({ error: "PIN required." }, { status: 400 });
    if (!(await verifySecret(pin, user.pinHash))) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }

    const rail = getPaymentRail();
    const reference = payunitReference(method === "orange" ? "OM" : method === "card" ? "CD" : "MT");
    const result = await rail.collect({
      amount: amount + fee,
      currency: "XAF",
      method,
      customer: { phone: phone || user.phone, name: user.name, email: user.email },
      reference,
    });

    if (result.status === "failed") {
      return NextResponse.json(
        { error: result.message || "Your transaction could not be completed. No money has been deducted. Please try again." },
        { status: 502 },
      );
    }

    const moved = await recordLedgerMove({
      userId: user.id,
      amount,
      fee,
      direction: "credit",
      kind: "deposit",
      method,
      counterparty: method === "mtn" ? "MTN Mobile Money" : method === "orange" ? "Orange Money" : "Card",
      note: fee ? `Wallet deposit · ${fee} XAF fee` : "Wallet deposit",
      status: result.status === "success" ? "success" : "pending",
      rail: result.provider,
      railRef: result.reference,
    });

    return NextResponse.json({
      ok: true,
      rail: result.provider,
      status: result.status,
      hostedUrl: result.hostedUrl,
      transactionId: result.reference,
      balance: moved.balance,
      fee,
      payAmount: amount + fee,
      transaction: moved.tx,
    });
  } catch (error) {
    return NextResponse.json({ error: publicPaymentError(error) }, { status: 500 });
  }
}
