import { NextResponse } from "next/server";
import { findUserById, getWallet, listUsers, publicUser, recordLedgerMove, writeAudit } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/guard";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  const users = await listUsers();
  const wallets = [];
  for (const user of users) {
    const wallet = await getWallet(user.id);
    wallets.push({ user: publicUser(user), balance: wallet.balance });
  }
  return NextResponse.json({ wallets });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const user = await findUserById(String(body.userId || ""));
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  const amount = Number(body.amount);
  const direction = body.direction === "debit" ? "debit" : "credit";
  const reason = String(body.reason || "").trim();
  if (!amount || amount < 1) return NextResponse.json({ error: "Enter an amount." }, { status: 400 });
  if (!reason) return NextResponse.json({ error: "A reason is required." }, { status: 400 });

  const moved = await recordLedgerMove({
    userId: user.id,
    amount,
    direction,
    kind: "adjustment",
    method: "wallet",
    counterparty: "LBPay admin",
    note: reason,
    status: "success",
    rail: "internal",
  });
  await writeAudit({
    actorId: auth.user.id,
    action: "wallet.adjust",
    targetType: "user",
    targetId: user.id,
    note: reason,
    meta: { amount, direction },
  });
  return NextResponse.json({ ok: true, balance: moved.balance, transaction: moved.tx });
}
