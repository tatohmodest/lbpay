import { findTxById, patchTx, recordLedgerMove, settleRailTx, type StoredTx } from "@/lib/server/db";
import { payunitReference } from "@/lib/server/crypto";
import type { PaymentRail, RailResult } from "@/lib/providers/types";
import { payoutReviewReason } from "@/lib/server/payout-review";
import { alertPayoutReview } from "@/lib/server/ops-alerts";

/**
 * The one safe way to send money out of LBPay:
 * 1. take it from the wallet first (pending), under the ledger lock;
 * 2. ask the gateway to pay, saving its id the moment the payout exists;
 * 3. settle: success stays debited, a gateway-confirmed failure is refunded,
 *    anything unclear stays pending until the reconciler checks the gateway.
 * If the request dies at any point, the wallet already reflects the payout.
 */
export async function runPayout(input: {
  rail: PaymentRail;
  userId: string;
  beneficiaryName: string;
  amount: number;
  fee: number;
  network: "mtn" | "orange";
  phone: string;
  kind: "withdraw" | "payout";
  note: string;
  label: string;
  prefix: string;
}): Promise<
  | { outcome: "insufficient" }
  | { outcome: "failed"; message?: string }
  | { outcome: "ok"; status: "success" | "pending"; tx: StoredTx; balance: number; transactionId: string; provider: RailResult["provider"] }
> {
  const reference = payunitReference(input.prefix);
  let reserved;
  try {
    reserved = await recordLedgerMove({
      userId: input.userId,
      amount: input.amount,
      fee: input.fee,
      direction: "debit",
      kind: input.kind,
      method: input.network,
      counterparty: input.phone,
      note: input.label,
      status: "pending",
      rail: "payunit",
      railRef: reference,
      meta: { payoutRef: reference },
    });
  } catch (error) {
    if (/insufficient wallet balance/i.test(error instanceof Error ? error.message : "")) {
      return { outcome: "insufficient" };
    }
    throw error;
  }
  const txId = reserved.tx.id;

  // Risky payouts wait for a person in LBPay admin; nothing is sent to the gateway yet.
  const reason = await payoutReviewReason(input.userId, input.amount + input.fee, txId);
  if (reason) {
    await patchTx(txId, {
      meta: { ...(reserved.tx.meta || {}), payoutRef: reference, heldForReview: true, reviewReason: reason, beneficiaryName: input.beneficiaryName },
    });
    await alertPayoutReview({ txId, amount: input.amount, phone: input.phone, reason }).catch(() => undefined);
    const tx = (await findTxById(txId)) ?? reserved.tx;
    return { outcome: "ok", status: "pending", tx, balance: reserved.balance, transactionId: reference, provider: "payunit" };
  }

  return sendReservedPayout({ ...input, txId, reference, reservedTx: reserved.tx, balance: reserved.balance });
}

/**
 * Asks the gateway to pay a payout already taken from the wallet. Used right
 * away for ordinary payouts, and by admin when a held payout is approved.
 */
export async function sendReservedPayout(input: {
  rail: PaymentRail;
  txId: string;
  reference: string;
  reservedTx: StoredTx;
  balance: number;
  beneficiaryName: string;
  amount: number;
  network: "mtn" | "orange";
  phone: string;
  note: string;
}): Promise<
  | { outcome: "failed"; message?: string }
  | { outcome: "ok"; status: "success" | "pending"; tx: StoredTx; balance: number; transactionId: string; provider: RailResult["provider"] }
> {
  const { txId, reference } = input;
  const reserved = { tx: input.reservedTx, balance: input.balance };

  let result: RailResult;
  try {
    result = await input.rail.disburse({
      amount: input.amount,
      currency: "XAF",
      network: input.network,
      phone: input.phone,
      reference,
      beneficiaryName: input.beneficiaryName,
      note: input.note,
      onCreated: async (payToken) => {
        const tx = await findTxById(txId);
        await patchTx(txId, { meta: { ...(tx?.meta || {}), payoutRef: reference, payToken } });
      },
    });
  } catch (error) {
    console.error("[lbpay] payout threw after reserving; left pending for the reconciler", reference, error);
    return { outcome: "ok", status: "pending", tx: reserved.tx, balance: reserved.balance, transactionId: reference, provider: "payunit" };
  }

  if (result.status === "failed") {
    await settleRailTx(reference, "failed");
    return { outcome: "failed", message: result.message };
  }

  const current = await findTxById(txId);
  const railRef = result.reference || reference;
  await patchTx(txId, {
    rail: result.provider,
    railRef,
    meta: {
      ...(current?.meta || {}),
      payoutRef: reference,
      ...(result.providerRef ? { payToken: result.providerRef } : {}),
      ...(result.awaitingApproval ? { awaitingApproval: true } : {}),
    },
  });
  let balance = reserved.balance;
  if (result.status === "success") {
    const settled = await settleRailTx(railRef, "success");
    if ("balance" in settled && typeof settled.balance === "number") balance = settled.balance;
  }
  const tx = (await findTxById(txId)) ?? reserved.tx;
  return { outcome: "ok", status: result.status === "success" ? "success" : "pending", tx, balance, transactionId: railRef, provider: result.provider };
}
