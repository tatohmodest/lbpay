import { listAllTx, settleRailTx, type StoredTx } from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import { progressQuickTransfer } from "@/lib/server/quick";

const PAYOUT_KINDS = new Set(["withdraw", "payout", "international"]);
const MIN_AGE_MS = 45_000;
const STUCK_MS = 30 * 60_000;
/** Page loads call this constantly; ask the gateway about one payout at most every 30 s. */
const RECHECK_MS = 30_000;
const lastAsked = new Map<string, number>();

export type StuckPayout = Pick<StoredTx, "id" | "userId" | "kind" | "amount" | "fee" | "counterparty" | "railRef" | "createdAt">;

/**
 * Settle pending payouts by asking the gateway, so the ledger is right even when
 * the customer closed the app or the original request died half-way.
 * Never refunds on a guess: "failed" only comes from the gateway's own lookup.
 */
export async function reconcilePayouts(opts: { userId?: string; limit?: number } = {}) {
  const now = Date.now();
  const pending = (await listAllTx()).filter(
    (t) =>
      t.status === "pending" &&
      (PAYOUT_KINDS.has(t.kind) || t.kind === "cross_network") &&
      (!opts.userId || t.userId === opts.userId) &&
      now - +new Date(t.createdAt) >= MIN_AGE_MS &&
      now - (lastAsked.get(t.id) || 0) >= RECHECK_MS,
  );
  const batch = pending.slice(0, opts.limit ?? 20);
  let settled = 0;
  let rail: ReturnType<typeof getPaymentRail> | null = null;
  try {
    rail = getPaymentRail();
  } catch {
    return { checked: 0, settled: 0 };
  }

  for (const tx of batch) lastAsked.set(tx.id, now);
  // Ask about every payout at once; one slow answer no longer delays the rest.
  await Promise.all(batch.map(async (tx) => {
    const ref = tx.railRef || tx.meta?.payoutRef || tx.id;
    try {
      if (tx.kind === "cross_network") {
        const r = await progressQuickTransfer(ref);
        if (r.status !== "pending") settled += 1;
        return;
      }
      if (!rail?.getStatus) return;
      const status = await rail.getStatus(ref, { kind: "disburse", payToken: tx.meta?.payToken });
      if (status.status === "success" || status.status === "failed") {
        await settleRailTx(ref, status.status);
        settled += 1;
      }
    } catch (error) {
      console.error("[lbpay] reconcile failed for", tx.id, error);
    }
  }));
  return { checked: batch.length, settled };
}

/** Payouts still pending after 30 minutes: a person should look at these. */
export async function stuckPayouts(): Promise<StuckPayout[]> {
  const now = Date.now();
  return (await listAllTx())
    .filter((t) => t.status === "pending" && PAYOUT_KINDS.has(t.kind) && now - +new Date(t.createdAt) > STUCK_MS)
    .slice(0, 50)
    .map(({ id, userId, kind, amount, fee, counterparty, railRef, createdAt }) => ({ id, userId, kind, amount, fee, counterparty, railRef, createdAt }));
}

/** Don't let a slow gateway hold a page load hostage. */
export async function reconcileQuickly(opts: { userId?: string; limit?: number }, ms = 4000) {
  return Promise.race([
    reconcilePayouts(opts).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}
