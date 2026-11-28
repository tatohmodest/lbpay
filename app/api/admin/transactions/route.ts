import { NextResponse } from "next/server";
import { adminSnapshot, deleteTx, findTxById, getWallet, patchTx, recordLedgerMove, reverseTransaction, settleRailTx, writeAudit } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/guard";
import { dispatchWebhooksForTx } from "@/lib/server/webhooks";

export async function GET() {
  const auth = await requireAdmin("finance");
  if (auth.error || !auth.user) return auth.error!;
  const snap = await adminSnapshot();
  const transactions = snap.transactions;
  const users = snap.users;
  const byId = new Map(users.map((user) => [user.id, user] as const));
  const rows = transactions.map((tx) => ({
    ...tx,
    user: byId.get(tx.userId)
      ? { name: byId.get(tx.userId)!.name, lbpayId: byId.get(tx.userId)!.lbpayId }
      : null,
    counterpartyUser: tx.counterpartyId && byId.get(tx.counterpartyId)
      ? { name: byId.get(tx.counterpartyId)!.name, lbpayId: byId.get(tx.counterpartyId)!.lbpayId }
      : null,
  }));
  return NextResponse.json({ transactions: rows });
}

export async function POST(request: Request) {
  const auth = await requireAdmin("finance");
  if (auth.error || !auth.user) return auth.error!;
  const body = await request.json().catch(() => ({}));
  const tx = await findTxById(String(body.id || ""));
  if (!tx) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });

  if (body.action === "resend_webhook") {
    if (tx.status === "pending") {
      return NextResponse.json({ error: "Settle this transaction before sending a webhook." }, { status: 409 });
    }
    const dispatched = await dispatchWebhooksForTx(tx, { force: true });
    if (!dispatched.eventType) {
      return NextResponse.json({ error: "This transaction kind does not emit developer webhooks." }, { status: 400 });
    }
    if (!dispatched.matched) {
      return NextResponse.json({ error: "Merchant has no active webhook subscribed to this event." }, { status: 400 });
    }
    await writeAudit({
      actorId: auth.user.id,
      action: "tx.webhook.resend",
      targetType: "transaction",
      targetId: tx.id,
      note: String(body.reason || "Admin webhook replay").trim(),
      meta: { event: dispatched.eventType, matched: dispatched.matched, delivered: dispatched.sent },
    });
    return NextResponse.json({
      ok: dispatched.sent > 0,
      tx,
      event: dispatched.eventType,
      matched: dispatched.matched,
      delivered: dispatched.sent,
      deliveries: dispatched.deliveries,
    });
  }

  const reason = String(body.reason || "").trim();
  if (!reason) return NextResponse.json({ error: "A reason is required for every fix." }, { status: 400 });

  if (body.action === "status") {
    const status = body.status;
    if (!["success", "failed", "pending", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    // Pending collections/deposits/withdrawals/payouts settle through the ledger and trigger webhooks.
    if (
      tx.status === "pending" &&
      (tx.kind === "withdraw" || tx.kind === "payout" || tx.kind === "collection" || tx.kind === "deposit") &&
      (status === "success" || status === "failed" || status === "cancelled")
    ) {
      await settleRailTx(tx.railRef || tx.id, status);
      await patchTx(tx.id, { note: `${tx.note || ""} · admin: ${reason}` });
      await writeAudit({
        actorId: auth.user.id,
        action: "tx.status",
        targetType: "transaction",
        targetId: tx.id,
        note: reason,
        meta: { status },
      });
      return NextResponse.json({ ok: true, tx: await findTxById(tx.id), wallet: await getWallet(tx.userId) });
    }
    const refundAbroad =
      tx.kind === "international" &&
      tx.status === "pending" &&
      (status === "failed" || status === "cancelled") &&
      !tx.meta?.refunded;
    await patchTx(tx.id, {
      status,
      note: `${tx.note || ""} · admin: ${reason}`,
      meta: { ...tx.meta, stage: status === "success" ? "done" : tx.meta?.stage, ...(refundAbroad ? { refunded: true } : {}) },
    });
    if (refundAbroad) {
      await recordLedgerMove({
        userId: tx.userId,
        amount: tx.amount + (tx.fee || 0),
        direction: "credit",
        kind: "reversal",
        method: "wallet",
        counterparty: tx.counterparty,
        note: `Transfer abroad ${tx.id} not delivered · refunded`,
        status: "success",
        rail: "internal",
        meta: { from: tx.id, refunded: true },
      });
    }
    await writeAudit({
      actorId: auth.user.id,
      action: "tx.status",
      targetType: "transaction",
      targetId: tx.id,
      note: reason,
      meta: { status },
    });
  } else if (body.action === "reverse") {
    try {
      await reverseTransaction(tx.id, reason);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reverse transaction.";
      return NextResponse.json({ error: message }, { status: 409 });
    }
    await writeAudit({
      actorId: auth.user.id,
      action: "tx.reverse",
      targetType: "transaction",
      targetId: tx.id,
      note: reason,
    });
  } else if (body.action === "delete") {
    if (tx.status === "pending") {
      return NextResponse.json({ error: "Settle this transaction before deleting it." }, { status: 409 });
    }
    try {
      const deleted = await deleteTx(tx.id);
      if (!deleted) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete the transaction.";
      return NextResponse.json({ error: message }, { status: 409 });
    }
    await writeAudit({
      actorId: auth.user.id,
      action: "tx.delete",
      targetType: "transaction",
      targetId: tx.id,
      note: reason,
      meta: { userId: tx.userId, kind: tx.kind, amount: tx.amount, status: tx.status },
    });
    return NextResponse.json({ ok: true, deletedId: tx.id, walletUnchanged: true });
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tx: await findTxById(tx.id), wallet: await getWallet(tx.userId) });
}
