import { NextResponse } from "next/server";
import { getWallet, recordLedgerMove } from "@/lib/server/db";
import { payunitReference, verifySecret } from "@/lib/server/crypto";
import { getPaymentRail } from "@/lib/providers";
import { requireActiveUser } from "@/lib/server/guard";

export async function POST(request: Request) {
  try {
    const auth = await requireActiveUser();
    if (auth.error || !auth.user) return auth.error!;
    const user = auth.user;
    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);
    const phone = String(body.phone || "").replace(/\s+/g, "");
    const network = body.network === "orange" ? "orange" : "mtn";
    const pin = String(body.pin || "");
    const note = String(body.note || "Wallet withdrawal");

    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Minimum disbursement is 100 XAF." }, { status: 400 });
    }
    if (!/^6\d{8}$/.test(phone) && !/^2376\d{8}$/.test(phone)) {
      return NextResponse.json({ error: "Enter a valid Cameroon mobile number." }, { status: 400 });
    }

    if (!user.pinHash) return NextResponse.json({ error: "PIN required." }, { status: 400 });
    if (!(await verifySecret(pin, user.pinHash))) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }

    const wallet = await getWallet(user.id);
    if (wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
    }

    const rail = getPaymentRail();
    const reference = payunitReference("DISB");
    const result = await rail.disburse({
      amount,
      currency: "XAF",
      network,
      phone,
      reference,
      beneficiaryName: user.name,
      note,
    });

    if (result.status === "failed") {
      return NextResponse.json(
        { error: result.message || "Disbursement failed on the payment rail." },
        { status: 502 },
      );
    }

    const moved = await recordLedgerMove({
      userId: user.id,
      amount,
      direction: "debit",
      kind: "withdraw",
      method: network,
      counterparty: phone,
      note: `Disbursement to ${network.toUpperCase()}`,
      status: result.status,
      rail: result.provider,
      railRef: result.reference,
    });
    return NextResponse.json({
      ok: true,
      rail: result.provider,
      status: result.status,
      balance: moved.balance,
      transaction: moved.tx,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Disbursement failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
