export type LedgerDirection = "credit" | "debit";

export type LedgerEntry = {
  walletId: string;
  direction: LedgerDirection;
  amount: number;
  type: string;
  transactionId: string;
};

/**
 * Internal double-entry helpers. LBPay → LBPay transfers never
 * need to leave this ledger. External rails are only used when
 * money enters or exits the platform.
 */
export function internalTransfer(params: {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  transactionId: string;
}): LedgerEntry[] {
  return [
    {
      walletId: params.fromWalletId,
      direction: "debit",
      amount: params.amount,
      type: "transfer_out",
      transactionId: params.transactionId,
    },
    {
      walletId: params.toWalletId,
      direction: "credit",
      amount: params.amount,
      type: "transfer_in",
      transactionId: params.transactionId,
    },
  ];
}

export function marketplaceSplit(params: {
  sourceWalletId: string;
  transactionId: string;
  legs: { walletId: string; amount: number; role: string }[];
}): LedgerEntry[] {
  const total = params.legs.reduce((sum, leg) => sum + leg.amount, 0);
  return [
    {
      walletId: params.sourceWalletId,
      direction: "debit",
      amount: total,
      type: "marketplace_capture",
      transactionId: params.transactionId,
    },
    ...params.legs.map((leg) => ({
      walletId: leg.walletId,
      direction: "credit" as const,
      amount: leg.amount,
      type: `split_${leg.role}`,
      transactionId: params.transactionId,
    })),
  ];
}
