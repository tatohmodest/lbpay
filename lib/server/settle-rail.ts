export type SettleKind = "deposit" | "receive" | "collection" | string;
export type SettleStatus = "success" | "failed" | "cancelled" | "pending";

export type SettleTx = {
  status: SettleStatus;
  kind: SettleKind;
  amount: number;
  fee?: number;
  meta?: {
    creditApplied?: boolean;
    refundApplied?: boolean;
    linkSlug?: string;
    [key: string]: unknown;
  };
};

export type SettleWallet = { balance: number };

export function isCreditKind(kind: string) {
  return kind === "deposit" || kind === "receive" || kind === "collection";
}

export function isTerminalStatus(status: string) {
  return status === "success" || status === "failed" || status === "cancelled";
}

/**
 * Apply a rail settlement once. Safe to call again with the same tx/wallet.
 * Credits only move from pending → success. Debits are taken when the row is created;
 * a later failure refunds once.
 */
export function applyRailSettlement(tx: SettleTx, wallet: SettleWallet, status: SettleStatus) {
  if (status === "pending") {
    return { credited: false, refunded: false, noop: true as const };
  }
  if (isTerminalStatus(tx.status)) {
    return { credited: false, refunded: false, noop: true as const };
  }

  const credit = isCreditKind(tx.kind);

  if (status === "success") {
    if (credit) {
      if (tx.meta?.creditApplied) {
        tx.status = "success";
        return { credited: false, refunded: false, noop: true as const };
      }
      wallet.balance += tx.amount;
      tx.meta = { ...tx.meta, creditApplied: true };
    }
    tx.status = "success";
    return { credited: credit, refunded: false, noop: false as const };
  }

  if (!credit && tx.status === "pending") {
    if (!tx.meta?.refundApplied) {
      wallet.balance += tx.amount + (tx.fee || 0);
      tx.meta = { ...tx.meta, refundApplied: true };
      tx.status = status === "cancelled" ? "cancelled" : "failed";
      return { credited: false, refunded: true, noop: false as const };
    }
  }

  tx.status = status === "cancelled" ? "cancelled" : "failed";
  return { credited: false, refunded: false, noop: false as const };
}
