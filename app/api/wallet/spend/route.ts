import { NextResponse } from "next/server";
import { findUserById, getWallet, recordLedgerMove } from "@/lib/server/db";
import { readSession } from "@/lib/server/session";
import { verifySecret } from "@/lib/server/crypto";
import type { TransactionKind } from "@/lib/types";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
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

  const user = await findUserById(session.userId);
  if (!user?.pinHash) return NextResponse.json({ error: "PIN required." }, { status: 400 });
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
