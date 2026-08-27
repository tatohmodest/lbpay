import { findTxByRailRef, patchTx, recordLedgerMove } from "@/lib/server/db";
import { getPaymentRail } from "@/lib/providers";
import { payunitReference } from "@/lib/server/crypto";
import { publicPaymentError } from "@/lib/public-error";

function collectNeedsCheck(meta: { stage?: string; payoutRef?: string }) {
  return meta.stage !== "paying" && !meta.payoutRef;
}

const inflight = new Map<string, Promise<QuickProgress>>();

export type QuickProgress = {
  status: "pending" | "success" | "failed";
  stage: "collecting" | "paying" | "done";
  message?: string;
  transactionId: string;
};

export async function progressQuickTransfer(collectRef: string): Promise<QuickProgress> {
  const existing = inflight.get(collectRef);
  if (existing) return existing;
  const run = progressQuickTransferInner(collectRef).finally(() => inflight.delete(collectRef));
  inflight.set(collectRef, run);
  return run;
}

async function progressQuickTransferInner(collectRef: string): Promise<QuickProgress> {
  const tx = await findTxByRailRef(collectRef);
  if (!tx || tx.kind !== "cross_network") {
    return {
      status: "failed",
      stage: "done",
      transactionId: collectRef,
      message: "This transfer could not be found.",
    };
  }
  if (tx.status === "success") {
    return { status: "success", stage: "done", transactionId: collectRef };
  }
  if (tx.status === "failed" || tx.status === "cancelled") {
    return {
      status: "failed",
      stage: "done",
      transactionId: collectRef,
      message: "Your transaction could not be completed. No money has been deducted. Please try again.",
    };
  }

  const meta = tx.meta || {};
  const rail = getPaymentRail();
  const to = meta.to;
  const toNetwork = meta.toNetwork === "orange" ? "orange" : "mtn";

  if (collectNeedsCheck(meta)) {
    const collect = rail.getStatus
      ? await rail.getStatus(collectRef)
      : { status: "pending" as const, reference: collectRef, message: undefined };

    if (collect.status === "pending") {
      return { status: "pending", stage: "collecting", transactionId: collectRef };
    }
    if (collect.status === "failed") {
      await patchTx(tx.id, { status: "failed" });
      return {
        status: "failed",
        stage: "done",
        transactionId: collectRef,
        message:
          collect.message ||
          "Your transaction could not be completed. No money has been deducted. Please try again.",
      };
    }
  }

  if (!to) {
    await patchTx(tx.id, { status: "failed" });
    return {
      status: "failed",
      stage: "done",
      transactionId: collectRef,
      message: "Something went wrong. Please try again in a few minutes.",
    };
  }

  const payoutRef = meta.payoutRef || payunitReference("QT");
  if (!meta.payoutRef) {
    await patchTx(tx.id, { meta: { ...meta, stage: "paying", payoutRef } });
  }

  try {
    const payout = await rail.disburse({
      amount: tx.amount,
      currency: "XAF",
      network: toNetwork,
      phone: to,
      reference: payoutRef,
      beneficiaryName: "LBPay transfer",
      note: `Quick transfer to ${to}`,
    });
    if (payout.status === "failed") {
      await recordLedgerMove({
        userId: tx.userId,
        amount: tx.amount,
        direction: "credit",
        kind: "adjustment",
        method: "wallet",
        counterparty: to,
        note: "Quick transfer payout failed. Amount returned to your wallet.",
        status: "success",
        rail: "internal",
      });
      await patchTx(tx.id, {
        status: "failed",
        meta: { ...meta, stage: "done", payoutRef },
        note: `${tx.note || "Quick transfer"} · payout failed, returned to wallet`,
      });
      return {
        status: "failed",
        stage: "done",
        transactionId: collectRef,
        message:
          "The transfer could not be paid out. The amount has been returned to your LBPay wallet.",
      };
    }
    await patchTx(tx.id, {
      status: "success",
      meta: { ...meta, stage: "done", payoutRef },
    });
    return { status: "success", stage: "done", transactionId: collectRef };
  } catch (error) {
    return {
      status: "pending",
      stage: "paying",
      transactionId: collectRef,
      message: publicPaymentError(error),
    };
  }
}
