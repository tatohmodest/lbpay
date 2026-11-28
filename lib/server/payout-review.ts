import { findTxById, findUserById, listTx, patchTx, settleRailTx, writeAudit } from "@/lib/server/db";
import { withLedgerLock } from "@/lib/server/ledger-lock";
import { getPaymentRail } from "@/lib/providers";

/**
 * Payouts LBPay holds for a person before they reach the gateway. Each one PayUnit
 * sees triggers its own approval code, so a stranger hammering "withdraw" used to
 * spam those codes; now only payouts an admin approved get that far.
 */
export const PAYOUT_REVIEW = {
  /** Amount (with fee) from which a person checks the payout first. */
  above: Number(process.env.PAYOUT_REVIEW_ABOVE || 50_000),
  /** Accounts younger than this are reviewed on every payout. */
  newAccountMs: 24 * 60 * 60 * 1000,
  /** More payouts than this in an hour are reviewed. */
  perHour: 3,
} as const;

const OUT_KINDS = new Set(["withdraw", "payout"]);

/** Why a payout must be reviewed, or null when it can go straight out. */
export async function payoutReviewReason(userId: string, total: number, txId?: string): Promise<string | null> {
  if (total >= PAYOUT_REVIEW.above) return `Amount ${total.toLocaleString("en-US")} XAF is over the review limit`;
  const user = await findUserById(userId);
  if (!user) return "Unknown account";
  if (Date.now() - +new Date(user.createdAt) < PAYOUT_REVIEW.newAccountMs) return "Account is less than 24 hours old";
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const recent = (await listTx(userId)).filter(
    (tx) => tx.id !== txId && OUT_KINDS.has(tx.kind) && tx.status !== "failed" && +new Date(tx.createdAt) > hourAgo,
  );
  if (recent.length >= PAYOUT_REVIEW.perHour) return `${recent.length + 1} payouts in the last hour`;
  return null;
}

/** Admin approves a held payout: claimed once under the lock, then sent to the gateway. */
export async function approveHeldPayout(txId: string, adminId: string) {
  const claimed = await withLedgerLock(async () => {
    const tx = await findTxById(txId);
    if (!tx || tx.status !== "pending" || !tx.meta?.heldForReview) return null;
    await patchTx(tx.id, {
      meta: { ...tx.meta, heldForReview: false, reviewedBy: adminId, reviewedAt: new Date().toISOString() },
    });
    return tx;
  });
  if (!claimed) return { ok: false as const, error: "This payout is not waiting for review." };
  await writeAudit({ actorId: adminId, action: "payout.approve", targetType: "transaction", targetId: txId, note: claimed.meta?.reviewReason });
  const { sendReservedPayout } = await import("@/lib/server/payout-flow");
  const user = await findUserById(claimed.userId);
  const result = await sendReservedPayout({
    rail: getPaymentRail(),
    txId: claimed.id,
    reference: claimed.meta?.payoutRef || claimed.railRef || claimed.id,
    reservedTx: claimed,
    balance: 0,
    beneficiaryName: claimed.meta?.beneficiaryName || user?.name || "LBPay user",
    amount: claimed.amount,
    network: claimed.method === "orange" ? "orange" : "mtn",
    phone: claimed.counterparty,
    note: claimed.kind === "payout" ? "API disbursement" : "Wallet withdrawal",
  });
  return result.outcome === "failed"
    ? { ok: true as const, status: "failed" as const, message: result.message }
    : { ok: true as const, status: result.status };
}

/** Admin rejects a held payout: the amount and fee go back to the wallet. */
export async function rejectHeldPayout(txId: string, adminId: string, note?: string) {
  const tx = await withLedgerLock(async () => {
    const current = await findTxById(txId);
    if (!current || current.status !== "pending" || !current.meta?.heldForReview) return null;
    await patchTx(current.id, {
      meta: { ...current.meta, heldForReview: false, reviewedBy: adminId, reviewedAt: new Date().toISOString() },
    });
    return current;
  });
  if (!tx) return { ok: false as const, error: "This payout is not waiting for review." };
  await settleRailTx(tx.meta?.payoutRef || tx.railRef || tx.id, "failed");
  await writeAudit({ actorId: adminId, action: "payout.reject", targetType: "transaction", targetId: txId, note: note || tx.meta?.reviewReason });
  return { ok: true as const, status: "failed" as const };
}
