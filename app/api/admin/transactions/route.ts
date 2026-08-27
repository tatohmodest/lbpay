import { NextResponse } from "next/server";
import { findTxById, findUserById, getWallet, listAllTx, patchTx, recordLedgerMove, writeAudit } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/guard";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  const transactions = await listAllTx();
  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const tx = await findTxById(String(body.id || ""));
  if (!tx) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  const reason = String(body.reason || "").trim();
  if (!reason) return NextResponse.json({ error: "A reason is required for every fix." }, { status: 400 });

  if (body.action === "status") {
    const status = body.status;
    if (!["success", "failed", "pending", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    await patchTx(tx.id, { status, note: `${tx.note || ""} · admin: ${reason}` });
    await writeAudit({
      actorId: auth.user.id,
      action: "tx.status",
      targetType: "transaction",
      targetId: tx.id,
      note: reason,
      meta: { status },
    });
  } else if (body.action === "reverse") {
    const user = await findUserById(tx.userId);
    if (!user) return NextResponse.json({ error: "Wallet owner missing." }, { status: 404 });
    const isOut = ["send", "withdraw", "airtime", "bill", "cross_network", "payout"].includes(tx.kind);
    await recordLedgerMove({
      userId: user.id,
      amount: tx.amount,
      direction: isOut ? "credit" : "debit",
      kind: "reversal",
      method: tx.method,
      counterparty: tx.counterparty,
      note: `Reversal of ${tx.id}: ${reason}`,
      status: "success",
      rail: "internal",
    });
    await patchTx(tx.id, { status: "cancelled", note: `${tx.note || ""} · reversed: ${reason}` });
    if (tx.counterpartyId) {
      await recordLedgerMove({
        userId: tx.counterpartyId,
        amount: tx.amount,
        direction: isOut ? "debit" : "credit",
        kind: "reversal",
        method: "wallet",
        counterparty: `@${user.lbpayId}`,
        note: `Counterparty reversal of ${tx.id}`,
        status: "success",
        rail: "internal",
      }).catch(() => null);
    }
    await writeAudit({
      actorId: auth.user.id,
      action: "tx.reverse",
      targetType: "transaction",
      targetId: tx.id,
      note: reason,
    });
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tx: await findTxById(tx.id), wallet: await getWallet(tx.userId) });
}
