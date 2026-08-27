import { NextResponse } from "next/server";
import { recordLedgerMove } from "@/lib/server/db";
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
    const method = body.method === "orange" ? "orange" : body.method === "card" ? "card" : "mtn";
    const phone = String(body.phone || "").replace(/\s+/g, "");
    const pin = String(body.pin || "");

    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Minimum deposit is 100 XAF." }, { status: 400 });
    }
    if (method !== "card" && !/^6\d{8}$/.test(phone) && !/^2376\d{8}$/.test(phone)) {
      return NextResponse.json({ error: "Enter the Mobile Money number that will pay." }, { status: 400 });
    }

    if (!user.pinHash) return NextResponse.json({ error: "PIN required." }, { status: 400 });
    if (!(await verifySecret(pin, user.pinHash))) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
    }

    const rail = getPaymentRail();
    const reference = payunitReference("COL");
    const result = await rail.collect({
      amount,
      currency: "XAF",
      method,
      customer: { phone: phone || user.phone, name: user.name, email: user.email },
      reference,
    });

    if (result.status === "failed") {
      return NextResponse.json({ error: "Collection failed on the payment rail.", result }, { status: 502 });
    }

    const moved = await recordLedgerMove({
      userId: user.id,
      amount,
      direction: "credit",
      kind: "deposit",
      method,
      counterparty: method === "mtn" ? "MTN Mobile Money" : method === "orange" ? "Orange Money" : "Card",
      note: "Wallet deposit",
      status: result.status === "success" ? "success" : "pending",
      rail: result.provider,
      railRef: result.reference,
    });

    return NextResponse.json({
      ok: true,
      rail: result.provider,
      status: result.status,
      hostedUrl: result.hostedUrl,
      balance: moved.balance,
      transaction: moved.tx,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deposit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
