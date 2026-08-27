import { NextResponse } from "next/server";
import { getWallet, recordLedgerMove } from "@/lib/server/db";
import { verifySecret } from "@/lib/server/crypto";
import type { TransactionKind } from "@/lib/types";
import { requireActiveUser } from "@/lib/server/guard";

export async function POST(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const user = auth.user;
  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount);
  const pin = String(body.pin || "");
  const kind: TransactionKind = body.kind === "bill" ? "bill" : "airtime";
  const counterparty = String(body.counterparty || "").trim();
  const note = String(body.note || (kind === "bill" ? "Bill payment" : "Airtime purchase"));

  if (!amount || amount < 100) {
    return NextResponse.json({ error: "Minimum amount is 100 XAF." }, { status: 400 });
  }
  if (!counterparty) {
    return NextResponse.json({ error: "Recipient is required." }, { status: 400 });
  }

  if (!user.pinHash) return NextResponse.json({ error: "PIN required." }, { status: 400 });
  if (!(await verifySecret(pin, user.pinHash))) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const wallet = await getWallet(user.id);
  if (wallet.balance < amount) {
    return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
  }

  try {
    const moved = await recordLedgerMove({
      userId: user.id,
      amount,
      fee: 0,
      direction: "debit",
      kind,
      method: "wallet",
      counterparty,
      note,
      status: "success",
      rail: "internal",
    });
    return NextResponse.json({ ok: true, balance: moved.balance, transaction: moved.tx });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
