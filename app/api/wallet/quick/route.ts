import { NextResponse } from "next/server";
import { recordLedgerMove } from "@/lib/server/db";
import { payunitReference, verifySecret } from "@/lib/server/crypto";
import { getPaymentRail } from "@/lib/providers";
import { requireActiveUser } from "@/lib/server/guard";
import { cameroonMsisdn, isCameroonMsisdn } from "@/lib/phone";
import { directTransferFee } from "@/lib/fees";
import { assertAmount, assertDailyOutbound } from "@/lib/server/limits";
import { publicPaymentError } from "@/lib/public-error";
import { progressQuickTransfer } from "@/lib/server/quick";

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const user = auth.user;
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const from = cameroonMsisdn(body.from || user.phone);
    const to = cameroonMsisdn(body.to);
    const pin = String(body.pin || "");
    const fromNetwork = body.fromNetwork === "orange" ? "orange" : body.fromNetwork === "mtn" ? "mtn" : null;
    const toNetwork = body.toNetwork === "orange" ? "orange" : body.toNetwork === "mtn" ? "mtn" : null;
    const fee = directTransferFee(amount);

    if (!amount) {
      return NextResponse.json({ error: "Enter an amount." }, { status: 400 });
    }
    try {
      await assertAmount(amount, "momo");
      await assertDailyOutbound(user, amount);
    } catch (limitErr) {
      return NextResponse.json(
        { error: limitErr instanceof Error ? limitErr.message : "That amount is not allowed." },
        { status: 400 },
      );
    }
    if (!fromNetwork || !toNetwork) {
      return NextResponse.json({ error: "Choose MTN or Orange for both numbers." }, { status: 400 });
    }
    if (!isCameroonMsisdn(from)) {
      return NextResponse.json({ error: "Enter a valid number to pay from." }, { status: 400 });
    }
    if (!isCameroonMsisdn(to)) {
      return NextResponse.json({ error: "Enter a valid number to send to." }, { status: 400 });
    }
    if (from === to) {
      return NextResponse.json({ error: "Use two different numbers." }, { status: 400 });
    }
    if (!user.pinHash) return NextResponse.json({ error: "PIN required." }, { status: 400 });
    if (!(await verifySecret(pin, user.pinHash))) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }

    const rail = getPaymentRail();
    const reference = payunitReference("QT");
    const collect = await rail.collect({
      amount: amount + fee,
      currency: "XAF",
      method: fromNetwork,
      customer: { phone: from, name: user.name, email: user.email },
      reference,
    });

    if (collect.status === "failed") {
      return NextResponse.json(
        {
          error:
            collect.message ||
            "Your transaction could not be completed. No money has been deducted. Please try again.",
        },
        { status: 502 },
      );
    }

    await recordLedgerMove({
      userId: user.id,
      amount,
      fee,
      direction: "credit",
      kind: "cross_network",
      method: toNetwork,
      counterparty: to,
      note: `Quick transfer ${from} → ${to}`,
      status: "pending",
      rail: collect.provider,
      railRef: collect.reference,
      meta: {
        from,
        to,
        fromNetwork,
        toNetwork,
        stage: "collecting",
      },
    });

    if (collect.status === "success") {
      const done = await progressQuickTransfer(collect.reference);
      return NextResponse.json({
        ok: true,
        status: done.status,
        stage: done.stage,
        transactionId: collect.reference,
        fee,
        payAmount: amount + fee,
        message: done.message,
      });
    }

    return NextResponse.json({
      ok: true,
      status: "pending",
      stage: "collecting",
      transactionId: collect.reference,
      fee,
      payAmount: amount + fee,
    });
  } catch (error) {
    return NextResponse.json({ error: publicPaymentError(error) }, { status: 500 });
  }
}
