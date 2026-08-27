import { NextResponse } from "next/server";
import { findUserByHandle, recordTransfer } from "@/lib/server/db";
import { verifySecret } from "@/lib/server/crypto";
import { requireActiveUser } from "@/lib/server/guard";

export async function POST(request: Request) {
  const auth = await requireActiveUser();
  if (auth.error || !auth.user) return auth.error!;
  const sender = auth.user;
  const body = await request.json().catch(() => ({}));
  const amount = Number(body.amount);
  const to = String(body.to || "");
  const pin = String(body.pin || "");
  const note = String(body.note || "");

  if (!amount || amount < 100) {
    return NextResponse.json({ error: "Minimum transfer is 100 XAF." }, { status: 400 });
  }

  if (!sender.pinHash) return NextResponse.json({ error: "PIN required." }, { status: 400 });
  if (!(await verifySecret(pin, sender.pinHash))) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const recipient = await findUserByHandle(to);
  if (!recipient) {
    return NextResponse.json({ error: "No LBPay user with that ID." }, { status: 404 });
  }
  if (recipient.id === sender.id) {
    return NextResponse.json({ error: "You cannot transfer to yourself." }, { status: 400 });
  }

  try {
    const result = await recordTransfer({ from: sender, to: recipient, amount, note });
    return NextResponse.json({
      ok: true,
      rail: "internal",
      balance: result.sourceBalance,
      transaction: result.outgoing,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
