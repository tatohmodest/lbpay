import type { StoredTx } from "@/lib/server/db";

/** Rows where money leaves LBPay through the gateway. Everything else on the gateway is a collection. */
export const PAYOUT_KINDS = new Set<string>(["withdraw", "payout", "international", "send"]);

/**
 * Which gateway API can say how this row ended. Asking the wrong one (a deposit
 * check for a payout ref) gets "not found", which must never settle the row:
 * that would refund a payout the network still delivers.
 */
export function railKindOf(tx: Pick<StoredTx, "kind">): "collect" | "disburse" | null {
  if (tx.kind === "cross_network") return null;
  return PAYOUT_KINDS.has(tx.kind) ? "disburse" : "collect";
}
